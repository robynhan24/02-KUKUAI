/* 轻量网页剪辑引擎（纯 JS + Canvas，无依赖）
 * 一个项目 = 素材表 + 场景列表 + 音频表。浏览器里实时合成播放，不预先渲染。
 *
 *   const E = new KEngine(容器元素, 项目);
 *   项目 = {
 *     width, height, duration, fonts:[{family,src}],
 *     assets: { 名字: {type:'video', src:{mp4,webm}} | {type:'image', src} | {type:'audio', src} },
 *     scenes: [{t0, t1, draw(ctx, t, E)}],   // t 是成片时间；同一时刻可以有多个场景叠加，按顺序画
 *     overlay(ctx, t, E),                      // 每帧最后画（字幕等）
 *     audio: [{asset, at, from, dur, gain, fadeIn, fadeOut, env:[[t,g],...]}],
 *   }
 * 画面函数里取视频帧：E.video('名字', 素材秒数) → 可以 drawImage 的元素（没准备好时返回 null）。
 * 检查用：window.KE.seek(t) 返回 Promise，画好那一帧（视频都跳到位）才 resolve。
 */
(function () {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = {
    out: k => 1 - Math.pow(1 - k, 3),
    inOut: k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    back: k => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    elastic: k => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * (2 * Math.PI) / 3) + 1),
  };

  class KEngine {
    constructor(root, P) {
      this.P = P; this.W = P.width || 1920; this.H = P.height || 1080;
      this.t = 0; this.playing = false; this.dirty = true; this.want = new Map(); this.rate = new Map(); this.pre = new Map(); this.snapC = {}; this.lastWant = new Map();
      this.img = {}; this.vid = {}; this.buf = {}; this.cache = {};
      this.util = { clamp, lerp, prog, ease };
      this._ui(root);
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ac = null; }
      if (this.ac) {
        this.master = this.ac.createGain(); this.master.connect(this.ac.destination);
        this.ac.onstatechange = () => { if (this.playing && this.ac.state === 'running') { this.t0 = this._clock() - this.t; this._schedule(this.t); } this._uiSound(); };
      }
      this.ready = this._load();
      requestAnimationFrame(() => this._loop());
    }

    /* ---------- 加载 ---------- */
    async _load() {
      const P = this.P, jobs = [];
      for (const f of P.fonts || []) {
        jobs.push(new FontFace(f.family, `url("${f.src}")`).load().then(ff => document.fonts.add(ff)).catch(e => console.warn('字体', f.src, e)));
      }
      const probe = document.createElement('video');
      const useWebm = !probe.canPlayType('video/mp4; codecs="avc1.640028"') && probe.canPlayType('video/webm; codecs="vp9"');
      for (const [k, a] of Object.entries(P.assets)) {
        if (a.type === 'image') {
          jobs.push(new Promise(r => { const im = new Image(); im.onload = () => { this.img[k] = im; r(); }; im.onerror = () => { console.warn('图片', a.src); r(); }; im.src = a.src; }));
        } else if (a.type === 'video') {
          const v = document.createElement('video');
          v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
          v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
          v.src = typeof a.src === 'string' ? a.src : (useWebm ? a.src.webm : a.src.mp4);
          v.addEventListener('seeked', () => { this.dirty = true; });
          v.addEventListener('loadeddata', () => { this.dirty = true; });
          this.vid[k] = v;
          jobs.push(new Promise(r => { if (v.readyState >= 2) r(); v.addEventListener('loadeddata', r, { once: true }); v.addEventListener('error', () => { console.warn('视频', v.src); r(); }, { once: true }); setTimeout(r, 15000); }));
          v.load();
        } else if (a.type === 'audio' && this.ac) {
          jobs.push(fetch(a.src).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => this.ac.decodeAudioData(b, ok, no))).then(b => { this.buf[k] = b; }).catch(e => console.warn('音频', a.src, e)));
        }
      }
      let n = 0; const tot = jobs.length;
      jobs.forEach(j => j.then(() => { n++; this.ui.load.textContent = `加载素材 ${n}/${tot}`; }));
      await Promise.all(jobs);
      this.ui.load.style.display = 'none'; this.ui.big.style.display = 'flex'; this._uiSound();
      this.dirty = true;
    }

    /* ---------- 画面函数里用的 ---------- */
    /** rate：这一刻素材的播放速度（1 原速，1.3 快放，0 定格）。定格时视频暂停在准确的那一帧，不会来回跳 */
    video(name, srcT, rate = 1) {
      const v = this.vid[name]; if (!v) return null;
      srcT = Math.max(0, Math.min(srcT, (v.duration || 1e9) - 0.04));
      this.want.set(name, srcT); this.rate.set(name, rate);
      if (v.readyState >= 2 && !v.seeking) return v;
      return this.snapC[name] || null;   // 跳转中：用跳转前最后一帧顶上，不闪黑
    }
    /** 提前把下一个场景要用的视频跳到起点（暂停着），换画面时不用现找 */
    preload(name, srcT) {
      const v = this.vid[name]; if (!v || this.want.has(name)) return;
      this.pre.set(name, Math.max(0, Math.min(srcT, (v.duration || 1e9) - 0.04)));
    }
    /** 跳转前把当前画面存一张，跳转期间拿它顶上 */
    _snap(name, v) {
      if (v.readyState < 2 || !v.videoWidth) return;
      let c = this.snapC[name]; if (!c) c = this.snapC[name] = document.createElement('canvas');
      if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
      try { c.getContext('2d').drawImage(v, 0, 0); } catch (e) {}
    }
    image(name) { return this.img[name] || null; }
    /** 把黑色 logo 之类染成纯色（缓存） */
    tint(name, color) {
      const key = name + color; if (this.cache[key]) return this.cache[key];
      const im = this.img[name]; if (!im) return null;
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
      return (this.cache[key] = c);
    }

    /* ---------- 主循环 ---------- */
    _clock() { return this.ac && this.ac.state === 'running' ? this.ac.currentTime : performance.now() / 1000; }
    _loop() {
      if (this.playing) {
        this.t = this._clock() - this.t0;
        if (this.t >= this.P.duration) { this.pause(); this.t = this.P.duration; if (this._onEnd) this._onEnd(); }
        this.dirty = true;
      }
      if (this.dirty && !this._exact) { this.dirty = false; this.render(this.t); this._syncVideos(); this._uiTime(); }
      requestAnimationFrame(() => this._loop());
    }
    render(t) {
      const ctx = this.ctx, P = this.P;
      this.want.clear(); this.rate.clear(); this.pre.clear();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.fillStyle = '#07070c'; ctx.fillRect(0, 0, this.W, this.H);
      for (const s of P.scenes) {
        if (t >= s.t0 && t < s.t1) { ctx.save(); try { s.draw(ctx, t, this, s); } catch (e) { console.error(e); } ctx.restore(); }
      }
      if (P.overlay && !this.noOverlay) { ctx.save(); P.overlay(ctx, t, this); ctx.restore(); }
      for (const s of P.scenes) if (s.prep && s.t0 > t && s.t0 - t < 1.5) { try { s.prep(this); } catch (e) {} }   // noOverlay：导出剪映用的画面不带字幕
    }
    _syncVideos() {
      const now = this._clock();
      for (const [k, v] of Object.entries(this.vid)) {
        const want = this.want.get(k);
        if (want === undefined) {   // 这一刻用不到：暂停；下一个场景要用的话先跳到起点
          if (!v.paused) v.pause();
          const p = this.pre.get(k);
          if (p !== undefined && !v.seeking && Math.abs(v.currentTime - p) > .04) v.currentTime = p;
          this.lastWant.delete(k); continue;
        }
        const r = this.rate.get(k) ?? 1, lw = this.lastWant.get(k);
        this.lastWant.set(k, [want, now]);
        if (this.playing && !this._exact && r > 0) {
          if (v.paused) {
            if (Math.abs(v.currentTime - want) > .04 && !v.seeking) { this._snap(k, v); v.currentTime = want; }
            v.playbackRate = r; v.play().catch(() => {}); continue;
          }
          // 剪辑点（期望时间不连续）或偏差太大才跳；平时用播放速度慢慢追，避免一跳一卡
          const jump = lw ? Math.abs(want - (lw[0] + (now - lw[1]) * r)) : 0, drift = want - v.currentTime;
          if ((jump > .12 || Math.abs(drift) > .6) && !v.seeking) { this._snap(k, v); v.currentTime = want; v.playbackRate = r; }
          else { const nr = r * (1 + clamp(drift * .8, -.12, .12)); if (Math.abs(v.playbackRate - nr) > .005) v.playbackRate = nr; }
        } else {
          if (!v.paused) v.pause();
          if (Math.abs(v.currentTime - want) > 0.017 && !v.seeking) { this._snap(k, v); v.currentTime = want; }
        }
      }
    }

    /* ---------- 播放控制 ---------- */
    /** 在用户点击的同一瞬间解锁声音（Safari/iPhone 要求不能放在 Promise 回调里）。
     *  另外播一个静音的 <audio>，让 iPhone 把声音当「媒体播放」，静音键打开时也有声。 */
    _unlock() {
      if (!this.ac) return;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      if (this.ac.state !== 'running') this.ac.resume().catch(() => {});
      try { const b = this.ac.createBuffer(1, 1, 22050), s = this.ac.createBufferSource(); s.buffer = b; s.connect(this.ac.destination); s.start(0); } catch (e) {}
      if (!this._keep && this.P.silence) {
        const a = new Audio(this.P.silence); a.loop = true; a.setAttribute('playsinline', ''); a.volume = 0.01;
        a.play().then(() => { this._keep = a; }).catch(() => {});
      }
    }
    play() {
      if (this.playing) return;
      if (this.t >= this.P.duration - 0.05) this.t = 0;
      const go = () => { this.t0 = this._clock() - this.t; this.playing = true; this._schedule(this.t); this.ui.play.textContent = '❚❚'; this.ui.big.style.display = 'none'; this._uiSound(); };
      if (this.ac && this.ac.state !== 'running') this.ac.resume().then(go, go); else go();
    }
    pause() {
      this.playing = false; this._stopAudio(); this.ui.play.textContent = '▶'; this.dirty = true;
      for (const v of Object.values(this.vid)) v.pause();
    }
    toggle() { this.playing ? this.pause() : this.play(); }
    seek(t) {
      const was = this.playing; if (was) this.pause();
      this.t = clamp(t, 0, this.P.duration); this.dirty = true;
      if (was) this.play();
      return this._settle();
    }
    /** 等所有需要的视频跳到位再画一次（截图自查用） */
    async _settle() {
      this._exact = true;
      this.render(this.t); this._syncVideos();          // 先画一次，得到这一帧要用的视频和时间
      for (let i = 0; i < 160; i++) {                   // 等视频跳到位（不重画，只检查）
        let ok = true;
        for (const [k, want] of this.want) { const v = this.vid[k]; if (v.seeking || v.readyState < 2 || Math.abs(v.currentTime - want) > 0.02) { ok = false; if (!v.seeking && Math.abs(v.currentTime - want) > 0.02) v.currentTime = want; } }
        if (ok) break;
        await new Promise(r => setTimeout(r, 15));
      }
      this.render(this.t); this._exact = false; this.dirty = false; this._uiTime();
    }

    /* ---------- 声音 ---------- */
    _schedule(from) {
      this._stopAudio(); if (!this.ac) return;
      const now = this.ac.currentTime; this.srcs = [];
      for (const c of this.P.audio || []) {
        const b = this.buf[c.asset]; if (!b) continue;
        const dur = c.dur != null ? c.dur : b.duration - (c.from || 0);
        const end = c.at + dur; if (end <= from) continue;
        const s = this.ac.createBufferSource(); s.buffer = b;
        const g = this.ac.createGain(); s.connect(g); g.connect(this.master);
        const off = Math.max(0, from - c.at), startAt = now + Math.max(0, c.at - from);
        const base = c.gain != null ? c.gain : 1, fi = c.fadeIn || 0.012, fo = c.fadeOut || 0.012;
        const env = c.env || [[c.at, 1], [end, 1]];
        const gainAt = tt => { // 成片时间 → 增益
          let e = env[0][1];
          for (let i = 0; i < env.length - 1; i++) if (tt >= env[i][0] && tt <= env[i + 1][0]) { e = lerp(env[i][1], env[i + 1][1], (tt - env[i][0]) / Math.max(1e-6, env[i + 1][0] - env[i][0])); break; }
          if (tt > env[env.length - 1][0]) e = env[env.length - 1][1];
          return base * e * clamp((tt - c.at) / fi) * clamp((end - tt) / fo);
        };
        const pts = new Set([Math.max(from, c.at), c.at + fi, end - fo, end]);
        for (const [et] of env) pts.add(et);
        const list = [...pts].filter(x => x >= Math.max(from, c.at) && x <= end).sort((a, b) => a - b);
        g.gain.setValueAtTime(gainAt(list[0]), now + Math.max(0, list[0] - from));
        for (const x of list.slice(1)) g.gain.linearRampToValueAtTime(gainAt(x), now + (x - from));
        s.start(startAt, (c.from || 0) + off, dur - off);
        this.srcs.push(s);
      }
    }
    _stopAudio() { for (const s of this.srcs || []) { try { s.stop(); } catch (e) {} } this.srcs = []; }

    /* ---------- 导出（实时录制画布 + 声音，生成 webm/mp4 下载） ---------- */
    async export() {
      if (!window.MediaRecorder) { alert('这个浏览器不支持录制，请用电脑版 Chrome。'); return; }
      await this.ready; this.pause(); await this.seek(0);
      const stream = this.canvas.captureStream(30);
      if (this.ac) { const d = this.ac.createMediaStreamDestination(); this.master.connect(d); d.stream.getAudioTracks().forEach(tr => stream.addTrack(tr)); this._dest = d; }
      const types = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm'];
      const mime = types.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16e6 }), parts = [];
      rec.ondataavailable = e => e.data.size && parts.push(e.data);
      rec.onstop = () => {
        if (this._dest) this.master.disconnect(this._dest);
        const blob = new Blob(parts, { type: mime || 'video/webm' }), a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = (this.P.title || '成片') + (mime.includes('mp4') ? '.mp4' : '.webm'); a.click();
        this.ui.exp.textContent = '导出';
      };
      this._onEnd = () => { this._onEnd = null; setTimeout(() => rec.stop(), 300); };
      this.ui.exp.textContent = '录制中…'; rec.start(); this.play();
    }

    /* ---------- 界面 ---------- */
    _ui(root) {
      root.innerHTML = '';
      const css = document.createElement('style');
      css.textContent = `
        .ke{position:relative;width:100%;max-width:calc((100vh - 64px)*16/9);margin:0 auto;font-family:system-ui,sans-serif;color:#eee}
        .ke canvas{display:block;width:100%;height:auto;aspect-ratio:16/9;background:#07070c;border-radius:6px}
        .ke .bar{display:flex;align-items:center;gap:10px;padding:8px 2px}
        .ke button{background:#22222c;color:#eee;border:1px solid #3a3a48;border-radius:6px;padding:6px 12px;font-size:15px;cursor:pointer}
        .ke input[type=range]{flex:1;accent-color:#f5df27}
        .ke .tm{font-variant-numeric:tabular-nums;font-size:14px;min-width:96px;text-align:right}
        .ke .big{position:absolute;inset:0;bottom:44px;display:none;align-items:center;justify-content:center;cursor:pointer}
        .ke .big span{width:96px;height:96px;border-radius:50%;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-size:40px;padding-left:8px;border:2px solid rgba(255,255,255,.7)}
        .ke .secs{display:flex;flex-wrap:wrap;gap:8px;padding:2px 2px 6px}
        .ke .snd{font-size:13px;color:#f5a524;white-space:nowrap}
        .ke .load{position:absolute;left:0;right:0;top:40%;text-align:center;font-size:18px}`;
      document.head.appendChild(css);
      const box = document.createElement('div'); box.className = 'ke';
      const cv = document.createElement('canvas'); cv.width = this.W; cv.height = this.H;
      const bar = document.createElement('div'); bar.className = 'bar';
      const play = document.createElement('button'); play.textContent = '▶';
      const rng = document.createElement('input'); rng.type = 'range'; rng.min = 0; rng.max = this.P.duration; rng.step = 0.01; rng.value = 0;
      const tm = document.createElement('span'); tm.className = 'tm';
      const exp = document.createElement('button'); exp.textContent = '导出';
      const snd = document.createElement('span'); snd.className = 'snd';
      const big = document.createElement('div'); big.className = 'big'; big.innerHTML = '<span>▶</span>';
      const load = document.createElement('div'); load.className = 'load'; load.textContent = '加载素材…';
      bar.append(play, rng, tm, snd, exp);
      box.append(cv, bar, big, load);
      // 分段跳转按钮
      if (this.P.sections && this.P.sections.length > 1) {
        const secs = document.createElement('div'); secs.className = 'secs';
        for (const [st, name] of this.P.sections) { const b = document.createElement('button'); b.textContent = name; b.onclick = () => { this._unlock(); this.ready.then(() => { this.seek(st); if (!this.playing) this.play(); }); }; secs.appendChild(b); }
        box.appendChild(secs);
      }
      root.appendChild(box);
      this.canvas = cv; this.ctx = cv.getContext('2d');
      this.ui = { play, rng, tm, exp, big, load, snd };
      play.onclick = () => { this._unlock(); this.ready.then(() => this.toggle()); };
      big.onclick = () => { this._unlock(); this.ready.then(() => this.play()); };
      cv.onclick = () => { this._unlock(); this.ready.then(() => this.toggle()); };
      rng.oninput = () => { this._scrub = true; this.seek(+rng.value); };
      rng.onchange = () => { this._scrub = false; };
      exp.onclick = () => { this._unlock(); this.export(); };
      window.addEventListener('keydown', e => {
        if (e.code === 'Space') { e.preventDefault(); this._unlock(); this.toggle(); }
        if (e.code === 'ArrowLeft') this.seek(this.t - (e.shiftKey ? 1 : 1 / 30));
        if (e.code === 'ArrowRight') this.seek(this.t + (e.shiftKey ? 1 : 1 / 30));
      });
    }
    _uiSound() {
      const want = Object.values(this.P.assets).filter(a => a.type === 'audio').length, got = Object.keys(this.buf).length;
      let msg = '';
      if (!this.ac) msg = '浏览器不支持声音';
      else if (got < want) msg = `声音加载失败 ${got}/${want}`;
      else if (this.playing && this.ac.state !== 'running') msg = '声音未开启，点一下画面';
      this.ui.snd.textContent = msg;
    }
    _uiTime() {
      const f = x => `${Math.floor(x / 60)}:${(x % 60).toFixed(2).padStart(5, '0')}`;
      this.ui.tm.textContent = `${f(this.t)} / ${f(this.P.duration)}`;
      if (!this._scrub) this.ui.rng.value = this.t;
    }
  }

  /* ---------- 通用画法 ---------- */
  const D = {
    rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); },
    /** 背景：黑底 + 淡淡的白色网格（阿亮 10-20：所有黑色背景都换成网格，线条淡显） */
    bg(ctx, t, o = {}) {
      if (D.noBg) return;   // 转场时由外面统一画一次底，避免网格跟着缩放
      const W = 1920, H = 1080, s = 112;
      ctx.fillStyle = '#030304'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.11)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = (W / 2) % s; x < W; x += s) { ctx.moveTo(Math.round(x) + .5, 0); ctx.lineTo(Math.round(x) + .5, H); }
      for (let y = (H / 2) % s; y < H; y += s) { ctx.moveTo(0, Math.round(y) + .5); ctx.lineTo(W, Math.round(y) + .5); }
      ctx.stroke();
    },
    /** 软件窗口：圆角 + 阴影 + 细边；src 是素材里要显示的区域 [sx,sy,sw,sh] */
    win(ctx, el, src, x, y, w, h, o = {}) {
      const r = o.r != null ? o.r : 22;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
      D.rr(ctx, x, y, w, h, r); ctx.fillStyle = o.fill || '#fff'; ctx.fill();
      ctx.restore(); ctx.save();
      D.rr(ctx, x, y, w, h, r); ctx.clip();
      if (el) {
        if (o.contain) {
          const k = Math.min(w / src[2], h / src[3]), dw = src[2] * k, dh = src[3] * k;
          ctx.drawImage(el, src[0], src[1], src[2], src[3], x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        } else ctx.drawImage(el, src[0], src[1], src[2], src[3], x, y, w, h);
      }
      if (o.after) o.after(ctx);
      ctx.restore();
      ctx.save(); D.rr(ctx, x + .5, y + .5, w - 1, h - 1, r); ctx.strokeStyle = o.border || 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    },
    /** 铺满画面（cover）。zoom/cx/cy 控制推近和中心（0–1） */
    cover(ctx, el, iw, ih, o = {}) {
      const W = 1920, H = 1080, z = o.zoom || 1, k = Math.max(W / iw, H / ih) * z;
      const dw = iw * k, dh = ih * k, cx = o.cx != null ? o.cx : .5, cy = o.cy != null ? o.cy : .5;
      const dx = clamp(W / 2 - cx * dw, W - dw, 0), dy = clamp(H / 2 - cy * dh, H - dh, 0);
      ctx.drawImage(el, dx, dy, dw, dh);
    },
    /** 主播圆形小窗 */
    pip(ctx, el, src, cx, cy, d, o = {}) {
      // 阿亮 10-21：边缘用白色细线 + 柔和的小光晕（点缀，不夸张）
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
      ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill();
      ctx.restore(); ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#222'; ctx.fillRect(cx - d / 2, cy - d / 2, d, d);
      if (el) ctx.drawImage(el, src[0], src[1], src[2], src[3], cx - d / 2, cy - d / 2, d, d);
      ctx.restore(); ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, d / 2 + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(255,255,255,.75)'; ctx.shadowBlur = 12; ctx.stroke();
      ctx.restore();
    },
    /** 大字：描边 + 阴影 */
    text(ctx, s, x, y, o = {}) {
      ctx.save();
      ctx.font = `${o.weight || 900} ${o.size || 80}px ${o.font || '"KTitle","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif'}`;
      ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
      if (o.shadow !== false) { ctx.shadowColor = o.shadow || 'rgba(0,0,0,.65)'; ctx.shadowBlur = o.blur || 24; ctx.shadowOffsetY = 6; }
      if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW || 10; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); ctx.shadowColor = 'transparent'; }
      ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y);
      ctx.restore();
    },
    /** 强调标记。list 项：{r:[x0,y0,x1,y1](素材坐标), at, dur, kind:'hl'黄色涂亮|'box'橙色虚线框}
     *  x,y = 素材区域 src 左上角画到画面上的位置，k = 缩放 */
    marks(c, t, x, y, k, src, list) {
      for (const it of list || []) {
        const p = ease.out(prog(t, it.at, it.at + (it.dur || .3))); if (p <= 0) continue;
        const rx = x + (it.r[0] - src[0]) * k, ry = y + (it.r[1] - src[1]) * k, rw = (it.r[2] - it.r[0]) * k, rh = (it.r[3] - it.r[1]) * k;
        if (it.kind === 'box') {
          c.save(); c.setLineDash([18, 12]); c.lineDashOffset = -t * 40; c.lineWidth = 6; c.strokeStyle = `rgba(255,170,66,${p})`;
          const g = 1 + (1 - p) * .15; D.rr(c, rx + rw / 2 - (rw / 2 + 12) * g, ry + rh / 2 - (rh / 2 + 10) * g, (rw + 24) * g, (rh + 20) * g, 14); c.stroke(); c.restore();
        } else {
          c.save(); c.fillStyle = 'rgba(245,223,39,.45)'; D.rr(c, rx - 4, ry, (rw + 8) * p, rh, 6); c.fill(); c.restore();
        }
      }
    },
    /** 全屏录屏的镜头：区域 r → {cx, cy, z}；r 为 null 时是全画面 */
    camOf(r, iw, ih, pad = .86) {
      if (!r) return { cx: iw / 2, cy: ih / 2, z: 1 };
      const rw = r[2] - r[0], rh = r[3] - r[1], z = Math.max(1, Math.min(iw / rw, ih / rh) * pad);
      const vw = iw / z, vh = ih / z;
      return { cx: clamp((r[0] + r[2]) / 2, vw / 2, iw - vw / 2), cy: clamp((r[1] + r[3]) / 2, vh / 2, ih - vh / 2), z };
    },
    /** 镜头在 t 时的状态：cam = [[时间, 区域或 null, 秒数?], ...]，默认每次推拉用 dur 秒（缓动） */
    camAt(cam, t, iw, ih, dur = .7) {
      let cur = D.camOf(null, iw, ih);
      for (let i = 0; i < (cam || []).length; i++) {
        const [ta, r, d] = cam[i]; if (t < ta) break;      // 第三项：这一次推拉用几秒；0 = 直接到位（软切时用）
        const dd = d == null ? dur : d, nxt = D.camOf(r, iw, ih), k = dd <= 0 ? 1 : ease.inOut(prog(t, ta, ta + dd));
        cur = { cx: lerp(cur.cx, nxt.cx, k), cy: lerp(cur.cy, nxt.cy, k), z: Math.exp(lerp(Math.log(cur.z), Math.log(nxt.z), k)) };
      }
      return cur;
    },
    /** 全屏录屏（铺满 1920×1080）。el 的画面对应坐标空间 iw×ih（原始录屏像素）；cam 镜头推拉；
     *  o.layers：[{el, r:[x0,y0,x1,y1]}] 叠在录屏上的局部视频（同一坐标，严丝合缝），比如 3D 课件里单独裁出来的模块；
     *  o.marks：马克笔 / 框选，r 用量好的字的范围（measure.py）。返回 {dx, dy, sc}（录屏坐标 → 画面）。 */
    recFull(ctx, t, el, iw, ih, o = {}) {
      const c = D.camAt(o.cam, t, iw, ih), k0 = Math.max(1920 / iw, 1080 / ih), sc = k0 * c.z;
      let dx = 960 - c.cx * sc, dy = 540 - c.cy * sc;
      dx = iw * sc >= 1920 ? clamp(dx, 1920 - iw * sc, 0) : (1920 - iw * sc) / 2;
      dy = ih * sc >= 1080 ? clamp(dy, 1080 - ih * sc, 0) : (1080 - ih * sc) / 2;
      ctx.imageSmoothingQuality = 'high';
      if (el) {
        const vw = el.videoWidth || el.naturalWidth || el.width, vh = el.videoHeight || el.naturalHeight || el.height;
        ctx.drawImage(el, 0, 0, vw, vh, dx, dy, iw * sc, ih * sc);
      }
      for (const L of o.layers || []) {
        if (!L.el) continue;
        const [x0, y0, x1, y1] = L.r;
        ctx.drawImage(L.el, dx + x0 * sc, dy + y0 * sc, (x1 - x0) * sc, (y1 - y0) * sc);
      }
      D.marksOn(ctx, t, o.marks, dx, dy, sc);
      return { dx, dy, sc };
    },
    /** 马克笔 / 框选（画在录屏坐标上；跟着画面一起淡入淡出） */
    marksOn(ctx, t, marks, dx, dy, sc) {
      const A0 = ctx.globalAlpha;
      for (const m of marks || []) {
        if (t < m.at || (m.end != null && t >= m.end)) continue;
        const p = ease.out(prog(t, m.at, m.at + (m.dur || .35))), fo = m.end != null ? 1 - prog(t, m.end - .2, m.end) : 1;
        const x = dx + m.r[0] * sc, y = dy + m.r[1] * sc, w = (m.r[2] - m.r[0]) * sc, h = (m.r[3] - m.r[1]) * sc;
        ctx.save();
        if (m.kind === 'click') { // 点击：从鼠标尖端扩散两圈涟漪
          for (const d of [0, .14]) {
            const q = prog(t, m.at + d, m.at + d + .55); if (q <= 0 || q >= 1) continue;
            ctx.globalAlpha = A0 * (1 - q); ctx.lineWidth = 4; ctx.strokeStyle = '#ff5a1f';
            ctx.beginPath(); ctx.arc(x, y, 10 + 46 * ease.out(q), 0, Math.PI * 2); ctx.stroke();
          }
        } else if (m.kind === 'box') {   // 框选：橙红圆角框，框在量好的范围上（不压字），从稍大收到位
          const g = 1 + (1 - p) * .08; ctx.globalAlpha = A0 * fo * p;
          ctx.lineWidth = m.lw || 5; ctx.strokeStyle = '#ff5a1f'; ctx.shadowColor = 'rgba(255,90,31,.5)'; ctx.shadowBlur = m.lw && m.lw < 4 ? 6 : 14;
          D.rr(ctx, x + w / 2 - w / 2 * g, y + h / 2 - h / 2 * g, w * g, h * g, Math.min(12, h / 4)); ctx.stroke();
        } else {                   // 马克笔描色：亮黄，正片叠底，从左往右涂过去
          ctx.globalAlpha = A0 * fo;
          ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,224,40,.85)';
          D.rr(ctx, x, y, w * p, h, 5); ctx.fill();
        }
        ctx.restore();
      }
    },
    /** 放大后的局部在画面上的位置 */
    focusGeom(r, it) {
      const rw = r[2] - r[0], rh = r[3] - r[1], s = Math.min((it.maxW || 1640) / rw, (it.maxH || 720) / rh), w = rw * s, h = rh * s;
      return { x: (it.cx || 980) - w / 2, y: (it.cy || 450) - h / 2, w, h, s };
    },
    /** 软模糊（缩小再放大，所有浏览器都能用） */
    _blurred(el, iw, ih) {
      const bw = Math.max(16, Math.round(iw / 14)), bh = Math.max(9, Math.round(ih / 14));
      if (!D._bc) { D._bc = document.createElement('canvas'); D._bg = D._bc.getContext('2d'); }
      if (D._bc.width !== bw || D._bc.height !== bh) { D._bc.width = bw; D._bc.height = bh; }
      D._bg.imageSmoothingQuality = 'high'; D._bg.drawImage(el, 0, 0, iw, ih, 0, 0, bw, bh);
      return D._bc;
    },
    /** 整屏录屏窗口 + 局部放大。
     *  el/iw/ih：录屏（视频或图片）和它的原始尺寸；o.box：窗口最大范围 [x,y,w,h]（默认约 1680×945）
     *  o.focus：[{at, end, r:[x0,y0,x1,y1] 或 t=>[...], marks:[...], cx, cy, maxW, maxH}]
     *  框选开始后：背景录屏虚化 + 压暗，选中的那块从原位置放大到画面中间。 */
    /** 横屏录屏窗口的位置：box 内等比放下、居中 */
    recGeom(iw, ih, box) {
      const B = box || [120, 36, 1680, 945];
      const k = Math.min(B[2] / iw, B[3] / ih), w = iw * k, h = ih * k;
      return { x: B[0] + (B[2] - w) / 2, y: B[1] + (B[3] - h) / 2, w, h, k, r: 18 };
    },
    /** 竖屏手机录屏的位置（屏幕区域，不含外框）；外框厚度 bezel */
    phoneGeom(iw, ih, o = {}) {
      const h = o.phoneH || 856, k = h / ih, w = iw * k;
      return { x: 960 - w / 2, y: o.phoneY == null ? 46 : o.phoneY, w, h, k, r: 46 * h / 856, bezel: 15 };
    },
    /** 手机外框：深色机身 + 金属边 + 侧键（屏幕区域 x,y,w,h 外面一圈） */
    phoneFrame(ctx, g, alpha = 1) {
      const b = g.bezel, X = g.x - b, Y = g.y - b, W = g.w + 2 * b, H = g.h + 2 * b, R = g.r + b;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = '#2a2a33';               // 侧键
      for (const [bx, by, bh] of [[X - 5, Y + 150, 70], [X - 5, Y + 240, 70], [X + W - 1, Y + 200, 110]]) { D.rr(ctx, bx, by, 6, bh, 3); ctx.fill(); }
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X, Y, W, H, R) : ctx.rect(X, Y, W, H);
      ctx.roundRect ? ctx.roundRect(g.x, g.y, g.w, g.h, g.r) : ctx.rect(g.x, g.y, g.w, g.h);
      const gr = ctx.createLinearGradient(X, Y, X + W, Y + H); gr.addColorStop(0, '#2b2b34'); gr.addColorStop(.5, '#0d0d12'); gr.addColorStop(1, '#24242c');
      ctx.fillStyle = gr; ctx.fill('evenodd');
      D.rr(ctx, X + 1.5, Y + 1.5, W - 3, H - 3, R - 1); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(210,210,225,.55)'; ctx.stroke();
      D.rr(ctx, g.x - 1, g.y - 1, g.w + 2, g.h + 2, g.r + 1); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.stroke();
      ctx.restore();
    },
    /** 整屏录屏窗口 + 局部放大。
     *  el/iw/ih：录屏（视频或图片）和它的原始尺寸；o.box：窗口最大范围 [x,y,w,h]（默认约 1680×945）
     *  竖屏（ih > iw）自动当成手机：虚化的同一画面铺满做底 + 手机外框（阿亮 10-20）
     *  o.focus：[{at, end, r:[x0,y0,x1,y1] 或 t=>[...], marks:[...], cx, cy, maxW, maxH}]
     *  框选开始后：背景录屏虚化 + 压暗，选中的那块从原位置放大到画面中间。 */
    rec(ctx, t, el, iw, ih, o = {}) {
      if (D.skipRec) return;                    // 导出剪映背景用：只画背景
      const phone = ih > iw;
      const g = phone ? D.phoneGeom(iw, ih, o) : D.recGeom(iw, ih, o.box);
      const { x, y, w, h, k } = g;
      const env = it => ease.inOut(prog(t, it.at, it.at + .4)) * (it.end != null ? 1 - ease.inOut(prog(t, it.end - .3, it.end)) : 1);
      const items = (o.focus || []).map(it => [it, env(it)]).filter(([, e]) => e > 0);
      const blur = Math.max(o.blur || 0, items.reduce((m, [, e]) => Math.max(m, e), 0));
      if (phone && el) {
        // 层次：同一画面放大虚化铺满做底，再压暗，中间一圈柔光
        ctx.save(); ctx.imageSmoothingQuality = 'high';
        const s = Math.max(1920 / iw, 1080 / ih) * 1.05; ctx.globalAlpha = .6;
        ctx.drawImage(D._blurred(el, iw, ih), 960 - iw * s / 2, 540 - ih * s / 2, iw * s, ih * s);
        ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(10,8,22,.72)'; ctx.fillRect(0, 0, 1920, 1080);
        const gl = ctx.createRadialGradient(960, 470, 100, 960, 470, 620); gl.addColorStop(0, 'rgba(139,92,246,.35)'); gl.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.fillStyle = gl; ctx.fillRect(0, 0, 1920, 1080);
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = phone ? 70 : 50; ctx.shadowOffsetY = 18;
      D.rr(ctx, x, y, w, h, g.r); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore(); ctx.save(); D.rr(ctx, x, y, w, h, g.r); ctx.clip();
      if (el) {
        ctx.drawImage(el, 0, 0, iw, ih, x, y, w, h);
        if (blur > 0) { ctx.globalAlpha = blur; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(D._blurred(el, iw, ih), x, y, w, h); ctx.globalAlpha = 1; }
        if (o.marks) D.marks(ctx, t, x, y, k, [0, 0, iw, ih], o.marks);
      }
      if (blur > 0) { ctx.fillStyle = `rgba(8,8,14,${.55 * blur})`; ctx.fillRect(x, y, w, h); }
      ctx.restore();
      if (phone) D.phoneFrame(ctx, g);
      else { ctx.save(); D.rr(ctx, x + .5, y + .5, w - 1, h - 1, 18); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      // 放大的局部
      for (const [it, e] of items) {
        const r = typeof it.r === 'function' ? it.r(t) : it.r, rw = r[2] - r[0], rh = r[3] - r[1];
        const T = D.focusGeom(r, it), tw = T.w, th = T.h, tx = T.x, ty = T.y;
        const ox = x + r[0] * k, oy = y + r[1] * k, ow = rw * k, oh = rh * k;
        const px = lerp(ox, tx, e), py = lerp(oy, ty, e), pw = lerp(ow, tw, e), ph = lerp(oh, th, e);
        ctx.save(); ctx.globalAlpha = clamp(e * 1.6);
        ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 60 * e; ctx.shadowOffsetY = 20 * e;
        D.rr(ctx, px, py, pw, ph, 16); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.restore(); ctx.save(); ctx.globalAlpha = clamp(e * 1.6);
        D.rr(ctx, px, py, pw, ph, 16); ctx.clip();
        if (el) ctx.drawImage(el, r[0], r[1], rw, rh, px, py, pw, ph);
        D.marks(ctx, t, px, py, pw / rw, [r[0], r[1]], it.marks);
        ctx.restore();
        ctx.save(); ctx.globalAlpha = clamp(e * 1.6); D.rr(ctx, px, py, pw, ph, 16); ctx.lineWidth = 5; ctx.strokeStyle = '#ffaa42'; ctx.shadowColor = 'rgba(255,170,66,.7)'; ctx.shadowBlur = 24; ctx.stroke(); ctx.restore();
      }
    },
    /** 底部字幕：得意黑（SmileySans），白字 + 深色描边和阴影，不加底色（阿亮 10-20） */
    subtitle(ctx, s, alpha = 1, o = {}) {
      if (!s) return;
      ctx.save(); ctx.globalAlpha = alpha;
      const size = o.size || 62, y = o.y || 1004;
      ctx.font = `${size}px "KSub","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
      ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(12,12,16,.92)'; ctx.strokeText(s, 960, y);
      ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fff'; ctx.fillText(s, 960, y);
      ctx.restore();
    },
  };

  window.KEngine = KEngine; window.KDraw = D; window.KUtil = { clamp, lerp, prog, ease };
})();
