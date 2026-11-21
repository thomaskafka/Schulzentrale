'use strict';
/* ===== Startseite ===== */

registerModule({
  id: 'home', title: 'Start', icon: '🏠',
  render(el) {
    const doy = dayOfYear();
    const off = { fw: 0, fa: 0 };
    const pick = (arr, k) => arr[(doy + off[k]) % arr.length];

    el.innerHTML = `
      <section class="hero">
        <div class="hero-main">
          <div class="greet" id="hGreet"></div>
          <div class="hclock" id="hClock"></div>
          <div class="hdate" id="hDate"></div>
        </div>
        <div class="card countdown" id="hCd"></div>
      </section>
      <section class="entries">
        <a class="entry entry-orga entry-kids" href="#/organisation">
          <div class="entry-glyphs">${ORGA.slice(0, 8).map(a => `<span>${ico(a.ic, null, 24)}</span>`).join('')}</div>
          <div class="entry-t">Organisation</div>
          <div class="entry-s">Stundenplan, Kalender, Noten, Klassen</div>
          <span class="entry-go">${ico('pfeil')}</span>
        </a>
        <a class="entry entry-kids" href="#/unterricht">
          <div class="entry-glyphs">${SPIELE.slice(0, 8).map(a => `<span>${ico(a.ic, null, 24)}</span>`).join('')}</div>
          <div class="entry-t">Unterricht & Spiele</div>
          <div class="entry-s">Timer, Arbeitsauftrag, Gruppen, Quiz, Wortspiele</div>
          <span class="entry-go">${ico('pfeil')}</span>
        </a>
      </section>
      ${favoritProgramme().length ? `<h2 class="sect home-favs-h"><span>★</span> Favoriten</h2><section class="home-favs">${favoritProgramme().map(a => `<a href="${a.href}" class="home-fav" style="--f:${a.farbe || a.color || '#007aff'}"><span class="home-fav-ic">${ico(a.ic, null, 24)}</span><b>${a.title}</b></a>`).join('')}</section>` : ''}
      <section class="gadgets two">
        <article class="card gadget g-fw" id="gFw"></article>
        <article class="card gadget g-fa" id="gFa"></article>
      </section>
      <h2 class="sect">Heute</h2>
      <section class="gadgets heute">
        <article class="card gadget g-un" id="gUn"></article>
        <article class="card gadget g-te" id="gTe"></article>
      </section>`;

    const $ = id => el.querySelector('#' + id);
    const next = k => `<button class="gnext" data-next="${k}" title="Nächstes">↻</button>`;

    const tick = () => {
      const d = new Date(), h = d.getHours();
      $('hGreet').textContent = h < 11 ? 'Guten Morgen' : h < 17 ? 'Guten Tag' : 'Guten Abend';
      $('hClock').textContent = d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
      $('hDate').textContent = d.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · KW ' + kw(d) + schulwoche(d);
    };
    tick();
    this._iv = setInterval(tick, 1000);
    const termine = () => {
      const T = naechsteTermine(21, 6);
      $('gTe').innerHTML = `<div class="g-head"><span>Demnächst</span><a class="gnext" href="#/kalender" title="Kalender öffnen">›</a></div>
        ${T.length ? `<ul class="kal-next">${T.map(t => `<li style="--k:${TKATS[t.kat]?.farbe}"><b>${esc(t.titel)}</b><span class="muted small">${terminZeit(t)} · ${wannText(t.d)}</span></li>`).join('')}</ul>`
          : '<p class="muted small">In den nächsten drei Wochen keine Termine.</p><a class="btn small" href="#/kalender">Termin eintragen</a>'}`;
    };
    termine();
    const extern = () => { untisHeute($('gUn')); termine(); };
    extern(); this._iv2 = setInterval(extern, 10 * 60000);

    const drawCd = () => {
      const c = state.countdown, t = new Date(c.datum + 'T00:00');
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const days = Math.round((t - now) / 864e5);
      $('hCd').innerHTML = `<div class="cd-label">Noch bis <b>${esc(c.name)}</b> <button class="gnext" id="cdEdit" title="Ändern">✎</button></div>
        <div class="cd-num">${days >= 0 ? days : '–'}</div><div class="cd-unit">${days === 1 ? 'Tag' : 'Tage'}${days >= 0 && days < 100 ? ` · ${Math.max(0, Math.floor(days / 7))} Wochen` : ''}</div>
        <div class="cd-date muted small">${fmtDate(c.datum)}</div>`;
    };
    drawCd();

    const drawGadgets = () => {
      $('gFw').classList.remove('shown');
      const fw = pick(FREMDWOERTER, 'fw');
      $('gFw').innerHTML = `<div class="g-head"><span>Fremdwort des Tages</span><span>
          <button class="gnext" id="fwBig" title="Groß anzeigen (für die Tafel)">⛶</button>${next('fw')}</span></div>
        <div class="g-word">${esc(fw.w)}</div>
        <div class="g-art">${esc(fw.art)} · Herkunft: ${esc(fw.h)}</div>
        <div class="fw-hide"><p class="g-mean">${esc(fw.b)}</p><p class="g-ex">„${esc(fw.s)}“</p></div>
        <button class="btn fw-show" id="fwShow">Bedeutung zeigen</button>`;
      $('gFa').innerHTML = `<div class="g-head"><span>Wusstest du?</span>${next('fa')}</div><p class="g-fact">${esc(pick(FAKTEN, 'fa'))}</p>`;
    };
    drawGadgets();

    const fwGross = () => {
      const fw = pick(FREMDWOERTER, 'fw');
      const pop = document.createElement('div');
      pop.className = 'result-pop';
      pop.innerHTML = `<div class="rp-card fw-big">
        <div class="muted">Fremdwort des Tages</div>
        <div class="rp-name">${esc(fw.w)}</div>
        <div class="fw-reveal">
          <div class="g-art">${esc(fw.art)} · Herkunft: ${esc(fw.h)}</div>
          <p class="fw-mean">${esc(fw.b)}</p><p class="g-ex">„${esc(fw.s)}“</p>
        </div>
        <button class="btn" data-reveal>Bedeutung zeigen</button>
        <div class="muted small">Daneben klicken zum Schließen</div></div>`;
      pop.addEventListener('click', e => {
        if (e.target.closest('[data-reveal]')) { pop.querySelector('.fw-big').classList.add('shown'); e.target.closest('[data-reveal]').remove(); return; }
        if (!e.target.closest('.rp-card')) pop.remove();
      });
      document.body.appendChild(pop);
    };

    el.addEventListener('click', e => {
      if (e.target.id === 'cdEdit') {
        const n = prompt('Worauf wird gewartet?', state.countdown.name); if (n === null) return;
        const d = prompt('Datum (TT.MM.JJJJ)', fmtDate(state.countdown.datum)); if (d === null) return;
        const m = d.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (!m) return toast('Datum bitte als TT.MM.JJJJ eingeben');
        state.countdown = { name: n.trim() || 'Ferien', datum: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` };
        save(); drawCd();
      }
      if (e.target.id === 'fwShow') { $('gFw').classList.add('shown'); e.target.remove(); }
      if (e.target.id === 'fwBig') fwGross();
      const nx = e.target.closest('[data-next]');
      if (nx) { off[nx.dataset.next]++; drawGadgets(); }
    });
  },
  destroy() { clearInterval(this._iv); clearInterval(this._iv2); },
});

function kw(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
}

/** „· 5. Schulwoche“ – gezählt ab dem ersten Schultag (Einstellungen) */
function schulwoche(d) {
  const start = new Date(schulbeginn() + 'T00:00');
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Montag dieser Woche
  const heute = new Date(d); heute.setHours(0, 0, 0, 0);
  const w = Math.floor(Math.round((heute - start) / 864e5) / 7) + 1;
  return w >= 1 && w <= 45 ? ` · ${w}. Schulwoche` : '';
}
