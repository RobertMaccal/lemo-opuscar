// shots/02_bay_a.js — the bay: the doctor arrives, consults the phone, the ibuprofen, the near-confession.
import { E, V, ease, prog, key, clamp, lerp, shake, talkAmount, wordTime, layer, blurLayer, veil, alpha, mix, seg, circle, glow, rr } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, walkPose, bigFace, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bay } from '../sets/hospital.js';
import { reg, drawDoc, drawNurse, phone, phoneHands, revealText, pillBox, tablet, talkRings, toWorld, PZ } from '../lib.js';
import { DOC, NURSE, MEDIC, COL } from '../cast.js';

export const DOCX = E.W / 2 - 245, NURX = E.W / 2 + 250;
const blink = (t, p = 3.1) => t % p > p - 0.12;
const RIM = (M) => ({ color: M.rim, dir: [0, -1], w: 4 });
// blurred, darkened bay behind a close shot
export function bayBg(g, t, cam, o = {}, blur = 10, v = 0.35) {
  let ctx; blurLayer(g, blur, (g) => { ctx = bay(g, t, cam, o); }); veil(g, '#060a14', v); return ctx;
}
// stethoscope over the shoulders of a doctor bigFace
export function bigFaceDoc(g, cx, cy, r, o) {
  bigFace(g, cx, cy, r, { outfit: DOC, ...o });
  g.save(); g.translate(cx, cy); if (o.tilt) g.rotate(o.tilt);
  g.strokeStyle = '#2b2f3a'; g.lineWidth = r * 0.07; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 0.55, r * 0.95); g.quadraticCurveTo(-r * 0.6, r * 1.45, -r * 0.2, r * 1.6); g.stroke();
  g.beginPath(); g.moveTo(r * 0.55, r * 0.95); g.quadraticCurveTo(r * 0.62, r * 1.4, r * 0.35, r * 1.62); g.stroke();
  g.fillStyle = '#e9f3ff'; g.fillRect(r * 0.5, r * 1.3, r * 0.22, r * 0.3); g.fillStyle = COL.userBubble; g.fillRect(r * 0.5, r * 1.3, r * 0.22, r * 0.08);
  g.restore();
}
export function sweat(g, x, y, r, t, a = 1) { if (a <= 0) return; const dy = ((t * 0.8) % 1) * r * 0.5; g.save(); g.globalAlpha *= a * (1 - dy / (r * 0.6)); g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(x, y + dy, r * 0.07, r * 0.11, 0, 0, Math.PI * 2); g.fill(); g.restore(); }

// s04 — he skids in like a hero... then the phone comes out
reg('s04', (g, t, info) => {
  const gt = info.globalT, cam = { z: 1.42 + 0.06 * ease.inOut(t / info.dur), x: -20, y: 170 };
  const arrive = 0.32, phoneAt = 1.0;
  bay(g, t, cam, {
    monitor: { mode: 'normal', hr: 118, bp: '92/58' },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4;
      let x = lerp(-180, DOCX, ease.out(prog(t, 0, arrive))), pose;
      if (t < arrive) pose = walkPose(gt * 2 * Math.PI * 1.6, { run: true });
      else pose = posesAt(t, [[arrive, 'ready'], [arrive + 0.18, PZ.hips], [phoneAt, PZ.hips], [phoneAt + 0.05, 'phone']], 0.16);
      const expr = t < phoneAt ? 'smirk' : 'nervous';
      drawDoc(g, { x, y, s, facing: 1, pose: breathe(pose, t, 0.6), expr, rim: RIM(M), phone: t > phoneAt + 0.08, phoneOn: clamp((t - phoneAt - 0.08) / 0.2), blink: blink(t) });
      if (t > arrive + 0.1 && t < phoneAt) FX.sparkle(g, x + 30, y - 260, 30, '#ffffff', 0.8 * (1 - prog(t, arrive + 0.1, phoneAt)));
      const turned = t > arrive + 0.12;
      drawNurse(g, { x: NURX, y, s, facing: -1, pose: breathe(posesAt(t, [[0, PZ.press], [arrive + 0.1, 'stand']], 0.2), t, 1, 2), expr: t > phoneAt + 0.3 ? 'confused' : turned ? 'surprised' : 'determined', look: turned ? [-1, 0] : [0, 0.5], rim: RIM(M), blink: blink(t, 3.4) });
      drawFigure(g, { x: NURX + 210, y: y - 20, s: s * 0.95, facing: -1, outfit: MEDIC, pose: breathe(POSES.stand, t, 1, 4), expr: t > phoneAt + 0.3 ? 'confused' : 'surprised', look: [-1, 0], rim: RIM(M) });
    },
  });
});

