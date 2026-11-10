// lib.js — shared props and graphics for "Doctor, are you using ChatGPT?!"
// Characters wrap drawFigure() (stethoscope, badge, phone, blood stains); props are flat-shaded and take colours from mood()/S().
import { E, V, S, clamp, lerp, prog, ease, alpha, shade, mix, seg, circle, ring, rr, poly, linGrad, radGrad, glow, text, measure, FONTS, noise } from '/engine/core.js';
import { drawFigure, POSES, EXPR } from '/engine/rig2d.js';
// front-view faces: the stock 'worried' brows read as angry in close-up, so fear/worry use raised brows here
Object.assign(EXPR, { scared: { eyes: 'wide', brows: 'raised', mouth: 'wavy' }, worried: { eyes: 'dot', brows: 'raised', mouth: 'wavy' }, nervous: { eyes: 'dot', brows: 'raised', mouth: 'wavy', sweat: true }, sad: { eyes: 'dot', brows: 'raised', mouth: 'frown' } });
import { DOC, NURSE, PATIENT, COL } from './cast.js';

// ---------- pose-space -> world ----------
export function toWorld(o, pt) {
  const p = o.pose || POSES.stand, s = o.s ?? 1, f = o.facing ?? 1; let [x, y] = pt;
  if (o.rot) { const [hx, hy] = p.hip, c = Math.cos(o.rot), sn = Math.sin(o.rot); [x, y] = [hx + (x - hx) * c - (y - hy) * sn, hy + (x - hx) * sn + (y - hy) * c]; }
  return [o.x + x * f * s, o.y + y * s];
}
const L = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ---------- the phone (in hand) ----------
export function handPhone(g, o, glowC = '#bfe9ff', on = 1) {
  const p = o.pose, h = toWorld(o, o.phoneHand === 'B' ? p.hB : p.hF), s = o.s ?? 1, f = o.facing ?? 1;
  const w = 15 * s, hh = 26 * s;
  g.save(); g.translate(h[0] + 4 * s * f, h[1] - 10 * s); g.rotate(-0.25 * f);
  rr(g, -w / 2 - 2 * s, -hh / 2 - 2 * s, w + 4 * s, hh + 4 * s, 4 * s); g.fillStyle = '#0a0c14'; g.fill();
  rr(g, -w / 2, -hh / 2, w, hh, 3 * s); g.fillStyle = mix('#1a2230', glowC, on); g.fill();
  g.restore();
  if (on > 0.05) { glow(g, h[0] + 4 * s * f, h[1] - 10 * s, 90 * s, glowC, 0.35 * on); }
}

// ---------- characters ----------
export function drawDoc(g, o) {
  const fo = { ...o, outfit: DOC };
  drawFigure(g, fo);
  const p = o.pose || POSES.stand, s = o.s ?? 1, f = o.facing ?? 1;
  if (o.rot) return;
  // stethoscope: tubing around the neck, chest piece hanging on the coat
  const sh = toWorld(fo, p.sh), hip = toWorld(fo, p.hip);
  const a = [sh[0] - 7 * s * f, sh[1] + 2 * s], b = [sh[0] + 9 * s * f, sh[1] + 3 * s];
  const low = L(sh, hip, 0.42), low2 = [low[0] + 6 * s * f, low[1]];
  g.save(); g.globalAlpha *= o.alpha ?? 1;
  g.strokeStyle = '#2b2f3a'; g.lineWidth = 3.4 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(a[0] - 2 * s * f, low[1] - 8 * s, low2[0], low2[1]); g.stroke();
  g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo(b[0] + 2 * s * f, low[1] - 10 * s, low2[0], low2[1]); g.stroke();
  circle(g, low2[0], low2[1] + 4 * s, 4.6 * s, '#c9d2de'); circle(g, low2[0] - 1 * s, low2[1] + 3 * s, 1.8 * s, '#ffffff');
  // ID badge on the coat pocket
  const bd = L(sh, hip, 0.3); rr(g, bd[0] + 8 * s * f - 4 * s, bd[1] - 2 * s, 9 * s, 12 * s, 1.5 * s); g.fillStyle = '#e9f3ff'; g.fill();
  g.fillStyle = COL.userBubble; g.fillRect(bd[0] + 8 * s * f - 4 * s, bd[1] - 2 * s, 9 * s, 3.4 * s);
  g.restore();
  if (o.phone) handPhone(g, { ...fo, pose: p }, o.phoneGlow || '#bfe9ff', o.phoneOn ?? 1);
}
export function drawNurse(g, o) { drawFigure(g, { ...o, outfit: NURSE }); }

