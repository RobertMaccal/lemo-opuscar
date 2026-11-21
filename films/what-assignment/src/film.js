// WHAT ASSIGNMENT? — the whole film. Every frame is a function of t: pose tracks, camera choices, light.
import { P, F, rgba, fillR, text, clamp, lerp, dust, wash, vignette, circ, ell, line } from './kit.js';
import { X, RAY, KAI } from './cast.js';
import * as S from './sets.js';
import { W, H, cam, layer, finish, mkL, seat, caption } from './shots.js';
import { TL, M, kf, pk, P_, idle, talk, lineT, captions, EASE, drawP } from './anim.js';

export const POS = { RAY: { x: 352, y: 1400, s: 1.55 }, KAI: { x: 700, y: 1400, s: 1.55 } };
const L_SUN = mkL(.74, .6, { shadow: { kx: .55, ky: .12, a: .28, blur: 7, col: P.plum } });
const ray = (...o) => P_(RAY, seat(RAY, { legS: .64 }), ...o), kai = (...o) => P_(KAI, seat(KAI, { legS: .6 }), ...o);

// ---------------- pose tracks ----------------
let K = null;
export function keys() {
  if (K) return K;
  const m = M, l = id => lineT(id), a1 = l('a1'), b2 = l('b2'), b3 = l('b3'), a4 = l('a4');
  // RAY
  const rIdle = ray({ face: .32, lean: .06, shrug: .25, head: { tilt: -.03 }, e: { ...X.friendly, gx: .55, mO: 0 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { to: [52, -124], k: -1, z: 1 }, lL: { x: 34 }, lR: { x: 70 } });
  const rAsk = ray({ face: .36, lean: .1, shrug: .45, head: { tilt: .06, nod: -.08 }, e: { ...X.happy, mO: .2, browH: .55, gx: .6 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { a: -1.55, b: -.9, hand: 'open', z: 1 }, lL: { x: 34 }, lR: { x: 70 } });
  const rListen = ray({ face: .36, lean: .08, shrug: .3, head: { tilt: .04 }, e: { ...X.friendly, mO: 0, gx: .6 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { to: [52, -124], k: -1, z: 1 }, lL: { x: 34 }, lR: { x: 70 } });
  const rBlank = ray({ face: .36, lean: .02, shrug: .55, head: { tilt: .1, nod: .05 }, e: { ...X.blank, gx: .6 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { to: [52, -124], k: -1, z: 1 }, lL: { x: 34 }, lR: { x: 70 } });
  const rHuh = ray({ face: .4, lean: .12, shrug: .7, sq: -.04, head: { tilt: .16, ox: 4 }, e: { ...X.huh, gx: .6 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { to: [52, -124], k: -1, z: 1 }, lL: { x: 34 }, lR: { x: 70 } });
  const rWhat = ray({ face: .42, lean: .2, shrug: .9, head: { tilt: -.06, ox: 8 }, e: { ...X.confused, eyeOpen: 1.22, pup: .55, browH: .8, mO: .5, gx: .7 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { a: -1.2, b: -1.5, hand: 'open', z: 1 }, lL: { x: 34 }, lR: { x: 70 } });
  const rFrozen = ray({ face: .38, lean: .12, shrug: 1, head: { tilt: -.02 }, e: { ...X.blank, eyeOpen: 1.08, pup: .5, gx: .65, sweat: .25 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { to: [56, -150], k: -1, z: 1, hand: 'open' }, lL: { x: 34 }, lR: { x: 70 } });
  const rEyes = ray({ ...rFrozen, e: { ...rFrozen.e, gx: -.18, gy: .02, sweat: .6 } });
  const rCam = ray({ face: .02, lean: .07, shrug: 1.25, sq: .05, head: { tilt: 0 }, e: { ...X.doom, gx: 0 }, aL: { to: [-34, -128], k: 1, z: 1 }, aR: { to: [56, -150], k: -1, z: 1, hand: 'open' }, lL: { x: 34 }, lR: { x: 70 } });
  const rDoom = ray({ ...rCam, e: { ...X.doom, lidT: 0, eyeOpen: 1.3, pup: .3, gx: 0 } });
  // KAI
  const kBack = kai({ face: -.18, lean: -.1, shrug: .15, head: { tilt: .08, nod: -.12 }, e: { ...X.chill, eyeOpen: .05, closeCurve: 1, mS: .55, gx: -.2 }, aL: { to: [-58, -350], k: -1, z: -1 }, aR: { to: [64, -346], k: 1, z: -1 }, lL: { x: -70 }, lR: { x: -36 } });
  const kOpen = kai({ ...kBack, head: { tilt: .06, nod: -.08, turn: -.12 }, e: { ...X.chill, lidT: .62, gx: -.75, mS: .1, mW: .5 } });
  const kWhat = kai({ ...kBack, head: { tilt: .04, nod: -.06, turn: -.18 }, e: { ...X.deadpan, lidT: .55, gx: -.8, browAsym: .4 } });
  const kReach = kai({ face: -.3, lean: .02, shrug: .2, head: { tilt: .02, turn: -.05 }, e: { ...X.chill, lidT: .4, gx: -.6, mS: .5 }, aL: { to: [-30, -190], k: 1, z: 1 }, aR: { to: [8, -214], k: -1, z: 1 }, lL: { x: -70 }, lR: { x: -36 } });
  const kShow = kai({ face: -.34, lean: .03, shrug: .1, head: { tilt: -.08, turn: -.05 }, e: { ...X.proud, gx: -.6 }, aL: { a: .1, b: -.1, z: 1 }, aR: { to: [-92, -268], k: 1, z: 1, prop: { n: 'paper', r: -.16, w: 84, h: 108 } }, lL: { x: -70 }, lR: { x: -36 } });
  const kShow2 = kai({ ...kShow, head: { tilt: -.12, turn: -.08, nod: -.04 }, e: { ...X.proud, browH: .55, gx: -.65 } });
  const kSlip = kai({ ...kShow, head: { tilt: .02 }, e: { ...X.blank, lidT: .1, gx: -.65 }, aR: { to: [-80, -236], k: 1, z: 1, prop: { n: 'paper', r: -.24, w: 84, h: 108 } } });
  const kFrozen = kai({ ...kSlip, shrug: .7, e: { ...X.blank, eyeOpen: 1.1, pup: .5, gx: -.65, sweat: .3 }, aR: { to: [-46, -170], k: 1, z: 1, prop: { n: 'paper', r: -.4, w: 84, h: 108 } } });
  const kEyes = kai({ ...kFrozen, e: { ...kFrozen.e, lidT: 0, eyeOpen: 1.2, gx: .2, sweat: .6 } });
  const kCam = kai({ ...kFrozen, aR: { to: [-40, -150], k: 1, z: 1, hand: 'open' }, face: -.02, lean: -.07, shrug: 1.2, sq: .05, head: { tilt: 0, turn: 0 }, e: { ...X.doom, lidT: 0, lidB: 0, gx: 0 } });
  const kDoom = kai({ ...kCam, e: { ...X.doom, lidT: 0, lidB: 0, eyeOpen: 1.3, pup: .3, gx: 0 } });
  K = {
    ray: [[0, rIdle], [a1.t0 - .1, rIdle], [a1.t0 + .18, rAsk, 'back'], [a1.t1 + .1, rAsk], [a1.t1 + .45, rListen],
      [b3.t0 + .7, rListen], [b3.t1 - .1, rBlank, 'o'],
      [a4.t0 - .05, rBlank], [a4.t0 + .14, rHuh, 'back'], [a4.t0 + .68, rHuh], [a4.t0 + .86, rWhat, 'back'], [a4.t1 + .05, rWhat], [m.s4 + .25, rFrozen, 'o'],
      [m.eyes, rFrozen], [m.eyes + .22, rEyes, 'o'], [m.heads, rEyes], [m.heads + .3, rCam, 'back'], [m.hit, rCam], [m.hit + .35, rDoom, 'o']],
    kai: [[0, kBack], [b2.t0 - .3, kBack], [b2.t0 - .05, kOpen, 'o'], [b2.t0 + .3, kWhat], [b2.t1 + .05, kWhat], [b3.t0 - .25, kReach, 'io'], [b3.t0 + .05, kReach],
      [b3.t0 + .42, kShow, 'back'], [b3.t1 - .3, kShow2], [b3.t1 + .2, kShow2], [a4.t0 + .9, kShow2], [a4.t1 - .1, kSlip, 'io'], [m.s4 + .25, kFrozen, 'o'],
      [m.eyes, kFrozen], [m.eyes + .22, kEyes, 'o'], [m.heads + .05, kEyes], [m.heads + .35, kCam, 'back'], [m.hit, kCam], [m.hit + .35, kDoom, 'o']],
  };
  return K;
}

// the assignment, drawn like the rig's paper prop
function paperSheet(g) { const w = 84, h = 108; g.fillStyle = P.paper; g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fill(); g.stroke(); g.strokeStyle = rgba(P.lavDeep, .55); g.lineWidth = 2.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-w / 2 + 9, -h / 2 + 18 + i * 12); g.lineTo(w / 2 - 9 - (i % 3) * 8, -h / 2 + 18 + i * 12); g.stroke(); } }
// the clock reaches 9:00:00 on the bell
const clockSS = t => clamp(60 - (M.bell - t), 0, 60);

// ---------------- the scene ----------------
function drawScene(g, t, { sun = 1, only = null, blurBg = 0 } = {}) {
  S.hallBench(g, t, { sun, ss: clockSS(t) });
  S.backpack(g, 190, 1468, 1.2, '#7E4B78', -.04);
  S.backpack(g, 905, 1480, 1.15, '#2F6B5E', .05);
}
function figures(g, t) {
  const k = keys();
  let rp = pk(RAY, t, k.ray), kp = pk(KAI, t, k.kai);
  rp = talk(idle(rp, t, 0, t > M.heads ? .3 : 1), 'RAY', t); kp = talk(idle(kp, t, 1.7, t > M.heads ? .3 : 1), 'KAI', t);
  // the paper slides out of the jacket before it is held up
  if (t > lineT('b3').t0 - .1 && t < lineT('b3').t0 + .2) kp = { ...kp, aR: { ...kp.aR, prop: { n: 'paper', r: -.6, w: 60, h: 80 } } };
  // after the hit: a tremble
  if (t > M.hit) { const tr = Math.sin(t * 61) * 1.6, tr2 = Math.cos(t * 57) * 1.6; rp = { ...rp, hipX: (rp.hipX || 0) + tr, head: { ...rp.head, ox: (rp.head.ox || 0) + tr } }; kp = { ...kp, hipX: (kp.hipX || 0) + tr2, head: { ...kp.head, ox: (kp.head.ox || 0) + tr2 } }; }
  const R = POS.RAY, Kp = POS.KAI;
  drawP(g, RAY, rp, R.x, R.y, R.s, L_SUN);
  drawP(g, KAI, kp, Kp.x, Kp.y, Kp.s, L_SUN);
  // the assignment slips out of his fingers on the hit and see-saws to the floor
  if (t > M.hit + .04) {
    const u = t - M.hit - .04, f = Math.min(1, u / 1.5), x = Kp.x - 66 + Math.sin(u * 5.2) * 46 * (1 - f * .4) - f * 30, y = lerp(1130, 1452, EASE.ss(f)), r = -.4 + Math.sin(u * 5.2 + .4) * .7 * (1 - f) + f * 1.35;
    g.save(); g.translate(x, y); g.rotate(r); g.scale(1.55, 1.55 * (f < 1 ? 1 : .35)); paperSheet(g); g.restore();
  }
}

// camera for every shot
function shotCam(t) {
  const m = M;
  if (t < m.s2) return { x: 548, y: 1078, z: kf(t, [[0, 1.16], [m.s2, 1.24, 'lin']]) };
  if (t < m.s3) return { x: 712, y: 930, z: kf(t, [[m.s2, 2.05], [m.s3, 2.16, 'lin']]) };
  if (t < m.s4) return { x: 386, y: 892, z: kf(t, [[m.s3, 2.55], [lineT('a4').t0 + .8, 2.62, 'lin'], [lineT('a4').t0 + 1.05, 2.86, 'o'], [m.s4, 2.9, 'lin']]) };
  if (t < m.hit) return { x: 528, y: 1010, z: kf(t, [[m.s4, 1.32], [m.hit, 1.36, 'lin']]) };
  // the crash push on the double stare, with a shake that settles
  const u = t - m.hit, z = kf(t, [[m.hit, 1.36], [m.hit + .32, 1.8, 'o'], [m.black, 2.12, 'lin']]);
  const sh = Math.exp(-u * 3.2) * 9; return { x: 526 + Math.sin(u * 47) * sh, y: kf(t, [[m.hit, 1010], [m.hit + .32, 900, 'o'], [m.black, 868, 'lin']]) + Math.cos(u * 41) * sh, z, r: Math.sin(u * 29) * sh * .0016 };
}

export function renderFilm(ctx, t) {
  const m = M;
  if (t >= m.black) { fillR(ctx, 0, 0, W, H, '#000'); return; }
  const c = shotCam(t);
  const sun = t < m.hit ? 1 : kf(t, [[m.hit, 1], [m.hit + .5, .35, 'o'], [m.black, .25]]);
  const closeUp = t >= m.s2 && t < m.s4;
  // depth of field in the close-ups: the set goes soft, the face stays sharp
  layer(ctx, 'bg', g => cam(g, c, () => drawScene(g, t, { sun })), closeUp ? 7 : 0);
  cam(ctx, c, () => { figures(ctx, t); dust(ctx, t, 60, 300, 1000, 1100, 46, 2, '#FFF2CF', .7 * sun); });
  // grade: warm morning; the doom drains it to lavender
  if (t >= m.heads) {
    const d = kf(t, [[m.heads, 0], [m.hit, .12], [m.hit + .4, .42, 'o'], [m.black, .5]]);
    wash(ctx, W, H, '#6E648F', d, 'multiply');
  }
  const vig = t >= m.hit ? kf(t, [[m.hit, .5], [m.hit + .4, .9, 'o']]) : closeUp ? .5 : .44;
  finish(ctx, { vig, bl: t >= m.hit ? .16 : .24, grade: t < m.heads ? ['#FFD58A', .07, 'soft-light'] : null });
  // the hit: one white frame of light
  if (t >= m.hit && t < m.hit + .1) { ctx.save(); ctx.globalAlpha = (1 - (t - m.hit) / .1) * .55; fillR(ctx, 0, 0, W, H, '#FFF4DA'); ctx.restore(); }
  captions(ctx, t, 1560, 60);
}
