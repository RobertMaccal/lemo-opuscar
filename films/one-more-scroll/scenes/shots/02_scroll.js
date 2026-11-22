// shots/02_scroll.js — SCENE 02: INSTICKRAM. Clock spine, phone portal into five videos, Jeff's reactions, "time to sleep".
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, alpha, shade, mix, seg, circle, ring, rr, poly, linGrad, radGrad, glow, text, FONTS } from '/engine/core.js';
import { drawFigure, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bedroom, bedClock, blanket, heldPhone, rigPt, BED } from '../sets/bedroom.js';
import { P, PHONE, mouth, blinkAt, gT, vid, chrome, phoneBody, logo, wordmark, ledClock, hhmm, lineOf } from '../_kit.js';
import { START } from '../_timeline.js';
import { jeff, jeffHome } from '../cast.js';
import { jeffInBed } from './01_world.js';

// camera that centres world point (wx, wy) of a layer at depth d, zoom z
export const focus = (wx, wy, z, d = 1) => ({ z, x: (wx - E.W / 2) / d, y: (wy - E.H / 2) / d });
const roomBlur = (g, t, cam, amt, o = {}) => blurLayer(g, amt, (g) => { bedroom(g, t, cam, o); jeffInBed(g, t, cam, o.jeff || {}); });

// ---------- vertical video panel filling the frame, with blurred side fill ----------
// push: 0 = phone-sized (OTS), 1 = full frame
export function videoPanel(g, t, kind, vt, o = {}) {
  const push = o.push ?? 1, H0 = E.H * 0.98, W0 = H0 * 9 / 16;
  const ph = lerp(o.fromH ?? 520, H0, ease.inOut(push)), pw = ph * 9 / 16, px = lerp(o.fromX ?? E.W * 0.56, E.W / 2, ease.inOut(push)) - pw / 2, py = E.H / 2 - ph / 2 + lerp(o.fromDY ?? 0, 0, ease.inOut(push));
  if (push > 0.6) { // blurred enlarged copy of the video as side fill
    const a = clamp((push - 0.6) / 0.4);
    blurLayer(g, 22, (g) => { g.globalAlpha = a; vid(g, kind, vt, E.W / 2 - E.W * 0.6, -E.W * 0.55, E.W * 1.2, E.W * 1.2 * 16 / 9, o.vo || {}); });
    veil(g, '#05060c', 0.55 * a);
  }
  const sw = o.swipe ?? 0;   // 0..1 slide the previous video up
  phoneBody(g, px, py, pw, ph, (g, x, y, w, h) => {
    if (sw > 0 && sw < 1 && o.prev) { vid(g, o.prev, o.prevT ?? vt, x, y - h * ease.inOut(sw), w, h, o.prevVo || {}); vid(g, kind, vt, x, y + h * (1 - ease.inOut(sw)), w, h, o.vo || {}); }
    else vid(g, kind, vt, x, y, w, h, o.vo || {});
    chrome(g, x, y, w, h, vt, { user: o.user, caption: o.caption, likes: o.likes, comments: o.comments, progress: o.progress ?? clamp(vt / (o.len || 6)), liked: o.liked, like: o.like });
    if (o.thumb) { const ty = y + h * 0.62 - (sw > 0 ? h * 0.25 * Math.sin(sw * Math.PI) : 0); circle(g, x + w * 0.52, ty, w * 0.06, 'rgba(255,255,255,.28)'); }
  }, { edge: alpha(PHONE, 0.4) });
  if (push < 1) glow(g, px + pw / 2, py + ph / 2, ph * 0.8, PHONE, 0.25 * (1 - push));
  return { px, py, pw, ph };
}

// ---------- s06: clock 12:00 AM, rack focus from Jeff to the clock ----------
registerShot('s06', { draw(g, t, info) {
  const k = ease.inOut(prog(t, 0.4, 1.6)), cam = focus(BED.clockX - 120, BED.clockY - 10, lerp(2.4, 2.6, t / info.dur), 0.7);
  roomBlur(g, t, cam, lerp(0.5, 12, k), { lamp: 1 });
  blurLayer(g, lerp(10, 0, k), (g) => bedClock(g, cam, '12:00 AM'));
  FX.dust(g, t, { count: 24, color: '#ffe0b8', a: 0.3 });
} });

