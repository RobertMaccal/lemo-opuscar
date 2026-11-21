// physics.js — THE ONE-PIXEL BRIDGE
// Deterministic simulation. No DOM, no Math.random: runs identically in the browser and in Node.
// World units: "px" at zoom 1 (the opening shot shows ~1080 world px across). +y is forward (up the screen).

export const FPS = 60, DUR = 45, FRAMES = FPS * DUR;       // 2700 frames
export const SUB = 4, DT = 1 / FPS, H = DT / SUB;            // 240 Hz physics substeps
export const N = 100, R = 13, G = 600;                       // ball count, radius, gravity
export const GOLD = 0;                                       // ball id 0 is the golden ball
export const PHI_LEAVE = Math.acos(10 / 17);                 // solid sphere rolling over an edge leaves it at ~54°
export const H_LEAVE = R * Math.sin(PHI_LEAVE);              // overhang at which support is lost (≈0.81 R)

// ---------- seeded randomness ----------
export function mulberry32(a) {
  a = a >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(n) { let x = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
export function vnoise(x, s = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i * 7919 + s * 104729) * (1 - u) + hash((i + 1) * 7919 + s * 104729) * u) * 2 - 1; }
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------- the course (fixed design, identical for every seed) ----------
export const Y_START = 0, Y_FINISH = 8300, Y_END = 9400;
// centreline x(y): smootherstep between control points → continuous slope, gentle S-bends
const CX = [[-800, 0], [900, 0], [1750, 110], [2500, 110], [3300, -70], [4000, -70], [4650, 120], [5300, -110], [5950, 50], [6500, 50], [7000, -30], [7550, 0], [9800, 0]];
// width w(y): the surface the balls may stand on
const WD = [[-800, 640], [-120, 640], [60, 580], [700, 560], [2150, 400], [4100, 225], [5950, 88], [7000, 40], [7480, 1.2], [Y_FINISH, 1.2], [Y_FINISH + 40, 1.2], [Y_FINISH + 120, 560], [9800, 560]];
function pw(table, y, smooth) {
  if (y <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [y1, v1] = table[i]; if (y <= y1) {
      const [y0, v0] = table[i - 1]; let t = (y - y0) / (y1 - y0);
      if (smooth) t = t * t * t * (t * (t * 6 - 15) + 10);
      return v0 + (v1 - v0) * t;
    }
  }
  return table[table.length - 1][1];
}
export const centerX = y => pw(CX, y, true);
export const width = y => pw(WD, y, false);
export const slope = y => (centerX(y + 2) - centerX(y - 2)) / 4;   // dx/dy
// moving sweepers: slender capsules aligned with the path, sliding across it
export const SWEEPERS = [
  { y: 2950, len: 150, rad: 6, period: 2.9, phase: 0.0 },
  { y: 3900, len: 150, rad: 6, period: 2.5, phase: 1.9 },
  { y: 4950, len: 130, rad: 6, period: 2.3, phase: 0.6 },
  { y: 5750, len: 120, rad: 6, period: 2.1, phase: 2.6 },
];
export function sweeperState(s, t) {
  const w = width(s.y), A = Math.max(0, 0.62 * (w / 2 - R)), om = 2 * Math.PI / s.period;
  const off = A * Math.sin(om * t + s.phase), vel = A * om * Math.cos(om * t + s.phase);
  const th = Math.atan(slope(s.y)), c = Math.cos(th), sn = Math.sin(th);
  const cx = centerX(s.y) + off * c, cy = s.y - off * sn;               // centre = C(y) + off·N
  const hx = sn * s.len / 2, hy = c * s.len / 2;                         // half segment along T
  return { ax: cx - hx, ay: cy - hy, bx: cx + hx, by: cy + hy, cx, cy, vx: vel * c, vy: -vel * sn, off, vel };
}
// wind: a fixed gust schedule (+ = blowing toward screen-right) plus a light breeze
export const GUSTS = [
  { t: 1.0, d: 1.8, p: 170, dir: +1 },
  { t: 4.3, d: 2.0, p: 330, dir: +1 },
  { t: 7.6, d: 2.0, p: 360, dir: -1 },
  { t: 11.2, d: 1.6, p: 320, dir: +1 },
  { t: 14.6, d: 1.8, p: 360, dir: -1 },
  { t: 17.3, d: 1.6, p: 410, dir: +1 },
  { t: 20.0, d: 2.0, p: 400, dir: +1 },
  { t: 23.4, d: 1.8, p: 390, dir: -1 },
  { t: 26.2, d: 1.8, p: 410, dir: +1 },
  { t: 28.4, d: 1.0, p: 300, dir: -1 },
  { t: 30.4, d: 1.1, p: 270, dir: -1 },
  { t: 32.1, d: 0.9, p: 270, dir: +1 },
  { t: 33.8, d: 1.2, p: 260, dir: -1 },
  { t: 35.5, d: 0.9, p: 250, dir: +1 },
  { t: 38.6, d: 1.0, p: 230, dir: -1 },
];
export const WARN = 0.9;   // seconds of warning before a gust
function gustEnv(g, t) {
  const a = t - g.t, rise = 0.45, fall = 0.7;
  if (a <= 0 || a >= g.d + fall) return 0;
  if (a < rise) return 0.5 - 0.5 * Math.cos(Math.PI * a / rise);
  if (a < g.d) return 1;
  return 0.5 + 0.5 * Math.cos(Math.PI * (a - g.d) / fall);
}
export function wind(t, y = 0) {
  let w = 0;
  for (const g of GUSTS) w += g.dir * g.p * gustEnv(g, t) * (1 + 0.12 * vnoise(t * 3 + y * 0.002, 11));
  // late in the race the air turns unpredictable: fast turbulence on top of the gusts
  const turb = 150 * sstep(29, 34, t) * (vnoise(t * 1.7, 21) * 0.7 + vnoise(t * 4.1, 22) * 0.3);
  return w + 28 * vnoise(t * 0.7, 5) + turb;
}
export const WIND_K = 0.85;   // lateral air-drag coefficient (1/s)
export let KEDGE = 70;                  // how hard a ball fights when its edge is close (1/s²)
export function setKedge(k) { KEDGE = k; }

