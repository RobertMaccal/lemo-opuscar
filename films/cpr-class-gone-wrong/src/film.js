// CPR CLASS GONE WRONG — the film as a function of time. One room, two reverse wides, close-ups cut from the same world.
import { P, F, mix, dark, rgba, rr, fillRR, circ, ell, line, text, tmp, TAU, clamp, lerp, dust, wash } from './kit.js';
import { pose, mixPose } from './rig.js';
import { X, HALE, VOL, PARK, CHRIS, DONOR, MAYA, LENA, PRIYA, NORA, BEN, TOM, SAM } from './cast.js';
import { desk } from './sets.js';
import * as R from './classroom.js';
import { W, H, cam, layer, put, seat, sitY, finish, mkL, caption } from './shots.js';
import { TL, M, kf, pk, P_, idle, talk, voice, walk, captions, EASE, chantEnv, sing } from './anim.js';

const L_F = mkL(-.76, .6, { shadow: { kx: -.62, ky: .14, a: .3, blur: 6, col: P.plum } });   // front room: light travels right → left
const L_C = mkL(.76, .6, { shadow: { kx: .62, ky: .14, a: .28, blur: 6, col: P.plum } });     // class room: light travels left → right
const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const win = (t, a, b, fi = .25, fo = .25) => sm(a - fi, a, t) * (1 - sm(b, b + fo, t));   // 0 → 1 → 0 envelope
const E = (...os) => Object.assign({}, ...os);
const B = () => TL.CH.BEAT, BAR = () => TL.CH.BAR, C0 = () => TL.CH.C0;
const beatPh = t => (t - C0()) / B();                 // beats since the chant began
const bars = t => (t - C0()) / BAR();

// ---------- compressions ----------
let COMPS = null;
const comps = () => COMPS || (COMPS = TL.EV.filter(e => e.type === 'comp').map(e => e.t));
function compD(t) {                                    // chest depth (0..1) of the manikin
  let d = 0;
  for (const te of comps()) { const x = (t - te + .06) / .3; if (x > 0 && x < 1) d = Math.max(d, x < .35 ? Math.sin(x / .35 * Math.PI / 2) : Math.cos((x - .35) / .65 * Math.PI / 2)); }
  return d;
}

// ================= positions (world px) =================
const MK = { x: 560, y: 1212, s: 1.1 };
const KN = { x: 560, y: 1172, s: .9 };                  // Kyle's kneeling / dancing spot, behind the manikin
const HL = { x: 935, y: 1312, s: .97 };                 // the teacher, right of the mat
const VE = { x: 175, y: 1268, s: .95 };                 // Victor's spot, by the manikin's head
const chestY = d => MK.y - 58 * MK.s + d * 7;

