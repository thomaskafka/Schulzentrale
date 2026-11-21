'use strict';
/* ===== Kinderfreundlicher Timer: Blöcke, Sanduhr, Zeitscheibe, Kerze ===== */

const TMODES = [
  { id: 'bloecke', icon: '🧱', name: 'Fallende Blöcke' },
  { id: 'sanduhr', icon: '⏳', name: 'Sanduhr' },
  { id: 'tetris', icon: '🧩', name: 'Tetris' },
  { id: 'snake', icon: '🐍', name: 'Snake' },
  { id: 'kerze', icon: '🕯️', name: 'Kerze' },
  { id: 'rakete', icon: '🚀', name: 'Rakete zum Mond' },
  { id: 'ballons', icon: '🎈', name: 'Luftballons' },
  { id: 'blume', icon: '🌻', name: 'Blume wächst' },
  { id: 'schneemann', icon: '⛄', name: 'Schneemann' },
  { id: 'ring', icon: '◯', name: 'Ring (schlicht)' },
  { id: 'fortschritt', icon: '▭', name: 'Fortschritt' },
];

registerModule({
  id: 'timer', title: 'Timer', icon: '⏳',
  render(el) {
    const mod = this, cfg = state.timer;
    el.innerHTML = `<div class="page">
      <div class="side-layout rev">
        <section class="card timer-stage" id="tStage">
          <canvas id="tc"></canvas>
          <div class="t-digits" id="tDig"></div>
          <div class="t-done" id="tDone"><span>⏰ Zeit ist um!</span></div>
          <button class="t-voll" id="tVoll" title="Timer im Vollbild (Esc beendet)">⛶</button>
          <div class="t-fsbar"><button id="tFsStart">▶ Start</button><button id="tFsReset" title="Zurücksetzen">↺</button><button id="tFsZu" title="Vollbild beenden">✕</button></div>
        </section>
        <aside class="card side">
          <h3>Zeit</h3>
          <div class="presets">${[1, 2, 3, 5, 10, 15, 20, 30].map(m => `<button class="btn" data-min="${m}">${m} min</button>`).join('')}</div>
          <div class="row tcustom"><input type="number" id="tMin" min="0" max="180" class="num"> min <input type="number" id="tSec" min="0" max="59" step="5" class="num"> s</div>
          <h3>Darstellung</h3>
          <div class="modes">${TMODES.map(m => `<button class="mode" data-mode="${m.id}"><span>${m.icon}</span>${m.name}</button>`).join('')}</div>
          <label class="chk"><input type="checkbox" id="tZiff"> Ziffern anzeigen</label>
          <label class="chk"><input type="checkbox" id="tTon"> Gong am Ende</label>
          <div class="row tctrl"><button class="btn primary big" id="tStart">▶ Start</button><button class="btn big" id="tReset" title="Zurücksetzen">↺</button></div>
          <button class="btn full" id="tVoll2">⛶ Timer im Vollbild</button>
        </aside>
      </div></div>`;

    const $ = id => el.querySelector('#' + id);
    const cv = $('tc'), ctx = cv.getContext('2d');
    let W = 0, H = 0, T = 0, elapsed = 0, running = false, last = 0, finished = false, seed = Math.random() * 1e9;

    const setTime = (min, sec) => {
      cfg.min = Math.max(0, Math.min(180, min | 0)); cfg.sec = Math.max(0, Math.min(59, sec | 0));
      if (!cfg.min && !cfg.sec) cfg.sec = 10;
      if (!DRAW[cfg.modus]) cfg.modus = 'bloecke'; // Schutz vor ungültigem Wert
  $('tMin').value = cfg.min; $('tSec').value = cfg.sec; save(); reset();
    };
    const reset = () => {
      T = (cfg.min * 60 + cfg.sec) * 1000; elapsed = 0; running = false; finished = false; seed = Math.random() * 1e9;
      $('tDone').classList.remove('show'); btn();
    };
    const btn = () => { $('tStart').textContent = $('tFsStart').textContent = running ? '⏸ Pause' : elapsed > 0 && !finished ? '▶ Weiter' : '▶ Start'; };
    /* Vollbild: nur die Timer-Fläche, Einstellungen ausgeblendet; Steuerleiste erscheint bei Mausbewegung */
    const vollbild = () => { const st = $('tStage'); document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.(); };
    let leisteT;
    const leisteZeigen = () => { const st = $('tStage'); st.classList.add('fs-aktiv'); clearTimeout(leisteT); leisteT = setTimeout(() => st.classList.remove('fs-aktiv'), 2200); };
    mod._fs = () => { setTimeout(resize, 120); if (document.fullscreenElement) leisteZeigen(); };
    document.addEventListener('fullscreenchange', mod._fs);
    $('tStage').addEventListener('mousemove', leisteZeigen);
    $('tStage').addEventListener('dblclick', e => { if (!e.target.closest('button')) vollbild(); });
    const ui = () => {
      el.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === cfg.modus));
      $('tZiff').checked = cfg.ziffern; $('tTon').checked = cfg.ton;
      $('tDig').style.display = cfg.ziffern ? '' : 'none';
      $('tStage').dataset.mode = cfg.modus;
      resize();
    };
    /* Im Vollbild bekommt die Zeit einen eigenen Streifen oben – die Grafik wird darunter gezeichnet und überdeckt sie nie */
    let band = 0, dpr = 1;
    const resize = () => {
      const st = $('tStage'), r = st.getBoundingClientRect(); dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      const fs = document.fullscreenElement === st, eigeneZiffern = ['ring', 'fortschritt'].includes(cfg.modus);
      band = fs && cfg.ziffern && !eigeneZiffern ? Math.round(H * 0.17) : 0;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dig = $('tDig');
      dig.style.fontSize = band ? Math.round(band * 0.72) + 'px' : '';
      dig.style.top = band ? Math.round(band * 0.1) + 'px' : '';
    };

    const loop = now => {
      if (running) {
        elapsed += now - last;
        if (elapsed >= T) { elapsed = T; running = false; finished = true; ende(); }
      }
      last = now;
      const p = T ? elapsed / T : 0;
      ctx.clearRect(0, 0, W, H);
      ctx.save(); ctx.translate(0, band);
      DRAW[cfg.modus](ctx, W, H - band, p, { T, elapsed, now, running, seed });
      ctx.restore();
      if (band) { // Hintergrund nahtlos in den Zeit-Streifen verlängern
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(cv, 0, Math.round(band * dpr), cv.width, 1, 0, 0, cv.width, Math.round(band * dpr));
        ctx.restore();
      }
      const rest = Math.ceil((T - elapsed) / 1000);
      $('tDig').textContent = `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}`;
      $('tDig').classList.toggle('urgent', running && rest <= 10);
      ziffernKontrast(cv, $('tDig'));
      mod._raf = requestAnimationFrame(loop);
    };
    const ende = () => {
      btn(); $('tDone').classList.add('show');
      if (cfg.ton) sound.gong();
      confetti();
    };

    el.addEventListener('click', e => {
      const m = e.target.closest('[data-min]'); if (m) setTime(+m.dataset.min, 0);
      const md = e.target.closest('button[data-mode]'); if (md) { cfg.modus = md.dataset.mode; save(); ui(); }
      if (e.target.id === 'tStart') {
        audio();
        if (finished) reset();
        running = !running; btn();
      }
      if (e.target.id === 'tReset' || e.target.id === 'tFsReset') reset();
      if (e.target.closest('#tDone')) reset();
      if (e.target.id === 'tFsStart') $('tStart').click();
      if (e.target.id === 'tVoll' || e.target.id === 'tVoll2' || e.target.id === 'tFsZu') vollbild();
    });
    el.addEventListener('change', e => {
      if (e.target.id === 'tMin' || e.target.id === 'tSec') setTime(+$('tMin').value, +$('tSec').value);
      if (e.target.id === 'tZiff') { cfg.ziffern = e.target.checked; save(); ui(); }
      if (e.target.id === 'tTon') { cfg.ton = e.target.checked; save(); }
    });
    mod._key = e => { if (e.code === 'Space' && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); $('tStart').click(); } };
    document.addEventListener('keydown', mod._key);
    mod._onResize = resize; window.addEventListener('resize', resize);

    $('tMin').value = cfg.min; $('tSec').value = cfg.sec;
    reset(); ui(); resize();
    mod._raf = requestAnimationFrame(t => { last = t; loop(t); });
  },
  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('fullscreenchange', this._fs);
    if (document.fullscreenElement) document.exitFullscreen();
    document.removeEventListener('keydown', this._key);
  },
});

