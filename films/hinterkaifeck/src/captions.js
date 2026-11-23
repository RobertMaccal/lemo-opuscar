// One-word captions (sometimes two short words), synced to the voice: white heavy sans with ink stroke, at ~70% height.
import WORDS from './words.json' with { type: 'json' };
const RED = new Set(['footprints','footprint','attic','attic.','haunted…','vanished.','footsteps.','nobody','killer','leave.','bodies.','weapon…','never','unsolved','barn…','smell.','one…','one.','blood','scariest','lantern.','smoke']);
export const CHUNKS = (() => {
  const out = []; let i = 0;
  while (i < WORDS.length) {
    const w = WORDS[i]; let text = w.w, t0 = w.t0, t1 = w.t1, j = i + 1;
    const clean = s => s.replace(/[^A-Za-z0-9'’-]/g, '');
    // join a short word with the next if they are spoken together
    while (j < WORDS.length && clean(text).length <= 3 && !/[.,…?!]$/.test(text) && WORDS[j].t0 - t1 < .2 && (text + ' ' + WORDS[j].w).length <= 13) { text += ' ' + WORDS[j].w; t1 = WORDS[j].t1; j++; }
    out.push({ text, t0, t1 }); i = j;
  }
  for (let k = 0; k < out.length; k++) { const nx = out[k + 1]; out[k].end = nx ? Math.min(nx.t0, out[k].t1 + .55) : out[k].t1 + .6; }
  return out;
})();
export function drawCaptions(x, T) {
  x.clearRect(0, 0, 1080, 1920);
  const c = CHUNKS.find(c => T >= c.t0 - .02 && T < c.end); if (!c) return;
  let text = c.text.replace(/[,]$/, '');
  const key = c.text.toLowerCase().split(' ').some(w => RED.has(w.replace(/[,]$/, '')));
  const age = T - c.t0, pop = 1 + .14 * Math.exp(-age * 22) * Math.cos(age * 30);
  x.save(); x.translate(540, 1345); x.scale(pop, pop);
  x.font = '900 76px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  // soft shadow
  x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 18; x.shadowOffsetY = 6;
  x.lineWidth = 15; x.strokeStyle = '#0b0810'; x.strokeText(text, 0, 0);
  x.shadowColor = 'transparent';
  x.fillStyle = key ? '#ff3d3d' : '#ffffff'; x.fillText(text, 0, 0);
  x.restore();
}
