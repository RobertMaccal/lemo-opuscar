// The single timeline of THE MISSING PAGE: every line, cut, caption and sound cue. build(VO) → { DUR, L (lines), M (marks), EV (sound events) }
export const TEXT = {
  e01: ['Listen carefully, gentlemen.'], e02: ['This examination is your ticket to the TOP.'], e03: ['To pass, you need EIGHTY percent.'],
  e04: ['Not 79.9.'], e05: ['Not 79.9999.'], e06: ['EIGHTY. PERCENT.', '*EIGHTY.* *PERCENT.*'], e07: ["You're either a WINNER... or a LOSER."],
  e08: ['Do your best.'], e09: ['And BE with the best.'], e10: ['Begin.'],
  c01: ['See you at the top, chief!', 'See you at the *top,* chief!'], c02: ['Nah, bro. It was chill.', 'Nah, bro. It was *chill.*'],
  c03: ['...What other page?', '...What *other* page?'], c04: ['SHIT!'],
  s01: ['Man... that exam was really hard.'], s02: ["I don't know, man..."], s03: ['Those technical questions on the back were brutal.', 'Those technical questions *on the back* were brutal.'],
  s04: ['What did you put?'], s05: ['The one behind the statistics page. It was—'], s06: ['(muffled) ...you know, with the network diagrams? And the systems part...'],
};
export function build(VO) {
  const D = id => VO[id].dur, L = [], M = {}, EV = [];
  let c = 0;
  const say = (id, who, gap = .2, o = {}) => { const t0 = c + gap, t1 = t0 + (o.dur ?? D(id)); L.push({ id, who, t0, t1, text: TEXT[id][0], capText: o.cap ? (TEXT[id][1] || TEXT[id][0]) : null, muffled: !!o.muffled, env: VO[id].env }); if (!o.over) c = t1; return t0; };
  const wait = d => (c += d), mark = n => (M[n] = c), ev = (type, o = {}, dt = 0) => EV.push({ t: +(c + dt).toFixed(3), type, ...o });
  // ================= 1. THE EXAMINER ENTERS =================
  mark('s1'); ev('hallTone'); ev('music1', { at: 0 }, .0); wait(1.25);
  mark('door'); ev('door'); wait(.2); ev('stepsHeavy', { n: 5, iv: .52 }, .25);
  wait(1.0); say('e01', 'EXAMINER', 0); wait(.15);
  mark('walk'); ev('stepsHeavy', { n: 6, iv: .55, soft: 1 }, .1); say('e02', 'EXAMINER', .2);
  ev('paperDown', { pan: -.3 }, -1.9); ev('paperDown', { pan: .2 }, -.75);
  mark('insert'); ev('paperDown', { pan: 0, close: 1 }, .12); say('e03', 'EXAMINER', .3, { cap: 0 });
  mark('react'); say('e04', 'EXAMINER', .3);
  mark('react2'); say('e05', 'EXAMINER', .3);
  mark('eighty'); say('e06', 'EXAMINER', .3, { cap: 1 }); ev('musicDip');
  mark('push'); say('e07', 'EXAMINER', .5); say('e08', 'EXAMINER', .5); say('e09', 'EXAMINER', .55);
  mark('place'); ev('paperDown', { pan: .3, close: 1 }, .05); ev('musicStop', {}, .05); wait(.85);
  mark('cand'); wait(.45); say('c01', 'CANDIDATE', 0, { cap: 1 }); wait(.4);
  mark('brow'); wait(1.6);
  // ================= 2. THE TWO-HOUR EXAM =================
  mark('s2'); ev('tick'); say('e10', 'EXAMINER', .4); mark('begin'); ev('pensClick'); ev('music2'); wait(.55);
  mark('ots'); ev('penWrite', { dur: 3.2 }); wait(3.3);
  mark('rows'); ev('tickFast', { dur: 4.0 }); ev('pageTurn', {}, 1.3); ev('penWrite', { dur: 3.3, soft: 1 }, .2); wait(3.7);
  mark('done'); ev('penDown', {}, .9); ev('sigh', {}, 1.5); wait(3.1);
  // ================= 3. THE VICTORY WALK =================
  mark('s3'); ev('chair'); ev('rustle', {}, .8); wait(1.75);
  mark('track'); ev('stepsLight', { n: 6, iv: .46 }); wait(2.75);
  mark('hand'); ev('paperDown', { close: 1 }, .55); wait(1.5);
  mark('sign'); ev('sign', {}, .2); wait(1.35);
  mark('shake'); ev('rustle', {}, .35); wait(1.9);
  mark('exit'); ev('stepsLight', { n: 3, iv: .45 }); ev('door', { soft: 1 }, 1.1); wait(1.5);
  // ================= 4. THE SECOND CANDIDATE =================
  mark('s4'); ev('erase', {}, .2); ev('chair', {}, .85); wait(1.35);
  mark('sec2'); ev('paperDown', {}, .3); ev('sign', {}, .9); wait(2.25);
  mark('hall'); ev('corridor'); ev('stepsLight', { n: 5, iv: .5, soft: 1 }, .2); ev('chime', {}, 2.5); ev('doorsOpen', {}, 2.75); wait(4.9);
  // ================= 5. THE ELEVATOR =================
  mark('s5'); ev('liftHum'); ev('doorsClose', {}, .1); ev('music3'); wait(.85);
  say('s01', 'SECOND', .2); say('c02', 'CANDIDATE', .35, { cap: 1 }); say('s02', 'SECOND', .55); wait(.35);
  mark('closer'); say('s03', 'SECOND', .2, { cap: 1 }); ev('music3fade'); say('s04', 'SECOND', .4);
  mark('turn'); ev('musicCut', {}, .02); wait(.6);
  say('c03', 'CANDIDATE', 0, { cap: 1 }); wait(.95);
  mark('confused'); say('s05', 'SECOND', .15, { over: 1 });
  const s05 = L[L.length - 1];
  M.trigger = s05.t0 + .55; c = s05.t1;
  // ================= 6. THE HORROR =================
  mark('bell'); ev('rach', { n: 0 }); ev('drop'); say('s06', 'SECOND', .05, { muffled: 1, over: 1 });
  wait(1.05); mark('flash'); ev('rach', { n: 1 }); ev('flip'); wait(1.0); mark('back'); ev('rach', { n: 2 }); wait(1.05);
  mark('pass'); wait(.8);
  mark('frozen'); ev('hb', { n: 6, iv: .78 }, .1); ev('rachChord', {}, .3); ev('chimeMuffled', {}, 1.0); ev('doorsOpenMuffled', {}, 1.2); ev('doorsCloseMuffled', {}, 2.6); wait(3.2);
  mark('snap'); ev('gasp'); wait(.55);
  mark('lunge'); say('c04', 'CANDIDATE', .2, { over: 1 }); ev('lunge', {}, .05); ev('rachFff', { n: 0 }, .2); ev('doorsCloseLoud', {}, .15); wait(.6);
  mark('doors'); ev('rachFff', { n: 1 }); wait(.6);
  mark('shut'); ev('slam'); ev('impact'); ev('dingFinal', {}, .25); wait(.6);
  mark('final'); ev('floorTick', {}, 1.0); wait(2.4);
  mark('black'); wait(1.5);
  mark('end');
  return { DUR: +c.toFixed(3), L, M, EV };
}
