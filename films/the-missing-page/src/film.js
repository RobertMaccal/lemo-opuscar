// THE MISSING PAGE — sequences 1–4 (the hall, the exam, the victory walk, the second candidate) and the dispatcher.
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, wash } from './kit.js';
import { pose } from './rig.js';
import { X, EXAM, CAND, SECOND, EXTRAS } from './cast.js';
import { W, H, cam, layer, layerSoft, finish, mkL } from './shots.js';
import { TL, M, kf, pk, idle, talk, voice, lineT, walk, captions, EASE } from './anim.js';
import { view, paint } from './space.js';
import { HALL, COLS, ROWS, SEAT_DZ, DOOR, EDESK, hallArch, hallShafts, seatItems, examDeskItems, seatPose } from './hall.js';
import { insertSheet, insertClock, insertRegister, insertShake } from './inserts.js';
import { seq5, seq6, hallway } from './film2.js';

// ---------- lights per camera direction ----------
const LB = mkL(.8, .5, { shadow: { kx: .75, ky: .1, a: .26, blur: 6, col: P.plum } });            // looking toward the front: sun from screen left
const LF = mkL(-.8, .5, { shadow: { kx: -.75, ky: .1, a: .26, blur: 6, col: P.plum } });          // looking toward the back: sun from screen right
const LW = mkL(.05, .99, { rim: '#FFF1C6', rimW: 8, rimA: 1, shadeA: .34, shadeW: 22, shadow: { kx: .05, ky: .3, a: .22, blur: 5, col: P.plum } }); // facing the windows: backlit
const LE = mkL(.06, .9, { rimA: .5, shadeA: .16, shadow: { kx: .08, ky: .22, a: .2, blur: 6, col: P.plum } });   // windows behind camera

// ---------- who sits where ----------
const [X1, X2, X3, X4, X5, X6, X7] = EXTRAS;
export const SEATS = [
  { ch: X1, c: 0, r: 0 }, { ch: X2, c: 1, r: 0 }, { ch: SECOND, c: 2, r: 0 },
  { ch: X3, c: 0, r: 1 }, { ch: X4, c: 1, r: 1 }, { ch: CAND, c: 2, r: 1 },
  { ch: X5, c: 0, r: 2 }, { ch: X6, c: 1, r: 2 }, { ch: X7, c: 2, r: 2 },
].map((s, i) => ({ ...s, i, X: COLS[s.c], Zd: ROWS[s.r], Zc: ROWS[s.r] + SEAT_DZ }));
const CS = SEATS[5], SS = SEATS[2];
const after = (tt, a) => tt >= a;
// sheet on each desk at time t
function paperOf(s, t) {
  const m = M;
  if (s.ch === CAND) { if (t < m.place + .05) return null; if (t < m.begin) return { paper: 'front' }; if (t < m.s3 + .5) return { paper: 'filled' }; return null; }
  const placed = s.i === 1 ? m.walk + 1.6 : s.i === 4 ? m.walk + 2.7 : m.insert;
  if (t < placed) return null;
  if (s.ch === SECOND && t > m.sec2 + .3) return null;
  if (t < m.begin) return { paper: 'front' };
  // during the exam everyone else works both sides: they turn the sheet over at their own moment
  const ft = m.ots + 1.4 + (s.i % 4) * 1.6;
  if (t < ft) return { paper: 'filled' };
  if (t < ft + .45) return { paper: 'filled', flip: (t - ft) / .45 };
  return { paper: 'backFilled' };
}

// ---------- reusable poses ----------
const sp = seatPose;
function fidget(ch, i, t, front) {             // waiting before the exam: nervous life
  const ph = t * 1.3 + i * 2.1, tap = Math.sin(ph * 5) > .6;
  if (ch === CAND) return lounge(front, t);
  if (!front) return sp(ch, { head: { back: 1, tilt: Math.sin(ph) * .04 }, shrug: .3 + Math.sin(ph * .7) * .1, aL: { to: [-46, -220], k: 1, z: -1 }, aR: { to: [46, -222], k: -1, z: -1 } });
  return sp(ch, { head: { nod: .15 + Math.sin(ph * .6) * .08, tilt: Math.sin(ph * .8) * .05 }, shrug: .35, e: { ...ch.face, gx: Math.sin(ph * .5) * .5, gy: .1 }, aL: { to: [-38, -186], k: 1 }, aR: { to: [34, -186 - (tap ? 4 : 0)], k: -1 } });
}
function writing(ch, i, t, front, o = {}) {
  const w = Math.sin(t * 7.5 + i * 2.1), pause = Math.sin(t * .8 + i) < -.55;
  if (!front) return sp(ch, { head: { back: 1, nod: .3, tilt: (i % 3 - 1) * .04 }, shrug: .45 + (pause ? 0 : w * .03), aL: { to: [-44, -214], k: 1, z: -1 }, aR: { to: [38 + w * 3, -214], k: -1, z: -1 } });
  return sp(ch, { head: { nod: .85, tilt: (i % 3 - 1) * .05 + Math.sin(t * .6 + i) * .015, oy: 6 }, e: { ...(o.e || ch.face), gy: .9, lidT: .42, eyeOpen: (t * .31 + i * .37) % 1 < .03 ? .05 : 1 },
    aL: { to: [-52, -178], k: 1 }, aR: { to: [22 + (pause ? 0 : w * 6), -180 + Math.abs(w) * 2], k: -1, prop: { n: 'pen', r: -.6 + w * .06, dy: -14 } } });
}
// the Candidate, the most relaxed man in the room: leaning back, hands behind his head
function lounge(front, t) {
  const sw = Math.sin(t * .9) * .03;
  if (!front) return sp(CAND, { head: { back: 1, tilt: .12 + sw }, lean: -.16, hipX: 8, shrug: .5, aL: { to: [-58, -430], k: -1, z: 1 }, aR: { to: [62, -428], k: 1, z: 1 } });
  return sp(CAND, { lean: -.16, hipX: 8, shrug: .5, head: { tilt: .1 + sw, nod: -.12 }, e: { ...X.smug, gx: -.2 }, aL: { to: [-58, -430], k: -1, z: -1 }, aR: { to: [62, -428], k: 1, z: -1 } });
}
const lookAt = (p, gx, turn = 0) => ({ ...p, head: { ...p.head, turn, nod: Math.min(p.head.nod || 0, .2) }, e: { ...p.e, gx, gy: 0, lidT: 0 } });

