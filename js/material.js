'use strict';
/* ===== Materialkatalog: Unterrichtsmaterial aus dem Schulordner (<Fach>/<Thema>/<Material>) finden, ansehen, öffnen ===== */

const MAT_FARBE = { 'Arbeitsblatt': '#1D5C7C', 'Test': '#9A3B3B', 'Materialpaket': '#5E8C61', 'Rätsel & Spiele': '#B9812B', 'Merktext': '#6B5B95',
  'Booklet': '#2F8A8A', 'Präsentation': '#8A6B52', 'Arbeitsauftrag': '#6C7F8E', 'Info & Text': '#4F6D7A', 'Sammlung': '#98A26E', 'Sonstiges': '#A9B3B8' };
const MAT_TYPEN = Object.keys(MAT_FARBE);
const MAT_KACHEL = ['#DCE9EF', '#E1EBD9', '#F1E7CC', '#E7E3DB'];
const matFarbe = t => MAT_FARBE[t] || '#A9B3B8';
const matDatum = s => s ? s.split('-').reverse().join('.') : '';
const matPlural = (n, e, m) => `${n} ${n === 1 ? e : m}`;

/* Höhenlinien als Wiedererkennungszeichen jeder Themenkachel */
function matHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function matKontur(name) {
  let seed = matHash(name);
  const r = () => { seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0; seed ^= seed >>> 13; return (seed >>> 0) / 4294967296; };
  const cx = 140 + r() * 120, cy = 26 + r() * 34, p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28;
  let out = '';
  for (let i = 0; i < 8; i++) {
    const rx = 12 + i * 19, ry = 7 + i * 10, n = 28, pts = [];
    for (let k = 0; k < n; k++) { const a = k / n * 6.2832, w = 1 + .16 * Math.sin(3 * a + p1 + i * .4) + .09 * Math.sin(5 * a + p2) + .05 * Math.sin(2 * a + p3); pts.push([cx + rx * w * Math.cos(a), cy + ry * w * Math.sin(a)]); }
    let d = '';
    for (let k = 0; k < n; k++) {
      const A = pts[k], B = pts[(k + 1) % n], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      if (!k) { const L = pts[n - 1]; d += `M${((L[0] + A[0]) / 2).toFixed(1)} ${((L[1] + A[1]) / 2).toFixed(1)}`; }
      d += `Q${A[0].toFixed(1)} ${A[1].toFixed(1)} ${M[0].toFixed(1)} ${M[1].toFixed(1)}`;
    }
    out += `<path d="${d}Z" fill="none" stroke="#1D5C7C" stroke-opacity="${i % 4 === 3 ? .5 : .26}" stroke-width="${i % 4 === 3 ? 1.5 : .8}"/>`;
  }
  return `<svg viewBox="0 0 300 84" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="background:${MAT_KACHEL[matHash(name) % MAT_KACHEL.length]}">${out}</svg>`;
}

