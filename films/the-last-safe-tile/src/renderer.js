// Deterministic frame renderer: renderFrame(f) draws frame f (0..2699) from the baked run.
// Layers: void (falling shards / balls, under the board) → tiles → rails → trails + balls →
// particles → bloom → interface text → loop transition.

import {
  W, H, FPS, FRAMES, PITCH, SEAM, GRID, RAIL_OFFSET, ARENA, GRAVITY, FALL_RENDER_TIME,
  T_FINAL6, T_REVEAL, T_RESET, GOLD,
} from './config.js';
import { tilePhase, ACTIVE, WARNING, CRACKING, COLLAPSED, fragmentsFor, cracksFor, tileCx, tileCy, neighbors4, N_TILES } from './tiles.js';
import { cameraAt, project } from './camera.js';
import { drawCollapseBurst, drawCriticalSparks, drawFallParticles } from './particles.js';
import { hrand } from './seededRandom.js';

const TAU = Math.PI * 2;
const ROLLING = 0, FALLING = 1;
const FONT = '"Space Grotesk", "Inter", "Helvetica Neue", Arial, sans-serif';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const easeOutBack = (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);

function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(c1, c2, t) { return c1.map((v, i) => Math.round(v + (c2[i] - v) * t)); }
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------- sprites
const SPR_R = 48;           // ball sprite radius in px (crisp up to ~4.5× zoom)
const SPR_PAD = 2.4;        // sprite half-size in radii (room for glow)

