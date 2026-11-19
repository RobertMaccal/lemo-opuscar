// Preproduction boards: id → { file, w, h, t, draw(ctx, t, W, H) }.  node films/the-missing-page/tools/boards.mjs
import { P, F, mix, rgba, fillR, fillRR, text, lg, rg, dust } from './kit.js';
import { drawChar, pose, solve } from './rig.js';
import { X, EXAM, CAND, SECOND, EXTRAS, C } from './cast.js';
import { mkL, finish, caption } from './shots.js';
import { renderFilm } from './film.js';
import { M } from './anim.js';
import { thumbV, thumbH } from './thumbs.js';

const L = mkL(-.7, .65, { shadow: { kx: -.6, ky: .14, a: .26, blur: 6, col: P.plum } });
function head(g, ch, e, x, y, R, o = {}) { const p = pose(ch, { e: { ...ch.face, ...e }, ...o }), s = R / ch.R, J = solve(ch, p); drawChar(g, ch, { ...p, x: x - J.hc[0] * s, y: y - J.hc[1] * s, s }, L, { only: [2], noShadow: true }); }
function sheet(g, t, W, H) {
  g.fillStyle = lg(g, 0, 0, 0, H, ['#F6EAD0', '#EAD5B0']); g.fillRect(0, 0, W, H);
  text(g, 'THE MISSING PAGE — CAST', 80, 80, { size: 56, align: 'left' }); text(g, 'Golden Hour Stickman · one bold colour per lead · indigo ink · cream heads', 80, 132, { size: 26, font: F.ui, align: 'left', col: P.inkSoft });
  const leads = [[EXAM, 'THE EXAMINER', 'charcoal suit · dark red tie · side parting', [X.stern, X.bark, X.brow, X.nod]], [CAND, 'THE CANDIDATE', 'deep-blue suit · styled quiff · smug', [X.cocky, X.chill, X.confused, X.horror, X.hollow]], [SECOND, 'THE SECOND CANDIDATE', 'olive-brown suit · folder · tired', [X.tired, X.sincere, X.exhausted, X.baffled]]];
  leads.forEach(([ch, name, sub, ex], i) => {
    const x0 = 120 + i * 760, gy = 860;
    text(g, name, x0 + 290, 200, { size: 38 }); text(g, sub, x0 + 290, 240, { size: 22, font: F.ui, col: P.inkSoft });
    [[0, 0], [.95, 1], [0, 2]].forEach(([face, k], j) => drawChar(g, ch, { ...pose(ch, { face, head: { back: k === 2 ? 1 : 0 }, e: ch.face }), x: x0 + 80 + j * 210, y: gy, s: .95 }, L));
    ex.forEach((e, j) => { head(g, ch, e, x0 + 60 + j * 132, 1020, 52); });
    fillRR(g, x0 + 40, 1110, 120, 60, 8, ch.top); text(g, ch.top, x0 + 100, 1196, { size: 18, font: F.ui, col: P.inkSoft });
    fillRR(g, x0 + 180, 1110, 120, 60, 8, ch.tie); text(g, ch.tie, x0 + 240, 1196, { size: 18, font: F.ui, col: P.inkSoft });
  });
  text(g, 'BACKGROUND CANDIDATES', 120, 1300, { size: 30, align: 'left' });
  EXTRAS.forEach((ch, i) => drawChar(g, ch, { ...pose(ch, { e: ch.face }), x: 760 + i * 220, y: 1640, s: .6 }, L));
}
function poster(g, t, W, H) {
  renderFilm(g, M.final + 1.9);
  g.save(); g.fillStyle = rgba('#10101C', .35); g.fillRect(0, 0, W, 520); g.restore();
  text(g, 'THE', 540, 190, { size: 70, col: '#F6EAD0', ls: 12 }); text(g, 'MISSING PAGE', 540, 300, { size: 128, col: '#F6EAD0', stroke: P.ink, sw: 10 });
  text(g, 'He finished first.', 540, 410, { size: 46, font: F.hand, col: '#F2C14E' });
}
export const FRAMES = {
  sheet: { file: 'model-sheet', w: 2400, h: 1700, draw: sheet },
  poster: { file: '../poster', w: 1080, h: 1920, draw: poster },
  thumbV: { file: '../thumbnail-vertical', w: 1080, h: 1920, draw: thumbV },
  thumbH: { file: '../thumbnail-youtube', w: 1280, h: 720, draw: thumbH },
};
