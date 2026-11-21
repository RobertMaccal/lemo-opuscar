// Skeletons built on the rig's own joints (solve), so they sit in exactly the pose the characters had.
// Each skeleton is a list of rigid pieces drawn in world coordinates; the crumble moves and turns each piece
// analytically (no state between frames): fall → one bounce → rest, landing at times shared with the mixer.
import { P, rgba, clamp, lerp } from './kit.js';
import { solve } from './rig.js';
import { BONE, boneSpec } from './timeline.js';

const BONEC = '#F2E8D0', BONED = '#CDBFA2', INK = P.ink;
const W = (x, y, s) => p => [x + p[0] * s, y + p[1] * s];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const nrm = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function bone(g, a, b, w, s) {
  g.lineCap = 'round';
  for (const [col, ww] of [[INK, w + 7 * s], [BONEC, w]]) {
    g.strokeStyle = col; g.lineWidth = ww; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.fillStyle = col; for (const q of [a, b]) { const d = nrm(sub(b, a)), n = [-d[1], d[0]], k = (ww / 2) * 1.05; for (const sg of [-1, 1]) { g.beginPath(); g.arc(q[0] + n[0] * k * .45 * sg, q[1] + n[1] * k * .45 * sg, k * .78, 0, Math.PI * 2); g.fill(); } }
  }
  g.strokeStyle = BONED; g.lineWidth = w * .22; const d = nrm(sub(b, a)), n = [-d[1], d[0]];
  g.beginPath(); g.moveTo(a[0] + d[0] * w + n[0] * w * .18, a[1] + d[1] * w + n[1] * w * .18); g.lineTo(b[0] - d[0] * w + n[0] * w * .18, b[1] - d[1] * w + n[1] * w * .18); g.stroke();
}
function blob(g, pts, s, fill = BONEC) { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.lineJoin = 'round'; g.lineWidth = 7 * s; g.strokeStyle = INK; g.stroke(); g.fillStyle = fill; g.fill(); }

