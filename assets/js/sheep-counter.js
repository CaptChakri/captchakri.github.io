/* =====================================================================
   COUNTING-SHEEP PLAYGROUND
   ---------------------------------------------------------------------
   A self-contained bedtime toy. Drop an element with [data-sheep-counter]
   on a page (and link assets/css/sheep-counter.css) and this builds the
   whole scene into it: woolly sheep trot in, hop a centred fence, and tick
   up a counter — with the occasional witty costume and a dry one-liner.

   Soothing by design: the sheep arrive slower and amble slower the longer
   you watch (drowsiness), there's an optional 4-2-6 breathing pacer, a
   "dim" dusk, and a soft Korean lullaby — "jajang jajang, uri agi" — on a
   gentle piano voice (off by default, started only on a click so no autoplay).
   prefers-reduced-motion gets a calm, movement-free counter instead.

   No dependencies, no globals leaked. Mount-agnostic: styles all live in
   the CSS file; everything here is behaviour.
   ===================================================================== */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: function () {} };

  // sheep face left because they travel right -> left. Variant bits (shades,
  // pillow, crown, wolf ears/tail) are present but hidden until CSS shows them.
  var SHEEP_SVG = [
    '<svg viewBox="0 0 70 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      '<g class="sg-wolf-tail"><path d="M58 26 q12 -2 13 8 q-7 -3 -13 -1 z"/></g>',
      // legs (animated implicitly by the body transform)
      '<line class="sg-leg" x1="26" y1="38" x2="26" y2="48"/>',
      '<line class="sg-leg" x1="34" y1="39" x2="34" y2="49"/>',
      '<line class="sg-leg" x1="44" y1="39" x2="44" y2="49"/>',
      '<line class="sg-leg" x1="52" y1="38" x2="52" y2="48"/>',
      // woolly body: a cluster of bumps
      '<g class="sg-wool">',
        '<circle cx="34" cy="26" r="13"/><circle cx="46" cy="24" r="12"/>',
        '<circle cx="54" cy="29" r="9"/><circle cx="40" cy="33" r="11"/>',
        '<circle cx="28" cy="30" r="9"/>',
      '</g>',
      '<g class="sg-wool-2"><circle cx="50" cy="33" r="6"/><circle cx="33" cy="34" r="6"/></g>',
      // head on the left, looking forward
      '<g class="sg-wolf-ear"><path class="sg-face" d="M16 14 l5 8 l-9 -1 z"/></g>',
      '<ellipse class="sg-face" cx="17" cy="24" rx="9" ry="7.5"/>',
      '<path class="sg-face" d="M9 19 q-4 -1 -5 4 q4 0 6 -1 z"/>',      // ear
      '<circle class="sg-eye" cx="14" cy="22" r="1.7"/>',
      '<g class="sg-shades"><rect x="8" y="20" width="13" height="5" rx="1.5" fill="#10131b"/>',
        '<rect x="7" y="21" width="2" height="3" fill="#10131b"/></g>',
      '<g class="sg-pillow"><rect x="2" y="30" width="16" height="9" rx="3" fill="#cfe0ff" stroke="#9fb6e6" stroke-width="1"/></g>',
      '<g class="sg-crown"><path d="M40 9 l3 6 l4 -5 l4 5 l3 -6 l-1 8 l-16 0 z" fill="#ffce54" stroke="#c79a2e" stroke-width="0.8"/></g>',
    '</svg>'
  ].join('');

  // the site's tortoise (its avatar), side view heading LEFT to match the sheep.
  // The head sits in its own group so it can crane up to "peek". An everyday
  // olive tortoise — domed carapace with scute lines, head on a short neck,
  // four stubby legs and a stub tail.
  var TORT_SVG = [
    '<svg viewBox="0 0 120 76" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      '<g class="tort-legs" fill="#5f7a3c">',
        '<ellipse cx="56" cy="59" rx="6" ry="8" opacity="0.85"/>',
        '<ellipse cx="98" cy="56" rx="6" ry="8" opacity="0.85"/>',
        '<ellipse cx="44" cy="60" rx="7" ry="9"/>',
        '<ellipse cx="86" cy="60" rx="7" ry="9"/>',
      '</g>',
      '<path d="M104 46 L117 50 L104 54 z" fill="#6b8f3e"/>',        // tail stub
      '<g class="tort-head">',                                       // head + neck
        '<path d="M30 44 q-14 3 -18 -6 q1 -11 13 -11 q12 0 13 9 z" fill="#82a05a"/>',
        '<ellipse cx="15" cy="33" rx="10" ry="8.5" fill="#82a05a"/>',
        '<circle cx="12" cy="31" r="1.9" fill="#10131b"/>',
      '</g>',
      '<path d="M28 50 Q34 18 64 18 Q96 18 102 50 Q64 60 28 50 Z" fill="#6b8f3e"/>',
      '<ellipse cx="56" cy="30" rx="16" ry="7" fill="#7fa84e" opacity="0.45"/>',  // dome sheen
      '<path d="M28 50 Q64 60 102 50 Q64 55 28 50 Z" fill="#54702f"/>',           // belly rim
      '<g stroke="#46612a" stroke-width="1.8" fill="none" stroke-linecap="round">',
        '<path d="M38 46 Q64 26 92 46"/>',
        '<path d="M52 21 Q50 36 52 49"/>',
        '<path d="M64 19 L64 50"/>',
        '<path d="M76 21 Q78 36 76 49"/>',
      '</g>',
    '</svg>'
  ].join('');

  // a little owl — the camp's "night watcher" from the descent biosphere —
  // perched on the fence, blinking now and then. Front view, dark silhouette
  // with two amber eyes (their own group so they can blink).
  var OWL_SVG = [
    '<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      '<path d="M6 9 L13 17 L3 15 Z" fill="#0e1730"/>',         // ear tufts
      '<path d="M34 9 L27 17 L37 15 Z" fill="#0e1730"/>',
      '<path d="M20 5 C9 5 5 16 5 27 C5 39 12 43 20 43 C28 43 35 39 35 27 C35 16 31 5 20 5 Z" fill="#0e1730"/>',
      '<path d="M20 14 C15 14 13 19 13 26 Q20 30 27 26 C27 19 25 14 20 14 Z" fill="#152038"/>', // belly
      '<g class="owl-eyes">',
        '<circle cx="14" cy="21" r="4.4" fill="#ffd36a"/><circle cx="26" cy="21" r="4.4" fill="#ffd36a"/>',
        '<circle cx="14.6" cy="21" r="1.7" fill="#16100a"/><circle cx="25.4" cy="21" r="1.7" fill="#16100a"/>',
      '</g>',
      '<path d="M20 24 l-2.2 3.4 l4.4 0 z" fill="#caa24a"/>',   // beak
    '</svg>'
  ].join('');

  // the costume classes a "special" sheep can wear (language-independent)
  var SPECIAL_CLASSES = ['is-vip', 'is-wolf', 'is-sleepy', 'is-king'];

  // ---- localisation -------------------------------------------------------
  // The scene speaks the page's language. Pick it up from <html lang> or the
  // saved preference (ck-lang), default English. Adding a language is just
  // another entry here with the same shape. {n} -> the live count.
  var I18N = {
    en: {
      unit: 'sheep counted',
      btn: { pause: '&#10073;&#10073; Pause', resume: '&#9658; Resume', breathe: '&#9686; Breathe', lull: '&#9834; Lullaby', reset: '&#8635; Reset' },
      breath: ['Breathe in', 'Hold', 'Breathe out'],
      intro: 'Get comfortable. Let the sheep do the counting.',
      reset: 'Back to zero. The flock is well rested. Are you?',
      sr: 'A looping scene of sheep gently hopping over a fence under a dim night sky, used as a calm bedtime counter. Use the buttons to pause, start a breathing guide, play a soft lullaby, or reset the count.',
      quips: [
        'Sheep #{n} cleared it cleanly. Smug about it, frankly.',
        '{n}. The flock is starting to lose track too.',
        'That is a suspicious number of well-behaved sheep.',
        'Sheep #{n} reports the grass is, indeed, greener over there.',
        '{n} down. Nobody has questioned the fence yet. Good.',
        'Sheep #{n} would like it noted that it is doing this voluntarily.',
        'Somewhere past {n}, the counting starts counting you.',
        'Sheep #{n} stuck the landing. Mostly.',
        '{n}. Breathe out a little slower than you breathed in.',
        'Sheep #{n} paused to admire the moon. Fair enough.',
        'Still awake? The sheep are impressed by your stamina.',
        'Sheep #{n} is the cousin of the one just before it. Long story.'
      ],
      specials: {
        'is-vip':    function (n) { return 'Sheep #' + n + ' cleared the fence in sunglasses. At this hour. Respect.'; },
        'is-wolf':   function (n) { return 'Sheep #' + n + ' looked a lot like a wolf. We let it through. Do not tell the others.'; },
        'is-sleepy': function (n) { return 'Sheep #' + n + ' brought a pillow. Honestly, the smartest one here.'; },
        'is-king':   function (n) { return 'All hail Sheep #' + n + ', the only one who actually wanted to be counted.'; }
      }
    },
    ko: {
      unit: '마리 세었어요',
      btn: { pause: '&#10073;&#10073; 일시정지', resume: '&#9658; 계속', breathe: '&#9686; 호흡', lull: '&#9834; 자장가', reset: '&#8635; 초기화' },
      breath: ['들이쉬세요', '멈추세요', '내쉬세요'],
      intro: '편하게 누워 보세요. 세는 건 양들에게 맡기고요.',
      reset: '다시 0이에요. 양 떼는 푹 쉬었답니다. 당신은요?',
      sr: '어두운 밤하늘 아래 양들이 울타리를 가볍게 뛰어넘는 반복 장면으로, 잔잔한 잠자리 카운터입니다. 버튼으로 일시정지, 호흡 가이드 시작, 자장가 재생, 또는 카운트 초기화를 할 수 있어요.',
      quips: [
        '{n}번 양이 깔끔하게 넘었어요. 솔직히 좀 으쓱대네요.',
        '{n}. 양 떼도 이제 세다가 까먹기 시작했어요.',
        '이렇게 얌전한 양이 많다니, 좀 수상한데요.',
        '{n}번 양이 전하길, 저쪽 풀이 확실히 더 푸르대요.',
        '{n}마리 완료. 아직 아무도 울타리에 토 달지 않았어요. 좋아요.',
        '{n}번 양은 이걸 자발적으로 하고 있다고 꼭 적어 달래요.',
        '{n}을 넘어선 어디쯤, 세던 것이 당신을 세기 시작해요.',
        '{n}번 양, 착지 성공. 거의 완벽하게요.',
        '{n}. 들이쉴 때보다 조금 더 천천히 내쉬어 보세요.',
        '{n}번 양이 잠시 멈춰 달을 감상했어요. 그럴 만하죠.',
        '아직 안 주무세요? 양들이 당신의 체력에 감탄하고 있어요.',
        '{n}번 양은 바로 앞 양의 사촌이에요. 사연이 길죠.'
      ],
      specials: {
        'is-vip':    function (n) { return n + '번 양이 선글라스를 끼고 울타리를 넘었어요. 이 시간에. 인정합니다.'; },
        'is-wolf':   function (n) { return n + '번 양은 늑대를 꽤 닮았어요. 그냥 통과시켰어요. 다른 양들에겐 비밀이에요.'; },
        'is-sleepy': function (n) { return n + '번 양은 베개를 가져왔어요. 솔직히 여기서 제일 똑똑한 양이에요.'; },
        'is-king':   function (n) { return n + '번 양 만세, 유일하게 세어지길 진심으로 바란 양이에요.'; }
      }
    }
  };

  function sheepLang() {
    // prefer the page's declared language (the playground's chrome sets <html lang>
    // before this boots); fall back to a saved choice, then English. This keeps the
    // English blog embed English even if Korean was chosen on the playground.
    var l = document.documentElement.lang;
    if (!I18N[l]) { try { l = localStorage.getItem('ck-lang'); } catch (e) {} }
    return I18N[l] ? l : 'en';
  }

  function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // ---- the time-aware moon -------------------------------------------------
  // tonight's real lunar phase, from the synodic age since a known new moon
  // (2000-01-06 18:14 UTC). illum 0 = new … 1 = full; waxing = growing.
  function moonPhase(d) {
    var SYN = 29.530588853;
    var refDays = Date.UTC(2000, 0, 6, 18, 14, 0) / 86400000;
    var age = ((d.getTime() / 86400000) - refDays) % SYN;
    if (age < 0) age += SYN;
    var phase = age / SYN;
    return { illum: (1 - Math.cos(2 * Math.PI * phase)) / 2, waxing: phase < 0.5 };
  }
  // SVG path covering `frac` of a disc of radius r, met on the right limb when
  // onRight (else the left). frac 0 -> empty, 1 -> the whole disc. Used to paint
  // the moon's UNLIT side as a shadow over the pale face.
  function moonRegion(r, frac, onRight) {
    var b = 2 * frac - 1, rx = Math.abs(b) * r;
    var sl = onRight ? 1 : 0;
    var st = (b >= 0) ? sl : (1 - sl);
    return 'M0,' + (-r) + 'A' + r + ',' + r + ' 0 0 ' + sl + ' 0,' + r +
           'A' + rx.toFixed(2) + ',' + r + ' 0 0 ' + st + ' 0,' + (-r) + 'Z';
  }

  function init(mount) {
    if (mount.dataset.sheepReady) return;     // guard against double-init
    mount.dataset.sheepReady = '1';
    mount.classList.add('sheepc');

    var lang = sheepLang();
    function loc() { return I18N[lang] || I18N.en; }

    mount.innerHTML =
      '<div class="sheepc-stage" aria-hidden="true">' +
        '<div class="sheepc-moon"></div>' +
        '<div class="sheepc-stars"></div>' +
        '<div class="sheepc-clouds"></div>' +
        '<div class="sheepc-vignette"></div>' +
        '<div class="sheepc-deepen"></div>' +
        '<div class="sheepc-sky-fx"></div>' +
        '<div class="sheepc-ground"></div>' +           // moonlit grassy clearing (from the descent camp)
        '<div class="sheepc-mist"></div>' +             // low fog blending the turf into the night sky
        '<div class="sheepc-bio"></div>' +              // fireflies drift over the grass
        '<div class="sheepc-grass-near"></div>' +       // taller foreground blades, for depth at the base
        '<div class="sheepc-fence"></div>' +
        '<div class="sheepc-owl">' + OWL_SVG + '</div>' + // the night watcher, perched
        '<div class="sheepc-track"></div>' +
        '<div class="sheepc-breath" data-breath hidden>' +
          '<div class="sheepc-breath-ring"></div>' +
          '<div class="sheepc-breath-label" data-breath-label>Breathe</div>' +
        '</div>' +
        '<div class="sheepc-readout"><div class="sheepc-num" data-num>0</div>' +
          '<div class="sheepc-unit">' + loc().unit + '</div></div>' +
        '<div class="sheepc-quip" data-quip></div>' +
        '<div class="sheepc-dim"></div>' +
      '</div>' +
      '<div class="sheepc-controls">' +
        '<button type="button" class="sheepc-btn" data-act="play" aria-pressed="true">' + loc().btn.pause + '</button>' +
        '<button type="button" class="sheepc-btn" data-act="breathe" aria-pressed="false">' + loc().btn.breathe + '</button>' +
        '<button type="button" class="sheepc-btn" data-act="sound" aria-pressed="false">' + loc().btn.lull + '</button>' +
        '<button type="button" class="sheepc-btn" data-act="reset">' + loc().btn.reset + '</button>' +
      '</div>' +
      '<p class="sheepc-sr">' + loc().sr + '</p>';

    var stage = mount.querySelector('.sheepc-stage');
    stage.classList.add('is-dim');     // the scene starts dimmed — it's a sleep aid, not a toy
    var track = mount.querySelector('.sheepc-track');
    var numEl = mount.querySelector('[data-num]');
    var quipEl = mount.querySelector('[data-quip]');
    var starsEl = mount.querySelector('.sheepc-stars');
    var cloudsEl = mount.querySelector('.sheepc-clouds');
    var skyfxEl = mount.querySelector('.sheepc-sky-fx');
    var bioEl = mount.querySelector('.sheepc-bio');
    var breathEl = mount.querySelector('[data-breath]');
    var breathLabel = mount.querySelector('[data-breath-label]');

    // ---- the moon shows tonight's real phase and drifts across the top with
    // the visitor's local clock: it slides from the right (evening) to the left
    // (toward morning), riding a little higher around midnight. ----
    var moonEl = mount.querySelector('.sheepc-moon');
    function updateMoon() {
      if (!moonEl) return;
      var d = new Date();
      var ph = moonPhase(d);
      var litRight = ph.waxing;                         // northern-hemisphere convention
      var shadow = moonRegion(31, 1 - ph.illum, !litRight);   // shade the unlit limb
      moonEl.classList.add('sheepc-moon--phased');
      moonEl.innerHTML =
        '<svg viewBox="-32 -32 64 64" aria-hidden="true">' +
          '<circle r="31" fill="#d6d3c0"/>' +
          '<g fill="#a7a491" opacity="0.45">' +
            '<circle cx="-7" cy="-6" r="5"/><circle cx="6" cy="8" r="3.4"/>' +
            '<circle cx="11" cy="-8" r="2.3"/><circle cx="-3" cy="11" r="2.1"/>' +
          '</g>' +
          '<path d="' + shadow + '" fill="#0a0f25" opacity="0.94"/>' +
          '<circle r="31" fill="none" stroke="rgba(214,210,186,0.4)" stroke-width="0.7"/>' +
        '</svg>';
      var h = d.getHours() + d.getMinutes() / 60, ang = 2 * Math.PI * h / 24;
      moonEl.style.right = 'auto';
      moonEl.style.left = (44 - 34 * Math.sin(ang)).toFixed(1) + '%';   // E (evening) -> W (morning)
      moonEl.style.top = (10 - 4 * Math.cos(ang)).toFixed(1) + '%';     // stays near the top
    }
    updateMoon();
    setInterval(updateMoon, 60000);

    // scatter a starfield (twinkle handled in CSS; staggered via delay)
    var starN = 46;
    var starFrag = document.createDocumentFragment();
    for (var i = 0; i < starN; i++) {
      var s = document.createElement('span');
      s.className = 'sheepc-star';
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (Math.random() * 62).toFixed(2) + '%';
      s.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
      var sc = (0.6 + Math.random() * 1.3).toFixed(2);
      s.style.transform = 'scale(' + sc + ')';
      starFrag.appendChild(s);
    }
    starsEl.appendChild(starFrag);

    // drift a few soft clouds across the sky (sit behind the hills). Motion is
    // pure CSS; a negative delay scatters them so they don't all enter together.
    if (!reduceMQ.matches) {
      var cloudFrag = document.createDocumentFragment();
      for (var c = 0; c < 4; c++) {
        var cl = document.createElement('div');
        cl.className = 'sheepc-cloud';
        var cw = rint(120, 260);
        cl.style.width = cw + 'px';
        cl.style.height = Math.round(cw * 0.42) + 'px';
        cl.style.top = rint(6, 42) + '%';
        cl.style.opacity = (0.32 + Math.random() * 0.34).toFixed(2);
        var cdur = rint(52, 96);
        cl.style.animationDuration = cdur + 's';
        cl.style.animationDelay = '-' + rint(0, cdur) + 's';
        cloudFrag.appendChild(cl);
      }
      cloudsEl.appendChild(cloudFrag);
    }

    // fireflies — the camp's warm-season biosphere, drifting low over the grass,
    // each blinking and wandering on its own slow rhythm (pure-CSS, scattered).
    if (!reduceMQ.matches) {
      var flyFrag = document.createDocumentFragment();
      for (var f = 0; f < 14; f++) {
        var fly = document.createElement('span');
        fly.className = 'sheepc-fly';
        fly.style.left = rint(4, 96) + '%';
        fly.style.top = rint(56, 86) + '%';
        fly.style.setProperty('--dx', (rint(-26, 26)) + 'px');
        fly.style.setProperty('--dy', (rint(-18, 12)) + 'px');
        fly.style.setProperty('--blink', (2.2 + Math.random() * 3.2).toFixed(2) + 's');
        fly.style.setProperty('--drift', (5 + Math.random() * 5).toFixed(2) + 's');
        fly.style.animationDelay = (Math.random() * 4).toFixed(2) + 's, ' + (Math.random() * 4).toFixed(2) + 's';
        flyFrag.appendChild(fly);
      }
      bioEl.appendChild(flyFrag);
    }

    // the odd shooting star: a brief streak high in the sky, self-removing.
    var shootTimer = null;
    function spawnShoot() {
      var st = document.createElement('div');
      st.className = 'sheepc-shoot';
      st.style.left = rint(34, 92) + '%';
      st.style.top = rint(4, 36) + '%';
      st.style.animation = 'sheepcShoot ' + rint(700, 1200) + 'ms ease-out forwards';
      st.addEventListener('animationend', function () { st.remove(); });
      skyfxEl.appendChild(st);
    }
    function scheduleShoot() {
      shootTimer = setTimeout(function () {
        if (running && document.visibilityState !== 'hidden') spawnShoot();
        scheduleShoot();
      }, rint(7000, 16000));
    }
    if (!reduceMQ.matches) scheduleShoot();

    // ---- the tortoise (the site's avatar) drops by to peek now and then ----
    var tortEl = null, tortTimer = null;
    function stageW() { return dimsW || stage.clientWidth || 600; }

    function spawnTortoise() {
      if (tortEl) return;                          // only ever one at a time
      var w = stageW(), rightward = Math.random() < 0.5;
      var el = document.createElement('div');
      el.className = 'sheepc-tortoise' + (rightward ? ' face-right' : '');
      el.innerHTML = TORT_SVG;
      var mid = w * 0.5 - 31 + (Math.random() * 60 - 30);   // pause spot, near centre
      el.style.setProperty('--tStart', (rightward ? -90 : w + 50) + 'px');
      el.style.setProperty('--tMid', mid.toFixed(0) + 'px');
      el.style.setProperty('--tEnd', (rightward ? w + 50 : -90) + 'px');
      var dur = rint(20000, 26000);                // slow — it's a tortoise
      el.style.animation = 'sheepcTortRoam ' + dur + 'ms linear forwards';
      track.appendChild(el);
      var head = el.querySelector('.tort-head');
      if (head) head.style.animation = 'sheepcTortPeek ' + dur + 'ms ease-in-out forwards';
      tortEl = el;
      el.addEventListener('animationend', function (e) {   // roam end (not the head's)
        if (e.target === el) { el.remove(); if (tortEl === el) tortEl = null; }
      });
    }

    // reduced-motion: it just fades in by the fence, holds a peek, and fades out
    function reduceTortoise() {
      if (tortEl) return;
      var el = document.createElement('div');
      el.className = 'sheepc-tortoise';
      el.innerHTML = TORT_SVG;
      el.style.left = (stageW() * 0.5 - 31).toFixed(0) + 'px';
      el.style.opacity = '0';
      track.appendChild(el);
      tortEl = el;
      requestAnimationFrame(function () { el.style.opacity = '1'; });
      setTimeout(function () {
        el.style.opacity = '0';
        setTimeout(function () { el.remove(); if (tortEl === el) tortEl = null; }, 800);
      }, 6000);
    }

    function scheduleTortoise(first) {
      tortTimer = setTimeout(function () {
        if (running && document.visibilityState !== 'hidden') {
          reduceMQ.matches ? reduceTortoise() : spawnTortoise();
        }
        scheduleTortoise(false);
      }, first ? rint(14000, 26000) : rint(48000, 98000));
    }
    scheduleTortoise(true);

    // the sky deepens at gentle milestones, pulling you further into the night
    function applyDepth() {
      stage.classList.toggle('is-deep-1', count >= 8);
      stage.classList.toggle('is-deep-2', count >= 20);
      stage.classList.toggle('is-deep-3', count >= 40);
    }

    // ---- tunables ----
    var PACE_MIN = 2.4, PACE_MAX = 6.0;   // seconds between sheep (grows with count)
    var BASE_DUR = 6.0, EXTRA_DUR = 4.5;  // seconds to cross (grows with count)

    var count = 0, running = true;
    var sheep = [], lastTs = 0, nextSpawn = 0, sinceQuip = 0;
    var specialIn = rint(4, 7);
    var dimsW = 0, hop = 70;
    var rafId = null, reduceTimer = null;

    function measure() {
      var r = stage.getBoundingClientRect();
      dimsW = r.width;
      // The flock passes in FRONT of the fence, so each sheep should crest just
      // clear of the whole thing — hooves rising a touch above the post tops at
      // the apex. The sheep base (17%) sits a fixed ~(0.02·height + 50px) below
      // the post tops (fence base 19% + a 50px box); the small-screen playground
      // override shifts sheep and fence by the same +13%, so one formula fits
      // every mount. The +54 (≈ +4 over that gap) lifts the hooves clear.
      hop = Math.max(56, Math.min(88, r.height * 0.02 + 54));
    }
    measure();
    window.addEventListener('resize', measure);

    function setQuip(text) {
      quipEl.textContent = text;
      quipEl.classList.remove('show');
      void quipEl.offsetWidth;          // restart the fade
      quipEl.classList.add('show');
    }

    function bump(s) {
      count++;
      numEl.textContent = count;
      applyDepth();
      numEl.classList.remove('pulse');
      void numEl.offsetWidth;
      numEl.classList.add('pulse');
      if (s && s.sp) { setQuip(loc().specials[s.sp](count)); sinceQuip = 0; return; }
      sinceQuip++;
      if (sinceQuip >= 3 && Math.random() < 0.5) {
        setQuip(pick(loc().quips).replace(/\{n\}/g, count));
        sinceQuip = 0;
      }
    }

    function spawn() {
      var sp = null;
      if (--specialIn <= 0) { sp = pick(SPECIAL_CLASSES); specialIn = rint(5, 9); }
      var el = document.createElement('div');
      el.className = 'sheepc-sheep' + (sp ? ' ' + sp : '');
      el.style.zIndex = '3';                 // behind the fence (z 4) on the way up
      el.innerHTML = SHEEP_SVG;
      track.appendChild(el);
      var dur = (BASE_DUR + Math.min(count, 40) / 40 * EXTRA_DUR) * (0.9 + Math.random() * 0.2);
      sheep.push({ el: el, p: 0, dur: dur, jumped: false, sp: sp });
    }

    function hopY(p) {
      if (p <= 0.40 || p >= 0.60) return 0;
      return -Math.sin((p - 0.40) / 0.20 * Math.PI) * hop;   // smooth arc, peak at p=0.5
    }
    function hopRot(p) {
      if (p <= 0.40 || p >= 0.60) return 0;
      return ((p - 0.50) / 0.10) * 7;                        // lean up then forward
    }

    function frame(ts) {
      rafId = requestAnimationFrame(frame);
      if (!lastTs) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!running) return;
      if (dt > 0.1) dt = 0.1;            // clamp after a tab-switch stall

      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        spawn();
        var pace = PACE_MIN + Math.min(count, 50) / 50 * (PACE_MAX - PACE_MIN);
        nextSpawn = pace * (0.85 + Math.random() * 0.3);
        if (Math.random() < 0.06) spawn();   // the odd pair, trotting together
      }

      var w = dimsW || stage.clientWidth || 600;
      var startX = w + 40, endX = -120;
      for (var i = sheep.length - 1; i >= 0; i--) {
        var s = sheep[i];
        s.p += dt / s.dur;
        var x = startX + (endX - startX) * s.p;
        s.el.style.transform =
          'translate3d(' + x.toFixed(1) + 'px,' + hopY(s.p).toFixed(1) + 'px,0) rotate(' + hopRot(s.p).toFixed(2) + 'deg)';
        // at the top of the arc, flip the sheep IN FRONT of the fence so it
        // descends on the near side — rising behind + falling in front is what
        // reads as hopping OVER (rather than in front of / behind) the rails
        if (!s.jumped && s.p >= 0.5) { s.jumped = true; s.el.style.zIndex = '6'; bump(s); }
        if (s.p >= 1) { s.el.remove(); sheep.splice(i, 1); }
      }
    }

    // ---- reduced-motion: no drifting sheep; a quiet sheep fades in over the
    // fence on a slow timer and ticks the counter, with the same quips ----
    function reduceTick() {
      var sp = null;
      if (--specialIn <= 0) { sp = pick(SPECIAL_CLASSES); specialIn = rint(5, 9); }
      var el = document.createElement('div');
      el.className = 'sheepc-sheep' + (sp ? ' ' + sp : '');
      el.style.left = '50%';
      el.style.zIndex = '6';                 // shown in front of the fence, centred over it
      el.style.transform = 'translateX(-50%)';
      el.style.opacity = '0';
      el.innerHTML = SHEEP_SVG;
      track.appendChild(el);
      requestAnimationFrame(function () { el.style.opacity = '1'; });
      bump(sp ? { sp: sp } : null);
      setTimeout(function () { el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 700); }, 2600);
    }
    function startReduce() {
      if (reduceTimer) return;
      reduceTick();
      reduceTimer = setInterval(function () { if (running) reduceTick(); }, 4500);
    }
    function stopReduce() { clearInterval(reduceTimer); reduceTimer = null; }

    // ---- breathing pacer (4s in, 2s hold, 6s out) — labels are localised ----
    var BREATH = [
      { ms: 4000, phase: 'inhale' },
      { ms: 2000, phase: 'hold' },
      { ms: 6000, phase: 'exhale' }
    ];
    var breathOn = false, breathIdx = 0, breathTimer = null;
    function breathStep() {
      var i = breathIdx % BREATH.length, ph = BREATH[i];
      breathEl.dataset.phase = ph.phase;
      breathLabel.textContent = loc().breath[i];
      breathTimer = setTimeout(function () { breathIdx++; breathStep(); }, ph.ms);
    }
    function toggleBreath(on) {
      breathOn = on;
      breathEl.hidden = !on;
      stage.classList.toggle('is-breathing', on);
      clearTimeout(breathTimer);
      if (on) { breathIdx = 0; breathStep(); }
    }

    // ---- a soft lullaby: "Jajang Jajang, Uri Agi" (자장자장 우리 아기), the Korean
    // cradle song, played on a gentle, soft piano voice in place of white noise.
    // Lazy + gesture-started (no autoplay) and looped quietly via a small
    // look-ahead scheduler, so it stays in time even when the tab is throttled. ----
    var actx = null, lullGain = null, lullOn = false, pianoWave = null;
    var lullTimer = null, lullNextT = 0, lullStep = 0;
    var LULL_BEAT = 0.62;                                    // seconds per beat — slow and drowsy
    function noteHz(semisFromA4) { return 440 * Math.pow(2, semisFromA4 / 12); }
    // a warm pentatonic around C; the phrase rocks "ja-jang ja-jang" then answers
    // and drifts down to rest. [frequency (0 = rest), beats].
    var P = { c5: noteHz(3), d5: noteHz(5), e5: noteHz(7), g5: noteHz(10) };
    var LULL = [
      [P.e5,1],[P.e5,1],[P.c5,1],[P.c5,1],  [P.d5,1],[P.d5,1],[P.c5,2],   // 자장 자장  우리 아기
      [P.e5,1],[P.g5,1],[P.e5,1],[P.d5,1],  [P.c5,1],[P.d5,1],[P.c5,2],   // 잘도 잔다  우리 아기
      [0,2]                                                                // a breath before it begins again
    ];
    // a warm, soft piano spectrum: a strong fundamental with gently rolling-off
    // partials (no bright upper edge), built once and reused for every note.
    function buildPianoWave() {
      var amps = [0, 1, 0.42, 0.28, 0.16, 0.10, 0.06, 0.04, 0.03, 0.02];
      var real = new Float32Array(amps.length);
      var imag = new Float32Array(amps.length);
      for (var i = 0; i < amps.length; i++) imag[i] = amps[i];
      pianoWave = actx.createPeriodicWave(real, imag);
    }
    function ensureAudio() {
      if (actx) return true;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      try {
        actx = new Ctx();
        lullGain = actx.createGain(); lullGain.gain.value = 0;
        // a gentle lowpass rounds off the top end for a darker, softer voice
        var lp = actx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.0001;
        lullGain.connect(lp); lp.connect(actx.destination);
        buildPianoWave();
        return true;
      } catch (e) { actx = null; return false; }
    }
    // one piano note: the warm partial voice plus a soft sub-octave, with a
    // quiet, un-clicky attack and a long natural decay so notes ring and overlap
    function lullNote(freq, t, beats) {
      if (!freq) return;
      var dur = beats * LULL_BEAT;
      var g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.018);          // soft, gentle strike
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.6, dur * 1.4));
      g.connect(lullGain);
      var o1 = actx.createOscillator(); o1.setPeriodicWave(pianoWave); o1.frequency.value = freq;
      var o2 = actx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq / 2;
      var sub = actx.createGain(); sub.gain.value = 0.32; o2.connect(sub); sub.connect(g);
      o1.connect(g);
      o1.start(t); o2.start(t);
      o1.stop(t + dur + 0.5); o2.stop(t + dur + 0.5);
    }
    // keep ~0.7s of notes queued ahead, looping the melody indefinitely
    function lullSchedule() {
      var ahead = actx.currentTime + 0.7;
      while (lullNextT < ahead) {
        var note = LULL[lullStep];
        lullNote(note[0], lullNextT, note[1]);
        lullNextT += note[1] * LULL_BEAT;
        lullStep = (lullStep + 1) % LULL.length;
      }
    }
    function toggleLull(on) {
      if (on && !ensureAudio()) return false;
      lullOn = on;
      if (actx && actx.state === 'suspended') actx.resume();
      if (on) {
        lullStep = 0;                                       // restart from the top of the phrase
        lullNextT = actx.currentTime + 0.12;
        lullGain.gain.cancelScheduledValues(actx.currentTime);
        lullGain.gain.setTargetAtTime(0.13, actx.currentTime, 0.5);    // soft, eased in
        lullSchedule();
        lullTimer = setInterval(lullSchedule, 220);
      } else {
        clearInterval(lullTimer); lullTimer = null;
        if (lullGain) lullGain.gain.setTargetAtTime(0, actx.currentTime, 0.5);
      }
      return true;
    }

    // ---- controls ----
    function setPressed(btn, on) { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    mount.querySelector('.sheepc-controls').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;

      if (act === 'play') {
        running = !running;
        btn.innerHTML = running ? loc().btn.pause : loc().btn.resume;
        setPressed(btn, running);
        stage.classList.toggle('is-paused', !running);   // freeze the tortoise too
        lastTs = 0;                          // avoid a dt jump on resume
        if (reduceMQ.matches) { running ? startReduce() : stopReduce(); }
      } else if (act === 'breathe') {
        toggleBreath(!breathOn); setPressed(btn, breathOn);
      } else if (act === 'sound') {
        var want = btn.getAttribute('aria-pressed') !== 'true';
        if (toggleLull(want)) setPressed(btn, want);
      } else if (act === 'reset') {
        count = 0; numEl.textContent = '0'; applyDepth();
        setQuip(loc().reset);
      }
    });

    // re-localise the live scene when the page language changes (see the page's
    // language toggle, which dispatches a 'sheeplang' event with the new code)
    var unitEl = mount.querySelector('.sheepc-unit');
    function applyLang() {
      var playBtn = mount.querySelector('[data-act="play"]');
      var breatheBtn = mount.querySelector('[data-act="breathe"]');
      var lullBtn = mount.querySelector('[data-act="sound"]');
      var resetBtn = mount.querySelector('[data-act="reset"]');
      var srEl = mount.querySelector('.sheepc-sr');
      if (unitEl) unitEl.textContent = loc().unit;
      if (playBtn) playBtn.innerHTML = running ? loc().btn.pause : loc().btn.resume;
      if (breatheBtn) breatheBtn.innerHTML = loc().btn.breathe;
      if (lullBtn) lullBtn.innerHTML = loc().btn.lull;
      if (resetBtn) resetBtn.innerHTML = loc().btn.reset;
      if (srEl) srEl.textContent = loc().sr;
      if (breathOn) breathLabel.textContent = loc().breath[breathIdx % BREATH.length];
      setQuip(loc().intro);
    }
    window.addEventListener('sheeplang', function (e) {
      lang = (e && e.detail && I18N[e.detail]) ? e.detail : sheepLang();
      applyLang();
    });

    // ---- go ----
    setQuip(loc().intro);
    if (reduceMQ.matches) startReduce();
    else rafId = requestAnimationFrame(frame);

    // if the user flips the reduced-motion setting mid-session, switch modes
    function onMQ() {
      if (reduceMQ.matches) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        sheep.forEach(function (s) { s.el.remove(); }); sheep = [];
        if (running) startReduce();
      } else {
        stopReduce();
        if (!rafId) { lastTs = 0; rafId = requestAnimationFrame(frame); }
      }
    }
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onMQ);
    else if (reduceMQ.addListener) reduceMQ.addListener(onMQ);
  }

  function boot() {
    var nodes = document.querySelectorAll('[data-sheep-counter]');
    for (var i = 0; i < nodes.length; i++) init(nodes[i]);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
