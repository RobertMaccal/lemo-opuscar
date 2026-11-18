// THE 10-SECOND MASSAGE — the film. One continuous world (the living room, its people and its light) is computed for
// every t (stateAt), then each shot is a camera choice on that world (renderFilm). Times come from timeline.js marks.
import { P, F, mix, dark, lite, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, wash } from './kit.js';
import { drawChar } from './rig.js';
import { X, HIM, HER } from './cast.js';
import * as RM from './room.js';
import { W, H, cam, layer, layerSoft, finish, mkL } from './shots.js';
import { TL, M, kf, pk, P_, idle, talk, voice, lineT, walk, captions, EASE } from './anim.js';
import { sitO, world, toLocal, cuff, handsOn, Y_SEAT, S_BEHIND, S_SEAT, S_FRONT } from './staging.js';

const R = RM.R, TWO = Math.PI * 2;
const L0 = mkL(.62, .78, { rim: '#FFE2A8', rimA: .95, rimW: 5, shadeA: .24, shadow: { kx: .5, ky: .16, a: .26, blur: 6, col: P.plum } });
const H_ = (...o) => P_(HIM, ...o), W_ = (...o) => P_(HER, ...o);
const sm = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const io = x => EASE.io(clamp(x));
const gauss = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
// integral of a piecewise-linear frequency curve: phase in cycles at time u
function phaseOf(u, keys) { let ph = 0; const dt = 1 / 120; for (let s = 0; s < u; s += dt) ph += kf(s + dt / 2, keys) * Math.min(dt, u - s); return ph; }
// move along timed waypoints [[t, x, y, s], ...] with easing; returns { x, y, s, v (px/s), seg }
function path(t, pts) {
  if (t <= pts[0][0]) return { x: pts[0][1], y: pts[0][2], s: pts[0][3], v: 0, seg: -1 };
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) {
    const a = pts[i - 1], b = pts[i], u = (t - a[0]) / (b[0] - a[0]), e = EASE.ss(u);
    return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e), s: lerp(a[3], b[3], e), seg: i - 1, u };
  }
  const z = pts[pts.length - 1]; return { x: z[1], y: z[2], s: z[3], v: 0, seg: pts.length };
}
// walking phase from distance travelled along waypoints (feet never slide)
function stridePh(t, pts, stride) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], len = Math.hypot(b[1] - a[1], (b[2] - a[2]) * 1.6);
    if (t >= b[0]) { d += len; continue; }
    if (t > a[0]) d += len * EASE.ss((t - a[0]) / (b[0] - a[0]));
    break;
  }
  return d / stride;
}

// ===================== the people, at any time =====================
let K = null;
function keys() {
  if (K) return K;
  const h1 = lineT('h1'), w2 = lineT('w2'), h3 = lineT('h3'), w4 = lineT('w4'), h5 = lineT('h5'), h6 = lineT('h6'), h7 = lineT('h7');
  const m = M;
  m.two = +(m.lift + .12).toFixed(3);
  // her walk round the left end of the couch, then she sits on the left seat
  const w0 = m.walk0, yB = R.yBehind, yF = R.yFront;
  const herWalk = [[w0 + .15, 654, yB, S_BEHIND], [w0 + 1.8, 128, yB, S_BEHIND], [w0 + 2.55, 146, yF, S_FRONT], [w0 + 3.2, R.seatL, yF, S_FRONT], [w0 + 3.65, R.seatL, Y_SEAT, S_SEAT]];
  // his sneak: rise, three steps, caught mid-step
  const e = m.esc, g = m.grab;
  const himEsc = [[e + .35, R.seatR, Y_SEAT, S_SEAT], [e + .95, R.seatR + 14, yF, S_FRONT], [e + 1.1, R.seatR + 14, yF, S_FRONT], [e + 1.5, 694, yF, S_FRONT], [e + 2.0, 694, yF, S_FRONT], [e + 2.36, 772, yF, S_FRONT], [g, 852, yF, S_FRONT]];
  // round the right end of the couch, to stand behind her
  const r0 = m.release + .25;
  const himRound = [[r0, 852, yF, S_FRONT], [r0 + .45, 912, yF - 20, S_FRONT], [r0 + 1.15, 912, yB, S_BEHIND], [r0 + 2.05, 616, yB, S_BEHIND]];
  K = { h1, w2, h3, w4, h5, h6, h7, herWalk, himEsc, himRound, r0 };
  return K;
}

// HIM seated, relaxation r (0 day one … 1 today, a puddle)
function himSeated(t, r, o = {}) {
  const ex = r < .34 ? X.bliss : r < .67 ? X.melt : X.puddle;
  const tilt = [.07, -.1, .14, .2][Math.min(3, Math.round(r * 3))];
  const limp = sm(.45, .8, r);
  return H_(sitO(HIM, { hipY: (HIM.ul + HIM.ll) * .992 + 12 - 104 + r * 10, lL: { x: -38 - r * 22 }, lR: { x: 38 + r * 26 } }), {
    shrug: .1 - r * .55, lean: -.02 * r, head: { tilt: tilt, nod: -.05 - r * .1, oy: r * 4 }, e: ex,
    aL: limp > .5 ? { a: -.32, b: .22, hand: 'open', curl: .4 } : { to: [-24, -196], k: 1, z: 1 },
    aR: limp > .5 ? { a: .36, b: -.25, hand: 'open', curl: .4 } : { to: [26, -192], k: -1, z: 1 },
  }, o);
}

