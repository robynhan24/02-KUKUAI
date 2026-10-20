"""生成（或更新）剪映工程：剪映工程/库库AI_剪映草稿/
每次加了新的段落，先渲染新段落的画面，再重跑这个脚本，整个剪映工程会按网页时间线重新生成：
    python3 剪辑工程/render.py 4          # 只渲染新加的第 4 段画面（改过的段落也要重渲）
    python3 剪辑工程/jianying.py          # 重新生成剪映草稿（全部段落）

剪映里的轨道（从下到上）：
  画面    每个镜头一段（网页合成好的画面，不带字幕），可以单独剪、换顺序、加转场
  字幕    每句一段文字，可以直接改字、改样式
  人声    口播，按剪辑表切好的片段
  配乐    每段一首，带音量关键帧（说话时压低、停顿处抬起）
  音效1…  转场、重击、弹出等音效
依赖：pyJianYingDraft（git clone https://github.com/GuanYixuan/pyJianYingDraft 到 /tmp/claude-0/lib/），playwright。
"""
import os, sys, json, shutil, subprocess, threading, http.server, socketserver, functools, uuid, types

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRAFT_NAME = '库库AI_剪映草稿'
PROJ_DIR = os.environ.get('JY_DIR') or os.path.join(root, '剪映工程')   # 测试时可以指到别的文件夹
DRAFT = os.path.join(PROJ_DIR, DRAFT_NAME)
MAT = os.path.join(DRAFT, '素材')
A = os.path.join(root, '剪辑工程', 'assets')
# 剪映用这个占位符表示「草稿所在文件夹」，草稿整个文件夹拷到哪里都能找到素材
PLACEHOLDER = '##_draftpath_placeholder_0E685133-18CE-45ED-8CB8-2904A212EC80_##'

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
                (it if s.get('codec_name') in ('mjpeg', 'png') and dur < 1 else vt).append(o)
            elif s['codec_type'] == 'audio': at.append(o)
        return types.SimpleNamespace(video_tracks=vt, audio_tracks=at, image_tracks=it, general_tracks=[types.SimpleNamespace(duration=dur)])
    m = types.ModuleType('pymediainfo')
    m.MediaInfo = types.SimpleNamespace(can_parse=lambda: True, parse=lambda path, **k: _probe(path))
    sys.modules['pymediainfo'] = m
import pyJianYingDraft as draft
from pyJianYingDraft import trange

US = 1_000_000
us = lambda s: int(round(s * US))

# ---------- 从网页时间线读数据 ----------
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_function('window.PROJECT')
    P = pg.evaluate("""() => ({
      dur: PROJECT.duration, sections: PROJECT.sections, subs: PROJECT.SUBS,
      scenes: PROJECT.scenes.map(s => [s.t0, s.t1]),
      audio: PROJECT.audio.map(a => ({asset: a.asset, at: a.at, from: a.from || 0, dur: a.dur, gain: a.gain == null ? 1 : a.gain,
                                      fadeIn: a.fadeIn || 0, fadeOut: a.fadeOut || 0, env: a.env || null})),
      files: Object.fromEntries(Object.entries(PROJECT.assets).map(([k, v]) => [k, typeof v.src === 'string' ? v.src : v.src.mp4])),
    })""")
    b.close()

# ---------- 素材拷进草稿文件夹 ----------
os.makedirs(MAT, exist_ok=True)
for f in os.listdir(MAT):            # 旧的音频素材清掉（画面视频保留，由 render.py 生成）
    if not f.startswith('画面_'): os.remove(os.path.join(MAT, f))
NICE = {'voice': '人声.mp3', 'music': '配乐1_开头.mp3', 'music2': '配乐2_查文献.mp3', 'music3': '配乐3_出报告.mp3'}
def mat_path(asset):
    name = NICE.get(asset, ('音效_' + asset.replace('sfx_', '') + '.mp3') if asset not in NICE else None)
    if asset.startswith('music') and asset not in NICE: name = f'配乐_{asset}.mp3'
    dst = os.path.join(MAT, name)
    if not os.path.exists(dst): shutil.copy(os.path.join(root, P['files'][asset]), dst)
    return dst

