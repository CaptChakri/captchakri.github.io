/* =====================================================================
   THEME — shared behaviour for all pages (portfolio + blog)
   Requires the markup blocks documented in blog/posts/template.html:
     #intro, #cursor-dot, #cursor-ring, #progress, #starfield
   Exposes window.REDUCED for page-specific scripts.
   ===================================================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.REDUCED = REDUCED;

/* ===== CROSS-PAGE VIEW TRANSITIONS ====================================
   Mark a page reached via cross-document VT so the CSS skips the cold
   intro/nav-drop/reveal sequence, and name the post hero title so it morphs
   from the blog card it was opened from. No-ops where unsupported. */
if ('startViewTransition' in document) {
  const namePostTitle = () => {
    const t = document.querySelector('.post-title');
    if (t) t.style.viewTransitionName = 'post-title';
    return t;
  };

  /* Classify a path so home ⇄ blog navigations can get a bespoke, directional
     transition (an "ascent" up to the journal / a "dive" back home) instead of
     the flat crossfade every other navigation uses. The type is read by the
     ::view-transition CSS in theme.css; unsupported browsers just crossfade. */
  const pageKind = path => {
    path = path.replace(/index\.html$/, '');
    if (path === '/') return 'home';
    if (path === '/blog/') return 'blog';
    if (path.startsWith('/blog/')) return 'post';
    return 'other';
  };
  const pathOf = url => { try { return new URL(url, location.href).pathname; } catch (e) { return null; } };
  const journeyType = (fromPath, toPath) => {
    if (REDUCED || !fromPath || !toPath) return null;
    const from = pageKind(fromPath), to = pageKind(toPath);
    if (from === 'home' && to === 'blog') return 'to-blog';
    if (from === 'blog' && to === 'home') return 'to-home';
    return null;
  };
  const addType = (vt, type) => { if (type && vt.types && vt.types.add) vt.types.add(type); };

  window.addEventListener('pagereveal', e => {
    if (!e.viewTransition) return;
    document.documentElement.classList.add('vt-in');
    const from = window.navigation && navigation.activation && navigation.activation.from;
    addType(e.viewTransition, journeyType(from ? pathOf(from.url) : null, location.pathname));
    const t = namePostTitle();
    if (t) e.viewTransition.finished.then(() => { t.style.viewTransitionName = ''; }).catch(() => {});
  });
  window.addEventListener('pageswap', e => {
    if (!e.viewTransition) return;
    const to = e.activation && e.activation.entry;
    addType(e.viewTransition, journeyType(location.pathname, to ? pathOf(to.url) : null));
    namePostTitle();
  });
}

/* ===== INTRO — real loading screen ====================================
   Stays up until the page has actually loaded (window load + fonts), with
   a minimum hold so the animation reads and a hard cap so a stalled asset
   can never trap the visitor. Plays once per session; later pages skip it.
   Pages can await window.INTRO_DONE to sequence their own animations. */
let introResolve;
window.INTRO_DONE = new Promise(r => { introResolve = r; });
(function() {
  const intro = document.getElementById('intro');
  if (!intro) { introResolve(); return; }
  let seen = false;
  try {
    seen = sessionStorage.getItem('ck-intro') === '1';
    sessionStorage.setItem('ck-intro', '1');
  } catch (e) {}
  if (seen || REDUCED) {
    document.body.classList.add('skip-intro');
    intro.classList.add('done');
    introResolve();
    return;
  }

  function finish() {
    if (intro.classList.contains('done')) return;
    intro.classList.add('done');
    introResolve();
  }

  const minShow = new Promise(r => setTimeout(r, 900));
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(r => addEventListener('load', r, { once: true }));
  const fonts = (document.fonts && document.fonts.ready) || Promise.resolve();
  Promise.all([minShow, loaded, fonts]).then(finish);
  setTimeout(finish, 4000); // hard cap
})();

