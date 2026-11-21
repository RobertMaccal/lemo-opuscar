// Analytic particles: every particle is a closed-form function of (event, index, time since event),
// so any frame can be rendered on its own (deterministic, no particle state, no allocations per frame).

import { hrand } from './seededRandom.js';
import { PITCH } from './config.js';
import { tileCx, tileCy } from './tiles.js';
import { project } from './camera.js';

const TAU = Math.PI * 2;
const drift = (v, k, tau) => (v * (1 - Math.exp(-k * tau))) / k;   // distance under linear drag

// Collapse burst: cyan glass shards + warm electrical sparks (restrained; fewer late in the game).
export function drawCollapseBurst(ctx, cam, seed, c, tau) {
  const life = 0.5;
  if (tau < 0 || tau > life) return;
  const quiet = c.k >= 74 ? 0.6 : 1;
  const nS = Math.round(8 * quiet), nK = Math.round(7 * quiet);
  const cx = tileCx(c.tile), cy = tileCy(c.tile);
  const s = cam.s;
  for (let j = 0; j < nS; j++) {
    const r1 = hrand(seed, c.k, j, 1), r2 = hrand(seed, c.k, j, 2), r3 = hrand(seed, c.k, j, 3);
    const lj = 0.3 + 0.2 * r3;
    if (tau > lj) continue;
    const a = r1 * TAU, sp = 70 + 170 * r2;
    const ox = (hrand(seed, c.k, j, 4) - 0.5) * PITCH * 0.8, oy = (hrand(seed, c.k, j, 5) - 0.5) * PITCH * 0.8;
    const d = drift(sp, 5, tau);
    const [x, y] = project(cam, cx + ox + Math.cos(a) * d, cy + oy + Math.sin(a) * d);
    const al = 1 - tau / lj;
    const sz = (2.2 + 2.5 * r3) * s;
    const rot = r1 * 10 + tau * (8 + 10 * r2);
    ctx.globalAlpha = al * 0.9;
    ctx.fillStyle = j % 3 === 0 ? '#e6fdff' : '#7befff';
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(rot) * sz, y + Math.sin(rot) * sz);
    ctx.lineTo(x + Math.cos(rot + 2.3) * sz * 0.6, y + Math.sin(rot + 2.3) * sz * 0.6);
    ctx.lineTo(x + Math.cos(rot + 4.1) * sz * 0.8, y + Math.sin(rot + 4.1) * sz * 0.8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.lineCap = 'round';
  for (let j = 0; j < nK; j++) {
    const r1 = hrand(seed, c.k, j, 11), r2 = hrand(seed, c.k, j, 12), r3 = hrand(seed, c.k, j, 13);
    const lj = 0.22 + 0.2 * r3;
    if (tau > lj) continue;
    const a = r1 * TAU, sp = 160 + 260 * r2, k = 6;
    const corner = j % 4, hx = (corner & 1 ? 1 : -1) * PITCH * 0.45, hy = (corner & 2 ? 1 : -1) * PITCH * 0.45;
    const d = drift(sp, k, tau), d0 = drift(sp, k, Math.max(0, tau - 0.035));
    const [x, y] = project(cam, cx + hx + Math.cos(a) * d, cy + hy + Math.sin(a) * d);
    const [x0, y0] = project(cam, cx + hx + Math.cos(a) * d0, cy + hy + Math.sin(a) * d0);
    ctx.globalAlpha = (1 - tau / lj) * 0.95;
    ctx.strokeStyle = j % 2 ? '#ffb347' : '#ff7a2a';
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Critical-phase sparks crawling off the tile corners.
export function drawCriticalSparks(ctx, cam, seed, tile, t, u) {
  const cx = tileCx(tile.id), cy = tileCy(tile.id), s = cam.s;
  ctx.lineCap = 'round';
  for (let j = 0; j < 8; j++) {
    const period = 0.11, ph = hrand(seed, tile.id, j, 21) * period;
    const cyc = Math.floor((t + ph) / period);
    const tau = (t + ph) - cyc * period;
    const r1 = hrand(seed, tile.id, j, cyc), r2 = hrand(seed, tile.id, j, cyc + 7);
    const corner = j % 4, hx = (corner & 1 ? 1 : -1) * (PITCH / 2 - 3), hy = (corner & 2 ? 1 : -1) * (PITCH / 2 - 3);
    const out = Math.atan2(hy, hx) + (r1 - 0.5) * 1.6;
    const d = drift(140 + 160 * r2, 7, tau);
    const [x, y] = project(cam, cx + hx + Math.cos(out) * d, cy + hy + Math.sin(out) * d);
    const [x0, y0] = project(cam, cx + hx + Math.cos(out) * Math.max(0, d - 7), cy + hy + Math.sin(out) * Math.max(0, d - 7));
    ctx.globalAlpha = (1 - tau / period) * (0.6 + 0.4 * u);
    ctx.strokeStyle = r2 > 0.5 ? '#ffd28a' : '#ff8a3a';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Elimination sparkle: 6–12 small particles in the falling ball's colour.
export function drawFallParticles(ctx, cam, seed, fall, color, tau) {
  const life = 0.55;
  if (tau < 0 || tau > life) return;
  const speed = Math.hypot(fall.vx, fall.vy);
  const n = Math.min(12, 6 + Math.round(speed / 25));
  const s = cam.s;
  ctx.fillStyle = color;
  for (let j = 0; j < n; j++) {
    const r1 = hrand(seed, fall.id, j, 31), r2 = hrand(seed, fall.id, j, 32), r3 = hrand(seed, fall.id, j, 33);
    const lj = 0.3 + 0.25 * r3;
    if (tau > lj) continue;
    const a = r1 * TAU, sp = 40 + 110 * r2;
    const d = drift(sp, 4.5, tau);
    const wx = fall.x + fall.vx * tau * 0.5 + Math.cos(a) * (6 + d);
    const wy = fall.y + fall.vy * tau * 0.5 + Math.sin(a) * (6 + d);
    const [x, y] = project(cam, wx, wy);
    const al = 1 - tau / lj;
    ctx.globalAlpha = al;
    ctx.beginPath(); ctx.arc(x, y, (1.1 + 1.4 * r3) * s * (0.6 + 0.4 * al), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
