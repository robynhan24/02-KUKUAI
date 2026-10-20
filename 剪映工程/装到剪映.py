"""把「库库AI_剪映草稿」装进本机剪映的草稿文件夹，并把素材路径改成本机的绝对路径。
用法（Windows / Mac 都行，只需要装了 Python 3，不用装别的库）：
    python 装到剪映.py                       # 自动找剪映草稿文件夹
    python 装到剪映.py "D:/剪映草稿"          # 或者手动指定（剪映 → 全局设置 → 草稿位置）
装好后重启剪映（或进出一次任意草稿），首页就能看到「库库AI_剪映草稿」。
每次仓库里的剪映工程更新后，git pull 再运行一次即可（会覆盖旧的同名草稿，剪映里手动改过的内容请先另存）。"""
import os, sys, json, shutil, platform

NAME = '库库AI_剪映草稿'
PLACEHOLDER = '##_draftpath_placeholder_0E685133-18CE-45ED-8CB8-2904A212EC80_##'
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, NAME)

def default_root():
    home = os.path.expanduser('~')
    cands = []
    if platform.system() == 'Windows':
        la = os.environ.get('LOCALAPPDATA', os.path.join(home, 'AppData', 'Local'))
        cands.append(os.path.join(la, 'JianyingPro', 'User Data', 'Projects', 'com.lveditor.draft'))
    else:
        cands.append(os.path.join(home, 'Movies', 'JianyingPro', 'User Data', 'Projects', 'com.lveditor.draft'))
        cands.append(os.path.join(home, 'Movies', 'JianyingPro Drafts'))
    for c in cands:
        if os.path.isdir(c): return c
    return None

dst_root = sys.argv[1] if len(sys.argv) > 1 else default_root()
if not dst_root or not os.path.isdir(dst_root):
    sys.exit('没找到剪映草稿文件夹。请在剪映「全局设置 → 草稿位置」里查到路径，然后运行：python 装到剪映.py "那个路径"')
dst_root = os.path.abspath(dst_root)
dst = os.path.join(dst_root, NAME)
if os.path.exists(dst): shutil.rmtree(dst)
shutil.copytree(src, dst)
real = dst.replace('\\', '/')
p = os.path.join(dst, 'draft_content.json')
s = open(p, encoding='utf-8').read().replace(PLACEHOLDER, real)
open(p, 'w', encoding='utf-8').write(s)
m = os.path.join(dst, 'draft_meta_info.json'); meta = json.load(open(m, encoding='utf-8'))
meta.update(draft_fold_path=real, draft_root_path=dst_root.replace('\\', '/'), draft_name=NAME)
json.dump(meta, open(m, 'w', encoding='utf-8'), ensure_ascii=False)
print('已装到：', dst, '\n重启剪映后在首页草稿里打开「%s」。' % NAME)
