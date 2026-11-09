// 03_levers.js — s013–s017: time is the lever, the trade-off, what shrinks it, the testosterone trap.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, wordTime, glow, alpha, text, FONTS, seg, circle, ring, rr, poly } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { kitchen } from '../sets/rooms.js';
import { C, cylinder, sperm, label, bottle } from '../sets/_kit.js';
import { MAX } from '../cast.js';
const wt = (w, info, d = 0) => (wordTime(w, info.shot.start) ?? info.shot.start + d) - info.shot.start;
function pill(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); rr(g, -60 * s, -24 * s, 120 * s, 48 * s, 24 * s); g.fillStyle = '#e9e4ef'; g.fill(); g.save(); g.beginPath(); g.rect(0, -30 * s, 70 * s, 60 * s); g.clip(); rr(g, -60 * s, -24 * s, 120 * s, 48 * s, 24 * s); g.fillStyle = '#e04a6a'; g.fill(); g.restore(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-40 * s, -16 * s, 70 * s, 6 * s); g.restore(); }

// s013 — "So volume is mostly glands refilling. The biggest lever isn't a pill. It's time."
registerShot('s013', { draw(g, t, info) {
  const tP = wt('pill', info, 3.5), tT = wt('time', info, 5.0);
  const cam = { z: 1.15 + 0.1 * ease.inOut(prog(t, tT - 0.6, info.dur)), x: lerp(0, -160, ease.inOut(prog(t, tT - 0.6, info.dur))), y: lerp(0, -260, ease.inOut(prog(t, tT - 0.6, info.dur))) };
  const { GY, M, top } = kitchen(g, t, cam, { calGlow: ease.out(prog(t, tT, tT + 0.4)) });
  layer(g, cam, 1, (g) => {
    const flick = { ...POSES.stand, eF: [30, -150], hF: [62, -150] };
    drawFigure(g, { x: E.W / 2 + 230, y: GY + 110, s: 2.0, facing: -1, outfit: MAX, pose: breathe(posesAt(t, [[0, POSES.think], [tP - 0.3, flick], [tP + 0.4, POSES.stand], [tT - 0.3, POSES.pointUp]]), t), expr: t < tP ? 'thinking' : t < tT ? 'smirk' : 'happy', look: t > tT ? [-0.8, -0.8] : [-1, 0.2], rim: { color: M.rim, dir: [0, -1] } });
    // the giant pill gets flicked off the counter
    const k = prog(t, tP, tP + 1.2), px = E.W / 2 - 40 - k * 520, py = top - 26 + (k > 0.55 ? 900 * (k - 0.55) ** 2 : 0);
    pill(g, px, py, 1.3, -k * 9);
    // refilling mini-cylinder hologram
    g.save(); g.globalAlpha *= 0.85; cylinder(g, E.W / 2 - 330, GY - 400, 120, 260, { sperm: 1, prostate: lerp(0.3, 1, prog(t, 0.2, info.dur)), sv: lerp(0.2, 1, prog(t, 0.2, info.dur)) }, { t }); g.restore();
  });
  FX.dust(g, t, { count: 40, color: '#ffe2bd', a: 0.35 });
  if (t > tT) label(g, 'TIME', E.W / 2, 330, ease.outBack(prog(t, tT, tT + 0.35)), { size: 96, color: C.gold });
} });

