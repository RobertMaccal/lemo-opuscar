#!/bin/sh
# Resumable render: 16 s chunks (480 frames); finished chunks are kept across restarts. Run from the library root.
D=films/brides; O=$D/out/chunks; mkdir -p $O
for k in 0 1 2 3 4 5; do
  a=$((k * 16)); b=$(( (k + 1) * 16 )); [ $k -eq 5 ] && b=94.6
  f=$O/c$k.mp4
  if [ -s $f ] && [ ! -f $f.lock ]; then echo "chunk $k done"; continue; fi
  rm -f $f $f.lock; rm -rf $O/.c${k}_segs-*
  node core/render/video.mjs $D --fps 30 --workers 3 --size 1080x1920 --q "from=$a&to=$b" --out $f || exit 1
  echo "chunk $k rendered"
done
ls $O/c*.mp4 | sed 's#.*/#file #' > $O/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $O/list.txt -c copy $D/out/picture.mp4 && echo CONCAT_OK
