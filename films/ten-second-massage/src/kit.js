// Drawing kit: palette, colour maths, shapes, pooled offscreen canvases, texture, post.
import { clamp, lerp, mulberry } from '/core/lib.js';
export { clamp, lerp };
export const TAU = Math.PI * 2;

// ---- palette (the film's fixed colour world) ----
export const P = {
  ink: '#221E3A', inkSoft: '#34304F', indigo: '#2B2752', night: '#1A1730',
  cream: '#F6EAD0', paper: '#FBF4E2', bone: '#EDE0C4', sand: '#E2CFA8',
  teal: '#5E9A97', tealDeep: '#3D7572', tealDark: '#2C5756', tealLight: '#A8CDC4', mint: '#CFE3D6',
  lav: '#A79BC4', lavLight: '#CFC6E0', lavDeep: '#6E648F', plum: '#4A3F6B',
  orange: '#F2A65A', sun: '#FFCB7A', gold: '#FFDFA0', amber: '#E8843C', rust: '#C8643A', rose: '#E8A28C',
  wood: '#B8825A', woodDark: '#8A5C3E', woodLight: '#D9A878', cork: '#C99B6B',
  you: '#30508F', jack: '#6F9C6B', burg: '#8C3B4A', butter: '#E6C374',
  skin: '#F8ECD6', white: '#FFFDF6',
};

// ---- colour maths ----
const h2 = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const hx = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const _mix = new Map();
export function mix(a, b, t) {
  const k = a + b + (Math.round(t * 200));
  let v = _mix.get(k); if (v) return v;
  const A = h2(a), B = h2(b); v = hx([0, 1, 2].map(i => lerp(A[i], B[i], t)));
  _mix.set(k, v); return v;
}
export const dark = (c, t = .25) => mix(c, P.night, t);
export const lite = (c, t = .25) => mix(c, '#FFF3D6', t);
export const rgba = (c, a) => { const A = h2(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };

// ---- paths ----
export function rr(c, x, y, w, h, r = 8) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
export function poly(c, pts) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
export function fillR(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
export function fillRR(c, x, y, w, h, r, col) { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
export function quad(c, a, b, d, e, col) { poly(c, [a, b, d, e]); c.fillStyle = col; c.fill(); }
export function circ(c, x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); }
export function ell(c, x, y, rx, ry, col, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); c.fillStyle = col; c.fill(); }
export function line(c, x0, y0, x1, y1, col, w = 2, cap = 'round') {
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap; c.stroke();
}
export function lg(c, x0, y0, x1, y1, stops) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((s, i) => Array.isArray(s) ? g.addColorStop(s[0], s[1]) : g.addColorStop(i / (stops.length - 1), s)); return g;
}
export function rg(c, x, y, r0, r1, stops) {
  const g = c.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach((s, i) => Array.isArray(s) ? g.addColorStop(s[0], s[1]) : g.addColorStop(i / (stops.length - 1), s)); return g;
}

// ---- pooled offscreen canvases (deterministic: always cleared on request) ----
const pool = new Map();
export function tmp(id, w, h) {
  w = Math.max(2, Math.ceil(w)); h = Math.max(2, Math.ceil(h));
  let cv = pool.get(id);
  if (!cv) { cv = document.createElement('canvas'); pool.set(id, cv); }
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.clearRect(0, 0, w, h); return c;
}

// ---- text ----
export const F = { title: "'Lilita One'", hand: "'Patrick Hand'", script: "'Caveat'", ui: "'Fredoka'" };
export function text(c, s, x, y, { size = 40, font = F.title, col = P.ink, align = 'center', base = 'middle', weight = '', ls = 0, rot = 0, stroke = null, sw = 0, alpha = 1 } = {}) {
  c.save(); c.translate(x, y); if (rot) c.rotate(rot);
  c.font = `${weight} ${size}px ${font}`; c.textAlign = align; c.textBaseline = base; c.globalAlpha *= alpha;
  if (ls) c.letterSpacing = ls + 'px';
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.lineJoin = 'round'; c.strokeText(s, 0, 0); }
  c.fillStyle = col; c.fillText(s, 0, 0); c.restore();
}
export function textW(c, s, size, font = F.title, ls = 0) { c.save(); c.font = `${size}px ${font}`; if (ls) c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.restore(); return w; }

// ---- texture: one static paper/grain tile (film grain proper is added in ffmpeg) ----
let grainCv = null;
function grainTile() {
  if (grainCv) return grainCv;
  const n = 512; grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = n;
  const c = grainCv.getContext('2d'), im = c.createImageData(n, n), r = mulberry(7781);
  for (let i = 0; i < n * n; i++) {
    const v = 128 + (r() - .5) * 70 + (r() < .012 ? (r() - .5) * 120 : 0);
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255;
  }
  c.putImageData(im, 0, 0); return grainCv;
}
export function paperGrain(c, W, H, a = .16) {
  c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = a;
  c.fillStyle = c.createPattern(grainTile(), 'repeat'); c.fillRect(0, 0, W, H); c.restore();
}

