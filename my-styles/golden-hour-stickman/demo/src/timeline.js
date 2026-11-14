// The single timeline: every line, cut, caption and sound cue. build(VO) → { DUR, L (lines), M (marks), EV (sound events) }
export const TEXT = {
  y01: ["Bro... I'm actually cooked.", "Bro... I'm actually *cooked.*"], j02: ['Hmm?'], y03: ["I didn't study ANYTHING for this exam.", "I didn't study *ANYTHING.*"],
  j04: ['Yeah, man. Same here.', 'Yeah, man. *Same here.*'], y05: ['Seriously?'], j06: ['Yeah. Barely looked at the notes.'], y07: ["Okay, good. At least we're failing together.", "At least we're *failing together.*"],
  j08: ['Yeah... probably.'], p09: ['Alright, everyone. In you come.'], j10: ['Professor?'], j11: ['Could I have another answer booklet, please?', 'Could I have another *answer booklet,* please?'],
  p12: ['Already?'], j13: ['Yeah. Thanks.'], y14: ['Another... WHAT?', 'Another... *WHAT?*'], j15: ['Guys, that exam was actually tough.'],
  a16: ["Yeah. What'd you put for the upper-arm bone question?"], j17: ['That was the humerus, right?', 'That was the *humerus,* right?'], b18: ['Yeah, definitely.'],
  y19: ['...I wrote a muscle.', '...I wrote a *muscle.*'], t20: ['Jack!'], t21: ['JACK!'], j22: ['Yeah? Sorry, teacher.'], t23: ["Since you're clearly paying attention..."],
  t24: ["Which bone in the human body doesn't articulate with another bone?", "Which bone doesn't *articulate* with another bone?"], y25: ["Ha. He's done.", "Ha. He's *done.*"],
  j26: ["The hyoid bone. It's suspended by muscles and ligaments.", "The *hyoid* bone. It's suspended by muscles and ligaments."], t27: ['...Correct.', '...*Correct.*'], y28: ['HOW?!', '*HOW?!*'],
  j29: ['Nice. New high score.', 'Nice. New *high score.*'], y30: ['COACH! I think I broke the school record!'], c31: ['Not bad! Second place.', 'Not bad! *Second place.*'], y32: ['Second?'],
  c33: ['Yeah. After Jack.', 'Yeah. *After Jack.*'], y34: ['Please tell me I won.'], c35: ['Second.', '*Second.*'], y36: ['...Jack?'], c37: ['Jack.', '*Jack.*'],
  y38: ['Jack.'], j39: ['Yeah?'], y40: ['Seriously, man. How are you good at literally EVERYTHING?', 'How are you good at literally *EVERYTHING?*'], j41: ["Huh? I'm not, man."],
  j42: ["I'm just chill.", "I'm just *chill.*"], j43: ['Anyway. See you tomorrow, bro.'], y44: ['This guy... I just...'], y45: ['Whatever, man.', '*Whatever,* man.'],
};
export function build(VO) {
  const D = id => VO[id].dur, L = [], M = {}, EV = [];
  let c = 0;
  const say = (id, who, gap = .2, o = {}) => { const t0 = c + gap; L.push({ id, who, t0, t1: t0 + D(id), text: TEXT[id][0], capText: o.cap ? (TEXT[id][1] || TEXT[id][0]) : null, think: !!o.think, env: VO[id].env }); c = t0 + D(id); return t0; };
  const wait = d => (c += d), mark = n => (M[n] = c), ev = (type, o = {}, dt = 0) => EV.push({ t: +(c + dt).toFixed(3), type, ...o });
  // ---- title ----
  mark('title'); ev('bell', {}, .2); wait(3.0);
  // ---- 1. before the exam ----
  mark('s1'); say('y01', 'YOU', .35, { cap: 1 }); say('j02', 'JACK', .2);
  wait(.15); mark('s1_cuY'); say('y03', 'YOU', .1, { cap: 1 });
  wait(.15); mark('s1_cuJ'); say('j04', 'JACK', .3, { cap: 1 }); wait(.35);
  mark('s1_two'); say('y05', 'YOU', .1); say('j06', 'JACK', .22); say('y07', 'YOU', .28, { cap: 1 }); say('j08', 'JACK', .22);
  wait(.3); mark('s1_door'); ev('door'); wait(.3); say('p09', 'PROFESSOR', 0); mark('s1_walk'); wait(2.3);
  // ---- 2. the exam betrayal ----
  mark('s2'); ev('clockOn'); wait(2.1);
  mark('s2_cu'); wait(2.7);
  mark('s2_hand'); ev('sleeve'); wait(.5); say('j10', 'JACK', 0); wait(.45); say('j11', 'JACK', 0, { cap: 1 }); mark('s2_cut'); ev('musicCut'); wait(.9);
  mark('s2_eyes'); wait(1.5);
  mark('s2_reveal'); ev('sting'); wait(1.7);
  mark('s2_insert'); ev('pages'); wait(1.4);
  mark('s2_prof'); wait(.45); say('p12', 'PROFESSOR', 0); say('j13', 'JACK', .28); wait(.25);
  mark('s2_ecu'); say('y14', 'YOU', .35, { cap: 1 }); mark('s2_drop'); wait(.65);
  mark('s2_fall'); wait(.3); ev('pencilHit'); wait(.7); mark('s2_thud'); ev('thud'); wait(.85);
  // ---- 3. post-exam horror ----
  mark('s3'); say('j15', 'JACK', .35); say('a16', 'STUDENT A', .22); say('j17', 'JACK', .2, { cap: 1 }); say('b18', 'STUDENT B', .15);
  mark('s3_cu'); wait(1.25);
  mark('s3_flash'); ev('whoosh'); wait(1.7);
  mark('s3_cu2'); say('y19', 'YOU', .3, { think: 1, cap: 1 }); wait(.4);
  mark('s3_spiral'); ev('spiral'); { let tt = .25, iv = .92; while (tt < 5.8) { ev('hb', {}, tt); tt += iv; iv = Math.max(.4, iv * .86); } } wait(5.95);
  // ---- 4. the classroom genius ----
  mark('s4'); ev('smash'); wait(1.7);
  mark('s4_two'); wait(2.3);
  mark('s4_teacher'); say('t20', 'TEACHER', .15); wait(.3);
  mark('s4_two2'); wait(.75); say('t21', 'TEACHER', 0); mark('s4_jackUp'); say('j22', 'JACK', .4); wait(.2);
  mark('s4_three'); say('t23', 'TEACHER', .2); say('t24', 'TEACHER', .45, { cap: 1 }); wait(.2);
  mark('s4_cuY'); say('y25', 'YOU', .15, { think: 1, cap: 1 }); wait(.25);
  mark('s4_cuJ'); say('j26', 'JACK', .3, { cap: 1 }); mark('s4_stop'); ev('musicStop'); wait(.35);
  mark('s4_cuT'); wait(1.0); say('t27', 'TEACHER', 0, { cap: 1 }); wait(.3);
  mark('s4_two3'); wait(1.8); say('y28', 'YOU', 0, { think: 1, cap: 1 }); wait(.4); ev('jingle'); wait(.3); say('j29', 'JACK', 0, { cap: 1 }); wait(.8);
  // ---- 5. second place. after Jack. ----
  mark('s5_run'); ev('montage'); wait(2.2); mark('s5_finish'); ev('whistle'); wait(.8);
  mark('s5_coach'); say('y30', 'YOU', .05); say('c31', 'COACH', .2, { cap: 1 }); say('y32', 'YOU', .2); say('c33', 'COACH', .15, { cap: 1 });
  mark('s5_bench'); wait(1.1);
  mark('s5_swim'); ev('splash', {}, .9); wait(1.5); mark('s5_wall'); say('y34', 'YOU', .2); say('c35', 'COACH', .2, { cap: 1 }); say('y36', 'YOU', .25); say('c37', 'COACH', .15, { cap: 1 });
  mark('s5_wave'); wait(.9);
  mark('s5_chess'); ev('piece', {}, .5); wait(.9); mark('s5_board1'); ev('flip'); wait(1.1); mark('s5_dead'); wait(1.1);
  mark('s5_piano'); ev('applause'); wait(1.0); mark('s5_board2'); ev('flip'); wait(.9); mark('s5_jackPiano'); wait(.9);
  mark('s5_b3'); ev('flip'); ev('jack', { v: 0 }, .12); wait(.62);
  mark('s5_b4'); ev('flip'); ev('jack', { v: 1 }, .1); wait(.52);
  mark('s5_b5'); ev('flip'); ev('jack', { v: 2 }, .08); wait(.44);
  for (let i = 0; i < 6; i++) { mark('s5_j' + i); ev('jack', { v: i % 4, fast: 1 }); ev('flip'); wait([.34, .28, .23, .19, .16, .14][i]); }
  mark('s5_big'); ev('bigJack'); wait(.8);
  // ---- 6. the final conversation ----
  mark('s6'); ev('silence'); wait(1.2); say('y38', 'YOU', 0); say('j39', 'JACK', .25); say('y40', 'YOU', .3, { cap: 1 }); say('j41', 'JACK', .35); say('j42', 'JACK', .35, { cap: 1 }); wait(.6);
  mark('s6_bye'); say('j43', 'JACK', .15); mark('s6_cu'); wait(1.2); say('y44', 'YOU', 0); wait(.4); say('y45', 'YOU', 0, { cap: 1 }); wait(.45);
  mark('s6_crane'); wait(5.1); mark('end');
  return { DUR: +c.toFixed(3), L, M, EV };
}
