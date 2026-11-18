"""Speech-to-text check of every dialogue take:  .venv/bin/python films/ten-second-massage/tools/stt.py <wav/mp3> ...
Prints what faster-whisper (small.en) hears, with word start times."""
import sys, os
from faster_whisper import WhisperModel
import soundfile as sf, soxr
m = WhisperModel('small.en', device='cpu', compute_type='int8')
for f in sorted(sys.argv[1:]):
    x, sr = sf.read(f, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    segs, _ = m.transcribe(soxr.resample(x, sr, 16000), beam_size=5, word_timestamps=True)
    segs = list(segs)
    print(os.path.basename(f), '|', ' '.join(s.text.strip() for s in segs), '|', ' '.join(f"{w.word.strip()}@{w.start:.2f}" for s in segs for w in s.words), flush=True)
