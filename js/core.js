'use strict';
/* ===== Gemeinsame Daten & Hilfsfunktionen für alle Programme ===== */

const KEY = 'schulstart_v1';
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const defaultState = () => ({
  klassen: [], aktKlasse: null, aktFach: null,   // Klasse: { id, name, schueler: [], faecher: [{ id, name }] }
  eintraege: [],          // Schnell-Einträge: Mitarbeit, HÜ, Material, Notiz – je Klasse (k) und Fach (f)
  tests: [],              // Leistungsfeststellungen mit Noten – je Klasse (k) und Fach (f)
  notizen: [],            // Post-its: { id, text, farbe, d, erledigt }
  countdown: { name: 'Weihnachtsferien', datum: '2026-12-24' },
  radListe: 'Hausübung erlassen 🎉\nWitz erzählen\nRätsel\nBewegungspause\nLieblingslied\nNochmal drehen',
  anwesenheit: { datum: '', abwesend: {} },
  timer: { min: 5, sec: 0, modus: 'bloecke', ziffern: true, ton: true },
  einstellungen: { icalUrl: '' },
});

/* Mit Hilfsdienst (Mac, http://localhost) liegen die Daten in daten/schulstart.json, sonst nur im Browser-Speicher
   (z.B. am iPad, wo die Schulzentrale als Webseite ohne Hilfsdienst läuft – Abgleich dann über OneDrive) */
let state, serverOk = false, _saveT = null, _saveFehler = false, datenVersion = '', _speichert = false, _veraltet = false, _zuletztJson = null;
// Stand nach dem Start merken – gespeichert wird nur, wenn sich danach wirklich etwas ändert
window.addEventListener('load', () => { _zuletztJson = JSON.stringify(state); });
if (location.protocol.startsWith('http')) {
  try { // synchron, damit alle Programme beim Start schon die Daten haben
    const x = new XMLHttpRequest(); x.open('GET', '/api/daten', false); x.send();
    const json = /json/.test(x.getResponseHeader('Content-Type') || '');
    if (x.status === 200 && json) { state = JSON.parse(x.responseText); serverOk = true; datenVersion = x.getResponseHeader('X-Version') || ''; }
    else if (x.status === 204) serverOk = true; // noch keine Datei – wird beim ersten Speichern angelegt
  } catch (e) { state = null; }
}
const SERVER = serverOk;
if (!state) try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
state = Object.assign(defaultState(), state || {});

if (!state.klassen.length && !state._demo) {
  const namen = ['Anna Berger', 'Ben Huber', 'Clara Wagner', 'David Gruber', 'Elena Pichler', 'Felix Steiner', 'Hannah Moser',
    'Jonas Mayer', 'Lea Hofer', 'Luca Bauer', 'Marie Leitner', 'Noah Fuchs', 'Emma Eder', 'Paul Schmid', 'Sophie Winkler',
    'Tobias Weber', 'Valentina Lang', 'Elias Wolf', 'Mia Reiter', 'Simon Brunner', 'Laura Schwarz', 'David Koller'];
  const k = { id: uid(), name: '1A (Beispiel)', faecher: [{ id: uid(), name: 'Mathematik' }, { id: uid(), name: 'Englisch' }],
    schueler: namen.map(n => { const [v, ...r] = n.split(' '); return { id: uid(), vorname: v, nachname: r.join(' '), niveau: '' }; }) };
  state.klassen.push(k); state.aktKlasse = k.id; state._demo = true;
}