// ---------- the hall: build the paint list for one camera ----------
function hallScene(g, V, t, o = {}) {
  const front = Math.cos(V.yaw) > 0, L = o.L || (front ? LF : LB), items = [];
  hallArch(g, V, t, { sun: o.sun || 0, hh: o.hh ?? 8, mm: o.mm ?? 59, ss: o.ss ?? null, door: o.door || 0, mood: o.mood || 0 });
  for (const s of SEATS) {
    if (o.skip && o.skip.includes(s.i)) continue;
    if (o.minDepth && V.depth(s.X, s.Zc) < o.minDepth) continue;
    const p = (o.seat && o.seat(s, front)) || fidget(s.ch, s.i, t, front);
    if (!p) continue;
    const pa = paperOf(s, t) || {};
    items.push(...seatItems(V, g, s.X, s.Zd, s.ch, idle(talk(p, s.ch.name, t), t, s.i), L, { tint: [P.plum, .04], noShadow: true }, { ...pa, lowBack: !front }));
  }
  items.push(...examDeskItems(V, g, o.desk || {}));
  if (o.extra) items.push(...o.extra(L));
  paint(items);
  if (o.shafts !== false) hallShafts(g, V, { sun: o.sun || 0, a: o.shaftA ?? .09, mood: o.mood || 0 });
}

// ---------- the examiner's path and poses ----------
const stackArm = { to: [-34, -318], k: 1, z: 1, prop: { n: 'stack', r: .08, w: 92, n: 9, dy: -6 } };
function exWalkFront(ph, o = {}) {      // walking toward the camera
  const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
  return { hipY: 2 - Math.abs(s) * 6, hipX: s * 3, lL: { x: -24 + s * 6, y: -Math.max(0, c) * 16, r: 0 }, lR: { x: 24 + s * 6, y: -Math.max(0, -c) * 16, r: 0 }, shrug: o.shrug ?? 0, head: { tilt: s * .02 } };
}

