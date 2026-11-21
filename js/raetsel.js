'use strict';
/* ===== Rätselblätter: Kreuzworträtsel-Generator und Bingo – aus eigenen Begriffen, zum Ausdrucken (Bingo-Ziehung am Beamer) ===== */

state.raetsel ||= {
  kw: { titel: 'Kreuzworträtsel: Österreich', text: 'Wien: Hauptstadt von Österreich\nDonau: Längster Fluss Österreichs\nGroßglockner: Höchster Berg Österreichs\nBodensee: See an der Grenze zu Deutschland und der Schweiz\nSalzburg: Geburtsstadt von Mozart\nTirol: Bundesland mit Innsbruck\nAlpen: Gebirge im Westen und Süden\nEuro: Unsere Währung\nNeun: Anzahl der Bundesländer\nGraz: Hauptstadt der Steiermark' },
  bingo: { titel: 'Begriffe-Bingo', text: '', n: 4, anzahl: 28, frei: true },
  gezogen: [],
};
const RZ = state.raetsel;
const rEintraege = text => text.split('\n').map(z => z.trim()).filter(Boolean).map(z => { const i = z.indexOf(':'); return i > 0 ? { wort: z.slice(0, i).trim(), hinweis: z.slice(i + 1).trim() } : { wort: z, hinweis: '' }; });
const kwNorm = w => w.toUpperCase().replace(/ß/g, 'SS').replace(/[^A-ZÄÖÜ]/g, '');

/** Kreuzworträtsel anordnen: viele Versuche, das beste Ergebnis (meiste Wörter, kompakteste Fläche) gewinnt */
function kreuzwort(eintraege) {
  const W = eintraege.map(e => ({ ...e, w: kwNorm(e.wort) })).filter(e => e.w.length >= 2);
  let best = null;
  for (let v = 0; v < 60; v++) {
    const ord = v === 0 ? [...W].sort((a, b) => b.w.length - a.w.length) : [...W].sort((a, b) => b.w.length - a.w.length + (Math.random() - 0.5) * 6);
    const zellen = new Map(), lage = [], nicht = [];
    const get = (r, c) => zellen.get(r + ',' + c);
    const pruefen = (w, r, c, dir) => {
      const dr = dir, dc = 1 - dir;
      if (get(r - dr, c - dc) || get(r + dr * w.length, c + dc * w.length)) return -1;
      let kreuz = 0;
      for (let i = 0; i < w.length; i++) {
        const rr = r + dr * i, cc = c + dc * i, z = get(rr, cc);
        if (z) { if (z.ch !== w[i] || z.dirs.includes(dir)) return -1; kreuz++; }
        else if (get(rr + dc, cc + dr) || get(rr - dc, cc - dr)) return -1;
      }
      return kreuz;
    };
    const setzen = (e, r, c, dir) => {
      for (let i = 0; i < e.w.length; i++) { const k = (r + dir * i) + ',' + (c + (1 - dir) * i), z = zellen.get(k); if (z) z.dirs.push(dir); else zellen.set(k, { ch: e.w[i], dirs: [dir] }); }
      lage.push({ ...e, r, c, dir });
    };
    ord.forEach((e, n) => {
      if (n === 0) return setzen(e, 0, 0, 0);
      let kand = null;
      zellen.forEach((z, k) => {
        if (z.dirs.length > 1) return;
        const [zr, zc] = k.split(',').map(Number), dir = 1 - z.dirs[0];
        for (let i = 0; i < e.w.length; i++) {
          if (e.w[i] !== z.ch) continue;
          const r = zr - dir * i, c = zc - (1 - dir) * i, kr = pruefen(e.w, r, c, dir);
          if (kr < 1) continue;
          const wert = kr * 10 - Math.abs(r) - Math.abs(c) + Math.random();
          if (!kand || wert > kand.wert) kand = { r, c, dir, wert };
        }
      });
      kand ? setzen(e, kand.r, kand.c, kand.dir) : nicht.push(e);
    });
    const rs = [...zellen.keys()].map(k => +k.split(',')[0]), cs = [...zellen.keys()].map(k => +k.split(',')[1]);
    const r0 = Math.min(...rs), c0 = Math.min(...cs), hoehe = Math.max(...rs) - r0 + 1, breite = Math.max(...cs) - c0 + 1;
    const wert = lage.length * 10000 - hoehe * breite - Math.abs(hoehe - breite) * 20;
    if (!best || wert > best.wert) best = { wert, lage: lage.map(x => ({ ...x, r: x.r - r0, c: x.c - c0 })), nicht, hoehe, breite };
  }
  if (!best) return null;
  // Nummern: zeilenweise von links oben
  const starts = [...new Set(best.lage.map(x => x.r * 1000 + x.c))].sort((a, b) => a - b);
  best.lage.forEach(x => { x.nr = starts.indexOf(x.r * 1000 + x.c) + 1; });
  best.gitter = Array.from({ length: best.hoehe }, () => Array(best.breite).fill(null));
  best.lage.forEach(x => { for (let i = 0; i < x.w.length; i++) best.gitter[x.r + x.dir * i][x.c + (1 - x.dir) * i] = x.w[i]; });
  return best;
}

