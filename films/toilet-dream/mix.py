"""Sound for THE TOILET DREAM: an original piano score (Salamander Grand samples) + procedural foley + room tones → out/mix.wav
Run from the library root after `node core/render/events.mjs films/toilet-dream`:  .venv/bin/python films/toilet-dream/mix.py"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB); sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from core.audio import sampler as PNO
import sfx
SR = 48000; OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
EVJ = json.load(open(os.path.join(HERE, 'events.json'))); EV, DUR = EVJ['ev'], EVJ['dur']
N = int(DUR * SR); rng = np.random.default_rng(23); PNO.seed(5)
db = lambda d: 10 ** (d / 20)
evs = lambda k: [e for e in EV if e['type'] == k]
def st(x): return x if x.ndim == 2 else np.stack([x, x], 1)
def put(buf, x, at, gain=1.0, pan=0.0):
    x = st(x); i = int(round(at * SR))
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n > 0: buf[i:i + n, 0] += x[:n, 0] * gain * min(1, 1 - pan); buf[i:i + n, 1] += x[:n, 1] * gain * min(1, 1 + pan)
def fade(x, a=.01, b=.01):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] = (x[:na].T * np.linspace(0, 1, na)).T
    if nb: x[-nb:] = (x[-nb:].T * np.linspace(1, 0, nb)).T
    return x
def filt(x, kind, f, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x, axis=0)
_ir = {}
def reverb(x, t60=.6, wet=.2, pre=.01, lo=180, hi=6500):
    k = (t60, pre, lo, hi)
    if k not in _ir:
        n = int(t60 * 1.3 * SR); e = np.exp(-6.9 * np.arange(n) / (t60 * SR)); r = np.random.default_rng(int(t60 * 1000))
        ir = np.stack([r.standard_normal(n) * e, r.standard_normal(n) * e], 1); ir = filt(filt(ir, 'low', hi), 'high', lo); ir /= np.sqrt((ir ** 2).sum(0)).max(); _ir[k] = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    x = st(x); ir = _ir[k]; w = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1)
    out = np.zeros_like(w); out[:len(x)] = x * (1 - wet * .4); return out + w * wet
t_ = sfx.t_; noise = sfx.noise
def mx(*xs):
    L = max(len(x) for x in xs); o = np.zeros(L)
    for x in xs: o[:len(x)] += x
    return o

# ============================ SCORE ============================
# one original theme: an 8-bar nocturne waltz in F major (3/4). Each section's phrase is timed so the downbeat where it
# should resolve lands on the awakening: the sting takes the resolution's place.
TH = [[('A4', 1), ('C5', 1), ('F5', 1)], [('E5', 2), ('D5', 1)], [('C5', 1), ('A4', 1), ('Bb4', 1)], [('C5', 3)],
      [('D5', 1), ('F5', 1), ('Bb5', 1)], [('A5', 2), ('G5', 1)], [('F5', 1), ('E5', 1), ('G5', 1)], [('F5', 3)]]
BASS = ['F2', 'C2', 'D2', 'C2', 'Bb1', 'A1', 'C2', 'F2']
CH = [['A3', 'C4', 'F4'], ['G3', 'C4', 'E4'], ['A3', 'D4', 'F4'], ['G3', 'Bb3', 'E4'], ['Bb3', 'D4', 'F4'], ['A3', 'C4', 'F4'], ['G3', 'Bb3', 'E4'], ['A3', 'C4', 'F4']]
SC = []   # (t, inst, pitch, dur, vel, pan)
def n(t, p, d, v, pan=0.0): SC.append((t, 'piano', p, d, v, pan))
def tr(p, k): return PNO.midi(p) + k
def bar(t0, beat, i, vm=.4, vl=.26, stac=False, melody=True, lh=True, oct_=False, held=None):
    tt = t0
    if melody:
        for p, b in TH[i]:
            d = beat * b * (.42 if stac else 1.05); n(tt, p, d, vm, .1)
            if oct_: n(tt, tr(p, -12), d, vm * .72, -.05)
            tt += beat * b
    if lh:
        n(t0, BASS[i], beat * 3 if not stac else beat * .9, vl * 1.15, -.25)
        for k in (1, 2): [n(t0 + beat * k, p, beat * (.95 if not stac else .4), vl * .8, -.12) for p in CH[i]]
# A · 0–9 · 80 bpm, soft: theme bars 1–4; bar 4 holds C5, then the pickup that "should" land on 9.0
b = .75
for i in range(3): bar(i * 3 * b, b, i, .36, .22)
n(6.75, 'C5', 1.5, .36, .1); n(6.75, 'C2', 2.25, .26, -.25); [n(6.75 + b, p, 1.4, .2, -.12) for p in ('G3', 'Bb3', 'E4')]
n(8.25, 'D5', .36, .34, .1); n(8.625, 'E5', .36, .38, .1)
# B · 11.75–23.0 · hesitant: staccato theme with gaps, thin left hand, a C7 approach that never lands
t0 = 11.75
for k, i in enumerate([0, 1, 2]): bar(t0 + k * 3 * b, b, i, .3, .2, stac=True)
n(t0 + 9 * b, 'C5', .5, .3, .1); n(t0 + 9 * b, 'C2', 1.2, .22, -.25); n(t0 + 11 * b, 'Bb4', .4, .26, .1)
t7 = t0 + 12 * b; [n(t7 + j * b, p, b * 1.05, .32 + j * .03, .1) for j, (p, _) in enumerate(TH[6])]; n(t7, 'C2', 2.2, .24, -.25); [n(t7 + b, p, 1.3, .18, -.12) for p in ('G3', 'Bb3', 'E4')]
# C · 28.75–39.3 · 96 bpm in D minor: a restless ostinato, then the theme in minor, more urgent; it cuts dead at 39.3
bc = .625; t0 = 28.75; e8 = bc / 2
OST = [['D3', 'A3', 'F3', 'A3', 'D3', 'A3'], ['D3', 'A3', 'F3', 'A3', 'D3', 'A3'], ['D3', 'A3', 'F3', 'A3', 'D3', 'A3'], ['C#3', 'A3', 'E3', 'G3', 'C#3', 'A3'], ['D3', 'A3', 'F3', 'A3', 'D3', 'A3'], ['Bb2', 'F3', 'D3', 'F3', 'Bb2', 'F3']]
MEL = [[], [('A5', 3)], [('F4', 1), ('A4', 1), ('D5', 1)], [('C#5', 2), ('E5', 1)], [('D5', 1), ('F5', 1), ('A5', 1)], [('Bb5', 3)]]
CUT3 = 39.3
for k in range(6):
    tb = t0 + k * 3 * bc; vel = [.2, .22, .3, .33, .4, .44][k]
    for j, p in enumerate(OST[k]):
        if tb + j * e8 < CUT3: n(tb + j * e8, p, min(e8 * .9, CUT3 - tb - j * e8), vel, -.2)
    if k in (0, 2, 4): n(tb, ['D2', 'D2', 'D2', 'A1', 'D2', 'Bb1'][k], min(3 * bc, CUT3 - tb), vel, -.3)
    tt = tb
    for p, bb in MEL[k]:
        if tt < CUT3: n(tt, p, min(bc * bb * 1.02, CUT3 - tt), vel + .1, .12); n(tt, tr(p, -12), min(bc * bb, CUT3 - tt), (vel + .1) * .55, .05) if k >= 4 else None
        tt += bc * bb
# D · 41–49 · the reality check: almost nothing
n(41.4, 'D2', 2.6, .24, -.2); n(41.4, 'A2', 2.6, .16, -.2)
n(44.3, 'B4', .45, .24, .15); n(44.75, 'E5', .7, .26, .15)            # a question at the finger look
n(46.42, 'F#3', .18, .3, -.1)                                           # an awkward plonk after the third tap
for j, p in enumerate(['F3', 'A3', 'C4', 'F4', 'A4', 'C5']): n(48.3 + j * .11, p, .9 - j * .08, .26 + j * .03, -.2 + j * .08)   # confidence rises
# E1 · 49.0–52.6 · confident: the theme with octaves and a firm left hand
b1 = .682
bar(49.0, b1, 0, .5, .36, oct_=True)
n(49.0 + 3 * b1, 'E5', 2 * b1 * .9, .52, .1); n(49.0 + 3 * b1, 'E4', 2 * b1 * .9, .38, .05); n(49.0 + 3 * b1, 'C2', 1.2, .4, -.25); n(49.0 + 4 * b1, 'G3', .4, .3, -.12); n(49.0 + 4 * b1, 'C4', .4, .3, -.12)
# he stops at the door: a held question chord
[n(52.6, p, 1.6, .2, -.1) for p in ('C3', 'Bb3', 'F4', 'G4')]
# E2 · cautious plinks, then silence through the lid and the wait
for tt, p in [(53.95, 'C5'), (54.3, 'D5'), (54.62, 'E5'), (55.02, 'B4'), (55.32, 'A4')]: n(tt, p, .16, .2, .15)
# E3 · 57.5–62.5 · absurdly victorious: rolled F major, the theme's second half in octaves, crescendo; the F never arrives
END = 62.5
for j, p in enumerate(['F1', 'F2', 'C3', 'A3', 'F4', 'A4', 'C5', 'F5', 'A5']): n(57.5 + j * .045, p, END - 57.5 - j * .045, .55 + j * .03, -.3 + j * .07)
B3 = 1.6; bars = [(58.0, 4, 'Bb1', ['Bb2', 'F3', 'D4', 'F3']), (59.6, 5, 'A1', ['A2', 'F3', 'C4', 'F3']), (61.2, 6, 'C2', ['G2', 'E3', 'Bb3', 'E3'])]
for k, (tb, i, bs, arp) in enumerate(bars):
    beats = [B3 / 3] * 3 if k < 2 else [.45, .45, .4]
    tt = tb; vm = [.58, .66, .76][k]
    for (p, bb), _ in zip(TH[i], range(3)):
        d = sum(beats[:bb]) if bb > 1 else beats[0]; d = min(d * 1.05, END - tt)
        n(tt, p, d, vm, .12); n(tt, tr(p, -12), d, vm * .8, .02); n(tt, tr(p, 12), d, vm * .45, .2)
        tt += sum(beats[:bb]) if bb > 1 else beats[0]
    n(tb, bs, min(B3, END - tb), vm * .9, -.3)
    for j in range(6):
        q = tb + j * (sum(beats) / 6)
        if q < END: n(q, arp[j % 4], min(.5, END - q), vm * .55, -.15)
# FINAL · 62.5: one sharp dissonant chord, damped; then silence; 64.0: one small sad note
for p in ('Gb1', 'C2', 'F#3', 'G3', 'C#4', 'B4', 'C5', 'F5'): n(62.5, p, .42, .95, 0)
n(64.0, 'Db5', 4.2, .46, .08)
# stings at the awakenings: each one bigger
STING = {1: ['F#1', 'G1', 'C2', 'B4', 'C5', 'F#5'], 2: ['F#1', 'G1', 'C2', 'Db3', 'G3', 'B4', 'C5', 'F#5'], 3: ['E1', 'F#1', 'G1', 'C2', 'Db3', 'G3', 'Ab3', 'B4', 'C5', 'F#5', 'G5']}
for e in evs('wake'):
    k = e['n']; [n(e['t'], p, .55 + .12 * k, .78 + .08 * k, 0) for p in STING[k]]
print(f'score: {len(SC)} notes; rendering piano…')
MUS = PNO.render(SC, dur=DUR + .5)[:N]
MUS = PNO.room(MUS, size=.42, mix=.16)
# the stings and the final chord stop everything: hard gate on the music right after each
def gate(buf, t0, t1, fo=.04):
    a, b_ = int(t0 * SR), int(t1 * SR); f = int(fo * SR)
    buf[a:a + f] *= np.linspace(1, 0, f)[:, None]; buf[a + f:b_] = 0
for e in evs('wake'): gate(MUS, e['t'] + .75 + .12 * e['n'], e['t'] + 1.35)
gate(MUS, CUT3, 39.98, .02)                     # the tiny silence before the third sting
gate(MUS, 62.5 + .48, 63.99, .06)               # after the chord: nothing until the sad note

# ============================ FOLEY ============================
FX = np.zeros((N, 2)); AMB = np.zeros((N, 2))
def env(d, a, r): x = np.ones(int(round(d * SR))); na, nr = min(int(a * SR), len(x) // 2), min(int(r * SR), len(x) // 2); x[:na] = np.linspace(0, 1, na) ** 2; x[-nr:] *= np.linspace(1, 0, nr) ** 2; return x
def breath(d, lo, hi, a=.3, r=.4, rise=0.0):
    x = filt(noise(d), 'band', [lo, hi]); e = env(d, a, r)
    if rise: x = x * (1 + rise * np.linspace(-1, 1, len(x)))
    return x * e
def gasp(v=1): x = breath(.32, 900, 3200, .22, .06) + .5 * breath(.32, 400, 1100, .22, .06); return sfx.norm(x) * v
def exhale(d=.8, v=1): x = breath(d, 350, 1500, .05, d * .7) * np.linspace(1, .5, int(d * SR)); return sfx.norm(x) * v
def rustle(d=.45, v=1):
    x = filt(noise(d), 'band', [500, 5000]); m = np.abs(filt(noise(d), 'low', 18)); m /= m.max() + 1e-9
    return sfx.norm(x * m * env(d, .03, .15)) * v
def whump(v=1): d = .3; return sfx.norm(filt(noise(d), 'low', 260) * sfx.env_exp(d, .07)) * v
def footW(v=1): d = .09; x = filt(noise(d), 'low', 700) * sfx.env_exp(d, .012) + np.sin(2 * np.pi * 95 * t_(d)) * sfx.env_exp(d, .02) * .6 + filt(noise(d), 'band', [1800, 4500]) * sfx.env_exp(d, .004) * .25; return sfx.norm(x) * v
def footT(v=1): d = .1; x = filt(noise(d), 'band', [600, 4000]) * sfx.env_exp(d, .007) + np.sin(2 * np.pi * 160 * t_(d)) * sfx.env_exp(d, .015) * .5; return sfx.norm(x) * v
def tap(v=1): d = .07; x = filt(noise(d), 'band', [700, 5000]) * sfx.env_exp(d, .006) + np.sin(2 * np.pi * 210 * t_(d)) * sfx.env_exp(d, .012) * .7; return sfx.norm(x) * v
def plastic(f=1, v=1):
    d = .12; tt = t_(d); x = sum(a * np.sin(2 * np.pi * ff * f * tt) * sfx.env_exp(d, tau) for ff, a, tau in [(1750, .6, .02), (2900, .4, .012), (640, .5, .03)]) + filt(noise(d), 'high', 2500) * sfx.env_exp(d, .003) * .6
    return sfx.norm(x) * v
def stream(d):
    """a gentle, recognisable trickle: band noise with a bubbling wobble, plus small droplets"""
    x = filt(noise(d), 'band', [1300, 6500]) * .6 + filt(noise(d), 'band', [500, 1400]) * .4
    wob = 1 + .35 * np.sin(2 * np.pi * 7.3 * t_(d)) * np.sin(2 * np.pi * .9 * t_(d)); x = x * wob
    for _ in range(int(d * 14)):
        at = rng.uniform(0, d - .05); dd = .03; f = rng.uniform(900, 2400); q = np.sin(2 * np.pi * np.cumsum(f * np.linspace(1, .7, int(dd * SR))) / SR) * sfx.env_exp(dd, .008)
        i = int(at * SR); x[i:i + len(q)] += q * rng.uniform(.3, .8)
    return sfx.norm(x * env(d, .25, .02)) * .9
# room tones
def tone(d, lp_, g, hum=0, crick=False, seed=1):
    x = filt(sfx.brown(d), 'low', lp_) * g
    if hum: x = x + np.sin(2 * np.pi * 120 * t_(d)) * hum * (1 + .2 * np.sin(2 * np.pi * .3 * t_(d)))
    if crick:
        r = np.random.default_rng(seed)
        for _ in range(int(d * 1.2)):
            at = r.uniform(0, d - .3); f = r.uniform(4200, 5200)
            for k in range(r.integers(2, 4)):
                q = np.sin(2 * np.pi * f * t_(.035)) * np.hanning(int(.035 * SR)); i = int((at + k * .07) * SR); x[i:i + len(q)] += q * .012
    return x
ROOMS = {'bed': [(0, 3.2), (9, 15), (23, 33.6), (40, 50.4), (62.5, 69.3)], 'hall': [(3.2, 5.0), (15, 17.8), (33.6, 35.4), (50.4, 53.8)], 'bath': [(5, 9), (17.8, 23), (35.4, 40), (53.8, 62.5)]}
for room, spans in ROOMS.items():
    for k, (a, b_) in enumerate(spans):
        d = b_ - a
        if room == 'bed': x = tone(d, 220, .5, crick=True, seed=k + 3)
        elif room == 'hall': x = tone(d, 160, .36, seed=k + 9)
        else: x = reverb(tone(d, 300, .4, hum=.01, seed=k + 20), .5, .25)[:int(d * SR)]
        put(AMB, fade(st(x), .005, .005 if b_ < 69 else .3), a, db(-36 if room != 'bath' else -34))
# events
for e in EV:
    t, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'step':
        if e['surf'] == 'tile': put(FX, reverb(footT(v), .45, .22), t, db(-19 + 6 * (v - .7)), .1)
        else: put(FX, footW(v), t, db(-17 + 7 * (v - .7)), .05)
    elif ty == 'blanket': put(FX, mx(rustle(.55, 1), whump(.6)), t, db(-14 + 4 * (v - 1)), -.1)
    elif ty == 'rustle': put(FX, rustle(.4 + .2 * v, 1), t, db(-20 + 6 * v), -.05)
    elif ty == 'creak': put(FX, sfx.creak(1), t, db(-24 + 6 * v), -.15)
    elif ty == 'feet': put(FX, footW(1), t, db(-17), 0); put(FX, footW(.9), t + .07, db(-19), .05)
    elif ty == 'switch': put(FX, plastic(1.6, 1), t, db(-14), .3)
    elif ty == 'lidLift': put(FX, reverb(filt(noise(.25 * (1.8 if e.get('slow') else 1)), 'band', [800, 3000]) * env(.25 * (1.8 if e.get('slow') else 1), .1, .1), .5, .25), t, db(-30), .2)
    elif ty == 'lidClick': put(FX, reverb(plastic(1, 1), .5, .3), t, db(-12 + 4 * (v - .8)), .2); put(FX, reverb(plastic(1.25, .5), .5, .3), t + .085, db(-22), .2)
    elif ty == 'wake':
        k = e['n']; put(FX, gasp(1), t - .02, db(-11 + k), 0); put(FX, mx(whump(1), rustle(.5, .7)), t, db(-13 + k), 0); put(FX, sfx.creak(1), t + .06, db(-20 + k), -.1)
        put(FX, sfx.thump(1, 52), t, db(-12 + k * 1.5), 0)
    elif ty == 'pant': put(FX, breath(.2, 500, 2400, .05, .12), t, db(-24 + 6 * v), 0); put(FX, breath(.24, 400, 1800, .06, .16), t + .2, db(-27 + 6 * v), 0)
    elif ty == 'exhale': put(FX, exhale(.9, 1), t, db(-18 + 4 * v), 0)
    elif ty == 'wipe': put(FX, rustle(.35, .8), t, db(-24), .1)
    elif ty == 'pat': put(FX, whump(1), t, db(-15), .1); put(FX, tap(.5), t, db(-26), .1)
    elif ty == 'flop': put(FX, whump(1), t, db(-12)); put(FX, sfx.creak(1), t + .05, db(-20))
    elif ty == 'strain': put(FX, breath(.5, 2500, 6000, .1, .2), t, db(-30), 0)
    elif ty == 'heart': put(FX, sfx.heartbeat(1), t, db(-13 + 3 * v), 0)
    elif ty == 'tap': put(FX, tap(1), t, db(-12), -.15 if abs(t - 45.6) > .1 else .15)
    elif ty == 'shake': put(FX, sfx.whoosh(.16, 1), t + .02, db(-27), -.3); put(FX, sfx.whoosh(.16, 1), t + .2, db(-28), .3); put(FX, sfx.whoosh(.16, 1), t + .38, db(-30), -.2)
    elif ty == 'pinch': put(FX, rustle(.2, .6), t, db(-26), .1)
    elif ty == 'nod': put(FX, rustle(.12, .4), t, db(-33))
    elif ty == 'cloth': put(FX, rustle(.3, 1), t, db(-24 + 4 * v))
    elif ty == 'stream': d = e['dur']; put(FX, reverb(stream(d + .2), .45, .22)[:int(d * SR)], t, db(-19), .15)
    elif ty == 'relief': pass
    elif ty == 'sigh': d = e['dur']; put(FX, exhale(d, 1) * np.concatenate([np.linspace(.6, 1, int(.4 * SR)), np.ones(int(d * SR) - int(.4 * SR))]), t, db(-14))
    elif ty == 'sleepBreath': put(FX, breath(.9, 300, 1300, .4, .4), t, db(-31 + 3 * v)); put(FX, breath(1.1, 250, 1000, .3, .7), t + .95, db(-33 + 3 * v))
# the cut at 62.5 kills every sound from the bathroom dream at once
for buf in (FX,):
    a = int(62.5 * SR); buf[a:a + int(.003 * SR)] *= np.linspace(1, 0, int(.003 * SR))[:, None]
    late = [e for e in EV if e['t'] >= 62.5 and e['type'] == 'sleepBreath']
    buf[a + int(.003 * SR):] = 0
    for e in late: put(buf, breath(.9, 300, 1300, .4, .4), e['t'], db(-31 + 3 * e.get('v', 1))); put(buf, breath(1.1, 250, 1000, .3, .7), e['t'] + .95, db(-33 + 3 * e.get('v', 1)))

MIX = MUS * db(-2) + FX + AMB
if os.environ.get('STEMS'):
    for nm, b_ in (('mus', MUS), ('fx', FX), ('amb', AMB)): sf.write(os.path.join(OUT, f'stem_{nm}.wav'), b_.astype(np.float32), SR)
end = int(69.4 * SR); MIX[end:] *= 0; MIX[int(69.0 * SR):end] *= np.linspace(1, 0, end - int(69.0 * SR))[:, None]
# master: lift toward −14 LUFS with a stereo-linked look-ahead limiter, so the final loudnorm can stay linear
from scipy.ndimage import maximum_filter1d, uniform_filter1d
MIX = MIX * db(float(os.environ.get('PREGAIN', 10.8)))
nl = int(.006 * SR); m = maximum_filter1d(np.abs(MIX).max(1), size=2 * nl + 1); g = np.minimum(1, .76 / np.maximum(m, 1e-9))
g = np.minimum(g, uniform_filter1d(g, size=nl)); g = uniform_filter1d(maximum_filter1d(-g, size=int(.03 * SR)) * -1, size=int(.02 * SR)); MIX = MIX * g[:, None]
pk = np.abs(MIX).max(); MIX = MIX / max(pk / .89, 1)
sf.write(os.path.join(OUT, 'mix.wav'), MIX.astype(np.float32), SR, subtype='PCM_24')
print('wrote', os.path.join(OUT, 'mix.wav'), f'{DUR:.1f}s peak {pk:.2f}')
