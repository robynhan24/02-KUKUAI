/* 库库AI · 第 1 段（前 30 秒）时间线 —— 风格：秋芝-豆包
 * 口播时间 V（原口播秒数）→ 成片时间 T。剪掉两处 0.5 秒停顿，在「工具」后插 1 秒 logo 大标题。
 */
(function () {
  const D = KDraw, { clamp, lerp, prog, ease } = KUtil;
  const A = '剪辑工程/assets/';

  /* ---------- 口播剪辑表：[口播起, 口播止, 成片起] ---------- */
  const VOICE = [
    [0.00, 1.95, 0.00],
    [2.28, 8.50, 1.95],
    [8.80, 19.50, 8.17],
    // 18.87–19.87 插入：库库AI logo（停顿里单独出现 + 重击）
    [19.68, 29.50, 19.87],
  ];
  const T = v => { for (const [a, b, t] of VOICE) if (v >= a - 0.05 && v <= b + 0.05) return t + (v - a); return null; };
  const V = t => { for (const [a, b, t0] of VOICE) if (t >= t0 && t <= t0 + (b - a)) return a + (t - t0); return null; };
  const DUR = 30.4;

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
  ].map(([a, b, s]) => [T(a), T(b), s]);

  /* ---------- 主播 ---------- */
  const ANCHOR_W = 854, ANCHOR_H = 480;
  const PIP_SRC = [290, 22, 300, 300];          // 小圆窗取的区域（脸 + 肩）
  const PIP = { x: 160, y: 920, d: 230 };       // 左下角，避开内容和字幕
  function anchorEl(E, t) { const v = V(t); return v == null ? null : E.video('anchor', v); }
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
  {
    const t0 = 25.69, t1 = 27.81;
    scenes.push({
      t0, t1, draw(ctx, t, E) {
        D.bg(ctx, t);
        const bw = 900, bh = 172, gap = 54, top = 540 - (3 * bh + 2 * gap) / 2 - 40;
        NAV.forEach(([name, col, ta], i) => {
          const y = top + i * (bh + gap), x = 1000 - bw / 2;
          const inK = ease.out(prog(t, t0 + i * .07, t0 + i * .07 + .3)), on = ease.out(prog(t, ta, ta + .25));
          ctx.save(); ctx.globalAlpha = inK; ctx.translate((1 - inK) * 120, 0);
          if (on > 0) { ctx.save(); ctx.globalAlpha = inK * on * .22; D.rr(ctx, x, y, bw, bh, 22); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
          D.rr(ctx, x, y, bw, bh, 22); ctx.lineWidth = 7; ctx.strokeStyle = col; ctx.globalAlpha = inK * lerp(.55, 1, on); ctx.stroke();
          ctx.globalAlpha = inK;
          // 编号圆
          ctx.beginPath(); ctx.arc(x + 110, y + bh / 2, 54, 0, Math.PI * 2); ctx.lineWidth = 9; ctx.strokeStyle = col; ctx.stroke();
          D.text(ctx, String(i + 1), x + 110, y + bh / 2 + 4, { size: 76, color: col, shadow: false });
          // 名字：没揭晓前是问号
          const label = on > .5 ? name : '？？？';
          ctx.save(); const sc = on > .5 ? lerp(1.25, 1, ease.out(prog(t, ta + .12, ta + .35))) : 1; ctx.translate(x + 530, y + bh / 2 + 4); ctx.scale(sc, sc);
          D.text(ctx, label, 0, 0, { size: 96, color: '#fff' }); ctx.restore();
          ctx.restore();
        });
        pip(ctx, t, E, t0 + .1, t1);
      },
    });
  }

  // ⑫ 27.81–30.4 「学会以后，从此教研不发愁」真人收尾
  scenes.push(anchorFull(27.81, DUR));

  /* ---------- 音频 ---------- */
  const audio = [];
  VOICE.forEach(([a, b, t]) => audio.push({ asset: 'voice', at: t, from: a, dur: b - a, gain: 1, fadeIn: .02, fadeOut: .03 }));
  // 配乐：说话时压低；logo 停顿时抬起来配重击
  const speech = VOICE.map(([a, b, t]) => [t, t + (b - a)]);
  const LOW = .16, HIGH = .55;
  const env = [[0, LOW]];
  env.push([18.80, LOW], [18.87, .85], [19.75, .7], [19.95, LOW]);
  env.push([29.70, LOW], [30.0, .45], [DUR, 0]);
  audio.push({ asset: 'music', at: 0, from: 0, dur: DUR, gain: 1, fadeIn: .3, fadeOut: .4, env });
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
    logo: { type: 'image', src: A + 'logo.png' },
    voice: { type: 'audio', src: A + 'voice.mp3' }, music: { type: 'audio', src: A + 'music.mp3' },
  };
  for (const n of ['whoosh', 'swish', 'rise', 'thud', 'dong', 'pop', 'shine', 'scribble']) assets[n] = { type: 'audio', src: A + `sfx_${n}.mp3` };

  window.PROJECT = {
    title: '库库AI_第1段_试剪', width: 1920, height: 1080, duration: DUR,
    fonts: [{ family: 'KTitle', src: A + 'title.woff' }, { family: 'KSub', src: A + 'sub.woff' }],
    assets, scenes, overlay, audio,
    // 自查用：关键时间点
    checks: [0.9, 2.6, 4.4, 7.7, 10, 13.2, 14.4, 15.6, 17.5, 19.3, 20.4, 21.6, 24, 26.0, 27.5, 29],
    SUBS, T, V,
  };
})();