/* Ältere Daten an neue Struktur anpassen */
state.klassen.forEach(k => { if (!k.faecher || !k.faecher.length) k.faecher = [{ id: uid(), name: 'Mein Fach' }]; });
state.eintraege.concat(state.tests).forEach(x => { if (!x.f) x.f = klasse(x.k)?.faecher[0].id; });
if (state.todos) {
  state.todos.filter(t => !t.done).forEach(t => state.notizen.push({ id: t.id, text: t.text, farbe: 0, d: todayISO(), erledigt: false }));
  delete state.todos;
}
delete state.ampel;
save();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { if (!serverOk) toast('⚠️ Speichern nicht möglich (Browser-Speicher blockiert?)'); }
  if (serverOk) { clearTimeout(_saveT); _saveT = setTimeout(saveServer, 400); }
}
function saveServer() {
  _saveT = null;
  if (_veraltet) return Promise.resolve();
  const json = JSON.stringify(state);
  if (_zuletztJson === null || json === _zuletztJson) return Promise.resolve();   // nichts geändert (oder noch beim Starten)
  _speichert = true;
  return fetch('/api/daten?basis=' + encodeURIComponent(datenVersion), { method: 'POST', body: json })
    .then(async r => {
      if (r.status === 409) { datenAnderswoGeaendert(true); return; }
      if (!r.ok) throw 0;
      const j = await r.json().catch(() => ({})); if (j.version) datenVersion = j.version; _zuletztJson = json;
      if (_saveFehler) toast('💾 Speichern klappt wieder'); _saveFehler = false;
    })
    .catch(() => { if (!_saveFehler) toast('⚠️ Speichern in Datei fehlgeschlagen – läuft „Schulzentrale starten“ noch?'); _saveFehler = true; })
    .finally(() => { _speichert = false; });
}
// Beim Schließen noch ausstehende Änderungen sofort schreiben
window.addEventListener('pagehide', () => { if (_saveT && !_veraltet) { clearTimeout(_saveT); navigator.sendBeacon('/api/daten?basis=' + encodeURIComponent(datenVersion), JSON.stringify(state)); } });