// s014 — "Skip a few days and volume climbs. Wait too long, and sperm get sluggish."
registerShot('s014', { draw(g, t, info) {
  const M = mood('interiorWarm'); blurLayer(g, 14, (g) => kitchen(g, t, { z: 1.4, x: -200, y: -300 })); veil(g, '#120a10', 0.45);
  const tW = wt('wait', info, 2.6), tSl = wt('sluggish', info, 4.0);
  const day = Math.min(12, 1 + Math.floor(prog(t, 0.1, tSl + 0.4) * 11.99));
  // calendar page flip
  const cx = E.W / 2, cy = 520, fl = (t * 3.2) % 1;
  rr(g, cx - 230, cy - 260, 460, 520, 18); g.fillStyle = '#efe6d6'; g.fill(); g.fillStyle = '#c0392b'; rr(g, cx - 230, cy - 260, 460, 110, 18); g.fill(); g.fillRect(cx - 230, cy - 190, 460, 40);
  text(g, 'DAY', cx, cy - 200, { size: 54, color: '#fff', font: FONTS.ui, weight: 900, spacing: 6 }); text(g, String(day) + (day >= 12 ? '+' : ''), cx, cy + 70, { size: 230, color: day > 7 ? '#c0392b' : '#2a1e22', font: FONTS.ui, weight: 900 });
  if (t < tSl + 0.4) { g.save(); g.globalAlpha *= 0.6 * (1 - fl); g.fillStyle = '#f7efe0'; g.beginPath(); g.moveTo(cx - 230, cy - 150); g.lineTo(cx + 230, cy - 150); g.lineTo(cx + 230 - 460 * fl, cy - 150 - 300 * Math.sin(fl * Math.PI)); g.lineTo(cx - 230, cy - 150 - 300 * fl); g.closePath(); g.fill(); g.restore(); }
  // two meters: VOLUME up (amber), SWIM SPEED down after "wait too long" (coral)
  const vol = ease.inOut(prog(t, 0.2, tW)) * 0.8 + 0.15 + 0.05 * prog(t, tW, tSl), swim = 0.85 - 0.6 * ease.inOut(prog(t, tW, tSl + 0.6));
  const bar = (y, lab, v, col) => { text(g, lab, 120, y - 50, { size: 34, color: C.cream, font: FONTS.ui, weight: 900, align: 'left', spacing: 3 }); rr(g, 120, y - 22, E.W - 240, 44, 22); g.fillStyle = alpha(col, 0.15); g.fill(); rr(g, 120, y - 22, Math.max(44, (E.W - 240) * v), 44, 22); g.fillStyle = col; g.fill(); glow(g, 120 + (E.W - 240) * v, y, 50, col, 0.6); };
  bar(1000, 'VOLUME', vol, C.amber); bar(1170, 'SWIM SPEED', swim, swim < 0.5 ? C.coral : C.teal);
  // a sluggish sperm
  const slow = prog(t, tW, tSl + 0.5); sperm(g, lerp(200, 880, ((t * lerp(0.35, 0.06, slow)) % 1)), 1330, 0, t * lerp(1, 0.2, slow), 2.0);
  if (slow > 0.8) text(g, 'z z z', 940, 1270, { size: 40, color: alpha(C.cream, 0.7), font: FONTS.ui, weight: 900, alpha: prog(t, tSl, tSl + 0.4) });
  label(g, 'WHO LAB PROTOCOL: 2–7 DAYS', E.W / 2, 1440, ease.out(prog(t, 0.6, 1.0)) * 0.9, { size: 28, color: C.bp });
} });

