"""THE LAST WINDOW — original score and foley, synthesised deterministically from the film's event list.
No samples, no voice. Reads <film>/events.json, writes $OUT/mix.wav (48 kHz stereo) and stems."""
import json, os, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
OUT = os.environ.get('OUT', os.path.join(FILM, 'out')); os.makedirs(OUT, exist_ok=True)
SR = 48000
E = json.load(open(os.environ.get('EVENTS', os.path.join(FILM, 'events.json')))); DUR = E['dur']; EV = E['ev']
N = int(DUR * SR) + SR * 0  # exact length
rng = np.random.default_rng(1234)

def buf(): return np.zeros((2, N))
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def add(B, s, t, g=1.0, pan=0.0):
    """add mono or stereo s at time t with equal-power pan"""
    i = int(round(t * SR))
    if s.ndim == 1: s = np.vstack([s * np.cos((pan + 1) * np.pi / 4), s * np.sin((pan + 1) * np.pi / 4)]) * 1.414
    if i < 0: s = s[:, -i:]; i = 0
    n = min(s.shape[1], N - i)
    if n > 0: B[:, i:i + n] += s[:, :n] * g
def env_adsr(n, a, d, s, r_start, r, sr=SR):
    t = np.arange(n) / sr; e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    if r_start is not None: e = e * np.where(t < r_start, 1, np.exp(-(t - r_start) / max(r, 1e-4)))
    return e
def db(x): return 10 ** (x / 20)

# ------------------------------------------------------------------ instruments
def piano(m, vel=0.6, dur=4.5, mellow=0.0, wow=True):
    f0 = mtof(m); n = int(dur * SR); t = np.arange(n) / SR; B = 0.00035
    out = np.zeros(n)
    for det in (-0.06, 0.07):                    # two strings, slightly apart (detuned, nostalgic)
        f = f0 * 2 ** (det / 12)
        ph_wow = (0.004 * np.sin(2 * np.pi * 0.45 * t + det * 50) + 0.002 * np.sin(2 * np.pi * 6.1 * t)) if wow else 0
        for k in range(1, 13):
            fk = k * f * np.sqrt(1 + B * k * k)
            if fk > 12000: break
            amp = (1 / k ** (1.25 + mellow)) * (0.9 if k == 1 else 1)
            dec = 0.6 + 2.4 / (1 + k * 0.7 + f0 / 600)
            out += amp * np.exp(-t / dec * (1 + mellow)) * np.sin(2 * np.pi * fk * t * (1 + ph_wow) + k)
    ham = bp(rng.standard_normal(n) * np.exp(-t / 0.006), 800, 5000) * 0.25 * (1 - mellow)
    out = (out + ham) * np.minimum(1, t / 0.002) * vel
    return out * 0.18
def pad(notes, t0, t1, att=2.5, rel=2.5, bright=900, level=1.0, detune=0.12):
    n = int((t1 - t0 + rel * 3) * SR); t = np.arange(n) / SR; out = np.zeros((2, n))
    for j, m in enumerate(notes):
        f = mtof(m)
        for ch in (0, 1):
            s = np.zeros(n)
            for v in (-detune, 0, detune):
                fv = f * 2 ** ((v + (0.03 if ch else -0.03)) / 12) * (1 + 0.0015 * np.sin(2 * np.pi * (0.13 + 0.07 * j) * t + ch))
                ph = np.cumsum(np.full(n, fv)) / SR
                for k in range(1, 9):
                    s += np.sin(2 * np.pi * k * ph + v * 3 + k) / k ** 1.15
                s += 0.0
            out[ch] += s
    e = np.minimum(1, t / att) * np.where(t < (t1 - t0), 1, np.exp(-(t - (t1 - t0)) / rel))
    out = np.vstack([lp(out[0], bright, 2), lp(out[1], bright, 2)]) * e
    return out * 0.012 * level