// patient lying on his back on a mattress (head to the left, face up). y = mattress top.
export function drawPatient(g, x, y, s, t, o = {}) {
  const pose = { ...POSES.lie, hF: [16, -112], eF: [12, -140], hB: [-16, -112], eB: [-10, -140] };
  const breath = Math.sin(t * (o.breathRate || 2.4)) * 1.2 * (o.breath ?? 1);
  const po = { x, y: y + 100 * s - 13 * s + breath, s, facing: 1, rot: -Math.PI / 2, pose, outfit: PATIENT, expr: o.expr || 'sleepy', rim: o.rim, dim: false, shadow: false, ink: o.ink };
  drawFigure(g, po);
  // cartoon blood: stains on the gown + bandage spot (non-graphic, no wounds)
  const sh = toWorld(po, pose.sh), hip = toWorld(po, pose.hip), head = toWorld(po, pose.head);
  const c = o.bloodA ?? 1; g.save(); g.globalAlpha *= c;
  const blot = (q, r, seed) => { g.fillStyle = COL.blood; g.beginPath(); for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2, rr2 = r * (0.78 + 0.28 * Math.sin(i * 2.3 + seed)); i ? g.lineTo(q[0] + Math.cos(a) * rr2, q[1] + Math.sin(a) * rr2 * 0.7) : g.moveTo(q[0] + Math.cos(a) * rr2, q[1] + Math.sin(a) * rr2 * 0.7); } g.closePath(); g.fill(); };
  const mid = L(sh, hip, 0.45); const st = o.stain || 1.5; blot([mid[0], mid[1] - 9 * s], 13 * s * st, 1); blot([mid[0] + 20 * s, mid[1] - 6 * s], 8 * s * st, 4); blot([mid[0] - 22 * s, mid[1] - 4 * s], 6 * s * st, 7);
  // bandage across the chest (white wrap with a red spot)
  g.fillStyle = '#f2efe8'; g.fillRect(mid[0] - 8 * s, mid[1] - 22 * s, 7 * s, 24 * s);
  circle(g, mid[0] - 4.5 * s, mid[1] - 12 * s, 4 * s, COL.blood);
  circle(g, head[0] - 4 * s, head[1] - 14 * s, 4.5 * s, COL.blood);
  g.restore();
  return { head, sh, hip, chest: mid };
}

// ---------- stretcher (side view). y = floor. returns mattress top ----------
export function stretcher(g, x, y, s, o = {}) {
  const len = 520 * s, top = y - 150 * s, ink = S().ink, metal = o.metal || '#8a93a6', wa = o.wheel || 0;
  const x0 = x - len / 2, x1 = x + len / 2;
  // legs + wheels
  for (const lx of [x0 + 50 * s, x1 - 50 * s]) {
    seg(g, [[lx, top + 26 * s], [lx, y - 18 * s]], 7 * s, shade(metal, -0.35));
    seg(g, [[lx - 22 * s, y - 20 * s], [lx + 22 * s, y - 20 * s]], 6 * s, shade(metal, -0.3));
    for (const dx of [-18, 18]) { const cx = lx + dx * s, cy = y - 10 * s, r = 10 * s; circle(g, cx, cy, r, '#14161e'); ring(g, cx, cy, r * 0.62, 2 * s, shade(metal, -0.1)); for (let k = 0; k < 3; k++) { const a = wa + k * 2.09; seg(g, [[cx, cy], [cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62]], 2 * s, shade(metal, 0.1)); } }
  }
  seg(g, [[x0 + 50 * s, top + 70 * s], [x1 - 50 * s, top + 70 * s]], 5 * s, shade(metal, -0.4));
  // frame + side rail
  rr(g, x0, top + 14 * s, len, 16 * s, 6 * s); g.fillStyle = shade(metal, -0.15); g.fill();
  seg(g, [[x0 + 30 * s, top - 6 * s], [x1 - 30 * s, top - 6 * s]], 4 * s, alpha(shade(metal, 0.2), 0.9));
  for (const k of [0.1, 0.35, 0.65, 0.9]) seg(g, [[lerp(x0 + 30 * s, x1 - 30 * s, k), top - 6 * s], [lerp(x0 + 30 * s, x1 - 30 * s, k), top + 14 * s]], 3 * s, alpha(shade(metal, 0.1), 0.8));
  // mattress + sheet + pillow
  rr(g, x0 + 4 * s, top - 4 * s, len - 8 * s, 22 * s, 9 * s); g.fillStyle = o.sheet || '#d9e2ee'; g.fill();
  g.fillStyle = alpha('#ffffff', 0.35); g.fillRect(x0 + 14 * s, top - 3 * s, len - 28 * s, 3 * s);
  rr(g, x0 + 14 * s, top - 18 * s, 92 * s, 22 * s, 10 * s); g.fillStyle = '#eef2f8'; g.fill();
  // blanket over the legs
  return top - 4 * s;
}