// ---------- simulation ----------
export const ST_RACE = 0, ST_FALL = 1, ST_GONE = 2, ST_DONE = 3;

export function makeBalls(seed) {
  const rnd = mulberry32(seed * 2654435761 + 12345);
  const balls = [];
  // 10 × 10 starting grid on the start platform; gold takes a seeded slot in the middle of the pack
  const slots = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) slots.push([r, c]);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const gi = slots.findIndex(([r, c]) => r >= 2 && r <= 6 && c >= 2 && c <= 7);
  [slots[0], slots[gi]] = [slots[gi], slots[0]];
  for (let i = 0; i < N; i++) {
    const [row, col] = slots[i];
    let hue; do { hue = rnd() * 360; } while (hue > 30 && hue < 68);    // the gold band is reserved
    const b = {
      id: i,
      x: (col - 4.5) * 54 + (rnd() - 0.5) * 14,
      y: -50 - row * 38 + (rnd() - 0.5) * 10,
      vx: (rnd() - 0.5) * 30, vy: 150 + rnd() * 30,
      m: 1 + (rnd() - 0.5) * 0.08,
      vT: 204 + rnd() * 32,            // cruising speed
      aMax: 240 + rnd() * 50,          // steering authority (px/s²)
      tau: 0.05 + rnd() * 0.07,        // reaction lag (s)
      zeta: 0.75 + rnd() * 0.3,        // damping of their steering
      kp0: 3 + rnd() * 3,              // lane-holding stiffness
      ff: 0.3 + rnd() * 0.4,           // how much of the wind they feel and lean into
      lane: (rnd() * 2 - 1) * 0.9,     // preferred lane (fraction of half-width)
      wob: rnd() * 1000, wobA: 0.15 + rnd() * 0.25,
      hue, sat: 82 + rnd() * 18, lit: 56 + rnd() * 10,
      state: ST_RACE, z: 0, vz: 0, dh: 0, dvh: 0, init: false,
      over: 0, overPeak: 0, overT: 0, tFall: -1, tDone: -1,
    };
    if (i === GOLD) { b.hue = 45; b.sat = 100; b.lit = 65; }
    balls.push(b);
  }
  return balls;
}

// spatial hash (cell = 32 px)
const CELL = 32;
class Grid {
  constructor(n) { this.next = new Int32Array(n); this.map = new Map(); }
  key(x, y) { return (Math.floor(x / CELL) + 4096) * 65536 + (Math.floor(y / CELL) + 4096); }
  build(balls) {
    this.map.clear();
    for (const b of balls) {
      if (b.state !== ST_RACE && b.state !== ST_DONE) continue;
      const k = this.key(b.x, b.y), h = this.map.get(k);
      this.next[b.id] = h === undefined ? -1 : h; this.map.set(k, b.id);
    }
  }
}

