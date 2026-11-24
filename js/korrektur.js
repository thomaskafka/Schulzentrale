'use strict';
/* ===== KI-Korrektur von Schularbeiten per Foto =====
   Ablauf: Lösungsschlüssel (von Claude vorschlagen lassen, du bestätigst) → Fotos pro Kind (Mac oder Handy) →
   Claude markiert auf dem Foto, was richtig/falsch ist → du prüfst, korrigierst Punkte → „Übernehmen“ trägt sie in die Tabelle ein.
   Die Fotos liegen nur im Ordner daten/korrektur/ (Hilfsdienst), nie in der Datenbank. Der API-Schlüssel bleibt im Hilfsdienst. */

const Korrektur = (() => {
  const KS = { kind: 0, st: null, busy: '', demo: false, streng: true, leer: [], leerText: '', timer: null, set: false, sk: undefined, seite: 0, zoom: false, auf: {}, hl: null };
  const post = async daten => {
    const r = await fetch('/api/korrektur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : { fehler: 'Hilfsdienst nicht erreichbar – „Schulzentrale starten“ neu öffnen.' };
    if (d.fehler) throw new Error(d.fehler);
    if (d.verbrauch && KS.st) KS.st.verbrauch = d.verbrauch;
    return d;
  };
  const bildUrl = id => '/api/korrektur/bild?id=' + id;
  const zahlOk = v => zahl(v) ?? 0;

  /* Foto verkleinern (Handschrift bleibt lesbar, Datei bleibt klein) und Helligkeit prüfen */
  const verkleinern = (datei, max = 1600) => new Promise((ok, fehl) => {
    const url = URL.createObjectURL(datei), img = new Image();
    img.onload = () => {
      const f = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * f), h = Math.round(img.naturalHeight * f);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, w, h);
      let hell = 255; try { const d = cx.getImageData(0, 0, w, h).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { s += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; n++; } hell = s / n; } catch (e) { /* egal */ }
      URL.revokeObjectURL(url); ok({ url: cv.toDataURL('image/jpeg', .86), hell });
    };
    img.onerror = () => { URL.revokeObjectURL(url); fehl(new Error('Dieses Foto konnte nicht gelesen werden.')); };
    img.src = url;
  });
  const hochladen = async dateien => {
    const ids = [];
    for (const d of dateien) {
      const v = await verkleinern(d);
      if (v.hell < 85) toast('💡 Foto ist ziemlich dunkel – besser mit mehr Licht neu aufnehmen');
      ids.push((await post({ aktion: 'foto', bild: v.url })).id);
    }
    return ids;
  };

  const kosten = () => { const v = KS.st?.verbrauch; return v ? `bisher ≈ ${(v.usd || 0).toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} US-$ (${v.anfragen} ${v.anfragen === 1 ? 'Anfrage' : 'Anfragen'})` : ''; };

  /* ---------- Punkte je Aufgabe aus den Markierungen ---------- */
  const typVon = (sa, c) => sa.schluessel?.[c.id]?.typ || 'aus';
  /* Freie Texte: Abzug je Fehler (Rechtschreibung/Grammatik standardmäßig 0,5 P.; im Schlüssel einstellbar, 0 = Punkte von Hand) */
  const abzugVon = (sa, c) => { const k = sa.schluessel?.[c.id], v = k && k.abzug != null && k.abzug !== '' ? zahl(k.abzug) : (/rechtschreib|grammatik|^rs\b/i.test(c.name || '') ? 0.5 : 0); return v > 0 ? v : 0; };
  const punkteBerechnen = (sa, a) => {
    const c = sa.cats.find(x => x.id === a.kat_id); if (!c || a.fest) return;
    if (typVon(sa, c) === 'luecken' && a.items.length) a.punkte = Math.round(a.items.filter(i => i.richtig).length / a.items.length * zahlOk(c.max) * 2) / 2;
  };

  function zeige(box, sa, k, f, neuZeichnen) {
    sa.schluessel ||= {}; sa.korr ||= {};
    const kids = sortSchueler(kursSchueler(k, f)), kursId = k.id + '|' + f.id;
    const bearbeitet = box.dataset.sa === sa.id;
    box.dataset.sa = sa.id;
    if (!bearbeitet) KS.kind = Math.min(KS.kind, Math.max(0, kids.length - 1));
    const kid = () => kids[Math.max(0, Math.min(KS.kind, kids.length - 1))];
    const kr = () => { const s = kid(); return s ? (sa.korr[s.id] ||= { fotos: [] }) : null; };
    const fmtP = v => fmtZ(zahl(v));

    /* ----- Einstellungen (eingeklappt, damit die Seite ruhig bleibt) ----- */
    const einstellHtml = () => { const st = KS.st; return `<div class="kz-set">
        <label>Modell <select data-kzmodell>${(st.modelle || []).map(m => `<option value="${m.id}" ${m.id === st.modell ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
        <label class="chk"><input type="checkbox" data-kzstreng ${KS.streng ? 'checked' : ''}> Rechtschreibfehler im Lückenwort zählen als falsch</label>
        ${st.gesetzt ? '' : `<div class="kz-key"><input type="password" data-kzkey placeholder="Claude-Schlüssel (sk-ant-…)" autocomplete="off"><button class="btn primary small" data-kzkeyok>Speichern</button>
          <label class="chk"><input type="checkbox" data-kzdemo ${KS.demo ? 'checked' : ''}> Demo-Modus (erfundene Ergebnisse)</label></div>`}
        <p class="muted small">${esc(kosten())}. Zum Auswerten gehen die Fotos an Claude (Anthropic) – Namen auf dem Blatt am besten abdecken. Du prüfst jede Punktzahl selbst.</p></div>`; };

    /* ----- Lösungsschlüssel ----- */
    const schluesselHtml = () => {
      const cats = sa.cats, fertig = cats.filter(c => typVon(sa, c) !== 'aus').length, offen = KS.sk ?? !sa.schluesselOk;
      return `<div class="kz-sk"><button class="kz-skbar" data-kzsk><b>Lösungsschlüssel</b>
          <span class="kz-badge ${sa.schluesselOk ? 'ok' : 'wait'}">${sa.schluesselOk ? '✓ bestätigt' : 'noch prüfen & bestätigen'}</span>
          <span class="muted small">${fertig} von ${cats.length} Aufgaben</span><span class="kz-pfeil">${offen ? '▾' : '▸'}</span></button>
        ${offen ? `<div class="kz-skbody">
          <div class="kz-erz"><b>Von Claude erstellen lassen</b>
            <div class="row"><label class="btn small">📷 Foto der leeren SA<input type="file" accept="image/*" multiple hidden data-kzleer></label>
              <span class="muted small">${KS.leer.length ? KS.leer.length + ' Foto(s) bereit' : 'oder Aufgabentext einfügen:'}</span></div>
            <textarea rows="2" data-kzleertext placeholder="Aufgabentext (optional)">${esc(KS.leerText)}</textarea>
            <button class="btn primary small" data-kzerz ${KS.busy ? 'disabled' : ''}>${KS.busy === 'erz' ? '⏳ Claude löst die Aufgaben …' : '✨ Schlüssel erstellen'}</button></div>
          ${cats.map(c => { const s = sa.schluessel[c.id] || { typ: 'aus', luecken: [], kriterium: '' };
            return `<div class="kz-aufg" data-cat="${c.id}">
              <div class="kz-ah"><b>${esc(c.name || '(ohne Namen)')}</b><span class="muted small">${fmtZ(zahl(c.max))} P.</span>
                <label class="chk small kz-lrsk" title="Bei Kindern mit LRS zählt diese Kategorie nicht (weder Punkte noch Höchstpunkte)"><input type="checkbox" data-kzlrskat ${lrsKat(c) ? 'checked' : ''}> bei LRS nicht werten</label>
                <select data-kzf="typ"><option value="aus" ${s.typ === 'aus' ? 'selected' : ''}>nicht prüfen</option><option value="luecken" ${s.typ === 'luecken' ? 'selected' : ''}>Lücken / Grammatik</option><option value="text" ${s.typ === 'text' ? 'selected' : ''}>Freier Text</option></select></div>
              ${s.typ === 'luecken' ? `<div class="kz-luecken">${(s.luecken || []).map((l, i) => `<div class="kz-lz" data-li="${i}"><input class="num" data-kzl="nr" value="${esc(l.nr)}" title="Nummer der Lücke"><input data-kzl="loesung" value="${esc(l.loesung)}" placeholder="Lösung"><input data-kzl="alt" value="${esc((l.alternativen || []).join(', '))}" placeholder="auch richtig (Komma)"><button class="x" data-kzldel title="Lücke löschen">×</button></div>`).join('')}
                <button class="btn small" data-kzladd>+ Lücke</button></div>` : ''}
              ${s.typ === 'text' ? `<textarea rows="2" data-kzf="kriterium" placeholder="Was wird erwartet?">${esc(s.kriterium || '')}</textarea>
                <label class="small muted">Abzug pro Fehler <input class="num" data-kzf="abzug" value="${esc(s.abzug != null ? s.abzug : abzugVon(sa, c) ? fmtZ(abzugVon(sa, c)) : '')}" placeholder="0" inputmode="decimal"> P. <span>(0 = Punkte von Hand)</span></label>` : ''}
            </div>`; }).join('')}
          <button class="btn ${sa.schluesselOk ? '' : 'primary'}" data-kzok>${sa.schluesselOk ? '✓ Schlüssel ist bestätigt' : '✓ Schlüssel bestätigen'}</button>
        </div>` : ''}</div>`;
    };

    /* ----- Ergebnis: links das Foto, rechts die Aufgaben ----- */
    const ergebnisHtml = (s, r) => {
      const e = r.ergebnis; if (!e) return '';
      const aus = saAus(sa, s.id);                                                         // LRS: Kategorien, die bei diesem Kind nicht zählen
      const nutz = e.aufgaben.filter(a => sa.cats.some(c => c.id === a.kat_id)), nF = Math.max(1, (r.fotos || []).length);
      const zaehlt = a => !aus.includes(a.kat_id);
      const pg = it => (it.seite >= 1 && it.seite <= nF ? it.seite : 1);                 // Seite eines Hinweises (Notfall: Seite 1)
      const erste = a => a.items.length ? Math.min(...a.items.map(pg)) : 1;               // auf welcher Seite die Aufgabe beginnt
      const summe = nutz.filter(zaehlt).reduce((x, a) => x + zahlOk(a.punkte), 0), max = nutz.filter(zaehlt).reduce((x, a) => x + zahlOk(sa.cats.find(c => c.id === a.kat_id).max), 0);
      const si = Math.max(0, Math.min(KS.seite, nF - 1)), seite = si + 1, id = (r.fotos || [])[si];
      const probleme = n => nutz.filter(zaehlt).reduce((x, a) => x + a.items.filter(it => pg(it) === n && (!it.richtig || it.unsicher)).length, 0);
      /* Karte einer Aufgabe – zeigt nur die Hinweise dieser Seite; ohne Auffälligkeiten eingeklappt */
      const karte = a => { const c = sa.cats.find(x => x.id === a.kat_id), t = typVon(sa, c);
        if (!zaehlt(a)) return `<div class="kz-ak zu lrs" data-ka="${a.kat_id}"><div class="kz-akh"><b>${esc(c.name)}</b><span class="kz-lrstag">LRS · wird nicht gewertet</span></div></div>`;
        const hier = a.items.map((it, ii) => ({ it, ii })).filter(x => pg(x.it) === seite), erst = erste(a) === seite;
        const gut = t === 'luecken' ? hier.filter(x => x.it.richtig && !x.it.unsicher) : [], rest = t === 'luecken' ? hier.filter(x => !(x.it.richtig && !x.it.unsicher)) : hier;
        const zu = t === 'luecken' && !rest.length && !KS.auf[a.kat_id];
        return `<div class="kz-ak ${zu ? 'zu' : ''}" data-ka="${a.kat_id}"><div class="kz-akh" ${t === 'luecken' && !rest.length ? 'data-kzauf' : ''}><b>${esc(c.name)}</b>${t === 'text' ? '<span class="kz-tag">Vorschlag</span>' : ''}${zu ? '<span class="kz-allok">✓ alles richtig</span>' : ''}${erst ? `<span class="kz-pt"><input class="num" data-kzp value="${esc(fmtP(a.punkte))}" inputmode="decimal"><i>/ ${fmtZ(zahl(c.max))}</i></span>` : '<span class="kz-pt muted small">Fortsetzung</span>'}</div>
          ${!zu && erst && a.kommentar ? `<p class="muted small">${esc(a.kommentar)}</p>` : ''}
          ${t === 'text' && abzugVon(sa, c) ? `<p class="muted small">Jeder Fehler −${fmtZ(abzugVon(sa, c))} P. · Hinweis auf ✓ stellen = +${fmtZ(abzugVon(sa, c))} P.</p>` : ''}
          ${zu ? '' : rest.map(({ it, ii }) => `<div class="kz-it ${it.unsicher ? 'u' : it.richtig ? 'r' : 'f'}" data-ki="${ii}" title="Anklicken = Stelle im Foto zeigen"><span class="kz-nr">${esc(it.nr)}</span>
            <span class="kz-ge">${it.gelesen ? esc(it.gelesen) : '<i class="muted">leer</i>'}${it.unsicher ? ' ❓' : ''}</span>${!it.richtig && it.erwartet ? `<span class="kz-er">→ ${esc(it.erwartet)}</span>` : ''}
            ${it.anmerkung && it.anmerkung !== 'leer' ? `<span class="muted small kz-an">${esc(it.anmerkung)}</span>` : ''}<button class="kz-t" data-kzt title="${t === 'luecken' ? 'richtig / falsch umschalten' : 'Anmerkung gilt / gilt nicht'}">${it.richtig ? '✓' : '✗'}</button></div>`).join('')}
          ${!zu && gut.length ? `<div class="kz-gut"><span class="kz-ok">✓ richtig:</span>${gut.map(({ it, ii }) => `<button class="kz-chip" data-kzt data-ki="${ii}" title="Antippen = als falsch markieren">${esc(it.nr)} ${esc(it.gelesen)}</button>`).join('')}</div>` : ''}
          ${!zu && !hier.length ? '<p class="muted small">Keine Auffälligkeiten.</p>' : ''}</div>`; };
      const karten = nutz.filter(a => a.items.some(it => pg(it) === seite) || (seite === 1 && !a.items.length));
      return `<div class="kz-cockpit">
        <div class="kz-tabs">${Array.from({ length: nF }, (_, i) => `<button class="kz-tabbtn ${i === si ? 'on' : ''}" data-kzseite="${i}">Seite ${i + 1}${probleme(i + 1) ? `<span class="kz-nb">${probleme(i + 1)}</span>` : ''}</button>`).join('')}
          <button class="btn small" data-kzzoom>🔍 ${KS.zoom ? 'Ganze Seite' : 'Zoom'}</button>
          <span class="kz-leg"><i class="kz-p r"></i>richtig <i class="kz-p f"></i>falsch <i class="kz-p u"></i>unsicher</span></div>
        ${e.hinweis && e.lesbarkeit !== 'gut' ? `<div class="kz-hinweis">⚠️ ${esc(e.hinweis)}</div>` : ''}
        <div class="kz-seite"><div class="kz-links ${KS.zoom ? 'zoom' : ''}"><div class="kz-img"><img src="${bildUrl(id)}" alt="Seite ${seite}">
            ${nutz.filter(zaehlt).map(a => a.items.map((it, ii) => pg(it) === seite && it.x >= 0 && it.w > 0 ? `<div class="kz-box ${it.unsicher ? 'u' : it.richtig ? 'r' : 'f'}" data-ka="${a.kat_id}" data-ki="${ii}" style="left:${it.x * 100}%;top:${it.y * 100}%;width:${it.w * 100}%;height:${it.h * 100}%" title="${esc(`Nr. ${it.nr}: „${it.gelesen}“ → ${it.erwartet}`)}">${!it.richtig && it.erwartet && typVon(sa, sa.cats.find(c => c.id === a.kat_id)) === 'luecken' ? `<span class="kz-lab">${esc(it.erwartet)}</span>` : ''}</div>` : '').join('')).join('')}</div></div>
          <div class="kz-rechts">${karten.map(karte).join('') || '<p class="muted small">Auf dieser Seite gibt es keine Hinweise.</p>'}</div></div>
        <div class="kz-leiste"><span class="kz-gross">${fmtZ(summe)}</span><span class="kz-von">von ${fmtZ(max)} Punkten</span>
          <button class="btn primary" data-kzuebern>Punkte übernehmen</button><button class="btn" data-kzuebern="weiter">Übernehmen & nächstes Kind ›</button>
          ${r.uebernommen ? '<span class="kz-eingetragen">✓ eingetragen</span>' : ''}</div></div>`;
    };
    const kindHtml = () => {
      const s = kid(); if (!s) return '<p class="muted">Keine Schüler:innen in diesem Kurs.</p>'; const r = kr();
      const fertig = kids.filter(x => sa.korr[x.id]?.uebernommen).length;
      return `<div class="kz-kind"><div class="kz-nav">
          <button class="btn" data-kzk="-1" ${KS.kind ? '' : 'disabled'} title="Voriges Kind">‹</button>
          <select class="kz-name" data-kzwahl>${kids.map((x, j) => { const q = sa.korr[x.id]; return `<option value="${j}" ${x === s ? 'selected' : ''}>${q?.uebernommen ? '✓ ' : q?.ergebnis ? '● ' : q?.fotos?.length ? '📷 ' : ''}${esc(x.vorname)} ${esc(x.nachname)}</option>`; }).join('')}</select>
          <button class="btn" data-kzk="1" ${KS.kind >= kids.length - 1 ? 'disabled' : ''} title="Nächstes Kind">›</button>
          <span class="muted small kz-zaehl">${KS.kind + 1} / ${kids.length} · ${fertig} fertig</span>
          <label class="chk kz-lrs ${s.lrs ? 'an' : ''}" title="Kind mit Lese-Rechtschreib-Schwäche: Rechtschreibung wird nicht gewertet"><input type="checkbox" data-kzlrs ${s.lrs ? 'checked' : ''}> LRS · Rechtschreibung nicht werten</label></div>
        <div class="kz-fotozeile"><div class="kz-fotos">${(r.fotos || []).map((id, i) => `<div class="kz-th2"><img src="${bildUrl(id)}" alt=""><button class="x" data-kzfw="${i}" title="Foto entfernen">×</button></div>`).join('')}
            <button class="kz-add kz-handy" data-kzhandy title="Foto direkt vom Handy aufnehmen">📱<small>Vom Handy</small></button>
            <label class="kz-add" title=""Foto aufnehmen oder auswählen (vom Handy: Reiter „Korrektur“)">＋<small>Foto</small><input type="file" accept="image/*" multiple hidden data-kzfoto></label></div>
          ${KS.handyInfo ? `<div class="kz-handyinfo">📱 Am Handy den Reiter <b>Korrektur</b> öffnen – dort ist <b>${esc(s.vorname)}</b> schon vorgewählt. Foto aufnehmen, es erscheint hier von selbst.</div>` : ''}
          <button class="btn primary kz-go" data-kzauswerten ${KS.busy || !(r.fotos || []).length ? 'disabled' : ''}>${KS.busy === 'aus' ? '⏳ Claude liest … (20–60 s)' : r.ergebnis ? '↻ Neu auswerten' : '🔍 Auswerten'}</button></div>
        ${ergebnisHtml(s, r)}</div>`;
    };
    const kopfHtml = () => {
      const st = KS.st; if (!st) return '<p class="muted small">Lade …</p>';
      return `<div class="kz-kopf"><h2>KI-Korrektur</h2><span class="kz-status ${st.gesetzt ? 'an' : KS.demo ? 'demo' : ''}">${st.gesetzt ? '● Claude verbunden' : KS.demo ? '● Demo-Modus' : '○ kein Schlüssel'}</span>
        <button class="btn small kz-setbtn ${KS.set ? 'on' : ''}" data-kzset>⚙ Einstellungen</button></div>
        ${!st.gesetzt && !KS.demo && !KS.set ? '<p class="kz-leise">Noch kein Claude-Schlüssel – unter „Einstellungen“ eintragen oder den Demo-Modus zum Ausprobieren wählen.</p>' : ''}`;
    };
    /* ----- Übersicht aller Kinder: zeigt sofort, was eingetragen ist ----- */
    const tabelleHtml = () => {
      const kurz = n => { const t = String(n || '–').replace(/\(.*?\)/g, '').trim(); return t.length > 14 ? t.slice(0, 13) + '…' : t; };
      return `<div class="kz-tabbox"><h3>Übersicht · ${esc(saTitel(sa))}</h3><div class="kz-tabscroll"><table class="tbl kz-tab"><thead><tr><th class="left">Kind</th><th>Status</th>
        ${sa.cats.map(c => `<th title="${esc(c.name)}">${esc(kurz(c.name))}<br><span class="muted">/ ${fmtZ(zahl(c.max))}</span></th>`).join('')}<th>Gesamt</th><th>Note</th></tr></thead><tbody>
        ${kids.map((x, j) => { const q = sa.korr[x.id], e = saErgebnis(sa, x.id), p = sa.punkte[x.id] || {};
          return `<tr data-kzrow="${j}" class="${j === KS.kind ? 'sel' : ''} ${KS.flash === x.id ? 'kz-flash' : ''}"><td class="left nowrap"><b>${esc(x.vorname)} ${esc(x.nachname)}</b>${x.lrs ? ' <span class="kz-lrstag">LRS</span>' : ''}</td>
            <td class="nowrap">${q?.uebernommen ? '<span class="kz-st ok">✓ eingetragen</span>' : q?.ergebnis ? '<span class="kz-st wait">● zu prüfen</span>' : q?.fotos?.length ? '<span class="kz-st">📷 Foto</span>' : '<span class="muted">–</span>'}</td>
            ${sa.cats.map(c => `<td>${esc(fmtZ(zahl(p[c.id])) || '')}</td>`).join('')}
            <td class="sum">${e ? fmtZ(e.punkte) + ' / ' + fmtZ(e.max) : '–'}</td><td>${e && e.note ? `<span class="grade gr${e.note}">${e.note}</span>` : ''}</td></tr>`; }).join('')}
        </tbody></table></div></div>`;
    };
    const blinken = (el, block = 'center') => { if (!el) return; el.scrollIntoView({ block, inline: 'center', behavior: 'smooth' }); el.classList.remove('kz-blink'); void el.offsetWidth; el.classList.add('kz-blink'); };
    const zeichne = (neuStart = false) => {
      const kd0 = kid(); window.KorrZiel = kd0 ? { kurs: kursId, s: kd0.id, n: `${kd0.vorname} ${kd0.nachname}` } : null;   // fürs Handy: „Foto für …“
      const sc = { l: box.querySelector('.kz-links'), r: box.querySelector('.kz-rechts') }, alt = { lt: sc.l?.scrollTop || 0, ll: sc.l?.scrollLeft || 0, rt: sc.r?.scrollTop || 0 };
      box.innerHTML = `<section class="kz-panel">${kopfHtml()}${KS.st ? (KS.set ? einstellHtml() : '') + schluesselHtml() + kindHtml() + tabelleHtml() : ''}</section>`;
      KS.flash = null;
      const l = box.querySelector('.kz-links'), rr = box.querySelector('.kz-rechts');
      if (!neuStart) { if (l) { l.scrollTop = alt.lt; l.scrollLeft = alt.ll; } if (rr) rr.scrollTop = alt.rt; }
      if (KS.hl) { const h = KS.hl; KS.hl = null; blinken(box.querySelector(`.kz-ak[data-ka="${h.ka}"] .kz-it[data-ki="${h.ki}"]`), 'nearest'); }
    };
    const zumCockpit = () => box.querySelector('.kz-cockpit')?.scrollIntoView({ block: 'start', behavior: 'smooth' });

    /* ----- Aktionen ----- */
    const fehler = e => { KS.busy = ''; toast('⚠️ ' + e.message); zeichne(); };
    const kats = () => sa.cats.filter(c => typVon(sa, c) !== 'aus' && !saAus(sa, kid().id).includes(c.id)).map(c => ({ id: c.id, name: c.name, max: zahlOk(c.max) }));
    const handler = async ev => {
      const t = ev.target;
      if (t.closest('[data-kzset]')) { KS.set = !KS.set; return zeichne(); }
      if (t.closest('[data-kzsk]')) { KS.sk = !(KS.sk ?? !sa.schluesselOk); return zeichne(); }
      const zr = t.closest('[data-kzrow]'); if (zr && !t.closest('a')) { KS.kind = +zr.dataset.kzrow; KS.seite = 0; KS.zoom = false; zeichne(true); return box.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      if (t.closest('[data-kzhandy]')) {
        if (typeof Handy !== 'undefined' && Handy.an()) { KS.handyInfo = !KS.handyInfo; return zeichne(); }
        toast('Handy-Steuerung ist aus – im Fenster oben mit dem Handy-Symbol einschalten und den QR-Code scannen'); document.getElementById('handyBtn')?.click(); return;
      }
      const sb = t.closest('[data-kzseite]'); if (sb) { KS.seite = +sb.dataset.kzseite; zeichne(true); return; }
      if (t.closest('[data-kzzoom]')) { KS.zoom = !KS.zoom; zeichne(true); return; }
      const au = t.closest('[data-kzauf]'); if (au && !t.closest('input')) { const ka = au.closest('[data-ka]').dataset.ka; KS.auf[ka] = !KS.auf[ka]; zeichne(); return; }
      const kb = t.closest('[data-kzk]'); if (kb && !kb.disabled) { KS.kind += +kb.dataset.kzk; KS.seite = 0; KS.zoom = false; zeichne(true); return zumCockpit(); }
      if (t.closest('[data-kzkeyok]')) {
        const key = box.querySelector('[data-kzkey]').value.trim(); if (!key) return toast('Bitte den Schlüssel einfügen');
        const r = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'schluessel', key }) }).catch(() => null);
        const d = r ? await r.json().catch(() => ({})) : { fehler: 'Hilfsdienst nicht erreichbar' };
        if (d.fehler) return toast('⚠️ ' + d.fehler);
        KS.st = await fetch('/api/korrektur').then(x => x.json()); toast('🟢 Schlüssel gespeichert'); return zeichne();
      }
      if (t.closest('[data-kzerz]') && !KS.busy) {
        if (!sa.cats.length) return toast('Zuerst Kategorien anlegen');
        KS.busy = 'erz'; zeichne();
        try {
          const d = await post({ aktion: 'schluessel', fotos: KS.leer, text: KS.leerText, kategorien: sa.cats.map(c => ({ id: c.id, name: c.name, max: zahlOk(c.max) })), demo: KS.demo });
          d.ergebnis.aufgaben.forEach(a => { if (sa.cats.some(c => c.id === a.kat_id)) sa.schluessel[a.kat_id] = { typ: a.typ, kriterium: a.kriterium || '', luecken: a.luecken.map(l => ({ nr: l.nr, loesung: l.loesung, alternativen: l.alternativen || [] })) }; });
          sa.schluesselOk = false; save(); KS.busy = ''; KS.sk = true; zeichne();
          toast('Schlüssel erstellt – bitte kurz prüfen und bestätigen' + (d.ergebnis.hinweis ? ' · ' + d.ergebnis.hinweis : ''));
        } catch (e) { fehler(e); }
        return;
      }
      if (t.closest('[data-kzok]')) { sa.schluesselOk = !sa.schluesselOk; save(); return zeichne(); }
      const lz = t.closest('[data-kzladd]'); if (lz) { const c = lz.closest('[data-cat]').dataset.cat, s = sa.schluessel[c]; s.luecken.push({ nr: (s.luecken.reduce((m, l) => Math.max(m, +l.nr || 0), 0)) + 1, loesung: '', alternativen: [] }); sa.schluesselOk = false; save(); return zeichne(); }
      const ld = t.closest('[data-kzldel]'); if (ld) { const c = ld.closest('[data-cat]').dataset.cat; sa.schluessel[c].luecken.splice(+ld.closest('[data-li]').dataset.li, 1); sa.schluesselOk = false; save(); return zeichne(); }
      const fw = t.closest('[data-kzfw]'); if (fw) { const r = kr(), id = r.fotos.splice(+fw.dataset.kzfw, 1)[0]; post({ aktion: 'fotos_loeschen', ids: [id] }).catch(() => {}); save(); return zeichne(); }
      if (t.closest('[data-kzauswerten]') && !KS.busy) {
        const r = kr(), ks = kats(); if (!ks.length) return toast('Zuerst im Schlüssel festlegen, welche Aufgaben geprüft werden');
        if (!sa.schluesselOk && !confirm('Der Lösungsschlüssel ist noch nicht bestätigt. Trotzdem auswerten?')) return;
        KS.busy = 'aus'; zeichne();
        try {
          const schl = {}; ks.forEach(c => { schl[c.id] = sa.schluessel[c.id]; });
          const d = await post({ aktion: 'auswerten', fotos: r.fotos, kategorien: ks, schluessel: schl, streng: KS.streng, lrs: !!kid().lrs, demo: KS.demo });
          d.ergebnis.aufgaben.forEach(a => punkteBerechnen(sa, a));
          r.ergebnis = d.ergebnis; r.uebernommen = false; KS.seite = 0; save(); KS.busy = ''; zeichne(true); zumCockpit();
        } catch (e) { fehler(e); }
        return;
      }
      const box1 = t.closest('.kz-box'), tg = t.closest('[data-kzt]');
      if (box1 || tg) {
        const r = kr(), el = box1 || tg.closest('.kz-ak'), a = r.ergebnis.aufgaben.find(x => x.kat_id === (box1 ? box1.dataset.ka : el.dataset.ka));
        const c = sa.cats.find(x => x.id === a.kat_id), lueck = typVon(sa, c) === 'luecken';
        const it = a.items[+(box1 ? box1.dataset.ki : tg.closest('[data-ki]').dataset.ki)], ok0 = a.items.filter(x => x.richtig).length; it.richtig = !it.richtig; it.unsicher = false; a.fest = false;
        const abz = abzugVon(sa, c); if (!lueck && abz) a.punkte = Math.max(0, Math.min(zahlOk(c.max), Math.round((zahlOk(a.punkte) + (a.items.filter(x => x.richtig).length - ok0) * abz) * 2) / 2));
        if (lueck) { punkteBerechnen(sa, a); r.uebernommen = false; } KS.hl = { ka: a.kat_id, ki: +(box1 ? box1.dataset.ki : tg.closest('[data-ki]').dataset.ki) }; save(); return zeichne();
      }
      const zeile = t.closest('.kz-it');
      if (zeile) { const b2 = box.querySelector(`.kz-box[data-ka="${zeile.closest('[data-ka]').dataset.ka}"][data-ki="${zeile.dataset.ki}"]`); if (b2) blinken(b2); return; }
      const ub = t.closest('[data-kzuebern]');
      if (ub) {
        const s = kid(), r = kr(); sa.punkte[s.id] ||= {};
        const ausS = saAus(sa, s.id); r.ergebnis.aufgaben.forEach(a => { if (sa.cats.some(c => c.id === a.kat_id)) sa.punkte[s.id][a.kat_id] = ausS.includes(a.kat_id) ? '' : fmtZ(a.punkte); });
        r.uebernommen = true; KS.flash = s.id; save();
        if (ub.dataset.kzuebern === 'weiter' && KS.kind < kids.length - 1) KS.kind++;
        toast(`✓ Punkte von ${s.vorname} eingetragen`); neuZeichnen();
      }
    };
    const aenderung = async ev => {
      const t = ev.target;
      if (t.dataset.kzleertext !== undefined) { KS.leerText = t.value; return; }
      if (t.dataset.kzstreng !== undefined) { KS.streng = t.checked; return; }
      if (t.dataset.kzlrs !== undefined) { const kd = kid(); kd.lrs = t.checked; if (!kd.lrs) delete kd.lrs; save(); toast(kd.lrs ? `LRS für ${kd.vorname}: Rechtschreibung zählt nicht – für Lücken und Text bitte „Neu auswerten“` : `LRS für ${kd.vorname} aus`); return neuZeichnen(); }
      if (t.dataset.kzlrskat !== undefined) { const c = sa.cats.find(x => x.id === t.closest('[data-cat]').dataset.cat); c.lrsAus = t.checked; save(); return zeichne(); }
      if (t.dataset.kzdemo !== undefined) { KS.demo = t.checked; return zeichne(); }
      if (t.dataset.kzmodell !== undefined) { KS.st.modell = t.value; post({ aktion: 'modell', modell: t.value }).catch(() => {}); return; }
      if (t.dataset.kzwahl !== undefined) { KS.kind = +t.value; KS.seite = 0; KS.zoom = false; zeichne(true); return zumCockpit(); }
      const cat = t.closest('[data-cat]');
      if (t.dataset.kzf && cat) {
        const s = sa.schluessel[cat.dataset.cat] ||= { typ: 'aus', luecken: [], kriterium: '' }; s[t.dataset.kzf] = t.value;
        if (t.dataset.kzf === 'typ' && t.value === 'luecken' && !s.luecken.length) s.luecken.push({ nr: 1, loesung: '', alternativen: [] });
        sa.schluesselOk = false; save(); return zeichne();
      }
      if (t.dataset.kzl && cat) {
        const l = sa.schluessel[cat.dataset.cat].luecken[+t.closest('[data-li]').dataset.li];
        if (t.dataset.kzl === 'alt') l.alternativen = t.value.split(',').map(x => x.trim()).filter(Boolean); else l[t.dataset.kzl] = t.dataset.kzl === 'nr' ? (+t.value || t.value) : t.value;
        sa.schluesselOk = false; save(); return;
      }
      if (t.dataset.kzp !== undefined) {
        const r = kr(), ak = t.closest('[data-ka]'), a = r.ergebnis.aufgaben.find(x => x.kat_id === ak.dataset.ka);
        a.punkte = zahlOk(t.value); a.fest = true; r.uebernommen = false; save(); return zeichne();
      }
      if (t.dataset.kzleer !== undefined && t.files.length) {
        try { KS.leer = await hochladen([...t.files]); toast(KS.leer.length + ' Foto(s) der leeren SA bereit'); } catch (e) { toast('⚠️ ' + e.message); }
        return zeichne();
      }
      if (t.dataset.kzfoto !== undefined && t.files.length) {
        const r = kr(); try { r.fotos.push(...await hochladen([...t.files])); r.uebernommen = false; save(); } catch (e) { toast('⚠️ ' + e.message); }
        return zeichne();
      }
    };
    box.onclick = handler; box.onchange = aenderung;

    /* Fotos vom Handy abholen */
    const eingang = async () => {
      if (!document.body.contains(box)) { clearInterval(KS.timer); KS.timer = null; window.KorrZiel = null; return; }
      if (KS.busy) return;
      try {
        const d = await post({ aktion: 'eingang', kurs: kursId }); if (!d.fotos.length) return;
        const ids = [], namen = new Set();
        d.fotos.forEach(x => { const s = kids.find(y => y.id === x.s); if (!s) return; (sa.korr[s.id] ||= { fotos: [] }).fotos.push(x.id); sa.korr[s.id].uebernommen = false; ids.push(x.id); namen.add(s.vorname); });
        if (ids.length) { await post({ aktion: 'eingang_weg', ids }); save(); toast(`📱 ${ids.length} Foto(s) vom Handy: ${[...namen].join(', ')}`); zeichne(); }
      } catch (e) { /* Hilfsdienst kurz weg */ }
    };
    clearInterval(KS.timer); KS.timer = setInterval(eingang, 4000);

    if (KS.st) zeichne();
    else { box.innerHTML = '<section class="card"><p class="muted">Lade …</p></section>'; fetch('/api/korrektur').then(r => r.json()).then(d => { KS.st = d; zeichne(); eingang(); }).catch(() => { box.innerHTML = '<section class="card"><p class="warnbox">Hilfsdienst nicht erreichbar – bitte „Schulzentrale starten“ öffnen.</p></section>'; }); }
  }
  return { zeige };
})();
