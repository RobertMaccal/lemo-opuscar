# Mix: voice (natural speed) + heartfelt score (take 3) + comic sting (take 3) + ambience + spot effects -> mix.wav
import numpy as np, soundfile as sf, os, subprocess
from scipy.ndimage import uniform_filter1d
ma = lambda x, n: uniform_filter1d(x, size=max(1, int(n)), mode='nearest')
SR = 48000; DUR = 68.0; N = int(DUR * SR)
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
NAMES = ['birds', 'squeak', 'splashbig', 'flail', 'coughm', 'fly', 'gulp', 'door', 'whoosh', 'whoosh2', 'clock', 'paper', 'pop', 'stamp', 'drip', 'splash', 'bubbles']
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
bed('birds', 0, 27.05, -11, fi=.6); bed('birds', 58.45, 63.6, -15, off=9, fi=.2, fo=.3)
bed('clock', 27.05, 58.45, -25, fi=.4); bed('clock', 63.6, 68.0, -22, off=4, fi=.1)
bed('flail', 10.6, 17.3, -9, fi=.2, fo=.5); bed('flail', 17.6, 19.95, -14, off=3, fi=.2, fo=.4)
bed('fly', 58.45, 63.6, -12, fi=.3, fo=.4)
# ---------- spot effects
hit('squeak', 8.72, -6)                         # he slips
hit('whoosh2', 9.7, -15)
hit('splashbig', 10.18, -2)                     # into the deep end
hit('bubbles', 11.9, -14, dur=3.0, fo=1.0)
hit('pop', 13.95, -14, dur=.4)                  # the nurse drops her clipboard
hit('whoosh', 15.05, -14)
hit('splash', 17.08, -3)                        # Walter jumps in
hit('coughm', 20.25, -8, dur=1.6, fo=.5)
hit('whoosh2', 21.75, -18)
hit('door', 27.12, -8, dur=1.8, fo=.4)
hit('paper', 39.65, -16, dur=.8)
hit('stamp', 41.25, -3)                         # DISCHARGED
hit('gulp', 57.92, -4)                          # the doctor's face
hit('drip', 59.4, -9); hit('drip', 60.7, -10); hit('drip', 62.0, -9)
hit('stamp', 64.33, -2)                         # CANCELLED
fx = mix.copy(); mix[:] = 0

# ---------- score: heartfelt take 3 from the top (its peak lands on "I think you're healed"), gone before "By the way";
# the comic sting starts on the reveal
mus = load('sfx/score3.wav'); comic = load('sfx/comic3.wav'); M = np.zeros((N, 2), np.float32)
def place(src, s0, s1, dst, fi=.05, fo=.05, g=0):
    seg_ = fade(src[int(s0 * SR):int(s1 * SR)], fi, fo); put(seg_, dst, g, into=M)
place(mus, 0.0, 50.4, 0.0, fi=.05, fo=1.4)
place(comic, 0.0, 9.6, 58.45, fi=.005, fo=.4, g=7)
vo = load('vo_comp.wav'); vo = np.pad(vo, ((0, max(0, N - len(vo))), (0, 0)))[:N]
t = np.arange(N) / SR
env = np.sqrt(ma(vo.mean(1) ** 2, SR // 10)); env = env / env.max()
speech = ma(np.clip(env / .08, 0, 1), int(.25 * SR))
gain = db(-8.0) * (1 - speech * (1 - db(-4.5)))
auto = np.ones(N)
auto *= np.interp(t, [0, 1.0], [db(-3), 1])
music = M * (rms(vo[vo.mean(1) ** 2 > 1e-5]) / rms(mus[int(10 * SR):int(48 * SR)])) * (gain * auto)[:, None]
out = vo * 1.0 + music + fx * db(-1)
out = np.tanh(out * 1.1) / 1.1
sf.write('mix.wav', out.astype(np.float32), SR)
print('mix', out.shape, 'peak', np.abs(out).max(), 'vo', rms(vo), 'music', rms(music), 'fx', rms(fx))
