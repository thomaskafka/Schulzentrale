'use strict';
/* ===== Abgleich Mac ⇄ iPad über OneDrive =====
   Am Mac schreibt der Hilfsdienst nach jedem Speichern „Schulzentrale-vom-Mac.json“ in den OneDrive-Ordner
   und holt „Schulzentrale-vom-iPad.json“ automatisch ab. Am iPad (ohne Hilfsdienst) gibt es den Knopf ⇅.
   Gemischt wird dreifach (Basis = Stand des anderen Geräts beim letzten Abgleich): Neues von beiden Seiten
   bleibt erhalten, Gelöschtes bleibt gelöscht. Ändern beide Seiten genau dasselbe Feld, gewinnt dieses Gerät. */

const AB_KEY_BASIS = 'schulzentrale_abgleich_mac';   // iPad: zuletzt eingemischter Mac-Stand
const AB_KEY_INFO = 'schulzentrale_abgleich_info';    // iPad: Zeitpunkte
const AB_NICHTS = Symbol('fehlt');
const AB_GERAET = /^akt|Nav$|^akteAnsicht$/;

const abGleich = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const abKopie = x => x === AB_NICHTS || x === undefined ? x : JSON.parse(JSON.stringify(x));
const abObj = x => x && typeof x === 'object' && !Array.isArray(x);
/* Schlüssel für Listen: Einträge mit id oder einfache Werte (z.B. Favoriten) */
const abSchluessel = x => abObj(x) && typeof x.id === 'string' ? 'id:' + x.id : (x === null || typeof x !== 'object') ? 'v:' + JSON.stringify(x) : null;
const abListe = a => Array.isArray(a) && a.every(x => abSchluessel(x) !== null);

