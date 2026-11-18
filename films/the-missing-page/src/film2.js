// THE MISSING PAGE — the hallway, the elevator conversation (5) and the horror (6).
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, wash } from './kit.js';
import { pose, solve, drawChar } from './rig.js';
import { X, EXAM, CAND, SECOND } from './cast.js';
import { W, H, layerSoft, finish, mkL } from './shots.js';
import { M, kf, pk, idle, talk, voice, lineT, walk, captions, EASE } from './anim.js';
import { view, paint } from './space.js';
import { flash } from './inserts.js';

// ---------- the elevator: geometry and state over time ----------
const CAB = { x: 380, d: 900, h: 760, dw: 210, dh: 560 };
export function doorOpen(t) {                       // 0 closed … 1 open
  const m = M;
  if (t < m.s5) return kf(t, [[m.hall + 2.75, 0], [m.hall + 3.45, 1, 'io']]);
  if (t < m.frozen + 1.2) return kf(t, [[m.s5 + .1, 1], [m.s5 + 1.0, 0, 'io']]);
  return kf(t, [[m.frozen + 1.2, 0], [m.frozen + 1.9, 1, 'io'], [m.frozen + 2.2, 1], [m.shut, 0, 'i']]);
}
export function floorAt(t) {
  const m = M, k = [[m.s5 + 2.5, 12], [m.s5 + 6, 11], [m.s5 + 10, 10], [m.s5 + 14.5, 9], [m.s5 + 19.5, 8], [m.frozen + 1.0, 7], [m.final + 1.0, 6]];
  let f = 12; for (const [tt, v] of k) if (t >= tt) f = v; return f;
}
const cold = t => clamp((t - M.trigger) / 2.2);       // the horror grade, 0 → 1
const METAL = ['#CFC6B8', '#B9AFA0', '#A39A8C'], METAL_C = ['#9AA0B4', '#868CA2', '#727890'];
const metal = (k, i) => mix(METAL[i], METAL_C[i], k);
// the cabin, drawn for any camera; shows the doors only when the camera is inside looking toward them
function cabin(g, V, t, o = {}) {
  const { x: cx, h, dw, dh } = CAB, k = o.cold ?? cold(t), z0 = o.z0 ?? 0, d = o.zEnd ?? CAB.d;
  // ceiling + light panel
  V.poly(g, [[-cx, h, z0], [cx, h, z0], [cx, h, d], [-cx, h, d]], mix('#E9DFCC', '#9EA2B8', k));
  V.poly(g, [[-cx + 70, h - 2, 120], [cx - 70, h - 2, 120], [cx - 70, h - 2, d - 120], [-cx + 70, h - 2, d - 120]], mix('#FFF3D6', '#D8DDF0', k));
  // back wall, side walls with brushed streaks
  const wall = (pts, base) => { const S = V.poly(g, pts, base); if (!S) return; g.save(); g.clip(); g.globalAlpha = .08; for (let i = 0; i < 30; i++) { const q = V.p(...[pts[0][0] === pts[1][0] ? pts[0][0] : lerp(pts[0][0], pts[1][0], i / 30), 0, pts[0][2] === pts[1][2] ? pts[0][2] : lerp(pts[0][2], pts[1][2], i / 30)]), q2 = V.p(...[pts[0][0] === pts[1][0] ? pts[0][0] : lerp(pts[0][0], pts[1][0], i / 30), h, pts[0][2] === pts[1][2] ? pts[0][2] : lerp(pts[0][2], pts[1][2], i / 30)]); line(g, q[0], q[1], q2[0], q2[1], i % 2 ? '#FFFFFF' : '#5A5560', 2); } g.restore(); };
  if (!o.noBack) wall([[-cx, 0, d], [cx, 0, d], [cx, h, d], [-cx, h, d]], metal(k, 0));
  wall([[-cx, 0, z0], [-cx, 0, d], [-cx, h, d], [-cx, h, z0]], metal(k, 1));
  wall([[cx, 0, z0], [cx, 0, d], [cx, h, d], [cx, h, z0]], metal(k, 2));
  // handrails (brass) on the back and side walls
  const rail = mix('#D4A45A', '#8E8CA0', k);
  if (!o.noBack) V.box(g, -cx + 40, 318, d - 40, cx - 40, 336, d - 26, { top: lite(rail, .3), front: rail, bottom: dark(rail, .3) });
  V.box(g, -cx + 26, 318, 120, -cx + 40, 336, d - 40, { top: lite(rail, .3), right: rail });
  V.box(g, cx - 40, 318, 120, cx - 26, 336, d - 40, { top: lite(rail, .3), left: rail });
  // button panel + small indicator on the right wall
  V.poly(g, [[cx - 1, 300, 110], [cx - 1, 300, 260], [cx - 1, 560, 260], [cx - 1, 560, 110]], mix('#2E2C36', '#24263A', k));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const q = V.p(cx - 2, 330 + i * 34, 150 + j * 60), r = 8 * V.s(cx, 150 + j * 60); circ(g, q[0], q[1], r, (i === 0 && j === 0) ? '#FFB347' : mix('#D9D2C2', '#9AA0B4', k)); }
  { const a = V.p(cx - 2, 540, 130), b = V.p(cx - 2, 500, 240); fillR(g, Math.min(a[0], b[0]), a[1], Math.abs(b[0] - a[0]), b[1] - a[1], '#120F18'); text(g, String(floorAt(t)), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1, { size: Math.abs(b[1] - a[1]) * .8, font: F.ui, weight: '700', col: '#FFB347' }); }
  // floor
  V.poly(g, [[-cx, 0, z0], [cx, 0, z0], [cx, 0, d], [-cx, 0, d]], (gg, S) => lg(gg, 0, Math.min(...S.map(p => p[1])), 0, 1920, [mix('#5B4E4A', '#3E4056', k), mix('#3E3434', '#2A2C3E', k)]));
  g.save(); g.globalAlpha = .12; g.globalCompositeOperation = 'screen'; V.poly(g, [[-cx + 70, -1, 120], [cx - 70, -1, 120], [cx - 70, -1, d - 120], [-cx + 70, -1, d - 120]], mix('#FFF3D6', '#D8DDF0', k)); g.restore();
  // the door wall (only meaningful from inside, facing it)
  if (o.doorWall) {
    const op = doorOpen(t), beyond = o.beyond || 'cold';
    V.poly(g, [[-cx, 0, 0], [cx, 0, 0], [cx, h, 0], [-cx, h, 0]], metal(k, 1));
    // what lies beyond the opening
    const S = V.path(g, [[-dw, 0, -1], [dw, 0, -1], [dw, dh, -1], [-dw, dh, -1]]);
    if (S) { g.save(); g.clip(); const y0 = Math.min(...S.map(p => p[1])), y1 = Math.max(...S.map(p => p[1]));
      g.fillStyle = beyond === 'cold' ? lg(g, 0, y0, 0, y1, ['#56618A', '#3C456A', '#262C46']) : lg(g, 0, y0, 0, y1, ['#FFF0CC', '#F2D6A2', '#D9B47E']); g.fillRect(-500, -500, 3000, 3000);
      // an empty, dim corridor on floor 7
      const vp = V.p(0, 380, -3000); g.strokeStyle = rgba('#FFFFFF', .25); g.lineWidth = 2; for (const xx of [-dw, dw]) { const a = V.p(xx * 1.4, 0, -40), b = V.p(xx * 1.4, dh, -40); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(vp[0], vp[1]); g.moveTo(b[0], b[1]); g.lineTo(vp[0], vp[1]); g.stroke(); }
      g.restore(); }
    const pw = dw * (1 - op);  // each panel's visible width
    const panel = (x0, x1, col) => { const Sx = V.poly(g, [[x0, 0, -.5], [x1, 0, -.5], [x1, dh, -.5], [x0, dh, -.5]], col, rgba('#3A3640', .6), 2); if (Sx) { g.save(); g.clip(); g.globalAlpha = .12; for (let i = 0; i < 14; i++) { const q = V.p(lerp(x0, x1, i / 14), 0, 0), q2 = V.p(lerp(x0, x1, i / 14), dh, 0); line(g, q[0], q[1], q2[0], q2[1], i % 2 ? '#FFFFFF' : '#4A4550', 2); } g.restore(); } };
    if (pw > .5) { panel(-dw, -dw + pw, metal(k, 0)); panel(dw - pw, dw, metal(k, 0)); }
    V.poly(g, [[-dw - 26, 0, -.2], [-dw, 0, -.2], [-dw, dh + 26, -.2], [-dw - 26, dh + 26, -.2]], metal(k, 2)); V.poly(g, [[dw, 0, -.2], [dw + 26, 0, -.2], [dw + 26, dh + 26, -.2], [dw, dh + 26, -.2]], metal(k, 2)); V.poly(g, [[-dw - 26, dh, -.2], [dw + 26, dh, -.2], [dw + 26, dh + 26, -.2], [-dw - 26, dh + 26, -.2]], metal(k, 2));
    // floor indicator above the doors
    const a = V.p(-70, dh + 110, -.3), b = V.p(70, dh + 52, -.3); fillRR(g, Math.min(a[0], b[0]), a[1], Math.abs(b[0] - a[0]), b[1] - a[1], 4, '#120F18');
    text(g, `${floorAt(t)} ▼`, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1, { size: Math.abs(b[1] - a[1]) * .72, font: F.ui, weight: '700', col: '#FFB347' });
  }
}
// the hallway light through the doors, seen from inside facing out: a vertical band over everything
function doorBand(g, t, open, col, a = .32) {
  if (open < .01) return; const w = open * 760;
  g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = a; g.filter = 'blur(26px)'; g.fillStyle = col; g.fillRect(540 - w / 2, -50, w, 2020); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = a * .35; g.filter = 'blur(40px)'; g.fillStyle = col; g.fillRect(540 - w / 2, -50, w, 2020); g.restore();
}
function horrorGrade(ctx, k) {
  if (k < .01) return;
  const c = tmp('hg', W, H); c.filter = `saturate(${1 - .62 * k}) brightness(${1 - .1 * k}) contrast(${1 + .12 * k})`; c.drawImage(ctx.canvas, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c.canvas, 0, 0); ctx.restore();
  wash(ctx, W, H, '#5A6A9E', .32 * k, 'multiply'); wash(ctx, W, H, '#3A4A7A', .16 * k, 'soft-light');
}

