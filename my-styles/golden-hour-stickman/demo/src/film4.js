// Sequence 5 (second place, after Jack) and sequence 6 (the sunset).
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, wash, rnd } from './kit.js';
import { X, YOU, JACK, COACH, STU_A, STU_B, STU_C } from './cast.js';
import * as S from './sets.js';
import { W, H, cam, layerSoft, seat, sitY, finish, mkL, J1, Y7, Y_SWIM } from './shots.js';
import { TL, M, kf, pk, P_, idle, talk, speaking, lineT, walk, run, captions, drawP, zoomAt, EASE } from './anim.js';

const LS = mkL(-.62, .78, { shadow: { kx: -.55, ky: .16, a: .3, blur: 5, col: '#7A3F4A' } });
const ROWS_ = [['1ST', 'JACK', dark(P.jack, .35)], ['2ND', 'YOU', P.you]];

// ---------- running ----------
function trackShot(ctx, t) {
  const m = M, u = t - m.s5_run, fin = m.s5_finish - m.s5_run, l = lineT;
  const yx = kf(u, [[0, -330], [fin, 930, 'lin'], [fin + .7, 1010, 'o']]);
  let c;
  if (t < m.s5_coach) c = { x: clamp(yx + 150, 40, 1060), y: 1000, z: 1 };
  else if (t < m.s5_bench) c = { x: 1150, y: 1290, z: kf(t, [[m.s5_coach, 1.32], [m.s5_bench, 1.4, 'lin']]) };
  else c = { x: 232, y: 1085, z: kf(t, [[m.s5_bench, 3.0], [m.s5_swim, 3.25, 'lin']]) };
  cam(ctx, c, () => {
    S.track(ctx, t);
    // Jack under the sunshade
    fillR(ctx, 96, 990, 8, 200, P.paper); fillR(ctx, 330, 990, 8, 200, P.paper); poly(ctx, [[70, 996], [366, 996], [340, 950], [96, 950]]); ctx.fillStyle = P.paper; ctx.fill(); for (let k = 0; k < 4; k++) { poly(ctx, [[70 + k * 74, 996], [107 + k * 74, 996], [118 + k * 61, 950], [96 + k * 61, 950]]); ctx.fillStyle = P.orange; ctx.fill(); }
    fillR(ctx, 130, 1140, 210, 12, P.wood); fillR(ctx, 146, 1152, 10, 44, P.woodDark); fillR(ctx, 314, 1152, 10, 44, P.woodDark);
    const dk = t >= m.s5_bench ? kf(t, [[m.s5_bench, 1], [m.s5_bench + .45, 1], [m.s5_bench + .75, 0]]) : 1;
    drawP(ctx, J1, idle(P_(JACK, seat(JACK), { face: .5, lean: -.08, legS: 1, head: { tilt: -.2 * dk + .04, turn: (1 - dk) * -.3 }, e: dk > .5 ? { ...X.chill, eyeOpen: .05, closeCurve: -1 } : { ...X.friendly, gx: -.3 }, lL: { x: 30 }, lR: { x: 70 },
      aL: { to: [58 + (1 - dk) * 30, -356 + (1 - dk) * 110], k: 1, z: 1, prop: { n: 'bottle', r: -1.0 * dk } }, aR: { a: .2, b: .2 } }), t, 1, .5), 232, 1196, .5, LS, { noShadow: true });
    // the runner
    if (t < m.s5_bench) {
      let p, gd = 0;
      if (u < fin) {
        p = P_(YOU, { face: .85, lean: .3, head: { tilt: .12, turn: -.1 }, sq: -.05, e: { ...X.determined, gx: .4 }, ...run(u * 3.4, 1) }); gd = 26;
        ctx.save(); ctx.lineCap = 'round'; for (let i = 0; i < 11; i++) { const yy = 1040 + i * 44 + (i % 3) * 9, x1 = yx - 200 - (i % 4) * 40 - ((u * 900 + i * 70) % 160), len = 190 + (i * 53) % 160; ctx.strokeStyle = rgba('#FFF6E0', .55 - (i % 3) * .12); ctx.lineWidth = 5 + (i % 3) * 3; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x1 - len, yy); ctx.stroke(); }
        for (let i = 0; i < 4; i++) { const a = ((u * 3.4 + i * .25) % 1); ell(ctx, yx - 150 - a * 160 - i * 20, 1540 - a * 30, (16 + a * 30) * 1.3, 14 + a * 22, rgba('#F7DDBE', .7 * (1 - a))); } ctx.restore();
      } else {
        const kneel = P_(YOU, { face: .7, lean: .22, hipY: 128, shrug: .6, head: { tilt: -.1, turn: .1 }, e: { ...X.delighted, gx: .5, gy: -.4 }, lL: { x: -64, r: 1.3 }, lR: { x: -92, r: 1.3 }, aL: { to: [50, -66], k: 1, z: 1 }, aR: { to: [74, -70], k: 1, z: 1 } });
        const unsure = P_(YOU, { face: .7, lean: .16, hipY: 128, shrug: .3, head: { tilt: .08, turn: .1 }, e: { browAsym: .7, browA: .4, mS: .35, mW: .7, gx: .6, gy: -.4, sweat: .7 }, lL: { x: -64, r: 1.3 }, lR: { x: -92, r: 1.3 }, aL: { to: [50, -66], k: 1, z: 1 }, aR: { to: [74, -70], k: 1, z: 1 } });
        const flat = P_(YOU, { face: .5, lean: .1, hipY: 132, shrug: -.3, head: { tilt: -.04, turn: -.3 }, e: { ...X.deadpan, gx: -.2, sweat: .5 }, lL: { x: -64, r: 1.3 }, lR: { x: -92, r: 1.3 }, aL: { to: [46, -60], k: 1, z: 1 }, aR: { to: [68, -64], k: 1, z: 1 } });
        const st = P_(YOU, { face: .85, lean: .34, hipY: 30, e: { ...X.determined, gx: .4 }, ...run(fin * 3.4, 1) });
        p = pk(YOU, t, [[m.s5_finish, st], [m.s5_finish + .5, kneel, 'o'], [l('c31').t1, kneel], [l('y32').t0 + .1, unsure], [l('c33').t0 + .5, unsure], [l('c33').t1, flat]]);
        p = { ...p, shrug: p.shrug + Math.sin(t * 9) * .25 };
      }
      const gy = kf(t, [[m.s5_finish, 1528], [m.s5_finish + .6, 1612, 'o']]);
      drawP(ctx, Y7, talk(idle(p, t, 0, .3), 'YOU', t), yx, gy - gd, 1.3, LS, { groundDy: gd });
      const cl = speaking('COACH', t), cp = talk(idle(P_(COACH, { face: -.5, head: { nod: cl ? .25 : .5, turn: -.1 }, e: { ...X.flat, gy: cl ? .3 : .7, gx: -.3, mS: cl ? .2 : -.1 }, aR: { to: [-26, -352], k: -1, z: 1, prop: { n: 'stopwatch' } }, aL: { to: [50, -262], k: 1, z: -1 } }), t, 8, .5), 'COACH', t);
      drawP(ctx, COACH, cp, 1330, 1650, 1.22, LS);
    }
  });
  finish(ctx, { vig: .42, bl: .22 });
}
// ---------- swimming ----------
function poolShot(ctx, t) {
  const m = M, l = lineT, jackCut = t >= m.s5_wave;
  const c = jackCut ? { x: 232, y: 1500, z: kf(t, [[m.s5_wave, 1.8], [m.s5_chess, 1.95, 'lin']]) } : zoomAt(560, 1300, kf(t, [[m.s5_swim, 1], [m.s5_wall, 1.1, 'lin'], [m.s5_wave, 1.2, 'lin']]));
  cam(ctx, { ...c, y: (c.y ?? 960) + 50 }, () => {
    const { NEAR, FAR } = S.pool(ctx, t), L = mkL(-.6, .8, { shadow: { kx: -.5, ky: .16, a: .26, blur: 5, col: '#6A6A8A' } });
    fillR(ctx, 60, 1632, 330, 18, P.wood); fillR(ctx, 60, 1632, 330, 6, P.woodLight); fillR(ctx, 84, 1650, 14, 84, P.woodDark); fillR(ctx, 352, 1650, 14, 84, P.woodDark);
    poly(ctx, [[280, 1632], [372, 1632], [372, 1700], [280, 1690]]); ctx.fillStyle = P.paper; ctx.fill(); for (let k = 0; k < 3; k++) fillR(ctx, 290 + k * 28, 1634, 12, 58, P.orange);
    const wv = jackCut ? Math.sin((t - m.s5_wave) * 11) * .16 : 0;
    drawP(ctx, JACK, idle(P_(JACK, seat(JACK), { face: .45, lean: -.1, legS: 1, head: { tilt: -.06, turn: -.12, nod: jackCut ? 0 : .6 }, e: jackCut ? { ...X.friendly, gx: .45 } : { ...X.chill, gy: .7 }, lL: { x: 92 }, lR: { x: 128 },
      aR: jackCut ? { a: 2.55 + wv, b: .35 + wv, l: 1.2, hand: 'open', z: 1 } : { a: .2, b: .3 }, aL: { to: [40, -232], k: 1, z: 1, prop: { n: 'phone', r: .5, back: 1 } } }), t, 1, .5), 196, 1730, .95, L, { noShadow: true });
    if (t < m.s5_wall) {       // the approach
      const v = Math.pow((t - m.s5_swim) / (m.s5_wall - m.s5_swim), 1.7), wy = lerp(FAR + 70, NEAR - 22, v), s = lerp(.26, 1.32, v), ph = (t - m.s5_swim) * 3.3;
      const p = P_(YOU, { face: 0, hipY: 138, head: { nod: .2, tilt: Math.sin(ph * TAU) * .12 }, shrug: 1, e: { ...X.determined, mTeeth: 0, mO: .6, mW: .6 }, aL: { a: Math.PI + .5 * Math.sin(ph * TAU), b: -.6, l: 1.15 }, aR: { a: Math.PI - .5 * Math.sin(ph * TAU + Math.PI), b: .6, l: 1.15 } });
      ctx.save(); ctx.beginPath(); ctx.rect(-400, 0, 1900, wy + 6 * s); ctx.clip(); drawP(ctx, Y_SWIM, p, 540, wy + 196 * s, s, L, { noShadow: true }); ctx.restore();
      S.splash(ctx, 540 - 70 * s, wy, s * (1 + .3 * Math.sin(ph * TAU)), t, 9); S.splash(ctx, 540 + 70 * s, wy, s * (1 - .3 * Math.sin(ph * TAU)), t, 9);
    } else {
      const open = P_(YOU, { face: 0, hipY: 138, head: { tilt: .04, nod: -.2 }, shrug: 1, e: { ...X.gasp, gx: .6, gy: -.5, sweat: .9 }, aL: { to: [-60, -140] }, aR: { to: [56, -138] } });
      const shut = P_(YOU, { face: 0, hipY: 138, head: { tilt: .07, nod: .2 }, shrug: 1, e: { eyeOpen: .05, closeCurve: -1, browA: .9, browH: .3, mO: .1, mW: .5, mS: -.5, sweat: .9 }, aL: { to: [-60, -140] }, aR: { to: [56, -138] } });
      const sunk = P_(YOU, { face: 0, hipY: 162, head: { tilt: .1, nod: .5 }, shrug: .2, e: { ...X.despair, mO: 0, sweat: .9 }, aL: { to: [-60, -140] }, aR: { to: [56, -138] } });
      let p = pk(YOU, t, [[m.s5_wall, open], [l('c35').t0 + .3, open], [l('c35').t1 + .1, shut], [l('c37').t0 + .3, shut], [l('c37').t1 + .2, sunk]]);
      p = talk({ ...p, shrug: p.shrug + Math.sin(t * 8) * .3 }, 'YOU', t);
      const hit = Math.max(0, 1 - (t - m.s5_wall) * 2.2); S.splash(ctx, 540, NEAR - 22, 1.2 + hit * 1.6, t, 11);
      drawP(ctx, Y_SWIM, p, 540, NEAR + 196, 1.32, L, { noShadow: true, only: [0, 1, 2] });
      fillR(ctx, 330, NEAR - 6, 420, 60, '#F3E7CB'); for (let x = 320; x < 760; x += 60) fillR(ctx, x, NEAR - 6, 3, 60, rgba(P.tealDeep, .3)); fillR(ctx, 330, NEAR + 16, 420, 12, P.teal); fillR(ctx, 330, NEAR - 10, 420, 8, '#FFF8E6'); fillR(ctx, 330, NEAR + 54, 420, 260, '#E5D0A8');
      ell(ctx, 540, NEAR + 90, 190, 26, rgba('#8CC9CF', .4)); text(ctx, '4', 540, NEAR + 23, { size: 24, col: P.tealDeep });
      drawP(ctx, Y_SWIM, p, 540, NEAR + 196, 1.32, L, { noShadow: true, only: [3] });
      for (const [dx, dy, ph] of [[-150, -70, 0], [170, -96, 1], [-40, -260, 2], [210, -200, 3]]) { const a = ((t * 1.3 + ph * .3) % 1); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.ellipse(540 + dx, NEAR + dy - 40 + a * 90, 7, 11, 0, 0, TAU); ctx.fillStyle = '#F2FFFB'; ctx.fill(); ctx.globalAlpha = 1; }
    }
    const cl = speaking('COACH', t);
    drawP(ctx, COACH, talk(idle(P_(COACH, { face: -.5, head: { nod: cl ? .5 : .65, turn: -.15 }, e: { ...X.flat, gx: -.4, gy: cl ? .55 : .8 }, aR: { to: [-30, -330], k: -1, z: 1, prop: { n: 'clipboard', r: -.2 } }, aL: { a: .1, b: .1, z: -1 } }), t, 8, .5), 'COACH', t), 905, 1730, 1.2, L);
  });
  finish(ctx, { vig: .4, bl: .24 });
}
// ---------- results boards ----------
function boardShot(ctx, t, t0, title, sub, bg, face) {
  const u = t - t0, z = kf(u, [[0, 1.16], [.16, 1, 'o'], [1.2, 1.04, 'lin']]);
  ctx.fillStyle = lg(ctx, 0, 0, 0, H, bg); ctx.fillRect(0, 0, W, H);
  S.sunQuad(ctx, t, [[420, -40], [900, -40], [1250, 1400], [770, 1400]], { cols: 2, rows: 4, col: '#FFE9B8', a: .3, leaves: 10, seed: 9 });
  ctx.save(); ctx.translate(540, 760); ctx.scale(z, z); ctx.rotate(Math.sin(u * 40) * Math.max(0, .02 - u * .1)); ctx.translate(-540, -760);
  S.resultBoard(ctx, 540, 360, 860, title, ROWS_, { sub, flip: [clamp(u / .22), clamp((u - .14) / .22)] });
  ctx.restore();
  if (face) drawP(ctx, YOU, idle(P_(YOU, face), t, 0, .3), 540, 2260, 1.9, mkL(.72, .62, { shadow: null }), { noShadow: true });
  finish(ctx, { vig: .5, bl: .22 });
}
function table(ctx, x0, x1, y, fl) { fillR(ctx, x0, y, x1 - x0, 30, P.wood); fillR(ctx, x0, y, x1 - x0, 9, P.woodLight); fillR(ctx, x0 + 30, y + 30, 20, fl - y - 30, P.woodDark); fillR(ctx, x1 - 50, y + 30, 20, fl - y - 30, P.woodDark); }
function chessBoard(ctx, x0, x1, y) { poly(ctx, [[x0, y], [x1, y], [x1 - 20, y - 34], [x0 + 20, y - 34]]); ctx.fillStyle = P.paper; ctx.fill(); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) { const a0 = lerp(x0 + 20, x1 - 20, i / 4), a1 = lerp(x0 + 20, x1 - 20, (i + 1) / 4), b0 = lerp(x0, x1, i / 4), b1 = lerp(x0, x1, (i + 1) / 4); poly(ctx, [[lerp(a0, b0, j / 2), y - 34 + 17 * j], [lerp(a1, b1, j / 2), y - 34 + 17 * j], [lerp(a1, b1, (j + 1) / 2), y - 34 + 17 * (j + 1)], [lerp(a0, b0, (j + 1) / 2), y - 34 + 17 * (j + 1)]]); ctx.fillStyle = P.tealDeep; ctx.fill(); } }
function chessShot(ctx, t) {
  const m = M, u = t - m.s5_chess, L = mkL(.72, .62, { shadow: { kx: .6, ky: .15, a: .3, blur: 6, col: P.plum } });
  cam(ctx, { x: 540, y: 1230, z: kf(u, [[0, 1.3], [.9, 1.38, 'lin']]) }, () => {
    S.clubWall(ctx, t);
    drawP(ctx, STU_C, idle(P_(STU_C, seat(STU_C), { legS: 1, face: -.6, head: { tilt: .14, nod: .3 }, e: { ...X.deadpan, gx: -.4, gy: .5 }, lL: { x: -70 }, lR: { x: -40 }, aL: { to: [-40, -300], k: 1, z: 1 }, aR: { a: -.2, b: -.4 } }), t, 4, .5), 800, 1500, 1.15, L);
    const sl = kf(u, [[0, 0], [.34, 0], [.5, 1, 'i']]), p = P_(YOU, seat(YOU), { legS: 1, face: .6, lean: .08 + sl * .1, head: { tilt: -.06 }, sq: sl > .9 ? Math.max(0, .2 - (u - .5) * 1.2) : 0, e: sl < 1 ? { ...X.determined, gx: .5, gy: .4 } : { ...X.delighted, gx: .6 }, lL: { x: 70 }, lR: { x: 40 },
      aL: { to: [lerp(96, 150, sl), lerp(-420, -192, sl)], k: 1, z: 1, l: 1.15, prop: { n: 'piece' } }, aR: { a: .3, b: .5 } });
    drawP(ctx, YOU, idle(p, t, 0, .3), 300, 1500, 1.15, L);
    table(ctx, 330, 780, 1310, 1500); chessBoard(ctx, 420, 690, 1310);
    for (const [px, c] of [[470, P.paper], [520, P.ink], [600, P.ink], [650, P.paper]]) { circ(ctx, px, 1268, 8, c); poly(ctx, [[px - 6, 1272], [px + 6, 1272], [px + 9, 1296], [px - 9, 1296]]); ctx.fillStyle = c; ctx.fill(); }
    if (sl >= 1 && u < .8) { ctx.strokeStyle = P.cream; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = -Math.PI * i / 5, d = 30 + (u - .5) * 200; ctx.beginPath(); ctx.moveTo(480 + Math.cos(a) * d, 1290 + Math.sin(a) * d); ctx.lineTo(480 + Math.cos(a) * (d + 22), 1290 + Math.sin(a) * (d + 22)); ctx.stroke(); } }
  });
  finish(ctx, { vig: .5, bl: .22 });
}
function deadpanShot(ctx, t) {
  const m = M, u = t - m.s5_dead, L = mkL(.72, .62, { shadow: { kx: .6, ky: .15, a: .3, blur: 6, col: P.plum } });
  cam(ctx, zoomAt(330, 1300, kf(u, [[0, 1], [1.1, 1.08, 'lin']])), () => {
    S.clubWall(ctx, t);
    S.resultBoard(ctx, 540, 120, 660, 'CHESS CLUB', ROWS_); S.resultBoard(ctx, 172, 640, 320, 'PIANO', ROWS_, { rot: -.09, sub: 'MUSIC COMPETITION' }); S.resultBoard(ctx, 912, 664, 320, '100 M', ROWS_, { rot: .07, sub: 'SPORTS DAY' });
    drawP(ctx, JACK, idle(P_(JACK, { face: -.25, head: { tilt: .08, turn: -.1 }, e: { ...X.friendly, gx: -.5 }, aL: { to: [-112, -360 + Math.sin(t * 9) * 5], k: -1, z: 1, hand: 'thumb' }, aR: { to: [34, -300], k: -1, z: 1, prop: { n: 'phone', r: .2, back: 1 } } }), t, 1, .5), 810, 1500, .98, L);
    table(ctx, 600, 1080, 1330, 1500); chessBoard(ctx, 660, 860, 1330);
    ctx.save(); ctx.translate(965, 1330); fillR(ctx, -26, -18, 52, 18, P.woodDark); fillR(ctx, -7, -52, 14, 36, P.gold); poly(ctx, [[-38, -128], [38, -128], [24, -62], [-24, -62]]); ctx.fillStyle = P.gold; ctx.fill(); ctx.strokeStyle = P.amber; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(-40, -102, 18, 1.2, 4.9); ctx.stroke(); ctx.beginPath(); ctx.arc(40, -102, 18, -1.75, 1.95); ctx.stroke(); text(ctx, '1', 0, -94, { size: 38, col: P.rust }); ctx.restore();
    const tr = kf(u, [[0, 0], [.35, 1, 'io']]);
    drawP(ctx, YOU, idle(P_(YOU, { face: lerp(.5, .12, tr), head: { tilt: -.05, turn: lerp(.4, 0, tr) }, shrug: .2, e: { ...X.deadpan, gx: lerp(.7, 0, tr), gy: lerp(-.4, 0, tr) }, aL: { a: -.1, b: .1 }, aR: { to: [84, -292], k: -1, z: 1, prop: { n: 'piece' } } }), t, 0, .2), 300, 1930, 1.62, L, { noShadow: true });
  });
  finish(ctx, { vig: .5, bl: .22 });
}
// ---------- the stage ----------
function stage(ctx, t) {
  ctx.fillStyle = lg(ctx, 0, 0, 0, 1300, ['#3A2338', '#5A2F45']); ctx.fillRect(0, 0, W, 1300);
  ctx.fillStyle = lg(ctx, 0, 1300, 0, 1920, ['#B8825A', '#8A5C3E']); ctx.fillRect(0, 1300, W, 620); for (let i = 0; i < 9; i++) line(ctx, 540 + (i - 4) * 150, 1300, 540 + (i - 4) * 330, 1920, rgba(P.woodDark, .4), 3, 'butt');
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) { const x = 540 + sx * (560 - i * 62); ctx.fillStyle = i % 2 ? '#8C3B4A' : '#7A3040'; ctx.beginPath(); ctx.moveTo(x - 40, 0); ctx.lineTo(x + 40, 0); ctx.quadraticCurveTo(x + 30 + Math.sin(t + i) * 4, 700, x + 44, 1320); ctx.lineTo(x - 44, 1320); ctx.quadraticCurveTo(x - 30, 700, x - 40, 0); ctx.fill(); }
  fillR(ctx, 0, 0, W, 150, '#7A3040'); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(60 + i * 120, 150, 60, 0, Math.PI); ctx.fillStyle = '#8C3B4A'; ctx.fill(); }
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg(ctx, 0, 0, 0, 1500, [rgba('#FFE9B0', .5), rgba('#FFE9B0', .12)]); poly(ctx, [[430, 0], [650, 0], [980, 1500], [100, 1500]]); ctx.fill(); ctx.fillStyle = rgba('#FFE9B0', .28); ctx.beginPath(); ctx.ellipse(540, 1500, 440, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
}
function piano(ctx, x, y) {
  fillRR(ctx, x - 230, y - 400, 460, 400, 10, '#2A2238'); fillR(ctx, x - 250, y - 250, 500, 34, '#3A3048'); fillR(ctx, x - 236, y - 240, 472, 22, P.paper); for (let i = 0; i < 22; i++) { line(ctx, x - 236 + i * 21.5, y - 240, x - 236 + i * 21.5, y - 218, rgba(P.ink, .5), 2, 'butt'); if (i % 7 !== 2 && i % 7 !== 6) fillR(ctx, x - 229 + i * 21.5, y - 240, 12, 13, P.ink); }
  fillR(ctx, x - 230, y - 400, 460, 10, '#4A3F6B'); fillRR(ctx, x - 80, y - 360, 160, 70, 6, '#3A3048'); fillR(ctx, x - 210, y - 20, 30, 20, '#1A1730'); fillR(ctx, x + 180, y - 20, 30, 20, '#1A1730');
}
function audience(ctx, t, clap) { for (let i = 0; i < 9; i++) { const x = 20 + i * 130 + (i % 2) * 30, y = 1800 + (i % 3) * 26; circ(ctx, x, y, 78, '#1F1830'); fillRR(ctx, x - 110, y + 50, 220, 200, 60, '#1F1830'); if (clap) for (const s of [-1, 1]) circ(ctx, x + s * (34 + Math.abs(Math.sin(t * 14 + i)) * 26), y - 96 - (i % 2) * 10, 22, '#2A2140'); } }
function pianoShot(ctx, t, jack) {
  const m = M, L = mkL(.1, .99, { rim: '#FFF0C8', rimW: 6, shadeA: .2, shadow: { kx: 0, ky: .12, a: .35, blur: 8, col: '#2A1830' } });
  cam(ctx, zoomAt(540, 1200, kf(t, jack ? [[m.s5_jackPiano, 1.04], [m.s5_b3, 1.1, 'lin']] : [[m.s5_piano, 1.0], [m.s5_board2, 1.06, 'lin']])), () => {
    stage(ctx, t);
    if (!jack) {
      piano(ctx, 760, 1440); const u = t - m.s5_piano, bow = kf(u, [[0, 0], [.3, 1, 'io'], [.6, 1], [.9, 0, 'io']]);
      drawP(ctx, YOU, idle(P_(YOU, { face: -.1, lean: 0, bend: 0, hipY: bow * 20, head: { nod: bow * 1.0, oy: bow * 90 }, shrug: bow * -.5, e: bow > .4 ? { ...X.relieved } : { ...X.happy }, aL: { a: -.1 - bow * .2, b: .1 }, aR: { a: .1 + bow * .2, b: -.1 } }), t, 0, .3), 420, 1500, 1.35, L);
      audience(ctx, t, true);
    } else {
      piano(ctx, 620, 1440); fillRR(ctx, 300, 1330, 150, 30, 8, '#3A3048'); fillR(ctx, 320, 1360, 16, 80, '#2A2238'); fillR(ctx, 414, 1360, 16, 80, '#2A2238');
      const ph = t * 9, p = P_(JACK, seat(JACK), { legS: 1, face: .7, lean: -.06, head: { nod: .5, turn: -.5, tilt: .05 }, e: { ...X.chill, gy: .7, gx: -.4 }, lL: { x: 96 }, lR: { x: 120 },
        aR: { to: [150 + Math.sin(ph) * 34, -250 + Math.abs(Math.sin(ph * 2)) * 10], k: 1, z: 1, l: 1.2 }, aL: { to: [-10, -300], k: 1, z: 1, prop: { n: 'phone', r: -.2, back: 1 } } });
      drawP(ctx, JACK, idle(p, t, 1, .4), 372, 1440 + 60, 1.2, L, { noShadow: true });
      for (let i = 0; i < 5; i++) { const a = ((t * .9 + i * .21) % 1); text(ctx, i % 2 ? '♪' : '♫', 700 + i * 50 + Math.sin(t * 3 + i) * 20, 1000 - a * 380, { size: 70 + i * 6, col: P.gold, alpha: 1 - a, font: 'serif' }); }
      audience(ctx, t, false);
    }
  });
  finish(ctx, { vig: .6, bl: .3 });
}
// ---------- JACK. JACK. JACK. ----------
const FL = [['TABLE TENNIS', ['#5E9A97', '#3D7572']], ['DEBATE', ['#F2A65A', '#E8843C']], ['SPELLING BEE', ['#A79BC4', '#6E648F']], ['COOKING', ['#F6EAD0', '#E2CFA8']], ['HIDE AND SEEK', ['#8C3B4A', '#5A2F45']], ['EVERYTHING', ['#30508F', '#221E3A']]];
function flash(ctx, t, i, t0) {
  const u = t - t0, [title, bg] = FL[i % FL.length], z = 1.5 - Math.min(1, u / .12) * .35 + i * .1;
  ctx.fillStyle = lg(ctx, 0, 0, 0, H, bg); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(540, 900); ctx.rotate((i % 2 ? 1 : -1) * (.05 + i * .012)); ctx.scale(z, z); ctx.translate(-540, -900);
  S.resultBoard(ctx, 540, 520, 820, title, ROWS_.slice(0, 1), { sub: 'WINNER' }); ctx.restore();
  finish(ctx, { vig: .55, bl: .2 });
}
function bigJack(ctx, t) {
  const u = t - M.s5_big, z = kf(u, [[0, 2.6], [.14, 1, 'o'], [.8, 1.1, 'lin']]), sh = Math.max(0, 1 - u * 2.2);
  fillR(ctx, 0, 0, W, H, P.night);
  ctx.save(); ctx.translate(540 + Math.sin(u * 90) * 14 * sh, 960 + Math.cos(u * 70) * 10 * sh); ctx.scale(z, z); ctx.rotate(-.05);
  ctx.strokeStyle = rgba(P.plum, .8); ctx.lineWidth = 26; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + u * .3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 520, Math.sin(a) * 520); ctx.lineTo(Math.cos(a) * 2000, Math.sin(a) * 2000); ctx.stroke(); }
  text(ctx, 'JACK', 16, 18, { size: 430, col: P.rust }); text(ctx, 'JACK', 0, 0, { size: 430, col: P.cream, stroke: P.indigo, sw: 30 }); text(ctx, 'JACK', 0, 0, { size: 430, col: P.sun });
  text(ctx, '1ST. AGAIN.', 0, 270, { size: 86, col: P.cream, ls: 8 });
  ctx.restore(); finish(ctx, { vig: .5, bl: .3, grain: .16 });
}
export function seq5(ctx, t) {
  const m = M, sad = [{ ...X.deadpan, gy: -.3 }, { ...X.exhausted, sweat: 0, gy: -.2 }, { ...X.despair }];
  if (t < m.s5_swim) trackShot(ctx, t);
  else if (t < m.s5_chess) poolShot(ctx, t);
  else if (t < m.s5_board1) chessShot(ctx, t);
  else if (t < m.s5_dead) boardShot(ctx, t, m.s5_board1, 'CHESS CLUB', 'FINAL STANDINGS', ['#EDD3A6', '#E2C191']);
  else if (t < m.s5_piano) deadpanShot(ctx, t);
  else if (t < m.s5_board2) pianoShot(ctx, t, false);
  else if (t < m.s5_jackPiano) boardShot(ctx, t, m.s5_board2, 'PIANO', 'MUSIC COMPETITION', ['#6A3A52', '#4A2A44']);
  else if (t < m.s5_b3) pianoShot(ctx, t, true);
  else if (t < m.s5_b4) boardShot(ctx, t, m.s5_b3, 'BASKETBALL', 'INTER-CLASS CUP', ['#F2B26E', '#E8843C'], { e: sad[0], shrug: .2 });
  else if (t < m.s5_b5) boardShot(ctx, t, m.s5_b4, 'SCIENCE QUIZ', 'GRAND FINAL', ['#8FBDB6', '#5E9A97'], { e: sad[1], shrug: -.3, head: { tilt: .1 } });
  else if (t < m.s5_j0) boardShot(ctx, t, m.s5_b5, 'ART PRIZE', 'SCHOOL EXHIBITION', ['#C3B8DA', '#A79BC4'], { e: sad[2], shrug: -.6, head: { tilt: -.12, nod: .3 } });
  else if (t < m.s5_big) { let i = 5; while (i > 0 && t < m['s5_j' + i]) i--; flash(ctx, t, i, m['s5_j' + i]); }
  else bigJack(ctx, t);
  if (t < m.s5_chess) captions(ctx, t, t < m.s5_swim ? 1690 : 1560, 60);
}

