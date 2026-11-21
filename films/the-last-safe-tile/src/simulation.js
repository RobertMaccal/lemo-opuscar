// The deterministic simulation. bake(seed) runs the whole 45 s at a fixed timestep and records
// every frame, so rendering any frame is a pure lookup (renderFrame(frameIndex) is random-access).

import {
  FRAMES, FPS, SUBSTEPS, GRID, PITCH, N_BALLS, R_MIN, R_MAX, DAMPING, GRAVITY,
  SUPPORT_THRESHOLD, SUPPORT_GRACE, SUPPORT_HARD, ELIM_DEPTH_R, FALL_RENDER_TIME, AGITATION_KEYS,
  T_RESET, T_REVEAL, GOLD,
} from './config.js';
import { rng, hash32 } from './seededRandom.js';
import { buildSchedule, N_TILES, tileCx, tileCy } from './tiles.js';
import { supportFraction, collideBalls, railSegments, collideRails } from './physics.js';
import { bakeCamera } from './camera.js';

export const ROLLING = 0, FALLING = 1, GONE = 2;

export const FAMILIES = [
  { name: 'CYAN', h: 186, s: 100, l: 58 },
  { name: 'MAGENTA', h: 312, s: 100, l: 62 },
  { name: 'VIOLET', h: 268, s: 95, l: 68 },
  { name: 'EMERALD', h: 152, s: 85, l: 50 },
  { name: 'ORANGE', h: 26, s: 100, l: 58 },
  { name: 'RUBY', h: 352, s: 92, l: 56 },
  { name: 'BLUE', h: 218, s: 100, l: 62 },
  { name: 'LIME', h: 96, s: 90, l: 56 },
  { name: 'PINK', h: 333, s: 95, l: 80 },
  { name: 'YELLOW', h: 58, s: 100, l: 72 },
];

export function lerpKeys(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const u = (t - t0) / (t1 - t0);
      const s = u * u * (3 - 2 * u);
      return v0 + (v1 - v0) * s;
    }
  }
  return keys[keys.length - 1][1];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + to(f(0)) + to(f(8)) + to(f(4));
}

function makeBalls(seed) {
  const r = rng(seed, 'balls');
  const rc = rng(seed, 'colors');
  // colour list: 10 families × 10, one YELLOW slot becomes GOLD
  const palette = [];
  for (let f = 0; f < FAMILIES.length; f++) {
    for (let k = 0; k < 10; k++) {
      const F = FAMILIES[f];
      const h = F.h + rc.range(-7, 7), s = Math.min(100, F.s + rc.range(-8, 4)), l = F.l + rc.range(-6, 6);
      palette.push({ family: F.name, color: hslToHex(h, s, l) });
    }
  }
  palette[palette.length - 1] = { family: 'GOLD', color: GOLD };
  rc.shuffle(palette);
  const balls = [];
  for (let i = 0; i < N_BALLS; i++) {
    const home = i;                                       // one ball per tile at the start
    const rad = r.range(R_MIN, R_MAX);
    const ang = r.range(0, Math.PI * 2), sp = r.range(55, 135);
    const b = {
      id: i,
      color: palette[i].color,
      family: palette[i].family,
      gold: palette[i].family === 'GOLD',
      r: rad,
      m: Math.pow(rad / 10, 3),
      x: tileCx(home) + r.range(-17, 17),
      y: tileCy(home) + r.range(-17, 17),
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      z: 0, vz: 0,
      state: ROLLING, lowSupportT: 0,
      fallT: Infinity, elimT: Infinity,
      // agitation: a slowly wandering heading, closed form in time
      th0: r.range(0, Math.PI * 2),
      om: r.range(0.35, 1.0) * r.sign(),
      w1: r.range(0.55, 1.0), p1: r.range(0, 6.283), a1: r.range(1.4, 2.6),
      w2: r.range(1.2, 2.0), p2: r.range(0, 6.283), a2: r.range(0.7, 1.4),
      w3: r.range(0.35, 0.7), p3: r.range(0, 6.283),
      gain: r.range(0.85, 1.15),
      minSup: 1,
    };
    balls.push(b);
  }
  return balls;
}

