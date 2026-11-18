// Close inserts drawn straight in screen space: the exam sheet (both sides), the wall clock, the hand-in register,
// the handshake, the memory flash. Each takes (ctx, u) with u = seconds since the shot started.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, dust } from './kit.js';
import { clock } from './sets.js';
import { kf, EASE } from './anim.js';
import { C } from './cast.js';
const W = 1080, H = 1920, INK = P.ink;
const hand = (s, w) => { // ink-and-pen scrawl along a line, revealed to fraction w
};
// wood desk surface, seen from above, lit from the window side
export function deskTop(g, t, { light = 1, col = '#C9925E', dx = 0 } = {}) {
  g.fillStyle = lg(g, 0, 0, W, H, [lite(col, .15), col, dark(col, .12)]); g.fillRect(-200, -200, W + 400, H + 400);
  g.strokeStyle = rgba(P.woodDark, .14); g.lineWidth = 3;
  for (let i = -4; i < 24; i++) { g.beginPath(); const y = i * 92 + dx * .2; g.moveTo(-200, y); for (let x = -200; x <= W + 200; x += 60) g.lineTo(x, y + Math.sin(x * .004 + i * 1.7) * 14); g.stroke(); }
  if (light) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .3 * light; g.fillStyle = '#FFD58C'; poly(g, [[-200, 200], [W + 200, -300], [W + 200, 900], [-200, 1500]]); g.fill(); g.restore(); }
}
// the exam sheet at full size (w ≈ 760). side: 'front' | 'back'. o.filled: 0..1 of his answers on the front; o.hi: highlight PASS MARK
export function examSheet(g, cx, cy, w, side, o = {}) {
  const h = w * 1.414; g.save(); g.translate(cx, cy); g.rotate(o.rot || 0); g.scale(o.sx ?? 1, 1);
  fillRR(g, -w / 2 + w * .02, -h / 2 + w * .03, w, h, w * .012, rgba(P.night, .28));
  fillRR(g, -w / 2, -h / 2, w, h, w * .012, o.paper || P.paper); g.lineWidth = w * .006; g.strokeStyle = rgba(INK, .8); rr(g, -w / 2, -h / 2, w, h, w * .012); g.stroke();
  const k = w / 760, L = -w / 2 + 60 * k, R = w / 2 - 60 * k, T = -h / 2;
  const tx = (s, x, y, sz, o2 = {}) => text(g, s, x, y, { size: sz * k, font: F.ui, weight: o2.weight || '600', col: o2.col || INK, align: o2.align || 'left', ls: o2.ls || 0 });
  if (side === 'front') {
    fillR(g, L, T + 52 * k, R - L, 6 * k, INK);
    tx('EXECUTIVE QUALIFICATION ASSESSMENT', 0, T + 96 * k, 30, { align: 'center', ls: 2 });
    tx('CANDIDATE PAPER · ONE SHEET, BOTH SIDES', 0, T + 132 * k, 17, { align: 'center', weight: '500', col: P.inkSoft, ls: 1 });
    // the mark scheme box
    const by = T + 160 * k; g.lineWidth = 3 * k; g.strokeStyle = INK; g.strokeRect(L, by, R - L, 150 * k);
    tx('PART A — STATISTICS', L + 18 * k, by + 34 * k, 21); tx('50 POINTS', R - 18 * k, by + 34 * k, 21, { align: 'right' });
    tx('PART B — TECHNICAL ASSESSMENT', L + 18 * k, by + 72 * k, 21); tx('50 POINTS', R - 18 * k, by + 72 * k, 21, { align: 'right' });
    line(g, L + 10 * k, by + 94 * k, R - 10 * k, by + 94 * k, rgba(INK, .4), 2 * k);
    if (o.hi) { g.save(); g.globalAlpha = o.hi; fillRR(g, L + 8 * k, by + 102 * k, R - L - 16 * k, 40 * k, 6 * k, '#F2C14E'); g.restore(); }
    tx('TOTAL 100   ·   PASS MARK', L + 18 * k, by + 124 * k, 23, { weight: '700' }); tx('80', R - 18 * k, by + 124 * k, 30, { align: 'right', weight: '700', col: o.hi ? '#B3261E' : INK });
    // part A heading and questions
    fillR(g, L, by + 186 * k, R - L, 46 * k, INK); tx('PART A — STATISTICS', L + 16 * k, by + 209 * k, 22, { col: P.paper, ls: 1 });
    for (let i = 0; i < 10; i++) {
      const y = by + 266 * k + i * 74 * k;
      tx(`${i + 1}.`, L, y, 19, { col: P.inkSoft });
      g.fillStyle = rgba(P.lavDeep, .55); g.fillRect(L + 38 * k, y - 8 * k, (R - L) * (.72 - (i % 3) * .12), 5 * k); g.fillRect(L + 38 * k, y + 8 * k, (R - L) * (.5 - (i % 2) * .14), 5 * k);
      const f = clamp((o.filled ?? 0) * 10 - i);
      if (f > 0) { g.save(); g.beginPath(); g.rect(L + 30 * k, y + 16 * k, (R - L - 40 * k) * f, 40 * k); g.clip(); g.strokeStyle = C.candBlue; g.lineWidth = 3.4 * k; g.lineCap = 'round'; g.beginPath(); for (let j = 0; j <= 40; j++) { const x = L + 40 * k + j * (R - L - 120 * k) / 40; g.lineTo(x, y + 34 * k + Math.sin(j * 1.9 + i) * 6 * k + Math.sin(j * .7) * 3 * k); } g.stroke(); g.restore(); }
    }
    tx('A', R - 10 * k, h / 2 - 34 * k, 18, { align: 'right', col: P.inkSoft });
  } else {
    fillR(g, L, T + 52 * k, R - L, 6 * k, INK);
    fillR(g, L, T + 84 * k, R - L, 62 * k, INK); tx('PART B — TECHNICAL ASSESSMENT', L + 16 * k, T + 115 * k, 25, { col: P.paper, ls: 1 });
    tx('50 POINTS', R - 16 * k, T + 115 * k, 25, { col: '#F2C14E', align: 'right' });
    for (let i = 0; i < 10; i++) {
      const y = T + 196 * k + i * 106 * k;
      tx(`${i + 11}.`, L, y, 19, { col: P.inkSoft });
      g.fillStyle = rgba(P.lavDeep, .55); g.fillRect(L + 46 * k, y - 8 * k, (R - L) * (.78 - (i % 3) * .1), 5 * k); g.fillRect(L + 46 * k, y + 8 * k, (R - L) * (.4 + (i % 2) * .2), 5 * k);
      g.strokeStyle = rgba(INK, .35); g.lineWidth = 2.4 * k; g.strokeRect(L + 40 * k, y + 22 * k, R - L - 50 * k, 56 * k);
      if (o.filled) { g.strokeStyle = '#5E4E2A'; g.lineWidth = 3 * k; g.beginPath(); for (let j = 0; j <= 30; j++) g.lineTo(L + 56 * k + j * (R - L - 110 * k) / 30, y + 52 * k + Math.sin(j * 2.1 + i) * 6 * k); g.stroke(); }
    }
    tx('B', R - 10 * k, h / 2 - 34 * k, 18, { align: 'right', col: P.inkSoft });
  }
  g.restore();
}
// INSERT: a sheet slides onto the desk under the examiner's hand; the camera drifts to PASS MARK 80
export function insertSheet(g, u, dur) {
  const z = kf(u, [[0, 1.0], [dur, 1.55, 'io']]), px = kf(u, [[0, 0], [dur, -120, 'io']]), py = kf(u, [[0, 0], [dur, 560, 'io']]);
  g.save(); g.translate(540, 960); g.scale(z, z); g.translate(-540 + px, -960 + py);
  deskTop(g, u);
  const sl = kf(u, [[0, -900], [.55, 0, 'o']]), rot = kf(u, [[0, -.12], [.55, -.03, 'o']]);
  examSheet(g, 560 + sl * .3, 900 + sl, 760, 'front', { rot, hi: kf(u, [[1.1, 0], [1.6, .9]]) });
  // the examiner's hand and charcoal cuff, sliding away
  const hx = 560 + sl * .3 + kf(u, [[.55, 0], [1.2, 260, 'io']]), hy = 1520 + sl + kf(u, [[.55, 0], [1.2, 700, 'io']]);
  g.save(); g.translate(hx, hy); g.rotate(-.35); fillRR(g, -60, 40, 120, 520, 40, C.examCharcoal); fillR(g, -60, 40, 120, 30, '#F6F1E6'); ell(g, 0, 10, 62, 54, P.skin); g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.ellipse(0, 10, 62, 54, 0, 0, TAU); g.stroke();
  for (const d of [-36, -12, 12, 36]) { line(g, d, -30, d * 1.1, -78, INK, 20); line(g, d, -30, d * 1.1, -78, P.skin, 11); }
  g.restore();
  g.restore();
}
// INSERT: the wall clock, big. hh:mm animate from a to b
export function insertClock(g, u, dur, a, b, o = {}) {
  g.fillStyle = lg(g, 0, 0, 0, H, ['#F3E3C4', '#EAD5B0']); g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .28; g.fillStyle = '#FFD58C'; poly(g, [[0, 300], [W, 0], [W, 1300], [0, 1700]]); g.fill(); g.restore();
  const z = kf(u, [[0, 1], [dur, o.push ?? 1.06, 'lin']]), m = kf(u, [[0, a], [o.spin ?? dur, b, o.spin ? 'io' : 'lin']]);
  g.save(); g.translate(540, 900); g.scale(z, z); clock(g, 0, 0, 330, Math.floor(m / 60), m % 60, o.ss ?? ((u * (o.spin ? 60 : 1)) % 60)); g.restore();
}
// INSERT: the hand-in register on a clipboard, seen from above; row n is being signed (w 0..1)
export function insertRegister(g, u, dur, row, sig, w, o = {}) {
  deskTop(g, u, { col: '#B98250' });
  const z = kf(u, [[0, 1.05], [dur, 1.15, 'lin']]);
  g.save(); g.translate(540, 980); g.scale(z, z); g.rotate(.04);
  fillRR(g, -400 + 14, -560 + 18, 800, 1120, 22, rgba(P.night, .3)); fillRR(g, -400, -560, 800, 1120, 22, '#7A5236'); fillRR(g, -370, -520, 740, 1050, 8, P.paper);
  fillRR(g, -120, -600, 240, 90, 16, '#9A9AA8'); fillRR(g, -90, -585, 180, 50, 10, '#C9C9D2');
  text(g, 'HAND-IN REGISTER', 0, -440, { size: 44, font: F.ui, weight: '700', col: INK, ls: 3 });
  text(g, 'EXECUTIVE QUALIFICATION ASSESSMENT · HALL 12', 0, -390, { size: 20, font: F.ui, weight: '500', col: P.inkSoft, ls: 1 });
  const cols = [-340, -250, 40, 150, 340], rows = 9;
  g.strokeStyle = rgba(INK, .5); g.lineWidth = 2.5; for (let i = 0; i <= rows; i++) line(g, -340, -340 + i * 92, 340, -340 + i * 92, rgba(INK, .4), 2.5);
  for (const x of cols) line(g, x, -340, x, -340 + rows * 92, rgba(INK, .4), 2.5);
  [['NO.', -295], ['CANDIDATE', -105], ['TIME', 95], ['SIGNATURE', 245]].forEach(([s, x]) => text(g, s, x, -362, { size: 18, font: F.ui, weight: '700', col: P.inkSoft, ls: 1 }));
  const names = o.names || ['CANDIDATE 07', 'CANDIDATE 02'], times = o.times || ['11:00', '11:42'];
  for (let i = 0; i < rows; i++) text(g, String(i + 1), -295, -294 + i * 92, { size: 26, font: F.hand, col: INK });
  const sigs = o.sigs || [];
  for (let i = 0; i < Math.max(row, sigs.length); i++) {
    const y = -294 + i * 92, fill = i < row - 1 ? 1 : (i === row - 1 ? w : 0);
    if (i < row) { text(g, names[i], -105, y, { size: 28, font: F.hand, col: INK }); text(g, times[i], 95, y, { size: 28, font: F.hand, col: INK }); }
    if (fill > 0) { g.save(); g.beginPath(); g.rect(160, y - 40, 170 * fill, 80); g.clip(); text(g, (o.sigs || [])[i] || 'J. Hale', 245, y + 4, { size: 50, font: F.script, weight: '700', col: i ? '#5E4E2A' : C.candBlue, rot: -.06 }); g.restore(); }
  }
  g.restore();
  // the signing hand: pen tip follows the signature
  if (o.hand !== false) {
    const y = -294 + (row - 1) * 92, px = 160 + 170 * w + Math.sin(u * 38) * 6, py = y + Math.sin(u * 27) * 10;
    g.save(); g.translate(540, 980); g.scale(z, z); g.rotate(.04); g.translate(px, py); g.scale(.62, .62);
    // forearm from the lower right, cuff, a round ink hand, the pen between fingers
    g.save(); g.translate(90, 70); g.rotate(-.75); fillRR(g, -50, 20, 100, 700, 44, o.sleeve || C.candBlue); fillR(g, -50, 20, 100, 30, '#F6F1E6'); g.restore();
    circ(g, 60, 50, 52, INK); circ(g, 60, 50, 44, P.skin);
    g.save(); g.rotate(.45); line(g, 0, 0, 0, 130, '#1E2236', 16, 'butt'); line(g, 0, 130, 0, 150, P.gold, 16, 'butt'); poly(g, [[-8, 0], [8, 0], [0, -22]]); g.fillStyle = '#B8B2A8'; g.fill(); g.restore();
    for (const d of [-.5, 0]) { g.save(); g.translate(60, 50); g.rotate(-2.4 + d); line(g, 0, 30, 0, 66, INK, 22); line(g, 0, 30, 0, 66, P.skin, 12); g.restore(); }
    g.restore();
  }
}
// INSERT: the handshake. Two forearms meet in the middle and pump twice
export function insertShake(g, u, dur) {
  g.fillStyle = lg(g, 0, 0, W, H, ['#F6DFAE', '#E9C48C', '#C99A66']); g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .45; g.fillStyle = rg(g, 300, 500, 20, 900, ['#FFF1C8', 'rgba(0,0,0,0)']); g.fillRect(0, 0, W, H); g.restore();
  const meet = kf(u, [[0, 0], [.32, 1, 'o']]), pump = Math.sin(clamp((u - .34) / .66) * TAU * 2) * 34 * (u > .34 && u < 1.0 ? 1 : 0), z = kf(u, [[0, 1], [dur, 1.08, 'lin']]);
  g.save(); g.translate(540, 980); g.scale(z, z); g.translate(-540, -980);
  const arm = (side, col, cuff) => {
    g.save(); const x0 = side < 0 ? -200 : 1280, x1 = 540 + side * 70, xa = lerp(x0, x1 + side * 260, meet);
    g.translate(0, pump);
    g.lineCap = 'round'; g.strokeStyle = dark(col, .35); g.lineWidth = 230; g.beginPath(); g.moveTo(x0 - side * 300, 1350 + side * 40); g.lineTo(xa, 1010); g.stroke();
    g.strokeStyle = col; g.lineWidth = 210; g.beginPath(); g.moveTo(x0 - side * 300, 1350 + side * 40); g.lineTo(xa, 1010); g.stroke();
    g.strokeStyle = cuff; g.lineWidth = 200; g.lineCap = 'butt'; g.beginPath(); g.moveTo(xa + side * 10, 1006); g.lineTo(xa - side * 40, 1004); g.stroke();
    g.restore();
  };
  arm(-1, C.examCharcoal, '#F6F1E6'); arm(1, C.candBlue, '#FFFDF6');
  // the clasped hands: two palms, thumbs over
  if (meet > .6) {
    g.save(); g.translate(540, 990 + pump); g.globalAlpha = clamp((meet - .6) / .3);
    ell(g, -40, 0, 150, 120, P.skin); ell(g, 40, 10, 150, 116, mix(P.skin, '#F1DEC4', .5));
    g.lineWidth = 9; g.strokeStyle = INK; g.beginPath(); g.ellipse(-40, 0, 150, 120, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(40, 10, 150, 116, 0, 0, TAU); g.stroke();
    for (const d of [-60, -15, 30]) { g.beginPath(); g.moveTo(d, -70); g.quadraticCurveTo(d + 30, 20, d - 10, 90); g.strokeStyle = rgba(INK, .55); g.lineWidth = 6; g.stroke(); }
    g.beginPath(); g.moveTo(-120, -80); g.quadraticCurveTo(-20, -140, 80, -96); g.lineWidth = 34; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = 22; g.strokeStyle = P.skin; g.stroke();
    g.restore();
  }
  g.restore();
}
// FLASH: the sheet turning over in white light; front → back (blank) → mark scheme
export function flash(g, u, dur, phase) {
  const wb = phase === 0 ? kf(u, [[0, 1], [.12, .25, 'o']]) : kf(u, [[0, .55], [.1, .12, 'o']]);
  g.fillStyle = mix('#FFFFFF', '#E8E6F0', .4); g.fillRect(0, 0, W, H);
  if (phase === 0) {                    // the flip: scaleX cos, front → back
    const a = kf(u, [[.1, 0], [.75, Math.PI, 'io']]), sx = Math.cos(a), side = sx >= 0 ? 'front' : 'back';
    const lift = Math.sin(a) * 60;
    examSheet(g, 540, 960 - lift, 860, side, { sx: Math.max(.02, Math.abs(sx)) * (sx >= 0 ? 1 : 1), filled: 1, paper: sx >= 0 ? P.paper : '#FBF7EE' });
  } else if (phase === 1) {             // the blank back, pushing in
    const z = kf(u, [[0, 1], [dur, 1.12, 'o']]);
    g.save(); g.translate(540, 960); g.scale(z, z); g.translate(-540, -960); examSheet(g, 540, 960, 860, 'back', {}); g.restore();
  } else {                              // the mark scheme, PASS MARK 80
    const z = kf(u, [[0, 1.2], [dur, 1.3, 'lin']]);
    g.save(); g.translate(540, 960); g.scale(z, z); g.translate(-540, -960 + 430); examSheet(g, 540, 960, 860, 'front', { filled: 1, hi: 1 }); g.restore();
  }
  g.save(); g.globalAlpha = wb; g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .16; g.fillStyle = '#7F86B8'; g.fillRect(0, 0, W, H); g.restore();
}
