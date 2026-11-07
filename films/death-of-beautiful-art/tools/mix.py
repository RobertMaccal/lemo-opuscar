#!/usr/bin/env python3
"""Score, foley and narration for "The Death of Beautiful Art?" → out/mix.wav (48 kHz stereo).
Timing: film.json (voice starts, sections) + events.json (window.EV exported by core/render/events.mjs: foley hits and music markers).
Score: original, D minor, 60 bpm with the pulse in eighths (0.5 s) — low strings, sparse piano, a sub pulse, mallets; samples from
VSCO 2 CE / VCSL (CC0) and Salamander Grand Piano (CC BY 3.0) via core/audio/sampler. Foley is synthesised. Music ducks ≈ −9 dB under the voice."""
import json, os, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, hp, lp, noise, env_exp, t_, thump, norm, limit, brown, compress

F = json.load(open(f'{D}/film.json')); DUR = F['dur']; N = int(DUR * SR)
EVJ = json.load(open(f'{D}/events.json'))['ev']
CUE = {e['name']: e['t'] for e in EVJ if e['type'] == 'cue'}
mus = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32); voc = np.zeros((N, 2), np.float32); amb = np.zeros((N, 2), np.float32)
S.seed(11); R = np.random.default_rng(5)
ev = []
def E(t, inst, p, d, v, pan=0, g=1.0): ev.append((float(t), inst, p, float(d), v, pan, g))
def pulse_bar(t0, t1, step, inst, pitch, v, g, pan=0):
    tt = t0
    while tt < t1 - .01: E(tt, inst, pitch, step * .9, v, pan, g); tt += step

# ── 1 · price: silence → one soft thump (foley) → low D drone, pendulum tick; a high piano note on the split ──
E(1.9, 'contrabass', 'D2', CUE['rewind'] - 1.9, .45, -.15, .5); E(2.4, 'cellos', 'D3', CUE['rewind'] - 2.4, .35, .15, .35)
E(CUE['split'], 'piano', 'D6', 2.5, .32, .3, .35); E(CUE['grocery'], 'piano', 'A5', 2.0, .28, .3, .3)
# ── 2 · painting: graceful, sustained strings Dm9 → B♭maj7 → Gm9 → A, a sparse piano line (original) ──
t2 = CUE['rewind'] + .8
CH = [(t2, ['D3', 'A3', 'E4', 'F4']), (CUE['s2'] + 1.5, ['D3', 'A3', 'E4', 'F4']), (CUE['vg'], ['Bb2', 'F3', 'D4', 'A4']), (CUE['pic'], ['G2', 'D3', 'Bb3', 'A4']), (CUE['gue'], ['A2', 'E3', 'C#4', 'E4'])]
for i, (a, nts) in enumerate(CH):
    b = CH[i + 1][0] if i + 1 < len(CH) else CUE['back'] + .6
    E(a, 'cellos', nts[0], b - a + .4, .4, -.15, .42); E(a, 'violas', nts[1], b - a + .4, .34, .1, .3)
    E(a, 'violins', nts[2], b - a + .4, .28, -.3, .2); E(a + .8, 'violins', nts[3], b - a - .4, .24, .35, .17)
    if i in (0, 2): E(a, 'contrabass', nts[0][:-1] + str(int(nts[0][-1]) - 1), b - a, .38, 0, .35)
MEL = [(0, 'A5'), (1.5, 'F5'), (2.5, 'E5'), (4.0, 'D5'), (6.0, 'A4'), (7.0, 'C5'), (8.0, 'D5'), (10.5, 'F5'), (11.5, 'E5'), (12.0, 'D5'), (14.0, 'Bb4'),
       (16.0, 'A4'), (17.5, 'D5'), (19.5, 'E5'), (20.0, 'C#5')]
