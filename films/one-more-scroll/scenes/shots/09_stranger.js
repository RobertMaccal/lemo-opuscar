// shots/09_stranger.js — SCENE 09: the knocks, the hallway, the door, the silhouette. "I am you. And you're in trouble." Black.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, shake, alpha, shade, mix, seg, circle, rr, poly, linGrad, radGrad, glow, text, FONTS } from '/engine/core.js';
import { drawFigure, bigFace, POSES, blendPose, breathe, walkPose } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bedroom, bedClock, rigPt, BED } from '../sets/bedroom.js';
import { P, PHONE, mouth, blinkAt, gT, letterText } from '../_kit.js';
import { jeff, STRANGER } from '../cast.js';
import { jeffInBed } from './01_world.js';
import { focus } from './02_scroll.js';

const J = jeff(1), COLDR = '#9fd0ff', SLAB = '#cfe2ff';
const knockAt = (t, times) => times.some(k => t > k && t < k + 0.5) ? times.find(k => t > k && t < k + 0.5) : null;
// ---------- s67: the dark room — KNOCK KNOCK KNOCK — he doesn't move ----------
registerShot('s67', { draw(g, t, info) {
  const cam = focus(1000, 640, lerp(1.45, 1.5, t / info.dur), 1);
  bedroom(g, t, cam, { dark: 0.95, moon: 1 });
  jeffInBed(g, t, cam, { work: true, mess: 1, pose: P.lieRest, expr: 'sleepy', blanket: false, phone: false, rimC: '#2a3a6a' });
  bedClock(g, cam, '4:51 AM', { a: 0.6 });
  const k = knockAt(t, [0.6, 0.95, 1.3]); if (k != null) layer(g, cam, 0.7, (g) => FX.rings(g, BED.doorX + 40, BED.GY - 260, (t - k) * 1.2, { count: 1, r0: 20, r1: 260, color: '#cfe0ff', a: 0.55, speed: 1.6, w: 4 }));
  veil(g, '#02030a', 0.25);
} });
// ---------- s68: the hallway — knocks again, louder; the camera creeps toward the bedroom door ----------
registerShot('s68', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), z = lerp(1.0, 1.6, k), vx = E.W / 2, vy = E.H * 0.47;
  g.save(); g.translate(vx, vy); g.scale(z, z); g.translate(-vx, -vy);
  g.fillStyle = '#05070f'; g.fillRect(-500, -500, E.W + 1000, E.H + 1000);
  const dw = 230, dh = 420, dx0 = vx - dw / 2, dy0 = vy - dh * 0.55;   // the bedroom door at the end
  const wallL = '#141a32', wallR = '#10152a', fl = '#0c1020';
  poly(g, [[-500, -500], [dx0 - 40, dy0 - 40], [dx0 - 40, dy0 + dh], [-500, E.H + 500]], wallL); poly(g, [[E.W + 500, -500], [dx0 + dw + 40, dy0 - 40], [dx0 + dw + 40, dy0 + dh], [E.W + 500, E.H + 500]], wallR);
  poly(g, [[-500, E.H + 500], [dx0 - 40, dy0 + dh], [dx0 + dw + 40, dy0 + dh], [E.W + 500, E.H + 500]], fl); poly(g, [[-500, -500], [dx0 - 40, dy0 - 40], [dx0 + dw + 40, dy0 - 40], [E.W + 500, -500]], '#070912');
  g.fillStyle = '#141a30'; g.fillRect(dx0 - 40, dy0 - 40, dw + 80, dh + 40); g.fillStyle = '#1a2240'; g.fillRect(dx0, dy0, dw, dh); circle(g, dx0 + dw - 30, dy0 + dh * 0.55, 6, '#5a6a9a');
  g.fillStyle = alpha(SLAB, 0.5); g.fillRect(dx0, dy0 + dh - 4, dw, 4); glow(g, vx, dy0 + dh, 160, SLAB, 0.25);   // light under the door
  // the front door on the left wall (being knocked)
  poly(g, [[200, 180], [420, 260], [420, 900], [200, 1020]], '#10142a'); circle(g, 390, 600, 8, '#6a7aaa');
  const kn = knockAt(t, [0.3, 0.62, 0.94]); if (kn != null) { const [sx, sy] = shake(t, 4, 40); g.translate(sx, sy); FX.rings(g, 310, 580, (t - kn) * 1.2, { count: 2, r0: 30, r1: 360, color: '#cfe0ff', a: 0.6, speed: 1.6, w: 5 }); }
  g.restore();
  FX.dust(g, t, { count: 30, color: '#a8c0ff', a: 0.18, speed: 5 });
  glow(g, E.W * 0.17, E.H * 0.55, 500, '#5a6aa0', 0.12);
} });
// ---------- s69: the door swings open; a slab of cold light; a silhouette ----------
const silhouette = (g, x, y, s, t, o = {}) => drawFigure(g, { x, y, s, facing: o.facing ?? 1, outfit: { ...STRANGER, color: '#0b0d16', color2: '#0b0d16', legs: '#07080d' }, pose: o.pose || POSES.stand, expr: 'calm', featureColor: o.face ? undefined : '#07080d', face: { lid: 0.3 }, rim: { color: COLDR, dir: [-0.3, -1], w: 5 }, dim: true, alpha: o.alpha ?? 1, ink: '#05060a' });
registerShot('s69', { draw(g, t, info) {
  const cam = focus(260, 600, lerp(1.7, 1.85, t / info.dur), 0.7), open = ease.inOut(prog(t, 0.2, 2.2));
  bedroom(g, t, cam, { dark: 0.9, door: open, moon: 1 });
  layer(g, cam, 0.7, (g) => {
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha(SLAB, 0.22 * open); poly(g, [[BED.doorX, BED.GY], [BED.doorX + 180 * open, BED.GY], [BED.doorX + 900 * open, BED.GY + 300], [BED.doorX + 100, BED.GY + 300]], g.fillStyle); g.restore();
    if (open > 0.3) silhouette(g, BED.doorX + 95, BED.GY, 1.75, t, { alpha: clamp((open - 0.3) * 3) });
  });
  FX.dust(g, t, { count: 40, color: SLAB, a: 0.3 * open, area: [0, 100, 900, 900] });
} });
// ---------- s70: Jeff turns his head — "Who the hell are you? …" ----------
registerShot('s70', { draw(g, t, info) {
  const G = gT('s70', t);
  g.fillStyle = '#04060c'; g.fillRect(0, 0, E.W, E.H);
  g.fillStyle = '#2a3460'; g.beginPath(); g.ellipse(E.W * 0.6, E.H * 0.9, 1100, 340, 0, 0, Math.PI * 2); g.fill();
  const turn = ease.inOut(prog(t, 0, 0.6)), r = 330 + t * 6;
  bigFace(g, E.W * 0.58, E.H * 0.6, r, { outfit: J, expr: 'groggy', talk: mouth('JEFF', G), tilt: lerp(-0.35, -0.12, turn), rimColor: SLAB, rimSide: -1, look: [-0.8, 0], face: { lid: 0.62, bags: 1 } });
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = linGrad(g, 0, 0, E.W, 0, [alpha(SLAB, 0.2), alpha(SLAB, 0)]); g.fillRect(0, 0, E.W, E.H); g.restore();
} });
// ---------- s71: the silhouette stands still… "I was like that yesterday, Jeff." ----------
registerShot('s71', { draw(g, t, info) {
  const G = gT('s71', t), cam = { ...focus(BED.doorX + 95, 560, lerp(2.5, 2.7, t / info.dur), 0.7), r: -0.02 };
  bedroom(g, t, cam, { dark: 0.9, door: 1, moon: 1 });
  layer(g, cam, 0.7, (g) => { silhouette(g, BED.doorX + 95, BED.GY, 1.75, t, { pose: breathe(POSES.stand, t, 0.2) }); if (mouth('STRANGER', G) > 0) FX.rings(g, BED.doorX + 100, BED.GY - 360, t, { count: 2, r0: 40, r1: 120, color: COLDR, a: 0.25, speed: 1, w: 2 }); });
} });
// ---------- s72: Jeff sits up — "Who the hell are you?" ----------
registerShot('s72', { draw(g, t, info) {
  const G = gT('s72', t), cam = focus(1150, 640, 2.0, 1), up = ease.out(prog(t, 0, 0.5));
  bedroom(g, t, cam, { dark: 0.85, door: 1, moon: 1 });
  layer(g, cam, 1, (g) => { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha(SLAB, 0.12); poly(g, [[-600, 300], [1500, 650], [1500, 900], [-600, 900]], g.fillStyle); g.restore();
    drawFigure(g, { x: 1120, y: BED.matY + 30 + 72 * 1.7 - 22 * 1.7, s: 1.7, facing: -1, rot: lerp(-1.3, -0.15, up), outfit: J, pose: blendPose(P.lieRest, P.sitBed, up), expr: 'scared', talk: mouth('JEFF', G), face: { lid: 0.3, bags: 1 }, look: [-1, 0], rim: { color: SLAB, dir: [-1, -0.2], w: 5 }, shadow: false }); });
} });
// ---------- s73: the stranger steps into the light — "I am you." … "And you're in trouble." ----------
registerShot('s73', { draw(g, t, info) {
  const G = gT('s73', t), step = ease.inOut(prog(t, 0.2, 0.9)), push = ease.inOut(prog(t, 0.9, info.dur));
  g.fillStyle = '#020309'; g.fillRect(0, 0, E.W, E.H);
  glow(g, E.W * 0.5, E.H * 0.35, 900, SLAB, 0.18 * step);
  const r = lerp(250, 360, step) + push * 90;
  bigFace(g, E.W / 2, E.H * 0.62 + (1 - step) * 60, r, { outfit: STRANGER, expr: 'calm', talk: mouth('STRANGER', G), rimColor: COLDR, rimSide: -1, look: [0, 0], face: { lid: 0.28, mouth: 'smallFlat' }, headColor: '#05070e', featureColor: mix('#07080d', '#e8f0ff', step), blink: false });
  // cold light falls across half the face
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = linGrad(g, 0, 0, E.W, 0, [alpha(SLAB, 0.0), alpha(SLAB, 0.07), alpha(SLAB, 0)]); g.fillRect(0, 0, E.W, E.H); g.restore();
  FX.dust(g, t, { count: 24, color: SLAB, a: 0.2, speed: 4 });
} });
// ---------- s74 / s75: black, silence — TO BE CONTINUED… ----------
registerShot('s74', { draw(g, t) { g.fillStyle = '#000'; g.fillRect(0, 0, E.W, E.H); } });
registerShot('s75', { draw(g, t, info) {
  g.fillStyle = '#000'; g.fillRect(0, 0, E.W, E.H);
  const a = clamp(prog(t, 0.6, 1.8)) * (1 - prog(t, info.dur - 0.8, info.dur)), fl = 0.88 + 0.12 * Math.sin(t * 19) * Math.sin(t * 5);
  const dots = Math.min(3, Math.floor(Math.max(0, t - 1.6) * 2.2));
  letterText(g, 'TO BE CONTINUED' + '.'.repeat(dots), E.W / 2, E.H / 2, 72, { a: a * fl, spacing: 16, glowColor: alpha(COLDR, 0.6) });
} });
