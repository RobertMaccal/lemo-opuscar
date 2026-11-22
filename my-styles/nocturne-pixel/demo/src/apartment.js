// His room: wall, shelf, photographs, clock, the back window onto the real skyline, desk, lamp, tea.
// Lighting: the lamp warms by palette steps; when his light dies the room drops to rain-light,
// and comes back as a flood that starts at the tiny window in his model.
import { Buf, C, bayer, halo, warm, night, near, mix, W, H } from './px.js';
import { T, hLight, sharedLevel } from './timeline.js';
import { drawMiniature, M_H } from './miniature.js';
import { drawMan } from './oldman.js';
import { drawRain } from './rain.js';
import { hash, seg, clamp } from './rng.js';

export const GL = { x0: 160, x1: 302, y0: 160, y1: 416 };   // back window glass
export const LAMP = { x: 316, y: 384 };
let BASE = null;
function build() {
  const b = new Buf(W, H);
  // wallpaper: warm stripes and small diamonds
  for (let y = 0; y < 432; y++) for (let x = 0; x < W; x++) {
    let c = C.w1; const sx = x % 12;
    if (sx === 0 || sx === 1) c = bayer(x, y) < .5 ? C.w0 : C.w1;
    if (sx === 6 && (y % 12) === 6) c = C.w2; if ((sx === 5 || sx === 7) && (y % 12) === 6) c = C.w2; if (sx === 6 && ((y % 12) === 5 || (y % 12) === 7)) c = C.w2;
    b.d[y * W + x] = c;
  }
  b.rect(0, 18, W, 6, C.b2); b.rect(0, 18, W, 1, C.b3); b.rect(0, 24, W, 1, C.b0);    // crown moulding
  b.rect(0, 110, 150, 2, C.b2);
  // shelf + books + plant
  const R = (s) => hash(s * 12.9898);
  let x = 16; const bc = [C.r1, C.g2, C.n6, C.b3, C.k0, C.p3, C.r2, C.k2, C.g1, C.b4];
  while (x < 118) { const w = 3 + Math.floor(R(x) * 4), h = 16 + Math.floor(R(x + 7) * 12), c = bc[Math.floor(R(x + 3) * bc.length)];
    b.rect(x, 150 - h, w, h, c); b.rect(x, 150 - h, 1, h, warm(c, 1)); b.rect(x, 150 - h + 3, w, 1, near(mix(c, C.w9, .35))); x += w + (R(x + 1) < .2 ? 2 : 0); }
  b.rect(122, 140, 14, 10, C.r2); b.rect(122, 140, 14, 2, C.r3);
  for (const [lx, ly, l] of [[124, 138, 10], [128, 132, 16], [132, 136, 12], [134, 140, 8]]) for (let k = 0; k < l; k++) b.px(lx + Math.round(Math.sin(k * .4 + lx) * 2), ly - k, k % 3 ? C.g3 : C.g4);
  b.disc(126, 126, 3, C.g3); b.disc(133, 124, 3, C.g2); b.disc(129, 121, 2.5, C.g4);
  b.rect(12, 150, 132, 4, C.b3); b.rect(12, 150, 132, 1, C.b4); b.rect(12, 154, 132, 1, C.b0); b.rect(20, 155, 3, 6, C.b2); b.rect(132, 155, 3, 6, C.b2);
  // photographs: him and her; a building; a child
  const frame = (x0, y0, w, h) => { b.rect(x0, y0, w, h, C.b2); b.rect(x0, y0, w, 1, C.b4); b.rect(x0 + 2, y0 + 2, w - 4, h - 4, C.w4); };
  frame(18, 172, 28, 34); b.rect(20, 174, 24, 30, C.w5); b.disc(27, 184, 3, C.w2); b.rect(24, 188, 7, 13, C.w2); b.disc(36, 185, 3, C.w2); b.rect(33, 189, 7, 12, C.w3); b.rect(32, 181, 9, 2, C.w2);
  frame(54, 176, 20, 24); b.rect(56, 178, 16, 20, C.w6); b.rect(60, 182, 8, 14, C.w3); b.rect(61, 184, 2, 2, C.w8); b.rect(65, 188, 2, 2, C.w8);
  frame(84, 174, 18, 18); b.rect(86, 176, 14, 14, C.w5); b.disc(93, 182, 3, C.w3); b.rect(90, 185, 7, 5, C.w3);
  // chair back (behind him)
  b.rect(56, 326, 6, 110, C.b2); b.rect(56, 326, 1, 110, C.b3); b.rect(52, 322, 16, 5, C.b3); b.rect(52, 322, 16, 1, C.b4);
  // window frame and sill; glass left transparent (filled with the view at the end)
  b.rect(GL.x0 - 4, GL.y0 - 4, GL.x1 - GL.x0 + 8, GL.y1 - GL.y0 + 8, C.b2); b.rect(GL.x0 - 4, GL.y0 - 4, GL.x1 - GL.x0 + 8, 1, C.b3);
  b.rect(GL.x0, GL.y0, GL.x1 - GL.x0, GL.y1 - GL.y0, 0);
  b.rect(229, GL.y0, 3, GL.y1 - GL.y0, C.b2); b.rect(229, GL.y0, 1, GL.y1 - GL.y0, C.b3);
  b.rect(GL.x0, 286, GL.x1 - GL.x0, 3, C.b2); b.rect(GL.x0, 286, GL.x1 - GL.x0, 1, C.b3);
  b.rect(GL.x0 - 10, GL.y1 + 2, GL.x1 - GL.x0 + 20, 6, C.b3); b.rect(GL.x0 - 10, GL.y1 + 2, GL.x1 - GL.x0 + 20, 1, C.b4); b.rect(GL.x0 - 10, GL.y1 + 8, GL.x1 - GL.x0 + 20, 1, C.b0);
  b.rect(136, 146, 192, 2, C.b0);                                                     // curtain rod
  // desk
  b.rect(0, 430, W, 50, C.b3);
  for (let y = 430; y < 478; y++) for (let x = 0; x < W; x++) { const g = Math.sin(x * .05 + Math.sin(x * .013 + y * .4) * 2 + y * .9); if (g > .9 && bayer(x, y) < .7) b.px(x, y, C.b2); else if (g < -.95) b.px(x, y, C.b4); }
  b.rect(0, 430, W, 1, C.b2); b.rect(0, 477, W, 2, C.b4); b.rect(0, 479, W, 1, C.b5);
  b.rect(0, 480, W, 86, C.b2); b.rect(0, 480, W, 2, C.b1); b.rect(10, 490, 150, 66, C.b1); b.rect(12, 492, 146, 62, C.b2); b.rect(180, 490, 170, 30, C.b1); b.rect(182, 492, 166, 26, C.b2); b.rect(260, 503, 10, 3, C.w5); b.rect(80, 520, 10, 3, C.w5);
  b.rect(0, 566, W, 74, C.b1); for (let y = 572; y < 640; y += 9) b.rect(0, y, W, 1, C.b0); for (let k = 0; k < 14; k++) b.rect(Math.floor(hash(k * 3.7) * W), 566 + 9 * (k % 8), 1, 9, C.b0);
  b.rect(170, 596, 190, 44, C.r1); for (let x = 172; x < W; x += 6) { b.rect(x, 598, 3, 3, C.r2); b.rect(x + 3, 601, 3, 3, C.r0); } b.rect(170, 596, 190, 1, C.r2);
  // desk clutter on the left: card box with spare blocks, papers, a glue pot
  b.rect(10, 424, 44, 26, C.k6); b.rect(10, 424, 44, 2, C.b5); b.rect(10, 450, 44, 1, C.b2); b.poly([[10, 424], [20, 414], [26, 424]], C.k4);
  b.rect(16, 432, 5, 6, C.k1); b.rect(24, 434, 6, 5, C.k2); b.rect(32, 431, 5, 7, C.k0); b.rect(40, 435, 7, 4, C.k3);
  b.rect(60, 452, 26, 14, C.w9); b.rect(62, 454, 26, 14, C.y4); b.rect(66, 458, 16, 1, C.y2); b.rect(66, 461, 12, 1, C.y2);
  return b;
}
function windowView(v, t, L) {
  // night sky, the spire building (left) and the water tower building (right) behind his block
  v.vgrad(GL.x0, GL.y0, GL.x1 - GL.x0, GL.y1 - GL.y0, [C.n0, C.n1, C.n2, C.n3, C.p1]);
  v.rect(160, 330, 142, 90, C.n2); for (let x = 160; x < 302; x += 13) v.rect(x, 322 + (x * 7) % 14, 9, 10, C.n2);
  v.rect(166, 250, 52, 170, C.n3); v.rect(166, 250, 2, 170, C.n4); v.rect(178, 226, 28, 24, C.n3); v.rect(178, 226, 1, 24, C.n4);
  v.poly([[178, 226], [206, 226], [192, 180]], C.n3); for (let y = 181; y < 226; y++) v.px(Math.round(192 - (y - 180) * 14 / 46), y, C.n5); v.vline(192, 168, 180, C.n5);
  for (let y = 258; y < 420; y += 10) for (let x = 172; x < 214; x += 8) v.rect(x, y, 3, 5, C.n2);
  v.rect(250, 268, 52, 152, C.n3); v.rect(250, 268, 2, 152, C.n4);
  v.line(262, 267, 266, 252, C.n4); v.line(290, 267, 286, 252, C.n4); v.line(263, 260, 289, 260, C.n4);
  v.rect(262, 232, 30, 20, C.n4); for (let x = 264; x < 292; x += 4) v.rect(x, 232, 1, 20, C.n3); v.rect(262, 238, 30, 1, C.n2); v.rect(262, 246, 30, 1, C.n2); v.poly([[260, 232], [294, 232], [277, 220]], C.n4);
  for (let y = 276; y < 420; y += 10) for (let x = 256; x < 300; x += 8) v.rect(x, y, 3, 5, C.n2);
  const lw = (x, y, l) => { if (l <= 0) return; v.rect(x - 1, y - 1, 9, 8, C.n1); v.rect(x, y, 7, 6, l >= 1 ? C.w7 : C.w5); v.rect(x + 1, y + 1, 5, 1, C.w9); v.rect(x + 3, y + 3, 2, 3, C.w4); if (l >= 1) halo(v, x, y, 7, 6, 9, 1.1); };
  lw(188, 262, sharedLevel('S1', t)); lw(268, 290, sharedLevel('W1', t));
  drawRain(v, t * .9, 1.4, GL.x0, GL.y0, GL.x1 - GL.x0, GL.y1 - GL.y0);
  // drips on the glass and a faint warm reflection of the lamp
  for (let i = 0; i < 30; i++) { const x = GL.x0 + 2 + Math.floor(hash(i * 3.3) * (GL.x1 - GL.x0 - 4)), sp = 4 + hash(i * 7.7) * 10, y = GL.y0 + ((hash(i * 1.9) * 300 + t * sp) % (GL.y1 - GL.y0));
    v.px(x, y, C.n9); v.px(x, y - 1, C.n7); }
  if (L) { v.px(292, 372, C.w5); v.px(293, 372, C.w4); v.px(292, 373, C.w4); }
}
function clockHands(b, t) {
  const cx = 72, cy = 76;
  b.disc(cx, cy, 16, C.b2); b.disc(cx, cy, 14, C.w8); b.disc(cx, cy, 12.5, C.w9);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; b.px(Math.round(cx + Math.sin(a) * 11), Math.round(cy - Math.cos(a) * 11), k % 3 ? C.w4 : C.b1); }
  const min = (t / 60) * Math.PI * 2 / 60 * 60 * 0 + (t / 3600) * Math.PI * 2 * 60 / 60;   // the minute hand creeps
  const am = (t / 60) * (Math.PI * 2 / 60) * 1, ah = Math.PI / 2 + am / 12, as = Math.floor(t) / 60 * Math.PI * 2 + 0.6;
  b.line(cx, cy, cx + Math.sin(ah) * 7, cy - Math.cos(ah) * 7, C.b0, 2);
  b.line(cx, cy, cx + Math.sin(am) * 11, cy - Math.cos(am) * 11, C.b0);
  b.line(cx, cy, cx + Math.sin(as) * 11, cy - Math.cos(as) * 11, C.r2);
  b.px(cx, cy, C.w5); b.rect(cx - 2, cy + 17, 5, 3, C.b2);
}
function curtains(b, t) {
  const sway = Math.sin(t * .9) * 1.5 + Math.sin(t * 2.1) * .6;
  for (const [x0, x1, side] of [[138, 162, -1], [300, 324, 1]]) for (let y = 148; y < 430; y++) {
    const off = Math.round(sway * (y - 148) / 280 * side);
    for (let x = x0; x < x1; x++) { const k = (x - x0 + off + 40) % 8; b.px(x + off, y, k < 2 ? C.r0 : k < 5 ? C.r1 : C.r2); } }
  for (let x = 138; x < 324; x += 6) b.rect(x, 146, 3, 3, C.w4);
}
function lamp(b, L) {
  b.rect(318, 466, 28, 6, C.b1); b.rect(318, 466, 28, 1, C.w5); b.rect(320, 464, 24, 2, C.w4);
  b.line(332, 465, 340, 404, C.b1, 2); b.line(333, 465, 341, 404, C.w4); b.line(340, 404, 322, 376, C.b1, 2); b.line(341, 404, 323, 376, C.w4); b.disc(340, 404, 2, C.w5);
  b.poly([[302, 382], [330, 382], [324, 366], [308, 366]], C.g2); b.line(308, 366, 324, 366, C.g4); b.line(324, 366, 330, 382, C.g3); b.rect(302, 382, 28, 1, C.g1);
  if (L) { b.rect(306, 383, 20, 2, C.w10); b.rect(310, 385, 12, 1, C.w9); } else b.rect(306, 383, 20, 2, C.n6);
}
function teaSteam(b, t) {
  b.rect(146, 456, 18, 2, C.y3); b.rect(148, 446, 12, 10, C.y4); b.rect(148, 446, 12, 2, C.w9); b.rect(149, 447, 10, 1, C.b2); b.rect(160, 448, 3, 5, C.y4); b.rect(148, 446, 1, 10, C.y3);
  for (let s = 0; s < 3; s++) for (let k = 0; k < 26; k++) { const y = 444 - k - ((t * 9 + s * 7) % 3); const x = 151 + s * 3 + Math.sin(k * .25 + t * 1.6 + s * 2) * (1 + k * .08);
    if (bayer(Math.round(x), Math.round(y)) < .55 - k * .02) b.px(x, y, k < 10 ? C.w9 : C.y3); }
}
const placedAt = T.place[1];
export function roomLight(t) { return hLight(t); }
export function renderRoom(b, t) {
  if (!BASE) BASE = build();
  b.copy(BASE);
  const L = hLight(t);
  clockHands(b, t); curtains(b, t);
  drawMan(b, t, 'body');
  drawMan(b, t, 'far'); teaSteam(b, t);
  drawMiniature(b, t, t >= placedAt);
  drawMan(b, t, 'arm');
  lamp(b, L);
  // lamp light: warm pools by palette steps (wall, desk, models, him)
  if (L) {
    for (let y = 250; y < 520; y++) for (let x = 120; x < W; x++) { const k = y * W + x, c = b.d[k]; if (!c) continue;
      const dx = x - LAMP.x, dy = (y - LAMP.y) * (y < LAMP.y ? 1.6 : .9), d = Math.hypot(dx, dy) / 150; if (d > 1) continue;
      const f = Math.pow(1 - d, 1.5) * 1.5, bb = bayer(x, y); if (f > bb + .9) b.d[k] = warm(c, 2); else if (f > bb) b.d[k] = warm(c, 1); }
    // dust in the light
    for (let i = 0; i < 26; i++) { const x = 220 + ((hash(i * 4.1) * 110 + t * (2 + hash(i) * 3)) % 110), y = 360 + ((hash(i * 8.3) * 110 + t * (1 + hash(i * 2) * 2)) % 110);
      if (Math.sin(t * 3 + i) > -.2 && b.get(x, y)) b.px(x, y, C.w9); }
  }
  // his light dies → rain-light; it returns as a flood from the tiny window
  if (!L || t >= T.relight && t < T.relight + 1.2) {
    const R = t >= T.relight ? (t - T.relight) * 520 : -1, ox = M_H.x + 1, oy = M_H.y + 2;
    for (let k = 0; k < b.d.length; k++) { const c = b.d[k]; if (!c) continue; const x = k % W, y = (k / W) | 0;
      if (R >= 0 && Math.hypot(x - ox, (y - oy) * 1.1) < R - bayer(x, y) * 26) continue; b.d[k] = night(c); }
  }
  // the view through the back window fills the glass that nothing covers
  const v = VIEW; windowView(v, t, L);
  for (let y = GL.y0; y < GL.y1; y++) for (let x = GL.x0; x < GL.x1; x++) { const k = y * W + x; if (!b.d[k]) b.d[k] = v.d[k]; }
}
const VIEW = new Buf(W, H);
