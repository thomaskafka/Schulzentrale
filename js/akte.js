'use strict';
/* ===== Schülerakte: alles zu einem Kind – nach Klasse/Gruppe und Fach getrennt ===== */

const ET_TEXT = { 'ma+': 'Mitarbeit +', 'ma-': 'Mitarbeit −', 'hue-': 'HÜ fehlt', 'mat-': 'Material fehlt', notiz: 'Notiz' };

/** Semesternote als Text: festgelegt → Pille, sonst ≈ Vorschlag */
const semNoteHtml = v => v.semNoteFest || (v.sem === 1 && v.semNote != null) ? notePill(String(Math.round(v.semNote))) : v.semNote != null ? `<span class="muted">≈ ${fmtZ(v.semNote, 1)}</span>` : '–';
/** Trennzeile zwischen den Semestern in einer nach Datum sortierten Liste einfügen */
function semTrenner(zeilen, html, absteigend) {
  const out = []; let vorher = null;
  zeilen.forEach(z => { const sem = semVon(z.d); if (vorher !== null && sem !== vorher) out.push(html(absteigend ? vorher : sem)); out.push(z); vorher = sem; });
  return out;
}

function akteKursBlock(k, f, s, druck = false) {
  const v = notenVorschlag(k, f, s.id), L = v.L, A = leistungen(k, f, s.id), w = { ...GEWICHTUNG_STANDARD, ...(f.gewichtung || {}) };
  const verlauf = [
    ...A.eintraege.map(e => ({ d: e.d, art: e.t, text: ET_TEXT[e.t] + (e.n ? ': ' + e.n : '') })),
    ...A.tests.map(t => ({ d: t.d, art: t.raster ? 'raster' : 'test', note: t.note,
      text: `${t.typ}: ${t.titel}` + (t.raster ? ` – ${fmtZ(t.punkte)}/${fmtZ(t.max)} P. (${fmtZ(t.pct, 0)} %)` : '') + (t.komm ? ` · „${t.komm}“` : '') })),
    ...A.sas.map(x => ({ d: x.d, art: 'sa', text: `${x.titel} – ${fmtZ(x.punkte)}/${fmtZ(x.max)} P. (${fmtZ(x.pct, 1)} %)`, note: x.note })),
  ].sort((a, b) => (b.d || '').localeCompare(a.d || ''));
  const zeilen = semTrenner(verlauf, sem => ({ trenner: sem }), true);
  const kz = (wert, label, extra = '') => `<div class="stat"><b>${wert}</b><span>${label}</span>${extra}</div>`;
  return `<div class="akte-kurs">
    ${druck ? `<h2>${esc(k.name)} · ${esc(f.name)}</h2>` : ''}
    <div class="stats">
      ${kz(vorschlagText(v.wert), v.sem === 2 ? 'Jahresvorschlag' : 'Notenvorschlag', `<small class="muted">${v.sem === 2 ? `Semesternote ${semGewicht(f)} % + 2. Sem.` : 'Orientierung'}</small>`)}
      ${kz(semNoteHtml(v), 'Semesternote', v.sem === 2 && !v.semNoteFest && v.semNote != null ? '<small class="muted">noch nicht festgelegt</small>' : '')}
      ${kz(v.teile.sa == null ? '–' : fmtZ(v.teile.sa), `Ø Schularbeiten (${L.sas.length})`)}
      ${kz(v.teile.test == null ? '–' : fmtZ(v.teile.test), `Ø Tests, SÜ & Referate (${L.tests.filter(t => t.typ !== 'Mitarbeit').length})`)}
      ${kz(`<span class="pos">+${L.plus}</span> <span class="neg">−${L.minus}</span>`, 'Mitarbeit')}
      ${kz(L.hue, 'HÜ fehlt')}${kz(L.mat, 'Material fehlt')}
    </div>
    <p class="muted small"><b>${v.sem}. Semester</b>${v.sem === 2 ? ` (seit ${fmtDate(sem2Beginn())})` : ''} · Gewichtung: Schularbeiten ${w.sa} % · Tests/SÜ/Referate ${w.test} % · Mitarbeit ${w.ma} % · HÜ ${w.hue} % – nur vorhandene Bereiche zählen. Der Vorschlag ersetzt nicht die pädagogische Gesamtbeurteilung.</p>
    ${druck ? '' : `<div class="akte-ansicht"><div class="seg">${[['spalten', 'Übersicht'], ['verlauf', 'Verlauf']].map(([a, n]) => `<button data-akteansicht="${a}" class="${(state.akteAnsicht || 'spalten') === a ? 'on' : ''}">${n}</button>`).join('')}</div></div>`}
    ${!druck && (state.akteAnsicht || 'spalten') === 'spalten' ? akteSpaltenAnsicht(A) : `<table class="tbl verlauf"><thead><tr><th class="left">Datum</th><th class="left">Eintrag</th><th>Note</th></tr></thead>
      <tbody>${zeilen.map(x => x.trenner ? `<tr class="semtrenner"><td colspan="3">▲ ${x.trenner}. Semester &nbsp;·&nbsp; ▼ ${x.trenner - 1}. Semester</td></tr>` : `<tr class="v-${x.art.replace('+', 'p').replace('-', 'm')}"><td class="left nowrap">${fmtDate(x.d)}</td><td class="left">${esc(x.text)}</td><td>${x.note ? `<span class="grade gr${Math.round(zahl(x.note)) || ''}">${esc(String(x.note))}</span>` : ''}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Noch keine Einträge.</td></tr>'}</tbody></table>`}
  </div>`;
}

/** Übersicht in Spalten: Schularbeiten · Tests & Referate · Mitarbeit · HÜ & Material · Notizen (ganzes Schuljahr, nach Semestern getrennt) */
function akteSpaltenAnsicht(A) {
  const nachDatum = l => [...l].sort((a, b) => (a.d || '').localeCompare(b.d || ''));
  const mitSem = (l, html) => semTrenner(nachDatum(l), sem => ({ trenner: sem }), false).map(x => x.trenner ? `<li class="as-sem">${x.trenner}. Semester</li>` : html(x)).join('');
  const pill = n => n ? `<span class="grade gr${Math.round(zahl(n)) || ''}">${esc(String(n))}</span>` : '';
  const datum = d => fmtDate(d).replace(/\d{4}$/, '');
  const spalte = (titel, anzahl, inhalt, leer = 'Noch nichts eingetragen') => `<section class="as-spalte"><h3>${titel}${anzahl ? ` <span>${anzahl}</span>` : ''}</h3>${inhalt || `<p class="muted small">${leer}</p>`}</section>`;
  const sas = A.sas, tests = A.tests, ein = A.eintraege;
  const proSem = typ => [1, 2].map(sem => ein.filter(e => e.t === typ && semVon(e.d) === sem).length);
  const [p1, p2] = proSem('ma+'), [m1, m2] = proSem('ma-');
  const ma = nachDatum(ein.filter(e => e.t === 'ma+' || e.t === 'ma-'));
  const huMat = typ => nachDatum(ein.filter(e => e.t === typ));
  const notizen = nachDatum(ein.filter(e => e.t === 'notiz')).reverse();
  return `<div class="akte-spalten">
    ${spalte('Schularbeiten', sas.length, sas.length ? `<ul class="as-liste">${mitSem(sas, x => `<li><div><b>${esc(x.titel.replace(/^(\d+\.) Schularbeit/, '$1 SA'))}</b><small>${datum(x.d)} · ${fmtZ(x.punkte)}/${fmtZ(x.max)} P. · ${fmtZ(x.pct, 0)} %</small></div>${pill(x.note)}</li>`)}</ul>` : '')}
    ${spalte('Tests, SÜ & Referate', tests.length, tests.length ? `<ul class="as-liste">${mitSem(tests, t => `<li><div><b>${esc(t.titel || t.typ)}</b><small>${esc(t.typ)} · ${datum(t.d)}${t.raster ? ` · ${fmtZ(t.pct, 0)} %` : ''}</small>${t.komm ? `<small class="as-komm">„${esc(t.komm)}“</small>` : ''}</div>${pill(t.note)}</li>`)}</ul>` : '')}
    ${spalte('Mitarbeit', ma.length, ma.length ? `<div class="as-ma"><div><small>1. Semester</small><b><span class="pos">+${p1}</span> <span class="neg">−${m1}</span></b></div>${p2 + m2 ? `<div><small>2. Semester</small><b><span class="pos">+${p2}</span> <span class="neg">−${m2}</span></b></div>` : ''}</div>
      <div class="as-punkte">${ma.map(e => `<i class="${e.t === 'ma+' ? 'p' : 'm'}" title="${fmtDate(e.d)}${e.n ? ': ' + esc(e.n) : ''}"></i>`).join('')}</div><p class="muted small">Jeder Punkt ein Eintrag, von alt nach neu.</p>` : '')}
    ${spalte('HÜ & Material', huMat('hue-').length + huMat('mat-').length, huMat('hue-').length + huMat('mat-').length ? `${[['hue-', 'HÜ fehlt'], ['mat-', 'Material fehlt']].map(([t, n]) => huMat(t).length ? `<div class="as-gruppe"><small>${n} · ${huMat(t).length}×</small><div class="as-chips">${huMat(t).map(e => `<span title="${esc(e.n || '')}">${datum(e.d)}</span>`).join('')}</div></div>` : '').join('')}` : '', 'Keine fehlenden HÜs oder Materialien 👍')}
    ${spalte('Notizen', notizen.length, notizen.length ? `<ul class="as-notizen">${notizen.map(n => `<li><small>${fmtDate(n.d)}</small>${esc(n.n || '')}</li>`).join('')}</ul>` : '')}
  </div>`;
}

/* ----- Druckfassung: kompakt, ein Kind pro Seite ----- */
function akteDruckKurs(k, f, s) {
  const v = notenVorschlag(k, f, s.id), L = v.L, A = leistungen(k, f, s.id);
  const kz = (wert, label) => `<div><b>${wert}</b><span>${label}</span></div>`;
  const leist = [
    ...A.sas.map(x => ({ d: x.d, art: 'Schularbeit', titel: x.titel, p: x.punkte, max: x.max, pct: x.pct, note: x.note })),
    ...A.tests.map(t => ({ d: t.d, art: t.typ, titel: t.titel, p: t.punkte, max: t.max, pct: t.pct, note: t.note, komm: t.komm })),
  ].sort((a, b) => (a.d || '').localeCompare(b.d || ''));
  // Mitarbeit/HÜ/Material zusammengefasst statt Zeile für Zeile
  const sammel = (typ, label) => {
    const e = A.eintraege.filter(x => x.t === typ).sort((a, b) => (a.d || '').localeCompare(b.d || ''));
    if (!e.length) return '';
    const d = e.map(x => fmtDate(x.d).replace(/\d{4}$/, '') + (x.n ? ` (${esc(x.n)})` : ''));
    return `<tr><td class="nw" style="width:80pt"><b>${label}</b></td><td class="c" style="width:28pt">${e.length}×</td><td class="klein muted">${d.join(' · ')}</td></tr>`;
  };
  const verhalten = sammel('ma+', 'Mitarbeit +') + sammel('ma-', 'Mitarbeit −') + sammel('hue-', 'HÜ fehlt') + sammel('mat-', 'Material fehlt');
  const notizen = A.notizen.slice().sort((a, b) => (a.d || '').localeCompare(b.d || ''));
  return `<div class="block">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8pt"><h2>${esc(f.name)} <span class="muted" style="font-weight:400">· ${esc(k.name)}</span></h2>
      <span class="klein muted nw">${v.sem === 2 ? 'Jahresvorschlag' : 'Notenvorschlag'}&nbsp; <b style="color:#1d1d1f;font-size:10pt">${vorschlagText(v.wert)}</b></span></div>
    <h3 style="margin-top:0">${v.sem}. Semester</h3>
    <div class="kz">${kz(v.teile.sa == null ? '–' : fmtZ(v.teile.sa), `Ø Schularbeiten (${L.sas.length})`)}
      ${kz(v.teile.test == null ? '–' : fmtZ(v.teile.test), 'Ø Tests / Referate')}
      ${kz(`<span class="pos">+${L.plus}</span> <span class="neg">−${L.minus}</span>`, 'Mitarbeit')}
      ${kz(L.hue, 'HÜ fehlt')}${kz(L.mat, 'Material fehlt')}${kz(semNoteHtml(v), 'Semesternote')}</div>
    ${leist.length ? `<h3>Leistungen</h3><table><thead><tr><th style="width:50pt">Datum</th><th>Art</th><th>Titel</th><th class="r">Punkte</th><th class="r">%</th><th class="c">Note</th></tr></thead>
      <tbody>${semTrenner(leist, sem => ({ trenner: sem }), false).map(x => x.trenner ? `<tr><td colspan="6" style="background:none;padding-top:6pt"><b class="klein">${x.trenner}. Semester</b></td></tr>` : `<tr><td class="nw">${fmtDate(x.d)}</td><td class="nw">${esc(x.art)}</td><td>${esc(x.titel || '')}${x.komm ? `<div class="klein muted">„${esc(x.komm)}“</div>` : ''}</td>
        <td class="r nw">${x.p != null ? `${fmtZ(x.p)} / ${fmtZ(x.max)}` : ''}</td><td class="r">${x.pct != null ? fmtZ(x.pct, 0) : ''}</td><td class="c">${notePill(x.note)}</td></tr>`).join('')}</tbody></table>` : ''}
    ${verhalten ? `<h3>Mitarbeit & Hausübungen</h3><table><tbody>${verhalten}</tbody></table>` : ''}
    ${notizen.length ? `<h3>Notizen</h3>${notizen.map(n => `<div class="kommentar"><span class="klein muted">${fmtDate(n.d)}</span>&nbsp; ${esc(n.n || '')}</div>`).join('')}` : ''}
    ${!leist.length && !verhalten && !notizen.length ? '<p class="muted">Noch keine Einträge.</p>' : ''}
  </div>`;
}
/** Fächer auf zwei Spalten verteilen – nach geschätzter Höhe ausgeglichen */
function akteSpalten(s, kurse) {
  const hoehe = x => { const L = leistungen(x.k, x.f, s.id); return 7 + L.tests.length + L.sas.length + 2 * L.notizen.length + ['ma+', 'ma-', 'hue-', 'mat-'].filter(t => L.eintraege.some(e => e.t === t)).length; };
  const h = [0, 0], spalte = new Map();
  kurse.map(x => ({ x, h: hoehe(x) })).sort((a, b) => b.h - a.h).forEach(o => { const i = h[0] <= h[1] ? 0 : 1; h[i] += o.h; spalte.set(o.x, i); });
  // innerhalb der Spalten bleibt die Reihenfolge der Fächer wie in der Akte
  return `<div class="spalten">${[0, 1].map(i => `<div>${kurse.filter(x => spalte.get(x) === i).map(x => akteDruckKurs(x.k, x.f, s)).join('')}</div>`).join('')}</div>`;
}
/** Eine Druckseite pro Kind; im Querformat zweispaltig */
function akteDruckSeite(s, kurse, quer) {
  const ix = schuelerIndex().get(s.id), stamm = ix ? ix.k : null;
  const gruppen = state.klassen.filter(g => istGruppe(g) && (g.mitglieder || []).includes(s.id));
  const unter = [stamm ? (istGruppe(stamm) ? '' : 'Klasse ') + esc(stamm.name) : '', s.niveau ? esc(s.niveau) : '', gruppen.length ? 'Gruppen: ' + gruppen.map(g => esc(g.name)).join(', ') : ''].filter(Boolean).join(' · ');
  return `<section class="seite fit">${druckKopf(`${esc(s.vorname)} ${esc(s.nachname)}`, unter, `Schülerakte<br>Stand ${fmtDate(todayISO())}`)}
    ${quer && kurse.length > 1 ? akteSpalten(s, kurse) : kurse.map(x => akteDruckKurs(x.k, x.f, s)).join('')}
    <div class="hinweis">Der Notenvorschlag ist eine rechnerische Orientierung (gewichtet nach Schularbeiten, Tests/Referaten, Mitarbeit und HÜ) und ersetzt nicht die pädagogische Gesamtbeurteilung.</div></section>`;
}
/** Querformat lohnt sich ab 3 Fächern oder wenn zwei Fächer viele Einträge haben */
function akteQuer(liste) {
  return liste.some(({ s, kurse }) => kurse.length >= 3 || (kurse.length === 2 && kurse.reduce((a, x) => { const L = leistungen(x.k, x.f, s.id); return a + L.tests.length + L.sas.length + L.notizen.length; }, 0) > 12));
}

registerModule({
  id: 'akte', title: 'Schülerakte', icon: '🗂️',
  /* Geführter Ablauf: Klasse/Gruppe → Fach → Schülerliste → Akte */
  render(el) {
    const N = (state.akteNav ||= { k: null, f: null, schritt: 'klasse' });
    el.innerHTML = `<div class="page akte-page">
      <div class="pagehead">${seitenTitel('ordner', '#5856d6', 'Schülerakte')}</div>
      <nav class="akte-pfad" id="akPfad"></nav>
      <div id="akBody"></div></div>`;
    const body = el.querySelector('#akBody'), pfad = el.querySelector('#akPfad');
    const K = () => klasse(N.k), F = () => K()?.faecher.find(f => f.id === N.f);
    let suche = '';

    const draw = () => {
      // ungültige Auswahl zurücksetzen
      if (N.schritt !== 'klasse' && !K()) N.schritt = 'klasse';
      if (['liste', 'akte'].includes(N.schritt) && !F()) N.schritt = 'fach';
      if (N.schritt === 'akte' && !schuelerIndex().has(state.aktSchueler)) N.schritt = 'liste';
      const k = K(), f = F(), s = N.schritt === 'akte' ? schuelerIndex().get(state.aktSchueler)?.s : null;
      const teile = [['klasse', 'Alle Klassen']];
      if (k && N.schritt !== 'klasse') teile.push(['fach', k.name]);
      if (f && ['liste', 'akte'].includes(N.schritt)) teile.push(['liste', f.name]);
      if (s) teile.push(['akte', `${s.vorname} ${s.nachname}`]);
      pfad.innerHTML = teile.map(([schritt, txt], i) => i === teile.length - 1 ? `<span>${esc(txt)}</span>` : `<button data-schritt="${schritt}">${esc(txt)}</button><i>›</i>`).join('');
      ({ klasse: schrittKlasse, fach: schrittFach, liste: schrittListe, akte: schrittAkte })[N.schritt]();
      save();
    };

    /* 1 – Klasse oder Gruppe wählen */
    const schrittKlasse = () => {
      const kachel = x => `<button class="wahl" data-k="${x.id}"><span class="wahl-t">${esc(x.name)}</span>
        <span class="wahl-s">${schuelerVon(x).length} Kinder · ${x.faecher.map(f => esc(f.name)).join(', ')}</span></button>`;
      const kl = state.klassen.filter(x => !istGruppe(x)), gr = state.klassen.filter(istGruppe);
      body.innerHTML = `<h2 class="wahl-h">Klasse wählen</h2><div class="wahl-grid">${kl.map(kachel).join('') || '<p class="muted">Noch keine Klasse – unter Organisation → Klassen & Gruppen anlegen.</p>'}</div>
        <h2 class="wahl-h">Gruppen <span class="muted small">klassenübergreifend, z.B. 1A/B Deutsch</span></h2><div class="wahl-grid">${gr.map(kachel).join('')}
          <a class="wahl wahl-neu" href="#/klassen"><span class="wahl-t">+</span><span class="wahl-s">Gruppe anlegen (unter „Klassen & Gruppen“)</span></a></div>`;
    };
    /* 2 – Fach wählen */
    const schrittFach = () => {
      const k = K();
      body.innerHTML = `<h2 class="wahl-h">${esc(k.name)} – Fach wählen</h2><div class="wahl-grid">${k.faecher.map(f => {
        const kids = kursSchueler(k, f), sas = saVonKurs(k, f).length, ein = state.eintraege.filter(e => e.k === k.id && e.f === f.id).length;
        const rot = kids.filter(s => warnung(notenVorschlag(k, f, s.id)) === 'rot').length;
        return `<button class="wahl" data-f="${f.id}"><span class="wahl-t">${esc(f.name)}</span>
          <span class="wahl-s">${kids.length} Kinder${f.nur && f.nur.length ? ' (Teilgruppe)' : ''} · ${sas} Schularbeit${sas === 1 ? '' : 'en'} · ${ein} Einträge</span>
          ${rot ? `<span class="wahl-warn"><span class="ampel rot"></span> ${rot} ${rot === 1 ? 'Kind' : 'Kinder'} kritisch</span>` : ''}</button>`;
      }).join('')}
        ${gruppenVonKlasse(k).flatMap(g => g.faecher.map(f => `<button class="wahl wahl-gruppe" data-gk="${g.id}" data-f="${f.id}">
          <span class="wahl-badge">Gruppe</span><span class="wahl-t">${esc(f.name)}</span><span class="wahl-s">${esc(g.name)} · ${kursSchueler(g, f).length} Kinder</span></button>`)).join('')}</div>`;
    };
    /* 3 – Schülerliste */
    const schrittListe = () => {
      const k = K(), f = F(), sas = saVonKurs(k, f);
      const kids = sortSchueler(kursSchueler(k, f)).filter(s => !suche || (s.vorname + ' ' + s.nachname).toLowerCase().includes(suche));
      body.innerHTML = `<div class="row between"><h2 class="wahl-h">${esc(k.name)} · ${esc(f.name)}</h2>
          <div class="row"><input id="akSuche" class="akte-suche" placeholder="Name suchen …" value="${esc(suche)}">
          <button class="btn" id="akAlleDruck" title="Ein Kind pro Seite – nur dieses Fach">Alle Akten drucken</button></div></div>
        <div class="kid-grid">${kids.map(s => {
          const v = notenVorschlag(k, f, s.id), amp = warnung(v);
          return `<button class="kid ${amp ? 'kid-' + amp : ''}" data-s="${s.id}">
            <span class="kid-n"><b>${esc(s.nachname)}</b> ${esc(s.vorname)}</span>
            <span class="kid-z">${sas.map(x => { const e = saErgebnis(x, s.id); return e ? `<span class="grade gr${e.note}" title="${esc(saTitel(x))}">${e.note}</span>` : ''; }).join('')}
              <span class="muted small">+${v.L.plus} −${v.L.minus}${v.L.hue ? ` · HÜ✗ ${v.L.hue}` : ''}</span></span>
            <span class="kid-v">${v.wert == null ? '' : 'Vorschlag ' + vorschlagText(v.wert)}</span></button>`;
        }).join('') || '<p class="muted">Keine Kinder gefunden.</p>'}</div>`;
      const inp = body.querySelector('#akSuche');
      inp.oninput = () => { suche = inp.value.trim().toLowerCase(); schrittListe(); const n = body.querySelector('#akSuche'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    };
    /* 4 – Akte eines Kindes */
    const schrittAkte = () => {
      const k = K(), f = F(), ix = schuelerIndex(), { s, k: stamm } = ix.get(state.aktSchueler);
      const kurse = kurseVon(s.id), liste = sortSchueler(kursSchueler(k, f)), pos = liste.findIndex(x => x.id === s.id);
      if (!kurse.some(x => x.k.id + '|' + x.f.id === state.akteTab) && state.akteTab !== 'alle') state.akteTab = k.id + '|' + f.id;
      const tab = state.akteTab;
      const gruppen = state.klassen.filter(g => istGruppe(g) && (g.mitglieder || []).includes(s.id));
      body.innerHTML = `<div class="card akte-kopf">
          <div class="row"><button class="btn nav-pfeil" data-blaettern="-1" ${pos <= 0 ? 'disabled' : ''} title="Voriges Kind">‹</button>
            <div><div class="akte-name">${esc(s.vorname)} ${esc(s.nachname)}</div>
            <div class="muted">${esc(stamm.name)}${s.niveau ? ' · ' + esc(s.niveau) : ''}${gruppen.length ? ' · Gruppen: ' + gruppen.map(g => esc(g.name)).join(', ') : ''}${pos >= 0 ? ` · ${pos + 1} von ${liste.length}` : ''}</div></div>
            <button class="btn nav-pfeil" data-blaettern="1" ${pos < 0 || pos >= liste.length - 1 ? 'disabled' : ''} title="Nächstes Kind">›</button></div>
          <button class="btn" id="akDruck">Als PDF / drucken</button></div>
        <nav class="tabs" id="akTabs">${kurse.map(x => `<button data-tab="${x.k.id}|${x.f.id}" class="${tab === x.k.id + '|' + x.f.id ? 'on' : ''}">${esc(x.f.name)}${x.k.id !== stamm.id ? ` <small>(${esc(x.k.name)})</small>` : ''}</button>`).join('')}
          <button data-tab="alle" class="${tab === 'alle' ? 'on' : ''}">Alle Fächer</button></nav>
        <div class="card">${tab === 'alle' ? `<table class="tbl akte-alle"><thead><tr><th class="left">Fach</th><th>Ø SA</th><th>Ø Tests/Referate</th><th>Mitarbeit</th><th>HÜ fehlt</th><th>Vorschlag</th></tr></thead>
            <tbody>${kurse.map(x => { const v = notenVorschlag(x.k, x.f, s.id); return `<tr class="click ampel-${warnung(v)}" data-tab="${x.k.id}|${x.f.id}">
              <td class="left"><b>${esc(x.f.name)}</b> <span class="muted small">${esc(x.k.name)}</span></td><td>${v.teile.sa == null ? '–' : fmtZ(v.teile.sa)}</td><td>${v.teile.test == null ? '–' : fmtZ(v.teile.test)}</td>
              <td><span class="pos">+${v.L.plus}</span> <span class="neg">−${v.L.minus}</span></td><td>${v.L.hue}</td><td><b>${vorschlagText(v.wert)}</b></td></tr>`; }).join('')}</tbody></table>`
          : (() => { const x = kurse.find(x => x.k.id + '|' + x.f.id === tab); return x ? akteKursBlock(x.k, x.f, s) : ''; })()}</div>`;
    };

    el.addEventListener('click', e => {
      const t = e.target;
      const sc = t.closest('[data-schritt]'); if (sc) { N.schritt = sc.dataset.schritt; draw(); return; }
      const kb = t.closest('.wahl[data-k]'); if (kb) { N.k = kb.dataset.k; N.f = null; const k = K(); if (k.faecher.length === 1 && !gruppenVonKlasse(k).length) { N.f = k.faecher[0].id; N.schritt = 'liste'; } else N.schritt = 'fach'; suche = ''; draw(); return; }
      const fb = t.closest('.wahl[data-f]'); if (fb) { if (fb.dataset.gk) N.k = fb.dataset.gk; N.f = fb.dataset.f; N.schritt = 'liste'; suche = ''; draw(); return; }
      const kid = t.closest('.kid[data-s]'); if (kid) { state.aktSchueler = kid.dataset.s; state.akteTab = N.k + '|' + N.f; N.schritt = 'akte'; draw(); window.scrollTo(0, 0); return; }
      const bl = t.closest('[data-blaettern]');
      if (bl) { const l = sortSchueler(kursSchueler(K(), F())), i = l.findIndex(x => x.id === state.aktSchueler) + +bl.dataset.blaettern; if (l[i]) { state.aktSchueler = l[i].id; draw(); } return; }
      const an = t.closest('[data-akteansicht]'); if (an) { state.akteAnsicht = an.dataset.akteansicht; draw(); return; }
      const tb = t.closest('[data-tab]'); if (tb) { state.akteTab = tb.dataset.tab; draw(); return; }
      if (t.id === 'akAlleDruck') {
        const k = K(), f = F(), liste = sortSchueler(kursSchueler(k, f)).map(s => ({ s, kurse: [{ k, f }] }));
        druckFenster(`Schülerakten ${k.name} ${f.name}`, liste.map(x => akteDruckSeite(x.s, x.kurse, false)).join(''));
        return;
      }
      if (t.id === 'akDruck') {
        const { s } = schuelerIndex().get(state.aktSchueler), kurse = kurseVon(s.id);
        const nur = kurse.filter(x => state.akteTab === 'alle' || x.k.id + '|' + x.f.id === state.akteTab);
        const liste = [{ s, kurse: nur }], quer = akteQuer(liste);
        druckFenster(`Schülerakte ${s.vorname} ${s.nachname}`, akteDruckSeite(s, nur, quer), { quer });
      }
    });
    // Pfeiltasten blättern in der Akte
    this._key = e => { if (N.schritt !== 'akte' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const b = el.querySelector(`[data-blaettern="${e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0}"]`); if (b && !b.disabled) b.click(); };
    document.addEventListener('keydown', this._key);
    draw();
  },
  destroy() { document.removeEventListener('keydown', this._key); },
});
