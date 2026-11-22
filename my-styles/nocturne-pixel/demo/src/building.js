// The apartment building: a cached facade plus live windows (six little lives, the rest of the block),
// warm halos by palette stepping, the roof cat.
import { Buf, C, bayer, halo, warm, dimStep, W, H } from './px.js';
import { B, colX, floorTop, WINDOWS, winLevel, archGlass, gridGlass, HG, T } from './timeline.js';
import { hash, clamp, seg, ss } from './rng.js';

export const glassOf = w => w.arched ? archGlass(w.c) : gridGlass(w.f, w.c);
// arched glass membership (local coords inside the glass box incl. arch above y)
export function inArch(g, x, y) {
  if (x < g.x || x >= g.x + g.w || y >= g.y + g.h) return false;
  if (y >= g.y) return true;
  const dx = x + .5 - g.cx, dy = y + .5 - g.y; return dx * dx + dy * dy <= g.r * g.r && y >= g.y - g.r;
}
export const glassMask = new Uint8Array(W * H);
for (const w of WINDOWS) { const g = glassOf(w);
  for (let y = g.y - (g.r || 0); y < g.y + g.h; y++) for (let x = g.x; x < g.x + g.w; x++) if (!w.arched || inArch(g, x, y)) glassMask[y * W + x] = 1; }

let FACADE = null;
function buildFacade() {
  const b = new Buf(W, H);
  const { x0, x1, roof, ground, gfTop } = B;
  // side face (3/4 depth on the right)
  b.poly([[x1, roof + 6], [x1 + 14, roof + 12], [x1 + 14, ground], [x1, ground]], C.n2);
  for (let f = 1; f <= 9; f++) { const y = floorTop(f) + 8; b.rect(x1 + 4, y + 2, 3, 16, C.n1); b.rect(x1 + 9, y + 3, 3, 15, C.n1); }
  // wall with brick texture
  b.rect(x0, roof, x1 - x0, ground - roof, C.n4);
  for (let y = roof + 14; y < gfTop; y++) for (let x = x0; x < x1; x++) {
    const row = Math.floor((y - roof) / 3), mortar = (y - roof) % 3 === 0, joint = ((x + (row & 1) * 4) % 8) === 0;
    const h = hash(row * 131 + Math.floor((x + (row & 1) * 4) / 8) * 17);
    if (mortar && bayer(x, y) < .5) b.px(x, y, C.n3);
    else if (joint && bayer(x, y) < .6) b.px(x, y, C.n3);
    else if (h > .82 && bayer(x, y) < .35) b.px(x, y, C.n5);
    else if (h < .12 && bayer(x, y) < .4) b.px(x, y, C.n3);
  }
  // left corner light, right corner shade
  b.rect(x0, roof, 2, ground - roof, C.n6); b.rect(x0 + 2, roof, 1, ground - roof, C.n5); b.rect(x1 - 2, roof, 2, ground - roof, C.n3);
  // parapet + cornice with dentils
  b.rect(x0 - 3, roof, x1 - x0 + 6, 3, C.n7); b.rect(x0 - 3, roof + 3, x1 - x0 + 6, 2, C.n3);
  for (let x = x0 - 2; x < x1 + 2; x += 3) b.rect(x, roof + 5, 2, 2, C.n6);
  b.rect(x0 - 1, roof + 7, x1 - x0 + 2, 1, C.n3);
  // string courses
  for (let f = 1; f <= 9; f++) { const y = floorTop(f) + B.floorH - 1; b.rect(x0, y, x1 - x0, 1, f === 1 || f === 6 ? C.n6 : C.n5); if (f === 1 || f === 6) b.rect(x0, y + 1, x1 - x0, 1, C.n3); }
  { const y = floorTop(6); b.rect(x0 - 2, y, x1 - x0 + 4, 2, C.n6); b.rect(x0 - 2, y + 2, x1 - x0 + 4, 1, C.n2); }
  // window surrounds
  for (const w of WINDOWS) { const g = glassOf(w);
    if (w.arched) {
      for (let y = g.y - g.r - 2; y < g.y + g.h + 1; y++) for (let x = g.x - 2; x < g.x + g.w + 2; x++) {
        const gg = { ...g, x: g.x - 1, w: g.w + 2, r: g.r + 1 }, out = { ...g, x: g.x - 2, w: g.w + 4, r: g.r + 2 };
        if (inArch(out, x, y) && !inArch(gg, x, y)) b.px(x, y, y < g.y ? C.n7 : C.n6);
        else if (inArch(gg, x, y) && !inArch(g, x, y)) b.px(x, y, C.n1);
      }
      b.rect(g.cx - 1, g.y - g.r - 3, 3, 3, C.n8);           // keystone
      b.rect(g.x - 3, g.y + g.h, g.w + 6, 2, C.n7); b.rect(g.x - 3, g.y + g.h + 2, g.w + 6, 1, C.n2);
    } else {
      b.rect(g.x - 2, g.y - 3, g.w + 4, 2, C.n6); b.rect(g.x - 2, g.y - 1, g.w + 4, 1, C.n3);      // lintel
      b.rect(g.x - 1, g.y - 1 + 1, g.w + 2, g.h + 1, C.n1);                                       // frame
      b.rect(g.x - 2, g.y + g.h, g.w + 4, 2, C.n7); b.rect(g.x - 2, g.y + g.h + 2, g.w + 4, 1, C.n2); // sill
    }
  }
  // ground floor: stone base, arched door, shuttered shops
  b.rect(x0, gfTop, x1 - x0, ground - gfTop, C.n5);
  for (let y = gfTop + 2; y < ground; y += 6) b.rect(x0, y, x1 - x0, 1, C.n4);
  b.rect(x0, ground - 3, x1 - x0, 3, C.n3);
  const dx = 172; b.rect(dx - 2, gfTop + 6, 20, ground - gfTop - 6, C.n6); b.rect(dx, gfTop + 9, 16, ground - gfTop - 9, C.n1);
  b.disc(dx + 8, gfTop + 10, 8, C.n6); b.disc(dx + 8, gfTop + 11, 7, C.n1); b.rect(dx + 7, gfTop + 9, 2, ground - gfTop - 9, C.n2);
  for (const sx of [94, 214]) { b.rect(sx, gfTop + 8, 52, 28, C.n2); for (let y = gfTop + 9; y < gfTop + 36; y += 2) b.rect(sx + 1, y, 50, 1, C.n3); b.rect(sx - 1, gfTop + 6, 54, 2, C.n7); }
  // drainpipe
  b.rect(x0 + 5, roof + 8, 2, ground - roof - 8, C.n2); b.rect(x0 + 5, roof + 8, 1, ground - roof - 8, C.n6);
  for (let y = roof + 20; y < ground; y += 30) b.rect(x0 + 4, y, 4, 1, C.n7);
  // roof: stair hut, chimneys, antenna mast
  b.rect(236, roof - 20, 26, 20, C.n4); b.rect(236, roof - 20, 26, 2, C.n6); b.rect(236, roof - 20, 1, 20, C.n5); b.rect(244, roof - 13, 7, 13, C.n2);
  b.rect(148, roof - 12, 8, 12, C.n3); b.rect(147, roof - 13, 10, 2, C.n6); b.rect(200, roof - 9, 6, 9, C.n3); b.rect(199, roof - 10, 8, 2, C.n6);
  b.rect(112, roof - 40, 1, 40, C.n6); b.rect(108, roof - 34, 9, 1, C.n6); b.rect(109, roof - 26, 7, 1, C.n6); b.rect(110, roof - 18, 5, 1, C.n6);
  return b;
}

