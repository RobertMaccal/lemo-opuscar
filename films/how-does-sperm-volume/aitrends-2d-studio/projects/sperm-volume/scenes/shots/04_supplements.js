// 04_supplements.js — s018–s025: the clinic, supplements, the doctor line, the payoff and end screen.
import { E, V, S, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, wordTime, glow, alpha, text, FONTS, seg, circle, ring, rr, poly } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { clinic, bedroom } from '../sets/rooms.js';
import { C, cylinder, sperm, label, bottle, adScreen, anat, drawAnat, flow } from '../sets/_kit.js';
import { MAX, ADA, scarf } from '../cast.js';
const wt = (w, info, d = 0) => (wordTime(w, info.shot.start) ?? info.shot.start + d) - info.shot.start;
function duo(g, t, cam, o = {}) {
  const { GY, M } = clinic(g, t, cam, o.room || {});
  layer(g, cam, 1, (g) => {
    const ada = { x: E.W / 2 - 230, y: GY + 60, s: 1.75, facing: 1, outfit: ADA, pose: breathe(o.adaPose || POSES.explain, t, 1, 2), expr: o.adaExpr || 'smile', rim: { color: M.rim, dir: [0.3, -1] } };
    drawFigure(g, ada); scarf(g, ada);
    drawFigure(g, { x: E.W / 2 + 290, y: GY + 60, s: 1.75, facing: -1, outfit: MAX, pose: breathe(o.maxPose || POSES.stand, t, 1, 5), expr: o.maxExpr || 'thinking', prop: o.maxProp, rim: { color: '#ffd28a', dir: [-0.6, -1] } });
    o.extra?.(g, GY);
  });
  FX.dust(g, t, { count: 30, color: '#dfe8ff', a: 0.3 });
  return { GY, M };
}

// s018 — "Supplements? Zinc probably only helps if you're low."
registerShot('s018', { draw(g, t, info) {
  const tZ = wt('zinc', info, 0.9), tL = wt('low', info, 2.6);
  const cam = { z: 1.05 + 0.05 * t / info.dur, x: 0 };
  duo(g, t, cam, { maxPose: posesAt(t, [[0, POSES.phone], [tZ, POSES.stand]]), maxProp: t < tZ ? { type: 'phone', glow: '#ffb35a' } : null, maxExpr: t < tZ ? 'confused' : 'thinking', adaPose: posesAt(t, [[0, POSES.crossArms], [tZ - 0.3, POSES.point]]) });
  // "SUPPLEMENTS?" + the zinc gauge: fills while LOW, extra bounces off at NORMAL
  label(g, 'SUPPLEMENTS?', E.W / 2, 240, ease.outBack(prog(t, 0, 0.3)), { size: 64, color: C.gold });
  const za = ease.out(prog(t, tZ - 0.1, tZ + 0.3)); if (za > 0) { g.save(); g.globalAlpha *= za;
    bottle(g, 250, 640, 1.2, 'ZINC', '#8a94a8'); const gx = 450, gy = 420, gw = 520;
    rr(g, gx, gy, gw, 60, 30); g.fillStyle = 'rgba(18,28,48,.9)'; g.fill(); g.strokeStyle = alpha(C.bp, 0.5); g.lineWidth = 3; g.stroke();
    const lev = lerp(0.18, 0.62, ease.inOut(prog(t, tZ + 0.3, tL))); rr(g, gx, gy, gw * lev, 60, 30); g.fillStyle = lev < 0.4 ? C.coral : C.teal; g.fill();
    seg(g, [[gx + gw * 0.62, gy - 16], [gx + gw * 0.62, gy + 76]], 4, C.cream); text(g, 'NORMAL', gx + gw * 0.62, gy + 110, { size: 26, color: C.cream, font: FONTS.ui, weight: 900 }); text(g, 'LOW', gx + gw * 0.12, gy + 110, { size: 26, color: C.coral, font: FONTS.ui, weight: 900 });
    if (t > tL) for (let i = 0; i < 3; i++) { const k = ((t - tL) * 1.4 + i / 3) % 1; circle(g, gx + gw * 0.62 + 30 + k * 160, gy - 20 - Math.sin(k * Math.PI) * 120, 10, alpha('#c8ccd8', 1 - k)); }
    g.restore(); }
} });

