// Camera: a critically damped spring toward the bounding box of everything still in play,
// baked once per run (deterministic), plus render-time loop blend and tiny late-collapse impulses.

import { FRAMES, FPS, PITCH, ARENA, CAM_OMEGA, CAM_ZOOM_KEYS, T_RESET } from './config.js';

const ROLLING = 0;

function lerpKeys(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const u = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
  }
  return keys[keys.length - 1][1];
}

export function bakeCamera(B) {
  const cam = new Float32Array(FRAMES * 3);
  const N = B.N;
  const tiles = B.schedule.tiles;
  let x = 450, y = 450, ls = 0, vx = 0, vy = 0, vs = 0;
  const w = CAM_OMEGA, dt = 1 / FPS;
  const pad = PITCH * 0.42;
  for (let f = 0; f < FRAMES; f++) {
    const t = f / FPS;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const tl of tiles) {
      if (t >= tl.tCollapse - 1e-9) continue;
      x0 = Math.min(x0, tl.c * PITCH); y0 = Math.min(y0, tl.r * PITCH);
      x1 = Math.max(x1, (tl.c + 1) * PITCH); y1 = Math.max(y1, (tl.r + 1) * PITCH);
    }
    // keep every surviving competitor in frame
    for (let i = 0; i < N; i++) {
      if (B.st[f * N + i] !== ROLLING) continue;
      const o = (f * N + i) * 3;
      x0 = Math.min(x0, B.pos[o] - 12); x1 = Math.max(x1, B.pos[o] + 12);
      y0 = Math.min(y0, B.pos[o + 1] - 12); y1 = Math.max(y1, B.pos[o + 1] + 12);
    }
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const zmax = lerpKeys(CAM_ZOOM_KEYS, t);
    const ts = Math.max(1, Math.min(zmax, ARENA.w / (x1 - x0), ARENA.h / (y1 - y0)));
    // 0–17 s: full arena locked; 17–23 s: hand over to adaptive framing
    const ww = Math.min(1, Math.max(0, (t - 17) / 6));
    const sw = ww * ww * (3 - 2 * ww);
    const drift = 1 - sw;
    const tx = 450 + ((x0 + x1) / 2 - 450) * sw + drift * 5 * Math.sin(0.31 * t);
    const ty = 450 + ((y0 + y1) / 2 - 450) * sw + drift * 4 * Math.sin(0.23 * t);
    const tls = Math.log(1 + (ts - 1) * sw) + drift * 0.006 * Math.sin(0.19 * t);
    if (f > 0) {
      vx += (w * w * (tx - x) - 2 * w * vx) * dt; x += vx * dt;
      vy += (w * w * (ty - y) - 2 * w * vy) * dt; y += vy * dt;
      vs += (w * w * (tls - ls) - 2 * w * vs) * dt; ls += vs * dt;
    } else { x = tx; y = ty; ls = tls; }
    cam[f * 3] = x; cam[f * 3 + 1] = y; cam[f * 3 + 2] = Math.exp(ls);
  }
  return cam;
}

const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

// Camera for a frame: baked spring, loop reset blend, and tiny impulses on the final collapses.
export function cameraAt(B, f) {
  const t = f / FPS;
  let x = B.cam[f * 3], y = B.cam[f * 3 + 1], s = B.cam[f * 3 + 2];
  if (t > T_RESET) {
    const u = Math.min(1, Math.max(0, (t - T_RESET - 0.08) / 0.55));
    const e = easeInOut(u);
    x += (450 - x) * e; y += (450 - y) * e;
    s = Math.exp(Math.log(s) * (1 - e));
  }
  let shx = 0, shy = 0;
  for (const c of B.schedule.collapses) {
    if (c.k < 94) continue;
    const tau = t - c.t;
    if (tau < 0 || tau > 0.1) continue;
    const A = c.k === 98 ? 4.5 : 2.5;
    const env = Math.exp(-tau * 32);
    shx += A * env * Math.sin(tau * 95 + c.k);
    shy += A * env * Math.cos(tau * 81 + c.k * 2);
  }
  return { x, y, s, shx, shy };
}

export function project(cam, wx, wy) {
  return [(wx - cam.x) * cam.s + ARENA.cx + cam.shx, (wy - cam.y) * cam.s + ARENA.cy + cam.shy];
}
