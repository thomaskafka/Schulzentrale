'use strict';
/* ===== Gemeinsame Auswertung: Schularbeiten, Tests, Mitarbeit, HÜ → Schülerakte, Kursübersicht, Notenvorschlag ===== */

const NOTEN_TEXT = ['Sehr gut', 'Gut', 'Befriedigend', 'Genügend', 'Nicht genügend'];
const NIVEAUS = {
  ahs: { name: 'Standard AHS', kurz: 'AHS', pct: [89, 76, 64, 50] },
  std: { name: 'Standard', kurz: 'Std', pct: [64, 50, 38, 26] },
};
const GEWICHTUNG_STANDARD = { sa: 50, test: 25, ma: 15, hue: 10 };
state.schularbeiten ||= [];

const zahl = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const fmtZ = (n, d = 2) => n == null ? '' : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('de-AT');
/** Niveau eines Kindes aus der Klassenliste („AHS“ / „Standard“) */
const niveauVon = s => /ahs/i.test(s?.niveau || '') ? 'ahs' : /std|standard/i.test(s?.niveau || '') ? 'std' : 'ahs';

/* ---------- Schularbeiten-Berechnung ---------- */
/* LRS: Bei Kindern mit Lese-Rechtschreib-Schwäche (Schüler-Eintrag „lrs“) werden bestimmte Kategorien – standardmäßig „Rechtschreibung“ – nicht gewertet:
   sie zählen weder bei den Punkten noch beim Höchstwert (Note wird aus dem Rest berechnet). */
const lrsKat = c => c.lrsAus ?? /rechtschreib/i.test(c.name || '');
function schuelerPerId(sid) { for (const k of state.klassen) { const s = (k.schueler || []).find(x => x.id === sid); if (s) return s; } return null; }
const saAus = (sa, sid) => sid && schuelerPerId(sid)?.lrs ? sa.cats.filter(lrsKat).map(c => c.id) : [];
const saMax = (sa, sid) => { const aus = saAus(sa, sid); return sa.cats.reduce((a, c) => a + (aus.includes(c.id) ? 0 : (zahl(c.max) || 0)), 0); };
function saSumme(sa, sid, cats = sa.cats) {
  const p = sa.punkte[sid] || {}, aus = saAus(sa, sid); let sum = 0, any = false;
  for (const c of cats) { if (aus.includes(c.id)) continue; const v = zahl(p[c.id]); if (v != null) { sum += v; any = true; } }
  return any ? sum : null;
}
const saNiveau = (sa, sid) => sa.useLevels ? (sa.niveau[sid] || 'ahs') : 'ahs';
function saGrenzen(sa, niv, sid) { const m = saMax(sa, sid); return sa.scales[niv].map(v => sa.scaleMode === 'percent' ? (zahl(v) ?? 0) * m / 100 : (zahl(v) ?? 0)); }
function saNote(sa, sid) {
  const t = saSumme(sa, sid); if (t == null) return null;
  const g = saGrenzen(sa, saNiveau(sa, sid), sid);
  for (let i = 0; i < 4; i++) if (t >= g[i] - 1e-9) return i + 1;
  return 5;
}
function saErgebnis(sa, sid) {
  const p = saSumme(sa, sid), m = saMax(sa, sid);
  return p == null ? null : { punkte: p, max: m, pct: m ? p / m * 100 : null, note: saNote(sa, sid) };
}
const saVonKurs = (k, f, sem = null) => state.schularbeiten.filter(x => x.k === k.id && x.f === f.id && (!sem || semVon(x.datum) === sem)).sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));

/* ---------- Alles zu einem Kind in einem Kurs (sem = 1 / 2 → nur dieses Semester) ---------- */
function leistungen(k, f, sid, sem = null) {
  const imSem = d => !sem || semVon(d) === sem;
  const ein = state.eintraege.filter(e => e.k === k.id && e.f === f.id && e.s === sid && imSem(e.d));
  const c = t => ein.filter(e => e.t === t).length;
  // Tests/SÜ aus den Aufzeichnungen (übernommene Raster-Spalten auslassen – die kommen direkt aus dem Raster)
  const tests = state.tests.filter(t => t.k === k.id && t.f === f.id && !t.ausRaster && imSem(t.d))
    .map(t => ({ id: t.id, typ: t.typ, titel: t.titel, d: t.d, note: t.noten[sid] })).filter(t => t.note != null && t.note !== '');
  // Bewertungsraster (Referate, Plakate, Abgaben …) – immer aktuell, mit Punkten und Kommentar
  (state.bewertungen || []).filter(b => b.k === k.id && b.f === f.id && imSem(b.d)).forEach(b => {
    const r = (state.raster || []).find(x => x.id === b.raster), w = b.werte && b.werte[sid];
    if (!r || !w || !r.kriterien.some(c => w[c.id] !== undefined)) return;
    const p = r.kriterien.reduce((a, c) => a + (+w[c.id] || 0), 0), n = rasterNote(r, p);
    tests.push({ id: b.id, typ: r.name, titel: b.titel, d: b.d, note: String(n.note), punkte: p, max: rasterMax(r), pct: n.pz, komm: w._komm, raster: true });
  });
  tests.sort((a, b) => (a.d || '').localeCompare(b.d || ''));
  const sas = saVonKurs(k, f, sem).map(sa => ({ id: sa.id, titel: saTitel(sa), d: sa.datum, ...saErgebnis(sa, sid) })).filter(x => x.punkte != null);
  return { plus: c('ma+'), minus: c('ma-'), hue: c('hue-'), mat: c('mat-'), notizen: ein.filter(e => e.t === 'notiz'), eintraege: ein, tests, sas };
}
const saTitel = sa => `${sa.nr ? sa.nr + '. ' : ''}Schularbeit${sa.titel ? ' – ' + sa.titel : ''}`;
const schnitt = arr => { const n = arr.map(v => zahl(v)).filter(v => v != null && v >= 1 && v <= 5); return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null; };