def bell(m, vel=0.5, dur=5.0, ratio=3.5, index=2.2):
    f = mtof(m); n = int(dur * SR); t = np.arange(n) / SR
    I = index * np.exp(-t / 1.2); mod = np.sin(2 * np.pi * f * ratio * t)
    s = np.sin(2 * np.pi * f * t + I * mod) * np.exp(-t / 1.8) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.9)
    return s * np.minimum(1, t / 0.003) * vel * 0.12
def musicbox(m, vel=0.5, dur=1.6):
    f = mtof(m); n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.55) + 0.3 * np.sin(2 * np.pi * f * 4.02 * t) * np.exp(-t / 0.12) + 0.12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.05)
    return s * np.minimum(1, t / 0.002) * vel * 0.09
def reverse_piano(m, end, vel=0.5, length=2.4):
    s = piano(m, vel, length + 0.3)[: int(length * SR)][::-1]
    s = s * np.linspace(0, 1, len(s)) ** 1.5
    return s, end - length

# ------------------------------------------------------------------ reverb (stereo, exponentially decaying noise IR)
def make_ir(sec=3.4, damp=0.55):
    n = int(sec * SR); t = np.arange(n) / SR; ir = np.zeros((2, n))
    for c in range(2):
        x = rng.standard_normal(n) * np.exp(-t / (sec / 6.9))
        bright = lp(x, 6500); dark = lp(x, 1600)
        mixw = np.clip(t / (sec * damp), 0, 1)
        ir[c] = bright * (1 - mixw) + dark * mixw
        ir[c][: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
IR = make_ir(); IR_ROOM = make_ir(0.6, 0.4)
def reverb(B, ir=IR, wet=0.35):
    out = np.vstack([fftconvolve(B[0], ir[0])[:N], fftconvolve(B[1], ir[1])[:N]])
    return B * (1 - wet) + out * wet * 1.3

# ------------------------------------------------------------------ score (75 bpm, bar = 3.2 s)
MUS = buf()
D3, A3, B3, C5 = 50, 57, 59, 72
# drone: D2 with a little 2nd/3rd harmonic so it speaks on small speakers; out at 32.8, back softly at 34.4
t = np.arange(N) / SR
drone_env = np.clip(t / 3.0, 0, 1) * np.where(t < 32.0, 1, np.clip(1 - (t - 32.0) / 0.8, 0, 1)) + np.clip((t - 34.4) / 2.0, 0, 1) * np.clip((39.5 - t) / 3.0, 0, 1) * 0.7
drone_env *= (0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t))
fd = np.where(t < 29.6, mtof(38), mtof(38) * 2 ** (-2 / 12) * np.clip((t - 29.6) / 0.8, 0, 1) + mtof(38) * (1 - np.clip((t - 29.6) / 0.8, 0, 1)))
fd = np.where(t > 34.4, mtof(38), fd)
ph = np.cumsum(fd) / SR
drone = (np.sin(2 * np.pi * ph) * 0.55 + np.sin(4 * np.pi * ph) * 0.35 + np.sin(6 * np.pi * ph) * 0.18) * drone_env * 0.05
add(MUS, drone, 0, 1.0)
# pads
PADS = [
    ([D3, A3, 64, 66, 69], 0.0, 5.2, 2.6, 2.5, 850, 1.0),       # I  Dmaj9
    ([B3, 62, 66, 69, 73], 5.0, 8.2, 1.6, 2.2, 900, 0.95),      # II Bm9
    ([55, B3, 62, 66], 8.0, 11.4, 1.6, 2.2, 900, 0.9),           #    Gmaj7
    ([52, 55, B3, 62, 66], 11.2, 13.4, 1.6, 1.8, 800, 0.8),      #    Em9
    ([A3, 64], 13.2, 18.2, 1.8, 1.6, 700, 0.85),                 # III sus, thin
    ([55, B3, 62, 66, 69], 18.4, 21.8, 1.4, 2.2, 1300, 1.05),    # IV Gmaj9, warmer
    ([D3, 62, 66, 69, 73, 76], 21.6, 25.4, 1.6, 2.2, 1350, 1.0), #    Dmaj9
    ([B3, 62, 66], 25.0, 29.8, 1.4, 1.8, 1000, 0.85),            # V  Bm
    ([55, 58, 62], 29.6, 32.6, 1.0, 0.6, 900, 0.85),             #    Gm (borrowed iv, uneasy)
    ([55, B3, 62, 66, 69, 73], 34.4, 36.6, 1.1, 2.0, 1500, 1.15),# VII Gmaj9#11 bloom
    ([D3, A3, 64, 66, 68, 73], 36.4, 37.6, 1.3, 2.3, 1300, 1.1), #    Dmaj9 add #11, decays to the loop seam
]
for notes, a, b, att, rel, br, lv in PADS: add(MUS, pad(notes, a, b, att, rel, br, lv), a)
# piano: isolated notes, the motif, the descending line on the six little lights
for m, tt, v in [(69, 0.8, .45), (78, 2.4, .35), (76, 4.0, .4)]: add(MUS, piano(m, v), tt, 1, (m - 70) / 30)
for bar in (4.8, 8.0, 11.2):
    for off, m, v in [(0, 78, .42), (0.8, 69, .3), (1.6, 76, .36), (2.0, 74, .34)]: add(MUS, piano(m, v), bar + off, 1, (m - 70) / 25)
