import os, sys
HERE = os.environ.get('HERE') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ['OUT']
sys.path.insert(0, os.environ.get('LIB', os.path.join(HERE, '../../..')))
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio.sfx import SR, limit
import pyloudnorm as pyln

vo, sr = sf.read(os.path.join(OUT, 'vo.wav'), dtype='float32'); assert sr == SR
mus, _ = sf.read(os.path.join(OUT, 'music.wav'), dtype='float32')
fx, _ = sf.read(os.path.join(OUT, 'sfx.wav'), dtype='float32')
import json
N = int(json.load(open(os.path.join(OUT, 'events.json')))['dur'] * SR)
def fit(x):
    if x.ndim == 1: x = np.stack([x, x], 1)
    out = np.zeros((N, 2), np.float32); m = min(N, len(x)); out[:m] = x[:m]; return out
vo, mus, fx = fit(vo), fit(mus), fit(fx)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
# voice to -18 LUFS, gentle presence + compression
vo *= 10 ** ((-18 - lufs(vo)) / 20)
sos = butter(2, 90, 'high', fs=SR, output='sos'); vo = sosfilt(sos, vo, axis=0).astype(np.float32)
# music bed: -27 LUFS before ducking
mus *= 10 ** ((-24 - lufs(mus)) / 20)
# ducking envelope from voice
env = np.abs(vo[:, 0]); win = int(.05 * SR)
env = np.convolve(env, np.ones(win) / win, 'same')
act = (env > 10 ** (-42 / 20)).astype(np.float32)
# attack 60 ms, release 450 ms smoothing
g = np.zeros_like(act); a_up, a_dn = np.exp(-1 / (.06 * SR)), np.exp(-1 / (.45 * SR)); s = 0.0
for i in range(len(act)):
    c = a_up if act[i] > s else a_dn; s = c * s + (1 - c) * act[i]; g[i] = s
duck = 10 ** (-6 * g / 20)
mus = mus * duck[:, None]
mix = vo + mus + fx * .9
mix = limit(mix, .95) if mix.ndim == 1 else np.stack([limit(mix[:, 0], .85), limit(mix[:, 1], .85)], 1)
sf.write(os.path.join(OUT, 'mix.wav'), mix.astype(np.float32), SR)
print('mix', lufs(mix), 'vo', lufs(vo))
