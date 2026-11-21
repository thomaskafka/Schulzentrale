'use strict';
/* ===== Schuljahr: Bundesland, Schulbeginn, Semester, Ferien & schulfreie Tage (Österreich, nach SchZG – ohne Gewähr) ===== */

const BUNDESLAENDER = {
  W: { name: 'Wien', ost: true, semWoche: 1, patron: [['11-15', 'Hl. Leopold (Landespatron)']] },
  N: { name: 'Niederösterreich', ost: true, semWoche: 1, patron: [['11-15', 'Hl. Leopold (Landespatron)']] },
  B: { name: 'Burgenland', ost: true, semWoche: 2, patron: [['11-11', 'Hl. Martin (Landespatron)']] },
  K: { name: 'Kärnten', semWoche: 2, patron: [['03-19', 'Hl. Josef (Landespatron)']] },
  S: { name: 'Salzburg', semWoche: 2, patron: [['09-24', 'Hl. Rupert (Landespatron)']] },
  T: { name: 'Tirol', semWoche: 2, patron: [['03-19', 'Hl. Josef (Landespatron)']] },
  V: { name: 'Vorarlberg', semWoche: 2, patron: [['03-19', 'Hl. Josef (Landespatron)']] },
  O: { name: 'Oberösterreich', semWoche: 3, patron: [['05-04', 'Hl. Florian (Landespatron)']] },
  St: { name: 'Steiermark', semWoche: 3, patron: [['03-19', 'Hl. Josef (Landespatron)']] },
};

const _iso = d => todayISO(d);
const _tag = (y, m, d) => new Date(y, m - 1, d);
const _plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
/** n-ter Wochentag (0 = So, 1 = Mo …) eines Monats */
const _nterTag = (y, m, wt, n) => { const d = _tag(y, m, 1); d.setDate(1 + ((wt - d.getDay() + 7) % 7) + 7 * (n - 1)); return d; };
/** Ostersonntag (gregorianisch) */
function ostern(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return _tag(y, monat, tag);
}

/** Bundesland aus den Einstellungen (ohne Auswahl: Regeln für Wien/NÖ, passt zum Schulbeginn 7.9.2026) */
const bundesland = () => BUNDESLAENDER[state.einstellungen.bundesland] || BUNDESLAENDER.W;

/** Alle Eckdaten eines Schuljahres, das im September des Jahres y beginnt */
function schuljahrDaten(y, blKey = state.einstellungen.bundesland) {
  const bl = BUNDESLAENDER[blKey] || BUNDESLAENDER.W;
  const beginn = _nterTag(y, 9, 1, bl.ost ? 1 : 2);
  const semMo = _nterTag(y + 1, 2, 1, bl.semWoche);
  // Sommerferien beginnen am Samstag zwischen 28.6. und 4.7. (Ost) bzw. 5.7. und 11.7.
  let sommerAb = bl.ost ? _tag(y + 1, 6, 28) : _tag(y + 1, 7, 5);
  while (sommerAb.getDay() !== 6) sommerAb = _plus(sommerAb, 1);
  const naechsterBeginn = _nterTag(y + 1, 9, 1, bl.ost ? 1 : 2);
  const E = ostern(y + 1);
  const ferien = [
    { von: _tag(y, 10, 27), bis: _tag(y, 10, 31), titel: 'Herbstferien' },
    { von: _tag(y, 12, 24), bis: _tag(y + 1, 1, 6), titel: 'Weihnachtsferien' },
    { von: _plus(semMo, -2), bis: _plus(semMo, 6), titel: 'Semesterferien' },
    { von: _plus(E, -8), bis: _plus(E, 2), titel: 'Osterferien' },
    { von: _plus(E, 48), bis: _plus(E, 51), titel: 'Pfingstferien' },
    { von: sommerAb, bis: _plus(naechsterBeginn, -1), titel: 'Sommerferien' },
  ];
  const frei = [
    { d: _tag(y, 10, 26), titel: 'Nationalfeiertag' },
    { d: _tag(y, 11, 1), titel: 'Allerheiligen' }, { d: _tag(y, 11, 2), titel: 'Allerseelen' },
    { d: _tag(y, 12, 8), titel: 'Mariä Empfängnis' },
    { d: _tag(y + 1, 5, 1), titel: 'Staatsfeiertag' },
    { d: _plus(E, 39), titel: 'Christi Himmelfahrt' },
    { d: _plus(E, 60), titel: 'Fronleichnam' },
    ...bl.patron.map(([md, titel]) => { const [m, d] = md.split('-').map(Number); return { d: _tag(m >= 9 ? y : y + 1, m, d), titel }; }),
  ];
  return {
    beginn: _iso(beginn), sem2: _iso(_plus(semMo, 7)), ende: _iso(_plus(sommerAb, -1)), naechsterBeginn: _iso(naechsterBeginn),
    ferien: ferien.map(f => ({ von: _iso(f.von), bis: _iso(f.bis), titel: f.titel })),
    frei: frei.map(f => ({ d: _iso(f.d), titel: f.titel })).sort((a, b) => a.d.localeCompare(b.d)),
  };
}

/** Erster Schultag des aktuellen Schuljahres (Einstellungen oder berechnet) */
const schulbeginn = () => state.einstellungen.schulbeginn || '2026-09-07';
const schuljahrJahr = () => +schulbeginn().slice(0, 4);
const schuljahrName = (y = schuljahrJahr()) => `${y}/${String(y + 1).slice(2)}`;
/** Beginn des 2. Semesters – eigene Angabe in den Einstellungen, sonst nach Bundesland berechnet */
const sem2Beginn = () => state.einstellungen.semester2 || schuljahrDaten(schuljahrJahr()).sem2;
const semVon = iso => iso && iso >= sem2Beginn() ? 2 : 1;
const aktSemester = () => semVon(todayISO());
