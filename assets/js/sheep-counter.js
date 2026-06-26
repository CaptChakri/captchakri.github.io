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
      '<g class="sg-look"><circle cx="13" cy="23" r="1.7"/><circle cx="21" cy="23" r="1.7"/></g>',  // forward-facing pair, shown only while breathing
      '<g class="sg-shades"><rect x="8" y="20" width="13" height="5" rx="1.5" fill="#10131b"/>',
        '<rect x="7" y="21" width="2" height="3" fill="#10131b"/></g>',
      '<g class="sg-pillow"><rect x="2" y="30" width="16" height="9" rx="3" fill="#cfe0ff" stroke="#9fb6e6" stroke-width="1"/></g>',
      '<g class="sg-crown"><path d="M40 9 l3 6 l4 -5 l4 5 l3 -6 l-1 8 l-16 0 z" fill="#ffce54" stroke="#c79a2e" stroke-width="0.8"/></g>',
    '</svg>'
  ].join('');

  // the site's tortoise (its avatar), side view heading LEFT to match the sheep.
  // This is a faithful 2-D translation of the canvas avatar the main page paints
  // (drawTortoiseBody in descent-engine.js) so the two read as the SAME creature:
  // same muted-olive palette, same wide low dome, same neat head on a short thick
  // neck. Coordinates are that drawing's local geometry (shell centred near 64,40,
  // s≈40) mirrored to head-LEFT. The head sits in its own group so it can crane up
  // to "peek". Far legs + tail sit BEHIND the shell; the near legs and head come
  // over its front rim — exactly the layering the canvas version uses.
  var TORT_SVG = [
    '<svg viewBox="0 0 120 76" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      '<path d="M103.2 40 L112.8 44.8 L100.8 47.2 Z" fill="#6d7e4a"/>',          // tail stub (limb colour)
      '<g class="tort-legs" fill="#8a9b63">',                                    // stubby limbs: near pair skin, far pair shaded
        '<g class="tort-leg tort-leg-b">',                                       // hind pair — strides a half-cycle off the fore, like the main-page walk
          '<ellipse cx="88" cy="51.6" rx="3.96" ry="9.2" fill="#6d7e4a" opacity="0.85"/>',  // far hind
          '<ellipse cx="86" cy="56.4" rx="4.4" ry="10"/>',                       // near hind
        '</g>',
        '<g class="tort-leg tort-leg-f">',                                       // fore pair (toward the head)
          '<ellipse cx="48" cy="51.6" rx="3.96" ry="9.2" fill="#6d7e4a" opacity="0.85"/>',  // far fore
          '<ellipse cx="44" cy="56.4" rx="4.4" ry="10"/>',                       // near fore
        '</g>',
      '</g>',
      '<path d="M104 46.4 Q104 13.6 64 8.8 Q24 13.6 24 46.4 Q64 53.6 104 46.4 Z" fill="#5f7a3e"/>',  // carapace — the wide, low olive dome
      '<path d="M104 46.4 Q64 53.6 24 46.4 Q64 48 104 46.4 Z" fill="#46602c"/>',  // plastron rim (darker underside)
      '<path d="M104 46.4 Q104 13.6 64 8.8 Q24 13.6 24 46.4" fill="none" stroke="#374d22" stroke-width="2" stroke-linejoin="round"/>',  // shell edge
      '<g stroke="rgba(40,55,25,.5)" stroke-width="1.8" fill="none" stroke-linecap="round">',  // scute lines
        '<path d="M96.8 32.8 Q64 17.6 31.2 32.8"/>',
        '<path d="M84 44.8 Q78.4 25.6 72 12.8"/>',
        '<path d="M70.4 44.8 Q68.6 25.6 66.6 12.8"/>',
        '<path d="M56.8 44.8 Q58.8 25.6 61.1 12.8"/>',
        '<path d="M43.2 44.8 Q49 25.6 55.7 12.8"/>',
      '</g>',
      '<g class="tort-head">',                                                   // head + short thick neck, over the shell's front rim
        '<path d="M44 40.8 L19.2 39.2" fill="none" stroke="#8a9b63" stroke-width="13.6" stroke-linecap="round"/>',
        '<ellipse cx="19.2" cy="39.2" rx="12" ry="8.8" fill="#8a9b63"/>',
        '<circle cx="15.2" cy="37.2" r="2.4" fill="#0a140a"/>',
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

  // a legendary dragon — the rarest visitor, borrowed in spirit from the descent
  // scene's puzzle-gated dragons. It only "passes by" high in the sky (never down
  // in the meadow), a sinuous silhouette with a slow-flapping bat wing, an amber
  // eye, and a horn. Side view, facing LEFT (it flies right -> left like the flock);
  // the .face-right variant mirrors it. The wing sits in its own group so it flaps.
  var DRAGON_SVG = [
    '<svg viewBox="0 0 150 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      // sinuous body + neck + long tapering tail, head at the left
      '<path class="drg-skin" d="M12 52 C8 48 10 44 16 44 C22 44 26 48 34 50 C50 54 70 50 88 52 C108 54 126 50 140 42 C146 39 150 40 148 44 C140 54 122 58 104 58 C86 58 70 60 54 60 C40 60 24 60 16 56 C13 55 12 54 12 52 Z"/>',
      // hind + fore legs, tucked for flight
      '<path class="drg-skin" d="M84 58 q3 11 -3 16 q-2 -9 -8 -11 z"/>',
      '<path class="drg-skin" d="M54 60 q1 11 -5 15 q-1 -9 -6 -11 z"/>',
      // head: snout + lower jaw, over the neck
      '<path class="drg-skin" d="M16 46 C10 44 6 47 4 50 C8 51 11 51 14 51 C10 53 12 56 16 56 C20 55 22 52 22 50 C22 47 19 46 16 46 Z"/>',
      '<path class="drg-skin" d="M20 44 L24 34 L26 45 Z"/>',          // horn
      // the flapping membrane wing, rising from the shoulder
      '<g class="drg-wings">',
        '<path class="drg-wing" d="M50 50 C58 26 76 12 98 8 C92 18 94 24 100 24 C108 18 118 16 126 18 C116 26 112 32 114 38 C110 34 104 34 100 38 C92 44 80 48 66 52 C60 53 54 53 50 52 Z"/>',
      '</g>',
      '<circle class="drg-eye" cx="12" cy="49" r="1.8"/>',
    '</svg>'
  ].join('');

  // a sleeping farmstead on the horizon — a gambrel-roofed barn with a grain silo
  // beside it and a round hay bale at its foot. A flat dark night silhouette; the
  // only motion is the warm hayloft window's slow glow (.barn-glow, animated in
  // CSS). Sits far off at the grass line, behind the fence and flock. viewBox 130x92.
  var BARN_SVG = [
    '<svg viewBox="0 0 130 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      // the grain silo, off to the barn's right
      '<rect x="96" y="34" width="20" height="54" rx="1.5" fill="#2a2f3a"/>',
      '<path d="M96 34 Q106 21 116 34 Z" fill="#333a48"/>',                            // domed cap
      '<rect x="96" y="34" width="3.5" height="54" fill="rgba(150,170,220,0.14)"/>',   // moonlit edge
      '<path d="M96 49 H116 M96 63 H116 M96 77 H116" stroke="rgba(0,0,0,0.28)" stroke-width="1"/>',   // corrugation bands
      // the barn body
      '<rect x="18" y="42" width="68" height="46" fill="#341e21"/>',
      '<rect x="18" y="42" width="3.5" height="46" fill="rgba(150,170,220,0.10)"/>',   // moonlit corner
      // the gambrel (two-pitch) roof, with a faint moonlit ridge
      '<path d="M13 43 L26 27 L52 15 L78 27 L91 43 Z" fill="#48282c"/>',
      '<path d="M13 43 L26 27 L52 15 L78 27 L91 43" fill="none" stroke="rgba(150,170,220,0.16)" stroke-width="1.2" stroke-linejoin="round"/>',
      // the big double barn doors, with a plank seam and the classic X-brace
      '<rect x="40" y="58" width="24" height="30" fill="#241417"/>',
      '<rect x="40" y="58" width="24" height="30" fill="none" stroke="rgba(150,162,196,0.22)" stroke-width="1.2"/>',
      '<path d="M52 58 V88 M40 58 L64 88 M64 58 L40 88" stroke="rgba(150,162,196,0.18)" stroke-width="1.1"/>',
      // the warm hayloft window up in the gable — a soft halo (it glows) over a lit pane
      '<g class="barn-glow"><rect x="45" y="30" width="14" height="14" rx="2" fill="rgba(255,201,120,0.32)"/></g>',
      '<rect x="48.5" y="33.5" width="7" height="7" rx="1" fill="#ffd591"/>',
      '<path d="M52 33.5 V40.5 M48.5 37 H55.5" stroke="#3a2a16" stroke-width="0.8"/>',
      // a round hay bale leaning at the barn\'s foot
      '<ellipse cx="22" cy="86" rx="12" ry="7.5" fill="#2c2820"/>',
      '<path d="M12 84 Q22 78 32 84" fill="none" stroke="rgba(150,170,220,0.12)" stroke-width="1"/>',
      '<path d="M16 86 Q22 82.5 28 86 M18 89 Q22 86 26 89" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/>',
    '</svg>'
  ].join('');

  // a water-pumping windmill — the kind that waters a flock — off to the left: a
  // dark lattice tower with a directional tail and a wheel of blades that turns
  // slowly (.mill-fan spins in CSS, pivoting on the hub at 32,34). The blades are
  // generated in a loop so the wheel reads full without a wall of hand-written rects.
  var WINDMILL_SVG = (function () {
    var blades = '';
    for (var b = 0; b < 12; b++) {
      blades += '<rect x="31.1" y="20.5" width="1.8" height="11" rx="0.9" fill="#212a3c" transform="rotate(' + (b * 30) + ' 32 34)"/>';
    }
    return [
      '<svg viewBox="0 0 64 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
        // the lattice tower: two tapering legs, rungs, and X cross-braces
        '<path d="M16 118 L28 40 M48 118 L36 40" fill="none" stroke="#1b2334" stroke-width="2.4" stroke-linecap="round"/>',
        '<path d="M18.8 100 H45.2 M22.2 78 H41.8 M25.5 56 H38.5 M27 40 H37" fill="none" stroke="#1b2334" stroke-width="1.5"/>',
        '<path d="M16 118 L45.2 100 M48 118 L18.8 100 M18.8 100 L41.8 78 M45.2 100 L22.2 78 M22.2 78 L38.5 56 M41.8 78 L25.5 56" fill="none" stroke="#1b2334" stroke-width="1.1" opacity="0.85"/>',
        '<path d="M16 118 L28 40" fill="none" stroke="rgba(150,170,220,0.12)" stroke-width="1"/>',   // faint moonlight down the near leg
        // the directional tail vane (static — it points the wheel into the breeze)
        '<path d="M32 34 H53" fill="none" stroke="#1b2334" stroke-width="1.6"/>',
        '<path d="M49 30 L58 33 L58 41 L49 38 Z" fill="#222b3d"/>',
        // the turning wheel: a hub, a faint rim, and the radiating blades
        '<g class="mill-fan">',
          '<circle cx="32" cy="34" r="14" fill="none" stroke="rgba(150,170,220,0.13)" stroke-width="1"/>',
          blades,
          '<circle cx="32" cy="34" r="3.4" fill="#2a3346"/>',
        '</g>',
      '</svg>'
    ].join('');
  })();

  // the paddock fence wraps the farm on the RIGHT as a flat-perspective half circle.
  // It is drawn in TWO depth layers off ONE shared ellipse so the sheep can't read as
  // walking "under" it:
  //   • the PEN (a faded arc curving from the gate round behind the barn) sits in the
  //     mid-ground at z-2, BEHIND the flock — sheep pass cleanly in front of it.
  //   • the GATE (the broken centre span, top rail snapped out) sits at z-4 in FRONT,
  //     the one stretch a sheep rises BEHIND (z-3) and lands IN FRONT of (z-6), which
  //     is the occlusion that reads as hopping OVER. The two meet at the same post.
  // Near posts (the gate) are tall and bold; the arc foreshortens — short, dim, and
  // tucked toward the horizon behind the barn — so the curve reads with real depth.
  var FENCE_PARTS = (function () {
    var cx = 180, cy = 64, rx = 150, ry = 33;      // viewBox-360x100 ellipse, bowing out to the RIGHT (gate centred at x=180 = stage 50%, where sheep hop)
    var aGateL = 104, aGateR = 70, aEnd = -9;      // gate spans the centre (104..70deg); the arc runs 70..-9deg
    var brkLo = 78, brkHi = 102;                   // the broken top-rail span, symmetric about the centre (no post dead-centre)
    function P(a) {
      var rad = a * Math.PI / 180;
      var y = cy + ry * Math.sin(rad), depth = (Math.sin(rad) + 1) / 2, h = 3 + 18 * depth;   // near posts tall, far posts short
      return { a: a, x: cx + rx * Math.cos(rad), y: y, depth: depth,
               r1: y - h, r2: y - h * 0.60, r3: y - h * 0.22, top: y - h - 3, base: y + 1.5 };
    }
    function ln(x1, y1, x2, y2, col, w, op) {
      return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
             '" y2="' + y2.toFixed(1) + '" stroke="' + col + '" stroke-width="' + w.toFixed(2) +
             '" opacity="' + op.toFixed(2) + '"/>';
    }
    // build a run of posts + three rails over an angle range; fadeFn(t in 0..1) dims it,
    // brk (or null) skips the top rail across a broken span
    function seg(lo, hi, n, fadeFn, brk) {
      var pts = [], i;
      for (i = 0; i <= n; i++) pts.push(P(lo + (hi - lo) * (i / n)));
      var posts = '', rails = '', top = '';
      for (i = 0; i < pts.length; i++) {
        var p = pts[i], f = fadeFn(i / n);
        posts += ln(p.x, p.top, p.x, p.base, '#5a4128', 1.0 + 1.5 * p.depth, (0.2 + 0.8 * p.depth) * f);
        if (i > 0) {
          var q = pts[i - 1], d = Math.min(p.depth, q.depth), f2 = fadeFn((i - 0.5) / n);
          var op = (0.16 + 0.82 * d) * f2, w = 1.0 + 1.3 * d;
          rails += ln(q.x, q.r2, p.x, p.r2, '#5e4630', w, op) + ln(q.x, q.r3, p.x, p.r3, '#5a4228', w, op);
          var midA = (p.a + q.a) / 2;
          if (!brk || midA < brk.lo || midA > brk.hi) top += ln(q.x, q.r1, p.x, p.r1, '#6a4f34', w, op);
        }
      }
      return rails + top + posts;
    }
    function wrap(inner) {
      return '<svg viewBox="0 0 360 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
             '<g stroke-linecap="round">' + inner + '</g></svg>';
    }
    // the gate: full-strength, with the broken middle + splintered stubs at each break
    var bl = P(brkHi), br = P(brkLo);
    var spl = '<path d="M' + bl.x.toFixed(1) + ' ' + (bl.r1 - 2).toFixed(1) + ' l-5 2.4 l5 2 z" fill="#4d3823" opacity="0.9"/>' +
              '<path d="M' + br.x.toFixed(1) + ' ' + (br.r1 - 2).toFixed(1) + ' l5 2.4 l-5 2 z" fill="#4d3823" opacity="0.9"/>';
    var gate = wrap(seg(aGateL, aGateR, 6, function () { return 1; }, { lo: brkLo, hi: brkHi }) + spl);
    // the pen arc: starts where the gate ends and fades into the night behind the barn
    var pen = wrap(seg(aGateR, aEnd, 16, function (t) { return 0.85 * (1 - t) + 0.18; }, null));
    return { gate: gate, pen: pen };
  })();
  var FENCE_SVG = FENCE_PARTS.gate;
  var PEN_SVG = FENCE_PARTS.pen;

  // a forest on the LEFT — a stand of dark pines of varying height, receding into the
  // night. Flat silhouettes with a faint moonlit left edge; the owl roosts atop one.
  // Generated from a small table so the cluster reads full without a wall of paths.
  var FOREST_SVG = (function () {
    // each pine: [centre x, base y, height, half-width, fill, opacity]
    var trees = [
      [150, 128, 58, 20, '#0c160f', 0.85],
      [44, 130, 88, 30, '#0e1a12', 1.0],
      [96, 132, 104, 34, '#101e14', 1.0],
      [16, 131, 70, 24, '#0c160f', 0.92],
      [128, 133, 84, 28, '#0e1a12', 1.0],
      [186, 130, 64, 22, '#0a130d', 0.8]
    ];
    function pine(cxp, by, ht, hw, fill, op) {
      var top = by - ht, t = '';
      // trunk
      t += '<rect x="' + (cxp - hw * 0.1).toFixed(1) + '" y="' + (by - ht * 0.16).toFixed(1) +
           '" width="' + (hw * 0.2).toFixed(1) + '" height="' + (ht * 0.18).toFixed(1) + '" fill="#241a12" opacity="' + op + '"/>';
      // three stacked tiers of foliage (widest at the bottom)
      var tiers = [[0.0, 1.0, 0.46], [0.30, 0.78, 0.40], [0.60, 0.54, 0.42]];
      for (var k = 0; k < tiers.length; k++) {
        var ty = top + ht * tiers[k][0], w = hw * tiers[k][1], th = ht * tiers[k][2];
        t += '<path d="M' + cxp.toFixed(1) + ' ' + ty.toFixed(1) +
             ' L' + (cxp + w).toFixed(1) + ' ' + (ty + th).toFixed(1) +
             ' L' + (cxp - w).toFixed(1) + ' ' + (ty + th).toFixed(1) + ' Z" fill="' + fill + '" opacity="' + op + '"/>';
      }
      // faint moonlight down the left flank
      t += '<path d="M' + cxp.toFixed(1) + ' ' + top.toFixed(1) + ' L' + (cxp - hw * 0.54).toFixed(1) +
           ' ' + by.toFixed(1) + '" stroke="rgba(150,170,220,0.10)" stroke-width="1.5" fill="none"/>';
      return t;
    }
    var body = '';
    for (var i = 0; i < trees.length; i++) body += pine.apply(null, trees[i]);
    return '<svg viewBox="0 0 210 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
  })();

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
      dragon: 'Something vast just crossed the moon — the flock scatters wide-eyed and bolts for the fence. Then it is gone. You are safe; drift on.',
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
      dragon: '방금 무언가 거대한 것이 달을 가로질렀어요. 양들은 못 본 척하네요. 당신도 그러세요.',
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

  // a count is a Fibonacci number iff 5n^2 +/- 4 is a perfect square
  function isFib(n) {
    function sq(x) { var r = Math.round(Math.sqrt(x)); return r * r === x; }
    return n >= 0 && (sq(5 * n * n + 4) || sq(5 * n * n - 4));
  }
  // the dragon flies past at sheep #9, then at every Fibonacci milestone from 20 up
  // (21, 34, 55, 89, 144, ...) — a rare, growing-rarer legendary visitor.
  function dragonAt(n) { return n === 9 || (n >= 20 && isFib(n)); }

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
        '<div class="sheepc-forest">' + FOREST_SVG + '</div>' +    // a stand of pines on the LEFT
        '<div class="sheepc-pen">' + PEN_SVG + '</div>' +          // the pen arc wrapping the farm (behind the flock)
        '<div class="sheepc-farm">' +                   // the farmstead on the RIGHT: barn, silo, windmill
          '<div class="sheepc-windmill">' + WINDMILL_SVG + '</div>' +
          '<div class="sheepc-barn">' + BARN_SVG + '</div>' +
        '</div>' +
        '<div class="sheepc-mist"></div>' +             // low fog blending the turf into the night sky (drifts in front of the farm)
        '<div class="sheepc-bio"></div>' +              // fireflies drift over the grass
        '<div class="sheepc-grass-near"></div>' +       // taller foreground blades, for depth at the base
        '<div class="sheepc-fence">' + FENCE_SVG + '</div>' +     // the half-circle paddock fence; its broken middle is where the flock hops
        '<div class="sheepc-owl">' + OWL_SVG + '</div>' + // the night watcher, perched
        '<div class="sheepc-track"></div>' +
        '<div class="sheepc-breath" data-breath hidden>' +
          '<div class="sheepc-breath-dial">' +
            '<div class="sheepc-breath-ring"></div>' +
            '<svg class="sheepc-breath-progress" viewBox="0 0 100 100" aria-hidden="true">' +
              '<circle class="sheepc-breath-track" cx="50" cy="50" r="46"/>' +
              '<circle class="sheepc-breath-bar" cx="50" cy="50" r="46" data-breath-bar/>' +
            '</svg>' +
            '<div class="sheepc-breath-count" data-breath-count>4</div>' +
          '</div>' +
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
    var breathCount = mount.querySelector('[data-breath-count]');
    var breathBar = mount.querySelector('[data-breath-bar]');

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
      var jump = Math.random() < 0.6;              // mostly it hops the fence now (like the flock); now and then it just peeks
      var fenceMid = w * 0.5 - 31;                 // the tortoise (62px wide) centred over the fence
      var el = document.createElement('div');
      el.className = 'sheepc-tortoise' + (rightward ? ' face-right' : '');
      el.innerHTML = TORT_SVG;
      el.style.setProperty('--tStart', (rightward ? -90 : w + 50) + 'px');
      el.style.setProperty('--tEnd', (rightward ? w + 50 : -90) + 'px');
      var dur;
      if (jump) {
        // crest the rail dead centre: rise BEHIND it (z 3), flip to the near side (z 6)
        // at the apex and come down in front — the same occlusion trick the sheep use.
        var land = fenceMid + (rightward ? 26 : -26);          // touch down just past the fence, toward the exit
        el.style.setProperty('--tMid', fenceMid.toFixed(0) + 'px');
        el.style.setProperty('--tApex', ((fenceMid + land) / 2).toFixed(0) + 'px');
        el.style.setProperty('--tLand', land.toFixed(0) + 'px');
        el.style.setProperty('--tHop', tortHopPx.toFixed(0) + 'px');
        dur = rint(15000, 19000);
        el.style.animation = 'sheepcTortJump ' + dur + 'ms ease-in-out forwards';
      } else {
        el.style.setProperty('--tMid', (fenceMid + (Math.random() * 60 - 30)).toFixed(0) + 'px');   // pause spot, near centre
        dur = rint(20000, 26000);                  // slow — it's a tortoise
        el.style.animation = 'sheepcTortRoam ' + dur + 'ms linear forwards';
        var head = el.querySelector('.tort-head');
        if (head) head.style.animation = 'sheepcTortPeek ' + dur + 'ms ease-in-out forwards';
      }
      track.appendChild(el);
      tortEl = el;
      el.addEventListener('animationend', function (e) {   // roam/jump end (not the head's peek)
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

    // ---- the legendary dragon: it "passes by" high in the sky at Fibonacci
    // milestones (see dragonAt). Pure flight, so reduced-motion sits this one out. ----
    function spawnDragon() {
      if (reduceMQ.matches) return;                       // motion-heavy; honour the preference
      if (track.querySelector('.sheepc-dragon')) return;  // only ever one aloft
      var w = stageW(), rightward = Math.random() < 0.5;
      var flyDur = rint(7000, 10000);
      var el = document.createElement('div');
      el.className = 'sheepc-dragon' + (rightward ? ' face-right' : '');
      el.innerHTML = '<div class="drg-bob">' + DRAGON_SVG + '</div>';
      el.style.top = rint(10, 28) + '%';                  // high — clear of the fence and flock
      var from = rightward ? -170 : w + 170, to = rightward ? w + 170 : -170;
      el.style.setProperty('--dStart', from + 'px');
      el.style.setProperty('--dEnd', to + 'px');
      el.style.animation = 'sheepcDragonFly ' + flyDur + 'ms linear forwards';
      track.appendChild(el);
      el.addEventListener('animationend', function (e) { if (e.target === el) { el.remove(); if (dragon && dragon.el === el) dragon = null; } });
      // remember its flight so the frame loop can read where it is right now: the
      // closer the beast passes over a sheep, the harder that sheep panics (its
      // CSS flight is linear, so position is from + (to-from)*progress). t advances
      // on the same dt as the flock, so a pause freezes the menace too.
      dragon = { el: el, from: from, to: to, t: 0, dur: flyDur };
      setQuip(loc().dragon); sinceQuip = 0;               // a one-liner for the sighting
    }

    // the sky deepens at gentle milestones, pulling you further into the night
    function applyDepth() {
      stage.classList.toggle('is-deep-1', count >= 8);
      stage.classList.toggle('is-deep-2', count >= 20);
      stage.classList.toggle('is-deep-3', count >= 40);
    }

    // ---- tunables ----
    var PACE_MIN = 2.4, PACE_MAX = 6.0;   // seconds between sheep (grows with count)
    var BASE_DUR = 6.0, EXTRA_DUR = 4.5;  // seconds to cross (grows with count)
    var SHEEP_SPEED = 130;                // px/s ceiling so a wide (e.g. full-screen) stage doesn't race the flock across — kept near the calm phone pace (~90px/s) so big screens stay soothing rather than streaking
    var HOP_SPAN = 78;                    // px half-width of the fence-clearing arc — FIXED, so the leap is the same size on any screen
    var GATHER = 30;                      // px of ground on each side of the arc: the crouch (before) and the landing absorb (after)
    var SPOOK_RUN = 1.9;                  // while a dragon is overhead the spooked flock bolts this much faster

    var count = 0, running = true;
    var sheep = [], lastTs = 0, nextSpawn = 0, sinceQuip = 0;
    var specialIn = rint(4, 7);
    var dimsW = 0, hop = 70, tortHopPx = 80;
    var rafId = null, reduceTimer = null;
    var dragon = null, stageSpooked = false;    // the dragon aloft, tracked so each sheep's fright can scale with its proximity

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
      // the tortoise sits a touch lower than the sheep (15% vs 17%) and is shorter, so it
      // needs to rise a little further to crest the same rail — clears the post tops by ~6px.
      tortHopPx = Math.max(64, Math.min(120, r.height * 0.04 + 56));
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
      if (s && s.sp) { setQuip(loc().specials[s.sp](count)); sinceQuip = 0; }
      else {
        sinceQuip++;
        if (sinceQuip >= 3 && Math.random() < 0.5) {
          setQuip(pick(loc().quips).replace(/\{n\}/g, count));
          sinceQuip = 0;
        }
      }
      if (dragonAt(count)) spawnDragon();    // a dragon sighting trumps the usual quip
    }

    function spawn() {
      var sp = null;
      if (--specialIn <= 0) { sp = pick(SPECIAL_CLASSES); specialIn = rint(5, 9); }
      var el = document.createElement('div');
      el.className = 'sheepc-sheep' + (sp ? ' ' + sp : '');
      el.style.zIndex = '3';                 // behind the fence (z 4) on the way up
      el.innerHTML = SHEEP_SVG;
      track.appendChild(el);
      // time to cross grows with count (drowsiness) — but never let it cross faster than
      // SHEEP_SPEED, so on a wide stage the sheep amble at the same pace as on a phone
      // instead of streaking across (the duration stretches with the extra width).
      var base = (BASE_DUR + Math.min(count, 40) / 40 * EXTRA_DUR) * (0.9 + Math.random() * 0.2);
      var travel = (dimsW || stage.clientWidth || 600) + 160;
      var dur = Math.max(base, travel / SHEEP_SPEED);
      sheep.push({ el: el, p: 0, dur: dur, jumped: false, sp: sp, spooked: false, air: false });
    }

    function frame(ts) {
      rafId = requestAnimationFrame(frame);
      if (!lastTs) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!running) return;
      if (dt > 0.1) dt = 0.1;            // clamp after a tab-switch stall

      // while the breathing pacer runs, the flock stops on the field and watches you
      // (see the per-sheep freeze below), so hold off spawning new arrivals too
      if (!breathOn) {
        nextSpawn -= dt;
        if (nextSpawn <= 0) {
          spawn();
          var pace = PACE_MIN + Math.min(count, 50) / 50 * (PACE_MAX - PACE_MIN);
          nextSpawn = pace * (0.85 + Math.random() * 0.3);
          if (Math.random() < 0.06) spawn();   // the odd pair, trotting together
        }
      }

      var w = dimsW || stage.clientWidth || 600;
      var startX = w + 40, endX = -120;
      var fenceC = w * 0.5;                          // the fence is centred on the stage
      // ---- the dragon's menace falls off with distance. Read where it is right now
      // and let each sheep's fright scale with how near that column passes — a wave of
      // panic that travels across the flock under the dragon, fiercest right below it. ----
      var SPOOK_REACH = w * 0.55;                    // a sheep this far (px) from the dragon's column feels nothing
      var dragonX = null;                            // dragon centre in track px, or null when none aloft
      if (dragon) {
        dragon.t += dt * 1000;
        if (dragon.t >= dragon.dur) dragon = null;
        else dragonX = dragon.from + (dragon.to - dragon.from) * (dragon.t / dragon.dur) + 70;  // +70 = half its 140px width
      }
      // the owl perches near centre, so it stares (and the scene tints) by how close the dragon is to mid-stage
      var stageInten = dragonX == null ? 0 : Math.max(0, 1 - Math.abs(dragonX - fenceC) / SPOOK_REACH);
      var stageOn = stageInten > 0.04;
      if (stageOn !== stageSpooked) { stageSpooked = stageOn; stage.classList.toggle('is-spooked', stageOn); }
      stage.style.setProperty('--spook', stageInten.toFixed(3));
      for (var i = sheep.length - 1; i >= 0; i--) {
        var s = sheep[i];
        var x = startX + (endX - startX) * s.p;
        // fright = how near the dragon's column is to this sheep (0 far … 1 right overhead)
        var inten = dragonX == null ? 0 : Math.max(0, 1 - Math.abs((x + 35) - dragonX) / SPOOK_REACH);
        var spooked = inten > 0.04;
        if (spooked !== s.spooked) { s.spooked = spooked; s.el.classList.toggle('is-spooked', spooked); }
        if (spooked) s.el.style.setProperty('--spook', inten.toFixed(3));   // CSS scales shiver + wide eyes by this
        // the hop is keyed to how far the sheep's CENTRE is from the fence (in px), not to its
        // progress across the stage — so the arc is the same physical size on a phone and on a
        // full-screen monitor, instead of stretching wider (and faster) the wider the stage gets.
        var c = (x + 35) - fenceC;
        var airborne = c > -HOP_SPAN && c < HOP_SPAN;   // off the ground, mid-hop
        // breathing stops the flock — but a sheep caught mid-jump keeps going until it has
        // finished its arc and landed, so none ever freeze in mid-air
        if (!breathOn || airborne) {
          s.p += dt / s.dur * (1 + (SPOOK_RUN - 1) * inten);   // the closer the dragon, the harder they bolt
          x = startX + (endX - startX) * s.p;
          c = (x + 35) - fenceC;
        }
        // ---- the hop: a believable little leap rather than a slide over a bump. The
        // sheep (1) GATHERS — a quick crouch + squash a beat before it springs, (2) flies
        // a ballistic arc, stretching tall as it leaves the ground, tucking its legs at
        // the float, then reaching them out to land, and (3) ABSORBS the touchdown with a
        // squash-and-recover. y = arc height, rot = pitch along the flight, sx/sy = the
        // squash-&-stretch, --legF/--legB pose the legs (read by CSS while .is-airborne). ----
        var y = 0, rot = 0, sx = 1, sy = 1, air = false;
        if (c >= HOP_SPAN && c < HOP_SPAN + GATHER) {
          var g = (HOP_SPAN + GATHER - c) / GATHER;        // 0 entering the zone ... 1 at the lip, about to launch
          g *= g;                                          // bite late, so the dip lands right before takeoff
          y = 5 * g;                                       // sink into the crouch
          sy = 1 - 0.13 * g; sx = 1 + 0.10 * g;            // squash down, spread out
          rot = -3 * g;                                    // tip the nose up to push off
        } else if (c > -HOP_SPAN && c < HOP_SPAN) {
          air = true;
          var u = (c + HOP_SPAN) / (2 * HOP_SPAN);         // 1 at takeoff (right) ... 0 at landing (left)
          y = -Math.sin(u * Math.PI) * hop;                // the ballistic arc, apex over the rail
          var spd = Math.abs(Math.cos(u * Math.PI));       // vertical speed: 1 leaving/meeting the ground ... 0 at the float
          sy = 1 + 0.15 * spd; sx = 1 - 0.09 * spd;        // stretch tall & thin moving fast, soften to a hang at the apex
          rot = -(c / HOP_SPAN) * 9;                       // pitch along the path: nose-up climbing, nose-down falling
          var tuck = Math.sin(u * Math.PI);                // 0 at the ends ... 1 at the float
          s.el.style.setProperty('--legF', (26 - 34 * tuck).toFixed(1) + 'deg');   // front legs reach out, then gather in
          s.el.style.setProperty('--legB', (-26 + 34 * tuck).toFixed(1) + 'deg');  // hind legs trail, then gather in
        } else if (c <= -HOP_SPAN && c > -HOP_SPAN - GATHER) {
          var h = (c + HOP_SPAN + GATHER) / GATHER;        // 1 just landed ... 0 recovered
          y = 3 * h;                                       // dip as the legs soak up the impact
          sy = 1 - 0.15 * h; sx = 1 + 0.12 * h;            // compress on contact, then spring back
        }
        if (air !== s.air) { s.air = air; s.el.classList.toggle('is-airborne', air); }
        s.el.style.transform =
          'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) +
          'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
        // once it has landed and is standing still on the field, the sheep turns to watch you —
        // forward-facing eyes and stilled legs (.is-watching); it keeps trotting until then
        s.el.classList.toggle('is-watching', breathOn && !airborne);
        // crossing the fence centre, flip the sheep IN FRONT of the fence so it descends on the
        // near side — rising behind + falling in front is what reads as hopping OVER the rails
        if (!s.jumped && c <= 0) { s.jumped = true; s.el.style.zIndex = '6'; bump(s); }
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

    // ---- breathing pacer (4s in, 2s hold, 6s out) — labels are localised, with a
    // live countdown in the middle: the ring drains and the number ticks down over
    // each phase so you can see exactly how long to keep going. Driven per-frame so
    // the arc and the digits stay in lockstep. ----
    var BREATH = [
      { ms: 4000, phase: 'inhale' },
      { ms: 7000, phase: 'hold' },
      { ms: 8000, phase: 'exhale' }
    ];
    var BREATH_CIRC = 2 * Math.PI * 46;                 // r=46 in the SVG's 0..100 viewBox
    if (breathBar) breathBar.style.strokeDasharray = BREATH_CIRC.toFixed(2);
    var breathOn = false, breathIdx = 0, breathRAF = null, breathPhaseStart = 0;
    function breathStep() {
      var i = breathIdx % BREATH.length, ph = BREATH[i];
      breathEl.dataset.phase = ph.phase;
      breathLabel.textContent = loc().breath[i];
      breathPhaseStart = 0;                             // the first tick stamps this phase's start
      breathRAF = requestAnimationFrame(breathTick);
    }
    function breathTick(ts) {
      if (!breathOn) return;
      if (!breathPhaseStart) breathPhaseStart = ts;
      var ph = BREATH[breathIdx % BREATH.length];
      var remain = ph.ms - (ts - breathPhaseStart);
      if (remain <= 0) { breathIdx++; breathStep(); return; }   // hand off to the next phase
      if (breathCount) breathCount.textContent = String(Math.ceil(remain / 1000));
      if (breathBar) breathBar.style.strokeDashoffset = (BREATH_CIRC * (1 - remain / ph.ms)).toFixed(2);
      breathRAF = requestAnimationFrame(breathTick);
    }
    function toggleBreath(on) {
      breathOn = on;
      breathEl.hidden = !on;
      stage.classList.toggle('is-breathing', on);
      if (!on) for (var i = 0; i < sheep.length; i++) sheep[i].el.classList.remove('is-watching');
      if (breathRAF) { cancelAnimationFrame(breathRAF); breathRAF = null; }
      if (on) { breathIdx = 0; breathPhaseStart = 0; breathStep(); }
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
    // a warm, soft piano spectrum: a strong fundamental with steeply rolling-off
    // partials (no bright upper edge), built once and reused for every note.
    function buildPianoWave() {
      var amps = [0, 1, 0.18, 0.08, 0.035, 0.015, 0.008, 0.004, 0.002, 0.001];
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
        lp.type = 'lowpass'; lp.frequency.value = 1150; lp.Q.value = 0.0001;
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
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.09);          // slow, breathy bloom (no percussive strike)
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.8, dur * 1.6));
      g.connect(lullGain);
      var o1 = actx.createOscillator(); o1.setPeriodicWave(pianoWave); o1.frequency.value = freq;
      var o2 = actx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq / 2;
      var sub = actx.createGain(); sub.gain.value = 0.4; o2.connect(sub); sub.connect(g);  // a touch more warm low body
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
        lullGain.gain.setTargetAtTime(0.11, actx.currentTime, 0.7);    // soft, slowly eased in
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