// ================= KYLE =================
const kneel = o => ({ hipY: 150, legS: .45, lL: { x: -34, y: 0 }, lR: { x: 34, y: 0 }, ...o });
function kyleArmsOnChest(d, open = 0) {
  const ly = (chestY(d) - KN.y) / KN.s - 4, lx = (MK.x - KN.x) / KN.s;
  return { aL: { to: [lx - 6 - open * 60, ly - open * 40], k: 1, l: 1.1, z: 1, hand: 'fist' }, aR: { to: [lx + 6 + open * 60, ly - 4 - open * 40], k: -1, l: 1.1, z: 1, hand: 'open', thumb: -1 } };
}
function kyleFront(t) {
  const m = M, d = compD(t), dK = d * 6;
  // walk in from the class side (bottom right), round behind the mat, turn, kneel
  if (t < m.kneel) {
    const u = clamp((t - m.walk) / (m.kneel - m.walk)), w1 = sm(0, .62, u), w2 = sm(.55, 1, u);
    const x = lerp(lerp(1210, 905, w1), KN.x, w2), y = lerp(1760, 1168, w1), s = lerp(1.28, KN.s, w1);
    const dist = u * 9; const back = u < .66;
    const p = P_(VOL, { face: back ? -.2 : -.7 + u * .4, head: { back: back ? 1 : 0, turn: back ? 0 : .3 }, ...walk(dist * .9, back ? 1 : -1, { stride: 34, lift: 14 }), e: E(X.happy, { gx: -.4 }) });
    return { p: idle(p, t, 2), x, y, s, kneeling: 0 };
  }
  const k = sm(m.kneel, m.kneel + .5, t);
  const stand0 = P_(VOL, { face: -.1, e: E(X.happy, { gy: .5 }), aL: { a: -.2, b: .2 }, aR: { a: .2, b: -.2 } });
  const kn0 = P_(VOL, kneel({ shrug: .2, head: { nod: .35 }, e: E(X.happy, { gy: .7, mS: .6 }), ...kyleArmsOnChest(0, 1) }));
  // proud singer: eyes shut, chin up, hands on chest, bobbing
  const proud = P_(VOL, kneel({ shrug: .35, head: { nod: -.15, tilt: .08 }, e: E(X.relieved, { sweat: 0, mS: .7, browH: .55, browA: .1 }), ...kyleArmsOnChest(d) }));
  const comp = (o = {}) => P_(VOL, kneel({ shrug: .3, hipY: 150 + dK, head: { nod: .3, tilt: 0 }, e: E(X.happy, { gy: .6 }), ...kyleArmsOnChest(d), ...o }));
  const surprised = P_(VOL, kneel({ shrug: .9, sq: -.15, head: { nod: -.1, turn: .2 }, e: E(X.shocked, { pale: 0, gx: .55, gy: -.3 }), ...kyleArmsOnChest(0, .9) }));
  const agree = P_(VOL, kneel({ shrug: .3, head: { nod: .25, turn: .15 }, e: E(X.happy, { gx: .5, gy: -.2, mS: .9 }), ...kyleArmsOnChest(0, .5) }));
  const resetH = P_(VOL, kneel({ shrug: .3, head: { nod: .3 }, e: E(X.determined, { mTeeth: 0, mS: .4, sweat: 0, gy: .7 }), ...kyleArmsOnChest(0) }));
  // the stare: eyes first, then the head, one brow
  const stareE = P_(VOL, kneel({ shrug: .3, head: { nod: .1 }, e: E(X.deadpan, { gx: -.15, gy: -.75, browAsym: 0 }), ...kyleArmsOnChest(0) }));
  const stareH = P_(VOL, kneel({ shrug: .2, head: { nod: -.18, turn: -.08, tilt: -.05 }, e: E(X.deadpan, { gx: 0, gy: -.25, browAsym: .85, browH: .1, lidT: .38 }), ...kyleArmsOnChest(0) }));
  const backTo = P_(VOL, kneel({ shrug: .3, head: { nod: .35 }, e: E(X.flat, { gy: .8 }), ...kyleArmsOnChest(0) }));
  let p = pk(VOL, t, [[m.kneel, stand0], [m.kneel + .55, kn0], [m.hands, kn0], [m.hands + .25, comp()], [m.first - .3, comp()], [m.first + .1, proud],
    [m.compStop1, proud], [m.compStop1 + .18, surprised, 'back'], [TL.L.find(l => l.id === 'v05').t0 + .5, surprised], [TL.L.find(l => l.id === 'v05').t0 + .75, agree, 'o'],
    [m.park - .2, agree], [m.park + .25, resetH], [m.stare + .1, resetH], [m.stare + .5, stareE, 'o'], [m.stare + .75, stareE], [m.stare + 1.3, stareH], [m.tb, stareH], [m.tb + .35, backTo], [m.C0 - .05, backTo], [m.C0 + .2, comp()]]);
  if (t > m.first - .3 && t < m.compStop1) { p = mixPose(VOL, p, proud, 0); const bob = Math.sin((t - m.comp1) / .571 * TAU) * .5 + .5; p = { ...p, hipY: p.hipY + dK, head: { ...p.head, tilt: p.head.tilt + (bob - .5) * .08 } }; Object.assign(p, kyleArmsOnChest(d)); }
  if (t >= m.C0 + .2) {
    // compressions on the beat, then the room gets to him: rocking, smile, last compression, stand, dance
    const bp = beatPh(t), rock = sm(m.C0 + BAR(), m.C0 + 2.5 * BAR(), t), joy = sm(m.C0 + 1.5 * BAR(), m.C0 + 3 * BAR(), t);
    const base = comp({ shrug: .3 + rock * .25 * Math.sin(bp * Math.PI), hipX: rock * 10 * Math.sin(bp * Math.PI), head: { nod: lerp(.3, -.1, joy), tilt: rock * .12 * Math.sin(bp * Math.PI) }, e: joy > .5 ? E(X.delighted, { sweat: 0, gx: Math.sin(bp * .5) * .5 }) : E(X.happy, { gy: lerp(.6, 0, joy) }) });
    const upU = sm(m.lastComp + .05, m.stood, t);       // knees straighten, hands leave the chest
    const handsOff = sm(m.lastComp + .08, m.lastComp + .45, t);
    const st = P_(VOL, { face: 0, hipY: 0, legS: 1, shrug: .25, head: { nod: 0 }, e: E(X.delighted, { sweat: 0 }), aL: { a: -.5, b: -.6, hand: 'open' }, aR: { a: .5, b: .6, hand: 'open' }, lL: { x: -30, y: 0 }, lR: { x: 30, y: 0 } });
    let q = base;
    if (handsOff > 0) q = mixPose(VOL, q, { ...q, ...kyleArmsOnChest(0, 1.3), e: E(X.delighted, { sweat: 0, gx: .4 }) }, handsOff);
    if (upU > 0) {
      const mid = P_(VOL, { face: 0, hipY: 70, legS: .75, shrug: .4, head: { nod: -.05, turn: .25 }, e: E(X.delighted, { gx: .5, sweat: 0 }), aL: { a: -.7, b: -.4, hand: 'open' }, aR: { a: .7, b: .4, hand: 'open' }, lL: { x: -20, y: 0 }, lR: { x: 40, y: -30 } });
      q = upU < .5 ? mixPose(VOL, q, mid, EASE.io(upU * 2)) : mixPose(VOL, mid, st, EASE.io((upU - .5) * 2));
    }
    // dancing: shoulders, first step, full disco point (up-right / down-left), HEY point, all on the grid
    const dz = sm(m.stood - .2, m.stood + .9, t), big = sm(m.C0 + 5 * BAR() + .2, m.C0 + 5 * BAR() + .7, t);
    if (dz > 0) {
      const ph = bp * Math.PI, s1 = Math.sin(ph), s2 = Math.sin(ph / 2);
      const shoulder = { shrug: .4 + .7 * Math.abs(s1), hipX: 30 * s2, lean: .1 * s2, head: { tilt: .1 * s2, nod: -.08 }, lL: { x: -32 + 14 * Math.max(0, s2), y: -18 * Math.max(0, s2) }, lR: { x: 32 + 14 * Math.min(0, s2), y: 18 * Math.min(0, s2) },
        aL: { a: -.9 - .5 * s1, b: -1.5, hand: 'fist' }, aR: { a: .9 - .5 * s1, b: 1.5, hand: 'fist' }, e: E(X.delighted, { sweat: 0, lidT: .2 }) };
      const disco = s2 > 0 ? { aR: { to: [150, -640], k: -1, hand: 'point', z: 1 }, aL: { to: [-40, -260], k: 1, hand: 'fist', z: 1 }, hipX: 22, lean: -.08 } : { aR: { to: [40, -260], k: -1, hand: 'fist', z: 1 }, aL: { to: [-160, -150], k: 1, hand: 'point', z: 1 }, hipX: -22, lean: .08 };
      let dp = P_(VOL, { face: 0, hipY: 6 + 16 * Math.abs(s1), legS: 1 }, shoulder);
      if (big > 0) dp = mixPose(VOL, dp, P_(VOL, { face: 0, legS: 1, hipY: 8, shrug: .5, head: { tilt: .14 * s2, nod: -.15 }, e: E(X.delighted, { sweat: 0, lidT: .25, mO: .5 }), lL: shoulder.lL, lR: shoulder.lR }, disco), big * .9);
      q = mixPose(VOL, q, dp, dz);
    }
    // HEY! the full pose — and it is frozen there by STOP
    const hey = P_(VOL, { face: -.1, hipY: 10, legS: 1, hipX: 24, lean: -.12, shrug: .6, head: { tilt: .18, nod: -.2 }, e: E(X.delighted, { sweat: 0, mO: .8, lidT: 0 }),
      aR: { a: 2.55, b: .12, hand: 'point', z: 1 }, aL: { to: [-130, -170], k: 1, hand: 'fist', z: 1 }, lL: { x: -56, y: 0 }, lR: { x: 44, y: -36, r: .3 } });
    const hk = sm(m.hey - .12, m.hey + .08, t); if (hk > 0) q = mixPose(VOL, q, hey, hk);
    // the freeze, and the slow blush
    if (t > m.freeze) {
      const fz = { ...hey, e: E(hey.e, { mO: 0, mS: .3, eyeOpen: 1.2, gx: .5, gy: -.2 }) };
      const emb = sm(m.freeze + .5, m.freeze + 1.6, t);
      const embF = { ...fz, e: E(X.embarrassed, { gx: .6, gy: .2 }) };
      q = mixPose(VOL, fz, embF, emb);
      // hands come down slowly during the verdict; he shrinks
      const down = sm(m.verdict + .4, m.verdict + 1.6, t);
      const ashamed = P_(VOL, { face: .15, hipY: 6, legS: 1, shrug: .9, head: { nod: .45, turn: .2 }, e: E(X.embarrassed, { gx: .7, gy: .35, mWavy: .7 }), aL: { to: [-20, -250], k: 1, z: 1 }, aR: { to: [20, -252], k: -1, z: 1 }, lL: { x: -26 }, lR: { x: 22 } });
      q = mixPose(VOL, q, ashamed, down);
      // "bury him?" — face into hands, slowly
      const fh = sm(m.silence + .2, m.silence2 + .5, t);
      const face = P_(VOL, { face: 0, hipY: 6, legS: 1, shrug: 1.0, head: { nod: .75 }, e: E(X.despair, { gloom: .3 }), aL: { to: [-34, -400], k: -1, z: 1, hand: 'open' }, aR: { to: [34, -402], k: 1, z: 1, hand: 'open', thumb: -1 }, lL: { x: -26 }, lR: { x: 22 } });
      q = mixPose(VOL, q, face, fh);
    }
    p = q;
  }
  const kneeling = t < m.lastComp ? 1 : 1 - sm(m.lastComp, m.stood, t);
  return { p: idle(sing(talk(p, 'KYLE', t), t > m.C0 ? chantEnv('vol', t) : 0, t), t, 2, .6), x: KN.x, y: KN.y + (t < m.lastComp + .1 ? dK * .6 : 0), s: KN.s, kneeling };
}
// Kyle in his seat (class wide), before he leaves
function kyleSeat(t) {
  const m = M, l = TL.L.find(x => x.id === 'v02');
  const sit = P_(VOL, seat(VOL, { e: E(X.happy, { mS: .5, gx: .1 }), aL: { to: [-58, -170], k: 1 }, aR: { to: [58, -170], k: -1 } }));
  const hand = P_(VOL, seat(VOL, { shrug: .5, lean: -.04, e: E(X.delighted, { sweat: 0, gx: -.1, gy: -.1 }), aL: { to: [-58, -170], k: 1 }, aR: { a: 2.75, b: .3, hand: 'open', z: 1 } }));
  const up = P_(VOL, { hipY: 0, legS: 1, shrug: .3, e: E(X.smug, { gx: 0, mS: .9 }), aL: { a: -.3, b: -.4 }, aR: { a: 2.9, b: .12, hand: 'point', z: 1 } });
  const go = P_(VOL, { hipY: 0, legS: 1, face: -.5, head: { turn: -.3 }, e: E(X.happy, { gx: -.6 }), aL: { a: -.25, b: .2 }, aR: { a: .25, b: -.2 } });
  const p = pk(VOL, t, [[m.cw1, sit], [m.hand - .12, sit], [m.hand + .1, hand, 'back'], [l.t0 + .2, hand], [l.t0 + .9, up, 'io'], [l.t1 - .2, up], [m.walk - .05, go]]);
  return idle(talk(p, 'KYLE', t), t, 2);
}

