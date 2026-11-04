// node tools/export_timeline.mjs → timeline.json (DUR, SHOTS, T, VO) for the score and the mix
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const m = await import(path.join(HERE, 'timeline.js'));
fs.writeFileSync(path.join(HERE, 'timeline.json'), JSON.stringify({ DUR: m.DUR, SHOTS: m.SHOTS, T: m.T, VO: m.VO }, null, 1));
console.log('timeline.json', m.DUR, 's', m.SHOTS.length, 'shots');
