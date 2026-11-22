"""Foley track from the page's cue list (events.json) -> sfx.wav (stereo, 48k)."""
import json
import os, sys
HERE = os.environ.get('HERE') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ['OUT']
sys.path.insert(0, os.environ.get('LIB', os.path.join(HERE, '../../..')))
import numpy as np, soundfile as sf
from core.audio import sfx as F
from core.audio.sfx import SR, add, t_, env_exp, noise, bp, lp, hp, norm

rng = np.random.default_rng(3)
ev = json.load(open(os.path.join(OUT, 'events.json')))
dur = ev['dur']; cues = ev['ev']
buf = np.zeros((int((dur + 2) * SR), 2), np.float32)

def sine(f, d, tau=None, a=1.0):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt)
    if tau: x *= env_exp(d, tau)
    return x * a

def stamp():
    d = .35; x = F.thump(1, 60) [:int(d*SR)] if len(F.thump(1,60)) >= int(d*SR) else np.pad(F.thump(1,60),(0,int(d*SR)-len(F.thump(1,60))))
    paper = hp(noise(d), 1500) * env_exp(d, .02) * .5
    wood = sum(a * sine(f, d, tau) for f, a, tau in [(220, .7, .05), (510, .4, .03), (1300, .2, .015)])
    return norm(x * .9 + paper + wood)

def clank():
    d = 1.2; tt = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(310, .6, .4), (757, .5, .25), (1213, .4, .18), (1890, .3, .12), (2650, .2, .08)])
    x += hp(noise(d), 2000) * env_exp(d, .01) * .6
    return norm(x)

def sparkle():
    d = .9; out = np.zeros(int(d * SR))
    for k, f in enumerate([1568, 2093, 2637, 3136]):
        s = int(k * .06 * SR); y = sine(f, d - k * .06, .18) * .5
        out[s:s + len(y)] += y[:len(out) - s]
    return norm(out) * .8

def pencil(d=.7):
    n = noise(d); x = bp(n, 2500, 7000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t_(d))))
    return norm(x * np.sin(np.pi * t_(d) / d)) * .6

def beep(f=1000, d=.12):
    x = sine(f, d) * np.minimum(1, np.minimum(t_(d) / .005, (d - t_(d)) / .01)); return x * .5

def flatline():
    d = 2.6; x = sine(1000, d) * np.minimum(1, np.minimum(t_(d) / .01, (d - t_(d)) / .6)); return x * .45

def page_turn():
    d = .45; x = bp(noise(d), 800, 5000) * np.sin(np.pi * t_(d) / d) ** 2; return norm(x) * .7

def gavel():
    d = .5; out = np.zeros(int(d * SR))
    for s0, g in [(0, 1), (.18, .6)]:
        y = sum(a * sine(f, .3, tau) for f, a, tau in [(180, .9, .06), (420, .6, .03), (950, .3, .015)]) + hp(noise(.3), 1000) * env_exp(.3, .006) * .7
        s = int(s0 * SR); out[s:s + len(y)] += y * g
    return norm(out)

def door():
    c = F.creak(1); th = F.thump(.8, 80)
    out = np.zeros(int(1.2 * SR)); out[:len(c)] += c * .5; s = int(.5 * SR); out[s:s + len(th)] += th[:len(out) - s]
    return norm(out) * .8

def steps():
    out = np.zeros(int(1.6 * SR))
    for k in range(5):
        y = F.step(1); s = int(k * .34 * SR); out[s:s + len(y)] += y[:len(out) - s] * (.8 + .2 * rng.random())
    return norm(out) * .6

def flip():
    w = F.whoosh(.18, .6); c = F.click(1.2, .8); out = np.zeros(int(.25 * SR)); out[:len(w)] += w; out[:len(c)] += c * .7; return norm(out) * .7

def hit():
    d = 1.6; x = sine(48, d, .5) + lp(noise(d), 200) * env_exp(d, .25) * .6 + sine(96, d, .3) * .4
    return norm(x)

GEN = {
    'whoosh': lambda: F.whoosh(.38, 1), 'pop': lambda: F.pop(1), 'ding': lambda: F.ding(1), 'stamp': stamp, 'clank': clank,
    'sparkle': sparkle, 'pencil': pencil, 'tick': lambda: F.click(1.4, 1), 'beep': beep, 'alarm': None, 'flatline': flatline,
    'page': page_turn, 'scribble': lambda: pencil(.28), 'gavel': gavel, 'door': door, 'steps': steps, 'flip': flip, 'hit': hit,
}
GAIN = {'whoosh': .22, 'pop': .3, 'ding': .22, 'stamp': .8, 'clank': .45, 'sparkle': .2, 'pencil': .25, 'tick': .3, 'beep': .18,
        'alarm': .16, 'flatline': .2, 'page': .4, 'scribble': .35, 'gavel': .75, 'door': .4, 'steps': .35, 'flip': .3, 'hit': .8}
alt = 0
for c in cues:
    ty = c['type']
    if ty == 'alarm':
        x = beep(880 if alt % 2 == 0 else 1175, .16); alt += 1
    else:
        x = GEN[ty]()
    pan = {'whoosh': 0, 'beep': -.4, 'alarm': -.4, 'flatline': -.4, 'door': -.3, 'gavel': .3}.get(ty, (rng.random() - .5) * .3)
    add(buf, np.asarray(x, np.float32), c['t'], GAIN[ty] * c.get('gain', 1), pan)
sf.write(os.path.join(OUT, 'sfx.wav'), buf, SR)
print('sfx ok', len(cues), 'cues', buf.shape[0] / SR)
