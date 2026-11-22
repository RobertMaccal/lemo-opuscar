// Indexed-feel pixel framebuffer: Uint32 pixels on a fixed palette, Bayer dither, palette stepping.
export const W = 360, H = 640, S = 3;          // native grid and scale to 1080x1920
export const OW = W * S, OH = H * S;

export const hex = h => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
export const r8 = c => c & 255, g8 = c => (c >>> 8) & 255, b8 = c => (c >>> 16) & 255;
export const pack = (r, g, b) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
export const lum = c => (0.299 * r8(c) + 0.587 * g8(c) + 0.114 * b8(c)) / 255;

// ---- palette (the whole film draws from this list) ----
const P = {
  // night (outside)
  n0: '#080D19', n1: '#0C1424', n2: '#10192E', n3: '#142238', n4: '#182945', n5: '#22344F', n6: '#2C405B', n7: '#40546B', n8: '#52677D', n9: '#667F99', n10: '#8299B0', n11: '#A9BCCB',
  // warm (inside)
  w0: '#2E2430', w1: '#3F2E33', w2: '#553A35', w3: '#6E4A3A', w4: '#8A5C3E', w5: '#C77D43', w6: '#E09A50', w7: '#F6B85C', w8: '#FFD68A', w9: '#FFE7BB', w10: '#FFF4DC',
  // dusk purples bridge cold and warm
  p0: '#1C1A2E', p1: '#2A2540', p2: '#3B3350', p3: '#574A5E', p4: '#7A6470',
  g0: '#16261F', g1: '#1E3328', g2: '#2D4A35', g3: '#44643F', g4: '#6B8A4E',
  r0: '#3A1E22', r1: '#5A2A2A', r2: '#8C3B32', r3: '#B8574A',
  b0: '#24191A', b1: '#3A2A22', b2: '#5A4030', b3: '#7C5A3E', b4: '#A07A52', b5: '#C49A6C',
  t0: '#2B4A6E', t1: '#4F86B8', t2: '#8CC0EA', t3: '#DDEEFF',
  s0: '#8A5A44', s1: '#C68A64', s2: '#E8B48A', s3: '#F5CFA6',
  y0: '#4A4A55', y1: '#6E6E7A', y2: '#9A9AA6', y3: '#C4C4CC', y4: '#E6E6EA',
  // painted wooden blocks (the miniature)
  k0: '#C9A23A', k1: '#A8473A', k2: '#3E5C8A', k3: '#4E7A4A', k4: '#C8A878', k5: '#8C6A48', k6: '#E3C690',
};
export const C = {}; for (const k in P) C[k] = hex(P[k]);
export const PAL = Object.values(C);

// nearest palette colour (weighted RGB), cached
const nearC = new Map();
export function near(c) {
  let v = nearC.get(c); if (v !== undefined) return v;
  let best = PAL[0], bd = 1e9; const r = r8(c), g = g8(c), b = b8(c);
  for (const p of PAL) { const dr = r - r8(p), dg = g - g8(p), db = b - b8(p); const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db; if (d < bd) { bd = d; best = p; } }
  nearC.set(c, best); return best;
}
export const mix = (a, b, t) => pack(Math.round(r8(a) + (r8(b) - r8(a)) * t), Math.round(g8(a) + (g8(b) - g8(a)) * t), Math.round(b8(a) + (b8(b) - b8(a)) * t));

// palette stepping: warm light (toward amber), night (toward blue dark)
const warmC = new Map(), nightC = new Map(), coolC = new Map();
export function warm(c, n = 1) {
  const k = c * 8 + n; let v = warmC.get(k); if (v !== undefined) return v;
  let x = c; for (let i = 0; i < n; i++) { const L = lum(x); x = near(mix(x, L < .35 ? C.w4 : L < .6 ? C.w6 : C.w9, .32)); if (x === c && i === 0) x = near(mix(c, C.w8, .5)); }
  warmC.set(k, x); return x;
}
export function night(c) {   // lamp off: the room in rain-light
  let v = nightC.get(c); if (v !== undefined) return v;
  const L = lum(c); v = near(mix(C.n1, C.n7, Math.min(1, L * 1.05)));
  if (L > .82) v = C.n8;
  nightC.set(c, v); return v;
}
export function dimStep(c) {  // one step darker toward navy
  let v = coolC.get(c); if (v !== undefined) return v;
  v = near(mix(c, C.n1, .45)); if (v === c) v = near(mix(c, C.n0, .7)); coolC.set(c, v); return v;
}

