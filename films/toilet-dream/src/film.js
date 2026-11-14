// THE TOILET DREAM — every shot as a function of absolute time. Poses come from keyframed tracks; cuts are hard.
import { P, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, TAU, clamp, lerp, wash, dust } from './kit.js';
import { solve, mixPose } from './rig.js';
import { X, DREAMER as D } from './cast.js';
import * as S from './sets.js';
import * as SC from './scenes.js';
import { W, H, cam, layerSoft, finish } from './shots.js';
import { kf, pk, P_, idle, walk, jolt, EASE } from './anim.js';
import { C, K, WALKS, walkX } from './timeline.js';

const { FY, BED } = S, HIP0 = SC.HIP0;
const hy = (Y, s = 1) => HIP0 - (FY - Y) / s;          // hipY that puts the hip at world height Y
const E = (...o) => Object.assign({}, X.neutral, ...o);
const LEGS = { lL: { x: 170, y: -96, r: -1.3 }, lR: { x: 186, y: -100, r: -1.3 } };
const LB = [[600, 26, 110], [690, 22, 72]];

// ---------- the bed poses ----------
const LIE = P_(D, { lean: -1.5, face: .9, hipY: hy(1430), head: { tilt: -1.37, oy: -12 }, shrug: 0, e: X.sleep, ...LEGS, aL: { a: 1.48, b: .22, z: 1 }, aR: { a: 1.36, b: .32, z: 1 } });
const SIDE = P_(D, LIE, { face: 0, head: { tilt: -1.37, oy: -8 }, e: X.sleep, aR: { a: 1.0, b: 1.3, z: 1 }, aL: { a: 1.2, b: .8, z: -1 } });
const SIT = (o = {}) => P_(D, { lean: .04, face: .55, hipY: hy(1440), ...LEGS, aL: { to: [64, -132], k: 1, z: 1 }, aR: { to: [96, -128], k: -1, z: 1 } }, o);
const EDGE = (o = {}) => P_(D, { lean: .06, face: .15, hipX: 40, hipY: hy(1466), legS: .64, lL: { x: 18, y: 0, r: 0 }, lR: { x: 82, y: 0, r: 0 }, aL: { a: -.25, b: .1 }, aR: { a: .3, b: -.1 } }, o);
const STAND = (o = {}) => P_(D, { face: .72, hipX: 60, lL: { x: 36 }, lR: { x: 84 } }, o);
const headOf = (p, x, s = 1) => { const J = solve(D, p); return [x + J.hc[0] * s, FY + J.hc[1] * s, J]; };
// camera that puts the head of pose p at screen (sx, sy) with zoom z
const camFor = (p, x, s, sx, sy, z) => { const [hx, hy_] = headOf(p, x, s); return { x: hx - (sx - 540) / z, y: hy_ - (sy - 960) / z, z }; };
const CU_Z = 3.5, CU_SX = 520, CU_SY = 800;               // the matched close-up framing (bathroom ↔ bed)
const add = (c, j) => ({ ...c, x: c.x + j[0], y: c.y + j[1], r: (c.r || 0) + j[2] });
const breath = (p, t, amt = 1, rate = .55) => ({ ...p, shrug: (p.shrug || 0) + Math.sin(t * TAU * rate) * .22 * amt });
const pant = (p, t, t0, t1, amt = 1) => { if (t < t0 || t > t1) return p; const k = amt * (1 - (t - t0) / (t1 - t0)) ** .7; return { ...p, shrug: (p.shrug || 0) + Math.sin((t - t0) * TAU * 2.6) * .45 * k, e: { ...p.e, mO: Math.max(p.e.mO || 0, .25 + .2 * Math.sin((t - t0) * TAU * 2.6) * k) } }; };

// getting out of bed: sit → throw the blanket → swing to the edge → stand; sp = speed
function outKeys(t0, sp, e, o = {}) {
  const sit = SIT({ e }), thr = SIT({ e, lean: .12, face: .45, aR: { a: 2.4, b: .3, z: 1, hand: 'open', to: null }, aL: { to: [40, -140], k: 1, z: 1 } });
  const edge = EDGE({ e, ...(o.edge || {}) }), stand = STAND({ e, ...(o.stand || {}) });
  return [[t0, sit], [t0 + .3 / sp, thr, 'o'], [t0 + .62 / sp, edge, 'io'], [t0 + .92 / sp, stand, 'io']];
}
const heapAt = (t, t0, sp) => kf(t, [[t0 + .05 / sp, 0], [t0 + .42 / sp, 1, 'o']]);
const legsAt = (t, t0, sp) => kf(t, [[t0 + .3 / sp, 1], [t0 + .6 / sp, 0]]);
// a walk with a base pose; returns { p, x }
function walking(t, w, base, o = {}) {
  const ph = (t - w.t0) * w.rate, wk = walk(ph, 1, { stride: w.st, lift: o.lift ?? (w.jog ? 26 : w.tiptoe ? 18 : 13), swing: o.swing ?? (w.jog ? .85 : .42), elb: o.elb ?? (w.jog ? 1.2 : .3), bob: w.jog ? 9 : 5, hipY: o.hipY || 0 });
  return { p: P_(D, base, wk), x: walkX(w, t) };
}
const blendTo = (a, b, k) => mixPose(D, a, b, EASE.io(clamp(k)));

