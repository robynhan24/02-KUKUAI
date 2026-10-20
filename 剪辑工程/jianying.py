"""生成（或更新）剪映工程：剪映工程/库库AI_剪映草稿/  —— 精细分层版（阿亮 10-20）
按网页时间线，把每个素材拆成剪映里独立的片段：
  主画面      真人全屏（口播视频，带位置/缩放关键帧）、录屏场景的背景图、动画片段（导航卡、logo 等网页里做的动画）
  手机虚化底  手机录屏下面那层：同一画面放大虚化
  手机压暗    压暗 + 柔光（PNG）
  录屏        录屏 / 截图原素材（圆角矩形蒙版、位置、缩放；从右侧滑入的关键帧）
  虚化压暗    放大重点时垫在下面的虚化压暗版录屏（不透明度关键帧淡入）
  放大        同一录屏再放一份，用矩形蒙版只露出重点区域，缩放+位置关键帧放大到画面中间
  标注        放大框的橙色描边、涂黄、虚线框（透明 PNG，一个标注一段）、结尾黑场
  手机外框    手机机身外框（透明 PNG）
  小圆窗      口播视频 + 圆形蒙版（蒙版大小、位置可以在剪映里直接调）
  小圆窗边框  紫色圆环（透明 PNG）
  字幕 / 人声 / 配乐 / 音效
用法：python3 剪辑工程/jianying.py          （每加一段或改了时间线后重跑；动画片段有缓存，没改的不重渲）
依赖：pyJianYingDraft（git clone https://github.com/GuanYixuan/pyJianYingDraft 到 /tmp/claude-0/lib/），playwright，ffmpeg。
"""
import os, sys, json, shutil, subprocess, threading, http.server, socketserver, functools, uuid, types, base64, hashlib

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRAFT_NAME = '库库AI_剪映草稿'
PROJ_DIR = os.environ.get('JY_DIR') or os.path.join(root, '剪映工程')   # 测试时可以指到别的文件夹
DRAFT = os.path.join(PROJ_DIR, DRAFT_NAME)
MAT = os.path.join(DRAFT, '素材')
PLACEHOLDER = '##_draftpath_placeholder_0E685133-18CE-45ED-8CB8-2904A212EC80_##'
FPS = 30

# ---------- pyJianYingDraft（没有 pymediainfo 时用 ffprobe 顶上） ----------
sys.path.insert(0, '/tmp/claude-0/lib/pyJianYingDraft')
try:
    import pymediainfo  # noqa
except ImportError:
    def _probe(path):
        j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path], capture_output=True, text=True).stdout)
        dur = float(j.get('format', {}).get('duration', 0) or 0) * 1000
        vt, at, it = [], [], []
        for s in j.get('streams', []):
            o = types.SimpleNamespace(duration=float(s.get('duration', 0) or 0) * 1000 or dur, width=s.get('width'), height=s.get('height'))
            if s['codec_type'] == 'video':
                (it if path.lower().endswith(('.jpg', '.jpeg', '.png')) else vt).append(o)
            elif s['codec_type'] == 'audio': at.append(o)
        return types.SimpleNamespace(video_tracks=vt, audio_tracks=at, image_tracks=it, general_tracks=[types.SimpleNamespace(duration=dur)])
    m = types.ModuleType('pymediainfo')
    m.MediaInfo = types.SimpleNamespace(can_parse=lambda: True, parse=lambda path, **k: _probe(path))
    sys.modules['pymediainfo'] = m
import pyJianYingDraft as draft
from pyJianYingDraft import trange, KeyframeProperty as KP, MaskType

US = 1_000_000
us = lambda s: int(round(s * US))
TX = lambda cx: (cx - 960) / 960          # 画面像素 → 剪映位置（半个画布宽为 1，右为正）
TY = lambda cy: (540 - cy) / 540          # 上为正

# ---------- 素材文件夹（保留动画缓存，其余重建） ----------
os.makedirs(MAT, exist_ok=True)
CACHE_F = os.path.join(MAT, '.动画缓存.json')
cache = json.load(open(CACHE_F)) if os.path.exists(CACHE_F) else {}
for f in os.listdir(MAT):
    if not f.startswith('动画_') and not f.startswith('.'): os.remove(os.path.join(MAT, f))

