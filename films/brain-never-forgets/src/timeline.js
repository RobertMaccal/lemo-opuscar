// The single timeline: every line, cut, action and sound cue. build(VO) → { DUR, L (lines), M (marks), EV (sound events), CUTS }
export const TEXT = {
  c01: ['Hey, how was the exam?'],
  s02: ['Easy, bro. Piece of cake.', 'Easy, bro. *Piece of cake.*'],
  b03: ['Hey... you sleeping?'],
  s04: ["Yeah... I'm sleeping."],
  b05: ["The correct answer wasn't hypotension...", "The correct answer wasn't *hypotension...*"],
  b06: ['...it was dyspnea.', '...it was *dyspnea.*'],
};
// shot cuts, in order (a caption never crosses a sequence boundary: SEQ)
export const SHOTS = ['exam', 'exWide', 'busExt', 'busIn', 'busCu', 'bath', 'glass', 'bed', 'sleep', 'mind', 'face', 'mind2', 'twitch', 'mind3', 'flash', 'final', 'black'];
export const SEQ = ['exam', 'busExt', 'bath', 'sleep', 'mind', 'face', 'mind2', 'flash', 'black'];
export function build(VO) {
  const D = id => VO[id].dur, L = [], M = {}, EV = [];
  let c = 0;
  const say = (id, who, gap = .2, o = {}) => { const t0 = c + gap; L.push({ id, who, t0: +t0.toFixed(3), t1: +(t0 + D(id)).toFixed(3), text: TEXT[id][0], capText: o.cap === false ? null : (TEXT[id][1] || TEXT[id][0]), think: !!o.think, env: VO[id].env }); c = t0 + D(id); return t0; };
  const wait = d => (c += d), mark = n => (M[n] = +c.toFixed(3)), at = (n, dt) => (M[n] = +(c + dt).toFixed(3)), ev = (type, o = {}, dt = 0) => EV.push({ t: +(c + dt).toFixed(3), type, ...o });
  // ---- 1. the exam is finished ----
  mark('exam'); at('dot', 1.9); at('bell', 1.95);
  wait(2.7); mark('exWide');
  at('penDown', .35); at('stretch', .6); at('proud', 1.45); at('profIn', 1.5); at('lift', 2.25); at('grip', 2.8); at('handoff', 3.1); at('profOut', 3.35); at('lean', 3.75);
  wait(5.9);
  // ---- 2. the bus ----
  mark('busExt'); wait(2.5);
  mark('busIn'); at('mateTurn', .2); say('c01', 'CLASSMATE', .45); say('s02', 'YOU', .35); at('shrug', -1.2); at('thumb', -.75); wait(.35);
  mark('busCu'); wait(1.7);
  // ---- 3. the evening ----
  mark('bath'); at('brushIn', .15); at('brushOut', 1.95); at('tapOn', 2.1); at('tapOff', 2.55); wait(2.9);
  mark('glass'); at('grab', .35); at('sip', .8); at('swallow', 1.25); at('lower', 1.6); at('setDown', 1.95); at('release', 2.15); wait(2.8);
  mark('bed'); at('walkEnd', 1.3); at('sit', 1.75); at('lie0', 2.0); at('lie1', 2.85); at('blanket0', 2.7); at('blanket1', 3.55); at('exhale', 3.95); wait(5.2);
  // ---- 4. the brain wakes up ----
  mark('sleep'); wait(2.6);
  mark('mind'); say('b03', 'BRAIN', .6); wait(.35);
  mark('face'); say('s04', 'YOU', .35); wait(.5);
  // ---- 5. the devastating realisation ----
  mark('mind2'); say('b05', 'BRAIN', .35); wait(.05);
  mark('twitch'); say('b06', 'BRAIN', .05); // the shaky breath plays over the eyelid, then back to the brain
  M.mind3 = +(L[L.length - 1].t0 + .5).toFixed(3);
  wait(.25); mark('flash'); wait(.8);
  mark('final'); at('snap', .2); at('strike', .3); wait(1.25);
  mark('black'); wait(3.12); mark('end');
  return { DUR: +c.toFixed(3), L, M, EV, CUTS: SHOTS.map(k => M[k]) };
}
