#!/usr/bin/env bash
# 把原素材转成网页能直接播放的小文件（本期前 30 秒用到的部分）。
# 用法：bash 剪辑工程/prep_assets.sh   （在仓库根目录运行；需要先跑工作台的 setup.sh）
set -e
cd "$(dirname "$0")/.."
S="库库AI-空镜素材"; O="剪辑工程/assets"; WB="${WB:-/home/claude/robynhan24/video-workbench--}"
mkdir -p "$O"
# 本期已做到口播 0–92 秒（第 1–3 段）。往后加段时把这里的 92 改大。
# 视频：每段两份。mp4(H.264) 给 Safari/手机，webm(VP9) 给 Chromium。关键帧 0.5 秒一个，方便跳转。
enc(){ # 输入 起 止 滤镜 输出名
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4" -r 30 -g 15 -c:v libx264 -preset slow -crf "${CRF:-23}" -pix_fmt yuv420p -movflags +faststart "$O/$5.mp4"
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4" -r 30 -g 15 -c:v libvpx-vp9 -b:v 0 -crf "${WCRF:-36}" -row-mt 1 -deadline good -cpu-used 4 "$O/$5.webm"
}
# 主播（低清 854×480，换高清口播后改这里）
CRF=20 WCRF=32 enc "$S/00 阿亮口播 低清.mp4" 0 92 "null" anchor
# 录屏一律用整屏画面（阿亮 10-20 要求：录屏全显，重点局部放大、背景虚化压暗）。
# 国内模型名、快捷键提示用白块盖掉（剪辑规矩第 10、12 条）。
M_DS='drawbox=x=975:y=1312:w=315:h=56:color=white@1:t=fill'          # 底部 DeepSeek-V4-Pro
M_DS_REF='drawbox=x=1265:y=1312:w=315:h=56:color=white@1:t=fill'     # 报告页（多了「教学设计专家」，模型名靠右）
M_KEY_P='drawbox=x=1995:y=1262:w=495:h=130:color=white@1:t=fill'     # 01 录屏右下快捷键提示
M_KEY_S='drawbox=x=2262:y=1262:w=253:h=133:color=white@1:t=fill'     # 02 录屏右下快捷键提示
enc "$S/08 HTML 3D交互.mp4" 0 9.5 "null" c08
enc "$S/01 查文献.mp4" 0 3.4 "drawbox=x=1990:y=1250:w=570:h=190:color=white@1:t=fill" c01
still(){ ffmpeg -v error -y -ss "$2" -i "$S/$1" -frames:v 1 -vf "$3" -q:v 3 "$O/$4.jpg"; }
still "03 生成教研报告.mp4" 15.5 "$M_DS_REF" ref
still "01 查文献.mp4" 13.5 "null" lit1
still "01 查文献.mp4" 19.5 "null" lit2
still "02 梳理文献2.mp4" 4 "$M_DS" lit3
still "02 梳理文献2.mp4" 11 "$M_DS" lit4
still "08 HTML 3D交互.mp4" 2 "null" c08still
still "01 查文献.mp4" 3.5 "$M_KEY_P" prompt
still "01 查文献.mp4" 21.0 "null" cite
still "02 梳理文献 1.mp4" 3.0 "$M_DS,$M_KEY_S" sortp
still "02 梳理文献2.mp4" 0.5 "$M_DS" sort0
# 第 3 段（② 出报告）：选「教学设计专家」、报告快速翻一遍（1.65 倍速）、指令、四个大标题、参考文献
M_DS2='drawbox=x=975:y=1312:w=600:h=56:color=white@1:t=fill'         # 选专家前后模型名位置不同，一起盖
enc "$S/03 生成教研报告.mp4" 0.4 3.0 "$M_DS2" c03e
enc "$S/03 生成教研报告.mp4" 8.5 14.7 "$M_DS2,setpts=PTS/1.65" c03s
still "03 生成教研报告.mp4" 6.0 "$M_DS2" rp_prompt
still "03 生成教研报告.mp4" 9.0 "$M_DS2" rp_h1
still "03 生成教研报告.mp4" 10.5 "$M_DS2" rp_h2
still "03 生成教研报告.mp4" 12.0 "$M_DS2" rp_h3
still "03 生成教研报告.mp4" 14.5 "$M_DS2" rp_h4
still "03 生成教研报告.mp4" 16.0 "$M_DS2" rp_refs
cp "库库AI-logo.png" "$O/logo.png"
# 口播：前 31 秒，统一响度 -16 LUFS（混上音乐后整体约 -14）
ffmpeg -v error -y -i "$S/00 阿亮口播 低清.mp4" -t 92 -vn -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 1 -c:a libmp3lame -b:a 128k "$O/voice.mp3"
# 配乐：Smart Sparks 从 8 秒起（前面是安静前奏）
ffmpeg -v error -y -ss 8 -t 34 -i "$WB/音乐库/配乐_科技解说/kissan4-smart-sparks-436614.mp3" -af "loudnorm=I=-16:TP=-1.5" -ar 44100 -c:a libmp3lame -b:a 160k "$O/music.mp3"
# 第 2 段配乐：Tech Explainer 从 26 秒起
ffmpeg -v error -y -ss 14 -t 30 -i "$WB/音乐库/配乐_科技解说/alex-morgan-corporate-marimba-explainer-video-563574.mp3" -af "loudnorm=I=-16:TP=-1.5" -ar 44100 -c:a libmp3lame -b:a 160k "$O/music3.mp3"   # 第 3 段配乐：Corporate Marimba 从 14 秒起
ffmpeg -v error -y -ss 26 -t 40 -i "$WB/音乐库/配乐_科技解说/53976329-tech-explainer-background-modern-digital-459114.mp3" -af "loudnorm=I=-16:TP=-1.5" -ar 44100 -c:a libmp3lame -b:a 160k "$O/music2.mp3"
# 音效（文件名改成英文，网页地址里好用）
sfx(){ ffmpeg -v error -y -i "$WB/音乐库/音效/$1.mp3" -ar 44100 -c:a libmp3lame -b:a 128k "$O/sfx_$2.mp3"; }
sfx "转场-Whoosh" whoosh; sfx "转场-Windy swish" swish; sfx "上升-whoosh rise" rise; sfx "重音-Thud Hit C" thud; sfx "重音-咚 重磅" dong
# 合成小音效：pop / shine / scribble（用工作台 synthfx.py）
( cd "$WB/工具代码" && python3 -I - "$OLDPWD/$O" <<'PY'
import sys; sys.path.insert(0,'.'); out=sys.argv[1]
import synthfx, numpy as np, subprocess
for k in ['pop','shine','scribble']:
    y=synthfx.make(k)
    if k=='scribble': y=np.concatenate([y,y,y])
    raw=(np.clip(y,-1,1)*32767).astype(np.int16).tobytes()
    subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar','48000','-ac','2','-i','-','-ar','44100','-c:a','libmp3lame','-b:a','128k',f'{out}/sfx_{k}.mp3'],input=raw,check=True)
PY
)
ffmpeg -v error -y -f lavfi -i anullsrc=r=22050:cl=mono -t 1 -c:a libmp3lame -b:a 32k "$O/silence.mp3"   # iPhone 静音键开着也能出声用
echo done
