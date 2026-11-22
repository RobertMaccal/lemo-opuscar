// Sound and cue events for the mixer, exported by core/render/events.mjs (window.EV).
import { T, WINDOWS, FLANK, BEAT } from './timeline.js';
import { extCam } from './camera.js';
import { glassOf } from './building.js';

export function buildEvents() {
  const ev = [];
  const where = (t, x, y) => { const c = extCam(t), sx = (x - c.x) * c.Z + 540, sy = (y - c.y) * c.Z + 960;
    const on = sx > -60 && sx < 1140 && sy > -60 && sy < 1980; return { pan: Math.max(-1, Math.min(1, (sx - 540) / 700)), g: on ? Math.min(1, .45 + c.Z / 14) : .16 }; };
  for (const w of WINDOWS) if (w.lit0 && isFinite(w.off)) { const g = glassOf(w);
    ev.push({ t: +w.off.toFixed(3), type: 'off', id: w.id, vig: ['reader', 'tv', 'couple', 'cat', 'kitchen', 'desk'].includes(w.type), ...where(w.off, g.x + g.w / 2, g.y + 10) }); }
  ev.push({ t: 6.0, type: 'book', ...where(6, 135, 449) });
  ev.push({ t: 7.2, type: 'tvoff', ...where(7.2, 105, 381) });
  ev.push({ t: 10.15, type: 'cup', ...where(10.15, 135, 279) });
  ev.push({ t: 11.6, type: 'laptop', ...where(11.6, 225, 245) });
  ev.push({ t: 2.4, type: 'flash' }, { t: 3.2, type: 'thunder', g: 1 }, { t: 14.6, type: 'flash' }, { t: 15.2, type: 'thunder', g: .7 });
  ev.push({ t: 0.4, type: 'car', t1: 4.9, dir: 1, g: 1 }, { t: 8.6, type: 'car', t1: 13.6, dir: -1, g: .45 });
  ev.push({ t: T.enter, type: 'enter' }, { t: T.exit, type: 'exit' });
  for (let s = 18; s <= 36; s++) ev.push({ t: s, type: 'tick', n: s });
  ev.push({ t: T.place[1], type: 'place' }, { t: T.lamp[1], type: 'minilamp' });
  ev.push({ t: T.pressS, type: 'press', pan: -.35 }, { t: T.pressW, type: 'press', pan: .35 });
  for (const t of [19.2, 21.5, 25.7, 28.1, 31.3, 33.9, 34.9]) ev.push({ t, type: 'rustle' });
  ev.push({ t: 25.6, type: 'creak' }, { t: 32.9, type: 'creak' });
  ev.push({ t: T.flicker[0], type: 'flicker', t1: T.flicker[1] }, { t: T.relight, type: 'relight' });
  for (const k of [['I', 0], ['II', 5], ['III', 13], ['IV', 18.4], ['V', 25], ['VI', 32.8], ['VII', 34.4]]) ev.push({ t: k[1], type: 'cue', sec: k[0] });
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
