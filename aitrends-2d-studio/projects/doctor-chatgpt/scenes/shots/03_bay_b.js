// shots/03_bay_b.js — escalation: alarms, "green means healthy", the screen joke, code blue, the quiet question.
import { E, V, ease, prog, key, clamp, lerp, shake, talkAmount, layer, blurLayer, veil, alpha, mix, seg, circle, ring, glow, rr, text, FONTS } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, walkPose, bigFace, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bay } from '../sets/hospital.js';
import { reg, drawDoc, drawNurse, phone, phoneHands, revealText, monitor, talkRings, toWorld, PZ } from '../lib.js';
import { DOC, NURSE, STAFF, MEDIC, COL } from '../cast.js';
import { DOCX, NURX, bayBg, bigFaceDoc, sweat } from './02_bay_a.js';

const blink = (t, p = 3.1) => t % p > p - 0.12;
const RIM = (M) => ({ color: M.rim, dir: [0, -1], w: 4 });
const HEADX = E.W / 2 - 120;        // where the nurse stands to reach the patient's neck
const pressShout = { ...PZ.press, head: [30, -190], sh: [20, -160], eB: [34, -190], hB: [50, -222] };

// big monitor filling the frame (inserts)
function bigMonitor(g, t, o, z = 1) {
  bayBg(g, t, { z: 1.6, x: 120, y: -200 }, { monitor: o }, 16, 0.6);
  g.save(); g.translate(E.W / 2, E.H * 0.45); g.scale(z, z); g.translate(-E.W / 2, -E.H * 0.45);
  monitor(g, 90, E.H * 0.45 - 340, 900, 680, t, { ...o, arm: false }); g.restore();
}

// s14 — alarm insert
reg('s14', (g, t, info) => {
  const [sx, sy] = shake(t, 6, 20, 3); g.save(); g.translate(sx, sy);
  bigMonitor(g, info.globalT, { mode: 'alarm', hr: 146 + t * 20, spo2: 89, bp: '78/44' }, 1.02 + 0.06 * t);
  g.restore();
});

// s15 — the nurse keeps pressure on the dressing and shouts across
reg('s15', (g, t, info) => {
  const gt = info.globalT, cam = { z: 1.78 + 0.05 * ease.inOut(t / info.dur), x: 70, y: 200 };
  bay(g, gt, cam, {
    monitor: { mode: 'alarm', hr: 152, spo2: 88, bp: '76/42' },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4, talk = talkAmount(gt, 27.9, 30.1);
      drawDoc(g, { x: DOCX, y, s, facing: 1, pose: breathe(PZ.hide, t, 0.6), expr: 'nervous', rim: RIM(M), phone: true, phoneHand: 'B', blink: blink(t) });
      const pose = posesAt(t, [[0, PZ.press], [0.15, pressShout]], 0.2);
      drawNurse(g, { x: NURX - 30, y, s, facing: -1, pose: breathe(pose, t, 1.2, 2), expr: 'angry', talk, look: [-1, -0.2], rim: RIM(M) });
      const hp = headPos({ x: NURX - 30, y, s, facing: -1, pose }); talkRings(g, hp[0] - 30, hp[1], gt, talk);
    },
  });
  glow(g, E.W * 0.85, E.H * 0.2, 500, COL.alarm, 0.12 * (0.5 + 0.5 * Math.sin(t * 12)));
});

// s16 — back turned, hunched, sweating: "ChatGPT! He's getting worse! What now?!"
reg('s16', (g, t, info) => {
  const gt = info.globalT;
  bayBg(g, gt, { z: 1.7, x: 150, y: -40 }, { monitor: { mode: 'alarm', hr: 156, spo2: 86, bp: '74/40' }, chars: (g, c) => drawNurse(g, { x: NURX, y: c.GY + 10, s: 1.4, facing: -1, pose: breathe(PZ.press, t, 1, 2), expr: 'angry', rim: RIM(c.M) }) }, 9, 0.4);
  const s = 4.4, [sx, sy] = shake(t, 4, 14, 2), talk = talkAmount(gt, 30.7, 34.0) * 0.75;
  const o = { x: E.W / 2 + 60 + sx, y: E.H * 0.94 + sy, s, facing: -1, pose: breathe(PZ.hunch, t, 1.2), expr: 'scared', talk, look: [0.5, 0.8], rim: { color: '#bfe9ff', dir: [-0.5, 0.6], w: 5 }, phone: true, blink: blink(t, 2.2) };
  g.save(); const z = 1 + 0.06 * ease.inOut(t / info.dur); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
  drawDoc(g, o); const hp = headPos(o);
  sweat(g, hp[0] + 80, hp[1] - 60, 300, t, 1); sweat(g, hp[0] - 40, hp[1] - 90, 260, t + 0.5, 0.8);
  g.restore();
  glow(g, E.W * 0.9, E.H * 0.25, 520, COL.alarm, 0.1 * (0.5 + 0.5 * Math.sin(t * 12)));
});