// ---------- s07: over the shoulder, Instickram opens ----------
registerShot('s07', { draw(g, t, info) {
  blurLayer(g, 14, (g) => { bedroom(g, t, focus(1000, 300, 1.6, 0.7), { lamp: 1 }); });
  veil(g, '#060814', 0.45);
  const drift = ease.inOut(t / info.dur);
  g.save(); g.translate(E.W * 0.58 + drift * -20, E.H * 0.5); g.rotate(-0.05 + drift * 0.02); g.scale(1 + drift * 0.05, 1 + drift * 0.05);
  const pw = 330, ph = pw * 16 / 9;
  phoneBody(g, -pw / 2, -ph / 2, pw, ph, (g, x, y, w, h) => {
    g.fillStyle = '#05060c'; g.fillRect(x, y, w, h);
    const a = ease.outBack(prog(t, 0.25, 0.8)), f = prog(t, 1.6, 2.2);
    if (f < 1) { glow(g, 0, -40, 260, '#19d3c5', 0.35 * a * (1 - f)); logo(g, 0, -40, 1.3 * a, t, 1 - f); wordmark(g, -118, 90, 52, clamp((t - 0.7) / 0.3) * (1 - f)); }
    if (f > 0) { g.globalAlpha = f; vid(g, 'doctor', 0, x, y, w, h); chrome(g, x, y, w, h, 0, { user: 'dr.stick', caption: 'the ONE sleep rule doctors swear by', progress: 0.02 }); g.globalAlpha = 1; }
  }, { edge: alpha(PHONE, 0.5) });
  // thumb
  const th = prog(t, 0.1, 0.3) * (1 - prog(t, 0.45, 0.7)); circle(g, 40, 230 - th * 60, 46, alpha('#0e0b12', 0.9 * (0.3 + th)));
  g.restore();
  glow(g, E.W * 0.58, E.H * 0.5, 520, PHONE, 0.18);
  // Jeff's head and shoulder, blurred foreground (over the shoulder)
  blurLayer(g, 7, (g) => { const hx = E.W * 0.12, hy = E.H * 0.98, r = 300;   // back of Jeff's head + shoulder, no face
    g.fillStyle = '#d8d6e0'; g.beginPath(); g.ellipse(hx - 120, hy + 380, 520, 300, -0.2, 0, Math.PI * 2); g.fill();
    circle(g, hx + 8, hy - 4, r + 10, PHONE); circle(g, hx, hy, r, '#0a0c16');
    g.fillStyle = '#0a0c16'; for (const [a, l] of [[-2.2, 1.35], [-1.9, 1.5], [-1.6, 1.3], [-1.3, 1.42]]) { g.beginPath(); g.moveTo(hx + Math.cos(a - 0.12) * r * 0.9, hy + Math.sin(a - 0.12) * r * 0.9); g.lineTo(hx + Math.cos(a) * r * l, hy + Math.sin(a) * r * l); g.lineTo(hx + Math.cos(a + 0.12) * r * 0.9, hy + Math.sin(a + 0.12) * r * 0.9); g.fill(); } });
} });

