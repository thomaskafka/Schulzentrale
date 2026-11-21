'use strict';
/* ===== Navigation & Start ===== */

/* Organisation: ruhiger „Apple“-Stil mit Linien-Symbolen */
const ORGA = [
  { gr: 'heute', href: '#/stundenplan', ic: 'kalender', farbe: '#ff3b30', title: 'Stundenplan', sub: 'Heute & Woche aus WebUntis' },
  { gr: 'heute', href: '#/wochen', ic: 'woche', farbe: '#ff9500', title: 'Wochennotizen', sub: 'Ideen pro Kurs & Woche aus dem Stundenplan' },
  { gr: 'heute', href: '#/kalender', ic: 'termin', farbe: '#ff2d55', title: 'Kalender', sub: 'Termine, Ferien, Schularbeiten' },
  { gr: 'noten', href: '#/aufzeichnungen', ic: 'heft', farbe: '#007aff', title: 'Aufzeichnungen', sub: 'Mitarbeit, HÜ, Tests, Kursübersicht' },
  { gr: 'noten', href: '#/schularbeiten', ic: 'dokument', farbe: '#af52de', title: 'Schularbeiten', sub: 'Punkte, Notenschlüssel, Ergebnisse' },
  { gr: 'noten', href: '#/akte', ic: 'ordner', farbe: '#5856d6', title: 'Schülerakte', sub: 'Alles zu einem Kind auf einen Blick' },
  { gr: 'noten', href: '#/raster', ic: 'raster', farbe: '#30b0c7', title: 'Bewertungsraster', sub: 'Referate, Präsentationen, Abgaben' },
  { gr: 'verwaltung', href: '#/material', ic: 'regal', farbe: '#1d5c7c', title: 'Materialkatalog', sub: 'Arbeitsblätter, Tests & Co. finden' },
  { gr: 'verwaltung', href: '#/planung', ic: 'stift', farbe: '#ff9500', title: 'Unterrichtsplanung', sub: 'Thema & Checkliste pro Stunde' },
  { gr: 'verwaltung', href: '#/klassen', ic: 'personen', farbe: '#34c759', title: 'Klassen & Gruppen', sub: 'Schülerlisten, Fächer, Import' },
  { gr: 'verwaltung', href: '#/links', ic: 'link', farbe: '#0a84ff', title: 'Links', sub: 'Lieblings-Websites mit einem Klick' },
];
/* Unterricht & Spiele: Übersicht im Stil der Apple-Plakate (die Spiele selbst sind bunt) */
const SPIELE = [
  { gr: 'zeit', href: '#/timer', ic: 'sanduhr', stil: 'schwarz', icon: '⏳', title: 'Timer', sub: 'Sanduhr · Blöcke · Rakete · Kerze …', color: '#ec4899' },
  { gr: 'zeit', href: '#/auftrag', ic: 'tafel', stil: 'weiss', icon: '📋', title: 'Arbeitsauftrag', sub: 'Aufgabe mit Sozialform & Timer', color: '#0071e3' },
  { gr: 'zeit', href: '#/stationen', ic: 'stationen', stil: 'silber', icon: '🔄', title: 'Stationenbetrieb', sub: 'Gruppen wechseln automatisch', color: '#22c55e' },
  { gr: 'zeit', href: '#/brainstorm', ic: 'birne', stil: 'nacht', icon: '💭', title: 'Brainstorming', sub: 'Wortwolke · Mindmap · Pinnwand', color: '#14b8a6' },
  { gr: 'zeit', href: '#/qr', ic: 'qr', stil: 'nacht', icon: '🔳', title: 'QR-Code', sub: 'Link aufs Tablet oder Handy', color: '#1d1d1f' },
  { gr: 'teams', href: '#/gruppen', ic: 'personen', stil: 'silber', icon: '👥', title: 'Gruppen bilden', sub: 'Teams für Punkte, Quiz, Stationen', color: '#22c55e' },
  { gr: 'teams', href: '#/zufall', ic: 'rad', stil: 'blau', icon: '🎡', title: 'Glücksrad & Würfel', sub: 'Glücksrad · Würfel · Zufallszahl', color: '#f97316' },
  { gr: 'teams', href: '#/punkte', ic: 'pokal', stil: 'graphit', icon: '🏆', title: 'Punktetafel & Buzzer', sub: 'Punkte zählen, wer drückt zuerst?', color: '#f59e0b' },
  { gr: 'teams', href: '#/belohnung', ic: 'geschenk', stil: 'graphit', icon: '🎁', title: 'Klassenbelohnung', sub: 'Gemeinsam auf ein Ziel sammeln', color: '#eab308' },
  { gr: 'quiz', href: '#/quiz', ic: 'frage', stil: 'weiss', icon: '❓', title: 'Quiz', sub: 'Millionenshow, Jeopardy, Vier gewinnt …', color: '#6366f1' },
  { gr: 'quiz', href: '#/quizgen', ic: 'funke', stil: 'nacht', icon: '✨', title: 'Fragen-Generator', sub: 'Quiz, Jeopardy, Blooket, Kahoot', color: '#a855f7' },
  { gr: 'quiz', href: '#/raetsel/bingo', ic: 'bingo', stil: 'weiss', icon: '🎱', title: 'Bingo', sub: 'Karten drucken & am Beamer ziehen', color: '#34c759' },
  { gr: 'quiz', href: '#/memory', ic: 'memory', stil: 'silber', icon: '🃏', title: 'Memory', sub: 'Paare finden – Begriff & Erklärung', color: '#5856d6' },
  { gr: 'quiz', href: '#/raetsel/kw', ic: 'raetsel', stil: 'weiss', icon: '🧩', title: 'Kreuzworträtsel', sub: 'Aus eigenen Begriffen, zum Drucken', color: '#34c759' },
  { gr: 'quiz', href: '#/escape', ic: 'schloss', stil: 'graphit', icon: '🔐', title: 'Escape-Room', sub: 'Rätselkette mit Schlössern & Countdown', color: '#ff9500' },
  { gr: 'wort', href: '#/wortspiele/galgen', ic: 'galgen', stil: 'blau', icon: '🔤', title: 'Galgenmännchen', sub: 'Wort erraten, Buchstabe für Buchstabe', color: '#8b5cf6' },
  { gr: 'wort', href: '#/wortspiele/tabu', ic: 'sprechblase', stil: 'blau', icon: '🚫', title: 'Tabu', sub: 'Erklären ohne die verbotenen Wörter', color: '#8b5cf6' },
  { gr: 'wort', href: '#/wortspiele/activity', ic: 'figur', stil: 'blau', icon: '🎭', title: 'Activity', sub: 'Erklären, zeichnen, vorspielen', color: '#8b5cf6' },
  { gr: 'wort', href: '#/wortspiele/wer', ic: 'frage', stil: 'blau', icon: '🕵️', title: 'Wer bin ich?', sub: 'Mit Ja/Nein-Fragen erraten', color: '#8b5cf6' },
  { gr: 'wort', href: '#/wortspiele/slf', ic: 'buchstaben', stil: 'blau', icon: '🌍', title: 'Stadt-Land-Fluss', sub: 'Buchstabe ziehen, Zeit läuft', color: '#8b5cf6' },
];
/* Themengruppen für die Übersichtsseiten */
const BEREICHSGRUPPEN = {
  organisation: [['heute', 'Heute & Termine'], ['noten', 'Leistungsbeurteilung'], ['verwaltung', 'Planung & Verwaltung']],
  unterricht: [['zeit', 'Ablauf & Werkzeuge'], ['teams', 'Teams & Motivation'], ['quiz', 'Quiz, Bingo & Rätsel'], ['wort', 'Wortspiele']],
};
const KIDS = new Set(['unterricht', 'wortspiele', 'raetsel', ...SPIELE.map(a => a.href.slice(2).split('/')[0])]);
const bereich = id => id === 'home' ? 'home' : KIDS.has(id) ? 'unterricht' : 'organisation';

