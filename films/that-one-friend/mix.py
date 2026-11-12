"""Sound for THAT ONE FRIEND AT SCHOOL: dialogue, Chopin (CC0 Musopen recording), foley and ambience → out/mix.wav
Run from the library root:  .venv/bin/python films/that-one-friend/mix.py   (after tools/timeline.mjs)"""
import os, sys, json, subprocess, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio')); import sfx
SR = 48000; A = lambda *p: os.path.join(HERE, 'audio', *p)
T = json.load(open(os.path.join(HERE, 'out', 'timeline.json'))); M, LINES, EV, DUR = T['M'], T['L'], T['EV'], T['DUR']
N = int((DUR + .5) * SR); rng = np.random.default_rng(11)
db = lambda d: 10 ** (d / 20)
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
def reverb(x, t60=.6, wet=.2, pre=.012):
    k = (t60, pre)
    if k not in _ir:
        n = int(t60 * 1.3 * SR); e = np.exp(-6.9 * np.arange(n) / (t60 * SR)); r = np.random.default_rng(int(t60 * 1000))
        ir = np.stack([r.standard_normal(n) * e, r.standard_normal(n) * e], 1); ir = filt(ir, 'low', 6500); ir = filt(ir, 'high', 180); ir /= np.sqrt((ir ** 2).sum(0)).max(); _ir[k] = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    x = st(x); ir = _ir[k]; w = np.stack([fftconvolve(x[:, 0], ir[:, 0]), fftconvolve(x[:, 1], ir[:, 1])], 1)
    out = np.zeros_like(w); out[:len(x)] = x * (1 - wet * .4); return out + w * wet
def env_gain(pts):                       # piecewise-linear gain curve over the film, points = [(t, dB), ...]
    t = np.arange(N) / SR; ts = [p[0] for p in pts]; vs = [p[1] for p in pts]; return db(np.interp(t, ts, vs))
def rate(x, r):                          # play faster/slower with pitch change
    return resample_poly(x, 1000, int(round(1000 * r)), axis=0)
line = {l['id']: l for l in LINES}; evs = lambda k: [e for e in EV if e['type'] == k]

# ---------------- dialogue ----------------
VO = np.zeros((N, 2)); VOX = {l['id']: load(A('vo_trim', l['id'] + '.wav'), mono=True) for l in LINES}
PAN = {'YOU': .12, 'JACK': -.12, 'PROFESSOR': 0, 'TEACHER': -.1, 'COACH': .15, 'STUDENT A': -.05, 'STUDENT B': .08}
def room_of(t):
    if t < M['s2']: return (.9, .16)
    if t < M['s3']: return (.7, .14)
    if t < M['s3_spiral']: return (.9, .16)
    if t < M['s5_run']: return (.5, .1)
    if t < M['s5_chess']: return (.25, .04)
    if t < M['s6']: return (.6, .12)
    return (.3, .04)
for l in LINES:
    x = sfx.compress(VOX[l['id']], thr=.2, ratio=2.5); x = filt(x, 'high', 85)
    if l['think']:                       # inner voice: closer, warmer, with a long soft tail
        x = x + filt(x, 'low', 260) * .5; x = reverb(x, 1.9, .34, .03); put(VO, x, l['t0'], db(-1.5), 0)
    else:
        t60, wet = room_of(l['t0']); put(VO, reverb(x, t60, wet), l['t0'], db(-1), PAN.get(l['who'], 0))