// ================= THE TEACHER =================
function hale(t) {
  const m = M, L = id => TL.L.find(l => l.id === id);
  const calm = P_(HALE, { face: -.32, e: E(X.tired, { gx: -.35 }), aL: { a: -.12, b: .1 }, aR: { a: .1, b: -.1 } });
  const ask = P_(HALE, { face: -.38, head: { tilt: -.03 }, e: E(X.dry, { gx: -.3, mSkew: .2 }), aL: { a: -.85, b: -.55, hand: 'open', z: 1 }, aR: { a: .1, b: -.1 } });
  const watch = P_(HALE, { face: -.45, e: E(X.tired, { gx: -.6, gy: .35, mS: .2 }), aL: { to: [-30, -300], k: 1, z: 1 }, aR: { to: [10, -306], k: -1, z: 1 } });
  const freeze = P_(HALE, { face: -.45, e: E(X.flat, { gx: -.6, gy: .35, eyeOpen: 1.1 }), aL: { to: [-30, -300], k: 1, z: 1 }, aR: { to: [10, -306], k: -1, z: 1 } });
  const closed = P_(HALE, { face: -.4, head: { nod: .12 }, e: E(X.sigh, { eyeOpen: .05, closeCurve: -1, browA: .6, browH: .1, mO: 0 }), aL: { to: [-30, -300], k: 1, z: 1 }, aR: { to: [10, -306], k: -1, z: 1 } });
  const nono = P_(HALE, { face: -.38, head: { nod: 0 }, e: E(X.stern, { gx: -.5, gy: .25 }), aL: { a: -1.4, b: -1.1, hand: 'open', z: 1 }, aR: { a: 1.0, b: 1.2, hand: 'open', z: 1 } });
  const point = P_(HALE, { face: -.35, e: E(X.bark, { gx: -.5, gy: .2, mO: .3 }), aL: { a: -.12, b: .1 }, aR: { to: [40, -620], k: -1, hand: 'point', z: 1 } });
  const confused = P_(HALE, { face: -.2, head: { tilt: .1, turn: .2 }, e: E(X.confused, { gx: .05, gy: 0 }), aL: { a: -.12, b: .1 }, aR: { to: [16, -380], k: -1, z: 1, hand: 'open' } });
  const horror = P_(HALE, { face: -.25, shrug: .9, sq: -.1, head: { turn: .05 }, e: E(X.horror, { gx: .2, gloom: .2, sweat: .5 }), aL: { a: -.3, b: -.2 }, aR: { a: .3, b: .2 } });
  const facepalm = P_(HALE, { face: -.3, shrug: .4, head: { nod: .3 }, e: E(X.exhausted, { gx: -.4 }), aL: { a: -.12, b: .1 }, aR: { to: [-12, -470], k: -1, z: 1, hand: 'open', thumb: -1 } });
  const yell = P_(HALE, { face: -.32, shrug: .8, e: E(X.bark, { mO: .95, browA: -.7, gx: -.4 }), aL: { a: -2.2, b: -.6, hand: 'open', z: 1 }, aR: { a: 2.2, b: .6, hand: 'open', z: 1 } });
  const verdict = P_(HALE, { face: -.42, head: { nod: .15 }, e: E(X.exhausted, { sweat: 0, mO: .2, gx: -.7, gy: .55 }), aL: { a: -1.1, b: -.25, hand: 'point', z: 1 }, aR: { a: .1, b: -.1 } });
  const flat2 = P_(HALE, { face: -.42, e: E(X.deadpan, { gx: -.6, gy: .1 }), aL: { a: -.12, b: .1 }, aR: { a: .1, b: -.1 } });
  const lookChris = P_(HALE, { face: -.1, head: { turn: 0 }, e: E(X.flat, { gx: 0, gy: -.1, eyeOpen: 1.05, browH: .2 }), aL: { a: -.12, b: .1 }, aR: { a: .1, b: -.1 } });
  const turnV = P_(HALE, { face: -.75, head: { turn: -.2 }, e: E(X.hollow, { gx: -.8, gy: .2 }), aL: { a: -.12, b: .1 }, aR: { a: .1, b: -.1 } });
  const t04 = L('t04'), t09 = L('t09');
  let p = pk(HALE, t, [[0, calm], [L('t01').t0 + .3, ask, 'io'], [L('t01').t1 + .4, ask], [m.walk + .3, calm], [m.hands, watch], [m.first, watch], [m.first + .15, freeze, 'o'], [m.first + .9, freeze], [m.first + 2.1, closed], [t04.t0 - .1, closed],
    [t04.t0 + .15, nono, 'back'], [t04.t0 + 2.0, nono], [t04.t0 + 2.3, point, 'back'], [t04.t1 + .6, point], [m.park + .1, calm], [m.park + .6, confused], [m.tb, confused], [m.C0 + BAR(), confused],
    [m.C0 + 2 * BAR(), horror], [m.dance + 1.2, horror], [m.dance + 1.8, facepalm], [m.stopT - .15, facepalm], [m.stopT + .05, yell, 'back'], [m.freeze + .3, yell], [m.verdict - .1, flat2], [t09.t0 + .9, verdict], [t09.t1 - .2, verdict],
    [L('t10').t0 - .2, flat2], [m.silence - .1, flat2], [m.silence + .4, lookChris], [m.turn, lookChris], [m.turn + .65, turnV, 'io']]);
  // "No, no, no": head shakes
  const sh = win(t, t04.t0 + .05, t04.t0 + 1.0, .05, .15); if (sh > 0) p = { ...p, head: { ...p.head, turn: (p.head.turn || 0) + Math.sin((t - t04.t0) * 22) * .14 * sh } };
  // the double blink
  if (t > m.tb && t < m.tb + .7) { const b = (t - m.tb) % .33; if (b < .1) p = { ...p, e: { ...p.e, eyeOpen: .05, closeCurve: 1 } }; }
  return idle(talk(p, 'TEACHER', t), t, 5, .7);
}

