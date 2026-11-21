'use strict';
/* ===== Schlichte Linien-Symbole (Organisation) ===== */

const ICONS = {
  kalender: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  heft: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4"/>',
  dokument: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  raster: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  stift: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  personen: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20.5v-.5a6.5 6.5 0 0 1 13 0v.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20.5v-.5a6.5 6.5 0 0 0-4-6"/>',
  notiz: '<path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9l-6 6H5a1 1 0 0 1-1-1z"/><path d="M14 20v-5a1 1 0 0 1 1-1h5"/>',
  regler: '<path d="M4 6h9M19 6h1M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="16" cy="6" r="2.2"/><circle cx="9" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/>',
  ordner: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  haus: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  vollbild: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  pfeil: '<path d="m9 6 6 6-6 6"/>',
  sanduhr: '<path d="M6 2.5h12M6 21.5h12M7.5 2.5v3.5a4.5 4.5 0 0 0 9 0V2.5M7.5 21.5V18a4.5 4.5 0 0 1 9 0v3.5"/>',
  rad: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
  pokal: '<path d="M8 21h8M12 16.5V21M7 3.5h10V9a5 5 0 0 1-10 0z"/><path d="M17 5.5h3V7a3 3 0 0 1-3 3M7 5.5H4V7a3 3 0 0 0 3 3"/>',
  frage: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1 1-1.1 1.7v.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  termin: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/><path d="m9 15.5 2 2 4-4"/>',
  tafel: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2.5h6v3H9z"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  buchstaben: '<path d="M3.5 19 8.5 5l5 14M5.3 14h6.4"/><path d="M15.5 10h5M15.5 14h5M15.5 18h3"/>',
  geschenk: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8C10.5 5 7 4.5 7 6.8 7 8 12 8 12 8s5 0 5-1.2C17 4.5 13.5 5 12 8z"/>',
  stationen: '<path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6"/><path d="M17.7 2.5v4h-4M6.3 21.5v-4h4"/>',
  funke: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  woche: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M7 13h10M7 16.5h6"/>',
  regal: '<path d="M4 3.5v17M20 3.5v17M4 20.5h16"/><rect x="6.5" y="6" width="3" height="8" rx=".6"/><rect x="10.5" y="5" width="3" height="9" rx=".6"/><path d="M15 14.2l1.9-7.6 2.6.7"/><path d="M6 17h12"/>',
  bingo: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  galgen: '<path d="M4 21h9M7 21V3.5h8.5V6"/><circle cx="15.5" cy="8.3" r="2.2"/><path d="M15.5 10.5v4.5M13 13h5M15.5 15l-2 3M15.5 15l2 3"/>',
  sprechblase: '<path d="M4 5.5h16v10H11l-4.5 4v-4H4z"/><path d="M9 9l6 3.5M15 9l-6 3.5"/>',
  figur: '<circle cx="12" cy="4.8" r="2"/><path d="M12 7v7M12 14l-3.5 6M12 14l3.5 6M5 8.5l7 1.5 7-2.5"/>',
  qr: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM18 14h2.5M14 18v2.5"/>',
  ziel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  muenze: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2.1 2.8.9 2.8 2.1-1.2 2-2.8 2c-1.3 0-2.4-.5-2.9-1.5M12 6v1.8M12 16.2V18"/>',
  gitter: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9.3h17M3.5 14.7h17M9.2 4v16M14.8 4v16"/>',
  memory: '<rect x="3" y="5" width="8" height="11" rx="1.5"/><rect x="13" y="8" width="8" height="11" rx="1.5"/><path d="M7 9.5v2M17 12.5v2"/>',
  raetsel: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/><path d="M9.2 3.5h5.6v5.7H9.2z" fill="currentColor" opacity=".25"/>',
  schloss: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.3" r="1.4"/><path d="M12 16.7v1.6"/>',
  flamme: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.3 3.6-8.3.4 1.6 1.4 2.8 2.6 3.4.2-2.6 1.4-5.2 3.3-6.9-.2 2.7.9 4.6 2.1 6.4 1 1.5 1.4 3 1.4 4.8 0 3.9-2.6 6.8-6.5 6.8z"/>',
  vier: '<rect x="3" y="4" width="18" height="15" rx="2.5"/><circle cx="8" cy="9" r="1.6"/><circle cx="12" cy="9" r="1.6"/><circle cx="16" cy="9" r="1.6"/><circle cx="8" cy="14" r="1.6" fill="currentColor"/><circle cx="12" cy="14" r="1.6" fill="currentColor"/><circle cx="16" cy="14" r="1.6"/><path d="M5 19v2M19 19v2"/>',
  flagge: '<path d="M5 21V4"/><path d="M5 4h13l-2.5 4L18 12H5"/><path d="M9 4v8M13 4v8M5 8h13"/>',
  birne: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2v.5h5V16c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
};
/** Symbol als SVG; mit Farbe → im farbigen, abgerundeten Quadrat (wie iOS-Einstellungen) */
function ico(name, farbe, groesse = 22) {
  const svg = `<svg viewBox="0 0 24 24" width="${groesse}" height="${groesse}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  return farbe ? `<span class="ico" style="--ic:${farbe}">${svg}</span>` : svg;
}
/** Seitentitel im Organisations-Stil */
const seitenTitel = (name, farbe, titel, zusatz = '') => `<h1 class="ptitle">${ico(name, farbe, 20)}<span>${titel}</span>${zusatz}</h1>`;

/* ===== Geführte Kurswahl: zuerst Klasse/Gruppe → dann Fach → dann Inhalt =====
   In render(el) eines Programms:  if (kursWahl(this, el, titelHtml)) return;
   Danach statt Auswahllisten:     kopf.appendChild(kursPfad(this, el)); */
function kursWahl(mod, el, titel) {
  if (mod._kw === 'fertig' && aktKlasse() && aktFach()) return false;
  const schritt = mod._kw === 'fach' && aktKlasse() ? 'fach' : 'klasse';
  const k = aktKlasse(), weiter = () => { mod._kw = 'fertig'; const n = el.cloneNode(false); el.replaceWith(n); mod.render(n); };
  const kachel = x => `<button class="wahl ${k && x.id === k.id ? 'zuletzt' : ''}" data-wk="${x.id}"><span class="wahl-t">${esc(x.name)}</span>
    <span class="wahl-s">${schuelerVon(x).length} Kinder · ${x.faecher.map(f => esc(f.name)).join(', ')}</span>${k && x.id === k.id ? '<span class="wahl-zuletzt">zuletzt</span>' : ''}</button>`;
  const kl = state.klassen.filter(x => !istGruppe(x)), gr = state.klassen.filter(istGruppe);
  el.innerHTML = `<div class="page">
    <div class="pagehead">${titel}</div>
    <nav class="akte-pfad">${schritt === 'fach' ? `<button data-wzurueck>Alle Klassen</button><i>›</i><span>${esc(k.name)}</span>` : '<span>Alle Klassen</span>'}</nav>
    ${schritt === 'klasse' ? `<h2 class="wahl-h">Klasse wählen</h2><div class="wahl-grid">${kl.map(kachel).join('') || '<p class="muted">Noch keine Klasse – unter <a href="#/klassen">Organisation → Klassen & Gruppen</a> anlegen.</p>'}</div>
        <h2 class="wahl-h">Gruppen <span class="muted small">klassenübergreifend, z.B. 1A/B Deutsch</span></h2><div class="wahl-grid">${gr.map(kachel).join('')}
          <a class="wahl wahl-neu" href="#/klassen"><span class="wahl-t">+</span><span class="wahl-s">Gruppe anlegen (unter „Klassen & Gruppen“)</span></a></div>`
      : `<h2 class="wahl-h">${esc(k.name)} – Fach wählen</h2><div class="wahl-grid">${k.faecher.map(f => `<button class="wahl ${f.id === state.aktFach ? 'zuletzt' : ''}" data-wf="${f.id}">
          <span class="wahl-t">${esc(f.name)}</span><span class="wahl-s">${kursSchueler(k, f).length} Kinder${f.nur && f.nur.length ? ' · Teilgruppe' : ''}</span>${f.id === state.aktFach ? '<span class="wahl-zuletzt">zuletzt</span>' : ''}</button>`).join('')}
          ${gruppenVonKlasse(k).flatMap(g => g.faecher.map(f => `<button class="wahl wahl-gruppe" data-wgk="${g.id}" data-wgf="${f.id}">
            <span class="wahl-badge">Gruppe</span><span class="wahl-t">${esc(f.name)}</span><span class="wahl-s">${esc(g.name)} · ${kursSchueler(g, f).length} Kinder</span></button>`)).join('')}
          <button class="wahl wahl-neu" data-wneu><span class="wahl-t">+</span><span class="wahl-s">Fach hinzufügen</span></button></div>`}
  </div>`;
  el.onclick = e => {
    const t = e.target;
    const kb = t.closest('[data-wk]');
    if (kb) {
      const neu = kb.dataset.wk !== state.aktKlasse; state.aktKlasse = kb.dataset.wk; if (neu) state.aktFach = null;
      const kk = aktKlasse(); save();
      if (kk.faecher.length === 1 && !gruppenVonKlasse(kk).length) { state.aktFach = kk.faecher[0].id; save(); weiter(); } else { mod._kw = 'fach'; kursWahl(mod, el, titel); }
      return;
    }
    const gb = t.closest('[data-wgk]'); if (gb) { state.aktKlasse = gb.dataset.wgk; state.aktFach = gb.dataset.wgf; save(); weiter(); return; }
    const fb = t.closest('[data-wf]'); if (fb) { state.aktFach = fb.dataset.wf; save(); weiter(); return; }
    if (t.closest('[data-wneu]')) { const f = fachHinzufuegen(aktKlasse(), prompt(`Neues Fach für ${aktKlasse().name}:`, '')); if (f) { state.aktFach = f.id; save(); weiter(); } return; }
    if (t.closest('[data-wzurueck]')) { mod._kw = 'klasse'; kursWahl(mod, el, titel); }
  };
  return true;
}
/** Pfad „Alle Klassen › 1A › Mathematik“ – ein Klick führt zurück zur Auswahl */
function kursPfad(mod, el) {
  const k = aktKlasse(), f = aktFach(k), nav = document.createElement('nav');
  nav.className = 'akte-pfad kurs-pfad';
  nav.innerHTML = `<button data-pz="klasse">Alle Klassen</button><i>›</i>${k.faecher.length > 1 ? `<button data-pz="fach">${esc(k.name)}</button>` : `<span class="pk">${esc(k.name)}</span>`}<i>›</i><span>${esc(f.name)}${f.nur && f.nur.length ? ' <small class="muted">(Teilgruppe)</small>' : ''}</span>`;
  nav.addEventListener('click', e => {
    const b = e.target.closest('[data-pz]'); if (!b) return;
    e.stopPropagation(); mod._kw = b.dataset.pz;
    if (mod.destroy) mod.destroy();
    const n = el.cloneNode(false); el.replaceWith(n); mod.render(n);
  });
  return nav;
}
/** Gruppen, in denen Kinder dieser Klasse sind (z.B. 1A → „1A/B Deutsch“) */
function gruppenVonKlasse(k) {
  if (!k || istGruppe(k)) return [];
  const ids = new Set(k.schueler.map(s => s.id));
  return state.klassen.filter(g => istGruppe(g) && (g.mitglieder || []).some(id => ids.has(id)));
}
