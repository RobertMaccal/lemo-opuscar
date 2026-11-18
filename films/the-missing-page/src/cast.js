// The cast of THE MISSING PAGE: dimensions, suits, hair, resting posture, the expression library, extra hair styles and props.
import { P, dark, lite, rgba, rr, poly, circ, line, fillR, text, F, TAU, clamp } from './kit.js';
import { DIMS, HAIR, PROPS } from './rig.js';

// ---- expressions (overrides on EXPR0) ----
export const X = {
  neutral: {},
  happy: { mS: .95, mO: .32, lidB: .22, browH: .35, browC: .5 },
  worried: { lidT: 0, lidB: 0, lidAng: 0, browA: .75, browH: .3, mS: -.55, mW: .8, gy: .15, sweat: .3 },
  anxious: { lidT: 0, lidB: 0, lidAng: 0, eyeOpen: 1.2, pup: .72, browA: .95, browH: .45, mWavy: 1, mW: 1.1, sweat: .8 },
  confused: { lidT: 0, lidB: 0, lidAng: 0, browAsym: .7, browA: .2, mS: -.2, mW: .6, mSkew: .6, gx: .35 },
  shocked: { lidT: 0, lidB: 0, lidAng: 0, eyeOpen: 1.45, pup: .42, browH: 1, browA: .3, mO: .62, mW: .5, mS: -.2, pale: .4 },
  horror: { lidT: 0, lidB: 0, lidAng: 0, eyeOpen: 1.62, pup: .26, browH: 1.1, browA: .85, mO: .8, mW: .62, mS: -.6, pale: .8, sweat: .9, gloom: .35 },
  hollow: { lidT: 0, lidB: 0, lidAng: 0, eyeOpen: 1.3, pup: .2, browA: .55, browH: .5, mO: .12, mW: .34, mS: -.1, gloom: .9, pale: .85 },
  exhausted: { lidT: .55, lidAng: -.22, browA: .55, browH: -.1, mO: .5, mW: .7, mS: -.5, sweat: .85, gy: .25 },
  deadpan: { lidT: .5, browH: -.35, browC: 0, mS: 0, mW: .55 },
  determined: { browA: -.7, browH: -.25, mTeeth: 1, mW: .8, lidT: .16, lidAng: .3, sweat: .5 },
  smug: { lidT: .3, lidAng: .22, browA: -.3, browAsym: .35, mS: 1, mW: 1.05, mSkew: .5, lidB: .25, gx: .6 },
  cocky: { lidT: .22, lidAng: .18, browA: -.2, browAsym: .55, browH: .2, mS: 1.1, mW: 1.1, mSkew: .6, mO: .1, lidB: .2 },
  proud: { lidT: .35, lidB: .3, browH: .25, browC: .5, mS: 1, mW: .95, mSkew: .25 },
  chill: { lidT: .4, browH: -.05, browC: .1, mS: .55, mW: .7, mSkew: .3 },
  gulp: { lidT: 0, lidB: 0, lidAng: 0, eyeOpen: 1.15, pup: .7, browA: .8, browH: .35, mS: -.3, mW: .45, sweat: .7 },
  tired: { lidT: .38, lidAng: -.12, browH: -.15, mS: -.2, mW: .7 },
  sincere: { lidT: .26, browA: .45, browH: .15, mS: -.05, mW: .7 },
  stern: { lidT: .25, lidAng: .22, browA: -.55, browH: -.2, mS: -.35, mW: .7 },
  bark: { browA: -.6, mO: .7, mW: .9, mS: -.1, browH: .05, lidT: .15, lidAng: .25 },
  brow: { lidT: .3, lidAng: .18, browA: -.35, browAsym: 1.15, browH: -.05, mS: -.3, mW: .6, mSkew: .3 },
  nod: { lidT: .32, browA: -.2, mS: .1, mW: .6 },
  baffled: { lidT: 0, lidB: 0, lidAng: 0, eyeOpen: 1.1, browAsym: 1.0, browA: .3, browH: .45, mS: -.3, mW: .5, mSkew: .7, mO: .12 },
};

