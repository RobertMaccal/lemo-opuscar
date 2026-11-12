// Sets: every environment of the film, drawn flat-shaded in code. All take (g, t) and animate subtly with t.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, quad, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, cloud, foliage, tree, rnd } from './kit.js';

// ---------- shared furniture ----------
const bil = (q, u, v) => { const [a, b, c, d] = q, tx = lerp(a[0], b[0], u), ty = lerp(a[1], b[1], u), bx = lerp(d[0], c[0], u), by = lerp(d[1], c[1], u); return [lerp(tx, bx, v), lerp(ty, by, v)]; };
// window light falling on a surface: quad q = [tl, tr, br, bl], split in panes, optional leaf dapple that sways
export function sunQuad(g, t, q, { cols = 2, rows = 3, gap = .05, col = P.sun, a = .5, op = 'screen', leaves = 0, seed = 1, blur = 0 } = {}) {
  const panes = c => { c.fillStyle = col; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const u0 = i / cols + gap / 2, u1 = (i + 1) / cols - gap / 2, v0 = j / rows + gap / 3, v1 = (j + 1) / rows - gap / 3; poly(c, [bil(q, u0, v0), bil(q, u1, v0), bil(q, u1, v1), bil(q, u0, v1)]); c.fill(); } };
  g.save(); g.globalCompositeOperation = op; g.globalAlpha = a; if (blur) g.filter = `blur(${blur}px)`;
  if (!leaves) { panes(g); g.restore(); return; }
  const xs = q.map(p => p[0]), ys = q.map(p => p[1]), x0 = Math.min(...xs) - 10, y0 = Math.min(...ys) - 10, w = Math.max(...xs) - x0 + 10, h = Math.max(...ys) - y0 + 10;
  const c = tmp('sunq', w, h); c.translate(-x0, -y0); panes(c); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .8;
  const r = rnd(seed * 71 + 3);
  for (let i = 0; i < leaves; i++) { const u = r(), v = r() * r() * .5, s = 14 + r() * 26, ph = r() * TAU, p = bil(q, u, v); ell(c, p[0] + Math.sin(t * .8 + ph) * 9, p[1] + Math.cos(t * .6 + ph) * 5, s, s * .6, '#000', ph); }
  g.drawImage(c.canvas, x0, y0); g.restore();
}
export function clock(g, x, y, r, hh, mm, ss = null) {
  circ(g, x + 5, y + 7, r + 9, rgba(P.plum, .22)); circ(g, x, y, r + 10, P.woodDark); circ(g, x, y, r + 5, P.wood); circ(g, x, y, r, P.paper);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(g, x + Math.sin(a) * r * .78, y - Math.cos(a) * r * .78, x + Math.sin(a) * r * .92, y - Math.cos(a) * r * .92, P.ink, i % 3 ? r * .035 : r * .07, 'butt'); }
  const ah = (hh % 12 + mm / 60) / 12 * TAU, am = mm / 60 * TAU;
  line(g, x, y, x + Math.sin(ah) * r * .5, y - Math.cos(ah) * r * .5, P.ink, r * .1); line(g, x, y, x + Math.sin(am) * r * .76, y - Math.cos(am) * r * .76, P.ink, r * .07);
  if (ss !== null) { const as = ss / 60 * TAU; line(g, x - Math.sin(as) * r * .16, y + Math.cos(as) * r * .16, x + Math.sin(as) * r * .82, y - Math.cos(as) * r * .82, P.rust, r * .035); }
  circ(g, x, y, r * .09, P.rust);
}
export function pendant(g, x, y, len, s = 1, on = .8) {
  line(g, x, y, x, y + len, P.inkSoft, 4 * s, 'butt');
  poly(g, [[x - 20 * s, y + len], [x + 20 * s, y + len], [x + 62 * s, y + len + 46 * s], [x - 62 * s, y + len + 46 * s]]); g.fillStyle = P.tealDeep; g.fill();
  ell(g, x, y + len + 47 * s, 62 * s, 9 * s, P.gold);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = on * .5; g.fillStyle = rg(g, x, y + len + 60 * s, 5, 230 * s, ['#FFE9B0', 'rgba(0,0,0,0)']); g.fillRect(x - 240 * s, y + len - 170 * s, 480 * s, 480 * s); g.restore();
}
// a window: sky, foliage outside, mullions, frame
export function win(g, x, y, w, h, t, { arch = 0, cols = 2, rows = 3, sky = ['#BFE2DC', '#F7E9C6', '#FFDCA0'], frame = P.woodDark, seed = 1, leaves = true, fw = 9, sill = true, far = null } = {}) {
  const path = () => { g.beginPath(); if (arch) { g.moveTo(x, y + h); g.lineTo(x, y + arch); g.ellipse(x + w / 2, y + arch, w / 2, arch, 0, Math.PI, TAU); g.lineTo(x + w, y + h); g.closePath(); } else g.rect(x, y, w, h); };
  g.save(); path(); g.fillStyle = lg(g, 0, y, 0, y + h, sky); g.fill(); g.clip();
  if (far) far(g);
  if (leaves) { foliage(g, x + w * .05, y + h * .42, w * .5, [P.tealDeep, P.teal, '#8FBF9F'], t, seed); foliage(g, x + w * 1.0, y + h * .78, w * .42, [P.tealDeep, P.teal], t, seed + 4); }
  g.strokeStyle = frame; g.lineWidth = fw; g.beginPath();
  for (let i = 1; i < cols; i++) { g.moveTo(x + w * i / cols, y); g.lineTo(x + w * i / cols, y + h); } for (let j = 1; j < rows; j++) { g.moveTo(x, y + arch + (h - arch) * j / rows - (arch ? (h - arch) / rows * .0 : 0)); g.lineTo(x + w, y + arch + (h - arch) * j / rows); }
  if (arch) { g.moveTo(x, y + arch); g.lineTo(x + w, y + arch); }
  g.stroke(); g.restore();
  path(); g.strokeStyle = frame; g.lineWidth = fw * 1.7; g.lineJoin = 'miter'; g.stroke();
  if (sill) { fillR(g, x - fw * 2.2, y + h, w + fw * 4.4, fw * 2, frame); fillR(g, x - fw * 2.2, y + h, w + fw * 4.4, fw * .6, lite(frame, .3)); }
}
export function locker(g, x, y, w, h, i = 0, col = P.tealDeep) {
  const c0 = i % 2 ? col : mix(col, P.teal, .28);
  fillR(g, x, y, w, h, c0); g.strokeStyle = dark(col, .35); g.lineWidth = 4; g.strokeRect(x + 2, y + 2, w - 4, h - 4);
  fillRR(g, x + w * .14, y + h * .05, w * .72, h * .4, 5, mix(c0, P.tealLight, .16)); fillRR(g, x + w * .14, y + h * .52, w * .72, h * .43, 5, mix(c0, P.tealLight, .1));
  for (let k = 0; k < 4; k++) fillRR(g, x + w * .26, y + h * .09 + k * h * .028, w * .48, h * .012, 2, dark(col, .4));
  fillRR(g, x + w * .74, y + h * .47, w * .1, h * .05, 3, P.gold); fillRR(g, x + w * .3, y + h * .23, w * .4, h * .045, 3, P.cream);
}
export function noticeboard(g, x, y, w, h, seed = 2, t = 0) {
  fillRR(g, x + 8, y + 10, w, h, 6, rgba(P.plum, .2)); fillRR(g, x, y, w, h, 8, P.woodDark); fillR(g, x + 12, y + 12, w - 24, h - 24, P.cork);
  const r = rnd(seed), cols = [P.paper, P.lavLight, P.mint, P.gold, P.paper, P.rose, P.paper];
  for (let i = 0; i < 9; i++) {
    const pw = w * (.16 + r() * .12), ph = pw * (1.05 + r() * .4), px = x + 20 + r() * (w - 40 - pw), py = y + 20 + r() * (h - 40 - ph), a = (r() - .5) * .22;
    g.save(); g.translate(px + pw / 2, py + ph / 2); g.rotate(a + Math.sin(t * .7 + i) * .006); fillR(g, -pw / 2 + 3, -ph / 2 + 4, pw, ph, rgba(P.woodDark, .3)); fillR(g, -pw / 2, -ph / 2, pw, ph, cols[i % cols.length]);
    g.strokeStyle = rgba(P.lavDeep, .5); g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-pw * .34, -ph * .22 + k * ph * .14); g.lineTo(pw * (.34 - (k % 2) * .2), -ph * .22 + k * ph * .14); g.stroke(); }
    circ(g, 0, -ph / 2 + 7, 5, [P.rust, P.teal, P.amber][i % 3]); g.restore();
  }
}
// old wooden school desk seen from the front. (x, y) = floor under the front edge, s = scale
export function desk(g, x, y, s = 1, { paper = 0, filled = 0, pencil = false, dim = 0, wide = 1, front = true, depth = 38, stack = false } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const hw = 176 * wide, c = k => (dim ? mix(k, P.plum, dim) : k), bk = -148 - depth, ins = 16 * depth / 38;
  for (const sx of [-1, 1]) { fillR(g, sx * (hw - 16) - 9, -150, 18, 150, c(P.woodDark)); fillR(g, sx * (hw - 40) - 6, -150, 12, 130, c(dark(P.woodDark, .2))); }
  if (front) { fillR(g, -hw + 12, -148, hw * 2 - 24, 86, c(P.wood)); fillR(g, -hw + 12, -148, hw * 2 - 24, 14, c(dark(P.wood, .18))); line(g, -hw + 30, -100, hw - 30, -100, c(dark(P.wood, .12)), 3, 'butt'); }
  poly(g, [[-hw, -148], [hw, -148], [hw - ins, bk], [-hw + ins, bk]]); g.fillStyle = c(P.woodLight); g.fill();
  fillR(g, -hw, -148, hw * 2, 12, c(dark(P.wood, .1)));
  line(g, -hw * .5, bk + 6, hw * .5, bk + 6, c(dark(P.woodLight, .16)), 4); ell(g, hw - ins - 28, bk + 10, 11, 5, c(P.woodDark));
  const sheet = (px, w0, w1, n, a) => {
    poly(g, [[px - w0, -152], [px + w0, -152], [px + w1, bk + 4], [px - w1, bk + 4]]); g.fillStyle = c(P.paper); g.fill();
    g.strokeStyle = rgba(P.lavDeep, a); g.lineWidth = 2;
    for (let k = 0; k < n; k++) { const v = (k + 1) / (n + 1), yy = bk + 4 + (-156 - bk) * v, w = lerp(w1, w0, v); g.beginPath(); g.moveTo(px - w + 8, yy); g.lineTo(px + (filled ? w - 8 - (k * 7 % 11) : w * (.3 - k * .2)), yy); g.stroke(); }
  };
  if (stack) { for (let k = 3; k >= 0; k--) { g.save(); g.translate(-hw * .56 + k * 3, -k * 3.5); sheet(0, 46, 40, 0, .5); g.strokeStyle = rgba(P.lavDeep, .5); g.lineWidth = 1.5; g.beginPath(); g.moveTo(-46, -152); g.lineTo(46, -152); g.stroke(); g.restore(); } g.save(); g.translate(-hw * .56 + 12, -14); sheet(0, 46, 40, Math.round(depth / 5), .75); g.restore(); }
  if (paper) sheet(0, 62 + (depth - 38) * .4, 54 + (depth - 38) * .3, filled ? Math.round(depth / 4.2) : 3, filled ? .75 : .3);
  if (pencil) line(g, 80, -160, 118, -172, P.orange, 6);
  g.restore();
}
export function chairBack(g, x, y, s = 1, dim = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); const c = k => (dim ? mix(k, P.plum, dim) : k);
  for (const sx of [-1, 1]) fillR(g, sx * 62 - 6, -300, 12, 300, c(P.woodDark)); fillRR(g, -70, -300, 140, 46, 10, c(P.wood)); fillRR(g, -70, -236, 140, 22, 8, c(P.wood)); g.restore();
}