LINE = [69, 67, 66, 64, 62, 59]
vig = [e for e in EV if e['type'] == 'off' and e.get('vig')]
for e, m in zip(vig, LINE): add(MUS, piano(m, .55, 5.0), e['t'], 1, e['pan'] * .5)
# III: a distant high bell, reversed swell into the push
add(MUS, bell(81, .5, 6, 3.5, 1.6), 13.6, 1, .3)
for m in (74, 81):
    s, st = reverse_piano(m, 18.8, .55, 2.6); add(MUS, s, st, .9, (m - 77) / 20)
# IV: felt piano, close
for m, tt in [(71, 19.2), (74, 20.8), (69, 22.4), (78, 23.2), (76, 24.0)]: add(MUS, piano(m, .4, 4.5, mellow=.5), tt, 1, (m - 72) / 30)
# V: music-box pattern in 8ths; one note drops at each click, a flat sixth creeps in
pat = [74, 78, 81, 76, 74, 78, 81, 73]
for i in range(int((32.0 - 25.6) / 0.4)):
    tt = 25.6 + i * 0.4; m = pat[i % 8]
    if tt >= 27.2 and i % 8 == 3: continue
    if tt >= 29.6 and m == 81: m = 82                 # B-flat: the unease
    if tt >= 31.2 and i % 2: continue                 # thinning before the turn
    add(MUS, musicbox(m, .5 if i % 4 == 0 else .36), tt, 1, ((i % 8) - 3.5) / 8)
for end in (28.0, 31.2):
    s, st = reverse_piano(62, end, .5, 2.2); add(MUS, s, st, .8, -.2)
    s, st = reverse_piano(69, end, .45, 2.2); add(MUS, s, st, .7, .2)
