// Sets for THE TOILET DREAM: one apartment at 3:07 a.m. Bedroom, hallway, bathroom, always the same layout.
// World units: the dreamer at s = 1 stands ~500 tall with his feet on y = FY (1560).
import { P, mix, dark, lite, rgba, rr, poly, fillR, fillRR, quad, circ, ell, line, lg, rg, tmp, TAU, clamp, lerp, shaft, dust, rnd } from './kit.js';

export const FY = 1560;
// night palette (warm practicals against indigo shadows and lavender moonlight)
export const N = {
  wall: '#33335F', wallLo: '#3E3A69', wallHi: '#25264B', trim: '#4B4677', ceil: '#1F2042',
  floor: '#5E4438', floorHi: '#7C5844', floorLo: '#3A2B2D',
  moon: '#B9B4EA', moonCore: '#EEEBFF', lamp: '#FFC979', lampCore: '#FFF0C9', sky: ['#11122F', '#232659', '#3B3D78'],
  blanket: '#C98B4C', blanketLo: '#9C6338', blanketHi: '#E6AC66', sheet: '#E8DCC3', sheetLo: '#B7A991', pillow: '#F1E6CF',
  wood: '#8A5C3E', woodLo: '#5E3D2C', woodHi: '#B07A52',
  tile: '#EFE1C3', tileLo: '#D8C6A2', grout: '#CDB892', bathWall: '#E9CD9C', porcelain: '#F7F2E6', porcelainLo: '#CFC6B4',
};
const screenGlow = (g, x, y, r, col, a) => { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = a; g.fillStyle = rg(g, x, y, 0, r, [col, rgba(col, .35), 'rgba(0,0,0,0)']); g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); };
export { screenGlow };

// ---------- shared ----------
export function clock(g, x, y, r, hh, mm, ss = null) {
  circ(g, x + 5, y + 7, r + 9, rgba(P.night, .3)); circ(g, x, y, r + 9, N.woodLo); circ(g, x, y, r + 5, N.wood); circ(g, x, y, r, '#D9CDB4');
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(g, x + Math.sin(a) * r * .78, y - Math.cos(a) * r * .78, x + Math.sin(a) * r * .92, y - Math.cos(a) * r * .92, P.ink, i % 3 ? r * .035 : r * .07, 'butt'); }
  const ah = (hh % 12 + mm / 60) / 12 * TAU, am = mm / 60 * TAU;
  line(g, x, y, x + Math.sin(ah) * r * .5, y - Math.cos(ah) * r * .5, P.ink, r * .1); line(g, x, y, x + Math.sin(am) * r * .76, y - Math.cos(am) * r * .76, P.ink, r * .07);
  if (ss !== null) { const as = ss / 60 * TAU; line(g, x - Math.sin(as) * r * .16, y + Math.cos(as) * r * .16, x + Math.sin(as) * r * .82, y - Math.cos(as) * r * .82, P.rust, r * .035); }
  circ(g, x, y, r * .09, P.rust);
}
function planks(g, x0, x1, y0, y1, seed = 1) {
  g.fillStyle = lg(g, 0, y0, 0, y1, [N.floorLo, N.floor, N.floorHi]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const r = rnd(seed); g.lineWidth = 2.2;
  for (let y = y0 + 26, k = 0; y < y1; y += 26 + k * 7, k++) {
    g.strokeStyle = rgba(N.floorLo, .55); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    for (let x = x0 + r() * 300; x < x1; x += 260 + r() * 260) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 26 + k * 7); g.stroke(); }
  }
}
function wallPaint(g, x0, x1, y0, y1, lo = N.wallLo, hi = N.wallHi) { g.fillStyle = lg(g, 0, y0, 0, y1, [hi, N.wall, lo]); g.fillRect(x0, y0, x1 - x0, y1 - y0); }
function skirting(g, x0, x1, y, col = N.trim) { fillR(g, x0, y - 26, x1 - x0, 26, col); fillR(g, x0, y - 26, x1 - x0, 5, lite(col, .12)); }
function frameArt(g, x, y, w, h, kind = 0) {
  fillR(g, x - 8, y - 8, w + 16, h + 16, N.woodLo); fillR(g, x, y, w, h, '#2A2B52');
  if (kind === 0) { circ(g, x + w * .7, y + h * .32, w * .12, '#E2C98E'); poly(g, [[x, y + h], [x + w * .35, y + h * .5], [x + w * .6, y + h * .78], [x + w * .8, y + h * .58], [x + w, y + h]]); g.fillStyle = '#3E5A6E'; g.fill(); }
  else { for (let i = 0; i < 3; i++) circ(g, x + w * (.25 + i * .25), y + h * .55, w * .1, ['#B5745A', '#D8B271', '#6F8F8A'][i]); }
}