# ---------- 打开网页时间线 ----------
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except Exception: pass
    def send_head(self):
        rng = self.headers.get('Range'); path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path): return super().send_head()
        size = os.path.getsize(path); a, _, b = rng.replace('bytes=', '').partition('-')
        a = int(a or 0); b = min(int(b) if b else size - 1, size - 1)
        f = open(path, 'rb'); f.seek(a); self._left = b - a + 1
        self.send_response(206); self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {a}-{b}/{size}'); self.send_header('Content-Length', str(self._left))
        self.send_header('Accept-Ranges', 'bytes'); self.end_headers(); return f
    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None: return super().copyfile(src, dst)
        while left > 0:
            buf = src.read(min(65536, left))
            if not buf: break
            dst.write(buf); left -= len(buf)
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

from playwright.sync_api import sync_playwright
pw = sync_playwright().start()
browser = pw.chromium.launch(); pg = browser.new_page(viewport={'width': 1280, 'height': 800})
pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_function('window.KE && window.KE.ready', timeout=30000); pg.evaluate('KE.ready')
pg.add_script_tag(path=os.path.join(root, '剪辑工程', 'jy_probe.js'))
PR = pg.evaluate('JY_PROBE()')
P = pg.evaluate("""() => ({
  dur: PROJECT.duration, sections: PROJECT.sections, subs: PROJECT.SUBS,
  audio: PROJECT.audio.map(a => ({asset: a.asset, at: a.at, from: a.from || 0, dur: a.dur, gain: a.gain == null ? 1 : a.gain,
                                  fadeIn: a.fadeIn || 0, fadeOut: a.fadeOut || 0, env: a.env || null})),
  files: Object.fromEntries(Object.entries(PROJECT.assets).map(([k, v]) => [k, typeof v.src === 'string' ? v.src : v.src.mp4])),
  drawSrc: PROJECT.scenes.map(s => s.draw.toString()),
})""")

def save_png(data_url, name):
    p = os.path.join(MAT, name); open(p, 'wb').write(base64.b64decode(data_url.split(',', 1)[1])); return p
overlay_n = [0]
def overlay(spec, label):
    overlay_n[0] += 1
    return save_png(pg.evaluate('s => JY_OVERLAY(s)', spec), f'标注_{overlay_n[0]:03d}_{label}.png')

# ---------- 素材：复制录屏/截图/口播，生成虚化版 ----------
NAMES = {'anchor': '口播_阿亮', 'c08': '录屏_3D课件交互', 'c08c': '录屏_3D课件_拖锚点滑块', 'c01': '录屏_点文献检索', 'c03e': '录屏_召唤教学设计专家',
         'c03s': '录屏_报告快速翻页', 'c04a': '录屏_选仿真技能', 'c05a': '录屏_沉淀技能', 'c05b': '录屏_一键复用技能', 'c06r': '录屏_打开远程权限',
         'c07a': '录屏_手机输入指令', 'c07b': '录屏_手机PPT完成与预览', 'ref': '截图_报告参考文献', 'prompt': '截图_文献检索指令', 'cite': '截图_引用弹窗',
         'sortp': '截图_梳理指令', 'sort0': '截图_梳理结果', 'lit4': '截图_研究缺口', 'rp_prompt': '截图_生成报告指令', 'rp_refs': '截图_报告参考文献分级',
         'k_file': '截图_课件文件', 'c08still': '截图_3D课件', 'rp_h1': '截图_报告正文', 'k_home': '截图_库库首页'}
mats = {}
def material(key, blur=False):
    k2 = key + ('_虚化' if blur else '')
    if k2 in mats: return mats[k2]
    src = os.path.join(root, P['files'][key]); ext = os.path.splitext(src)[1]
    dst = os.path.join(MAT, NAMES.get(key, key) + ('_虚化' if blur else '') + ext)
    if not blur: shutil.copy(src, dst)
    else:
        vf = 'scale=iw/4:-2,boxblur=12:2,scale=iw*4:-2,eq=brightness=-0.22'
        if ext == '.mp4': subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-pix_fmt', 'yuv420p', dst], check=True)
        else: subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-q:v', '4', dst], check=True)
    mats[k2] = draft.VideoMaterial(dst); return mats[k2]
