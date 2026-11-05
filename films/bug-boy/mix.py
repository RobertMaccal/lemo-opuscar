"""Mix: narration (voice/vo.wav) + score (out/music.wav) + ambience beds + foley, all synthesised (core/audio/sfx.py) and placed from
timeline.json. Music and ambience duck under the voice. Writes out/mix.wav (48 kHz stereo); mux.sh does the final −14 LUFS.
python mix.py"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import sosfilt, butter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..')))
from core.audio.sfx import SR, add, lp, hp, bp, noise, brown, click, thump, whoosh, ding, pop, rumble, step, compress, limit, env_exp, t_

TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T = TL['T']; DUR = TL['DUR']; N = int(DUR * SR)
SH = {s['id']: (s['a'], s['b']) for s in TL['SHOTS']}
rng = np.random.default_rng(11)
def db(x): return 10 ** (x / 20)
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
def stereo(x, w=.0): return np.stack([x, x], 1) if x.ndim == 1 else x
def lpf(x, f): return lp(x, f)
def tt(d): return t_(d)

# ======================= ambience generators (mono, length d) =======================
def birds(d, dens=1.2):
    x = np.zeros(len(t_(d)))
    for _ in range(int(d * dens)):
        t0 = rng.uniform(0, d - .5); f0 = rng.uniform(2400, 4600); n = rng.integers(2, 6)
        for k in range(n):
            dd = rng.uniform(.04, .1); tk = tt(dd); f = f0 * (1 + rng.uniform(-.25, .3) * tk / dd)
            s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tk / dd) ** 2 * rng.uniform(.2, .6)
            i = int((t0 + k * dd * 1.4) * SR); x[i:i + len(s)] += s[:max(0, len(x) - i)]
    return x * .5
def cicadas(d):
    n = noise(d); c = bp(n, 4200, 7200, 2); am = .55 + .45 * np.sin(2 * np.pi * 42 * tt(d)) * (.6 + .4 * np.sin(2 * np.pi * .13 * tt(d)))
    return c * am * .35
def wind(d, f=500): b = lp(noise(d), f, 2); return b * (.6 + .4 * np.sin(2 * np.pi * .07 * tt(d) + 1)) * 1.2
def stream(d):
    n = bp(noise(d), 300, 2600, 2); am = np.abs(lp(noise(d), 9, 1)) * 6 + .3
    return n * am * .35
def city(d): return lp(brown(d), 220) * 1.4 + .02 * np.sin(2 * np.pi * 100 * tt(d)) + bp(noise(d), 400, 1200) * .05
def crickets(d):
    tk = tt(d); x = np.zeros(len(tk))
    for k in range(3):
        f = 4300 + k * 350; gate = (np.sin(2 * np.pi * (1.3 + k * .4) * tk + k) > .5) * (np.sin(2 * np.pi * 34 * tk) > 0)
        x += np.sin(2 * np.pi * f * tk) * lp(gate.astype(float), 300) * .12
    return x
def roomtone(d): return lp(noise(d), 900) * .25
def crowd(d):
    n = bp(noise(d), 280, 1600, 2); am = np.abs(lp(noise(d), 5, 1)) * 8 + .4
    return n * am * .3
def waves(d):
    tk = tt(d); sw = .5 + .5 * np.sin(2 * np.pi * tk / 6.5) ** 3
    return lp(noise(d), 1400) * (.25 + .75 * sw) * .9 + hp(noise(d), 4000) * sw * .08
def fountain(d): return bp(noise(d), 900, 6000) * .2
def shimmer(d):
    tk = tt(d); x = np.zeros_like(tk)
    for f in [1760, 2217, 2637, 3520]: x += np.sin(2 * np.pi * f * tk + 3 * np.sin(2 * np.pi * .6 * tk)) * (.5 + .5 * np.sin(2 * np.pi * (.3 + f / 9000) * tk))
    return x * .04
# ======================= foley =======================
def chime(notes=(1318.5, 1975.5), v=.5, gap=.09):
    out = np.zeros(int((len(notes) * gap + 1.2) * SR))
    for k, f in enumerate(notes):
        tk = tt(1.1); s = sum(np.sin(2 * np.pi * f * h * tk) * a for h, a in [(1, 1), (2.01, .35), (3.02, .12)]) * np.exp(-tk / .35) * np.minimum(1, tk / .002)
        i = int(k * gap * SR); out[i:i + len(s)] += s
    return out * v * .35
def sparkle(d=.8, v=.5):
    out = np.zeros(int((d + .4) * SR))
    for k in range(14):
        f = rng.uniform(2500, 7000); tk = tt(.25); s = np.sin(2 * np.pi * f * tk) * np.exp(-tk / .05)
        i = int(rng.uniform(0, d) * SR); out[i:i + len(s)] += s * rng.uniform(.3, 1)
    return out * v * .25
def plink(f=1800, v=.4): tk = tt(.25); return np.sin(2 * np.pi * f * tk * (1 + .02 * np.exp(-tk / .01))) * np.exp(-tk / .04) * v
def pencil(d, v=.3): n = bp(noise(d), 2000, 6000); return n * (np.abs(np.sin(2 * np.pi * 3.2 * tt(d))) ** 4) * v
def typing(d, v=.35, rate=9):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)): s = click(rng.uniform(.8, 1.4), rng.uniform(.4, 1)); i = int((k / rate + rng.uniform(0, .04)) * SR); out[i:i + len(s)] += s[:max(0, len(out) - i)]
    return out * v
def flutter(d=.5, v=.4, rate=38): n = bp(noise(d), 300, 3000); return n * (np.sin(2 * np.pi * rate * tt(d)) > 0) * np.sin(np.pi * tt(d) / d) * v
def coin(v=.4): return (plink(3200, 1) + plink(4700, .6)) * v
def paper(v=.3): return bp(noise(.12), 1500, 8000) * np.exp(-tt(.12) / .03) * v
def engine(d, v=.5): tk = tt(d); return (lp(np.sign(np.sin(2 * np.pi * (34 + 4 * np.sin(tk)) * tk)), 300) * .3 + lp(brown(d), 160)) * v
def applause(d, v=.5):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 120)): s = hp(noise(.03), 1200) * np.exp(-tt(.03) / .008); i = int(rng.uniform(0, d - .05) * SR); out[i:i + len(s)] += s * rng.uniform(.2, 1)
    return out * np.minimum(1, tt(d) / .3) * np.minimum(1, (d - tt(d)) / 1.2) * v
def gasp(v=.5): n = bp(noise(.6), 500, 3000); return n * np.sin(np.pi * tt(.6) / .6) ** 2 * v
def boing(v=.4): tk = tt(.5); return np.sin(2 * np.pi * np.cumsum(220 * (1 + .6 * np.exp(-tk / .05)) * (1 + .1 * np.sin(2 * np.pi * 9 * tk))) / SR) * np.exp(-tk / .2) * v
def startchime(v=.6):   # an original two-note power-on chime with a sparkle tail
    out = np.zeros(int(1.6 * SR)); tk = tt(1.4)
    for k, (f, at) in enumerate([(1046.5, 0), (1568, .12)]):
        s = (np.sign(np.sin(2 * np.pi * f * tk)) * .3 + np.sin(2 * np.pi * f * tk)) * np.exp(-tk / (.5 if k else .2)) * np.minimum(1, tk / .002)
        i = int(at * SR); out[i:i + len(s)] += lp(s, 7000)
    out[:len(sparkle(.9))] += sparkle(.9, .6)[:len(out)]
    return out * v * .4

# ======================= beds per shot (with crossfades) =======================
amb = np.zeros((N, 2), np.float32)
def bed(gen, a, b, g, fade=.6, pan=0, w=.3):
    a = max(0, a - fade); b = min(DUR, b + fade); d = b - a
    if d <= 0: return
    x = gen(d); tk = np.arange(len(x)) / SR; e = np.minimum(1, np.minimum(tk / fade, (d - tk) / fade))
    l = x * e; r = np.roll(x, int(.011 * SR)) * e   # a little width
    i = int(a * SR); n = min(len(l), N - i); amb[i:i + n, 0] += l[:n] * g * (1 - w * pan); amb[i:i + n, 1] += r[:n] * g * (1 + w * pan)
for sid in ['leaf', 'path', 'stream']: a, b = SH[sid]; bed(birds, a, b, .9); bed(cicadas, a, b, .55); bed(wind, a, b, .5)
bed(stream, *SH['stream'], .9)
a, b = SH['change']; bed(lambda d: birds(d, .8) * np.clip(1 - tt(d) / (d * .7), 0, 1)[:len(t_(d))], a, b, .9); bed(lambda d: city(d) * np.clip(tt(d) / d, 0, 1)[:len(t_(d))], a, b, 1.0)
for sid in ['wire', 'truck']: a, b = SH[sid]; bed(city, a, b, 1.0); bed(crickets, a, b, .5)
for sid in ['desk', 'eureka']: a, b = SH[sid]; bed(roomtone, a, b, .8); bed(crickets, a, b, .25)
bed(shimmer, *SH['tunnel'], 1.0)
for sid in ['studio', 'mail']: a, b = SH[sid]; bed(roomtone, a, b, 1.0); bed(lambda d: city(d) * .4, a, b, .6)
for sid in ['quit', 'prank', 'boot']: a, b = SH[sid]; bed(roomtone, a, b, .7); bed(crickets, a, b, .3 if sid != 'boot' else .12)
for sid in ['world', 'secret', 'rush', 'phenom', 'kids']: a, b = SH[sid]; bed(birds, a, b, .8); bed(wind, a, b, .5); bed(fountain, a, b, .35 if sid in ('world', 'rush') else .1)
bed(crickets, *SH['lights'], .7)
for sid in ['cards', 'pockets', 'no1']: a, b = SH[sid]; bed(lambda d: wind(d, 800), a, b, .6); bed(lambda d: crowd(d) * .4, a, b, .5)
for sid in ['hall', 'sale']: a, b = SH[sid]; bed(crowd, a, b, .8 if sid == 'hall' else 1.1)
bed(roomtone, *SH['crayon'], .7)
bed(waves, *SH['coast'], 1.4); bed(lambda d: wind(d, 900), *SH['coast'], .7)
bed(lambda d: wind(d, 700), *SH['graph'], .8)
a, b = SH['home']; bed(birds, a, b, 1.0); bed(cicadas, a, b, .5); bed(wind, a, b, .4)

# ======================= foley events =======================
fol = np.zeros((N, 2), np.float32)
def F(x, t, g=1.0, pan=0.0):
    if 0 <= t < DUR: add(fol, x.astype(np.float32), t, g, pan)
# Act I (the countryside was choreographed on a first clock: leaf/path/stream times scale by their shots)
def remap(sid, t_old, oa, ob): a, b = SH[sid]; return a + (t_old - oa) / (ob - oa) * (b - a)
F(plink(2400, .5), remap('leaf', 2.6, 0, 5.6), .5, .1); F(plink(1700, .3), remap('leaf', 2.6, 0, 5.6) + .5, .4, .1)
for t in np.arange(remap('leaf', 3.0, 0, 5.6), SH['leaf'][1], .42): F(lp(step(.4), 2500), t, .35, -.3)
for t in np.arange(SH['path'][0], remap('path', 8.4, 5.6, 10.6), .48): F(lp(step(.45), 2500), t, .4, -.1)
F(chime((1318.5, 1760, 2637)), T['nameIn'], .7)
F(whoosh(.3, .4), remap('path', 8.4, 5.6, 10.6), .3)
F(flutter(2.6, .25, 60), SH['stream'][0] + .5, .3, .3)
for t in np.arange(remap('stream', 12.6, 10.6, 16), T['standUp'], 1.1): F(pencil(.8), t, .55, .1)
F(whoosh(.35, .6), T['standUp'], .5); F(chime((1568, 2093, 2637, 3136), .6, .07), T['rareTitle'], .8)
for k in range(9): F(rumble(1.4, .5), T['changeStart'] + k * .8, .25, rng.uniform(-.5, .5)); F(whoosh(.5, .3), T['changeStart'] + .3 + k * .8, .2, .4)
F(flutter(1.8, .5, 80), T['bugsGone'] - .4, .5, .4)
# Act II
F(sparkle(.6, .6), T['spark'], .6); F(whoosh(.8, 1.0), T['dive'] - .5, .7)
F(sparkle(1.2, .8), SH['eureka'][0], .7); F(chime((1760, 2349, 2794)), SH['eureka'][0] + .2, .5)
for t in np.arange(SH['studio'][0], T['coin0'], 2.0): F(typing(1.2, .3), t, .5, .2); F(pencil(.6, .3), t + 1.1, .4, -.2)
for k in range(10): F(coin(.5), T['coin0'] + k * .2, .5 - k * .04, .3)
F(thump(.6, 90), T['quit1'], .35, -.4); F(thump(.6, 80), T['quit2'], .35, .4)
F(click(1.6, .8), T['boot'] - .25, .5); F(startchime(), T['boot'], .9)
# Act III
F(whoosh(.9, .6), SH['world'][0] - .3, .5)
F(lambda_ := wind(2.4, 1200) * np.sin(np.pi * tt(2.4) / 2.4), T['tumble'], .6); F(crickets(2.0) * 2.2, T['tumble'] + 1.6, .6)   # the comic cricket
F(sparkle(1.5, .5), T['secret'] + .2, .6, -.2)
F(typing(T['mew'] - SH['prank'][0] - .3, .4, 11), SH['prank'][0] + .1, .6, .1)
F(sparkle(1.0, 1.0), T['mew'], .8); F(chime((2093, 2637, 3136, 4186), .5, .05), T['mew'], .6)
for t in np.arange(T['mailIn'], SH['mail'][1], .07): F(paper(.5), t + rng.uniform(0, .05), .3, rng.uniform(-.6, .6))
for k in range(int((SH['rush'][1] - T['rushIn']) * 4)): F(lp(step(.3), 3000), T['rushIn'] + k * .25 + rng.uniform(0, .1), .25, rng.uniform(-.7, .7))
F(applause(4.0, .5) * .6, T['rushIn'] + .5, .4)
F(sparkle(2.0, .5), SH['phenom'][0] + .5, .4)
for k in range(28): F(plink(rng.uniform(1500, 3000), .3), SH['lights'][0] + .3 + k * .1, .3, rng.uniform(-.6, .6))
for (a, d) in [(T['entries'] - .9, 1.2), (T['games'] - .1, 1.7), (T['cardsCap'] - .1, 1.7), (T['gavel'], .9)]:
    for k in range(int(d / .05)): F(click(2.2, .3), a + .1 + k * .05, .25, .1)
for t in np.arange(SH['cards'][0], SH['cards'][1], .5): F(paper(.4), t, .2, rng.uniform(-.5, .5))
F(boing(.5), T['where'] + .1, .5); F(crickets(1.6) * 2, T['where'] + .6, .4)
F(pop(.6), T['no1'] + .4, .5); F(applause(3.5, .6), T['no1'] + .5, .5)
# Act IV
F(thump(1.0, 55), T['slab'], .7); F(lp(noise(.08), 2000) * np.exp(-tt(.08) / .02), T['slab'], .6)
F(gasp(.6), T['slab'] + .3, .5)
for k in range(6): F(paper(.5), SH['sale'][0] + 1 + k * 1.7, .3, -.4)
F(thump(1.0, 120), T['gavel'], .9); F(click(.6, 1.0), T['gavel'], .8); F(gasp(1.0), T['gavel'] + .15, .7); F(applause(4.5, .9), T['record'], .8)
for t in np.arange(SH['crayon'][0] + .3, SH['crayon'][1] - .3, .9): F(pencil(.7, .45), t, .5, .1)
F(engine(SH['truck'][1] - SH['truck'][0], .6) * np.minimum(1, tt(SH['truck'][1] - SH['truck'][0]) / .5), SH['truck'][0], .6, .2)
F(hp(noise(.6), 2500) * np.exp(-tt(.6) / .25), SH['truck'][0] + .4, .3)   # air brake
F(flutter(1.6, .4, 22), T['mom'] + 1.6, .5, -.3)
# Act V
for k in range(5): F(birds(1.2, 2) * 1.5, SH['coast'][0] + k * 1.5, .5, rng.uniform(-.5, .5))
for t in np.arange(T['climb'], T['crash'], .4): F(click(.8, .5), t, .35, 0)
F(whoosh(1.2, .5), T['fog'], .5)
F(rumble(1.8, 1.0), T['crash'], .8); F(np.sin(2 * np.pi * np.cumsum(np.linspace(1400, 300, int(.8 * SR))) / SR) * np.exp(-tt(.8) / .5) * .3, T['crash'], .5)
F(ding(.5), T['fog'] + .25, .4)
F(sparkle(1.5, .5), SH['kids'][0] + 2, .4)
F(whoosh(1.4, .7)[::-1].copy(), T['shrink'] + .1, .6)
F(flutter(1.6, .5, 70), T['fly'] - .6, .6, .3)

# ======================= voice, music, ducking =======================
vo, _ = sf.read(os.path.join(HERE, 'voice', 'vo.wav'), dtype='float32'); vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))
vo = hp(vo, 70); vo = compress(vo, thr=.18, ratio=3.0)
mu, _ = sf.read(os.path.join(HERE, 'out', 'music.wav'), dtype='float32'); mu = mu[:N] if len(mu) >= N else np.pad(mu, ((0, N - len(mu)), (0, 0)))
# levels by RMS (voice where it speaks)
act = np.abs(vo) > .01
vo *= db(-17) / rms(vo[act]); mu *= db(-22) / rms(mu); amb *= db(-33) / rms(amb); fol *= db(-29) / rms(fol[np.abs(fol).sum(1) > 1e-4])
# per-line duck: an envelope of the voice (attack 60 ms, release 450 ms) pulls music −8 dB and ambience −5 dB
e = np.abs(vo); win = int(.03 * SR); e = np.convolve(e, np.ones(win) / win, 'same')
g = (e > .004).astype(float)
k_att, k_rel = 1 - np.exp(-1 / (.06 * SR)), 1 - np.exp(-1 / (.45 * SR)); d = np.zeros_like(g); s = 0.0
for i in range(0, len(g), 64):      # block-wise smoothing (fast enough)
    tgt = g[i]; s += (tgt - s) * (1 - (1 - (k_att if tgt > s else k_rel)) ** 64); d[i:i + 64] = s
duck_m = db(-8 * d)[:, None]; duck_a = db(-5 * d)[:, None]
mix = stereo(vo) + mu * duck_m + amb * duck_a + fol
mix = np.tanh(mix * 1.1) / 1.1
mix = np.stack([lp(mix[:, 0], 16000, 2), lp(mix[:, 1], 16000, 2)], 1)   # nothing useful above 16 kHz; keeps the AAC encoder from overshooting
# master to ≈ −14 LUFS here, with a 4× oversampled peak limiter at −3.2 dB (AAC adds overshoot), so mux.sh's loudnorm has almost nothing left to do
import subprocess, json as _j, soxr
def lufs(x):
    tmp = os.path.join(HERE, 'out', '_lufs.wav'); sf.write(tmp, x.astype(np.float32), SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(_j.loads(r[r.rindex('{'):r.rindex('}') + 1])['input_i'])
def tp_limit(x, ceil_db=-3.2, look=.004, rel=.12):
    up = soxr.resample(x, SR, SR * 4); pk = np.abs(up).reshape(-1, 4, 2).max(axis=(1, 2))   # true-peak estimate per sample
    c = db(ceil_db); need = np.minimum(1, c / np.maximum(pk, 1e-9))
    # look-ahead minimum (block-wise), then smooth release
    blk = 64; nb = (len(need) + blk - 1) // blk; nb_min = np.array([need[i * blk:(i + 1) * blk].min() for i in range(nb)])
    la = int(np.ceil(look * SR / blk)); m2 = np.array([nb_min[i:i + la + 1].min() for i in range(nb)])
    a = np.exp(-blk / (rel * SR)); gs = np.empty(nb); cur = 1.0
    for i in range(nb): cur = m2[i] if m2[i] < cur else m2[i] + (cur - m2[i]) * a; gs[i] = cur
    gain = np.repeat(gs, blk)[:len(x)]
    return x * gain[:, None]
L0 = lufs(mix); mix = mix * db(-14.0 - L0)
for _ in range(2): mix = tp_limit(mix); L1 = lufs(mix); mix = mix * db(-14.0 - L1)
mix = tp_limit(mix)
print('mastered mix:', round(lufs(mix), 2), 'LUFS')
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix', DUR, 's  peak', np.abs(mix).max().round(3), ' voice rms', round(20 * np.log10(rms(vo[act])), 1), 'dB')