// ---------- 1. hallway, flat wall view (dialogue) ----------
// world: floor line y = 1400; wall runs x −300…1500
export function hallFlat(g, t, { hh = 8, mm = 55, door = 0, dusk = 0 } = {}) {
  const FL = 1400, X0 = -400, X1 = 1600;
  g.fillStyle = lg(g, 0, -200, 0, 1000, ['#EED6AA', '#F6E4BE', '#F8E8C6']); g.fillRect(X0, -300, X1 - X0, 1310);
  fillR(g, X0, 250, X1 - X0, 10, rgba(P.woodDark, .35));
  g.fillStyle = lg(g, 0, 1000, 0, FL, [mix(P.teal, P.tealLight, .18), P.teal]); g.fillRect(X0, 1000, X1 - X0, 400);
  for (let x = X0; x < X1; x += 150) fillR(g, x, 1034, 3, 320, rgba(P.tealDeep, .35));
  fillR(g, X0, 992, X1 - X0, 26, P.wood); fillR(g, X0, 992, X1 - X0, 7, P.woodLight); fillR(g, X0, 1360, X1 - X0, 40, P.tealDark);
  // floor
  g.fillStyle = lg(g, 0, FL, 0, 1920, ['#D7A777', '#C9935F', '#B67D4F']); g.fillRect(X0, FL, X1 - X0, 700);
  g.strokeStyle = rgba(P.woodDark, .22); g.lineWidth = 3;
  for (let k = 0; k < 9; k++) { const yy = FL + 14 + k * k * 9 + k * 22; g.beginPath(); g.moveTo(X0, yy); g.lineTo(X1, yy); g.stroke(); }
  for (let k = -14; k <= 14; k++) { g.beginPath(); g.moveTo(540 + k * 120, FL); g.lineTo(540 + k * 330, 2000); g.stroke(); }
  g.fillStyle = lg(g, 0, FL, 0, FL + 190, [rgba('#FFF1CF', .28), rgba('#FFF1CF', 0)]); g.fillRect(X0, FL, X1 - X0, 190);
  // lockers (left) with a visible end panel
  for (let i = 0; i < 5; i++) locker(g, -150 + i * 104, 610, 104, 750, i);
  fillR(g, -150, 590, 520, 22, P.tealDark); fillR(g, 370, 590, 30, 770, dark(P.tealDeep, .3)); fillR(g, 370, 590, 6, 770, rgba(P.night, .25));
  // door to the exam hall
  const dx = 640, dw = 290, dy = 470;
  fillR(g, dx - 22, dy - 22, dw + 44, FL - dy + 22, P.woodDark); fillR(g, dx, dy, dw, FL - dy, dark(P.wood, .1));
  g.save(); g.translate(dx, 0); const dsc = 1 - door * .82; g.scale(dsc, 1);
  if (door > .02) { fillR(g, 0, dy, dw / dsc, FL - dy, P.night); g.fillStyle = lg(g, 0, 0, dw, 0, [rgba(P.sun, .55), rgba(P.sun, .1)]); g.fillRect(dw, dy, dw / dsc - dw, FL - dy); }
  fillR(g, 0, dy, dw, FL - dy, P.wood); fillRR(g, 28, dy + 30, dw - 56, 300, 8, dark(P.wood, .14));
  g.fillStyle = lg(g, 0, dy + 44, 0, dy + 316, ['#E7E0EE', '#F6ECD2']); rr(g, 42, dy + 44, dw - 84, 272, 5); g.fill(); line(g, dw / 2, dy + 44, dw / 2, dy + 316, dark(P.wood, .14), 8, 'butt'); line(g, 42, dy + 180, dw - 42, dy + 180, dark(P.wood, .14), 8, 'butt');
  fillRR(g, 28, dy + 380, dw - 56, 200, 8, dark(P.wood, .12)); fillRR(g, 28, dy + 620, dw - 56, 270, 8, dark(P.wood, .12));
  circ(g, dw - 40, dy + 520, 15, P.gold); circ(g, dw - 40, dy + 520, 15, rgba(P.woodDark, .15));
  g.save(); g.translate(dw / 2, dy + 440); g.rotate(-.035); fillR(g, -86, -44, 172, 96, P.paper); text(g, 'QUIET', 0, -14, { size: 34, col: P.rust }); text(g, 'exam in progress', 0, 26, { size: 25, font: F.hand, col: P.ink }); fillR(g, -22, -54, 44, 16, rgba(P.gold, .85)); g.restore();
  g.restore();
  fillRR(g, dx - 4, dy - 108, dw + 8, 68, 8, P.indigo); text(g, 'EXAMINATION HALL', dx + dw / 2, dy - 72, { size: 28, col: P.cream, ls: 2 });
  // clock, noticeboard, bench, lamps
  clock(g, 505, 400, 62, hh, mm, (t * 1) % 60);
  noticeboard(g, 1000, 520, 360, 330, 5, t);
  fillR(g, 1010, 1250, 340, 26, P.wood); fillR(g, 1010, 1250, 340, 8, P.woodLight); for (const bx of [1030, 1310]) fillR(g, bx, 1276, 18, 124, P.woodDark);
  fillRR(g, -230, 380, 150, 110, 6, P.indigo); text(g, 'ROOM', -155, 415, { size: 26, col: P.cream }); text(g, '2B', -155, 455, { size: 40, col: P.sun });
  pendant(g, 160, -300, 330, 1, 1 - dusk); pendant(g, 860, -300, 330, 1, 1 - dusk);
  // sunlight through off-screen windows on the left: patches across wall and floor
  const sc = dusk ? P.orange : '#FFE2A0';
  const so = { cols: 2, rows: 4, col: sc, op: 'overlay', blur: 1.5 };
  sunQuad(g, t, [[-60, 150], [330, 150], [600, 1400], [210, 1400]], { ...so, a: .62, leaves: 34, seed: 3 });
  sunQuad(g, t, [[560, 150], [950, 150], [1220, 1400], [830, 1400]], { ...so, a: .55, leaves: 28, seed: 8 });
  sunQuad(g, t, [[210, 1400], [600, 1400], [820, 1960], [330, 1960]], { cols: 2, rows: 2, col: '#FFE9B8', a: .34, gap: .06 });
  sunQuad(g, t, [[830, 1400], [1220, 1400], [1500, 1960], [1010, 1960]], { cols: 2, rows: 2, col: '#FFE9B8', a: .28, gap: .06 });
}

