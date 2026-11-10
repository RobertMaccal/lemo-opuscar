// shots/01_corridor.js — cold open: the doors bang open, the stretcher races in, the doctor sprints.
import { E, V, ease, prog, key, clamp, lerp, shake, talkAmount, wordTime, layer, alpha } from '/engine/core.js';
import { drawFigure, POSES, walkPose, breathe, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { corridor } from '../sets/hospital.js';
import { reg, gurney, drawDoc, drawNurse, satireLabel, talkRings, PZ } from '../lib.js';
import { MEDIC } from '../cast.js';

const label = (g, t, info) => satireLabel(g, clamp(Math.min((info.globalT - 0.15) / 0.3, (3.5 - info.globalT) / 0.4)));

// the stretcher team: paramedic pushing at the back, nurse running alongside (talking)
function team(g, t, gt, sx, GY, s, M, o = {}) {
  const run = gt * 2 * Math.PI * 1.55, rim = { color: M.rim, dir: [0, -1], w: 4 };
  const len = 520 * s;
  drawNurse(g, { x: sx + 70 * s, y: GY - 40 * s, s: s * 1.02, facing: 1, pose: walkPose(run + 1.2, { run: true }), expr: o.nurseExpr || 'angry', talk: talkAmount(gt, 0.5, 3.4), rim, blink: gt % 3.1 > 3.0 });
  const hp = headPos({ x: sx + 70 * s, y: GY - 40 * s, s: s * 1.02, facing: 1, pose: walkPose(run + 1.2, { run: true }) });
  talkRings(g, hp[0] + 30 * s, hp[1], gt, talkAmount(gt, 0.5, 3.4));
  const wheel = (gt * 700 * s) / (10 * s);
  gurney(g, sx, GY + 30 * s, s, gt, { wheel, patient: { rim: { color: M.rim, dir: [0, -1], w: 3 } } });
  drawFigure(g, { x: sx - len / 2 - 60 * s, y: GY + 40 * s, s: s * 1.05, facing: 1, outfit: MEDIC, pose: PZ.push(run), expr: 'determined', rim });
}

// s01 — doors bang open, stretcher bursts through
reg('s01', (g, t, info) => {
  const bang = 0.06, k = ease.out(prog(t, bang, bang + 0.22)), sw = Math.sin(prog(t, bang + 0.22, 1.2) * Math.PI * 2.5) * 0.12 * (1 - prog(t, bang + 0.22, 1.4));
  const doorsX = 300, [shx, shy] = shake(t, 14 * (1 - prog(t, bang, bang + 0.5)), 26, 2);
  const cam = { z: 1.22 + 0.06 * ease.inOut(t / info.dur), x: lerp(-150, 230, ease.inOut(t / info.dur)) + shx, y: 120 + shy };
  const { GY, M } = corridor(g, t, cam, { doorsX, doorOpen: clamp(k - sw) });
  const s = 1.0, sx = lerp(doorsX - 40, doorsX + 640, ease.out(prog(t, bang, 2.6)));
  layer(g, cam, 1, (g) => {
    g.save(); g.beginPath(); g.rect(doorsX - 230, -E.H, 5000, E.H * 3); g.clip();   // emerging through the doorway
    team(g, t, info.globalT, sx, GY, s, M);
    g.restore();
  });
  FX.dust(g, t, { count: 40, color: '#dff1ff', a: 0.3 });
  FX.lensStreak(g, E.W / 2, E.H * 0.3, E.W * 1.4, '#dff1ff', 0.18 * k);
}, { label });

// s02 — tracking alongside the racing stretcher
reg('s02', (g, t, info) => {
  const gt = info.globalT, s = 1.0, sx = 900 + t * 760;
  const cam = { z: 1.42, x: sx - E.W / 2 + 40 + Math.sin(t * 9) * 4, y: 130 + Math.abs(Math.sin(t * 10)) * 5 };
  const { GY, M } = corridor(g, t, cam, {});
  layer(g, cam, 1, (g) => team(g, t, gt, sx, GY, s, M));
  FX.speedLines(g, t, { cx: E.W * 0.9, cy: E.H * 0.5, count: 26, a: 0.12, inner: 420 });
  FX.dust(g, t, { count: 30, color: '#dff1ff', a: 0.25, speed: -60 });
}, { label });

// s03 — the doctor sprints toward the bay
reg('s03', (g, t, info) => {
  const gt = info.globalT, s = 1.45, dx = 200 + t * 560;
  const cam = { z: 1.25 + 0.06 * ease.inOut(t / info.dur), x: dx - E.W / 2 + 90, y: 70 + Math.abs(Math.sin(t * 11)) * 6 };
  const { GY, M } = corridor(g, t + 3, cam, {});
  const run = gt * 2 * Math.PI * 1.6;
  const gotThis = wordTime("I've", 5.4) ?? 5.6;
  let pose = walkPose(run, { run: true });
  if (gt > gotThis - 0.1) { const kk = clamp((gt - gotThis + 0.1) / 0.18); pose = { ...pose, eF: [lerp(pose.eF[0], 26, kk), lerp(pose.eF[1], -150, kk)], hF: [lerp(pose.hF[0], 40, kk), lerp(pose.hF[1], -190, kk)] }; }
  const talk = talkAmount(gt, 3.6, 6.4), expr = gt > gotThis ? 'joy' : gt > 4.5 ? 'determined' : 'smile';
  layer(g, cam, 1, (g) => {
    drawDoc(g, { x: dx, y: GY + 30, s, facing: 1, pose, expr, talk, rim: { color: M.rim, dir: [0, -1], w: 4.5 }, trail: { count: 3, dx: -36, a: 0.16 } });
    const hp = headPos({ x: dx, y: GY + 30, s, facing: 1, pose }); talkRings(g, hp[0] + 40, hp[1], gt, talk);
    if (gt > gotThis) FX.sparkle(g, dx + 60 * s, GY + 30 - 196 * s, 26, '#ffffff', 0.9 * clamp((gt - gotThis) / 0.2));
  });
  FX.speedLines(g, t, { cx: E.W * 0.85, cy: E.H * 0.45, count: 20, a: 0.1, inner: 380 });
  FX.dust(g, t, { count: 30, color: '#dff1ff', a: 0.25 });
});
