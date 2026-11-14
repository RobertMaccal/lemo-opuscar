"""Trim, level and measure every dialogue line; write vo_trim/*.wav and vo.json (durations + 30 fps mouth envelopes)."""
import os, json, numpy as np, soundfile as sf
H = os.path.dirname(os.path.abspath(__file__)); SR = 48000
os.makedirs(os.path.join(H, 'vo_trim'), exist_ok=True); out = {}
for f in sorted(os.listdir(os.path.join(H, 'vo'))):
    if not f.endswith('.wav'): continue
    x, sr = sf.read(os.path.join(H, 'vo', f)); assert sr == SR
    if x.ndim > 1: x = x.mean(1)
    w = int(.02 * SR); e = np.sqrt(np.convolve(x * x, np.ones(w) / w, 'same')); th = max(e.max() * .03, 1e-4)
    idx = np.where(e > th)[0]; a, b = max(0, idx[0] - int(.03 * SR)), min(len(x), idx[-1] + int(.12 * SR))
    y = x[a:b].copy(); fade = int(.01 * SR); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    rms = np.sqrt(np.mean(y[np.abs(y) > th] ** 2)); y *= min(10 ** (-20 / 20) / rms, .97 / np.abs(y).max())
    sf.write(os.path.join(H, 'vo_trim', f), y, SR)
    hop = SR // 30; n = len(y) // hop + 1; env = [float(np.sqrt(np.mean(y[i * hop:(i + 1) * hop + hop // 2] ** 2))) if i * hop < len(y) else 0 for i in range(n)]
    m = max(env) or 1; out[f[:-4]] = {'dur': round(len(y) / SR, 3), 'env': [round(min(1, v / m * 1.15), 2) for v in env]}
json.dump(out, open(os.path.join(H, 'vo.json'), 'w'))
print(' '.join(f"{k}:{v['dur']}" for k, v in out.items())); print('total', round(sum(v['dur'] for v in out.values()), 1))
