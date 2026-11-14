// The single timeline: every cut, key action and sound cue. The film, the score and the foley all read these numbers.
export const DUR = 70.0;
// shot cuts (seconds)
export const C = {
  bed1: 0, hall1: 3.2, bath1: 5.0, cu1: 6.9,
  wake1: 9.0, pov1: 10.6, relief1: 11.9,
  hall2: 15.0, bath2: 17.8, cu2: 20.4,
  wake2: 23.0, pov2: 25.0, freeze2: 26.6, lie2: 28.0,
  hall3: 33.6, bath3: 35.4, cu3: 37.4,
  wake3: 40.0, ecu3: 41.4, pov3: 42.6, turn3: 43.4, taps: 45.0, check3: 47.4,
  out4: 49.0, hall4: 50.4, pov4: 52.8, bath4: 53.8, lid4: 55.6, wait4: 56.6, back4: 57.6, bliss4: 60.2,
  real: 62.5, black: 69.0, end: 70.0,
};
// key hits
export const K = {
  switch1: 4.72, lid1: 6.6, lid2: 19.8, lid3: 36.9, lid4: 56.4,
  taps: [45.0, 45.6, 46.2], shake: 46.6, pinch: 47.5, nods: [48.5, 48.8],
  stream: 58.4, sigh: 60.4, sad: 64.0, musicCut3: 39.3,
};
// walks: x0 → speed from stride·rate·scale (no foot sliding); steps land at t0 + (.25 + k/2)/rate
export const WALKS = {
  bed1:  { t0: 2.95, t1: 3.2, x0: 500, st: 26, rate: 1.25, s: 1, surf: 'wood' },
  hall1: { t0: 3.2, t1: 5.0, x0: 480, st: 30, rate: 1.25, s: 1.15, surf: 'wood' },
  bath1: { t0: 5.0, t1: 6.05, x0: 410, st: 40, rate: 1.6, s: 1, surf: 'tile' },
  bed2:  { t0: 14.6, t1: 15.0, x0: 500, st: 36, rate: 1.4, s: 1, surf: 'wood' },
  hall2: { t0: 15.0, t1: 17.8, x0: 250, st: 34, rate: 1.3, s: 1.15, surf: 'wood' },
  bath2: { t0: 17.8, t1: 18.95, x0: 395, st: 40, rate: 1.55, s: 1, surf: 'tile' },
  bed3:  { t0: 33.35, t1: 33.6, x0: 500, st: 46, rate: 1.9, s: 1, surf: 'wood' },
  hall3: { t0: 33.6, t1: 35.4, x0: 190, st: 48, rate: 1.95, s: 1.15, surf: 'wood', jog: true },
  bath3: { t0: 35.4, t1: 36.15, x0: 410, st: 46, rate: 1.95, s: 1, surf: 'tile', jog: true },
  bed4:  { t0: 49.95, t1: 50.4, x0: 500, st: 44, rate: 1.5, s: 1, surf: 'wood' },
  hall4: { t0: 50.4, t1: 52.35, x0: 200, st: 44, rate: 1.45, s: 1.15, surf: 'wood' },
  bath4: { t0: 53.8, t1: 54.75, x0: 555, st: 30, rate: 1.1, s: 1, surf: 'tile', tiptoe: true },
};
export const walkV = w => 4 * w.st * w.rate * w.s;
export const walkX = (w, t) => w.x0 + walkV(w) * (Math.min(Math.max(t, w.t0), w.t1) - w.t0);

// sound events (exported to events.json for mix.py)
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
for (const [id, w] of Object.entries(WALKS)) for (let k = 0; ; k++) { const t = w.t0 + (.25 + k / 2) / w.rate; if (t >= w.t1 - .02) break; ev(t, 'step', { surf: w.surf, v: w.jog ? 1 : w.tiptoe ? .35 : .7, id }); }
// getting out of bed: blanket, creak, feet on the floor
for (const [t, v] of [[1.88, .5], [13.62, .7], [32.88, .9], [49.02, 1]]) { ev(t, 'blanket', { v }); ev(t + .3, 'creak', { v: v * .8 }); ev(t + .62 / (1 + v), 'feet', { v }); }
ev(1.25, 'rustle', { v: .4 }); ev(K.switch1, 'switch');
for (const t of [K.lid1, K.lid2, K.lid3]) { ev(t - .32, 'lidLift', { v: .7 }); ev(t, 'lidClick', { v: .8 }); }
ev(K.lid4 - .55, 'lidLift', { v: .4, slow: 1 }); ev(K.lid4, 'lidClick', { v: .6 });
// awakenings
ev(C.wake1, 'wake', { n: 1 }); ev(C.wake2, 'wake', { n: 2 }); ev(C.wake3, 'wake', { n: 3 });
for (const [t0, t1, r] of [[9.3, 11.0, 2.4], [23.3, 25.0, 3.0], [40.3, 42.6, 3.4]]) for (let t = t0; t < t1; t += 1 / r) ev(t, 'pant', { v: 1 - (t - t0) / (t1 - t0) * .6 });
ev(10.65, 'rustle', { v: .6 }); ev(11.95, 'exhale', { v: .8 }); ev(12.55, 'wipe'); ev(25.05, 'rustle', { v: .6 }); ev(25.5, 'pat'); ev(25.85, 'pat'); ev(28.05, 'flop'); ev(28.15, 'exhale', { v: .7 });
ev(28.8, 'rustle', { v: .6 }); ev(29.45, 'rustle', { v: .5 }); ev(30.4, 'rustle', { v: .4 }); ev(31.0, 'rustle', { v: .55 }); ev(31.0, 'creak', { v: .4 }); ev(31.6, 'rustle', { v: .55 }); ev(32.4, 'rustle', { v: .7 }); ev(32.4, 'creak', { v: .6 });
ev(30.6, 'strain'); ev(31.8, 'strain');
for (let t = 41.2; t < 43.4; t += .62) ev(t, 'heart', { v: .9 });
ev(42.65, 'rustle', { v: .7 }); ev(44.25, 'cloth', { v: .5 });
for (const t of K.taps) ev(t, 'tap'); ev(K.shake, 'shake'); ev(K.shake + .55, 'exhale', { v: .5 }); ev(K.pinch, 'pinch'); for (const t of K.nods) ev(t, 'nod');
ev(52.45, 'cloth', { v: .5 }); ev(55.0, 'cloth', { v: .35 }); ev(57.7, 'cloth', { v: .5 });
ev(K.stream, 'stream', { dur: C.real - K.stream }); ev(58.5, 'relief'); ev(K.sigh, 'sigh', { dur: 1.9 });
ev(C.real, 'betrayal'); ev(K.sad, 'sad');
// sleep breathing in the two real shots
for (let t = .3; t < 1.2; t += 1.6) ev(t, 'sleepBreath'); for (let t = 63.4; t < C.black; t += 1.7) ev(t, 'sleepBreath', { v: .8 });
EV.sort((a, b) => a.t - b.t);
export { EV };
