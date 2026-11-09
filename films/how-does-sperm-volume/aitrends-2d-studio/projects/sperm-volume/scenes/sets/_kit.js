// _kit.js — shared props and diagrams for this film (helpers; imported by shots).
import { E, V, S, ease, prog, clamp, lerp, seg, circle, ring, rr, poly, glow, alpha, text, FONTS, linGrad, shade, mix } from '/engine/core.js';
export const C = { bp: '#8fb8e8', cream: '#f4efe6', amber: '#ffb84a', teal: '#2fd0b0', coral: '#ff6f61', gold: '#ffd47e', bg: '#0b1324' };

// ---------- paths ----------
export function pathLen(pts) { let L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
export function pathPt(pts, u) { const L = pathLen(pts), d = clamp(u) * L[L.length - 1]; for (let i = 1; i < pts.length; i++) if (d <= L[i]) { const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; } return pts[pts.length - 1]; }
// smooth a control polygon (Catmull-Rom) into a dense polyline
export function smooth(ctrl, n = 14) { const out = []; for (let i = 0; i < ctrl.length - 1; i++) { const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
  for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
  out.push(ctrl[ctrl.length - 1]); return out; }
export function strokePath(g, pts, w, col, upto = 1) { const L = pathLen(pts), D = L[L.length - 1] * clamp(upto); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) { if (L[i] <= D) g.lineTo(pts[i][0], pts[i][1]); else { const k = (D - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); if (k > 0) g.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); break; } } g.stroke(); }

// ---------- tiny sperm cell (head + wiggling tail), dir = heading angle ----------
export function sperm(g, x, y, ang, t, s = 1, col = C.cream, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(ang); g.strokeStyle = alpha(col, 0.85); g.lineWidth = 2.2 * s; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= 10; i++) { const u = i / 10, xx = -6 * s - u * 26 * s, yy = Math.sin(t * 18 - u * 6) * 4 * s * u; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
  g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 7 * s, 4.6 * s, 0, 0, 7); g.fill(); g.restore(); }

// ---------- the VOLUME CYLINDER: fills {sperm, prostate, sv} in 0..1 of their own band ----------
export const SHARE = { sperm: 0.05, prostate: 0.3, sv: 0.65 };
export function cylinder(g, x, yb, w, h, f = {}, o = {}) {
  const a = o.a ?? 1, t = o.t ?? 0; g.save(); g.globalAlpha *= a;
  const inner = (yy, hh) => { g.save(); rr(g, x - w / 2 + 6, yb - h, w - 12, h - 6, 14); g.clip(); return () => g.restore(); };
  // glass back
  rr(g, x - w / 2, yb - h, w, h, 18); g.fillStyle = 'rgba(143,184,232,.06)'; g.fill();
  const undo = inner(); let y = yb - 6;
  const band = (frac, col, hi) => { if (frac <= 0) return; const hh = (h - 30) * frac; g.fillStyle = linGrad(g, x - w / 2, 0, x + w / 2, 0, [shade(col, -0.25), col, shade(col, -0.15)]); g.fillRect(x - w / 2, y - hh, w, hh);
    g.fillStyle = alpha(hi, 0.5); g.fillRect(x - w / 2, y - hh, w, 3); y -= hh; };
  band(SHARE.sperm * (f.sperm ?? 0), '#e8e0d0', '#ffffff');
  const spTop = y;
  band(SHARE.prostate * (f.prostate ?? 0), C.teal, '#b9fff0');
  band(SHARE.sv * (f.sv ?? 0), C.amber, '#ffe9b8');
  // swimming dots inside the sperm sliver
  if ((f.sperm ?? 0) > 0.2) for (let i = 0; i < 7; i++) { const px = x - w / 2 + 20 + ((i * 53 + t * 40 * (i % 2 ? 1 : -1)) % (w - 40) + (w - 40)) % (w - 40); sperm(g, px, yb - 6 - (yb - 6 - spTop) * 0.5, i % 2 ? 0 : Math.PI, t + i, 0.45); }
  undo();
  // glass outline + ticks
  g.strokeStyle = alpha(C.bp, 0.9); g.lineWidth = 4; rr(g, x - w / 2, yb - h, w, h, 18); g.stroke();
  for (let k = 1; k < 10; k++) seg(g, [[x - w / 2 + 6, yb - 6 - (h - 30) * k / 10], [x - w / 2 + (k % 5 ? 26 : 46), yb - 6 - (h - 30) * k / 10]], 2, alpha(C.bp, 0.7));
  seg(g, [[x - w / 2 - 14, yb - h], [x + w / 2 + 14, yb - h]], 6, alpha(C.bp, 0.9));
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + w * 0.22, yb - h + 20, w * 0.08, h - 50);
  g.restore(); return { spTop };
}

