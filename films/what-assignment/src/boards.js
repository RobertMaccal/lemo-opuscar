// Preproduction boards and thumbnails, drawn with the film's own rig, set and light:  id → { file, w, h, t, draw(ctx, t, W, H) }
import { P, F, rgba, fillR, fillRR, rr, text, lg, vignette, bloom, wash, paperGrain, circ, line } from './kit.js';
import { drawChar, pose } from './rig.js';
import { X, RAY, KAI, light } from './cast.js';
import * as S from './sets.js';
import { renderFilm, keys, POS } from './film.js';
import { M, pk } from './anim.js';
import { mkL, seat } from './shots.js';

const L0 = mkL(.74, .6, { shadow: { kx: .55, ky: .12, a: .28, blur: 7, col: P.plum } });
// ---- model sheet: both leads, standing and seated, and the faces the film needs ----
function sheet(c, t, W, H) {
  fillR(c, 0, 0, W, H, P.paper);
  c.strokeStyle = rgba(P.lavLight, .5); c.lineWidth = 1.5; c.beginPath();
  for (let x = 40; x < W; x += 80) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 40; y < H; y += 80) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
  text(c, 'WHAT ASSIGNMENT? · MODEL SHEET', 84, 74, { size: 27, font: F.ui, weight: '600', col: P.lavDeep, align: 'left', ls: 4 });
  text(c, 'Ray & Kai', 80, 150, { size: 96, col: P.ink, align: 'left' });
  text(c, 'one knew about the exam. one knew about the assignment.', 86, 222, { size: 38, font: F.hand, col: P.inkSoft, align: 'left' });
  fillR(c, 84, 258, 300, 8, P.orange);
  const fl = 1180;
  fillRR(c, 60, 300, W - 120, fl - 300 + 60, 30, rgba('#F6D5A2', .5)); fillR(c, 60, fl, W - 120, 8, rgba(P.woodDark, .3));
  const st = (ch, x, o, s = 1.6, lab) => { drawChar(c, ch, { ...pose(ch, o), x, y: fl, s }, L0); if (lab) text(c, lab, x, fl + 56, { size: 30, font: F.ui, weight: '600', col: P.lavDeep }); };
  st(RAY, 260, { face: .0 }, 1.6, 'RAY · front'); st(RAY, 560, { face: .55, e: { gx: .5 } }, 1.6, '3/4');
  st(KAI, 900, { face: 0 }, 1.6, 'KAI · front'); st(KAI, 1200, { face: -.55, e: { ...X.chill, gx: -.5 } }, 1.6, '3/4');
  // expressions
  const faces = [[RAY, X.friendly, 'asks'], [RAY, X.huh, 'huh?'], [RAY, X.blank, 'blank'], [RAY, { ...X.doom }, 'doom'], [KAI, { ...X.chill, eyeOpen: .05 }, 'chill'], [KAI, X.deadpan, 'what exam?'], [KAI, X.proud, 'proud'], [KAI, { ...X.doom, lidT: 0 }, 'doom']];
  faces.forEach(([ch, e, lab], i) => {
    const x = 1520 + (i % 4) * 215, y = 640 + Math.floor(i / 4) * 400;
    c.save(); c.beginPath(); c.arc(x, y - 30, 104, 0, Math.PI * 2); c.clip();
    drawChar(c, ch, { ...pose(ch, { e }), x, y: y + 380, s: 1.0 }, L0, { noShadow: true }); c.restore();
    text(c, lab, x, y + 110, { size: 30, font: F.hand, col: P.ink });
  });
  // palette
  [['#221E3A', 'ink'], ['#F6EAD0', 'cream'], ['#FFCB7A', 'sun'], ['#5E9A97', 'teal'], ['#A79BC4', 'lavender'], [P.ray, 'RAY'], [P.kai, 'KAI']].forEach(([col, n], i) => {
    const x = 150 + i * 170; circ(c, x, fl + 150, 46, col); c.lineWidth = 4; c.strokeStyle = P.ink; c.beginPath(); c.arc(x, fl + 150, 46, 0, Math.PI * 2); c.stroke(); text(c, n, x, fl + 220, { size: 26, font: F.ui, col: P.inkSoft });
  });
  paperGrain(c, W, H, .1);
}