# ---------------- music: Chopin, Nocturne Op. 9 No. 2 (Musopen, CC0) ----------------
CH = load(A('src', 'chopin.wav')); S0 = 1.0
# the performance is very quiet in its soft passages: ride the level gently (no distortion) so it survives a phone speaker
_w = int(.5 * SR); _e = np.sqrt(np.convolve((CH ** 2).mean(1), np.ones(_w) / _w, 'same')) + 1e-5; _g = np.clip((db(-19) / _e) ** .62, .5, db(17))
_g = np.convolve(_g, np.ones(_w) / _w, 'same'); CH = CH * _g[:, None]; CH = CH / max(1, np.abs(CH).max() / .95)
LV = A('src', 'chopin_lv.wav')
if not os.path.exists(LV): sf.write(LV, CH, SR, subtype='PCM_16')
MUS = np.zeros((N, 2))
def seg(a, b): return CH[int(a * SR):int(b * SR)]
# opening theme: full under the title, tucked under the corridor talk, nearly gone in the exam hall, cut dead on "please?"
d = M['s2_cut'] + .02; put(MUS, fade(seg(S0, S0 + d), .02, .03), 0)
g = env_gain([(0, -3), (2.6, -3), (3.6, -15), (M['s1_door'], -15), (M['s2'] - .3, -13), (M['s2'] + 1.2, -24), (M['s2_cut'], -25), (DUR + 1, -25)]); MUS *= g[:, None]
# classroom: the theme's second statement, light; stops on the hyoid
M2 = np.zeros((N, 2)); a0 = 31.5; d = M['s4_stop'] - M['s4'] + .05; put(M2, fade(seg(a0, a0 + d), .25, .05), M['s4'])
M2 *= env_gain([(0, -11), (M['s4_teacher'], -11), (M['s4_teacher'] + .6, -16), (DUR + 1, -16)])[:, None]; MUS += M2
# montage: the same nocturne, faster and faster
def stretched(sp):
    p = A('src', f'chopin_x{int(sp * 100)}.wav')
    if not os.path.exists(p): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', LV, '-af', f'atempo={sp}', p], check=True)
    return load(p)
SECT = [('s5_run', 's5_swim', 1.55, 112), ('s5_swim', 's5_chess', 1.8, 132), ('s5_chess', 's5_b3', 2.1, 152), ('s5_b3', 's5_big', 2.5, 176)]
M3 = np.zeros((N, 2)); PERC = np.zeros((N, 2)); pos = S0
for a, b, sp, bpm in SECT:
    X = stretched(sp); d = M[b] - M[a]; put(M3, fade(X[int(pos / sp * SR):int((pos / sp + d + .04) * SR)], .03, .05), M[a]); pos += d * sp
    beat = 60 / bpm; k = 0; t = M[a]
    while t < M[b] - .02:
        put(PERC, sfx.clack(1.25 if k % 2 else .95, .8), t, db(-17 if k % 2 else -14), .2 if k % 2 else -.2)
        if k % 4 == 0: put(PERC, sfx.thump(.9, 62), t, db(-11))
        put(PERC, fade(filt(sfx.noise(.05), 'high', 6000), .002, .04), t + beat / 2, db(-27), .3)
        t += beat; k += 1
M3 *= db(-8); MUS += M3
# sunset: the theme once more, then the nocturne's own last bars
M4 = np.zeros((N, 2)); t0 = M['s6'] + .9; tail = 12.5; t1 = M['end'] + .35 - tail
put(M4, fade(seg(S0, S0 + (t1 - t0) + 2.2), 1.2, 2.2), t0); put(M4, fade(seg(len(CH) / SR - tail, len(CH) / SR), 2.0, .1), t1, db(4))
M4 *= env_gain([(0, -14), (line['y45']['t1'], -14), (M['s6_crane'] + .6, -4), (DUR + 1, -4)])[:, None]; MUS += M4
# duck the music under speech
ve = np.abs(VO).max(1); w = int(.12 * SR); ve = np.convolve(ve, np.ones(w) / w, 'same'); ve = np.convolve(ve, np.ones(w * 3) / (w * 3), 'same')
MUS *= (1 - np.clip(ve * 9, 0, 1) * .5)[:, None]