// ---------- BEDROOM ----------
// bed: headboard 90–135, mattress 135–780, top surface 1440–1462, front 1462–1500
export const BED = { x0: 135, x1: 780, top: 1446, front: 1464, hem: 1500, hipX: 440, hipY: 1452 };
export function bedroomBack(g, t, { ss = null } = {}) {
  wallPaint(g, -600, 1700, -400, 1410);
  fillR(g, -600, -400, 2300, 150, N.ceil);
  // window with moon
  const wx = 470, wy = 740, ww = 280, wh = 400;
  g.save(); rr(g, wx, wy, ww, wh, 4); g.fillStyle = lg(g, 0, wy, 0, wy + wh, N.sky); g.fill(); g.clip();
  const r = rnd(5); for (let i = 0; i < 26; i++) circ(g, wx + r() * ww, wy + r() * wh * .7, .8 + r() * 1.6, rgba('#FFF6E0', .4 + .4 * Math.sin(t * 1.3 + i)));
  screenGlow(g, wx + ww * .7, wy + wh * .26, 160, N.moon, .55); circ(g, wx + ww * .7, wy + wh * .26, 34, N.moonCore); circ(g, wx + ww * .7 + 12, wy + wh * .26 - 6, 30, mix(N.sky[1], N.moon, .2));
  // rooftops outside
  poly(g, [[wx, wy + wh], [wx, wy + wh * .78], [wx + 60, wy + wh * .7], [wx + 120, wy + wh * .78], [wx + 120, wy + wh * .74], [wx + 200, wy + wh * .66], [wx + ww, wy + wh * .74], [wx + ww, wy + wh]]); g.fillStyle = '#191A3A'; g.fill();
  for (const [x, y] of [[wx + 40, wy + wh * .84], [wx + 160, wy + wh * .8], [wx + 220, wy + wh * .86]]) fillR(g, x, y, 12, 16, rgba(N.lamp, .7));
  g.restore();
  g.strokeStyle = N.woodLo; g.lineWidth = 10; rr(g, wx, wy, ww, wh, 4); g.stroke(); line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, N.woodLo, 8, 'butt'); line(g, wx, wy + wh * .45, wx + ww, wy + wh * .45, N.woodLo, 8, 'butt');
  fillR(g, wx - 22, wy + wh, ww + 44, 16, N.woodLo); fillR(g, wx - 22, wy + wh, ww + 44, 5, N.woodHi);
  // curtains
  for (const s of [-1, 1]) { const cx = s < 0 ? wx - 40 : wx + ww + 40; g.fillStyle = lg(g, cx - 40, 0, cx + 40, 0, ['#4A3F72', '#5D5089', '#43396A']); g.beginPath(); g.moveTo(cx - 44, wy - 40); g.lineTo(cx + 44, wy - 40); g.quadraticCurveTo(cx + 30 + s * 6, wy + wh * .6, cx + 40, wy + wh + 60); g.lineTo(cx - 40, wy + wh + 60); g.quadraticCurveTo(cx - 30 + s * 6, wy + wh * .6, cx - 44, wy - 40); g.fill(); for (let k = -1; k <= 1; k++) line(g, cx + k * 22, wy - 30, cx + k * 22 + s * 4, wy + wh + 50, rgba('#2C2550', .5), 4); }
  fillR(g, wx - 110, wy - 50, ww + 220, 12, N.woodLo);
  // clock (hidden tell: second hand frozen in the dreams)
  clock(g, 300, 880, 44, 3, 7, ss);
  // door to the hallway (right)
  fillR(g, 858, 1000, 184, 410, N.woodLo); fillR(g, 872, 1012, 156, 398, '#141430'); poly(g, [[872, 1012], [930, 1030], [930, 1410], [872, 1410]]); g.fillStyle = N.wood; g.fill();
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .18; fillR(g, 1000, 1012, 28, 398, N.lamp); g.restore();
  circ(g, 920, 1230, 6, N.woodHi);
  // floor
  planks(g, -600, 1700, 1410, 2400, 3);
  skirting(g, -600, 858, 1410); skirting(g, 1042, 1700, 1410);
  // rug
  ell(g, 820, 1640, 230, 40, '#6E4A63'); ell(g, 820, 1640, 196, 30, '#835A74'); g.strokeStyle = rgba('#E9CFA4', .35); g.lineWidth = 3; g.beginPath(); g.ellipse(820, 1640, 170, 24, 0, 0, TAU); g.stroke();
  // nightstand + lamp
  fillR(g, -60, 1312, 150, 12, N.woodHi); fillR(g, -54, 1324, 138, 236, N.wood); fillR(g, -54, 1324, 138, 6, N.woodLo); fillR(g, -42, 1350, 114, 4, N.woodLo); circ(g, 15, 1420, 6, N.woodHi);
  fillRR(g, -10, 1292, 50, 22, 6, '#3E6C69'); line(g, 15, 1294, 15, 1210, '#3A3044', 6);
  poly(g, [[-30, 1216], [60, 1216], [42, 1150], [-12, 1150]]); g.fillStyle = lg(g, 0, 1150, 0, 1216, ['#FFDCA0', '#F2B66A']); g.fill();
  // headboard
  fillRR(g, 86, 1230, 52, 320, 10, N.wood); fillRR(g, 92, 1238, 8, 300, 3, N.woodHi);
}
// warm lamp spill + moonlight shaft, drawn after the occupant
export function bedroomLight(g, t, { lamp = 1 } = {}) {
  screenGlow(g, 15, 1190, 620, N.lamp, .42 * lamp); screenGlow(g, 15, 1190, 150, N.lampCore, .7 * lamp);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .1 * lamp; g.fillStyle = N.lamp; poly(g, [[-30, 1216], [60, 1216], [420, 1560], [-300, 1560]]); g.fill(); g.restore();
  shaft(g, [[470, 760], [750, 760], [900, 1500], [600, 1500]], N.moon, .1, 26);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .16; g.fillStyle = N.moon; poly(g, [[560, 1440], [780, 1440], [800, 1500], [600, 1500]]); g.fill(); g.restore();
  dust(g, t, 380, 760, 520, 760, 26, 7, '#E6E1FF', .5);
}
export function bedFrame(g) {
  const { x0, x1, top, front, hem } = BED;
  fillR(g, x0 - 10, hem, x1 - x0 + 30, 26, N.woodLo); fillR(g, x0 - 10, hem, x1 - x0 + 30, 5, N.wood);
  for (const x of [x0 + 10, x1 - 8]) fillR(g, x, hem + 26, 18, FY - hem - 26 - 6, N.woodLo);
  ell(g, (x0 + x1) / 2, FY - 2, (x1 - x0) * .56, 14, rgba(P.night, .35));
  // mattress + sheet
  fillRR(g, x0, top - 4, x1 - x0, hem - top + 4, 14, N.sheetLo); fillRR(g, x0, top - 4, x1 - x0, front - top + 8, 12, N.sheet);
  line(g, x0 + 10, front + 2, x1 - 10, front + 2, rgba(N.sheetLo, .8), 3);
  // footboard
  fillRR(g, x1 - 6, 1380, 40, 170, 8, N.wood); fillRR(g, x1, 1386, 7, 150, 3, N.woodHi);
}
export function pillow(g, x = 220, y = 1424, squash = 0) {
  g.beginPath(); g.ellipse(x, y, 112, 30 - squash * 5, -.04, 0, TAU); g.fillStyle = N.pillow; g.fill(); g.lineWidth = 3.5; g.strokeStyle = rgba(P.ink, .7); g.stroke();
  line(g, x - 70, y + 8, x + 60, y + 12, rgba(N.sheetLo, .6), 3);
}
// blanket: covers the bed from x = from to the foot, with a bumpy top over the legs and a hem over the mattress front.
// o: { from, heap (0..1 thrown into a pile at the foot), legs: [[x,h],...] bump centres, wet (0..1), t }
export function blanket(g, t, o = {}) {
  const { x1, top, hem } = BED, heap = o.heap || 0, from = lerp(o.from ?? 330, 600, heap), xe = x1 + 18;
  const lift = o.lift || 0, lx = o.liftX ?? 590, lb = x => Math.exp(-(((x - lx) / 150) ** 2)), hemY = x => hem + 18 + Math.sin(x * .07 + 1) * 5 * (1 - lb(x) * lift) - lift * 170 * lb(x);
  const bumps = o.legs || [], ht = x => { let h = 10 + lift * 150 * lb(x); for (const [bx, bh, bw = 90] of bumps) h += bh * Math.exp(-(((x - bx) / bw) ** 2)); return h * (1 - heap) + heap * (40 + 46 * Math.sin(clamp((x - from) / (xe - from)) * Math.PI) + 10 * Math.sin(x * .05)); };
  const pts = []; for (let x = from; x <= xe; x += 12) pts.push([x, top - ht(x)]);
  // under a lifted blanket: warm shadowed hollow over a clean, dry sheet
  if (lift > .02) { g.save(); g.globalAlpha = lift; g.fillStyle = rg(g, lx, top - 20, 10, 260, [rgba('#2A1F33', .35), rgba('#2A1F33', 0)]); g.fillRect(lx - 280, top - 260, 560, 300); g.restore(); }
  g.save();
  g.beginPath(); g.moveTo(from - 6, top + 4); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(xe, hemY(xe));
  for (let x = xe; x >= from; x -= 12) g.lineTo(x, hemY(x));
  g.lineTo(from - 10, hemY(from) - 4); g.closePath();
  g.fillStyle = lg(g, 0, top - 60, 0, hem + 20, [N.blanketHi, N.blanket, N.blanketLo]); g.fill(); g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = rgba(P.ink, .75); g.stroke();
  g.clip();
  // folds + quilt stitching
  g.lineCap = 'round';
  for (let k = 0; k < 6; k++) { const x = lerp(from + 40, xe - 30, k / 5) + Math.sin(k * 3.1) * 14; line(g, x, top + 6, x - 8 + (k % 2) * 16, hem + 12, rgba(N.blanketLo, .55), 4); }
  g.setLineDash([10, 9]); for (let x = from + 70; x < xe; x += 120) line(g, x, top - 10, x, hem + 8, rgba(N.blanketHi, .35), 2.5); g.setLineDash([]);
  if (heap > .05) for (let k = 0; k < 5; k++) { const x = lerp(from + 30, xe - 30, k / 4); g.globalAlpha = heap; g.strokeStyle = rgba(N.blanketLo, .7); g.lineWidth = 4; g.beginPath(); g.moveTo(x - 30, top - ht(x) * .5); g.quadraticCurveTo(x, top - ht(x) * .9, x + 30, top - ht(x) * .4); g.stroke(); g.globalAlpha = 1; }
  // the wet patch (finale only): a dark soak spreading from the hips, with a faint sheen
  if (o.wet > 0) {
    const cx = o.wetX ?? 470, w = o.wet, cy = (top + hem) / 2 - 10;
    const blob = (k, rx = 128, ry = 64) => { g.beginPath(); for (let i = 0; i <= 36; i++) { const a = i / 36 * TAU, r_ = (1 + .14 * Math.sin(a * 3 + 1) + .08 * Math.sin(a * 5 + 2)) * w * k; const x = cx + Math.cos(a) * rx * r_, y = cy + Math.sin(a) * ry * r_; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
    // a soak: the same blanket, darker and more saturated (not a brown stain), with a wet sheen and ripple edges
    g.save(); g.globalCompositeOperation = 'multiply'; blob(1); g.fillStyle = rgba('#A8783E', .9); g.fill(); blob(.72); g.fillStyle = rgba('#C49A5A', .55); g.fill(); g.restore();
    g.save(); blob(1); g.lineWidth = 3; g.strokeStyle = rgba('#6E4A2A', .55 * w); g.stroke(); blob(.84); g.lineWidth = 2; g.strokeStyle = rgba('#FFF1D2', .22 * w); g.stroke(); g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .55 * w;
    ell(g, cx - 46 * w, cy - 26 * w, 40 * w, 7 * w, '#DDEBFF', -.12); ell(g, cx + 30 * w, cy - 32 * w, 16 * w, 4 * w, '#DDEBFF', -.1); circ(g, cx + 70 * w, cy + 8 * w, 4 * w, '#EEF4FF'); circ(g, cx - 80 * w, cy + 14 * w, 3 * w, '#EEF4FF');
    g.restore();
  }
  g.restore();
  if (lift > .02) { g.save(); g.lineCap = 'round'; for (let x = from; x <= xe; x += 8) { const k = lb(x) * lift; if (k < .05) continue; line(g, x, hemY(x), x, hemY(x) - 34 * k, mix(N.blanketLo, '#2A1F33', .35), 9); } g.beginPath(); for (let x = from; x <= xe; x += 8) { const y = hemY(x); x === from ? g.moveTo(x, y) : g.lineTo(x, y); } g.lineWidth = 4; g.strokeStyle = rgba(P.ink, .75); g.stroke(); g.restore(); }
  // turned-down sheet cuff at the top edge
  if (heap < .9) { g.save(); g.globalAlpha = 1 - heap; const y0 = top - ht(from) - 2; g.lineCap = 'round'; line(g, from + 4, y0 + 4, from + 2, hemY(from) - 2, N.blanketHi, 7); line(g, from + 12, y0 + 10, from + 10, hemY(from) - 6, rgba(N.sheet, .5), 3); g.restore(); }
  return { from, ht, hemY };
}
// a dark patch on the sheet itself, visible when the blanket edge is lifted / beside the hem (finale)
export function sheetWet(g, x, y, w) {
  if (w <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; ell(g, x, y, 150 * w, 22 * w, rgba('#6A5A58', .7)); g.restore();
}

// ---------- HALLWAY (side view, the dreamer walks left → right) ----------
// bedroom door 0–170, pictures, moon window, light switch at 1640, bathroom door 1700–1880
export const HALL = { bedDoor: 105, sw: [790, 1215], bathDoor: [840, 1020] };
export function hallway(g, t, { bathLight = 1 } = {}) {
  wallPaint(g, -800, 2800, -400, 1420); fillR(g, -800, -400, 3600, 180, N.ceil);
  // wainscot
  fillR(g, -800, 1180, 3600, 240, mix(N.wall, N.wallHi, .4)); fillR(g, -800, 1176, 3600, 10, N.trim);
  for (let x = -760; x < 2800; x += 150) fillR(g, x, 1205, 110, 180, rgba(N.wallHi, .45));
  // bedroom door (left) with the lamp's glow
  fillR(g, 8, 990, 194, 430, N.woodLo); g.fillStyle = lg(g, 0, 1000, 0, 1420, ['#3B2C3C', '#6E4C3E']); g.fillRect(24, 1004, 162, 416);
  screenGlow(g, 80, 1250, 260, N.lamp, .3);
  frameArt(g, 250, 990, 120, 96, 0); frameArt(g, 640, 960, 90, 130, 1);
  // moon window
  g.save(); rr(g, 430, 860, 150, 230, 4); g.fillStyle = lg(g, 0, 860, 0, 1090, N.sky); g.fill(); g.clip(); circ(g, 535, 920, 20, N.moonCore); screenGlow(g, 535, 920, 120, N.moon, .5); g.restore();
  g.strokeStyle = N.woodLo; g.lineWidth = 9; rr(g, 430, 860, 150, 230, 4); g.stroke(); line(g, 505, 860, 505, 1090, N.woodLo, 7, 'butt'); fillR(g, 416, 1090, 178, 12, N.woodLo);
  // light switch
  fillRR(g, HALL.sw[0] - 14, HALL.sw[1] - 22, 28, 44, 4, '#E9DFC9'); fillRR(g, HALL.sw[0] - 5, HALL.sw[1] - 12 + (bathLight > .5 ? 0 : 10), 10, 14, 2, '#BDB29A');
  // bathroom doorway (right): lit or dark
  const [d0, d1] = HALL.bathDoor; fillR(g, d0 - 14, 986, d1 - d0 + 28, 434, N.woodLo);
  g.fillStyle = bathLight > .02 ? lg(g, 0, 1000, 0, 1420, [mix('#1A1838', '#FFE6B0', bathLight), mix('#1A1838', '#F4C77E', bathLight)]) : '#1A1838'; g.fillRect(d0, 1000, d1 - d0, 420);
  if (bathLight > .02) { fillR(g, d0 + 40, 1060, 90, 300, rgba('#E8D2A8', bathLight * .8)); for (let y = 1250; y < 1420; y += 30) line(g, d0, y, d1, y, rgba(N.grout, bathLight * .6), 2); }
  planks(g, -800, 2800, 1420, 2400, 9);
  skirting(g, -800, 8, 1420); skirting(g, 202, d0 - 14, 1420); skirting(g, d1 + 14, 2800, 1420);
  // runner rug
  fillR(g, 60, 1590, 900, 60, '#5B3E5A'); fillR(g, 60, 1598, 900, 4, rgba('#E2C08F', .4)); fillR(g, 60, 1638, 900, 4, rgba('#E2C08F', .4));
  if (bathLight > .02) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .5 * bathLight; g.fillStyle = N.lamp; poly(g, [[d0, 1420], [d1, 1420], [d1 + 160, 1900], [d0 - 220, 1900]]); g.fill(); g.restore(); screenGlow(g, (d0 + d1) / 2, 1200, 520, N.lamp, .32 * bathLight); }
}
export function hallwayLight(g, t) { shaft(g, [[430, 880], [580, 880], [520, 1600], [300, 1600]], N.moon, .12, 22); dust(g, t, 100, 900, 900, 700, 34, 4, '#E6E1FF', .45); }

// one-point view down the hallway back to the bedroom door (POV)
export function hallPOV(g, t) {
  const vx = 540, vy = 900, f = 820, Wc = 210, eye = 300, Hc = 640, zn = 140, zf = 2400;
  const pr = (X, Y, Z) => [vx + f * X / Z, vy + f * Y / Z], fl = eye, ce = eye - Hc;
  const fog = (c, Z) => mix(c, '#151532', clamp(Z / zf) * .55);
  g.fillStyle = N.ceil; poly(g, [pr(-Wc, ce, zn), pr(Wc, ce, zn), pr(Wc, ce, zf), pr(-Wc, ce, zf)]); g.fill();
  g.fillStyle = lg(g, 0, vy, 0, 1920, [N.floorLo, N.floor, N.floorHi]); poly(g, [pr(-Wc, fl, zn), pr(Wc, fl, zn), pr(Wc, fl, zf), pr(-Wc, fl, zf)]); g.fill();
  g.strokeStyle = rgba(N.floorLo, .6); g.lineWidth = 2.5; for (let k = -4; k <= 4; k++) { const a = pr(k * Wc / 5, fl, zn), b = pr(k * Wc / 5, fl, zf); line(g, a[0], a[1], b[0], b[1], rgba(N.floorLo, .6), 2.5); }
  // runner
  g.fillStyle = '#5B3E5A'; poly(g, [pr(-70, fl, zn), pr(70, fl, zn), pr(70, fl, zf - 100), pr(-70, fl, zf - 100)]); g.fill();
  for (const side of [-1, 1]) for (let i = 0; i < 18; i++) {
    const z0 = zn * Math.pow(zf / zn, i / 18), z1 = zn * Math.pow(zf / zn, (i + 1) / 18), zm = (z0 + z1) / 2;
    const wq = (h0, h1, col) => quad(g, pr(side * Wc, fl - h0, z0), pr(side * Wc, fl - h0, z1), pr(side * Wc, fl - h1, z1), pr(side * Wc, fl - h1, z0), col);
    wq(0, Hc, fog(side < 0 ? N.wall : N.wallLo, zm)); wq(0, 240, fog(mix(N.wall, N.wallHi, .4), zm)); wq(236, 246, fog(N.trim, zm)); wq(0, 26, fog(N.trim, zm));
  }
  // picture frames on the left, moon window on the right
  const fq = (side, z0, z1, h0, h1, col) => quad(g, pr(side * Wc, fl - h0, z0), pr(side * Wc, fl - h0, z1), pr(side * Wc, fl - h1, z1), pr(side * Wc, fl - h1, z0), col);
  fq(-1, 700, 860, 330, 450, N.woodLo); fq(-1, 715, 845, 342, 438, '#2A2B52'); fq(-1, 1250, 1350, 300, 470, N.woodLo); fq(-1, 1262, 1338, 312, 458, '#2A2B52');
  fq(1, 520, 760, 290, 540, N.woodLo); fq(1, 535, 745, 302, 528, '#2E3270'); const mw = pr(Wc, fl - 470, 600); circ(g, mw[0] - 26, mw[1], 14, N.moonCore);
  // the end: bedroom door, lamp glow inside
  const e0 = pr(-Wc, ce, zf), e1 = pr(Wc, fl, zf); g.fillStyle = fog(N.wall, zf); g.fillRect(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1]);
  const d0 = pr(-80, fl - 300, zf), d1 = pr(80, fl, zf); fillR(g, d0[0] - 6, d0[1] - 6, d1[0] - d0[0] + 12, d1[1] - d0[1] + 6, N.woodLo);
  g.fillStyle = lg(g, 0, d0[1], 0, d1[1], ['#5A4050', '#B8875A']); g.fillRect(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1]);
  screenGlow(g, (d0[0] + d1[0]) / 2, (d0[1] + d1[1]) / 2, 230, N.lamp, .35);
  shaft(g, [pr(Wc, fl - 540, 520), pr(Wc, fl - 290, 760), pr(40, fl, 900), pr(-60, fl, 640)], N.moon, .1, 20);
  // warm spill from the lit bathroom behind the camera
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .28; g.fillStyle = rg(g, 540, 2000, 50, 900, [N.lamp, 'rgba(0,0,0,0)']); g.fillRect(0, 1100, 1080, 900); g.restore();
  dust(g, t, 150, 400, 780, 1100, 34, 8, '#E6E1FF', .45);
}