// ---------- vital-signs monitor ----------
// mode: 'normal' | 'alarm' | 'green' | 'flat' | 'flatGreen'; k = alarm flash 0..1
function ecgY(ph) { const u = ph - Math.floor(ph); if (u < 0.1) return Math.sin(u / 0.1 * Math.PI) * 0.12; if (u < 0.18) return 0; if (u < 0.2) return -0.25; if (u < 0.24) return 1; if (u < 0.28) return -0.45; if (u < 0.32) return 0; if (u < 0.5) return Math.sin((u - 0.32) / 0.18 * Math.PI) * 0.22; return 0; }
export function monitor(g, x, y, w, h, t, o = {}) {
  const mode = o.mode || 'normal', hr = o.hr ?? 96, flat = mode.startsWith('flat');
  const green = mode === 'green' || mode === 'flatGreen', alarm = mode === 'alarm';
  const flash = alarm ? (Math.sin(t * 12) > 0 ? 1 : 0.25) : flat && !green ? (Math.sin(t * 7) > 0 ? 1 : 0.4) : 0;
  // housing + arm
  if (o.arm !== false) { seg(g, [[x + w * 0.5, y - 10], [x + w * 0.5, y - 150]], 14, '#1a1d28'); }
  rr(g, x - 16, y - 16, w + 32, h + 32, 18); g.fillStyle = '#151820'; g.fill();
  rr(g, x - 16, y - 16, w + 32, 8, 4); g.fillStyle = alpha('#9fb0d0', 0.25); g.fill();
  const bg = green ? '#36d96a' : alarm ? mix('#1a0a10', '#5a0c18', flash * 0.7) : '#071016';
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  const fg = green ? '#0b2a14' : COL.ecg, red = green ? '#0b2a14' : COL.alarm, cyan = green ? '#0b2a14' : '#6fd8ff';
  // grid
  g.strokeStyle = alpha(green ? '#0b2a14' : '#3fa060', green ? 0.15 : 0.12); g.lineWidth = 1;
  for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(x + (w * 0.66 * i) / 8, y); g.lineTo(x + (w * 0.66 * i) / 8, y + h); g.stroke(); }
  // ECG trace (scrolling) in the left 66%
  const tw = w * 0.64, ty = y + h * 0.36, amp = h * 0.2, speed = flat ? 0 : (hr / 60);
  g.strokeStyle = alarm ? red : fg; g.lineWidth = Math.max(2, w * 0.012); g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= 120; i++) { const u = i / 120, ph = (t * speed) - (1 - u) * 2.2; const yy = flat ? ty : ty - ecgY(ph) * amp; i ? g.lineTo(x + 10 + u * tw, yy) : g.moveTo(x + 10 + u * tw, yy); }
  g.stroke();
  if (!green) glow(g, x + 10 + tw, ty - (flat ? 0 : ecgY(t * speed) * amp), w * 0.06, alarm ? red : fg, 0.8);
  // pleth wave (lower)
  const py = y + h * 0.76; g.strokeStyle = alpha(cyan, 0.9); g.lineWidth = Math.max(1.5, w * 0.008); g.beginPath();
  for (let i = 0; i <= 80; i++) { const u = i / 80, ph = t * speed - (1 - u) * 2.2; const yy = flat ? py : py - Math.max(0, Math.sin((ph - Math.floor(ph)) * Math.PI)) ** 2 * h * 0.1; i ? g.lineTo(x + 10 + u * tw, yy) : g.moveTo(x + 10 + u * tw, yy); }
  g.stroke();
  // numbers (right column)
  const nx = x + w * 0.98, fs = h * 0.17;
  text(g, 'HR', x + w * 0.7, y + h * 0.13, { size: fs * 0.42, color: fg, font: FONTS.ui, weight: 900, align: 'left' });
  text(g, flat ? '0' : String(Math.round(hr)), nx, y + h * 0.3, { size: fs * 1.25, color: alarm ? red : fg, font: FONTS.ui, weight: 900, align: 'right' });
  text(g, 'SpO2', x + w * 0.7, y + h * 0.48, { size: fs * 0.42, color: cyan, font: FONTS.ui, weight: 900, align: 'left' });
  text(g, flat ? '--' : String(o.spo2 ?? 97), nx, y + h * 0.62, { size: fs, color: cyan, font: FONTS.ui, weight: 900, align: 'right' });
  text(g, 'BP', x + w * 0.7, y + h * 0.78, { size: fs * 0.42, color: alpha(fg, 0.85), font: FONTS.ui, weight: 900, align: 'left' });
  text(g, flat ? '--/--' : o.bp || '118/76', nx, y + h * 0.9, { size: fs * 0.62, color: alarm ? red : alpha(fg, 0.9), font: FONTS.ui, weight: 900, align: 'right' });
  if (alarm || (flat && !green)) { rr(g, x + 10, y + 8, w * 0.3, h * 0.12, 6); g.fillStyle = alpha(COL.alarm, 0.4 + 0.6 * flash); g.fill(); text(g, flat ? 'ASYSTOLE' : 'ALARM', x + 10 + w * 0.15, y + 8 + h * 0.062, { size: h * 0.075, color: '#fff', font: FONTS.ui, weight: 900 }); }
  if (green) { rr(g, x + 10, y + 8, w * 0.36, h * 0.12, 6); g.fillStyle = alpha('#0b2a14', 0.18); g.fill(); text(g, 'THEME: GREEN', x + 10 + w * 0.18, y + 8 + h * 0.062, { size: h * 0.06, color: '#0b2a14', font: FONTS.ui, weight: 900 }); }
  // screen sheen + light spill
  g.fillStyle = linGrad(g, x, y, x + w, y + h, [alpha('#ffffff', 0.07), alpha('#ffffff', 0), alpha('#ffffff', 0.03)]); g.fillRect(x, y, w, h);
  const spill = green ? '#45ff7a' : alarm || (flat && !green) ? COL.alarm : '#5fe0a0';
  glow(g, x + w / 2, y + h / 2, Math.max(w, h) * (green ? 1.3 : 0.9), spill, green ? 0.32 : alarm ? 0.2 * flash + 0.08 : 0.12);
  return { spill };
}

