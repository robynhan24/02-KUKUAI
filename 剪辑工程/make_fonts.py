"""把时间线里用到的字从字体里抽出来，做成很小的网页字体（.woff）。
用法：python3 剪辑工程/make_fonts.py   （改了字幕或标题后重跑）"""
import re, sys, os
from fontTools import subset
from fontTools.ttLib import TTCollection
here = os.path.dirname(os.path.abspath(__file__))
WB = os.environ.get('WB', '/home/claude/robynhan24/video-workbench--')
src = open(os.path.join(here, 'timeline.js'), encoding='utf-8').read()
chars = set(re.findall(r"'([^'\n]*)'", src)) 
text = ''.join(chars) + '0123456789？！、AIDai3 '
def make(font_path, out, idx=None):
    if font_path.endswith('.ttc'):
        f = TTCollection(font_path).fonts[idx]; tmp = out + '.ttf'; f.save(tmp); font_path = tmp
    opt = subset.Options(); opt.flavor = 'woff'; opt.layout_features = ['*']
    font = subset.load_font(font_path, opt); s = subset.Subsetter(opt); s.populate(text=text); s.subset(font)
    subset.save_font(font, out, opt)
    if font_path.endswith('.ttf') and font_path.startswith(out): os.remove(font_path)
    print(out, os.path.getsize(out))
A = os.path.join(here, 'assets')
make(os.path.join(WB, '字体/优设标题黑.ttf'), os.path.join(A, 'title.woff'))
# Noto Sans CJK Bold 里第 2 个是简体中文（SC）
ttc = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
names = [f['name'].getDebugName(1) for f in TTCollection(ttc).fonts]
make(ttc, os.path.join(A, 'sub.woff'), [i for i, n in enumerate(names) if n.endswith('SC')][0])
