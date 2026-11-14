// Scene renderers: each draws one set + the dreamer under one camera, with depth of field and the post stack.
import { P, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, TAU, clamp, lerp, wash } from './kit.js';
import { drawChar } from './rig.js';
import { DREAMER as D } from './cast.js';
import * as S from './sets.js';
import { W, H, cam, layerSoft, finish, mkL } from './shots.js';

export const HIP0 = (D.ul + D.ll) * .992 + 12;         // standing hip height (local units)
export const L_LAMP = mkL(.86, .42);
export const L_BATH = mkL(.42, .9, { rim: '#FFE2A8' });
export const L_HALL_ON = mkL(-.88, .36, { rim: '#FFD28E' });
export const L_HALL_OFF = mkL(-.35, .9, { rim: '#C9C2F2', rimA: .8, shadeA: .4 });
const shadowOn = L => ({ ...L, shadow: { kx: L.dx > 0 ? .55 : -.55, ky: .13, a: .3, blur: 6, col: '#15122E' } });
const ch = (g, p, x, y, s, L, opt) => drawChar(g, D, { ...p, x, y, s }, L, opt);

// ---------------- bedroom ----------------
// o: { c (camera), p (pose), x, s, blanket: {...}, armsOver, ss (clock seconds or null), dof (bg blur), lamp, grade }
export function bedroom(ctx, t, o) {
  const c = o.c, s = o.s ?? 1, x = o.x ?? S.BED.hipX, inBed = o.inBed ?? true, L = o.L || L_LAMP;
  const back = g => cam(g, c, () => { S.bedroomBack(g, t, { ss: o.ss ?? null }); S.bedFrame(g); S.pillow(g, 220, 1424, o.squash || 0); if (o.sheetWet) S.sheetWet(g, 520, 1452, o.sheetWet); });
  if (o.dof) { ctx.fillStyle = S.N.wall; ctx.fillRect(0, 0, W, H); layerSoft(ctx, 'bgBed', back, o.dof); } else back(ctx);
  cam(ctx, c, () => {
    const opt = { noShadow: inBed };
    const Lc = inBed ? L : shadowOn(L);
    if (o.p) ch(ctx, o.p, x, S.FY, s, Lc, { ...opt, only: o.armsOver === false ? [0, 1, 2, 3] : [0, 1, 2] });
    if (o.blanket !== null) S.blanket(ctx, t, o.blanket || {});
    if (o.p && o.armsOver !== false) ch(ctx, o.p, x, S.FY, s, Lc, { ...opt, only: [3] });
    S.bedroomLight(ctx, t, { lamp: o.lamp ?? 1 });
  });
  if (o.after) o.after(ctx);
  finish(ctx, { vig: o.vig ?? .62, bl: .26, grade: o.grade || ['#3A3470', .12, 'multiply'] });
}

// ---------------- hallway ----------------
export function hallway(ctx, t, o) {
  const c = o.c, light = o.bathLight ?? 1, L = light > .5 ? L_HALL_ON : L_HALL_OFF;
  cam(ctx, c, () => {
    S.hallway(ctx, t, { bathLight: light });
    if (o.p) ch(ctx, o.p, o.x, S.FY, o.s ?? 1.15, shadowOn(L));
    S.hallwayLight(ctx, t);
  });
  finish(ctx, { vig: .6, bl: .26, grade: ['#3A3470', .1, 'multiply'] });
}
export function hallPOV(ctx, t, o) {
  cam(ctx, o.c || { x: 540, y: 960, z: 1 }, () => S.hallPOV(ctx, t));
  if (o.fg) o.fg(ctx);
  finish(ctx, { vig: .7, bl: .24, grade: ['#3A3470', .14, 'multiply'] });
}

// ---------------- bathroom ----------------
export function bathroom(ctx, t, o) {
  const c = o.c, s = o.s ?? 1;
  const back = g => cam(g, c, () => { S.bathroomBack(g, t, { towelSide: o.towel ?? -1 }); if (o.mirror) o.mirror(g); if (!o.toiletFront && !o.noToilet) S.toilet(g, o.lid ?? 0); });
  if (o.dof) { ctx.fillStyle = S.N.bathWall; ctx.fillRect(0, 0, W, H); layerSoft(ctx, 'bgBath', back, o.dof); } else back(ctx);
  cam(ctx, c, () => {
    if (o.p) ch(ctx, o.p, o.x ?? 680, S.FY, s, shadowOn(L_BATH), { noShadow: !!o.dof });
    if (o.toiletFront) S.toilet(ctx, o.lid ?? 0);
    if (o.hand) o.hand(ctx);
    S.bathroomNight(ctx);
    S.bathroomLight(ctx, t);
  });
  if (o.after) o.after(ctx);
  finish(ctx, { vig: o.vig ?? .55, bl: .28, grade: o.grade || ['#4A3C6E', .06, 'multiply'] });
}
export { ch };