// ---------- BATHROOM (side view; door left, sink + mirror, towel, window, toilet right) ----------
export const BATH = { door: [20, 190], sink: 330, towel: 490, win: [580, 820, 140, 150], toilet: { front: 760, back: 900, rim: 1452, hinge: [892, 1448] }, light: [560, 640] };
export function bathroomBack(g, t, { towelSide = -1 } = {}) {
  // upper wall, warm
  g.fillStyle = lg(g, 0, 300, 0, 1150, ['#B88C62', N.bathWall]); g.fillRect(-600, -400, 2200, 1560);
  fillR(g, -600, -400, 2200, 380, mix(N.ceil, '#8A6A58', .3));
  // tiles to 1150
  fillR(g, -600, 1150, 2200, 270, N.tile); g.strokeStyle = N.grout; g.lineWidth = 2.5;
  for (let y = 1150; y <= 1420; y += 45) line(g, -600, y, 1600, y, N.grout, 2.5);
  for (let x = -600, k = 0; x < 1600; x += 45, k++) line(g, x, 1150, x, 1420, N.grout, 2);
  fillR(g, -600, 1140, 2200, 14, '#D5BE94'); fillR(g, -600, 1140, 2200, 4, '#F6E8C8');
  // door (left), open onto the dark hall
  const [d0, d1] = BATH.door; fillR(g, d0 - 14, 970, d1 - d0 + 28, 450, N.woodHi); fillR(g, d0, 984, d1 - d0, 436, '#1E1D3C'); poly(g, [[d0, 984], [d0 + 46, 1000], [d0 + 46, 1420], [d0, 1420]]); g.fillStyle = N.wood; g.fill();
  // small window with moonlight
  const [wx, wy, ww, wh] = BATH.win; g.save(); rr(g, wx, wy, ww, wh, 4); g.fillStyle = lg(g, 0, wy, 0, wy + wh, ['#1A2350', '#33468A']); g.fill(); g.clip(); circ(g, wx + ww * .66, wy + wh * .34, 16, '#EAF0FF'); screenGlow(g, wx + ww * .66, wy + wh * .34, 90, '#9EB8F0', .6); g.restore();
  g.strokeStyle = '#F2E6CC'; g.lineWidth = 9; rr(g, wx, wy, ww, wh, 4); g.stroke(); line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, '#F2E6CC', 6, 'butt'); fillR(g, wx - 12, wy + wh, ww + 24, 10, '#F2E6CC');
  // mirror over the sink
  const sx = BATH.sink; fillRR(g, sx - 92, 900, 184, 230, 16, '#CFC2A6'); fillRR(g, sx - 82, 910, 164, 210, 12, lg(g, 0, 910, 0, 1120, ['#7F8FA8', '#5D6B88']));
  g.save(); g.globalAlpha = .28; line(g, sx - 50, 930, sx + 10, 990, '#FFFFFF', 10); line(g, sx - 20, 930, sx + 40, 990, '#FFFFFF', 5); g.restore();
  // sink
  fillRR(g, sx - 30, 1290, 60, 270, 12, N.porcelain); fillR(g, sx - 30, 1290, 14, 270, rgba(N.porcelainLo, .5));
  g.beginPath(); g.moveTo(sx - 110, 1252); g.lineTo(sx + 110, 1252); g.quadraticCurveTo(sx + 100, 1320, sx, 1324); g.quadraticCurveTo(sx - 100, 1320, sx - 110, 1252); g.fillStyle = N.porcelain; g.fill(); g.lineWidth = 3.5; g.strokeStyle = rgba(P.ink, .55); g.stroke();
  fillRR(g, sx - 114, 1244, 228, 16, 6, '#FFFDF6'); line(g, sx + 40, 1244, sx + 40, 1206, '#B9B4C4', 8); line(g, sx + 40, 1206, sx + 10, 1206, '#B9B4C4', 7);
  // toothbrush cup
  fillRR(g, sx - 90, 1206, 26, 38, 5, '#7FB3AE'); line(g, sx - 80, 1206, sx - 86, 1170, '#E98773', 5);
  // towel bar + towel (the tell: it changes sides between dreams)
  const tx = BATH.towel; line(g, tx - 60, 1110, tx + 60, 1110, '#B9B4C4', 7);
  const tw = 70, ox = towelSide < 0 ? -34 : 34;
  poly(g, [[tx + ox - tw / 2, 1106], [tx + ox + tw / 2, 1106], [tx + ox + tw / 2 + 4, 1290], [tx + ox - tw / 2 - 4, 1290]]); g.fillStyle = '#6F9C9A'; g.fill(); fillR(g, tx + ox - tw / 2 - 4, 1262, tw + 8, 10, '#E9DDC2');
  line(g, tx + ox - tw / 2, 1106, tx + ox + tw / 2, 1106, '#4F7C7A', 6);
  // floor tiles
  g.fillStyle = lg(g, 0, 1420, 0, 2400, ['#C9B48E', '#DCC8A2', '#E6D5B2']); g.fillRect(-600, 1420, 2200, 1000);
  for (let y = 1420, k = 0; y < 2400; y += 40 + k * 9, k++) line(g, -600, y, 1600, y, rgba('#A68F68', .55), 2.5);
  for (let x = -600; x < 1600; x += 90) line(g, x, 1420, x + (x - 540) * .9, 2400, rgba('#A68F68', .4), 2);
  fillR(g, -600, 1412, 2200, 12, '#BCA47C');
  // bath mat
  fillRR(g, 470, 1580, 230, 40, 12, '#8FB4B0'); fillRR(g, 470, 1580, 230, 7, 4, '#B4D2CC');
}
// toilet in side view, bowl pointing left. lid: 0 closed … 1 up against the tank
export function toilet(g, lid = 0, { seat = 0 } = {}) {
  const T = BATH.toilet, [hx, hy] = T.hinge;
  ell(g, 830, FY - 2, 120, 12, rgba(P.night, .25));
  // tank against the right wall
  fillRR(g, 900, 1290, 80, 160, 12, N.porcelain); fillR(g, 900, 1290, 80, 8, '#FFFFFF'); fillRR(g, 892, 1280, 96, 18, 7, '#FFFDF6'); fillRR(g, 940, 1310, 26, 8, 4, '#B9B4C4');
  g.lineWidth = 3.5; g.strokeStyle = rgba(P.ink, .5); rr(g, 900, 1290, 80, 160, 12); g.stroke();
  // pedestal + bowl
  g.beginPath(); g.moveTo(800, FY); g.quadraticCurveTo(810, 1500, 790, 1470); g.lineTo(915, 1470); g.quadraticCurveTo(900, 1510, 905, FY); g.closePath(); g.fillStyle = N.porcelain; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(T.front - 12, T.rim); g.quadraticCurveTo(T.front - 6, 1500, 830, 1505); g.quadraticCurveTo(905, 1500, T.back + 6, T.rim); g.closePath(); g.fillStyle = lg(g, 0, T.rim, 0, 1505, ['#FFFFFF', N.porcelain, N.porcelainLo]); g.fill(); g.stroke();
  // seat ring
  fillRR(g, T.front - 16, T.rim - 10, T.back - T.front + 24, 14, 6, '#FFFDF6'); g.lineWidth = 3; rr(g, T.front - 16, T.rim - 10, T.back - T.front + 24, 14, 6); g.stroke();
  // lid, hinged at the back
  const a = lid * 1.62, L = T.back - T.front + 26;
  g.save(); g.translate(hx, hy - 8); g.rotate(a); fillRR(g, -L, -12, L, 14, 7, '#FFFFFF'); g.lineWidth = 3.5; g.strokeStyle = rgba(P.ink, .6); rr(g, -L, -12, L, 14, 7); g.stroke(); fillR(g, -L + 10, -10, L - 20, 3, rgba(N.porcelainLo, .7)); g.restore();
  circ(g, hx, hy - 8, 6, '#B9B4C4');
}
export function bathroomNight(g) {
  const [lx, ly] = BATH.light; g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = rg(g, lx + 60, ly + 520, 120, 1250, ['#FFFFFF', '#E6DCEB', '#9C93BE', '#5D5688']); g.fillRect(-800, -600, 2600, 3400); g.restore();
}
export function bathroomLight(g, t, { on = 1 } = {}) {
  const [lx, ly] = BATH.light;
  ell(g, lx, ly - 4, 70, 18, '#E9DDC2'); ell(g, lx, ly + 6, 56, 16, lite(N.lampCore, .2));
  screenGlow(g, lx, ly, 700, N.lamp, .3 * on); screenGlow(g, lx, ly + 10, 160, N.lampCore, .7 * on);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .08 * on; g.fillStyle = N.lamp; poly(g, [[lx - 60, ly + 10], [lx + 60, ly + 10], [lx + 520, FY + 200], [lx - 520, FY + 200]]); g.fill(); g.restore();
  const [wx, wy, ww, wh] = BATH.win; shaft(g, [[wx, wy + 10], [wx + ww, wy + 10], [wx + ww - 120, FY], [wx - 260, FY]], '#9EB8F0', .12, 22);
  dust(g, t, 300, 700, 600, 700, 22, 11, '#FFF2CF', .45);
}