// ================= VICTOR (the donor) =================
function victorSeatPose(t) {
  const m = M;
  const sit = P_(DONOR, seat(DONOR, { aL: { to: [40, -260], k: -1, z: 1 }, aR: { to: [-40, -268], k: 1, z: 1 }, e: E(DONOR.face, { gx: .1 }) }));
  const judge = P_(DONOR, seat(DONOR, { aL: { to: [40, -260], k: -1, z: 1 }, aR: { to: [-40, -268], k: 1, z: 1 }, head: { tilt: -.06 }, e: E(X.deadpan, { gx: -.5, gy: .1 }) }));
  const rise = P_(DONOR, { hipY: 0, legS: 1, face: -.4, e: E(X.smug, { mS: .3, gx: -.6 }), aL: { a: -.12, b: .1 }, aR: { a: .1, b: -.1 } });
  return idle(pk(DONOR, t, [[0, sit], [m.cls, sit], [m.cls + 1, judge], [m.rise + .1, judge], [m.rise + .7, rise]]), t, 8, .6);
}
function victorFront(t) {
  const m = M, l11 = TL.L.find(l => l.id === 'd11'), l15 = TL.L.find(l => l.id === 'd15');
  const u = clamp((t - m.vic) / (m.vicArrive - m.vic)), w = EASE.o(u);
  const x = lerp(-150, VE.x, w), y = lerp(1820, VE.y, w), s = lerp(1.32, VE.s, w);
  const walking = P_(DONOR, { face: .3, head: { back: u < .7 ? 1 : 0 }, ...walk(u * 4.5, 1, { stride: 36, lift: 13 }), e: E(DONOR.face, { gx: .4, gy: .5 }) });
  const look = P_(DONOR, { face: .35, head: { nod: .5, turn: .1 }, e: E(X.deadpan, { gx: .5, gy: .9 }), aL: { a: -.1, b: .1 }, aR: { a: .1, b: -.12 } });
  const ask = P_(DONOR, { face: .1, head: { nod: -.05, turn: -.2 }, e: E(X.deadpan, { gx: -.1, gy: -.15, lidT: .35 }), aL: { a: -.1, b: .1 }, aR: { a: .7, b: 1.3, hand: 'open', z: 1 } });
  const wait2 = P_(DONOR, { face: .1, head: { turn: -.1 }, e: E(X.deadpan, { gx: -.2 }), aL: { a: -.1, b: .1 }, aR: { a: .1, b: -.12 } });
  const down = P_(DONOR, { face: .3, head: { nod: .45, turn: .1 }, e: E(X.deadpan, { gx: .5, gy: .9 }), aL: { a: -.1, b: .1 }, aR: { a: .1, b: -.12 } });
  const deliver = P_(DONOR, { face: .12, head: { nod: 0, turn: -.15 }, e: E(X.deadpan, { gx: -.05, gy: 0, lidT: .42, browH: -.25, mS: .05 }), aL: { a: -.1, b: .1 }, aR: { a: .55, b: 1.45, hand: 'open', z: 1, thumb: -1 } });
  const done = P_(DONOR, { face: .12, head: { turn: -.15 }, e: E(X.deadpan, { gx: -.05, lidT: .42, mS: .12 }), aL: { a: -.1, b: .1 }, aR: { a: .1, b: -.12 } });
  let p = u < 1 ? walking : pk(DONOR, t, [[m.vicArrive, look], [l11.t0 + 2.5, look], [l11.t0 + 2.9, ask], [m.chris1, ask], [m.chris1 + .6, wait2], [m.chris2 + .4, wait2], [m.silence + .4, down], [m.final + .2, down], [l15.t0 + .3, deliver, 'io'], [l15.t1 - .3, deliver], [l15.t1 + .2, done]]);
  if (u < 1 && u > .75) p = mixPose(DONOR, walking, look, sm(.75, 1, u));
  return { p: idle(talk(p, 'VICTOR', t), t, 8, .5), x, y, s };
}