// ---------- shared: doctor video time = since the doctor line started ----------
const docT = (globalT) => globalT - (lineOf('v1').t0 - 0.3);
const lateAt = () => lineOf('v1').t0 - (lineOf('v1').t0 - 0.3) + 3.6;
registerShot('s08', { draw(g, t, info) {
  const G = gT('s08', t), push = ease.inOut(prog(t, 0, 0.7));
  blurLayer(g, 16, (g) => bedroom(g, t, focus(1000, 300, 1.6, 0.7), { lamp: 1 })); veil(g, '#060814', 0.5);
  videoPanel(g, t, 'doctor', docT(G), { push, fromH: 587, fromX: E.W * 0.58, vo: { talk: mouth('PHONE', G), lateAt: lateAt() }, user: 'dr.stick', caption: 'the ONE sleep rule doctors swear by', len: 8.4, likes: '1.2M' });
} });
registerShot('s09', { draw(g, t, info) {
  const G = gT('s09', t), z = 1 + t * 0.03;
  blurLayer(g, 14, (g) => bedroom(g, t, focus(1300, 600, 2.2, 0.7), { lamp: 1 })); veil(g, '#060814', 0.35);
  const r = 300 * z, cx = E.W * 0.5, cy = E.H * 0.6;
  bigFace(g, cx, cy, r, { outfit: jeffHome(0.05), expr: t > 0.5 ? 'amused' : 'neutral', look: [0.1, 0.5], rimColor: PHONE, rimSide: 1, blink: blinkAt(t, 3, 0.8) });
  glow(g, cx + 40, cy + r * 1.1, r * 1.4, PHONE, 0.35);
  FX.dust(g, t, { count: 20, color: '#cfe8ff', a: 0.25 });
} });
registerShot('s10', { draw(g, t, info) {
  const G = gT('s10', t);
  blurLayer(g, 16, (g) => bedroom(g, t, focus(1000, 300, 1.6, 0.7), { lamp: 1 })); veil(g, '#060814', 0.5);
  videoPanel(g, t, 'doctorEnd', docT(G) - 6, { vo: { talk: mouth('PHONE', G) }, user: 'dr.stick', caption: 'the ONE sleep rule doctors swear by', len: 2.2, progress: 0.9 + t * 0.05, likes: '1.2M', liked: t > 1.2, like: t > 1.2 ? 1 : 0 });
} });
const swipeShot = (id, kind, prev, o = {}) => registerShot(id, { draw(g, t, info) {
  const G = gT(id, t);
  blurLayer(g, 16, (g) => bedroom(g, t, focus(1000, 300, 1.6, 0.7), { lamp: o.lamp ?? 0, dark: o.dark ?? 0.3, moon: o.moon || 0 })); veil(g, '#060814', 0.5);
  videoPanel(g, t, kind, Math.max(0, t - 0.3), { swipe: prog(t, 0, 0.35), prev, prevT: o.prevT ?? 3, vo: { talk: mouth('PHONE', G) }, user: o.user, caption: o.caption, likes: o.likes, len: info.dur - 0.3, thumb: t < 0.4 });
} });
swipeShot('s11', 'cat', 'doctorEnd', { lamp: 1, dark: 0, user: 'catgremlin', caption: 'he knew exactly what he was doing', likes: '892K' });
swipeShot('s13', 'chairs', 'cat', { user: 'jumpman.12', caption: 'attempt #47. today is the day', likes: '3.4M' });
swipeShot('s16', 'dance', 'chairs', { moon: 0.4, dark: 0.45, user: 'stickmoves', caption: 'learn this in 5 seconds', likes: '5.1M', prevT: 4.5 });
swipeShot('s19', 'mud', 'dance', { moon: 0.7, dark: 0.55, user: 'backyard.olympics', caption: 'who needs a pool', likes: '7.7M', prevT: 2 });

// ---------- clock time-lapses (the clock spine) ----------
function clockLapse(g, t, info, h0, h1, o = {}) {
  const k = ease.inOut(prog(t, o.a ?? 0.1, o.b ?? info.dur - 0.3)), h = lerp(h0, h1, k);
  const lamp = o.lampOff != null ? (t < o.lampOff ? 1 : 0) : o.lamp ?? 0;
  const cam = o.cam || focus(1460, 560, lerp(1.9, 2.05, t / info.dur), 0.7);
  bedroom(g, t, cam, { lamp, dark: o.dark ?? (lamp ? 0 : 0.35), moon: lerp(o.m0 || 0, o.m1 || 0, k) });
  jeffInBed(g, t, cam, { expr: o.expr || 'neutral', mess: o.mess || 0 });
  // motion trails on the digits while time races
  const fast = Math.sin(k * Math.PI);
  if (fast > 0.2) for (let i = 1; i <= 3; i++) bedClock(g, cam, hhmm(lerp(h0, h1, Math.max(0, k - i * 0.03))), { a: 0.18 * fast });
  bedClock(g, cam, hhmm(h));
  if (o.lampOff != null && t > o.lampOff && t < o.lampOff + 0.12) veil(g, '#000', 0.25);
  FX.dust(g, t * (1 + fast * 6), { count: 26, color: '#cfe0ff', a: 0.22 });
}
registerShot('s12', { draw(g, t, info) { clockLapse(g, t, info, 0, 0.75, { lampOff: 1.4 }); } });
registerShot('s15', { draw(g, t, info) { clockLapse(g, t, info, 0.75, 1.5, { cam: focus(1180, 470, 1.35, 0.7), m0: 0.2, m1: 0.5, dark: 0.4 }); } });
registerShot('s18', { draw(g, t, info) {
  const cam = focus(BED.clockX - 60, BED.clockY, lerp(3.0, 3.4, t / info.dur), 0.7);
  clockLapse(g, t, info, 2.25, 2.84, { cam, m0: 0.6, m1: 0.8, dark: 0.5, a: 0.05, b: info.dur - 0.1 });
} });

// ---------- s14: Jeff raises his eyebrows ----------
registerShot('s14', { draw(g, t, info) {
  const cam = focus(1330, 690, lerp(2.9, 3.05, t / info.dur), 1);
  bedroom(g, t, cam, { lamp: 0, dark: 0.35, moon: 0.3 });
  jeffInBed(g, t, cam, { expr: t > 0.6 ? 'surprised' : 'neutral', look: [0.1, -1], face: t > 0.6 ? { brows: 'raised' } : null });
  bedClock(g, cam, '1:04 AM');
} });

