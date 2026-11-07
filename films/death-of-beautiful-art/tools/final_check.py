"""Verify the delivered film: container/stream facts, loudness, black frames, and a speech check of each narration
sequence cut out of the finished mix.   usage: python tools/final_check.py death-of-beautiful-art.mp4"""
import json, os, re, subprocess, sys, difflib
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4 = os.path.join(HERE, sys.argv[1] if len(sys.argv) > 1 else 'death-of-beautiful-art.mp4')
F = json.load(open(f'{HERE}/film.json')); SCRIPT = json.load(open(f'{HERE}/voice/script.json'))
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], capture_output=True, text=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
print(f"video {v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} fps, {v.get('pix_fmt')} | audio {a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch")
print(f"duration {float(pr['format']['duration']):.2f} s, size {int(pr['format']['size'])/1e6:.1f} MB")
ok = v['codec_name'] == 'h264' and v['width'] == 1920 and v['height'] == 1080 and v['r_frame_rate'] in ('30/1', '30000/1000') and a['codec_name'] == 'aac'
lo = subprocess.run(['ffmpeg', '-nostats', '-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = re.findall(r'I:\s+(-?[\d.]+) LUFS', lo)[-1]; TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', lo)[-1]
print(f'loudness {I} LUFS, true peak {TP} dBFS')
bd = subprocess.run(['ffmpeg', '-nostats', '-i', mp4, '-vf', 'blackdetect=d=0.1:pix_th=0.02', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd); print('black stretches', blacks)
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r"[^a-z0-9' ]", ' ', s.lower().replace('-', ' ')).split()
N2 = {'20': 'twenty', '35': 'thirty five', '60s': 'sixties', '15': 'fifteen', '000': 'thousand'}
for sid, t0 in F['vo'].items():
    t1 = F['vo_end'][sid] + .3; wav = f'/tmp/_seq{sid}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t0 - .3), '-to', str(t1), '-i', mp4, '-ac', '1', '-ar', '16000', wav], check=True)
    segs, _ = m.transcribe(wav, language='en', beam_size=5, initial_prompt="Cattelan, Comedian, Sotheby's, Duchamp, Guernica, Warhol, Garau, Io Sono")
    heard = ' '.join(s.text for s in segs)
    h = [N2.get(w, w) for w in norm(heard)]; h = ' '.join(h).replace('art world', 'artworld').replace('stock room', 'stockroom').split()
    r = difflib.SequenceMatcher(None, norm(SCRIPT[sid]), h).ratio()
    print(f'seq {sid}: similarity {r:.3f}  | {heard.strip()[:110]}')
print('FORMAT OK' if ok else 'FORMAT MISMATCH')
