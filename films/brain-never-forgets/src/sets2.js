// Sets for THE BRAIN NEVER FORGETS: exam booklet, bus (outside and in), bathroom, bedside, bedroom, pillow, mind-space.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, cloud, foliage, tree, rnd } from './kit.js';
import { sunQuad, win, desk, clock } from './sets.js';

// ---------- handwriting: unreadable pencil scribble along a line, revealed up to u (0..1) ----------
export function scribble(g, x0, y0, len, seed, u = 1, { col = '#4A4570', w = 3.4, amp = 9 } = {}) {
  const r = rnd(seed), n = Math.max(2, Math.floor(len / 4 * u));
  g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  let gap = 0;
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * 4, ph = i * .9 + r() * .3, wordBreak = (i % 23) > 19;
    const y = y0 + Math.sin(ph) * amp * (.55 + .45 * Math.sin(i * .37 + seed)) - (i % 7 === 0 ? amp * .6 : 0);
    if (wordBreak) { gap = 1; continue; }
    if (gap || i === 0) { g.moveTo(x, y); gap = 0; } else g.lineTo(x, y);
  }
  g.stroke(); g.restore();
  return [x0 + n * 4, y0];
}

// ---------- the exam booklet, open, seen from above (world units, centre cx,cy) ----------
// mode 'open': two pages of answers, last line on the right page being written (writeU); 'q14': the memory page
export function booklet(g, t, cx, cy, s = 1, { rot = -.06, writeU = 1, dot = 0 } = {}) {
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(s, s);
  fillRR(g, -462, -598, 940, 1210, 10, rgba(P.night, .28));
  for (const sd of [-1, 1]) { fillRR(g, sd < 0 ? -460 : 0, -610, 460, 1200, 6, sd < 0 ? '#F7EEDB' : P.paper); }
  g.fillStyle = lg(g, -40, 0, 40, 0, [rgba(P.lavDeep, 0), rgba(P.lavDeep, .22), rgba(P.lavDeep, 0)]); g.fillRect(-40, -610, 80, 1200);
  // ruled lines + margin
  for (let k = 0; k < 22; k++) { const yy = -520 + k * 50; line(g, -430, yy, -30, yy, rgba('#9FB7D0', .55), 2); line(g, 30, yy, 430, yy, rgba('#9FB7D0', .55), 2); }
  line(g, -380, -600, -380, 580, rgba(P.rust, .35), 2); line(g, 80, -600, 80, 580, rgba(P.rust, .35), 2);
  // answers: left page full, right page down to the last line
  for (let k = 0; k < 21; k++) { if (k % 6 === 0) { fillR(g, -428, -538 + k * 50, 34, 12, rgba(P.ink, .55)); continue; } scribble(g, -370, -530 + k * 50, 300 + ((k * 53) % 60), 100 + k); }
  const last = 13;
  for (let k = 0; k < last; k++) { if (k % 5 === 0) { fillR(g, 32, -538 + k * 50, 34, 12, rgba(P.ink, .55)); continue; } scribble(g, 90, -530 + k * 50, 280 + ((k * 37) % 50), 300 + k); }
  const tip = scribble(g, 90, -530 + last * 50, 250, 377, writeU);
  if (dot > 0) circ(g, 90 + 250 + 10, -530 + last * 50 + 4, 5.5 * dot, '#4A4570');
  g.restore();
  // the pencil tip in world coordinates
  const lx = (dot > 0 ? 350 : tip[0] - 0) * s, ly = (-530 + last * 50 + (dot > 0 ? 4 : 0)) * s;
  return [cx + lx * Math.cos(rot) - ly * Math.sin(rot), cy + lx * Math.sin(rot) + ly * Math.cos(rot)];
}
// the memory page: question 14 and the answer he wrote, legible this time
export function memoryPage(g, t, cx, cy, s = 1) {
  g.save(); g.translate(cx, cy); g.rotate(-.035); g.scale(s, s);
  fillRR(g, -468, -560, 960, 1140, 10, rgba(P.night, .3)); fillRR(g, -480, -580, 960, 1140, 8, P.paper);
  for (let k = 0; k < 20; k++) line(g, -440, -480 + k * 54, 440, -480 + k * 54, rgba('#9FB7D0', .5), 2);
  line(g, -360, -580, -360, 560, rgba(P.rust, .35), 2);
  text(g, '13.', -400, -430, { size: 34, font: F.ui, weight: '600', col: rgba(P.ink, .45), align: 'left' });
  for (let k = 0; k < 3; k++) scribble(g, -330, -428 + k * 54, 600 - k * 120, 900 + k, 1, { col: rgba('#4A4570', .45) });
  text(g, '14.', -400, -150, { size: 40, font: F.ui, weight: '700', col: P.ink, align: 'left' });
  text(g, 'The medical term for', -330, -150, { size: 46, font: F.ui, weight: '600', col: P.ink, align: 'left' });
  text(g, 'shortness of breath is:', -330, -92, { size: 46, font: F.ui, weight: '600', col: P.ink, align: 'left' });
  text(g, 'Hypotension', -300, 60, { size: 128, font: F.hand, col: '#3E3966', align: 'left', rot: -.03 });
  g.strokeStyle = '#3E3966'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-300, 132); g.quadraticCurveTo(0, 116, 330, 128); g.stroke();
  text(g, '15.', -400, 300, { size: 34, font: F.ui, weight: '600', col: rgba(P.ink, .45), align: 'left' });
  for (let k = 0; k < 2; k++) scribble(g, -330, 302 + k * 54, 560 - k * 140, 950 + k, 1, { col: rgba('#4A4570', .45) });
  g.restore();
}
export function deskTop(g, t) {
  g.fillStyle = lg(g, 0, 0, 1080, 1920, ['#C99364', '#B57D50', '#9C6842']); g.fillRect(-200, -200, 1480, 2320);
  const r = rnd(41); g.strokeStyle = rgba(P.woodDark, .25); g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const y0 = -100 + i * 85 + r() * 30; g.beginPath(); g.moveTo(-200, y0); for (let x = -200; x <= 1300; x += 60) g.lineTo(x, y0 + Math.sin(x * .004 + i) * 14 + Math.sin(x * .013 + i * 2) * 5); g.stroke(); }
}