// ============ BEDROOM shots ============
const BED_WIDE = { x: 470, y: 1250, z: 1.05 }, BED_MED = { x: 372, y: 1300, z: 1.6 };
// the bed scene with a getting-out move followed by a walk to the door
function bedOut(ctx, t, { c, keysBefore, t0, sp, e, w, walkBase, ss = null, extra = null }) {
  let p, x = BED.hipX, heap = 0, legsK = 1;
  if (t < t0) p = pk(D, t, keysBefore);
  else { const ok = outKeys(t0, sp, e); p = pk(D, t, ok); heap = heapAt(t, t0, sp); legsK = legsAt(t, t0, sp); if (t >= w.t0) { const wk = walking(t, w, walkBase); p = blendTo({ ...p, hipX: 0 }, wk.p, (t - w.t0) / .2); x = wk.x; p = { ...p, hipX: 0 }; } }
  if (x === BED.hipX && t >= t0) x = BED.hipX;
  p = idle(p, t, 1, .6);
  if (extra) p = extra(p, t);
  const inBed = heap < .5 && t < t0 + .5 / sp;
  SC.bedroom(ctx, t, { c, p, x, blanket: { from: 470, heap, legs: LB.map(([bx, bh, bw]) => [bx, bh * legsK, bw]) }, ss, inBed });
}

// S1 · 0–3.2: real sleep, then the dream begins without a seam
function s1(ctx, t) {
  const z = kf(t, [[0, 1.05], [3.2, 1.12, 'lin']]), c = { ...BED_WIDE, z };
  if (t < 1.1) {
    const p = idle({ ...LIE, shrug: Math.sin(t * TAU * .62) * .25 }, t, 0, .3, false);
    return SC.bedroom(ctx, t, { c, p, blanket: { from: 330, legs: LB }, ss: (t * 1 + 12) % 60, armsOver: false });
  }
  const before = [[1.1, LIE], [1.85, SIT({ e: X.drowsy, shrug: .1, head: { nod: .25 } })]];
  bedOut(ctx, t, { c, keysBefore: before, t0: 1.85, sp: .8, e: X.drowsy, w: WALKS.bed1, walkBase: { face: .85, e: X.drowsy, head: { nod: .3 }, lean: .05 }, ss: 12, extra: (p, tt) => tt < 1.85 ? { ...p } : p });
}

// ============ HALLWAY shots ============
const HALL_CAM = t => ({ x: 560, y: 1230, z: kf(t, [[0, 1.0], [3, 1.03, 'lin']]) });
function hall(ctx, t, w, base, { light = 1, mod = null, t0 } = {}) {
  let { p, x } = walking(t, w, base);
  if (mod) ({ p, x } = mod(p, x, t));
  p = idle(p, t, 2, .4);
  const c = HALL_CAM(t - t0); c.x += (x - 560) * .18;
  SC.hallway(ctx, t, { c, p, x, s: w.s, bathLight: light });
}
// a temporary arm reach: weight track over the walking pose
const reach = (p, side, to, wgt, extra = {}) => wgt <= 0 ? p : mixPose(D, p, { ...p, [side]: { to, k: side === 'aR' ? -1 : 1, z: 1, ...extra } }, wgt);
const handLocal = (wx, wy, x, s) => [(wx - x) / s, (wy - FY) / s];

function s2(ctx, t) {   // dream 1 hallway: sleepy shuffle, rubs an eye, flips the switch
  const w = WALKS.hall1;
  hall(ctx, t, w, { face: .85, lean: .06, e: E(X.drowsy), head: { nod: .32 } }, {
    t0: C.hall1, light: t < K.switch1 ? 0 : kf(t, [[K.switch1, .4], [K.switch1 + .05, 1], [K.switch1 + .09, .6], [K.switch1 + .14, 1]]),
    mod: (p, x, tt) => {
      const [, , J] = headOf(p, x, w.s); const eye = [J.hc[0] + 30 + Math.sin(tt * 26) * 6, J.hc[1] + 6 + Math.cos(tt * 26) * 4];
      p = reach(p, 'aR', eye, kf(tt, [[3.45, 0], [3.65, 1], [4.05, 1], [4.25, 0]]));
      if (tt > 3.6 && tt < 4.1) p = { ...p, e: { ...p.e, eyeOpen: .05, closeCurve: 1, mS: -.2 } };
      p = reach(p, 'aR', handLocal(S.HALL.sw[0] - 6, S.HALL.sw[1] + 2, x, w.s), kf(tt, [[4.45, 0], [4.66, 1], [4.8, 1], [4.98, 0]]), { hand: 'point' });
      return { p, x };
    },
  });
}
function s8(ctx, t) {   // dream 2 hallway: normal pace, a big stretch and yawn
  const w = WALKS.hall2;
  hall(ctx, t, w, { face: .85, e: E({ mS: .3, lidT: .25 }) }, {
    t0: C.hall2, mod: (p, x, tt) => {
      const k = kf(tt, [[15.35, 0], [15.7, 1], [16.3, 1], [16.7, 0]]);
      if (k > 0) { const [, , J] = headOf(p, x, w.s); p = mixPose(D, p, { ...p, aL: { to: [J.hc[0] - 50, J.hc[1] - 150], k: 1, z: -1, hand: 'open' }, aR: { to: [J.hc[0] + 60, J.hc[1] - 160], k: -1, z: 1, hand: 'open' }, shrug: 1, e: { ...X.yawn }, head: { ...p.head, tilt: -.08, nod: -.25 } }, k); }
      return { p, x };
    },
  });
}
function s15(ctx, t) {  // dream 3 hallway: almost jogging, knees together
  const w = WALKS.hall3;
  hall(ctx, t, w, { face: .9, lean: .14, e: E(X.worried, { sweat: .9, mTeeth: 1, mW: .7 }), head: { nod: .1 } }, { t0: C.hall3 });
}
function s25(ctx, t) {  // the final march; stops at the bathroom door and looks back
  const w = WALKS.hall4, base = { face: .85, e: E(X.determined, { sweat: 0 }), lean: .03 };
  let { p, x } = walking(t, w, base, { swing: .62 });
  if (t > w.t1) {
    const stop = STAND({ hipX: 0, face: .8, e: E(X.determined, { sweat: 0, mTeeth: 0, mS: -.1 }), lL: { x: -10 }, lR: { x: 26 } });
    const look = STAND({ hipX: 0, face: -.5, head: { turn: -.45, tilt: .05 }, e: E(X.suspicious, { gx: -.9 }), lL: { x: -10 }, lR: { x: 26 }, shrug: .5 });
    p = pk(D, t, [[w.t1, mixPose(D, p, stop, .5)], [w.t1 + .15, stop], [52.5, stop], [52.72, look, 'o']]);
  }
  p = idle(p, t, 2, .4);
  const c = HALL_CAM(t - C.hall4); c.x += (x - 560) * .18;
  SC.hallway(ctx, t, { c, p, x, s: w.s, bathLight: 1 });
}

