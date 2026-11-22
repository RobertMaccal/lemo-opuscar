// shots/03_morning.js — SCENE 03: 4:30 AM. The alarm, one puffy eye, the slap, the zombie sit-up, the bathroom.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, shake, alpha, shade, mix, seg, circle, ring, rr, poly, linGrad, radGrad, glow, text, FONTS } from '/engine/core.js';
import { drawFigure, bigFace, POSES, blendPose, breathe } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bedroom, bedClock, blanket, heldPhone, rigPt, BED } from '../sets/bedroom.js';
import { bath, flick, BATH } from '../sets/bath.js';
import { P, PHONE, FLUO, mouth, blinkAt, gT, ledClock, phoneBody } from '../_kit.js';
import { jeffHome } from '../cast.js';
import { jeffInBed } from './01_world.js';
import { focus } from './02_scroll.js';

const ALARM = '#ff4a3a';
const pulse = (t, r = 3.2) => 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * r);
// the alarm screen of the phone
function alarmScreen(g, x, y, w, h, t, on = 1) {
  g.fillStyle = linGrad(g, 0, y, 0, y + h, [mix('#2a0c14', '#5a1420', pulse(t) * on), '#0a0408']); g.fillRect(x, y, w, h);
  const k = w / 400;
  text(g, '4:30', x + w / 2, y + h * 0.3, { size: 150 * k, font: FONTS.ui, weight: 900, color: '#ffffff', glow: 30 * on, glowColor: alpha(ALARM, 0.8) });
  text(g, 'AM  ·  ALARM', x + w / 2, y + h * 0.3 + 110 * k, { size: 30 * k, font: FONTS.ui, weight: 900, color: alpha('#ffd8d0', 0.9), spacing: 6 });
  rr(g, x + w * 0.12, y + h * 0.76, w * 0.76, 90 * k, 45 * k); g.fillStyle = 'rgba(255,255,255,.15)'; g.fill();
  circle(g, x + w * 0.12 + 45 * k, y + h * 0.76 + 45 * k, 36 * k, '#ffffff'); text(g, 'slide to stop', x + w * 0.56, y + h * 0.76 + 46 * k, { size: 28 * k, font: FONTS.ui, weight: 800, color: 'rgba(255,255,255,.8)' });
  for (let i = 0; i < 3; i++) FX.rings(g, x + w / 2, y + h * 0.3, t + i * 0.2, { count: 1, r0: 120 * k, r1: 360 * k, color: ALARM, a: 0.35 * on, speed: 1.8, w: 4 });
}

// ---------- s23: SMASH — the phone alarm 4:30 buzzing across the nightstand ----------
registerShot('s23', { draw(g, t, info) {
  const [sx, sy] = shake(t, 9, 28, 4), drift = t * 14;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#120c14', '#05040a']); g.fillRect(0, 0, E.W, E.H);
  // nightstand top, wood grain, the alarm light on it
  g.fillStyle = '#1a1420'; g.fillRect(0, E.H * 0.56, E.W, E.H); g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, E.H * 0.6 + i * 46); g.bezierCurveTo(600, E.H * 0.6 + i * 46 + 20, 1300, E.H * 0.6 + i * 46 - 20, E.W, E.H * 0.6 + i * 46); g.stroke(); }
  glow(g, E.W / 2, E.H * 0.6, 900, ALARM, 0.22 + 0.2 * pulse(t));
  g.save(); g.translate(E.W / 2 + sx + drift, E.H * 0.53 + sy); g.rotate(-0.08 + Math.sin(t * 50) * 0.02 + t * 0.02);
  const pw = 420, ph = 760; g.save(); g.translate(0, 0); g.scale(1, 0.62); phoneBody(g, -pw / 2, -ph / 2, pw, ph, (g, x, y, w, h) => alarmScreen(g, x, y, w, h, t)); g.restore();
  g.restore();
  for (const s2 of [-1, 1]) for (let i = 0; i < 3; i++) seg(g, [[E.W / 2 + s2 * (300 + i * 30) + drift, E.H * 0.42 + i * 40], [E.W / 2 + s2 * (340 + i * 30) + drift, E.H * 0.42 + i * 40 - 10]], 5, alpha('#ffd0c8', 0.5 * pulse(t, 6)));
} });