/* ---------- Zeichenfunktionen ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function bounce(x) {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}

const DRAW = {
  /* Bunte Blöcke mit Gesichtern fallen und stapeln sich, bis die Kiste voll ist */
  bloecke(ctx, W, H, p, o) {
    bg(ctx, W, H, '#eef5ff', '#ffffff');
    const cols = 10, rows = 6, N = cols * rows;
    const pad = 30, top = 110;
    const bs = Math.floor(Math.min((W - pad * 2) / cols, (H - top - pad) / rows));
    const bw = bs * cols, bh = bs * rows, x0 = (W - bw) / 2, y0 = H - pad - bh;
    const r = rng(Math.floor(o.seed));
    const perm = [], col = [];
    for (let row = 0; row < rows; row++) {
      const a = [...Array(cols).keys()].sort(() => r() - 0.5);
      perm.push(a);
    }
    for (let i = 0; i < N; i++) col.push(COLORS[Math.floor(r() * COLORS.length)]);
    // Kiste
    rrect(ctx, x0 - 8, y0 - 8, bw + 16, bh + 16, 16); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d1d1d6'; ctx.stroke();
    const per = o.T / N, fd = Math.min(900, per * 0.85);
    for (let i = 0; i < N; i++) {
      const land = (i + 1) * per, start = land - fd;
      const row = Math.floor(i / cols), c = perm[row][i % cols];
      const tx = x0 + c * bs, ty = y0 + bh - (row + 1) * bs;
      let y;
      if (o.elapsed >= land) y = ty;
      else if (o.elapsed >= start) y = -bs + (ty + bs) * bounce((o.elapsed - start) / fd);
      else if (i === Math.floor(o.elapsed / per) || (i === 0 && o.elapsed === 0)) y = Math.max(92, y0 - bs - 14) + Math.sin(o.now / 200) * 4; // wartender Block wackelt über der Kiste
      else continue;
      drawBlock(ctx, tx, y, bs, col[i], o.now + i * 300);
    }
  },

  /* Sanduhr */
  sanduhr(ctx, W, H, p, o) {
    bg(ctx, W, H, '#fff7ed', '#fffdfa');
    const hh = Math.min((H - 170) / 2, W * 0.5), ww = hh * 1.1, nw = Math.max(6, hh * 0.06);
    const cx = W / 2, ym = H / 2 + 40, y0 = ym - hh, y1 = ym + hh;
    const L = cx - ww / 2, R = cx + ww / 2;
    const top = () => { ctx.beginPath(); ctx.moveTo(L, y0); ctx.lineTo(R, y0); ctx.bezierCurveTo(R, y0 + hh * 0.6, cx + nw / 2, ym - hh * 0.25, cx + nw / 2, ym); ctx.lineTo(cx - nw / 2, ym); ctx.bezierCurveTo(cx - nw / 2, ym - hh * 0.25, L, y0 + hh * 0.6, L, y0); ctx.closePath(); };
    const bot = () => { ctx.beginPath(); ctx.moveTo(L, y1); ctx.lineTo(R, y1); ctx.bezierCurveTo(R, y1 - hh * 0.6, cx + nw / 2, ym + hh * 0.25, cx + nw / 2, ym); ctx.lineTo(cx - nw / 2, ym); ctx.bezierCurveTo(cx - nw / 2, ym + hh * 0.25, L, y1 - hh * 0.6, L, y1); ctx.closePath(); };
    const sand = '#f59e0b', sandD = '#d97706';
    // Glas
    ctx.fillStyle = 'rgba(186,230,253,.35)'; top(); ctx.fill(); bot(); ctx.fill();
    const f = 1 - p, lvlT = hh * 0.9 * Math.sqrt(f), lvlB = hh * 0.9 * (1 - Math.sqrt(f));
    ctx.save(); top(); ctx.clip(); ctx.fillStyle = sand; ctx.fillRect(L, ym - lvlT, ww, lvlT); ctx.restore();
    ctx.save(); bot(); ctx.clip(); ctx.fillStyle = sand;
    ctx.beginPath(); ctx.moveTo(L, y1); ctx.lineTo(L, y1 - lvlB); ctx.quadraticCurveTo(cx, y1 - lvlB - Math.min(hh * 0.12, lvlB * 0.8 + 4), R, y1 - lvlB); ctx.lineTo(R, y1); ctx.fill();
    ctx.restore();
    if (o.running && f > 0) {
      ctx.strokeStyle = sandD; ctx.lineWidth = Math.max(2, nw * 0.45); ctx.setLineDash([6, 5]); ctx.lineDashOffset = -o.now / 15;
      ctx.beginPath(); ctx.moveTo(cx, ym); ctx.lineTo(cx, y1 - lvlB - 6); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.lineWidth = 4; ctx.strokeStyle = '#94a3b8'; top(); ctx.stroke(); bot(); ctx.stroke();
    // Glanzlichter auf dem Glas
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(L + ww * 0.14, y0 + 14); ctx.quadraticCurveTo(L + ww * 0.16, y0 + hh * 0.45, cx - nw * 2.5, ym - hh * 0.12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L + ww * 0.14, y1 - 14); ctx.quadraticCurveTo(L + ww * 0.16, y1 - hh * 0.45, cx - nw * 2.5, ym + hh * 0.12); ctx.stroke();
    // Holzstäbe
    const holz = ctx.createLinearGradient(0, y0, 0, y1); holz.addColorStop(0, '#b45309'); holz.addColorStop(1, '#78350f');
    ctx.fillStyle = holz; rrect(ctx, L - 22, y0 - 4, 8, y1 - y0 + 8, 4); ctx.fill(); rrect(ctx, R + 14, y0 - 4, 8, y1 - y0 + 8, 4); ctx.fill();
    ctx.fillStyle = holz;
    rrect(ctx, L - 24, y0 - 22, ww + 48, 22, 8); ctx.fill();
    rrect(ctx, L - 24, y1, ww + 48, 22, 8); ctx.fill();
  },

  /* Zeitscheibe (wie ein „Time Timer“): Farbe wechselt von grün zu rot */
  scheibe(ctx, W, H, p, o) {
    bg(ctx, W, H, '#f5f5f7', '#ffffff');
    const cx = W / 2, cy = H / 2 + 50, r = Math.max(60, Math.min(W * 0.4, (H - 140) / 2 - 16));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.beginPath(); ctx.arc(cx, cy, r + 16, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = '#e5e7eb'; ctx.stroke();
    const hue = 140 * (1 - p);
    if (p < 1) {
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (1 - p)); ctx.closePath();
      ctx.fillStyle = `hsl(${hue} 75% 52%)`; ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * 2 * Math.PI - Math.PI / 2, l = i % 5 ? 8 : 18;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12)); ctx.lineTo(cx + Math.cos(a) * (r + 12 - l), cy + Math.sin(a) * (r + 12 - l));
      ctx.lineWidth = i % 5 ? 2 : 4; ctx.strokeStyle = '#374151'; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.12, 0, 2 * Math.PI); ctx.fillStyle = '#374151'; ctx.fill();
  },

  /* Kerze, die herunterbrennt */
  kerze(ctx, W, H, p, o) {
    bg(ctx, W, H, '#1c1917', '#0c0a09');
    const cx = W / 2, base = H - 50, maxH = H * 0.62, cw = Math.min(110, W * 0.18);
    const h = 30 + (maxH - 30) * (1 - p), top = base - h;
    ctx.fillStyle = '#e5e7eb'; ctx.beginPath(); ctx.ellipse(cx, base + 10, cw * 1.3, 18, 0, 0, 2 * Math.PI); ctx.fill();
    const g = ctx.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
    g.addColorStop(0, '#f472b6'); g.addColorStop(0.5, '#fbcfe8'); g.addColorStop(1, '#ec4899');
    ctx.fillStyle = g; rrect(ctx, cx - cw / 2, top, cw, h, 10); ctx.fill();
    ctx.fillStyle = '#fdf2f8'; ctx.beginPath(); ctx.ellipse(cx, top + 4, cw / 2 - 2, 8, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, top + 2); ctx.lineTo(cx, top - 16); ctx.stroke();
    if (p < 1) {
      const fl = Math.sin(o.now / 90) * 3 + Math.sin(o.now / 37) * 2, fh = 46 + fl;
      const fg = ctx.createRadialGradient(cx, top - 26, 2, cx, top - 26, fh);
      fg.addColorStop(0, '#fff7ae'); fg.addColorStop(0.45, '#fbbf24'); fg.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = fg; ctx.beginPath();
      ctx.moveTo(cx + fl * 0.6, top - 16 - fh);
      ctx.quadraticCurveTo(cx + 22, top - 22, cx, top - 10);
      ctx.quadraticCurveTo(cx - 22, top - 22, cx + fl * 0.6, top - 16 - fh); ctx.fill();
      ctx.fillStyle = 'rgba(251,191,36,.12)'; ctx.beginPath(); ctx.arc(cx, top - 30, 70 + fl * 2, 0, 2 * Math.PI); ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(107,114,128,.5)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 40; i++) { const y = top - 18 - i * 3, x = cx + Math.sin(i / 4 + o.now / 300) * 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    }
  },
};

