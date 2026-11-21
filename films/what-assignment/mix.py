"""Sound for WHAT ASSIGNMENT?: dialogue, an original pizzicato cue, Mozart's Lacrimosa (Bruno Walter 1956, public domain), foley → out/mix.wav
Run from the library root after tools/timeline.mjs:  .venv/bin/python films/what-assignment/mix.py"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('OUT') or os.path.join(HERE, 'out')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio')); sys.path.insert(0, LIB)
import sfx
from core.audio import sampler as SM
SR = 48000; A = lambda *p: os.path.join(HERE, 'audio', *p); O = lambda *p: os.path.join(OUT, *p)
T = json.load(open(O('timeline.json'))); M, LINES, EV, DUR = T['M'], T['L'], T['EV'], T['DUR']
N = int(DUR * SR); rng = np.random.default_rng(204)
db = lambda d: 10 ** (d / 20)
line = {l['id']: l for l in LINES}

def load(p, mono=False):
    x, sr = sf.read(p, always_2d=True)
    if sr != SR: x = resample_poly(x, SR, sr, axis=0)
    return x.mean(1) if mono else (x if x.shape[1] == 2 else np.repeat(x, 2, 1))
def st(x): return x if x.ndim == 2 else np.stack([x, x], 1)
def put(buf, x, at, gain=1.0, pan=0.0):
    x = st(x); i = int(round(at * SR))
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n <= 0: return
    buf[i:i + n, 0] += x[:n, 0] * gain * min(1, 1 - pan); buf[i:i + n, 1] += x[:n, 1] * gain * min(1, 1 + pan)
def fade(x, a=.01, b=.01):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] = (x[:na].T * np.linspace(0, 1, na)).T
    if nb: x[-nb:] = (x[-nb:].T * np.linspace(1, 0, nb)).T
    return x
def filt(x, kind, f, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x, axis=0)
def reverb(x, t60=.6, wet=.2, pre=.012, seed=1):
    n = int(t60 * 1.3 * SR); e = np.exp(-6.9 * np.arange(n) / (t60 * SR)); r = np.random.default_rng(seed)
    ir = np.stack([r.standard_normal(n) * e, r.standard_normal(n) * e], 1); ir = filt(ir, 'low', 6500); ir = filt(ir, 'high', 180); ir /= np.sqrt((ir ** 2).sum(0)).max()
    ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir]); x = st(x)
    w = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1); out = np.zeros_like(w); out[:len(x)] = x * (1 - wet * .4); return out + w * wet
def env_gain(pts):
    t = np.arange(N) / SR; return db(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))

# ---------------- dialogue: a hallway, small and woody ----------------
VO = np.zeros((N, 2)); PAN = {'RAY': -.1, 'KAI': .1}
for l in LINES:
    x = load(O('vo_trim', l['id'] + '.wav'), mono=True); x = sfx.compress(x, thr=.2, ratio=2.5); x = filt(x, 'high', 85)
    put(VO, reverb(x, .55, .12, seed=3), l['t0'], db(-1), PAN[l['who']])

# ---------------- music 1: original pizzicato cue (VSCO 2 CE, CC0), cut dead on "What" ----------------
SM.seed(7); bpm = 128; b = 60 / bpm; ev = []
mel = [  # (beat, pitch, len in beats, vel)
    (0, 'F5', .4, .8), (1, 'A5', .4, .7), (2, 'C6', .3, .8), (2.5, 'A5', .3, .65), (3, 'F5', .4, .75),
    (4, 'G5', .4, .8), (5, 'A#5', .4, .7), (6, 'D6', .3, .8), (6.5, 'A#5', .3, .65), (7, 'G5', .4, .75),
    (8, 'A5', .3, .75), (8.5, 'C6', .3, .7), (9, 'F6', .3, .85), (9.5, 'C6', .3, .7), (10, 'A5', .4, .75), (11, 'G5', .3, .7), (11.5, 'F5', .3, .7),
    (12, 'E5', .3, .75), (12.5, 'G5', .3, .72), (13, 'C6', .3, .78), (13.5, 'E6', .3, .82), (14, 'G6', .3, .85), (14.5, 'E6', .3, .75), (15, 'C6', .3, .78), (15.5, 'A#5', .3, .75),
]
for bt, p, ln, v in mel: ev.append((bt * b, 'violins_pizz', p, ln * b, v, -.2))
for bt, p, ln, v in mel[10:]: ev.append((bt * b, 'clarinet_stac', p, ln * b * .8, v * .55, .25))          # the clarinet joins for the second half
bass = [('F2', 'A3', 'C4'), ('A#1', 'D4', 'F4'), ('F2', 'A3', 'C4'), ('C2', 'E4', 'A#4')]
for bar, (lo, c1, c2) in enumerate(bass):
    for k in range(4):
        t0 = (bar * 4 + k) * b
        if k % 2 == 0: ev.append((t0, 'contrabass_pizz', lo if k == 0 else SM.name(SM.midi(lo) + 7), b * .8, .85, 0))
        else: ev += [(t0, 'violas_pizz', c1, b * .4, .55, .3), (t0, 'violas_pizz', c2, b * .4, .5, .35), (t0 + b * .5, 'bassoon_stac', SM.name(SM.midi(lo) + 12), b * .3, .5, -.1)]
ev += [(0, 'flute_stac', 'F6', .2, .5, .3), (8 * b, 'flute_stac', 'A6', .2, .5, .3)]
CUE = SM.render(ev, dur=M['musicCut'] + 2); CUE = SM.room(CUE, size=.35, mix=.16)
MUS = np.zeros((N, 2)); put(MUS, fade(CUE[:int(M['musicCut'] * SR)], .005, .012), 0)
ve = np.abs(VO).max(1); w = int(.1 * SR); ve = np.convolve(ve, np.ones(w) / w, 'same'); ve = np.convolve(ve, np.ones(w * 3) / (w * 3), 'same')
MUS *= (1 - np.clip(ve * 8, 0, 1) * .55)[:, None]
r = np.sqrt(np.mean(CUE[:int(M['musicCut'] * SR)] ** 2)) + 1e-9; MUS *= db(-29) / r

# ---------------- music 2: Lacrimosa, from the forte of "judicandus homo reus"; cut dead on the cut to black ----------------
LAC = load(A('src', 'lacrimosa.wav')); L0 = 42.55; d = M['black'] - M['hit']
seg = LAC[int(L0 * SR):int((L0 + d + .01) * SR)].copy()
seg = filt(seg, 'high', 70); seg = seg + filt(seg, 'low', 180) * .35                  # a little weight for an old live recording
seg = np.stack([sfx.compress(seg[:, 0], thr=.12, ratio=2.2), sfx.compress(seg[:, 1], thr=.12, ratio=2.2)], 1)
seg = reverb(seg, 1.6, .16, seed=9)[:len(seg)]
seg *= db(-18) / (np.sqrt(np.mean(seg ** 2)) + 1e-9)
put(MUS, fade(seg, .006, .012), M['hit'])

# ---------------- foley and ambience ----------------
FX = np.zeros((N, 2)); AMB = np.zeros((N, 2))
def chirps(t0, t1, n, gain):
    for _ in range(n):
        at = rng.uniform(t0, t1); f0 = rng.uniform(2600, 5200); pan = rng.uniform(-.7, .7)
        for k in range(rng.integers(2, 6)):
            dd = rng.uniform(.05, .11); t = sfx.t_(dd); f = f0 + rng.uniform(-500, 700) * t / dd + 300 * np.sin(2 * np.pi * 28 * t)
            put(AMB, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(t)), at + k * rng.uniform(.1, .16), db(gain + rng.uniform(-6, 0)), pan)
def paper(dd=.25): x = filt(sfx.noise(dd), 'band', [1800, 7000]); return fade(x * np.abs(np.sin(np.linspace(0, 9, len(x)))) ** 2, .01, .08)
# room tone + far chatter + birds through the windows, until the doom; then only the room
tone = filt(sfx.brown(DUR), 'low', 400); tone = st(tone / (np.abs(tone).max() + 1e-9))
put(AMB, tone * env_gain([(0, -40), (M['hit'], -40), (M['hit'] + .3, -46), (DUR, -46)])[:, None], 0)
walla = np.zeros(int(M['musicCut'] * SR + SR))
for k in range(16):
    l = LINES[k % len(LINES)]; x = load(O('vo_trim', l['id'] + '.wav'), mono=True); x = resample_poly(x, 100, int(100 * rng.uniform(.84, 1.2)))
    at = int(rng.uniform(-1, len(walla) / SR) * SR); x = x[max(0, -at):]; at = max(0, at); m = min(len(x), len(walla) - at)
    if m > 0: walla[at:at + m] += x[:m] * rng.uniform(.4, 1)
walla = reverb(filt(walla, 'low', 1500), 1.3, .6, seed=5); put(AMB, fade(walla[:int((M['musicCut'] + .1) * SR)], .4, .25), 0, db(-37))
chirps(0, M['musicCut'], 7, -36)
# the paper, out of the jacket
put(FX, paper(.3), M['b3pre'] + .1, db(-22), .15); put(FX, paper(.18), line['b3']['t0'] + .3, db(-24), .1)
# silence: the clock ticks, then the heads turn
ss_t = [M['bell'] - k for k in range(1, 12) if M['musicCut'] + .1 < M['bell'] - k < M['hit']]
for t in ss_t: put(FX, reverb(sfx.click(1.6, .6), .4, .2), t, db(-23), -.05)
put(FX, filt(sfx.whoosh(.35, .5), 'low', 2500), M['heads'] - .02, db(-24))
# the hit: a low thump under the choir; the paper lands
put(FX, sfx.thump(1, 46), M['hit'], db(-9)); put(FX, filt(sfx.rumble(1.4, .6), 'low', 200), M['hit'], db(-18))
put(FX, paper(.12), M['hit'] + 1.58, db(-30), -.1)
# black: the bell. 9:00.
bell = load(A('sfx_raw', 'bell.wav')); bell = fade(bell[:int((DUR - M['bell']) * SR)], .005, .35); put(FX, reverb(bell, .9, .25, seed=12)[:len(bell)], M['bell'], db(-6) / (np.abs(bell).max() + 1e-9) * .9)

mix = VO + MUS + FX + AMB
mix = fade(mix, .02, .03)
pk = np.abs(mix).max(); mix = mix / max(1, pk / .95)
sf.write(O('mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for nm, x in [('VO', VO), ('MUS', MUS), ('FX', FX), ('AMB', AMB)]: print(nm, f'{20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9):.1f} dB rms')
print('peak', round(float(pk), 3), 'dur', len(mix) / SR)