// s17 — phone insert: "Try making the monitor green."
reg('s17', (g, t, info) => {
  const gt = info.globalT;
  bayBg(g, gt, { z: 1.4, x: -100, y: 60 }, { monitor: { mode: 'alarm', hr: 158 } }, 16, 0.55);
  const full = 'Try making the monitor green. Green means healthy!', shown = revealText('C2', gt, full);
  const msgs = [{ from: 'bot', text: "Great question! Give him ibuprofen! You're doing amazing!", show: 0.5 }, { from: 'user', text: "He's getting worse! What now?!", show: 1 }, { from: 'bot', text: shown || ' ', show: shown ? 1 : 0, hl: true, tag: gt > 37.3 ? 'Confidence: 100%' : null }];
  const k = ease.out(prog(t, 0, 0.3)), [sx, sy] = shake(t, 3, 12, 4);
  const ph = phone(g, E.W / 2 - 10 + sx, E.H * 0.47 + 30 * (1 - k) + sy, 640, t, msgs, { typing: gt < 34.95 ? 1 : 0, tilt: 0.02, fs: 0.072 });
  phoneHands(g, ph, '#bfe9ff', { shake: [sx, sy] });
  if (gt > 36.0) { const hx = ph.x + ph.w * 0.62, hy = ph.y + ph.h * 0.66; for (let i = 0; i < 4; i++) FX.sparkle(g, hx + Math.cos(i * 1.7 + t * 2) * 90, hy + Math.sin(i * 1.3 + t * 2) * 60, 14, '#7dff9a', 0.7); }
}, { hideBot: true });

// s18 — confused blink... then the idea
reg('s18', (g, t, info) => {
  const gt = info.globalT, idea = 0.4;
  bayBg(g, gt, { z: 1.6, x: -160, y: -80 }, { monitor: { mode: 'alarm', hr: 158 } }, 14, 0.42);
  const r = 320 * (t < idea ? 1 : 1.06);
  bigFaceDoc(g, E.W / 2, E.H * 0.47, r, { expr: t < idea ? 'confused' : 'joy', blink: t > 0.18 && t < 0.28, rimColor: '#bfe9ff', rimSide: 1, tilt: t < idea ? -0.06 : 0.04 });
  if (t > idea) { const k = ease.outBack(prog(t, idea, idea + 0.2)); glow(g, E.W / 2 + r * 0.9, E.H * 0.47 - r * 1.05, 150 * k, '#fff3c0', 0.7); FX.sparkle(g, E.W / 2 + r * 0.9, E.H * 0.47 - r * 1.05, 60 * k, '#ffffff', 1); }
});

// s19 — one tap: DISPLAY THEME -> GREEN (the vitals do not change)
reg('s19', (g, t, info) => {
  const gt = info.globalT, tap = 0.28, green = t > tap;
  bigMonitor(g, gt, { mode: green ? 'green' : 'alarm', hr: 158, spo2: 86, bp: '74/40' }, 1.0 + 0.03 * t);
  const mx = 90, my = E.H * 0.45 - 340, mw = 900, mh = 680;
  // settings strip
  const sy = my + mh + 50; rr(g, mx + 120, sy, mw - 240, 120, 22); g.fillStyle = 'rgba(20,24,34,.92)'; g.fill();
  text(g, 'DISPLAY THEME', mx + 170, sy + 60, { size: 30, color: '#cfe0ff', font: FONTS.ui, weight: 900, align: 'left' });
  for (const [i, c] of [[0, '#ff3b4a'], [1, '#36d96a'], [2, '#3a7bd5']]) { const cx = mx + 560 + i * 90, cy = sy + 60; circle(g, cx, cy, 30, c); if ((green && i === 1) || (!green && i === 0)) ring(g, cx, cy, 38, 5, '#ffffff'); }
  // the finger
  const fx = mx + 650, fy = sy + 60, k = t < tap ? ease.out(prog(t, 0, tap)) : 1 - 0.3 * ease.out(prog(t, tap, tap + 0.25));
  const tipX = lerp(E.W + 200, fx, k), tipY = lerp(E.H + 200, fy + 10, k);
  seg(g, [[tipX - 6, tipY - 6], [tipX + 300, tipY + 420]], 112, '#bfe9ff'); seg(g, [[tipX, tipY], [tipX + 300, tipY + 420]], 104, S0()); seg(g, [[tipX + 120, tipY + 200], [tipX + 420, tipY + 470]], 190, S0());
  if (t > tap && t < tap + 0.4) FX.rings(g, fx, fy, t - tap, { count: 2, r0: 30, r1: 120, a: 0.8, speed: 2.5 });
  if (green) glow(g, E.W / 2, E.H * 0.45, 900, '#45ff7a', 0.25 * ease.out(prog(t, tap, tap + 0.2)));
});
const S0 = () => '#0a0c16';