function drawBlock(ctx, x, y, s, color, t) {
  const g = 3;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = s * 0.12; ctx.shadowOffsetY = s * 0.06;
  rrect(ctx, x + g, y + g, s - g * 2, s - g * 2, s * 0.18); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; rrect(ctx, x + g + 4, y + g + 4, s - g * 2 - 8, (s - g * 2) * 0.25, s * 0.1); ctx.fill();
  // Gesicht
  const ex = s * 0.17, ey = y + s * 0.45, er = s * 0.09, cx = x + s / 2;
  const zu = Math.sin(t / 900) > 0.97;
  ctx.fillStyle = '#fff';
  [cx - ex, cx + ex].forEach(px => { ctx.beginPath(); zu ? ctx.ellipse(px, ey, er, er * 0.2, 0, 0, 7) : ctx.arc(px, ey, er, 0, 7); ctx.fill(); });
  if (!zu) { ctx.fillStyle = '#1f2937'; [cx - ex, cx + ex].forEach(px => { ctx.beginPath(); ctx.arc(px + er * 0.25, ey + er * 0.15, er * 0.5, 0, 7); ctx.fill(); }); }
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = Math.max(1.5, s * 0.04); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, y + s * 0.6, s * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
}

/* ---------- Weitere kindgerechte Darstellungen ---------- */
const easeIO = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
let _pops = 0;

