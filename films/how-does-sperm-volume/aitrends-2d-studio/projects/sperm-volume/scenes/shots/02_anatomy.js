// 02_anatomy.js — s007–s012: the clinical blueprint body. Colours: cream = sperm, amber = seminal vesicles, teal = prostate, coral = failure.
import { linGrad, E, V, registerShot, ease, prog, key, clamp, lerp, wordTime, glow, alpha, text, FONTS, seg, circle, ring, rr, poly } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { C, anat, drawAnat, flow, label, magnifier, cylinder, sperm, pathPt, smooth, strokePath } from '../sets/_kit.js';
const wt = (w, info, d = 0) => (wordTime(w, info.shot.start) ?? info.shot.start + d) - info.shot.start;
const camT = (g, z, fx, fy, fn) => { g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-fx, -fy); fn(); g.restore(); };

// s007 — "Sperm are made in the testes, then stored in a coiled tube, the epididymis."
registerShot('s007', { draw(g, t, info) {
  UI.blueprint(g); const A = anat(); const tT = wt('testes', info, 1.0), tE = wt('epididymis', info, 3.2);
  const z = lerp(0.95, 1.05, ease.inOut(t / info.dur));
  camT(g, z, E.W / 2, 900, () => { drawAnat(g, A, { p: ease.inOut(prog(t, 0, 1.6)), testis: prog(t, tT, tT + 0.4) }); });
  // magnifier on the testis: sperm forming and sliding into the epididymis
  const ma = ease.out(prog(t, tT - 0.1, tT + 0.4)), mx = E.W / 2 + 230, my = 520, mr = 250;
  magnifier(g, mx, my, mr, ma, () => {
    UI.blueprint(g); g.save(); g.translate(mx, my);
    g.strokeStyle = C.bp; g.lineWidth = 4; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-60 + i * 8, -40 + i * 26, 70, 18, 0.2, 0, 7); g.stroke(); }   // seminiferous loops
    const coil = smooth([[90, -150], [130, -80], [110, 0], [140, 80], [100, 160]], 10); strokePath(g, coil, 34, alpha(C.bp, 0.22)); strokePath(g, coil, 3, C.bp);
    for (let i = 0; i < 10; i++) { const u = ((i / 10 + t * 0.18) % 1); const q = u < 0.45 ? [-110 + u / 0.45 * 190, -40 + Math.sin(i) * 60] : pathPt(coil, (u - 0.45) / 0.55); sperm(g, q[0], q[1], u < 0.45 ? 0 : 1.4, t + i, 0.9); }
    g.restore(); });
  seg(g, [[E.W / 2 + 40, 1260], [mx - 120, my + mr - 30]], 2, alpha(C.bp, 0.6 * ma));
  label(g, 'TESTIS', E.W / 2 + 10, 1440, ease.out(prog(t, tT, tT + 0.3)), { size: 34 });
  label(g, 'EPIDIDYMIS', mx, my + mr + 50, ease.out(prog(t, tE, tE + 0.3)), { size: 34, color: C.cream });
  if (t > tE) flow(g, smooth(anat().epi, 8), t, { n: 6, speed: 0.3, kind: 'sperm' });
} });

// s008 — "But most of the fluid comes from the seminal vesicles, tucked behind the bladder."
registerShot('s008', { draw(g, t, info) {
  UI.blueprint(g); const A = anat(); const tS = wt('seminal', info, 2.2), tB = wt('bladder', info, 3.6);
  const fy = lerp(1150, 700, ease.inOut(prog(t, 0, 2.0))), z = lerp(1.0, 1.3, ease.inOut(prog(t, 0.4, info.dur)));
  camT(g, z, E.W / 2 - 40, fy, () => {
    drawAnat(g, A, { p: 1, sv: ease.out(prog(t, tS, tS + 0.6)) });
    flow(g, A.vas, t, { n: 10, speed: 0.12, kind: 'sperm', from: 0, to: 0.7 });
    if (t > tB - 0.2) { const k = 0.5 + 0.5 * Math.sin(t * 6); ring(g, A.bladder.x, A.bladder.y, A.bladder.rx * 1.04, 3, alpha(C.cream, 0.4 * k)); }
  });
  label(g, 'SEMINAL VESICLES', E.W / 2, 330, ease.out(prog(t, tS, tS + 0.35)), { size: 46, color: C.amber });
  label(g, 'BEHIND THE BLADDER', E.W / 2, 395, ease.out(prog(t, tB, tB + 0.35)), { size: 30, color: C.cream });
} });

