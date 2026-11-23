# Mix: voice (natural speed) + score (take 1, re-cut to the story) + ambience beds + spot effects -> mix.wav
import numpy as np, soundfile as sf, os, subprocess
from scipy.ndimage import uniform_filter1d
ma = lambda x, n: uniform_filter1d(x, size=max(1, int(n)), mode='nearest')
SR = 48000; DUR = 94.6; N = int(DUR * SR)
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
for f in os.listdir('sfx'):
    if f.endswith('.mp3') and not os.path.exists(f'sfx/{f[:-4]}.wav'):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'sfx/{f}', '-ac', '2', '-ar', str(SR), f'sfx/{f[:-4]}.wav'], check=True)
def load(name):
    a, sr = sf.read(name, dtype='float32')
    if a.ndim == 1: a = np.stack([a, a], 1)
    assert sr == SR, (name, sr); return a
def db(x): return 10 ** (x / 20)
def rms(a): return np.sqrt(np.mean(a ** 2) + 1e-12)
def onset(a, rel=-22):
    e = np.sqrt(ma((a ** 2).mean(1), 480)); return int(np.argmax(e > e.max() * db(rel)))
mix = np.zeros((N, 2), np.float32)
def put(buf, at, gain=0, pan=0, into=None):
    tgt = mix if into is None else into; i = int(at * SR)
    if i < 0: buf = buf[-i:]; i = 0
    n = min(len(buf), N - i)
    if n <= 0: return
    g = db(gain); l, r = (1 - max(0, pan)), (1 + min(0, pan))
    tgt[i:i + n, 0] += buf[:n, 0] * g * l; tgt[i:i + n, 1] += buf[:n, 1] * g * r
def fade(a, fi=.05, fo=.2):
    a = a.copy(); n1, n2 = min(len(a), int(fi * SR)), min(len(a), int(fo * SR))
    if n1: a[:n1] *= np.linspace(0, 1, n1)[:, None]
    if n2: a[-n2:] *= np.linspace(1, 0, n2)[:, None]
    return a
NAMES = ['splash', 'bubbles', 'drip', 'roomtone', 'pen', 'stamp', 'spot', 'flashcam', 'carry', 'court', 'bell', 'sea', 'cough', 'candle', 'pencil', 'coins',
         'boom', 'boom2', 'whoosh', 'whoosh2', 'riser', 'stinger', 'stinger2', 'heartbeat', 'paper', 'pop', 'clock', 'fire']