/** Gitter als HTML (für Bildschirm und Druck) */
function kwGitter(kw, loesung, zelle) {
  const nummern = {}; kw.lage.forEach(x => { nummern[x.r + ',' + x.c] = x.nr; });
  return `<div class="kw-gitter" style="grid-template-columns:repeat(${kw.breite}, ${zelle});grid-auto-rows:${zelle}">${kw.gitter.flatMap((zeile, r) => zeile.map((ch, c) =>
    ch ? `<div class="kw-z">${nummern[r + ',' + c] ? `<sup>${nummern[r + ',' + c]}</sup>` : ''}${loesung ? ch : ''}</div>` : '<div class="kw-leer"></div>')).join('')}</div>`;
}
const kwHinweise = kw => ['Waagrecht', 'Senkrecht'].map((t, dir) => {
  const l = kw.lage.filter(x => x.dir === dir).sort((a, b) => a.nr - b.nr);
  return l.length ? `<div class="kw-hw"><h3>${t}</h3><ol>${l.map(x => `<li value="${x.nr}">${esc(x.hinweis || '(' + x.w.length + ' Buchstaben)')}</li>`).join('')}</ol></div>` : '';
}).join('');

registerModule({
  id: 'raetsel', title: 'Rätselblätter', icon: '🧩',
  render(el) {
    const mod = this;
    mod._tab ||= 'kw';
    el.innerHTML = `<div class="page rz">
      <div class="pagehead">${seitenTitel('raetsel', '#000', 'Rätselblätter')}
        <nav class="tabs" id="rzTabs"><button data-rztab="kw">Kreuzworträtsel</button><button data-rztab="bingo">Bingo-Karten</button><button data-rztab="ziehen">Bingo-Ziehung</button></nav></div>
      <div id="rzBody"></div></div>`;
    const body = el.querySelector('#rzBody');
    const draw = () => { el.querySelectorAll('#rzTabs button').forEach(b => b.classList.toggle('on', b.dataset.rztab === mod._tab)); ({ kw, bingo, ziehen })[mod._tab](); };

    /* ----- Kreuzworträtsel ----- */
    const kw = (neuOrdnen = false) => {
      const r = !neuOrdnen && mod._kw && mod._kwText === RZ.kw.text ? mod._kw : kreuzwort(rEintraege(RZ.kw.text));
      mod._kwText = RZ.kw.text;
      body.innerHTML = `<div class="side-layout">
        <aside class="card side">
          <label class="f">Titel<input data-rz="kw.titel" value="${esc(RZ.kw.titel)}"></label>
          <label class="f">Wörter – eines pro Zeile<textarea data-rz="kw.text" rows="14" placeholder="Donau: Längster Fluss Österreichs">${esc(RZ.kw.text)}</textarea></label>
          <p class="muted small"><code>Lösungswort: Hinweis</code> · ß wird zu SS, Leerzeichen fallen weg.</p>
          <button class="btn" id="kwNeu">🔀 Neu anordnen</button>
          <button class="btn primary" id="kwDruck">🖨 Arbeitsblatt + Lösung drucken</button>
        </aside>
        <section class="card rz-vorschau" id="kwVorschau">${r ? `
          <div class="row between"><h2>${esc(RZ.kw.titel)}</h2><label class="chk small"><input type="checkbox" id="kwLsg" ${mod._lsg ? 'checked' : ''}> Lösung zeigen</label></div>
          ${kwGitter(r, mod._lsg, 'minmax(18px, 34px)')}
          <div class="kw-hws">${kwHinweise(r)}</div>
          ${r.nicht.length ? `<p class="warnbox card small">Nicht untergebracht: <b>${r.nicht.map(x => esc(x.wort)).join(', ')}</b> – „Neu anordnen“ probieren oder ein Wort mit gemeinsamen Buchstaben ergänzen.</p>` : ''}`
          : '<div class="placeholder" style="height:40vh">👈 Mindestens zwei Wörter eingeben</div>'}</section></div>`;
      mod._kw = r;
    };
    const kwDruck = () => {
      const r = mod._kw; if (!r) return;
      const zelle = Math.min(9, Math.floor(178 / r.breite)) + 'mm';
      const css = `<style>.kw-gitter{display:grid;margin:6mm auto 8mm;width:max-content}.kw-z{border:.8pt solid #1d1d1f;margin:-.4pt;position:relative;display:grid;place-items:center;font:700 11pt -apple-system,Helvetica,Arial;}
        .kw-z sup{position:absolute;top:1pt;left:1.5pt;font-size:6pt;font-weight:600}.kw-hws{columns:2;column-gap:10mm}.kw-hw{break-inside:avoid}.kw-hw h3{margin-top:0}.kw-hw ol{margin:0;padding-left:16pt}.kw-hw li{margin:2pt 0}</style>`;
      druckFenster(RZ.kw.titel, css + `<section class="seite fit">${druckKopf(esc(RZ.kw.titel), 'Name: ____________________________', 'Kreuzworträtsel')}${kwGitter(r, false, zelle)}<div class="kw-hws">${kwHinweise(r)}</div></section>
        <section class="seite">${druckKopf(esc(RZ.kw.titel) + ' – Lösung', '', 'Lösungsblatt')}${kwGitter(r, true, zelle)}</section>`);
    };

    /* ----- Bingo-Karten ----- */
    const B = RZ.bingo;
    const bingoBegriffe = () => rEintraege(B.text || RZ.kw.text);
    const bingo = () => {
      const n = B.n, frei = B.frei && n % 2 === 1, noetig = n * n - (frei ? 1 : 0), l = bingoBegriffe();
      body.innerHTML = `<div class="side-layout">
        <aside class="card side">
          <label class="f">Titel<input data-rz="bingo.titel" value="${esc(B.titel)}"></label>
          <label class="f">Begriffe – einer pro Zeile<textarea data-rz="bingo.text" rows="12" placeholder="Leer lassen = Wörter vom Kreuzworträtsel verwenden">${esc(B.text)}</textarea></label>
          <p class="muted small"><code>Begriff: Erklärung</code> – bei der Ziehung wird die Erklärung vorgelesen, die Kinder suchen den Begriff.</p>
          <div class="row"><label class="f">Größe <select data-rz="bingo.n">${[3, 4, 5].map(x => `<option value="${x}" ${n === x ? 'selected' : ''}>${x} × ${x}</option>`).join('')}</select></label>
            <label class="f">Karten <input type="number" class="num" data-rz="bingo.anzahl" min="1" max="40" value="${B.anzahl}"></label></div>
          <label class="chk small"><input type="checkbox" data-rz="bingo.frei" ${B.frei ? 'checked' : ''}> Freifeld in der Mitte (bei 3×3 und 5×5)</label>
          <button class="btn primary" id="bgDruck" ${l.length < noetig ? 'disabled' : ''}>🖨 ${B.anzahl} Bingo-Karten drucken</button>
        </aside>
        <section class="card rz-vorschau">
          <h2>${esc(B.titel)}</h2>
          ${l.length < noetig ? `<p class="warnbox card">Für ${n}×${n}-Karten braucht es mindestens <b>${noetig} Begriffe</b> – derzeit ${l.length}. Am besten 6–10 mehr, damit jede Karte anders ist.</p>` : ''}
          ${l.length ? `<p class="muted small">Beispielkarte (jede gedruckte Karte ist anders gemischt):</p>${bingoKarte(l, n, frei, 1)}` : ''}
        </section></div>`;
    };
    const bingoKarte = (l, n, frei, nr) => {
      const w = shuffle(l).slice(0, n * n - (frei ? 1 : 0)), felder = [];
      for (let i = 0, j = 0; i < n * n; i++) felder.push(frei && i === (n * n - 1) / 2 ? '<td class="frei">★<br>frei</td>' : `<td>${esc(w[j++]?.wort || '')}</td>`);
      return `<div class="bingo-karte"><div class="bk-kopf"><b>${esc(B.titel)}</b><span>Nr. ${nr}</span></div><table class="bk bk${n}">${Array.from({ length: n }, (_, r) => `<tr>${felder.slice(r * n, r * n + n).join('')}</tr>`).join('')}</table></div>`;
    };
    const bingoDruck = () => {
      const n = B.n, frei = B.frei && n % 2 === 1, l = bingoBegriffe(), proSeite = n === 5 ? 2 : 4, karten = Array.from({ length: B.anzahl }, (_, i) => bingoKarte(l, n, frei, i + 1));
      const seiten = []; for (let i = 0; i < karten.length; i += proSeite) seiten.push(`<section class="seite"><div class="bk-raster p${proSeite}">${karten.slice(i, i + proSeite).join('')}</div></section>`);
      druckFenster(B.titel, `<style>.bk-raster{display:grid;gap:8mm}.bk-raster.p4{grid-template-columns:1fr 1fr}.bingo-karte{border:1pt solid #1d1d1f;border-radius:4mm;padding:4mm;break-inside:avoid}
        .bk-kopf{display:flex;justify-content:space-between;margin-bottom:3mm;font-size:11pt}.bk-kopf span{color:#6e6e73;font-size:8pt}.bk{width:100%;border-collapse:collapse;table-layout:fixed}
        .bk td{border:.8pt solid #1d1d1f;text-align:center;vertical-align:middle;font-weight:600;padding:2mm;background:none!important;hyphens:auto;word-break:break-word}
        .bk.bk3 td{height:22mm;font-size:11pt}.bk.bk4 td{height:19mm;font-size:9.5pt}.bk.bk5 td{height:22mm;font-size:10pt}.bk td.frei{font-size:9pt;color:#6e6e73}</style>` + seiten.join(''));
    };

    /* ----- Bingo-Ziehung am Beamer ----- */
    const ziehen = () => {
      const l = bingoBegriffe(), gez = RZ.gezogen.filter(w => l.some(x => x.wort === w)), akt = l.find(x => x.wort === gez[gez.length - 1]);
      body.innerHTML = `<div class="side-layout rev">
        <section class="slf-stage" id="bzStage"><button class="auf-fs" id="bzFs" title="Vollbild">⛶</button>
          <div class="bz-zaehler">${gez.length} von ${l.length} gezogen</div>
          <div class="bz-karte">${akt ? esc(akt.hinweis || akt.wort) : '🎱'}</div>
          ${akt && akt.hinweis ? `<details class="bz-lsg"><summary>Begriff anzeigen</summary><b>${esc(akt.wort)}</b></details>` : ''}
          <div class="ts-knoepfe"><button class="btn primary huge" id="bzNext" ${gez.length >= l.length ? 'disabled' : ''}>🎱 Nächster Begriff</button></div>
        </section>
        <aside class="card side"><h3>Schon gezogen (zum Kontrollieren)</h3>
          <ol class="bz-liste">${gez.map(w => `<li>${esc(w)}</li>`).join('') || '<li class="muted">noch nichts</li>'}</ol>
          <button class="btn danger" id="bzReset">Neue Runde</button></aside></div>`;
    };

    el.addEventListener('click', e => {
      const t = e.target;
      const tb = t.closest('[data-rztab]'); if (tb) { mod._tab = tb.dataset.rztab; draw(); return; }
      if (t.id === 'kwNeu') { kw(true); return; }
      if (t.id === 'kwDruck') { kwDruck(); return; }
      if (t.id === 'bgDruck') { bingoDruck(); return; }
      if (t.id === 'bzNext') { const offen = bingoBegriffe().filter(x => !RZ.gezogen.includes(x.wort)); if (!offen.length) return; RZ.gezogen.push(offen[Math.floor(Math.random() * offen.length)].wort); save(); sound.pop(); ziehen(); return; }
      if (t.id === 'bzReset' && confirm('Ziehung neu beginnen?')) { RZ.gezogen = []; save(); ziehen(); return; }
      if (t.closest('#bzFs')) { const st = el.querySelector('#bzStage'); document.fullscreenElement ? document.exitFullscreen() : st?.requestFullscreen?.(); }
    });
    let warte;
    el.addEventListener('input', e => {
      const k = e.target.dataset.rz; if (!k || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') return;
      const [a, b] = k.split('.'); RZ[a][b] = e.target.type === 'number' ? Math.max(1, Math.min(40, +e.target.value || 1)) : e.target.value; save();
      clearTimeout(warte); warte = setTimeout(() => { const f = document.activeElement, pos = f?.selectionStart; draw(); const n = el.querySelector(`[data-rz="${k}"]`); if (n && f?.dataset.rz === k) { n.focus(); if (pos != null && n.setSelectionRange) n.setSelectionRange(pos, pos); } }, 700);
    });
    el.addEventListener('change', e => {
      const k = e.target.dataset.rz;
      if (k && (e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) { const [a, b] = k.split('.'); RZ[a][b] = e.target.type === 'checkbox' ? e.target.checked : +e.target.value; save(); draw(); }
      if (e.target.id === 'kwLsg') { mod._lsg = e.target.checked; kw(); }
    });
    draw();
  },
});
