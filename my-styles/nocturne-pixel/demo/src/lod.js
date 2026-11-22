// Close-up layer of his window at 4x detail (world 160..230 x 285..345), dissolved in by dither during the push.
import { Buf, C, bayer, halo, warm } from './px.js';
import { HG, archGlass, gridGlass, floorTop, colX, hLight } from './timeline.js';
import { hash } from './rng.js';
export const LOD = { x0: 160, y0: 285, buf: new Buf(280, 240) };
const K = 4, wx = x => (x - LOD.x0) * K, wy = y => (y - LOD.y0) * K;
let BASE = null;
const inA = (g, X, Y, pad = 0) => { // arched glass in LOD px with pad (world px)
  const x0 = wx(g.x - pad), x1 = wx(g.x + g.w + pad), y0 = wy(g.y), y1 = wy(g.y + g.h + pad), cx = wx(g.cx), r = (g.r + pad) * K;
  if (X < x0 || X >= x1 || Y >= y1) return false; if (Y >= y0) return true; const dx = X + .5 - cx, dy = Y + .5 - y0; return dx * dx + dy * dy <= r * r; };
function build() {
  const b = new Buf(280, 240);
  // bricks: 8x3 world -> 32x12, staggered
  for (let Y = 0; Y < 240; Y++) for (let X = 0; X < 280; X++) {
    const y = Y / K + LOD.y0, x = X / K + LOD.x0, row = Math.floor((y - 180) / 3), off = (row & 1) * 4;
    const bx = Math.floor((x + off) / 8), hv = hash(row * 131 + bx * 17), my = ((Y + (180 - LOD.y0) * K) % 12), mx = ((X + (LOD.x0 + off) * K) % 32);
    let c = hv > .8 ? C.n5 : hv < .15 ? C.n3 : C.n4;
    if (my === 0 || my === 1) c = C.n2; else if (mx === 0 || mx === 1) c = C.n2; else if (my === 2) c = hv > .5 ? C.n5 : C.n4;
    else if (bayer(X, Y) < .12 && hv > .4) c = C.n3;
    b.d[Y * 280 + X] = c;
  }
  // string courses
  const band = (y, h, c) => b.rect(0, wy(y), 280, h * K, c);
  band(295, 1, C.n5); band(296, 2, C.n6); band(298, 1, C.n2); band(329, 1, C.n6); band(330, 1, C.n3);
  b.rect(0, wy(296), 280, 2, C.n7);
  // floor 7 windows (sills only in view) and floor 5 lintels/glass
  for (const c of [1, 2, 3, 4]) { const g7 = gridGlass(7, c); b.rect(wx(g7.x - 1), 0, (g7.w + 2) * K, wy(g7.y + g7.h), C.n1); b.rect(wx(g7.x - 2), wy(g7.y + g7.h), (g7.w + 4) * K, 8, C.n7); b.rect(wx(g7.x - 2), wy(g7.y + g7.h) + 2, (g7.w + 4) * K, 2, C.n8); b.rect(wx(g7.x - 2), wy(g7.y + g7.h) + 8, (g7.w + 4) * K, 4, C.n2);
    for (let Y = 0; Y < wy(g7.y + g7.h); Y++) for (let X = wx(g7.x); X < wx(g7.x + g7.w); X++) if ((X + Y) % 37 < 4) b.px(X, Y, C.n3);
    const g5 = gridGlass(5, c); b.rect(wx(g5.x - 2), wy(g5.y - 3), (g5.w + 4) * K, 8, C.n6); b.rect(wx(g5.x - 2), wy(g5.y - 1), (g5.w + 4) * K, 4, C.n3); b.rect(wx(g5.x - 1), wy(g5.y), (g5.w + 2) * K, 240, C.n1); }
  // arched windows of floor 6: stone surround, keystone, sill
  for (const c of [1, 2, 3, 4, 5]) { const g = archGlass(c);
    for (let Y = wy(g.y - g.r - 3); Y < wy(g.y + g.h + 1); Y++) for (let X = wx(g.x - 3); X < wx(g.x + g.w + 3); X++) {
      if (inA(g, X, Y, 2) && !inA(g, X, Y, 1)) b.px(X, Y, Y < wy(g.y) ? (bayer(X, Y) < .3 ? C.n8 : C.n7) : C.n6);
      else if (inA(g, X, Y, 1) && !inA(g, X, Y, 0)) b.px(X, Y, c === 3 ? C.b1 : C.n1); }
    b.rect(wx(g.cx - 1), wy(g.y - g.r - 3), 12, 14, C.n8); b.rect(wx(g.cx - 1) + 1, wy(g.y - g.r - 3) + 1, 10, 2, C.n10);
    b.rect(wx(g.x - 3), wy(g.y + g.h), (g.w + 6) * K, 8, C.n7); b.rect(wx(g.x - 3), wy(g.y + g.h), (g.w + 6) * K, 2, C.n9); b.rect(wx(g.x - 3), wy(g.y + g.h) + 8, (g.w + 6) * K, 4, C.n2);
    if (c !== 3) for (let Y = wy(g.y - g.r); Y < wy(g.y + g.h); Y++) for (let X = wx(g.x); X < wx(g.x + g.w); X++) if (inA(g, X, Y)) {
      const d = (X + Y) % 44; let col = C.n1; if (d < 6) col = bayer(X, Y) < .5 ? C.n3 : C.n2; if (X < wx(g.x) + 6 || X >= wx(g.x + g.w) - 6) col = C.n2; b.px(X, Y, col); }
  }
  return b;
}
// the warm room as seen from outside, simplified (before the true room shows through)
function glassRoom(b, t, X, Y, g) {
  const lx = X - wx(g.x), ly = Y - wy(g.y - g.r), gw = g.w * K, gh = (g.h + g.r) * K;
  let c = ly > gh - 22 ? C.b3 : (bayer(X, Y) < 1 - Math.hypot(lx - gw * .8, ly - gh * .55) / 60 ? C.w8 : C.w7);
  if (ly > gh - 24 && ly < gh - 20) c = C.b4;
  // lamp (right), man (left), models (centre)
  if (Math.hypot(lx - 38, ly - (gh - 52)) < 5) c = C.w10;
  if (lx > 30 && lx < 46 && ly > gh - 58 && ly < gh - 52) c = C.g2;
  const hx = 12, hy = gh - 52; if (Math.hypot(lx - hx, ly - hy) < 6) c = lx < hx - 1 ? C.y2 : C.s2;
  if (lx > 3 && lx < 22 && ly > hy + 5 && ly < gh - 22) c = lx < 8 ? C.b2 : C.b3;
  if (lx > 20 && lx < 34 && ly > gh - 36 && ly < gh - 22) c = (lx < 26 ? C.n6 : lx < 30 ? C.k2 : C.k4);
  if (lx > 24 && lx < 28 && ly > gh - 44 && ly < gh - 36) c = C.n6;
  // lace curtain edges
  if (lx < 5 || lx >= gw - 5) c = ((ly >> 1) + (lx >> 1)) & 1 ? C.w9 : C.w8;
  // transom bar at the arch base
  if (ly >= g.r * K - 2 && ly < g.r * K + 2) c = C.b2;
  return c;
}
export function drawLOD(t, p, portal) {
  if (!BASE) BASE = build();
  const b = LOD.buf; b.copy(BASE);
  const g = HG, L = hLight(t);
  for (let Y = wy(g.y - g.r); Y < wy(g.y + g.h); Y++) for (let X = wx(g.x); X < wx(g.x + g.w); X++) if (inA(g, X, Y)) {
    const fan = Y < wy(g.y);                                           // frosted fanlight in the arch stays
    b.d[Y * 280 + X] = fan ? (Y >= wy(g.y) - 2 ? C.b2 : (L ? (bayer(X, Y) < .45 ? C.w6 : C.w5) : C.n2)) : L ? glassRoom(b, t, X, Y, g) : C.n1;
    if (!fan && portal > 0 && bayer(X, Y) < portal) b.d[Y * 280 + X] = 0;     // the real room shows through
  }
  // rain on the glass: running drips and still beads
  for (let i = 0; i < 26; i++) { const x = wx(g.x) + 2 + Math.floor(hash(i * 3.1) * (g.w * K - 4)); const sp = 6 + hash(i * 9.7) * 16; const yy = (hash(i * 5.3) * 200 + t * sp) % (g.h * K + g.r * K) + wy(g.y - g.r);
    for (let k = 0; k < 6; k++) { const Y = Math.floor(yy - k * 1.6); if (!inA(g, x, Y) || (portal > .7 && bayer(x, Y) < (portal - .7) * 3.3)) continue; b.px(x, Y, k === 0 ? C.w10 : C.n9); }
    const bx = wx(g.x) + 2 + Math.floor(hash(i * 1.7 + 4) * (g.w * K - 4)), by = wy(g.y - g.r) + Math.floor(hash(i * 2.9 + 1) * (g.h + g.r) * K);
    if (inA(g, bx, by) && !(portal > .7 && bayer(bx, by) < (portal - .7) * 3.3)) { b.px(bx, by, C.w9); b.px(bx, by + 1, C.n8); } }
  if (L) halo(b, wx(g.x), wy(g.y - g.r), g.w * K, (g.h + g.r) * K, 60, 1.2, (X, Y) => inA(g, X, Y, 1));
  // dissolve in
  if (p < 1) for (let k = 0; k < b.d.length; k++) { const X = k % 280, Y = (k / 280) | 0; if (bayer(X >> 2, Y >> 2) >= p) b.d[k] = 0; }
}