/* ----- Mehrere Fenster: Daten wurden woanders geändert → neu laden statt überschreiben ----- */
function datenAnderswoGeaendert(beimSpeichern = false) {
  if (_veraltet) return;
  const imUnterricht = document.body.dataset.theme === 'kids', tippt = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
  if (!imUnterricht && !tippt && !beimSpeichern) { try { localStorage.removeItem(KEY); } catch (e) { /* egal */ } location.reload(); return; }
  _veraltet = true; clearTimeout(_saveT); _saveT = null;
  const b = document.createElement('div'); b.className = 'veraltet-hinweis';
  b.innerHTML = `<span>🔄 Die Daten wurden in einem anderen Fenster geändert.${beimSpeichern ? ' Deine letzte Änderung hier wurde <b>nicht</b> gespeichert.' : ''}</span><button class="btn primary small" id="veraltetLaden">Neu laden</button>`;
  document.body.appendChild(b);
  b.querySelector('#veraltetLaden').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) { /* egal */ } location.reload(); };
}
if (SERVER) setInterval(async () => {
  if (!serverOk || _veraltet || _speichert || _saveT || document.hidden || !datenVersion) return;
  try { const j = await (await fetch('/api/version', { cache: 'no-store' })).json(); if (j.version && j.version !== datenVersion && !_speichert && !_saveT) datenAnderswoGeaendert(); } catch (e) { /* Hilfsdienst kurz weg */ }
}, 3000);
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function todayISO(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function fmtDate(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${+d}.${+m}.${y}`; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function dayOfYear(d = new Date()) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); }

/* ----- Klassen ----- */
function klasse(id) { return state.klassen.find(k => k.id === id); }
function aktKlasse() {
  let k = klasse(state.aktKlasse);
  if (!k && state.klassen.length) { k = state.klassen[0]; state.aktKlasse = k.id; }
  return k;
}
function sortSchueler(list) {
  return list.slice().sort((a, b) => a.nachname.localeCompare(b.nachname, 'de') || a.vorname.localeCompare(b.vorname, 'de'));
}
/** Kurzname: Vorname, bei doppelten Vornamen mit Nachnamen-Initial */
function kurzNamen(list) {
  const c = {}; list.forEach(s => c[s.vorname] = (c[s.vorname] || 0) + 1);
  const m = {}; list.forEach(s => m[s.id] = c[s.vorname] > 1 && s.nachname ? `${s.vorname} ${s.nachname[0]}.` : s.vorname);
  return m;
}
/** Klassen-Auswahl (Element). onChange wird nach Wechsel aufgerufen. */
/* ----- Kurse: Klassen, klassenübergreifende Gruppen und Teilgruppen pro Fach -----
   Klasse: { typ: 'klasse', schueler: [...] }   Gruppe: { typ: 'gruppe', mitglieder: [Schüler-IDs aus beliebigen Klassen] }
   Fach:   { id, name, nur?: [Schüler-IDs] }  → „nur“ = Teilgruppe (z.B. Englisch Gruppe 1) */
const istGruppe = k => k && k.typ === 'gruppe';
function schuelerIndex() { // id → { s, k } über alle Klassen (+ eigene Kinder von Gruppen ohne Stammklasse)
  const m = new Map();
  state.klassen.forEach(k => { if (!istGruppe(k)) k.schueler.forEach(s => m.set(s.id, { s, k })); });
  state.klassen.forEach(k => { if (istGruppe(k)) (k.schueler || []).forEach(s => { if (!m.has(s.id)) m.set(s.id, { s, k }); }); });
  return m;
}
function schuelerVon(k) {
  if (!k) return [];
  if (!istGruppe(k)) return k.schueler;
  const ix = schuelerIndex();
  // Mitglieder aus Klassen + Kinder, die nur in dieser Gruppe geführt werden (z.B. 3AB Deutsch ohne Stammklassen)
  return [...(k.mitglieder || []).map(id => ix.get(id)?.s).filter(Boolean), ...(k.schueler || [])];
}
function kursSchueler(k, f) {
  const alle = schuelerVon(k);
  return f && f.nur && f.nur.length ? alle.filter(s => f.nur.includes(s.id)) : alle;
}
function stammklasse(sid) { return schuelerIndex().get(sid)?.k; }
const klassenOptionen = sel => {
  const kl = state.klassen.filter(x => !istGruppe(x)), gr = state.klassen.filter(istGruppe);
  const opt = x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.name)}</option>`;
  return gr.length ? `<optgroup label="Klassen">${kl.map(opt).join('')}</optgroup><optgroup label="Gruppen">${gr.map(opt).join('')}</optgroup>` : kl.map(opt).join('');
};

function klassenSelect(onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'kselect';
  if (!state.klassen.length) {
    wrap.innerHTML = `<a class="btn primary" href="#/klassen">+ Erst eine Klasse anlegen</a>`;
    return wrap;
  }
  const draw = () => {
    const k = aktKlasse(), teile = k.faecher.filter(f => f.nur && f.nur.length), t = aktTeil(k);
    wrap.innerHTML = `<label>Klasse/Gruppe <select data-sel="k">${klassenOptionen(k.id)}</select></label>
      ${teile.length ? `<label>Kinder <select data-sel="t"><option value="">alle (${schuelerVon(k).length})</option>
        ${teile.map(f => `<option value="${f.id}" ${t && t.id === f.id ? 'selected' : ''}>${esc(f.name)} – Teilgruppe (${f.nur.length})</option>`).join('')}</select></label>` : ''}`;
  };
  wrap.addEventListener('change', e => {
    if (e.target.dataset.sel === 'k') { state.aktKlasse = e.target.value; state.aktTeil = ''; }
    if (e.target.dataset.sel === 't') state.aktTeil = e.target.value;
    save(); draw(); onChange && onChange();
  });
  draw();
  return wrap;
}

/* ----- Fächer (eine Klasse kann in mehreren Gegenständen unterrichtet werden) ----- */
const FACH_VORSCHLAEGE = ['Deutsch', 'Mathematik', 'Englisch', 'Biologie', 'Geschichte', 'Geographie', 'Physik', 'Chemie', 'Musik',
  'Kunst und Gestaltung', 'Bewegung und Sport', 'Religion', 'Digitale Grundbildung', 'Technik und Design', 'Ernährung und Haushalt', 'Berufsorientierung'];
function aktFach(k = aktKlasse()) {
  if (!k) return null;
  let f = k.faecher.find(x => x.id === state.aktFach);
  if (!f) { f = k.faecher[0]; state.aktFach = f.id; }
  return f;
}
function fachHinzufuegen(k, name) {
  name = (name || '').trim(); if (!name) return null;
  const f = k.faecher.find(x => x.name.toLowerCase() === name.toLowerCase()) || { id: uid(), name };
  if (!k.faecher.includes(f)) k.faecher.push(f);
  save(); return f;
}
/** Auswahl Klasse + Fach (Element) – für Aufzeichnungen */
function kursSelect(onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'kselect';
  if (!state.klassen.length) { wrap.innerHTML = `<a class="btn primary" href="#/klassen">+ Erst eine Klasse anlegen</a>`; return wrap; }
  const draw = () => {
    const k = aktKlasse(), f = aktFach(k);
    wrap.innerHTML = `<label>Klasse/Gruppe <select data-sel="k">${klassenOptionen(k.id)}</select></label>
      <label>Fach <select data-sel="f">${k.faecher.map(x => `<option value="${x.id}" ${x.id === f.id ? 'selected' : ''}>${esc(x.name)}${x.nur && x.nur.length ? ` (Teilgruppe, ${x.nur.length})` : ''}</option>`).join('')}<option value="__neu">+ Fach hinzufügen …</option></select></label>`;
  };
  wrap.addEventListener('change', e => {
    const k = aktKlasse();
    if (e.target.dataset.sel === 'k') { state.aktKlasse = e.target.value; state.aktFach = null; }
    if (e.target.dataset.sel === 'f') {
      if (e.target.value === '__neu') {
        const f = fachHinzufuegen(k, prompt(`Neues Fach für ${k.name}:`, ''));
        if (f) state.aktFach = f.id;
      } else state.aktFach = e.target.value;
    }
    save(); draw(); onChange && onChange();
  });
  draw();
  return wrap;
}

/* ----- Anwesenheit (gilt nur für heute; genutzt von Gruppen & Glücksrad) ----- */
function abwesendListe(kid) {
  if (state.anwesenheit.datum !== todayISO()) state.anwesenheit = { datum: todayISO(), abwesend: {} };
  return (state.anwesenheit.abwesend[kid] ||= []);
}
/** Gewählte Teilgruppe (für Gruppen bilden & Glücksrad), sonst null = ganze Klasse/Gruppe */
function aktTeil(k = aktKlasse()) { return k?.faecher.find(f => f.id === state.aktTeil && f.nur && f.nur.length) || null; }
/** Kinder, aus denen Gruppen/Glücksrad ziehen: ganze Klasse/Gruppe oder gewählte Teilgruppe */
function basisKinder(k) { const t = aktTeil(k); return t ? kursSchueler(k, t) : schuelerVon(k); }
function anwesende(k) { const ab = abwesendListe(k.id); return sortSchueler(basisKinder(k)).filter(s => !ab.includes(s.id)); }
function anwesenheitWidget(k, onChange) {
  const el = document.createElement('div');
  el.className = 'anw';
  const draw = () => {
    const ab = abwesendListe(k.id), alle = basisKinder(k), kn = kurzNamen(alle);
    el.innerHTML = `<div class="anw-head">Anwesend: <b>${alle.filter(s => !ab.includes(s.id)).length}</b> / ${alle.length} <span class="muted small">· Abwesende antippen</span></div>
      <div class="anw-chips">${sortSchueler(alle).map(s => `<button class="anw-chip ${ab.includes(s.id) ? 'off' : ''}" data-id="${s.id}">${esc(kn[s.id])}</button>`).join('')}</div>`;
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    const ab = abwesendListe(k.id), i = ab.indexOf(b.dataset.id);
    i >= 0 ? ab.splice(i, 1) : ab.push(b.dataset.id);
    save(); draw(); onChange && onChange();
  });
  draw();
  return el;
}

