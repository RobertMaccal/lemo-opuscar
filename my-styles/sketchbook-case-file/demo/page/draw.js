// Pencil-sketch drawing kit: wobbly ink outlines, diagonal hatching, chibi characters, props.
const W = 1080, H = 1920;
const CANVAS = document.getElementById('c');
let X = CANVAS.getContext('2d');
const INK = '#1b1b1d', PAPER = '#f3f2eb', YEL = '#f4c84a', GREYF = '#d3d2cc', LIGHT = '#e9e8e2';
const HAND = "'Kalam'", SANS = "'Nunito'";

// ---------- math ----------
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
function vn(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ss = t => t * t * (3 - 2 * t);
const eo = t => 1 - Math.pow(1 - t, 3);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const back = (t, s = 1.7) => { t = clamp(t, 0, 1); const c = s + 1; return 1 + c * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
// pop-in scale: 0 before t0, overshoots to 1
const pop = (t, t0, d = .38) => t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.2);
const fadeIn = (t, t0, d = .3) => ss(seg(t, t0, t0 + d));

// ---------- hatch patterns ----------
function mkPattern(base, line, lw, gap, alpha) {
  const s = 120, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  if (base) { g.fillStyle = base; g.fillRect(0, 0, s, s); }
  g.strokeStyle = line; g.lineCap = 'round';
  for (let k = -s; k < 2 * s; k += gap) {
    const i = Math.round(k / gap);
    g.globalAlpha = alpha * (0.75 + 0.5 * hash(i * 3.1));
    g.lineWidth = lw * (0.8 + 0.4 * hash(i * 1.7));
    g.beginPath(); g.moveTo(k, s); g.lineTo(k + s, 0); g.stroke();
  }
  return c;
}
const PAT_SRC = {
  light: mkPattern('#e4e3dd', '#3a3a3a', 1.8, 10, .38),
  mid: mkPattern('#c9c8c2', '#2a2a2a', 2.2, 8, .55),
  dark: mkPattern('#4a4a4c', '#111', 3, 6, .9),
  blue: mkPattern('#9db4e0', '#2b3f6e', 2, 9, .45),
  yel: mkPattern(YEL, '#8a6400', 1.4, 9, .16),
  white: mkPattern('#ffffff', '#555', 1.2, 12, .12),
  paper: mkPattern('#d9d8d1', '#333', 1.6, 9, .3),
};
const PATS = {};
function pat(name) { if (!PATS[name]) PATS[name] = X.createPattern(PAT_SRC[name], 'repeat'); return PATS[name]; }
function setCtx(ctx) { X = ctx; for (const k in PATS) delete PATS[k]; }

// ---------- point generators ----------
function R(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function RR(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); const p = [], n = 5;
  const cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return p;
}
function EL(cx, cy, rx, ry, n = 36, a0 = 0, a1 = Math.PI * 2) {
  const p = [], full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const m = full ? n : n + 1;
  for (let i = 0; i < m; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return p;
}

// ---------- wobble + draw ----------
function wobble(pts, closed, seed, amp) {
  const out = []; const n = pts.length; const segs = closed ? n : n - 1; let L = 0;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const k = Math.max(1, Math.round(len / 16)); const nx = -dy / len, ny = dx / len;
    for (let j = 0; j < k; j++) {
      const t = j / k, s = L + len * t;
      const o = (vn(seed * 7.7 + s / 55) - .5) * 2 * amp;
      out.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
    }
    L += len;
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
function tracePath(p, closed) { X.beginPath(); X.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) X.lineTo(p[i][0], p[i][1]); if (closed) X.closePath(); }
function partial(p, closed, prog) {
  const q = closed ? p.concat([p[0]]) : p; let L = 0; const d = [0];
  for (let i = 1; i < q.length; i++) { L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); d.push(L); }
  const target = L * prog, out = [q[0]];
  for (let i = 1; i < q.length; i++) {
    if (d[i] <= target) out.push(q[i]);
    else { const f = (target - d[i - 1]) / (d[i] - d[i - 1] || 1); out.push([lerp(q[i - 1][0], q[i][0], f), lerp(q[i - 1][1], q[i][1], f)]); break; }
  }
  return out;
}
// o: fill, hatch, stroke, lw, closed, seed, amp, prog, alpha
function shape(pts, o = {}) {
  const closed = o.closed !== false, seed = o.seed ?? (pts.length * 3.3 + pts[0][0] * .01), amp = o.amp ?? 1.3;
  const p = wobble(pts, closed, seed, amp);
  const prog = o.prog ?? 1; if (prog <= 0) return;
  X.save(); if (o.alpha != null) X.globalAlpha *= o.alpha;
  if (closed && prog >= 1) {
    if (o.fill) { tracePath(p, true); X.fillStyle = o.fill; X.fill(); }
    if (o.hatch) { tracePath(p, true); X.fillStyle = pat(o.hatch); X.fill(); }
  }
  if (o.stroke !== null) {
    X.strokeStyle = o.stroke || INK; X.lineWidth = o.lw ?? 5; X.lineJoin = 'round'; X.lineCap = 'round';
    const q = prog < 1 ? partial(p, closed, prog) : p;
    tracePath(q, closed && prog >= 1); X.stroke();
  }
  X.restore();
}
function line(pts, o = {}) { shape(pts, Object.assign({ closed: false }, o)); }
function dotFill(x, y, r, c = INK) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.fillStyle = c; X.fill(); }
function shadowOf(pts, dx = 5, dy = 6, a = .13) { X.save(); X.globalAlpha *= a; tracePath(pts, true); X.fillStyle = '#000'; X.translate(dx, dy); X.fill(); X.restore(); }
function shadowShape(pts, dx = 5, dy = 6, a = .13) { X.save(); X.translate(dx, dy); X.globalAlpha *= a; tracePath(pts, true); X.fillStyle = '#000'; X.fill(); X.restore(); }

// ---------- text ----------
function font(size, fam = HAND, weight = 700) { X.font = `${weight} ${size}px ${fam}`; }
function txt(s, x, y, o = {}) {
  font(o.size || 40, o.fam || HAND, o.weight || 700);
  X.fillStyle = o.color || INK; X.textAlign = o.align || 'center'; X.textBaseline = o.base || 'middle';
  X.fillText(s, x, y);
}
function tw(s, size, fam = HAND, weight = 700) { font(size, fam, weight); return X.measureText(s).width; }

