'use strict';
/* ===== Arbeitsauftrag-Tafel: Aufgabe, Sozialform, Lautstärke, Material, Zeit und „Wenn du fertig bist“ auf einen Blick ===== */

const SOZIAL = {
  einzel: { ic: '🧍', name: 'Einzelarbeit' }, partner: { ic: '👫', name: 'Partnerarbeit' },
  gruppe: { ic: '👨‍👩‍👧‍👦', name: 'Gruppenarbeit' }, plenum: { ic: '🗣️', name: 'Alle gemeinsam' },
};
const LAUT = {
  still: { ic: '🤫', name: 'Ganz still', farbe: '#0071e3' }, fluester: { ic: '🙊', name: 'Flüstern', farbe: '#34c759' },
  leise: { ic: '🔉', name: 'Leise sprechen', farbe: '#ff9500' }, normal: { ic: '🔊', name: 'Normal sprechen', farbe: '#ff3b30' },
};
const MATERIAL = [['heft', '📓', 'Heft'], ['buch', '📘', 'Buch'], ['ab', '📄', 'Arbeitsblatt'], ['stift', '✏️', 'Stift'], ['farben', '🖍️', 'Farbstifte'],
  ['lineal', '📏', 'Lineal'], ['rechner', '🧮', 'Taschenrechner'], ['woerterbuch', '📖', 'Wörterbuch'], ['tablet', '💻', 'Tablet / Laptop'], ['schere', '✂️', 'Schere & Kleber'], ['kopfhoerer', '🎧', 'Kopfhörer']];

state.auftraege ||= [];
if (!state.auftraege.length) state.auftraege.push({ id: uid(), titel: 'Lies den Text auf Seite 42', schritte: 'Lies den Text genau durch.\nUnterstreiche alle unbekannten Wörter.\nBeantworte die Fragen 1–4 im Heft.',
  sozial: 'einzel', laut: 'still', material: ['buch', 'heft', 'stift'], minuten: 15, fertig: 'Lies in deinem Lesebuch weiter oder hilf deinem Sitznachbarn.' });

