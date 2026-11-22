// sets/city.js — the morning commute: kitchen (pre-dawn), grey dawn street (parallax for tracking), bus stop, bus, bus interior.
import { E, V, mood, layer, blurLayer, backdrop, rr, seg, circle, poly, linGrad, radGrad, glow, alpha, shade, mix, clamp, lerp, rng, text, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

const DAWN = { sky: ['#4a566e', '#7d889a', '#a9b0b8'], wall: '#3a4252', dark: '#1a1e28', floor: '#2a2e38', lamp: '#ffc070', road: '#30343e' };
export function kitchen(g, t, cam, o = {}) {
  const GY = 900;
  layer(g, cam, 0.8, (g) => {
    g.fillStyle = linGrad(g, 0, -200, 0, GY, ['#1c2232', '#2a3244']); g.fillRect(-1200, -600, 4400, GY + 600);
    FX.windowFrame(g, { x: 220, y: 160, w: 420, h: 330, cols: 2, rows: 1, frame: '#12151f', bar: 12 }, (g, x, y, w, h) => { g.fillStyle = linGrad(g, 0, y, 0, y + h, DAWN.sky); g.fillRect(x, y, w, h); FX.skyline(g, { x, y: y + h, w, minH: 40, maxH: 160, color: '#3a4256', windowColor: 'rgba(255,200,120,.6)', lit: 0.2, seed: 5 }); });
    for (let i = 0; i < 4; i++) { rr(g, 760 + i * 210, 150, 190, 230, 6); g.fillStyle = '#20263a'; g.fill(); circle(g, 760 + i * 210 + 170, 270, 5, '#4a5270'); }
    g.fillStyle = '#3a4258'; g.fillRect(600, 610, 1400, 30); g.fillStyle = '#1a1e2c'; g.fillRect(620, 640, 1360, GY - 640);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#20263a'; g.fillRect(640 + i * 225, 670, 205, GY - 700); }
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 300, ['#22283a', '#0a0c14']); g.fillRect(-1200, GY, 4400, 900);
    // the door (right) — light from the corridor when open
    g.fillStyle = '#0c0e16'; g.fillRect(1680, GY - 520, 230, 520); g.fillStyle = '#2a3046'; g.fillRect(1680 + 230 * (o.door || 0), GY - 520, 230 * (1 - (o.door || 0)), 520);
  });
  layer(g, cam, 0.8, (g) => { glow(g, 430, 320, 500, '#a8b8d0', 0.16); FX.pool(g, 900, 640, 400, 40, '#a8b8d0', 0.12); });
  return { GY, counter: 610 };
}
export function toaster(g, x, y, s, pop, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const up = pop; for (const dx of [-36, 36]) { rr(g, dx - 30, -120 - up * 120, 60, 80, 14); g.fillStyle = '#c8894a'; g.fill(); rr(g, dx - 22, -112 - up * 120, 44, 64, 10); g.fillStyle = '#e8c08a'; g.fill(); }
  rr(g, -110, -110, 220, 110, 30); g.fillStyle = '#b8c0cc'; g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-90, -100, 170, 10);
  g.fillStyle = '#20242e'; g.fillRect(-70, -112, 40, 6); g.fillRect(30, -112, 40, 6); rr(g, 100, -70, 20, 30, 6); g.fillStyle = '#20242e'; g.fill();
  if (t != null && pop < 0.1) glow(g, 0, -110, 120, '#ff7a3a', 0.35);
  g.restore();
}
// the grey dawn street; `scroll` moves the world (tracking shot)
export function street(g, t, cam, o = {}) {
  const GY = E.H * 0.8, sc = o.scroll || 0, L = o.lamps ?? 0.6;
  layer(g, cam, 0.1, (g) => { backdrop(g, DAWN.sky); FX.clouds(g, { y: 140, h: 200, color: '#dfe4ee', a: 0.18, seed: 4, count: 8 }); });
  layer(g, { ...cam, x: (cam.x || 0) + sc * 0.25 }, 0.3, (g) => { FX.skyline(g, { x: -1600, y: GY - 230, w: 6000, minH: 160, maxH: 520, color: '#5a6274', windowColor: 'rgba(255,214,150,.5)', lit: 0.12, seed: 31, minW: 70, maxW: 160 }); FX.fog(g, GY - 380, 300, '#a9b0b8', 0.4); });
  layer(g, { ...cam, x: (cam.x || 0) + sc * 0.6 }, 0.6, (g) => {
    for (let i = -6; i < 30; i++) { const x = i * 420, h = 360 + ((i * 97) % 5) * 40; FX.facade(g, { x, y: GY - 10, w: 400, h, color: ['#3c4456', '#444c5e', '#383f50'][((i % 3) + 3) % 3], win: '#ffd08a', dark: '#262c3a', cols: 4, rows: 3, lit: 0.18, seed: 40 + i }); g.fillStyle = '#2a3040'; g.fillRect(x, GY - 10 - h - 14, 400, 16); }
  });
  layer(g, { ...cam, x: (cam.x || 0) + sc }, 1, (g) => {
    g.fillStyle = '#4a505c'; g.fillRect(-2000, GY - 10, 16000, 40); g.fillStyle = '#3a3e48'; g.fillRect(-2000, GY + 30, 16000, 400); g.fillStyle = '#2a2e36'; g.fillRect(-2000, GY + 30, 16000, 8);
    for (let x = -2000; x < 14000; x += 140) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, GY - 10, 3, 40); }
    for (let i = -4; i < 30; i++) { const x = i * 640 + 200; FX.lampPost(g, x, GY, 330, { light: DAWN.lamp, a: 0.12 * L, on: L > 0.05 }); if (i % 2) FX.tree(g, x + 320, GY, 1.3, '#262c38'); }
  });
  return { GY };
}
export function busStop(g, t, cam, o = {}) {
  const GY = E.H * 0.8;
  street(g, t, cam, { scroll: 0, lamps: 0.45 });
  layer(g, cam, 1, (g) => {
    const x0 = 520, x1 = 1460, top = GY - 380;
    g.fillStyle = 'rgba(180,200,220,.12)'; g.fillRect(x0, top + 20, x1 - x0, 330); g.strokeStyle = '#1c202a'; g.lineWidth = 10; g.strokeRect(x0, top + 20, x1 - x0, 330);
    for (let x = x0 + 235; x < x1; x += 235) seg(g, [[x, top + 20], [x, top + 350]], 6, '#1c202a');
    g.fillStyle = '#1c202a'; g.fillRect(x0 - 30, top - 6, x1 - x0 + 60, 30); seg(g, [[x0, top], [x0, GY]], 12, '#1c202a'); seg(g, [[x1, top], [x1, GY]], 12, '#1c202a');
    rr(g, x1 - 200, top + 60, 160, 230, 8); g.fillStyle = '#d8e0ea'; g.fill(); g.fillStyle = '#3a6ea5'; g.fillRect(x1 - 190, top + 70, 140, 40); text(g, '42', x1 - 120, top + 92, { size: 32, color: '#fff', font: FONTS.ui, weight: 900 }); for (let i = 0; i < 6; i++) { g.fillStyle = '#8a96a8'; g.fillRect(x1 - 180, top + 130 + i * 24, 120 - (i % 3) * 20, 8); }
    g.fillStyle = '#20242e'; g.fillRect(x0 + 60, GY - 110, 520, 16); for (const dx of [80, 540]) seg(g, [[x0 + dx, GY - 100], [x0 + dx, GY]], 8, '#20242e');
    // bus stop sign
    seg(g, [[x0 - 120, GY], [x0 - 120, GY - 420]], 8, '#20242e'); circle(g, x0 - 120, GY - 440, 46, '#3a6ea5'); text(g, 'BUS', x0 - 120, GY - 440, { size: 28, color: '#fff', font: FONTS.ui, weight: 900 });
  });
  return { GY };
}
// the city bus seen from the side; x = front bumper
export function bus(g, x, GY, o = {}) {
  const w = 1500, h = 420, y = GY - 40 - h, doors = o.doors || 0;
  rr(g, x - w, y, w, h, 40); g.fillStyle = '#d8dce4'; g.fill(); g.fillStyle = '#3a6ea5'; g.fillRect(x - w, y + h - 120, w, 40);
  rr(g, x - w + 30, y + 40, w - 60, 170, 18); g.fillStyle = '#1a1e2a'; g.fill();
  for (let i = 0; i < 7; i++) { const wx = x - w + 50 + i * 200; rr(g, wx, y + 52, 180, 146, 10); g.fillStyle = linGrad(g, 0, y + 52, 0, y + 198, ['#ffe3b0', '#c89a60']); g.fill(); g.fillStyle = 'rgba(20,16,24,.85)'; if ((i * 7) % 3) { circle(g, wx + 60 + i * 5, y + 140, 22, 'rgba(20,16,24,.85)'); g.fillRect(wx + 44 + i * 5, y + 160, 34, 40); } }
  rr(g, x - 150, y + 40, 120, h - 90, 10); g.fillStyle = '#1a1e2a'; g.fill();
  const dw = 120 * (1 - doors); g.fillStyle = '#9aa6b8'; g.fillRect(x - 150, y + 44, dw / 2, h - 98); g.fillRect(x - 30 - dw / 2, y + 44, dw / 2, h - 98); if (doors > 0.2) glow(g, x - 90, y + h / 2, 200, '#ffe3b0', 0.25 * doors);
  rr(g, x - 360, y + 10, 220, 30, 6); g.fillStyle = '#0a0c10'; g.fill(); text(g, '42  DOWNTOWN', x - 250, y + 26, { size: 22, color: '#ffb35c', font: FONTS.ui, weight: 900, glow: 8, glowColor: 'rgba(255,170,80,.8)' });
  for (const wx of [x - w + 220, x - 300]) { circle(g, wx, GY - 40, 62, '#12141a'); circle(g, wx, GY - 40, 26, '#5a6070'); }
  circle(g, x - 10, y + h - 60, 14, '#fff4dc'); glow(g, x - 10, y + h - 60, 160, '#fff4dc', 0.4);
}
// bus interior: the window behind the seat with the city sliding past
export function busInside(g, t, cam, o = {}) {
  const GY = 940, sp = o.speed ?? 420;
  layer(g, cam, 0.9, (g) => {
    g.fillStyle = '#2a2e3a'; g.fillRect(-1200, -600, 4400, 2000);
    // windows strip with the scrolling city
    for (const [wx, ww] of [[-300, 860], [640, 900], [1620, 860]]) {
      FX.windowFrame(g, { x: wx, y: 180, w: ww, h: 440, cols: 1, rows: 1, frame: '#1a1d26', bar: 18 }, (g, x, y, w, h) => {
        g.fillStyle = linGrad(g, 0, y, 0, y + h, DAWN.sky); g.fillRect(x, y, w, h);
        const off = (t * sp) % 2400;
        g.save(); g.translate(-off, 0);
        for (let k = -1; k < 3; k++) { g.save(); g.translate(k * 2400, 0); FX.skyline(g, { x: -400, y: y + h - 60, w: 2400, minH: 120, maxH: 380, color: '#4c5468', windowColor: 'rgba(255,210,140,.55)', lit: 0.15, seed: 7, minW: 60, maxW: 160 }); g.restore(); }
        g.restore();
        const off2 = (t * sp * 2.2) % 900; for (let k = -1; k < 4; k++) { const lx = x + k * 900 - off2; seg(g, [[lx, y + h], [lx, y + 60]], 10, 'rgba(20,22,30,.8)'); glow(g, lx + 20, y + 70, 60, '#ffc070', 0.4); }
        g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const sx = ((t * 260 + i * 400) % (w + 400)) - 200; g.fillStyle = 'rgba(255,255,255,.06)'; poly(g, [[x + sx, y], [x + sx + 80, y], [x + sx - 60, y + h], [x + sx - 140, y + h]], g.fillStyle); } g.restore();
        if (o.reflect) o.reflect(g, x, y, w, h);
      });
    }
    g.fillStyle = '#20232e'; g.fillRect(-1200, 620, 4400, 30); g.fillStyle = linGrad(g, 0, 650, 0, GY, ['#232633', '#151720']); g.fillRect(-1200, 650, 4400, GY - 650);
    seg(g, [[-1200, 120], [3200, 120]], 10, '#c8ccd4'); for (let x = -1100; x < 3200; x += 260) seg(g, [[x, 120], [x, 170]], 4, '#9aa0aa');
    g.fillStyle = '#121419'; g.fillRect(-1200, GY, 4400, 600);
  });
  return { GY };
}
export const DAWN_RIM = '#c8d4e8';
