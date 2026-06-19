/* =====================================================================
   DESCENT CONTENT — behaviours for the "fall from space to the trench"
   home. The content itself is real markup in index.html (better for SEO /
   no-JS); this wires the light behaviours: hero greeting, scroll reveals +
   nav active state, the journal rail (latest posts), email copy, in-page
   nav jumps, and project-card tilt.
   ===================================================================== */
(function () {
  const reduce = window.REDUCED || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.getElementById('descent-content')) return;

  /* ===== HERO greeting (typed, then cycled through 5 languages) ===== */
  (function () {
    const greetings = [
      { text: "Hey! I'm Chakri", html: "Hey! I'm <span class=\"gname\">Chakri</span>" },
      { text: "హాయ్! నేను చక్రి", html: "హాయ్! నేను <span class=\"gname\">చక్రి</span>" },
      { text: "안녕! 나는 차크리야", html: "안녕! 나는 <span class=\"gname\">차크리</span>야" },
      { text: "हाय! मैं चक्री हूँ", html: "हाय! मैं <span class=\"gname\">चक्री</span> हूँ" },
      { text: "やあ！わたしはチャクリです", html: "やあ！わたしは<span class=\"gname\">チャクリ</span>です" },
    ];
    const el = document.getElementById('typed-greeting');
    if (!el) return;
    function type(text, cb) {
      if (reduce) { el.textContent = text; cb && cb(); return; }
      let i = 0; (function tick() { if (i <= text.length) { el.textContent = text.slice(0, i++); setTimeout(tick, 28 + Math.random() * 38); } else cb && cb(); })();
    }
    function cycle() {
      el.innerHTML = greetings[0].html; if (reduce) return;
      let idx = 1; el.style.transition = 'opacity .45s ease';
      setInterval(() => { el.style.opacity = '0'; setTimeout(() => { el.innerHTML = greetings[idx].html; el.style.opacity = '1'; idx = (idx + 1) % greetings.length; }, 450); }, 3200);
    }
    function reveal() {
      cycle();
      const words = document.querySelectorAll('#headline .w');
      words.forEach((w, i) => setTimeout(() => w.classList.add('show'), i * 80));
      const after = words.length * 80 + 250;
      ['.hero-intro', '.hero-cta', '.hero-status', '#hero-journal'].forEach((sel, i) => {
        const node = document.querySelector(sel); if (node) setTimeout(() => node.classList.add('show'), after + i * 170);
      });
    }
    const go = () => type(greetings[0].text, reveal);
    (window.INTRO_DONE || Promise.resolve()).then(() => setTimeout(go, 300));
  })();

  /* ===== reveals + nav active state (scroll-driven) ===== */
  (function () {
    const items = [...document.querySelectorAll('.rise')];
    items.forEach(el => {
      const sec = el.closest('.dz');
      if (sec) { const sibs = [...sec.querySelectorAll('.rise')]; el.style.transitionDelay = Math.min(sibs.indexOf(el) * 0.07, 0.4) + 's'; }
    });
    const navLinks = [...document.querySelectorAll('nav .nav-links a[href^="#"]')];
    const navMap = navLinks.map(a => ({ a, sec: document.querySelector(a.getAttribute('href')) })).filter(x => x.sec);
    // the "scroll to fall" hint is pinned to the viewport bottom. It only has a
    // home when the hero content clears the bottom of the screen; on shorter
    // laptops/phones the hero overflows past 100vh, so there's no empty space —
    // hide it there (the cut-off content already signals "scroll") rather than
    // letting it float over the headline/paragraph. Once visible, it fades the
    // moment the visitor starts to fall.
    const hint = document.querySelector('.scroll-hint');
    const heroWrap = document.querySelector('.dz-hero .hero-wrap');
    let hintHasRoom = true;
    function gaugeHintRoom() {
      if (!hint || !heroWrap || window.scrollY > 4) return; // only meaningful at the top
      const h = hint.getBoundingClientRect(), w = heroWrap.getBoundingClientRect();
      hintHasRoom = w.bottom <= h.top - 6;
    }
    function check() {
      const vh = window.innerHeight;
      for (const el of items) {
        if (el.classList.contains('show')) continue;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) el.classList.add('show');
      }
      gaugeHintRoom();
      if (hint) hint.classList.toggle('is-hidden', !hintHasRoom || window.scrollY > vh * 0.15);
      let cur = null;
      for (const m of navMap) { if (m.sec.getBoundingClientRect().top <= vh * 0.45) cur = m.a; }
      navLinks.forEach(l => l.classList.remove('active'));
      if (cur) cur.classList.add('active');
    }
    let tick = false;
    window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; check(); }); } }, { passive: true });
    window.addEventListener('resize', check);
    check(); setTimeout(check, 300); setTimeout(check, 1200);
  })();

  /* ===== journal rail — latest 3 from blog/posts.json (date-based URLs) ===== */
  (function () {
    const rail = document.getElementById('hero-journal'); if (!rail) return;
    const more = rail.querySelector('.hj-more');
    function postUrl(post) {
      if (post.status === 'coming-soon') return post.comingSoonUrl || '/blog/coming-soon.html';
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(post.date);
      if (!m) return '/blog/';
      return `blog/${m[1]}/${m[2]}/${m[3]}/${encodeURIComponent(post.slug)}.html`;
    }
    fetch('blog/posts.json').then(r => r.json()).then(posts => {
      posts.filter(p => p.status !== 'coming-soon').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).forEach(post => {
        const a = document.createElement('a'); a.href = postUrl(post); a.className = 'hj-post';
        const date = document.createElement('div'); date.className = 'hj-post-date'; date.textContent = post.dateLabel || post.date;
        const title = document.createElement('div'); title.className = 'hj-post-title'; title.textContent = post.title;
        a.append(date, title);
        if (post.tags && post.tags.length) {
          const tags = document.createElement('div'); tags.className = 'hj-post-tags';
          post.tags.forEach(t => { const s = document.createElement('span'); s.className = 'tag'; s.textContent = t; tags.appendChild(s); });
          a.appendChild(tags);
        }
        rail.insertBefore(a, more);
      });
    }).catch(() => {});
  })();

  /* ===== nav: smooth in-page jumps (60px offset under the fixed nav) ===== */
  (function () {
    document.querySelectorAll('nav a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href'); const t = document.querySelector(id);
        if (!t) return; e.preventDefault();
        window.scrollTo({ top: t.offsetTop - 60, behavior: reduce ? 'instant' : 'smooth' });
      });
    });
  })();

  /* ===== project-card 3D tilt (desktop, hover, non-reduced-motion) ===== */
  (function () {
    if (reduce || !matchMedia('(hover:hover)').matches) return;
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => { const r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; card.style.transform = `perspective(700px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-2px)`; });
      card.addEventListener('mouseleave', () => card.style.transform = '');
    });
  })();
})();
