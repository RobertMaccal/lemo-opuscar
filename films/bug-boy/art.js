// Pixel textures for the sets: summer satoyama (bark, canopy, grass, flowers, leaf, ground), town (concrete, asphalt, windows), interiors
import { PX, ramp, hex, h2, fbm, mulberry } from './px.js';

export function bark(w = 48, h = 96, seed = 3, cols) {
  const P = new PX(w, h), R = ramp(cols ?? ['#1c140e', '#2e2218', '#423222', '#58442e', '#70583c', '#8a7050'], .35);
  P.fill((x, y) => {
    const n = fbm(x * .35, y * .045, seed, 4), groove = Math.abs(Math.sin(x * .9 + fbm(x * .1, y * .03, seed + 2) * 5));
    let v = .3 + n * .55 - (groove < .18 ? .25 : 0) + (groove > .9 ? .1 : 0);
    if (fbm(x * .2, y * .2, seed + 5) > .68) return ramp(['#24361a', '#3a5424', '#567a32'], .3)(n, x, y);   // moss
    return R(v, x, y);
  });
  return P.done();
}
// Canopy clump: overlapping round blobs, lit from the upper right (morning sun from the east)
export function canopy(w, h, seed = 1, o = {}) {
  const P = new PX(w, h), R = mulberry(seed), G = ramp(o.cols ?? ['#0e2414', '#17361c', '#235024', '#346c2c', '#4e8a36', '#74aa44', '#a6cc5c'], .3);
  const blobs = [], n = o.n ?? 9;
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, r = R() * .32; blobs.push([w * (.5 + Math.cos(a) * r), h * (.52 + Math.sin(a) * r * .8), (.16 + R() * .14) * w]); }
  blobs.sort((a, b) => a[1] - b[1]);
  P.fill((x, y) => {
    let best = null;
    for (const [cx, cy, r] of blobs) {
      const jag = (h2(Math.floor(x / 2), Math.floor(y / 2), seed + 9) - .5) * 3.2, dx = x - cx, dy = (y - cy) * 1.15, d = Math.hypot(dx, dy);
      if (d < r + jag) { const lit = (dx * .6 - dy) / r; best = { v: .42 + lit * .3 - d / r * .18 + (fbm(x * .3, y * .3, seed) - .5) * .35 }; }
    }
    if (!best) return null;
    let v = best.v; if (h2(x, y, seed + 3) > .95) v += .25;
    return G(v, x, y);
  });
  P.outline(.5, [8, 18, 10]);
  return P.done();
}
export function grassTuft(w = 18, h = 12, seed = 4, cols) {
  const P = new PX(w, h), R = mulberry(seed), G = ramp(cols ?? ['#1c3a16', '#2e5a20', '#467a2a', '#649a36', '#8cbc4a'], .3);
  for (let i = 0; i < 12; i++) {
    const x0 = 2 + R() * (w - 4), lean = (R() - .5) * 1.2, hh = h * (.45 + R() * .55);
    for (let y = 0; y < hh; y++) { const u = y / hh; P.set(x0 + lean * u * u * hh * .3, h - 1 - y, G(.3 + u * .6, i, y)); }
  }
  return P.done();
}
export function flowers(w = 16, h = 12, seed = 5) {
  const P = new PX(w, h), R = mulberry(seed), G = ramp(['#24461c', '#3a6a28', '#5a8e36']);
  const cols = [['#f4f0e0', '#fff'], ['#f2c84a', '#ffe68a'], ['#c87ad8', '#e8b0f0'], ['#f08aa0', '#ffc0cc']];
  for (let i = 0; i < 6; i++) {
    const x0 = 2 + R() * (w - 4) | 0, hh = 4 + R() * (h - 5) | 0, c = cols[(R() * cols.length) | 0];
    for (let y = 0; y < hh; y++) P.set(x0, h - 1 - y, G(.5, x0, y));
    P.set(x0, h - 1 - hh, c[1]); P.set(x0 - 1, h - 1 - hh, c[0]); P.set(x0 + 1, h - 1 - hh, c[0]); P.set(x0, h - hh, c[0]); P.set(x0, h - 2 - hh, c[0]);
  }
  return P.done();
}
// The hero leaf (macro): broad leaf with a midrib and veins, light from upper right. Returns canvas.
export function bigLeaf(w = 72, h = 40, seed = 3) {
  const P = new PX(w, h), G = ramp(['#143a12', '#1f5a1a', '#2f7a22', '#46982c', '#68b43c', '#94d058', '#c6ec84'], .3);
  P.fill((x, y) => {
    const u = x / (w - 1), v = (y - h / 2) / (h / 2);
    const half = Math.sin(Math.PI * Math.pow(u, .75)) * (1 - u * .15);   // pointed at the tip (right)
    if (Math.abs(v) > half * .96) return null;
    const vv = v / Math.max(.05, half);
    let L = .52 + (1 - Math.abs(vv)) * .12 - vv * .14 + u * .06 + (fbm(x * .2, y * .2, seed) - .5) * .12;
    if (Math.abs(y - h / 2) < .7) L = .86;                       // midrib
    const vein = Math.abs(((x - Math.abs(y - h / 2) * 1.1) % 9 + 9) % 9 - 4.5);
    if (vein < .6 && Math.abs(vv) < .85 && u > .06) L += .14;
    if (Math.abs(vv) > .88) L -= .2;                              // darker rim
    return G(L, x, y);
  });
  P.outline(.45, [10, 30, 8]);
  return P.done();
}
// Summer ground: grass + dirt path + stream bank + paddies (painted from world-space masks)
export function summerGround(w, h, toWorld, M, seed = 21) {
  const P = new PX(w, h);
  const G = ramp(['#1e3a16', '#2a4e1c', '#3a6624', '#4e7e2c', '#68983a', '#88b04a'], .35);
  const D = ramp(['#4a3a26', '#6a5434', '#8a7046', '#a68a5a', '#c0a874'], .35);
  const S = ramp(['#30402a', '#4a5a3c', '#6a7a56', '#8e9a74'], .35);   // wet bank / pebbles
  const W = ramp(['#28524e', '#3a706a', '#58948a', '#88bcae', '#bce0d0'], .35);   // paddy water
  const A = ramp(['#3a2a1a', '#5a4428', '#7a6038'], .35);   // paddy ridges (earth)
  P.fill((x, y) => {
    const [wx, wz] = toWorld(x / w, y / h);
    const n = fbm(x * .2, y * .2, seed + 2), big = fbm(wx * .08, wz * .08, seed + 4);
    const ds = M.stream(wx, wz);
    if (ds < 0) return null;                                   // the stream itself is a separate water mesh
    if (ds < .7) { let v = .3 + n * .6; if (h2(x, y, seed) > .9) v += .3; return S(v, x, y); }
    const pd = M.paddy(wx, wz);
    if (pd === 1) { const row = ((wz * 6) % 1 + 1) % 1 < .32 && ((wx * 7) % 1 + 1) % 1 < .5; if (row) return G(.55 + n * .3, x, y); let v = .45 + big * .4 + (h2(x >> 1, y >> 1, 4) - .5) * .2; return W(v, x, y); }
    if (pd === 2) return A(.4 + n * .5, x, y);
    const dp = M.path(wx, wz);
    if (dp < .75 + (fbm(wx * .9, wz * .9, seed) - .5) * .5) { let v = .45 + n * .4 - dp * .2; if (h2(x, y, seed + 1) > .96) v += .3; if (h2(x, y, seed + 5) > .985) v -= .4; return D(v, x, y); }
    let v = .3 + n * .45 + big * .3 - M.shade(wx, wz) * .3; if (h2(x, y, seed + 3) > .93) v += .22;
    if (h2(x, y, seed + 6) > .996) return hex(['#f4f0e0', '#f2c84a', '#e8a0c8'][(h2(x, y, 9) * 3) | 0]);
    return G(v, x, y);
  });
  return P.done();
}
// Town ground (revealed over the fields): asphalt lots, pavement, curb lines
export function townGround(w, h, toWorld, seed = 41) {
  const P = new PX(w, h), A = ramp(['#2a2a30', '#3a3a42', '#4a4a54', '#5c5c66'], .35), C = ramp(['#6a665e', '#86827a', '#a29e94', '#bcb8ae'], .35);
  P.fill((x, y) => {
    const [wx, wz] = toWorld(x / w, y / h), n = fbm(x * .25, y * .25, seed);
    const bx = ((wx % 9) + 9) % 9, bz = ((wz % 7) + 7) % 7;
    if (bx < .5 || bz < .5) return C(.7 + n * .2, x, y);           // pavement grid
    if (bx < .62 || bz < .62) return C(.25, x, y);
    let v = .4 + n * .4; if (h2(x, y, seed) > .97) v += .25;
    if (Math.abs(bx - 4.5) < .08 && ((wz * 2 | 0) % 2)) return hex('#d8d4c0');   // parking lines
    return A(v, x, y);
  });
  return P.done();
}
export function concrete(w = 48, h = 48, seed = 2, cols) {
  const P = new PX(w, h), R = ramp(cols ?? ['#6e6a64', '#88847c', '#a29e94', '#bab6aa', '#d0ccc0'], .4);
  P.fill((x, y) => { let v = .5 + (fbm(x * .15, y * .15, seed) - .5) * .5; if (y % 12 === 0) v -= .25; if (h2(x, y, seed) > .985) v -= .3; if (fbm(x * .05, y * .3, seed + 3) > .7) v -= .15; return R(v, x, y); });
  return P.done();
}
// Apartment window grid façade (emissive layer for evening windows)
export function facade(w, h, seed, o = {}) {
  const P = new PX(w, h), E = new PX(w, h), R = ramp(o.wall ?? ['#7a766e', '#96928a', '#b0aca2', '#c8c4b8'], .4), Gl = ramp(['#2a3440', '#3a4a5a', '#5a7088'], .4), Li = ramp(['#c86a20', '#f0a040', '#ffd27a', '#fff0c0'], .3);
  const fw = o.fw ?? 12, fh = o.fh ?? 14;
  P.fill((x, y) => {
    const cx = x % fw, cy = y % fh, id = h2(Math.floor(x / fw), Math.floor(y / fh), seed);
    if (cy === fh - 2 || cy === fh - 1) return R(cy === fh - 1 ? .2 : .85, x, y);      // balcony slab
    if (cx >= 2 && cx < fw - 2 && cy >= 3 && cy < fh - 3) {
      if (id > .45) { const c = Li(.5 + (h2(x, y, seed) - .5) * .3 + (cy - 3) / fh * .2, x, y); E.set(x, y, c); return c; }
      return Gl(.4 + (cx < 4 ? .3 : 0), x, y);
    }
    return R(.55 + (fbm(x * .2, y * .2, seed) - .5) * .3, x, y);
  });
  return { c: P.done(), e: E.done() };
}
// Distant ridge (hazy hills)
export function ridgeTex(W, H, col, hi, seed, o = {}) {
  const P = new PX(W, H), c = hex(col), c2 = hex(hi);
  for (let x = 0; x < W; x++) { const top = H * (1 - ((o.base ?? .3) + (o.amp ?? .6) * fbm(x * (o.f ?? .012), 0, seed, 4))); for (let y = Math.floor(top); y < H; y++) P.set(x, y, y - top < 2 ? c2 : ((x * 7 + y * 3) % 23 === 0 ? c2 : c)); }
  return P.done();
}
