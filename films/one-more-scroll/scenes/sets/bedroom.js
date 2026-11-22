// sets/bedroom.js — Jeff's bedroom, side view. Night: navy walls, a city window, a warm bedside lamp (switchable),
// the LED clock, the phone as the main light source. Variants: dawn (cold grey-blue), door open (hallway light slab).
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, radGrad, glow, alpha, shade, mix, clamp, lerp, rng } from '/engine/core.js';
import { drawFigure } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { ledClock, PHONE } from '../_kit.js';

export const BED = { GY: 864, matY: 712, x0: 560, x1: 1480, stand: 1660, clockX: 1668, clockY: 640, winX: 250, winY: 170, winW: 430, winH: 420, doorX: 30 };
// world position of a local rig point (same transform as the rig: translate, mirror/scale, rotate about the hip)
export function rigPt(o, pt) {
  const p = o.pose, s = o.s ?? 1, f = o.facing ?? 1, r = o.rot || 0, [hx, hy] = p.hip, dx = pt[0] - hx, dy = pt[1] - hy;
  const x = hx + dx * Math.cos(r) - dy * Math.sin(r), y = hy + dx * Math.sin(r) + dy * Math.cos(r); return [o.x + x * f * s, o.y + y * s];
}
// o: { lamp 0..1, dawn 0..1, moon 0..1 (moves the moonlight), door 0..1, dark 0..1 (phone-only), tv }
export function bedroom(g, t, cam, o = {}) {
  const M = mood('night'), GY = BED.GY, dawn = o.dawn || 0, lamp = o.lamp ?? 0, dark = o.dark || 0;
  const wall = mix(mix('#1a2040', '#2a3450', dawn), '#0a0d1c', dark * 0.6), wallD = shade(wall, -0.35);
  layer(g, cam, 0.15, (g) => {                                    // city through the window (far)
    backdrop(g, dawn ? [mix('#0b1028', '#4a5a78', dawn), mix('#1d2550', '#8a98ac', dawn), mix('#3a3570', '#b8c0c8', dawn)] : M.sky);
    if (!dawn) { FX.stars(g, t, { count: 60, area: [-400, -200, 1400, 500], seed: 3 }); FX.moon(g, 380 - (o.moon || 0) * 140, 230 + (o.moon || 0) * 40, 34, '#e8ecff'); }
    FX.skyline(g, { x: -600, y: 640, w: 2200, minH: 120, maxH: 420, color: mix('#141a34', '#4a5468', dawn), windowColor: alpha(mix('#ffcf8a', '#c8d0d8', dawn), 0.8 - dawn * 0.5), lit: 0.3 - dark * 0.1, seed: 21, minW: 40, maxW: 110 });
    FX.skyline(g, { x: -600, y: 700, w: 2200, minH: 60, maxH: 230, color: mix('#0e1226', '#3a4458', dawn), windowColor: alpha(mix('#ffb860', '#b8c0c8', dawn), 0.7 - dawn * 0.4), lit: 0.22, seed: 22 });
  });
  layer(g, cam, 0.7, (g) => {                                     // the room
    // wall with a cutout for the window
    g.save(); g.beginPath(); g.rect(-1200, -600, 4400, GY + 600); g.rect(BED.winX + BED.winW, BED.winY, -BED.winW, BED.winH); g.fillStyle = linGrad(g, 0, -100, 0, GY, [shade(wall, -0.2), wall, shade(wall, 0.05)]); g.fill('evenodd'); g.restore();
    FX.windowFrame(g, { x: BED.winX, y: BED.winY, w: BED.winW, h: BED.winH, cols: 2, rows: 2, frame: '#0c0f1c', bar: 12, blinds: 0 }, () => {});
    // curtain
    g.fillStyle = mix('#2a2a58', '#4a5068', dawn); for (const [x, w] of [[BED.winX - 70, 90], [BED.winX + BED.winW - 20, 90]]) { g.beginPath(); g.moveTo(x, BED.winY - 40); g.lineTo(x + w, BED.winY - 40); g.quadraticCurveTo(x + w * 0.7, BED.winY + 250, x + w + 10, BED.winY + BED.winH + 60); g.lineTo(x - 10, BED.winY + BED.winH + 60); g.quadraticCurveTo(x + w * 0.2, BED.winY + 250, x, BED.winY - 40); g.fill(); }
    seg(g, [[BED.winX - 100, BED.winY - 42], [BED.winX + BED.winW + 100, BED.winY - 42]], 6, '#0a0c18');
    // moonlight / dawn light patch on the wall + floor
    const mx = o.moon || 0; g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = alpha(dawn ? '#9fb0c8' : '#7f94d8', (dawn ? 0.18 : 0.08) * (1 - dark * 0.7)); poly(g, [[BED.winX + 120 + mx * 160, GY - 40], [BED.winX + BED.winW + 220 + mx * 220, GY - 40], [BED.winX + BED.winW + 470 + mx * 260, GY + 220], [BED.winX + 300 + mx * 180, GY + 220]], g.fillStyle); g.restore();
    // door (far left), with a hallway slab when open
    const dx = BED.doorX; g.fillStyle = shade(wall, -0.45); g.fillRect(dx - 10, GY - 470, 200, 470);
    if (o.door) { g.fillStyle = '#dfe9ff'; g.fillRect(dx, GY - 460, 180 * o.door, 460); glow(g, dx + 90 * o.door, GY - 230, 520, '#bcd6ff', 0.4 * o.door); }
    g.fillStyle = shade(wall, -0.25); g.fillRect(dx + 180 * (o.door || 0), GY - 460, 180 * (1 - (o.door || 0)), 460);
    if (!o.door) circle(g, dx + 160, GY - 230, 7, '#4a5070');
    // shelf + frames
    g.fillStyle = shade(wall, -0.4); g.fillRect(840, 300, 300, 12); for (const [x, h, c] of [[860, 70, '#3a3a68'], [900, 54, '#5a3a48'], [940, 80, '#2a4a58'], [1060, 40, '#4a4a70']]) { g.fillStyle = mix(c, wallD, 0.4 + dark * 0.3); g.fillRect(x, 300 - h, 30, h); }
    rr(g, 1180, 230, 170, 120, 6); g.fillStyle = shade(wall, -0.45); g.fill(); rr(g, 1192, 242, 146, 96, 4); g.fillStyle = mix('#3a4a7a', wallD, 0.5 + dark * 0.3); g.fill();
    poly(g, [[1200, 330], [1250, 280], [1290, 316], [1320, 290], [1336, 330]], mix('#26305a', wallD, 0.3));
    // floor
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 300, [mix('#1c1f34', '#3a4050', dawn), '#0a0b14']); g.fillRect(-1200, GY, 4400, 900);
    FX.floorLines(g, GY, GY + 400, 'rgba(0,0,0,.3)', 0.1);
    // bed frame + mattress + headboard (head at the right, by the nightstand)
    g.fillStyle = '#141526'; g.fillRect(BED.x0, BED.matY + 40, BED.x1 - BED.x0, GY - BED.matY - 40);
    rr(g, BED.x1 - 30, BED.matY - 220, 56, GY - BED.matY + 220, 12); g.fillStyle = '#191b30'; g.fill();
    rr(g, BED.x0 - 10, BED.matY - 2, BED.x1 - BED.x0 + 10, 50, 16); g.fillStyle = mix('#3e4a7e', '#7a86a0', dawn); g.fill();
    rr(g, BED.x1 - 230, BED.matY - 48, 190, 54, 24); g.fillStyle = mix('#c8cce8', '#dfe2ea', dawn); g.fill();                  // pillow
    // nightstand, lamp, clock
    const sx = BED.stand; rr(g, sx - 110, GY - 190, 220, 190, 8); g.fillStyle = '#16182c'; g.fill(); g.fillStyle = '#20223a'; g.fillRect(sx - 100, GY - 120, 200, 4); circle(g, sx, GY - 80, 6, '#3a3e5a');
    seg(g, [[sx + 60, GY - 190], [sx + 60, GY - 330]], 6, '#20223a'); poly(g, [[sx + 22, GY - 330], [sx + 98, GY - 330], [sx + 84, GY - 395], [sx + 36, GY - 395]], lamp > 0.05 ? mix('#3a3448', '#ffcf8a', lamp) : '#2a2c44');
  });
  // warm lamp light (switchable)
  if (lamp > 0.02) layer(g, cam, 0.7, (g) => { glow(g, BED.stand + 60, GY - 360, 520, '#ffb86a', 0.32 * lamp); FX.lightCone(g, BED.stand + 60, GY - 330, { angle: Math.PI / 2, spread: 1.2, len: 460, color: '#ffcf8a', a: 0.16 * lamp }); FX.pool(g, BED.stand - 100, GY - 180, 300, 40, '#ffcf8a', 0.25 * lamp); });
  return { GY, M, mat: BED.matY, wall };
}
// the LED clock on the nightstand (drawn after characters so it can glow)
export function bedClock(g, cam, str, o = {}) { layer(g, cam, 0.7, (g) => ledClock(g, BED.clockX, BED.clockY, 0.62, str, o)); }
// blanket over the lying figure (covers from the feet to the chest)
export function blanket(g, cam, xA, xB, o = {}) {
  layer(g, cam, 1, (g) => {
    const y = BED.matY - (o.h || 54), c = o.color || '#3a4a8a';
    g.fillStyle = c; g.beginPath(); g.moveTo(xA - 30, BED.matY + 46); g.lineTo(xA - 26, y + 14); g.quadraticCurveTo(xA, y - 4, (xA + xB) / 2, y - 10 - (o.bump || 0)); g.quadraticCurveTo(xB - 20, y - 6, xB + 10, y + 18); g.quadraticCurveTo(xB + 30, BED.matY + 10, xB + 20, BED.matY + 46); g.closePath(); g.fill();
    g.strokeStyle = alpha('#9fb0ff', 0.25); g.lineWidth = 3; g.beginPath(); g.moveTo(xA, y + 6); g.quadraticCurveTo((xA + xB) / 2, y - 14 - (o.bump || 0), xB, y + 12); g.stroke();
    g.fillStyle = shade(c, 0.12); rr(g, xB - 40, y + 2, 60, 26, 10); g.fill();
  });
}
// the phone held above the face: a thin slab with its screen light falling on the face
export function heldPhone(g, x, y, ang, o = {}) {
  const on = o.on ?? 1, col = o.col || PHONE;
  g.save(); g.translate(x, y); g.rotate(ang); rr(g, -34, -6, 68, 12, 4); g.fillStyle = '#07080d'; g.fill(); if (on > 0) { g.fillStyle = alpha(col, 0.9 * on); g.fillRect(-30, 3, 60, 3); } g.restore();
  if (on > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.rotate(ang); g.fillStyle = linGrad(g, 0, 0, 0, 220, [alpha(col, 0.35 * on), alpha(col, 0)]); g.beginPath(); g.moveTo(-30, 4); g.lineTo(30, 4); g.lineTo(110, 220); g.lineTo(-110, 220); g.closePath(); g.fill(); g.restore(); glow(g, x, y + 40, 220, col, 0.28 * on); }
}
