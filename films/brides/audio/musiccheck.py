# per-take: vocals check (whisper), loudness envelope per 5 s, silences
import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
for f in sys.argv[1:]:
    a = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout, np.float32)
    segs, info = m.transcribe(a, vad_filter=True)
    txt = ' '.join(s.text for s in segs if s.no_speech_prob < .5)
    e = [20*np.log10(np.sqrt(np.mean(a[i:i+40000]**2))+1e-9) for i in range(0, len(a), int(16000*2.5))]
    print(f, 'speech:', repr(txt[:120]))
    print('  dB/2.5s:', ' '.join(f'{v:.0f}' for v in e))