// ============ BATHROOM shots ============
const BATH_CAM = t => ({ x: 600, y: 1255, z: kf(t, [[0, 1.15], [2, 1.2, 'lin']]) });
const TX = 680;                                            // where he stands at the toilet
const LIDL = S.BATH.toilet.back - S.BATH.toilet.front + 26;
function lidFront(lid) { const [hx, hy_] = S.BATH.toilet.hinge, a = lid * 1.62; return [hx + (-LIDL + 14) * Math.cos(a), hy_ - 8 + (-LIDL + 14) * Math.sin(a) - 6]; }
const lidAt = (t, tl, slow = 1) => kf(t, [[tl - .34 * slow, 0], [tl - .1 * slow, .55, 'io'], [tl, 1, 'i']]);
// walk in, stop, reach down, lift the lid, stand into position
function bathVisit(t, w, tl, base, { slow = 1, posE = null } = {}) {
  let { p, x } = walking(t, w, base);
  const stand = STAND({ hipX: 0, face: .72, ...base, lL: { x: -12 }, lR: { x: 22 } });
  if (t > w.t1) {
    x = walkX(w, w.t1);
    const lid = lidAt(t, tl, slow), hand = handLocal(...lidFront(Math.min(lid, .55)), x, 1);
    const bend = STAND({ hipX: 0, face: .78, lean: .42, shrug: .3, head: { nod: .45 }, e: { ...base.e, gy: .8 }, lL: { x: -12 }, lR: { x: 22 }, aR: { to: hand, k: -1, z: 1, hand: 'open' } });
    const pos = STAND({ hipX: 0, face: .72, ...base, e: posE || base.e, lL: { x: -12 }, lR: { x: 22 }, aR: { to: [44, -196], k: -1, z: 1 }, aL: { to: [30, -200], k: 1, z: -1 } });
    p = pk(D, t, [[w.t1, mixPose(D, p, stand, .5)], [w.t1 + .15, stand], [tl - .36 * slow, { ...bend, aR: { ...bend.aR, to: handLocal(...lidFront(0), x, 1) } }], [tl - .1 * slow, bend, 'io'], [tl + .25, pos, 'io']]);
    return { p, x, lid };
  }
  return { p, x, lid: 0 };
}
function bathWide(ctx, t, w, tl, base, o = {}) {
  let { p, x, lid } = bathVisit(t, w, tl, base, o);
  if (o.mod) p = o.mod(p, t);
  p = idle(p, t, 3, .4);
  SC.bathroom(ctx, t, { c: BATH_CAM(t - w.t0), p, x, lid, towel: o.towel ?? -1 });
}
// the matched bust close-up at the toilet
const POS = (e, o = {}) => STAND({ hipX: 0, face: .5, e, lL: { x: -12 }, lR: { x: 22 }, aR: { to: [44, -196], k: -1, z: 1 }, aL: { to: [30, -200], k: 1, z: -1 } }, o);
const BATH_CU = camFor(POS(X.neutral), TX, 1, CU_SX, CU_SY, CU_Z);
function bathCU(ctx, t, t0, keys, { push = .08, towel = -1, zMul = 1, extra = null } = {}) {
  let p = pk(D, t, keys); p = idle(p, t, 3, .5, true); if (extra) p = extra(p, t);
  const z = CU_Z * zMul * (1 + push * (t - t0) / 2.5);
  const c = { ...BATH_CU, z, x: BATH_CU.x, y: BATH_CU.y };
  // keep the head where the matched framing puts it while pushing in
  const [hx, hy_] = headOf(POS(X.neutral), TX); c.x = hx - (CU_SX - 540) / z; c.y = hy_ - (CU_SY - 960) / z;
  SC.bathroom(ctx, t, { c, p, x: TX, lid: 1, dof: 10, towel });
}

// ============ BED close-ups (the awakenings) ============
const BED_CU = camFor(SIT(), BED.hipX, 1, CU_SX, CU_SY, CU_Z);
function bedCU(ctx, t, p, { z = 1, j = [0, 0, 0], dof = 10, blanketFrom = 470, ss = 7, after = null } = {}) {
  const zz = CU_Z * z, [hx, hy_] = headOf(SIT(), BED.hipX);
  const c = add({ x: hx - (CU_SX - 540) / zz, y: hy_ - (CU_SY - 960) / zz, z: zz }, j);
  SC.bedroom(ctx, t, { c, p, blanket: { from: blanketFrom, legs: LB }, dof, ss, after });
}
// the snap upright: from 40% risen to an overshoot in ~4 frames
function wakeKeys(w, hard) {
  const rise = mixPose(D, LIE, SIT(), .38);
  const fling = SIT({ lean: .16 + hard * .06, shrug: 1.5, sq: -.1 - hard * .04, e: E(X.startle), aL: { a: -1.25 - hard * .2, b: -.5, hand: 'open', z: 1, to: null }, aR: { a: 1.35 + hard * .2, b: .45, hand: 'open', z: 1, to: null } });
  const hold = SIT({ lean: .05, shrug: 1.1, e: E(X.startle, { mO: .55 }), aL: { a: -.75, b: -.3, hand: 'open', z: 1, to: null }, aR: { a: .9, b: .4, hand: 'open', z: 1, to: null } });
  return [[w, { ...rise, e: E(X.startle) }], [w + .11 - hard * .02, fling, 'snap'], [w + .42, hold, 'io']];
}
const wakeZ = (t, w, hard) => kf(t, [[w, .9], [w + .09, 1.0 + hard * .05, 'snap'], [w + 1.5, 1.02 + hard * .05, 'lin']]);