// s009 — "They supply roughly two thirds of it, packed with fructose, a sugar that fuels sperm."  split: gland macro (top) + cylinder (bottom)
function hexI(g, x, y, r, a) { const p = []; for (let i = 0; i < 6; i++) p.push([x + Math.cos(i * Math.PI / 3) * r, y + Math.sin(i * Math.PI / 3) * r]); g.save(); g.globalAlpha *= a; poly(g, p, alpha('#fff1c8', 0.9)); g.strokeStyle = '#b86b00'; g.lineWidth = 3; g.beginPath(); p.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.stroke(); g.restore(); }
registerShot('s009', { draw(g, t, info) {
  UI.blueprint(g); const tS = wt('supply', info, 0.3), tTh = wt('thirds', info, 1.0), tF = wt('fructose', info, 2.2), tFu = wt('fuels', info, 3.6);
  // top: macro of amber fluid with fructose hexagons
  g.save(); rr(g, 70, 170, E.W - 140, 620, 30); g.clip(); g.fillStyle = linGrad(g, 0, 170, 0, 790, ['#7a4a0a', '#b8741a', '#5a3404']); g.fillRect(0, 0, E.W, E.H);
  glow(g, E.W / 2, 480, 600, '#ffd27a', 0.5);
  for (let i = 0; i < 16; i++) { const x = 120 + ((i * 97 + t * 30) % (E.W - 240)), y = 230 + ((i * 53) % 500) + Math.sin(t * 2 + i) * 14; hexI(g, x, y, 22, ease.out(prog(t, tF - 0.2 + i * 0.03, tF + 0.2 + i * 0.03))); }
  const sx = lerp(160, E.W - 260, prog(t, tF, tFu + 0.8)), boost = t > tFu ? 1 : 0;
  sperm(g, sx, 520 + Math.sin(t * (boost ? 16 : 6)) * 16, 0, t * (boost ? 2.4 : 1), 2.2);
  if (boost) FX.speedLines(g, t, { cx: sx, cy: 520, count: 18, a: 0.2, inner: 60 });
  g.restore(); g.strokeStyle = C.bp; g.lineWidth = 4; rr(g, 70, 170, E.W - 140, 620, 30); g.stroke();
  label(g, 'FRUCTOSE = FUEL', E.W / 2, 830, ease.out(prog(t, tF, tF + 0.3)), { size: 36, color: C.amber });
  // bottom: the cylinder fills amber to two thirds
  const f = ease.inOut(prog(t, tS, tTh + 0.6));
  cylinder(g, E.W / 2, 1450, 300, 520, { sperm: 1, sv: f }, { t });
  const la = ease.outBack(prog(t, tTh, tTh + 0.35)); if (la > 0) text(g, '~2/3', E.W / 2 + 270, 1180, { size: 80 * la, color: C.gold, font: FONTS.ui, weight: 900, glow: 18, glowColor: alpha(C.gold, 0.6) });
} });

// s010 — "The prostate adds most of the rest: a thin, zinc-rich fluid full of enzymes."
registerShot('s010', { draw(g, t, info) {
  UI.blueprint(g); const A = anat(); const tP = wt('prostate', info, 0.3), tA = wt('adds', info, 0.9), tZ = wt('zinc', info, 2.6), tEn = wt('enzymes', info, 4.0);
  camT(g, 1.45 + 0.05 * t / info.dur, E.W / 2 + 20, 800, () => { drawAnat(g, A, { p: 1, sv: 0.35, pr: ease.out(prog(t, tP, tP + 0.5)) }); if (t > tA) flow(g, A.prFlow, t, { n: 5, speed: 0.6, col: C.teal, r: 6 }); });
  label(g, 'PROSTATE', E.W / 2, 300, ease.out(prog(t, tP, tP + 0.3)), { size: 48, color: C.teal });
  // Zn tile + enzyme "scissors"
  const za = ease.outBack(prog(t, tZ, tZ + 0.35)); if (za > 0) { g.save(); g.translate(170, 420); g.scale(za, za); rr(g, -60, -60, 120, 120, 14); g.fillStyle = '#123a34'; g.fill(); g.strokeStyle = C.teal; g.lineWidth = 4; g.stroke(); text(g, '30', -38, -36, { size: 20, color: C.teal, font: FONTS.ui, weight: 900 }); text(g, 'Zn', 0, 8, { size: 56, color: '#d9fff6', font: FONTS.ui, weight: 900 }); g.restore(); }
  const ea = ease.outBack(prog(t, tEn, tEn + 0.35)); if (ea > 0) for (let i = 0; i < 3; i++) { g.save(); g.translate(E.W - 150 - i * 70, 400 + i * 50); g.scale(ea, ea); g.rotate(Math.sin(t * 4 + i) * 0.3); ring(g, -10, 10, 10, 4, C.teal); ring(g, 10, 10, 10, 4, C.teal); seg(g, [[-6, 2], [16, -28]], 4, C.teal); seg(g, [[6, 2], [-16, -28]], 4, C.teal); g.restore(); }
  // inset cylinder
  cylinder(g, E.W - 150, 1440, 150, 300, { sperm: 1, sv: 1, prostate: ease.inOut(prog(t, tA, tA + 1.6)) }, { t });
} });