// ================= the class (seated) =================
// seats: [row][col] — row 0 is the front
const SEATS = [['NORA', 'BEN', 'PRIYA'], ['LENA', 'KYLE', 'TOM'], ['MAYA', 'CHRIS', 'SAM'], ['GUS', null, 'VICTOR']];
const CH = { NORA, BEN, PRIYA, LENA, KYLE: VOL, TOM, MAYA, CHRIS, SAM, GUS: PARK, VICTOR: DONOR };
const CV = { MAYA: 'maya', LENA: 'lena', TOM: 'tom', BEN: 'ben', SAM: 'sam', PRIYA: 'priya', GUS: 'park' };
const deskHands = { aL: { to: [-58, -170], k: 1 }, aR: { to: [58, -170], k: -1 } };
function student(name, t) {
  const m = M, ch = CH[name], sd = name.length * 1.7 + name.charCodeAt(0) * .01;
  const bp = beatPh(t), ph = bp * Math.PI, inChant = t > m.C0 && t < m.freeze;
  const ce = CV[name] ? chantEnv(CV[name], t) : 0;
  // everyone's first beat: looking around when the teacher asks
  const look = win(t, m.cw1, m.hand + .4, .1, .3), dir = Math.sin(sd * 3) > 0 ? 1 : -1;
  let p = P_(ch, seat(ch, { ...deskHands, e: E(ch.face, { gx: look * dir * .7 * Math.sin((t - m.cw1) * 3 + sd), gy: -.1 }) }));
  const groove = n => (inChant ? sm(m.C0 + n * BAR(), m.C0 + n * BAR() + .8, t) : 0) * (1 - sm(m.freeze - .2, m.freeze, t));
  const stopped = sm(m.STOP, m.STOP + .15, t), hush = 1 - sm(m.verdict + 2, m.verdict + 4, t);
  switch (name) {
    case 'MAYA': { const g = groove(1); p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, shrug: .2 + .2 * Math.sin(ph), head: { tilt: .1 * Math.sin(ph / 2) }, e: E(X.happy, { lidT: .2, gx: .2 }) })), g); break; }
    case 'LENA': { const g = groove(2), up = groove(3);
      p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, shrug: .3, head: { tilt: .12 * Math.sin(ph / 2) }, e: E(X.delighted, { sweat: 0 }) })), g);
      if (up > 0) p = mixPose(ch, p, P_(ch, seat(ch, { shrug: .7, hipX: 8 * Math.sin(ph / 2), head: { tilt: .14 * Math.sin(ph / 2) }, e: E(X.delighted, { sweat: 0, lidT: .2 }),
        aL: { a: -2.75 + .25 * Math.sin(ph), b: -.15, hand: 'open', z: 1 }, aR: { a: 2.75 + .25 * Math.sin(ph), b: .15, hand: 'open', z: 1 } })), up);
      break; }
    case 'TOM': { const g = groove(2);
      p = mixPose(ch, p, P_(ch, seat(ch, { aL: { to: [-58, -170 - 10 * Math.max(0, Math.sin(ph))], k: 1 }, aR: { to: [58, -170 - 10 * Math.max(0, -Math.sin(ph))], k: -1 }, shrug: .6 * Math.sin(ph), lean: .05 * Math.sin(ph), head: { tilt: -.08 * Math.sin(ph) }, e: E(X.smug, { gx: 0, lidT: .35 }) })), g); break; }
    case 'BEN': { const g = groove(3), drum = Math.max(0, Math.sin(ph));
      p = mixPose(ch, p, P_(ch, seat(ch, { aL: { to: [-70, -175 - 40 * drum], k: 1, hand: 'open' }, aR: { to: [70, -175 - 40 * (1 - drum)], k: -1, hand: 'open' }, shrug: .3, head: { nod: -.1 + .1 * drum }, e: E(X.delighted, { sweat: 0 }) })), g); break; }
    case 'SAM': { const g = groove(3), s2 = Math.sin(ph / 2);
      p = mixPose(ch, p, P_(ch, seat(ch, s2 > 0 ? { aR: { to: [120, -470], k: -1, hand: 'point', z: 1 }, aL: { to: [-58, -170], k: 1 }, lean: -.06 } : { aR: { to: [58, -170], k: -1 }, aL: { to: [-140, -200], k: 1, hand: 'point', z: 1 }, lean: .06 }, { shrug: .4, head: { tilt: .1 * s2 }, e: E(X.smug, { mS: 1 }) })), g); break; }
    case 'PRIYA': { const g = groove(2), j = sm(m.C0 + 3.5 * BAR(), m.C0 + 4 * BAR(), t) * (1 - sm(m.freeze - .2, m.freeze, t));
      p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, shrug: .7, e: E(X.worried, { sweat: .2, gx: Math.sin(t * 1.3) * .8 }) })), g * (1 - j));
      p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, shrug: .4, head: { tilt: .06 * Math.sin(ph / 2) }, e: E(X.happy, { mS: .4, browA: .4, sweat: .3 }) })), j);
      // exchanges a look with Nora at full tilt
      const ex = win(t, m.cls2 + .3, m.cls2 + 1.4, .2, .2); if (ex > 0) p = mixPose(ch, p, { ...p, head: { ...p.head, turn: -.3 }, e: E(p.e, { gx: -.9, mO: 0, browA: .7 }) }, ex);
      break; }
    case 'NORA': { const g = groove(2);   // stares at the teacher the whole time
      p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, shrug: .5, e: E(X.how, { mO: .2, gx: -.55, gy: .1, pale: .3 }) })), g);
      const ex = win(t, m.cls2 + .3, m.cls2 + 1.4, .2, .2); if (ex > 0) p = mixPose(ch, p, { ...p, head: { ...p.head, turn: .3 }, e: E(p.e, { gx: .9 }) }, ex);
      break; }
    case 'GUS': { const g = groove(3) * sm(m.C0 + 3.5 * BAR(), m.C0 + 4 * BAR(), t) + groove(4);
      p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, hipX: 6 * Math.sin(ph / 2), lean: .06 * Math.sin(ph / 2), e: E(X.delighted, { sweat: 0, lidT: .3 }) })), clamp(g)); break; }
    case 'CHRIS': {   // perpetually confused
      const c = inChant ? 1 : .4;
      p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, shrug: .6, head: { turn: .25 * Math.sin(t * 1.1), tilt: .05 }, e: E(CHRIS.face, X.confused, { eyeOpen: 1.2, gx: Math.sin(t * 1.1) * .8, mW: .5 }) })), c * (1 - sm(m.silence - .5, m.silence, t)));
      break; }
    case 'KYLE': return kyleSeat(t);
    case 'VICTOR': return victorSeatPose(t);
  }
  // STOP: everyone freezes; mouths shut; Ben is mortified; heads drop
  if (t > m.STOP) {
    const fr = { ...p, e: E(p.e, { mO: 0, mS: -.1, eyeOpen: 1.25 }) };
    p = mixPose(ch, p, fr, stopped);
    if (name === 'BEN') p = mixPose(ch, p, { ...p, shrug: .9, head: { ...p.head, nod: .3 }, e: E(X.embarrassed, { gx: -.2 }) }, sm(m.STOP + .3, m.STOP + 1.1, t));
    if (name === 'LENA') p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, shrug: .6, e: E(X.embarrassed, { gx: -.4, blush: .7 }) })), sm(m.STOP + .5, m.STOP + 1.6, t));
    if (name === 'SAM') p = mixPose(ch, p, P_(ch, seat(ch, { ...deskHands, head: { nod: .6 }, e: E(X.sigh, { gy: .9 }) })), sm(m.mani + .3, m.mani + 1.0, t));
  }
  // "bury him?" — everyone turns to Christopher
  if (t > m.silence - .2 && name !== 'CHRIS') {
    const r = SEATS.findIndex(row => row.includes(name)), c = SEATS[r].indexOf(name) - 1;
    const dx = (0 - c) * 1, dy = 2 - r;   // Christopher sits at row 2, col 0
    const tw = sm(m.silence + .05 + (r * .13 + (c + 1) * .07) % .4, m.silence + .55 + (r * .13 + (c + 1) * .07) % .4, t);
    p = mixPose(ch, p, { ...p, head: { ...p.head, turn: clamp(dx * .35 - (dy < 0 ? 0 : 0), -.5, .5), nod: dy > 0 ? -.05 : .05 }, e: E(p.e, { gx: clamp(dx * .8, -1, 1), gy: dy > 0 ? -.4 : dy < 0 ? .4 : 0, mO: 0, eyeOpen: 1.2, browH: .4 }) }, tw);
  }
  let q = idle(p, t, sd, .7);
  if (ce > 0) q = sing(q, ce, t);
  return q;
}
function chrisCU(t) {   // Christopher in close-up: "I have no idea." / "Actually… we could bury him?"
  const m = M, l12 = TL.L.find(l => l.id === 'c12'), l14 = TL.L.find(l => l.id === 'c14');
  const caught = P_(CHRIS, seat(CHRIS, { ...deskHands, shrug: 1, sq: -.12, e: E(X.anxious, { mWavy: 0, gx: -.1, gy: -.2 }) }));
  const noidea = P_(CHRIS, seat(CHRIS, { shrug: 1.2, head: { tilt: .1 }, e: E(X.worried, { eyeOpen: 1.25, gx: 0, sweat: .6 }), aL: { a: -1.2, b: -1.2, hand: 'open', z: 1 }, aR: { a: 1.2, b: 1.2, hand: 'open', z: 1 } }));
  const think = P_(CHRIS, seat(CHRIS, { ...deskHands, shrug: .7, head: { tilt: -.08 }, e: E(X.confused, { eyeOpen: 1.15, gx: .5, gy: -.6 }) }));
  const finger = P_(CHRIS, seat(CHRIS, { aL: { to: [-58, -170], k: 1 }, aR: { a: 2.55, b: .35, hand: 'point', z: 1 }, shrug: .5, head: { tilt: .06 }, e: E(X.happy, { eyeOpen: 1.2, browH: .7, browA: .3, mS: .5, gx: 0, gy: -.1 }) }));
  const hope = P_(CHRIS, seat(CHRIS, { aL: { to: [-58, -170], k: 1 }, aR: { a: 2.55, b: .35, hand: 'point', z: 1 }, shrug: .8, head: { tilt: .1 }, e: E(X.worried, { eyeOpen: 1.2, mS: .3, browA: .8, browH: .5, sweat: .4, gx: 0 }) }));
  const wide = P_(CHRIS, seat(CHRIS, { ...deskHands, shrug: 1.1, e: E(X.shocked, { pale: .1, gx: 0, eyeOpen: 1.6, pup: .35 }) }));
  const p = pk(CHRIS, t, [[m.chris1, caught], [l12.t0 + .25, noidea, 'back'], [l12.t1 + .3, noidea], [m.vic2 + .2, think], [m.chris2 - .05, think], [m.chris2 + .25, finger, 'back'], [l14.t0 + 1.2, finger], [l14.t0 + 1.7, hope], [m.eyes, hope], [m.eyes + .14, wide, 'back']]);
  return idle(talk(p, 'CHRISTOPHER', t), t, 4, .5);
}
function gusCU(t) {
  const m = M, l = TL.L.find(x => x.id === 'p06');
  const sit = P_(PARK, seat(PARK, { ...deskHands, e: E(PARK.face, { gx: -.2 }) }));
  const wait_ = P_(PARK, seat(PARK, { shrug: .5, lean: -.04, e: E(X.how, { eyeOpen: 1.3, browA: -.2, browH: .9, mO: .45, mS: .3, gx: 0, gy: .1 }), aL: { to: [-58, -170], k: 1 }, aR: { to: [150, -250], k: -1, hand: 'point', z: 1 } }));
  const realise = P_(PARK, seat(PARK, { shrug: .3, e: E(X.delighted, { sweat: 0, gx: 0 }), aL: { to: [-58, -170], k: 1 }, aR: { to: [160, -300], k: -1, hand: 'point', z: 1 } }));
  const innocent = P_(PARK, seat(PARK, { shrug: .2, head: { tilt: .12 }, e: E(X.friendly, { gx: 0 }), aL: { to: [-58, -170], k: 1 }, aR: { a: 2.8, b: .3, hand: 'open', z: 1 } }));
  let p = pk(PARK, t, [[m.park - .2, sit], [l.t0 + .1, wait_, 'back'], [l.t0 + 2.6, wait_], [l.t0 + 2.9, realise, 'back'], [m.pk2, realise], [m.pk2 + .2, innocent]]);
  if (t > m.pk2) p = { ...p, aR: { ...p.aR, a: 2.8 + Math.sin((t - m.pk2) * 14) * .25 } };
  return idle(talk(p, 'GUS', t), t, 9, .6);
}
// the class: room + rows (+ who is drawn sharp on top)
function classPose(name, t) {
  if (name === 'CHRIS' && t > M.chris1 - .3 && t < M.silence) return chrisCU(t);
  if (name === 'CHRIS' && t > M.eyes - .3) return chrisCU(t);
  if (name === 'GUS' && t > M.park - .3 && t < M.tb + .1) return gusCU(t);
  return student(name, t);
}
function classScene(g, t, { only = null, skip = null } = {}) {
  if (!only) R.classRoom(g, t);
  for (let r = 3; r >= 0; r--) {
    const { y, s } = R.ROWS[r];
    for (let c = -1; c <= 1; c++) {
      const name = SEATS[r][c + 1], x = R.colX(r, c);
      if (only && name !== only) continue; if (skip && name === skip) continue;
      const here = name && !(name === 'KYLE' && t > M.walk) && !(name === 'VICTOR' && t > M.rise + 1.2);
      if (!only) ell(g, x + 6 * s, y + 6 * s, 200 * s, 24 * s, rgba(P.plum, .2));
      const opt = { noShadow: true, tint: [P.plum, .02 + r * .045] };
      let p = null;
      if (here) {
        p = classPose(name, t);
        if (name === 'VICTOR' && t > M.rise) p = { ...p };
        put(g, CH[name], x, y, s, p, L_C, { ...opt, only: [0, 1, 2] });
      }
      desk(g, x, y, s, { paper: name ? 1 : 0, filled: 0, dim: r * .04, pencil: name === 'BEN' && t < M.pen });
      if (name === null && !only) { rr(g, x + 40 * s, y - 220 * s, 90 * s, 80 * s, 14 * s); g.fillStyle = P.tealDeep; g.fill(); }
      if (here) put(g, CH[name], x, y, s, p, L_C, { ...opt, only: [3] });
    }
  }
  if (!only) { R.classLight(g, t); dust(g, t, 0, 200, 1000, 1300, 50, 21); }
}

