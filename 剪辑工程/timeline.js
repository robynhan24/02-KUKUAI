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
  function anchorV(t) {
    let v = V(t);
    if (v == null) { for (const [a, , t0] of VOICE) if (t >= t0) v = a + (t - t0); }
    return v;
  }
  function anchorEl(E, t) { const v = anchorV(t); return v == null ? null : E.video('anchor', v); }
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
    if (D.noPip) return;
    const k = ease.back(prog(t, t0, t0 + .35)) * (1 - ease.out(prog(t, t1 - .2, t1)));
    if (k <= 0) return;
    ctx.save(); ctx.translate(PIP.x, PIP.y); ctx.scale(k, k);
    D.pip(ctx, anchorEl(E, t), pipSrc(anchorV(t)), 0, 0, PIP.d);
    ctx.restore();
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
        ctx.drawImage(el, g.x, g.y, g.w, g.h);
        // 进场：0.18 秒白闪 / 推近，避免硬切
        const f = 1 - prog(t, t0, t0 + .18); if (f > 0 && o.flash !== false) { ctx.fillStyle = `rgba(255,255,255,${.35 * f})`; ctx.fillRect(0, 0, 1920, 1080); }
      },
    };
  }

  /* ---------- 场景 ---------- */
  const scenes = [];

  // ① 0–1.95 「来，老师、科研党们，都看过来！」真人开场
  scenes.push(anchorFull(0, 1.95, { flash: false }));

  /** 整屏录屏场景（阿亮 10-20：录屏全显 ≈1680×945；讲到重点时局部放大，背景虚化压暗）
   *  get(t, E) 返回 {el, iw, ih, focus:[...]}；窗口从右侧甩进来，左下角主播小圆窗 */
  function recScene(t0, t1, get, o = {}) {
    return {
      kind: 'rec', get, opts: o,
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, o.bg);
        const R = get(t, E), inK = o.noIn ? 1 : ease.out(prog(t, t0, t0 + .32));
        ctx.save(); ctx.translate(960 + (1 - inK) * 1100, 508); ctx.rotate((1 - inK) * .06); ctx.translate(-960, -508);
        D.rec(ctx, t, R.el, R.iw, R.ih, { focus: R.focus });   // 竖屏自动按手机画（外框 + 虚化铺底）
        ctx.restore();
        pip(ctx, t, E, t0 + .05, t1);
      },
    };
  }
  const lerpR = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

  // ② 1.95–4.93 「你看AI制作的这个3D高数课件，能拖、能转」3D 课件整屏录屏 → 放大被拖动的曲面
  scenes.push(recScene(1.95, 4.93, (t, E) => ({
    el: E.video('c08', t - 1.95), iw: 1992, ih: 1440,
    focus: [{ at: 2.75, r: [150, 700, 720, 1160], maxH: 760 }],
  })));

  // ③ 4.93–8.17 「还配了一份文献出处标得清清楚楚的教研报告」报告整屏 → 放大参考文献，逐条涂黄
  {
    const O = [450, 150], HL = [ // 参考文献页里的行（截图坐标）
      [214, 254, 98, 278, T(5.75)],
      [410, 450, 100, 1390, T(6.50)], [470, 509, 100, 1466, T(6.78)], [529, 568, 100, 1154, T(7.02)],
      [589, 628, 100, 1446, T(7.26)], [648, 687, 100, 1595, T(7.50)],
    ];
    scenes.push(recScene(4.93, 8.17, (t, E) => ({
      el: E.image('ref'), iw: 2560, ih: 1440,
      focus: [{ at: T(5.45), r: [520, 340, 2080, 860], marks: HL.map(([y0, y1, x0, x1, at]) => ({ r: [x0 + O[0], y0 + O[1] - 4, x1 + O[0], y1 + O[1] + 4], at })) }],
    }), { bg: { c1: 'rgba(245,223,39,.18)' } }));
  }

  // ④ 8.17–11.99 「前阵子有位老师在评论区吐槽，他在做一个高数教研专题」真人讲故事
  scenes.push(anchorFull(8.17, 11.99));

  // ⑤ 11.99–14.07 「但文献怎么理都理不顺」一堆文献截图乱飞 + 红笔乱线
  {
    const t0 = 11.99, t1 = 14.07;
    const CARDS = [ // 图, 中心x, 中心y, 角度, 进场延迟
      ['lit1', 760, 420, -.10, 0], ['lit3', 1180, 520, .08, .18], ['lit2', 820, 640, .06, .36], ['lit4', 1220, 380, -.07, .52],
    ];
    let scrib = null;
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c1: 'rgba(233,66,84,.22)' });
        const shake = Math.sin(t * 41) * 3;
        for (const [n, cx, cy, ang, dl] of CARDS) {
          const k = ease.back(prog(t, t0 + dl, t0 + dl + .3)); if (k <= 0) continue;
          ctx.save(); ctx.translate(cx + (1 - k) * (cx > 960 ? 700 : -700) + shake, cy); ctx.rotate(ang * k + Math.sin(t * 3 + cx) * .01);
          const w = 980, h = w * 1440 / 2560;
          ctx.globalAlpha = clamp(k * 1.2);
          D.win(ctx, E.image(n), [0, 0, 2560, 1440], -w / 2, -h / 2, w, h, { r: 18 });
          ctx.restore();
        }
        // 「理不顺」：红笔乱线
        if (!scrib) { scrib = []; for (let i = 0; i <= 140; i++) { const a = i * .2; scrib.push([960 + 430 * Math.sin(a * 1.7) * Math.cos(a * .31), 500 + 240 * Math.sin(a * 2.3 + 1) * Math.cos(a * .17)]); } }
        const p = prog(t, T(13.85), T(14.45));
        if (p > 0) {
          ctx.save(); ctx.strokeStyle = '#ff3b4e'; ctx.lineWidth = 12; ctx.lineCap = ctx.lineJoin = 'round';
          ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 12; ctx.beginPath();
          const n = Math.max(2, Math.floor(scrib.length * p));
          ctx.moveTo(...scrib[0]); for (let i = 1; i < n; i++) ctx.lineTo(...scrib[i]); ctx.stroke(); ctx.restore();
        }
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // ⑥ 14.07–16.11 「3D课件呢更是无从下手」空空的三维坐标系 + 大问号
  {
    const t0 = 14.07, t1 = 16.11;
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c1: 'rgba(57,200,114,.18)' });
        // 课件的影子：压暗、去色
        const ghost = E.image('c08still');
        if (ghost) { ctx.save(); ctx.globalAlpha = .12; ctx.filter = 'grayscale(1) blur(3px)'; ctx.drawImage(ghost, 0, 0, 1992, 1440, 360, 90, 1200, 867); ctx.restore(); }
        // 空坐标轴：三根轴慢慢转
        const k = ease.out(prog(t, t0, t0 + .5)), rot = (t - t0) * .5 + .6, O = [760, 610];
        const P3 = (x, y, z) => [O[0] + (x * Math.cos(rot) - y * Math.sin(rot)) * 300, O[1] - z * 300 + (x * Math.sin(rot) + y * Math.cos(rot)) * 110];
        ctx.save(); ctx.lineWidth = 8; ctx.lineCap = 'round';
        for (const [v, c] of [[[1.2, 0, 0], '#2388ff'], [[0, 1.2, 0], '#39c872'], [[0, 0, 1.15], '#f5df27']]) {
          const e = P3(...v.map(q => q * k)); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(...O); ctx.lineTo(...e); ctx.stroke();
        }
        ctx.setLineDash([14, 16]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.35)';
        for (let i = -1; i <= 1; i += .5) { ctx.beginPath(); ctx.moveTo(...P3(-1, i, 0)); ctx.lineTo(...P3(1, i, 0)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(...P3(i, -1, 0)); ctx.lineTo(...P3(i, 1, 0)); ctx.stroke(); }
        ctx.restore();
        // 「无从下手」：大问号弹出
        const q = ease.back(prog(t, T(15.55), T(15.55) + .35));
        if (q > 0) { ctx.save(); ctx.translate(1330, 470); ctx.scale(q, q); ctx.rotate(Math.sin(t * 6) * .05); D.text(ctx, '？', 0, 0, { size: 420, color: '#f5df27', stroke: '#111', strokeW: 18 }); ctx.restore(); }
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // ⑦ 16.11–18.87 「哎，底下有网友就推荐了一个叫库库AI的工具」真人（近景）
  scenes.push(anchorFull(16.11, 18.87, { close: true }));

  // ⑧ 18.87–19.95 停顿：库库AI logo 单独出场（重击同帧）
  {
    const t0 = 18.87, t1 = 19.95;
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c1: 'rgba(124,58,237,.55)', c2: 'rgba(185,255,0,.18)' });
        const k = prog(t, t0, t0 + .22), s = lerp(2.4, 1, ease.out(k)) + Math.sin(prog(t, t0 + .22, t0 + .5) * Math.PI) * .04;
        // 光环
        const ring = prog(t, t0 + .2, t0 + .9);
        if (ring > 0 && ring < 1) { ctx.save(); ctx.strokeStyle = `rgba(245,223,39,${.8 * (1 - ring)})`; ctx.lineWidth = 14 * (1 - ring) + 2; ctx.beginPath(); ctx.arc(960, 540, 220 + ring * 700, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        const logo = E.tint('logo', '#ffffff'); if (!logo) return;
        const w = 1200 * s, h = w * 249 / 960;
        ctx.save(); ctx.globalAlpha = clamp(k * 3) * (1 - prog(t, t1 - .1, t1));
        ctx.shadowColor = 'rgba(139,92,246,.9)'; ctx.shadowBlur = 60;
        ctx.drawImage(logo, 960 - w / 2, 540 - h / 2, w, h);
        ctx.restore();
        // 扫光
        const sw = prog(t, t0 + .35, t0 + .85);
        if (sw > 0 && sw < 1) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const gx = lerp(960 - w / 2 - 200, 960 + w / 2 + 200, sw), g = ctx.createLinearGradient(gx - 120, 0, gx + 120, 0);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(960 - w / 2, 540 - h / 2, w, h); ctx.restore();
        }
        // 重击白闪
        const fl = 1 - prog(t, t0 + .2, t0 + .4); if (k >= 1 && fl > 0) { ctx.fillStyle = `rgba(255,255,255,${.5 * fl})`; ctx.fillRect(0, 0, 1920, 1080); }
      },
    });
  }

  // ⑨ 19.95–22.79 「我拿来一试，还真能一条龙跑下来」四步流程像传送带一样串起来
  {
    const t0 = 19.95, t1 = 22.79;
    const ITEMS = [['lit1', [0, 0, 2560, 1440]], ['lit3', [0, 0, 2560, 1440]], ['ref', [0, 0, 2560, 1440]], ['c08still', [0, 0, 1992, 1440]]];
    const STEP = [t0 + .05, T(20.75), T(21.35), T(21.95)]; // 每一步移到中间的时间
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c2: 'rgba(57,200,114,.22)' });
        let pos = 0; for (let i = 1; i < STEP.length; i++) pos += ease.inOut(prog(t, STEP[i] - .32, STEP[i]));
        const gap = 1120, w = 1040, h = 600, cy = 470;
        // 串起来的光带
        ctx.save(); ctx.strokeStyle = 'rgba(185,255,0,.65)'; ctx.lineWidth = 8; ctx.shadowColor = '#b9ff00'; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.moveTo(960 - pos * gap, cy); ctx.lineTo(960 + (3 - pos) * gap, cy); ctx.stroke(); ctx.restore();
        const inK = ease.out(prog(t, t0, t0 + .3));
        ITEMS.forEach(([n, src], i) => {
          const d = i - pos, cx = 960 + d * gap + (1 - inK) * 1200, a = Math.abs(d);
          if (cx < -700 || cx > 2620) return;
          const s = lerp(1, .78, clamp(a)), al = lerp(1, .45, clamp(a));
          ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = al;
          D.win(ctx, E.image(n), src, -w / 2, -h / 2, w, h, { r: 22, contain: true, border: a < .5 ? 'rgba(185,255,0,.9)' : undefined });
          ctx.restore();
        });
        pip(ctx, t, E, t0 + .1, t1);
      },
    });
  }

  // ⑩ 22.79–25.69 「那今天我就手把手带你做一个完整的教研专题」真人
  scenes.push(anchorFull(22.79, 25.69));

  // ⑪ 25.69–27.81 「从查文献到出课件」章节导航（秋芝-豆包式编号卡）
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

  // ⑫ 27.81–29.85 「学会以后，从此教研不发愁」真人收尾
  scenes.push(anchorFull(27.81, SEG2));

  /* ================= 第 2 段：① 查文献 ================= */

  // C 29.85–31.05 停顿：章节卡「① 查文献」亮起，②③ 压暗（重击同帧）
  const CH1 = 29.85, CH1_HIT = 30.05;
  scenes.push({ t0: CH1, t1: 31.05, draw(ctx, t) { D.bg(ctx, t, { c2: 'rgba(35,136,255,.45)' }); navDraw(ctx, t, CH1 - .4, [-1, -1, -1], 0, { hit: CH1_HIT }); } });

  // 13  31.05–35.83 「先调用文献检索Skill，让AI围绕这个课题定向检索核心文献」整屏录屏 → 放大技能标签和输入框 → 指令逐句涂黄
  {
    const cut = T(31.30), RA = [560, 570, 1560, 800], RB = [590, 670, 1880, 900];
    scenes.push(recScene(31.05, 35.83, (t, E) => ({
      el: t < cut ? E.video('c01', .25 + (t - 31.05) * 1.1) : E.image('prompt'), iw: 2560, ih: 1440,
      focus: [{
        at: 31.45, r: tt => lerpR(RA, RB, ease.inOut(prog(tt, cut, cut + .4))),
        marks: [{ r: [770, 705, 1850, 755], at: T(31.74), dur: .9 }, { r: [670, 825, 1160, 875], at: T(33.70), dur: .45 }],
      }],
    })));
  }

  // 14  35.83–40.59 「哎，可能有人会说，AI搜文献有啥新鲜的？但用过的都知道」真人
  scenes.push(anchorFull(35.83, T(39.62)));

  // 15  40.59–45.47 「大多数工具搜出来东一头西一头，还得自己挨个核对出处」示意：零散结果卡 + 放大镜挨个查
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

  // 16  45.47–49.18 「而库库AI直接对接知网、百度学术这些学术库」徽章连线
  {
    const t0 = 45.47, t1 = T(48.62), tZ = T(46.39), tB = T(46.87), tL = T(47.83);
    const BADGES = [['知网', 1380, 300, tZ], ['百度学术', 1380, 640, tB]];
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c2: 'rgba(185,255,0,.16)' });
        const lk = ease.back(prog(t, t0, t0 + .35));
        // 连线（流动的点）
        BADGES.forEach(([, bx, by, ta]) => {
          const p = ease.out(prog(t, ta, ta + .35)); if (p <= 0) return;
          const x0 = 820, y0 = 470, x1 = lerp(x0, bx - 250, p), y1 = lerp(y0, by, p);
          const glow = 1 + .6 * Math.max(0, Math.sin(prog(t, tL, tL + .6) * Math.PI));
          ctx.save(); ctx.strokeStyle = '#b9ff00'; ctx.lineWidth = 8 * glow; ctx.shadowColor = '#b9ff00'; ctx.shadowBlur = 24 * glow;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          for (let d = 0; d < 3; d++) { const f = ((t * .9 + d / 3) % 1) * p; ctx.beginPath(); ctx.arc(lerp(x0, x1, f), lerp(y0, y1, f), 11, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
          ctx.restore();
        });
        // 库库AI 徽章
        ctx.save(); ctx.translate(560, 470); ctx.scale(lk, lk);
        D.rr(ctx, -300, -120, 600, 240, 40); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(139,92,246,.8)'; ctx.shadowBlur = 50; ctx.fill(); ctx.shadowBlur = 0;
        const lg = E.image('logo'); if (lg) ctx.drawImage(lg, -230, -60, 460, 460 * 249 / 960);
        ctx.restore();
        // 学术库徽章
        BADGES.forEach(([name, bx, by, ta]) => {
          const k = ease.back(prog(t, ta + .15, ta + .5)); if (k <= 0) return;
          ctx.save(); ctx.translate(bx, by); ctx.scale(k, k);
          D.rr(ctx, -260, -95, 520, 190, 34); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0;
          ctx.lineWidth = 6; ctx.strokeStyle = '#b9ff00'; ctx.stroke();
          D.text(ctx, name, 0, 4, { size: 96, color: '#15151c', shadow: false });
          ctx.restore();
        });
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // 17  49.18–53.80 「作者、发表时间全都列得很清楚，所以文献都有迹可循」整屏 → 放大引用弹窗（作者、年份）→ 换成放大正文，来源标签逐个框出
  {
    const O = [520, 165], add = r => [r[0] + O[0], r[1] + O[1], r[2] + O[0], r[3] + O[1]];
    const CHIPS = [[1130, 18, 1405, 62], [1230, 280, 1460, 322], [1510, 340, 1795, 382], [1335, 400, 1590, 442], [1228, 458, 1535, 502], [418, 578, 705, 620]].map(add);
    const RP = [1420, 660, 2380, 1060], RT = [520, 165, 2520, 865], tOut = T(51.30);
    scenes.push(recScene(49.18, 53.80, (t, E) => ({
      el: E.image('cite'), iw: 2560, ih: 1440,
      focus: [{
        at: 49.40, r: tt => lerpR(RP, RT, ease.inOut(prog(tt, tOut, tOut + .5))),
        marks: [
          { r: add([1320, 538, 1440, 582]), at: 49.70 }, { r: add([1462, 538, 1532, 582]), at: T(49.25) },
          { r: add([940, 608, 1810, 718]), at: T(49.90), kind: 'box' },
          ...CHIPS.map((r, i) => ({ r, at: T(51.75) + i * .2, kind: 'box' })),
        ],
      }],
    }), { bg: { c1: 'rgba(245,223,39,.16)' } }));
  }

  // 18  53.80–55.95 「单纯检索文献还只是基本操作」真人近景
  scenes.push(anchorFull(53.80, T(55.70), { close: true }));

  // 19  55.95–59.25 「更省心的是，可以对文献进行结构化梳理」整屏 → 放大梳理指令，涂黄「结构化梳理」
  scenes.push(recScene(T(55.70), T(59.00), (t, E) => ({
    el: E.image('sortp'), iw: 2560, ih: 1440,
    focus: [{ at: T(55.70) + .45, r: [530, 1095, 2210, 1300], marks: [{ r: [1030, 1115, 1455, 1165], at: T(57.72), dur: .5 }] }],
  })));

  // 20  59.25–66.95 「针对14篇文献建立完整论证框架，还分好了核心论据和补充资料，连研究缺口都给你点出来了」
  //     梳理结果整屏 → 放大开头一段（14 篇、四段论证、核心论据与补充资料）→ 翻到「实践效果」，放大研究缺口那句
  {
    const t0 = T(59.00), tGap = T(64.20);
    scenes.push(recScene(t0, SEG3, (t, E) => t < tGap ? {
      el: E.image('sort0'), iw: 2560, ih: 1440,
      focus: [{ at: t0 + .35, r: [520, 585, 1980, 1055], marks: [
        { r: [865, 605, 1025, 655], at: T(59.38) }, { r: [1105, 605, 1960, 655], at: T(60.30), dur: 1.0 },
        { r: [1308, 665, 1662, 715], at: T(62.60), kind: 'box' },
      ] }],
    } : {
      el: E.image('lit4'), iw: 2560, ih: 1440,
      focus: [{ at: tGap + .15, r: [520, 340, 2460, 540], maxW: 1700, marks: [
        { r: [1625, 402, 2445, 452], at: T(64.45), dur: .4 }, { r: [545, 462, 1170, 512], at: T(64.85), dur: .4 },
        { r: [540, 397, 2450, 517], at: T(64.55), kind: 'box' },
      ] }],
    }, { bg: { c2: 'rgba(57,200,114,.2)' } }));
  }

  /* ================= 第 3 段：② 出报告 ================= */

  // C 66.45–67.65 停顿：章节卡「② 出报告」亮起（① 已讲、③ 压暗），重击同帧
  const CH2_HIT = 66.65;
  scenes.push({ t0: SEG3, t1: 67.65, draw(ctx, t) { D.bg(ctx, t, { c2: 'rgba(245,223,39,.35)' }); navDraw(ctx, t, SEG3 - .4, [-1, -1, -1], 1, { hit: CH2_HIT }); } });

  // 21  67.65–70.48 「有了完整的证据链，出报告就水到渠成了」真人
  scenes.push(anchorFull(67.65, T(69.30)));

  // 22  70.48–72.92 「这里我们直接召唤教学设计专家」整屏录屏 → 放大「召唤专家 › 教学设计专家」菜单
  scenes.push(recScene(T(69.30), T(71.74), (t, E) => ({
    el: E.video('c03e', t - T(69.30) + .05), iw: 2560, ih: 1440,
    focus: [{ at: T(69.30) + .7, r: [540, 540, 1520, 1330], maxH: 760 }],
  })));

  // 23  72.92–77.78 「围绕这个课题，再结合前面的工作成果，给一份符合教研规范的报告」放大指令，跟着口播涂黄
  scenes.push(recScene(T(71.74), T(76.60), (t, E) => ({
    el: E.image('rp_prompt'), iw: 2560, ih: 1440,
    focus: [{ at: T(71.74) + .3, r: [1135, 455, 2500, 800], marks: [
      { r: [2078, 490, 2460, 535], at: T(72.00) }, { r: [1160, 550, 1640, 595], at: T(72.20) },
      { r: [1160, 490, 1636, 535], at: T(72.95), dur: .5 },
      { r: [1534, 668, 1880, 713], at: T(75.00), dur: .4 },
    ] }],
  })));

  // 24  77.78–80.80 「不过有一说一，我的高数早就还给老师了」真人近景
  scenes.push(anchorFull(T(76.60), T(79.62), { close: true }));

  // 25  80.80–84.43 「但单看这份报告的结构逻辑，就知道它不是东拼西凑」报告整屏快速翻一遍（1.65 倍速）
  scenes.push(recScene(T(79.62), T(83.25), (t, E) => ({ el: E.video('c03s', t - T(79.62)), iw: 2560, ih: 1440 })));

  // 26  84.43–86.93 「而是顺着这个逻辑线铺下来的」四个大标题从报告里放大出来，沿一条线排下来
  {
    const t0 = T(83.25), t1 = T(85.75);
    const HEADS = [['rp_h1', [540, 355, 815, 415]], ['rp_h2', [540, 455, 900, 520]], ['rp_h3', [540, 1090, 900, 1155]], ['rp_h4', [540, 640, 900, 705]]];
    const at = i => T(83.60) + i * .32;
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c2: 'rgba(245,223,39,.25)' });
        // 背景：报告整屏，虚化压暗
        D.rec(ctx, t, E.image('rp_h4'), 2560, 1440, { blur: ease.out(prog(t, t0, t0 + .3)) });
        const cw = 820, ch = 148, gap = 52, top = 450 - (4 * ch + 3 * gap) / 2, cx = 1000;
        // 逻辑线
        const lp = ease.inOut(prog(t, at(0), at(3) + .3));
        ctx.save(); ctx.strokeStyle = '#b9ff00'; ctx.lineWidth = 8; ctx.shadowColor = '#b9ff00'; ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.moveTo(cx - cw / 2 - 60, top + ch / 2); ctx.lineTo(cx - cw / 2 - 60, top + ch / 2 + lp * 3 * (ch + gap)); ctx.stroke(); ctx.restore();
        HEADS.forEach(([n, r], i) => {
          const k = ease.back(prog(t, at(i), at(i) + .32)); if (k <= 0) return;
          const y = top + i * (ch + gap), im = E.image(n);
          ctx.save(); ctx.translate(cx, y + ch / 2); ctx.scale(k, k); ctx.globalAlpha = clamp(k * 1.5);
          ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; D.rr(ctx, -cw / 2, -ch / 2, cw, ch, 18); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
          ctx.save(); D.rr(ctx, -cw / 2, -ch / 2, cw, ch, 18); ctx.clip();
          if (im) { const rw = r[2] - r[0], rh = r[3] - r[1], s = Math.min((cw - 80) / rw, (ch - 30) / rh); ctx.drawImage(im, r[0], r[1], rw, rh, -cw / 2 + 50, -rh * s / 2, rw * s, rh * s); }
          ctx.restore();
          ctx.lineWidth = 5; ctx.strokeStyle = '#ffaa42'; D.rr(ctx, -cw / 2, -ch / 2, cw, ch, 18); ctx.stroke();
          ctx.restore();
          // 线上的节点
          ctx.save(); ctx.globalAlpha = clamp(k); ctx.beginPath(); ctx.arc(cx - cw / 2 - 60, y + ch / 2, 18, 0, Math.PI * 2); ctx.fillStyle = '#b9ff00'; ctx.fill(); ctx.restore();
        });
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // 27  86.93–92.5 「参考文献里哪些支撑核心结论，哪些是拓展参考，也都分得清清楚楚」放大参考文献，先框核心论据，再框补充资料
  scenes.push(recScene(T(85.75), SEG4, (t, E) => ({
    el: E.image('rp_refs'), iw: 2560, ih: 1440,
    focus: [{ at: T(85.75) + .3, r: [520, 160, 2460, 1060], marks: [
      { r: [540, 175, 700, 225], at: T(86.70) }, { r: [545, 250, 2450, 825], at: T(86.95), kind: 'box' },
      { r: [540, 875, 700, 935], at: T(88.60) }, { r: [545, 950, 2450, 1060], at: T(88.85), kind: 'box' },
    ] }],
  }), { bg: { c1: 'rgba(245,223,39,.16)' } }));

  /* ================= 第 4 段：③ 做课件 + 沉淀 Skill + 手机远程 ================= */

  // C 92.0–93.2 停顿：章节卡「③ 做课件」亮起（①② 已讲），重击同帧
  const CH3_HIT = 92.2;
  scenes.push({ t0: SEG4, t1: 93.20, draw(ctx, t) { D.bg(ctx, t, { c2: 'rgba(57,200,114,.35)' }); navDraw(ctx, t, SEG4 - .4, [-1, -1, -1], 2, { hit: CH3_HIT }); } });

  // 28  93.20–96.62 「最后我们就能做出开头那个能拖能转的3D课件」课件整屏（滑块转动切平面）→ 放大三个模块
  scenes.push(recScene(93.20, T(94.60), (t, E) => ({
    el: E.video('c08', 6.0 + (t - 93.20)), iw: 1992, ih: 1440,
    focus: [{ at: 93.80, r: [120, 600, 1880, 1360] }],
  })));

  // 29  96.62–100.47 「直接调用「离线互动科学仿真HTML生成」这个技能」放大技能菜单，框出这一项
  scenes.push(recScene(T(94.60), T(98.45), (t, E) => ({
    el: E.video('c04a', t - T(94.60)), iw: 2560, ih: 1440,
    focus: [{ at: T(94.60) + .5, r: [560, 550, 1500, 1300], maxH: 760, marks: [{ r: [1105, 700, 1445, 752], at: T(95.47), kind: 'box' }] }],
  })));

  // 30  100.47–102.87 「让它生成配套的3D交互课件」放大生成好的 .html 课件文件
  scenes.push(recScene(T(98.45), T(100.85), (t, E) => ({
    el: E.image('k_file'), iw: 2560, ih: 1440,
    focus: [{ at: T(98.45) + .3, r: [540, 480, 2520, 820], marks: [{ r: [760, 522, 1612, 568], at: T(99.17), dur: .5 }] }],
  })));

  // 31  102.87–106.22 「它把三个知识点整合在了同一个三维曲面里」三个模块标题逐个框出
  scenes.push(recScene(T(100.85), T(104.20), (t, E) => ({
    el: E.image('c08still'), iw: 1992, ih: 1440,
    focus: [{ at: T(100.85) + .3, r: [120, 600, 1880, 1360], marks: [
      { r: [180, 630, 420, 685], at: T(101.29), kind: 'box' }, { r: [740, 630, 1040, 685], at: T(101.45), kind: 'box' }, { r: [1295, 630, 1595, 685], at: T(101.61), kind: 'box' },
    ] }],
  })));

  // 32  106.22–109.42 「拖动锚点或滑块，抽象概念的几何本质」原录屏整屏：拖锚点 → 拖滑块（2.47 倍速，不放大）
  scenes.push(recScene(T(104.20), T(107.40), (t, E) => ({ el: E.video('c08c', t - T(104.20)), iw: 1992, ih: 1440 })));

  // 33  109.42–111.37 「一眼就能看明白。整个流程走下来」真人近景
  scenes.push(anchorFull(T(107.40), T(109.80), { close: true }));

  // 阿亮 10-20：用原录屏，挑重点步骤，1–1.3 倍速（不逐个放大）
  // 34  111.37–113.73 「还能沉淀成个人专属Skill」发出沉淀指令 → 「个人技能已成功创建并注册」（原速）
  scenes.push(recScene(T(109.80), T(112.16), (t, E) => ({ el: E.video('c05a', t - T(109.80)), iw: 1920, ih: 1080 })));

  // 35  113.73–115.47 「后续可以一键复用」技能卡 → 使用 → 输入框出现「/可视化教研模板」（1.15 倍）
  scenes.push(recScene(T(112.16), T(114.22), (t, E) => ({ el: E.video('c05b', t - T(112.16)), iw: 1920, ih: 1080 }), { noIn: true }));

  // 36  115.47–116.52 「就算出门在外」电脑端打开「让手机也能控制电脑」（原速）
  scenes.push(recScene(T(114.22), T(115.27), (t, E) => ({ el: E.video('c06r', t - T(114.22)), iw: 1920, ih: 1080 })));

  // 37  116.52–118.98 「手机也可以直接远程操作电脑干活」手机：输入指令 → 发送（1.14 倍）
  scenes.push(recScene(T(115.27), T(117.73), (t, E) => ({ el: E.video('c07a', t - T(115.27)), iw: 720, ih: 1560 })));

  // 38  118.98–122.35 「工作照样继续跑，不用守在电脑旁边」手机：PPT 生成完成 → 翻看 PPT
  scenes.push(recScene(T(117.73), SEG5, (t, E) => ({ el: E.video('c07b', t - T(117.73)), iw: 720, ih: 1560 }), { noIn: true }));

  /* ================= 第 5 段：结尾 ================= */

  // 40  121.95–124.10 「AI能力真的是已经今非昔比了」真人
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

  // 41  124.10–128.10 「从单点回答问题，到承接一整套专业的工作流」一个问答气泡 → 三步工作流串起来
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

  // 42  128.10–129.70 「变化呢是肉眼可见」真人近景
  scenes.push(anchorFull(T(127.15), T(128.75), { close: true }));

  // 43  129.70–133.40 「从文献整理，到专业的研究报告，再到立体交互式课件」三段原录屏快切回顾
  scenes.push(recScene(T(128.75), T(129.55), (t, E) => ({ el: E.image('sort0'), iw: 2560, ih: 1440 })));
  scenes.push(recScene(T(129.55), T(130.80), (t, E) => ({ el: E.image('rp_h1'), iw: 2560, ih: 1440 }), { noIn: true }));
  scenes.push(recScene(T(130.80), T(132.45), (t, E) => ({ el: E.video('c08', 1.0 + (t - T(130.80))), iw: 1992, ih: 1440 }), { noIn: true }));

  // 44  133.40–136.15 「库库AI一款工具就能一站式落地」三步卡片收拢进库库AI
  {
    const t0 = T(132.45), t1 = T(135.20), tIn = T(133.16), tOne = T(134.06);
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c1: 'rgba(124,58,237,.5)', c2: 'rgba(185,255,0,.16)' });
        const g = ease.inOut(prog(t, tIn - .25, tIn + .15));
        ctx.save(); ctx.translate(960, 470); ctx.scale(lerp(1, .25, g), lerp(1, .25, g)); ctx.translate(-960, -470);
        ctx.globalAlpha = 1 - g; stepRow(ctx, t, [t0, t0 + .08, t0 + .16], { cx: 960 }); ctx.restore();
        const k = prog(t, tIn, tIn + .22);
        if (k > 0) {
          const s = lerp(1.9, 1, ease.out(k)), logo = E.tint('logo', '#ffffff');
          const ring = prog(t, tIn + .15, tIn + .85);
          if (ring > 0 && ring < 1) { ctx.save(); ctx.strokeStyle = `rgba(185,255,0,${.8 * (1 - ring)})`; ctx.lineWidth = 14 * (1 - ring) + 2; ctx.beginPath(); ctx.arc(960, 450, 200 + ring * 650, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
          if (logo) { const w = 1100 * s, h = w * 249 / 960; ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.shadowColor = 'rgba(139,92,246,.9)'; ctx.shadowBlur = 60; ctx.drawImage(logo, 960 - w / 2, 450 - h / 2, w, h); ctx.restore(); }
          // 「一站式」：三色光带从左扫到右，托住 logo
          const u = ease.out(prog(t, tOne, tOne + .5));
          if (u > 0) {
            const W = 1000 * u, gr = ctx.createLinearGradient(460, 0, 1460, 0);
            gr.addColorStop(0, '#2388FF'); gr.addColorStop(.5, '#F5DF27'); gr.addColorStop(1, '#39C872');
            ctx.save(); ctx.shadowColor = '#b9ff00'; ctx.shadowBlur = 24; ctx.fillStyle = gr; D.rr(ctx, 460, 640, W, 16, 8); ctx.fill(); ctx.restore();
          }
        }
        pip(ctx, t, E, t0 + .05, t1);
      },
    });
  }

  // 45  136.15–138.65 「这才是专业AI办公该有的样子」真人
  scenes.push(anchorFull(T(135.20), T(137.70)));

  // 46  138.65–141.25 「这个工具网页端和桌面端都能用」浏览器 + 桌面窗口，名字随口播弹出
  {
    const t0 = T(137.70), t1 = T(140.30), tW = T(138.48), tD = T(139.08);
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        const im = E.image('k_home'), w = 800, h = 450;
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
          ctx.save(); D.rr(ctx, x, y, w, h, browser ? 0 : 16); ctx.clip(); if (im) ctx.drawImage(im, 0, 0, 2560, 1440, x, y, w, h); ctx.restore();
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
    const A = anchorFull(T(140.30), DUR);
    scenes.push({ t0: A.t0, t1: A.t1, kind: 'anchor', close: false, fadeOut: .7, draw(ctx, t, E) { A.draw(ctx, t, E); const f = prog(t, DUR - .7, DUR); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, 1920, 1080); } } });
  }

  /* ---------- 音频 ---------- */
  const audio = [];
  VOICE.forEach(([a, b, t]) => audio.push({ asset: 'voice', at: t, from: a, dur: b - a, gain: 1, fadeIn: .02, fadeOut: .03 }));
  // 配乐：说话时压低；logo 停顿时抬起来配重击
  const speech = VOICE.map(([a, b, t]) => [t, t + (b - a)]);
  const LOW = .16, HIGH = .55;
  const env = [[0, LOW]];
  env.push([18.80, LOW], [18.87, .85], [19.75, .7], [19.95, LOW]);
  env.push([29.70, LOW], [29.95, .5], [30.45, 0]);
  audio.push({ asset: 'music', at: 0, from: 0, dur: 30.45, gain: 1, fadeIn: .3, fadeOut: .4, env });
  // 第 2 段换曲：章节卡重击时进，说话压低，段尾淡出
  const env2 = [[CH1_HIT, .7], [31.0, .7], [31.15, LOW], [66.2, LOW], [66.45, .5], [66.95, 0]];
  audio.push({ asset: 'music2', at: CH1_HIT - .05, from: 0, dur: 66.95 - CH1_HIT + .05, gain: 1, fadeIn: .05, fadeOut: .4, env: env2 });
  const env3 = [[CH2_HIT, .7], [67.6, .7], [67.75, LOW], [SEG4 - .1, LOW], [SEG4 + .3, 0]];
  audio.push({ asset: 'music3', at: CH2_HIT - .05, from: 0, dur: SEG4 + .3 - CH2_HIT + .05, gain: 1, fadeIn: .05, fadeOut: .4, env: env3 });
  const env4 = [[CH3_HIT, .7], [93.15, .7], [93.3, LOW], [SEG5 - .2, LOW], [SEG5 + .3, 0]];
  audio.push({ asset: 'music4', at: CH3_HIT - .05, from: 0, dur: SEG5 + .3 - CH3_HIT + .05, gain: 1, fadeIn: .05, fadeOut: .4, env: env4 });
  const env5 = [[SEG5 - .2, LOW], [T(145.75), LOW], [T(145.75) + .3, .5], [DUR - .8, .5], [DUR, 0]];
  audio.push({ asset: 'music5', at: SEG5 - .2, from: 0, dur: DUR - SEG5 + .2, gain: 1, fadeIn: .5, fadeOut: .8, env: env5 });
  const sfx = (asset, at, gain = .6) => audio.push({ asset, at, gain });
  // 转场音：峰值对齐切点（whoosh 峰在 0.71 秒）
  sfx('whoosh', 1.95 - .62, .5); sfx('whoosh', 4.93 - .62, .45); sfx('swish', 11.99 - .7, .45);
  sfx('pop', 12.02, .5); sfx('pop', 12.2, .45); sfx('pop', 12.37, .45); sfx('pop', 12.53, .45);
  sfx('scribble', T(13.85), .55); sfx('pop', T(15.55), .7);
  sfx('rise', 18.87 + .2 - 1.43, .7);                     // 蓄力，结尾对齐 logo
  sfx('thud', 18.87 - .17 + .2, .9); sfx('dong', 18.87 - .21 + .2, .55); sfx('shine', 19.25, .5);
  sfx('whoosh', 19.95 - .62, .45); [T(20.75), T(21.35), T(21.95)].forEach(x => sfx('swish', x - .8, .35));
  sfx('whoosh', 25.69 - .62, .45);
  NAV.forEach(([, , ta]) => sfx('pop', ta, .55));
  // 每个高亮的轻响
  [T(6.50), T(7.02), T(7.50)].forEach(x => sfx('shine', x, .18));
  // 第 2 段
  sfx('rise', CH1_HIT - 1.43, .6); sfx('thud', CH1_HIT - .17, .85); sfx('dong', CH1_HIT - .21, .45);
  sfx('whoosh', 31.05 - .62, .45); sfx('shine', T(31.74), .2); sfx('shine', T(33.70), .2);
  sfx('swish', T(39.62) - .7, .4); [0, 1, 2, 3, 4, 5].forEach(i => sfx('pop', T(39.62) + i * .07 + .1, .3));
  sfx('swish', T(41.58) - .55, .4); sfx('swish', T(42.24) - .55, .4);
  [0, 1, 2, 3, 4, 5].forEach(i => sfx('pop', T(43.38) + .1 + i * .17, .4));
  sfx('whoosh', 45.47 - .62, .45); sfx('pop', T(46.39) + .2, .55); sfx('pop', T(46.87) + .2, .55); sfx('shine', T(47.83), .35);
  sfx('whoosh', T(48.62) - .62, .45); sfx('shine', T(48.75), .2); sfx('shine', T(49.25), .2);
  [0, 1, 2, 3, 4, 5].forEach(i => sfx('pop', T(51.65) + i * .2, .3));
  sfx('whoosh', T(55.70) - .62, .45); sfx('shine', T(57.72), .25);
  sfx('whoosh', T(59.00) - .62, .4); sfx('shine', T(59.38), .2); sfx('pop', T(62.60), .45);
  sfx('swish', T(64.20) - .7, .4); sfx('pop', T(64.50), .5);
  // 第 3 段
  sfx('rise', CH2_HIT - 1.43, .6); sfx('thud', CH2_HIT - .17, .85); sfx('dong', CH2_HIT - .21, .45);
  sfx('whoosh', T(69.30) - .62, .45); sfx('pop', T(69.30) + .75, .35);
  sfx('whoosh', T(71.74) - .62, .4); [T(72.00), T(72.95), T(75.00)].forEach(x => sfx('shine', x, .2));
  sfx('whoosh', T(79.62) - .62, .45);
  sfx('swish', T(83.25) - .7, .4); [0, 1, 2, 3].forEach(i => sfx('pop', T(83.60) + i * .32 + .15, .45));
  sfx('whoosh', T(85.75) - .62, .45); sfx('pop', T(86.95), .45); sfx('pop', T(88.85), .45); sfx('shine', T(90.0), .3);
  // 第 4 段
  sfx('rise', CH3_HIT - 1.43, .6); sfx('thud', CH3_HIT - .17, .85); sfx('dong', CH3_HIT - .21, .45);
  sfx('whoosh', 93.20 - .62, .45);
  sfx('whoosh', T(94.60) - .62, .4); sfx('pop', T(95.47), .45);
  sfx('whoosh', T(98.45) - .62, .4); sfx('shine', T(99.17), .25);
  sfx('swish', T(100.85) - .7, .35); [101.29, 101.45, 101.61].forEach(v => sfx('pop', T(v), .4));
  sfx('whoosh', T(104.20) - .62, .4);
  sfx('whoosh', T(109.80) - .62, .4);
  sfx('swish', T(112.16) - .7, .3); sfx('whoosh', T(114.22) - .62, .4); sfx('whoosh', T(115.27) - .62, .4); sfx('swish', T(117.73) - .7, .3);
  // 第 5 段
  sfx('whoosh', T(123.15) - .62, .4); sfx('pop', T(123.25), .5); sfx('swish', T(124.45) - .5, .3);
  [124.75, 125.29, 125.77].forEach(v => sfx('pop', T(v), .45));
  sfx('whoosh', T(128.75) - .62, .45); sfx('swish', T(129.55) - .7, .35); sfx('swish', T(130.80) - .7, .35);
  sfx('whoosh', T(132.45) - .62, .4); sfx('thud', T(133.16) - .17, .6); sfx('shine', T(133.3), .4); sfx('shine', T(134.06), .3);
  sfx('whoosh', T(137.70) - .62, .4); sfx('pop', T(138.48), .5); sfx('pop', T(139.08), .5);

  /* ---------- 字幕叠加 ---------- */
  function overlay(ctx, t) {
    for (const [a, b, s] of SUBS) if (t >= a && t < b) { D.subtitle(ctx, s, 1); break; }
  }

  const assets = {
    anchor: { type: 'video', src: { mp4: A + 'anchor.mp4', webm: A + 'anchor.webm' } },
    c08: { type: 'video', src: { mp4: A + 'c08.mp4', webm: A + 'c08.webm' } },
    ref: { type: 'image', src: A + 'ref.jpg' }, c08still: { type: 'image', src: A + 'c08still.jpg' },
    lit1: { type: 'image', src: A + 'lit1.jpg' }, lit2: { type: 'image', src: A + 'lit2.jpg' },
    lit3: { type: 'image', src: A + 'lit3.jpg' }, lit4: { type: 'image', src: A + 'lit4.jpg' },
    c01: { type: 'video', src: { mp4: A + 'c01.mp4', webm: A + 'c01.webm' } },
    prompt: { type: 'image', src: A + 'prompt.jpg' }, cite: { type: 'image', src: A + 'cite.jpg' },
    sortp: { type: 'image', src: A + 'sortp.jpg' }, sort0: { type: 'image', src: A + 'sort0.jpg' },
    c03e: { type: 'video', src: { mp4: A + 'c03e.mp4', webm: A + 'c03e.webm' } },
    c03s: { type: 'video', src: { mp4: A + 'c03s.mp4', webm: A + 'c03s.webm' } },
    rp_prompt: { type: 'image', src: A + 'rp_prompt.jpg' }, rp_refs: { type: 'image', src: A + 'rp_refs.jpg' },
    rp_h1: { type: 'image', src: A + 'rp_h1.jpg' }, rp_h2: { type: 'image', src: A + 'rp_h2.jpg' },
    rp_h3: { type: 'image', src: A + 'rp_h3.jpg' }, rp_h4: { type: 'image', src: A + 'rp_h4.jpg' },
    c04a: { type: 'video', src: { mp4: A + 'c04a.mp4', webm: A + 'c04a.webm' } },
    c08c: { type: 'video', src: { mp4: A + 'c08c.mp4', webm: A + 'c08c.webm' } },
    c05a: { type: 'video', src: { mp4: A + 'c05a.mp4', webm: A + 'c05a.webm' } },
    c05b: { type: 'video', src: { mp4: A + 'c05b.mp4', webm: A + 'c05b.webm' } },
    c06r: { type: 'video', src: { mp4: A + 'c06r.mp4', webm: A + 'c06r.webm' } },
    c07a: { type: 'video', src: { mp4: A + 'c07a.mp4', webm: A + 'c07a.webm' } },
    c07b: { type: 'video', src: { mp4: A + 'c07b.mp4', webm: A + 'c07b.webm' } },
    k_file: { type: 'image', src: A + 'k_file.jpg' }, k_home: { type: 'image', src: A + 'k_home.jpg' },
    logo: { type: 'image', src: A + 'logo.png' },
    voice: { type: 'audio', src: A + 'voice.mp3' }, music: { type: 'audio', src: A + 'music.mp3' }, music2: { type: 'audio', src: A + 'music2.mp3' }, music3: { type: 'audio', src: A + 'music3.mp3' }, music4: { type: 'audio', src: A + 'music4.mp3' }, music5: { type: 'audio', src: A + 'music5.mp3' },
  };
  for (const n of ['whoosh', 'swish', 'rise', 'thud', 'dong', 'pop', 'shine', 'scribble']) assets[n] = { type: 'audio', src: A + `sfx_${n}.mp3` };

  window.PROJECT = {
    title: '库库AI_第1-5段_完整版', width: 1920, height: 1080, duration: DUR,
    fonts: [{ family: 'KTitle', src: A + 'title.woff' }, { family: 'KSub', src: A + 'sub.woff' }],
    assets, scenes, overlay, audio, silence: A + 'silence.mp3',
    // 自查用：关键时间点
    checks: [123.0, 124.6, 126.0, 127.6, 129.0, 130.2, 131.2, 132.8, 134.0, 135.6, 137.0, 139.2, 140.6, 143.0, 146.8],
    sections: [[0, '第 1 段 · 开头'], [SEG2, '第 2 段 · 查文献'], [SEG3, '第 3 段 · 出报告'], [SEG4, '第 4 段 · 做课件'], [SEG5, '第 5 段 · 结尾']],
    SUBS, T, V,
    jy: { anchorV, anchorGeom, pipSrc, PIP, VOICE, ANCHOR_W, ANCHOR_H },   // 导出剪映工程用（剪辑工程/jy_probe.js）
  };
})();
