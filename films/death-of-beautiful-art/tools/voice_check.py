"""Transcribe every narration take, score it against the script, pick the best take per sequence.
usage: python tools/voice_check.py   (run from the project folder)"""
import json, re, difflib, os, sys
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEQ = json.load(open(os.path.join(HERE, 'voice', 'script.json')))
model = WhisperModel(os.environ.get('WHISPER_MODEL', 'small.en'), device='cpu', compute_type='int8')
def norm(s):
    s = s.lower().replace('-', ' ')
    s = re.sub(r"[^a-z0-9' ]", ' ', s)
    return s.split()
out = {}
for sid, text in SEQ.items():
    best = None
    for take in 'ab':
        f = os.path.join(HERE, 'voice', 'takes', f's{sid}{take}.mp3')
        segs, _ = model.transcribe(f, language='en', word_timestamps=True, beam_size=5,
                                   initial_prompt='Cattelan, Comedian, Sotheby\'s, Duchamp, Guernica, Warhol, Garau, Io Sono, artworld')
        words = [dict(w=w.word.strip(), t0=round(w.start, 3), t1=round(w.end, 3)) for s in segs for w in s.words]
        heard = ' '.join(w['w'] for w in words)
        r = difflib.SequenceMatcher(None, norm(text), norm(heard)).ratio()
        print(f's{sid}{take} sim={r:.3f}\n   heard: {heard}')
        if best is None or r > best['sim'] + 0.005:
            best = dict(take=take, sim=r, words=words, heard=heard)
    out[sid] = best
json.dump(out, open(os.path.join(HERE, 'voice', 'words.json'), 'w'), indent=1)
print({k: (v['take'], round(v['sim'], 3)) for k, v in out.items()})
