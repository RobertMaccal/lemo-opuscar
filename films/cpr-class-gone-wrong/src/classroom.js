// The first-aid classroom: two reverse wides of one room, lit by the same tall west windows.
//   frontRoom(): looking at the front (chalkboard, posters, teacher's desk, AED trainer, mat).  Windows on screen RIGHT.
//   classRoom(): looking from the front at the class (four rows).                               Windows on screen LEFT.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, TAU, clamp, lerp, shaft, dust } from './kit.js';
import { sunQuad, clock, noticeboard, win } from './sets.js';

const SKY = ['#F7E6C2', '#FFD999', '#FFBE78'];
// a quad window seen in perspective: q = [tl, tr, br, bl]
function winQuad(g, t, q, { cols = 2, rows = 4, seed = 1 } = {}) {
  const [a, b, c, d] = q, L = (p, r, u) => [lerp(p[0], r[0], u), lerp(p[1], r[1], u)];
  const pt = (u, v) => L(L(a, b, u), L(d, c, u), v);
  g.save(); poly(g, q); g.fillStyle = lg(g, 0, Math.min(a[1], b[1]), 0, Math.max(c[1], d[1]), SKY); g.fill(); g.clip();
  // trees outside, swaying slowly
  const xs = q.map(p => p[0]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, w = Math.max(...xs) - Math.min(...xs);
  g.fillStyle = rgba('#7FA98A', .75);
  for (let i = 0; i < 7; i++) { const yy = lerp(a[1], d[1], .35 + (i % 3) * .12), xx = cx + Math.sin(i * 2.1 + seed) * w * .45 + Math.sin(t * .7 + i) * 3; g.beginPath(); g.arc(xx, yy, w * (.32 + (i % 2) * .12), 0, TAU); g.fill(); }
  g.fillStyle = rgba('#5E8F7A', .6); for (let i = 0; i < 4; i++) { const yy = lerp(a[1], d[1], .55 + i * .08), xx = cx + Math.cos(i * 1.7 + seed) * w * .4 + Math.sin(t * .6 + i) * 3; g.beginPath(); g.arc(xx, yy, w * .3, 0, TAU); g.fill(); }
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(g, cx, lerp(a[1], d[1], .2), 4, w * 1.6, ['rgba(255,236,190,.9)', 'rgba(255,220,160,0)']); g.fillRect(cx - w * 2, a[1] - 200, w * 4, 1400); g.restore();
  g.strokeStyle = P.woodDark; g.lineWidth = 7; g.lineCap = 'butt';
  for (let i = 1; i < cols; i++) { const p0 = pt(i / cols, 0), p1 = pt(i / cols, 1); line(g, p0[0], p0[1], p1[0], p1[1], P.woodDark, 7, 'butt'); }
  for (let j = 1; j < rows; j++) { const p0 = pt(0, j / rows), p1 = pt(1, j / rows); line(g, p0[0], p0[1], p1[0], p1[1], P.woodDark, 6, 'butt'); }
  g.restore();
  poly(g, q); g.strokeStyle = P.woodDark; g.lineWidth = 13; g.lineJoin = 'miter'; g.stroke();
  poly(g, [d, c, [c[0], c[1] + 12], [d[0], d[1] + 12]]); g.fillStyle = P.wood; g.fill();
}

// ---------------- props ----------------
// adult CPR training manikin, lying on its back, head to the left. (x, y) = centre of chest on the mat, d = compression depth (px, local)
export function manikin(g, x, y, s = 1, { d = 0, tilt = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  ell(g, 10, 6, 230, 26, rgba(P.plum, .35));
  const skin = '#EBCDAA', sh = '#C9A588', ink = P.ink;
  // torso shell: shoulders at −150, chest at 0 (dips with d), belly, cut pelvis at +190
  const top = -58 + d;
  g.beginPath(); g.moveTo(-160, 0); g.lineTo(-160, -40); g.quadraticCurveTo(-150, -58, -110, -60);
  g.quadraticCurveTo(-40, -66 + d * .6, 0, top); g.quadraticCurveTo(50, -62 + d * .5, 95, -50); g.quadraticCurveTo(150, -40, 190, -42);
  g.lineTo(196, 0); g.closePath(); g.fillStyle = skin; g.fill(); g.lineWidth = 4.5; g.strokeStyle = ink; g.lineJoin = 'round'; g.stroke();
  // shading underside, nipples-free plastic seams, chest landmark
  g.save(); g.clip(); g.fillStyle = rgba(sh, .8); g.fillRect(-170, -16, 380, 30); g.restore();
  line(g, -40, -40 + d * .6, 40, -38 + d * .6, rgba(sh, .9), 3);
  ell(g, 0, top + 12, 16, 6, rgba('#D8A98A', .9));
  line(g, 150, -40, 150, 0, rgba(sh, .9), 3);
  // neck + head (face up, chin lifted)
  g.beginPath(); g.moveTo(-160, -12); g.lineTo(-196, -16); g.lineTo(-196, -40); g.lineTo(-160, -40); g.closePath(); g.fillStyle = skin; g.fill(); g.stroke();
  g.save(); g.translate(-238, -32); g.rotate(tilt);
  g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.fillStyle = skin; g.fill(); g.stroke();
  // profile on top: brow, nose, lips, chin
  g.beginPath(); g.moveTo(-30, -36); g.quadraticCurveTo(-18, -50, -8, -46); g.lineTo(-2, -60); g.lineTo(8, -47); g.quadraticCurveTo(14, -50, 18, -44); g.quadraticCurveTo(26, -48, 30, -40);
  g.lineWidth = 4; g.strokeStyle = ink; g.stroke();
  line(g, -22, -30, -10, -32, ink, 3.5); // closed eye
  g.restore();
  g.restore();
}
export function aed(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // low cart
  fillR(g, -70, -150, 140, 12, P.woodDark); fillR(g, -64, -138, 10, 130, P.inkSoft); fillR(g, 54, -138, 10, 130, P.inkSoft); fillR(g, -70, -40, 140, 10, P.woodDark);
  circ(g, -58, -4, 8, P.ink); circ(g, 58, -4, 8, P.ink);
  rr(g, -58, -246, 116, 96, 14); g.fillStyle = '#E9C23E'; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke();
  rr(g, -46, -236, 92, 56, 8); g.fillStyle = '#2F8F6A'; g.fill();
  // heart + bolt
  g.save(); g.translate(-14, -208); g.fillStyle = P.white; g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(-22, -2, -12, -20, 0, -8); g.bezierCurveTo(12, -20, 22, -2, 0, 12); g.fill();
  poly(g, [[2, -10], [-4, 1], [2, 1], [-2, 10], [7, -3], [1, -3]]); g.fillStyle = '#2F8F6A'; g.fill(); g.restore();
  text(g, 'AED', 20, -207, { size: 22, col: P.white, font: F.ui, weight: '700' });
  text(g, 'TRAINER', 0, -163, { size: 15, col: P.ink, font: F.ui, weight: '700', ls: 1 });
  g.restore();
}
// the accurate adult-CPR poster
function cprPoster(g, x, y, w, h) {
  fillRR(g, x + 6, y + 8, w, h, 6, rgba(P.plum, .22)); fillRR(g, x, y, w, h, 6, P.paper); g.lineWidth = 3; rr(g, x, y, w, h, 6); g.strokeStyle = P.woodDark; g.stroke();
  fillR(g, x, y, w, 44, '#C8643A'); text(g, 'ADULT CPR', x + w / 2, y + 23, { size: 24, col: P.white, font: F.ui, weight: '700', ls: 2 });
  const st = [['1', 'Check: responsive?', 'Breathing normally?'], ['2', 'Call 911', ''], ['3', 'Get an AED', ''], ['4', 'Push hard & fast', '100–120 / min · centre of chest']];
  st.forEach(([n, a, b], i) => {
    const yy = y + 70 + i * ((h - 84) / 4);
    circ(g, x + 26, yy, 15, '#C8643A'); text(g, n, x + 26, yy + 1, { size: 18, col: P.white, font: F.ui, weight: '700' });
    text(g, a, x + 50, yy - (b ? 8 : 0), { size: 17, col: P.ink, font: F.ui, weight: '600', align: 'left' });
    if (b) text(g, b, x + 50, yy + 13, { size: 12, col: P.inkSoft, font: F.ui, weight: '500', align: 'left' });
  });
}
function heartPoster(g, x, y, w, h) {
  fillRR(g, x + 6, y + 8, w, h, 6, rgba(P.plum, .22)); fillRR(g, x, y, w, h, 6, '#EAF1E6'); g.lineWidth = 3; rr(g, x, y, w, h, 6); g.strokeStyle = P.woodDark; g.stroke();
  g.save(); g.translate(x + w / 2, y + h * .42); g.scale(w / 160, w / 160); g.fillStyle = '#D9644A'; g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-70, -6, -38, -60, 0, -22); g.bezierCurveTo(38, -60, 70, -6, 0, 40); g.fill();
  g.strokeStyle = P.white; g.lineWidth = 6; g.beginPath(); g.moveTo(-46, -2); g.lineTo(-16, -2); g.lineTo(-6, -22); g.lineTo(6, 16); g.lineTo(14, -2); g.lineTo(44, -2); g.stroke(); g.restore();
  text(g, 'EVERY SECOND', x + w / 2, y + h * .78, { size: 15, col: P.ink, font: F.ui, weight: '700', ls: 1 });
  text(g, 'COUNTS', x + w / 2, y + h * .78 + 20, { size: 15, col: P.ink, font: F.ui, weight: '700', ls: 1 });
}
export function teacherDesk(g, x, y, s = 1, dim = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); const c = k => (dim ? mix(k, P.plum, dim) : k);
  fillR(g, -150, -170, 300, 170, c(P.woodDark)); fillR(g, -140, -160, 280, 150, c(P.wood)); fillR(g, -150, -184, 300, 18, c(P.woodLight)); fillR(g, -160, -190, 320, 10, c(dark(P.wood, .1)));
  line(g, -140, -95, 140, -95, c(dark(P.wood, .14)), 3);
  // books, mug, binder
  fillR(g, -120, -232, 22, 42, c(P.tealDeep)); fillR(g, -96, -224, 18, 34, c(P.rust)); fillR(g, -76, -238, 20, 48, c(P.lavDeep));
  rr(g, 70, -226, 34, 36, 6); g.fillStyle = c(P.cream); g.fill(); g.lineWidth = 3; g.strokeStyle = c(P.ink); g.stroke(); g.beginPath(); g.arc(104, -208, 10, -1.2, 1.2); g.stroke();
  fillR(g, -20, -198, 70, 8, c(P.paper)); fillR(g, -14, -204, 64, 6, c(P.mint));
  g.restore();
}

