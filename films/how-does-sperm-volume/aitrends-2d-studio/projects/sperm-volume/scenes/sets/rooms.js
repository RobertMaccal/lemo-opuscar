// rooms.js — three reusable sets, anchored to GY = E.H * V(0.8, 0.68).
import { E, V, mood, layer, backdrop, rr, seg, circle, ring, linGrad, glow, alpha, shade, text, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
export const GYf = () => E.H * V(0.8, 0.68);

// A. Max's bedroom at night: tall window with skyline + moon, bed on the left, desk lamp off.
export function bedroom(g, t, cam, o = {}) {
  const M = mood('night'), GY = GYf(), CX = E.W / 2;
  layer(g, cam, 0.4, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(M.wall, -0.5), shade(M.wall, -0.15)]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    const wx = CX - 260, wy = GY - 1020, ww = 520, wh = 760;
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: shade(M.wall, -0.7), bar: 12 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, M.sky); g.fillRect(x, y, w, h);
      FX.stars(g, t, { area: [x, y, w, h * 0.5], count: 40, seed: 3 });
      FX.moon(g, x + w * 0.72, y + h * 0.2, 34);
      FX.skyline(g, { x: x - 20, y: y + h, w: w + 40, minH: 120, maxH: h * 0.55, color: '#141832', windowColor: alpha(M.practical, 0.85), lit: 0.3, seed: 12 });
    });
    FX.godRays(g, CX + 120, GY - 860, { count: 6, angle: Math.PI * 0.62, spread: 0.5, len: 1200, a: 0.05, t, color: '#c9d4ff' });
    g.fillStyle = shade(M.wall, -0.6); g.fillRect(CX - 300, GY - 250, 600, 12);
  });
  layer(g, cam, 0.8, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 700, [shade(M.floor, 0.05), M.dark]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 700, 'rgba(0,0,0,.25)', 0.07);
    FX.pool(g, CX + 60, GY + 40, 380, 60, '#a9b8ff', 0.18);
    if (o.bed !== false) FX.bed(g, { x: CX - 620, y: GY + 10, w: 520, color: '#3a3f78', frame: '#151729', pillow: '#c9c6e0' });
  });
  return { GY, CX, M };
}

// B. Kitchen at night: warm pendant lamp, counter, wall calendar.
export function kitchen(g, t, cam, o = {}) {
  const M = mood('interiorWarm'), GY = GYf(), CX = E.W / 2;
  layer(g, cam, 0.45, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(M.dark, -0.2), shade(M.wall, -0.25)]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    for (let i = -6; i < 12; i++) { g.fillStyle = alpha('#000', 0.12); g.fillRect(-E.W + i * 120, GY - 620, 2, 300); }   // tiles
    g.fillStyle = alpha('#000', 0.12); g.fillRect(-E.W, GY - 620, E.W * 3, 2); g.fillRect(-E.W, GY - 320, E.W * 3, 2);
    // window (night) on the right
    FX.windowFrame(g, { x: CX + 220, y: GY - 1060, w: 300, h: 380, cols: 2, frame: shade(M.wall, -0.6), bar: 10 }, (g, x, y, w, h) => { g.fillStyle = linGrad(g, 0, y, 0, y + h, mood('night').sky); g.fillRect(x, y, w, h); FX.skyline(g, { x, y: y + h, w, maxH: h * 0.5, color: '#141832', windowColor: '#ffb860', seed: 7 }); });
    // calendar
    const cx0 = CX - 330, cy0 = GY - 1060; rr(g, cx0, cy0, 230, 270, 10); g.fillStyle = '#efe6d6'; g.fill(); g.fillStyle = '#c0392b'; g.fillRect(cx0, cy0, 230, 58);
    if (o.calGlow) glow(g, cx0 + 115, cy0 + 135, 260, M.practical, 0.5 * o.calGlow);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) g.fillStyle = 'rgba(0,0,0,.25)', g.fillRect(cx0 + 22 + c * 40, cy0 + 82 + r * 44, 26, 26);
    seg(g, [[cx0 + 115, cy0 - 30], [cx0 + 115, cy0]], 3, '#2a1e22');
    // pendant lamp
    seg(g, [[CX + 40, -E.H], [CX + 40, GY - 820]], 3, '#120c10');
    g.fillStyle = '#2a1e22'; g.beginPath(); g.moveTo(CX - 40, GY - 760); g.lineTo(CX + 120, GY - 760); g.lineTo(CX + 80, GY - 820); g.lineTo(CX, GY - 820); g.closePath(); g.fill();
    FX.lightCone(g, CX + 40, GY - 760, { angle: Math.PI / 2, spread: 0.55, len: 900, color: M.key, a: 0.16 });
    glow(g, CX + 40, GY - 755, 140, '#fff0c8', 0.9);
  });
  layer(g, cam, 0.85, (g) => {
    FX.counter(g, { x: -E.W, y: GY + 10, w: E.W * 3, h: 120, color: shade(M.wall, -0.5), top: shade(M.wall, -0.15), doors: 20 });
    g.fillStyle = linGrad(g, 0, GY + 10, 0, GY + 700, [shade(M.floor, -0.1), M.dark]); g.fillRect(-E.W, GY + 10, E.W * 3, E.H * 2);
    FX.pool(g, CX + 40, GY - 100, 360, 50, M.key, 0.25);
  });
  return { GY, CX, M, top: GY - 112 };
}

