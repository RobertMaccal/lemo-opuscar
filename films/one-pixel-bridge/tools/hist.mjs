import { simulate, wind, width } from '../src/physics.js';
const sim = simulate(+process.argv[2]||1);
const h = {}; for (const e of sim.events) if (e.type==='fall') { const k=Math.floor(e.t); h[k]=(h[k]||0)+1; }
console.log(Object.entries(h).map(([k,v])=>`${k}s:${v}(W${Math.round(wind(+k))},side${''})`).join(' '));
const sw = sim.events.filter(e=>e.type==='sweep').length; console.log('sweep hits', sw, 'hits', sim.events.filter(e=>e.type==='hit').length);
// falls side and y
console.log(sim.events.filter(e=>e.type==='fall').slice(0,200).map(e=>`${e.t.toFixed(1)}@${Math.round(e.y)}w${Math.round(width(e.y))}${e.side>0?'R':'L'}`).join(' '));