// ================= the hallway: waiting, the nod, the chime, in =================
export function hallway(ctx, t) {
  const m = M, u = t - m.hall, k = 0;
  const V = view({ x: 0, y: 380, z: kf(u, [[0, 900], [5, 1250, 'lin']]), yaw: 0, f: 1500, cy: 980 });
  const Wc = 430, Hc = 780, Z1 = 2800;
  // ceiling, walls, floor
  V.poly(ctx, [[-Wc, Hc, 0], [Wc, Hc, 0], [Wc, Hc, Z1], [-Wc, Hc, Z1]], '#EFE3CB');
  for (let z = 400; z < Z1; z += 420) { const q = V.p(0, Hc - 2, z), r = 26 * V.s(0, z); ell(ctx, q[0], q[1], r, r * .35, '#FFF6DE'); }
  for (const s of [-1, 1]) {
    V.poly(ctx, [[s * Wc, 0, 0], [s * Wc, 0, Z1], [s * Wc, Hc, Z1], [s * Wc, Hc, 0]], s < 0 ? '#F1DDB8' : '#EAD3AC');
    // glass partitions with offices beyond (sun-lit, gold), mullions
    for (let z = 300; z < 2350; z += 520) {
      V.poly(ctx, [[s * Wc, 40, z], [s * Wc, 40, z + 470], [s * Wc, 640, z + 470], [s * Wc, 640, z]], (gg, S) => lg(gg, 0, Math.min(...S.map(p => p[1])), 0, Math.max(...S.map(p => p[1])), ['#CFE1DE', '#F2E2BC', '#E7C995']));
      for (const zz of [z + 120, z + 330]) { const a = V.p(s * (Wc + 300), 110, zz), b = V.p(s * (Wc + 300), 230, zz + 90); fillR(ctx, Math.min(a[0], b[0]), b[1], Math.abs(b[0] - a[0]), a[1] - b[1], rgba('#8A6A50', .35)); }
      ctx.save(); ctx.globalAlpha = .25; V.poly(ctx, [[s * Wc, 40, z + 40], [s * Wc, 40, z + 110], [s * Wc, 640, z + 200], [s * Wc, 640, z + 130]], '#FFFFFF'); ctx.restore();
      V.poly(ctx, [[s * Wc, 40, z + 466], [s * Wc, 40, z + 520], [s * Wc, 680, z + 520], [s * Wc, 680, z + 466]], '#5B4A44');
    }
    V.poly(ctx, [[s * Wc, 0, 0], [s * Wc, 0, Z1], [s * Wc, 40, Z1], [s * Wc, 40, 0]], '#8E6040');
    V.poly(ctx, [[s * Wc, 640, 0], [s * Wc, 640, Z1], [s * Wc, 680, Z1], [s * Wc, 680, 0]], '#5B4A44');
  }
  V.poly(ctx, [[-Wc, 0, 0], [Wc, 0, 0], [Wc, 0, Z1], [-Wc, 0, Z1]], (gg, S) => lg(gg, 0, Math.min(...S.map(p => p[1])), 0, 1920, ['#CDB894', '#E4D2B4', '#D8C29E']));
  ctx.save(); ctx.globalAlpha = .18; ctx.globalCompositeOperation = 'screen'; for (let z = 400; z < Z1; z += 420) V.poly(ctx, [[-30, 1, z - 60], [30, 1, z - 60], [60, 1, z + 200], [-60, 1, z + 200]], '#FFF1D0'); ctx.restore();
  // the end wall with the elevator
  V.poly(ctx, [[-Wc, 0, Z1], [Wc, 0, Z1], [Wc, Hc, Z1], [-Wc, Hc, Z1]], '#E6CFA8');
  const op = doorOpen(t), dw = 220, dh = 580;
  V.poly(ctx, [[-dw, 0, Z1 + 400], [dw, 0, Z1 + 400], [dw, dh, Z1 + 400], [-dw, dh, Z1 + 400]], '#D9C3A0');
  V.poly(ctx, [[-dw, 0, Z1], [dw, 0, Z1], [dw, 0, Z1 + 400], [-dw, 0, Z1 + 400]], '#4E423E');
  for (const s of [-1, 1]) V.poly(ctx, [[s * dw, 0, Z1], [s * dw, 0, Z1 + 400], [s * dw, dh, Z1 + 400], [s * dw, dh, Z1]], '#BDAF9C');
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = op * .35; V.poly(ctx, [[-dw, 1, Z1], [dw, 1, Z1], [dw * 1.6, 1, Z1 - 700], [-dw * 1.6, 1, Z1 - 700]], '#FFE8B4'); ctx.restore();
  const pw = dw * (1 - op);
  if (pw > .5) for (const [x0, x1] of [[-dw, -dw + pw], [dw - pw, dw]]) V.poly(ctx, [[x0, 0, Z1 - 1], [x1, 0, Z1 - 1], [x1, dh, Z1 - 1], [x0, dh, Z1 - 1]], '#C9C0B2', '#7A7268', 2);
  V.poly(ctx, [[-dw - 30, 0, Z1 - 2], [-dw, 0, Z1 - 2], [-dw, dh + 30, Z1 - 2], [-dw - 30, dh + 30, Z1 - 2]], '#8F877C'); V.poly(ctx, [[dw, 0, Z1 - 2], [dw + 30, 0, Z1 - 2], [dw + 30, dh + 30, Z1 - 2], [dw, dh + 30, Z1 - 2]], '#8F877C'); V.poly(ctx, [[-dw - 30, dh, Z1 - 2], [dw + 30, dh, Z1 - 2], [dw + 30, dh + 30, Z1 - 2], [-dw - 30, dh + 30, Z1 - 2]], '#8F877C');
  { const a = V.p(-120, dh + 150, Z1 - 3), b = V.p(120, dh + 80, Z1 - 3); fillRR(ctx, a[0], a[1], b[0] - a[0], b[1] - a[1], 4, '#2B2752'); text(ctx, 'ELEVATORS  12', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1, { size: (b[1] - a[1]) * .48, font: F.ui, weight: '600', col: P.gold, ls: 2 }); }
  { const q = V.p(dw + 90, 300, Z1 - 3), r = 12 * V.s(dw + 90, Z1); fillRR(ctx, q[0] - r * 1.4, q[1] - r * 2.6, r * 2.8, r * 5.2, r * .5, '#9A9080'); circ(ctx, q[0], q[1] - r * 1.1, r * .8, t > m.hall + .9 ? '#FFB347' : '#E9E2D4'); circ(ctx, q[0], q[1] + r * 1.1, r * .8, '#E9E2D4'); }
  // a plant
  { const q = V.p(-Wc + 90, 0, Z1 - 150), s = V.s(-Wc + 90, Z1 - 150); fillRR(ctx, q[0] - 40 * s, q[1] - 90 * s, 80 * s, 90 * s, 8 * s, '#8E6040'); for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(q[0], q[1] - 90 * s); ctx.rotate(-1.1 + i * .37 + Math.sin(t + i) * .02); ell(ctx, 0, -110 * s, 26 * s, 110 * s, i % 2 ? P.tealDeep : P.teal); ctx.restore(); } }
  // the two men
  const L = mkL(-.3, .9, { shadow: { kx: -.2, ky: .3, a: .25, blur: 6, col: P.plum } });
  const nod = clamp(1 - Math.abs(u - 2.0) / .35), inC = kf(u, [[3.5, 0], [4.7, 1, 'io']]), inS = kf(u, [[3.3, 0], [4.5, 1, 'io']]);
  // the Candidate: hands in pockets, smiling to himself; then in, turning round
  const cx0 = 170, cz0 = 2560, cX = lerp(cx0, 150, inC), cZ = lerp(cz0, 3150, inC);
  let cp = pose(CAND, { face: inC > .85 ? 0 : (inC > .1 ? .2 : -.45), head: { nod: -nod * .25, turn: nod * -.15, back: inC > .1 && inC < .85 ? 1 : 0 }, e: { ...X.smug, gx: nod > .2 ? -.8 : -.3 }, aL: { to: [-40, -256], k: 1, z: -1, hand: 'fist' }, aR: { to: [40, -256], k: -1, z: -1 }, lean: -.03 }, inC > .1 && inC < .85 ? walk(u * 1.8, 1, { stride: 22 }) : {});
  if (inC > .85) cp = pose(CAND, cp, { e: { ...X.chill } });
  // the Second Candidate walks up the corridor, nods, steps in
  const sw = kf(u, [[.2, 0], [1.8, 1, 'o']]), sX = lerp(-170, -130, inS), sZ = lerp(lerp(1350, 2520, sw), 3080, inS);
  const walking = (u > .2 && u < 1.8) || (inS > .05 && inS < .85);
  let sp = pose(SECOND, { face: inS > .85 ? 0 : (u > 1.75 && inS < .05 ? .5 : 0), head: { back: (u < 1.75 || (inS > .05 && inS < .85)) ? 1 : 0, nod: nod * .3 }, e: { ...X.tired, gx: .6 }, aL: { a: .08, b: .1, prop: { n: 'folder', r: .1 } }, aR: { a: -.08, b: -.1 } }, walking ? walk(u * 1.7, inS > .05 ? 1 : 1, { stride: 20, lift: 10 }) : {});
  sp = idle(sp, t, 1, .4); cp = idle(cp, t, 0, .5);
  const items = [{ d: V.depth(cX, cZ), fn: () => V.ch(ctx, CAND, cp, cX, cZ, L, { tint: ['#F7DDAE', .12] }) }, { d: V.depth(sX, sZ), fn: () => V.ch(ctx, SECOND, sp, sX, sZ, L, { tint: ['#F7DDAE', .08] }) }];
  if (cZ > Z1 + 20 || sZ > Z1 + 20) { /* inside the cabin: drawn before the door panels? they are already open */ }
  paint(items);
  dust(ctx, t, 100, 300, 900, 1200, 36, 17);
  finish(ctx, { vig: .5, bl: .26 });
}

