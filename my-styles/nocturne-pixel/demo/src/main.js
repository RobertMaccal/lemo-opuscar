// THE LAST WINDOW — composition: layers, camera, portal through the glass, titles, post.
import { Buf, C, W, H, OW, OH, bayer } from './px.js';
import { DUR, T, CARDS, H_CENTER, HG, winLevel, WIN } from './timeline.js';
import { extCam, intCam, interior, layerCam, applyCam, toScreen, ZE } from './camera.js';
import { drawSky, drawFar, drawFlanks, drawStreet, drawCars, drawReflections, lightning } from './city.js';
import { drawBuilding } from './building.js';
import { drawRain } from './rain.js';
import { drawText } from './font.js';
import { drawLOD, LOD } from './lod.js';
import { renderRoom } from './apartment.js';
import { buildEvents } from './events.js';
import { clamp, seg } from './rng.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const sky = new Buf(W, H), far = new Buf(W, H), main = new Buf(W, H), rain = new Buf(W, H), text = new Buf(W, H), room = new Buf(W, H);
const ic = document.createElement('canvas'); ic.width = OW; ic.height = OH; const ictx = ic.getContext('2d'); ictx.imageSmoothingEnabled = false;

// post: faint scanline every third output row (one per native pixel) and a soft vignette
const post = document.createElement('canvas'); post.width = OW; post.height = OH;
{ const p = post.getContext('2d'); p.fillStyle = 'rgba(0,0,0,0.075)'; for (let y = 2; y < OH; y += 3) p.fillRect(0, y, OW, 1);
  const g = p.createRadialGradient(OW / 2, OH * .46, OH * .28, OW / 2, OH / 2, OH * .72); g.addColorStop(0, 'rgba(4,6,14,0)'); g.addColorStop(1, 'rgba(4,6,14,0.5)'); p.fillStyle = g; p.fillRect(0, 0, OW, OH); }

function drawLayer(c, buf, ox = 0, oy = 0, scale = 1) { applyCam(ctx, c, ox, oy, scale); ctx.drawImage(buf.canvas(), 0, 0); }

// exterior world at time t with camera c; portal = interior canvas to show through his glass (or null)
function exterior(t, c, portalP) {
  drawSky(sky, t); drawLayer(layerCam(c, .15), sky);
  drawFar(far, t); drawLayer(layerCam(c, .55), far);
  main.clear(0); drawFlanks(main, t); drawBuilding(main, t, lightning(t)); drawStreet(main, t); drawCars(main, t); drawReflections(main, t);
  drawLayer(c, main);
  // close-up layer of his window (4x detail), dissolved in by dither as the push gets close
  const lodP = clamp((Math.log(c.Z) - Math.log(6)) / (Math.log(9.5) - Math.log(6)));
  if (lodP > 0) {
    if (portalP > 0) drawPortal(t, c);
    drawLOD(t, lodP, portalP); applyCam(ctx, c, LOD.x0, LOD.y0, 4); ctx.drawImage(LOD.buf.canvas(), 0, 0);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  rain.clear(0); drawRain(rain, t, 1); ctx.drawImage(rain.canvas(), 0, 0, OW, OH);
}
// the room seen through the arched glass: same render as the interior shot, scaled to the glass
function drawPortal(t, c) {
  renderRoom(room, t); paintRoom(ictx, { x: 180, y: 320, Z: ZE }, room);
  const k = (HG.w * c.Z) / (1104);
  const [sx, sy] = toScreen(c, H_CENTER[0], H_CENTER[1]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save(); ctx.beginPath();
  const [gx, gy] = toScreen(c, HG.x, HG.y - HG.r); ctx.rect(gx, gy, HG.w * c.Z, (HG.h + HG.r) * c.Z); ctx.clip(); ctx.fillStyle = '#3F2E33'; ctx.fillRect(gx, gy, HG.w * c.Z, (HG.h + HG.r) * c.Z);
  ctx.imageSmoothingEnabled = k < 1; ctx.drawImage(ic, sx - OW / 2 * k, sy - OH / 2 * k, OW * k, OH * k); ctx.imageSmoothingEnabled = false;
  ctx.restore();
}
function paintRoom(cx2, c, buf) { cx2.setTransform(c.Z, 0, 0, c.Z, OW / 2 - c.x * c.Z, OH / 2 - c.y * c.Z); cx2.fillStyle = '#05080f'; cx2.fillRect(-50, -50, W + 100, H + 100); cx2.drawImage(buf.canvas(), 0, 0); cx2.setTransform(1, 0, 0, 1, 0, 0); }

function cards(t) {
  text.clear(0); const boxes = [];
  for (const k of CARDS) { if (t < k.t0 || t > k.t1) continue;
    const p = Math.min(seg(t, k.t0, k.t0 + .45), 1 - seg(t, k.t1 - .5, k.t1));
    const bx = drawText(text, k.text, W / 2, k.y, k.scale, p); boxes.push({ id: k.id, text: k.text, x0: bx.x0 * 3, y0: bx.y0 * 3, x1: bx.x1 * 3, y1: bx.y1 * 3 }); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(text.canvas(), 0, 0, OW, OH);
  return boxes;
}

function render(t) {
  t = clamp(t, 0, DUR - 1e-6);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, OW, OH);
  if (interior(t)) { renderRoom(room, t); paintRoom(ctx, intCam(t), room); }
  else { const c = extCam(t); const pp = clamp((Math.log(c.Z) - Math.log(24)) / (Math.log(58) - Math.log(24))); exterior(t, c, pp); }
  cards(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(post, 0, 0);
}

window.DUR = DUR;
window.render = render;
window.TEXTS = t => LASTBOX(t);
function LASTBOX(t) { text.clear(0); const bx = []; for (const k of CARDS) if (t > k.t0 && t < k.t1) { const b = drawText(text, k.text, W / 2, k.y, k.scale, 1); bx.push({ id: k.id, text: k.text, x0: b.x0 * 3, y0: b.y0 * 3, x1: b.x1 * 3, y1: b.y1 * 3 }); } return bx; }
window.EV = buildEvents();
document.fonts.ready.then(() => { render(0); window.READY = true; if (location.search.includes('preview')) import('./preview.js').then(m => m.start(render, DUR)); });
