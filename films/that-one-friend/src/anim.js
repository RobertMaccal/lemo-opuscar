// Animation helpers: keyframes, pose tracks, idle life, lip sync, walk cycles, captions.
import { clamp, lerp, TAU } from './kit.js';
import { mixPose, pose, drawChar } from './rig.js';
import { build } from './timeline.js';
import { caption } from './shots.js';

export let TL = null, M = null;
export function initTimeline(VO) {
  TL = build(VO); M = TL.M;
  // caption windows: only key lines, never overlapping the next one, never crossing a sequence cut
  const bounds = ['s1', 's2', 's3', 's4', 's5_run', 's6', 'end'].map(k => M[k]), caps = TL.L.filter(l => l.capText);
  caps.forEach((l, i) => {
    const nb = bounds.find(b => b > l.t0 + .01) ?? TL.DUR, nx = caps[i + 1] ? caps[i + 1].t0 - .08 : TL.DUR;
    l.c0 = l.t0 - .04; l.c1 = Math.min(Math.max(l.t1 + .5, l.t0 + 1.7), nb - .02, nx);
  });
  return TL;
}
const EASE = {
  lin: x => x, io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, o: x => 1 - Math.pow(1 - x, 3), i: x => x * x * x,
  ss: x => x * x * (3 - 2 * x), back: x => { const s = 1.9; x -= 1; return 1 + x * x * ((s + 1) * x + s); }, hold: () => 0,
  bounce: x => { const k = 1 - x; return 1 - k * k * Math.abs(Math.cos(x * 7.5)); },
};
// number keyframes: [[t, v, ease?], ...] (ease belongs to the segment that ends at that key)
export function kf(t, keys) {
  const n = keys.length; if (t <= keys[0][0]) return keys[0][1]; if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1]; return lerp(a[1], b[1], (EASE[b[2]] || EASE.io)((t - a[0]) / (b[0] - a[0])));
}
// pose keyframes: [[t, fullPose, ease?], ...]
export function pk(ch, t, keys) {
  const n = keys.length; if (t <= keys[0][0]) return keys[0][1]; if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1]; return mixPose(ch, a[1], b[1], (EASE[b[2]] || EASE.io)((t - a[0]) / (b[0] - a[0])));
}
export const P_ = (ch, ...o) => pose(ch, ...o);
// breathing, sway, blinking
export function idle(p, t, sd = 0, a = 1) {
  const q = { ...p, head: { ...p.head }, e: { ...p.e } }, w = t * 1.7 + sd * 2.3;
  q.shrug = (p.shrug || 0) + Math.sin(w) * .07 * a; q.hipY = (p.hipY || 0) + Math.sin(w + .6) * 1.3 * a; q.head.tilt = (p.head.tilt || 0) + Math.sin(t * .8 + sd * 1.9) * .014 * a;
  const per = 3.3 + ((sd * .77) % 1.9), ph = (t + sd * 1.31) % per;
  if (ph < .14 && q.e.eyeOpen > .2) q.e.eyeOpen *= Math.max(.04, Math.abs(1 - 2 * ph / .14));
  return q;
}
// loudness of whoever is speaking at t (−1 when silent)
export function voice(who, t) {
  for (const l of TL.L) if (l.who === who && !l.think && t >= l.t0 - .02 && t <= l.t1 + .04) {
    const i = Math.max(0, (t - l.t0) * 30), a = l.env[Math.floor(i)] ?? 0, b = l.env[Math.floor(i) + 1] ?? 0; return clamp(lerp(a, b, i % 1), 0, 1);
  }
  return -1;
}
export const speaking = (who, t) => voice(who, t) >= 0;
export function talk(p, who, t) {
  const m = voice(who, t); if (m < 0) return p;
  const q = { ...p, head: { ...p.head }, e: { ...p.e } };
  q.e.mWavy = 0; q.e.mTeeth = 0; q.e.mO = m > .09 ? .12 + m * .7 : 0; q.e.mW = (p.e.mW || 1) * (.82 + .2 * (1 - m)) + .08;
  q.head.oy = (p.head.oy || 0) - m * 3.5; q.head.tilt = (p.head.tilt || 0) + Math.sin(t * 9) * m * .012;
  return q;
}
export const lineT = id => TL.L.find(l => l.id === id);
// leg / arm overrides for a walk; ph in cycles, dir = facing sign
export function walk(ph, dir = 1, o = {}) {
  const st = o.stride ?? 42, lift = o.lift ?? 15, s = Math.sin(ph * TAU), c = Math.cos(ph * TAU), sw = o.swing ?? .45;
  return {
    hipY: (o.hipY || 0) + 3 - Math.abs(s) * 5,
    lL: { x: s * st * dir, y: -Math.max(0, c) * lift, r: c > 0 ? -.25 : .12 * Math.abs(s) }, lR: { x: -s * st * dir, y: -Math.max(0, -c) * lift, r: c < 0 ? -.25 : .12 * Math.abs(s) },
    aL: { a: -s * sw * dir, b: .3 * dir, to: null }, aR: { a: s * sw * dir, b: .3 * dir, to: null },
  };
}
export function run(ph, dir = 1) {
  const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
  return {
    hipY: 4 - Math.abs(s) * 9,
    lL: { x: (s * 104 - 16) * dir, y: -42 - Math.max(0, c) * 56 + Math.max(0, -c) * 30, r: (c > 0 ? -.3 : .9) }, lR: { x: (-s * 104 - 16) * dir, y: -42 - Math.max(0, -c) * 56 + Math.max(0, c) * 30, r: (c < 0 ? -.3 : .9) },
    aL: { a: (-s * 1.05) * dir, b: 1.4 * dir, z: 1, to: null }, aR: { a: (s * 1.05) * dir, b: 1.4 * dir, z: 1, to: null },
  };
}
// captions for the key lines, popping in with the voice
export function captions(ctx, t, y = 1500, size = 58) {
  for (const l of TL.L) if (l.capText && t >= l.c0 && t < l.c1) {
    const k = Math.min(1, (t - l.c0) / .16) * Math.min(1, (l.c1 - t) / .1);
    caption(ctx, l.capText, y, { who: l.who, think: l.think, size: l.capText.length > 34 ? size * .9 : l.capText.length < 16 ? size * 1.18 : size, k: EASE.o(clamp(k)) });
  }
}
export { EASE };
export const drawP = (g, ch, p, x, y, s, L, opt) => drawChar(g, ch, { ...p, x, y, s }, L, opt);
// zoom about a fixed world point (px, py): it stays where it sits at z = 1
export const zoomAt = (px, py, z) => ({ x: px - (px - 540) / z, y: py - (py - 960) / z, z });