// s05 — the whisper: hunched over the glowing phone
reg('s05', (g, t, info) => {
  const gt = info.globalT;
  bayBg(g, t, { z: 1.7, x: -120, y: -40 }, { monitor: { mode: 'normal', hr: 124, bp: '90/56' }, chars: (g, c) => drawNurse(g, { x: NURX, y: c.GY + 10, s: 1.3, facing: -1, pose: breathe(PZ.press, t, 1, 2), expr: 'determined', rim: RIM(c.M) }) }, 9, 0.38);
  const s = 4.4, x = E.W / 2 - 60 + 10 * ease.inOut(t / info.dur), y = E.H * 0.93 + 30 * ease.inOut(t / info.dur);
  const talk = talkAmount(gt, 8.0, 10.8) * 0.7, [sx, sy] = shake(t, 2, 6, 5);
  g.save(); g.translate(sx, sy); g.translate(E.W / 2, E.H / 2); g.scale(1 + 0.05 * ease.inOut(t / info.dur), 1 + 0.05 * ease.inOut(t / info.dur)); g.translate(-E.W / 2, -E.H / 2);
  const o = { x, y, s, facing: 1, pose: breathe(PZ.hunch, t, 0.7), expr: 'nervous', talk, look: [0.6, 0.7], rim: { color: '#bfe9ff', dir: [0.5, 0.6], w: 5 }, phone: true, blink: blink(t, 2.7) };
  drawDoc(g, o);
  const hp = headPos(o); glow(g, hp[0] + 40, hp[1] + 60, 260, '#bfe9ff', 0.18);
  // glance over the shoulder: is anyone watching?
  g.restore();
  FX.dust(g, t, { count: 24, color: '#dff1ff', a: 0.25 });
});

// s06 — phone insert: the cheerful, terrible answer
reg('s06', (g, t, info) => {
  const gt = info.globalT;
  bayBg(g, t, { z: 1.4, x: -100, y: 60 }, { monitor: { mode: 'normal', hr: 126 } }, 16, 0.55);
  const full = "Great question! Give him ibuprofen! You're doing amazing!";
  const shown = revealText('C1', gt, full), k = ease.out(prog(t, 0, 0.3));
  const msgs = [{ from: 'user', text: 'How do I stop severe bleeding?!', show: 1 }, { from: 'bot', text: shown || ' ', show: shown ? 1 : 0, hl: true, tag: gt > 14.2 ? 'Confidence: 100%' : null }];
  const ph = phone(g, E.W / 2 - 10, E.H * 0.47 + 30 * (1 - k), 640, t, msgs, { typing: gt < 11.3 ? 1 : 0, tilt: -0.03 + 0.01 * Math.sin(t * 0.7), fs: 0.075 });
  phoneHands(g, ph, '#bfe9ff');
  if (gt > 14.0) for (let i = 0; i < 6; i++) FX.sparkle(g, ph.x + ph.w * (0.15 + 0.14 * i), ph.y + ph.h * (0.4 + 0.06 * Math.sin(i * 2 + t * 3)), 16, '#ffd47e', 0.7 * clamp((gt - 14.0) / 0.3));
}, { hideBot: true });

// s07 — "Perfect!" genuinely impressed
reg('s07', (g, t, info) => {
  const gt = info.globalT;
  bayBg(g, t, { z: 1.6, x: -160, y: -80 }, { monitor: { mode: 'normal', hr: 128 } }, 14, 0.4);
  const r = 330 * (1 + 0.04 * t), talk = talkAmount(gt, 15.9, 16.6);
  bigFaceDoc(g, E.W / 2, E.H * 0.48, r, { expr: t < 0.15 ? 'awe' : 'joy', talk, rimColor: '#bfe9ff', rimSide: 1, tilt: 0.05 * Math.sin(t * 3) });
  for (let i = 0; i < 5; i++) FX.sparkle(g, E.W / 2 + Math.cos(i * 1.3 + t) * r * 1.2, E.H * 0.48 + Math.sin(i * 1.7 + t) * r * 1.1, 22, '#ffffff', 0.7 * clamp(t / 0.3));
});