// s019 — "CoQ10 may help sperm swim. Give it three months."
registerShot('s019', { draw(g, t, info) {
  const tC = wt('coq10', info, 0.1), tS = wt('swim', info, 1.3), tM = wt('three', info, 2.4);
  duo(g, t, { z: 1.1, x: -40 }, { adaPose: POSES.explain, maxExpr: t > tS ? 'smile' : 'thinking',
    room: { lightbox: (g, x, y, w, h) => { const a = ease.out(prog(t, tM, tM + 0.4)); if (a <= 0) return; text(g, '~3', x + w / 2, y + h * 0.42, { size: 90, color: '#c0392b', font: FONTS.ui, weight: 900, alpha: a }); text(g, 'MONTHS', x + w / 2, y + h * 0.8, { size: 36, color: '#1a2440', font: FONTS.ui, weight: 900, alpha: a }); } } });
  const ca = ease.outBack(prog(t, tC - 0.1, tC + 0.3)); if (ca > 0) { g.save(); g.translate(E.W / 2, 600); g.scale(ca, ca); g.translate(-E.W / 2, -600); bottle(g, 260, 640, 1.2, 'CoQ10', '#c27a2a'); g.restore(); }
  // swimmer with a speed trail
  const k = ease.inOut(prog(t, tS - 0.2, tS + 1.4)); const sx = lerp(440, 940, k);
  for (let i = 1; i <= 4; i++) sperm(g, sx - i * 40, 520, 0, t, 1.6, C.cream, 0.25 * k * (1 - i / 5));
  sperm(g, sx, 520, 0, t * (1 + k), 1.6);
  label(g, 'MAY HELP MOTILITY', 700, 640, ease.out(prog(t, tS, tS + 0.3)), { size: 30, color: C.teal });
  label(g, 'NEW SPERM TAKE ~3 MONTHS TO BUILD', E.W / 2, 240, ease.out(prog(t, tM, tM + 0.3)), { size: 30, color: C.gold });
} });

// s020 — "Ashwagandha raised volume in one small trial."  honest data card
registerShot('s020', { draw(g, t, info) {
  blurLayer(g, 12, (g) => clinic(g, t, { z: 1.4, x: 100, y: -200 })); veil(g, '#070a14', 0.5);
  const tA = wt('ashwagandha', info, 0.1), tR = wt('raised', info, 1.0), tSm = wt('small', info, 1.8);
  bottle(g, E.W / 2, 560, 1.5, 'ASHWAGANDHA', '#5a7a3a', { a: ease.out(prog(t, tA - 0.1, tA + 0.3)) });
  const x0 = 200, base = 1250, H = 480, bw = 220; const k = ease.inOut(prog(t, tR, tR + 1.2));
  const barB = (x, v, col, lab) => { rr(g, x, base - H * v, bw, H * v, 16); g.fillStyle = col; g.fill(); text(g, lab, x + bw / 2, base + 50, { size: 30, color: C.cream, font: FONTS.ui, weight: 900, spacing: 2 }); };
  seg(g, [[120, base], [E.W - 120, base]], 3, alpha(C.bp, 0.7));
  barB(x0, 0.55, alpha(C.bp, 0.8), 'PLACEBO'); barB(E.W - x0 - bw, lerp(0.55, 0.85, k), C.amber, 'EXTRACT');
  text(g, 'SEMEN VOLUME', E.W / 2, 700, { size: 34, color: C.bp, font: FONTS.ui, weight: 900, spacing: 3, alpha: ease.out(prog(t, tR - 0.2, tR + 0.2)) });
  const sa = ease.outBack(prog(t, tSm, tSm + 0.35)); if (sa > 0) { g.save(); g.translate(E.W / 2, 1420); g.rotate(-0.06); g.scale(sa, sa); rr(g, -330, -55, 660, 110, 16); g.strokeStyle = C.coral; g.lineWidth = 6; g.stroke(); text(g, '1 SMALL STUDY · 46 MEN', 0, 4, { size: 42, color: C.coral, font: FONTS.ui, weight: 900, spacing: 2 }); g.restore(); }
} });

// s021 — "A sudden drop? Talk to a doctor."
registerShot('s021', { draw(g, t, info) {
  const tD = wt('drop', info, 0.3), tDoc = wt('doctor', info, 1.4);
  duo(g, t, { z: 1.1 + 0.04 * t, x: -60 }, { room: { signGlow: ease.out(prog(t, tDoc, tDoc + 0.3)) }, adaPose: posesAt(t, [[0, POSES.relaxed], [tDoc - 0.2, POSES.point]]), adaExpr: 'smile', maxExpr: t < tDoc ? 'worried' : 'smile',
    extra: (g, GY) => { const fl = t > tD && t < tDoc + 0.5 ? 0.5 + 0.5 * Math.sin(t * 16) : 0; cylinder(g, E.W / 2 + 300, GY - 470, 110, 220, { sperm: 1, prostate: 0.35, sv: 0.3 }, { t }); if (fl) glow(g, E.W / 2 + 300, GY - 580, 150, C.coral, 0.6 * fl); } });
  label(g, 'SUDDEN DROP?', E.W / 2, 240, ease.outBack(prog(t, tD - 0.1, tD + 0.25)), { size: 60, color: C.coral });
  label(g, 'SEE A DOCTOR', E.W / 2, 320, ease.outBack(prog(t, tDoc, tDoc + 0.25)), { size: 46, color: C.cream });
} });

