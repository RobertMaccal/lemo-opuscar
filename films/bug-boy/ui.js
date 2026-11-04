// 2D overlay: narration subtitles, RPG label plates, dissolves. Type: Cinzel (labels), Cormorant Garamond italic (subtitles).
import { VO, T, DUR } from './timeline.js';
import { SFX } from './sfx_events.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = innerWidth || 1080, H = innerHeight || 1920;
cv.width = W; cv.height = H;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export let LINES = VO.map(v => ({ ...v, d: v.d ?? 3 }));
export const EVENTS = SFX;

export async function overlayReady() {
  await Promise.all(['500 40px Cinzel', '700 40px Cinzel', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  let j = {};
  try { const r = await fetch('vo.json'); if (r.ok) j = await r.json(); } catch (e) { }
  LINES = VO.map(v => ({ ...v, t: j[v.id]?.t ?? v.t, d: j[v.id]?.d ?? v.d ?? 3, words: j[v.id]?.words }));
  CUES = splitCues(LINES);
}
// A subtitle cue never shows more than two lines: long lines are split at a comma (or the middle word), timed by the word timings when known
export let CUES = [];
export const SUB_FONT = 'italic 500 50px "Cormorant Garamond"', SUB_MAXW = () => W * .88;
export function splitCues(lines) {
  const out = []; g.font = SUB_FONT;
  for (const v of lines) {
    if (balance(v.sub, SUB_MAXW()).length <= 2 && !v.split) { out.push({ id: v.id, t: v.t, d: v.d, sub: v.sub }); continue; }
    const words = v.sub.split(' '); let cut = Math.round(words.length / 2), best = 1e9;
    for (let i = 2; i < words.length - 1; i++) { const score = Math.abs(words.slice(0, i).join(' ').length - v.sub.length / 2) - (/[,?…]$/.test(words[i - 1]) ? 14 : 0); if (score < best) { best = score; cut = i; } }
    const a = words.slice(0, cut).join(' '), b = words.slice(cut).join(' ');
    let tb = v.t + v.d * a.length / v.sub.length;
    if (v.words && v.words.length >= words.length) tb = v.t + v.words[cut].t0 - .08;   // word times are relative to the line start
    out.push({ id: v.id + 'a', t: v.t, d: tb - v.t - .25, sub: a, chain: true });
    out.push({ id: v.id + 'b', t: tb, d: v.t + v.d - tb, sub: b, cont: true });
  }
  return out;
}

// —— label plates (upper third) ——
export const LABELS = [
  { id: 'name', a: T.nameIn, b: T.nameIn + 4.4, lines: ['SATOSHI TAJIRI', '“DR. BUG”'], type: 'plate' },
  { id: 'dev', a: T.devCap, b: T.devCap + 4.2, lines: ['YEARS OF DEVELOPMENT'], type: 'plate' },
  { id: 'date', a: T.dateIn, b: T.dateIn + 4.2, lines: ['JAPAN — FEBRUARY 27, 1996', 'POKÉMON RED & GREEN'], type: 'title' },
];
function spaced(text, x, y, sp) {
  const ws = [...text].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let cx = x - tot / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; });
  return tot;
}
function spacedW(text, sp) { const ws = [...text].map(c => g.measureText(c).width); return ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1); }
function diamond(cx, cy, r, fill) { g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); fill ? g.fill() : g.stroke(); }
const Y_LABEL = () => H * .17;
function plate(t, L) {
  const a = ss(seg(t, L.a, L.a + .35)) * (1 - ss(seg(t, L.b - .45, L.b)));
  if (a <= 0) return null;
  const cy = Y_LABEL() + (1 - a) * -10;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 46px Cinzel'; const w1 = spacedW(L.lines[0], 7);
  g.font = 'italic 600 44px "Cormorant Garamond"'; const w2 = L.lines[1] ? g.measureText(L.lines[1]).width : 0;
  const bw = Math.max(w1, w2) + 120, bh = L.lines[1] ? 150 : 96, x = W / 2 - bw / 2, y = cy - bh / 2;
  const gr = g.createLinearGradient(0, y, 0, y + bh); gr.addColorStop(0, 'rgba(16,20,34,.84)'); gr.addColorStop(1, 'rgba(8,10,20,.9)');
  g.fillStyle = gr; g.fillRect(x, y, bw, bh);
  g.strokeStyle = 'rgba(222,196,132,.95)'; g.lineWidth = 2.5; g.strokeRect(x + .5, y + .5, bw - 1, bh - 1);
  g.strokeStyle = 'rgba(222,196,132,.35)'; g.lineWidth = 1; g.strokeRect(x + 8.5, y + 8.5, bw - 17, bh - 17);
  g.fillStyle = '#e8cd8a'; for (const [cx2, cy2] of [[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]]) diamond(cx2, cy2, 8, true);
  // typewriter on the first line (whole text reported to readcheck from the first frame)
  const n = L.lines[0].length, shown = Math.floor(n * clamp((t - L.a - .15) / .7));
  g.font = '700 46px Cinzel'; g.fillStyle = '#f3e3b4'; g.shadowColor = 'rgba(255,200,120,.45)'; g.shadowBlur = 16;
  const full = L.lines[0], ws = [...full].map(c => g.measureText(c).width), tot = ws.reduce((p, q) => p + q, 0) + 7 * (ws.length - 1);
  let cx = W / 2 - tot / 2; [...full].forEach((c, i) => { if (i < shown) g.fillText(c, cx + ws[i] / 2, L.lines[1] ? cy - 30 : cy + 2); cx += ws[i] + 7; });
  g.shadowBlur = 0;
  if (L.lines[1]) { const b = ss(seg(t, L.a + .8, L.a + 1.2)); g.globalAlpha = a * b; g.font = 'italic 600 46px "Cormorant Garamond"'; g.fillStyle = '#fbf3de'; g.fillText(L.lines[1], W / 2, cy + 34); }
  g.restore();
  return { x0: x, y0: y, x1: x + bw, y1: y + bh };
}
function title(t, L) {
  const a = ss(seg(t, L.a, L.a + .5)) * (1 - ss(seg(t, L.b - .5, L.b)));
  if (a <= 0) return null;
  const cy = Y_LABEL();
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  const bg = g.createLinearGradient(0, cy - 170, 0, cy + 170); bg.addColorStop(0, 'rgba(6,8,16,0)'); bg.addColorStop(.5, `rgba(6,8,16,${.55 * a})`); bg.addColorStop(1, 'rgba(6,8,16,0)');
  g.fillStyle = bg; g.fillRect(0, cy - 170, W, 340);
  g.globalAlpha = a; g.font = '500 34px Cinzel'; g.fillStyle = '#e6cf94'; spaced(L.lines[0], W / 2, cy - 52, 6);
  // ornament
  g.strokeStyle = 'rgba(230,207,148,.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W / 2 - 230 * a, cy - 14); g.lineTo(W / 2 - 18, cy - 14); g.moveTo(W / 2 + 18, cy - 14); g.lineTo(W / 2 + 230 * a, cy - 14); g.stroke();
  g.fillStyle = '#e6cf94'; diamond(W / 2, cy - 14, 7, true);
  const b = ss(seg(t, L.a + .5, L.a + 1.1)); g.globalAlpha = a * b;
  g.font = '700 60px Cinzel'; const gr = g.createLinearGradient(0, cy + 10, 0, cy + 70); gr.addColorStop(0, '#fff6d6'); gr.addColorStop(.6, '#ecc878'); gr.addColorStop(1, '#b88a40');
  g.fillStyle = gr; g.shadowColor = 'rgba(255,210,120,.55)'; g.shadowBlur = 28; spaced(L.lines[1], W / 2, cy + 42, 5); g.shadowBlur = 0;
  g.restore();
  return { x0: 40, y0: cy - 90, x1: W - 40, y1: cy + 90 };
}