// ---------- 2. corridor in one-point perspective (establishing + the post-exam spiral) ----------
export function corridor(g, t, o = {}) {
  const { vx = 540, vy = 880, f = 900, Wc = 160, Hc = 330, eye = 150, zn = 120, zf = 2300, W = 1080, H = 1920, haze = '#F7DDAE', stretch = 1, mood = 0 } = o;
  const pr = (X, Y, Z) => [vx + f * X / Z, vy + f * Y / Z], fl = eye, ce = eye - Hc;
  const fog = (col, Z) => mix(col, haze, clamp((Z - 300) / (zf * .9)) * .82);
  const wq = (side, z0, z1, h0, h1, col) => quad(g, pr(side * Wc, fl - h0, z0), pr(side * Wc, fl - h0, z1), pr(side * Wc, fl - h1, z1), pr(side * Wc, fl - h1, z0), col);
  // ceiling, floor, end
  g.fillStyle = lg(g, 0, 0, 0, vy, [mix('#EBD9BE', P.lav, .12 + mood * .3), '#F4E3C2']); poly(g, [pr(-Wc, ce, zn), pr(Wc, ce, zn), pr(Wc, ce, zf), pr(-Wc, ce, zf)]); g.fill();
  g.fillStyle = lg(g, 0, vy, 0, H, ['#E9C08E', '#CF9C68', '#B88152']); poly(g, [pr(-Wc, fl, zn), pr(Wc, fl, zn), pr(Wc, fl, zf), pr(-Wc, fl, zf)]); g.fill();
  // floor tiles
  g.strokeStyle = rgba(P.woodDark, .2); g.lineWidth = 2.5;
  for (let z = 160; z < zf; z *= 1.16) { const a = pr(-Wc, fl, z), b = pr(Wc, fl, z); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  for (let k = -3; k <= 3; k++) { const a = pr(k * Wc / 4, fl, zn), b = pr(k * Wc / 4, fl, zf); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  // walls: left (lockers side) and right (window side)
  for (const side of [-1, 1]) {
    const steps = 22;
    for (let i = 0; i < steps; i++) {
      const z0 = zn * Math.pow(zf / zn, i / steps), z1 = zn * Math.pow(zf / zn, (i + 1) / steps), zm = (z0 + z1) / 2;
      wq(side, z0, z1, 100, Hc, fog(side < 0 ? '#F1DDB6' : '#F6E4BE', zm)); wq(side, z0, z1, 0, 100, fog(P.teal, zm)); wq(side, z0, z1, 96, 106, fog(P.wood, zm)); wq(side, z0, z1, 0, 9, fog(P.tealDark, zm));
    }
  }
  // end wall with glowing double doors
  const e0 = pr(-Wc, ce, zf), e1 = pr(Wc, fl, zf); g.fillStyle = '#F3DDB2'; g.fillRect(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1]);
  const d0 = pr(-70, fl - 215, zf), d1 = pr(70, fl, zf); g.fillStyle = lg(g, 0, d0[1], 0, d1[1], ['#FFF6D8', '#FFD98F']); g.fillRect(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1]);
  g.strokeStyle = P.woodDark; g.lineWidth = Math.max(1.5, 5 * f / zf); g.strokeRect(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1]); line(g, (d0[0] + d1[0]) / 2, d0[1], (d0[0] + d1[0]) / 2, d1[1], P.woodDark, Math.max(1.5, 4 * f / zf), 'butt');
  // lockers along the left wall
  const lw = 52 * stretch;
  for (let z = zf - 260; z > zn; z -= lw) {
    if (z > 1050 * stretch && z < 1190 * stretch) continue;
    const i = Math.round(z / lw), c0 = fog(i % 2 ? P.tealDeep : mix(P.tealDeep, P.teal, .3), z), q = [pr(-Wc, fl - 196, z + lw), pr(-Wc, fl - 196, z), pr(-Wc, fl - 6, z), pr(-Wc, fl - 6, z + lw)];
    poly(g, q); g.fillStyle = c0; g.fill(); g.strokeStyle = fog(dark(P.tealDeep, .35), z); g.lineWidth = Math.max(1, 3.5 * f / z / 3); g.stroke();
    quad(g, bil(q, .2, .07), bil(q, .8, .07), bil(q, .8, .44), bil(q, .2, .44), fog(mix(c0, P.tealLight, .16), z));
    quad(g, bil(q, .2, .52), bil(q, .8, .52), bil(q, .8, .94), bil(q, .2, .94), fog(mix(c0, P.tealLight, .1), z));
    quad(g, bil(q, .12, .46), bil(q, .22, .46), bil(q, .22, .52), bil(q, .12, .52), fog(P.gold, z));
  }
  wq(-1, zn, zf - 260, 196, 206, fog(P.tealDark, 600));
  // a classroom door on the left
  { const z0 = 1060 * stretch, z1 = 1180 * stretch; wq(-1, z0, z1, 0, 225, fog(P.woodDark, z0)); wq(-1, z0 + 8, z1 - 8, 0, 217, fog(P.wood, z0)); wq(-1, z0 + 28, z1 - 28, 120, 196, fog('#F3E6C8', z0)); }
  // windows on the right wall + their light on the floor and in the air
  const k = .78, kz = .55, ws = 330 * stretch, wl = 190 * stretch;
  for (let z = zn + 60 + ((zf - zn) % ws); z < zf - 200; z += ws) {
    const z0 = z, z1 = z + wl, hb = 112, ht = Hc - 36;
    wq(1, z0 - 10, z1 + 10, hb - 10, ht + 10, fog(P.woodDark, z0));
    const q = [pr(Wc, fl - ht, z1), pr(Wc, fl - ht, z0), pr(Wc, fl - hb, z0), pr(Wc, fl - hb, z1)];
    poly(g, q); g.fillStyle = lg(g, 0, q[0][1], 0, q[2][1], ['#FFF8E0', '#FFE6AE', '#FFD08A']); g.fill();
    g.strokeStyle = fog(P.woodDark, z0); g.lineWidth = Math.max(1, 5 * f / z0 / 3.5);
    for (const u of [.5]) { const a = bil(q, u, 0), b = bil(q, u, 1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (const v of [.33, .66]) { const a = bil(q, 0, v), b = bil(q, 1, v); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    const fp = (u, h) => pr(Wc - h * k, fl, lerp(z0, z1, u) - h * kz), fq = [fp(1, ht), fp(0, ht), fp(0, hb), fp(1, hb)];
    const near = clamp(1.3 - z0 / (zf * .8));
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .5 * near + .12;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { poly(g, [bil(fq, i / 2 + .03, j / 3 + .03), bil(fq, (i + 1) / 2 - .03, j / 3 + .03), bil(fq, (i + 1) / 2 - .03, (j + 1) / 3 - .03), bil(fq, i / 2 + .03, (j + 1) / 3 - .03)]); g.fillStyle = '#FFDD9A'; g.fill(); }
    g.restore();
    shaft(g, [q[0], q[1], fq[1], fq[2], fq[3], q[3]], '#FFE2A6', .13 * near + .03, 16);
  }
  // pendant lamps
  for (let z = zf - 300; z > zn + 100; z -= 420 * stretch) { const a = pr(0, ce, z), s = f / z * .55; pendant(g, a[0], a[1], 60 * s * 2, s * 1.2, .7); }
  return { pr, s: (Z) => f / Z * .345, fl };
}

// ---------- 3. classroom, front-on (exam room / anatomy class) ----------
// camera faces the back wall; floor meets wall at y = 960; desks are placed by the shot
export function room(g, t, { mode = 'exam', hh = 9, mm = 12, dim = 0 } = {}) {
  const X0 = -300, X1 = 1380, WL = 960, exam = mode === 'exam';
  g.fillStyle = lg(g, 0, -100, 0, WL, exam ? ['#E6D2AE', '#F2E0BC'] : ['#F1D5A4', '#F7E2B6']); g.fillRect(X0, -300, X1 - X0, WL + 300);
  g.fillStyle = lg(g, 0, 800, 0, WL, [mix(P.teal, P.tealLight, .12), P.teal]); g.fillRect(X0, 800, X1 - X0, 160); fillR(g, X0, 792, X1 - X0, 22, P.wood); fillR(g, X0, 792, X1 - X0, 6, P.woodLight); fillR(g, X0, 930, X1 - X0, 30, P.tealDark);
  // floor planks to a vanishing point
  g.fillStyle = lg(g, 0, WL, 0, 1920, exam ? ['#D9B284', '#C4905E', '#A9744A'] : ['#E0B27E', '#CC935C', '#B37A48']); g.fillRect(X0, WL, X1 - X0, 1100);
  g.strokeStyle = rgba(P.woodDark, .28); g.lineWidth = 3; for (let k = -16; k <= 16; k++) { g.beginPath(); g.moveTo(540 + k * 70, WL); g.lineTo(540 + k * 250, 2000); g.stroke(); }
  for (let k = 0; k < 7; k++) { const yy = WL + 30 + k * k * 22 + k * 30; g.beginPath(); g.moveTo(X0, yy); g.lineTo(X1, yy); g.stroke(); }
  const far = c => { fillR(c, -300, 610, 1700, 200, '#C9D8C2'); for (let i = 0; i < 8; i++) fillR(c, -200 + i * 220, 560 - (i % 3) * 30, 150, 260, mix('#D9C7B0', P.lavLight, .3)); };
  if (exam) {
    win(g, 60, 170, 380, 620, t, { arch: 120, cols: 3, rows: 3, seed: 2, far, sky: ['#CFE6DE', '#F4EBCB', '#FFE2A8'] });
    win(g, 640, 170, 380, 620, t, { arch: 120, cols: 3, rows: 3, seed: 6, far, sky: ['#CFE6DE', '#F4EBCB', '#FFE2A8'] });
    clock(g, 540, 250, 78, hh, mm, (t * 1) % 60);
    fillRR(g, 468, 392, 144, 60, 8, P.indigo); text(g, 'SILENCE', 540, 424, { size: 30, col: P.cream, ls: 2 });
    fillRR(g, 482, 500, 116, 150, 4, P.paper); text(g, 'EXAM', 540, 536, { size: 28, col: P.rust }); for (let k = 0; k < 5; k++) line(g, 498, 566 + k * 16, 582 - (k % 2) * 20, 566 + k * 16, rgba(P.lavDeep, .6), 3);
    for (const rx of [70, 650]) { fillRR(g, rx, 846, 360, 100, 8, '#D8CDBE'); for (let k = 0; k < 12; k++) fillR(g, rx + 12 + k * 29, 852, 6, 88, rgba(P.lavDeep, .35)); }
  } else {
    // anatomy classroom: one window on the right, charts and shelves on the left
    win(g, 700, 190, 340, 600, t, { cols: 2, rows: 3, seed: 3, far, sky: ['#F2E2BE', '#FFD998', '#FFC27A'] });
    fillRR(g, 96, 200, 250, 430, 6, P.woodDark); fillR(g, 108, 212, 226, 406, P.paper); skeleton(g, 221, 250, 1.0, P.inkSoft);
    text(g, 'THE HUMAN SKELETON', 221, 596, { size: 17, font: F.ui, weight: '600', col: P.ink, ls: 1 });
    fillRR(g, 400, 200, 240, 300, 6, P.woodDark); fillR(g, 410, 210, 220, 280, '#F3E7CE'); armChart(g, 486, 240, 1); text(g, 'UPPER ARM', 520, 468, { size: 17, font: F.ui, weight: '600', col: P.ink, ls: 1 });
    clock(g, 520, 610, 56, hh, mm, (t * 1) % 60);
    fillR(g, 80, 700, 300, 14, P.woodDark); for (let k = 0; k < 9; k++) fillR(g, 92 + k * 30, 640 + (k % 3) * 8, 24, 60 - (k % 3) * 8, [P.rust, P.tealDeep, P.lavDeep, P.amber, P.plum][k % 5]);
  }
  return { WL };
}
export function skeleton(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round';
  circ(g, 0, 26, 26, col); circ(g, -9, 24, 6, P.paper); circ(g, 9, 24, 6, P.paper); fillR(g, -8, 40, 16, 4, P.paper);
  g.lineWidth = 6; g.beginPath(); g.moveTo(0, 54); g.lineTo(0, 190); g.stroke();
  g.lineWidth = 4; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(0, 86 + k * 16, 34 - k * 2, 9, 0, 0, TAU); g.stroke(); }
  g.lineWidth = 5; g.beginPath(); g.moveTo(-40, 70); g.lineTo(40, 70); g.moveTo(-40, 70); g.lineTo(-54, 150); g.lineTo(-50, 220); g.moveTo(40, 70); g.lineTo(54, 150); g.lineTo(50, 220);
  g.moveTo(-26, 196); g.lineTo(26, 196); g.moveTo(-20, 196); g.lineTo(-24, 270); g.lineTo(-22, 330); g.moveTo(20, 196); g.lineTo(24, 270); g.lineTo(22, 330); g.stroke(); g.restore();
}
function armChart(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
  line(g, -30, 20, 20, 170, P.inkSoft, 13); circ(g, -32, 16, 13, P.inkSoft); circ(g, 22, 174, 11, P.inkSoft);
  g.strokeStyle = P.rust; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 90); g.lineTo(60, 70); g.stroke(); text(g, 'humerus', 62, 60, { size: 24, font: F.hand, col: P.rust, align: 'left' }); g.restore();
}

