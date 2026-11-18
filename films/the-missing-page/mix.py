"""Sound for THE MISSING PAGE: dialogue in three rooms, the original piano-and-strings score (ElevenLabs Music),
Rachmaninoff's Prelude in C-sharp minor Op. 3 No. 2 played on the Salamander Grand Piano samples, foley and ambience → out/mix.wav
Run from the library root:  .venv/bin/python films/the-missing-page/mix.py   (after tools/timeline.mjs)"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('OUT') or os.path.join(HERE, 'out')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio')); sys.path.insert(0, LIB)
import sfx
from core.audio import sampler as SMP
SR = 48000; A = lambda *p: os.path.join(HERE, 'audio', *p); O = lambda *p: os.path.join(OUT, *p)
T = json.load(open(O('timeline.json'))); M, LINES, EV, DUR = T['M'], T['L'], T['EV'], T['DUR']
N = int((DUR + .5) * SR); rng = np.random.default_rng(23)
db = lambda d: 10 ** (d / 20)
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
_ir = {}
def reverb(x, t60=.6, wet=.2, pre=.012, bright=6500):
    k = (t60, pre, bright)
    if k not in _ir:
        n = int(t60 * 1.3 * SR); e = np.exp(-6.9 * np.arange(n) / (t60 * SR)); r = np.random.default_rng(int(t60 * 1000))
        ir = np.stack([r.standard_normal(n) * e, r.standard_normal(n) * e], 1); ir = filt(ir, 'low', bright); ir = filt(ir, 'high', 180); ir /= np.sqrt((ir ** 2).sum(0)).max(); _ir[k] = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    x = st(x); ir = _ir[k]; w = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1)
    out = np.zeros_like(w); out[:len(x)] = x * (1 - wet * .4); return out + w * wet
def curve(pts):                           # gain curve over the film, points [(t, dB)]
    t = np.arange(N) / SR; return db(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))[:, None]
def seg(x, a, b): return x[int(a * SR):int(b * SR)]
def loop(x, dur): x = st(x); r = int(np.ceil(dur * SR / len(x))); return np.tile(x, (r, 1))[:int(dur * SR)]
def onset(x, th=.08):                     # first sample above a fraction of the peak
    m = np.abs(st(x)).max(1); i = np.argmax(m > m.max() * th); return x[max(0, i - int(.01 * SR)):]
evs = lambda k: [e for e in EV if e['type'] == k]
line = {l['id']: l for l in LINES}
VO, MUS, FX, AMB = (np.zeros((N, 2)) for _ in range(4))
SFX = {f[:-4]: load(A('sfx_raw', f)) for f in os.listdir(A('sfx_raw')) if f.endswith('.wav')}

# ---------------- dialogue ----------------
PAN = {'EXAMINER': 0, 'CANDIDATE': .14, 'SECOND': -.14}
def room(t):
    if t < M['hall']: return (.95, .17)       # the big hall
    if t < M['s5']: return (.7, .12)          # hallway
    return (.32, .07)                         # the cabin: short, metallic
for l in LINES:
    x = load(O('vo_trim', l['id'] + '.wav'), mono=True)
    x = sfx.compress(x, thr=.22, ratio=2.6); x = filt(x, 'high', 90)
    if l['muffled']:                          # heard through the panic: far, low-passed, swimming
        x = filt(filt(x, 'low', 650, 4), 'high', 160); x = reverb(x, 1.6, .45, .03, 3000)
        x = fade(x, .4, .3); put(VO, x, l['t0'], db(-11), -.1); continue
    if l['id'] == 's05':                      # the line goes under water from "behind the statistics page"
        k0 = M['trigger'] - l['t0']; w = np.clip((np.arange(len(x)) / SR - k0) / .7, 0, 1)
        x = x * (1 - w) + filt(filt(x, 'low', 800, 4), 'high', 150) * w * .8
    t60, wet = room(l['t0']); g = db(1.5) if l['id'] == 'c04' else 1
    put(VO, reverb(x, t60, wet), l['t0'], g * db(-1), PAN.get(l['who'], 0))
# the gasp at the snap back
gp = onset(SFX['gasp'])[:int(.8 * SR)]; put(VO, fade(gp, .005, .2), M['snap'] - .05, db(-7), .14)

# ---------------- music 1–2: original piano + strings (ElevenLabs Music, licensed to the account holder) ----------------
C1 = load(A('music_raw', 'cue1b.wav'))
# under the examiner: the quiet opening, ducked under his speech, cut dead before the Candidate's line
a = seg(C1, 0, M['place'] + .3); put(MUS, fade(a, 1.2, .08), .0, db(-9))
# "Begin.": straight into the rhythmic build, timed so the swell lands on the victory walk; it settles as the hallway arrives
st2 = 32.5; b = seg(C1, st2, 64.0); put(MUS, fade(b, .25, 2.5), M['begin'] - .05, db(-5))
# music 3: the elevator, calm and ordinary
C3 = load(A('music_raw', 'liftb.wav')); c = seg(C3, 8.0, 8.0 + (M['turn'] - M['s5']) + .3)
put(MUS, fade(c, 1.2, .12), M['s5'] + .2, db(-12))
# level ride: duck under dialogue, dip on EIGHTY PERCENT, silence at the cut points
mt = [(0, -4), (M['door'], 0)]
for l in LINES:
    if l['t0'] < M['s5'] + 30: mt += [(l['t0'] - .15, 0), (l['t0'] + .05, -6), (l['t1'], -6), (l['t1'] + .35, 0)]
mt = sorted(mt); g = curve(mt)
g *= curve([(0, 0), (M['eighty'] - .1, 0), (M['eighty'] + .1, -6), (M['push'], -2), (M['place'], 0), (M['place'] + .06, -60), (M['begin'] - .1, -60), (M['begin'], 5), (M['s3'], 6), (M['exit'], 6),
            (M['hall'] + 2, 2), (M['s5'] + .2, -2), (M['closer'], -3), (M['closer'] + 2.5, -9), (M['turn'], -14), (M['turn'] + .12, -80), (DUR + 1, -80)])
MUS *= g

# ---------------- music 4: Rachmaninoff, Prelude in C-sharp minor, Op. 3 No. 2 (Salamander Grand, new rendering) ----------------
SMP.seed(3)
ev = []
oct_ = lambda t, n, v, d: [(t, 'piano', p, d, v, 0) for p in n]
B = evs('rach')
ev += oct_(B[0]['t'], ['A0', 'A1', 'A2'], 1.0, 3.2)                   # the three bell octaves, fff: A …
ev += oct_(B[1]['t'], ['G#0', 'G#1', 'G#2'], 1.0, 3.2)                # … G# …
ev += oct_(B[2]['t'], ['C#1', 'C#2', 'C#3'], 1.0, 5.0)                # … C#, ringing
tc = evs('rachChord')[0]['t']                                         # then the hushed chords over the tolling C#
for i, (ch, tt) in enumerate([(['C#4', 'E4', 'A4'], 0), (['C4', 'D#4', 'G#4'], 1.05), (['C#4', 'E4', 'G#4'], 2.1)]):
    ev += [(tc + tt, 'piano', 'C#2', 1.6, .42, -.1), (tc + tt, 'piano', 'C#1', 1.6, .3, -.1)]
    ev += [(tc + tt + .02, 'piano', p, 1.3, .34, .15) for p in ch]
F_ = evs('rachFff')                                                   # the escape: the theme returns fff, in full chords
ev += [(F_[0]['t'], 'piano', p, .9, 1.0, 0) for p in ['A0', 'A1', 'A2', 'C#4', 'E4', 'A4', 'C#5', 'E5', 'A5']]
ev += [(F_[1]['t'], 'piano', p, .9, 1.0, 0) for p in ['G#0', 'G#1', 'G#2', 'C4', 'D#4', 'G#4', 'C5', 'D#5', 'G#5']]
tsh = evs('impact')[0]['t']                                           # the doors shut: the final C-sharp minor, as low and wide as the piano goes
ev += [(tsh, 'piano', p, 5.5, 1.0, 0) for p in ['C#1', 'C#2', 'G#2', 'C#3', 'E3', 'G#3', 'C#4', 'E4', 'G#4', 'C#5', 'E5', 'G#5', 'C#6']]
R0 = min(e[0] for e in ev) - .05
rach = SMP.render([(e[0] - R0,) + e[1:] for e in ev], dur=DUR - R0 + .3)
rach = SMP.room(rach, size=.75, mix=.28)
put(MUS, rach, R0, db(1))
# a sub-bass impact under the final chord, and the low drop at the realisation
tt_ = sfx.t_(3.5); boom = np.sin(2 * np.pi * (34 + 20 * np.exp(-tt_ * 6)) * tt_) * np.exp(-tt_ / 1.1); put(FX, boom, tsh, db(-6))
td = evs('drop')[0]['t']; tt_ = sfx.t_(4.0); drop = np.sin(2 * np.pi * np.cumsum(70 - 38 * (tt_ / 4) ** .5) / SR) * np.minimum(1, tt_ * 3) * np.exp(-tt_ / 2.2); put(FX, drop, td - .3, db(-12))

# ---------------- foley ----------------
def at(k): return [e['t'] for e in evs(k)]
for t in at('door'):
    e = next(e for e in evs('door') if e['t'] == t); put(FX, reverb(onset(SFX['door']), .9, .25), t, db(-16 if e.get('soft') else -6), .25)
for e in evs('stepsHeavy'):
    d = e['n'] * e['iv'] + .4; x = fade(reverb(onset(SFX['stepsHeavy'])[:int(d * SR)], .9, .25), .02, .3); put(FX, x, e['t'], db(-16 if e.get('soft') else -9))
for e in evs('stepsLight'):
    d = e['n'] * e['iv'] + .4; x = fade(reverb(onset(SFX['stepsLight'])[:int(d * SR)], .8 if e['t'] < M['hall'] else .6, .2), .02, .3); put(FX, x, e['t'], db(-17 if e.get('soft') else -12))
for e in evs('paperDown'): put(FX, reverb(onset(SFX['paperDown']), .9, .2), e['t'], db(-9 if e.get('close') else -16), e.get('pan', 0))
for t in at('pensClick'): put(FX, reverb(onset(SFX['pensClick']), .9, .25), t, db(-14))
for e in evs('penWrite'):
    x = onset(SFX['penWrite'])[:int(e['dur'] * SR)]; put(FX, fade(x, .05, .3), e['t'], db(-20 if e.get('soft') else -13), .1)
for t in at('pageTurn') + at('flip'): put(FX, reverb(onset(SFX['papers'])[:int(1.1 * SR)], .8, .2), t, db(-14), -.1)
for t in at('penDown'): put(FX, sfx.click(1.6, .9), t, db(-14), .1)
for t in at('chair'): put(FX, reverb(onset(SFX['chair']), .9, .2), t, db(-12), .1)
for t in at('rustle'): x = filt(sfx.noise(.4), 'band', [400, 2400]) * np.hanning(int(.4 * SR)); put(FX, x, t, db(-26), .1)
for t in at('sign'): put(FX, onset(SFX['sign']), t, db(-12))
for t in at('erase'): put(FX, fade(onset(SFX['penWrite'])[:int(.5 * SR)], .02, .1), t, db(-18))
# the clock: ticks in the silent hall and on the 9:00 insert, a fast tick through the time-lapse
def tick(t, g_): put(FX, reverb(sfx.click(2.4, .8), .9, .3), t, db(g_), -.3)
for t in [.15, 1.15]: tick(t, -19)
for k in range(3): tick(M['s2'] + .05 + k * 1.0, -15)
e = evs('tickFast')[0]; tt = e['t']
while tt < e['t'] + e['dur']: tick(tt, -26); tt += .11
for t in at('hb'):
    for i in range(evs('hb')[0]['n']): put(FX, sfx.heartbeat(1), t + i * evs('hb')[0]['iv'], db(-13 + i * 1.2))
# the elevator: chime, doors
for t in at('chime'): put(FX, reverb(onset(SFX['chime']), .6, .15), t, db(-11), .1)
for t in at('doorsOpen'): put(FX, reverb(onset(SFX['doorsOpen']), .6, .15), t, db(-14))
for t in at('doorsClose'): put(FX, onset(SFX['doorsClose']), t, db(-15))
muff = lambda x: filt(filt(x, 'low', 600, 4), 'high', 120)
for t in at('chimeMuffled'): put(FX, reverb(muff(onset(SFX['chime'])), 1.2, .4), t, db(-14))
for t in at('doorsOpenMuffled'): put(FX, muff(onset(SFX['doorsOpen'])), t, db(-17))
for t in at('doorsCloseMuffled'): put(FX, muff(onset(SFX['doorsClose'])), t, db(-18))
for t in at('doorsCloseLoud'): x = onset(SFX['doorsClose']); put(FX, fade(x[-int(1.2 * SR):], .05, .05), t, db(-10))
for t in at('lunge'): put(FX, onset(SFX['lunge']), t, db(-8), .1)
for t in at('slam'): put(FX, reverb(sfx.thump(1, 75) + 0, .4, .2), t, db(-6)); put(FX, sfx.clack(.6, 1), t, db(-12))
for t in at('dingFinal'): put(FX, reverb(onset(SFX['chime']), .4, .1), t, db(-8))
for t in at('floorTick'): put(FX, sfx.click(3.2, .6), t, db(-22))

# ---------------- ambience ----------------
hall = loop(SFX['hallTone'], M['hall'] - 0 + 1); put(AMB, fade(hall, .5, .6), 0, db(-14))
cor = loop(SFX['corridor'], M['s5'] - M['hall'] + .8); put(AMB, fade(cor, .4, .5), M['hall'] - .2, db(-17))
hum = loop(SFX['liftHum'], DUR - M['s5'] + .5)
# the hum sinks under a low-pass during the frozen seconds, returns at the snap, dies at black
ti = np.arange(len(hum)) / SR + M['s5']; w = np.clip((ti - M['trigger']) / 1.2, 0, 1) * (1 - np.clip((ti - M['snap']) / .1, 0, 1))
hum = hum * (1 - w[:, None]) + filt(hum, 'low', 300, 4) * w[:, None] * .7
put(AMB, fade(hum, .4, .05), M['s5'], db(-15))
# black: let the piano ring, everything else stops
AMB *= curve([(0, 0), (M['black'] - .02, 0), (M['black'], -80), (DUR + 1, -80)])
FX[int((M['black'] + .02) * SR):] *= 0

mix = VO * db(0) + MUS * db(-3) + FX * db(-1) + AMB * db(-2)
mix[int((M['end']) * SR) - int(.25 * SR):] *= np.linspace(1, 0, len(mix) - int(M['end'] * SR) + int(.25 * SR))[:, None]
# master: bring it near −14 LUFS here, then a linked look-ahead limiter so the loudnorm pass in mux.sh is almost a no-op
import subprocess, re
from scipy.ndimage import maximum_filter1d, uniform_filter1d
def lufs(x):
    sf.write(O('_tmp.wav'), x.astype(np.float32), SR); r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', O('_tmp.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1])
def limiter(x, ceil=10 ** (-2.0 / 20)):
    env = maximum_filter1d(np.abs(x).max(1), int(.006 * SR)); g = np.minimum(1, ceil / np.maximum(env, 1e-9))
    g = maximum_filter1d(-g, int(.006 * SR)) * -1; g = uniform_filter1d(g, int(.004 * SR)); return x * np.minimum(g, 1)[:, None]
mix = mix[:int(DUR * SR)]
for _ in range(2): mix = limiter(mix * db(-14.2 - lufs(mix)))
os.remove(O('_tmp.wav'))
sf.write(O('mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('mix', O('mix.wav'), round(DUR, 2), 's peak', round(float(np.abs(mix).max()), 3))
