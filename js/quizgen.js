'use strict';
/* ===== Fragen-Generator: Quizfragen mit Claude erstellen → prüfen → Vorschau → ins Quiz übernehmen oder als Blooket-CSV / Kahoot-Datei ===== */

const QG_ZIELE = {
  quiz: { name: 'Quiz in der Schulzentrale', sub: 'Klassisch, Millionenshow, 1-2-oder-3, Vier gewinnt …', ic: 'frage', laenge: [140, 200, 50, 80], aus: 'In die Quiz-Liste übernehmen' },
  jeopardy: { name: 'Jeopardy-Tafel', sub: 'Kategorien mit je 5 Stufen (100–500)', ic: 'gitter', laenge: [140, 200, 50, 80], aus: 'In die Quiz-Liste übernehmen' },
  blooket: { name: 'Blooket', sub: 'CSV-Datei zum Hochladen bei Blooket', ic: 'flagge', laenge: [150, 250, 60, 100], aus: 'Blooket-CSV herunterladen' },
  kahoot: { name: 'Kahoot!', sub: 'Excel-Datei (.xlsx) für den Kahoot-Import', ic: 'ziel', laenge: [95, 120, 60, 75], aus: 'Kahoot-Datei herunterladen' },
};
const QG_KAHOOT_ZEITEN = [5, 10, 20, 30, 60, 90, 120, 240];
const QG_STUFEN = Array.from({ length: 13 }, (_, i) => {
  const s = i + 1;
  return [s, `${s}. Schulstufe` + (s <= 4 ? ` (${s}. Klasse VS)` : s <= 8 ? ` (${s - 4}. Klasse MS/AHS)` : ` (${s - 8}. Klasse Oberstufe)`)];
});
state.quizgen ||= { ziel: null, form: {}, entwurf: null };
const QG = state.quizgen;

/* ---------- Prüfung (läuft immer, auch ohne Claude) ---------- */
const qgNorm = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const qgWorte = s => new Set(qgNorm(s).split(' ').filter(w => w.length > 2));
const qgAehnlich = (a, b) => { const x = qgWorte(a), y = qgWorte(b); if (x.size < 3 || y.size < 3) return 0; let g = 0; x.forEach(w => y.has(w) && g++); return g / (x.size + y.size - g); };

function qgPruefen(e) {
  const z = QG_ZIELE[e.ziel], [fW, fF, aW, aF] = z.laenge, fr = e.fragen;
  const pro = fr.map((f, i) => {
    const p = [], F = t => p.push({ f: 1, t }), W = t => p.push({ f: 0, t });
    const ant = f.antworten.map(a => String(a || '').trim());
    if (!f.frage.trim()) F('Fragetext fehlt');
    if (ant.length < 2) F('Mindestens 2 Antworten nötig');
    if (ant.some(a => !a)) F('Leere Antwort');
    if (!(f.richtig >= 0 && f.richtig < ant.length)) F('Keine richtige Antwort markiert');
    // nur exakt gleiche Antworten sind ein Fehler – „Das“/„das“ oder „dass“/„das“ sind bei Rechtschreibfragen gewollt
    const n = ant.map(qgNorm), genau = ant.map(a => a.replace(/\s+/g, ' ')).filter(Boolean);
    if (new Set(genau).size < genau.length) F('Zwei Antworten sind gleich');
    if (f.frage.length > fF) F(`Frage zu lang (${f.frage.length}/${fF} Zeichen)`); else if (f.frage.length > fW) W(`Frage lang (${f.frage.length} Zeichen) – am Beamer schwer lesbar`);
    ant.forEach((a, j) => { if (a.length > aF) F(`Antwort ${j + 1} zu lang (${a.length}/${aF})`); else if (a.length > aW) W(`Antwort ${j + 1} lang (${a.length} Zeichen)`); });
    if (ant.some(a => /\b(alle|keine) (der|dieser) (genannten|antworten|oben)/i.test(a))) W('„Alle/keine der genannten“ vermeiden');
    const r = ant[f.richtig] || '', andere = ant.filter((_, j) => j !== f.richtig);
    if (ant.length > 2 && r.length > 15 && r.length > 1.6 * Math.max(...andere.map(a => a.length))) W('Richtige Antwort ist auffällig länger – verrät die Lösung');
    if (n[f.richtig] && n[f.richtig].length >= 4 && !/^\d+$/.test(n[f.richtig]) && ` ${qgNorm(f.frage)} `.includes(` ${n[f.richtig]} `)) W('Die Frage enthält schon die Antwort');
    fr.forEach((g, k) => {
      if (k >= i) return;
      if (qgNorm(g.frage) === qgNorm(f.frage)) F(`Doppelt (gleich wie Frage ${k + 1})`);
      else if (qgAehnlich(g.frage, f.frage) >= 0.7) W(`Sehr ähnlich wie Frage ${k + 1}`);
    });
    if (e.schwierigkeit === 'leicht' && f.schwierigkeit === 'schwer') W('Als „schwer“ eingestuft – gewünscht war leicht');
    if (e.schwierigkeit === 'schwer' && f.schwierigkeit === 'leicht') W('Als „leicht“ eingestuft – gewünscht war schwer');
    if (e.ziel === 'jeopardy' && !f.kat.trim()) F('Kategorie fehlt');
    return p;
  });
  const glob = [];
  if (!fr.length) glob.push({ f: 1, t: 'Keine Fragen vorhanden' });
  if (e.ziel === 'jeopardy') {
    const kats = {}; fr.forEach(f => (kats[f.kat.trim()] ||= []).push(+f.punkte));
    Object.entries(kats).forEach(([k, pk]) => {
      if (!k) return;
      const fehlt = [100, 200, 300, 400, 500].filter(x => !pk.includes(x)), doppelt = pk.filter((x, i) => pk.indexOf(x) !== i);
      if (fehlt.length) glob.push({ f: 0, t: `„${k}“: es fehlt ${fehlt.join(', ')}` });
      if (doppelt.length) glob.push({ f: 0, t: `„${k}“: ${[...new Set(doppelt)].join(', ')} doppelt` });
    });
  }
  const mc = fr.filter(f => f.antworten.length > 2);
  if (mc.length >= 8) {
    const pos = [0, 0, 0, 0]; mc.forEach(f => pos[f.richtig]++);
    const m = Math.max(...pos);
    if (m / mc.length > 0.45) glob.push({ f: 0, t: `Die Lösung steht auffällig oft an Stelle ${pos.indexOf(m) + 1}`, mischen: 1 });
  }
  if (e.ziel === 'blooket' && !(e.zeit >= 5 && e.zeit <= 300)) glob.push({ f: 1, t: 'Zeitlimit bei Blooket: 5–300 Sekunden' });
  return { pro, glob, fehler: pro.flat().filter(x => x.f).length + glob.filter(x => x.f).length, hinweise: pro.flat().filter(x => !x.f).length + glob.filter(x => !x.f).length };
}