// ---------------- FRONT: chalkboard wall ----------------
const VPF = [560, 760];
export function frontRoom(g, t, o = {}) {
  const FL = 900, WX0 = 100, WX1 = 990;
  // ceiling glow + front wall
  g.fillStyle = lg(g, 0, -300, 0, FL, ['#E9D2A6', '#F4E2BC', '#F7E7C6']); g.fillRect(-400, -400, 1900, FL + 400);
  // right wall with the windows (perspective)
  const kR = u => [VPF[0] + (WX1 - VPF[0]) * (1 + u * 1.9), 0];
  const R = (u, yy) => [VPF[0] + (WX1 - VPF[0]) * (1 + u * 1.9), VPF[1] + (yy - VPF[1]) * (1 + u * 1.9)];
  poly(g, [R(0, -300), R(1.2, -300), R(1.2, FL), R(0, FL)]); g.fillStyle = lg(g, WX1, 0, 1500, 0, ['#EBD3A8', '#E2C79B']); g.fill();
  poly(g, [R(0, 740), R(1.2, 740), R(1.2, FL), R(0, FL)]); g.fillStyle = P.teal; g.fill();
  winQuad(g, t, [R(.12, 70), R(.42, 70), R(.42, 700), R(.12, 700)], { seed: 2 });
  winQuad(g, t, [R(.56, 70), R(.95, 70), R(.95, 700), R(.56, 700)], { seed: 5 });
  // left wall (door side)
  const Lw = (u, yy) => [VPF[0] + (WX0 - VPF[0]) * (1 + u * 1.9), VPF[1] + (yy - VPF[1]) * (1 + u * 1.9)];
  poly(g, [Lw(0, -300), Lw(1.2, -300), Lw(1.2, FL), Lw(0, FL)]); g.fillStyle = lg(g, -300, 0, WX0, 0, ['#D9BC8F', '#E5CCA0']); g.fill();
  poly(g, [Lw(0, 740), Lw(1.2, 740), Lw(1.2, FL), Lw(0, FL)]); g.fillStyle = P.tealDeep; g.fill();
  poly(g, [Lw(.25, 300), Lw(.6, 300), Lw(.6, FL), Lw(.25, FL)]); g.fillStyle = P.woodDark; g.fill();
  poly(g, [Lw(.29, 340), Lw(.56, 340), Lw(.56, FL), Lw(.29, FL)]); g.fillStyle = P.wood; g.fill();
  // dado + skirting on the front wall
  g.fillStyle = lg(g, 0, 740, 0, FL, [mix(P.teal, P.tealLight, .12), P.teal]); g.fillRect(WX0, 740, WX1 - WX0, FL - 740);
  fillR(g, WX0, 732, WX1 - WX0, 18, P.wood); fillR(g, WX0, 732, WX1 - WX0, 5, P.woodLight); fillR(g, WX0, FL - 22, WX1 - WX0, 22, P.tealDark);
  line(g, WX0, -300, WX0, FL, rgba(P.woodDark, .25), 4); line(g, WX1, -300, WX1, FL, rgba(P.woodDark, .25), 4);
  // chalkboard
  fillRR(g, 228, 222, 560, 400, 10, P.woodDark); g.fillStyle = lg(g, 0, 240, 0, 600, ['#3F6E66', '#335C58']); g.fillRect(244, 238, 528, 368);
  g.save(); g.globalAlpha = .1; for (let k = 0; k < 6; k++) ell(g, 300 + k * 90, 360 + (k % 3) * 80, 120, 30, '#FFFFFF', -.2); g.restore();
  const ch = '#F4EEDC';
  text(g, 'CPR & AED Training', 508, 290, { size: 48, font: F.script, weight: '700', col: ch }); line(g, 330, 322, 690, 322, ch, 3);
  text(g, 'Push hard, push fast', 400, 392, { size: 34, font: F.script, weight: '700', col: ch, align: 'left', rot: -.01 });
  text(g, '100–120 / min', 420, 446, { size: 38, font: F.script, weight: '700', col: P.gold, align: 'left', rot: .02 });
  text(g, '→ Call 911   → Get the AED', 300, 520, { size: 30, font: F.script, weight: '700', col: ch, align: 'left' });
  g.save(); g.translate(330, 420); g.scale(.55, .55); g.strokeStyle = ch; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-70, -6, -38, -60, 0, -22); g.bezierCurveTo(38, -60, 70, -6, 0, 40); g.stroke(); g.restore();
  fillR(g, 228, 620, 560, 16, P.wood); fillRR(g, 330, 608, 40, 12, 3, P.paper); fillRR(g, 390, 608, 26, 12, 3, P.rose); fillRR(g, 640, 604, 80, 18, 4, P.lavDeep);
  // posters + clock
  cprPoster(g, 812, 250, 160, 300);
  heartPoster(g, 112, 270, 100, 150);
  clock(g, 508, 140, 52, 3, 42, (t * 1 + 31) % 60);
  // floor
  g.fillStyle = lg(g, 0, FL, 0, 1920, ['#D9B284', '#C99460', '#B07A4A']); g.fillRect(-400, FL, 1900, 1400);
  g.strokeStyle = rgba(P.woodDark, .26); g.lineWidth = 3;
  for (let k = -18; k <= 18; k++) { g.beginPath(); g.moveTo(VPF[0] + k * 70, FL); g.lineTo(VPF[0] + k * 270, 2100); g.stroke(); }
  for (let k = 0; k < 8; k++) { const yy = FL + 26 + k * k * 20 + k * 28; g.beginPath(); g.moveTo(-400, yy); g.lineTo(1500, yy); g.stroke(); }
  // window light falling across the floor and up the front wall (light travels right → left)
  sunQuad(g, t, [[620, 905], [930, 905], [760, 1500], [-80, 1500]], { cols: 2, rows: 4, col: '#FFD996', a: .34, leaves: 9, seed: 3 });
  sunQuad(g, t, [[640, 1560], [1180, 1560], [900, 2100], [80, 2100]], { cols: 2, rows: 3, col: '#FFD996', a: .3, leaves: 6, seed: 8 });
  sunQuad(g, t, [[700, 300], [930, 330], [930, 700], [690, 720]], { cols: 2, rows: 3, col: '#FFDDA0', a: .2, seed: 4 });
  return { FL };
}
// what sits on the front-room floor: desk, AED, mat (the manikin is drawn by the film so it can sit between figures)
export function frontProps(g, t) {
  teacherDesk(g, 150, 1050, .9);
  aed(g, 990, 1100, .85);
  poly(g, [[150, 1105], [930, 1105], [990, 1330], [90, 1330]]); g.fillStyle = '#4E7FA6'; g.fill();
  poly(g, [[90, 1330], [990, 1330], [990, 1348], [90, 1348]]); g.fillStyle = '#3A6488'; g.fill();
  g.strokeStyle = rgba('#FFFFFF', .18); g.lineWidth = 3; g.beginPath(); g.moveTo(540, 1105); g.lineTo(540, 1330); g.stroke();
}
export function frontLight(g, t) {
  shaft(g, [[960, 40], [1180, 40], [300, 1500], [-200, 1500]], '#FFE6B0', .1, 40);
  shaft(g, [[1000, 380], [1200, 380], [620, 1700], [260, 1700]], '#FFE6B0', .07, 36);
}

