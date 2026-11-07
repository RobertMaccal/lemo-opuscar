"""Tighten the silences inside each chosen narration take, keep the designed beats; remap Whisper word times.
Writes voice/seqN.wav (48 kHz mono) and voice/edit.json {seq: {dur, words:[{w,t0,t1}]}}."""
import json, subprocess, os, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(HERE, 'voice'); SR = 48000
W = json.load(open(f'{V}/words.json'))
# (seq, word before the pause) -> target pause length in seconds
HOLD = {('1', 'tape,'): .65, ('1', 'dollars.'): .8, ('1', '2024.'): .75,
        ('2', 'imagination.'): .8, ('2', 'moves.'): 1.1, ('2', 'once.'): .7,
        ('3', 'Guernica.'): .8, ('3', 'everything.'): .55, ('3', 'partition.'): .9, ('3', 'it.'): .6,
        ('4', 'cartons.'): .7, ('4', 'world.'): .8,
        ('5', '2021.'): .55, ('5', 'euros.'): .7, ('5', 'invisible.'): 1.6, ('5', 'obstructions.'): .75, ('5', 'Yes,'): .6,
        ('6', 'banana.'): .7, ('6', 'fruit.'): .6, ('6', 'replaced.'): .7, ('6', 'cents.'): .75,
        ('7', 'think.'): .7, ('7', 'art.'): .7, ('7', 'asking.'): .6,
        ('8', 'ridiculous,'): .7, ('8', 'this.'): 1.0}
out = {}
for sid, v in W.items():
    src = f"{V}/takes/s{sid}{v['take']}.mp3"
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                     capture_output=True, check=True).stdout, dtype=np.float32).copy()
    hop = SR // 100
    rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same')[::hop] + 1e-12)
    db = 20 * np.log10(rms); thr = max(db.max() - 38, -52)
    sil = db < thr
    runs, i = [], 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]: j += 1
            runs.append((i / 100, j / 100)); i = j
        else: i += 1
    voiced = np.where(~sil)[0]; a0, a1 = voiced[0] / 100 - .05, voiced[-1] / 100 + .08
    words = v['words']
    keep = []  # list of (src_start, src_end)
    cur = max(a0, 0)
    for s0, s1 in runs:
        if s0 <= a0 or s1 >= a1 or s1 - s0 < .28: continue
        prev = [w for w in words if w['t1'] <= s0 + .25]
        key = (sid, prev[-1]['w']) if prev else None
        tgt = HOLD.get(key, .45 if s1 - s0 < .8 else .6)
        tgt = min(tgt, s1 - s0)
        pad = tgt / 2
        keep.append((cur, s0 + pad)); cur = s1 - pad
    keep.append((cur, a1))
    pieces, mapping, t = [], [], 0.0
    for k0, k1 in keep:
        seg = x[int(k0 * SR):int(k1 * SR)].copy()
        f = min(len(seg) // 2, int(.006 * SR)); r = np.linspace(0, 1, f)
        if f: seg[:f] *= r; seg[-f:] *= r[::-1]
        pieces.append(seg); mapping.append((k0, k1, t)); t += len(seg) / SR
    y = np.concatenate(pieces)
    TEMPO = 1.03   # pitch-preserving, within normal take-to-take variation
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={TEMPO}',
                                      '-f', 'f32le', '-'], input=y.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, dtype=np.float32)

    def m(tt):
        for k0, k1, o in mapping:
            if tt <= k1: return round((o + max(0, tt - k0)) / 1.03, 3)
        return round(t / 1.03, 3)
    t = len(y) / SR
    sf.write(f'{V}/seq{sid}.wav', y, SR, subtype='FLOAT')
    out[sid] = dict(take=v['take'], dur=round(t, 3), src_dur=round(len(x) / SR, 2),
                    words=[dict(w=w['w'], t0=m(w['t0']), t1=m(w['t1'])) for w in words])
    print(f"S{sid}: {len(x)/SR:5.2f}s -> {t:5.2f}s")
json.dump(out, open(f'{V}/edit.json', 'w'), indent=1)
print('total voice', round(sum(o['dur'] for o in out.values()), 2))