for dt, p in MEL: E(CUE['s2'] + .5 + dt, 'piano', p, 1.8, .3 + .05 * R.random(), .25, .42)
# ── 3 · 1917: drone; the colour drains (a falling piano third); tremolo minor second + sub pulse = discovery; silence after "partition" ──
arr = CUE['back'] + .8
E(CUE['back'], 'contrabass', 'D2', CUE['duch'] - CUE['back'] + .5, .4, 0, .4)
E(arr, 'piano', 'F5', 1.5, .3, .2, .35); E(arr + .35, 'piano', 'D5', 2.0, .28, .2, .32)
E(CUE['duch'], 'violins_trem', 'E5', CUE['hid'] + 1.4 - CUE['duch'], .22, .35, .14); E(CUE['duch'] + 1.0, 'violins_trem', 'F5', CUE['hid'] + .4 - CUE['duch'], .24, -.35, .13)
E(CUE['duch'], 'cellos', 'D3', CUE['hid'] + 1.4 - CUE['duch'], .35, .1, .32)
E(CUE['mag'], 'piano', 'D4', 3.0, .35, 0, .45); E(CUE['mag'], 'vibraphone', 'A4', 3.0, .35, .2, .3)   # first sound after the silence
E(CUE['idea3'], 'cellos', 'D3', CUE['s4'] - CUE['idea3'] + .3, .38, .1, .35); E(CUE['idea3'], 'violas', 'F3', CUE['s4'] - CUE['idea3'] + .3, .3, -.1, .25)
# ── 4 · idea: pizzicato ostinato in eighths (0.5 s) Dm – B♭ – Gm – A; held chord under Danto ──
PAT = {'Dm': (['D4', 'F4', 'A4', 'F4'], 'D2'), 'Bb': (['D4', 'F4', 'Bb4', 'F4'], 'Bb1'), 'Gm': (['D4', 'G4', 'Bb4', 'G4'], 'G1'), 'A': (['C#4', 'E4', 'A4', 'E4'], 'A1')}
def ostinato(t0, t1, prog, bar=4.0, g=.4):
    tt, k = t0, 0
    while tt < t1 - .01:
        name = prog[int((tt - t0) // bar) % len(prog)]; pat, root = PAT[name]
        E(tt, 'violas_pizz', pat[k % 4], .4, .4 + .12 * (k % 4 == 0), .25, g)
        if k % 8 == 0: E(tt, 'contrabass_pizz', root if root[-1] != '1' else root[:-1] + '2', 1.0, .55, -.2, g * 1.1)
        tt += .5; k += 1
ostinato(CUE['s4'], CUE['answer'], ['Dm', 'Bb', 'Gm', 'A'])
E(CUE['answer'], 'cellos', 'Bb2', CUE['late'] - CUE['answer'] + .3, .38, .1, .36); E(CUE['answer'], 'violas', 'F3', CUE['late'] - CUE['answer'] + .3, .3, -.1, .28)
E(CUE['answer'], 'violins', 'D4', CUE['late'] - CUE['answer'] + .3, .24, .3, .18)
ostinato(CUE['late'], CUE['s5'], ['Dm', 'Bb'], g=.42)
# ── 5 · invisible: everything out; a high harmonic while the room draws; after "Yes. Empty space." a two-note pizzicato shrug ──
E(CUE['room'], 'violins', 'A5', 2.4, .18, .3, .1)
yes_end = F['vo_end']['5']
E(yes_end + .25, 'cellos_pizz', 'A3', .5, .6, .1, .55); E(yes_end + .62, 'cellos_pizz', 'F3', .8, .55, .1, .55)
# ── 6 · banana: tension back — pulse, tremolo, ticks doubling under the price ladder, soft timpani on the columns ──
E(CUE['s6'], 'contrabass', 'D2', CUE['s7'] - CUE['s6'], .42, 0, .42)
E(CUE['s6'] + 2.0, 'violins_trem', 'A4', CUE['cols'] - CUE['s6'] - 1.0, .2, .3, .12); E(CUE['s6'] + 4.0, 'violins_trem', 'Bb4', CUE['cols'] - CUE['s6'] - 3.0, .2, -.3, .1)
for a in (CUE['cols'] + .1, CUE['cols'] + .7, CUE['cols'] + 1.3, CUE['cols'] + 1.9): E(a, 'timpani', 'D2', 1.2, .4, 0, .35)
E(CUE['cols'], 'cellos', 'D3', CUE['buy'] - CUE['cols'], .32, .1, .3); E(CUE['buy'], 'violas', 'A3', CUE['proof'] - CUE['buy'], .3, -.1, .25)
E(CUE['proof'], 'violins_trem', 'D5', CUE['s7'] - CUE['proof'], .22, .3, .14); E(CUE['proof'] + 1.2, 'violins_trem', 'Eb5', CUE['s7'] - CUE['proof'] - 1.2, .22, -.3, .12)
# ── 7 · who decides: slow sustained chords under the two columns ──
for a, nts in [(CUE['s7'], ['D3', 'A3', 'F4']), (CUE['s7'] + 5, ['Bb2', 'F3', 'D4']), (CUE['critics'] + 1.5, ['G2', 'D3', 'Bb3']), (CUE['both'], ['A2', 'E3', 'C#4'])]:
    E(a, 'cellos', nts[0], 5.4, .36, -.1, .36); E(a, 'violas', nts[1], 5.4, .3, .1, .26); E(a, 'violins', nts[2], 5.4, .25, .3, .18)
# ── 8 · final: D minor add9 with vibraphone; ends unresolved on the add9, no root; decays into near-silence ──
s8 = CUE['s8']
for i, p in enumerate(['D3', 'A3', 'E4', 'F4', 'A4', 'E5']): E(s8 + .1 + i * .18, 'vibraphone', p, 3.0, .4, -.3 + .12 * i, .32)
E(s8, 'cellos', 'D3', 6.0, .32, -.1, .32); E(s8, 'violas', 'A3', 9.0, .28, .1, .24)
E(s8 + 6.0, 'violins', 'E4', CUE['voEnd'] - s8 - 4.5, .22, .3, .16); E(s8 + 6.0, 'cellos', 'F3', CUE['voEnd'] - s8 - 4.5, .26, -.1, .24)
E(CUE['voEnd'] + .2, 'vibraphone', 'E5', 3.0, .3, .2, .22); E(CUE['voEnd'] + .2, 'vibraphone', 'A4', 3.0, .26, -.2, .2)

# pendulum tick every 0.5 s in the minute-scale sections (very quiet), and the price-ladder clock
def tick_sound(v=1.0): d = .03; return norm(bp(noise(d), 2200, 6500) * env_exp(d, .004)) * v
for a, b, step, g in [(2.0, CUE['rewind'], .5, .05), (CUE['s4'], CUE['answer'], .5, .045), (CUE['s6'], CUE['proof'], .5, .04), (CUE['proof'], CUE['s7'], .25, .05)]:
    tt = a
    while tt < b - .01: add(mus, tick_sound(1.0 if round((tt - a) / step) % 4 == 0 else .7), tt, g, .1); tt += step
# sub pulse (D2 with 2nd and 3rd harmonics, so it speaks on small speakers) — discovery and the auction
def subpulse(a, b, g):
    tt = a
    while tt < b - .01:
        d = .6; tm = t_(d); f = 73.4
        y = (np.sin(2 * np.pi * f * tm) + .35 * np.sin(4 * np.pi * f * tm) + .18 * np.sin(6 * np.pi * f * tm)) * np.exp(-tm / .18) * (1 - np.exp(-tm / .006))
        add(mus, y.astype(np.float32), tt, g, 0); tt += 1.0
subpulse(CUE['idea3'], CUE['s4'] + 2, .16); subpulse(CUE['s6'] + 1, CUE['s7'], .14)

mus += S.render(ev, DUR, master=False)[:N]
mus = S.room(mus, size=.55, mix=.22)

# ── foley (procedural) ──
def paper(v=1.0): d = .16; y = bp(noise(d), 1500, 7000) * env_exp(d, .05) * (1 + .6 * np.sin(2 * np.pi * 37 * t_(d))); return norm(y) * v
def shutter(v=1.0):
    d = .09; y = np.zeros(int(d * SR)); a = hp(noise(.012), 1800) * env_exp(.012, .002); y[:len(a)] += a; y[int(.045 * SR):int(.045 * SR) + len(a)] += a * .7
    y += lp(noise(d), 900) * env_exp(d, .02) * .3; return norm(y) * v
def pencil(d=.35, v=1.0): tm = t_(d); y = bp(noise(d), 2500, 8000) * (.6 + .4 * np.sin(2 * np.pi * 23 * tm) ** 2) * np.sin(np.pi * tm / d) ** .5; return norm(y) * v
def marker(v=1.0): d = .4; tm = t_(d); y = bp(noise(d), 1800, 4200) * (.5 + .5 * np.sin(2 * np.pi * 14 * tm)) * np.sin(np.pi * tm / d); return norm(y) * v
def loupe(v=1.0): d = .25; tm = t_(d); y = np.sin(2 * np.pi * 3100 * tm) * env_exp(d, .04) * .5 + hp(noise(d), 3000) * env_exp(d, .003); return norm(y) * v
def rewind(v=1.0):
    d = .8; tm = t_(d); f = 2400 * (1 - .8 * tm / d); ph = np.cumsum(f) / SR
    y = np.sign(np.sin(2 * np.pi * ph)) * .15 + bp(noise(d), 600, 5000) * .6; y = lp(y, 5000) * np.sin(np.pi * tm / d) ** .7; return norm(y) * v
def slide(v=1.0): d = .55; tm = t_(d); y = bp(brown(d), 200, 2400) * np.sin(np.pi * tm / d) ** 2; return norm(y) * v
def flash(v=1.0): d = .14; y = hp(noise(d), 4000) * env_exp(d, .03); return norm(y) * v
def keys(d, v=1.0):
    y = np.zeros(int(d * SR)); tt = 0.0
    while tt < d - .04:
        k = (hp(noise(.02), 2000) * env_exp(.02, .003) + np.sin(2 * np.pi * (900 + 400 * R.random()) * t_(.02)) * env_exp(.02, .004) * .4)
        i = int(tt * SR); y[i:i + len(k)] += k[:len(y) - i] * (.6 + .4 * R.random()); tt += .055 + .07 * R.random()
    return norm(y) * v
for e in EVJ:
    ty, t, g = e['type'], e['t'], e.get('g', 1.0)
    if ty == 'cue': continue
    pan = float(R.uniform(-.25, .25))
    if ty == 'thump': add(fx, thump(1, 62), t, .55 * g, 0)
    elif ty == 'tick': add(fx, tick_sound(), t, .22 * g, pan)
    elif ty == 'paper': add(fx, paper(), t, .16 * g, pan)
    elif ty == 'shutter': add(fx, shutter(), t, .2 * g, pan)
    elif ty == 'pencil': add(fx, pencil(e.get('d', .35)), t, .1 * g, pan)
    elif ty == 'marker': add(fx, marker(), t, .1 * g, pan)
    elif ty == 'loupe': add(fx, loupe(), t, .12 * g, pan)
    elif ty == 'rewind': add(fx, rewind(), t, .3 * g, 0)
    elif ty == 'slide': add(fx, slide(), t, .25 * g, 0)
    elif ty == 'flash': add(fx, flash(), t, .12 * g, 0)
    elif ty == 'keys': add(fx, keys(e.get('d', 1.0)), t, .1 * g, .2)
    elif ty == 'mallet': y = S.note('vibraphone', e.get('n', 69), 1.6, .5); add(fx, y, t, .28 * g, pan)

# ── room tone: filtered brown noise, far below the voice; a faint gallery hum in the empty room ──
bed = lp(brown(DUR + .1)[:N], 380).astype(np.float32) * .006
amb[:, 0] += bed; amb[:, 1] += np.roll(bed, 2400)
a, b = int(CUE['room'] * SR), int(CUE['s6'] * SR); tm = np.arange(b - a) / SR
hum = (np.sin(2 * np.pi * 60 * tm) * .5 + np.sin(2 * np.pi * 120 * tm) * .25 + lp(noise((b - a) / SR)[:b - a], 300) * .5) * .004
hum *= np.minimum(1, np.minimum(tm / .5, (tm[-1] - tm) / .5)); amb[a:b] += hum[:, None].astype(np.float32)

# ── voice: the eight edited sequences at their starts; compress, then balance ──
for sid, t0 in F['vo'].items():
    y, sr = sf.read(f'{D}/voice/seq{sid}.wav', dtype='float32'); assert sr == SR
    add(voc, y, t0, 1.0, 0)
v = compress(voc[:, 0], thr=.18, ratio=3.0); voc = np.stack([v, v], 1).astype(np.float32)
rms = lambda z: np.sqrt(np.mean(z[np.abs(z) > 1e-4] ** 2)) if np.any(np.abs(z) > 1e-4) else 1
voc *= .16 / rms(voc[:, 0])
# duck the music ≈ −9 dB while the voice speaks (smoothed envelope, 120 ms attack, 450 ms release)
env = np.abs(voc[:, 0]); hop = 480; e = np.array([env[i:i + hop].max() for i in range(0, N, hop)])
act = (e > .01).astype(float); sm = np.zeros_like(act); s_ = 0
for i, a_ in enumerate(act): s_ += (a_ - s_) * (.4 if a_ > s_ else .045); sm[i] = s_
g = np.repeat(1 - .645 * sm, hop)[:N].astype(np.float32)
mus *= g[:, None]
mus *= .55 / max(1e-6, np.abs(mus).max()) * 1.0
mix = voc + mus * 1.9 + fx * 1.0 + amb
mix = np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
os.makedirs(f'{D}/out', exist_ok=True); sf.write(f'{D}/out/mix.wav', mix, SR, subtype='PCM_24')
for nm, z in [('voice', voc), ('music', mus * .85), ('fx', fx * .9)]: print(nm, 'rms dB', round(20 * np.log10(rms(z[:, 0]) + 1e-9), 1))
print('wrote out/mix.wav', round(N / SR, 2), 's')
