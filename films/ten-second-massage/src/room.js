// The living room: one fixed geography for the whole film (TREATMENT.md §4).
// Front view of the back wall. Window screen-left (the sun), door screen-right, loveseat centre, plant by the window,
// rug and a small round coffee table in front. The couch is drawn in two layers so people can stand behind it or sit on it.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, foliage, rnd } from './kit.js';
import { sunQuad } from './sets.js';

export const R = {
  WL: 1170,                     // wall meets floor
  win: { x: 70, y: 250, w: 400, h: 760 },
  door: { x: 862, y: 440, w: 196, h: 730 },
  couch: { x0: 196, x1: 804, back: 1020, seat: 1292, front: 1352, base: 1400 },
  seatL: 384, seatR: 616,        // the two seats
  yBehind: 1296, yFront: 1452,   // ground lines: behind the couch / in front of it
  bird: { x: 318, y: 668 },
  cal: { x: 700, y: 560, w: 104, h: 128 },
};

// The light of each day: 0 = Monday afternoon … 3 = Thursday, the present golden hour. Fractions blend.
const DAYS = [
  { sun: '#FFE3A0', sky: ['#BFDCD8', '#F4EACB', '#FFE2A8'], wall: ['#F3DDB4', '#F8E7C4'], a: .38, len: .9, grade: 0 },
  { sun: '#FFD487', sky: ['#C7D6D2', '#F6E2BE', '#FFD497'], wall: ['#F1D6A9', '#F7E1BA'], a: .42, len: 1.0, grade: .2 },
  { sun: '#FFC370', sky: ['#CDC8D2', '#F8D7AC', '#FFC07A'], wall: ['#EFCC9C', '#F5D9AE'], a: .46, len: 1.12, grade: .45 },
  { sun: '#FFB25E', sky: ['#B9A9C9', '#F6C597', '#FFAA62'], wall: ['#EBC08F', '#F2CFA2'], a: .5, len: 1.25, grade: .7 },
];
export function day(d) {
  const i = clamp(Math.floor(d), 0, 2), f = clamp(d - i, 0, 1), A = DAYS[i], B = DAYS[i + 1];
  const m = (a, b) => mix(a, b, f);
  return { sun: m(A.sun, B.sun), sky: A.sky.map((c, k) => m(c, B.sky[k])), wall: A.wall.map((c, k) => m(c, B.wall[k])), a: lerp(A.a, B.a, f), len: lerp(A.len, B.len, f), grade: lerp(A.grade, B.grade, f) };
}