// ---------- classroom extras' simple "done" pose helper lives in film.js; the room is sets.room ----------

// ---------- the bus, outside, at sunset ----------
const SKY = [[0, '#3E3772'], [.22, '#6D5FA0'], [.45, '#B08FBE'], [.62, '#E9A49A'], [.8, '#F7B36B'], [1, '#FFDC95']];
export function sunsetSky(g, t, HZ, sx = 820, { W0 = -300, W1 = 1380 } = {}) {
  g.fillStyle = lg(g, 0, -200, 0, HZ, SKY); g.fillRect(W0, -400, W1 - W0, HZ + 400);
  const sy = HZ - 90;
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(g, sx, sy, 30, 700, [rgba('#FFF6CF', 1), rgba('#FFD27E', .5), rgba('#F2A65A', .2), 'rgba(0,0,0,0)']); g.fillRect(W0, -300, W1 - W0, HZ + 900); g.restore();
  g.fillStyle = rg(g, sx, sy, 10, 88, ['#FFFDF0', '#FFF3C4', '#FFDC8E']); g.beginPath(); g.arc(sx, sy, 88, 0, TAU); g.fill();
  const cl = (x, y, s, a) => { cloud(g, x, y, s, '#8C76AE', a); cloud(g, x + 6 * s, y + 13 * s, s * .96, '#F2A08A', a); cloud(g, x + 12 * s, y + 24 * s, s * .9, '#FFD08A', a * .9); };
  cl(-160 + t * 6, 300, 1.8, .9); cl(560 + t * 4, 170, 1.3, .8); cl(300 + t * 5, 560, 1.1, .75); cl(880 + t * 3, 690, .9, .65);
  return { sx, sy };
}
// a scrolling strip of silhouettes; off = scroll offset (px), the strip repeats every per px
function strip(g, off, per, n, fn, W0 = -300, W1 = 1380) {
  const k0 = Math.floor((W0 - off) / per) - 1, k1 = Math.ceil((W1 - off) / per) + 1;
  for (let k = k0; k <= k1; k++) fn(off + k * per, ((k % n) + n) % n);
}
export function busExterior(g, t, { scroll = 0 } = {}) {
  const HZ = 1150; sunsetSky(g, t, HZ, 800);
  // far hills
  g.fillStyle = '#B98AA6'; g.beginPath(); g.moveTo(-300, HZ + 40);
  for (let x = -300; x <= 1380; x += 30) { const u = x - scroll * .06; g.lineTo(x, HZ - 50 - Math.sin(u * .005) * 34 - Math.sin(u * .013 + 2) * 14); } g.lineTo(1380, HZ + 40); g.fill();
  // town and trees, mid distance
  strip(g, scroll * .3, 260, 5, (x, i) => {
    const h = [150, 210, 120, 180, 240][i], col = '#8E6A96';
    fillR(g, x, HZ - h + 40, 120, h, col); poly(g, [[x - 8, HZ - h + 42], [x + 60, HZ - h - 20], [x + 128, HZ - h + 42]]); g.fillStyle = dark(col, .1); g.fill();
    for (let r = 0; r < 2; r++) fillRR(g, x + 24 + r * 46, HZ - h + 80, 26, 34, 3, i % 2 ? '#FFD88C' : '#6E5585');
    foliage(g, x + 190, HZ + 10, 110, ['#6E5585', '#81679A'], t, 3 + i);
  });
  // ground
  g.fillStyle = lg(g, 0, HZ + 30, 0, 1920, ['#D9A06E', '#B9785E', '#8E5670']); g.fillRect(-300, HZ + 30, 1680, 900);
  // road
  const RY0 = 1330, RY1 = 1560; fillR(g, -300, RY0, 1680, RY1 - RY0, '#5E4A66'); fillR(g, -300, RY0, 1680, 10, '#7A6280'); fillR(g, -300, RY1 - 6, 1680, 8, '#4A3A55');
  strip(g, scroll * 1.0, 220, 1, x => fillRR(g, x, 1448, 110, 12, 6, rgba('#FFE6B0', .75)));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = lg(g, 0, RY0, 0, RY1, [rgba('#FFCF8A', .25), rgba('#FFCF8A', 0)]); g.fillRect(-300, RY0, 1680, RY1 - RY0); g.restore();
  // near verge: grass + poles (fast)
  fillR(g, -300, RY1, 1680, 400, '#7E5C78');
  strip(g, scroll * 1.0, 520, 3, (x, i) => { fillR(g, x, 1010, 14, 330, '#4D3D62'); fillR(g, x - 40, 1030, 94, 10, '#4D3D62'); });
  // foreground hedge, out of focus speed
  g.save(); g.filter = 'blur(5px)'; strip(g, scroll * 1.7, 300, 4, (x, i) => foliage(g, x, 1830 + (i % 2) * 40, 230 + i * 25, ['#3A2D52', '#46375F'], t * .3, 41 + i)); fillR(g, -300, 1860, 1680, 400, '#3A2D52'); g.restore();
  return { HZ, RY0, RY1 };
}
// the bus, side view, facing left. (x, y) = front-bottom of the body at the road
export function bus(g, t, x, y, { wheelA = 0, bob = 0 } = {}) {
  g.save(); g.translate(x, y + bob);
  const L = 820, Hh = 330, body = '#D7AE5E', bodyD = '#B98E48', stripe = P.tealDeep;
  // shadow on the road
  g.save(); g.globalAlpha = .35; ell(g, L / 2, 18 - bob, L * .55, 22, '#3B2A48'); g.restore();
  // body
  g.beginPath(); g.moveTo(40, -40); g.lineTo(40, -Hh + 40); g.quadraticCurveTo(46, -Hh, 100, -Hh); g.lineTo(L - 20, -Hh); g.quadraticCurveTo(L, -Hh, L, -Hh + 22); g.lineTo(L, -40); g.closePath();
  g.fillStyle = lg(g, 0, -Hh, 0, -40, [lite(body, .2), body, bodyD]); g.fill(); g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
  // windows with passengers backlit by the sunset
  for (let i = 0; i < 6; i++) {
    const wx = 150 + i * 108; fillRR(g, wx, -Hh + 46, 88, 104, 8, '#FFD9A0');
    g.save(); rr(g, wx, -Hh + 46, 88, 104, 8); g.clip();
    g.fillStyle = lg(g, 0, -Hh + 46, 0, -Hh + 150, ['#FFE7B8', '#F7B36B']); g.fillRect(wx, -Hh + 46, 88, 104);
    if (i !== 0 && i !== 4) { circ(g, wx + 44 + Math.sin(t * 3 + i) * 2, -Hh + 112 + Math.sin(t * 5.2 + i * 2) * 2, 26, '#3B3257'); fillRR(g, wx + 14, -Hh + 132, 60, 40, 14, '#3B3257'); }
    g.restore(); rr(g, wx, -Hh + 46, 88, 104, 8); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke();
  }
  // windscreen + door
  poly(g, [[46, -Hh + 46], [118, -Hh + 46], [118, -Hh + 168], [42, -Hh + 168]]); g.fillStyle = '#FFE4AE'; g.fill(); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke();
  fillRR(g, 60, -Hh + 178, 54, 120, 4, dark(body, .14)); line(g, 87, -Hh + 182, 87, -48, P.ink, 3);
  fillR(g, 40, -118, L - 40, 22, stripe); fillR(g, 40, -84, L - 40, 7, dark(stripe, .2));
  fillRR(g, 22, -86, 30, 40, 6, '#3B3257'); circ(g, 50, -64, 11, '#FFF2C8');
  fillRR(g, L - 20, -150, 18, 40, 4, P.rust);
  text(g, 'SCHOOL BUS', L * .58, -146, { size: 30, col: P.ink, ls: 3 });
  // rim of sunlight on the back edge (sun behind, right)
  fillR(g, L - 6, -Hh + 20, 6, Hh - 60, rgba('#FFE6A6', .9)); fillR(g, 100, -Hh, L - 120, 4, rgba('#FFE6A6', .8));
  // wheels
  for (const wx of [170, L - 160]) {
    circ(g, wx, -26, 60, '#2E2645'); circ(g, wx, -26, 54, '#3B3257'); circ(g, wx, -26, 26, '#C9BFD8');
    for (let k = 0; k < 5; k++) { const a = wheelA + k / 5 * TAU; circ(g, wx + Math.cos(a) * 15, -26 + Math.sin(a) * 15, 4.5, '#6E648F'); }
    circ(g, wx, -26, 6, '#6E648F');
    g.beginPath(); g.arc(wx, -26, 74, Math.PI, TAU); g.lineWidth = 10; g.strokeStyle = bodyD; g.stroke();
  }
  g.restore();
}

