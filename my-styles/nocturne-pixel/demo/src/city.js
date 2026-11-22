// Sky, clouds, distant skyline (the spire and the water tower), flanking blocks, the wet street.
import { Buf, C, bayer, halo, near, mix, lum, warm, W, H } from './px.js';
import { FLANK, FAR, sharedLevel, T } from './timeline.js';
import { hash, clamp, seg, mulberry } from './rng.js';

const h2 = (i, j) => { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); };
function n2(x, y) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = h2(i, j), b = h2(i + 1, j), c = h2(i, j + 1), d = h2(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y) => n2(x, y) * .55 + n2(x * 2.1 + 3.3, y * 2.1 + 1.7) * .3 + n2(x * 4.3 + 7.1, y * 4.3 + 2.9) * .15;

export function lightning(t) {   // restrained, far away
  const f = (a) => { const u = t - a; if (u < 0 || u > .3) return 0; return u < .067 ? 1 : u < .13 ? .25 : u < .2 ? .7 : 0; };
  return Math.max(f(2.4) * .9, f(14.6) * .6);
}

// ---------- sky (layer depth .15) ----------
const SKYCOLS = [C.n0, C.n0, C.n1, C.n2, C.n2, C.n3, C.p1, C.p2];
export function drawSky(b, t) {
  const F = lightning(t);
  b.vgrad(0, 0, W, H, SKYCOLS);
  // moon behind cloud, cool glow rings
  const mx = 292, my = 76;
  for (let y = my - 60; y < my + 60; y++) for (let x = mx - 60; x < mx + 60; x++) { const d = Math.hypot(x - mx, y - my); if (d > 58) continue;
    const f = Math.pow(1 - d / 58, 1.8) * 1.2; const c = b.get(x, y); if (f > bayer(x, y) + .5) b.px(x, y, C.n4); else if (f > bayer(x, y)) b.px(x, y, C.n3); }
  b.disc(mx, my, 8, C.y3); b.disc(mx + 2, my - 1, 7, C.y4); b.px(mx - 3, my + 2, C.y2); b.px(mx + 1, my + 4, C.y2); b.px(mx - 1, my - 3, C.y2);
  // stars in the high gaps
  const R = mulberry(17); for (let i = 0; i < 26; i++) { const x = Math.floor(R() * W), y = Math.floor(R() * 150), ph = R() * 6; if (Math.sin(t * 2.3 + ph * 3) > -.3) b.px(x, y, i % 4 ? C.n7 : C.n9); }
  // clouds: two drifting decks
  const tt = t * 0.012;
  for (let y = 0; y < 360; y++) { const yf = y / 360; const band = Math.exp(-Math.pow((yf - .32) / .26, 2));
    for (let x = 0; x < W; x++) {
      const v = fbm(x * .016 + tt * 1.0, y * .05 + 2.0) * (.55 + band * .62);
      const th = .58;
      if (v < th - .045) continue;
      const above = fbm(x * .016 + tt, (y - 3) * .05 + 2.0) * (.55 + band * .62);
      let c = C.n2;
      if (v > th + .08) c = C.n3;
      if (above < th && v >= th) c = Math.hypot(x - mx, y - my) < 70 ? C.n8 : C.n5;       // lit upper rims (silver near the moon)
      else if (v > th + .16) c = C.p1;
      if (v < th && bayer(x, y) > (v - (th - .045)) / .045) continue;
      b.px(x, y, c);
    }
  }
  if (F > 0) b.map(0, 0, W, 420, c => near(mix(c, C.n10, .38 * F)));
}