// ================= the front of the room =================
function frontScene(g, t, { only = null, fg = true } = {}) {
  const m = M;
  if (!only) { R.frontRoom(g, t); R.frontProps(g, t); }
  const kOn = t > m.walk, vOn = t > m.vic, K = kOn ? kyleFront(t) : null, V = vOn ? victorFront(t) : null, Hh = hale(t);
  const d = compD(t);
  const items = [];
  if (K) items.push({ y: K.y, draw: () => {
    const body = !only || only === 'KYLE';
    if (K.y < MK.y + 1) { if (body) put(g, VOL, K.x, K.y, K.s, K.p, L_F, { only: [0, 1, 2] }); R.manikin(g, MK.x, MK.y, MK.s, { d: d * 7 }); if (body) put(g, VOL, K.x, K.y, K.s, K.p, L_F, { only: [3] }); }
    else if (body) put(g, VOL, K.x, K.y, K.s, K.p, L_F);
  }, who: 'KYLE' });
  if (!K || K.y >= MK.y + 1) items.push({ y: MK.y, draw: () => R.manikin(g, MK.x, MK.y, MK.s, { d: d * 7 }), who: 'MANI' });
  if (V) items.push({ y: V.y, draw: () => put(g, DONOR, V.x, V.y, V.s, V.p, L_F), who: 'VICTOR' });
  items.push({ y: HL.y, draw: () => put(g, HALE, HL.x, HL.y, HL.s, Hh, L_F), who: 'HALE' });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) if (!only || only === it.who || (only === 'KYLE' && it.who === 'MANI') || (only === 'MANI' && it.who === 'KYLE')) it.draw();
  if (!only) { R.frontLight(g, t); dust(g, t, 100, 300, 900, 1100, 46, 5); }
}