// ---- thumbnail text: big, stroked, tilted ----
function shout(c, s, x, y, size, rot, fill, { sw = 22 } = {}) {
  c.save(); c.translate(x, y); c.rotate(rot); c.font = `${size}px ${F.title}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = sw + 14; c.strokeStyle = rgba(P.night, .45); c.strokeText(s, 8, 12);
  c.lineWidth = sw; c.strokeStyle = P.ink; c.strokeText(s, 0, 0); c.fillStyle = fill; c.fillText(s, 0, 0); c.restore();
}
function doomPoses() { const k = keys(); return { rp: pk(RAY, M.hit + 1.2, k.ray), kp: pk(KAI, M.hit + 1.2, k.kai) }; }
// vertical thumbnail: the double stare, the clock, the question
function thumb(c, t, W, H) {
  renderFilm(c, M.hit + 1.0, { faces: true });                // the film's own frame of the stare, without captions in that window
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = .18; c.fillStyle = lg(c, 0, 0, 0, 700, ['#FFB867', 'rgba(0,0,0,0)']); c.fillRect(0, 0, W, 700); c.restore();
  shout(c, 'WHAT', 540, 300, 190, -.05, '#FFD84A');
  shout(c, 'ASSIGNMENT?!', 540, 470, 148, -.05, '#FFFFFF');
  // the setup on a paper label, low
  c.save(); c.translate(540, 1640); c.rotate(.02);
  fillRR(c, -440 + 10, -86 + 12, 880, 172, 18, rgba(P.night, .4)); fillRR(c, -440, -86, 880, 172, 18, P.paper); c.lineWidth = 6; c.strokeStyle = P.ink; rr(c, -440, -86, 880, 172, 18); c.stroke();
  text(c, '"did you study for the exam?"', 0, -20, { size: 54, col: P.ink }); text(c, '"what exam?"', 0, 44, { size: 50, col: '#C2512D' }); c.restore();
}
// wide thumbnail (16:9)
function thumbWide(c, t, W, H) {
  const { rp, kp } = doomPoses();
  c.save(); c.translate(W * .76, H * .56); c.scale(1.0, 1.0); c.translate(-526, -905);
  S.hallBench(c, 0, { sun: .3, ss: 59 }); drawChar(c, RAY, { ...rp, x: POS.RAY.x, y: POS.RAY.y, s: POS.RAY.s }, L0); drawChar(c, KAI, { ...kp, x: POS.KAI.x, y: POS.KAI.y, s: POS.KAI.s }, L0);
  c.restore();
  wash(c, W, H, '#6E648F', .45, 'multiply'); bloom(c, W, H, .16); vignette(c, W, H, .8, P.night, .62, .5, .3);
  shout(c, 'WHAT', 320, 210, 156, -.06, '#FFD84A', { sw: 18 }); shout(c, 'ASSIGNMENT?!', 320, 350, 80, -.06, '#FFFFFF', { sw: 15 });
  c.save(); c.translate(320, 530); c.rotate(.02); fillRR(c, -230, -50, 460, 100, 14, P.paper); c.lineWidth = 5; c.strokeStyle = P.ink; rr(c, -230, -50, 460, 100, 14); c.stroke();
  text(c, '"what exam?"', 0, 2, { size: 50, col: '#C2512D' }); c.restore();
  paperGrain(c, W, H, .1);
}
const sb = (file, t) => ({ file, w: 1080, h: 1920, t, draw: (c, tt) => renderFilm(c, tt) });
export const FRAMES = {
  sheet: { file: 'model-sheet', w: 2400, h: 1450, draw: sheet },
  two: sb('style-frame-two-shot', 1.2), kai: sb('style-frame-kai', 5.6), stare: sb('style-frame-stare', 12.0),
  thumb: { file: '../thumbnail', w: 1080, h: 1920, draw: thumb },
  thumbwide: { file: '../thumbnail-16x9', w: 1280, h: 720, draw: thumbWide },
};
