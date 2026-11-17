// THE BRAIN: a separate character. A soft rose cartoon brain (no anatomy beyond clean folds), big eyes, a small mouth,
// tiny ink arms, a gentle glow. Drawn in its own space: (x, y) = centre, s = scale. Every control blends.
import { P, rgba, circ, ell, line, rg, tmp, TAU, clamp, lerp, mix } from './kit.js';
const INK = P.ink, ROSE = '#E5A0A6', ROSE_D = '#C9787F', ROSE_L = '#F6C9C6';

export const BX = {
  casual: { eye: 1, lidT: .38, pup: 1, gx: 0, gy: 0, browH: 0, browA: 0, mS: .45, mO: 0, mW: 1, mWavy: 0, pale: 0, sweat: 0, shake: 0, armL: [-.6, .9], armR: [.6, .9], hands: 0 },
  blink: { lidT: 1 },
  talk: { mO: .35 },
  scared: { eye: 1.35, lidT: 0, pup: .42, gx: 0, gy: .05, browH: 1, browA: .95, mS: -.55, mO: .25, mW: .8, mWavy: .7, pale: .45, sweat: .9, shake: 1, hands: .75 },
  covered: { eye: 1.5, lidT: 0, pup: .32, browH: 1.15, browA: 1, mS: -.6, mO: 0, mW: .6, mWavy: 0, pale: .6, sweat: 1, shake: .6, hands: 1 },
};
export const bmix = (a, b, t) => { const o = { ...a }; for (const k in b) { const va = a[k] ?? BX.casual[k], vb = b[k]; o[k] = Array.isArray(vb) ? vb.map((v, i) => lerp(va[i], v, t)) : lerp(va, vb, t); } return o; };

