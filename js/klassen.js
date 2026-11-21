'use strict';
/* ===== Klassen, Fächer & Schüler:innen verwalten ===== */

/** Namensliste lesen: CSV (; , Tab), aus Excel kopiert oder „Vorname Nachname“ pro Zeile.
 *  Erkennt Kopfzeilen wie Nachname/Familienname/Zuname, Vorname, Niveau. */
function parseNamensliste(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !/^[;,\t]+$/.test(l));
  if (!lines.length) return [];
  const sep = [';', '\t', ','].find(s => lines[0].includes(s));
  if (!sep) return lines.map(l => { const p = l.split(/\s+/); return { vorname: p[0], nachname: p.slice(1).join(' '), niveau: '' }; });
  const split = l => l.split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
  const head = split(lines[0]).map(h => h.toLowerCase());
  const find = re => head.findIndex(h => re.test(h));
  let iN = find(/nachname|familienname|zuname/), iV = find(/vorname/), iNiv = find(/niveau|leistung/), iName = find(/^(name|schüler.*)$/);
  const hasHead = iN >= 0 || iV >= 0 || iName >= 0;
  if (!hasHead) { iN = 0; iV = 1; iNiv = 2; }
  return lines.slice(hasHead ? 1 : 0).map(l => {
    const c = split(l);
    if (iN < 0 && iV < 0 && iName >= 0) { // nur eine Spalte „Name“: „Nachname Vorname“
      const p = (c[iName] || '').split(/\s+/);
      return { nachname: p[0] || '', vorname: p.slice(1).join(' '), niveau: iNiv >= 0 ? c[iNiv] || '' : '' };
    }
    return { nachname: c[iN] || '', vorname: c[iV] || '', niveau: iNiv >= 0 ? c[iNiv] || '' : '' };
  }).filter(s => s.vorname || s.nachname);
}

/** Datei (CSV oder Excel) als Text einlesen */
async function leseListenDatei(file) {
  if (/\.xlsx?$/i.test(file.name)) {
    if (!window.XLSX) await new Promise((ok, err) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = ok; s.onerror = () => err(new Error('Excel-Leser konnte nicht geladen werden (Internet?)'));
      document.head.appendChild(s);
    });
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { FS: ';' });
  }
  const buf = await file.arrayBuffer();
  let t = new TextDecoder('utf-8').decode(buf);
  if (t.includes('�')) t = new TextDecoder('windows-1252').decode(buf); // ältere Excel-CSV
  return t;
}

/** Schüler:innen in Klasse übernehmen, doppelte Namen überspringen */
function schuelerUebernehmen(k, liste) {
  const key = s => (s.vorname + '|' + s.nachname).toLowerCase();
  const vorhanden = new Set(k.schueler.map(key));
  let n = 0;
  liste.forEach(s => { if (!vorhanden.has(key(s))) { k.schueler.push({ id: uid(), ...s }); vorhanden.add(key(s)); n++; } });
  return n;
}

