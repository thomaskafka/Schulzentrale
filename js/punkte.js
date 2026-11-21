'use strict';
/* ===== Punktetafel & Buzzer für Spiele – mit verschiedenen Ansichten und passenden Klängen ===== */

const PANSICHTEN = [
  { id: 'balken', icon: '📊', name: 'Balken' },
  { id: 'berg', icon: '⛰️', name: 'Gipfelsturm' },
  { id: 'rennen', icon: '🏎️', name: 'Autorennen' },
  { id: 'glas', icon: '🫙', name: 'Murmelglas' },
  { id: 'ballons', icon: '🎈', name: 'Ballonfahrt' },
  { id: 'tafel', icon: '🔢', name: 'Anzeigetafel' },
];
/* Auswahl, wie die Teams heißen und welches Zeichen sie tragen */
const TEAM_STILE = {
  tiere: { name: 'Tiere', liste: () => TEAMS.map(([s, n]) => [s, n]) },
  farben: { name: 'Farben', liste: () => [['🔴', 'Team Rot', '#ef4444'], ['🔵', 'Team Blau', '#3b82f6'], ['🟢', 'Team Grün', '#22c55e'], ['🟡', 'Team Gelb', '#eab308'], ['🟣', 'Team Lila', '#8b5cf6'], ['🟠', 'Team Orange', '#f97316'], ['🟤', 'Team Braun', '#92400e'], ['⚫', 'Team Schwarz', '#374151'], ['⚪', 'Team Weiß', '#94a3b8'], ['💗', 'Team Pink', '#ec4899']] },
  nummern: { name: 'Nummern', liste: () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => [String(n), 'Team ' + n]) },
  sport: { name: 'Sport', liste: () => [['⚽', 'Fußball'], ['🏀', 'Basketball'], ['🎾', 'Tennis'], ['🏐', 'Volleyball'], ['🏓', 'Tischtennis'], ['⛷️', 'Ski'], ['🏒', 'Eishockey'], ['🏈', 'Football'], ['⚾', 'Baseball'], ['🥊', 'Boxen']] },
  weltall: { name: 'Weltall', liste: () => [['🚀', 'Raketen'], ['🌙', 'Monde'], ['⭐', 'Sterne'], ['🪐', 'Planeten'], ['☄️', 'Kometen'], ['🛰️', 'Satelliten'], ['🌍', 'Erden'], ['🌌', 'Galaxien'], ['👽', 'Aliens'], ['🔭', 'Teleskope']] },
  natur: { name: 'Natur', liste: () => [['⚡', 'Blitze'], ['🌊', 'Wellen'], ['🔥', 'Flammen'], ['❄️', 'Schneeflocken'], ['🌪️', 'Tornados'], ['☀️', 'Sonnen'], ['🌈', 'Regenbögen'], ['🌋', 'Vulkane'], ['🌲', 'Tannen'], ['🌵', 'Kakteen']] },
  musik: { name: 'Musik', liste: () => [['🎸', 'Gitarren'], ['🥁', 'Trommeln'], ['🎹', 'Klaviere'], ['🎺', 'Trompeten'], ['🎻', 'Geigen'], ['🎷', 'Saxofone'], ['🎤', 'Mikrofone'], ['🪗', 'Akkordeons'], ['🎧', 'Kopfhörer'], ['🪕', 'Banjos']] },
  fahrzeuge: { name: 'Fahrzeuge', liste: () => [['🚀', 'Raketen'], ['✈️', 'Jets'], ['🚂', 'Lokomotiven'], ['⛵', 'Segler'], ['🚁', 'Helikopter'], ['🏎️', 'Rennwagen'], ['🚲', 'Fahrräder'], ['🛥️', 'Motorboote'], ['🚜', 'Traktoren'], ['🛸', 'UFOs']] },
  obst: { name: 'Obst', liste: () => [['🍎', 'Äpfel'], ['🍋', 'Zitronen'], ['🍇', 'Trauben'], ['🍓', 'Erdbeeren'], ['🍊', 'Orangen'], ['🥝', 'Kiwis'], ['🍌', 'Bananen'], ['🍒', 'Kirschen'], ['🍑', 'Pfirsiche'], ['🍍', 'Ananas']] },
  essen: { name: 'Essen', liste: () => [['🍕', 'Pizza'], ['🍔', 'Burger'], ['🌮', 'Tacos'], ['🍝', 'Spaghetti'], ['🥨', 'Brezeln'], ['🍩', 'Donuts'], ['🌭', 'Hotdogs'], ['🥗', 'Salate'], ['🍜', 'Nudelsuppen'], ['🧇', 'Waffeln']] },
};