export function agitation(b, t, keys = AGITATION_KEYS) {
  const A = lerpKeys(keys, t) * b.gain * (0.78 + 0.22 * Math.sin(b.w3 * t + b.p3));
  const th = b.th0 + b.om * t + b.a1 * Math.sin(b.w1 * t + b.p1) + b.a2 * Math.sin(b.w2 * t + b.p2);
  return [A * Math.cos(th), A * Math.sin(th)];
}

export function bake(seed, { record = true, agitationKeys = AGITATION_KEYS, scheduleOpts } = {}) {
  const schedule = buildSchedule(seed, scheduleOpts);
  const balls = makeBalls(seed);
  const N = balls.length;
  const solid = new Uint8Array(N_TILES).fill(1);
  const h = 1 / (FPS * SUBSTEPS);

  const pos = record ? new Float32Array(FRAMES * N * 3) : null;
  const st = record ? new Uint8Array(FRAMES * N) : null;
  const aliveF = new Uint8Array(FRAMES);    // not yet eliminated
  const rollingF = new Uint8Array(FRAMES);
  const impacts = [];                        // for audio
  const falls = [];
  const nearMisses = [];
  const occupants = new Map();               // tile -> ball ids at warning start

  let collapseIdx = 0;
  let segs = railSegments(solid);
  const warnQueue = schedule.tiles.filter((t) => t.k >= 0).sort((a, b) => a.tWarn - b.tWarn);
  let warnIdx = 0;

  const writeFrame = (f) => {
    let alive = 0, rolling = 0;
    for (let i = 0; i < N; i++) {
      const b = balls[i];
      if (record) {
        const o = (f * N + i) * 3;
        pos[o] = b.x; pos[o + 1] = b.y; pos[o + 2] = b.z;
        st[f * N + i] = b.state;
      }
      if (b.elimT === Infinity) alive++;
      if (b.state === ROLLING) rolling++;
    }
    aliveF[f] = alive; rollingF[f] = rolling;
  };

  const tileOf = (b) => {
    const c = Math.floor(b.x / PITCH), r = Math.floor(b.y / PITCH);
    if (c < 0 || r < 0 || c >= GRID || r >= GRID) return -1;
    return r * GRID + c;
  };

  writeFrame(0);
  for (let f = 1; f < FRAMES; f++) {
    for (let s = 0; s < SUBSTEPS; s++) {
      const t = ((f - 1) * SUBSTEPS + s + 1) / (FPS * SUBSTEPS);   // exact substep time (integer based)

      // warnings start: remember who is standing on the doomed tile (for near-miss stats only)
      while (warnIdx < warnQueue.length && warnQueue[warnIdx].tWarn <= t + 1e-9) {
        const tile = warnQueue[warnIdx++];
        const occ = [];
        for (const b of balls) if (b.state === ROLLING && tileOf(b) === tile.id) occ.push(b.id);
        occupants.set(tile.id, occ);
      }
      // scheduled collapses remove support instantly
      let changed = false;
      while (collapseIdx < schedule.collapses.length && schedule.collapses[collapseIdx].t <= t + 1e-9) {
        const c = schedule.collapses[collapseIdx++];
        solid[c.tile] = 0; changed = true;
        for (const id of occupants.get(c.tile) || []) {
          const b = balls[id];
          if (b.state === ROLLING && tileOf(b) !== c.tile) nearMisses.push({ type: 'escape', t, id, tile: c.tile });
        }
      }
      if (changed) segs = railSegments(solid);

      const live = [];
      for (let i = 0; i < N; i++) {
        const b = balls[i];
        if (b.state === ROLLING) {
          const [ax, ay] = agitation(b, t, agitationKeys);
          b.vx += ax * h; b.vy += ay * h;
          const damp = Math.exp(-DAMPING * h);
          b.vx *= damp; b.vy *= damp;
          b.x += b.vx * h; b.y += b.vy * h;
          live.push(i);
        } else {
          // falling: keeps planar velocity, accelerates into the void, no more collisions
          b.x += b.vx * h; b.y += b.vy * h;
          b.vz += GRAVITY * h; b.z += b.vz * h;
          if (b.elimT === Infinity && b.z >= ELIM_DEPTH_R * b.r) b.elimT = t;
          if (b.state === FALLING && t - b.fallT > FALL_RENDER_TIME) b.state = GONE;
        }
      }
      collideBalls(balls, live, (a, b2, vn, x, y) => { if (vn > 6) impacts.push({ t, vn, x, y, a: a.id, b: b2.id }); });
      for (const i of live) collideRails(balls[i], segs, (b, vn, x, y) => { if (vn > 10) impacts.push({ t, vn: vn * 0.8, x, y, a: b.id, b: -1, rail: true }); });

      for (const i of live) {
        const b = balls[i];
        const sup = supportFraction(solid, b.x, b.y, b.r);
        if (sup < SUPPORT_THRESHOLD) {
          b.lowSupportT += h;
          // grace only smooths marginal edge contact; with (almost) nothing underneath it falls at once
          if (sup < SUPPORT_HARD || b.lowSupportT >= SUPPORT_GRACE) {
            b.state = FALLING; b.fallT = t; b.z = 0; b.vz = 0;
            falls.push({ t, id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy });
          }
        } else {
          b.lowSupportT = 0;
          if (sup < b.minSup) b.minSup = sup;
          if (sup >= 0.999) {
            if (b.minSup < 0.78) nearMisses.push({ type: 'teeter', t, id: b.id, min: b.minSup });
            b.minSup = 1;
          }
        }
      }
    }
    writeFrame(f);
  }

  // elimination events (counter ticks)
  const elims = balls.filter((b) => b.elimT < Infinity).map((b) => ({ t: b.elimT, id: b.id })).sort((a, b) => a.t - b.t);
  // only count escapes whose ball did not fall within 0.4 s afterwards
  const nm = nearMisses.filter((n) => balls[n.id].fallT > n.t + 0.4);

  const out = {
    seed, schedule, N, frames: FRAMES, pos, st, aliveF, rollingF, impacts, falls, elims, nearMisses: nm,
    balls: balls.map((b) => ({ id: b.id, color: b.color, family: b.family, gold: b.gold, r: b.r, fallT: b.fallT, elimT: b.elimT })),
  };
  out.stats = computeStats(out);
  if (record) out.cam = bakeCamera(out);
  out.checksum = checksum(out);
  return out;
}

