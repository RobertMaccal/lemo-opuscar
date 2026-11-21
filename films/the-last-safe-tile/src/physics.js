// Physics primitives: tile support, ball–ball impulses, perimeter rails, broad phase.
// Planar motion on the board; gravity only acts (into the void) once support is lost.

import { GRID, PITCH, RESTITUTION, RAIL_RESTITUTION, FRICTION, RAIL_OFFSET } from './config.js';

// ---- support: weighted samples over the contact patch (centre + two rings)
const SAMPLES = (() => {
  const s = [[0, 0, 0.3]];
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; s.push([0.45 * Math.cos(a), 0.45 * Math.sin(a), 0.07]); }
  for (let k = 0; k < 6; k++) { const a = ((k + 0.5) / 6) * Math.PI * 2; s.push([0.85 * Math.cos(a), 0.85 * Math.sin(a), 0.28 / 6]); }
  return s;
})();

export function surfaceAt(solid, x, y) {
  // Adjacent active tiles form one continuous surface: seams are visual only.
  if (x < 0 || y < 0 || x >= GRID * PITCH || y >= GRID * PITCH) return false;
  return solid[((y / PITCH) | 0) * GRID + ((x / PITCH) | 0)] === 1;
}

export function supportFraction(solid, x, y, r) {
  let s = 0;
  for (let i = 0; i < SAMPLES.length; i++) {
    const p = SAMPLES[i];
    if (surfaceAt(solid, x + p[0] * r, y + p[1] * r)) s += p[2];
  }
  return s;
}

// ---- broad phase: uniform grid (cell ≥ largest diameter) over the board plus a margin
const CELL = 24, ORIGIN = -48, GN = Math.ceil((GRID * PITCH + 96) / CELL);
const head = new Int32Array(GN * GN);
const next = new Int32Array(256);

export function collideBalls(balls, live, onImpact) {
  head.fill(-1);
  for (const i of live) {
    const b = balls[i];
    const cx = Math.min(GN - 1, Math.max(0, ((b.x - ORIGIN) / CELL) | 0));
    const cy = Math.min(GN - 1, Math.max(0, ((b.y - ORIGIN) / CELL) | 0));
    const c = cy * GN + cx;
    next[i] = head[c]; head[c] = i;
    b._cx = cx; b._cy = cy;
  }
  for (const i of live) {
    const a = balls[i];
    for (let dy = -1; dy <= 1; dy++) {
      const yy = a._cy + dy; if (yy < 0 || yy >= GN) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const xx = a._cx + dx; if (xx < 0 || xx >= GN) continue;
        for (let j = head[yy * GN + xx]; j !== -1; j = next[j]) {
          if (j <= i) continue;
          resolvePair(a, balls[j], onImpact);
        }
      }
    }
  }
}

function resolvePair(a, b, onImpact) {
  let nx = b.x - a.x, ny = b.y - a.y;
  const rr = a.r + b.r;
  const d2 = nx * nx + ny * ny;
  if (d2 >= rr * rr) return;
  let d = Math.sqrt(d2);
  if (d < 1e-6) { nx = 1; ny = 0; d = 1e-6; } else { nx /= d; ny /= d; }
  const ia = 1 / a.m, ib = 1 / b.m, isum = ia + ib;
  // positional correction (split by inverse mass, small slop avoids jitter)
  const pen = rr - d;
  const corr = Math.max(0, pen - 0.02) * 0.9 / isum;
  a.x -= nx * corr * ia; a.y -= ny * corr * ia;
  b.x += nx * corr * ib; b.y += ny * corr * ib;
  // impulse along the normal
  const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return;
  const e = -vn < 4 ? 0 : RESTITUTION;      // resting contacts don't bounce (no micro-jitter)
  const j = -(1 + e) * vn / isum;
  a.vx -= j * nx * ia; a.vy -= j * ny * ia;
  b.vx += j * nx * ib; b.vy += j * ny * ib;
  // tangential friction (Coulomb, clamped)
  const tx = -ny, ty = nx;
  const vt = rvx * tx + rvy * ty;
  const jt = Math.max(-FRICTION * j, Math.min(FRICTION * j, -vt / isum));
  a.vx -= jt * tx * ia; a.vy -= jt * ty * ia;
  b.vx += jt * tx * ib; b.vy += jt * ty * ib;
  if (onImpact) onImpact(a, b, -vn, (a.x + b.x) / 2, (a.y + b.y) / 2);
}

// ---- rails: one segment per outer edge of every perimeter tile that still exists
export function railSegments(solid) {
  const segs = [];
  const L = -RAIL_OFFSET, R = GRID * PITCH + RAIL_OFFSET;
  for (let c = 0; c < GRID; c++) {
    const x0 = c === 0 ? L : c * PITCH, x1 = c === GRID - 1 ? R : (c + 1) * PITCH;
    if (solid[c]) segs.push({ ax: x0, ay: L, bx: x1, by: L, tile: c });
    const ib = (GRID - 1) * GRID + c;
    if (solid[ib]) segs.push({ ax: x0, ay: R, bx: x1, by: R, tile: ib });
  }
  for (let r = 0; r < GRID; r++) {
    const y0 = r === 0 ? L : r * PITCH, y1 = r === GRID - 1 ? R : (r + 1) * PITCH;
    const il = r * GRID;
    if (solid[il]) segs.push({ ax: L, ay: y0, bx: L, by: y1, tile: il });
    const ir = r * GRID + GRID - 1;
    if (solid[ir]) segs.push({ ax: R, ay: y0, bx: R, by: y1, tile: ir });
  }
  return segs;
}

export function collideRails(b, segs, onImpact) {
  for (const s of segs) {
    const ex = s.bx - s.ax, ey = s.by - s.ay;
    const L2 = ex * ex + ey * ey;
    let u = ((b.x - s.ax) * ex + (b.y - s.ay) * ey) / L2;
    u = Math.max(0, Math.min(1, u));
    const px = s.ax + ex * u, py = s.ay + ey * u;
    let nx = b.x - px, ny = b.y - py;
    const d = Math.hypot(nx, ny);
    if (d >= b.r || d < 1e-9) continue;
    nx /= d; ny /= d;
    b.x = px + nx * b.r; b.y = py + ny * b.r;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= (1 + RAIL_RESTITUTION) * vn * nx;
      b.vy -= (1 + RAIL_RESTITUTION) * vn * ny;
      if (onImpact) onImpact(b, -vn, px, py);
    }
  }
}
