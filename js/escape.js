'use strict';
/* ===== Escape-Room: Rätselkette mit Schlössern und Countdown. Die Klasse löst die (ausgedruckten) Rätsel, die Lehrkraft tippt den genannten Code ein. ===== */

state.escapes ||= [{ id: uid(), titel: 'Das verschwundene Klassenbuch', minuten: 30,
  story: 'Das Klassenbuch ist verschwunden! Nur wer alle Schlösser knackt, findet es rechtzeitig vor der Konferenz.',
  raetsel: [
    { aufgabe: 'Wie viele Bundesländer hat Österreich? (Zahl)', code: '9', tipp: 'Wien ist auch eines davon.' },
    { aufgabe: 'Ordnet die Buchstaben: N A U O D – ein Fluss.', code: 'DONAU', tipp: 'Er fließt durch Wien.' },
    { aufgabe: 'Rechnet: (7 · 8) − 6', code: '50', tipp: 'Zuerst die Klammer!' },
  ] }];
const ESC = state.escapes;
const codeGleich = (a, b) => String(a).toLowerCase().replace(/\s+/g, '') === String(b).toLowerCase().replace(/\s+/g, '');

registerModule({
  id: 'escape', title: 'Escape-Room', icon: '🔐',
  render(el) {
    const mod = this;
    if (!ESC.some(x => x.id === state.aktEscape)) state.aktEscape = ESC[0]?.id;
    const R = () => ESC.find(x => x.id === state.aktEscape);
    el.innerHTML = `<div class="page esc">
      <div class="pagehead">${seitenTitel('schloss', '#000', 'Escape-Room')}
        <div class="row"><select id="eWahl" class="auf-wahl"></select><button class="btn" id="eNeu">+ Neu</button></div></div>
      <div id="eBody"></div></div>`;
    const $ = id => el.querySelector('#' + id), body = $('eBody');
    const wahl = () => { $('eWahl').innerHTML = ESC.map(x => `<option value="${x.id}" ${x.id === state.aktEscape ? 'selected' : ''}>${esc(x.titel)} (${x.raetsel.length} Schlösser)</option>`).join(''); };
    const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    /* ----- Bauen ----- */
    const editor = () => {
      const r = R();
      body.innerHTML = `<div class="esc-edit">
        <section class="card">
          <div class="row"><label class="f grow">Titel <input data-e="titel" value="${esc(r.titel)}"></label><label class="f">Zeit (min) <input type="number" class="num" data-e="minuten" min="5" max="120" value="${r.minuten}"></label></div>
          <label class="f">Geschichte (wird am Anfang gezeigt) <textarea data-e="story" rows="2">${esc(r.story)}</textarea></label>
        </section>
        ${r.raetsel.map((x, i) => `<section class="card esc-r" data-i="${i}"><div class="esc-nr">🔒 ${i + 1}</div>
          <label class="f grow">Rätsel / Aufgabe <textarea data-r="aufgabe" rows="2">${esc(x.aufgabe)}</textarea></label>
          <label class="f">Lösungscode <input data-r="code" value="${esc(x.code)}" placeholder="z.B. 4271 oder DONAU"></label>
          <label class="f grow">Tipp (optional) <input data-r="tipp" value="${esc(x.tipp || '')}"></label>
          <div class="esc-r-tk"><button class="x" data-rauf="${i}" title="nach oben" ${i ? '' : 'disabled'}>↑</button><button class="x" data-rweg="${i}" title="löschen">×</button></div></section>`).join('')}
        <div class="row"><button class="btn" id="eAdd">+ Schloss</button><button class="btn" id="eDruck">🖨 Rätselkarten drucken</button><button class="btn primary big" id="eStart">▶ Escape-Room starten</button><button class="btn danger" id="eDel">Löschen</button></div>
        <p class="muted small">So läuft es: Die Rätsel liegen ausgedruckt in der Klasse (oder werden am Beamer gezeigt). Hat die Klasse einen Code, sagt sie ihn – du tippst ihn ein. Tipps kosten 1 Minute.</p></div>`;
    };

    /* ----- Spielen ----- */
    const spiel = () => {
      const r = R(), g = mod._g, rest = Math.max(0, g.ende - Date.now() / 1000), x = r.raetsel[g.i];
      body.innerHTML = `<section class="esc-stage ${g.fertig ? 'fertig' : ''} ${g.vorbei ? 'vorbei' : ''}" id="eStage"><button class="auf-fs" id="eFs" title="Vollbild">⛶</button>
        <div class="esc-kopf"><h2>${esc(r.titel)}</h2><div class="esc-zeit ${rest < 120 && !g.fertig ? 'knapp' : ''}" id="eZeit">${mmss(g.fertig ? g.fertig : rest)}</div></div>
        <div class="esc-schloesser">${r.raetsel.map((_, i) => `<span class="${i < g.i ? 'offen' : i === g.i ? 'jetzt' : ''}">${i < g.i ? '🔓' : '🔒'}<b>${i + 1}</b></span>`).join('')}</div>
        ${g.vorbei ? `<div class="esc-mitte"><div class="pb-big">⏰</div><h2>Die Zeit ist abgelaufen!</h2><p>${g.i} von ${r.raetsel.length} Schlössern geknackt.</p><button class="btn" id="eZurueck">Zurück</button></div>`
        : g.fertig != null ? `<div class="esc-mitte"><div class="pb-big">🏆</div><h2>Geschafft!</h2><p>Alle ${r.raetsel.length} Schlösser in ${mmss(r.minuten * 60 - g.fertig)} geknackt${g.tipps ? ` (${g.tipps} Tipp${g.tipps > 1 ? 's' : ''})` : ''}.</p><button class="btn" id="eZurueck">Zurück</button></div>`
        : !g.los ? `<div class="esc-mitte"><p class="esc-story">${esc(r.story)}</p><button class="btn primary huge" id="eLos">🔓 Los geht’s!</button></div>`
        : `<div class="esc-mitte"><div class="esc-schloss" id="eSchloss">🔒</div><h3>Schloss ${g.i + 1}</h3>
            ${g.zeigen ? `<p class="esc-aufgabe">${esc(x.aufgabe)}</p>` : '<button class="linkbtn" id="eZeigen">Aufgabe am Beamer zeigen</button>'}
            <form id="eCodeF" class="esc-code"><input id="eCode" placeholder="Code" autocomplete="off"><button class="btn primary big">Öffnen</button></form>
            ${g.tipp === g.i ? `<p class="esc-tipp">💡 ${esc(x.tipp || 'Kein Tipp vorhanden.')}</p>` : x.tipp ? '<button class="btn" id="eTipp">💡 Tipp (−1 Minute)</button>' : ''}</div>`}
        <div class="row center esc-unten"><button class="linkbtn" id="eAbbr">Beenden</button></div></section>`;
      const c = $('eCode'); if (c) c.focus();
    };
    const tick = () => {
      const g = mod._g; if (!g || !g.los || g.fertig != null || g.vorbei) return;
      const rest = g.ende - Date.now() / 1000, z = $('eZeit');
      if (z) { z.textContent = mmss(Math.max(0, rest)); z.classList.toggle('knapp', rest < 120); }
      if (rest <= 0) { g.vorbei = true; sweep(400, 80, 1.2, 'sawtooth', 0.2); spiel(); }
    };
    clearInterval(mod._iv); mod._iv = setInterval(tick, 250);

    const druck = () => {
      const r = R();
      druckFenster(r.titel, `<style>.esc-karten{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.esc-karte{border:1.2pt dashed #1d1d1f;border-radius:4mm;padding:6mm;min-height:60mm;break-inside:avoid;display:flex;flex-direction:column;gap:4mm}
        .esc-karte h2{margin:0;font-size:14pt}.esc-karte p{font-size:12pt;flex:1;margin:0}.esc-feld{display:flex;gap:2mm}.esc-feld span{width:9mm;height:11mm;border:1pt solid #1d1d1f;border-radius:1.5mm}</style>`
        + druckKopf(esc(r.titel), esc(r.story), `Escape-Room<br>${r.minuten} Minuten`)
        + `<div class="esc-karten">${r.raetsel.map((x, i) => `<div class="esc-karte"><h2>🔒 Schloss ${i + 1}</h2><p>${esc(x.aufgabe).replace(/\n/g, '<br>')}</p>
          <div class="esc-feld">${'<span></span>'.repeat(Math.max(3, String(x.code).length))}</div></div>`).join('')}</div>`);
    };

    el.addEventListener('click', e => {
      const t = e.target, r = R(), g = mod._g;
      if (t.closest('#eFs')) { const st = $('eStage'); document.fullscreenElement ? document.exitFullscreen() : st?.requestFullscreen?.(); return; }
      if (t.id === 'eNeu') { const n = { id: uid(), titel: 'Neuer Escape-Room', minuten: 30, story: '', raetsel: [{ aufgabe: '', code: '', tipp: '' }] }; ESC.push(n); state.aktEscape = n.id; save(); wahl(); editor(); return; }
      if (t.id === 'eAdd') { r.raetsel.push({ aufgabe: '', code: '', tipp: '' }); save(); editor(); return; }
      const w = t.closest('[data-rweg]'); if (w) { if (r.raetsel.length > 1) { r.raetsel.splice(+w.dataset.rweg, 1); save(); editor(); } return; }
      const u = t.closest('[data-rauf]'); if (u) { const i = +u.dataset.rauf; [r.raetsel[i - 1], r.raetsel[i]] = [r.raetsel[i], r.raetsel[i - 1]]; save(); editor(); return; }
      if (t.id === 'eDruck') { druck(); return; }
      if (t.id === 'eDel') { if (ESC.length < 2) return toast('Der letzte Escape-Room bleibt – einfach überschreiben'); if (!confirm(`„${r.titel}“ löschen?`)) return; ESC.splice(ESC.indexOf(r), 1); state.aktEscape = ESC[0].id; save(); wahl(); editor(); return; }
      if (t.id === 'eStart') {
        const leer = r.raetsel.findIndex(x => !String(x.code).trim()); if (leer >= 0) return toast(`Schloss ${leer + 1} hat noch keinen Lösungscode`);
        mod._g = { i: 0, los: false, ende: 0, tipps: 0, tipp: -1, zeigen: false, fertig: null, vorbei: false }; spiel(); return;
      }
      if (t.id === 'eLos') { g.los = true; g.ende = Date.now() / 1000 + r.minuten * 60; sound.tada(); spiel(); return; }
      if (t.id === 'eZeigen') { g.zeigen = true; spiel(); return; }
      if (t.id === 'eTipp') { g.tipp = g.i; g.tipps++; g.ende -= 60; tone(300, 0.3, 'triangle', 0.15); spiel(); return; }
      if (t.id === 'eAbbr' || t.id === 'eZurueck') { if (t.id === 'eAbbr' && g?.los && g.fertig == null && !g.vorbei && !confirm('Escape-Room beenden?')) return; mod._g = null; editor(); }
    });
    el.addEventListener('submit', e => {
      if (e.target.id !== 'eCodeF') return; e.preventDefault();
      const r = R(), g = mod._g, eingabe = $('eCode').value;
      if (!eingabe.trim()) return;
      if (codeGleich(eingabe, r.raetsel[g.i].code)) {
        $('eSchloss').textContent = '🔓'; $('eSchloss').classList.add('auf'); sound.tada();
        setTimeout(() => {
          g.i++; g.zeigen = false;
          if (g.i >= r.raetsel.length) { g.fertig = Math.max(0, g.ende - Date.now() / 1000); winSound(); confetti(200); }
          spiel();
        }, 900);
      } else { const s = $('eSchloss'); s.classList.remove('wackel'); void s.offsetWidth; s.classList.add('wackel'); tone(140, 0.35, 'sawtooth', 0.15); $('eCode').select(); }
    });
    el.addEventListener('input', e => {
      const r = R(), t = e.target;
      if (t.dataset.e) { r[t.dataset.e] = t.dataset.e === 'minuten' ? Math.max(5, Math.min(120, +t.value || 30)) : t.value; save(); if (t.dataset.e === 'titel') wahl(); }
      if (t.dataset.r) { r.raetsel[+t.closest('[data-i]').dataset.i][t.dataset.r] = t.value; save(); }
    });
    el.addEventListener('change', e => { if (e.target.id === 'eWahl') { state.aktEscape = e.target.value; mod._g = null; save(); editor(); } });
    wahl(); mod._g ? spiel() : editor();
  },
  destroy() { clearInterval(this._iv); },
});
