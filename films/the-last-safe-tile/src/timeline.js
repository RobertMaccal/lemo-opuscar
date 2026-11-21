// Event timeline: turns the baked simulation into sound cues (all timed to simulation time).
// Collision sounds are rate-limited, simultaneous falls are grouped, late events get more weight.

import { PITCH, T_FINAL6, T_REVEAL, T_RESET, DURATION } from './config.js';
import { tileCx } from './tiles.js';

const panOf = (wx) => Math.max(-0.7, Math.min(0.7, ((wx - 450) / 450) * 0.6));

export function buildAudioEvents(B) {
  const ev = [];
  const sched = B.schedule;

  ev.push({ t: 0, type: 'open', pan: 0 });

  // --- collisions: keep the strongest impact per 1/30 s window, at most ~16 per second
  const win = 1 / 30;
  const buckets = new Map();
  for (const im of B.impacts) {
    if (im.t > T_RESET) continue;
    const k = Math.floor(im.t / win);
    const cur = buckets.get(k);
    if (!cur || im.vn > cur.vn) buckets.set(k, im);
  }
  const chosen = [...buckets.values()].sort((a, b) => a.t - b.t);
  let lastT = -1;
  const recent = [];
  for (const im of chosen) {
    while (recent.length && im.t - recent[0] > 1) recent.shift();
    if (recent.length >= 16) continue;
    if (im.t - lastT < 0.028) continue;
    const strength = Math.max(0, Math.min(1, (im.vn - 5) / 100));
    if (strength < 0.025) continue;
    recent.push(im.t); lastT = im.t;
    ev.push({ t: im.t, type: im.rail ? 'rail' : 'collide', strength, pitch: ((im.a * 37 + im.b * 11) % 100) / 100, pan: panOf(im.x) });
  }

  // --- tiles: warning tick, critical tick, collapse crack + whoosh
  const nW = new Map();
  for (const tl of sched.tiles) {
    if (tl.k < 0) continue;
    const late = tl.k >= 94;
    // overlapping warnings: soften stacked ticks
    const slot = Math.round(tl.tWarn * 10);
    const stack = (nW.get(slot) || 0) + 1; nW.set(slot, stack);
    ev.push({ t: tl.tWarn, type: 'warn', pan: panOf(tileCx(tl.id)), gain: (late ? 1.2 : 1) / stack });
    ev.push({ t: tl.tCrit, type: 'crit', pan: panOf(tileCx(tl.id)), gain: late ? 1.25 : 0.9 });
  }
  for (const c of sched.collapses) {
    const left = 99 - c.k;    // tiles left after this collapse, 99..1
    const weight = Math.max(0, Math.min(1, (30 - left) / 26));
    ev.push({ t: c.t, type: 'collapse', weight, pan: panOf(tileCx(c.tile)) });
  }

  // --- falls: group falls that start within 90 ms of each other
  const falls = [...B.falls].sort((a, b) => a.t - b.t);
  for (let i = 0; i < falls.length;) {
    let j = i + 1;
    while (j < falls.length && falls[j].t - falls[i].t < 0.09) j++;
    const grp = falls.slice(i, j);
    const x = grp.reduce((s, f) => s + f.x, 0) / grp.length;
    const late = grp[0].t > 30;
    ev.push({ t: grp[0].t, type: 'fall', count: grp.length, pan: panOf(x), gain: late ? 1.25 : 1 });
    i = j;
  }

  // --- story accents (sparse, isolated)
  ev.push({ t: T_FINAL6, type: 'accent', freq: 62, hi: 990, gain: 0.8 });
  ev.push({ t: 40.95, type: 'accent', freq: 58, hi: 1180, gain: 0.85 });
  const last = sched.tiles.find((tl) => tl.k === 98);
  if (last) {
    // separated tension accents while the second-to-last tile flashes
    const span = last.tCollapse - last.tWarn;
    for (const u of [0.0, 0.36, 0.62, 0.82]) ev.push({ t: last.tWarn + u * span, type: 'accent', freq: 52 + u * 18, hi: 1300 + u * 300, gain: 0.55 + 0.4 * u });
  }
  if (B.stats.survivors >= 1) {
    const w = B.stats.survivorIds.length === 1 ? B.balls[B.stats.survivorIds[0]] : null;
    ev.push({ t: T_REVEAL, type: 'victory', gold: !!(w && w.gold), pan: 0 });
  } else {
    ev.push({ t: T_REVEAL, type: 'accent', freq: 45, hi: 700, gain: 1 });
  }
  ev.push({ t: T_RESET, type: 'shimmer', dur: DURATION - T_RESET, pan: 0 });

  ev.sort((a, b) => a.t - b.t);
  return ev;
}
