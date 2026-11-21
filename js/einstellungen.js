'use strict';
/* ===== Einstellungen: Datenspeicherung & Sicherung, Schuljahr & Semester, Schuljahreswechsel, WebUntis ===== */

registerModule({
  id: 'einstellungen', title: 'Einstellungen', icon: '⚙️',
  render(el) {
    const E = state.einstellungen, mod = this;
    const y = schuljahrJahr(), sj = schuljahrDaten(y);
    el.innerHTML = `<div class="page einst">
      <div class="pagehead">${seitenTitel('regler', '#8e8e93', 'Einstellungen')}</div>
      ${SERVER ? '' : location.protocol === 'https:' ? `<div class="card"><h2>📱 iPad-Modus</h2><p>Die Daten liegen auf diesem Gerät. Mit dem Knopf <b>⇅ Abgleich</b> oben tauschst du sie über OneDrive mit dem Mac aus.</p><button class="btn primary" onclick="abgleichDialog()">⇅ Abgleich öffnen</button></div>` : `<div class="card warnbox">⚠️ Die Seite ist gerade direkt als Datei geöffnet. Stundenplan und das Speichern in eine Datei funktionieren nur,
        wenn du sie per Doppelklick auf <b>„Schulzentrale starten“</b> öffnest.<br>Tipp: Unten unter „Datensicherung“ zuerst <b>exportieren</b> und in der neuen Ansicht wieder <b>importieren</b> – dann ist alles dabei.</div>`}

      <section class="card">
        <h2>Datenspeicherung</h2>
        <p id="eStatus">${SERVER ? (serverOk ? '✅ Alle Daten werden automatisch in <code>Schulzentrale/daten/schulstart.json</code> gespeichert, jeden Tag zusätzlich eine Sicherungskopie (30 Tage) in <code>daten/sicherungen</code>.' : '⚠️ Hilfsdienst antwortet nicht – Daten liegen nur im Browser.') : 'Daten liegen nur im Browser-Speicher dieses Browsers.'}</p>
        <div class="row"><button class="btn" id="eExport">⬇ Alle Daten exportieren (Sicherung)</button>
        <label class="btn">⬆ Sicherung importieren<input type="file" id="eImport" accept=".json" hidden></label></div>
      </section>

      ${SERVER ? `<section class="card">
        <h2>📱 Abgleich mit dem iPad (OneDrive)</h2>
        <p class="muted small">Der Mac legt nach jeder Änderung seinen Stand in einen OneDrive-Ordner und übernimmt automatisch, was am iPad eingetragen wurde. Am iPad: Knopf <b>⇅ Abgleich</b>.</p>
        <div id="eAbgleich" class="muted">Lade …</div>
      </section>` : ''}

      ${SERVER && serverOk ? `<section class="card">
        <h2>Automatische Sicherung auf Festplatte / USB-Stick</h2>
        <p class="muted small">Zusätzlich zur Sicherung im Programmordner wird laufend eine Kopie in einen Ordner deiner Wahl geschrieben – z.B. auf eine externe Festplatte,
          einen USB-Stick oder in iCloud Drive / OneDrive. Ist der Ordner gerade nicht verfügbar (Stick abgesteckt), wird die Sicherung automatisch nachgeholt, sobald er wieder da ist.</p>
        <div id="eExtern" class="muted">Lade …</div>
        <details class="restore"><summary>Ältere Sicherung wiederherstellen</summary><div id="eLokal" class="muted small">Lade …</div></details>
      </section>` : ''}

      <section class="card">
        <h2>Schuljahr ${schuljahrName(y)}</h2>
        <div class="einst-grid">
          <label class="f">Bundesland (für Ferien & Semester)
            <select id="eBl"><option value="">– bitte wählen –</option>${Object.entries(BUNDESLAENDER).map(([k, b]) => `<option value="${k}" ${E.bundesland === k ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
          <label class="f">Erster Schultag
            <input type="date" id="eStart" value="${schulbeginn()}"></label>
          <label class="f">Beginn 2. Semester ${E.semester2 ? '<button class="linkbtn" id="eSemAuto" title="Wieder automatisch berechnen">automatisch</button>' : '<span class="muted small">(automatisch)</span>'}
            <input type="date" id="eSem2" value="${sem2Beginn()}"></label>
        </div>
        <details><summary>Ferien & schulfreie Tage ${schuljahrName(y)} (${esc(bundesland().name)}${E.bundesland ? '' : ' – Bundesland noch nicht gewählt'})</summary>
          <ul class="ferienliste">${sj.ferien.map(f => `<li><b>${f.titel}</b> <span>${fmtDate(f.von)} – ${fmtDate(f.bis)}</span></li>`).join('')}
            ${sj.frei.map(f => `<li>${esc(f.titel)} <span>${fmtDate(f.d)}</span></li>`).join('')}</ul>
          <p class="muted small">Nach dem Schulzeitgesetz berechnet – ohne Gewähr. Schulautonome Tage bitte selbst im Kalender eintragen.</p>
          <button class="btn" id="eFerienKal">In den Kalender übernehmen</button></details>
        <div class="row" style="margin-top:14px"><button class="btn" id="eWechsel">Schuljahreswechsel …</button>
          <span class="muted small">Am Schuljahresende: Klassen hochstufen, altes Jahr archivieren, Noten & Aufzeichnungen leeren.</span></div>
        <div id="eWechselBox"></div>
      </section>

      <section class="card">
        <h2>WebUntis-Stundenplan</h2>
        <label class="f">Persönlicher iCal-Link aus WebUntis
          <input id="eIcal" value="${esc(E.icalUrl)}" placeholder="https://….webuntis.com/WebUntis/Ical.do?…" ${SERVER ? '' : 'disabled'}></label>
        <div class="row"><button class="btn primary" id="eIcalTest" ${SERVER ? '' : 'disabled'}>Speichern & testen</button><span id="eIcalRes" class="muted"></span></div>
        <details><summary>So bekommst du den Link</summary><ol>
          <li>WebUntis im Browser öffnen und anmelden.</li>
          <li>Rechts oben auf dein <b>Profil</b> (Name/Symbol) klicken → Reiter <b>„Freigaben“</b>.</li>
          <li>Bei <b>„Zugriff über Kalender (iCal)“</b> bzw. „Persönlicher Kalender-Link“ auf <b>Anzeigen/Erstellen</b> klicken und den Link kopieren.</li>
          <li>Hier einfügen → „Speichern & testen“.</li></ol>
          <p class="muted small">Gibt es den Reiter nicht, hat die Schule die iCal-Freigabe abgeschaltet – dann bitte beim WebUntis-Admin der Schule nachfragen.
          Der Link ist wie ein Passwort: nicht weitergeben. Er wird nur auf diesem Computer gespeichert.</p></details>
      </section>
</div>`;
    const $ = id => el.querySelector('#' + id);
    const neu = () => { const n = el.cloneNode(false); el.replaceWith(n); mod.render(n); };

    /* --- Schuljahr --- */
    $('eBl').onchange = e => {
      E.bundesland = e.target.value; const d = schuljahrDaten(schuljahrJahr());
      if (E.bundesland && confirm(`Ersten Schultag (${fmtDate(d.beginn)}) und Semesterbeginn (${fmtDate(d.sem2)}) für ${BUNDESLAENDER[E.bundesland].name} übernehmen?`)) { E.schulbeginn = d.beginn; delete E.semester2; }
      save(); neu();
    };
    $('eStart').onchange = e => { E.schulbeginn = e.target.value; save(); neu(); toast('Gespeichert'); };
    $('eSem2').onchange = e => { E.semester2 = e.target.value; save(); neu(); toast('Gespeichert'); };
    if ($('eSemAuto')) $('eSemAuto').onclick = () => { delete E.semester2; save(); neu(); };
    $('eFerienKal').onclick = () => { const n = ferienInKalender(schuljahrJahr()); toast(n ? `${n} Einträge im Kalender ergänzt` : 'Schon alles im Kalender'); };
    $('eWechsel').onclick = () => schuljahrWechselZeigen($('eWechselBox'));

    /* --- Export / Import --- */
    $('eExport').onclick = () => download(`Schulzentrale_Sicherung_${todayISO()}.json`, JSON.stringify(state, null, 1), 'application/json');
    $('eImport').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      let d; try { d = JSON.parse(await f.text()); } catch (err) { return toast('Das ist keine gültige Sicherungsdatei'); }
      if (!d || !Array.isArray(d.klassen)) return toast('Das ist keine Sicherung der Schulzentrale');
      if (!confirm(`Sicherung „${f.name}“ importieren?\nDie aktuellen Daten werden dabei ersetzt.`)) return;
      Object.keys(state).forEach(k => delete state[k]);
      Object.assign(state, defaultState(), d);
      save(); if (serverOk) await saveServer();
      toast('Importiert – Seite wird neu geladen'); setTimeout(() => location.reload(), 900);
    };
    if (!SERVER) return;

    /* --- Externe Sicherung & Wiederherstellen --- */
    const sicherung = async (daten) => {
      const r = await fetch('/api/sicherung', daten ? { method: 'POST', body: JSON.stringify(daten) } : {});
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).fehler || 'Fehler ' + r.status);
      return r.json();
    };
    const zeigeSicherung = s => {
      const box = $('eExtern'); if (!box) return;
      box.className = '';
      box.innerHTML = s.extern
        ? `<div class="sich-status ${s.verbunden ? 'ok' : 'weg'}"><b>${s.verbunden ? '✅ Aktiv' : '⏸ Ordner gerade nicht erreichbar'}</b>
             <code>${esc(s.extern)}</code><span class="muted small">${s.letzte ? 'Letzte Sicherung: ' + esc(s.letzte.replace(/(\d+)-(\d+)-(\d+)/, (m, a, b, c) => `${+c}.${+b}.${a}`)) : 'Noch keine Sicherung'}${s.verbunden ? '' : ' · wird nachgeholt, sobald der Ordner wieder da ist'}</span></div>
           <div class="row"><button class="btn primary" data-sich="jetzt" ${s.verbunden ? '' : 'disabled'}>Jetzt sichern</button><button class="btn" data-sich="ordner">Anderen Ordner wählen …</button><button class="btn danger" data-sich="entfernen">Ausschalten</button></div>`
        : `<div class="row"><button class="btn primary" data-sich="ordner">Sicherungsordner wählen …</button><span class="muted small">Es öffnet sich das Mac-Fenster zur Ordnerauswahl (evtl. hinter dem Browser).</span></div>`;
      const lok = $('eLokal');
      if (lok) lok.innerHTML = s.lokal.length ? `<table class="tbl"><tbody>${s.lokal.map(b => `<tr><td class="left">${esc(b.name.replace(/\.json$/, ''))}</td><td class="muted">${esc(b.zeit.replace(/(\d+)-(\d+)-(\d+)/, (m, a, c, d) => `${+d}.${+c}.${a}`))}</td><td class="muted">${b.kb} KB</td>
          <td><button class="btn small" data-restore="${esc(b.name)}">Wiederherstellen</button></td></tr>`).join('')}</tbody></table>
          <p class="muted small">Beim Wiederherstellen wird der aktuelle Stand vorher noch einmal gesichert („vor-wiederherstellung-…“) – es geht also nichts verloren.</p>
          ${s.archiv.length ? `<p class="small">Archivierte Schuljahre in <code>daten/archiv</code>: ${s.archiv.map(esc).join(', ')}</p>` : ''}` : 'Noch keine Sicherungen vorhanden.';
    };
    if (serverOk) sicherung().then(zeigeSicherung).catch(e => { const b = $('eExtern'); if (b) b.textContent = '⚠️ ' + e.message + ' – bitte „Schulzentrale starten“ neu öffnen, damit die neue Version des Hilfsdienstes läuft.'; });
    const abgleichZeigen = async () => {
      const box = $('eAbgleich'); if (!box) return;
      const st = await fetch('/api/abgleich').then(r => r.json()).catch(() => null);
      if (!st || st.fehler) { box.textContent = '⚠️ Hilfsdienst bitte über „Schulzentrale starten“ neu starten.'; return; }
      box.innerHTML = st.ordner
        ? `<p>✅ Aktiv – Ordner <code>${esc(st.ordner.replace(/^\/Users\/[^/]+/, '~'))}</code></p>
           <p class="small">Mac-Stand zuletzt geschrieben: ${abZeit(st.mac_zeit)} · iPad-Stand: ${st.ipad_zeit ? abZeit(st.ipad_zeit) + (st.ipad_neu ? ' <b>(neu – wird gleich übernommen)</b>' : ' (übernommen)') : 'noch keiner'}</p>
           <div class="row"><button class="btn" data-abg="jetzt">Jetzt nach iPad-Daten schauen</button><button class="btn" data-abg="waehlen">Anderen Ordner …</button><button class="btn" data-abg="aus">Ausschalten</button></div>`
        : `<div class="row"><button class="btn primary" data-abg="">${st.vorschlag ? 'In OneDrive einrichten' : 'Ordner wählen …'}</button>${st.vorschlag ? '<button class="btn" data-abg="waehlen">Anderen Ordner …</button>' : ''}</div>
           ${st.vorschlag ? `<p class="muted small">Legt den Ordner <code>Schulzentrale-Abgleich</code> in deinem OneDrive an.</p>` : ''}`;
    };
    abgleichZeigen();
    el.addEventListener('click', async e => {
      const ab = e.target.closest('[data-abg]');
      if (ab) {
        const v = ab.dataset.abg;
        if (v === 'jetzt') { await abgleichMacPruefen(false); return abgleichZeigen(); }
        if (v === 'aus' && !confirm('Abgleich mit dem iPad ausschalten?')) return;
        if (v === 'waehlen') toast('Bitte im Mac-Fenster einen Ordner wählen …');
        const r = await fetch('/api/abgleich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v === 'aus' ? { aktion: 'aus' } : { aktion: 'einrichten', ordner: v }) }).then(x => x.json()).catch(() => ({ fehler: 'Hilfsdienst nicht erreichbar' }));
        if (r.fehler) toast('⚠️ ' + r.fehler);
        return abgleichZeigen();
      }
      const b = e.target.closest('[data-sich]');
      if (b) {
        if (b.dataset.sich === 'entfernen' && !confirm('Automatische Sicherung in diesen Ordner ausschalten?')) return;
        if (b.dataset.sich === 'ordner') toast('Bitte im Mac-Fenster einen Ordner wählen …');
        b.disabled = true;
        try {
          if (_saveT) { clearTimeout(_saveT); await saveServer(); }
          const s = await sicherung({ aktion: b.dataset.sich });
          zeigeSicherung(s);
          if (s.gesichert) toast('💾 Gesichert'); else if (b.dataset.sich === 'jetzt') toast('⚠️ Ordner nicht erreichbar');
        } catch (err) { toast('⚠️ ' + err.message); b.disabled = false; }
        return;
      }
      const r = e.target.closest('[data-restore]');
      if (r) {
        if (!confirm(`Sicherung „${r.dataset.restore}“ wiederherstellen?\nDer aktuelle Stand wird vorher automatisch gesichert.`)) return;
        try { clearTimeout(_saveT); _saveT = null; await sicherung({ aktion: 'wiederherstellen', name: r.dataset.restore }); localStorage.removeItem(KEY); toast('Wiederhergestellt – Seite wird neu geladen'); setTimeout(() => location.reload(), 800); }
        catch (err) { toast('⚠️ ' + err.message); }
      }
    });

    $('eIcalTest').onclick = async () => {
      E.icalUrl = $('eIcal').value.trim(); save();
      const r = $('eIcalRes'); r.textContent = 'Teste …';
      try {
        const evs = await Untis.laden(true), now = new Date(), n = evs.find(x => x.end > now);
        r.innerHTML = `✅ ${evs.length} Stunden gefunden${n ? ` · nächste: <b>${esc(n.titel || '')}</b> ${n.start.toLocaleString('de-AT', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`;
      } catch (err) { r.textContent = '⚠️ ' + err.message; }
    };
  },
});

