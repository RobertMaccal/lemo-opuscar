import * as P from '../src/physics.js';
const seed=+process.argv[2]; const g=P.GUSTS[P.GUSTS.length-1];
for (const p of [255,270,285,300,315,330]) for (const d of [0.8,1.3]) {
  g.p=p; g.d=d; const sim=P.simulate(seed); const st=P.stats(sim);
  let mx=0, mt=0; for(let f=37*60;f<41.5*60;f++){const o=(f*100)*4; if((sim.rec[o+3]|0)!==0) continue; const y=sim.rec[o+1]; const dd=Math.abs((sim.rec[o]-P.centerX(y))*Math.cos(Math.atan(P.slope(y)))); if(dd>mx){mx=dd;mt=f/60;}}
  console.log(p,d,'final',st.final,'fin',st.finishers.join(','),'goldFall',st.goldFall.toFixed(2),'gold max |d| on rail',mx.toFixed(2),'px @',mt.toFixed(2));
}
