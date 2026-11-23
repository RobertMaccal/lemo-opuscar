# Voice prep (what was done to ElevenLabs take A): tighten non-dramatic pauses, +4% tempo, add two silences for the horror beats,
# 0.3 s lead-in, gentle compression; also decodes every mp3 effect to 48 kHz wav for mix.py.
# Word timings (words_final.json) were then taken with faster-whisper small.en and aligned to script.txt.
import json, subprocess, os, numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
run = lambda *a: subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)
for f in os.listdir('sfx'):
    if f.endswith('.mp3'): run('-i', f'sfx/{f}', '-ac', '2', '-ar', '48000', f'sfx/{f[:-4]}.wav')
run('-i', 'takeA.mp3', '-ac', '1', '-ar', '48000', 'takeA.48.wav')
a, sr = sf.read('takeA.48.wav'); ws = json.load(open('takeA.words.json'))
keep = {'out.': .72, 'lantern.': .6, 'leave.': .6, 'bodies.': .62, 'weapon.': .6, 'attic.': .55, 'police.': .55, 'crib.': .6}
cuts = []
for i in range(len(ws) - 1):
    g0, g1 = ws[i][1], ws[i + 1][0]; tgt = keep.get(ws[i][2], .4)
    if g1 - g0 > tgt + .05: rm = g1 - g0 - tgt; mid = (g0 + g1) / 2; cuts.append((mid - rm / 2, mid + rm / 2))
out, pos, f = [], 0, int(.01 * sr)
for c0, c1 in cuts: out.append(a[int(pos * sr):int(c0 * sr)]); pos = c1
out.append(a[int(pos * sr):]); y = out[0]
for s in out[1:]:
    r = np.linspace(0, 1, f); y = np.concatenate([y[:-f], y[-f:] * (1 - r) + s[:f] * r, s[f:]])
sf.write('vo_tight.wav', y, sr)
run('-i', 'vo_tight.wav', '-af', 'atempo=1.04', '-ar', '48000', 'vo.wav')
a, sr = sf.read('vo.wav'); segs, pos = [], 0
for t, d in [(39.10, .45), (57.42, .6)]: segs += [a[int(pos * sr):int(t * sr)], np.zeros(int(d * sr))]; pos = t
segs.append(a[int(pos * sr):]); sf.write('vo_final.wav', np.concatenate([np.zeros(int(.3 * sr))] + segs), sr)
run('-i', 'vo_final.wav', '-af', 'highpass=f=70,acompressor=threshold=-26dB:ratio=3:attack=4:release=140:makeup=3,equalizer=f=3500:t=q:w=1.2:g=2', '-ar', '48000', 'vo_comp.wav')