// ---- post ----
export function vignette(c, W, H, a = .5, col = P.night, cx = .5, cy = .5, inner = .35) {
  c.save(); c.globalCompositeOperation = 'multiply';
  const R = Math.hypot(W, H) * .62;
  c.fillStyle = rg(c, W * cx, H * cy, R * inner, R, [[0, 'rgba(255,255,255,1)'], [1, mix('#FFFFFF', col, a)]]);
  c.fillRect(0, 0, W, H); c.restore();
}
// soft filmic bloom: blurred quarter-size copy screened back
export function bloom(c, W, H, a = .22, blur = 14) {
  const q = tmp('bloom', W / 4, H / 4); q.filter = `blur(${blur / 4}px) brightness(1.05)`; q.drawImage(c.canvas, 0, 0, W / 4, H / 4);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'screen'; c.globalAlpha = a; c.drawImage(q.canvas, 0, 0, W, H); c.restore();
}
// colour wash over the whole frame (grade)
export function wash(c, W, H, col, a, op = 'soft-light') { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = op; c.globalAlpha = a; c.fillStyle = col; c.fillRect(0, 0, W, H); c.restore(); }

// ---- light helpers ----
// a slanted patch of window light (parallelogram) with mullion gaps; drawn additively
export function lightPatch(c, x, y, w, h, skew, { cols = 2, rows = 3, gap = 10, col = P.sun, a = .5, op = 'screen' } = {}) {
  c.save(); c.globalCompositeOperation = op; c.globalAlpha = a; c.fillStyle = col;
  const cw = (w - gap * (cols - 1)) / cols, ch = (h - gap * (rows - 1)) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = x + i * (cw + gap), y0 = y + j * (ch + gap), s0 = skew * (y0 - y) / h, s1 = skew * (y0 + ch - y) / h;
    poly(c, [[x0 + s0, y0], [x0 + cw + s0, y0], [x0 + cw + s1, y0 + ch], [x0 + s1, y0 + ch]]); c.fill();
  }
  c.restore();
}
// volumetric shaft: a soft gradient quad
export function shaft(c, pts, col = P.sun, a = .18, blur = 18) {
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = a; c.filter = `blur(${blur}px)`; poly(c, pts); c.fillStyle = col; c.fill(); c.restore();
}
// floating dust motes inside a region, drifting with t
export function dust(c, t, x, y, w, h, n = 40, seed = 3, col = '#FFF2CF', a = .7) {
  const r = mulberry(seed * 977 + 13); c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const px = r(), py = r(), sp = .3 + r() * .7, ph = r() * TAU, sz = 1.2 + r() * 3.2;
    const xx = x + ((px + t * .012 * sp + Math.sin(t * .35 * sp + ph) * .02) % 1) * w;
    const yy = y + ((py + 1 - (t * .008 * sp) % 1 + Math.cos(t * .28 + ph) * .015) % 1) * h;
    const tw = .45 + .55 * Math.sin(t * 1.3 * sp + ph * 3);
    c.globalAlpha = a * tw * (sz > 3.4 ? .5 : 1); circ(c, xx, yy, sz, col);
  }
  c.restore();
}

// ---- nature ----
export function cloud(c, x, y, s, col, a = 1) {
  c.save(); c.globalAlpha *= a; c.fillStyle = col; c.beginPath();
  const b = [[0, 0, 60], [55, -22, 48], [105, -6, 54], [155, 6, 40], [-52, 10, 40], [50, 18, 70], [120, 22, 50]];
  for (const [bx, by, br] of b) { c.moveTo(x + bx * s + br * s, y + by * s); c.ellipse(x + bx * s, y + by * s, br * s, br * s * .62, 0, 0, TAU); }
  c.fill(); c.restore();
}
// layered blob foliage; sway with t
export function foliage(c, x, y, s, cols, t = 0, seed = 1) {
  const r = mulberry(seed * 131 + 5);
  cols.forEach((col, k) => {
    c.fillStyle = col; c.beginPath();
    const n = 9 - k * 2;
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * (1 - k * .22), rad = (.34 + r() * .3) * s * (1 - k * .15);
      const sw = Math.sin(t * .9 + i * 1.7 + seed) * s * .018;
      const px = x + Math.cos(a) * d * s * .75 + sw + (k ? -s * .12 * k : 0), py = y + Math.sin(a) * d * s * .5 - k * s * .16;
      c.moveTo(px + rad, py); c.arc(px, py, rad, 0, TAU);
    }
    c.fill();
  });
}
export function tree(c, x, y, s, t = 0, seed = 1, cols = [P.tealDark, P.tealDeep, P.teal], trunk = P.woodDark) {
  c.strokeStyle = trunk; c.lineCap = 'round'; c.lineWidth = s * .12;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * .04, y - s * .5, x - s * .02, y - s * .95); c.stroke();
  c.lineWidth = s * .06; c.beginPath(); c.moveTo(x, y - s * .6); c.lineTo(x + s * .28, y - s * .95); c.moveTo(x - s * .01, y - s * .7); c.lineTo(x - s * .26, y - s); c.stroke();
  foliage(c, x, y - s * 1.2, s * .78, cols, t, seed);
}
// seeded scatter helper
export const rnd = seed => mulberry(seed);