// s20 — "See? He's green!" the room bathed in green, the patient unchanged
reg('s20', (g, t, info) => {
  const gt = info.globalT, cam = { z: 1.36 + 0.04 * ease.inOut(t / info.dur), x: 50, y: 60 };
  bay(g, gt, cam, {
    monitor: { mode: 'green', hr: 160, spo2: 85, bp: '72/40' },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4, talk = talkAmount(gt, 39.5, 41.3);
      const pose = posesAt(t, [[0, 'stand'], [0.08, PZ.present]], 0.18);
      drawDoc(g, { x: DOCX, y, s, facing: 1, pose: breathe(pose, t, 0.7), expr: 'joy', talk, look: [1, -0.4], rim: { color: '#7dff9a', dir: [0.6, -0.6], w: 4.5 }, blink: false });
      const hp = headPos({ x: DOCX, y, s, facing: 1, pose: PZ.present }); talkRings(g, hp[0] + 30, hp[1], gt, talk);
      drawNurse(g, { x: NURX, y, s, facing: -1, pose: breathe(t < 0.6 ? PZ.press : POSES.stand, t, 0.4, 2), expr: t < 1.6 ? 'confused' : 'neutral', look: [-1, 0], rim: { color: '#7dff9a', dir: [0.4, -0.7], w: 4 }, blink: false });
    },
  });
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#2aff6a', 0.06); g.fillRect(0, 0, E.W, E.H); g.restore();
});

// s21 — one beat of dead stare... "THAT'S THE SCREEN!"
reg('s21', (g, t, info) => {
  const gt = info.globalT, burst = 42.0 - info.shot.start, out = t > burst;
  const [sx, sy] = out ? shake(t, 10 * (1 - prog(t, burst, burst + 0.6)), 24, 6) : [0, 0];
  bayBg(g, gt, { z: 1.7, x: 220, y: -60 }, { monitor: { mode: 'green', hr: 160 } }, 14, 0.4);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#2aff6a', 0.05); g.fillRect(0, 0, E.W, E.H); g.restore();
  const r = out ? 390 * (1 + 0.02 * (t - burst)) : 300 * (1 + 0.03 * t), talk = talkAmount(gt, 41.9, 43.2);
  bigFace(g, E.W / 2 + sx, E.H * 0.47 + sy, r, { outfit: NURSE, expr: out ? 'angry' : 'neutral', face: out ? { brows: 'worried', eyes: 'wide' } : { mouth: 'flat', eyes: 'dot' }, talk, rimColor: '#7dff9a', rimSide: 1, look: [0, 0] });
  if (out) FX.rings(g, E.W / 2, E.H * 0.47, t, { count: 3, r0: r * 1.05, r1: r * 1.55, a: 0.35 });
});

// s22 — pulse check at the neck, then she slams CODE BLUE
reg('s22', (g, t, info) => {
  const gt = info.globalT, slam = 44.75 - info.shot.start;
  const [sx, sy] = t > slam ? shake(t, 7 * (1 - prog(t, slam, slam + 0.4)), 26, 8) : [0, 0];
  const cam = { z: 2.0, x: -150 + sx, y: 180 + sy };
  bay(g, gt, cam, {
    code: t > slam ? ease.out(prog(t, slam, slam + 0.2)) : 0,
    monitor: { mode: 'alarm', hr: 40, spo2: 70, bp: '50/--' },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4, talk = talkAmount(gt, 43.9, 45.5);
      const pose = posesAt(t, [[0, 'stand'], [0.15, PZ.pulse], [slam - 0.15, PZ.slam]], 0.15);
      drawNurse(g, { x: HEADX, y, s, facing: -1, pose: breathe(pose, t, 0.6, 2), expr: t < 0.4 ? 'determined' : 'angry', talk, look: t < slam - 0.2 ? [-0.3, 0.8] : [-0.6, -0.8], rim: RIM(M) });
      const hp = headPos({ x: HEADX, y, s, facing: -1, pose }); talkRings(g, hp[0] - 20, hp[1], gt, talk);
    },
  });
});