/* ===== Schuljahreswechsel ===== */
/** Vorschlag für den neuen Namen: erste Ziffer +1 („1A“ → „2A“, „1AB Deutsch“ → „2AB Deutsch“) */
const naechsterName = n => n.replace(/\d+/, z => String(+z + 1));
const stufe = n => +(n.match(/\d+/) || [0])[0];

function schuljahrWechselZeigen(box) {
  if (box.innerHTML) { box.innerHTML = ''; return; }
  const y = schuljahrJahr(), neuY = y + 1, neuSj = schuljahrDaten(neuY);
  const hoechste = Math.max(4, ...state.klassen.map(k => stufe(k.name)));
  const LOESCHEN = [
    ['eintraege', 'Aufzeichnungen (Mitarbeit, HÜ, Material, Notizen)', true],
    ['tests', 'SÜ, Tests & Noten', true],
    ['schularbeiten', 'Schularbeiten mit Punkten', true],
    ['bewertungen', 'Bewertungsraster-Ergebnisse (die Raster-Vorlagen bleiben)', true],
    ['semesternoten', 'Semesternoten', true],
    ['planung', 'Unterrichtsplanungen', true],
    ['termine', 'Kalender-Termine des alten Schuljahres', true],
    ['belohnung', 'Stände der Belohnungs-Sammler', true],
  ];
  box.innerHTML = `<div class="wechsel">
    <h3>Schuljahreswechsel ${schuljahrName(y)} → ${schuljahrName(neuY)}</h3>
    <p class="small">Zuerst wird automatisch eine <b>vollständige Kopie</b> des alten Schuljahres gespeichert (<code>daten/archiv/Schuljahr-${y}-${String(neuY).slice(2)}.json</code>) –
      sie lässt sich jederzeit über „Sicherung importieren“ wieder ansehen.</p>
    <h4>1. Klassen & Gruppen</h4>
    <table class="tbl"><thead><tr><th>Behalten</th><th class="left">bisher</th><th class="left">neuer Name</th><th class="left">Kinder</th></tr></thead><tbody>
      ${state.klassen.map(k => { const raus = stufe(k.name) >= hoechste && hoechste > 0; return `<tr data-wk="${k.id}">
        <td><input type="checkbox" data-behalten ${raus ? '' : 'checked'}></td><td class="left"><b>${esc(k.name)}</b>${istGruppe(k) ? ' <span class="muted small">Gruppe</span>' : ''}</td>
        <td class="left"><input data-neu value="${esc(naechsterName(k.name))}"></td><td class="left muted small">${schuelerVon(k).length}${raus ? ' · letzte Schulstufe – verlässt die Schule?' : ''}</td></tr>`; }).join('')}</tbody></table>
    <p class="muted small">Fächer, Teilgruppen und Gewichtungen bleiben erhalten. Nicht behaltene Klassen werden mit ihren Kindern entfernt (bleiben aber im Archiv).</p>
    <h4>2. Was soll geleert werden?</h4>
    <div class="wechsel-chk">${LOESCHEN.map(([k, t, an]) => `<label class="chk"><input type="checkbox" data-loesch="${k}" ${an ? 'checked' : ''}> ${t}</label>`).join('')}</div>
    <p class="muted small">Bleiben immer: Raster-Vorlagen, Quiz, Links, Post-its, Brainstormings, Arbeitsaufträge, Wortspiel-Karten, Einstellungen.</p>
    <h4>3. Neues Schuljahr</h4>
    <label class="f">Erster Schultag ${schuljahrName(neuY)} <input type="date" id="wBeginn" value="${neuSj.beginn}" style="max-width:220px"></label>
    <p class="muted small">Das 2. Semester wird automatisch berechnet (${fmtDate(neuSj.sem2)}, ${esc(bundesland().name)}).</p>
    <div class="row"><button class="btn primary" id="wLos">Schuljahr ${schuljahrName(neuY)} beginnen</button><button class="btn" id="wAbbr">Abbrechen</button></div>
  </div>`;
  box.querySelector('#wAbbr').onclick = () => { box.innerHTML = ''; };
  box.querySelector('#wLos').onclick = async () => {
    const zeilen = [...box.querySelectorAll('[data-wk]')].map(tr => ({ k: klasse(tr.dataset.wk), behalten: tr.querySelector('[data-behalten]').checked, name: tr.querySelector('[data-neu]').value.trim() }));
    const weg = zeilen.filter(z => !z.behalten).map(z => z.k.name), loesch = [...box.querySelectorAll('[data-loesch]:checked')].map(c => c.dataset.loesch);
    if (!confirm(`Schuljahr ${schuljahrName(neuY)} beginnen?\n\n• ${zeilen.filter(z => z.behalten).length} Klassen/Gruppen werden umbenannt${weg.length ? `\n• Entfernt: ${weg.join(', ')}` : ''}\n• Geleert: ${loesch.length} Bereiche\n\nVorher wird das alte Schuljahr archiviert.`)) return;
    // 1. Archiv
    try {
      if (serverOk) { clearTimeout(_saveT); await saveServer(); const r = await fetch('/api/sicherung', { method: 'POST', body: JSON.stringify({ aktion: 'archiv', jahr: `${y}-${String(neuY).slice(2)}` }) }); if (!r.ok) throw 0; }
      else download(`Schulzentrale_Schuljahr_${y}-${String(neuY).slice(2)}.json`, JSON.stringify(state, null, 1), 'application/json');
    } catch (e) { if (!confirm('Das Archiv konnte nicht gespeichert werden. Trotzdem fortfahren?')) return; download(`Schulzentrale_Schuljahr_${y}-${String(neuY).slice(2)}.json`, JSON.stringify(state, null, 1), 'application/json'); }
    // 2. Klassen
    zeilen.forEach(z => { if (z.behalten && z.name) z.k.name = z.name; });
    state.klassen = state.klassen.filter(k => zeilen.find(z => z.k === k)?.behalten !== false);
    const da = new Set(schuelerIndex().keys());
    state.klassen.forEach(k => {
      if (istGruppe(k)) k.mitglieder = (k.mitglieder || []).filter(id => da.has(id));
      k.faecher.forEach(f => { if (f.nur) f.nur = f.nur.filter(id => da.has(id)); });
    });
    // 3. Leeren
    const vorBeginn = t => (t.bis || t.d) < box.querySelector('#wBeginn').value;
    loesch.forEach(k => {
      if (k === 'semesternoten') state.semesternoten = {};
      else if (k === 'belohnung') Object.values(state.belohnung || {}).forEach(b => { b.anzahl = 0; b.log = []; });
      else if (k === 'termine') state.termine = (state.termine || []).filter(t => !vorBeginn(t));
      else state[k] = [];
    });
    // 4. Neues Schuljahr
    state.einstellungen.schulbeginn = box.querySelector('#wBeginn').value; delete state.einstellungen.semester2;
    if (state.einstellungen.bundesland) ferienInKalender(neuY);
    state.aktKlasse = state.klassen[0]?.id || null; state.aktFach = null; state.akteNav = { k: null, f: null, schritt: 'klasse' };
    save(); if (serverOk) await saveServer();
    confetti(); toast(`Willkommen im Schuljahr ${schuljahrName(neuY)}! 🎒`);
    setTimeout(() => location.reload(), 1500);
  };
}
