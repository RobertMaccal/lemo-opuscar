// THE BRAIN NEVER FORGETS — every shot. renderFilm(ctx, t) draws the frame at second t.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, wash, bloom, vignette, paperGrain } from './kit.js';
import { drawChar, pose, solve, PROPS } from './rig.js';
import { X, YOU, YOU_NIGHT, MATE, PROF, STU_A, STU_B, STU_C, STU_D, STU_E } from './cast.js';
import * as S from './sets.js';
import * as S2 from './sets2.js';
import { drawBrain, BX, bmix } from './brain.js';
import { W, H, cam, layer, layerSoft, put, seat, finish, mkL, ROWS, colX } from './shots.js';
import { TL, M, kf, pk, P_, idle, talk, voice, lineT, walk, captions, drawP, zoomAt, EASE } from './anim.js';

// ---------- props this film adds to the rig ----------
PROPS.brush = (g, x, y, fa, o) => {
  g.save(); g.translate(x, y); g.rotate(o.r || 0);
  line(g, 8, 0, -56, 0, '#7FB8C9', 5); line(g, -56, 0, -64, 0, '#F4F1E8', 5);
  fillRR(g, -70, -7, 12, 6, 2, '#FFFFFF'); for (let k = 0; k < 4; k++) line(g, -69 + k * 3, -7, -69 + k * 3, -11, '#E6F2F5', 1.6);
  g.restore();
};
PROPS.pencil2 = PROPS.pencil;