// ================= 1. THE EXAMINER ENTERS =================
function seq1(ctx, t) {
  const m = M;
  if (t < m.door + .4) {                                              // 1–2. the wide: silent hall, then the door bangs
    const door = kf(t, [[m.door, 0], [m.door + .2, 1, 'o']]), z = kf(t, [[0, 1], [m.door + .4, 1.04, 'lin']]);
    const V = view({ x: 120, y: 640, z: 3480, yaw: Math.PI, f: 760 * z, cy: 930 });
    hallScene(ctx, V, t, { door, desk: { stack: 0 }, extra: L => door > .3 ? [{ d: V.depth(-890, -40), fn: () => V.ch(ctx, EXAM, pose(EXAM, { e: X.stern, aL: stackArm }), -890, -30, LB, { tint: [P.night, .35] }) }] : [] });
    dust(ctx, t, 0, 300, 1080, 1300, 50, 3); finish(ctx, { vig: .5, bl: .22 });
    return;
  }
  if (t < m.walk) {                                                   // 2. low angle: the examiner strides in
    const u = t - (m.door + .4), stop = m.door + 2.0;
    const go = kf(t, [[m.door + .4, 0], [stop, 1, 'o']]), zx = lerp(60, 640, go), xx = lerp(-890, -720, go);
    const V = view({ x: kf(t, [[m.door + .4, -860], [m.walk, -800]]), y: 110, z: 1080, yaw: Math.PI, f: 760, cy: 1420 });
    const ph = (t - m.door) * 1.9, walking = t < stop;
    let p = pose(EXAM, { e: { ...X.stern, gx: kf(t, [[stop, 0], [stop + .3, .5]]) }, aL: stackArm, aR: { a: .12, b: -.15 }, head: { turn: kf(t, [[stop, 0], [stop + .4, .25]]) } }, walking ? exWalkFront(ph) : {});
    if (voice('EXAMINER', t) >= 0) p = pose(EXAM, p, { aR: { a: -.45, b: -1.1, hand: 'open', z: 1 } });
    p = talk(idle(p, t, 2, .5), 'EXAMINER', t);
    hallScene(ctx, V, t, { minDepth: 300, door: kf(t, [[m.door + .4, 1], [m.door + 1.4, .55]]), desk: { stack: 0 }, extra: L => [{ d: V.depth(xx, zx), fn: () => V.ch(ctx, EXAM, p, xx, zx, LB) }] });
    finish(ctx, { vig: .55, bl: .22 }); return;
  }
  if (t < m.insert) { shotDistribute(ctx, t); return; }
  if (t < m.react) { insertSheet(ctx, t - m.insert, m.react - m.insert); finish(ctx, { vig: .42, bl: .18 }); captions(ctx, t, 1640); return; }
  if (t < m.eighty) { shotReactions(ctx, t); return; }
  if (t < m.place) { shotExaminer(ctx, t); return; }
  if (t < m.brow) { shotCandSalute(ctx, t); return; }
  shotBrow(ctx, t);
}
// 3. tracking alongside the examiner as he walks the aisle and lays the sheets (camera on the window side, front-lit)
function shotDistribute(ctx, t) {
  const m = M, u = t - m.walk, d = m.insert - m.walk;
  const ez = kf(u, [[0, 900], [d, 1900, 'lin']]), ex = 320, ph = u * 1.75;
  const V = view({ x: 1180, y: 470, z: ez + 60, yaw: -Math.PI / 2, f: 1250, cy: 980 });
  const place = [1.6, 2.7];   // seconds into the shot: a sheet onto each of the two desks he passes
  let reach = 0; for (const pt of place) reach = Math.max(reach, kf(u, [[pt - .45, 0], [pt - .1, 1, 'o'], [pt + .3, 0]]));
  const top = clamp(1 - Math.abs(t - (lineT('e02').t1 - .45)) / .4);
  let p = pose(EXAM, { face: .92, e: { ...X.stern, gx: .3 }, aL: { to: [30, -330], k: 1, z: 1, prop: { n: 'stack', r: .1, w: 92, n: 8 } }, aR: { a: lerp(.1, .75, reach), b: lerp(-.2, .3, reach), z: -1, hand: reach > .5 ? 'open' : 'fist' } }, walk(ph, 1, { stride: 34, lift: 12 }));
  if (top > .05) p = pose(EXAM, p, { aR: { a: -Math.PI + .3 * top, b: -.1, hand: 'point', z: 1 }, head: { turn: -.3 * top }, e: { ...X.bark } });
  p = talk(idle(p, t, 2, .4), 'EXAMINER', t);
  const seat = (s, front) => {
    const look = clamp(1 - Math.abs(s.Zc - ez) / 700);
    return sp(s.ch, { face: -.6 + look * .25, head: { turn: look * .35, nod: .05 }, e: { ...s.ch.face, gx: -.3 + look * .8 }, aL: { to: [-30, -190], k: 1 }, aR: { to: [30, -192], k: -1 } });
  };
  layerSoft(ctx, 'bg', g => hallScene(g, V, t, { seat: (s, f) => s.c < 2 ? seat(s, f) : null, skip: [2, 5, 8], desk: { stack: 0 }, L: LE, shafts: false }), 1.6);
  V.ch(ctx, EXAM, p, ex, ez, LE);
  dust(ctx, t, 0, 200, 1080, 1400, 46, 5); finish(ctx, { vig: .5, bl: .22 });
}
// 5. reaction shots: the room is frightened
function shotReactions(ctx, t) {
  const m = M, a = t < m.react2;
  const f = a ? 1650 : 1500, tgt = a ? SEATS[0] : SEATS[3], z0 = a ? m.react : m.react2, z1 = a ? m.react2 : m.eighty;
  const push = kf(t, [[z0, 1], [z1, 1.08, 'lin']]);
  const V = view({ x: tgt.X + (a ? 60 : 300), y: 330, z: tgt.Zc - 1250, yaw: 0, f: f * push, cy: 1080 });
  const seat = (s, front) => {
    let p = fidget(s.ch, s.i, t, true);
    if (s === SEATS[0]) { // X1 swallows and loosens his tie
      const tie = kf(t, [[m.react + .5, 0], [m.react + .9, 1], [m.react + 2.1, 1], [m.react + 2.5, 0]]);
      p = sp(s.ch, { head: { tilt: -.08 * tie, nod: -.15 * tie }, shrug: .5 + tie * .2, e: { ...X.gulp, gx: .45, mWavy: tie > .5 ? 1 : 0 }, aL: { to: [-36, -186], k: 1 }, aR: { to: [lerp(34, 4, tie), lerp(-186, -228, tie)], k: -1, z: 1 } });
    }
    if (s === SEATS[3]) { // X3 clicks his pen, eyes wide
      const click = Math.sin((t - m.react2) * 11) > .3 && t < m.react2 + 2.2;
      p = sp(s.ch, { head: { nod: .25 }, shrug: .6, e: { ...X.anxious, gx: .35, gy: .2 }, aL: { to: [-40, -186], k: 1 }, aR: { to: [28, -226 + (click ? 3 : 0)], k: -1, z: 1, prop: { n: 'pen', r: -.2, dy: -18 } } });
    }
    if (s === SEATS[4]) p = sp(s.ch, { shrug: .5, e: { ...X.worried, gx: .5, sweat: .9 }, aL: { to: [-40, -186], k: 1 }, aR: { to: [40, -186], k: -1 } });
    return p;
  };
  layerSoft(ctx, 'bg', g => hallScene(g, V, t, { seat: (s, fr) => s === tgt ? null : seat(s, fr), desk: { stack: 4 } }), 5);
  const items = seatItems(V, ctx, tgt.X, tgt.Zd, tgt.ch, idle(seat(tgt, true), t, tgt.i), LF, { noShadow: true }, paperOf(tgt, t) || {});
  paint(items); hallShafts(ctx, V, { a: .07 });
  finish(ctx, { vig: .55, bl: .2 }); captions(ctx, t, 1640);
}
// 6–7. the examiner, seen over the candidates' shoulders: EIGHTY. PERCENT. / WINNER... or a LOSER / and he lays the last sheet on the Candidate's desk
function shotExaminer(ctx, t) {
  const m = M, e7 = lineT('e07'), e8 = lineT('e08'), e9 = lineT('e09');
  const ex = kf(t, [[m.eighty, 320], [e8.t0, 320], [e9.t1 - .2, 470, 'io']]), ez = kf(t, [[m.eighty, 1560], [e8.t0, 1580], [e9.t1 - .2, 1835, 'io']]);
  const walking = t > e8.t0 && t < e9.t1 - .25, ph = (t - e8.t0) * 1.6;
  const pushz = kf(t, [[m.eighty, 1], [m.push, 1.0], [e7.t1, 1.35, 'io'], [m.place, 1.5, 'io']]);
  const V = view({ x: kf(t, [[m.eighty, 400], [m.place, 520]]), y: 480, z: 2950, yaw: Math.PI, f: 1300 * pushz, cy: 960 - (pushz - 1) * 120 });
  const chop = t > m.eighty && t < m.push ? (() => { const l = lineT('e06'), k1 = clamp(1 - Math.abs(t - (l.t0 + .25)) / .22), k2 = clamp(1 - Math.abs(t - (l.t1 - .45)) / .22); return Math.max(k1, k2); })() : 0;
  const stare = t > e7.t0 - .2 && t < e7.t1 + .25;
  const placing = kf(t, [[e9.t1 - .25, 0], [m.place, 1, 'o'], [m.place + .6, 1]]);
  let p = pose(EXAM, { face: 0, e: { ...(stare ? X.bark : X.stern), gx: stare ? 0 : .3 }, head: { tilt: stare ? -.04 : 0 }, aL: { to: [-40, -318], k: 1, z: 1, prop: { n: 'stack', r: .06, w: 92, n: 3 } },
    aR: chop > 0 ? { a: lerp(-.6, -1.2, chop), b: lerp(-1.6, -.5, chop), hand: 'open', z: 1 } : { a: .1, b: -.15 } }, walking ? exWalkFront(ph) : {});
  if (stare) p = pose(EXAM, p, { aR: { to: [56, -356], k: -1, z: 1, hand: 'point' } });
  if (placing > 0) p = pose(EXAM, p, { face: -.35, aR: { to: [lerp(40, 150, placing), lerp(-240, -150, placing)], k: -1, z: 1, hand: 'open', prop: placing < .95 ? { n: 'sheet', r: 1.2, w: 60, h: 78 } : null } });
  p = talk(idle(p, t, 2, .4), 'EXAMINER', t);
  const seat = (s, front) => { const p0 = fidget(s.ch, s.i, t, false); return s.ch === CAND ? sp(CAND, { head: { back: 1, tilt: .1 }, lean: -.12, shrug: -.2, aL: { to: [-70, -240], k: 1, z: -1 }, aR: { to: [80, -250], k: -1, z: -1 } }) : p0; };
  layerSoft(ctx, 'bg', g => hallScene(g, V, t, { seat: (s, f) => s.r === 0 ? seat(s, f) : null, desk: { stack: 6 } }), 3.2);
  V.ch(ctx, EXAM, p, ex, ez, LB);
  if (placing > .9) { /* the sheet now lies on the Candidate's desk */ }
  layerSoft(ctx, 'fg', g => { const items = []; for (const s of SEATS.filter(s => s.r > 0)) items.push(...seatItems(V, g, s.X, s.Zd, s.ch, idle(seat(s, false), t, s.i), LB, { noShadow: true }, paperOf(s, t) || {})); paint(items); }, 7);
  hallShafts(ctx, V, { a: .08 });
  finish(ctx, { vig: .58, bl: .2, inner: .3 + (pushz - 1) * .1 }); captions(ctx, t, 1640);
}
// 8. the Candidate leans back: "See you at the top, chief!"
function shotCandSalute(ctx, t) {
  const m = M, c1 = lineT('c01'), V = view({ x: 600, y: 380, z: CS.Zc - 1080, yaw: 0, f: 1550, cy: 1040 });
  const sal = kf(t, [[c1.t0 + .05, 0], [c1.t0 + .35, 1, 'back'], [c1.t1 + .3, 1], [c1.t1 + .7, 0]]);
  let cp = sp(CAND, { lean: -.14, hipX: 6, shrug: -.25, head: { tilt: .08 }, e: { ...X.smug, gx: -.45 }, aL: { to: [-58, -190], k: 1 }, aR: { to: [60, -200], k: -1 } });
  if (sal > 0) cp = pose(CAND, cp, { e: { ...X.cocky, gx: -.55 }, aR: { to: [lerp(60, 70, sal), lerp(-200, -505, sal)], k: -1, z: 1, hand: sal > .5 ? 'open' : 'fist' }, head: { tilt: .1, turn: -.15 } });
  cp = talk(idle(cp, t, 0, .6), 'CANDIDATE', t);
  const stare = kf(t, [[c1.t0 + .4, 0], [c1.t1 + .2, 1]]);
  const seat = (s, front) => { if (s === CS) return cp; const p = fidget(s.ch, s.i, t, true); return stare > 0 && (s.i === 4 || s.i === 8 || s.i === 2) ? lookAt(p, s.X < 640 ? .8 * stare : -.6 * stare, (s.X < 640 ? .35 : -.25) * stare) : p; };
  const exitH = kf(t, [[m.place, 0], [m.place + .7, 1, 'io']]);
  layerSoft(ctx, 'bg', g => hallScene(g, V, t, { minDepth: 1150, seat: (s, f) => s === CS ? null : seat(s, f), desk: { stack: 3 } }), 4);
  paint(seatItems(V, ctx, CS.X, CS.Zd, CAND, cp, LF, { noShadow: true }, paperOf(CS, t) || {}));
  // the examiner's sleeve leaving frame left
  if (exitH < 1) { ctx.save(); ctx.globalAlpha = 1 - exitH; const x = lerp(250, -200, exitH); fillRR(ctx, x - 120, 900, 220, 1100, 60, EXAM.top); fillR(ctx, x - 20, 1180, 140, 40, '#F6F1E6'); ctx.restore(); }
  hallShafts(ctx, V, { a: .07 }); finish(ctx, { vig: .52, bl: .2 }); captions(ctx, t, 1640);
}
// 9. the held reaction: one eyebrow, then he turns away
function shotBrow(ctx, t) {
  const m = M, u = t - m.brow, V = view({ x: 500, y: 520, z: 2620, yaw: Math.PI, f: 2300, cy: 1040 });
  const brow = kf(u, [[.15, 0], [.45, 1, 'o'], [1.15, 1], [1.4, .3]]), turn = kf(u, [[1.05, 0], [1.6, 1, 'io']]);
  let p = pose(EXAM, { face: lerp(0, .9, turn), e: { ...X.stern, ...(brow > .5 ? X.brow : {}), browAsym: X.brow.browAsym * brow, gx: lerp(-.25, .6, turn) }, head: { turn: -.12 + turn * .3 }, aL: { to: [-40, -318], k: 1, z: 1, prop: { n: 'stack', r: .06, w: 92, n: 2 } }, aR: { a: .1, b: -.15 } });
  p = idle(p, t, 2, .3);
  layerSoft(ctx, 'bg', g => hallScene(g, V, t, { seat: (s, f) => fidget(s.ch, s.i, t, false), desk: { stack: 2 } }), 6);
  V.ch(ctx, EXAM, p, 470, 1835, LB);
  finish(ctx, { vig: .6, bl: .2, inner: .28 });
}

