"""Sound for CPR CLASS GONE WRONG — dialogue, the class's own a cappella chant, foley, room. NO MUSIC of any kind.
Run from the library root after tools/timeline.mjs:  .venv/bin/python films/cpr-class-gone-wrong/mix.py   → $OUT/mix.wav"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('OUT') or os.path.join(HERE, 'out')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio')); import sfx
SR = 48000; O = lambda *p: os.path.join(OUT, *p)
T = json.load(open(O('timeline.json'))); M, LINES, EV, DUR = T['M'], T['L'], T['EV'], T['DUR']
CHJ = json.load(open(O('chant.json')))
N = int((DUR + .3) * SR); rng = np.random.default_rng(7)
db = lambda d: 10 ** (d / 20)
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
def reverb(x, t60=.55, wet=.14, pre=.01):
    k = (t60, pre)
    if k not in _ir:
        n = int(t60 * 1.3 * SR); e = np.exp(-6.9 * np.arange(n) / (t60 * SR)); r = np.random.default_rng(int(t60 * 1000))
        ir = np.stack([r.standard_normal(n) * e, r.standard_normal(n) * e], 1); ir = filt(ir, 'low', 6000); ir = filt(ir, 'high', 200); ir /= np.sqrt((ir ** 2).sum(0)).max()
        _ir[k] = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    x = st(x); ir = _ir[k]; w = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1)
    out = np.zeros_like(w); out[:len(x)] = x * (1 - wet * .4); return out + w * wet
evs = lambda k: [e for e in EV if e['type'] == k]
ROOM = (.55, .13)   # one classroom, one room sound

# ---------------- dialogue ----------------
VO = np.zeros((N, 2))
PAN = {'TEACHER': .18, 'KYLE': 0, 'GUS': -.1, 'CHRISTOPHER': .05, 'VICTOR': -.15}
for l in LINES:
    x, sr = sf.read(O('vo_trim', l['id'] + '.wav')); assert sr == SR
    x = sfx.compress(x, thr=.2, ratio=2.5); x = filt(x, 'high', 90)
    put(VO, reverb(x, *ROOM), l['t0'], db(-1), PAN.get(l['who'], 0))

# ---------------- the chant (the class's own voices; no instruments) ----------------
CHN = np.zeros((N, 2)); C0 = M['C0']; stop = M['STOP'] + .03
for v, pan in CHJ['pan'].items():
    x, sr = sf.read(O('chant', v + '.wav')); x = sfx.compress(x, thr=.25, ratio=2.2); x = filt(x, 'high', 110)
    put(CHN, x, C0, db(-3 if v == 'vol' else -4), pan * .8)
cut = int(stop * SR); CHN[cut:] = 0; f = int(.03 * SR); CHN[cut - f:cut] *= np.linspace(1, 0, f)[:, None]
CHN = reverb(CHN, .6, .2)[:N]
CHN *= np.interp(np.arange(N) / SR, [0, M['stopT'] - .05, M['stopT'] + .15, DUR + 1], [db(-1.5), db(-1.5), db(-6), db(-6)])[:, None]   # the teacher's yell cuts through

# ---------------- foley ----------------
FX = np.zeros((N, 2))
def steps(t0, t1, hz, gain, pan=0, v=.8):
    t = t0
    while t < t1: put(FX, filt(sfx.step(v), 'low', 2600), t + rng.uniform(-.02, .02), db(gain + rng.uniform(-2, 1)), pan); t += 1 / hz
def scrape(d=.35, v=1.0):
    x = filt(sfx.noise(d), 'band', [300, 1400]) * (1 + .6 * np.sin(np.linspace(0, 40, int(d * SR)))) ; return fade(x * np.hanning(len(x)) * v, .01, .05)
def cloth(d=.3): x = filt(sfx.noise(d), 'band', [900, 4500]); return fade(x * np.hanning(len(x)), .01, .05)
def mani_click(v=1.0):   # the training manikin's chest: a plastic click + a soft spring thump
    c = sfx.click(1.6, 1) * .7; th = sfx.thump(.8, 95)[:int(.12 * SR)]; n = max(len(c), len(th)); out = np.zeros(n); out[:len(c)] += c; out[:len(th)] += th * .9; return out * v
def clap():
    x = filt(sfx.noise(.09), 'band', [900, 3500]) * np.exp(-sfx.t_(.09) / .018); return x
def snap(): x = filt(sfx.noise(.05), 'band', [2500, 7000]) * np.exp(-sfx.t_(.05) / .008); return x
def knock(): return sfx.clack(.8, .9)
def squeak(d=.18):
    t = sfx.t_(d); f = 2200 + 900 * np.sin(np.pi * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(t)) * .5
for e in evs('comp'): put(FX, reverb(mani_click(), .4, .1), e['t'] - .02, db(-16 if e['k'] < 0 else -13), .02)
for e in evs('tap'): put(FX, filt(sfx.thump(.7, 75), 'low', 900), e['t'], db(-21 + rng.uniform(-2, 1)), .4 if e['v'] == 'tom' else -.55)
for e in evs('desk'): put(FX, reverb(knock(), .5, .15), e['t'], db(-20), .05)
for e in evs('clap'):
    for k in range(5): put(FX, clap(), e['t'] + rng.uniform(-.025, .03), db(-21 + rng.uniform(-3, 1)), rng.uniform(-.7, .7))
for e in evs('snap'): put(FX, snap(), e['t'] + rng.uniform(-.01, .02), db(-24), .6)
# Kyle: hand up, chair, walk, kneel, hands on the chest
put(FX, cloth(.25), M['hand'] - .05, db(-22), .1)
for e in evs('chair'): put(FX, scrape(.3, .9), e['t'], db(-23), .1)
for e in evs('chairBack'): put(FX, scrape(.45), e['t'], db(-20), .1)
steps(M['walk'] + .1, M['kneel'] - .1, 3.0, -17, .2)
for e in evs('kneel'): put(FX, sfx.thump(.7, 60), e['t'] + .15, db(-17)); put(FX, sfx.thump(.6, 55), e['t'] + .4, db(-19))
put(FX, cloth(.2), M['hands'], db(-19)); put(FX, cloth(.3), M['hands'] - .25, db(-23))
# the interruption: a creak, a chair
for e in evs('creak'): put(FX, sfx.creak(.5), e['t'], db(-27), -.4)
put(FX, cloth(.3), M['lastComp'] + .1, db(-19)); put(FX, cloth(.35), M['up'], db(-18)); steps(M['stood'] - .1, M['stood'] + .5, 4, -19, 0)
# dance cloth swishes on the off-beats
t = M['stood']; B = CHJ['beat']
while t < M['STOP']: put(FX, cloth(.18), t, db(-27), rng.uniform(-.3, .3)); t += B
put(FX, squeak(), M['freeze'] - .05, db(-24))
# donor: chair, footsteps
for e in evs('chairV'): put(FX, scrape(.4), e['t'], db(-22), -.3)
steps(M['vic'] + .05, M['vicArrive'], 3.2, -17, -.3)
for e in evs('sniff'): put(FX, fade(filt(sfx.noise(.28), 'band', [1500, 6000]) * np.hanning(int(.28 * SR)), .02, .05), e['t'], db(-31), .5)
for e in evs('finger'): put(FX, cloth(.15), e['t'], db(-26))
# the pen: the only sound in the room
for e in evs('pen'):
    for q, p, g in ((0, 1.9, -12), (.11, 2.2, -17), (.19, 2.5, -22), (.25, 2.7, -27)): put(FX, reverb(sfx.click(p, 1), .7, .3), e['t'] + .36 + q, db(g), .15)
FX = reverb(FX, .45, .1)[:N]

# ---------------- room: tone, birds through the window, a far hallway ----------------
AMB = np.zeros((N, 2))
tone = filt(sfx.brown(DUR + 1), 'low', 400); tone = tone / np.abs(tone).max(); put(AMB, fade(np.stack([tone, np.roll(tone, 999)], 1), .5, .5), 0, db(-37))
hall = filt(sfx.noise(DUR + 1), 'band', [300, 900]); hall /= np.abs(hall).max(); put(AMB, hall, 0, db(-49), -.6)
def chirps(t0, t1, n, gain):
    for _ in range(n):
        at = rng.uniform(t0, t1); f0 = rng.uniform(2800, 5200); pan = rng.uniform(-.8, -.3)
        for k in range(rng.integers(2, 5)):
            d = rng.uniform(.05, .1); tt = sfx.t_(d); f = f0 + rng.uniform(-500, 700) * tt / d + 300 * np.sin(2 * np.pi * 28 * tt)
            put(AMB, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(tt)), at + k * rng.uniform(.1, .16), db(gain + rng.uniform(-6, 0)), pan)
chirps(0, DUR - 3, 18, -38)
# a clock that you only hear in the silences
t = M['freeze']
while t < DUR - .5:
    put(AMB, sfx.click(1.3, .6), t, db(-36 if t < M['silence'] else -31), .3); t += 1.0
# silences: dead after STOP, the room comes back; and the final black is truly silent
g = np.interp(np.arange(N) / SR, [0, M['STOP'], M['STOP'] + .05, M['STOP'] + .7, M['STOP'] + 1.4, M['black'] - .05, M['black'], DUR + 1], [1, 1, .12, .12, 1, 1, 0, 0])
AMB *= g[:, None]

MIX = VO + CHN * db(-1) + FX + AMB
MIX[int(M['black'] * SR):] *= 0
MIX = MIX / np.abs(MIX).max() * .95
MIX = np.stack([sfx.limit(MIX[:, 0], .5, .003), sfx.limit(MIX[:, 1], .5, .003)], 1)   # tame TTS peaks before loudnorm
peak = np.abs(MIX).max(); MIX = MIX / peak * .89
sf.write(O('mix.wav'), MIX.astype(np.float32), SR, subtype='FLOAT')
print('mix', round(len(MIX) / SR, 2), 's, peak before norm', round(float(peak), 3))
