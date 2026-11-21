// WHAT ASSIGNMENT? — the whole film. Every frame is a function of t: pose tracks, camera choices, light.
import { P, F, rgba, fillR, text, clamp, lerp, dust, wash, vignette, circ, ell, line } from './kit.js';
import { X, RAY, KAI } from './cast.js';
import * as S from './sets.js';
import { skeletonPieces, drawSkeleton, drawCrumble, landings } from './skeleton.js';
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
  // "I was doing the assignment.": arms come down, he turns to Ray, one easy open-hand gesture. No props.
  const kTurn = kai({ face: -.36, lean: .02, shrug: .1, head: { tilt: -.06, turn: -.06 }, e: { ...X.chill, lidT: .38, mS: .55, mW: .7, browH: .2, gx: -.65 }, aL: { to: [-84, -226], k: 1, hand: 'open', z: 1 }, aR: { to: [34, -128], k: 1, z: 1 }, lL: { x: -70 }, lR: { x: -36 } });
  const kTurn2 = kai({ ...kTurn, head: { tilt: -.1, turn: -.08, nod: -.04 }, e: { ...X.proud, browH: .45, gx: -.65 }, aL: { to: [-98, -246], k: 1, hand: 'open', z: 1 } });
  const kListen = kai({ ...kTurn, shrug: .2, head: { tilt: -.02 }, e: { ...X.chill, lidT: .3, mS: .4, gx: -.65 }, aL: { to: [-52, -124], k: -1, z: 1 } });
  const kFrozen = kai({ ...kListen, shrug: .7, e: { ...X.blank, lidT: 0, eyeOpen: 1.1, pup: .5, gx: -.65, sweat: .3 } });
  const kEyes = kai({ ...kFrozen, e: { ...kFrozen.e, lidT: 0, eyeOpen: 1.2, gx: .2, sweat: .6 } });
  const kCam = kai({ ...kFrozen, face: -.02, lean: -.07, shrug: 1.2, sq: .05, head: { tilt: 0, turn: 0 }, e: { ...X.doom, lidT: 0, lidB: 0, gx: 0 } });
  const kDoom = kai({ ...kCam, e: { ...X.doom, lidT: 0, lidB: 0, eyeOpen: 1.3, pup: .3, gx: 0 } });
  K = {
    ray: [[0, rIdle], [a1.t0 - .1, rIdle], [a1.t0 + .18, rAsk, 'back'], [a1.t1 + .1, rAsk], [a1.t1 + .45, rListen],
      [b3.t0 + .7, rListen], [b3.t1 - .1, rBlank, 'o'],
      [a4.t0 - .05, rBlank], [a4.t0 + .14, rHuh, 'back'], [a4.t0 + .68, rHuh], [a4.t0 + .86, rWhat, 'back'], [a4.t1 + .05, rWhat], [m.s4 + .25, rFrozen, 'o'],
      [m.eyes, rFrozen], [m.eyes + .22, rEyes, 'o'], [m.heads, rEyes], [m.heads + .3, rCam, 'back'], [m.hit, rCam], [m.hit + .35, rDoom, 'o']],
    kai: [[0, kBack], [b2.t0 - .3, kBack], [b2.t0 - .05, kOpen, 'o'], [b2.t0 + .3, kWhat], [b2.t1 + .05, kWhat], [b3.t0 + .3, kTurn, 'back'], [b3.t1 - .45, kTurn2], [b3.t1 + .35, kListen],
      [a4.t1 - .1, kListen], [m.s4 + .25, kFrozen, 'o'],
      [m.eyes, kFrozen], [m.eyes + .22, kEyes, 'o'], [m.heads + .05, kEyes], [m.heads + .35, kCam, 'back'], [m.hit, kCam], [m.hit + .35, kDoom, 'o']],
  };
  return K;
}

// the clock reaches 9:00:00 on the cut to black
const clockSS = t => clamp(60 - (M.black - t), 0, 60);

