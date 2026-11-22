// The old man: profile facing right, a pixel rig solved per frame (torso lean, head pitch, 2-bone arm),
// shaded from the lamp on the right, 1-px ink outline. All poses blend through keyframes.
import { Buf, C, bayer, W, H } from './px.js';
import { monotone, clamp, seg, ss } from './rng.js';
import { MINI, M_H, houseSprite } from './miniature.js';

// t, lean, pitch(+ = looking up), fingertip x, y
const K = [
  [17.0, .25, -.25, 186, 400], [19.2, .3, -.3, 186, 398], [20.4, .45, -.38, 194, 452], [20.8, .45, -.38, 194, 456], [21.3, .35, -.3, 198, 434],
  [22.5, .95, -.36, 229, 446], [22.9, .97, -.37, 227, 449], [23.2, .97, -.37, 228, 450], [23.7, .6, -.3, 222, 438], [24.6, .25, -.22, 182, 442],
  [25.6, .25, -.22, 182, 442], [26.9, .7, -.18, 186, 404], [27.2, .72, -.2, 186, 407], [27.5, .58, -.15, 190, 397], [28.2, .6, -.15, 222, 394],
  [29.3, 1.12, -.2, 261, 408], [29.6, 1.15, -.22, 261, 411], [29.9, .9, -.18, 254, 400], [30.4, .6, -.12, 222, 418], [30.9, .6, .28, 222, 418],
  [31.3, .6, -.25, 222, 416], [32.0, .72, -.3, 230, 398], [32.4, .72, -.3, 230, 398], [32.8, .62, -.18, 224, 392], [33.0, .6, .02, 224, 392],
  [33.5, .6, .32, 224, 392], [33.75, .6, .3, 224, 392], [34.05, .66, -.3, 229, 398], [34.4, .72, -.32, 230, 404], [34.8, .7, -.25, 231, 398],
  [35.6, .35, -.15, 184, 440], [37, .3, -.15, 182, 442],
];
const F = [1, 2, 3, 4].map(j => monotone(K.map(k => [k[0], k[j]])));
export function pose(t) {
  const [lean, pitch, tx, ty] = F.map(f => f(t));
  const hold = t < 20.85, point = (t > 21.2 && t < 24.0) || (t > 25.7 && t < 30.5) || (t > 31.4 && t < 35.1);
  const breath = Math.sin(t * Math.PI * 2 / 3.6);
  const blink = ((t + 1.3) % 4.1) < .12 || (t > 33.62 && t < 33.72);
  return { lean, pitch, tx, ty, hold, point, breath, blink };
}
const SB = new Buf(W, H), AB = new Buf(W, H);