function s5(ctx, t) {   // awakening 1
  const w = C.wake1, hold = SIT({ shrug: .9, e: E(X.startle, { mO: .4 }) });
  const down = SIT({ shrug: .7, head: { nod: .55 }, e: E(X.worried, { eyeOpen: 1.35, pup: .5, gy: .95, mO: .3, mW: .55, sweat: .6 }), aL: { to: [56, -134], k: 1, z: 1 }, aR: { to: [92, -134], k: -1, z: 1 } });
  let p = pk(D, t, [...wakeKeys(w, 0), [9.95, { ...hold, aL: { a: -.6, b: -.2, z: 1 }, aR: { a: .7, b: .3, z: 1 } }], [10.25, down, 'io']]);
  p = pant(p, t, w + .3, C.pov1, 1);
  bedCU(ctx, t, idle(p, t, 1, .2, false), { z: wakeZ(t, w, 0), j: jolt(t, w, 16, .3) });
}
function s11(ctx, t) {  // awakening 2: harder, then wild looking around
  const w = C.wake2;
  const look = (f, turn, gx) => SIT({ shrug: .9, face: f, head: { turn }, e: E(X.anxious, { gx, mWavy: 0, mO: .45, mW: .6 }) });
  let p = pk(D, t, [...wakeKeys(w, 1), [23.75, look(.55, 0, 0)], [23.9, look(-.3, -.3, -.9), 'o'], [24.15, look(-.3, -.3, -.9)], [24.3, look(.95, .25, .9), 'o'], [24.5, look(.95, .25, .9)], [24.62, look(-.2, -.25, -.8), 'o'], [24.8, look(.6, .1, .6), 'o']]);
  p = pant(p, t, w + .3, C.pov2, 1.2);
  bedCU(ctx, t, idle(p, t, 1, .2, false), { z: wakeZ(t, w, 1), j: jolt(t, w, 22, .35) });
}
function s13(ctx, t) {  // freezes, then slowly turns to the doorway: "what is happening?"
  const a = SIT({ shrug: .8, e: E(X.anxious, { mWavy: 0, mO: .2, gy: .6 }) });
  const b = SIT({ shrug: 1.0, face: .95, head: { turn: .2, tilt: .04 }, e: E(X.horror, { pale: .4, gloom: .2, mO: .45, mW: .5, gx: .95, gy: -.05, sweat: .7 }) });
  const p = pk(D, t, [[26.6, a], [26.95, a], [27.75, b, 'io']]);
  bedCU(ctx, t, idle(p, t, 1, .2), { z: kf(t, [[26.6, 1.0], [28.0, 1.12, 'lin']]) });
}
function s18(ctx, t) {  // awakening 3: the hardest
  const w = C.wake3; let p = pk(D, t, wakeKeys(w, 2)); p = pant(p, t, w + .3, C.ecu3 + .2, 1.4);
  bedCU(ctx, t, idle(p, t, 1, .2, false), { z: wakeZ(t, w, 2), j: jolt(t, w, 28, .4) });
}
function s19(ctx, t) {  // extreme close-up on the eyes: traumatised stare, heartbeat
  const p = SIT({ shrug: 1.1, e: E(X.hollow, { eyeOpen: 1.6, pup: .24, pale: .5, gloom: .3, sweat: .85, mO: .15 }), head: { ox: Math.sin(t * 43) * .5, oy: Math.sin(t * 37) * .4 } });
  const [hx, hy_, J] = headOf(SIT(), BED.hipX), z = kf(t, [[C.ecu3, 6.0], [C.pov3, 6.6, 'lin']]);
  const ex = hx + 14, ey = hy_ + 4;
  const beat = (t - 41.2) % .62, bump = beat < .08 ? (1 - beat / .08) * .012 : 0;
  SC.bedroom(ctx, t, { c: { x: ex, y: ey, z: z * (1 + bump) }, p, blanket: { from: 470, legs: LB }, dof: 14, ss: 7 });
}
// S21 · turns to the door, looks at his own fingers
function s21(ctx, t) {
  const base = SIT({ shrug: .7, e: E(X.worried, { eyeOpen: 1.2, gy: .2 }) });
  const sus = SIT({ shrug: .6, face: .95, head: { turn: .15 }, e: E(X.suspicious, { gx: .9 }) });
  const [, , J] = headOf(sus, BED.hipX);
  const look = SIT({ shrug: .5, face: .6, head: { nod: .15 }, e: E(X.suspicious, { lidT: .2, browA: .5, gx: .7, gy: .35 }), aR: { to: [J.hc[0] + 100, J.hc[1] + 70], k: -1, z: 1, hand: 'open' } });
  let p = pk(D, t, [[43.4, base], [43.55, base], [44.1, sus, 'io'], [44.25, sus], [44.5, look, 'o'], [44.85, look]]);
  if (t > 44.5) p = { ...p, aR: { ...p.aR, thumb: Math.sin(t * 30) } };
  const z = kf(t, [[43.4, .66], [45.0, .72, 'lin']]);
  bedCU(ctx, t, idle(p, t, 1, .4), { z });
}
// S22 · three cheek taps (L, R, L), rapid blinks, head shake
function s22(ctx, t) {
  const base = SIT({ face: .3, shrug: .6, e: E(X.determined, { mTeeth: 0, mS: -.2, sweat: .5, browA: .3 }) });
  const [, , J] = headOf(base, BED.hipX), R = D.R;
  const cheekL = [J.hc[0] - R * 1.02, J.hc[1] + R * .42], cheekR = [J.hc[0] + R * 1.08, J.hc[1] + R * .4];
  const readyL = [cheekL[0] - 40, cheekL[1] + 95], readyR = [cheekR[0] + 40, cheekR[1] + 95];
  const arm = (side, to, hand = 'open') => ({ [side]: { to, k: side === 'aR' ? 1 : -1, z: 1, hand } });
  const ready = P_(D, base, arm('aL', readyL), arm('aR', readyR));
  const tapL = P_(D, base, arm('aL', cheekL), arm('aR', readyR), { head: { turn: .12, tilt: .05 }, e: { ...base.e, eyeOpen: .05, closeCurve: 1, mS: -.4 } });
  const tapR = P_(D, base, arm('aL', readyL), arm('aR', cheekR), { head: { turn: -.12, tilt: -.05 }, e: { ...base.e, eyeOpen: .05, closeCurve: 1, mS: -.4 } });
  const [t1, t2, t3] = K.taps, sh = K.shake;
  let p = pk(D, t, [[C.taps - .01, base], [t1 - .16, ready, 'o'], [t1, tapL, 'i'], [t1 + .16, ready, 'o'], [t2 - .12, ready], [t2, tapR, 'i'], [t2 + .16, ready, 'o'], [t3 - .12, ready], [t3, tapL, 'i'], [t3 + .18, ready, 'o'], [sh - .05, base, 'io']]);
  // rapid blinks after the taps
  for (const tb of [t3 + .25, t3 + .38]) if (t > tb && t < tb + .07) p = { ...p, e: { ...p.e, eyeOpen: .05 } };
  // head shake
  if (t > sh && t < sh + .7) { const u = t - sh, k = Math.pow(1 - u / .7, 1.3); p = { ...p, head: { ...p.head, turn: Math.sin(u * TAU * 5.5) * .5 * k }, e: { ...p.e, gx: -Math.sin(u * TAU * 5.5) * .6 * k, eyeOpen: .05, closeCurve: 1, mTeeth: 1, mW: .7 } }; }
  const z = kf(t, [[C.taps, 1.02], [C.check3, 1.16, 'lin']]);
  bedCU(ctx, t, idle(p, t, 1, .2, false), { z });
}
// S23 · pinch, look around, confidence, two nods
function s23(ctx, t) {
  const base = SIT({ face: .45, shrug: .4, e: E(X.worried, { eyeOpen: 1.1, sweat: .4 }) });
  const [, , J0] = headOf(base, BED.hipX), sJ = solve(D, base);
  const elbowL = sJ.A.el;
  const pinch = P_(D, base, { aR: { to: [elbowL[0] + 10, elbowL[1] + 12], k: -1, z: 1 }, aL: { a: .4, b: -.9, to: null, z: 1 }, e: E(X.wince) });
  const lookL = P_(D, base, { face: -.2, head: { turn: -.3 }, e: E(X.suspicious, { gx: -.9 }) }), lookR = P_(D, base, { face: .95, head: { turn: .2 }, e: E(X.suspicious, { gx: .9 }) });
  const conf = P_(D, base, { face: .5, shrug: -.1, e: E(X.confident), head: { tilt: -.03 } });
  const nod = P_(D, conf, { head: { nod: .45, tilt: -.03 } });
  let p = pk(D, t, [[C.check3, base], [47.45, pinch, 'o'], [47.7, pinch], [47.85, base, 'io'], [48.0, lookL, 'o'], [48.12, lookL], [48.25, lookR, 'o'], [48.35, lookR], [48.55, conf, 'io'], [48.62, nod, 'o'], [48.72, conf], [48.84, nod, 'o'], [48.96, conf]]);
  bedCU(ctx, t, idle(p, t, 1, .3), { z: kf(t, [[C.check3, .7], [C.out4, .74, 'lin']]) });
}

