// Tile system: deterministic collapse schedule, per-tile state machine, fracture geometry.
// The schedule is computed from the seed alone, BEFORE the simulation runs: it never looks at balls.

import { GRID, PITCH, PACING, WARN_TIME, CRIT_TIME, SEAM, CLUSTER, SCATTER_PHASE, HEART_BIAS } from './config.js';
import { rng } from './seededRandom.js';

export const N_TILES = GRID * GRID;
export const ACTIVE = 0, WARNING = 1, CRACKING = 2, COLLAPSED = 3;

export const tileCol = (i) => i % GRID;
export const tileRow = (i) => (i / GRID) | 0;
export const tileCx = (i) => (tileCol(i) + 0.5) * PITCH;
export const tileCy = (i) => (tileRow(i) + 0.5) * PITCH;

export function neighbors4(i) {
  const c = tileCol(i), r = tileRow(i), out = [];
  if (c > 0) out.push(i - 1);
  if (c < GRID - 1) out.push(i + 1);
  if (r > 0) out.push(i - GRID);
  if (r < GRID - 1) out.push(i + GRID);
  return out;
}

const snap = (t) => Math.round(t * 240) / 240;   // align events with physics substeps
const smooth = (x) => x * x * (3 - 2 * x);

function segmentTimes(r, a, b, n, shape) {
  const ts = [];
  for (let j = 0; j < n; j++) {
    const u = (j + 0.5) / n;
    const g = shape(u);
    const spacing = (b - a) / n;
    ts.push(a + (b - a) * g + (r() - 0.5) * 0.5 * spacing);
  }
  ts.sort((x, y) => x - y);
  for (let j = 1; j < n; j++) if (ts[j] - ts[j - 1] < 0.12) ts[j] = ts[j - 1] + 0.12;
  return ts;
}

export function buildSchedule(seed, { cluster = CLUSTER, early = SCATTER_PHASE, betaMax = HEART_BIAS } = {}) {
  const r = rng(seed, 'tiles');
  const rt = rng(seed, 'timing');

  // --- order: early holes are scattered, later the arena shrinks toward a random "heart"
  const heart = { x: r.range(1.5, 8.5) * PITCH, y: r.range(1.5, 8.5) * PITCH };
  const maxD = Math.hypot(PITCH * GRID, PITCH * GRID);
  const alive = new Array(N_TILES).fill(true);
  const order = [];
  for (let k = 0; k < N_TILES - 1; k++) {
    const p = k / (N_TILES - 2);
    const beta = 0.4 + betaMax * smooth(Math.min(1, p * 1.15));
    let total = 0;
    const w = new Float64Array(N_TILES);
    for (let i = 0; i < N_TILES; i++) {
      if (!alive[i]) continue;
      const d = Math.hypot(tileCx(i) - heart.x, tileCy(i) - heart.y) / maxD;
      let holes = 0;
      for (const n of neighbors4(i)) if (!alive[n]) holes++;
      // a little clustering mid-game makes pockets and islands; early game stays scattered
      const cl = p < early ? 1 / (1 + 1.2 * holes) : 1 + cluster * holes;
      w[i] = Math.exp(beta * d) * cl;
      total += w[i];
    }
    let x = r() * total, pick = -1;
    for (let i = 0; i < N_TILES; i++) {
      if (!alive[i]) continue;
      x -= w[i];
      if (x <= 0) { pick = i; break; }
    }
    if (pick < 0) pick = alive.lastIndexOf(true);
    alive[pick] = false;
    order.push(pick);
  }
  const finalTile = alive.indexOf(true);

  // --- times
  const times = [];
  for (const [a, b, n] of PACING) {
    if (a === 0) {
      times.push(1.45, 2.3, 3.0, 3.65);
    } else if (a >= 39) {
      times.push(39.45, 39.95, 40.45, 40.9, 42.05);
    } else if (a >= 31) {
      times.push(...segmentTimes(rt, a, b, n, (u) => Math.pow(u, 0.82)));
    } else {
      times.push(...segmentTimes(rt, a, b, n, (u) => u));
    }
  }
  const lead = (k) => {
    if (k >= 98) return 0.95;            // the second-to-last tile: give the audience time
    if (k >= 94) return 0.72;
    if (k >= 74) return 0.6;
    return WARN_TIME;
  };

  const tiles = [];
  for (let i = 0; i < N_TILES; i++) tiles.push({ id: i, c: tileCol(i), r: tileRow(i), k: -1, tWarn: Infinity, tCrit: Infinity, tCollapse: Infinity });
  order.forEach((id, k) => {
    const tc = snap(times[k]);
    const t = tiles[id];
    t.k = k;
    t.tCollapse = tc;
    t.tWarn = snap(tc - lead(k));
    t.tCrit = snap(tc - (k >= 94 ? 0.2 : CRIT_TIME));
  });
  const collapses = order.map((id, k) => ({ k, tile: id, t: tiles[id].tCollapse }));
  return { seed, heart, order, finalTile, tiles, collapses };
}

