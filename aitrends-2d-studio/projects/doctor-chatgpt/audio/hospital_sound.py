"""Hospital sound bed + score for "Doctor, are you using ChatGPT?!"  (all synthesized locally, royalty-free)

  python3 projects/doctor-chatgpt/audio/hospital_sound.py

Writes:
  audio/hosp_bed.wav   one full-length stereo cue (placed at t=0 via shots.json "sfx"): monitor beeps on a tempo map,
                       alarms, flatline, code-blue chime, stretcher wheels, door bang, cabinet, phone pings, tablet plink,
                       screen tap, crash cart, nervous breaths, distant ward murmur.
  input/music.wav      the score from audio/music.py moods, with the hard stop before the apology and the pause for the
                       monitor joke (config.music.file points here).
"""
import json, os, sys
import numpy as np
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(P, "..", "..")
sys.path.insert(0, os.path.join(KIT, "audio"))
from dsp import SR, secs, t_axis, noise, lp, hp, bp, sine, expdec, stereo, reverb, write_wav, db, place
import sfx as SFX
import music as MUSIC

story = json.load(open(os.path.join(P, "story", "shots.json")))
TOTAL = story["duration"]; N = secs(TOTAL)
bed = np.zeros((N, 2), np.float32)
T = lambda sid: next(s["start"] for s in story["shots"] if s["id"] == sid)
MUSIC_STOP = 52.40           # end of "...a bad idea?" -> the room freezes
FLAT_ON = 46.35              # cut to the flatline wide (s23)


def put(x, at, gain_db=0.0, pan=0.0):
    x = x if x.ndim == 2 else stereo(x.astype(np.float32), pan)
    place(bed, x.astype(np.float32), secs(at), db(gain_db))


def beep(f=980, dur=0.09, soft=0.004):
    n = secs(dur); e = np.ones(n, np.float32); a = secs(soft); e[:a] = np.linspace(0, 1, a); e[-a * 3:] = np.linspace(1, 0, a * 3)
    return (np.sin(2 * np.pi * f * t_axis(n)) * 0.7 + np.sin(2 * np.pi * f * 2 * t_axis(n)) * 0.12).astype(np.float32) * e


# ---- monitor: heartbeat beeps on a tempo map (bpm rises with the crisis) ----
def bpm_at(t):
    pts = [(0, 104), (6.5, 116), (16, 128), (27.6, 146), (39, 158), (43.6, 48), (FLAT_ON, 0)]
    for (t0, b0), (t1, b1) in zip(pts, pts[1:]):
        if t0 <= t < t1: return b0 + (b1 - b0) * (t - t0) / (t1 - t0)
    return 0
t = 0.3
while t < FLAT_ON:
    b = bpm_at(t)
    if b <= 30: break
    corridor = t < 6.5
    put(beep(1040 if t > 27.6 else 980), t, -30 if corridor else -21, 0.25)
    t += 60.0 / b

# ---- high-priority alarm bursts (3 + 2 pulses) while the vitals crash ----
def alarm_burst(f=960):
    out = np.zeros(secs(1.1), np.float32)
    for i, at in enumerate([0, 0.18, 0.36, 0.72, 0.9]):
        x = beep(f if i < 3 else f * 1.19, 0.12); out[secs(at):secs(at) + len(x)] += x
    return out
for at in np.arange(27.62, 45.4, 2.0):
    put(alarm_burst(), at, -22 if 39.4 < at < 43.6 else -19, -0.3)

# ---- flatline: one sustained tone, nearly gone once the room "freezes" ----
n = secs(TOTAL - FLAT_ON); tone = (np.sin(2 * np.pi * 1000 * t_axis(n)) * 0.6).astype(np.float32)
env = np.ones(n, np.float32); env[:secs(0.02)] = np.linspace(0, 1, secs(0.02))
k0 = secs(MUSIC_STOP - FLAT_ON); env[k0:] = db(-24); env[k0 - secs(0.08):k0] = np.linspace(1, db(-24), secs(0.08))
put(tone * env, FLAT_ON, -17)

# ---- code-blue overhead chime ----
chime = np.zeros(secs(2.7), np.float32)
for i, (f, at) in enumerate([(784, 0), (622, 0.45), (784, 1.2), (622, 1.65)]):
    x = sine(f, secs(0.9)) * expdec(secs(0.9), 0.35) * 0.6; chime[secs(at):secs(at) + len(x)] += x
put(reverb(stereo(chime), size=2.2, wet=0.35), 44.80, -16)

