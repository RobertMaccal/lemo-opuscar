// Subtitles from the timeline:  node films/what-assignment/tools/srt.mjs   → what-assignment.srt
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT || path.join(HERE, 'out');
const T = JSON.parse(fs.readFileSync(path.join(OUT, 'timeline.json')));
const f = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const L = T.L, out = L.map((l, i) => { const end = Math.min(Math.max(l.t1 + .45, l.t0 + 1.2), L[i + 1] ? L[i + 1].t0 - .05 : T.DUR); return `${i + 1}\n${f(l.t0)} --> ${f(end)}\n${l.text}\n`; });
fs.writeFileSync(path.join(HERE, 'what-assignment.srt'), out.join('\n')); console.log(L.length, 'cues');