// s011 — "At release, the streams merge. A muscle ring seals the bladder."
function neckRing(g, A, k, col) { const [x, y] = A.neck; g.strokeStyle = col; g.lineWidth = 10; g.beginPath(); g.ellipse(x, y, lerp(46, 14, k), 12, 0, 0, 7); g.stroke(); glow(g, x, y, 70, col, 0.4 * k); }
registerShot('s011', { draw(g, t, info) {
  UI.blueprint(g); const A = anat(); const tM = wt('merge', info, 1.2), tS = wt('seals', info, 2.8);
  camT(g, 1.25 + 0.06 * t / info.dur, E.W / 2 + 40, 900, () => {
    drawAnat(g, A, { p: 1, sv: 0.6, pr: 0.6 });
    // nerve pulses
    for (let i = 0; i < 3; i++) { const u = ((t * 0.7 + i / 3) % 1); const q = pathPt(A.vas, 0.4 + u * 0.55); glow(g, q[0], q[1], 30, '#ffffff', 0.7); }
    if (t > tM - 0.4) { flow(g, A.svFlow, t, { n: 8, speed: 0.7, col: C.amber, r: 7 }); flow(g, A.prFlow, t, { n: 4, speed: 0.9, col: C.teal, r: 6 }); flow(g, A.vas, t, { n: 6, speed: 0.4, kind: 'sperm', from: 0.85, to: 1 });
      const mixA = ease.out(prog(t, tM, tM + 0.6)); for (let i = 0; i < 12; i++) { const u = ((i / 12 + t * 0.55) % 1), q = pathPt(A.out, u); const c = [C.amber, C.teal, C.cream][i % 3]; glow(g, q[0], q[1], 22, c, 0.5 * mixA); circle(g, q[0], q[1], 6, alpha(c, mixA)); }
      const [ox, oy] = A.out[A.out.length - 1]; poly(g, [[ox + 40, oy + 10], [ox + 4, oy - 14], [ox + 4, oy + 30]], alpha(C.cream, mixA)); }
    neckRing(g, A, ease.outBack(prog(t, tS, tS + 0.25)), t > tS ? C.cream : alpha(C.bp, 0.7));
  });
  label(g, 'STREAMS MERGE', E.W / 2, 300, ease.out(prog(t, tM, tM + 0.3)), { size: 40, color: C.cream });
  label(g, 'BLADDER SEALED', E.W / 2, 370, ease.out(prog(t, tS, tS + 0.3)), { size: 34, color: C.bp });
} });

// s012 — "If it fails, semen flows backward."  coral FAIL view: ring open, stream curls up into the bladder
registerShot('s012', { draw(g, t, info) {
  UI.blueprint(g); const A = anat(); const tF = wt('fails', info, 0.4), tB = wt('backward', info, 1.6);
  const open = ease.out(prog(t, tF, tF + 0.3));
  camT(g, 1.5, E.W / 2 + 30, 760, () => {
    drawAnat(g, A, { p: 1, sv: 0.4, pr: 0.4 });
    neckRing(g, A, 1 - open, open > 0.5 ? C.coral : C.cream);
    if (t > tF) { const back = smooth([[A.neck[0], 900], [A.neck[0] + 4, 820], [A.neck[0] - 30, 720], [A.neck[0] + 40, 640], [A.neck[0] - 10, 580]], 10);
      for (let i = 0; i < 12; i++) { const u = ((i / 12 + t * 0.5) % 1) * ease.out(prog(t, tF, tB + 0.5)); const q = pathPt(back, u); const c = [C.amber, C.teal, C.cream][i % 3]; circle(g, q[0], q[1], 6, c); glow(g, q[0], q[1], 20, c, 0.4); }
      strokePath(g, back, 6, alpha(C.coral, 0.8), ease.out(prog(t, tB - 0.2, tB + 0.6))); const tip = pathPt(back, ease.out(prog(t, tB - 0.2, tB + 0.6))); circle(g, tip[0], tip[1], 12, C.coral); }
  });
  // FAIL badge + "LESS COMES OUT" mini cylinder
  const fa = ease.outBack(prog(t, tF, tF + 0.3)); if (fa > 0) { g.save(); g.translate(E.W / 2, 300); g.scale(fa, fa); rr(g, -150, -50, 300, 100, 20); g.fillStyle = alpha(C.coral, 0.2); g.fill(); g.strokeStyle = C.coral; g.lineWidth = 5; g.stroke(); text(g, 'FAIL', 0, 4, { size: 64, color: C.coral, font: FONTS.ui, weight: 900, spacing: 6 }); g.restore(); }
  cylinder(g, E.W - 150, 1440, 150, 300, { sperm: 1, sv: lerp(1, 0.45, ease.inOut(prog(t, tB, info.dur))), prostate: lerp(1, 0.45, ease.inOut(prog(t, tB, info.dur))) }, { t });
  label(g, 'RETROGRADE', E.W / 2, 1480, ease.out(prog(t, tB, tB + 0.3)), { size: 34, color: C.coral });
} });