// ---------- 4. chalkboard wall (teacher's side of the anatomy class) ----------
export function boardWall(g, t) {
  const X0 = -300, X1 = 1380;
  g.fillStyle = lg(g, 0, 0, 0, 1100, ['#F1D5A4', '#F7E2B6']); g.fillRect(X0, -300, X1 - X0, 1500);
  fillR(g, X0, 1100, X1 - X0, 300, P.teal); fillR(g, X0, 1090, X1 - X0, 22, P.wood); fillR(g, X0, 1370, X1 - X0, 30, P.tealDark);
  g.fillStyle = lg(g, 0, 1400, 0, 1920, ['#E0B27E', '#B37A48']); g.fillRect(X0, 1400, X1 - X0, 600);
  fillRR(g, 60, 330, 960, 640, 10, P.woodDark); g.fillStyle = lg(g, 0, 350, 0, 950, ['#3F6E66', '#335C58']); g.fillRect(82, 352, 916, 596);
  g.save(); g.globalAlpha = .12; for (let k = 0; k < 7; k++) ell(g, 200 + k * 120, 520 + (k % 3) * 120, 150, 40, '#FFFFFF', -.2); g.restore();
  text(g, 'Human Anatomy', 300, 420, { size: 62, font: F.script, weight: '700', col: '#F4EEDC' }); line(g, 120, 458, 480, 458, '#F4EEDC', 4);
  skeleton(g, 760, 400, 1.45, '#F4EEDC');
  text(g, 'hyoid?', 280, 600, { size: 54, font: F.script, weight: '700', col: P.gold, rot: -.06 }); text(g, '206 bones', 290, 720, { size: 50, font: F.script, weight: '700', col: '#F4EEDC', rot: .03 });
  fillR(g, 60, 970, 960, 20, P.wood); fillRR(g, 200, 956, 46, 14, 3, P.paper); fillRR(g, 270, 956, 30, 14, 3, P.rose); fillRR(g, 700, 950, 90, 22, 4, P.lavDeep);
  sunQuad(g, t, [[620, 150], [1040, 150], [1240, 1400], [820, 1400]], { cols: 2, rows: 4, col: '#FFD38C', a: .34, leaves: 10, seed: 4 });
}

