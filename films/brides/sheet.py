# contact sheet: python sheet.py <dir> <out.png> [cols]
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 9
fs = sorted(glob.glob(os.path.join(d, 's*_*.jpg'))); W, H = 216, 384
rows = (len(fs) + cols - 1) // cols; im = Image.new('RGB', (cols * W, rows * (H + 22)), (20, 20, 24)); dr = ImageDraw.Draw(im)
for i, f in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * (H + 22); im.paste(Image.open(f).resize((W, H)), (x, y + 22)); dr.text((x + 4, y + 4), os.path.basename(f)[:-4], fill=(230, 230, 230))
im.save(out); print(out, im.size)