fit = lambda m: min(1920 / m.width, 1080 / m.height)

# ---------- 收集所有片段（先收集，再分配轨道） ----------
LAYERS = ['主画面', '手机虚化底', '手机压暗', '录屏', '虚化压暗', '放大', '标注', '手机外框', '小圆窗', '小圆窗边框']
items = []   # (layer, t0, t1, make)  make() → VideoSegment
def add(layer, t0, t1, make):
    if t1 - t0 > 1 / FPS / 2: items.append((layer, t0, t1, make))

def video_seg(m, t0, t1, src0=0.0, speed=1.0, cs=None):
    dur = t1 - t0
    if m.material_type == 'photo': src = trange(0, us(dur))
    else:
        sd = min(dur * speed, m.duration / US - max(0, src0) - 1e-3); src = trange(us(max(0, src0)), us(sd))
    return draft.VideoSegment(m, trange(us(t0), us(dur)), source_timerange=src, clip_settings=cs or draft.ClipSettings())

def png_seg(path, t0, t1, alpha_in=0.0):
    seg = draft.VideoSegment(draft.VideoMaterial(path), trange(us(t0), us(t1 - t0)))
    if alpha_in: seg.add_keyframe(KP.alpha, 0, 0.0); seg.add_keyframe(KP.alpha, us(alpha_in), 1.0)
    return seg

def place(m, cx, cy, px_per_mat, alpha=1.0):
    s = px_per_mat / fit(m)
    return draft.ClipSettings(alpha=alpha, scale_x=s, scale_y=s, transform_x=TX(cx), transform_y=TY(cy))

pngs = {}
def once(key, spec, label):
    if key not in pngs: pngs[key] = overlay(spec, label)
    return pngs[key]