// ---- Bayer 4x4 ----
const BM = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (BM[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

// ---- buffer ----
export class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.img = new ImageData(w, h); this.d = new Uint32Array(this.img.data.buffer); this.cv = null; }
  clear(c = 0) { this.d.fill(c); return this; }
  copy(src) { this.d.set(src.d); return this; }
  get(x, y) { x |= 0; y |= 0; return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.d[y * this.w + x]; }
  px(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return; this.d[y * this.w + x] = c; }
  rect(x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(this.w, x + w), y1 = Math.min(this.h, y + h);
    for (let j = y0; j < y1; j++) this.d.fill(c, j * this.w + x0, j * this.w + Math.max(x0, x1));
  }
  // ordered-dither fill: pixel set where bayer < level (level may be a function of (x,y))
  dith(x, y, w, h, c, level) {
    x = Math.round(x); y = Math.round(y);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
      const L = typeof level === 'function' ? level(i, j) : level; if (bayer(i, j) < L) this.d[j * this.w + i] = c;
    }
  }
  // vertical gradient through a list of colours, dithered between neighbours
  vgrad(x, y, w, h, cols) {
    const n = cols.length - 1;
    for (let j = 0; j < h; j++) { const f = j / Math.max(1, h - 1) * n, i0 = Math.min(n - 1, Math.floor(f)), fr = f - i0;
      for (let i = 0; i < w; i++) this.px(x + i, y + j, bayer(x + i, y + j) < fr ? cols[i0 + 1] : cols[i0]); }
  }
  hline(x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; this.rect(x0, y, x1 - x0 + 1, 1, c); }
  vline(x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; this.rect(x, y0, 1, y1 - y0 + 1, c); }
  line(x0, y0, x1, y1, c, w = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    const h = Math.floor((w - 1) / 2);
    for (;;) { if (w === 1) this.px(x0, y0, c); else this.rect(x0 - h, y0 - h, w, w, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  disc(cx, cy, r, c) { const r2 = r * r; for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) { const dx = i + .5 - cx, dy = j + .5 - cy; if (dx * dx + dy * dy <= r2) this.px(i, j, c); } }
  ellipse(cx, cy, rx, ry, c) { for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) { const dx = (i + .5 - cx) / rx, dy = (j + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.px(i, j, c); } }
  poly(pts, c) {  // scanline polygon fill
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const yc = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q); for (let i = 0; i + 1 < xs.length; i += 2) { const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]); if (xb > xa) this.rect(xa, y, xb - xa, 1, c); } }
  }
  // map every pixel in a rect through f(c, x, y)
  map(x, y, w, h, f) {
    for (let j = Math.max(0, y | 0); j < Math.min(this.h, (y + h) | 0); j++) for (let i = Math.max(0, x | 0); i < Math.min(this.w, (x + w) | 0); i++) { const k = j * this.w + i, c = this.d[k]; if (c) this.d[k] = f(c, i, j); }
  }
  // sprite from strings: map char -> colour
  spr(rows, x, y, cmap, flip = false) {
    for (let j = 0; j < rows.length; j++) { const r = rows[j]; for (let i = 0; i < r.length; i++) { const ch = r[flip ? r.length - 1 - i : i]; const c = cmap[ch]; if (c) this.px(x + i, y + j, c); } }
  }
  // 1-px ink outline around opaque pixels (into transparent ones)
  outline(c) {
    const { w, h, d } = this, o = new Uint32Array(d);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x; if (d[k]) continue;
      if ((x > 0 && d[k - 1]) || (x < w - 1 && d[k + 1]) || (y > 0 && d[k - w]) || (y < h - 1 && d[k + w])) o[k] = c; }
    d.set(o);
  }
  canvas() { if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.width = this.w; this.cv.height = this.h; this.cx = this.cv.getContext('2d'); } this.cx.putImageData(this.img, 0, 0); return this.cv; }
}

// warm halo onto existing pixels: rect light source, dithered rings by palette stepping
export function halo(buf, x0, y0, w, h, R, strength, skip) {
  for (let j = Math.floor(y0 - R); j < y0 + h + R; j++) for (let i = Math.floor(x0 - R); i < x0 + w + R; i++) {
    if (i < 0 || j < 0 || i >= buf.w || j >= buf.h) continue;
    const dx = i < x0 ? x0 - i : i >= x0 + w ? i - (x0 + w - 1) : 0, dy = j < y0 ? y0 - j : j >= y0 + h ? j - (y0 + h - 1) : 0;
    if (!dx && !dy) continue; const d = Math.hypot(dx, dy * 1.15); if (d > R) continue;
    if (skip && skip(i, j)) continue;
    const f = Math.pow(1 - d / R, 1.6) * strength, b = bayer(i, j), k = j * buf.w + i, c = buf.d[k]; if (!c) continue;
    if (f > b + 1) buf.d[k] = warm(c, 3); else if (f > b + .45) buf.d[k] = warm(c, 2); else if (f > b) buf.d[k] = warm(c, 1);
  }
}