// ---------- the anatomy schematic (9:16 logical coords; clinical side view, anterior = right) ----------
export function anat() {
  const cx = E.W / 2, s = 1;
  const A = {
    bladder: { x: cx + 20, y: 640, rx: 190, ry: 165 },
    neck: [cx + 20, 805],
    prostate: { x: cx + 20, y: 885, rx: 100, ry: 78 },
    sv: [[cx - 120, 610], [cx - 170, 700], [cx - 130, 790], [cx - 60, 845]],          // lobe centre-line (behind bladder)
    testis: { x: cx + 10, y: 1290, rx: 78, ry: 100 },
    epi: [[cx - 70, 1215], [cx - 92, 1260], [cx - 88, 1320], [cx - 70, 1385], [cx - 40, 1405]],
  };
  A.urethra = smooth([A.neck, [cx + 20, 900], [cx + 22, 975], [cx + 70, 1060], [cx + 170, 1110], [cx + 290, 1135]]);
  A.vas = smooth([[cx - 40, 1405], [cx + 110, 1330], [cx + 190, 1140], [cx + 240, 820], [cx + 210, 520], [cx + 40, 445], [cx - 150, 500], [cx - 205, 620], [cx - 150, 760], [cx - 60, 850], [cx + 15, 905]]);
  A.svFlow = smooth([[cx - 170, 640], [cx - 175, 720], [cx - 120, 810], [cx - 55, 860], [cx + 15, 905]]);
  A.prFlow = smooth([[cx + 90, 870], [cx + 55, 895], [cx + 22, 910]]);
  A.out = A.urethra.slice(Math.floor(A.urethra.length * 0.14));
  return A;
}
export function drawAnat(g, A, o = {}) {
  const p = o.p ?? 1, col = o.col || C.bp, w = 4, glowSV = o.sv ?? 0, glowPr = o.pr ?? 0, glowT = o.testis ?? 0, dim = o.dim ?? 1;
  g.save(); g.globalAlpha *= dim;
  const ell = (e, k, fill) => { g.beginPath(); g.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, Math.PI * 2 * clamp(k)); if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  // seminal vesicles (lumpy lobe)
  if (glowSV > 0) { glow(g, A.sv[1][0], A.sv[1][1], 180, C.amber, 0.55 * glowSV); }
  const sv = smooth(A.sv, 10); strokePath(g, sv, 46, alpha(glowSV > 0 ? C.amber : col, 0.18 + 0.5 * glowSV), prog(p, 0.35, 0.6)); strokePath(g, sv, 3, col, prog(p, 0.35, 0.6));
  for (let i = 1; i < 5; i++) { const q = pathPt(sv, i / 5); if (p > 0.45 + i * 0.03) ring(g, q[0], q[1], 16, 3, alpha(col, 0.8)); }
  // bladder
  ell(A.bladder, prog(p, 0, 0.3), 'rgba(143,184,232,.06)');
  if (p > 0.3) text(g, 'BLADDER', A.bladder.x + 10, A.bladder.y, { size: 30, color: alpha(col, 0.55 * prog(p, 0.3, 0.5)), font: FONTS.ui, weight: 900, spacing: 3 });
  // prostate
  if (glowPr > 0) glow(g, A.prostate.x, A.prostate.y, 170, C.teal, 0.6 * glowPr);
  ell(A.prostate, prog(p, 0.2, 0.45), glowPr > 0 ? alpha(C.teal, 0.25 + 0.35 * glowPr) : 'rgba(143,184,232,.08)');
  // urethra (double line)
  strokePath(g, A.urethra, 22, alpha(col, 0.16), prog(p, 0.25, 0.55)); strokePath(g, A.urethra, 3, col, prog(p, 0.25, 0.55));
  // testis + epididymis
  if (glowT > 0) glow(g, A.testis.x, A.testis.y, 170, C.cream, 0.35 * glowT);
  ell(A.testis, prog(p, 0.45, 0.75), 'rgba(143,184,232,.07)');
  const epi = smooth(A.epi, 8); strokePath(g, epi, 26, alpha(col, 0.2), prog(p, 0.6, 0.8));
  for (let i = 0; i < 9; i++) { const q = pathPt(epi, i / 9); if (p > 0.62 + i * 0.015) { g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.arc(q[0], q[1], 11, 0, Math.PI * 1.6); g.stroke(); } }
  // vas deferens
  strokePath(g, A.vas, 3.5, alpha(col, 0.9), prog(p, 0.55, 1));
  g.restore();
}
// particles flowing along a path: n dots, speed, colour
export function flow(g, pts, t, o = {}) { const { n = 14, speed = 0.25, col = C.amber, r = 7, a = 1, from = 0, to = 1, kind = 'dot', seed = 0 } = o;
  for (let i = 0; i < n; i++) { const u = from + ((((i / n) + t * speed + seed * 0.13) % 1) + 1) % 1 * (to - from); const q = pathPt(pts, u), q2 = pathPt(pts, Math.min(1, u + 0.01));
    if (kind === 'sperm') sperm(g, q[0], q[1], Math.atan2(q2[1] - q[1], q2[0] - q[0]), t + i, 0.55, C.cream, a); else { glow(g, q[0], q[1], r * 3, col, 0.5 * a); circle(g, q[0], q[1], r, alpha(col, a)); } } }