const BUZZ_KEYS = ['A', 'L', 'Q', 'P', 'C', 'M', 'X', 'O', 'V', 'K'];
const MAX_TEAMS = 10;

/* Klänge passend zur Ansicht */
const PSOUND = {
  balken: { plus: () => { tone(660, 0.12, 'triangle', 0.2); tone(990, 0.2, 'triangle', 0.18, 0.08); }, minus: () => tone(220, 0.25, 'triangle', 0.2) },
  berg: { plus: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.09, 'square', 0.07, i * 0.05)), minus: () => sweep(600, 150, 0.4, 'square', 0.08) },
  rennen: { plus: () => { sweep(90, 420, 0.5, 'sawtooth', 0.12); sweep(180, 840, 0.5, 'square', 0.04); }, minus: () => sweep(400, 60, 0.45, 'sawtooth', 0.12) },
  glas: { plus: () => { tone(2093, 0.3, 'sine', 0.16); tone(2637, 0.35, 'sine', 0.1, 0.06); tone(3136, 0.25, 'sine', 0.06, 0.13); }, minus: () => tone(1046, 0.2, 'sine', 0.12) },
  ballons: { plus: () => sweep(300, 1100, 0.45, 'sine', 0.2), minus: () => sweep(900, 200, 0.5, 'sine', 0.2) },
  tafel: { plus: () => { tone(880, 0.08, 'square', 0.1); tone(1320, 0.15, 'square', 0.1, 0.09); }, minus: () => tone(150, 0.35, 'square', 0.12) },
};
const buzzSound = i => { tone(180 + i * 60, 0.45, 'sawtooth', 0.18); tone(360 + i * 120, 0.45, 'square', 0.06); };
const winSound = () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.8 : 0.16, 'triangle', 0.22, i * 0.14));

state.punkte ||= {
  ansicht: 'balken', ziel: 20, ton: true,
  teams: [0, 1, 2, 3].map(i => ({ id: uid(), name: TEAMS[i][1], emoji: TEAMS[i][0], farbe: COLORS[[0, 5, 3, 7][i]], score: 0 })),
};
const P = state.punkte;
if (!PSOUND[P.ansicht]) P.ansicht = 'balken';
if (P.stil && !TEAM_STILE[P.stil]) P.stil = 'tiere';

/** Für andere Programme (Quiz): Punkte vergeben */
function punkteAdd(teamId, n) {
  const t = P.teams.find(x => x.id === teamId); if (!t) return;
  const vorher = t.score;
  t.score = Math.max(0, t.score + n); save();
  if (P.ton) (n > 0 ? PSOUND[P.ansicht].plus : PSOUND[P.ansicht].minus)();
  if (vorher < P.ziel && t.score >= P.ziel) zielFeiern(t);
}
/** Ziel erreicht – Fanfare, Konfetti und Anzeige (auch aus dem Quiz heraus) */
function zielFeiern(t) {
  if (P.ton) winSound(); confetti();
  const o = document.createElement('div'); o.className = 'result-pop';
  o.innerHTML = `<div class="rp-card"><div class="pb-big">🏆</div><div class="rp-name" style="background:none;color:${t.farbe}">${t.emoji} ${esc(t.name)}</div><div class="pb-sub">hat das Punkteziel von ${P.ziel} erreicht!</div><div class="muted small">Klicken zum Schließen</div></div>`;
  o.onclick = () => o.remove(); document.body.appendChild(o);
}