/* Antwortpositionen gleichmäßig verteilen (Wahr/Falsch bleibt) */
function qgMischen(fragen) {
  const mc = fragen.filter(f => f.antworten.length > 2);
  const ziele = shuffle(mc.map((_, i) => i % 4));
  mc.forEach((f, i) => {
    const r = f.antworten[f.richtig], rest = shuffle(f.antworten.filter((_, j) => j !== f.richtig));
    const t = Math.min(ziele[i], f.antworten.length - 1);
    rest.splice(t, 0, r); f.antworten = rest; f.richtig = t;
  });
}

/* Antwort von Claude in unser Format bringen */
function qgAufbereiten(liste, e) {
  return (liste || []).filter(f => f && f.frage).map(f => {
    let ant = (f.antworten || []).map(a => String(a ?? '').trim()).filter(Boolean).slice(0, 4);
    let r = Number.isInteger(+f.richtig) ? +f.richtig : 0;
    const tf = ant.length === 2 && /^(wahr|richtig|stimmt)$/i.test(ant[0]) && /^(falsch|stimmt nicht)$/i.test(ant[1]);
    if (tf) ant = ['Wahr', 'Falsch'];
    return { id: uid(), frage: String(f.frage).trim(), antworten: ant, richtig: Math.min(Math.max(r, 0), Math.max(ant.length - 1, 0)), kat: String(f.kategorie || f.kat || '').trim(),
      punkte: e.ziel === 'jeopardy' ? Math.min(500, Math.max(100, Math.round((+f.punkte || 100) / 100) * 100)) : +f.punkte || 0,
      schwierigkeit: ['leicht', 'mittel', 'schwer'].includes(f.schwierigkeit) ? f.schwierigkeit : 'mittel', erklaerung: String(f.erklaerung || '').trim() };
  });
}

