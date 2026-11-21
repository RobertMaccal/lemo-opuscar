import * as P from '../src/physics.js';
for (const seed of process.argv.slice(2).map(Number)) {
  const sim = P.simulate(seed); let out = [];
  for (let T = 36; T < 42; T += 0.5) { let mx = 0, riv = [];
    for (let f = T*60; f < (T+0.5)*60; f++) { const o=(f*100)*4; if ((sim.rec[o+3]|0)!==0) continue; const y=sim.rec[o+1]; mx=Math.max(mx,Math.abs((sim.rec[o]-P.centerX(y))*Math.cos(Math.atan(P.slope(y))))); }
    out.push(`${T}:${mx.toFixed(1)}`); }
  const ev = sim.events.filter(e=>e.t>29&&(e.type==='fall'||e.type==='finish')).map(e=>`${e.type[0]}#${e.id}@${e.t.toFixed(1)}`);
  console.log(seed, 'gold |d| px per 0.5s:', out.join(' '), '\n   ', ev.join(' '));
}
