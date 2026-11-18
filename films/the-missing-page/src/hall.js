// The examination hall of the assessment centre, built in world space (see space.js) so every camera agrees.
// Room: X −1200…1200 (windows on +X), Z 0 (front wall: screen, clock, door, examiner's desk) … 3600 (back wall), ceiling 1300.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust } from './kit.js';
import { clock } from './sets.js';
import { pose } from './rig.js';

export const HALL = { x0: -1200, x1: 1200, z1: 3600, h: 1300 };
export const COLS = [-640, 0, 640], ROWS = [1200, 1900, 2600];
export const SEAT_DZ = 165;                     // candidate sits this far behind his desk centre
export const DOOR = { x0: -1010, x1: -770, h: 640 };
export const EDESK = { x0: -660, x1: -250, z0: 200, z1: 340, top: 300, px0: -760, px1: -150, pz0: 60, pz1: 620, ph: 34 };
const WALL = '#F3E3C4', WALL2 = '#EAD5B0', WOOD = '#A9734C', WOODL = '#C99566', STONE = '#E4D3B8', STONE2 = '#D2BE9E';
export const SKY = ['#9FC4D6', '#F2E6C6', '#FFD79A'];

// the sun: world direction the light travels. k = 0 (9:00, low, long patches) … 1 (11:00, higher, shorter)
export const sunDir = k => ({ lx: -1, ly: lerp(.5, .78, k), lz: lerp(.32, -.05, k) });
const PANES = []; for (let z = 300; z < 3300; z += 300) PANES.push([z + 18, z + 282]);
const floorOf = (Y, Z, s) => [HALL.x1 - Y / s.ly, Z + Y * s.lz / s.ly];