export function simulate(seed, opts = {}) {
  const balls = makeBalls(seed);
  const rec = new Float32Array(FRAMES * N * 4);      // per frame per ball: x, y, z, aux (state + overhang)
  const alive = new Int16Array(FRAMES), events = [], grid = new Grid(N);
  const nm = [];                                       // near misses
  let t = 0;
  const record = f => {
    let n = 0;
    for (const b of balls) {
      const o = (f * N + b.id) * 4;
      rec[o] = b.x; rec[o + 1] = b.y; rec[o + 2] = b.z;
      rec[o + 3] = b.state + Math.min(0.99, Math.max(0, b.over) / R);
      if (b.state === ST_RACE || b.state === ST_DONE) n++;
    }
    alive[f] = n;
  };
  record(0);
  for (let f = 1; f < FRAMES; f++) {
    for (let s = 0; s < SUB; s++) { step(balls, t, grid, events, nm); t += H; }
    record(f);
    if (opts.abortOnGoldFall && balls[GOLD].state === ST_FALL) return null;
  }
  return { seed, balls, rec, alive, events, nearMisses: nm };
}

function frameAt(y) {
  const th = Math.atan(slope(y)), c = Math.cos(th), s = Math.sin(th);
  return { cx: centerX(y), w: width(y), Tx: s, Ty: c, Nx: c, Ny: -s };
}

function step(balls, t, grid, events, nm) {
  const W = wind(t);
  for (const b of balls) {
    if (b.state === ST_GONE) continue;
    if (b.state === ST_FALL) {                       // ballistic: momentum kept, gravity pulls into the void
      b.vx += (WIND_K * 0.4 * (W - b.vx)) * H; b.vy -= b.vy * 0.05 * H;
      b.vz += G * H; b.x += b.vx * H; b.y += b.vy * H; b.z += b.vz * H;
      if (b.z > 2600) b.state = ST_GONE;
      continue;
    }
    const F = frameAt(b.y);
    const d = (b.x - F.cx) * F.Nx, vn = b.vx * F.Nx + b.vy * F.Ny, vt = b.vx * F.Tx + b.vy * F.Ty;
    let an = 0, at = 0;
    if (b.state === ST_RACE) {
      // perception with reaction lag
      if (!b.init) { b.dh = d; b.dvh = vn; b.init = true; }
      const k = H / b.tau; b.dh += (d - b.dh) * k; b.dvh += (vn - b.dvh) * k;
      const half = F.w / 2, margin = half - Math.abs(b.dh);
      const u = sstep(2.2 * R, -0.2 * R, margin);   // urgency rises near the edge
      let dDes = (b.lane + b.wobA * vnoise(t * 0.35 + b.wob, 3)) * Math.max(0, half - 2.2 * R) * 0.85;
      dDes *= 1 - u;
      const kp = b.kp0 + u * KEDGE, kd = 2 * b.zeta * Math.sqrt(kp);
      const windN = WIND_K * (W - b.vx) * F.Nx;      // the push they feel
      an = clamp(kp * (dDes - b.dh) - kd * b.dvh - b.ff * windN, -b.aMax, b.aMax);
      at = clamp(2.2 * (b.vT - vt), -260, 230);
    } else {                                        // finished: roll to a stop on the finish pad
      at = -1.6 * vt; an = -2 * vn - 4 * d * 0.02;
    }
    // overhang → tipping about the edge (solid sphere: horizontal accel = 5/7 g sinφ cosφ)
    const over = Math.abs(d) - F.w / 2; let atip = 0;
    if (over > 0 && b.state === ST_RACE) { const sp = Math.min(1, over / R), cp = Math.sqrt(1 - sp * sp); atip = (5 / 7) * G * sp * cp * Math.sign(d); }
    let ax = (an + atip) * F.Nx + at * F.Tx, ay = (an + atip) * F.Ny + at * F.Ty;
    ax += WIND_K * (W - b.vx);                       // air drag toward the wind's velocity
    ax -= 0.12 * b.vx;                                // light rolling resistance
    b.vx += ax * H; b.vy += ay * H; b.x += b.vx * H; b.y += b.vy * H;
  }
  collide(balls, t, grid, events);
  // support check after positions settle
  for (const b of balls) {
    if (b.state !== ST_RACE) continue;
    const F = frameAt(b.y), d = (b.x - F.cx) * F.Nx, over = Math.abs(d) - F.w / 2;
    b.over = over;
    if (over > 0) {
      if (b.overT === 0) { b.overT = t; b.overPeak = 0; }
      b.overPeak = Math.max(b.overPeak, over);
      if (over >= H_LEAVE) {
        b.state = ST_FALL; b.tFall = t;
        const vn = b.vx * F.Nx + b.vy * F.Ny;
        b.vz = 40 + 0.25 * Math.abs(vn); b.z = R * (1 - Math.cos(PHI_LEAVE));
        events.push({ t, type: 'fall', id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, side: Math.sign(d) });
      }
    } else if (b.overT > 0) {
      if (b.overPeak > 0.2 * R) { const e = { t, type: 'save', id: b.id, t0: b.overT, peak: b.overPeak / R, x: b.x, y: b.y }; events.push(e); nm.push(e); }
      b.overT = 0; b.overPeak = 0;
    }
    // a finish counts only once the ball is supported past the line
    if (b.y >= Y_FINISH + 40 && b.state === ST_RACE && over <= 0) { b.state = ST_DONE; b.tDone = t; b.over = 0; events.push({ t, type: 'finish', id: b.id, x: b.x, y: b.y }); }
  }
}

