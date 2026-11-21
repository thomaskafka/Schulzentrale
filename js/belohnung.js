'use strict';
/* ===== Belohnungs-Sammler für die Klasse: Murmelglas, Schatzkiste, Sternenhimmel, Turm, Rakete – pro Klasse gespeichert ===== */

const BSTILE = {
  glas: { ic: '🫙', name: 'Murmelglas' }, schatz: { ic: '💰', name: 'Schatzkiste' }, sterne: { ic: '✨', name: 'Sternenhimmel' },
  turm: { ic: '🧱', name: 'Bausteinturm' }, rakete: { ic: '🚀', name: 'Rakete zum Mond' },
};
const BGRUENDE = ['leise gearbeitet', 'toll mitgemacht', 'aufgeräumt', 'pünktlich', 'einander geholfen', 'super Gruppenarbeit'];

state.belohnung ||= {};
const bKey = () => state.belohnungAkt && (state.belohnungAkt === 'alle' || klasse(state.belohnungAkt)) ? state.belohnungAkt : (state.aktKlasse || 'alle');
const bDaten = (key = bKey()) => (state.belohnung[key] ||= { stil: 'glas', ziel: 30, anzahl: 0, belohnung: 'Filmstunde 🎬', log: [], eingeloest: 0 });

/** zufällige, aber feste Zahlenfolge */
const bRand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
/** Plätze für n Kugeln in einer Form (dichteste Packung, unten beginnend) */
const _bCache = new Map();
function bPacken(innen, box, n, key) {
  if (key && _bCache.has(key)) return _bCache.get(key);
  const erg = bPackenRoh(innen, box, n);
  if (key) { if (_bCache.size > 20) _bCache.clear(); _bCache.set(key, erg); }
  return erg;
}
function bPackenRoh(innen, box, n) {
  let r = Math.sqrt(0.8 * box.w * box.h / (n * Math.PI));
  for (let v = 0; v < 40; v++, r *= 0.96) {
    const p = [], dy = r * Math.sqrt(3);
    for (let y = box.y + box.h - r, z = 0; y > box.y + r * 0.5 && p.length < n; y -= dy, z++) {
      const reihe = [];
      for (let x = box.x + r + (z % 2) * r; x < box.x + box.w - r * 0.9; x += 2 * r) if (innen(x, y, r)) reihe.push({ x, y });
      reihe.sort((a, b) => Math.abs(a.x - box.x - box.w / 2) - Math.abs(b.x - box.x - box.w / 2)); // von der Mitte aus füllen
      p.push(...reihe);
    }
    if (p.length >= n) return { r: r * 0.94, p: p.slice(0, n) };
  }
  return { r: 4, p: Array.from({ length: n }, () => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 })) };
}