# ---------------- foley and ambience ----------------
FX = np.zeros((N, 2)); AMB = np.zeros((N, 2))
def walla(dur, seed, lpf=1700, n=26):
    r = np.random.default_rng(seed); out = np.zeros(int(dur * SR)); ids = list(VOX)
    for _ in range(n):
        x = rate(VOX[ids[r.integers(len(ids))]], r.uniform(.82, 1.22)); at = int(r.uniform(-1, dur) * SR); x = x[max(0, -at):]; at = max(0, at); m = min(len(x), len(out) - at)
        if m > 0: out[at:at + m] += x[:m] * r.uniform(.4, 1)
    return fade(reverb(filt(out, 'low', lpf), 1.4, .55), .8, .8)
def steps(t0, t1, hz, gain, pan=0, jitter=.03, v=.8):
    t = t0
    while t < t1: put(FX, filt(sfx.step(v), 'low', 2400), t + rng.uniform(-jitter, jitter), db(gain + rng.uniform(-2, 1)), pan); t += 1 / hz
def tone(f, d, tau=.2, h=(1, .5, .25)):
    t = sfx.t_(d); return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * np.exp(-t / tau)
def paper(d=.25): x = filt(sfx.noise(d), 'band', [1800, 7000]); return fade(x * np.abs(np.sin(np.linspace(0, 9, len(x)))) ** 2, .01, .08)
def chirps(t0, t1, n, gain):
    for _ in range(n):
        at = rng.uniform(t0, t1); f0 = rng.uniform(2600, 5200); pan = rng.uniform(-.7, .7)
        for k in range(rng.integers(2, 6)):
            d = rng.uniform(.05, .11); t = sfx.t_(d); f = f0 + rng.uniform(-500, 700) * t / d + 300 * np.sin(2 * np.pi * 28 * t)
            put(AMB, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(t)), at + k * rng.uniform(.1, .16), db(gain + rng.uniform(-6, 0)), pan)
def bed(t0, t1, x, gain, fi=.6, fo=.6): put(AMB, fade(st(x)[:int((t1 - t0) * SR)], fi, fo), t0, db(gain))
def loop(x, dur): x = st(x); r = int(np.ceil(dur * SR / len(x))); return np.tile(x, (r, 1))[:int(dur * SR)]
PENCIL = load(A('sfx_raw', 'pencil.wav'), mono=True)
# hallway (title + before the exam, and again after it)
bed(0, M['s2'] + .3, walla(M['s2'] + .5, 3), -18, .2, 1.2); steps(.3, M['s1_door'], 1.3, -21, -.4, .2); steps(.9, M['s1_door'], .9, -24, .5, .25)
put(FX, reverb(load(A('sfx_raw', 'bell.wav')), .8, .25), evs('bell')[0]['t'], db(-13))
for t, g_ in [(5.1, -21), (13.4, -23), (19.7, -22)]: put(FX, reverb(sfx.clack(.7, .9), .9, .4), t, db(g_), -.5)
td = evs('door')[0]['t']; put(FX, sfx.creak(.8), td, db(-13), .2); put(FX, sfx.clack(.6, 1), td + .42, db(-13), .2)
steps(M['s1_door'] + 1.0, M['s1_door'] + 2.5, 2.9, -17, 0); steps(M['s1_walk'] + 1.65, M['s1_walk'] + 2.3, 3.6, -16, .15)
# exam hall: the clock arrives before the picture does
t = M['s2'] - .9; k = 0
while t < M['s3'] - .1:
    lvl = -25 if t < M['s2_cu'] else (-19 if t < M['s2_cut'] else -15)
    put(FX, reverb(sfx.click(1.0 if k % 2 else .8, 1) + .0, .7, .3), t, db(lvl), -.1); t += 1.0; k += 1
bed(M['s2'] - .2, M['s3'], filt(sfx.brown(M['s3'] - M['s2'] + .4), 'low', 300), -34, .5, .2)
t = M['s2'] + .2
while t < M['s2_cut'] - .2:
    put(FX, reverb(rate(PENCIL, rng.uniform(.9, 1.2)), .5, .25), t, db(rng.uniform(-33, -27)), rng.uniform(-.7, .7)); t += rng.uniform(.25, .7)