// ---------- far skyline (layer depth .55) ----------
export const S_WIN = { x: 40, y: 238, w: 5, h: 5 }, W_WIN = { x: 318, y: 264, w: 5, h: 5 };
let FARBASE = null;
function buildFar() {
  const b = new Buf(W, H), R = mulberry(311);
  // back row blocks
  let x = -4; while (x < W) { const w = 14 + Math.floor(R() * 26), top = 360 + Math.floor(R() * 110);
    b.rect(x, top, w, H - top, C.n2); b.rect(x, top, w, 1, C.n3);
    if (R() < .3) { b.rect(x + 3, top - 6, 4, 6, C.n2); }
    for (let yy = top + 5; yy < 540; yy += 7) for (let xx = x + 3; xx < x + w - 3; xx += 5) if (R() < .5) b.rect(xx, yy, 2, 2, C.n1);
    x += w + Math.floor(R() * 3); }
  // the spire building (left)
  b.rect(16, 212, 56, 400, C.n3); b.rect(16, 212, 2, 400, C.n4); b.rect(16, 210, 56, 2, C.n5);
  b.rect(30, 186, 28, 26, C.n3); b.rect(30, 186, 2, 26, C.n4); b.rect(29, 185, 30, 1, C.n5);
  b.poly([[30, 186], [58, 186], [44, 140]], C.n3); for (let y = 141; y < 186; y++) { const hw = (y - 140) * 14 / 46; b.px(Math.round(44 - hw), y, C.n5); }
  b.rect(44, 126, 1, 15, C.n5);
  for (let yy = 220; yy < 540; yy += 9) for (let xx = 22; xx < 68; xx += 7) b.rect(xx, yy, 3, 4, C.n2);
  for (let yy = 192; yy < 210; yy += 8) for (let xx = 35; xx < 56; xx += 7) b.rect(xx, yy, 3, 4, C.n2);
  // the water-tower building (right)
  b.rect(284, 238, 64, 400, C.n3); b.rect(284, 238, 2, 400, C.n4); b.rect(284, 236, 64, 2, C.n5);
  b.line(298, 237, 302, 218, C.n4); b.line(328, 237, 324, 218, C.n4); b.line(299, 228, 327, 228, C.n4); b.line(300, 222, 326, 233, C.n3);
  b.rect(298, 200, 31, 18, C.n4); for (let xx = 300; xx < 328; xx += 4) b.rect(xx, 200, 1, 18, C.n3); b.rect(297, 204, 33, 1, C.n2); b.rect(297, 212, 33, 1, C.n2); b.rect(298, 200, 1, 18, C.n6);
  b.poly([[296, 200], [331, 200], [313, 188]], C.n4); b.rect(313, 184, 1, 4, C.n5);
  for (let yy = 246; yy < 540; yy += 9) for (let xx = 290; xx < 344; xx += 7) b.rect(xx, yy, 3, 4, C.n2);
  return b;
}
function lit(b, r, L, R = 6) { if (L <= 0) return; b.rect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, C.n1); b.rect(r.x, r.y, r.w, r.h, L >= 1 ? C.w7 : C.w5); b.rect(r.x + 1, r.y + 1, r.w - 2, 1, C.w9); if (L >= 1) halo(b, r.x, r.y, r.w, r.h, R, .9); }
export function drawFar(b, t) {
  if (!FARBASE) FARBASE = buildFar();
  b.copy(FARBASE);
  for (const f of FAR) { const on = t < f.off && !(f.flick && Math.sin(t * 9 + f.x) > .8); if (on) b.rect(f.x, f.y, 2, 1, (f.x & 1) ? C.w6 : C.w5); }
  lit(b, S_WIN, sharedLevel('S1', t)); lit(b, W_WIN, sharedLevel('W1', t));
  if ((t % 2) < .3) b.px(44, 125, C.r3);
}