// ============ the dry check: he lifts the blanket like a tent and peeks under it ============
const PEEK_C = { x: 560, y: 1290, z: 2.15 };
function peek(ctx, t, t0, { pats = [], quick = false, e = X.worried } = {}) {
  const u = t - t0, lift = kf(u, quick ? [[0, 0], [.2, 1, 'o']] : [[0, 0], [.42, 1, 'io']]);
  const lx = 600, hx0 = lx - 90, hx1 = lx + 80, hemY = x => BED.hem + 18 - lift * 170 * Math.exp(-(((x - lx) / 150) ** 2));
  const L = (wx, wy) => handLocal(wx, wy, BED.hipX, 1);
  let aR = { to: L(hx1, hemY(hx1) + 6), k: -1, z: 1 };
  for (const tp of pats) { const k = kf(t, [[tp - .2, 0], [tp - .08, 1, 'o'], [tp + .08, 1], [tp + .2, 0]]); if (k > 0) { const dip = Math.max(0, Math.sin(clamp((t - tp + .08) / .16) * Math.PI)); aR = mixPose(D, { ...SIT(), aR }, { ...SIT(), aR: { to: L(lerp(hx1, 470, k), lerp(hemY(hx1) + 6, BED.top - 10 + dip * 12 - (1 - dip) * 40, k)), k: -1, z: 1, hand: 'open' } }, 1).aR; } }
  const p = idle(SIT({ lean: .3, face: .7, shrug: .6, head: { nod: .6 }, e: E(e, { gy: .95, gx: .5 }), aL: { to: L(hx0, hemY(hx0) + 6), k: 1, z: 1 }, aR }), t, 1, .3, false);
  const c = { ...PEEK_C, z: PEEK_C.z * (1 + u * .025) };
  SC.bedroom(ctx, t, { c, p, blanket: { from: 470, legs: LB, lift, liftX: lx }, ss: 7, armsOver: true });
  // the pats leave a small dent in the dry sheet
  for (const tp of pats) { const d = t - tp; if (d > 0 && d < .35) cam(ctx, c, () => { ctx.strokeStyle = rgba('#8A7B62', .6 * (1 - d / .35)); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(470, BED.top + 4, 30 + d * 120, 5 + d * 18, 0, 0, TAU); ctx.stroke(); }); }
}
// ============ the bed medium shots ============
// S7 · relief, wipes his brow, smiles, gets up
function s7(ctx, t) {
  const sit0 = SIT({ shrug: .9, e: E(X.worried, { eyeOpen: 1.3, gy: .3 }) });
  const exh = SIT({ shrug: -.4, head: { nod: .15 }, e: E(X.relieved, { sweat: .5 }) });
  const [, , J] = headOf(exh, BED.hipX), R = D.R;
  const wipeA = SIT({ shrug: -.2, e: E(X.relieved, { sweat: .4 }), aR: { to: [J.hc[0] - R * .5, J.hc[1] - R * .55], k: -1, z: 1 } });
  const wipeB = SIT({ shrug: -.2, e: E(X.relieved, { sweat: 0 }), aR: { to: [J.hc[0] + R * .7, J.hc[1] - R * .45], k: -1, z: 1 } });
  const smile = SIT({ shrug: 0, e: E(X.happy, { mO: .15 }) });
  const before = [[C.relief1, sit0], [12.0, sit0], [12.45, exh, 'io'], [12.6, wipeA, 'o'], [13.05, wipeB, 'io'], [13.3, smile, 'io']];
  bedOut(ctx, t, { c: { ...BED_MED, z: kf(t, [[C.relief1, 1.6], [15, 1.66, 'lin']]) }, keysBefore: before, t0: 13.6, sp: 1, e: E(X.happy, { mO: 0 }), w: WALKS.bed2, walkBase: { face: .85, e: E({ mS: .4 }) }, ss: 7 });
}
// S14 · lies back, pulls the blanket up, turns on his side, squirms, gives up and goes again (fast)
function s14(ctx, t) {
  const c = { ...BED_MED, z: kf(t, [[C.lie2, 1.6], [32.3, 1.8, 'lin'], [33.6, 1.74]]) };
  const exh = SIT({ shrug: -.3, e: E(X.exhausted, { mO: .3 }) });
  const back = { ...LIE, e: E(X.exhausted, { lidT: .45, mO: .2, gy: -.5 }) };
  const [, , J] = headOf(LIE, BED.hipX);
  const pull = { ...back, aR: { to: [J.hc[0] + 120, J.hc[1] + 20], k: -1, z: 1 }, aL: { to: [J.hc[0] + 110, J.hc[1] + 30], k: 1, z: 1 } };
  const side = { ...SIDE, e: E(X.sleep) };
  const strainS = { ...SIDE, e: E(X.strained), hipX: -6 }, strainB = { ...LIE, e: E(X.strained, { mTeeth: 0, mWavy: 1 }) };
  const up = SIT({ shrug: .6, e: E(X.worried, { eyeOpen: 1.1, sweat: .9, mTeeth: 1 }) });
  const [, , Ju] = headOf(up, BED.hipX);
  const rub = SIT({ shrug: .5, e: E(X.strained, { mTeeth: 0, mS: -.3 }), aL: { to: [Ju.hc[0] - 10, Ju.hc[1] + 8], k: 1, z: 1 }, aR: { to: [Ju.hc[0] + 44, Ju.hc[1] + 8], k: -1, z: 1 } });
  const before = [[C.lie2, exh], [28.05, exh], [28.7, back, 'io'], [28.9, back], [29.15, pull, 'io'], [29.35, back, 'io'], [29.45, back], [29.95, side, 'io'], [30.25, side], [30.5, strainS, 'io'], [30.95, strainS], [31.15, strainB, 'io'], [31.55, strainB], [31.75, strainS, 'io'], [32.25, strainS], [32.42, up, 'snap'], [32.55, rub, 'io'], [32.8, { ...rub, aL: { ...rub.aL, to: [Ju.hc[0] - 4, Ju.hc[1] + 2] } }], [32.88, up]];
  const from = kf(t, [[29.0, 470], [29.35, 330, 'io'], [32.3, 330], [32.45, 470, 'io']]);
  // legs crossing under the blanket while he squirms
  const sq = clamp((t - 30.4) / .3) * (1 - clamp((t - 32.3) / .2));
  const legs = [[600 + Math.sin(t * 9) * 20 * sq, 26 + 10 * sq, 110], [690 - 40 * sq + Math.sin(t * 9 + 1) * 16 * sq, 22 + 12 * sq * Math.abs(Math.sin(t * 5)), 72]];
  let p, x = BED.hipX, heap = 0, legsK = 1; const t0 = 32.88, sp = 1.8, w = WALKS.bed3;
  if (t < t0) p = pk(D, t, before);
  else { p = pk(D, t, outKeys(t0, sp, E(X.worried, { sweat: .9, mTeeth: 1, mW: .7 }))); heap = heapAt(t, t0, sp); legsK = legsAt(t, t0, sp); if (t >= w.t0) { const wk = walking(t, w, { face: .9, lean: .12, e: E(X.worried, { sweat: .9, mTeeth: 1, mW: .7 }) }); p = blendTo({ ...p, hipX: 0 }, wk.p, (t - w.t0) / .15); x = wk.x; p = { ...p, hipX: 0 }; } }
  p = idle(p, t, 1, .4, t > 32.4);
  if (t > 30.3 && t < 32.3) { const k = Math.sin(clamp((t - 30.3) / 2) * Math.PI); p = { ...p, hipX: (p.hipX || 0) + Math.sin(t * 9) * 9 * k, lean: p.lean + Math.sin(t * 6) * .05 * k, head: { ...p.head, tilt: p.head.tilt + Math.sin(t * 6 + 1) * .08 * k } }; }
  SC.bedroom(ctx, t, { c, p, x, blanket: { from, heap, legs: legs.map(([a, b, cc]) => [a, b * legsK, cc]) }, ss: 7, inBed: heap < .5 && t < t0 + .3 });
}
// S24 · determined: throws the blanket off and goes
function s24(ctx, t) {
  const conf = SIT({ face: .55, shrug: .2, e: E(X.confident) });
  bedOut(ctx, t, { c: { ...BED_MED, z: kf(t, [[C.out4, 1.68], [C.hall4, 1.6, 'lin']]) }, keysBefore: [[C.out4, conf]], t0: C.out4, sp: 1.4, e: E(X.determined, { sweat: 0 }), w: WALKS.bed4, walkBase: { face: .85, e: E(X.determined, { sweat: 0 }) }, ss: 7 });
}