/* ---------- Texte für Claude ---------- */
function qgSystem(e) {
  const [fW, , aW] = QG_ZIELE[e.ziel].laenge;
  return `Du bist eine erfahrene Lehrkraft in Österreich und erstellst Quizfragen für den Unterricht.
Regeln:
- Sprache: Deutsch, österreichische Begriffe und Schreibweise (z. B. Jänner, Matura, Schularbeit), außer das Fach ist eine Fremdsprache und die Frage braucht sie.
- Inhalt und Wortschatz passen genau zur angegebenen Schulstufe und zum österreichischen Lehrplan. Keine Fachbegriffe, die in dieser Stufe unbekannt sind.
- Jede Frage hat genau EINE eindeutig richtige Antwort. Die falschen Antworten sind plausibel (typische Schülerfehler, gleiche Kategorie, ähnliche Länge und Form), aber sicher falsch. Keine Witzantworten.
- Kein „alle/keine der genannten“, keine doppelten Verneinungen, die Frage verrät die Lösung nicht.
- Nur gesicherte Fakten. Bei Zahlen, Namen und Jahreszahlen besonders sorgfältig sein.
- Keine zwei Fragen fragen dasselbe ab. Abwechslungsreich formulieren.
- Kurz: Frage höchstens ${fW} Zeichen, jede Antwort höchstens ${aW} Zeichen.
- "richtig" ist der Index der richtigen Antwort (0 = erste). Verteile die richtige Antwort über alle Positionen.
- "schwierigkeit" ehrlich einschätzen: leicht, mittel oder schwer – gemessen an der Schulstufe.
- "erklaerung": ein kurzer Satz für die Lehrkraft, warum die Lösung stimmt.
- Wahr/Falsch-Fragen haben genau die Antworten ["Wahr", "Falsch"].
- Bei Rechtschreib- und Grammatikfragen dürfen sich die Antworten nur in Groß-/Kleinschreibung, Zeichensetzung oder einzelnen Buchstaben unterscheiden (z. B. „das Laufen“ / „das laufen“, „dass“ / „das“). Das ist gewollt und kein Fehler.`;
}
function qgAuftrag(e, anzahl, extra = '') {
  const stufe = QG_STUFEN[e.stufe - 1][1], schw = { leicht: 'eher leicht (Wiederholung, Grundwissen)', gemischt: 'gemischt, von leicht nach schwer steigend', schwer: 'anspruchsvoll (für Fortgeschrittene, aber altersgerecht)' }[e.schwierigkeit];
  let t = `Erstelle ${anzahl} Multiple-Choice-Fragen mit je 4 Antworten.
Thema / Inhalte: ${e.thema}
Fach: ${e.fach || 'nicht angegeben'}
Klasse: ${stufe}
Schwierigkeit: ${schw}`;
  if (e.tf && e.ziel !== 'jeopardy') t += `\nEtwa ein Fünftel davon dürfen Wahr/Falsch-Fragen sein.`;
  if (e.ziel === 'jeopardy') {
    t = `Erstelle eine Jeopardy-Tafel mit ${e.kats} Kategorien zu je 5 Fragen (insgesamt ${e.kats * 5}), alle Multiple-Choice mit je 4 Antworten.
Thema / Inhalte: ${e.thema}
Fach: ${e.fach || 'nicht angegeben'}
Klasse: ${stufe}
${e.katNamen.trim() ? `Kategorien: ${e.katNamen}` : 'Wähle passende, kurze Kategorie-Namen (höchstens 20 Zeichen).'}
Pro Kategorie genau einmal die Punkte 100, 200, 300, 400, 500 – je mehr Punkte, desto schwerer (100 = leicht, 500 = schwer, aber für die Klasse lösbar).`;
  } else t += `\n"kategorie": ein kurzes Unterthema, "punkte": 100 (leicht), 200 (mittel) oder 300 (schwer).`;
  return t + extra;
}
function qgPruefAuftrag(e, fragen, probleme) {
  return `Prüfe diese Quizfragen kritisch, eine nach der anderen. Klasse: ${QG_STUFEN[e.stufe - 1][1]}. Fach: ${e.fach || '–'}. Thema: ${e.thema}. Gewünschte Schwierigkeit: ${e.schwierigkeit}.
Prüfe für jede Frage:
1. Ist die markierte Antwort sachlich sicher richtig?
2. Könnte eine der falschen Antworten ebenfalls als richtig gelten?
3. Ist die Frage eindeutig, altersgerecht und passt die Schwierigkeit?
   (Antworten, die sich nur in Groß-/Kleinschreibung oder Zeichensetzung unterscheiden, sind bei Rechtschreibfragen gewollt – nicht vereinheitlichen.)
4. Werden die Längenregeln eingehalten (Frage ≤ ${QG_ZIELE[e.ziel].laenge[0]}, Antwort ≤ ${QG_ZIELE[e.ziel].laenge[2]} Zeichen)?
5. Die automatisch gefundenen Probleme (unten) müssen behoben werden.
Gib für JEDE Frage einen Eintrag zurück. ok = true, wenn alles passt – dann frage, antworten und richtig unverändert übernehmen und problem leer lassen. Sonst ok = false, problem kurz benennen (z. B. „Antwort C ist auch richtig“) und eine verbesserte Fassung liefern.

${fragen.map(({ f, nr }) => `Nr. ${nr}: ${f.frage}\n${f.antworten.map((a, j) => `  ${j}${j === f.richtig ? ' (richtig)' : ''}: ${a}`).join('\n')}${probleme[nr] ? `\n  Automatische Prüfung: ${probleme[nr]}` : ''}`).join('\n\n')}`;
}
const qgJsonVorlage = `{"fragen":[{"frage":"…","antworten":["…","…","…","…"],"richtig":0,"kategorie":"…","punkte":100,"schwierigkeit":"leicht|mittel|schwer","erklaerung":"…"}]}`;

async function qgClaude(schema, system, prompt, effort = 'high') {
  const r = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'anfrage', schema, system, prompt, effort }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.fehler) throw new Error(d.fehler || 'Keine Verbindung zum Hilfsdienst');
  return d.ergebnis;
}

