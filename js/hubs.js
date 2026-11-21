'use strict';
/* ===== Übersichtsseiten: Organisation & Unterricht – Favoriten oben, darunter kompakte Kacheln in Themengruppen ===== */

state.favoriten ||= [];   // hrefs der markierten Programme (z.B. '#/timer')
const istFavorit = href => state.favoriten.includes(href);
const favoritProgramme = () => state.favoriten.map(h => alleProgramme().find(a => a.href === h)).filter(Boolean);

/* Stern anklicken = Favorit an/aus (überall, wo ein [data-stern] steht) */
document.addEventListener('click', e => {
  const s = e.target.closest('[data-stern]'); if (!s) return;
  e.preventDefault(); e.stopPropagation();
  const h = s.dataset.stern;
  state.favoriten = istFavorit(h) ? state.favoriten.filter(x => x !== h) : [...state.favoriten, h];
  save(); route();
  toast(istFavorit(h) ? '★ Zu den Favoriten hinzugefügt' : 'Aus den Favoriten entfernt');
}, true);

const sternKnopf = a => a.notes ? '' : `<span class="stern ${istFavorit(a.href) ? 'an' : ''}" data-stern="${a.href}" role="button" title="${istFavorit(a.href) ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'}">${istFavorit(a.href) ? '★' : '☆'}</span>`;
const kachelHtml = (a, gross) => `<a class="kachel ${gross ? 'fav' : ''} ${istFavorit(a.href) ? 'ist-fav' : ''}" href="${a.href}" ${a.notes ? 'data-open-notes' : ''}>
    <span class="kachel-ic">${ico(a.ic, null, gross ? 26 : 22)}</span>
    <span class="kachel-txt"><b>${a.title}</b><small>${a.sub}</small></span>${sternKnopf(a)}</a>`;

function hubSeite(el, titel, b, liste) {
  const zl = zuletzt().map(programm).filter(a => a && liste.includes(a)).slice(0, 5);
  const favs = favoritProgramme().filter(a => liste.includes(a));
  el.innerHTML = `<div class="page hub">
    <div class="pagehead"><h1>${titel}</h1>
      ${zl.length ? `<div class="hub-zuletzt"><span>Zuletzt</span>${zl.map(a => `<a href="${a.href}">${ico(a.ic, null, 16)}${a.title}</a>`).join('')}</div>` : ''}</div>
    ${favs.length ? `<section class="hub-favs"><h2>★ Favoriten</h2><div class="kachel-grid">${favs.map(a => kachelHtml(a, true)).join('')}</div></section>`
      : '<p class="hub-tipp muted small">Tipp: Mit dem ☆ rechts auf einer Kachel markierst du Favoriten – sie stehen dann groß ganz oben und auf der Startseite.</p>'}
    <div class="hub-gruppen">${BEREICHSGRUPPEN[b].map(([g, t]) => `<section class="hub-gruppe"><h2>${t}</h2>
      <div class="kachel-grid">${liste.filter(a => a.gr === g).map(a => kachelHtml(a, false)).join('')}</div></section>`).join('')}</div>
  </div>`;
}

registerModule({
  id: 'organisation', title: 'Organisation', icon: '📂',
  render(el) { hubSeite(el, 'Organisation', 'organisation', ORGA); },
});

registerModule({
  id: 'unterricht', title: 'Unterricht & Spiele', icon: '🎒',
  render(el) { hubSeite(el, 'Unterricht & Spiele', 'unterricht', SPIELE); },
});
