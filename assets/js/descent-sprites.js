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
     tail + a soft highlight so it reads as the lucky catch, not just a fish. */
  'goldfish': '<svg viewBox="21 -3 120 70"><path d="M104 35 L120 18 L114 35 L120 52 Z" fill="#ffce54"/><path d="M42 35 Q70 13 106 35 Q70 57 42 35 Z" fill="#f0b24e"/><path d="M70 20 L78 12 L80 26 Z" fill="#e0992f"/><ellipse cx="64" cy="30" rx="9" ry="4" fill="#fff" opacity=".3"/><circle cx="56" cy="32" r="3.5" fill="#06121c"/><circle cx="57" cy="31" r="1.1" fill="#fff" opacity=".8"/></svg>',

  /* sea turtle (top view, heading left) — it "flies" through the water: the two
     front flippers row in a slow synchronised stroke, the rear pair waggle as
     rudders a beat slower, and the head nods on its neck. Each flap pivots on the
     real shell-attach point (view-box origins), and all of it stills for
     reduced-motion. Flippers sit behind the shell so the pivots stay hidden. */
  '🐢': '<svg viewBox="0 0 120 78"><style>.turt-ffu,.turt-ffl,.turt-rfu,.turt-rfl,.turt-head{transform-box:view-box}.turt-ffu{transform-origin:56px 27px;animation:turtFfu 2.6s ease-in-out infinite}.turt-ffl{transform-origin:55px 58px;animation:turtFfl 2.6s ease-in-out infinite}.turt-rfu{transform-origin:85px 28px;animation:turtRfu 4s ease-in-out infinite}.turt-rfl{transform-origin:84px 57px;animation:turtRfl 4s ease-in-out infinite}.turt-head{transform-origin:55px 42px;animation:turtHead 3.4s ease-in-out infinite}@keyframes turtFfu{0%,100%{transform:rotate(11deg)}50%{transform:rotate(-12deg)}}@keyframes turtFfl{0%,100%{transform:rotate(-11deg)}50%{transform:rotate(12deg)}}@keyframes turtRfu{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}@keyframes turtRfl{0%,100%{transform:rotate(5deg)}50%{transform:rotate(-6deg)}}@keyframes turtHead{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}@media (prefers-reduced-motion:reduce){.turt-ffu,.turt-ffl,.turt-rfu,.turt-rfl,.turt-head{animation:none}}</style><g class="turt-head"><ellipse cx="44" cy="42" rx="13" ry="9" fill="#5a9b72"/><circle cx="35" cy="40" r="2.6" fill="#06121c"/></g><g class="turt-ffl"><ellipse cx="48" cy="66" rx="11" ry="6" fill="#5a9b72" transform="rotate(28 48 66)"/></g><g class="turt-rfl"><ellipse cx="92" cy="64" rx="11" ry="6" fill="#5a9b72" transform="rotate(-18 92 64)"/></g><g class="turt-ffu"><ellipse cx="50" cy="20" rx="9" ry="5" fill="#5a9b72" transform="rotate(-28 50 20)"/></g><g class="turt-rfu"><ellipse cx="92" cy="22" rx="9" ry="5" fill="#5a9b72" transform="rotate(20 92 22)"/></g><ellipse cx="68" cy="42" rx="34" ry="24" fill="#3f7d5a"/><g stroke="#2a5a40" stroke-width="2" fill="none"><path d="M68 18 L68 66"/><path d="M40 30 L96 54"/><path d="M40 54 L96 30"/><ellipse cx="68" cy="42" rx="34" ry="24"/></g></svg>',

  '🐋': '<svg viewBox="0 0 140 80"><path d="M30 44 Q34 22 72 24 Q112 26 122 40 L134 30 L130 46 L134 62 L120 50 Q110 60 72 60 Q36 62 30 44 Z" fill="#8fbfe0"/><path d="M44 51 Q72 60 114 50" stroke="#cfe6f7" stroke-width="2" fill="none" opacity=".55"/><path d="M72 56 L80 71 L90 57 Z" fill="#79aacd"/><circle cx="45" cy="42" r="3.6" fill="#06121c"/></svg>',

  '🦑': '<svg viewBox="0 0 130 72"><g stroke="#c79fe0" stroke-width="4" fill="none" stroke-linecap="round"><path d="M62 33 Q90 28 122 22"/><path d="M62 35 Q92 36 124 35"/><path d="M62 38 Q90 45 118 49"/><path d="M64 40 Q86 52 110 60"/></g><path d="M8 36 Q40 16 66 30 L66 42 Q40 56 8 36 Z" fill="#b88fd6"/><circle cx="50" cy="35" r="4" fill="#06121c"/></svg>',

  /* jellyfish — the bell pumps (squash-and-recoil), the tentacles stream out a
     beat behind it and sway side to side, so it propels itself the way one really
     does. Animations are scoped to its own classes and pause for reduced-motion. */
  '🪼': '<svg viewBox="0 0 92 112"><style>.djelly-bell{transform-box:fill-box;transform-origin:50% 38%;animation:djBell 2.6s ease-in-out infinite}.djelly-trail{transform-box:fill-box;transform-origin:50% 0;animation:djTrail 2.6s ease-in-out infinite}.djelly-sway{transform-box:fill-box;transform-origin:50% 0;animation:djSway 4.2s ease-in-out infinite}@keyframes djBell{0%,100%{transform:scale(1,1)}35%{transform:scale(1.07,.84)}68%{transform:scale(.96,1.06)}}@keyframes djTrail{0%,100%{transform:translateY(0) scaleY(1)}35%{transform:translateY(-2px) scaleY(.9)}68%{transform:translateY(3px) scaleY(1.08)}}@keyframes djSway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}@media (prefers-reduced-motion:reduce){.djelly-bell,.djelly-trail,.djelly-sway{animation:none}}</style><g class="djelly-trail"><g class="djelly-sway"><g stroke="#9fd8ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"><path d="M20 52 Q24 90 17 106"/><path d="M33 53 Q35 92 30 108"/><path d="M46 53 L46 110"/><path d="M59 53 Q57 92 62 108"/><path d="M72 52 Q68 90 75 106"/></g><g stroke="#cdecff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"><path d="M27 52 Q30 78 26 96"/><path d="M40 53 Q41 80 38 100"/><path d="M53 53 Q52 80 55 100"/><path d="M65 52 Q63 78 67 96"/></g></g></g><g class="djelly-bell"><path d="M10 46 Q10 10 46 10 Q82 10 82 46 Q82 52 74 52 L18 52 Q10 52 10 46 Z" fill="#9fd8ff" opacity=".85"/><ellipse cx="34" cy="28" rx="8" ry="6" fill="#dff2ff" opacity=".6"/></g></svg>',

  /* octopus — each of the eight... well, six drawn arms undulates on its own
     stagger so the whole crown ripples, and the mantle "breathes" (a soft squash
     pivoting on the arm crown). Scoped classes; still for reduced-motion. */
  '🐙': '<svg viewBox="0 0 120 100"><style>.doct-arm{transform-box:fill-box;transform-origin:50% 0;animation:doArm 3s ease-in-out infinite}.doct-arm.a2{animation-delay:-.5s}.doct-arm.a3{animation-delay:-1s}.doct-arm.a4{animation-delay:-1.5s}.doct-arm.a5{animation-delay:-2s}.doct-arm.a6{animation-delay:-2.5s}.doct-head{transform-box:fill-box;transform-origin:50% 100%;animation:doHead 3.6s ease-in-out infinite}@keyframes doArm{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}@keyframes doHead{0%,100%{transform:scale(1,1)}50%{transform:scale(1.05,.95)}}@media (prefers-reduced-motion:reduce){.doct-arm,.doct-head{animation:none}}</style><g stroke="#ff9fc0" stroke-width="6" fill="none" stroke-linecap="round"><g class="doct-arm a1"><path d="M38 60 Q24 78 10 84"/></g><g class="doct-arm a2"><path d="M46 64 Q40 85 30 96"/></g><g class="doct-arm a3"><path d="M55 66 Q53 87 47 99"/></g><g class="doct-arm a4"><path d="M65 66 Q67 87 73 99"/></g><g class="doct-arm a5"><path d="M74 64 Q80 85 90 96"/></g><g class="doct-arm a6"><path d="M82 60 Q96 78 110 84"/></g></g><g class="doct-head"><path d="M60 12 Q92 12 92 46 Q92 60 82 66 L38 66 Q28 60 28 46 Q28 12 60 12 Z" fill="#ff9fc0"/><circle cx="48" cy="42" r="5" fill="#06121c"/><circle cx="72" cy="42" r="5" fill="#06121c"/><circle cx="49.6" cy="40.4" r="1.6" fill="#dff2ff" opacity=".85"/><circle cx="73.6" cy="40.4" r="1.6" fill="#dff2ff" opacity=".85"/></g></svg>',

  /* seahorse — a rare find (see the `rare` roll in the engine). Hovers upright;
     its dorsal fin flutters fast and the curled tail rocks slowly. Keyed by name
     (no Unicode seahorse emoji exists) so the engine looks it up like any glyph. */
  'seahorse': '<svg viewBox="0 0 70 112"><style>.dsea-fin{transform-box:fill-box;transform-origin:0 50%;animation:dsFin .4s ease-in-out infinite}.dsea-tail{transform-box:fill-box;transform-origin:100% 0;animation:dsTail 3.8s ease-in-out infinite}@keyframes dsFin{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.62)}}@keyframes dsTail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}@media (prefers-reduced-motion:reduce){.dsea-fin,.dsea-tail{animation:none}}</style><g class="dsea-tail"><path d="M34 82 C33 95 25 101 18 98 C12 95 13 87 20 87 C25 87 26 92 24 95" fill="none" stroke="#e0992f" stroke-width="6" stroke-linecap="round"/></g><g class="dsea-fin"><path d="M48 30 Q61 33 57 40 Q63 44 56 47 Q61 52 48 53 Z" fill="#ffd98a" opacity=".9"/></g><path d="M41 13 C50 14 51 24 49 32 C47 44 43 52 41 63 C40 72 41 78 38 83 L29 83 C27 76 30 66 29 56 C28 47 27 40 29 33 C30 27 27 25 24 25 C30 16 35 13 41 13 Z" fill="#f0b24e"/><path d="M25 21 L5 27 L25 31 Z" fill="#f0b24e"/><g fill="#f0b24e"><path d="M37 12 L34 5 L41 11 Z"/><path d="M42 11 L43 4 L47 10 Z"/></g><g stroke="#cf8f2c" stroke-width="1.4" stroke-linecap="round" opacity=".75"><path d="M31 39 L38 40"/><path d="M30 48 L40 49"/><path d="M30 57 L40 58"/><path d="M31 66 L39 67"/></g><circle cx="33" cy="24" r="2.4" fill="#06121c"/><circle cx="34" cy="23.2" r=".8" fill="#fff" opacity=".8"/></svg>',
};
