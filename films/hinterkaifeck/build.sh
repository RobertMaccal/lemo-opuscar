#!/bin/sh
# Rebuild the film from the library root:  sh films/hinterkaifeck/build.sh
set -e
D=films/hinterkaifeck
.venv/bin/python $D/audio/prep_vo.py
.venv/bin/python $D/audio/mix.py
ffmpeg -v error -y -i $D/audio/mix.wav -af "alimiter=limit=0.5:attack=1:release=60:level=false" -c:a pcm_f32le $D/audio/mix_lim.wav
node core/render/video.mjs $D --fps 30 --workers 3 --size 1080x1920 --out $D/out/picture.mp4
LEMO_COLOR=bt709 sh core/render/mux.sh $D/out/picture.mp4 $D/audio/mix_lim.wav $D/out/the-footprints.mp4 30 2
# lighter copy (< 100 MB) for sharing / the repo
ffmpeg -v error -y -i $D/out/the-footprints.mp4 -c:v libx264 -preset slow -crf 19 -maxrate 7M -bufsize 14M -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -c:a copy $D/out/the-footprints-share.mp4
