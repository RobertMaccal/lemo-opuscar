"""mix_film.py — the soundtrack of ONE MORE SCROLL: dialogue, phone-video voices, the eight ElevenLabs music cues,
procedural foley and ambience beds, ducking, master (two-pass loudnorm to -14 LUFS), mux.

  python mix_film.py [--video build/video_silent.mp4] [--out one-more-scroll.mp4]
Uses the aiTrends studio's procedural SFX library ($STUDIO/audio/sfx.py) plus the extra foley defined below.
"""
import argparse, json, os, re, subprocess, sys
import numpy as np, soundfile as sf
from scipy import signal

H = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.environ.get('STUDIO') or os.path.abspath(os.path.join(H, '..', 'aitrends-2d-studio'))
sys.path.insert(0, os.path.join(STUDIO, 'audio'))
from dsp import SR, secs, t_axis, noise, lp, hp, bp, sweep_filter, expdec, sine, stereo, as_stereo, reverb, fade, normalize, db, rms_db, place
import sfx as LIB

story = json.load(open(os.path.join(H, 'story', 'shots.json')))
TL = json.load(open(os.path.join(H, 'timeline', 'lines.json')))
TOTAL = story['duration']; N = secs(TOTAL)

# ---------------- extra foley (procedural) ----------------
def _ping(n, f, tau, seed=0): return sine(f, n) * expdec(n, tau)
def ex_click(dur=0.08, seed=1, pitch=1.0, **_): n = secs(dur); x = bp(noise(n, seed), 1800 * pitch, 6000) * expdec(n, 0.006) + _ping(n, 2400 * pitch, 0.01) * 0.3; return normalize(stereo(x), -3)
def ex_alarm(dur=2.0, seed=2, **_):
    n = secs(dur); t = t_axis(n); gate = ((t * 8) % 1 < 0.55).astype(np.float32) * ((t * 2) % 1 < 0.75)
    x = (np.sign(np.sin(2 * np.pi * 2200 * t)) * 0.4 + np.sin(2 * np.pi * 4400 * t) * 0.2) * gate
    return normalize(stereo(lp(x.astype(np.float32), 7000)), -2)
def ex_glass(dur=1.2, seed=3, **_):
    n = secs(dur); x = hp(noise(n, seed), 3000) * expdec(n, 0.08) * 0.6
    for k in range(9): x += _ping(n, 2500 + seed * 37 + k * 611, 0.25 + 0.05 * k, k) * 0.12 * np.roll(np.ones(n), secs(0.01 * k))
    return normalize(reverb(stereo(x, 0, 0.5), 1.2, 0.25), -3)
def ex_crash(dur=1.4, seed=4, **_):
    n = secs(dur); x = LIB.make('hit', dur=0.6, seed=seed).mean(1); y = np.zeros(n, np.float32)
    for k in range(7): o = secs(0.05 * k + 0.02 * (k % 3)); y[o:o + len(x)] += x[: n - o] * (0.8 - k * 0.08)
    y += lp(noise(n, seed), 2500) * expdec(n, 0.3) * 0.4
    return normalize(reverb(stereo(y, 0, 0.5), 1.0, 0.2), -2)
def ex_splash(dur=1.2, seed=5, pitch=1.0, **_):
    n = secs(dur); x = sweep_filter(noise(n, seed), 2500 * pitch, 400 * pitch, q=0.8) * expdec(n, 0.35) + lp(noise(n, seed + 1), 600) * expdec(n, 0.15) * 0.8
    for k in range(24): o = secs(0.05 + 0.03 * k + 0.02 * np.sin(k)); m = min(secs(0.04), n - o); x[o:o + m] += _ping(m, 900 + 120 * k * pitch, 0.012) * 0.25
    return normalize(stereo(x, 0, 0.6), -2)
def ex_water(dur=3.0, seed=6, **_): n = secs(dur); x = bp(noise(n, seed), 600, 5000) * (0.7 + 0.3 * np.sin(t_axis(n) * 23)); return normalize(fade(stereo(x, 0, 0.4), 0.15, 0.3), -6)
def ex_clockspin(dur=1.4, seed=7, **_):
    n = secs(dur); y = np.zeros(n, np.float32); t = 0.0; k = 0
    while t < dur - 0.03:
        tk = LIB.make('tick', pitch=1.3 + 0.2 * (k % 2)).mean(1); o = secs(t); m = min(len(tk), n - o); y[o:o + m] += tk[:m] * 0.6; t += max(0.03, 0.16 * (1 - t / dur) ** 1.5 + 0.03); k += 1
    y += sweep_filter(noise(n, seed), 300, 2400, q=2) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.25
    return normalize(stereo(y), -3)
