/* =====================================================================
   THE VAULT — the hidden easter-egg collection page (eggs.html).

   By default this page is a plain 404: a visitor who has found nothing
   sees only "page not found", so the collection stays a secret. The moment
   you've discovered at least one egg, the 404 "pops" and dissolves into a
   grid of the things you've found, each with a little story.

   We NEVER reveal how many eggs exist — no totals, no remaining count, no
   empty placeholder slots. The page only ever shows what you've actually
   caught, so the rest stays a mystery worth chasing. Reads everything from
   window.EasterEggs (assets/js/easter-eggs.js) and the SVG art in
   window.DESCENT_SPRITES (assets/js/descent-sprites.js).
   ===================================================================== */
(function () {
  const EE = window.EasterEggs;
  const decoy = document.getElementById('egg-404');
  const vault = document.getElementById('egg-vault');
  const grid = document.getElementById('egg-grid');
  const sub = document.getElementById('egg-sub');
  if (!EE || !vault || !grid) return;

  const REDUCED = !!window.REDUCED;

  // Rarity ladder, rarest first. The vault groups finds under these tiers, but
  // ONLY tiers the visitor has actually reached are drawn — we never render an
  // empty tier, so the page still never betrays how much is left to find.
  const RARITY = {
    legendary: { label: 'Legendary', order: 0 },
    epic:      { label: 'Epic',      order: 1 },
    rare:      { label: 'Rare',      order: 2 },
    uncommon:  { label: 'Uncommon',  order: 3 },
    common:    { label: 'Common',    order: 4 },
  };
  const TIERS = Object.keys(RARITY).sort((a, b) => RARITY[a].order - RARITY[b].order);
  const tierOf = (egg) => (egg && RARITY[egg.rarity]) ? egg.rarity : 'common';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    ));
  }

  // prefer the site's crafted SVG art (matches the descent), fall back to emoji
  function iconHtml(egg) {
    const lib = window.DESCENT_SPRITES;
    const svg = egg.svg && lib && (lib[egg.svg] || lib[egg.svg.replace(/️/g, '')]);
    return svg || egg.icon || '🥚';
  }

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function cardHtml(egg, tier) {
    const when = fmtDate(EE.foundAt(egg.id));
    return '<div class="egg-card-icon" aria-hidden="true">' + iconHtml(egg) + '</div>' +
      '<div class="egg-card-body">' +
        '<div class="egg-card-eyebrow">' + esc(egg.where || 'Found') + '</div>' +
        '<h3 class="egg-card-title">' + esc(egg.label) + '</h3>' +
        '<p class="egg-card-note">' + esc(egg.note || egg.hint || '') + '</p>' +
        (egg.fact ? '<div class="egg-card-fact"><span class="egg-card-fact-label">Fun fact</span>' + esc(egg.fact) + '</div>' : '') +
      '</div>' +
      '<div class="egg-card-foot">' +
        '<span class="egg-card-rarity">' + esc(RARITY[tier].label) + '</span>' +
        (when ? '<span class="egg-card-date">' + esc(when) + '</span>' : '') +
      '</div>';
  }

  function render() {
    // only the eggs this browser has actually found — within a tier, order them
    // by when they were caught so each tier still reads like a little timeline
    const mine = EE.all()
      .filter(egg => EE.has(egg.id))
      .sort((a, b) => (EE.foundAt(a.id) || '').localeCompare(EE.foundAt(b.id) || ''));

    grid.innerHTML = '';
    let i = 0;   // one running index across headers + cards, so the entrance staggers top-to-bottom
    TIERS.forEach(tier => {
      const eggs = mine.filter(egg => tierOf(egg) === tier);
      if (!eggs.length) return;   // skip tiers with nothing found — never reveal a tier you haven't reached

      const head = document.createElement('div');
      head.className = 'egg-tier';
      head.dataset.rarity = tier;
      head.style.setProperty('--i', i++);
      head.innerHTML =
        '<span class="egg-tier-dot" aria-hidden="true"></span>' +
        '<span class="egg-tier-label">' + esc(RARITY[tier].label) + '</span>';
      grid.appendChild(head);

      eggs.forEach(egg => {
        const card = document.createElement('article');
        card.className = 'egg-card';
        card.dataset.rarity = tier;
        card.style.setProperty('--i', i++);
        card.innerHTML = cardHtml(egg, tier);
        grid.appendChild(card);
      });
    });

    const n = mine.length;
    if (sub) {
      sub.textContent = n === 1
        ? "You've turned up one hidden thing so far. Keep your eyes open — there may be more."
        : "You've turned up " + n + " hidden things so far. Keep your eyes open — there may be more.";
    }
  }

  function showVault() {
    render();
    document.title = 'The Vault · Chakri’s World';
    if (decoy) { decoy.setAttribute('hidden', ''); decoy.classList.remove('pop'); }
    vault.removeAttribute('hidden');
    vault.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => vault.classList.add('show'));
    // hand focus to the unlocked content for keyboard + screen-reader users
    try { vault.focus({ preventScroll: true }); } catch (e) { vault.focus(); }
  }

  function reveal(pop) {
    if (!pop || REDUCED || !decoy) { showVault(); return; }
    // the pop: a flash, the 404 bursts outward, then the vault scales in
    const flash = document.createElement('div');
    flash.className = 'egg-flash';
    flash.setAttribute('aria-hidden', 'true');
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 700);
    decoy.classList.add('pop');
    setTimeout(showVault, 560);
  }

  function decide() {
    if (EE.count() <= 0) return;          // nothing found → stay a 404, stay hidden
    // hold the 404 for a beat first, so the reveal lands as a surprise
    setTimeout(() => reveal(true), REDUCED ? 0 : 650);
  }

  // wait for the intro loader to clear so the pop isn't hidden behind it
  (window.INTRO_DONE || Promise.resolve()).then(decide);

  // if an egg is discovered while this page is open (e.g. a second tab), open up
  window.addEventListener('easteregg', () => {
    if (vault.hasAttribute('hidden')) reveal(true);
    else render();
  });
})();