// a small ordinary bird (sparrow-ish), facing left; hop = 0..1 little jump, peck, chirp opens the beak
export function bird(g, x, y, s, t, { chirp = 0, look = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const bob = Math.sin(t * 5.3) * 1.2;
  g.translate(0, bob);
  // tail
  poly(g, [[22, -8], [52, -2], [50, 6], [20, 2]]); g.fillStyle = '#6B5546'; g.fill();
  // body
  ell(g, 4, -10, 26, 19, '#8C6E58', -.15);
  ell(g, -2, -4, 18, 12, '#E8D2B4', -.2);
  // wing
  g.beginPath(); g.moveTo(-4, -18); g.quadraticCurveTo(22, -22, 32, -6); g.quadraticCurveTo(14, -2, -2, -8); g.closePath(); g.fillStyle = '#6E5444'; g.fill();
  for (let k = 0; k < 3; k++) line(g, 6 + k * 7, -15 + k, 12 + k * 7, -7 + k, '#4F3C33', 2);
  // head
  g.save(); g.translate(-18, -24); g.rotate(look * .35);
  circ(g, 0, 0, 13, '#8C6E58'); ell(g, -3, 5, 9, 6, '#E8D2B4');
  circ(g, -5, -2, 3.2, P.ink); circ(g, -6, -3, 1, P.white);
  // beak
  const o = chirp * .5;
  poly(g, [[-11, -2], [-21, 0 - o * 4], [-11, 2]]); g.fillStyle = '#E39B4C'; g.fill();
  poly(g, [[-11, 2], [-19, 2 + o * 6], [-11, 4]]); g.fill();
  g.restore();
  // legs
  line(g, 0, 7, -2, 16, '#6B4A3A', 2.2); line(g, 8, 7, 8, 16, '#6B4A3A', 2.2);
  g.restore();
  g.lineWidth = 1;
}

// outside the window: sky, low sun, far trees, the branch where the bird sits
function outside(g, t, D, birdOn, o) {
  const { x, y, w, h } = R.win;
  g.fillStyle = lg(g, 0, y, 0, y + h, D.sky); g.fillRect(x, y, w, h);
  // the low sun, left, glowing
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(g, x + 70, y + h * .74, 10, 330, [rgba('#FFF1C4', .95), rgba(D.sun, .55), 'rgba(0,0,0,0)']); g.fillRect(x - 200, y, w + 400, h); g.restore();
  circ(g, x + 70, y + h * .74, 46, '#FFF4D2');
  // far rooftops and trees in haze
  g.fillStyle = mix(D.sky[2], P.lav, .42);
  for (let i = 0; i < 6; i++) { const hx = x - 30 + i * 80, hh = 70 + (i * 37 % 50); g.fillRect(hx, y + h - 130 - hh * .4, 64, 200); poly(g, [[hx - 6, y + h - 130 - hh * .4], [hx + 32, y + h - 170 - hh * .4], [hx + 70, y + h - 130 - hh * .4]]); g.fill(); }
  foliage(g, x + w * .78, y + h * .82, 150, [mix(P.tealDeep, P.lav, .35), mix(P.teal, P.lav, .3)], t * .6, 11);
  // the branch, from the right edge, with leaves
  g.strokeStyle = '#5B4234'; g.lineCap = 'round'; g.lineWidth = 15; g.beginPath(); g.moveTo(x + w + 30, y + h * .5); g.quadraticCurveTo(x + w * .7, y + h * .5 + 10, x + w * .42, y + h * .56 - 4); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(x + w * .66, y + h * .52); g.quadraticCurveTo(x + w * .6, y + h * .4, x + w * .48, y + h * .36); g.stroke();
  foliage(g, x + w * .9, y + h * .4, 120, [P.tealDark, P.tealDeep, P.teal], t, 3);
  foliage(g, x + w * .5, y + h * .33, 70, [P.tealDeep, P.teal, '#8FBF9F'], t, 7);
  if (birdOn) bird(g, R.bird.x, R.bird.y, 1.5, t, o);
}

// back wall, window, door, decor, floor, rug. d = day (0..3)
export function roomBack(g, t, d = 3, { birdOn = true, chirp = 0, look = 0, cal = 3, calFlip = 0 } = {}) {
  const D = day(d), WL = R.WL, X0 = -400, X1 = 1500;
  // wall
  g.fillStyle = lg(g, 0, -300, 0, WL, D.wall); g.fillRect(X0, -400, X1 - X0, WL + 400);
  // crown moulding and a soft ceiling shadow
  fillR(g, X0, 96, X1 - X0, 16, lite(D.wall[0], .3)); fillR(g, X0, 112, X1 - X0, 6, rgba(P.plum, .14));
  g.fillStyle = lg(g, 0, -400, 0, 300, [rgba(P.plum, .22), rgba(P.plum, 0)]); g.fillRect(X0, -400, X1 - X0, 700);
  // teal wainscot
  g.fillStyle = lg(g, 0, 930, 0, WL, [mix(P.teal, P.tealLight, .18), P.teal]); g.fillRect(X0, 930, X1 - X0, WL - 930);
  fillR(g, X0, 922, X1 - X0, 16, P.wood); fillR(g, X0, 922, X1 - X0, 5, P.woodLight); fillR(g, X0, WL - 26, X1 - X0, 26, P.tealDark);
  for (let px = -360; px < 1500; px += 150) { g.strokeStyle = rgba(P.tealDark, .35); g.lineWidth = 3; rr(g, px + 14, 960, 122, WL - 1010, 6); g.stroke(); }
  // window
  const { x, y, w, h } = R.win;
  fillRR(g, x - 30, y - 30, w + 60, h + 60, 10, rgba(P.plum, .16));
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); outside(g, t, D, birdOn, { chirp, look }); g.restore();
  g.strokeStyle = P.woodDark; g.lineWidth = 12; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); for (const k of [1, 2]) { g.moveTo(x, y + h * k / 3); g.lineTo(x + w, y + h * k / 3); } g.stroke();
  g.lineWidth = 20; g.strokeRect(x, y, w, h); fillR(g, x - 34, y + h + 6, w + 68, 22, P.woodDark); fillR(g, x - 34, y + h + 6, w + 68, 7, P.woodLight);
  // glass glint
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .18; poly(g, [[x + 40, y], [x + 120, y], [x + 10, y + 260], [x, y + 260], [x, y + 120]]); g.fillStyle = '#FFFFFF'; g.fill(); g.restore();
  // curtains, tied back
  for (const s of [-1, 1]) {
    const cx = s < 0 ? x - 44 : x + w + 44; g.fillStyle = lg(g, cx - 40, 0, cx + 40, 0, [mix(P.rose, P.lav, .3), mix(P.rose, P.cream, .25), mix(P.rose, P.lav, .4)]);
    g.beginPath(); g.moveTo(cx - 40 * s * -1 - 10, y - 50); g.lineTo(cx + 30 * s, y - 50); g.quadraticCurveTo(cx + 6 * s, y + h * .5, cx + 26 * s, y + h + 40); g.lineTo(cx - 30 * s, y + h + 40); g.quadraticCurveTo(cx - 6 * s, y + h * .5, cx - 40 * s * -1 - 10, y - 50); g.closePath(); g.fill();
    fillRR(g, cx - 34, y + h * .55, 68, 14, 7, P.orange);
  }
  fillRR(g, x - 110, y - 64, w + 220, 16, 8, P.woodDark);
  // door
  const Dr = R.door; fillR(g, Dr.x - 20, Dr.y - 20, Dr.w + 40, Dr.h + 20, P.woodDark); fillR(g, Dr.x, Dr.y, Dr.w, Dr.h, '#C99A6E');
  g.strokeStyle = rgba(P.woodDark, .55); g.lineWidth = 4; rr(g, Dr.x + 24, Dr.y + 30, Dr.w - 48, Dr.h * .38, 6); g.stroke(); rr(g, Dr.x + 24, Dr.y + Dr.h * .5, Dr.w - 48, Dr.h * .42, 6); g.stroke();
  circ(g, Dr.x + 30, Dr.y + Dr.h * .52, 10, '#E8C27A'); circ(g, Dr.x + 30, Dr.y + Dr.h * .52, 4, P.woodDark);
  // framed picture above the couch: a little sunset doodle
  g.save(); g.translate(140, -20); fillRR(g, 360, 600, 180, 140, 6, P.woodDark); g.fillStyle = lg(g, 0, 612, 0, 728, ['#F7D9A6', '#F2A65A']); g.fillRect(372, 612, 156, 116);
  circ(g, 450, 692, 20, '#FFF0C4'); g.fillStyle = mix(P.teal, P.lav, .3); poly(g, [[372, 728], [372, 694], [416, 672], [462, 704], [506, 684], [528, 700], [528, 728]]); g.fill(); g.restore();
  // wall calendar by the couch: MON TUE WED THU
  calendar(g, cal, calFlip);
  // a little shelf with two objects
  fillR(g, 520, 800, 140, 10, P.woodDark); fillRR(g, 540, 750, 26, 50, 6, P.rust); circ(g, 616, 780, 20, mix(P.lav, P.cream, .3)); line(g, 616, 760, 622, 740, P.tealDeep, 4);
  // floor
  g.fillStyle = lg(g, 0, WL, 0, 1920, ['#D8AC7E', '#C59262', '#AE7A4E']); g.fillRect(X0, WL, X1 - X0, 1000);
  g.strokeStyle = rgba(P.woodDark, .24); g.lineWidth = 3; for (let k = -14; k <= 14; k++) { g.beginPath(); g.moveTo(520 + k * 80, WL); g.lineTo(520 + k * 240, 2100); g.stroke(); }
  // rug
  ell(g, 520, 1560, 560, 190, rgba(P.plum, .18)); ell(g, 520, 1548, 540, 176, mix(P.rose, P.lav, .45)); ell(g, 520, 1548, 470, 138, mix(P.rose, P.cream, .35));
  g.strokeStyle = rgba(P.cream, .7); g.lineWidth = 5; g.setLineDash([16, 14]); g.beginPath(); g.ellipse(520, 1548, 505, 157, 0, 0, TAU); g.stroke(); g.setLineDash([]);
  // the sun on the floor and the wall (windows projected away from the window, toward camera and right)
  const L = D.len;
  sunQuad(g, t, [[x + 30, WL + 8], [x + w - 10, WL + 8], [x + w + 470 * L, 1920], [x + 260 * L, 1920]], { cols: 2, rows: 3, col: D.sun, a: D.a * .85, leaves: 10, seed: 4 });
  return D;
}