/* ---------- Ausgabe ---------- */
const qgDateiname = (vor, e, end) => `${vor}_${(e.thema.split('\n')[0].replace(/[^\p{L}\p{N} -]+/gu, '').trim().replace(/\s+/g, '_').slice(0, 40) || 'Quiz')}.${end}`;
function qgBlooketCsv(e) {
  const K = '"Question #","Question Text","Answer 1","Answer 2","Answer 3 \n(Optional)","Answer 4 \n(Optional)","Time Limit (sec) \n(Max: 300 Seconds)","Correct Answer(s) \n(Only Include Answer #)"';
  const txt = s => /^\d+$/.test(s) ? s : '"' + s.replace(/"/g, '""') + '"';
  const zeilen = [',,,,,,,', K, ...e.fragen.map((f, i) => {
    const a = [...f.antworten, '', '', ''].slice(0, 4).map(x => String(x).trim());
    return [i + 1, txt(f.frage.trim()), ...a.map(x => x ? txt(x) : ''), Math.min(300, e.zeit), f.richtig + 1].join(',');
  })];
  return zeilen.join('\n') + '\n';
}
async function qgKahootXlsx(e) {
  await ladeSkript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  const zeit = QG_KAHOOT_ZEITEN.includes(+e.zeit) ? +e.zeit : 20;
  const aoa = [[], ['', 'Quiz template'], ['', 'Add questions, at least two answer alternatives, time limit and choose correct answers (at least one). Have fun creating your awesome quiz!'],
    ['', 'Remember: questions have a limit of 120 characters and answers can have 75 characters max. Text will turn red in Excel or Google Docs if you exceed this limit. If several answers are correct, separate them with a comma.'],
    ['', 'See an example question below (don\'t forget to overwrite this with your first question!)'], ['', 'And remember,  if you\'re not using Excel you need to export to .xlsx format before you upload to Kahoot!'], [],
    ['', 'Question - max 120 characters', 'Answer 1 - max 75 characters', 'Answer 2 - max 75 characters', 'Answer 3 - max 75 characters', 'Answer 4 - max 75 characters', 'Time limit (sec) – 5, 10, 20, 30, 60, 90, 120, or 240 secs', 'Correct answer(s) - choose at least one'],
    ...e.fragen.map((f, i) => [i + 1, f.frage.trim(), ...[...f.antworten, '', '', ''].slice(0, 4).map(x => String(x).trim()), zeit, f.richtig + 1])];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, qgDateiname('Kahoot', e, 'xlsx'));
}

