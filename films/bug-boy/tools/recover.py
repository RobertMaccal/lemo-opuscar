"""Rescue the frames of an unfinished x264 .mp4 (killed before the moov box was written).
usage: python tools/recover.py <broken.mp4> <start_frame> <out_dir> [--drop 8]
Reads the length-prefixed H.264 NAL units from mdat, prepends SPS/PPS from a reference encode with the same settings,
and writes <out_dir>/<start>_<end>.mp4 holding exactly the decodable frames (minus a safety tail)."""
import struct, subprocess, sys, os, tempfile
src, start, outd = sys.argv[1], int(sys.argv[2]), sys.argv[3]
drop = int(sys.argv[sys.argv.index('--drop') + 1]) if '--drop' in sys.argv else 8
tmp = tempfile.mkdtemp(dir=outd)
ref = os.path.join(tmp, 'ref.mp4')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=1080x1920:rate=30', '-frames:v', '5', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', ref], check=True)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', ref, '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', ref + '.h264'], check=True)
b = open(ref + '.h264', 'rb').read(); idx = [j for j in range(len(b) - 3) if b[j:j + 3] == b'\x00\x00\x01']
hdr = b''.join(b'\x00\x00\x00\x01' + b[j + 3:(idx[k + 1] if k + 1 < len(idx) else len(b))].rstrip(b'\x00') for k, j in enumerate(idx) if b[j + 3] & 31 in (7, 8))
d = open(src, 'rb').read(); p = d.find(b'mdat') - 4; sz = struct.unpack('>I', d[p:p + 4])[0]; q = p + (16 if sz == 1 else 8)
out = [hdr]
while q + 4 <= len(d):
    L = struct.unpack('>I', d[q:q + 4])[0]
    if L <= 0 or q + 4 + L > len(d): break
    out.append(b'\x00\x00\x00\x01' + d[q + 4:q + 4 + L]); q += 4 + L
raw = os.path.join(tmp, 'raw.h264'); open(raw, 'wb').write(b''.join(out))
mp = os.path.join(tmp, 'raw.mp4'); subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-r', '30', '-i', raw, '-c', 'copy', mp], check=True)
n = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', mp], capture_output=True, text=True).stdout.strip() or 0)
keep = max(0, n - drop)
if keep > 0:
    dst = os.path.join(outd, f'{start:05d}_{start + keep:05d}.mp4')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', mp, '-vf', f'trim=end_frame={keep},setpts=PTS-STARTPTS', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', dst + '.part.mp4'], check=True)
    os.replace(dst + '.part.mp4', dst)
print(src, 'decodable', n, 'kept', keep, 'from frame', start)
subprocess.run(['rm', '-rf', tmp])