// ---------- helpers ----------
const ss = x => x * x * (3 - 2 * x);
const hand = (ch, p, x, y, s, side = 'R') => { const J = solve(ch, p), h = (side === 'R' ? J.B : J.A).hd; return [x + h[0] * s, y + h[1] * s]; };
const toLocal = (x, y, s, wx, wy) => [(wx - x) / s, (wy - y) / s];
// mouth position in local units (follows face turn, nod and tilt)
function mouthL(ch, p) {
  const J = solve(ch, p), R = ch.R, th2 = clamp(p.face + p.head.turn, -1.15, 1.15) * .62, fy = p.head.nod * R * .27;
  const mx = R * .84 * Math.sin(th2) * .94, my = R * .54 + fy * .8, c = Math.cos(p.head.tilt), s = Math.sin(p.head.tilt);
  return [J.hc[0] + mx * c - my * s, J.hc[1] + mx * s + my * c];
}
const ex = (base, o) => ({ ...base, ...o });
// shallow focus: everything blurred except a horizontal band around y
function focusBand(ctx, id, fn, y, h, blur) {
  const g = tmp(id, W, H); fn(g);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${blur}px)`; ctx.drawImage(g.canvas, 0, 0); ctx.restore();
  const m = tmp(id + '_m', W, H); m.drawImage(g.canvas, 0, 0); m.globalCompositeOperation = 'destination-in';
  m.fillStyle = lg(m, 0, y - h, 0, y + h, ['rgba(0,0,0,0)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']); m.fillRect(0, 0, W, H);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(m.canvas, 0, 0); ctx.restore();
}
const capY = l => ({ c01: 1700, s02: 1700 }[l.id] || 1500);

// =====================================================================
// 1. THE EXAM IS FINISHED
// =====================================================================
function writingHand(g, tip, u, lift) {
  const [tx, ty] = tip, ang = -1.16, L = 300;
  const hx = tx + Math.cos(ang) * 150 + 30, hy = ty + Math.sin(ang) * 150 - lift;
  const px = tx, py = ty - lift;
  // sleeve from off frame (bottom right)
  g.lineCap = 'round'; g.strokeStyle = dark(P.you, .1); g.lineWidth = 150; g.beginPath(); g.moveTo(1350, 1700); g.quadraticCurveTo(hx + 260, hy + 160, hx + 70, hy + 40); g.stroke();
  g.strokeStyle = P.you; g.lineWidth = 134; g.stroke();
  g.strokeStyle = dark(P.you, .3); g.lineWidth = 136; g.lineCap = 'butt'; g.beginPath(); g.moveTo(hx + 110, hy + 64); g.lineTo(hx + 80, hy + 46); g.stroke();
  // pencil
  const ux = Math.cos(ang), uy = Math.sin(ang);
  line(g, px + ux * 40, py + uy * 40, px + ux * L, py + uy * L, P.orange, 22, 'butt'); line(g, px + ux * L, py + uy * L, px + ux * (L + 30), py + uy * (L + 30), P.rose, 22, 'butt');
  poly(g, [[px + ux * 40 - uy * 11, py + uy * 40 + ux * 11], [px + ux * 40 + uy * 11, py + uy * 40 - ux * 11], [px, py]]); g.fillStyle = P.sand; g.fill();
  poly(g, [[px + ux * 12 - uy * 3.5, py + uy * 12 + ux * 3.5], [px + ux * 12 + uy * 3.5, py + uy * 12 - ux * 3.5], [px, py]]); g.fillStyle = P.ink; g.fill();
  // fist round the pencil
  circ(g, hx, hy, 66, P.ink);
  for (const [dx, dy] of [[-46, 34], [-24, 52], [4, 58]]) { g.beginPath(); g.arc(hx + dx, hy + dy, 22, 0, TAU); g.fillStyle = P.ink; g.fill(); }
  g.beginPath(); g.arc(hx - 40, hy - 10, 30, 2.4, 5.2); g.lineWidth = 6; g.strokeStyle = '#3A3560'; g.stroke();
}
function shotInsert(ctx, t) {
  const u = t - M.exam, z = kf(u, [[0, 1], [M.exWide - M.exam, 1.07, 'lin']]);
  const wU = clamp(u / 1.75), dot = u >= M.dot - M.exam ? 1 : 0;
  const lift = kf(u, [[1.72, 0], [1.84, 22, 'o'], [1.9, 0, 'i'], [2.15, 0], [2.7, 120, 'io']]);
  let tip = null;
  const draw = g => cam(g, zoomAt(640, 1150, z), () => {
    S2.deskTop(g, t);
    tip = S2.booklet(g, t, 400, 1000, 1.25, { writeU: wU, dot });
    if (u < 1.75) tip = [tip[0] + Math.sin(u * 40) * 3, tip[1] + Math.sin(u * 23) * 4];
    S.sunQuad(g, t, [[-260, 140], [820, -160], [1500, 1560], [140, 2050]], { cols: 3, rows: 3, col: '#FFD58A', a: .3, leaves: 10, seed: 4 });
    const big = (fn) => { g.save(); g.translate(tip[0], tip[1]); g.scale(1.55, 1.55); g.translate(-tip[0], -tip[1]); fn(); g.restore(); };
    big(() => { g.save(); g.translate(14, 22); g.globalAlpha = .28; g.filter = 'blur(10px)'; writingHand(g, tip, u, lift); g.restore(); });
    big(() => writingHand(g, tip, u, lift));
  });
  focusBand(ctx, 'ins', draw, 1150, 280, 9);
  shaft(ctx, [[-200, 0], [500, 0], [1300, 1920], [300, 1920]], '#FFE2A8', .12, 40);
  dust(ctx, t, 0, 100, 1080, 1700, 60, 3, '#FFF2CF', .8);
  finish(ctx, { vig: .55, bl: .3, grade: ['#FFB45A', .14, 'soft-light'] });
}

// classroom: staging
const L_ROOM = mkL(.16, .98, { rim: '#FFE6B0', rimW: 5, rimA: .95, shadeA: .2, shade: P.plum, shadow: null });
const FRONT = { y: 1640, s: 1.08, x: 540 }, PROF_AT = { x: 850, y: 1606, s: 1.05 }, HANDOFF = [705, 1300];
const done = (ch, k, t) => {
  const v = k % 3;
  const o = v === 0 ? seat(ch, { lean: -.06, e: { ...X.happy, gx: (k % 2 ? .3 : -.3) }, aL: { to: [-60, -170], k: 1 }, aR: { to: [56, -170], k: -1 } })
    : v === 1 ? seat(ch, { head: { tilt: .08 }, e: { ...X.sigh, eyeOpen: (t * .3 + k * .4) % 1 < .04 ? .05 : 1 }, aL: { to: [-30, -300], k: 1 }, aR: { to: [56, -170], k: -1 } })
      : seat(ch, { head: { nod: .5 }, e: { ...X.focus }, aL: { to: [-58, -168], k: 1 }, aR: { to: [30 + Math.sin(t * 6 + k) * 4, -170], k: -1, prop: { n: 'pencil', r: -.5, dy: -18 } } });
  return idle(P_(ch, o), t, k, .8);
};
function classroomBack(g, t) {
  S.room(g, t, { mode: 'exam', hh: 3, mm: 40 });
  S.sunQuad(g, t, [[90, 960], [430, 960], [330, 1960], [-360, 1960]], { cols: 3, rows: 3, col: '#FFD08A', a: .42, gap: .05 });
  S.sunQuad(g, t, [[650, 960], [990, 960], [1440, 1960], [750, 1960]], { cols: 3, rows: 3, col: '#FFD08A', a: .42, gap: .05 });
  const rows = [[1, [[STU_E, -1], [STU_B, 0], [null, 1]]], [2, [[STU_A, -1], [STU_C, 1]]]];
  for (const [r, list] of rows) {
    const { y, s } = ROWS[r];
    for (const [ch, c] of list) {
      const x = colX(s, c), k = r * 3 + c + 1, o = ch ? done(ch, k, t) : null, opt = { noShadow: true, tint: [P.plum, .06 + (3 - r) * .05] };
      ell(g, x + 6 * s, y + 6 * s, 200 * s, 24 * s, rgba(P.plum, .2));
      if (ch) drawP(g, ch, o, x, y, s, L_ROOM, { ...opt, only: [0, 1, 2] });
      S.desk(g, x, y, s, { paper: 1, filled: ch ? 1 : 0, dim: (3 - r) * .04 });
      if (ch) drawP(g, ch, o, x, y, s, L_ROOM, { ...opt, only: [3] });
    }
  }
  shaft(g, [[90, 180], [430, 180], [330, 1700], [-300, 1700]], '#FFE6B0', .1, 34); shaft(g, [[650, 180], [990, 180], [1400, 1700], [760, 1700]], '#FFE6B0', .1, 34);
}
function youExam(t) {
  const y = (...o) => P_(YOU, seat(YOU), ...o), F_ = FRONT;
  const hoff = toLocal(F_.x, F_.y, F_.s, ...HANDOFF), book = [22, -160];
  const write = y({ head: { nod: .7, tilt: -.03 }, e: { ...X.focus }, aL: { to: [-58, -166], k: 1 }, aR: { to: [24, -168], k: -1, prop: { n: 'pencil', r: -.5, dy: -18 } } });
  const down = y({ head: { nod: .35 }, e: { ...X.content, eyeOpen: 1, mS: .5 }, aL: { to: [-58, -166], k: 1 }, aR: { to: [52, -160], k: -1, hand: 'open' } });
  const stretch = y({ shrug: .9, head: { nod: -.1, tilt: .04 }, e: { ...X.content }, aL: { to: [-70, -300], k: 1, hand: 'open' }, aR: { to: [70, -300], k: -1, hand: 'open' } });
  const proud = y({ head: { nod: 0, tilt: -.05 }, e: { ...X.proud }, aL: { to: [-58, -166], k: 1 }, aR: { to: [52, -162], k: -1 } });
  const grab = y({ head: { nod: .3 }, e: { ...X.proud, gy: .5 }, aL: { to: [-58, -166], k: 1 }, aR: { to: book, k: -1 } });
  const give = y({ face: .2, head: { turn: .3, nod: -.05 }, e: { ...X.proud, gx: .7, gy: -.2 }, aL: { to: [-58, -166], k: 1 }, aR: { to: hoff, k: -1 } });
  const lean = y({ lean: -.1, hipX: 10, shrug: .6, head: { tilt: -.06, nod: -.12 }, e: { ...X.proud, lidT: .4, gx: .2 }, aL: { to: [-58, -372], k: -1, z: -1, hand: 'open' }, aR: { to: [58, -372], k: 1, z: -1, hand: 'open' } });
  const m = M;
  let p = pk(YOU, t, [[m.exWide, write], [m.penDown - .05, write], [m.penDown + .2, down], [m.stretch, down], [m.stretch + .35, stretch, 'o'], [m.proud - .3, stretch], [m.proud + .05, proud, 'back'], [m.lift - .05, proud], [m.lift + .25, grab], [m.lift + .4, grab], [m.grip - .05, give], [m.handoff + .1, give], [m.handoff + .45, proud], [m.lean, proud], [m.lean + .5, lean, 'o']]);
  if (t > m.stretch + .35 && t < m.proud - .3) { const w = Math.sin((t - m.stretch) * 18) * 8; p = { ...p, aL: { ...p.aL, to: [p.aL.to ? p.aL.to[0] : -70, -300 + w] }, aR: { ...p.aR, to: [p.aR.to ? p.aR.to[0] : 70, -300 - w] } }; }
  if (t < m.penDown) { const w = Math.sin(t * 22) * 3; p = { ...p, aR: { ...p.aR, to: [24 + (t - m.exWide) * 12 + w, -168 + Math.sin(t * 31) * 1.5] } }; }
  return idle(p, t, 0, .6);
}
function profExam(t) {
  const m = M, A = PROF_AT, hoff = toLocal(A.x, A.y, A.s, ...HANDOFF);
  const arrive = m.profIn + .8;
  if (t < arrive) { const u = (t - m.profIn) / .8; return { x: lerp(1300, A.x, EASE.o(clamp(u))), p: P_(PROF, { face: -.8, ...walk((t - m.profIn) * 2.2, -1, { stride: 40 }), e: { ...X.tired, gx: -.5 } }) };
  }
  const stand = P_(PROF, { face: -.45, head: { nod: .25, turn: -.1 }, e: { ...X.tired, gx: -.6, gy: .4, mS: .1 }, aL: { a: -.1, b: .1 }, aR: { a: .1, b: -.2 } });
  const reach = P_(PROF, { face: -.45, head: { nod: .3, turn: -.1 }, e: { ...X.tired, gx: -.6, gy: .5, mS: .2, browH: .2 }, aL: { to: hoff, k: 1, z: 1 }, aR: { a: .1, b: -.2 } });
  const hold = P_(PROF, { face: .1, head: { nod: .25 }, e: { ...X.tired, gx: .3, gy: .5, mS: .2 }, aL: { to: [-40, -330], k: 1, z: 1 }, aR: { a: .1, b: -.2 } });
  if (t < m.profOut) return { x: A.x, p: pk(PROF, t, [[arrive, stand], [m.grip - .35, stand], [m.grip, reach], [m.handoff + .05, reach], [m.profOut, hold]]) };
  const u = t - m.profOut, x = A.x + Math.max(0, u - .15) * 330;
  return { x, p: P_(PROF, { face: .8, ...walk(Math.max(0, u - .15) * 2.1, 1, { stride: 40 }), e: { ...X.tired, gx: .5 }, aL: { to: [20, -330], k: 1, z: 1 } }) };
}
function bookletObj(g, x, y, r, s = 1) {
  g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s);
  fillRR(g, -44, -58, 88, 116, 4, '#E9DFC8'); fillRR(g, -40, -54, 88, 116, 4, P.paper); fillR(g, -40, -54, 88, 24, '#9FB7D0');
  for (let k = 0; k < 6; k++) line(g, -30, -16 + k * 12, 34 - (k % 3) * 9, -16 + k * 12, rgba(P.lavDeep, .55), 2.4);
  rr(g, -40, -54, 88, 116, 4); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke(); g.restore();
}
function shotClass(ctx, t) {
  const m = M, u = t - m.exWide;
  const c = { x: kf(u, [[0, 560], [1.4, 540, 'io']]), y: kf(u, [[0, 1420], [1.4, 1120, 'io'], [5.9, 1100, 'lin']]), z: kf(u, [[0, 1.62], [1.4, 1.02, 'io'], [5.9, 1.06, 'lin']]) };
  const yp = youExam(t), pr = profExam(t), F_ = FRONT, A = PROF_AT;
  cam(ctx, c, () => {
    classroomBack(ctx, t);
    // professor (behind the front desk line)
    const pp = idle(pr.p, t, 5, .5); drawP(ctx, PROF, pp, pr.x, A.y, A.s, L_ROOM, { noShadow: true, tint: [P.plum, .05] });
    const ph = hand(PROF, pp, pr.x, A.y, A.s, 'L');
    // front row: a classmate on the left, YOU in the middle
    const sd = done(STU_D, 7, t); drawP(ctx, STU_D, sd, 135, F_.y, F_.s, L_ROOM, { noShadow: true, only: [0, 1, 2] }); S.desk(ctx, 135, F_.y, F_.s, { paper: 1, filled: 1 }); drawP(ctx, STU_D, sd, 135, F_.y, F_.s, L_ROOM, { noShadow: true, only: [3] });
    drawP(ctx, YOU, yp, F_.x, F_.y, F_.s, L_ROOM, { noShadow: true, only: [0, 1, 2] });
    S.desk(ctx, F_.x, F_.y, F_.s, { paper: 0 });
    const yh = hand(YOU, yp, F_.x, F_.y, F_.s, 'R');
    // the pencil, put down on the desk
    if (t >= m.penDown) { ctx.save(); ctx.translate(F_.x + 70 * F_.s, F_.y - 172 * F_.s); ctx.rotate(-.25); line(ctx, -40, 0, 40, 0, P.orange, 8, 'butt'); poly(ctx, [[40, -4], [40, 4], [54, 0]]); ctx.fillStyle = P.sand; ctx.fill(); line(ctx, -48, 0, -40, 0, P.rose, 8, 'butt'); ctx.restore(); }
    // the booklet: on the desk → in his hand → in the professor's hand
    const deskB = [F_.x - 10 * F_.s, F_.y - 168 * F_.s];
    if (t < m.lift + .25) { ctx.save(); ctx.translate(...deskB); ctx.scale(1, .42); bookletObj(ctx, 0, 0, -.05, 1.2); ctx.restore(); }
    else if (t < m.handoff) { const k = clamp((t - m.lift - .25) / .3); ctx.save(); ctx.translate(yh[0], yh[1] - 10); ctx.scale(1, lerp(.42, 1, k)); bookletObj(ctx, 0, -40 * k, lerp(-.05, .12, k), 1.0); ctx.restore(); }
    else bookletObj(ctx, ph[0], ph[1] - 36, t > m.profOut ? .3 : .12, 1.0);
    drawP(ctx, YOU, yp, F_.x, F_.y, F_.s, L_ROOM, { noShadow: true, only: [3] });
    if (t < m.handoff + .1 && t > m.grip - .4) drawP(ctx, PROF, pp, pr.x, A.y, A.s, L_ROOM, { noShadow: true, only: [3] });
    dust(ctx, t, 0, 300, 1080, 1300, 60, 9, '#FFF2CF', .75);
  });
  finish(ctx, { vig: .5, bl: .28, grade: ['#FFB45A', .14, 'soft-light'] });
}

// =====================================================================
// 2. THE BUS
// =====================================================================
function shotBusExt(ctx, t) {
  const u = t - M.busExt, scroll = 1400 + u * 520, bob = Math.sin(t * 9.3) * 2 + Math.max(0, Math.sin(t * 2.1 + 1)) ** 8 * 5;
  cam(ctx, { x: 540 + u * 6, y: 1200, z: kf(u, [[0, 1.18], [2.5, 1.24, 'lin']]) }, () => {
    S2.busExterior(ctx, t, { scroll });
    S2.bus(ctx, t, kf(u, [[0, 170], [2.5, 96, 'lin']]), 1440, { wheelA: -scroll / 60, bob });
    dust(ctx, t, -100, 500, 1300, 900, 40, 13, '#FFDFA0', .7);
  });
  finish(ctx, { vig: .5, bl: .36, grade: ['#FFB060', .12, 'soft-light'] });
}
const L_BUS = mkL(.18, .98, { rim: '#FFD08A', rimW: 7, rimA: 1, shadeA: .22, shade: '#4A3F6B', shadow: null });
const BUSY = 1625, BS = 1.05, YX = 770, MX = 330;
function busPoses(t) {
  const m = M, sway = Math.sin(t * 2.3) * 3 + Math.sin(t * 5.1) * 1.2;
  const y = (...o) => P_(YOU, seat(YOU, { lL: { x: -88 }, lR: { x: -58 } }), ...o);
  const relax = y({ face: -.2, shrug: .2, head: { tilt: .05 }, e: { ...X.content, eyeOpen: 1, lidT: .45, mS: .55, gx: -.2 }, aL: { to: [-54, -168], k: 1 }, aR: { to: [40, -172], k: -1 } });
  const listen = y({ face: -.45, shrug: .2, head: { turn: -.15, tilt: .03 }, e: { ...X.proud, lidT: .3, gx: -.8 }, aL: { to: [-54, -168], k: 1 }, aR: { to: [40, -172], k: -1 } });
  const shrug = y({ face: -.45, shrug: 1.1, head: { turn: -.15, tilt: -.07 }, e: { ...X.smug, gx: -.8 }, aL: { to: [-110, -230], k: 1, hand: 'open' }, aR: { to: [100, -230], k: -1, hand: 'open' } });
  const thumb = y({ face: -.5, shrug: .5, head: { turn: -.2, tilt: -.05 }, e: { ...X.proud, gx: -.85 }, aL: { to: [-128, -246], k: 1, hand: 'thumb', z: 1 }, aR: { to: [40, -172], k: -1 } });
  const s02 = lineT('s02'), c01 = lineT('c01');
  let yp = pk(YOU, t, [[m.busIn, relax], [c01.t0 + .25, relax], [c01.t0 + .6, listen], [m.shrug - .2, listen], [m.shrug + .1, shrug, 'back'], [m.thumb - .1, shrug], [m.thumb + .15, thumb, 'back']]);
  yp = talk(idle({ ...yp, hipY: yp.hipY + sway * .6 }, t, 0, .6), 'YOU', t);
  const mt = (...o) => P_(MATE, seat(MATE, { lL: { x: -88 }, lR: { x: -58 } }), ...o);
  const fwd = mt({ face: -.55, e: { mS: .3, gx: -.5 }, aL: { to: [-54, -168], k: 1 }, aR: { to: [40, -172], k: -1 } });
  const ask = mt({ face: .5, lean: -.04, head: { turn: .25, tilt: .06 }, e: { mS: .5, browH: .4, gx: .7 }, aL: { to: [-30, -172], k: 1 }, aR: { to: [96, -232], k: -1, hand: 'open', z: 1 } });
  const nod = mt({ face: .5, lean: -.04, head: { turn: .25, tilt: .02, nod: .25 }, e: { ...X.happy, gx: .7 }, aL: { to: [-30, -172], k: 1 }, aR: { to: [60, -176], k: -1, z: 1 } });
  let mp = pk(MATE, t, [[m.busIn, fwd], [m.mateTurn, fwd], [m.mateTurn + .4, ask, 'back'], [s02.t1 - .3, ask], [s02.t1 + .1, nod]]);
  mp = talk(idle({ ...mp, hipY: mp.hipY + sway * .6 }, t, 3, .6), 'CLASSMATE', t);
  return { yp, mp, sway };
}
function shotBusIn(ctx, t) {
  const u = t - M.busIn, scroll = u * 900, { yp, mp, sway } = busPoses(t);
  cam(ctx, { x: 560, y: 1330 + sway * .5, z: 1.32, r: Math.sin(t * 1.7) * .004 }, () => {
    S2.busInterior(ctx, t, { scroll });
    S2.busSeat(ctx, YX + 30, BUSY, BS);
    drawP(ctx, YOU, yp, YX, BUSY, BS, L_BUS, { noShadow: true });
    S2.backpack(ctx, 905, 1530, .82);
    S2.busSeat(ctx, MX + 30, BUSY, BS);
    drawP(ctx, MATE, mp, MX, BUSY, BS, L_BUS, { noShadow: true });
    dust(ctx, t, 0, 400, 1080, 900, 30, 17, '#FFDFA0', .6);
  });
  finish(ctx, { vig: .5, bl: .3, grade: ['#FFB060', .1, 'soft-light'] });
  captions(ctx, t, capY);
}
function shotBusCu(ctx, t) {
  const u = t - M.busCu, scroll = (t - M.busIn) * 900;
  const z = kf(u, [[0, 1.42], [1.7, 1.5, 'lin']]);
  layerSoft(ctx, 'cuBg', g => cam(g, { x: 760, y: 900, z: 1.5 }, () => S2.busInterior(g, t, { scroll })), 9);
  const p = idle(P_(YOU, seat(YOU), { face: .3, head: { tilt: -.06, turn: .12 }, shrug: .3, e: { ...X.proud, lidT: .42, gx: .55, gy: -.1, mS: 1.05 } }), t, 0, .6);
  cam(ctx, zoomAt(540, 900, z), () => drawP(ctx, YOU, p, 540, 900 + 328 * 3.1, 3.1, mkL(-.4, .9, { rim: '#FFD08A', rimW: 3, rimA: 1, shadeA: .2, shadow: null }), { noShadow: true }));
  // sunlight sweeping across his face as trees pass
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 3; i++) { const x = ((scroll * .9 + i * 700) % 2100) - 500; ctx.globalAlpha = .22; ctx.fillStyle = lg(ctx, x - 200, 0, x + 200, 0, ['rgba(0,0,0,0)', '#FFC98A', 'rgba(0,0,0,0)']); ctx.fillRect(x - 200, 0, 400, H); }
  ctx.restore();
  finish(ctx, { vig: .55, bl: .34, grade: ['#FFB060', .12, 'soft-light'] });
}

// =====================================================================
// 3. THE EVENING
// =====================================================================
const BATH = { x: 540, y: 1912, s: 2.6 };
function shotBath(ctx, t) {
  const m = M, u = t - m.bath, B = BATH;
  const base = P_(YOU_NIGHT, { e: { ...X.sleepy, mS: .55 }, aL: { a: -.08, b: .1 } });
  const mouth = mouthL(YOU_NIGHT, base);
  const scrubbing = t > m.brushIn + .3 && t < m.brushOut, ph = (t - m.brushIn) * TAU * 3.1;
  const off = scrubbing ? [Math.sin(ph) * 11, Math.cos(ph) * 3] : [0, 0];
  const atMouth = [mouth[0] + 92 + off[0], mouth[1] + 52 + off[1]];
  const low = [44, -250], sink = [70, -150];
  const hk = kf(t, [[m.brushIn, 0], [m.brushIn + .35, 1, 'io'], [m.brushOut, 1], [m.brushOut + .3, 2, 'io']]);
  const hp = hk <= 1 ? [lerp(low[0], atMouth[0], hk), lerp(low[1], atMouth[1], hk)] : [lerp(atMouth[0], sink[0], hk - 1), lerp(atMouth[1], sink[1], hk - 1)];
  const tipT = [mouth[0] + 14, mouth[1] + 4], r = Math.atan2(-(tipT[1] - hp[1]), -(tipT[0] - hp[0]));
  const brushing = hk > .6 && hk < 1.4;
  let p = P_(YOU_NIGHT, base, {
    head: { tilt: brushing ? .05 + Math.sin(ph * .5) * .02 : -.03, nod: .05 },
    e: brushing ? { ...X.sleepy, lidT: .6, mO: .16, mS: .25, mW: .7 } : (t > m.tapOff ? { ...X.content, mS: .7 } : { ...X.sleepy, mS: .55 }),
    aR: { to: hp, k: -1, z: 1, prop: { n: 'brush', r: brushing ? r : -.6 + (hk - 1) * .3 } },
  });
  p = idle(p, t, 2, .5);
  cam(ctx, { x: 540, y: 960, z: kf(u, [[0, 1.0], [2.9, 1.03, 'lin']]) }, () => {
    S2.bathroom(ctx, t);
    drawP(ctx, YOU_NIGHT, p, B.x, B.y, B.s, mkL(.08, .99, { rim: '#FFE2A8', rimW: 6, rimA: .95, shadeA: .22, shadow: null }), { noShadow: true });
    if (brushing) { const mw = [B.x + (mouth[0] + 16) * B.s, B.y + (mouth[1] + 6) * B.s]; for (let i = 0; i < 4; i++) circ(ctx, mw[0] + Math.sin(i * 2.3 + t * 3) * 10, mw[1] + Math.cos(i * 1.7 + t * 4) * 6, 5 + (i % 2) * 3, rgba('#FFFFFF', .9)); }
    ctx.save(); ctx.translate(0, -90); S2.sinkFront(ctx, t, { tap: kf(t, [[m.tapOn, 0], [m.tapOn + .08, 1], [m.tapOff - .05, 1], [m.tapOff + .05, 0]]) }); ctx.restore();
  });
  finish(ctx, { vig: .5, bl: .3, grade: ['#FFB060', .1, 'soft-light'] });
}
const GL = { x: 330, y: 1690, s: .95, base: [200, 1450] }, L_LAMP = mkL(.86, .5, { rim: '#FFD08A', rimW: 5, rimA: 1, shadeA: .3, shade: '#2A2448', shadow: null });
function shotGlass(ctx, t) {
  const m = M, u = t - m.glass, G = GL, s = G.s;
  const sitO = { hipY: 76.6, legS: .55, lL: { x: -58, k: 1 }, lR: { x: 58, k: -1 } };
  const look = P_(YOU_NIGHT, sitO, { face: -.3, head: { turn: -.15, nod: .2 }, e: { ...X.sleepy, gx: -.6, gy: .3, mS: .45 }, aR: { to: [70, -120], k: -1 } });
  const drink = P_(YOU_NIGHT, sitO, { face: -.15, head: { nod: -.35, tilt: -.1 }, e: { ...X.content, mS: .1, mW: .5 }, aR: { to: [70, -120], k: -1 } });
  const after = P_(YOU_NIGHT, sitO, { face: -.2, head: { nod: .05, tilt: .04 }, e: { ...X.content, mS: .65 }, aR: { to: [70, -120], k: -1 } });
  let p = pk(YOU_NIGHT, t, [[m.glass, look], [m.grab + .1, look], [m.sip, drink], [m.swallow + .25, drink], [m.lower + .2, look], [m.release + .2, after]]);
  if (t > m.swallow && t < m.swallow + .3) { const k = Math.sin((t - m.swallow) / .3 * Math.PI); p = { ...p, head: { ...p.head, oy: (p.head.oy || 0) + k * 5 } }; }
  // the glass: on the table → in the hand → at the lips → back
  const mo = mouthL(YOU_NIGHT, p), mw = [G.x + mo[0] * s, G.y + mo[1] * s];
  const gs = .9, rot = kf(t, [[m.grab + .1, 0], [m.sip, .55], [m.swallow + .25, .62], [m.lower + .15, 0]]);
  const R = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const rimAt = [mw[0] - 6, mw[1] + 4], baseLips = [rimAt[0] - R([0, -84 * gs], rot)[0], rimAt[1] - R([0, -84 * gs], rot)[1]];
  const lift = kf(t, [[m.grab + .1, 0], [m.sip, 1, 'io'], [m.lower, 1], [m.setDown, 0, 'io']]);
  const base = [lerp(G.base[0], baseLips[0], lift), lerp(G.base[1], baseLips[1], lift)];
  const grip = [base[0] + R([0, -34 * gs], rot)[0], base[1] + R([0, -34 * gs], rot)[1]];
  const reach = kf(t, [[m.glass, 0], [m.grab, 1, 'io'], [m.release, 1], [m.release + .35, 0, 'io']]);
  const restL = [-64, -122], gl = toLocal(G.x, G.y, s, grip[0] + 14, grip[1]);
  p = { ...p, aL: { to: [lerp(restL[0], gl[0], reach), lerp(restL[1], gl[1], reach)], k: 1, z: 1, hand: reach > .5 ? 'fist' : 'open' } };
  p = idle(p, t, 4, .5);
  const level = kf(t, [[m.sip + .1, .8], [m.lower, .5, 'lin']]);
  cam(ctx, { x: kf(u, [[0, 300], [2.8, 310]]), y: 1390, z: kf(u, [[0, 1.86], [2.8, 1.95, 'lin']]) }, () => {
    S2.bedroom(ctx, t, { lamp: 1, noGlass: true });
    drawP(ctx, YOU_NIGHT, p, G.x, G.y, s, L_LAMP, { noShadow: true, only: [0, 1, 2] });
    S2.glassAt(ctx, base[0], base[1], gs, level, rot);
    drawP(ctx, YOU_NIGHT, p, G.x, G.y, s, L_LAMP, { noShadow: true, only: [3] });
  });
  finish(ctx, { vig: .58, bl: .3, grade: ['#FF9A50', .1, 'soft-light'] });
}
// the bedroom wide: walk in, sit, lie down, blanket, exhale
const L_BED = mkL(.86, .45, { rim: '#FFD08A', rimW: 5, rimA: .9, shadeA: .3, shade: '#1E1A3A', shadow: null });
function bedPose(t) {
  const m = M, s = .95, floor = S2.BED.floor;
  const R = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  if (t < m.walkEnd) {
    const k = clamp((t - m.bed) / (m.walkEnd - m.bed)), x = lerp(1250, 660, EASE.o(k) * .3 + k * .7);
    const p = idle(P_(YOU_NIGHT, { face: -.85, ...walk((t - m.bed) * 1.7, -1, { stride: 38 }), e: { ...X.sleepy, gx: -.4 } }), t, 1, .5);
    return { p, x, y: floor, s, a: 0, pivot: null };
  }
  const sitO = { hipY: 76.6, legS: .55, lL: { x: -58, k: 1 }, lR: { x: 58, k: -1 } };
  const stand = P_(YOU_NIGHT, { face: -.3, e: { ...X.sleepy } });
  const sit = P_(YOU_NIGHT, sitO, { lean: -.06, e: { ...X.sleepy, mS: .6 }, aL: { to: [-84, -120], k: 1, hand: 'open' }, aR: { to: [84, -120], k: -1, hand: 'open' } });
  const lie = P_(YOU_NIGHT, { face: .9, hipY: 0, legS: 1, lL: { x: -8, y: 0 }, lR: { x: 8, y: 0 }, head: { nod: -.05 }, e: { ...X.asleep, mS: .45 }, aL: { a: -.05, b: .05 }, aR: { a: .1, b: .1 } });
  let p = pk(YOU_NIGHT, t, [[m.walkEnd, stand], [m.sit, sit, 'io'], [m.lie0, sit], [m.lie1, lie, 'io']]);
  const a = -Math.PI / 2 * EASE.io(clamp((t - m.lie0) / (m.lie1 - m.lie0)));
  const J = solve(YOU_NIGHT, p), x0 = 660;
  const hipSit = [x0 + J.hip[0] * s, floor + J.hip[1] * s];
  const pv = [lerp(hipSit[0], 720, EASE.io(clamp((t - m.lie0) / (m.lie1 - m.lie0)))), lerp(hipSit[1], S2.BED.top - 42, EASE.io(clamp((t - m.lie0) / (m.lie1 - m.lie0))))];
  const cx = pv[0] - J.hip[0] * s, cy = pv[1] - J.hip[1] * s;
  // pulling the blanket: the near hand follows the blanket's edge
  const edge = blanketEdge(t);
  if (t > m.blanket0 - .3) {
    const W_ = [edge + 10, S2.BED.top - 58], Uu = R([W_[0] - pv[0], W_[1] - pv[1]], -a), loc = [(pv[0] + Uu[0] - cx) / s, (pv[1] + Uu[1] - cy) / s];
    const k = clamp((t - m.blanket0 + .3) / .3);
    p = { ...p, aR: { to: [lerp(40, loc[0], k), lerp(-200, loc[1], k)], k: 1, z: 1, hand: 'fist' } };
  }
  if (t > m.exhale) { const k = Math.sin(clamp((t - m.exhale) / 1.2) * Math.PI); p = { ...p, shrug: (p.shrug || 0) - k * .35, e: { ...p.e, ...X.asleep, mO: .2 * k } }; }
  p = idle(p, t, 1, .4);
  return { p, x: cx, y: cy, s, a, pivot: pv };
}
const blanketEdge = t => lerp(860, 560, EASE.io(clamp((t - M.blanket0) / (M.blanket1 - M.blanket0))));
function shotBed(ctx, t) {
  const m = M, u = t - m.bed, b = bedPose(t);
  const drawYou = (only) => {
    ctx.save(); if (b.pivot) { ctx.translate(b.pivot[0], b.pivot[1]); ctx.rotate(b.a); ctx.translate(-b.pivot[0], -b.pivot[1]); }
    drawP(ctx, YOU_NIGHT, b.p, b.x, b.y, b.s, b.a < -.01 ? mkL(.86 * Math.cos(-b.a) - .45 * Math.sin(-b.a), .86 * Math.sin(-b.a) + .45 * Math.cos(-b.a), { rim: '#FFD08A', rimW: 5, rimA: .9, shadeA: .3, shade: '#1E1A3A', shadow: null }) : L_BED, { noShadow: true, only });
    ctx.restore();
  };
  cam(ctx, { x: kf(u, [[0, 640], [5.2, 560, 'io']]), y: kf(u, [[0, 1270], [5.2, 1420, 'io']]), z: kf(u, [[0, 1.08], [5.2, 1.42, 'io']]) }, () => {
    S2.bedroom(ctx, t, { lamp: 1 });
    drawYou([0, 1, 2]);
    S2.blanket(ctx, t, blanketEdge(t), { breathe: t > m.exhale ? (Math.sin((t - m.exhale) * 1.6) + 1) / 2 : 0 });
    drawYou([3]);
  });
  finish(ctx, { vig: .6, bl: .3, grade: ['#3A3A8A', .12, 'multiply'] });
}

// =====================================================================
// 4–5. NIGHT: the sleeping face (overhead), the mind-space, the reveal
// =====================================================================
const FACE_S = 3.6;
export function sleepFace(g, t, e, { cx = 540, cy = 860, s = FACE_S, lift = 0, breathe = 0, tint = null } = {}) {
  const p0 = P_(YOU_NIGHT, { e, head: { oy: 0 } }), J = solve(YOU_NIGHT, p0);
  const sc = s * (1 + lift * .06), gx = cx - J.hc[0] * sc, gy = cy - lift * 46 - J.hc[1] * sc;
  S2.pillowBed(g, t, cx, cy + 40, 1.25 + lift * .03);
  drawP(g, YOU_NIGHT, p0, gx, gy, sc, mkL(.55, .83, { rim: '#FFD9A0', rimW: 2.2, rimA: .9, shadeA: .22, shade: '#2A2448', shadow: null }), { noShadow: true, only: [1, 2], ...(tint ? { tint } : {}) });
  S2.chinBlanket(g, t, cy + YOU_NIGHT.R * sc * .98, { breathe, lift });
  // moonlight from the window side, the lamp warm on the other
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = lg(g, 0, 0, 1080, 0, ['#FFE9C8', '#C9CCF2', '#7C82C8']); g.globalAlpha = .55; g.fillRect(-500, -500, 2100, 2900); g.restore();
}
const breath = t => (Math.sin(t * 1.25) + 1) / 2;
function shotSleep(ctx, t) {
  const u = t - M.sleep, z = kf(u, [[0, 1.0], [2.6, 1.16, 'lin']]);
  cam(ctx, zoomAt(540, 860, z), () => sleepFace(ctx, t, { ...X.asleep, mO: breath(t) * .05 }, { breathe: breath(t) }));
  finish(ctx, { vig: .62, bl: .26, grade: ['#3A3A8A', .14, 'multiply'] });
}
function mindBg(ctx, t, dk, faceA) {
  S2.mindSpace(ctx, t, { dark: dk });
  // his sleeping face, huge and soft behind the thought: we are inside his head
  const g = tmp('ghost', W, H); g.save(); g.translate(540, 760); g.scale(1.7, 1.7); g.translate(-540, -860); sleepFace(g, t, X.asleep, { breathe: breath(t) }); g.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = faceA; ctx.filter = 'blur(12px) saturate(.5)'; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(g.canvas, 0, 0); ctx.restore();
  wash(ctx, W, H, mix('#3A2C6E', '#1C1438', dk), .5, 'multiply');
}
function brainState(t) {
  const m = M, b03 = lineT('b03'), b05 = lineT('b05'), b06 = lineT('b06');
  let e = BX.casual;
  if (t >= m.mind2) e = bmix(BX.casual, BX.scared, EASE.io(clamp((t - b05.t0 + .25) / .9)));
  if (t >= b06.t1 - .25) e = bmix(e, BX.covered, EASE.o(clamp((t - b06.t1 + .25) / .3)));
  // blinks (casual only)
  if (t < m.mind2) { const ph = (t - m.mind) % 2.7; if (ph > 2.45 && ph < 2.6) e = { ...e, lidT: 1 }; }
  else if (t < b05.t0) { const ph = t - m.mind2; if (ph > .1 && ph < .22) e = { ...e, lidT: 1 }; }
  // looks at us after "you sleeping?"
  if (t > b03.t1 + .2 && t < m.mind2) e = { ...e, gx: 0, gy: 0, lidT: .3 };
  return e;
}
function shotMind(ctx, t, which) {
  const m = M, e = brainState(t);
  const t0 = which === 1 ? m.mind : which === 2 ? m.mind2 : m.mind3, u = t - t0;
  const dk = which === 1 ? 0 : which === 2 ? kf(u, [[0, .3], [3, .6, 'lin']]) : .75;
  mindBg(ctx, t, dk, which === 1 ? .32 : .22);
  const enter = which === 1 ? EASE.o(clamp(u / 1.0)) : 1;
  const s = which === 1 ? .95 : which === 2 ? kf(u, [[0, 1.12], [3, 1.3, 'lin']]) : kf(u, [[0, 1.42], [1.8, 1.5, 'lin']]);
  const y = (which === 1 ? lerp(1500, 880, enter) : 860) + Math.sin(t * 1.3) * 14 * (1 - (e.shake || 0) * .6);
  ctx.save(); ctx.translate(540, y); ctx.rotate(Math.sin(t * .9) * .035 * (1 - (e.shake || 0) * .7) + (which === 1 && t > lineT('b03').t1 ? .06 : 0)); ctx.translate(-540, -y);
  drawBrain(ctx, 540, y, s, e, voice('BRAIN', t), t, { alpha: which === 1 ? clamp(u / .4) : 1 });
  ctx.restore();
  finish(ctx, { vig: .7 + dk * .15, bl: .3, grade: which === 1 ? null : ['#6E648F', .12 + dk * .15, 'multiply'] });
  captions(ctx, t, 1530);
}
function shotFace(ctx, t) {
  const u = t - M.face, m = voice('YOU', t);
  let e = { ...X.mumble, mO: m > .08 ? .06 + m * .22 : 0, mW: .45 };
  if (lineT('s04').t1 < t) e = { ...X.asleep, browA: .2 };
  cam(ctx, zoomAt(540, 860, kf(u, [[0, 1.2], [2.8, 1.24, 'lin']])), () => sleepFace(ctx, t, e, { breathe: breath(t) }));
  finish(ctx, { vig: .66, bl: .24, grade: ['#3A3A8A', .16, 'multiply'] });
  captions(ctx, t, 1530);
}
function shotTwitch(ctx, t) {
  const u = t - M.twitch, flick = (a, b) => u > a && u < b;
  let e = { ...X.asleep };
  if (flick(.12, .2) || flick(.32, .38)) e = { ...X.twitch, eyeOpen: .2, lidT: .7 };
  else if (u > .1) e = { ...X.twitch };
  cam(ctx, zoomAt(470, 862, 3.1), () => sleepFace(ctx, t, e, { breathe: breath(t) * .5 }));
  wash(ctx, W, H, '#5A4E8A', .22, 'multiply');
  finish(ctx, { vig: .75, bl: .2 });
  captions(ctx, t, 1530);
}
function shotFlash(ctx, t) {
  const u = t - M.flash;
  cam(ctx, zoomAt(540, 960, kf(u, [[0, 1.0], [.8, 1.07, 'lin']])), () => { S2.deskTop(ctx, t); S2.memoryPage(ctx, t, 540, 980, 1.02); });
  wash(ctx, W, H, '#8C86B0', .22, 'multiply'); wash(ctx, W, H, '#C9C6E8', .2, 'soft-light');
  finish(ctx, { vig: .7, bl: .35 });
  const fl = kf(u, [[0, 1], [.14, 0, 'o']]); if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = '#FFFBF0'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
function shotFinal(ctx, t) {
  const m = M, u = t - m.final, sn = t - m.snap;
  let e = { ...X.twitch, browA: .55 }, lift = 0;
  if (sn >= 0) {
    const k = EASE.o(clamp(sn / .16)), kb = EASE.back(clamp(sn / .12));
    e = { ...X.awake, eyeOpen: lerp(1.0, 1.42, k), pup: lerp(1, .3, EASE.o(clamp((sn - .03) / .14))), browH: lerp(-.25, .02, kb), browA: lerp(.2, .5, kb), browC: .5, mO: lerp(0, .55, EASE.o(clamp((sn - .05) / .2))), pale: lerp(0, .75, k), gloom: lerp(0, .4, k), sweat: lerp(0, .9, k) };
    lift = EASE.o(clamp(sn / .5)) * .9;
  }
  const punch = t >= m.strike ? 1 + .045 * EASE.o(clamp((t - m.strike) / .06)) : 1;
  cam(ctx, zoomAt(540, 860, 1.18 * punch), () => sleepFace(ctx, t, e, { lift, breathe: sn < 0 ? breath(t) : 0 }));
  wash(ctx, W, H, '#4A4278', sn >= 0 ? .3 : .2, 'multiply');
  finish(ctx, { vig: .72, bl: .24 });
}

// =====================================================================
export function renderFilm(ctx, t) {
  const m = M;
  if (t < m.exWide) return shotInsert(ctx, t);
  if (t < m.busExt) return shotClass(ctx, t);
  if (t < m.busIn) return shotBusExt(ctx, t);
  if (t < m.busCu) return shotBusIn(ctx, t);
  if (t < m.bath) return shotBusCu(ctx, t);
  if (t < m.glass) return shotBath(ctx, t);
  if (t < m.bed) return shotGlass(ctx, t);
  if (t < m.sleep) return shotBed(ctx, t);
  if (t < m.mind) return shotSleep(ctx, t);
  if (t < m.face) return shotMind(ctx, t, 1);
  if (t < m.mind2) return shotFace(ctx, t);
  if (t < m.twitch) return shotMind(ctx, t, 2);
  if (t < m.mind3) return shotTwitch(ctx, t);
  if (t < m.flash) return shotMind(ctx, t, 3);
  if (t < m.final) return shotFlash(ctx, t);
  if (t < m.black) return shotFinal(ctx, t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
}
