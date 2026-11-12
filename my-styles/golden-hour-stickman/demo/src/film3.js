// Sequence 3 (post-exam spiral) and sequence 4 (the classroom genius).
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, wash, rnd } from './kit.js';
import { X, YOU, JACK, TEACHER, STU_A, STU_B, STU_C, STU_E } from './cast.js';
import * as S from './sets.js';
import { W, H, cam, layerSoft, seat, finish, mkL, L_HALL, L_RIGHT, writing } from './shots.js';
import { TL, M, kf, pk, P_, idle, talk, speaking, lineT, captions, drawP, zoomAt } from './anim.js';

// ================= 3. POST-EXAM =================
let K3 = null;
function keys3() {
  if (K3) return K3;
  const m = M, l = lineT, y = (...o) => P_(YOU, ...o);
  const base = { shrug: .9, lL: { x: -16 }, lR: { x: 16 }, aL: { a: -.06, b: .06 }, aR: { a: .06, b: -.06 } };
  const dazed = y(base, { face: .1, head: { nod: .3, tilt: .05 }, e: { ...X.hollow, gloom: .5, pale: .5, gy: .4 } });
  const turn = y(base, { face: -.35, head: { turn: -.2, tilt: -.04 }, e: { ...X.deadpan, lidT: .3, gx: -.7, browA: .4, browAsym: .5 } });
  const listen = y(base, { face: -.35, shrug: .5, head: { turn: -.15 }, e: { eyeOpen: 1, gx: -.6, browH: .2, mS: .1, mW: .6 } });
  const nod = y(base, { face: -.35, shrug: .3, head: { turn: -.15, nod: .25 }, e: { eyeOpen: 1, gx: -.6, browH: .3, mS: .5, mW: .7 } });
  const freeze = y(base, { face: -.2, shrug: 1, head: { turn: -.05 }, e: { eyeOpen: 1.25, pup: .6, gx: -.2, browH: .6, browA: .3, mS: .35, mW: .7 } });
  const dawning = y(base, { face: 0, shrug: 1.2, e: { eyeOpen: 1.45, pup: .36, browH: .9, browA: .7, mS: -.2, mW: .4, pale: .5, sweat: .6 } });
  const hollow = y(base, { face: 0, shrug: 1.3, e: { ...X.hollow, sweat: .8 } });
  K3 = { you: [[m.s3, dazed], [l('j15').t0 + .6, dazed], [l('j15').t0 + 1.5, turn], [l('a16').t0, turn], [l('a16').t0 + .5, listen], [l('j17').t0 + .9, listen], [l('j17').t1, nod], [l('b18').t1 - .2, nod],
    [m.s3_cu + .25, freeze], [m.s3_cu + .7, freeze], [m.s3_flash, dawning, 'i'], [m.s3_cu2, dawning], [m.s3_cu2 + .25, hollow]], hollow };
  return K3;
}
const G3 = { jack: 545, a: 790, b: 1010, you: 1290 }, S3 = 1.28;
function group3(t, toYou = 0) {
  const j = talk(idle(P_(JACK, { face: .35, head: { tilt: .04 }, e: { ...X.chill, gx: .5, browH: speaking('JACK', t) ? .3 : 0 }, aL: { to: [-30, -250], k: 1, z: 1 }, aR: { a: .35, b: speaking('JACK', t) ? 1.2 : .3, hand: 'open', z: 1 } }), t, 1), 'JACK', t);
  const sa = speaking('STUDENT A', t), a = talk(idle(P_(STU_A, { face: -.35, head: { tilt: -.05 }, e: { mS: .5, browH: sa ? .5 : .1, gx: -.5 }, aL: { a: -.5, b: sa ? -1.5 + Math.sin(t * 6) * .15 : -.4, hand: 'open', z: 1 }, aR: { a: .1, b: -.1 } }), t, 2), 'STUDENT A', t);
  const sb = speaking('STUDENT B', t), b = talk(idle(P_(STU_B, { face: -.4, head: { nod: sb ? .2 + Math.sin(t * 9) * .15 : 0 }, e: { mS: .6, gx: -.5, browH: .2 }, aL: { a: -.1, b: .1 }, aR: sb ? { to: [60, -330], k: -1, z: 1, hand: 'thumb' } : { a: .12, b: -.1 } }), t, 3), 'STUDENT B', t);
  return { j, a, b };
}
function paperInsert(ctx, t, u) {
  ctx.fillStyle = '#EFE4CB'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(540, 960); const z = 1.02 + u * .1; ctx.scale(z, z); ctx.rotate(.035 - u * .01); ctx.translate(-540, -960);
  fillR(ctx, -100, -100, 1300, 2200, P.paper); for (let i = 0; i < 26; i++) line(ctx, -100, 180 + i * 96, 1200, 180 + i * 96, rgba(P.lav, .4), 3, 'butt'); line(ctx, 150, -100, 150, 2100, rgba(P.rose, .7), 4, 'butt');
  text(ctx, 'Q7.', 60, 520, { size: 60, col: P.ink, align: 'left' });
  text(ctx, 'Name the bone of the upper arm.', 190, 520, { size: 58, font: F.ui, weight: '600', col: P.ink, align: 'left' }); text(ctx, '(2 marks)', 190, 600, { size: 40, font: F.ui, col: P.lavDeep, align: 'left' });
  text(ctx, 'Answer:', 190, 800, { size: 46, font: F.ui, col: P.lavDeep, align: 'left' });
  text(ctx, 'BICEPS', 200, 960, { size: 190, font: F.script, weight: '700', col: P.indigo, align: 'left', rot: -.03 }); text(ctx, 'BRACHII', 230, 1150, { size: 190, font: F.script, weight: '700', col: P.indigo, align: 'left', rot: -.02 });
  ctx.strokeStyle = P.indigo; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(210, 1250); ctx.quadraticCurveTo(520, 1225, 850, 1262); ctx.moveTo(230, 1285); ctx.quadraticCurveTo(540, 1262, 830, 1296); ctx.stroke();
  text(ctx, 'easy!', 760, 1420, { size: 96, font: F.script, weight: '700', col: P.indigo, rot: -.12 }); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(930, 1400, 44, 0, TAU); ctx.moveTo(912, 1404); ctx.quadraticCurveTo(930, 1426, 948, 1404); ctx.stroke(); circ(ctx, 915, 1386, 6, P.indigo); circ(ctx, 945, 1386, 6, P.indigo);
  ctx.restore();
  wash(ctx, W, H, '#8C86B0', .22, 'multiply'); finish(ctx, { vig: .85, bl: .2, inner: .25 });
  const fl = Math.max(0, 1 - u * 9); if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; fillR(ctx, 0, 0, W, H, '#FFFFFF'); ctx.restore(); }
}
export function seq3(ctx, t) {
  const m = M, K = keys3();
  if (t >= m.s3_flash && t < m.s3_cu2) return paperInsert(ctx, t, (t - m.s3_flash) / (m.s3_cu2 - m.s3_flash));
  if (t >= m.s3_spiral) return spiral(ctx, t, (t - m.s3_spiral) / (m.s4 - m.s3_spiral));
  const cu = t >= m.s3_cu, c = cu ? { x: 1290, y: 905, z: kf(t, [[m.s3_cu, 2.0], [m.s3_flash, 2.3, 'lin'], [m.s3_cu2, 2.35], [m.s3_spiral, 2.55, 'lin']]) } : { x: 930, y: 1010, z: kf(t, [[m.s3, 1], [m.s3_cu, 1.06, 'lin']]) };
  const g = group3(t), yp = idle(pk(YOU, t, K.you), t, 0, cu ? .3 : .8);
  const draw = (cx, blur) => {
    const body = gg => cam(gg, c, () => { S.hallFlat(gg, t, { hh: 11, mm: 5 });
      drawP(gg, JACK, g.j, G3.jack, 1400, S3, L_HALL); drawP(gg, STU_A, g.a, G3.a, 1400, S3 * .95, L_HALL); drawP(gg, STU_B, g.b, G3.b, 1400, S3 * .97, L_HALL); });
    if (blur > .4) { fillR(cx, 0, 0, W, H, '#EBD3A8'); layerSoft(cx, 'bg3', body, blur); } else body(cx);
  };
  draw(ctx, cu ? kf(t, [[m.s3_cu, 2], [m.s3_flash, 6]]) : 0);
  cam(ctx, c, () => drawP(ctx, YOU, yp, G3.you, 1400, S3, L_HALL));
  const dark_ = cu ? kf(t, [[m.s3_cu, 0], [m.s3_flash, .5], [m.s3_cu2, .7]]) : 0;
  if (dark_ > 0) wash(ctx, W, H, '#7A6FA8', dark_ * .3, 'multiply');
  finish(ctx, { vig: .46 + dark_ * .4 }); captions(ctx, t, cu ? 1560 : 1500);
}
// the dolly-zoom: the corridor stretches, the others stay close and soft, YOU recede
function spiral(ctx, t, u) {
  const e = u * u * (3 - 2 * u), hb = TL.EV.filter(v => v.type === 'hb').reduce((a, v) => Math.max(a, t >= v.t ? Math.exp(-(t - v.t) * 9) : 0), 0);
  const o = { vy: lerp(940, 1010, e), f: lerp(900, 540, e), Wc: lerp(160, 190, e), Hc: lerp(330, 600, e), eye: 150, zn: 55, zf: lerp(2300, 5200, e), stretch: lerp(1, 1.75, e), mood: e, haze: mix('#F7DDAE', '#E6D3DA', e) };
  let C; const zz = 1 + hb * .018 * (0.4 + e);
  ctx.save(); ctx.translate(540, 1000); ctx.scale(zz, zz); ctx.translate(-540, -1000);
  const bgf = g => { C = S.corridor(g, t, o); };
  if (e > .1) { fillR(ctx, 0, 0, W, H, '#E6D3DA'); layerSoft(ctx, 'bg', bgf, e * 2.6); } else bgf(ctx);
  wash(ctx, W, H, '#7A6FA8', e * .3, 'multiply');
  const at = (Xw, Z) => { const p = C.pr(Xw, C.fl, Z); return { x: p[0], y: p[1], s: C.s(Z) }; };
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rg(ctx, 540, 1130, 10, 330, [rgba('#FFF0C8', .5 * e), 'rgba(0,0,0,0)']); ctx.fillRect(0, 700, W, 800); ctx.restore();
  const a = at(lerp(46, 0, e), lerp(196, 440, e));
  const yp = idle(P_(YOU, { ...keys3().hollow, e: { ...X.hollow, pup: lerp(.3, .2, e), sweat: .8 } }), t, 0, .25);
  drawP(ctx, YOU, yp, a.x, a.y, a.s, mkL(-.5, .86, { rimW: 6, shadow: { kx: -.5, ky: .5, a: .4, blur: 4, col: P.plum } }));
  const g = group3(t), fg = gg => {
    const L = mkL(-.76, .6, { shadow: null }), tn = { tint: ['#3A3460', .3 * e], noShadow: true };
    let q = at(lerp(140, 165, e), 262); drawP(gg, STU_B, { ...g.b, e: { ...g.b.e, mO: .15 + .3 * Math.abs(Math.sin(t * 7.3)) } }, q.x, q.y, q.s, L, tn);
    q = at(lerp(96, 120, e), lerp(190, 168, e)); drawP(gg, STU_A, { ...g.a, e: { ...g.a.e, mO: .2 + .4 * Math.abs(Math.sin(t * 8.1 + 1)) }, aL: { a: -.6, b: -1.4 + Math.sin(t * 5) * .2, hand: 'open', z: 1 } }, q.x, q.y, q.s, L, tn);
    q = at(lerp(-100, -120, e), lerp(196, 176, e)); drawP(gg, JACK, { ...g.j, e: { ...g.j.e, mO: .15 + .35 * Math.abs(Math.sin(t * 6.4 + 2)) }, aR: { a: .5, b: 1.3 + Math.sin(t * 4) * .2, hand: 'open', z: 1 } }, q.x, q.y, q.s, L, tn);
  };
  if (e > .04) layerSoft(ctx, 'fg', fg, .5 + e * 10); else fg(ctx);
  ctx.restore();
  finish(ctx, { vig: lerp(.5, .9, e), bl: .18, inner: lerp(.35, .2, e), vc: [.5, .58] });
}

