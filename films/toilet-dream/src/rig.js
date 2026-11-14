// Character rig: one skeleton for the whole cast. Head, neck, bent spine, FK/IK arms, IK legs,
// eyes / lids / pupils / brows / mouth, hair, outfits, held props, and a rim-light compositor.
// Local space: origin on the ground under the character, y up is negative. All pose numbers blend.
import { P, mix, dark, lite, rgba, circ, ell, line, rr, poly, tmp, TAU, clamp, lerp } from './kit.js';
const INK = P.ink;

export const EXPR0 = {
  eyeOpen: 1, lidT: 0, lidB: 0, lidAng: 0, pup: 1, gx: 0, gy: 0, closeCurve: 1,
  browH: 0, browA: 0, browC: .15, browAsym: 0,
  mW: 1, mO: 0, mS: .15, mSkew: 0, mWavy: 0, mTeeth: 0,
  blush: 0, sweat: 0, gloom: 0, pale: 0,
};
export const POSE0 = {
  x: 0, y: 0, s: 1, hipX: 0, hipY: 0, lean: 0, bend: 0, face: 0, shrug: 0, sq: 0,
  head: { turn: 0, tilt: 0, nod: 0, ox: 0, oy: 0, back: 0 },
  aL: { a: -.13, b: .1 }, aR: { a: .13, b: -.1 },
  lL: { x: -26, y: 0, r: 0 }, lR: { x: 26, y: 0, r: 0 },
  e: EXPR0,
};
export const DIMS = { R: 78, neck: 12, torso: 150, sw: 52, hw: 34, ua: 68, fa: 64, ul: 92, ll: 92, armW: 25, legW: 27, hand: 14, footL: 1 };

// ---- pose maths ----
export function merge(base, o) {
  if (o === undefined) return base;
  if (o === null || typeof o !== 'object' || Array.isArray(o) || typeof base !== 'object' || base === null || Array.isArray(base)) return o;
  const r = { ...base }; for (const k in o) r[k] = merge(base[k], o[k]); return r;
}
export function mixObj(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => mixObj(v, b[i], t));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = k in a ? (k in b ? mixObj(a[k], b[k], t) : a[k]) : b[k]; return o;
  }
  return t < .5 ? a : b;
}
// pose(ch, {...}, {...}): the character's rest pose with overrides merged on top
export function pose(ch, ...os) { let p = merge(merge(POSE0, { e: ch.face || {} }), ch.rest || {}); for (const o of os) p = merge(p, o); return p; }
// blend two full poses; arms given as IK targets are first turned into angles so the hand travels on an arc
export function mixPose(ch, a, b, t) {
  if (t <= 0) return a; if (t >= 1) return b;
  const A = bakeArms(ch, a), B = bakeArms(ch, b); return mixObj(A, B, t);
}
function bakeArms(ch, p) {
  if (!p.aL.to && !p.aR.to) return p;
  const J = solve(ch, p), q = { ...p };
  for (const [k, arm] of [['aL', J.A], ['aR', J.B]]) if (p[k].to) {
    const a = Math.atan2(arm.el[0] - arm.sh[0], arm.el[1] - arm.sh[1]);
    let b = arm.fa - a; while (b > Math.PI) b -= TAU; while (b < -Math.PI) b += TAU;
    q[k] = { ...p[k], a, b, to: null };
  }
  return q;
}

