// Seed search: node tools/seeds.mjs <from> <to> [out.jsonl]
// For every seed where the gold ball survives the whole run, records survivors at 10/19/29/37 s, final survivors,
// finishers, gold finish time, last elimination and the gold ball's near misses. Seeds where gold falls are logged as such.
import fs from 'fs';
import { simulate, stats } from '../src/physics.js';
const isMain = import.meta.url === `file://${process.argv[1]}`;
const [a, b, out] = [+process.argv[2] || 1, +process.argv[3] || 50, process.argv[4]];
const lines = [];
for (let s = a; isMain && s <= b; s++) {
  const sim = simulate(s, { abortOnGoldFall: true });
  if (!sim) { lines.push(JSON.stringify({ seed: s, goldFinish: false })); continue; }
  const st = stats(sim); st.score = score(st); lines.push(JSON.stringify(st));
  if (st.goldFinish) console.log(lines[lines.length - 1]);
}
if (isMain && out) fs.appendFileSync(out, lines.join('\n') + '\n');
export function score(st) {
  let sc = 0;
  if (st.goldFinish && st.finishers.length === 1 && st.final === 1) sc += 100;
  const near = (v, lo, hi) => v >= lo && v <= hi ? 10 : -Math.min(10, Math.min(Math.abs(v - lo), Math.abs(v - hi)));
  sc += near(st.a10, 85, 96) + near(st.a19, 35, 52) + near(st.a29, 8, 15) + near(st.a37, 2, 3);
  sc += Math.min(3, st.goldSaves.length) * 5;
  if (st.goldSaves.some(([t, p]) => t > 38.4 && p >= 0.25)) sc += 25;
  if (st.goldSaves.some(([t]) => t > 19 && t < 29.5)) sc += 6;
  if (st.lastFall > 38.4) sc += 8;
  if (st.goldT > 40 && st.goldT < 41.8) sc += 8;
  return sc;
}
