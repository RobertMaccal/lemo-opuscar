// The film: seven sequences, each a function of absolute time. Poses come from keyframed tracks; cuts are camera choices.
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, bloom, vignette, wash, paperGrain } from './kit.js';
import { drawChar, pose } from './rig.js';
import { X, YOU, JACK, PROF, TEACHER, COACH, STU_A, STU_B, STU_C, STU_D, STU_E } from './cast.js';
import * as S from './sets.js';
import { W, H, cam, layer, layerSoft, put, seat, sitY, finish, mkL, L_HALL, L_RIGHT, L_BACK, caption } from './shots.js';
import { TL, M, kf, pk, P_, idle, talk, voice, speaking, lineT, walk, run, captions, EASE, drawP, zoomAt } from './anim.js';
import { seq2 } from './film2.js';
import { seq3, seq4 } from './film3.js';
import { seq5, seq6 } from './film4.js';


// ================= TITLE =================
function seqTitle(ctx, t) {
  const z = kf(t, [[0, 1], [3.2, 1.1, 'lin']]);
  cam(ctx, zoomAt(540, 1010, z), () => {
    const C = S.corridor(ctx, t, { vy: 1010 });
    const L = mkL(-.76, .6, { shadow: { kx: -1.0, ky: .22, a: .3, blur: 5, col: P.plum } });
    const at = (Xw, Z) => { const p = C.pr(Xw, C.fl, Z); return { x: p[0], y: p[1], s: C.s(Z) }; };
    const far = Z => ({ tint: ['#F7DDAE', clamp((Z - 350) / 1900) * .7] });
    const ch = (c, Xw, Z, p) => { const a = at(Xw, Z); drawP(ctx, c, p, a.x, a.y, a.s, L, far(Z)); };
    ch(STU_D, 30, 1700 + t * 60, P_(STU_D, { face: 0, head: { back: 1 }, ...walk(t * 1.7, 1, { stride: 14, lift: 8 }), aL: { a: .25, b: .2 }, aR: { a: -.25, b: -.2 } }));
    ch(STU_C, -60 + t * 4, 1260 - t * 40, P_(STU_C, { face: .7, ...walk(t * 1.6, 1, { stride: 36 }) }));
    ch(STU_A, 66, 800, idle(talk(P_(STU_A, { face: .45, e: { mS: .6, mO: .2 + .2 * Math.max(0, Math.sin(t * 9)) }, aR: { a: .5, b: 1.5 + Math.sin(t * 3) * .15, hand: 'open', z: 1 } }), '', t), t, 3));
    ch(STU_B, 122, 780, idle(P_(STU_B, { face: -.45, e: { mS: .5 }, head: { tilt: Math.sin(t * 2.2) * .05 } }), t, 4));
    // YOU pace; Jack doesn't
    const px = Math.sin(t * 2.3) * 34, dir = Math.cos(t * 2.3) > 0 ? 1 : -1, wk = walk(t * 1.9, dir, { stride: 30, lift: 12, hipY: 12 });
    ch(YOU, -8 + px, 500, P_(YOU, { face: dir * .55, lean: dir * .04, shrug: 1, e: { ...X.cooked, gx: dir * .4 }, ...wk, aL: { to: [-72, -452], k: -1, z: 1 }, aR: { to: [54, -456], k: 1, z: 1 } }));
    ch(JACK, -124, 470, idle(P_(JACK, { face: .22, lean: -.2, hipX: -30, hipY: 8, lL: { x: 4 }, lR: { x: 48 }, head: { nod: .65, tilt: -.06 }, e: { ...X.chill, gy: .7 }, aL: { to: [-58, -250], k: 1, z: 1 }, aR: { to: [-22, -322 + Math.sin(t * 7) * 1.5], k: -1, z: 1, prop: { n: 'phone', r: -.18, back: 1 } } }), t, 1, .5));
    dust(ctx, t, 200, 500, 700, 900, 46, 5);
  });
  const k = kf(t, [[.08, 0], [.5, 1, 'back'], [2.5, 1], [2.85, 0, 'i']]);
  if (k > .02) { ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.5); S.titleCard(ctx, 540, 400 - (1 - k) * 40, .8 * (.7 + .3 * k)); ctx.restore(); }
  finish(ctx, { vig: .5, bl: .26 });
}

