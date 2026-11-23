# Mix: voice + score (take 3, ducked under speech, silences on the big beats) + ambience beds + spot SFX → mix.wav
import numpy as np, soundfile as sf, os
from scipy.ndimage import uniform_filter1d
ma = lambda x, n: uniform_filter1d(x, size=max(1, int(n)), mode='nearest')
SR = 48000; DUR = 87.5; N = int(DUR * SR)
D = os.path.dirname(os.path.abspath(__file__))
def load(name):
    a, sr = sf.read(os.path.join(D, name), dtype='float32')
    if a.ndim == 1: a = np.stack([a, a], 1)
    assert sr == SR, (name, sr); return a
def db(x): return 10 ** (x / 20)
def rms(a): return np.sqrt(np.mean(a ** 2) + 1e-12)
def onset(a, rel=-22):
    e = np.sqrt(ma((a ** 2).mean(1), 480)); thr = e.max() * db(rel)
    i = np.argmax(e > thr); return i
mix = np.zeros((N, 2), np.float32)
def put(buf, at, gain=0, pan=0):
    i = int(at * SR);
    if i < 0: buf = buf[-i:]; i = 0
    n = min(len(buf), N - i)
    if n <= 0: return
    g = db(gain); l, r = (1 - max(0, pan)), (1 + min(0, pan))
    mix[i:i + n, 0] += buf[:n, 0] * g * l; mix[i:i + n, 1] += buf[:n, 1] * g * r
def fade(a, fi=.05, fo=.2):
    a = a.copy(); n1, n2 = int(fi * SR), int(fo * SR)
    if n1: a[:n1] *= np.linspace(0, 1, n1)[:, None]
    if n2: a[-n2:] *= np.linspace(1, 0, n2)[:, None]
    return a