function ik(a, b, l1, l2, k) {
  const dx = b[0] - a[0], dy = b[1] - a[1]; let D = Math.hypot(dx, dy);
  D = clamp(D, Math.abs(l1 - l2) + .01, l1 + l2 - .01);
  const al = Math.acos(clamp((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1)), ang = Math.atan2(dy, dx) + k * al;
  return [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
}

export function solve(ch, p) {
  const th = p.face * 1.3, cs = Math.cos(th), sn = Math.sin(th);
  const hip = [p.hipX, -((ch.ul + ch.ll) * .992 + 12) + p.hipY], T = ch.torso;
  const c2 = [hip[0] + Math.sin(p.lean) * T, hip[1] - Math.cos(p.lean) * T];
  const c1 = [(hip[0] + c2[0]) / 2 + Math.cos(p.lean) * p.bend * T * .5, (hip[1] + c2[1]) / 2 + Math.sin(p.lean) * p.bend * T * .5];
  const sp = (u, off = 0) => {
    const v = 1 - u, x = v * v * hip[0] + 2 * v * u * c1[0] + u * u * c2[0], y = v * v * hip[1] + 2 * v * u * c1[1] + u * u * c2[1];
    if (!off) return [x, y]; const t = tan(u); return [x - t[1] * off, y + t[0] * off];
  };
  const tan = u => { const dx = (1 - u) * (c1[0] - hip[0]) + u * (c2[0] - c1[0]), dy = (1 - u) * (c1[1] - hip[1]) + u * (c2[1] - c1[1]), l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const te = tan(1), ue = [-te[1], te[0]];
  const wS = Math.hypot(ch.sw * cs, ch.sw * .56 * sn), wH = Math.hypot((ch.hw + 12) * cs, (ch.hw + 8) * .7 * sn);
  const up = p.shrug * 15 - 11, inn = 1 - p.shrug * .08;
  const shd = s => [c2[0] + ue[0] * (s * ch.sw * cs * inn + sn * 6) + te[0] * up, c2[1] + ue[1] * (s * ch.sw * cs * inn + sn * 6) + te[1] * up];
  const arm = (sh, A, side) => {
    let el, hd; const ua = ch.ua * (A.l ?? 1), fa = ch.fa * (A.l ?? 1);
    if (A.to) {
      hd = [A.to[0], A.to[1]];
      const dd = Math.hypot(hd[0] - sh[0], hd[1] - sh[1]), m = ua + fa - .5;
      if (dd > m) hd = [sh[0] + (hd[0] - sh[0]) * m / dd, sh[1] + (hd[1] - sh[1]) * m / dd];
      el = ik(sh, hd, ua, fa, A.k ?? (hd[1] < sh[1] - 24 ? side : -side));
    } else {
      el = [sh[0] + Math.sin(A.a) * ua, sh[1] + Math.cos(A.a) * ua];
      hd = [el[0] + Math.sin(A.a + A.b) * fa, el[1] + Math.cos(A.a + A.b) * fa];
    }
    return { sh, el, hd, fa: Math.atan2(hd[0] - el[0], hd[1] - el[1]) };
  };
  const leg = (h, G, side) => {
    const ls = p.legS ?? 1, l1 = ch.ul * ls, l2 = ch.ll * ls;
    let an = [G.x, G.y - 12]; const d = Math.hypot(an[0] - h[0], an[1] - h[1]), m = l1 + l2 - .5;
    if (d > m) an = [h[0] + (an[0] - h[0]) * m / d, h[1] + (an[1] - h[1]) * m / d];
    const k = G.k ?? (Math.abs(p.face) > .15 ? -Math.sign(p.face) : -side);
    return { h, kn: ik(h, an, l1, l2, k), an, r: G.r || 0 };
  };
  const nb = [c2[0] + te[0] * 4, c2[1] + te[1] * 4];
  const na = Math.atan2(te[0], -te[1]) * .55 + p.head.tilt * .5, nl = ch.neck + ch.R * .9;
  const hc = [nb[0] + Math.sin(na) * nl + p.head.ox, nb[1] - Math.cos(na) * nl + p.head.oy];
  return {
    th, cs, sn, hip, c2, sp, tan, te, ue, wS, wH, nb, hc,
    A: arm(shd(-1), p.aL, -1), B: arm(shd(1), p.aR, 1),
    LA: leg([hip[0] - ch.hw * cs * .72, hip[1]], p.lL, -1), LB: leg([hip[0] + ch.hw * cs * .72, hip[1]], p.lR, 1),
  };
}

// ---- drawing: parts ----
const fillR2 = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
function limbPath(g, a, b, c) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); }
const L2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function drawLeg(g, ch, G, far, p, side) {
  const col = far ? dark(ch.pants, .22) : ch.pants;
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = ch.legW; limbPath(g, G.h, G.kn, G.an); g.stroke();
  if (ch.cuffs) { g.strokeStyle = dark(ch.pants, .3); g.lineCap = 'butt'; const c0 = L2(G.kn, G.an, .86); g.beginPath(); g.moveTo(c0[0], c0[1]); g.lineTo(G.an[0], G.an[1]); g.lineWidth = ch.legW + 3; g.stroke(); }
  // shoe
  const dir = Math.abs(p.face) > .15 ? Math.sign(p.face) * lerp(.72, 1, Math.min(1, Math.abs(p.face))) : side * .6;
  g.save(); g.translate(G.an[0], G.an[1] + 12); g.rotate(G.r * Math.sign(dir)); g.scale(dir * ch.footL, 1);
  if (ch.bare) {   // bare foot: cream sole shape with an ink outline and a toe hint
    g.beginPath(); g.moveTo(-12, -4); g.quadraticCurveTo(-14, -19, -2, -20); g.quadraticCurveTo(14, -19, 30, -12); g.quadraticCurveTo(42, -8, 40, -2); g.quadraticCurveTo(14, 2, -10, 0); g.closePath();
    g.fillStyle = far ? dark(ch.skin, .18) : ch.skin; g.fill(); g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke();
    g.lineCap = 'round'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(31, -11); g.lineTo(33, -6); g.moveTo(25, -14); g.lineTo(27, -8); g.stroke();
    g.restore(); return;
  }
  g.beginPath(); g.moveTo(-16, -3); g.quadraticCurveTo(-18, -20, -4, -21); g.lineTo(8, -21); g.quadraticCurveTo(28, -17, 40, -10);
  g.quadraticCurveTo(49, -6, 48, -1); g.lineTo(-14, -1); g.quadraticCurveTo(-17, -1, -16, -3); g.closePath();
  g.fillStyle = far ? dark(ch.shoe, .2) : ch.shoe; g.fill(); g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke();
  g.lineCap = 'round'; g.strokeStyle = ch.sole || INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-13, -2.5); g.lineTo(46, -2.5); g.stroke();
  if (ch.shoeTrim) { g.strokeStyle = ch.shoeTrim; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -18); g.lineTo(16, -9); g.moveTo(19, -16); g.lineTo(25, -8); g.stroke(); }
  g.restore();
}

function drawArm(g, ch, A, far, pa) {
  const col = far ? dark(ch.top, .2) : ch.top, w = ch.armW, sl = ch.sleeve || 'long';
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (sl === 'none') { g.strokeStyle = INK; g.lineWidth = w * .62; limbPath(g, A.sh, A.el, A.hd); g.stroke(); }
  else {
    const s0 = L2(A.sh, A.el, .3);
    g.strokeStyle = dark(ch.top, .34); g.lineWidth = w + 5; limbPath(g, s0, A.el, A.hd); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; limbPath(g, A.sh, A.el, A.hd); g.stroke();
    if (ch.stripe) { g.strokeStyle = ch.stripe; g.lineWidth = 4; limbPath(g, A.sh, A.el, L2(A.el, A.hd, .8)); g.stroke(); }
    const cu = L2(A.el, A.hd, .8); g.lineCap = 'butt'; g.strokeStyle = dark(ch.top, far ? .42 : .26); g.lineWidth = w + 1;
    g.beginPath(); g.moveTo(cu[0], cu[1]); g.lineTo(A.hd[0], A.hd[1]); g.stroke();
    if (ch.piping) { const c1 = L2(A.el, A.hd, .78), c2 = L2(A.el, A.hd, .84); g.strokeStyle = far ? dark(ch.piping, .3) : ch.piping; g.lineWidth = w + 1.5; g.beginPath(); g.moveTo(c1[0], c1[1]); g.lineTo(c2[0], c2[1]); g.stroke(); }
  }
  drawHand(g, ch, A, pa);
}

function drawHand(g, ch, A, pa) {
  const r = ch.hand, [x, y] = A.hd, fa = A.fa, f = [Math.sin(fa), Math.cos(fa)];
  const cap = (ang, len, w, off = .4) => {
    const d = [Math.sin(ang), Math.cos(ang)]; g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = w;
    g.beginPath(); g.moveTo(x + d[0] * r * off, y + d[1] * r * off); g.lineTo(x + d[0] * (r * off + len), y + d[1] * (r * off + len)); g.stroke();
  };
  const pr = pa.prop;
  if (pr && PROPS[pr.n] && !pr.over) PROPS[pr.n](g, x, y, fa, pr, r);
  circ(g, x + f[0] * 3, y + f[1] * 3, r, INK);
  const h = pa.hand || 'fist';
  if (h === 'open') { for (const d of [-.66, -.23, .2, .62]) cap(fa + d, r * 1.3, r * .46, .62); cap(fa + (pa.thumb ?? 1) * 1.45, r * .85, r * .5, .45); }
  else if (h === 'thumb') { cap(Math.PI, r * 1.25, r * .66, .5); }
  else if (h === 'point') { cap(fa + (pa.pointA || 0), r * 1.5, r * .55, .6); }
  if (pr && PROPS[pr.n] && pr.over) PROPS[pr.n](g, x, y, fa, pr, r);
}