// ---- extra hair (head space, R = 1; tx = how far the face has turned) ----
const pol = (deg, r) => [Math.sin(deg * Math.PI / 180) * r, -Math.cos(deg * Math.PI / 180) * r];
// neat styled quiff, swept up and to one side (the Candidate)
HAIR.quiff = (g, tx, col) => {
  g.fillStyle = col; g.beginPath(); const o = []; for (let d = -104; d <= 104; d += 8) o.push(pol(d + tx * 5, 1.06 + Math.max(0, Math.sin((d + 40) / 64)) * .18 * (d > -60 && d < 70 ? 1 : 0)));
  o.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
  g.quadraticCurveTo(.92 + tx * .1, -.44, .64 + tx * .15, -.64); g.quadraticCurveTo(.1 + tx * .15, -.86, -.34 + tx * .15, -.62); g.quadraticCurveTo(-.78, -.56, o[0][0], o[0][1]); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-.2 + tx * .1, -1.06); g.quadraticCurveTo(.4 + tx * .1, -1.46, 1.0 + tx * .1, -1.08); g.quadraticCurveTo(.7 + tx * .1, -1.12, .36 + tx * .1, -.94); g.closePath(); g.fill();
  g.strokeStyle = rgba('#FFFFFF', .22); g.lineWidth = .05; g.lineCap = 'round'; g.beginPath(); g.moveTo(.0 + tx * .1, -1.12); g.quadraticCurveTo(.4 + tx * .1, -1.3, .72 + tx * .1, -1.12); g.stroke();
};
// short, flat, hard side parting (the Examiner)
HAIR.side = (g, tx, col) => {
  g.fillStyle = col; g.beginPath(); const o = []; for (let d = -102; d <= 102; d += 8) o.push(pol(d + tx * 5, 1.05));
  o.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
  g.quadraticCurveTo(.9, -.5, .55 + tx * .15, -.72); g.lineTo(-.25 + tx * .15, -.8); g.quadraticCurveTo(-.8, -.66, o[0][0], o[0][1]); g.closePath(); g.fill();
  g.strokeStyle = rgba('#FFFFFF', .3); g.lineWidth = .04; g.beginPath(); g.moveTo(-.38 + tx * .2, -.94); g.lineTo(-.2 + tx * .2, -.8); g.stroke();
  for (const s of [-1, 1]) { g.fillStyle = col; g.beginPath(); g.ellipse(s * .98, -.12, .1, .28, 0, 0, TAU); g.fill(); }
};
// simple neat crop with a soft fringe (the Second Candidate)
HAIR.crop = (g, tx, col) => {
  g.fillStyle = col; g.beginPath(); const o = []; for (let d = -100; d <= 100; d += 10) o.push(pol(d + tx * 5, 1.07));
  o.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
  [[.86, -.48], [.6, -.62], [.42, -.55], [.18, -.66], [-.06, -.58], [-.3, -.68], [-.56, -.58], [-.86, -.48]].forEach(([x, y]) => g.lineTo(x + tx * .14, y)); g.closePath(); g.fill();
};
HAIR.buzz = (g, tx, col) => { g.fillStyle = col; g.beginPath(); for (let d = -98; d <= 98; d += 8) { const q = pol(d + tx * 4, 1.02); d === -98 ? g.moveTo(q[0], q[1]) : g.lineTo(q[0], q[1]); } g.quadraticCurveTo(tx * .2, -.72, pol(-98, 1.02)[0], pol(-98, 1.02)[1]); g.closePath(); g.fill(); };

// ---- props held in a hand: (x, y) hand centre ----
// the exam: one sheet, face up (o.side 'front' | 'back' | 'blank')
export function sheetFace(g, w, h, side = 'front', o = {}) {
  rr(g, -w / 2, -h / 2, w, h, w * .02); g.fillStyle = o.col || P.paper; g.fill(); g.lineWidth = Math.max(1.5, w * .012); g.strokeStyle = P.ink; g.stroke();
  const k = w / 100, lc = rgba(P.lavDeep, .55);
  if (side === 'front') {
    fillR(g, -w * .4, -h * .44, w * .8, h * .045, P.ink);
    for (let i = 0; i < 6; i++) { const y = -h * .3 + i * h * .12; fillR(g, -w * .4, y, w * (.5 - (i % 3) * .08), h * .018, lc); if (o.filled) { g.strokeStyle = rgba('#2E4FA0', .85); g.lineWidth = Math.max(1, k * .9); g.beginPath(); for (let j = 0; j < 7; j++) { const x = -w * .38 + j * w * .1; g.lineTo(x, y + h * .06 + Math.sin(j * 2.3 + i) * h * .008); } g.stroke(); } }
  } else {
    fillR(g, -w * .4, -h * .44, w * .8, h * .045, P.ink);
    for (let i = 0; i < 6; i++) { const y = -h * .3 + i * h * .12; fillR(g, -w * .4, y, w * (.55 - (i % 2) * .1), h * .018, lc); g.strokeStyle = rgba(P.lavDeep, .4); g.lineWidth = Math.max(1, k * .5); g.strokeRect(-w * .38, y + h * .03, w * .76, h * .06); if (o.filled) { g.strokeStyle = rgba('#5E4E2A', .85); g.lineWidth = Math.max(1, k * .9); g.beginPath(); for (let j = 0; j < 6; j++) g.lineTo(-w * .34 + j * w * .11, y + h * .06 + Math.sin(j * 1.7 + i) * h * .008); g.stroke(); } }
  }
}
PROPS.sheet = (g, x, y, fa, o) => { g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.r || 0); g.scale(o.sx ?? 1, 1); g.translate(0, -(o.h || 96) * .42); sheetFace(g, o.w || 74, o.h || 96, o.side || 'front', o); g.restore(); };
PROPS.stack = (g, x, y, fa, o) => {
  g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.r || 0); const w = o.w || 96, n = o.n ?? 10, th = 3.2;
  for (let i = n; i >= 0; i--) { rr(g, -w / 2 + (i % 2) * 2, -i * th - 8, w, 18, 2); g.fillStyle = i ? (i % 2 ? P.paper : '#EFE5CF') : P.paper; g.fill(); g.lineWidth = 2; g.strokeStyle = rgba(P.ink, .7); g.stroke(); }
  g.restore();
};
PROPS.pen = (g, x, y, fa, o) => { g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.r ?? -.5); line(g, 0, -30, 0, 28, o.col || '#1E2236', 7, 'butt'); line(g, 0, -34, 0, -24, P.gold, 7, 'butt'); line(g, 3, -30, 3, -14, P.gold, 2.5, 'butt'); poly(g, [[-3.5, 28], [3.5, 28], [0, 38]]); g.fillStyle = '#B8B2A8'; g.fill(); g.restore(); };
PROPS.folder = (g, x, y, fa, o) => { g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.r || 0); rr(g, -44, -58, 88, 116, 5); g.fillStyle = o.col || '#5E3B2E'; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke(); fillR(g, -38, -6, 76, 4, rgba(P.gold, .6)); g.restore(); };