// ---------- s24: giant face sideways on the pillow — one puffy eye opens ----------
registerShot('s24', { draw(g, t, info) {
  const r = 400, cx = E.W * 0.5, cy = E.H * 0.56, tilt = -0.42;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#121a30', '#0a0e1c']); g.fillRect(0, 0, E.W, E.H);
  // pillow + sheet
  g.fillStyle = '#9aa4c8'; g.beginPath(); g.ellipse(cx - 60, cy + 40, 980, 360, -0.03, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#7a86b0'; g.beginPath(); g.ellipse(cx - 60, cy + 380, 1300, 240, 0, 0, Math.PI * 2); g.fill();
  const open = ease.out(prog(t, 0.9, 1.6)), wob = Math.sin(t * 3) * 0.01;
  bigFace(g, cx, cy, r, { outfit: jeffHome(0.35), expr: 'exhausted', tilt: tilt + wob, rimColor: alpha(ALARM, 0.9), rimSide: 1, face: { lid: lerp(1, 0.58, open), bags: 1, mouth: 'wavy', brows: 'confused' } });
  // the other eye stays shut (pressed into the pillow): paint it over
  g.save(); g.translate(cx, cy); g.rotate(tilt + wob); const ex = -r * 0.34, ey = -r * 0.16; circle(g, ex, ey, r * 0.24, '#0e0b12'); seg(g, [[ex - r * 0.13, ey + r * 0.02], [ex + r * 0.13, ey + r * 0.02]], r * 0.05, '#f4efe6');
  g.strokeStyle = alpha('#9a8fc8', 0.7); g.lineWidth = r * 0.04; g.beginPath(); g.arc(ex, ey + r * 0.04, r * 0.18, 0.5, Math.PI - 0.5); g.stroke(); g.restore();
  glow(g, E.W * 0.95, E.H * 0.3, 700, ALARM, 0.18 + 0.18 * pulse(t));
  if (t > 1.6 && t < 2.6) for (const k of [0, 1]) { const tt = (t - 1.6 - k * 0.25); if (tt > 0) seg(g, [[cx + 300, cy - 300 - tt * 40], [cx + 330, cy - 330 - tt * 40]], 6, alpha('#f4efe6', 0.6 * (1 - tt))); }
} });

// ---------- s25: the arm slaps the nightstand twice, finds the phone ----------
registerShot('s25', { draw(g, t, info) {
  const cam = focus(1480, 660, 2.35, 1), off = t > 2.1;
  bedroom(g, t, cam, { lamp: 0, dark: 0.5, dawn: 0.15 });
  const slap = (a, b) => Math.sin(clamp(prog(t, a, b)) * Math.PI);
  const s1 = slap(0.35, 0.75), s2 = slap(0.95, 1.35), grab = ease.inOut(prog(t, 1.6, 2.1)), back = ease.inOut(prog(t, 2.2, 2.9));
  const hx = lerp(lerp(-40, 30, s1 + s2), 10, grab) * (1 - back) + -10 * back, hy = lerp(-262, -300, grab) * (1 - back) + -220 * back;
  const pose = { ...P.lieReach, eF: [lerp(-26, hx * 0.5, 0.5), -206], hF: [hx, hy] };
  const j = jeffInBed(g, t, cam, { pose, expr: 'exhausted', mess: 0.9, phone: false, rimC: off ? '#5a6aa0' : ALARM, rimDir: [1, -0.2], face: { lid: 0.7 } });
  // the phone on the nightstand (buzzing) until he grabs it
  layer(g, cam, 1, (g) => {
    const [px, py] = grab < 0.95 ? [BED.stand - 70 + Math.sin(t * 60) * 2, BED.GY - 196] : [j.hand[0] + 6, j.hand[1] - 8];
    g.save(); g.translate(px, py); g.rotate(grab > 0.95 ? -0.4 : 0); rr(g, -36, -5, 72, 10, 3); g.fillStyle = '#07080d'; g.fill(); if (!off) { g.fillStyle = ALARM; g.fillRect(-32, -7, 64, 3); } g.restore();
    if (!off) glow(g, px, py, 260, ALARM, 0.3 + 0.25 * pulse(t));
    if (s1 > 0.9 || s2 > 0.9) FX.rings(g, j.hand[0], j.hand[1], (t % 0.4), { count: 2, r0: 10, r1: 80, color: '#ffffff', a: 0.5, speed: 2.5, w: 3 });
  });
  bedClock(g, cam, '4:30 AM', { color: ALARM });
} });

// ---------- s26: wide, cold — the zombie sit-up ----------
registerShot('s26', { draw(g, t, info) {
  const cam = { z: lerp(1.28, 1.36, t / info.dur), x: 150, y: 20 };
  const { GY } = bedroom(g, t, cam, { lamp: 0, dawn: 0.55, dark: 0 });
  const up = ease.inOut(prog(t, 0.2, 1.6)), slump = ease.inOut(prog(t, 1.9, 2.6));
  const s = 1.7, x = 1120, rot = lerp(-1.25, 0, up);
  const pose = blendPose(blendPose(P.lieRest, P.sitBed, up), P.slump, slump);
  layer(g, cam, 1, (g) => drawFigure(g, { x, y: BED.matY + 30 + 72 * s - 22 * s - (1 - up) * 18, s, facing: -1, rot, outfit: jeffHome(0.9), pose: breathe(pose, t, 0.6), expr: 'exhausted', face: { lid: 0.62, bags: 1 }, rim: { color: '#bcd0f0', dir: [-0.8, -0.4], w: 4 }, shadow: false, blink: blinkAt(t, 2.2) }));
  blanket(g, cam, BED.x0 + 40, x - 70, { h: 36, bump: 4, color: '#4a5a8a' });
  bedClock(g, cam, '4:33 AM');
  FX.dust(g, t, { count: 30, color: '#d8e4ff', a: 0.25, speed: 6 });
} });

// ---------- s27: bathroom — the switch, the fluorescent flicker, the squint ----------
registerShot('s27', { draw(g, t, info) {
  const L = flick(t, 0.4), cam = { z: 1.18, x: -120 + t * 6, y: 40 };
  const { GY } = bath(g, t, cam, { light: L, switchOn: t > 0.3 });
  const reach = t < 0.5 ? ease.inOut(prog(t, 0, 0.3)) : 1 - ease.inOut(prog(t, 0.5, 0.9));
  const pose = blendPose(P.slouchStand, { ...P.slouchStand, eF: [30, -170], hF: [62, -168] }, reach);
  layer(g, cam, 1, (g) => drawFigure(g, { x: 400, y: GY, s: 1.9, facing: 1, outfit: jeffHome(1), pose: breathe(pose, t, 0.5), expr: L > 0.5 ? 'exhausted' : 'tired', face: { lid: L > 0.5 ? 0.85 : 0.6, bags: 1, brows: L > 0.5 ? 'angry' : null }, rim: { color: L > 0.1 ? '#e8fff4' : '#3a4a6a', dir: [0.6, -0.8], w: 4 } }));
  if (L === 0) veil(g, '#000', 0.35);
} });

// ---------- s28: the mirror — Jeff and his reflection ----------
registerShot('s28', { draw(g, t, info) {
  const z = lerp(2.0, 2.25, ease.inOut(t / info.dur)), cam = focus(BATH.mirX + BATH.mirW / 2, BATH.mirY + BATH.mirH / 2 + 30, z, 0.8);
  bath(g, t, cam, { light: 1, mirror: (g, x, y, w, h) => {   // the reflection: Jeff, front on, exhausted
    g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#3a4a52', '#1a2226']); g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (let xx = x - 90; xx < x + w; xx += 45) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
    const stare = ease.inOut(prog(t, 1.2, 1.8));
    bigFace(g, x + w * 0.5, y + h * 0.62, w * 0.24, { outfit: jeffHome(1), expr: 'exhausted', face: { lid: lerp(0.62, 0.5, stare), bags: 1, mouth: 'flat' }, rimColor: '#e8fff4', rimSide: -1, blink: blinkAt(t, 2.9, 0.5) });
  } });
  // his own head and shoulder in the foreground, blurred (we look over his shoulder)
  blurLayer(g, 9, (g) => { const hx = E.W * 0.1, hy = E.H * 0.82, r = 260; g.fillStyle = '#c8ccd4'; g.beginPath(); g.ellipse(hx - 80, hy + 420, 460, 320, 0.15, 0, Math.PI * 2); g.fill(); circle(g, hx - 6, hy, r + 8, '#e8fff4'); circle(g, hx, hy, r, '#0a0c12'); });
  veil(g, '#0a1418', 0.08);
} });

// ---------- s29: splash water, twice; still tired ----------
registerShot('s29', { draw(g, t, info) {
  const cam = focus(BATH.sinkX - 120, BATH.sinkY - 120, lerp(1.9, 2.0, t / info.dur), 0.8);
  const { GY } = bath(g, t, cam, { light: 1 });
  const sp = (a) => Math.sin(clamp(prog(t, a, a + 0.5)) * Math.PI), s1 = sp(0.9), s2 = sp(2.1), up = ease.inOut(prog(t, 3.0, 3.6));
  let pose = blendPose(P.bentSink, P.splash, Math.max(s1, s2)); pose = blendPose(pose, P.slouchStand, up);
  // GY is in the 0.8 layer; put the figure on the floor of that layer
  layer(g, cam, 0.8, (g) => {
    drawFigure(g, { x: BATH.sinkX - 230, y: GY, s: 1.9, facing: 1, outfit: jeffHome(1), pose: breathe(pose, t, 0.4), expr: 'exhausted', face: { lid: up > 0.5 ? 0.6 : 0.9, bags: 1 }, blink: t > 3.8 && t < 3.92, rim: { color: '#e8fff4', dir: [0.4, -1], w: 4 } });
    // water from the faucet + splashes
    seg(g, [[BATH.sinkX + 10, BATH.sinkY - 70], [BATH.sinkX + 10, BATH.sinkY]], 5, 'rgba(200,240,255,.6)');
    for (const [a, k] of [[1.15, s1], [2.35, s2]]) if (t > a && t < a + 0.8) { const r = rng(Math.floor(a * 10)), tt = t - a; for (let i = 0; i < 18; i++) { const ang = -Math.PI * (0.1 + r() * 0.8), v = 300 + r() * 400; circle(g, BATH.sinkX - 150 + Math.cos(ang) * v * tt, BATH.sinkY - 230 + Math.sin(ang) * v * tt + 900 * tt * tt, 4 + r() * 5, alpha('#cfefff', 0.8 * (1 - tt / 0.8))); } }
    if (t > 1.2) for (let i = 0; i < 4; i++) { const r = rng(30 + i), dy = ((t - 1.2) * 40 + i * 13) % 60; circle(g, BATH.sinkX - 150 + (r() - 0.5) * 40, BATH.sinkY - 300 + dy, 3, 'rgba(200,240,255,.7)'); }
  });
} });