// ---------------- the scene ----------------
function drawScene(g, t, { sun = 1, only = null, blurBg = 0 } = {}) {
  S.hallBench(g, t, { sun, ss: clockSS(t) });
  S.backpack(g, 190, 1468, 1.2, '#7E4B78', -.04);
  S.backpack(g, 905, 1480, 1.15, '#2F6B5E', .05);
}
function figures(g, t, o = {}) {
  const k = keys();
  let rp = pk(RAY, t, k.ray), kp = pk(KAI, t, k.kai);
  rp = talk(idle(rp, t, 0, t > M.heads ? .3 : 1), 'RAY', t); kp = talk(idle(kp, t, 1.7, t > M.heads ? .3 : 1), 'KAI', t);
  // after the hit: a tremble (harder in the rattle just before they fall apart)
  if (t > M.hit) {
    const a = t > M.rattle ? 4.2 : 1.6, tr = Math.sin(t * 61) * a, tr2 = Math.cos(t * 57) * a;
    rp = { ...rp, hipX: (rp.hipX || 0) + tr, head: { ...rp.head, ox: (rp.head.ox || 0) + tr * 1.4 } }; kp = { ...kp, hipX: (kp.hipX || 0) + tr2, head: { ...kp.head, ox: (kp.head.ox || 0) + tr2 * 1.4 } };
  }
  const R = POS.RAY, Kp = POS.KAI;
  const xray = !o.faces && t >= M.hit && t < M.skel && Math.floor((t - M.hit) * 15) % 2 === 0;
  if (t < M.skel || o.faces) {
    drawP(g, RAY, rp, R.x, R.y, R.s, L_SUN, xray ? { tint: [P.night, .86], noShadow: true } : undefined);
    drawP(g, KAI, kp, Kp.x, Kp.y, Kp.s, L_SUN, xray ? { tint: [P.night, .86], noShadow: true } : undefined);
    if (!xray) return;
  }
  if (t < M.crumble) {
    drawSkeleton(g, skeletonPieces(RAY, rp, R.x, R.y, R.s, 0), t); drawSkeleton(g, skeletonPieces(KAI, kp, Kp.x, Kp.y, Kp.s, 2), t);
    return;
  }
  const [sr, sk] = restSkeletons(), u = t - M.crumble;
  drawCrumble(g, sr, 0, u); drawCrumble(g, sk, 1, u);
}
// the skeletons as they are at the moment they fall apart (no tremble), cached: the same every frame
let RS = null;
function restSkeletons() {
  if (RS) return RS; const k = keys(), R = POS.RAY, Kp = POS.KAI;
  return (RS = [skeletonPieces(RAY, pk(RAY, M.crumble, k.ray), R.x, R.y, R.s, 0), skeletonPieces(KAI, pk(KAI, M.crumble, k.kai), Kp.x, Kp.y, Kp.s, 2)]);
}
// bone landings → sound events
export function boneEvents() {
  const [sr, sk] = restSkeletons(), out = [];
  [[sr, 0], [sk, 1]].forEach(([s, c]) => landings(s, c).forEach(l => out.push({ t: +(M.crumble + l.t).toFixed(3), type: l.id === 'skull' ? 'skull' : 'bone', v: +l.v.toFixed(2), c })));
  return out.sort((a, b) => a.t - b.t);
}

// camera for every shot
function shotCam(t) {
  const m = M;
  if (t < m.s2) return { x: 548, y: 1078, z: kf(t, [[0, 1.16], [m.s2, 1.24, 'lin']]) };
  if (t < m.s3) return { x: 712, y: 930, z: kf(t, [[m.s2, 2.05], [m.s3, 2.16, 'lin']]) };
  if (t < m.s4) return { x: 386, y: 892, z: kf(t, [[m.s3, 2.55], [lineT('a4').t0 + .8, 2.62, 'lin'], [lineT('a4').t0 + 1.05, 2.86, 'o'], [m.s4, 2.9, 'lin']]) };
  if (t < m.hit) return { x: 528, y: 1010, z: kf(t, [[m.s4, 1.32], [m.hit, 1.36, 'lin']]) };
  // the crash push on the double stare, with a shake that settles
  const u = t - m.hit, z = kf(t, [[m.hit, 1.36], [m.hit + .32, 1.8, 'o'], [m.crumble, 1.98, 'lin'], [m.crumble + .45, 1.3, 'o'], [m.black, 1.34, 'lin']]);
  const uc = Math.max(0, t - m.crumble - .3), sh = Math.exp(-u * 3.2) * 9 + (t > m.crumble + .3 ? Math.exp(-uc * 5) * 5 : 0);
  return { x: 526 + Math.sin(u * 47) * sh, y: kf(t, [[m.hit, 1010], [m.hit + .32, 900, 'o'], [m.crumble, 862, 'lin'], [m.crumble + .45, 1075, 'o'], [m.black, 1080, 'lin']]) + Math.cos(u * 41) * sh, z, r: Math.sin(u * 29) * sh * .0016 };
}

export function renderFilm(ctx, t, o = {}) {
  const m = M;
  if (t >= m.black) { fillR(ctx, 0, 0, W, H, '#000'); return; }
  const c = shotCam(t);
  const sun = t < m.hit ? 1 : kf(t, [[m.hit, 1], [m.hit + .5, .35, 'o'], [m.black, .25]]);
  const closeUp = t >= m.s2 && t < m.s4;
  // depth of field in the close-ups: the set goes soft, the face stays sharp
  layer(ctx, 'bg', g => cam(g, c, () => drawScene(g, t, { sun })), closeUp ? 7 : 0);
  cam(ctx, c, () => { figures(ctx, t, o); dust(ctx, t, 60, 300, 1000, 1100, 46, 2, '#FFF2CF', .7 * sun); });
  // grade: warm morning; the doom drains it to lavender
  if (t >= m.heads) {
    const d = kf(t, [[m.heads, 0], [m.hit, .12], [m.hit + .4, .34, 'o'], [m.black, .38]]);
    wash(ctx, W, H, '#6E648F', d, 'multiply');
  }
  const vig = t >= m.hit ? kf(t, [[m.hit, .5], [m.hit + .4, .9, 'o']]) : closeUp ? .5 : .44;
  finish(ctx, { vig, bl: t >= m.hit ? .16 : .24, grade: t < m.heads ? ['#FFD58A', .07, 'soft-light'] : null });
  // the hit: one white frame of light
  if (t >= m.hit && t < m.hit + .1) { ctx.save(); ctx.globalAlpha = (1 - (t - m.hit) / .1) * .55; fillR(ctx, 0, 0, W, H, '#FFF4DA'); ctx.restore(); }
}
