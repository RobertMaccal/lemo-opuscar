// The single timeline: every line, cut, caption and sound cue. build(VO) → { DUR, L (lines), M (marks), EV (sound events) }
// The ten-second massage is fixed: hands land at M.rub0 and lift at M.rub1 = M.rub0 + 10.000 s (300 frames at 30 fps).
export const TEXT = {
  h1: ['Ahhh… that was amazing, honey!'],
  w2: ["Aww, you're welcome! Hey, can you give me one now?", 'Hey, can you give me *one* now?'],
  h3: ["OH! LOOK! THERE'S A BIRD!", "OH! LOOK! THERE'S A *BIRD!*"],
  w4: ['HEY! Where are you going?!', 'HEY! Where are you *going?!*'],
  h5: ['Chill, chill! I was joking!', 'Chill, chill! I was *joking!*'],
  h6: ['Come on, let me give you a massage!'],
  h7: ['There you go, honey! All done! You cool?', 'All done! You *cool?*'],
};
// offsets inside a clip where a caption should start (seconds), so it pops with the right words
const CAP_AT = { w2: 2.2, h7: 1.52 };
export function build(VO) {
  const D = id => VO[id].dur, L = [], M = {}, EV = [];
  let c = 0;
  const say = (id, who, gap = .2, o = {}) => {
    const t0 = c + gap, ca = CAP_AT[id] || 0;
    L.push({ id, who, t0, t1: t0 + D(id), text: TEXT[id][0], capText: o.cap ? (TEXT[id][1] || TEXT[id][0]) : null, capT0: t0 + ca, env: VO[id].env });
    c = t0 + D(id); return t0;
  };
  const wait = d => (c += d), mark = n => (M[n] = +c.toFixed(3)), at = t => (c = t), ev = (type, o = {}, dt = 0) => EV.push({ t: +(c + dt).toFixed(3), type, ...o });

  // ---- 1. the daily massage: three days, then today (cuts on piano onsets of the recording) ----
  mark('d1'); ev('music', { part: 'theme' }); ev('room'); wait(3.73);
  mark('d2'); ev('flash'); wait(2.61);
  mark('d3'); ev('flash'); wait(1.29);
  mark('now'); ev('flash'); wait(.38);
  // ---- 2. the request ----
  say('h1', 'HIM', 0);                       // he says it while her hands finish
  M.pat = M.now + 1.05; M.lift = M.now + 1.55; M.walk0 = M.now + 1.75;
  wait(.12); mark('aww'); say('w2', 'HER', 0, { cap: 1 });
  M.ots = +(lineT(L, 'w2').t0 + 2.12).toFixed(3);
  mark('freeze'); ev('musicStop', { fade: .35 }); wait(.56);
  mark('cu'); wait(1.46);
  // ---- 3. the bird ----
  mark('bird'); say('h3', 'HIM', .06, { cap: 1 }); wait(.34);
  mark('win'); ev('chirp', {}, .34); ev('chirp', {}, .62); wait(1.2);
  mark('esc'); wait(3.25);                   // he sneaks; she catches the cuff at M.grab
  M.grab = +(M.esc + 2.92).toFixed(3); EV.push({ t: M.grab, type: 'tug' });
  // ---- 4. busted ----
  mark('cuff'); wait(.72);
  mark('hey'); say('w4', 'HER', .08, { cap: 1 }); wait(.42);
  mark('excuse'); say('h5', 'HIM', .5, { cap: 1 }); say('h6', 'HIM', .12);
  M.release = +(lineT(L, 'h6').t0 + 1.25).toFixed(3); M.round0 = M.release + .25;
  ev('music', { part: 'light' }, -2.2);
  wait(1.45);
  mark('roll'); wait(.5);
  // ---- 5. the ten-second massage ----
  mark('rub0'); ev('music', { part: 'massage' }, -.2); wait(10.0); mark('rub1');
  // ---- 6. the flex, the line, the stare ----
  wait(.3); mark('step'); wait(.6); mark('flex'); ev('flex');
  say('h7', 'HIM', .12, { cap: 1 });
  wait(.08); mark('stare'); ev('musicCut');
  wait(2.95); mark('black'); wait(.45); mark('end');
  return { DUR: +c.toFixed(3), L, M, EV };
}
function lineT(L, id) { return L.find(l => l.id === id); }