// ---------- 5. athletics track ----------
export function track(g, t, { W = 1080 } = {}) {
  const X0 = -500, X1 = 1600;
  g.fillStyle = lg(g, 0, -100, 0, 1010, ['#8EC3C4', '#BFE0D6', '#F6EBC6', '#FFDDA2']); g.fillRect(X0, -300, X1 - X0, 1320);
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(g, 860, 420, 20, 620, [rgba('#FFF3C4', .9), rgba('#FFE09A', .35), 'rgba(0,0,0,0)']); g.fillRect(X0, -300, X1 - X0, 1400); g.restore();
  circ(g, 860, 420, 62, '#FFF6D6');
  cloud(g, 140 + (t * 6) % 60, 300, 1.5, '#FFF6E0', .9); cloud(g, 640 + (t * 4) % 60, 180, 1.1, '#FFF6E0', .7); cloud(g, -160 + (t * 5) % 60, 640, 1.2, '#FFEFD0', .75);
  // far: school building and trees
  fillR(g, 120, 800, 520, 190, '#E8CFA6'); fillR(g, 100, 786, 560, 20, P.rust); fillR(g, 340, 720, 90, 90, '#E8CFA6'); poly(g, [[330, 722], [385, 670], [440, 722]]); g.fillStyle = P.rust; g.fill(); circ(g, 385, 760, 20, P.paper);
  for (let i = 0; i < 9; i++) fillR(g, 150 + i * 54, 840, 30, 44, rgba(P.tealDeep, .55));
  for (let i = 0; i < 8; i++) tree(g, -260 + i * 250 + (i % 2) * 40, 1010, 150 + (i % 3) * 30, t, i + 2, [mix(P.tealDeep, '#F6EBC6', .25), mix(P.teal, '#F6EBC6', .25), mix('#8FBF9F', '#F6EBC6', .2)], mix(P.woodDark, '#F6EBC6', .3));
  // bleachers
  for (let k = 0; k < 5; k++) { fillR(g, 640 + k * 14, 900 + k * 22, 620 - k * 14, 22, mix(P.lav, P.cream, k % 2 ? .4 : .2)); fillR(g, 640 + k * 14, 918 + k * 22, 620 - k * 14, 5, rgba(P.plum, .25)); }
  // infield and track
  g.fillStyle = lg(g, 0, 1000, 0, 1190, ['#9CC49A', '#7FB08A']); g.fillRect(X0, 1000, X1 - X0, 200);
  g.fillStyle = lg(g, 0, 1180, 0, 1750, ['#E19A66', '#D5814E', '#C96F42']); g.fillRect(X0, 1180, X1 - X0, 580);
  const ly = [1180, 1262, 1368, 1502, 1668, 1760];
  ly.forEach((y, i) => fillR(g, X0, y - (2 + i), X1 - X0, 5 + i * 2, '#FBEFD2'));
  g.fillStyle = lg(g, 0, 1760, 0, 1920, ['#7FB08A', '#5F9577']); g.fillRect(X0, 1764, X1 - X0, 300);
  // texture specks
  const r = rnd(41); g.fillStyle = rgba('#FFE7C0', .25); for (let i = 0; i < 160; i++) g.fillRect(X0 + r() * (X1 - X0), 1190 + r() * 560, 5 + r() * 9, 2.5);
  // finish line (checker) and posts
  const fx = 800; for (let i = 0; i < 5; i++) { const y0 = ly[i], y1 = ly[i + 1], n = 2 + i; for (let k = 0; k < n; k++) for (let c = 0; c < 2; c++) fillR(g, fx + c * 16 + (y0 - 1180) * .08, y0 + (y1 - y0) * k / n, 16, (y1 - y0) / n, (k + c) % 2 ? P.ink : P.paper); }
  text(g, '1', 700, 1716, { size: 80, col: rgba('#FBEFD2', .85) }); text(g, '2', 708, 1588, { size: 64, col: rgba('#FBEFD2', .85) }); text(g, '3', 714, 1436, { size: 50, col: rgba('#FBEFD2', .85) });
  for (const [px, py, s] of [[812, 1180, .8], [930, 1764, 1.5]]) { fillR(g, px - 5 * s, py - 270 * s, 10 * s, 270 * s, P.cream); fillR(g, px - 5 * s, py - 270 * s, 10 * s, 40 * s, P.rust); }
  // bunting
  g.strokeStyle = P.inkSoft; g.lineWidth = 3; g.beginPath(); g.moveTo(-100, 640); g.quadraticCurveTo(300, 760, 700, 660); g.stroke();
  for (let i = 0; i < 12; i++) { const u = i / 11, x = lerp(-100, 700, u), y = (1 - u) * (1 - u) * 640 + 2 * u * (1 - u) * 760 + u * u * 660, sw = Math.sin(t * 2 + i) * 4; poly(g, [[x - 16, y], [x + 16, y], [x + sw, y + 38]]); g.fillStyle = [P.orange, P.cream, P.teal, P.lav][i % 4]; g.fill(); }
}

