#!/usr/bin/env bash
# 把原素材转成网页能直接播放的小文件（本期前 30 秒用到的部分）。
# 用法：bash 剪辑工程/prep_assets.sh   （在仓库根目录运行；需要先跑工作台的 setup.sh）
set -e
cd "$(dirname "$0")/.."
S="库库AI-空镜素材"; O="剪辑工程/assets"; WB="${WB:-/home/claude/robynhan24/video-workbench--}"
mkdir -p "$O"
# 视频：每段两份。mp4(H.264) 给 Safari/手机，webm(VP9) 给 Chromium。关键帧 0.5 秒一个，方便跳转。
enc(){ # 输入 起 止 滤镜 输出名
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4" -r 30 -g 15 -c:v libx264 -preset slow -crf "${CRF:-23}" -pix_fmt yuv420p -movflags +faststart "$O/$5.mp4"
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4" -r 30 -g 15 -c:v libvpx-vp9 -b:v 0 -crf "${WCRF:-36}" -row-mt 1 -deadline good -cpu-used 4 "$O/$5.webm"
}
# 主播（低清 854×480，换高清口播后改这里）
CRF=20 WCRF=32 enc "$S/00 阿亮口播 低清.mp4" 0 31 "null" anchor
# 3D 交互：只要三个模块那一行（去掉顶部说明和标签）
enc "$S/08 HTML 3D交互.mp4" 0 9.5 "crop=1992:740:0:610,scale=1992:740" c08
# 静帧：报告参考文献（裁掉底部输入框和模型名）、文献检索结果、文献梳理
still(){ ffmpeg -v error -y -ss "$2" -i "$1" -frames:v 1 -vf "$3" -q:v 3 "$O/$4.jpg"; }
still "$S/03 生成教研报告.mp4" 15.5 "crop=2040:1010:450:150" ref
still "$S/01 查文献.mp4" 13.5 "crop=1980:1080:480:40" lit1
still "$S/01 查文献.mp4" 19.5 "crop=1980:1080:480:40" lit2
still "$S/02 梳理文献2.mp4" 4 "crop=1980:1080:480:40" lit3
still "$S/02 梳理文献2.mp4" 11 "crop=1980:1080:480:40" lit4
still "$S/08 HTML 3D交互.mp4" 2 "crop=1992:740:0:610" c08still
cp "库库AI-logo.png" "$O/logo.png"
# 口播：前 31 秒，统一响度 -16 LUFS（混上音乐后整体约 -14）
ffmpeg -v error -y -i "$S/00 阿亮口播 低清.mp4" -t 31 -vn -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 1 -c:a libmp3lame -b:a 128k "$O/voice.mp3"
# 配乐：Smart Sparks 从 8 秒起（前面是安静前奏）
ffmpeg -v error -y -ss 8 -t 34 -i "$WB/音乐库/配乐_科技解说/kissan4-smart-sparks-436614.mp3" -af "loudnorm=I=-16:TP=-1.5" -ar 44100 -c:a libmp3lame -b:a 160k "$O/music.mp3"
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
echo done
