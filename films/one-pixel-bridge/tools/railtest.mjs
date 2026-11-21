import * as P from '../src/physics.js';
const g=P.GUSTS[P.GUSTS.length-1]; const [p,d]=[+process.argv[2],+process.argv[3]];
g.p=p; g.d=d; let saves=0, one=0, fallsInGust=0, maxPeak=[];
for(let s=1;s<=60;s++){const sim=P.simulate(s); const st=P.stats(sim);
 const sv=sim.nearMisses.filter(e=>e.t>38.4&&e.t<41.5); saves+=sv.length; maxPeak.push(...sv.map(e=>e.peak.toFixed(2)));
 fallsInGust+=sim.events.filter(e=>e.type==='fall'&&e.t>38.6&&e.t<41).length; if(st.final===1) one++;}
console.log(p,d,'railSaves',saves,'falls in gust',fallsInGust,'final==1',one, maxPeak.slice(0,20).join(' '));
