// Sequence 2: the exam betrayal. Wide → close on YOU → a hand rises → eyes → Jack → the booklet → "Another... WHAT?" → thud.
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, wash, rnd } from './kit.js';
import { X, YOU, JACK, PROF } from './cast.js';
import * as S from './sets.js';
import { W, H, cam, layerSoft, put, seat, finish, mkL, L_BACK, examScene, ROWS, colX, writing, jackAsk, youBack, profBring } from './shots.js';
import { M, kf, pk, P_, idle, talk, lineT, walk, captions, drawP, zoomAt } from './anim.js';

const lay = (ctx, id, fn, blur, base = '#D9B284') => { if (blur < .4) return fn(ctx); fillR(ctx, 0, 0, W, H, base); layerSoft(ctx, id, fn, blur); };
let K = null;
function keys() {
  if (K) return K;
  const m = M, y = (...o) => P_(YOU, seat(YOU), ...o), j13 = lineT('j13');
  const arms = { aL: { to: [-62, -168], k: 1 }, aR: { to: [58, -196], k: -1, prop: { n: 'pencil', r: -.3, dy: -20 } } };
  K = {
    read: y({ head: { nod: .9, tilt: -.04 }, shrug: .5, e: { ...X.worried, gy: .85, lidT: .25, sweat: .5 }, aL: { to: [-62, -168], k: 1 }, aR: { to: [10, -172], k: -1, prop: { n: 'pencil', r: -.5, dy: -18 } } }),
    stuck: y({ head: { nod: .55, tilt: -.04 }, shrug: .8, e: { ...X.worried, gy: .7, sweat: .8, mWavy: .9 }, ...arms }),
    glance: y({ head: { nod: .3, tilt: .05 }, shrug: .8, e: { ...X.worried, gy: .2, gx: -.7, sweat: .8, mWavy: .9 }, ...arms }),
    freeze: y({ head: { nod: .2, tilt: 0 }, shrug: 1.2, sq: -.08, e: { eyeOpen: 1.45, pup: .42, browH: .9, browA: .4, mS: -.2, mW: .34, sweat: .9, pale: .3 }, ...arms }),
    horror: y({ face: .26, head: { turn: .3, tilt: -.06 }, shrug: 1, sq: -.12, e: { ...X.horror, gx: .8, gy: -.05 }, aL: { to: [-78, -172], k: 1 }, aR: { to: [104, -256], k: -1, hand: 'open' } }),
    stare: y({ head: { nod: .1 }, shrug: 1, e: { ...X.hollow, gloom: .7 }, aL: { to: [-78, -172], k: 1 }, aR: { to: [84, -176], k: -1, hand: 'open' } }),
    down: y({ head: { nod: 1, oy: 124, tilt: .12 }, shrug: -.6, sq: .12, e: { ...X.despair, mO: 0, mW: .5 }, aL: { to: [-128, -170], k: 1, hand: 'open' }, aR: { to: [126, -172], k: -1, hand: 'open' } }),
    jWrite: t => writing(JACK, 7, t * 1.6), jAsk: P_(JACK, jackAsk), j13,
  };
  K.you = [[m.s2, K.read], [m.s2_cu + 1.4, K.read], [m.s2_cu + 1.75, K.stuck], [m.s2_cu + 2.05, K.stuck], [m.s2_cu + 2.25, K.glance], [m.s2_cu + 2.55, K.stuck], [m.s2_cut - .12, K.stuck], [m.s2_cut + .1, K.freeze, 'o'],
    [m.s2_fall, K.horror], [m.s2_fall + .01, K.stare], [m.s2_fall + .45, K.stare], [m.s2_thud, K.down, 'i']];
  return K;
}
const jackPose = t => {
  const m = M, k = keys(), w = P_(JACK, k.jWrite(t));
  const p = pk(JACK, t, [[m.s2_hand, w], [m.s2_hand + .42, k.jAsk, 'back'], [k.j13.t0 + .15, k.jAsk], [k.j13.t0 + .6, w]]);
  return talk(idle(p, t, 1, .4), 'JACK', t);
};
// YOU at a desk, with the head able to land on top of it
function youAtDesk(g, t, p, x, y, s, L, opt = {}, deskO = { paper: 1 }) {
  const headOver = p.head.oy > 60, o = { noShadow: true, tint: [P.plum, .06], ...opt };
  drawP(g, YOU, p, x, y, s, L, { ...o, only: headOver ? [0, 1] : [0, 1, 2] });
  S.desk(g, x, y, s, deskO);
  drawP(g, YOU, p, x, y, s, L, { ...o, only: headOver ? [2, 3] : [3] });
}
function room(g, t, o) { examScene(g, t, { jack: jackPose(t), noYou: true, ...o }); }

