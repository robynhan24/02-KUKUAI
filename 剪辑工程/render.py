"""把网页里的画面逐帧导出成视频（不带字幕、不带声音），给剪映工程用。
用法：python3 剪辑工程/render.py 段号 [段号...]      例：python3 剪辑工程/render.py 1 2 3
输出：剪映工程/库库AI_剪映草稿/素材/画面_第N段.mp4（1920×1080，30 fps）
字幕、人声、配乐、音效在剪映里是单独的轨道（见 jianying.py），方便二次修改。"""
import sys, os, io, base64, subprocess, threading, http.server, socketserver, functools, time
from playwright.sync_api import sync_playwright

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(root, '剪映工程', '库库AI_剪映草稿', '素材'); os.makedirs(OUT, exist_ok=True)
FPS = 30

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
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

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_function('window.KE && window.KE.ready', timeout=30000); pg.evaluate('KE.ready')
    pg.evaluate('KE.noOverlay = true')
    secs = pg.evaluate('PROJECT.sections'); dur = pg.evaluate('PROJECT.duration')
    for n in [int(x) for x in sys.argv[1:]]:
        t0 = secs[n - 1][0]; t1 = secs[n][0] if n < len(secs) else dur
        nf = int(round((t1 - t0) * FPS))
        if os.environ.get('FRAMES'): nf = int(os.environ['FRAMES'])   # 调试：只导出前几帧
        out = os.path.join(OUT, f'画面_第{n}段.mp4')
        ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
        st = time.time()
        for i in range(nf):
            pg.evaluate(f'KE.seek({t0 + i / FPS + 1e-4})')
            d = pg.evaluate("KE.canvas.toDataURL('image/jpeg', .93)")
            ff.stdin.write(base64.b64decode(d.split(',', 1)[1]))
            if i % 150 == 0 or os.environ.get('FRAMES'): print(f'第{n}段 {i}/{nf} 帧，{time.time() - st:.0f} 秒', flush=True)
        ff.stdin.close(); ff.wait()
        print(f'第{n}段完成：{out}（{nf} 帧，{time.time() - st:.0f} 秒）', flush=True)
    b.close()
