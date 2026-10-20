"""自查剪映草稿：按草稿里的轨道、片段、蒙版、缩放/位置/不透明度关键帧，在 Python 里把某一时刻的画面拼出来。
用来对照网页预览，检查分层后的位置、大小有没有算错（不是剪映本身的渲染，只按剪映的坐标约定近似）。
用法：python3 剪辑工程/jy_preview.py 草稿文件夹 输出.jpg 时间1 时间2 ..."""
import sys, os, json, subprocess, io
import numpy as np
from PIL import Image, ImageDraw

D = sys.argv[1]; out = sys.argv[2]; times = [float(x) for x in sys.argv[3:]]
J = json.load(open(os.path.join(D, 'draft_content.json'), encoding='utf-8'))
PH = '##_draftpath_placeholder_0E685133-18CE-45ED-8CB8-2904A212EC80_##'
vids = {m['id']: m for m in J['materials']['videos']}
masks = {m['id']: m for m in J['materials'].get('masks', [])}
W, H = 1920, 1080

def frame(m, t):
    path = m['path'].replace(PH, D)
    if m['type'] == 'photo': return Image.open(path).convert('RGBA')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', path, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    return Image.open(io.BytesIO(raw)).convert('RGBA')

def kf_value(seg, prop, off, default):
    for kl in seg.get('common_keyframes', []):
        if kl['property_type'] == prop:
            ks = sorted(kl['keyframe_list'], key=lambda k: k['time_offset'])
            if off <= ks[0]['time_offset']: return ks[0]['values'][0]
            for a, b in zip(ks, ks[1:]):
                if a['time_offset'] <= off <= b['time_offset']:
                    f = (off - a['time_offset']) / max(1, b['time_offset'] - a['time_offset'])
                    return a['values'][0] + (b['values'][0] - a['values'][0]) * f
            return ks[-1]['values'][0]
    return default

def render(t):
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    tus = int(t * 1e6)
    for tr in J['tracks']:
        if tr['type'] != 'video': continue
        for seg in tr['segments']:
            st, du = seg['target_timerange']['start'], seg['target_timerange']['duration']
            if not (st <= tus < st + du): continue
            m = vids[seg['material_id']]; off = tus - st
            src_t = (seg['source_timerange']['start'] + off * seg.get('speed', 1)) / 1e6
            im = frame(m, src_t); mw, mh = im.size
            # 蒙版
            mk = next((masks[x] for x in seg.get('extra_material_refs', []) if x in masks), None)
            if mk:
                c = mk['config']; a = Image.new('L', (mw, mh), 0); d = ImageDraw.Draw(a)
                cx = mw / 2 + c['centerX'] * mw / 2; cy = mh / 2 - c['centerY'] * mh / 2
                w, h = c['width'] * mw, c['height'] * mh
                if mk['resource_type'] == 'circle': d.ellipse([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], fill=255)
                else: d.rounded_rectangle([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], radius=c.get('roundCorner', 0) * min(w, h) / 2, fill=255)
                im.putalpha(Image.fromarray(np.minimum(np.array(im.split()[3]), np.array(a))))
            cl = seg['clip']
            s = kf_value(seg, 'UNIFORM_SCALE', off, cl['scale']['x'])
            tx = kf_value(seg, 'KFTypePositionX', off, cl['transform']['x']); ty = kf_value(seg, 'KFTypePositionY', off, cl['transform']['y'])
            al = kf_value(seg, 'KFTypeAlpha', off, cl['alpha'])
            f = min(W / mw, H / mh) * s
            im = im.resize((max(1, int(mw * f)), max(1, int(mh * f))))
            if al < 1: im.putalpha(Image.fromarray((np.array(im.split()[3]) * al).astype('uint8')))
            px, py = W / 2 + tx * W / 2 - im.width / 2, H / 2 - ty * H / 2 - im.height / 2
            canvas.alpha_composite(im, (int(round(px)), int(round(py)))) if 0 else canvas.paste(im, (int(round(px)), int(round(py))), im)
    return canvas.convert('RGB')

ims = [render(t) for t in times]
cols = 3; w = 640; h = 360
sheet = Image.new('RGB', (cols * w, ((len(ims) + cols - 1) // cols) * (h + 24)), '#222'); d = ImageDraw.Draw(sheet)
for i, (t, im) in enumerate(zip(times, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 24)
    sheet.paste(im.resize((w, h)), (x, y + 24)); d.text((x + 6, y + 4), f'{t:.2f}s', fill='yellow')
sheet.save(out, quality=85); print(out)
