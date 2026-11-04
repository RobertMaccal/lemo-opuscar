"""Transcribe a narration take with faster-whisper (word timestamps), align it to the script lines, report mismatches.
usage: python tools/align.py voice/takeA.wav [--model base.en] [--out voice/takeA.align.json]
Writes per line: start/end (s, in the take), words [{w, t0, t1}] and the recognised text; prints a word-error summary."""
import json, re, sys, difflib, argparse, os
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('wav'); ap.add_argument('--model', default='base.en'); ap.add_argument('--out')
a = ap.parse_args()

def script_lines():
    s = open(os.path.join(HERE, 'SCRIPT.md'), encoding='utf-8').read()
    out = []
    for l in s.split('\n'):
        if not l.strip() or l.startswith('#') or l.startswith('Voice:'): continue
        out.append(re.sub(r'\[[^\]]*\]\s*', '', l).strip())
    return out

NUM = {'515': 'five hundred fifteen', '85': 'eighty five', '39': 'thirty nine', '1996': 'nineteen ninety six', '1998': 'nineteen ninety eight',
       '2021': 'twenty twenty one', '2026': 'twenty twenty six', '2027': 'twenty twenty seven', '27': 'twenty seventh', '5.3': 'five point three', '16.5': 'sixteen point five'}
def norm(w):
    w = w.lower().replace('é', 'e').replace('’', "'")
    w = re.sub(r"[^a-z0-9.' ]", ' ', w)
    return [x.strip(".'") for x in w.split() if x.strip(".'")]
def expand(words):
    out = []
    for w in words: out += norm(NUM[w]) if w in NUM else [w]
    return out

lines = script_lines()
ref, owner = [], []
for i, l in enumerate(lines):
    ws = expand(norm(l)); ref += ws; owner += [i] * len(ws)

m = WhisperModel(a.model, device='cpu', compute_type='int8')
segs, info = m.transcribe(a.wav, language='en', word_timestamps=True, beam_size=5, vad_filter=False)
hyp = []
for s in segs:
    for w in s.words:
        for x in expand(norm(w.word)): hyp.append((x, w.start, w.end))
hw = [h[0] for h in hyp]
sm = difflib.SequenceMatcher(a=ref, b=hw, autojunk=False)
r2h = {}
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(i2 - i1): r2h[i1 + k] = j1 + k
    elif tag == 'replace' and (i2 - i1) == (j2 - j1):
        for k in range(i2 - i1): r2h[i1 + k] = j1 + k
res = []
errs = 0
for i, l in enumerate(lines):
    idx = [k for k in range(len(ref)) if owner[k] == i]
    hit = [r2h[k] for k in idx if k in r2h]
    if not hit: res.append({'line': i, 'text': l, 'start': None, 'end': None, 'words': []}); errs += len(idx); continue
    j0, j1 = min(hit), max(hit)
    words = [{'w': ref[k], 't0': round(hyp[r2h[k]][1], 3), 't1': round(hyp[r2h[k]][2], 3)} if k in r2h else {'w': ref[k], 't0': None, 't1': None} for k in idx]
    heard = ' '.join(hw[j0:j1 + 1]); want = ' '.join(ref[k] for k in idx)
    ratio = difflib.SequenceMatcher(a=want.split(), b=heard.split()).ratio()
    miss = sum(1 for k in idx if k not in r2h or ref[k] != hw[r2h[k]])
    errs += miss
    res.append({'line': i, 'text': l, 'start': round(hyp[j0][1], 3), 'end': round(hyp[j1][2], 3), 'words': words, 'heard': heard, 'ratio': round(ratio, 3)})
    flag = '' if ratio > .9 else '   <-- CHECK'
    print(f"{i:2d} {res[-1]['start']:7.2f}-{res[-1]['end']:7.2f} r={ratio:.2f} {l[:60]}{flag}")
    if ratio <= .9: print('      heard:', heard)
print(f'words {len(ref)}, mismatched {errs} ({errs / len(ref):.1%})')
json.dump(res, open(a.out or a.wav.replace('.wav', '.align.json'), 'w'), indent=1)