// ---------- flanking blocks, street, lamps, cars (main layer) ----------
export function drawFlanks(b, t) {
  const blk = (x0, x1, top, side) => {
    b.rect(x0, top, x1 - x0, 540 - top, C.p1); b.rect(x0, top, x1 - x0, 3, C.n6); b.rect(x0, top + 3, x1 - x0, 1, C.n2);
    for (let y = top + 6; y < 540; y += 3) for (let x = x0; x < x1; x++) if (bayer(x, y) < .2) b.px(x, y, C.p0);
    if (side < 0) b.rect(x1 - 2, top, 2, 540 - top, C.n2); else b.rect(x0, top, 2, 540 - top, C.p2);
  };
  blk(-2, 64, 332, -1); blk(296, 362, 364, 1);
  b.rect(10, 318, 8, 14, C.p1); b.rect(9, 317, 10, 2, C.n6);           // chimney
  let k = 0;
  const win = (x, y) => { const f = FLANK[k++ % FLANK.length]; const on = f.lit && t < f.off;
    b.rect(x - 1, y - 1, 13, 17, C.n2); b.rect(x, y, 11, 15, on ? C.w6 : C.n1);
    if (on) { b.rect(x, y + 11, 11, 4, C.w4); b.rect(x + 1, y, 2, 15, C.r1); halo(b, x, y, 11, 15, 7, .9); }
    else if ((x + y) % 3 === 0) b.rect(x + 2, y + 3, 1, 9, C.n3);
    b.rect(x - 2, y + 15, 15, 2, C.n6); };
  for (let y = 346; y < 500; y += 34) { win(10, y); win(38, y); }
  for (let y = 378; y < 500; y += 34) { win(310, y); win(338, y); }
}
export const LAMPS = [{ x: 92, flick: false }, { x: 268, flick: true }];
export function lampOn(l, t) { if (!l.flick) return 1; const u = (t * 7.3) % 11; return (u > 9.6 && u < 9.9) || (u > 10.2 && u < 10.35) ? .4 : 1; }
export function drawStreet(b, t) {
  b.rect(0, 540, W, 10, C.n5); b.rect(0, 540, W, 1, C.n6); b.rect(0, 549, W, 1, C.n7);  // far sidewalk + curb
  for (let x = 0; x < W; x += 12) b.rect(x, 541, 1, 8, C.n4);
  b.rect(0, 550, W, 70, C.n2);
  for (let y = 551; y < 620; y++) for (let x = 0; x < W; x++) if (bayer(x, y) < .12 + .1 * Math.sin(x * .07 + y * .3)) b.px(x, y, C.n1);
  for (let x = -20 + Math.floor((t * 0) % 30); x < W; x += 30) b.rect(x, 585, 14, 1, C.n4);
  b.rect(0, 620, W, 20, C.n4); b.rect(0, 620, W, 1, C.n6);
  for (let x = 0; x < W; x += 16) b.rect(x, 621, 1, 19, C.n3);
  // lamp posts on the far sidewalk
  for (const l of LAMPS) { const L = lampOn(l, t);
    b.rect(l.x, 494, 2, 50, C.n1); b.rect(l.x, 494, 1, 50, C.n6); b.rect(l.x - 2, 543, 6, 2, C.n1);
    b.rect(l.x - 3, 486, 8, 2, C.n1); b.rect(l.x - 2, 488, 6, 5, L >= 1 ? C.w8 : C.w5); b.rect(l.x - 1, 489, 4, 3, L >= 1 ? C.w10 : C.w6); b.rect(l.x - 2, 493, 6, 1, C.n1);
    halo(b, l.x - 2, 488, 6, 5, L >= 1 ? 22 : 12, L >= 1 ? 1.25 : .6);
    // light pool on the pavement
    for (let y = 540; y < 552; y++) for (let x = l.x - 18; x < l.x + 20; x++) { const f = 1 - Math.abs(x - l.x) / 19 - (y - 540) / 24; if (f > bayer(x, y) * 1.3) b.px(x, y, warm(b.get(x, y), 1)); }
  }
}
// cars: [t0, t1, lane y, dir, colour]
const CARS = [[0.4, 4.9, 603, 1, C.r2], [8.6, 13.6, 566, -1, C.k2]];
export function carX(c, t) { const u = (t - c[0]) / (c[1] - c[0]); return c[3] > 0 ? -30 + u * 420 : 390 - u * 420; }
export function drawCars(b, t) {
  for (const c of CARS) { if (t < c[0] || t > c[1]) continue; const x = Math.round(carX(c, t)), y = c[2], d = c[3], col = c[4];
    const sc = y > 590 ? 1 : .8; const w = Math.round(20 * sc), h = Math.round(7 * sc);
    // headlight beam on wet road
    for (let j = -3; j < 5; j++) for (let i = 0; i < 46; i++) { const X = d > 0 ? x + w + i : x - 1 - i, Y = y + h - 3 + j + Math.round(i * .05 * j);
      const f = (1 - i / 46) * (1 - Math.abs(j - 1) / 5); if (f > bayer(X, Y) + .1) b.px(X, Y, warm(b.get(X, Y) || C.n2, f > .6 ? 2 : 1)); }
    b.rect(x + 2, y - h + 3, w - 5, 3, col); b.rect(x + 4, y - h + 1, w - 9, 3, col); b.rect(x + 5, y - h + 2, w - 11, 2, C.n7);
    b.rect(x, y - h + 5, w, h - 3, col); b.rect(x, y - h + 5, w, 1, near(mix(col, C.w9, .3)));
    b.rect(x + 3, y + 1, 4, 2, C.n0); b.rect(x + w - 7, y + 1, 4, 2, C.n0);
    b.rect(d > 0 ? x + w - 1 : x, y - 1, 1, 2, C.w10); b.rect(d > 0 ? x : x + w - 1, y - 1, 1, 2, C.r3);
  }
}
// reflections of everything bright in the wet road, rain rings
export function drawReflections(b, t) {
  const src = new Uint32Array(b.d);
  for (let y = 551; y < 620; y++) { const dist = y - 550, ys = Math.round(540 - dist * 1.7), fade = 1 - dist / 82;
    const off = Math.round(Math.sin(y * .9 + t * 5) * .9 + Math.sin(y * .37 - t * 2.6) * .8);
    for (let x = 0; x < W; x++) { const xs = x + off; if (xs < 0 || xs >= W) continue;
      let sc = 0, L = 0; for (const dy of [0, -3, 3, -6]) { const yy = ys + dy; if (yy < 0) continue; const c = src[yy * W + xs]; if (!c) continue; const l = lum(c); if (l > L) { L = l; sc = c; } }
      if (!sc) continue;
      if (L > .45) { if (bayer(x, y) < fade * 1.05) b.d[y * W + x] = near(mix(sc, C.n2, .28 + dist / 190)); }
      else if (L > .12 && bayer(x, y) < fade * .35) b.d[y * W + x] = C.n3; }
  }
  // long warm streaks under the lamps
  for (const l of LAMPS) { const L = lampOn(l, t); for (let y = 552; y < 618; y++) { const f = (1 - (y - 552) / 70) * L, off = Math.round(Math.sin(y * .8 + t * 4) * 1.2);
    for (let dx = -2; dx <= 3; dx++) { const x = l.x + dx + off, w = 1 - Math.abs(dx - .5) / 3.2; if (f * w > bayer(x, y) * .9) b.px(x, y, f * w > .55 ? C.w6 : f * w > .3 ? C.w4 : C.w2); } } }
  // splashes
  for (let i = 0; i < 70; i++) { const ph = (t * 3 + hash(i * 7.1)) % 1, cyc = Math.floor(t * 3 + hash(i * 7.1));
    const x = Math.floor(hash(i * 3.3 + cyc * 1.7) * W), y = 542 + Math.floor(hash(i * 5.9 + cyc * 2.3) * 96);
    if (ph < .12) b.px(x, y, C.n9); else if (ph < .25) { b.px(x - 1, y, C.n7); b.px(x + 1, y, C.n7); } }
}