registerModule({
  id: 'quizgen', title: 'Fragen-Generator', icon: '✨',
  render(el) {
    const mod = this;
    let schluessel = null;
    el.innerHTML = '<div class="page qg" id="qgPage"></div>';
    const body = el.querySelector('#qgPage'), $ = id => body.querySelector('#' + id);
    fetch('/api/claude').then(r => r.json()).then(d => { schluessel = !!d.gesetzt; if (!QG.entwurf) start(); }).catch(() => { schluessel = false; if (!QG.entwurf) start(); });

    const formWerte = () => {
      const k = aktKlasse(), stufeAusKlasse = k && +((k.name || '').match(/\d+/) || [0])[0];
      return { thema: '', fach: aktFach()?.name || '', stufe: stufeAusKlasse >= 1 && stufeAusKlasse <= 8 ? stufeAusKlasse + 4 : 7, anzahl: 15, kats: 5, katNamen: '', schwierigkeit: 'gemischt', tf: false, zeit: 20, ...QG.form };
    };

    /* ----- Schritt 1: Wofür? + Angaben ----- */
    const start = () => {
      mod._g = null;
      const f = formWerte(), z = QG.ziel, faecher = [...new Set(state.klassen.flatMap(k => (k.faecher || []).map(x => x.name)))];
      body.innerHTML = `<div class="pagehead">${seitenTitel('funke', '#000', 'Fragen-Generator')}
          <div class="row"><a class="btn" href="#/quiz">← Zum Quiz</a></div></div>
        <h3 class="qg-h">1 · Wofür sollen die Fragen sein?</h3>
        <div class="qg-ziele">${Object.entries(QG_ZIELE).map(([id, x]) => `<button class="qg-ziel ${z === id ? 'on' : ''}" data-ziel="${id}">${ico(x.ic, null, 26)}<b>${x.name}</b><small>${x.sub}</small></button>`).join('')}</div>
        ${z ? `<h3 class="qg-h">2 · Worum geht es?</h3>
        <form class="card qg-form" id="qgF">
          <label class="qg-voll">Thema und Inhalte <small class="muted">– je genauer, desto besser (Stichwörter aus dem Unterricht, Buchkapitel …)</small>
            <textarea name="thema" rows="3" required placeholder="z. B. Wortarten: Nomen, Verben, Adjektive erkennen">${esc(f.thema)}</textarea></label>
          <label>Fach<input name="fach" list="qgFaecher" value="${esc(f.fach)}"><datalist id="qgFaecher">${faecher.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
          <label>Klasse<select name="stufe">${QG_STUFEN.map(([s, t]) => `<option value="${s}" ${s === +f.stufe ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          ${z === 'jeopardy' ? `<label>Kategorien<select name="kats">${[3, 4, 5, 6].map(n => `<option ${n === +f.kats ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="qg-voll">Namen der Kategorien <small class="muted">– optional, mit Komma getrennt. Leer = Claude wählt.</small><input name="katNamen" value="${esc(f.katNamen)}" placeholder="z. B. Nomen, Verben, Adjektive, Satzglieder, Rechtschreibung"></label>`
          : `<label>Anzahl Fragen<input name="anzahl" type="number" min="3" max="40" value="${+f.anzahl || 15}"></label>`}
          <label>Schwierigkeit<select name="schwierigkeit">${[['leicht', 'Leicht – Wiederholung'], ['gemischt', 'Gemischt – steigend'], ['schwer', 'Anspruchsvoll']].map(([v, t]) => `<option value="${v}" ${v === f.schwierigkeit ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          ${z === 'blooket' ? `<label>Zeit pro Frage (Sek.)<input name="zeit" type="number" min="5" max="300" value="${+f.zeit || 20}"></label>` : ''}
          ${z === 'kahoot' ? `<label>Zeit pro Frage<select name="zeit">${QG_KAHOOT_ZEITEN.map(s => `<option value="${s}" ${s === +f.zeit ? 'selected' : ''}>${s} Sekunden</option>`).join('')}</select></label>` : ''}
          ${z !== 'jeopardy' ? `<label class="qg-check"><input type="checkbox" name="tf" ${f.tf ? 'checked' : ''}> auch Wahr/Falsch-Fragen</label>` : ''}
          <div class="qg-voll row qg-los">
            ${schluessel ? `<button class="btn primary big" type="submit">✨ Fragen erstellen & prüfen</button><span class="muted small">Claude erstellt die Fragen und prüft sie danach selbst noch einmal (dauert ca. 1–3 Minuten).</span>`
            : `<button class="btn primary" type="submit" data-weg="prompt">Auftrag für Claude kopieren</button><span class="muted small">Ohne Schlüssel: Auftrag kopieren, in <a href="https://claude.ai" target="_blank" rel="noopener">claude.ai</a> einfügen, Antwort unten einfügen.</span>`}
          </div>
        </form>
        ${schluessel ? '' : `<div class="card qg-einfuegen" id="qgEin" ${QG._promptKopiert ? '' : 'hidden'}><b>3 · Antwort von Claude hier einfügen</b>
          <textarea id="qgJson" rows="6" placeholder='{"fragen": [ … ] }'></textarea>
          <div class="row"><button class="btn primary" id="qgJsonOk">Prüfen & Vorschau</button></div></div>`}` : ''}
        <details class="qg-key"><summary>${schluessel ? '🟢 Mit Claude verbunden' : '⚪ Claude-Schlüssel eintragen (für das automatische Erstellen)'}</summary>
          <p class="small muted">Einen API-Schlüssel bekommst du unter <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a> (Guthaben nötig, eine Runde mit 20 Fragen kostet nur wenige Cent).
          Der Schlüssel wird nur hier am Laptop im Ordner <code>daten</code> gespeichert und nie an den Browser oder das Handy geschickt.</p>
          <div class="row"><input type="password" id="qgKey" placeholder="${schluessel ? '•••••••• (gespeichert)' : 'sk-ant-…'}" autocomplete="off" style="flex:1">
          <button class="btn" id="qgKeyOk">Speichern</button>${schluessel ? '<button class="btn" id="qgKeyWeg">Entfernen</button>' : ''}</div></details>`;
    };
    const formLesen = () => {
      const fd = new FormData($('qgF')), f = { ...formWerte() };
      ['thema', 'fach', 'schwierigkeit', 'katNamen'].forEach(k => fd.has(k) && (f[k] = fd.get(k).trim()));
      ['stufe', 'anzahl', 'kats', 'zeit'].forEach(k => fd.has(k) && (f[k] = +fd.get(k)));
      f.tf = fd.has('tf');
      f.anzahl = Math.min(40, Math.max(3, f.anzahl || 15));
      QG.form = f; save();
      return { ...f, ziel: QG.ziel };
    };

    /* ----- Erstellen mit Claude: Erzeugen → Prüfschleife ----- */
    const fortschritt = (schritte, akt) => {
      body.querySelector('.qg-arbeit')?.remove();
      body.insertAdjacentHTML('beforeend', `<div class="qg-arbeit"><div class="card"><div class="qg-spinner"></div><b>Claude arbeitet …</b>
        <ol>${schritte.map((s, i) => `<li class="${i < akt ? 'fertig' : i === akt ? 'jetzt' : ''}">${i < akt ? '✓' : i === akt ? '…' : '○'} ${s}</li>`).join('')}</ol>
        <small class="muted" id="qgUhr">0 s</small></div></div>`);
    };
    const erstellen = async e => {
      const schritte = ['Fragen erstellen', 'Fakten, Eindeutigkeit & Schwierigkeit prüfen', 'Restliche Probleme beheben'], t0 = Date.now();
      const uhr = setInterval(() => { const u = body.querySelector('#qgUhr'); if (u) u.textContent = Math.round((Date.now() - t0) / 1000) + ' s'; }, 1000);
      try {
        fortschritt(schritte, 0);
        const anzahl = e.ziel === 'jeopardy' ? e.kats * 5 : e.anzahl;
        const roh = await qgClaude('fragen', qgSystem(e), qgAuftrag(e, anzahl));
        e.fragen = qgAufbereiten(roh.fragen, e); e.protokoll = [];
        if (!e.fragen.length) throw new Error('Claude hat keine Fragen geliefert');
        for (let runde = 0; runde < 2; runde++) {
          fortschritt(schritte, runde + 1);
          const p = qgPruefen(e), probleme = {};
          p.pro.forEach((x, i) => { if (x.length) probleme[i + 1] = x.map(y => y.t).join('; '); });
          // 1. Runde: alle Fragen kritisch prüfen. 2. Runde: nur noch, was die automatische Prüfung bemängelt.
          const auswahl = e.fragen.map((f, i) => ({ f, nr: i + 1 })).filter(x => runde === 0 || p.pro[x.nr - 1].some(y => y.f));
          if (!auswahl.length) break;
          const erg = await qgClaude('pruefung', qgSystem(e), qgPruefAuftrag(e, auswahl, probleme), runde ? 'medium' : 'high');
          (erg.pruefung || []).forEach(k => {
            const f = e.fragen[k.nr - 1];
            if (!f || k.ok || !k.frage) return;
            const neu = qgAufbereiten([{ ...f, kategorie: f.kat, frage: k.frage, antworten: k.antworten, richtig: k.richtig }], e)[0];
            if (neu.antworten.length < 2) return;
            Object.assign(f, { frage: neu.frage, antworten: neu.antworten, richtig: neu.richtig, korrigiert: k.problem || 'überarbeitet' });
            e.protokoll.push(`Frage ${k.nr}: ${k.problem}`);
          });
        }
        qgMischen(e.fragen);
        QG.entwurf = e; save(); vorschau();
      } catch (err) {
        body.querySelector('.qg-arbeit')?.remove();
        toast('⚠️ ' + err.message);
      } finally { clearInterval(uhr); }
    };

    /* ----- Ohne Schlüssel: Auftrag kopieren, Antwort einfügen ----- */
    const promptKopieren = e => {
      const anzahl = e.ziel === 'jeopardy' ? e.kats * 5 : e.anzahl;
      const text = `${qgSystem(e)}\n\n${qgAuftrag(e, anzahl)}\n\nPrüfe vor der Ausgabe jede Frage noch einmal: Stimmt die Lösung sicher? Ist keine falsche Antwort auch richtig? Passt sie zur Klasse? Verbessere, was nicht passt.\nAntworte NUR mit JSON in genau diesem Format, ohne weiteren Text:\n${qgJsonVorlage}`;
      navigator.clipboard.writeText(text).then(() => toast('📋 Auftrag kopiert – jetzt in claude.ai einfügen'), () => { prompt('Bitte kopieren:', text); });
      QG._promptKopiert = true; QG._wartend = e; save();
      $('qgEin').hidden = false; $('qgJson').focus();
    };
    const jsonEinlesen = () => {
      const t = $('qgJson').value, a = Math.min(...['{', '['].map(c => t.indexOf(c)).filter(i => i >= 0)), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
      let d; try { d = JSON.parse(t.slice(a, b + 1)); } catch { return toast('Das ist kein gültiges JSON – bitte die ganze Antwort von Claude einfügen'); }
      const e = { ...(QG._wartend || formLesen()), ziel: QG.ziel };
      e.fragen = qgAufbereiten(Array.isArray(d) ? d : d.fragen, e); e.protokoll = [];
      if (!e.fragen.length) return toast('Keine Fragen gefunden');
      qgMischen(e.fragen);
      QG.entwurf = e; QG._promptKopiert = false; save(); vorschau();
    };

    /* ----- Vorschau mit Prüfergebnis ----- */
    mod._nurProbleme = false;
    const vorschau = () => {
      const e = QG.entwurf, z = QG_ZIELE[e.ziel], p = qgPruefen(e);
      const diff = { leicht: 0, mittel: 0, schwer: 0 }; e.fragen.forEach(f => diff[f.schwierigkeit]++);
      const jeop = e.ziel === 'jeopardy';
      const reihen = e.fragen.map((f, i) => ({ f, i })).sort((a, b) => jeop ? (a.f.kat.localeCompare(b.f.kat, 'de') || a.f.punkte - b.f.punkte) : 0);
      body.innerHTML = `<div class="pagehead">${seitenTitel('funke', '#000', 'Vorschau', ` <small class="muted qg-fuer">für ${z.name}</small>`)}
          <div class="row"><button class="btn" id="qgNeu">← Neue Fragen</button></div></div>
        <div class="card qg-sum" id="qgSum"></div>
        ${e.protokoll?.length ? `<details class="qg-prot"><summary>Claude hat bei der Prüfung ${e.protokoll.length} Frage${e.protokoll.length === 1 ? '' : 'n'} verbessert</summary><ul>${e.protokoll.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
        <div class="qg-liste ${mod._nurProbleme ? 'nurprob' : ''}" id="qgListe">${reihen.map(({ f, i }) => `<div class="qg-f ${f.antworten.length === 2 ? 'tf' : ''}" data-i="${i}">
          <div class="qg-kopf"><span class="qg-nr">${i + 1}</span>
            ${jeop ? `<input class="qg-kat" data-k="kat" value="${esc(f.kat)}" title="Kategorie"><select data-k="punkte">${[100, 200, 300, 400, 500].map(x => `<option ${x === f.punkte ? 'selected' : ''}>${x}</option>`).join('')}</select>` : ''}
            <select class="qg-schw s-${f.schwierigkeit}" data-k="schwierigkeit">${['leicht', 'mittel', 'schwer'].map(x => `<option ${x === f.schwierigkeit ? 'selected' : ''}>${x}</option>`).join('')}</select>
            <textarea class="qg-frage" data-k="frage" rows="1">${esc(f.frage)}</textarea>
            <span class="qg-akt">${schluessel ? '<button class="qz-ic" data-neu title="Durch eine neue Frage ersetzen">↻</button>' : ''}<button class="qz-ic qz-del" data-weg title="Frage löschen">🗑</button></span></div>
          <div class="qg-ant">${f.antworten.map((a, j) => `<label class="qg-a ${j === f.richtig ? 'richtig' : ''}" style="--c:${QFARBEN[j][0]}"><button type="button" class="qg-r" data-r="${j}" title="Als richtig markieren">${j === f.richtig ? '✓' : QFARBEN[j][1]}</button>
            <input data-a="${j}" value="${esc(a)}" ${f.antworten.length === 2 ? 'readonly' : ''}></label>`).join('')}</div>
          ${f.erklaerung || f.korrigiert ? `<div class="qg-info">${f.korrigiert ? `<span class="chip note">geprüft & verbessert: ${esc(f.korrigiert)}</span> ` : ''}${f.erklaerung ? `💡 ${esc(f.erklaerung)}` : ''}</div>` : ''}
          <div class="qg-prob" data-p="${i}"></div></div>`).join('')}</div>
        <div class="qg-fuss row"><button class="btn" id="qgMehr">+ Leere Frage</button><span style="flex:1"></span><span class="muted small" id="qgFussInfo"></span><button class="btn primary big" id="qgAus"></button></div>`;
      body.querySelectorAll('.qg-frage').forEach(hoehe);
      pruefAnzeigen(p, diff);
    };
    const hoehe = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; };
    const pruefAnzeigen = (p = qgPruefen(QG.entwurf)) => {
      const e = QG.entwurf, z = QG_ZIELE[e.ziel], diff = { leicht: 0, mittel: 0, schwer: 0 }; e.fragen.forEach(f => diff[f.schwierigkeit]++);
      p.pro.forEach((x, i) => {
        const d = body.querySelector(`[data-p="${i}"]`); if (!d) return;
        d.innerHTML = x.map(y => `<span class="chip ${y.f ? 'neg' : 'warn'}">${y.f ? '✗' : '!'} ${esc(y.t)}</span>`).join('');
        d.closest('.qg-f').classList.toggle('hat-fehler', x.some(y => y.f));
        d.closest('.qg-f').classList.toggle('hat-hinweis', x.length > 0);
      });
      $('qgSum').innerHTML = `<div class="qg-zahlen">
          <div><b>${e.fragen.length}</b><small>Fragen</small></div>
          <div class="${p.fehler ? 'neg' : 'pos'}"><b>${p.fehler || '✓'}</b><small>${p.fehler ? 'Fehler' : 'keine Fehler'}</small></div>
          <div class="${p.hinweise ? 'warn' : ''}"><b>${p.hinweise}</b><small>Hinweise</small></div>
          <div class="qg-balken" title="Schwierigkeit"><div><span class="s-leicht" style="flex:${diff.leicht}"></span><span class="s-mittel" style="flex:${diff.mittel}"></span><span class="s-schwer" style="flex:${diff.schwer}"></span></div>
            <small>${diff.leicht} leicht · ${diff.mittel} mittel · ${diff.schwer} schwer</small></div></div>
        ${p.glob.length ? `<div class="qg-glob">${p.glob.map(g => `<span class="chip ${g.f ? 'neg' : 'warn'}">${esc(g.t)}</span>${g.mischen ? ' <button class="btn klein" id="qgMisch">Positionen mischen</button>' : ''}`).join(' ')}</div>` : ''}
        <label class="qg-check small"><input type="checkbox" id="qgNurP" ${mod._nurProbleme ? 'checked' : ''}> nur Fragen mit Fehlern/Hinweisen zeigen</label>`;
      const b = $('qgAus');
      b.textContent = (e.ziel === 'quiz' || e.ziel === 'jeopardy' ? '➜ ' : '⬇ ') + z.aus;
      b.disabled = !!p.fehler;
      $('qgFussInfo').textContent = p.fehler ? `Erst ${p.fehler} Fehler beheben` : p.hinweise ? 'Hinweise sind kein Hindernis – nur kurz drüberschauen' : '';
    };

    const ausgeben = async () => {
      const e = QG.entwurf;
      if (qgPruefen(e).fehler) return toast('Bitte zuerst die rot markierten Fehler beheben');
      if (e.ziel === 'blooket') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([qgBlooketCsv(e)], { type: 'text/csv;charset=utf-8' }));
        a.download = qgDateiname('Blooket', e, 'csv'); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        return toast('⬇ Gespeichert – direkt bei Blooket hochladen, nicht vorher in Excel öffnen und speichern');
      }
      if (e.ziel === 'kahoot') {
        try { await qgKahootXlsx(e); toast('⬇ Gespeichert – bei Kahoot „Neues Kahoot → Fragen importieren“ wählen'); } catch (err) { toast('⚠️ ' + err.message); }
        return;
      }
      const titel = (e.thema.split('\n')[0].slice(0, 60) || 'Neues Quiz') + (e.fach ? ` (${e.fach})` : '');
      state.quizze.push({ id: uid(), titel, fragen: e.fragen.map(f => ({ id: uid(), typ: f.antworten.length === 2 && f.antworten[0] === 'Wahr' ? 'tf' : 'mc', kat: f.kat,
        punkte: e.ziel === 'jeopardy' ? f.punkte : { leicht: 100, mittel: 200, schwer: 300 }[f.schwierigkeit], frage: f.frage, antworten: f.antworten.slice(), richtig: f.richtig })) });
      QG.entwurf = null; save();
      toast(`✅ „${titel}“ mit ${e.fragen.length} Fragen ist jetzt in der Quiz-Liste`);
      location.hash = '#/quiz';
    };

    const ersetzen = async i => {
      const e = QG.entwurf, alt = e.fragen[i], knopf = body.querySelector(`[data-i="${i}"] [data-neu]`);
      knopf.disabled = true; knopf.classList.add('dreht');
      try {
        const andere = e.fragen.filter((_, k) => k !== i).map(f => '- ' + f.frage).join('\n');
        const extra = `\n\nErstelle nur diese EINE Frage${e.ziel === 'jeopardy' ? ` für die Kategorie „${alt.kat}“ mit ${alt.punkte} Punkten` : ''}${alt.antworten.length === 2 ? ' als Wahr/Falsch-Frage' : ''}, Schwierigkeit „${alt.schwierigkeit}“.\nSie muss etwas anderes abfragen als diese vorhandenen Fragen:\n${andere}\nund auch anders als: ${alt.frage}\nPrüfe sie vor der Ausgabe genau (Lösung sicher richtig, keine falsche Antwort auch richtig).`;
        const roh = await qgClaude('fragen', qgSystem(e), qgAuftrag(e, 1, extra), 'medium');
        const neu = qgAufbereiten(roh.fragen, e)[0];
        if (!neu) throw new Error('Keine Frage erhalten');
        if (e.ziel === 'jeopardy') { neu.kat = alt.kat; neu.punkte = alt.punkte; }
        e.fragen[i] = neu; save(); vorschau();
      } catch (err) { toast('⚠️ ' + err.message); knopf.disabled = false; knopf.classList.remove('dreht'); }
    };

    body.onsubmit = ev => {
      ev.preventDefault();
      const e = formLesen();
      if (!e.thema) return toast('Bitte ein Thema eingeben');
      if (schluessel) erstellen(e); else promptKopieren(e);
    };
    body.onclick = async ev => {
      const t = ev.target, zi = t.closest('[data-ziel]');
      if (zi) { if ($('qgF')) formLesen(); QG.ziel = zi.dataset.ziel; save(); start(); setTimeout(() => $('qgF')?.querySelector('textarea').focus(), 0); return; }
      if (t.id === 'qgJsonOk') return jsonEinlesen();
      if (t.id === 'qgKeyOk' || t.id === 'qgKeyWeg') {
        const key = t.id === 'qgKeyWeg' ? '' : $('qgKey').value.trim();
        if (t.id === 'qgKeyOk' && !key) return toast('Bitte den Schlüssel einfügen');
        const r = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'schluessel', key }) }).catch(() => null);
        const d = r ? await r.json().catch(() => ({})) : { fehler: 'Hilfsdienst nicht erreichbar' };
        if (d.fehler) return toast('⚠️ ' + d.fehler);
        schluessel = d.gesetzt; toast(schluessel ? '🟢 Schlüssel gespeichert' : 'Schlüssel entfernt');
        return QG.entwurf ? vorschau() : start();
      }
      if (t.id === 'qgNeu') { if (confirm('Diese Fragen verwerfen und neu beginnen?')) { QG.entwurf = null; save(); start(); } return; }
      if (t.id === 'qgAus') return ausgeben();
      if (t.id === 'qgMisch') { qgMischen(QG.entwurf.fragen); save(); return vorschau(); }
      if (t.id === 'qgMehr') {
        const e = QG.entwurf;
        e.fragen.push({ id: uid(), frage: '', antworten: ['', '', '', ''], richtig: 0, kat: e.ziel === 'jeopardy' ? (e.fragen.at(-1)?.kat || '') : '', punkte: e.ziel === 'jeopardy' ? 100 : 0, schwierigkeit: 'mittel', erklaerung: '' });
        save(); vorschau(); body.querySelector(`[data-i="${e.fragen.length - 1}"] .qg-frage`)?.focus(); return;
      }
      const karte = t.closest('[data-i]'); if (!karte) return;
      const i = +karte.dataset.i, f = QG.entwurf.fragen[i];
      if (t.closest('[data-r]')) {
        f.richtig = +t.closest('[data-r]').dataset.r; save();
        karte.querySelectorAll('.qg-a').forEach((l, j) => { l.classList.toggle('richtig', j === f.richtig); l.querySelector('.qg-r').textContent = j === f.richtig ? '✓' : QFARBEN[j][1]; });
        return pruefAnzeigen();
      }
      if (t.closest('[data-weg]')) { QG.entwurf.fragen.splice(i, 1); save(); return vorschau(); }
      if (t.closest('[data-neu]')) return ersetzen(i);
    };
    body.oninput = ev => {
      const t = ev.target, karte = t.closest('[data-i]');
      if (t.classList.contains('qg-frage')) hoehe(t);
      if (!karte || !QG.entwurf) return;
      const f = QG.entwurf.fragen[+karte.dataset.i];
      if (t.dataset.a != null) f.antworten[+t.dataset.a] = t.value;
      else if (t.dataset.k) {
        f[t.dataset.k] = t.dataset.k === 'punkte' ? +t.value : t.value;
        if (t.dataset.k === 'schwierigkeit') t.className = 'qg-schw s-' + t.value;
      }
      clearTimeout(mod._t); mod._t = setTimeout(() => { save(); pruefAnzeigen(); }, 300);
    };
    body.onchange = ev => {
      if (ev.target.id === 'qgNurP') { mod._nurProbleme = ev.target.checked; $('qgListe').classList.toggle('nurprob', mod._nurProbleme); }
    };

    if (QG.entwurf) vorschau(); else body.innerHTML = '<div class="placeholder" style="height:40vh">Einen Moment …</div>';
  },
  destroy() { clearTimeout(this._t); },
});
