/* 库库AI 时间线 —— 风格：秋芝-豆包
 * 第 1 段 0–29.85：开头（成果前置、需求引入、预告流程）
 * 第 2 段 29.85–66.45：① 查文献（文献检索 Skill → 对接学术库 → 结构化梳理）
 * 第 3 段 66.45–92.0：② 出报告（召唤教学设计专家 → 指令 → 报告结构 → 参考文献分级）
 * 第 4 段 92.0–121.95：③ 做课件（调用仿真技能 → 交互课件）+ 沉淀个人 Skill + 手机远程
 * 第 5 段 121.95–147.0：结尾（今非昔比 → 单点到工作流 → 回顾三步 → 一站式 → 网页端/桌面端 → 下期见）
 * 口播时间 V（原口播秒数）→ 成片时间 T。剪掉超过 0.45 秒的停顿；插入的停顿放大标题。
 */
(function () {
  const D = KDraw, { clamp, lerp, prog, ease } = KUtil;
  const A = window.ASSET_BASE || '剪辑工程/assets/';

  /* ---------- 口播剪辑表：[口播起, 口播止, 成片起] ---------- */
  const VOICE = [
    [0.00, 1.95, 0.00],
    [2.28, 8.50, 1.95],
    [8.80, 19.50, 8.17],
    // 18.87–19.87 插入：库库AI logo（停顿里单独出现 + 重击）
    [19.68, 29.50, 19.87],
    // 29.69–31.05 插入：章节卡「① 查文献」
    [29.72, 34.50, 31.05],
    [34.84, 44.48, 35.83],
    [44.91, 53.24, 45.47],
    [53.55, 66.10, 53.80],
    // 66.35–67.65 插入：章节卡「② 出报告」
    [66.47, 90.72, 67.65],
    // 91.90–93.20 插入：章节卡「③ 做课件」
    [91.18, 108.48, 93.20],
    [108.93, 113.90, 110.50],
    [114.22, 120.50, 115.47],
    [121.00, 140.30, 121.95],
    [140.72, 145.95, 141.25],
  ];
  const T = v => { for (const [a, b, t] of VOICE) if (v >= a - 0.05 && v <= b + 0.05) return t + (v - a); return null; };
  const V = t => { for (const [a, b, t0] of VOICE) if (t >= t0 && t <= t0 + (b - a)) return a + (t - t0); return null; };
  const DUR = 147.0;
  const SEG2 = 29.85, SEG3 = 66.45, SEG4 = 92.0, SEG5 = 121.95;   // 各段起点（预览页的分段按钮跳到这里）

  /* ---------- 字幕（口播时间） ---------- */
  const SUBS = [
    [0.15, 1.10, '来 老师、科研党们'], [1.10, 1.95, '都看过来！'],
    [2.28, 4.35, '你看AI制作的这个3D高数课件'], [4.40, 5.25, '能拖、能转'],
    [5.26, 6.40, '还配了一份文献出处'], [6.45, 8.50, '标得清清楚楚的教研报告'],
    [8.80, 10.50, '前阵子有位老师在评论区吐槽'], [10.52, 12.55, '他在做一个高数教研专题'],
    [12.65, 14.55, '但文献怎么理都理不顺'], [14.75, 16.62, '3D课件更是无从下手'],
    [16.78, 18.25, '底下有网友推荐了一个'], [18.28, 19.50, '叫库库AI的工具'],
    [19.68, 20.55, '我拿来一试'], [20.60, 22.50, '还真能一条龙跑下来'],
    [22.62, 24.00, '那今天我就手把手带你'], [24.02, 25.42, '做一个完整的教研专题'],
    [25.50, 27.15, '从查文献到出课件'], [27.20, 29.50, '学会以后 从此教研不发愁'],
    // 第 2 段
    [29.72, 31.25, '先调用文献检索Skill'], [31.28, 32.75, '让AI围绕这个课题'], [32.78, 34.50, '定向检索核心文献'],
    [34.84, 36.40, '哎 可能有人会说'], [36.40, 38.36, 'AI搜文献有啥新鲜的？'],
    [38.55, 39.62, '但用过的都知道'], [39.62, 41.40, '大多数工具搜出来的'], [41.45, 42.70, '都是东一头西一头'], [42.72, 44.48, '还得自己挨个核对出处'],
    [44.91, 46.30, '而库库AI直接对接'], [46.33, 48.45, '知网、百度学术这些学术库'],
    [48.62, 51.15, '作者、发表时间全都列得很清楚'], [51.20, 53.24, '所以文献都有迹可循'],
    [53.55, 55.55, '单纯检索文献还只是基本操作'], [55.75, 56.55, '更省心的是'], [56.56, 58.75, '可以对文献进行结构化梳理'],
    [59.05, 61.60, '针对14篇文献 建立完整论证框架'], [61.85, 64.05, '还分好了核心论据和补充资料'],
    [64.25, 66.05, '连研究缺口都给你点出来了'],
    // 第 3 段
    [66.47, 67.75, '有了完整的证据链'], [67.80, 69.30, '出报告就水到渠成了'],
    [69.33, 71.40, '这里我们直接召唤教学设计专家'],
    [71.74, 73.95, '围绕这个课题 再结合前面的工作成果'], [74.05, 76.40, '给一份符合教研规范的报告'],
    [76.68, 77.55, '不过有一说一'], [77.60, 79.50, '我的高数早就还给老师了'],
    [79.66, 81.50, '但单看这份报告的结构逻辑'], [81.52, 83.15, '就知道它不是东拼西凑'],
    [83.32, 85.50, '而是顺着这个逻辑线铺下来的'],
    [85.80, 87.60, '参考文献里哪些支撑核心结论'], [87.62, 89.30, '哪些是拓展参考'], [89.32, 90.72, '也都分得清清楚楚'],
    // 第 4 段
    [91.18, 92.82, '最后我们就能做出'], [92.82, 94.50, '开头那个能拖能转的3D课件'],
    [94.75, 98.20, '直接调用「离线互动科学仿真HTML生成」技能'], [98.57, 100.55, '让它生成配套的3D交互课件'],
    [100.99, 103.95, '它把三个知识点整合在了同一个三维曲面里'],
    [104.32, 105.45, '拖动锚点或滑块'], [105.50, 107.15, '抽象概念的几何本质'], [107.40, 108.48, '一眼就能看明白'],
    [108.93, 109.80, '整个流程走下来'], [109.85, 111.95, '还能沉淀成个人专属Skill'], [112.10, 113.90, '后续可以一键复用'],
    [114.22, 115.20, '就算出门在外'], [115.22, 117.75, '手机也可以直接远程操作电脑干活'],
    [118.02, 119.05, '工作照样继续跑'], [119.10, 120.50, '不用守在电脑旁边'],
    // 第 5 段
    [121.03, 122.25, 'AI能力真的是'], [122.27, 123.15, '已经今非昔比了'], [123.22, 124.30, '从单点回答问题'], [124.40, 126.91, '到承接一整套专业的工作流'],
    [127.20, 128.45, '变化呢是肉眼可见'], [128.83, 130.70, '从文献整理到专业的研究报告'], [130.80, 132.25, '再到立体交互式课件'],
    [132.62, 134.88, '库库AI一款工具就能一站式落地'], [135.21, 137.40, '这才是专业AI办公该有的样子'], [137.76, 140.15, '这个工具网页端和桌面端都能用'],
    [140.75, 142.62, '好了 以上就是本期视频的全部内容'], [142.64, 144.36, '大家有什么想看的 评论区告诉我'], [144.38, 145.85, '我是阿亮 我们下期再见'],
  ].map(([a, b, s]) => [T(a), T(b), s]);

  /* ---------- 主播 ---------- */
  const ANCHOR_W = 854, ANCHOR_H = 480;
  const PIP = { x: 160, y: 920, d: 230 };       // 左下角，避开内容和字幕
  /** 成片时间 → 主播视频时间（停顿里继续往下走） */
  // 停顿里真人画面也看得见的地方：慢放「说完这句 → 下一句开口」之间那一小段，不露出没声音的口型，也不往回跳
  const SLOW = [];   // 10-21：停顿已去掉（见文件末尾 CUTS），不用慢放
  function anchorV(t) {
    for (const [a, b, v0, v1] of SLOW) if (t >= a && t < b) return v0 + (t - a) * (v1 - v0) / (b - a);
    let v = V(t);
    if (v == null) { for (const [a, , t0] of VOICE) if (t >= t0) v = a + (t - t0); }
    return v;
  }
  function anchorEl(E, t) {
    const v = anchorV(t); if (v == null) return null;
    const sl = SLOW.find(([a, b]) => t >= a && t < b);
    return E.video('anchor', v, sl ? (sl[3] - sl[2]) / (sl[1] - sl[0]) : 1);
  }
  /** 主播头部位置 [中心 x, 头顶 y]（anchor_track.js，每秒一个点，中间插值） */
  function head(v) {
    const H = window.ANCHOR_TRACK; if (!H || v == null) return [400, 55];
    const i = clamp(Math.floor(v), 0, H.length - 1), j = Math.min(H.length - 1, i + 1), f = clamp(v - i);
    return [lerp(H[i][0], H[j][0], f), lerp(H[i][1], H[j][1], f)];
  }
  /** 小圆窗取的区域：脸水平居中，头在圆的上部，多露出肩膀和上半身（阿亮 10-20） */
  function pipSrc(v) {
    const S = 310, [cx, top] = head(v);
    return [clamp(cx - S / 2, 0, ANCHOR_W - S), clamp(top - .08 * S, 0, ANCHOR_H - S), S, S];
  }
  function pip(ctx, t, E, t0, t1) {
    if (window.__jyPip) window.__jyPip.add(t0.toFixed(3) + ',' + t1.toFixed(3));   // 导出剪映：记下小圆窗的时间
    if (D.noPip || t < t0 - .05 || t >= t1) return;     // 阿亮 10-20：小圆窗固定在左下角，不做出现动画
    D.pip(ctx, anchorEl(E, t), pipSrc(anchorV(t)), PIP.x, PIP.y, PIP.d);
  }
  /** 真人大画面：慢慢推近；close=true 用近景 */
  /** 真人全屏画面的位置：人物水平居中；头顶留白全景约 12%、近景约 8%；慢慢推近 */
  function anchorGeom(t, t0, t1, close) {
    const p = prog(t, t0, t1), z = close ? lerp(1.16, 1.21, p) : lerp(1.06, 1.11, p);
    const k = 1920 / ANCHOR_W * z, w = ANCHOR_W * k, h = ANCHOR_H * k, [hx, ht] = head(anchorV(t));
    return { x: clamp(960 - hx * k, 1920 - w, 0), y: clamp((close ? 86 : 130) - ht * k, 1080 - h, 0), w, h, k };
  }
  function anchorFull(t0, t1, o = {}) {
    return {
      kind: 'anchor', close: !!o.close,
      t0, t1, draw(ctx, t, E) {
        const el = anchorEl(E, t); if (!el) return;
        const g = anchorGeom(t, t0, t1, o.close);
        // 转场（阿亮 10-20：不再白闪）：从网格底淡入并轻推，结束前淡出
        const kin = o.xin === 0 ? 1 : ease.out(prog(t, t0, t0 + .3)), kout = o.xout === 0 ? 1 : 1 - prog(t, t1 - .18, t1), a = Math.min(kin, kout);
        if (a < 1) D.bg(ctx, t);
        const z = lerp(1.03, 1, kin);
        ctx.save(); ctx.globalAlpha = a; ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960, -540);
        ctx.drawImage(el, g.x, g.y, g.w, g.h); ctx.restore();
        if (o.extra) o.extra(ctx, t, E);
      },
    };
  }
  /** 库库AI logo 直接出现在真人画面的空白处（阿亮 10-20：不单独开一个画面） */
  function logoOn(ctx, t, E, ta, tEnd, o = {}) {
    if (t < ta || t >= tEnd) return;
    const cx = o.cx || 1580, cy = o.cy || 300, W = o.w || 540;
    const k = prog(t, ta, ta + .22), s = lerp(1.7, 1, ease.out(k)) + Math.sin(prog(t, ta + .22, ta + .5) * Math.PI) * .04;
    const a = clamp(k * 3) * (1 - prog(t, tEnd - .3, tEnd)), logo = E.tint('logo', '#ffffff'); if (!logo) return;
    ctx.save(); ctx.globalAlpha = a;
    const ring = o.ring === false ? 0 : prog(t, ta + .18, ta + .8);
    if (ring > 0 && ring < 1) { ctx.strokeStyle = `rgba(245,223,39,${.7 * (1 - ring)})`; ctx.lineWidth = 8 * (1 - ring) + 2; ctx.beginPath(); ctx.arc(cx, cy, W * .3 + ring * W * .5, 0, Math.PI * 2); ctx.stroke(); }
    const w = W * s, h = w * 249 / 960;
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h);
    ctx.shadowColor = 'rgba(139,92,246,.95)'; ctx.shadowBlur = 40; ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h);
    const sw = prog(t, ta + .35, ta + .85);
    if (sw > 0 && sw < 1) {
      ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 0;
      const gx = lerp(cx - w / 2 - 120, cx + w / 2 + 120, sw), g = ctx.createLinearGradient(gx - 80, 0, gx + 80, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - w / 2, cy - h / 2, w, h); ctx.globalCompositeOperation = 'source-over';
    }
    if (o.band != null) {   // 三色光带（一站式）
      const u = ease.out(prog(t, o.band, o.band + .5));
      if (u > 0) {
        const bw = W * .95 * u, gr = ctx.createLinearGradient(cx - W * .475, 0, cx + W * .475, 0);
        gr.addColorStop(0, '#2388FF'); gr.addColorStop(.5, '#F5DF27'); gr.addColorStop(1, '#39C872');
        ctx.shadowColor = '#b9ff00'; ctx.shadowBlur = 18; ctx.fillStyle = gr; D.rr(ctx, cx - W * .475, cy + h / 2 + 26, bw, 12, 6); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ---------- 场景 ---------- */
  const scenes = [];
  const lerpR = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

  /** 全屏录屏场景（阿亮 10-20 第三版）：录屏铺满全屏、连贯播放；重点用镜头推拉 + 马克笔 / 框选。
   *  o.asset 录屏；o.iw/ih 坐标空间（原始录屏像素）；o.src = [[成片时间, 录屏时间, 速度]...]（速度 0 = 停在这一帧）
   *  o.cam = [[时间, 区域或 null]...] 镜头；o.marks = [{r, at, end, kind:'hl'|'box'}]
   *  o.xin / o.xout 进出场过渡（换素材时用），o.cuts 同一录屏里跳一段时的软切（快速淡出淡入） */
  function fullScene(t0, t1, o) {
    const srcAt = t => { let v = 0; for (const [ta, s0, r] of o.src) if (t >= ta - 1e-6) v = s0 + (t - ta) * r; return v; };
    const rateAt = t => { let v = 1; for (const [ta, , r] of o.src) if (t >= ta - 1e-6) v = r; return v; };
    const xin = o.xin == null ? .35 : o.xin, xout = o.xout == null ? .22 : o.xout;
    return {
      kind: 'full', t0, t1, o, draw(ctx, t, E) {
        D.bg(ctx, t);
        let a = 1, z = 1;
        if (xin > 0 && t < t0 + xin) { const k = ease.out(prog(t, t0, t0 + xin)); a = k; z = lerp(1.05, 1, k); }
        if (xout > 0 && t > t1 - xout) { const k = prog(t, t1 - xout, t1); a = Math.min(a, 1 - k); z = lerp(1, 1.03, k); }
        for (const c of o.cuts || []) { const d = Math.abs(t - c); if (d < .16) a = Math.min(a, d / .16); }
        const el = o.image ? E.image(o.asset) : E.video(o.asset, srcAt(t), rateAt(t));
        const layers = (o.layers || []).map(L => ({ r: L.r, el: E.video(L.asset, (t - t0 + (L.off || 0)) % L.len, 1) }));
        ctx.save(); ctx.globalAlpha = a; ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960, -540);
        if (o.ih > o.iw) { D.rec(ctx, t, el, o.iw, o.ih, { phoneH: o.phoneH, phoneY: o.phoneY }); if (o.after) o.after(ctx, t, E); }   // 竖屏手机：外框 + 虚化铺底
        else {
          const dim = o.dim ? ease.inOut(prog(t, o.dim[0], o.dim[0] + .35)) * (1 - ease.inOut(prog(t, o.dim[1], o.dim[1] + .3))) : 0;
          const g = D.recFull(ctx, t, el, o.iw, o.ih, { cam: o.cam, marks: dim > .99 ? [] : o.marks, layers });
          if (dim > 0 && el) {   // 背景录屏虚化 + 压暗，上面放讲解动画
            const vw = el.videoWidth || el.width, vh = el.videoHeight || el.height;
            ctx.save(); ctx.globalAlpha *= dim; ctx.drawImage(D._blurred(el, vw, vh), g.dx, g.dy, o.iw * g.sc, o.ih * g.sc);
            ctx.fillStyle = 'rgba(8,8,16,.62)'; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
            if (o.over) { ctx.save(); ctx.globalAlpha *= dim; o.over(ctx, t, E); ctx.restore(); }
          }
        }
        ctx.restore();
        pip(ctx, t, E, t0, t1);
      },
    };
  }
  /** 两个动画场景之间交叉淡化（不硬切） */
  function blend(sA, sB, d = .35) {
    return { kind: 'gfx', t0: sA.t0, t1: sB.t1, draw(ctx, t, E) {
      if (t < sB.t0) return sA.draw(ctx, t, E);
      sB.draw(ctx, t, E);
      const k = prog(t, sB.t0, sB.t0 + d); if (k >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - k; sA.draw(ctx, Math.min(t, sA.t1 - 1e-3), E); ctx.restore();
    } };
  }
  // 3D 课件（1992×1440）三个模块的区域
  const M1 = [160, 620, 720, 1180], M2 = [715, 620, 1265, 1180], M3 = [1270, 620, 1830, 1180];
  const M12 = [150, 610, 1275, 1190];
  // 裁出来的模块视频在原录屏里的位置（裁在卡片之间的空白处）；底图定格在 4.2 秒（这时没有鼠标）
  const MOD = { m1: { r: [160, 600, 716, 1440], len: 6.8 }, m2: { r: [716, 600, 1274, 1440], len: 10.8 }, m3: { r: [1274, 600, 1830, 1440], len: 7.6 } };
  const modLayer = (n, off = 0) => ({ asset: n, r: MOD[n].r, len: MOD[n].len, off });
  // 单独提取出来放大时用的范围：卡片顶到 3D 画面底（标题 + 说明 + 三维图），各模块视频里的位置
  const CARD = { m1: [172, 623, 705, 1185], m2: [728, 623, 1261, 1185], m3: [1285, 623, 1818, 1185] };   // 01 + 02 两个模块一起（阿亮 10-20：放大适中，两个动效同时看得到）

  /* ================= 第 1 段：开头 ================= */

  // 报告录屏 16.0 秒那一帧：参考文献（measure.py 量的：核心论据 [1]–[9] 在 553–2435 × 263–834，补充资料 [10]–[12] 在 553–2181 × 968–1123）
  const BOX_CORE = [531, 241, 2457, 856], BOX_SUPP = [531, 946, 2195, 1133];
  const CORE = [614, 241, 2375, 856], SUPP = [614, 946, 2375, 1133];   // 镜头：放大约 1.25 倍，整行都在画面里
  // ① 0–4.93 「来，老师、科研党们，都看过来！你看AI制作的这个3D高数课件，能拖、能转」
  //    开头直接全屏 3D 交互课件高光：全画面 → 推近到 01、02 两个模块（拖曲面、转切平面同时看得到）
  scenes.push(fullScene(0, 4.93, {
    asset: 'r08', iw: 1992, ih: 1440, xin: 0, src: [[0, 4.2, 0]], layers: [modLayer('m1'), modLayer('m2', .3)],   // 01 拖锚点 + 02 转切平面同时动
    cam: [[0, null], [1.3, M12, 1.0]],
  }));

  // ② 4.93–8.17 「还配了一份文献出处标得清清楚楚的教研报告」报告录屏慢慢上滑一小段到参考文献 → 定格，轻推近，框出整组核心论据
  scenes.push(fullScene(4.93, 8.17, {
    asset: 'r03', iw: 2560, ih: 1440, src: [[4.93, 15.45, .4], [4.93 + 1.375, 16.0, 0]],
    cam: [[4.93, null], [6.3, CORE, .7]],
    marks: [{ r: BOX_CORE, at: 7.05, kind: 'box' }],
  }));

  // ③ 8.17–11.99 「前阵子有位老师在评论区吐槽，他在做一个高数教研专题」真人
  scenes.push(anchorFull(8.17, 11.99));

  // ④ 11.99–16.11 「但文献怎么理都理不顺，3D课件呢更是无从下手」
  //   「理都理不顺」：四张高数公式图浮在空中，之间的连线越连越乱、互相缠绕，卡片换位后线绞成一团（10-20 换掉红笔乱线）
  {
    const t0 = 11.99, t1 = 14.07, tK = T(13.85);
    const HOME = [[640, 330, -.05], [1290, 300, .04], [610, 700, .05], [1300, 720, -.04]];
    const SWAP = [3, 2, 1, 0];   // 「理不顺」那一下：对角换位，线跟着拧成一团
    // 连线：从卡片 i 的某个点连到卡片 j 的某个点（点用卡片内的相对位置）
    const LINKS = [[0, 3, [.9, .7], [.1, .2], '#2388FF'], [1, 2, [.1, .8], [.9, .2], '#8b5cf6'], [0, 1, [.8, .9], [.2, .9], '#F5DF27'],
                   [2, 3, [.8, .1], [.2, .9], '#39C872'], [0, 2, [.95, .4], [.95, .6], '#8b5cf6'], [1, 3, [.05, .5], [.05, .4], '#2388FF'], [3, 0, [.5, .05], [.5, .95], '#F5DF27']];
    const CW = 600, CH = CW * 941 / 1672;
    var S5 = ({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        const sw = ease.inOut(prog(t, tK - .1, tK + .55));
        const pos = HOME.map(([x, y, r], i) => {
          const [X, Y, R] = HOME[SWAP[i]], dl = i * .14, k = ease.out(prog(t, t0 + dl, t0 + dl + .45));
          const fx = Math.sin(t * 1.3 + i * 1.7) * 10, fy = Math.cos(t * 1.1 + i) * 8;
          // 换位时走弧线，不是直线滑过去
          const arc = Math.sin(sw * Math.PI) * (i % 2 ? -140 : 140);
          return { x: lerp(x, X, sw) + fx + (1 - k) * (x < 960 ? -520 : 520), y: lerp(y, Y, sw) + fy + arc * (i < 2 ? 1 : -1) * .5, r: lerp(r, R, sw) + (1 - k) * (x < 960 ? -.2 : .2), k };
        });
        const pt = (i, [u, v]) => { const P = pos[i], dx = (u - .5) * CW, dy = (v - .5) * CH; return [P.x + dx * Math.cos(P.r) - dy * Math.sin(P.r), P.y + dx * Math.sin(P.r) + dy * Math.cos(P.r)]; };
        // 卡片
        pos.forEach((P, i) => {
          if (P.k <= 0) return;
          ctx.save(); ctx.globalAlpha = clamp(P.k * 1.4); ctx.translate(P.x, P.y); ctx.rotate(P.r);
          ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
          D.rr(ctx, -CW / 2, -CH / 2, CW, CH, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
          const im = E.image('gs' + (i + 1)); if (im) { ctx.save(); D.rr(ctx, -CW / 2, -CH / 2, CW, CH, 14); ctx.clip(); ctx.drawImage(im, -CW / 2, -CH / 2, CW, CH); ctx.restore(); }
          ctx.restore();
        });
        // 连线：一根根画出来，弯来弯去互相交叉；换位后拧成一团、带一点红
        const knot = sw, red = ease.out(prog(t, tK + .3, tK + .8));
        LINKS.forEach(([i, j, pa, pb, col], n) => {
          const p = ease.inOut(prog(t, t0 + .75 + n * .13, t0 + 1.25 + n * .13)); if (p <= 0) return;
          const A = pt(i, pa), B = pt(j, pb), w1 = Math.sin(t * 2.1 + n * 1.9), w2 = Math.cos(t * 1.7 + n * 2.3);
          const C1 = [lerp(A[0] + (B[1] - A[1]) * .55 * w1, 960 + 160 * Math.cos(n * 2.4), knot), lerp(A[1] - (B[0] - A[0]) * .35 * w2, 510 + 110 * Math.sin(n * 2.4), knot)];
          const C2 = [lerp(B[0] - (B[1] - A[1]) * .5 * w2, 960 - 160 * Math.cos(n * 1.7), knot), lerp(B[1] + (B[0] - A[0]) * .3 * w1, 510 - 110 * Math.sin(n * 1.7), knot)];
          ctx.save(); ctx.lineCap = 'round';
          const N = 48, m = Math.max(2, Math.round(N * p));
          ctx.beginPath();
          for (let q = 0; q <= m; q++) { const u = q / N, iu = 1 - u;
            const x = iu * iu * iu * A[0] + 3 * iu * iu * u * C1[0] + 3 * iu * u * u * C2[0] + u * u * u * B[0];
            const y = iu * iu * iu * A[1] + 3 * iu * iu * u * C1[1] + 3 * iu * u * u * C2[1] + u * u * u * B[1];
            q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.strokeStyle = red > 0 && n % 2 ? `rgba(255,77,94,${.55 + .4 * red})` : col; ctx.globalAlpha = .9;
          ctx.lineWidth = 4; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14; ctx.stroke();
          // 两端的小圆点
          ctx.shadowBlur = 10; ctx.fillStyle = '#fff';
          for (const P of [A, ...(p >= 1 ? [B] : [])]) { ctx.beginPath(); ctx.arc(P[0], P[1], 7, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        });
        // 绞成一团的中心：一圈淡红色脉冲
        if (red > 0) {
          const pr = (t - tK - .3) * 1.6 % 1;
          ctx.save(); ctx.globalAlpha = red * (1 - pr) * .8; ctx.strokeStyle = '#ff4d5e'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(960, 510, 60 + pr * 140, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
        pip(ctx, t, E, t0, t1);
      },
    });
  }

  //   「3D课件呢更是无从下手」：抠掉背景的 3D 空镜（10 3D空镜）浮在网格上 + 问号
  {
    const t0 = 14.07, t1 = 16.11, NF = 68;
    var S6 = ({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        const f = clamp(Math.floor((t - t0 + .3) * 20 * 1.15), 0, NF - 1), im = E.image('k3d' + f);
        const k = ease.out(prog(t, t0, t0 + .5)), w = 1180 * lerp(.92, 1, k), h = w * 641 / 900;
        const x = 900 - w / 2, y = 500 - h / 2 + Math.sin(t * 1.4) * 6;
        // 地面上的柔和投影
        ctx.save(); ctx.globalAlpha = .45 * k; const sh = ctx.createRadialGradient(900, y + h - 10, 20, 900, y + h - 10, w * .45);
        sh.addColorStop(0, 'rgba(0,0,0,.8)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh;
        ctx.save(); ctx.translate(900, y + h - 10); ctx.scale(1, .16); ctx.translate(-900, -(y + h - 10)); ctx.fillRect(900 - w * .5, y + h - 10 - w * .5, w, w); ctx.restore(); ctx.restore();
        if (im) { ctx.save(); ctx.globalAlpha = clamp(k * 1.3); ctx.drawImage(im, x, y, w, h); ctx.restore(); }
        // 「无从下手」：问号弹出
        const q = ease.back(prog(t, T(15.55), T(15.55) + .35));
        if (q > 0) { ctx.save(); ctx.translate(1765, 615); ctx.scale(q, q); ctx.rotate(Math.sin(t * 5) * .04); D.text(ctx, '？', 0, 0, { size: 560, color: '#f5df27', stroke: '#111', strokeW: 20 }); ctx.restore(); }
        pip(ctx, t, E, t0, t1);
      },
    });
  }

  scenes.push(blend(S5, S6));

  // ⑤ 16.11–25.69 「哎，底下有网友就推荐了一个叫库库AI的工具。我拿来一试，还真能一条龙跑下来。那今天我就手把手带你做一个完整的教研专题」
  //    真人近景一个镜头接下去（两句中间不转场）；说到「库库AI」时 logo 直接出现在右边空白处（不加圆圈）
  const LOGO1 = T(18.45);
  scenes.push(anchorFull(16.11, 25.69, { close: true, extra: (ctx, t, E) => logoOn(ctx, t, E, LOGO1, 21.3, { ring: false }) }));

  // ⑧ 25.69–27.81 「从查文献到出课件」章节导航（秋芝-豆包式编号卡）
  const NAV = [['查文献', '#2388FF', T(25.80)], ['出报告', '#F5DF27', T(26.25)], ['做课件', '#39C872', T(26.65)]];
  /** 导航卡：reveal[i] = 名字揭晓时间（-1 = 已揭晓）；focus = 当前章节（其余压暗），-1 = 不压暗 */
  function navDraw(ctx, t, t0, reveal, focus, o = {}) {
    const bw = 900, bh = 172, gap = 54, top = 540 - (3 * bh + 2 * gap) / 2 - 40;
    NAV.forEach(([name, col], i) => {
      const ta = reveal[i], y = top + i * (bh + gap), x = 1000 - bw / 2;
      const inK = ease.out(prog(t, t0 + i * .07, t0 + i * .07 + .3)), on = ta < 0 ? 1 : ease.out(prog(t, ta, ta + .25));
      const dim = focus < 0 || focus === i ? 1 : .3;
      const pop = focus === i ? 1 + .06 * ease.back(prog(t, o.hit || t0, (o.hit || t0) + .3)) : 1;
      ctx.save(); ctx.globalAlpha = inK * dim; ctx.translate(1000 + (1 - inK) * 120, y + bh / 2); ctx.scale(pop, pop); ctx.translate(-1000, -(y + bh / 2));
      if (focus === i) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 50; D.rr(ctx, x, y, bw, bh, 22); ctx.fillStyle = col; ctx.globalAlpha = .35; ctx.fill(); ctx.restore(); }
      else if (on > 0) { ctx.save(); ctx.globalAlpha = inK * dim * on * .22; D.rr(ctx, x, y, bw, bh, 22); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
      D.rr(ctx, x, y, bw, bh, 22); ctx.lineWidth = 7; ctx.strokeStyle = col; ctx.globalAlpha = inK * dim * lerp(.55, 1, on); ctx.stroke();
      ctx.globalAlpha = inK * dim;
      ctx.beginPath(); ctx.arc(x + 110, y + bh / 2, 54, 0, Math.PI * 2); ctx.lineWidth = 9; ctx.strokeStyle = col; ctx.stroke();
      D.text(ctx, String(i + 1), x + 110, y + bh / 2 + 4, { size: 76, color: col, shadow: false });
      const label = on > .5 ? name : '？？？';
      ctx.save(); const sc = on > .5 && ta >= 0 ? lerp(1.25, 1, ease.out(prog(t, ta + .12, ta + .35))) : 1; ctx.translate(x + 530, y + bh / 2 + 4); ctx.scale(sc, sc);
      D.text(ctx, label, 0, 0, { size: 96, color: '#fff' }); ctx.restore();
      ctx.restore();
    });
  }
  {
    const t0 = 25.69, t1 = 27.81;
    scenes.push({ t0, t1, draw(ctx, t, E) { D.bg(ctx, t); navDraw(ctx, t, t0, NAV.map(n => n[2]), -1); pip(ctx, t, E, t0 + .1, t1); } });
  }

  // ⑨ 27.81–29.85 「学会以后，从此教研不发愁」真人收尾
  scenes.push(anchorFull(27.81, SEG2));

  /* ================= 第 2 段：① 查文献 ================= */

  // C 29.85–31.05 停顿：章节卡「① 查文献」亮起，②③ 压暗（重击同帧）
  const CH1 = 29.85, CH1_HIT = 30.05;
  scenes.push({ t0: CH1, t1: 31.05, draw(ctx, t) { D.bg(ctx, t, { c2: 'rgba(35,136,255,.45)' }); navDraw(ctx, t, CH1 - .4, [-1, -1, -1], 0, { hit: CH1_HIT }); } });

  // 10  31.05–35.83 「先调用文献检索Skill，让AI围绕这个课题定向检索核心文献」
  //     查文献录屏连贯播放（点技能 → 贴指令），停在指令上推近，马克笔描「围绕课题定向检索」「核心期刊、高被引文献」
  const PR = [600, 640, 2480, 900];
  scenes.push(fullScene(31.05, 35.83, {
    asset: 'r01', iw: 2560, ih: 1440, src: [[31.05, 2.15, 1], [32.9, 4.0, 0]],
    cam: [[31.05, null], [32.75, PR]],
    marks: [{ r: [770, 709, 1826, 751], at: 33.55, dur: .7 }, { r: [673, 828, 1155, 870], at: T(33.70), dur: .45 }],
  }));

  // 11  35.83–39.62 「哎，可能有人会说，AI搜文献有啥新鲜的？但用过的都知道」真人
  scenes.push(anchorFull(35.83, T(39.62)));

  // 12  40.59–45.47 「大多数工具搜出来东一头西一头，还得自己挨个核对出处」示意：零散结果卡 + 放大镜挨个查
  {
    const t0 = T(39.62), t1 = 45.47, tE = T(41.58), tW = T(42.24), tC = T(43.38);
    const CARDS = [[-560, -160, -.08], [-40, -230, .05], [500, -150, -.04], [-420, 170, .06], [80, 150, -.06], [600, 190, .07]];
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c1: 'rgba(120,120,140,.25)', c2: 'rgba(233,66,84,.18)' });
        const east = ease.inOut(prog(t, tE, tE + .35)), west = ease.inOut(prog(t, tW, tW + .35)), back = ease.inOut(prog(t, tC - .3, tC));
        CARDS.forEach(([dx, dy, a], i) => {
          const k = ease.back(prog(t, t0 + i * .07, t0 + i * .07 + .3)); if (k <= 0) return;
          // 东一头：全部甩到左边；西一头：一半甩到右边；挨个核对：摆回一排
          let px = dx, py = dy;
          px = lerp(px, -620 + (i % 3) * 90, east); py = lerp(py, -180 + i * 70, east);
          if (i % 2) { px = lerp(px, 560 + (i % 3) * 60, west); }
          const row = [-600, -300, 0, 300, 600, 900][i];
          px = lerp(px, row - 150, back); py = lerp(py, -40, back);
          ctx.save(); ctx.translate(960 + px, 470 + py); ctx.rotate(a * (1 - back)); ctx.scale(k * lerp(1, .62, back), k * lerp(1, .62, back));
          D.rr(ctx, -210, -125, 420, 250, 18); ctx.fillStyle = '#e9e9ef'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = '#b9b9c6'; D.rr(ctx, -175, -95, 230, 26, 8); ctx.fill();
          ctx.fillStyle = '#d2d2dc'; for (let j = 0; j < 4; j++) { D.rr(ctx, -175, -45 + j * 38, 350 - (j % 2) * 90, 18, 6); ctx.fill(); }
          // 放大镜查到这张：打问号
          const hit = tC + .1 + i * .17;
          const q = ease.back(prog(t, hit, hit + .2));
          if (q > 0) { ctx.save(); ctx.scale(q, q); D.text(ctx, '？', 0, 0, { size: 230, color: '#ff4d5e', stroke: '#fff', strokeW: 14 }); ctx.restore(); }
          ctx.restore();
        });
        // 放大镜
        const mk = prog(t, tC, t1 - .1);
        if (mk > 0) {
          const mx = 960 + lerp(-750, 750, mk), my = 430 + Math.sin(mk * Math.PI * 6) * 30;
          ctx.save(); ctx.translate(mx, my); ctx.lineWidth = 16; ctx.strokeStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20;
          ctx.beginPath(); ctx.arc(0, 0, 95, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 26; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(68, 68); ctx.lineTo(150, 150); ctx.stroke(); ctx.restore();
        }
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // 13  45.47–53.80 「而库库AI直接对接知网、百度学术这些学术库。作者、发表时间全都列得很清楚，所以文献都有迹可循」
  //     回到查文献录屏：指令里描「知网、百度学术等权威学术数据库」→ 软切到结果页，鼠标划过引用、弹出作者和年份（原速）→ 停在弹窗上推近、框作者和年份
  const RP = [1420, 660, 2380, 1060], tRes = T(48.62);
  scenes.push(fullScene(45.47, T(53.55), {
    // 结果页：鼠标依次划过引用（原速），停在 25.2 秒那个弹窗上（这一帧光标停在上面的引用标签上，不挡作者和年份）
    asset: 'r01', iw: 2560, ih: 1440, src: [[45.47, 4.0, 0], [tRes, 21.8, 1], [tRes + 3.4, 25.2, 0]], cuts: [tRes],
    cam: [[45.47, PR], [tRes, [700, 380, 2500, 960], 0], [tRes + 3.3, [1150, 430, 2450, 860]]],   // 软切时直接到位，不先拉远再推近
    marks: [
      { r: [1928, 768, 2412, 811], at: T(46.39), end: tRes, dur: .5 }, { r: [604, 828, 645, 870], at: T(46.39) + .5, end: tRes },
      { r: [1740, 523, 1842, 566], at: tRes + 3.95, kind: 'box', lw: 4 }, { r: [1855, 523, 1931, 566], at: tRes + 4.2, kind: 'box', lw: 4 },
    ],
  }));

  // 14  53.80–55.95 「单纯检索文献还只是基本操作」真人近景
  scenes.push(anchorFull(T(53.55), T(55.70), { close: true }));

  // 15  55.95–59.25 「更省心的是，可以对文献进行结构化梳理」梳理录屏：贴入梳理指令（原速）→ 推近，马克笔描「做结构化梳理与证据链搭建」
  scenes.push(fullScene(T(55.70), T(59.00), {
    asset: 'r02a', iw: 2560, ih: 1440, src: [[T(55.70), 1.4, 1], [T(55.70) + 1.8, 3.2, 0]],
    cam: [[T(55.70), null], [T(55.70) + 1.6, [480, 1040, 2480, 1300]]],
    marks: [{ r: [1026, 1116, 1454, 1160], at: T(57.72), dur: .5 }],
  }));

  // 16  59.25–66.45 「针对14篇文献建立完整论证框架，还分好了核心论据和补充资料，连研究缺口都给你点出来了」
  //     梳理结果录屏：开头一段推近（描「14 篇文献」「四段论证」，框「核心论据与补充资料」）→ 拉远、往下滚到实践效果（1.3 倍）→ 推近描研究缺口
  {
    const t0 = T(59.00), tS = T(63.20), tG = tS + (10.77 - 9.4) / 1.3;   // tG ≈ 64.5：「研究缺口」那句刚好整句在画面里
    scenes.push(fullScene(t0, SEG3, {
      asset: 'r02b', iw: 2560, ih: 1440, src: [[t0, .5, 0], [tS, 9.4, 1.3], [tG, 10.77, 0]], cuts: [tS],
      cam: [[t0, [520, 560, 2480, 730], 0], [tS, null, 0], [tG, [549, 470, 2449, 590], .6]],
      marks: [
        { r: [866, 609, 1023, 654], at: T(59.38), end: tS }, { r: [1104, 609, 2064, 654], at: T(60.30), dur: 1.0, end: tS },
        { r: [1355, 668, 1665, 714], at: T(62.40), end: tS, kind: 'box', lw: 3 },
        { r: [1624, 479, 2448, 521], at: tG + .05, dur: .5 }, { r: [549, 539, 1167, 581], at: tG + .55, dur: .35 },
      ],
    }));
  }

  /* ================= 第 3 段：② 出报告 ================= */

  // C 66.45–67.65 停顿：章节卡「② 出报告」亮起（① 已讲、③ 压暗），重击同帧
  const CH2_HIT = 66.65;
  scenes.push({ t0: SEG3, t1: 67.65, draw(ctx, t) { D.bg(ctx, t, { c2: 'rgba(245,223,39,.35)' }); navDraw(ctx, t, SEG3 - .4, [-1, -1, -1], 1, { hit: CH2_HIT }); } });

  // 17  67.65–70.48 「有了完整的证据链，出报告就水到渠成了」真人
  scenes.push(anchorFull(67.65, T(69.30)));

  // 18  70.48–77.78 「这里我们直接召唤教学设计专家，围绕这个课题，再结合前面的工作成果，给一份符合教研规范的报告」
  //     报告录屏：+ → 召唤专家 → 教学设计专家（原速，推近菜单）→ 软切到发出的指令，推近，马克笔描重点
  {
    const t0 = T(69.30), tP = T(71.74);
    scenes.push(fullScene(t0, T(76.60), {
      // 录屏：鼠标 2.45 秒移到「教学设计专家」、2.85 秒点下去；对齐到口播说「教学设计专家」那几个字（T(70.51) 起）
      asset: 'r03', iw: 2560, ih: 1440, src: [[t0, .8, (2.45 - .8) / (T(70.51) - t0)], [T(70.51), 2.45, 1], [T(70.51) + .33, 2.78, 0], [tP, 6.0, 0]], cuts: [tP],   // 2.78 秒：鼠标在「教学设计专家」上点下（下一帧菜单就收起了）
      cam: [[t0, null], [t0 + .5, [520, 820, 1520, 1360]], [tP, [1135, 455, 2500, 800], 0]],
      marks: [
        { r: [1240, 1107, 1240, 1107], at: T(70.51) + .33, end: tP, kind: 'click' },
        { r: [2089, 493, 2455, 536], at: tP + .75 }, { r: [1157, 553, 1650, 595], at: tP + 1.0 },
        { r: [1157, 493, 1640, 536], at: T(72.95), dur: .5 }, { r: [1531, 672, 1877, 716], at: T(75.00), dur: .4 },
      ],
    }));
  }

  // 19  77.78–80.80 「不过有一说一，我的高数早就还给老师了」真人近景
  scenes.push(anchorFull(T(76.60), T(79.62), { close: true }));

  // 20  80.80–92.0 「但单看这份报告的结构逻辑，就知道它不是东拼西凑，而是顺着这个逻辑线铺下来的。参考文献里哪些支撑核心结论，哪些是拓展参考，也都分得清清楚楚」
  //     先定格在报告标题 + 「一、教研背景」，再慢慢往下翻（0.75 倍）；说「逻辑线」时背景虚化压暗，画出「发现问题 → 解析本质 → 给出方案 → 预判效果」；
  //     说「参考文献里哪些支撑核心结论」时推近定格到参考文献、框核心论据，说「哪些是拓展参考」时移到补充资料再框
  {
    const t0 = T(79.62), tL = T(83.32), tJ = T(85.62), tR = T(85.80), tE = T(87.62);
    const LOGIC = [['发现问题', '一、教研背景', '#2388FF'], ['解析本质', '二、概念几何解析', '#8b5cf6'], ['给出方案', '三、教学设计方案', '#F5DF27'], ['预判效果', '四、教学效果预判', '#39C872']];
    scenes.push(fullScene(t0, SEG4, {
      asset: 'r03', iw: 2560, ih: 1440,
      src: [[t0, 9.0, 0], [t0 + .95, 9.0, .75], [tL, 9.0 + (tL - t0 - .95) * .75, 1.6], [tJ, 16.0, 0]],
      dim: [tL, tR - .25],
      cam: [[t0, null], [tR, CORE, .6], [tE, SUPP, .6]],
      marks: [{ r: BOX_CORE, at: tR + .65, kind: 'box' }, { r: BOX_SUPP, at: tE + .65, kind: 'box' }],
      over(ctx, t) {
        const W = 340, H = 168, G = 76, x0 = 960 - (4 * W + 3 * G) / 2, y = 470;
        LOGIC.forEach(([name, sec, col], i) => {
          const ta = tL + .15 + i * .42, k = ease.back(prog(t, ta, ta + .32)); if (k <= 0) return;
          const x = x0 + i * (W + G);
          if (i > 0) {   // 箭头：从上一个画到这一个
            const ap = ease.out(prog(t, ta - .2, ta + .05)), ax = x - G + 12, bx = ax + (G - 24) * ap;
            ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(bx, y); ctx.stroke();
            if (ap > .9) { ctx.beginPath(); ctx.moveTo(bx - 16, y - 14); ctx.lineTo(bx, y); ctx.lineTo(bx - 16, y + 14); ctx.stroke(); }
            ctx.restore();
          }
          ctx.save(); ctx.translate(x + W / 2, y); ctx.scale(k, k);
          ctx.shadowColor = col; ctx.shadowBlur = 36; D.rr(ctx, -W / 2, -H / 2, W, H, 26); ctx.fillStyle = 'rgba(20,20,32,.9)'; ctx.fill();
          ctx.shadowBlur = 0; ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
          D.text(ctx, name, 0, -20, { size: 64, color: '#fff', shadow: false });
          D.text(ctx, sec, 0, 46, { size: 34, color: col, shadow: false });
          ctx.restore();
        });
      },
    }));
  }

  /* ================= 第 4 段：③ 做课件 + 沉淀 Skill + 手机远程 ================= */

  // C 92.0–93.2 停顿：章节卡「③ 做课件」亮起（①② 已讲），重击同帧
  const CH3_HIT = 92.2;
  scenes.push({ t0: SEG4, t1: 93.20, draw(ctx, t) { D.bg(ctx, t, { c2: 'rgba(57,200,114,.35)' }); navDraw(ctx, t, SEG4 - .4, [-1, -1, -1], 2, { hit: CH3_HIT }); } });

  // 21  93.20–96.62 「最后我们就能做出开头那个能拖能转的3D课件」3D 课件录屏：滑块转动切平面（原速），推近第二个模块
  scenes.push(fullScene(93.20, T(94.60), {
    asset: 'r08', iw: 1992, ih: 1440, src: [[93.20, 4.2, 0]], layers: [modLayer('m1', 1.0), modLayer('m2', 1.4)],
    cam: [[93.20, null], [93.9, M12, 1.0]],
  }));

  // 22  96.62–102.87 「直接调用「离线互动科学仿真HTML生成」这个技能，让它生成配套的3D交互课件」
  //     课件录屏原速连贯：+ → 召唤技能 → 框出「离线互动科学仿真…」→ 输入框出现技能、贴入指令 → 发送
  scenes.push(fullScene(T(94.60), T(100.85), {
    asset: 'r04', iw: 2560, ih: 1440, src: [[T(94.60), .6, 1]],
    cam: [[T(94.60), null], [T(94.60) + .6, [560, 540, 1500, 1320]], [T(94.60) + 3.0, [540, 940, 2500, 1390]], [T(94.60) + 4.6, null]],
    marks: [{ r: [1106, 699, 1366, 755], at: T(95.47), end: T(94.60) + 3.0, kind: 'box', lw: 4 }],
  }));

  // 23  102.87–109.42 「它把三个知识点整合在了同一个三维曲面里，拖动锚点或滑块，抽象概念的几何本质」
  //     全屏课件 → 三个交互模块从原位置被提取出来、放大并排到画面上半部分，背景全屏课件虚化压暗；01、02、03 同时在动
  {
    const t0 = T(100.85), t1 = T(107.40), tX = t0 + .45, PW = 582, PH = PW * 562 / 533, PG = 40, PY = 140;
    const NAMES = ['m1', 'm2', 'm3'];
    scenes.push({
      kind: 'full', t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        let a = ease.out(prog(t, t0, t0 + .35)) * (1 - prog(t, t1 - .22, t1));
        const k = ease.inOut(prog(t, tX, tX + .75));
        const base = E.video('r08', 4.2, 0), mv = NAMES.map((n, i) => E.video(n, (t - t0 + [0, .8, 0][i]) % MOD[n].len, 1));
        ctx.save(); ctx.globalAlpha = a;
        const g = D.recFull(ctx, t, base, 1992, 1440, { layers: NAMES.map((n, i) => ({ el: mv[i], r: MOD[n].r })) });
        if (k > 0 && base) {
          ctx.save(); ctx.globalAlpha = a * k; ctx.drawImage(D._blurred(base, base.videoWidth || 1494, base.videoHeight || 1080), g.dx, g.dy, 1992 * g.sc, 1440 * g.sc);
          ctx.fillStyle = 'rgba(8,8,16,.6)'; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
          NAMES.forEach((n, i) => {
            const c = CARD[n], m = MOD[n], el = mv[i]; if (!el) return;
            const from = [g.dx + c[0] * g.sc, g.dy + c[1] * g.sc, (c[2] - c[0]) * g.sc, (c[3] - c[1]) * g.sc];
            const to = [960 - (3 * PW + 2 * PG) / 2 + i * (PW + PG), PY, PW, PH];
            const kk = ease.inOut(prog(t, tX + i * .08, tX + i * .08 + .75));
            const [x, y, w, h] = from.map((v, j) => lerp(v, to[j], kk));
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40 * kk; ctx.shadowOffsetY = 14 * kk;
            D.rr(ctx, x, y, w, h, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
            D.rr(ctx, x, y, w, h, 16); ctx.clip();
            const sw = el.videoWidth || 556, sh = el.videoHeight || 840, fx = sw / (m.r[2] - m.r[0]), fy = sh / (m.r[3] - m.r[1]);
            ctx.drawImage(el, (c[0] - m.r[0]) * fx, (c[1] - m.r[1]) * fy, (c[2] - c[0]) * fx, (c[3] - c[1]) * fy, x, y, w, h);
            ctx.restore();
            ctx.save(); ctx.globalAlpha = a * kk; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.9)'; D.rr(ctx, x, y, w, h, 16); ctx.stroke(); ctx.restore();
          });
        }
        ctx.restore();
        pip(ctx, t, E, t0, t1);
      },
    });
  }

  // 24  109.42–111.37 「一眼就能看明白。整个流程走下来」真人近景
  scenes.push(anchorFull(T(107.40), T(109.80), { close: true }));

  // 25  111.37–115.47 「还能沉淀成个人专属Skill，后续可以一键复用」沉淀技能录屏：贴入指令 → 软切到「已成功创建并注册」（推近描）→ 软切到我的技能 → 使用 → 输入框出现模板（框）
  {
    const t0 = T(109.80), c1 = t0 + 1.1, c2 = T(112.16);
    scenes.push(fullScene(t0, T(114.22), {
      asset: 'r05', iw: 2560, ih: 1440, src: [[t0, 1.2, 1], [c1, 5.2, 0], [c2, 12.6, 1.15]], cuts: [c1, c2],
      cam: [[t0, null], [c1, [500, 560, 1800, 900], 0], [c2, null, 0]],
      marks: [{ r: [552, 633, 1417, 675], at: c1 + .55, end: c2, dur: .5 }, { r: [596, 700, 875, 754], at: c2 + 1.52, kind: 'box', lw: 4 }],
    }));
  }

  // 26  115.47–121.95 「就算出门在外，手机也可以直接远程操作电脑干活，工作照样继续跑，不用守在电脑旁边」
  //     手机录屏（竖屏，加外框）原速连贯：输入指令发送 → PPT 生成完成 → 翻看 PPT
  {
    const t0 = T(114.22), R = 1.034, at = c => t0 + c / R;            // c：手机录屏里的秒数
    const PH = 920, PY = 22, k = PH / 1560 / 2, px = 960 - 720 * PH / 1560 / 2;   // 手机屏幕在画面上的位置；k：原录屏（1440 宽）→ 画面
    const P = (x, y) => [px + x * k, PY + y * k];
    // 左：手机发出的指令；右：电脑端完成的结果 + 生成的 PPT 页面（都从手机录屏里裁出来，放大展示）
    const CARDS = [
      { img: 'ph_a', at: at(2.45), x: 36, y: 190, w: 660, label: '手机发出指令', col: '#2388FF', from: P(1395, 527), side: 'L' },
      { img: 'ph_b', at: at(3.2), x: 1224, y: 230, w: 660, label: '电脑端自动完成', col: '#39C872', from: P(40, 695), side: 'R' },
      { img: 'ph_c', at: at(4.4), x: 1224, y: 410, w: 660, label: null, col: '#39C872', from: P(1440, 1953), side: 'R' },
    ];
    scenes.push(fullScene(t0, SEG5, {
      asset: 'c07', iw: 720, ih: 1560, src: [[t0, 0, R]], phoneH: PH, phoneY: PY,
      after(ctx, t, E) {
        for (const c of CARDS) {
          const k1 = ease.out(prog(t, c.at, c.at + .5)); if (k1 <= 0) continue;
          const im = E.image(c.img); if (!im) continue;
          const h = c.w * im.height / im.width, dx = (1 - k1) * (c.side === 'L' ? 40 : -40);
          const ex = c.side === 'L' ? c.x + c.w + dx : c.x + dx, ey = c.y + h / 2;
          // 引线：从手机里对应的位置连到卡片
          const lp = ease.out(prog(t, c.at, c.at + .35));
          ctx.save(); ctx.globalAlpha *= .75; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(c.from[0], c.from[1]); ctx.lineTo(lerp(c.from[0], ex, lp), lerp(c.from[1], ey, lp)); ctx.stroke();
          ctx.setLineDash([]); ctx.fillStyle = c.col; ctx.shadowColor = c.col; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(c.from[0], c.from[1], 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          // 卡片
          ctx.save(); ctx.globalAlpha *= k1; ctx.translate(dx, 0);
          ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
          D.rr(ctx, c.x, c.y, c.w, h, 18); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.save(); D.rr(ctx, c.x, c.y, c.w, h, 18); ctx.clip(); ctx.drawImage(im, c.x, c.y, c.w, h); ctx.restore();
          ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.55)'; D.rr(ctx, c.x, c.y, c.w, h, 18); ctx.stroke();
          if (c.label) {   // 卡片上方的小标签
            ctx.font = '600 34px "KTitle", "PingFang SC", sans-serif'; const tw = ctx.measureText(c.label).width + 56;
            D.rr(ctx, c.x, c.y - 66, tw, 52, 26); ctx.fillStyle = c.col; ctx.fill();
            D.text(ctx, c.label, c.x + tw / 2, c.y - 38, { size: 34, color: '#fff', shadow: false });
          }
          ctx.restore();
        }
      },
    }));
  }

  /* ================= 第 5 段：结尾 ================= */

  // 27  121.95–124.10 「AI能力真的是已经今非昔比了」真人
  scenes.push(anchorFull(SEG5, T(123.15)));

  /** 三步卡片（查文献 / 出报告 / 做课件）横排；at[i] 出现时间 */
  function stepRow(ctx, t, at, o = {}) {
    const cw = o.cw || 330, ch = o.ch || 150, gap = o.gap || 92, cy = o.cy || 470, x0 = (o.cx || 1080) - (3 * cw + 2 * gap) / 2;
    NAV.forEach(([name, col], i) => {
      const k = ease.back(prog(t, at[i], at[i] + .35)); if (k <= 0) return;
      const cx = x0 + i * (cw + gap) + cw / 2;
      if (i > 0) {   // 箭头
        const ak = prog(t, at[i] - .1, at[i] + .2), ax = cx - cw / 2 - gap + 12, aw = (gap - 24) * ak;
        ctx.save(); ctx.strokeStyle = '#b9ff00'; ctx.fillStyle = '#b9ff00'; ctx.lineWidth = 8; ctx.shadowColor = '#b9ff00'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(ax, cy); ctx.lineTo(ax + aw, cy); ctx.stroke();
        if (ak > .9) { ctx.beginPath(); ctx.moveTo(ax + aw + 6, cy); ctx.lineTo(ax + aw - 16, cy - 16); ctx.lineTo(ax + aw - 16, cy + 16); ctx.fill(); }
        ctx.restore();
      }
      ctx.save(); ctx.translate(cx, cy + (1 - k) * 60); ctx.scale(k, k); ctx.globalAlpha = clamp(k * 1.5) * (o.alpha == null ? 1 : o.alpha);
      ctx.shadowColor = col; ctx.shadowBlur = 40; D.rr(ctx, -cw / 2, -ch / 2, cw, ch, 24); ctx.fillStyle = 'rgba(16,16,26,.92)'; ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 7; ctx.strokeStyle = col; ctx.stroke();
      ctx.beginPath(); ctx.arc(-cw / 2 + 62, 0, 34, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.stroke();
      D.text(ctx, String(i + 1), -cw / 2 + 62, 3, { size: 46, color: col, shadow: false });
      D.text(ctx, name, 38, 4, { size: 72, color: '#fff' });
      ctx.restore();
    });
  }

  // 28  124.10–128.10 「从单点回答问题，到承接一整套专业的工作流」一个问答气泡 → 三步工作流串起来
  {
    const t0 = T(123.15), t1 = T(127.15), tB = T(123.25), tMove = T(124.45), AT = [T(124.75), T(125.29), T(125.77)];
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c1: 'rgba(139,92,246,.35)', c2: 'rgba(185,255,0,.14)' });
        // 气泡：先在中间弹出，再缩到左边变暗
        const k = ease.back(prog(t, tB, tB + .35)), mv = ease.inOut(prog(t, tMove, tMove + .45));
        if (k > 0) {
          const bx = lerp(960, 250, mv), by = lerp(440, 470, mv), s = k * lerp(1.25, .72, mv);
          ctx.save(); ctx.translate(bx, by); ctx.scale(s, s); ctx.globalAlpha = lerp(1, .55, mv);
          ctx.shadowColor = 'rgba(139,92,246,.8)'; ctx.shadowBlur = 50;
          D.rr(ctx, -150, -110, 300, 200, 50); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.moveTo(-70, 88); ctx.lineTo(-110, 140); ctx.lineTo(-20, 88); ctx.fill();
          D.text(ctx, '？', 0, -6, { size: 170, color: '#7c3aed', shadow: false });
          ctx.restore();
        }
        stepRow(ctx, t, AT, { cx: 1130, cw: 330, gap: 86 });
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // 29  128.10–129.70 「变化呢是肉眼可见」真人近景
  scenes.push(anchorFull(T(127.15), T(128.75), { close: true }));

  // 30  129.70–134.5 「从文献整理，到专业的研究报告，再到立体交互式课件」三张成果窗口随口播依次出现 → 收拢飞向右上角
  {
    const t0 = T(128.75), tIn = T(133.16), t1 = tIn, tOne = T(134.06);
    const SHOTS = [['sort0', T(128.83), 0], ['rp_h1', T(129.79), 1], ['c08still', T(130.87), 2]];
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        const g = ease.inOut(prog(t, tIn - .4, tIn));   // 收拢：飞向右上角（下一个画面 logo 出现的位置）
        const w = 560, h = 315, gap = 50, y = 300;
        SHOTS.forEach(([n, at, i]) => {
          const k = ease.back(prog(t, at, at + .4)); if (k <= 0) return;
          const im = E.image(n), cx0 = 960 + (i - 1) * (w + gap), cx = lerp(cx0, 1560, g), s = k * lerp(1, .2, g);
          ctx.save(); ctx.translate(cx, lerp(y + h / 2, 330, g) + (1 - k) * 60); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 1.5) * (1 - g);
          ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; D.rr(ctx, -w / 2, -h / 2, w, h, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
          ctx.save(); D.rr(ctx, -w / 2, -h / 2, w, h, 16); ctx.clip(); if (im) { const kk = Math.max(w / im.width, h / im.height); ctx.drawImage(im, -im.width * kk / 2, -h / 2, im.width * kk, im.height * kk); } ctx.restore();
          ctx.lineWidth = 6; ctx.strokeStyle = NAV[i][1]; D.rr(ctx, -w / 2, -h / 2, w, h, 16); ctx.stroke();
          ctx.restore();
          // 下面的步骤名（徽章）
          const b = ease.back(prog(t, at + .15, at + .5)) * (1 - g);
          if (b > 0) { ctx.save(); ctx.translate(cx, y + h + 80); ctx.scale(b, b); D.rr(ctx, -120, -44, 240, 88, 44); ctx.fillStyle = NAV[i][1]; ctx.fill(); D.text(ctx, NAV[i][0], 0, 4, { size: 56, color: i === 1 ? '#15151c' : '#fff', shadow: false }); ctx.restore(); }
        });
        pip(ctx, t, E, t0, t1);
      },
    });
  }

  // 31  134.5–138.65 「库库AI一款工具就能一站式落地。这才是专业AI办公该有的样子」真人；logo 直接出现在右边空白处 + 三色光带（不单独开画面）
  scenes.push(anchorFull(T(133.16), T(137.70), { extra: (ctx, t, E) => logoOn(ctx, t, E, T(133.16) + .08, T(137.70), { cx: 1560, cy: 330, w: 560, band: T(134.06) }) }));

  // 46  138.65–141.25（10-20：左边网页端换成阿亮给的网页版截图） 「这个工具网页端和桌面端都能用」浏览器 + 桌面窗口，名字随口播弹出
  {
    const t0 = T(137.70), t1 = T(140.30), tW = T(138.48), tD = T(139.08);
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        const w = 800, h = 450;
        [[540, tW, '网页端', true], [1380, tD, '桌面端', false]].forEach(([cx, ta, name, browser], i) => {
          const k = ease.out(prog(t, t0 + i * .12, t0 + i * .12 + .4)); if (k <= 0) return;
          const x = cx - w / 2, y = 150 + (1 - k) * 80, top = browser ? 46 : 0;
          ctx.save(); ctx.globalAlpha = clamp(k * 1.4);
          ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
          D.rr(ctx, x, y - top, w, h + top, 16); ctx.fillStyle = browser ? '#e9e9ef' : '#fff'; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          if (browser) {   // 浏览器标题栏：三个点 + 地址栏
            [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(([c, j]) => { ctx.beginPath(); ctx.arc(x + 26 + j * 22, y - 23, 7, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
            D.rr(ctx, x + 110, y - 36, w - 140, 26, 13); ctx.fillStyle = '#fff'; ctx.fill();
          }
          const im = E.image(browser ? 'k_web' : 'k_home');   // 网页端：阿亮给的网页版截图（10-20）
          ctx.save(); D.rr(ctx, x, y, w, h, browser ? 0 : 16); ctx.clip(); if (im) { const k = Math.max(w / im.width, h / im.height); ctx.drawImage(im, x + (w - im.width * k) / 2, y, im.width * k, im.height * k); } ctx.restore();
          D.rr(ctx, x, y - top, w, h + top, 16); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.stroke();
          ctx.restore();
          // 名字徽章
          const b = ease.back(prog(t, ta, ta + .35));
          if (b > 0) {
            ctx.save(); ctx.translate(cx, 735); ctx.scale(b, b);
            D.rr(ctx, -150, -52, 300, 104, 52); ctx.fillStyle = i ? '#39C872' : '#2388FF'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
            D.text(ctx, name, 0, 4, { size: 66, color: '#fff' });
            ctx.restore();
          }
        });
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // 47  141.25–147.0 「好了，以上就是本期视频的全部内容……我是阿亮，我们下期再见」真人，最后淡出
  {
    const A = anchorFull(T(140.30), DUR, { xout: 0 });
    scenes.push({ t0: A.t0, t1: A.t1, kind: 'anchor', close: false, fadeOut: .7, draw(ctx, t, E) { A.draw(ctx, t, E); const f = prog(t, DUR - .7, DUR); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, 1920, 1080); } } });
  }

  /* ---------- 音频 ---------- */
  const audio = [];
  VOICE.forEach(([a, b, t]) => audio.push({ asset: 'voice', at: t, from: a, dur: b - a, gain: 1, fadeIn: .02, fadeOut: .03 }));
  // 阿亮 10-21：去掉配乐和音效，只保留口播

  /* ---------- 字幕叠加 ---------- */
  function overlay(ctx, t) {
    for (const [a, b, s] of SUBS) if (t >= a && t < b) { D.subtitle(ctx, s, 1); break; }
  }

  const assets = {
    anchor: { type: 'video', src: { mp4: A + 'anchor.mp4', webm: A + 'anchor.webm' } },
    // 原始录屏（1080p 全屏版，prep_full.sh 打码 + 转码）
    r01: { type: 'video', src: { mp4: A + 'r01.mp4', webm: A + 'r01.webm' } }, r02a: { type: 'video', src: { mp4: A + 'r02a.mp4', webm: A + 'r02a.webm' } }, r02b: { type: 'video', src: { mp4: A + 'r02b.mp4', webm: A + 'r02b.webm' } },
    r03: { type: 'video', src: { mp4: A + 'r03.mp4', webm: A + 'r03.webm' } }, r04: { type: 'video', src: { mp4: A + 'r04.mp4', webm: A + 'r04.webm' } }, r05: { type: 'video', src: { mp4: A + 'r05.mp4', webm: A + 'r05.webm' } },
    r08: { type: 'video', src: { mp4: A + 'r08.mp4', webm: A + 'r08.webm' } }, c07: { type: 'video', src: { mp4: A + 'c07.mp4', webm: A + 'c07.webm' } },
    gs1: { type: 'image', src: A + 'gs1.jpg' }, gs2: { type: 'image', src: A + 'gs2.jpg' },
    gs3: { type: 'image', src: A + 'gs3.jpg' }, gs4: { type: 'image', src: A + 'gs4.jpg' },
    sort0: { type: 'image', src: A + 'sort0.jpg' }, rp_h1: { type: 'image', src: A + 'rp_h1.jpg' }, c08still: { type: 'image', src: A + 'c08still.jpg' },
    k_home: { type: 'image', src: A + 'k_home.jpg' }, ph_a: { type: 'image', src: A + 'ph_a.png' }, ph_b: { type: 'image', src: A + 'ph_b.png' }, ph_c: { type: 'image', src: A + 'ph_c.jpg' }, k_web: { type: 'image', src: A + 'k_web.png' },
    logo: { type: 'image', src: A + 'logo.png' },
    voice: { type: 'audio', src: A + 'voice.mp3' },
    m1: { type: 'video', src: { mp4: A + 'm1.mp4', webm: A + 'm1.webm' } }, m2: { type: 'video', src: { mp4: A + 'm2.mp4', webm: A + 'm2.webm' } }, m3: { type: 'video', src: { mp4: A + 'm3.mp4', webm: A + 'm3.webm' } },
  };
  // 抠好背景的 3D 空镜（key_3d.py，20 帧/秒）
  for (let i = 0; i < 68; i++) assets['k3d' + i] = { type: 'image', src: A + `k3d/k3d_${String(i).padStart(3, '0')}.webp` };

  /* ---------- 剪掉的空档（成片时间轴上整段去掉，后面的画面、口播、字幕整体往前接） ----------
   * 10-21：「叫库库AI的工具」和「我拿来一试」之间原来插了 1 秒停顿给 logo，现在 logo 直接在说「库库AI」时出现，
   *        停顿去掉，只留两句之间自然的 0.18 秒换气。上面的时间都还是去掉之前的，这里统一换算。 */
  const CUTS = [[19.05, 19.87]];
  const ext = t => { let d = 0; for (const [a, b] of CUTS) { if (t >= b) d += b - a; else if (t > a) d += t - a; } return t - d; };   // 剪之前 → 剪之后
  const int = t => { for (const [a, b] of CUTS) if (t >= a) t += b - a; return t; };                                                      // 剪之后 → 剪之前
  const scenesOut = scenes.map(sc => Object.assign(Object.create(sc), { t0: ext(sc.t0), t1: ext(sc.t1), draw: (ctx, t, E) => sc.draw(ctx, int(t), E, sc) }))
    .filter(sc => sc.t1 - sc.t0 > 1e-3);
  const audioOut = audio.map(a => Object.assign({}, a, { at: ext(a.at) }));
  const overlayOut = (ctx, t, E) => overlay(ctx, int(t), E);

  window.PROJECT = {
    title: '库库AI_第1-5段_完整版', width: 1920, height: 1080, duration: ext(DUR),
    fonts: [{ family: 'KTitle', src: A + 'title.woff' }, { family: 'KSub', src: A + 'sub.woff' }],
    assets, scenes: scenesOut, overlay: overlayOut, audio: audioOut, silence: A + 'silence.mp3',
    // 自查用：关键时间点
    checks: [1.0, 2.6, 4.6, 6.0, 7.6, 13.0, 15.0, 33.8, 47.0, 51.0, 53.0, 58.2, 60.8, 65.4, 71.5, 74.5, 84.0, 90.0, 94.3, 97.5, 99.5, 103.4, 106.6, 111.6, 113.8, 118.0, 131.5, 135.0, 139.5],
    sections: [[0, '第 1 段 · 开头'], [ext(SEG2), '第 2 段 · 查文献'], [ext(SEG3), '第 3 段 · 出报告'], [ext(SEG4), '第 4 段 · 做课件'], [ext(SEG5), '第 5 段 · 结尾']],
    SUBS, T: v => ext(T(v)), V: t => V(int(t)), ext, int,
  };
})();
