# word timings with faster-whisper: python transcribe.py take.mp3 out.json
import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
a = np.frombuffer(pcm, np.float32)
m = WhisperModel('small.en', device='cpu', compute_type='int8')
segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5, initial_prompt='Brides in the Bath. Detective Inspector Arthur Neil. George Joseph Smith. John Lloyd. Bessie. Alice.')
W = [[round(w.start, 3), round(w.end, 3), w.word.strip()] for s in segs for w in s.words]
json.dump(W, open(out, 'w')); print(len(W), W[-1]); print(' '.join(w[2] for w in W))
