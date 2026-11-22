// shots/04_commute.js — SCENE 04: toast, the grey street, the bus stop, the bus, the window and the head drops.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, shake, alpha, shade, mix, seg, circle, ring, rr, poly, linGrad, radGrad, glow, text, FONTS } from '/engine/core.js';
import { drawFigure, bigFace, POSES, blendPose, breathe, walkPose, posesAt, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { kitchen, toaster, street, busStop, bus, busInside, DAWN_RIM } from '../sets/city.js';
import { P, blinkAt, gT } from '../_kit.js';
import { jeff, JOGGER, COFFEE, MUSIC_GUY } from '../cast.js';

const J = jeff(0.8);
const toast = (g, x, y, s = 1, r = 0) => { g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s); rr(g, -18, -16, 36, 32, 8); g.fillStyle = '#c8894a'; g.fill(); rr(g, -13, -11, 26, 22, 6); g.fillStyle = '#e8c08a'; g.fill(); g.restore(); };
const toastInMouth = (g, fig, k = 1) => { const [hx, hy, r] = headPos(fig); toast(g, hx + (fig.facing ?? 1) * r * 0.95, hy + r * 0.45, fig.s * 0.9 * k, 0.3 * (fig.facing ?? 1)); };

// ---------- s30: kitchen — toast pops, grabbed by mouth, door slams ----------
registerShot('s30', { draw(g, t, info) {
  const cam = { z: 1.5, x: 60, y: 60 };
  const { GY, counter } = kitchen(g, t, cam, { door: t > 1.9 && t < 2.25 ? 0.6 : 0 });
  const pop = t < 0.3 ? 0 : ease.outBack(prog(t, 0.3, 0.55)) * (t < 1.0 ? 1 : 0);
  layer(g, cam, 0.8, (g) => toaster(g, 1000, counter, 1.1, pop, t));
  // Jeff swoops in from the right, bites a slice, walks off to the door
  const inK = ease.out(prog(t, 0.55, 0.95)), outK = ease.in(prog(t, 1.15, 2.0)), x = lerp(1600, 1150, inK) + outK * 700, lean = t > 0.75 && t < 1.15;
  const fig = { x, y: GY, s: 1.9, facing: outK > 0 ? 1 : -1, outfit: J, pose: outK > 0 ? walkPose(t * 2 * Math.PI * 2.2, { run: true }) : lean ? POSES.reach : POSES.slouchStand ?? P.slouchStand, expr: 'exhausted', face: { lid: 0.6, bags: 1 }, rim: { color: DAWN_RIM, dir: [-0.8, -0.5], w: 4 } };
  if (!fig.pose) fig.pose = P.slouchStand;
  layer(g, cam, 0.8, (g) => { drawFigure(g, fig); if (t > 0.95) toastInMouth(g, fig); });
  if (t > 2.2) { const [sx, sy] = shake(t, 6 * (1 - prog(t, 2.2, 2.6)), 30); g.translate(sx, sy); }
} });

// ---------- s31: side tracking down the grey street ----------
registerShot('s31', { draw(g, t, info) {
  const sc = t * 300, cam = { z: 1.12, x: 0, y: 20 };
  const { GY } = street(g, t, { ...cam, x: 0 }, { scroll: sc, lamps: 0.6 });
  const fig = { x: E.W * 0.46, y: GY, s: 1.75, facing: 1, outfit: J, pose: walkPose(t * 2 * Math.PI * 0.75, { stride: 20, lift: 6, bob: 4, arm: 8, lean: 9 }), expr: 'exhausted', face: { lid: 0.7, bags: 1 }, blink: blinkAt(t, 1.8), rim: { color: DAWN_RIM, dir: [-0.7, -0.6], w: 4 } };
  layer(g, cam, 1, (g) => { drawFigure(g, fig); toastInMouth(g, fig); });
  // foreground: passing hydrant / bins, blurred
  blurLayer(g, 10, (g) => { const r = rng(4); for (let i = 0; i < 6; i++) { const x = ((i * 900 - sc * 1.6) % 5400 + 5400) % 5400 - 600; rr(g, x, E.H - 260, 120, 300, 20); g.fillStyle = ['#1a2030', '#2a3040'][i % 2]; g.fill(); } });
  FX.dust(g, t, { count: 30, color: '#e8eef8', a: 0.2 });
} });