// ---- characters ----
const mk = o => ({ ...DIMS, skin: P.skin, collar: P.white, inner: P.white, kind: 'open', ...o });
export const C = {
  examCharcoal: '#2E2C38', candBlue: '#2C55A8', secondOlive: '#7C6B3E',
};
// the Examiner: tall, broad, charcoal suit, dark red tie
export const EXAM = mk({
  name: 'EXAMINER', R: 70, torso: 182, sw: 62, hw: 38, ul: 114, ll: 114, ua: 80, fa: 76, armW: 28, legW: 30, hand: 15,
  top: C.examCharcoal, tie: '#962330', buttons: true, pants: '#25232D', shoe: '#1B1922', sole: '#55505E', hair: 'side', hairCol: '#2A2533', browW: .12,
  face: X.stern, rest: { shrug: -.15, head: { oy: 2 } },
});
// the Candidate: deep-blue suit, neat quiff, smug
export const CAND = mk({
  name: 'CANDIDATE', R: 78, torso: 152, sw: 53, hw: 34, ul: 96, ll: 96, ua: 70, fa: 66,
  top: C.candBlue, tie: '#1B2347', pants: '#223A78', shoe: '#2A2131', sole: '#6E6578', hair: 'quiff', hairCol: '#221E3A',
  face: { ...X.chill, mS: .7 }, rest: { shrug: -.05 },
});
// the Second Candidate: olive-brown suit, tired, folder
export const SECOND = mk({
  name: 'SECOND', R: 76, torso: 150, sw: 51, hw: 34, ul: 94, ll: 94, ua: 70, fa: 66,
  top: C.secondOlive, tie: '#4A3A2A', pants: '#4E4532', shoe: '#4A3426', sole: '#7A6A5A', hair: 'crop', hairCol: '#3A2A24',
  face: X.tired, rest: { shrug: .15, head: { oy: 3 } },
});
// background candidates: quieter suits, different hair and builds
const ext = (name, top, tie, hair, hairCol, o = {}) => mk({ name, top, tie, pants: dark(top, .25), shoe: '#2A2230', sole: '#6E6578', hair, hairCol, R: 74 + (o.r || 0), torso: 148 + (o.t || 0), sw: 50 + (o.w || 0), face: o.face || {}, rest: {}, ...o.x });
export const EXTRAS = [
  ext('X1', '#5B6478', '#7A3B3B', 'short', '#3A2A30', { r: 2, face: X.gulp }),
  ext('X2', '#6E4A52', '#2E2A44', 'curly', '#2A2238', { w: 3, face: X.worried }),
  ext('X3', '#4E6A6A', '#B88A3C', 'buzz', '#4A3A34', { t: 6, face: X.anxious }),
  ext('X4', '#7A6E62', '#3B4E6E', 'tousled', '#5A3A2A', { r: -2, face: X.gulp }),
  ext('X5', '#4A4A5E', '#8A5A2A', 'prof', '#8E8494', { r: -4, t: 10, face: X.worried, x: { browCol: '#6E6878', glasses: true } }),
  ext('X6', '#6A5E7A', '#C7A05A', 'messy', '#2A2238', { face: X.anxious }),
  ext('X7', '#5E6E58', '#5A2E3A', 'side', '#3A3040', { w: 4, face: X.worried }),
];
export const CAST = { EXAM, CAND, SECOND };
export const WHO_COL = { EXAMINER: '#962330', CANDIDATE: C.candBlue, SECOND: '#8C7A44' };