// s022 — "So sperm volume is really gland volume."  back to the bedroom: the ad, now with the whole system drawn over it
registerShot('s022', { draw(g, t, info) {
  blurLayer(g, 10, (g) => bedroom(g, t, { z: 1.5, y: -200 })); veil(g, '#05060c', 0.45);
  const tG = wt('gland', info, 1.4), w = 760, h = 1240, x = (E.W - w) / 2, y = 250;
  g.save(); g.globalAlpha *= 1 - 0.85 * ease.out(prog(t, 0.2, 1.0)); adScreen(g, x, y, w, h, t); g.restore();
  g.save(); g.beginPath(); rr(g, x, y, w, h, 34); g.clip(); g.fillStyle = alpha('#0b1324', 0.9 * ease.out(prog(t, 0.2, 1.0))); g.fillRect(x, y, w, h);
  const A = anat(), p = ease.inOut(prog(t, 0.2, 1.6)); g.translate(E.W / 2, 860); g.scale(0.78, 0.78); g.translate(-E.W / 2, -900);
  drawAnat(g, A, { p, sv: prog(t, tG, tG + 0.4), pr: prog(t, tG, tG + 0.4) });
  if (t > 1.2) { flow(g, A.svFlow, t, { n: 6, speed: 0.6, col: C.amber }); flow(g, A.prFlow, t, { n: 3, speed: 0.8, col: C.teal, r: 6 }); flow(g, A.vas, t, { n: 5, speed: 0.2, kind: 'sperm' }); }
  g.restore();
  label(g, 'GLAND VOLUME', E.W / 2, 180, ease.outBack(prog(t, tG, tG + 0.3)), { size: 64, color: C.gold });
} });

// s023 — "Time, hormones, plumbing..."
registerShot('s023', { draw(g, t, info) {
  blurLayer(g, 12, (g) => bedroom(g, t, { z: 1.3, x: 60, y: -150 })); veil(g, '#05060c', 0.5);
  const ws = [['TIME', 'time', C.gold], ['HORMONES', 'hormones', C.coral], ['PLUMBING', 'plumbing', C.teal]];
  ws.forEach(([s, w, col], i) => { const ts = wt(w, info, 0.2 + i * 0.7), a = ease.outBack(prog(t, ts - 0.05, ts + 0.3)); if (a <= 0) return; const y = 480 + i * 330;
    g.save(); g.translate(E.W / 2, y); g.scale(a, a); text(g, s, 0, 0, { size: 120, color: col, glow: 30, glowColor: alpha(col, 0.7), spacing: 4 }); g.restore();
    const ix = E.W / 2, iy = y + 110; if (i === 0) FX.clock(g, ix, iy + 10, 36, 9 * 3600 + t * 900, {}); if (i === 1) { circle(g, ix, iy + 10, 30, C.gold); text(g, 'T', ix, iy + 12, { size: 36, color: '#3a2a00', font: FONTS.ui, weight: 900 }); } if (i === 2) { seg(g, [[ix - 80, iy], [ix - 20, iy], [ix - 20, iy + 30], [ix + 80, iy + 30]], 14, alpha(C.bp, 0.9)); } });
} });

// s024 — "and almost no sperm."  the cylinder returns; zoom to the cream sliver; Max smirks
registerShot('s024', { draw(g, t, info) {
  UI.blueprint(g); const z = lerp(1, 2.6, ease.inOut(prog(t, 0.3, info.dur))), yb = 1380;
  g.save(); g.translate(E.W / 2, lerp(E.H / 2, yb - 40, ease.inOut(prog(t, 0.3, info.dur)))); g.scale(z, z); g.translate(-E.W / 2, -lerp(E.H / 2, yb - 40, ease.inOut(prog(t, 0.3, info.dur))));
  cylinder(g, E.W / 2, yb, 360, 980, { sperm: 1, prostate: 1, sv: 1 }, { t }); g.restore();
  label(g, 'ALMOST NO SPERM', E.W / 2, 300, ease.outBack(prog(t, 0.4, 0.8)), { size: 58, color: C.cream });
  text(g, '~2–5%', E.W / 2, 400, { size: 80, color: C.gold, font: FONTS.ui, weight: 900, alpha: ease.out(prog(t, 0.6, 1.0)), glow: 18, glowColor: alpha(C.gold, 0.6) });
} });

// s025 — end screen
registerShot('s025', { draw(g, t, info) {
  UI.endScreen(g, t, { question: 'What should we take apart next?', cast: [MAX, ADA] });
  const k = ease.out(prog(t, 0.5, 1.2)); g.save(); g.globalAlpha *= k; cylinder(g, E.W / 2, 1060, 160, 360, { sperm: 1, prostate: 1, sv: 1 }, { t }); g.restore();
  label(g, 'HOW DOES IT WORK?', E.W / 2, 1180, k, { size: 34, color: C.bp });
} });