// s08 — cabinet, pack, one cartoon tablet flicked onto the dressing
reg('s08', (g, t, info) => {
  const cam = { z: 1.75 + 0.05 * t, x: -120, y: 120 };
  const open = ease.out(prog(t, 0.05, 0.3));
  bay(g, t, cam, {
    cabinetOpen: open, monitor: { mode: 'normal', hr: 130 },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4;
      const facing = t < 0.45 ? -1 : 1;
      const pose = posesAt(t, [[0, 'stand'], [0.05, 'reach'], [0.4, 'holdFront'], [0.62, POSES.point], [0.95, PZ.thumbs]], 0.15);
      drawDoc(g, { x: DOCX, y, s, facing, pose: breathe(pose, t, 0.5), expr: t < 0.62 ? 'determined' : 'happy', rim: RIM(M), blink: blink(t) });
      const hand = toWorld({ x: DOCX, y, s, facing, pose }, pose.hB);
      if (t > 0.3 && t < 0.95) pillBox(g, hand[0] + 6, hand[1] - 18, 0.8, -0.15);
      drawNurse(g, { x: NURX, y, s, facing: -1, pose: breathe(PZ.press, t, 1, 2), expr: 'determined', rim: RIM(M) });
    },
    front: (g, c) => {
      const start = [DOCX + 70, c.GY - 230], end = [c.pat.chest[0] - 4, c.pat.chest[1] - 22];
      const k = prog(t, 0.68, 0.98);
      if (k > 0 && k < 1) { const x = lerp(start[0], end[0], k), yy = lerp(start[1], end[1], k) - Math.sin(k * Math.PI) * 160; for (let i = 1; i < 10; i++) { const kk = k - i * 0.03; if (kk > 0) circle(g, lerp(start[0], end[0], kk), lerp(start[1], end[1], kk) - Math.sin(kk * Math.PI) * 160, 2.5, alpha('#ffffff', 0.35)); } tablet(g, x, yy, 13, k * 14); }
      if (k >= 1) { const b = prog(t, 0.98, 1.15); tablet(g, end[0], end[1] - Math.sin(b * Math.PI) * 18, 13, 0.2); if (b < 1) FX.rings(g, end[0], end[1], t, { count: 2, r0: 10, r1: 60, a: 0.5 }); }
    },
  });
});

// s09 — the nurse's head snaps round: eyes, brows, jaw... "DOCTOR!"
reg('s09', (g, t, info) => {
  const gt = info.globalT, snap = ease.out(prog(t, 0, 0.14));
  bayBg(g, t, { z: 1.7, x: 220, y: -60 }, { monitor: { mode: 'normal', hr: 132 } }, 14, 0.4);
  const talk = talkAmount(gt, 18.8, 19.4), r = 330 * (1 + 0.035 * t);
  const expr = t < 0.16 ? 'neutral' : t < 0.36 ? 'surprised' : t < 0.68 ? 'shocked' : 'angry';
  const cx = lerp(E.W * 0.95, E.W / 2, snap), tilt = lerp(0.35, 0, snap) + (t > 0.14 && t < 0.3 ? Math.sin((t - 0.14) * 40) * 0.03 : 0);
  if (snap < 1) for (let i = 1; i <= 3; i++) { g.save(); g.globalAlpha = 0.15; bigFace(g, cx + i * 50, E.H * 0.48, r, { outfit: NURSE, expr, rimColor: '#b8c6ff', rimSide: -1, tilt }); g.restore(); }
  bigFace(g, cx, E.H * 0.48, r, { outfit: NURSE, expr, talk, rimColor: '#b8c6ff', rimSide: -1, tilt, look: t > 0.16 ? [-0.6, 0] : [0, 0], face: expr === 'angry' ? { brows: 'worried', eyes: 'wide' } : null });
  if (talk > 0) FX.rings(g, E.W / 2, E.H * 0.48, t, { count: 3, r0: r * 1.05, r1: r * 1.5, a: 0.3 });
});

// s10 — "DID YOU JUST GIVE HIM IBUPROFEN?!" two-shot across the stretcher
reg('s10', (g, t, info) => {
  const gt = info.globalT, cam = { z: 1.62 + 0.05 * ease.inOut(t / info.dur), x: 0, y: 185 };
  bay(g, t, cam, {
    monitor: { mode: 'normal', hr: 134, bp: '88/54' },
    patient: { bloodA: 1 },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4, talk = talkAmount(gt, 19.7, 21.8);
      drawDoc(g, { x: DOCX, y, s, facing: 1, pose: breathe(POSES.holdFront, t, 0.6), expr: gt > 20.6 ? 'nervous' : 'smile', rim: RIM(M), blink: blink(t) });
      const hand = toWorld({ x: DOCX, y, s, facing: 1, pose: POSES.holdFront }, POSES.holdFront.hF); pillBox(g, hand[0] + 10, hand[1] - 16, 0.75, 0.1);
      drawNurse(g, { x: NURX, y, s, facing: -1, pose: breathe(posesAt(t, [[0, 'stand'], [0.1, 'point']], 0.15), t, 1.5, 2), expr: 'angry', talk, rim: RIM(M) });
      const hp = headPos({ x: NURX, y, s, facing: -1, pose: POSES.point }); talkRings(g, hp[0] - 30, hp[1], gt, talk);
    },
    front: (g, c) => tablet(g, c.pat.chest[0] - 4, c.pat.chest[1] - 22, 13, 0.2),
  });
});

