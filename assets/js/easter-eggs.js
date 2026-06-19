/* =====================================================================
   EASTER EGGS — a tiny site-wide registry for hidden things to find.
   Each egg is discovered AT MOST ONCE PER BROWSER (persisted in
   localStorage), and a discovery raises a toast showing the running tally of
   finds. We deliberately NEVER reveal how many eggs exist — no totals, no
   "n / x", no remaining count — so the rest stays a mystery worth chasing.
   The hidden collection page (eggs.html) follows the same rule.

   Anything on the site can announce a find WITHOUT importing this file —
   just dispatch a DOM event:  window.dispatchEvent(new CustomEvent(
   'easteregg', { detail: { id: 'comet' } }))  — or call the API directly:
   window.EasterEggs.discover('comet').

   To add a new egg: append it to EGGS below, then have its trigger fire the
   event/discover call with the matching id. Adding one quietly deepens the
   hunt — nothing on the site announces that the total changed.
   ===================================================================== */
(function () {
  // The master list of findable eggs. Its length is never displayed (the total
  // stays hidden), so only ever add eggs that can actually be found right now.
  const EGGS = [
    {
      id: 'comet',
      icon: '☄️', svg: '☄',
      label: 'Caught the comet',
      hint: 'Plucked a comet out of deep space as it streaked past.',
      where: 'The descent · leaving orbit',
      note: 'It only streaks across the dark once on the way down. Quick hands catch it.',
      tease: 'Something streaks past the window, high above the clouds.',
      fact: "A comet's tail always points away from the Sun — blown outward by the solar wind — so on its way back out of the solar system, a comet flies tail-first, chasing its own glow.",
    },
    {
      id: 'golden-tortoise',
      icon: '🐢', svg: 'golden-tortoise',
      label: 'Caught the golden tortoise',
      hint: 'Caught the golden tortoise on the shore before the tide took it.',
      where: 'The descent · the beach',
      note: 'The tortoise is the cleverest creature on the page — it watches you as you watch it. An ordinary one pads down the clearing and takes to the sea every visit, but it only ever comes up GOLD on the 30th of October, and even then only now and then. Catch it while it pauses to look at you, before the rising tide carries it off.',
      tease: 'They say the tortoise turns to gold but one day a year.',
      fact: 'Tortoises are among the longest-lived animals on land — several have passed 150 years, outliving by generations the people who first wrote their names down.',
    },
    {
      id: 'relit-campfire',
      icon: '🔥', svg: '🔥',
      label: 'Relit the campfire',
      hint: 'Coaxed the drowned campfire back to life after the tide put it out.',
      where: 'The descent · the beach',
      note: "As you sink past the beach the rising tide reaches the fire and douses it in a hiss of steam — and a doused fire stays dark, even when you scroll back up and the water draws away. Tap the cold, wet pit while it's clear of the sea and it catches again.",
      tease: 'The sea takes the fire. Not everything the sea takes is gone for good.',
      fact: 'A genuine campfire is best put out the same way the tide does it — drown it and stir, then drown it again, until the ashes are cool to the touch. Embers buried in dry ash can smoulder unseen for days and reignite.',
    },
    {
      id: 'seahorse',
      icon: '🐚', svg: 'seahorse',
      label: 'Found the seahorse',
      hint: 'Spotted the rare golden seahorse hiding in the kelp.',
      where: 'The descent · the deep',
      note: 'A rare drift — it only surfaces now and then, far down in the dark water.',
      tease: 'The deep keeps its rarest things well hidden.',
      fact: "It's the male seahorse that gets pregnant: the female lays her eggs in a pouch on his belly, and he carries the brood and gives birth to the young.",
    },
    {
      // LEGACY: the original "any golden fish" find. New catches record the
      // species instead (the goldfish-* eggs below), but this is kept so a
      // browser that caught gold before species tracking keeps its card. It is
      // no longer fired by the site — see catchGoldFish in descent-engine.js.
      id: 'goldfish', legacy: true,
      icon: '🐟', svg: 'goldfish',
      label: 'Caught the golden fish',
      hint: 'Plucked a rare golden specimen out of the passing shoal.',
      where: 'The descent · the shoal',
      note: 'About one fish in a hundred swims in gold — any species, at any depth. A glint of it in the school is luck; quick fingers turn the glint into a catch.',
      tease: 'Now and then something glints gold in the passing shoal.',
      fact: 'A wild fish born gold is a rare genetic fluke (xanthism) — the gold replaces its camouflage, so most are picked off by predators before they grow large. A big golden one in the wild is a genuinely rare sight.',
    },
    /* The golden fish, by species — every kind in the shoal can roll gold (~1%,
       see GOLD_RARITY), and each gold species is its own find, because each one
       really is a different animal. The id is goldfish-<kind>, matching the fish
       kinds in the engine (reef, silver, lantern, viper, angler); catchGoldFish
       fires the matching id when you pluck one out. The deep-water kinds are far
       rarer catches — you have to be sinking through the dark to meet them gold. */
    {
      id: 'goldfish-reef',
      icon: '🐠', svg: 'goldfish-reef',
      label: 'Caught the golden reef fish',
      hint: 'Plucked a gold reef fish out of the sunlit shallows.',
      where: 'The descent · the reef shallows',
      note: 'The reef is already a riot of colour, so a gold one hides in plain sight up here. Catch it before it darts back into the coral glare.',
      tease: 'A flash of gold turns among the bright reef fish.',
      fact: 'Many reef fish are born one sex and switch to the other as they grow — in a cleaner-wrasse harem the fish are all female until the dominant one becomes male, and will switch back if he disappears.',
    },
    {
      id: 'goldfish-silver',
      icon: '🐟', svg: 'goldfish-silver',
      label: 'Caught the golden shoal fish',
      hint: 'Picked a gold one out of the silver midwater shoal.',
      where: 'The descent · the midwater shoal',
      note: 'The shoal moves as one mirror-bright wall through the open water; the gold fish is the one that breaks the spell. A steady eye finds it.',
      tease: 'One fish in the silver shoal catches the light differently.',
      fact: "A shoaling fish's mirror flanks aren't pigment but stacks of tiny crystal plates that reflect the surrounding blue, making it near-invisible in open water. The gold mutant loses that cloak — and stands out to predators too.",
    },
    {
      id: 'goldfish-lantern',
      icon: '🐟', svg: 'goldfish-lantern',
      label: 'Caught the golden lanternfish',
      hint: 'Caught a gold lanternfish in the dark midwater.',
      where: 'The descent · the deep',
      note: 'Down where the light gives out, gold barely glints at all — you have to be sinking past the lanternfish to meet one gone gold.',
      tease: 'Something gold blinks among the little lights in the dark.',
      fact: 'Lanternfish are among the most numerous vertebrates on Earth, and most rise hundreds of metres to feed each night and sink by dawn — a daily vertical migration so vast it shows up on ships’ sonar as a false seafloor.',
    },
    {
      id: 'goldfish-viper',
      icon: '🐟', svg: 'goldfish-viper',
      label: 'Caught the golden viperfish',
      hint: 'Caught a gold viperfish deep in the dark water.',
      where: 'The descent · the deep',
      note: 'A slim, fanged shadow of the trenchward dark — gold and toothy is a rare pairing to pluck from the deep.',
      tease: 'A long gold glimmer slips by, all teeth.',
      fact: "The viperfish's fangs are so long they won't fit inside its mouth — they curve back almost to its eyes — and it dangles a glowing dorsal spine as a lure before snapping prey onto those teeth.",
    },
    {
      id: 'goldfish-angler',
      icon: '🐟', svg: 'goldfish-angler',
      label: 'Caught the golden anglerfish',
      hint: 'Landed a gold anglerfish at the bottom of the descent.',
      where: 'The descent · the trench',
      note: 'The rarest gold of all: an anglerfish only looms this far down, and a gold one looming there is luck stacked on luck. The lure leads you to it.',
      tease: 'A small gold light floats in the trench — attached to something larger.',
      fact: 'In many deep-sea anglerfish the tiny male bites onto the much larger female and fuses to her for life, his body dissolving into hers until he is little more than a permanent supply of sperm.',
    },
    {
      id: 'golden-shrimp',
      icon: '🦐', svg: 'golden-shrimp',
      label: 'Caught the golden shrimp',
      hint: 'Plucked a rare gold shrimp off the hydrothermal trench floor.',
      where: 'The descent · the trench floor',
      note: 'They scuttle and forage along the very bottom, drawn to the warmth of the smoking vents. About one in a hundred crawls in gold — catch it down in the dark before it tail-flicks away.',
      tease: 'Something gold scuttles along the floor of the trench.',
      fact: 'Whole swarms of pale, eyeless shrimp pack the scalding walls of deep-sea hydrothermal vents, farming the bacteria that feed on the vent chemicals — they sense the faint glow of the superheated water with a light-detecting patch on their backs instead of eyes.',
    },
  ];
  const KEY = 'ck:eggs:v1';            // Set of found ids (kept for back-compat)
  const METAKEY = 'ck:eggs:meta:v1';   // { id: ISO timestamp } — when each was found

  function load() {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function save(set) {
    try { localStorage.setItem(KEY, JSON.stringify([...set])); }
    catch (e) { /* private mode / no storage — discovery still toasts, just won't persist */ }
  }
  function loadMeta() {
    try { return JSON.parse(localStorage.getItem(METAKEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveMeta(m) {
    try { localStorage.setItem(METAKEY, JSON.stringify(m)); } catch (e) { /* no storage */ }
  }

  const found = load();
  const meta = loadMeta();
  const byId = (id) => EGGS.find(e => e.id === id);

  // SHOWABLE eggs — the ones that count and appear in the collection. A `legacy`
  // egg (e.g. the old generic 'goldfish', now superseded by the per-species
  // finds) is never displayed or tallied, so a stale badge can't pad the count;
  // unknown ids in storage (a removed egg) are ignored the same way.
  const SHOWN = EGGS.filter(e => !e.legacy);
  const isShown = (id) => { const e = byId(id); return !!e && !e.legacy; };
  function shownCount() { let n = 0; for (const id of found) if (isShown(id)) n++; return n; }

  /* Mark an egg found. Returns true only on a FIRST find (so the caller can
     tell a fresh catch from a re-trigger); unknown/legacy ids and repeats are
     no-ops (a legacy egg can never be freshly found — it only lingers from a
     past version, never toasts or counts). */
  function discover(id) {
    const egg = byId(id);
    if (!egg || egg.legacy || found.has(id)) return false;
    found.add(id);
    meta[id] = new Date().toISOString();
    save(found);
    saveMeta(meta);
    toast(egg, shownCount());
    ensureVaultLink();   // first find reveals the way back to the collection
    return true;
  }

  /* ---------- the discovery toast ---------- */
  let host = null;
  function ensureHost() {
    if (host) return host;
    host = document.createElement('div');
    host.id = 'egg-toast';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    (document.body || document.documentElement).appendChild(host);
    return host;
  }
  // prefer the site's crafted SVG art for the icon (home page) and fall back to an
  // emoji everywhere else, so this module stays self-contained on any page
  function iconHtml(egg) {
    const lib = window.DESCENT_SPRITES;
    const svg = egg.svg && lib && (lib[egg.svg] || lib[egg.svg.replace(/️/g, '')]);
    return svg || egg.icon || '🥚';
  }
  // NOTE: we deliberately never show how many eggs exist — only the running
  // tally of what's been found — so the total stays a mystery worth chasing.
  function toast(egg, n) {
    const h = ensureHost();
    h.innerHTML =
      '<a class="egg-toast-card" href="/eggs.html">' +
        '<div class="egg-toast-icon" aria-hidden="true">' + iconHtml(egg) + '</div>' +
        '<div class="egg-toast-body">' +
          '<div class="egg-toast-eyebrow">Easter egg found · view collection →</div>' +
          '<div class="egg-toast-title">' + egg.label + '</div>' +
          (egg.hint ? '<div class="egg-toast-sub">' + egg.hint + '</div>' : '') +
        '</div>' +
        '<div class="egg-toast-count" aria-label="' + n + ' found so far">' + n + '</div>' +
      '</a>';
    // reflow → animate in; auto-dismiss after a read
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('show')));
    clearTimeout(h._dismiss);
    h._dismiss = setTimeout(() => h.classList.remove('show'), 6200);
  }

  window.EasterEggs = {
    discover,
    has: (id) => found.has(id) && isShown(id),  // only valid (non-legacy) finds count as "had"
    count: shownCount,                          // valid finds only — legacy/unknown ids don't pad it
    total: () => SHOWN.length,
    ids: () => SHOWN.map(e => e.id),
    all: () => SHOWN.map(e => ({ ...e })),  // full metadata for the collection page (shown eggs only)
    foundAt: (id) => meta[id] || null,     // ISO timestamp of the find, or null
  };

  /* ---------- persistent way back to the collection ----------
     Once at least one egg is found, drop a small badge linking to the (now
     unlocked) collection page. Stays hidden until the first find, and is
     suppressed on the collection page itself (which sets window.__EGG_VAULT). */
  function ensureVaultLink() {
    if (window.__EGG_VAULT || shownCount() === 0) return;   // a legacy-only browser has nothing valid to unlock
    const root = document.body || document.documentElement;
    if (!root) return;
    let link = document.getElementById('egg-vault-link');
    if (!link) {
      link = document.createElement('a');
      link.id = 'egg-vault-link';
      link.href = '/eggs.html';
      link.setAttribute('aria-label', 'Open your easter-egg collection');
      link.innerHTML =
        '<span class="evl-egg" aria-hidden="true">🥚</span>' +
        '<span class="evl-text"><span class="evl-label">Collection</span> <b class="evl-count"></b></span>';
      root.appendChild(link);
      requestAnimationFrame(() => requestAnimationFrame(() => link.classList.add('show')));
    }
    const c = link.querySelector('.evl-count');
    if (c) c.textContent = shownCount();   // valid finds only — never the total
  }
  if (document.readyState !== 'loading') ensureVaultLink();
  else document.addEventListener('DOMContentLoaded', ensureVaultLink);

  // decoupled trigger: any component can announce a find by firing this event
  window.addEventListener('easteregg', (e) => {
    if (e && e.detail && e.detail.id) discover(e.detail.id);
  });
})();