function calendar(g, page, flip) {
  const { x, y, w, h } = R.cal, days = ['MON', 'TUE', 'WED', 'THU'];
  line(g, x + w / 2, y - 26, x + w / 2, y + 4, P.inkSoft, 3); circ(g, x + w / 2, y - 28, 5, P.rust);
  fillRR(g, x + 6, y + 8, w, h, 6, rgba(P.plum, .2));
  fillRR(g, x, y, w, h, 6, P.paper); fillRR(g, x, y, w, 30, 6, P.rust); fillR(g, x, y + 20, w, 10, P.rust);
  const p = clamp(Math.round(page), 0, 3);
  text(g, days[p], x + w / 2, y + 62, { size: 34, col: P.ink });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) fillR(g, x + 14 + i * 21, y + 86 + j * 12, 14, 6, i + j * 4 === p + 2 ? P.rust : rgba(P.lavDeep, .45));
  if (flip > 0 && flip < 1) {   // the old page lifting away
    g.save(); g.translate(x, y + 30); g.scale(1, 1 - flip); g.globalAlpha = 1 - flip * .6;
    fillR(g, 0, 0, w, h - 30, P.paper); text(g, days[Math.max(0, p - 1)], w / 2, 32, { size: 34, col: P.ink }); g.restore();
  }
}