for q in np.arange(M['s2_cu'] + .05, M['s2_cu'] + 1.45, .34): put(FX, rate(PENCIL, 1.05), q, db(-19), .1)
for t, g_ in [(M['s2'] + 1.3, -30), (M['s2_cu'] + 2.0, -31)]: put(FX, sfx.creak(.5), t, db(g_), .4)
put(FX, fade(filt(sfx.noise(.42), 'band', [500, 2600]) * np.hanning(int(.42 * SR)), .01, .05), evs('sleeve')[0]['t'], db(-27), .35)
# the sting, when we see who it is: a low piano cluster with a long tail
tsg = evs('sting')[0]['t']; cl = sum(tone(f, 3.2, 1.1, (1, .6, .35, .2, .1)) for f in (38.9, 41.2, 58.3, 61.7, 82.4)); put(FX, reverb(fade(cl, .004, .5), 2.2, .35), tsg, db(-17))
put(FX, fade(filt(sfx.noise(.5), 'high', 3000) * np.linspace(0, 1, int(.5 * SR)) ** 3, 0, .01), tsg - .5, db(-30))
tp = evs('pages')[0]['t']; [put(FX, paper(.22), tp + q, db(-22), .1) for q in (0, .28)]
for q in np.arange(tp + .15, tp + 1.3, .21): put(FX, rate(PENCIL, 1.25), q, db(-17), .15)
steps(M['s2_prof'], M['s2_prof'] + .5, 4, -24, -.3); put(FX, paper(.3), M['s2_prof'] + .5, db(-23), -.1)
put(FX, sfx.whoosh(.3, .7), M['s2_ecu'] - .05, db(-22)); put(FX, reverb(sfx.thump(.8, 50), 1.2, .3), M['s2_ecu'], db(-19))
th = evs('pencilHit')[0]['t']; [put(FX, reverb(sfx.click(p, 1), .6, .3), th + q, db(g_), .3) for q, p, g_ in ((0, 1.7, -17), (.13, 1.9, -22), (.22, 2.1, -27))]
tt = evs('thud')[0]['t']; put(FX, reverb(sfx.thump(1, 85) + sfx.clack(.5, .6)[:int(.1 * SR)].sum() * 0, .8, .25), tt, db(-8)); put(FX, sfx.clack(.55, .8), tt + .01, db(-19)); put(FX, paper(.4), tt + .08, db(-23), .1)
# post-exam: chatter, then the world goes under water
bed(M['s3'] - .1, M['s3_spiral'] + .3, walla(M['s3_spiral'] - M['s3'] + .6, 5), -20, .15, .5)
put(FX, sfx.whoosh(.25, .8), evs('whoosh')[0]['t'] - .1, db(-19)); put(FX, reverb(tone(1244, .6, .25, (1, .3)), 1.5, .4), evs('whoosh')[0]['t'], db(-28))
sp0, sp1 = M['s3_spiral'], M['s4']; n = int((sp1 - sp0) * SR); u = np.linspace(0, 1, n)
mur = np.zeros(n); at = 0
for i in range(12):
    x = VOX[['j15', 'a16', 'j17', 'b18', 'j06', 'a16'][i % 6]]; m = min(len(x), n - at)
    if m <= 0: break
    mur[at:at + m] += x[:m]; at += int(len(x) * .8)
out = np.zeros(n); blk = 2048                                    # voices sink: low-pass sweeps 3 kHz → 250 Hz
for i in range(0, n, blk):
    fc = 3000 * (250 / 3000) ** u[min(n - 1, i)]; out[i:i + blk] = filt(np.concatenate([mur[max(0, i - blk):i], mur[i:i + blk]]), 'low', fc)[-len(mur[i:i + blk]):]
