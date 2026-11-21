'use strict';
/* ===== Stundenplan aus WebUntis (iCal-Link) – inkl. Supplierungen & Entfall ===== */

const Untis = (() => {
  let cache = null; // { zeit, evs }
  const ICS_KEY = 'schulstart_ical_cache';

  const unesc = v => v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
  const datum = (v, p) => {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/); if (!m) return null;
    const [, y, mo, d, h = 0, mi = 0, s = 0, z] = m;
    return z ? new Date(Date.UTC(+y, mo - 1, +d, +h, +mi, +s)) : new Date(+y, mo - 1, +d, +h, +mi, +s); // TZID Europe/Vienna = Ortszeit
  };
  function parse(text) {
    const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/), evs = [];
    let ev = null;
    for (const l of lines) {
      if (l === 'BEGIN:VEVENT') ev = {};
      else if (l === 'END:VEVENT') { if (ev && ev.start) evs.push(ev); ev = null; }
      else if (ev) {
        const i = l.indexOf(':'); if (i < 0) continue;
        const [name, ...ps] = l.slice(0, i).split(';'), val = l.slice(i + 1);
        const p = Object.fromEntries(ps.map(x => x.split('=')));
        if (name === 'DTSTART') ev.start = datum(val, p);
        else if (name === 'DTEND') ev.end = datum(val, p);
        else if (name === 'SUMMARY') ev.titel = unesc(val);
        else if (name === 'LOCATION') ev.ort = unesc(val);
        else if (name === 'DESCRIPTION') ev.info = unesc(val);
        else if (name === 'STATUS') ev.status = val.toUpperCase();
      }
    }
    evs.forEach(e => { e.end ||= new Date(e.start.getTime() + 50 * 60000); e.art = art(e); });
    return evs.sort((a, b) => a.start - b.start);
  }
  /* Entfall / Supplierung erkennen – WebUntis schreibt das je nach Schule leicht unterschiedlich */
  function art(e) {
    const t = `${e.titel || ''} ${e.info || ''} ${e.status || ''}`.toLowerCase();
    if (e.status === 'CANCELLED' || /entf[äa]ll|entfällt|abgesagt|cancel|storniert|freigesetzt/.test(t)) return 'entfall';
    if (/vertret|supplier|substitut|raum[äa]nderung|verlegt|ge[äa]ndert|statt |zusatz|sondereinsatz|verschoben/.test(t)) return 'aenderung';
    return 'normal';
  }

  async function laden(neu = false) {
    const url = state.einstellungen.icalUrl;
    if (!SERVER || !url) return null;
    if (cache && !neu && Date.now() - cache.zeit < 10 * 60000) return cache.evs;
    try {
      const r = await fetch('/api/ical?url=' + encodeURIComponent(url) + (neu ? '&neu=1' : ''));
      const text = await r.text();
      if (!r.ok) throw new Error(text || 'Fehler ' + r.status);
      try { localStorage.setItem(ICS_KEY, text); } catch (e) { /* zu groß – egal */ }
      cache = { zeit: Date.now(), evs: parse(text) };
    } catch (e) {
      const alt = localStorage.getItem(ICS_KEY); // offline: letzten Stand zeigen
      if (!alt) throw e;
      cache = { zeit: Date.now() - 9 * 60000, evs: parse(alt), offline: e.message };
    }
    return cache.evs;
  }
  const tag = (evs, d) => evs.filter(e => e.start.toDateString() === d.toDateString());
  const zeit = d => d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  return { laden, parse, tag, zeit, get offline() { return cache?.offline; } };
})();

const ART_TXT = { entfall: '❌ Entfall', aenderung: '🔄 Änderung' };

/** Karte „Heute“ für die Startseite */
async function untisHeute(el) {
  if (!SERVER) { el.innerHTML = `<div class="g-head"><span>Stundenplan</span></div><p class="muted small">Den Stundenplan gibt es, wenn du die Seite über <b>„Schulzentrale starten“</b> öffnest.</p>`; return; }
  if (!state.einstellungen.icalUrl) { el.innerHTML = `<div class="g-head"><span>Stundenplan</span></div><p class="muted">WebUntis ist noch nicht verbunden.</p><a class="btn" href="#/einstellungen">Jetzt verbinden</a>`; return; }
  el.innerHTML = `<div class="g-head"><span>📅 Heute</span></div><p class="muted small">Lade Stundenplan …</p>`;
  try {
    const evs = await Untis.laden(), now = new Date();
    let d = new Date(), stunden = Untis.tag(evs, d).filter(e => e.end > now), titel = 'Heute';
    if (!stunden.length) { // nächsten Schultag suchen
      const n = evs.find(e => e.start > now && e.start.toDateString() !== now.toDateString());
      if (n) { d = n.start; stunden = Untis.tag(evs, d); titel = d.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'numeric' }); }
    }
    const aend = Untis.tag(evs, d).filter(e => e.art !== 'normal').length;
    el.innerHTML = `<div class="g-head"><span>${titel}${aend ? ` <b class="uh-warn">${aend} Änderung${aend > 1 ? 'en' : ''}</b>` : ''}</span><a class="gnext" href="#/stundenplan" title="Ganzer Stundenplan">→</a></div>
      ${stunden.length ? `<ul class="uh">${stunden.map(e => { const jetzt = e.start <= now && e.end > now;
        return `<li class="${e.art} ${jetzt ? 'jetzt' : ''}"><span class="uh-t">${Untis.zeit(e.start)}</span><b>${esc(e.titel || '')}</b><span class="muted">${esc(e.ort || '')}</span>${e.art !== 'normal' ? `<span class="uh-art">${ART_TXT[e.art]}</span>` : ''}${jetzt ? '<span class="uh-now">jetzt</span>' : ''}</li>`; }).join('')}</ul>`
        : '<p class="muted">Keine Stunden gefunden.</p>'}
      ${Untis.offline ? `<p class="muted small">⚠️ Offline – letzter Stand</p>` : ''}`;
  } catch (e) {
    el.innerHTML = `<div class="g-head"><span>Stundenplan</span></div><p class="muted small">⚠️ ${esc(e.message)}</p><a class="btn small" href="#/einstellungen">Einstellungen</a>`;
  }
}