// poses are computed per sequence branch; at each branch boundary the new branch fades in over 0.3 s from the old one's last pose
const _edge = new Map();
export function stateAt(t) {
  const m = M; keys();
  const B = [m.lift + .3, m.esc, m.release + .25];
  const S = rawState(t);
  for (const b of B) if (t >= b && t < b + .3) {
    if (!_edge.has(b)) _edge.set(b, rawState(b - 1e-4));
    const A = _edge.get(b), k = EASE.io((t - b) / .3);
    for (const who of ['him', 'her']) S[who] = { ...S[who], p: mixPoseQ(S[who].ch, A[who].p, S[who].p, k) };
  }
  return S;
}
import { mixPose } from './rig.js';
const mixPoseQ = (ch, a, b, k) => mixPose(ch, a, b, k);
function rawState(t) {
  const k = keys(), m = M;
  const S = { him: null, her: null, d: 3, birdOn: true, chirp: 0, look: 0, cal: 3, calFlip: 0, dent: [0, 0] };
  // ---------- day / light ----------
  if (t < m.d2) { S.d = 0; S.cal = 0; } else if (t < m.d3) { S.d = 1; S.cal = 1; S.calFlip = clamp((t - m.d2) / .35); } else if (t < m.now) { S.d = 2; S.cal = 2; S.calFlip = clamp((t - m.d3) / .35); } else { S.d = 3; S.cal = 3; S.calFlip = clamp((t - m.now) / .35); }
  S.d += clamp((t - m.stare) / 4) * .0;  // light holds; the stare is graded in post
  // the bird: chirps in the window shot, looks around now and then
  S.chirp = Math.max(gauss(t, m.win + .38, .06), gauss(t, m.win + .66, .06), gauss(t, m.bird + 1.7, .05));
  S.look = Math.sin(t * .9) > .6 ? 1 : 0;

  // ================= HIM =================
  let hp, hx = R.seatR, hy = Y_SEAT, hs = S_SEAT, hlay = 'seat', hHands = false;
  // ================= HER =================
  let wp, wx = R.seatR, wy = R.yBehind, ws = S_BEHIND, wlay = 'behind', wHands = false;
  if (t < m.lift + .3) wx = R.seatR + 38;

  if (t < m.lift + .3) {
    // ---- the montage + today: he sits, she massages ----
    const day = t < m.d2 ? 0 : t < m.d3 ? 1 : t < m.now ? 2 : 3;
    const tt = t - [0, m.d2, m.d3, m.now][day];
    let r = [.0, .3, .62, .9][day] + Math.min(tt, 3) * .03;
    hp = himSeated(t, r);
    if (day === 3) {   // "Ahhh…": a long exhale, shoulders drop, then content eyes
      const h1 = k.h1, ex = sm(h1.t0, h1.t0 + 1.4, t);
      hp = { ...hp, shrug: hp.shrug - ex * .2, e: t > h1.t0 + 1.7 ? { ...X.content, gy: .2 } : { ...hp.e, mO: Math.max(hp.e.mO || 0, .35 * gauss(t, h1.t0 + .7, .7)) } };
    }
    hp = talk(idle(hp, t, 1, .7), 'HIM', t);
    // her: standing behind the couch, knees soft, hands on his shoulders
    const lean = [.0, .05, -.04, .07][day], nod = [.32, .4, .28, .36][day];
    wp = W_({ hipY: 45, lean, shrug: .1, head: { nod, tilt: [.1, .16, .08, .14][day] }, e: { ...X.loving, gy: .8, gx: [.1, -.2, .2, 0][day] }, lL: { x: -26 }, lR: { x: 24 } });
    wp = idle(wp, t, 2, .6);
    const f = 1.05, A = 7.5, ph = t * f * TWO;
    let lift = 0;
    if (day === 3) lift = 12 * Math.max(0, Math.sin(clamp((t - m.pat) / .25) * Math.PI)) + 12 * Math.max(0, Math.sin(clamp((t - m.pat - .27) / .25) * Math.PI));
    const kn = day === 3 && t > m.pat ? 0 : 1;
    const hand = handsOn(HER, wx, wy, ws, HIM, hp, hx, hy, hs, { inset: .14, lift: 7 + lift, out: day === 3 ? lift * .5 : 0, curl: kn * (.3 + .25 * Math.sin(ph * 2)), knead: { l: [Math.sin(ph) * A * kn, Math.cos(ph) * A * .5 * kn], r: [Math.sin(ph + 2.2) * A * kn, Math.cos(ph + 2.2) * A * .5 * kn] } });
    // receiver follows the hands a little
    hp = { ...hp, shrug: hp.shrug + Math.sin(ph) * .04 * kn };
    wp = { ...wp, aL: hand.aL, aR: hand.aR, e: day === 3 && t > m.pat ? { ...X.sweet, gy: .7 } : wp.e };
    wHands = t < m.lift + .12;
    if (t > m.lift) wp = pk(HER, t, [[m.lift, wp], [m.lift + .3, W_({ hipY: 10, shrug: .1, head: { nod: .2 }, e: { ...X.sweet, gy: .5 }, aL: { a: -.55, b: -.7, hand: 'open', z: 1 }, aR: { a: .55, b: .7, hand: 'open', z: 1 } })]]);
  } else if (t < m.esc) {
    // ---- she walks round and sits; the request; his face falls; the bird ----
    const w = path(t, k.herWalk), seg = w.seg; wx = w.x; wy = w.y; ws = w.s;
    const sitK = clamp((t - (M.walk0 + 3.2)) / .45);
    const stand = W_({ face: seg <= 0 ? -.8 : seg === 1 ? lerp(-.8, .1, w.u ?? 1) : .5, e: { ...X.sweet, gx: seg <= 0 ? -.6 : .5 } });
    const wk = seg >= 0 && seg <= 2 ? walk(stridePh(t, k.herWalk, 104), seg === 1 ? 1 : seg === 0 ? -1 : 1, { stride: seg === 1 ? 10 : 30, lift: 14 }) : {};
    const sat = W_(sitO(HER), { face: .42, head: { turn: .12, tilt: .06 }, e: { ...X.sweet, gx: .7 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [34, -166], k: -1, z: 1 } });
    wp = sitK > 0 ? pk(HER, t, [[M.walk0 + 3.2, { ...stand, ...wk, face: .5 }], [M.walk0 + 3.65, sat]]) : { ...stand, ...wk };
    if (t > M.walk0 + 3.65) {
      const w2 = k.w2, hey = w2.t0 + 2.2;
      wp = pk(HER, t, [[M.walk0 + 3.65, sat], [hey - .1, sat], [hey + .15, W_(sitO(HER), { face: .45, lean: .03, head: { turn: .16, tilt: .1, nod: -.05 }, e: { ...X.hopeful, gx: .75 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [34, -166], k: -1, z: 1 } })],
        [m.bird + .55, W_(sitO(HER), { face: .45, lean: .03, head: { turn: .16, tilt: .1, nod: -.05 }, e: { ...X.hopeful, gx: .75 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [34, -166], k: -1, z: 1 } })],
        [m.bird + .85, W_(sitO(HER), { face: .1, head: { turn: -1.1, tilt: -.14, nod: -.25 }, e: { ...X.curious, gx: -.9, gy: -.7 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [34, -166], k: -1, z: 1 } }), 'o']]);
    }
    if (sitK > .9) wlay = 'seat'; else if (wy < 1350) wlay = 'behind'; else wlay = 'front';
    wp = talk(idle(wp, t, 2, .7), 'HER', t);
    // him: watches her go round, content; then the request lands
    const s0 = himSeated(t, .955), sit = { ...s0, shrug: s0.shrug - .2, e: { ...X.content, gy: .2 } };
    const watch = H_(sitO(HIM, { lL: { x: -50 }, lR: { x: 54 } }), { face: -.18, shrug: -.2, head: { turn: -.18, tilt: .05 }, e: { ...X.content, gx: -.6 }, aL: { a: -.3, b: .2, hand: 'open', curl: .4 }, aR: { a: .34, b: -.22, hand: 'open', curl: .4 } });
    const fr = m.freeze, ali = { ...watch, sq: -.12, shrug: .25, head: { turn: -.18, tilt: 0 }, e: { ...X.alarm, gx: -.55 } };
    const frz = { ...watch, shrug: .35, head: { turn: -.16, tilt: 0 }, e: { ...X.frozen, gx: -.55 } };
    const eyesHer = { ...frz, e: { ...X.frozen, gx: -.85, gy: .05 } };
    const eyesWin = { ...frz, head: { turn: -.5, tilt: -.08, nod: -.15 }, e: { ...X.frozen, gx: -1, gy: -.75 } };
    const idea = { ...frz, shrug: .1, head: { turn: -.3, tilt: .04, nod: -.08 }, e: { ...X.idea, gx: -.6, gy: -.3 } };
    const pointA = { a: -2.05, b: .1, hand: 'point', z: 1 };
    const point = { ...watch, face: -.25, lean: -.06, shrug: .2, sq: .08, head: { turn: -.25, tilt: -.05, nod: -.1 }, e: { ...X.liar, gx: -.9, gy: -.5 }, aL: pointA, aR: { a: .5, b: -.6, hand: 'open', z: 1 } };
    const point2 = { ...point, sq: 0, lean: -.09, e: { ...X.liar, gx: -.9, gy: -.6, mS: .6 }, aL: { a: -2.15, b: .06, hand: 'point', z: 1 } };
    hp = pk(HIM, t, [[m.lift + .3, sit], [m.lift + .8, watch], [fr, watch], [fr + .16, ali, 'back'], [fr + .45, frz], [m.cu + .4, frz], [m.cu + .62, eyesHer, 'o'], [m.cu + .9, eyesHer], [m.cu + 1.05, { ...eyesHer, e: { ...eyesHer.e, gx: -1, gy: -.75 } }, 'o'], [m.cu + 1.15, eyesWin], [m.cu + 1.3, eyesWin], [m.cu + 1.45, idea, 'back'], [m.bird, idea], [m.bird + .14, point, 'back'], [m.bird + .3, point2], [m.esc, point2]]);
    hp = talk(idle(hp, t, 1, t > fr ? .25 : .7), 'HIM', t);
  } else if (t < M.release + .25) {
    // ---- the sneak, the catch, the excuses ----
    const ps = path(t, k.himEsc); hx = ps.x; hy = ps.y; hs = ps.s;
    const e = m.esc, g = m.grab;
    const sitP = H_(sitO(HIM, { lL: { x: -50 }, lR: { x: 54 } }), { face: -.2, lean: -.06, shrug: .2, head: { turn: -.25, tilt: -.05 }, e: { ...X.liar, gx: -.9, gy: -.6 }, aL: { a: -2.15, b: .06, hand: 'point', z: 1 }, aR: { a: .5, b: -.6, hand: 'open', z: 1 } });
    const lean = H_(sitO(HIM, { lL: { x: -40 }, lR: { x: 46 } }), { face: .3, lean: .1, shrug: .5, head: { turn: -.1, nod: .2 }, e: { ...X.sneak, gx: .5 }, aL: { a: -.5, b: -.6, hand: 'open', z: 1 }, aR: { to: [60, -250], k: -1, z: 1, hand: 'open' } });
    const sneakArms = { aL: { a: -.75, b: -.55, hand: 'open', z: 1 }, aR: { to: [84, -292], k: -1, z: 1, hand: 'open', curl: .4 } };
    const crouch = H_({ face: .72, lean: .12, hipY: 30, shrug: .55, head: { tilt: -.04, nod: .1 }, e: { ...X.sneak, gx: .6 }, ...sneakArms, lL: { x: -30 }, lR: { x: 26 } });
    const look = { ...crouch, head: { turn: -1.55, tilt: .06, nod: .05 }, e: { ...X.sly, gx: -.9 } };
    const go = { ...crouch, lean: .16, e: { ...X.sly, gx: .6, mS: 1 } };
    // the moment of the catch: back arm trailing, front foot in the air
    const atGrab = { ...go, hipY: 20, lean: .2, aL: { a: -1.05, b: -.3, hand: 'open', z: 1 }, lL: { x: -40, y: 0 }, lR: { x: 46, y: -36, r: -.3 } };
    const stopped = { ...atGrab, lean: .06, sq: -.06, shrug: .9, e: { ...X.caught, gx: .5 } };
    let base = pk(HIM, t, [[e, sitP], [e + .35, lean], [e + .95, crouch], [e + 1.5, crouch], [e + 1.58, look, 'o'], [e + 1.92, look], [e + 2.02, go], [g - .12, go], [g, atGrab, 'lin'], [g + .12, stopped, 'back']]);
    // tiptoe legs while moving
    const moving = (t > e + 1.1 && t < e + 1.5) || (t > e + 2.0 && t < g);
    if (moving) { const wk = walk(stridePh(t, k.himEsc, 120), 1, { stride: 34, lift: 28, hipY: 0 }); base = { ...base, lL: wk.lL, lR: wk.lR, hipY: base.hipY + wk.hipY * .6 }; }
    // the grip: where her hand holds his cuff (fixed once caught)
    const G = gripPoint();
    if (t >= g) {
      const turnHead = sm(m.excuse + .05, m.excuse + .5, t), turnBody = sm(m.excuse + .5, m.excuse + .9, t);
      const tug = t < m.hey ? Math.sin((t - g) * 38) * 3 * Math.exp(-(t - g) * 3) : 0;
      const handT = toLocal([G[0] - 16 + tug, G[1] + 5], hx, hy, hs);
      base = { ...base, aL: { to: handT, k: 1, z: 1, hand: 'open', curl: .2 } };
      if (t > m.excuse) {
        const h5 = k.h5, h6 = k.h6, laugh = (gauss(t, h5.t0 + 1.0, .3) + gauss(t, h5.t0 + 3.15, .25)) * Math.max(0, Math.sin(t * 22));
        const awk = { ...stopped, face: lerp(.72, -.42, turnBody), lean: lerp(.06, -.04, turnBody), hipY: lerp(20, 4, turnBody), sq: 0, shrug: .6 + laugh * .35,
          head: { turn: lerp(0, -1.05, turnHead) * (1 - turnBody) + 0, tilt: .05, nod: -.05 }, e: { ...X.awkward, gx: -.8 },
          lR: { x: lerp(46, 30, turnBody), y: lerp(-36, 0, sm(m.excuse + .5, m.excuse + .75, t)), r: 0 }, lL: { x: -30, y: 0 } };
        const chillArm = { to: [118 + Math.sin(t * 7) * 12 * sm(h5.t0, h5.t0 + .3, t) * (1 - sm(h5.t1 - .5, h5.t1, t)), -262], k: -1, z: 1, hand: 'open', thumb: -1 };
        const comeArm = { to: [-34, -250], k: -1, z: 1, hand: 'open', thumb: -1 };
        let p2 = { ...awk, aR: t < h6.t0 ? chillArm : comeArm, e: t < h6.t0 - .1 ? { ...X.awkward, gx: -.8 } : { ...X.beam, gx: -.8, gy: .3 } };
        if (t > h6.t0 - .3 && t < h6.t0 + .25) p2 = pk(HIM, t, [[h6.t0 - .3, { ...awk, aR: chillArm }], [h6.t0 + .25, { ...awk, aR: comeArm, e: { ...X.beam, gx: -.8, gy: .3 } }]]);
        base = { ...p2, aL: base.aL };
        if (t > m.release) base = { ...base, aL: pk(HIM, t, [[m.release, base], [m.release + .3, { ...base, aL: { a: -.2, b: .2, hand: 'open', z: 1 } }]]).aL };
      }
    }
    hp = talk(idle(base, t, 1, .4), 'HIM', t);
    hlay = hy > 1350 ? (t < e + .9 ? 'seat' : 'front') : 'seat';
    // her: looking at the window, then back — and the lunge
    wx = R.seatL; wy = Y_SEAT; ws = S_SEAT; wlay = 'seat';
    const winLook = W_(sitO(HER), { face: .1, head: { turn: -1.1, tilt: -.14, nod: -.25 }, e: { ...X.curious, gx: -.9, gy: -.7 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [34, -166], k: -1, z: 1 } });
    const eyesBack = { ...winLook, e: { ...X.suspicious, gx: .2, gy: -.1 } };
    const back = W_(sitO(HER), { face: .35, head: { turn: .3, tilt: .04 }, e: { ...X.suspicious, gx: .9 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [40, -200], k: -1, z: 1 } });
    const slide = sm(g - .32, g - .02, t), sx = lerp(R.seatL, 540, slide); wx = sx;
    let wb = pk(HER, t, [[e, winLook], [g - .5, winLook], [g - .4, eyesBack, 'o'], [g - .3, back, 'o']]);
    wb = { ...wb, lean: slide * .3, hipY: wb.hipY - slide * 6, face: lerp(wb.face, .55, slide), e: t > g ? { ...X.firm, gx: .9, gy: -.15 } : wb.e };
    if (t > g - .32) {
      const k2 = clamp((t - (g - .32)) / .3), Jw = world(HER, { ...wb, aR: { a: 1, b: 0 } }, wx, wy, ws), sh = Jw.sh[1];
      const tgt = [lerp(sh[0] + 40, G[0], EASE.o(k2)), lerp(sh[1] + 40, G[1], EASE.o(k2))], dd = Math.hypot(tgt[0] - sh[0], tgt[1] - sh[1]) / ws;
      wb = { ...wb, aR: { to: toLocal(tgt, wx, wy, ws), k: 1, z: 1, l: Math.max(1, dd / ((HER.ua + HER.fa) * .97)), hand: t >= g ? 'fist' : 'open' } };
    }
    if (t > m.excuse) wb = { ...wb, e: { ...X.suspicious, gx: .85, gy: -.25 } };
    if (t > m.release) {   // she lets go, settles back, slides to the right seat
      const rel = sm(m.release, m.release + .35, t);
      const sat = W_(sitO(HER), { face: .3, head: { turn: .2 }, e: { ...X.suspicious, gx: .8, gy: -.3 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [34, -166], k: -1, z: 1 } });
      wb = pk(HER, t, [[m.release, wb], [m.release + .35, { ...sat, lean: .1 }]]);
    }
    wp = talk(idle(wb, t, 2, .5), 'HER', t);
  } else {
    // ---- he goes round behind her; ten seconds; the flex; her face ----
    const r0 = k.r0, rr0 = m.rub0, rr1 = m.rub1;
    // her: slides across to the right seat, watches him suspiciously, faces front, waits
    const slide = sm(r0 + .1, r0 + .8, t); wx = lerp(540, R.seatR, slide); wy = Y_SEAT; ws = S_SEAT; wlay = 'seat';
    const hxNow = path(t, k.himRound).x;
    const watching = W_(sitO(HER), { face: lerp(.3, .1, slide), head: { turn: clamp((hxNow - wx) / 300, -1, 1) * .55, tilt: .03 }, e: { ...X.suspicious, gx: clamp((hxNow - wx) / 200, -1, 1), gy: -.3 }, aL: { to: [6, -168], k: 1, z: 1 }, aR: { to: [34, -166], k: -1, z: 1 } });
    const front = W_(sitO(HER), { face: 0, shrug: .05, head: { turn: 0, tilt: 0 }, e: { ...X.flat, gy: .1 }, aL: { to: [-16, -166], k: 1, z: 1 }, aR: { to: [18, -166], k: -1, z: 1 } });
    const u = t - rr0, kn = clamp(u / .4) * (1 - clamp((t - rr1) / .05));
    const sink = sm(rr0 + 3, rr0 + 10, t);
    const relaxed = { ...front, shrug: -.1 - sink * .2, head: { turn: 0, tilt: .04 + sink * .08, nod: .05 }, e: sink > .25 ? X.sinking : X.relaxed };
    let wb = pk(HER, t, [[r0, watching], [r0 + 1.9, watching], [r0 + 2.2, front], [rr0 + .7, front], [rr0 + 1.0, relaxed]]);
    if (t < r0 + 1.9) wb = watching;
    // the stare
    const st = m.stare;
    if (t > st) {
      const open = { ...relaxed, e: { ...X.waking, gy: .1 } };
      const turned = { ...relaxed, head: { turn: .5, tilt: -.1, nod: -.12 }, e: { ...X.flat, gx: .85, gy: -.75 } };
      const brow = { ...turned, e: { ...X.disbelief, gx: .85, gy: -.75 } };
      const hands = { ...brow, head: { turn: .44, tilt: -.14, nod: -.22 }, e: { ...X.disbelief, gx: .55, gy: -1 } };
      const face = { ...brow, head: { turn: .5, tilt: -.08, nod: -.12 }, e: { ...X.unimpressed, gx: .85, gy: -.72 } };
      const mouth = { ...face, e: { ...X.unimpressed, mO: .22, mW: .36, gx: .85, gy: -.72 } };
      wb = pk(HER, t, [[st + .15, relaxed], [st + .5, open], [st + .75, open], [st + 1.35, turned], [st + 1.55, turned], [st + 1.9, brow], [st + 2.0, brow], [st + 2.2, hands], [st + 2.45, hands], [st + 2.65, face], [st + 2.75, face], [st + 2.95, mouth]]);
    }
    wp = idle(wb, t, 2, t > st + 2 ? .25 : .5);
    // him
    const pts = k.himRound, ps = path(t, pts); hx = ps.x; hy = ps.y; hs = ps.s;
    const moving = t > r0 && t < pts[pts.length - 1][0];
    const awayLeg = ps.seg === 1;   // walking away from camera, round the end of the couch
    const stand = H_({ face: ps.seg === 0 ? .7 : ps.seg === 1 ? .0 : -.75, head: { back: awayLeg ? 1 : 0 }, shrug: .3, e: { ...X.beam, gx: -.4 }, aL: { a: -.2, b: .2, hand: 'open' }, aR: { a: .2, b: -.2, hand: 'open' } });
    let hb = stand;
    if (moving) { const wk = walk(stridePh(t, pts, 112), ps.seg === 2 ? -1 : 1, { stride: ps.seg === 1 ? 12 : 32, lift: 15 }); hb = { ...stand, ...wk, aL: { ...wk.aL, hand: 'open' }, aR: { ...wk.aR, hand: 'open' } }; }
    const ready = H_({ face: 0, hipY: 45, shrug: .2, head: { tilt: 0, nod: .2 }, e: { ...X.pumped, gy: .6 }, aL: { a: -.5, b: -.4, hand: 'open', z: 1 }, aR: { a: .5, b: .4, hand: 'open', z: 1 } });
    if (t >= pts[pts.length - 1][0]) {
      const roll = m.roll, rp = clamp((t - roll) / .52), rollA = Math.sin(rp * TWO * 2) * (1 - rp);
      hb = pk(HIM, t, [[pts[pts.length - 1][0], { ...stand, face: -.75 }], [pts[pts.length - 1][0] + .3, ready]]);
      hb = { ...hb, shrug: hb.shrug + rollA * .8, head: { ...hb.head, tilt: rollA * .08 } };
    }
    // hands land, ten seconds of effort, hands lift
    if (t > rr0 - .32) {
      const phase = phaseOf(Math.max(0, u), [[0, 2.3], [2, 2.1], [4, 1.6], [6, 1.05], [8, .7], [10, .6]]) * TWO;
      const A = kf(u, [[0, 9.5], [2, 9.5], [4, 8], [5, 6], [6, 4.5], [7, 3], [8, 2], [10, 1.4]]);
      const sq = gauss(u, 8.55, .12) + gauss(u, 9.35, .12);   // two tiny final squeezes
      const curl = .22 + .22 * Math.sin(phase * 2) * A / 9.5 + sq * .65;
      const exP = u < 2 ? X.eager : u < 4 ? X.pumped : u < 6 ? X.bored : X.done;
      const gaze = kf(u, [[0, 0], [4, 0], [4.6, .75], [5.8, .75], [6.4, .1], [10, .1]]), up = kf(u, [[0, .6], [4, .6], [4.6, -.2], [6, -.2], [6.6, -.7], [7.8, -.7], [8.3, .55], [10, .55]]);
      const workP = { ...ready, shrug: .1 + Math.sin(phase) * .05 * A / 9.5, head: { tilt: kf(u, [[0, .02], [4, .02], [5, -.1], [7, .1], [9, .04]]), nod: kf(u, [[0, .25], [4, .2], [5, 0], [7, -.15], [8.3, .2]]), turn: gaze * .25 },
        hipY: 45 + kf(u, [[0, 0], [5, 0], [8, 6]]), e: { ...exP, gx: gaze, gy: up, mO: (exP.mO || 0) + (u > 6.4 && u < 7.4 ? .35 * gauss(u, 6.9, .3) : 0) } };
      const land = clamp((t - (rr0 - .32 + 1 / 60)) / .32), off = clamp((t - rr1) / .3);   // contact exactly from frame rub0 to rub1
      const recv = { ...wp, shrug: wp.shrug + Math.sin(phase + .6) * .035 * A / 9.5 * kn + sq * .05 };
      wp = recv;
      const on = handsOn(HIM, hx, hy, hs, HER, recv, wx, wy, ws, { inset: .1, lift: 6 + sq * -3 + (1 - land) * 80 + Math.pow(off, .8) * 70, out: (1 - land) * 30 + Math.pow(off, .8) * 46, curl: off > 0 ? .1 : curl,
        knead: { l: [Math.sin(phase) * A * .55 * kn, Math.cos(phase) * A * .45 * kn + sq * 3], r: [Math.sin(phase + 2.6) * A * .55 * kn, Math.cos(phase + 2.6) * A * .45 * kn + sq * 3] } });
      const tgtP = { ...workP, aL: on.aL, aR: on.aR };
      hb = land < 1 ? mixPose(HIM, hb, tgtP, EASE.io(land)) : tgtP;
      hHands = t < rr1 + .2;
      if (t > rr1 + .2) {
        // step back, stand tall, double-biceps flex, grin; hold it through the stare
        const sb = clamp((t - m.step) / .45); hy = lerp(R.yBehind, R.yBehind - 30, EASE.io(sb)); hs = lerp(S_BEHIND, S_BEHIND - .02, sb);
        const offArms = { ...workP, e: { ...X.content, gy: .4 }, aL: { a: -.45, b: -.3, hand: 'open', z: 1 }, aR: { a: .45, b: .3, hand: 'open', z: 1 } };
        const tall = { ...offArms, hipY: 0, shrug: -.1, head: { tilt: 0, nod: -.05, turn: 0 }, e: { ...X.beam, gy: .4 } };
        const flexA = { a: -1.62, b: -1.5, hand: 'fist', z: 1 }, flexB = { a: 1.62, b: 1.5, hand: 'fist', z: 1 };
        const flex = { ...tall, shrug: .55, sq: .05, head: { tilt: -.05, nod: -.1 }, e: { ...X.proud }, aL: flexA, aR: flexB };
        const pump = { ...flex, aL: { ...flexA, b: -1.85 }, aR: { ...flexB, b: 1.85 }, sq: .08 };
        const h7 = k.h7, cool = h7.t0 + 2.5;
        const wait = { ...flex, e: { ...X.waiting }, head: { tilt: .04, nod: .05 } };
        hb = pk(HIM, t, [[rr1 + .2, { ...workP, aL: { a: -.45, b: -.3, hand: 'open', z: 1 }, aR: { a: .45, b: .3, hand: 'open', z: 1 } }], [m.step + .45, tall], [m.flex, tall], [m.flex + .32, flex, 'back'], [h7.t0 + 1.5, flex], [h7.t0 + 1.68, pump], [h7.t0 + 1.9, flex], [cool - .1, flex], [cool + .15, wait], [m.end, wait]]);
        hHands = false;
      }
    }
    hp = talk(idle(hb, t, 1, t > m.stare ? .15 : .5), 'HIM', t);
    hlay = hy > 1350 ? 'front' : 'behind';
  }
  S.him = { ch: HIM, p: hp, x: hx, y: hy, s: hs, lay: hlay, hands: hHands };
  S.her = { ch: HER, p: wp, x: wx, y: wy, s: ws, lay: wlay, hands: wHands, armOver: t > m.grab - .1 && t < m.release + .3 };
  return S;
}
// the point where her hand closes on his hoodie cuff (his pose at the instant of the catch)
let _G = null;
function gripPoint() {
  if (_G) return _G;
  const k = keys(), g = M.grab, ps = path(g, k.himEsc);
  const p = H_({ face: .72, lean: .2, hipY: 20, shrug: .55, aL: { a: -1.05, b: -.3 }, aR: { to: [84, -292], k: -1 }, lL: { x: -40 }, lR: { x: 46, y: -36 } });
  _G = cuff(HIM, p, ps.x, ps.y, ps.s, 'aL', .84); return _G;
}

