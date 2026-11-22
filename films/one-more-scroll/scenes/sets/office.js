// sets/office.js — work: the open-plan office (grey / beige / pale blue), Jeff's desk + monitor, the boss's office
// (blinds, sales chart), the cafeteria. `sun` (0..1) swings the light from flat grey to a low orange sunset; `dusk` to blue.
import { E, V, mood, layer, blurLayer, backdrop, veil, rr, seg, circle, poly, linGrad, radGrad, glow, alpha, shade, mix, clamp, lerp, rng, text, FONTS } from '/engine/core.js';
import { drawFigure, POSES, breathe } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { wallClock } from '../_kit.js';

const GREY = { wall: '#5a5e68', wall2: '#6a6a6c', beige: '#7a7266', floor: '#3c3e46', desk: '#8a8478', sky: ['#8f9aac', '#b4bcc6'] };
const skyAt = (sun, dusk) => dusk > 0 ? [mix('#e88a5a', '#1a2246', dusk), mix('#f2b27a', '#3a3a6a', dusk)] : [mix(GREY.sky[0], '#e0784a', sun), mix(GREY.sky[1], '#f6c27a', sun)];
export const OFFICE = { GY: 880, clockX: 1500, clockY: 250, deskX: 960 };
export function monitor(g, x, y, s, o = {}) {
  const on = o.on ?? 1; g.save(); g.translate(x, y); g.scale(s, s);
  seg(g, [[0, 0], [0, -40]], 10, '#2a2c34'); rr(g, -40, -6, 80, 10, 4); g.fillStyle = '#2a2c34'; g.fill();
  rr(g, -120, -190, 240, 150, 10); g.fillStyle = '#16181e'; g.fill();
  g.fillStyle = on > 0 ? mix('#0c1018', o.col || '#bcd8f0', on) : '#0c1018'; g.fillRect(-110, -180, 220, 130);
  if (on > 0.5 && o.rows !== false) { g.fillStyle = 'rgba(40,70,110,.35)'; for (let i = 0; i < 6; i++) g.fillRect(-100, -170 + i * 20, 200 - (i * 37 % 60), 8); }
  g.restore(); if (on > 0) glow(g, x, y - 115 * s, 230 * s, o.col || '#bcd8f0', 0.18 * on);
}
// one desk unit with a seated person (side view); who = outfit or null
export function deskUnit(g, x, GY, s, who, t, o = {}) {
  const top = GY - 150 * s;
  if (who) drawFigure(g, { x: x - 60 * s, y: GY, s: s * 0.95, facing: 1, outfit: who, pose: breathe(o.pose || POSES.sit, t, 1, o.seed || 0), expr: o.expr || 'neutral', alpha: o.alpha, rim: { color: o.rim || '#dfe6f0', dir: [-0.6, -0.8], w: 3.5 }, blink: (t + (o.seed || 0)) % 3.3 > 3.2, talk: o.talk || 0 });
  rr(g, x - 100 * s, top, 240 * s, 14 * s, 4 * s); g.fillStyle = o.deskC || GREY.desk; g.fill(); g.fillStyle = shade(o.deskC || GREY.desk, -0.35); g.fillRect(x + 110 * s, top + 14 * s, 18 * s, GY - top - 14 * s); g.fillRect(x - 90 * s, top + 14 * s, 18 * s, GY - top - 14 * s);
  monitor(g, x + 40 * s, top, s * 0.8, { on: o.monitorOn ?? 1, col: o.monCol });
  rr(g, x - 30 * s, top - 6 * s, 70 * s, 8 * s, 2 * s); g.fillStyle = '#2a2c34'; g.fill();
}
export function office(g, t, cam, o = {}) {
  const sun = o.sun || 0, dusk = o.dusk || 0, GY = OFFICE.GY, M = mood('interiorCool');
  const wall = mix(mix(GREY.wall, '#7a5a4a', sun * 0.6), '#262a40', dusk), floorC = mix(mix(GREY.floor, '#4a3a36', sun * 0.5), '#16182a', dusk);
  layer(g, cam, 0.15, (g) => { backdrop(g, skyAt(sun, dusk)); if (sun > 0.1 && dusk < 0.8) FX.sun(g, 1500 - sun * 200, 560 + sun * 160, 60, '#fff0d8', '#ffb070', 5 * (1 - dusk)); FX.skyline(g, { x: -800, y: 700, w: 3600, minH: 160, maxH: 480, color: mix(mix('#6a7282', '#5a4050', sun), '#141832', dusk), windowColor: alpha(mix('#e8eef4', '#ffd090', sun + dusk), 0.25 + dusk * 0.5), lit: 0.2 + dusk * 0.3, seed: 12 }); });
  layer(g, cam, 0.55, (g) => {
    g.save(); g.beginPath(); g.rect(-1200, -600, 4400, GY + 600); for (let i = 0; i < 5; i++) g.rect(-260 + i * 520 + 440, 120, -440, 360); g.fillStyle = linGrad(g, 0, -100, 0, GY, [shade(wall, -0.2), wall, shade(wall, 0.08)]); g.fill('evenodd'); g.restore();
    for (let i = 0; i < 5; i++) { const wx = -260 + i * 520; g.strokeStyle = shade(wall, -0.4); g.lineWidth = 14; g.strokeRect(wx, 120, 440, 360); seg(g, [[wx + 220, 120], [wx + 220, 480]], 8, shade(wall, -0.4)); for (let b = 0; b < 12; b++) { g.fillStyle = alpha(shade(wall, -0.3), 0.35); g.fillRect(wx, 130 + b * 26, 440, 5); } }
    // ceiling light panels
    for (let i = -3; i < 8; i++) { rr(g, i * 320 - 60, -60, 220, 24, 6); g.fillStyle = mix('#e8f0f4', '#3a3a50', dusk); g.fill(); }
    wallClock(g, OFFICE.clockX, OFFICE.clockY, 54, o.hours ?? 9.2, { sec: o.sec });
    // plant + water cooler
    rr(g, 60, GY - 140, 90, 140, 10); g.fillStyle = '#4a4a50'; g.fill(); for (let k = 0; k < 7; k++) { g.fillStyle = mix('#3a6a4a', '#2a3a3a', dusk); g.beginPath(); g.ellipse(105 + Math.sin(k * 2.3) * 40, GY - 200 - k * 18, 26, 60, Math.sin(k * 1.7) * 0.8, 0, Math.PI * 2); g.fill(); }
    rr(g, 1760, GY - 260, 90, 260, 10); g.fillStyle = '#c8ccd4'; g.fill(); rr(g, 1770, GY - 380, 70, 120, 20); g.fillStyle = 'rgba(140,200,255,.6)'; g.fill();
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 300, [floorC, shade(floorC, -0.5)]); g.fillRect(-1200, GY, 4400, 900); FX.floorLines(g, GY, GY + 300, 'rgba(0,0,0,.2)', 0.1);
  });
  // low sun through the windows: long slanted patches on the floor
  if (sun > 0.05 && dusk < 1) layer(g, cam, 0.55, (g) => { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const wx = -260 + i * 520; g.fillStyle = alpha('#ffb070', 0.14 * sun * (1 - dusk)); poly(g, [[wx, 480], [wx + 440, 480], [wx + 440 - 600 * sun, GY + 200], [wx - 600 * sun, GY + 200]], g.fillStyle); } g.restore(); FX.godRays(g, 1500, 560, { angle: Math.PI * 0.85, spread: 0.6, len: 1600, color: '#ffc080', a: 0.08 * sun * (1 - dusk), t }); });
  return { GY, M, wall };
}
// boss's office: big desk, blinds behind (backlight stripes), the sales chart on the wall
export const BOSSO = { GY: 900, deskX: 1180, deskTop: 690, winX: 980, winW: 700, chartX: 260 };
export function bossOffice(g, t, cam, o = {}) {
  const GY = BOSSO.GY, heat = o.heat || 0, wall = mix('#4a4640', '#3a2a2e', heat * 0.6);
  layer(g, cam, 0.2, (g) => { backdrop(g, ['#9aa4b4', '#c8ccd0']); FX.skyline(g, { x: -400, y: 700, w: 3000, minH: 200, maxH: 520, color: '#7a8292', windowColor: 'rgba(240,244,250,.3)', lit: 0.2, seed: 15 }); });
  layer(g, cam, 0.6, (g) => {
    g.save(); g.beginPath(); g.rect(-1200, -600, 4400, GY + 600); g.rect(BOSSO.winX + BOSSO.winW, 140, -BOSSO.winW, 470); g.fillStyle = linGrad(g, 0, -100, 0, GY, [shade(wall, -0.3), wall, shade(wall, 0.05)]); g.fill('evenodd'); g.restore();
    for (let b = 0; b < 17; b++) { g.fillStyle = 'rgba(40,36,34,.75)'; g.fillRect(BOSSO.winX, 150 + b * 27, BOSSO.winW, 12); }
    g.strokeStyle = '#26221e'; g.lineWidth = 16; g.strokeRect(BOSSO.winX, 140, BOSSO.winW, 470);
    // sales chart on the wall (falls when `fall` > 0)
    const cx = BOSSO.chartX, cy = 200, fall = o.fall || 0; rr(g, cx, cy, 460, 320, 10); g.fillStyle = '#ece8e0'; g.fill(); g.strokeStyle = '#2a2622'; g.lineWidth = 8; g.stroke();
    text(g, 'Q3 SALES', cx + 230, cy + 40, { size: 34, font: FONTS.ui, weight: 900, color: '#3a3632' });
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx + 40, cy + 100 + i * 50); g.lineTo(cx + 430, cy + 100 + i * 50); g.stroke(); }
    const pts = [[0, 0.55], [0.2, 0.62], [0.4, 0.5], [0.6, 0.42 - fall * 0.1], [0.8, 0.28 - fall * 0.2], [1, 0.08 - fall * 0.5]];
    g.strokeStyle = fall > 0.3 ? '#d64a33' : '#3a6ea5'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([u, v], i) => { const x = cx + 50 + u * 370, y = cy + 290 - Math.max(-0.1, v) * 200; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    if (fall > 0.3) { const x = cx + 420, y = cy + 290 - Math.max(-0.1, 0.08 - fall * 0.5) * 200; poly(g, [[x, y + 24], [x - 18, y - 6], [x + 18, y - 6]], '#d64a33'); }
    // shelf + trophy + plant
    g.fillStyle = '#2a2420'; g.fillRect(1760, 380, 300, 14); g.fillStyle = '#c8a03a'; g.fillRect(1800, 320, 40, 60); circle(g, 1820, 312, 26, '#c8a03a');
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 300, ['#3a3430', '#141210']); g.fillRect(-1200, GY, 4400, 900);
  });
  // blinds backlight stripes on the floor
  layer(g, cam, 0.6, (g) => { g.save(); g.globalCompositeOperation = 'lighter'; for (let b = 0; b < 8; b++) { g.fillStyle = 'rgba(255,240,220,.05)'; poly(g, [[BOSSO.winX + 40, 600 + b * 4], [BOSSO.winX + BOSSO.winW, 600 + b * 4], [BOSSO.winX + BOSSO.winW - 500, GY + 60 + b * 50], [BOSSO.winX - 460, GY + 60 + b * 50]], g.fillStyle); } g.restore(); glow(g, BOSSO.winX + BOSSO.winW / 2, 380, 700, '#f0f4ff', 0.22); });
  if (heat > 0) veil(g, '#ff3a2a', heat * 0.12, 'multiply');
  return { GY };
}
export function bossDesk(g, cam, o = {}) {
  layer(g, cam, 0.6, (g) => {
    const x = BOSSO.deskX, top = BOSSO.deskTop, j = o.jump || 0;
    rr(g, x - 300, top, 600, 30, 8); g.fillStyle = '#5a3a2a'; g.fill(); g.fillStyle = '#3a2418'; g.fillRect(x - 280, top + 30, 560, BOSSO.GY - top - 30); g.fillStyle = '#2a1a12'; g.fillRect(x - 260, top + 60, 230, 150);
    // desk items (they jump when the desk is slammed)
    rr(g, x + 60, top - 46 - j * 60, 120, 46, 6); g.fillStyle = '#1a1c24'; g.fill(); text(g, 'MANAGER', x + 120, top - 22 - j * 60, { size: 20, font: FONTS.ui, weight: 900, color: '#c8a03a' });
    g.save(); g.translate(x - 180, top - j * 90); g.rotate(-j * 0.5); g.fillStyle = '#f2efe8'; g.fillRect(-60, -10, 120, 10); g.fillRect(-56, -18, 116, 8); g.restore();
    g.save(); g.translate(x - 40, top - j * 120); g.rotate(j * 0.4); rr(g, -18, -40, 36, 40, 5); g.fillStyle = '#e8e2d6'; g.fill(); g.fillStyle = '#5a3a2a'; g.fillRect(-15, -38, 30, 6); g.restore();
    for (let i = 0; i < 3; i++) { g.save(); g.translate(x + 220 + i * 14, top - j * (70 + i * 30)); g.rotate(j * (i - 1) * 0.8); seg(g, [[0, 0], [0, -46]], 5, ['#3a6ea5', '#d64a33', '#2a2a30'][i]); g.restore(); }
  });
}
// the cafeteria: long tables, microwave, vending machine
export function cafeteria(g, t, cam, o = {}) {
  const GY = 900;
  layer(g, cam, 0.5, (g) => {
    g.fillStyle = linGrad(g, 0, -100, 0, GY, ['#4a4c52', '#5e5a54']); g.fillRect(-1200, -600, 4400, GY + 600);
    for (let i = -3; i < 8; i++) { rr(g, i * 300, -40, 200, 20, 6); g.fillStyle = '#e8eef0'; g.fill(); }
    g.fillStyle = '#6a6660'; g.fillRect(-200, 560, 1300, 30); g.fillStyle = '#4a4640'; g.fillRect(-180, 590, 1260, GY - 590);
    rr(g, 300, 430, 210, 130, 10); g.fillStyle = '#c8ccd4'; g.fill(); rr(g, 316, 446, 140, 98, 6); g.fillStyle = o.micro ? '#ffd88a' : '#2a2c34'; g.fill(); if (o.micro) glow(g, 386, 495, 140, '#ffd88a', 0.3);
    text(g, o.microT || '', 486, 476, { size: 18, font: FONTS.ui, weight: 900, color: '#5fd39a' });
    rr(g, 1500, GY - 520, 260, 520, 14); g.fillStyle = '#2a2c38'; g.fill(); rr(g, 1520, GY - 500, 170, 330, 8); g.fillStyle = '#9fd8ff'; g.fill(); glow(g, 1605, GY - 340, 300, '#9fd8ff', 0.2);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { g.fillStyle = ['#d64a33', '#f2c21a', '#3fb950', '#ff4fa3'][(i + j) % 4]; g.fillRect(1534 + i * 40, GY - 486 + j * 62, 28, 44); }
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 300, ['#3a3836', '#141312']); g.fillRect(-1200, GY, 4400, 900);
  });
  return { GY };
}
export function longTable(g, x, GY, w, s = 1) { const top = GY - 140 * s; rr(g, x, top, w, 16 * s, 6); g.fillStyle = '#9a9488'; g.fill(); for (const dx of [30, w - 50]) { g.fillStyle = '#4a4640'; g.fillRect(x + dx, top + 16 * s, 16 * s, GY - top - 16 * s); } return top; }