// ---------- the bus, inside: wall-flat, windows behind, scenery scrolling ----------
export function busInterior(g, t, { scroll = 0, W0 = -300, W1 = 1380 } = {}) {
  const WY0 = 470, WY1 = 1060;
  // the view outside first
  g.save(); g.beginPath(); g.rect(W0, WY0, W1 - W0, WY1 - WY0); g.clip();
  sunsetSky(g, t, 1040, 700, { W0, W1 });
  g.fillStyle = '#B98AA6'; g.beginPath(); g.moveTo(W0, 1100); for (let x = W0; x <= W1; x += 30) { const u = x - scroll * .05; g.lineTo(x, 990 - Math.sin(u * .006) * 30); } g.lineTo(W1, 1100); g.fill();
  strip(g, scroll * .35, 300, 4, (x, i) => { foliage(g, x, 980, 120 + i * 20, ['#7A5E92', '#8E6FA4'], t, 11 + i); }, W0, W1);
  strip(g, scroll * 1.4, 640, 3, (x, i) => { foliage(g, x, 820, 260 + i * 30, ['#4D3D62', '#5C4874'], t * .2, 21 + i); g.strokeStyle = '#3F3254'; g.lineWidth = 40; g.beginPath(); g.moveTo(x, 1100); g.lineTo(x + 10, 840); g.stroke(); }, W0, W1);
  g.restore();
  // glass sheen
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .18; g.fillStyle = lg(g, W0, WY0, W1, WY1, ['rgba(255,255,255,0)', '#FFFFFF', 'rgba(255,255,255,0)', '#FFFFFF', 'rgba(255,255,255,0)']); g.fillRect(W0, WY0, W1 - W0, WY1 - WY0); g.restore();
  // ceiling, rack, pillars, lower wall
  g.fillStyle = lg(g, 0, -300, 0, WY0, ['#5C4B70', '#8C789A']); g.fillRect(W0, -300, W1 - W0, WY0 + 300);
  fillR(g, W0, 330, W1 - W0, 34, '#4A3B5E'); fillR(g, W0, 360, W1 - W0, 8, '#C7A2A8');
  for (let x = W0 + 60; x < W1; x += 360) { fillR(g, x, WY0 - 10, 52, WY1 - WY0 + 20, '#6E5A7E'); fillR(g, x + 40, WY0 - 10, 8, WY1 - WY0 + 20, rgba('#FFD9A0', .7)); }
  fillR(g, W0, WY0 - 14, W1 - W0, 18, '#6E5A7E'); fillR(g, W0, WY1 - 4, W1 - W0, 22, '#6E5A7E');
  g.fillStyle = lg(g, 0, WY1, 0, 1640, ['#5B7C82', '#46666E']); g.fillRect(W0, WY1 + 18, W1 - W0, 1640 - WY1);
  // floor
  g.fillStyle = lg(g, 0, 1600, 0, 1920, ['#3E3550', '#2E2742']); g.fillRect(W0, 1600, W1 - W0, 400);
  for (let y = 1630; y < 1920; y += 26) line(g, W0, y, W1, y, rgba('#1E1A30', .35), 3);
  // dappled sunlight sliding over the lower wall as trees pass
  const k = .5 + .5 * Math.sin(scroll * .012) * Math.sin(scroll * .0047 + 1);
  sunQuad(g, t, [[W0, WY1 + 40], [W1, WY1 + 40], [W1, 1590], [W0, 1590]], { cols: 4, rows: 1, col: '#FFC98A', a: .12 + .14 * k });
  return { WY0, WY1, k };
}
// one bus seat (side view): backrest behind the passenger (on their right as the bus faces left) + cushion
export function busSeat(g, x, floorY, s = 1, part = 'all') {
  g.save(); g.translate(x, floorY); g.scale(s, s);
  const fab = '#4F8D8B', fabD = '#356A6A';
  if (part !== 'back') { fillRR(g, -250, -150, 260, 46, 14, fab); fillR(g, -250, -112, 260, 8, fabD); fillR(g, -120, -104, 18, 104, '#2E2742'); }
  if (part !== 'cushion') { fillRR(g, 4, -390, 64, 300, 24, fab); fillRR(g, 4, -390, 64, 46, 22, lite(fab, .1)); fillR(g, 54, -370, 10, 270, fabD); fillRR(g, 14, -100, 44, 100, 4, '#2E2742'); }
  g.restore();
}
export function backpack(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  fillRR(g, -46, -120, 92, 120, 22, P.rust); fillRR(g, -34, -60, 68, 52, 12, dark(P.rust, .15)); line(g, -20, -60, 20, -60, P.ink, 3);
  g.beginPath(); g.arc(0, -120, 22, Math.PI, TAU); g.lineWidth = 7; g.strokeStyle = dark(P.rust, .3); g.stroke();
  rr(g, -46, -120, 92, 120, 22); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke(); g.restore();
}