registerModule({
  id: 'punkte', title: 'Punktetafel & Buzzer', icon: '🏆',
  render(el) {
    const mod = this;
    el.innerHTML = `<div class="page">
      <div class="side-layout rev">
        <section class="pstage-wrap" id="pWrap">
          <div class="card timer-stage pstage" id="pStage"><canvas id="pc"></canvas><div class="pbuzz" id="pBuzz"></div><button class="auf-fs" id="pFs" title="Vollbild (Esc beendet)">⛶</button></div>
          <div class="pteams" id="pTeams"></div>
        </section>
        <aside class="card side" id="pSide" data-pseite="${P.teams.length ? 'spiel' : 'teams'}">
          <div class="seg" id="pReiter"><button data-preiter="spiel">🎮 Spiel</button><button data-preiter="teams">👥 Teams (${P.teams.length})</button></div>
          <div class="pseite" data-fuer="spiel">
          <h3>Darstellung</h3>
          <div class="modes">${PANSICHTEN.map(m => `<button class="mode" data-pview="${m.id}"><span>${m.icon}</span>${m.name}</button>`).join('')}</div>
          <h3>Punkteziel</h3>
          <div class="stepper small"><button data-zs="-5">−</button><input type="number" id="pZiel" min="1" max="999"><button data-zs="5">+</button></div>
          <div class="zchips">${[10, 15, 20, 30, 50, 100].map(z => `<button class="btn small" data-z="${z}">${z}</button>`).join('')}</div>
          <label class="chk"><input type="checkbox" id="pTon"> Klänge</label>
          <button class="btn primary big full" id="pBuzzGo">🔔 Buzzer-Runde</button>
          <p class="muted small">Buzzer-Tasten: ${BUZZ_KEYS.map((k, i) => `<kbd>${k}</kbd>`).join(' ')} (Team 1–10) oder auf die Team-Karte tippen.<br>
          Punkte ohne Buzzer: Tasten <kbd>1</kbd>–<kbd>9</kbd>, <kbd>0</kbd> = +1, mit <kbd>Shift</kbd> = −1.</p>
          </div>
          <div class="pseite" data-fuer="teams">
          <button class="btn full" id="pFromG" title="Teams aus „Gruppen bilden“ übernehmen">👥 Aus „Gruppen bilden“ übernehmen</button>
          <label class="chk small">Stil <select id="pStil">${Object.entries(TEAM_STILE).map(([k, s]) => `<option value="${k}" ${(P.stil || 'tiere') === k ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
          <div id="pEdit" class="pedit"></div>
          <button class="btn" id="pAdd">+ Team</button>
          <button class="btn danger full" id="pReset">↺ Alle Punkte auf 0</button>
          </div>
        </aside>
      </div></div>`;
    const $ = id => el.querySelector('#' + id);
    const cv = $('pc'), ctx = cv.getContext('2d');
    let W = 0, H = 0, shown = P.teams.map(t => t.score), gewinner = null;
    const bz = { armed: false, locked: new Set(), team: null };

    const resize = () => {
      const r = $('pStage').getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ui = () => {
      el.querySelectorAll('[data-pview]').forEach(b => b.classList.toggle('on', b.dataset.pview === P.ansicht));
      $('pZiel').value = P.ziel; $('pTon').checked = P.ton;
      $('pStage').dataset.mode = P.ansicht;
    };
    const drawTeams = () => {
      const rb = el.querySelector('[data-preiter="teams"]'); if (rb) rb.textContent = `👥 Teams (${P.teams.length})`;
      $('pTeams').innerHTML = P.teams.map((t, i) => `<div class="pteam ${bz.team === i ? 'buzzed' : ''} ${bz.locked.has(i) ? 'locked' : ''}" style="--c:${t.farbe}" data-buzz="${i}">
        <div class="pt-name"><span>${t.emoji}</span>${esc(t.name)}${t.id === P.beginnt ? ' <small title="beginnt">⭐</small>' : ''}</div>
        <div class="pt-score">${t.score}<small> / ${P.ziel}</small></div>
        <div class="pt-btns"><button data-pm="${i}" data-n="-1">−1</button><button data-pm="${i}" data-n="1">+1</button><button data-pm="${i}" data-n="5">+5</button></div>
        <kbd class="pt-key">${BUZZ_KEYS[i]}</kbd></div>`).join('');
      $('pEdit').innerHTML = P.teams.map((t, i) => `<div class="row pe-row" data-i="${i}">
        <button class="pe-emoji" data-emo title="Zeichen wechseln">${t.emoji}</button>
        <button class="cdot" data-col style="background:${t.farbe}" title="Farbe wechseln"></button>
        <input data-name value="${esc(t.name)}"><button class="x" data-delt title="Team entfernen">×</button></div>`).join('');
    };
    const change = (i, n) => {
      const t = P.teams[i]; if (!t) return;
      t.score = Math.max(0, t.score + n); save(); drawTeams();
      if (P.ton) (n > 0 ? PSOUND[P.ansicht].plus : PSOUND[P.ansicht].minus)();
      if (n > 0 && t.score >= P.ziel && gewinner !== t.id) {
        gewinner = t.id;
        setTimeout(() => { if (P.ton) winSound(); confetti(); showBuzz(`<div class="pb-big">🏆</div><div class="pb-team" style="color:${t.farbe}">${t.emoji} ${esc(t.name)}</div><div class="pb-sub">hat das Ziel erreicht!</div><button class="btn" data-pbclose>Weiterspielen</button>`); }, 600);
      }
    };

    /* Buzzer */
    const showBuzz = html => { $('pBuzz').innerHTML = html; $('pBuzz').classList.toggle('show', !!html); };
    const arm = () => {
      audio(); bz.armed = true; bz.team = null; drawTeams();
      showBuzz(`<div class="pb-wait">🔔 Wer weiß es?</div><div class="pb-sub">Buzzer drücken! ${bz.locked.size ? `<br><small>Gesperrt: ${[...bz.locked].map(i => P.teams[i].emoji).join(' ')}</small>` : ''}</div><button class="btn" data-pbclose>Abbrechen</button>`);
    };
    const buzz = i => {
      if (!bz.armed || bz.locked.has(i) || !P.teams[i]) return;
      bz.armed = false; bz.team = i; drawTeams();
      if (P.ton) buzzSound(i);
      const t = P.teams[i];
      showBuzz(`<div class="pb-big">${t.emoji}</div><div class="pb-team" style="color:${t.farbe}">${esc(t.name)}!</div>
        <div class="row center"><button class="btn primary big" data-pbok>✓ Richtig (+1)</button><button class="btn big" data-pbno>✗ Falsch – andere dürfen</button></div>
        <button class="btn small" data-pbclose>Schließen</button>`);
    };
    const closeBuzz = () => { bz.armed = false; bz.team = null; bz.locked.clear(); showBuzz(''); drawTeams(); };

    el.addEventListener('click', e => {
      if (e.target.closest('#pFs')) { document.fullscreenElement ? document.exitFullscreen() : $('pWrap').requestFullscreen?.(); return; }
      const rt = e.target.closest('[data-preiter]'); if (rt) { $('pSide').dataset.pseite = rt.dataset.preiter; return; }
      const t = e.target;
      const v = t.closest('[data-pview]'); if (v) { P.ansicht = v.dataset.pview; save(); ui(); if (P.ton) { audio(); PSOUND[P.ansicht].plus(); } }
      const pm = t.closest('[data-pm]'); if (pm) { audio(); change(+pm.dataset.pm, +pm.dataset.n); return; }
      const bc = t.closest('[data-buzz]'); if (bc && bz.armed) { buzz(+bc.dataset.buzz); return; }
      if (t.id === 'pBuzzGo') { bz.locked.clear(); arm(); }
      const zs = t.closest('[data-zs]'), zc = t.closest('[data-z]');
      if (zs || zc) { P.ziel = Math.max(1, zc ? +zc.dataset.z : P.ziel + +zs.dataset.zs); gewinner = null; save(); ui(); drawTeams(); }
      if (t.closest('[data-pbok]')) { const i = bz.team; closeBuzz(); change(i, 1); }
      if (t.closest('[data-pbno]')) { bz.locked.add(bz.team); if (bz.locked.size >= P.teams.length) closeBuzz(); else arm(); }
      if (t.closest('[data-pbclose]')) closeBuzz();
      if (t.id === 'pAdd' && P.teams.length < MAX_TEAMS) {
        const l = TEAM_STILE[P.stil || 'tiere'].liste(), used = P.teams.map(x => x.name), tm = l.find(x => !used.includes(x[1])) || l[0];
        P.teams.push({ id: uid(), name: tm[1], emoji: tm[0], farbe: tm[2] || COLORS[P.teams.length % COLORS.length], score: 0 });
        shown.push(0); save(); drawTeams();
      }
      if (t.id === 'pFromG') {
        const g = Modules.gruppen._last;
        if (!g) return toast('Zuerst unter „Gruppen bilden“ Gruppen erstellen');
        gruppenInPunktetafel(g);
        if (g.stil) { const s = el.querySelector('#pStil'); if (s) s.value = g.stil; }
        shown = P.teams.map(() => 0); gewinner = null; drawTeams(); toast(`${P.teams.length} Teams übernommen${beginntText(g)}`);
      }
      if (t.id === 'pReset' && confirm('Alle Punkte auf 0 setzen?')) { P.teams.forEach(x => x.score = 0); gewinner = null; save(); drawTeams(); }
      const row = t.closest('.pe-row');
      if (row) {
        const tm = P.teams[+row.dataset.i];
        if (t.closest('[data-emo]')) { const l = TEAM_STILE[P.stil || 'tiere'].liste(); const k = l.findIndex(x => x[1] === tm.name); const n = l[(k + 1) % l.length]; const alt = l.some(x => x[1] === tm.name); tm.emoji = n[0]; if (alt || k < 0) tm.name = n[1]; if (n[2]) tm.farbe = n[2]; save(); drawTeams(); }
        if (t.closest('[data-col]')) { tm.farbe = COLORS[(COLORS.indexOf(tm.farbe) + 1) % COLORS.length]; save(); drawTeams(); }
        if (t.closest('[data-delt]') && P.teams.length > 1) { P.teams.splice(+row.dataset.i, 1); shown.splice(+row.dataset.i, 1); save(); drawTeams(); }
      }
    });
    el.addEventListener('change', e => {
      if (e.target.id === 'pZiel') { P.ziel = Math.max(1, +e.target.value || 20); gewinner = null; save(); drawTeams(); }
      if (e.target.id === 'pTon') { P.ton = e.target.checked; save(); }
      if (e.target.id === 'pStil') {
        P.stil = e.target.value; const l = TEAM_STILE[P.stil].liste();
        P.teams.forEach((t, i) => { const [s, n, f] = l[i % l.length]; t.emoji = s; t.name = n; if (f) t.farbe = f; });
        save(); drawTeams();
      }
      if (e.target.dataset.name !== undefined) { P.teams[+e.target.closest('.pe-row').dataset.i].name = e.target.value.trim() || 'Team'; save(); drawTeams(); }
    });
    mod._key = e => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const bi = BUZZ_KEYS.indexOf(e.key.toUpperCase());
      if (bz.armed && bi >= 0) { buzz(bi); return; }
      const n = e.code === 'Digit0' ? 10 : parseInt(e.code.replace('Digit', ''), 10);
      if (e.code.startsWith('Digit') && n >= 1 && n <= P.teams.length) { audio(); change(n - 1, e.shiftKey ? -1 : 1); }
      if (e.key === 'Escape') closeBuzz();
    };
    document.addEventListener('keydown', mod._key);
    mod._onResize = () => setTimeout(resize, 60); window.addEventListener('resize', mod._onResize); document.addEventListener('fullscreenchange', mod._onResize);

    const loop = now => {
      P.teams.forEach((t, i) => { shown[i] = shown[i] ?? 0; shown[i] += (t.score - shown[i]) * 0.12; if (Math.abs(t.score - shown[i]) < 0.01) shown[i] = t.score; });
      ctx.clearRect(0, 0, W, H);
      PDRAW[P.ansicht](ctx, W, H, P.teams, shown, Math.max(P.ziel, ...P.teams.map(t => t.score)), now);
      mod._raf = requestAnimationFrame(loop);
    };
    ui(); drawTeams(); resize();
    mod._raf = requestAnimationFrame(loop);
  },
  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize); document.removeEventListener('fullscreenchange', this._onResize);
    document.removeEventListener('keydown', this._key);
  },
});

/* ---------- Ansichten ---------- */
function pLabel(ctx, text, x, y, size, color = '#1f2937', weight = 900, maxW = 0) {
  text = String(text);
  if (maxW) { // Schrift verkleinern bzw. kürzen, bis der Name ins Feld passt
    ctx.font = `${weight} ${size}px Nunito, sans-serif`;
    while (size > 10 && ctx.measureText(text).width > maxW) { size -= 1; ctx.font = `${weight} ${size}px Nunito, sans-serif`; }
    while (text.length > 2 && ctx.measureText(text).width > maxW) text = text.slice(0, -2) + '…';
  }
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}
function pEmoji(ctx, e, x, y, size) { ctx.fillStyle = '#1d1d1f'; ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); }

const PDRAW = {
  balken(ctx, W, H, teams, shown, max) {
    const n = teams.length, cw = W / n, top = 70, bottom = H - 60, bw = Math.min(140, cw * 0.6);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) { const y = bottom - (bottom - top) * k / 4; ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke(); }
    teams.forEach((t, i) => {
      const cx = cw * (i + 0.5), h = (bottom - top) * Math.min(1, shown[i] / max);
      ctx.fillStyle = t.farbe; rrect(ctx, cx - bw / 2, bottom - h, bw, Math.max(h, 4), 14); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; rrect(ctx, cx - bw / 2 + 8, bottom - h + 6, bw * 0.18, Math.max(0, h - 12), 8); ctx.fill();
      pEmoji(ctx, t.emoji, cx, bottom - h - 34, 40);
      pLabel(ctx, Math.round(shown[i]), cx, bottom - h - 74, 34, t.farbe);
      pLabel(ctx, t.name, cx, bottom + 28, 20, '#374151', 800, cw * 0.92);
    });
  },

  berg(ctx, W, H, teams, shown, max, now) {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#bae6fd'); sky.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const n = teams.length, cw = W / n, base = H - 50, peak = 100;
    teams.forEach((t, i) => {
      const x0 = cw * i + 10, x1 = cw * (i + 1) - 10, px = (x0 + x1) / 2;
      ctx.fillStyle = i % 2 ? '#64748b' : '#78716c';
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(px, peak); ctx.lineTo(x1, base); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px, peak);
      const sl = 0.22; ctx.lineTo(px - (px - x0) * sl, peak + (base - peak) * sl); ctx.lineTo(px - (px - x0) * sl * 0.4, peak + (base - peak) * sl * 0.8);
      ctx.lineTo(px, peak + (base - peak) * sl); ctx.lineTo(px + (x1 - px) * sl * 0.5, peak + (base - peak) * sl * 0.75); ctx.lineTo(px + (x1 - px) * sl, peak + (base - peak) * sl); ctx.fill();
      // Fahne
      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, peak); ctx.lineTo(px, peak - 40); ctx.stroke();
      ctx.fillStyle = t.farbe; ctx.beginPath(); ctx.moveTo(px, peak - 40); ctx.lineTo(px + 26 + Math.sin(now / 200) * 3, peak - 32); ctx.lineTo(px, peak - 24); ctx.fill();
      // Kletter:in auf dem linken Hang
      const q = Math.min(1, shown[i] / max), cx = x0 + (px - x0) * q, cy = base + (peak - base) * q - 22;
      ctx.fillStyle = t.farbe; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      pEmoji(ctx, t.emoji, cx, cy + 1, 28);
      pLabel(ctx, Math.round(shown[i]), cx + 36, cy - 18, 22, '#1f2937');
      pLabel(ctx, t.name, px, base + 26, 18, '#1f2937', 800, cw * 0.92);
    });
    ctx.fillStyle = '#86efac'; ctx.fillRect(0, base, W, 4);
  },

  rennen(ctx, W, H, teams, shown, max, now) {
    ctx.fillStyle = '#4ade80'; ctx.fillRect(0, 0, W, H);
    const n = teams.length, top = 90, lh = Math.min(110, (H - top - 20) / n), x0 = 120, x1 = W - 90;
    ctx.fillStyle = '#4b5563'; ctx.fillRect(0, top, W, lh * n);
    // Ziellinie
    const sq = lh / 6;
    for (let r = 0; r < n * 6; r++) for (let c = 0; c < 2; c++) { ctx.fillStyle = (r + c) % 2 ? '#111' : '#fff'; ctx.fillRect(x1 + 40 + c * sq, top + r * sq, sq, sq); }
    teams.forEach((t, i) => {
      const y = top + lh * (i + 0.5);
      if (i) { ctx.strokeStyle = '#fbbf24'; ctx.setLineDash([24, 18]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, top + lh * i); ctx.lineTo(W, top + lh * i); ctx.stroke(); ctx.setLineDash([]); }
      const q = Math.min(1, shown[i] / max), x = x0 + (x1 - x0) * q, s = Math.min(lh * 0.42, 40);
      const moving = Math.abs(t.score - shown[i]) > 0.05;
      if (moving) for (let k = 1; k <= 3; k++) { ctx.fillStyle = `rgba(229,231,235,${0.6 - k * 0.15})`; ctx.beginPath(); ctx.arc(x - s * 1.6 - k * 14, y + s * 0.2 + Math.sin(now / 60 + k) * 3, 6 + k * 3, 0, 7); ctx.fill(); }
      // Auto
      ctx.fillStyle = t.farbe; rrect(ctx, x - s * 1.5, y - s * 0.3, s * 3, s * 0.75, 10); ctx.fill();
      rrect(ctx, x - s * 0.7, y - s * 0.8, s * 1.4, s * 0.6, 12); ctx.fill();
      ctx.fillStyle = '#bfdbfe'; rrect(ctx, x - s * 0.55, y - s * 0.7, s * 1.1, s * 0.4, 8); ctx.fill();
      pEmoji(ctx, t.emoji, x, y - s * 0.5, s * 0.5);
      ctx.fillStyle = '#111'; [-0.9, 0.9].forEach(d => { ctx.beginPath(); ctx.arc(x + d * s, y + s * 0.45, s * 0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(x + d * s, y + s * 0.45, s * 0.12, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; });
      ctx.fillStyle = 'rgba(255,255,255,.9)'; rrect(ctx, 8, y - 18, 100, 36, 10); ctx.fill();
      pLabel(ctx, `${t.name} ${Math.round(shown[i])}`, 58, y, 15, '#1f2937', 800, 92);
    });
  },

  glas(ctx, W, H, teams, shown, max) {
    const n = teams.length, cw = W / n, top = 90, bottom = H - 60, jw = Math.min(170, cw * 0.72), jh = bottom - top;
    const cols = 5, mr = Math.min(jw / cols / 2 - 1, 16), rows = Math.floor(jh / (mr * 2)), cap = cols * rows;
    const scale = max > cap ? cap / max : 1;
    teams.forEach((t, i) => {
      const cx = cw * (i + 0.5), x0 = cx - jw / 2;
      const count = shown[i] * scale, full = Math.floor(count + 1e-6), frac = count - full;
      for (let k = 0; k <= full && k < cap; k++) {
        const c = k % cols, r = Math.floor(k / cols);
        const tx = x0 + 6 + mr + c * ((jw - 12 - 2 * mr) / (cols - 1)) + (r % 2 ? 3 : -3), ty = bottom - 6 - mr - r * mr * 1.95;
        let y = ty;
        if (k === full) { if (frac < 0.02) continue; y = top - 20 + (ty - top + 20) * Math.min(1, frac * 1.1); }
        const g = ctx.createRadialGradient(tx - mr * 0.3, y - mr * 0.3, mr * 0.1, tx, y, mr);
        g.addColorStop(0, '#fff'); g.addColorStop(0.35, t.farbe); g.addColorStop(1, t.farbe);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx, y, mr, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(100,116,139,.7)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, bottom - 18); ctx.quadraticCurveTo(x0, bottom, x0 + 18, bottom); ctx.lineTo(x0 + jw - 18, bottom); ctx.quadraticCurveTo(x0 + jw, bottom, x0 + jw, bottom - 18); ctx.lineTo(x0 + jw, top); ctx.stroke();
      ctx.fillStyle = 'rgba(186,230,253,.18)'; ctx.fillRect(x0, top, jw, jh);
      ctx.fillStyle = '#a16207'; rrect(ctx, x0 - 8, top - 16, jw + 16, 16, 6); ctx.fill();
      pEmoji(ctx, t.emoji, cx, top - 42, 34);
      pLabel(ctx, `${t.name}: ${Math.round(shown[i])}`, cx, bottom + 28, 19, '#374151', 800, cw * 0.92);
    });
  },

  ballons(ctx, W, H, teams, shown, max, now) {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7dd3fc'); sky.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    [[0.15, 0.3], [0.6, 0.18], [0.85, 0.45], [0.35, 0.6]].forEach(([fx, fy], k) => {
      const x = ((fx * W + now / (60 + k * 20)) % (W + 200)) - 100, y = fy * H;
      [[0, 0, 30], [28, -10, 36], [60, 0, 28]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill(); });
    });
    ctx.fillStyle = '#86efac'; ctx.fillRect(0, H - 40, W, 40);
    const n = teams.length, cw = W / n, top = 150, bottom = H - 110;
    teams.forEach((t, i) => {
      const q = Math.min(1, shown[i] / max), cx = cw * (i + 0.5) + Math.sin(now / 900 + i) * 8, cy = bottom - (bottom - top) * q, r = Math.min(56, cw * 0.32);
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy + r * 0.7); ctx.lineTo(cx - r * 0.3, cy + r * 1.35); ctx.moveTo(cx + r * 0.6, cy + r * 0.7); ctx.lineTo(cx + r * 0.3, cy + r * 1.35); ctx.stroke();
      ctx.fillStyle = t.farbe; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 2.2); ctx.quadraticCurveTo(cx, cy + r * 1.1, cx - r * 0.81, cy + r * 0.59); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.3, r * 0.95, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#a16207'; rrect(ctx, cx - r * 0.35, cy + r * 1.3, r * 0.7, r * 0.45, 5); ctx.fill();
      pEmoji(ctx, t.emoji, cx, cy + r * 1.2, r * 0.45);
      pLabel(ctx, Math.round(shown[i]), cx, cy - r - 22, 28, '#0c4a6e');
      pLabel(ctx, t.name, cw * (i + 0.5), H - 20, 18, '#14532d', 800, cw * 0.92);
    });
  },

  tafel(ctx, W, H, teams, shown, max, now) {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { ctx.fillStyle = 'rgba(255,255,255,.02)'; ctx.fillRect(0, y, W, 1); }
    const n = teams.length, cols = n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols);
    const cw = W / cols, ch = (H - 80) / rows;
    teams.forEach((t, i) => {
      const cx = cw * (i % cols + 0.5), cy = 80 + ch * (Math.floor(i / cols) + 0.5);
      ctx.strokeStyle = t.farbe; ctx.lineWidth = 3; rrect(ctx, cx - cw * 0.42, cy - ch * 0.42, cw * 0.84, ch * 0.84, 16); ctx.stroke();
      pLabel(ctx, `${t.emoji} ${t.name}`, cx, cy - ch * 0.26, Math.min(28, ch * 0.13), t.farbe, 900, cw * 0.76);
      ctx.shadowColor = '#facc15'; ctx.shadowBlur = 24;
      ctx.fillStyle = '#facc15'; ctx.font = `700 ${Math.min(130, ch * 0.45, cw * 0.62)}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(shown[i])).padStart(2, '0'), cx, cy + ch * 0.08);
      ctx.shadowBlur = 0;
    });
  },
};
