// Click thumbnails: a before / after split. Warm, smug, FINISHED FIRST — then cold, horrified, the blank PART B circled.
import { P, F, mix, rgba, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, dust, bloom, vignette, paperGrain, wash } from './kit.js';
import { drawChar, pose, solve } from './rig.js';
import { X, CAND } from './cast.js';
import { mkL } from './shots.js';
import { examSheet } from './inserts.js';

const WARM = mkL(-.75, .6, { rim: '#FFE6A8', rimW: 9, rimA: 1, shadeA: .28, shadeW: 22, shadow: null });
const COLD = mkL(.3, .9, { rim: '#BFD0FF', rimW: 9, rimA: 1, shadeA: .4, shadeW: 26, shade: '#1E2448', shadow: null });
// a bust: the head centred on (cx, cy) with radius R px, body below it
function bust(g, p, cx, cy, R, L, opt = {}) {
  const s = R / CAND.R, J = solve(CAND, p);
  drawChar(g, CAND, { ...p, x: cx - J.hc[0] * s, y: cy - J.hc[1] * s, s }, L, { noShadow: true, ...opt });
}
const smug = () => pose(CAND, { face: .12, head: { tilt: .1, turn: .05 }, shrug: -.1, e: { ...X.cocky, gx: .1, gy: 0, mO: .18, lidT: .18 },
  aR: { to: [150, -420], k: 1, z: 1, hand: 'thumb' }, aL: { a: -.1, b: .1 } });
const horror = () => pose(CAND, { face: -.05, head: { tilt: -.05 }, shrug: 1.2, sq: -.08, e: { ...X.horror, eyeOpen: 1.75, pup: .17, mO: .95, mW: .7, gx: .12, gy: -.05, sweat: 1, pale: .55, gloom: .45 },
  aL: { to: [-80, -330], k: 1, z: 1, hand: 'open' }, aR: { to: [90, -340], k: -1, z: 1, hand: 'open' } });