# VII: the bell on the switch, a rising harmonic shimmer, last piano notes
add(MUS, bell(86, .7, 7, 3.5, 2.0), 34.4, 1, .1); add(MUS, bell(74, .5, 7, 2.0, 1.2), 34.42, 1, -.1)
sh_t = np.arange(int(5.0 * SR)) / SR; sh_env = np.clip(sh_t / 2.0, 0, 1) * np.clip((5.0 - sh_t) / 2.6, 0, 1)
shim = sum(np.sin(2 * np.pi * mtof(m) * sh_t * (1 + 0.002 * np.sin(2 * np.pi * 4.6 * sh_t + m))) / (1 + i) for i, m in enumerate([86, 93, 98]))
add(MUS, shim * sh_env * 0.012, 34.6, 1)
for m, tt, v in [(69, 36.4, .35), (78, 36.42, .3), (76, 38.0, .28)]: add(MUS, piano(m, v, 3.6, mellow=.3), tt, 1, (m - 72) / 30)
# tape hiss (soft, constant so the loop seam is clean)
hiss = hp(rng.standard_normal((2, N)), 3500) * db(-56)
MUS = reverb(MUS, IR, 0.42) + hiss
MUS = np.vstack([lp(MUS[0], 9000), lp(MUS[1], 9000)])
# hard end of section VI: the music's tail goes to zero, only rain and the clock remain
gate = np.ones(N); i0, i1 = int(32.85 * SR), int(33.7 * SR); gate[i0:i1] = np.linspace(1, 0, i1 - i0) ** 2; gate[i1:int(34.38 * SR)] = 0
MUS *= gate
# the seam: last 0.3 s ease to zero, first 0.15 s ease in
MUS[:, -int(.3 * SR):] *= np.linspace(1, 0, int(.3 * SR)); MUS[:, :int(.15 * SR)] *= np.linspace(0, 1, int(.15 * SR))

# ------------------------------------------------------------------ ambience
def ev(tp): return [e for e in EV if e['type'] == tp]
ENTER = ev('enter')[0]['t']; EXIT = ev('exit')[0]['t']
def ramp(a0, a1, b0, b1):   # 0 outside, 1 inside [a1,b0], linear edges
    return np.clip((t - a0) / (a1 - a0), 0, 1) * np.clip((b1 - t) / (b1 - b0), 0, 1)
inside = ramp(ENTER - 1.0, ENTER + 0.1, EXIT - 0.1, EXIT + 0.7)
noise = rng.standard_normal((2, N))
rain_ext = np.vstack([bp(noise[c], 400, 9000, 2) for c in range(2)]) * 0.05
drops = np.zeros((2, N)); idx = rng.integers(0, N, 9000); amp = rng.random(9000) ** 3
for c in range(2):
    sel = idx[c::2]; drops[c, sel] = amp[c::2] * rng.choice([-1, 1], len(sel))
drops = np.vstack([bp(drops[c], 1500, 7000) for c in range(2)]) * 0.9
rain_ext = (rain_ext + drops) * (0.9 + 0.1 * np.sin(2 * np.pi * 0.07 * t))
rain_in = np.vstack([lp(noise[c], 700, 2) for c in range(2)]) * 0.07
glass = np.zeros((2, N)); gi = rng.integers(0, N, 900)
for k, i in enumerate(gi): glass[k % 2, i] = (rng.random() ** 2) * (1 if k % 3 else -1)
glass = np.vstack([bp(glass[c], 2500, 6000) for c in range(2)]) * 0.35
room_tone = np.vstack([hp(lp(np.cumsum(rng.standard_normal(N)) * .002, 300), 60, 4) for _ in range(2)])
room_tone -= room_tone.mean(axis=1, keepdims=True)
city = np.vstack([bp(noise[1 - c], 60, 220) for c in range(2)]) * 0.02
AMB = rain_ext * (1 - inside * .9) + city * (1 - inside) + (rain_in + glass) * inside + room_tone * inside * 0.6

# ------------------------------------------------------------------ foley
FX = buf(); FXR = buf()    # dry / to the room reverb
def tone(f, dur, dec, ph=0.0):
    tt = np.arange(int(dur * SR)) / SR; return np.sin(2 * np.pi * f * tt + ph) * np.exp(-tt / dec)
def nburst(dur, dec, a, b):
    n = int(dur * SR); tt = np.arange(n) / SR; return bp(rng.standard_normal(n), a, b) * np.exp(-tt / dec)
