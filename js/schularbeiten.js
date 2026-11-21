'use strict';
/* ===== Schularbeiten: Punkte & Noten pro Kurs (Nachfolger von „Schularbeitspunkte“) ===== */

function neueSA(k, f, vorlage) {
  const g = uid();
  const basis = vorlage ? JSON.parse(JSON.stringify({ groups: vorlage.groups, cats: vorlage.cats, scaleMode: vorlage.scaleMode, scales: vorlage.scales, useLevels: vorlage.useLevels }))
    : { groups: [{ id: g, name: 'Text' }], cats: ['Inhalt', 'Ausdruck', 'Rechtschreibung', 'Grammatik'].map(n => ({ id: uid(), name: n, max: 10, groupId: g })),
        scaleMode: 'percent', scales: { ahs: [...NIVEAUS.ahs.pct], std: [...NIVEAUS.std.pct] }, useLevels: true };
  const nr = saVonKurs(k, f).length + 1;
  const niveau = {}; kursSchueler(k, f).forEach(s => niveau[s.id] = niveauVon(s));
  return { id: uid(), k: k.id, f: f.id, nr: String(nr), titel: '', datum: todayISO(), punkte: {}, niveau, ...basis };
}

/* ----- Druck: Ergebnisliste (quer) und Rückmeldezettel ----- */
function saSchluessel(sa) {
  const m = saMax(sa);
  return (sa.useLevels ? ['ahs', 'std'] : ['ahs']).map(niv => { const gr = saGrenzen(sa, niv);
    return `<div class="block" style="flex:1"><h3>Notenschlüssel${sa.useLevels ? ' ' + NIVEAUS[niv].name : ''}</h3><table><tbody>
      ${[0, 1, 2, 3].map(i => `<tr><td>${notePill(i + 1)} ${NOTEN_TEXT[i]}</td><td class="r nw">ab ${fmtZ(gr[i])} P.</td><td class="r muted">${m ? fmtZ(gr[i] / m * 100, 0) + ' %' : ''}</td></tr>`).join('')}
      <tr><td>${notePill(5)} ${NOTEN_TEXT[4]}</td><td class="r muted">darunter</td><td></td></tr></tbody></table></div>`; }).join('');
}
function saDruckListe(sa, k, f) {
  const kids = sortSchueler(kursSchueler(k, f)), cats = [...sa.groups.flatMap(g => sa.cats.filter(c => c.groupId === g.id)), ...sa.cats.filter(c => !c.groupId)];
  const m = saMax(sa), fertig = kids.map(s => saErgebnis(sa, s.id)).filter(Boolean);
  const cnt = [0, 0, 0, 0, 0]; fertig.forEach(e => e.note && cnt[e.note - 1]++);
  const avgN = fertig.length ? fertig.reduce((a, e) => a + e.note, 0) / fertig.length : null, avgP = fertig.length ? fertig.reduce((a, e) => a + e.punkte, 0) / fertig.length : null;
  const mx = Math.max(1, ...cnt);
  return druckKopf(esc(saTitel(sa)), `${esc(k.name)} · ${esc(f.name)}`, `${fmtDate(sa.datum)}<br>${fertig.length} von ${kids.length} bewertet`)
    + `<table class="sal"><thead><tr><th>Name</th>${sa.useLevels ? '<th>Niv.</th>' : ''}${cats.map(c => `<th class="c">${esc(c.name || '–')}<div style="font-weight:400;text-transform:none">/ ${fmtZ(zahl(c.max))}</div></th>`).join('')}<th class="r">Gesamt</th><th class="r">%</th><th class="c">Note</th></tr></thead>
      <tbody>${kids.map(s => { const e = saErgebnis(sa, s.id); return `<tr><td class="nw"><b>${esc(s.nachname)}</b> ${esc(s.vorname)}</td>${sa.useLevels ? `<td class="muted">${NIVEAUS[saNiveau(sa, s.id)].kurz}</td>` : ''}
        ${cats.map(c => `<td class="c">${fmtZ(zahl(sa.punkte[s.id]?.[c.id]))}</td>`).join('')}<td class="r nw"><b>${e ? fmtZ(e.punkte) : '–'}</b></td><td class="r muted">${e && e.pct != null ? fmtZ(e.pct, 0) : ''}</td><td class="c">${e ? notePill(e.note) : ''}</td></tr>`; }).join('')}</tbody></table>
    <div style="display:flex;gap:10mm;margin-top:12pt;align-items:flex-start">
      <div class="block" style="flex:1.2"><h3>Auswertung</h3><div class="kz" style="grid-template-columns:repeat(3,1fr)">
        <div><b>${avgN == null ? '–' : fmtZ(avgN)}</b><span>Notenschnitt</span></div><div><b>${avgP == null ? '–' : fmtZ(avgP, 1)}</b><span>Ø Punkte von ${fmtZ(m)}</span></div><div><b>${avgP == null || !m ? '–' : fmtZ(avgP / m * 100, 0) + ' %'}</b><span>Ø Prozent</span></div></div>
        <table><tbody>${cnt.map((c, i) => `<tr><td class="nw" style="width:95pt">${notePill(i + 1)} ${NOTEN_TEXT[i]}</td><td><span class="balken" style="width:120pt"><i style="width:${c / mx * 100}%"></i></span></td><td class="r"><b>${c}</b></td></tr>`).join('')}</tbody></table></div>
      ${saSchluessel(sa)}</div>
    <style>table.sal td, table.sal th { padding-left: 3pt; padding-right: 3pt; }</style>`;
}
function saDruckZettel(sa, k, f) {
  const kids = sortSchueler(kursSchueler(k, f)).filter(s => saErgebnis(sa, s.id));
  const bloecke = [...sa.groups.map(g => ({ g, cats: sa.cats.filter(c => c.groupId === g.id) })), ...sa.cats.filter(c => !c.groupId).map(c => ({ g: null, cats: [c] }))];
  return kids.map(s => { const e = saErgebnis(sa, s.id), p = sa.punkte[s.id] || {};
    return `<div class="zettel">
      <div class="kopf" style="margin-bottom:6pt;padding-bottom:4pt"><div><h1 style="font-size:13pt">${esc(s.vorname)} ${esc(s.nachname)}</h1><div class="unter">${esc(saTitel(sa))} · ${esc(f.name)} · ${esc(k.name)}</div></div>
        <div class="meta" style="font-size:9pt">${fmtDate(sa.datum)}</div></div>
      <div style="display:flex;gap:9mm;align-items:flex-start"><table style="flex:1"><tbody>${bloecke.map(b => b.g
        ? `<tr><td colspan="2" style="background:none"><b>${esc(b.g.name || 'Teil')}</b></td><td class="r nw" style="background:none"><b>${fmtZ(saSumme(sa, s.id, b.cats) ?? 0)} / ${fmtZ(b.cats.reduce((a, c) => a + (zahl(c.max) || 0), 0))}</b></td></tr>`
          + b.cats.map(c => `<tr><td style="width:10pt"></td><td>${esc(c.name)}</td><td class="r nw">${fmtZ(zahl(p[c.id])) || '–'} / ${fmtZ(zahl(c.max))}</td></tr>`).join('')
        : `<tr><td colspan="2"><b>${esc(b.cats[0].name)}</b></td><td class="r nw"><b>${fmtZ(zahl(p[b.cats[0].id])) || '–'} / ${fmtZ(zahl(b.cats[0].max))}</b></td></tr>`).join('')}</tbody></table>
        <div class="kz" style="grid-template-columns:1fr;width:38mm;margin:0"><div><b>${fmtZ(e.punkte)} / ${fmtZ(e.max)}</b><span>Punkte · ${fmtZ(e.pct, 1)} %</span></div><div><b>${notePill(e.note)}</b><span>${NOTEN_TEXT[e.note - 1]}${sa.useLevels ? ' · ' + NIVEAUS[saNiveau(sa, s.id)].name : ''}</span></div></div></div></div>`; }).join('')
    + `<style>.zettel { break-inside: avoid; padding: 0 0 8mm; margin-bottom: 8mm; border-bottom: .8pt dashed #c7c7cc; } .zettel tbody tr:nth-child(even) td { background: none; }</style>`;
}