// ---------- s32: the bus stop — energetic people, Jeff sways ----------
registerShot('s32', { draw(g, t, info) {
  const cam = { z: lerp(1.05, 1.12, ease.inOut(t / info.dur)), x: -30, y: 10 };
  const { GY } = busStop(g, t, cam);
  layer(g, cam, 1, (g) => {
    const jb = Math.abs(Math.sin(t * 6.5));
    drawFigure(g, { x: 640, y: GY - jb * 26, s: 1.55, facing: 1, outfit: JOGGER, pose: blendPose('ready', 'jump', jb * 0.6), expr: 'happy', rim: { color: DAWN_RIM, dir: [-0.7, -0.6], w: 4 } });
    drawFigure(g, { x: 1330, y: GY, s: 1.5, facing: -1, outfit: COFFEE, pose: breathe(POSES.phone, t, 1), prop: { type: 'phone' }, expr: 'smile', talk: Math.max(0, Math.sin(t * 9)) * 0.6, rim: { color: DAWN_RIM, dir: [0.7, -0.6], w: 4 } });
    drawFigure(g, { x: 1180, y: GY, s: 1.5, facing: -1, outfit: MUSIC_GUY, pose: breathe(POSES.relaxed, t * 3, 2.5), expr: 'smile', face: { eyes: 'closed' }, rim: { color: DAWN_RIM, dir: [0.7, -0.6], w: 4 } });
    const sway = Math.sin(t * 1.3) * 0.07 + Math.sin(t * 0.7) * 0.04;
    g.save(); g.translate(960, GY); g.rotate(sway); g.translate(-960, -GY);
    drawFigure(g, { x: 960, y: GY, s: 1.6, facing: 1, outfit: J, pose: breathe(P.slouchStand, t, 0.5), expr: 'exhausted', face: { lid: t % 2.6 > 1.6 ? 0.95 : 0.72, bags: 1 }, rim: { color: DAWN_RIM, dir: [-0.7, -0.6], w: 4 } });
    g.restore();
    if (t > 2) text(g, 'z', 1010 + Math.sin(t * 2) * 10, GY - 330 - (t - 2) * 30, { size: 40, color: alpha('#e8eef8', clamp(1 - (t - 2) / 2)), font: FONTS.title });
  });
} });

// ---------- s33: the bus arrives ----------
registerShot('s33', { draw(g, t, info) {
  const cam = { z: 1.05, x: -30, y: 10 };
  const { GY } = busStop(g, t, cam);
  const k = ease.out(prog(t, 0, 1.7)), bx = lerp(3600, 1720, k), doors = ease.inOut(prog(t, 1.7, 2.3));
  layer(g, cam, 1, (g) => {
    drawFigure(g, { x: 960, y: GY, s: 1.6, facing: 1, outfit: J, pose: breathe(P.slouchStand, t, 0.5), expr: 'exhausted', face: { lid: 0.75, bags: 1 }, rim: { color: DAWN_RIM, dir: [-0.7, -0.6], w: 4 } });
    bus(g, bx, GY + 60, { doors });
  });
  if (k < 1) FX.speedLines(g, t, { cx: bx - 700, cy: GY - 200, count: 20, a: 0.12 * (1 - k) });
} });

// ---------- s34: in the bus by the window — head drops, snaps up, drops, THUNK ----------
registerShot('s34', { draw(g, t, info) {
  const hit = 5.0, after = t > hit;
  const [sx, sy] = after ? shake(t, 12 * (1 - prog(t, hit, hit + 0.4)), 30) : [0, 0];
  const cam = { z: lerp(1.75, 1.95, ease.inOut(t / info.dur)), x: -150 + sx, y: 90 + sy };
  // head track: 0 = upright, 1 = dropped forward, 2 = against the glass
  const d = key(t, [[0, 0], [1.0, 0], [1.6, 1, ease.in], [1.75, 0, ease.outBack], [2.8, 0], [3.6, 1, ease.in], [3.75, 0, ease.outBack], [4.3, 0], [4.95, 1.7, ease.in], [5.05, 2, ease.out], [6.4, 2]]);
  const head = d <= 1 ? [lerp(6, 30, d), lerp(-176, -150, d)] : [lerp(30, 44, d - 1), lerp(-150, -164, d - 1)];
  const pose = { ...P.sitPhone, head, sh: [lerp(2, 10, Math.min(1, d)), -144], hF: [24, -96], eF: [14, -114], hB: [20, -94], eB: [10, -112] };
  const { GY } = busInside(g, t, cam, { reflect: (g, x, y, w, h) => { if (x < 600 && x + w > 600) { g.globalAlpha = 0.16; bigFace(g, 640, 420, 130, { outfit: J, expr: 'exhausted', face: { lid: 0.7 } }); g.globalAlpha = 1; } } });
  layer(g, cam, 0.9, (g) => {
    // seat back + Jeff seated facing left toward the window pillar
    rr(g, 820, GY - 330, 70, 330, 20); g.fillStyle = '#3a4a7a'; g.fill(); rr(g, 640, GY - 120, 260, 40, 14); g.fill();
    seg(g, [[640, 120], [640, GY - 260]], 30, '#1a1d26');   // window pillar the head will hit
    drawFigure(g, { x: 770, y: GY - 48, s: 1.75, facing: -1, outfit: J, pose, expr: d > 0.6 ? 'sleepy' : 'exhausted', face: { lid: d > 0.6 ? 1 : 0.68, bags: 1 }, rim: { color: DAWN_RIM, dir: [-0.8, -0.4], w: 4 }, shadow: false });
    if (after) { const [hx, hy] = [770 - 44 * 1.75, GY - 48 - 164 * 1.75]; FX.rings(g, hx - 20, hy, t - hit, { count: 2, r0: 20, r1: 140, color: '#ffffff', a: 0.6 * (1 - prog(t, hit, hit + 0.8)), speed: 2, w: 3 }); for (let i = 0; i < 3; i++) text(g, '*', hx + 20 + i * 34, hy - 70 - i * 10, { size: 46, color: '#ffe14a', font: FONTS.title, alpha: prog(t, hit, hit + 0.15) * (1 - prog(t, hit + 0.9, hit + 1.3)) }); }
  });
  // a blurred passenger in the foreground for depth
  blurLayer(g, 12, (g) => { circle(g, 1560, 980, 210, '#0e1018'); g.fillStyle = '#4a3a5a'; g.beginPath(); g.ellipse(1560, 1300, 360, 260, 0, 0, Math.PI * 2); g.fill(); });
} });