// the plant by the window (front of the wall, on the floor)
export function plant(g, t, x = 96, y = 1330) {
  fillRR(g, x - 52, y - 92, 104, 92, 14, P.rust); fillR(g, x - 58, y - 100, 116, 16, dark(P.rust, .15));
  g.strokeStyle = P.tealDark; g.lineWidth = 6; g.lineCap = 'round';
  const r = rnd(9);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (r() - .5) * 2.1, L = 150 + r() * 140, sw = Math.sin(t * 1.1 + i) * .03;
    const ex = x + Math.cos(a + sw) * L * .7, ey = y - 96 + Math.sin(a + sw) * L;
    g.beginPath(); g.moveTo(x, y - 96); g.quadraticCurveTo(x + Math.cos(a) * L * .2, ey + 60, ex, ey); g.stroke();
    g.save(); g.translate(ex, ey); g.rotate(a + Math.PI / 2 + sw); ell(g, 0, -22, 22, 44, i % 2 ? P.tealDeep : P.teal); line(g, 0, 10, 0, -50, rgba(P.tealDark, .7), 3); g.restore();
  }
}

// the couch, back half (behind the sitters, in front of whoever stands behind it)
export function couchBack(g, t, D) {
  const C = R.couch, col = '#4F8A87';
  ell(g, 500, C.base + 6, 360, 26, rgba(P.plum, .3));
  fillRR(g, C.x0 + 10, C.back, C.x1 - C.x0 - 20, C.seat - C.back + 30, 34, dark(col, .12));
  for (const [a, b] of [[C.x0 + 34, 496], [504, C.x1 - 34]]) {
    fillRR(g, a, C.back + 18, b - a, C.seat - C.back + 4, 30, col);
    g.fillStyle = lg(g, 0, C.back + 18, 0, C.seat, [rgba('#FFFFFF', .14), rgba('#FFFFFF', 0)]); rr(g, a, C.back + 18, b - a, C.seat - C.back + 4, 30); g.fill();
    line(g, (a + b) / 2 - 30, C.back + 70, (a + b) / 2 + 30, C.back + 70, rgba(P.tealDark, .4), 4);
  }
  // sunlight on the back cushions
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = D.a * .5; g.fillStyle = D.sun; poly(g, [[C.x0, C.back + 10], [C.x0 + 230, C.back + 10], [C.x0 + 330, C.seat], [C.x0, C.seat]]); g.fill(); g.restore();
}
// seat cushions, arms, skirt
export function couchFront(g, t, D, { dentL = 0, dentR = 0 } = {}) {
  const C = R.couch, col = '#4F8A87', top = lite(col, .1);
  for (const [a, b, dn] of [[C.x0 + 40, 498, dentL], [502, C.x1 - 40, dentR]]) {
    fillRR(g, a, C.seat + dn * 10, b - a, C.front - C.seat - dn * 10 + 10, 18, top);
    fillRR(g, a, C.seat + 34, b - a, C.front - C.seat - 24, 14, col);
  }
  fillRR(g, C.x0 + 30, C.front - 2, C.x1 - C.x0 - 60, C.base - C.front, 10, dark(col, .2));
  for (const fx of [C.x0 + 50, C.x1 - 70]) fillRR(g, fx, C.base - 4, 20, 14, 4, P.woodDark);
  for (const [ax, s] of [[C.x0, -1], [C.x1, 1]]) {
    const x0 = s < 0 ? ax - 22 : ax - 62;
    fillRR(g, x0, C.seat - 92, 84, C.base - C.seat + 86, 34, dark(col, .06)); fillRR(g, x0 + 6, C.seat - 92, 72, 46, 23, lite(col, .14));
  }
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = D.a * .45; g.fillStyle = D.sun; poly(g, [[C.x0 - 20, C.seat - 90], [C.x0 + 60, C.seat - 90], [C.x0 + 170, C.base], [C.x0 - 20, C.base]]); g.fill(); g.restore();
}
// small round coffee table in the foreground (front-left), mug and book
export function coffeeTable(g, t, D, x = 170, y = 1700) {
  ell(g, x + 30, y + 10, 190, 30, rgba(P.plum, .3));
  for (const lx of [-110, 110]) line(g, x + lx, y - 40, x + lx * 1.08, y + 2, P.woodDark, 12);
  ell(g, x, y - 60, 180, 44, P.woodDark); ell(g, x, y - 68, 176, 40, P.wood); ell(g, x - 30, y - 78, 110, 20, rgba('#FFFFFF', .12));
  fillRR(g, x - 120, y - 92, 90, 22, 4, P.tealDeep); fillRR(g, x - 114, y - 102, 80, 12, 3, P.paper);
  fillRR(g, x + 40, y - 120, 46, 52, 8, P.cream); g.strokeStyle = P.cream; g.lineWidth = 8; g.beginPath(); g.arc(x + 90, y - 96, 13, -1.4, 1.4); g.stroke();
  for (let k = 0; k < 2; k++) { g.strokeStyle = rgba('#FFFFFF', .35 + .2 * Math.sin(t * 2 + k)); g.lineWidth = 3; g.beginPath(); g.moveTo(x + 56 + k * 14, y - 128); g.quadraticCurveTo(x + 46 + k * 14 + Math.sin(t * 1.6 + k) * 8, y - 150, x + 58 + k * 14, y - 172); g.stroke(); }
}
// light in the air: shaft from the window + dust
export function air(g, t, D) {
  const { x, y, w, h } = R.win, L = D.len;
  shaft(g, [[x + 20, y + 40], [x + w - 20, y + 20], [x + w + 520 * L, 1900], [x + 240 * L, 1900]], D.sun, .1 + D.grade * .05, 40);
  dust(g, t, x + 60, y + 100, 620, 1200, 50, 6, '#FFF2CF', .55);
}