registerModule({
  id: 'stundenplan', title: 'Stundenplan', icon: '📅',
  render(el) {
    let montag = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('kalender', '#ff3b30', 'Stundenplan', '<span class="muted small">aus WebUntis</span>')}
        <div class="row"><a class="btn" href="#/wochen">📝 Wochennotizen</a><button class="btn" data-w="-7">←</button><button class="btn" data-w="0">Heute</button><button class="btn" data-w="7">→</button><button class="btn" id="spNeu">↻ Aktualisieren</button></div></div>
      <div id="spBody"><p class="muted">Lade …</p></div></div>`;
    const body = el.querySelector('#spBody');
    const draw = async (neu) => {
      if (!SERVER || !state.einstellungen.icalUrl) { body.innerHTML = `<div class="card"><p>WebUntis ist noch nicht verbunden.</p><a class="btn primary" href="#/einstellungen">Zu den Einstellungen</a></div>`; return; }
      let evs;
      try { evs = await Untis.laden(neu); } catch (e) { body.innerHTML = `<div class="card">⚠️ ${esc(e.message)}</div>`; return; }
      const tage = [...Array(6)].map((_, i) => { const d = new Date(montag); d.setDate(d.getDate() + i); return d; }).filter((d, i) => i < 5 || Untis.tag(evs, d).length);
      const heute = new Date().toDateString(), now = new Date();
      const ende = new Date(montag); ende.setDate(ende.getDate() + 7);
      const woche = evs.filter(e => e.start >= montag && e.start < ende);
      const aend = woche.filter(e => e.art !== 'normal');
      body.innerHTML = `
        ${aend.length ? `<div class="card sp-aend"><h3>⚠️ Änderungen in dieser Woche (${aend.length})</h3><ul>${aend.map(e => `<li class="${e.art}"><b>${e.start.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'numeric' })} ${Untis.zeit(e.start)}</b> ${esc(e.titel || '')} ${e.ort ? '· ' + esc(e.ort) : ''} <span class="uh-art">${ART_TXT[e.art]}</span>${e.info ? `<div class="muted small">${esc(e.info)}</div>` : ''}</li>`).join('')}</ul></div>` : ''}
        <div class="sp-woche" style="grid-template-columns:repeat(${tage.length},1fr)">${tage.map(d => `<div class="sp-tag ${d.toDateString() === heute ? 'heute' : ''}">
          <div class="sp-th">${d.toLocaleDateString('de-AT', { weekday: 'long' })}<span>${d.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' })}</span></div>
          ${Untis.tag(evs, d).map(e => `<div class="sp-st ${e.art} ${e.start <= now && e.end > now ? 'jetzt' : ''}" title="${esc(e.info || '')}">
            <span class="sp-z">${Untis.zeit(e.start)}–${Untis.zeit(e.end)}</span><b>${esc(e.titel || '')}</b>${e.ort ? `<span>${esc(e.ort)}</span>` : ''}
            ${e.art !== 'normal' ? `<span class="uh-art">${ART_TXT[e.art]}</span>` : ''}${e.info ? `<span class="sp-info">${esc(e.info)}</span>` : ''}</div>`).join('') || '<p class="muted small center">frei</p>'}
        </div>`).join('')}</div>
        <p class="muted small">Stand: ${new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}${Untis.offline ? ' · ⚠️ offline, letzter gespeicherter Stand' : ''} · wird alle 10 Minuten neu geladen.</p>`;
    };
    el.addEventListener('click', e => {
      const w = e.target.closest('[data-w]');
      if (w) { if (+w.dataset.w === 0) { montag = new Date(); montag.setHours(0, 0, 0, 0); montag.setDate(montag.getDate() - ((montag.getDay() + 6) % 7)); } else { montag = new Date(montag); montag.setDate(montag.getDate() + +w.dataset.w); } draw(); }
      if (e.target.id === 'spNeu') draw(true);
    });
    this._iv = setInterval(draw, 10 * 60000);
    draw();
  },
  destroy() { clearInterval(this._iv); },
});
