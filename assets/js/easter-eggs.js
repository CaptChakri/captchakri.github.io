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
      id: 'goldfish',
      icon: '🐟', svg: 'goldfish',
      label: 'Caught the golden fish',
      hint: 'Plucked a rare golden specimen out of the passing shoal.',
      where: 'The descent · the shoal',
      note: 'About one fish in a hundred swims in gold — any species, at any depth. A glint of it in the school is luck; quick fingers turn the glint into a catch.',
      tease: 'Now and then something glints gold in the passing shoal.',
      fact: 'A wild fish born gold is a rare genetic fluke (xanthism) — the gold replaces its camouflage, so most are picked off by predators before they grow large. A big golden one in the wild is a genuinely rare sight.',
    },
  ];
  const TOTAL = EGGS.length;
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

  /* Mark an egg found. Returns true only on a FIRST find (so the caller can
     tell a fresh catch from a re-trigger); unknown ids and repeats are no-ops. */
  function discover(id) {
    const egg = byId(id);
    if (!egg || found.has(id)) return false;
    found.add(id);
    meta[id] = new Date().toISOString();
    save(found);
    saveMeta(meta);
    toast(egg, found.size);
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
    has: (id) => found.has(id),
    count: () => found.size,
    total: () => TOTAL,
    ids: () => EGGS.map(e => e.id),
    all: () => EGGS.map(e => ({ ...e })),  // full metadata for the collection page
    foundAt: (id) => meta[id] || null,     // ISO timestamp of the find, or null
  };

  /* ---------- persistent way back to the collection ----------
     Once at least one egg is found, drop a small badge linking to the (now
     unlocked) collection page. Stays hidden until the first find, and is
     suppressed on the collection page itself (which sets window.__EGG_VAULT). */
  function ensureVaultLink() {
    if (window.__EGG_VAULT || found.size === 0) return;
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
    if (c) c.textContent = found.size;   // found tally only — never the total
  }
  if (document.readyState !== 'loading') ensureVaultLink();
  else document.addEventListener('DOMContentLoaded', ensureVaultLink);

  // decoupled trigger: any component can announce a find by firing this event
  window.addEventListener('easteregg', (e) => {
    if (e && e.detail && e.detail.id) discover(e.detail.id);
  });
})();
