// camera.js — a virtual camera derived from the finished simulation (deterministic, precomputed per frame).
// Critically damped springs on x, y and zoom; it frames the leading cluster and leans on the golden ball as the field thins.
import { FPS, FRAMES, N, R, GOLD, width, centerX, Y_FINISH } from './physics.js';

export const VW = 1080, VH = 1920;

function spring(state, target, omega, dt) {          // exact critically damped step
  const x = state.x - target, v = state.v, e = Math.exp(-omega * dt);
  const nx = (x + (v + omega * x) * dt) * e, nv = (v - omega * (v + omega * x) * dt) * e;
  state.x = nx + target; state.v = nv;
}

export function buildCamera(sim) {
  const { rec, events } = sim, dt = 1 / FPS;
  const cam = new Float32Array(FRAMES * 4);            // x, y, zoom, shake
  const X = { x: 0, v: 0 }, Y = { x: 0, v: 0 }, Z = { x: 1, v: 0 };
  // camera shake from significant collisions (decaying)
  const shakeF = new Float32Array(FRAMES);
  for (const e of events) if ((e.type === 'hit' && e.j > 150) || (e.type === 'sweep' && e.j > 220)) {
    const f0 = Math.round(e.t * FPS), amp = Math.min(1, (e.j - 120) / 260);
    for (let k = 0; k < 14 && f0 + k < FRAMES; k++) shakeF[f0 + k] = Math.max(shakeF[f0 + k], amp * Math.exp(-k / 5));
  }
  const ys = [];
  for (let f = 0; f < FRAMES; f++) {
    const t = f / FPS; ys.length = 0;
    let gx = 0, gy = 0, gAlive = false;
    for (let i = 0; i < N; i++) {
      const o = (f * N + i) * 4, st = rec[o + 3] | 0;
      if (st !== 0 && st !== 3) continue;
      ys.push(rec[o + 1]);
      if (i === GOLD) { gAlive = true; gx = rec[o]; gy = rec[o + 1]; }
    }
    ys.sort((a, b) => b - a);
    const k = Math.min(6, ys.length); let front = 0; for (let i = 0; i < k; i++) front += ys[i]; front = k ? front / k : gy;
    const wG = gAlive ? Math.min(0.9, 0.45 + Math.max(0, t - 8) * 0.025) : 0;
    let fy = gAlive ? wG * gy + (1 - wG) * front : front;
    if (gAlive && gy >= Y_FINISH - 40) fy = Math.max(fy, Math.min(gy, Y_FINISH + 120));
    const w = width(Math.min(fy + 150, Y_FINISH - 1));
    let zt = VW / (w * 1.15 + 300);
    if (gAlive && ys.length) { const dy = Math.abs(ys[0] - gy); zt = Math.min(zt, VH * 0.62 / (dy + 260)); }
    if (gAlive && ys.length > 1 && ys.length <= 6 && gy < Y_FINISH) {   // endgame: keep every remaining rival in frame
      const lo = ys[ys.length - 1], hi = ys[0], spread = hi - lo;
      fy = 0.55 * gy + 0.45 * (lo + hi) / 2; zt = Math.min(zt, VH * 0.7 / (spread + 300));
    }
    if (t > 36) zt = Math.max(zt, Math.min(2.75, zt + (t - 36) * 0.06));
    zt = Math.max(1.0, Math.min(2.75, zt));
    if (f === 0) { Z.x = zt; }
    spring(Z, zt, 1.6, dt);
    const lead = 0.13 * VH / Z.x;                        // look ahead: the pack sits below centre, the bridge ahead is revealed
    const ty = fy + lead;
    const tx = centerX(ty - lead * 0.5) * 0.7 + (gAlive ? gx : centerX(fy)) * 0.3;
    if (f === 0) { Y.x = ty; X.x = tx; Y.v = 190; }
    spring(Y, ty, 3.2, dt); spring(X, tx, 2.2, dt);
    cam[f * 4] = X.x; cam[f * 4 + 1] = Y.x; cam[f * 4 + 2] = Z.x; cam[f * 4 + 3] = shakeF[f];
  }
  return cam;
}