// ---------- transforms ----------
function at(x, y, s, rot, fn) { X.save(); X.translate(x, y); if (rot) X.rotate(rot); if (s !== 1) X.scale(s, s); fn(); X.restore(); }
// pop around a pivot
function popAt(x, y, k, fn, rot = 0) { if (k <= 0) return; at(x, y, k, rot, fn); }

// ---------- background ----------
function paper() {
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  X.fillStyle = '#cfcdc3';
  for (let y = 18; y < H; y += 46) for (let x = 18; x < W; x += 46) { X.beginPath(); X.arc(x, y, 2.6, 0, 6.283); X.fill(); }
}
function floorLine(y, x0 = -40, x1 = W + 40) { line([[x0, y], [x1, y]], { lw: 3, stroke: '#7d7c76', seed: 3 }); }

// ---------- UI pieces ----------
function tape(x, y, w = 70, h = 26, rot = -.12) {
  at(x, y, 1, rot, () => { X.fillStyle = 'rgba(160,160,155,.55)'; X.fillRect(-w / 2, -h / 2, w, h); });
}
// tag pill centred at x,y
function tag(x, y, text, o = {}) {
  const size = o.size || 40, padX = o.padX || 26, h = o.h || size * 1.45;
  const w = (o.w || tw(text, size)) + padX * 2;
  const k = o.k ?? 1; if (k <= 0) return;
  at(x, y, k, o.rot || 0, () => {
    const p = RR(-w / 2, -h / 2, w, h, o.r ?? 14);
    shadowShape(p, 5, 6, .16);
    const grey = o.fill === 'grey';
    shape(p, { fill: grey ? '#dddcd6' : (o.fill || YEL), hatch: grey ? 'light' : null, lw: 4.5, seed: text.length + 2 });
    txt(text, 0, 3, { size, color: o.color || INK });
    if (o.sub) txt(o.sub, 0, h / 2 + (o.subSize || 28) * .95, { size: o.subSize || 28, fam: SANS, weight: 800, color: '#333' });
  });
}
// ribbon banner: white card with yellow text pill + grey folded tails
function banner(x, y, text, o = {}) {
  const k = o.k ?? 1; if (k <= 0) return;
  const size = o.size || 46; const tw0 = tw(text, size); const w = tw0 + 120, h = size * 2;
  at(x, y, k, o.rot || 0, () => {
    for (const sd of [-1, 1]) {
      const bx = sd * (w / 2 - 10);
      const tail = [[bx, -h * .18], [bx + sd * 80, -h * .18], [bx + sd * 52, h * .2], [bx + sd * 80, h * .58], [bx, h * .58]];
      shape(tail, { fill: '#bdbcb6', hatch: 'mid', lw: 4, seed: 9 + sd });
    }
    const p = R(-w / 2, -h / 2, w, h); shadowShape(p, 5, 6, .14);
    shape(p, { fill: '#fff', lw: 4.5, seed: 4 });
    const q = RR(-tw0 / 2 - 30, -size * .62, tw0 + 60, size * 1.24, size * .5);
    shape(q, { fill: YEL, stroke: null, seed: 5 });
    txt(text, 0, 4, { size });
    if (o.sub) txt(o.sub, 0, h / 2 + 40, { size: o.subSize || 32, fam: SANS, weight: 800, color: '#222' });
  });
}
// white card
function card(x, y, w, h, o = {}) {
  const p = RR(x - w / 2, y - h / 2, w, h, o.r ?? 18);
  shadowShape(p, 6, 7, .14);
  shape(p, { fill: o.fill || '#fff', lw: o.lw ?? 4.5, seed: o.seed ?? 11, hatch: o.hatch });
}
function speech(x, y, w, h, tx, ty, o = {}) {
  const r = 26; const p = RR(x - w / 2, y - h / 2, w, h, r);
  // tail
  const bx = clamp(tx, x - w / 2 + 50, x + w / 2 - 50);
  const tail = [[bx - 26, y + h / 2 - 3], [tx, ty], [bx + 10, y + h / 2 - 3]];
  shadowShape(p, 6, 7, .12);
  shape(p, { fill: '#fff', lw: 4.5, seed: o.seed || 21 });
  X.save(); tracePath(tail, true); X.fillStyle = '#fff'; X.fill(); X.restore();
  line([tail[0], tail[1], tail[2]], { lw: 4.5, seed: 22 });
  X.fillStyle = '#fff'; X.fillRect(bx - 22, y + h / 2 - 9, 28, 8);
}
function cloud(x, y, w, h, tx, ty) {
  const p = EL(x, y, w / 2, h / 2, 44); shadowShape(p, 6, 7, .12);
  shape(p, { fill: '#fff', lw: 4.5, seed: 31 });
  const dx = tx - x, dy = ty - (y + h / 2);
  for (const [f, r] of [[.35, 13], [.72, 8]]) { const q = EL(x + dx * f, y + h / 2 + dy * f, r, r * .8, 14); shape(q, { fill: '#fff', lw: 3.5, seed: 32 + r }); }
}