let current = null;
function route() {
  const pfad = location.hash.replace(/^#\/?/, '') || 'home', [id, unter] = pfad.split('/');   // z.B. #/wortspiele/tabu öffnet gleich das Tabu
  const m = Modules[id] || Modules.home;
  if (unter) m._tab = unter;
  if (current && current.destroy) current.destroy();
  if (current !== m) m._kw = m._direkt && aktKlasse() && aktFach() ? 'fertig' : null; // neu geöffnet → Kurswahl beginnt bei „Klasse wählen“ (außer bei Direktsprung)
  m._direkt = false;
  current = m;
  const view = document.getElementById('view');
  const fresh = view.cloneNode(false); view.replaceWith(fresh); // entfernt alte Event-Listener
  const b = bereich(m.id);
  document.body.dataset.view = m.id;
  document.body.dataset.theme = b === 'unterricht' ? 'kids' : 'pro';
  const hub = { organisation: ['#/organisation', 'Organisation'], unterricht: ['#/unterricht', 'Unterricht & Spiele'] }[b];
  const imProgramm = hub && hub[0] !== '#/' + m.id;
  document.getElementById('crumb').innerHTML = m.id === 'home' ? ''
    : (imProgramm ? `<a href="${hub[0]}">${hub[1]}</a><i>›</i>` : '') + `<span>${esc(hub && hub[0] === '#/' + m.id ? hub[1] : m.title)}</span>`
      + (imProgramm ? `<button class="crumb-mehr" id="crumbMehr" title="Anderes Programm öffnen" aria-label="Anderes Programm öffnen">▾</button>` : '');
  if (imProgramm) zuletztMerken(programm(pfad) ? pfad : m.id);
  schnellZu();
  document.querySelectorAll('#topnav a').forEach(a => a.classList.toggle('on', a.dataset.b === b));
  document.title = m.id === 'home' ? 'Schulzentrale' : m.title + ' · Schulzentrale';
  m.render(fresh);
  window.scrollTo(0, 0);
}

document.getElementById('topnav').innerHTML = [['home', '#/home', 'Start'], ['organisation', '#/organisation', 'Organisation'], ['unterricht', '#/unterricht', 'Unterricht']]
  .map(([b, h, t]) => `<a href="${h}" data-b="${b}">${t}</a>`).join('');
document.getElementById('fsBtn').addEventListener('click', () => {
  document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
});
const topClock = () => document.getElementById('tclock').textContent = new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
topClock(); setInterval(topClock, 5000);

/* ----- Zuletzt verwendet (nur auf diesem Gerät) ----- */
function zuletzt() { try { return JSON.parse(localStorage.getItem('schulstart_zuletzt')) || []; } catch (e) { return []; } }
function zuletztMerken(id) { try { localStorage.setItem('schulstart_zuletzt', JSON.stringify([id, ...zuletzt().filter(x => x !== id)].slice(0, 8))); } catch (e) { /* egal */ } }
const alleProgramme = () => [...ORGA, ...SPIELE].filter(a => !a.notes);
const programm = id => alleProgramme().find(a => a.href === '#/' + id);

/* ----- Schnellwechsel: Menü in der Kopfzeile zu allen Programmen des Bereichs ----- */
function schnellZu() { document.getElementById('schnell')?.remove(); }
document.addEventListener('click', e => {
  if (e.target.closest('#crumbMehr')) {
    if (document.getElementById('schnell')) return schnellZu();
    const b = bereich(current.id), liste = b === 'unterricht' ? SPIELE : ORGA;
    const box = document.createElement('div'); box.id = 'schnell'; box.className = 'schnell';
    const link = a => `<a href="${a.href}" ${a.notes ? 'data-open-notes' : ''} class="${a.href === location.hash ? 'on' : ''} ${istFavorit(a.href) ? 'ist-fav' : ''}">${ico(a.ic, null, 18)}<span>${a.title}</span>${istFavorit(a.href) ? '<i>★</i>' : ''}</a>`;
    const favs = favoritProgramme();
    box.innerHTML = (favs.length ? `<div class="schnell-favs"><h4>★ Favoriten</h4><div>${favs.map(link).join('')}</div></div>` : '')
      + BEREICHSGRUPPEN[b].map(([g, t]) => `<div class="schnell-g"><h4>${t}</h4>${liste.filter(a => a.gr === g).map(link).join('')}</div>`).join('');
    const r = e.target.getBoundingClientRect(); box.style.top = r.bottom + 8 + 'px';
    document.body.appendChild(box); box.style.left = Math.max(12, Math.min(r.left - 20, innerWidth - box.offsetWidth - 12)) + 'px'; return;
  }
  if (!e.target.closest('#schnell') || e.target.closest('a')) schnellZu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') schnellZu(); });

Notizen.badge();
window.addEventListener('hashchange', route);
route();

/* Hell / Dunkel */
const MOND = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
const SONNE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
const modusKnopf = () => {
  const dunkel = document.documentElement.dataset.mode === 'dark';
  const b = document.getElementById('modeBtn');
  b.innerHTML = dunkel ? SONNE : MOND; b.title = dunkel ? 'Hell' : 'Dunkel';
};
document.getElementById('modeBtn').addEventListener('click', () => {
  const m = document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.mode = m;
  try { localStorage.setItem('schulstart_modus', m); } catch (e) { /* egal */ }
  modusKnopf();
});
modusKnopf();