// ---------- 6. swimming pool, seen from the finish wall ----------
export function pool(g, t) {
  const X0 = -400, X1 = 1500, FAR = 700, NEAR = 1330;
  g.fillStyle = lg(g, 0, -100, 0, FAR, ['#7FBFC6', '#B9DFD8', '#F3ECCB']); g.fillRect(X0, -300, X1 - X0, FAR + 300);
  cloud(g, 80 + (t * 5) % 50, 210, 1.6, '#FFFAEA', .95); cloud(g, 700 + (t * 4) % 50, 330, 1.2, '#FFFAEA', .8); cloud(g, 520, 90, .9, '#FFFAEA', .6);
  for (let i = 0; i < 7; i++) tree(g, -200 + i * 260, FAR - 30, 170 + (i % 3) * 36, t, i + 11, [mix(P.tealDeep, '#DCEBD5', .2), mix(P.teal, '#DCEBD5', .2), '#9CC8A4'], mix(P.woodDark, '#DCEBD5', .3));
  fillR(g, X0, FAR - 120, X1 - X0, 90, '#EAD9B8'); for (let x = X0; x < X1; x += 46) fillR(g, x, FAR - 120, 5, 90, rgba(P.woodDark, .25)); fillR(g, X0, FAR - 128, X1 - X0, 12, P.teal);
  // bunting across the pool
  g.strokeStyle = P.inkSoft; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-50, FAR - 200); g.quadraticCurveTo(540, FAR - 110, 1130, FAR - 210); g.stroke();
  for (let i = 0; i < 17; i++) { const u = i / 16, x = lerp(-50, 1130, u), y = (1 - u) * (1 - u) * (FAR - 200) + 2 * u * (1 - u) * (FAR - 110) + u * u * (FAR - 210); poly(g, [[x - 13, y], [x + 13, y], [x + Math.sin(t * 2 + i) * 3, y + 32]]); g.fillStyle = [P.orange, P.paper, P.teal, P.rose][i % 4]; g.fill(); }
  // far deck with starting blocks
  fillR(g, X0, FAR - 34, X1 - X0, 40, '#EFE2C4'); for (let i = 0; i < 6; i++) { fillRR(g, 268 + i * 100, FAR - 60, 44, 28, 4, P.paper); text(g, String(i + 1), 290 + i * 100, FAR - 45, { size: 18, col: P.tealDeep }); }
  // water
  g.fillStyle = lg(g, 0, FAR, 0, NEAR, ['#9BD9D8', '#5DB7C4', '#3C97B6']); g.fillRect(X0, FAR, X1 - X0, NEAR - FAR);
  const vx = 540, vy = 470, px = (x, y) => vx + (x - vx) * (y - vy) / (NEAR - vy);
  g.save(); g.beginPath(); g.rect(X0, FAR, X1 - X0, NEAR - FAR); g.clip();
  // caustic ripples
  g.strokeStyle = rgba('#E9FBF4', .5); g.lineWidth = 3; g.lineCap = 'round';
  for (let j = 0; j < 15; j++) { const v = j / 15, y = FAR + (NEAR - FAR) * v * v + 8, sc = (y - vy) / (NEAR - vy); g.globalAlpha = .25 + v * .5; g.lineWidth = 1.5 + sc * 3;
    for (let i = -3; i < 16; i++) { const x0 = vx + ((i * 110 + (j % 2) * 55) - 660 + Math.sin(t * .9 + j) * 14) * sc; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + 28 * sc, y - 9 * sc * Math.cos(t * 1.4 + i + j), x0 + 62 * sc, y + Math.sin(t * 1.2 + i * 2 + j) * 3); g.stroke(); } }
  g.globalAlpha = 1;
  // lane ropes
  for (let i = 0; i <= 4; i++) { const xn = -110 + i * 325; g.strokeStyle = rgba(P.night, .18); g.lineWidth = 9; g.beginPath(); g.moveTo(px(xn, FAR), FAR + 6); g.lineTo(xn + 8, NEAR + 6); g.stroke();
    for (let k = 0; k < 34; k++) { const v0 = k / 34, v1 = (k + .8) / 34, y0 = FAR + (NEAR - FAR) * v0 * v0, y1 = FAR + (NEAR - FAR) * v1 * v1, w = 2.5 + 9 * (y0 - vy) / (NEAR - vy); line(g, px(xn, y0), y0 + Math.sin(t * 2 + k * .7 + i) * 1.2, px(xn, y1), y1 + Math.sin(t * 2 + k * .7 + i) * 1.2, k % 3 ? P.cream : P.orange, w, 'round'); } }
  g.restore();
  // near wall: tiles + deck
  fillR(g, X0, NEAR - 6, X1 - X0, 60, '#F3E7CB'); for (let x = X0; x < X1; x += 60) fillR(g, x, NEAR - 6, 3, 60, rgba(P.tealDeep, .3)); fillR(g, X0, NEAR + 16, X1 - X0, 12, P.teal); fillR(g, X0, NEAR - 10, X1 - X0, 8, '#FFF8E6');
  g.fillStyle = lg(g, 0, NEAR + 54, 0, 1920, ['#EAD7B0', '#DCC197', '#CDAE83']); g.fillRect(X0, NEAR + 54, X1 - X0, 700);
  g.strokeStyle = rgba(P.woodDark, .16); g.lineWidth = 3; for (let k = -10; k <= 10; k++) { g.beginPath(); g.moveTo(540 + k * 190, NEAR + 54); g.lineTo(540 + k * 300, 2000); g.stroke(); } for (const yy of [1500, 1680]) { g.beginPath(); g.moveTo(X0, yy); g.lineTo(X1, yy); g.stroke(); }
  // wet patches
  g.fillStyle = rgba('#8CC9CF', .28); ell(g, 500, 1450, 190, 26, rgba('#8CC9CF', .3)); ell(g, 700, 1520, 90, 14, rgba('#8CC9CF', .25));
  text(g, '4', 540, NEAR + 23, { size: 24, col: P.tealDeep });
  return { NEAR, FAR };
}
export function splash(g, x, y, s, t, n = 9) {
  g.fillStyle = '#F2FFFB'; g.strokeStyle = '#F2FFFB'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const a = -Math.PI * (.12 + .76 * i / (n - 1)), d = (46 + ((i * 37) % 30)) * s, w = (5 + (i * 13) % 7) * s; g.lineWidth = w; g.beginPath(); g.moveTo(x + Math.cos(a) * d * .45, y + Math.sin(a) * d * .3); g.quadraticCurveTo(x + Math.cos(a) * d * .9, y + Math.sin(a) * d * 1.1, x + Math.cos(a) * d * 1.15, y + Math.sin(a) * d * .85); g.stroke(); circ(g, x + Math.cos(a) * d * 1.3, y + Math.sin(a) * d * 1.2 - (i % 3) * 8 * s, w * .7, '#F2FFFB'); }
  ell(g, x, y + 4 * s, 80 * s, 12 * s, rgba('#F2FFFB', .7));
}

