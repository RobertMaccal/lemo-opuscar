// The single timeline: every line, cut, caption and sound cue. build(VO) → { DUR, L (lines), M (marks), EV (sound events) }
export const TEXT = {
  a1: ['Yo bro, did you study for the exam?', 'Yo bro, did you study for the *exam?*'],
  b2: ['What exam?', 'What *exam?*'],
  b3: ['I was doing the assignment.', 'What exam? I was doing the *assignment.*'],
  a4: ['Huh? What assignment?', 'Huh? What *assignment?*'],
};
export const LEN = 15.0;
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
  // ---- 6. cut to black, and it's over ----
  M.black = LEN - .6;
  M.end = LEN;
  return { DUR: LEN, L, M, EV };
}
