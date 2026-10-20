"""检测口播视频里主播头部的位置（每秒一帧，人像分割），生成 anchor_track.js。
小圆窗和真人全屏画面用它让人物居中。换口播视频后重跑：python3 剪辑工程/track_anchor.py
需要工作台 setup.sh 下载的人像分割模型 /tmp/claude-0/seg/u2h.onnx。"""
import cv2, numpy as np, json, os, onnxruntime as ort
here = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(here, '..', '库库AI-空镜素材', '00 阿亮口播 低清.mp4')
sess = ort.InferenceSession('/tmp/claude-0/seg/u2h.onnx', providers=['CPUExecutionProvider']); inp = sess.get_inputs()[0].name
cap = cv2.VideoCapture(SRC); fps = cap.get(5); n = int(cap.get(7)); out = []
mean = np.array([0.485, 0.456, 0.406]); std = np.array([0.229, 0.224, 0.225])
for i in range(0, n, int(fps)):
    cap.set(1, i); ok, f = cap.read()
    if not ok: break
    im = cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2RGB), (320, 320)).astype(np.float32) / 255
    m = sess.run(None, {inp: ((im - mean) / std).transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
    m = cv2.resize((m - m.min()) / (m.max() - m.min() + 1e-6), (f.shape[1], f.shape[0])) > 0.5
    rows = np.where(m.any(1))[0]
    if not len(rows): continue
    top = rows[0]; cols = np.where(m[top:top + int(f.shape[0] * .23)])[1]   # 头部那一条
    out.append([i / fps, float(np.median(cols)), float(top)])
a = np.array(out); grid = np.arange(0, int(a[:, 0].max()) + 1); k = np.ones(5) / 5
sm = lambda v: np.convolve(np.pad(np.interp(grid, a[:, 0], v), 2, mode='edge'), k, 'valid')
track = [[int(round(x)), int(round(y))] for x, y in zip(sm(a[:, 1]), sm(a[:, 2]))]
open(os.path.join(here, 'anchor_track.js'), 'w').write(
    "/* 主播头部位置（00 阿亮口播 低清.mp4，854×480），每秒一个点：[头部中心 x, 头顶 y]。由 track_anchor.py 生成 */\n"
    "window.ANCHOR_TRACK = " + json.dumps(track, separators=(',', ':')) + ";\n")
print(len(track), '个点')