// ===================== the world, drawn =====================
function drawPerson(g, Q, only, L, opt = {}) { drawChar(g, Q.ch, { ...Q.p, x: Q.x, y: Q.y, s: Q.s }, L, { only, ...opt }); }
function scene(g, t, S, { people = true, peopleOnly = false, noFg = false, par = 0 } = {}) {
  const D = RM.day(S.d), L = L0;
  if (!peopleOnly) { RM.roomBack(g, t, S.d, { birdOn: S.birdOn, chirp: S.chirp, look: S.look, cal: S.cal, calFlip: S.calFlip }); RM.plant(g, t, 30, 1330); }
  const ppl = [S.him, S.her], by = lay => ppl.filter(q => q.lay === lay);
  if (people) for (const q of by('behind')) drawPerson(g, q, q.hands ? [0, 1, 2] : [0, 1, 2, 3], L, { noShadow: true });
  if (!peopleOnly) { RM.couchBack(g, t, D); RM.couchFront(g, t, D, { dentL: by('seat').some(q => q.x < 500) ? 1 : 0, dentR: by('seat').some(q => q.x >= 500) ? 1 : 0 }); }
  if (people) {
    for (const q of by('seat')) drawPerson(g, q, [0, 1], L, { noShadow: true });
    for (const q of by('behind')) if (q.hands) drawPerson(g, q, [3], L, { noShadow: true });
    for (const q of by('seat')) drawPerson(g, q, [2, 3], L, { noShadow: true });
    for (const q of by('front')) drawPerson(g, q, null, L);
    for (const q of by('seat')) if (q.armOver) drawPerson(g, q, [3], L, { noShadow: true });
  }
  if (!peopleOnly && !noFg) { g.save(); g.translate(par, 0); RM.coffeeTable(g, t, D); g.restore(); RM.air(g, t, D); }
  return D;
}
const headOf = (Q) => world(Q.ch, Q.p, Q.x, Q.y, Q.s).head;
const zoomAt = (px, py, z) => ({ x: px - (px - 540) / z, y: py - (py - 960) / z, z });