// ================= 5. THE ELEVATOR CONVERSATION =================
const LC = mkL(.2, .95, { rim: '#FFEBC4', rimW: 5, rimA: .85, shadeA: .24, shadow: { kx: .15, ky: .25, a: .25, blur: 7, col: '#3A3040' } });
const CPOS = { x: 175, z: 760 }, SPOS = { x: -150, z: 560 };
function elevFront(ctx, t, o = {}) {
  const k = o.cold ?? cold(t), z = (o.zoom || 1) * 1.28;
  const V = view({ x: (o.x ?? 0), y: o.y ?? 420, z: -640, yaw: 0, f: 1180 * z, cy: o.cy ?? 960 });
  cabin(ctx, V, t, { cold: k, z0: -700 });
  const L = { ...LC, rim: mix('#FFEBC4', '#C8D2F0', k) };
  const items = [];
  if (o.cand) items.push({ d: V.depth(o.cx ?? CPOS.x, o.cz ?? CPOS.z), fn: () => V.ch(ctx, CAND, o.cand, o.cx ?? CPOS.x, o.cz ?? CPOS.z, L) });
  if (o.sec) items.push({ d: V.depth(o.sx ?? SPOS.x, SPOS.z), fn: () => V.ch(ctx, SECOND, o.sec, o.sx ?? SPOS.x, SPOS.z, L, o.secOpt || {}) });
  if (o.layers) { // soft second candidate in the foreground for the close-ups
    for (const it of items) if (it.soft) it.fn();
  }
  paint(items);
  return V;
}
let K5 = null;
function keys5() {
  if (K5) return K5;
  const c = (...o) => pose(CAND, ...o), s = (...o) => pose(SECOND, ...o);
  const lean = { lean: -.07, hipX: -10, aL: { to: [-70, -300], k: 1, z: -1 }, aR: { to: [70, -300], k: -1, z: -1 } };
  const folder = { aL: { to: [26, -290], k: 1, z: 1, prop: { n: 'folder', r: -.2 } } };
  K5 = {
    cRelax: c(lean, { face: -.12, e: { ...X.chill, gx: -.2 }, head: { tilt: .05 } }),
    cChuckle: c(lean, { face: -.25, shrug: .55, e: { ...X.cocky, gx: -.7 }, head: { tilt: .08, turn: -.2 } }),
    cChill: c(lean, { face: -.25, shrug: -.1, e: { ...X.chill, gx: -.7 }, head: { tilt: .1, turn: -.2 } }),
    cWeak: c(lean, { face: -.18, e: { ...X.chill, mS: .2, mW: .6, gx: -.7, browAsym: .2 }, head: { turn: -.18 } }),
    cFront: c(lean, { face: 0, e: { ...X.confused, gx: 0, mS: -.05, browA: .3 }, head: { turn: 0 } }),
    cTurn: c(lean, { face: -.1, lean: -.02, e: { ...X.confused, gx: -.9, lidT: .25, browA: .45, browC: .5, mS: -.25 }, head: { turn: -.45, tilt: -.03 } }),
    cDawn: c({ face: -.08, lean: 0, aL: { to: [-60, -300], k: 1, z: -1 }, aR: { to: [60, -300], k: -1, z: -1 }, e: { ...X.shocked, gx: -.3, pup: .5, pale: .3, mO: .1 }, head: { turn: -.15 } }),
    sTired: s(folder, { face: .12, e: { ...X.tired, gx: .2 }, shrug: .2 }),
    sExhale: s(folder, { face: .15, shrug: .7, head: { nod: .2 }, e: { ...X.exhausted, gx: .3 } }),
    sTalk: s(folder, { face: .28, e: { ...X.sincere, gx: .8 }, head: { turn: .25 } }),
    sAsk: s(folder, { face: .32, e: { ...X.sincere, gx: .9, browH: .35, mS: .1 }, head: { turn: .3, tilt: -.04 } }),
    sPuzzled: s(folder, { face: .3, e: { ...X.confused, gx: .9, browAsym: .5 }, head: { turn: .3, tilt: .05 } }),
  };
  return K5;
}
export function seq5(ctx, t) {
  const m = M, K = keys5(), L = id => lineT(id), s01 = L('s01'), c02 = L('c02'), s02 = L('s02'), s03 = L('s03'), s04 = L('s04'), c03 = L('c03'), s05 = L('s05');
  const cK = [[m.s5, K.cRelax], [c02.t0 - .1, K.cRelax], [c02.t0 + .2, K.cChuckle, 'back'], [c02.t1 - .3, K.cChill], [s03.t0 + 1.2, K.cChill], [s03.t1, K.cWeak], [m.turn, K.cWeak], [m.turn + .2, K.cFront], [c03.t0 - .25, K.cFront], [c03.t0 + .45, K.cTurn, 'io'], [s05.t0 + .4, K.cTurn], [m.trigger, K.cDawn]];
  const sK = [[m.s5, K.sTired], [s01.t0 - .2, K.sExhale], [s01.t1, K.sTired], [s02.t0, K.sTalk], [s04.t1 + .2, K.sAsk], [c03.t1, K.sPuzzled], [s05.t0 + .2, K.sTalk]];
  let cp = talk(idle(pk(CAND, t, cK), t, 0, .5), 'CANDIDATE', t), sp = talk(idle(pk(SECOND, t, sK), t, 1, .5), 'SECOND', t);
  if (t < c02.t1 && t > c02.t0) cp = { ...cp, shrug: cp.shrug + Math.max(0, Math.sin((t - c02.t0) * 9)) * .12 };
  const open = doorOpen(t);
  if (t < m.closer) {                                    // 22. the stable two-shot
    elevFront(ctx, t, { cand: cp, sec: sp, zoom: kf(t, [[m.s5, 1], [m.closer, 1.04, 'lin']]) });
    doorBand(ctx, t, open, '#FFE2A6', .4);
  } else if (t < m.turn) {                               // 22b. a touch closer
    elevFront(ctx, t, { cand: cp, sec: sp, zoom: kf(t, [[m.closer, 1.16], [m.turn, 1.2, 'lin']]), x: 10, cy: 940 });
  } else if (t < m.confused) {                           // 23. eyes, then head: "...What other page?"
    elevFront(ctx, t, { cand: cp, sec: sp, zoom: kf(t, [[m.turn, 1.5], [m.confused, 1.62, 'lin']]), x: 120, y: 470, cy: 1060 });
  } else {                                               // 24. the Second Candidate, innocent: "The one behind the statistics page..."
    elevFront(ctx, t, { cand: cp, sec: sp, zoom: kf(t, [[m.confused, 1.85], [m.trigger, 1.9, 'lin']]), x: -150, y: 470, cy: 1000 });
  }
  finish(ctx, { vig: .52, bl: .2 }); captions(ctx, t, 1640);
}