def ex_chuckle(dur=0.9, seed=8, **_):
    n = secs(dur); y = np.zeros(n, np.float32)
    for k in range(4): o = secs(0.18 * k); m = secs(0.12); y[o:o + m] += bp(noise(m, seed + k), 300, 1800) * np.sin(np.pi * np.linspace(0, 1, m)) * (1 - k * 0.2)
    return normalize(stereo(y), -8)
def ex_groan(dur=1.0, seed=9, **_): n = secs(dur); t = t_axis(n); x = bp(noise(n, seed), 120, 700) * np.sin(np.pi * t / dur) + sine(110 - 20 * t, n) * 0.25 * np.sin(np.pi * t / dur); return normalize(stereo(x.astype(np.float32)), -6)
def ex_sigh(dur=1.2, seed=10, **_): n = secs(dur); x = sweep_filter(noise(n, seed), 1600, 500, q=0.7) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5; return normalize(stereo(x), -8)
def ex_slap(dur=0.3, seed=11, **_): n = secs(dur); x = bp(noise(n, seed), 500, 5000) * expdec(n, 0.02) + _ping(n, 160, 0.06) * 0.6; return normalize(reverb(stereo(x), 0.4, 0.1), -2)
def ex_cloth(dur=0.8, seed=12, **_): n = secs(dur); x = bp(noise(n, seed, 'pink'), 800, 6000) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * (0.6 + 0.4 * np.sin(t_axis(n) * 40)); return normalize(stereo(x, 0, 0.3), -8)
def ex_flicker(dur=1.4, seed=13, **_):
    n = secs(dur); t = t_axis(n); x = np.zeros(n, np.float32)
    for k in range(6): o = secs(0.08 + 0.17 * k + 0.03 * (k % 2)); m = min(secs(0.05), n - o); x[o:o + m] += bp(noise(m, seed + k), 1000, 7000) * 0.8 + sine(120, m) * 0.4
    x += sine(120, n) * 0.08 * (t > 1.0); return normalize(stereo(x), -4)
def ex_doorslam(dur=1.0, seed=14, **_): x = LIB.make('hit', dur=1.0, seed=seed, pitch=0.7).mean(1); x += lp(noise(len(x), seed), 400) * expdec(len(x), 0.2) * 0.5; return normalize(reverb(stereo(x), 1.0, 0.25), -1)
def ex_bus(dur=2.6, seed=15, **_): n = secs(dur); t = t_axis(n); x = lp(noise(n, seed, 'brown'), 300) * 1.5 + sine(48 + 10 * (1 - t / dur), n) * 0.4 + sweep_filter(noise(n, seed + 1), 3000, 1500, q=6) * expdec(n, 1.2) * 0.25; return normalize(fade(stereo(x, 0, 0.3), 0.6, 0.4), -3)
def ex_hiss(dur=1.0, seed=16, **_): n = secs(dur); x = hp(noise(n, seed), 2500) * np.minimum(1, t_axis(n) * 30) * expdec(n, 0.4); return normalize(stereo(x, 0, 0.5), -4)
def ex_busrumble(dur=6.0, seed=17, **_): n = secs(dur); t = t_axis(n); x = lp(noise(n, seed, 'brown'), 220) * (1 + 0.2 * np.sin(t * 3.1)) + sine(52, n) * 0.25; return normalize(fade(stereo(x, 0, 0.4), 0.5, 0.5), -6)
def ex_thunk(dur=0.6, seed=18, pitch=1.0, **_): n = secs(dur); x = _ping(n, 220 * pitch, 0.05) + bp(noise(n, seed), 400, 2500) * expdec(n, 0.015) * 0.8 + _ping(n, 1300 * pitch, 0.08) * 0.15; return normalize(reverb(stereo(x), 0.5, 0.12), -1)
def ex_chair(dur=0.8, seed=19, **_): n = secs(dur); x = sweep_filter(noise(n, seed), 900, 2200, q=8) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * 0.8 + _ping(n, 180, 0.05) * 0.3; return normalize(stereo(x), -6)
def ex_boot(dur=1.6, seed=20, **_): n = secs(dur); x = sum(_ping(n, f, 0.9) * a for f, a in [(523, .4), (659, .3), (784, .3), (1046, .2)]); x *= np.minimum(1, t_axis(n) * 8); return normalize(reverb(stereo(x), 1.2, 0.2), -6)
def ex_key(dur=0.12, seed=21, **_): n = secs(dur); x = bp(noise(n, seed), 1500, 7000) * expdec(n, 0.008) + _ping(n, 600, 0.01) * 0.4; return normalize(stereo(x), -4)
def ex_typing(dur=3.0, seed=22, **_):
    n = secs(dur); y = np.zeros(n, np.float32); r = np.random.default_rng(seed); t = 0.0
    while t < dur - 0.1: k = ex_key(seed=int(r.integers(1000))).mean(1); o = secs(t); m = min(len(k), n - o); y[o:o + m] += k[:m] * (0.4 + 0.4 * r.random()); t += 0.05 + 0.08 * r.random()
    return normalize(stereo(y, 0, 0.4), -6)