# --- 1) 场景
used_gfx = set()
for sc in PR['scenes']:
    i, t0, t1, kind = sc['i'], sc['t0'], sc['t1'], sc['kind']
    if kind == 'anchor':
        m = material('anchor')
        for p in sc['pieces']:
            def mk(p=p, m=m):
                k0 = p['keys'][0]
                seg = video_seg(m, p['t0'], p['t1'], p['v0'], 1.0, place(m, k0['x'], k0['y'], k0['k']))
                if len(p['keys']) > 1:   # 慢慢推近
                    for kf in p['keys']:
                        off = us(min(kf['t'], p['t1'] - p['t0']))
                        seg.add_keyframe(KP.uniform_scale, off, kf['k'] / fit(m))
                        seg.add_keyframe(KP.position_x, off, TX(kf['x'])); seg.add_keyframe(KP.position_y, off, TY(kf['y']))
                return seg
            add('主画面', p['t0'], p['t1'], mk)
        if sc['fadeOut']:
            bp = once('black', {'kind': 'black'}, '结尾黑场'); a = t1 - sc['fadeOut']
            add('标注', a, t1, lambda a=a, t1=t1, bp=bp: png_seg(bp, a, t1, alpha_in=t1 - a))
    elif kind == 'gfx':
        key = hashlib.md5((P['drawSrc'][i] + f'{t0:.3f},{t1:.3f}').encode()).hexdigest()[:12]
        name = f'动画_{i:02d}_{t0:06.2f}s.mp4'; path = os.path.join(MAT, name); used_gfx.add(name)
        if cache.get(name) != key or not os.path.exists(path):
            nf = max(1, int(round((t1 - t0) * FPS)))
            ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                                   '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path], stdin=subprocess.PIPE)
            pg.evaluate('KDraw.noPip = true; KE.noOverlay = true')
            for f in range(nf):
                pg.evaluate(f'KE.seek({t0 + f / FPS + 1e-4})')
                ff.stdin.write(base64.b64decode(pg.evaluate("KE.canvas.toDataURL('image/jpeg', .93)").split(',', 1)[1]))
            ff.stdin.close(); ff.wait(); pg.evaluate('KDraw.noPip = false; KE.noOverlay = false')
            cache[name] = key; json.dump(cache, open(CACHE_F, 'w'), ensure_ascii=False)
            print(f'  渲染动画 {name}（{nf} 帧）', flush=True)
        add('主画面', t0, t1, lambda path=path, t0=t0, t1=t1: video_seg(draft.VideoMaterial(path), t0, t1))
    else:   # rec
        bg = save_png(pg.evaluate(f'JY_BG({i})'), f'背景_{i:02d}.jpg')
        add('主画面', t0, t1, lambda bg=bg, t0=t0, t1=t1: png_seg(bg, t0, t1))
        for pi, p in enumerate(sc['pieces']):
            key, g, iw = p['n'], p['geom'], p['iw']
            m = material(key); kpx = g['k'] * iw / m.width              # 画面像素 / 素材像素
            cx, cy = g['x'] + g['w'] / 2, g['y'] + g['h'] / 2
            speed = 1.0 if abs((p.get('speed') or 1) - 1) < .04 else p['speed']
            src0 = p.get('s0') or 0.0
            rc = g['r'] / (min(g['w'], g['h']) / 2) * 100
            slide = pi == 0 and not sc['noIn'] and not p['phone']
            def mk_main(m=m, p=p, cx=cx, cy=cy, kpx=kpx, src0=src0, speed=speed, rc=rc, slide=slide):
                seg = video_seg(m, p['t0'], p['t1'], src0, speed, place(m, cx, cy, kpx))
                seg.add_mask(MaskType.矩形, size=1.0, rect_width=1.0, round_corner=rc)
                if slide:   # 从右侧滑入
                    seg.add_keyframe(KP.position_x, 0, TX(cx + 1100)); seg.add_keyframe(KP.position_x, us(.32), TX(cx))
                return seg
            add('录屏', p['t0'], p['t1'], mk_main)
            if p['phone']:   # 手机：虚化铺底 + 压暗柔光 + 外框
                shade = once('shade', {'kind': 'phoneShade'}, '手机压暗柔光')
                frame = once('frame' + json.dumps(g, sort_keys=True), {'kind': 'phoneFrame', 'g': g}, '手机外框')
                mb = material(key, blur=True)
                add('手机虚化底', p['t0'], p['t1'], lambda mb=mb, p=p, src0=src0, speed=speed:
                    video_seg(mb, p['t0'], p['t1'], src0, speed, place(mb, 960, 540, max(1920 / mb.width, 1080 / mb.height) * 1.05, alpha=.6)))
                add('手机压暗', p['t0'], p['t1'], lambda p=p, shade=shade: png_seg(shade, p['t0'], p['t1']))
                add('手机外框', p['t0'], p['t1'], lambda p=p, frame=frame: png_seg(frame, p['t0'], p['t1']))
            # 放大重点
            for run in [r for r in p['runs'] if r['b'] - r['a'] > .1]:
                a, b, r, T = run['a'], run['b'], run['r'], run['target']
                animate = abs(a - run['item']['at']) < .06
                ra = [v * m.width / iw for v in r]                        # 区域换成素材像素
                rcx, rcy, rw, rh = (ra[0] + ra[2]) / 2, (ra[1] + ra[3]) / 2, ra[2] - ra[0], ra[3] - ra[1]
                spx = T['s'] * iw / m.width
                ex, ey = T['x'] + T['w'] / 2 - (rcx - m.width / 2) * spx, T['y'] + T['h'] / 2 - (rcy - m.height / 2) * spx
                o_src = src0 + (a - p['t0']) * speed
                mb = material(key, blur=True)
                def mk_blur(mb=mb, a=a, b=b, o_src=o_src, speed=speed, cx=cx, cy=cy, kpx=kpx, rc=rc, animate=animate, mw=m.width):
                    seg = video_seg(mb, a, b, o_src, speed, place(mb, cx, cy, kpx * mw / mb.width))
                    seg.add_mask(MaskType.矩形, size=1.0, rect_width=1.0, round_corner=rc)
                    if animate: seg.add_keyframe(KP.alpha, 0, 0.0); seg.add_keyframe(KP.alpha, us(.4), 1.0)
                    return seg
                add('虚化压暗', a, b, mk_blur)
                def mk_zoom(m=m, a=a, b=b, o_src=o_src, speed=speed, cx=cx, cy=cy, kpx=kpx, ex=ex, ey=ey, spx=spx, rcx=rcx, rcy=rcy, rw=rw, rh=rh, animate=animate):
                    seg = video_seg(m, a, b, o_src, speed, place(m, ex, ey, spx))
                    seg.add_mask(MaskType.矩形, center_x=rcx - m.width / 2, center_y=m.height / 2 - rcy, size=rh / m.height, rect_width=rw / m.width, round_corner=6)
                    if animate:   # 从原位置放大到画面中间
                        for off, (px, py, s_) in ((0, (cx, cy, kpx)), (us(.4), (ex, ey, spx))):
                            seg.add_keyframe(KP.uniform_scale, off, s_ / fit(m)); seg.add_keyframe(KP.position_x, off, TX(px)); seg.add_keyframe(KP.position_y, off, TY(py))
                    return seg
                add('放大', a, b, mk_zoom)
                bp = once('border' + json.dumps(T, sort_keys=True), {'kind': 'border', 'g': T}, '放大描边')
                ba = a + (.4 if animate else 0)
                add('标注', ba, b, lambda bp=bp, ba=ba, b=b: png_seg(bp, ba, b))
                for mk_ in run['marks']:
                    spec = {'kind': 'marks', 'x': T['x'], 'y': T['y'], 'k': T['s'], 'src': [r[0], r[1]], 'marks': [mk_]}
                    mp = once(json.dumps(spec, sort_keys=True), spec, '涂黄' if mk_['kind'] == 'hl' else '虚线框')
                    ma = max(mk_['at'], ba)
                    add('标注', ma, b, lambda mp=mp, ma=ma, b=b: png_seg(mp, ma, b, alpha_in=.15))