// pieces: { id, c: world centre, axis: angle of the bone's long axis, ext: half-thickness when lying, draw(g, t) }
export function skeletonPieces(ch, p, x, y, s, seed = 0) {
  const J = solve(ch, p), w = W(x, y, s), R = ch.R * s * .97, pcs = [];
  const hip = w(J.hip), top = w(J.c2), hc = w(J.hc), d = nrm(sub(top, hip)), n = [-d[1], d[0]], L = Math.hypot(top[0] - hip[0], top[1] - hip[1]);
  const lw = 13 * s;
  // skull (cranium + upper teeth), terrified sockets
  pcs.push({ id: 'skull', c: hc, axis: 0, ext: R * .92, draw: (g, t) => {
    const [cx, cy] = hc;
    g.beginPath(); g.arc(cx, cy - R * .06, R, Math.PI * .9, Math.PI * 2.1); g.quadraticCurveTo(cx + R * .98, cy + R * .45, cx + R * .55, cy + R * .58); g.lineTo(cx - R * .55, cy + R * .58); g.quadraticCurveTo(cx - R * .98, cy + R * .45, cx - R * Math.cos(Math.PI * .1), cy - R * .06 + R * Math.sin(Math.PI * .1)); g.closePath();
    g.lineWidth = 7 * s; g.strokeStyle = INK; g.stroke(); g.fillStyle = BONEC; g.fill();
    g.save(); g.clip(); g.fillStyle = rgba(P.plum, .22); g.beginPath(); g.arc(cx - R * .55, cy - R * .25, R * 1.25, 0, Math.PI * 2); g.rect(cx - R * 3, cy - R * 3, R * 6, R * 6); g.fill('evenodd'); g.restore();
    const jx = Math.sin(t * 53 + seed) * R * .025, jy = Math.cos(t * 47 + seed) * R * .025;
    for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * R * .38, cy + R * .02, R * .27, R * .32, sg * -.12, 0, Math.PI * 2); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(cx + sg * R * .38 + jx, cy + R * .02 + jy, R * .055, 0, Math.PI * 2); g.fillStyle = '#FFFDF6'; g.fill(); }
    g.beginPath(); g.moveTo(cx, cy + R * .24); g.lineTo(cx - R * .1, cy + R * .4); g.lineTo(cx + R * .1, cy + R * .4); g.closePath(); g.fillStyle = INK; g.fill();
    g.fillStyle = '#FFFDF6'; g.strokeStyle = INK; g.lineWidth = 4 * s; g.beginPath(); g.rect(cx - R * .36, cy + R * .5, R * .72, R * .15); g.fill(); g.stroke();
    for (let k = 1; k < 6; k++) { const xx = cx - R * .36 + k * R * .12; g.beginPath(); g.moveTo(xx, cy + R * .5); g.lineTo(xx, cy + R * .65); g.stroke(); }
    for (const sg of [-1, 1]) { g.strokeStyle = rgba(INK, .5); g.lineWidth = 3.5 * s; g.beginPath(); g.moveTo(cx + sg * R * .12, cy - R * .62); g.quadraticCurveTo(cx + sg * R * .3, cy - R * .5, cx + sg * R * .22, cy - R * .36); g.stroke(); }
  } });
  // jaw (drops open a little while they stare)
  const jc = [hc[0], hc[1] + R * .78];
  pcs.push({ id: 'jaw', c: jc, axis: 0, ext: R * .2, draw: (g, t) => {
    const [cx, cy] = jc, o = R * .06; g.save(); g.translate(0, o);
    blob(g, [[cx - R * .5, cy - R * .12], [cx - R * .38, cy + R * .16], [cx, cy + R * .26], [cx + R * .38, cy + R * .16], [cx + R * .5, cy - R * .12], [cx + R * .32, cy - R * .04], [cx - R * .32, cy - R * .04]], s);
    g.fillStyle = '#FFFDF6'; g.strokeStyle = INK; g.lineWidth = 4 * s; g.beginPath(); g.rect(cx - R * .3, cy - R * .16, R * .6, R * .12); g.fill(); g.stroke();
    for (let k = 1; k < 5; k++) { const xx = cx - R * .3 + k * R * .12; g.beginPath(); g.moveTo(xx, cy - R * .16); g.lineTo(xx, cy - R * .04); g.stroke(); }
    g.restore();
  } });
  // spine + neck
  const nb = w(J.nb);
  pcs.push({ id: 'spine', c: mid(hip, nb), axis: Math.atan2(d[1], d[0]), ext: 9 * s, draw: g => {
    const n0 = 9; for (let k = 0; k <= n0; k++) { const q = add(hip, mul(sub(nb, hip), k / n0)); g.save(); g.translate(q[0], q[1]); g.rotate(Math.atan2(d[1], d[0])); g.beginPath(); g.roundRect(-9 * s, -11 * s, 18 * s, 22 * s, 6 * s); g.fillStyle = BONEC; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = INK; g.stroke(); g.restore(); }
  } });
  // ribcage
  const rc = add(hip, mul(d, L * .7));
  pcs.push({ id: 'ribs', c: rc, axis: Math.atan2(d[1], d[0]), ext: 26 * s, draw: g => {
    for (let k = 0; k < 5; k++) {
      const P0 = add(hip, mul(d, L * (.5 + k * .105))), wk = J.wS * s * (.72 + k * .07), dn = mul(d, -wk * .5);
      for (const [col, ww] of [[INK, 17 * s], [BONEC, 10 * s]]) { g.strokeStyle = col; g.lineWidth = ww; g.lineCap = 'round'; g.beginPath(); g.moveTo(P0[0] + n[0] * wk + dn[0] * .3, P0[1] + n[1] * wk + dn[1] * .3); g.quadraticCurveTo(P0[0] + dn[0] * 1.2, P0[1] + dn[1] * 1.2, P0[0] - n[0] * wk + dn[0] * .3, P0[1] - n[1] * wk + dn[1] * .3); g.stroke(); }
    }
    bone(g, add(hip, mul(d, L * .52)), add(hip, mul(d, L * .95)), 12 * s, s);
    bone(g, add(top, mul(n, J.wS * s * .85)), add(top, mul(n, -J.wS * s * .85)), 10 * s, s);   // collarbones
  } });
  // pelvis
  pcs.push({ id: 'pelvis', c: hip, axis: Math.atan2(n[1], n[0]), ext: 22 * s, draw: g => {
    for (const sg of [-1, 1]) { const q = add(hip, mul(n, sg * ch.hw * s * .55)); g.beginPath(); g.ellipse(q[0], q[1] - 6 * s, ch.hw * s * .6, ch.hw * s * .48, 0, 0, Math.PI * 2); g.fillStyle = BONEC; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.ellipse(q[0] + sg * 3 * s, q[1], ch.hw * s * .2, ch.hw * s * .16, 0, 0, Math.PI * 2); g.fillStyle = INK; g.fill(); }
  } });
  // limbs
  for (const [k, A] of [['L', J.A], ['R', J.B]]) {
    const sh = w(A.sh), el = w(A.el), hd = w(A.hd);
    pcs.push({ id: 'uarm' + k, c: mid(sh, el), axis: Math.atan2(el[1] - sh[1], el[0] - sh[0]), ext: lw * .6, draw: g => bone(g, sh, el, lw, s) });
    pcs.push({ id: 'farm' + k, c: mid(el, hd), axis: Math.atan2(hd[1] - el[1], hd[0] - el[0]), ext: lw * .5, draw: g => bone(g, el, hd, lw * .82, s) });
    const fd = nrm(sub(hd, el));
    pcs.push({ id: 'hand' + k, c: hd, axis: Math.atan2(fd[1], fd[0]), ext: 6 * s, draw: g => { for (const a of [-.5, -.15, .2, .55]) { const dd = [Math.cos(Math.atan2(fd[1], fd[0]) + a), Math.sin(Math.atan2(fd[1], fd[0]) + a)]; bone(g, hd, add(hd, mul(dd, 20 * s)), 4.5 * s, s); } } });
  }
  for (const [k, G, sg] of [['L', J.LA, -1], ['R', J.LB, 1]]) {
    const h = w(G.h), kn = w(G.kn), an = w(G.an);
    pcs.push({ id: 'thigh' + k, c: mid(h, kn), axis: Math.atan2(kn[1] - h[1], kn[0] - h[0]), ext: lw * .6, draw: g => bone(g, h, kn, lw * 1.08, s) });
    pcs.push({ id: 'shin' + k, c: mid(kn, an), axis: Math.atan2(an[1] - kn[1], an[0] - kn[0]), ext: lw * .5, draw: g => bone(g, kn, an, lw * .9, s) });
    const ft = add(an, [sg * 34 * s, 10 * s]);
    pcs.push({ id: 'foot' + k, c: mid(an, ft), axis: Math.atan2(ft[1] - an[1], ft[0] - an[0]), ext: 6 * s, draw: g => bone(g, add(an, [0, 6 * s]), ft, 9 * s, s) });
  }
  return { pcs, x, J };
}
const ORDER = ['spine', 'pelvis', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR', 'ribs', 'uarmL', 'farmL', 'handL', 'uarmR', 'farmR', 'handR', 'jaw', 'skull'];
export const PIECES = ORDER;

// standing skeleton (the stare): every piece in place
export function drawSkeleton(g, sk, t) { for (const id of ORDER) { const q = sk.pcs.find(p => p.id === id); q.draw(g, t); } }

// where a piece is u seconds after the crumble starts
export function pieceAt(q, i, c, u, x0) {
  const sp = boneSpec(c, i), G = BONE.g;
  if (u <= sp.delay) return { dx: 0, dy: 0, da: 0 };
  const tt = u - sp.delay, yf = BONE.floor + sp.depth - q.ext, h = yf - q.c[1], v0 = sp.v0;
  const tl = (-v0 + Math.sqrt(v0 * v0 + 2 * G * Math.max(h, 4))) / G, vImp = v0 + G * tl;
  const side = q.id === 'skull' ? (c ? 1 : -1) : (Math.sign(q.c[0] - x0) || (c ? 1 : -1)), vx = side * sp.vx;
  const flat = a => Math.round(a / Math.PI) * Math.PI;
  if (tt < tl) return { dx: vx * tt, dy: v0 * tt + .5 * G * tt * tt, da: sp.w * tt };
  const vb = -BONE.rest * vImp, tb = -2 * vb / G, ub = Math.min(tt - tl, tb);
  const daL = sp.w * tl, aFinal = q.id === 'skull' ? 0 : flat(q.axis + daL) - q.axis;
  let dx = vx * tl + vx * .5 * ub, dy = h + vb * ub + .5 * G * ub * ub, da = lerp(daL, aFinal, clamp(ub / tb));
  if (q.id === 'skull' || q.id === 'jaw') {          // the skull rolls a little after the bounce
    const r = tt - tl, roll = side * sp.roll * (1 - Math.exp(-r * 2.6)) / 2.6; dx += roll; da = (q.id === 'skull' ? (dx - vx * tl) / q.ext : da);
  }
  return { dx, dy, da };
}
// landing times (s after the crumble starts) for the mixer
export function landings(sk, c) {
  return ORDER.map((id, i) => { const q = sk.pcs.find(p => p.id === id), sp = boneSpec(c, i), h = BONE.floor + sp.depth - q.ext - q.c[1];
    return { id, t: sp.delay + (-sp.v0 + Math.sqrt(sp.v0 * sp.v0 + 2 * BONE.g * Math.max(h, 4))) / BONE.g, v: Math.min(1, Math.hypot(sp.v0, Math.sqrt(2 * BONE.g * Math.max(h, 4))) / 1600) }; });
}
export function drawCrumble(g, sk, c, u) {
  ORDER.forEach(id => {
    const i = ORDER.indexOf(id), q = sk.pcs.find(p => p.id === id), m = pieceAt(q, i, c, u, sk.x);
    g.save(); g.translate(q.c[0] + m.dx, q.c[1] + m.dy); g.rotate(m.da); g.translate(-q.c[0], -q.c[1]); q.draw(g, 0); g.restore();
  });
}