// C. Clinic consult room: cool window, warm desk lamp, lightbox, UROLOGY door sign.
export function clinic(g, t, cam, o = {}) {
  const M = mood('interiorCool'), GY = GYf(), CX = E.W / 2;
  layer(g, cam, 0.45, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(M.dark, -0.1), M.wall]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    FX.windowFrame(g, { x: CX - 120, y: GY - 1080, w: 420, h: 520, cols: 3, frame: shade(M.wall, -0.6), bar: 10, blinds: 7 }, (g, x, y, w, h) => { g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#9fb8e8', '#dfe8ff']); g.fillRect(x, y, w, h); FX.skyline(g, { x, y: y + h, w, maxH: h * 0.45, color: '#6a7aa8', windowColor: '#e8f0ff', lit: 0.1, seed: 9 }); });
    FX.godRays(g, CX + 90, GY - 820, { count: 7, angle: Math.PI * 0.6, spread: 0.6, len: 1100, a: 0.05, t, color: '#dfe8ff' });
    // lightbox
    rr(g, CX - 470, GY - 900, 260, 200, 10); g.fillStyle = '#0d1424'; g.fill(); rr(g, CX - 458, GY - 888, 236, 176, 6); g.fillStyle = alpha('#cfe3ff', 0.85); g.fill();
    if (o.lightbox) o.lightbox(g, CX - 458, GY - 888, 236, 176);
    // door with sign
    const dx = CX - 520; g.fillStyle = shade(M.wall, -0.45); g.fillRect(dx, GY - 560, 200, 560);
    rr(g, dx + 20, GY - 640, 160, 50, 8); g.fillStyle = o.signGlow ? '#e8f4ff' : '#b8c6e0'; g.fill(); if (o.signGlow) glow(g, dx + 100, GY - 615, 160, '#cfe3ff', 0.5 * o.signGlow);
    text(g, 'UROLOGY', dx + 100, GY - 614, { size: 30, color: '#1a2440', font: FONTS.ui, weight: 900, spacing: 2 });
    // desk + lamp
    g.fillStyle = shade(M.wall, -0.55); g.fillRect(CX + 120, GY - 230, 360, 22); seg(g, [[CX + 140, GY - 210], [CX + 140, GY]], 10, shade(M.wall, -0.6)); seg(g, [[CX + 460, GY - 210], [CX + 460, GY]], 10, shade(M.wall, -0.6));
    seg(g, [[CX + 420, GY - 230], [CX + 400, GY - 330], [CX + 350, GY - 360]], 6, '#141826'); glow(g, CX + 345, GY - 350, 160, '#ffd28a', 0.55);
  });
  layer(g, cam, 0.85, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 700, [shade(M.floor, 0.05), M.dark]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 700, 'rgba(0,0,0,.25)', 0.07); FX.pool(g, CX + 40, GY + 40, 400, 60, '#cbd6ff', 0.15);
  });
  return { GY, CX, M };
}
