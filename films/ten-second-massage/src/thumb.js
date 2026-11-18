// Reel cover / thumbnail, 1080×1920, drawn with the film's rig and room.
// Key content sits inside the centre 1080×1350 so the Instagram grid crop (4:5) keeps it.
import { P, F, rgba, circ, line, text, tmp, TAU, fillRR, rr, poly, bloom, vignette, paperGrain, wash } from './kit.js';
import { drawChar, pose } from './rig.js';
import { X, HIM, HER } from './cast.js';
import { mkL } from './shots.js';
import * as RM from './room.js';

const L = mkL(.62, .78, { rim: '#FFE7B0', rimA: 1, rimW: 6, shadeA: .26, shadow: null });
function star(g, x, y, r, col = '#FFF4D0', rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, q = i % 2 ? r * .22 : r; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  g.closePath(); g.fillStyle = col; g.fill(); g.restore();
}
function stopwatch(g, x, y, r, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  circ(g, 8, 12, r + 16, rgba(P.night, .35));
  fillRR(g, -20, -r - 44, 40, 30, 8, P.ink); fillRR(g, -12, -r - 56, 24, 16, 6, P.rust);
  circ(g, 0, 0, r + 14, P.ink); circ(g, 0, 0, r, P.paper);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(g, Math.sin(a) * r * .8, -Math.cos(a) * r * .8, Math.sin(a) * r * .93, -Math.cos(a) * r * .93, P.ink, i % 3 ? 3 : 6); }
  g.fillStyle = rgba(P.rust, .28); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .9, -Math.PI / 2, -Math.PI / 2 + TAU * 10 / 60); g.closePath(); g.fill();
  line(g, 0, 0, Math.sin(TAU * 10 / 60) * r * .78, -Math.cos(TAU * 10 / 60) * r * .78, P.rust, 7);
  circ(g, 0, 0, 8, P.rust);
  text(g, '0:10', 0, r * .42, { size: r * .5, col: P.ink });
  g.restore();
}
export function drawThumb(g, t, W, H) {
  // the room, warm and out of focus
  const bg = tmp('thumb_bg', W, H);
  bg.save(); bg.translate(540, 960); bg.scale(2.1, 2.1); bg.translate(-600, -900);
  const D = RM.roomBack(bg, 2, 3, { birdOn: true }); RM.plant(bg, 2, 30, 1330); RM.couchBack(bg, 2, D); RM.couchFront(bg, 2, D); RM.air(bg, 2, D);
  bg.restore();
  g.save(); g.filter = 'blur(9px) saturate(1.15)'; g.drawImage(bg.canvas, 0, 0); g.restore();
  // a golden glow behind him: the champion
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = (() => { const gr = g.createRadialGradient(470, 740, 30, 470, 740, 640); gr.addColorStop(0, rgba('#FFE9A8', .95)); gr.addColorStop(.45, rgba('#FFC870', .45)); gr.addColorStop(1, 'rgba(0,0,0,0)'); return gr; })(); g.fillRect(0, 0, W, H); g.restore();
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r0 = 300, r1 = 780; g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .16; poly(g, [[470 + Math.cos(a - .05) * r0, 700 + Math.sin(a - .05) * r0], [470 + Math.cos(a + .05) * r0, 700 + Math.sin(a + .05) * r0], [470 + Math.cos(a + .09) * r1, 700 + Math.sin(a + .09) * r1], [470 + Math.cos(a - .09) * r1, 700 + Math.sin(a - .09) * r1]]); g.fillStyle = '#FFF0C0'; g.fill(); g.restore(); }
  // HIM: double-biceps flex, eyes shut with pride
  const him = pose(HIM, { shrug: .6, sq: .04, head: { tilt: -.07, nod: -.12 }, e: { ...X.proud, mW: 1.3, mO: .5, blush: .5 },
    aL: { a: -1.66, b: -1.62, hand: 'fist', z: 1 }, aR: { a: 1.66, b: 1.62, hand: 'fist', z: 1 } });
  drawChar(g, HIM, { ...him, x: 470, y: 1700, s: 2.25 }, L, { noShadow: true });
  for (const [x, y, r, k] of [[170, 560, 34, .2], [790, 560, 26, .6], [830, 760, 18, 1], [130, 820, 20, .4]]) star(g, x, y, r, '#FFF6D6', k);
  // the couch back, in front of him (he stands behind it, as in the film)
  const cb = tmp('thumb_couch', W, H);
  cb.fillStyle = '#3F7774'; rr(cb, -60, 1215, W + 120, 900, 70); cb.fill();
  cb.fillStyle = '#4F8A87'; rr(cb, -40, 1240, W * .52, 900, 60); cb.fill(); rr(cb, W * .5, 1240, W * .54, 900, 60); cb.fill();
  cb.fillStyle = 'rgba(255,240,200,.16)'; rr(cb, -40, 1240, W * .52, 120, 60); cb.fill(); rr(cb, W * .5, 1240, W * .54, 120, 60); cb.fill();
  g.save(); g.filter = 'blur(2.5px)'; g.drawImage(cb.canvas, 0, 0); g.restore();
  // HER: in front, big, one eyebrow up, side-eye at him
  const her = pose(HER, { face: -.18, head: { turn: -.42, tilt: .1, nod: -.1 }, shrug: .1,
    e: { ...X.unimpressed, lidT: .5, browAsym: 1.5, gx: -.9, gy: -.9, mO: .08, mW: .4, mS: -.38 } });
  drawChar(g, HER, { ...her, x: 690, y: 2440, s: 2.75 }, mkL(.62, .78, { rim: '#FFE7B0', rimA: 1, rimW: 6, shadeA: .3, shadow: null }), { noShadow: true });
  // the sticker
  stopwatch(g, 900, 985, 88, .18);
  // title
  g.save(); g.translate(540, 400); g.rotate(-.04);
  const T = 'HER TURN.';
  text(g, T, 12, 16, { size: 190, col: rgba(P.night, .75) });
  text(g, T, 0, 0, { size: 190, col: '#FFD35E', stroke: P.indigo, sw: 26 });
  text(g, T, 0, 0, { size: 190, col: '#FFD35E' });
  g.restore();
  // finish: bloom, vignette, grain, a touch more punch for the feed
  bloom(g, W, H, .16); vignette(g, W, H, .42, P.night, .5, .48, .42); paperGrain(g, W, H, .1);
  const c = tmp('thumb_out', W, H); c.filter = 'saturate(1.12) contrast(1.06)'; c.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c.canvas, 0, 0); g.restore();
}