// s23 — the team rushes in; flatline on a cheerful green screen; the doctor frozen
reg('s23', (g, t, info) => {
  const gt = info.globalT, cam = { z: 1.32, x: 20, y: 50 };
  bay(g, gt, cam, {
    code: 1, monitor: { mode: 'flatGreen', hr: 0 },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4, run = gt * 2 * Math.PI * 1.6;
      drawDoc(g, { x: DOCX - 70, y, s, facing: 1, pose: PZ.frozen, expr: 'shocked', dim: true, rim: RIM(M), blink: false });
      drawNurse(g, { x: HEADX, y, s, facing: -1, pose: breathe(PZ.pulse, t, 0.8, 2), expr: 'determined', rim: RIM(M) });
      const ax = lerp(E.W + 260, E.W / 2 + 110, ease.out(prog(t, 0, 0.6)));
      const bob = t > 0.65 ? Math.max(0, Math.sin((t - 0.65) * Math.PI * 3.6)) * 10 : 0;
      drawFigure(g, { x: ax, y: y + bob * 0.2, s, facing: -1, outfit: STAFF, pose: t < 0.6 ? walkPose(run, { run: true }) : { ...PZ.press, hF: [62, -62 + bob], hB: [56, -60 + bob] }, expr: 'determined', rim: RIM(M) });
      const bx = lerp(E.W + 520, E.W / 2 + 330, ease.out(prog(t, 0.15, 0.85)));
      drawFigure(g, { x: bx, y: y - 10, s: s * 0.97, facing: -1, outfit: MEDIC, pose: t < 0.85 ? PZ.push(run) : POSES.stand, expr: 'determined', rim: RIM(M) });
      rr(g, bx - 230, y - 160, 120, 150, 10); g.fillStyle = '#c8323c'; g.fill(); g.fillStyle = alpha('#fff', 0.5); g.fillRect(bx - 220, y - 120, 100, 6); g.fillRect(bx - 220, y - 80, 100, 6);
    },
  });
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#2aff6a', 0.04); g.fillRect(0, 0, E.W, E.H); g.restore();
});

// s24 — pale and trembling, the phone rises: "ChatGPT... was the ibuprofen a bad idea?"
reg('s24', (g, t, info) => {
  const gt = info.globalT;
  bayBg(g, gt, { z: 1.6, x: 60, y: -20 }, {
    code: 1, monitor: { mode: 'flatGreen', hr: 0 },
    chars: (g, c) => { const y = c.GY + 10, bob = Math.max(0, Math.sin(t * Math.PI * 3.6)) * 10; drawFigure(g, { x: E.W / 2 + 110, y, s: 1.4, facing: -1, outfit: STAFF, pose: { ...PZ.press, hF: [62, -62 + bob], hB: [56, -60 + bob] }, rim: RIM(c.M) }); drawNurse(g, { x: HEADX, y, s: 1.4, facing: -1, pose: PZ.pulse, rim: RIM(c.M) }); },
  }, 11, 0.45);
  const k = ease.inOut(prog(t, 0.1, 1.6)), s = 4.1, tremble = shake(t, 3.5, 22, 9);
  const pose = PZ.raise(k); pose.hF = [pose.hF[0] + tremble[0] * 0.6, pose.hF[1] + tremble[1] * 0.6]; pose.eF = [pose.eF[0] + tremble[0] * 0.3, pose.eF[1]];
  const o = { x: E.W / 2 - 60, y: E.H * 0.96, s, facing: 1, pose: breathe(pose, t, 0.4), expr: t < 1.2 ? 'shocked' : 'sad', talk: talkAmount(gt, 47.8, 52.2) * 0.5, look: [0.5, 0.2], rim: { color: '#ff8a8a', dir: [0.7, -0.5], w: 5 }, phone: true, phoneOn: k, dim: true, blink: false };
  g.save(); const z = 1 + 0.07 * ease.inOut(t / info.dur); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2); drawDoc(g, o); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#ff2a3a', 0.07 * (0.5 + 0.5 * Math.sin(t * 8))); g.fillRect(0, 0, E.W, E.H); g.restore();
});
