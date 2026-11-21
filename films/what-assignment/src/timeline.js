// The single timeline: every line, cut, caption and sound cue. build(VO) → { DUR, L (lines), M (marks), EV (sound events) }
export const TEXT = {
  a1: ['Yo bro, did you study for the exam?', 'Yo bro, did you study for the *exam?*'],
  b2: ['What exam?', 'What *exam?*'],
  b3: ['I was doing the assignment.', 'What exam? I was doing the *assignment.*'],
  a4: ['Huh? What assignment?', 'Huh? What *assignment?*'],
};
export const LEN = 15.0;
// the bones: shared by the picture (skeleton.js) and, through window.EV, the mixer
export const BONE = { g: 5200, rest: .3, floor: 1428 };
const fr = k => { const x = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
export function boneSpec(c, i) {
  const h = j => fr(c * 97 + i * 13 + j * 5.3), skull = i === 16, jaw = i === 15;
  return {
    delay: skull ? .1 + c * .06 : jaw ? .05 : h(1) * .09 + (i < 8 ? 0 : .03),
    v0: skull ? -380 - c * 60 : jaw ? -160 : -h(2) * 120,
    vx: skull ? 26 : 30 + h(3) * 140, w: skull ? 0 : (h(4) - .5) * 15, depth: skull ? 34 : h(5) * 46, roll: skull ? 120 + c * 50 : jaw ? 40 : 0,
  };
}
export function build(VO) {
  const D = id => VO[id].dur, L = [], M = {}, EV = [];
  let c = 0;
  const say = (id, who, gap = .2, o = {}) => { const t0 = c + gap; L.push({ id, who, t0, t1: t0 + D(id), text: TEXT[id][0], capText: o.cap !== true ? null : (TEXT[id][1] || TEXT[id][0]), think: false, env: VO[id].env }); c = t0 + D(id); return t0; };
  const wait = d => (c += d), mark = n => (M[n] = c), ev = (type, o = {}, dt = 0) => EV.push({ t: +(c + dt).toFixed(3), type, ...o });
  // ---- 1. two-shot: the question ----
  mark('s1'); ev('musicIn'); say('a1', 'RAY', .4);
  // ---- 2. Kai: "What exam?" ... "I was doing the assignment." ----
  wait(.2); mark('s2'); say('b2', 'KAI', .14); wait(.12); mark('b3pre'); say('b3', 'KAI', .26);
  // ---- 3. Ray close-up: "Huh? What assignment?" ----
  wait(.1); mark('s3'); say('a4', 'RAY', .12);
  M.musicCut = L[L.length - 1].t0 + .78;                 // the music dies on "What"
  EV.push({ t: +M.musicCut.toFixed(3), type: 'musicCut' });
  // ---- 4. two-shot, frozen. Silence. ----
  wait(.12); mark('s4'); wait(.7);
  // ---- 5. eyes, then heads, to camera. Lacrimosa. ----
  mark('eyes'); wait(.42); mark('heads'); ev('turn'); wait(.3); mark('hit'); ev('lacrimosa');
  // ---- 5b. x-ray flicker into skeletons; the stare; a rattle; they crumble ----
  M.skel = M.hit + .4; EV.push({ t: +M.hit.toFixed(3), type: 'xray' });
  M.rattle = M.hit + 2.45; EV.push({ t: +M.rattle.toFixed(3), type: 'rattle' });
  M.crumble = M.hit + 2.75;
  // ---- 6. cut to black, and it's over ----
  M.black = LEN - .6;   // the pile holds a beat, then black
  M.end = LEN;
  return { DUR: LEN, L, M, EV };
}