// ================= 6. THE FINAL CONVERSATION =================
let K6 = null;
function keys6() {
  if (K6) return K6;
  const m = M, l = lineT, y = (...o) => P_(YOU, ...o), j = (...o) => P_(JACK, ...o);
  const yb = { face: .62, lL: { x: -20 }, lR: { x: 24 } }, jb = { face: .7, lL: { x: -22 }, lR: { x: 26 }, aL: { to: [58, -300], k: 1, z: 1, prop: { n: 'phone', r: .3, back: 1 } } };
  const yStop = y(yb, { shrug: .6, head: { turn: .1 }, e: { ...X.deadpan, gx: .7, browA: .3 }, aL: { a: -.1, b: .1 }, aR: { a: .1, b: .2 } });
  const yAsk = y(yb, { lean: .06, shrug: .9, head: { turn: .1, tilt: -.08 }, e: { ...X.how, eyeOpen: 1.2, mO: .4, gx: .6 }, aL: { a: .35, b: 1.25, hand: 'open', z: 1 }, aR: { a: 1.0, b: 1.15, hand: 'open', z: 1 } });
  const yBig = y(yb, { lean: .02, shrug: 1.4, head: { turn: .1, tilt: .06, nod: -.3 }, sq: -.15, e: { ...X.how, gx: .5, gy: -.3 }, aL: { a: -1.9, b: -.9, hand: 'open', z: 1, l: 1.2 }, aR: { a: 1.9, b: .9, hand: 'open', z: 1, l: 1.2 } });
  const yWait = y(yb, { shrug: .7, head: { turn: .1 }, e: { browAsym: .7, browA: .3, lidT: .2, mS: -.2, mW: .6, gx: .7 }, aL: { a: .2, b: .8, hand: 'open', z: 1 }, aR: { a: .7, b: .7, hand: 'open', z: 1 } });
  const yFlat = y(yb, { shrug: 0, head: { turn: .1 }, e: { ...X.deadpan, gx: .8 }, aL: { a: -.08, b: .1 }, aR: { a: .1, b: .1 } });
  const ySigh = y(yb, { shrug: -.7, hipY: 6, head: { turn: .1, nod: .5, tilt: .08 }, e: { ...X.sigh }, aL: { a: -.06, b: .06 }, aR: { a: .08, b: .06 } });
  const yShake = y(yb, { shrug: -.3, head: { turn: -.1, nod: .2 }, e: { ...X.sigh, lidT: .5, mS: .1 }, aL: { a: -.06, b: .06 }, aR: { a: .08, b: .06 } });
  const yFond = y(yb, { shrug: -.2, head: { turn: .2, tilt: -.06 }, e: { lidT: .3, browA: .3, browAsym: .3, mS: .55, mW: .7, mSkew: .5, gx: .7 } , aL: { a: -.06, b: .06 }, aR: { a: .08, b: .06 } });
  const jWalk = j(jb, { head: { nod: .5 }, e: { ...X.chill, gy: .6 } });
  const jTurn = j(jb, { head: { turn: -.95, tilt: .06 }, e: { ...X.hmm, mO: 0, gx: -.5 }, aR: { a: -.1, b: -.1 } });
  const jConf = j(jb, { head: { turn: -.95, tilt: -.1 }, shrug: .5, e: { ...X.jackConfused, gx: -.5 }, aR: { a: -.42, b: -.75, hand: 'open', z: 1 } });
  const jShrug = j(jb, { head: { turn: -.95, tilt: .08 }, shrug: 1.3, e: { ...X.chill, browH: .5, gx: -.5, mS: .3 }, aR: { a: -.75, b: -1.2, hand: 'open', z: 1 } });
  const jBye = j(jb, { head: { turn: -.95, tilt: .05 }, e: { ...X.friendly, gx: -.5 }, aR: { a: -2.5, b: -.4, hand: 'open', z: 1, l: 1.15 } });
  const a = { y38: l('y38'), j39: l('j39'), y40: l('y40'), j41: l('j41'), j42: l('j42'), j43: l('j43'), y44: l('y44'), y45: l('y45') };
  K6 = { a, jWalk,
    you: [[m.s6, yFlat], [a.y38.t0, yStop], [a.y40.t0 - .1, yStop], [a.y40.t0 + .3, yAsk, 'back'], [a.y40.t0 + 2.3, yAsk], [a.y40.t0 + 2.9, yBig, 'back'], [a.y40.t1 + .2, yBig], [a.j41.t0 + .5, yWait], [a.j42.t1, yWait], [a.j42.t1 + .5, yFlat],
      [a.y44.t0 - .3, yFlat], [a.y44.t0 + .5, ySigh], [a.y44.t1 - .4, ySigh], [a.y44.t1 + .1, yShake], [a.y45.t0 + .1, yFond], [m.s6_crane, yFond]],
    jack: [[m.s6, jWalk], [a.y38.t1, jWalk], [a.j39.t0 + .1, jTurn, 'o'], [a.y40.t1, jTurn], [a.j41.t0 + .2, jConf], [a.j41.t1, jConf], [a.j42.t0 + .2, jShrug, 'back'], [a.j42.t1 + .3, jShrug], [a.j43.t0 + .2, jBye], [a.j43.t1 - .2, jBye], [a.j43.t1 + .25, jWalk]],
  };
  return K6;
}
export function seq6(ctx, t) {
  const m = M, K = keys6(), a = K.a, u = t - m.s6;
  const stopT = a.y38.t0 + .3, inX = kf(t, [[m.s6, -150], [stopT, 0, 'o']]);
  let yx = 318 + inX, jx = 560 + inX * .8 + kf(t, [[a.y38.t0, 0], [a.j39.t0, 24, 'o']]);
  let yp = pk(YOU, t, K.you), jp = pk(JACK, t, K.jack);
  if (t < stopT) yp = { ...yp, ...walk(u * 1.5, 1, { stride: 34 }) };
  if (t < a.j39.t0 - .1) jp = { ...jp, ...walk(u * 1.5 + .25, 1, { stride: 34 }), aL: jp.aL };
  const goJ = a.j43.t1 + .2, goY = m.s6_crane + .5;
  if (t > goJ) { const v = t - goJ; jx += v * 150; jp = { ...K.jWalk, ...walk(v * 1.55, 1, { stride: 38 }), aL: K.jWalk.aL }; }
  if (t > goY) { const v = t - goY, tr = Math.min(1, v / .5); yx -= Math.max(0, v - .3) * 140; yp = { ...yp, face: lerp(.62, -.8, tr), head: { ...yp.head, turn: 0, nod: .25 }, e: { ...yp.e, mS: .3, lidT: .35, gx: 0 }, ...(v > .3 ? walk((v - .3) * 1.5, -1, { stride: 36 }) : {}) }; }
  yp = talk(idle(yp, t, 0, .6), 'YOU', t); jp = talk(idle(jp, t, 1, .5), 'JACK', t);
  let c;
  if (t < m.s6_cu) c = zoomAt(450, 1300, kf(t, [[m.s6, 1.0], [m.s6_cu, 1.16, 'lin']]));
  else if (t < m.s6_crane) c = { x: 336, y: 1150, z: kf(t, [[m.s6_cu, 2.8], [m.s6_crane, 3.05, 'lin']]) };
  else { const v = (t - m.s6_crane) / (m.end - m.s6_crane), e = v * v * (3 - 2 * v); c = { x: lerp(480, 540, e), y: lerp(1020, 905, e), z: lerp(1.14, 1.0, e) }; }
  cam(ctx, c, () => {
    S.courtyard(ctx, t - m.s6, { sunX: 452 });
    const L = mkL(-.3, .95, { rim: '#FFEDB8', rimW: 9, rimA: 1, shadeA: 0, shadow: { kx: -.16, ky: 1.5, a: .42, blur: 5, col: '#5A3A6E' } }), tn = { tint: ['#4A3058', .2] };
    const far = (x, y, s, chr, ph) => drawP(ctx, chr, P_(chr, { face: .8, ...walk(t * 1.2 + ph, 1, { stride: 30 }) }), x + (t - m.s6) * 5, y, s, mkL(-.3, .95, { rim: '#FFE2A0', rimW: 9, shadeA: 0, shadow: { kx: -.1, ky: 1.3, a: .3, blur: 4, col: '#5A3A6E' } }), { tint: ['#4A3568', .78] });
    far(756, 1150, .2, STU_A, 0); far(792, 1150, .2, STU_B, .4); far(900, 1184, .26, STU_C, .7);
    if (yx > -200) drawP(ctx, YOU, yp, yx, 1456, .86, L, tn);
    if (jx < 1300) drawP(ctx, JACK, jp, jx, 1456, .86, L, tn);
    S.courtyardFg(ctx, t); dust(ctx, t, 100, 700, 900, 900, 50, 21, '#FFDFA0', .8);
  });
  finish(ctx, { vig: .5, bl: .34 });
  if (t < m.s6_crane) captions(ctx, t, t < m.s6_cu ? 1640 : 1560, 62);
  const fo = kf(t, [[m.end - 1.7, 0], [m.end - .15, 1, 'io']]); if (fo > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = fo; fillR(ctx, 0, 0, W, H, P.night); ctx.restore(); }
}
