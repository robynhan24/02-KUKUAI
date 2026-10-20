"""自查：用 Chromium 打开网页，跳到关键时间点截图，拼成一张联系表。
用法：python3 剪辑工程/check.py [输出目录] [时间点...]
不传时间点就用 timeline.js 里的 checks。"""
import sys, os, base64, threading, http.server, socketserver, functools, io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/kk_check'
times = [float(x) for x in sys.argv[2:]]
os.makedirs(out, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    """支持 Range 请求（视频跳转需要；Python 自带的服务器不支持）"""
    def log_message(self, *a): pass
    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
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
H = functools.partial(Q, directory=root)
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1400, 'height': 900})
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    pg.goto(f'http://127.0.0.1:{port}/index.html')
    pg.wait_for_function('window.KE && window.KE.ready', timeout=20000)
    pg.evaluate('KE.ready')
    print('音频解码：', pg.evaluate('Object.keys(KE.buf).length'), '/', pg.evaluate("Object.values(PROJECT.assets).filter(a=>a.type==='audio').length"))
    print('字体：', pg.evaluate("[...document.fonts].map(f=>f.family+':'+f.status).join(', ')"))
    if not times: times = pg.evaluate('PROJECT.checks')
    shots = []
    for t in times:
        pg.evaluate(f'KE.seek({t})')
        data = pg.evaluate("KE.canvas.toDataURL('image/jpeg', .85)")
        im = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGB')
        im.save(f'{out}/t{t:05.2f}.jpg', quality=88); shots.append((t, im))
    # 播放 3 秒看有没有报错
    pg.evaluate('KE.seek(0); KE.play()'); pg.wait_for_timeout(3000)
    print('播放 3 秒后时间：', round(pg.evaluate('KE.t'), 2)); pg.evaluate('KE.pause()')
    b.close()
for l in logs: print(l)
# 联系表：4 列
cols, w = 4, 640; h = w * 9 // 16
sheet = Image.new('RGB', (cols * w, ((len(shots) + cols - 1) // cols) * (h + 30)), '#222')
d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 22)
except Exception: f = None
for i, (t, im) in enumerate(shots):
    x, y = (i % cols) * w, (i // cols) * (h + 30)
    sheet.paste(im.resize((w, h)), (x, y + 30)); d.text((x + 8, y + 2), f'{t:.2f}s', fill='yellow', font=f)
sheet.save(f'{out}/sheet.jpg', quality=85)
print('联系表：', f'{out}/sheet.jpg')