secs = P['sections']; ends = [s[0] for s in secs[1:]] + [P['dur']]
for i, (t0, _) in enumerate(secs):
    f = os.path.join(MAT, f'画面_第{i + 1}段.mp4')
    if not os.path.exists(f): sys.exit(f'缺少 {f}，先运行：python3 剪辑工程/render.py {i + 1}')

# ---------- 生成草稿 ----------
folder = draft.DraftFolder(PROJ_DIR)
# create_draft 会删掉同名文件夹，先把素材挪开
tmp = os.path.join(PROJ_DIR, '.素材_tmp'); shutil.rmtree(tmp, ignore_errors=True); shutil.move(MAT, tmp)
script = folder.create_draft(DRAFT_NAME, 1920, 1080, 30, allow_replace=True)
shutil.move(tmp, MAT)

# 配乐、音效：互相重叠的分到不同轨道（剪映同一轨道不能重叠）
def assign(clips):
    lanes = []
    for c in sorted(clips, key=lambda c: c['at']):
        d = c['dur'] if c['dur'] else draft.AudioMaterial(mat_path(c['asset'])).duration / US
        c['_d'] = min(d, P['dur'] - c['at'])
        for li, end in enumerate(lanes):
            if c['at'] >= end + 0.001: lanes[li] = c['at'] + c['_d']; c['_lane'] = li; break
        else: lanes.append(c['at'] + c['_d']); c['_lane'] = len(lanes) - 1
    return len(lanes)
music_clips = [a for a in P['audio'] if a['asset'].startswith('music')]
sfx_clips = [a for a in P['audio'] if a['asset'] != 'voice' and not a['asset'].startswith('music')]
n_music, n_sfx = assign(music_clips), assign(sfx_clips)
for c in music_clips: c['_track'] = f'配乐{c["_lane"] + 1}'
for c in sfx_clips: c['_track'] = f'音效{c["_lane"] + 1}'

specs = [draft.TrackSpec(draft.TrackType.video, '画面'), draft.TrackSpec(draft.TrackType.text, '字幕'),
         draft.TrackSpec(draft.TrackType.audio, '人声')]
specs += [draft.TrackSpec(draft.TrackType.audio, f'配乐{i + 1}') for i in range(n_music)]
specs += [draft.TrackSpec(draft.TrackType.audio, f'音效{i + 1}') for i in range(n_sfx)]
script.append_tracks(specs)

# 画面：每个镜头一段
vmats = {i: draft.VideoMaterial(os.path.join(MAT, f'画面_第{i + 1}段.mp4')) for i in range(len(secs))}
for t0, t1 in P['scenes']:
    i = max(j for j, s in enumerate(secs) if t0 >= s[0] - 1e-6)
    m = vmats[i]; s0 = us(t0 - secs[i][0]); d = min(us(t1 - t0), m.duration - s0)
    if d <= 0: continue
    script.add_segment(draft.VideoSegment(m, trange(us(t0), d), source_timerange=trange(s0, d)), '画面')

# 字幕
for a, b2, text in P['subs']:
    script.add_segment(draft.TextSegment(
        text, trange(us(a), us(b2 - a)),
        style=draft.TextStyle(size=9.0, bold=True, color=(1.0, 1.0, 1.0), align=1),
        background=draft.TextBackground(color='#000000', alpha=0.62, round_radius=0.25, height=0.18, width=0.12),
        clip_settings=draft.ClipSettings(transform_y=-0.852)), '字幕')

# 人声、配乐、音效
for c in P['audio']:
    asset = c['asset']; path = mat_path(asset)
    if asset == 'voice': track = '人声'; d = c['dur']
    else: track = c['_track']; d = c['_d']
    if d is None or d <= 0.02: continue
    seg = draft.AudioSegment(path, trange(us(c['at']), us(d)), source_timerange=trange(us(c['from']), us(d)), volume=min(c['gain'], 2.0))
    if c['fadeIn'] >= .05 or c['fadeOut'] >= .05: seg.add_fade(us(c['fadeIn']), us(c['fadeOut']))
    if c['env']:   # 音量关键帧：说话时压低、停顿处抬起
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
n_scene = len(P['scenes']); print(f'剪映工程已更新：{DRAFT}\n  {len(secs)} 段，{n_scene} 个镜头，{len(P["subs"])} 句字幕，配乐 {n_music} 轨，音效 {n_sfx} 轨，总长 {P["dur"]:.2f} 秒')
