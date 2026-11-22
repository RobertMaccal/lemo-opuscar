// Cover / thumbnail: the dark building with one burning window, a pixel zoom-callout into his room,
// big pixel hook text. Everything important stays inside Instagram's 3:4 grid crop (y 240..1680).
import { Buf, C, W, H, OW, OH, bayer, halo, warm } from './px.js';
import { HG, T } from './timeline.js';
import { layerCam, applyCam, toScreen } from './camera.js';
import { drawSky, drawFar, drawFlanks, drawStreet, drawReflections } from './city.js';
import { drawBuilding } from './building.js';
import { drawRain } from './rain.js';
import { renderRoom } from './apartment.js';
import { GLYPHS, textWidth } from './font.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const sky = new Buf(W, H), far = new Buf(W, H), main = new Buf(W, H), room = new Buf(W, H), top = new Buf(W, H), rain = new Buf(W, H);
const ic = document.createElement('canvas'); ic.width = OW; ic.height = OH; const ictx = ic.getContext('2d');
const draw = (c, b) => { applyCam(ctx, c, 0, 0, 1); ctx.drawImage(b.canvas(), 0, 0); };

// big title text: 8-neighbour ink outline, a row-by-row warm gradient
function title(b, s, cx, y, sc, cols, ink = C.n0) {
  const w = textWidth(s, sc), x0 = Math.round(cx - w / 2), pts = [];
  let x = x0; for (const ch of s) { const g = GLYPHS[ch] || GLYPHS[' '];
    for (let j = 0; j < 7; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') for (let a = 0; a < sc; a++) for (let q = 0; q < sc; q++) pts.push([x + i * sc + a, y + j * sc + q]);
    x += (g[0].length + 2) * sc; }
  for (const [px, py] of pts) for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 2; dx++) b.px(px + dx, py + dy, ink);
  const h = 7 * sc; for (const [px, py] of pts) { const f = (py - y) / h * (cols.length - 1), i0 = Math.min(cols.length - 2, Math.floor(f)); b.px(px, py, bayer(px, py) < f - i0 ? cols[i0 + 1] : cols[i0]); }
}
export function renderThumb() {
  const t = 39.3;                                   // the end: one window left
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, OW, OH);
  const c = { x: 195, y: 378, Z: 5.1 };             // his window high in frame
  drawSky(sky, 20); draw(layerCam(c, .15), sky);
  drawFar(far, t); draw(layerCam(c, .55), far);
  main.clear(0); drawFlanks(main, t); drawBuilding(main, t); drawStreet(main, t); drawReflections(main, t);
  // the last light burns brighter on the cover: wide palette-stepped glow
  halo(main, HG.x, HG.y - HG.r, HG.w, HG.h + HG.r, 34, 1.55, (x, y) => x >= HG.x && x < HG.x + HG.w && y >= HG.y - HG.r && y < HG.y + HG.h);
  draw(c, main);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // rain, warm where it crosses the window light
  rain.clear(0); drawRain(rain, 7.7, 1.1);
  const [hx, hy] = toScreen(c, HG.cx, HG.y + 8);
  rain.map(0, 0, W, H, (col, x, y) => { const d = Math.hypot(x * 3 - hx, y * 3 - hy) / 3; return d < 55 && bayer(x, y) < 1 - d / 55 ? C.w6 : col; });
  ctx.drawImage(rain.canvas(), 0, 0, OW, OH);
  // darken the frame edges toward the subject (dithered on the native grid)
  top.clear(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - 180) / 180, (y - 300) / 330); if (d > .78 && bayer(x, y) < (d - .78) * 1.6) top.px(x, y, C.n0); }
  ctx.drawImage(top.canvas(), 0, 0, OW, OH);
  // zoom callout: an arched lens showing the room at the moment he switches the tiny light back on
  const L = { x0: 255, x1: 825, top: 790, r: 285, bot: 1400 };
  const lc = { x: 205, y: 424, Z: 3.6 };
  renderRoom(room, 34.95);
  ictx.setTransform(1, 0, 0, 1, 0, 0); ictx.fillStyle = '#3F2E33'; ictx.fillRect(0, 0, OW, OH); ictx.imageSmoothingEnabled = false;
  const cxL = (L.x0 + L.x1) / 2, cyL = (L.top + L.r + L.bot) / 2;
  ictx.setTransform(lc.Z, 0, 0, lc.Z, cxL - lc.x * lc.Z, cyL - lc.y * lc.Z); ictx.drawImage(room.canvas(), 0, 0); ictx.setTransform(1, 0, 0, 1, 0, 0);
  // stair-stepped arch on the 3-px grid
  const arch = (pad) => { const p = new Path2D(), s = 3, r = L.r + pad, cy0 = L.top + L.r, x0 = L.x0 - pad, x1 = L.x1 + pad;
    p.moveTo(x0, L.bot + pad); for (let y = cy0; y >= cy0 - r; y -= s) { const dx = Math.sqrt(Math.max(0, r * r - (cy0 - y) ** 2)); p.lineTo(Math.round((cxL - dx) / s) * s, y); }
    for (let y = cy0 - r; y <= cy0; y += s) { const dx = Math.sqrt(Math.max(0, r * r - (cy0 - y) ** 2)); p.lineTo(Math.round((cxL + dx) / s) * s, y); } p.lineTo(x1, L.bot + pad); p.closePath(); return p; };
  // callout beams from his window to the lens (dithered warm)
  top.clear(0);
  const [wl] = toScreen(c, HG.x, 0), [wr] = toScreen(c, HG.x + HG.w, 0), [, wb] = toScreen(c, 0, HG.y + HG.h);
  const beam = (ax, ay, bx, by) => { for (let k = 0; k <= 1; k += .004) { const x = (ax + (bx - ax) * k) / 3, y = (ay + (by - ay) * k) / 3; for (let w = -1; w <= 1; w++) if (bayer(Math.round(x + w), Math.round(y)) < .75 - Math.abs(w) * .35) top.px(x + w, y, k < .5 ? C.w8 : C.w6); } };
  beam(wl, wb, L.x0 + 30, L.top + L.r - 60); beam(wr, wb, L.x1 - 30, L.top + L.r - 60);
  ctx.drawImage(top.canvas(), 0, 0, OW, OH);
  ctx.fillStyle = '#080D19'; ctx.fill(arch(24)); ctx.fillStyle = '#C49A6C'; ctx.fill(arch(18)); ctx.fillStyle = '#7C5A3E'; ctx.fill(arch(12)); ctx.fillStyle = '#24191A'; ctx.fill(arch(6));
  ctx.save(); ctx.clip(arch(0)); ctx.drawImage(ic, 0, 0); ctx.restore();
  // a twinkle on the tiny window he just lit
  { const sx = cxL + (230.5 - lc.x) * lc.Z, sy = cyL + (406.5 - lc.y) * lc.Z, q = 3;
    ctx.fillStyle = '#FFF4DC'; ctx.fillRect(sx - q, sy - 7 * q, 2 * q, 14 * q); ctx.fillRect(sx - 7 * q, sy - q, 14 * q, 2 * q);
    ctx.fillStyle = '#FFD68A'; ctx.fillRect(sx - 3 * q, sy - 3 * q, 2 * q, 2 * q); ctx.fillRect(sx + q, sy - 3 * q, 2 * q, 2 * q); ctx.fillRect(sx - 3 * q, sy + q, 2 * q, 2 * q); ctx.fillRect(sx + q, sy + q, 2 * q, 2 * q);
    ctx.fillStyle = '#FFF4DC'; ctx.fillRect(sx - 2 * q, sy - 2 * q, 4 * q, 4 * q); }
  // text
  top.clear(0);
  title(top, '3:00 AM', W / 2, 86, 5, [C.w10, C.w9, C.w8, C.w7]);
  title(top, 'EVERY LIGHT WENT OUT', W / 2, 134, 2, [C.y4, C.n11, C.n10]);
  title(top, 'EXCEPT HIS.', W / 2, 482, 4, [C.w10, C.w8, C.w7, C.w6]);
  ctx.drawImage(top.canvas(), 0, 0, OW, OH);
  // scanline + vignette as in the film
  ctx.fillStyle = 'rgba(0,0,0,0.075)'; for (let y = 2; y < OH; y += 3) ctx.fillRect(0, y, OW, 1);
}