/* ===== RESPONSIVE NAVIGATION ===== */
(function() {
  const nav = document.querySelector('nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('primary-links');
  if (!nav || !toggle || !links) return;
  nav.classList.add('nav-ready');

  function closeMenu(returnFocus = false) {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('nav-open');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    links.classList.toggle('open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('nav-open', opening);
  });

  links.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && links.classList.contains('open')) closeMenu(true);
  });

  document.addEventListener('click', event => {
    if (links.classList.contains('open') && !nav.contains(event.target)) closeMenu();
  });

  matchMedia('(min-width: 769px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
})();

/* ===== SUPPRESS NAV HOVER WHILE SCROLLING =============================
   Clicking a fixed-nav link leaves the cursor parked on it. A wheel/trackpad
   scroll then moves the page under a stationary cursor, so the clicked link
   keeps :hover — which is styled identically to the .active scroll-spy
   highlight, making two nav items look selected at once. Lock hover on scroll
   and release it the moment the pointer actually moves (real hover intent). */
(function() {
  const root = document.documentElement;
  let locked = false;
  addEventListener('scroll', () => {
    if (!locked) { locked = true; root.classList.add('nav-hover-lock'); }
  }, { passive: true });
  addEventListener('pointermove', () => {
    if (locked) { locked = false; root.classList.remove('nav-hover-lock'); }
  }, { passive: true });
})();

/* ===== NAV DUBLIN CLOCK (injected; pairs with .nav-meta) ===== */
(function() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const meta = document.createElement('div');
  meta.className = 'nav-meta';
  meta.setAttribute('aria-hidden', 'true');
  meta.innerHTML = 'DUBLIN, IE · <span class="nav-clock">--:--</span>';
  nav.appendChild(meta);
  const clock = meta.querySelector('.nav-clock');
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Dublin' });
  } catch (e) {
    fmt = { format: d => d.toTimeString().slice(0, 5) };
  }
  function tick() { clock.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 15000);
})();

/* ===== FOOTER YEAR ===== */
(function() {
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

/* ===== POST TOC + SCROLLSPY (annotated layout) =====
   Builds the sticky table of contents from the article's h2[data-type]
   headings and highlights the in-view section. No-op without #post-toc. */
(function() {
  const art = document.querySelector('.post-article');
  const tocBox = document.getElementById('post-toc');
  if (!art || !tocBox) return;
  const hs = [...art.querySelectorAll('h2')];
  if (!hs.length) {
    tocBox.style.display = 'none';
    const head = document.querySelector('.toc-head');
    if (head) head.style.display = 'none';
    return;
  }
  hs.forEach(h => {
    const label = h.dataset.type || h.textContent.trim();
    const id = h.id || ('sec-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    h.id = id;
    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = label;
    tocBox.appendChild(a);
  });
  const tocLinks = [...tocBox.querySelectorAll('a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      tocLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-15% 0px -65% 0px' });
  hs.forEach(h => spy.observe(h));
})();

/* ===== CURSOR ===== */
(function() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let mx = -100, my = -100, rx = -100, ry = -100;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, .tilt').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
})();

/* ===== SCROLL PROGRESS ===== */
(function() {
  const bar = document.getElementById('progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
  }, { passive: true });
})();

/* ===== TYPED SECTION HEADINGS + .rv REVEALS ===== */
(function() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);

      if (el.tagName === 'H2' && el.dataset.type) {
        // typed headings may also carry .rv (opacity 0) — reveal before typing
        el.classList.add('show');
        el.style.animationDelay = '0s';
        const text = el.dataset.type;
        if (REDUCED) { el.textContent = text; return; }
        const caret = document.createElement('span');
        caret.className = 'h2caret';
        el.appendChild(caret);
        let i = 0;
        (function tick() {
          if (i <= text.length) {
            el.childNodes[0] && el.childNodes[0].nodeType === 3
              ? el.childNodes[0].textContent = text.slice(0, i)
              : el.insertBefore(document.createTextNode(text.slice(0, i)), caret);
            i++;
            setTimeout(tick, 40 + Math.random() * 40);
          } else {
            setTimeout(() => caret.remove(), 1600);
          }
        })();
      } else {
        el.classList.add('show');
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('h2[data-type]').forEach(h => io.observe(h));

  // stagger .rv siblings within each section — capped so elements deep in a
  // long section don't wait seconds after scrolling into view; article body
  // text reveals immediately (the scroll position is the stagger)
  document.querySelectorAll('.section-wrap, .contact-section, .post-header, .post-article, .post-nav, .blog-hero, [data-rv-group]').forEach(section => {
    const inArticle = section.classList.contains('post-article');
    section.querySelectorAll('.rv').forEach((el, i) => {
      el.style.animationDelay = inArticle ? '0s' : Math.min(i * 0.09, 0.45) + 's';
      io.observe(el);
    });
  });

  // experience bullets cascade in once the list scrolls into view
  const bulletIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      bulletIO.unobserve(e.target);
      e.target.querySelectorAll('li').forEach((li, i) => {
        li.style.animationDelay = Math.min(i * 0.07, 0.5) + 's';
        li.classList.add('show');
      });
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.exp-bullets').forEach(ul => bulletIO.observe(ul));
})();