// ---------- 7. club room wall with a results board ----------
export function clubWall(g, t) {
  const X0 = -300, X1 = 1380, FL = 1500;
  g.fillStyle = lg(g, 0, -100, 0, 1100, ['#EDD3A6', '#F6E2B8']); g.fillRect(X0, -300, X1 - X0, 1400);
  g.fillStyle = lg(g, 0, 1100, 0, FL, [mix(P.lav, P.cream, .25), P.lav]); g.fillRect(X0, 1100, X1 - X0, 400); fillR(g, X0, 1090, X1 - X0, 24, P.wood); fillR(g, X0, 1090, X1 - X0, 7, P.woodLight); fillR(g, X0, FL - 36, X1 - X0, 36, P.lavDeep);
  g.fillStyle = lg(g, 0, FL, 0, 1920, ['#D7A777', '#B67D4F']); g.fillRect(X0, FL, X1 - X0, 500);
  sunQuad(g, t, [[520, 60], [980, 60], [1300, 1500], [840, 1500]], { cols: 2, rows: 4, col: '#FFD890', a: .36, leaves: 12, seed: 9 });
  pendant(g, 540, -300, 300, 1.1, .8);
}
// results board: slotted cards. rows = [[place, name, colour]]
export function resultBoard(g, x, y, w, title, rows, { sub = 'FINAL STANDINGS', rot = 0, flip = null } = {}) {
  const rh = w * .23, h = w * .3 + rows.length * (rh + w * .035) + w * .05;
  g.save(); g.translate(x, y); g.rotate(rot);
  fillRR(g, -w / 2 + 10, 14, w, h, 14, rgba(P.plum, .28)); fillRR(g, -w / 2, 0, w, h, 14, P.woodDark); fillRR(g, -w / 2 + w * .028, w * .028, w * .944, h - w * .056, 8, P.indigo);
  text(g, title, 0, w * .11, { size: w * .1, col: P.cream, ls: w * .004 }); text(g, sub, 0, w * .205, { size: w * .044, font: F.ui, weight: '600', col: P.lavLight, ls: w * .012 });
  rows.forEach(([pl, name, col], i) => {
    const yy = w * .28 + i * (rh + w * .035), sy = flip && flip[i] !== undefined ? Math.max(.04, Math.abs(Math.cos(flip[i] * Math.PI))) : 1;
    g.save(); g.translate(0, yy + rh / 2); g.scale(1, sy);
    fillRR(g, -w * .44, -rh / 2, w * .88, rh, 8, i === 0 ? P.gold : P.paper); fillR(g, -w * .44, -3, w * .88, 6, rgba(P.night, .1));
    fillRR(g, -w * .425, -rh / 2 + rh * .1, w * .24, rh * .8, 6, i === 0 ? P.amber : P.lavLight);
    text(g, pl, -w * .305, 4, { size: rh * .52, col: P.ink }); if (!(flip && flip[i] !== undefined && flip[i] < .5)) text(g, name, w * .1, 5, { size: rh * .7, col: col || P.ink, ls: w * .006 });
    g.restore();
  });
  for (const sx of [-1, 1]) circ(g, sx * (w / 2 - w * .028), w * .028, w * .012, P.gold);
  g.restore(); return h;
}