function bZeichnen(ctx, W, H, b, anim, jetzt) {
  const n = Math.min(b.anzahl, b.ziel), dunkel = document.documentElement.dataset.mode === 'dark';
  ctx.clearRect(0, 0, W, H);
  const fall = (i, ziel) => { const a = anim[i]; if (!a) return ziel; const t = Math.min(1, (jetzt - a) / 650), e = 1 - Math.pow(1 - t, 3) * Math.cos(t * 6) * (1 - t); return { x: ziel.x, y: -40 + (ziel.y + 40) * Math.min(1.02, e) }; };

  if (b.stil === 'glas' || b.stil === 'schatz') {
    let innen, box;
    if (b.stil === 'glas') {
      const gw = Math.min(W * 0.5, H * 0.62), gh = H * 0.78, gx = (W - gw) / 2, gy = H * 0.14;
      box = { x: gx + 8, y: gy + 30, w: gw - 16, h: gh - 38 };
      innen = (x, y, r) => x - r > box.x && x + r < box.x + box.w && y + r < box.y + box.h;
      // Glas
      ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = dunkel ? 'rgba(255,255,255,.55)' : 'rgba(60,80,110,.45)'; ctx.fillStyle = dunkel ? 'rgba(255,255,255,.05)' : 'rgba(200,225,255,.25)';
      ctx.beginPath(); ctx.roundRect(gx, gy + 18, gw, gh - 10, [10, 10, 34, 34]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dunkel ? '#636366' : '#c7a26b'; ctx.beginPath(); ctx.roundRect(gx - 6, gy, gw + 12, 22, 6); ctx.fill(); ctx.restore();
      const { r, p } = bPacken(innen, box, b.ziel, `glas${W}x${H}x${b.ziel}`);
      for (let i = 0; i < n; i++) {
        const { x, y } = fall(i, p[i]), c = COLORS[i % COLORS.length];
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#fff'); g.addColorStop(0.25, c); g.addColorStop(1, c);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(gx + 14, gy + 40, 8, gh * 0.6);
    } else {
      // Offene Schatzkiste: die Münzen liegen IN der Kiste – die Vorderwand verdeckt die unterste Reihe zur Hälfte
      const cw = Math.min(W * 0.68, H * 1.3), cx = (W - cw) / 2, mx = W / 2, boden = H - 12;
      const wandH = H * 0.3, rand = boden - wandH, tiefe = H * 0.22, hinten = rand - tiefe, huegel = H * 0.09, dh = H * 0.26;
      // Deckel – offen und nach hinten gekippt
      const holz = (y0, y1, a, b2) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b2); return g; };
      ctx.fillStyle = holz(hinten - dh * 1.4, hinten, '#8a5223', '#5e3412');
      ctx.beginPath(); ctx.moveTo(cx + cw * 0.03, hinten); ctx.lineTo(cx - cw * 0.03, hinten - dh); ctx.quadraticCurveTo(mx, hinten - dh * 1.5, cx + cw * 1.03, hinten - dh); ctx.lineTo(cx + cw * 0.97, hinten); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d4a017'; ctx.lineWidth = Math.max(4, cw * 0.025);
      [0.14, 0.86].forEach(f => { const x = cx + cw * f, xo = cx - cw * 0.03 + cw * 1.06 * f; ctx.beginPath(); ctx.moveTo(x, hinten); ctx.lineTo(xo, hinten - dh - (1 - Math.abs(f - 0.5) * 2) * dh * 0.25 - dh * 0.08); ctx.stroke(); });
      // Innenraum
      ctx.fillStyle = holz(hinten, rand, '#3a1f08', '#24130a'); ctx.beginPath(); ctx.roundRect(cx + 4, hinten, cw - 8, tiefe + wandH * 0.4, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(cx + 4, hinten, cw - 8, 4);
      // Münzen
      box = { x: cx + 10, y: hinten - huegel, w: cw - 20, h: rand - (hinten - huegel) + 2 };
      innen = (x, y, r) => x - r > cx + 8 && x + r < cx + cw - 8 && y < rand && y - r * 0.6 > hinten - huegel * Math.max(0, 1 - ((x - mx) / (cw / 2)) ** 2);
      const { r, p } = bPacken(innen, box, b.ziel, `schatz2${W}x${H}x${b.ziel}`);
      for (let i = 0; i < n; i++) {
        const { x, y } = fall(i, p[i]);
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#fff7c2'); g.addColorStop(0.5, '#facc15'); g.addColorStop(1, '#b8860b');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(146,98,0,.65)'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 0.68, 0, 7); ctx.stroke();
      }
      // Vorderwand mit Beschlägen und Schloss
      ctx.fillStyle = holz(rand, boden, '#a8642a', '#6e3c15'); ctx.beginPath(); ctx.roundRect(cx, rand, cw, wandH, [4, 4, 14, 14]); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2; [0.36, 0.68].forEach(f => { ctx.beginPath(); ctx.moveTo(cx + 6, rand + wandH * f); ctx.lineTo(cx + cw - 6, rand + wandH * f); ctx.stroke(); });
      ctx.fillStyle = '#d4a017'; const bb = Math.max(8, cw * 0.035);
      ctx.fillRect(cx - 3, rand - 2, cw + 6, bb);
      [0.12, 0.88].forEach(f => ctx.fillRect(cx + cw * f - bb / 2, rand, bb, wandH));
      const sw = Math.max(26, cw * 0.09); ctx.beginPath(); ctx.roundRect(mx - sw / 2, rand + bb * 0.6, sw, sw * 1.15, 6); ctx.fill();
      ctx.fillStyle = '#3d220b'; ctx.beginPath(); ctx.arc(mx, rand + bb * 0.6 + sw * 0.45, sw * 0.15, 0, 7); ctx.fill(); ctx.fillRect(mx - sw * 0.06, rand + bb * 0.6 + sw * 0.5, sw * 0.12, sw * 0.38);
    }
  } else if (b.stil === 'sterne') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1533'); g.addColorStop(1, '#23305e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(W * 0.86, H * 0.18, Math.min(W, H) * 0.07, 0, 7); ctx.fill();
    ctx.fillStyle = '#23305e'; ctx.beginPath(); ctx.arc(W * 0.86 + Math.min(W, H) * 0.03, H * 0.16, Math.min(W, H) * 0.065, 0, 7); ctx.fill();
    const rnd = bRand(b.ziel * 7 + 3), s = Math.max(6, Math.min(W, H) / Math.sqrt(b.ziel) * 0.22);
    for (let i = 0; i < b.ziel; i++) {
      const x = 30 + rnd() * (W - 60), y = 30 + rnd() * (H - 60), an = i < n, a = anim[i] ? Math.min(1, (jetzt - anim[i]) / 500) : 1;
      if (x > W * 0.78 && y < H * 0.3) continue;
      if (!an) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); continue; }
      const gr = s * (0.7 + 0.3 * Math.sin(jetzt / 600 + i)) * (a < 1 ? 1 + (1 - a) * 2 : 1);
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fde047'; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12;
      ctx.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? gr * 0.42 : gr, w = k * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(w) * rr, Math.sin(w) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
    }
  } else if (b.stil === 'turm') {
    const spalten = Math.max(3, Math.round(Math.sqrt(b.ziel / 2.2))), reihen = Math.ceil(b.ziel / spalten);
    const bw = Math.min(W * 0.7 / spalten, (H - 30) / reihen * 2.1), bh = bw / 2.1, x0 = (W - spalten * bw) / 2, boden = H - 14;
    ctx.fillStyle = dunkel ? '#3a3a3c' : '#d1d5db'; ctx.fillRect(x0 - 30, boden, spalten * bw + 60, 8);
    for (let i = 0; i < b.ziel; i++) {
      const rz = Math.floor(i / spalten), sp = i % spalten, off = rz % 2 ? bw / 2 : 0;
      const ziel = { x: x0 + sp * bw + off - (rz % 2 ? bw / 4 : 0), y: boden - (rz + 1) * bh };
      if (i >= n) { ctx.strokeStyle = dunkel ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'; ctx.setLineDash([4, 4]); ctx.strokeRect(ziel.x + 2, ziel.y + 2, bw - 4, bh - 4); ctx.setLineDash([]); continue; }
      const { x, y } = fall(i, ziel), c = COLORS[(rz * 3 + sp) % COLORS.length];
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, bw - 4, bh - 4, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; [0.3, 0.7].forEach(f => { ctx.beginPath(); ctx.arc(x + bw * f, y + bh * 0.42, bh * 0.16, 0, 7); ctx.fill(); });
    }
  } else { // Rakete
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1533'); g.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
    const rnd = bRand(11); ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, rnd() * 1.6, 0, 7); ctx.fill(); }
    const R = Math.min(W, H);
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(W * 0.08, H * 1.02, R * 0.28, 0, 7); ctx.fill();
    ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.ellipse(W * 0.06, H * 0.9, R * 0.08, R * 0.05, 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.beginPath(); ctx.arc(W * 0.88, H * 0.16, R * 0.11, 0, 7); ctx.fill();
    ctx.fillStyle = '#cbd5e1'; [[-0.3, -0.2, 0.025], [0.25, 0.1, 0.02], [-0.05, 0.35, 0.018]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(W * 0.88 + dx * R * 0.11 * 3, H * 0.16 + dy * R * 0.11 * 3, R * r, 0, 7); ctx.fill(); });
    const punkt = t => ({ x: W * 0.14 + (W * 0.66) * t, y: H * 0.8 - (H * 0.56) * t - Math.sin(t * Math.PI) * H * 0.12 });
    for (let i = 1; i <= b.ziel; i++) { const p = punkt(i / b.ziel); ctx.fillStyle = i <= n ? '#fde047' : 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(p.x, p.y, i <= n ? 4 : 2.5, 0, 7); ctx.fill(); }
    b._pos = (b._pos ?? n) + (n - (b._pos ?? n)) * 0.08;
    const t = Math.min(1, b._pos / b.ziel), p = punkt(t), q = punkt(Math.min(1, t + 0.01)), w = Math.atan2(q.y - p.y, q.x - p.x);
    // Flugspur bis zur Rakete
    ctx.strokeStyle = 'rgba(253,224,71,.5)'; ctx.lineWidth = 3; ctx.setLineDash([2, 7]); ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const q2 = punkt(t * k / 40); k ? ctx.lineTo(q2.x, q2.y) : ctx.moveTo(q2.x, q2.y); } ctx.stroke(); ctx.setLineDash([]);
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 0.14); glow.addColorStop(0, 'rgba(255,200,80,.35)'); glow.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.14, 0, 7); ctx.fill();
    const fliegt = Math.abs(n - b._pos) > 0.02;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(w + Math.PI / 2);
    drawRocket(ctx, 0, 0, R * 0.075, fliegt || n < b.ziel ? jetzt * (fliegt ? 1 : 0.5) : null); ctx.restore();
  }
}

