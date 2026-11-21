import { simulate, stats, FPS } from '../src/physics.js';
const seeds = process.argv.slice(2).map(Number);
for (const s of seeds.length ? seeds : [1,2,3,4,5,6,7,8]) {
  const t0 = Date.now(); const sim = simulate(s); const st = stats(sim);
  // leader progress timeline
  const lead = []; for (const T of [3,10,19,29,37,41]) { const f = T*FPS; let m=-1e9; for (let i=0;i<100;i++){ const o=(f*100+i)*4; if ((sim.rec[o+3]|0)===0||(sim.rec[o+3]|0)===3) m=Math.max(m,sim.rec[o+1]); } lead.push(Math.round(m)); }
  console.log(JSON.stringify({...st, lead, ms: Date.now()-t0}));
}