/* ---------- Semesternote (von der Lehrkraft festgelegt) ---------- */
state.semesternoten ||= {};   // 'klasse|fach' → { schülerId: '2' }
const semNoteRoh = (k, f, sid) => state.semesternoten[k.id + '|' + f.id]?.[sid] ?? '';
function setSemNote(k, f, sid, v) {
  const key = k.id + '|' + f.id, m = (state.semesternoten[key] ||= {});
  v = String(v ?? '').trim(); v ? m[sid] = v : delete m[sid]; save();
}
/** Wie stark die Semesternote im 2. Semester zählt (Prozent, Rest = Leistungen des 2. Semesters) */
const semGewicht = f => f.semGewicht ?? 50;

/** Notenvorschlag aus einer Leistungssammlung */
function vorschlagAus(L, f) {
  const w = { ...GEWICHTUNG_STANDARD, ...(f.gewichtung || {}) };
  const maTests = L.tests.filter(t => t.typ === 'Mitarbeit').map(t => t.note);
  const maPM = L.plus + L.minus ? 1 + (1 - L.plus / (L.plus + L.minus)) * 4 : null;
  const teile = {
    sa: schnitt(L.sas.map(x => x.note)),
    test: schnitt(L.tests.filter(t => t.typ !== 'Mitarbeit').map(t => t.note)),
    ma: schnitt([...maTests, ...(maPM != null ? [maPM] : [])]),
    hue: L.eintraege.length || L.tests.length || L.sas.length ? Math.min(5, 1 + L.hue) : null,
  };
  let summe = 0, gew = 0;
  for (const key in teile) if (teile[key] != null && w[key] > 0) { summe += teile[key] * w[key]; gew += w[key]; }
  return { teile, wert: gew ? summe / gew : null };
}

/** Notenvorschlag – nur zur Orientierung, die Note legt die Lehrkraft fest.
    sem 1: nur Leistungen des 1. Semesters.
    sem 2: Jahresvorschlag = Semesternote (bzw. Vorschlag 1. Sem.) und Leistungen des 2. Semesters, gewichtet. */
function notenVorschlag(k, f, sid, sem = aktSemester()) {
  if (sem === 1) {
    const L = leistungen(k, f, sid, 1), r = vorschlagAus(L, f);
    return { sem: 1, L, teile: r.teile, wert: r.wert, semNote: zahl(semNoteRoh(k, f, sid)) };
  }
  const L1 = leistungen(k, f, sid, 1), r1 = vorschlagAus(L1, f), L = leistungen(k, f, sid, 2), r2 = vorschlagAus(L, f);
  const fest = zahl(semNoteRoh(k, f, sid)), S = fest ?? r1.wert, g = semGewicht(f);
  const wert = S == null ? r2.wert : r2.wert == null ? S : (S * g + r2.wert * (100 - g)) / 100;
  return { sem: 2, L, teile: r2.teile, wert, wert1: r1.wert, wert2: r2.wert, semNote: S, semNoteFest: fest != null };
}
const vorschlagText = v => v == null ? '–' : `${fmtZ(v, 1)} → ${Math.abs(v % 1 - 0.5) < 0.05 ? `${Math.floor(v)}–${Math.ceil(v)}` : Math.round(v)}`;
/** Hinweis-Ampel für die Kursübersicht */
function warnung(v) {
  if (!v) return '';
  const { wert, L } = v;
  if ((wert != null && wert >= 4.3) || L.hue >= 4) return 'rot';
  if ((wert != null && wert >= 3.6) || L.hue >= 2 || L.minus > L.plus + 2) return 'gelb';
  return '';
}

/** Alle Kurse, in denen ein Kind vorkommt */
function kurseVon(sid) {
  const out = [];
  state.klassen.forEach(k => k.faecher.forEach(f => { if (kursSchueler(k, f).some(s => s.id === sid)) out.push({ k, f }); }));
  return out;
}
