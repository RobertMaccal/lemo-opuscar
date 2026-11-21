"""Sound for WHAT ASSIGNMENT?: dialogue, the Flower Duet from Lakmé (the user's recording) from start to finish, foley → out/mix.wav (no subtitles, no props, straight cut to black)
Run from the library root after tools/timeline.mjs:  .venv/bin/python films/what-assignment/mix.py"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('OUT') or os.path.join(HERE, 'out')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio')); sys.path.insert(0, LIB)
import sfx
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

# ---------------- music: the Flower Duet (the user's recording), one continuous take from first frame to the cut ----------------
# film 0 → source 8.8 s: the source's breath falls between the first two lines, its hush in the silent look,
# and the big soaring swell (source ≈19–20.5 s) lands on the skeleton transformation at the hit.
FD = load(A('src', 'flower_duet.wav'))
S0 = 19.0 - M['hit']                                    # source time at film 0
seg = FD[int(S0 * SR):int((S0 + M['black'] + .01) * SR)].copy()
seg = filt(seg, 'high', 60)
seg *= db(-24) / (np.sqrt(np.mean(seg ** 2)) + 1e-9)
MUS = np.zeros((N, 2)); put(MUS, fade(seg, .35, .012), 0)
# under the dialogue it ducks; in the silent look it sinks so the clock is heard; on the hit it blooms
ve = np.abs(VO).max(1); w = int(.1 * SR); ve = np.convolve(ve, np.ones(w) / w, 'same'); ve = np.convolve(ve, np.ones(w * 3) / (w * 3), 'same')
MUS *= (1 - np.clip(ve * 8, 0, 1) * .55)[:, None]
MUS *= env_gain([(0, -3), (M['s4'], -3), (M['s4'] + .4, -9), (M['hit'] - .05, -9), (M['hit'] + .05, 4), (DUR, 4)])[:, None]

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
# silence: the clock ticks, then the heads turn
ss_t = [M['black'] - k for k in range(1, 12) if M['s4'] < M['black'] - k < M['hit']]
for t in ss_t: put(FX, reverb(sfx.click(1.6, .6), .4, .2), t, db(-23), -.05)
put(FX, filt(sfx.whoosh(.35, .5), 'low', 2500), M['heads'] - .02, db(-24))
# the hit: a low thump under the choir
put(FX, sfx.thump(1, 46), M['hit'], db(-9)); put(FX, filt(sfx.rumble(1.4, .6), 'low', 200), M['hit'], db(-18))

# ---------------- the skeletons ----------------
EVJ = json.load(open(os.path.join(HERE, 'events.json')))['ev']
def bonk(pitch, v):        # dry bone on wood: a short bright clack with a hollow body
    x = sfx.clack(pitch, v); t = sfx.t_(.09); body = np.sin(2 * np.pi * 420 * pitch * t) * np.exp(-t / .018) * .6
    y = np.zeros(max(len(x), len(body))); y[:len(x)] += x; y[:len(body)] += body; return filt(y, 'high', 220)
for e in EVJ:
    if e['type'] == 'xray':                # the flicker: a buzzing zap gated with the picture (15 Hz)
        d = M['skel'] - e['t']; z = filt(sfx.noise(d), 'band', [300, 3200]) * (np.sin(2 * np.pi * 15 * sfx.t_(d)) > 0) + np.sign(np.sin(2 * np.pi * 120 * sfx.t_(d))) * .25
        put(FX, fade(z, .005, .04), e['t'], db(-27))
    elif e['type'] == 'rattle':            # teeth and joints chattering
        t = e['t']
        while t < M['crumble']: put(FX, bonk(rng.uniform(1.6, 2.4), .5), t, db(-26 + rng.uniform(-3, 0)), rng.uniform(-.4, .4)); t += rng.uniform(.03, .05)
    elif e['type'] == 'bone':
        pan = -.25 if e['c'] == 0 else .25
        put(FX, bonk(rng.uniform(1.1, 1.9), .9), e['t'], db(-15 + 6 * (e['v'] - 1) + rng.uniform(-2, 1)), pan + rng.uniform(-.1, .1))
        put(FX, bonk(rng.uniform(1.4, 2.2), .6), e['t'] + rng.uniform(.07, .13), db(-25), pan)       # the small bounce
    elif e['type'] == 'skull':
        pan = -.3 if e['c'] == 0 else .3
        put(FX, bonk(.75, 1), e['t'], db(-9), pan); put(FX, sfx.thump(.8, 95), e['t'], db(-14), pan); put(FX, bonk(.85, .6), e['t'] + .16, db(-19), pan)
# let the bones be heard over the choir
MUS *= env_gain([(0, 0), (M['crumble'] + .1, 0), (M['crumble'] + .25, -5), (DUR, -5)])[:, None]

mix = VO + MUS + FX + AMB
mix = fade(mix, .02, .03)
mix = np.stack([sfx.limit(mix[:, 0], .36), sfx.limit(mix[:, 1], .36)], 1)   # tame the soprano's top notes before loudnorm
pk = np.abs(mix).max(); mix = mix / max(1, pk / .95)
sf.write(O('mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for nm, x in [('VO', VO), ('MUS', MUS), ('FX', FX), ('AMB', AMB)]: print(nm, f'{20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9):.1f} dB rms')
print('peak', round(float(pk), 3), 'dur', len(mix) / SR)
