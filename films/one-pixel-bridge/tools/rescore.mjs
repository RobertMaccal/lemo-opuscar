import { simulate, stats } from '../src/physics.js';
import { score } from './seeds.mjs';
const rows = [];
for (const s of process.argv.slice(2).map(Number)) { const st = stats(simulate(s)); st.score = score(st); rows.push(st); }
rows.sort((a, b) => b.score - a.score);
for (const s of rows) console.log(JSON.stringify({ seed: s.seed, score: s.score, a10: s.a10, a19: s.a19, a29: s.a29, a37: s.a37, final: s.final, fin: s.finishers, gT: s.goldT.toFixed(2), saves: s.goldSaves, last: s.lastFall.toFixed(1) }));