// ---------- 8. school courtyard at sunset ----------
export function courtyard(g, t, { rise = 0, sunX = 600 } = {}) {
  const X0 = -400, X1 = 1500, HZ = 1120;
  g.fillStyle = lg(g, 0, -260, 0, HZ, [[0, '#3B356E'], [.2, '#6A5E9E'], [.4, '#A78DB9'], [.58, '#E6A39A'], [.76, '#F7B36B'], [.9, '#FFD27E'], [1, '#FFE6A6']]); g.fillRect(X0, -600, X1 - X0, HZ + 600);
  // sun and glow
  const sx = sunX, sy = HZ - 104;
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(g, sx, sy, 30, 760, [rgba('#FFF6CF', 1), rgba('#FFD27E', .55), rgba('#F2A65A', .22), 'rgba(0,0,0,0)']); g.fillRect(X0, -300, X1 - X0, 1800); g.restore();
  g.fillStyle = rg(g, sx, sy, 10, 96, ['#FFFDF0', '#FFF3C4', '#FFDC8E']); g.beginPath(); g.arc(sx, sy, 96, 0, TAU); g.fill();
  // clouds lit from below
  const cl = (x, y, s, a) => { cloud(g, x, y, s, '#8C76AE', a); cloud(g, x + 6 * s, y + 13 * s, s * .96, '#F2A08A', a); cloud(g, x + 12 * s, y + 24 * s, s * .9, '#FFD08A', a * .9); };
  cl(-120 + t * 3, 330, 2.0, .9); cl(620 + t * 2.2, 200, 1.5, .85); cl(380 + t * 2.6, 560, 1.2, .8); cl(-40 + t * 2, 720, .9, .7); cl(820 + t * 1.6, 760, 1.0, .7);
  // birds
  g.strokeStyle = rgba(P.plum, .8); g.lineWidth = 3.5; g.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const bx = 200 + i * 60 + t * 16 + (i % 2) * 24, by = 430 + (i % 3) * 34 - t * 3 + Math.sin(i * 2.1) * 20, fl = Math.sin(t * 7 + i) * 7; g.beginPath(); g.moveTo(bx - 14, by - fl); g.quadraticCurveTo(bx - 5, by - 4, bx, by + 2); g.quadraticCurveTo(bx + 5, by - 4, bx + 14, by - fl); g.stroke(); }
  // far hills / town haze
  g.fillStyle = '#C98FA0'; g.beginPath(); g.moveTo(X0, HZ); for (let x = X0; x <= X1; x += 40) g.lineTo(x, HZ - 60 - Math.sin(x * .006) * 26 - Math.sin(x * .017 + 2) * 12); g.lineTo(X1, HZ); g.fill();
  // school building, backlit, windows glowing
  const bc = '#6B5488', bx = -120;
  fillR(g, bx, 660, 500, 470, bc); fillR(g, bx - 16, 640, 532, 26, '#57447A');
  fillR(g, bx + 190, 480, 130, 200, bc); poly(g, [[bx + 176, 482], [bx + 255, 400], [bx + 334, 482]]); g.fillStyle = '#57447A'; g.fill();
  circ(g, bx + 255, 560, 36, '#FFE6A6'); line(g, bx + 255, 560, bx + 255, 538, P.plum, 5); line(g, bx + 255, 560, bx + 272, 566, P.plum, 5);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const lit = (r * 5 + c * 3) % 4 !== 1; fillRR(g, bx + 30 + c * 94, 700 + r * 130, 56, 86, 4, lit ? '#FFD88C' : '#4A3B6E'); if (lit) { line(g, bx + 58 + c * 94, 700 + r * 130, bx + 58 + c * 94, 786 + r * 130, bc, 4, 'butt'); } }
  fillR(g, bx + 210, 990, 90, 140, '#4A3B6E'); fillR(g, bx - 30, 1100, 560, 30, '#57447A');
  // rim of sunlight along the building's right edge
  fillR(g, bx + 494, 660, 6, 470, rgba('#FFD88C', .9)); fillR(g, bx + 316, 480, 5, 180, rgba('#FFD88C', .9));
  // ground: courtyard paving, glowing toward the sun
  g.fillStyle = lg(g, 0, HZ, 0, 1920, ['#FFD493', '#EFA86A', '#C7785A', '#8E5670']); g.fillRect(X0, HZ, X1 - X0, 900);
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = lg(g, 0, HZ, 0, 1700, [rgba('#FFF0BE', .75), rgba('#FFD08A', 0)]); poly(g, [[sx - 70, HZ], [sx + 70, HZ], [sx + 430, 1920], [sx - 330, 1920]]); g.fill(); g.restore();
  g.strokeStyle = rgba('#7A4A5E', .24); g.lineWidth = 3; for (let k = -12; k <= 12; k++) { g.beginPath(); g.moveTo(sx + k * 60, HZ); g.lineTo(sx + k * 300, 2000); g.stroke(); }
  for (let k = 0; k < 7; k++) { const yy = HZ + 16 + k * k * 18 + k * 26; g.beginPath(); g.moveTo(X0, yy); g.lineTo(X1, yy); g.stroke(); }
  // gate and fence on the horizon
  g.strokeStyle = '#57447A'; g.lineWidth = 5; for (let x = 420; x < X1; x += 34) { if (x > 560 && x < 700) continue; g.beginPath(); g.moveTo(x, HZ - 58); g.lineTo(x, HZ + 2); g.stroke(); }
  fillR(g, 420, HZ - 50, 140, 6, '#57447A'); fillR(g, 700, HZ - 50, X1 - 700, 6, '#57447A'); for (const gx of [548, 692]) { fillR(g, gx, HZ - 110, 22, 114, '#57447A'); circ(g, gx + 11, HZ - 116, 15, '#57447A'); }
  // tree shadows stretching toward us
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .34; g.filter = 'blur(7px)'; g.fillStyle = '#6B4A7A';
  poly(g, [[930, HZ + 20], [990, HZ + 20], [1500, 1750], [1050, 1900], [560, 1900]]); g.fill();
  for (let i = 0; i < 6; i++) ell(g, 1080 + i * 60 - i * i * 6, 1500 + i * 70, 260 - i * 14, 70 + i * 8, '#6B4A7A', -.5);
  g.restore();
  // big tree, right, backlit
  const tx = 960, ty = HZ + 40, tc = ['#3F3564', '#54437A', '#6D5590'];
  g.strokeStyle = '#3A2F5C'; g.lineCap = 'round'; g.lineWidth = 62; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + 26, ty - 300, tx - 20, ty - 620); g.stroke();
  g.lineWidth = 30; g.beginPath(); g.moveTo(tx, ty - 380); g.quadraticCurveTo(tx + 150, ty - 520, tx + 260, ty - 700); g.moveTo(tx - 6, ty - 440); g.quadraticCurveTo(tx - 160, ty - 560, tx - 250, ty - 730); g.stroke();
  foliage(g, tx + 20, ty - 800, 430, tc, t, 21); foliage(g, tx - 250, ty - 700, 250, tc, t, 22); foliage(g, tx + 300, ty - 640, 260, tc, t, 23);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .55; const r = rnd(77); for (let i = 0; i < 46; i++) { const a = r() * TAU, d = r(); circ(g, tx - 140 + Math.cos(a) * d * 330 + Math.sin(t + i) * 3, ty - 760 + Math.sin(a) * d * 230, 5 + r() * 10, '#FFC98A'); } g.restore();
  line(g, tx - 30, ty - 20, tx - 44, ty - 560, rgba('#FFD08A', .85), 7);
  // falling leaves
  for (let i = 0; i < 9; i++) { const u = (t * .05 + i * .137) % 1, lx = tx - 380 + i * 80 + Math.sin(t * .9 + i) * 40, lyy = ty - 620 + u * 700; g.save(); g.translate(lx, lyy); g.rotate(t * 1.3 + i); ell(g, 0, 0, 11, 5, i % 2 ? '#F2A65A' : '#C7785A'); g.restore(); }
  return { HZ, sx, sy };
}
// dark foreground framing for the sunset
export function courtyardFg(g, t) {
  g.fillStyle = '#2A2350';
  g.beginPath(); g.moveTo(-400, 1920); g.lineTo(-400, 1690); for (let x = -400; x <= 1500; x += 22) { const h = 26 + ((x * 7) % 37) + Math.sin(x * .05 + t * 1.2) * 6; g.lineTo(x, 1800 - h + Math.abs(x - 540) * .09 - 60); g.lineTo(x + 11, 1836 + Math.abs(x - 540) * .09 - 60); } g.lineTo(1500, 1920); g.fill();
}

// ---------- title lockup ----------
export function titleCard(g, x, y, s = 1, k = 1) {
  g.save(); g.translate(x, y); g.rotate(-.035); g.scale(s, s);
  const L = [['THAT ONE', 132, -150], ['FRIEND', 196, 0], ['AT SCHOOL...', 118, 150]];
  for (const [str, size, yy] of L) { text(g, str, 9, yy + 11, { size, col: rgba(P.indigo, .9) }); text(g, str, 0, yy, { size, col: P.cream, stroke: P.indigo, sw: 16 }); text(g, str, 0, yy, { size, col: str === 'FRIEND' ? P.sun : P.cream }); }
  fillRR(g, -250, 228, 500, 12, 6, P.orange); g.restore();
}