registerModule({
  id: 'auftrag', title: 'Arbeitsauftrag', icon: '📋',
  render(el) {
    const mod = this;
    if (!state.auftraege.some(a => a.id === state.aktAuftrag)) state.aktAuftrag = state.auftraege[0].id;
    const A = () => state.auftraege.find(a => a.id === state.aktAuftrag);
    const T = (mod._t ||= { rest: null, gesamt: 0, laeuft: false, erledigt: {} });

    el.innerHTML = `<div class="page auf">
      <div class="pagehead">${seitenTitel('tafel', '#000', 'Arbeitsauftrag')}
        <div class="row"><select id="aWahl" class="auf-wahl"></select><button class="btn" id="aNeu">+ Neu</button><button class="btn" id="aKopie" title="Kopie anlegen">⧉</button><button class="btn danger" id="aDel" title="Löschen">🗑</button></div></div>
      <div class="side-layout">
        <aside class="card side auf-edit" id="aEdit"></aside>
        <section class="auf-stage" id="aStage"></section>
      </div></div>`;
    const $ = id => el.querySelector('#' + id);

    const wahl = () => { $('aWahl').innerHTML = state.auftraege.map(a => `<option value="${a.id}" ${a.id === state.aktAuftrag ? 'selected' : ''}>${esc(a.titel || 'Ohne Titel')}</option>`).join(''); };
    const editor = () => {
      const a = A();
      $('aEdit').innerHTML = `
        <label class="f">Aufgabe (Überschrift)<input data-f="titel" value="${esc(a.titel)}" placeholder="z.B. Bruchrechnen üben"></label>
        <label class="f">Schritte – einer pro Zeile<textarea data-f="schritte" rows="5" placeholder="1. Schritt …">${esc(a.schritte)}</textarea></label>
        <div class="f">Sozialform<div class="auf-pick">${Object.entries(SOZIAL).map(([k, s]) => `<button data-sozial="${k}" class="${a.sozial === k ? 'on' : ''}" title="${s.name}">${s.ic}<small>${s.name.replace('arbeit', '')}</small></button>`).join('')}</div></div>
        <div class="f">Lautstärke<div class="auf-pick">${Object.entries(LAUT).map(([k, s]) => `<button data-laut="${k}" class="${a.laut === k ? 'on' : ''}" title="${s.name}">${s.ic}<small>${s.name.split(' ')[0]}</small></button>`).join('')}</div></div>
        <div class="f">Material<div class="auf-mat">${MATERIAL.map(([k, ic, n]) => `<button data-mat="${k}" class="${a.material.includes(k) ? 'on' : ''}">${ic} ${n}</button>`).join('')}</div></div>
        <label class="f">Zeit<div class="row"><input type="number" class="num" data-f="minuten" min="0" max="180" value="${a.minuten}"> Minuten <span class="muted small">(0 = ohne Timer)</span></div></label>
        <label class="f">Timer-Darstellung<select data-f="timerStil"><option value="balken">▬ Balken (schlicht)</option>${TMODES.map(m => `<option value="${m.id}" ${a.timerStil === m.id ? 'selected' : ''}>${m.icon} ${m.name}</option>`).join('')}</select></label>
        <label class="f">Wenn du fertig bist …<textarea data-f="fertig" rows="2" placeholder="z.B. Zusatzaufgabe S. 43">${esc(a.fertig)}</textarea></label>`;
    };
    const zeit = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const grafik = a => a.minuten > 0 && a.timerStil && a.timerStil !== 'balken' && DRAW[a.timerStil];
    const tafel = () => {
      const a = A(), schritte = a.schritte.split('\n').map(x => x.trim()).filter(Boolean), so = SOZIAL[a.sozial], la = LAUT[a.laut];
      const mat = MATERIAL.filter(m => a.material.includes(m[0])), gr = grafik(a);
      const knoepfe = `<div class="auf-tk"><button class="btn primary" id="aStart">${T.laeuft ? '⏸ Pause' : T.rest != null && T.rest > 0 ? '▶ Weiter' : '▶ Start'}</button><button class="btn" id="aPlus">+1 min</button><button class="btn" id="aReset">↺</button></div>`;
      const inhalt = `
        <h2 class="auf-titel">${esc(a.titel || 'Arbeitsauftrag')}</h2>
        <div class="auf-badges">
          ${so ? `<div class="auf-badge"><span>${so.ic}</span><b>${so.name}</b></div>` : ''}
          ${la ? `<div class="auf-badge" style="--b:${la.farbe}"><span>${la.ic}</span><b>${la.name}</b></div>` : ''}
          ${a.minuten > 0 ? `<div class="auf-badge"><span>⏱️</span><b>${a.minuten} Minuten</b></div>` : ''}
        </div>
        ${schritte.length ? `<ol class="auf-schritte">${schritte.map((x, i) => `<li data-schritt="${i}" class="${T.erledigt[a.id + i] ? 'ok' : ''}"><span>${i + 1}</span>${esc(x.replace(/^\d+[.)]\s*/, ''))}</li>`).join('')}</ol>` : ''}
        ${mat.length ? `<div class="auf-material"><b>Du brauchst:</b>${mat.map(([, ic, n]) => `<span>${ic} ${n}</span>`).join('')}</div>` : ''}
        ${a.fertig ? `<div class="auf-fertig"><b>✅ Wenn du fertig bist:</b> ${esc(a.fertig)}</div>` : ''}`;
      const zeitTxt = zeit(T.rest ?? a.minuten * 60);
      $('aStage').innerHTML = gr
        ? `<div class="auf-board mit-grafik"><button class="auf-fs" id="aFs" title="Vollbild">⛶</button>
            <div class="auf-inhalt">${inhalt}</div>
            <div class="auf-grafik"><div class="auf-cvbox"><canvas id="aCv"></canvas>
              <div class="auf-zeit auf-zeit-gr" id="aZeit" ${['ring', 'fortschritt'].includes(a.timerStil) ? 'hidden' : ''}>${zeitTxt}</div></div>${knoepfe}</div></div>`
        : `<div class="auf-board"><button class="auf-fs" id="aFs" title="Vollbild">⛶</button>${inhalt}
          ${a.minuten > 0 ? `<div class="auf-timer">
            <div class="auf-zeit" id="aZeit">${zeitTxt}</div>
            <div class="auf-bar"><i id="aBar" style="width:${T.rest == null ? 100 : (T.rest / T.gesamt) * 100}%"></i></div>${knoepfe}
          </div>` : ''}</div>`;
    };
    /* Grafischer Timer (gleiche Bilder wie im Programm „Timer“) */
    const malen = () => {
      const cv = $('aCv'), a = A(), gr = grafik(a);
      if (cv && gr) {
        const r = cv.parentElement.getBoundingClientRect(), d = devicePixelRatio || 1;
        if (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
        const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
        const gesamt = T.rest == null ? a.minuten * 60 : T.gesamt, rest = T.laeuft ? Math.max(0, T.ende - Date.now() / 1000) : (T.rest ?? gesamt);
        const el2 = (gesamt - rest) * 1000;
        DRAW[a.timerStil](c, r.width, r.height, gesamt ? el2 / (gesamt * 1000) : 0, { T: gesamt * 1000, elapsed: el2, now: performance.now(), running: T.laeuft, seed: 7 });
        ziffernKontrast(cv, $('aZeit'));
      }
      mod._raf = requestAnimationFrame(malen);
    };
    cancelAnimationFrame(mod._raf); mod._raf = requestAnimationFrame(malen);
    const tick = () => {
      if (!T.laeuft) return;
      T.rest = Math.max(0, T.ende - Date.now() / 1000);
      const z = $('aZeit'), b = $('aBar');
      if (z) { z.textContent = zeit(Math.ceil(T.rest)); z.classList.toggle('knapp', T.rest <= 60); }
      if (b) { b.style.width = (T.rest / T.gesamt) * 100 + '%'; b.parentElement.classList.toggle('knapp', T.rest <= 60); }
      if (T.rest <= 0) { T.laeuft = false; T.rest = 0; sound.gong(); tafel(); $('aStage').querySelector('.auf-board').classList.add('aus'); }
    };
    clearInterval(mod._iv); mod._iv = setInterval(tick, 250);
    const alles = () => { wahl(); editor(); tafel(); };

    el.addEventListener('click', e => {
      const t = e.target, a = A();
      const so = t.closest('[data-sozial]'); if (so) { a.sozial = a.sozial === so.dataset.sozial ? '' : so.dataset.sozial; save(); editor(); tafel(); return; }
      const la = t.closest('[data-laut]'); if (la) { a.laut = a.laut === la.dataset.laut ? '' : la.dataset.laut; save(); editor(); tafel(); return; }
      const ma = t.closest('[data-mat]'); if (ma) { const k = ma.dataset.mat; a.material = a.material.includes(k) ? a.material.filter(x => x !== k) : [...a.material, k]; save(); editor(); tafel(); return; }
      const sc = t.closest('[data-schritt]'); if (sc) { const k = a.id + sc.dataset.schritt; T.erledigt[k] = !T.erledigt[k]; sc.classList.toggle('ok', T.erledigt[k]); if (T.erledigt[k]) sound.pop(); return; }
      if (t.id === 'aStart') {
        if (T.laeuft) { T.laeuft = false; }
        else { if (T.rest == null || T.rest <= 0) { T.gesamt = a.minuten * 60; T.rest = T.gesamt; } T.ende = Date.now() / 1000 + T.rest; T.laeuft = true; sound.tada(); }
        tafel(); return;
      }
      if (t.id === 'aPlus') { if (T.rest == null) { T.gesamt = a.minuten * 60; T.rest = T.gesamt; } T.rest += 60; T.gesamt += 60; if (T.laeuft) T.ende += 60; tafel(); return; }
      if (t.id === 'aReset') { T.laeuft = false; T.rest = null; tafel(); return; }
      if (t.closest('#aFs')) { const st = $('aStage'); document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.(); return; }
      if (t.id === 'aNeu') { const n = { id: uid(), titel: '', schritte: '', sozial: 'einzel', laut: 'leise', material: ['heft'], minuten: 10, fertig: '' }; state.auftraege.push(n); state.aktAuftrag = n.id; T.rest = null; T.laeuft = false; save(); alles(); $('aEdit').querySelector('input').focus(); return; }
      if (t.id === 'aKopie') { const n = { ...JSON.parse(JSON.stringify(a)), id: uid(), titel: a.titel + ' (Kopie)' }; state.auftraege.push(n); state.aktAuftrag = n.id; save(); alles(); return; }
      if (t.id === 'aDel') {
        if (state.auftraege.length === 1) return toast('Der letzte Auftrag bleibt – einfach überschreiben');
        if (!confirm(`„${a.titel}“ löschen?`)) return;
        state.auftraege = state.auftraege.filter(x => x !== a); state.aktAuftrag = state.auftraege[0].id; T.rest = null; T.laeuft = false; save(); alles();
      }
    });
    el.addEventListener('input', e => {
      const f = e.target.dataset.f; if (!f || f === 'timerStil') return;
      const a = A(); a[f] = f === 'minuten' ? Math.max(0, Math.min(180, +e.target.value || 0)) : e.target.value;
      if (f === 'minuten' && !T.laeuft) T.rest = null;
      save(); tafel(); if (f === 'titel') wahl();
    });
    el.addEventListener('change', e => { if (e.target.dataset.f === 'timerStil') { A().timerStil = e.target.value; save(); tafel(); return; } if (e.target.id === 'aWahl') { state.aktAuftrag = e.target.value; T.rest = null; T.laeuft = false; save(); editor(); tafel(); } });
    alles();
  },
  destroy() { clearInterval(this._iv); cancelAnimationFrame(this._raf); if (this._t) this._t.laeuft = false; },
});