// ================= 1. BEFORE THE EXAM =================
let K1 = null;
function keys1() {
  if (K1) return K1;
  const m = M, l = id => lineT(id), y = (...o) => P_(YOU, ...o), j = (...o) => P_(JACK, ...o);
  const panic = y({ face: -.3, lean: -.05, hipY: 14, shrug: 1, head: { tilt: .06 }, e: { ...X.cooked, gx: -.55 }, aL: { to: [-74, -452], k: -1, z: 1 }, aR: { to: [54, -456], k: 1, z: 1 }, lL: { x: -26 }, lR: { x: 20 } });
  const plead = y({ face: -.38, lean: -.1, hipY: 8, shrug: .9, head: { tilt: -.05 }, e: { ...X.anxious, mWavy: 0, mS: -.7, mW: .9, gx: -.6 }, aL: { a: -.75, b: -1.5, hand: 'open', z: 1 }, aR: { a: -.35, b: -1.9, hand: 'open', z: 1 }, lL: { x: -30 }, lR: { x: 18 } });
  const hope = y({ face: -.36, shrug: .7, hipY: 6, e: { ...X.worried, eyeOpen: 1.2, browH: .9, browA: .5, gx: -.6, mS: .1, sweat: .4 }, aL: { to: [-24, -268], k: 1, z: 1 }, aR: { to: [8, -272], k: -1, z: 1 } });
  const relief = y({ face: -.25, shrug: -.3, lean: .04, hipY: 2, head: { tilt: .08, nod: -.1 }, e: X.relieved, aL: { to: [-14, -262], k: 1, z: 1 }, aR: { a: .16, b: -.2 } });
  const happy = y({ face: -.32, shrug: 0, e: { ...X.happy, gx: -.5 }, aL: { a: -.3, b: -.9, hand: 'open', z: 1 }, aR: { a: .15, b: -.15 } });
  const atDoor = y({ face: -.4, shrug: .8, hipY: 6, e: { ...X.shocked, pale: 0, mO: .15, eyeOpen: 1.25, gx: -.6 }, aL: { a: -.15, b: .2 }, aR: { a: .2, b: -.2 } });
  const inhale = y({ face: -.4, shrug: 1.6, hipY: -4, e: { ...X.worried, eyeOpen: .05, closeCurve: -1, mO: .3, mW: .5 }, aL: { a: -.2, b: .2 }, aR: { a: .2, b: -.2 } });
  const exhale = y({ face: -.5, shrug: 0, hipY: 6, e: { ...X.determined, mTeeth: 0, mS: -.3, sweat: .6 }, aL: { a: -.12, b: .15 }, aR: { a: .12, b: -.15 } });
  const lean = j({ face: .22, lean: -.2, hipX: -30, hipY: 8, lL: { x: 4 }, lR: { x: 48 }, shrug: -.3, head: { nod: .65, tilt: -.06 }, e: { ...X.chill, gy: .7, gx: .1 }, aL: { to: [-58, -250], k: 1, z: 1 }, aR: { to: [-22, -322], k: -1, z: 1, prop: { n: 'phone', r: -.18, back: 1 } } });
  const up = j({ face: .26, lean: -.2, hipX: -30, hipY: 8, lL: { x: 4 }, lR: { x: 48 }, shrug: -.3, head: { nod: .12, tilt: -.02, turn: .25 }, e: { ...X.hmm, mO: 0, gx: .6 }, aL: { to: [-58, -250], k: 1, z: 1 }, aR: { to: [-22, -322], k: -1, z: 1, prop: { n: 'phone', r: -.18, back: 1 } } });
  const sincere = j({ face: .28, lean: -.2, hipX: -30, hipY: 8, lL: { x: 4 }, lR: { x: 48 }, shrug: -.1, head: { nod: .1, tilt: .04, turn: .28 }, e: { ...X.chill, lidT: .36, browH: .15, gx: .6, mS: .2 }, aL: { to: [-58, -250], k: 1, z: 1 }, aR: { to: [-22, -322], k: -1, z: 1, prop: { n: 'phone', r: -.18, back: 1 } } });
  const shrugJ = j({ face: .22, lean: -.2, hipX: -30, hipY: 8, lL: { x: 4 }, lR: { x: 48 }, shrug: 1.1, head: { nod: .5, tilt: .1 }, e: { ...X.chill, gy: .6, browH: .35 }, aL: { to: [-58, -250], k: 1, z: 1 }, aR: { to: [-22, -322], k: -1, z: 1, prop: { n: 'phone', r: -.18, back: 1 } } });
  const stand = j({ face: .34, lean: 0, hipX: 0, hipY: 0, head: { nod: .1, turn: .1 }, e: { ...X.chill, gx: .5 }, aL: { a: -.08, b: .12 }, aR: { to: [30, -252], k: -1, z: 1, prop: { n: 'phone', r: .3, back: 1 } }, lL: { x: -28 }, lR: { x: 26 } });
  const a = { y01: l('y01'), j02: l('j02'), y03: l('y03'), j04: l('j04'), y05: l('y05'), j06: l('j06'), y07: l('y07'), j08: l('j08') };
  K1 = {
    you: [[m.s1, panic], [a.y03.t0 - .25, panic], [a.y03.t0 + .12, plead, 'back'], [a.y05.t0 - .25, plead], [a.y05.t0 + .1, hope], [a.y07.t0 - .1, hope], [a.y07.t0 + .4, relief], [a.y07.t0 + 1.7, relief], [a.y07.t0 + 2.2, happy, 'back'],
      [m.s1_door, happy], [m.s1_door + .25, atDoor, 'o'], [m.s1_walk + .5, atDoor], [m.s1_walk + 1.0, inhale], [m.s1_walk + 1.25, inhale], [m.s1_walk + 1.6, exhale]],
    jack: [[m.s1, lean], [a.j02.t0 - .12, lean], [a.j02.t0 + .12, up, 'o'], [a.j02.t1 + .6, up], [a.j02.t1 + 1.0, lean], [a.j04.t0 - .35, lean], [a.j04.t0, sincere], [a.j04.t1 + .25, sincere], [a.j04.t1 + .7, lean],
      [a.j06.t0 - .1, lean], [a.j06.t0 + .3, shrugJ], [a.j06.t0 + .9, lean], [a.j08.t0 + .1, lean], [a.j08.t0 + .7, shrugJ], [a.j08.t1 + .2, lean], [m.s1_door + .3, lean], [m.s1_door + .9, stand]],
    stand,
  };
  return K1;
}
function seq1(ctx, t) {
  const m = M, K = keys1();
  let c;
  if (t < m.s1_cuY) c = { x: 660, y: 1010, z: kf(t, [[m.s1, 1], [m.s1_cuY, 1.05, 'lin']]) };
  else if (t < m.s1_cuJ) c = { x: 1030, y: 868, z: kf(t, [[m.s1_cuY, 1.72], [m.s1_cuJ, 1.82, 'lin']]) };
  else if (t < m.s1_two) c = { x: 486, y: 812, z: kf(t, [[m.s1_cuJ, 1.76], [m.s1_two, 1.86, 'lin']]) };
  else if (t < m.s1_door) c = { x: 660, y: 1010, z: kf(t, [[m.s1_two, 1.04], [m.s1_door, 1.1, 'lin']]) };
  else c = { x: kf(t, [[m.s1_door, 660], [m.s1_door + 1.4, 700]]), y: 1010, z: 1.08 };
  const door = kf(t, [[m.s1_door, 0], [m.s1_door + .5, 1, 'o']]);
  cam(ctx, c, () => {
    S.hallFlat(ctx, t, { door });
    // the professor in the doorway
    if (door > .3) {
      ctx.save(); ctx.beginPath(); ctx.rect(640, 470, 290, 930); ctx.clip();
      const a = kf(t, [[m.s1_door + .2, 0], [m.s1_door + .55, 1], [m.s1_walk + .1, 1], [m.s1_walk + .6, 0]]);
      const pp = talk(idle(P_(PROF, { face: -.15, head: { tilt: .04 }, e: { ...X.tired, gx: -.2 }, aL: { a: -.15, b: .2 }, aR: { a: .55, b: 1.9 - a * .5, hand: 'open', z: 1 } }), t, 6), 'PROFESSOR', t);
      if (a > .02) drawP(ctx, PROF, pp, 770, 1392, 1.38, L_HALL, { tint: [P.night, .22], noShadow: true, alpha: a }); ctx.restore();
    }
    // Jack
    let jp = pk(JACK, t, K.jack), jx = 512, ja = 1, js = 1.5;
    if (t > m.s1_door + .9) {
      const u = t - (m.s1_door + .9), go = kf(u, [[0, 0], [1.5, 1, 'ss']]); jx = lerp(512, 800, go);
      if (go > 0 && go < 1) jp = { ...K.stand, face: .8, ...walk(u * 1.7, 1, { stride: 40 }), aR: K.stand.aR, head: { ...K.stand.head, nod: .5 }, e: { ...K.stand.e, gy: .6, gx: .2 } };
      ja = kf(u, [[1.3, 1], [1.62, 0]]); js = lerp(1.5, 1.38, go);
    }
    jp = talk(idle(jp, t, 1, .6), 'JACK', t);
    if (jp.aR.to && t < m.s1_door) jp = { ...jp, aR: { ...jp.aR, to: [jp.aR.to[0], jp.aR.to[1] + Math.sin(t * 6.5) * 1.4] } };
    if (ja > .02) drawP(ctx, JACK, jp, jx, 1400, js, L_HALL, { alpha: ja });
    // YOU
    let yp = pk(YOU, t, K.you), yx = 1040, ya = 1, ys = 1.5;
    if (t < lineT('y03').t0) yp = { ...yp, hipX: Math.sin(t * 21) * 2.5, head: { ...yp.head, tilt: yp.head.tilt + Math.sin(t * 5) * .03 } };
    if (t > m.s1_walk + 1.6) {
      const u = t - (m.s1_walk + 1.6), go = kf(u, [[0, 0], [.7, 1, 'ss']]); yx = lerp(1040, 800, go);
      yp = { ...yp, face: -.8, ...walk(u * 2.2, -1, { stride: 40 }) }; ya = kf(u, [[.5, 1], [.72, 0]]); ys = lerp(1.5, 1.38, go);
    }
    yp = talk(idle(yp, t, 0), 'YOU', t);
    if (ya > .02) drawP(ctx, YOU, yp, yx, 1400, ys, L_HALL, { alpha: ya });
    dust(ctx, t, 100, 200, 1000, 1200, 40, 2);
  });
  finish(ctx, { vig: .46 });
  captions(ctx, t, 1500);
}

// ================= dispatcher =================
export function renderFilm(ctx, t) {
  const m = M;
  if (t < m.s1) seqTitle(ctx, t);
  else if (t < m.s2) seq1(ctx, t);
  else if (t < m.s3) seq2(ctx, t);
  else if (t < m.s4) seq3(ctx, t);
  else if (t < m.s5_run) seq4(ctx, t);
  else if (t < m.s6) seq5(ctx, t);
  else seq6(ctx, t);
}
