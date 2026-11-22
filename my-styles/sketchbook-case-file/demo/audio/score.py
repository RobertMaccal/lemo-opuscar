"""Original score: felt-piano + pizzicato explainer bed in D minor -> crisis -> silence -> sombre court -> warm F-major lesson."""
import os, sys
HERE = os.environ.get('HERE') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ['OUT']
sys.path.insert(0, os.environ.get('LIB', os.path.join(HERE, '../../..')))
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR
S.seed(11)
import json
_A = json.load(open(os.path.join(HERE, 'voice/warp.json'))); _wd = json.load(open(os.path.join(HERE, 'voice/takeA.words.json')))
_idx = [0] + [i for i in range(1, len(_wd)) if _wd[i - 1]['w'][-1] in '.?!']
GRID_NEW = json.load(open(os.path.join(HERE, 'page/words.json')))[-1]['t1'] + .15
_anc = [(0.0, 0.0)] + [tuple(_A[i]) for i in _idx if _A[i][0] > 0] + [(98.35, GRID_NEW), (106.0, GRID_NEW + 7.65)]
_o = np.array([a for a, _ in _anc]); _nn = np.array([b for _, b in _anc])
def W(t): return float(np.interp(t, _o, _nn))
DUR_NEW = GRID_NEW + 4.25
E = []
def n(t, inst, p, d, v, pan=0, g=1.0, **kw):
    t0 = W(t)
    if d is not None: d = max(.05, W(t + d) - t0)
    t = t0
    if kw: E.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g, **kw))
    else: E.append((t, inst, p, d, v, pan, g))

BPM = 92; b = 60 / BPM; BAR = 4 * b

# ---------- A: hook 0 - 6.2 ----------
n(0.0, 'piano', 'D1', 4, .9, 0, 1.1); n(0.0, 'piano', 'D2', 4, .85, 0, 1.0)
n(0.0, 'timpani', 'D2', 2.5, .7, 0, .8)
n(0.05, 'cellos', 'D2', 6.0, .55, -.2, .9, attack=1.2)
n(0.05, 'contrabass', 'D1', 6.0, .5, -.1, .8, attack=1.2)
n(1.9, 'gran_cassa', None, None, .7, 0, .7)
n(2.1, 'violins_trem', 'A4', 4.0, .35, .3, .55, attack=1.5)
n(2.1, 'violas', 'D4', 4.0, .35, -.2, .5, attack=1.5)
n(4.6, 'piano', 'F4', 1.6, .45, .1); n(5.2, 'piano', 'E4', 1.2, .4, .1)

# ---------- B: curious story bed 6.2 - 41.4 (Dm Bb Gm A) ----------
prog = [('D2', ['D4', 'F4', 'A4']), ('Bb1', ['D4', 'F4', 'Bb4']), ('G1', ['D4', 'G4', 'Bb4']), ('A1', ['C#4', 'E4', 'A4'])]
mel = [['A4', None, 'F4', 'E4'], ['D4', None, 'F4', None], ['G4', 'F4', 'E4', 'D4'], ['E4', None, 'C#4', None]]
t0 = 6.25; bar = 0
while t0 + bar * BAR < 41.3:
    T = t0 + bar * BAR; root, ch = prog[bar % 4]
    rm = S.midi(root)
    # pizzicato bass: root - fifth bounce on eighths 1,3,5,7
    for k, iv in enumerate([0, 7, 12, 7]):
        n(T + k * b, 'cellos_pizz', rm + 12 + iv, b, .55, -.25, .9)
    # piano offbeat chords (soft)
    for k in [1, 3]:
        for p in ch: n(T + k * b + .02, 'piano', p, b * .9, .32, .15, .55)
    # melody every bar after the first phrase (piano right hand, sparse)
    if bar >= 2:
        for k, p in enumerate(mel[bar % 4]):
            if p: n(T + k * b, 'piano', S.midi(p) + 12, b * 1.4, .4, .2, .6)
    # harp arpeggio colour from Bielefeld on
    if T >= 16.3:
        for k, p in enumerate([ch[0], ch[1], ch[2], ch[1]]):
            n(T + k * b + b / 2, 'harp', S.midi(p) + 12, b, .38, .35, .45)
    # glockenspiel sparkle on syringe "milk" moment & refobacin
    bar += 1
