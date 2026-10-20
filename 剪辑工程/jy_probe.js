/* 导出剪映工程：把网页时间线拆成「图层」描述（jianying.py 在浏览器里调用 window.JY_PROBE()）。
 * 每个场景：
 *   anchor 真人全屏 → 口播视频片段（按剪辑表切开）+ 每 0.5 秒一个位置/缩放关键帧
 *   rec    录屏     → 录屏素材片段（位置、缩放、圆角蒙版）+ 放大重点（裁出的区域、虚化压暗、标注）
 *   gfx    其他动画 → 在网页里渲染成一段视频（不带小圆窗和字幕）
 * 小圆窗：口播视频 + 圆形蒙版，单独一层。 */
(function () {
  const FPS = 30, D = KDraw;
  const near = (a, b, e = 1.5) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= e);

  function probeE() {
    return {
      video: (n, s) => ({ type: 'video', n, s }), image: n => ({ type: 'image', n }), tint: () => null,
      util: KUtil,
    };
  }

  /** 录屏场景：按时间采样，切成「素材不变」的片段；放大重点按「区域不变」再切 */
  function probeRec(sc) {
    const E = probeE(), samples = [];
    for (let t = sc.t0; t < sc.t1 - 1e-6; t += 1 / FPS) {
      const R = sc.get(t + 1e-4, E);
      samples.push({ t, R });
    }
    const pieces = [];
    for (const { t, R } of samples) {
      const last = pieces[pieces.length - 1];
      const key = R.el ? R.el.n : '';
      if (!last || last.n !== key) pieces.push({ n: key, type: R.el && R.el.type, t0: t, t1: t + 1 / FPS, s0: R.el && R.el.s, s1: R.el && R.el.s, iw: R.iw, ih: R.ih, focus: R.focus || [] });
      else { last.t1 = t + 1 / FPS; last.s1 = R.el && R.el.s; }
    }
    pieces[pieces.length - 1].t1 = sc.t1;
    for (const p of pieces) {
      const phone = p.ih > p.iw;
      p.geom = phone ? D.phoneGeom(p.iw, p.ih) : D.recGeom(p.iw, p.ih);
      p.phone = phone;
      if (p.type === 'video') p.speed = p.t1 - p.t0 > .05 && p.s1 != null ? Math.max(.05, (p.s1 - p.s0) / (p.t1 - p.t0 - 1 / FPS || 1)) : 1;
      // 放大重点：每个 focus 项，按区域 r 是否变化切成几段
      p.runs = [];
      for (const it of p.focus) {
        const a = Math.max(it.at, p.t0), b = Math.min(it.end != null ? it.end : p.t1, p.t1);
        if (b <= a) continue;
        const rAt = tt => (typeof it.r === 'function' ? it.r(tt) : it.r).map(v => Math.round(v));
        const ts = [], rs = [];
        for (let tt = a; tt < b; tt += 1 / FPS) { ts.push(tt); rs.push(rAt(tt)); }
        // 区域不变的一段为一个 run；区域在动的那几帧并到下一个 run（用停下来以后的区域）
        let cur = { a, b, r: rs[0], first: true }, moveStart = null;
        for (let j = 1; j < ts.length; j++) {
          if (near(rs[j], cur.r)) { moveStart = null; continue; }
          if (moveStart == null) moveStart = ts[j];
          const stable = j + 1 >= ts.length || near(rs[j], rs[j + 1], .5);
          if (stable) { cur.b = moveStart; p.runs.push(cur); cur = { a: moveStart, b, r: rs[j], first: false }; moveStart = null; }
        }
        cur.b = b; p.runs.push(cur);
        for (const run of p.runs.filter(x => !x.item)) {
          run.item = { at: it.at, maxW: it.maxW, maxH: it.maxH, cx: it.cx, cy: it.cy };
          run.target = D.focusGeom(run.r, it);
          run.marks = (it.marks || []).filter(m => m.at < run.b).map(m => ({ r: m.r, kind: m.kind || 'hl', at: Math.max(m.at, run.a) }));
        }
      }
    }
    return pieces;
  }

  /** 真人全屏：按口播剪辑表切开（素材时间跳了就切），每 0.5 秒一个关键帧 */
  function probeAnchor(sc) {
    const J = PROJECT.jy, pieces = [];
    let cur = null;
    for (let t = sc.t0; t < sc.t1 - 1e-6; t += 1 / FPS) {
      const v = J.anchorV(t + 1e-4);
      if (!cur || Math.abs(v - (cur.v0 + (t - cur.t0))) > .02) { if (cur) pieces.push(cur); cur = { t0: t, v0: v, t1: t + 1 / FPS }; }
      else cur.t1 = t + 1 / FPS;
    }
    cur.t1 = sc.t1; pieces.push(cur);
    for (const p of pieces) {
      p.keys = [];
      for (let t = p.t0; ; t = Math.min(p.t1, t + .5)) {
        const g = J.anchorGeom(Math.min(t, sc.t1 - 1e-3), sc.t0, sc.t1, sc.close);
        p.keys.push({ t: t - p.t0, x: g.x + g.w / 2, y: g.y + g.h / 2, k: g.k });
        if (t >= p.t1) break;
      }
    }
    return pieces;
  }

  /** 小圆窗：时间段，按口播剪辑表切开；每段取平均的圆心 */
  function probePip(t0, t1) {
    const J = PROJECT.jy, pieces = [];
    let cur = null;
    for (let t = t0; t < t1 - 1e-6; t += 1 / FPS) {
      const v = J.anchorV(t + 1e-4), src = J.pipSrc(v);
      if (!cur || Math.abs(v - (cur.v0 + (t - cur.t0))) > .02) { if (cur) pieces.push(cur); cur = { t0: t, v0: v, t1: t + 1 / FPS, acc: [0, 0, 0] }; }
      else cur.t1 = t + 1 / FPS;
      cur.acc[0] += src[0] + src[2] / 2; cur.acc[1] += src[1] + src[3] / 2; cur.acc[2]++; cur.S = src[2];
    }
    if (cur) { cur.t1 = t1; pieces.push(cur); }
    return pieces.map(p => ({ t0: p.t0, t1: p.t1, v0: p.v0, cx: p.acc[0] / p.acc[2], cy: p.acc[1] / p.acc[2], S: p.S }));
  }

  window.JY_PROBE = function () {
    const out = { scenes: [], pip: [], PIP: PROJECT.jy.PIP, anchorSize: [PROJECT.jy.ANCHOR_W, PROJECT.jy.ANCHOR_H] };
    const fake = document.createElement('canvas').getContext('2d');
    PROJECT.scenes.forEach((sc, i) => {
      const rec = { i, t0: sc.t0, t1: sc.t1, kind: sc.kind || 'gfx', close: !!sc.close, fadeOut: sc.fadeOut || 0 };
      if (rec.kind === 'rec') { rec.pieces = probeRec(sc); rec.noIn = !!(sc.opts && sc.opts.noIn); }
      if (rec.kind === 'anchor') rec.pieces = probeAnchor(sc);
      // 小圆窗：画三次这一场景，记下 pip() 的时间段
      window.__jyPip = new Set(); D.noPip = true;
      for (const f of [.2, .5, .8]) { try { sc.draw(fake, sc.t0 + (sc.t1 - sc.t0) * f, KE, sc); } catch (e) {} }
      D.noPip = false;
      for (const k of window.__jyPip) { const [a, b] = k.split(',').map(Number); out.pip.push(...probePip(Math.max(a, sc.t0), Math.min(b, sc.t1))); }
      window.__jyPip = null;
      out.scenes.push(rec);
    });
    return out;
  };

  /** 画一张透明的叠加图（PNG）：放大框描边 / 涂黄 / 虚线框 / 手机外框 / 手机压暗 / 小圆窗边框 / 黑场 */
  window.JY_OVERLAY = function (spec) {
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
    if (spec.kind === 'border') {
      const g = spec.g; ctx.save(); D.rr(ctx, g.x, g.y, g.w, g.h, 16); ctx.lineWidth = 5; ctx.strokeStyle = '#ffaa42'; ctx.shadowColor = 'rgba(255,170,66,.7)'; ctx.shadowBlur = 24; ctx.stroke(); ctx.restore();
    } else if (spec.kind === 'marks') {
      D.marks(ctx, 1e9, spec.x, spec.y, spec.k, spec.src, spec.marks.map(m => ({ r: m.r, kind: m.kind, at: 0, dur: .01 })));
    } else if (spec.kind === 'phoneFrame') {
      D.phoneFrame(ctx, spec.g);
    } else if (spec.kind === 'phoneShade') {
      ctx.fillStyle = 'rgba(10,8,22,.72)'; ctx.fillRect(0, 0, 1920, 1080);
      const gl = ctx.createRadialGradient(960, 470, 100, 960, 470, 620); gl.addColorStop(0, 'rgba(139,92,246,.35)'); gl.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, 1920, 1080);
    } else if (spec.kind === 'ring') {
      const P = PROJECT.jy.PIP; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(P.x, P.y, P.d / 2 + 6, 0, Math.PI * 2); ctx.arc(P.x, P.y, P.d / 2, 0, Math.PI * 2, true); ctx.fillStyle = '#8b5cf6'; ctx.fill(); ctx.restore();
    } else if (spec.kind === 'black') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080);
    }
    return c.toDataURL('image/png');
  };

  /** 录屏场景的背景（网格 + 光晕），只画背景 */
  window.JY_BG = function (i) {
    const sc = PROJECT.scenes[i], t = (sc.t0 + sc.t1) / 2;
    D.skipRec = true; D.noPip = true; KE.noOverlay = true;
    KE.render(t);
    D.skipRec = false; D.noPip = false; KE.noOverlay = false;
    return KE.canvas.toDataURL('image/jpeg', .9);
  };
})();