// outline: a wide, bumpy, slightly flattened oval
function outline(g, rx, ry) {
  const n = 22, pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, bump = 1 + .055 * Math.cos(a * 11) + .02 * Math.sin(a * 5 + 1), flat = Math.sin(a) > 0 ? 1 - .14 * Math.sin(a) ** 2 : 1;
    pts.push([Math.cos(a) * rx * bump, Math.sin(a) * ry * bump * flat]);
  }
  g.beginPath(); g.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
  for (let i = 1; i <= n; i++) { const a = pts[i % n], b = pts[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  g.closePath();
}
const FOLDS = [
  [[-40, -150], [-70, -120], [-55, -95]], [[-120, -120], [-95, -80], [-140, -55]], [[-185, -60], [-150, -40], [-170, 0]],
  [[-90, -60], [-60, -40], [-80, -15]], [[-205, 20], [-180, 45], [-200, 75]],
  [[40, -150], [70, -120], [55, -95]], [[120, -120], [95, -80], [140, -55]], [[185, -60], [150, -40], [170, 0]],
  [[90, -60], [60, -40], [80, -15]], [[205, 20], [180, 45], [200, 75]],
];
function eye(g, ex, ey, rx, ry, e, side, skin) {
  const RY = ry * e.eye, RX = rx * (1 + (e.eye - 1) * .4);
  g.save(); g.beginPath(); g.ellipse(ex, ey, RX, RY, 0, 0, TAU); g.fillStyle = P.white; g.fill(); g.clip();
  const pr = ry * .42 * e.pup, px = ex + e.gx * (RX - pr), py = ey + e.gy * (RY - pr);
  circ(g, px, py, pr, INK); circ(g, px - pr * .34, py - pr * .38, pr * .32, P.white);
  if (e.lidT > .01) { g.fillStyle = skin; g.fillRect(ex - RX * 2, ey - RY * 3, RX * 4, RY * 2 + 2 * RY * Math.min(1, e.lidT)); line(g, ex - RX * 2, ey - RY + 2 * RY * Math.min(1, e.lidT), ex + RX * 2, ey - RY + 2 * RY * Math.min(1, e.lidT), INK, 5); }
  g.restore();
  g.beginPath(); g.ellipse(ex, ey, RX, RY, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 5.5; g.stroke();
  // brow
  const by = ey - RY - 22 - e.browH * 20, L = rx * 1.1;
  const yi = by - e.browA * 16, yo = by + e.browA * 9;
  g.beginPath(); g.moveTo(ex - side * L / 2, yi); g.quadraticCurveTo(ex, (yi + yo) / 2 - 8, ex + side * L / 2, yo); g.lineWidth = 9; g.lineCap = 'round'; g.stroke();
}
function arm(g, sx, sy, hx, hy, k, open) {
  const mx = (sx + hx) / 2 + k * (hy - sy) * .25, my = (sy + hy) / 2 - k * (hx - sx) * .25;
  g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 15; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, hx, hy); g.stroke();
  circ(g, hx, hy, 15, INK);
  if (open) for (const d of [-.7, -.2, .3, .8]) { const a = Math.atan2(hy - my, hx - mx) + d; line(g, hx + Math.cos(a) * 8, hy + Math.sin(a) * 8, hx + Math.cos(a) * 25, hy + Math.sin(a) * 25, INK, 7); }
}
// e = expression/pose (BX blend), m = mouth loudness (−1 silent), t = time (float + tremble)
export function drawBrain(ctx, x, y, s, e, m, t, { glow = 1, rim = '#FFD9E6', alpha = 1 } = {}) {
  const sh = e.shake || 0, jx = sh * (Math.sin(t * 61) * 3 + Math.sin(t * 37) * 2), jy = sh * Math.sin(t * 53) * 2;
  const W = 760 * s, H = 680 * s, g = tmp('brain', W, H);
  g.translate(W / 2 + jx * s, H / 2 + jy * s); g.scale(s, s);
  const skin = mix(ROSE, '#D9CFE6', (e.pale || 0) * .7), rx = 240, ry = 185;
  // body
  outline(g, rx, ry); g.fillStyle = skin; g.fill();
  g.save(); outline(g, rx, ry); g.clip();
  g.fillStyle = rg(g, -90, -110, 20, 380, [rgba(ROSE_L, .9), rgba(skin, 0)]); g.fillRect(-rx - 20, -ry - 20, rx * 2 + 40, ry * 2 + 40);
  g.fillStyle = rg(g, 120, 150, 40, 330, [rgba('#8E5A7A', .45), rgba(skin, 0)]); g.fillRect(-rx - 20, -ry - 20, rx * 2 + 40, ry * 2 + 40);
  // folds
  g.strokeStyle = rgba(mix(ROSE_D, '#8E6A9A', (e.pale || 0) * .6), .95); g.lineWidth = 8; g.lineCap = 'round';
  for (const f of FOLDS) { g.beginPath(); g.moveTo(f[0][0], f[0][1]); g.quadraticCurveTo(f[1][0], f[1][1], f[2][0], f[2][1]); g.stroke(); }
  // the middle groove, top half only
  g.lineWidth = 9; g.beginPath(); g.moveTo(0, -ry - 5); g.quadraticCurveTo(-14, -140, 4, -112); g.quadraticCurveTo(16, -92, 0, -72); g.stroke();
  g.restore();
  outline(g, rx, ry); g.strokeStyle = INK; g.lineWidth = 7; g.lineJoin = 'round'; g.stroke();
  // blush
  if (!e.pale || e.pale < .4) for (const sd of [-1, 1]) { g.globalAlpha = .45 * (1 - (e.pale || 0) * 2); ell(g, sd * 128, 92, 34, 15, '#E07F86'); g.globalAlpha = 1; }
  // eyes
  for (const sd of [-1, 1]) eye(g, sd * 72, 22, 44, 54, e, sd, skin);
  // mouth
  const mo = m > .08 ? .1 + m * .55 : 0, mO = Math.max(e.mO || 0, mo), mw = 34 * e.mW, my = 108;
  g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  if (mO < .05) {
    g.lineWidth = 6.5; g.beginPath();
    if (e.mWavy > .3) { for (let i = 0; i <= 14; i++) { const u = i / 14, xx = -mw + 2 * mw * u, yy = my + Math.sin(u * TAU * 2) * 5 * e.mWavy - e.mS * 6; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } }
    else { g.moveTo(-mw, my - e.mS * 8); g.quadraticCurveTo(0, my + e.mS * 16, mw, my - e.mS * 8); }
    g.stroke();
  } else {
    const h = 60 * mO; g.beginPath(); g.moveTo(-mw, my - e.mS * 6); g.quadraticCurveTo(0, my - h * .25, mw, my - e.mS * 6); g.quadraticCurveTo(mw * .9, my + h, 0, my + h); g.quadraticCurveTo(-mw * .9, my + h, -mw, my - e.mS * 6); g.closePath();
    g.fillStyle = '#4B2136'; g.fill(); g.lineWidth = 6; g.stroke();
  }
  // sweat
  if (e.sweat > .05) {
    g.globalAlpha = clamp(e.sweat * 1.4);
    for (const [dx, dy, k] of [[-210, -60, 1], [214, -10, .8], [180, -120, .6]]) { g.beginPath(); g.moveTo(dx, dy - 26 * k); g.quadraticCurveTo(dx + 16 * k, dy, dx, dy + 12 * k); g.quadraticCurveTo(dx - 16 * k, dy, dx, dy - 26 * k); g.fillStyle = '#C6E6EA'; g.fill(); g.lineWidth = 3.5; g.strokeStyle = P.tealDeep; g.stroke(); }
    g.globalAlpha = 1;
  }
  // tiny arms: rest at the sides, rise to the cheeks when scared, cover the mouth at the end
  const hd = e.hands || 0, wav = Math.sin(t * 2.2) * .12 * (1 - hd);
  const rest = sd => [sd * 300, 120 + Math.sin(t * 1.6 + sd) * 8], cheek = sd => [sd * 150, 70], mouth = sd => [sd * 26, 110];
  for (const sd of [-1, 1]) {
    const r = rest(sd), c = cheek(sd), mm = mouth(sd);
    const u = clamp(hd / .75), v = clamp((hd - .75) / .25);
    const hx = lerp(lerp(r[0], c[0], u), mm[0], v), hy = lerp(lerp(r[1] + wav * 60 * sd, c[1], u), mm[1], v);
    arm(g, sd * 222, 80, hx, hy, sd * (u > .3 ? -1 : 1), u > .4);
  }
  // composite with glow and a rim of light on the upper left
  ctx.save();
  if (glow > 0) { ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .55 * glow * alpha; ctx.fillStyle = rg(ctx, x, y, 40 * s, 520 * s, [rgba('#FF9FC0', .55), rgba('#B07BD8', .18), 'rgba(0,0,0,0)']); ctx.fillRect(x - 600 * s, y - 600 * s, 1200 * s, 1200 * s); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha;
  ctx.drawImage(g.canvas, x - W / 2, y - H / 2);
  ctx.restore();
}
