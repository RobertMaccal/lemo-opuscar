// Gold ball diary for a seed: margin to the edge (in radii), collisions, alive count.
import { simulate, width, centerX, slope, FPS, N, R, GOLD, wind } from '../src/physics.js';
const seed = +process.argv[2]; const sim = simulate(seed);
const rows = [];
for (let T = 0; T < 45; T += 0.5) {
  let minM = 1e9, at = 0, rank = 0, gy = 0;
  for (let f = Math.round(T * FPS); f < Math.round((T + 0.5) * FPS); f++) {
    const o = (f * N + GOLD) * 4, x = sim.rec[o], y = sim.rec[o + 1], st = sim.rec[o + 3] | 0;
    if (st !== 0) continue; gy = y;
    const th = Math.atan(slope(y)), d = (x - centerX(y)) * Math.cos(th), m = (width(y) / 2 - Math.abs(d)) / R;
    if (m < minM) { minM = m; at = f / FPS; }
  }
  const f = Math.round(T * FPS); for (let i = 0; i < N; i++) { const o = (f * N + i) * 4; if (((sim.rec[o + 3] | 0) === 0) && sim.rec[o + 1] > gy) rank++; }
  const hits = sim.events.filter(e => e.type === 'hit' && (e.a === GOLD || e.b === GOLD) && e.t >= T && e.t < T + 0.5).map(e => Math.round(e.j));
  const sw = sim.events.filter(e => e.type === 'sweep' && e.id === GOLD && e.t >= T && e.t < T + 0.5).map(e => Math.round(e.j));
  rows.push(`${T.toFixed(1).padStart(5)} alive ${String(sim.alive[f]).padStart(3)} ahead ${String(rank).padStart(2)} w ${Math.round(width(gy)).toString().padStart(3)} W ${Math.round(wind(T)).toString().padStart(4)} minMargin ${minM < 1e8 ? minM.toFixed(2) : '-'}R  hits ${hits.join(',')} ${sw.length ? 'SWEEP ' + sw.join(',') : ''}`);
}
console.log(rows.join('\n'));
console.log('finish/fall', sim.events.filter(e => e.type === 'finish' || (e.type === 'fall' && e.t > 30)).map(e => `${e.type}#${e.id}@${e.t.toFixed(2)}`).join(' '));
console.log('saves', sim.nearMisses.filter(e => e.t > 25).map(e => `#${e.id}@${e.t.toFixed(2)}:${e.peak.toFixed(2)}`).join(' '));
