'use strict';
/* ===== Lehrer-Aufzeichnungen: Mitarbeit, HÜ, Material, Notizen, SÜ/Tests ===== */

const ETYPEN = [
  { t: 'ma+', label: 'Mitarbeit +', btn: '＋', cls: 'pos' },
  { t: 'ma-', label: 'Mitarbeit −', btn: '−', cls: 'neg' },
  { t: 'hue-', label: 'HÜ fehlt', btn: 'HÜ ✗', cls: 'warn' },
  { t: 'mat-', label: 'Material fehlt', btn: 'Mat ✗', cls: 'warn2' },
  { t: 'notiz', label: 'Notiz', btn: '📝', cls: 'note' },
];
const ET = Object.fromEntries(ETYPEN.map(e => [e.t, e]));
const LTYPEN = ['SÜ', 'Test', 'HÜ', 'Referat', 'Mitarbeit', 'Sonstiges'];

function notenSchnitt(vals) {
  const n = vals.map(v => String(v ?? '').replace(',', '.')).filter(v => /^[1-5](\.\d+)?$/.test(v)).map(Number);
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}
const fmtAvg = a => a == null ? '–' : a.toFixed(1).replace('.', ',');
/* Notiz-Eingabe am iPad: großes Feld statt des kleinen Browser-Dialogs */
function notizBlatt(wer, fertig) {
  const d = document.createElement('div'); d.className = 'nb-dlg';
  d.innerHTML = `<form class="card nb-box"><b>📝 Notiz zu ${esc(wer)}</b><textarea rows="4" placeholder="z.B. sehr guter Beitrag zum Gedicht"></textarea>
    <div class="row"><button type="button" class="btn" data-nb="ab">Abbrechen</button><button class="btn primary">Speichern</button></div></form>`;
  document.body.appendChild(d);
  const ta = d.querySelector('textarea'), zu = v => { d.remove(); fertig(v); };
  setTimeout(() => ta.focus(), 50);
  d.querySelector('form').onsubmit = e => { e.preventDefault(); zu(ta.value.trim()); };
  d.onclick = e => { if (e.target === d || e.target.dataset.nb) zu(''); };
}
const gradeCls = v => { const n = parseFloat(String(v).replace(',', '.')); return n >= 1 && n <= 5 ? 'gr' + Math.round(n) : ''; };