export function label(g, str, x, y, a = 1, o = {}) { if (a <= 0) return; text(g, str, x, y, { size: o.size || 38, color: o.color || C.cream, font: FONTS.ui, weight: 900, spacing: 3, alpha: a, align: o.align || 'center', stroke: 8, strokeColor: 'rgba(5,10,20,.85)' }); }
export function magnifier(g, x, y, r, a, draw) { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = C.bg; g.fill(); g.save(); g.clip(); draw(); g.restore(); ring(g, x, y, r, 6, C.bp); ring(g, x, y, r + 10, 2, alpha(C.bp, 0.5)); g.restore(); }

// ---------- generic supplement bottle ----------
export function bottle(g, x, yb, s, str, col, o = {}) { const w = 110 * s, h = 170 * s; g.save(); g.globalAlpha *= o.a ?? 1;
  rr(g, x - w / 2, yb - h, w, h, 18 * s); g.fillStyle = linGrad(g, x - w / 2, 0, x + w / 2, 0, [shade(col, -0.35), col, shade(col, -0.2)]); g.fill();
  rr(g, x - w * 0.36, yb - h - 34 * s, w * 0.72, 38 * s, 8 * s); g.fillStyle = '#e9e4ef'; g.fill();
  rr(g, x - w * 0.42, yb - h * 0.68, w * 0.84, h * 0.4, 6 * s); g.fillStyle = '#f4efe6'; g.fill();
  text(g, str, x, yb - h * 0.48, { size: Math.min(30 * s, (w * 0.8) / Math.max(1, str.length * 0.62)), color: '#1a1622', font: FONTS.ui, weight: 900 });
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + w * 0.24, yb - h + 14 * s, 8 * s, h - 28 * s); g.restore(); }