// ================= 6. THE HORROR =================
const cHollow = () => pose(CAND, { face: 0, shrug: .6, aL: { to: [-60, -300], k: 1, z: -1 }, aR: { to: [60, -300], k: -1, z: -1 }, e: { ...X.hollow, gx: 0, gy: 0 } });
// draw a head-only close-up of the Candidate, face centred on (fx, fy) with head radius R px
function headCU(ctx, p, fx, fy, Rpx, L, opt = {}) {
  const s = Rpx / CAND.R, J = solve(CAND, p);
  drawChar(ctx, CAND, { ...p, x: fx - J.hc[0] * s, y: fy - J.hc[1] * s, s }, L, { only: [1, 2, 3], noShadow: true, ...opt });
}
export function seq6(ctx, t) {
  const m = M, k = cold(t), K = keys5();
  const Lc = mkL(.2, .95, { rim: mix('#FFEBC4', '#BFC9EE', k), rimW: 5, rimA: .8, shadeA: .3, shadow: null });
  if (t < m.bell) {                                       // 25. close on his face: the smile drains, the push begins
    const u = (t - m.trigger) / (m.bell - m.trigger);
    const p = pose(CAND, K.cDawn, { e: { ...X.shocked, pup: lerp(.6, .3, u), eyeOpen: lerp(1.2, 1.5, u), mO: lerp(.05, .2, u), pale: lerp(.2, .6, u), gloom: lerp(0, .3, u), gx: lerp(-.4, 0, u), sweat: u * .8 }, head: { turn: lerp(-.15, 0, u) } });
    const zz = lerp(3.3, 4.1, EASE.io(u));
    layerSoft(ctx, 'bg', g => elevFront(g, t, { cand: null, sec: talk(pose(SECOND, K.sTalk), 'SECOND', t), zoom: zz / 1.28, x: 175, y: 436, cy: 830 }), 9);
    const V = view({ x: 175, y: 436, z: -640, yaw: 0, f: 1180 * zz, cy: 830 });
    V.ch(ctx, CAND, idle(p, t, 0, .15), CPOS.x, CPOS.z, Lc, { noShadow: true });
    horrorGrade(ctx, k); finish(ctx, { vig: .6 + k * .2, bl: .16, inner: .3 - k * .08 }); return;
  }
  if (t < m.flash) {                                      // extreme close-up: the eyes. A.
    const u = t - m.bell, p = pose(CAND, { face: 0, e: { ...X.horror, pup: lerp(.26, .14, clamp(u / .6)), mO: .3, gx: 0, gy: 0, sweat: 1 } });
    ctx.fillStyle = mix('#BFB3A6', '#6E7290', k); ctx.fillRect(0, 0, W, H);
    const shake = Math.sin(u * 60) * 2 * clamp(1 - u * 2);
    headCU(ctx, p, 540 + shake, 1060, kf(u, [[0, 760], [1.05, 820, 'o']]), Lc);
    horrorGrade(ctx, 1); finish(ctx, { vig: .85, bl: .12, inner: .22 }); return;
  }
  if (t < m.back) { flash(ctx, t - m.flash, m.back - m.flash, 0); finish(ctx, { vig: .5, bl: .3 }); return; }
  if (t < m.pass) { flash(ctx, t - m.back, m.pass - m.back, 1); finish(ctx, { vig: .55, bl: .3 }); return; }
  if (t < m.frozen) { flash(ctx, t - m.pass, m.frozen - m.pass, 2); finish(ctx, { vig: .6, bl: .25 }); return; }
  const op = doorOpen(t);
  if (t < m.lunge) {                                      // 27–28. frozen. The doors open on 7 behind us and start to close. Then the snap.
    const u = t - m.frozen, snap = clamp((t - m.snap) / .18);
    const p0 = pose(cHollow(), { e: { ...X.hollow, pup: .16 } });
    const p1 = pose(CAND, { face: .05, shrug: 1.1, sq: -.1, aL: { to: [-60, -300], k: 1, z: -1 }, aR: { to: [60, -300], k: -1, z: -1 }, e: { ...X.horror, pup: .3, gx: .15, gy: .05, mO: .7 }, head: { turn: .12, tilt: .04 } });
    const p = snap > 0 ? pk(CAND, t, [[m.snap, p0], [m.snap + .18, p1, 'back']]) : p0;
    const zz = kf(t, [[m.frozen, 3.6], [m.snap, 4.3, 'lin'], [m.snap + .2, 4.7, 'o']]);
    const sp = talk(pose(SECOND, K.sTalk, { e: { ...X.sincere, gx: .9 } }), 'SECOND', t);
    layerSoft(ctx, 'bg', g => elevFront(g, t, { cand: null, sec: sp, zoom: zz / 1.28, x: 175, y: 436, cy: 830, cold: 1 }), 10);
    const V = view({ x: 175, y: 436, z: -640, yaw: 0, f: 1180 * zz, cy: 830 });
    V.ch(ctx, CAND, idle(p, t, 0, .08), CPOS.x, CPOS.z, Lc, { noShadow: true });
    doorBand(ctx, t, op, '#AFC0F0', .5);
    horrorGrade(ctx, 1); finish(ctx, { vig: .7, bl: .14, inner: .26 }); return;
  }
  // 29–31. the reverse: from the back of the cabin, facing the doors
  const V = view({ x: 0, y: 430, z: 1500, yaw: Math.PI, f: t < m.doors ? 1500 : (t < m.shut ? 2600 : 1700), cy: t < m.doors ? 960 : (t < m.shut ? 1040 : 980) });
  const lu = clamp((t - m.lunge) / .62), bump = clamp(1 - Math.abs(t - (m.lunge + .22)) / .16);
  const cX = lerp(175, 70, EASE.o(lu)), cZ = lerp(760, 95, EASE.o(lu));
  const reach = t < m.shut ? 1 : 0, hitT = t - m.shut;
  let cp;
  if (t < m.shut) cp = pose(CAND, { face: 0, head: { back: 1, tilt: .05 }, lean: .28, shrug: .9, aL: { a: -.2, b: .2, z: -1 }, aR: { to: [-26, -470], k: 1, z: 1, hand: 'open', l: 1.15 } }, walk(t * 3.2, 1, { stride: 60, lift: 22 }), { face: 0 });
  else cp = pose(CAND, { face: 0, head: { back: 1, tilt: -.04 + Math.sin(clamp(hitT / .3) * Math.PI) * .05 }, lean: .1, shrug: 1.2, sq: Math.exp(-hitT * 8) * .25, aL: { to: [-118, -430], k: 1, z: -1, hand: 'open' }, aR: { to: [122, -452], k: -1, z: -1, hand: 'open' } });
  const sTurn = kf(t, [[m.final + .5, 0], [m.final + 1.6, 1, 'io']]), stumble = kf(t, [[m.lunge + .2, 0], [m.lunge + .5, 1, 'o']]);
  const sX = -190 - stumble * 120, sZ = 470 + stumble * 40;
  let sp = pose(SECOND, { face: 0, head: { back: sTurn > .45 ? 0 : 1, turn: 0 }, lean: -stumble * .08 + bump * -.1, shrug: .4 + bump * .5, aL: { a: .1 + bump * .6, b: .3, prop: { n: 'folder', r: .1 } }, aR: { a: -.1 - bump * .5, b: -.2 } });
  if (sTurn > .45) sp = pose(SECOND, sp, { face: lerp(.2, .62, sTurn), e: { ...X.baffled, gx: .9, browAsym: lerp(.3, 1.1, sTurn) }, head: { turn: .2, tilt: -.05 * sTurn } });
  sp = idle(sp, t, 1, .3);
  cabin(ctx, V, t, { cold: 1, doorWall: true, noBack: true, zEnd: 1700 });
  const L = mkL(-.1, .95, { rim: '#C8D2F0', rimW: 5, rimA: .7, shadeA: .3, shadow: { kx: -.1, ky: .3, a: .3, blur: 6, col: '#22243A' } });
  // the reflection of his face in the brushed doors (once he is against them)
  if (t > m.shut) {
    const q = V.p(cX + 70, 470, 1), s = V.s(cX, 1);
    ctx.save(); const S = V.path(ctx, [[-CAB.dw, 0, -.4], [CAB.dw, 0, -.4], [CAB.dw, CAB.dh, -.4], [-CAB.dw, CAB.dh, -.4]]); ctx.clip();
    ctx.globalAlpha = .38; ctx.filter = 'blur(2.5px) saturate(.4)'; ctx.translate(q[0], q[1]); ctx.scale(-1, 1); ctx.translate(-q[0], -q[1]);
    headCU(ctx, pose(CAND, { face: .25, e: { ...X.hollow, pup: .14, mO: .25 } }), q[0], q[1], CAND.R * s * 1.05, null, { flat: true }); ctx.restore();
  }
  paint([{ d: V.depth(cX, cZ), fn: () => V.ch(ctx, CAND, idle(cp, t, 0, .1), cX, cZ, L) }, { d: V.depth(sX, sZ), fn: () => V.ch(ctx, SECOND, sp, sX, sZ, L) }]);
  if (t < m.shut) { const sh = Math.sin(t * 70) * 6 * clamp(1 - (t - m.lunge) * 1.5); ctx.save(); ctx.translate(sh, 0); ctx.restore(); }
  horrorGrade(ctx, 1);
  const flashHit = Math.exp(-Math.max(0, t - m.shut) * 14) * (t > m.shut ? 1 : 0); if (flashHit > .02) wash(ctx, W, H, '#FFFFFF', flashHit * .35, 'screen');
  finish(ctx, { vig: .72, bl: .14, inner: .28 }); captions(ctx, t, 1640);
}