// ---------- room props ----------
export function examLamp(g, x, y, s = 1, M, on = 1) {
  seg(g, [[x, y - 400 * s], [x, y - 60 * s]], 10 * s, '#11141c');
  g.fillStyle = '#1b1f2a'; g.beginPath(); g.ellipse(x, y, 120 * s, 46 * s, 0, Math.PI, Math.PI * 2); g.fill();
  rr(g, x - 122 * s, y - 6 * s, 244 * s, 14 * s, 7 * s); g.fillStyle = '#272c3a'; g.fill();
  for (const dx of [-70, -24, 24, 70]) { circle(g, x + dx * s, y + 4 * s, 15 * s, mix('#3a4050', '#f4fbff', on)); }
  glow(g, x, y + 6 * s, 260 * s, M.key, 0.55 * on);
}
export function ivPole(g, x, y, h, s = 1, t = 0) {
  seg(g, [[x, y], [x, y - h]], 6 * s, '#7c8496'); seg(g, [[x - 40 * s, y], [x + 40 * s, y]], 6 * s, '#5c6476');
  seg(g, [[x - 26 * s, y - h], [x + 26 * s, y - h]], 4 * s, '#7c8496');
  rr(g, x + 6 * s, y - h + 6 * s, 42 * s, 70 * s, 12 * s); g.fillStyle = alpha('#d8f0ff', 0.55); g.fill();
  rr(g, x + 10 * s, y - h + 36 * s, 34 * s, 36 * s, 10 * s); g.fillStyle = alpha('#9fd8ff', 0.6); g.fill();
  seg(g, [[x + 27 * s, y - h + 76 * s], [x + 30 * s, y - h + 200 * s], [x - 10 * s, y - h + 380 * s]], 2 * s, alpha('#d8f0ff', 0.5));
  const dy = ((t * 1.3) % 1) * 30 * s; circle(g, x + 28 * s, y - h + 82 * s + dy, 2.4 * s, alpha('#bfe9ff', 0.8 * (1 - dy / (30 * s))));
}
export function wallClock(g, x, y, r, t, ink) {
  circle(g, x, y, r * 1.1, '#20242f'); circle(g, x, y, r, '#eef1f5');
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; seg(g, [[x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9]], r * 0.06, ink); }
  const sec = (t * Math.PI * 2) / 60 * 6 + 1, min = 1.9 + t * 0.01, hr = 4.2;
  seg(g, [[x, y], [x + Math.cos(hr) * r * 0.5, y + Math.sin(hr) * r * 0.5]], r * 0.1, ink);
  seg(g, [[x, y], [x + Math.cos(min) * r * 0.75, y + Math.sin(min) * r * 0.75]], r * 0.07, ink);
  seg(g, [[x, y], [x + Math.cos(sec - Math.PI / 2) * r * 0.82, y + Math.sin(sec - Math.PI / 2) * r * 0.82]], r * 0.03, '#e04a3a'); circle(g, x, y, r * 0.07, ink);
}
// glass-front supply cabinet; open 0..1 swings the near door
export function cabinet(g, x, y, w, h, o = {}) {
  const frame = o.frame || '#cfd6e2', inside = o.inside || '#2a3448';
  rr(g, x - 10, y - 10, w + 20, h + 20, 8); g.fillStyle = shade(frame, -0.45); g.fill();
  g.fillStyle = inside; g.fillRect(x, y, w, h);
  glow(g, x + w / 2, y + 20, w * 0.8, '#dff3ff', 0.18);
  const cols = ['#e8eef6', '#8fd3ff', '#f2c21a', '#e85a5a', '#9fe0b0', '#ffffff'];
  for (let r = 0; r < 4; r++) { const sy = y + (h * (r + 1)) / 4.3; g.fillStyle = shade(frame, -0.25); g.fillRect(x, sy, w, 6);
    for (let k = 0; k < 5; k++) { const bw = w / 6.5, bx = x + 10 + k * (bw + 6), bh = 30 + ((k * 7 + r * 3) % 4) * 9; g.fillStyle = shade(cols[(k + r * 2) % cols.length], -0.25); g.fillRect(bx, sy - bh, bw, bh); } }
  const op = o.open || 0;
  for (const side of [0, 1]) { const dw = w / 2, dx = x + side * dw; const k = side === 1 ? op : 0; const ww = dw * (1 - k * 0.9);
    const px = side === 1 ? dx + dw - ww + (k > 0 ? dw * 0.9 * k * 1.15 : 0) : dx;
    g.fillStyle = alpha('#cfe8ff', 0.12); g.fillRect(side === 1 ? dx + dw * k * 1.0 : px, y, ww, h);
    g.strokeStyle = frame; g.lineWidth = 6; g.strokeRect(side === 1 ? dx + dw * k * 1.0 : px, y, ww, h);
    g.fillStyle = alpha('#ffffff', 0.18); g.fillRect((side === 1 ? dx + dw * k : px) + 8, y + 8, 6, h - 16); }
  text(g, '+', x + w / 2, y - 40, { size: 50, color: '#e85a5a', font: FONTS.ui, weight: 900 });
}
export function cart(g, x, y, s = 1) {
  const w = 170 * s, h = 190 * s;
  rr(g, x - w / 2, y - h, w, h - 16 * s, 8 * s); g.fillStyle = '#2b3446'; g.fill();
  for (let i = 0; i < 3; i++) { rr(g, x - w / 2 + 10 * s, y - h + 20 * s + i * 52 * s, w - 20 * s, 42 * s, 5 * s); g.fillStyle = ['#3f6fb0', '#c84a4a', '#3a9a7a'][i]; g.fill(); seg(g, [[x - 20 * s, y - h + 40 * s + i * 52 * s], [x + 20 * s, y - h + 40 * s + i * 52 * s]], 4 * s, alpha('#ffffff', 0.5)); }
  for (const dx of [-0.4, 0.4]) circle(g, x + dx * w, y - 8 * s, 8 * s, '#0e1016');
  // glove box + masks on top
  rr(g, x - w / 2 + 8 * s, y - h - 34 * s, 70 * s, 34 * s, 4 * s); g.fillStyle = '#e8eef6'; g.fill(); rr(g, x - w / 2 + 20 * s, y - h - 40 * s, 46 * s, 10 * s, 4 * s); g.fillStyle = '#8fd3ff'; g.fill();
  for (let i = 0; i < 3; i++) { rr(g, x + 6 * s + i * 8 * s, y - h - 22 * s - i * 4 * s, 56 * s, 22 * s, 6 * s); g.fillStyle = shade('#a8e4d0', -i * 0.08); g.fill(); }
}
export function rollingStool(g, x, y, s = 1) {
  rr(g, x - 46 * s, y - 92 * s, 92 * s, 18 * s, 9 * s); g.fillStyle = '#2a2f3e'; g.fill();
  seg(g, [[x, y - 76 * s], [x, y - 22 * s]], 8 * s, '#6c7488');
  for (const dx of [-40, 0, 40]) { seg(g, [[x, y - 22 * s], [x + dx * s, y - 8 * s]], 5 * s, '#4c5468'); circle(g, x + dx * s, y - 6 * s, 6 * s, '#0e1016'); }
}
export function curtain(g, x, y, w, h, color, t = 0) {
  for (let i = 0; i < 9; i++) { const fx = x + (w * i) / 9; g.fillStyle = shade(color, i % 2 ? -0.2 : 0.02); g.fillRect(fx, y, w / 9 + 1, h + Math.sin(t + i) * 3); }
  g.fillStyle = shade(color, 0.25); g.fillRect(x, y, w, 10);
}
// fictional medicine pack (no dosage, no instructions)
export function pillBox(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  rr(g, -52, -30, 104, 60, 6); g.fillStyle = '#f4f6fa'; g.fill();
  g.fillStyle = '#e8574a'; g.fillRect(-52, -30, 104, 16);
  text(g, 'IBUPROFEN', 0, 6, { size: 17, color: '#1a2030', font: FONTS.ui, weight: 900 });
  text(g, 'cartoon prop', 0, 21, { size: 10, color: '#6a7488', font: FONTS.ui, weight: 800 });
  g.restore();
}
export function tablet(g, x, y, r, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#f7f1e8'; g.beginPath(); g.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2); g.fill(); seg(g, [[-r * 0.6, 0], [r * 0.6, 0]], r * 0.12, '#cbbfae'); g.restore(); }

// ---------- big phone with the fictional chat UI ----------
function wrap(g, str, maxW, size, font, weight) {
  const ws = str.split(' '); const lines = []; let cur = '';
  for (const w of ws) { const tt = cur ? cur + ' ' + w : w; if (measure(g, tt, size, font, weight) > maxW && cur) { lines.push(cur); cur = w; } else cur = tt; }
  if (cur) lines.push(cur); return lines;
}
// how much of a bot line is "typed" at global time T: reveal words as they are spoken
export function spokenCount(lineId, T) { let n = 0; E.words.filter(w => w.line === lineId).forEach((w, i) => { if (T >= w.start - 0.05) n = i + 1; }); return n; }
export function revealText(lineId, T, full) {
  const ws = E.words.filter(w => w.line === lineId); if (!ws.length) return full;
  const parts = full.split(' '); let n = 0; ws.forEach((w, i) => { if (T >= w.start - 0.05) n = i + 1; });
  return parts.slice(0, Math.round((n / ws.length) * parts.length)).join(' ');
}
// msgs: [{from:'user'|'bot', text, show:0..1}]; typing: 0..1 (dots); o: {glow, tilt, hand}
export function phone(g, cx, cy, w, t, msgs, o = {}) {
  const h = w * 2.05, x = cx - w / 2, y = cy - h / 2, r = w * 0.13, ui = S().ui;
  g.save(); if (o.tilt) { g.translate(cx, cy); g.rotate(o.tilt); g.translate(-cx, -cy); }
  glow(g, cx, cy, w * 1.6, '#9fdcff', 0.22 * (o.glow ?? 1));
  // body
  rr(g, x - w * 0.045, y - w * 0.045, w * 1.09, h + w * 0.09, r * 1.15); g.fillStyle = '#05070c'; g.fill();
  g.strokeStyle = alpha('#9fb6d8', 0.35); g.lineWidth = w * 0.008; g.stroke();
  g.save(); rr(g, x, y, w, h, r); g.clip();
  g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#0f1724', '#0b111b']); g.fillRect(x, y, w, h);
  // header
  const hy = y + h * 0.075; g.fillStyle = '#121c2b'; g.fillRect(x, y, w, h * 0.13);
  rr(g, cx - w * 0.14, y + h * 0.012, w * 0.28, h * 0.022, h * 0.011); g.fillStyle = '#000'; g.fill();
  const av = [x + w * 0.12, hy + h * 0.012]; circle(g, av[0], av[1], w * 0.055, COL.botDeep); ring(g, av[0], av[1], w * 0.055, w * 0.008, COL.bot);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * 0.6; seg(g, [[av[0], av[1]], [av[0] + Math.cos(a) * w * 0.032, av[1] + Math.sin(a) * w * 0.032]], w * 0.012, COL.bot); }
  text(g, 'HelpBot AI', x + w * 0.2, hy + h * 0.002, { size: w * 0.06, color: '#eaf2ff', font: FONTS.ui, weight: 900, align: 'left' });
  text(g, 'always confident · usually online', x + w * 0.2, hy + h * 0.028, { size: w * 0.033, color: alpha('#9fb6d8', 0.9), font: FONTS.ui, weight: 800, align: 'left' });
  rr(g, x + w * 0.06, y + h * 0.135, w * 0.88, h * 0.03, h * 0.015); g.fillStyle = alpha('#ffd47e', 0.14); g.fill();
  text(g, 'FICTIONAL PARODY CHATBOT · NOT MEDICAL ADVICE', cx, y + h * 0.15, { size: w * 0.03, color: '#ffd47e', font: FONTS.ui, weight: 900 });
  // messages, stacked from the bottom up
  const fs = w * (o.fs || 0.066), lh = fs * 1.28, pad = fs * 0.6, maxW = w * 0.68; let by = y + h * 0.86;
  const items = [];
  if (o.typing > 0) items.push({ typing: true, show: o.typing });
  for (let i = msgs.length - 1; i >= 0; i--) items.push(msgs[i]);
  for (const m of items) {
    if (m.show <= 0) continue;
    const bot = m.typing || m.from === 'bot';
    const lines = m.typing ? ['···'] : wrap(g, m.text || ' ', maxW, fs, FONTS.ui, 800);
    const bw = m.typing ? fs * 3.2 : Math.max(...lines.map(l => measure(g, l, fs, FONTS.ui, 800))) + pad * 2, bh = lines.length * lh + pad * 1.3;
    const bx = bot ? x + w * 0.06 : x + w * 0.94 - bw, k = ease.outBack(clamp(m.show)); by -= bh;
    g.save(); g.globalAlpha *= clamp(m.show * 2); g.translate(bx + (bot ? 0 : bw), by + bh); g.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); g.translate(-(bx + (bot ? 0 : bw)), -(by + bh));
    rr(g, bx, by, bw, bh, fs * 0.7); g.fillStyle = bot ? (m.hl ? mix('#1e3b44', COL.bot, 0.18 + 0.1 * Math.sin(t * 3)) : '#1c2c3a') : COL.userBubble; g.fill();
    if (bot) { g.strokeStyle = alpha(COL.bot, 0.5); g.lineWidth = w * 0.006; g.stroke(); }
    if (m.typing) { for (let k2 = 0; k2 < 3; k2++) circle(g, bx + bw * (0.3 + k2 * 0.2), by + bh / 2 - Math.max(0, Math.sin(t * 9 - k2 * 0.9)) * fs * 0.18, fs * 0.13, alpha('#cfe0ff', 0.9)); }
    else lines.forEach((l, i) => text(g, l, bx + pad, by + pad * 0.65 + lh * (i + 0.5), { size: fs, color: bot ? '#eaf6f4' : '#ffffff', font: FONTS.ui, weight: 800, align: 'left' }));
    if (m.tag) { const tw2 = measure(g, m.tag, fs * 0.55, FONTS.ui, 900) + fs; rr(g, bx, by + bh + fs * 0.25, tw2, fs * 0.85, fs * 0.42); g.fillStyle = alpha(COL.bot, 0.16); g.fill(); text(g, m.tag, bx + fs * 0.5, by + bh + fs * 0.67, { size: fs * 0.55, color: COL.bot, font: FONTS.ui, weight: 900, align: 'left' }); }
    g.restore();
    by -= fs * (m.tag ? 1.6 : 0.6);
  }
  // quick-reply chips
  if (o.chips) { const cy2 = y + h * 0.885; let cx2 = x + w * 0.06; for (const c of o.chips.items) { const cw = measure(g, c, fs * 0.8, FONTS.ui, 900) + fs * 1.2; g.save(); g.globalAlpha *= clamp(o.chips.show); rr(g, cx2, cy2, cw, fs * 1.5, fs * 0.75); g.strokeStyle = COL.bot; g.lineWidth = w * 0.007; g.stroke(); g.fillStyle = alpha(COL.bot, 0.08); g.fill(); text(g, c, cx2 + cw / 2, cy2 + fs * 0.76, { size: fs * 0.8, color: COL.bot, font: FONTS.ui, weight: 900 }); g.restore(); cx2 += cw + fs * 0.4; } }
  // input bar
  rr(g, x + w * 0.05, y + h * 0.935, w * 0.9, h * 0.045, h * 0.022); g.fillStyle = '#18222f'; g.fill();
  text(g, o.input || 'Ask anything…', x + w * 0.1, y + h * 0.958, { size: w * 0.045, color: alpha('#9fb6d8', 0.7), font: FONTS.ui, weight: 800, align: 'left' });
  g.fillStyle = linGrad(g, x, y, x + w, y + h, [alpha('#ffffff', 0.06), alpha('#ffffff', 0), alpha('#ffffff', 0.02)]); g.fillRect(x, y, w, h);
  g.restore(); g.restore();
  return { x, y, w, h };
}
// thumb + fingers wrapped around a big phone (ink with rim light)
export function phoneHands(g, ph, rimC, o = {}) {
  const ink = S().ink, { x, y, w, h } = ph, sh = o.shake || [0, 0];
  const draw = (col, dx, dy) => {
    g.save(); g.translate(dx + sh[0], dy + sh[1]);
    // palm + wrist off the right edge; fingertips just wrap the bezel
    seg(g, [[x + w * 1.14, y + h * 0.76], [x + w * 1.6, y + h * 1.4]], w * 0.4, col);
    circle(g, x + w * 1.16, y + h * 0.74, w * 0.17, col);
    for (let i = 0; i < 3; i++) seg(g, [[x + w * 1.12, y + h * (0.5 + i * 0.07)], [x + w * 1.0, y + h * (0.51 + i * 0.07)]], w * 0.075, col);
    seg(g, [[x - w * 0.06, y + h * 0.9], [x + w * 0.04, y + h * 0.92]], w * 0.075, col);
    seg(g, [[x + w * 1.1, y + h * 0.84], [x + w * 0.99, y + h * (o.thumbY ?? 0.95)]], w * 0.09, col);
    g.restore();
  };
  draw(rimC, -w * 0.012, -w * 0.012); draw(ink, 0, 0);
}