/* ----- Klang (WebAudio, ohne Dateien) ----- */
let _ac;
function audio() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}
function tone(freq, dur, type = 'sine', vol = 0.2, when = 0) {
  try {
    const ac = audio(), t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
  } catch (e) { /* kein Audio */ }
}
/** Ton mit gleitender Tonhöhe (z.B. „wusch“ oder Motor) */
function sweep(f1, f2, dur, type = 'sine', vol = 0.2, when = 0) {
  try {
    const ac = audio(), t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
  } catch (e) { /* kein Audio */ }
}
const sound = {
  tick: () => tone(1400, 0.04, 'square', 0.04),
  pop: () => tone(660, 0.12, 'triangle', 0.15),
  gong: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 1.8, 'sine', 0.22, i * 0.16)),
  tada: () => { tone(523, 0.15, 'triangle', 0.2); tone(659, 0.15, 'triangle', 0.2, 0.12); tone(784, 0.5, 'triangle', 0.22, 0.24); },
};

/* ----- Konfetti & Toast ----- */
function confetti(n = 140) {
  const box = document.createElement('div');
  box.className = 'confetti';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + 'vw';
    s.style.background = COLORS[i % COLORS.length];
    s.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    s.style.animationDelay = Math.random() * 0.6 + 's';
    s.style.setProperty('--r', (Math.random() * 1440 - 720) + 'deg');
    s.style.setProperty('--x', (Math.random() * 30 - 15) + 'vw');
    if (i % 3 === 0) s.style.borderRadius = '50%';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 5500);
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2700);
}
/* ===== Drucken / PDF: einheitliches, ruhiges A4-Layout =====
   opt.quer = Querformat · jede <section class="seite"> beginnt eine neue Seite */