// held props. (x,y) = hand centre, fa = forearm angle, o = numeric params
export const PROPS = {
  phone(g, x, y, fa, o, r) {
    g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.r || 0); const w = 36, h = 62, yy = -h * (o.up ?? .62);
    rr(g, -w / 2, yy, w, h, 7); g.fillStyle = o.back ? P.inkSoft : P.night; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    if (o.back) { circ(g, -w / 2 + 8, yy + 8, 3, P.lavDeep); fillR2(g, -w / 2 + 6, yy + h - 12, w - 12, 3, P.plum); }
    else { rr(g, -w / 2 + 4, yy + 5, w - 8, h - 12, 3); g.fillStyle = o.scr || '#BFE6DC'; g.fill(); }
    g.restore();
    if (o.glow) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = o.glow; const gr = g.createRadialGradient(x, y - 20, 4, x, y - 20, 90); gr.addColorStop(0, '#BFE6DC'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 100, y - 120, 200, 200); g.restore(); }
  },
  pencil(g, x, y, fa, o) {
    g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.r ?? -.5); line(g, 0, -34, 0, 30, P.orange, 8, 'butt'); line(g, 0, -42, 0, -34, P.rose, 8, 'butt');
    poly(g, [[-4, 30], [4, 30], [0, 42]]); g.fillStyle = P.sand; g.fill(); poly(g, [[-1.6, 37], [1.6, 37], [0, 42]]); g.fillStyle = INK; g.fill(); g.restore();
  },
  paper(g, x, y, fa, o) {
    g.save(); g.translate(x, y); g.rotate(o.r || 0); const w = o.w || 74, h = o.h || 96;
    rr(g, -w / 2, -h * .8, w, h, 3); g.fillStyle = P.paper; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = rgba(P.lavDeep, .55); g.lineWidth = 2.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-w / 2 + 9, -h * .8 + 16 + i * 12); g.lineTo(w / 2 - 9 - (i % 3) * 8, -h * .8 + 16 + i * 12); g.stroke(); }
    g.restore();
  },
  stopwatch(g, x, y, fa, o) {
    g.save(); g.translate(x, y - 16); line(g, 0, -26, 0, -18, INK, 7, 'butt'); circ(g, 0, 0, 21, INK); circ(g, 0, 0, 16, P.paper);
    line(g, 0, 0, 7, -9, P.rust, 3); circ(g, 0, 0, 2.5, INK); g.restore();
  },
  bottle(g, x, y, fa, o) {
    g.save(); g.translate(x, y); g.rotate(o.r || 0); rr(g, -11, -62, 22, 70, 7); g.fillStyle = rgba(P.tealLight, .9); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    rr(g, -7, -74, 14, 13, 3); g.fillStyle = P.teal; g.fill(); g.stroke(); g.fillStyle = rgba('#FFFFFF', .5); g.fillRect(-6, -40, 5, 30); g.restore();
  },
  pointer(g, x, y, fa, o) { g.save(); g.translate(x, y); g.rotate(o.r || 0); line(g, 0, 14, 0, -(o.len || 150), P.woodDark, 6); circ(g, 0, -(o.len || 150), 5, P.rust); g.restore(); },
  clipboard(g, x, y, fa, o) {
    g.save(); g.translate(x, y); g.rotate(o.r || 0); rr(g, -34, -70, 68, 92, 5); g.fillStyle = P.wood; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    rr(g, -27, -60, 54, 76, 2); g.fillStyle = P.paper; g.fill(); rr(g, -13, -78, 26, 13, 3); g.fillStyle = P.lavDeep; g.fill(); g.stroke(); g.restore();
  },
  piece(g, x, y, fa, o) { g.save(); g.translate(x, y - 12); circ(g, 0, -30, 9, P.paper); poly(g, [[-7, -24], [7, -24], [11, 6], [-11, 6]]); g.fillStyle = P.paper; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.arc(0, -30, 9, 0, TAU); g.stroke(); g.restore(); },
};

