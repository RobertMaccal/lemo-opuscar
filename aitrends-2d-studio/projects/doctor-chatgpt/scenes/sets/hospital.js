// sets/hospital.js — the two locations: the ER corridor (doors, side view) and the treatment bay.
// Key light: cold overhead strips in the corridor; the exam lamp over the stretcher in the bay. Monitor = green practical.
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, radGrad, glow, alpha, shade, mix, text, FONTS, clamp } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { monitor, examLamp, ivPole, wallClock, cabinet, cart, rollingStool, curtain, gurney } from '../lib.js';

export const GYf = () => E.H * V(0.8, 0.68);
const TEAL = '#2c6f6c';

// ---------------- corridor ----------------
// o.doorsX: world x of the double doors; o.doorOpen 0..1; o.lightsK: strip-light streak (speed)
export function corridor(g, t, cam, o = {}) {
  const M = mood('interiorCool'), GY = GYf(), CX = E.W / 2;
  const wall = shade(M.wall, -0.15), wallDark = shade(M.wall, -0.5), tile = mix(M.wall, TEAL, 0.45);
  layer(g, cam, 0.5, (g) => {
    backdrop(g, [shade(M.dark, -0.2), M.dark]);
    const top = GY - 1150, x0 = -3000, x1 = 6000;
    g.fillStyle = linGrad(g, 0, top, 0, GY, [shade(wall, -0.35), wall, shade(wall, -0.1)]); g.fillRect(x0, top, x1 - x0, GY - top);
    // wainscot tiles + handrail
    g.fillStyle = shade(tile, -0.15); g.fillRect(x0, GY - 360, x1 - x0, 360);
    g.strokeStyle = alpha('#000', 0.18); g.lineWidth = 2; for (let x = x0; x < x1; x += 60) { g.beginPath(); g.moveTo(x, GY - 360); g.lineTo(x, GY); g.stroke(); }
    seg(g, [[x0, GY - 380], [x1, GY - 380]], 12, shade(M.key, -0.55)); seg(g, [[x0, GY - 384], [x1, GY - 384]], 3, alpha(M.key, 0.35));
    // repeating wall dressing: side doors, signs, sanitizer
    for (let k = -6; k < 12; k++) {
      const bx = k * 640 + 200; if (o.doorsX != null && Math.abs(bx - o.doorsX) < 520) continue;
      rr(g, bx, GY - 620, 210, 620, 8); g.fillStyle = shade(wall, -0.35); g.fill();
      rr(g, bx + 70, GY - 540, 70, 100, 10); g.fillStyle = alpha(M.practical, 0.25); g.fill();
      rr(g, bx + 300, GY - 700, 150, 90, 6); g.fillStyle = shade(TEAL, -0.2); g.fill();
      text(g, ['RADIOLOGY', 'TRIAGE', 'LAB', 'WARD B'][((k % 4) + 4) % 4], bx + 375, GY - 655, { size: 26, color: alpha('#e8f6ff', 0.75), font: FONTS.ui, weight: 900 });
      rr(g, bx + 500, GY - 520, 40, 70, 8); g.fillStyle = '#d8e2ee'; g.fill(); g.fillStyle = '#3a9a7a'; g.fillRect(bx + 506, GY - 500, 28, 20);
    }
    if (o.doorsX != null) emergencyDoors(g, t, o.doorsX, GY, o.doorOpen || 0, M);
    // ceiling strip lights
    g.fillStyle = shade(M.dark, -0.3); g.fillRect(x0, top - 400, x1 - x0, 440);
    for (let k = -6; k < 16; k++) { const lx = k * 420; rr(g, lx, top - 10, 240, 26, 8); g.fillStyle = '#eef6ff'; g.fill(); glow(g, lx + 120, top + 10, 260, M.key, 0.35); }
  });
  layer(g, cam, 0.9, (g) => {                                     // glossy floor with reflections
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 700, [shade(M.floor, 0.12), shade(M.floor, -0.25), M.dark]); g.fillRect(-3000, GY, 9000, E.H * 2);
    FX.floorLines(g, GY, GY + 700, 'rgba(0,0,0,.22)', 0.07);
    for (let k = -6; k < 16; k++) FX.pool(g, k * 420 * 0.9 + 140, GY + 140, 220, 26, M.key, 0.1);
  });
  return { GY, CX, M };
}
function emergencyDoors(g, t, x, GY, open, M) {
  const w = 460, h = 760, top = GY - h;
  // light beyond the doors
  g.fillStyle = linGrad(g, 0, top, 0, GY, ['#dff1ff', '#9fd0f0']); g.fillRect(x - w / 2, top, w, h);
  glow(g, x, GY - h / 2, 600 * open + 200, '#dff1ff', 0.35 * open);
  // swinging panels (they narrow as they swing toward the camera)
  for (const sd of [-1, 1]) {
    const pw = (w / 2) * (1 - 0.82 * open), px = sd < 0 ? x - w / 2 : x + w / 2 - pw;
    g.fillStyle = shade(M.wall, -0.05); g.fillRect(px, top, pw, h);
    g.fillStyle = alpha('#000', 0.25 * open); g.fillRect(px, top, pw, h);
    if (pw > 40) { rr(g, px + pw * 0.25, top + 120, pw * 0.5, 130, 14); g.fillStyle = alpha('#bfe9ff', 0.7); g.fill(); }
    g.fillStyle = shade(M.wall, -0.45); g.fillRect(px, top + h * 0.55, pw, 26);
  }
  g.strokeStyle = shade(M.wall, -0.6); g.lineWidth = 16; g.strokeRect(x - w / 2 - 8, top - 8, w + 16, h + 8);
  // EMERGENCY sign
  rr(g, x - 220, top - 150, 440, 100, 14); g.fillStyle = '#1a0a0e'; g.fill();
  glow(g, x, top - 100, 320, '#ff3b4a', 0.45);
  text(g, 'EMERGENCY', x, top - 98, { size: 64, color: '#ff4a58', glow: 30, glowColor: 'rgba(255,60,70,.9)', spacing: 4 });
}