registerModule({
  id: 'schularbeiten', title: 'Schularbeiten', icon: '📝',
  render(el) {
    if (kursWahl(this, el, seitenTitel('dokument', '#af52de', 'Schularbeiten'))) return;
    const mod = this;
    el.innerHTML = `<div class="page sa-page">
      <div class="pagehead">${seitenTitel('dokument', '#af52de', 'Schularbeiten')}<div id="saKs"></div></div>
      <div id="saBody"></div></div>`;
    const body = el.querySelector('#saBody');
    el.querySelector('#saKs').appendChild(kursPfad(mod, el));
    /** Vorauswahl: die gewählte SA, sonst die letzte bereits geschriebene, sonst die nächste geplante */
    const aktuell = () => { const k = aktKlasse(), f = aktFach(k), l = saVonKurs(k, f), h = todayISO();
      return l.find(x => x.id === mod._sa) || [...l].reverse().find(x => (x.datum || '') <= h) || l[0]; };
    const hatPunkte = sa => Object.keys(sa.punkte || {}).some(sid => saSumme(sa, sid) != null);
    const geplant = sa => (sa.datum || '') > todayISO() && !hatPunkte(sa);

    const draw = () => {
      const k = aktKlasse(); if (!k) { body.innerHTML = '<p class="muted">Zuerst eine Klasse anlegen.</p>'; return; }
      const f = aktFach(k), liste = saVonKurs(k, f), sa = aktuell();
      mod._sa = sa?.id;
      body.innerHTML = `<div class="toolbar">
          ${liste.length ? `<label>Schularbeit <select id="saSel">${liste.map(x => `<option value="${x.id}" ${x.id === sa.id ? 'selected' : ''}>${esc(saTitel(x))} – ${fmtDate(x.datum)}${geplant(x) ? ' (geplant)' : ''}</option>`).join('')}</select></label>` : ''}
          <button class="btn primary" id="saNeu">+ Neue Schularbeit</button>
          ${sa ? `<button class="btn" id="saXlsx">Excel herunterladen</button><button class="btn" id="saDruckL" title="Ergebnisliste mit Notenspiegel (Querformat)">Ergebnisliste drucken</button><button class="btn" id="saDruckZ" title="Ein Abschnitt pro Kind zum Ausschneiden / Beilegen">Rückmeldezettel</button><button class="btn danger" id="saDel">Löschen</button>` : ''}
          <label class="btn" title="Datei aus dem bisherigen Programm „Schularbeitspunkte“ übernehmen">Alte Schularbeit übernehmen<input type="file" id="saImp" accept=".xlsx" hidden></label>
        </div>
        <div id="saNeuBox"></div>
        ${sa ? (geplant(sa) ? `<div class="card sa-geplant">📅 <b>Geplant für ${new Date(sa.datum + 'T00:00').toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' })}${sa.zeit ? ', ' + sa.zeit : ''}</b> – steht im <a href="#/kalender">Kalender</a>. Kategorien und Notenschlüssel kannst du schon vorbereiten, Punkte nach der Schularbeit eintragen.</div>` : '')
          : `<div class="card"><p>Für <b>${esc(k.name)} · ${esc(f.name)}</b> gibt es noch keine Schularbeit.</p><p class="muted small">„+ Neue Schularbeit“ legt eine an – im Voraus (geplant) oder nachträglich. Sie erscheint automatisch im Kalender.</p></div>`}
        <div id="saMain"></div>`;
      if (sa) zeichneSA(sa, k, f);
    };

    /* ---------- eine Schularbeit ---------- */
    const zeichneSA = (sa, k, f) => {
      const kids = sortSchueler(kursSchueler(k, f));
      kids.forEach(s => { sa.niveau[s.id] ||= niveauVon(s); });
      const gruppe = gid => sa.cats.filter(c => c.groupId === gid);
      const bloecke = () => [...sa.groups.map(g => ({ g, cats: gruppe(g.id) })), ...sa.cats.filter(c => !c.groupId).map(c => ({ g: null, cats: [c] }))];
      const nivs = sa.useLevels ? ['ahs', 'std'] : ['ahs'];
      const main = body.querySelector('#saMain');
      const catZeile = c => `<div class="catrow" data-cat="${c.id}">
          <input data-cf="name" value="${esc(c.name)}" placeholder="Bezeichnung">
          <input class="num" data-cf="max" value="${esc(fmtZ(zahl(c.max)))}" inputmode="decimal"> <span class="muted small">P.</span>
          ${sa.groups.length ? `<select data-cf="groupId"><option value="">– keine –</option>${sa.groups.map(g => `<option value="${g.id}" ${g.id === c.groupId ? 'selected' : ''}>${esc(g.name || '(ohne Namen)')}</option>`).join('')}</select>` : ''}
          <button class="x" data-delcat title="Kategorie löschen">×</button></div>`;
      const bs = bloecke(), m = saMax(sa);
      main.innerHTML = `
        <div class="sa-grid">
          <section class="card">
            <h2>Angaben</h2>
            <div class="row"><label class="f">Nr. <input class="num" data-info="nr" value="${esc(sa.nr)}"></label>
              <label class="f grow">Thema (optional) <input data-info="titel" value="${esc(sa.titel)}" placeholder="z.B. Erzählung"></label>
              <label class="f">Datum <input type="date" data-info="datum" value="${sa.datum}"></label></div>
            <h2>Kategorien <span class="muted small" id="saMaxT">Gesamt: ${fmtZ(m)} P.</span></h2>
            <div class="cats">${sa.groups.map(g => `<div class="cgroup" data-gid="${g.id}">
                <div class="ghead"><input class="gname" data-gf="name" value="${esc(g.name)}" placeholder="Oberkategorie, z.B. Text">
                  <span class="muted small">Σ ${fmtZ(gruppe(g.id).reduce((a, c) => a + (zahl(c.max) || 0), 0))} P.</span>
                  <button class="btn small" data-addsub>+ Unterkategorie</button><button class="x" data-delgrp title="Oberkategorie löschen">×</button></div>
                ${gruppe(g.id).map(catZeile).join('')}</div>`).join('')}
              ${sa.cats.filter(c => !c.groupId).map(catZeile).join('')}</div>
            <div class="row"><button class="btn small" id="saAddGrp">+ Oberkategorie</button><button class="btn small" id="saAddCat">+ Einzelkategorie</button></div>
          </section>
          <section class="card">
            <h2>Notenschlüssel</h2>
            <div class="row"><select id="saMode"><option value="percent" ${sa.scaleMode === 'percent' ? 'selected' : ''}>in Prozent</option><option value="points" ${sa.scaleMode === 'points' ? 'selected' : ''}>in Punkten</option></select>
              <label class="chk small"><input type="checkbox" id="saLevels" ${sa.useLevels ? 'checked' : ''}> zwei Niveaus (AHS / Standard)</label></div>
            <div class="scales">${nivs.map(niv => { const gr = saGrenzen(sa, niv); return `<div class="scale">
              ${sa.useLevels ? `<h3>${NIVEAUS[niv].name}</h3>` : ''}
              <table class="tbl">${[0, 1, 2, 3].map(i => `<tr><td class="left"><span class="grade gr${i + 1}">${i + 1}</span> ${NOTEN_TEXT[i]}</td>
                <td>ab <input class="num" data-niv="${niv}" data-i="${i}" value="${esc(fmtZ(zahl(sa.scales[niv][i])))}"> ${sa.scaleMode === 'percent' ? '%' : 'P.'}</td>
                <td class="muted small">${sa.scaleMode === 'percent' ? fmtZ(gr[i]) + ' P.' : (m ? fmtZ(gr[i] / m * 100, 1) + ' %' : '')}</td></tr>`).join('')}
                <tr><td class="left"><span class="grade gr5">5</span> ${NOTEN_TEXT[4]}</td><td class="muted">darunter</td><td></td></tr></table></div>`; }).join('')}</div>
          </section>
        </div>
        <section class="card nopad scroll">
          <table class="tbl sa-tab">
            <thead><tr><th class="left fix-name" ${sa.groups.length ? 'rowspan="2"' : ''}>Name</th>${sa.useLevels ? `<th ${sa.groups.length ? 'rowspan="2"' : ''}>Niveau</th>` : ''}
              ${bs.map(b => b.g ? `<th class="gh" colspan="${b.cats.length + 1}">${esc(b.g.name || 'Oberkategorie')}</th>` : `<th ${sa.groups.length ? 'rowspan="2"' : ''}>${esc(b.cats[0].name)}<br><span class="muted">/ ${fmtZ(zahl(b.cats[0].max))}</span></th>`).join('')}
              <th class="fix-sum" ${sa.groups.length ? 'rowspan="2"' : ''}>Gesamt</th><th class="fix-pct" ${sa.groups.length ? 'rowspan="2"' : ''}>%</th><th class="fix-note" ${sa.groups.length ? 'rowspan="2"' : ''}>Note</th></tr>
              ${sa.groups.length ? `<tr>${bs.filter(b => b.g).map(b => b.cats.map(c => `<th>${esc(c.name)}<br><span class="muted">/ ${fmtZ(zahl(c.max))}</span></th>`).join('') + `<th class="gs">Σ</th>`).join('')}</tr>` : ''}
            </thead>
            <tbody>${kids.map((s, r) => `<tr data-s="${s.id}">
              <td class="left nowrap fix-name"><a href="#/akte" data-akte="${s.id}">${esc(s.nachname)} ${esc(s.vorname)}</a></td>
              ${sa.useLevels ? `<td><select data-niveau>${Object.entries(NIVEAUS).map(([key, n]) => `<option value="${key}" ${saNiveau(sa, s.id) === key ? 'selected' : ''}>${n.kurz}</option>`).join('')}</select></td>` : ''}
              ${bs.map(b => b.cats.map((c, ci) => `<td><input class="pt" data-p="${c.id}" data-r="${r}" data-c="${bs.flatMap(x => x.cats).indexOf(c)}" value="${esc(fmtZ(zahl(sa.punkte[s.id]?.[c.id])))}" inputmode="decimal"></td>`).join('') + (b.g ? `<td class="gs" data-gsum="${b.g.id}"></td>` : '')).join('')}
              <td class="sum fix-sum" data-sum></td><td class="muted fix-pct" data-pct></td><td class="fix-note" data-note></td></tr>`).join('') || `<tr><td class="muted">Keine Schüler:innen in diesem Kurs.</td></tr>`}
            </tbody></table>
        </section>
        <p class="muted small">Enter springt zur nächsten Zeile. Kommazahlen mit Komma oder Punkt. Die Noten erscheinen automatisch in der Schülerakte und in der Kursübersicht (Aufzeichnungen).</p>
        <section class="card sa-auswertung"><h2>Auswertung</h2><div class="sa-ausw-grid"><div class="sa-kz" id="saStats"></div><div class="sa-spiegel" id="saSpiegel"></div></div></section>`;
      zeilen(sa);
    };
    const zeilen = sa => {
      const k = aktKlasse(), f = aktFach(k), main = body.querySelector('#saMain'); if (!main) return;
      main.querySelectorAll('tbody tr[data-s]').forEach(tr => {
        const sid = tr.dataset.s, e = saErgebnis(sa, sid);
        tr.querySelector('[data-sum]').textContent = e ? `${fmtZ(e.punkte)} / ${fmtZ(e.max)}` : '–';
        tr.querySelector('[data-pct]').textContent = e && e.pct != null ? fmtZ(e.pct, 1) + ' %' : '';
        tr.querySelector('[data-note]').innerHTML = e && e.note ? `<span class="grade gr${e.note}">${e.note}</span>` : '';
        tr.querySelectorAll('[data-gsum]').forEach(td => { const v = saSumme(sa, sid, sa.cats.filter(c => c.groupId === td.dataset.gsum)); td.textContent = v == null ? '–' : fmtZ(v); });
        tr.querySelectorAll('input[data-p]').forEach(inp => {
          const c = sa.cats.find(x => x.id === inp.dataset.p), v = zahl(inp.value);
          inp.classList.toggle('err', (inp.value.trim() && v == null) || (v != null && (v < 0 || v > (zahl(c.max) ?? Infinity))));
        });
      });
      // Statistik & Notenspiegel
      const kids = kursSchueler(k, f), fertig = kids.map(s => ({ s, e: saErgebnis(sa, s.id) })).filter(x => x.e);
      const nivs = sa.useLevels ? ['ahs', 'std'] : ['ahs'];
      const spiegel = nivs.map(niv => { const ns = fertig.filter(x => saNiveau(sa, x.s.id) === niv).map(x => x.e.note); const cnt = [0, 0, 0, 0, 0]; ns.forEach(n => cnt[n - 1]++); return { niv, cnt, n: ns.length, avg: ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null }; });
      const avgP = fertig.length ? fertig.reduce((a, x) => a + x.e.punkte, 0) / fertig.length : null, m = saMax(sa);
      main.querySelector('#saStats').innerHTML = `<div class="stat"><b>${fertig.length} / ${kids.length}</b><span>bewertet</span></div>
        ${spiegel.map(sp => `<div class="stat"><b>${sp.avg == null ? '–' : fmtZ(sp.avg)}</b><span>Notenschnitt${sa.useLevels ? ' ' + NIVEAUS[sp.niv].kurz + ` (${sp.n})` : ''}</span></div>`).join('')}
        <div class="stat"><b>${avgP == null ? '–' : fmtZ(avgP, 1)}</b><span>Ø Punkte (von ${fmtZ(m)})</span></div>
        <div class="stat"><b>${avgP == null || !m ? '–' : fmtZ(avgP / m * 100, 1) + ' %'}</b><span>Ø Prozent</span></div>`;
      // Notenspiegel als schmale Säulen – bei zwei Niveaus nebeneinander
      main.querySelector('#saSpiegel').innerHTML = spiegel.map(sp => { const mx = Math.max(1, ...sp.cnt); return `<div class="sp2">
        <h3>Notenspiegel${sa.useLevels ? ' ' + NIVEAUS[sp.niv].name : ''} <span class="muted">· ${sp.n} ${sp.n === 1 ? 'Kind' : 'Kinder'}</span></h3>
        <div class="sp2-saeulen">${sp.cnt.map((c, i) => `<div class="sp2-s" title="${NOTEN_TEXT[i]}: ${c}"><b>${c || ''}</b><i class="gr${i + 1}" style="height:${c ? Math.max(6, c / mx * 100) : 0}%"></i><span class="grade gr${i + 1}">${i + 1}</span></div>`).join('')}</div></div>`; }).join('');
    };

    /* ---------- Excel ---------- */
    const excel = async sa => {
      if (!window.XLSX) await ladeSkript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      const k = aktKlasse(), f = aktFach(k), kids = sortSchueler(kursSchueler(k, f)), cats = [...sa.groups.flatMap(g => sa.cats.filter(c => c.groupId === g.id)), ...sa.cats.filter(c => !c.groupId)];
      const kopf = ['Nachname', 'Vorname', ...(sa.useLevels ? ['Niveau'] : []), ...cats.map(c => `${c.name} (/${fmtZ(zahl(c.max))})`), 'Gesamt', 'Max.', 'Prozent', 'Note', 'Notentext'];
      const zeilenX = kids.map(s => { const e = saErgebnis(sa, s.id); return [s.nachname, s.vorname, ...(sa.useLevels ? [NIVEAUS[saNiveau(sa, s.id)].name] : []), ...cats.map(c => zahl(sa.punkte[s.id]?.[c.id])), e?.punkte ?? null, saMax(sa), e?.pct != null ? Math.round(e.pct * 10) / 10 : null, e?.note ?? null, e?.note ? NOTEN_TEXT[e.note - 1] : '']; });
      const ws = XLSX.utils.aoa_to_sheet([[`${k.name} · ${f.name} · ${saTitel(sa)} · ${fmtDate(sa.datum)}`], [], kopf, ...zeilenX]);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Punkte');
      XLSX.writeFile(wb, `SA${sa.nr}_${k.name}_${f.name}.xlsx`.replace(/[\\/:*?"<>|\s]+/g, '_'));
    };
    /* ---------- Übernahme aus dem alten Programm ---------- */
    const uebernehmen = (alt, k, f) => {
      const sa = neueSA(k, f, { groups: alt.groups || [], cats: alt.cats, scaleMode: alt.scaleMode || 'percent', scales: alt.scales || { ahs: [...NIVEAUS.ahs.pct], std: [...NIVEAUS.std.pct] }, useLevels: alt.useLevels !== false });
      sa.cats = alt.cats; sa.groups = alt.groups || [];
      if (alt.info?.nr) sa.nr = alt.info.nr; if (alt.info?.datum) sa.datum = alt.info.datum;
      const norm = t => t.toLowerCase().replace(/\s+/g, ' ').trim(), kids = kursSchueler(k, f), offen = [];
      (alt.students || []).filter(x => x.name).forEach(x => {
        const s = kids.find(s => [norm(s.vorname + ' ' + s.nachname), norm(s.nachname + ' ' + s.vorname), norm(s.nachname + ', ' + s.vorname)].includes(norm(x.name)));
        if (!s) { offen.push(x.name); return; }
        sa.punkte[s.id] = { ...x.pts }; if (x.niveau) sa.niveau[s.id] = x.niveau === 'std' ? 'std' : 'ahs';
      });
      state.schularbeiten.push(sa); mod._sa = sa.id; save(); draw();
      toast(offen.length ? `Übernommen – nicht zugeordnet: ${offen.join(', ')}` : 'Schularbeit übernommen');
    };

    /* ---------- Ereignisse ---------- */
    const sa = () => state.schularbeiten.find(x => x.id === mod._sa);
    el.addEventListener('click', e => {
      const t = e.target, k = aktKlasse(), f = k && aktFach(k);
      const ak = t.closest('[data-akte]'); if (ak) { state.aktSchueler = ak.dataset.akte; state.akteTab = k.id + '|' + f.id; state.akteNav = { k: k.id, f: f.id, schritt: 'akte' }; save(); return; }
      if (t.id === 'saNeu') {
        const box = body.querySelector('#saNeuBox'); if (box.innerHTML) { box.innerHTML = ''; return; }
        const anzahl = saVonKurs(k, f).length;
        box.innerHTML = `<form class="card sa-neu" id="saNeuF"><h3>Neue Schularbeit – ${esc(k.name)} · ${esc(f.name)}</h3>
          <div class="row"><label class="f">Datum <input type="date" name="datum" value="${todayISO()}" required></label>
            <label class="f">Uhrzeit (optional) <input type="time" name="zeit"></label>
            <label class="f" style="width:80px">Nr. <input name="nr" value="${anzahl + 1}"></label>
            <label class="f grow">Thema (optional) <input name="titel" placeholder="z.B. Erzählung"></label></div>
          <p class="muted small">${anzahl ? 'Kategorien und Notenschlüssel werden von der letzten Schularbeit übernommen.' : 'Mit Standard-Kategorien – du kannst sie danach anpassen.'} Die Schularbeit erscheint automatisch im Kalender.</p>
          <div class="row"><button class="btn primary">Anlegen</button><button type="button" class="btn" id="saNeuAbbr">Abbrechen</button></div></form>`;
        box.querySelector('[name=datum]').focus(); return;
      }
      if (t.id === 'saNeuAbbr') { body.querySelector('#saNeuBox').innerHTML = ''; return; }
      const s = sa(); if (!s) return;
      if (t.id === 'saDel' && confirm(`${saTitel(s)} mit allen Punkten löschen?`)) { state.schularbeiten = state.schularbeiten.filter(x => x !== s); mod._sa = null; save(); draw(); }
      if (t.id === 'saXlsx') excel(s).catch(err => toast(err.message));
      if (t.id === 'saDruckL') druckFenster(`${saTitel(s)} ${k.name} ${f.name}`, saDruckListe(s, k, f), { quer: true });
      if (t.id === 'saDruckZ') { if (!kursSchueler(k, f).some(x => saErgebnis(s, x.id))) return toast('Noch keine Punkte eingetragen'); druckFenster(`${saTitel(s)} – Rückmeldungen`, saDruckZettel(s, k, f)); }
      if (t.id === 'saAddGrp') { const g = { id: uid(), name: '' }; s.groups.push(g); s.cats.push({ id: uid(), name: '', max: 10, groupId: g.id }); save(); draw(); }
      if (t.id === 'saAddCat') { s.cats.push({ id: uid(), name: '', max: 10, groupId: '' }); save(); draw(); }
      if (t.closest('[data-addsub]')) { const gid = t.closest('[data-gid]').dataset.gid, last = s.cats.map(c => c.groupId).lastIndexOf(gid); s.cats.splice(last + 1, 0, { id: uid(), name: '', max: 10, groupId: gid }); save(); draw(); }
      if (t.closest('[data-delcat]')) { const id = t.closest('[data-cat]').dataset.cat; if (!confirm('Kategorie samt eingetragenen Punkten löschen?')) return; s.cats = s.cats.filter(c => c.id !== id); save(); draw(); }
      if (t.closest('[data-delgrp]')) { const gid = t.closest('[data-gid]').dataset.gid; if (!confirm('Oberkategorie löschen? Die Unterkategorien bleiben als Einzelkategorien erhalten.')) return; s.groups = s.groups.filter(g => g.id !== gid); s.cats.forEach(c => { if (c.groupId === gid) c.groupId = ''; }); save(); draw(); }
    });
    el.addEventListener('input', e => {
      const s = sa(), t = e.target; if (!s) return;
      if (t.dataset.p) { const sid = t.closest('tr').dataset.s; (s.punkte[sid] ||= {})[t.dataset.p] = t.value.trim(); save(); zeilen(s); }
      if (t.dataset.info) { s[t.dataset.info] = t.value; save(); }
      if (t.dataset.cf === 'name' || t.dataset.cf === 'max') { s.cats.find(c => c.id === t.closest('[data-cat]').dataset.cat)[t.dataset.cf] = t.value; save(); }
      if (t.dataset.gf) { s.groups.find(g => g.id === t.closest('[data-gid]').dataset.gid).name = t.value; save(); }
      if (t.dataset.niv) { s.scales[t.dataset.niv][+t.dataset.i] = t.value; save(); zeilen(s); }
    });
    el.addEventListener('submit', e => {
      if (e.target.id !== 'saNeuF') return; e.preventDefault();
      const fo = e.target, k = aktKlasse(), f = aktFach(k);
      const n = schularbeitAnlegen(k, f, { datum: fo.datum.value, zeit: fo.zeit.value, titel: fo.titel.value.trim(), nr: fo.nr.value.trim() });
      mod._sa = n.id; draw(); toast(`${saTitel(n)} angelegt${(n.datum > todayISO()) ? ' (geplant) – steht im Kalender' : ''}`);
    });
    el.addEventListener('change', async e => {
      if (e.target.dataset?.info === 'datum') { draw(); return; }
      const s = sa(), t = e.target, k = aktKlasse(), f = k && aktFach(k);
      if (t.id === 'saSel') { mod._sa = t.value; draw(); return; }
      if (t.id === 'saImp' && t.files[0]) {
        try {
          if (!window.XLSX) await ladeSkript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
          const wb = XLSX.read(await t.files[0].arrayBuffer()), raw = XLSX.utils.sheet_to_json(wb.Sheets['_Daten'], { header: 1 })[1][0];
          uebernehmen(JSON.parse(raw), k, f);
        } catch (err) { toast('Diese Datei stammt nicht aus „Schularbeitspunkte“'); }
        t.value = ''; return;
      }
      if (!s) return;
      if (t.dataset.cf === 'name' || t.dataset.cf === 'max' || t.dataset.gf || t.dataset.niv || t.dataset.info === 'nr') { draw(); return; } // Kopf & Summen neu
      if (t.dataset.cf === 'groupId') { s.cats.find(c => c.id === t.closest('[data-cat]').dataset.cat).groupId = t.value; save(); draw(); }
      if (t.dataset.niveau !== undefined) { s.niveau[t.closest('tr').dataset.s] = t.value; save(); zeilen(s); }
      if (t.id === 'saMode') { s.scaleMode = t.value; save(); draw(); }
      if (t.id === 'saLevels') { s.useLevels = t.checked; save(); draw(); }
    });
    el.addEventListener('keydown', e => {
      const t = e.target; if (!t.dataset.p || !['Enter', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      // links/rechts nur am Rand des Eintrags (oder wenn alles markiert ist) – sonst bewegt sich der Cursor im Feld
      const ganz = t.selectionStart === 0 && t.selectionEnd === t.value.length;
      if (e.key === 'ArrowLeft' && !(ganz || t.selectionStart === 0)) return;
      if (e.key === 'ArrowRight' && !(ganz || t.selectionEnd === t.value.length)) return;
      e.preventDefault();
      const r = +t.dataset.r + (e.key === 'ArrowUp' ? -1 : e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 0 : 1);
      const c = +t.dataset.c + (e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0);
      const n = body.querySelector(`input.pt[data-r="${r}"][data-c="${c}"]`);
      if (n) { n.focus(); n.select(); }
    });
    draw();
  },
});