registerModule({
  id: 'aufzeichnungen', title: 'Aufzeichnungen', icon: '📒',
  render(el) {
    if (kursWahl(this, el, seitenTitel('heft', '#007aff', 'Aufzeichnungen'))) return;
    const mod = this;
    mod._tab ||= 'schnell';
    mod._sem ||= aktSemester();
    let datum = todayISO(), undo = [], detailS = null;

    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('heft', '#007aff', 'Aufzeichnungen')}<div id="aKs"></div></div>
      <nav class="tabs" id="aTabs">
        <button data-tab="schnell">Schnell-Eintrag</button>
        <button data-tab="tests">SÜ, Tests & Noten</button>
        <button data-tab="uebersicht">Kursübersicht</button>
      </nav>
      <div id="aBody"></div></div>`;
    const body = el.querySelector('#aBody');
    el.querySelector('#aKs').appendChild(kursPfad(mod, el));

    const draw = () => {
      el.querySelectorAll('#aTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === mod._tab));
      const k = aktKlasse();
      if (!k) { body.innerHTML = '<p class="muted">Noch keine Klasse vorhanden.</p>'; return; }
      if (!kursSchueler(k, aktFach(k)).length) { body.innerHTML = '<p class="card">Diese Klasse hat noch keine Schüler:innen. <a href="#/klassen">→ Namen eintragen</a></p>'; return; }
      ({ schnell: drawSchnell, tests: drawTests, uebersicht: drawUebersicht })[mod._tab](k);
    };

    /* --- Schnell-Eintrag --- */
    const card = (k, s) => {
      const mine = state.eintraege.filter(e => e.k === k.id && e.f === aktFach(k).id && e.s === s.id);
      const heute = mine.filter(e => e.d === datum);
      const c = t => mine.filter(e => e.t === t).length;
      return `<div class="scard" data-s="${s.id}">
        <div class="sname">${esc(s.vorname)} <span>${esc(s.nachname)}</span></div>
        <div class="chips">${heute.map(e => `<button class="chip ${ET[e.t].cls}" data-delE="${e.id}" title="${esc(ET[e.t].label + (e.n ? ': ' + e.n : ''))} – klicken zum Löschen">${ET[e.t].btn}${e.n ? ' ' + esc(e.n.length > 16 ? e.n.slice(0, 15) + '…' : e.n) : ''}</button>`).join('') || '<span class="muted small">–</span>'}</div>
        <div class="sbtns">${ETYPEN.map(e => `<button class="eb ${e.cls}" data-add="${e.t}" title="${e.label}">${e.btn}</button>`).join('')}</div>
        <div class="stot"><b class="pos">+${c('ma+')}</b> <b class="neg">−${c('ma-')}</b> · HÜ✗ ${c('hue-')} · Mat✗ ${c('mat-')}</div>
      </div>`;
    };
    const drawSchnell = k => {
      body.innerHTML = `<div class="toolbar">
          <label>Datum <input type="date" id="aDat" value="${datum}"></label>
          <button class="btn" id="aUndo" ${undo.length ? '' : 'disabled'}>↶ Rückgängig</button>
          <span class="muted small">Tipp: Einen Eintrag (farbiges Kästchen) ${TOUCH ? 'antippen' : 'anklicken'}, um ihn zu löschen.</span>
        </div>
        <div class="scards">${sortSchueler(kursSchueler(k, aktFach(k))).map(s => card(k, s)).join('')}</div>`;
    };
    const redrawCard = sid => {
      const k = aktKlasse(), s = kursSchueler(k, aktFach(k)).find(x => x.id === sid);
      body.querySelector(`.scard[data-s="${sid}"]`).outerHTML = card(k, s);
      const u = body.querySelector('#aUndo'); if (u) u.disabled = !undo.length;
    };

    /* --- Tests --- */
    const drawTests = k => {
      const tests = state.tests.filter(t => t.k === k.id && t.f === aktFach(k).id).sort((a, b) => a.d.localeCompare(b.d));
      const list = sortSchueler(kursSchueler(k, aktFach(k)));
      body.innerHTML = `<div class="toolbar">
        <form id="tNew" class="row">
          <input name="titel" placeholder="Titel, z.B. SÜ Bruchrechnen" required>
          <select name="typ">${LTYPEN.map(t => `<option>${t}</option>`).join('')}</select>
          <input type="date" name="d" value="${todayISO()}">
          <button class="btn primary">+ Neue Spalte</button>
        </form></div>
        ${tests.length ? `<div class="scroll card nopad"><table class="tbl grades">
          <thead><tr><th class="left">Name</th>${tests.map(t => `<th><span class="ttyp">${esc(t.typ)}</span><div class="ttl">${esc(t.titel)}</div><div class="muted small">${fmtDate(t.d)}</div><button class="x" data-delT="${t.id}" title="Spalte löschen">×</button></th>`).join('')}<th>Ø</th></tr></thead>
          <tbody>${list.map((s, r) => `<tr><td class="left nowrap">${esc(s.nachname)} ${esc(s.vorname)}</td>
            ${tests.map((t, c) => `<td><input class="gi ${gradeCls(t.noten[s.id] || '')}" data-t="${t.id}" data-s="${s.id}" data-r="${r}" data-c="${c}" value="${esc(t.noten[s.id] || '')}" maxlength="4" enterkeyhint="next" autocomplete="off"></td>`).join('')}
            <td class="avg" data-avg="${s.id}">${fmtAvg(notenSchnitt(tests.map(t => t.noten[s.id])))}</td></tr>`).join('')}
            <tr class="foot"><td class="left">Klassen-Ø</td>${tests.map(t => `<td data-tavg="${t.id}">${fmtAvg(notenSchnitt(Object.values(t.noten)))}</td>`).join('')}<td></td></tr>
          </tbody></table></div>
          <p class="muted small">Noten 1–5 eingeben (auch +, ~, − möglich). Enter springt zur nächsten Zeile. Der Ø zählt nur Zahlen.</p>`
        : '<p class="card muted">Noch keine Leistungsfeststellung. Oben eine neue Spalte anlegen (z.B. „SÜ Grammatik“).</p>'}`;
    };

    /* --- Übersicht --- */
    const stats = (k, s) => {
      const mine = state.eintraege.filter(e => e.k === k.id && e.f === aktFach(k).id && e.s === s.id);
      const c = t => mine.filter(e => e.t === t).length;
      const tests = state.tests.filter(t => t.k === k.id && t.f === aktFach(k).id);
      const by = typ => notenSchnitt(tests.filter(t => t.typ === typ).map(t => t.noten[s.id]));
      return { ma: c('ma+'), mam: c('ma-'), hue: c('hue-'), mat: c('mat-'), notiz: c('notiz'), su: by('SÜ'), test: by('Test'), all: notenSchnitt(tests.map(t => t.noten[s.id])) };
    };
    /* Kursübersicht: alle Kinder mit Schularbeiten, Tests, Mitarbeit, HÜ und Notenvorschlag – je Semester */
    const kursZeilen = k => {
      const f = aktFach(k), sem = mod._sem, sas = saVonKurs(k, f, sem);
      const zeilen = sortSchueler(kursSchueler(k, f)).map(s => {
        const v = notenVorschlag(k, f, s.id, sem);
        return { s, v, sa: sas.map(x => saErgebnis(x, s.id)), ampel: warnung(v), sn: semNoteRoh(k, f, s.id) };
      });
      const sortWert = { name: z => z.s.nachname + ' ' + z.s.vorname, vorschlag: z => z.v.wert ?? 9, test: z => z.v.teile.test ?? 9, hue: z => -z.v.L.hue, ma: z => z.v.L.minus - z.v.L.plus,
        ampel: z => ({ rot: 0, gelb: 1, '': 2 })[z.ampel], semnote: z => z.v.semNote ?? 9, sem2: z => z.v.wert2 ?? 9 };
      sas.forEach((x, i) => { sortWert['sa' + i] = z => z.sa[i]?.note ?? 9; });
      const key = sortWert[mod._sort] ? mod._sort : 'name';
      zeilen.sort((a, b) => { const x = sortWert[key](a), y = sortWert[key](b); return x < y ? -1 : x > y ? 1 : 0; });
      return { f, sas, zeilen, key, sem };
    };
    /** Zelle „Semesternote“: am Bildschirm ein Eingabefeld (Vorschlag als Platzhalter), im Druck die Note */
    const semZelle = (z, druck, r) => {
      const vorschlag = z.v.sem === 1 ? z.v.wert : z.v.wert1;
      if (druck) return z.sn ? notePill(z.sn) : vorschlag != null ? `<span class="muted">≈ ${fmtZ(vorschlag, 1)}</span>` : '–';
      return `<input class="sn ${gradeCls(z.sn)}" data-sn="${z.s.id}" data-r="${r}" enterkeyhint="next" autocomplete="off" value="${esc(z.sn)}" maxlength="3" placeholder="${vorschlag == null ? '' : '≈' + fmtZ(vorschlag, 1)}" title="Semesternote festlegen (leer = Vorschlag wird verwendet)">`;
    };
    const kursTabelle = (k, druck) => {
      const { sas, zeilen, key, sem } = kursZeilen(k);
      const th = (k2, txt, cls = '') => druck ? `<th class="${cls}">${txt}</th>` : `<th class="sortbar ${cls} ${key === k2 ? 'on' : ''}" data-sort="${k2}">${txt}</th>`;
      const nLeist = sas.length + 4;
      const gruppen = sem === 1
        ? `<tr class="semkopf"><th colspan="2"></th><th colspan="${nLeist + 1}" class="g1">1. Semester</th><th class="gs">Semesternote</th></tr>`
        : `<tr class="semkopf"><th colspan="2"></th><th class="gs">1. Semester</th><th colspan="${nLeist + 1}" class="g2">2. Semester</th><th class="gj">Jahr</th></tr>`;
      const leist = z => `${z.sa.map(e => `<td class="${sem === 1 ? 'c1' : 'c2'}">${e ? `<span class="grade gr${e.note}" title="${fmtZ(e.punkte)}/${fmtZ(e.max)} P. · ${fmtZ(e.pct, 1)} %">${e.note}</span>` : '–'}</td>`).join('')}
          <td class="${sem === 1 ? 'c1' : 'c2'}">${z.v.teile.test == null ? '–' : fmtZ(z.v.teile.test)}</td>
          <td class="${sem === 1 ? 'c1' : 'c2'}"><span class="pos">+${z.v.L.plus}</span> <span class="neg">−${z.v.L.minus}</span></td><td class="${sem === 1 ? 'c1' : 'c2'}">${z.v.L.hue || ''}</td><td class="${sem === 1 ? 'c1' : 'c2'}">${z.v.L.mat || ''}</td>`;
      const sasTh = sas.map((x, i) => th('sa' + i, `${esc(x.nr || i + 1)}. SA`, sem === 1 ? 'c1' : 'c2')).join('');
      const c = sem === 1 ? 'c1' : 'c2';
      return `<table class="tbl overview kurs sem${sem}"><thead>${gruppen}<tr>
          ${th('ampel', '')}${th('name', 'Name')}
          ${sem === 2 ? th('semnote', 'Semester&shy;note', 'cs') : ''}
          ${sasTh || `<th class="${c} muted">SA</th>`}${th('test', 'Ø Tests/Referate', c)}${th('ma', 'Mitarbeit', c)}${th('hue', 'HÜ fehlt', c)}<th class="${c}">Mat.</th>
          ${sem === 1 ? th('vorschlag', 'Vorschlag', c) + th('semnote', 'Semester&shy;note', 'cs') : th('sem2', 'Ø 2. Sem.', c) + th('vorschlag', 'Jahres&shy;vorschlag', 'cj')}</tr></thead>
        <tbody>${zeilen.map((z, r) => `<tr class="click ${detailS === z.s.id ? 'sel' : ''}" data-row="${z.s.id}">
          <td><span class="ampel ${z.ampel}">${druck ? { rot: '●', gelb: '○', '': '' }[z.ampel] : ''}</span></td>
          <td class="left nowrap">${druck ? `<b>${esc(z.s.nachname)}</b> ${esc(z.s.vorname)}` : `<a href="#/akte" data-akte="${z.s.id}"><b>${esc(z.s.nachname)}</b> ${esc(z.s.vorname)}</a>`}</td>
          ${sem === 2 ? `<td class="cs">${semZelle(z, druck, r)}</td>` : ''}
          ${sas.length ? '' : `<td class="${c} muted">–</td>`}${leist(z)}
          ${sem === 1 ? `<td class="c1"><b>${vorschlagText(z.v.wert)}</b></td><td class="cs">${semZelle(z, druck, r)}</td>`
            : `<td class="c2">${z.v.wert2 == null ? '–' : fmtZ(z.v.wert2, 1)}</td><td class="cj" data-jahr="${z.s.id}"><b>${vorschlagText(z.v.wert)}</b></td>`}</tr>`).join('')}</tbody></table>`;
    };
    const drawUebersicht = k => {
      const f = aktFach(k), w = { ...GEWICHTUNG_STANDARD, ...(f.gewichtung || {}) };
      const sem2 = sem2Beginn();
      body.innerHTML = `<div class="toolbar">
          <div class="seg semwahl"><button data-sem="1" class="${mod._sem === 1 ? 'on' : ''}">1. Semester</button><button data-sem="2" class="${mod._sem === 2 ? 'on' : ''}">2. Semester <small>ab ${fmtDate(sem2).slice(0, -4)}</small></button></div>
          <button class="btn" id="aCsv">Als Excel/CSV exportieren</button><button class="btn" id="aDruck">Drucken / PDF</button>
          ${mod._sem === 1 ? '<button class="btn" id="aSemUeb" title="Leere Felder mit dem gerundeten Vorschlag füllen">Vorschläge als Semesternote übernehmen</button>' : ''}
          <details class="gewicht"><summary class="btn">Gewichtung für Notenvorschlag</summary><div class="card row">
            ${[['sa', 'Schularbeiten'], ['test', 'Tests/SÜ/Referate'], ['ma', 'Mitarbeit'], ['hue', 'Hausübung']].map(([k2, n]) => `<label class="f">${n} <span><input class="num" type="number" min="0" max="100" data-gew="${k2}" value="${w[k2]}"> %</span></label>`).join('')}
            <label class="f">Semesternote im 2. Sem. <span><input class="num" type="number" min="0" max="100" data-semgew value="${semGewicht(f)}"> %</span></label>
            <span class="muted small">Gilt für ${esc(k.name)} · ${esc(f.name)}. Nur vorhandene Bereiche werden gezählt. Im 2. Semester zählt die Semesternote mit dem eingestellten Anteil, der Rest sind die Leistungen des 2. Semesters.</span></div></details>
          <span class="muted small">Spaltenkopf = sortieren · Name = Schülerakte · Zeile = Einträge</span></div>
        <div class="scroll card nopad">${kursTabelle(k)}</div>
        <p class="muted small"><span class="ampel rot"></span> Notenvorschlag ab 4,3 oder 4+ fehlende HÜs · <span class="ampel gelb"></span> beobachten. Der Notenvorschlag ist nur eine Orientierung.
          ${mod._sem === 1 ? 'Semesternote eintragen (Enter = nächstes Kind) – sie wird im 2. Semester weitergerechnet.' : `Jahresvorschlag = Semesternote ${semGewicht(f)} % + Leistungen 2. Semester ${100 - semGewicht(f)} %. Ist keine Semesternote eingetragen, zählt der Vorschlag des 1. Semesters (≈).`}</p>
        <div id="aDetail"></div>`;
      if (detailS) drawDetail(k);
    };
    const drawDetail = k => {
      const s = kursSchueler(k, aktFach(k)).find(x => x.id === detailS); if (!s) return;
      const es = state.eintraege.filter(e => e.k === k.id && e.f === aktFach(k).id && e.s === s.id).sort((a, b) => b.d.localeCompare(a.d));
      const ts = state.tests.filter(t => t.k === k.id && t.f === aktFach(k).id && t.noten[s.id]);
      body.querySelector('#aDetail').innerHTML = `<div class="card detail">
        <h3>${esc(s.vorname)} ${esc(s.nachname)}</h3>
        <div class="split2">
          <div><h4>Einträge</h4>${es.length ? `<ul class="elist">${es.map(e => `<li><span class="muted">${fmtDate(e.d)}</span> <span class="chip ${ET[e.t].cls}">${ET[e.t].label}</span> ${esc(e.n || '')}<button class="x" data-delE="${e.id}">×</button></li>`).join('')}</ul>` : '<p class="muted">Keine Einträge.</p>'}</div>
          <div><h4>Noten</h4>${ts.length ? `<ul class="elist">${ts.map(t => `<li><span class="muted">${fmtDate(t.d)}</span> ${esc(t.typ)}: ${esc(t.titel)} <b class="grade ${gradeCls(t.noten[s.id])}">${esc(t.noten[s.id])}</b></li>`).join('')}</ul>` : '<p class="muted">Keine Noten.</p>'}</div>
        </div></div>`;
    };

    const exportCsv = k => {
      const f = aktFach(k), sas = saVonKurs(k, f);
      const tests = state.tests.filter(t => t.k === k.id && t.f === f.id).sort((a, b) => a.d.localeCompare(b.d));
      const head = ['Nachname', 'Vorname', ...sas.map(x => `${saTitel(x)} (${fmtDate(x.datum)})`), 'Mitarbeit +', 'Mitarbeit -', 'HÜ fehlt', 'Material fehlt', 'Notizen', ...tests.map(t => `${t.typ} ${t.titel} (${fmtDate(t.d)})`), 'Ø Tests/SÜ/Referate', 'Vorschlag 1. Semester', 'Semesternote', 'Jahresvorschlag'];
      const rows = sortSchueler(kursSchueler(k, f)).map(s => {
        const x = stats(k, s), v1 = notenVorschlag(k, f, s.id, 1), v2 = notenVorschlag(k, f, s.id, 2), alle = vorschlagAus(leistungen(k, f, s.id), f);
        return [s.nachname, s.vorname, ...sas.map(sa => saErgebnis(sa, s.id)?.note ?? ''), x.ma, x.mam, x.hue, x.mat, x.notiz, ...tests.map(t => t.noten[s.id] || ''), alle.teile.test == null ? '' : fmtZ(alle.teile.test), v1.wert == null ? '' : fmtZ(v1.wert, 1), semNoteRoh(k, f, s.id), v2.wert == null ? '' : fmtZ(v2.wert, 1)];
      });
      download(`Aufzeichnungen_${k.name}_${aktFach(k).name}_${todayISO()}.csv`, [head, ...rows].map(r => r.map(v => String(v).replace(/;/g, ',')).join(';')).join('\n'));
    };

    /* --- Events --- */
    el.addEventListener('click', e => {
      const k = aktKlasse();
      const tab = e.target.closest('[data-tab]');
      if (tab) { mod._tab = tab.dataset.tab; draw(); return; }
      const add = e.target.closest('[data-add]');
      if (add) {
        const sid = add.closest('.scard').dataset.s, t = add.dataset.add;
        const eintragen = n => {
          const en = { id: uid(), k: k.id, f: aktFach(k).id, s: sid, d: datum, t, n };
          state.eintraege.push(en); undo.push(en.id); save(); redrawCard(sid);
          if (TOUCH) { const sc = body.querySelector(`.scard[data-s="${sid}"]`); sc?.classList.add('blitz'); setTimeout(() => sc?.classList.remove('blitz'), 450); }
        };
        if (t === 'notiz') {
          const s = kursSchueler(k, aktFach(k)).find(x => x.id === sid);
          if (TOUCH) return notizBlatt(`${s.vorname} ${s.nachname}`, n => n && eintragen(n));
          const n = prompt('Notiz:'); if (!n) return;
          eintragen(n);
        } else eintragen('');
        add.blur(); return;
      }
      const del = e.target.closest('[data-delE]');
      if (del) {
        if (TOUCH && !confirm(`Eintrag „${del.title.replace(/ – klicken zum Löschen$/, '')}“ löschen?`)) return;
        state.eintraege = state.eintraege.filter(x => x.id !== del.dataset.dele); save();
        const sc = del.closest('.scard'); sc ? redrawCard(sc.dataset.s) : draw(); return;
      }
      if (e.target.id === 'aUndo' && undo.length) {
        const id = undo.pop(), en = state.eintraege.find(x => x.id === id);
        state.eintraege = state.eintraege.filter(x => x.id !== id); save();
        if (en) redrawCard(en.s); return;
      }
      if (e.target.dataset.delt) {
        const t = state.tests.find(x => x.id === e.target.dataset.delt);
        if (confirm(`Spalte „${t.titel}“ mit allen Noten löschen?`)) { state.tests = state.tests.filter(x => x !== t); save(); draw(); }
        return;
      }
      const ak = e.target.closest('[data-akte]'); if (ak) { state.aktSchueler = ak.dataset.akte; state.akteTab = k.id + '|' + aktFach(k).id; state.akteNav = { k: k.id, f: aktFach(k).id, schritt: 'akte' }; save(); return; }
      const so = e.target.closest('[data-sort]'); if (so) { mod._sort = so.dataset.sort; draw(); return; }
      const sw = e.target.closest('[data-sem]'); if (sw) { mod._sem = +sw.dataset.sem; mod._sort = null; draw(); return; }
      if (e.target.closest('input')) return;
      if (e.target.id === 'aSemUeb') {
        const f = aktFach(k); let n = 0, offen = 0;
        kursSchueler(k, f).forEach(s => {
          if (semNoteRoh(k, f, s.id)) return;
          const w = notenVorschlag(k, f, s.id, 1).wert; if (w == null) return;
          if (Math.abs(w % 1 - 0.5) < 0.05) { offen++; return; }  // genau zwischen zwei Noten → selbst entscheiden
          setSemNote(k, f, s.id, Math.round(w)); n++;
        });
        draw(); toast(`${n} Semesternoten übernommen${offen ? ` · ${offen} × genau dazwischen – bitte selbst eintragen` : ''}`); return;
      }
      const row = e.target.closest('[data-row]');
      if (row) { detailS = detailS === row.dataset.row ? null : row.dataset.row; draw(); return; }
      if (e.target.id === 'aCsv') exportCsv(k);
      if (e.target.id === 'aDruck') {
        const f = aktFach(k), n = kursSchueler(k, f).length, w = { ...GEWICHTUNG_STANDARD, ...(f.gewichtung || {}) };
        druckFenster(`Kursübersicht ${k.name} ${f.name}`, druckKopf(`Kursübersicht ${esc(k.name)} · ${esc(f.name)}`, `${mod._sem}. Semester · ${n} Schülerinnen und Schüler`)
          + kursTabelle(k, true).replace('class="tbl overview kurs"', 'class="kurs"')
          + `<div class="hinweis"><span class="ampel">●</span> auffällig &nbsp; <span class="ampel">○</span> beobachten &nbsp;·&nbsp; Gewichtung Vorschlag: Schularbeiten ${w.sa} % · Tests/SÜ/Referate ${w.test} % · Mitarbeit ${w.ma} % · HÜ ${w.hue} % – rechnerische Orientierung, ersetzt nicht die Gesamtbeurteilung.</div>
          <style>table.kurs .semkopf th { text-transform: none; font-size: 8pt; color: #1d1d1f; border-bottom: 0; } table.kurs .g1, table.kurs .g2 { background: #eef4ff; } table.kurs .gs, table.kurs td.cs, table.kurs th.cs { background: #fff7e0; } table.kurs .gj, table.kurs td.cj, table.kurs th.cj { background: #eceef2; }
          table.kurs td, table.kurs th { text-align: center; } table.kurs td:nth-child(2), table.kurs th:nth-child(2) { text-align: left; } table.kurs th:first-child { width: 10pt; }</style>`, { quer: true });
      }
    });
    el.addEventListener('change', e => {
      if (e.target.dataset.semgew !== undefined) { const f = aktFach(); f.semGewicht = Math.max(0, Math.min(100, +e.target.value || 0)); save(); draw(); body.querySelector('details.gewicht').open = true; return; }
      if (e.target.classList.contains('sn')) {
        const k = aktKlasse(), f = aktFach(k), sid = e.target.dataset.sn, v = e.target.value.trim().replace('.', ',');
        if (v && !/^[1-5]$/.test(v)) { toast('Semesternote bitte als Zahl 1–5'); e.target.value = semNoteRoh(k, f, sid); return; }
        setSemNote(k, f, sid, v); e.target.className = 'sn ' + gradeCls(v);
        const j = body.querySelector(`[data-jahr="${sid}"]`); if (j) j.innerHTML = `<b>${vorschlagText(notenVorschlag(k, f, sid, 2).wert)}</b>`;
        return;
      }
      if (e.target.dataset.gew) { const f = aktFach(); f.gewichtung = { ...GEWICHTUNG_STANDARD, ...(f.gewichtung || {}), [e.target.dataset.gew]: Math.max(0, +e.target.value || 0) }; save(); draw(); body.querySelector('details.gewicht').open = true; return; }
      if (e.target.id === 'aDat') { datum = e.target.value || todayISO(); undo = []; draw(); }
    });
    el.addEventListener('submit', e => {
      if (e.target.id !== 'tNew') return;
      e.preventDefault();
      const f = e.target;
      state.tests.push({ id: uid(), k: aktKlasse().id, f: aktFach().id, titel: f.titel.value.trim(), typ: f.typ.value, d: f.d.value || todayISO(), noten: {} });
      save(); draw();
    });
    el.addEventListener('input', e => {
      if (!e.target.classList.contains('gi')) return;
      const i = e.target, t = state.tests.find(x => x.id === i.dataset.t), v = i.value.trim();
      v ? t.noten[i.dataset.s] = v : delete t.noten[i.dataset.s];
      save();
      i.className = 'gi ' + gradeCls(v);
      const k = aktKlasse();
      body.querySelector(`[data-avg="${i.dataset.s}"]`).textContent = fmtAvg(notenSchnitt(state.tests.filter(x => x.k === k.id && x.f === aktFach(k).id).map(x => x.noten[i.dataset.s])));
      body.querySelector(`[data-tavg="${t.id}"]`).textContent = fmtAvg(notenSchnitt(Object.values(t.noten)));
    });
    el.addEventListener('keydown', e => {
      if (e.target.classList.contains('sn') && ['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const n = body.querySelector(`.sn[data-r="${+e.target.dataset.r + (e.key === 'ArrowUp' ? -1 : 1)}"]`);
        if (n) { n.focus(); n.select(); } else e.target.blur();
        return;
      }
      if (!e.target.classList.contains('gi') || !['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const r = +e.target.dataset.r + (e.key === 'ArrowUp' ? -1 : 1);
      const n = body.querySelector(`.gi[data-r="${r}"][data-c="${e.target.dataset.c}"]`);
      if (n) { n.focus(); n.select(); }
    });

    draw();
  },
});