def click(bright=1.0, size=1.0):
    s = tone(190 / size, .04, .012) * .4; s[:960] += nburst(.02, .0025, 1800 * bright, min(16000, 7000 * bright)) * 1.2 + tone(1700 * bright, .02, .004) * .5
    s2 = nburst(.015, .002, 2200 * bright, min(16000, 8000 * bright)) * .7
    out = np.zeros(len(s) + int(.028 * SR)); out[:len(s)] += s; out[int(.028 * SR):int(.028 * SR) + len(s2)] += s2
    return out
for e in ev('off'):
    s = lp(click(.9), 5000 if e['g'] > .5 else 2500)
    add(FXR, s, e['t'], 0.16 * e['g'] * (1.4 if e.get('vig') else 1), e['pan'])
for e in ev('book'): add(FXR, lp(nburst(.15, .03, 100, 900), 900), e['t'], .25 * e['g'], e['pan'])
for e in ev('tvoff'):
    n = int(.12 * SR); tt = np.arange(n) / SR; sw = np.sin(2 * np.pi * np.cumsum(5000 * np.exp(-tt / .02) + 300) / SR) * np.exp(-tt / .05)
    add(FXR, sw * .5 + nburst(.12, .03, 3000, 9000)[:n] * .3, e['t'], .14 * e['g'], e['pan'])
for e in ev('cup'): add(FXR, tone(3150, .5, .12) + tone(4720, .5, .08) * .6, e['t'], .03 * e['g'], e['pan'])
for e in ev('laptop'): add(FXR, click(.7, 1.4), e['t'], .12 * e['g'], e['pan']); add(FXR, lp(nburst(.08, .02, 200, 1200), 1200) * .6, e['t'], .12 * e['g'], e['pan'])
for e in ev('thunder'):
    n = int(4.5 * SR); tt = np.arange(n) / SR; x = np.cumsum(rng.standard_normal(n)); x = lp(hp(x, 25), 160, 3)
    envt = np.zeros(n)
    for k in range(5): c0 = 0.15 + k * 0.45 + rng.random() * .2; envt += np.exp(-np.maximum(0, tt - c0) / (0.5 + k * .3)) * (tt > c0) * (1 - k * .15)
    x = x / (np.abs(x).max() + 1e-9) * envt * np.minimum(1, tt / .2)
    add(FX, x, e['t'], .22 * e['g'], -.3)
for e in ev('car'):
    t0, t1 = e['t'], e['t1']; n = int((t1 - t0) * SR); tt = np.arange(n) / SR; u = tt / (t1 - t0)
    bell_env = np.exp(-((u - .5) / .2) ** 2)
    hiss_c = bp(rng.standard_normal(n), 700, 5500) * (0.8 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tt)))
    f_eng = 72 * np.where(u < .5, 1.03, 0.97); eng = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f_eng) / SR)) * 0.5, 300)
    s = (hiss_c * .8 + eng * .3) * bell_env
    pan = np.clip((u - .5) * 2.2 * e['dir'], -1, 1)
    st = np.vstack([s * np.cos((pan + 1) * np.pi / 4), s * np.sin((pan + 1) * np.pi / 4)]) * 1.414
    add(FX, st, t0, .1 * e['g'])
for e in ev('tick'):
    s = nburst(.03, .003, 2000, 6000) * .7 + tone(2900 if e['n'] % 2 else 2300, .03, .006) * .6 + tone(1100, .03, .008) * .3
    w = inside[int(min(N - 1, e['t'] * SR))]
    g = .05 * (0.25 + 0.75 * w) if e['t'] < EXIT + 0.7 else 0
    add(FXR, lp(s, 2500 + 6000 * w), e['t'], g, -.45)
for e in ev('place'):
    add(FXR, nburst(.25, .07, 2000, 6000) * .25, e['t'] - .22, .3)
    s = tone(620, .12, .05); s[:4800] += tone(1340, .1, .03) * .6; s[:3840] += tone(2210, .08, .02) * .4; s[:960] += nburst(.02, .003, 1000, 4000) * .5
    add(FXR, s, e['t'], .3, .1)
