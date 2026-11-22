// shots/07_evening.js — SCENE 07: lunch alone, the afternoon drains away, the day ends.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, alpha, shade, mix, seg, circle, rr, poly, linGrad, glow, text, FONTS } from '/engine/core.js';
import { drawFigure, POSES, blendPose, breathe, walkPose, posesAt } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { office, deskUnit, monitor, cafeteria, longTable, OFFICE } from '../sets/office.js';
import { P, blinkAt, gT } from '../_kit.js';
import { jeff, MARK, DANA, LEO, SAM, PRIYA } from '../cast.js';

const J = jeff(0.8), RIM = '#dfe6f0';
// ---------- s55: the microwave hums, beeps ----------
registerShot('s55', { draw(g, t, info) {
  const cam = { z: 2.0, x: -420, y: 100 }, left = Math.max(0, 12 - Math.floor(t * 5.5));
  const { GY } = cafeteria(g, t, cam, { micro: t < 2.2, microT: `0:${String(left).padStart(2, '0')}` });
  layer(g, cam, 0.5, (g) => drawFigure(g, { x: 640, y: GY, s: 1.5, facing: -1, outfit: J, pose: breathe(P.slouchStand, t, 0.5), expr: 'exhausted', face: { lid: 0.72, bags: 1 }, look: [-1, -0.2], rim: { color: '#ffe0a0', dir: [-0.8, -0.4], w: 4 } }));
  if (t > 2.2 && t < 2.6) layer(g, cam, 0.5, (g) => FX.rings(g, 410, 495, t - 2.2, { count: 2, r0: 20, r1: 120, color: '#5fd39a', a: 0.6, speed: 2, w: 3 }));
} });
// ---------- s56: wide pull back — he eats alone ----------
registerShot('s56', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), cam = { z: lerp(2.1, 1.05, k), x: lerp(-260, 0, k), y: lerp(140, 20, k) };
  const { GY } = cafeteria(g, t, cam, {});
  blurLayer(g, 5 * (1 - k * 0.6), (g) => layer(g, { ...cam }, 0.75, (g) => {   // the chatter at the other table (far)
    const top = longTable(g, 1050, GY - 60, 600, 0.9);
    [[1110, MARK, 1], [1260, DANA, -1], [1420, LEO, 1], [1560, SAM, -1]].forEach(([x, who, f], i) => drawFigure(g, { x, y: GY - 60, s: 1.15, facing: f, outfit: who, pose: breathe(posesAt((t + i) % 3, [[0, POSES.sit], [1, P.eat], [2, POSES.sitBack]]), t, 1, i), expr: i % 2 ? 'laugh' : 'happy', talk: Math.max(0, Math.sin(t * 8 + i * 2)) * 0.7, rim: { color: '#ffe0a0', dir: [0, -1], w: 3 } }));
  }));
  layer(g, cam, 1, (g) => {
    const top = longTable(g, 200, GY, 760, 1.2), eat = Math.max(0, Math.sin(t * 2.4)) ;
    drawFigure(g, { x: 340, y: GY, s: 1.45, facing: 1, outfit: J, pose: blendPose(POSES.sit, P.eat, eat * 0.8), expr: 'exhausted', face: { lid: 0.72, bags: 1 }, rim: { color: RIM, dir: [0, -1], w: 4 } });
    rr(g, 430, top - 18, 90, 18, 6); g.fillStyle = '#e8e2d6'; g.fill(); g.fillStyle = '#c8894a'; g.fillRect(442, top - 26, 66, 10);
    for (let i = 0; i < 5; i++) { FX.chair(g, 520 + i * 100, GY, 1.1, '#3a3632'); }
  });
} });
// ---------- s57: the afternoon drains — clock 1 → 6, sunset, desks empty around him ----------
registerShot('s57', { draw(g, t, info) {
  const k = ease.inOut(prog(t, 0.1, info.dur - 0.2)), h = lerp(13, 18.2, k), cam = { z: 1.15, x: 0, y: 20 };
  const { GY } = office(g, t, cam, { hours: h, sec: (t * 900) % 60, sun: clamp(k * 1.3), dusk: clamp((k - 0.75) * 2) });
  const gone = (i) => 1 - clamp((k - 0.15 - i * 0.15) * 5);
  layer(g, cam, 0.8, (g) => { [[220, DANA, 1], [700, SAM, 4], [1460, LEO, 3]].forEach(([x, who, sd], i) => deskUnit(g, x, GY - 50, 1.05, gone(i) > 0.02 ? who : null, t * 4, { seed: sd, alpha: gone(i), monitorOn: gone(i) > 0.5 ? 1 : 0, rim: '#ffc890' })); });
  layer(g, cam, 1, (g) => deskUnit(g, 960, GY, 1.35, J, t, { pose: P.sitDesk, expr: 'exhausted', rim: k > 0.3 ? '#ffc890' : RIM }));
  FX.dust(g, t * 3, { count: 40, color: '#ffd8a8', a: 0.3 * clamp(k * 2) });
} });
// ---------- s58: monitor off, the bag, out the door — sunset to blue ----------
registerShot('s58', { draw(g, t, info) {
  const cam = { z: 1.2, x: 60 + t * 40, y: 30 }, dusk = lerp(0.55, 1, t / info.dur);
  const { GY } = office(g, t, cam, { hours: 18.3, sun: 1, dusk });
  layer(g, cam, 1, (g) => {
    const up = ease.inOut(prog(t, 0.6, 1.1)), walking = t > 1.1, x = 900 + Math.max(0, t - 1.1) * 210;
    deskUnit(g, 1000, GY, 1.35, null, t, { monitorOn: t < 0.45 ? 1 : 0 });
    drawFigure(g, { x: walking ? x : 860, y: GY, s: 1.5, facing: 1, outfit: J, pose: walking ? walkPose((t - 1.1) * 2 * Math.PI * 0.72, { stride: 15, lift: 5, lean: 11, arm: 5 }) : blendPose(P.sitDesk, P.carryBag, up), expr: 'exhausted', face: { lid: 0.75, bags: 1 }, prop: t > 0.9 ? { type: 'paper' } : null, rim: { color: mix('#ffc890', '#8fa6d8', dusk), dir: [-0.7, -0.6], w: 4 } });
  });
} });