function abMischen(basis, lokal, fremd, info) {
  if (abGleich(lokal, fremd)) return abKopie(lokal);
  if (basis !== AB_NICHTS && abGleich(lokal, basis)) return abKopie(fremd);   // nur drüben geändert
  if (basis !== AB_NICHTS && abGleich(fremd, basis)) return abKopie(lokal);   // nur hier geändert
  if (lokal === AB_NICHTS) return abKopie(fremd);
  if (fremd === AB_NICHTS) return abKopie(lokal);
  if (abListe(lokal) && abListe(fremd)) {
    const b = new Map((abListe(basis) ? basis : []).map(x => [abSchluessel(x), x]));
    const l = new Map(lokal.map(x => [abSchluessel(x), x])), f = new Map(fremd.map(x => [abSchluessel(x), x]));
    const aus = [];
    lokal.forEach(x => {
      const k = abSchluessel(x);
      if (f.has(k)) aus.push(abMischen(b.has(k) ? b.get(k) : AB_NICHTS, x, f.get(k), info));
      else if (!(b.has(k) && abGleich(b.get(k), x))) aus.push(abKopie(x));   // drüben gelöscht und hier unverändert → weg
    });
    fremd.forEach(x => {
      const k = abSchluessel(x);
      if (!l.has(k) && !(b.has(k) && abGleich(b.get(k), x))) { aus.push(abKopie(x)); info.neu++; }   // hier gelöscht → weg
    });
    return aus;
  }
  if (abObj(lokal) && abObj(fremd)) {
    const aus = {}, bo = abObj(basis) ? basis : null;
    new Set([...Object.keys(lokal), ...Object.keys(fremd)]).forEach(k => {
      const bw = bo ? (k in bo ? bo[k] : AB_NICHTS) : AB_NICHTS, lw = k in lokal ? lokal[k] : AB_NICHTS, fw = k in fremd ? fremd[k] : AB_NICHTS;
      if (lw === AB_NICHTS && bw !== AB_NICHTS && abGleich(fw, bw)) return;    // hier gelöscht
      if (fw === AB_NICHTS && bw !== AB_NICHTS && abGleich(lw, bw)) return;    // drüben gelöscht
      if (lw === AB_NICHTS && bo && bw === AB_NICHTS) info.neu++;
      const v = abMischen(bw, lw, fw, info);
      if (v !== AB_NICHTS && v !== undefined) aus[k] = v;
    });
    return aus;
  }
  info.konflikte++;
  return abKopie(lokal);
}
/** state mit einem Abgleich-Dokument { state, basis } mischen. basis = unser Stand, den das andere Gerät zuletzt eingemischt hat. */
function abgleichMischen(lokal, dok) {
  const info = { neu: 0, konflikte: 0 };
  const neu = abMischen(dok.basis ? dok.basis : AB_NICHTS, lokal, dok.state, info);
  // was gerade ausgewählt ist (Klasse, Schüler, Reiter …), bleibt pro Gerät
  Object.keys(neu).forEach(k => { if (AB_GERAET.test(k)) { if (k in lokal) neu[k] = abKopie(lokal[k]); else delete neu[k]; } });
  return { neu, info };
}
function abgleichDok(von, basis) { return { art: 'schulzentrale-abgleich', von, zeit: Date.now(), state, basis: basis || null }; }
const abZeit = ms => ms ? new Date(ms).toLocaleString('de-AT', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';

/* ---------- Mac: iPad-Datei automatisch abholen und einmischen ---------- */
async function abgleichMacPruefen(still = true) {
  if (!SERVER || _veraltet) return;
  try {
    const st = await fetch('/api/abgleich').then(r => r.json());
    if (!st.ordner || !st.ipad_neu) return st;
    const tippt = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    // nicht mitten im Tippen und nicht während eines Spiels am Beamer – dann beim nächsten Mal
    if (still && (tippt || _saveT || _speichert || document.body.dataset.theme === 'kids')) return st;
    const dok = await fetch('/api/abgleich?datei=ipad').then(r => r.json());
    if (dok.art !== 'schulzentrale-abgleich' || !dok.state) return st;
    if (!dok.basis) { toast('📲 iPad-Datei gefunden, aber das iPad hat den Mac-Stand noch nie geladen – zuerst am iPad „Stand vom Mac laden“.'); return st; }
    const { neu, info } = abgleichMischen(state, dok);
    Object.keys(state).forEach(k => delete state[k]); Object.assign(state, neu);
    save(); await saveServer();
    await fetch('/api/abgleich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'importiert' }) });
    try { sessionStorage.setItem('ab_meldung', `📲 Daten vom iPad übernommen${info.neu ? ` (${info.neu} neu)` : ''}`); } catch (e) { /* egal */ }
    location.reload();   // alle Programme frisch mit dem gemischten Stand
    return st;
  } catch (e) { /* OneDrive/Hilfsdienst gerade nicht erreichbar – beim nächsten Mal */ }
}
if (SERVER) { window.addEventListener('load', () => setTimeout(() => abgleichMacPruefen(), 1500)); setInterval(abgleichMacPruefen, 30000); }

/* ---------- iPad: Knopf ⇅ in der Kopfzeile ---------- */
const abInfo = () => { try { return JSON.parse(localStorage.getItem(AB_KEY_INFO)) || {}; } catch (e) { return {}; } };
const abInfoSetzen = x => { try { localStorage.setItem(AB_KEY_INFO, JSON.stringify({ ...abInfo(), ...x })); } catch (e) { /* egal */ } };

function abgleichDialog() {
  document.getElementById('abDlg')?.remove();
  const i = abInfo(), d = document.createElement('div');
  d.id = 'abDlg'; d.className = 'ab-dlg';
  d.innerHTML = `<div class="card ab-box"><div class="row between"><h2>⇅ Abgleich mit dem Mac</h2><button class="btn" data-ab="zu">✕</button></div>
    <p class="muted small">Über OneDrive, Ordner <b>Schulzentrale-Abgleich</b>. Neue Noten und Mitarbeit von beiden Geräten bleiben erhalten.</p>
    <div class="ab-schritt"><span class="ab-nr">1</span><div><b>Stand vom Mac laden</b><small>Zu Stundenbeginn: Datei <i>Schulzentrale-vom-Mac.json</i> in OneDrive wählen.</small><small class="muted">Zuletzt: ${abZeit(i.geladen)}</small></div>
      <label class="btn primary">Datei wählen<input type="file" accept=".json,application/json" id="abDatei" hidden></label></div>
    <div class="ab-schritt"><span class="ab-nr">2</span><div><b>Meinen Stand für den Mac sichern</b><small>Nach dem Eintragen: im Teilen-Fenster „In Dateien sichern“ → OneDrive → Schulzentrale-Abgleich, vorhandene Datei <i>ersetzen</i>.</small><small class="muted">Zuletzt: ${abZeit(i.gesichert)}</small></div>
      <button class="btn primary" data-ab="sichern">Sichern</button></div></div>`;
  document.body.appendChild(d);
}
async function abgleichSichern() {
  let basis = null; try { basis = JSON.parse(localStorage.getItem(AB_KEY_BASIS)); } catch (e) { /* keine */ }
  if (!basis) return toast('Bitte zuerst einmal den Stand vom Mac laden (Schritt 1).');
  const text = JSON.stringify(abgleichDok('iPad', basis)), name = 'Schulzentrale-vom-iPad.json';
  const datei = new File([text], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [datei] })) await navigator.share({ files: [datei], title: name });
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(datei); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
    abInfoSetzen({ gesichert: Date.now() }); abgleichDialog(); toast('✓ Stand gesichert – der Mac übernimmt ihn automatisch');
  } catch (e) { if (e.name !== 'AbortError') toast('⚠️ ' + e.message); }
}
async function abgleichLaden(file) {
  let dok; try { dok = JSON.parse(await file.text()); } catch (e) { return toast('Das ist keine Abgleich-Datei der Schulzentrale'); }
  if (dok.art !== 'schulzentrale-abgleich' || !dok.state) return toast('Das ist keine Abgleich-Datei der Schulzentrale');
  if (dok.von !== 'Mac') return toast('Bitte die Datei „Schulzentrale-vom-Mac.json“ wählen');
  let ergebnis;
  if (!localStorage.getItem(AB_KEY_BASIS)) {
    // erster Abgleich: iPad übernimmt einfach alles vom Mac
    if (state.klassen.some(k => !/Beispiel/.test(k.name)) && !confirm('Erster Abgleich: Die Daten auf diesem iPad werden durch den Stand vom Mac ersetzt. Fortfahren?')) return;
    ergebnis = { neu: dok.state, info: { neu: 0, konflikte: 0 } };
  } else ergebnis = abgleichMischen(state, dok);
  Object.keys(state).forEach(k => delete state[k]); Object.assign(state, ergebnis.neu);
  save();
  try { localStorage.setItem(AB_KEY_BASIS, JSON.stringify(dok.state)); } catch (e) { toast('⚠️ Speicher am iPad voll?'); }
  abInfoSetzen({ geladen: Date.now(), macZeit: dok.zeit });
  try { sessionStorage.setItem('ab_meldung', `✓ Stand vom Mac (${abZeit(dok.zeit)}) geladen`); } catch (e) { /* egal */ }
  location.reload();
}
window.addEventListener('load', () => { try { const m = sessionStorage.getItem('ab_meldung'); if (m) { sessionStorage.removeItem('ab_meldung'); setTimeout(() => toast(m), 300); } } catch (e) { /* egal */ } });

if (!SERVER) {
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('button');
    b.className = 'notesbtn ab-knopf'; b.title = 'Abgleich mit dem Mac über OneDrive'; b.innerHTML = '⇅ <span>Abgleich</span>';
    b.onclick = abgleichDialog;
    document.querySelector('.topbar [data-open-notes]')?.before(b);
    // Erinnerung: lange nicht geladen
    const i = abInfo();
    if (!i.geladen || Date.now() - i.geladen > 8 * 3600e3) b.classList.add('erinnern');
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-ab]'); if (!a) return;
    if (a.dataset.ab === 'zu') document.getElementById('abDlg')?.remove();
    if (a.dataset.ab === 'sichern') abgleichSichern();
  });
  document.addEventListener('change', e => { if (e.target.id === 'abDatei' && e.target.files[0]) abgleichLaden(e.target.files[0]); });
  // ohne Hilfsdienst: App-Dateien für den Offline-Betrieb zwischenspeichern
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