// ================= 2. THE TWO-HOUR EXAM =================
function seq2(ctx, t) {
  const m = M;
  if (t < m.ots) {                                                     // 10. the clock: 9:00. "Begin."
    insertClock(ctx, t - m.s2, m.ots - m.s2, 8 * 60 + 59.5, 9 * 60, { push: 1.1, ss: t < m.begin ? 59 : 0 });
    finish(ctx, { vig: .45, bl: .2 }); return;
  }
  if (t < m.rows) { shotOTS(ctx, t); return; }
  if (t < m.done) {                                                    // 12. the rows, time-lapse told by the sun
    const u = t - m.rows, d = m.done - m.rows;
    if (u > 1.25 && u < 1.95) { insertClock(ctx, u - 1.25, .7, 9 * 60 + 45, 10 * 60 + 30, { spin: .7, push: 1.0 }); finish(ctx, { vig: .45 }); return; }
    const sun = u < 1.25 ? .32 + u * .05 : .7 + (u - 1.95) * .06;
    shotRows(ctx, t, sun); return;
  }
  shotDone(ctx, t);
}
// 11. over the Candidate's shoulder: he skims, smirks, writes fast. Behind, out of focus, the Second Candidate turns his sheet over.
function shotOTS(ctx, t) {
  const m = M, u = t - m.ots, V = view({ x: 725, y: 560, z: CS.Zc + 235, yaw: Math.PI, f: 800, cy: 700 });
  const fill = clamp(u / 3.2) * .6;
  const flipT = m.ots + 1.5, fl = clamp((t - flipT) / .7);
  const secPose = sp(SECOND, { head: { back: 1, nod: .2 }, shrug: .5, aL: { to: [-40 + fl * 10, -230 - Math.sin(fl * Math.PI) * 170], k: 1, z: 1 }, aR: { to: [40, -230 - Math.sin(fl * Math.PI) * 170], k: -1, z: 1 } });
  const seat = (s) => s === SS ? secPose : writing(s.ch, s.i, t, false);
  layerSoft(ctx, 'bg', g => {
    hallScene(g, V, t, { seat: (s, f) => s === CS ? null : seat(s), sun: .1, desk: { stack: 0 } });
    if (fl > 0 && fl < 1) { const q = V.p(SS.X, 560 + Math.sin(fl * Math.PI) * 60, SS.Zc - 40), s = V.s(SS.X, SS.Zc) * 1.2; g.save(); g.translate(q[0], q[1]); g.scale(Math.cos(fl * Math.PI) * s, s); fillR(g, -37, -48, 74, 96, fl < .5 ? P.paper : '#EFE6D0'); g.restore(); }
  }, 7);
  // his sheet on the desk, close and sharp
  const p = sp(CAND, { head: { back: 1, nod: .45, tilt: -.05 }, shrug: .3, aL: { to: [-60, -210], k: 1, z: -1 }, aR: { to: [50 + Math.sin(t * 9) * 6, -214], k: -1, z: -1 } });
  paint(seatItems(V, ctx, CS.X, CS.Zd, CAND, idle(p, t, 0, .4), LB, { noShadow: true }, { paper: fill > .25 ? 'filled' : 'front' }));
  hallShafts(ctx, V, { sun: .1, a: .08 }); finish(ctx, { vig: .55, bl: .2 });
}
// 12. the rows, from the far side, facing the windows: silhouettes with gold rims; light patches crawl across the floor
function shotRows(ctx, t, sun) {
  const m = M, V = view({ x: -1150, y: 470, z: 1960, yaw: Math.PI / 2, f: 1050, cy: 1050 });
  const seat = (s) => {
    if (s.ch === CAND) { const tw = t * 6; return sp(CAND, { face: .7, lean: -.14, shrug: -.25, head: { tilt: .1, turn: .1 }, e: { ...X.chill, gx: .3 }, aL: { to: [-30, -300], k: 1, z: -1 }, aR: { to: [70, -330], k: -1, z: 1, prop: { n: 'pen', r: tw, dy: -10 } } }); }
    const w = Math.sin(t * 7.5 + s.i * 2.1);
    return sp(s.ch, { face: .75, head: { nod: .7 + Math.sin(t * .7 + s.i) * .1, turn: .05 }, shrug: .4, e: { ...(s.i % 2 ? X.worried : s.ch.face), gx: .3, gy: .9, lidT: .4 }, aL: { to: [40, -200], k: 1, z: -1 }, aR: { to: [70 + w * 6, -196], k: -1, z: 1, prop: { n: 'pen', r: .6, dy: -14 } } });
  };
  hallScene(ctx, V, t, { minDepth: 700, seat: s => seat(s), sun, L: LW, desk: { stack: 0 }, shaftA: .13 });
  dust(ctx, t, 0, 300, 1080, 1300, 60, 9, '#FFF2CF', .8);
  finish(ctx, { vig: .55, bl: .3 });
}
// 13. 11:00. Pen down. The smile. The stretch. Everyone else is still writing.
function shotDone(ctx, t) {
  const m = M, u = t - m.done;
  if (u < .55) { insertClock(ctx, u, .55, 10 * 60 + 59, 11 * 60, { spin: .4, push: 1.04 }); finish(ctx, { vig: .45 }); return; }
  const V = view({ x: 640, y: 360, z: CS.Zc - 900, yaw: 0, f: kf(u, [[.55, 1500], [m.s3 - m.done, 1640, 'lin']]), cy: 1020 });
  const k = [[.55, 'write'], [1.0, 'down'], [1.5, 'smile'], [2.1, 'stretch'], [2.6, 'glance']];
  const write = sp(CAND, { head: { nod: .7 }, e: { ...X.chill, gy: .9 }, aL: { to: [-50, -180], k: 1 }, aR: { to: [30, -182], k: -1, prop: { n: 'pen', r: -.6, dy: -14 } } });
  const down = sp(CAND, { head: { nod: .3 }, e: { ...X.proud, gy: .6 }, aL: { to: [-50, -180], k: 1 }, aR: { to: [70, -176], k: -1 } });
  const smile = sp(CAND, { head: { nod: .1, tilt: .06 }, lean: -.04, e: { ...X.smug, gx: 0, gy: .4 }, aL: { to: [-50, -182], k: 1 }, aR: { to: [70, -178], k: -1 } });
  const stretch = sp(CAND, { lean: -.1, shrug: .7, head: { tilt: -.05, nod: -.25 }, e: { ...X.proud, eyeOpen: .05, closeCurve: -1, mO: .3 }, aL: { a: -2.35, b: -.25, hand: 'open', z: 1 }, aR: { a: 2.35, b: .25, hand: 'open', z: 1 } });
  const glance = sp(CAND, { lean: -.12, shrug: -.2, head: { turn: Math.sin(u * 3) * .25 }, e: { ...X.smug, gx: Math.sin(u * 3) * .8 }, aL: { to: [-80, -300], k: 1, z: -1 }, aR: { to: [80, -300], k: -1, z: -1 } });
  const cp = pk(CAND, u, [[.55, write], [.95, write], [1.15, down, 'o'], [1.45, smile], [1.75, smile], [2.05, stretch, 'back'], [2.4, stretch], [2.7, glance, 'io']]);
  layerSoft(ctx, 'bg', g => hallScene(g, V, t, { minDepth: 1000, seat: (s, f) => s === CS ? null : writing(s.ch, s.i, t, true), sun: .95, desk: { stack: 0 } }), 4.5);
  paint(seatItems(V, ctx, CS.X, CS.Zd, CAND, idle(cp, t, 0, .5), LF, { noShadow: true }, { paper: 'filled' }));
  hallShafts(ctx, V, { sun: .95, a: .07 }); finish(ctx, { vig: .5, bl: .22, grade: ['#FFD58C', .06, 'screen'] });
}

