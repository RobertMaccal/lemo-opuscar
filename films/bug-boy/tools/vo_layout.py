"""Assemble the narration from the chosen take (B) and the two inserts, cut at the silences between lines, and lay it out on
the film timeline with planned pauses. Writes voice/vo.wav (whole film), vo.json and vo.js (line times, words, subtitles).
usage: python tools/vo_layout.py"""
import json, os, re
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = lambda p: os.path.join(HERE, 'voice', p)
LEAD, TAIL, SR = 0.5, 2.75, 48000

def load(p):
    x, sr = sf.read(V(p), dtype='float32'); assert sr == SR; return x
def norm(w): return re.sub(r"[^a-z0-9']", '', w.lower().replace('é', 'e'))

# —— take B, aligned per script line (tools/align.py) ——
B = load('takeB.wav'); al = json.load(open(V('takeB.align.json')))
def wordsB(i): return [w for w in al[i]['words'] if w['t0'] is not None]
# —— inserts: word timings from whisper ——
_wm = None
def words_of(p):
    global _wm
    cache = V(p.replace('.wav', '.words.json'))
    if os.path.exists(cache): return json.load(open(cache))
    _wm = _wm or WhisperModel('small.en', device='cpu', compute_type='int8')
    segs, _ = _wm.transcribe(V(p), language='en', beam_size=5, word_timestamps=True, initial_prompt='Satoshi, Shigeki Morimoto, Mew, CoroCoro Comic')
    ws = [{'w': norm(w.word), 't0': round(w.start, 3), 't1': round(w.end, 3)} for s in segs for w in s.words if norm(w.word)]
    json.dump(ws, open(cache, 'w')); return ws

def quiet(x, a, b):   # quietest 50 ms point between a and b (s)
    if b - a < .08: return (a + b) / 2
    i0, i1, w = int(a * SR), int(b * SR), int(.05 * SR); e = np.convolve(x[i0:i1] ** 2, np.ones(w) / w, 'valid')
    return (i0 + int(np.argmin(e)) + w // 2) / SR if len(e) else (a + b) / 2

# Each item: (audio, first word t, last word t, cut-in, cut-out, subtitle, words, extra pause after)
items = []
def from_B(i, sub=None, w0=None, w1=None, pause=0.0):
    ws = wordsB(i)[w0:w1]
    prevEnd = wordsB(i - 1)[-1]['t1'] if i > 0 and w0 in (None, 0) else (wordsB(i)[w0 - 1]['t1'] if w0 else 0)
    nxt = wordsB(i + 1)[0]['t0'] if (w1 is None and i + 1 < len(al)) else (wordsB(i)[w1]['t0'] if w1 is not None else len(B) / SR)
    a = quiet(B, prevEnd, ws[0]['t0']) if (i > 0 or w0) else 0.0
    b = quiet(B, ws[-1]['t1'], nxt)
    items.append((B, ws[0]['t0'], ws[-1]['t1'], a, b, sub or al[i]['text'], ws, pause))
def from_clip(x, ws, sub, k0, k1, pause=0.0):
    seg = ws[k0:k1]
    a = quiet(x, ws[k0 - 1]['t1'], seg[0]['t0']) if k0 > 0 else 0.0
    b = quiet(x, seg[-1]['t1'], ws[k1]['t0']) if k1 < len(ws) else len(x) / SR
    items.append((x, seg[0]['t0'], seg[-1]['t1'], a, b, sub, seg, pause))

PAUSE = {0: .6, 3: .8, 4: 2.2, 6: .4, 8: .6, 11: 1.2, 13: .8, 14: .6, 15: 1.0, 17: .4, 18: 1.2, 19: .4, 20: 1.0, 22: .9, 23: 1.2}
for i in range(9): from_B(i, pause=PAUSE.get(i, 0))
# line 9 of take B: "Together … to life." | insert A (sigh, money, salary, quit) | "The studio almost didn't make it."
w9 = [norm(w['w']) for w in wordsB(9)]
k_money, k_the = w9.index('money'), max(i for i, w in enumerate(w9) if w == 'the' and i + 1 < len(w9) and w9[i + 1] == 'studio')
from_B(9, 'Together with his team at Game Freak, he spent six years bringing that idea to life.', 0, k_money, pause=.15)
A = load('insA1.wav'); wa = words_of('insA1.wav')
from_clip(A, wa, 'Money got tight. VERY tight.', 0, 6, pause=.05)
from_clip(A, wa, 'Satoshi stopped paying himself. Five members of the team quit.', 6, len(wa), pause=.35)
from_B(9, "The studio almost didn't make it.", k_the, None, pause=2.4)   # silence 2, then the start chime
from_B(10, pause=.5)                                                     # "Then, on February 27, 1996 …"
Bi = load('insB1.wav'); wb = words_of('insB1.wav'); nb = [w['w'] for w in wb]
k_then = nb.index('then'); k_in = nb.index('in'); k_sud = nb.index('suddenly')
from_clip(Bi, wb, 'But at first… sales were modest.', 0, k_then, pause=.5)
from_clip(Bi, wb, 'Then came a secret. Just before launch, programmer Shigeki Morimoto had sneaked one extra creature into the game, as a prank: Mew.', k_then, k_in, pause=.7)
from_clip(Bi, wb, 'In 1996, CoroCoro Comic offered Mew to just 20 lucky readers… and more than 78,000 kids entered!', k_in, k_sud, pause=.3)
from_clip(Bi, wb, 'Suddenly, everybody wanted to know what else was hiding in the game. And sales took off.', k_sud, len(wb), pause=.9)
for i in range(11, len(al)): from_B(i, pause=PAUSE.get(i, 0))

# —— lay out ——
total = LEAD + sum((b - a) + p for (_, _, _, a, b, _, _, p) in items)
pos, meta, lines = LEAD, {}, []
spans = []
for n, (x, f0, f1, a, b, sub, ws, p) in enumerate(items):
    spans.append((pos, x, a, b)); t_line = pos + (f0 - a)
    vid = f'v{n + 1:02d}'
    meta[vid] = {'t': round(t_line, 3), 'd': round(f1 - f0, 3), 'sub': sub, 'words': [{'w': w['w'], 't0': round(w['t0'] - f0, 3), 't1': round(w['t1'] - f0, 3)} for w in ws]}
    lines.append({'id': vid, 't': meta[vid]['t'], 'd': meta[vid]['d'], 'sub': sub})
    pos += (b - a) + p
DUR = round(meta[lines[-1]['id']]['t'] + meta[lines[-1]['id']]['d'] + TAIL, 1)
out = np.zeros(int(DUR * SR) + SR, np.float32)
for (p0, x, a, b) in spans:
    clip = x[int(a * SR):int(b * SR)].copy(); f = int(.008 * SR); clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)
    i0 = int(p0 * SR); out[i0:i0 + len(clip)] += clip
out = out[:int(DUR * SR)]
sf.write(V('vo.wav'), out, SR)
json.dump(meta, open(os.path.join(HERE, 'vo.json'), 'w'), indent=1)
with open(os.path.join(HERE, 'vo.js'), 'w', encoding='utf-8') as fh:
    fh.write('// Generated by tools/vo_layout.py: narration lines on the film timeline (s)\n')
    fh.write(f'export const VO_DUR = {DUR};\nexport const VO = ' + json.dumps(lines, ensure_ascii=False, indent=1) + ';\n')
for L in lines: print(f"{L['id']} {L['t']:7.2f} → {L['t'] + L['d']:7.2f}  {L['sub'][:72]}")
print('film length', DUR)
