// shots/08_night2.js — SCENE 08: the second night. Straight to bed in his work clothes, the phone again,
// the clock montage, asleep with the phone still playing, the alarm that rings and rings.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, shake, alpha, shade, mix, seg, circle, rr, poly, linGrad, glow, text, FONTS } from '/engine/core.js';
import { drawFigure, bigFace, POSES, blendPose, breathe, walkPose } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bedroom, bedClock, heldPhone, rigPt, BED } from '../sets/bedroom.js';
import { P, PHONE, blinkAt, gT, vid, chrome, phoneBody, logo, wordmark, ledClock } from '../_kit.js';
import { jeff } from '../cast.js';
import { jeffInBed } from './01_world.js';
import { focus, videoPanel } from './02_scroll.js';

const J = jeff(0.9), ALARM = '#ff4a3a';
// ---------- s59: the door, the bag, face-first onto the bed ----------
registerShot('s59', { draw(g, t, info) {
  const cam = { z: 1.22, x: -60, y: 20 };
  const { GY } = bedroom(g, t, cam, { lamp: 0, dark: 0.35, door: t < 2.6 ? 1 - ease.inOut(prog(t, 2.2, 2.6)) : 0 });
  const walk = clamp(prog(t, 0.3, 1.9)), x = lerp(120, 820, ease.inOut(walk)), fall = ease.in(prog(t, 1.9, 2.3)), bounce = t > 2.3 ? Math.abs(Math.sin((t - 2.3) * 10)) * 18 * (1 - prog(t, 2.3, 3.0)) : 0;
  layer(g, cam, 1, (g) => {
    if (t > 1.2) { const bk = ease.in(prog(t, 1.2, 1.45)); rr(g, 560, GY - 70 + (1 - bk) * -120, 110, 70, 8); g.fillStyle = '#4a3a33'; g.fill(); }
    if (fall < 0.01) drawFigure(g, { x, y: GY, s: 1.7, facing: 1, outfit: J, pose: walkPose(t * 2 * Math.PI * 0.8, { stride: 16, lift: 5, lean: 12, arm: 5 }), expr: 'exhausted', face: { lid: 0.78, bags: 1 }, prop: t < 1.2 ? { type: 'paper' } : null, rim: { color: '#bcd6ff', dir: [-0.8, -0.4], w: 4 } });
    else drawFigure(g, { x: lerp(820, 960, fall), y: lerp(GY, BED.matY + 150 - bounce, fall), s: 1.7, facing: 1, rot: lerp(0, Math.PI / 2, fall), outfit: J, pose: blendPose(POSES.stand, POSES.dive, fall), expr: 'sleepy', rim: { color: '#bcd6ff', dir: [0, -1], w: 4 }, shadow: false });
  });
  bedClock(g, cam, '7:42 PM');
  if (t > 2.3 && t < 2.6) FX.rings(g, 1100, 700, t - 2.3, { count: 2, r0: 30, r1: 200, color: '#ffffff', a: 0.5, speed: 2, w: 3 });
} });
// ---------- s60: the hand finds the phone — Instickram again ----------
registerShot('s60', { draw(g, t, info) {
  blurLayer(g, 12, (g) => bedroom(g, t, focus(1300, 650, 2.2, 0.7), { dark: 0.6 })); veil(g, '#04050c', 0.5);
  const lift = ease.out(prog(t, 0, 0.6));
  g.save(); g.translate(E.W * 0.55, E.H * 0.55 + (1 - lift) * 300); g.rotate(-0.12);
  const pw = 360, ph = pw * 16 / 9;
  phoneBody(g, -pw / 2, -ph / 2, pw, ph, (g, x, y, w, h) => { g.fillStyle = '#05060c'; g.fillRect(x, y, w, h); const a = ease.outBack(prog(t, 0.6, 0.9)), f = prog(t, 1.3, 1.7); if (f < 1) { logo(g, 0, -30, 1.3 * a, t, 1 - f); wordmark(g, -118, 100, 52, (1 - f) * clamp((t - 0.8) / 0.2)); } if (f > 0) { g.globalAlpha = f; vid(g, 'dance', t, x, y, w, h); chrome(g, x, y, w, h, t, { user: 'stickmoves', progress: 0.1 }); g.globalAlpha = 1; } }, { edge: alpha(PHONE, 0.5) });
  // fingers around the phone
  for (const [dx, dy] of [[-pw / 2 - 10, 40], [-pw / 2 - 12, 110], [pw / 2 + 8, 70]]) { g.fillStyle = '#0e0b12'; g.beginPath(); g.ellipse(dx, dy, 26, 40, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
  glow(g, E.W * 0.55, E.H * 0.5, 600, PHONE, 0.25 * lift);
  blurLayer(g, 8, (g) => { g.fillStyle = '#e4e2ea'; g.beginPath(); g.ellipse(E.W * 0.12, E.H * 1.1, 560, 300, 0.2, 0, Math.PI * 2); g.fill(); seg(g, [[E.W * 0.2, E.H * 0.95], [E.W * 0.3, E.H * 1.2]], 60, '#d64a33'); });
} });
// ---------- s61–s64: the montage — video, face, clock; faster, darker ----------
const MONT = { s61: ['chairs', '10:30 PM', 0.3], s62: ['cat', '11:45 PM', 0.55], s63: ['mud', '12:30 AM', 0.75], s64: ['dance', '1:30 AM', 0.95] };
for (const [id, [kind, clock, f]] of Object.entries(MONT)) registerShot(id, { draw(g, t, info) {
  const d = info.dur, a = d * 0.38, b = d * 0.7;
  if (t < a) { g.fillStyle = '#03040a'; g.fillRect(0, 0, E.W, E.H); videoPanel(g, t, kind, t + 1.5, { user: 'for.you', caption: '', progress: (t / a) * 0.8 }); veil(g, '#0a0e2a', 0.2 + f * 0.25, 'multiply'); }
  else if (t < b) {
    g.fillStyle = '#04050c'; g.fillRect(0, 0, E.W, E.H);
    const r = 320 + f * 60 + (t - a) * 40;
    bigFace(g, E.W / 2, E.H * 0.62, r, { outfit: jeff(0.6 + f * 0.4), expr: 'tired', face: { lid: 0.3 + f * 0.45, bags: 0.4 + f * 0.6, mouth: f > 0.6 ? 'wavy' : 'flat' }, rimColor: PHONE, rimSide: 1, look: [0, 0.4] });
    for (const sx of [-1, 1]) { const ex = E.W / 2 + sx * r * 0.34, ey = E.H * 0.62 - r * 0.16; rr(g, ex - r * 0.03, ey - r * 0.03, r * 0.06, r * 0.08, 3); g.fillStyle = alpha(['#ff4fa3', '#5ff2e8', '#ffe14a'][Math.floor(t * 6) % 3], 0.8); g.fill(); }
    glow(g, E.W / 2, E.H * 1.05, 800, PHONE, 0.3 + 0.1 * Math.sin(t * 13));
  } else {
    blurLayer(g, 10, (g) => bedroom(g, t, focus(BED.clockX - 200, BED.clockY, 2.6, 0.7), { dark: 0.6 + f * 0.3, moon: f }));
    const s = lerp(1.6, 1.75, (t - b) / (d - b)); ledClock(g, E.W / 2, E.H / 2, s, clock);
  }
} });
// ---------- s65: asleep, the phone still playing on his chest ----------
registerShot('s65', { draw(g, t, info) {
  const cam = focus(1250, 680, lerp(2.2, 2.6, ease.inOut(t / info.dur)), 1), close = ease.inOut(prog(t, 0, 0.8));
  bedroom(g, t, cam, { dark: 0.85, moon: 1 });
  const col = ['#ff4fa3', '#5ff2e8', '#ffe14a', '#9fe3ff'][Math.floor(t * 3) % 4];
  const pose = blendPose(P.lieHold, { ...P.lieRest, hF: [44, -150], eF: [24, -140] }, close);
  const j = jeffInBed(g, t, cam, { work: true, mess: 0.95, pose, expr: close > 0.6 ? 'sleepy' : 'tired', face: { lid: lerp(0.6, 1, close), bags: 1 }, blanket: false, phone: false, rimC: col });
  layer(g, cam, 1, (g) => { heldPhone(g, j.hand[0], j.hand[1] - 12, -0.3 - close * 1.0, { on: 1, col }); glow(g, j.head[0], j.head[1], 160, col, 0.25 + 0.1 * Math.sin(t * 9)); });
  bedClock(g, cam, '2:47 AM');
  if (t > 1.5) layer(g, cam, 1, (g) => FX.rings(g, j.hand[0], j.hand[1] - 30, t, { count: 2, r0: 10, r1: 70, color: col, a: 0.35, speed: 1.2, w: 2 }));
} });
// ---------- s66: the alarm rings and rings; each ring the frame tightens ----------
registerShot('s66', { draw(g, t, info) {
  const ring = t < 1.3 ? 0 : t < 3.0 ? 1 : 2, ringing = (t < 1.3) || (t > 1.7 && t < 3.0) || (t > 3.4 && t < 4.8), off = t > 5.0;
  const z = [2.0, 2.45, 3.0][ring] + (t > 5 ? (t - 5) * 0.05 : 0), [sx, sy] = ringing ? shake(t, 2 + ring * 2, 30) : [0, 0];
  const cam = { ...focus(1330 + sx, 690 + sy, z, 1), r: ring * 0.012 };
  bedroom(g, t, cam, { dark: 0.7, dawn: 0.25 });
  const slap = Math.sin(clamp(prog(t, 4.6, 5.0)) * Math.PI), back = ease.inOut(prog(t, 5.0, 5.8));
  const pose = slap > 0 ? { ...P.lieReach, hF: [lerp(-30, 20, slap), -280] } : P.lieRest;
  const j = jeffInBed(g, t, cam, { work: true, mess: 1, pose, expr: off ? 'sleepy' : 'exhausted', face: { lid: off ? 1 : lerp(0.75, 0.85, ring / 2), bags: 1 }, blanket: false, phone: false, rimC: ringing ? ALARM : '#5a6aa0' });
  layer(g, cam, 1, (g) => { const px = BED.stand - 70, py = BED.GY - 196; g.save(); g.translate(px + (ringing ? Math.sin(t * 60) * 2 : 0), py); rr(g, -36, -5, 72, 10, 3); g.fillStyle = '#07080d'; g.fill(); if (!off) { g.fillStyle = ALARM; g.fillRect(-32, -7, 64, 3); } g.restore(); if (ringing) { glow(g, px, py, 280, ALARM, 0.35); FX.rings(g, px, py, t, { count: 3, r0: 20, r1: 200 + ring * 60, color: ALARM, a: 0.45, speed: 1.6, w: 3 }); } });
  bedClock(g, cam, '4:30 AM', { color: ALARM });
  if (off) veil(g, '#000', 0.25 * prog(t, 5.0, 6.8));
} });
