// Instagram Reels cover. Safe zone: centre 1080x1350 (y 285..1635).
import { E, registerShot, mood, glow, alpha, text, FONTS, seg, circle, ring, rr, poly, linGrad, radGrad, veil, blurLayer, lerp } from '/engine/core.js';
import { bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { C, cylinder, sperm } from '../sets/_kit.js';
import { bedroom } from '../sets/rooms.js';
import { MAX } from '../cast.js';
registerShot('thumb', { draw(g, t) {
  const W = E.W, H = E.H, T = 0.9;
  // background: blueprint grid melting into a hot amber spotlight behind the cylinder
  UI.blueprint(g, { a: 0.09 });
  glow(g, 690, 1200, 900, '#ff9a3c', 0.45); glow(g, 690, 1200, 520, '#ffd27a', 0.35); glow(g, 180, 1500, 600, '#3a6bff', 0.35);
  FX.godRays(g, 690, 1200, { count: 16, angle: -Math.PI / 2, spread: Math.PI * 2, len: 1300, a: 0.06, t: 0.4, color: '#ffe2a8' });
  FX.dust(g, 1.3, { count: 70, color: '#ffe6c0', a: 0.5 });
  // hero cylinder (tilted slightly for energy)
  g.save(); g.translate(690, 1225); g.rotate(0.05); g.translate(-690, -1225);
  cylinder(g, 690, 1545, 330, 640, { sperm: 1, prostate: 1, sv: 1 }, { t: T });
  g.restore();
  // red "clickbait" circle + arrow on the tiny sperm sliver
  g.save(); g.strokeStyle = '#ff2d2d'; g.lineWidth = 16; g.lineCap = 'round'; g.shadowColor = 'rgba(255,40,40,.8)'; g.shadowBlur = 30;
  g.beginPath(); g.ellipse(712, 1516, 215, 66, 0.06, 0.2, Math.PI * 2 + 0.05); g.stroke(); g.restore();
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 20;
  seg(g, [[975, 1290], [915, 1430]], 22, '#ff2d2d'); poly(g, [[865, 1410], [960, 1425], [900, 1490]], '#ff2d2d'); g.restore();
  for (let i = 0; i < 5; i++) { const x = 590 + i * 52, y = 1522 + (i % 2) * 8; glow(g, x, y, 26, '#000000', 0.0); sperm(g, x, y, i % 2 ? 0.2 : Math.PI - 0.2, T + i, 1.05, '#1a1206'); }
  text(g, 'SPERM', 712, 1618, { size: 58, color: '#ffffff', font: FONTS.ui, weight: 900, spacing: 6, stroke: 14, strokeColor: '#b00000' });
  text(g, '2–5%', 930, 1240, { size: 76, color: C.gold, font: FONTS.ui, weight: 900, stroke: 14, strokeColor: '#1a0f00', glow: 24, glowColor: alpha(C.gold, 0.7) });
  // Max: giant shocked face, bottom-left, looking at the sliver
  bigFace(g, 200, 1330, 245, { outfit: MAX, expr: 'shocked', look: [0.9, 0.5], rimColor: '#ffc68a', rimSide: 1, tilt: -0.12 });
  // headline
  text(g, '95%', W / 2, 470, { size: 300, color: C.gold, weight: 700, stroke: 26, strokeColor: '#2a1400', glow: 50, glowColor: 'rgba(255,170,40,.9)', spacing: 6 });
  text(g, 'IS NOT SPERM?!', W / 2, 680, { size: 132, color: '#ffffff', weight: 700, stroke: 24, strokeColor: '#0b0b18', glow: 30, glowColor: 'rgba(120,170,255,.7)', spacing: 2 });
  rr(g, W / 2 - 330, 770, 660, 74, 37); g.fillStyle = '#ff2d2d'; g.fill();
  text(g, 'THE "VOLUME" MYTH', W / 2, 808, { size: 44, color: '#ffffff', font: FONTS.ui, weight: 900, spacing: 4 });
} });