/* ===== STARFIELD + SAKURA + SHOOTING STARS ===== */
(function() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], shooters = [], petals = [];
  const N_STARS = 220, N_PETALS = 14;

  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }

  function mkStar() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.75 + 0.15,
      ts: Math.random() * 0.008 + 0.002,
      td: Math.random() > 0.5 ? 1 : -1,
      par: Math.random() * 0.3 + 0.05,
    };
  }
  function mkShooter() {
    const a = (Math.random() * 30 + 15) * Math.PI / 180;
    return {
      x: Math.random() * W, y: -10,
      vx: Math.cos(a) * (6 + Math.random() * 5),
      vy: Math.sin(a) * (6 + Math.random() * 5),
      len: 80 + Math.random() * 80, alpha: 1, life: 1,
    };
  }
  function mkPetal(init) {
    return {
      x: Math.random() * W, y: init ? Math.random() * H : -20,
      size: 4 + Math.random() * 5,
      vy: 0.4 + Math.random() * 0.7,
      drift: Math.random() * Math.PI * 2,
      ds: 0.005 + Math.random() * 0.012,
      da: 0.6 + Math.random() * 1.2,
      rot: Math.random() * Math.PI * 2,
      rs: (Math.random() - 0.5) * 0.02,
      alpha: 0.25 + Math.random() * 0.35,
    };
  }

  resize();
  for (let i = 0; i < N_STARS; i++) stars.push(mkStar());
  for (let i = 0; i < N_PETALS; i++) petals.push(mkPetal(true));

  let lastShooter = 0, mouseX = W / 2, mouseY = H / 2, sY = 0;
  addEventListener('resize', resize);
  addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  addEventListener('scroll', () => { sY = scrollY; }, { passive: true });

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    if (!REDUCED && ts - lastShooter > 3500 + Math.random() * 4000) {
      shooters.push(mkShooter()); lastShooter = ts;
    }
    const mx = (mouseX / W - 0.5) * 12, my = (mouseY / H - 0.5) * 12, sy = sY * 0.04;

    for (const s of stars) {
      s.alpha += s.ts * s.td;
      if (s.alpha > 0.9 || s.alpha < 0.08) s.td *= -1;
      ctx.beginPath();
      ctx.arc(s.x + mx * s.par, s.y + my * s.par - sy * s.par, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${s.alpha})`;
      ctx.fill();
    }
    shooters = shooters.filter(s => s.alpha > 0.01);
    for (const s of shooters) {
      s.x += s.vx; s.y += s.vy; s.life -= 0.018; s.alpha = s.life;
      const tx = s.x - s.vx * (s.len / 12), ty = s.y - s.vy * (s.len / 12);
      const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
      g.addColorStop(0, 'rgba(0,200,240,0)');
      g.addColorStop(1, `rgba(0,200,240,${s.alpha * 0.9})`);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,240,255,${s.alpha})`; ctx.fill();
    }
    if (!REDUCED) for (const p of petals) {
      p.drift += p.ds; p.x += Math.sin(p.drift) * p.da; p.y += p.vy; p.rot += p.rs;
      if (p.y > H + 20) Object.assign(p, mkPetal(false));
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,170,200,${p.alpha})`; ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
