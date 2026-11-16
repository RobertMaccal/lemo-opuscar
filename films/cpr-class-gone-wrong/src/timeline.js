// The single timeline: every line, cut, caption and sound cue. build(VO) → { DUR, L (lines), M (marks), EV (sound events), CH (chant grid) }
// Speaker tabs: TEACHER, KYLE (the volunteer), GUS (the parking-lot student), CHRISTOPHER, VICTOR (the organ-donor student).
export const TEXT = {
  t01: ['All right, class. Who wants to demonstrate CPR?'],
  v02: ['I can! I know this!'],
  v03: ['(humming) First I was afraid… I was petrified…', '♪ First I was afraid… I was *petrified…* ♪'],
  t04: ["No, no, no! Wrong song! It's \"Stayin' Alive\"!", "Wrong song! It's *\"Stayin' Alive\"!*"],
  v05: ['Oh! Right! Right!'],
  p06: ["Wait! You were in the parking lot earlier. THAT'S how I know you!", "You were in the *parking lot* earlier. THAT'S how I know you!"],
  t08: ['OKAY! OKAY! STOP!', 'OKAY! OKAY! *STOP!*'],
  t09: ["You stopped compressions. You didn't keep 100 to 120 a minute. Nobody called 911.", "You stopped compressions… you didn't keep 100–120 a minute. Nobody called *911.*"],
  t10: ['You lost him.', 'You *lost* him.'],
  d11: ["Yep. He's dead. What do we do next? Christopher?"],
  c12: ['I have no idea.'],
  d13: ['Anyone else?'],
  c14: ['Actually… we could bury him?', 'Actually… we could *bury him?*'],
  d15: ["Check for an organ-donor card. We've only got five minutes to harvest.", "Check for an *organ-donor card.* We've only got five minutes to harvest."],
};
export const BPM = 110, BEAT = 60 / BPM, BAR = 4 * BEAT;
export function build(VO) {
  const D = id => VO[id].dur, L = [], M = {}, EV = [];
  let c = 0;
  const say = (id, who, gap = .2, o = {}) => { const t0 = c + gap; L.push({ id, who, t0, t1: t0 + D(id), text: TEXT[id][0], capText: o.cap ? (TEXT[id][1] || TEXT[id][0]) : null, think: false, env: VO[id].env }); c = t0 + D(id); return t0; };
  const wait = d => (c += d), mark = n => (M[n] = c), at = (n, t) => (M[n] = t), ev = (type, o = {}, dt = 0) => EV.push({ t: +(c + dt).toFixed(3), type, ...o });
  const evAt = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
  // ---- 1. who knows CPR? ----
  mark('s1'); ev('room'); say('t01', 'TEACHER', .4); wait(.08);
  mark('cw1'); wait(.62); mark('hand'); ev('whoosh'); ev('chair', {}, .05); wait(.25);
  mark('k1'); say('v02', 'KYLE', .15); wait(.06);
  mark('walk'); ev('chairBack', {}, -.4); wait(2.05); mark('kneel'); ev('kneel'); wait(.65);
  // ---- 2. the wrong song ----
  mark('ins'); wait(.28); mark('hands'); ev('hands');
  wait(.1); mark('comp1'); say('v03', 'KYLE', .1, { cap: 1 }); at('two', M.ins + 1.0); at('first', L[L.length - 1].t0 + 1.88); wait(.05);
  mark('t1'); say('t04', 'TEACHER', .2, { cap: 1 }); at('compStop1', L[L.length - 1].t0 + .55);
  for (let t = M.comp1; t < M.compStop1; t += .571) evAt(t, 'comp', { k: -1 });
  mark('k2'); say('v05', 'KYLE', .22); wait(.06);
  // ---- 3. the random interruption ----
  mark('park'); say('p06', 'GUS', .1, { cap: 1 }); wait(.08);
  mark('stare'); wait(1.8); mark('pk2'); ev('creak'); wait(.45); mark('tb'); wait(.3);
  // ---- 4. the disco ----
  mark('C0'); const C0 = c; const bar = k => C0 + k * BAR;
  // compressions on every beat, bars 1-4 and the first beat of bar 5 (110 / min)
  for (let i = 0; i <= 17; i++) evAt(C0 + i * BEAT, 'comp', { k: i });
  at('kyleCU', C0 + .4); at('cls', bar(2)); at('tH', bar(3) + 2 * BEAT); at('dance', bar(4) + .3); at('lastComp', C0 + 17 * BEAT);
  at('up', bar(4) + 1.6 * BEAT); at('stood', bar(4) + 3.6 * BEAT); at('cls2', bar(6)); at('dance2', bar(6) + 3 * BEAT); at('hey', bar(7));
  for (let k = 0; k < 4 * 7 + 2; k++) {                     // foot taps, claps, snaps, desk drum
    const t = C0 + k * BEAT, b = Math.floor(k / 4), q = k % 4;
    if (b >= 2) evAt(t + .02, 'tap', { v: 'tom' });
    if (b >= 3) evAt(t + .045, 'tap', { v: 'park' });
    if (b >= 3 && b <= 6 && q % 2 === 0) evAt(t + .01, 'desk', { v: 'ben' });
    if (b >= 4 && q % 2 === 1) evAt(t + .015, 'clap');
    if (b >= 5 && b <= 6) evAt(t + BEAT / 2, 'snap');
  }
  c = bar(7);
  // ---- 5. the teacher shuts everything down ----
  mark('stopT'); say('t08', 'TEACHER', 0, { cap: 1 }); at('STOP', L[L.length - 1].t0 + 1.88); at('freeze', M.STOP + .12); ev('silence');
  wait(.75); mark('verdict'); say('t09', 'TEACHER', .1, { cap: 1 }); say('t10', 'TEACHER', .48, { cap: 1 }); wait(.95);
  mark('mani'); wait(.95); mark('rise'); ev('chairV', {}, .25); ev('sniff', {}, -.5); wait(.8);
  // ---- 6. what do we do now? ----
  mark('vic'); ev('stepsV'); say('d11', 'VICTOR', .3); at('vicArrive', M.vic + 1.2); wait(.06);
  mark('chris1'); say('c12', 'CHRISTOPHER', .15);
  mark('vic2'); say('d13', 'VICTOR', .14); wait(.06);
  mark('chris2'); ev('finger', {}, .1); say('c14', 'CHRISTOPHER', .3, { cap: 1 }); wait(.12);
  mark('silence'); wait(.9); mark('silence2'); wait(.8);
  mark('final'); say('d15', 'VICTOR', .2, { cap: 1 }); wait(.15);
  mark('pen'); ev('pen', {}, .12); wait(.5); mark('eyes'); wait(.45); mark('turn'); wait(.7);
  mark('black'); wait(.25); mark('end');
  return { DUR: +c.toFixed(3), L, M, EV, CH: { C0, BEAT, BAR } };
}
