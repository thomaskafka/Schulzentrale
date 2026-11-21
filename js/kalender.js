'use strict';
/* ===== Kalender: wichtige Termine, Ferien & schulfreie Tage, Schularbeiten automatisch ===== */

state.termine ||= [];   // { id, d, bis?, zeit?, titel, kat, kurs?, notiz?, quelle? }
const TKATS = {
  sa: { name: 'Schularbeit', farbe: '#af52de' },
  test: { name: 'Test / SÜ', farbe: '#5e5ce6' },
  konferenz: { name: 'Konferenz / Besprechung', farbe: '#007aff' },
  eltern: { name: 'Eltern / Sprechtag', farbe: '#34c759' },
  ausflug: { name: 'Ausflug / Projekt', farbe: '#ff9500' },
  frist: { name: 'Abgabe / Frist', farbe: '#ff3b30' },
  frei: { name: 'Ferien / schulfrei', farbe: '#8e8e93' },
  sonst: { name: 'Sonstiges', farbe: '#30b0c7' },
};
const MONATE = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Alle Termine inkl. Schularbeiten (aus dem Programm „Schularbeiten“) */
function alleTermine() {
  const sas = (state.schularbeiten || []).filter(sa => sa.datum).map(sa => {
    const k = klasse(sa.k), f = k?.faecher.find(x => x.id === sa.f);
    // „1AB Deutsch“ enthält das Fach schon – sonst „Deutsch 1A“
    const kurs = k && f && k.name.toLowerCase().includes(f.name.toLowerCase()) ? k.name : [f?.name, k?.name].filter(Boolean).join(' ');
    return { id: 'sa-' + sa.id, d: sa.datum, zeit: sa.zeit || '', titel: `${sa.nr ? sa.nr + '. ' : ''}SA ${kurs}${sa.titel ? ' – ' + sa.titel : ''}`, kat: 'sa', kurs: sa.k, auto: true };
  });
  return [...state.termine, ...sas];
}
/** Neue Schularbeit anlegen – Kategorien & Notenschlüssel wie bei der letzten SA des Kurses, Nummer nach Datum */
function schularbeitAnlegen(k, f, { datum, zeit = '', titel = '', nr = null }) {
  const alle = saVonKurs(k, f), sa = neueSA(k, f, alle[alle.length - 1]);
  Object.assign(sa, { datum: datum || todayISO(), zeit, titel: /^(\d+\.?\s*)?(schularbeit|sa)$/i.test(titel) ? '' : titel,
    nr: nr ?? String(alle.filter(x => (x.datum || '') <= (datum || todayISO())).length + 1) });
  state.schularbeiten.push(sa); save(); return sa;
}
/** Schularbeit im Programm „Schularbeiten“ öffnen */
function zurSchularbeit(sa) {
  state.aktKlasse = sa.k; state.aktFach = sa.f; save();
  Object.assign(Modules.schularbeiten, { _sa: sa.id, _direkt: true });
  location.hash = '#/schularbeiten';
}
const terminAm = (t, iso) => t.d === iso || (t.bis && t.d <= iso && iso <= t.bis);
/** Nächste Termine ab heute (laufende mehrtägige inklusive) */
function naechsteTermine(tage = 30, max = 6) {
  const heute = todayISO(), bis = todayISO(new Date(Date.now() + tage * 864e5));
  return alleTermine().filter(t => (t.bis || t.d) >= heute && t.d <= bis).sort((a, b) => (a.d + (a.zeit || '')).localeCompare(b.d + (b.zeit || ''))).slice(0, max);
}
/** Ferien & schulfreie Tage eines Schuljahres als Termine eintragen (nur was noch fehlt) */
function ferienInKalender(y) {
  const sj = schuljahrDaten(y), q = 'schuljahr-' + y; let n = 0;
  const add = (d, bis, titel) => { if (state.termine.some(t => t.quelle === q && t.d === d && t.titel === titel)) return; state.termine.push({ id: uid(), d, bis, titel, kat: 'frei', quelle: q }); n++; };
  sj.ferien.forEach(f => add(f.von, f.bis, f.titel));
  sj.frei.forEach(f => { if (!sj.ferien.some(x => x.von <= f.d && f.d <= x.bis)) add(f.d, null, f.titel); });
  add(sj.beginn, null, 'Schulbeginn'); add(sj.sem2, null, 'Beginn 2. Semester');
  save(); return n;
}
const terminKurs = id => klasse(id)?.name || '';
const terminZeit = t => `${t.bis && t.bis !== t.d ? `${fmtDate(t.d).slice(0, -4)} – ${fmtDate(t.bis)}` : fmtDate(t.d)}${t.zeit ? ', ' + t.zeit : ''}`;
/** „heute“, „morgen“, „in 5 Tagen“ */
function wannText(iso) {
  const h = new Date(todayISO() + 'T00:00'), d = new Date(iso + 'T00:00'), n = Math.round((d - h) / 864e5);
  return n < 0 ? 'läuft' : n === 0 ? 'heute' : n === 1 ? 'morgen' : n < 7 ? d.toLocaleDateString('de-AT', { weekday: 'long' }) : `in ${n} Tagen`;
}