function ballSprite(color, gold) {
  const size = Math.ceil(SPR_R * SPR_PAD * 2);
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const m = size / 2, r = SPR_R;
  const base = hexRgb(color);
  const glowC = gold ? [255, 196, 60] : base;
  // soft outer glow
  let gr = g.createRadialGradient(m, m, r * 0.7, m, m, r * SPR_PAD);
  gr.addColorStop(0, rgba(glowC, gold ? 0.5 : 0.42));
  gr.addColorStop(0.35, rgba(glowC, 0.14));
  gr.addColorStop(1, rgba(glowC, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  // sphere body
  gr = g.createRadialGradient(m - r * 0.38, m - r * 0.42, r * 0.05, m, m, r);
  if (gold) {
    gr.addColorStop(0, '#FFFBEA'); gr.addColorStop(0.22, '#FFE58A'); gr.addColorStop(0.5, '#FFD34D');
    gr.addColorStop(0.78, '#C48A12'); gr.addColorStop(1, '#6E4806');
  } else {
    gr.addColorStop(0, rgba(mix(base, [255, 255, 255], 0.7), 1));
    gr.addColorStop(0.3, rgba(mix(base, [255, 255, 255], 0.15), 1));
    gr.addColorStop(0.75, rgba(base, 1));
    gr.addColorStop(1, rgba(mix(base, [0, 0, 0], 0.5), 1));
  }
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, r, 0, TAU); g.fill();
  // rim light (lower right): glassy edge
  g.save(); g.beginPath(); g.arc(m, m, r, 0, TAU); g.clip();
  gr = g.createRadialGradient(m - r * 0.25, m - r * 0.25, r * 0.8, m - r * 0.1, m - r * 0.1, r * 1.25);
  gr.addColorStop(0, rgba([255, 255, 255], 0));
  gr.addColorStop(1, gold ? 'rgba(255,240,180,0.55)' : rgba(mix(base, [255, 255, 255], 0.6), 0.55));
  g.fillStyle = gr; g.fillRect(m - r, m - r, 2 * r, 2 * r);
  if (gold) { // metallic reflection band
    g.strokeStyle = 'rgba(255,244,200,0.55)'; g.lineWidth = r * 0.12;
    g.beginPath(); g.arc(m, m + r * 0.15, r * 0.72, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
  }
  g.restore();
  // specular highlight
  g.save(); g.translate(m - r * 0.36, m - r * 0.42); g.rotate(-0.6);
  gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.3);
  gr.addColorStop(0, 'rgba(255,255,255,0.98)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.scale(1, 0.62); g.beginPath(); g.arc(0, 0, r * 0.3, 0, TAU); g.fill();
  g.restore();
  return c;
}

const tileSpriteCache = new Map();
function tileSprite(px) {
  // px: on-screen tile size (pitch × scale); cached per half pixel
  const key = Math.round(px * 2) / 2;
  let spr = tileSpriteCache.get(key);
  if (spr) return spr;
  if (tileSpriteCache.size > 400) tileSpriteCache.clear();
  const s = key / PITCH;
  const inner = key - SEAM * s;
  const pad = Math.ceil(12 + 6 * s);
  const size = Math.ceil(inner + pad * 2);
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const x = pad, y = pad, r = Math.max(2.5, 5 * s);
  // halo
  g.save();
  g.shadowColor = 'rgba(18,232,255,0.5)'; g.shadowBlur = 6 + 4 * s;
  g.strokeStyle = 'rgba(18,232,255,0.3)'; g.lineWidth = 1.6 * s;
  roundRect(g, x, y, inner, inner, r); g.stroke();
  g.restore();
  // surface
  let gr = g.createLinearGradient(x, y, x + inner, y + inner);
  gr.addColorStop(0, '#0a1722'); gr.addColorStop(1, '#050b12');
  g.fillStyle = gr; roundRect(g, x, y, inner, inner, r); g.fill();
  // inner glow toward the edges
  g.save(); roundRect(g, x, y, inner, inner, r); g.clip();
  gr = g.createRadialGradient(x + inner / 2, y + inner / 2, inner * 0.3, x + inner / 2, y + inner / 2, inner * 0.74);
  gr.addColorStop(0, 'rgba(6,51,64,0)'); gr.addColorStop(1, 'rgba(6,51,64,0.7)');
  g.fillStyle = gr; g.fillRect(x, y, inner, inner);
  // sheen
  gr = g.createRadialGradient(x + inner * 0.38, y + inner * 0.32, 0, x + inner * 0.38, y + inner * 0.32, inner * 0.55);
  gr.addColorStop(0, 'rgba(150,240,255,0.07)'); gr.addColorStop(1, 'rgba(150,240,255,0)');
  g.fillStyle = gr; g.fillRect(x, y, inner, inner);
  g.restore();
  // inner hairline + crisp border
  g.strokeStyle = 'rgba(18,232,255,0.13)'; g.lineWidth = Math.max(0.6, 0.8 * s);
  roundRect(g, x + 3.5 * s, y + 3.5 * s, inner - 7 * s, inner - 7 * s, Math.max(1.5, r - 2.5 * s)); g.stroke();
  g.strokeStyle = 'rgba(18,232,255,0.92)'; g.lineWidth = Math.max(1, 1.35 * s);
  roundRect(g, x, y, inner, inner, r); g.stroke();
  spr = { c, pad, inner, r };
  tileSpriteCache.set(key, spr);
  return spr;
}

// ---------- renderer
export function createRenderer(canvas, B) {
  const ctx = canvas.getContext('2d');
  const seed = B.seed;
  const sched = B.schedule;
  const N = B.N;
  const balls = B.balls;
  const rgbOf = balls.map((b) => hexRgb(b.color));
  const sprites = balls.map((b) => ballSprite(b.color, b.gold));
  const frags = new Map(), cracks = new Map();
  const fragsOf = (id) => { if (!frags.has(id)) frags.set(id, fragmentsFor(seed, id)); return frags.get(id); };
  const cracksOf = (id) => { if (!cracks.has(id)) cracks.set(id, cracksFor(seed, id)); return cracks.get(id); };
  const goldId = balls.findIndex((b) => b.gold);
  const winnerIds = B.stats.survivorIds;
  const winColor = winnerIds.length === 1 ? (balls[winnerIds[0]].gold ? GOLD : balls[winnerIds[0]].color) : (winnerIds.length ? '#e9fbff' : '#12E8FF');
  const winRgb = hexRgb(winColor);
  const final = sched.finalTile;

  // ripple BFS distances (edge-connected active tiles at the moment of each collapse)
  const rippleDist = new Map();
  const rippleOf = (c) => {
    if (rippleDist.has(c.k)) return rippleDist.get(c.k);
    const d = new Int16Array(N_TILES).fill(-1);
    const q = [c.tile]; d[c.tile] = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const i = q[qi];
      for (const n of neighbors4(i)) {
        if (d[n] >= 0 || sched.tiles[n].tCollapse <= c.t) continue;
        d[n] = d[i] + 1; q.push(n);
      }
    }
    rippleDist.set(c.k, d);
    return d;
  };

  // reset (loop) timing per tile / ball, by distance from the last tile
  const fc = final % GRID, fr = (final / GRID) | 0;
  const appear = new Float32Array(N_TILES);
  for (let i = 0; i < N_TILES; i++) {
    const d = Math.max(Math.abs((i % GRID) - fc), Math.abs(((i / GRID) | 0) - fr));
    appear[i] = i === final ? 0 : 0.16 + 0.36 * (d / 9) + 0.03 * hrand(seed, i, 77);
  }

  // bloom buffers
  const BW = W / 4, BH = H / 4;
  const bloomA = makeCanvas(BW, BH), bA = bloomA.getContext('2d');
  const bloomB = makeCanvas(BW, BH), bB = bloomB.getContext('2d');

  const tilesLeft = (t) => { let n = N_TILES; for (const c of sched.collapses) if (t >= c.t - 1e-9) n--; return n; };

  function drawTileAt(cam, i, alpha = 1, scaleMul = 1) {
    const spr = tileSprite(PITCH * cam.s);
    const [sx, sy] = project(cam, tileCx(i), tileCy(i));
    const half = spr.inner / 2 + spr.pad;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (scaleMul !== 1) {
      const sz = (spr.inner + spr.pad * 2) * scaleMul;
      ctx.drawImage(spr.c, sx - sz / 2, sy - sz / 2, sz, sz);
    } else ctx.drawImage(spr.c, sx - half, sy - half);
    if (alpha !== 1) ctx.globalAlpha = 1;
    return { sx, sy, spr };
  }

  function tileRectPath(cam, i, inset = 0, jx = 0, jy = 0) {
    const s = cam.s;
    const inner = (PITCH - SEAM) * s - inset * 2;
    const [sx, sy] = project(cam, tileCx(i), tileCy(i));
    roundRect(ctx, sx - inner / 2 + jx, sy - inner / 2 + jy, inner, inner, Math.max(2.5, 5 * s - inset));
    return [sx + jx, sy + jy];
  }

  function drawCracks(cam, i, sx, sy, grow, color, width) {
    const s = cam.s;
    ctx.strokeStyle = color; ctx.lineWidth = width * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const pl of cracksOf(i)) {
      const nSeg = pl.length - 1, upto = grow * nSeg;
      ctx.beginPath(); ctx.moveTo(sx + pl[0][0] * s, sy + pl[0][1] * s);
      for (let k = 1; k <= nSeg; k++) {
        if (k - 1 >= upto) break;
        const f = Math.min(1, upto - (k - 1));
        const x = pl[k - 1][0] + (pl[k][0] - pl[k - 1][0]) * f, y = pl[k - 1][1] + (pl[k][1] - pl[k - 1][1]) * f;
        ctx.lineTo(sx + x * s, sy + y * s);
      }
      ctx.stroke();
    }
  }

  function drawVoid(cam, t, f) {
    const s = cam.s;
    // tile fragments falling away (under the board)
    for (const c of sched.collapses) {
      const tau0 = t - c.t + 1e-9;
      if (tau0 < 0 || tau0 > 0.62) continue;
      const tc = c.tile;
      for (const fr of fragsOf(tc)) {
        const tau = tau0 - fr.delay;
        if (tau < 0) continue;
        const z = fr.vz0 * tau + 0.5 * GRAVITY * tau * tau;
        const pz = 2200 / (2200 + z), sz = 430 / (430 + z);
        const wx = tileCx(tc) + fr.cx + fr.vx * tau, wy = tileCy(tc) + fr.cy + fr.vy * tau;
        const sx = (wx - cam.x) * s * pz + ARENA.cx + cam.shx, sy = (wy - cam.y) * s * pz + ARENA.cy + cam.shy;
        const al = Math.pow(1 - clamp(tau / 0.56), 1.5);
        if (al <= 0) continue;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(fr.spin * tau); ctx.scale(s * sz, s * sz);
        ctx.beginPath();
        fr.poly.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.globalAlpha = al;
        ctx.fillStyle = '#0a1823'; ctx.fill();
        const hot = clamp(1 - tau / 0.15);
        ctx.strokeStyle = hot > 0 ? `rgba(255,${Math.round(120 + 100 * (1 - hot))},${Math.round(60 + 160 * (1 - hot))},0.9)` : 'rgba(18,232,255,0.75)';
        ctx.lineWidth = 1.3 / sz; ctx.stroke();
        ctx.restore();
      }
      // perimeter rail piece drops with its tile
      const col = tc % GRID, row = (tc / GRID) | 0;
      if (col === 0 || row === 0 || col === GRID - 1 || row === GRID - 1) {
        const tau = tau0;
        const z = 0.5 * GRAVITY * tau * tau, pz = 2200 / (2200 + z), sz = 430 / (430 + z);
        const al = Math.pow(1 - clamp(tau / 0.5), 1.5);
        ctx.globalAlpha = al; ctx.strokeStyle = '#8ff6ff'; ctx.lineWidth = 2.2 * s * sz; ctx.lineCap = 'round';
        for (const seg of railOfTile(tc)) {
          const p = (wx, wy) => [(wx - cam.x) * s * pz + ARENA.cx + cam.shx, (wy - cam.y) * s * pz + ARENA.cy + cam.shy];
          const [ax, ay] = p(seg[0], seg[1]), [bx, by] = p(seg[2], seg[3]);
          const mx = (ax + bx) / 2, my = (ay + by) / 2, rot = tau * 2.2 * (tc % 2 ? 1 : -1);
          const hx = (bx - ax) / 2 * sz, hy = (by - ay) / 2 * sz;
          const cr = Math.cos(rot), sr = Math.sin(rot);
          ctx.beginPath();
          ctx.moveTo(mx - (hx * cr - hy * sr), my - (hx * sr + hy * cr));
          ctx.lineTo(mx + (hx * cr - hy * sr), my + (hx * sr + hy * cr));
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    // falling balls (deepest first)
    const fallers = [];
    for (let i = 0; i < N; i++) if (B.st[f * N + i] === FALLING) fallers.push(i);
    fallers.sort((a, b) => B.pos[(f * N + b) * 3 + 2] - B.pos[(f * N + a) * 3 + 2]);
    for (const i of fallers) {
      const o = (f * N + i) * 3;
      const z = B.pos[o + 2];
      const tau = t - balls[i].fallT;
      const pz = 2200 / (2200 + z), sz = 430 / (430 + z);
      const sx = (B.pos[o] - cam.x) * s * pz + ARENA.cx + cam.shx, sy = (B.pos[o + 1] - cam.y) * s * pz + ARENA.cy + cam.shy;
      const bright = Math.exp(-z / 260) * (1 - sstep(0.4, FALL_RENDER_TIME, tau));
      const rr = balls[i].r * s * sz;
      // faint streak back toward where it left the surface
      const fl = B.falls.find((q) => q.id === i);
      if (fl) {
        const [lx, ly] = project(cam, fl.x, fl.y);
        const grd = ctx.createLinearGradient(lx, ly, sx, sy);
        grd.addColorStop(0, rgba(rgbOf[i], 0)); grd.addColorStop(1, rgba(rgbOf[i], 0.35 * bright));
        ctx.strokeStyle = grd; ctx.lineWidth = rr * 1.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(sx, sy); ctx.stroke();
      }
      const half = rr * SPR_PAD;
      ctx.globalAlpha = clamp(bright);
      ctx.drawImage(sprites[i], sx - half, sy - half, half * 2, half * 2);
      // depth darkening
      ctx.globalAlpha = clamp((1 - bright) * 0.6);
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(sx, sy, rr * 1.02, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const railCache = new Map();
  function railOfTile(i) {
    if (railCache.has(i)) return railCache.get(i);
    const c = i % GRID, r = (i / GRID) | 0, L = -RAIL_OFFSET, R = GRID * PITCH + RAIL_OFFSET, segs = [];
    const x0 = c === 0 ? L : c * PITCH, x1 = c === GRID - 1 ? R : (c + 1) * PITCH;
    const y0 = r === 0 ? L : r * PITCH, y1 = r === GRID - 1 ? R : (r + 1) * PITCH;
    if (r === 0) segs.push([x0, L, x1, L]);
    if (r === GRID - 1) segs.push([x0, R, x1, R]);
    if (c === 0) segs.push([L, y0, L, y1]);
    if (c === GRID - 1) segs.push([R, y0, R, y1]);
    railCache.set(i, segs);
    return segs;
  }

  function drawTiles(cam, t, reset) {
    const s = cam.s;
    // ripple intensities
    const ripple = new Float32Array(N_TILES);
    for (const c of sched.collapses) {
      const tau = t - c.t;
      if (tau < 0 || tau > 0.7) continue;
      const d = rippleOf(c);
      for (let i = 0; i < N_TILES; i++) {
        if (d[i] < 1) continue;
        const v = Math.exp(-Math.pow(tau * 11 - d[i], 2) / 0.9) * Math.pow(1 - tau / 0.7, 2) * 0.55;
        if (v > ripple[i]) ripple[i] = v;
      }
    }
    const celebrate = winnerIds.length ? sstep(T_REVEAL - 0.05, T_REVEAL + 0.35, t) * (1 - sstep(T_RESET + 0.2, T_RESET + 0.6, t)) : 0;

    for (let i = 0; i < N_TILES; i++) {
      const tl = sched.tiles[i];
      let ph = tilePhase(tl, t);
      let alpha = 1, scl = 1, flash = 0;
      if (reset && ph === COLLAPSED) {
        const u = clamp((t - T_RESET - appear[i]) / 0.12);
        if (u <= 0) continue;
        alpha = u; scl = 0.7 + 0.3 * easeOutBack(u); flash = 1 - u; ph = ACTIVE;
      }
      if (ph === COLLAPSED) continue;
      let jx = 0, jy = 0;
      if (ph === CRACKING) { jx = (hrand(seed, i, Math.floor(t * 60)) - 0.5) * 1.4 * s; jy = (hrand(seed, i, Math.floor(t * 60), 3) - 0.5) * 1.4 * s; }
      const { sx, sy } = drawTileAt({ ...cam, shx: cam.shx + jx, shy: cam.shy + jy }, i, alpha, scl);
      if (flash > 0) {
        ctx.globalAlpha = flash * 0.8; ctx.strokeStyle = '#bff9ff'; ctx.lineWidth = 2.5 * s;
        tileRectPath(cam, i); ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (ph === WARNING) {
        const u = (t - tl.tWarn) / (tl.tCrit - tl.tWarn);
        const pulse = 0.5 + 0.5 * Math.sin((t - tl.tWarn) * TAU * 4.2 - Math.PI / 2);
        const ramp = sstep(0, 0.25, u);
        ctx.fillStyle = `rgba(255,128,24,${(0.12 + 0.26 * pulse) * ramp})`;
        tileRectPath(cam, i, 0, jx, jy); ctx.fill();
        ctx.strokeStyle = `rgba(255,150,40,${(0.55 + 0.45 * pulse) * ramp})`; ctx.lineWidth = 2.2 * s; ctx.stroke();
        ctx.strokeStyle = `rgba(255,120,30,${0.22 * ramp})`; ctx.lineWidth = 7 * s; ctx.stroke();
        drawCracks(cam, i, sx, sy, sstep(0.1, 1, u) * 0.7, `rgba(255,196,110,${0.85 * ramp})`, 1.2);
      } else if (ph === CRACKING) {
        const u = (t - tl.tCrit) / (tl.tCollapse - tl.tCrit);
        const flick = 0.75 + 0.25 * Math.sin(t * 90);
        tileRectPath(cam, i, 0, jx, jy);
        ctx.fillStyle = `rgba(255,70,18,${(0.42 + 0.2 * u) * flick})`; ctx.fill();
        ctx.strokeStyle = '#ff6a2a'; ctx.lineWidth = 2.8 * s; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,90,30,0.35)'; ctx.lineWidth = 9 * s; ctx.stroke();
        drawCracks(cam, i, sx, sy, 0.7 + 0.3 * u, 'rgba(255,236,190,0.95)', 1.5);
      }
      if (ripple[i] > 0.01 && ph !== CRACKING) {
        ctx.strokeStyle = `rgba(150,250,255,${ripple[i]})`; ctx.lineWidth = 2.4 * s;
        tileRectPath(cam, i); ctx.stroke();
      }
      if (i === final && celebrate > 0) {
        ctx.strokeStyle = rgba(winRgb, 0.95 * celebrate); ctx.lineWidth = 2.6 * s;
        tileRectPath(cam, i); ctx.stroke();
        ctx.strokeStyle = rgba(winRgb, 0.3 * celebrate); ctx.lineWidth = 9 * s; ctx.stroke();
        ctx.fillStyle = rgba(winRgb, 0.07 * celebrate); ctx.fill();
      }
    }
    // rails on surviving perimeter tiles
    ctx.lineCap = 'round';
    for (let i = 0; i < N_TILES; i++) {
      const tl = sched.tiles[i];
      const col = i % GRID, row = (i / GRID) | 0;
      if (!(col === 0 || row === 0 || col === GRID - 1 || row === GRID - 1)) continue;
      let ph = tilePhase(tl, t), alpha = 1;
      if (reset && ph === COLLAPSED) { alpha = clamp((t - T_RESET - appear[i]) / 0.12); ph = ACTIVE; }
      if (ph === COLLAPSED || alpha <= 0) continue;
      const warm = ph === WARNING || ph === CRACKING;
      for (const seg of railOfTile(i)) {
        const [ax, ay] = project(cam, seg[0], seg[1]), [bx, by] = project(cam, seg[2], seg[3]);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = warm ? 'rgba(255,140,50,0.25)' : 'rgba(18,232,255,0.18)'; ctx.lineWidth = 7 * s;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.strokeStyle = warm ? '#ffb070' : '#a8f7ff'; ctx.lineWidth = 2.2 * s;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // celebratory pulses from the last tile
    if (celebrate > 0) {
      for (let p = 0; p < 2; p++) {
        const tau = t - T_REVEAL - p * 0.5;
        if (tau < 0 || tau > 0.7) continue;
        const u = tau / 0.7;
        const half = ((PITCH - SEAM) / 2 + 34 * easeOutCubic(u)) * s;
        const [sx, sy] = project(cam, tileCx(final), tileCy(final));
        ctx.strokeStyle = rgba(winRgb, 0.5 * Math.pow(1 - u, 1.5)); ctx.lineWidth = 1.6 * s * (1 - u * 0.5);
        roundRect(ctx, sx - half, sy - half, half * 2, half * 2, 6 * s); ctx.stroke();
      }
    }
  }

  function drawBalls(cam, t, f, reset) {
    const s = cam.s;
    const resetFade = reset ? 1 - sstep(T_RESET + 0.04, T_RESET + 0.3, t) : 1;
    // trails
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      if (B.st[f * N + i] !== ROLLING) continue;
      const gold = i === goldId;
      const L = gold ? 19 : 11;
      const col = gold ? [255, 194, 58] : rgbOf[i];
      const r = balls[i].r * s;
      let [px, py] = project(cam, B.pos[(f * N + i) * 3], B.pos[(f * N + i) * 3 + 1]);
      for (let k = 1; k <= L; k++) {
        const g = f - k;
        if (g < 0 || B.st[g * N + i] !== ROLLING) break;
        const [qx, qy] = project(cam, B.pos[(g * N + i) * 3], B.pos[(g * N + i) * 3 + 1]);
        const u = 1 - k / (L + 1);
        if (Math.abs(qx - px) + Math.abs(qy - py) > 0.25) {
          ctx.strokeStyle = rgba(col, (gold ? 0.42 : 0.3) * Math.pow(u, 1.4) * resetFade);
          ctx.lineWidth = r * (gold ? 1.5 : 1.25) * u + 0.6;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
        }
        px = qx; py = qy;
      }
    }
    ctx.restore();
    // bodies
    for (let i = 0; i < N; i++) {
      if (B.st[f * N + i] !== ROLLING) continue;
      if (i === goldId) continue;
      drawBall(cam, i, f, resetFade);
    }
    if (B.st[f * N + goldId] === ROLLING) drawBall(cam, goldId, f, resetFade);
  }

  function drawBall(cam, i, f, alpha = 1, scale = 1, at = null) {
    const o = (f * N + i) * 3;
    const [sx, sy] = at || project(cam, B.pos[o], B.pos[o + 1]);
    const half = balls[i].r * cam.s * SPR_PAD * scale;
    if (half <= 0) return;
    if (alpha !== 1) ctx.globalAlpha = clamp(alpha);
    ctx.drawImage(sprites[i], sx - half, sy - half, half * 2, half * 2);
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  function drawParticles(cam, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const tl of sched.tiles) {
      if (tilePhase(tl, t) === CRACKING) drawCriticalSparks(ctx, cam, seed, tl, t, (t - tl.tCrit) / (tl.tCollapse - tl.tCrit));
    }
    for (const c of sched.collapses) drawCollapseBurst(ctx, cam, seed, c, t - c.t);
    for (const fl of B.falls) {
      const tau = t - fl.t;
      if (tau >= 0 && tau < 0.6) drawFallParticles(ctx, cam, seed, fl, balls[fl.id].color, tau);
    }
    ctx.restore();
  }

  function drawGoldIntro(cam, t, f) {
    if (t > 1.8 || B.st[f * N + goldId] !== ROLLING) return;
    const o = (f * N + goldId) * 3;
    const [sx, sy] = project(cam, B.pos[o], B.pos[o + 1]);
    const r = balls[goldId].r * cam.s;
    ctx.save();
    for (let p = 0; p < 2; p++) {
      const u = (t - 0.02 - p * 0.22) / 0.62;
      if (u <= 0 || u >= 1) continue;
      ctx.globalAlpha = Math.pow(Math.sin(Math.PI * u), 0.7) * 0.95;
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(sx, sy, r * (1.5 + 2.4 * easeOutCubic(u)), 0, TAU); ctx.stroke();
    }
    ctx.restore();
    return { sx, sy, r };
  }

  function drawGoldLabel(cam, t, f) {
    const a = sstep(0.12, 0.3, t) * (1 - sstep(1.35, 1.7, t));
    if (a <= 0 || B.st[f * N + goldId] !== ROLLING) return;
    const o = (f * N + goldId) * 3;
    const [sx, sy] = project(cam, B.pos[o], B.pos[o + 1]);
    const above = sy > ARENA.cy - ARENA.h / 2 + 70;
    const ly = above ? sy - 34 : sy + 48;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `700 25px ${FONT}`; ctx.letterSpacing = '3px';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lx = clamp(sx, 120, W - 120);
    const tw = ctx.measureText('WATCH GOLD').width + 26;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    roundRect(ctx, lx - tw / 2, ly - 19, tw, 38, 19); ctx.fill();
    ctx.strokeStyle = 'rgba(255,211,77,0.85)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = GOLD; ctx.fillText('WATCH GOLD', lx + 1.5, ly + 1);
    ctx.restore();
  }

  function bloom() {
    bA.globalCompositeOperation = 'copy';
    bA.filter = 'none';
    bA.drawImage(canvas, 0, 0, BW, BH);
    bB.globalCompositeOperation = 'copy';
    bB.filter = 'blur(5px)';
    bB.drawImage(bloomA, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bloomB, 0, 0, W, H);
    ctx.restore();
  }

  // ---------- interface
  function tabular(text, x, y, font, color, align = 'center', colors = null) {
    ctx.font = font;
    const cw = ctx.measureText('0').width;
    const widthOf = (ch) => (/[0-9]/.test(ch) ? cw : ctx.measureText(ch).width);
    let total = 0;
    for (const ch of text) total += widthOf(ch);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    ctx.textAlign = 'center';
    let k = 0;
    for (const ch of text) {
      const w = widthOf(ch);
      ctx.fillStyle = colors ? colors[k] : color;
      ctx.fillText(ch, cx + w / 2, y);
      cx += w; k++;
    }
  }

  function caption(t) {
    // hook + beat captions in the strip between the title and the arena
    const cues = [
      { a: -1, b: 1.05, text: '100 BALLS.', color: '#ffffff' },
      { a: 1.05, b: 2.1, text: '100 TILES.', color: '#ffffff' },
      { a: 2.1, b: 4.1, text: 'ONLY ONE TILE WILL REMAIN.', color: '#12E8FF' },
      { a: T_FINAL6, b: T_FINAL6 + 0.66, text: 'FINAL 6 TILES', color: '#ff8a3a' },
      { a: 40.95, b: 41.95, text: '2 TILES LEFT', color: '#ff5a2a' },
      { a: T_RESET + 0.42, b: 99, text: '100 BALLS.', color: '#ffffff', fadeIn: true },
    ];
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const c of cues) {
      if (t < c.a || t >= c.b) continue;
      const fin = c.a < 0 ? 1 : c.fadeIn ? sstep(c.a, c.a + 0.22, t) : sstep(c.a, c.a + 0.1, t);
      const fout = c.b > 90 ? 1 : 1 - sstep(c.b - 0.1, c.b, t);
      const pop = c.a < 0 ? 1 : 0.92 + 0.08 * easeOutBack(clamp((t - c.a) / 0.18));
      const a = fin * fout;
      const y = 398 + (1 - fin) * 10 - (1 - fout) * 8;
      ctx.globalAlpha = a;
      ctx.translate(W / 2, y); ctx.scale(pop, pop);
      ctx.font = `700 50px ${FONT}`; ctx.letterSpacing = '4px';
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, 2, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }

  function counters(t, f, reset) {
    let tiles = tilesLeft(t), alive = B.aliveF[f];
    if (reset) {
      let nt = 0; for (let i = 0; i < N_TILES; i++) if (t - T_RESET >= appear[i] + 0.06 || sched.tiles[i].tCollapse > t) nt++;
      tiles = Math.max(tiles, nt);
      let nb = 0; for (let i = 0; i < N; i++) if (t - T_RESET >= appear[i] + 0.1) nb++;
      alive = Math.max(nb, t - T_RESET < 0.3 ? alive : 0);
    }
    const y0 = 1452, y1 = 1512;
    const cols = [
      { x: 290, label: 'TILES LEFT', v: tiles, flash: lastChange(t, 'tiles'), acc: [18, 232, 255] },
      { x: 790, label: 'BALLS ALIVE', v: alive, flash: lastChange(t, 'balls'), acc: [255, 176, 70] },
    ];
    ctx.save();
    ctx.textBaseline = 'middle';
    for (const c of cols) {
      ctx.font = `600 27px ${FONT}`; ctx.letterSpacing = '5px'; ctx.textAlign = 'center';
      ctx.fillStyle = '#7fa6b6'; ctx.fillText(c.label, c.x + 2.5, y0);
      ctx.letterSpacing = '0px';
      const num = String(c.v).padStart(3, ' ');
      const text = `${num} / 100`;
      const fl = reset ? 0 : clamp(1 - c.flash / 0.3);
      const hi = rgba(mix([255, 255, 255], c.acc, fl * 0.9), 1);
      const colors = [...text].map((_, k) => (k < 3 ? hi : '#56717e'));
      tabular(text, c.x, y1 + 6, `700 62px ${FONT}`, '#fff', 'center', colors);
    }
    // hairline separators
    ctx.strokeStyle = 'rgba(111,151,168,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2, y0 - 18); ctx.lineTo(W / 2, y1 + 30); ctx.stroke();
    ctx.restore();
  }

  const tileTimes = sched.collapses.map((c) => c.t);
  const ballTimes = B.elims.map((e) => e.t);
  function lastChange(t, which) {
    const arr = which === 'tiles' ? tileTimes : ballTimes;
    let best = 99;
    for (const x of arr) { if (x > t) break; best = t - x; }
    return best;
  }

  function title() {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 82px ${FONT}`; ctx.letterSpacing = '1px';
    ctx.fillStyle = '#f4f8fb';
    ctx.fillText('THE LAST SAFE TILE', W / 2, 228);
    ctx.font = `500 38px ${FONT}`; ctx.letterSpacing = '7px';
    ctx.fillStyle = '#86aebf';
    ctx.fillText('100 BALLS. 100 TILES.', W / 2 + 3.5, 292);
    // bottom prompt
    ctx.font = `600 34px ${FONT}`; ctx.letterSpacing = '3px';
    const a = 'PICK A COLOR. ', b = 'WILL IT SURVIVE?';
    const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
    const x0 = W / 2 - (wa + wb) / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff'; ctx.fillText(a, x0, 1652);
    ctx.fillStyle = '#86aebf'; ctx.fillText(b, x0 + wa, 1652);
    ctx.restore();
  }

  function reveal(t, cam) {
    if (t < T_REVEAL - 0.01) return;
    const out = 1 - sstep(T_RESET, T_RESET + 0.2, t);
    if (out <= 0) return;
    const n = winnerIds.length;
    const l1 = n === 1 ? '1 SURVIVOR.' : `${n} SURVIVORS.`;
    const l2 = n === 0 ? 'THE TILE WON.' : 'OUT OF 100.';
    const [, ty] = project(cam, tileCx(final), tileCy(final));
    const half = (PITCH / 2) * cam.s;
    const yTop = Math.min(ty - half - 95, 640), yBot = Math.max(ty + half + 95, 1210);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const a1 = sstep(T_REVEAL, T_REVEAL + 0.18, t) * out;
    const p1 = 0.85 + 0.15 * easeOutBack(clamp((t - T_REVEAL) / 0.3));
    ctx.globalAlpha = a1;
    ctx.translate(W / 2, yTop); ctx.scale(p1, p1);
    ctx.font = `700 96px ${FONT}`; ctx.letterSpacing = '3px';
    ctx.fillStyle = '#ffffff'; ctx.fillText(l1, 2, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const a2 = sstep(T_REVEAL + 0.45, T_REVEAL + 0.62, t) * out;
    ctx.globalAlpha = a2;
    ctx.font = `600 56px ${FONT}`; ctx.letterSpacing = '6px';
    ctx.fillStyle = '#9fc4d3'; ctx.fillText(l2, W / 2 + 3, yBot - 10 * (1 - a2));
    if (n === 1) {
      const w = balls[winnerIds[0]];
      const a3 = sstep(T_REVEAL + 0.7, T_REVEAL + 0.88, t) * out;
      ctx.globalAlpha = a3;
      ctx.font = `700 36px ${FONT}`; ctx.letterSpacing = '6px';
      const label = w.gold ? 'GOLD WINS' : `${w.family} WINS`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = winColor;
      ctx.beginPath(); ctx.arc(W / 2 - tw / 2 - 16, yBot + 72, 11, 0, TAU); ctx.fill();
      ctx.fillText(label, W / 2 + 14 + 3, yBot + 72);
    }
    ctx.restore();
  }

  function resetOverlay(t, cam, f) {
    const tau = t - T_RESET;
    // the last tile emits a pulse that sweeps the arena
    const u = clamp(tau / 0.42);
    if (u > 0 && u < 1) {
      const [sx, sy] = project(cam, tileCx(final), tileCy(final));
      const R = (PITCH / 2) * cam.s + easeOutCubic(u) * 1500;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(mix(winRgb, [190, 250, 255], 0.4), 0.7 * (1 - u));
      ctx.lineWidth = 6 + 30 * (1 - u);
      roundRect(ctx, sx - R, sy - R, R * 2, R * 2, 12); ctx.stroke();
      ctx.restore();
    }
    // brief glow wipe hides the editorial reset
    const fl = Math.exp(-Math.pow((tau - 0.2) / 0.07, 2)) * 0.11;
    if (fl > 0.003) { ctx.fillStyle = `rgba(170,245,255,${fl})`; ctx.fillRect(0, 0, W, H); }
    // colored points reappear at the opening layout
    for (let i = 0; i < N; i++) {
      const v = clamp((tau - Math.max(0.3, appear[i] + 0.05)) / 0.1);
      if (v <= 0) continue;
      const o = i * 3;   // frame 0
      const at = project(cam, B.pos[o], B.pos[o + 1]);
      drawBall(cam, i, 0, 1, v >= 1 ? 1 : easeOutBack(v), at);
    }
  }

  function renderFrame(f) {
    f = Math.max(0, Math.min(FRAMES - 1, f | 0));
    const t = f / FPS;
    const reset = t > T_RESET;
    const cam = cameraAt(B, f);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (reset) { ctx.save(); ctx.beginPath(); ctx.rect(0, 425, W, 990); ctx.clip(); }   // keep the zoom-out inside the arena band
    drawVoid(cam, t, f);
    drawTiles(cam, t, reset);
    drawBalls(cam, t, f, reset);
    drawParticles(cam, t);
    drawGoldIntro(cam, t, f);
    if (reset) { resetOverlay(t, cam, f); ctx.restore(); }
    bloom();
    title();
    caption(t);
    counters(t, f, reset);
    drawGoldLabel(cam, t, f);
    reveal(t, cam);
    ctx.restore();
  }

  // on-screen texts (for QC)
  return { renderFrame, ctx };
}
