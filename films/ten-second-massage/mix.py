"""Sound for THE 10-SECOND MASSAGE: dialogue, Chopin (CC0 Musopen recording), procedural foley and room tone → out/mix.wav
Run from the library root:  .venv/bin/python films/ten-second-massage/mix.py   (after tools/timeline.mjs)"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('OUT') or os.path.join(HERE, 'out')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio')); import sfx
SR = 48000; O = lambda *p: os.path.join(OUT, *p)
T = json.load(open(O('timeline.json'))); M, LINES, EV, DUR = T['M'], T['L'], T['EV'], T['DUR']
N = int((DUR + .5) * SR); rng = np.random.default_rng(23)
db = lambda d: 10 ** (d / 20)
line = {l['id']: l for l in LINES}
def load(p, mono=False):
    x, sr = sf.read(p, always_2d=True); assert sr == SR, p
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
_ir = {}
def reverb(x, t60=.45, wet=.12, pre=.008):
    k = (t60, pre)
    if k not in _ir:
        n = int(t60 * 1.3 * SR); e = np.exp(-6.9 * np.arange(n) / (t60 * SR)); r = np.random.default_rng(int(t60 * 1000))
        ir = np.stack([r.standard_normal(n) * e, r.standard_normal(n) * e], 1); ir = filt(ir, 'low', 5500); ir = filt(ir, 'high', 200); ir /= np.sqrt((ir ** 2).sum(0)).max(); _ir[k] = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    x = st(x); ir = _ir[k]; w = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1)
    out = np.zeros_like(w); out[:len(x)] = x * (1 - wet * .4); return out + w * wet
def env_gain(pts):
    t = np.arange(N) / SR; return db(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))
# pan from the picture: screen x of a character in the wide → −1..1 (kept narrow: it is a phone film)
pan_x = lambda x: float(np.clip((x - 540) / 540, -1, 1)) * .35

# ---------------- dialogue: one small warm living room ----------------
VO = np.zeros((N, 2)); VOX = {l['id']: load(O('vo_trim', l['id'] + '.wav'), mono=True) for l in LINES}
PAN = {'h1': .1, 'w2': -.12, 'h3': .06, 'w4': -.06, 'h5': .12, 'h6': .1, 'h7': 0}
for l in LINES:
    x = sfx.compress(VOX[l['id']], thr=.2, ratio=2.5); x = filt(x, 'high', 90)
    put(VO, reverb(x, .42, .11), l['t0'], db(-1), PAN.get(l['id'], 0))

# ---------------- music: Chopin, Nocturne in E-flat major Op. 9 No. 2 (Musopen, CC0) ----------------
CH = load(O('src', 'chopin.wav'))
_w = int(.5 * SR); _e = np.sqrt(np.maximum(fftconvolve((CH ** 2).mean(1), np.ones(_w) / _w, 'same'), 0)) + 1e-5; _g = np.clip((db(-19) / _e) ** .62, .5, db(18))
_g = fftconvolve(_g, np.ones(_w) / _w, 'same'); CH = CH * _g[:, None]; CH = CH / max(1, np.abs(CH).max() / .95)
seg = lambda a, b: CH[int(a * SR):int(b * SR)]
MUS = np.zeros((N, 2))
# 1. the theme from its first note, under the montage and the request; it falls away as his face does
S0 = .9; fr = M['freeze']; put(MUS, fade(seg(S0, S0 + fr + .5), .01, .45), 0)
g1 = env_gain([(0, -1), (fr - .02, -1), (fr + .35, -40), (DUR + 1, -40)])
MUS *= g1[:, None]
# 2. it comes back while he talks his way out, so that the theme's second, ornamented statement starts with his hands
M2 = np.zeros((N, 2)); A2 = 30.1; t2 = M['excuse'] + .25; s2 = A2 - (M['rub0'] - t2)
put(M2, fade(seg(s2, A2 + (M['rub1'] - M['rub0']) + .5), 1.2, .5), t2)
M2 *= env_gain([(0, -8), (t2, -8), (M['rub0'] - .6, -8), (M['rub0'], 0), (M['rub1'] + .2, 0), (M['rub1'] + .5, -40), (DUR + 1, -40)])[:, None]; MUS += M2
# 3. the flourish: the cadenza's high run under "There you go, honey!", cut dead on the stare
M3 = np.zeros((N, 2)); t3 = M['rub1'] + .3; A3 = 231.2
put(M3, fade(seg(A3, A3 + (M['stare'] - t3) + .2), .4, .0), t3)
cut = int(M['stare'] * SR); M3[cut:] = 0; M3[cut - int(.012 * SR):cut] *= np.linspace(1, 0, int(.012 * SR))[:, None]
M3 *= env_gain([(0, -2), (DUR + 1, -2)])[:, None]; MUS += M3
# duck under every line (about 6 dB), smoothly
duck = np.zeros(N)
for l in LINES: a, b = int((l['t0'] - .15) * SR), int((l['t1'] + .2) * SR); duck[max(0, a):b] = 1
k = int(.18 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same'); MUS *= db(-6.5 * duck)[:, None]

# ---------------- foley (all procedural) ----------------
FX = np.zeros((N, 2)); AMB = np.zeros((N, 2))
def cloth(d=.35, v=1.0, lo=900, hi=5200, shape=2.0):
    x = filt(sfx.noise(d), 'band', [lo, hi]); e = np.sin(np.linspace(0, np.pi, len(x))) ** shape; return fade(x * e * v, .005, .03)
def rub(d=.5, v=1.0):        # palms working a shoulder through a sweater: soft, low, a little grainy
    x = filt(sfx.noise(d), 'band', [250, 2600]) + filt(sfx.noise(d), 'band', [2500, 6000]) * .25
    e = np.sin(np.linspace(0, np.pi, len(x))) ** 1.5 * (.75 + .25 * np.sin(np.linspace(0, 23, len(x)))); return x * e * v
def creak(v=1.0, f=180, d=.45):
    t = sfx.t_(d); fm = f * (1 + .12 * np.sin(2 * np.pi * 3.3 * t)) * (1 + .3 * t); ph = 2 * np.pi * np.cumsum(fm) / SR
    x = np.sign(np.sin(ph)) * .3 + np.sin(ph * 2.01) * .4; x = filt(x * (rng.random(len(t)) > .35), 'band', [300, 2400]); return fade(x * np.sin(np.linspace(0, np.pi, len(t))) ** .7 * v, .01, .12)
def cushion(v=1.0):          # someone settles into a cushion: a soft whump plus fabric
    th = filt(sfx.noise(.35), 'low', 220) * np.exp(-sfx.t_(.35) / .09) * 2.2; c = cloth(.3, .4 * v, 600, 3000); th[:len(c)] += c; return th * v
def pat(v=1.0): return filt(sfx.noise(.08), 'band', [300, 1800]) * np.exp(-sfx.t_(.08) / .015) * 1.6 * v
def breath(d=.9, v=1.0, lo=500, hi=2400):
    x = filt(sfx.noise(d), 'band', [lo, hi]); e = np.sin(np.linspace(0, np.pi, len(x))) ** 1.2 * np.linspace(1, .5, len(x)); return fade(x * e * v, .05, .2)
def step(v=1.0, soft=True): x = filt(sfx.step(v), 'low', 1600 if soft else 2600); return x
def steps(t0, t1, hz, gain, pan=0, soft=True):
    t = t0
    while t < t1: put(FX, step(.8, soft), t + rng.uniform(-.02, .02), db(gain + rng.uniform(-2, 1)), pan); t += 1 / hz
def chirp(at, gain, pan=0, f0=4200, n=2):
    for k in range(n):
        d = .07 + .02 * k; t = sfx.t_(d); f = f0 * (1 + .25 * t / d) + 260 * np.sin(2 * np.pi * 30 * t)
        put(AMB, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(t)), at + k * .13, db(gain - k * 1.5), pan)
def birds(t0, t1, n, gain):
    for _ in range(n): chirp(rng.uniform(t0, t1), gain + rng.uniform(-6, 0), rng.uniform(-.6, -.1), rng.uniform(3000, 5200), int(rng.integers(1, 4)))
def paper(d=.22): x = filt(sfx.noise(d), 'band', [1800, 7000]); return fade(x * np.abs(np.sin(np.linspace(0, 8, len(x)))) ** 2, .01, .06)

# room tone + the evening outside (the window is screen-left)
tone = filt(sfx.noise(DUR + .5), 'low', 300) * .5 + filt(sfx.noise(DUR + .5), 'band', [300, 1200]) * .08
put(AMB, fade(tone[:int(M['black'] * SR)], .3, .08), 0, db(-37))
birds(.4, M['freeze'], 9, -36); birds(M['bird'] + .6, M['esc'] + 1.5, 5, -33); birds(M['excuse'], M['rub1'], 6, -39)

# 1. montage: her hands working, his couch sighs, the calendar page
f, t, ph = 1.05, .15, 0
while t < M['pat']:
    put(FX, rub(.55, .9), t, db(-29 + rng.uniform(-1.5, 1)), .05); t += 1 / f
for k in ('d2', 'd3', 'now'):
    put(FX, creak(.7, 150 + 30 * rng.random()), M[k] + .15, db(-31), .08); put(FX, paper(), M[k] + .02, db(-31), .25)
for k, a in (('d2', .6), ('d3', .35)): put(FX, breath(1.1, 1, 300, 1600), M[k] + a, db(-31), .08)
put(FX, pat(), M['pat'], db(-22), .05); put(FX, pat(.9), M['pat'] + .27, db(-23), .05); put(FX, cloth(.3, .7), M['lift'], db(-29))
# 2. she walks round the couch (socks on wood), sits
steps(M['walk0'] + .3, M['walk0'] + 3.3, 2.3, -27, -.15); put(FX, cushion(), M['walk0'] + 3.55, db(-21), -.15); put(FX, creak(.6, 140), M['walk0'] + 3.6, db(-30), -.15)
# 3. the bird; the sneak; the sleeve
put(FX, cloth(.22, 1, 700, 4000), M['bird'] + .05, db(-25), .08)   # the arm goes up
chirp(M['win'] + .34, -19, -.3, 4400, 2); chirp(M['win'] + .66, -20, -.3, 4700, 3)
e = M['esc']; put(FX, creak(.8, 160, .6), e + .4, db(-27), .1); put(FX, cloth(.4, .8), e + .45, db(-28), .1)
for a, gn in ((e + 1.32, -29), (e + 2.2, -28), (e + 2.62, -27)): put(FX, step(.6), a, db(gn), .3)
g = M['grab']; put(FX, cloth(.09, 1.6, 1200, 7000, 1), g, db(-15), .2); put(FX, cloth(.25, .9, 500, 2500), g + .05, db(-23), .2)
put(FX, cloth(.16, 1, 900, 5000), M['cuff'] + .1, db(-24), .1)
put(FX, step(.7), M['excuse'] + .72, db(-24), .3)                    # the lifted foot comes down
# 4. excuses; she lets go and slides across; he walks round behind her
put(FX, cloth(.25, .8), M['release'], db(-26), .1); put(FX, cushion(.7), M['release'] + .75, db(-25)); put(FX, cloth(.5, .6, 500, 2600), M['release'] + .45, db(-29))
r0 = M['release'] + .25; steps(r0 + .1, r0 + 2.05, 2.6, -25, .2)
for a in (.08, .3): put(FX, cloth(.24, .7, 600, 3500), M['roll'] + a, db(-27))
# 5. the massage: hands land, ten seconds of rubs that get smaller, two tiny squeezes, her exhale
r = M['rub0']; put(FX, pat(1.1), r, db(-21)); put(FX, cloth(.2, .7), r + .02, db(-27))
fk = [(0, 2.3), (2, 2.1), (4, 1.6), (6, 1.05), (8, .7), (10, .6)]; ak = [(0, 9.5), (2, 9.5), (4, 8), (5, 6), (6, 4.5), (7, 3), (8, 2), (10, 1.4)]
fi = lambda u: np.interp(u, [a for a, _ in fk], [b for _, b in fk]); ai = lambda u: np.interp(u, [a for a, _ in ak], [b for _, b in ak])
u, ph, nxt = 0, 0, 0
while u < 10:
    ph += fi(u) / 200; u += 1 / 200
    if ph >= nxt:
        nxt += .5; a = ai(u) / 9.5
        if u < 9.9: put(FX, rub(.32, 1), r + u, db(-27 + 20 * np.log10(max(a, .15))), (-.06, .06)[int(nxt * 2) % 2])
for s in (8.55, 9.35): put(FX, cloth(.12, .7, 600, 2600), r + s - .05, db(-28))
put(FX, breath(1.4, 1, 350, 1800), r + 1.05, db(-31), -.05); put(FX, breath(1.6, 1, 300, 1500), r + 5.2, db(-33), -.05)
# 6. hands off, a step back, the flex (hoodie stretch), the line; then nothing
put(FX, cloth(.18, .7), M['rub1'], db(-27)); steps(M['step'] + .05, M['step'] + .5, 4, -27, .05)
put(FX, cloth(.32, 1.2, 700, 5000, 1.2), M['flex'] + .05, db(-20)); put(FX, cloth(.18, 1, 900, 5000), line['h7']['t0'] + 1.55, db(-25))
put(FX, cloth(.45, .5, 500, 2400), M['stare'] + .9, db(-34), -.05)    # her head turns
chirp(M['stare'] + 2.35, -41, -.5, 3900, 1)                                  # far away, outside: a bird

# ---------------- master ----------------
mix = VO + MUS + FX + AMB
b = int(M['black'] * SR); mix[b:] = 0; mix[b - int(.01 * SR):b] *= np.linspace(1, 0, int(.01 * SR))[:, None]
mix = mix[:int(DUR * SR)]
mix = np.stack([sfx.limit(mix[:, 0] * 1.4, .92), sfx.limit(mix[:, 1] * 1.4, .92)], 1)
os.makedirs(OUT, exist_ok=True); sf.write(O('mix.wav'), mix, SR, subtype='PCM_16')
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix.wav', round(len(mix) / SR, 2), 's  peak', round(float(np.abs(mix).max()), 3), ' rms dB: voice', round(rms(VO[np.abs(VO).max(1) > .01]), 1), 'music', round(rms(MUS), 1), 'fx', round(rms(FX), 1), 'amb', round(rms(AMB), 1))
for a, bb in [('d1', 'freeze'), ('freeze', 'bird'), ('bird', 'hey'), ('hey', 'rub0'), ('rub0', 'rub1'), ('rub1', 'stare'), ('stare', 'black')]:
    i, j = int(M[a] * SR), int(M[bb] * SR); print(f"{a:7s} mix {rms(mix[i:j]):6.1f}  voice {rms(VO[i:j]):6.1f}  music {rms(MUS[i:j]):6.1f}  fx {rms(FX[i:j]):6.1f}  amb {rms(AMB[i:j]):6.1f}")
