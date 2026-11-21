'use strict';
/* ===== Bewertungsraster für Referate, Abgaben, Plakate … ===== */

const NOTEN_STANDARD = [89, 76, 63, 50]; // ab % → Note 1, 2, 3, 4 – darunter 5

state.raster ||= [];
state.bewertungen ||= [];
if (!state._rasterDemo) {
  const k = (name, max, beschreibung = '') => ({ id: uid(), name, max, beschreibung });
  state.raster.push(
    { id: uid(), name: 'Referat', grenzen: NOTEN_STANDARD.slice(), kriterien: [
      k('Inhalt & Richtigkeit', 6, 'Thema vollständig und sachlich richtig erklärt'), k('Aufbau & roter Faden', 4, 'Einleitung, Hauptteil, Schluss'),
      k('Freies Sprechen', 4, 'Blickkontakt, nicht abgelesen'), k('Sprache & Fachbegriffe', 3), k('Plakat / Präsentation', 3, 'übersichtlich, gut lesbar'), k('Zeit eingehalten', 2)] },
    { id: uid(), name: 'Plakat', grenzen: NOTEN_STANDARD.slice(), kriterien: [
      k('Inhalt', 6), k('Gestaltung & Übersicht', 4), k('Bilder & Grafiken', 3), k('Rechtschreibung', 3), k('Quellenangabe', 2)] },
    { id: uid(), name: 'Abgabe / Heftführung', grenzen: NOTEN_STANDARD.slice(), kriterien: [
      k('Vollständigkeit', 4), k('Sauberkeit & Ordnung', 3), k('Richtigkeit', 4), k('Pünktlich abgegeben', 2)] },
  );
  state._rasterDemo = true; save();
}

const rasterMax = r => r.kriterien.reduce((a, k) => a + (+k.max || 0), 0);
function rasterNote(r, punkte) {
  const max = rasterMax(r); if (!max) return null;
  const pz = punkte / max * 100, i = r.grenzen.findIndex(g => pz >= g);
  return { pz, note: i < 0 ? 5 : i + 1 };
}