// ================= 4. THE CLASSROOM GENIUS =================
let K4 = null;
function keys4() {
  if (K4) return K4;
  const m = M, l = lineT, yb = { aL: { to: [-52, -168], k: 1 }, aR: { to: [56, -170], k: -1, prop: { n: 'pencil', r: -.5, dy: -18 } } }, y = (...o) => P_(YOU, seat(YOU), yb, ...o);
  const jb = { aL: { to: [-36, -204], k: 1 }, aR: { to: [36, -204], k: -1, prop: { n: 'phone', r: Math.PI / 2, back: 1, up: .5, glow: .55, dx: -36, dy: -4 } } }, j = (...o) => P_(JACK, seat(JACK), jb, ...o);
  const notes = y({ head: { nod: .8 }, e: { gy: .8, lidT: .2, mS: .1 } });
  const front = y({ head: { nod: 0 }, e: { gy: -.1, mS: .15, browH: .2 } });
  const notice = y({ face: -.25, head: { turn: -.3, tilt: -.05, nod: .2 }, e: { gx: -.75, gy: .5, browAsym: .5, mS: .2 } });
  const smirk = y({ face: -.3, head: { turn: -.3, tilt: -.07 }, shrug: .2, e: { ...X.smug, gx: -.75, gy: .25 } });
  const grin = y({ face: -.2, head: { turn: -.2, tilt: -.1 }, shrug: .5, e: { ...X.smug, mO: .35, mS: 1, gx: -.7, lidB: .4 } });
  const stun = y({ face: -.3, head: { turn: -.3 }, shrug: 1, e: { ...X.shocked, gx: -.8, mO: .3 } });
  const atPhone = y({ face: -.3, head: { turn: -.3, nod: .5 }, shrug: 1, e: { ...X.shocked, gx: -.7, gy: .8, mO: .2 } });
  const atTeacher = y({ face: -.45, head: { turn: -.5, nod: -.2 }, shrug: 1, e: { ...X.shocked, gx: -.9, gy: -.4, mO: .25 } });
  const how = y({ face: -.3, head: { turn: -.25, tilt: .05 }, shrug: 1.4, sq: -.2, e: { ...X.how, gx: -.6 } });
  const beaten = y({ face: -.3, head: { turn: -.3, tilt: -.06 }, shrug: .2, e: { ...X.deadpan, gx: -.8, browA: .3, lidT: .4 } });
  const game = j({ head: { nod: .9, tilt: .04 }, shrug: -.2, e: { ...X.chill, gy: .85, lidT: .52 } });
  const upF = j({ head: { nod: .05, tilt: -.03 }, shrug: .1, e: { ...X.hmm, mO: 0, gy: -.1, browH: .4 } });
  const upT = j({ face: -.15, head: { nod: 0, turn: -.3, tilt: -.05 }, e: { ...X.chill, lidT: .34, gx: -.6, gy: -.35 } });
  const win = j({ head: { nod: .85, tilt: .06 }, e: { ...X.score, gy: .8 } });
  const a = { t21: l('t21'), j22: l('j22'), j26: l('j26'), y28: l('y28'), j29: l('j29') };
  K4 = {
    you: [[m.s4, notes], [m.s4_two + .9, notes], [m.s4_two + 1.3, notice], [m.s4_two + 2.0, smirk], [m.s4_teacher, smirk], [m.s4_teacher + .2, front, 'o'], [m.s4_two2 + .3, front], [m.s4_two2 + .6, smirk], [a.j22.t1, grin], [m.s4_cuJ, grin],
      [a.j26.t0 + .5, grin], [a.j26.t0 + 1.6, stun], [m.s4_two3 + .2, stun], [m.s4_two3 + .55, atPhone], [m.s4_two3 + .95, atPhone], [m.s4_two3 + 1.25, atTeacher], [m.s4_two3 + 1.6, atTeacher], [a.y28.t0, how, 'back'], [a.y28.t1 + .2, how], [a.j29.t0 + .4, beaten]],
    jack: [[m.s4, game], [a.t21.t1 + .05, game], [m.s4_jackUp + .3, upF, 'o'], [a.j22.t1 + .1, upF], [a.j22.t1 + .5, game], [a.j26.t0 - .25, game], [a.j26.t0, upT, 'o'], [a.j26.t1, upT], [a.j26.t1 + .3, game], [a.j29.t0 - .5, game], [a.j29.t0 - .2, win]],
  };
  return K4;
}
function classScene(ctx, t, c, teach) {
  const m = M, K = keys4();
  cam(ctx, c, () => {
    S.room(ctx, t, { mode: 'class', hh: 2, mm: 40 });
    S.sunQuad(ctx, t, [[700, 960], [1040, 960], [820, 1960], [200, 1960]], { cols: 2, rows: 3, col: '#FFD08A', a: .42 });
    S.sunQuad(ctx, t, [[60, 330], [400, 270], [400, 760], [60, 820]], { cols: 2, rows: 3, col: '#FFD08A', a: .3, leaves: 9, seed: 6 });
    const Lb = { ...L_RIGHT, shadow: null }, dimO = { noShadow: true, tint: ['#F3D9AA', .26] };
    [[STU_E, -1, 0], [STU_B, 0, 1], [STU_A, 1, 2]].forEach(([chr, cc, k]) => { const x = 540 + cc * 380 * .56, o = idle(P_(chr, writing(chr, k, t), { head: { nod: k === 1 ? .9 : .1, tilt: (k - 1) * .05 }, e: { mS: .2, eyeOpen: 1, gy: k === 1 ? .8 : 0 } }), t, k + 5, .5);
      drawP(ctx, chr, o, x, 1112, .56, Lb, { ...dimO, only: [0, 1, 2] }); S.desk(ctx, x, 1112, .56, { paper: 1, filled: .5, dim: .1 }); drawP(ctx, chr, o, x, 1112, .56, Lb, { ...dimO, only: [3] }); });
    if (teach) {
      const sp = speaking('TEACHER', t), defl = kf(t, [[m.s4_cuT + .2, 0], [m.s4_cuT + .9, 1]]);
      const tp = talk(idle(P_(TEACHER, { face: .45, head: { nod: .4 - defl * .1, turn: .12, tilt: .05 + defl * .06 }, shrug: -defl * .6, e: { ...X.dry, gx: .55, gy: .5, browAsym: .9 * (1 - defl), browH: -defl * .4, lidT: .25 + defl * .25, mS: .25 - defl * .6, mSkew: .7 * (1 - defl) },
        aL: { to: [-52, -262], k: 1, z: 1 }, aR: { to: [96 - defl * 40, -330 + defl * 60], k: -1, z: 1, hand: 'point', prop: { n: 'pointer', r: 1.95 + defl * .5, len: 120 } } }), t, 7, .6), 'TEACHER', t);
      drawP(ctx, TEACHER, tp, 196, 1452, 1.04, L_RIGHT);
    }
    const y = 1486; let jo = pk(JACK, t, K.jack), yo = pk(YOU, t, K.you);
    const tap = jo.head.nod > .5 ? 1 : 0; jo = { ...jo, aL: { ...jo.aL, to: [-36 + tap * Math.sin(t * 23) * 1.6, -204 + tap * Math.abs(Math.sin(t * 17)) * 2.5] }, aR: { ...jo.aR, to: [36 + tap * Math.sin(t * 19 + 1) * 1.6, -204 + tap * Math.abs(Math.sin(t * 21 + 2)) * 2.5] } };
    if (yo.head.nod > .6) yo = { ...yo, aR: { ...yo.aR, to: [56 + Math.sin(t * 8) * 6, -170] } };
    jo = talk(idle(jo, t, 1, .4), 'JACK', t); yo = idle(yo, t, 0, .6);
    ell(ctx, 650, y + 8, 340, 30, rgba(P.plum, .22));
    drawP(ctx, JACK, jo, 510, y, 1, L_RIGHT, { noShadow: true, only: [0, 1, 2] }); drawP(ctx, YOU, yo, 800, y, 1, L_RIGHT, { noShadow: true, only: [0, 1, 2] });
    S.desk(ctx, 655, y, 1, { wide: 1.72 });
    poly(ctx, [[742, y - 152], [866, y - 152], [858, y - 183], [750, y - 183]]); ctx.fillStyle = P.paper; ctx.fill(); for (let k = 0; k < 4; k++) line(ctx, 760, y - 177 + k * 7, 846 - k * 8, y - 177 + k * 7, rgba(P.lavDeep, .6), 2);
    drawP(ctx, JACK, jo, 510, y, 1, L_RIGHT, { noShadow: true, only: [3] }); drawP(ctx, YOU, yo, 800, y, 1, L_RIGHT, { noShadow: true, only: [3] });
    // the tiny victory
    const jg = TL.EV.find(v => v.type === 'jingle'), v = t - jg.t; if (v > 0 && v < 1.2) for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .5, d = 30 + v * 90; ctx.globalAlpha = clamp(1.2 - v); text(ctx, i % 2 ? '+1' : '★', 510 + Math.cos(a) * d, y - 230 + Math.sin(a) * d, { size: 30, col: P.gold, stroke: P.ink, sw: 5 }); ctx.globalAlpha = 1; }
    shaft(ctx, [[700, 200], [1040, 200], [900, 1700], [240, 1700]], '#FFD89A', .12, 30); dust(ctx, t, 250, 300, 800, 1200, 44, 12);
  });
}
function boardShot(ctx, t) {
  const m = M, turn = kf(t, [[m.s4_teacher - .1, 0], [m.s4_teacher + .12, 1, 'o']]);
  cam(ctx, zoomAt(540, 800, kf(t, [[m.s4, 1.0], [m.s4_two, 1.07, 'lin'], [m.s4_teacher, 1.22], [m.s4_two2, 1.3, 'lin']])), () => {
    S.boardWall(ctx, t);
    const wr = P_(TEACHER, { face: .55, head: { turn: .2, tilt: .04 }, e: { ...X.dry, gx: .6, browAsym: .2 }, aR: { to: [150, -500 + Math.sin(t * 2.2) * 26], k: -1, z: 1, l: 1.25, prop: { n: 'pointer', r: .75, len: 150 } }, aL: { a: -.3, b: .9 } });
    const call = P_(TEACHER, { face: -.1, lean: -.04, head: { turn: -.1, tilt: -.05 }, e: { ...X.stern, gx: -.2, gy: .2 }, aR: { to: [10, -300], k: -1, z: 1, prop: { n: 'pointer', r: -.9, len: 150 } }, aL: { to: [-58, -262], k: 1, z: 1 } });
    const p = talk(idle(turn <= 0 ? wr : turn >= 1 ? call : pk(TEACHER, turn, [[0, wr], [1, call]]), t, 7), 'TEACHER', t);
    drawP(ctx, TEACHER, p, 470, 1400, 1.5, mkL(-.76, .6, { shadow: { kx: -.6, ky: .15, a: .3, blur: 6, col: P.plum } }));
    dust(ctx, t, 300, 300, 780, 1100, 40, 15);
  });
}
export function seq4(ctx, t) {
  const m = M;
  if (t < m.s4_two || (t >= m.s4_teacher && t < m.s4_two2)) boardShot(ctx, t);
  else {
    let c, teach = t >= m.s4_three;
    const two = (a, b) => ({ x: 655, y: 1175, z: kf(t, [[a, 1.68], [b, 1.76, 'lin']]) });
    if (t < m.s4_teacher) c = two(m.s4_two, m.s4_teacher);
    else if (t < m.s4_three) { c = two(m.s4_two2, m.s4_three); const v = t - lineT('t21').t0; if (v > 0 && v < .5) c.x += Math.sin(v * 60) * 6 * (1 - v * 2); }
    else if (t < m.s4_cuY) c = { x: 500, y: 1010, z: kf(t, [[m.s4_three, 1.22], [m.s4_cuY, 1.28, 'lin']]) };
    else if (t < m.s4_cuJ) c = { x: 800, y: 1140, z: kf(t, [[m.s4_cuY, 2.3], [m.s4_cuJ, 2.45, 'lin']]) };
    else if (t < m.s4_cuT) c = { x: 510, y: 1150, z: kf(t, [[m.s4_cuJ, 2.3], [m.s4_cuT, 2.4, 'lin']]) };
    else if (t < m.s4_two3) c = { x: 225, y: 1085, z: kf(t, [[m.s4_cuT, 1.95], [m.s4_two3, 2.08, 'lin']]) };
    else c = two(m.s4_two3, m.s5_run);
    classScene(ctx, t, c, teach);
  }
  finish(ctx, { vig: .5, bl: .24 }); captions(ctx, t, 1570, 54);
}
