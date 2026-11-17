"""Sound for THE BRAIN NEVER FORGETS: dialogue, Chopin (CC0 Musopen recording), an original night score, foley, the strike → out/mix.wav
Run from the library root after tools/timeline.mjs:  .venv/bin/python films/brain-never-forgets/mix.py"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('OUT') or os.path.join(HERE, 'out')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio')); import sfx
SR = 48000; A = lambda *p: os.path.join(HERE, 'audio', *p); O = lambda *p: os.path.join(OUT, *p)
T = json.load(open(O('timeline.json'))); M, LINES, DUR = T['M'], T['L'], T['DUR']
N = int((DUR + .5) * SR); rng = np.random.default_rng(23)
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
_ir = {}
def reverb(x, t60=.6, wet=.2, pre=.012):
    k = (t60, pre)
    if k not in _ir:
        n = int(t60 * 1.3 * SR); e = np.exp(-6.9 * np.arange(n) / (t60 * SR)); r = np.random.default_rng(int(t60 * 1000))
        ir = np.stack([r.standard_normal(n) * e, r.standard_normal(n) * e], 1); ir = filt(ir, 'low', 6500); ir = filt(ir, 'high', 180); ir /= np.sqrt((ir ** 2).sum(0)).max()
        _ir[k] = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    x = st(x); ir = _ir[k]; w = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1)
    out = np.zeros_like(w); out[:len(x)] = x * (1 - wet * .4); return out + w * wet
def curve(pts, n=N):
    t = np.arange(n) / SR; return db(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))
def tone(f, d, tau=.4, h=(1, .5, .25), inh=0):
    t = sfx.t_(d); return sum(a * np.sin(2 * np.pi * f * (i + 1) * (1 + inh * i * i) * t) for i, a in enumerate(h)) * np.exp(-t / tau)
def nz(d, lo, hi): return filt(sfx.noise(d), 'band', [lo, hi])
def env(x, a, r): n = len(x); e = np.minimum(1, np.minimum(np.arange(n) / max(1, a * SR), (n - np.arange(n)) / max(1, r * SR))); return x * e
def seg(buf, t0, t1): return buf[int(t0 * SR):int(t1 * SR)]

VO = np.zeros((N, 2)); MUS = np.zeros((N, 2)); SCORE = np.zeros((N, 2)); FX = np.zeros((N, 2)); AMB = np.zeros((N, 2)); HIT = np.zeros((N, 2))

# ---------------- dialogue ----------------
VOX = {l['id']: load(O('vo_trim', l['id'] + '.wav'), mono=True) for l in LINES}
for l in LINES:
    x = filt(sfx.compress(sfx.compress(VOX[l['id']], thr=.2, ratio=2.5), thr=.35, ratio=4, att=.002, rel=.06), 'high', 85)
    if l['who'] == 'BRAIN':          # the inner voice: close, warm, a long soft tail
        x = x + filt(x, 'low', 280) * .3; put(VO, reverb(x, .9, .12, .02), l['t0'], db(-1), 0)   # a short room: a long tail smeared 'hypo-' into 'hyper-'
    elif l['id'] == 's04':           # half asleep into the pillow
        put(VO, reverb(filt(x, 'low', 5000), .3, .05), l['t0'], db(-3.5), .05)
    else:                            # the bus: small, bright, a little boxy
        put(VO, reverb(filt(x, 'high', 140), .45, .1), l['t0'], db(-1), {'YOU': .15, 'CLASSMATE': -.15}[l['who']])

# ---------------- music 1: Chopin, Nocturne in E-flat major Op. 9 No. 2 (Musopen, CC0) ----------------
CH = load(O('src', 'chopin.wav'))
e = np.abs(CH).mean(1); S0 = max(0, np.argmax(e > e.max() * .02) / SR - .05)
_w = int(.5 * SR); _e = np.sqrt(np.convolve((CH ** 2).mean(1), np.ones(_w) / _w, 'same')) + 1e-5          # ride the soft passages up for phones
_g = np.convolve(np.clip((db(-19) / _e) ** .6, .5, db(15)), np.ones(_w) / _w, 'same'); CH = CH * _g[:, None]; CH /= max(1, np.abs(CH).max() / .95)
fadeEnd = M['sleep'] - .3
put(MUS, fade(CH[int(S0 * SR):int((S0 + fadeEnd + .1) * SR)], .25, .05), 0)
MUS *= curve([(0, -5), (M['exWide'], -6), (M['busExt'], -6), (M['busIn'] - .02, -6), (M['busIn'], -12), (M['busCu'], -9), (M['bath'], -7), (M['glass'], -8), (M['lie0'] - .3, -8), (M['lie1'], -16), (fadeEnd - .4, -40), (fadeEnd, -80), (DUR + 1, -80)])[:, None]
ve = np.convolve(np.abs(VO).max(1), np.ones(int(.25 * SR)) / int(.25 * SR), 'same')                       # duck under the bus talk
MUS *= (1 - np.clip(ve * 10, 0, 1) * .6)[:, None]

# ---------------- music 2: the night (original) ----------------
t = np.arange(N) / SR
dr = (np.sin(2 * np.pi * 55 * t) + .8 * np.sin(2 * np.pi * 58.27 * t + 1) + .35 * np.sin(2 * np.pi * 110.3 * t) + .25 * np.sin(2 * np.pi * 116.5 * t + 2)) * (1 + .25 * np.sin(2 * np.pi * .13 * t))
dr = dr / 2.4 + filt(sfx.brown(N / SR + .01)[:N], 'low', 220) * .5
lvl = curve([(0, -90), (M['lie0'] + .3, -90), (M['sleep'], -36), (M['mind'], -33), (line['b03']['t0'], -36), (line['s04']['t0'] - .2, -44), (M['mind2'], -33), (line['b05']['t0'], -34),
             (line['b05']['t1'], -31), (M['twitch'], -26), (line['b06']['t0'] + .45, -21), (line['b06']['t0'] + .5, -75), (DUR + 1, -90)])
SCORE += st(dr * lvl)
# rising dissonance under the revelation: a tritone + semitone cluster, slow tremolo, glassy top
c0, c1 = line['b05']['t0'] - .4, line['b06']['t0'] + .5
cl = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((246.9, 1), (261.6, .8), (349.2, .7), (370.0, .55), (1760, .08), (1864.7, .07))) * (1 + .35 * np.sin(2 * np.pi * 5.5 * t))
cg = curve([(0, -90), (c0, -66), (line['b05']['t1'], -46), (c1 - .05, -30), (c1, -80), (DUR + 1, -90)]); SCORE += st(cl * cg * .3)
# sparse, ambiguous piano-like notes (the nocturne's key, bent wrong)
for at_, f, g_ in ((M['lie1'] + .6, 622.3, -33), (M['sleep'] + .9, 587.3, -31), (M['mind'] + .25, 440.0, -32), (line['s04']['t1'] + .2, 311.1, -34), (line['s04']['t1'] + .22, 329.6, -36)):
    put(SCORE, reverb(tone(f, 3.5, .9, (1, .45, .22, .1), .0008), 2.2, .4), at_, db(g_), rng.uniform(-.3, .3))

# ---------------- the strike ----------------
ts = M['strike']; d = 3.0; tt = sfx.t_(d)
sub = np.sin(2 * np.pi * np.cumsum(28 + 52 * np.exp(-tt / .25)) / SR) * np.exp(-tt / .7)
body = np.zeros_like(tt); th = sfx.thump(1, 60); body[:len(th)] += th[:len(body)]
sting = filt(sfx.noise(d), 'band', [2200, 9000]) * np.exp(-tt / .12)
metal = sum(np.sin(2 * np.pi * f * tt) * a for f, a in ((523, 1), (1131, .7), (1787, .5), (2390, .35), (3301, .2))) * np.exp(-tt / .55) * .35
hit = sub * 1.0 + body * .8 + sting * .5 + metal
put(HIT, reverb(fade(hit, .002, .4), 2.4, .32), ts, db(-9))
pre = filt(sfx.noise(.18), 'high', 2500) * np.linspace(0, 1, int(.18 * SR)) ** 3; put(HIT, pre, ts - .18, db(-22))

# ---------------- foley and ambience ----------------
PENCIL = load(A('sfx_raw', 'pencil.wav'), mono=True); BELL = load(A('sfx_raw', 'bell.wav'))
def steps(t0, t1, hz, gain, pan=0, lp=2400):
    x = t0
    while x < t1: put(FX, filt(sfx.step(.8), 'low', lp), x + rng.uniform(-.02, .02), db(gain + rng.uniform(-2, 1)), pan); x += 1 / hz
def paper(d=.25): x = nz(d, 1800, 7000); return fade(x * np.abs(np.sin(np.linspace(0, 9, len(x)))) ** 2, .01, .08)
def cloth(d=.35): x = nz(d, 300, 3000); return fade(x * np.hanning(len(x)), .01, .05)
def chirps(t0, t1, n, gain, f=(2600, 5200)):
    for _ in range(n):
        at_ = rng.uniform(t0, t1); f0 = rng.uniform(*f); pan = rng.uniform(-.7, .7)
        for k in range(rng.integers(2, 5)):
            dd = rng.uniform(.05, .1); x = sfx.t_(dd); fr = f0 + rng.uniform(-400, 600) * x / dd
            put(AMB, np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.hanning(len(x)), at_ + k * rng.uniform(.1, .15), db(gain + rng.uniform(-6, 0)), pan)
def bed(t0, t1, x, gain, fi=.3, fo=.3): put(AMB, fade(st(x)[:int((t1 - t0) * SR)], fi, fo), t0, db(gain))
def clink(v=1): a = tone(2630, .5, .12, (1, .4), .002); b = tone(3950, .5, .08, (1,)); return a + b * .5
def tick(): return sfx.click(1.6, .8)

# exam room
bed(0, M['busExt'], filt(sfx.brown(M['busExt'] + .2), 'low', 320), -36, .1, .05); chirps(0, M['busExt'], 10, -36)
x = .1
while x < M['busExt']: put(FX, reverb(tick(), .6, .25), x, db(-32), -.3); x += 1.0
x = .05
while x < M['dot'] - .1: put(FX, PENCIL[:int(min(len(PENCIL), .5 * SR))] if True else 0, x, db(-15), .15); x += .26 + rng.uniform(-.04, .06)
put(FX, sfx.click(2.4, 1), M['dot'], db(-13), .15)
put(FX, reverb(BELL, .9, .3), M['bell'], db(-19))
for _ in range(7): put(FX, reverb(paper(rng.uniform(.18, .32)), .7, .3), rng.uniform(M['exWide'] + .2, M['busExt'] - .5), db(rng.uniform(-34, -28)), rng.uniform(-.7, .7))
put(FX, reverb(sfx.clack(1.3, .6), .5, .2), M['penDown'] + .15, db(-22), .1)
put(FX, cloth(.5), M['stretch'] + .05, db(-27))
steps(M['profIn'], M['profIn'] + .8, 2.75, -22, .4); steps(M['profOut'] + .15, M['profOut'] + 1.6, 2.1, -24, .5)
put(FX, paper(.3), M['lift'] + .1, db(-24)); put(FX, paper(.35), M['grip'] + .05, db(-19), .2)
put(FX, sfx.creak(.6), M['lean'] + .1, db(-22))
# bus: engine (starts under the classroom's last beat), road, murmur, bumps
b0, b1 = M['busExt'] - .45, M['bath']; dur = b1 - b0 + .2; tb = sfx.t_(dur)
eng = sum(np.sin(2 * np.pi * 41 * k * tb + k) / k for k in range(1, 9)) * (1 + .15 * np.sin(2 * np.pi * .7 * tb))
eng = filt(eng, 'low', 700) * .5 + filt(sfx.brown(dur), 'low', 380) * .9
eg = np.interp(tb + b0, [b0, M['busExt'], M['busIn'] - .05, M['busIn'], b1 - .05, b1], [0, 1, 1, .62, .62, 0])
put(AMB, st(eng * eg), b0, db(-23))
mur = nz(M['bath'] - M['busIn'], 300, 1800) * (.5 + .5 * np.abs(np.sin(np.linspace(0, 70, int((M['bath'] - M['busIn']) * SR)) * np.sin(np.linspace(0, 9, int((M['bath'] - M['busIn']) * SR))))))
bed(M['busIn'], M['bath'], reverb(mur, .6, .3), -40, .05, .03)
x = M['busExt'] + .4
while x < M['bath'] - .3: put(FX, sfx.thump(.5, 70), x, db(-27)); x += rng.uniform(.9, 1.6)
put(FX, sfx.creak(.5), M['mateTurn'], db(-27), -.3)
# bathroom
bed(M['bath'], M['glass'], filt(sfx.brown(3.2), 'low', 250), -42, .03, .03)
b0, b1 = M['brushIn'] + .3, M['brushOut']; nb = int((b1 - b0) * SR); ph = (np.arange(nb) / SR) * 2 * np.pi * 3.1
brush = nz(b1 - b0, 2500, 7500)[:nb] * np.abs(np.sin(ph)) ** 1.5; put(FX, reverb(fade(brush, .03, .05), .35, .2), b0, db(-21), .1)
tw = nz(M['tapOff'] - M['tapOn'] + .1, 400, 5000); tw *= 1 + .3 * np.sin(np.linspace(0, 140, len(tw))); put(FX, reverb(fade(tw, .03, .08), .4, .25), M['tapOn'], db(-21), .2)
put(FX, sfx.click(.9, .6), M['tapOn'] - .05, db(-30), .2); put(FX, sfx.click(.9, .6), M['tapOff'], db(-30), .2)
# glass
bed(M['glass'], M['bed'], filt(sfx.brown(3), 'low', 220), -44, .03, .1)
put(FX, clink(), M['grab'], db(-27), -.3)
g_ = filt(sfx.noise(.14), 'low', 700) * np.hanning(int(.14 * SR)) + sfx.thump(.4, 130)[:int(.14 * SR)] * .6; put(FX, g_, M['swallow'], db(-17))
put(FX, clink(), M['setDown'] + .05, db(-22), -.3); put(FX, sfx.thump(.4, 160), M['setDown'] + .05, db(-27), -.3)
# bedroom clock (comes in under the glass shot) and crickets
x = M['glass'] + 1.4
while x < M['mind'] - .05: put(FX, reverb(tick(), .4, .2), x, db(-33 if x < M['sleep'] else -29), .3); x += 1.0
x = M['face'] + .3
while x < M['mind2'] - .05: put(FX, reverb(tick(), .4, .2), x, db(-35), .3); x += 1.0
chirps(M['bed'], M['mind'], 26, -38, (4200, 5200))
# bed: steps, mattress, blanket, exhale
steps(M['bed'] + .1, M['walkEnd'], 3.4, -23, .3, 1800)
put(FX, sfx.creak(.6), M['sit'] - .1, db(-21)); put(FX, sfx.thump(.5, 90), M['sit'] - .05, db(-24))
put(FX, sfx.creak(.5), M['lie1'] - .2, db(-25), -.2); put(FX, sfx.thump(.4, 80), M['lie1'] - .05, db(-27))
put(FX, cloth(M['blanket1'] - M['blanket0'] + .2), M['blanket0'] - .1, db(-17), .1)
ex_ = nz(1.2, 200, 1400); ex_ = ex_ * np.exp(-np.linspace(0, 3, len(ex_))) * np.minimum(1, np.linspace(0, 8, len(ex_))); put(FX, ex_, M['exhale'], db(-19))
# sleeping breath (follows the blanket on screen)
s0, s1 = M['sleep'], M['mind2']; ns = int((s1 - s0) * SR); tt2 = s0 + np.arange(ns) / SR
br = nz(s1 - s0, 250, 1600)[:ns] * np.abs(np.cos(tt2 * 1.25)) ** 2 * (1 - .7 * ((tt2 > M['mind']) & (tt2 < M['face'])))
put(FX, br, s0, db(-31))
# into the mind: a soft tonal shift
sw = filt(sfx.noise(1.2), 'low', 500) * np.hanning(int(1.2 * SR)); put(FX, reverb(sw, 1.5, .4), M['mind'] - .4, db(-26))
put(FX, reverb(tone(110, 2.0, .9, (1, .3)), 2, .4), M['mind'], db(-30))

# ---------------- master ----------------
mix = VO + MUS + SCORE + FX + AMB + HIT
for k in ('busExt', 'bath', 'glass'):     # hard cuts: tiny dips so the new room starts clean
    pass
i0 = int(M['black'] * SR); i1 = int((M['black'] + 2.6) * SR)       # after the black: only the strike's tail, then silence
mix[:i0] *= 1; tail = HIT[i0:] .copy(); mix[i0:] = tail
mix[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 1.5; mix[i1:] = 0
mix = mix[:int(DUR * SR)]
import subprocess, tempfile
def lufs(y):
    f = tempfile.mktemp(suffix='.wav'); sf.write(f, y, SR, subtype='FLOAT')
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr; os.remove(f)
    return float([l for l in o.split('Summary:')[1].splitlines() if 'I:' in l][0].split()[1])
pk = 1.0
for _ in range(2):                      # gain to about -14.5 LUFS, then a soft peak limiter
    g = db(-14.5 - lufs(mix)); mix = mix * g
    mix = np.stack([sfx.limit(mix[:, 0], .78), sfx.limit(mix[:, 1], .78)], 1)
print('integrated', lufs(mix), 'LUFS')
os.makedirs(OUT, exist_ok=True); sf.write(O('mix.wav'), mix, SR, subtype='PCM_16')
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix.wav', round(len(mix) / SR, 2), 's   pre-norm peak', round(float(pk), 3))
for a, b in [('exam', 'busExt'), ('busExt', 'bath'), ('bath', 'bed'), ('bed', 'sleep'), ('sleep', 'mind2'), ('mind2', 'flash'), ('flash', 'black'), ('black', 'end')]:
    i, j = int(M[a] * SR), int(min(M[b], DUR) * SR); s_ = slice(i, j)
    print(f"{a:7s} mix {rms(mix[s_]):6.1f}  voice {rms(VO[s_]):6.1f}  music {rms((MUS + SCORE)[s_]):6.1f}  fx {rms((FX + HIT)[s_]):6.1f}  amb {rms(AMB[s_]):6.1f}")