// s11 — "Relax!" palms out, reassuring smile
reg('s11', (g, t, info) => {
  const gt = info.globalT;
  bayBg(g, t, { z: 1.7, x: -200, y: -40 }, { monitor: { mode: 'normal', hr: 136 } }, 10, 0.38);
  const s = 4.0, x = E.W / 2 - 40, y = E.H * 0.97, talk = talkAmount(gt, 22.1, 23.4);
  const o = { x, y, s, facing: 1, pose: breathe(posesAt(t, [[0, 'stand'], [0.12, PZ.calm]], 0.2), t, 0.8), expr: 'smile', talk, rim: { color: '#b8c6ff', dir: [0, -1], w: 5 }, blink: blink(t), phone: true, phoneHand: 'B', phoneOn: 0.6 };
  g.save(); const z = 1 + 0.04 * ease.inOut(t / info.dur); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2); drawDoc(g, o); g.restore();
  FX.dust(g, t, { count: 22, color: '#dff1ff', a: 0.25 });
});

// s12 — "ChatGPT—" ... freeze.
reg('s12', (g, t, info) => {
  const gt = info.globalT, stop = 25.27 - info.shot.start, frozen = t > stop;
  bayBg(g, t, { z: 1.8, x: -220, y: -80 }, { monitor: { mode: 'normal', hr: 138 } }, frozen ? 18 : 12, frozen ? 0.55 : 0.4);
  const talk = talkAmount(gt, 23.9, 25.27), zoom = frozen ? 1.22 + 0.02 * (t - stop) : 1 + 0.05 * ease.inOut(t / stop);
  const r = 300 * zoom;
  bigFaceDoc(g, E.W / 2, E.H * 0.47, r, { expr: frozen ? 'scared' : 'smile', talk: frozen ? 0 : talk, rimColor: '#bfe9ff', rimSide: 1, look: frozen ? [0, 0] : [0.2, 0] });
  if (frozen) { sweat(g, E.W / 2 - r * 0.75, E.H * 0.47 - r * 0.45, r, t - stop, 1); sweat(g, E.W / 2 + r * 0.8, E.H * 0.47 - r * 0.3, r * 0.8, t - stop + 0.4, 0.8); }
  if (!frozen) FX.rings(g, E.W / 2, E.H * 0.47, t, { count: 2, r0: r * 1.05, r1: r * 1.4, a: 0.25 * talk });
});

// s13 — the phone whips behind his back. "I MEAN, I'VE GOT THIS!"
reg('s13', (g, t, info) => {
  const gt = info.globalT, cam = { z: 1.66 + 0.04 * ease.inOut(t / info.dur), x: -30, y: 185 };
  bay(g, t, cam, {
    monitor: { mode: 'normal', hr: 140, bp: '84/50' },
    chars: (g, c) => {
      const M = c.M, y = c.GY + 10, s = 1.4, hideK = ease.out(prog(t, 0.0, 0.12));
      const pose = hideK < 1 ? { ...POSES.phone, hB: [lerp(-9, -36, hideK), lerp(-100, -112, hideK)] } : PZ.hide;
      const o = { x: DOCX + 30, y, s, facing: 1, pose: breathe(pose, t, 0.6), expr: 'happy', talk: talkAmount(gt, 25.7, 27.4), rim: RIM(M), blink: blink(t) };
      const hb = toWorld(o, pose.hB); glow(g, hb[0] - 6, hb[1] - 10, 120, '#bfe9ff', 0.45 + 0.15 * Math.sin(t * 6));
      drawDoc(g, { ...o, phone: true, phoneHand: 'B', phoneGlow: '#bfe9ff' });
      if (t > 0.12) { const [sx2] = shake(t, 3, 30, 7); FX.sparkle(g, toWorld(o, PZ.hide.hF)[0] + sx2, toWorld(o, PZ.hide.hF)[1] - 20, 22, '#ffffff', 0.6); }
      drawNurse(g, { x: NURX - 20, y, s, facing: -1, pose: breathe(POSES.crossArms, t, 0.5, 2), expr: t < 0.8 ? 'confused' : 'angry', look: [-1, 0.1], rim: RIM(M), blink: false });
    },
  });
  if (t < 0.15) FX.speedLines(g, t, { cx: E.W * 0.3, cy: E.H * 0.55, count: 20, a: 0.2, inner: 160 });
});