function collide(balls, t, grid, events) {
  grid.build(balls);
  const E = 0.6, minD = 2 * R, minD2 = minD * minD;
  for (const a of balls) {
    if (a.state !== ST_RACE && a.state !== ST_DONE) continue;
    const gx = Math.floor(a.x / CELL), gy = Math.floor(a.y / CELL);
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      let j = grid.map.get((gx + ox + 4096) * 65536 + (gy + oy + 4096));
      while (j !== undefined && j >= 0) {
        if (j > a.id) {
          const b = balls[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
          if (d2 < minD2 && d2 > 1e-9) {
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ia = 1 / a.m, ib = 1 / b.m;
            const pen = minD - d, corr = pen / (ia + ib);
            a.x -= nx * corr * ia; a.y -= ny * corr * ia; b.x += nx * corr * ib; b.y += ny * corr * ib;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) {
              const J = -(1 + E) * rv / (ia + ib);
              a.vx -= J * nx * ia; a.vy -= J * ny * ia; b.vx += J * nx * ib; b.vy += J * ny * ib;
              if (J > 18) events.push({ t, type: 'hit', a: a.id, b: b.id, j: J, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
            }
          }
        }
        j = grid.next[j];
      }
    }
  }
  // kinematic sweepers (infinite mass)
  for (let si = 0; si < SWEEPERS.length; si++) {
    const S = SWEEPERS[si], s = sweeperState(S, t), rr = R + S.rad;
    for (const b of balls) {
      if (b.state !== ST_RACE) continue;
      if (Math.abs(b.y - s.cy) > S.len / 2 + rr + 4) continue;
      const ex = s.bx - s.ax, ey = s.by - s.ay, L2 = ex * ex + ey * ey;
      const u = clamp(((b.x - s.ax) * ex + (b.y - s.ay) * ey) / L2, 0, 1);
      const px = s.ax + ex * u, py = s.ay + ey * u, dx = b.x - px, dy = b.y - py, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-9) {
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        b.x += nx * (rr - d); b.y += ny * (rr - d);
        const rv = (b.vx - s.vx) * nx + (b.vy - s.vy) * ny;
        if (rv < 0) {
          const J = -(1 + 0.7) * rv; b.vx += J * nx; b.vy += J * ny;
          if (J > 18) events.push({ t, type: 'sweep', id: b.id, s: si, j: J, x: px, y: py });
        }
      }
    }
  }
}

// ---------- analysis helpers (seed search, QA) ----------
export function stats(sim) {
  const at = s => sim.alive[Math.min(FRAMES - 1, Math.round(s * FPS))];
  const falls = sim.events.filter(e => e.type === 'fall'), fin = sim.events.filter(e => e.type === 'finish');
  const g = sim.balls[GOLD];
  const gs = sim.nearMisses.filter(e => e.id === GOLD);
  return {
    seed: sim.seed, a10: at(10), a19: at(19), a29: at(29), a37: at(37), final: at(44.98),
    finishers: fin.map(e => e.id), goldFinish: g.state === ST_DONE, goldT: g.tDone,
    goldFall: g.tFall, lastFall: falls.length ? falls[falls.length - 1].t : -1,
    goldSaves: gs.map(e => [+e.t.toFixed(2), +e.peak.toFixed(2)]), saves: sim.nearMisses.length,
  };
}