put(AMB, fade(reverb(out, 2.4, .5), .05, .02)[:n + int(.2 * SR)], sp0, db(-15))
dr = (np.sin(2 * np.pi * 61.7 * np.arange(n) / SR) + np.sin(2 * np.pi * 87.3 * np.arange(n) / SR) * .8 + np.sin(2 * np.pi * 185.9 * np.arange(n) / SR) * .25) * u ** 1.5; put(AMB, fade(dr, .1, .01), sp0, db(-15))
ring = np.sin(2 * np.pi * 3136 * np.arange(n) / SR) * u ** 2; put(AMB, fade(ring, .1, .01), sp0, db(-33))
slow = rate(seg(S0 + 4, S0 + 12), .7); slow = filt(slow, 'low', 900)[:n]; put(MUS, fade(slow * np.linspace(.3, 1, len(slow))[:, None], .3, .01), sp0, db(-10))
for i, e in enumerate(evs('hb')): put(FX, sfx.heartbeat(1), e['t'], db(-13 + min(9, i * .9)))
# smash cut to the classroom
put(FX, sfx.clack(.9, 1), M['s4'], db(-16)); bed(M['s4'], M['s5_run'], filt(sfx.brown(M['s5_run'] - M['s4'] + .2), 'low', 400), -29, .05, .1)
chirps(M['s4'], M['s5_run'], 16, -29)
for q in np.cumsum(rng.uniform(.14, .4, 9)): put(FX, reverb(sfx.click(2.2, .7), .4, .25), M['s4'] + .1 + q * .55, db(-19), -.3)
for a, b in [(M['s4_two'], M['s4_teacher']), (M['s4_two2'], line['t21']['t1']), (line['j22']['t1'] + .4, M['s4_three'] + 1.2), (line['j26']['t1'] + .4, evs('jingle')[0]['t'])]:
    t = a
    while t < b: put(FX, sfx.click(3.0 + rng.uniform(-.3, .3), .5), t, db(-24), -.25); t += rng.uniform(.07, .19)
tj = evs('jingle')[0]['t']
for i, f in enumerate((1318.5, 1568, 2093)):
    t_ = sfx.t_(.2); put(FX, np.sign(np.sin(2 * np.pi * f * t_)) * np.exp(-t_ / .07) * .5, tj + i * .085, db(-15), -.25)
# sports day
crowd = filt(sfx.noise(M['s5_swim'] - M['s5_run'] + .3), 'band', [350, 2400]); crowd *= (1 + .5 * np.sin(np.linspace(0, 60, len(crowd))) * np.sin(np.linspace(0, 17, len(crowd))))
bed(M['s5_run'], M['s5_swim'], reverb(crowd, 1.2, .4), -33, .1, .1); steps(M['s5_run'] + .05, M['s5_finish'], 6.8, -19, 0, .01, 1); put(FX, sfx.whoosh(.5, 1), M['s5_run'], db(-20))
put(FX, reverb(load(A('sfx_raw', 'whistle.wav')), .7, .2), evs('whistle')[0]['t'] - .1, db(-19), .3); put(FX, sfx.thump(.7, 70), M['s5_finish'] + .45, db(-17))
tb = line['c31']['t0'] - .28; put(FX, tone(2100, .09, .2, (1,)), tb, db(-26), .3)
water = filt(sfx.noise(M['s5_chess'] - M['s5_swim'] + .3), 'band', [300, 3200]); water *= (.6 + .4 * np.sin(np.linspace(0, 40, len(water))) ** 2)
bed(M['s5_swim'], M['s5_chess'], reverb(water, 1.0, .35), -33, .08, .1); SPL = load(A('sfx_raw', 'splash.wav'))
put(FX, SPL, M['s5_swim'] - .12, db(-13)); put(FX, SPL, M['s5_wall'] - .25, db(-11)); put(FX, sfx.thump(.8, 90), M['s5_wall'], db(-15))
put(FX, sfx.clack(.8, 1), evs('piece')[0]['t'], db(-12), -.1); put(FX, sfx.thump(.6, 110), evs('piece')[0]['t'], db(-16))
put(FX, reverb(load(A('sfx_raw', 'applause.wav')), 1.0, .3), evs('applause')[0]['t'], db(-15))
for i, e in enumerate(evs('flip')):
    put(FX, sfx.clack(1.0 + i * .06, 1), e['t'], db(-13)); put(FX, reverb(tone(880 * 2 ** (i / 12), .5, .16, (1, .4)), .8, .3), e['t'] + .05, db(-22))