n(9.3, 'glockenspiel', 'A5', 1.5, .45, .3, .5); n(9.45, 'glockenspiel', 'D6', 1.5, .4, .3, .45)
n(29.95, 'glockenspiel', 'F5', 1.2, .4, .3, .45)
# clarinet line in the syringe-set-down scene
for tt, p, d in [(31.2, 'A4', 1.2), (32.5, 'G4', .6), (33.1, 'F4', 1.3), (34.5, 'E4', 1.2), (35.9, 'D4', 1.6)]:
    n(tt, 'clarinet', p, d, .35, -.3, .45)

# ---------- STOP: break + suspense 41.4 - 44.4 ----------
n(41.5, 'piano', 'D2', 2.5, .7, 0, .9); n(41.5, 'piano', 'D3', 2.5, .6, 0, .7)
n(41.9, 'violins_trem', 'G#4', 2.6, .3, .3, .5, attack=.8); n(41.9, 'violins_trem', 'D5', 2.6, .28, -.3, .45, attack=.8)
n(42.0, 'cellos', 'D2', 2.4, .4, 0, .7, attack=.6)

# ---------- injection: dark ostinato 44.4 - 49.5 ----------
T = 44.4
while T < 49.4:
    for k, p in enumerate(['D3', 'D3', 'Eb3', 'D3']): n(T + k * b, 'cellos_pizz', p, b, .55, -.2, .9)
    n(T, 'piano', 'D2', BAR, .4, 0, .6)
    T += BAR
n(44.4, 'violins_trem', 'D4', 5.0, .25, .3, .45, attack=1.5); n(46.8, 'violins_trem', 'Eb4', 2.7, .28, .3, .45, attack=.8)

# ---------- C: crisis 49.5 - 59.4 ----------
n(49.5, 'cellos', 'D2', 10, .45, -.2, .8, attack=2)
n(49.5, 'contrabass', 'D1', 10, .45, 0, .7, attack=2)
n(52.2, 'violins_trem', 'F4', 7.2, .4, .3, .55, attack=.5); n(52.2, 'violins_trem', 'Bb4', 7.2, .38, -.3, .5, attack=.5)
n(52.2, 'violas', 'E4', 7.2, .35, 0, .45, attack=.5)
T = 49.6; k = 0
while T < 59.2:
    gap = .75 if T < 52.2 else (.55 if T < 55 else .45)
    n(T, 'timpani', 'D2', .5, .45 + .2 * (T > 52.2), 0, .7); T += gap; k += 1
n(54.97, 'gran_cassa', None, None, .55, 0, .6)
for tt in [52.2, 54.97, 56.99]: n(tt, 'piano', 'D1', 2, .7, 0, .8)

# ---------- D: 12:28 silence ----------
n(59.65, 'piano', 'A4', 2.5, .38, .1, .6); n(60.9, 'piano', 'F4', 2.5, .34, .1, .55); n(61.9, 'piano', 'D4', 3, .32, .1, .55)
n(59.65, 'cellos', 'D2', 3.2, .25, 0, .45, attack=1)

# ---------- E: aftermath + court 62.2 - 80.9 ----------
chords = [('D2', ['D4', 'E4', 'A4']), ('Bb1', ['D4', 'F4', 'A4']), ('F2', ['C4', 'F4', 'A4']), ('A1', ['D4', 'E4', 'A4']),
          ('D2', ['D4', 'F4', 'A4']), ('G1', ['D4', 'G4', 'Bb4']), ('Bb1', ['D4', 'F4', 'Bb4']), ('A1', ['C#4', 'E4', 'A4'])]