function torso(g, ch, p, J) {
  if (ch.kind === 'stick') { g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 24; g.beginPath(); for (let i = 0; i <= 8; i++) { const q = J.sp(i / 8); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); return; }
  const N = 10, Lp = [], Rp = [], top = ch.top, sh = J.sn * J.wS * .5, a = Math.abs(J.cs);
  const wAt = u => lerp(J.wH, J.wS + 3, Math.pow(u, .75)) - 6;
  for (let i = 0; i <= N; i++) { const u = i / N, w = wAt(u); Lp.push(J.sp(u, -w)); Rp.push(J.sp(u, w)); }
  g.beginPath(); Lp.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
  const nk = [J.c2[0] + J.te[0] * 7, J.c2[1] + J.te[1] * 7]; g.lineTo(nk[0], nk[1]);
  for (let i = N; i >= 0; i--) g.lineTo(Rp[i][0], Rp[i][1]); g.closePath();
  g.fillStyle = top; g.fill(); g.lineJoin = 'round'; g.lineWidth = 13; g.strokeStyle = top; g.stroke();
  const band = (u0, u1, col, k = 1) => { const w0 = wAt(u0) + 6.5, w1 = wAt(u1) + 6.5; poly(g, [J.sp(u0, -w0 * k), J.sp(u0, w0 * k), J.sp(u1, w1 * k), J.sp(u1, -w1 * k)]); g.fillStyle = col; g.fill(); };
  const sl = (u0, o0, u1, o1, col, w) => { const q0 = J.sp(u0, o0), q1 = J.sp(u1, o1); line(g, q0[0], q0[1], q1[0], q1[1], col, w); };
  const kind = p.head.back > .5 ? 'plain' : (ch.kind || 'hoodie');
  if (kind === 'plain') { band(-.03, .07, dark(top, .2)); return; }
  if (kind === 'hoodie' || kind === 'sweater') band(-.03, .07, dark(top, .2));
  if (kind === 'hoodie') {
    const pw = (J.wS - 2) * a; g.globalAlpha = clamp(a * 1.4 - .25); g.strokeStyle = dark(top, .26); g.lineWidth = 3.5; g.lineJoin = 'round';
    g.beginPath(); [[.13, -pw * .66], [.13, pw * .66], [.4, pw * .44], [.4, -pw * .44]].forEach(([u, o], i) => { const q = J.sp(u, o + sh); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.stroke(); g.globalAlpha = 1;
    for (const s of [-1, 1]) { sl(.99, sh + s * 9 * a, .74, sh + s * 12 * a, ch.string || P.cream, 3.6); const k = J.sp(.74, sh + s * 12 * a); circ(g, k[0], k[1], 3.6, ch.string || P.cream); }
  } else if (kind === 'track') {
    sl(1.02, sh, .0, sh, ch.stripe || P.cream, 3.5); band(-.03, .06, dark(top, .2));
    for (const s of [-1, 1]) sl(1.03, sh + s * 15 * a, .9, sh + s * 3, dark(top, .3), 4);
  } else if (kind === 'open') {
    const wi = (J.wS * .4) * a + 3; poly(g, [J.sp(1.03, sh - wi), J.sp(1.03, sh + wi), J.sp(-.02, sh + wi * .9), J.sp(-.02, sh - wi * .9)]); g.fillStyle = ch.inner || P.cream; g.fill();
    for (const s of [-1, 1]) { sl(1.03, sh + s * wi, .5, sh + s * wi * .25, dark(top, .32), 4.5); sl(.5, sh + s * wi * .25, -.02, sh + s * wi * .9, dark(top, .22), 3); }
    if (ch.tie) { poly(g, [J.sp(1, sh - 6), J.sp(1, sh + 6), J.sp(.9, sh + 5), J.sp(.62, sh + 8), J.sp(.55, sh), J.sp(.62, sh - 8), J.sp(.9, sh - 5)]); g.fillStyle = ch.tie; g.fill(); }
    if (ch.buttons) for (const u of [.36, .22, .08]) { const q = J.sp(u, sh + wi * .55); circ(g, q[0], q[1], 3.4, dark(top, .4)); }
  }
  if (kind === 'pajama') {   // pyjama shirt: cream piping on the collar and placket, buttons, a breast pocket
    const pc = ch.piping || P.cream, wi = 16 * a + 2;
    for (const k of [-1, 1]) { const q0 = J.sp(1.03, sh + k * (wi + 12)), q1 = J.sp(.8, sh), q2 = J.sp(1.03, sh + k * 4); poly(g, [q0, q1, q2]); g.fillStyle = dark(top, .12); g.fill(); g.lineWidth = 3.2; g.strokeStyle = pc; g.lineJoin = 'round'; g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.lineTo(q2[0], q2[1]); g.stroke(); }
    sl(.8, sh, -.02, sh, rgba(pc, .55 * a + .2), 2.6);
    for (const u of [.66, .44, .22]) { const q = J.sp(u, sh + 5 * a); circ(g, q[0], q[1], 3.6, pc); }
    if (a > .35) { const q0 = J.sp(.78, sh - 30 * a), q1 = J.sp(.62, sh - 30 * a); g.globalAlpha = clamp(a * 1.5 - .4); g.lineWidth = 2.6; g.strokeStyle = rgba(pc, .55); g.beginPath(); g.moveTo(q0[0] - 13 * a, q0[1]); g.lineTo(q0[0] + 13 * a, q0[1]); g.lineTo(q1[0] + 12 * a, q1[1]); g.lineTo(q1[0] - 12 * a, q1[1]); g.closePath(); g.stroke(); g.globalAlpha = 1; }
    band(-.03, .05, dark(top, .14));
  }
  if (kind === 'sweater') { g.strokeStyle = dark(top, .2); g.lineWidth = 6; g.lineCap = 'round'; const q0 = J.sp(1.0, sh - 20 * a), q1 = J.sp(1.0, sh + 20 * a), qm = J.sp(.9, sh); g.beginPath(); g.moveTo(q0[0], q0[1]); g.quadraticCurveTo(qm[0], qm[1], q1[0], q1[1]); g.stroke(); }
  if (ch.bib) { const c = J.sp(.6, sh), t = J.tan(.6); g.save(); g.translate(c[0], c[1]); g.rotate(Math.atan2(t[0], -t[1])); g.scale(a, 1); rr(g, -27, -20, 54, 40, 3); g.fillStyle = P.paper; g.fill(); g.lineWidth = 2.5; g.strokeStyle = INK; g.stroke(); g.fillStyle = INK; g.font = "30px 'Lilita One'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch.bib, 0, 2); g.restore(); }
  if (ch.whistle) { const q0 = J.sp(1.0, sh - 16 * a), q1 = J.sp(1.0, sh + 16 * a), qm = J.sp(.62, sh); g.strokeStyle = P.cream; g.lineWidth = 3; g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(qm[0], qm[1]); g.lineTo(q1[0], q1[1]); g.stroke(); rr(g, qm[0] - 9, qm[1] - 3, 18, 12, 4); g.fillStyle = P.orange; g.fill(); g.lineWidth = 2.5; g.strokeStyle = INK; g.stroke(); }
}

// hair, in head space scaled so R = 1. tx = how far the face has turned (−1..1)
const pol = (deg, r) => [Math.sin(deg * Math.PI / 180) * r, -Math.cos(deg * Math.PI / 180) * r];
function smooth(g, pts, close = false) {
  const n = pts.length; g.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
  for (let i = 1; i < n - (close ? 0 : 1); i++) { const a = pts[i % n], b = pts[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
}
const HAIR = {
  bedhead(g, tx, col) {   // sleep-flattened on one side, two tufts standing up
    const o = [[-106, 1.0], [-92, 1.08], [-76, 1.06], [-60, 1.14], [-44, 1.1], [-28, 1.2], [-12, 1.14], [4, 1.22], [20, 1.12], [36, 1.18], [52, 1.08], [68, 1.12], [84, 1.04], [98, 1.06], [108, 1.0]].map(([d, r]) => pol(d + tx * 6, r));
    const f = [[.92, -.32], [.7, -.5], [.48, -.44], [.26, -.62], [.04, -.5], [-.2, -.66], [-.44, -.48], [-.68, -.56], [-.92, -.3]].map(([x, y]) => [x + tx * .16 * (1 - Math.abs(x)), y]);
    g.fillStyle = col; g.beginPath(); o.concat(f).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); g.lineJoin = 'round'; g.lineWidth = .05; g.strokeStyle = col; g.stroke();
    const b = tx * .12;
    g.beginPath(); g.moveTo(-.18 + b, -1.12); g.quadraticCurveTo(-.34 + b, -1.62, -.02 + b, -1.74); g.quadraticCurveTo(-.12 + b, -1.42, .1 + b, -1.16); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(.22 + b, -1.14); g.quadraticCurveTo(.5 + b, -1.56, .78 + b, -1.5); g.quadraticCurveTo(.56 + b, -1.38, .48 + b, -1.08); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-.8 + b, -.84); g.quadraticCurveTo(-1.32 + b, -1.0, -1.38 + b, -.66); g.quadraticCurveTo(-1.12 + b, -.78, -.92 + b, -.6); g.closePath(); g.fill();
  },
  messy(g, tx, col) {
    const o = [[-104, 1.0], [-90, 1.11], [-74, 1.03], [-61, 1.22], [-46, 1.06], [-30, 1.28], [-15, 1.09], [1, 1.36], [15, 1.1], [30, 1.25], [45, 1.06], [58, 1.2], [74, 1.03], [89, 1.1], [104, 1.0]].map(([d, r]) => pol(d + tx * 6, r));
    const f = [[.9, -.34], [.66, -.6], [.44, -.5], [.2, -.72], [0, -.55], [-.22, -.74], [-.46, -.52], [-.66, -.64], [-.9, -.34]].map(([x, y]) => [x + tx * .16 * (1 - Math.abs(x)), y]);
    g.fillStyle = col; g.beginPath(); o.concat(f).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); g.lineJoin = 'round'; g.lineWidth = .05; g.strokeStyle = col; g.stroke();
    g.lineCap = 'round'; g.lineWidth = .075; g.beginPath(); g.moveTo(.12 + tx * .1, -1.2); g.quadraticCurveTo(.3 + tx * .1, -1.52, .5 + tx * .1, -1.42); g.stroke();
  },
  tousled(g, tx, col) {
    const o = [[-106, 1.0], [-95, 1.1], [-81, 1.06], [-67, 1.23], [-53, 1.12], [-38, 1.31], [-23, 1.18], [-7, 1.36], [11, 1.2], [27, 1.35], [44, 1.16], [59, 1.27], [75, 1.08], [91, 1.12], [106, 1.0]].map(([d, r]) => pol(d + tx * 6, r));
    const f = [[.95, -.26], [.82, -.5], [.58, -.8], [.26, -.74], [-.06, -.62], [-.34, -.42], [-.46, -.62], [-.7, -.74], [-.95, -.26]].map(([x, y]) => [x + tx * .16 * (1 - Math.abs(x)), y]);
    g.fillStyle = col; g.beginPath(); g.moveTo(o[0][0], o[0][1]); for (let i = 1; i < o.length - 1; i++) { const a = o[i], b = o[i + 1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    g.lineTo(o[o.length - 1][0], o[o.length - 1][1]); g.lineTo(f[0][0], f[0][1]);
    for (let i = 1; i < f.length - 1; i++) { const a = f[i], b = f[i + 1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    g.lineTo(f[f.length - 1][0], f[f.length - 1][1]); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(.3 + tx * .1, -1.12); g.quadraticCurveTo(.78 + tx * .1, -1.58, 1.08 + tx * .1, -1.2); g.quadraticCurveTo(.84 + tx * .1, -1.3, .66 + tx * .1, -1.0); g.closePath(); g.fill();
  },
  bun(g, tx, col) {
    circ(g, .34 - tx * .5, -1.2, .36, col);
    g.fillStyle = col; g.beginPath(); const o = []; for (let d = -112; d <= 112; d += 16) o.push(pol(d, 1.07));
    o.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
    g.quadraticCurveTo(.86, -.5, .22 + tx * .2, -.74); g.quadraticCurveTo(-.55 + tx * .2, -.6, o[0][0], o[0][1]); g.closePath(); g.fill();
  },
  prof(g, tx, col) {
    for (const s of [-1, 1]) { circ(g, s * 1.0, -.1, .27, col); circ(g, s * .93, -.42, .25, col); circ(g, s * .76, -.7, .2, col); }
    g.strokeStyle = col; g.lineWidth = .06; g.lineCap = 'round'; g.beginPath(); g.moveTo(-.3, -1.03); g.quadraticCurveTo(0, -1.2, .3, -1.03); g.stroke();
  },
  cap(g, tx, col, ch) {
    g.fillStyle = col; g.beginPath(); for (let d = -106; d <= 106; d += 12) { const q = pol(d, 1.0); d === -106 ? g.moveTo(q[0], q[1]) : g.lineTo(q[0], q[1]); } g.lineTo(.9, -.2); g.lineTo(-.9, -.2); g.closePath(); g.fill();
    const cc = ch.capCol || P.teal; g.fillStyle = cc; g.beginPath(); g.moveTo(-1.02, -.42); for (let d = -100; d <= 100; d += 10) { const q = pol(d, 1.09); g.lineTo(q[0], q[1] - .02); } g.lineTo(1.02, -.42); g.closePath(); g.fill();
    g.fillStyle = dark(cc, .25); const vx = tx >= 0 ? 1 : -1, v0 = .1 + tx * .5; g.beginPath(); g.moveTo(v0 - vx * .9, -.46); g.quadraticCurveTo(v0 + vx * .5, -.62, v0 + vx * 1.25, -.38); g.quadraticCurveTo(v0 + vx * .4, -.3, v0 - vx * .9, -.36); g.closePath(); g.fill();
    circ(g, 0, -1.1, .07, dark(cc, .3));
  },
  pony(g, tx, col) {
    const sx = tx > .1 ? -1 : 1;
    g.fillStyle = col; g.beginPath(); g.moveTo(sx * .8, -.86); g.quadraticCurveTo(sx * 1.75, -1.1, sx * 1.6, -.1); g.quadraticCurveTo(sx * 1.52, .5, sx * 1.22, .66); g.quadraticCurveTo(sx * 1.4, .0, sx * 1.02, -.36); g.closePath(); g.fill();
    g.beginPath(); const o = []; for (let d = -108; d <= 108; d += 12) o.push(pol(d, 1.08)); o.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
    [[.9, -.4], [.6, -.58], [.5, -.46], [.2, -.6], [.08, -.48], [-.2, -.62], [-.34, -.5], [-.62, -.6], [-.9, -.3]].forEach(([x, y]) => g.lineTo(x + tx * .14, y)); g.closePath(); g.fill();
    circ(g, sx * .92, -.72, .12, P.orange);
  },
  curly(g, tx, col) {
    g.fillStyle = col; g.beginPath();
    for (let d = -112; d <= 112; d += 20) { const q = pol(d + tx * 5, 1.03); g.moveTo(q[0] + .3, q[1]); g.arc(q[0], q[1], .3, 0, TAU); }
    for (let d = -80; d <= 80; d += 26) { const q = pol(d + tx * 5, .76); g.moveTo(q[0] + .28, q[1]); g.arc(q[0], q[1], .28, 0, TAU); }
    g.fill();
  },
  short(g, tx, col) {
    g.fillStyle = col; g.beginPath(); const o = []; for (let d = -104; d <= 104; d += 13) o.push(pol(d, 1.07 + (Math.abs(d) % 26 ? .03 : 0))); o.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
    g.quadraticCurveTo(.5 + tx * .15, -.78, tx * .15, -.66); g.quadraticCurveTo(-.5 + tx * .15, -.78, o[0][0], o[0][1]); g.closePath(); g.fill();
  },
  back(g, tx, col) { g.fillStyle = col; g.beginPath(); for (let d = -128; d <= 128; d += 8) { const q = pol(d, 1.06); d === -128 ? g.moveTo(q[0], q[1]) : g.lineTo(q[0], q[1]); } g.quadraticCurveTo(0, .78, pol(-128, 1.06)[0], pol(-128, 1.06)[1]); g.closePath(); g.fill(); },
};

function drawEye(g, ex, ey, rx, ry, e, side, skin) {
  if (e.eyeOpen < .14) {
    const c = e.closeCurve; g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - rx, ey + c * ry * .16); g.quadraticCurveTo(ex, ey - c * ry * .6, ex + rx, ey + c * ry * .16); g.stroke(); return;
  }
  const o = e.eyeOpen, RY = ry * (.3 + .7 * Math.min(o, 1)) * (o > 1 ? 1 + (o - 1) * .75 : 1), RX = rx * (o > 1 ? 1 + (o - 1) * .45 : 1);
  g.save(); g.beginPath(); g.ellipse(ex, ey, RX, RY, 0, 0, TAU); g.fillStyle = P.white; g.fill(); g.clip();
  const pr = ry * .44 * e.pup, px = ex + e.gx * Math.max(0, RX - pr * .8), py = ey + e.gy * Math.max(0, RY - pr * .8);
  circ(g, px, py, pr, INK); circ(g, px - pr * .32, py - pr * .36, pr * .3, P.white);
  if (e.lidT > .01) {
    g.save(); g.translate(ex, ey - RY + 2 * RY * e.lidT); g.rotate(e.lidAng * -side); g.fillStyle = skin; g.fillRect(-RX * 3, -RY * 4, RX * 6, RY * 4);
    g.strokeStyle = INK; g.lineWidth = 4.5; g.beginPath(); g.moveTo(-RX * 3, 0); g.lineTo(RX * 3, 0); g.stroke(); g.restore();
  }
  if (e.lidB > .01) {
    const yy = ey + RY - 2 * RY * e.lidB; g.fillStyle = skin; g.beginPath(); g.ellipse(ex, yy + RY * 1.5, RX * 1.7, RY * 1.5, 0, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
  }
  g.restore();
  g.beginPath(); g.ellipse(ex, ey, RX, RY, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
}

function drawMouth(g, mx, my, R, e, ws) {
  const w = R * .3 * e.mW * ws; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
  if (e.mTeeth > .5) {
    const h = R * .2 * (.55 + e.mO); rr(g, mx - w, my - h / 2, 2 * w, h, h * .42); g.fillStyle = P.white; g.fill(); g.lineWidth = 4; g.stroke();
    g.lineWidth = 2.6; g.beginPath(); for (const k of [-.5, 0, .5]) { g.moveTo(mx + k * w, my - h / 2); g.lineTo(mx + k * w, my + h / 2); } g.moveTo(mx - w, my); g.lineTo(mx + w, my); g.stroke(); return;
  }
  if (e.mWavy > .3) {
    g.lineWidth = 5; g.beginPath(); const n = 16; for (let i = 0; i <= n; i++) { const u = i / n, x = mx - w + 2 * w * u, y = my + Math.sin(u * TAU * 2.2) * R * .05 * e.mWavy - e.mS * w * .2; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); return;
  }
  const sm = e.mS, sk = e.mSkew * w * .32, yc = my - sm * w * .32;
  if (e.mO < .06) { g.lineWidth = 5; g.beginPath(); g.moveTo(mx - w, yc + sk); g.quadraticCurveTo(mx, my + sm * w * .8, mx + w, yc - sk); g.stroke(); return; }
  const h = R * .44 * e.mO;
  const path = () => { g.beginPath(); g.moveTo(mx - w, yc + sk); g.quadraticCurveTo(mx, my - h * .22 + sm * w * .25, mx + w, yc - sk);
    g.quadraticCurveTo(mx + w * .92, my + h * .95, mx, my + h); g.quadraticCurveTo(mx - w * .92, my + h * .95, mx - w, yc + sk); g.closePath(); };
  path(); g.fillStyle = '#4B2136'; g.fill(); g.save(); g.clip(); ell(g, mx, my + h * 1.05, w * .75, h * .45, '#E98773');
  if (e.mO > .5 && e.mW > .6) { g.fillStyle = P.white; g.fillRect(mx - w, my - h, 2 * w, h * 1.1); } g.restore();
  path(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
}

function drawHead(g, ch, p, J) {
  const R = ch.R, e = p.e, tt = clamp(p.face + p.head.turn, -1.15, 1.15), th2 = tt * .62;
  g.save(); g.translate(J.hc[0], J.hc[1]); g.rotate(p.head.tilt);
  if (p.sq) { g.translate(0, R); g.scale(1 + p.sq * .14, 1 - p.sq * .14); g.translate(0, -R); }
  const skin = e.pale ? mix(ch.skin, '#DCD6EA', e.pale * .85) : ch.skin;
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fillStyle = skin; g.fill();
  const hs = Math.sin(th2);
  if (p.head.back > .5) { g.save(); g.scale(R, R); HAIR.back(g, hs, ch.hairCol || INK, ch); if (ch.hair === 'messy' || ch.hair === 'tousled' || ch.hair === 'curly') { g.save(); g.beginPath(); g.rect(-2, -2, 4, 1.62); g.clip(); HAIR[ch.hair](g, 0, ch.hairCol || INK, ch); g.restore(); } if (ch.hair === 'bun') circ(g, 0, -1.08, .36, ch.hairCol); if (ch.hair === 'pony') { g.fillStyle = ch.hairCol; g.beginPath(); g.ellipse(.1, .5, .3, .7, 0, 0, TAU); g.fill(); } g.restore(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.restore(); return; }
  const fy = p.head.nod * R * .27, fxAt = phi => R * .84 * Math.sin(th2 + phi), wAt = phi => clamp(Math.cos(th2 + phi) / Math.cos(phi), .34, 1.08);
  const eyeY = R * .05 + fy, rx = R * .2, ry = R * .255, phi0 = .44;
  if (e.blush > .02) for (const s of [-1, 1]) { g.globalAlpha = e.blush * .6; ell(g, fxAt(s * .6), eyeY + ry * 1.5, rx * 1.05 * wAt(s * .6), ry * .42, P.rose); g.globalAlpha = e.blush * .8; for (let k = -1; k <= 1; k++) line(g, fxAt(s * .6) + k * 9 - 4, eyeY + ry * 1.68, fxAt(s * .6) + k * 9 + 4, eyeY + ry * 1.3, P.rust, 2.6); g.globalAlpha = 1; }
  // head outline first so the hair sits on top of it
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  g.save(); g.translate(0, Math.max(0, p.head.nod) * R * .09); g.scale(R, R * (1 + Math.max(0, p.head.nod) * .05)); (HAIR[ch.hair] || HAIR.short)(g, hs, ch.hairCol || INK, ch); g.restore();
  if (e.gloom > .02) {
    g.save(); g.beginPath(); g.arc(0, 0, R - 2, 0, TAU); g.clip(); g.globalAlpha = e.gloom;
    const gr = g.createLinearGradient(0, -R, 0, R * .5); gr.addColorStop(0, rgba(P.plum, .5)); gr.addColorStop(.5, rgba(P.plum, .16)); gr.addColorStop(1, rgba(P.plum, 0)); g.fillStyle = gr; g.fillRect(-R, -R, 2 * R, 2 * R);
    for (let i = -3; i <= 3; i++) line(g, i * R * .2 + hs * R * .2, -R * .7, i * R * .2 + hs * R * .2, -R * .14 + ((i * 37 + 91) % 5) * R * .05, rgba(P.indigo, .55), 3.2, 'round');
    g.restore();
  }
  for (const s of [-1, 1]) drawEye(g, fxAt(s * phi0), eyeY, rx * wAt(s * phi0), ry, e, s, skin);
  // brows
  g.lineCap = 'round'; g.strokeStyle = ch.browCol || INK; g.lineWidth = R * (ch.browW || .085);
  const o = Math.max(e.eyeOpen, .5), eRY = ry * (.3 + .7 * Math.min(o, 1)) * (o > 1 ? 1 + (o - 1) * .75 : 1);
  for (const s of [-1, 1]) {
    const ws = wAt(s * phi0), ex = fxAt(s * phi0), Lb = R * .36 * ws, by = eyeY - eRY - R * .13 - (e.browH + (s > 0 ? e.browAsym : -e.browAsym * .5)) * R * .14;
    const xi = ex - s * Lb / 2, xo = ex + s * Lb / 2, yi = by - e.browA * Lb * .42, yo = by + e.browA * Lb * .26;
    g.beginPath(); g.moveTo(xi, yi); g.quadraticCurveTo(ex, (yi + yo) / 2 - e.browC * Lb * .32, xo, yo); g.stroke();
  }
  drawMouth(g, fxAt(0) * .94, R * .54 + fy * .8, R, e, clamp(Math.cos(th2), .55, 1));
  if (ch.glasses) {
    g.lineWidth = 4; g.strokeStyle = INK; const xs = [];
    for (const s of [-1, 1]) { const ex = fxAt(s * phi0), rw = rx * 1.45 * wAt(s * phi0); xs.push([ex, rw]); g.beginPath(); g.ellipse(ex, eyeY, rw, ry * 1.25, 0, 0, TAU); g.fillStyle = 'rgba(255,253,246,.22)'; g.fill(); g.stroke(); }
    g.beginPath(); g.moveTo(xs[0][0] + xs[0][1], eyeY - 4); g.quadraticCurveTo((xs[0][0] + xs[1][0]) / 2, eyeY - 12, xs[1][0] - xs[1][1], eyeY - 4); g.stroke();
  }
  if (ch.goggles) { line(g, -R * .96, -R * .5, R * .96, -R * .5, P.ink, 7, 'butt'); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(fxAt(s * .4), -R * .56, R * .2, R * .13, 0, 0, TAU); g.fillStyle = ch.goggles; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); } }
  if (ch.stache) { g.fillStyle = ch.hairCol; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(fxAt(0) * .94 + s * R * .14, R * .4 + fy, R * .17, R * .075, s * .25, 0, TAU); g.fill(); } }
  if (e.sweat > .05) {
    const sd = hs > 0 ? -1 : 1; g.globalAlpha = clamp(e.sweat * 1.5);
    const drop = (x, y, s) => { g.beginPath(); g.moveTo(x, y - 17 * s); g.quadraticCurveTo(x + 11 * s, y, x, y + 8 * s); g.quadraticCurveTo(x - 11 * s, y, x, y - 17 * s); g.fillStyle = '#BFE3E6'; g.fill(); g.lineWidth = 2.6; g.strokeStyle = P.tealDeep; g.stroke(); };
    drop(sd * R * .86, -R * .28, 1); if (e.sweat > .6) drop(sd * R * 1.08, R * .1, .72); if (e.sweat > .85) drop(-sd * R * .92, -R * .5, .6); g.globalAlpha = 1;
  }
  g.restore();
}

// ---- rim light: light-side edge band + far-side shade band, per group ----
function lightPass(g, w, h, L, sc) {
  const cv = g.canvas, rw = Math.max(1.2, (L.rimW ?? 5) * sc), sw = Math.max(2, (L.shadeW ?? 15) * sc);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if ((L.shadeA ?? .3) > 0) {
    const m = tmp('lp_m', w, h); m.drawImage(cv, 0, 0); m.globalCompositeOperation = 'destination-out'; m.drawImage(cv, -L.dx * sw, -L.dy * sw);
    m.globalCompositeOperation = 'source-in'; m.fillStyle = L.shade || P.plum; m.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = L.shadeA ?? .3; g.drawImage(m.canvas, 0, 0);
  }
  if ((L.rimA ?? .9) > 0) {
    const m = tmp('lp_m', w, h); m.drawImage(cv, 0, 0); m.globalCompositeOperation = 'destination-out'; m.drawImage(cv, L.dx * rw, L.dy * rw);
    m.globalCompositeOperation = 'source-in'; m.fillStyle = L.rim || P.sun; m.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = L.rimA ?? .9; g.drawImage(m.canvas, 0, 0);
  }
  g.restore();
}

// ---- draw a whole character ----
// L: { dx, dy (direction the light travels), rim, rimA, rimW, shade, shadeA, shadeW, shadow: { kx, ky, a, blur, col } }
// opt: { blur, alpha, noShadow, tint:[col,a], flat }
export function drawChar(ctx, ch, pz, L = null, opt = {}) {
  const p = pz, J = solve(ch, p), M = ctx.getTransform(), sc = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)) * p.s;
  const reach = ch.ua + ch.fa + 40, topY = Math.min(J.hc[1] - ch.R * 1.7, J.c2[1] - reach), xs = [], ys = [];
  for (const [lx, ly] of [[-reach - 80 + J.c2[0], topY], [reach + 80 + J.c2[0], topY], [-reach - 80 + Math.min(0, J.c2[0]), 40], [reach + 80 + Math.max(0, J.c2[0]), 40]]) {
    const wx = p.x + lx * p.s, wy = p.y + ly * p.s; xs.push(M.a * wx + M.c * wy + M.e); ys.push(M.b * wx + M.d * wy + M.f);
  }
  const CW = ctx.canvas.width, CH = ctx.canvas.height, pad = 40;
  const bx = Math.floor(Math.max(-pad, Math.min(...xs))), by = Math.floor(Math.max(-pad, Math.min(...ys)));
  const bw = Math.ceil(Math.min(CW + pad, Math.max(...xs))) - bx, bh = Math.ceil(Math.min(CH + pad, Math.max(...ys))) - by;
  if (bw < 4 || bh < 4) return J;
  const setT = g => { g.setTransform(M.a, M.b, M.c, M.d, M.e - bx, M.f - by); g.translate(p.x, p.y); g.scale(p.s, p.s); };
  const front = Math.abs(J.sn) < .36, aNear = J.sn >= 0;
  const zA = p.aL.z ?? (front || aNear ? 1 : -1), zB = p.aR.z ?? (front || !aNear ? 1 : -1);
  const farLegA = !front && !aNear, farLegB = !front && aNear;
  const groups = [
    g => { if (zA < 0) drawArm(g, ch, J.A, true, p.aL); if (zB < 0) drawArm(g, ch, J.B, true, p.aR);
      if (ch.hood && !(p.head.back > .5)) { ell(g, J.nb[0] - J.sn * 10, J.nb[1] - 4, J.wS * .86 + 4, 30, dark(ch.top, .24), Math.atan2(J.ue[1], J.ue[0])); }
      if (farLegA) drawLeg(g, ch, J.LA, true, p, -1); if (farLegB) drawLeg(g, ch, J.LB, true, p, 1); },
    g => { if (!farLegA) drawLeg(g, ch, J.LA, false, p, -1); if (!farLegB) drawLeg(g, ch, J.LB, false, p, 1);
      line(g, J.nb[0], J.nb[1], J.hc[0], J.hc[1], INK, 14); torso(g, ch, p, J);
      if (ch.hood && p.head.back > .5) ell(g, J.nb[0], J.nb[1] + 12, J.wS * .8, 30, dark(ch.top, .18)); },
    g => drawHead(g, ch, p, J),
    g => { if (zA > 0) drawArm(g, ch, J.A, false, p.aL); if (zB > 0) drawArm(g, ch, J.B, false, p.aR); },
  ];
  const all = tmp('ch_all', bw, bh);
  for (let gi = 0; gi < groups.length; gi++) {
    if (opt.only && !opt.only.includes(gi)) continue;
    const fn = groups[gi], g = tmp('ch_g', bw, bh); setT(g); fn(g);
    if (L && !opt.flat) lightPass(g, bw, bh, L, sc);
    all.drawImage(g.canvas, 0, 0);
  }
  if (opt.tint) { all.globalCompositeOperation = 'source-atop'; all.globalAlpha = opt.tint[1]; all.fillStyle = opt.tint[0]; all.fillRect(0, 0, bw, bh); all.globalCompositeOperation = 'source-over'; all.globalAlpha = 1; }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (L && L.shadow && !opt.noShadow) {
    const S = L.shadow, sil = tmp('ch_sil', bw, bh); sil.drawImage(all.canvas, 0, 0); sil.globalCompositeOperation = 'source-in'; sil.fillStyle = S.col || P.plum; sil.fillRect(0, 0, bw, bh);
    const gy = M.b * p.x + M.d * (p.y + (opt.groundDy || 0)) + M.f;
    ctx.save(); ctx.setTransform(1, 0, -S.kx, -S.ky, S.kx * gy, gy * (1 + S.ky)); ctx.globalAlpha = S.a ?? .3; ctx.globalCompositeOperation = 'multiply';
    ctx.filter = `blur(${Math.max(.5, (S.blur ?? 5) * sc)}px)`; ctx.drawImage(sil.canvas, bx, by); ctx.restore();
  }
  ctx.globalAlpha = opt.alpha ?? 1; if (opt.blur) ctx.filter = `blur(${opt.blur}px)`;
  ctx.drawImage(all.canvas, bx, by); ctx.restore();
  return J;
}