// ===================== shots =====================
export function shotAt(t) {
  const m = M; keys();
  const order = [['d1', 0], ['d2', m.d2], ['d3', m.d3], ['now', m.now], ['two', m.two], ['ots', m.ots], ['cu', m.cu], ['bird', m.bird], ['win', m.win], ['esc', m.esc], ['cuff', m.cuff], ['hey', m.hey], ['excuse', m.excuse], ['roll', m.roll], ['step', m.step], ['black', m.black]];
  let id = 'd1', t0 = 0; for (const [k, v] of order) if (t >= v) { id = k; t0 = v; }
  return { id, t0 };
}

function title(ctx, t) {
  const k = kf(t, [[.25, 0], [.62, 1, 'back'], [3.2, 1], [3.55, 0, 'i']]);
  if (k < .02) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.5); ctx.translate(540, 300 - (1 - k) * 30); ctx.rotate(-.03); const s = .9 + .1 * k; ctx.scale(s, s);
  for (const [str, size, yy, col] of [['THE', 64, -112, P.cream], ['10-SECOND', 150, 0, P.sun], ['MASSAGE', 132, 128, P.cream]]) {
    text(ctx, str, 8, yy + 10, { size, col: rgba(P.indigo, .85) }); text(ctx, str, 0, yy, { size, col, stroke: P.indigo, sw: 15 }); text(ctx, str, 0, yy, { size, col });
  }
  fillRR(ctx, -210, 206, 420, 12, 6, P.orange); ctx.restore();
}

