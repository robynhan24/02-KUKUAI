#!/usr/bin/env bash
# 把原素材转成网页能直接播放的小文件（本期前 30 秒用到的部分）。
# 用法：bash 剪辑工程/prep_assets.sh   （在仓库根目录运行；需要先跑工作台的 setup.sh）
set -e
cd "$(dirname "$0")/.."
S="库库AI-空镜素材"; O="剪辑工程/assets"; WB="${WB:-/home/claude/robynhan24/video-workbench--}"
mkdir -p "$O"
# 本期已做到口播 0–121 秒（第 1–4 段）。往后加段时把这里的 121 改大。
# 视频：每段两份。mp4(H.264) 给 Safari/手机，webm(VP9) 给 Chromium。关键帧 0.5 秒一个，方便跳转。
enc(){ # 输入 起 止 滤镜 输出名
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4" -r 30 -g 15 -c:v libx264 -preset slow -crf "${CRF:-23}" -pix_fmt yuv420p -movflags +faststart "$O/$5.mp4"
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$1" -an -vf "$4" -r 30 -g 15 -c:v libvpx-vp9 -b:v 0 -crf "${WCRF:-36}" -row-mt 1 -deadline good -cpu-used 4 "$O/$5.webm"
}
# 主播（低清 854×480，换高清口播后改这里）
CRF=20 WCRF=32 enc "$S/00 阿亮口播 低清.mp4" 0 121 "null" anchor
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
# 第 4 段（③ 做课件 + 沉淀技能 + 远程）：选「离线互动科学仿真」技能（放慢 1.28 倍）、文件卡
enc "$S/04 3D课件模型.mp4" 0.8 3.8 "$M_DS,setpts=PTS*1.283" c04a
still "04 3D课件模型.mp4" 15.0 "$M_DS" k_file
# 阿亮 10-20：拖锚点/滑块、沉淀技能、远程都用原录屏整段快进播放，按口播分段变速对齐（不再逐个放大框选）
# encx 输入 滤镜图（输出标签 [o]） 输出名 [缩放]
encx(){
  ffmpeg -v error -y -i "$1" -an -filter_complex "$2" -map "[o]" -r 30 -g 15 -c:v libx264 -preset slow -crf "${CRF:-23}" -pix_fmt yuv420p -movflags +faststart "$O/$3.mp4"
  ffmpeg -v error -y -i "$1" -an -filter_complex "$2" -map "[o]" -r 30 -g 15 -c:v libvpx-vp9 -b:v 0 -crf "${WCRF:-36}" -row-mt 1 -deadline good -cpu-used 4 "$O/$3.webm"
}
seg(){ echo "[s$1]trim=$2:$3,setpts=(PTS-STARTPTS)/$4[p$1]"; }   # 第几段 起 止 倍速
# 08 拖锚点 → 拖滑块：1.0–8.6 秒，2.47 倍速
encx "$S/08 HTML 3D交互.mp4" "[0:v]trim=1.0:8.6,setpts=(PTS-STARTPTS)/2.467[o]" c08c
# 05 沉淀技能：0.3–5.6 发出指令→创建成功（2.69 倍）；5.6–14.6 我的技能→使用→输入框（4.15 倍）
encx "$S/05 沉淀技能.mp4" "[0:v]drawbox=x=975:y=1312:w=315:h=56:color=white@1:t=fill:enable='lt(t,7.8)',drawbox=x=1080:y=955:w=290:h=60:color=0xF5F5F5@1:t=fill:enable='gte(t,13.6)',scale=1920:1080,split=2[s1][s2];$(seg 1 0.3 5.6 2.69);$(seg 2 5.6 14.6 4.147);[p1][p2]concat=n=2:v=1[o]" c05
# 06 电脑端打开远程权限：3.0–7.6，4.38 倍
encx "$S/06 远程1.mp4" "[0:v]trim=3.0:7.6,setpts=(PTS-STARTPTS)/4.38,scale=1920:1080[o]" c06r
# 07 手机：1.5–4.9 选位置/文件夹 + 7.4–11.6 输入并发送（跳过 5–7 秒的模型菜单），3.09 倍
M7='drawbox=x=420:y=1660:w=470:h=85:color=0xEDEDED@1:t=fill:enable=between(t\,7.3\,9.8),drawbox=x=420:y=2800:w=580:h=85:color=0xEDEDED@1:t=fill:enable=between(t\,9.3\,12.2),drawbox=x=230:y=2800:w=500:h=85:color=0xEDEDED@1:t=fill:enable=between(t\,12.2\,17.6)'
encx "$S/07 远程-手机.mp4" "[0:v]$M7,scale=720:1560,split=2[s1][s2];$(seg 1 1.5 4.9 3.09);$(seg 2 7.4 11.6 3.09);[p1][p2]concat=n=2:v=1[o]" c07a
# 07 手机：14.6–16.4 生成完成（1.5 倍）+ 18.0–29.0 预览 PPT（5.07 倍）
encx "$S/07 远程-手机.mp4" "[0:v]$M7,scale=720:1560,split=2[s1][s2];$(seg 1 14.6 16.4 1.5);$(seg 2 18.0 29.0 5.07);[p1][p2]concat=n=2:v=1[o]" c07b
cp "库库AI-logo.png" "$O/logo.png"
# 口播：前 31 秒，统一响度 -16 LUFS（混上音乐后整体约 -14）
ffmpeg -v error -y -i "$S/00 阿亮口播 低清.mp4" -t 121 -vn -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 1 -c:a libmp3lame -b:a 128k "$O/voice.mp3"
# 配乐：Smart Sparks 从 8 秒起（前面是安静前奏）
ffmpeg -v error -y -ss 8 -t 34 -i "$WB/音乐库/配乐_科技解说/kissan4-smart-sparks-436614.mp3" -af "loudnorm=I=-16:TP=-1.5" -ar 44100 -c:a libmp3lame -b:a 160k "$O/music.mp3"
# 第 2 段配乐：Tech Explainer 从 26 秒起
ffmpeg -v error -y -ss 0 -t 32 -i "$WB/音乐库/配乐_科技解说/sonican-curious-circuits-playful-electronic-music-411246.mp3" -af "loudnorm=I=-16:TP=-1.5" -ar 44100 -c:a libmp3lame -b:a 160k "$O/music4.mp3"   # 第 4 段配乐：Curious Circuits
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