export function seq2(ctx, t) {
  const m = M, k = keys(), F3 = ROWS[3];
  let yp = pk(YOU, t, k.you);
  if (t > m.s2_cu && t < m.s2_cu + 1.5) { const u = (t - m.s2_cu) / 1.5; yp = { ...yp, aR: { ...yp.aR, to: [-6 + u * 40 + Math.sin(t * 22) * 3, -172 + Math.sin(t * 31) * 1.5] } }; }
  if (t > m.s2_thud) { const u = t - m.s2_thud; yp = { ...yp, head: { ...yp.head, oy: yp.head.oy - Math.exp(-u * 9) * Math.abs(Math.sin(u * 16)) * 14 } }; }
  yp = idle(yp, t, 0, t > m.s2_cut ? .2 : .7);

  if (t < m.s2_cu) {                                  // wide: the silent hall
    cam(ctx, zoomAt(540, 1300, kf(t, [[m.s2, 1], [m.s2_cu, 1.1, 'lin']])), () => { room(ctx, t, {}); youAtDesk(ctx, t, yp, colX(F3.s, 0), F3.y, F3.s, L_BACK); });
    dust(ctx, t, 60, 250, 960, 1300, 60, 9); finish(ctx, { vig: .55, bl: .28, grade: ['#8C86B0', .1, 'multiply'] });
  } else if (t < m.s2_eyes) {                         // close on YOU; behind him, out of focus, a hand goes up
    const c = { x: kf(t, [[m.s2_cu, 600], [m.s2_eyes, 648, 'lin']]), y: 1288, z: kf(t, [[m.s2_cu, 2.25], [m.s2_eyes, 2.42, 'lin']]) };
    lay(ctx, 'bg', g => cam(g, c, () => room(g, t, { rows: [0, 1, 2] })), 5.5);
    cam(ctx, c, () => { examScene(ctx, t, { rows: [3], bg: false, noYou: true, light: false }); youAtDesk(ctx, t, yp, colX(F3.s, 0), F3.y, F3.s, L_BACK); });
    finish(ctx, { vig: .6, bl: .24, grade: ['#8C86B0', .1, 'multiply'] }); captions(ctx, t, 1560);
  } else if (t < m.s2_reveal) {                       // the eyes go first, then the head
    const u = t - m.s2_eyes, s = 6.1, gx = kf(u, [[.15, 0], [.6, .92, 'io']]), turn = kf(u, [[.75, 0], [1.3, 1, 'io']]);
    lay(ctx, 'bg', g => cam(g, { x: 620, y: 1200, z: 2.6 }, () => room(g, t, { rows: [0, 1, 2] })), 16);
    wash(ctx, W, H, '#6E648F', .3, 'multiply');
    const p = P_(YOU, seat(YOU), { face: turn * .26, head: { turn: turn * .3, tilt: -turn * .05 }, shrug: 1.1, e: { eyeOpen: 1.5, pup: .4, gx, gy: -.02, browH: 1, browA: .5 + turn * .3, mS: -.3, mW: .4, sweat: .9, pale: .4 + turn * .3, gloom: turn * .3 } });
    drawP(ctx, YOU, p, 540 - turn * 60, 930 + 329 * s, s, mkL(.2, .98, { rim: '#FFF2CC', rimW: 2.4, shadeA: 0, shadow: null }), { noShadow: true, tint: [P.plum, .1] });
    finish(ctx, { vig: .82, bl: .18, inner: .26 });
  } else if (t < m.s2_insert || (t >= m.s2_prof && t < m.s2_ecu)) {   // it's Jack
    const c = { x: 726, y: 1140, z: kf(t, [[m.s2_reveal, 2.2], [m.s2_insert, 2.32, 'lin'], [m.s2_prof, 2.3], [m.s2_ecu, 2.36, 'lin']]) };
    const rk = kf(t, [[m.s2_reveal + .15, 0], [m.s2_reveal + .7, 1, 'io']]);
    lay(ctx, 'bg', g => cam(g, c, () => {
      examScene(g, t, { rows: [0, 1], prof: false });
      if (t >= m.s2_prof) {
        const u = t - m.s2_prof, go = kf(u, [[0, 0], [.5, 1, 'o']]), px = lerp(360, 598, go);
        let pp = go < 1 ? P_(PROF, profBring, { face: .8, ...walk(u * 2.4, 1, { stride: 36 }), aL: profBring.aL }) : P_(PROF, profBring);
        drawP(g, PROF, talk(idle(pp, t, 6, .5), 'PROFESSOR', t), px, 1342, .72, L_BACK, { tint: [P.plum, .1], noShadow: true });
      }
      examScene(g, t, { rows: [2], bg: false, jack: jackPose(t), jackDesk: { filled: 1, depth: 72, stack: true }, light: true });
    }), (1 - rk) * 7);
    layerSoft(ctx, 'fg', g => { const gy = 1240 + 329 * 2.1, o = { noShadow: true, tint: [P.plum, .22] }, yb = idle(P_(YOU, youBack), t, 0, .3);
      drawP(g, YOU, yb, 150, gy, 2.1, L_BACK, { ...o, only: [0, 1, 2] }); S.desk(g, 170, gy, 2.1, { paper: 1 }); drawP(g, YOU, yb, 150, gy, 2.1, L_BACK, { ...o, only: [3] }); }, .5 + rk * 10.5);
    dust(ctx, t, 100, 300, 900, 900, 40, 4); finish(ctx, { vig: .58, bl: .26 }); captions(ctx, t, 1480, 56);
  } else if (t < m.s2_prof) {                         // insert: sixteen pages, full
    insertBooklet(ctx, t, (t - m.s2_insert) / (m.s2_prof - m.s2_insert));
  } else if (t < m.s2_fall) {                         // "Another... WHAT?"
    const u = t - m.s2_ecu, zz = kf(u, [[0, 1.3], [.2, 1, 'o'], [3, 1.06, 'lin']]), dr = lineT('y14').t1, v = Math.max(0, t - dr);
    lay(ctx, 'bg', g => cam(g, { x: 700, y: 1235, z: 2.0, r: -.03 }, () => room(g, t, { rows: [0, 1, 2], prof: false, jackDesk: { filled: 1 } })), 10);
    wash(ctx, W, H, '#6E648F', .34, 'multiply');
    ctx.save(); ctx.translate(540, 900); ctx.rotate(-.045); ctx.scale(zz, zz); ctx.translate(-540 + Math.sin(t * 47) * 2.2, -900 + Math.sin(t * 39) * 1.6);
    const s = 3.9, gx = 470, gy = 860 + 329 * s, Ld = mkL(.2, .98, { rim: '#FFF2CC', rimW: 3.2, shadeA: 0, shadow: null });
    let p = talk({ ...k.horror, aR: { ...k.horror.aR, prop: v > 0 ? null : { n: 'pencil', r: .9, dx: 16, dy: 14, over: 1 } } }, 'YOU', t);
    youAtDesk(ctx, t, p, gx, gy, s, Ld, { tint: [P.plum, .1] }, { paper: 1 });
    if (v > 0) {       // the pencil leaves the hand
      ctx.save(); ctx.translate(900 + v * 60, 1215 + v * v * 1500); ctx.rotate(.9 + v * 5);
      ctx.strokeStyle = rgba(P.cream, .7 * Math.max(0, 1 - v * 2)); ctx.lineWidth = 6; ctx.lineCap = 'round'; for (const q of [-1, 1]) { ctx.beginPath(); ctx.arc(q * 40, -150, 120, .9, 1.5); ctx.stroke(); }
      line(ctx, 0, -84, 0, 70, P.orange, 22, 'butt'); line(ctx, 0, -104, 0, -84, P.rose, 22, 'butt'); line(ctx, 0, -86, 0, -78, P.sand, 22, 'butt');
      poly(ctx, [[-11, 70], [11, 70], [0, 104]]); ctx.fillStyle = P.sand; ctx.fill(); poly(ctx, [[-4, 92], [4, 92], [0, 104]]); ctx.fillStyle = P.ink; ctx.fill(); ctx.restore();
    }
    ctx.restore();
    finish(ctx, { vig: .8, bl: .2, inner: .28, vc: [.45, .46] }); captions(ctx, t, 1500, 64);
  } else {                                            // gravity
    const c = { x: 560, y: 1330, z: kf(t, [[m.s2_fall, 1.9], [m.s3, 2.0, 'lin']]) }, sh = t > m.s2_thud ? Math.exp(-(t - m.s2_thud) * 10) * 9 * Math.sin((t - m.s2_thud) * 60) : 0;
    cam(ctx, { ...c, y: c.y + sh }, () => { room(ctx, t, { rows: [0, 1, 2, 3], prof: false }); youAtDesk(ctx, t, yp, colX(F3.s, 0), F3.y, F3.s, L_BACK);
      const u = t - m.s2_fall; if (u < .34) { ctx.save(); ctx.translate(700 + u * 60, 1380 + u * u * 1900); ctx.rotate(u * 9); line(ctx, 0, -20, 0, 20, P.orange, 7, 'butt'); ctx.restore(); }
      else { ctx.save(); ctx.translate(724 + Math.min(.4, u - .34) * 40, 1606); ctx.rotate(1.5 + Math.min(.4, u - .34) * 3); line(ctx, 0, -20, 0, 20, P.orange, 7, 'butt'); ctx.restore(); }
      if (t > m.s2_thud) { const v = t - m.s2_thud; for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(480 + i * 70 + v * (i - 1) * 90, 1410 - v * 190 + v * v * 330 - i * 12); ctx.rotate(v * (i - 1) * 2.4 + i); ctx.globalAlpha = clamp(1.4 - v * 1.6); fillR(ctx, -22, -15, 44, 30, P.paper); ctx.restore(); } }
    });
    finish(ctx, { vig: .6, bl: .24, grade: ['#8C86B0', .1, 'multiply'] });
  }
}