// —— subtitles: lower area, max two lines, never over the subject band ——
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
function balance(text, maxW) {   // two lines of similar length read better than a long line and a widow
  let lines = wrap(text, maxW); if (lines.length < 2) return lines;
  const words = text.split(' '); let best = lines, bd = 1e9;
  for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), wa = g.measureText(a).width, wb = g.measureText(b).width; if (wa > maxW || wb > maxW) continue; const d = Math.abs(wa - wb); if (d < bd) { bd = d; best = [a, b]; } }
  return best;
}
export const SUB_Y = () => H * .835;
function subtitle(t, v) {
  const fi = v.cont ? .12 : .3, fo0 = v.chain ? .1 : .35, fo1 = v.chain ? .22 : .7;
  const a = ss(seg(t, v.t - fi, v.t + .05)) * (1 - ss(seg(t, v.t + v.d + fo0, v.t + v.d + fo1)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = SUB_FONT;
  const lines = balance(v.sub, SUB_MAXW()), lh = 58, y0 = SUB_Y() - (lines.length - 1) * lh / 2;
  const top = y0 - 70, bot = y0 + (lines.length - 1) * lh + 40;
  const sh = g.createLinearGradient(0, top, 0, bot); sh.addColorStop(0, 'rgba(6,6,14,0)'); sh.addColorStop(.3, 'rgba(6,6,14,.42)'); sh.addColorStop(.7, 'rgba(6,6,14,.42)'); sh.addColorStop(1, 'rgba(6,6,14,0)');
  g.fillStyle = sh; g.fillRect(0, top, W, bot - top);
  g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 12; g.shadowOffsetY = 2; g.fillStyle = '#fbf5e6';
  lines.forEach((l, i) => g.fillText(l, W / 2, y0 + i * lh));
  g.restore();
}

export function drawOverlay(t, shot, xf) {
  g.clearRect(0, 0, W, H);
  if (xf) { g.globalAlpha = xf.a; g.drawImage(xf.img, 0, 0); g.globalAlpha = 1; }
  for (const L of LABELS) L.type === 'title' ? title(t, L) : plate(t, L);
  if (!new URLSearchParams(location.search).has('nosub')) for (const v of CUES) subtitle(t, v);
  // first frame comes in from a warm white (the film's light), no logo
  const fin = 1 - ss(seg(t, 0, .35)); if (fin > 0) { g.fillStyle = `rgba(255,248,230,${fin})`; g.fillRect(0, 0, W, H); }
  const fout = ss(seg(t, DUR - .45, DUR)); if (fout > 0) { g.fillStyle = `rgba(255,246,222,${fout * .85})`; g.fillRect(0, 0, W, H); }
}
// every label on screen, for readcheck (full text from the first visible frame)
export function textsAt(t) {
  const out = [];
  for (const L of LABELS) { if (t >= L.a + .35 && t <= L.b - .45) out.push({ id: L.id, text: L.lines.join(' / '), x0: 40, y0: Y_LABEL() - 90, x1: W - 40, y1: Y_LABEL() + 90 }); }
  return out;
}