// ================= shots =================
// camera: { x, y, z } in world px; DOF: `sharp` names are redrawn crisp over a blurred plate
function shot(ctx, t, scene, c, { sharp = null, blur = 0, fn = null } = {}) {
  if (blur && sharp) {
    const g = tmp('plate', W, H); cam(g, c, () => scene(g, t, {}));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${blur}px)`; ctx.drawImage(g.canvas, 0, 0); ctx.restore();
    cam(ctx, c, () => { for (const s of [].concat(sharp)) scene(ctx, t, { only: s }); if (fn) fn(ctx); });
  } else cam(ctx, c, () => { scene(ctx, t, {}); if (fn) fn(ctx); });
}
function title(ctx, t) {
  const k = kf(t, [[.15, 0], [.55, 1, 'back'], [3.1, 1], [3.5, 0, 'i']]); if (k < .01) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.4); ctx.translate(540, 1500 - (1 - k) * 30); ctx.rotate(-.025); ctx.scale(.75 + .25 * k, .75 + .25 * k);
  const L = [['CPR CLASS', 104, -62], ['GONE WRONG', 132, 58]];
  for (const [s, size, yy] of L) { text(ctx, s, 8, yy + 10, { size, col: rgba(P.indigo, .9) }); text(ctx, s, 0, yy, { size, col: P.cream, stroke: P.indigo, sw: 16 }); text(ctx, s, 0, yy, { size, col: s === 'GONE WRONG' ? '#E7604A' : P.cream }); }
  fillRR(ctx, -230, 140, 460, 11, 6, P.orange);
  ctx.restore();
  const k2 = kf(t, [[.1, 0], [.5, 1], [3.1, 1], [3.4, 0]]);
  ctx.save(); ctx.globalAlpha = k2 * .92; fillRR(ctx, 290, 56, 500, 40, 20, rgba(P.night, .55)); text(ctx, 'FICTIONAL FIRST-AID CLASSROOM COMEDY', 540, 77, { size: 19, font: F.ui, weight: '600', col: P.cream, ls: 2 }); ctx.restore();
}
export function renderFilm(ctx, t) {
  const m = M, d = compD(t);
  let grade = null, vig = .5;
  if (t < m.cw1) { shot(ctx, t, frontScene, { x: 640, y: 960, z: kf(t, [[0, 1.26], [m.cw1, 1.34, 'lin']]) }); }
  else if (t < m.k1) shot(ctx, t, classScene, { x: 540, y: 980, z: 1.04 });
  else if (t < m.walk) shot(ctx, t, classScene, { x: 545, y: kf(t, [[m.k1, 1000], [m.walk - .9, 950]]), z: kf(t, [[m.k1, 2.7], [m.walk, 2.85, 'lin']]) }, { sharp: 'KYLE', blur: 5 });
  else if (t < m.ins) shot(ctx, t, frontScene, { x: kf(t, [[m.walk, 780], [m.kneel + .2, 620]]), y: kf(t, [[m.walk, 1080], [m.kneel + .2, 980]]), z: 1.32 });
  else if (t < m.two) shot(ctx, t, frontScene, { x: 560, y: 1120, z: 3.1 });
  else if (t < m.t1) shot(ctx, t, frontScene, { x: 735, y: 975, z: kf(t, [[m.two, 1.5], [m.t1, 1.58, 'lin']]) });
  else if (t < m.k2) shot(ctx, t, frontScene, { x: 935, y: 915, z: 2.35 }, { sharp: 'HALE', blur: 4 });
  else if (t < m.park) shot(ctx, t, frontScene, { x: 600, y: 990, z: 2.0 });
  else if (t < m.stare) shot(ctx, t, classScene, { x: 395, y: 805, z: kf(t, [[m.park, 4.6], [m.stare, 4.9, 'lin']]) }, { sharp: 'GUS', blur: 8 });
  else if (t < m.pk2) shot(ctx, t, frontScene, { x: 560, y: 945, z: 3.1 }, { sharp: 'KYLE', blur: 5 });
  else if (t < m.tb) shot(ctx, t, classScene, { x: 390, y: 800, z: 5.2 }, { sharp: 'GUS', blur: 8 });
  else if (t < m.kyleCU) shot(ctx, t, frontScene, { x: 935, y: 920, z: 3.3 }, { sharp: 'HALE', blur: 6 });
  else if (t < m.cls) shot(ctx, t, frontScene, { x: 590, y: 1000, z: kf(t, [[m.kyleCU, 1.85], [m.cls, 2.0, 'lin']]) });
  else if (t < m.tH) shot(ctx, t, classScene, { x: 540, y: 1040, z: kf(t, [[m.cls, 1.1], [m.tH, 1.24, 'lin']]) });
  else if (t < m.dance) { shot(ctx, t, frontScene, { x: 935, y: kf(t, [[m.tH, 940], [m.dance, 925]]), z: kf(t, [[m.tH, 2.7], [m.dance, 3.1, 'lin']]) }, { sharp: 'HALE', blur: 5 }); grade = ['#8C86B0', .12, 'multiply']; }
  else if (t < m.cls2) shot(ctx, t, frontScene, { x: 650, y: 950, z: kf(t, [[m.dance, 1.42], [m.cls2, 1.34, 'lin']]) });
  else if (t < m.dance2) shot(ctx, t, classScene, { x: 540, y: 1040, z: 1.16 });
  else if (t < m.stopT) shot(ctx, t, frontScene, { x: 640, y: 940, z: 1.34 });
  else if (t < m.freeze) shot(ctx, t, frontScene, { x: 935, y: 870, z: 2.5 }, { sharp: 'HALE', blur: 5 });
  else if (t < m.verdict) shot(ctx, t, frontScene, { x: 640, y: 940, z: 1.34 });
  else if (t < m.mani) shot(ctx, t, frontScene, { x: 790, y: 940, z: kf(t, [[m.verdict, 1.62], [m.mani, 1.75, 'lin']]) });
  else if (t < m.rise) shot(ctx, t, frontScene, { x: 450, y: 1165, z: 2.3 }, { sharp: 'MANI', blur: 10 });
  else if (t < m.vic) shot(ctx, t, classScene, { x: 540, y: 980, z: 1.04 });
  else if (t < m.chris1) shot(ctx, t, frontScene, { x: 520, y: 980, z: kf(t, [[m.vic, 1.34], [m.chris1, 1.4, 'lin']]) });
  else if (t < m.vic2) shot(ctx, t, classScene, { x: 540, y: 880, z: 4.4 }, { sharp: 'CHRIS', blur: 8 });
  else if (t < m.chris2) shot(ctx, t, frontScene, { x: 330, y: 950, z: 1.9 });
  else if (t < m.silence) shot(ctx, t, classScene, { x: 540, y: 875, z: kf(t, [[m.chris2, 4.3], [m.silence, 4.6, 'lin']]) }, { sharp: 'CHRIS', blur: 8 });
  else if (t < m.silence2) shot(ctx, t, classScene, { x: 540, y: 1060, z: 1.3 });
  else if (t < m.final) shot(ctx, t, frontScene, { x: 640, y: 950, z: 1.42 });
  else if (t < m.pen) shot(ctx, t, frontScene, { x: 400, y: 970, z: 1.62 });
  else if (t < m.eyes) shot(ctx, t, classScene, { x: 575, y: 1270, z: 2.6 }, { fn: g => pen(g, t) });
  else if (t < m.turn) shot(ctx, t, classScene, { x: 540, y: 860, z: 6.0 }, { sharp: 'CHRIS', blur: 9 });
  else if (t < m.black) shot(ctx, t, frontScene, { x: 935, y: 920, z: 3.0 }, { sharp: 'HALE', blur: 6 });
  else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
  finish(ctx, { vig, bl: .22, grade });
  title(ctx, t);
  captions(ctx, t, 1520, 56);
}
// Ben's pencil slips and falls (world coords of the class room)
function pen(g, t) {
  const u = clamp((t - M.pen - .05) / .38); const x0 = R.colX(0, 0) + 70 * .9, y0 = R.ROWS[0].y - 165 * .9;
  if (t < M.pen + .05) return;
  g.save(); g.translate(x0 + u * 40, y0 + u * u * 300); g.rotate(-.5 + u * 4);
  line(g, 0, -34, 0, 30, P.orange, 8, 'butt'); line(g, 0, -42, 0, -34, P.rose, 8, 'butt'); g.restore();
}
