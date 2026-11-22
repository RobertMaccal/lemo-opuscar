// The miniature city on the desk: painted wooden blocks and card, the same skyline as outside.
// Its windows read the same light table as the real city (timeline.js).
import { C, bayer, halo, warm } from './px.js';
import { WINDOWS, winLevel, sharedLevel, hLight, miniLamp, T } from './timeline.js';
import { seg } from './rng.js';

export const MINI = {
  board: { x0: 160, x1: 314, top: 436, front: 468 },
  S: { x0: 176, x1: 196, top: 408, base: 446, win: [184, 414] },
  M: { x0: 206, x1: 250, top: 383, base: 446 },
  Wt: { x0: 258, x1: 278, top: 412, base: 446, win: [266, 418] },
  slot: { cx: 194, base: 466 },          // where he sets the little house
  lamp: { x: 228, base: 466 },
};
export const mWin = (f, c) => ({ x: 211 + 6 * c, y: 440 - 6 * f + 1, w: 3, h: f === 6 ? 4 : 3 });
export const M_H = mWin(6, 3);            // the tiny window that is his own

function block(b, x0, x1, top, base, face, side, trim) {
  b.rect(x0, top, x1 - x0, base - top, face); b.rect(x1, top + 1, 3, base - top - 1, side); b.rect(x0, top, x1 - x0, 1, trim); b.rect(x0, top, 1, base - top, warm(face, 1));
  b.rect(x0, base, x1 - x0 + 3, 1, C.b2);  // contact shadow
}
function tinyWin(b, x, y, w, h, L, arched) {
  const col = L >= 1 ? C.w8 : L > 0 ? C.w5 : C.n2;
  b.rect(x, y, w, h, col); if (arched) { b.px(x, y, b.get(x - 1, y)); b.px(x + w - 1, y, b.get(x + w, y)); }
  if (L >= 1) { b.px(x + 1, y + h - 1, C.w10); }
}
export function houseSprite(b, cx, base, wall, roof) {   // the little house he places (12 wide)
  b.rect(cx - 5, base - 7, 10, 7, wall); b.rect(cx + 5, base - 7, 2, 7, warm(wall, 0) === wall ? C.k5 : C.k5);
  b.poly([[cx - 7, base - 7], [cx + 7, base - 7], [cx, base - 13]], roof); b.line(cx - 7, base - 7, cx, base - 13, warm(roof, 1));
  b.rect(cx - 3, base - 5, 2, 2, C.n2); b.rect(cx + 1, base - 4, 2, 4, C.b1);
}
export function drawMiniature(b, t, placed) {
  const { board } = MINI;
  // board: top face, grain, front edge
  b.rect(board.x0, board.top, board.x1 - board.x0, board.front - board.top, C.k4);
  for (let y = board.top; y < board.front; y++) for (let x = board.x0; x < board.x1; x++) { const g = Math.sin(x * .09 + Math.sin(y * .6) * 1.5); if (g > .85 && bayer(x, y) < .6) b.px(x, y, C.k6); else if (g < -.9 && bayer(x, y) < .5) b.px(x, y, C.k5); }
  b.rect(board.x0, board.front, board.x1 - board.x0, 6, C.k5); b.rect(board.x0, board.front, board.x1 - board.x0, 1, C.k6); b.rect(board.x0, board.front + 6, board.x1 - board.x0, 1, C.b1);
  // road across the board
  b.rect(board.x0 + 2, 449, board.x1 - board.x0 - 4, 6, C.n7); for (let x = board.x0 + 6; x < board.x1 - 6; x += 8) b.rect(x, 451, 4, 1, C.k6);
  // back row: flanks, spire, main building, water tower
  block(b, 162, 174, 420, 446, C.k1, C.r1, C.r3); for (let y = 424; y < 444; y += 6) { b.rect(164, y, 3, 3, C.n2); b.rect(169, y, 3, 3, C.n2); }
  block(b, 282, 300, 424, 446, C.k0, C.b3, C.k6); for (let y = 428; y < 444; y += 6) { b.rect(285, y, 3, 3, C.n2); b.rect(292, y, 3, 3, C.n2); }
  const S = MINI.S; block(b, S.x0, S.x1, S.top, S.base, C.k2, C.n5, C.t1);
  b.poly([[S.x0 + 2, S.top], [S.x1 - 2, S.top], [186, 384]], C.k2); b.line(S.x0 + 2, S.top, 186, 384, C.t1); b.vline(186, 378, 384, C.n7);
  for (let y = 414; y < 442; y += 6) for (const x of [179, 184, 189]) if (!(x === 184 && y === 414)) tinyWin(b, x, y, 3, 3, 0);
  tinyWin(b, 184, 414, 3, 3, sharedLevel('S1', t));
  const M = MINI.M; block(b, M.x0, M.x1, M.top, M.base, C.n6, C.n4, C.k6);
  b.rect(M.x0, M.top + 3, M.x1 - M.x0, 1, C.n4); b.rect(M.x0, 403, M.x1 - M.x0, 1, C.n7);
  b.rect(236, 378, 6, 5, C.n6); b.rect(236, 378, 6, 1, C.k6); b.vline(214, 375, 383, C.n8);
  b.rect(226, 440, 4, 6, C.n2);
  for (const w of WINDOWS) { const r = mWin(w.f, w.c); const L = w.isH ? hLight(t) : winLevel(w, t); tinyWin(b, r.x, r.y, r.w, r.h, L, w.f === 6); }
  const Wt = MINI.Wt; block(b, Wt.x0, Wt.x1, Wt.top, Wt.base, C.k5, C.b2, C.k6);
  b.vline(262, 402, 412, C.b1); b.vline(274, 402, 412, C.b1); b.line(262, 407, 274, 404, C.b2);
  b.rect(260, 393, 17, 9, C.k5); for (let x = 262; x < 277; x += 3) b.vline(x, 393, 401, C.b3); b.rect(260, 396, 17, 1, C.b1); b.rect(260, 393, 1, 9, C.k6);
  b.poly([[259, 393], [278, 393], [268, 387]], C.b3);
  for (let y = 418; y < 442; y += 6) for (const x of [261, 266, 271]) if (!(x === 266 && y === 418)) tinyWin(b, x, y, 3, 3, 0);
  tinyWin(b, 266, 418, 3, 3, sharedLevel('W1', t));
  // tiny halos for lit windows
  const lit = [[184, 414, 3, 3, sharedLevel('S1', t)], [266, 418, 3, 3, sharedLevel('W1', t)], [M_H.x, M_H.y, 3, 4, hLight(t)]];
  lit.forEach(([x, y, w, h, L], i) => { if (L >= 1) halo(b, x, y, w, h, i === 2 ? 7 : 4, i === 2 ? 1.4 : 1.1); });
  // front row: houses, trees, the tiny streetlamp
  houseSprite(b, 171, 466, C.k6, C.k1);
  if (placed) houseSprite(b, MINI.slot.cx, MINI.slot.base, C.k4, C.k1);
  houseSprite(b, 211, 466, C.k4, C.k2);
  for (const tx of [240, 271]) { b.vline(tx, 458, 465, C.k5); b.disc(tx + .5, 455, 4, C.g2); b.disc(tx - .5, 454, 2.5, C.g3); b.px(tx - 1, 453, C.g4); }
  houseSprite(b, 254, 466, C.k0, C.k5); houseSprite(b, 291, 466, C.k6, C.g2); houseSprite(b, 304, 466, C.k1, C.b3);
  const lp = MINI.lamp, on = miniLamp(t);
  b.vline(lp.x, lp.base - 13, lp.base - 1, C.n7); b.rect(lp.x - 1, lp.base - 15, 3, 2, on ? C.w9 : C.n6); b.rect(lp.x - 1, lp.base, 3, 1, C.b2);
  if (on) { halo(b, lp.x - 1, lp.base - 15, 3, 2, 6, 1.2); }
}