// ---------- subtitles (spoken = bold white; chatbot = teal chat pill) ----------
let _groups = null;
function groups(g) {
  if (_groups) return _groups; _groups = [];
  const byLine = {}; for (const w of E.words) (byLine[w.line] ||= []).push(w);
  for (const id of Object.keys(byLine)) {
    const ws = byLine[id], bot = ws[0].speaker === 'chatbot'; let cur = [];
    const flush = () => { if (cur.length) _groups.push({ line: id, bot, words: cur, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; };
    ws.forEach((w, i) => { cur.push(w); const txt = cur.map(x => x.word).join(' '); const sentence = /[.?!—]$/.test(w.word) && txt.length > (bot ? 22 : 5); if (txt.length > (bot ? 44 : 36) || sentence || i === ws.length - 1) flush(); });
  }
  _groups.sort((a, b) => a.start - b.start); return _groups;
}
export function subtitles(g, T, o = {}) {
  const gs = groups(g); let cur = null;
  for (let i = 0; i < gs.length; i++) { const gr = gs[i], nx = gs[i + 1]; const until = Math.min(gr.end + 0.45, nx ? nx.start - 0.02 : 1e9); if (T >= gr.start - 0.08 && T <= until) cur = gr; }
  if (!cur || (cur.bot && o.hideBot)) return;
  const a = clamp((T - cur.start + 0.08) / 0.1); const y = E.H * (o.y ?? 0.765);
  const str = cur.words.map(w => w.word).join(' ');
  if (!cur.bot) {
    const size = 60, lines = wrap(g, str, E.W * 0.84, size, FONTS.title, 700);
    lines.forEach((l, i) => text(g, l, E.W / 2, y + (i - (lines.length - 1) / 2) * size * 1.12, { size, color: '#ffffff', stroke: 13, strokeColor: 'rgba(5,8,14,.9)', alpha: a }));
  } else {
    const size = 44, lines = wrap(g, str, E.W * 0.74, size, FONTS.ui, 800), lh = size * 1.25;
    const bw = Math.max(...lines.map(l => measure(g, l, size, FONTS.ui, 800))) + 110, bh = lines.length * lh + 34;
    g.save(); g.globalAlpha *= a; rr(g, E.W / 2 - bw / 2, y - bh / 2, bw, bh, 26); g.fillStyle = 'rgba(12,30,36,.88)'; g.fill(); g.strokeStyle = alpha(COL.bot, 0.8); g.lineWidth = 3; g.stroke();
    const ix = E.W / 2 - bw / 2 + 38, iy = y; circle(g, ix, iy, 15, COL.botDeep); ring(g, ix, iy, 15, 3, COL.bot); for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2; seg(g, [[ix, iy], [ix + Math.cos(an) * 9, iy + Math.sin(an) * 9]], 3, COL.bot); }
    lines.forEach((l, i) => text(g, l, E.W / 2 + 28, y + (i - (lines.length - 1) / 2) * lh, { size, color: '#dffaf4', font: FONTS.ui, weight: 800 }));
    g.restore();
  }
}
export function satireLabel(g, a = 1, y = 128) {
  if (a <= 0) return; const s = 'FICTIONAL MEDICAL SATIRE', size = 26, w = measure(g, s, size, FONTS.ui, 900) + 44;
  g.save(); g.globalAlpha *= a; rr(g, E.W / 2 - w / 2, y - 24, w, 48, 24); g.fillStyle = 'rgba(8,10,18,.62)'; g.fill(); g.strokeStyle = 'rgba(255,212,126,.55)'; g.lineWidth = 2; g.stroke();
  text(g, s, E.W / 2, y + 1, { size, color: '#ffd47e', font: FONTS.ui, weight: 900, spacing: 3 }); g.restore();
}
// rings of sound around a speaking head
export function talkRings(g, x, y, t, amt, color = '#eaf2ff') { if (amt <= 0.05) return; for (let k = 0; k < 2; k++) { const ph = (t * 1.6 + k / 2) % 1; ring(g, x, y, 40 + ph * 70, 2, alpha(color, 0.35 * (1 - ph))); } }

// ---------- stretcher + patient as one unit (x = stretcher centre, y = floor) ----------
export function gurney(g, x, y, s, t, o = {}) {
  const top = stretcher(g, x, y, s, o);
  const pat = drawPatient(g, x - 110 * (s / 1.05), top, s * 1.1, t, o.patient || {});
  rr(g, x - 60 * s, top - 22 * s, 300 * s, 28 * s, 12 * s); g.fillStyle = o.blanket || '#4f78ad'; g.fill();
  g.fillStyle = alpha('#ffffff', 0.18); g.fillRect(x - 50 * s, top - 18 * s, 280 * s, 4 * s);
  return { top, pat };
}
// ---------- shot registration with the subtitle overlay on top ----------
import { registerShot } from '/engine/core.js';
export function reg(id, draw, o = {}) {
  registerShot(id, { draw(g, t, info) { draw(g, t, info); if (o.label) o.label(g, t, info); subtitles(g, info.globalT, { hideBot: o.hideBot }); } });
}
// custom poses
export const PZ = {
  hunch: { ...POSES.phone, head: [16, -194], sh: [6, -168], eF: [22, -134], hF: [32, -158], eB: [18, -132], hB: [28, -154] },
  hips: { ...POSES.stand, eF: [26, -134], hF: [10, -104], eB: [-24, -134], hB: [-10, -104], fF: [10, 0], fB: [-18, 0] },
  thumbs: { ...POSES.stand, eF: [24, -146], hF: [34, -178] },
  calm: { ...POSES.explain, eF: [26, -140], hF: [48, -150], eB: [20, -138], hB: [42, -146] },
  hide: { ...POSES.stand, head: [6, -208], eF: [24, -146], hF: [34, -180], eB: [-24, -140], hB: [-36, -112] },
  present: { ...POSES.stand, head: [6, -210], eF: [30, -196], hF: [58, -228], eB: [-8, -136], hB: [-10, -100] },
  press: { ...POSES.stand, head: [40, -180], sh: [26, -156], hip: [0, -100], eF: [46, -112], hF: [64, -66], eB: [40, -110], hB: [58, -64] },
  pulse: { ...POSES.stand, head: [36, -180], sh: [24, -156], hip: [0, -100], eF: [48, -108], hF: [64, -62], eB: [-4, -126], hB: [-6, -96] },
  slam: { ...POSES.stand, head: [12, -210], sh: [4, -174], eF: [34, -214], hF: [58, -250], eB: [-10, -136], hB: [-12, -100] },
  push: (ph) => ({ ...walkPose(ph, { run: true }), eF: [40, -150], hF: [70, -142], eB: [34, -148], hB: [64, -140] }),
  frozen: { ...POSES.stand, head: [2, -212], hF: [12, -100], hB: [-8, -100] },
  raise: (k) => ({ ...POSES.stand, head: [8, -204], eF: [lerp(14, 26, k), lerp(-128, -150, k)], hF: [lerp(16, 34, k), lerp(-100, -184, k)] }),
};
import { walkPose } from '/engine/rig2d.js';