registerModule({
  id: 'klassen', title: 'Klassen & Gruppen', icon: '🏫',
  render(el) {
    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('personen', '#34c759', 'Klassen & Gruppen')}</div>
      <div class="split">
        <aside class="card side">
          <h3>Meine Klassen</h3>
          <div id="kList" class="klist"></div>
          <form id="kNew" class="row"><input name="n" placeholder="z.B. 2B" required><button class="btn primary">+ Klasse</button></form>
          <h3>Gruppen <span class="muted small">(klassenübergreifend)</span></h3>
          <div id="gList" class="klist"></div>
          <form id="gNew" class="row"><input name="n" placeholder="z.B. Religion 3AB" required><button class="btn">+ Gruppe</button></form>
          <label class="btn full import">Klassenliste(n) importieren<input type="file" id="kImport" accept=".csv,.txt,.xlsx,.xls" multiple hidden></label>
          <p class="muted small">CSV- oder Excel-Datei. Der Dateiname wird zum Klassennamen (z.B. <code>2B.xlsx</code>). Mehrere Dateien auf einmal möglich.
          <a href="apps/Schuelerliste_Vorlage.csv" download>Vorlage herunterladen</a></p>
        </aside>
        <section class="card" id="kDetail"></section>
      </div></div>
      <datalist id="fachListe">${FACH_VORSCHLAEGE.map(f => `<option value="${f}">`).join('')}</datalist>`;
    const list = el.querySelector('#kList'), glist = el.querySelector('#gList'), det = el.querySelector('#kDetail');
    let teilF = null; // Fach, dessen Teilgruppe gerade bearbeitet wird

    const drawList = () => {
      const k = aktKlasse();
      const btn = x => `<button class="kbtn ${k && x.id === k.id ? 'on' : ''}" data-k="${x.id}">
        <b>${esc(x.name)}</b><span>${schuelerVon(x).length} Kinder · ${x.faecher.length} ${x.faecher.length === 1 ? 'Fach' : 'Fächer'}</span></button>`;
      list.innerHTML = state.klassen.filter(x => !istGruppe(x)).map(btn).join('') || '<p class="muted">Noch keine Klasse.</p>';
      glist.innerHTML = state.klassen.filter(istGruppe).map(btn).join('') || '<p class="muted small">z.B. Religion oder Leistungsgruppen aus mehreren Klassen.</p>';
    };
    const fachChips = k => k.faecher.map(f => `<span class="fach ${teilF === f.id ? 'on' : ''}">${esc(f.name)}${f.nur && f.nur.length ? ` <small>· ${f.nur.length} Kinder</small>` : ''}
      <button class="x" data-teil="${f.id}" title="Teilgruppe festlegen (nur bestimmte Kinder in diesem Fach)">👥</button><button class="x" data-delf="${f.id}" title="Fach entfernen">×</button></span>`).join('');
    const teilPanel = k => {
      const f = k.faecher.find(x => x.id === teilF); if (!f) return '';
      const alle = sortSchueler(schuelerVon(k)), nur = f.nur || [];
      return `<div class="teilpanel"><div class="row between"><b>Teilgruppe für ${esc(f.name)}</b>
        <div class="row"><button class="btn small" data-tgalle>Alle Kinder (keine Teilgruppe)</button><button class="btn small" data-tgzu>Fertig</button></div></div>
        <p class="muted small">Nur angehakte Kinder erscheinen in diesem Fach (Aufzeichnungen, Schularbeiten, Noten). Nichts angehakt = ganze ${istGruppe(k) ? 'Gruppe' : 'Klasse'}.</p>
        <div class="chkgrid">${alle.map(s => `<label class="chk small"><input type="checkbox" data-tg="${s.id}" ${nur.includes(s.id) ? 'checked' : ''}> ${esc(s.nachname)} ${esc(s.vorname)}</label>`).join('')}</div></div>`;
    };
    const drawGruppe = k => {
      const mitglieder = k.mitglieder || [];
      det.innerHTML = `
        <div class="row between">
          <input class="kname" id="kName" value="${esc(k.name)}" title="Gruppenname ändern">
          <button class="btn danger" id="kDel">Gruppe löschen</button>
        </div>
        <div class="faecher">
          <h3>Fächer dieser Gruppe</h3>
          <div class="row">${fachChips(k)}
            <form id="fNew" class="row"><input name="f" list="fachListe" placeholder="Fach hinzufügen …" required><button class="btn">+</button></form>
          </div>${teilPanel(k)}
        </div>
        <h3>Mitglieder (${schuelerVon(k).length})</h3>
        ${(k.schueler || []).length ? `<div class="gm-klasse"><b>Nur in dieser Gruppe</b> <span class="muted small">(ohne Stammklasse angelegt)</span>
          <table class="tbl"><tbody>${sortSchueler(k.schueler).map(s => `<tr data-s="${s.id}"><td class="left"><input data-f="nachname" value="${esc(s.nachname)}"></td>
            <td class="left"><input data-f="vorname" value="${esc(s.vorname)}"></td><td><button class="x" data-del="${s.id}" title="Entfernen">×</button></td></tr>`).join('')}</tbody></table></div>` : ''}
        <p class="muted small">Kinder aus Klassen anhaken:</p>
        ${state.klassen.filter(x => !istGruppe(x)).map(kl => `<details class="gm-klasse" ${kl.schueler.some(s => mitglieder.includes(s.id)) ? 'open' : ''}>
          <summary><b>${esc(kl.name)}</b> <span class="muted small">${kl.schueler.filter(s => mitglieder.includes(s.id)).length} / ${kl.schueler.length} gewählt</span>
            <button class="btn small" data-gmalle="${kl.id}">alle</button><button class="btn small" data-gmkeine="${kl.id}">keine</button></summary>
          <div class="chkgrid">${sortSchueler(kl.schueler).map(s => `<label class="chk small"><input type="checkbox" data-gm="${s.id}" ${mitglieder.includes(s.id) ? 'checked' : ''}> ${esc(s.nachname)} ${esc(s.vorname)}</label>`).join('')}</div>
        </details>`).join('') || '<p class="muted">Zuerst Klassen mit Schüler:innen anlegen.</p>'}`;
    };
    const zaehle = (k, f) => state.eintraege.filter(e => e.k === k.id && e.f === f.id).length + state.tests.filter(t => t.k === k.id && t.f === f.id).length;
    const drawDetail = () => {
      const k = aktKlasse();
      if (!k) { det.innerHTML = '<p class="muted">Links eine Klasse anlegen oder eine Liste importieren.</p>'; return; }
      if (istGruppe(k)) return drawGruppe(k);
      det.innerHTML = `
        <div class="row between">
          <input class="kname" id="kName" value="${esc(k.name)}" title="Klassenname ändern">
          <div class="row">
            <button class="btn" id="kExport">⬇ Liste als CSV</button>
            <button class="btn danger" id="kDel">Klasse löschen</button>
          </div>
        </div>
        <div class="faecher">
          <h3>Fächer, die ich in dieser Klasse unterrichte</h3>
          <div class="row">${fachChips(k)}
            <form id="fNew" class="row"><input name="f" list="fachListe" placeholder="Fach hinzufügen …" required><button class="btn">+</button></form>
          </div>${teilPanel(k)}
          <p class="muted small">Die Schülerliste gilt für alle Fächer – Mitarbeit, HÜ und Noten werden pro Fach getrennt geführt. Mit 👥 legst du eine Teilgruppe fest (z.B. Englisch Gruppe 1).</p>
        </div>
        <h3>Schüler:innen (${k.schueler.length})</h3>
        <table class="tbl"><thead><tr><th>#</th><th>Nachname</th><th>Vorname</th><th>Niveau</th><th></th></tr></thead>
        <tbody>${sortSchueler(k.schueler).map((s, i) => `<tr data-s="${s.id}">
          <td class="muted">${i + 1}</td>
          <td><input data-f="nachname" value="${esc(s.nachname)}"></td>
          <td><input data-f="vorname" value="${esc(s.vorname)}"></td>
          <td><input data-f="niveau" value="${esc(s.niveau || '')}" class="short" placeholder="–"></td>
          <td><button class="x" data-del="${s.id}" title="Entfernen">×</button></td></tr>`).join('')}</tbody></table>
        <form id="sNew" class="row addrow">
          <input name="v" placeholder="Vorname" required><input name="n" placeholder="Nachname"><button class="btn primary">+ Hinzufügen</button>
        </form>
        <details class="bulk">
          <summary>Namen in diese Klasse einfügen (aus Excel kopieren oder Datei)</summary>
          <p class="muted small">Eine Zeile pro Kind: <code>Vorname Nachname</code> – oder Spalten aus Excel kopieren (<code>Nachname · Vorname · Niveau</code>). Doppelte Namen werden übersprungen.</p>
          <textarea id="bulkIn" rows="6" placeholder="Anna Berger&#10;Ben Huber&#10;…"></textarea>
          <div class="row"><button class="btn primary" id="bulkGo">Übernehmen</button>
          <label class="btn">📂 CSV/Excel-Datei wählen<input type="file" id="csvIn" accept=".csv,.txt,.xlsx,.xls" hidden></label></div>
        </details>`;
    };
    const draw = () => { drawList(); drawDetail(); };
    draw();

    const inKlasse = liste => {
      const n = schuelerUebernehmen(aktKlasse(), liste);
      save(); draw(); toast(`${n} Schüler:innen hinzugefügt${liste.length > n ? ` (${liste.length - n} schon vorhanden)` : ''}`);
    };

    el.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      if (f.id === 'kNew') {
        const k = { id: uid(), name: f.n.value.trim(), schueler: [], faecher: [{ id: uid(), name: 'Mein Fach' }] };
        state.klassen.push(k); state.aktKlasse = k.id; state.aktFach = null; save(); draw();
        toast('Klasse angelegt – jetzt Fach und Namen eintragen'); f.reset();
      }
      if (f.id === 'gNew') {
        const g = { id: uid(), typ: 'gruppe', name: f.n.value.trim(), mitglieder: [], schueler: [], faecher: [{ id: uid(), name: 'Mein Fach' }] };
        state.klassen.push(g); state.aktKlasse = g.id; state.aktFach = null; save(); draw();
        toast('Gruppe angelegt – jetzt Mitglieder anhaken und Fach eintragen'); f.reset();
      }
      if (f.id === 'sNew') {
        aktKlasse().schueler.push({ id: uid(), vorname: f.v.value.trim(), nachname: f.n.value.trim(), niveau: '' });
        save(); draw(); det.querySelector('#sNew input').focus();
      }
      if (f.id === 'fNew') {
        const k = aktKlasse();
        // Platzhalter „Mein Fach“ ersetzen, solange er leer ist
        const ph = k.faecher.length === 1 && k.faecher[0].name === 'Mein Fach' && !zaehle(k, k.faecher[0]) ? k.faecher[0] : null;
        if (ph) ph.name = f.f.value.trim(); else fachHinzufuegen(k, f.f.value);
        save(); draw();
      }
    });
    el.addEventListener('click', e => {
      const kb = e.target.closest('[data-k]');
      if (kb) { state.aktKlasse = kb.dataset.k; state.aktFach = null; teilF = null; save(); draw(); }
      if (e.target.dataset.del) {
        const k = aktKlasse(), sid = e.target.dataset.del;
        k.schueler = k.schueler.filter(s => s.id !== sid);
        state.klassen.forEach(x => { // auch aus Gruppen und Teilgruppen entfernen
          if (x.mitglieder) x.mitglieder = x.mitglieder.filter(id => id !== sid);
          x.faecher.forEach(f => { if (f.nur) f.nur = f.nur.filter(id => id !== sid); });
        });
        save(); draw();
      }
      const tl = e.target.closest('[data-teil]');
      if (tl) { teilF = teilF === tl.dataset.teil ? null : tl.dataset.teil; drawDetail(); return; }
      if (e.target.closest('[data-tgzu]')) { teilF = null; drawDetail(); return; }
      if (e.target.closest('[data-tgalle]')) { const f = aktKlasse().faecher.find(x => x.id === teilF); delete f.nur; save(); draw(); return; }
      const ga = e.target.closest('[data-gmalle], [data-gmkeine]');
      if (ga) {
        e.preventDefault();
        const g = aktKlasse(), kl = klasse(ga.dataset.gmalle || ga.dataset.gmkeine), ids = kl.schueler.map(s => s.id);
        g.mitglieder = (g.mitglieder || []).filter(id => !ids.includes(id));
        if (ga.dataset.gmalle) g.mitglieder.push(...ids);
        save(); draw(); return;
      }
      if (e.target.dataset.delf) {
        const k = aktKlasse(), f = k.faecher.find(x => x.id === e.target.dataset.delf);
        if (k.faecher.length === 1) return toast('Mindestens ein Fach muss bleiben – einfach umbenennen über „+“.');
        const n = zaehle(k, f);
        if (n && !confirm(`Fach „${f.name}“ hat ${n} Einträge/Noten. Wirklich samt Aufzeichnungen löschen?`)) return;
        k.faecher = k.faecher.filter(x => x !== f);
        state.eintraege = state.eintraege.filter(x => !(x.k === k.id && x.f === f.id));
        state.tests = state.tests.filter(x => !(x.k === k.id && x.f === f.id));
        state.bewertungen = (state.bewertungen || []).filter(x => !(x.k === k.id && x.f === f.id));
        state.planung = (state.planung || []).filter(x => !(x.k === k.id && x.f === f.id));
        state.schularbeiten = (state.schularbeiten || []).filter(x => !(x.k === k.id && x.f === f.id));
        save(); draw();
      }
      if (e.target.id === 'kDel') {
        const k = aktKlasse();
        if (!confirm(`${istGruppe(k) ? 'Gruppe' : 'Klasse'} „${k.name}“ samt allen Aufzeichnungen in allen Fächern wirklich löschen?`)) return;
        state.schularbeiten = (state.schularbeiten || []).filter(x => x.k !== k.id);
        state.klassen = state.klassen.filter(x => x.id !== k.id);
        state.eintraege = state.eintraege.filter(x => x.k !== k.id);
        state.tests = state.tests.filter(x => x.k !== k.id);
        state.bewertungen = (state.bewertungen || []).filter(x => x.k !== k.id);
        state.planung = (state.planung || []).filter(x => x.k !== k.id);
        state.aktKlasse = null; save(); draw();
      }
      if (e.target.id === 'bulkGo') {
        const arr = parseNamensliste(det.querySelector('#bulkIn').value);
        arr.length ? inKlasse(arr) : toast('Keine Namen erkannt');
      }
      if (e.target.id === 'kExport') {
        const k = aktKlasse();
        download(`Klasse_${k.name}.csv`, 'Nachname;Vorname;Niveau\n' + sortSchueler(k.schueler).map(s => `${s.nachname};${s.vorname};${s.niveau || ''}`).join('\n'));
      }
    });
    el.addEventListener('change', async e => {
      if (e.target.dataset.tg) { // Teilgruppe eines Fachs
        const f = aktKlasse().faecher.find(x => x.id === teilF), sid = e.target.dataset.tg;
        f.nur = (f.nur || []).filter(id => id !== sid); if (e.target.checked) f.nur.push(sid);
        if (!f.nur.length) delete f.nur;
        save(); drawList(); return;
      }
      if (e.target.dataset.gm) { // Mitglied einer Gruppe
        const g = aktKlasse(), sid = e.target.dataset.gm;
        g.mitglieder = (g.mitglieder || []).filter(id => id !== sid); if (e.target.checked) g.mitglieder.push(sid);
        save(); drawList(); return;
      }
      if (e.target.id === 'kName') { aktKlasse().name = e.target.value.trim() || 'Klasse'; save(); drawList(); }
      if (e.target.dataset.f) {
        const s = aktKlasse().schueler.find(x => x.id === e.target.closest('tr').dataset.s);
        s[e.target.dataset.f] = e.target.value.trim(); save();
      }
      if (e.target.id === 'csvIn' && e.target.files[0]) {
        try { const arr = parseNamensliste(await leseListenDatei(e.target.files[0])); arr.length ? inKlasse(arr) : toast('Keine Namen gefunden'); }
        catch (err) { toast('⚠️ ' + err.message); }
      }
      if (e.target.id === 'kImport' && e.target.files.length) {
        const msgs = [];
        for (const file of e.target.files) {
          try {
            const arr = parseNamensliste(await leseListenDatei(file));
            if (!arr.length) { msgs.push(`${file.name}: keine Namen`); continue; }
            const name = file.name.replace(/\.[^.]+$/, '').replace(/^(klasse|klassenliste|schuelerliste)[ _-]*/i, '') || 'Neue Klasse';
            let k = state.klassen.find(x => x.name.toLowerCase() === name.toLowerCase());
            if (!k) { k = { id: uid(), name, schueler: [], faecher: [{ id: uid(), name: 'Mein Fach' }] }; state.klassen.push(k); }
            const n = schuelerUebernehmen(k, arr);
            state.aktKlasse = k.id; state.aktFach = null;
            msgs.push(`${k.name}: ${n} Kinder`);
          } catch (err) { msgs.push(`${file.name}: ${err.message}`); }
        }
        save(); draw(); toast('Importiert – ' + msgs.join(' · '));
        e.target.value = '';
      }
    });
  },
});