// big punchy text with an ink outline and a drop shadow
function shout(g, s, x, y, size, col, o = {}) {
  g.save(); g.translate(x, y); g.rotate(o.rot || 0);
  g.font = `${size}px ${F.title}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; if (o.ls) g.letterSpacing = o.ls + 'px';
  g.lineJoin = 'round'; g.fillStyle = rgba('#0B0A18', .55); g.fillText(s, size * .05, size * .08);
  g.strokeStyle = '#140F26'; g.lineWidth = size * .2; g.strokeText(s, 0, 0); g.fillStyle = col; g.fillText(s, 0, 0); g.restore();
}
function words(g, parts, x, y, size, o = {}) {        // [[text, colour], …] on one line, centred on x
  g.save(); g.font = `${size}px ${F.title}`; const sp = size * .22; const ws = parts.map(([s]) => g.measureText(s).width); g.restore();
  let cx = x - (ws.reduce((a, b) => a + b, 0) + sp * (parts.length - 1)) / 2;
  parts.forEach(([s, c], i) => { shout(g, s, cx + ws[i] / 2, y, size, c, o); cx += ws[i] + sp; });
}
function redRing(g, x, y, rx, ry, rot = 0, w = 16) {
  g.save(); g.translate(x, y); g.rotate(rot); g.lineCap = 'round';
  for (const [col, lw] of [['#FFFFFF', w + 12], ['#E32626', w]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, -.2, TAU - .5); g.stroke(); }
  g.restore();
}
function redArrow(g, x0, y0, x1, y1, bend = 80, w = 26) {
  const mx = (x0 + x1) / 2 + bend, my = (y0 + y1) / 2 - bend * .4, a = Math.atan2(y1 - my, x1 - mx), hl = w * 2.4;
  const ex = x1 - Math.cos(a) * hl * .7, ey = y1 - Math.sin(a) * hl * .7;
  for (const [col, lw, k] of [['#FFFFFF', w + 14, 9], ['#E32626', w, 0]]) {
    g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    g.fillStyle = col; g.beginPath(); const h = hl + k, b = w * 1.6 + k;
    g.moveTo(x1 + Math.cos(a) * k * .7, y1 + Math.sin(a) * k * .7); g.lineTo(x1 - Math.cos(a) * h - Math.sin(a) * b, y1 - Math.sin(a) * h + Math.cos(a) * b); g.lineTo(x1 - Math.cos(a) * h + Math.sin(a) * b, y1 - Math.sin(a) * h - Math.cos(a) * b); g.closePath(); g.fill();
  }
}
function warmBg(g, W, H) {
  g.fillStyle = lg(g, 0, 0, W, H, ['#FFE2A0', '#F5B860', '#D9844A']); g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 9; i++) { g.globalAlpha = .12; g.fillStyle = '#FFF6D8'; g.beginPath(); g.moveTo(-100, -100); g.lineTo(W * (.1 + i * .14), H * 1.2); g.lineTo(W * (.16 + i * .14), H * 1.2); g.closePath(); g.fill(); } g.restore();
  g.fillStyle = rg(g, W * .2, H * .1, 10, Math.max(W, H) * .8, ['rgba(255,250,225,.75)', 'rgba(255,250,225,0)']); g.fillRect(0, 0, W, H);
}
function coldBg(g, W, H) {
  g.fillStyle = lg(g, 0, 0, W, H, ['#3C4A80', '#202848', '#0E1226']); g.fillRect(0, 0, W, H);
  g.strokeStyle = rgba('#AFC0F0', .08); g.lineWidth = 6; for (let x = -H; x < W + H; x += 46) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H * .25, H); g.stroke(); }
  g.fillStyle = rg(g, W * .5, H * .45, 10, Math.max(W, H) * .7, ['rgba(150,175,255,.35)', 'rgba(150,175,255,0)']); g.fillRect(0, 0, W, H);
}
// clip helpers for the diagonal split
const clipPoly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); };
function seam(g, a, b) { // a jagged, glowing tear between the two halves
  const n = 9, pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(a[0], b[0], u) + (i % 2 ? 1 : -1) * (i && i < n ? 22 : 0), lerp(a[1], b[1], u) + (i % 2 ? -1 : 1) * (i && i < n ? 22 : 0)]); }
  for (const [col, w] of [['#140F26', 30], ['#FFFFFF', 12]]) { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'miter'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
}

// ---------- vertical cover (Reels / Shorts / TikTok), 1080×1920 ----------
export function thumbV(g, t, W, H) {
  const A = [0, 1010], B = [W, 830];
  // BEFORE (top): warm, smug, thumbs up
  g.save(); clipPoly(g, [[0, 0], [W, 0], B, A]);
  warmBg(g, W, H); dust(g, 3, 0, 0, W, 900, 40, 5, '#FFF6D8', .8);
  bust(g, smug(), 560, 625, 205, WARM);
  g.restore();
  // AFTER (bottom): cold, horrified, the blank back of the sheet circled
  g.save(); clipPoly(g, [A, B, [W, H], [0, H]]);
  coldBg(g, W, H); wash(g, W, H, '#4A5A9A', .18, 'multiply');
  g.save(); g.translate(735, 1345); g.rotate(.06); examSheet(g, 0, 0, 560, 'back', { paper: '#FFFDF6' }); g.restore();
  bust(g, horror(), 330, 1450, 245, COLD);
  redRing(g, 748, 1052, 335, 98, .06, 15);
  redArrow(g, 470, 1250, 560, 1150, -60, 22);
  g.restore();
  seam(g, A, B);
  // text: the setup on top, the punchline at the bottom
  words(g, [['HE', '#FFFFFF'], ['FINISHED', '#FFFFFF']], 540, 140, 128, { rot: -.035 });
  words(g, [['FIRST.', '#FFD23F']], 540, 290, 168, { rot: -.035 });
  words(g, [['WHAT', '#FFFFFF'], ['OTHER', '#FF4A3D']], 540, 1720, 150, { rot: -.03 });
  words(g, [['PAGE?!', '#FFFFFF']], 540, 1855, 150, { rot: -.03 });
  bloom(g, W, H, .16); vignette(g, W, H, .35, P.night, .5, .5, .45); paperGrain(g, W, H, .08);
}
// ---------- landscape (YouTube), 1280×720 ----------
export function thumbH(g, t, W, H) {
  const A = [600, 0], B = [700, H];
  g.save(); clipPoly(g, [[0, 0], A, B, [0, H]]);
  warmBg(g, W, H); dust(g, 3, 0, 0, 640, H, 30, 5, '#FFF6D8', .8);
  bust(g, smug(), 330, 330, 128, WARM);
  g.restore();
  g.save(); clipPoly(g, [A, [W, 0], [W, H], B]);
  coldBg(g, W, H); wash(g, W, H, '#4A5A9A', .18, 'multiply');
  g.save(); g.translate(1110, 300); g.rotate(.14); examSheet(g, 0, 0, 300, 'back', { paper: '#FFFDF6' }); g.restore();
  bust(g, horror(), 900, 420, 150, COLD);
  redRing(g, 1112, 128, 160, 46, .14, 11);
  g.restore();
  seam(g, A, B);
  shout(g, 'FINISHED', 300, 520, 92, '#FFFFFF', { rot: -.04 }); shout(g, 'FIRST', 300, 618, 104, '#FFD23F', { rot: -.04 });
  words(g, [['WHAT', '#FFFFFF'], ['OTHER', '#FF4A3D'], ['PAGE?!', '#FFFFFF']], 975, 652, 66, { rot: -.03 });
  bloom(g, W, H, .16); vignette(g, W, H, .3, P.night, .5, .5, .5); paperGrain(g, W, H, .07);
}
