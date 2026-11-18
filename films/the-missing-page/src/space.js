// A tiny perspective camera for flat-shaded sets: world X right, Y up, Z forward (rig units: a man is ~510 tall).
// view({ x, y, z, yaw, f, cx, cy }) → helpers that project points, fill clipped polygons and place rigs at the right size.
import { P, mix, rgba, clamp, lerp } from './kit.js';
import { drawChar } from './rig.js';

export function view({ x = 0, y = 300, z = 0, yaw = 0, f = 1000, cx = 540, cy = 960, near = 40, haze = null, hazeFar = 6000 } = {}) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const cam = (X, Y, Z) => { const dx = X - x, dz = Z - z; return [dx * cs - dz * sn, Y - y, dx * sn + dz * cs]; };
  const scr = ([u, v, d]) => [cx + f * u / d, cy - f * v / d];
  const V = {
    f, cx, cy, x, y, z, yaw, haze,
    c: cam,
    depth: (X, Z) => (X - x) * sn + (Z - z) * cs,
    p: (X, Y, Z) => { const q = cam(X, Y, Z); return scr([q[0], q[1], Math.max(near, q[2])]); },
    s: (X, Z) => f / Math.max(near, (X - x) * sn + (Z - z) * cs),
    fog(col, d, k = 1) { return haze ? mix(col, haze, clamp((d - 600) / hazeFar) * .8 * k) : col; },
    // polygon of world points, clipped against the near plane; fill = colour | (g, pts) => style
    path(g, pts) {
      let Q = pts.map(p => cam(p[0], p[1], p[2]));
      const out = [];
      for (let i = 0; i < Q.length; i++) {
        const a = Q[i], b = Q[(i + 1) % Q.length], ia = a[2] >= near, ib = b[2] >= near;
        if (ia) out.push(a);
        if (ia !== ib) { const t = (near - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), near]); }
      }
      if (out.length < 3) return null;
      const S = out.map(scr); g.beginPath(); S.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); return S;
    },
    poly(g, pts, fill, stroke = null, lw = 2) {
      const S = V.path(g, pts); if (!S) return null;
      g.fillStyle = typeof fill === 'function' ? fill(g, S) : fill; g.fill();
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
      return S;
    },
    line(g, a, b, col, w) { const p = V.p(...a), q = V.p(...b); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.stroke(); },
    // box from (x0,y0,z0) to (x1,y1,z1): draws the faces that face the camera; cols = { top, front (−Z), back (+Z), left (−X), right (+X) }
    box(g, x0, y0, z0, x1, y1, z1, cols, stroke = null) {
      const F = [];
      const dx = (x0 + x1) / 2 - x, dz = (z0 + z1) / 2 - z;
      if (y < y1 && cols.top) F.push([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], cols.top]);
      if (y > y0 && cols.bottom) F.push([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], cols.bottom]);
      if (z < z0 && cols.front) F.push([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], cols.front]);
      if (z > z1 && cols.back) F.push([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], cols.back]);
      if (x < x0 && cols.left) F.push([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], cols.left]);
      if (x > x1 && cols.right) F.push([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], cols.right]);
      for (const f of F) V.poly(g, f.slice(0, 4), f[4], stroke, 2);
    },
    // a rig standing on (X, Y, Z)
    ch(g, chr, pose, X, Z, L, opt = {}, Y = 0) { if (V.depth(X, Z) < 90) return null; const q = V.p(X, Y, Z), s = V.s(X, Z) * (opt.k || 1); drawChar(g, chr, { ...pose, x: q[0], y: q[1], s }, L, opt); return { x: q[0], y: q[1], s }; },
  };
  return V;
}
// painter's algorithm: items [{ d, fn }] drawn far → near
export function paint(items) { items.sort((a, b) => b.d - a.d); for (const it of items) it.fn(); }