def ex_tap(dur=0.4, seed=23, **_):
    n = secs(dur); x = np.zeros(n, np.float32); m = secs(0.06)
    for o in (0.0, 0.16): i = secs(o); x[i:i + m] += bp(noise(m, seed), 300, 2000) * expdec(m, 0.01)
    return normalize(stereo(x), -6)
def ex_door(dur=1.2, seed=24, **_):
    n = secs(dur); x = sweep_filter(noise(n, seed), 500, 900, q=10) * np.sin(np.pi * np.linspace(0, 1, n) ** 0.6) ** 2 * 0.6
    c = ex_click(seed=seed).mean(1); i = secs(dur * 0.8); x[i:i + len(c)] += c[: n - i] * 0.8
    return normalize(reverb(stereo(x.astype(np.float32)), 0.8, 0.2), -4)
def ex_slam(dur=1.6, seed=25, **_): x = LIB.make('hit', dur=1.6, seed=seed, pitch=0.6).mean(1) * 1.2 + lp(noise(secs(dur), seed), 300) * expdec(secs(dur), 0.12); return normalize(reverb(stereo(x), 1.0, 0.25), -1)
def ex_microwave(dur=2.2, seed=26, **_): n = secs(dur); x = sine(120, n) * 0.3 + sine(240, n) * 0.15 + lp(noise(n, seed), 800) * 0.4; return normalize(fade(stereo(x), 0.1, 0.05), -8)
def ex_beep(dur=1.0, seed=27, **_):
    n = secs(dur); x = np.zeros(n, np.float32)
    for o in (0.0, 0.3, 0.6): m = secs(0.18); x[secs(o):secs(o) + m] += sine(2000, m) * 0.5 * np.sin(np.pi * np.linspace(0, 1, m)) ** 0.3
    return normalize(stereo(x), -4)
def ex_fork(dur=0.3, seed=28, **_): n = secs(dur); x = _ping(n, 3200, 0.05) * 0.5 + _ping(n, 4700, 0.03) * 0.3 + hp(noise(n, seed), 3000) * expdec(n, 0.005); return normalize(stereo(x), -8)
def ex_keys(dur=0.8, seed=29, **_):
    n = secs(dur); x = np.zeros(n, np.float32)
    for k in range(10): o = secs(0.02 + 0.05 * k + 0.01 * (k % 3)); m = min(secs(0.1), n - o); x[o:o + m] += _ping(m, 3500 + 400 * (k % 4), 0.04) * 0.3
    return normalize(stereo(x, 0, 0.4), -4)