// everything fixed: walls, windows, floor, ceiling, wall furniture. o: { sun, hh, mm, ss, door, mood, screen }
export function hallArch(g, V, t, o = {}) {
  const { sun = 0, hh = 8, mm = 59, ss = null, door = 0, mood = 0 } = o, S = sunDir(sun), { x0, x1, z1, h } = HALL;
  const fog = (c, X, Z) => V.fog(c, V.depth(X, Z));
  // ceiling + light panels
  V.poly(g, [[x0, h, 0], [x1, h, 0], [x1, h, z1], [x0, h, z1]], '#EFE2C9');
  for (const X of [-600, 0, 600]) for (let Z = 300; Z < z1; Z += 620) V.poly(g, [[X - 170, h - 2, Z], [X + 170, h - 2, Z], [X + 170, h - 2, Z + 110], [X - 170, h - 2, Z + 110]], '#FFF6DE');
  // back wall (Z = z1): wood panelling, prints
  V.poly(g, [[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]], WALL2);
  V.poly(g, [[x0, 0, z1], [x1, 0, z1], [x1, 420, z1], [x0, 420, z1]], WOOD);
  for (let X = -1100; X < 1100; X += 200) V.line(g, [X, 0, z1], [X, 420, z1], dark(WOOD, .2), Math.max(1, 3 * V.s(X, z1)));
  for (const [X, c] of [[-760, '#6E8FA0'], [-260, '#C7865A'], [260, '#8B9A6A'], [760, '#9B7AA0']]) { V.poly(g, [[X - 150, 560, z1], [X + 150, 560, z1], [X + 150, 900, z1], [X - 150, 900, z1]], '#2E2A3A'); V.poly(g, [[X - 130, 580, z1], [X + 130, 580, z1], [X + 130, 880, z1], [X - 130, 880, z1]], c); V.poly(g, [[X - 70, 620, z1], [X + 70, 620, z1], [X + 20, 840, z1]], lite(c, .3)); }
  // front wall (Z = 0): screen, clock, door
  V.poly(g, [[x0, 0, 0], [x1, 0, 0], [x1, h, 0], [x0, h, 0]], WALL);
  V.poly(g, [[x0, 0, 0], [x1, 0, 0], [x1, 90, 0], [x0, 90, 0]], WOOD);
  for (let X = -1150; X < 1200; X += 230) V.line(g, [X, 90, 0], [X, h, 0], rgba(P.woodDark, .12), Math.max(1, 3 * V.s(X, 0)));
  { // the big screen
    const a = V.p(-430, 1150, 0), b = V.p(430, 760, 0);
    if (Math.abs(Math.cos(V.yaw)) < .95) { V.poly(g, [[-450, 740, -1], [450, 740, -1], [450, 1170, -1], [-450, 1170, -1]], '#1E1B2E'); V.poly(g, [[-430, 760, -2], [430, 760, -2], [430, 1150, -2], [-430, 1150, -2]], '#2E2A5A'); }
    else if (V.depth(0, 0) > 50) {
      const x = Math.min(a[0], b[0]), y = a[1], w = Math.abs(b[0] - a[0]), hh2 = b[1] - a[1];
      fillRR(g, x - w * .02, y - w * .02, w * 1.04, hh2 + w * .04, w * .02, '#1E1B2E');
      g.fillStyle = lg(g, 0, y, 0, y + hh2, ['#2B2752', '#3A3468']); g.fillRect(x, y, w, hh2);
      text(g, 'EXECUTIVE', x + w / 2, y + hh2 * .27, { size: hh2 * .17, font: F.ui, weight: '600', col: P.gold, ls: hh2 * .02 });
      text(g, 'QUALIFICATION', x + w / 2, y + hh2 * .5, { size: hh2 * .17, font: F.ui, weight: '600', col: P.gold, ls: hh2 * .02 });
      text(g, 'ASSESSMENT', x + w / 2, y + hh2 * .73, { size: hh2 * .17, font: F.ui, weight: '600', col: P.gold, ls: hh2 * .02 });
      fillR(g, x + w * .3, y + hh2 * .87, w * .4, Math.max(1, hh2 * .012), rgba(P.gold, .6));
    }
  }
  if (V.depth(620, 0) > 50) { const c = V.p(640, 960, 0), r = 92 * V.s(640, 0), sq = Math.abs(Math.cos(V.yaw)); g.save(); g.translate(c[0], c[1]); g.scale(Math.max(.05, sq), 1); clock(g, 0, 0, r, hh, mm, ss); g.restore(); }
  { // door: frame, opening, leaf swinging into the room (hinge at x0)
    const { x0: d0, x1: d1, h: dh } = DOOR;
    V.poly(g, [[d0 - 26, 0, -1], [d1 + 26, 0, -1], [d1 + 26, dh + 26, -1], [d0 - 26, dh + 26, -1]], dark(WOOD, .25));
    V.poly(g, [[d0, 0, -2], [d1, 0, -2], [d1, dh, -2], [d0, dh, -2]], door > .02 ? '#FFF1D0' : WOODL);
    if (door > .02) { // light spilling in through the open door
      V.poly(g, [[d0, 1, 0], [d1, 1, 0], [d1 + 160 * door, 1, 520 * door], [d0 + 60 * door, 1, 520 * door]], rgba('#FFE9B8', .35 * door));
    }
    const a = door * 1.75, ex = d0 + Math.cos(a) * (d1 - d0), ez = Math.sin(a) * (d1 - d0);
    V.poly(g, [[d0, 0, 0], [ex, 0, ez], [ex, dh, ez], [d0, dh, 0]], door > .02 ? mix(WOODL, WOOD, .3) : WOODL, dark(WOOD, .3), 2);
    const hx = lerp(d0, ex, .85), hz = lerp(0, ez, .85); const hp = V.p(hx, 300, hz); circ(g, hp[0], hp[1], 7 * V.s(hx, hz), P.gold);
  }
  // left wall (X = x0): panels, a plant, a sign
  V.poly(g, [[x0, 0, 0], [x0, 0, z1], [x0, h, z1], [x0, h, 0]], (gg, Sx) => lg(gg, Sx[0][0], 0, Sx[1][0], 0, [mix(WALL, P.plum, .1 + mood * .2), WALL2]));
  V.poly(g, [[x0, 0, 0], [x0, 0, z1], [x0, 90, z1], [x0, 90, 0]], WOOD);
  for (let Z = 400; Z < z1; Z += 700) V.poly(g, [[x0 + 1, 520, Z], [x0 + 1, 520, Z + 380], [x0 + 1, 860, Z + 380], [x0 + 1, 860, Z]], '#D9C6A6', rgba(P.woodDark, .4), 2);
  // window wall (X = x1)
  V.poly(g, [[x1, 0, 0], [x1, 0, z1], [x1, h, z1], [x1, h, 0]], '#5B4A44');
  const Wn = [];
  for (const [za, zb] of PANES) for (const [ya, yb] of [[40, 1010], [1040, 1270]]) { const q = V.path(g, [[x1, ya, za], [x1, ya, zb], [x1, yb, zb], [x1, yb, za]]); if (q) Wn.push(q); }
  g.save(); g.beginPath(); for (const q of Wn) { q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); } g.clip();
  const hz = V.p(x1 + 50000, V.y, V.z + 1)[1];
  g.fillStyle = lg(g, 0, hz - 900, 0, hz + 300, mood ? [mix(SKY[0], '#6F7FA0', mood), mix(SKY[1], '#A8B0C8', mood), mix(SKY[2], '#B8B4C8', mood)] : SKY); g.fillRect(-2000, -2000, 5000, 6000);
  // a city far below and away (we are on a high floor)
  for (let i = 0; i < 26; i++) { const Z = -9000 + i * 1300, hgt = 600 + ((i * 7919) % 11) * 260 - 900, q = V.path(g, [[x1 + 14000, -3000, Z], [x1 + 14000, -3000, Z + 1000], [x1 + 14000, hgt, Z + 1000], [x1 + 14000, hgt, Z]]); if (q) { g.fillStyle = mix('#B9B2C9', SKY[1], .25 + (i % 3) * .12); g.fill(); } }
  g.restore();
  // mullions
  for (const [za] of PANES) { V.poly(g, [[x1 - 2, 0, za - 18], [x1 - 2, 0, za + 18], [x1 - 2, h, za + 18], [x1 - 2, h, za - 18]], '#4A3C38'); }
  V.poly(g, [[x1 - 2, 1010, 0], [x1 - 2, 1010, z1], [x1 - 2, 1040, z1], [x1 - 2, 1040, 0]], '#4A3C38');
  // floor: polished stone with tile joints and a soft reflection of the windows
  V.poly(g, [[x0, 0, 0], [x1, 0, 0], [x1, 0, z1], [x0, 0, z1]], (gg, Sx) => lg(gg, 0, Math.min(...Sx.map(p => p[1])), 0, 1920, [STONE2, STONE, '#DCC8A8']));
  g.save(); g.lineWidth = 1.5; g.strokeStyle = rgba(P.woodDark, .14);
  for (let Z = 300; Z < z1; Z += 300) V.line(g, [x0, 0, Z], [x1, 0, Z], rgba(P.woodDark, .13), 1.5);
  for (let X = -1200; X <= 1200; X += 300) V.line(g, [X, 0, 0], [X, 0, z1], rgba(P.woodDark, .13), 1.5);
  g.globalAlpha = .16; g.globalCompositeOperation = 'screen';
  for (const [za, zb] of PANES) V.poly(g, [[x1 - 4, -1, za], [x1 - 4, -1, zb], [x1 - 260, -1, zb + 40], [x1 - 260, -1, za + 40]], '#FFF4D8');
  g.restore();
  // window light on the floor
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .5 * (1 - mood * .7);
  for (const [za, zb] of PANES) {
    const A = floorOf(40, za, S), B = floorOf(40, zb, S), C2 = floorOf(1010, zb, S), D = floorOf(1010, za, S);
    V.poly(g, [[A[0], 1, A[1]], [B[0], 1, B[1]], [Math.max(x0, C2[0]), 1, C2[1]], [Math.max(x0, D[0]), 1, D[1]]], '#FFD58C');
  }
  g.restore();
}
// volumetric shafts through the windows (drawn over the people)
export function hallShafts(g, V, o = {}) {
  const S = sunDir(o.sun || 0), a = (o.a ?? .1) * (1 - (o.mood || 0));
  if (a < .005) return;
  for (const [za, zb] of PANES) {
    const D = floorOf(1010, za, S), C2 = floorOf(1010, zb, S), A = floorOf(40, za, S), B = floorOf(40, zb, S);
    const pts = [[HALL.x1, 1010, za], [HALL.x1, 1010, zb], [C2[0], 0, C2[1]], [D[0], 0, D[1]]].map(p => V.p(...p));
    if (V.depth(HALL.x1, za) < 60) continue;
    shaft(g, pts, '#FFE2A6', a, 26);
  }
}

