"""Original score for "The Boy Who Caught Bugs": one motif (the Bug Theme) in F major, carried through the film by a square-wave
chip lead, piano, strings, horns, harp, glockenspiel and timpani; sections follow the timeline (timeline.json).
python music.py → out/music.wav (48 kHz stereo). No existing melody is quoted."""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, lp, hp, limit

TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T = TL['T']; DUR = TL['DUR']
shot = {s['id']: (s['a'], s['b']) for s in TL['SHOTS']}
S.seed(7)
EV = []          # sampler events
CH = []          # chip events (t, midi, dur, vel, wave, pan)
def m(p): return S.midi(p) if isinstance(p, str) else p
def ev(t, inst, p, d, v, pan=0, g=1.0): EV.append((t, inst, p, d, v, pan, g))
def chip(t, p, d, v=.5, wave='sq', pan=0): CH.append((t, m(p), d, v, wave, pan))

# —— the Bug Theme (beats) ——
MOTIF = [('A4', 1), ('C5', 1), ('F5', 1.5), ('E5', .5), ('D5', 1), ('C5', 1), ('A4', 2)]
ANSWER = [('Bb4', 1), ('D5', 1), ('G5', 1.5), ('F5', .5), ('E5', 1), ('G5', 1), ('F5', 2)]
MINOR = [('A4', 1), ('C5', 1), ('D5', 1.5), ('C5', .5), ('Bb4', 1), ('A4', 1), ('D4', 2)]
CHORDS = [['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['Bb2', 'D3', 'F3', 'G3'], ['C3', 'E3', 'G3', 'Bb3']]   # one per bar of the 4-bar theme
def melody(t0, bpm, notes, fn, shift=0):
    b = 60 / bpm; t = t0
    for p, d in notes: fn(t, m(p) + shift, d * b); t += d * b
    return t
def theme(t0, bpm, fn, shift=0, answer=True):
    t = melody(t0, bpm, MOTIF, fn, shift)
    return melody(t, bpm, ANSWER, fn, shift) if answer else t
def chords_for(t0, bpm, bars, prog=CHORDS):
    b = 60 / bpm * 4; return [(t0 + i * b, prog[i % len(prog)], b) for i in range(bars)]
def pad(t0, bpm, bars, insts=(('violins', 12), ('violas', 0), ('cellos', -12)), v=.35, prog=CHORDS, att=.3):
    for (t, ch, d) in chords_for(t0, bpm, bars, prog):
        for inst, sh in insts:
            for k, p in enumerate(ch[:3]): ev(t, inst, m(p) + sh + (12 if inst == 'cellos' and k else 0) * 0, d + .2, v, -.3 + .3 * k)
def arp(t0, t1, bpm, inst, v=.4, prog=CHORDS, oct_=12, step=.5, chipwave=None):
    b = 60 / bpm; t = t0; i = 0
    while t < t1 - 1e-3:
        bar = int((t - t0) / (b * 4)); ch = prog[bar % len(prog)]; p = m(ch[i % len(ch)]) + oct_ + (12 if (i // len(ch)) % 2 else 0)
        if chipwave: chip(t, p, b * step * .9, v, chipwave, .2)
        else: ev(t, inst, p, b * step * 1.5, v, .25)
        t += b * step; i += 1
def bass(t0, t1, bpm, inst='contrabass_pizz', v=.5, prog=CHORDS, pattern=(0, 2)):
    b = 60 / bpm; bar_t = t0
    while bar_t < t1 - 1e-3:
        ch = prog[int((bar_t - t0) / (b * 4) + 1e-6) % len(prog)]
        for beat in pattern:
            tt = bar_t + beat * b
            if tt < t1: ev(tt, inst, m(ch[0]) - (12 if inst.startswith('contra') else 0) + 12, b * 1.2, v, 0)
        bar_t += b * 4

# ========== Act I ==========
a, b = 0.0, shot['change'][0]                    # childhood 0 – 22.6: playful
bpm = 100; beat = .6
arp(.2, b, bpm, 'harp', .32, oct_=12, step=.5)
theme(2.6, bpm, lambda t, p, d: (chip(t, p, d * .92, .32, 'sq25'), ev(t, 'glockenspiel', p + 12, d, .28, .2)))
theme(2.6 + 16 * beat * 1.0, bpm, lambda t, p, d: (chip(t, p, d * .92, .3, 'sq25'), ev(t, 'violins_pizz', p, d, .45, -.2)))
bass(.2, b, bpm, 'cellos_pizz', .42)
pad(10, bpm, 6, v=.16)
# urbanisation 22.6 – 30.6: piano alone, the theme in D minor, slowing; silence before "Years later"
melody(23.4, 76, MINOR, lambda t, p, d: ev(t, 'piano', p, d * 1.6, .42, 0))
for t, ch in [(23.2, ['D3', 'A3', 'F4']), (26.4, ['Bb2', 'F3', 'D4']), (28.6, ['G2', 'D3', 'Bb3'])]:
    for k, p in enumerate(ch): ev(t, 'piano', p, 2.6, .3, -.2 + .2 * k); ev(t, 'cellos', m(p) - 12 if k == 0 else p, 2.8, .18, 0)
# ========== Act II ==========
# discovery 31.4 – 48: night, glass and glitter; the tunnel swells; eureka hit
for t, ch in [(31.5, ['F3', 'C4', 'A4']), (35.0, ['D3', 'A3', 'F4']), (38.6, ['Bb2', 'F3', 'D4']), (40.2, ['C3', 'G3', 'E4', 'Bb4']), (43.8, ['F3', 'C4', 'A4', 'F5'])]:
    for k, p in enumerate(ch): ev(t, 'violins' if k > 1 else 'violas', p, 3.8, .2 + (.15 if t >= 40 else 0), -.3 + .2 * k)
arp(31.6, 40.2, 84, None, .16, prog=[['F4', 'A4', 'C5', 'E5'], ['D4', 'F4', 'A4', 'C5'], ['Bb3', 'D4', 'F4', 'A4']], oct_=12, step=.5, chipwave='tri')
arp(40.2, 43.6, 168, 'glockenspiel', .25, prog=[['C5', 'E5', 'G5', 'Bb5']], oct_=0, step=.5)
theme(43.8, 92, lambda t, p, d: (ev(t, 'glockenspiel', p + 12, d, .32, .2), chip(t, p, d * .9, .22, 'sq25')), answer=False)
ev(43.8, 'timpani', 'F2', 1.5, .4)
# development 48 – 57.4: building determination, chip bass ostinato; thins on "money got tight"
bpm = 112; bt = 60 / bpm
for k in range(int((T['coin0'] - 48) / (bt / 2))):
    t = 48 + k * bt / 2; ch = CHORDS[int(k / 8) % 4]; chip(t, m(ch[0]) - 12 + (12 if k % 2 else 0), bt * .4, .22, 'sq50', -.1)
theme(49.2, bpm, lambda t, p, d: ev(t, 'piano', p, d * 1.2, .38, .1) if t < T['coin0'] else None)
bass(48, T['coin0'], bpm, 'contrabass_pizz', .4)
# money tight → the team leaves: a lonely piano, low strings
for t, ch in [(T['coin0'] + .2, ['D3', 'F3', 'A3']), (56.0, ['Bb2', 'D3', 'F3']), (58.6, ['G2', 'Bb2', 'D3']), (61.0, ['A2', 'C#3', 'E3'])]:
    for k, p in enumerate(ch): ev(t, 'cellos', p, 2.6, .2, -.2 + .2 * k)
melody(57.8, 70, [('D5', 1), ('C5', 1), ('A4', 2), ('Bb4', 1), ('A4', 1), ('E4', 2)], lambda t, p, d: ev(t, 'piano', p, d * 1.5, .34, 0))
# ========== Act III ==========
# launch: world blooms 68.6 → the theme in full colour; deflates at "sales were modest"
w0 = shot['world'][0]
for k, p in enumerate(['F2', 'C3', 'A3', 'F4']): ev(w0, 'cellos' if k < 2 else 'violins', p, 3.4, .42, -.2 + .15 * k)
ev(w0, 'timpani', 'F2', 2, .55); ev(w0, 'crash', None, None, .3)
theme(w0 + .1, 108, lambda t, p, d: (ev(t, 'horn', p - 12, d * 1.1, .4, -.1), chip(t, p, d * .9, .28, 'sq25'), ev(t, 'violins', p, d * 1.1, .32, .2)) if t < T['modest'] - .2 else None)
melody(T['modest'] + .1, 70, [('C4', 1), ('B3', 1), ('Bb3', 1), ('A3', 3)], lambda t, p, d: ev(t, 'trombone', p, d, .38, 0))   # comic deflate
# the secret 76.4 – 95: a sneaky staccato ostinato, sparkles, the flood of postcards builds
bpm = 120; bt = .5
for k in range(int((T['mailIn'] - 76.6) / (bt / 2))):
    t = 76.6 + k * bt / 2; seq = ['D3', 'F3', 'A3', 'F3', 'C#3', 'E3', 'A3', 'E3']
    if k % 2 == 0: ev(t, 'violins_pizz', m(seq[(k // 2) % 8]) + 12, .2, .36, (k % 4 - 1.5) * .2)
    if k % 4 == 0: ev(t, 'contrabass_pizz', m(seq[(k // 2) % 8]), .3, .4, 0)
for t in [T['secret'], T['mew']]:
    for i, p in enumerate(['A5', 'C#6', 'E6', 'A6']): ev(t + i * .07, 'glockenspiel', p, .8, .3, .2)
for k in range(int((T['rushIn'] - T['mailIn']) / bt)):
    t = T['mailIn'] + k * bt; ch = [['D4', 'F4', 'A4'], ['Bb3', 'D4', 'F4'], ['G3', 'Bb3', 'D4'], ['A3', 'C#4', 'E4']][(k // 4) % 4]
    for i, p in enumerate(ch): ev(t, 'violins_spic' if False else 'violins_pizz', m(p) + 12, .2, .3 + .25 * k / 17, -.2 + .2 * i)
ev(T['entries'], 'timpani', 'A2', 1, .5)
for k in range(10): ev(T['rushIn'] - 1.5 + k * .15, 'snare', None, None, .15 + .05 * k)
# phenomenon 95 – 110.6: the theme triumphant (horns, strings, chip, timpani)
r0 = shot['rush'][0]; bpm = 112
end = theme(r0, bpm, lambda t, p, d: (ev(t, 'horn', p - 12, d * 1.1, .48, -.15), ev(t, 'violins', p, d * 1.05, .4, .15), chip(t, p + 12, d * .85, .2, 'sq25')))
theme(end, bpm, lambda t, p, d: (ev(t, 'trumpet', p, d, .36, .1), ev(t, 'violins', p + 12, d * 1.05, .3, -.1), chip(t, p, d * .85, .22, 'sq25')))
pad(r0, bpm, 8, v=.26); bass(r0, shot['lights'][1], bpm, 'contrabass_pizz', .45, pattern=(0, 1, 2, 3))
for k in range(8): ev(r0 + k * 60 / bpm * 4, 'timpani', CHORDS[k % 4][0], 1, .4)
# numbers 110.6 – 127.2: bouncy staccato; a comic stop on "where are yours?"; fanfare for No. 1
bpm = 120; bt = .5
for k in range(int((T['where'] - 110.6) / (bt / 2))):
    t = 110.6 + k * bt / 2; ch = CHORDS[(k // 8) % 4]; chip(t, m(ch[k % 3]) + 12 + (12 if k % 4 == 3 else 0), bt * .2, .2, 'sq25', .15)
    if k % 2 == 0: ev(t, 'cellos_pizz', m(ch[0]), .3, .4, -.1)
ev(T['where'] + .5, 'violins_pizz', 'C5', .3, .4); ev(T['where'] + .8, 'violins_pizz', 'F4', .3, .4)
for i, p in enumerate(['C4', 'F4', 'A4', 'C5']): ev(T['no1'] + i * .14, 'trumpet', p, .5 if i < 3 else 2.2, .45, 0)
for p in ['F3', 'A3', 'C4']: ev(T['no1'] + .42, 'horn', p, 2.4, .4, 0)
ev(T['no1'] + .42, 'crash', None, None, .3); ev(T['no1'] + .42, 'timpani', 'F2', 1.5, .5)
pad(T['no1'] + 2.8, 100, 2, v=.22)
# ========== Act IV: auction ==========
h0 = shot['hall'][0]
for t in np.arange(h0, T['gavel'] - 2, 1.2): ev(t, 'timpani', 'D2' if int((t - h0) / 1.2) % 2 == 0 else 'A1', .9, .22 + .2 * (t - h0) / 25)
for t, ch in [(h0, ['D3', 'A3', 'D4']), (T['slab'], ['Bb2', 'F3', 'D4']), (T['prize98'], ['G2', 'D3', 'Bb3']), (T['buy21'], ['A2', 'E3', 'C#4']), (T['sold26'], ['D3', 'F3', 'A3'])]:
    for k, p in enumerate(ch): ev(t, 'violins_trem' if k == 2 else 'cellos', p, 5.5, .2 + .1 * (t > T['buy21']), -.2 + .2 * k)
for i, p in enumerate(['D5', 'F5', 'A5', 'D6']): ev(T['slab'] + i * .06, 'glockenspiel', p, 1, .35, .2)
melody(T['prize98'] + .4, 132, [('D5', .5), ('F5', .5), ('A5', 1), ('G5', .5), ('E5', .5), ('C#5', 1)], lambda t, p, d: ev(t, 'violins_pizz', p, d, .4, .2))
for k in range(18): ev(T['gavel'] - 1.8 + k * .1, 'timpani', 'A1', .2, .2 + .03 * k)
ev(T['gavel'], 'timpani', 'D2', 2, .7); ev(T['gavel'], 'crash', None, None, .45); ev(T['gavel'], 'bass_drum', None, None, .6)
for k, p in enumerate(['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4']): ev(T['gavel'], 'horn' if k < 3 else 'trumpet', p, 2.5, .45, -.2 + .1 * k)
# the record → giddy: the theme as a fast pizzicato for the crayon gag; the truck: a tuba waddle
theme(T['record'] + .2, 140, lambda t, p, d: (ev(t, 'violins_pizz', p, d, .42, .1), chip(t, p + 12, d * .5, .16, 'sq25')), answer=False)
melody(T['mom'] + .3, 96, [('F2', .5), ('A2', .5), ('C3', .5), ('A2', .5), ('Bb2', .5), ('G2', .5), ('C3', 1), ('F2', .5), ('A2', .5), ('C3', .5), ('E3', .5), ('F3', 1)], lambda t, p, d: ev(t, 'tuba', p, d * .9, .45, 0))
# ========== Act V ==========
c0 = shot['coast'][0]       # dawn: wide strings, a hopeful horn
for t, ch in [(c0, ['F2', 'C3', 'A3', 'F4']), (c0 + 3.8, ['Bb2', 'F3', 'D4', 'A4'])]:
    for k, p in enumerate(ch): ev(t, 'cellos' if k < 2 else 'violins', p, 4.2, .32, -.25 + .15 * k)
melody(c0 + .8, 80, MOTIF, lambda t, p, d: ev(t, 'horn', p - 12, d * 1.2, .38, 0))
g0 = shot['graph'][0]       # the climb: rising pizzicato steps; fog thins it; the crash drops away
for k in range(int((T['crash'] - g0) / .25)):
    t = g0 + k * .25; p = m('C4') + [0, 2, 4, 5, 7, 9, 11, 12][k % 8] + 2 * (k // 8)
    ev(t, 'violins_pizz', p, .2, .3 * (1 - .5 * (t > T['fog'])), .1)
for k in range(10): ev(T['crash'] + k * .07, 'violins_pizz', m('C6') - k * 3, .2, .4 - k * .03, -.2)
ev(T['crash'] + .75, 'timpani', 'C2', 1.2, .35)
k0 = shot['kids'][0]        # finale: the theme in full, then the shrink and the leaf: last notes, the final chord
end = theme(k0, 100, lambda t, p, d: (ev(t, 'violins', p, d * 1.1, .42, .15), ev(t, 'horn', p - 12, d * 1.1, .4, -.15), ev(t, 'piano', p, d * 1.4, .35, 0), chip(t, p + 12, d * .85, .16, 'sq25')) if t < T['shrink'] + .5 else None)
pad(k0, 100, 3, v=.28); arp(k0, T['shrink'], 100, 'harp', .3, step=.5)
melody(shot['home'][0] + .9, 72, [('A4', 1), ('C5', 1), ('F5', 3)], lambda t, p, d: (ev(t, 'piano', p, d * 2, .36, 0), chip(t, p, d * .9, .14, 'tri')))
fin = T['fly'] + .1
for k, p in enumerate(['F2', 'C3', 'F3', 'A3', 'C4', 'F4', 'A4']): ev(fin, 'violins' if k > 3 else ('cellos' if k > 1 else 'contrabass'), p, DUR - fin + 1.2, .3, -.3 + .1 * k)
for i, p in enumerate(['F5', 'A5', 'C6', 'F6']): ev(fin + .1 + i * .12, 'glockenspiel', p, 3, .25, .2)
ev(fin, 'harp', 'F3', 3, .35)

# —— render ——
N = int((DUR + 2) * SR)
mix = S.render([e for e in EV if e[0] < DUR + 1], dur=DUR + 2)
def chipnote(p, d, v, wave):
    f = 440 * 2 ** ((p - 69) / 12); n = int((d + .12) * SR); t = np.arange(n) / SR
    vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - .15) / .2, 0, 1)
    ph = np.cumsum(f * vib / SR) % 1
    duty = {'sq25': .25, 'sq50': .5, 'sq12': .125}.get(wave)
    x = (np.where(ph < duty, 1.0, -1.0) if duty else 2 * np.abs(2 * ph - 1) - 1)
    env = np.minimum(1, t / .005) * np.where(t < d, 1 - .25 * np.minimum(1, t / max(d, .05)), np.exp(-(t - d) / .04))
    return lp(x * env * v * (.32 if duty else .6), 6000)
chipbus = np.zeros((N, 2), np.float32)
for (t, p, d, v, w, pan) in CH:
    if t >= DUR + 1: continue
    add(chipbus, chipnote(p, d, v, w), t, 1.0, pan)
echo = np.zeros_like(chipbus); dl = int(.28 * SR); echo[dl:] = chipbus[:-dl] * .28
mix = mix[:N] if len(mix) >= N else np.pad(mix, ((0, N - len(mix)), (0, 0)))
mix = mix + chipbus + echo
mix = S.room(mix, size=.45, mix=.18)
mix = limit(mix * .9, .95)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'music.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('music', DUR, 's,', len(EV), 'sampled notes,', len(CH), 'chip notes')