// ---------- faces ----------
function eyes(o = {}) {
  const ex = o.ex ?? 30, ey = o.ey ?? 6;
  if (o.shock) {
    for (const s of [-1, 1]) { const p = EL(s * ex, ey, 17, 19, 22); shape(p, { fill: '#fff', lw: 3.5, seed: 40 + s }); dotFill(s * ex + 3, ey + 4, 7.5); }
    return;
  }
  if (o.closed) { for (const s of [-1, 1]) line(EL(s * ex, ey - 2, 12, 7, 10, .2, Math.PI - .2), { lw: 4, seed: 41 + s }); return; }
  for (const s of [-1, 1]) {
    X.save(); X.translate(s * ex + (o.look || 0), ey);
    X.beginPath(); X.ellipse(0, 0, 8, 10.5, 0, 0, 6.283); X.fillStyle = INK; X.fill();
    X.beginPath(); X.arc(2.4, -3.5, 2.6, 0, 6.283); X.fillStyle = '#fff'; X.fill();
    X.restore();
  }
  if (o.brow === 'worry') for (const s of [-1, 1]) line([[s * (ex + 14), ey - 26], [s * (ex - 10), ey - 32]], { lw: 4, seed: 44 + s });
  if (o.brow === 'angry') for (const s of [-1, 1]) line([[s * (ex + 14), ey - 32], [s * (ex - 12), ey - 22]], { lw: 5, seed: 45 + s });
  if (o.brow === 'up') for (const s of [-1, 1]) line(EL(s * ex, ey - 24, 13, 6, 8, Math.PI + .3, 2 * Math.PI - .3), { lw: 4, seed: 46 + s });
}
function blush(ex = 30) {
  X.save(); X.strokeStyle = 'rgba(80,80,80,.45)'; X.lineWidth = 2.4; X.lineCap = 'round';
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const bx = s * (ex + 22) + i * 7 - 7, by = 34; X.beginPath(); X.moveTo(bx - 4, by + 6); X.lineTo(bx + 4, by - 6); X.stroke(); }
  X.restore();
}
function mouth(kind, t = 0) {
  const y = 44;
  if (kind === 'worry') line([[-16, y + 2], [-8, y - 5], [0, y + 3], [8, y - 5], [16, y + 1]], { lw: 4, seed: 51 });
  else if (kind === 'smile') line(EL(0, y - 6, 14, 9, 10, .25, Math.PI - .25), { lw: 4, seed: 52 });
  else if (kind === 'frown') line(EL(0, y + 8, 13, 8, 10, Math.PI + .3, 2 * Math.PI - .3), { lw: 4, seed: 53 });
  else if (kind === 'line') line([[-12, y], [12, y + 1]], { lw: 4, seed: 54 });
  else if (kind === 'o') { const p = EL(0, y + 2, 9, 12, 16); shape(p, { fill: '#333', lw: 3.5, seed: 55 }); }
  else if (kind === 'open') { const p = [[-15, y - 4], [15, y - 4], [8, y + 12], [-8, y + 12]]; shape(p, { fill: '#333', lw: 3.5, seed: 56 }); }
  else if (kind === 'talk') {
    const o = Math.abs(Math.sin(t * 15)) * .9 + .1;
    const p = EL(0, y, 12, 3 + 9 * o, 16); shape(p, { fill: '#333', lw: 3.5, seed: 57 });
  }
}
function sweat(x, y) { const p = [[x, y - 18], [x + 9, y], [x + 7, y + 8], [x - 7, y + 8], [x - 9, y]]; shape(p, { fill: '#fff', lw: 3, seed: 58 }); }

// generic chibi head at origin. o.hair: 'student'|'nurse'|'judge'|'senior'|'back'|'mother'
function head(o = {}) {
  const rx = 86, ry = 80;
  if (o.hair === 'mother') {
    const hair = [[-92, -20], [-80, -70], [-40, -98], [10, -100], [60, -84], [90, -40], [96, 40], [100, 150], [70, 170], [60, 80], [-60, 80], [-70, 170], [-100, 150], [-96, 40]];
    shape(hair, { fill: '#9a9994', hatch: 'mid', lw: 4.5, seed: 61 });
    shape(EL(0, 0, rx * .82, ry * .9), { fill: '#bdbcb6', hatch: 'mid', lw: 4.5, seed: 62 });
    return;
  }
  if (o.hair === 'back') {
    shape(EL(-rx + 2, 8, 12, 18, 14), { fill: '#fff', lw: 4, seed: 63 }); shape(EL(rx - 2, 8, 12, 18, 14), { fill: '#fff', lw: 4, seed: 64 });
    shape(EL(0, 0, rx, ry, 40), { fill: '#3e3e40', hatch: 'dark', lw: 5, seed: 65 });
    line([[-30, 70], [0, 76], [30, 70]], { lw: 3, seed: 66, stroke: '#666' });
    return;
  }
  // ears
  for (const s of [-1, 1]) shape(EL(s * (rx - 2), 10, 13, 19, 14), { fill: '#fff', lw: 4, seed: 70 + s });
  if (o.hair === 'nurse') { shape(EL(4, -ry - 22, 28, 24, 20), { fill: '#3e3e40', hatch: 'dark', lw: 4.5, seed: 72 }); }
  // face
  shape(EL(0, 0, rx, ry, 40), { fill: '#fff', lw: 5, seed: 73 });
  if (o.hair === 'student') {
    const hp = [[-rx - 4, 6], [-rx + 2, -40], [-55, -78], [-5, -90], [45, -82], [80, -52], [rx + 4, 2], [70, -22], [40, -38], [10, -44], [-20, -30], [-48, -40], [-72, -20]];
    shape(hp, { fill: '#3e3e40', hatch: 'dark', lw: 5, seed: 74 });
    line([[0, -88], [-4, -108], [12, -114], [16, -102]], { lw: 4, seed: 75 });
  } else if (o.hair === 'nurse') {
    const hp = [[-rx - 3, 10], [-rx + 4, -42], [-50, -76], [0, -84], [50, -76], [rx - 4, -42], [rx + 3, 10], [66, -24], [30, -40], [-10, -40], [-50, -34], [-72, -14]];
    shape(hp, { fill: '#3e3e40', hatch: 'dark', lw: 5, seed: 76 });
  } else if (o.hair === 'judge' || o.hair === 'senior') {
    for (const s of [-1, 1]) { const hp = [[s * (rx + 6), 12], [s * (rx + 8), -26], [s * 62, -58], [s * 48, -40], [s * 70, -14]]; shape(hp, { fill: '#e2e1db', hatch: 'light', lw: 4, seed: 77 + s }); }
    line([[-20, -76], [0, -82], [18, -77]], { lw: 3, seed: 79, stroke: '#888' });
  }
  const ex = 30;
  if (o.glasses) { for (const s of [-1, 1]) shape(EL(s * ex, 8, 22, 20, 20), { stroke: INK, lw: 4, seed: 80 + s }); line([[-8, 6], [8, 6]], { lw: 4, seed: 82 }); }
  eyes({ ex, ey: 8, shock: o.shock, closed: o.closed, brow: o.brow, look: o.look });
  if (!o.noblush) blush(ex);
  mouth(o.mouth || 'smile', o.t || 0);
  if (o.sweat) sweat(rx - 6, -34);
}

