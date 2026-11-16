"""The classroom chant: an ORIGINAL a cappella disco chant at 110 BPM, built from each classmate's own ElevenLabs take.
Each take is cut into phrases (whisper word times), pitched onto an A-minor chord pattern, squeezed into its beat slot
and placed on the compression grid with each voice's own looseness. No instruments.
Writes $OUT/chant/<voice>.wav (mono, t = 0 at bar 1 beat 1) and $OUT/chant.json (30 fps mouth envelopes + grid)."""
import os, json, subprocess, numpy as np, soundfile as sf
H = os.path.dirname(os.path.abspath(__file__)); SR = 48000
O = os.environ.get('OUT') or os.path.abspath(os.path.join(H, '..', 'out')); os.makedirs(os.path.join(O, 'chant'), exist_ok=True)
TMP = os.path.join(O, 'chant', 'tmp'); os.makedirs(TMP, exist_ok=True)
BPM = 110; B = 60 / BPM; BAR = 4 * B; NBARS = 9
W = json.load(open(os.path.join(H, 'chant_src', 'words.json')))
FEM = {'maya', 'lena', 'priya'}
# per-voice looseness (s), level (dB), and which bars they sing
VOICES = {
  'vol':   dict(lag=0.000, jit=.012, db=0,  pan=0),
  'maya':  dict(lag=.030,  jit=.030, db=-3, pan=-.35),
  'lena':  dict(lag=-.020, jit=.025, db=-2, pan=-.5),
  'tom':   dict(lag=.045,  jit=.035, db=-4, pan=.45),
  'ben':   dict(lag=.010,  jit=.030, db=-4, pan=.2),
  'sam':   dict(lag=.060,  jit=.040, db=-6, pan=.6),
  'priya': dict(lag=.090,  jit=.040, db=-10, pan=-.15),
  'park':  dict(lag=.050,  jit=.045, db=-7, pan=-.7),
}
# A minor: semitones above A
AH = [0, 0, 3, 7]; PUSH = [7, 7, 3, 0]
def score():
    E = []   # (voice, phrase, bar, beat, slot_beats, semis, gain_db)
    add = lambda vs, ph, bar, beat, slot, semi, g=0: [E.append((v, ph, bar, beat, slot, semi, g)) for v in vs]
    all8 = list(VOICES)
    # bar 1: the volunteer alone, on the compressions
    for k in range(4): add(['vol'], 'ah', 0, k, .9, AH[k])
    # bar 2: + Maya humming
    add(['vol'], 'keep1', 1, 0, 1.8, 7); add(['vol'], 'keep2', 1, 2, 1.8, 3)
    for k in range(4): add(['maya'], 'hum', 1, k, .9, AH[k], -6)
    # bar 3: four voices
    for k in range(4): add(['vol', 'maya', 'lena', 'tom'], 'ah', 2, k, .9, AH[k])
    # bar 4: everyone (two late)
    add(['vol', 'maya', 'lena', 'tom', 'ben', 'sam'], 'keep1', 3, 0, 1.8, 7); add(all8, 'keep2', 3, 2, 1.8, 3)
    # bar 5: "hundred and ten — do it again"
    add(all8, 'hundred', 4, 0, 1.8, 3); add(all8, 'doit', 4, 2, 1.8, 0)
    # bar 6: "push, push, push, push" (he has stopped pushing)
    for k in range(4): add(all8, 'push', 5, k, .9, PUSH[k], 4)
    # bar 7: keep him alive ×2
    add(all8, 'keep1', 6, 0, 1.8, 7); add(all8, 'keep2', 6, 2, 1.8, 3)
    # bar 8: HEY! then "ah, ah" ragged
    add(all8, 'hey', 7, 0, 1.2, 12)
    for k in (2, 3): add(['vol', 'lena', 'ben', 'sam', 'tom'], 'ah', 7, k, .9, AH[k])
    # bar 9: they'd go round again (the teacher cuts it)
    add(all8, 'keep1', 8, 0, 1.8, 7); add(all8, 'keep2', 8, 2, 1.8, 3)
    return E

def words(v):
    w = [x for x in W[v] if x[1] > x[0] or True]; low = [x[2].lower().strip('.,!?') for x in w]; return w, low
