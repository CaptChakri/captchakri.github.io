/* =====================================================================
   DESCENT SPRITES — SVG art for the objects you pass on the way down,
   replacing system emoji so they render identically on every OS.
   Keyed by glyph (variation selectors are stripped on lookup in the
   engine). Animals/fish are drawn FACING LEFT (the engine flips scaleX
   to face travel direction); the plane is drawn level, facing right.
   Each SVG fills its .d-sprite box (sized by the engine); the per-sprite
   glow filter is applied to the container, so it tints these too.
   ===================================================================== */
window.DESCENT_SPRITES = {

  /* ---- space ---- */
  '🪐': '<svg viewBox="0 0 130 100"><circle cx="60" cy="50" r="30" fill="#cdd8ee"/><circle cx="50" cy="41" r="8" fill="#eaf0ff" opacity=".5"/><circle cx="74" cy="60" r="5" fill="#9fb0d6" opacity=".5"/><ellipse cx="60" cy="50" rx="58" ry="16" fill="none" stroke="#aebfe2" stroke-width="5" transform="rotate(-16 60 50)"/></svg>',

  '🛰': '<svg viewBox="0 0 130 80"><line x1="60" y1="30" x2="60" y2="12" stroke="#aebfe2" stroke-width="3"/><circle cx="60" cy="9" r="4" fill="#cdd8ee"/><rect x="8" y="30" width="34" height="18" rx="2" fill="#6f9fe0"/><rect x="88" y="30" width="34" height="18" rx="2" fill="#6f9fe0"/><line x1="25" y1="30" x2="25" y2="48" stroke="#21345e" stroke-width="2"/><line x1="105" y1="30" x2="105" y2="48" stroke="#21345e" stroke-width="2"/><line x1="42" y1="39" x2="50" y2="39" stroke="#aebfe2" stroke-width="3"/><line x1="80" y1="39" x2="88" y2="39" stroke="#aebfe2" stroke-width="3"/><rect x="50" y="28" width="30" height="22" rx="4" fill="#dfe9ff"/></svg>',

  '☄': '<svg viewBox="0 0 130 130"><path d="M40 86 L120 12" stroke="#bfe9ff" stroke-width="7" stroke-linecap="round" opacity=".45"/><path d="M46 92 L104 30" stroke="#dff4ff" stroke-width="4" stroke-linecap="round" opacity=".35"/><circle cx="34" cy="92" r="17" fill="#bfe9ff"/><circle cx="32" cy="90" r="10" fill="#ffffff"/></svg>',

  /* ---- sky ---- */
  '✈': '<svg viewBox="0 0 130 70"><path d="M6 40 Q40 31 96 33 Q116 34 122 40 Q116 46 96 47 Q40 49 6 40 Z" fill="#e7eeff"/><path d="M20 40 L8 12 L24 15 L34 38 Z" fill="#e7eeff"/><path d="M56 42 L82 64 L96 64 L76 42 Z" fill="#c2cfe8"/><circle cx="104" cy="40" r="3" fill="#0c1428"/><circle cx="92" cy="40" r="2.4" fill="#0c1428"/></svg>',

  '🦅': '<svg viewBox="0 0 130 54"><path d="M8 42 Q36 6 65 32 Q94 6 122 42 Q94 24 65 42 Q36 24 8 42 Z" fill="#e2ebff"/></svg>',

  '🎈': '<svg viewBox="0 0 60 104"><path d="M30 4 Q53 4 53 35 Q53 60 30 70 Q7 60 7 35 Q7 4 30 4 Z" fill="#ff8fb8"/><path d="M26 69 L34 69 L30 78 Z" fill="#ff8fb8"/><path d="M30 78 q7 9 -2 22" stroke="#aebfe2" stroke-width="2" fill="none"/><ellipse cx="22" cy="26" rx="6" ry="10" fill="#ffd0e0" opacity=".6"/></svg>',

  /* ---- forest ---- */
  '⛺': '<svg viewBox="0 0 130 92"><path d="M65 8 L122 82 L8 82 Z" fill="#c9a47e"/><path d="M65 8 L83 82 L47 82 Z" fill="#a87c54"/><path d="M65 30 L78 82 L52 82 Z" fill="#241a10"/><line x1="65" y1="8" x2="65" y2="2" stroke="#c9a47e" stroke-width="3"/></svg>',

  '🔥': '<svg viewBox="0 0 72 100"><path d="M36 6 Q54 30 47 50 Q62 45 57 71 Q57 95 36 96 Q15 95 15 71 Q13 51 27 53 Q18 32 36 6 Z" fill="#f0a878"/><path d="M36 36 Q47 51 43 67 Q43 85 36 88 Q29 85 29 67 Q27 55 36 36 Z" fill="#ffe0b0"/></svg>',

  /* ---- sea ---- */
  '🐟': '<svg viewBox="0 0 120 70"><path d="M104 35 L120 18 L114 35 L120 52 Z" fill="#9fe9ff"/><path d="M42 35 Q70 13 106 35 Q70 57 42 35 Z" fill="#9fe9ff"/><path d="M70 20 L78 12 L80 26 Z" fill="#7fd0ee"/><circle cx="56" cy="32" r="3.5" fill="#06121c"/></svg>',

  '🐠': '<svg viewBox="0 0 120 80"><path d="M96 40 L118 16 L110 40 L118 64 Z" fill="#ff8fb8"/><path d="M38 40 Q66 14 98 40 Q66 66 38 40 Z" fill="#7fd8ff"/><path d="M62 22 L70 9 L78 24 Z" fill="#bfe9ff"/><path d="M58 58 L66 70 L74 56 Z" fill="#bfe9ff"/><g stroke="#0c1428" stroke-width="3" opacity=".35"><path d="M60 30 L60 52"/><path d="M72 27 L72 54"/></g><circle cx="50" cy="37" r="3.5" fill="#06121c"/></svg>',

  /* the rare golden fish — keyed by name (no gold-fish emoji), used as the egg
     icon for the catchable gold specimen that turns up in the passing shoal
     (see GOLD_RARITY / catchGoldFish in the engine). Gold body, lighter gold
     tail + a soft highlight so it reads as the lucky catch, not just a fish.
     This generic icon is kept for browsers that caught gold before the catch
     started recording the species; new catches use the per-species icons below. */
  'goldfish': '<svg viewBox="21 -3 120 70"><path d="M104 35 L120 18 L114 35 L120 52 Z" fill="#ffce54"/><path d="M42 35 Q70 13 106 35 Q70 57 42 35 Z" fill="#f0b24e"/><path d="M70 20 L78 12 L80 26 Z" fill="#e0992f"/><ellipse cx="64" cy="30" rx="9" ry="4" fill="#fff" opacity=".3"/><circle cx="56" cy="32" r="3.5" fill="#06121c"/><circle cx="57" cy="31" r="1.1" fill="#fff" opacity=".8"/></svg>',

  /* the golden fish, per species — every kind in the shoal (reef → anglerfish)
     can roll gold, and each is recorded as its own find (see catchGoldFish in
     the engine, and the goldfish-* eggs in easter-eggs.js). All keep the gold
     palette but wear their species' signature: the reef fish its dorsal fin and
     bars, the deep dwellers their cyan photophores, the viper its fangs, the
     angler its glowing lure. Drawn facing LEFT like the rest of the sea sprites. */
  'goldfish-reef': '<svg viewBox="21 -1 120 70"><path d="M104 35 L120 18 L114 35 L120 52 Z" fill="#f0b24e"/><path d="M42 35 Q70 13 106 35 Q70 57 42 35 Z" fill="#ffce54"/><path d="M58 22 L70 4 L82 24 Z" fill="#f0b24e"/><path d="M60 50 L66 64 L74 49 Z" fill="#f0b24e"/><g fill="#a86a18" opacity=".5"><rect x="60" y="22" width="4.5" height="26" rx="1.5"/><rect x="76" y="24" width="4" height="22" rx="1.5"/></g><ellipse cx="66" cy="29" rx="9" ry="3.4" fill="#fff" opacity=".25"/><circle cx="56" cy="32" r="3.5" fill="#06121c"/><circle cx="57" cy="31" r="1.1" fill="#fff" opacity=".8"/></svg>',

  'goldfish-silver': '<svg viewBox="20 1.5 120 70"><path d="M102 35 L120 19 L114 35 L120 51 Z" fill="#f0b24e"/><path d="M40 35 Q70 17 104 35 Q70 53 40 35 Z" fill="#ffce54"/><path d="M68 22 L76 13 L80 25 Z" fill="#f0b24e"/><path d="M64 49 L70 60 L78 48 Z" fill="#f0b24e"/><path d="M46 35 Q72 31 100 35" stroke="#e0992f" stroke-width="2" fill="none" opacity=".5"/><ellipse cx="64" cy="30" rx="10" ry="3.5" fill="#fff" opacity=".28"/><circle cx="54" cy="33" r="3.4" fill="#06121c"/><circle cx="55" cy="32" r="1" fill="#fff" opacity=".8"/></svg>',

  'goldfish-lantern': '<svg viewBox="21 -2.8 120 70"><path d="M100 35 L118 20 L112 35 L118 50 Z" fill="#f0b24e"/><path d="M44 35 Q70 16 102 35 Q70 54 44 35 Z" fill="#ffce54"/><path d="M66 23 L74 14 L80 25 Z" fill="#f0b24e"/><g><circle cx="58" cy="44" r="4.5" fill="#9fe9ff" opacity=".32"/><circle cx="70" cy="46" r="4.5" fill="#9fe9ff" opacity=".32"/><circle cx="82" cy="45" r="4.5" fill="#9fe9ff" opacity=".32"/><circle cx="58" cy="44" r="1.8" fill="#dff7ff"/><circle cx="70" cy="46" r="1.8" fill="#dff7ff"/><circle cx="82" cy="45" r="1.8" fill="#dff7ff"/></g><ellipse cx="66" cy="30" rx="9" ry="3.2" fill="#fff" opacity=".22"/><circle cx="56" cy="32" r="3.8" fill="#06121c"/><circle cx="57.2" cy="30.8" r="1.2" fill="#bdf2ff" opacity=".9"/></svg>',

  'goldfish-viper': '<svg viewBox="13 -2 120 70"><path d="M104 35 L120 22 L114 35 L120 48 Z" fill="#f0b24e"/><path d="M26 35 Q70 24 106 35 Q70 46 26 35 Z" fill="#ffce54"/><path d="M62 27 L70 18 L76 28 Z" fill="#f0b24e"/><g stroke="#fff7e0" stroke-width="1.4" opacity=".85" stroke-linecap="round"><path d="M30 33 L27 37"/><path d="M36 32 L34 38"/><path d="M42 32 L41 38"/></g><g><circle cx="52" cy="40" r="3.4" fill="#9fe9ff" opacity=".3"/><circle cx="64" cy="41" r="3.4" fill="#9fe9ff" opacity=".3"/><circle cx="76" cy="40" r="3.4" fill="#9fe9ff" opacity=".3"/><circle cx="88" cy="39" r="3.4" fill="#9fe9ff" opacity=".3"/><circle cx="52" cy="40" r="1.3" fill="#dff7ff"/><circle cx="64" cy="41" r="1.3" fill="#dff7ff"/><circle cx="76" cy="40" r="1.3" fill="#dff7ff"/><circle cx="88" cy="39" r="1.3" fill="#dff7ff"/></g><circle cx="44" cy="33" r="3.2" fill="#06121c"/><circle cx="45" cy="32" r="1" fill="#bdf2ff" opacity=".9"/></svg>',

  'goldfish-angler': '<svg viewBox="6 -2.5 120 82"><path d="M96 46 L114 30 L108 46 L114 62 Z" fill="#f0b24e"/><path d="M40 46 Q68 18 96 46 Q68 70 40 46 Z" fill="#ffce54"/><path d="M50 24 Q34 6 26 20" fill="none" stroke="#cf9a3e" stroke-width="2.4" stroke-linecap="round"/><circle cx="25" cy="21" r="7" fill="#bfe9ff" opacity=".35"/><circle cx="25" cy="21" r="3" fill="#e8fff6"/><g stroke="#fff7e0" stroke-width="1.6" opacity=".9" stroke-linecap="round"><path d="M44 52 L42 60"/><path d="M50 54 L49 62"/><path d="M56 54 L56 62"/></g><ellipse cx="66" cy="38" rx="10" ry="3.6" fill="#fff" opacity=".22"/><circle cx="52" cy="43" r="4" fill="#06121c"/><circle cx="53.4" cy="41.6" r="1.3" fill="#bdf2ff" opacity=".9"/></svg>',

  /* the golden tortoise (side view, heading right) — collection art for the rare
     golden-tortoise easter egg (see tortGold / catchTortoise in the engine; the live
     creature is canvas-painted into the beach tableau, this is just its icon). Domed
     gold carapace with scute lines and a darker plastron rim, head on a short neck,
     four stubby legs and a stub tail. */
  'golden-tortoise': '<svg viewBox="0 0 124 80"><g fill="#e0992f"><ellipse cx="36" cy="60" rx="8" ry="11"/><ellipse cx="84" cy="60" rx="8" ry="11"/></g><path d="M18 52 L7 56 L20 58 Z" fill="#e0992f"/><path d="M96 42 L112 37 L110 49 L100 50 Z" fill="#e0992f"/><ellipse cx="111" cy="42" rx="10" ry="8" fill="#ffce54"/><circle cx="115" cy="40" r="2.3" fill="#06121c"/><path d="M16 52 Q20 18 60 18 Q100 18 104 52 Q60 64 16 52 Z" fill="#f0b24e"/><path d="M16 52 Q60 64 104 52 Q60 58 16 52 Z" fill="#cf9a3e"/><g stroke="#a86a18" stroke-width="2" fill="none" stroke-linecap="round"><path d="M28 46 Q60 24 92 46"/><path d="M44 22 Q42 38 44 50"/><path d="M60 19 L60 51"/><path d="M76 22 Q78 38 76 50"/></g></svg>',

  /* the golden vent shrimp (side view, head LEFT) — collection art for the rare
     golden-shrimp easter egg (see s.gold / catchShrimp in the engine; the live
     one scuttles the trench floor, this is just its icon). Gold crescent body —
     fat cephalothorax up front, abdomen curling up to a fan tail — with stepping
     legs, long sweeping antennae, segment creases and a dark eye. */
  'golden-shrimp': '<svg viewBox="0 0 130 90"><g stroke="#f0b24e" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"><path d="M20 48 Q8 56 2 52"/><path d="M21 50 Q10 63 4 71"/></g><g stroke="#e0992f" stroke-width="3" stroke-linecap="round"><path d="M40 58 L36 74"/><path d="M50 60 L48 77"/><path d="M60 60 L61 76"/><path d="M70 57 L73 72"/></g><g stroke="#e0992f" stroke-width="3" stroke-linecap="round"><path d="M104 47 L122 40"/><path d="M105 49 L124 50"/><path d="M104 51 L120 62"/></g><path d="M21.5 41 C30 22 50 18 65 19 C82 22 96 30 102 41 L106 51 C96 44 80 40 67 41 C52 46 40 56 34.5 63 C28 60 22 52 21.5 41 Z" fill="#f0b24e"/><path d="M22 46 L6 50 L22 51 Z" fill="#f0b24e"/><path d="M27 44 C34 28 52 24 66 25 C80 26 92 33 99 42" fill="none" stroke="#ffd98a" stroke-width="2.4" opacity=".5" stroke-linecap="round"/><g stroke="#cf8f2c" stroke-width="1.8" stroke-linecap="round" opacity=".6"><path d="M72 29 L70 44"/><path d="M82 27 L82 44"/><path d="M92 31 L94 45"/></g><circle cx="31" cy="41" r="3" fill="#06121c"/><circle cx="32.2" cy="39.8" r="1" fill="#fff" opacity=".85"/></svg>',

  /* whale — was a rigid cutout that only slid sideways on the engine's swim sway,
     so it read as static. Now it actually swims: the tail fluke is split into its
     own element and BEATS up and down about the peduncle (the dominant motion),
     the pectoral flipper rows on its own offset, and the whole body gives a slow
     gentle flex pivoting at the head — compound, never-quite-repeating life. The
     fluke is body-coloured and drawn behind the body so the peduncle seam stays
     hidden. Scoped classes; all still for reduced-motion, like the jellyfish. */
  '🐋': '<svg viewBox="0 0 140 80"><style>.dwh-body{transform-box:fill-box;transform-origin:14% 50%;animation:dwBody 4.6s ease-in-out infinite}.dwh-fluke{transform-box:fill-box;transform-origin:0% 50%;animation:dwFluke 2.3s ease-in-out infinite}.dwh-pec{transform-box:fill-box;transform-origin:50% 0;animation:dwPec 3.1s ease-in-out infinite}@keyframes dwBody{0%,100%{transform:rotate(-1.3deg)}50%{transform:rotate(1.3deg)}}@keyframes dwFluke{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(11deg)}}@keyframes dwPec{0%,100%{transform:rotate(8deg)}50%{transform:rotate(-9deg)}}@media (prefers-reduced-motion:reduce){.dwh-body,.dwh-fluke,.dwh-pec{animation:none}}</style><g class="dwh-body"><g class="dwh-fluke"><path d="M119 41 L134 30 L130 46 L134 62 L119 50 Z" fill="#8fbfe0"/></g><path d="M30 44 Q34 22 72 24 Q112 26 121 41 Q123 46 120 50 Q110 60 72 60 Q36 62 30 44 Z" fill="#8fbfe0"/><path d="M44 51 Q72 60 114 50" stroke="#cfe6f7" stroke-width="2" fill="none" opacity=".55"/><circle cx="45" cy="42" r="3.6" fill="#06121c"/><g class="dwh-pec"><path d="M72 56 L80 71 L90 57 Z" fill="#79aacd"/></g></g></svg>',

  '🦑': '<svg viewBox="0 0 130 72"><g stroke="#c79fe0" stroke-width="4" fill="none" stroke-linecap="round"><path d="M62 33 Q90 28 122 22"/><path d="M62 35 Q92 36 124 35"/><path d="M62 38 Q90 45 118 49"/><path d="M64 40 Q86 52 110 60"/></g><path d="M8 36 Q40 16 66 30 L66 42 Q40 56 8 36 Z" fill="#b88fd6"/><circle cx="50" cy="35" r="4" fill="#06121c"/></svg>',

  /* jellyfish — the bell pumps (squash-and-recoil), the tentacles stream out a
     beat behind it and sway side to side, so it propels itself the way one really
     does. Animations are scoped to its own classes and pause for reduced-motion. */
  '🪼': '<svg viewBox="0 0 92 112"><style>.djelly-bell{transform-box:fill-box;transform-origin:50% 38%;animation:djBell 2.6s ease-in-out infinite}.djelly-trail{transform-box:fill-box;transform-origin:50% 0;animation:djTrail 2.6s ease-in-out infinite}.djelly-sway{transform-box:fill-box;transform-origin:50% 0;animation:djSway 4.2s ease-in-out infinite}@keyframes djBell{0%,100%{transform:scale(1,1)}35%{transform:scale(1.07,.84)}68%{transform:scale(.96,1.06)}}@keyframes djTrail{0%,100%{transform:translateY(0) scaleY(1)}35%{transform:translateY(-2px) scaleY(.9)}68%{transform:translateY(3px) scaleY(1.08)}}@keyframes djSway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}@media (prefers-reduced-motion:reduce){.djelly-bell,.djelly-trail,.djelly-sway{animation:none}}</style><g class="djelly-trail"><g class="djelly-sway"><g stroke="#9fd8ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"><path d="M20 52 Q24 90 17 106"/><path d="M33 53 Q35 92 30 108"/><path d="M46 53 L46 110"/><path d="M59 53 Q57 92 62 108"/><path d="M72 52 Q68 90 75 106"/></g><g stroke="#cdecff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"><path d="M27 52 Q30 78 26 96"/><path d="M40 53 Q41 80 38 100"/><path d="M53 53 Q52 80 55 100"/><path d="M65 52 Q63 78 67 96"/></g></g></g><g class="djelly-bell"><path d="M10 46 Q10 10 46 10 Q82 10 82 46 Q82 52 74 52 L18 52 Q10 52 10 46 Z" fill="#9fd8ff" opacity=".85"/><ellipse cx="34" cy="28" rx="8" ry="6" fill="#dff2ff" opacity=".6"/></g></svg>',

  /* octopus — each of the eight... well, six drawn arms undulates on its own
     stagger so the whole crown ripples (the two outer arms sweep wider, doArmO,
     so the crown flows rather than waving in lockstep), and the mantle JETS — an
     asymmetric squash, quick contract / slower swell, pivoting on the arm crown,
     the way it pulses water to propel itself. Scoped classes; still for reduced-motion. */
  '🐙': '<svg viewBox="0 0 120 100"><style>.doct-arm{transform-box:fill-box;transform-origin:50% 0;animation:doArm 2.7s ease-in-out infinite}.doct-arm.a2{animation-delay:-.45s}.doct-arm.a3{animation-delay:-.9s}.doct-arm.a4{animation-delay:-1.35s}.doct-arm.a5{animation-delay:-1.8s}.doct-arm.a6{animation-delay:-2.25s}.doct-out{animation-name:doArmO}.doct-head{transform-box:fill-box;transform-origin:50% 100%;animation:doHead 3.4s ease-in-out infinite}@keyframes doArm{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}@keyframes doArmO{0%,100%{transform:rotate(-13deg)}50%{transform:rotate(12deg)}}@keyframes doHead{0%,100%{transform:scale(1,1)}45%{transform:scale(1.08,.89)}}@media (prefers-reduced-motion:reduce){.doct-arm,.doct-head{animation:none}}</style><g stroke="#ff9fc0" stroke-width="6" fill="none" stroke-linecap="round"><g class="doct-arm doct-out a1"><path d="M38 60 Q24 78 10 84"/></g><g class="doct-arm a2"><path d="M46 64 Q40 85 30 96"/></g><g class="doct-arm a3"><path d="M55 66 Q53 87 47 99"/></g><g class="doct-arm a4"><path d="M65 66 Q67 87 73 99"/></g><g class="doct-arm a5"><path d="M74 64 Q80 85 90 96"/></g><g class="doct-arm doct-out a6"><path d="M82 60 Q96 78 110 84"/></g></g><g class="doct-head"><path d="M60 12 Q92 12 92 46 Q92 60 82 66 L38 66 Q28 60 28 46 Q28 12 60 12 Z" fill="#ff9fc0"/><circle cx="48" cy="42" r="5" fill="#06121c"/><circle cx="72" cy="42" r="5" fill="#06121c"/><circle cx="49.6" cy="40.4" r="1.6" fill="#dff2ff" opacity=".85"/><circle cx="73.6" cy="40.4" r="1.6" fill="#dff2ff" opacity=".85"/></g></svg>',

  /* seahorse — a rare find (see the `rare` roll in the engine). Drifts upright
     across the shallows; its dorsal fin flutters fast and the curled tail rocks
     slowly. Keyed by name (no Unicode seahorse emoji exists) so the engine looks
     it up like any glyph. The natural-toned sibling below shares its animation. */
  'seahorse': '<svg viewBox="0 0 70 112"><style>.dsea-fin{transform-box:fill-box;transform-origin:0 50%;animation:dsFin .4s ease-in-out infinite}.dsea-tail{transform-box:fill-box;transform-origin:100% 0;animation:dsTail 3.8s ease-in-out infinite}@keyframes dsFin{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.62)}}@keyframes dsTail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}@media (prefers-reduced-motion:reduce){.dsea-fin,.dsea-tail{animation:none}}</style><g class="dsea-tail"><path d="M34 82 C33 95 25 101 18 98 C12 95 13 87 20 87 C25 87 26 92 24 95" fill="none" stroke="#e0992f" stroke-width="6" stroke-linecap="round"/></g><g class="dsea-fin"><path d="M48 30 Q61 33 57 40 Q63 44 56 47 Q61 52 48 53 Z" fill="#ffd98a" opacity=".9"/></g><path d="M41 13 C50 14 51 24 49 32 C47 44 43 52 41 63 C40 72 41 78 38 83 L29 83 C27 76 30 66 29 56 C28 47 27 40 29 33 C30 27 27 25 24 25 C30 16 35 13 41 13 Z" fill="#f0b24e"/><path d="M25 21 L5 27 L25 31 Z" fill="#f0b24e"/><g fill="#f0b24e"><path d="M37 12 L34 5 L41 11 Z"/><path d="M42 11 L43 4 L47 10 Z"/></g><g stroke="#cf8f2c" stroke-width="1.4" stroke-linecap="round" opacity=".75"><path d="M31 39 L38 40"/><path d="M30 48 L40 49"/><path d="M30 57 L40 58"/><path d="M31 66 L39 67"/></g><circle cx="33" cy="24" r="2.4" fill="#06121c"/><circle cx="34" cy="23.2" r=".8" fill="#fff" opacity=".8"/></svg>',

  /* the ordinary seahorse — the common dweller of the kelpy shallows that drifts
     across most descents, so the gold one above stays the rare lucky catch and
     not the only seahorse you ever see. Same body and fluttering-fin / rocking-tail
     animation as the gold (shared classes, identical keyframes), recoloured to a
     natural dusky terracotta so it reads as "just a seahorse", not a dim gold one. */
  'seahorse-natural': '<svg viewBox="0 0 70 112"><style>.dsea-fin{transform-box:fill-box;transform-origin:0 50%;animation:dsFin .4s ease-in-out infinite}.dsea-tail{transform-box:fill-box;transform-origin:100% 0;animation:dsTail 3.8s ease-in-out infinite}@keyframes dsFin{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.62)}}@keyframes dsTail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}@media (prefers-reduced-motion:reduce){.dsea-fin,.dsea-tail{animation:none}}</style><g class="dsea-tail"><path d="M34 82 C33 95 25 101 18 98 C12 95 13 87 20 87 C25 87 26 92 24 95" fill="none" stroke="#9a5a40" stroke-width="6" stroke-linecap="round"/></g><g class="dsea-fin"><path d="M48 30 Q61 33 57 40 Q63 44 56 47 Q61 52 48 53 Z" fill="#e0a07e" opacity=".9"/></g><path d="M41 13 C50 14 51 24 49 32 C47 44 43 52 41 63 C40 72 41 78 38 83 L29 83 C27 76 30 66 29 56 C28 47 27 40 29 33 C30 27 27 25 24 25 C30 16 35 13 41 13 Z" fill="#c47a5a"/><path d="M25 21 L5 27 L25 31 Z" fill="#c47a5a"/><g fill="#c47a5a"><path d="M37 12 L34 5 L41 11 Z"/><path d="M42 11 L43 4 L47 10 Z"/></g><g stroke="#8a4f38" stroke-width="1.4" stroke-linecap="round" opacity=".75"><path d="M31 39 L38 40"/><path d="M30 48 L40 49"/><path d="M30 57 L40 58"/><path d="M31 66 L39 67"/></g><circle cx="33" cy="24" r="2.4" fill="#06121c"/><circle cx="34" cy="23.2" r=".8" fill="#fff" opacity=".8"/></svg>',
};