// one candidate's place: desk + chair + seated rig, as depth-sorted paint items
// o: { paper: 'front' | 'filled' | 'back' | null, flip (0..1 sheet turning), pen: bool, dim }
export function seatItems(V, g, X, Zd, ch, p, L, opt = {}, o = {}) {
  const Zc = Zd + SEAT_DZ, items = [], dDesk = V.depth(X, Zd), dCh = V.depth(X, Zc), front = dDesk < dCh, dim = o.dim || 0;
  if (Math.min(dDesk, dCh) < 140) return items;
  const c = k => (dim ? mix(k, '#8A7E9A', dim) : k), back = !front;
  const desk = () => {
    V.box(g, X - 160, 158, Zd - 78, X + 160, 172, Zd + 78, { top: c('#D6A877'), front: c('#A8724A'), back: c('#A8724A'), left: c('#94633F'), right: c('#94633F') });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) V.box(g, X + sx * 148 - 6, 0, Zd + sz * 66 - 6, X + sx * 148 + 6, 158, Zd + sz * 66 + 6, { front: c('#5A5262'), back: c('#5A5262'), left: c('#4A4252'), right: c('#4A4252') });
    V.box(g, X - 150, 40, Zd - 74, X + 150, 158, Zd - 66, { front: c('#B07A50'), back: c('#9A6844'), top: c('#C08A5C') });
    if (o.paper) sheetOnDesk(V, g, X + (o.px || 0), Zd + 18, o.paper, o.flip || 0, dim, o.sheetRot || 0);
  };
  const chair = () => {
    V.box(g, X - 72, 92, Zc - 58, X + 72, 112, Zc + 58, { top: c('#2F5E5C'), front: c('#244A48'), back: c('#244A48'), left: c('#1E3E3C'), right: c('#1E3E3C') });
    V.box(g, X - 8, 0, Zc - 8, X + 8, 92, Zc + 8, { front: c('#3A3444'), left: c('#3A3444'), right: c('#3A3444'), back: c('#3A3444') });
    V.box(g, X - 70, 120, Zc + 62, X + 70, (o.lowBack ? 262 : 300), Zc + 80, { front: c('#2F5E5C'), back: c('#244A48'), top: c('#3A6E6B'), left: c('#1E3E3C'), right: c('#1E3E3C') });
  };
  const body = only => () => V.ch(g, ch, p, X, Zc, L, { ...opt, only });
  if (o.noBody) { items.push({ d: V.depth(X, Zc + 70), fn: chair }, { d: dDesk, fn: desk }); return items; }
  if (front) {
    items.push({ d: V.depth(X, Zc + 70), fn: chair }, { d: dCh, fn: body([0, 1, 2]) }, { d: dDesk, fn: desk }, { d: dDesk - 1, fn: body([3]) });
  } else {
    items.push({ d: dDesk, fn: desk }, { d: dCh, fn: body(null) }, { d: V.depth(X, Zc + 70), fn: chair });
  }
  return items;
}
// the exam sheet lying on a desk (world quad, the header on the −Z edge, i.e. toward the front of the room)
export function sheetOnDesk(V, g, X, Z, side = 'front', flip = 0, dim = 0, rot = 0) {
  const w = 74, d = 96, Y = 173.5, cs = Math.cos(rot), sn = Math.sin(rot);
  const P3 = (u, v, lift = 0) => [X + u * cs - v * sn, Y + lift, Z + u * sn + v * cs];
  if (flip > 0 && flip < 1) { // the sheet turning over about its left edge
    const a = flip * Math.PI, ux = Math.cos(a), uy = Math.sin(a);
    const q = [[-w / 2, 0], [-w / 2 + w * ux, w * uy], [-w / 2 + w * ux, w * uy], [-w / 2, 0]];
    V.poly(g, [P3(-w / 2, -d / 2), P3(-w / 2 + w * ux, -d / 2, w * uy), P3(-w / 2 + w * ux, d / 2, w * uy), P3(-w / 2, d / 2)], flip < .5 ? '#FBF4E2' : '#F1E8D2', rgba(P.ink, .6), 1.5);
    return;
  }
  const S = V.poly(g, [P3(-w / 2, -d / 2), P3(w / 2, -d / 2), P3(w / 2, d / 2), P3(-w / 2, d / 2)], dim ? mix(P.paper, '#8A7E9A', dim) : P.paper, rgba(P.ink, .55), 1.5);
  if (!S) return;
  const hd = side === 'back' || side === 'backFilled';
  V.poly(g, [P3(-w * .4, -d * .44), P3(w * .4, -d * .44), P3(w * .4, -d * .38), P3(-w * .4, -d * .38)], P.ink);
  for (let i = 0; i < 6; i++) { const v = -d * .3 + i * d * .12; V.poly(g, [P3(-w * .4, v), P3(w * (.1 - (i % 3) * .08), v), P3(w * (.1 - (i % 3) * .08), v + 2.2), P3(-w * .4, v + 2.2)], rgba(P.lavDeep, .55)); }
  if (side === 'filled' || side === 'backFilled') for (let i = 0; i < 6; i++) { const v = -d * .3 + i * d * .12 + 6; V.poly(g, [P3(-w * .38, v), P3(w * .3, v), P3(w * .3, v + 2.4), P3(-w * .38, v + 2.4)], rgba(hd ? '#5E4E2A' : '#2E4FA0', .8)); }
}