// ---------------- treatment bay ----------------
// o: monitor {mode,hr,spo2,bp}, lamp 0..1, chars(g, ctx), front(g, ctx), patient {expr, stain}, cabinetOpen, code (red code-light 0..1)
export function bay(g, t, cam, o = {}) {
  const M = mood('interiorCool'), GY = GYf(), CX = E.W / 2;
  const wall = shade(M.wall, -0.2), tile = mix(M.wall, TEAL, 0.5);
  const mon = { x: CX + 120, y: GY - 960, w: 330, h: 250, ...(o.monitorPos || {}) };
  let spill = '#5fe0a0';
  layer(g, cam, 0.45, (g) => {
    backdrop(g, [shade(M.dark, -0.3), M.dark]);
    g.fillStyle = linGrad(g, 0, GY - 1500, 0, GY, [shade(wall, -0.45), wall, shade(wall, 0.05)]); g.fillRect(-1600, GY - 1600, 4300, 1700);
    g.fillStyle = shade(tile, -0.1); g.fillRect(-1600, GY - 330, 4300, 340);
    g.strokeStyle = alpha('#000', 0.16); g.lineWidth = 2; for (let x = -1600; x < 2700; x += 64) { g.beginPath(); g.moveTo(x, GY - 330); g.lineTo(x, GY); g.stroke(); } for (let y = GY - 330; y < GY; y += 64) { g.beginPath(); g.moveTo(-1600, y); g.lineTo(2700, y); g.stroke(); }
    seg(g, [[-1600, GY - 334], [2700, GY - 334]], 6, alpha(M.key, 0.25));
    // wall outlets / gas panel (headwall)
    rr(g, CX - 260, GY - 520, 520, 120, 14); g.fillStyle = shade(wall, -0.3); g.fill();
    for (let i = 0; i < 6; i++) { circle(g, CX - 200 + i * 80, GY - 460, 16, ['#3a9a7a', '#3f6fb0', '#f2c21a', '#d8e2ee', '#3a9a7a', '#d8e2ee'][i]); circle(g, CX - 200 + i * 80, GY - 460, 6, '#10131a'); }
    // CODE BLUE button + light
    const bx = CX - 200, by = GY - 360;
    rr(g, bx - 48, by - 48, 96, 96, 12); g.fillStyle = '#d8e2ee'; g.fill(); circle(g, bx, by - 6, 30, o.code ? '#ff4a58' : '#3a6ff0'); text(g, 'CODE BLUE', bx, by + 34, { size: 15, color: '#1a1f2c', font: FONTS.ui, weight: 900 });
    if (o.code) glow(g, bx, by, 180, '#ff3b4a', 0.5 * o.code);
    cabinet(g, CX - 560, GY - 1030, 300, 560, { open: o.cabinetOpen || 0 });
    wallClock(g, CX - 140, GY - 1180, 62, t + (o.clockT || 0), '#1a1f2c');
    // curtains at the edges
    curtain(g, -900, GY - 1300, 560, 1280, shade(TEAL, -0.1), t); curtain(g, CX + 560, GY - 1300, 600, 1280, shade(TEAL, -0.1), t + 1);
    seg(g, [[-1600, GY - 1306], [2700, GY - 1306]], 8, '#8a93a6');
  });
  layer(g, cam, 0.7, (g) => {
    const r = monitor(g, mon.x, mon.y, mon.w, mon.h, t, o.monitor || {}); spill = r.spill;
    ivPole(g, CX + 360, GY - 40, 760, 1.15, t);
  });
  layer(g, cam, 0.8, (g) => {
    examLamp(g, CX - 40, GY - 820, 1.15, M, o.lamp ?? 1);
    FX.lightCone(g, CX - 40, GY - 800, { angle: Math.PI / 2, spread: 0.85, len: 1000, color: M.key, a: 0.13 * (o.lamp ?? 1) });
  });
  layer(g, cam, 0.9, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 700, [shade(M.floor, 0.15), shade(M.floor, -0.2), M.dark]); g.fillRect(-1600, GY, 4300, E.H * 2);
    FX.floorLines(g, GY, GY + 700, 'rgba(0,0,0,.2)', 0.08);
    FX.pool(g, CX - 40, GY + 120, 420, 70, M.key, 0.22 * (o.lamp ?? 1));
    FX.pool(g, mon.x + mon.w / 2, GY + 60, 260, 40, spill, 0.12);
  });
  const ctx = { GY, CX, M, mon, spill };
  layer(g, cam, 1, (g) => {
    o.back?.(g, ctx);
    o.chars?.(g, ctx);
    cart(g, CX + 520, GY + 70, 1.1);
    const gu = gurney(g, CX + (o.bedX || 0), GY + 110, 1.05, t, { patient: { rim: { color: M.rim, dir: [0, -1], w: 3 }, ...(o.patient || {}) } });
    ctx.bedTop = gu.top; ctx.pat = gu.pat;
    rollingStool(g, CX - 420, GY + 190, 1.2);
    o.front?.(g, ctx);
  });
  if (o.code) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#ff2a3a', 0.1 * o.code * (0.5 + 0.5 * Math.sin(t * 8))); g.fillRect(0, 0, E.W, E.H); g.restore(); }
  FX.dust(g, t, { count: 34, color: '#dff1ff', a: 0.28, seed: 5 });
  return ctx;
}
