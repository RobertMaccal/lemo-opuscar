// YouTube thumbnail for ONE MORE SCROLL — three things only: Jeff (hooked, exhausted), the glowing Instickram phone,
// the Stranger in the doorway. Big title, lots of dark space.
import { E, registerShot, blurLayer, veil, alpha, mix, seg, circle, rr, poly, linGrad, radGrad, glow, text, FONTS, rng } from '/engine/core.js';
import { drawFigure, bigFace, POSES } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { phoneBody, logo, wordmark, PHONE } from './film/_kit.js';
import { jeff, STRANGER } from './film/cast.js';

const SLAB = '#d6e6ff', COLDR = '#9fd0ff';
registerShot('thumb', { draw(g, t) {
  // background: deep navy room, a hint of the night city
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0a0f26', '#060814']); g.fillRect(0, 0, E.W, E.H);
  blurLayer(g, 10, (g) => { FX.skyline(g, { x: -40, y: 760, w: 760, minH: 140, maxH: 420, color: '#121a3a', windowColor: 'rgba(255,190,110,.55)', lit: 0.25, seed: 21, minW: 50, maxW: 110 }); });
  // the doorway: a slab of cold light with the Stranger standing in it (the hook)
  const dx = 1500, dw = 260, dy = 150;
  glow(g, dx + dw / 2, 560, 760, '#8fb4ff', 0.22);
  g.fillStyle = linGrad(g, 0, dy, 0, E.H, ['#f2f7ff', SLAB, '#a9c4f0']); g.fillRect(dx, dy, dw, E.H - dy);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(200,220,255,.10)'; poly(g, [[dx, E.H], [dx + dw, E.H], [dx + dw + 300, E.H + 200], [dx - 500, E.H + 200]], g.fillStyle); g.restore();
  g.fillStyle = '#05070f'; g.fillRect(dx - 26, dy - 26, 26, E.H); g.fillRect(dx - 26, dy - 26, dw + 52, 26); g.fillRect(dx + dw, dy - 26, 26, E.H);
  drawFigure(g, { x: dx + dw / 2, y: E.H + 30, s: 3.3, facing: -1, outfit: { ...STRANGER, color: '#080a12', color2: '#080a12', legs: '#05060a' }, pose: POSES.stand, expr: 'calm', featureColor: '#05060a', ink: '#04050a', rim: { color: COLDR, dir: [0, -1], w: 4 }, shadow: false });
  // two faint cold eyes in the silhouette — just enough to unsettle
  const hx = dx + dw / 2 - 12, hy = E.H + 30 - 208 * 3.3;
  for (const ex of [-18, 22]) { circle(g, hx + ex, hy - 6, 7, 'rgba(210,230,255,.85)'); glow(g, hx + ex, hy - 6, 26, '#cfe2ff', 0.5); }
  // JEFF: giant face, wrecked, lit from below by the phone
  const fx = 640, fy = 760, r = 350;
  bigFace(g, fx, fy, r, { outfit: jeff(1), expr: 'exhausted', rimColor: PHONE, rimSide: 1, look: [0.7, 0.35], face: { lid: 0.42, bags: 1, mouth: 'smallSmile', brows: null } });
  for (const sx of [-1, 1]) {   // the feed reflected in his pupils
    const ex = fx + sx * r * 0.34 + 0.7 * r * 0.05, ey = fy - r * 0.16 + 0.35 * r * 0.05;
    rr(g, ex - r * 0.032, ey - r * 0.02, r * 0.064, r * 0.09, 4); g.fillStyle = sx < 0 ? '#ff4fa3' : '#5ff2e8'; g.fill();
  }
  glow(g, fx + 260, fy + 260, 620, PHONE, 0.38);
  // the phone: Instickram, glowing, a notification badge
  g.save(); g.translate(1140, 760); g.rotate(-0.13);
  const pw = 300, ph = 534;
  phoneBody(g, -pw / 2, -ph / 2, pw, ph, (g, x, y, w, h) => {
    g.fillStyle = linGrad(g, x, y, x + w, y + h, ['#1a1040', '#0a0a20']); g.fillRect(x, y, w, h);
    glow(g, 0, -30, 300, '#19d3c5', 0.45);
    logo(g, 0, -40, 1.25, 0.6); wordmark(g, -112, 86, 50);
    for (let i = 0; i < 5; i++) { const rr2 = rng(i + 3); const px = (rr2() - 0.5) * w * 0.7, py = 150 + rr2() * 90; g.save(); g.translate(px, py); g.scale(0.9, 0.9); g.fillStyle = alpha('#ff4f7b', 0.9 - i * 0.12); g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(-26, -8, -12, -30, 0, -14); g.bezierCurveTo(12, -30, 26, -8, 0, 10); g.fill(); g.restore(); }
  }, { edge: alpha(PHONE, 0.7) });
  circle(g, pw / 2 - 6, -ph / 2 + 4, 40, '#ff3b4a'); text(g, '99+', pw / 2 - 6, -ph / 2 + 6, { size: 30, font: FONTS.ui, weight: 900, color: '#ffffff' });
  g.restore();
  glow(g, 1140, 760, 420, PHONE, 0.3);
  // fingers holding it
  for (const [x, y] of [[958, 790], [952, 870], [1312, 700]]) { g.fillStyle = '#0a0b12'; g.beginPath(); g.ellipse(x, y, 30, 46, -0.13, 0, Math.PI * 2); g.fill(); }
  // TITLE
  text(g, 'ONE MORE', 90, 130, { size: 150, font: FONTS.title, weight: 700, color: '#ffffff', align: 'left', stroke: 18, strokeColor: '#05060c', spacing: 4 });
  text(g, 'SCROLL', 84, 285, { size: 200, font: FONTS.title, weight: 700, color: '#7fe4ff', align: 'left', stroke: 20, strokeColor: '#05060c', glow: 40, glowColor: 'rgba(80,200,255,.9)', spacing: 6 });
  text(g, 'SCROLL', 84, 285, { size: 200, font: FONTS.title, weight: 700, color: '#bdf2ff', align: 'left', spacing: 6 });
} });