export function renderFilm(ctx, t) {
  const m = M, S = stateAt(t), { id, t0 } = shotAt(t), u = t - t0;
  if (id === 'black') { ctx.fillStyle = '#0E0C16'; ctx.fillRect(0, 0, W, H); return; }
  let c, grade = null, post = { vig: .48, bl: .18 };
  const hh = headOf(S.him), wh = headOf(S.her);
  switch (id) {
    case 'd1': c = zoomAt(610, 1080, kf(t, [[0, 1.3], [m.d2, 1.52, 'lin']])); break;
    case 'd2': c = { x: 640 + u * 3, y: 1010, z: 2.08 }; break;
    case 'd3': c = { x: 636 - u * 3, y: 1012, z: 2.12 }; break;
    case 'now': c = { x: 640, y: 1010 - u * 4, z: 2.08 + u * .03 }; break;
    case 'two': c = { x: 470, y: 1110, z: 1.3 }; break;
    case 'ots': { const z = 2.15 + u * .04; c = { x: hh[0] - 40, y: hh[1] + 120, z }; break; }
    case 'cu': { const z = kf(u, [[0, 3.0], [m.bird - m.cu, 3.45, 'lin']]); c = { x: hh[0] - 18, y: hh[1] + 34, z }; break; }
    case 'bird': c = { x: 560, y: 1000, z: 2.2 }; break;
    case 'win': { const k = io(u / 1.0); c = { x: lerp(wh[0] + 10, R.bird.x + 10, k), y: lerp(wh[1] - 120, R.bird.y + 20, k), z: lerp(2.6, 4.2, k) }; break; }
    case 'esc': c = { x: lerp(610, 700, io(u / 3.2)), y: 1140, z: 1.24 }; break;
    case 'cuff': { const G = gripPoint(); c = { x: G[0] - 20, y: G[1] - 10, z: 4.4 }; break; }
    case 'hey': c = { x: wh[0] + 60, y: wh[1] + 140, z: 2.15 }; break;
    case 'excuse': { const k = sm(M.release + .3, M.roll, t); c = { x: lerp(700, 640, k), y: lerp(1120, 1080, k), z: lerp(1.46, 1.55, k) }; break; }
    case 'roll': c = { x: 616, y: 1000 + Math.sin(u * .3) * 2, z: 2.2 }; break;
    case 'step': {
      const k = EASE.io(clamp((t - m.stare - .35) / 2.7));
      c = { x: 616, y: lerp(960, 975, k), z: lerp(1.9, 3.3, k) };
      grade = ['#8C7FB0', .12 * clamp((t - m.stare) / 2), 'multiply'];
      break;
    }
  }
  const par = -(c.x - 540) * .22;
  if (id === 'ots') {
    cam(ctx, c, () => scene(ctx, t, { ...S, her: { ...S.her, lay: 'hidden' } }, { par }));
    // her shoulder and ponytail, out of focus in the foreground
    layerSoft(ctx, 'fg', g => { const q = S.her; drawChar(g, HER, { ...q.p, face: .85, head: { ...q.p.head, turn: .25, tilt: .06 }, x: 120, y: 2380, s: 2.5 }, L0, { noShadow: true, tint: [P.plum, .2] }); }, 12);
  } else if (id === 'win') {
    // rack focus: from her turning head to the ordinary little bird
    const k = io((u - .15) / .55);
    layer(ctx, 'bg', g => cam(g, c, () => scene(g, t, { ...S, him: { ...S.him, lay: 'hidden' }, her: { ...S.her, lay: 'hidden' } }, { noFg: true })), 10 * (1 - k));
    layer(ctx, 'ppl', g => cam(g, c, () => scene(g, t, S, { peopleOnly: true })), 1 + 13 * k);
  } else {
    cam(ctx, c, () => scene(ctx, t, S, { par }));
  }
  // the light of each new day arrives as a warm flash
  const fl = Math.max(0, ...[m.d2, m.d3, m.now].map(x => t >= x ? Math.exp(-(t - x) * 9) : 0));
  if (fl > .01) wash(ctx, W, H, '#FFF1CF', fl * .55, 'screen');
  finish(ctx, { ...post, grade: grade || ['#FFC27A', .08 + .04 * S.d, 'soft-light'] });
  if (t < m.d2) title(ctx, t);
  captions(ctx, t, 1530, 58);
  // fade to the cut-to-black edge: none — the cut is hard
}