// ---------- bodies (feet at y=0) ----------
function legs(o = {}) {
  const ph = o.walk || 0, sw = Math.sin(ph) * 16;
  for (const [s, d] of [[-1, sw], [1, -sw]]) {
    X.save(); X.translate(s * 22, -150); X.rotate(o.walk != null ? d * .012 : 0);
    shape(R(-17, 0, 34, 132), { fill: '#c9c8c2', hatch: o.legHatch || 'mid', lw: 4.5, seed: 90 + s });
    shape(EL(s * 4, 136, 26, 13, 16), { fill: '#2b2b2d', lw: 4, seed: 92 + s });
    X.restore();
  }
}
function coat(o = {}) {
  const p = [[-74, -318], [74, -318], [96, -128], [-96, -128]];
  shape(p, { fill: '#fff', lw: 5, seed: 100 });
  if (o.back) { line([[0, -300], [0, -132]], { lw: 3, seed: 101, stroke: '#777' }); return; }
  const v = [[-30, -318], [0, -238], [30, -318]]; shape(v, { fill: '#cfcec8', hatch: 'mid', lw: 4, seed: 102 });
  line([[-30, -318], [-6, -200]], { lw: 4, seed: 103 }); line([[30, -318], [6, -200]], { lw: 4, seed: 104 });
  line([[0, -238], [0, -134]], { lw: 3, seed: 105, stroke: '#555' });
  // badge
  if (!o.nobadge) { shape(RR(20, -272, 48, 30, 6), { fill: YEL, lw: 3.5, seed: 106 }); txt(o.badge || 'PJ', 44, -255, { size: 22 }); }
  // stethoscope
  if (!o.nosteth) { line([[-34, -316], [-50, -282], [-44, -236]], { lw: 5, seed: 107, stroke: '#6a6a6a' }); shape(EL(-44, -224, 12, 12, 14), { fill: '#bbb', lw: 4, seed: 108 }); }
}
function arm(sx, sy, hx, hy, o = {}) {
  // sleeve as thick wobbly stroke with outline
  X.save(); X.lineCap = 'round'; X.lineJoin = 'round';
  const pts = o.elbow ? [[sx, sy], o.elbow, [hx, hy]] : [[sx, sy], [hx, hy]];
  const p = wobble(pts, false, o.seed || 111, 1.2);
  tracePath(p, false); X.strokeStyle = INK; X.lineWidth = (o.thick || 34) + 9; X.stroke();
  tracePath(p, false); X.strokeStyle = o.fill || '#fff'; X.lineWidth = o.thick || 34; X.stroke();
  if (o.hatch) { tracePath(p, false); X.strokeStyle = pat(o.hatch); X.lineWidth = o.thick || 34; X.stroke(); }
  X.restore();
  if (!o.nohand) shape(EL(hx, hy, 17, 16, 14), { fill: '#fff', lw: 4.5, seed: (o.seed || 111) + 1 });
}
// student. o: pose('stand'|'dock'|'hold'|'inject'|'back'|'walk'), face, mouth, t
function student(x, y, s, o = {}) {
  at(x, y, s, o.rot || 0, () => {
    const pose = o.pose || 'stand';
    const bob = o.walk != null ? Math.abs(Math.sin(o.walk)) * -8 : 0;
    X.translate(0, bob);
    if (pose !== 'dock') legs(o);
    if (o.lean) { X.translate(0, -150); X.rotate(o.lean); X.translate(0, 150); }
    const back = pose === 'back';
    if (pose === 'stand' || pose === 'walk' || back) {
      const aw = o.walk != null ? Math.sin(o.walk) * 18 : 0;
      arm(-70, -300, -98 - aw * .2, -150 + aw * .3, { seed: 112 }); arm(70, -300, 98 + aw * .2, -150 - aw * .3, { seed: 114 });
    }
    coat({ back, badge: o.badge, nosteth: o.nosteth || back, nobadge: back || o.nobadge });
    if (pose === 'hold') {
      arm(-70, -300, -98, -150, { seed: 116 });
      arm(70, -300, 128, -236, { elbow: [120, -190], seed: 118 });
      if (o.syr !== false) syringe(140, -300, .4, { rot: -1.35, label: true, needle: true });
      shape(EL(128, -236, 17, 16, 14), { fill: '#fff', lw: 4.5, seed: 119 });
    }
    if (pose === 'ivpush') {
      const pl = o.pl || 0;
      arm(-70, -300, -150, -192, { elbow: [-130, -262], seed: 116 });
      syringe(-153, -192, .4, { flip: true, fill: 'milk', label: true, plunger: pl });
      arm(70, -300, 28 - pl * .4, -192, { elbow: [60, -226], seed: 118 });
    }
    if (pose === 'inject') {
      arm(-70, -300, -150, -196, { elbow: [-120, -250], seed: 116 });
      syringe(-176, -168, .26, { rot: 2.5, needle: true });
      arm(70, -300, -120, -176, { elbow: [30, -200], seed: 118 });
    }
    X.save(); X.translate(0, -410);
    head({ hair: back ? 'back' : (o.hair || 'student'), mouth: o.mouth || 'smile', brow: o.brow, sweat: o.sweat, shock: o.shock, glasses: o.glasses, t: o.t, look: o.look });
    X.restore();
  });
}
// nurse. pose 'stand'|'point'|'lean'
function nurse(x, y, s, o = {}) {
  at(x, y, s, o.rot || 0, () => {
    const bob = o.walk != null ? Math.abs(Math.sin(o.walk)) * -8 : 0; X.translate(0, bob);
    legs(o);
    const body = [[-68, -316], [68, -316], [80, -140], [-80, -140]];
    shape(body, { fill: '#c9c8c2', hatch: 'mid', lw: 5, seed: 120 });
    line([[-26, -316], [0, -280], [26, -316]], { lw: 4, seed: 121 });
    shape(R(-46, -250, 34, 30), { stroke: INK, lw: 3.5, seed: 122 });
    const pose = o.pose || 'stand';
    const aw = o.walk != null ? Math.sin(o.walk) * 18 : 0;
    if (pose === 'point') { arm(-64, -300, -86, -160, { hatch: 'mid', fill: '#c9c8c2', seed: 123 }); arm(64, -300, 205, -296, { elbow: [130, -290], hatch: null, seed: 125 }); }
    else if (pose === 'lean') { arm(-60, -300, -150, -210, { elbow: [-120, -270], seed: 127 }); arm(60, -300, -120, -196, { elbow: [-40, -230], seed: 129 }); }
    else { arm(-64, -300, -88 - aw * .2, -160, { seed: 131 }); arm(64, -300, 88 + aw * .2, -160, { seed: 133 }); }
    X.save(); X.translate(0, -400);
    head({ hair: 'nurse', mouth: o.mouth || 'smile', shock: o.shock, brow: o.brow, t: o.t });
    if (o.alarm) alarmLines(0, -150, o.alarm);
    X.restore();
  });
}
// mother: grey silhouette, optional baby, pose 'hold'|'grief'|'walk'
function mother(x, y, s, o = {}) {
  at(x, y, s, 0, () => {
    const bob = o.walk != null ? Math.abs(Math.sin(o.walk)) * -7 : 0; X.translate(0, bob);
    legs(Object.assign({ legHatch: 'mid' }, o));
    const dress = [[-62, -330], [62, -330], [92, -120], [-92, -120]];
    shape(dress, { fill: '#b9b8b2', hatch: 'mid', lw: 5, seed: 140 });
    if (o.pose === 'grief') { arm(-56, -310, -78, -446, { elbow: [-120, -360], fill: '#b9b8b2', hatch: 'mid', seed: 141 }); arm(56, -310, 78, -446, { elbow: [120, -360], fill: '#b9b8b2', hatch: 'mid', seed: 143 }); }
    X.save(); X.translate(0, o.pose === 'grief' ? -408 : -418); if (o.pose === 'grief') X.rotate(.1); head({ hair: 'mother' }); X.restore();
    if (o.pose === 'grief') { shape(EL(-78, -446, 20, 18, 14), { fill: '#a9a8a2', hatch: 'mid', lw: 4.5, seed: 145 }); shape(EL(78, -446, 20, 18, 14), { fill: '#a9a8a2', hatch: 'mid', lw: 4.5, seed: 146 }); }
    else if (o.pose === 'hold') {
      arm(-56, -310, -40, -226, { elbow: [-86, -250], fill: '#b9b8b2', hatch: 'mid', seed: 147, nohand: true });
      baby(10, -250, .95, { blue: o.blue, rot: -.1 });
      arm(56, -310, 30, -214, { elbow: [86, -232], fill: '#b9b8b2', hatch: 'mid', seed: 149, nohand: true });
      shape(EL(34, -214, 17, 16, 14), { fill: '#b9b8b2', hatch: 'mid', lw: 4, seed: 150 });
    } else { arm(-56, -310, -80, -150, { fill: '#b9b8b2', hatch: 'mid', seed: 151 }); arm(56, -310, 80, -150, { fill: '#b9b8b2', hatch: 'mid', seed: 153 }); }
  });
}
// a father silhouette (short hair)
function father(x, y, s, o = {}) {
  at(x, y, s, 0, () => {
    const bob = o.walk != null ? Math.abs(Math.sin(o.walk)) * -7 : 0; X.translate(0, bob);
    legs(Object.assign({ legHatch: 'mid' }, o));
    shape([[-76, -330], [76, -330], [86, -130], [-86, -130]], { fill: '#a8a7a1', hatch: 'mid', lw: 5, seed: 160 });
    arm(-70, -310, -88, -150, { fill: '#a8a7a1', hatch: 'mid', seed: 161 }); arm(70, -310, 88, -150, { fill: '#a8a7a1', hatch: 'mid', seed: 163 });
    X.save(); X.translate(0, -418);
    shape(EL(0, 0, 80, 78, 36), { fill: '#a8a7a1', hatch: 'mid', lw: 5, seed: 164 });
    shape([[-82, 0], [-74, -50], [-30, -80], [30, -80], [74, -50], [82, 0], [60, -30], [-60, -30]], { fill: '#6c6b66', hatch: 'dark', lw: 4.5, seed: 165 });
    X.restore();
  });
}
// baby swaddled; origin at center of bundle
function baby(x, y, s, o = {}) {
  at(x, y, s, o.rot || 0, () => {
    const bf = o.blue ? '#9db4e0' : '#cfcec8', bh = o.blue ? 'blue' : 'mid';
    shape(EL(34, 6, 62, 34, 28), { fill: bf, hatch: bh, lw: 4.5, seed: 170 });
    shape(EL(-38, -4, 40, 38, 28), { fill: o.blue ? '#b7c8ea' : '#fff', lw: 4.5, seed: 171 });
    if (o.blue) { X.save(); tracePath(EL(-38, -4, 40, 38, 28), true); X.fillStyle = pat('blue'); X.globalAlpha = .6; X.fill(); X.restore(); }
    line([[-38, -42], [-34, -54], [-24, -52]], { lw: 3.5, seed: 172 });
    for (const sx of [-52, -26]) line(EL(sx, -6, 7, 4, 8, .3, Math.PI - .3), { lw: 3.2, seed: 173 + sx });
    if (o.gasp) shape(EL(-38, 14, 5, 6, 10), { fill: '#333', lw: 2.5, seed: 175 }); else line([[-43, 14], [-33, 14]], { lw: 3, seed: 176 });
  });
}
function judge(x, y, s, o = {}) {
  at(x, y, s, 0, () => {
    const robe = [[-90, -300], [90, -300], [118, -60], [-118, -60]];
    shape(robe, { fill: '#2d2d2f', hatch: 'dark', lw: 5, seed: 180 });
    shape([[-24, -300], [24, -300], [10, -240], [-10, -240]], { fill: '#fff', lw: 4, seed: 181 });
    line([[0, -296], [0, -246]], { lw: 3, seed: 182 });
    X.save(); X.translate(0, -392); head({ hair: 'judge', glasses: true, mouth: o.mouth || 'line', t: o.t, brow: o.brow }); X.restore();
  });
}

