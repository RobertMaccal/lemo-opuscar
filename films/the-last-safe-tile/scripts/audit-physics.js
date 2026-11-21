// Physics audit over every recorded frame of a run: no overlaps, no floating, no teleports,
// honest counters, exactly 99 collapses with one tile left. usage: node scripts/audit-physics.js [--seed N]
import { bake, ROLLING } from '../src/simulation.js';
import { supportFraction } from '../src/physics.js';
import { FRAMES, FPS, DEFAULT_SEED, SUPPORT_HARD } from '../src/config.js';
import { N_TILES } from '../src/tiles.js';

export function audit(seed) {
  const B = bake(seed);
  const N = B.N, R = B.balls.map((b) => b.r);
  let edgeGrace = 0, maxOverlap = 0, overlapFrames = 0, floating = 0, maxStep = 0, maxSpeed = 0, resurrect = 0, counterBad = 0;
  const solid = new Uint8Array(N_TILES);
  let worstFloat = 1;
  for (let f = 0; f < FRAMES; f++) {
    const t = f / FPS;
    for (const tl of B.schedule.tiles) solid[tl.id] = t < tl.tCollapse - 1e-9 ? 1 : 0;
    const live = [];
    for (let i = 0; i < N; i++) {
      const s = B.st[f * N + i];
      if (f > 0 && B.st[(f - 1) * N + i] !== ROLLING && s === ROLLING) resurrect++;
      if (s !== ROLLING) continue;
      live.push(i);
      const o = (f * N + i) * 3;
      // support: a rolling ball must stand on the surface (tiny grace only right at a collapse)
      const sup = supportFraction(solid, B.pos[o], B.pos[o + 1], R[i]);
      if (sup < SUPPORT_HARD) { floating++; worstFloat = Math.min(worstFloat, sup); }
      else if (sup < 0.5) edgeGrace++;
      if (f > 0 && B.st[(f - 1) * N + i] === ROLLING) {
        const p = ((f - 1) * N + i) * 3;
        const d = Math.hypot(B.pos[o] - B.pos[p], B.pos[o + 1] - B.pos[p + 1]);
        maxStep = Math.max(maxStep, d); maxSpeed = Math.max(maxSpeed, d * FPS);
      }
    }
    let frameOverlap = false;
    for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) {
      const i = live[a], j = live[b], oi = (f * N + i) * 3, oj = (f * N + j) * 3;
      const ov = R[i] + R[j] - Math.hypot(B.pos[oi] - B.pos[oj], B.pos[oi + 1] - B.pos[oj + 1]);
      if (ov > maxOverlap) maxOverlap = ov;
      if (ov > 0.75) frameOverlap = true;
    }
    if (frameOverlap) overlapFrames++;
    // counter honesty: alive = 100 − eliminations that already happened
    const elimsSoFar = B.elims.filter((e) => e.t <= t + 1e-9).length;
    if (B.aliveF[f] !== N - elimsSoFar) counterBad++;
  }
  const collapses = B.schedule.collapses.length;
  const lastT = Math.max(...B.schedule.collapses.map((c) => c.t));
  const res = {
    seed, checksum: B.checksum,
    maxOverlapPx: +maxOverlap.toFixed(3), framesWithOverlapOver075px: overlapFrames,
    floatingBallFrames: floating, worstSupport: +worstFloat.toFixed(3), edgeGraceBallFrames: edgeGrace,
    maxStepPx: +maxStep.toFixed(2), maxSpeedPxPerS: +maxSpeed.toFixed(1),
    resurrections: resurrect, counterMismatches: counterBad,
    collapses, tilesLeftAtEnd: N_TILES - collapses, lastCollapseT: lastT,
    survivorsAtReset: B.stats.survivors,
  };
  res.passed = res.framesWithOverlapOver075px === 0 && res.floatingBallFrames === 0 && res.resurrections === 0 &&
    res.counterMismatches === 0 && collapses === 99 && res.maxStepPx < 12 && lastT <= 42.2;
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--seed');
  const seed = i >= 0 ? +process.argv[i + 1] : DEFAULT_SEED;
  const r = audit(seed);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.passed ? 0 : 1);
}
