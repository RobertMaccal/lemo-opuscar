// Staging helpers: where people stand and sit in the living room, and how hands find shoulders.
import { solve, pose, drawChar } from './rig.js';
import { R } from './room.js';

export const S_BEHIND = .95, S_SEAT = 1, S_FRONT = 1.02;
export const Y_SEAT = 1410;                 // ground line of the seated (feet on the floor in front of the couch)
const SEAT_H = 104;                         // hip height above the floor when seated
export const sitO = (ch, o = {}) => ({ hipY: (ch.ul + ch.ll) * .992 + 12 - SEAT_H, legS: 1, thighS: .3, shinS: .86, lL: { x: -30, y: 0, k: 1 }, lR: { x: 30, y: 0, k: -1 }, ...o });

// joint positions of a posed character in world space
export function world(ch, p, x, y, s) {
  const J = solve(ch, p), w = q => [x + q[0] * s, y + q[1] * s];
  return { J, sh: [w(J.A.sh), w(J.B.sh)], el: [w(J.A.el), w(J.B.el)], hd: [w(J.A.hd), w(J.B.hd)], head: w(J.hc), neck: w(J.nb), hip: w(J.hip), top: w(J.c2) };
}
// world point → a character's local space (for IK targets)
export const toLocal = (pt, x, y, s) => [(pt[0] - x) / s, (pt[1] - y) / s];
// where a cuff sits on a posed arm (fraction along the forearm)
export function cuff(ch, p, x, y, s, side = 'aL', f = .82) {
  const J = solve(ch, p), A = side === 'aL' ? J.A : J.B;
  return [x + (A.el[0] + (A.hd[0] - A.el[0]) * f) * s, y + (A.el[1] + (A.hd[1] - A.el[1]) * f) * s];
}

// hands of `giver` on the shoulders of `recv`: returns { aL, aR } overrides with IK targets.
// inset: how far toward the neck from the shoulder point (0..1), lift: hand above the shoulder line (world px),
// knead: { l: [dx, dy], r: [dx, dy] } small motions in world px, curl: finger squeeze 0..1
export function handsOn(giver, gx, gy, gs, recv, rp, rx, ry, rs, { inset = .12, lift = 8, knead = null, curl = 0, out = 0, l = 1.3, wide = 16 } = {}) {
  const W = world(recv, rp, rx, ry, rs), n = W.neck;
  const pt = (sh, k) => [sh[0] + (n[0] - sh[0]) * inset + (k ? k[0] : 0) + (out + wide) * Math.sign(sh[0] - n[0]), sh[1] - lift + (k ? k[1] : 0)];
  const L = pt(W.sh[0], knead && knead.l), Rr = pt(W.sh[1], knead && knead.r);
  return {
    aL: { to: toLocal(L, gx, gy, gs), z: 1, hand: 'open', curl, thumb: -1, l, k: 1 },
    aR: { to: toLocal(Rr, gx, gy, gs), z: 1, hand: 'open', curl, thumb: 1, l, k: -1 },
  };
}
export { R };