// s015 — "Age, low testosterone, and prostate drugs like dutasteride can all shrink it."  three stacked cards
registerShot('s015', { draw(g, t, info) {
  UI.blueprint(g); const tA = wt('age', info, 0.1), tT = wt('testosterone', info, 0.9), tD = wt('dutasteride', info, 2.6), tS = wt('shrink', info, 3.6);
  const card = (i, ts, title, draw) => { const a = ease.outBack(prog(t, ts - 0.1, ts + 0.3)); if (a <= 0) return; const y = 250 + i * 400; g.save(); g.translate(E.W / 2, y + 170); g.scale(a, a); g.translate(-E.W / 2, -y - 170);
    rr(g, 80, y, E.W - 160, 340, 26); g.fillStyle = 'rgba(18,28,48,.94)'; g.fill(); g.strokeStyle = alpha(C.bp, 0.35); g.lineWidth = 2.5; g.stroke();
    text(g, title, 140, y + 70, { size: 48, color: C.cream, font: FONTS.ui, weight: 900, align: 'left', spacing: 2 }); draw(y, prog(t, ts + 0.2, ts + 1.2));
    poly(g, [[E.W - 190, y + 210], [E.W - 130, y + 210], [E.W - 160, y + 260]], C.coral); seg(g, [[E.W - 160, y + 120], [E.W - 160, y + 215]], 12, C.coral); g.restore(); };
  card(0, tA, 'AGE', (y, k) => { drawFigure(g, { x: 260, y: y + 310, s: 0.95, facing: 1, outfit: MAX, pose: { ...POSES.stand, head: [14, -196], sh: [8, -166] }, expr: 'neutral', rim: { color: '#ffc68a', dir: [0, -1] } }); circle(g, 250, y + 108, 14, '#cfcad6');
    ring(g, 560, y + 210, 70, 5, alpha(C.amber, 1 - 0.6 * k)); glow(g, 560, y + 210, 90, C.amber, 0.5 * (1 - 0.7 * k)); text(g, 'GLANDS', 560, y + 300, { size: 26, color: C.bp, font: FONTS.ui, weight: 900 }); });
  card(1, tT, 'LOW TESTOSTERONE', (y, k) => { const v = lerp(0.85, 0.25, k); rr(g, 140, y + 160, 620, 54, 27); g.fillStyle = alpha(C.gold, 0.15); g.fill(); rr(g, 140, y + 160, 620 * v, 54, 27); g.fillStyle = v < 0.5 ? C.coral : C.gold; g.fill(); text(g, 'T', 800, y + 188, { size: 64, color: C.gold, font: FONTS.ui, weight: 900 }); text(g, 'LESS GLAND OUTPUT', 140, y + 270, { size: 28, color: C.bp, font: FONTS.ui, weight: 900, align: 'left' }); });
  card(2, tD, 'SOME PROSTATE DRUGS', (y, k) => { bottle(g, 260, y + 320, 0.95, 'DUTASTERIDE', '#6a7aa8'); cylinder(g, 600, y + 315, 100, 200, { sperm: 1, prostate: 1 - 0.4 * k, sv: 1 - 0.4 * k }, { t }); });
  label(g, 'CAN SHRINK VOLUME', E.W / 2, 1480, ease.out(prog(t, tS, tS + 0.3)), { size: 40, color: C.coral });
} });

// s016 — "But taking testosterone to fix it backfires."  SIGNATURE FREEZE
function tube(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); rr(g, -18 * s, -70 * s, 36 * s, 120 * s, 10 * s); g.fillStyle = '#e8e4ef'; g.fill(); g.fillStyle = '#c94a3a'; g.fillRect(-18 * s, -20 * s, 36 * s, 34 * s); text(g, 'T', 0, -3 * s, { size: 26 * s, color: '#fff', font: FONTS.ui, weight: 900 }); rr(g, -10 * s, 50 * s, 20 * s, 22 * s, 4 * s); g.fillStyle = '#444'; g.fill(); g.restore(); }
registerShot('s016', { draw(g, t, info) {
  const tB = wt('backfires', info, 2.2), freeze = t > 0.5, ft = freeze ? 0.5 + (t - 0.5) * 0.05 : t;
  const cam = { z: 1.35 + 0.05 * t, x: -60, y: -120, r: freeze ? -0.02 + 0.01 * t : 0 };
  const { GY, M, top } = kitchen(g, ft, cam);
  layer(g, cam, 1, (g) => { const reach = { ...POSES.reach }; drawFigure(g, { x: E.W / 2 + 160, y: GY + 110, s: 2.0, facing: -1, outfit: MAX, pose: posesAt(Math.min(t, 0.5), [[0, POSES.stand], [0.45, POSES.reach]]), expr: t > tB ? 'shocked' : 'smile', rim: { color: M.rim, dir: [0, -1] } }); tube(g, E.W / 2 - 60, top - 70, 1.3, 0.2); });
  if (freeze) { FX.drops(g, t, { count: 40, color: '#d8e4ff', rMax: 8, drift: 2 }); g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(80,120,255,.45)'; g.fillRect(0, 0, E.W, E.H); g.restore();
    FX.rings(g, E.W / 2 - 60, E.H * 0.42, t, { count: 3, r0: 80, r1: 420, speed: 0.4, color: '#e8f0ff', a: 0.3 });
    { const ba = ease.outBack(prog(t, 0.6, 1.0)); if (ba > 0) { g.save(); g.translate(E.W / 2, 230); g.scale(ba, ba); rr(g, -170, -62, 340, 124, 24); g.fillStyle = 'rgba(10,12,24,.85)'; g.fill(); g.strokeStyle = C.coral; g.lineWidth = 6; g.stroke(); text(g, 'TRAP', 0, 4, { size: 84, color: C.coral, font: FONTS.ui, weight: 900, spacing: 8, glow: 20, glowColor: alpha(C.coral, 0.6) }); g.restore(); } } }
  if (t > tB) label(g, 'BACKFIRES', E.W / 2, 360, ease.outBack(prog(t, tB, tB + 0.3)), { size: 60, color: C.coral });
} });