// ---------- phone ad (tacky infomercial) ----------
export function adScreen(g, x, y, w, h, t, o = {}) { const glitch = o.glitch ?? 0;
  g.save(); rr(g, x - 14, y - 14, w + 28, h + 28, 46); g.fillStyle = '#0c0a10'; g.fill(); g.beginPath(); rr(g, x, y, w, h, 34); g.clip();
  g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#ff3d7f', '#ff9a2e', '#ffe14d']); g.fillRect(x, y, w, h);
  for (let i = 0; i < 12; i++) { g.save(); g.translate(x + w / 2, y + h * 0.42); g.rotate(i * Math.PI / 6 + t * 0.6); g.fillStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, -60); g.lineTo(w, 60); g.fill(); g.restore(); }
  const bounce = 1 + 0.06 * Math.sin(t * 9), jx = glitch ? Math.sin(t * 90) * 14 * glitch : 0;
  text(g, 'MORE', x + w / 2 + jx, y + h * 0.13, { size: w * 0.17 * bounce, color: '#fff', stroke: 10, strokeColor: '#7a0030', weight: 700 });
  text(g, 'VOLUME!', x + w / 2 - jx, y + h * 0.24, { size: w * 0.19 * bounce, color: '#fff36b', stroke: 12, strokeColor: '#7a0030', weight: 700 });
  // salesman (ink silhouette) with thumbs-up arm
  const sx = x + w * 0.5, sy = y + h * 0.86; g.fillStyle = '#1a1622'; rr(g, sx - w * 0.2, sy - h * 0.3, w * 0.4, h * 0.34, 40); g.fill(); circle(g, sx, sy - h * 0.38, w * 0.13, '#0e0b12');
  circle(g, sx - w * 0.045, sy - h * 0.39, w * 0.018, '#f4efe6'); circle(g, sx + w * 0.045, sy - h * 0.39, w * 0.018, '#f4efe6');
  g.strokeStyle = '#f4efe6'; g.lineWidth = w * 0.014; g.beginPath(); g.arc(sx, sy - h * 0.36, w * 0.05, 0.3, Math.PI - 0.3); g.stroke();
  poly(g, [[sx - w * 0.03, sy - h * 0.29], [sx + w * 0.03, sy - h * 0.29], [sx + w * 0.02, sy - h * 0.12], [sx, sy - h * 0.09], [sx - w * 0.02, sy - h * 0.12]], '#e67e22');
  seg(g, [[sx + w * 0.18, sy - h * 0.22], [sx + w * 0.32, sy - h * 0.34]], w * 0.06, '#1a1622'); circle(g, sx + w * 0.33, sy - h * 0.37, w * 0.045, '#0e0b12');
  // starburst sticker
  const st = (cx, cy, r, str, rot) => { g.save(); g.translate(cx, cy); g.rotate(rot + Math.sin(t * 7) * 0.08); const pts = []; for (let i = 0; i < 24; i++) { const rr2 = i % 2 ? r : r * 0.78, a = i * Math.PI / 12; pts.push([Math.cos(a) * rr2, Math.sin(a) * rr2]); } poly(g, pts, '#e6262f'); text(g, str, 0, 2, { size: r * 0.5, color: '#fff', weight: 700 }); g.restore(); };
  st(x + w * 0.22, y + h * 0.45, w * 0.17, '300%', -0.3); st(x + w * 0.8, y + h * 0.5, w * 0.14, 'WOW!', 0.25);
  if (glitch > 0) { for (let i = 0; i < 6; i++) { const yy = y + ((i * 211 + Math.floor(t * 24) * 97) % h); g.fillStyle = `rgba(${i % 2 ? '0,255,255' : '255,0,90'},${0.35 * glitch})`; g.fillRect(x, yy, w, 10 + (i % 3) * 8); } }
  g.restore(); }
