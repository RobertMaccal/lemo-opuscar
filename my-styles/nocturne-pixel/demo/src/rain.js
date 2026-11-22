// Rain in three depths, drawn on the screen's own pixel grid (it never zooms).
import { C, bayer } from './px.js';
import { hash } from './rng.js';
const LAYERS = [
  { n: 150, len: 3, speed: 240, col: C.n6, slant: .22 },
  { n: 90, len: 5, speed: 400, col: C.n8, slant: .26 },
  { n: 36, len: 8, speed: 680, col: C.n9, slant: .3 },
];
export function drawRain(b, t, amount = 1, x0 = 0, y0 = 0, w = b.w, h = b.h, inside = null) {
  LAYERS.forEach((L, li) => { const n = Math.round(L.n * amount * (w * h) / (360 * 640));
    for (let i = 0; i < n; i++) { const hx = hash(i * 13.7 + li * 101), hp = hash(i * 7.3 + li * 57), span = h + 40;
      const yy = ((hp * span + t * L.speed) % span) - 20, xx = (hx * (w + 80) - 40 + yy * L.slant) % (w + 40);
      for (let k = 0; k < L.len; k++) { const X = Math.round(x0 + xx - k * L.slant), Y = Math.round(y0 + yy - k);
        if (X < x0 || Y < y0 || X >= x0 + w || Y >= y0 + h) continue; if (inside && !inside(X, Y)) continue;
        b.px(X, Y, k === 0 && li === 2 ? C.n10 : L.col); } } });
}
