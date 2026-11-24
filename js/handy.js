'use strict';
/* ===== Handy-Steuerung (Laptop-Seite): Symbol in der Kopfzeile, Einstellungen, Befehle ausführen, Beamer-Status melden =====
   Das Handy ist eine Fernbedienung: Es sieht nur, was hier ausdrücklich freigegeben wird. */

const Handy = (() => {
  if (!SERVER) return { an: () => {} };
  let H = { aktiv: false, pin: false, adressen: [], verbunden: 0 }, iv = null, infoAlt = '', statusAlt = '', zaehler = 0;
  const api = async (daten) => {
    const r = await fetch('/api/handy', daten ? { method: 'POST', body: JSON.stringify(daten) } : {});
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.fehler || 'Fehler ' + r.status); return j;
  };

  /* ---------- Symbol in der Kopfzeile ---------- */
  const btn = document.createElement('button');
  btn.className = 'iconbtn handybtn'; btn.id = 'handyBtn'; btn.title = 'Handy-Steuerung';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg><i class="handy-punkt"></i>';
  document.getElementById('tclock').before(btn);
  const punkt = () => { btn.classList.toggle('an', H.aktiv); btn.classList.toggle('verbunden', H.aktiv && H.verbunden > 0); btn.title = H.aktiv ? `Handy-Steuerung an${H.verbunden ? ' · Handy verbunden' : ''}` : 'Handy-Steuerung'; };

  /* ---------- Fenster ---------- */
  const fenster = async () => {
    document.getElementById('handyPanel')?.remove();
    try { H = await api(); } catch (e) { return toast('⚠️ Hilfsdienst neu starten („Schulzentrale starten“), damit die Handy-Steuerung verfügbar ist'); }
    const p = document.createElement('div'); p.id = 'handyPanel'; p.className = 'handy-panel';
    const url = H.adressen[0];
    p.innerHTML = `<div class="hp-kopf"><b>Handy-Steuerung</b><button class="x" data-hp="zu">×</button></div>
      ${!H.pin ? `<p class="small">Steuere den Beamer vom Handy aus und trag Mitarbeit beim Herumgehen ein. Zuerst eine <b>PIN</b> festlegen – ohne sie kommt niemand hinein.</p>
        <form class="row" data-hp="pinform"><input type="password" inputmode="numeric" name="pin" placeholder="PIN (4–8 Ziffern)" maxlength="8" autocomplete="new-password" required><button class="btn primary">Festlegen</button></form>`
      : `<label class="hp-schalter"><input type="checkbox" data-hp="schalter" ${H.aktiv ? 'checked' : ''}><span></span><b>${H.aktiv ? 'Eingeschaltet' : 'Ausgeschaltet'}</b></label>
        ${H.aktiv ? (url ? `<div class="hp-qr"><div id="hpQr"></div><div><p class="small">Mit der Handy-Kamera scannen, PIN eingeben – fertig. Tipp: danach „Zum Home-Bildschirm“ hinzufügen.</p>
            <code>${esc(url)}</code>${H.adressen.length > 1 ? `<p class="muted small">Andere Netze: ${H.adressen.slice(1).map(esc).join(' · ')}</p>` : ''}
            <p class="small"><b>${H.verbunden ? '🟢 Handy verbunden' : '⚪ Noch kein Handy aktiv'}</b> <span class="muted">· ${H.angemeldet} angemeldet</span></p></div></div>`
          : '<p class="warnbox card small">Kein WLAN gefunden. Laptop mit dem WLAN oder dem Hotspot des Handys verbinden.</p>')
        : '<p class="muted small">Einschalten, dann erscheint der QR-Code zum Verbinden.</p>'}
        <details class="hp-mehr"><summary>Mehr</summary>
          <form class="row" data-hp="pinform"><input type="password" inputmode="numeric" name="pin" placeholder="Neue PIN" maxlength="8" autocomplete="new-password" required><button class="btn small">PIN ändern</button></form>
          <button class="btn small" data-hp="abmelden">Alle Handys abmelden</button>
          <p class="muted small">Klappt die Verbindung nicht? Viele Schul-WLANs lassen Geräte nicht miteinander sprechen. Dann den <b>Hotspot am Handy</b> einschalten und den Laptop damit verbinden. Fragt der Mac, ob „ruby“ eingehende Verbindungen annehmen darf: <b>Erlauben</b>.</p>
        </details>`}`;
    document.body.appendChild(p);
    const r = btn.getBoundingClientRect(); p.style.top = r.bottom + 8 + 'px'; p.style.right = Math.max(12, innerWidth - r.right - 10) + 'px';
    if (H.aktiv && url) qrCanvas(url, 600).then(cv => { cv.className = 'qr-cv'; p.querySelector('#hpQr')?.replaceChildren(cv); }).catch(() => {});
    punkt();
  };
  btn.addEventListener('click', e => { e.stopPropagation(); document.getElementById('handyPanel') ? document.getElementById('handyPanel').remove() : fenster(); });
  document.addEventListener('click', e => { const p = document.getElementById('handyPanel'); if (p && !p.contains(e.target)) p.remove(); });
  document.addEventListener('click', async e => {
    const a = e.target.closest('[data-hp]'); if (!a || !a.closest('#handyPanel')) return;
    if (a.dataset.hp === 'zu') { a.closest('#handyPanel').remove(); return; }
    if (a.dataset.hp === 'abmelden' && confirm('Alle Handys abmelden? Sie müssen die PIN neu eingeben.')) { await api({ aktion: 'abmelden' }); toast('Alle Handys abgemeldet'); fenster(); }
  });
  document.addEventListener('change', async e => {
    if (e.target.dataset?.hp !== 'schalter') return;
    try { H = await api({ aktion: e.target.checked ? 'ein' : 'aus' }); starten(); fenster(); } catch (err) { toast('⚠️ ' + err.message); fenster(); }
  });
  document.addEventListener('submit', async e => {
    if (e.target.dataset?.hp !== 'pinform') return; e.preventDefault();
    try { await api({ aktion: 'pin', pin: e.target.pin.value.trim() }); if (!H.pin) await api({ aktion: 'ein' }); toast('🔒 PIN gespeichert'); H = await api(); starten(); fenster(); }
    catch (err) { toast('⚠️ ' + err.message); }
  });

  /* ---------- Was der Beamer gerade zeigt → Fernbedienung am Handy ---------- */
  const sichtbar = el => el && el.offsetParent !== null && !el.disabled;
  const status = () => {
    const m = current || {}, b = { modul: m.id, titel: m.title, knoepfe: [], zeilen: [], raster: null, eingabe: null, geheim: null, reiter: [] };
    const k = (sel, label, art = '') => { const el = document.querySelector(sel); if (sichtbar(el)) b.knoepfe.push({ sel, label: label || el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), art }); };
    const reiter = sel => document.querySelectorAll(sel).forEach(el => { const a = [...el.attributes].find(x => x.name.startsWith('data-')); if (a && sichtbar(el)) b.reiter.push({ sel: `[${a.name}="${a.value}"]`, label: el.textContent.trim(), on: el.classList.contains('on') }); });
    const geheim = (titel, text, extra = '') => { b.geheim = { titel, text, extra }; };
    switch (m.id) {
      case 'timer': k('#tStart', null, 'primary'); k('#tReset', '↺ Zurücksetzen'); document.querySelectorAll('.presets [data-min]').forEach(x => k(`.presets [data-min="${x.dataset.min}"]`, x.dataset.min + ' min')); break;
      case 'punkte': P.teams.forEach((t, i) => { if (document.querySelector(`[data-pm="${i}"]`)) b.zeilen.push({ label: `${t.emoji} ${t.name}`, wert: t.score, farbe: t.farbe, knoepfe: [{ sel: `[data-pm="${i}"][data-n="-1"]`, label: '−1' }, { sel: `[data-pm="${i}"][data-n="1"]`, label: '+1', art: 'primary' }] }); }); break;
      case 'quiz': {
        const spiel = document.querySelector('.qplay, .qm-stage, .jp');
        if (!spiel) { state.quizze.forEach(q => b.zeilen.push({ label: q.titel, knoepfe: [['klassisch', 'Klassisch'], ['eins23', '1-2-3'], ['vierGewinnt', '4 gewinnt'], ['rennen', 'Rennen']].map(([p, l]) => ({ sel: `.qzeile[data-q="${q.id}"] [data-play="${p}"]`, label: l })) })); break; }
        ['#qReveal', '#q123Licht', '#qbLos', '#qkLos', '#qLock'].forEach(s => k(s, null, 'primary'));
        k('[data-qb="ok"]', '✓ Richtig', 'ok'); k('[data-qb="nein"]', '✗ Falsch', 'nein'); k('[data-qb="skip"]', '→ Weiter'); k('#qkLoes'); k('#qkNext', null, 'primary'); k('#qbWeiter', null, 'primary');
        document.querySelectorAll('.qm-a[data-a]').forEach(x => k(`.qm-a[data-a="${x.dataset.a}"]`, x.textContent.trim().slice(0, 30)));
        k('#qNext', null, 'primary');
        // Vier gewinnt
        k('#vgLoes', 'Lösung zeigen'); k('#vgRichtig', '✓ Richtig', 'ok'); k('#vgFalsch', '✗ Falsch', 'nein'); k('#vgNochmal', null, 'primary');
        const spalten = [...document.querySelectorAll('.vg-pfeile [data-vgsp]')].filter(sichtbar);
        if (spalten.length) b.raster = spalten.map(x => ({ sel: `.vg-pfeile [data-vgsp="${x.dataset.vgsp}"]`, label: 'Spalte ' + (+x.dataset.vgsp + 1) }));
        // Quiz-Rennen
        k('#rnLoes', 'Auflösen', 'primary');
        document.querySelectorAll('[data-rnteam]').forEach(x => k(`[data-rnteam="${x.dataset.rnteam}"]`, (x.classList.contains('on') ? '✓ ' : '') + x.textContent.replace(/^✓\s*/, '').trim()));
        k('#rnWeiter', 'Losfahren →', 'primary'); k('#rnNochmal', null, 'primary');
        document.querySelectorAll('.qteam[data-team]').forEach(x => { const t = P.teams.find(y => y.id === x.dataset.team); if (t && sichtbar(x)) b.zeilen.push({ label: `${t.emoji} ${t.name}`, wert: t.score, farbe: t.farbe, knoepfe: [{ sel: `.qteam[data-team="${t.id}"]`, label: '+' + (x.dataset.wert || 1), art: 'primary' }] }); });
        const g = Modules.quiz._geheim; if (g) geheim('Lösung', g.loesung || '–', g.frage);
        k('#qEnd', '✕ Quiz beenden');
        break;
      }
      case 'wortspiele': {
        reiter('#wsTabs [data-wtab]');
        const W2 = Modules.wortspiele, tab = W2._tab, s = W2._ss?.[tab];
        if (tab === 'galgen') { if (W2._g && !W2._g.ende) { geheim('Gesuchtes Wort', W2._g.wort); b.raster = [...document.querySelectorAll('.gm-tasten [data-b]')].filter(sichtbar).map(x => ({ sel: `[data-b="${x.dataset.b}"]`, label: x.dataset.b })); } k('#gmZufall', '🎲 Zufallswort'); k('#gmNochmal', null, 'primary'); }
        if (tab === 'tabu') { k('#tsLos', null, 'primary'); k('[data-tk="ok"]', '✓ Richtig', 'ok'); k('[data-tk="tabu"]', '✗ Tabu!', 'nein'); k('[data-tk="skip"]', '⟳ Weiter'); if (s?.karte) geheim(s.karte.wort, s.karte.tabu.join(' · '), 'Verboten:'); }
        if (tab === 'activity') { k('#tsLos', null, 'primary'); k('#tsUhr', null, 'primary'); k('[data-ak="ok"]', '✓ Erraten', 'ok'); k('[data-ak="nein"]', '✗ Nicht erraten', 'nein'); k('[data-ak="neu"]', '⟳ Andere Karte'); if (s?.karte) geheim(s.karte.wort, ({ erklaeren: '🗣️ Erklären', zeichnen: '✏️ Zeichnen', pantomime: '🤸 Pantomime' })[s.modus] || ''); }
        if (tab === 'wer') { k('#werNeu', null, 'primary'); k('#werAuf', null, 'primary'); k('#werPlus', '+1 Frage', 'primary'); k('#werMinus', '−'); k('#werJa', '🎉 Erraten', 'ok'); k('#werNein', 'Auflösen / Nächste'); if (W2._wer?.wort) geheim('Begriff', W2._wer.wort, `${W2._wer.fragen} Fragen`); }
        if (tab === 'slf') { k('#slfZiehen', null, 'primary'); k('#slfStopp', '✋ Stopp!', 'nein'); }
        if (s) b.zeilen = s.teams.map((t, i) => ({ label: `${t.emoji} ${t.name}${i === s.dran ? ' ⭐' : ''}`, wert: t.score, farbe: t.farbe, knoepfe: [{ sel: `[data-pkt="${i}|-1"]`, label: '−1' }, { sel: `[data-pkt="${i}|1"]`, label: '+1' }] })).filter(() => tab === 'tabu' || tab === 'activity');
        break;
      }
      case 'zufall': reiter('#zTabs [data-tab]'); k('#rSpin', '🎡 Drehen', 'primary'); k('#wGo', '🎲 Würfeln', 'primary'); k('#zGo', '🔢 Neue Zahl', 'primary'); break;
      case 'gruppen': k('#gGo', '🎲 Gruppen bilden', 'primary'); k('[data-gweiter="los"]', '⭐ Wer beginnt?'); break;
      case 'stationen': k('#sStart', null, 'primary'); k('#sPause'); k('#sPlus'); k('#sSkip'); break;
      case 'auftrag': k('#aStart', null, 'primary'); k('#aPlus'); k('#aReset', '↺ Zurücksetzen'); break;
      case 'belohnung': k('[data-plus="1"]', '+1', 'primary'); k('[data-plus="3"]', '+3'); k('[data-plus="5"]', '+5'); k('[data-plus="-1"]', '−1'); break;
      case 'memory': {
        const g = Modules.memory._g; k('#mNochmal', null, 'primary');
        if (g) b.raster = [...document.querySelectorAll('.mem-karte[data-k]')].map(x => ({ sel: `.mem-karte[data-k="${x.dataset.k}"]`, label: x.querySelector('.mem-rueck').textContent, aus: x.classList.contains('auf') || x.classList.contains('weg') }));
        break;
      }
      case 'escape': {
        const g = Modules.escape._g, r = ESC.find(x => x.id === state.aktEscape);
        k('#eStart', '▶ Escape-Room starten', 'primary'); k('#eLos', null, 'primary'); k('#eZeigen', 'Aufgabe am Beamer zeigen'); k('#eTipp', null);
        if (g && g.los && document.querySelector('#eCode')) { b.eingabe = { sel: '#eCode', form: '#eCodeF', label: 'Code der Klasse eingeben', gross: true }; geheim(`Schloss ${g.i + 1}`, r.raetsel[g.i].code, 'Lösungscode'); }
        break;
      }
      case 'brainstorm': if (document.querySelector('#bsIn')) b.eingabe = { sel: '#bsIn', form: '#bsForm', label: 'Begriff zur Tafel schicken' }; break;
      case 'raetsel': { reiter('#rzTabs [data-rztab]'); k('#bzNext', '🎱 Nächster Begriff', 'primary'); const w = state.raetsel.gezogen.at(-1); if (document.querySelector('#bzNext') && w) geheim('Gezogener Begriff', w); break; }
    }
    if (!b.knoepfe.length && !b.zeilen.length && !b.raster && !b.eingabe) document.querySelectorAll('#view .btn.primary[id]').forEach(x => sichtbar(x) && b.knoepfe.length < 6 && b.knoepfe.push({ sel: '#' + x.id, label: x.textContent.trim().slice(0, 40), art: 'primary' }));
    return b;
  };
  /* Daten fürs Handy: Klassenlisten mit heutigen Einträgen, Programme, Termine, Notizen */
  const info = () => {
    const heute = todayISO(), kurse = [];
    state.klassen.forEach(k => k.faecher.forEach(f => {
      const ein = state.eintraege.filter(e => e.k === k.id && e.f === f.id && e.d === heute);
      kurse.push({ id: k.id + '|' + f.id, name: k.name.toLowerCase().includes(f.name.toLowerCase()) ? k.name : `${k.name} · ${f.name}`,
        kids: sortSchueler(kursSchueler(k, f)).map(s => { const c = t => ein.filter(e => e.s === s.id && e.t === t).length; return { id: s.id, n: `${s.vorname} ${s.nachname}`, z: { 'ma+': c('ma+'), 'ma-': c('ma-'), 'hue-': c('hue-'), 'mat-': c('mat-'), notiz: c('notiz') } }; }) });
    }));
    return { foto: window.KorrZiel || null, kurse, programme: SPIELE.map(a => ({ hash: a.href, titel: a.title })),
      termine: naechsteTermine(14, 8).map(t => ({ titel: t.titel, wann: `${terminZeit(t)} · ${wannText(t.d)}`, farbe: TKATS[t.kat]?.farbe })),
      notizen: (state.notizen || []).filter(n => !n.erledigt).slice(0, 12).map(n => n.text) };
  };

  /* ---------- Befehle vom Handy ausführen ---------- */
  const ausfuehren = b => {
    if (b.typ === 'klick') { const el = document.querySelector(b.sel); if (sichtbar(el)) el.click(); }
    else if (b.typ === 'eingabe') { const el = document.querySelector(b.sel), f = document.querySelector(b.form); if (el && f) { el.value = String(b.wert || '').slice(0, 200); el.dispatchEvent(new Event('input', { bubbles: true })); f.requestSubmit(); } }
    else if (b.typ === 'gehe') { if (/^#\/[a-z]+(\/[a-z]+)?$/.test(b.hash) && Modules[b.hash.slice(2).split('/')[0]]) location.hash = b.hash; }
    else if (b.typ === 'eintrag') {
      if (b.loeschen) { state.eintraege = state.eintraege.filter(e => e.id !== b.loeschen); save(); return; }
      const [kid, fid] = String(b.kurs || '').split('|'), k = klasse(kid), f = k?.faecher.find(x => x.id === fid);
      if (!k || !f || !kursSchueler(k, f).some(s => s.id === b.s) || !ET[b.t]) return;
      state.eintraege.push({ id: String(b.id || uid()).slice(0, 30), k: k.id, f: f.id, s: b.s, d: todayISO(), t: b.t, n: String(b.n || '').slice(0, 300) });
      save();
    }
  };
  const runde = async () => {
    try {
      const r = await fetch('/api/handy/befehle'); const liste = await r.json();
      liste.forEach(b => { try { ausfuehren(b); } catch (e) { /* einzelner Befehl schlägt fehl – egal */ } });
      if (liste.length || ++zaehler % 2 === 0) {
        await new Promise(x => setTimeout(x, liste.length ? 250 : 0));
        const s = JSON.stringify(status()), daten = { beamer: JSON.parse(s) };
        if (zaehler % 8 === 0 || liste.some(b => b.typ === 'eintrag')) { const i = JSON.stringify(info()); if (i !== infoAlt) { infoAlt = i; daten.info = JSON.parse(i); } }
        if (s !== statusAlt || daten.info || zaehler % 6 === 0) { statusAlt = s; await fetch('/api/handy/status', { method: 'POST', body: JSON.stringify(daten) }); }
      }
      if (zaehler % 20 === 0) { H = await api(); punkt(); if (!H.aktiv) stoppen(); }
    } catch (e) { /* Hilfsdienst kurz weg – nächste Runde */ }
  };
  const starten = () => { punkt(); if (H.aktiv && !iv) { infoAlt = ''; zaehler = 7; iv = setInterval(runde, 400); runde(); } if (!H.aktiv) stoppen(); };
  const stoppen = () => { clearInterval(iv); iv = null; punkt(); };
  if (serverOk) api().then(h => { H = h; starten(); }).catch(() => {});
  return { an: () => H.aktiv };
})();