// ---------- bathroom: we are the mirror ----------
export function bathroom(g, t) {
  g.fillStyle = lg(g, 0, -200, 0, 1500, ['#E9DDC4', '#F3E6CA']); g.fillRect(-300, -300, 1680, 2300);
  g.strokeStyle = rgba('#C9B89A', .7); g.lineWidth = 4;
  for (let x = -300; x < 1400; x += 120) { g.beginPath(); g.moveTo(x, 520); g.lineTo(x, 1500); g.stroke(); }
  for (let y = 520; y < 1500; y += 120) { g.beginPath(); g.moveTo(-300, y); g.lineTo(1400, y); g.stroke(); }
  fillR(g, -300, 500, 1680, 26, P.teal); fillR(g, -300, 520, 1680, 6, P.tealDark);
  // door frame (left, in shade) and towel (right)
  fillR(g, -300, 0, 330, 1500, '#3A3358'); fillR(g, 30, 0, 26, 1500, P.woodDark);
  fillR(g, 860, 760, 260, 14, '#B9B0C8'); fillRR(g, 890, 770, 170, 340, 16, P.rose); fillR(g, 890, 1040, 170, 22, dark(P.rose, .18));
  // warm overhead light
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(g, 560, 120, 20, 900, [rgba('#FFE2A8', .75), rgba('#FFC27A', .2), 'rgba(0,0,0,0)']); g.fillRect(-300, -300, 1680, 1800); g.restore();
  ell(g, 560, 70, 150, 34, '#FFF3D0'); fillR(g, 420, 40, 280, 28, '#D9C7A8');
}
export function sinkFront(g, t, { tap = 0 } = {}) {
  // counter + basin edge across the bottom of frame
  g.fillStyle = lg(g, 0, 1560, 0, 1920, ['#FBF5E8', '#E7DCC8']); g.fillRect(-300, 1560, 1680, 400);
  fillR(g, -300, 1556, 1680, 10, '#FFFDF6'); ell(g, 540, 1700, 330, 70, '#D9CDB8'); ell(g, 540, 1690, 300, 56, '#C9BCA6');
  // tap
  fillRR(g, 720, 1480, 44, 92, 10, '#C9C3D6'); fillRR(g, 640, 1470, 124, 30, 12, '#DCD6E6'); fillRR(g, 730, 1446, 26, 24, 6, '#A79BC4');
  if (tap > 0) { g.save(); g.globalAlpha = tap * .8; fillRR(g, 648, 1500, 14, 200, 7, '#CFEAF0'); g.globalAlpha = tap * .5; fillR(g, 652, 1500, 4, 200, '#FFFFFF'); g.restore(); }
  // toothpaste tube
  g.save(); g.translate(300, 1600); g.rotate(-.12); fillRR(g, -80, -22, 150, 44, 14, P.paper); fillR(g, -60, -22, 40, 44, P.teal); fillRR(g, 70, -14, 26, 28, 5, P.rust); g.restore();
}