Object.assign(DRAW, {
  /* Rakete fliegt von der Erde zum Mond */
  rakete(ctx, W, H, p, o) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b1029'); sky.addColorStop(1, '#3730a3');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const r = rng(7);
    for (let i = 0; i < 90; i++) {
      const x = r() * W, y = r() * H, s = r() * 1.8 + 0.6;
      ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(o.now / 700 + i));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Mond
    const mr = Math.max(40, Math.min(70, W * 0.07)), mx = W * 0.5, my = 105 + mr;
    ctx.fillStyle = '#fef3c7'; ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fde68a';
    [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.16], [0.1, -0.45, 0.1], [-0.2, 0.45, 0.12]].forEach(([a, b, c]) => { ctx.beginPath(); ctx.arc(mx + a * mr, my + b * mr, c * mr, 0, 7); ctx.fill(); });
    // Erde
    const er = Math.max(W, 900), ey = H - 50 + er;
    ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(W / 2, ey, er, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, ey, er, 0, 7); ctx.clip(); ctx.fillStyle = '#22c55e';
    [[0.18, 40, 120], [0.55, 25, 160], [0.85, 35, 90]].forEach(([fx, dy, w]) => { ctx.beginPath(); ctx.ellipse(W * fx, H - 50 + dy, w, 30, 0, 0, 7); ctx.fill(); });
    ctx.restore();
    // Flugbahn & Rakete
    const s = Math.max(34, Math.min(56, H * 0.07));
    const y0 = H - 50 - s * 0.7, y1 = my + mr + s * 0.9, e = easeIO(p), y = y0 + (y1 - y0) * e;
    const x = W / 2 + (o.running ? Math.sin(o.now / 120) * 2 : 0);
    ctx.setLineDash([4, 10]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W / 2, y0 + s); ctx.lineTo(W / 2, y + s); ctx.stroke(); ctx.setLineDash([]);
    drawRocket(ctx, x, y, s, o.running && p < 1 ? o.now : null);
    if (p >= 1) { ctx.fillStyle = '#fff'; ctx.font = '800 26px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌙 Gelandet!', W / 2, y1 + s * 1.8); }
  },

  /* Luftballons platzen nacheinander */
  ballons(ctx, W, H, p, o) {
    bg(ctx, W, H, '#dbeafe', '#f8fbff');
    const N = 12, cols = W > H * 1.25 ? 6 : 4, rows = Math.ceil(N / cols);
    const cw = (W - 40) / cols, ch = (H - 130) / rows, s = Math.min(cw * 0.9, ch * 0.75);
    const r = rng(Math.floor(o.seed)), order = [...Array(N).keys()].sort(() => r() - 0.5);
    const per = o.T / N, popped = Math.min(N, Math.floor(o.elapsed / per + 1e-9));
    if (p === 0) _pops = 0;
    if (o.running && popped > _pops) sound.pop();
    _pops = popped;
    for (let i = 0; i < N; i++) {
      const c = i % cols, rw = Math.floor(i / cols);
      const jx = (rng(i * 99)() - 0.5) * cw * 0.25;
      const cx = 20 + (c + 0.5) * cw + jx, cy = 125 + (rw + 0.42) * ch + Math.sin(o.now / 650 + i * 1.7) * 6;
      const popAt = (order.indexOf(i) + 1) * per, col = COLORS[i % COLORS.length];
      if (o.elapsed < popAt) drawBalloon(ctx, cx, cy, s, col, o.now + i * 500);
      else if (o.elapsed - popAt < 450 && o.running) { // Knall
        const q = (o.elapsed - popAt) / 450;
        ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.globalAlpha = 1 - q;
        for (let k = 0; k < 10; k++) {
          const a = k / 10 * Math.PI * 2, r1 = s * 0.2 + q * s * 0.4, r2 = r1 + s * 0.15;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  },

  /* Raupe frisst sich durch die Äpfel – am Ende wird sie ein Schmetterling */
  raupe(ctx, W, H, p, o) {
    bg(ctx, W, H, '#e0f2fe', '#ffffff');
    const gy = H * 0.74, x0 = 50, N = 10, sp = (W - 2 * x0) / N, ar = Math.min(28, sp * 0.32);
    ctx.fillStyle = '#bbf7d0'; ctx.fillRect(0, gy, W, H - gy);
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3;
    for (let x = 6; x < W; x += 14) { ctx.beginPath(); ctx.moveTo(x, gy + 2); ctx.lineTo(x + 4, gy - 9 - (x % 3) * 3); ctx.stroke(); }
    const hx = x0 + p * (W - 2 * x0);
    let eaten = 0;
    for (let i = 0; i < N; i++) {
      const ax = x0 + (i + 0.5) * sp;
      if (ax < hx - ar * 0.3) { eaten++; continue; }
      drawApple(ctx, ax, gy - ar, ar);
    }
    if (p >= 1) { drawButterfly(ctx, W / 2 + Math.sin(o.now / 900) * W * 0.25, gy - 200 + Math.sin(o.now / 400) * 30, Math.min(70, H * 0.1), o.now); return; }
    const sr = Math.min(20, H * 0.03), segs = 4 + eaten;
    for (let k = segs; k >= 0; k--) {
      const x = hx - k * sr * 1.35, ph = hx * 0.06 - k * 0.8 + (o.running ? o.now / 250 : 0);
      const y = gy - sr - Math.max(0, Math.sin(ph)) * sr * 0.7;
      ctx.fillStyle = k === 0 ? '#16a34a' : k % 2 ? '#4ade80' : '#22c55e';
      const rad = k === 0 ? sr * 1.3 : sr;
      ctx.beginPath(); ctx.arc(x, y - (k === 0 ? sr * 0.3 : 0), rad, 0, 7); ctx.fill();
      if (k === 0) {
        const hy = y - sr * 0.3;
        ctx.strokeStyle = '#166534'; ctx.lineWidth = 3;
        [-1, 1].forEach(d => { ctx.beginPath(); ctx.moveTo(x + d * rad * 0.3, hy - rad * 0.8); ctx.lineTo(x + d * rad * 0.6, hy - rad * 1.6); ctx.stroke();
          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x + d * rad * 0.6, hy - rad * 1.6, 4, 0, 7); ctx.fill(); });
        ctx.fillStyle = '#fff'; [-0.35, 0.35].forEach(d => { ctx.beginPath(); ctx.arc(x + d * rad + rad * 0.2, hy - rad * 0.2, rad * 0.28, 0, 7); ctx.fill(); });
        ctx.fillStyle = '#111'; [-0.35, 0.35].forEach(d => { ctx.beginPath(); ctx.arc(x + d * rad + rad * 0.3, hy - rad * 0.18, rad * 0.13, 0, 7); ctx.fill(); });
        ctx.strokeStyle = '#14532d'; ctx.beginPath(); ctx.arc(x + rad * 0.2, hy + rad * 0.15, rad * 0.35, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
      }
    }
  },

  /* Blume wächst aus dem Topf und blüht am Ende auf */
  blume(ctx, W, H, p, o) {
    bg(ctx, W, H, '#e0f2fe', '#f0fdf4');
    // Sonne
    const sx = 70, sy = 70, srad = 34;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(o.now / 4000);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 5;
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(srad + 6, 0); ctx.lineTo(srad + 20, 0); ctx.stroke(); }
    ctx.restore(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(sx, sy, srad, 0, 7); ctx.fill();
    // Topf
    const cx = W / 2, pb = H - 30, pt = pb - 90, pw = 150;
    ctx.fillStyle = '#c2410c'; ctx.beginPath(); ctx.moveTo(cx - pw / 2, pt); ctx.lineTo(cx + pw / 2, pt); ctx.lineTo(cx + pw * 0.38, pb); ctx.lineTo(cx - pw * 0.38, pb); ctx.fill();
    ctx.fillStyle = '#9a3412'; rrect(ctx, cx - pw / 2 - 10, pt - 6, pw + 20, 22, 6); ctx.fill();
    ctx.fillStyle = '#57534e'; ctx.beginPath(); ctx.ellipse(cx, pt - 4, pw / 2, 8, 0, 0, 7); ctx.fill();
    // Stängel
    const maxH = pt - 175, grow = easeIO(Math.min(1, p / 0.8)), h = 10 + maxH * grow;
    const sway = Math.sin(o.now / 1100) * 6 * grow, tx = cx + sway, ty = pt - h;
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, pt - 4); ctx.quadraticCurveTo(cx - 20 * grow, pt - h / 2, tx, ty); ctx.stroke();
    [[0.3, -1], [0.55, 1], [0.75, -1]].forEach(([f, d], i) => {
      const ls = Math.max(0, Math.min(1, (grow - f * 0.9) * 4)) * 46; if (!ls) return;
      const ly = pt - h * f, lx = cx - 20 * grow * Math.sin(f * Math.PI) + sway * f;
      ctx.fillStyle = i % 2 ? '#22c55e' : '#4ade80';
      ctx.beginPath(); ctx.ellipse(lx + d * ls * 0.55, ly, ls * 0.6, ls * 0.25, d * -0.5, 0, 7); ctx.fill();
    });
    // Knospe / Blüte
    const bloom = Math.max(0, (p - 0.8) / 0.2), pl = 55 * easeIO(bloom);
    if (bloom > 0) for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + o.now / 6000;
      ctx.fillStyle = i % 2 ? '#f472b6' : '#ec4899';
      ctx.beginPath(); ctx.ellipse(tx + Math.cos(a) * pl * 0.7, ty + Math.sin(a) * pl * 0.7, pl * 0.55, pl * 0.25, a, 0, 7); ctx.fill();
    }
    const cr = 10 + 18 * grow;
    ctx.fillStyle = bloom > 0 ? '#facc15' : '#65a30d'; ctx.beginPath(); ctx.arc(tx, ty, cr, 0, 7); ctx.fill();
    if (bloom >= 1) {
      ctx.fillStyle = '#1f2937'; [-1, 1].forEach(d => { ctx.beginPath(); ctx.arc(tx + d * cr * 0.35, ty - cr * 0.15, cr * 0.12, 0, 7); ctx.fill(); });
      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, ty + cr * 0.1, cr * 0.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
  },

  /* Schneemann schmilzt langsam */
  schneemann(ctx, W, H, p, o) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#e0f2fe'); sky.addColorStop(1, '#f8fafc');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // Sonne wird kräftiger
    ctx.fillStyle = `rgba(250,204,21,${0.35 + 0.65 * p})`; ctx.beginPath(); ctx.arc(W - 80, 90, 34 + 16 * p, 0, 7); ctx.fill();
    const base = H - 60;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(W / 2, base + 30, W * 0.6, 50, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(96,165,250,.45)'; ctx.beginPath(); ctx.ellipse(W / 2, base + 6, 40 + p * 190, 8 + p * 16, 0, 0, 7); ctx.fill();
    const R = Math.min(105, (H - 200) / 4.3), sq = 1 - 0.3 * p, cx = W / 2;
    const r1 = R * (1 - 0.45 * p), r2 = R * 0.72 * (1 - 0.55 * p), r3 = R * 0.52 * (1 - 0.55 * p);
    const y1 = base - r1 * sq, y2 = y1 - r1 * sq - r2 * sq * 0.85, y3 = y2 - r2 * sq - r3 * sq * 0.85;
    // Arme
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    [-1, 1].forEach(d => { ctx.beginPath(); ctx.moveTo(cx + d * r2 * 0.8, y2); ctx.lineTo(cx + d * (r2 + 55 * (1 - p * 0.5)), y2 - 40 + p * 70); ctx.stroke(); });
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
    [[y1, r1], [y2, r2], [y3, r3]].forEach(([y, r]) => { ctx.beginPath(); ctx.ellipse(cx, y, r, r * sq, 0, 0, 7); ctx.fill(); ctx.stroke(); });
    // Knöpfe, Gesicht, Karotte
    ctx.fillStyle = '#1f2937';
    [-0.35, 0, 0.35].forEach(f => { ctx.beginPath(); ctx.arc(cx, y2 + f * r2 * sq, r2 * 0.08, 0, 7); ctx.fill(); });
    [-1, 1].forEach(d => { ctx.beginPath(); ctx.arc(cx + d * r3 * 0.35, y3 - r3 * 0.2 * sq, r3 * 0.1, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(cx, y3 - r3 * 0.05); ctx.lineTo(cx + r3 * 0.9, y3 + r3 * 0.08); ctx.lineTo(cx, y3 + r3 * 0.18); ctx.fill();
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.arc(cx, y3 + r3 * 0.2, r3 * 0.4, p > 0.6 ? 1.15 * Math.PI : 0.2 * Math.PI, p > 0.6 ? 1.85 * Math.PI : 0.8 * Math.PI); ctx.stroke();
    // Schal
    ctx.fillStyle = '#ef4444'; rrect(ctx, cx - r3 * 0.95, y3 + r3 * sq * 0.75, r3 * 1.9, r3 * 0.3, 6); ctx.fill();
    rrect(ctx, cx + r3 * 0.3, y3 + r3 * sq * 0.8, r3 * 0.3, r3 * 0.9, 6); ctx.fill();
    // Hut (fällt am Ende herunter)
    const fall = Math.max(0, (p - 0.85) / 0.15);
    const hx = cx + fall * (r1 + 60), hy = (y3 - r3 * sq) + fall * (base - 20 - (y3 - r3 * sq));
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(fall * 0.6);
    ctx.fillStyle = '#111827'; ctx.fillRect(-r3 * 0.85, -6, r3 * 1.7, 10); ctx.fillRect(-r3 * 0.55, -r3 * 0.9, r3 * 1.1, r3 * 0.85);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(-r3 * 0.55, -r3 * 0.25, r3 * 1.1, r3 * 0.15);
    ctx.restore();
    // Tropfen
    if (o.running) for (let i = 0; i < 4; i++) {
      const t = ((o.now / 900 + i * 0.25) % 1), dx = cx + (i - 1.5) * r1 * 0.5;
      ctx.fillStyle = `rgba(59,130,246,${0.7 * (1 - t)})`; ctx.beginPath(); ctx.arc(dx, y1 + r1 * 0.3 + t * (base - y1), 4, 0, 7); ctx.fill();
    }
  },
});

function drawRocket(ctx, x, y, s, flameT) {
  if (flameT != null) {
    const fl = s * (0.7 + 0.25 * Math.sin(flameT / 40));
    const g = ctx.createLinearGradient(0, y + s * 0.6, 0, y + s * 0.6 + fl);
    g.addColorStop(0, '#fde047'); g.addColorStop(0.5, '#f97316'); g.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - s * 0.22, y + s * 0.6); ctx.quadraticCurveTo(x, y + s * 0.6 + fl * 1.3, x + s * 0.22, y + s * 0.6); ctx.fill();
  }
  ctx.fillStyle = '#ef4444';
  [-1, 1].forEach(d => { ctx.beginPath(); ctx.moveTo(x + d * s * 0.3, y + s * 0.1); ctx.lineTo(x + d * s * 0.62, y + s * 0.75); ctx.lineTo(x + d * s * 0.3, y + s * 0.6); ctx.fill(); });
  const body = () => { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.4, x + s * 0.34, y + s * 0.62); ctx.lineTo(x - s * 0.34, y + s * 0.62); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.4, x, y - s); ctx.closePath(); };
  body(); ctx.fillStyle = '#f8fafc'; ctx.fill();
  ctx.save(); body(); ctx.clip(); ctx.fillStyle = '#ef4444'; ctx.fillRect(x - s, y - s, s * 2, s * 0.42); ctx.restore();
  body(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#7dd3fc'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - s * 0.1, s * 0.17, 0, 7); ctx.fill(); ctx.stroke();
}
function drawBalloon(ctx, x, y, s, col, t) {
  const rx = s * 0.36, ry = s * 0.45;
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + ry + 6);
  for (let k = 1; k <= 10; k++) ctx.lineTo(x + Math.sin(k * 0.9 + t / 400) * 5, y + ry + 6 + k * s * 0.05);
  ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y + ry - 2); ctx.lineTo(x - 6, y + ry + 7); ctx.lineTo(x + 6, y + ry + 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.4, y - ry * 0.4, rx * 0.18, ry * 0.25, -0.5, 0, 7); ctx.fill();
}
function drawApple(ctx, x, y, r) {
  ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x - r * 0.25, y, r * 0.8, 0, 7); ctx.arc(x + r * 0.25, y, r * 0.8, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(x - r * 0.45, y - r * 0.3, r * 0.15, r * 0.25, -0.4, 0, 7); ctx.fill();
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - r * 0.7); ctx.lineTo(x + 2, y - r * 1.1); ctx.stroke();
  ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.ellipse(x + r * 0.3, y - r * 1.0, r * 0.3, r * 0.14, -0.5, 0, 7); ctx.fill();
}
function drawButterfly(ctx, x, y, s, t) {
  const f = 0.25 + 0.75 * Math.abs(Math.sin(t / 140));
  ctx.save(); ctx.translate(x, y);
  [[-1, '#a855f7'], [1, '#ec4899']].forEach(([d, c]) => {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(d * s * 0.45 * f, -s * 0.2, s * 0.5 * f, s * 0.42, d * 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.ellipse(d * s * 0.35 * f, s * 0.3, s * 0.3 * f, s * 0.26, -d * 0.3, 0, 7); ctx.fill();
  });
  ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.08, s * 0.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2;
  [-1, 1].forEach(d => { ctx.beginPath(); ctx.moveTo(0, -s * 0.45); ctx.lineTo(d * s * 0.25, -s * 0.8); ctx.stroke(); });
  ctx.restore();
}

/* ---------- Hintergrund & schlichte Ansichten (für ältere Klassen) ---------- */
function bg(ctx, W, H, oben, unten) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, oben); g.addColorStop(1, unten);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
const SF_T = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif";
const restText = o => { const s = Math.max(0, Math.ceil((o.T - o.elapsed) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const endeText = o => new Date(Date.now() + (o.T - o.elapsed)).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });

Object.assign(DRAW, {
  /* Ring im Stil der Apple-Watch-Aktivitätsringe */
  ring(ctx, W, H, p, o) {
    bg(ctx, W, H, '#ffffff', '#f2f2f5');
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.36, lw = Math.max(16, R * 0.13), rest = 1 - p;
    ctx.lineCap = 'round'; ctx.lineWidth = lw;
    ctx.strokeStyle = '#e5e5ea'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    if (rest > 0.001) {
      let g = '#0a84ff';
      if (ctx.createConicGradient) { g = ctx.createConicGradient(-Math.PI / 2, cx, cy); g.addColorStop(0, '#5ac8fa'); g.addColorStop(Math.max(rest, .01), '#0a84ff'); g.addColorStop(1, '#0a84ff'); }
      if (rest < 0.1) g = '#ff375f';
      ctx.save(); ctx.shadowColor = 'rgba(10,132,255,.35)'; ctx.shadowBlur = 18;
      ctx.strokeStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * rest); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = '#1d1d1f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `200 ${R * 0.5}px ${SF_T}`; ctx.fillText(restText(o), cx, cy - R * 0.04);
    ctx.fillStyle = '#6e6e73'; ctx.font = `500 ${Math.max(14, R * 0.1)}px ${SF_T}`;
    ctx.fillText(p >= 1 ? 'Fertig' : o.running ? 'Ende um ' + endeText(o) : 'Bereit', cx, cy + R * 0.36);
  },

  /* Großer Fortschrittsbalken mit Endzeit */
  fortschritt(ctx, W, H, p, o) {
    bg(ctx, W, H, '#ffffff', '#f2f2f5');
    const bw = Math.min(W * 0.84, 1000), bh = Math.max(36, Math.min(80, H * 0.11)), x = (W - bw) / 2, y = H * 0.58 - bh / 2, rest = 1 - p;
    ctx.fillStyle = '#1d1d1f'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `200 ${Math.min(H * 0.26, 190)}px ${SF_T}`; ctx.fillText(restText(o), W / 2, y - bh * 0.6);
    rrect(ctx, x, y, bw, bh, bh / 2); ctx.fillStyle = '#e5e5ea'; ctx.fill();
    if (rest > 0.001) {
      const g = ctx.createLinearGradient(x, 0, x + bw, 0);
      g.addColorStop(0, rest < 0.1 ? '#ff375f' : '#5ac8fa'); g.addColorStop(1, rest < 0.1 ? '#ff6482' : '#0a84ff');
      ctx.save(); rrect(ctx, x, y, bw, bh, bh / 2); ctx.clip();
      ctx.fillStyle = g; ctx.fillRect(x, y, bw * rest, bh);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; // Segmente
      for (let k = 1; k < 20; k++) ctx.fillRect(x + bw * k / 20 - 1, y, 2, bh);
      ctx.restore();
    }
    ctx.fillStyle = '#6e6e73'; ctx.font = `500 ${Math.max(14, bh * 0.32)}px ${SF_T}`; ctx.textBaseline = 'top';
    ctx.textAlign = 'left'; ctx.fillText(p >= 1 ? 'Fertig' : `noch ${Math.ceil((o.T - o.elapsed) / 60000)} min`, x, y + bh + 14);
    ctx.textAlign = 'right'; ctx.fillText(o.running ? 'Ende um ' + endeText(o) : `${Math.round(p * 100)} %`, x + bw, y + bh + 14);
  },
});

/* ---------- Tetris: Steine mit Gefühlen stapeln sich, bis der Schacht voll ist ---------- */
delete DRAW.raupe; delete DRAW.scheibe; // ersetzt durch Tetris & Snake
const TET_FARBEN = { O: ['#ffd60a', '#e6b800'], I: ['#64d2ff', '#32ade6'], L: ['#ff9f0a', '#e08600'], J: ['#0a84ff', '#0063d1'] };
let _tet = null;
function tetPlan(seed) {
  const r = rng(Math.floor(seed)), cols = 10, baender = 4, stuecke = [];
  const muster = [[4, 4, 2], [2, 4, 4], [4, 2, 4], [2, 2, 2, 4], [4, 2, 2, 2], [2, 4, 2, 2], [2, 2, 4, 2]];
  for (let b = 0; b < baender; b++) {
    const row = b * 2; let c = 0;
    for (const w of muster[Math.floor(r() * muster.length)]) {
      if (w === 2) stuecke.push({ typ: 'O', zellen: [[c, row], [c + 1, row], [c, row + 1], [c + 1, row + 1]] });
      else if (r() < 0.5) { // zwei liegende I
        stuecke.push({ typ: 'I', zellen: [0, 1, 2, 3].map(k => [c + k, row]) });
        stuecke.push({ typ: 'I', zellen: [0, 1, 2, 3].map(k => [c + k, row + 1]) });
      } else { // L + J ergeben zusammen ein 4×2-Rechteck
        stuecke.push({ typ: 'L', zellen: [[c, row], [c + 1, row], [c + 2, row], [c, row + 1]] });
        stuecke.push({ typ: 'J', zellen: [[c + 3, row], [c + 1, row + 1], [c + 2, row + 1], [c + 3, row + 1]] });
      }
      c += w;
    }
  }
  return { seed, cols, rows: baender * 2, stuecke };
}
DRAW.tetris = function (ctx, W, H, p, o) {
  bg(ctx, W, H, '#1c1c2e', '#0b0b14');
  if (!_tet || _tet.seed !== o.seed) _tet = tetPlan(o.seed);
  const { cols, rows, stuecke } = _tet, N = stuecke.length;
  const bs = Math.floor(Math.min((W - 80) / cols, (H - 140) / (rows + 2.5))), bw = bs * cols, bh = bs * rows;
  const x0 = (W - bw) / 2, y0 = H - 24 - bh;
  // Schacht
  ctx.fillStyle = 'rgba(255,255,255,.04)'; rrect(ctx, x0 - 6, y0 - 6, bw + 12, bh + 12, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
  for (let c = 1; c < cols; c++) { ctx.beginPath(); ctx.moveTo(x0 + c * bs, y0); ctx.lineTo(x0 + c * bs, y0 + bh); ctx.stroke(); }
  for (let r = 1; r < rows; r++) { ctx.beginPath(); ctx.moveTo(x0, y0 + r * bs); ctx.lineTo(x0 + bw, y0 + r * bs); ctx.stroke(); }
  const per = o.T / N, fd = Math.min(1100, per * 0.8), fertig = p >= 1, nervoes = p > 0.85 && !fertig;
  stuecke.forEach((st, i) => {
    const land = (i + 1) * per, start = land - fd;
    const maxRow = Math.max(...st.zellen.map(z => z[1])), minRow = Math.min(...st.zellen.map(z => z[1]));
    const zielY = (row) => y0 + bh - (row + 1) * bs;
    const dyStart = (y0 - (maxRow - minRow + 1) * bs - 14) - zielY(maxRow); // knapp über dem Schacht
    let dy, zustand;
    if (o.elapsed >= land) { dy = 0; zustand = 'liegt'; }
    else if (o.elapsed >= start) { const q = (o.elapsed - start) / fd; dy = dyStart * (1 - bounce(q)); zustand = 'faellt'; }
    else if (i === Math.floor(o.elapsed / per) || (i === 0 && !o.elapsed)) { dy = dyStart + Math.sin(o.now / 220) * 3; zustand = 'wartet'; }
    else return;
    const seitSeit = o.elapsed - land, quetsch = zustand === 'liegt' && seitSeit < 180 ? 1 - Math.sin(seitSeit / 180 * Math.PI) * 0.12 : 1;
    const huepf = fertig ? Math.abs(Math.sin(o.now / 180 + i)) * -bs * 0.25 : nervoes && zustand === 'liegt' ? Math.sin(o.now / 40 + i) * 1.5 : 0;
    const [f1, f2] = TET_FARBEN[st.typ];
    let sx = 0, sy = 0;
    st.zellen.forEach(([c, r]) => {
      const x = x0 + c * bs, y = zielY(r) + dy + huepf;
      sx += x; sy += y;
      const g = ctx.createLinearGradient(x, y, x, y + bs); g.addColorStop(0, f1); g.addColorStop(1, f2);
      ctx.save(); ctx.translate(x + bs / 2, y + bs); ctx.scale(1 + (1 - quetsch) * 0.6, quetsch); ctx.translate(-x - bs / 2, -y - bs);
      ctx.shadowColor = f1 + '88'; ctx.shadowBlur = zustand === 'liegt' ? 6 : 14;
      rrect(ctx, x + 2, y + 2, bs - 4, bs - 4, bs * 0.2); ctx.fillStyle = g; ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.35)'; rrect(ctx, x + 6, y + 5, bs - 12, bs * 0.18, 4); ctx.fill();
      ctx.restore();
    });
    // ein Gesicht pro Stein, in der Mitte
    tetGesicht(ctx, sx / 4 + bs / 2, sy / 4 + bs / 2, bs * 1.4, zustand, { fertig, nervoes, t: o.now + i * 777 });
  });
  if (fertig) { ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.min(60, W * 0.06)}px ${SF_T}`; ctx.textAlign = 'center'; ctx.fillText('Geschafft! 🎉', W / 2, y0 - 30); }
};
function tetGesicht(ctx, x, y, s, zustand, z) {
  const e = s * 0.13, ex = s * 0.24;
  const blinzeln = zustand === 'liegt' && !z.fertig && Math.sin(z.t / 700) > 0.985;
  ctx.fillStyle = '#fff';
  [-1, 1].forEach(d => { ctx.beginPath(); blinzeln ? ctx.ellipse(x + d * ex, y - s * 0.08, e, e * 0.18, 0, 0, 7) : ctx.arc(x + d * ex, y - s * 0.08, zustand === 'faellt' ? e * 1.25 : e, 0, 7); ctx.fill(); });
  if (!blinzeln) {
    ctx.fillStyle = '#111';
    const blickY = zustand === 'faellt' || zustand === 'wartet' ? e * 0.45 : 0, blickX = z.nervoes ? Math.sin(z.t / 120) * e * 0.4 : 0;
    [-1, 1].forEach(d => { ctx.beginPath(); ctx.arc(x + d * ex + blickX, y - s * 0.08 + blickY, e * 0.55, 0, 7); ctx.fill(); });
  }
  ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = Math.max(2, s * 0.06); ctx.lineCap = 'round';
  ctx.beginPath();
  if (zustand === 'faellt') { ctx.ellipse(x, y + s * 0.2, s * 0.09, s * 0.12, 0, 0, 7); ctx.fill(); }            // „Oh!“
  else if (zustand === 'wartet') { ctx.moveTo(x - s * 0.1, y + s * 0.2); ctx.lineTo(x + s * 0.1, y + s * 0.2); ctx.stroke(); }
  else if (z.fertig) { ctx.arc(x, y + s * 0.1, s * 0.2, 0.1 * Math.PI, 0.9 * Math.PI); ctx.closePath(); ctx.fill(); } // breites Grinsen
  else if (z.nervoes) { // Wellenmund + Schweißtropfen
    ctx.moveTo(x - s * 0.15, y + s * 0.22); ctx.quadraticCurveTo(x - s * 0.07, y + s * 0.15, x, y + s * 0.22); ctx.quadraticCurveTo(x + s * 0.07, y + s * 0.29, x + s * 0.15, y + s * 0.22); ctx.stroke();
    ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.arc(x + s * 0.36, y - s * 0.22, s * 0.06, 0, 7); ctx.fill();
  }
  else { ctx.arc(x, y + s * 0.1, s * 0.15, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
}

/* ---------- Snake (wie am alten Nokia): die Schlange wird mit der Zeit immer länger ---------- */
let _snake = null;
DRAW.snake = function (ctx, W, H, p, o) {
  const lcd = '#9bbc0f', dunkel = '#0f380f', mittel = '#306230';
  ctx.fillStyle = '#8bac0f'; ctx.fillRect(0, 0, W, H);
  const cols = 32, rows = 18, cs = Math.floor(Math.min((W - 60) / cols, (H - 130) / rows));
  const x0 = Math.floor((W - cs * cols) / 2), y0 = Math.floor(H - 24 - cs * rows);
  ctx.fillStyle = lcd; ctx.fillRect(x0, y0, cs * cols, cs * rows);
  ctx.strokeStyle = dunkel; ctx.lineWidth = 4; ctx.strokeRect(x0 - 4, y0 - 4, cs * cols + 8, cs * rows + 8);
  ctx.fillStyle = 'rgba(15,56,15,.06)'; // LCD-Raster
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) ctx.fillRect(x0 + c * cs + cs / 2 - 1, y0 + r * cs + cs / 2 - 1, 2, 2);
  const r = rng(Math.floor(o.seed) + 7);
  const neuesFutter = s => { for (let k = 0; k < 500; k++) { const f = [Math.floor(r() * cols), Math.floor(r() * rows)]; if (!s.body.some(b => b[0] === f[0] && b[1] === f[1])) return f; } return [0, 0]; };
  if (!_snake || _snake.seed !== o.seed) {
    _snake = { seed: o.seed, body: [[6, 9], [5, 9], [4, 9]], dir: [1, 0], acc: 0, last: o.now };
    _snake.futter = neuesFutter(_snake);
  }
  const S = _snake, ziel = 3 + Math.floor(p * cols * rows * 0.3);
  const dt = Math.min(200, o.now - S.last); S.last = o.now;
  if (o.running && p < 1) { S.acc += dt; while (S.acc > 520) { S.acc -= 520; schritt(); } } // ruhiges Tempo: ca. 2 Schritte pro Sekunde
  function schritt() {
    const [hx, hy] = S.body[0], [fx, fy] = S.futter;
    const frei = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !S.body.slice(0, -1).some(b => b[0] === x && b[1] === y);
    const wege = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => !(d[0] === -S.dir[0] && d[1] === -S.dir[1]) && frei(hx + d[0], hy + d[1]));
    if (!wege.length) { S.body = S.body.slice(0, 3).map((_, i) => [6 - i, 9]); S.dir = [1, 0]; return; } // festgefahren → neu
    wege.sort((a, b) => (Math.abs(hx + a[0] - fx) + Math.abs(hy + a[1] - fy)) - (Math.abs(hx + b[0] - fx) + Math.abs(hy + b[1] - fy)) + (r() - 0.5) * 0.1);
    S.dir = wege[0];
    const kopf = [hx + S.dir[0], hy + S.dir[1]];
    S.body.unshift(kopf);
    if (kopf[0] === fx && kopf[1] === fy) S.futter = neuesFutter(S);
    while (S.body.length > ziel) S.body.pop();
  }
  // Futter blinkt
  { /* Futter ruhig, ohne Blinken */ ctx.fillStyle = dunkel; const [fx, fy] = S.futter; ctx.fillRect(x0 + fx * cs + cs * 0.2, y0 + fy * cs + cs * 0.2, cs * 0.6, cs * 0.6); }
  S.body.forEach(([bx, by], i) => {
    ctx.fillStyle = i === 0 ? dunkel : i % 2 ? mittel : dunkel;
    ctx.fillRect(x0 + bx * cs + 1, y0 + by * cs + 1, cs - 2, cs - 2);
  });
  const [kx, ky] = S.body[0]; ctx.fillStyle = lcd; // Auge
  ctx.fillRect(x0 + kx * cs + cs * 0.55, y0 + ky * cs + cs * 0.25, cs * 0.2, cs * 0.2);
  ctx.fillStyle = dunkel; ctx.font = `700 ${Math.max(14, cs * 0.9)}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`LÄNGE ${S.body.length}`, x0, y0 - 10);
  if (p >= 1) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${cs * 2.4}px "Courier New", monospace`; ctx.fillText('ZEIT UM!', W / 2, y0 + cs * rows / 2); }
};