registerModule({
  id: 'kalender', title: 'Kalender', icon: '📅',
  render(el) {
    const mod = this;
    const heute = new Date();
    mod._m ??= heute.getMonth(); mod._y ??= heute.getFullYear(); mod._ansicht ||= 'monat';
    let edit = null, neuDatum = todayISO();

    el.innerHTML = `<div class="page kal">
      <div class="pagehead">${seitenTitel('termin', '#ff3b30', 'Kalender')}
        <div class="row"><div class="seg" id="kAns"><button data-ans="monat">Monat</button><button data-ans="liste">Liste</button></div></div></div>
      <div class="kal-layout">
        <section class="card kal-main" id="kMain"></section>
        <aside class="kal-side">
          <section class="card" id="kForm"></section>
          <section class="card"><h2>Demnächst</h2><div id="kNext"></div></section>
        </aside>
      </div></div>`;
    const $ = id => el.querySelector('#' + id);
    const frei = iso => alleTermine().some(t => t.kat === 'frei' && terminAm(t, iso));

    const chip = t => `<button class="kchip" data-t="${t.id}" style="--k:${TKATS[t.kat]?.farbe || '#999'}" title="${esc(t.titel)}${t.zeit ? ' · ' + t.zeit : ''}${t.kurs ? ' · ' + esc(terminKurs(t.kurs)) : ''}">${esc(t.titel)}${t.zeit ? ` <i>${esc(t.zeit)}</i>` : ''}</button>`;
    const monat = () => {
      const y = mod._y, m = mod._m, erster = new Date(y, m, 1), start = new Date(erster);
      start.setDate(1 - ((erster.getDay() + 6) % 7));
      const tage = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
      while (tage.length > 35 && tage[tage.length - 7].getMonth() !== m) tage.splice(-7);
      const T = alleTermine(), hISO = todayISO();
      $('kMain').innerHTML = `<div class="kal-kopf"><button class="btn" data-mon="-1">‹</button><h2>${MONATE[m]} ${y}</h2><button class="btn" data-mon="1">›</button><button class="btn small" data-mon="0">Heute</button></div>
        <div class="kal-grid">${WTAGE.map(w => `<div class="kal-wt">${w}</div>`).join('')}
        ${tage.map(d => { const iso = todayISO(d), ts = T.filter(t => terminAm(t, iso) && !(t.kat === 'frei' && t.bis)).sort((a, b) => (a.zeit || '').localeCompare(b.zeit || ''));
          const fer = T.find(t => t.kat === 'frei' && t.bis && terminAm(t, iso));
          return `<div class="kal-tag ${d.getMonth() !== m ? 'aussen' : ''} ${iso === hISO ? 'heute' : ''} ${fer || frei(iso) || d.getDay() % 6 === 0 ? 'frei' : ''}" data-tag="${iso}">
            <span class="kal-nr">${d.getDate()}</span>${fer && (iso === fer.d || d.getDay() === 1 || d.getDate() === 1) ? `<span class="kal-ferien" data-t="${fer.id}">${esc(fer.titel)}</span>` : ''}
            ${ts.slice(0, 3).map(chip).join('')}${ts.length > 3 ? `<span class="muted small">+${ts.length - 3} weitere</span>` : ''}</div>`; }).join('')}</div>
        <div class="kal-legende">${Object.entries(TKATS).map(([k, c]) => `<span><i style="background:${c.farbe}"></i>${c.name}</span>`).join('')}</div>`;
    };
    const liste = () => {
      const von = todayISO(new Date(mod._y, mod._m, 1)), T = alleTermine().filter(t => (t.bis || t.d) >= von).sort((a, b) => (a.d + (a.zeit || '')).localeCompare(b.d + (b.zeit || ''))).slice(0, 80);
      let mon = '';
      $('kMain').innerHTML = `<div class="kal-kopf"><button class="btn" data-mon="-1">‹</button><h2>ab ${MONATE[mod._m]} ${mod._y}</h2><button class="btn" data-mon="1">›</button><button class="btn small" data-mon="0">Heute</button></div>
        ${T.length ? `<ul class="kal-liste">${T.map(t => { const d = new Date(t.d + 'T00:00'), mk = MONATE[d.getMonth()] + ' ' + d.getFullYear(), kopf = mk !== mon ? `<li class="kal-mon">${mk}</li>` : ''; mon = mk;
          return kopf + `<li data-t="${t.id}" style="--k:${TKATS[t.kat]?.farbe}"><span class="kl-d"><b>${d.getDate()}.</b> ${d.toLocaleDateString('de-AT', { weekday: 'short' })}</span>
            <span class="kl-t"><b>${esc(t.titel)}</b><span class="muted small">${t.bis ? 'bis ' + fmtDate(t.bis) + ' · ' : ''}${t.zeit ? esc(t.zeit) + ' · ' : ''}${TKATS[t.kat]?.name || ''}${t.kurs ? ' · ' + esc(terminKurs(t.kurs)) : ''}${t.notiz ? ' · ' + esc(t.notiz) : ''}</span></span></li>`; }).join('')}</ul>`
          : '<p class="muted">Keine Termine ab diesem Monat.</p>'}`;
    };
    /** Fächer der gewählten Klasse/Gruppe (für Schularbeiten) */
    const fachOptionen = (kursId, gewaehlt) => { const k = klasse(kursId); return k ? k.faecher.map(f => `<option value="${f.id}" ${f.id === gewaehlt ? 'selected' : ''}>${esc(f.name)}</option>`).join('') : ''; };
    const formular = (v = null) => {
      // Schularbeit aus dem Programm „Schularbeiten“ bearbeiten
      if (edit && edit.startsWith('sa-')) {
        const sa = state.schularbeiten.find(x => 'sa-' + x.id === edit); if (!sa) { edit = null; return formular(); }
        const k = klasse(sa.k), f = k?.faecher.find(x => x.id === sa.f), mitPunkten = Object.keys(sa.punkte || {}).some(sid => saSumme(sa, sid) != null);
        $('kForm').innerHTML = `<h2>Schularbeit</h2>
          <p class="kal-sa-kopf" style="--k:${TKATS.sa.farbe}"><b>${esc(saTitel(sa))}</b><span>${esc(k?.name || '')} · ${esc(f?.name || '')}${mitPunkten ? ' · Punkte eingetragen' : ' · noch keine Punkte'}</span></p>
          <form id="kF" class="kal-form" data-sa="${sa.id}">
            <div class="row"><label class="f">Datum <input type="date" name="d" value="${sa.datum}" required></label>
              <label class="f">Uhrzeit <input type="time" name="zeit" value="${sa.zeit || ''}"></label></div>
            <div class="row"><label class="f" style="flex:0 0 80px">Nr. <input name="nr" value="${esc(sa.nr || '')}"></label>
              <label class="f grow">Thema (optional) <input name="titel" value="${esc(sa.titel || '')}" placeholder="z.B. Erzählung"></label></div>
            <div class="row"><button class="btn primary">Speichern</button><button type="button" class="btn" id="kSaOffen">Zur Bewertung →</button><button type="button" class="btn" id="kAbbr">Abbrechen</button></div>
            ${mitPunkten ? '' : '<button type="button" class="linkbtn" id="kSaDel">Schularbeit löschen</button>'}
          </form>`;
        return;
      }
      const t = edit ? state.termine.find(x => x.id === edit) : null, w = v || t || {}, kat = w.kat || 'sonst';
      $('kForm').innerHTML = `<h2>${t ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
        <form id="kF" class="kal-form">
          <div class="row"><label class="f grow">Art <select name="kat">${Object.entries(TKATS).map(([k, c]) => `<option value="${k}" ${kat === k ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label></div>
          <input name="titel" placeholder="${kat === 'sa' ? 'Thema (optional), z.B. Erzählung' : 'Was? z.B. Elternsprechtag'}" value="${esc(w.titel || '')}" ${kat === 'sa' ? '' : 'required'}>
          <div class="row"><label class="f">Datum <input type="date" name="d" value="${w.d || neuDatum}" required></label>
            <label class="f" ${kat === 'sa' ? 'hidden' : ''}>bis (optional) <input type="date" name="bis" value="${w.bis || ''}"></label>
            <label class="f">Uhrzeit <input type="time" name="zeit" value="${w.zeit || ''}"></label></div>
          <div class="row"><label class="f grow">Klasse / Gruppe ${kat === 'sa' ? '' : '(optional)'} <select name="kurs"><option value="">–</option>${state.klassen.map(k => `<option value="${k.id}" ${(w.kurs || (kat === 'sa' ? state.aktKlasse : '')) === k.id ? 'selected' : ''}>${esc(k.name)}</option>`).join('')}</select></label>
            <label class="f grow" ${kat === 'sa' ? '' : 'hidden'}>Fach <select name="fach">${fachOptionen(w.kurs || state.aktKlasse, state.aktFach)}</select></label></div>
          ${kat === 'sa' && !t ? '<p class="kal-hinweis">Wird als Schularbeit angelegt (Kategorien & Notenschlüssel wie bei der letzten SA) und erscheint unter <b>Schularbeiten</b> zur Bewertung.</p>' : ''}
          <textarea name="notiz" rows="2" placeholder="Notiz (optional)" ${kat === 'sa' && !t ? 'hidden' : ''}>${esc(w.notiz || '')}</textarea>
          <div class="row"><button class="btn primary">${t ? 'Speichern' : kat === 'sa' ? '+ Schularbeit anlegen' : '+ Eintragen'}</button>${t ? '<button type="button" class="btn" id="kAbbr">Abbrechen</button><button type="button" class="btn danger" id="kDel">Löschen</button>' : ''}</div>
        </form>
        ${state.termine.some(x => x.kat === 'frei') ? '' : `<p class="muted small">Tipp: Ferien & Feiertage lassen sich unter <a href="#/einstellungen">Einstellungen → Schuljahr</a> automatisch eintragen.
          <button class="linkbtn" id="kFerien">Jetzt eintragen</button></p>`}`;
    };
    const naechste = () => {
      const T = naechsteTermine(45, 10);
      $('kNext').innerHTML = T.length ? `<ul class="kal-next">${T.map(t => `<li data-t="${t.id}" style="--k:${TKATS[t.kat]?.farbe}"><b>${esc(t.titel)}</b><span class="muted small">${terminZeit(t)} · ${wannText(t.d)}</span></li>`).join('')}</ul>` : '<p class="muted small">In den nächsten Wochen nichts eingetragen.</p>';
    };
    const draw = () => {
      el.querySelectorAll('#kAns button').forEach(b => b.classList.toggle('on', b.dataset.ans === mod._ansicht));
      (mod._ansicht === 'liste' ? liste : monat)(); formular(); naechste();
    };

    el.addEventListener('click', e => {
      const t = e.target;
      const a = t.closest('[data-ans]'); if (a) { mod._ansicht = a.dataset.ans; draw(); return; }
      const mn = t.closest('[data-mon]');
      if (mn) { const d = +mn.dataset.mon; if (!d) { mod._m = heute.getMonth(); mod._y = heute.getFullYear(); } else { const x = new Date(mod._y, mod._m + d, 1); mod._m = x.getMonth(); mod._y = x.getFullYear(); } draw(); return; }
      const tr = t.closest('[data-t]');
      if (tr) {
        const id = tr.dataset.t;
        edit = id; formular(); $('kForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); $('kForm').querySelector('input').focus(); return;
      }
      const tag = t.closest('[data-tag]'); if (tag) { edit = null; neuDatum = tag.dataset.tag; formular(); $('kForm').querySelector('input').focus(); return; }
      if (t.id === 'kAbbr') { edit = null; formular(); return; }
      if (t.id === 'kSaOffen') { const sa = state.schularbeiten.find(x => 'sa-' + x.id === edit); if (sa) zurSchularbeit(sa); return; }
      if (t.id === 'kSaDel') { const sa = state.schularbeiten.find(x => 'sa-' + x.id === edit); if (sa && confirm(`${saTitel(sa)} löschen?`)) { state.schularbeiten = state.schularbeiten.filter(x => x !== sa); edit = null; save(); draw(); } return; }
      if (t.id === 'kDel') { const x = state.termine.find(y => y.id === edit); if (x && confirm(`„${x.titel}“ löschen?`)) { state.termine = state.termine.filter(y => y !== x); edit = null; save(); draw(); } return; }
      if (t.id === 'kFerien') { const n = ferienInKalender(schuljahrJahr()); toast(`${n} Ferien & schulfreie Tage eingetragen (${bundesland().name})`); draw(); }
    });
    // Art/Klasse geändert → Formular anpassen (Fach-Auswahl bei Schularbeiten)
    el.addEventListener('change', e => {
      const f = e.target.form; if (!f || f.id !== 'kF' || f.dataset.sa) return;
      if (e.target.name === 'kat') {
        formular({ kat: e.target.value, titel: f.titel.value, d: f.d.value, bis: f.bis.value, zeit: f.zeit.value, kurs: f.kurs.value, notiz: f.notiz.value });
        return;
      }
      if (e.target.name === 'kurs') f.fach.innerHTML = fachOptionen(e.target.value, state.aktFach);
    });
    el.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      // Schularbeit bearbeiten
      if (f.dataset.sa) {
        const sa = state.schularbeiten.find(x => x.id === f.dataset.sa); if (!sa) return;
        Object.assign(sa, { datum: f.d.value, zeit: f.zeit.value, nr: f.nr.value.trim(), titel: f.titel.value.trim() });
        edit = null; save(); draw(); toast('Schularbeit geändert'); return;
      }
      // Neue Schularbeit direkt anlegen
      if (f.kat.value === 'sa' && !edit) {
        const k = klasse(f.kurs.value), fa = k?.faecher.find(x => x.id === f.fach.value);
        if (!k || !fa) return toast('Für eine Schularbeit bitte Klasse/Gruppe und Fach wählen');
        const sa = schularbeitAnlegen(k, fa, { datum: f.d.value, zeit: f.zeit.value, titel: f.titel.value.trim() });
        neuDatum = sa.datum; const dd = new Date(sa.datum + 'T00:00'); mod._m = dd.getMonth(); mod._y = dd.getFullYear();
        draw(); toast(`${saTitel(sa)} angelegt – zu finden unter Schularbeiten`); return;
      }
      const d = { titel: f.titel.value.trim(), d: f.d.value, bis: f.bis.value && f.bis.value > f.d.value ? f.bis.value : null, zeit: f.zeit.value, kat: f.kat.value, kurs: f.kurs.value || null, notiz: f.notiz.value.trim() };
      if (!d.titel || !d.d) return;
      if (edit) Object.assign(state.termine.find(x => x.id === edit), d); else state.termine.push({ id: uid(), ...d });
      edit = null; neuDatum = d.d; save();
      const dd = new Date(d.d + 'T00:00'); mod._m = dd.getMonth(); mod._y = dd.getFullYear();
      draw(); toast('Eingetragen');
    });
    draw();
  },
});