# ---- stretcher wheels, door bang, running feet ----
w = noise(secs(3.6), 3); w = bp(w, 300, 2400) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 11 * t_axis(len(w)))))
w *= np.minimum(1, np.linspace(0, 6, len(w))) * np.minimum(1, np.linspace(6, 0, len(w)) * 3 / 6 + 0.2)
put(w, 0.05, -15)
put(SFX.make("impact", dur=1.2, seed=5), 0.04, -7); put(SFX.make("hit", dur=0.4, seed=6), 0.04, -9)
for k, at in enumerate(np.arange(0.2, 3.5, 0.2)): put(SFX.make("footstep", seed=40 + k), at, -16)
for k, at in enumerate(np.arange(3.6, 6.6, 0.19)): put(SFX.make("footstep", seed=60 + k), at, -12)
for k, at in enumerate(np.arange(46.45, 47.4, 0.18)): put(SFX.make("footstep", seed=80 + k), at, -14)
cartr = bp(noise(secs(1.2), 9), 500, 3000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 14 * t_axis(secs(1.2)))))
put(cartr * np.linspace(1, 0.2, len(cartr)), 46.55, -16)

# ---- cabinet latch + glass, tablet plink, screen tap ----
put(SFX.make("hit", dur=0.25, seed=12, pitch=2.2), 17.0, -12)
glass = sine(2600, secs(0.5)) * expdec(secs(0.5), 0.08) * 0.3 + sine(3900, secs(0.5)) * expdec(secs(0.5), 0.05) * 0.2
put(glass, 17.05, -14)
put(SFX.make("pop", seed=13, pitch=1.6), 17.93, -10); put(beep(2400, 0.05), 17.95, -20)
put(SFX.make("tick", seed=14, pitch=1.4), 39.13, -8)

# ---- phone: send swish + reply pings ----
def ping():
    a = sine(1318, secs(0.35)) * expdec(secs(0.35), 0.09) * 0.5; b = sine(1760, secs(0.45)) * expdec(secs(0.45), 0.12) * 0.5
    out = np.zeros(secs(0.6), np.float32); out[:len(a)] += a; out[secs(0.11):secs(0.11) + len(b)] += b; return out
for at in [10.85, 34.6, 52.3]: put(SFX.make("swish", seed=20), at, -18)
for at in [11.22, 34.88, 53.05, 61.95]: put(ping(), at, -13)

# ---- nervous breaths (doctor) in the gaps between his lines ----
def breath(dur=0.45, seed=1, inhale=True):
    x = bp(noise(secs(dur), seed), 500, 3200); e = np.sin(np.linspace(0, np.pi, len(x))) ** (1.5 if inhale else 0.8)
    return (x * e * 0.6).astype(np.float32)
for at, sd in [(7.7, 1), (30.35, 2), (34.6, 3), (38.15, 4), (47.4, 5), (65.0, 6)]:
    if at < TOTAL - 0.6: put(breath(0.42, sd), at, -21, -0.2)

# ---- distant ward life (murmur + far pages) under the bay ----
mur = SFX.make("murmur", dur=6.0, seed=25)
for at in np.arange(6.5, TOTAL - 0.35, 5.6): put(mur[: secs(min(6.0, TOTAL - 0.35 - at))], at, -30)
bed[secs(TOTAL - 0.35):] = 0      # true silence on black

write_wav(os.path.join(P, "audio", "hosp_bed.wav"), bed)
print("wrote audio/hosp_bed.wav")

# ---------------- score ----------------
plan = [
    {"start": 0.0, "end": 15.8, "mood": "tension", "intensity": 0.9},
    {"start": 15.8, "end": 27.6, "mood": "playful", "intensity": 0.55},
    {"start": 27.6, "end": 43.6, "mood": "tension", "intensity": 0.75},
    {"start": 43.6, "end": 53.0, "mood": "epic", "intensity": 0.95},
]
mus = MUSIC.render_score(plan, TOTAL, 7, None)[:N]
if mus.ndim == 1: mus = stereo(mus)
mus = np.concatenate([mus, np.zeros((max(0, N - len(mus)), 2), np.float32)])[:N]
g = np.ones(N, np.float32)
def ramp(a, b, va, vb): i, j = secs(a), secs(b); g[i:j] = np.linspace(va, vb, j - i)
ramp(39.30, 39.45, 1, 0.0); g[secs(39.45):secs(43.55)] = 0.0; ramp(43.55, 43.75, 0, 1)   # pause for the monitor joke
ramp(MUSIC_STOP - 0.06, MUSIC_STOP, 1, 0); g[secs(MUSIC_STOP):] = 0                         # ALL MUSIC STOPS
ramp(0, 0.03, 0, 1)
mus *= g[:, None]
write_wav(os.path.join(P, "input", "music.wav"), mus)
print("wrote input/music.wav")