registerModule({
  id: 'belohnung', title: 'Klassenbelohnung', icon: '🏆',
  render(el) {
    const mod = this, anim = {};
    el.innerHTML = `<div class="page bel">
      <div class="pagehead">${seitenTitel('geschenk', '#000', 'Klassenbelohnung')}
        <label class="kselect">Klasse <select id="bKl"><option value="alle">Ohne Klasse</option>${state.klassen.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join('')}</select></label></div>
      <div class="side-layout rev">
        <section class="bel-stage" id="bStage">
          <button class="auf-fs" id="bFs" title="Vollbild">⛶</button>
          <div class="bel-kopf"><div class="bel-zahl" id="bZahl"></div><div class="bel-ziel" id="bZiel"></div></div>
          <canvas id="bCv"></canvas>
          <div class="bel-plus"><button class="btn primary huge" data-plus="1">+1</button><button class="btn" data-plus="3">+3</button><button class="btn" data-plus="5">+5</button><button class="btn" data-plus="-1">−1</button></div>
        </section>
        <aside class="card side" id="bSide"></aside>
      </div></div>`;
    const $ = id => el.querySelector('#' + id), cv = $('bCv'), ctx = cv.getContext('2d');
    $('bKl').value = bKey();
    let grund = '';

    const kopf = () => {
      const b = bDaten();
      $('bZahl').innerHTML = `<b>${Math.min(b.anzahl, b.ziel)}</b> / ${b.ziel}`;
      $('bZiel').innerHTML = b.anzahl >= b.ziel ? `🎉 Geschafft: <b>${esc(b.belohnung)}</b>` : `Noch <b>${b.ziel - b.anzahl}</b> bis: <b>${esc(b.belohnung)}</b>`;
      $('bStage').classList.toggle('fertig', b.anzahl >= b.ziel);
    };
    const seite = () => {
      const b = bDaten();
      $('bSide').innerHTML = `
        <h3>Wofür? <span class="muted small">(optional)</span></h3>
        <div class="bel-gruende">${BGRUENDE.map(g => `<button data-grund="${g}" class="${grund === g ? 'on' : ''}">${g}</button>`).join('')}</div>
        <h3>Darstellung</h3>
        <div class="bel-stile">${Object.entries(BSTILE).map(([k, s]) => `<button data-stil="${k}" class="${b.stil === k ? 'on' : ''}"><span>${s.ic}</span>${s.name}</button>`).join('')}</div>
        <label class="f">Ziel (Anzahl) <input type="number" class="num" id="bZielIn" min="5" max="100" value="${b.ziel}"></label>
        <label class="f">Belohnung <input id="bBel" value="${esc(b.belohnung)}" placeholder="z.B. Spielestunde, Filmstunde …"></label>
        ${b.anzahl >= b.ziel ? '<button class="btn primary full" id="bEingeloest">✓ Belohnung eingelöst – neu starten</button>' : ''}
        ${b.eingeloest ? `<p class="muted small">Schon ${b.eingeloest}× eingelöst 🎉</p>` : ''}
        <details><summary class="muted small">Verlauf</summary><ul class="bel-log">${b.log.slice(-12).reverse().map(l => `<li><span class="muted">${fmtDate(l.d).slice(0, -5)}</span> ${l.n > 0 ? '+' : ''}${l.n} ${esc(l.grund || '')}</li>`).join('') || '<li class="muted">noch nichts</li>'}</ul>
          <button class="btn small danger" id="bReset">Auf 0 setzen</button></details>`;
    };
    const plus = n => {
      const b = bDaten(), vorher = b.anzahl;
      b.anzahl = Math.max(0, Math.min(b.ziel, b.anzahl + n));
      if (b.anzahl === vorher) { if (n > 0) toast('Ziel ist schon erreicht – Belohnung einlösen!'); return; }
      b.log.push({ d: todayISO(), n: b.anzahl - vorher, grund }); if (b.log.length > 200) b.log.shift();
      const t = performance.now();
      for (let i = vorher; i < b.anzahl; i++) { anim[i] = t + (i - vorher) * 140; setTimeout(() => (b.stil === 'sterne' ? tone(1200 + i * 9 % 400, 0.25, 'sine', 0.12) : b.stil === 'schatz' ? (tone(1800, 0.06, 'square', 0.05), tone(2400, 0.12, 'triangle', 0.08, 0.05)) : b.stil === 'rakete' ? sweep(200, 600, 0.3, 'sawtooth', 0.05) : tone(700 + (i % 8) * 60, 0.09, 'triangle', 0.14)), (i - vorher) * 140 + 450); }
      grund = ''; save(); kopf(); seite();
      if (b.anzahl >= b.ziel && vorher < b.ziel) setTimeout(() => { winSound(); confetti(200); }, 900);
    };
    const groesse = () => { const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const loop = () => { const r = cv.getBoundingClientRect(); bZeichnen(ctx, r.width, r.height, bDaten(), anim, performance.now()); mod._raf = requestAnimationFrame(loop); };
    mod._ro = new ResizeObserver(groesse); mod._ro.observe(cv);

    el.addEventListener('click', e => {
      const t = e.target, b = bDaten();
      const p = t.closest('[data-plus]'); if (p) { plus(+p.dataset.plus); return; }
      const g = t.closest('[data-grund]'); if (g) { grund = grund === g.dataset.grund ? '' : g.dataset.grund; seite(); return; }
      const s = t.closest('[data-stil]'); if (s) { b.stil = s.dataset.stil; b._pos = null; save(); seite(); return; }
      if (t.closest('#bFs')) { const st = $('bStage'); document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.(); return; }
      if (t.id === 'bEingeloest') { b.eingeloest = (b.eingeloest || 0) + 1; b.anzahl = 0; b._pos = 0; b.log.push({ d: todayISO(), n: 0, grund: '🎁 eingelöst: ' + b.belohnung }); save(); kopf(); seite(); sound.tada(); return; }
      if (t.id === 'bReset' && confirm('Wirklich auf 0 setzen?')) { b.anzahl = 0; b._pos = 0; save(); kopf(); seite(); }
    });
    el.addEventListener('change', e => {
      const b = bDaten();
      if (e.target.id === 'bKl') { state.belohnungAkt = e.target.value; save(); kopf(); seite(); return; }
      if (e.target.id === 'bZielIn') { b.ziel = Math.max(5, Math.min(100, +e.target.value || 30)); b.anzahl = Math.min(b.anzahl, b.ziel); save(); kopf(); seite(); }
    });
    el.addEventListener('input', e => { if (e.target.id === 'bBel') { bDaten().belohnung = e.target.value; save(); kopf(); } });
    this._key = e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === '+' || e.key === ' ') { e.preventDefault(); plus(1); } if (e.key === '-') plus(-1); };
    document.addEventListener('keydown', this._key);
    kopf(); seite(); groesse(); loop();
  },
  destroy() { cancelAnimationFrame(this._raf); this._ro?.disconnect(); document.removeEventListener('keydown', this._key); },
});
