#!/bin/bash
# 3D 课件三个交互模块单独裁出来（原录屏 1992×1440 坐标，裁在卡片之间的空白处，叠回去看不出接缝），
# 正放 + 倒放接成一段循环，好让 01、02、03 同时在动。
set -e
cd "$(dirname "$0")/.."
S="库库AI-空镜素材/08 HTML 3D交互.mp4"; A=剪辑工程/assets
mod(){ # 名 起 止 x 宽
  local f="[0:v]trim=$2:$3,setpts=PTS-STARTPTS,crop=$5:840:$4:600,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]"
  ffmpeg -v error -y -i "$S" -filter_complex "$f" -map "[v]" -an -r 30 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart $A/$1.mp4
  ffmpeg -v error -y -i "$S" -filter_complex "$f" -map "[v]" -an -r 30 -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 $A/$1.webm
}
mod m1 0 3.4 160 556      # 01 拖动锚点
mod m2 4.8 10.2 716 558   # 02 拖滑块转切平面
mod m3 10.5 14.3 1274 556 # 03 拖滑块细分曲面