# --- 2) 小圆窗（口播 + 圆形蒙版）+ 紫色圆环
PIP = PR['PIP']; AW, AH = PR['anchorSize']
for p in PR['pip']:
    m = material('anchor')
    def mk_pip(p=p, m=m):
        S = p['S'] * m.height / AH; s_px = PIP['d'] / S                 # 画面像素 / 素材像素
        ccx, ccy = p['cx'] * m.width / AW, p['cy'] * m.height / AH
        cs = place(m, PIP['x'] - (ccx - m.width / 2) * s_px, PIP['y'] - (ccy - m.height / 2) * s_px, s_px)
        seg = video_seg(m, p['t0'], p['t1'], p['v0'], 1.0, cs)
        seg.add_mask(MaskType.圆形, center_x=ccx - m.width / 2, center_y=m.height / 2 - ccy, size=S / m.height)
        return seg
    add('小圆窗', p['t0'], p['t1'], mk_pip)
    ring = once('ring', {'kind': 'ring'}, '小圆窗紫色圆环')
    add('小圆窗边框', p['t0'], p['t1'], lambda p=p, ring=ring: png_seg(ring, p['t0'], p['t1']))

browser.close(); pw.stop()

# ---------- 分配轨道（同一层里时间重叠的分到第 2、3… 条） ----------
lanes = {L: [] for L in LAYERS}
placed = []
for L in LAYERS:
    for it in sorted([x for x in items if x[0] == L], key=lambda x: x[1]):
        ends = lanes[L]
        for li, e in enumerate(ends):
            if it[1] >= e - 1e-4: ends[li] = it[2]; placed.append((L, li, it)); break
        else: ends.append(it[2]); placed.append((L, len(ends) - 1, it))
tname = lambda L, li: L if li == 0 else f'{L}{li + 1}'

# ---------- 生成草稿 ----------
folder = draft.DraftFolder(PROJ_DIR)
tmp = os.path.join(PROJ_DIR, '.素材_tmp'); shutil.rmtree(tmp, ignore_errors=True); shutil.move(MAT, tmp)
script = folder.create_draft(DRAFT_NAME, 1920, 1080, FPS, allow_replace=True, maintrack_adsorb=False)
shutil.move(tmp, MAT)

NICE = {'voice': '人声.mp3', 'music': '配乐1_开头.mp3', 'music2': '配乐2_查文献.mp3', 'music3': '配乐3_出报告.mp3', 'music4': '配乐4_做课件.mp3', 'music5': '配乐5_结尾.mp3'}
def aud_path(asset):
    name = NICE.get(asset) or ('音效_' + asset + '.mp3')
    dst = os.path.join(MAT, name)
    if not os.path.exists(dst): shutil.copy(os.path.join(root, P['files'][asset]), dst)
    return dst