// ---- tiny interiors (local coords inside an 18x20 glass, or 12x27 arched) ----
function room(b, g, t, w, L) {
  const { x, y } = g, gw = g.w, gh = g.h + (g.r || 0), top = y - (g.r || 0);
  const wall = L >= 1 ? C.w7 : C.w5, wall2 = L >= 1 ? C.w8 : C.w6, floor = C.w4, dark = C.b1, mid = C.w3;
  const at = (i, j, c) => { const X = x + i, Y = top + j; if (!w.arched || inArch(g, X, Y)) b.px(X, Y, c); };
  const R = (i, j, ww, hh, c) => { for (let a = 0; a < ww; a++) for (let bb = 0; bb < hh; bb++) at(i + a, j + bb, c); };
  // back wall: brighter around the lamp, floor band
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) at(i, j, j > gh - 5 ? floor : (bayer(x + i, top + j) < (1 - Math.abs(i - gw * .55) / gw) * .9 ? wall2 : wall));
  const s = w.seed, typ = w.type;
  const curtain = C[w.curtain] || C.r2;
  const ph = t * 1.3 + (s % 100);
  if (typ === 'reader') {           // armchair, reader with an open book, floor lamp
    R(2, gh - 10, 9, 6, mid); R(1, gh - 13, 3, 9, mid);                 // chair
    const close = seg(t, 6.0, 6.25);
    R(5, gh - 15, 4, 4, dark); R(5, gh - 11, 5, 5, dark);               // head + body
    if (close < 1) { R(9, gh - 11, Math.round(4 - close * 2), 2, C.w10); } else R(9, gh - 11, 2, 2, C.r1);
    R(14, 4, 3, 2, C.w10); R(15, 6, 1, gh - 10, dark);                  // lamp
  } else if (typ === 'couple') {    // bed, two heads, bedside lamp
    R(1, gh - 8, 16, 4, C.w9); R(1, gh - 9, 16, 1, mid); R(0, gh - 12, 2, 8, mid);
    R(3, gh - 11, 3, 3, dark); R(7, gh - 11 + (Math.sin(ph) > .7 ? 1 : 0), 3, 3, dark);
    R(13, gh - 13, 3, 2, C.w10); R(14, gh - 11, 1, 3, dark);
  } else if (typ === 'tv') {        // lit by the television
    const tvOff = seg(t, 7.2, 7.4);
    R(2, gh - 9, 8, 5, C.b0); R(3, gh - 13, 3, 4, C.b0);              // sofa + person
    R(11, gh - 13, 6, 6, C.b0);
    if (tvOff <= 0) R(12, gh - 12, 4, 4, Math.sin(t * 23) > .2 ? C.t3 : C.t2);
    else if (tvOff < .4) R(12, gh - 10, 4, 1, C.t3); else if (tvOff < .8) R(13, gh - 10, 1, 1, C.t3);
  } else if (typ === 'cat') {
    R(2, gh - 5, gw - 4, 1, mid); R(3, 4, 3, 2, C.w10);
    catSil(b, x + 6, y + gh - 8, t, w.arched ? g : null);
  } else if (typ === 'kitchen') {
    R(0, 3, gw, 1, mid); R(1, 1, 5, 2, mid); R(10, 1, 6, 2, mid);       // shelves
    R(8, 0, 1, 3, dark); R(7, 3, 3, 2, C.w10);                           // hanging bulb
    const lift = ss(seg(t, 9.8, 10.15)), put = t > 10.15;
    R(4, gh - 15, 3, 3, dark); R(3, gh - 12, 5, 8, dark);              // person
    R(7, Math.round(gh - 11 - lift * 6), 2, 4 - Math.round(lift * 2), dark); // arm
    if (!put) R(8, Math.round(gh - 12 - lift * 7), 2, 2, C.w10); else R(11, 1, 2, 2, C.w10);
    R(0, gh - 7, gw, 2, C.b2);
  } else if (typ === 'desk') {
    const shut = seg(t, 11.6, 11.85);
    R(2, gh - 13, 3, 3, dark); R(1, gh - 10, 5, 6, dark);
    R(7, gh - 7, 9, 1, C.b2); R(8, gh - 6, 1, 3, dark); R(15, gh - 6, 1, 3, dark);
    const sh = Math.round(4 * (1 - shut)); if (sh > 0) R(9, gh - 7 - sh, 5, sh, C.t2);
    R(13, 3, 3, 1, mid); R(14, 4, 1, gh - 11, dark); if (t < 12.0) R(12, 4, 4, 1, C.w10);
  } else if (typ === 'shelf') {
    R(1, 2, 7, gh - 6, mid); for (let k = 0; k < 4; k++) R(2, 4 + k * 4, 5, 1, dark);
    R(12, 0, 1, 4, dark); R(11, 4, 3, 2, C.w10);
  } else if (typ === 'plant') {
    R(3, gh - 8, 4, 4, C.b2); R(2, gh - 13, 2, 5, C.g2); R(5, gh - 15, 2, 7, C.g2); R(7, gh - 12, 2, 4, C.g2);
    R(12, 6, 4, 3, C.w10); R(13, 9, 2, gh - 13, dark);
  } else if (typ === 'person' || typ === 'person2') {
    const sway = Math.round(Math.sin(ph * .7) * 1.4);
    R(8 + sway, gh - 16, 3, 3, dark); R(7 + sway, gh - 13, 5, 9, dark);
    R(2, 2, 3, 2, C.w10);
  } else if (typ === 'bulb') {
    R(9, 0, 1, 4, dark); R(8, 4, 3, 2, C.w10); R(2, gh - 9, 6, 5, mid);
  } else if (typ === 'him') {        // the old man at his desk, lamp on the right, models on the desk
    R(0, gh - 9, gw, 2, C.b3); R(9, gh - 15, 1, 6, dark); R(8, gh - 16, 3, 2, C.w10);
    R(2, gh - 14, 3, 3, C.y2); R(2, gh - 11, 4, 4, C.b2); R(5, gh - 12, 2, 1, C.b2);
    R(6, gh - 12, 2, 3, C.k2); R(7, gh - 14, 1, 2, C.k1);
  }
  // curtains (all but the generic 'curtain' type have side curtains; 'curtain' is drawn mostly closed)
  if (typ === 'curtain') { const gap = 4 + Math.round(Math.sin(ph * .5)); for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (Math.abs(i - gw / 2) > gap / 2) at(i, j, (i % 3 === 0) ? warm(curtain, 1) : warm(curtain, 2)); }
  else { R(0, 0, 2, gh, curtain); R(gw - 2, 0, 2, gh, curtain); R(1, 0, 1, gh, warm(curtain, 1)); }
  if (L < 1) b.map(x, top, gw, gh, (c, i, j) => (!w.arched || inArch(g, i, j)) ? dimStep(c) : c);
}
function catSil(b, x, y, t, g) {
  const tail = Math.sin(t * 2.2) > 0 ? 1 : 0, c = C.b0;
  b.rect(x, y + 1, 6, 3, c); b.rect(x - 1, y + 2, 1, 2, c); b.rect(x + 5, y - 1, 3, 3, c); b.px(x + 5, y - 2, c); b.px(x + 7, y - 2, c);
  b.rect(x - 2, y + 3 - tail, 1, 1 + tail, c); b.px(x - 3, y + 3, c);
}
function darkGlass(b, g, w, t, lvlSil) {
  const top = g.y - (g.r || 0), gh = g.h + (g.r || 0);
  for (let j = 0; j < gh; j++) for (let i = 0; i < g.w; i++) { const X = g.x + i, Y = top + j; if (w.arched && !inArch(g, X, Y)) continue;
    const d = (i + j) % 11; let c = C.n1; if (d === 3 || d === 4) c = bayer(X, Y) < .5 ? C.n3 : C.n2; if (i < 2 || i >= g.w - 2) c = C.n2; b.px(X, Y, c); }
  if (w.type === 'cat' && w.lit0) catSil(b, g.x + 6, g.y + gh - 8 - (g.r || 0), t, null);
  if ((w.seed % 5) === 0) for (let j = 1; j < gh; j += 2) for (let i = 2; i < g.w - 2; i++) if (bayer(g.x + i, top + j) < .5) b.px(g.x + i, top + j, C.n2);
}

