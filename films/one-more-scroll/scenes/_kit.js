// _kit.js — shared helpers for ONE MORE SCROLL: lip sync from the real voice envelopes, blinking,
// the Instickram phone UI and its five mini-videos, clocks. (Files starting with _ are not auto-loaded.)
import { E, V, clamp, lerp, prog, ease, key, alpha, shade, mix, seg, circle, ring, rr, poly, text, glow, linGrad, radGrad, FONTS, rng, noise, measure } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, walkPose, blendPose } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { LINES, START } from './_timeline.js';
import { DOCTOR, CHAIR_GUY, DANCER, MUD_GUY } from './cast.js';

export const PHONE = '#9fe3ff', SODIUM = '#ffb35c', COLD = '#bcd6ff', FLUO = '#d8f4ec';
export const gT = (id, t) => (START[id] ?? 0) + t;
// mouth opening 0..1 for a character at global time (from the line's loudness envelope)
export function mouth(who, globalT) {
  for (const l of LINES) if (l.who === who && globalT >= l.t0 - 0.02 && globalT <= l.t1 + 0.03) {
    const i = Math.max(0, (globalT - l.t0) * 30), a = l.env[Math.floor(i)] ?? 0, b = l.env[Math.floor(i) + 1] ?? 0, v = lerp(a, b, i % 1);
    return v > 0.1 ? clamp(0.2 + v * 0.85) : 0;
  }
  return 0;
}
export const lineOf = id => LINES.find(l => l.id === id);
export const speaking = (who, globalT) => LINES.some(l => l.who === who && globalT >= l.t0 && globalT <= l.t1);
export const blinkAt = (t, per = 3.4, seed = 0) => ((t + seed * 1.37) % per) < 0.11;
export const pz = (o) => o;   // readability marker for custom poses