// ================= 3. THE VICTORY WALK =================
const proudWalk = (ph, dir) => pose(CAND, walk(ph, dir, { stride: 40, lift: 14, swing: .55 }), { e: X.proud, lean: -.03 });
function seq3(ctx, t) {
  const m = M;
  if (t < m.track) {                                                   // 14. he stands, straightens the jacket, the tie
    const u = t - m.s3, V = view({ x: 600, y: 420, z: CS.Zc - 1100, yaw: 0, f: 1300, cy: 1000 });
    const seated = sp(CAND, { e: X.proud, aL: { to: [-50, -182], k: 1 }, aR: { to: [60, -180], k: -1 } });
    const up = pose(CAND, { e: X.proud, aL: { to: [-40, -330], k: 1, z: 1 }, aR: { to: [40, -330], k: -1, z: 1 } });
    const jacket = pose(CAND, { e: { ...X.proud, gy: .5 }, head: { nod: .3 }, shrug: .3, aL: { to: [-22, -330], k: 1, z: 1, hand: 'fist' }, aR: { to: [22, -330], k: -1, z: 1 } });
    const tie = pose(CAND, { e: { ...X.cocky, gx: -.3 }, head: { tilt: -.08 }, aL: { a: -.1, b: .1, prop: { n: 'sheet', r: .1, w: 60, h: 80 } }, aR: { to: [6, -372], k: -1, z: 1 } });
    const ready = pose(CAND, { e: { ...X.cocky, gx: -.5 }, aL: { a: -.1, b: .1, prop: { n: 'sheet', r: .1, w: 60, h: 80 } }, aR: { a: .12, b: -.1 } });
    const cp = pk(CAND, u, [[0, seated], [.15, seated], [.6, up, 'io'], [.75, jacket], [1.05, jacket, 'io'], [1.2, tie], [1.5, tie], [1.7, ready, 'io']]);
    const standing = u > .35;
    layerSoft(ctx, 'bg', g => hallScene(g, V, t, { minDepth: 1150, seat: (s, f) => s === CS ? null : writing(s.ch, s.i, t, true), sun: 1, desk: { stack: 0 } }), 4);
    if (!standing) paint(seatItems(V, ctx, CS.X, CS.Zd, CAND, cp, LF, { noShadow: true }, { paper: 'filled' }));
    else { paint([...seatItems(V, ctx, CS.X, CS.Zd, CAND, cp, LF, {}, { noBody: true, ...(u < .75 ? { paper: 'filled' } : {}) }), { d: V.depth(CS.X, CS.Zc - 40), fn: () => V.ch(ctx, CAND, idle(cp, t, 0, .4), CS.X, CS.Zc - 40, LF) }]); }
    hallShafts(ctx, V, { sun: 1, a: .07 }); finish(ctx, { vig: .5, bl: .22 }); return;
  }
  if (t < m.hand) {                                                    // 15. the walk: low angle, dolly back, heads turn
    const u = t - m.track, d = m.hand - m.track, cz = kf(u, [[0, 2050], [d, 1080, 'lin']]), cx = kf(u, [[0, 560], [d * .6, 330, 'io'], [d, 300]]);
    const V = view({ x: cx, y: 170, z: cz - 760, yaw: 0, f: 1350, cy: 1420 });
    const cp = idle(pose(proudWalk(u * 1.9, -1), { face: -.15, aL: { a: -.15 + Math.sin(u * 1.9 * TAU) * .3, b: .25, prop: { n: 'sheet', r: .15, w: 58, h: 78 } }, head: { tilt: .04 } }), t, 0, .3);
    const seat = (s, f) => { const p = writing(s.ch, s.i, t, true); const dz = Math.abs(s.Zc - cz); const lk = clamp(1 - dz / 700); return lk > .05 ? lookAt(pose(s.ch, p, { e: { ...X.baffled } }), s.X < cx ? .8 * lk : -.8 * lk, (s.X < cx ? .3 : -.3) * lk) : p; };
    hallScene(ctx, V, t, { seat: (s, f) => s === CS ? null : seat(s, f), sun: 1, desk: { stack: 0 }, shaftA: .12, extra: L => [{ d: V.depth(cx, cz), fn: () => V.ch(ctx, CAND, cp, cx, cz, L) }] });
    dust(ctx, t, 0, 200, 1080, 1300, 50, 13); finish(ctx, { vig: .5, bl: .3, grade: ['#FFD58C', .1, 'screen'] }); return;
  }
  if (t < m.sign) { shotDesk(ctx, t, 'hand'); return; }
  if (t < m.shake) { insertRegister(ctx, t - m.sign, m.shake - m.sign, 1, 0, kf(t, [[m.sign + .2, 0], [m.shake - .1, 1, 'io']]), { sigs: ['R. Vance'] }); finish(ctx, { vig: .4 }); return; }
  if (t < m.shake + 1.0) { shotDesk(ctx, t, 'shake'); return; }
  if (t < m.exit) { shotDesk(ctx, t, 'nod'); return; }
  // 19. the exit: the wide again, he struts to the door and out into the light
  const u = t - m.exit, d = m.s4 - m.exit, go = kf(u, [[0, 0], [d - .25, 1, 'lin']]);
  const V = view({ x: 0, y: 600, z: 3300, yaw: Math.PI, f: 820, cy: 930 });
  const px = lerp(-440, -890, go), pz = lerp(470, 40, go), door = kf(u, [[.6, 0], [.9, .9, 'o']]);
  const cp = pose(proudWalk(u * 2, 1), { face: .3, head: { back: 1 }, aL: { a: .2, b: .2 } });
  hallScene(ctx, V, t, { seat: (s, f) => s === CS ? null : writing(s.ch, s.i, t, false), sun: 1, door, desk: { stack: 0, inbox: 1 },
    extra: L => [{ d: V.depth(-455, 110), fn: () => V.ch(ctx, EXAM, pose(EXAM, { face: 0, e: X.stern }), -455, 110, LB) }, ...(go < .98 ? [{ d: V.depth(px, pz), fn: () => V.ch(ctx, CAND, cp, px, pz, LB, { alpha: kf(u, [[d - .35, 1], [d - .1, 0]]) }) }] : [])] });
  finish(ctx, { vig: .5, bl: .26, grade: ['#FFD58C', .08, 'screen'] });
}
// 16 / 18b / 20b. the examiner's desk from the side, the windows behind (backlit, gold rims)
function shotDesk(ctx, t, what) {
  const m = M, close = what === 'shake', V = view({ x: -1130, y: close ? 360 : 400, z: close ? 270 : 300, yaw: Math.PI / 2, f: close ? 2000 : 1350, cy: close ? 1000 : 1010 });
  let ep = pose(EXAM, { face: -.85, e: { ...X.stern, gx: -.6 }, aL: { a: .1, b: -.1 }, aR: { a: -.1, b: .1 } }), who = null, wp = null, wz = 470, inbox = 0;
  if (what === 'hand') {
    const u = t - m.hand, arr = kf(u, [[0, 0], [.45, 1, 'o']]), put = kf(u, [[.35, 0], [.6, 1, 'o'], [1.0, 1], [1.3, 0]]);
    wz = lerp(650, 470, arr); who = CAND; inbox = u > .55 ? 1 : 0;
    wp = pose(CAND, { face: .85, e: { ...X.proud, gx: .6 }, aL: { a: .1, b: .1 }, aR: { to: [lerp(40, 150, put), lerp(-240, -300, put)], k: 1, z: 1, hand: put > .2 ? 'open' : 'fist', prop: u < .58 ? { n: 'sheet', r: 1.4, w: 56, h: 74 } : null } }, arr < 1 ? walk(u * 2, 1, { stride: 30 }) : {});
    ep = pose(EXAM, ep, { aR: { to: [-140, -300], k: -1, z: 1, hand: 'open' } });
    if (u > .7) ep = pose(EXAM, ep, { e: { ...X.stern, gy: .5, gx: -.2 }, head: { nod: .4 }, aR: { to: [-120, -310], k: -1, z: 1 }, aL: { to: [-90, -305], k: 1, z: -1 } });
  } else if (what === 'shake') {
    const u = t - m.shake, meet = kf(u, [[0, 0], [.3, 1, 'o']]), pump = Math.sin(clamp((u - .3) / .6) * TAU * 2) * 10 * (u > .3 && u < .9 ? 1 : 0);
    who = CAND; inbox = 1; wz = 395;
    wp = pose(CAND, { face: .85, lean: .06, e: { ...X.proud, gx: .6 }, aR: { to: [lerp(40, 150, meet), -300 + pump], k: 1, z: 1, hand: 'fist' }, aL: { a: .1, b: .1 } });
    ep = pose(EXAM, ep, { lean: -.06, aR: { to: [lerp(-60, -150, meet), -300 + pump + 34 * 0], k: -1, z: 1, hand: 'fist' } });
  } else if (what === 'nod') {
    const u = t - (m.shake + 1.0); who = CAND; inbox = 1; wz = 395 + clamp((u - .5) * 2) * 60;
    const nod = Math.sin(clamp(u / .35) * Math.PI) * .3, turn = kf(u, [[.45, 0], [.85, 1, 'io']]);
    wp = pose(CAND, { face: lerp(.85, -.9, turn), head: { nod }, e: { ...X.cocky, gx: lerp(.6, -.6, turn) }, aR: { a: lerp(-.9, .1, clamp(u * 3)), b: -.3 } });
    ep = pose(EXAM, ep, { aR: { a: lerp(.9, .1, clamp(u * 3)), b: .3 } });
  } else if (what === 'second') {
    const u = t - m.sec2, arr = kf(u, [[0, 0], [.4, 1, 'o']]), put = kf(u, [[.25, 0], [.45, 1], [.7, 0]]), sign = kf(u, [[.7, 0], [.9, 1], [1.5, 1], [1.7, 0]]), leave = kf(u, [[1.75, 0], [2.2, 1]]);
    wz = lerp(650, 470, arr) + leave * 200; who = SECOND; inbox = u > .45 ? 2 : 1;
    wp = pose(SECOND, { face: leave > .3 ? -.9 : .85, e: { ...X.exhausted, gx: .5, gy: sign > .5 ? .8 : 0 }, head: { nod: sign * .5 }, lean: sign * .12, aL: { a: .1, b: .1, prop: { n: 'folder', r: .1 } }, aR: { to: [lerp(40, 150, Math.max(put, sign * .8)), lerp(-240, -300, put) + sign * 10], k: 1, z: 1, hand: put > .2 ? 'open' : 'fist', prop: sign > .3 ? { n: 'pen', r: 1.9 } : (u < .45 ? { n: 'sheet', r: 1.4, w: 56, h: 74 } : null) } }, leave > 0 ? walk(u * 2, -1, { stride: 26 }) : {});
    ep = pose(EXAM, ep, { e: { ...X.nod, gx: -.6, gy: sign > .5 ? .5 : 0 }, head: { nod: Math.sin(clamp((u - 1.0) / .4) * Math.PI) * .35 } });
  }
  ep = talk(idle(ep, t, 2, .3), 'EXAMINER', t); if (wp) wp = idle(wp, t, 1, .3);
  layerSoft(ctx, 'bg', g => hallScene(g, V, t, { seat: s => writing(s.ch, s.i, t, false), sun: 1, desk: { stack: 0 }, L: LW, shafts: false }), 5);
  const items = examDeskItems(V, ctx, { inbox });
  items.push({ d: V.depth(-455, 110), fn: () => V.ch(ctx, EXAM, ep, -455, 110, LW, {}, EDESK.ph) });
  if (who) items.push({ d: V.depth(-455, wz), fn: () => V.ch(ctx, who, wp, -455, wz, LW) });
  paint(items);
  hallShafts(ctx, V, { sun: 1, a: .1 }); finish(ctx, { vig: .5, bl: .3 });
}