def ex_thud(dur=0.6, seed=30, pitch=1.0, **_): n = secs(dur); x = LIB._thump(n, 120 * pitch, 50 * pitch, 0.12, 0.3, seed); return normalize(stereo(x), -2)
def ex_bedflop(dur=1.2, seed=31, **_): n = secs(dur); x = LIB._thump(n, 90, 40, 0.25, 0.1, seed) + lp(noise(n, seed, 'pink'), 1500) * expdec(n, 0.25) * 0.6; x += np.roll(LIB._thump(n, 140, 60, 0.08, 0.1, seed) * 0.4, secs(0.28)); return normalize(stereo(x), -1)
def ex_phonevid(dur=3.0, seed=32, **_): n = secs(dur); t = t_axis(n); x = (np.sin(2 * np.pi * 330 * t) * ((t * 4) % 1 < 0.3) + np.sin(2 * np.pi * 440 * t) * (((t * 4) + 0.5) % 1 < 0.2)) * 0.4 + bp(noise(n, seed), 800, 2500) * 0.15; return normalize(stereo(bp(x.astype(np.float32), 500, 3000)), -10)
def ex_knock(dur=0.5, seed=33, **_): n = secs(dur); x = LIB._thump(n, 170, 85, 0.07, 0.9, seed) + bp(noise(n, seed), 300, 1800) * expdec(n, 0.02) * 0.8; return normalize(reverb(stereo(x), 1.2, 0.3), -1)
def ex_creak(dur=1.6, seed=34, **_): n = secs(dur); t = t_axis(n); f = 300 + 180 * np.sin(np.pi * t / dur) + 40 * np.sin(t * 9); ph = np.cumsum(f) / SR; x = (np.sign(np.sin(2 * np.pi * ph)) * 0.3 * (np.sin(2 * np.pi * ph * 0.25) > 0)) * np.sin(np.pi * t / dur) ** 0.5; return normalize(reverb(stereo(bp(x.astype(np.float32), 300, 3000)), 1.0, 0.3), -6)
EXTRA = {k[3:]: v for k, v in globals().items() if k.startswith('ex_')}
def make(name, **kw):
    kw = {k: v for k, v in kw.items() if v is not None}
    if name in EXTRA: return as_stereo(EXTRA[name](**kw)).astype(np.float32)
    return LIB.make(name, **kw)

def load(path):
    x, sr = sf.read(path, dtype='float32', always_2d=True)
    if sr != SR: x = signal.resample_poly(x, SR, sr, axis=0).astype(np.float32)
    return x if x.shape[1] == 2 else np.repeat(x, 2, axis=1)
def comp(x, thr=-18, ratio=3.0, att=0.005, rel=0.12):
    m = np.abs(x).max(1); hop = secs(0.005); lv = 20 * np.log10(np.maximum(1e-6, np.sqrt(np.add.reduceat(m ** 2, np.arange(0, len(m), hop)) / hop)))
    gr = np.minimum(0, (thr - lv) * (1 - 1 / ratio)); g = np.zeros_like(gr); v = 0.0; a, r = np.exp(-0.005 / att), np.exp(-0.005 / rel)
    for i, s in enumerate(gr): v = a * v + (1 - a) * s if s < v else r * v + (1 - r) * s; g[i] = v
    return x * db(np.repeat(g, hop)[:len(x)])[:, None]