const DRUCK_CSS = `
  @page { size: A4 __FORMAT__; margin: 13mm 14mm 15mm;
    @bottom-left { content: "Schulzentrale · __DATUM__"; font: 7.5pt -apple-system, "Helvetica Neue", Arial, sans-serif; color: #8e8e93; }
    @bottom-right { content: "Seite " counter(page) " von " counter(pages); font: 7.5pt -apple-system, "Helvetica Neue", Arial, sans-serif; color: #8e8e93; } }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1d1d1f; font-size: 9.5pt; line-height: 1.38; }
  body { margin: 0; }
  @media screen { body { background: #e5e5ea; padding: 18px; } .seite { background: #fff; width: __BREITE__; max-width: 100%; margin: 0 auto 18px; padding: 13mm 14mm; box-shadow: 0 2px 12px rgba(0,0,0,.12); } }
  .seite { break-after: page; } .seite:last-child { break-after: auto; }
  .kopf { display: flex; justify-content: space-between; align-items: flex-end; gap: 12pt; border-bottom: 1.4pt solid #1d1d1f; padding-bottom: 6pt; margin-bottom: 11pt; }
  .kopf h1 { font-size: 17pt; font-weight: 700; letter-spacing: -.02em; margin: 0; line-height: 1.15; }
  .kopf .unter { color: #6e6e73; font-size: 9pt; margin-top: 2pt; }
  .kopf .meta { text-align: right; color: #6e6e73; font-size: 8pt; white-space: nowrap; }
  h2 { font-size: 11pt; font-weight: 700; margin: 0 0 5pt; letter-spacing: -.01em; }
  h3 { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #6e6e73; margin: 8pt 0 3pt; }
  .block { break-inside: avoid; margin-bottom: 12pt; }
  table { width: 100%; border-collapse: collapse; font-size: 8.8pt; }
  thead { display: table-header-group; }
  th { text-align: left; font-weight: 600; font-size: 7.2pt; text-transform: uppercase; letter-spacing: .04em; color: #6e6e73; border-bottom: .9pt solid #8e8e93; padding: 3pt 5pt; }
  td { padding: 3.2pt 5pt; border-bottom: .5pt solid #e5e5ea; vertical-align: top; }
  tr { break-inside: avoid; } tbody tr:nth-child(even) td { background: #f7f7f9; }
  .r { text-align: right; } .c { text-align: center; } .nw { white-space: nowrap; } .muted { color: #6e6e73; } .klein { font-size: 7.5pt; }
  .np, .grade { display: inline-block; min-width: 15pt; text-align: center; font-weight: 700; border-radius: 4pt; padding: .5pt 4pt; font-size: 8.5pt; }
  .n1, .gr1 { background: #dcf5e3; color: #1d6b34; } .n2, .gr2 { background: #eaf6d6; color: #4a6b14; } .n3, .gr3 { background: #fdf3cf; color: #7a5b00; }
  .n4, .gr4 { background: #fde6cf; color: #8a4300; } .n5, .gr5 { background: #fbdcdc; color: #9b1c1c; }
  .kz { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5pt; margin: 4pt 0 6pt; }
  .kz div { border: .6pt solid #d1d1d6; border-radius: 5pt; padding: 4pt 6pt; } .kz b { display: block; font-size: 12pt; font-weight: 700; } .kz b .np { font-size: 11pt; padding: 0 6pt; } .kz div > span { display: block; font-size: 7pt; color: #6e6e73; line-height: 1.25; }
  .spalten { display: flex; gap: 9mm; align-items: flex-start; } .spalten > div { flex: 1; min-width: 0; }
  .spalten .kz { grid-template-columns: repeat(3, 1fr); }
  .pos { color: #1d7a35; font-weight: 600; } .neg { color: #b42318; font-weight: 600; }
  .kommentar { border-left: 2pt solid #1d1d1f; padding: 3pt 0 3pt 8pt; margin: 4pt 0; }
  .box { border: .6pt solid #d1d1d6; border-radius: 5pt; padding: 6pt 8pt; min-height: 30pt; }
  .hinweis { font-size: 7.2pt; color: #8e8e93; margin-top: 6pt; }
  .balken { display: inline-block; width: 60pt; height: 5pt; background: #e5e5ea; border-radius: 3pt; overflow: hidden; vertical-align: middle; margin-right: 5pt; }
  .balken i { display: block; height: 100%; background: #1d1d1f; }
  .ampel { color: #b42318; }
  .unterschrift { margin-top: 26pt; display: flex; gap: 20mm; } .unterschrift div { flex: 1; border-top: .6pt solid #1d1d1f; padding-top: 3pt; font-size: 7.5pt; color: #6e6e73; }
  ul.check { list-style: none; padding: 0; margin: 0; } ul.check li { padding: 2.5pt 0; border-bottom: .5pt solid #e5e5ea; }
`;
/* Seiten mit class="seite fit" werden bei Bedarf leicht verkleinert, damit sie auf genau ein Blatt passen */
const DRUCK_FIT = `document.querySelectorAll('.seite.fit').forEach(s => {
  const mm = 96 / 25.4, cs = getComputedStyle(s), pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const frei = (s.dataset.hoehe || 0) * mm, h = s.scrollHeight - pad;
  if (h > frei) s.style.zoom = Math.max(0.62, (frei - 4) / h).toFixed(3);
});`;
/** Neues Fenster mit Druck-Layout öffnen und drucken (opt.quer = Querformat) */
function druckFenster(titel, html, opt = {}) {
  const w = window.open('', '_blank');
  if (!w) return toast('Bitte Pop-ups für diese Seite erlauben');
  const css = DRUCK_CSS.replace('__FORMAT__', opt.quer ? 'landscape' : 'portrait').replace('__BREITE__', opt.quer ? '297mm' : '210mm').replace('__DATUM__', fmtDate(todayISO()));
  let inhalt = /class="seite/.test(html) ? html : `<section class="seite">${html}</section>`;
  inhalt = inhalt.replace(/class="seite fit"/g, `class="seite fit" data-hoehe="${opt.quer ? 210 - 28 : 297 - 28}"`);
  w.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${esc(titel)}</title><style>${css}</style></head><body>${inhalt}<script>${DRUCK_FIT}setTimeout(() => print(), 400)<\/script></body></html>`);
  w.document.close();
}
/** Einheitlicher Seitenkopf für Ausdrucke */
function druckKopf(titel, unter = '', meta = '') {
  return `<div class="kopf"><div><h1>${titel}</h1>${unter ? `<div class="unter">${unter}</div>` : ''}</div><div class="meta">${meta || 'Stand ' + fmtDate(todayISO())}</div></div>`;
}
/** Note als farbige Pille */
function notePill(n) {
  if (n == null || n === '') return '<span class="muted">–</span>';
  const g = Math.round(parseFloat(String(n).replace(',', '.')));
  return `<span class="np grade${g >= 1 && g <= 5 ? ` n${g} gr${g}` : ''}">${esc(String(n))}</span>`;
}
/** Ziffern über einer Zeichenfläche automatisch hell/dunkel färben – je nach Hintergrund dahinter */
function ziffernKontrast(cv, el) {
  if (!cv || !el || el.hidden || !cv.width) return;
  const jetzt = performance.now(); if (el._kt && jetzt - el._kt < 400) return; el._kt = jetzt;
  try {
    const c = cv.getContext('2d'), rc = cv.getBoundingClientRect(), re = el.getBoundingClientRect(), f = cv.width / rc.width;
    const y = Math.round((re.top + re.height / 2 - rc.top) * f); let summe = 0, n = 0;
    for (const fx of [0.2, 0.35, 0.65, 0.8]) {
      const x = Math.round((re.left + re.width * fx - rc.left) * f);
      if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) continue;
      const d = c.getImageData(x, y, 1, 1).data; summe += (0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2]) * (d[3] / 255) + 255 * (1 - d[3] / 255); n++;
    }
    if (n) el.classList.toggle('auf-dunkel', summe / n < 140);
  } catch (e) { /* egal */ }
}
function download(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ----- Modul-Registry ----- */
const Modules = {};
function registerModule(m) { Modules[m.id] = m; }

/** Externes Skript einmalig nachladen */
const _skripte = {};
function ladeSkript(src) {
  return _skripte[src] ||= new Promise((ok, err) => {
    const s = document.createElement('script'); s.src = src; s.onload = ok;
    s.onerror = () => { delete _skripte[src]; err(new Error('Konnte ' + src.split('/')[2] + ' nicht laden (Internet?)')); };
    document.head.appendChild(s);
  });
}