// ============ bathroom shots ============
function s3(ctx, t) { bathWide(ctx, t, WALKS.bath1, K.lid1, { face: .8, lean: .05, e: E(X.drowsy), head: { nod: .25 } }, { towel: -1 }); }
function s9(ctx, t) { bathWide(ctx, t, WALKS.bath2, K.lid2, { face: .8, e: E({ mS: .35, lidT: .2 }) }, { towel: 1 }); }
function s16(ctx, t) { bathWide(ctx, t, WALKS.bath3, K.lid3, { face: .85, lean: .1, e: E(X.worried, { sweat: .9, mTeeth: 1, mW: .7 }) }, { towel: -1 }); }
function s27(ctx, t) {  // the final entry: tiptoe, looks at the toilet, the mirror, around
  const w = WALKS.bath4, base = { face: .8, lean: .06, e: E(X.suspicious, { gx: .6 }), hipY: -6 };
  let { p, x } = walking(t, w, base, { hipY: -8 });
  if (t > w.t1) {
    x = walkX(w, w.t1);
    const st = (o, e) => STAND({ hipX: 0, lL: { x: -12 }, lR: { x: 22 }, ...o, e: E(X.suspicious, e) });
    const toilet = st({ face: .85, head: { nod: .35 } }, { gx: .7, gy: .7 }), mirror = st({ face: -.55, head: { turn: -.3, nod: -.05 } }, { gx: -.9, gy: -.2 }), around = st({ face: .15, head: { turn: 0, nod: -.25 } }, { gx: .2, gy: -.8, lidT: .1 });
    p = pk(D, t, [[w.t1, mixPose(D, p, toilet, .5)], [54.95, toilet, 'io'], [55.12, mirror, 'o'], [55.3, mirror], [55.42, around, 'o'], [55.6, around]]);
  }
  p = idle(p, t, 3, .4);
  SC.bathroom(ctx, t, { c: BATH_CAM(t - w.t0), p, x, lid: 0, towel: 1 });
}
function s28(ctx, t) {  // insert: his hand lifts the lid, slowly. CLICK
  const tl = K.lid4, lid = lidAt(t, tl, 1.9), x = 676;
  const hand = handLocal(...lidFront(Math.min(lid, .6)), x, 1);
  const p = idle(STAND({ hipX: 0, face: .8, lean: .5, shrug: .4, head: { nod: .5 }, e: E(X.suspicious, { gy: .8 }), lL: { x: -12 }, lR: { x: 22 }, aR: { to: hand, k: -1, z: 1, hand: 'open' } }), t, 3, .2);
  const z = kf(t, [[C.lid4, 2.5], [C.wait4, 2.7, 'lin']]);
  SC.bathroom(ctx, t, { c: { x: 830, y: 1360, z }, p, x, lid, towel: 1, toiletFront: true });
}
// S30 · from behind, waist up, a blurred sink in the foreground hides everything below
function s30(ctx, t) {
  const pre = STAND({ hipX: 0, face: 0, head: { back: 1, nod: 0 }, shrug: .7, aL: { to: [-14, -206], k: 1, z: -1 }, aR: { to: [16, -206], k: -1, z: -1 } });
  const relax = STAND({ hipX: 0, face: 0, head: { back: 1, nod: -.3, tilt: .06 }, shrug: -.7, lean: -.05, aL: { to: [-14, -204], k: 1, z: -1 }, aR: { to: [16, -204], k: -1, z: -1 } });
  const p = idle(pk(D, t, [[C.back4, pre], [58.55, pre], [59.4, relax, 'io']]), t, 3, .3, false);
  const z = kf(t, [[C.back4, 2.2], [C.bliss4, 2.42, 'lin']]), c = { x: 580, y: 1150, z };
  SC.bathroom(ctx, t, {
    c, p, x: 580, noToilet: true, towel: 1, dof: 3,
    mirror: g => { // the toilet tank straight ahead, seen from the front
      fillRR(g, 470, 1196, 220, 190, 16, S.N.porcelain); fillRR(g, 456, 1182, 248, 22, 8, '#FFFDF6'); fillRR(g, 640, 1214, 30, 10, 4, '#B9B4C4'); g.lineWidth = 3.5; g.strokeStyle = rgba(P.ink, .45); rr(g, 470, 1196, 220, 190, 16); g.stroke();
    },
    after: cx => layerSoft(cx, 'fgSink', g => cam(g, c, () => {
      g.beginPath(); g.moveTo(150, 1352); g.lineTo(1010, 1362); g.quadraticCurveTo(990, 1700, 600, 1720); g.quadraticCurveTo(190, 1700, 150, 1352); g.fillStyle = lg(g, 0, 1350, 0, 1700, ['#FFFDF6', S.N.porcelainLo]); g.fill();
      fillRR(g, 130, 1334, 900, 38, 16, '#FFFDF6'); fillRR(g, 300, 1268, 64, 76, 10, '#7FB3AE'); line(g, 322, 1270, 296, 1186, '#E98773', 12); line(g, 860, 1334, 860, 1270, '#B9B4C4', 14); line(g, 860, 1270, 820, 1270, '#B9B4C4', 12);
    }), 12),
  });
}