for e in ev('minilamp'): add(FXR, click(2.2, .5), e['t'], .14, .25); add(FXR, tone(2620, .5, .15), e['t'] + .03, .035, .25)
for e in ev('press'):
    c = click(2.4, .5); add(FXR, c, e['t'], .2, e['pan'] * .4)
    far = lp(c, 1400); add(FX, reverb(np.vstack([np.pad(far, (0, N - len(far)))] * 2), IR, .9)[:, :int(2.5 * SR)], e['t'] + .14, .09, e['pan'])
for e in ev('rustle'): add(FXR, nburst(.35, .1, 900, 3500) * np.hanning(int(.35 * SR)), e['t'], .06, -.2)
for e in ev('creak'):
    n = int(.4 * SR); tt = np.arange(n) / SR; f = 150 + 25 * tt / .4 + 6 * rng.standard_normal(n).cumsum() / 300
    s = bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500) * np.hanning(n); add(FXR, s, e['t'], .05, -.4)
FLICK = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0]
for e in ev('flicker'):
    t0 = e['t']; n = int(.9 * SR); tt = np.arange(n) / SR
    gate_f = np.array([FLICK[min(11, int(x * 15))] if x < .8 else 0 for x in tt]); gate_f = lp(gate_f, 120)
    buzz = lp(np.sign(np.sin(2 * np.pi * 100 * tt)) + .3 * np.sin(2 * np.pi * 200 * tt), 2200) * gate_f * .35
    pops = np.zeros(n)
    for k in range(1, 12):
        if FLICK[k] != FLICK[k - 1]: i = int(k / 15 * SR); pops[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 60)
    add(FXR, buzz + bp(pops, 1500, 8000) * .8, t0, .12, .5)
    pop = tone(900, .2, .04) * np.linspace(1, .2, int(.2 * SR)); pop[:2400] += nburst(.05, .01, 2000, 8000); add(FXR, pop, t0 + .8, .1, .5)   # the bulb gives out
for e in ev('relight'):
    add(FXR, click(2.6, .5), e['t'], .32, 0)
    n = int(3.5 * SR); tt = np.arange(n) / SR; hum = (np.sin(2 * np.pi * 110 * tt) * .5 + np.sin(2 * np.pi * 220 * tt) * .4 + np.sin(2 * np.pi * 330 * tt) * .2)
    add(FX, hum * np.minimum(1, tt / .7) * np.exp(-np.maximum(0, tt - .7) / 1.2) * .03, e['t'] + .05, 1)
FX = FX + reverb(FXR, IR_ROOM, .3)

# ------------------------------------------------------------------ balance and write
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
MUS *= 0.10 / rms(MUS[:, :int(32 * SR)])
AMB *= 0.10 * db(-9) / rms(AMB)
FX *= 1.0
MIX = MUS + AMB + FX * 0.55
MIX = np.vstack([hp(MIX[0], 38, 4), hp(MIX[1], 38, 4)])        # no sub-bass rumble
# gentle bus compression + soft clip
pk = np.abs(MIX).max(); MIX = MIX / pk * 0.89
MIX = np.tanh(MIX * 1.1) / np.tanh(1.1)
for name, s in [('music', MUS), ('ambience', AMB), ('foley', FX)]: sf.write(os.path.join(OUT, f'stem_{name}.wav'), (s.T / max(1e-9, np.abs(s).max()) * .9).astype(np.float32), SR)
sf.write(os.path.join(OUT, 'mix.wav'), MIX.T.astype(np.float32), SR, subtype='PCM_24')
# low-end check
spec = np.abs(np.fft.rfft(MIX.mean(axis=0))) ** 2; fr = np.fft.rfftfreq(N, 1 / SR)
lo = spec[(fr > 20) & (fr < 120)].sum(); rest = spec[(fr >= 120) & (fr < 12000)].sum()
print(f'mix.wav {N / SR:.2f}s  low(20-120)/rest = {10 * np.log10(lo / rest):+.1f} dB  peak {np.abs(MIX).max():.2f}')
