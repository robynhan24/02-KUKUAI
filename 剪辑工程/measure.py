"""量字的位置：从原录屏取一帧，在给定范围里找出每一行字的上下边界和左右边界（深色像素），
用来给框选 / 马克笔定坐标，保证框不压字、马克笔不切半个字。
用法：python3 剪辑工程/measure.py 视频 秒 x0 y0 x1 y1 [输出图]
输出：每一行 [x0, y0, x1, y1]（原录屏像素），以及行与行之间的空隙；可选输出一张标了行框的裁剪图方便核对。"""
import sys, subprocess, io
import numpy as np
from PIL import Image, ImageDraw

src, t = sys.argv[1], float(sys.argv[2]); X0, Y0, X1, Y1 = map(int, sys.argv[3:7])
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
im = Image.open(io.BytesIO(raw)).convert('RGB'); a = np.asarray(im).astype(int)
reg = a[Y0:Y1, X0:X1]; lum = reg.mean(-1)
ink = lum < 170                       # 字（深色）
rows = ink.sum(1) > 0
lines, y = [], 0
while y < len(rows):
    if rows[y]:
        s = y
        while y < len(rows) and rows[y]: y += 1
        cols = np.where(ink[s:y].any(0))[0]
        lines.append([X0 + int(cols.min()), Y0 + s, X0 + int(cols.max()) + 1, Y0 + y])
    y += 1
# 合并很近的（同一行里的上下标、标点）
merged = []
for L in lines:
    if merged and L[1] - merged[-1][3] <= 3:
        m = merged[-1]; merged[-1] = [min(m[0], L[0]), m[1], max(m[2], L[2]), L[3]]
    else: merged.append(L)
for i, L in enumerate(merged):
    gap = (L[1] - merged[i - 1][3]) if i else None
    print(i, L, 'h', L[3] - L[1], 'gap_above', gap)
if len(sys.argv) > 7:
    d = ImageDraw.Draw(im)
    for L in merged: d.rectangle(L, outline=(255, 0, 0))
    im.crop((X0, Y0, X1, Y1)).save(sys.argv[7])