def envelope(x, att=0.03, rel=0.5):
    mono = np.abs(x).mean(1); hop = secs(0.01); fr = np.sqrt(np.add.reduceat(mono ** 2, np.arange(0, len(mono), hop)) / hop)
    lv = np.clip((20 * np.log10(fr + 1e-9) + 50) / 30, 0, 1); out = np.zeros_like(lv); a, r = np.exp(-0.01 / att), np.exp(-0.01 / rel); v = 0.0
    for i, s in enumerate(lv): v = a * v + (1 - a) * s if s > v else r * v + (1 - r) * s; out[i] = v
    return np.repeat(out, hop)[:len(mono)]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--video', default=os.path.join(H, 'build', 'video_silent.mp4')); ap.add_argument('--out', default=os.path.join(H, 'one-more-scroll.mp4')); a = ap.parse_args()
    # ---- dialogue: high-pass, compress, small room
    vo = np.zeros((N, 2), np.float32); phone = np.zeros((N, 2), np.float32)
    for l in TL['lines']:
        x = load(os.path.join(H, 'audio', 'vo_trim', l['id'] + '.wav'))
        if l['who'] == 'PHONE':   # tinny phone speaker
            y = bp(x, 380, 3800, 3); y = np.tanh(y * 2.2) / np.tanh(2.2); place(phone, y, secs(l['t0']), db(-7))
        else:
            y = comp(hp(x, 90), -20, 3.0)
            wet = {'BOSS': 0.12, 'PRIYA': 0.1, 'MARK': 0.12, 'STRANGER': 0.16}.get(l['who'], 0.08)
            y = reverb(y, 0.9 if l['who'] != 'STRANGER' else 1.6, wet, 5)
            place(vo, y, secs(l['t0']), db(-1 if l['who'] == 'STRANGER' else 0))
    voice_ref = rms_db(vo[np.abs(vo).mean(1) > db(-40)])
    env = envelope(vo + phone * 0.5)
    # ---- music cues
    mus = np.zeros((N, 2), np.float32)
    for m in story['music']:
        x = load(os.path.join(H, m['file'])); s0, s1 = secs(m['start']), secs(m['end']); off = secs(m.get('offset', 0))
        seg_len = s1 - s0 + secs(m['fadeOut']); y = x[off: off + seg_len].copy()
        if len(y) < seg_len: y = np.concatenate([y, np.zeros((seg_len - len(y), 2), np.float32)])
        fi, fo = secs(m['fadeIn']), secs(m['fadeOut']); y[:fi] *= np.linspace(0, 1, fi)[:, None]
        if fo > 0: tail = len(y) - fo; y[tail:] *= np.linspace(1, 0, fo)[:, None]
        y *= db(voice_ref - 10 + m.get('gain', 0) - rms_db(y[fi:len(y) - fo] if len(y) - fo > fi else y))
        place(mus, y, s0, 1.0)
    mus *= db(-9 * env)[:, None]
    # ---- foley + ambience
    hits = np.zeros((N, 2), np.float32); bed = np.zeros((N, 2), np.float32); cache = {}
    for s in story['shots']:
        for c in s.get('sfx') or []:
            snd = make(c['name'], dur=c.get('dur'), seed=c.get('seed'), pitch=c.get('pitch'))
            place(hits, snd, secs(s['start'] + c['at']), db(c.get('gain', -8)))
        if s.get('amb'):
            am = s['amb']; ln = s['end'] - s['start']; key = am['name']
            if key not in cache: cache[key] = make(key, dur=6.0, seed=3)
            base = cache[key]; loop = np.concatenate([base] * int(np.ceil(ln / (len(base) / SR) + 1)))[:secs(ln)]
            f = min(secs(0.3), len(loop) // 2); loop[:f] *= np.linspace(0, 1, f)[:, None]; loop[-f:] *= np.linspace(1, 0, f)[:, None]
            place(bed, loop, secs(s['start']), db(am.get('gain', -22)))
    bed *= db(-5 * env)[:, None]
    fol = (hits + bed) * db(voice_ref + 12)
    mix = vo + phone + mus + fol
    mix = mix - lp(mix, 28)
    pk = np.abs(mix).max(); mix = np.tanh(mix / pk * 1.4) / np.tanh(1.4) * 0.95 if pk > 0.95 else mix
    os.makedirs(os.path.join(H, 'build'), exist_ok=True); raw = os.path.join(H, 'build', 'mix_raw.wav'); sf.write(raw, mix, SR, subtype='FLOAT')
    stems = os.path.join(H, 'build', 'stems'); os.makedirs(stems, exist_ok=True)
    for nm, x in (('dialogue', vo + phone), ('music', mus), ('foley', fol)): sf.write(os.path.join(stems, nm + '.wav'), x, SR, subtype='PCM_24')
    # two-pass loudnorm to -14 LUFS, true peak -1.2 dB
    p1 = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    js = json.loads(p1[p1.rindex('{'):p1.rindex('}') + 1])
    af = f"loudnorm=I=-14:TP=-1.2:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
    out_wav = os.path.join(H, 'build', 'mix.wav'); subprocess.run(['ffmpeg', '-y', '-v', 'error', '-nostdin', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s24le', out_wav], check=True)
    print('mix:', out_wav, 'measured in', js['input_i'], 'LUFS')
    if os.path.exists(a.video):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-nostdin', '-i', a.video, '-i', out_wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', a.out], check=True)
        print('FINAL:', a.out)

if __name__ == '__main__':
    main()