// s017 — "Your brain sees plenty and shuts sperm production down."  hormone loop
function brain(g, x, y, r, c) { g.strokeStyle = c; g.lineWidth = 6; g.beginPath(); g.ellipse(x - r * 0.3, y, r * 0.55, r * 0.75, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(x + r * 0.3, y, r * 0.55, r * 0.75, 0, 0, 7); g.stroke(); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - r * 0.3, y - r * 0.4 + i * r * 0.4, r * 0.25, 0.3, 2.6); g.stroke(); g.beginPath(); g.arc(x + r * 0.3, y - r * 0.4 + i * r * 0.4, r * 0.25, 0.5, 2.8); g.stroke(); } }
registerShot('s017', { draw(g, t, info) {
  UI.blueprint(g); const tB = wt('brain', info, 0.3), tP = wt('plenty', info, 1.0), tS = wt('shuts', info, 1.6), tD = wt('down', info, 2.6);
  const cx = E.W / 2, by = 330, ty = 1220;
  brain(g, cx, by, 120, C.bp); circle(g, cx + 10, by + 110, 16, t > tP ? C.coral : C.gold); label(g, 'PITUITARY', cx + 190, by + 110, ease.out(prog(t, tB, tB + 0.3)), { size: 26, color: C.bp });
  // bloodstream band with flooding gold T
  rr(g, 90, 640, E.W - 180, 160, 80); g.fillStyle = alpha(C.coral, 0.12); g.fill(); g.strokeStyle = alpha(C.coral, 0.5); g.lineWidth = 3; g.stroke(); label(g, 'BLOOD', 200, 610, 0.9, { size: 26, color: C.coral });
  const nT = Math.floor(6 + 30 * ease.out(prog(t, 0, tP + 0.4))); for (let i = 0; i < nT; i++) { const x = 130 + ((i * 71 + t * 120) % (E.W - 260)), y = 680 + (i * 37 % 80); circle(g, x, y, 15, C.gold); text(g, 'T', x, y + 1, { size: 18, color: '#3a2a00', font: FONTS.ui, weight: 900 }); }
  // coral feedback arrow blood -> brain
  const fa = ease.out(prog(t, tP - 0.2, tP + 0.4)); if (fa > 0) { seg(g, [[cx - 260, 630], [cx - 260, by + 160]], 8, alpha(C.coral, fa)); poly(g, [[cx - 285, by + 180], [cx - 235, by + 180], [cx - 260, by + 140]], alpha(C.coral, fa)); label(g, 'ENOUGH!', cx - 260, 560, fa, { size: 30, color: C.coral }); }
  // LH / FSH signal line brain -> testis, dims after "shuts"
  const sig = 1 - ease.inOut(prog(t, tS, tD + 0.3)); g.save(); g.setLineDash([18, 14]); g.lineDashOffset = -t * 60; seg(g, [[cx + 40, by + 130], [cx + 40, 620]], 6, alpha('#ffffff', 0.15 + 0.75 * sig)); seg(g, [[cx + 40, 820], [cx + 40, ty - 110]], 6, alpha('#ffffff', 0.15 + 0.75 * sig)); g.restore();
  label(g, 'LH / FSH', cx + 160, 900, 0.4 + 0.6 * sig, { size: 30, color: '#ffffff' });
  // testis "factory"
  g.strokeStyle = C.bp; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, ty, 110, 135, 0, 0, 7); g.stroke(); glow(g, cx, ty, 200, C.cream, 0.4 * sig);
  for (let i = 0; i < 6; i++) { const u = ((i / 6 + t * 0.4) % 1); sperm(g, cx - 70 + u * 140, ty - 40 + (i % 3) * 40, 0, t + i, 0.8, C.cream, sig); }
  label(g, 'SPERM PRODUCTION', cx, ty + 190, 0.9, { size: 32, color: sig < 0.4 ? C.coral : C.cream });
  label(g, 'USUALLY REVERSIBLE AFTER STOPPING', cx, 1470, ease.out(prog(t, tD, tD + 0.4)) * 0.8, { size: 24, color: C.bp });
} });