// ============ the real bed: still asleep, wet ============
function s32(ctx, t) {
  if (t >= C.black) return;
  const p = idle({ ...LIE, e: E(X.sleepSmile), shrug: Math.sin((t - C.real) * TAU * .6) * .22 }, t, 0, .25, false);
  const pull = kf(t, [[64.15, 0], [67.9, 1, 'io']]);
  const c = { x: lerp(330, 470, pull), y: lerp(1215, 1250, pull), z: lerp(1.75, 1.05, pull) };
  const wet = kf(t, [[C.real, .62], [64.6, 1, 'o']]);
  SC.bedroom(ctx, t, { c, p, blanket: { from: 330, legs: LB, wet, wetX: 480 }, ss: (t - C.real + 19) % 60, sheetWet: wet * .9, armsOver: false });
}

// ============ dispatcher ============
const SHOTS = [
  [C.bed1, s1], [C.hall1, s2], [C.bath1, s3],
  [C.cu1, (ctx, t) => bathCU(ctx, t, C.cu1, [[C.cu1, POS(E(X.drowsy))], [7.9, POS(E(X.drowsy))], [8.3, POS(E(X.relieved, { sweat: 0, mS: .5 })), 'io'], [8.6, POS(E(X.relieved, { sweat: 0, mS: .55 }), { shrug: .7 }), 'io']], { towel: -1 })],
  [C.wake1, s5], [C.pov1, (ctx, t) => peek(ctx, t, C.pov1, { e: E(X.worried, { eyeOpen: 1.3, sweat: .6 }) })], [C.relief1, s7],
  [C.hall2, s8], [C.bath2, s9],
  [C.cu2, (ctx, t) => bathCU(ctx, t, C.cu2, [[C.cu2, POS(E({ mS: .35 }))], [20.65, POS(E({ mS: .35, gy: .9 }), { head: { nod: .35 } }), 'io'], [21.1, POS(E({ mS: .35, gy: .9 }), { head: { nod: .35 } })], [21.4, POS(E({ mS: .5, lidT: .3 }), { shrug: -.3 }), 'io'], [22.3, POS(E(X.relieved, { sweat: 0, mS: .7 }), { shrug: -.4 }), 'io'], [22.7, POS(E(X.relieved, { sweat: 0, mS: .8 }), { shrug: .6 }), 'io']], { towel: 1 })],
  [C.wake2, s11], [C.pov2, (ctx, t) => peek(ctx, t, C.pov2, { pats: [25.5, 25.85], e: E(X.anxious, { mWavy: 1 }) })], [C.freeze2, s13], [C.lie2, s14],
  [C.hall3, s15], [C.bath3, s16],
  [C.cu3, (ctx, t) => bathCU(ctx, t, C.cu3, [[C.cu3, POS(E(X.worried, { sweat: .9, mTeeth: 1, mW: .7 }))], [38.0, POS(E(X.worried, { sweat: .9, mTeeth: 1, mW: .7 }))], [38.5, POS(E(X.hopeful, { sweat: .6, mS: .6 }), { shrug: -.2 }), 'io'], [39.1, POS(E(X.relieved, { sweat: .4, mS: .8 }), { shrug: .6 }), 'io']], { push: .12, towel: -1 })],
  [C.wake3, s18], [C.ecu3, s19], [C.pov3, (ctx, t) => peek(ctx, t, C.pov3, { quick: true, e: E(X.hollow, { pale: .4, eyeOpen: 1.3 }) })], [C.turn3, s21], [C.taps, s22], [C.check3, s23],
  [C.out4, s24], [C.hall4, s25], [C.pov4, (ctx, t) => SC.hallPOV(ctx, t, { c: { x: 540, y: 960, z: kf(t, [[C.pov4, 1], [C.bath4, 1.06, 'lin']]) }, fg: g => layerSoft(g, 'ots', gg => SC.ch(gg, idle(STAND({ hipX: 0, face: 0, head: { back: 1, turn: 0, tilt: -.06 }, shrug: .5, e: E(X.suspicious) }), t, 2, .3), 880 + Math.sin(t * .8) * 6, 2700, 3.0, SC.L_HALL_ON, { noShadow: true, tint: ['#1A1730', .35] }), 9) })], [C.bath4, s27], [C.lid4, s28],
  [C.wait4, (ctx, t) => bathCU(ctx, t, C.wait4, [[C.wait4, POS(E(X.suspicious, { gx: -.8 }))], [56.85, POS(E(X.suspicious, { gx: -.8 }))], [56.95, POS(E(X.suspicious, { gx: .85 })), 'o'], [57.1, POS(E(X.suspicious, { gx: .85 }))], [57.2, POS(E(X.suspicious, { gx: 0, gy: -.3 })), 'o'], [57.33, POS(E(X.hopeful, { eyeOpen: 1.2 }), { shrug: .3 }), 'o'], [57.5, POS(E(X.delighted, { sweat: 0 }), { shrug: .5 }), 'back']], { push: .02, towel: 1 })],
  [C.back4, s30],
  [C.bliss4, (ctx, t) => bathCU(ctx, t, C.bliss4, [[C.bliss4, POS(E(X.bliss, { mO: .05 }), { shrug: .1 })], [60.5, POS(E(X.bliss, { mO: .32, mW: .7 }), { shrug: -.2, head: { nod: -.12 } }), 'io'], [62.3, POS(E(X.bliss, { mO: .26, mW: .75 }), { shrug: -.75, head: { nod: -.22, tilt: .05 } }), 'lin']], { push: .16, towel: 1 })],
  [C.real, s32], [C.black, () => {}],
];
export function renderFilm(ctx, t) {
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  SHOTS[i][1](ctx, t);
}