SFX = {k: load(f'sfx/{k}.wav') for k in NAMES}
for k, a in SFX.items():   # same loudness at each effect's loudest half-second, so the gains below are relative
    e = np.sqrt(ma((a ** 2).mean(1), SR // 2)); SFX[k] = a / (e.max() + 1e-9) * db(-20)
def hit(k, t, gain=0, pan=0, dur=None, fo=.15, start=None):
    a = SFX[k]; o = onset(a) if start is None else int(start * SR)
    seg_ = a[o:o + int(dur * SR)] if dur else a[o:]
    put(fade(seg_, .005, fo), t, gain, pan)
def bed(k, t0, t1, gain=0, fi=.4, fo=.6, off=0):
    a = SFX[k]; n = int((t1 - t0) * SR); reps = int(np.ceil((n + int(off * SR)) / len(a))) + 1
    b = np.concatenate([a] * reps)[int(off * SR):int(off * SR) + n]; put(fade(b, fi, fo), t0, gain)

# ---------- ambience beds
bed('roomtone', 0, 12.05, -10); bed('roomtone', 58.35, 71.2, -9, off=5); bed('roomtone', 72.65, 80.05, -12, off=12)
bed('roomtone', 54.2, 58.4, -16, off=20)                                   # the empty tub on the stage
bed('fire', 12.3, 21.4, -17); bed('clock', 12.3, 21.4, -22); bed('fire', 87.6, 90.5, -16, off=4); bed('clock', 87.6, 90.5, -19, off=2)
bed('clock', 29.95, 34.7, -20, off=1); bed('clock', 44.05, 50.45, -21, off=3)
bed('sea', 34.7, 36.75, -10, fi=.3, fo=.3)
bed('court', 80.05, 82.4, -14, fi=.3, fo=.5)
bed('clock', 72.65, 73.95, -9, fi=.05, fo=.1)                              # the clock racing
# ---------- spot effects (picture + word cues)
hit('boom', 0.02, -2)                          # cold open impact
hit('whoosh', 1.45, -12)
hit('whoosh2', 2.9, -15)
hit('heartbeat', 3.1, -13)
hit('splash', 4.95, -3)                        # pulled under
hit('bubbles', 5.25, -8, dur=4.2, fo=1.6)
hit('boom2', 6.22, -9)                         # "On purpose."
hit('heartbeat', 7.6, -12); hit('heartbeat', 8.9, -14)
hit('flashcam', 9.78, -7); hit('spot', 9.8, -10)
hit('stinger', 11.42, -5)                      # "killer."
hit('paper', 12.3, -9, dur=1.2)
hit('heartbeat', 18.0, -11)                    # the father realises
hit('whoosh2', 19.5, -17)
hit('spot', 21.42, -11); hit('drip', 22.9, -10)
hit('whoosh', 23.7, -16); hit('whoosh2', 25.65, -16)
hit('pop', 28.38, -12, dur=.4); hit('pop', 28.68, -11, dur=.4); hit('pencil', 29.0, -16, dur=.6)
hit('stinger2', 29.3, -12)                     # "same story."
hit('paper', 30.3, -16, dur=1.4)
hit('whoosh', 33.0, -10); hit('pop', 33.6, -8, dur=.4)   # the third pin
hit('pen', 36.65, -13, dur=1.5, fo=.3); hit('stamp', 38.15, -4)
hit('spot', 39.3, -9); hit('spot', 40.08, -9); hit('spot', 40.43, -9)
hit('whoosh2', 41.8, -15); hit('pop', 42.4, -11, dur=.4); hit('pop', 42.9, -11, dur=.4); hit('pop', 43.35, -10, dur=.4)
hit('paper', 44.15, -14, dur=.5); hit('paper', 44.5, -14, dur=.5); hit('paper', 44.85, -14, dur=.5); hit('coins', 45.2, -10)
hit('whoosh', 46.5, -10); hit('heartbeat', 46.75, -11)
hit('pen', 47.85, -12, dur=.8, fo=.2); hit('pen', 49.05, -12, dur=1.1, fo=.2)
hit('spot', 50.42, -10); hit('pop', 51.05, -12, dur=.4)
hit('pencil', 52.35, -15, dur=.9); hit('pop', 53.15, -12, dur=.4)
hit('drip', 56.9, -6)                          # the drop in the silent tub
hit('carry', 58.35, -9, dur=2.1, fo=.4)
hit('splash', 62.05, -20, dur=1.2, fo=.5)      # she sits in the water
hit('heartbeat', 63.45, -12); hit('heartbeat', 64.55, -11); hit('heartbeat', 65.4, -10)
hit('riser', 64.7, -11, dur=1.45, fo=.05)
hit('splash', 66.16, -1); hit('boom', 66.18, -5)          # "pulled."
hit('bubbles', 66.6, -6, dur=4.4, fo=1.8)
hit('whoosh', 68.8, -10); hit('pencil', 69.1, -15, dur=1.9, fo=.3)
hit('drip', 72.15, -12)                        # the only sound in the silence
hit('whoosh2', 72.6, -12)
hit('cough', 74.0, -9, dur=1.4, fo=.4)
hit('pencil', 75.4, -16, dur=1.4, fo=.3)
hit('pop', 76.9, -12, dur=.4); hit('pop', 77.7, -12, dur=.4); hit('boom2', 78.45, -7)    # "one sudden pull"
hit('stinger', 81.4, -12)                      # "20 minutes."
hit('bell', 83.45, -4, dur=4.5, fo=1.5)        # "hanged"
hit('candle', 85.5, -9); hit('candle', 86.05, -9); hit('candle', 86.6, -8)
hit('boom2', 90.42, -6)                        # last question
fx = mix.copy(); mix[:] = 0

# ---------- score: take 1, re-cut. film 0–71.3 <- score 12.3–83.6 (the build, cut on "limp"),
# film 72.7–90.3 <- score 1.0–18.6 (quiet section), film 90.35–94.6 <- score 87.95… (the final chord)
mus = load('sfx/music1.wav'); M = np.zeros((N, 2), np.float32)
def place(src0, src1, dst, fi=.05, fo=.05, g=0):
    seg_ = fade(mus[int(src0 * SR):int(src1 * SR)], fi, fo); put(seg_, dst, g, into=M)
place(12.3, 83.55, 0.0, fi=.02, fo=.12)
place(1.0, 18.65, 72.65, fi=1.2, fo=.5, g=-2)
place(87.95, 94.0, 90.35, fi=.01, fo=1.5, g=0)
vo = load('vo_comp.wav'); vo = np.pad(vo, ((0, max(0, N - len(vo))), (0, 0)))[:N]
t = np.arange(N) / SR
env = np.sqrt(ma(vo.mean(1) ** 2, SR // 10)); env = env / env.max()
speech = ma(np.clip(env / .08, 0, 1), int(.25 * SR))
gain = db(-9.0) * (1 - speech * (1 - db(-4.5)))
auto = np.ones(N)
auto *= np.interp(t, [54.0, 54.6, 57.8, 58.4], [1, db(-7), db(-7), 1], left=1, right=1)   # let the question hang
auto *= np.interp(t, [0, .2], [db(-4), 1])
auto *= np.interp(t, [92.8, 94.5], [1, 0], left=1, right=0)
music = M * (rms(vo[vo.mean(1) ** 2 > 1e-5]) / rms(mus[int(20 * SR):int(70 * SR)])) * (gain * auto)[:, None]
out = vo * 1.0 + music + fx * db(-1)
out = np.tanh(out * 1.1) / 1.1
sf.write('mix.wav', out.astype(np.float32), SR)
print('mix', out.shape, 'peak', np.abs(out).max(), 'vo', rms(vo), 'music', rms(music), 'fx', rms(fx))
