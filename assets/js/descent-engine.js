/* =====================================================================
   DESCENT ENGINE — a single continuous fall from deep space to the trench.
   Drives, from window scroll progress p (0=space … 1=trench):
     • a full-viewport gradient that morphs through every zone
     • per-zone particle systems (stars, shooters, clouds, fireflies,
       sun-shafts, bubbles, bioluminescence, marine snow)
     • parallax silhouettes (mountains, treeline, waterline, kelp, trench walls)
     • emoji "objects" you pass on the way down (planets, plane, tent, fish, whale…)
     • a depth/altitude gauge HUD
   Reads window.DESCENT_CONFIG before init:
     { gauge:'minimal'|'field'|'hud', intensity:Number, preview:Bool }
   ===================================================================== */
(function () {
  const cfg = window.DESCENT_CONFIG || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preview = cfg.preview || new URLSearchParams(location.search).has('preview');
  const INT = (cfg.intensity != null ? cfg.intensity : 1) * (preview ? 0.5 : 1);

  // A page can PIN the descent to a single sphere (cfg.pin) so the scene HOLDS that
  // zone as a fixed, living backdrop instead of being driven by scroll — used by blog
  // posts that adopt a sphere's look. cfg.pin is a sphere key (below) or an explicit
  // progress value 0..1; each key's p is chosen to frame that scene at its best.
  const PIN_P = {
    exosphere: 0.05, thermosphere: 0.18, stratosphere: 0.34, biosphere: 0.52,
    hydrosphere: 0.70, bathysphere: 0.84, lithosphere: 0.97,
  };
  let PIN = null;
  if (cfg.pin != null) {
    PIN = typeof cfg.pin === 'number' ? cfg.pin : PIN_P[String(cfg.pin).toLowerCase()];
    if (PIN == null) PIN = PIN_P.biosphere;
  }

  // TODO: make the scene weather-aware of the visitor's current location.
  //   • Get coords from navigator.geolocation (fall back to a sensible default city
  //     on denial/unavailable — never block the animation on it).
  //   • Fetch live weather from Open-Meteo (no API key, CORS-enabled, GitHub-Pages
  //     friendly): current.weather_code + cloud_cover + wind_speed + precipitation.
  //   • Drive the existing knobs from it: cloud_cover → cloud count/opacity, wind →
  //     choppier sea wob/swell, and a weather_code precip branch → a rain/snow layer
  //     in the sky/biosphere zones. Keep day/night on the device clock (nightAmount).
  //   • Cache the result (sessionStorage) so we hit the API at most once per visit.

  const canvas = document.getElementById('descent-canvas');
  const spriteLayer = document.getElementById('descent-sprites');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sfBuild();
  }

  /* ---------- progress ---------- */
  function prog() {
    if (PIN != null) return PIN;          // a pinned page holds one sphere (see cfg.pin)
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  /* ---------- colour journey ---------- */
  const GRAD = [
    { p: 0.00, a: '#02030a', b: '#04050d' }, // deep space
    { p: 0.13, a: '#04060f', b: '#0a1230' }, // space → upper dark
    { p: 0.23, a: '#0a1438', b: '#27407a' }, // upper atmosphere indigo
    { p: 0.33, a: '#314a86', b: '#9a7298' }, // high sky / pre-dawn
    { p: 0.41, a: '#6b7ab0', b: '#f0a878' }, // dawn horizon (warm)
    { p: 0.49, a: '#acc6d4', b: '#86a7b0' }, // hazy coastal sky (beach)
    { p: 0.57, a: '#6f97ad', b: '#3f6f88' }, // sea-blue coast
    { p: 0.65, a: '#0d2233', b: '#1f6079' }, // water surface
    { p: 0.73, a: '#0e4a5e', b: '#0a3550' }, // shallows
    { p: 0.83, a: '#08293c', b: '#051a2a' }, // deep sea
    { p: 0.93, a: '#04141f', b: '#020a12' }, // approaching trench
    { p: 1.00, a: '#01060a', b: '#000000' }, // the trench
  ];
  function hx(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mix(c1, c2, t) { const a = hx(c1), b = hx(c2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`; }
  function gradAt(p) {
    let i = 0; while (i < GRAD.length - 1 && p > GRAD[i + 1].p) i++;
    const lo = GRAD[i], hi = GRAD[Math.min(i + 1, GRAD.length - 1)];
    const t = hi.p === lo.p ? 0 : (p - lo.p) / (hi.p - lo.p);
    return { a: mix(lo.a, hi.a, t), b: mix(lo.b, hi.b, t) };
  }

  /* ---------- depth / altitude ---------- */
  const DEPTH = [
    { p: 0.00, m: 400000 }, { p: 0.13, m: 100000 }, { p: 0.23, m: 18000 },
    { p: 0.33, m: 1500 }, { p: 0.42, m: 0 }, { p: 0.62, m: 0 },
    { p: 0.66, m: -6 }, { p: 0.74, m: -240 }, { p: 0.83, m: -1900 },
    { p: 0.93, m: -6200 }, { p: 1.00, m: -10935 },
  ];
  function depthAt(p) {
    let i = 0; while (i < DEPTH.length - 1 && p > DEPTH[i + 1].p) i++;
    const lo = DEPTH[i], hi = DEPTH[Math.min(i + 1, DEPTH.length - 1)];
    const t = hi.p === lo.p ? 0 : (p - lo.p) / (hi.p - lo.p);
    return lo.m + (hi.m - lo.m) * t;
  }

  // t = a temperature colour for the gauge (cold blue → hot red). The real
  // profile is non-monotonic: space is cold, the THERMOSPHERE is scorching
  // (~2000°C), the stratosphere cold again, the surface temperate, the deep
  // sea cold, and the LITHOSPHERE hot (geothermal) — two genuine heat spikes.
  const ZONES = [
    { p: 0.06, key: 'EXOSPHERE',    jp: '우주 · అంతరిక్షం', t: '#8fb4f0' }, // space — cold
    { p: 0.19, key: 'THERMOSPHERE', jp: '궤도 · కక్ష్య',    t: '#ef5a2a' }, // up to ~2000°C — hot
    { p: 0.34, key: 'STRATOSPHERE', jp: '하늘 · ఆకాశం',    t: '#4f8fe0' }, // ~ −60°C — cold
    { p: 0.52, key: 'BIOSPHERE',    jp: '숲 · అడవి',       t: '#86c64e' }, // ~20°C — temperate
    { p: 0.70, key: 'HYDROSPHERE',  jp: '해면 · సముద్రం',   t: '#2bb6e0' }, // ~15°C — cool; starts as the beach submerges (depth leaves 0), not while still at sea level
    { p: 0.80, key: 'BATHYSPHERE',  jp: '심해 · అగాధం',     t: '#3f7be8' }, // ~4°C — cold
    { p: 0.95, key: 'LITHOSPHERE',  jp: '해구 · కందకం',     t: '#e8412a' }, // geothermal — hot
  ];
  function zoneAt(p) {
    let z = ZONES[0];
    for (const c of ZONES) { if (p >= c.p - 0.07) z = c; }
    return z;
  }
  // the temperature colour at progress p, smoothly interpolated between zones
  function tempAt(p) {
    let i = 0; while (i < ZONES.length - 1 && p > ZONES[i + 1].p) i++;
    const lo = ZONES[i], hi = ZONES[Math.min(i + 1, ZONES.length - 1)];
    const tt = hi.p === lo.p ? 0 : (p - lo.p) / (hi.p - lo.p);
    return mix(lo.t, hi.t, Math.max(0, Math.min(1, tt)));
  }

  /* ---------- particles ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const N = (n) => Math.max(1, Math.round(n * INT));
  const groundY = () => H * 0.82;            // the ground line the camp sits on (viewport-relative)
  // 1 at night, 0 during day/morning, smooth dawn/dusk fades — shared by the moon & satellite
  function nightAmount() {
    const d = new Date(); const h = d.getHours() + d.getMinutes() / 60;
    if (h >= 6.5 && h <= 17.5) return 0;
    if (h > 5 && h < 6.5) return (6.5 - h) / 1.5;
    if (h > 17.5 && h < 19) return (h - 17.5) / 1.5;
    return 1;
  }
  const CAMP_FIRE_X = 0.58, CAMP_TENT_X = 0.36; // preferred fireplace + tent x (fraction of W); fire is the smoke origin
  let stars = [], shooters = [], clouds = [], fireflies = [], bubbles = [], bios = [], snow = [], fishes = [];
  let smoke = [], lastShooter = 0, lastSmoke = 0;
  /* easter eggs: catch a flagged creature and it bursts into a shower of sparks.
     Two kinds — flagged DOM sprites (the comet as it streaks past, the rare
     seahorse), and the rare golden fish in the canvas shoal (hit-tested in
     catchGoldFish). Every golden creature on the way down is catchable. Finds are
     recorded once per browser (via window.EasterEggs); a caught sprite's
     `_suppress` hides it for the rest of the pass it was caught on, then it returns
     as ordinary scenery, while a caught gold fish simply sheds its gold and swims
     on. `burst` is the shared spark particle system. */
  let burst = [];

  /* ---------- the fish school: species change with depth ----------
     A fish's KIND is chosen for the depth it (re)enters at — bright reef fish in
     the sunlit shallows, sleek silvery shoals through the midwater, and dark
     bioluminescent dwellers (lanternfish, viperfish, the odd anglerfish trailing
     its glowing lure) down in the deep and the trench. Each fish re-rolls its
     species every time it wraps around the screen, so the shoal turns over to
     match the depth as you sink. */
  // reef palette — coral, cyan, pink, teal. Yellow/gold is deliberately NOT here: it's
  // reserved for the rare golden specimen (see GOLD_RARITY in setSpecies) so gold always
  // reads as a lucky find rather than just another reef colour.
  const REEF_COLS = [[255, 143, 106], [127, 216, 255], [255, 159, 192], [110, 224, 200]];
  const GOLD_RARITY = 0.01;   // odds any fish (re)enters as a rare golden specimen — every species can roll it
  function fishKindAt(p) {
    const r = Math.random();
    if (p < 0.75) return r < 0.7 ? 'reef' : 'silver';                            // sunlit shallows
    if (p < 0.86) return r < 0.6 ? 'silver' : (r < 0.9 ? 'reef' : 'lantern');    // open midwater
    if (p < 0.93) return r < 0.5 ? 'lantern' : (r < 0.85 ? 'silver' : 'viper');  // deep sea
    return r < 0.5 ? 'lantern' : (r < 0.85 ? 'viper' : 'angler');                // the trench
  }
  /* each species keeps to its own sphere — the depth band it belongs to. A fish
     won't cross out of its band as the descent carries it on: it fades into the
     gloom at the boundary and a depth-appropriate species fades in to take its
     place. Ranges mirror fishKindAt (with a little slack at the edges) so the
     angler stays down in the trench, reef fish in the sunlit shallows, etc. */
  const SPECIES_RANGE = {
    reef:    [0.00, 0.88],
    silver:  [0.00, 0.94],
    lantern: [0.73, 1.00],
    viper:   [0.84, 1.00],
    angler:  [0.91, 1.00],
  };
  function inSpeciesZone(f, p) { const r = SPECIES_RANGE[f.kind] || [0, 1]; return p >= r[0] && p <= r[1]; }
  // the body colour for a (non-gold) species — gold is the separate rare-find tint
  function speciesCol(kind) {
    return kind === 'reef' ? REEF_COLS[(Math.random() * REEF_COLS.length) | 0]
      : kind === 'silver' ? [185, 212, 230]
        : kind === 'lantern' ? [44, 56, 84]
          : kind === 'viper' ? [26, 34, 54]
            : [44, 30, 56];                                                      // angler
  }
  // (re)assign a fish's species + colours for the depth it is (re)entering at
  function setSpecies(f, p) {
    f.kind = fishKindAt(p);
    f.gold = Math.random() < GOLD_RARITY;   // a rare golden specimen — any species, reef to anglerfish
    f.col = f.gold ? [255, 206, 84] : speciesCol(f.kind);
    if (f.kind === 'angler') f.size = rnd(20, 30);                               // anglers loom larger
    else if (f.kind === 'viper') f.size = rnd(12, 20);
  }

  /* fish school size scales with the viewport (wider screen → more fish), clamped to a sane range */
  const fishTarget = () => Math.max(4, Math.round(Math.min(30, W / 90) * INT));
  function spawnFish() {
    const sp = rnd(0.00012, 0.0011), dir = Math.random() > .5 ? 1 : -1;
    // a fish is a heading (ang) + a forward speed it eases — it only ever swims the way it faces
    const f = { x: Math.random(), y: rnd(0.12, 0.86), size: rnd(9, 24), sp, speed: sp, ang: dir > 0 ? 0 : Math.PI, fear: 0, bob: Math.random() * 6.28, bobS: rnd(0.008, 0.022), bobA: rnd(4, 11), tail: Math.random() * 6.28, tailS: 0.12 + sp * 90, nosy: Math.random(), holdR: 30 + Math.random() * 24, pokePh: Math.random() * 6.28, curEngaged: false, hold: 0, zoneFade: 1, flee: 0, fleeAng: 0 };
    setSpecies(f, 0);   // born in the shallows; species is re-rolled by depth on each wrap
    return f;
  }
  function syncFish() {                          // add/remove fish to match the current screen size
    const want = fishTarget();
    while (fishes.length < want) fishes.push(spawnFish());
    if (fishes.length > want) fishes.length = want;
  }

  /* draw one fish — silhouette + detailing depend on its species (f.kind): reef
     fish get a dorsal fin and body bands, the deep dwellers light their own
     photophores, and the anglerfish dangles a glowing lure over a toothy mouth */
  function drawFish(f, a) {
    const s = f.size, rgb = `${f.col[0]},${f.col[1]},${f.col[2]}`;
    const deep = f.kind === 'lantern' || f.kind === 'viper' || f.kind === 'angler';
    ctx.save();
    ctx.translate(f.x * W, f.y * H + Math.sin(f.bob) * f.bobA * (1 - 0.8 * f.hold)); // near-still while parked
    ctx.rotate(f.ang);
    if (Math.cos(f.ang) < 0) ctx.scale(1, -1);     // keep the belly down when it's heading left
    const tw = Math.sin(f.tail) * s * 0.22;        // tail-fin twitch

    if (f.gold) { ctx.shadowColor = 'rgba(255,200,70,0.9)'; ctx.shadowBlur = 15; } // golden glow

    // body — viperfish are slim, anglers round-bellied, everything else a soft ellipse
    const rx = f.kind === 'viper' ? s * 1.25 : f.kind === 'angler' ? s * 0.98 : s;
    const ry = f.kind === 'viper' ? s * 0.30 : f.kind === 'angler' ? s * 0.62 : s * 0.45;
    ctx.fillStyle = `rgba(${rgb},${a})`;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.2832); ctx.fill();

    // tail fin
    const tl = f.kind === 'viper' ? 1.7 : 1.5, tb = f.kind === 'viper' ? 1.2 : 0.85;
    ctx.beginPath();
    ctx.moveTo(-s * tb, 0);
    ctx.lineTo(-s * tl, -s * 0.5 + tw);
    ctx.lineTo(-s * tl, s * 0.5 + tw);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    if (f.kind === 'reef') {
      // a triangular dorsal fin + a couple of darker vertical bands
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.4); ctx.lineTo(s * 0.12, -s * 0.92); ctx.lineTo(s * 0.34, -s * 0.36);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(18,28,42,${a * 0.32})`;
      ctx.fillRect(-s * 0.04, -s * 0.42, s * 0.13, s * 0.84);
      ctx.fillRect(s * 0.30, -s * 0.34, s * 0.11, s * 0.68);
    } else if (f.kind === 'lantern' || f.kind === 'viper') {
      // a row of glowing photophores down the belly
      ctx.shadowColor = 'rgba(120,230,255,0.9)'; ctx.shadowBlur = 6;
      ctx.fillStyle = `rgba(150,240,255,${Math.min(1, a + 0.25)})`;
      const n = f.kind === 'viper' ? 6 : 4, reach = (f.kind === 'viper' ? 1.0 : 0.7) * s;
      for (let i = 0; i < n; i++) {
        ctx.beginPath(); ctx.arc((i / (n - 1) - 0.5) * reach, ry * 0.7, s * 0.07, 0, 6.2832); ctx.fill();
      }
      ctx.shadowBlur = 0;
    } else if (f.kind === 'angler') {
      // a bioluminescent lure (the esca) on a stalk arching over the head
      ctx.strokeStyle = `rgba(170,205,215,${a})`; ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.beginPath(); ctx.moveTo(s * 0.45, -s * 0.5);
      ctx.quadraticCurveTo(s * 1.55, -s * 1.25, s * 1.5, -s * 0.5); ctx.stroke();
      ctx.shadowColor = 'rgba(170,255,225,0.95)'; ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(195,255,232,${Math.min(1, a + 0.35)})`;
      ctx.beginPath(); ctx.arc(s * 1.5, -s * 0.5, s * 0.16, 0, 6.2832); ctx.fill();
      ctx.shadowBlur = 0;
      // a jagged underbite of teeth
      ctx.strokeStyle = `rgba(228,234,244,${a})`; ctx.lineWidth = Math.max(0.6, s * 0.035);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) { const tx = s * (0.55 - i * 0.16); ctx.moveTo(tx, ry * 0.55); ctx.lineTo(tx - s * 0.05, ry * 0.95); }
      ctx.stroke();
    }

    // eye — dark for the sunlit fish, faintly lit for the deep dwellers
    ctx.fillStyle = deep ? `rgba(190,250,255,${Math.min(1, a + 0.2)})` : `rgba(6,18,28,${a})`;
    ctx.beginPath(); ctx.arc(rx * 0.62, -s * 0.1, s * 0.1, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  function seed() {
    stars = []; for (let i = 0; i < N(180); i++) stars.push({ x: Math.random(), y: Math.random(), r: rnd(0.3, 1.7), a: rnd(0.15, 0.9), ts: rnd(0.002, 0.01), td: Math.random() > .5 ? 1 : -1, par: rnd(0.05, 0.35) });
    clouds = []; for (let i = 0; i < N(7); i++) clouds.push({ x: Math.random(), y: rnd(0.1, 0.9), w: rnd(120, 320), h: rnd(28, 60), v: rnd(0.02, 0.06) * (Math.random() > .5 ? 1 : -1), a: rnd(0.05, 0.16) });
    fireflies = []; for (let i = 0; i < N(26); i++) fireflies.push({ x: Math.random(), y: rnd(0.55, 0.82), ph: Math.random() * 6.28, sp: rnd(0.3, 0.9), dx: rnd(0.0003, 0.0012) * (Math.random() > .5 ? 1 : -1) });
    bubbles = []; for (let i = 0; i < N(34); i++) bubbles.push({ x: Math.random(), y: Math.random(), r: rnd(1, 4), v: rnd(0.0015, 0.005), wob: Math.random() * 6.28, ws: rnd(0.01, 0.03) });
    bios = []; for (let i = 0; i < N(40); i++) bios.push({ x: Math.random(), y: Math.random(), r: rnd(0.6, 2.2), ph: Math.random() * 6.28, sp: rnd(0.5, 1.6), hue: Math.random() > .5 ? 'c' : 'p' });
    snow = []; for (let i = 0; i < N(50); i++) snow.push({ x: Math.random(), y: Math.random(), r: rnd(0.4, 1.4), v: rnd(0.0006, 0.0018), dx: rnd(-0.0004, 0.0004) });
    fishes = []; syncFish();
  }

  const band = (p, c, w) => Math.max(0, 1 - Math.abs(p - c) / w); // triangular falloff

  /* =====================================================================
     SEAFLOOR — the hydrothermal trench floor you arrive at, drawn straight
     into the bottom of this FIXED full-viewport canvas (not a separate
     footer layer), so it belongs to the same underwater scene as the fish
     and marine snow — no scroll-detached plane, and no clipping edge for the
     vent glow to cut against.

     Drawn in the page's own visual vocabulary so the vents feel native, not
     bolted on: knobbly, clustered rock spires (the candelabra shape real
     black smokers take) shaded with a live gradient like the mountains; an
     ever-present molten smoulder plus a pulsing glow at the mouth, built the
     same way as the campfire's ember bed (the descent's two heat spikes —
     the forest fire and the geothermal trench — rhyme); a billowing plume of
     mineral smoke made of the same soft radial puffs as the campfire smoke;
     rising gas bubbles like the sea's; heat-shimmer off the hot mouth; and
     colonies of tube worms swaying at the base — cream tubes with red gill
     plumes (echoing the swaying grass/kelp and the LITHOSPHERE red). It
     anchors to the viewport bottom, fades in with the trench, and each vent
     erupts on its own staggered timer. Stills to a steady half-lit frame
     (no pulsing, plume or sway) for reduced motion. =================== */
  const sfClamp = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);
  const sfSmooth = (k) => { k = sfClamp(k, 0, 1); return k * k * (3 - 2 * k); };
  let ventList = [], sfRocks = [], sfBucket = -1, sfLastT = 0, sfElapsed = 0, sfTrA = 1;

  // the floor sits this many px up from the bottom of the viewport; two gently
  // undulating surface lines (front sediment + a dimmer back dune behind it)
  function sfFloorH() { return sfClamp(H * 0.15, 92, 150); }
  function sfFrontY(x) { const fh = sfFloorH(); return H - fh + (Math.sin(x * 0.012 + 1.3) * 0.5 + Math.sin(x * 0.027 + 0.6) * 0.3 + Math.sin(x * 0.061 + 2.1) * 0.2) * (fh * 0.16); }
  function sfBackY(x) { const fh = sfFloorH(); return H - fh * 1.7 + (Math.sin(x * 0.009 + 4.1) * 0.5 + Math.sin(x * 0.021 + 2.7) * 0.3 + Math.sin(x * 0.05 + 0.4) * 0.2) * (fh * 0.22); }
  function sfFill(yFn, color) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, yFn(x));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function sfBuild() {
    const bucket = W < 620 ? 0 : 1;                 // only rebuild when the layout band flips (keeps vent timers alive across resizes)
    if (bucket === sfBucket && ventList.length) return;
    sfBucket = bucket;
    const conf = bucket === 0
      ? [{ xf: 0.24, wf: 0.11, hk: 0.66 }, { xf: 0.76, wf: 0.09, hk: 0.56 }]
      : [{ xf: 0.16, wf: 0.062, hk: 0.62 }, { xf: 0.50, wf: 0.078, hk: 0.95 }, { xf: 0.84, wf: 0.055, hk: 0.56 }];
    ventList = conf.map((c, i) => {
      // a colony of tube worms hugging the two sides of the vent base
      const worms = [];
      const wn = Math.round(rnd(6, 10));
      for (let k = 0; k < wn; k++) {
        worms.push({
          fx: (Math.random() < 0.5 ? -1 : 1) * rnd(0.15, 0.95),   // out along the base, biased to the sides
          lenK: rnd(0.20, 0.46), ph: rnd(0, 6.28),
          lean: (Math.random() < 0.5 ? -1 : 1) * rnd(0.6, 1.4),
          thick: rnd(0.8, 1.25), dim: rnd(0.6, 1),                 // back-of-cluster worms are thinner/dimmer
        });
      }
      // each vent runs its OWN independent, re-randomised cycle: long unpredictable
      // dormancy (mostly dark) broken by a brief eruption of random length, ramp
      // speed and peak brightness — so a lit vent is a mildly rare, surprising event
      const dormantDur = rnd(16, 46);
      return {
        xf: c.xf, wf: c.wf, hk: c.hk, seed: i * 2.4 + 0.7, knobSeed: rnd(0, 6.28), lean: rnd(-0.1, 0.1),
        // the tallest vent grows a second, shorter spire beside it (candelabra)
        spire2: c.hk > 0.85 ? { dxK: (Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 0.85), hk2: rnd(0.45, 0.64) } : null,
        worms,
        phase: 'dormant', tt: rnd(0, dormantDur), open: 0,   // start each at a random point in its own dormancy
        dormantDur, openDur: rnd(2.5, 7), rampUp: rnd(1.2, 2.6), rampDown: rnd(1.8, 3.4), openMax: rnd(0.5, 1),
        emit: 0, emitB: 0, smoke: [], bubbles: [],
      };
    });
    sfRocks = [];
    const n = Math.round(sfClamp(W / 130, 4, 9));
    for (let i = 0; i < n; i++) sfRocks.push({ xf: (i + rnd(0.1, 0.9)) / n, rw: rnd(10, 30), rh: rnd(5, 13), tone: rnd(0.05, 0.16) });
  }

  function sfVentGeo(v) {
    const x = v.xf * W, baseY = sfFrontY(x);
    const baseW = sfClamp(W * v.wf, 24, 130), topW = baseW * 0.52, h = baseW * v.hk;
    return { x, baseY, baseW, topW, h, mouthY: baseY - h };
  }

  // trace a knobbly rock spire outline (no fill) — tapered base→mouth with a
  // bumpy mineral-crust edge, the same organic-silhouette feel as the ridges
  function sfTraceSpire(cx, baseY, topY, baseHalf, topHalf, lean, seed) {
    const dh = baseY - topY, steps = 7;
    ctx.beginPath();
    ctx.moveTo(cx - baseHalf, baseY);
    for (let i = 1; i < steps; i++) {
      const f = i / steps, y = baseY - dh * f, half = baseHalf + (topHalf - baseHalf) * f;
      const knob = (Math.sin(f * 6.5 + seed) * 0.16 + Math.sin(f * 14 + seed * 2) * 0.07) * half * (1 - f * 0.6);
      ctx.lineTo(cx - half + lean * f - knob, y);
    }
    ctx.lineTo(cx - topHalf + lean, topY);
    ctx.lineTo(cx + topHalf + lean, topY);
    for (let i = steps - 1; i >= 1; i--) {
      const f = i / steps, y = baseY - dh * f, half = baseHalf + (topHalf - baseHalf) * f;
      const knob = (Math.sin(f * 6.5 + seed + 2.3) * 0.16 + Math.sin(f * 14 + seed * 2 + 1.4) * 0.07) * half * (1 - f * 0.6);
      ctx.lineTo(cx + half + lean * f + knob, y);
    }
    ctx.lineTo(cx + baseHalf, baseY);
    ctx.closePath();
  }

  function sfStepVent(v, dt) {
    v.tt += dt;
    switch (v.phase) {
      case 'dormant': v.open = 0; if (v.tt >= v.dormantDur) { v.phase = 'opening'; v.tt = 0; } break;
      case 'opening': v.open = sfSmooth(v.tt / v.rampUp) * v.openMax; if (v.tt >= v.rampUp) { v.phase = 'open'; v.tt = 0; v.open = v.openMax; } break;
      case 'open': v.open = v.openMax; if (v.tt >= v.openDur) { v.phase = 'closing'; v.tt = 0; } break;
      case 'closing':
        v.open = (1 - sfSmooth(v.tt / v.rampDown)) * v.openMax;
        if (v.tt >= v.rampDown) {            // seal up, then re-roll the whole cycle from scratch
          v.phase = 'dormant'; v.tt = 0; v.open = 0;
          v.dormantDur = rnd(16, 46); v.openDur = rnd(2.5, 7);
          v.rampUp = rnd(1.2, 2.6); v.rampDown = rnd(1.8, 3.4); v.openMax = rnd(0.5, 1);
        }
        break;
    }
  }

  // particles carry a 0→1 `life` (like the campfire smoke) rather than px
  // velocities, so their drift/billow/fade are all derived in the draw pass
  function sfEmit(v, dt) {
    const g = sfVentGeo(v);
    v.emit += v.open * 12 * dt;                       // billowing mineral smoke; density tracks how open the vent is
    while (v.emit >= 1) {
      v.emit -= 1; if (v.smoke.length >= 26) break;
      v.smoke.push({ life: 0, ox: rnd(-g.topW * 0.5, g.topW * 0.5), sw: Math.random() * 6.2832, vr: rnd(0.16, 0.26), rise: H * rnd(0.22, 0.30), r0: g.topW * rnd(0.5, 0.8), rg: g.topW * rnd(1.8, 2.6), peak: rnd(0.16, 0.26) });
    }
    v.emitB += v.open * 5 * dt;                       // a sparse string of rising gas bubbles
    while (v.emitB >= 1) {
      v.emitB -= 1; if (v.bubbles.length >= 14) break;
      v.bubbles.push({ life: 0, ox: rnd(-g.topW * 0.35, g.topW * 0.35), sw: Math.random() * 6.2832, ws: rnd(2, 4), vr: rnd(0.5, 0.9), rise: H * rnd(0.12, 0.22), r: rnd(1.1, 2.6) });
    }
  }

  function sfUpdateParticles(v, dt) {
    for (let i = v.smoke.length - 1; i >= 0; i--) { v.smoke[i].life += v.smoke[i].vr * dt; if (v.smoke[i].life >= 1) v.smoke.splice(i, 1); }
    for (let i = v.bubbles.length - 1; i >= 0; i--) { v.bubbles[i].life += v.bubbles[i].vr * dt; if (v.bubbles[i].life >= 1) v.bubbles.splice(i, 1); }
  }

  function sfDrawChimney(v) {
    const g = sfVentGeo(v), ln = g.baseW * v.lean, topY = g.mouthY;
    ctx.globalAlpha = sfTrA;
    // a shorter second spire alongside the tall vents, drawn first so the main spire overlaps it
    if (v.spire2) {
      const s2x = g.x + v.spire2.dxK * g.baseW;
      sfTraceSpire(s2x, g.baseY, g.baseY - g.h * v.spire2.hk2, g.baseW * 0.34, g.topW * 0.42, ln * 0.6, v.knobSeed + 3.1);
      ctx.fillStyle = '#0a121a'; ctx.fill();
    }
    // main spire — live vertical gradient (warm mineral-stained top → cold dark base)
    sfTraceSpire(g.x, g.baseY, topY, g.baseW / 2, g.topW / 2, ln, v.knobSeed);
    const gr = ctx.createLinearGradient(0, topY, 0, g.baseY);
    gr.addColorStop(0, '#241b22'); gr.addColorStop(0.45, '#0e1620'); gr.addColorStop(1, '#070c12');
    ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = 'rgba(74,96,112,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
    // warm sulfide crust staining the rock just under the hot mouth, clipped to the spire
    ctx.save(); ctx.clip();
    const crust = ctx.createRadialGradient(g.x + ln, topY, 0, g.x + ln, topY, g.topW * 2.4);
    crust.addColorStop(0, `rgba(168,74,42,${0.5 * sfTrA})`); crust.addColorStop(1, 'rgba(168,74,42,0)');
    ctx.fillStyle = crust; ctx.fillRect(g.x - g.baseW, topY - g.topW, g.baseW * 2, g.h);
    ctx.restore();
    // recessed mouth
    ctx.fillStyle = '#05080d';
    ctx.beginPath(); ctx.ellipse(g.x + ln, topY, g.topW * 0.5, g.topW * 0.2, 0, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // tube-worm colony encrusting the vent base — cream tubes with red gill plumes,
  // swaying on a shared gust like the grass/kelp; still for reduced motion
  function sfDrawWorms(v) {
    const g = sfVentGeo(v);
    const gust = reduce ? 0 : (Math.sin(sfElapsed * 0.7) * 0.5 + Math.sin(sfElapsed * 1.6 + v.seed) * 0.3);
    ctx.lineCap = 'round';
    for (const w of v.worms) {
      const wx = g.x + w.fx * g.baseW, baseY = sfFrontY(wx), len = g.baseW * w.lenK;
      const lw = Math.max(1.6, g.baseW * 0.045) * w.thick;
      const sway = reduce ? 0 : (Math.sin(sfElapsed * 1.0 + w.ph) + gust) * len * 0.16 * w.lean;
      const tx = wx + sway, ty = baseY - len;
      ctx.globalAlpha = sfTrA * w.dim;
      ctx.lineWidth = lw;
      ctx.strokeStyle = w.dim > 0.8 ? 'rgba(214,204,186,1)' : 'rgba(150,150,140,1)';
      ctx.beginPath(); ctx.moveTo(wx, baseY); ctx.quadraticCurveTo(wx + sway * 0.5, baseY - len * 0.6, tx, ty); ctx.stroke();
      ctx.shadowColor = 'rgba(232,65,42,0.7)'; ctx.shadowBlur = 6;
      ctx.fillStyle = 'rgba(226,72,58,1)';
      ctx.beginPath(); ctx.ellipse(tx, ty, lw * 0.85, lw * 1.5, 0, 0, 6.2832); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  function sfDrawGlow(v) {
    const g = sfVentGeo(v), gx = g.x + g.baseW * v.lean, gy = g.mouthY;
    // a faint ever-present smoulder at the mouth — like the campfire's banked
    // embers, just enough that a dormant vent breathes rather than looking dead,
    // while keeping a full eruption the clearly rarer, brighter event
    const puls = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(sfElapsed * 1.3 + v.seed);
    let eb = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.topW * 1.5);
    eb.addColorStop(0, `rgba(255,108,48,${(0.045 + 0.03 * puls) * sfTrA})`); eb.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = eb; ctx.beginPath(); ctx.arc(gx, gy, g.topW * 1.7, 0, 6.2832); ctx.fill();
    if (v.open <= 0.01) return;
    const o = v.open * sfTrA;
    ctx.globalCompositeOperation = 'lighter';
    let grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.topW * 4.6);     // molten halo
    grd.addColorStop(0, `rgba(255,150,60,${0.46 * o})`);
    grd.addColorStop(0.4, `rgba(255,92,42,${0.20 * o})`);
    grd.addColorStop(1, 'rgba(255,80,30,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(gx, gy, g.topW * 4.6, 0, 6.2832); ctx.fill();
    grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.topW * 1.25);        // hot core
    grd.addColorStop(0, `rgba(255,232,184,${0.72 * o})`);
    grd.addColorStop(1, 'rgba(255,160,70,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(gx, gy, g.topW * 1.25, 0, 6.2832); ctx.fill();
    // heat-shimmer wavering off the super-heated mouth
    if (v.open > 0.2 && !reduce) {
      for (let i = 0; i < 3; i++) {
        const sx = gx + (i - 1) * g.topW * 0.45, wob = Math.sin(sfElapsed * 3.1 + i * 2 + v.seed) * g.topW * 0.22;
        const sg = ctx.createLinearGradient(sx, gy, sx + wob, gy - g.h * 0.7);
        sg.addColorStop(0, `rgba(255,206,150,${0.05 * o})`); sg.addColorStop(1, 'rgba(255,206,150,0)');
        ctx.strokeStyle = sg; ctx.lineWidth = g.topW * 0.5;
        ctx.beginPath(); ctx.moveTo(sx, gy); ctx.quadraticCurveTo(sx + wob, gy - g.h * 0.35, sx + wob * 0.5, gy - g.h * 0.7); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function sfDrawParticles(v, cur) {
    const g = sfVentGeo(v), ox = g.x + g.baseW * v.lean, oy = g.mouthY;
    // billowing mineral smoke — soft radial puffs, warm-lit at the mouth, fading to charcoal as they rise
    for (const sm of v.smoke) {
      const yy = oy - sm.life * sm.rise;
      const xx = ox + sm.ox + Math.sin(sm.sw + sm.life * 3.0) * (10 + sm.life * 40) + cur * sm.life * 0.7;
      const rr = sm.r0 + sm.life * sm.rg;
      const a = Math.sin(Math.min(1, sm.life) * Math.PI) * sm.peak * sfTrA;
      if (a <= 0.003) continue;
      const warm = Math.max(0, 1 - sm.life * 3);
      const cr = Math.round(46 + warm * 72), cg = Math.round(48 + warm * 14), cb = Math.round(58 - warm * 10);
      const sg = ctx.createRadialGradient(xx, yy, 0, xx, yy, rr);
      sg.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`); sg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(xx, yy, rr, 0, 6.2832); ctx.fill();
    }
    // rising gas bubbles — warm near the hot mouth, cooling to the sea's blue-white as they climb
    for (const b of v.bubbles) {
      const by = oy - b.life * b.rise, bx = ox + b.ox + Math.sin(b.sw + b.life * b.ws) * 6;
      const a = (1 - b.life) * 0.5 * sfTrA; if (a <= 0.02) continue;
      const warm = Math.max(0, 1 - b.life * 2.2);
      ctx.strokeStyle = `rgba(${Math.round(180 + warm * 70)},${Math.round(235 - warm * 60)},${Math.round(255 - warm * 120)},${a})`;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, b.r, 0, 6.2832); ctx.stroke();
    }
  }

  /* the whole seafloor pass — gated on progress so it costs nothing until you
     near the bottom, then fades in and runs its own real-time (seconds) clock */
  function sfRender(p, t) {
    const floorA = sfClamp((p - 0.88) / 0.10, 0, 1);  // fully in by p≈0.98 (the trench)
    if (floorA <= 0.001) { sfLastT = t; return; }
    if (!ventList.length) sfBuild();
    const dt = sfLastT ? sfClamp((t - sfLastT) / 1000, 0, 0.05) : 0;
    sfLastT = t; sfElapsed += dt; sfTrA = floorA;
    const cur = Math.sin(sfElapsed * 0.22) * 18 + 7;  // slow bottom current that shears the plume

    ctx.globalAlpha = floorA;
    sfFill(sfBackY, '#091019');
    sfFill(sfFrontY, '#05090f');
    for (const r of sfRocks) {
      const x = r.xf * W, y = sfFrontY(x) + r.rh * 0.3;
      ctx.fillStyle = `rgba(${Math.round(30 + r.tone * 80)},${Math.round(40 + r.tone * 90)},${Math.round(52 + r.tone * 90)},1)`;
      ctx.beginPath(); ctx.ellipse(x, y, r.rw, r.rh, 0, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (reduce) { for (const v of ventList) v.open = 0.42; }
    else for (const v of ventList) { sfStepVent(v, dt); sfEmit(v, dt); sfUpdateParticles(v, dt); }
    for (const v of ventList) { sfDrawChimney(v); sfDrawWorms(v); }
    for (const v of ventList) { sfDrawGlow(v); sfDrawParticles(v, cur); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- scroll-driven RISE (the world moves up past you) ----------
     As you fall past a zone, its landmarks slide UP the viewport and off the top
     instead of fading in place — so crossing between spheres feels like the world
     rising before you, not dissolving into the background.
       riseAt: vertical offset in px. (p−c)/w = how far past the band centre, in
       band-widths (−1 = entering low from below, 0 = framed at its base offset,
       +1 = risen a screen past the top). `travel` = screen-heights climbed from
       centre to edge — bigger means nearer/faster, which gives the layers parallax.
       (Used by the clouds.) The forest scene is held as a tableau instead — see
       bioVis below — so it appears together and stays, rather than sliding past. */
  const riseAt = (p, c, w, travel) => -((p - c) / w) * travel * H;

  /* ---------- BIOSPHERE tableau envelope ----------
     Every forest layer (sun/moon + birds + mountains + mist + treeline + framing
     conifers + camp + fire + fireflies) shares this ONE envelope so the whole
     landscape appears together the moment we enter
     the BIOSPHERE and HOLDS, framed and in place, until we leave. Fades in across
     the cloud/dawn approach, full through the zone, fades out into the water. */
  const BIO_IN = 0.46, BIO_OUT = 0.60, BIO_FADE = 0.05;
  function bioVis(p) {
    if (p <= BIO_IN - BIO_FADE || p >= BIO_OUT + BIO_FADE) return 0;
    if (p < BIO_IN) return (p - (BIO_IN - BIO_FADE)) / BIO_FADE;   // fade in on entry
    if (p > BIO_OUT) return ((BIO_OUT + BIO_FADE) - p) / BIO_FADE; // fade out on exit
    return 1;                                                      // hold across the zone
  }

  /* ---------- night darkening envelope (device-local time) ----------
     How strongly the *background gradient* is pulled toward night, by progress. The
     sky (thermosphere/stratosphere) and the open water (hydrosphere on down) have
     daytime palettes baked into GRAD, so at night you'd otherwise snap from dark
     space into a bright daytime sky — and, lower, from the dark moonlit surf into a
     bright daytime sea — the instant each zone takes over. This keeps them as dark as
     the beach tableau between them. Returns 0 in space (always dark) and across the
     beach window (0.46–0.605, which runs its own night wash + moon/stars), 1
     elsewhere below space; the ramps crossfade with the beach wash and the surface
     flood so the darkness stays constant — no bright flash at a handoff. Scaled by
     nightAmount() at the call site (so it's a no-op by day). */
  function nightBgEnv(p) {
    if (p < 0.14) return 0;                          // space — already dark
    if (p < 0.22) return (p - 0.14) / 0.08;          // entering the atmosphere
    if (p < 0.41) return 1;                          // the night sky
    if (p < 0.46) return (0.46 - p) / 0.05;          // hand off to the beach's own wash
    if (p < 0.605) return 0;                         // beach tableau owns the night
    if (p < 0.66) return (p - 0.605) / 0.055;        // hand off from the surface flood
    return 1;                                        // the night sea, on down
  }

  /* ---------- silhouettes ---------- */
  function drawRidge(yBase, amp, seed2, col, step) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + step; x += step) {
      const n = Math.sin((x * 0.004) + seed2) * 0.5 + Math.sin((x * 0.011) + seed2 * 2) * 0.3 + Math.sin((x * 0.023) + seed2 * 3) * 0.2;
      ctx.lineTo(x, yBase + n * amp);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  function drawTrees(yBase, col, gap, hMax, t, windAmp) {
    ctx.fillStyle = col;
    for (let x = -gap; x < W + gap; x += gap) {
      const h2 = hMax * (0.55 + ((Math.sin(x * 13.3) + 1) / 2) * 0.6);
      const w2 = gap * 0.62;
      // the crown leans on the wind (base stays planted) so the treeline breathes
      // instead of standing as a flat cut-out
      const sway = reduce ? 0 : Math.sin(t * 0.0008 + x * 0.02) * (windAmp || 0);
      ctx.beginPath(); ctx.moveTo(x + sway, yBase - h2);
      ctx.lineTo(x - w2 / 2, yBase); ctx.lineTo(x + w2 / 2, yBase); ctx.closePath(); ctx.fill();
      ctx.fillRect(x - 1.5, yBase, 3, gap * 0.18);
    }
  }

  /* a fuller, layered conifer (stacked tiers on a trunk) for the big trees that
     frame the scene from the foreground edges */
  function drawConifer(x, baseY, h, col, t, phase) {
    ctx.fillStyle = col;
    ctx.fillRect(x - h * 0.025, baseY - h * 0.12, h * 0.05, h * 0.13);   // trunk
    for (let i = 0; i < 3; i++) {                                        // three tapering tiers
      const ty = baseY - h * 0.1 - i * h * 0.24, tw = h * (0.32 - i * 0.07);
      // higher tiers sway more, so the whole tree bends gently with the gusts
      const sway = reduce ? 0 : Math.sin(t * 0.0009 + (phase || 0) + i * 0.5) * (1.5 + i * 2.5);
      ctx.beginPath();
      ctx.moveTo(x + sway, ty - h * 0.34); ctx.lineTo(x - tw, ty); ctx.lineTo(x + tw, ty);
      ctx.closePath(); ctx.fill();
    }
  }

  /* a loose V-formation of birds drifting slowly across the daytime bay */
  function drawBirds(a, t, px, py) {
    if (a <= 0.01) return;
    ctx.strokeStyle = `rgba(38,50,70,${a})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const cx = (((t * 0.00002) % 1.3) - 0.15) * W + px * 0.4;            // slow sweep, looping across
    const cy = H * 0.2 + py * 0.4;
    for (let i = 0; i < 6; i++) {
      const k = i - 2.5;                                                 // place along the V
      const bx = cx + k * 24, by = cy + Math.abs(k) * 12;
      const wf = 3 + Math.sin(t * 0.006 + i) * 2;                        // wings flap
      const ww = 7 - Math.abs(k) * 0.5;
      ctx.beginPath();
      ctx.moveTo(bx - ww, by + wf); ctx.lineTo(bx, by); ctx.lineTo(bx + ww, by + wf);
      ctx.stroke();
    }
  }

  /* soft drifting fog for depth, rolling along the foot of the hills */
  function drawMist(yBase, a, t) {
    if (a <= 0.01) return;
    for (let i = 0; i < 3; i++) {
      const mx = (((t * 0.00003 * (1 + i * 0.35) + i * 0.45) % 1.4) - 0.2) * W;
      const my = yBase + i * 12;
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, W * 0.45);
      g.addColorStop(0, `rgba(212,224,236,${a})`); g.addColorStop(1, 'rgba(212,224,236,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(mx, my, W * 0.45, 24, 0, 0, 6.2832); ctx.fill();
    }
  }

  /* a lush, wind-blown meadow across the clearing the camp sits in. Three layered
     bands of blades — darker and shorter behind, brighter and taller in front — plus
     a few fuller fern-like clumps for foreground texture. Every blade leans on a
     shared slow gust envelope plus its own phase, so the whole sward ripples in waves
     instead of standing as a few stiff tufts. Stills entirely for reduced-motion. */
  function drawGrass(a, t) {
    if (a <= 0.01) return;
    const gust = reduce ? 0 : (Math.sin(t * 0.0011) * 0.6 + Math.sin(t * 0.0027) * 0.4);
    ctx.lineCap = 'round'; ctx.lineWidth = 2;
    const bands = [
      { y: 0.795, col: '60,96,46',   h: 22, lift: 5,  amp: 7,  step: 13 },
      { y: 0.850, col: '84,126,56',  h: 32, lift: 9,  amp: 10, step: 11 },
      { y: 0.905, col: '112,162,72', h: 46, lift: 13, amp: 14, step: 10 },
    ];
    for (const b of bands) {
      const step = Math.max(7, Math.round(b.step / INT));
      ctx.strokeStyle = `rgba(${b.col},${a})`;
      for (let x = -4; x <= W + 4; x += step) {
        const bh = b.h * (0.65 + (Math.sin(x * 91.7) * 0.5 + 0.5) * 0.7);
        const by = H * b.y + Math.sin(x * 53.3 + 2.1) * b.lift;
        const lean = reduce ? 0 : (Math.sin(t * 0.0017 + x * 0.05) + gust) * b.amp;
        ctx.beginPath(); ctx.moveTo(x, by);
        ctx.quadraticCurveTo(x + lean * 0.45, by - bh * 0.55, x + lean, by - bh);
        ctx.stroke();
      }
    }
    // a few fuller fern-like clumps for foreground green, kept clear of the camp centre
    ctx.strokeStyle = `rgba(98,144,64,${a})`; ctx.lineWidth = 2.4;
    const clumps = [0.06, 0.14, 0.30, 0.70, 0.88, 0.96];
    for (let c = 0; c < clumps.length; c++) {
      const cx = clumps[c] * W, cy = H * (0.9 + (c % 2) * 0.03);
      for (let b = -3; b <= 3; b++) {
        const bh = 46 - Math.abs(b) * 5;                  // arched fan, tallest in the middle
        const lean = reduce ? 0 : (Math.sin(t * 0.0015 + c + b * 0.3) + gust) * 11;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + b * 4 + lean * 0.5, cy - bh * 0.7, cx + b * 8 + lean, cy - bh);
        ctx.stroke();
      }
    }
  }

  /* a single tapered flame shape from (x, baseY) rising to height h */
  function flame(c, x, baseY, w, h) {
    c.beginPath();
    c.moveTo(x, baseY);
    c.quadraticCurveTo(x - w, baseY - h * 0.5, x - w * 0.28, baseY - h * 0.72);
    c.quadraticCurveTo(x - w * 0.08, baseY - h * 0.88, x, baseY - h);
    c.quadraticCurveTo(x + w * 0.08, baseY - h * 0.88, x + w * 0.28, baseY - h * 0.72);
    c.quadraticCurveTo(x + w, baseY - h * 0.5, x, baseY);
    c.closePath(); c.fill();
  }

  /* camp dimensions — scaled off the SMALLER screen dimension so the camp shrinks on
     narrow phones instead of looming (height alone left the A-frame too wide on tall,
     skinny viewports). A tent is ~2m where a spruce is ~15m, so it's kept well under
     the near treeline: it nestles in the clearing rather than looming over the forest.
     tH drives every other size, so the proportions stay locked. */
  function campDims() {
    const tH = Math.min(60, Math.max(30, Math.min(W, H) * 0.056)); // tent height (screen-aware)
    return { tH, tW: tH * 1.6, rr: Math.max(10, tH * 0.26) };      // tent width (A-frame) + fire-pit radius
  }

  function campCenters(dims = campDims()) {
    const mid = W * ((CAMP_TENT_X + CAMP_FIRE_X) / 2);
    const idealGap = W * (CAMP_FIRE_X - CAMP_TENT_X);
    const maxGap = Math.max(112, dims.tW * 1.45 + dims.rr * 1.3);
    const gap = Math.min(idealGap, maxGap);
    return { tentX: mid - gap / 2, fireX: mid + gap / 2 };
  }

  function campFireY(gy, dims = campDims()) {
    return gy + Math.max(4, dims.tH * 0.08);
  }

  /* the campsite STRUCTURE — a tent + the crossed woodpile, drawn into the scenery
     sitting ON the ground line. Drawn BEFORE the framing conifers (and grass) so the
     foreground trees/blades overlap it for depth; the warm fire is a separate pass
     (drawFirepit) laid over the night wash so it still glows against the dark. */
  function drawCamp(t, a, gy) {
    ctx.save();
    const { tH, tW, rr } = campDims();
    const { tentX, fireX } = campCenters({ tH, tW, rr });

    // soft ambient contact shadows so the camp reads as planted on the ground. (At
    // night the campfire throws its own long, flickering cast shadow of the tent — see
    // drawFirepit, where it's laid over the grass and night wash at full contrast.)
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(tentX, gy + 4, tW * 0.6, 8, 0, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(fireX, campFireY(gy, { tH, tW, rr }) + 3, rr * 1.45, 6, 0, 0, 6.2832); ctx.fill();

    // ---- tent ----
    const tx = tentX, by = gy;
    ctx.fillStyle = '#c39c6e';
    ctx.beginPath(); ctx.moveTo(tx, by - tH); ctx.lineTo(tx + tW / 2, by); ctx.lineTo(tx - tW / 2, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9a7748';
    ctx.beginPath(); ctx.moveTo(tx, by - tH); ctx.lineTo(tx + tW * 0.18, by); ctx.lineTo(tx - tW * 0.18, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#19120a';
    ctx.beginPath(); ctx.moveTo(tx, by - tH * 0.52); ctx.lineTo(tx + tW * 0.11, by); ctx.lineTo(tx - tW * 0.11, by); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(190,160,120,.7)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, by - tH); ctx.lineTo(tx, by - tH - 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx - tW / 2, by); ctx.lineTo(tx - tW * 0.6, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx + tW / 2, by); ctx.lineTo(tx + tW * 0.6, by); ctx.stroke();

    // ---- crossed logs (the woodpile under the fire) ----
    const fx = fireX, fy = campFireY(gy, { tH, tW, rr });
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#3c2a18'; ctx.lineWidth = rr * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx - rr * 0.55, fy + rr * 0.1); ctx.lineTo(fx + rr * 0.55, fy - rr * 0.06); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx - rr * 0.55, fy - rr * 0.06); ctx.lineTo(fx + rr * 0.55, fy + rr * 0.1); ctx.stroke();
    ctx.restore();
  }

  /* the warm fire — ember bed, after-dusk glow + flames, and the ring of stones —
     drawn as its OWN pass AFTER the night wash (and after the framing conifers) so the
     campfire glows against the dark while the structure stays tucked behind the
     foreground trees. Flames only after dusk; by day the pit just smoulders. */
  function drawFirepit(t, a, gy, fireAlive = 1) {
    ctx.save();
    const { tH, tW, rr } = campDims();
    const { tentX, fireX } = campCenters({ tH, tW, rr });
    const fx = fireX, fy = campFireY(gy, { tH, tW, rr });
    const lit = nightAmount();   // 0 in daylight → 1 at night (dawn/dusk fades)
    const litFire = lit * fireAlive;
    const active = a * fireAlive;
    const fl = reduce ? 1 : (1 + Math.sin(t * 0.013) * 0.12 + Math.sin(t * 0.031) * 0.07);
    // the campfire is the light: at night it throws a long shadow of the tent ACROSS
    // the clearing, cast away from the fire and flickering as the flame breathes. Drawn
    // first in this pass (over the grass + night wash) so it darkens the ground it falls
    // on at full contrast, then the warm fire is laid on top.
    if (litFire > 0.01) {
      const dir = Math.sign(tentX - fireX) || -1;               // away from the fire
      const txc = tentX;
      const len = tW * (1.7 + (fl - 1) * 1.8) * litFire;        // long & low, flickering with the flame
      const sx0 = txc + dir * tW * 0.08;                        // anchored at the tent's far foot
      const sx1 = txc + dir * len;                              // shadow tip
      const cy = gy + 5;
      const grad = ctx.createLinearGradient(sx0, cy, sx1, cy);
      grad.addColorStop(0, `rgba(0,0,0,${0.42 * litFire})`); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = a;
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse((sx0 + sx1) / 2, cy, Math.abs(sx1 - sx0) / 2, 9, 0, 0, 6.2832); ctx.fill();

      // ...and the complement of that shadow: the fire that throws the shadow also
      // LIGHTS the tent. Its fire-facing slope catches a warm, flickering wash (added
      // with 'lighter' so it reads as light, not paint) falling off from the near foot,
      // while the far slope stays in shadow — clipped to the A-frame so it sits on the
      // canvas. Without this the tent shadowed the ground as if lit, yet stayed dark.
      const apexY = gy - tH, nearFoot = txc - dir * tW * 0.5;   // foot facing the fire (dir points away)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(txc, apexY); ctx.lineTo(txc + tW / 2, gy); ctx.lineTo(txc - tW / 2, gy); ctx.closePath();
      ctx.clip();
      const flit = ctx.createRadialGradient(nearFoot, gy, 0, nearFoot, gy, tW * 1.1);
      flit.addColorStop(0, `rgba(255,172,92,${0.46 * litFire * fl})`);
      flit.addColorStop(0.5, `rgba(255,150,74,${0.15 * litFire * fl})`);
      flit.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = flit;
      ctx.fillRect(txc - tW / 2, apexY, tW, tH);
      ctx.restore();
    }
    // faint smouldering ember bed — always there ("lit last night, still smoking")
    ctx.globalAlpha = 1;
    const ember = ctx.createRadialGradient(fx, fy, 0, fx, fy, rr * 0.9);
    ember.addColorStop(0, `rgba(255,120,50,${(0.16 + 0.06 * Math.sin(t * 0.004)) * active})`); ember.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = ember; ctx.beginPath(); ctx.arc(fx, fy, rr * 0.9, 0, 6.2832); ctx.fill();
    // warm glow + flames — only after dusk
    if (litFire > 0.01) {
      const glow = ctx.createRadialGradient(fx, fy - rr * 0.7, 0, fx, fy - rr * 0.7, rr * 3.1);
      glow.addColorStop(0, `rgba(255,176,86,${0.55 * active * fl * litFire})`); glow.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fx, fy - rr * 0.7, rr * 3.1, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = active * litFire;
      const fh = rr * 1.6 * fl;
      ctx.fillStyle = '#ef8a3a'; flame(ctx, fx, fy - rr * 0.05, rr * 0.95, fh);
      ctx.fillStyle = '#ffd070'; flame(ctx, fx, fy - rr * 0.05, rr * 0.5, fh * 0.6);
    }
    ctx.globalAlpha = a;
    // ring of stones (in front of the fire)
    ctx.fillStyle = '#6f747e';
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2 + 0.35;
      const sxp = fx + Math.cos(ang) * rr, syp = fy + Math.sin(ang) * rr * 0.42;
      if (syp < fy - rr * 0.12) continue; // skip back stones for a little depth
      ctx.beginPath(); ctx.ellipse(sxp, syp, rr * 0.2, rr * 0.14, 0, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- the Moon's real orbital physics ----------
     A compact, dependency-free lunar ephemeris (Paul Schlyter's low-precision method
     with the main perturbation terms — good to a few arc-minutes, far finer than this
     scene needs). Given the moment and an observer it returns the Moon's true position
     in the sky (altitude + azimuth) and its real phase (illuminated fraction +
     waxing/waning). The EXOSPHERE moon is placed and lit from this, so it appears
     where — and as — the actual Moon does for the visitor right now. The observer's
     longitude comes from the device timezone (no geolocation prompt); latitude defaults
     to a mid-northern value. Override either via DESCENT_CONFIG.moonLat / moonLon. */
  const OBS_LON = cfg.moonLon != null ? cfg.moonLon : -new Date().getTimezoneOffset() / 4; // tz → °E
  const OBS_LAT = cfg.moonLat != null ? cfg.moonLat : 20;
  function moonAstro(date, latDeg, lonDeg) {
    const D2R = Math.PI / 180, R2D = 180 / Math.PI;
    const rev = x => x - Math.floor(x / 360) * 360;
    const sin = x => Math.sin(x * D2R), cos = x => Math.cos(x * D2R);
    const atan2d = (y, x) => R2D * Math.atan2(y, x);
    const asind = x => R2D * Math.asin(Math.max(-1, Math.min(1, x)));
    const acosd = x => R2D * Math.acos(Math.max(-1, Math.min(1, x)));
    const Y = date.getUTCFullYear(), Mo = date.getUTCMonth() + 1, Dd = date.getUTCDate();
    const UT = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const d = 367 * Y - Math.floor(7 * (Y + Math.floor((Mo + 9) / 12)) / 4)
            + Math.floor(275 * Mo / 9) + Dd - 730530 + UT / 24;
    const ecl = 23.4393 - 3.563e-7 * d;
    // Sun (needed for sidereal time + the Moon's phase/perturbations)
    const ws = 282.9404 + 4.70935e-5 * d, esn = 0.016709 - 1.151e-9 * d;
    const Ms = rev(356.0470 + 0.9856002585 * d);
    const Esn = Ms + esn * R2D * sin(Ms) * (1 + esn * cos(Ms));
    const lonsun = rev(atan2d(Math.sqrt(1 - esn * esn) * sin(Esn), cos(Esn) - esn) + ws);
    const Ls = rev(ws + Ms);
    // Moon orbital elements
    const N = 125.1228 - 0.0529538083 * d, inc = 5.1454;
    const w = 318.0634 + 0.1643573223 * d, a = 60.2666, e = 0.054900;
    const M = rev(115.3654 + 13.0649929509 * d);
    let E = M + e * R2D * sin(M) * (1 + e * cos(M));
    for (let k = 0; k < 8; k++) { const dE = (E - e * R2D * sin(E) - M) / (1 - e * cos(E)); E -= dE; if (Math.abs(dE) < 1e-7) break; }
    const xv = a * (cos(E) - e), yv = a * Math.sqrt(1 - e * e) * sin(E);
    const v = atan2d(yv, xv), r = Math.sqrt(xv * xv + yv * yv);
    const xeclip = r * (cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(inc));
    const yeclip = r * (sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(inc));
    const zeclip = r * (sin(v + w) * sin(inc));
    let lonecl = rev(atan2d(yeclip, xeclip));
    let latecl = atan2d(zeclip, Math.sqrt(xeclip * xeclip + yeclip * yeclip));
    // main perturbations (Evection, Variation, Yearly equation, …)
    const Lm = rev(N + w + M), Dm = rev(Lm - Ls), F = rev(Lm - N);
    lonecl += -1.274 * sin(M - 2 * Dm) + 0.658 * sin(2 * Dm) - 0.186 * sin(Ms)
            - 0.059 * sin(2 * M - 2 * Dm) - 0.057 * sin(M - 2 * Dm + Ms)
            + 0.053 * sin(M + 2 * Dm) + 0.046 * sin(2 * Dm - Ms) + 0.041 * sin(M - Ms)
            - 0.035 * sin(Dm) - 0.031 * sin(M + Ms) - 0.015 * sin(2 * F - 2 * Dm)
            + 0.011 * sin(M - 4 * Dm);
    latecl += -0.173 * sin(F - 2 * Dm) - 0.055 * sin(M - F - 2 * Dm)
            - 0.046 * sin(M + F - 2 * Dm) + 0.033 * sin(F + 2 * Dm) + 0.017 * sin(2 * M + F);
    lonecl = rev(lonecl);
    // ecliptic → equatorial (geocentric direction is enough for a backdrop)
    const xe = cos(lonecl) * cos(latecl), ye = sin(lonecl) * cos(latecl), ze = sin(latecl);
    const yeq = ye * cos(ecl) - ze * sin(ecl), zeq = ye * sin(ecl) + ze * cos(ecl);
    const RA = rev(atan2d(yeq, xe)), Dec = asind(zeq);
    // local sidereal time → hour angle → altitude/azimuth
    const GMST0 = rev(Ls + 180) / 15;
    const LST = rev((GMST0 + UT) * 15 + lonDeg);
    let HA = rev(LST - RA); if (HA > 180) HA -= 360;
    const altR = Math.asin(Math.max(-1, Math.min(1, sin(Dec) * sin(latDeg) + cos(Dec) * cos(latDeg) * cos(HA))));
    let cosA = (sin(Dec) - sin(latDeg) * Math.sin(altR)) / (cos(latDeg) * Math.cos(altR));
    let az = acosd(cosA); if (sin(HA) > 0) az = 360 - az;     // from North: N=0,E=90,S=180,W=270
    // phase
    const elong = acosd(cos(lonsun - lonecl) * cos(latecl));
    return { alt: altR * R2D, az, illum: (1 + cos(180 - elong)) / 2, waxing: rev(lonecl - lonsun) < 180 };
  }
  // the Moon barely moves frame-to-frame, so refresh the ephemeris at most ~every 20s
  let moonCache = null, moonCacheT = -1e9;
  function moonNow(t) {
    if (!moonCache || t - moonCacheT > 20000) { moonCache = moonAstro(new Date(), OBS_LAT, OBS_LON); moonCacheT = t; }
    return moonCache;
  }

  /* the moon — a glowing disc with a soft halo and a few faint craters. Called two ways:
     • no `phase` (the night-beach moon) → a full, evenly-lit disc, unchanged.
     • with `phase` {illum, waxing} (the exosphere moon) → only the sunlit portion is
       drawn; the dark limb dissolves into the space backdrop, leaving a real crescent /
       gibbous, with a whisper of earthshine so the whole disc is still faintly hinted. */
  function drawMoon(cx, cy, r, a, phase) {
    if (a <= 0.01) return;
    const haloK = phase ? 0.3 + 0.7 * phase.illum : 1;   // a slim crescent glows less than a full moon
    const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 3.4);
    halo.addColorStop(0, `rgba(206,222,255,${0.20 * a * haloK})`); halo.addColorStop(1, 'rgba(206,222,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 3.4, 0, 6.2832); ctx.fill();
    const disc = () => {
      const body = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.32, r * 0.2, cx, cy, r);
      body.addColorStop(0, `rgba(248,250,255,${0.97 * a})`); body.addColorStop(1, `rgba(180,194,226,${0.92 * a})`);
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = `rgba(150,165,200,${0.32 * a})`;
      ctx.beginPath(); ctx.arc(cx - r * 0.34, cy - r * 0.08, r * 0.18, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + r * 0.30, cy + r * 0.24, r * 0.12, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + r * 0.04, cy - r * 0.36, r * 0.09, 0, 6.2832); ctx.fill();
    };
    if (!phase || phase.illum > 0.985) { disc(); return; }   // full (or unphased) → whole lit disc
    // a faint earthshine hint of the full disc, then clip to the lit portion and draw it
    ctx.fillStyle = `rgba(150,165,205,${0.06 * a})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    if (!phase.waxing) ctx.scale(-1, 1);                       // build for a right-lit limb; mirror for waning
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);       // the lit limb (right semicircle)
    const k = 2 * phase.illum - 1;                            // + gibbous … − crescent; |k|·r = terminator width
    ctx.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k < 0); // the terminator
    ctx.closePath(); ctx.clip();
    if (!phase.waxing) ctx.scale(-1, 1);                       // undo the mirror (reverse order) …
    ctx.translate(-cx, -cy);                                   // … then the translate, so disc() draws upright
    disc();
    ctx.restore();
  }

  /* ---------- emoji objects you pass ---------- */
  const SPRITES = [
    { e: '🪐', p: 0.045, x: 72, s: 96, w: 0.10, m: 'drift' },
    /* satellite + comet share depth (p) and band (w) so they ride the same
       vertical track, sit ~6% apart in x, and share a phase GROUP ('arc') so the
       comet's mid-dive meets the satellite mid-sweep — a recurring near-miss. The
       group's phase is randomised per page load (see buildSprites), so the pair
       stays locked together but you can't predict when they'll enter the view */
    { e: '🛰️', p: 0.18, x: 47, s: 46, w: 0.11, m: 'cross', phase: 'arc' },
    { e: '☄️', p: 0.18, x: 53, s: 40, w: 0.11, m: 'streak', phase: 'arc', egg: 'comet' }, // catch it → it bursts (see catchComet)
    { e: '✈️', p: 0.345, x: 50, s: 58, w: 0.085, m: 'cross', face: 'right', rot0: 0 },
    { e: '🦅', p: 0.40, x: 70, s: 38, w: 0.065, m: 'glide' },
    /* the campsite (tent + stone fireplace) is drawn into the scenery on the
       ground (see drawCamp); the balloon sprite was removed */
    /* small fish are drawn as a lively, continuously-swimming canvas school
       (see the fish system below) rather than passing emoji/SVG sprites — and the
       species change with depth, from reef fish to deep-sea dwellers */
    /* the sea turtle ambles onto the beach, plods along the sand, then slips into
       the rising tide and swims off as we sink below the surface. Its whole
       beach→shallows journey (position, gait, the land→water handover) is driven by
       updateTurtle, so p/w here are only a nominal span — the real range is in there */
    { e: '🐢', p: 0.55, x: 24, s: 60, w: 0.3, m: 'turtle' },
    /* a rare golden seahorse hovering in the kelpy shallows — `rare` is its odds of
       turning up at all on a given visit (rolled in buildSprites), so most descents
       pass the spot empty and the ones that don't feel like a small lucky find */
    { e: 'seahorse', p: 0.79, x: 80, s: 48, w: 0.075, glow: 'warm', m: 'hover', rare: 0.2, egg: 'seahorse' }, // a rare catch (see catchEgg)
    { e: '🐋', p: 0.815, x: 54, s: 132, w: 0.15, glow: 'cool', m: 'swim' },
    { e: '🦑', p: 0.875, x: 64, s: 54, w: 0.09, glow: 'cool', m: 'swim' },
    { e: '🪼', p: 0.915, x: 38, s: 72, w: 0.10, glow: 'cool', m: 'pulse' },
    { e: '🐙', p: 0.965, x: 56, s: 64, w: 0.11, glow: 'cool', m: 'swim' },
  ];
  let spriteEls = [];
  function buildSprites() {
    if (!spriteLayer || cfg.sprites === false) return;
    spriteLayer.innerHTML = '';
    const groupPhase = {};                              // sprites sharing a `phase` group id ride one common random phase
    spriteEls = SPRITES.map(sp => {
      // phase is the start offset of a sprite's motion. A string `phase` = a group
      // that shares one random phase (keeps paired sprites locked, e.g. sat↔comet);
      // anything else gets its own random phase. All are randomised per page load so
      // birds, fish and the comet can't be timed entering the view.
      sp._ph = (typeof sp.phase === 'string')
        ? (groupPhase[sp.phase] != null ? groupPhase[sp.phase] : (groupPhase[sp.phase] = Math.random() * 6.28))
        : Math.random() * 6.28;
      sp._sp = rnd(0.5, 1.0);                         // swim speed
      sp._amp = (sp.m === 'swim' ? (sp.s > 100 ? W * 0.14 : W * 0.05) : 0); // swim sway px
      // `rare` sprites (e.g. the seahorse) roll their luck once per page load; a lost
      // roll leaves an empty placeholder el so the SPRITES↔spriteEls indexes stay aligned
      sp._present = (sp.rare == null) || (Math.random() < sp.rare);
      const el = document.createElement('div');
      el.className = 'd-sprite';
      if (sp._present) {
        const lib = window.DESCENT_SPRITES || {};
        const svg = lib[sp.e] || lib[sp.e.replace(/️/g, '')];
        if (svg) { el.innerHTML = svg; el.style.width = sp.s + 'px'; }
        else { el.textContent = sp.e; el.style.fontSize = sp.s + 'px'; }
        el.style.left = sp.x + '%';
        if (sp.glow === 'warm') el.style.filter = 'drop-shadow(0 0 22px rgba(255,170,90,.5))';
        if (sp.glow === 'fire') el.style.filter = 'drop-shadow(0 0 18px rgba(255,120,40,.85))';
        if (sp.glow === 'cool') el.style.filter = 'drop-shadow(0 0 22px rgba(0,200,240,.45))';
      }
      spriteLayer.appendChild(el);
      return el;
    });

    // wire the catchable eggs (comet, seahorse): each is only clickable while
    // visible (updateSprites toggles pointer-events), and already-caught browsers
    // never re-arm it. The sprite layer sits BEHIND the page content, so a click on
    // an egg would otherwise land on whatever section is in front of it — lift the
    // eggs into a thin layer above the content so they're genuinely catchable.
    // (top/left positioning is unchanged: both layers are fixed, full-viewport.)
    let eggLayer = null;
    SPRITES.forEach((sp, i) => {
      if (!sp.egg) return;
      const el = spriteEls[i];
      el.classList.add('egg-catch');
      sp._caught = !!(window.EasterEggs && window.EasterEggs.has(sp.egg));
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); catchEgg(sp, el); });
      if (!eggLayer) {
        eggLayer = document.getElementById('egg-layer');
        if (!eggLayer) {
          eggLayer = document.createElement('div');
          eggLayer.id = 'egg-layer';
          eggLayer.setAttribute('aria-hidden', 'true');
          document.body.appendChild(eggLayer);
        }
      }
      eggLayer.appendChild(el);
    });
  }

  /* a shower of sparks bursting outward from a viewport point (cx, cy) plus one
     expanding shock ring — icy blue/white for the comet, warm gold for the seahorse */
  function burstAt(cx, cy, warm) {
    for (let i = 0, n = N(26); i < n; i++) {
      const a = Math.random() * 6.2832, sp = rnd(1.6, 6.8);
      burst.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rnd(1.2, 3.2), life: 1, warm: warm, alt: Math.random() < 0.55 });
    }
    burst.push({ ring: true, x: cx, y: cy, life: 1, warm: warm });
  }

  // catch an egg: burst it where it sits, hide it for the rest of this pass, and
  // hand off to the site-wide easter-egg tracker (decoupled via a DOM event)
  function catchEgg(sp, el) {
    if (!sp || sp._caught) return;
    sp._caught = true; sp._suppress = true;
    const r = el.getBoundingClientRect();
    burstAt(r.left + r.width / 2, r.top + r.height / 2, sp.egg === 'seahorse');  // viewport px == canvas px (canvas is fixed, full-viewport)
    el.style.opacity = '0'; el.style.pointerEvents = 'none';
    window.dispatchEvent(new CustomEvent('easteregg', { detail: { id: sp.egg } }));
  }

  /* the golden fish is a catchable egg too: a tap on (or near) a rare gold
     specimen in the passing shoal bursts it in a shower of warm sparks and
     registers the find, then it swims on as an ordinary fish of its species.
     Gold is ~1% of the shoal (any species, any depth — see GOLD_RARITY), so a
     catch is a genuine lucky grab. Canvas-drawn, so it's hit-tested here on
     pointerdown rather than wired as a DOM target like the comet/seahorse. */
  function catchGoldFish(cx, cy) {
    if (!fishes.length || prog() < 0.66) return false;       // the shoal isn't in the water yet
    let best = null, bestD = Infinity;
    for (const f of fishes) {
      if (!f.gold || f.zoneFade < 0.3) continue;             // only a clearly-visible gold one
      const fx = f.x * W, fy = f.y * H + Math.sin(f.bob) * f.bobA * (1 - 0.8 * f.hold);
      const d = Math.hypot(cx - fx, cy - fy);
      if (d < f.size + 26 && d < bestD) { best = f; bestD = d; }  // generous, forgiving hit-ring on a small moving target
    }
    if (!best) return false;
    const by = best.y * H + Math.sin(best.bob) * best.bobA * (1 - 0.8 * best.hold);
    burstAt(best.x * W, by, true);                           // warm/gold burst, like the seahorse
    best.gold = false; best.col = speciesCol(best.kind);     // the gold's been caught — it swims on as an ordinary fish
    best.fear = Math.max(best.fear, 0.9);                    // and bolts, the way a grabbed-at fish would
    window.dispatchEvent(new CustomEvent('easteregg', { detail: { id: 'goldfish' } }));
    return true;
  }
  /* ---------- the sea turtle: a beach walk that becomes a swim ----------
     It fades in on the sand, plods along the shore (a lurching, low gait) until the
     flooding tide reaches it (~p 0.595), then lifts off the sand into the water
     column and glides away with a smooth swimming sway as we keep sinking past it.
     Drives the element's transform itself (own opacity, position, gait), so it
     ignores the generic band model. py keeps it parallaxing with the beach scene. */
  function updateTurtle(el, p, tt, py, ph) {
    const IN0 = 0.485, IN1 = 0.515, OUT0 = 0.80, OUT1 = 0.835;
    if (p < IN0 || p > OUT1) { el.style.opacity = '0'; return; }
    let op = 1;
    if (p < IN1) op = (p - IN0) / (IN1 - IN0);            // wades into view on the sand
    else if (p > OUT0) op = (OUT1 - p) / (OUT1 - OUT0);   // fades out into the deep
    op *= (preview ? 0.9 : 1);

    // land(0) → water(1): the tide reaches it ~0.595 and it's fully swimming by ~0.66
    const SAND = 0.595, SWUM = 0.66;
    let w = (p - SAND) / (SWUM - SAND); w = w < 0 ? 0 : (w > 1 ? 1 : w);
    const ws = w * w * (3 - 2 * w);                       // smoothstep

    // vertical: walks the shoreline (~0.80H), lifts into the water column (~0.45H) as
    // it swims off, then drifts gently down as we descend deeper past it
    const yLand = 0.30 * H, yWater = -0.05 * H;
    let yBase = yLand + (yWater - yLand) * ws + Math.max(0, p - SWUM) * 1.1 * H + py * 0.7;

    // horizontal: a slow creep along the sand toward the water, then a swimming sway
    const creep = p < SAND ? (p - IN0) / (SAND - IN0) : 1;
    let xBase = (creep < 0 ? 0 : creep) * W * 0.16;

    // it heads rightward the whole way (up the sand, then off into open water), so it
    // simply faces right throughout — the SVG faces left by default, hence scale -1
    let dx = 0, dy = 0, rot = 0;
    if (!reduce) {
      // gait: a plodding lurch on land easing into a smooth glide in the water
      const lurchB = Math.sin(tt * 2.4) * 5, lurchR = Math.sin(tt * 1.2 + 0.5) * 4;
      const glideB = Math.sin(tt * 0.9 + ph) * 10, glideR = Math.sin(tt * 0.8 + ph) * 5;
      dy = lurchB + (glideB - lurchB) * ws;
      rot = lurchR + (glideR - lurchR) * ws;
      const sway = Math.sin(tt * 0.6 + ph) * W * 0.05, shuffle = Math.sin(tt * 2.4) * 4;
      dx = shuffle + (sway - shuffle) * ws;
    }

    el.style.opacity = op.toFixed(3);
    el.style.transform = `translate(-50%,-50%) translate(${(xBase + dx).toFixed(1)}px, ${(yBase + dy).toFixed(1)}px) scale(-1, 1) rotate(${rot.toFixed(2)}deg)`;
  }

  function updateSprites(p, t) {
    if (!spriteEls.length) return;
    const tt = t * 0.001;
    const py = (my - 0.5) * 16;                   // shared mouse parallax (matches the canvas scene)
    for (let i = 0; i < SPRITES.length; i++) {
      const sp = SPRITES[i], el = spriteEls[i];
      if (sp._present === false) { el.style.opacity = '0'; continue; } // rare sprite that didn't roll in this load
      if (sp.m === 'turtle') { updateTurtle(el, p, tt, py, sp._ph || 0); continue; }
      const d = p - sp.p;
      if (Math.abs(d) > sp.w) { el.style.opacity = '0'; if (sp.egg) { el.style.pointerEvents = 'none'; sp._suppress = false; } continue; }
      const k = d / sp.w;                         // -1 (below, approaching) … +1 (above, passed)
      let yPx = -k * 0.78 * H;                     // descend → object rises up the screen
      let op = (1 - Math.abs(k)) * (preview ? 0.9 : 1);
      let sc = 0.7 + (1 - Math.abs(k)) * 0.5;
      if (sp.ground) {
        // planted on the ground: sits on the ground line and just fades in/out, no scroll-rise
        yPx = groundY() - H * 0.5;
        op = Math.min(1, (1 - Math.abs(k)) * 1.8) * (preview ? 0.9 : 1);
        sc = 1;
      }
      // ---- continuous life (independent of scroll) ----
      let dx = 0, dy = 0, rot = 0, sx = 1, lifeScale = 1, lifeOp = 1;
      const ph = sp._ph || 0;
      const faceRight = sp.face === 'right';      // most animal emoji face LEFT by default
      // face the way you travel (cos = velocity sign): keeps birds/fish from flying backwards
      const facing = (c) => ((c >= 0) === faceRight) ? 1 : -1;
      if (!reduce) switch (sp.m) {
        case 'fly': { const a = tt * 0.28 + ph; dx = Math.sin(a) * W * 0.34; sx = facing(Math.cos(a)); dy = Math.sin(tt * 0.9 + ph) * 8; break; }
        case 'glide': { const a = tt * 0.32 + ph; dx = Math.sin(a) * W * 0.30; sx = facing(Math.cos(a)); dy = Math.sin(tt * 1.3 + ph) * 16; break; }
        case 'swim': { const a = tt * sp._sp + ph; dx = Math.sin(a) * sp._amp; sx = facing(Math.cos(a)); dy = Math.sin(tt * sp._sp * 1.7 + ph) * 12; rot = Math.sin(tt * sp._sp * 2 + ph) * 5; break; }
        case 'cross': { const span = (tt * 0.045 + ph) % 1; dx = (span - 0.5) * W * 1.3; dy = Math.sin(tt * 0.6 + ph) * 9; break; }
        case 'streak': { const span = (tt * 0.09 + ph) % 1; dx = (0.5 - span) * W * 0.9; dy = (span - 0.5) * W * 0.833; lifeOp = Math.max(0, Math.min(1, span / 0.1, (1 - span) / 0.18)); break; }   // dives down-left at ~43\u00b0 to match the \u2604\ufe0f tail; dy scales with W (not H) so the angle stays constant on tall phone viewports instead of going near-vertical
        case 'hover': {
          // a hovering seahorse: instead of bobbing on one spot it wanders the spot in
          // a slow, looping drift (two out-of-step sines → an organic, non-repeating path),
          // bobs gently, and leans into whichever way it's drifting — the lean follows the
          // drift's velocity (cos of the same phase), the way a real one tips as its dorsal
          // fin nudges it along. Amplitudes scale with W so the wander reads the same on phones.
          dx = Math.sin(tt * 0.23 + ph) * W * 0.05 + Math.sin(tt * 0.41 + ph * 1.7) * W * 0.022;
          dy = Math.sin(tt * 1.1 + ph) * 9 + Math.cos(tt * 0.19 + ph) * 12;
          rot = Math.cos(tt * 0.23 + ph) * 7 + Math.sin(tt * 0.9 + ph) * 2;
          break;
        }
        case 'pulse': { lifeScale = 1 + Math.sin(tt * 1.7 + ph) * 0.09; dy = Math.sin(tt * 0.5 + ph) * 18; break; }
        case 'flicker': { lifeScale = 1 + Math.sin(tt * 13 + ph) * 0.07 + Math.sin(tt * 7.3 + ph) * 0.04; break; }
        case 'spin': { rot = (tt * 55 + ph * 57) % 360; dy = Math.sin(tt * 0.6 + ph) * 8; break; }
        case 'sway': { rot = Math.sin(tt * 0.7 + ph) * 1.6; break; }
        case 'still': { break; }
        case 'drift': { dx = Math.sin(tt * 0.08 + ph) * 44; dy = Math.cos(tt * 0.06 + ph) * 26; rot = Math.sin(tt * 0.05 + ph) * 6; break; }
        default: dy = Math.sin(tt * 0.6 + ph) * 6;
      }
      rot += sp.rot0 || 0;                         // base orientation (e.g. level the plane to a side view)
      op *= lifeOp;                                // per-pass fade so the streak stays visible across its whole fall
      if (sp.egg) {
        // once caught, stay burst-away until this pass leaves the view (op→0), then
        // return as plain scenery; clickable only while clearly visible & not yet caught
        if (sp._suppress) { if (op <= 0.02) sp._suppress = false; else op = 0; }
        el.style.pointerEvents = (!sp._caught && op > 0.12) ? 'auto' : 'none';
      }
      const total = sc * lifeScale;
      el.style.opacity = op.toFixed(3);
      el.style.transform = `translate(-50%,-50%) translate(${dx.toFixed(1)}px, ${(yPx + dy).toFixed(1)}px) scale(${(sx * total).toFixed(3)}, ${total.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
    }
  }

  /* ---------- gauge ---------- */
  let gEls = null;
  function buildGauge() {
    const g = document.getElementById('descent-gauge');
    if (!g) return;
    g.innerHTML =
      '<div class="g-track"><div class="g-fill"></div>' +
      ZONES.map(z => `<div class="g-tick" style="top:${(z.p * 100).toFixed(1)}%"></div>`).join('') +
      '<div class="g-dot"></div></div>' +
      '<div class="g-read">' +
        '<div class="g-zone"></div><div class="g-jp"></div>' +
        '<div class="g-num"><span class="g-v">0</span><span class="g-u">m</span></div>' +
        '<div class="g-dir">SEA LEVEL</div>' +
      '</div>';
    gEls = {
      fill: g.querySelector('.g-fill'), dot: g.querySelector('.g-dot'), read: g.querySelector('.g-read'),
      v: g.querySelector('.g-v'), u: g.querySelector('.g-u'),
      dir: g.querySelector('.g-dir'), zone: g.querySelector('.g-zone'), jp: g.querySelector('.g-jp'),
    };
    // fill = each sphere's temperature, anchored to the full track height so a
    // zone keeps its colour as the fill grows past it (not stretched)
    const stops = [`${ZONES[0].t} 0%`]
      .concat(ZONES.map(z => `${z.t} ${(z.p * 100).toFixed(0)}%`))
      .concat([`${ZONES[ZONES.length - 1].t} 100%`]).join(', ');
    gEls.fill.style.backgroundImage = `linear-gradient(to bottom, ${stops})`;
    gEls.fill.style.backgroundRepeat = 'no-repeat';
    gEls.fill.style.backgroundPosition = 'top';
    sizeGaugeFill();
    window.addEventListener('resize', sizeGaugeFill);
  }
  function sizeGaugeFill() {
    const g = document.getElementById('descent-gauge');
    if (g && gEls) gEls.fill.style.backgroundSize = '100% ' + g.clientHeight + 'px';
  }
  function updateGauge(p) {
    if (!gEls) return;
    const m = depthAt(p), z = zoneAt(p);
    let v, u, dir;
    const am = Math.abs(m);
    if (am < 1) { v = '0'; u = 'm'; dir = 'SEA LEVEL'; }
    else if (am >= 1000) { v = (am / 1000).toFixed(am >= 100000 ? 0 : 1); u = 'km'; dir = m > 0 ? 'ALTITUDE' : 'DEPTH'; }
    else { v = Math.round(am).toLocaleString(); u = 'm'; dir = m > 0 ? 'ALTITUDE' : 'DEPTH'; }
    gEls.v.textContent = (m < 0 && am >= 1 ? '−' : '') + v;   // no "−0": sub-1m reads as SEA LEVEL 0
    gEls.u.textContent = u;
    gEls.dir.textContent = dir;
    gEls.zone.textContent = z.key;
    gEls.jp.textContent = z.jp;
    const pct = (p * 100) + '%';
    gEls.fill.style.height = pct;
    gEls.dot.style.top = pct;
    gEls.read.style.top = pct;   // the readout rides the dot down the track
    // dot + sphere name glow in the current temperature
    const c = tempAt(p);
    gEls.dot.style.background = c;
    gEls.dot.style.boxShadow = `0 0 14px ${c}, 0 0 0 4px ${c.replace('rgb(', 'rgba(').replace(')', ',0.18)')}`;
    gEls.zone.style.color = c;
  }

  /* ---------- render ---------- */
  let mx = 0.5, my = 0.5, clickPulse = 0, lastT = 0, idleT = 0, curious = 0, pointerHere = false;
  window.addEventListener('mousemove', e => { mx = e.clientX / W; my = e.clientY / H; idleT = 0; pointerHere = true; });
  // fish are click-shy: a tap/click scatters the ones nearby (clickPulse fuels the flee burst);
  // with no click they cruise past the cursor — and if it sits still a while, the nosy ones drift over
  window.addEventListener('pointerdown', e => { mx = e.clientX / W; my = e.clientY / H; clickPulse = 1; idleT = 0; pointerHere = true; catchGoldFish(e.clientX, e.clientY); });
  window.addEventListener('mouseout', e => { if (!e.relatedTarget && !e.toElement) pointerHere = false; });
  window.addEventListener('blur', () => { pointerHere = false; });

  function frame(t) {
    // frames elapsed since last paint (1 = a 60fps frame) — keeps motion fps-independent so it
    // doesn't crawl while a busy scroll starves the rAF loop. Clamped so a long pause can't teleport.
    const dt = lastT ? Math.min(3, (t - lastT) / 16.667) : 1;
    lastT = t;
    const p = prog();
    const g = gradAt(p);
    const lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, g.a); lg.addColorStop(1, g.b);
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);

    // Pull the sky/sea background toward night by the device's local time, so each
    // zone you enter is as dark as the night scene around it — no quick dark→bright
    // snap as space hands off to the sky, or the moonlit surf to the open sea. Drawn
    // over the gradient only, so stars, the moon and the fish still shine on top.
    // No-op by day; see nightBgEnv for the per-zone envelope.
    const nightBg = nightAmount() * nightBgEnv(p);
    if (nightBg > 0.001) { ctx.fillStyle = `rgba(6,12,30,${0.6 * nightBg})`; ctx.fillRect(0, 0, W, H); }

    const px = (mx - 0.5) * 24, py = (my - 0.5) * 16;

    // ── celestial arc: a natural east→west sky path set by the device's local time.
    //    Drives the daytime SUN and the night-BEACH moon (a gentle hand-tuned arc). The
    //    EXOSPHERE moon does NOT use this — it follows the Moon's real ephemeris (see the
    //    moon block below / moonAstro). frac: 0 at rise … 1 at set. ──
    const skyArc = (frac) => {
      const f = Math.max(0, Math.min(1, frac));
      return { x: W * (0.1 + 0.8 * f) + px * 0.6,
               y: H * 0.42 - H * 0.30 * Math.sin(Math.PI * f) + py * 0.5 };
    };
    const hod = (() => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; })();
    const sunPos  = skyArc((hod - 5) / 14);                  // visible ~05:00→19:00, peak at solar noon
    const moonPos = skyArc((((hod - 17.5) + 24) % 24) / 13); // rises ~17:30, peak at midnight, sets ~06:30

    // space nebula glow
    const spaceA = band(p, 0.05, 0.16);
    if (spaceA > 0) {
      const rg = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, H * 0.8);
      rg.addColorStop(0, `rgba(80,40,120,${0.18 * spaceA})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }

    // stars
    const starA = Math.max(0, 1 - p / 0.34);
    if (starA > 0) for (const s of stars) {
      s.a += s.ts * s.td; if (s.a > 0.9 || s.a < 0.1) s.td *= -1;
      ctx.beginPath();
      ctx.arc(s.x * W + px * s.par, s.y * H + py * s.par, s.r, 0, 6.2832);
      ctx.fillStyle = `rgba(210,225,255,${s.a * starA})`; ctx.fill();
    }

    // shooting stars (space only)
    if (!reduce && p < 0.2 && t - lastShooter > rnd(2600, 5200)) {
      const ang = rnd(0.26, 0.8);
      shooters.push({ x: rnd(0, W), y: -10, vx: Math.cos(ang) * rnd(7, 12), vy: Math.sin(ang) * rnd(7, 12), life: 1 });
      lastShooter = t;
    }
    shooters = shooters.filter(s => s.life > 0.02);
    for (const s of shooters) {
      s.x += s.vx; s.y += s.vy; s.life -= 0.02;
      const tx = s.x - s.vx * 7, ty = s.y - s.vy * 7;
      const lgr = ctx.createLinearGradient(tx, ty, s.x, s.y);
      lgr.addColorStop(0, 'rgba(0,200,240,0)'); lgr.addColorStop(1, `rgba(120,230,255,${s.life})`);
      ctx.strokeStyle = lgr; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y); ctx.stroke();
    }

    // clouds (sky)
    const cloudA = band(p, 0.36, 0.12);
    if (cloudA > 0) for (const c of clouds) {
      c.x += c.v * 0.004; if (c.x > 1.2) c.x = -0.2; if (c.x < -0.2) c.x = 1.2;
      const cy = c.y * H + py * 0.5 + riseAt(p, 0.36, 0.12, 0.8); // clouds sweep up as you fall through them
      const rg = ctx.createRadialGradient(c.x * W, cy, 0, c.x * W, cy, c.w);
      rg.addColorStop(0, `rgba(245,238,250,${c.a * cloudA})`); rg.addColorStop(1, 'rgba(245,238,250,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(c.x * W, cy, c.w, c.h, 0, 0, 6.2832); ctx.fill();
    }

    // ── BIOSPHERE TABLEAU: a beach by the camp, held as one scene ──
    // The whole coastal scene shares one envelope (bioVis): a sun (or moon) over
    // the bay with its reflection on the water, drifting birds, distant mountains
    // veiled in mist, a layered headland forest framed by foreground conifers, warm
    // sand with grass and the camp, and the ocean lapping the shore — all arrive
    // TOGETHER the instant we enter the BIOSPHERE and HOLD, framed in place (only a
    // little mouse parallax for life), until we leave. The sea sits
    // at the foreground bottom so that, as we scroll on down the beach, the tide
    // climbs (flood) and overtakes the scene — and the underwater systems
    // (sun-shafts, bubbles, fish, the deep) take over from there.
    const landA = bioVis(p);
    // flood = the ocean overtaking the beach on the way out: 0 (tide at rest,
    // lapping the sand) → 1 (water risen clear over the top of the screen). It
    // sweeps UP the viewport and is drawn ON TOP of the scene, so the camp, trees
    // and mountains are literally COVERED by the water as it climbs — while they
    // also fade with landA, so they're submerged and dissolve at once. Past the
    // flood the underwater world (fish, bubbles, the deep) takes over.
    const flood = Math.max(0, Math.min(1, (p - 0.59) / 0.07));
    const seaA = flood > 0 ? 1 : landA;            // opaque the moment it floods so the rising water fully COVERS the camp (no faded bleed-through); only fades in with the beach on entry
    const campGy = H * 0.78 + py * 0.7;            // the camp's floor on the dry sand (smoke origin rides it too)
    const shoreY = (1 - flood) * (H * 0.84 + py * 0.85) - flood * H * 0.12;
    const wob = (x) => Math.sin(x * 0.02 + t * 0.0016) * 5 + Math.sin(x * 0.05 + t * 0.0023) * 3;
    const fireDims = campDims();
    const firePos = campCenters(fireDims);
    const fireY = campFireY(campGy, fireDims);
    const waterAtFire = shoreY + wob(firePos.fireX);
    const fireAlive = Math.max(0, Math.min(1, (waterAtFire - (fireY + fireDims.rr * 0.45)) / Math.max(10, fireDims.rr * 0.75)));
    const dayA = (1 - nightAmount()) * landA;      // daylight strength of the scene
    // (the sun & moon arc positions — sunPos / moonPos — are computed up top, before the
    //  space pass, so the moon can cross-fade between scenes without moving)
    if (landA > 0.02 || (flood > 0.001 && p < 0.67)) {
      // ---- the beach (fades with landA, covered from below by the rising sea) ----
      if (landA > 0.02) {
        // ── the daytime sun low over the bay (the moon takes its place at night) ──
        if (dayA > 0.01) {
          const sr = Math.max(22, Math.min(W, H) * 0.05), sX = sunPos.x, sY = sunPos.y;
          const halo = ctx.createRadialGradient(sX, sY, sr * 0.4, sX, sY, sr * 4.4);
          halo.addColorStop(0, `rgba(255,228,172,${0.5 * dayA})`);
          halo.addColorStop(0.5, `rgba(255,198,120,${0.15 * dayA})`);
          halo.addColorStop(1, 'rgba(255,198,120,0)');
          ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sX, sY, sr * 4.4, 0, 6.2832); ctx.fill();
          const sBody = ctx.createRadialGradient(sX, sY, 0, sX, sY, sr);
          sBody.addColorStop(0, `rgba(255,248,228,${0.96 * dayA})`); sBody.addColorStop(1, `rgba(255,212,150,${0.9 * dayA})`);
          ctx.fillStyle = sBody; ctx.beginPath(); ctx.arc(sX, sY, sr, 0, 6.2832); ctx.fill();
        }
        // a loose flock of birds drifting across the daytime sky
        drawBirds(dayA * 0.8, t, px, py);
        // distant mountains across the bay — hazier/higher behind, darker/lower in front
        drawRidge(H * 0.50 + py * 0.3, 70, 3.1, `rgba(54,66,92,${0.5 * landA})`, 22);   // far range
        drawRidge(H * 0.58 + py * 0.5, 96, 6.7, `rgba(30,40,62,${0.62 * landA})`, 18);  // near range
        // a soft band of mist along the foot of the hills for depth
        drawMist(H * 0.605 + py * 0.5, 0.10 * landA, t);
        ctx.globalAlpha = landA;
        // the grassy clearing the camp sits in: green up by the treeline, thinning to a
        // sandy strip at the water's edge so the tide still reads as a shoreline
        const ground = ctx.createLinearGradient(0, H * 0.64, 0, H);
        ground.addColorStop(0, '#5c8a3c');
        ground.addColorStop(0.5, '#6fa049');
        ground.addColorStop(0.8, '#a8b06a');
        ground.addColorStop(1, '#bda06a');
        ctx.fillStyle = ground; ctx.fillRect(0, H * 0.64, W, H * 0.36);
        // layered headland forest — a hazy back line and a nearer, taller stand for
        // depth; greener now, and both lean on the wind (stronger in front)
        drawTrees(H * 0.66 + py * 0.6, 'rgba(34,68,42,0.84)', 34, 56, t, 3);
        drawTrees(H * 0.705 + py * 0.75, 'rgba(22,50,30,0.95)', 46, 96, t, 5);
        // the camp tucked in the clearing — drawn BEFORE the framing conifers and grass
        // so the foreground trees/blades overlap it for depth (the fire is a later pass)
        drawCamp(t, Math.min(1, landA * 1.3), campGy);
        // big conifers framing the scene from the foreground edges (swaying in the wind),
        // IN FRONT of the camp so the nearest trees overlap it instead of it looming over them
        drawConifer(W * 0.05, H * 0.96, H * 0.46, 'rgba(16,42,26,0.96)', t, 0);
        drawConifer(W * 0.96, H * 0.99, H * 0.52, 'rgba(16,42,26,0.96)', t, 1.7);
        // a lush, wind-blown meadow across the clearing (globalAlpha fades it with the scene)
        drawGrass(1, t);
        ctx.globalAlpha = 1;
        // ── NIGHT BEACH (device-local time): wash the sky & sand dark, hang a moon
        //    over the bay and bring the stars out — all drawn BEFORE the firepit pass
        //    so the campfire still glows warmly against the dark ──
        const nWash = nightAmount() * seaA;          // dark sky/land/sea that holds through the flood
        const nStar = nightAmount() * landA;         // moon & stars fade as we sink under
        if (nWash > 0.01) { ctx.fillStyle = `rgba(6,12,30,${0.6 * nWash})`; ctx.fillRect(0, 0, W, H); }
        if (nStar > 0.01) {
          // the night-beach moon — a full disc on the gentle device-clock arc (skyArc),
          // independent of the exosphere's real-physics moon. It fades in over p 0.42→0.47,
          // then rides nStar back down as we sink under, setting with the beach. Its glade
          // trails beneath it.
          const moonR = Math.max(22, Math.min(W, H) * 0.05);
          const moonBeachA = nightAmount() * (p < 0.47 ? Math.max(0, Math.min(1, (p - 0.42) / 0.05)) : landA);
          drawMoon(moonPos.x, moonPos.y, moonR, moonBeachA);
          // stars across the upper sky (reusing the star field, sky half only)
          for (const s of stars) {
            if (s.y > 0.5) continue;
            ctx.beginPath(); ctx.arc(s.x * W + px * s.par, s.y * H * 0.86 + py * s.par, s.r, 0, 6.2832);
            ctx.fillStyle = `rgba(210,225,255,${s.a * nStar})`; ctx.fill();
          }
        }
        // the warm campfire laid over the night wash so it glows against the dark — and
        // on top of the conifers/grass so nothing paints across the flames or stones
        drawFirepit(t, Math.min(1, landA * 1.3), campGy, fireAlive);
      }
      // ---- the ocean, drawn ON TOP so it overtakes everything as it rises ----
      // shoreY climbs from the sand (rest) up past the top of the screen at full flood
      ctx.globalAlpha = seaA;
      const nS = nightAmount();
      const sea = ctx.createLinearGradient(0, shoreY, 0, H);
      // teal surf by day → deep moonlit navy by night (device-local time); near-opaque so it covers the camp cleanly
      sea.addColorStop(0, `rgba(${Math.round(46 - 30 * nS)},${Math.round(132 - 104 * nS)},${Math.round(156 - 122 * nS)},0.99)`);
      sea.addColorStop(1, `rgba(${Math.round(13 - 4 * nS)},${Math.round(46 - 28 * nS)},${Math.round(68 - 46 * nS)},1)`);
      ctx.fillStyle = sea;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) ctx.lineTo(x, shoreY + wob(x));
      ctx.lineTo(W, shoreY + wob(W));   // W is rarely a multiple of 12: pin the wavy top to the right edge so the fill reaches it (no sliver gap on mobile)
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      // ── each sky-light casts its OWN glittering reflection straight down the near
      //    water toward the viewer: a warm gold sun-glade beneath the sun and a cool
      //    silver moon-glade beneath the moon. At twilight both show — each under its
      //    own body on its own side — instead of one stray column under the wrong
      //    light. Each fades with its own body (and as we sink under). ──
      const drawGlade = (gx, lit, cr, cg, cb) => {
        if (lit <= 0.02) return;
        for (let i = 0; i < 9; i++) {
          const fy = shoreY + (i / 9) * (H - shoreY), spread = 6 + i * 4;   // widens toward the viewer
          const jx = Math.sin(t * 0.004 + i * 1.7) * spread;
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${lit * 0.18 * (1 - i / 11)})`;
          ctx.beginPath(); ctx.ellipse(gx + jx, fy, spread + 10, 2.2, 0, 0, 6.2832); ctx.fill();
        }
      };
      drawGlade(sunPos.x,  dayA,       255, 224, 150);   // gold sun-glade, beneath the sun
      drawGlade(moonPos.x, nS * landA, 210, 225, 255);   // silver moon-glade, beneath the moon
      // foam at the leading edge — laps the sand at rest, a wave front sweeping up in flood
      ctx.strokeStyle = `rgba(255,255,255,${0.5 - 0.2 * nS})`; ctx.lineWidth = 2; ctx.lineCap = 'round';  // dimmer, moonlit foam at night
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) { if (x === 0) ctx.moveTo(x, shoreY + wob(x)); else ctx.lineTo(x, shoreY + wob(x)); }
      ctx.lineTo(W, shoreY + wob(W));   // carry the foam to the right edge too
      ctx.stroke();
      // a couple of gentle swell lines further down the water
      ctx.strokeStyle = 'rgba(220,245,255,0.16)'; ctx.lineWidth = 1.5;
      for (let i = 1; i <= 2; i++) {
        const yy = shoreY + (H - shoreY) * (i / 3);
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) { if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy + Math.sin(x * 0.03 + t * 0.0018 + i) * 3); }
        ctx.lineTo(W, yy + Math.sin(W * 0.03 + t * 0.0018 + i) * 3);   // reach the right edge
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // fireflies (beach/camp) — part of the held tableau, and nocturnal: only
    // emerge after dusk in the device's local time, fading in/out across dawn &
    // dusk like the moon and campfire
    const ffA = landA * nightAmount() * (1 - flood);
    if (!reduce && ffA > 0) for (const f of fireflies) {
      f.x += f.dx; f.ph += 0.03 * f.sp; if (f.x > 1) f.x = 0; if (f.x < 0) f.x = 1;
      const a = (Math.sin(f.ph) * 0.5 + 0.5) * ffA;
      ctx.beginPath(); ctx.arc(f.x * W, f.y * H + py * 0.9, 1.7, 0, 6.2832); // drift gently with the scene
      ctx.fillStyle = `rgba(255,225,140,${a})`; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,210,120,.8)';
      ctx.fill(); ctx.shadowBlur = 0;
    }

    // campfire smoke (beach/camp) — rises from the fireplace, drifts and fades
    if (landA > 0.02 && fireAlive > 0.01) {
      if (!reduce && flood < 0.3 && fireAlive > 0.25 && t - lastSmoke > 200) {
        smoke.push({ life: 0, ox: rnd(-7, 7), sw: Math.random() * 6.2832, vr: rnd(0.0022, 0.0036) });
        lastSmoke = t;
        if (smoke.length > 40) smoke.shift();
      }
      const smokeDims = campDims();
      const ex = campCenters(smokeDims).fireX, ey = campFireY(campGy, smokeDims) - H * 0.03;
      for (const sm of smoke) {
        if (!reduce) sm.life += sm.vr * dt;   // dt-scaled so it stays a slow, lazy drift (fps-independent)
        const yy = ey - sm.life * H * 0.34;
        const xx = ex + sm.ox + Math.sin(sm.sw + sm.life * 3.4) * (12 + sm.life * 34);
        const rr = 7 + sm.life * 44;
        const a = Math.sin(Math.min(1, sm.life) * Math.PI) * 0.15 * landA * fireAlive * (1 - flood);
        const sg = ctx.createRadialGradient(xx, yy, 0, xx, yy, rr);
        sg.addColorStop(0, `rgba(214,214,220,${a})`); sg.addColorStop(1, 'rgba(214,214,220,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(xx, yy, rr, 0, 6.2832); ctx.fill();
      }
      smoke = smoke.filter(sm => sm.life < 1);
    } else if (smoke.length) { smoke.length = 0; }

    // waterline shimmer + sun shafts (surface) — the sun's shafts fade out at night
    const surfA = band(p, 0.66, 0.07) * (1 - nightAmount() * 0.85);
    if (surfA > 0) {
      ctx.fillStyle = `rgba(180,235,255,${0.10 * surfA})`;
      for (let i = 0; i < 6; i++) {
        const x = (i / 6) * W + Math.sin(t * 0.0005 + i) * 30;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 130, H); ctx.lineTo(x + 30, H); ctx.closePath(); ctx.fill();
      }
    }

    // kelp (shallows)
    const kelpA = band(p, 0.76, 0.08);
    if (kelpA > 0.02) {
      const lift = (p - 0.76) * H * 2.6;
      ctx.strokeStyle = `rgba(18,70,60,${0.8 * kelpA})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const bx = (i + 0.5) / 7 * W;
        ctx.beginPath(); ctx.moveTo(bx, H + lift);
        for (let yy = 0; yy <= 1; yy += 0.1) ctx.lineTo(bx + Math.sin(t * 0.001 + i + yy * 6) * 26, H + lift - yy * H * 0.6);
        ctx.stroke();
      }
    }

    // bubbles (water)
    const waterA = Math.max(0, Math.min(1, (p - 0.63) / 0.06));
    if (waterA > 0) for (const b of bubbles) {
      b.y -= b.v; b.wob += b.ws; if (b.y < 0) { b.y = 1; b.x = Math.random(); }
      ctx.beginPath(); ctx.arc((b.x + Math.sin(b.wob) * 0.01) * W, b.y * H, b.r, 0, 6.2832);
      ctx.strokeStyle = `rgba(180,235,255,${0.25 * waterA})`; ctx.lineWidth = 1; ctx.stroke();
    }

    // fish school (water → trench) — a lively, continuously-swimming shoal:
    // each fish glides across, bobs, and flicks its tail; faces its direction
    const fishA = Math.max(0, Math.min(1, (p - 0.66) / 0.06)); // hold the school back until we're submerged
    clickPulse *= Math.pow(0.85, dt);             // click scatter fades over ~⅓ second (fps-independent)
    // a cursor that holds still for ~4s makes the nosy fish curious; eases back the moment it moves
    idleT += dt;
    const curTarget = (pointerHere && clickPulse < 0.05 && idleT > 240) ? 1 : 0;
    curious += (curTarget - curious) * Math.min(1, 0.02 * dt);
    if (fishA > 0) for (const f of fishes) {
      // ── SPHERE-AWARE: a fish keeps to its species' depth band and won't cross out of it.
      //    When the descent carries it past the boundary it fades into the gloom, and once
      //    invisible it's reborn as a species that belongs at this depth and fades back in —
      //    so the shoal turns over with depth instead of the same fish trailing the view down ──
      const inZone = inSpeciesZone(f, p);
      f.zoneFade += ((inZone ? 1 : 0) - f.zoneFade) * Math.min(1, 0.06 * dt);
      if (!inZone && f.zoneFade < 0.05) { setSpecies(f, p); f.curEngaged = false; } // reborn for this depth, fades in
      if (!reduce) {
        // ── a fish only ever swims FORWARD along its heading: it STEERS toward where it wants to go and
        //    EASES its speed, so flee/curiosity read as real turning + acceleration, not sideways sliding ──
        const cosA = Math.cos(f.ang);
        let desired = cosA >= 0 ? 0 : Math.PI;        // cruise: settle onto the nearest horizontal heading
        let tSpeed = f.sp;                            // cruise speed
        let turn = 0.05;                              // base turn rate (rad per 60fps-frame)
        let hold = 0;

        // SCARE — a nearby click is felt (the lateral line), seen or not: fear spikes with proximity.
        // The reach is tight and the falloff is SQUARED, so the fright stays LOCAL — fish well away from
        // the click barely register it instead of the whole shoal bolting at once.
        if (clickPulse > 0.02) {
          const dxp = (f.x - mx) * W, dyp = (f.y - my) * H, dd = Math.hypot(dxp, dyp) || 1;
          const reach = 80 + clickPulse * 60;            // ≤140px — only the genuinely-near fish feel it
          if (dd < reach) { const t = 1 - dd / reach; f.fear = Math.max(f.fear, clickPulse * t * t); }
        }
        f.fear *= Math.pow(0.94, dt);                    // the fright DECAYS every frame → it calms in ~1s

        // can this fish actually SEE the cursor? fish have a ~300° field of view (≈150° to each side) with a
        // blind cone behind — so one that's already swum past it (cursor behind the tail) won't notice it
        const toCur = Math.atan2((my - f.y) * H, (mx - f.x) * W);
        let view = toCur - f.ang; while (view > Math.PI) view -= 6.2832; while (view < -Math.PI) view += 6.2832;
        const curDist = Math.hypot((mx - f.x) * W, (my - f.y) * H);
        const canSee = Math.abs(view) < 2.618 && curDist < W * 0.55; // 2.618 rad = 150° half-FOV
        if (curious < 0.05) f.curEngaged = false;     // cursor moved → let go of the investigation

        if (f.fear > 0.03) {                          // STARTLED → it darts away, then RECOVERS as the fright fades
          if (!f.flee) {                              // lock the bearing on the first fright — away from the cursor, but
            const hx = (f.x >= mx) ? 1 : -1;          // biased to the nearer side so it heads for open water
            const vy = Math.max(-0.7, Math.min(0.7, (f.y - my) * 1.2)); // a shallow vertical tilt
            f.fleeAng = Math.atan2(vy, hx);
          }
          f.flee = 1;
          desired = f.fleeAng;                        // hold that bearing while it bolts
          // the sprint SCALES with how scared it is, so as the fear decays the target speed eases all the
          // way back down to this fish's own cruise pace — it doesn't leave for good, it just calms down
          tSpeed = f.sp + (0.0038 - f.sp) * Math.min(1, f.fear);
          turn = 0.14;                                // snap onto the escape line
        } else {
          if (f.flee) { f.flee = 0; f.curEngaged = false; } // the fright passed — it COASTS on the escape line
          // it just ran, so it keeps heading the way it bolted: the cruise above only eases the dart's vertical
          // tilt back to level, it never about-faces, and it won't wheel around to investigate the thing it
          // fled from — it only gets nosy again if the cursor later drifts back into its forward view
          if (curious > 0.01 && f.nosy > 0.68 && (f.curEngaged || canSee)) {
            f.curEngaged = true;                      // only fish that SAW it engage; then they see it through
            desired = toCur;                          // always face what it's watching — never flips around
            f.pokePh += 0.05 * dt;
            const poke = Math.pow(Math.max(0, Math.sin(f.pokePh)), 6); // a brief pulse ~every 2s
            // a soft spring keeps it at its standoff (swim in if far, ease back a touch if it overshoots) so it
            // settles instead of jittering between approach/retreat states; the poke is a nibble on top of that
            const station = Math.max(-0.0006, Math.min(0.0011, (curDist - f.holdR) / 80 * 0.004));
            tSpeed = station + poke * 0.0018;         // + a forward nibble straight at the cursor
            tSpeed = f.sp * (1 - curious) + tSpeed * curious; // ease the whole thing in with the curiosity level
            turn = 0.06 + curious * 0.06;
            hold = (1 - poke) * curious;              // "still & watching" between pokes
          }
        }
        f.hold = hold;

        // STEER smoothly toward the desired heading (shortest way round)
        let dA = desired - f.ang; while (dA > Math.PI) dA -= 6.2832; while (dA < -Math.PI) dA += 6.2832;
        f.ang += dA * Math.min(1, turn * dt);
        // EASE speed, then advance ALONG the heading only — and slow through hard turns (no sprinting a pivot)
        f.speed += (tSpeed - f.speed) * Math.min(1, 0.14 * dt);
        const go = f.speed * (0.45 + 0.55 * Math.max(0, Math.cos(dA))) * dt;
        f.x += Math.cos(f.ang) * go;
        f.y = Math.max(0.06, Math.min(0.92, f.y + Math.sin(f.ang) * go * (W / H)));
        // body life: bob (calmed while parked) + tail (flicks faster the quicker it swims)
        f.bob += f.bobS * dt;
        f.tail += (f.tailS + f.speed * 120) * dt * (1 - 0.55 * hold);
        // edge-to-edge wrap: a fish that swims off one side re-enters the other, re-rolling its species
        // for the new depth — a startled fish that darts to the edge just wraps like any other.
        if (f.x > 1.06) { f.x = -0.06; f.y = rnd(0.12, 0.86); f.curEngaged = false; setSpecies(f, p); }
        else if (f.x < -0.06) { f.x = 1.06; f.y = rnd(0.12, 0.86); f.curEngaged = false; setSpecies(f, p); }
      }
      drawFish(f, fishA * 0.7 * f.zoneFade);
    }

    // bioluminescence (deep)
    const bioA = Math.max(0, Math.min(1, (p - 0.8) / 0.08));
    if (bioA > 0) for (const b of bios) {
      b.ph += 0.04 * b.sp;
      const a = (Math.sin(b.ph) * 0.5 + 0.5) * bioA;
      ctx.beginPath(); ctx.arc(b.x * W, b.y * H, b.r, 0, 6.2832);
      ctx.fillStyle = b.hue === 'c' ? `rgba(0,220,255,${a})` : `rgba(255,150,200,${a})`;
      ctx.shadowBlur = 6; ctx.shadowColor = b.hue === 'c' ? 'rgba(0,220,255,.8)' : 'rgba(255,150,200,.8)';
      ctx.fill(); ctx.shadowBlur = 0;
    }

    // marine snow + trench walls (trench)
    const trA = Math.max(0, Math.min(1, (p - 0.85) / 0.1));
    if (trA > 0) {
      for (const s of snow) { s.y += s.v; s.x += s.dx; if (s.y > 1) { s.y = 0; s.x = Math.random(); } ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.2832); ctx.fillStyle = `rgba(200,215,230,${0.25 * trA})`; ctx.fill(); }
      const wall = trA * W * 0.16;
      ctx.fillStyle = `rgba(2,6,10,${0.9 * trA})`;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(wall, 0); ctx.lineTo(wall * 0.5, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - wall, 0); ctx.lineTo(W - wall * 0.5, H); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }

    // the hydrothermal seabed at the very bottom — drawn after the fish so the
    // floor occludes them, and on this same fixed canvas so the vent glow never
    // clips against a separate footer layer
    sfRender(p, t);

    // egg burst — sparks scattering from a caught egg, drawn over the scene
    if (burst.length) {
      for (const b of burst) {
        b.life -= 0.02 * dt;
        const lf = Math.max(0, b.life);
        if (b.ring) {
          ctx.strokeStyle = b.warm ? `rgba(255,224,170,${lf * 0.6})` : `rgba(200,240,255,${lf * 0.6})`;
          ctx.lineWidth = 2; ctx.beginPath();
          ctx.arc(b.x, b.y, (1 - b.life) * 70 + 6, 0, 6.2832); ctx.stroke();
          continue;
        }
        b.vx *= Math.pow(0.96, dt); b.vy *= Math.pow(0.96, dt);
        b.x += b.vx * dt; b.y += b.vy * dt + 0.25 * dt;   // a touch of gravity
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * lf + 0.3, 0, 6.2832);
        const col = b.warm ? (b.alt ? '255,209,122' : '255,245,224') : (b.alt ? '191,233,255' : '255,255,255');
        ctx.fillStyle = `rgba(${col},${lf})`;
        ctx.shadowColor = b.warm ? 'rgba(255,200,110,0.9)' : 'rgba(191,233,255,0.9)'; ctx.shadowBlur = 8; ctx.fill();
      }
      ctx.shadowBlur = 0;
      burst = burst.filter(b => b.life > 0.02);
    }

    updateSprites(p, t);
    updateGauge(p);
    requestAnimationFrame(frame);
  }

  /* ---------- boot ---------- */
  resize(); seed(); buildSprites(); buildGauge();
  window.addEventListener('resize', () => { resize(); syncFish(); });
  requestAnimationFrame(frame);

  // expose progress for page scripts
  window.DESCENT = { prog, depthAt, zoneAt };
})();