// the examiner's raised desk (platform + desk + stack + register) as paint items. o: { stack: n sheets on the pile, inbox: n handed in, reg: rows signed }
export function examDeskItems(V, g, o = {}) {
  const E = EDESK, items = [];
  items.push({ d: V.depth((E.px0 + E.px1) / 2, E.pz1) + 400, fn: () => V.box(g, E.px0, 0, E.pz0, E.px1, E.ph, E.pz1, { top: '#B98A60', front: '#8E6040', back: '#8E6040', left: '#7A5236', right: '#7A5236' }) });
  items.push({ d: V.depth((E.x0 + E.x1) / 2, (E.z0 + E.z1) / 2), fn: () => {
    V.box(g, E.x0, E.ph, E.z0, E.x1, E.top - 14, E.z1, { front: '#7E5236', back: '#6A4430', left: '#5E3C2A', right: '#5E3C2A' });
    V.box(g, E.x0 - 14, E.top - 14, E.z0 - 14, E.x1 + 14, E.top, E.z1 + 14, { top: '#C9945F', front: '#9A6A44', back: '#9A6A44', left: '#8A5C3A', right: '#8A5C3A' });
    V.box(g, E.x0, E.top - 70, E.z1 + 14, E.x1, E.top - 60, E.z1 + 15, { back: P.gold, front: P.gold });
    // stack of blank exams to hand out, the in-tray of finished ones, the register
    const n = o.stack ?? 0; if (n) V.box(g, E.x0 + 30, E.top, E.z0 + 30, E.x0 + 104, E.top + n * 2.6, E.z0 + 126, { top: P.paper, front: '#E8DEC6', back: '#E8DEC6', left: '#E0D4BA', right: '#E0D4BA' });
    const m = o.inbox ?? 0; if (m) { V.box(g, E.x1 - 120, E.top, E.z0 + 24, E.x1 - 30, E.top + 6 + m * 2.6, E.z0 + 130, { top: P.paper, front: '#E8DEC6', back: '#E8DEC6', left: '#E0D4BA', right: '#E0D4BA' }); }
    V.poly(g, [[E.x0 + 150, E.top + 1, E.z0 + 40], [E.x0 + 240, E.top + 1, E.z0 + 40], [E.x0 + 240, E.top + 1, E.z0 + 118], [E.x0 + 150, E.top + 1, E.z0 + 118]], P.wood);
    V.poly(g, [[E.x0 + 156, E.top + 2, E.z0 + 46], [E.x0 + 234, E.top + 2, E.z0 + 46], [E.x0 + 234, E.top + 2, E.z0 + 112], [E.x0 + 156, E.top + 2, E.z0 + 112]], P.paper);
  } });
  return items;
}
// standard pose helpers
export const seatPose = (ch, o = {}) => pose(ch, { hipY: (ch.ul + ch.ll) * .992 + 12 - 98, legS: .5, lL: { x: -30 }, lR: { x: 30 } }, o);
