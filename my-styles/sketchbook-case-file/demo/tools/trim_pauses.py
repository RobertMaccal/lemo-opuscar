"""Natural-speed narration -> trimmed pauses + caption words for the page.
usage: python trim_pauses.py take.wav take.words.json out.wav page/words.json
Only silent gaps longer than 0.62 s are shortened (to 0.5 s); the voice itself is never stretched
(time-stretching made the narration sound robotic on the first film). Words come from tools/asr.py.
Edit FIX to correct spellings or merge tokens in the captions (index: new text, or None to merge into the previous)."""
import json, sys, numpy as np, soundfile as sf
src, words, out_wav, out_words = sys.argv[1:5]
FIX = {}
x, SR = sf.read(src, dtype='float32'); w = json.load(open(words))
if x.ndim > 1: x = x.mean(1)
def rms(a, b):
    s = x[int(a * SR):int(b * SR)]; return 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9) if len(s) else -99
cuts = []
for i in range(len(w) - 1):
    g0, g1 = w[i]['t1'], w[i + 1]['t0']; gap = g1 - g0
    if gap > 0.62:
        ex = gap - 0.5; c = (g0 + g1) / 2; a, b = c - ex / 2, c + ex / 2
        if rms(a, b) < -40: cuts.append((a, b))
fade = int(.015 * SR); out = []; pos = 0
for a, b in cuts + [(None, None)]:
    seg = x[pos:int(a * SR)].copy() if a is not None else x[pos:].copy()
    if out:
        prev = out[-1]; ov = min(fade, len(prev), len(seg)); r = np.linspace(0, 1, ov)
        prev[-ov:] = prev[-ov:] * (1 - r) + seg[:ov] * r; seg = seg[ov:]
    out.append(seg)
    if b is not None: pos = int(b * SR)
y = np.concatenate(out); sf.write(out_wav, y, SR)
def newt(t):
    s = sum((b - a) if t >= b else (t - a if t > a else 0) for a, b in cuts); n = sum(1 for a, b in cuts if t >= b)
    return t - s - max(0, n - 1) * fade / SR
res = []
for i, xw in enumerate(w):
    t0, t1 = round(newt(xw['t0']), 3), round(newt(xw['t1']), 3)
    if i in FIX:
        if FIX[i] is None: res[-1]['t1'] = t1; continue
        xw = dict(xw, w=FIX[i])
    res.append({'w': xw['w'], 't0': t0, 't1': t1, 'i': i})
json.dump(res, open(out_words, 'w'))
print(len(cuts), 'pauses shortened; duration', round(len(y) / SR, 2), 's')
