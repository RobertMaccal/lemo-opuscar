// Look-test boards (style frames) drawn with the film's real code.
import { P_ } from './anim.js';
import { X, DREAMER as D } from './cast.js';
import * as SC from './scenes.js';
import * as S from './sets.js';
const hipY = (Y, s = 1) => SC.HIP0 - (S.FY - Y) / s;
const lying = P_(D, { lean: -1.5, face: .9, hipY: hipY(1432), head: { tilt: -1.37, oy: -10 }, e: X.sleep, lL: { x: 170, y: -96, r: -1.3 }, lR: { x: 185, y: -100, r: -1.3 }, aL: { a: 1.45, b: .2, z: 1 }, aR: { a: 1.35, b: .3, z: 1 } });
const sitting = P_(D, { lean: .06, face: .55, hipY: hipY(1440), e: X.startle, shrug: 1.2, lL: { x: 170, y: -96, r: -1.3 }, lR: { x: 185, y: -100, r: -1.3 }, aL: { a: -.9, b: -.3, hand: 'open', z: 1 }, aR: { a: 1.1, b: .4, hand: 'open', z: 1 } });
export const BOARDS = {
  bedWide: (ctx, t) => SC.bedroom(ctx, t, { c: { x: 470, y: 1250, z: 1.0 }, p: lying, blanket: { from: 330, legs: [[560, 26, 110], [640, 22, 70]] }, ss: 12 }),
  bedMed: (ctx, t) => SC.bedroom(ctx, t, { c: { x: 440, y: 1300, z: 1.45 }, p: sitting, blanket: { from: 470, legs: [[600, 26, 110], [680, 22, 70]] } }),
  bedCU: (ctx, t) => SC.bedroom(ctx, t, { c: { x: 470, y: 1290, z: 2.6 }, p: sitting, dof: 9, blanket: { from: 470, legs: [[600, 26, 110], [680, 22, 70]] } }),
  hall: (ctx, t) => SC.hallway(ctx, t, { c: { x: 1300, y: 1250, z: 1.0 }, x: 1350, s: 1.15, p: P_(D, { face: .8, e: X.drowsy, head: { nod: .3 } }), bathLight: 1 }),
  bath: (ctx, t) => SC.bathroom(ctx, t, { c: { x: 560, y: 1220, z: 1.0 }, x: 660, p: P_(D, { face: .75, e: X.hopeful, aR: { to: [60, -200], k: -1, z: 1 }, aL: { to: [40, -200], k: 1 } }), lid: 1 }),
  bathCU: (ctx, t) => SC.bathroom(ctx, t, { c: { x: 690, y: 1200, z: 2.6 }, x: 660, dof: 9, p: P_(D, { face: .55, e: X.bliss, shrug: -.3, aR: { to: [60, -200], k: -1, z: 1 }, aL: { to: [40, -200], k: 1 } }), lid: 1 }),
  pov: (ctx, t) => SC.hallPOV(ctx, t, {}),
};