def assign(clips):
    ends = []
    for c in sorted(clips, key=lambda c: c['at']):
        d = c['dur'] if c['dur'] else draft.AudioMaterial(aud_path(c['asset'])).duration / US
        c['_d'] = min(d, P['dur'] - c['at'])
        for li, e in enumerate(ends):
            if c['at'] >= e + 0.001: ends[li] = c['at'] + c['_d']; c['_lane'] = li; break
        else: ends.append(c['at'] + c['_d']); c['_lane'] = len(ends) - 1
    return len(ends)
music = [a for a in P['audio'] if a['asset'].startswith('music')]
sfx = [a for a in P['audio'] if a['asset'] != 'voice' and not a['asset'].startswith('music')]
n_music, n_sfx = assign(music), assign(sfx)
for c in music: c['_track'] = f'配乐{c["_lane"] + 1}'
for c in sfx: c['_track'] = f'音效{c["_lane"] + 1}'

specs = []
for L in LAYERS:
    specs += [draft.TrackSpec(draft.TrackType.video, tname(L, li)) for li in range(len(lanes[L]))]
specs += [draft.TrackSpec(draft.TrackType.text, '字幕'), draft.TrackSpec(draft.TrackType.audio, '人声')]
specs += [draft.TrackSpec(draft.TrackType.audio, f'配乐{i + 1}') for i in range(n_music)]
specs += [draft.TrackSpec(draft.TrackType.audio, f'音效{i + 1}') for i in range(n_sfx)]
script.append_tracks(specs)

for L, li, (_, t0, t1, make) in placed:
    script.add_segment(make(), tname(L, li))

for a, b2, text in P['subs']:
    script.add_segment(draft.TextSegment(
        text, trange(us(a), us(b2 - a)),
        style=draft.TextStyle(size=9.0, bold=True, color=(1.0, 1.0, 1.0), align=1),
        background=draft.TextBackground(color='#000000', alpha=0.62, round_radius=0.25, height=0.18, width=0.12),
        clip_settings=draft.ClipSettings(transform_y=-0.852)), '字幕')

for c in P['audio']:
    asset = c['asset']; path = aud_path(asset)
    if asset == 'voice': track = '人声'; d = c['dur']
    else: track = c['_track']; d = c['_d']
    if d is None or d <= 0.02: continue
    seg = draft.AudioSegment(path, trange(us(c['at']), us(d)), source_timerange=trange(us(c['from']), us(d)), volume=min(c['gain'], 2.0))
    if c['fadeIn'] >= .05 or c['fadeOut'] >= .05: seg.add_fade(us(c['fadeIn']), us(c['fadeOut']))
    if c['env']:
        for et, g in c['env']:
            off = et - c['at']
            if 0 <= off <= d: seg.add_keyframe(us(off), max(0.0, g * c['gain']))
    script.add_segment(seg, track)

script.save()

# ---------- 素材路径改成「草稿文件夹」占位符；草稿信息 ----------
cp = os.path.join(DRAFT, 'draft_content.json'); s = open(cp, encoding='utf-8').read()
s = s.replace(json.dumps(DRAFT)[1:-1], PLACEHOLDER).replace(DRAFT, PLACEHOLDER)
open(cp, 'w', encoding='utf-8').write(s)
mp = os.path.join(DRAFT, 'draft_meta_info.json'); meta = json.load(open(mp, encoding='utf-8'))
meta.update(draft_name=DRAFT_NAME, draft_id=str(uuid.uuid5(uuid.NAMESPACE_URL, 'kukuai-jianying')).upper(), tm_duration=us(P['dur']))
json.dump(meta, open(mp, 'w', encoding='utf-8'), ensure_ascii=False)
for f in os.listdir(MAT):     # 不再用到的旧动画
    if f.startswith('动画_') and f not in used_gfx: os.remove(os.path.join(MAT, f)); cache.pop(f, None)
json.dump(cache, open(CACHE_F, 'w'), ensure_ascii=False)
from collections import Counter
cnt = Counter(L for L, _, _ in placed)
print(f'剪映工程已更新：{DRAFT}\n  总长 {P["dur"]:.2f} 秒；' + '，'.join(f'{L} {n} 段' for L, n in cnt.items()) + f'；字幕 {len(P["subs"])} 句；配乐 {n_music} 轨，音效 {n_sfx} 轨')