// ---------- custom poses (11-point rig, figure faces +x, feet at y = 0) ----------
export const P = {
  // lying on the back (use with rot: -PI/2 so the head points left), holding the phone above the face
  lieHold: { head: [3, -208], sh: [0, -174], hip: [0, -100], eF: [34, -170], hF: [62, -196], eB: [30, -176], hB: [58, -204], kF: [4, -50], fF: [2, 0], kB: [-4, -50], fB: [-6, 0] },
  lieRest: { head: [3, -208], sh: [0, -174], hip: [0, -100], eF: [10, -138], hF: [24, -112], eB: [-12, -140], hB: [-8, -110], kF: [4, -50], fF: [2, 0], kB: [-4, -50], fB: [-6, 0] },
  lieReach: { head: [3, -208], sh: [0, -174], hip: [0, -100], eF: [-26, -196], hF: [-30, -244], eB: [-12, -140], hB: [-8, -110], kF: [4, -50], fF: [2, 0], kB: [-4, -50], fB: [-6, 0] },
  lieFlop: { head: [3, -208], sh: [0, -174], hip: [0, -100], eF: [-34, -170], hF: [-54, -150], eB: [26, -150], hB: [40, -128], kF: [4, -50], fF: [2, 0], kB: [-4, -50], fB: [-6, 0] },
  sitBed: { head: [10, -176], sh: [4, -144], hip: [0, -72], eF: [16, -110], hF: [30, -80], eB: [8, -110], hB: [22, -78], kF: [44, -74], fF: [50, 0], kB: [40, -72], fB: [42, 0] },
  slump: { head: [20, -168], sh: [8, -142], hip: [0, -72], eF: [16, -106], hF: [26, -74], eB: [8, -106], hB: [16, -72], kF: [44, -74], fF: [50, 0], kB: [40, -72], fB: [42, 0] },
  sitDesk: { head: [8, -180], sh: [3, -146], hip: [0, -72], eF: [26, -118], hF: [56, -112], eB: [18, -118], hB: [48, -110], kF: [44, -74], fF: [46, 0], kB: [40, -72], fB: [38, 0] },
  sitSink: { head: [34, -150], sh: [14, -138], hip: [0, -72], eF: [34, -112], hF: [60, -108], eB: [26, -112], hB: [52, -106], kF: [44, -74], fF: [46, 0], kB: [40, -72], fB: [38, 0] },
  sitPhone: { head: [6, -176], sh: [2, -144], hip: [0, -72], eF: [20, -112], hF: [30, -138], eB: [16, -112], hB: [26, -134], kF: [44, -74], fF: [46, 0], kB: [40, -72], fB: [38, 0] },
  slouchStand: { head: [12, -196], sh: [5, -168], hip: [0, -100], eF: [11, -132], hF: [14, -96], eB: [-3, -132], hB: [-2, -96], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  bentSink: { head: [42, -170], sh: [24, -150], hip: [0, -100], eF: [40, -120], hF: [52, -146], eB: [34, -118], hB: [46, -142], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  splash: { head: [40, -172], sh: [24, -150], hip: [0, -100], eF: [44, -138], hF: [46, -176], eB: [38, -136], hB: [40, -172], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  twoFinger: { head: [5, -205], sh: [1, -172], hip: [0, -100], eF: [16, -140], hF: [26, -170], eB: [-7, -136], hB: [-9, -100], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  carryBag: { head: [8, -200], sh: [3, -170], hip: [0, -100], eF: [10, -132], hF: [12, -96], eB: [-6, -134], hB: [-8, -98], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  slam: { head: [20, -196], sh: [12, -168], hip: [0, -100], eF: [50, -150], hF: [80, -128], eB: [-6, -136], hB: [-12, -104], kF: [8, -50], fF: [8, 0], kB: [-6, -50], fB: [-14, 0] },
  sitBoss: { head: [6, -182], sh: [2, -148], hip: [0, -72], eF: [24, -116], hF: [50, -118], eB: [16, -116], hB: [42, -116], kF: [44, -74], fF: [46, 0], kB: [40, -72], fB: [38, 0] },
  armsWide: { head: [5, -208], sh: [1, -174], hip: [0, -100], eF: [30, -150], hF: [58, -170], eB: [-26, -150], hB: [-50, -168], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  pointDoor: { head: [8, -210], sh: [4, -176], hip: [0, -100], eF: [40, -182], hF: [82, -186], eB: [-8, -136], hB: [-14, -102], kF: [8, -50], fF: [8, 0], kB: [-6, -50], fB: [-14, 0] },
  shoulderTap: { head: [4, -208], sh: [1, -174], hip: [0, -100], eF: [26, -170], hF: [54, -176], eB: [-7, -136], hB: [-9, -100], kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-11, 0] },
  eat: { head: [12, -176], sh: [5, -146], hip: [0, -72], eF: [24, -116], hF: [30, -154], eB: [18, -114], hB: [44, -108], kF: [44, -74], fF: [46, 0], kB: [40, -72], fB: [38, 0] },
};
export { POSES };

// ---------- clocks ----------
// glowing bedside LED clock "12:00 AM"
export function ledClock(g, x, y, s, str, o = {}) {
  const col = o.color || '#ff4a3a', a = o.a ?? 1;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  rr(g, -120, -46, 240, 92, 18); g.fillStyle = o.body || '#0b0c14'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 3; g.stroke();
  rr(g, -104, -32, 208, 64, 8); g.fillStyle = '#05060a'; g.fill();
  const [hm, ap] = str.split(' ');
  text(g, hm, -16, 2, { size: 58, font: FONTS.ui, weight: 900, color: col, glow: 24, glowColor: alpha(col, 0.9), spacing: 2 });
  text(g, ap || '', 76, 14, { size: 20, font: FONTS.ui, weight: 900, color: col, glow: 10, glowColor: alpha(col, 0.8) });
  g.restore();
  glow(g, x, y, 170 * s, col, 0.22 * a);
}
// analog wall clock at a given time in hours (e.g. 9.5 = 9:30)
export function wallClock(g, x, y, r, hours, o = {}) {
  const face = o.face || '#e9e6dc', ink = o.ink || '#16141c';
  circle(g, x, y + r * 0.06, r * 1.06, 'rgba(0,0,0,.35)'); circle(g, x, y, r, face); ring(g, x, y, r, r * 0.09, o.rimC || '#2a2830');
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; seg(g, [[x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.74], [x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86]], r * (i % 3 ? 0.035 : 0.07), ink); }
  const h = hours % 12, m = (hours * 60) % 60, A = v => v * Math.PI * 2 - Math.PI / 2;
  seg(g, [[x, y], [x + Math.cos(A(h / 12)) * r * 0.48, y + Math.sin(A(h / 12)) * r * 0.48]], r * 0.08, ink);
  seg(g, [[x, y], [x + Math.cos(A(m / 60)) * r * 0.72, y + Math.sin(A(m / 60)) * r * 0.72]], r * 0.05, ink);
  if (o.sec != null) seg(g, [[x, y], [x + Math.cos(A(o.sec / 60)) * r * 0.78, y + Math.sin(A(o.sec / 60)) * r * 0.78]], r * 0.02, '#d64a33');
  circle(g, x, y, r * 0.06, ink);
}
export const hhmm = (h) => { const H = Math.floor(h) % 24, M = Math.floor((h * 60) % 60); const ap = H >= 12 ? 'PM' : 'AM', h12 = H % 12 === 0 ? 12 : H % 12; return `${h12}:${String(M).padStart(2, '0')} ${ap}`; };

// ---------- INSTICKRAM ----------
const IG1 = '#19d3c5', IG2 = '#b7ff3d', IG3 = '#7a5cff';
export function logo(g, cx, cy, s, t = 0, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(cx, cy); g.scale(s, s);
  rr(g, -60, -60, 120, 120, 34); g.fillStyle = linGrad(g, -60, 60, 60, -60, [IG3, IG1, IG2]); g.fill();
  rr(g, -38, -38, 76, 76, 20); g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.stroke();
  // a little stick figure waving inside the frame
  const w = Math.sin(t * 6) * 0.35; g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.lineCap = 'round';
  circle(g, 0, -12, 9, '#ffffff'); seg(g, [[0, -2], [0, 18]], 7, '#ffffff'); seg(g, [[0, 18], [-9, 30]], 6, '#ffffff'); seg(g, [[0, 18], [9, 30]], 6, '#ffffff');
  seg(g, [[0, 4], [-12, 12]], 6, '#ffffff'); seg(g, [[0, 4], [12 + w * 6, -8 - w * 6]], 6, '#ffffff');
  circle(g, 24, -24, 5, '#ffffff');
  g.restore();
}
export function wordmark(g, x, y, size, a = 1, color = '#ffffff') { text(g, 'instickram', x, y, { size, font: FONTS.title, weight: 700, color, alpha: a, align: 'left', spacing: 0.5 }); }
const heart = (g, x, y, s, col) => { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(-26, -8, -12, -30, 0, -14); g.bezierCurveTo(12, -30, 26, -8, 0, 10); g.fill(); g.restore(); };
// UI chrome over a vertical video panel (vx, vy, vw, vh): app bar, side actions, caption, progress
export function chrome(g, vx, vy, vw, vh, t, o = {}) {
  const k = vw / 1080, a = o.a ?? 1; g.save(); g.globalAlpha *= a;
  g.fillStyle = linGrad(g, 0, vy, 0, vy + 260 * k, ['rgba(0,0,0,.45)', 'rgba(0,0,0,0)']); g.fillRect(vx, vy, vw, 260 * k);
  g.fillStyle = linGrad(g, 0, vy + vh - 420 * k, 0, vy + vh, ['rgba(0,0,0,0)', 'rgba(0,0,0,.55)']); g.fillRect(vx, vy + vh - 420 * k, vw, 420 * k);
  logo(g, vx + 90 * k, vy + 100 * k, 0.48 * k, t); wordmark(g, vx + 136 * k, vy + 102 * k, 52 * k);
  text(g, 'For you', vx + vw - 70 * k, vy + 102 * k, { size: 34 * k, font: FONTS.ui, weight: 900, color: '#ffffff', align: 'right', alpha: 0.9 });
  const ix = vx + vw - 90 * k; let iy = vy + vh - 760 * k;
  const pulse = o.like ? 1 + 0.25 * Math.max(0, Math.sin(t * 8)) * (o.like) : 1;
  heart(g, ix, iy, 2.1 * k * pulse, o.liked ? '#ff4f7b' : '#ffffff'); text(g, o.likes || '248K', ix, iy + 52 * k, { size: 28 * k, font: FONTS.ui, weight: 900, color: '#fff' }); iy += 150 * k;
  rr(g, ix - 34 * k, iy - 30 * k, 68 * k, 52 * k, 20 * k); g.fillStyle = '#fff'; g.fill(); poly(g, [[ix - 10 * k, iy + 20 * k], [ix + 4 * k, iy + 20 * k], [ix - 14 * k, iy + 36 * k]], '#fff'); text(g, o.comments || '3.1K', ix, iy + 66 * k, { size: 28 * k, font: FONTS.ui, weight: 900, color: '#fff' }); iy += 160 * k;
  poly(g, [[ix - 28 * k, iy + 18 * k], [ix + 30 * k, iy - 6 * k], [ix - 28 * k, iy - 30 * k], [ix - 18 * k, iy - 6 * k]], '#fff'); text(g, 'Share', ix, iy + 56 * k, { size: 26 * k, font: FONTS.ui, weight: 900, color: '#fff' });
  text(g, '@' + (o.user || 'user'), vx + 56 * k, vy + vh - 300 * k, { size: 40 * k, font: FONTS.ui, weight: 900, color: '#fff', align: 'left' });
  text(g, o.caption || '', vx + 56 * k, vy + vh - 240 * k, { size: 32 * k, font: FONTS.ui, weight: 800, color: 'rgba(255,255,255,.9)', align: 'left' });
  rr(g, vx + 56 * k, vy + vh - 150 * k, vw - 112 * k, 8 * k, 4 * k); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill();
  rr(g, vx + 56 * k, vy + vh - 150 * k, (vw - 112 * k) * clamp(o.progress ?? 0.5), 8 * k, 4 * k); g.fillStyle = '#ffffff'; g.fill();
  g.restore();
}
// phone body around a screen rect; content(g, x, y, w, h) is clipped to the screen
export function phoneBody(g, x, y, w, h, content, o = {}) {
  const b = w * 0.05; rr(g, x - b, y - b, w + 2 * b, h + 2 * b, w * 0.14); g.fillStyle = o.body || '#07080d'; g.fill();
  g.strokeStyle = o.edge || 'rgba(160,200,255,.35)'; g.lineWidth = Math.max(1.5, w * 0.012); g.stroke();
  g.save(); rr(g, x, y, w, h, w * 0.1); g.clip(); content(g, x, y, w, h); g.restore();
  rr(g, x + w * 0.38, y + w * 0.03, w * 0.24, w * 0.05, w * 0.025); g.fillStyle = '#000'; g.fill();
}

// ---------- the five Instickram videos, drawn in a virtual 1080×1920 vertical frame ----------
// vid(g, kind, t, x, y, w, h, o): draws the video scaled into the rect
export function vid(g, kind, t, x, y, w, h, o = {}) {
  const k = w / 1080; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y); g.scale(k, k);
  (VIDS[kind] || VIDS.doctor)(g, t, o); g.restore();
}
const VW = 1080, VH = 1920;
const floor = (g, y, c1, c2) => { g.fillStyle = linGrad(g, 0, y, 0, VH, [c1, c2]); g.fillRect(0, y, VW, VH - y); };
const VIDS = {
  doctor(g, t, o) {
    g.fillStyle = linGrad(g, 0, 0, 0, VH, ['#cfe6f2', '#9cc6dc']); g.fillRect(0, 0, VW, VH);
    floor(g, 1380, '#7fa9c0', '#4f7890');
    // poster: 8 HOURS
    rr(g, 120, 360, 360, 460, 18); g.fillStyle = '#ffffff'; g.fill(); text(g, 'SLEEP', 300, 440, { size: 64, color: '#2a5a7a', font: FONTS.title }); text(g, '8 HRS', 300, 530, { size: 92, color: '#19a8a0', font: FONTS.title });
    rr(g, 180, 600, 240, 90, 20); g.fillStyle = '#7fb4d6'; g.fill(); circle(g, 220, 620, 30, '#ffffff'); text(g, 'z z z', 330, 760, { size: 50, color: '#7a8ca0', font: FONTS.title });
    FX.windowFrame(g, { x: 600, y: 330, w: 360, h: 420, cols: 2, rows: 2, frame: '#e8f2f8', bar: 14 }, (g, x, y, w, h) => { g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#8fd0ff', '#e6f7ff']); g.fillRect(x, y, w, h); });
    const late = t > (o.lateAt ?? 99), tw = late ? Math.sin(t * 40) * 0.6 : 0;
    const gestures = posesAt(t % 6, [[0, 'explain'], [1.4, 'pointUp'], [2.6, 'talk'], [3.8, 'explain']], 0.3);
    drawFigure(g, { x: 560, y: 1500, s: 3.6, facing: -1, outfit: DOCTOR, pose: breathe(late ? POSES.shrug : gestures, t, 1.5), expr: late ? 'nervous' : 'happy', talk: o.talk || 0, rim: { color: '#ffffff', dir: [0.6, -1], w: 5 }, face: late ? { lid: 0.35 + tw * 0.1, bags: 1 } : null });
    if (late) for (let i = 0; i < 4; i++) { const cx = 840, cy = 1470 - i * 82; rr(g, cx - 40, cy - 74, 80, 80, 10); g.fillStyle = i % 2 ? '#f2efe8' : '#e8e2d6'; g.fill(); g.fillStyle = '#6a4a2a'; g.fillRect(cx - 32, cy - 72, 64, 12); }
  },
  doctorEnd(g, t, o) {
    VIDS.doctor(g, t + 6, { ...o, lateAt: 0 });
    for (let i = 0; i < 14; i++) { const r = rng(i + 4), ph = (t * 0.8 + r()) % 1, x = 860 + Math.sin(i * 1.7 + t * 2) * 60 * ph, y = 1180 - ph * 800; heart(g, x, y, 1.4 + r(), alpha('#ff4f7b', 1 - ph)); }
  },
  cat(g, t) {
    g.fillStyle = linGrad(g, 0, 0, 0, VH, ['#f0d9b5', '#d9b98e']); g.fillRect(0, 0, VW, VH);
    g.fillStyle = '#c99a6a'; g.fillRect(0, 1050, VW, 70); g.fillStyle = '#a87a4e'; g.fillRect(0, 1120, VW, 30); g.fillStyle = '#6a4a32'; g.fillRect(140, 1150, 30, 600); g.fillRect(910, 1150, 30, 600);
    floor(g, 1700, '#b08a62', '#8a6a4a');
    // cat body (stick-cat): oval + head + ears + tail
    const push = ease.inOut(prog(t, 0.3, 1.5)), look = prog(t, 2.0, 2.4);
    const cx = 420, cy = 960; g.fillStyle = '#111018';
    g.beginPath(); g.ellipse(cx, cy, 170, 95, 0, 0, Math.PI * 2); g.fill();
    seg(g, [[cx - 150, cy + 10], [cx - 260, cy - 80 + Math.sin(t * 3) * 30], [cx - 230, cy - 200]], 26, '#111018');
    const hx = cx + 170 + look * 20, hy = cy - 110; circle(g, hx, hy, 92, '#111018'); poly(g, [[hx - 80, hy - 40], [hx - 50, hy - 140], [hx - 10, hy - 70]], '#111018'); poly(g, [[hx + 80, hy - 40], [hx + 50, hy - 140], [hx + 10, hy - 70]], '#111018');
    const ex = look ? 0 : 18; circle(g, hx - 34 + ex, hy - 6, 20, '#f6f0c8'); circle(g, hx + 34 + ex, hy - 6, 20, '#f6f0c8'); circle(g, hx - 34 + ex + look * 0, hy - 4, 9, '#111018'); circle(g, hx + 34 + ex, hy - 4, 9, '#111018');
    seg(g, [[hx - 12, hy + 40], [hx + 12, hy + 40]], 6, '#f6f0c8');
    // paw reaching for the glass
    const px = lerp(cx + 220, cx + 330, push), py = cy - 20 - Math.sin(push * Math.PI) * 30; seg(g, [[cx + 120, cy - 10], [px, py]], 34, '#111018');
    // glass: on table, then tipping and falling, then shards
    const gx0 = 780; const fall = prog(t, 1.35, 1.75);
    if (t < 1.75) { g.save(); g.translate(gx0 + fall * 120, 1040 + fall * fall * 640); g.rotate(fall * 2.2 + push * 0.15); rr(g, -46, -150, 92, 150, 10); g.fillStyle = 'rgba(200,235,255,.55)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.stroke(); g.fillStyle = 'rgba(120,190,255,.5)'; g.fillRect(-40, -70, 80, 66); g.restore(); }
    else { const r = rng(9); for (let i = 0; i < 16; i++) { const a = r() * Math.PI, sp = 200 + r() * 400, tt = t - 1.75, sx = 900 + Math.cos(a) * sp * Math.min(tt, 0.5) * 1.6 * (r() > .5 ? 1 : -1), sy = 1700 - Math.sin(a) * sp * Math.min(tt, .5) + 600 * Math.min(tt, .5) ** 2; poly(g, [[sx, sy], [sx + 18, sy + 6], [sx + 4, sy + 22]], 'rgba(220,240,255,.8)'); } }
    if (t > 1.8) text(g, '!', hx + 120, hy - 150, { size: 120, color: '#111018', font: FONTS.title, alpha: prog(t, 1.8, 2.0) });
  },
  chairs(g, t, o) {
    g.fillStyle = linGrad(g, 0, 0, 0, VH, ['#8fd0ff', '#d6f0ff']); g.fillRect(0, 0, VW, VH);
    g.fillStyle = '#6fb85a'; g.fillRect(0, 1240, VW, VH); g.fillStyle = '#5aa04a'; for (let i = 0; i < 12; i++) g.fillRect(0, 1260 + i * 60, VW, 4);
    FX.tree(g, 120, 1240, 2.2, '#3a7a40'); FX.tree(g, 980, 1240, 2.6, '#2f6a38');
    text(g, '12 CHAIR CHALLENGE', VW / 2, 360, { size: 78, color: '#ffffff', font: FONTS.title, stroke: 10, strokeColor: '#1a1a24' });
    const crash = 3.45, run = clamp(t / crash), base = 1500;
    // chairs in a row (scatter after the crash)
    for (let i = 0; i < 12; i++) { const cx = 330 + i * 52, tt = t - crash - i * 0.03, hit = tt > 0 && i < 7; const dx = hit ? (220 + i * 30) * Math.min(tt, 0.7) * (i % 2 ? 1 : 0.6) : 0, dy = hit ? -Math.sin(Math.min(tt, 0.7) / 0.7 * Math.PI) * (160 + i * 10) : 0;
      g.save(); g.translate(cx + dx, base + dy); g.rotate(hit ? Math.min(tt, .7) * (i % 2 ? 6 : -5) : 0); g.translate(-cx, -base); FX.chair(g, cx, base, 0.9, i % 2 ? '#e04a3a' : '#3a6ea5'); g.restore(); }
    let x, y, pose, rot = 0;
    if (t < 2.4) { x = lerp(-120, 230, prog(t, 0.2, 2.4)); y = base; pose = t < 0.2 ? POSES.ready : walkPose(t * 2 * Math.PI * 1.7, { run: true }); }
    else if (t < crash) { const k = prog(t, 2.4, crash); x = lerp(230, 470, k); y = base - Math.sin(k * Math.PI) * 220; pose = POSES.jump; rot = k * 0.6; }
    else { const k = ease.out(prog(t, crash, crash + 0.6)); x = 480 + k * 60; y = base - 10; pose = POSES.fall; rot = 1.3 + k * 0.3; }
    drawFigure(g, { x, y, s: 2.4, facing: 1, outfit: CHAIR_GUY, pose, rot, expr: t < crash ? 'determined' : 'shocked', talk: o.talk || 0, rim: { color: '#ffffff', dir: [-0.5, -1], w: 4 } });
    if (t > crash) { FX.rings(g, 500, base - 120, t - crash, { count: 3, r0: 40, r1: 320, color: '#ffffff', a: 0.8 * (1 - prog(t, crash, crash + 1)), speed: 1.4, w: 6 }); for (let i = 0; i < 5; i++) text(g, '*', 420 + i * 60, base - 300 - Math.sin(t * 6 + i) * 20, { size: 70, color: '#ffe14a', font: FONTS.title, alpha: prog(t, crash + 0.2, crash + 0.4) }); }
  },
  dance(g, t, o) {
    g.fillStyle = linGrad(g, 0, 0, 0, VH, ['#1a0a3a', '#3a1a6a']); g.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 5; i++) { const a = Math.sin(t * 2 + i * 1.3) * 0.5 + Math.PI / 2; FX.lightCone(g, 120 + i * 210, -40, { angle: a, spread: 0.32, len: 1900, color: ['#ff4fa3', '#5ff2e8', '#ffe14a', '#7a5cff', '#ff8a5c'][i], a: 0.22 }); }
    floor(g, 1460, '#2a1450', '#140830'); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { rr(g, 40 + i * 170, 1490 + j * 140, 150, 120, 8); g.fillStyle = alpha(['#ff4fa3', '#5ff2e8', '#7a5cff'][(i + j + Math.floor(t * 4)) % 3], 0.35); g.fill(); }
    const b = t * 2.2 * Math.PI, cyc = ['cheer', 'point', 'wave', 'kick', 'cheer', 'handsOnHead'], i = Math.floor(t * 2.2) % cyc.length, f = (t * 2.2) % 1;
    const pose = blendPose(cyc[i], cyc[(i + 1) % cyc.length], ease.inOut(clamp(f * 2 - 0.4)));
    drawFigure(g, { x: VW / 2 + Math.sin(b / 2) * 60, y: 1560 - Math.abs(Math.sin(b)) * 40, s: 3.4, facing: Math.sin(b / 2) > 0 ? 1 : -1, outfit: DANCER, pose, expr: 'joy', rim: { color: '#5ff2e8', dir: [0, -1], w: 5 } });
  },
  mud(g, t, o) {
    g.fillStyle = linGrad(g, 0, 0, 0, VH, ['#a8d8ff', '#e8f6ff']); g.fillRect(0, 0, VW, VH);
    FX.facade(g, { x: -40, y: 1180, w: 600, h: 520, color: '#d8c4a8', win: '#9fd8ff', dark: '#8fa8b8', cols: 3, rows: 2, lit: 1, seed: 3 }); FX.facade(g, { x: 600, y: 1180, w: 520, h: 600, color: '#c4b4a0', win: '#9fd8ff', dark: '#8fa8b8', cols: 3, rows: 2, lit: 1, seed: 5 });
    g.fillStyle = '#8a8a90'; g.fillRect(0, 1180, VW, VH); g.fillStyle = '#a0a0a6'; g.fillRect(0, 1180, VW, 40);
    // the puddle
    g.fillStyle = '#5a3e26'; g.beginPath(); g.ellipse(560, 1560, 330, 90, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(160,200,230,.35)'; g.beginPath(); g.ellipse(520, 1540, 200, 30, 0, 0, Math.PI * 2); g.fill();
    text(g, 'POOL DAY', VW / 2, 340, { size: 110, color: '#ffffff', font: FONTS.title, stroke: 12, strokeColor: '#1a1a24' });
    const jump = 1.75, land = 2.55;
    let x = 260, y = 1520, pose = POSES.stand, rot = 0;
    if (t < jump) { pose = posesAt(t, [[0, 'stand'], [0.4, 'cheer'], [1.2, 'crouch']], 0.3); }
    else if (t < land) { const k = prog(t, jump, land); x = lerp(260, 560, k); y = 1520 - Math.sin(k * Math.PI) * 480; pose = POSES.crouch; rot = k * 1.2; }
    if (t < land + 0.05) drawFigure(g, { x, y, s: 2.6, facing: 1, outfit: MUD_GUY, pose, rot, expr: 'joy', talk: o.talk || 0, rim: { color: '#ffffff', dir: [0.5, -1], w: 4 } });
    else { // splash + head popping out, covered in mud
      const k = t - land; const r = rng(7);
      for (let i = 0; i < 26; i++) { const a = -Math.PI * (0.1 + r() * 0.8), sp = 500 + r() * 700, x2 = 560 + Math.cos(a) * sp * k, y2 = 1540 + Math.sin(a) * sp * k + 1400 * k * k; if (y2 < 1600) circle(g, x2, y2, 10 + r() * 18, '#5a3e26'); }
      if (k > 0.5) { circle(g, 560, 1540 - Math.min(1, (k - 0.5) * 3) * 60, 66, '#4a3220'); circle(g, 535, 1520 - Math.min(1, (k - 0.5) * 3) * 60, 13, '#f2efe8'); circle(g, 585, 1520 - Math.min(1, (k - 0.5) * 3) * 60, 13, '#f2efe8'); }
    }
  },
};
VIDS.chairsAlt = VIDS.chairs;

// ---------- misc ----------
// phone glow on a face/area (additive)
export const phoneGlow = (g, x, y, r, a = 0.5) => { glow(g, x, y, r, PHONE, a); };
export function letterText(g, str, x, y, size, o = {}) { text(g, str, x, y, { size, font: o.font || FONTS.title, weight: 700, color: o.color || '#e8eeff', spacing: o.spacing ?? 14, glow: o.glow ?? 18, glowColor: o.glowColor || 'rgba(120,170,255,.6)', alpha: o.a ?? 1 }); }
export { FX, drawFigure, posesAt, breathe, walkPose, blendPose };