const catX = t => 92 + Math.min(1, t / 5.6) * 116;
export function drawBuilding(b, t, lightning = 0) {
  if (!FACADE) FACADE = buildFacade();
  // copy facade where opaque
  const d = b.d, fd = FACADE.d; for (let k = 0; k < d.length; k++) if (fd[k]) d[k] = fd[k];
  // windows
  const lit = [];
  for (const w of WINDOWS) { const g = glassOf(w), L = winLevel(w, t);
    if (L > 0) { room(b, g, t, w, L); lit.push([g, w, L]); } else darkGlass(b, g, w, t);
  }
  // halos onto the facade (not onto other glass)
  const skip = (i, j) => glassMask[j * W + i] === 1;
  for (const [g, w, L] of lit) { const top = g.y - (g.r || 0), gh = g.h + (g.r || 0);
    const str = (w.type === 'tv' ? .8 : 1.15) * (L >= 1 ? 1 : .5) * (w.isH ? 1.35 : 1);
    halo(b, g.x, top, g.w, gh, w.isH ? 13 : 10, str, skip);
    if (w.type === 'tv' && L >= 1) b.map(g.x - 3, top - 2, g.w + 6, gh + 6, (c, i, j) => skip(i, j) ? c : (bayer(i, j) < .25 ? C.t0 : c));
  }
  // roof antenna blink, the cat on the parapet
  if ((t % 1.6) < .25) b.px(112, B.roof - 41, C.r3);
  const cx = catX(t), walking = t < 5.6, fr = Math.floor(t * 8) & 1;
  catRoof(b, Math.round(cx), B.roof - 1, walking ? fr : 2, t);
}
function catRoof(b, x, y, fr, t) {
  const c = C.n0;
  if (fr === 2) {       // sitting, tail swishing
    b.rect(x, y - 5, 4, 5, c); b.rect(x + 1, y - 8, 4, 3, c); b.px(x + 1, y - 9, c); b.px(x + 4, y - 9, c);
    const sw = Math.sin(t * 2) > 0; b.rect(x - 2, y - 1, 2, 1, c); b.px(sw ? x - 3 : x - 2, y - 2, c);
    return;
  }
  b.rect(x, y - 4, 7, 3, c); b.rect(x + 6, y - 6, 3, 3, c); b.px(x + 6, y - 7, c); b.px(x + 8, y - 7, c);
  b.rect(x - 2, y - 6 + fr, 2, 1, c); b.px(x - 3, y - 7 + fr, c);
  if (fr) { b.px(x, y - 1, c); b.px(x + 5, y - 1, c); } else { b.px(x + 1, y - 1, c); b.px(x + 4, y - 1, c); }
}