def phrases(v, x):
    w, low = words(v); n = len(x) / SR; P = {}
    def span(i, j_end): return (w[i][0], j_end)
    def nxt(i): return w[i + 1][0] if i + 1 < len(w) else n
    if 'mmm' in low: i = low.index('mmm'); P['hum'] = (w[i][0], min(nxt(i), w[i][0] + .5))
    if 'ah' in low: i = low.index('ah'); P['ah'] = (w[i][0], min(nxt(i), w[i][0] + .42))
    ks = [i for i, s in enumerate(low) if s == 'keep']
    if ks: P['keep1'] = (w[ks[0]][0], nxt(ks[0] + 2) if ks[0] + 2 < len(w) else n)
    if len(ks) > 1: P['keep2'] = (w[ks[1]][0], nxt(ks[1] + 2))
    if '110' in low: i = low.index('110'); P['hundred'] = (w[i][0], w[i + 1][0])
    if 'do' in low: i = low.index('do'); P['doit'] = (w[i][0], w[i + 3][0] if i + 3 < len(w) else n)
    if 'push' in low: i = low.index('push'); P['push'] = (w[i][0], min(nxt(i), w[i][0] + .38))
    if 'hey' in low: i = low.index('hey'); P['hey'] = (w[i][0], n)
    if 'keep2' not in P and 'keep1' in P: P['keep2'] = P['keep1']
    return P

def trim(y):
    w = int(.01 * SR); e = np.sqrt(np.convolve(y * y, np.ones(w) / w, 'same')); th = e.max() * .06
    idx = np.where(e > th)[0]
    if not len(idx): return y
    a, b = max(0, idx[0] - int(.012 * SR)), min(len(y), idx[-1] + int(.04 * SR)); y = y[a:b].copy()
    f = min(int(.012 * SR), len(y) // 4); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y
def f0(y):
    """median pitch (Hz) of the voiced frames, by autocorrelation"""
    fr = int(.04 * SR); hop = fr // 2; out = []
    for i in range(0, len(y) - fr, hop):
        s = y[i:i + fr] * np.hanning(fr)
        if np.sqrt(np.mean(s * s)) < .02: continue
        ac = np.correlate(s, s, 'full')[fr - 1:]; lo, hi = int(SR / 520), int(SR / 75)
        k = lo + np.argmax(ac[lo:hi]);
        if ac[k] > .35 * ac[0]: out.append(SR / k)
    return float(np.median(out)) if out else None
def rubber(y, tempo, semis, key):
    p_in, p_out = os.path.join(TMP, key + '_i.wav'), os.path.join(TMP, key + '_o.wav')
    sf.write(p_in, y, SR); pr = 2 ** (semis / 12)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p_in, '-af', f'rubberband=tempo={tempo:.4f}:pitch={pr:.4f}:formant=preserved', p_out], check=True)
    z, _ = sf.read(p_out); return z

rng = np.random.default_rng(110)
LEN = int((NBARS * BAR + 1.5) * SR); stems = {v: np.zeros(LEN) for v in VOICES}
src = {}
for v in VOICES:
    x, sr = sf.read(os.path.join(H, 'chant_src', v + '.wav')); assert sr == SR
    if x.ndim > 1: x = x.mean(1)
    P = phrases(v, x); seg = {}
    for k, (a, b) in P.items():
        y = trim(x[int(a * SR):int(b * SR)]); hz = f0(y); seg[k] = (y, hz)
    src[v] = seg
    print(v, {k: (round(len(s[0]) / SR, 2), round(s[1] or 0)) for k, s in seg.items()})
for i, (v, ph, bar, beat, slot, semi, g) in enumerate(score()):
    if ph not in src[v]: continue
    y, hz = src[v][ph]
    base = 57 if v in FEM else 45                       # A3 for the girls, A2 for the boys
    if hz:
        m = 69 + 12 * np.log2(hz / 440); target = base + semi
        while target - m > 6: target -= 12
        while m - target > 6: target += 12
        sh = float(np.clip(target - m, -7, 7))
    else: sh = 0
    d = len(y) / SR; tempo = max(1.0, d / (slot * B))
    z = rubber(y, tempo, sh, f'{v}_{i}')
    V = VOICES[v]; t = bar * BAR + beat * B + V['lag'] + rng.normal(0, V['jit']) - .02
    j = max(0, int(t * SR)); n = min(len(z), LEN - j)
    stems[v][j:j + n] += z[:n] * 10 ** ((V['db'] + g + rng.uniform(-1.5, 1)) / 20)
env = {}
for v, s in stems.items():
    sf.write(os.path.join(O, 'chant', v + '.wav'), s.astype(np.float32), SR)
    hop = SR // 30; e = np.array([np.sqrt(np.mean(s[k * hop:(k + 1) * hop] ** 2)) for k in range(len(s) // hop)])
    env[v] = [round(float(min(1, q / (e.max() or 1) * 1.3)), 2) for q in e]
json.dump({'bpm': BPM, 'beat': B, 'bar': BAR, 'bars': NBARS, 'env': env, 'pan': {v: VOICES[v]['pan'] for v in VOICES}}, open(os.path.join(O, 'chant.json'), 'w'))
print('chant', round(NBARS * BAR, 2), 's')
