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
    for (let i = 2; i < words.length - 1; i++) { const w = words[i - 1], score = Math.abs(words.slice(0, i).join(' ').length - v.sub.length / 2) - (/[.!?…”"]$/.test(w) ? 34 : /[,:]$/.test(w) ? 16 : 0); if (score < best) { best = score; cut = i; } }
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
  { id: 'name', a: T.nameIn, b: T.nameIn + 4.6, lines: ['SATOSHI TAJIRI', '“DR. BUG”'], type: 'plate' },
  { id: 'rare', a: T.rareTitle - .3, b: T.rareTitle + 3.3, lines: ['★ RARE TITLE UNLOCKED ★'], type: 'small' },
  { id: 'dev', a: T.devCap, b: T.devCap + 4.2, lines: ['YEARS OF DEVELOPMENT'], type: 'plate' },
  { id: 'date', a: T.dateIn, b: T.dateIn + 5.2, lines: ['JAPAN — FEBRUARY 27, 1996', 'POKÉMON RED & GREEN'], type: 'title' },
  { id: 'secret', a: T.secret + .3, b: T.prog - .25, lines: ['? ? ?'], type: 'small' },
  { id: 'entries', a: T.entries - .9, b: T.rushIn + .3, lines: ['78,000+', 'ENTRIES · ONLY 20 WINNERS'], type: 'count', n: 78000, suffix: '+', dur: 1.2 },
  { id: 'games', a: T.games - .1, b: T.games + 4.4, lines: ['515,000,000+', 'POKÉMON GAMES SOLD'], type: 'count', n: 515000000, suffix: '+' },
  { id: 'cards', a: T.cardsCap - .1, b: T.where - .2, lines: ['85,000,000,000+', 'CARDS PRINTED · ≈ 10 PER PERSON'], type: 'count', n: 85000000000, suffix: '+' },
  { id: 'no1', a: T.no1, b: T.no1 + 6.4, lines: ['No. 1', 'HIGHEST-GROSSING MEDIA FRANCHISE (EST.)'], type: 'plate' },
  { id: 't98', a: T.prize98, b: T.buy21 - .4, lines: ['1998', 'DRAWING-CONTEST PRIZE · ONLY 39 GIVEN'], type: 'ticker' },
  { id: 't21', a: T.buy21, b: T.gavel - .2, lines: ['2021', 'BOUGHT FOR $5,275,000'], type: 'ticker' },
  { id: 't26', a: T.gavel, b: T.crayonDrop + 1.4, lines: ['$16,492,000', 'FEB 2026 · GUINNESS WORLD RECORD'], type: 'count', n: 16492000, prefix: '$', dur: .9 },
  { id: 'gen', a: T.gen2027 - 1.0, b: T.gen2027 + 3.9, lines: ['NEW GENERATION', 'POKÉMON WINDS & WAVES · 2027'], type: 'plate' },
  { id: 'nfa', a: T.fog + .2, b: T.fog + 4.4, lines: ['(NOT FINANCIAL ADVICE)'], type: 'small' },
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

function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
function count(t, L) {
  const a = ss(seg(t, L.a, L.a + .35)) * (1 - ss(seg(t, L.b - .45, L.b)));
  if (a <= 0) return null;
  const k = 1 - Math.pow(1 - clamp((t - L.a - .1) / (L.dur ?? 1.7)), 3);
  const shown = (L.prefix || '') + fmt(L.n * k) + (k >= 1 ? (L.suffix || '') : '');
  const cy = Y_LABEL();
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  const bg = g.createLinearGradient(0, cy - 150, 0, cy + 150); bg.addColorStop(0, 'rgba(6,8,16,0)'); bg.addColorStop(.5, 'rgba(6,8,16,.6)'); bg.addColorStop(1, 'rgba(6,8,16,0)');
  g.fillStyle = bg; g.fillRect(0, cy - 150, W, 300);
  g.font = '700 84px Cinzel'; const gr = g.createLinearGradient(0, cy - 70, 0, cy + 10); gr.addColorStop(0, '#fff6d6'); gr.addColorStop(.6, '#ecc878'); gr.addColorStop(1, '#b88a40');
  g.fillStyle = gr; g.shadowColor = 'rgba(255,210,120,.6)'; g.shadowBlur = 26 * (1 + (k < 1 ? .5 : 0)); spaced(shown, W / 2, cy - 26, 2); g.shadowBlur = 0;
  const b2 = ss(seg(t, L.a + .3, L.a + .7)); g.globalAlpha = a * b2; g.font = '500 32px Cinzel'; g.fillStyle = '#f3e3b4'; spaced(L.lines[1], W / 2, cy + 44, 5);
  g.restore(); return true;
}
function ticker(t, L) {
  const a = ss(seg(t, L.a, L.a + .3)) * (1 - ss(seg(t, L.b - .35, L.b)));
  if (a <= 0) return null;
  const cy = Y_LABEL(), slide = (1 - ss(seg(t, L.a, L.a + .35))) * 40;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  const bw = 860, bh = 150, x = W / 2 - bw / 2 + slide, y = cy - bh / 2;
  g.fillStyle = 'rgba(10,12,22,.86)'; g.fillRect(x, y, bw, bh); g.strokeStyle = 'rgba(222,196,132,.95)'; g.lineWidth = 2.5; g.strokeRect(x + .5, y + .5, bw - 1, bh - 1);
  g.font = '700 60px Cinzel'; g.fillStyle = '#f3e3b4'; spaced(L.lines[0], W / 2 + slide, cy - 24, 6);
  g.font = 'italic 600 40px "Cormorant Garamond"'; g.fillStyle = '#fbf3de'; g.fillText(L.lines[1], W / 2 + slide, cy + 38);
  g.restore(); return true;
}
function small(t, L) {
  const a = ss(seg(t, L.a, L.a + .2)) * (1 - ss(seg(t, L.b - .3, L.b)));
  if (a <= 0) return null;
  const pop = 1 + .25 * Math.exp(-(t - L.a) / .12);
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.translate(W / 2, H * .3); g.scale(pop, pop);
  g.font = '700 38px Cinzel'; const w = spacedW(L.lines[0], 4) + 70;
  g.fillStyle = 'rgba(16,14,30,.85)'; g.fillRect(-w / 2, -36, w, 72); g.strokeStyle = '#ecc878'; g.lineWidth = 2; g.strokeRect(-w / 2 + .5, -35.5, w - 1, 71);
  g.fillStyle = '#ffe9a8'; g.shadowColor = 'rgba(255,210,120,.7)'; g.shadowBlur = 14; spaced(L.lines[0], 0, 2, 4);
  g.restore(); return true;
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

// The handheld's bezel closing in around the picture: the world shrinks back into the screen (kids shot, from T.shrink)
export function drawBezel(ctx, t) {
  const k = ss(seg(t, T.shrink, T.shrink + 1.2)); if (k <= 0) return;
  const sw = W * lerp(1.35, .74, k), sh = sw * 144 / 160, cx = W / 2, cy = H * .44, x0 = cx - sw / 2, y0 = cy - sh / 2;
  const bw = sw * 1.5, bh = sw * 2.5, bx = cx - bw / 2, by = y0 - sw * .2;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(x0, y0, sw, sh); ctx.clip('evenodd');
  ctx.fillStyle = `rgba(8,10,14,${.9 * k})`; ctx.fillRect(0, 0, W, H);
  const grd = ctx.createLinearGradient(bx, 0, bx + bw, 0); grd.addColorStop(0, '#9a9aa2'); grd.addColorStop(.5, '#c4c4ca'); grd.addColorStop(1, '#8a8a92');
  ctx.fillStyle = grd; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#34343e'; ctx.fillRect(x0 - sw * .1, y0 - sw * .1, sw * 1.2, sh + sw * .2);
  const s = sw / 40;   // buttons in the face's pixel grid
  ctx.fillStyle = '#2a2a32'; ctx.fillRect(cx - sw * .42, y0 + sh + sw * .35, s * 11, s * 3); ctx.fillRect(cx - sw * .42 + s * 4, y0 + sh + sw * .35 - s * 4, s * 3, s * 11);
  ctx.fillStyle = '#3a4058'; for (const [dx, dy] of [[.26, .4], [.4, .3]]) { ctx.beginPath(); ctx.arc(cx + sw * dx, y0 + sh + sw * dy, s * 2.8, 0, 7); ctx.fill(); }
  ctx.restore();
}
function lerp(a, b, t) { return a + (b - a) * t; }
export function drawOverlay(t, shot, xf) {
  g.clearRect(0, 0, W, H);
  if (shot.id === 'kids') drawBezel(g, t);
  if (xf) { g.globalAlpha = xf.a; g.drawImage(xf.img, 0, 0); g.globalAlpha = 1; }
  for (const L of LABELS) ({ title, plate, count, ticker, small })[L.type](t, L);
  if (!new URLSearchParams(location.search).has('nosub')) for (const v of CUES) subtitle(t, v);
  // first frame comes in from a warm white (the film's light), no logo
  const fin = 1 - ss(seg(t, 0, .35)); if (fin > 0) { g.fillStyle = `rgba(255,248,230,${fin})`; g.fillRect(0, 0, W, H); }
  const fout = ss(seg(t, DUR - .45, DUR)); if (fout > 0) { g.fillStyle = `rgba(255,246,222,${fout * .85})`; g.fillRect(0, 0, W, H); }
}
// every label on screen, for readcheck (full text from the first visible frame)
export function textsAt(t) {
  const out = [];
  for (const L of LABELS) { if (t >= L.a + .35 && t <= L.b - .45) out.push({ id: L.id, text: L.lines.join(' / '), x0: 40, y0: Y_LABEL() - 120, x1: W - 40, y1: Y_LABEL() + 120 }); }
  return out;
}