// ---------- s17: extreme close-up of the eyes, the video reflected in them ----------
registerShot('s17', { draw(g, t, info) {
  const r = 820 + t * 30;
  g.fillStyle = '#05060c'; g.fillRect(0, 0, E.W, E.H);
  bigFace(g, E.W / 2, E.H * 0.62 + r * 0.06, r, { outfit: jeffHome(0.15), expr: 'neutral', face: { mouth: 'flat', lid: 0.18, bags: 0.4 }, rimColor: PHONE, rimSide: 1, blink: t > 1.4 && t < 1.52 });
  if (!(t > 1.4 && t < 1.52)) for (const sx of [-1, 1]) {   // tiny screens reflected in the pupils (dancing colours)
    const ex = E.W / 2 + sx * r * 0.34, ey = E.H * 0.62 + r * 0.06 - r * 0.16, c = ['#ff4fa3', '#5ff2e8', '#ffe14a', '#7a5cff'][Math.floor(t * 4.4) % 4];
    rr(g, ex - r * 0.035, ey - r * 0.06, r * 0.07, r * 0.12, r * 0.012); g.fillStyle = alpha(c, 0.85); g.fill(); g.strokeStyle = '#0e0b12'; g.lineWidth = 3; g.stroke();
    circle(g, ex - r * 0.01 + Math.sin(t * 9) * r * 0.01, ey - r * 0.02, r * 0.012, '#0e0b12');
  }
  glow(g, E.W / 2, E.H * 1.1, 900, PHONE, 0.3 + 0.08 * Math.sin(t * 9));
} });

// ---------- s20: he laughs, the laugh fades, "Okay... I think it's time to sleep." ----------
registerShot('s20', { draw(g, t, info) {
  const G = gT('s20', t), cam = focus(1250, 650, lerp(2.0, 2.35, ease.inOut(t / info.dur)), 1);
  bedroom(g, t, cam, { lamp: 0, dark: 0.55, moon: 0.9 });
  const laugh = t < 1.2, bounce = laugh ? Math.abs(Math.sin(t * 14)) * 4 : 0;
  jeffInBed(g, t, cam, { y: BED.matY - 12 + 170 - bounce, expr: laugh ? 'laugh' : t < 1.7 ? 'smile' : 'tired', talk: mouth('JEFF', G), mess: 0.2, look: [0, -1] });
  bedClock(g, cam, t < 3.0 ? '2:59 AM' : '3:00 AM');
} });
// ---------- s21: phone down, the glow dies ----------
registerShot('s21', { draw(g, t, info) {
  const cam = focus(1330, 660, 2.2, 1), k = ease.inOut(prog(t, 0.1, 0.6)), off = prog(t, 0.65, 0.75);
  bedroom(g, t, cam, { lamp: 0, dark: 0.6 + off * 0.3, moon: 0.9 });
  jeffInBed(g, t, cam, { pose: { ...P.lieHold, hF: [lerp(62, 24, k), lerp(-196, -112, k)], eF: [lerp(34, 10, k), lerp(-170, -138, k)] }, expr: 'tired', mess: 0.2, phoneOn: 1 - off, rimC: off ? '#3a4a8a' : PHONE });
  bedClock(g, cam, '3:00 AM');
  veil(g, '#000', ease.in(prog(t, 0.9, 2.1)));
} });
// ---------- s22: title in the silence ----------
registerShot('s22', { draw(g, t, info) {
  g.fillStyle = '#000'; g.fillRect(0, 0, E.W, E.H);
  const a = clamp(prog(t, 0.5, 1.4)) * (1 - prog(t, 3.1, 3.9)), fl = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7);
  text(g, 'EPISODE 1', E.W / 2, E.H / 2 - 92, { size: 30, font: FONTS.ui, weight: 900, color: '#8fa6d8', spacing: 14, alpha: a * 0.8 });
  text(g, 'ONE MORE SCROLL', E.W / 2, E.H / 2, { size: 118, font: FONTS.title, weight: 700, color: '#eef3ff', spacing: 18, glow: 34, glowColor: alpha(PHONE, 0.75), alpha: a * fl });
  g.fillStyle = alpha(PHONE, 0.5 * a); g.fillRect(E.W / 2 - 220 * a, E.H / 2 + 86, 440 * a, 2);
} });