registerModule({
  id: 'material', title: 'Materialkatalog', icon: '📚',
  render(el) {
    const mod = this;
    const S = mod._s ||= { fach: null, thema: null, typen: [], alt: false, q: '', ansicht: 'uebersicht' };
    let D = mod._d || null;
    el.innerHTML = `<div class="page mat-seite">
      <div class="pagehead">${seitenTitel('regal', '#1D5C7C', 'Materialkatalog')}
        <div class="row mat-leiste">
          <div class="seg mat-ansicht"><button data-ansicht="uebersicht">Übersicht</button><button data-ansicht="katalog">Katalog</button></div>
          <input type="search" id="matSuche" placeholder="Material oder Datei suchen …" autocomplete="off" value="${esc(S.q)}">
          <button class="btn" id="matNeu" title="Ordner neu einlesen">↻ Aktualisieren</button></div></div>
      <div class="mat-layout"><aside class="card mat-rail" id="matRail"></aside><div id="matInhalt"><div class="placeholder" style="height:30vh">Material wird eingelesen …</div></div></div>
      <p class="muted small" id="matStand"></p>
      <aside class="mat-vorschau card" id="matV" hidden><header><b id="matVTitel"></b>
        <div class="row"><button class="btn" data-v="oeffnen">Öffnen</button><button class="btn" data-v="zeigen">Im Finder zeigen</button><button class="btn" data-v="zu">✕</button></div></header>
        <div class="mat-v-inhalt" id="matVInhalt"></div><small class="muted" id="matVHinweis"></small></aside></div>`;
    const $ = id => el.querySelector('#' + id);

    const matsOf = f => f ? f.themen.flatMap(t => t.materialien.map(m => ({ ...m, thema: t.name }))) : [];
    const fach = () => D.faecher.find(f => f.name === S.fach);
    const dateienZahl = ms => ms.reduce((a, m) => a + m.dateien.length, 0);
    const altZahl = ms => ms.reduce((a, m) => a + m.dateien.filter(d => d.alt).length, 0);
    const passt = m => !S.q || S.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => `${m.voll} ${m.thema} ${m.typ} ${m.klasse} ${m.dateien.map(d => d.n).join(' ')}`.toLowerCase().includes(w));
    // Die Suche läuft über alle Fächer, sonst nur im gewählten Fach
    const basis = () => (S.q ? D.faecher.flatMap(f => matsOf(f).map(m => ({ ...m, fach: f.name }))) : matsOf(fach()))
      .filter(m => (!S.thema || S.q || m.thema === S.thema) && (!S.alt || m.dateien.some(d => d.alt)) && passt(m));
    const treffer = () => basis().filter(m => !S.typen.length || S.typen.includes(m.typ));
    const typenZahl = ms => { const c = {}; ms.forEach(m => c[m.typ] = (c[m.typ] || 0) + 1); return Object.entries(c).sort((a, b) => b[1] - a[1] || MAT_TYPEN.indexOf(a[0]) - MAT_TYPEN.indexOf(b[0])); };

    const rail = () => {
      const f = fach();
      $('matRail').innerHTML = `<h3>Fächer</h3>${D.faecher.map(x => { const n = matsOf(x).length; return `<button class="mat-ein ${x.name === S.fach ? 'on' : ''} ${n ? '' : 'leer'}" data-fach="${esc(x.name)}"><span>${esc(x.name)}</span><small>${n || 'leer'}</small></button>`; }).join('')}
        ${f && f.themen.length ? `<h3>Themen in ${esc(f.name)}</h3><button class="mat-ein ${!S.thema ? 'on' : ''}" data-thema=""><span>Alle Themen</span><small>${matsOf(f).length}</small></button>
          ${f.themen.map(t => `<button class="mat-ein ${S.thema === t.name ? 'on' : ''}" data-thema="${esc(t.name)}"><span>${esc(t.name)}</span><small>${t.materialien.length}</small></button>`).join('')}` : ''}`;
    };
    const leer = f => `<div class="card mat-leer"><b>In ${esc(f.name)} liegt noch kein Material</b><p class="muted">Dateien unter <code>${esc(f.name)}/Thema/Material</code> im Materialordner ablegen und dann „Aktualisieren“ drücken.</p></div>`;

    const uebersicht = () => {
      const f = fach(), ms = matsOf(f);
      if (!ms.length) return `<h2 class="mat-h">${esc(f.name)}</h2>${leer(f)}`;
      const alt = altZahl(ms), neu = ms.slice().sort((a, b) => b.geaendert.localeCompare(a.geaendert)).slice(0, 6);
      return `<h2 class="mat-h">${esc(f.name)}</h2><p class="muted">${matPlural(f.themen.length, 'Thema', 'Themen')}, ${matPlural(ms.length, 'Material', 'Materialien')} und ${matPlural(dateienZahl(ms), 'Datei', 'Dateien')}.</p>
        <div class="mat-kacheln">${f.themen.map(t => { const ty = typenZahl(t.materialien), g = t.materialien.length; return `<button class="mat-kachel" data-kachel="${esc(t.name)}">${matKontur(t.name)}
          <span class="mat-k-txt"><b>${esc(t.name)}</b><small>${matPlural(g, 'Material', 'Materialien')}, ${matPlural(dateienZahl(t.materialien), 'Datei', 'Dateien')}</small>
          <span class="mat-balken">${ty.map(([x, n]) => `<i style="width:${n / g * 100}%;background:${matFarbe(x)}" title="${esc(x)} ${n}"></i>`).join('')}</span>
          <small>${esc(ty.slice(0, 3).map(([x, n]) => `${x} ${n}`).join(', '))}${ty.length > 3 ? ' und weitere' : ''}</small></span></button>`; }).join('')}</div>
        ${alt ? `<div class="mat-hinweis"><span>${matPlural(alt, 'Datei liegt', 'Dateien liegen')} noch als .doc, .ppt oder .xls vor – ein guter Ausgangspunkt zum Aussortieren.</span><button class="btn" data-altzeigen>Diese Materialien anzeigen</button></div>` : ''}
        <h3 class="mat-h3">Zuletzt geändert</h3><div class="card mat-zuletzt">${neu.map(m => `<div><span><b>${esc(m.name)}</b><small class="muted">${esc(m.thema)} · ${esc(m.typ)}</small></span><span class="muted small">${matDatum(m.geaendert)}</span></div>`).join('')}</div>`;
    };

    const fmt = d => `<span class="mat-fmt">${esc(d.e)}</span>${d.rolle === 'loesung' ? '<span class="mat-fmt loes">Lösung</span>' : ''}${d.rolle === 'beilage' ? '<span class="mat-fmt bei">Begleitdatei</span>' : ''}${d.alt ? '<span class="mat-fmt alt">altes Format</span>' : ''}`;
    const vKnopf = d => `<button class="mat-vbtn" data-vp="${esc(d.p)}" data-vn="${esc(d.n)}" data-ve="${esc(d.e)}" title="Vorschau">👁</button>`;
    const dateiZeile = d => `<li class="${d.rolle === 'beilage' ? 'bei' : ''}"><a href="#" data-oeffnen="${esc(d.p)}">${esc(d.n)}</a>${fmt(d)}${vKnopf(d)}</li>`;
    const matZeile = m => {
      const eins = m.dateien.length === 1, d0 = m.dateien[0];
      const ord = !eins && m.ordner ? d0.p.slice(0, d0.p.length - d0.n.length).replace(/\/$/, '') : '';
      const liste = `<ul class="mat-dateien">${m.dateien.map(dateiZeile).join('')}</ul>`;
      return `<li class="mat-zeile"><div class="mat-z1"><span class="mat-titel">${eins ? `<a href="#" data-oeffnen="${esc(d0.p)}">${esc(m.name)}</a>${vKnopf(d0)}` : esc(m.name)}</span>
        <span class="mat-typ"><i style="background:${matFarbe(m.typ)}"></i>${esc(m.typ)}</span>${m.klasse ? `<span class="mat-klasse">${esc(m.klasse)}</span>` : ''}
        ${m.fach ? `<span class="muted small">${esc(m.fach)} › ${esc(m.thema)}</span>` : ''}${eins ? fmt(d0) : ''}
        ${ord ? `<button class="mat-vbtn" data-ordner="${esc(ord)}" title="Ordner im Finder zeigen">📁</button>` : ''}<span class="muted small mat-dat">${matDatum(m.geaendert)}</span></div>
        ${eins ? '' : m.dateien.length <= 3 ? liste : `<details class="mat-mehr"><summary>${m.dateien.length} Dateien anzeigen</summary>${liste}</details>`}</li>`;
    };
    const katalog = () => {
      const f = fach();
      if (!S.q && !matsOf(f).length) return `<h2 class="mat-h">${esc(f.name)}</h2>${leer(f)}`;
      const b = basis(), res = treffer(), cnt = {};
      b.forEach(m => cnt[m.typ] = (cnt[m.typ] || 0) + 1);
      const gruppen = new Map(); res.forEach(m => { const k = S.q ? `${m.fach} › ${m.thema}` : m.thema; gruppen.has(k) || gruppen.set(k, []); gruppen.get(k).push(m); });
      return `<h2 class="mat-h">${S.q ? 'Suche in allen Fächern' : esc(S.thema || f.name)}</h2>${S.thema && !S.q ? `<p class="muted">in ${esc(f.name)}</p>` : ''}
        <div class="mat-filter">${MAT_TYPEN.filter(t => cnt[t]).map(t => `<button class="mat-chip ${S.typen.includes(t) ? 'on' : ''}" data-typ="${esc(t)}"><i style="background:${matFarbe(t)}"></i>${esc(t)} <small>${cnt[t]}</small></button>`).join('')}
          <button class="mat-chip ${S.alt ? 'on' : ''}" data-alt>Nur altes Format</button>
          ${S.typen.length || S.alt || S.q || S.thema ? '<button class="btn" data-zurueck>Filter zurücksetzen</button>' : ''}</div>
        <p class="muted small">${matPlural(res.length, 'Material', 'Materialien')}${S.q ? ` zu „${esc(S.q)}“` : ''}</p>
        ${res.length ? [...gruppen].map(([t, ms]) => `<section class="mat-abschnitt">${S.thema && !S.q ? '' : `<h3 class="mat-h3">${esc(t)} <small>${ms.length}</small></h3>`}<ul class="mat-liste card">${ms.map(matZeile).join('')}</ul></section>`).join('')
          : '<div class="card mat-leer"><b>Nichts gefunden</b><p class="muted">Kürzeren Suchbegriff probieren oder einen Filter herausnehmen.</p></div>'}`;
    };

    const zeichne = (oben = false) => {
      if (!D) return;
      el.querySelectorAll('[data-ansicht]').forEach(b => b.classList.toggle('on', b.dataset.ansicht === S.ansicht));
      rail();
      $('matInhalt').innerHTML = S.ansicht === 'uebersicht' && !S.q ? uebersicht() : katalog();
      if (oben) window.scrollTo(0, 0);
    };
    const ohneOrdner = () => {
      $('matRail').hidden = true;
      $('matInhalt').innerHTML = `<div class="card mat-leer"><b>Materialordner nicht gefunden</b>
        <p class="muted">Gesucht in <code>${esc(D?.ordner || '')}</code>. Wähle den Ordner, in dem pro Fach ein Unterordner liegt (z.B. <code>GW/Thema/Material</code>).</p>
        <button class="btn primary" id="matOrdner">Ordner wählen …</button></div>`;
    };
    const laden = async () => {
      if (!SERVER) { $('matInhalt').innerHTML = '<div class="card mat-leer">Der Materialkatalog braucht den Hilfsdienst (Schulzentrale über „Schulzentrale starten“ öffnen).</div>'; return; }
      try {
        D = mod._d = await fetch('/api/material').then(r => r.json());
        if (D.fehlt) return ohneOrdner();
        $('matRail').hidden = false;
        if (!D.faecher.some(f => f.name === S.fach)) {
          // passend zum gerade gewählten Fach in der Schulzentrale starten, sonst das erste Fach mit Material
          const kursFach = (aktFach()?.name || '').toLowerCase();
          S.fach = (D.faecher.find(f => f.name.toLowerCase() === kursFach && matsOf(f).length) || D.faecher.find(f => matsOf(f).length) || D.faecher[0])?.name || null;
        }
        if (!S.fach) { $('matInhalt').innerHTML = '<div class="card mat-leer"><b>Noch keine Fächer</b><p class="muted">Im Materialordner einen Ordner pro Fach anlegen, zum Beispiel GW.</p></div>'; return; }
        const [tag, zeit] = D.erzeugt.split(' ');
        $('matStand').innerHTML = `Eingelesen am ${matDatum(tag)} um ${zeit} Uhr aus <code>${esc(D.ordner)}</code> · <a href="#" id="matOrdner">anderen Ordner wählen</a>`;
        zeichne();
      } catch (e) { $('matInhalt').innerHTML = `<div class="card mat-leer">⚠️ Konnte das Material nicht einlesen (${esc(e.message)}).</div>`; }
    };
    const senden = (daten) => fetch('/api/material', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) })
      .then(r => r.json().then(j => { if (!r.ok) throw new Error(j.fehler || 'Fehler'); return j; }));
    const oeffnen = (p, name, zeigen) => senden({ aktion: zeigen ? 'zeigen' : 'oeffnen', p }).then(() => toast(zeigen ? '📁 Im Finder gezeigt' : `Geöffnet: ${name}`)).catch(e => toast('⚠️ ' + e.message));

    /* ----- Vorschau rechts ----- */
    const V = mod._v = {};
    const vUrl = modus => `/api/material?p=${encodeURIComponent(V.p)}&modus=${modus}`;
    const vorschau = (p, n, e) => {
      Object.assign(V, { p, n, e: (e || '').toLowerCase() });
      $('matVTitel').textContent = n; const inh = $('matVInhalt'), hin = $('matVHinweis'); hin.textContent = '';
      if (V.e === 'pdf') { inh.innerHTML = `<iframe src="${vUrl('pdf')}" title="Vorschau"></iframe>`; hin.textContent = 'Alle Seiten – zum Blättern im Fenster scrollen.'; }
      else if (/^(mov|mp4|m4v)$/.test(V.e)) inh.innerHTML = '<div class="mat-v-leer">Für Videos gibt es keine Vorschau. „Öffnen“ startet das Video.</div>';
      else {
        inh.innerHTML = '<div class="mat-v-leer">Vorschau wird erstellt …</div>';
        const im = new Image(), meins = p; im.alt = n;
        im.onload = () => { if (V.p !== meins) return; inh.innerHTML = ''; inh.appendChild(im); if (/^(docx?|pptx?|xlsx?|od[tsp])$/.test(V.e)) hin.textContent = 'Gezeigt wird nur die erste Seite.'; };
        im.onerror = () => { if (V.p === meins) inh.innerHTML = '<div class="mat-v-leer">Für diese Datei ist keine Vorschau möglich. „Öffnen“ zeigt sie im Programm.</div>'; };
        im.src = vUrl('bild');
      }
      $('matV').hidden = false; el.querySelector('.mat-seite').classList.add('v-offen');
    };
    const vorschauZu = () => { $('matV').hidden = true; $('matVInhalt').innerHTML = ''; V.p = null; el.querySelector('.mat-seite').classList.remove('v-offen'); };
    mod._esc = e => { if (e.key === 'Escape' && !$('matV')?.hidden) vorschauZu(); };
    document.addEventListener('keydown', mod._esc);

    el.onclick = async e => {
      const t = e.target, q = s => t.closest(s);
      if (q('#matOrdner')) { e.preventDefault(); const r = await senden({ aktion: 'ordner' }).catch(err => ({ fehler: err.message })); if (!r.abgebrochen && !r.fehler) { S.fach = null; laden(); } return; }
      if (q('#matNeu')) { toast('Material wird neu eingelesen …'); return laden(); }
      if (q('[data-oeffnen]')) { e.preventDefault(); const a = q('[data-oeffnen]'); return oeffnen(a.dataset.oeffnen, a.textContent, false); }
      if (q('[data-vp]')) { const b = q('[data-vp]'); return vorschau(b.dataset.vp, b.dataset.vn, b.dataset.ve); }
      if (q('[data-ordner]')) return oeffnen(q('[data-ordner]').dataset.ordner, 'Ordner', false);
      if (q('[data-v]')) { const v = q('[data-v]').dataset.v; if (v === 'zu') vorschauZu(); else if (V.p) oeffnen(V.p, V.n, v === 'zeigen'); return; }
      if (q('[data-ansicht]')) { S.ansicht = q('[data-ansicht]').dataset.ansicht; if (S.ansicht === 'uebersicht') { S.thema = null; S.q = ''; $('matSuche').value = ''; } return zeichne(true); }
      if (q('[data-fach]')) { Object.assign(S, { fach: q('[data-fach]').dataset.fach, thema: null, typen: [], alt: false, q: '', ansicht: 'uebersicht' }); $('matSuche').value = ''; return zeichne(true); }
      if (q('[data-thema]')) { S.thema = q('[data-thema]').dataset.thema || null; S.q = ''; $('matSuche').value = ''; if (S.thema) S.ansicht = 'katalog'; return zeichne(true); }
      if (q('[data-kachel]')) { S.thema = q('[data-kachel]').dataset.kachel; S.ansicht = 'katalog'; return zeichne(true); }
      if (q('[data-typ]')) { const w = q('[data-typ]').dataset.typ; S.typen = S.typen.includes(w) ? S.typen.filter(x => x !== w) : [...S.typen, w]; return zeichne(); }
      if (q('[data-alt]')) { S.alt = !S.alt; return zeichne(); }
      if (q('[data-altzeigen]')) { Object.assign(S, { alt: true, ansicht: 'katalog', thema: null }); return zeichne(true); }
      if (q('[data-zurueck]')) { Object.assign(S, { typen: [], alt: false, q: '', thema: null }); $('matSuche').value = ''; return zeichne(); }
    };
    $('matSuche').oninput = e => { S.q = e.target.value.trim(); if (S.q) S.ansicht = 'katalog'; zeichne(); };

    if (D && !D.fehlt) zeichne();
    laden();   // immer frisch einlesen – neue Dateien im Ordner erscheinen sofort
  },
  destroy() { if (this._esc) document.removeEventListener('keydown', this._esc); },
});