JV = ['c37', 't20', 'y36', 't21']
for i, e in enumerate(evs('jack')):
    x = VOX[JV[e['v'] % 4]]; x = rate(x, 1 + (.12 * i if e.get('fast') else 0)); put(FX, reverb(sfx.compress(x), .5, .15), e['t'], db(-4 if e.get('fast') else -6), (-.3, .3, 0, .2)[i % 4])
tbj = evs('bigJack')[0]['t']; put(FX, reverb(sfx.crash(1), 1.2, .3), tbj, db(-9)); put(FX, sfx.thump(1, 55), tbj, db(-7))
for i, k in enumerate(JV): put(FX, rate(VOX[k], .8 + i * .08), tbj + .02 * i, db(-7), (i - 1.5) * .3)
roll = np.zeros(int(.9 * SR));
for q in np.arange(0, .9, .045): i = int(q * SR); c = sfx.click(1.4, .6); m = min(len(c), len(roll) - i); roll[i:i + m] += c[:m] * (q / .9) ** 1.5
put(FX, roll, tbj - .9, db(-17))
# sunset
e0 = M['s6']; ed = M['end'] - e0 + .4; breeze = filt(sfx.noise(ed), 'band', [200, 1400]); breeze *= (.6 + .4 * np.sin(np.linspace(0, 9, len(breeze))) ** 2)
bed(e0 + .5, M['end'] + .4, breeze, -31, 1.5, 1.5); chirps(e0 + .7, M['end'] - 1, 34, -25); bed(e0 + 1, M['end'], walla(ed - 1, 9, 900, 12), -31, 2, 2)
steps(e0 + .1, line['y38']['t0'] + .3, 2.8, -19, -.1, .03, .6); steps(line['j43']['t1'] + .25, line['j43']['t1'] + 3.6, 3.0, -18, .35, .02, .6); steps(M['s6_crane'] + .8, M['end'] - 1.6, 2.9, -19, -.3, .02, .6)

# ---------------- master ----------------
FX[:int(M['s2_cut'] * SR)] *= 1; mix = VO + MUS + PERC + FX + AMB
cut = lambda t, d=.02: (int((t - d) * SR), int(t * SR))                      # hard silences on the smash cuts
for t in (M['s4'], M['s6']):
    a, b = cut(t, .03); pre = mix[a:b] * np.linspace(1, 0, b - a)[:, None]; mix[a:b] = pre
s6a, s6b = int(M['s6'] * SR), int((M['s6'] + .55) * SR); mix[s6a:s6b] *= np.linspace(.0, 1, s6b - s6a)[:, None] ** 2
mix = mix[:int(DUR * SR)]; fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.stack([sfx.limit(mix[:, 0] * 1.5, .92), sfx.limit(mix[:, 1] * 1.5, .92)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR, subtype='PCM_16')
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix.wav', round(len(mix) / SR, 2), 's  peak', round(float(np.abs(mix).max()), 3), ' rms dB: voice', round(rms(VO[np.abs(VO).max(1) > .01]), 1), 'music', round(rms(MUS), 1), 'fx', round(rms(FX), 1), 'amb', round(rms(AMB), 1))

for a, b in [('title', 's1'), ('s1', 's2'), ('s2', 's3'), ('s3', 's4'), ('s4', 's5_run'), ('s5_run', 's6'), ('s6', 'end')]:
    i, j = int(M[a] * SR), int(M[b] * SR); print(f"{a:7s} mix {rms(mix[i:j]):6.1f}  voice {rms(VO[i:j]):6.1f}  music {rms(MUS[i:j]):6.1f}  fx {rms((FX + PERC)[i:j]):6.1f}  amb {rms(AMB[i:j]):6.1f}")
