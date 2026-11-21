// Seed discovery: runs the REAL simulation (no graphics) for many seeds in parallel and ranks them.
// usage: node scripts/test-seeds.js [--from 1] [--count 2000] [--workers 4] [--top 20]
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function score(S) {
  let sc = 0;
  if (S.survivors === 1) sc += 100; else if (S.survivors === 2) sc += 35; else if (S.survivors === 0) sc += 5; else sc -= 20;
  if (!S.stable) sc -= 60;
  if (S.winner && S.winner.family === 'GOLD') sc += 45;
  if (S.alive39 >= 3 && S.alive39 <= 8) sc += 20; else if (S.alive39 === 2) sc += 10;
  if (S.alive41 >= 2) sc += 15;
  if (S.elimsLate >= 2) sc += 10;
  if (S.alive10 >= 60 && S.alive10 <= 85) sc += 5;
  if (S.alive20 >= 30 && S.alive20 <= 55) sc += 5;
  if (S.alive30 >= 10 && S.alive30 <= 25) sc += 10;
  sc += Math.min(20, S.escapes * 2 + (S.nearMisses - S.escapes) * 0.5);
  if (S.maxGap > 3) sc -= (S.maxGap - 3) * 3;
  if (S.firstElim < 3) sc += 5;
  return Math.round(sc * 10) / 10;
}

if (isMainThread) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
  const from = opt('--from', 1), count = opt('--count', 1000), top = opt('--top', 20);
  const workers = opt('--workers', Math.max(1, os.cpus().length));
  const seeds = Array.from({ length: count }, (_, i) => from + i);
  const results = [];
  const t0 = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: workers }, (_, w) => new Promise((res, rej) => {
    const mine = seeds.filter((_, i) => i % workers === w);
    const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { seeds: mine } });
    wk.on('message', (m) => {
      results.push(m); done++;
      if (done % 100 === 0) console.log(`${done}/${count}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    });
    wk.on('error', rej); wk.on('exit', res);
  })));
  results.sort((a, b) => b.score - a.score);
  const outDir = path.join(HERE, '..', 'output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'seed-report.json'), JSON.stringify({ tested: count, from, generated: new Date().toISOString(), results }, null, 1));
  const dist = [0, 0, 0, 0];
  for (const r of results) dist[Math.min(3, r.survivors)]++;
  console.log(`\ntested ${count} seeds in ${((Date.now() - t0) / 1000).toFixed(0)}s; survivors 0/1/2/3+: ${dist.join(' / ')}; gold wins: ${results.filter((r) => r.winner && r.winner.family === 'GOLD').length}`);
  console.log('seed  score  @10 @20 @30 @39 @41.5 @43  surv winner        stable  escapes nearMiss maxGap');
  for (const r of results.slice(0, top)) {
    console.log(`${String(r.seed).padStart(5)} ${String(r.score).padStart(6)}  ${[r.alive10, r.alive20, r.alive30, r.alive39, r.alive41, r.alive43].map((v) => String(v).padStart(3)).join(' ')}   ${r.survivors}   ${(r.winner ? r.winner.family + '#' + r.winner.id : '-').padEnd(13)} ${String(r.stable).padEnd(6)}  ${String(r.escapes).padStart(3)}     ${String(r.nearMisses).padStart(3)}     ${r.maxGap.toFixed(1)}`);
  }
} else {
  const { bake } = await import('../src/simulation.js');
  for (const seed of workerData.seeds) {
    const B = bake(seed, { record: false });
    const S = B.stats;
    parentPort.postMessage({ seed, score: score(S), checksum: B.checksum, ...S });
  }
}
