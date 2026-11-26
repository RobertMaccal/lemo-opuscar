# Voice prep for take A (take B; natural speed, never time-stretched): adjust a few pauses, 0.25 s lead-in, gentle compression.
# Word timings (takeB.words.json, faster-whisper) are remapped through the same edits -> words.json (also ../src/words.json).
import json, subprocess, os, numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
run = lambda *a: subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)
for f in os.listdir('sfx'):
    if f.endswith('.mp3') and not os.path.exists(f'sfx/{f[:-4]}.wav'): run('-i', f'sfx/{f}', '-ac', '2', '-ar', '48000', f'sfx/{f[:-4]}.wav')
run('-i', 'takeB.mp3', '-ac', '1', '-ar', '48000', 'takeB.48.wav')
a, sr = sf.read('takeB.48.wav'); W = json.load(open('takeB.words.json'))
# new gap length after these words (seconds); every other pause stays as recorded
GAP = {'saved?': 1.05, 'balcony.': .8, 'smiled.': .6}
edits = []   # (time in source, delta seconds) — delta>0 inserts silence, <0 removes
for i in range(len(W) - 1):
    if W[i][2] in GAP:
        g0, g1 = W[i][1], W[i + 1][0]; mid = (g0 + g1) / 2; edits.append((mid, GAP[W[i][2]] - (g1 - g0)))
LEAD = .25
out, pos, shift_pts = [np.zeros(int(LEAD * sr))], 0.0, []
for t, d in edits:
    out.append(a[int(pos * sr):int(t * sr)])
    if d > 0: out.append(np.zeros(int(d * sr))); pos = t
    else: pos = t - d
    shift_pts.append((t, d))
out.append(a[int(pos * sr):])
y = np.concatenate(out); sf.write('vo_final.wav', y, sr)
def remap(t):
    s = LEAD
    for t0, d in shift_pts:
        if t > t0: s += d
    return round(t + s, 3)
WF = [[remap(w[0]), remap(w[1]), w[2]] for w in W]
json.dump(WF, open('words.json', 'w')); json.dump([{'w': w[2], 't0': w[0], 't1': w[1]} for w in WF], open('../src/words.json', 'w'))
run('-i', 'vo_final.wav', '-af', 'highpass=f=70,acompressor=threshold=-26dB:ratio=3:attack=4:release=140:makeup=3,equalizer=f=3500:t=q:w=1.2:g=2', '-ar', '48000', 'vo_comp.wav')
print('vo', len(y) / sr, 's; last word', WF[-1])
