"""把「10 3D空镜」的灰绿底抠掉，输出带透明的 webp 帧（网页里逐帧画）。
背景是均匀的灰绿色：按颜色比例 (r/g, b/g) 离背景多远来算透明度，暗部（黑边框）一律保留；
半透明边缘去掉背景色溢出。用法：python3 剪辑工程/key_3d.py 帧目录 输出目录"""
import sys, os, glob
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
BG = np.array([148., 158., 129.]); RG, BGR = .93, .815
files = sorted(glob.glob(os.path.join(src, '*.png')))
frames, box = [], None
for f in files:
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    g = np.maximum(im[..., 1], 1)
    d = np.hypot(im[..., 0] / g - RG, im[..., 2] / g - BGR)
    lum = im.mean(-1)
    a = np.clip((d - .035) / .05, 0, 1)
    a = np.maximum(a, np.clip((105 - lum) / 30, 0, 1))          # 暗的（黑色边框、阴影里的物体）保留
    a = np.maximum(a, np.clip((lum - 200) / 20, 0, 1))          # 很亮的（白色屏幕）保留
    # 去背景色溢出：I = a*C + (1-a)*B
    aa = np.maximum(a, 1e-3)[..., None]
    C = np.clip((im - (1 - aa) * BG) / aa, 0, 255)
    C = np.where(a[..., None] > .98, im, C)
    rgba = np.dstack([C, a * 255]).astype(np.uint8)
    ys, xs = np.where(a > .5)
    b = [xs.min(), ys.min(), xs.max(), ys.max()]
    box = b if box is None else [min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])]
    frames.append(rgba)
pad = 12
x0, y0, x1, y1 = box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad
W = 900; s = W / (x1 - x0); H = round((y1 - y0) * s)
for i, fr in enumerate(frames):
    Image.fromarray(fr[y0:y1, x0:x1]).resize((W, H), Image.LANCZOS).save(os.path.join(out, f'k3d_{i:03d}.webp'), quality=82, method=6)
print('box', box, 'size', W, H, 'frames', len(frames))