// top-down insert of Jack's booklet
function insertBooklet(ctx, t, u) {
  ctx.fillStyle = lg(ctx, 0, 0, W, H, ['#DDB07E', '#C99866']); ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = rgba(P.woodDark, .18); ctx.lineWidth = 4; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(-50, 80 + i * 128); ctx.bezierCurveTo(300, 60 + i * 128, 700, 110 + i * 128, 1130, 84 + i * 128); ctx.stroke(); }
  ctx.save(); ctx.translate(540, 960); const z = 1 + u * .07; ctx.scale(z, z); ctx.rotate(-.07 + u * .015); ctx.translate(-540, -960 - u * 40);
  for (let i = 3; i >= 1; i--) { ctx.save(); ctx.translate(-36 * i - 60, 30 * i - 30); ctx.rotate(-.04 * i); fillR(ctx, 96, 286, 760, 1100, rgba(P.woodDark, .18)); fillR(ctx, 90, 280, 760, 1100, mix(P.paper, P.sand, .12 * i)); ctx.restore(); }
  fillR(ctx, 168, 250, 800, 1300, rgba(P.woodDark, .25)); fillR(ctx, 160, 240, 800, 1300, P.paper);
  fillR(ctx, 160, 240, 800, 120, '#F1E6CC'); text(ctx, 'ANATOMY · FINAL EXAM', 200, 290, { size: 40, col: P.ink, align: 'left', ls: 2 }); text(ctx, 'Name:  Jack', 204, 338, { size: 38, font: F.hand, col: P.indigo, align: 'left' });
  text(ctx, 'booklet 1 · page 16 of 16', 930, 338, { size: 28, font: F.hand, col: P.rust, align: 'right' });
  line(ctx, 250, 360, 250, 1540, rgba(P.rose, .7), 3, 'butt');
  const r = rnd(4242), last = 22, prog = .35 + u * .5;
  for (let i = 0; i < 23; i++) {
    const y = 420 + i * 48; line(ctx, 180, y + 14, 940, y + 14, rgba(P.lav, .45), 2, 'butt');
    ctx.strokeStyle = P.indigo; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    let x = 270, end = i < last ? 900 - r() * 70 : 270 + prog * 600;
    while (x < end) { const w = 26 + r() * 62; let xx = x; ctx.moveTo(xx, y + (r() - .5) * 6); while (xx < Math.min(x + w, end)) { xx += 7 + r() * 5; ctx.lineTo(xx, y - 3 - r() * 16 * (r() < .3 ? 1.4 : .6)); xx += 4; ctx.lineTo(xx, y + (r() - .5) * 5); } x += w + 16; }
    ctx.stroke();
  }
  // the hand, still going
  const hx = 270 + prog * 600 + Math.sin(t * 30) * 5, hy = 420 + 22 * 48 + Math.sin(t * 38) * 4;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.5); line(ctx, 0, 0, 0, -220, P.orange, 22, 'butt'); line(ctx, 0, -250, 0, -220, P.rose, 22, 'butt'); poly(ctx, [[-11, 0], [11, 0], [0, 34]]); ctx.fillStyle = P.sand; ctx.fill(); poly(ctx, [[-4, 22], [4, 22], [0, 34]]); ctx.fillStyle = P.ink; ctx.fill(); ctx.restore();
  ctx.lineCap = 'round'; line(ctx, hx + 110, hy - 70, hx + 620, hy + 420, dark(P.jack, .3), 190); line(ctx, hx + 110, hy - 70, hx + 620, hy + 420, P.jack, 176); circ(ctx, hx + 70, hy - 96, 96, P.ink);
  ctx.restore();
  finish(ctx, { vig: .6, bl: .22 });
}
