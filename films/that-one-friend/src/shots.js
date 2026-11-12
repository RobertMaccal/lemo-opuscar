// Storyboard frames: sets + posed rigs + camera + light + post. These are the film's key shots at one instant.
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, bloom, vignette, wash, paperGrain } from './kit.js';
import { drawChar, pose } from './rig.js';
import { X, YOU, JACK, PROF, TEACHER, COACH, STU_A, STU_B, STU_C, STU_D, STU_E } from './cast.js';
import * as S from './sets.js';

export const W = 1080, H = 1920;
const cam = (g, c, fn) => { g.save(); g.translate(W / 2, H / 2); g.rotate(c.r || 0); g.scale(c.z || 1, c.z || 1); g.translate(-(c.x ?? W / 2), -(c.y ?? H / 2)); fn(); g.restore(); };
// draw into an offscreen layer, then composite (optionally blurred: depth of field)
function layer(ctx, id, fn, blur = 0, alpha = 1) {
  const g = tmp(id, W, H); fn(g); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha;
  if (blur) { ctx.drawImage(g.canvas, 0, 0); ctx.filter = `blur(${blur}px)`; } ctx.drawImage(g.canvas, 0, 0); ctx.restore();
}
function layerSoft(ctx, id, fn, blur) { const g = tmp(id, W, H); fn(g); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${blur}px)`; ctx.drawImage(g.canvas, 0, 0); ctx.restore(); }
const put = (g, ch, x, y, s, o, L, opt) => drawChar(g, ch, pose(ch, { x, y, s }, o), L, opt);
const sitY = ch => (ch.ul + ch.ll) * .992 + 12 - 95;
const seat = (ch, o = {}) => ({ hipY: sitY(ch), legS: .5, lL: { x: -30 }, lR: { x: 30 }, ...o });
function finish(ctx, { vig = .5, bl = .2, grade = null, grain = .13, vc = [.5, .5], inner = .35 } = {}) {
  bloom(ctx, W, H, bl); if (grade) wash(ctx, W, H, grade[0], grade[1], grade[2] || 'soft-light');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); vignette(ctx, W, H, vig, P.night, vc[0], vc[1], inner); paperGrain(ctx, W, H, grain); ctx.restore();
}
const mkL = (dx, dy, o = {}) => ({ dx, dy, rim: '#FFEBBE', rimA: .95, rimW: 5, shade: P.plum, shadeA: .26, shadeW: 15, ...o });
const L_HALL = mkL(.74, .6, { shadow: { kx: .6, ky: .15, a: .3, blur: 6, col: P.plum } });
const L_RIGHT = mkL(-.76, .6, { shadow: { kx: -.6, ky: .15, a: .3, blur: 6, col: P.plum } });
const L_BACK = mkL(.14, .99, { rim: '#FFF2CC', rimW: 6, shadeA: 0, shadow: null });

// ---- captions: a paper label from the school's own stationery ----
const WHO = { YOU: P.you, JACK: dark(P.jack, .28), PROFESSOR: '#6E648F', TEACHER: '#B4553F', COACH: P.tealDeep, 'STUDENT A': P.burg, 'STUDENT B': '#B8923C' };
export function caption(c, str, y, { who = null, think = false, size = 60, rot = -.014, maxW = 900 } = {}) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const font = `${size}px ${F.title}`; c.font = font;
  const words = str.split(' ').map(w => ({ s: w.replace(/\*/g, ''), hot: w.includes('*') }));
  const sp = c.measureText(' ').width, lines = [[]]; let lw = 0;
  for (const w of words) { const ww = c.measureText(w.s).width; if (lw + ww > maxW - 90 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ ...w, ww }); lw += ww + sp; }
  const lws = lines.map(l => l.reduce((a, w) => a + w.ww, 0) + sp * (l.length - 1)), bw = Math.max(...lws) + 96, lh = size * 1.14, bh = lines.length * lh + 46;
  c.translate(W / 2, y); c.rotate(rot);
  fillRR(c, -bw / 2 + 8, -bh / 2 + 11, bw, bh, 16, rgba(P.night, .4));
  fillRR(c, -bw / 2, -bh / 2, bw, bh, 16, think ? '#E7DFF1' : P.paper);
  c.lineWidth = 5; c.strokeStyle = P.ink; if (think) c.setLineDash([16, 11]); rr(c, -bw / 2, -bh / 2, bw, bh, 16); c.stroke(); c.setLineDash([]);
  if (!think) { fillR(c, -bw / 2 + 22, bh / 2 - 15, bw - 44, 3, rgba(P.lav, .55)); }
  if (who) {
    const tw = (() => { c.font = `26px ${F.title}`; return c.measureText(think ? who + ' · thinking' : who).width + 34; })();
    fillRR(c, -bw / 2 + 26, -bh / 2 - 27, tw, 40, 10, WHO[who] || P.ink); c.lineWidth = 4; rr(c, -bw / 2 + 26, -bh / 2 - 27, tw, 40, 10); c.stroke();
    text(c, think ? who + ' · thinking' : who, -bw / 2 + 26 + tw / 2, -bh / 2 - 6, { size: 26, col: P.cream, ls: 1 });
  }
  lines.forEach((l, i) => { let x = -lws[i] / 2; const yy = -bh / 2 + 26 + lh * (i + .5) - 2; for (const w of l) { text(c, w.s, x, yy, { size, col: w.hot ? '#C2512D' : P.ink, align: 'left' }); x += w.ww + sp; } });
  c.restore();
}

// =============== HALLWAY (establishing, perspective) ===============
export function bHallway(ctx, t) {
  const C = S.corridor(ctx, t, { vy: 1010 });
  const L = mkL(-.76, .6, { shadow: { kx: -1.0, ky: .22, a: .3, blur: 5, col: P.plum } });
  const at = (Xw, Z) => { const p = C.pr(Xw, C.fl, Z); return { x: p[0], y: p[1], s: C.s(Z) }; };
  const far = Z => ({ tint: ['#F7DDAE', clamp((Z - 350) / 1900) * .7] });
  const ch = (c, Xw, Z, o) => { const a = at(Xw, Z); put(ctx, c, a.x, a.y, a.s, o, L, far(Z)); };
  ch(STU_D, 30, 1700, { face: 0, head: { back: 1 }, lL: { x: -18, y: -8 }, aL: { a: .3, b: .2 }, aR: { a: -.3, b: -.2 } });
  ch(STU_C, -60, 1200, { face: .7, lL: { x: -40 }, lR: { x: 44, y: -6 }, aL: { a: .5, b: .3 }, aR: { a: -.5, b: .3 } });
  ch(STU_A, 66, 800, { face: .45, e: { mS: .6, mO: .3 }, aR: { a: .5, b: 1.5, hand: 'open', z: 1 } });
  ch(STU_B, 122, 780, { face: -.45, e: { mS: .5 } });
  ch(YOU, -12, 500, { face: -.4, lean: -.05, hipY: 12, shrug: 1, e: { ...X.cooked, gx: -.5 }, aL: { to: [-72, -452], k: -1, z: 1 }, aR: { to: [54, -456], k: 1, z: 1 }, lL: { x: -26 }, lR: { x: 20 } });
  ch(JACK, -124, 470, { face: .22, lean: -.2, hipX: -30, hipY: 8, lL: { x: 4 }, lR: { x: 48 }, head: { nod: .65, tilt: -.06 }, e: { ...X.chill, gy: .7 }, aL: { to: [-58, -250], k: 1, z: 1 }, aR: { to: [-22, -322], k: -1, z: 1, prop: { n: 'phone', r: -.18, back: 1 } } });
  dust(ctx, t, 200, 500, 700, 900, 46, 5);
  S.titleCard(ctx, 540, 400, .8);
  finish(ctx, { vig: .5, bl: .26 });
}

// =============== 01 BEFORE THE EXAM ===============
export function b01(ctx, t) {
  cam(ctx, { x: 540, y: 1010, z: 1 }, () => {
    S.hallFlat(ctx, t);
    put(ctx, STU_B, 1190, 1400, 1.32, { face: -.4, e: { mS: .5, browH: .2 } }, L_HALL, { tint: ['#EFD8AE', .24] });
    put(ctx, STU_A, 1045, 1400, 1.28, { face: .42, e: { mS: .6, mO: .3 }, aR: { a: .5, b: 1.5, hand: 'open', z: 1 } }, L_HALL, { tint: ['#EFD8AE', .24] });
    put(ctx, JACK, 512, 1400, 1.5, { face: .22, lean: -.2, hipX: -30, hipY: 8, lL: { x: 4 }, lR: { x: 48 }, shrug: -.3, head: { nod: .65, tilt: -.06 }, e: { ...X.chill, gy: .7, gx: .1 },
      aL: { to: [-58, -250], k: 1, z: 1 }, aR: { to: [-22, -322], k: -1, z: 1, prop: { n: 'phone', r: -.18, back: 1 } } }, L_HALL);
    put(ctx, YOU, 790, 1400, 1.5, { face: -.3, lean: -.05, hipY: 14, shrug: 1, head: { tilt: .06 }, e: { ...X.cooked, gx: -.55 }, aL: { to: [-74, -452], k: -1, z: 1 }, aR: { to: [54, -456], k: 1, z: 1 }, lL: { x: -26 }, lR: { x: 20 } }, L_HALL);
    dust(ctx, t, 0, 200, 900, 1200, 40, 2);
  });
  finish(ctx, { vig: .46 });
  caption(ctx, "Bro... I'm actually *cooked.*", 1500, { who: 'YOU' });
}

// =============== EXAM ROOM (shared staging) ===============
const ROWS = [{ y: 1040, s: .42 }, { y: 1160, s: .54 }, { y: 1335, s: .70 }, { y: 1600, s: .92 }];
const colX = (s, c) => 540 + c * 375 * s;
const writing = (ch, k = 0) => seat(ch, { head: { nod: 1, tilt: (k % 3 - 1) * .05, oy: 8 }, e: { gy: .9, lidT: .5, mS: 0, mW: .55 }, aL: { to: [-58, -168], k: 1 }, aR: { to: [34 + (k % 2) * 16, -170], k: -1, prop: { n: 'pencil', r: -.5, dy: -18 } } });
function examScene(g, t, { rows = [0, 1, 2, 3], you = null, jack = null, prof = null, noYou = false, jackDesk = {}, bg = true, light = true } = {}) {
  if (bg) {
    S.room(g, t, { mode: 'exam' });
    S.sunQuad(g, t, [[90, 960], [430, 960], [330, 1960], [-360, 1960]], { cols: 3, rows: 3, col: '#FFE0A0', a: .4, gap: .05 });
    S.sunQuad(g, t, [[650, 960], [990, 960], [1440, 1960], [750, 1960]], { cols: 3, rows: 3, col: '#FFE0A0', a: .4, gap: .05 });
    if (prof !== false) put(g, PROF, 742, 1012, .43, prof || { face: -.35, aL: { a: .25, b: -.5, z: -1 }, aR: { a: -.2, b: .5, z: -1 }, e: X.tired }, L_BACK, { tint: [P.plum, .16] });
  }
  const who = [[null, null, null], [STU_E, STU_B, null], [STU_A, null, JACK], [STU_C, YOU, STU_D]];
  for (const r of rows) {
    const { y, s } = ROWS[r];
    for (let c = -1; c <= 1; c++) {
      const x = colX(s, c), chr = who[r][c + 1], isYou = chr === YOU, isJack = chr === JACK;
      if (isYou && noYou) continue;
      if (!(r === 2 && c === 0)) ell(g, x + 6 * s, y + 6 * s, 200 * s, 24 * s, rgba(P.plum, .2));
      const o = chr ? (isYou ? you : isJack ? jack : null) || writing(chr, r * 3 + c) : null;
      const opt = { noShadow: true, tint: [P.plum, .04 + (3 - r) * .05] };
      if (chr) put(g, chr, x, y, s, o, L_BACK, { ...opt, only: [0, 1, 2] });
      if (r === 2 && c === 0) continue;   // the aisle the professor walks
      S.desk(g, x, y, s, { paper: chr ? 1 : 0, filled: isJack ? 1 : (chr && !isYou ? .5 : 0), dim: (3 - r) * .04, ...(isJack ? jackDesk : {}) });
      if (chr) put(g, chr, x, y, s, o, L_BACK, { ...opt, only: [3] });
    }
  }
  if (light) { shaft(g, [[90, 180], [430, 180], [330, 1700], [-300, 1700]], '#FFE6B0', .1, 34); shaft(g, [[650, 180], [990, 180], [1400, 1700], [760, 1700]], '#FFE6B0', .1, 34); }
}
const youStuck = seat(YOU, { head: { nod: .55, tilt: -.04 }, shrug: .8, e: { ...X.worried, gy: .7, sweat: .8, mWavy: .9 }, aL: { to: [-62, -168], k: 1 }, aR: { to: [58, -196], k: -1, prop: { n: 'pencil', r: -.3, dy: -20 } } });

export function bExam(ctx, t) {
  examScene(ctx, t, { you: youStuck });
  dust(ctx, t, 60, 250, 960, 1300, 60, 9);
  finish(ctx, { vig: .55, bl: .28, grade: ['#8C86B0', .1, 'multiply'] });
}

// =============== 02 "COULD I HAVE ANOTHER ANSWER BOOKLET?" ===============
const jackAsk = seat(JACK, { face: -.12, shrug: .5, head: { tilt: .05, turn: -.25 }, e: { ...X.jackTalk, gx: -.5, gy: -.1 }, aL: { to: [-50, -168], k: 1, prop: { n: 'pencil', r: .5, dy: -16 } }, aR: { a: Math.PI - .2, b: .06, l: 1.5, hand: 'open', z: 1 } });
const youBack = seat(YOU, { head: { back: 1, tilt: .1 }, shrug: 1, aL: { to: [-62, -168], k: 1 }, aR: { to: [60, -168], k: -1 } });
const profBring = { face: .5, head: { turn: .1, nod: .2 }, e: { ...X.tired, browH: .7, browAsym: .5, gx: .5, mO: .2 }, aL: { to: [112, -322], k: 1, z: 1, prop: { n: 'paper', r: .25 } }, aR: { a: .15, b: -.2 }, lL: { x: -40 }, lR: { x: 34, y: -6 } };
export function b02(ctx, t) {
  const c = { x: 726, y: 1140, z: 2.3 };
  cam(ctx, c, () => {
    examScene(ctx, t, { rows: [0, 1], prof: false });
    put(ctx, PROF, 598, 1342, .72, profBring, L_BACK, { tint: [P.plum, .1], noShadow: true });
    examScene(ctx, t, { rows: [2], bg: false, jack: jackAsk, jackDesk: { filled: 1, depth: 72, stack: true }, light: true });
  });
  dust(ctx, t, 100, 300, 900, 900, 40, 4);
  // foreground: YOU, turned round in his seat, out of focus
  layerSoft(ctx, 'fg', g => { const gy = 1240 + 329 * 2.1; put(g, YOU, 150, gy, 2.1, youBack, L_BACK, { noShadow: true, tint: [P.plum, .22], only: [0, 1, 2] }); S.desk(g, 170, gy, 2.1, { paper: 1 }); put(g, YOU, 150, gy, 2.1, youBack, L_BACK, { noShadow: true, tint: [P.plum, .22], only: [3] }); }, 11);
  finish(ctx, { vig: .58, bl: .26 });
  caption(ctx, 'Could I have another *answer booklet,* please?', 1480, { who: 'JACK', size: 56 });
}

// =============== 02b "ANOTHER... WHAT?" ===============
export function b02b(ctx, t) {
  layer(ctx, 'bg', g => cam(g, { x: 700, y: 1235, z: 2.0, r: -.03 }, () => examScene(g, t, { rows: [0, 1, 2], noYou: true, jack: jackAsk, jackDesk: { filled: 1 }, prof: false })), 10);
  wash(ctx, W, H, '#6E648F', .34, 'multiply');
  ctx.save(); ctx.translate(540, 960); ctx.rotate(-.045); ctx.translate(-540, -960);
  const s = 3.9, gx = 470, gy = 860 + 329 * s;
  const o = seat(YOU, { face: .26, head: { turn: .3, tilt: -.06 }, shrug: 1, sq: -.12, e: { ...X.horror, gx: .8, gy: -.05 }, aL: { to: [-78, -172], k: 1 }, aR: { to: [104, -256], k: -1, hand: 'open' } });
  const Ld = mkL(.2, .98, { rim: '#FFF2CC', rimW: 3.2, shadeA: 0, shadow: null });
  put(ctx, YOU, gx, gy, s, o, Ld, { noShadow: true, only: [0, 1, 2], tint: [P.plum, .1] });
  S.desk(ctx, gx + 40, gy, s, { paper: 1, filled: 0 });
  put(ctx, YOU, gx, gy, s, o, Ld, { noShadow: true, only: [3], tint: [P.plum, .1] });
  // the pencil, mid-fall
  ctx.save(); ctx.translate(948, 1352); ctx.rotate(.9);
  ctx.strokeStyle = rgba(P.cream, .75); ctx.lineWidth = 6; ctx.lineCap = 'round'; for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(k * 40, -150, 120, .9, 1.5); ctx.stroke(); }
  line(ctx, 0, -84, 0, 70, P.orange, 22, 'butt'); line(ctx, 0, -104, 0, -84, P.rose, 22, 'butt'); line(ctx, 0, -86, 0, -78, P.sand, 22, 'butt');
  poly(ctx, [[-11, 70], [11, 70], [0, 104]]); ctx.fillStyle = P.sand; ctx.fill(); poly(ctx, [[-4, 92], [4, 92], [0, 104]]); ctx.fillStyle = P.ink; ctx.fill(); ctx.restore();
  ctx.restore();
  finish(ctx, { vig: .8, bl: .2, inner: .28, vc: [.45, .46] });
  caption(ctx, 'Another... *WHAT?*', 1500, { who: 'YOU', size: 76 });
}

// =============== 03 POST-EXAM: "...I WROTE A MUSCLE." ===============
export function b03(ctx, t) {
  let C;
  layer(ctx, 'bg', g => { C = S.corridor(g, t, { vy: 1010, f: 560, Wc: 190, Hc: 580, eye: 150, zn: 55, zf: 5200, stretch: 1.7, mood: 1, haze: '#E6D3DA' }); }, 2.5);
  wash(ctx, W, H, '#7A6FA8', .3, 'multiply');
  const at = (Xw, Z) => { const p = C.pr(Xw, C.fl, Z); return { x: p[0], y: p[1], s: C.s(Z) }; };
  // a pool of light for the smallest person in the building
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rg(ctx, 540, 1130, 10, 330, [rgba('#FFF0C8', .5), 'rgba(0,0,0,0)']); ctx.fillRect(0, 700, W, 800); ctx.restore();
  const a = at(0, 430);
  put(ctx, YOU, a.x, a.y, a.s, { e: X.hollow, shrug: 1, aL: { a: -.05, b: .05 }, aR: { a: .05, b: -.05 }, lL: { x: -14 }, lR: { x: 14 } }, mkL(-.5, .86, { rimW: 6, shadow: { kx: -.5, ky: .5, a: .4, blur: 4, col: P.plum } }));
  // the others: close, huge, out of focus, already somewhere else
  layerSoft(ctx, 'fg', g => {
    const L = mkL(-.76, .6, { shadow: null }), tn = { tint: ['#3A3460', .3], noShadow: true };
    let q = at(165, 262); put(g, STU_B, q.x, q.y, q.s, { face: -.45, e: { mS: .5, mO: .3 } }, L, tn);
    q = at(120, 168); put(g, STU_A, q.x, q.y, q.s, { face: -.5, e: { mS: .6, mO: .4 }, aL: { a: -.6, b: -1.4, hand: 'open', z: 1 } }, L, tn);
    q = at(-120, 176); put(g, JACK, q.x, q.y, q.s, { face: .5, e: { ...X.jackTalk, mO: .5 }, aR: { a: .5, b: 1.3, hand: 'open', z: 1 } }, L, tn);
  }, 10);
  finish(ctx, { vig: .88, bl: .16, inner: .2, vc: [.5, .58] });
  caption(ctx, '...I wrote a *muscle.*', 1560, { who: 'YOU', think: true, size: 64 });
}

// =============== 04 THE CLASSROOM GENIUS ===============
export function b04(ctx, t) {
  cam(ctx, { x: 500, y: 1010, z: 1.25 }, () => {
    S.room(ctx, t, { mode: 'class', hh: 2, mm: 40 });
    S.sunQuad(ctx, t, [[700, 960], [1040, 960], [820, 1960], [200, 1960]], { cols: 2, rows: 3, col: '#FFD08A', a: .42 });
    S.sunQuad(ctx, t, [[60, 330], [400, 270], [400, 760], [60, 820]], { cols: 2, rows: 3, col: '#FFD08A', a: .3, leaves: 9, seed: 6 });
    const Lb = { ...L_RIGHT, shadow: null }, dimO = { noShadow: true, tint: ['#F3D9AA', .26] };
    const row = (y, s, list) => list.forEach(([chr, c, k]) => { const x = 540 + c * 380 * s, o = writing(chr, k); o.head = { nod: .1, tilt: (k % 3 - 1) * .05 }; o.e = { mS: .2 };
      put(ctx, chr, x, y, s, o, Lb, { ...dimO, only: [0, 1, 2] }); S.desk(ctx, x, y, s, { paper: 1, filled: .5, dim: .1 }); put(ctx, chr, x, y, s, o, Lb, { ...dimO, only: [3] }); });
    row(1112, .56, [[STU_E, -1, 0], [STU_B, 0, 1], [STU_A, 1, 2]]);
    // the teacher has walked up the aisle
    put(ctx, TEACHER, 196, 1452, 1.04, { face: .45, head: { nod: .4, turn: .12, tilt: .05 }, e: { ...X.dry, gx: .55, gy: .5, browAsym: .9 }, aL: { to: [-52, -262], k: 1, z: 1 }, aR: { to: [96, -330], k: -1, z: 1, hand: 'point', prop: { n: 'pointer', r: 1.95, len: 120 } } }, L_RIGHT);
    // the shared desk
    const y = 1486, jo = seat(JACK, { head: { nod: .9, tilt: .04 }, shrug: -.2, e: { ...X.chill, gy: .85, lidT: .52 }, aL: { to: [-36, -204], k: 1 }, aR: { to: [36, -204], k: -1, prop: { n: 'phone', r: Math.PI / 2, back: 1, up: .5, glow: .55, dx: -36, dy: -4 } } });
    const yo = seat(YOU, { face: -.3, head: { turn: -.3, tilt: -.07 }, shrug: .2, e: { ...X.smug, gx: -.75, gy: .25 }, aL: { to: [-52, -168], k: 1 }, aR: { to: [56, -170], k: -1, prop: { n: 'pencil', r: -.5, dy: -18 } } });
    ell(ctx, 650, y + 8, 340, 30, rgba(P.plum, .22));
    put(ctx, JACK, 510, y, 1, jo, L_RIGHT, { noShadow: true, only: [0, 1, 2] }); put(ctx, YOU, 800, y, 1, yo, L_RIGHT, { noShadow: true, only: [0, 1, 2] });
    S.desk(ctx, 655, y, 1, { wide: 1.72 });
    // YOU's notebook
    poly(ctx, [[742, y - 152], [866, y - 152], [858, y - 183], [750, y - 183]]); ctx.fillStyle = P.paper; ctx.fill(); for (let k = 0; k < 4; k++) line(ctx, 760, y - 177 + k * 7, 846 - k * 8, y - 177 + k * 7, rgba(P.lavDeep, .6), 2);
    put(ctx, JACK, 510, y, 1, jo, L_RIGHT, { noShadow: true, only: [3] }); put(ctx, YOU, 800, y, 1, yo, L_RIGHT, { noShadow: true, only: [3] });
    shaft(ctx, [[700, 200], [1040, 200], [900, 1700], [240, 1700]], '#FFD89A', .12, 30);
    dust(ctx, t, 250, 300, 800, 1200, 44, 12);
  });
  finish(ctx, { vig: .5, bl: .24 });
  caption(ctx, "Which bone doesn't *articulate* with another bone?", 1560, { who: 'TEACHER', size: 52 });
}

// =============== 05 RUNNING ===============
const J1 = { ...JACK, bib: '1' }, Y7 = { ...YOU, bib: '7' };
export function b05(ctx, t) {
  cam(ctx, { x: 540, y: 1000, z: 1 }, () => {
    S.track(ctx, t);
    const L = mkL(-.62, .78, { shadow: { kx: -.55, ky: .16, a: .3, blur: 5, col: '#7A3F4A' } });
    // Jack, already done, under the sunshade
    fillR(ctx, 96, 990, 8, 200, P.paper); fillR(ctx, 330, 990, 8, 200, P.paper); poly(ctx, [[70, 996], [366, 996], [340, 950], [96, 950]]); ctx.fillStyle = P.paper; ctx.fill(); for (let k = 0; k < 4; k++) { poly(ctx, [[70 + k * 74, 996], [107 + k * 74, 996], [118 + k * 61, 950], [96 + k * 61, 950]]); ctx.fillStyle = P.orange; ctx.fill(); }
    fillR(ctx, 130, 1140, 210, 12, P.wood); fillR(ctx, 146, 1152, 10, 44, P.woodDark); fillR(ctx, 314, 1152, 10, 44, P.woodDark);
    put(ctx, J1, 232, 1196, .5, seat(JACK, { face: .5, lean: -.08, head: { tilt: -.2 }, e: { ...X.chill, eyeOpen: .05, closeCurve: -1 }, lL: { x: 30 }, lR: { x: 70 }, aL: { to: [58, -356], k: 1, z: 1, prop: { n: 'bottle', r: -1.0 } }, aR: { a: .2, b: .2 } }), L, { noShadow: true });
    // speed lines + dust behind the runner
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 11; i++) { const yy = 1040 + i * 44 + (i % 3) * 9, x1 = 250 - (i % 4) * 40, len = 190 + (i * 53) % 160; ctx.strokeStyle = rgba('#FFF6E0', .55 - (i % 3) * .12); ctx.lineWidth = 5 + (i % 3) * 3; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x1 - len, yy); ctx.stroke(); }
    for (const [dx, dy, r] of [[250, 1538, 34], [196, 1520, 24], [150, 1546, 18], [300, 1556, 16]]) ell(ctx, dx, dy, r * 1.3, r, rgba('#F7DDBE', .7));
    ctx.restore();
    put(ctx, Y7, 452, 1528, 1.3, { face: .85, lean: .3, hipY: 6, head: { tilt: .12, turn: -.1 }, sq: -.05, e: { ...X.determined, gx: .4 }, lL: { x: 96, y: -92, r: -.3 }, lR: { x: -128, y: -58, r: 1.0 },
      aL: { a: -.95, b: 1.5, z: 1 }, aR: { a: 1.15, b: 1.35, z: 1 } }, L, { groundDy: 32 });
    put(ctx, COACH, 938, 1648, 1.22, { face: -.5, head: { nod: .5, turn: -.1 }, e: { ...X.flat, gy: .7, gx: -.2 }, aR: { to: [-26, -352], k: -1, z: 1, prop: { n: 'stopwatch' } }, aL: { to: [50, -262], k: 1, z: -1 } }, L);
  });
  finish(ctx, { vig: .42, bl: .22 });
  caption(ctx, 'Second place. *After Jack.*', 1500, { who: 'COACH' });
}

// =============== 06 SWIMMING ===============
const Y_SWIM = { ...YOU, kind: 'stick', hood: false, sleeve: 'none', goggles: P.you };
export function b06(ctx, t) {
  cam(ctx, { x: 540, y: 1010, z: 1 }, () => {
    const { NEAR } = S.pool(ctx, t);
    const L = mkL(-.6, .8, { shadow: { kx: -.5, ky: .16, a: .26, blur: 5, col: '#6A6A8A' } });
    // Jack on the bench, bone dry, phone in hand
    fillR(ctx, 60, 1632, 330, 18, P.wood); fillR(ctx, 60, 1632, 330, 6, P.woodLight); fillR(ctx, 84, 1650, 14, 84, P.woodDark); fillR(ctx, 352, 1650, 14, 84, P.woodDark);
    poly(ctx, [[280, 1632], [372, 1632], [372, 1700], [280, 1690]]); ctx.fillStyle = P.paper; ctx.fill(); for (let k = 0; k < 3; k++) fillR(ctx, 290 + k * 28, 1634, 12, 58, P.orange);
    put(ctx, JACK, 196, 1730, .95, seat(JACK, { face: .45, lean: -.1, legS: 1, head: { tilt: -.06, turn: -.12 }, e: { ...X.friendly, gx: .45 }, lL: { x: 92 }, lR: { x: 128 },
      aR: { to: [150, -436], k: 1, z: 1, l: 1.2, hand: 'open' }, aL: { to: [40, -232], k: 1, z: 1, prop: { n: 'phone', r: .5, back: 1 } } }), L, { noShadow: true });
    // YOU at the wall
    const yo = { face: 0, hipY: 138, head: { tilt: .07, nod: .2 }, shrug: 1, e: { eyeOpen: .05, closeCurve: -1, browA: .9, browH: .3, mO: .34, mW: .5, mS: -.5, sweat: .9 }, aL: { to: [-60, -140] }, aR: { to: [56, -138] } };
    S.splash(ctx, 540, NEAR - 22, 1.5, t, 11);
    put(ctx, Y_SWIM, 540, NEAR + 196, 1.32, yo, L, { noShadow: true, only: [0, 1, 2] });
    // the coping hides everything below the water line; arms lie on top of it
    fillR(ctx, 330, NEAR - 6, 420, 60, '#F3E7CB'); for (let x = 320; x < 760; x += 60) fillR(ctx, x, NEAR - 6, 3, 60, rgba(P.tealDeep, .3)); fillR(ctx, 330, NEAR + 16, 420, 12, P.teal); fillR(ctx, 330, NEAR - 10, 420, 8, '#FFF8E6'); fillR(ctx, 330, NEAR + 54, 420, 260, '#E5D0A8');
    ell(ctx, 540, NEAR + 90, 190, 26, rgba('#8CC9CF', .4)); text(ctx, '4', 540, NEAR + 23, { size: 24, col: P.tealDeep });
    put(ctx, Y_SWIM, 540, NEAR + 196, 1.32, yo, L, { noShadow: true, only: [3] });
    for (const [dx, dy] of [[-150, -70], [170, -96], [-40, -260], [210, -200]]) { ctx.beginPath(); ctx.ellipse(540 + dx, NEAR + dy, 7, 11, 0, 0, TAU); ctx.fillStyle = '#F2FFFB'; ctx.fill(); }
    put(ctx, COACH, 905, 1730, 1.2, { face: -.5, head: { nod: .55, turn: -.15 }, e: { ...X.flat, gx: -.4, gy: .6 }, aR: { to: [-30, -330], k: -1, z: 1, prop: { n: 'clipboard', r: -.2 } }, aL: { a: .1, b: .1, z: -1 } }, L);
  });
  finish(ctx, { vig: .4, bl: .24 });
  caption(ctx, '...*Jack?*', 1520, { who: 'YOU', size: 70 });
}

// =============== 07 THE SCOREBOARD GAG ===============
export function b07(ctx, t) {
  cam(ctx, { x: 540, y: 960, z: 1 }, () => {
    S.clubWall(ctx, t);
    const rows = [['1ST', 'JACK', dark(P.jack, .35)], ['2ND', 'YOU', P.you]];
    S.resultBoard(ctx, 540, 120, 660, 'CHESS CLUB', rows);
    S.resultBoard(ctx, 172, 640, 320, 'PIANO', rows, { rot: -.09, sub: 'MUSIC COMPETITION' });
    S.resultBoard(ctx, 912, 664, 320, '100 M', rows, { rot: .07, sub: 'SPORTS DAY' });
    const L = mkL(.72, .62, { shadow: { kx: .6, ky: .15, a: .3, blur: 6, col: P.plum } });
    // winner's table
    put(ctx, JACK, 810, 1500, .98, { face: -.25, head: { tilt: .08, turn: -.1 }, e: { ...X.friendly, gx: -.5 }, aL: { to: [-112, -360], k: -1, z: 1, hand: 'thumb' }, aR: { to: [34, -300], k: -1, z: 1, prop: { n: 'phone', r: .2, back: 1 } } }, L);
    fillR(ctx, 600, 1330, 480, 30, P.wood); fillR(ctx, 600, 1330, 480, 9, P.woodLight); fillR(ctx, 630, 1360, 20, 140, P.woodDark); fillR(ctx, 1040, 1360, 20, 140, P.woodDark);
    poly(ctx, [[660, 1330], [860, 1330], [840, 1296], [680, 1296]]); ctx.fillStyle = P.paper; ctx.fill(); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) { const x0 = lerp(680, 840, i / 4), x1 = lerp(680, 840, (i + 1) / 4); poly(ctx, [[lerp(x0, lerp(660, 860, i / 4), j / 2), 1296 + 17 * j], [lerp(x1, lerp(660, 860, (i + 1) / 4), j / 2), 1296 + 17 * j], [lerp(x1, lerp(660, 860, (i + 1) / 4), (j + 1) / 2), 1296 + 17 * (j + 1)], [lerp(x0, lerp(660, 860, i / 4), (j + 1) / 2), 1296 + 17 * (j + 1)]]); ctx.fillStyle = P.tealDeep; ctx.fill(); }
    // trophy
    ctx.save(); ctx.translate(965, 1330); fillR(ctx, -26, -18, 52, 18, P.woodDark); fillR(ctx, -7, -52, 14, 36, P.gold); poly(ctx, [[-38, -128], [38, -128], [24, -62], [-24, -62]]); ctx.fillStyle = P.gold; ctx.fill(); ctx.strokeStyle = P.amber; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(-40, -102, 18, 1.2, 4.9); ctx.stroke(); ctx.beginPath(); ctx.arc(40, -102, 18, -1.75, 1.95); ctx.stroke(); text(ctx, '1', 0, -94, { size: 38, col: P.rust }); ctx.restore();
    // YOU, foreground, looking straight at us
    put(ctx, YOU, 300, 1930, 1.62, { face: .12, head: { tilt: -.05 }, shrug: .2, e: { ...X.deadpan, gx: 0, gy: 0 }, aL: { a: -.1, b: .1 }, aR: { to: [84, -292], k: -1, z: 1, prop: { n: 'piece' } } }, L, { noShadow: true });
  });
  finish(ctx, { vig: .5, bl: .22 });
}

// =============== 08 FINAL: SUNSET ===============
export function b08(ctx, t) {
  cam(ctx, { x: 540, y: 960, z: 1 }, () => {
    S.courtyard(ctx, t, { sunX: 452 });
    const L = mkL(-.3, .95, { rim: '#FFEDB8', rimW: 9, rimA: 1, shadeA: 0, shadow: { kx: -.16, ky: 1.5, a: .42, blur: 5, col: '#5A3A6E' } });
    const far = (x, y, s, chr, o) => put(ctx, chr, x, y, s, o, mkL(-.3, .95, { rim: '#FFE2A0', rimW: 9, shadeA: 0, shadow: { kx: -.1, ky: 1.3, a: .3, blur: 4, col: '#5A3A6E' } }), { tint: ['#4A3568', .78] });
    far(756, 1150, .2, STU_A, { face: .8, lL: { x: -30 }, lR: { x: 34 } }); far(792, 1150, .2, STU_B, { face: .8, lL: { x: 30 }, lR: { x: -28 } }); far(900, 1184, .26, STU_C, { face: -.8, lL: { x: -30 }, lR: { x: 34 } });
    const tn = { tint: ['#4A3058', .2] };
    put(ctx, YOU, 296, 1456, .86, { face: .62, lean: .05, head: { turn: .1, tilt: -.08 }, shrug: .8, e: { ...X.how, eyeOpen: 1.2, mO: .7, gx: .6 }, lL: { x: 44, y: 0, r: -.2 }, lR: { x: -46, y: -6, r: .5 }, aL: { a: .35, b: 1.25, hand: 'open', z: 1 }, aR: { a: 1.0, b: 1.15, hand: 'open', z: 1 } }, L, tn);
    put(ctx, JACK, 570, 1456, .86, { face: .7, lean: .02, head: { turn: -.95, tilt: .06 }, shrug: 1, e: { ...X.jackConfused, gx: -.5, mO: .35 }, lL: { x: 50, r: -.2 }, lR: { x: -44, y: -6, r: .5 }, aL: { to: [58, -300], k: 1, z: 1, prop: { n: 'phone', r: .3, back: 1 } }, aR: { a: -.42, b: -.75, hand: 'open', z: 1 } }, L, tn);
    S.courtyardFg(ctx, t);
    dust(ctx, t, 100, 700, 900, 900, 50, 21, '#FFDFA0', .8);
  });
  finish(ctx, { vig: .5, bl: .34 });
  caption(ctx, "I'm just *chill.*", 1600, { who: 'JACK', size: 66 });
}