registerModule({
  id: 'raster', title: 'Bewertungsraster', icon: '📋',
  render(el) {
    if (kursWahl(this, el, seitenTitel('raster', '#30b0c7', 'Bewertungsraster'))) return;
    const mod = this;
    mod._tab ||= 'bewerten';
    let bewId = null, sid = null;
    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('raster', '#30b0c7', 'Bewertungsraster')}<div id="rKs"></div></div>
      <nav class="tabs" id="rTabs"><button data-tab="bewerten">Bewerten</button><button data-tab="vorlagen">Raster-Vorlagen</button></nav>
      <div id="rBody"></div></div>`;
    const body = el.querySelector('#rBody');
    el.querySelector('#rKs').appendChild(kursPfad(mod, el));
    const raster = id => state.raster.find(r => r.id === id);
    const summe = (r, w) => r.kriterien.reduce((a, k) => a + (+w?.[k.id] || 0), 0);
    const bewertet = (r, w) => w && r.kriterien.some(k => w[k.id] !== undefined);

    const draw = () => {
      el.querySelectorAll('#rTabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === mod._tab));
      mod._tab === 'vorlagen' ? vorlagen() : bewerten();
    };

    /* ---------- Bewerten ---------- */
    const bewerten = () => {
      const k = aktKlasse(), f = aktFach(k);
      if (!k) { body.innerHTML = '<p class="muted">Zuerst eine Klasse anlegen.</p>'; return; }
      const liste = state.bewertungen.filter(x => x.k === k.id && x.f === f.id).sort((a, z) => z.d.localeCompare(a.d));
      let bw = liste.find(x => x.id === bewId) || liste[0];
      bewId = bw?.id;
      body.innerHTML = `<div class="toolbar">
          ${liste.length ? `<label>Bewertung <select id="rBew">${liste.map(x => `<option value="${x.id}" ${x.id === bewId ? 'selected' : ''}>${esc(x.titel)} (${fmtDate(x.d)})</option>`).join('')}</select></label>` : ''}
          <details class="rnew"><summary class="btn primary">+ Neue Bewertung</summary>
            <form id="rNew" class="card row"><input name="titel" placeholder="z.B. Referate Tiere" required>
            <select name="raster">${state.raster.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
            <input type="date" name="d" value="${todayISO()}"><button class="btn primary">Anlegen</button></form></details>
        </div><div id="rMain"></div>`;
      if (!bw) { body.querySelector('#rMain').innerHTML = '<p class="card muted">Noch keine Bewertung in dieser Klasse/diesem Fach. Oben „+ Neue Bewertung“ – z.B. für eine Referatsreihe.</p>'; return; }
      const r = raster(bw.raster);
      if (!r) { body.querySelector('#rMain').innerHTML = '<p class="muted">Das Raster dieser Bewertung wurde gelöscht.</p>'; return; }
      const kids = sortSchueler(kursSchueler(k, aktFach(k)));
      if (!kids.length) { body.querySelector("#rMain").innerHTML = '<p class="card">Diese Klasse hat noch keine Schüler:innen. <a href="#/klassen">→ Namen eintragen</a></p>'; return; }
      sid = kids.find(s => s.id === sid)?.id || kids.find(s => !bewertet(r, bw.werte[s.id]))?.id || kids[0]?.id;
      const s = kids.find(x => x.id === sid), w = (bw.werte[sid] ||= {});
      const pk = summe(r, w), max = rasterMax(r), nt = rasterNote(r, pk);
      body.querySelector('#rMain').innerHTML = `<div class="split rsplit">
        <aside class="card side">
          <div class="muted small">${esc(r.name)} · max. ${max} Punkte</div>
          <div class="rkids">${kids.map(x => { const wx = bw.werte[x.id], b = bewertet(r, wx), n = b && rasterNote(r, summe(r, wx));
            return `<button class="rkid ${x.id === sid ? 'on' : ''}" data-sid="${x.id}"><span>${esc(x.nachname)} ${esc(x.vorname)}</span>${b ? `<b class="grade gr${n.note}">${n.note}</b>` : '<i>–</i>'}</button>`; }).join('')}</div>
          <button class="btn full" id="rToA" title="Noten als Spalte in „Aufzeichnungen → SÜ, Tests & Noten“ eintragen">📒 Noten in Aufzeichnungen übernehmen</button>
          <button class="btn full" id="rPrintAll">🖨 Alle Rückmeldungen drucken</button>
          <button class="btn danger small" id="rDelBew">Bewertung löschen</button>
        </aside>
        <section class="card">
          <div class="row between"><h2 class="rname">${esc(s.vorname)} ${esc(s.nachname)}</h2>
            <div class="rsum">${bewertet(r, w) ? `<span>${pk} / ${max} P. · ${Math.round(nt.pz)} %</span><b class="grade gr${nt.note}">Note ${nt.note}</b>` : `<span class="muted">noch nicht bewertet</span>`}</div></div>
          <div class="rkrit">${r.kriterien.map(kr => `<div class="rk">
            <div class="rk-name"><b>${esc(kr.name)}</b>${kr.beschreibung ? `<div class="muted small">${esc(kr.beschreibung)}</div>` : ''}</div>
            <div class="rk-pts">${Array.from({ length: +kr.max + 1 }, (_, p) => `<button data-kr="${kr.id}" data-p="${p}" class="${+w[kr.id] === p && w[kr.id] !== undefined ? 'on' : ''}" style="--q:${p / kr.max}">${p}</button>`).join('')}</div>
          </div>`).join('')}</div>
          <label class="muted small">Kommentar / Rückmeldung</label>
          <textarea id="rKomm" rows="3" placeholder="Was war besonders gut? Was kann noch besser werden?">${esc(w._komm || '')}</textarea>
          <div class="row between"><button class="btn" id="rPrint1">🖨 Rückmeldung drucken</button><button class="btn primary" id="rNext">Nächstes Kind →</button></div>
        </section></div>`;
    };

    const rueckmeldung = (bw, r, s) => {
      const w = bw.werte[s.id] || {}, pk = summe(r, w), nt = rasterNote(r, pk);
      const k = aktKlasse(), f = aktFach();
      return `<section class="seite fit">${druckKopf(`${esc(s.vorname)} ${esc(s.nachname)}`, `${esc(bw.titel)} · ${esc(r.name)}`, `${esc(k.name)} · ${esc(f.name)}<br>${fmtDate(bw.d)}`)}
        <div class="block"><table><thead><tr><th>Kriterium</th><th style="width:110pt">Erreicht</th><th class="r" style="width:55pt">Punkte</th></tr></thead>
          <tbody>${r.kriterien.map(c => { const p = w[c.id]; return `<tr><td><b>${esc(c.name)}</b>${c.beschreibung ? `<div class="klein muted">${esc(c.beschreibung)}</div>` : ''}</td>
            <td><span class="balken"><i style="width:${p == null ? 0 : Math.round(100 * p / c.max)}%"></i></span></td><td class="r nw">${p ?? '–'} / ${c.max}</td></tr>`; }).join('')}</tbody>
          <tfoot><tr><td style="border-top:.9pt solid #1d1d1f"><b>Gesamt</b></td><td style="border-top:.9pt solid #1d1d1f" class="muted">${fmtZ(nt.pz, 0)} %</td><td class="r nw" style="border-top:.9pt solid #1d1d1f"><b>${pk} / ${rasterMax(r)}</b></td></tr></tfoot></table></div>
        <div class="kz" style="grid-template-columns:repeat(3,1fr);margin-bottom:12pt"><div><b>${pk} / ${rasterMax(r)}</b><span>Punkte</span></div><div><b>${fmtZ(nt.pz, 0)} %</b><span>Prozent</span></div><div><b>${notePill(nt.note)}</b><span>Note</span></div></div>
        ${w._komm ? `<div class="block"><h3>Rückmeldung</h3><div class="kommentar">${esc(w._komm).replace(/\n/g, '<br>')}</div></div>` : ''}
        <div class="unterschrift"><div>Lehrkraft</div><div>Kenntnisnahme Erziehungsberechtigte</div></div></section>`;
    };

    /* ---------- Vorlagen ---------- */
    const vorlagen = () => {
      body.innerHTML = `<div class="rvorl">${state.raster.map(r => `<div class="card" data-r="${r.id}">
        <div class="row between"><input class="kname" data-rn value="${esc(r.name)}"><span class="muted">max. ${rasterMax(r)} Punkte</span></div>
        <table class="tbl"><thead><tr><th class="left">Kriterium</th><th class="left">Beschreibung (optional)</th><th>max. Punkte</th><th></th></tr></thead><tbody>
        ${r.kriterien.map(k => `<tr data-k="${k.id}"><td><input data-kf="name" value="${esc(k.name)}"></td><td><input data-kf="beschreibung" value="${esc(k.beschreibung || '')}"></td>
          <td><input data-kf="max" type="number" min="1" max="20" class="num" value="${k.max}"></td><td><button class="x" data-delk>×</button></td></tr>`).join('')}</tbody></table>
        <div class="row between"><button class="btn small" data-addk>+ Kriterium</button>
          <div class="row small rgrenzen">Notenschlüssel ab %: ${r.grenzen.map((g, i) => `<label>${i + 1}: <input type="number" class="num" data-g="${i}" value="${g}"></label>`).join('')}</div>
          <div class="row"><button class="btn small" data-dupr>⧉ Kopieren</button><button class="btn small danger" data-delr>Löschen</button></div></div>
      </div>`).join('')}</div>
      <button class="btn primary" id="rAddR">+ Neues Raster</button>`;
    };

    el.addEventListener('click', e => {
      const t = e.target;
      const tab = t.closest('[data-tab]'); if (tab) { mod._tab = tab.dataset.tab; draw(); return; }
      if (mod._tab === 'bewerten') {
        const bw = state.bewertungen.find(x => x.id === bewId), r = bw && raster(bw.raster);
        const kid = t.closest('[data-sid]'); if (kid) { sid = kid.dataset.sid; draw(); return; }
        const pb = t.closest('[data-kr]');
        if (pb) { bw.werte[sid][pb.dataset.kr] = +pb.dataset.p; save(); tone(500 + 60 * +pb.dataset.p, 0.08, 'triangle', 0.1); draw(); return; }
        if (t.id === 'rNext') {
          const kids = sortSchueler(kursSchueler(aktKlasse(), aktFach())), i = kids.findIndex(s => s.id === sid);
          sid = (kids.slice(i + 1).find(s => !bewertet(r, bw.werte[s.id])) || kids[(i + 1) % kids.length]).id; draw();
        }
        if (t.id === 'rToA') {
          const k = aktKlasse(), f = aktFach(k);
          let test = state.tests.find(x => x.ausRaster === bw.id);
          if (!test) { test = { id: uid(), k: k.id, f: f.id, titel: bw.titel, typ: r.name === 'Referat' ? 'Referat' : 'Sonstiges', d: bw.d, noten: {}, ausRaster: bw.id }; state.tests.push(test); }
          let n = 0;
          Object.entries(bw.werte).forEach(([s, w]) => { if (bewertet(r, w)) { test.noten[s] = String(rasterNote(r, summe(r, w)).note); n++; } });
          save(); toast(`${n} Noten in „Aufzeichnungen“ eingetragen`);
        }
        if (t.id === 'rPrint1') druckFenster(bw.titel, rueckmeldung(bw, r, kursSchueler(aktKlasse(), aktFach()).find(s => s.id === sid)));
        if (t.id === 'rPrintAll') druckFenster(bw.titel, sortSchueler(kursSchueler(aktKlasse(), aktFach())).filter(s => bewertet(r, bw.werte[s.id])).map(s => rueckmeldung(bw, r, s)).join(''));
        if (t.id === 'rDelBew' && confirm(`Bewertung „${bw.titel}“ löschen?`)) { state.bewertungen = state.bewertungen.filter(x => x !== bw); bewId = null; save(); draw(); }
      } else {
        const card = t.closest('[data-r]'), r = card && raster(card.dataset.r);
        if (t.id === 'rAddR') { state.raster.push({ id: uid(), name: 'Neues Raster', grenzen: NOTEN_STANDARD.slice(), kriterien: [{ id: uid(), name: 'Kriterium 1', max: 4, beschreibung: '' }] }); save(); draw(); }
        if (!r) return;
        if (t.closest('[data-addk]')) { r.kriterien.push({ id: uid(), name: 'Neues Kriterium', max: 4, beschreibung: '' }); save(); draw(); }
        if (t.closest('[data-delk]')) { r.kriterien = r.kriterien.filter(k => k.id !== t.closest('[data-k]').dataset.k); save(); draw(); }
        if (t.closest('[data-dupr]')) { const c = JSON.parse(JSON.stringify(r)); c.id = uid(); c.name += ' (Kopie)'; state.raster.push(c); save(); draw(); }
        if (t.closest('[data-delr]') && confirm(`Raster „${r.name}“ löschen?`)) { state.raster = state.raster.filter(x => x !== r); save(); draw(); }
      }
    });
    el.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'rBew') { bewId = t.value; sid = null; draw(); }
      if (mod._tab === 'vorlagen') {
        const r = raster(t.closest('[data-r]')?.dataset.r); if (!r) return;
        if (t.dataset.rn !== undefined) r.name = t.value.trim() || 'Raster';
        if (t.dataset.kf) { const k = r.kriterien.find(x => x.id === t.closest('[data-k]').dataset.k); k[t.dataset.kf] = t.dataset.kf === 'max' ? Math.max(1, +t.value || 1) : t.value; }
        if (t.dataset.g !== undefined) r.grenzen[+t.dataset.g] = +t.value;
        save(); if (t.dataset.kf === 'max') draw();
      }
    });
    el.addEventListener('input', e => {
      if (e.target.id === 'rKomm') { const bw = state.bewertungen.find(x => x.id === bewId); bw.werte[sid]._komm = e.target.value; save(); }
    });
    el.addEventListener('submit', e => {
      if (e.target.id !== 'rNew') return;
      e.preventDefault();
      const f = e.target, k = aktKlasse();
      const bw = { id: uid(), k: k.id, f: aktFach(k).id, titel: f.titel.value.trim(), raster: f.raster.value, d: f.d.value || todayISO(), werte: {} };
      state.bewertungen.push(bw); bewId = bw.id; sid = null; save(); draw();
    });
    draw();
  },
});