// ================= 4. THE SECOND CANDIDATE =================
function seq4(ctx, t) {
  const m = M;
  if (t < m.sec2) {                                                    // 20a. the last correction, he stands
    const u = t - m.s4, V = view({ x: SS.X + 40, y: 390, z: SS.Zc - 1000, yaw: 0, f: 1450, cy: 1020 });
    const wr = writing(SECOND, 1, t, true, { e: X.exhausted }), tap = sp(SECOND, { head: { nod: .5 }, e: { ...X.exhausted, gy: .8, sweat: .9 }, aL: { to: [-50, -180], k: 1 }, aR: { to: [10, -186], k: -1, prop: { n: 'pen', r: -.4, dy: -14 } } });
    const up = pose(SECOND, { e: X.exhausted, aL: { a: .1, b: .1, prop: { n: 'folder', r: .1 } }, aR: { to: [40, -300], k: -1, z: 1, prop: { n: 'sheet', r: .2, w: 60, h: 80 } } });
    const sp2 = pk(SECOND, u, [[0, wr], [.3, tap], [.7, tap], [.85, wr]]);
    layerSoft(ctx, 'bg', g => hallScene(g, V, t, { seat: (s, f) => s === SS || s === CS ? null : writing(s.ch, s.i, t, true), sun: 1, desk: { stack: 0 } }), 4.5);
    if (u < .9) paint(seatItems(V, ctx, SS.X, SS.Zd, SECOND, idle(sp2, t, 1, .4), LF, { noShadow: true }, { paper: 'backFilled' }));
    else { const stp = pk(SECOND, u, [[.9, pose(SECOND, sp2, { hipY: 30, legS: 1 })], [1.3, up]]); paint([...seatItems(V, ctx, SS.X, SS.Zd, SECOND, stp, LF, {}, { noBody: true }), { d: V.depth(SS.X, SS.Zc - 40), fn: () => V.ch(ctx, SECOND, stp, SS.X, SS.Zc - 40, LF) }]); }
    hallShafts(ctx, V, { sun: 1, a: .07 }); finish(ctx, { vig: .5, bl: .22 }); return;
  }
  if (t < m.sec2 + 1.0 && t > m.sec2 + .62) { insertRegister(ctx, t - m.sec2, 1.0, 2, 1, kf(t, [[m.sec2 + .62, .1], [m.sec2 + 1.0, .8]]), { sigs: ['R. Vance', 'T. Marsh'], sleeve: SECOND.top }); finish(ctx, { vig: .4 }); return; }
  if (t < m.hall) { shotDesk(ctx, t, 'second'); return; }
  hallway(ctx, t);
}

// ================= dispatcher =================
export function renderFilm(ctx, t) {
  const m = M;
  if (t < m.s2) seq1(ctx, t);
  else if (t < m.s3) seq2(ctx, t);
  else if (t < m.s4) seq3(ctx, t);
  else if (t < m.s5) seq4(ctx, t);
  else if (t < m.trigger) seq5(ctx, t);
  else if (t < m.black) seq6(ctx, t);
  else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
}
