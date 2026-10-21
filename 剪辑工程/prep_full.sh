#!/usr/bin/env bash
# 阿亮 10-20（第三次）：录屏一律全屏、连贯播放 → 整段原录屏转成 1080p 网页素材（mp4 + webm），按时间打码。
# 国内模型名（DeepSeek-V4-Pro 等）、快捷键提示用同色块盖掉（剪辑规矩第 10、12 条）。
# 用法：bash 剪辑工程/prep_full.sh
set -e
cd "$(dirname "$0")/.."
S="库库AI-空镜素材"; O="剪辑工程/assets"; mkdir -p "$O"
full(){ # 输入 起 止 打码滤镜 输出名 [宽 高]
  local W=${6:-1920} H=${7:-1080}
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4,scale=$W:$H" -r 30 -g 15 -c:v libx264 -preset slow -crf ${CRF:-24} -pix_fmt yuv420p -movflags +faststart "$O/$5.mp4"
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4,scale=$W:$H" -r 30 -g 15 -c:v libvpx-vp9 -b:v 0 -crf ${WCRF:-38} -row-mt 1 -deadline good -cpu-used 4 "$O/$5.webm"
}
DS='drawbox=x=975:y=1312:w=315:h=56:color=white@1:t=fill'                     # 输入框下方模型名
KEY='drawbox=x=1990:y=1250:w=570:h=190:color=white@1:t=fill'                  # 右下角快捷键提示
# 01 查文献：只用 0–30 秒里的 2.1–4.4（点技能、贴指令）和 13–30（结果、引用弹窗）；4.4–13 秒有模型菜单和模型名
full "$S/01 查文献.mp4" 0 30.2 "$KEY,drawbox=x=975:y=1312:w=315:h=56:color=white@1:t=fill:enable='between(t,4.3,13.2)'" r01
# 02 梳理文献 1（贴梳理指令、发送）/ 2（梳理结果）
full "$S/02 梳理文献 1.mp4" 0 8.3 "$DS,drawbox=x=2262:y=1262:w=253:h=133:color=white@1:t=fill" r02a
full "$S/02 梳理文献2.mp4" 0 14.1 "$DS" r02b
# 03 生成教研报告：0–17 秒（召唤专家 → 报告 → 参考文献）
full "$S/03 生成教研报告.mp4" 0 17.2 "drawbox=x=975:y=1312:w=600:h=56:color=white@1:t=fill" r03
# 04 3D 课件：选技能 → 发指令 → 生成 .html
full "$S/04 3D课件模型.mp4" 0 15.6 "drawbox=x=975:y=1312:w=600:h=56:color=white@1:t=fill" r04
# 05 沉淀技能（后段「我的技能」页输入框下方模型名用浅灰盖）
full "$S/05 沉淀技能.mp4" 0 14.7 "drawbox=x=975:y=1312:w=315:h=56:color=white@1:t=fill:enable='lt(t,7.8)',drawbox=x=1080:y=955:w=290:h=60:color=0xF5F5F5@1:t=fill:enable='gte(t,13.6)'" r05
# 06 打开远程权限
full "$S/06 远程1.mp4" 2.8 8.4 "null" r06
# 08 3D 交互课件（1992×1440，等比 1494×1080）
full "$S/08 HTML 3D交互.mp4" 0 15.4 "null" r08 1494 1080
# 07 手机（竖屏 720×1560）：输入指令发送 8.6–11.4 + 生成完成 14.6–16.0 + 翻看 PPT 18.0–20.5，原速连起来；底部模型名盖掉，不用 5–7 秒的模型菜单
M7="drawbox=x=420:y=1660:w=470:h=85:color=0xEDEDED@1:t=fill:enable='between(t,7.3,9.8)',drawbox=x=420:y=2800:w=580:h=85:color=0xEDEDED@1:t=fill:enable='between(t,9.3,12.2)',drawbox=x=230:y=2800:w=500:h=85:color=0xEDEDED@1:t=fill:enable='between(t,12.2,17.6)'"
FC="[0:v]$M7,scale=720:1560,split=3[a][b][c];[a]trim=8.6:11.4,setpts=PTS-STARTPTS[p1];[b]trim=14.6:16.0,setpts=PTS-STARTPTS[p2];[c]trim=18.0:20.5,setpts=PTS-STARTPTS[p3];[p1][p2][p3]concat=n=3:v=1[o]"
ffmpeg -v error -y -i "$S/07 远程-手机.mp4" -an -filter_complex "$FC" -map "[o]" -r 30 -g 15 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "$O/c07.mp4"
ffmpeg -v error -y -i "$S/07 远程-手机.mp4" -an -filter_complex "$FC" -map "[o]" -r 30 -g 15 -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -deadline good -cpu-used 4 "$O/c07.webm"
# 网页端截图（阿亮提供）
cp "/root/.claude/uploads/99d337f6-1ee6-590c-8b43-3751aee9a00e/3cb65848-image.png" "$O/k_web.png" 2>/dev/null || true
echo done
