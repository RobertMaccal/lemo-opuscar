// Export the timeline for the mixer and the subtitles:  node films/that-one-friend/tools/timeline.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT || path.resolve(HERE, '..', 'out');   // generated files go outside demo/
const { build } = await import(path.join(HERE, 'src/timeline.js'));
const VO = JSON.parse(fs.readFileSync(path.join(HERE, 'audio/vo.json')));
const T = build(VO); T.L.forEach(l => delete l.env);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(T, null, 1));
const f = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
console.log('DUR', T.DUR, f(T.DUR)); console.log(Object.entries(T.M).filter(([k]) => /^(s\d|title|end)$|^s\d_(run|swim|chess|piano|big)$/.test(k)).map(([k, v]) => `${k}=${f(v)}`).join('  '));