// ---------- bedroom (side view, night) ----------
export const BED = { x0: 250, x1: 1010, top: 1580, floor: 1690, pillow: [300, 1495, 220, 92] };
export function bedroom(g, t, { lamp = 1, noGlass = false } = {}) {
  // night wall, moonlit window, lamp
  g.fillStyle = lg(g, 0, -200, 0, 1500, ['#1F1B3A', '#2C2752', '#3A3363']); g.fillRect(-300, -300, 1680, 1960);
  const wx = 560, wy = 420, ww = 360, wh = 520;
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  g.fillStyle = lg(g, 0, wy, 0, wy + wh, ['#1B2050', '#2E3570', '#48508C']); g.fillRect(wx, wy, ww, wh);
  const r = rnd(9); for (let i = 0; i < 30; i++) { circ(g, wx + r() * ww, wy + r() * wh * .7, .8 + r() * 2.2, rgba('#FFF6DA', .4 + .5 * Math.abs(Math.sin(t * 1.3 + i)))); }
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(g, wx + 250, wy + 150, 10, 260, [rgba('#E6ECFF', .7), 'rgba(0,0,0,0)']); g.fillRect(wx, wy, ww, wh); g.restore();
  circ(g, wx + 250, wy + 150, 52, '#F4F1DE'); circ(g, wx + 232, wy + 140, 9, rgba('#C9C6B4', .7)); circ(g, wx + 264, wy + 170, 6, rgba('#C9C6B4', .7));
  foliage(g, wx + 40, wy + wh - 40, 200, ['#141838', '#1C2148'], t, 31);
  g.restore();
  g.strokeStyle = '#4A3F6B'; g.lineWidth = 14; g.strokeRect(wx, wy, ww, wh); line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, '#4A3F6B', 10); line(g, wx, wy + wh / 2, wx + ww, wy + wh / 2, '#4A3F6B', 10);
  fillR(g, wx - 30, wy + wh, ww + 60, 22, '#4A3F6B');
  // curtains
  for (const [cx, sd] of [[wx - 20, -1], [wx + ww + 20, 1]]) { g.fillStyle = '#5A4A7E'; g.beginPath(); g.moveTo(cx, wy - 40); g.quadraticCurveTo(cx + sd * 50, wy + 260, cx + sd * 20, wy + wh + 60); g.lineTo(cx + sd * 90, wy + wh + 60); g.quadraticCurveTo(cx + sd * 110, wy + 200, cx + sd * 80, wy - 40); g.closePath(); g.fill(); }
  fillR(g, wx - 140, wy - 50, ww + 280, 14, '#4A3F6B');
  // floor
  g.fillStyle = lg(g, 0, 1560, 0, 1920, ['#3A3060', '#2A2448']); g.fillRect(-300, 1560, 1680, 400);
  for (let k = 0; k < 6; k++) line(g, -300, 1580 + k * k * 12 + k * 20, 1380, 1580 + k * k * 12 + k * 20, rgba('#1E1A30', .4), 3);
  // moonlight falling across the bed and floor
  sunQuad(g, t, [[wx, wy + wh], [wx + ww, wy + wh], [wx + ww + 360, 1900], [wx + 120, 1900]], { cols: 2, rows: 2, col: '#AFC0FF', a: .16, gap: .06 });
  // nightstand + lamp + glass (left of the headboard)
  fillR(g, 40, 1450, 200, 22, '#5C4A6E'); fillR(g, 54, 1472, 172, 220, '#4A3C5E'); fillR(g, 54, 1530, 172, 6, '#3A2F4E'); fillRR(g, 125, 1495, 30, 10, 5, P.gold);
  fillR(g, 120, 1320, 14, 130, '#3A2F4E'); poly(g, [[88, 1240], [166, 1240], [196, 1326], [58, 1326]]); g.fillStyle = mix('#C98A5E', '#FFD9A0', lamp * .6); g.fill();
  if (lamp > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = lamp; g.fillStyle = rg(g, 127, 1330, 10, 560, [rgba('#FFD08A', .7), rgba('#F2A65A', .22), 'rgba(0,0,0,0)']); g.fillRect(-300, 700, 1100, 1300); g.restore(); }
  if (!noGlass) glassAt(g, 200, 1450, .9, .5);
  // bed: headboard, frame, mattress
  fillRR(g, BED.x0 - 30, BED.top - 320, 44, 440, 10, '#5C4A6E'); fillRR(g, BED.x0 - 40, BED.top - 330, 64, 40, 14, '#6E5A82');
  fillR(g, BED.x0, BED.top + 60, BED.x1 - BED.x0, 60, '#4A3C5E'); fillR(g, BED.x1 - 30, BED.top - 30, 34, 150, '#5C4A6E');
  fillRR(g, BED.x0, BED.top - 6, BED.x1 - BED.x0 - 20, 72, 16, '#E9E1F0'); fillR(g, BED.x0 + 6, BED.top + 40, BED.x1 - BED.x0 - 32, 10, rgba('#9C8FBF', .5));
  const [px, py, pw, ph] = BED.pillow; fillRR(g, px, py, pw, ph, 40, '#F2EDE2'); fillRR(g, px + 10, py + ph - 26, pw - 20, 16, 8, rgba('#B6A9CF', .6));
}
// a single water glass (world x,y = base centre), level 0..1
export function glassAt(g, x, y, s = 1, level = .8, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const w0 = 26, w1 = 32, h = 84;
  poly(g, [[-w0, 0], [w0, 0], [w1, -h], [-w1, -h]]); g.fillStyle = rgba('#DDEFF5', .45); g.fill();
  const lh = h * level, wl = lerp(w0, w1, level);
  g.save(); g.rotate(-rot); g.beginPath(); g.rect(-100, -lh * Math.cos(rot) - 2, 200, 200); g.restore();
  g.save(); poly(g, [[-w0, 0], [w0, 0], [w1, -h], [-w1, -h]]); g.clip(); g.rotate(-rot); fillR(g, -120, -lh, 240, lh + 60, rgba('#9FD3E2', .75)); fillR(g, -120, -lh, 240, 5, rgba('#FFFFFF', .7)); g.restore();
  poly(g, [[-w0, 0], [w0, 0], [w1, -h], [-w1, -h]]); g.lineWidth = 4; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.stroke();
  fillR(g, -w1 + 9, -h + 10, 6, h - 22, rgba('#FFFFFF', .6));
  g.restore();
}
// blanket over the bed: covers from edgeX to the foot; bumps follow the body
export function blanket(g, t, edgeX, { night = 1, breathe = 0 } = {}) {
  const top = BED.top - 46, foot = BED.x1 + 6, col = mix('#5F8F94', '#4C6C8C', night * .5), colD = dark(col, .25);
  const y = x => top - 22 * Math.exp(-(((x - (BED.x1 - 120)) / 40) ** 2)) - (10 + breathe * 4) * Math.exp(-(((x - (edgeX + 60)) / 70) ** 2)) - 14 * Math.exp(-(((x - 760) / 90) ** 2));
  g.beginPath(); g.moveTo(edgeX, BED.top + 62); g.lineTo(edgeX, y(edgeX) + 6);
  for (let x = edgeX; x <= foot; x += 12) g.lineTo(x, y(x)); g.quadraticCurveTo(foot + 16, top + 20, foot + 8, BED.top + 90); g.lineTo(edgeX, BED.top + 96); g.closePath();
  g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.stroke();
  g.save(); g.clip(); g.strokeStyle = rgba(colD, .7); g.lineWidth = 3; g.setLineDash([12, 9]);
  for (let x = edgeX + 60; x < foot; x += 90) { g.beginPath(); g.moveTo(x, top - 40); g.lineTo(x - 20, BED.top + 100); g.stroke(); } g.setLineDash([]);
  fillR(g, edgeX, y(edgeX) - 6, 34, 140, rgba(lite(col, .3), .8));
  g.restore();
}