// ---------- props ----------
function alarmLines(x, y, k = 1) {
  X.save(); X.strokeStyle = YEL; X.lineWidth = 7; X.lineCap = 'round'; X.globalAlpha *= k;
  for (const [a, r0] of [[-2.2, 60], [-1.57, 66], [-.94, 60]]) {
    X.beginPath(); X.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); X.lineTo(x + Math.cos(a) * (r0 + 30), y + Math.sin(a) * (r0 + 30)); X.stroke();
  }
  X.restore();
}
function dock(x, y, w, s = 1, o = {}) {
  // y = top of rail; panels below
  at(x, y, s, 0, () => {
    const h = o.h || 330;
    shape(R(-w / 2 + 16, 30, w - 32, h - 30), { fill: '#cfcec8', hatch: 'mid', lw: 5, seed: 190 });
    const n = o.n || 6;
    for (let i = 1; i < n; i++) { const px = -w / 2 + 16 + (w - 32) * i / n; line([[px, 34], [px, h - 4]], { lw: 4, seed: 191 + i }); }
    shape(R(-w / 2 + 6, h - 6, w - 12, 26), { fill: '#bdbcb6', hatch: 'mid', lw: 4.5, seed: 198 });
    shape(RR(-w / 2, -6, w, 40, 14), { fill: '#fff', lw: 5, seed: 199 });
  });
}
function bars(x, y, w, h, drop = 1) {
  // jail bars dropping from above; y=top at final position
  const oy = (1 - drop) * -h * 1.2;
  X.save(); X.translate(x, y + oy);
  const n = 7;
  shape(R(-w / 2, 0, w, 30), { fill: '#fff', lw: 5, seed: 200 });
  for (let i = 0; i < n; i++) { const bx = -w / 2 + 34 + (w - 68) * i / (n - 1); shape(R(bx - 9, 30, 18, h - 60), { fill: '#fff', lw: 4.5, seed: 201 + i }); }
  shape(R(-w / 2, h * .48, w, 24), { fill: '#fff', lw: 5, seed: 210 });
  shape(R(-w / 2, h - 30, w, 30), { fill: '#fff', lw: 5, seed: 211 });
  X.restore();
}
// syringe pointing right; origin at barrel center; o.fill 'milk'|'hatch'|'empty', label bool, rot
function syringe(x, y, s, o = {}) {
  at(x, y, s, o.rot || 0, () => {
    if (o.flip) X.scale(-1, 1);
    const L = 360, Hh = 92, pl = o.plunger ?? 0; // plunger pushed-in amount
    // plunger rod
    shape(R(-L / 2 - 250 + pl, -16, 270, 32), { fill: '#fff', lw: 5, seed: 220 });
    shape(RR(-L / 2 - 268 + pl, -54, 26, 108, 8), { fill: '#fff', lw: 5, seed: 221 });
    // barrel
    const bp = R(-L / 2, -Hh / 2, L, Hh);
    shape(bp, { fill: o.fill === 'milk' ? '#fffdf6' : '#fff', hatch: o.fill === 'milk' ? null : (o.fill === 'empty' ? null : 'light'), lw: 5.5, seed: 222 });
    if (o.fill === 'milk') { X.save(); tracePath(R(-L / 2 + 30 + pl, -Hh / 2 + 6, L - 36 - pl, Hh - 12), true); X.fillStyle = '#efe6cc'; X.fill(); X.restore(); }
    if (o.amber) { tracePath(R(-L / 2 + 30, -Hh / 2 + 6, L - 40, Hh - 12), true); X.fillStyle = '#f6dc8a'; X.fill(); }
    // rubber stopper
    shape(R(-L / 2 + 6 + pl, -Hh / 2 + 4, 26, Hh - 8), { fill: '#3e3e40', hatch: 'dark', lw: 4, seed: 223 });
    // flange
    shape(RR(-L / 2 - 22, -Hh / 2 - 40, 26, Hh + 80, 8), { fill: '#fff', lw: 5, seed: 224 });
    // marks
    for (let i = 0; i < 6; i++) { const mx = -L / 2 + 120 + i * 40; line([[mx, -Hh / 2 + 2], [mx, -Hh / 2 + (i % 2 ? 16 : 26)]], { lw: 3, seed: 225 + i }); }
    // nozzle
    if (o.oral) { shape(RR(L / 2 - 2, -24, 70, 48, 10), { fill: o.amber ? YEL : '#fff', hatch: o.amber ? 'yel' : null, lw: 5, seed: 232 }); }
    else {
      shape([[L / 2, -30], [L / 2 + 58, -18], [L / 2 + 58, 18], [L / 2, 30]], { fill: '#fff', lw: 5, seed: 233 });
      shape(R(L / 2 + 58, -12, 70, 24), { fill: '#fff', lw: 4.5, seed: 234 });
      if (o.needle) line([[L / 2 + 128, 0], [L / 2 + 250, 0]], { lw: 4, seed: 235 });
    }
    if (o.label) {
      const lp = RR(-80, -Hh / 2 - 14, 160, Hh + 28, 10); shape(lp, { fill: '#fff', lw: 5, seed: 236 });
      shape(RR(-48, -40, 96, 80, 16), { fill: YEL, stroke: null, seed: 237 });
      X.save(); if (o.flip) X.scale(-1, 1); txt('?', 0, 6, { size: 78 }); X.restore();
    }
    if (o.text) { txt(o.text, 20, 6, { size: 64 }); }
  });
}
function monitor(x, y, s, t, o = {}) {
  at(x, y, s, 0, () => {
    if (!o.nostand) { line([[0, 120], [0, 560]], { lw: 9, seed: 240 }); line([[0, 120], [0, 560]], { lw: 3, stroke: '#ddd', seed: 240 }); shape(RR(-70, 556, 140, 18, 8), { fill: '#bdbcb6', hatch: 'mid', lw: 4, seed: 241 }); }
    shape(RR(-170, -120, 340, 240, 22), { fill: '#d0cfc9', hatch: 'mid', lw: 5, seed: 242 });
    shape(RR(-148, -98, 296, 196, 10), { fill: '#fff', lw: 4, seed: 243 });
    // ECG
    X.save(); tracePath(R(-144, -94, 288, 188), true); X.clip();
    X.strokeStyle = INK; X.lineWidth = 3.5; X.lineJoin = 'round'; X.beginPath();
    const flat = o.flat || 0, rate = o.rate || 1.2, amp = o.amp || 1;
    for (let i = 0; i <= 140; i++) {
      const px = -144 + i * 288 / 140; const u = i / 140 * 3 + t * rate;
      const ph = u - Math.floor(u); let v = 0;
      if (ph > .30 && ph < .34) v = -12; else if (ph > .40 && ph < .43) v = 20; else if (ph > .43 && ph < .47) v = -62; else if (ph > .47 && ph < .50) v = 26; else if (ph > .62 && ph < .72) v = -10 * Math.sin((ph - .62) / .1 * Math.PI);
      if (o.irregular) v *= .5 + hash(Math.floor(u) * 3.7) * .9;
      v *= amp * (1 - flat);
      const py = 20 + v + (hash(i * 9.1) - .5) * 2;
      i ? X.lineTo(px, py) : X.moveTo(px, py);
    }
    X.stroke(); X.restore();
    if (o.badge) { shape(RR(60, -88, 80, 40, 8), { fill: YEL, stroke: null, seed: 244 }); txt(o.badge, 100, -66, { size: 32 }); }
    if (o.alarm) alarmLines(150, -110, o.alarm);
  });
}
function crib(x, y, w, s = 1, o = {}) {
  // y = floor
  at(x, y, s, 0, () => {
    const h = 300, top = -h;
    line([[-w / 2, -40], [-w / 2, top]], { lw: 6, seed: 250 }); line([[w / 2, -40], [w / 2, top]], { lw: 6, seed: 251 });
    shape(RR(-w / 2 + 4, -150, w - 8, 30, 8), { fill: '#fff', lw: 4.5, seed: 252 });
    shape(R(-w / 2 + 4, -120, w - 8, 18), { fill: '#cfcec8', hatch: 'mid', lw: 4, seed: 253 });
    for (const yy of [top + 6, -96, -54]) line([[-w / 2, yy], [w / 2, yy]], { lw: 4, seed: 254 + yy });
    const n = Math.round(w / 44);
    for (let i = 1; i < n; i++) { const bx = -w / 2 + w * i / n; line([[bx, top + 6], [bx, -150]], { lw: 3, seed: 260 + i, stroke: '#555' }); line([[bx, -96], [bx, -54]], { lw: 3, seed: 280 + i, stroke: '#555' }); }
    for (const sx of [-1, 1]) { shape(EL(sx * (w / 2 - 6), -20, 16, 16, 14), { fill: '#bbb', lw: 4, seed: 300 + sx }); }
    if (o.baby !== false) baby(-w * .12, -186, o.bs || 1, { blue: o.blue, gasp: o.gasp });
  });
}
function cabinet(x, y, s = 1, o = {}) {
  at(x, y, s, 0, () => {
    shape(R(-110, -260, 220, 260), { fill: '#fff', lw: 5, seed: 310 });
    shape(R(-124, -276, 248, 22), { fill: '#d0cfc9', hatch: 'mid', lw: 4.5, seed: 311 });
    for (const yy of [-176, -88]) { line([[-110, yy], [110, yy]], { lw: 4, seed: 312 + yy }); }
    for (const yy of [-218, -132, -44]) shape(RR(-34, yy - 7, 68, 14, 6), { fill: '#bdbcb6', lw: 3.5, seed: 320 + yy });
    if (o.items) {
      shape(R(42, -340, 40, 64), { fill: '#fff', lw: 4, seed: 330 }); shape(EL(62, -340, 22, 6, 12), { fill: '#fff', lw: 3.5, seed: 331 });
      if (o.syr) syringe(-34, -296, .22, { label: true });
    }
  });
}
function clock(x, y, r, hours, o = {}) {
  at(x, y, 1, 0, () => {
    shape(EL(0, 0, r, r, 40), { fill: '#fff', lw: 5, seed: 340 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line([[Math.cos(a) * r * .8, Math.sin(a) * r * .8], [Math.cos(a) * r * .9, Math.sin(a) * r * .9]], { lw: 3, seed: 341 + i }); }
    const hA = (hours % 12) / 12 * Math.PI * 2 - Math.PI / 2, mA = (hours % 1) * Math.PI * 2 - Math.PI / 2;
    X.strokeStyle = INK; X.lineCap = 'round';
    X.lineWidth = 7; X.beginPath(); X.moveTo(0, 0); X.lineTo(Math.cos(hA) * r * .5, Math.sin(hA) * r * .5); X.stroke();
    X.lineWidth = 4.5; X.beginPath(); X.moveTo(0, 0); X.lineTo(Math.cos(mA) * r * .78, Math.sin(mA) * r * .78); X.stroke();
    dotFill(0, 0, 6);
  });
}
function calendar(x, y, s, o = {}) {
  at(x, y, s, o.rot || 0, () => {
    const p = R(-120, -120, 240, 250); shadowShape(p, 6, 7, .14);
    shape(p, { fill: '#fff', lw: 5, seed: 350 });
    shape(R(-120, -120, 240, 44), { fill: '#d0cfc9', hatch: 'mid', lw: 5, seed: 351 });
    for (const sx of [-60, 60]) shape(RR(sx - 7, -140, 14, 40, 6), { fill: '#fff', lw: 4, seed: 352 + sx });
    txt(o.day || '23', 0, 20, { size: 120 });
    txt(o.month || 'August 2011', 0, 100, { size: 28, fam: SANS, weight: 900 });
  });
}
function gavel(x, y, s, rot = 0) {
  at(x, y, s, rot, () => {
    shape(R(-6, -10, 150, 20), { fill: '#bdbcb6', hatch: 'mid', lw: 4, seed: 360 });
    shape(RR(-40, -40, 50, 80, 8), { fill: '#a9a8a2', hatch: 'mid', lw: 4.5, seed: 361 });
  });
}
function door(x, y, s = 1, open = 0) {
  at(x, y, s, 0, () => {
    shape(R(-130, -560, 260, 560), { fill: '#e2e1db', lw: 6, seed: 370 });
    shape(R(-112, -542, 224, 542), { fill: '#fff', lw: 4.5, seed: 371 });
    shape(EL(80, -270, 12, 12, 12), { fill: '#bdbcb6', lw: 4, seed: 372 });
    if (open > 0) { X.save(); X.globalAlpha *= open; tracePath(R(-112, -542, 224, 542), true); X.fillStyle = '#d7d6cf'; X.fill(); X.restore(); }
  });
}
function stamp(x, y, k, text, sub) {
  if (k <= 0) return;
  at(x, y, k, -.12, () => {
    const w = tw(text, 92) + 80, h = 150;
    const p = RR(-w / 2, -h / 2, w, h, 14); shadowShape(p, 7, 8, .2);
    shape(p, { fill: '#fff', lw: 7, seed: 380 });
    shape(RR(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 8), { stroke: INK, lw: 3, seed: 381 });
    txt(text, 0, -6, { size: 92 });
    if (sub) txt(sub, 0, 50, { size: 26, fam: SANS, weight: 900 });
  });
}
function qmark(x, y, s, a = 1) { X.save(); X.globalAlpha *= a; txt('?', x, y, { size: 70 * s, fam: SANS, weight: 900 }); X.restore(); }
function pin(x, y, s) {
  at(x, y, s, 0, () => {
    const p = [[0, 0], [-26, -44], [-30, -70], [-16, -92], [0, -98], [16, -92], [30, -70], [26, -44]];
    shape(p, { fill: YEL, lw: 4.5, seed: 390 }); shape(EL(0, -66, 11, 11, 12), { fill: '#fff', lw: 3.5, seed: 391 });
  });
}
const GERMANY = [[.42, 0], [.50, .02], [.52, .08], [.58, .10], [.66, .08], [.75, .05], [.82, .08], [.84, .14], [.86, .25], [.88, .34], [.92, .42], [.90, .50], [.94, .56], [.86, .60], [.76, .62], [.72, .66], [.78, .74], [.84, .82], [.86, .88], [.80, .92], [.82, .98], [.70, .97], [.60, 1.0], [.48, .98], [.38, .99], [.30, .96], [.24, .97], [.25, .88], [.28, .80], [.20, .76], [.14, .72], [.12, .66], [.10, .58], [.06, .52], [.08, .46], [.04, .42], [.06, .34], [.10, .30], [.10, .22], [.14, .18], [.22, .17], [.28, .15], [.33, .10], [.36, .04], [.40, .02]];
function germany(x, y, w, h, prog = 1) {
  const pts = GERMANY.map(([u, v]) => [x + u * w, y + v * h]);
  if (prog >= 1) shadowShape(pts, 7, 8, .12);
  shape(pts, { fill: prog >= 1 ? '#d6d5cf' : null, hatch: prog >= 1 ? 'mid' : null, lw: 5, seed: 400, prog });
}
function checkbox(x, y, n, k) { popAt(x, y, k, () => { const p = RR(-30, -30, 60, 60, 10); shadowShape(p, 4, 5, .14); shape(p, { fill: YEL, lw: 4.5, seed: 410 + n }); txt(String(n), 0, 4, { size: 40 }); }); }
function wordBox(x, y, w, h, text, o = {}) {
  const k = o.k ?? 1; if (k <= 0) return;
  at(x, y, k, 0, () => {
    const p = RR(-w / 2, -h / 2, w, h, 14); shadowShape(p, 6, 7, .16);
    shape(p, { fill: o.yel ? YEL : '#fff', hatch: o.yel ? 'yel' : null, lw: 5, seed: 420 + (o.seed || 0) });
    if (text) txt(text, 0, 6, { size: o.size || 64 });
  });
}

// IV drip: pole + bag + tube to a 3-way port, then into the crib. flow 0..1 = syrup advancing from port to baby
const IV_TUBE = [[640, 1150], [612, 1196], [560, 1214], [480, 1200], [400, 1178], [322, 1166]];
function ivSet(flow = 0, o = {}) {
  // pole
  line([[596, 1344], [596, 560]], { lw: 9, seed: 760 }); line([[596, 1344], [596, 560]], { lw: 3, stroke: '#ddd', seed: 760 });
  line([[560, 560], [632, 560]], { lw: 6, seed: 761 });
  shape(RR(540, 1336, 112, 16, 6), { fill: '#bdbcb6', hatch: 'mid', lw: 4, seed: 762 });
  // bag
  shape(RR(548, 574, 96, 150, 18), { fill: '#eef3f6', lw: 4.5, seed: 763 });
  X.save(); tracePath(R(554, 640, 84, 78), true); X.fillStyle = '#d6e2ea'; X.fill(); X.restore();
  txt('IV', 596, 610, { size: 30 });
  shape(R(586, 724, 20, 40), { fill: '#fff', lw: 3.5, seed: 764 });
  // tube from bag to port
  const up = [[596, 764], [606, 900], [630, 1040], [640, 1136]];
  tube(up, 0);
  tube(IV_TUBE, flow);
  // tape on the baby's hand
  at(322, 1166, 1, -.3, () => { X.fillStyle = 'rgba(160,160,155,.8)'; X.fillRect(-16, -9, 32, 18); });
  // 3-way port
  shape(RR(626, 1136, 30, 28, 6), { fill: '#fff', lw: 4, seed: 765 });
  shape(R(632, 1112, 18, 24), { fill: YEL, lw: 3.5, seed: 766 });
}
function tube(pts, flow) {
  const p = wobble(pts, false, 770 + pts.length, .8);
  X.save(); X.lineCap = 'round'; X.lineJoin = 'round';
  tracePath(p, false); X.strokeStyle = INK; X.lineWidth = 13; X.stroke();
  tracePath(p, false); X.strokeStyle = '#cfdae2'; X.lineWidth = 6; X.stroke();
  if (flow > 0) {
    const q = partial(p, false, flow);
    tracePath(q, false); X.strokeStyle = '#fffaf0'; X.lineWidth = 7; X.stroke();
    const h = q[q.length - 1];
    if (flow < 1) { X.beginPath(); X.arc(h[0], h[1], 11, 0, 6.283); X.fillStyle = YEL; X.fill(); X.lineWidth = 3; X.strokeStyle = INK; X.stroke(); }
  }
  X.restore();
}