function computeStats(B) {
  const at = (s) => B.aliveF[Math.min(FRAMES - 1, Math.round(s * FPS))];
  const fEnd = Math.round(T_RESET * FPS) - 1;
  const survivors = B.balls.filter((b) => b.fallT > T_RESET - 1 / FPS).map((b) => b.id);
  const rollingAtReveal = B.rollingF[Math.round(T_REVEAL * FPS)];
  const stable = B.rollingF[Math.round(42.3 * FPS)] === B.rollingF[fEnd];
  const winner = survivors.length === 1 ? B.balls[survivors[0]] : null;
  const gold = B.balls.find((b) => b.gold);
  // longest gap without any elimination in 2..42 s
  let gap = 0, last = 2;
  for (const e of B.elims) { if (e.t > 42) break; if (e.t > 2) { gap = Math.max(gap, e.t - last); last = e.t; } }
  gap = Math.max(gap, Math.min(42, B.elims.length ? 42 : 42) - last);
  const firstElim = B.elims.length ? B.elims[0].t : Infinity;
  const elimsLate = B.elims.filter((e) => e.t > 38.5 && e.t < 42.6).length;
  return {
    alive10: at(10), alive20: at(20), alive30: at(30), alive39: at(39), alive41: at(41.5), alive43: at(43),
    survivors: survivors.length, survivorIds: survivors, rollingAtReveal, stable,
    winner: winner ? { id: winner.id, family: winner.family, color: winner.color } : null,
    goldAlive: gold.fallT > T_RESET, goldFallT: gold.fallT, goldId: gold.id,
    nearMisses: B.nearMisses.length, escapes: B.nearMisses.filter((n) => n.type === 'escape').length,
    firstElim, maxGap: gap, elimsLate,
    finalTile: B.schedule.finalTile,
  };
}

function checksum(B) {
  let h = hash32(B.seed, B.elims.length);
  for (const e of B.elims) h = hash32(h, Math.round(e.t * 240), e.id);
  for (const fl of B.falls) h = hash32(h, Math.round(fl.x * 100), Math.round(fl.y * 100));
  return h.toString(16);
}