function seg2(b, ax, ay, bx, by, w, c, hi, lo) {   // thick shaded limb segment
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, r = w / 2;
  for (let y = Math.floor(Math.min(ay, by) - r - 1); y <= Math.max(ay, by) + r + 1; y++) for (let x = Math.floor(Math.min(ax, bx) - r - 1); x <= Math.max(ax, bx) + r + 1; x++) {
    const px = x + .5 - ax, py = y + .5 - ay, u = clamp((px * dx + py * dy) / (L * L)), qx = px - u * dx, qy = py - u * dy, d = Math.hypot(qx, qy);
    if (d > r) continue; const s = (qx * nx + qy * ny) * (ny > 0 ? -1 : 1);   // + = upper side
    b.px(x, y, s > r * .45 ? hi : s < -r * .5 ? lo : c);
  }
}
function headPix(u, v, p) {   // local head coords (facing right, y down), returns colour or 0
  const e = (u / 11) ** 2 + ((v + .5) / 12.5) ** 2;
  // nose and mustache sit outside the skull ellipse
  if (u >= 9 && u < 13.5 && v >= -1 && v < 4 && u - 9 < (v + 2) * 1.1) return v > 2.5 ? C.s1 : C.s2;
  if (u >= 6 && u < 12 && v >= 4 && v < 6.2) return C.y3;
  if (e > 1) { if (u > -13 && u < -6 && v > -12 && v < 2 && ((u + 9.5) / 4.2) ** 2 + ((v + 4) / 8) ** 2 < 1) return C.y3; return 0; }   // back tuft
  if (u < -2 && v < 3 && !(u > -6 && v > -2)) return (u + v) % 3 === 0 ? C.y2 : C.y3;             // grey hair, back and side
  if (v < -9.5) return bayer(Math.floor(u + 20), Math.floor(v + 20)) < .35 ? C.y3 : C.s2;          // thin on top
  if (u > -6 && u < -1 && v > -2 && v < 4) return (u > -4.5 && u < -2.5 && v > -.5 && v < 2.5) ? C.s0 : C.s1;   // ear
  if (u > 3 && u < 9.5 && (v > -4 && v < 1.6) && (Math.abs(v + 1.2) > 1.6 || u < 3.8 || u > 8.6)) return C.y1;    // spectacles rim
  if (u > 3 && u < 9.5 && v > -4 && v < 1.6) { if (u > 5.2 && u < 6.6 && v > -2.4 && v < -.6) return p.blink ? C.s1 : C.b0; if (u > 7.4 && u < 8.6 && v > -3 && v < -1.8) return C.w10; return C.s3; }
  if (u > 3 && u < 9 && v > -6.6 && v < -4.6) return C.y4;                                        // eyebrow
  if (u > -1 && u < 3.2 && v > -2.4 && v < -1.2) return C.y1;                                     // spectacle arm
  if (u > 6 && u < 9 && v > 7 && v < 8.2) return C.s0;                                            // mouth
  return u < 0 ? (bayer(Math.floor(u + 20), Math.floor(v + 20)) < .5 ? C.s1 : C.s2) : u > 6 ? C.s3 : C.s2;
}
export function drawMan(room, t, layer) {    // layer 'body' (behind desk) or 'arm' (over the models)
  const p = pose(t);
  const Sx = 128 + p.lean * 32, Sy = 352 + p.lean * 18 - (p.breath > .6 ? 1 : 0);
  if (layer === 'body') {
    const b = SB.clear(0);
    // torso: hunched back, knitted sweater
    const Nx = Sx - 8, Ny = Sy - 9;
    const mx = (Sx + 128) / 2; const pts = [[Nx - 9, Ny - 1], [Sx - 30, Sy + 4], [mx - 41, Sy + 30], [84, 440], [150, 440], [mx + 14, Sy + 36], [Sx + 10, Sy + 8], [Nx + 9, Ny + 3]];
    b.poly(pts, C.b3);
    b.map(0, Ny - 4, W, 450 - Ny, (c, x, y) => { if (c !== C.b3) return c; const rib = (x + Math.floor(y / 2)) % 3 === 0 ? C.b2 : c; const back = x < Sx - 18 - (y - Sy) * .25; return back ? (bayer(x, y) < .55 ? C.b2 : rib) : x > Sx + 2 + (y - Sy) * .1 ? (bayer(x, y) < .5 ? C.b4 : c) : rib; });
    b.rect(Sx - 46, 428, 66, 3, C.b2);                     // hem rib
    // neck and collar
    b.poly([[Nx - 3, Ny - 8], [Nx + 5, Ny - 8], [Nx + 7, Ny + 3], [Nx - 3, Ny + 3]], C.s1);
    b.poly([[Nx + 1, Ny - 1], [Nx + 9, Ny + 2], [Nx + 4, Ny + 6]], C.y4);
    // head (rotated by pitch)
    const Hx = Nx + 3 + p.lean * 3, Hy = Ny - 19 + p.lean * 2, a = -p.pitch, ca = Math.cos(a), sa = Math.sin(a);
    for (let y = Math.floor(Hy - 18); y < Hy + 18; y++) for (let x = Math.floor(Hx - 18); x < Hx + 18; x++) {
      const dx = x + .5 - Hx, dy = y + .5 - Hy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca; const c = headPix(u, v, p); if (c) b.px(x, y, c); }
    b.outline(C.b0);
    for (let k = 0; k < b.d.length; k++) if (b.d[k] && ((k / W) | 0) < 436) room.d[k] = b.d[k];
    return;
  }
  // far forearm resting on the desk (by the tea)
  if (layer === 'far') {
    const b = AB.clear(0); seg2(b, Sx - 6, 432, 140, 445, 8, C.b2, C.b3, C.b1); b.ellipse(145, 446, 5, 3, C.s1); b.rect(141, 447, 6, 1, C.s0);
    b.outline(C.b0); for (let k = 0; k < b.d.length; k++) if (b.d[k]) room.d[k] = b.d[k]; return;
  }
  // near arm: 2-bone IK to the fingertip
  const b = AB.clear(0);
  const sx = Sx + 2, sy = Sy + 3, L1 = 49, L2 = 47;
  let hx = p.tx, hy = p.ty; const dx0 = hx - sx, dy0 = hy - sy, D0 = Math.hypot(dx0, dy0);
  const dir = [dx0 / D0, dy0 / D0];
  // hand body sits behind the fingertip
  const hand = 8; const wx = hx - dir[0] * hand, wy = hy - dir[1] * hand;
  let dx = wx - sx, dy = wy - sy, d = Math.min(Math.hypot(dx, dy), L1 + L2 - .5);
  const th = Math.atan2(dy, dx), al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const ex = sx + Math.cos(th + al) * L1, ey = sy + Math.sin(th + al) * L1;
  const cx = ex + (wx - ex) * .86, cy = ey + (wy - ey) * .86;
  seg2(b, sx, sy, ex, ey, 10, C.b3, C.b4, C.b2);
  seg2(b, ex, ey, cx, cy, 9, C.b3, C.b4, C.b2);
  seg2(b, cx, cy, ex + (wx - ex) * .97, ey + (wy - ey) * .97, 9, C.b2, C.b2, C.b1);   // cuff
  // hand: palm + finger(s)
  const fa = Math.atan2(wy - ey, wx - ex);
  b.ellipse(wx, wy, 5, 4, C.s2); b.ellipse(wx - Math.cos(fa) * 1.5, wy + 2, 3.5, 2, C.s1);
  if (p.point) { seg2(b, wx, wy - 1, hx, hy, 2.6, C.s2, C.s3, C.s1); b.ellipse(wx + 1, wy + 2, 3, 2, C.s1); }
  else if (p.hold) { seg2(b, wx, wy - 1, hx, hy, 3, C.s2, C.s3, C.s1); seg2(b, wx - 3, wy + 1, hx - 4, hy + 1, 2.5, C.s1, C.s2, C.s0); }
  else { seg2(b, wx, wy, hx, hy + 2, 4, C.s2, C.s3, C.s1); }
  b.outline(C.b0);
  if (p.hold) houseSprite(b, Math.round(hx), Math.round(hy) + 10, C.k4, C.k1);
  for (let k = 0; k < b.d.length; k++) if (b.d[k]) room.d[k] = b.d[k];
}