SFX = {k: load(f'sfx/{k}.wav') for k in ['attic_steps', 'attic_steps2', 'barn_door', 'boom', 'boom2', 'clock', 'cows', 'crowbar', 'crows', 'door_forced', 'fire', 'heartbeat', 'key', 'knife', 'ladder', 'lantern', 'musicbox', 'paper', 'pop', 'riser', 'snow_steps', 'stinger', 'stinger2', 'whoosh', 'whoosh2', 'wind']}
# normalise every effect to the same RMS-at-its-loudest-second, so gains below are relative
for k, a in SFX.items():
    e = np.sqrt(ma((a ** 2).mean(1), SR // 2)); SFX[k] = a / (e.max() + 1e-9) * db(-20)
# spot: hit = put the sound's onset at time t
def hit(k, t, gain=0, pan=0, dur=None, fo=.15, start=None):
    a = SFX[k]; o = onset(a) if start is None else int(start * SR)
    seg_ = a[o:o + int(dur * SR)] if dur else a[o:]
    put(fade(seg_, .005, fo), t, gain, pan)
# bed: an ambience between t0 and t1 with fades, looping
def bed(k, t0, t1, gain=0, fi=.4, fo=.6, off=0):
    a = SFX[k]; n = int((t1 - t0) * SR); reps = int(np.ceil((n + int(off * SR)) / len(a))) + 1
    b = np.concatenate([a] * reps)[int(off * SR):int(off * SR) + n]
    put(fade(b, fi, fo), t0, gain)

# ---------- ambience beds (exterior wind, interiors)
for t0, t1, g in [(0, 14.7, -8), (26.4, 31.2, -12), (39.9, 43.0, -13), (43.95, 50.6, -10), (54.9, 56.75, -10), (56.7, 58.8, -16), (63.9, 68.1, -9), (83.0, 87.5, -7)]: bed('wind', t0, t1, g, off=t0 % 20)
bed('fire', 14.5, 18.9, -17); bed('clock', 14.5, 18.9, -21)
bed('clock', 31.0, 33.6, -16); bed('clock', 67.9, 71.3, -15, off=3)
bed('lantern', 36.3, 39.95, -16)
bed('cows', 47.7, 50.6, -17); bed('cows', 58.7, 61.2, -12, off=6)
bed('fire', 64.0, 66.1, -19, off=8)
bed('crows', 10.6, 14.6, -14); bed('crows', 39.9, 42.9, -20, off=4)
# ---------- spot effects (picture + word cues)
hit('boom', 0.02, -2)                       # hook impact
hit('snow_steps', .35, -16, dur=3.0)        # crunching steps
hit('whoosh', 1.45, -12); hit('whoosh2', 3.6, -14); hit('whoosh', 4.95, -13)
hit('riser', 7.3, -10)                       # rise into "walked back out"
hit('stinger', 9.72, -5)                    # "out."
hit('whoosh2', 10.6, -14); hit('whoosh', 12.2, -16); hit('whoosh2', 14.45, -14)
hit('pop', 18.7, -18, dur=.4); hit('door_forced', 19.0, -18, dur=1.2)
hit('attic_steps2', 22.6, -9, dur=2.2)       # noises above the maid's bed
hit('attic_steps', 23.95, -8, dur=1.1)
hit('whoosh', 24.75, -10); hit('key', 25.0, -8)
hit('paper', 26.6, -11, dur=2.0); hit('pop', 28.25, -17, dur=.4)
hit('heartbeat', 31.2, -12); hit('heartbeat', 33.6, -14)
for i, t in enumerate([33.66, 34.25, 34.85, 35.45]): hit('attic_steps', t, -5 + i * .5, dur=.55, fo=.2)
hit('ladder', 36.2, -10, dur=2.0)
hit('heartbeat', 38.4, -9)                   # "Nobody was there." (music out)
hit('whoosh2', 39.85, -14)
hit('whoosh', 42.75, -10); hit('pop', 42.9, -14, dur=.4)
hit('snow_steps', 44.05, -14, dur=1.3)
hit('whoosh2', 45.4, -15)
hit('barn_door', 48.1, -6, dur=1.6)
hit('boom2', 49.55, -4)                      # door slams on "one."
hit('attic_steps2', 50.6, -12, dur=1.8)      # someone walks inside
hit('musicbox', 52.2, -9, dur=2.9, fo=.6)    # winds down on "crib."
hit('whoosh', 54.85, -8); hit('stinger2', 54.95, -6)   # "here's the scariest part"
hit('heartbeat', 56.9, -10)                 # "The killer didn't leave." (silence)
hit('boom', 58.72, -3)                       # music crash on "For days"
hit('pop', 61.05, -15, dur=.4)
hit('knife', 62.55, -9, dur=1.3)
hit('whoosh2', 63.9, -14)
hit('snow_steps', 66.0, -17, dur=1.6)
hit('heartbeat', 68.0, -11); hit('heartbeat', 69.8, -12)
hit('door_forced', 71.55, -5, dur=1.6)
hit('stinger', 72.45, -6)                   # their faces
hit('whoosh', 73.95, -9); hit('paper', 74.1, -15, dur=1.0)
hit('boom2', 76.85, -4)                     # stamp
hit('crowbar', 77.95, -9, dur=2.4)
hit('crowbar', 80.25, -8, dur=1.2, start=4.5)
hit('riser', 80.6, -11, dur=1.4, fo=.05)
hit('stinger2', 81.95, -6)                   # "hidden in the attic."
hit('boom', 83.2, -4)                        # "The killer was never found."
fx = mix.copy()
# ---------- score: take 3, +0.3 s, level under the voice, ducked during speech, cut out on "Nobody was there."
vo = load('vo_comp.wav'); vo = np.pad(vo, ((0, max(0, N - len(vo))), (0, 0)))[:N]
mus = load('sfx/music3.wav'); mus = np.pad(mus, ((int(.3 * SR), 0), (0, 0)))[:N]; mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))
t = np.arange(N) / SR
env = np.sqrt(ma(vo.mean(1) ** 2, SR // 10)); env = env / env.max()
speech = np.clip(env / .08, 0, 1); k = int(.25 * SR); speech = ma(speech, k)
gain = db(-9.5) * (1 - speech * (1 - db(-4)))
def ramp(t0, t1, g0, g1): return np.interp(t, [t0, t1], [g0, g1])
auto = np.ones(N)
auto *= np.where(t < 38.3, 1, np.where(t < 39.95, db(-30), 1)) * 1.0
auto = np.minimum(auto, np.interp(t, [38.0, 38.35, 39.75, 40.4], [1, db(-30), db(-30), 1], left=1, right=1))
auto *= np.interp(t, [0, .25], [db(-6), 1])               # tiny swell under the hook boom
auto *= np.interp(t, [85.0, 87.4], [1, 0], left=1, right=0)
auto *= np.interp(t, [81.6, 81.9, 82.9, 83.3], [1, db(-9), db(-9), 1], left=1, right=1)   # "hidden in the attic" whisper
music = mus * (rms(vo[vo.mean(1) ** 2 > 1e-5]) / rms(mus[int(5 * SR):int(50 * SR)])) * (gain * auto)[:, None]
out = vo * 1.0 + music + fx * db(-1)
out = np.tanh(out * 1.1) / 1.1                               # soft safety clip
sf.write(os.path.join(D, 'mix.wav'), out.astype(np.float32), SR)
print('mix', out.shape, 'peak', np.abs(out).max(), 'vo rms', rms(vo), 'music rms', rms(music), 'fx rms', rms(fx))