export function tilePhase(tile, t) {
  if (t >= tile.tCollapse - 1e-9) return COLLAPSED;
  if (t >= tile.tCrit) return CRACKING;
  if (t >= tile.tWarn) return WARNING;
  return ACTIVE;
}

export function tilesLeftAt(schedule, t) {
  let n = N_TILES;
  for (const c of schedule.collapses) if (t >= c.t - 1e-9) n--;
  return n;
}

// Fracture: a fan of 4–8 shards around a seeded interior point; local coords around the tile centre.
export function fragmentsFor(seed, tileId) {
  const r = rng(seed, 'fragments', tileId);
  const h = PITCH / 2 - SEAM / 2;
  const p = [r.range(-0.3, 0.3) * h, r.range(-0.3, 0.3) * h];
  const extra = r.int(1, 4);
  // boundary parameter s in [0,4): edges top, right, bottom, left
  const ss = [0, 1, 2, 3];
  for (let i = 0; i < extra; i++) ss.push(r.range(0.15, 3.85));
  ss.sort((a, b) => a - b);
  const at = (s) => {
    const e = Math.floor(s) % 4, f = s - Math.floor(s);
    if (e === 0) return [-h + 2 * h * f, -h];
    if (e === 1) return [h, -h + 2 * h * f];
    if (e === 2) return [h - 2 * h * f, h];
    return [-h, h - 2 * h * f];
  };
  const pts = ss.map(at);
  const frags = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const poly = [p, a, b];
    const cx = (p[0] + a[0] + b[0]) / 3, cy = (p[1] + a[1] + b[1]) / 3;
    const len = Math.hypot(cx, cy) || 1;
    const sp = r.range(25, 70);
    frags.push({
      poly: poly.map(([x, y]) => [x - cx, y - cy]),
      cx, cy,
      vx: (cx / len) * sp, vy: (cy / len) * sp,
      spin: r.range(1.2, 4.5) * r.sign(),
      delay: r.range(0, 0.06),
      vz0: r.range(0, 120),
    });
  }
  return frags;
}

// Crack polylines from the corners (seeded per tile), in local coords around the tile centre.
export function cracksFor(seed, tileId) {
  const r = rng(seed, 'fragments', 1000 + tileId);
  const h = PITCH / 2 - SEAM / 2 - 2;
  const corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
  return corners.map(([x0, y0]) => {
    const pts = [[x0, y0]];
    let x = x0, y = y0;
    const ang = Math.atan2(-y0, -x0) + r.range(-0.5, 0.5);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = ang + r.range(-0.6, 0.6);
      const l = r.range(6, 11);
      x += Math.cos(a) * l; y += Math.sin(a) * l;
      pts.push([x, y]);
    }
    return pts;
  });
}