// ---------------- CLASS: looking at the rows ----------------
const VPC = [540, 600];
export const ROWS = [{ y: 1440, s: .9 }, { y: 1170, s: .68 }, { y: 1010, s: .53 }, { y: 905, s: .42 }];   // row 1 (front) … row 4 (rear)
export const colX = (r, c) => 540 + c * 375 * ROWS[r].s;
export function classRoom(g, t) {
  const FL = 860, BX0 = 150, BX1 = 930;
  g.fillStyle = lg(g, 0, -100, 0, FL, ['#EBD4A8', '#F5E3BF']); g.fillRect(-400, -400, 1900, FL + 400);
  const Lw = (u, yy) => [VPC[0] + (BX0 - VPC[0]) * (1 + u * 1.9), VPC[1] + (yy - VPC[1]) * (1 + u * 1.9)];
  const Rw = (u, yy) => [VPC[0] + (BX1 - VPC[0]) * (1 + u * 1.9), VPC[1] + (yy - VPC[1]) * (1 + u * 1.9)];
  // left wall + windows (west)
  poly(g, [Lw(0, -300), Lw(1.4, -300), Lw(1.4, FL), Lw(0, FL)]); g.fillStyle = lg(g, -300, 0, BX0, 0, ['#E7CB9C', '#EED6AC']); g.fill();
  poly(g, [Lw(0, 720), Lw(1.4, 720), Lw(1.4, FL), Lw(0, FL)]); g.fillStyle = P.teal; g.fill();
  winQuad(g, t, [Lw(.08, 60), Lw(.38, 60), Lw(.38, 640), Lw(.08, 640)], { seed: 7 });
  winQuad(g, t, [Lw(.52, 60), Lw(.95, 60), Lw(.95, 640), Lw(.52, 640)], { seed: 9 });
  // right wall: door + coat hooks
  poly(g, [Rw(0, -300), Rw(1.4, -300), Rw(1.4, FL), Rw(0, FL)]); g.fillStyle = lg(g, BX1, 0, 1400, 0, ['#E2C597', '#D6B888']); g.fill();
  poly(g, [Rw(0, 720), Rw(1.4, 720), Rw(1.4, FL), Rw(0, FL)]); g.fillStyle = P.tealDeep; g.fill();
  poly(g, [Rw(.2, 280), Rw(.5, 280), Rw(.5, FL), Rw(.2, FL)]); g.fillStyle = P.woodDark; g.fill();
  poly(g, [Rw(.23, 316), Rw(.47, 316), Rw(.47, FL), Rw(.23, FL)]); g.fillStyle = P.wood; g.fill();
  poly(g, [Rw(.27, 350), Rw(.43, 350), Rw(.43, 470), Rw(.27, 470)]); g.fillStyle = '#F5E3BF'; g.fill();
  // back wall: dado, noticeboard, shelf, clock, "first aid kit" cabinet
  g.fillStyle = lg(g, 0, 720, 0, FL, [mix(P.teal, P.tealLight, .12), P.teal]); g.fillRect(BX0, 720, BX1 - BX0, FL - 720);
  fillR(g, BX0, 712, BX1 - BX0, 14, P.wood); fillR(g, BX0, 712, BX1 - BX0, 4, P.woodLight); fillR(g, BX0, FL - 16, BX1 - BX0, 16, P.tealDark);
  noticeboard(g, 210, 330, 300, 200, 4, t);
  clock(g, 650, 330, 40, 3, 42, (t + 31) % 60);
  fillRR(g, 730, 400, 130, 150, 6, P.paper); g.lineWidth = 3; rr(g, 730, 400, 130, 150, 6); g.strokeStyle = P.woodDark; g.stroke();
  fillR(g, 780, 430, 30, 90, '#3E9A6E'); fillR(g, 750, 460, 90, 30, '#3E9A6E'); text(g, 'FIRST AID', 795, 534, { size: 15, font: F.ui, weight: '700', col: P.ink, ls: 1 });
  fillR(g, 590, 450, 110, 10, P.woodDark); for (let k = 0; k < 5; k++) fillR(g, 596 + k * 20, 410 + (k % 2) * 8, 16, 40 - (k % 2) * 8, [P.rust, P.tealDeep, P.lavDeep, P.amber, P.plum][k]);
  line(g, BX0, -300, BX0, FL, rgba(P.woodDark, .25), 4); line(g, BX1, -300, BX1, FL, rgba(P.woodDark, .25), 4);
  // floor
  g.fillStyle = lg(g, 0, FL, 0, 1920, ['#D8B083', '#C6905D', '#AC7647']); g.fillRect(-400, FL, 1900, 1400);
  g.strokeStyle = rgba(P.woodDark, .26); g.lineWidth = 3;
  for (let k = -18; k <= 18; k++) { g.beginPath(); g.moveTo(VPC[0] + k * 52, FL); g.lineTo(VPC[0] + k * 300, 2100); g.stroke(); }
  for (let k = 0; k < 8; k++) { const yy = FL + 20 + k * k * 22 + k * 24; g.beginPath(); g.moveTo(-400, yy); g.lineTo(1500, yy); g.stroke(); }
  // window light across the floor (light travels left → right)
  sunQuad(g, t, [[-60, 870], [170, 870], [760, 1300], [180, 1300]], { cols: 2, rows: 3, col: '#FFD996', a: .32, leaves: 8, seed: 11 });
  sunQuad(g, t, [[-220, 1180], [120, 1180], [1100, 1980], [380, 1980]], { cols: 2, rows: 3, col: '#FFD996', a: .3, leaves: 8, seed: 13 });
  return { FL };
}
export function classLight(g, t) {
  shaft(g, [[-200, 40], [80, 40], [900, 1500], [400, 1500]], '#FFE6B0', .1, 40);
  shaft(g, [[-200, 600], [60, 600], [1100, 1900], [600, 1900]], '#FFE6B0', .07, 40);
}
