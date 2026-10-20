/* 库库AI 时间线 —— 风格：秋芝-豆包
 * 第 1 段 0–29.85：开头（成果前置、需求引入、预告流程）
 * 第 2 段 29.85–66.95：① 查文献（文献检索 Skill → 对接学术库 → 结构化梳理）
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
  ];
  const T = v => { for (const [a, b, t] of VOICE) if (v >= a - 0.05 && v <= b + 0.05) return t + (v - a); return null; };
  const V = t => { for (const [a, b, t0] of VOICE) if (t >= t0 && t <= t0 + (b - a)) return a + (t - t0); return null; };
  const DUR = 66.95;
  const SEG2 = 29.85;   // 第 2 段起点（预览页的「第 2 段」按钮跳到这里）

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
  ].map(([a, b, s]) => [T(a), T(b), s]);

  /* ---------- 主播 ---------- */
  const ANCHOR_W = 854, ANCHOR_H = 480;
  const PIP_SRC = [290, 22, 300, 300];          // 小圆窗取的区域（脸 + 肩）
  const PIP = { x: 160, y: 920, d: 230 };       // 左下角，避开内容和字幕
  function anchorEl(E, t) {
    let v = V(t);
    if (v == null) { let best = null; for (const [a, b, t0] of VOICE) if (t >= t0) best = a + (t - t0); v = best; }
    return v == null ? null : E.video('anchor', v);
  }
  function pip(ctx, t, E, t0, t1) {
    const k = ease.back(prog(t, t0, t0 + .35)) * (1 - ease.out(prog(t, t1 - .2, t1)));
    if (k <= 0) return;
    ctx.save(); ctx.translate(PIP.x, PIP.y); ctx.scale(k, k);
    D.pip(ctx, anchorEl(E, t), PIP_SRC, 0, 0, PIP.d);
    ctx.restore();
  }
  /** 真人大画面：慢慢推近；close=true 用近景 */
  function anchorFull(t0, t1, o = {}) {
    return {
      t0, t1, draw(ctx, t, E) {
        const el = anchorEl(E, t); if (!el) return;
        const k = prog(t, t0, t1), z0 = o.close ? 1.22 : 1.0, z1 = z0 + .06;
        D.cover(ctx, el, ANCHOR_W, ANCHOR_H, { zoom: lerp(z0, z1, k), cx: .52, cy: o.close ? .3 : .4 });
        // 进场：0.18 秒白闪 / 推近，避免硬切
        const f = 1 - prog(t, t0, t0 + .18); if (f > 0 && o.flash !== false) { ctx.fillStyle = `rgba(255,255,255,${.35 * f})`; ctx.fillRect(0, 0, 1920, 1080); }
      },
    };
  }

  /* ---------- 场景 ---------- */
  const scenes = [];

  // ① 0–1.95 「来，老师、科研党们，都看过来！」真人开场
  scenes.push(anchorFull(0, 1.95, { flash: false }));

  // ② 1.95–4.93 「你看AI制作的这个3D高数课件，能拖、能转」3D 交互课件录屏，推到被拖动的曲面
  {
    const t0 = 1.95, t1 = 4.93, full = [0, 0, 1992, 740], mod = [175, 140, 520, 395];
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        const inK = ease.out(prog(t, t0, t0 + .35)), zk = ease.inOut(prog(t, t0 + 1.0, t0 + 1.55));
        const src = full.map((v, i) => lerp(v, mod[i], zk));
        const r0 = [300, 160, 1560, 580], r1 = [520, 70, 1100, 832];
        const r = r0.map((v, i) => lerp(v, r1[i], zk));
        ctx.save();
        ctx.translate(r[0] + r[2] / 2 + (1 - inK) * 900, r[1] + r[3] / 2); ctx.rotate((1 - inK) * .12); ctx.scale(lerp(.85, 1, inK), lerp(.85, 1, inK));
        D.win(ctx, E.video('c08', t - t0), src, -r[2] / 2, -r[3] / 2, r[2], r[3], { r: 24 });
        ctx.restore();
        pip(ctx, t, E, t0 + .1, t1);
      },
    });
  }

  // ③ 4.93–8.17 「还配了一份文献出处标得清清楚楚的教研报告」参考文献页，逐条涂黄
  {
    const t0 = 4.93, t1 = 8.17, src = [60, 190, 1940, 812];
    const HL = [ // [图里 y0, y1, x0, x1, 亮起时间]
      [214, 254, 98, 278, T(5.75)],
      [410, 450, 100, 1390, T(6.50)], [470, 509, 100, 1466, T(6.78)], [529, 568, 100, 1154, T(7.02)],
      [589, 628, 100, 1446, T(7.26)], [648, 687, 100, 1595, T(7.50)],
    ];
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, { c1: 'rgba(245,223,39,.18)' });
        const inK = ease.out(prog(t, t0, t0 + .32)), push = ease.inOut(prog(t, t0 + .4, t1));
        const w = 1500 * lerp(1, 1.05, push), h = w * src[3] / src[2], x = 1090 - w / 2 + (1 - inK) * 1000, y = 470 - h / 2;
        D.win(ctx, E.image('ref'), src, x, y, w, h, {
          r: 24, after(c) {
            const k = w / src[2];
            for (const [y0, y1, x0, x1, ta] of HL) {
              const p = ease.out(prog(t, ta, ta + .3)); if (p <= 0) continue;
              c.fillStyle = 'rgba(245,223,39,.42)';
              D.rr(c, x + (x0 - src[0]) * k, y + (y0 - src[1] - 4) * k, (x1 - x0) * k * p, (y1 - y0 + 8) * k, 6); c.fill();
            }
          },
        });
        pip(ctx, t, E, t0 + .1, t1);
      },
    });
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
          const w = 980, h = w * 1080 / 1980;
          ctx.globalAlpha = clamp(k * 1.2);
          D.win(ctx, E.image(n), [0, 0, 1980, 1080], -w / 2, -h / 2, w, h, { r: 18 });
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
        if (ghost) { ctx.save(); ctx.globalAlpha = .12; ctx.filter = 'grayscale(1) blur(3px)'; ctx.drawImage(ghost, 0, 0, 1992, 740, 60, 260, 1800, 669); ctx.restore(); }
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
    const ITEMS = [['lit1', [0, 0, 1980, 1080]], ['lit3', [0, 0, 1980, 1080]], ['ref', [60, 150, 1940, 860]], ['c08still', [0, 0, 1992, 740]]];
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

  /** 窗口里的强调：hl = 黄色涂亮（从左往右扫）；box = 橙色虚线框；dim = 框外压暗。r 是素材图里的坐标 [x0,y0,x1,y1] */
  function marks(c, t, x, y, k, src, list) {
    const m = r => [x + (r[0] - src[0]) * k, y + (r[1] - src[1]) * k, (r[2] - r[0]) * k, (r[3] - r[1]) * k];
    for (const it of list) {
      const p = ease.out(prog(t, it.at, it.at + (it.dur || .3))); if (p <= 0) continue;
      const [rx, ry, rw, rh] = m(it.r);
      if (it.kind === 'dim') {
        c.save(); c.fillStyle = `rgba(10,10,18,${.62 * p})`; c.beginPath(); c.rect(x - 5, y - 5, 4000, 3000);
        D.rr(c, rx - 10, ry - 8, rw + 20, rh + 16, 12); c.fill('evenodd'); c.restore();
      } else if (it.kind === 'box') {
        c.save(); c.setLineDash([18, 12]); c.lineDashOffset = -t * 40; c.lineWidth = 6; c.strokeStyle = `rgba(255,170,66,${p})`;
        const g = 1 + (1 - p) * .15; D.rr(c, rx + rw / 2 - (rw / 2 + 12) * g, ry + rh / 2 - (rh / 2 + 10) * g, (rw + 24) * g, (rh + 20) * g, 14); c.stroke(); c.restore();
      } else {
        c.save(); c.fillStyle = 'rgba(245,223,39,.45)'; D.rr(c, rx - 4, ry, (rw + 8) * p, rh, 6); c.fill(); c.restore();
      }
    }
  }
  /** 一个舞台场景：背景 + 软件窗口（甩进来）+ 左下小圆窗。win(t) 返回 {el, src, w, cx, cy, list} */
  function stage(t0, t1, win, o = {}) {
    return {
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t, o.bg);
        const W = win(t, E); const el = W.el || (W.img ? E.image(W.img) : null); const inK = o.noIn ? 1 : ease.out(prog(t, t0, t0 + .32));
        const w = W.w, h = w * W.src[3] / W.src[2], x = W.cx - w / 2 + (1 - inK) * 1000, y = W.cy - h / 2;
        ctx.save(); if (!o.noIn) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate((1 - inK) * .08); ctx.translate(-(x + w / 2), -(y + h / 2)); }
        D.win(ctx, el, W.src, x, y, w, h, { r: 24, after: c => marks(c, t, x, y, w / W.src[2], W.src, W.list || []) });
        ctx.restore();
        if (o.extra) o.extra(ctx, t, E);
        pip(ctx, t, E, t0 + .05, t1);
      },
    };
  }

  // C 29.85–31.05 停顿：章节卡「① 查文献」亮起，②③ 压暗（重击同帧）
  const CH1 = 29.85, CH1_HIT = 30.05;
  scenes.push({ t0: CH1, t1: 31.05, draw(ctx, t) { D.bg(ctx, t, { c2: 'rgba(35,136,255,.45)' }); navDraw(ctx, t, CH1 - .4, [-1, -1, -1], 0, { hit: CH1_HIT }); } });

  // 13  31.05–35.83 「先调用文献检索Skill，让AI围绕这个课题定向检索核心文献」点技能 → 指令逐句涂黄
  {
    const cut = T(31.30);
    scenes.push(stage(31.05, 35.83, (t, E) => {
      const push = ease.inOut(prog(t, cut, 35.83));
      if (t < cut) return { el: E.video('c01', .25 + (t - 31.05) * 1.1), src: [0, 0, 1150, 279], w: 1640, cx: 990, cy: 440 };
      return {
        el: E.image('prompt'), src: [0, 40, 1320, 320], w: 1640 * lerp(1, 1.03, push), cx: 990, cy: 440,
        list: [{ r: [210, 145, 1290, 195], at: T(31.74), dur: .9 }, { r: [110, 265, 600, 315], at: T(33.70), dur: .45 }],
      };
    }));
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

  // 17  49.18–53.80 「作者、发表时间全都列得很清楚，所以文献都有迹可循」引用弹窗 → 来源标签逐个框出
  {
    const SRC = [0, 0, 2000, 940];
    const CHIPS = [[1130, 18, 1405, 62], [1230, 280, 1460, 322], [1510, 340, 1795, 382], [1335, 400, 1590, 442], [1228, 458, 1535, 502], [418, 578, 705, 620]];
    const ZIN = [860, 470, 1100, 517], tOut = T(51.30);
    scenes.push(stage(49.18, 53.80, t => ({
      el: null, img: 'cite', src: ZIN.map((v, i) => lerp(v, SRC[i], ease.inOut(prog(t, tOut, tOut + .5)))), w: 1560, cx: 1000, cy: 430,
      list: [
        { r: [1320, 538, 1440, 582], at: T(48.75) }, { r: [1462, 538, 1532, 582], at: T(49.25) },
        { r: [940, 608, 1810, 718], at: T(49.90), kind: 'box' },
        ...CHIPS.map((r, i) => ({ r, at: T(51.65) + i * .2, kind: 'box' })),
      ],
    }), { bg: { c1: 'rgba(245,223,39,.16)' } }));
  }

  // 18  53.80–55.95 「单纯检索文献还只是基本操作」真人近景
  scenes.push(anchorFull(53.80, T(55.70), { close: true }));

  // 19  55.95–59.25 「更省心的是，可以对文献进行结构化梳理」梳理指令，涂黄「结构化梳理」
  scenes.push(stage(T(55.70), T(59.00), () => ({
    el: null, src: [60, 30, 1640, 210], w: 1600, cx: 990, cy: 440, img: 'sortp',
    list: [{ r: [550, 55, 975, 105], at: T(57.72), dur: .5 }],
  })));

  // 20  59.25–66.95 「针对14篇文献建立完整论证框架，还分好了核心论据和补充资料，连研究缺口都给你点出来了」
  {
    const t0 = T(59.00), tGap = T(64.20);
    scenes.push(stage(t0, DUR, t => {
      if (t < tGap) return {
        el: null, img: 'sort0', src: [40, 545, 1460, 470], w: 1640, cx: 990, cy: 440,
        list: [
          { r: [385, 565, 545, 615], at: T(59.38) },
          { r: [625, 565, 1480, 615], at: T(60.30), dur: 1.0 },
          { r: [828, 625, 1182, 675], at: T(62.60), kind: 'box' },
        ],
      };
      return {
        el: null, img: 'lit4', src: [40, 170, 1900, 540], w: 1640, cx: 990, cy: 440,
        list: [
          { r: [60, 352, 1972, 480], at: T(64.40), kind: 'dim', dur: .35 },
          { r: [1145, 362, 1965, 412], at: T(64.45), dur: .4 }, { r: [65, 422, 690, 472], at: T(64.85), dur: .4 },
          { r: [60, 352, 1972, 480], at: T(64.50), kind: 'box' },
        ],
      };
    }, { bg: { c2: 'rgba(57,200,114,.2)' } }));
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
  const env2 = [[CH1_HIT, .7], [31.0, .7], [31.15, LOW], [66.2, LOW], [66.5, .4], [DUR, 0]];
  audio.push({ asset: 'music2', at: CH1_HIT - .05, from: 0, dur: DUR - CH1_HIT + .05, gain: 1, fadeIn: .05, fadeOut: .4, env: env2 });
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
    logo: { type: 'image', src: A + 'logo.png' },
    voice: { type: 'audio', src: A + 'voice.mp3' }, music: { type: 'audio', src: A + 'music.mp3' }, music2: { type: 'audio', src: A + 'music2.mp3' },
  };
  for (const n of ['whoosh', 'swish', 'rise', 'thud', 'dong', 'pop', 'shine', 'scribble']) assets[n] = { type: 'audio', src: A + `sfx_${n}.mp3` };

  window.PROJECT = {
    title: '库库AI_第1-2段_试剪', width: 1920, height: 1080, duration: DUR,
    fonts: [{ family: 'KTitle', src: A + 'title.woff' }, { family: 'KSub', src: A + 'sub.woff' }],
    assets, scenes, overlay, audio, silence: A + 'silence.mp3',
    // 自查用：关键时间点
    checks: [30.25, 31.6, 33.6, 35.4, 37, 41.2, 42.9, 44.9, 46.2, 48.3, 50.2, 53.3, 54.9, 58.4, 60.9, 63.5, 65.3, 66.6],
    sections: [[0, '第 1 段 · 开头'], [SEG2, '第 2 段 · 查文献']],
    SUBS, T, V,
  };
})();