// ---------- overhead: pillow + blanket for the sleeping close-ups ----------
export function pillowBed(g, t, cx, cy, s = 1, { night = 1 } = {}) {
  g.fillStyle = lg(g, 0, -300, 0, 2200, ['#3A3462', '#4A4278']); g.fillRect(-1000, -1000, 3200, 4000);
  g.save(); g.translate(cx, cy); g.scale(s, s);
  fillRR(g, -560, -330, 1120, 640, 160, '#D9D2E6'); fillRR(g, -540, -320, 1080, 600, 150, '#ECE6F0');
  g.strokeStyle = rgba('#B6A9CF', .7); g.lineWidth = 6; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 420, -250); g.quadraticCurveTo(k * 380, 0, k * 430, 230); g.stroke(); }
  g.restore();
}
export function chinBlanket(g, t, y0, { breathe = 0, lift = 0 } = {}) {
  const yy = y0 - breathe * 10 - lift * 30;
  g.beginPath(); g.moveTo(-300, yy + 60); g.quadraticCurveTo(200, yy - 30 - lift * 20, 540, yy - 10); g.quadraticCurveTo(880, yy - 30 - lift * 20, 1380, yy + 60); g.lineTo(1380, 2300); g.lineTo(-300, 2300); g.closePath();
  g.fillStyle = '#557E90'; g.fill(); g.lineWidth = 8; g.strokeStyle = P.ink; g.stroke();
  g.save(); g.clip(); fillR(g, -300, yy - 40, 1680, 70, rgba('#E9E1F0', .95)); line(g, -300, yy + 30, 1380, yy + 30, rgba('#B6A9CF', .8), 6);
  g.strokeStyle = rgba('#3E6072', .8); g.lineWidth = 5; g.setLineDash([18, 12]); for (let x = -200; x < 1400; x += 220) { g.beginPath(); g.moveTo(x, yy + 60); g.lineTo(x + 60, 2000); g.stroke(); } g.setLineDash([]); g.restore();
}

// ---------- the mind-space ----------
export function mindSpace(g, t, { dark: dk = 0 } = {}) {
  g.fillStyle = rg(g, 540, 900, 40, 1300, [mix('#4A3A7E', '#2A2050', dk), mix('#2C2258', '#1A1436', dk), mix('#140F28', '#0A0716', dk)]); g.fillRect(-400, -400, 1880, 2720);
  // slow thought ripples
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) { const u = ((t * .12 + i / 5) % 1), r = 120 + u * 1100; g.globalAlpha = (1 - u) * .16 * (1 - dk * .5); g.beginPath(); g.arc(540, 880, r, 0, TAU); g.lineWidth = 3 + (1 - u) * 6; g.strokeStyle = '#B79BE0'; g.stroke(); }
  g.restore();
  dust(g, t, -100, 0, 1280, 1920, 70, 51, '#D9C6FF', .5 * (1 - dk * .4));
}
