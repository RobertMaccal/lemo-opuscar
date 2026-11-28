// YouTube thumbnails rendered from the real simulation (seed 326, 41.9 s: two balls, two tiles,
// the left tile already cracking). ?fmt=short → 1080×1920 (Shorts), ?fmt=wide → 1280×720 (home feed).
import { bake } from '../src/simulation.js';
import { createRenderer } from '../src/renderer.js';
import { DEFAULT_SEED, PITCH, SEAM, GRID } from '../src/config.js';

const qs = new URLSearchParams(location.search);
const FMT = qs.get('fmt') === 'wide' ? 'wide' : 'short';
const SEED = +(qs.get('seed') || DEFAULT_SEED);
const FRAME = Math.round(+(qs.get('t') || 41.9) * 60);
const FONT = '"Space Grotesk", Inter, Arial, sans-serif';
const KEEP = new Set([4, 13]);           // the two tiles still standing at 41.9 s (seed 326)
const CX = 360, CY = 90;                 // world centre of those two tiles

await Promise.all(['500', '700'].map((w) => document.fonts.load(`${w} 80px "Space Grotesk"`)));

const B = bake(SEED);
const scene = document.createElement('canvas');
scene.width = 1080; scene.height = 1920;
const R = createRenderer(scene, B);

const out = document.getElementById('thumb');
const [OW, OH] = FMT === 'wide' ? [1280, 720] : [1080, 1920];
out.width = OW; out.height = OH;
const g = out.getContext('2d');

function fit(text, weight, maxW, maxSize, spacing = 0) {
  let size = maxSize;
  for (; size > 20; size -= 2) {
    g.font = `${weight} ${size}px ${FONT}`; g.letterSpacing = `${spacing}px`;
    if (g.measureText(text).width <= maxW) break;
  }
  return size;
}
function headline(text, x, y, { size, weight = 700, color = '#fff', glow = null, align = 'center', spacing = 0, stroke = 0 }) {
  g.save();
  g.font = `${weight} ${size}px ${FONT}`; g.letterSpacing = `${spacing}px`;
  g.textAlign = align; g.textBaseline = 'alphabetic';
  // dark halo keeps it readable over anything
  g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = size * 0.18; g.shadowOffsetY = size * 0.03;
  g.fillStyle = color; g.fillText(text, x, y);
  if (glow) { g.shadowColor = glow; g.shadowBlur = size * 0.35; g.shadowOffsetY = 0; g.fillText(text, x, y); }
  g.shadowColor = 'transparent';
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = 'rgba(255,255,255,0.18)'; g.strokeText(text, x, y); }
  g.fillText(text, x, y);
  g.restore();
}
// stakes counter in the film's own UI style (true value at this frame: 2 of 100 still alive)
function counter(x, y, scale, align = 'center') {
  g.save();
  g.textAlign = align; g.textBaseline = 'alphabetic';
  g.font = `600 ${Math.round(30 * scale)}px ${FONT}`; g.letterSpacing = `${6 * scale}px`;
  g.fillStyle = '#7fa6b6'; g.fillText('BALLS ALIVE', x + (align === 'center' ? 3 * scale : 0), y);
  g.letterSpacing = '0px';
  g.font = `700 ${Math.round(96 * scale)}px ${FONT}`;
  const big = '2', rest = ' / 100';
  const wb = g.measureText(big).width, wr = g.measureText(rest).width;
  const x0 = align === 'center' ? x - (wb + wr) / 2 : x;
  g.textAlign = 'left';
  g.shadowColor = 'rgba(255,90,40,0.7)'; g.shadowBlur = 28 * scale;
  g.fillStyle = '#ff6a3a'; g.fillText(big, x0, y + 98 * scale);
  g.shadowBlur = 0; g.fillStyle = '#56717e'; g.fillText(rest, x0 + wb, y + 98 * scale);
  g.restore();
}
// faint outlines of the tiles that are already gone: the void used to be a full board
function ghosts(cam, ox, oy) {
  g.save();
  g.setLineDash([10, 9]);
  for (let i = 0; i < GRID * GRID; i++) {
    if (KEEP.has(i)) continue;
    const c = i % GRID, r = (i / GRID) | 0;
    const x = ((c + 0.5) * PITCH - cam.x) * cam.s + 540 + (cam.shx || 0) + ox;
    const y = ((r + 0.5) * PITCH - cam.y) * cam.s + 960 + (cam.shy || 0) + oy;
    const d = Math.hypot(x - (540 + ox + (cam.shx || 0)), y - (960 + oy + (cam.shy || 0)));
    const a = 0.16 * Math.exp(-d / 520);
    if (a < 0.01) continue;
    const half = ((PITCH - SEAM) / 2) * cam.s;
    g.strokeStyle = `rgba(18,232,255,${a})`; g.lineWidth = 2;
    g.beginPath(); g.roundRect(x - half, y - half, half * 2, half * 2, 5 * cam.s); g.stroke();
  }
  g.restore();
}

g.fillStyle = '#000'; g.fillRect(0, 0, OW, OH);

if (FMT === 'short') {
  const cam = { x: CX, y: CY, s: 4.75, shy: -32 };
  R.renderFrame(FRAME, { cam, ui: false });
  g.drawImage(scene, 0, 0);
  ghosts(cam, 0, 0);
  // headline block (top), question (under the scene, above the Shorts title overlay zone)
  let s1 = fit('100 BALLS.', 700, 960, 190, 2);
  headline('100 BALLS.', 540, 215, { size: s1, spacing: 2 });
  let s2 = fit('ONE TILE.', 700, 900, s1, 2);
  headline('ONE TILE.', 540, 215 + s2 * 1.0, { size: s2, color: '#12E8FF', glow: 'rgba(18,232,255,0.65)', spacing: 2 });
  let s3 = fit('WHO SURVIVES?', 700, 980, 128, 1);
  counter(268, 690, 1.0);
  headline('WHO SURVIVES?', 540, 1468, { size: s3, color: '#FFD34D', glow: 'rgba(255,190,60,0.55)', spacing: 1 });
} else {
  const cam = { x: CX, y: CY, s: 3.4 };
  R.renderFrame(FRAME, { cam, ui: false });
  // scene crop (660×720 around the two tiles) on the right
  const cw = 700, sx = 540 - cw / 2 + 6, sy = 960 - 360 - 22;
  const dx = OW - cw;
  g.drawImage(scene, sx, sy, cw, 720, dx, 0, cw, 720);
  ghosts(cam, dx - sx, -sy);
  // soften the seam between text and scene
  const grd = g.createLinearGradient(dx - 40, 0, dx + 90, 0);
  grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(dx - 40, 0, 130, OH);
  const L = 54, maxW = dx - L - 10;
  let s1 = fit('100 BALLS.', 700, maxW, 128, 1);
  const Y = 200;
  headline('100 BALLS.', L, Y, { size: s1, align: 'left', spacing: 1 });
  headline('ONE TILE.', L, Y + s1 * 1.05, { size: fit('ONE TILE.', 700, maxW, s1, 1), color: '#12E8FF', glow: 'rgba(18,232,255,0.65)', align: 'left', spacing: 1 });
  counter(L, Y + s1 * 2.95, 0.78, 'left');
  headline('WHO SURVIVES?', L, Y + s1 * 2.15, { size: fit('WHO SURVIVES?', 700, maxW, 84, 0), color: '#FFD34D', glow: 'rgba(255,190,60,0.55)', align: 'left' });
}

window.THUMB = () => out.toDataURL('image/jpeg', 0.94);
window.READY = true;
