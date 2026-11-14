// Animation helpers (from the style's engine, without the dialogue/caption layer: this film has no words).
import { clamp, lerp, TAU } from './kit.js';
import { mixPose, pose, drawChar } from './rig.js';

export const EASE = {
  lin: x => x, io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, o: x => 1 - Math.pow(1 - x, 3), i: x => x * x * x,
  ss: x => x * x * (3 - 2 * x), back: x => { const s = 1.9; x -= 1; return 1 + x * x * ((s + 1) * x + s); }, hold: () => 0,
  snap: x => 1 - Math.pow(1 - x, 5),
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
// breathing, sway, blinking (blinks are skipped while eyes are already shut)
export function idle(p, t, sd = 0, a = 1, blink = true) {
  const q = { ...p, head: { ...p.head }, e: { ...p.e } }, w = t * 1.7 + sd * 2.3;
  q.shrug = (p.shrug || 0) + Math.sin(w) * .07 * a; q.hipY = (p.hipY || 0) + Math.sin(w + .6) * 1.3 * a; q.head.tilt = (p.head.tilt || 0) + Math.sin(t * .8 + sd * 1.9) * .014 * a;
  const per = 3.3 + ((sd * .77) % 1.9), ph = (t + sd * 1.31) % per;
  if (blink && ph < .14 && q.e.eyeOpen > .2) q.e.eyeOpen *= Math.max(.04, Math.abs(1 - 2 * ph / .14));
  return q;
}
// leg / arm overrides for a walk; ph in cycles, dir = facing sign. Feet land at ph = .25 + k/2.
export function walk(ph, dir = 1, o = {}) {
  const st = o.stride ?? 42, lift = o.lift ?? 15, s = Math.sin(ph * TAU), c = Math.cos(ph * TAU), sw = o.swing ?? .45;
  return {
    hipY: (o.hipY || 0) + 3 - Math.abs(s) * (o.bob ?? 5),
    lL: { x: s * st * dir, y: -Math.max(0, c) * lift, r: c > 0 ? -.25 : .12 * Math.abs(s) }, lR: { x: -s * st * dir, y: -Math.max(0, -c) * lift, r: c < 0 ? -.25 : .12 * Math.abs(s) },
    aL: { a: -s * sw * dir, b: (o.elb ?? .3) * dir, to: null }, aR: { a: s * sw * dir, b: (o.elb ?? .3) * dir, to: null },
  };
}
// world speed that keeps the planted foot still: stride st (units), rate (cycles/s), scale s
export const walkSpeed = (st, rate, s) => 4 * st * rate * s;
export const drawP = (g, ch, p, x, y, s, L, opt) => drawChar(g, ch, { ...p, x, y, s }, L, opt);
// zoom about a fixed world point (px, py): it stays where it sits at z = 1
export const zoomAt = (px, py, z) => ({ x: px - (px - 540) / z, y: py - (py - 960) / z, z });
// decaying camera jolt after time t0
export function jolt(t, t0, amp = 14, dur = .35) {
  const u = t - t0; if (u < 0 || u > dur) return [0, 0, 0];
  const k = Math.pow(1 - u / dur, 2); return [Math.sin(u * 71) * amp * k, Math.cos(u * 53) * amp * .7 * k, Math.sin(u * 37) * .012 * k];
}
export { clamp, lerp };
