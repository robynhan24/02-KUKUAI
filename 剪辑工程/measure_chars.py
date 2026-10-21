"""一行字里逐个字的左右位置（按竖向空白切开），用来让马克笔 / 框选正好落在字与字之间。
用法：python3 剪辑工程/measure_chars.py 视频 秒 y0 y1 x0 x1"""
import sys, subprocess, io
import numpy as np
from PIL import Image
src, t = sys.argv[1], float(sys.argv[2]); y0, y1, x0, x1 = map(int, sys.argv[3:7])
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
a = np.asarray(Image.open(io.BytesIO(raw)).convert('RGB')).astype(int)[y0:y1, x0:x1]
ink = (a.mean(-1) < 170).any(0)
segs, x = [], 0
while x < len(ink):
    if ink[x]:
        s = x
        while x < len(ink) and ink[x]: x += 1
        segs.append([x0 + s, x0 + x])
    x += 1
# 合并间距 ≤ 2 的（同一个字里的笔画）
m = []
for s in segs:
    if m and s[0] - m[-1][1] <= 2: m[-1][1] = s[1]
    else: m.append(s)
print(len(m)); print(' '.join(f'{a}-{b}' for a, b in m))
