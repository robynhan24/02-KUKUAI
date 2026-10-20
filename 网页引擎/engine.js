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
      this.t = 0; this.playing = false; this.dirty = true; this.want = new Map();
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
    video(name, srcT) {
      const v = this.vid[name]; if (!v) return null;
      srcT = Math.max(0, Math.min(srcT, (v.duration || 1e9) - 0.04));
      this.want.set(name, srcT);
      return v.readyState >= 2 ? v : null;
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
      if (this.dirty) { this.dirty = false; this.render(this.t); this._syncVideos(); this._uiTime(); }
      requestAnimationFrame(() => this._loop());
    }
    render(t) {
      const ctx = this.ctx, P = this.P;
      this.want.clear();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.fillStyle = '#07070c'; ctx.fillRect(0, 0, this.W, this.H);
      for (const s of P.scenes) {
        if (t >= s.t0 && t < s.t1) { ctx.save(); try { s.draw(ctx, t, this, s); } catch (e) { console.error(e); } ctx.restore(); }
      }
      if (P.overlay) { ctx.save(); P.overlay(ctx, t, this); ctx.restore(); }
    }
    _syncVideos() {
      for (const [k, v] of Object.entries(this.vid)) {
        const want = this.want.get(k);
        if (want === undefined) { if (!v.paused) v.pause(); continue; }
        if (this.playing && !this._exact) {
          if (v.paused) { v.currentTime = want; v.play().catch(() => {}); }
          else if (Math.abs(v.currentTime - want) > 0.25 && !v.seeking) v.currentTime = want;
        } else {
          if (!v.paused) v.pause();
          if (Math.abs(v.currentTime - want) > 0.017 && !v.seeking) v.currentTime = want;
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
      for (let i = 0; i < 40; i++) {
        this.render(this.t); this._syncVideos();
        let ok = true;
        for (const [k, want] of this.want) { const v = this.vid[k]; if (v.seeking || v.readyState < 2 || Math.abs(v.currentTime - want) > 0.02) ok = false; }
        if (ok) break;
        await new Promise(r => setTimeout(r, 60));
      }
      this.render(this.t); this._exact = false; this._uiTime();
      await new Promise(r => requestAnimationFrame(r));
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
    /** 有层次的深色背景：网格 + 两团慢慢飘的光 + 暗角（不用纯黑平涂） */
    bg(ctx, t, o = {}) {
      const W = 1920, H = 1080, c1 = o.c1 || 'rgba(124,58,237,.38)', c2 = o.c2 || 'rgba(35,136,255,.30)';
      ctx.fillStyle = o.base || '#0a0a12'; ctx.fillRect(0, 0, W, H);
      const g1 = ctx.createRadialGradient(420 + 80 * Math.sin(t * .4), 160 + 40 * Math.cos(t * .3), 0, 420, 160, 900);
      g1.addColorStop(0, c1); g1.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(1560 - 90 * Math.sin(t * .35), 900, 0, 1560, 900, 950);
      g2.addColorStop(0, c2); g2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.lineWidth = 1; ctx.beginPath();
      const s = 64, off = (t * 12) % s;
      for (let x = -s + off; x < W + s; x += s) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = -s + off; y < H + s; y += s) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      const v = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
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
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(cx, cy, d / 2 + 6, 0, Math.PI * 2); ctx.fillStyle = o.ring || '#8b5cf6'; ctx.fill();
      ctx.restore(); ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#222'; ctx.fillRect(cx - d / 2, cy - d / 2, d, d);
      if (el) ctx.drawImage(el, src[0], src[1], src[2], src[3], cx - d / 2, cy - d / 2, d, d);
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
    /** 底部字幕：白色粗黑体 + 深色半透明底 */
    subtitle(ctx, s, alpha = 1, o = {}) {
      if (!s) return;
      ctx.save(); ctx.globalAlpha = alpha;
      const size = o.size || 54, y = o.y || 1000;
      ctx.font = `800 ${size}px "KSub","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif`;
      const w = ctx.measureText(s).width, px = 26, h = size + 26;
      D.rr(ctx, 960 - w / 2 - px, y - h / 2, w + px * 2, h, 12); ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
      ctx.fillText(s, 960, y + size * .04);
      ctx.restore();
    },
  };

  window.KEngine = KEngine; window.KDraw = D; window.KUtil = { clamp, lerp, prog, ease };
})();