T = 62.4; i = 0
while T < 80.6:
    root, ch = chords[i % len(chords)]
    n(T, 'piano', root, BAR * .95, .45, -.1, .7); n(T, 'piano', S.midi(root) + 12, BAR * .95, .35, -.1, .55)
    for k, p in enumerate(ch): n(T + k * .09, 'piano', p, BAR * .9, .33, .15, .55)
    n(T, 'cellos', root if S.midi(root) >= 38 else S.midi(root) + 12, BAR, .3, -.25, .55, attack=.6)
    if T > 74: n(T, 'violins', S.midi(ch[2]) + 12, BAR, .25, .3, .4, attack=.8)
    T += BAR; i += 1
n(67.63, 'timpani', 'D2', 1.5, .65, 0, .8); n(67.63, 'piano', 'D1', 2, .55, 0, .6)

# ---------- F: lesson in F major 80.9 - 98.3 ----------
lp = [('Bb1', ['Bb3', 'D4', 'F4', 'A4']), ('F2', ['A3', 'C4', 'F4', 'A4']), ('C2', ['G3', 'C4', 'E4', 'G4']), ('D2', ['A3', 'D4', 'F4', 'A4'])]
T = 80.95; i = 0
while T < 98.2:
    root, ch = lp[i % 4]
    rm = S.midi(root)
    n(T, 'piano', root, BAR, .45, -.1, .7)
    seq = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1], ch[2], ch[3]]
    for k, p in enumerate(seq): n(T + k * b / 2, 'piano', S.midi(p) + 12, b, .32 + .04 * (T > 88), .15, .55)
    for k in range(4): n(T + k * b, 'cellos_pizz', rm + 12 + (0, 7, 12, 7)[k], b, .45, -.25, .75)
    if T > 84: n(T, 'violins', S.midi(ch[3]) + 12, BAR, .28 + .08 * (T > 94), .3, .45, attack=.5)
    if T > 88: n(T, 'cellos', rm + 12, BAR, .3, -.2, .5, attack=.4)
    if T > 94: n(T, 'violas', S.midi(ch[1]) + 12, BAR, .3, 0, .45, attack=.4)
    T += BAR; i += 1
for k, tt in enumerate([83.75, 83.91, 84.07]): n(tt, 'glockenspiel', ['C6', 'F6', 'A6'][k], 1.2, .45, .3, .5)
for tt in [85.58, 86.59, 88.68, 90.15]: n(tt, 'glockenspiel', 'F6', .8, .3, .3, .35)

# ---------- G: final resolve 98.35 ----------
n(98.35, 'piano', 'F1', 4, .7, 0, .9); n(98.35, 'piano', 'F2', 4, .6, 0, .8)
for k, p in enumerate(['A3', 'C4', 'F4', 'A4', 'C5', 'F5']): n(98.35 + k * .04, 'piano', p, 4, .45, .1, .6)
for k, p in enumerate(['F4', 'A4', 'C5', 'F5', 'A5', 'C6', 'F6']): n(98.3 + k * .06, 'harp', p, 3, .45, .35, .5)
n(98.35, 'violins', 'A5', 4, .4, .3, .55, attack=.3); n(98.35, 'violas', 'C5', 4, .38, -.2, .5, attack=.3); n(98.35, 'cellos', 'F3', 4, .4, -.2, .55, attack=.3)
n(98.35, 'contrabass', 'F2', 4, .4, 0, .55, attack=.3)
n(99.55, 'glockenspiel', 'C6', 2.5, .4, .3, .45); n(99.55, 'gran_cassa', None, None, .35, 0, .4)

mix = S.render(E, dur=DUR_NEW + 1.5)
mix = S.room(mix, size=.45, mix=.2)
# fade out at the end
L = mix.shape[0]; f0, f1 = int((DUR_NEW - 1.2) * SR), int(DUR_NEW * SR)
g = np.ones(L); g[f0:f1] = np.linspace(1, 0, f1 - f0); g[f1:] = 0
mix = (mix * g[:, None]).astype(np.float32)
sf.write(os.path.join(OUT, 'music.wav'), mix, SR)
names = sorted({e[1] if isinstance(e, tuple) else e['inst'] for e in E})
open(os.path.join(OUT, 'MUSIC_CREDITS.txt'), 'w').write(S.credits(names) if isinstance(S.credits(names), str) else '\n'.join(S.credits(names)))
print('music ok', L / SR, names)
