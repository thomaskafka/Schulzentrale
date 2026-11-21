'use strict';
/* ===== QR-Code: Link oder Text groß zeigen, damit die Klasse ihn mit Tablet/Handy öffnet ===== */

state.qr ||= { text: '', titel: '', verlauf: [] };

/** QR-Code als Canvas (scharf, beliebig groß) – Bibliothek liegt lokal in js/lib */
async function qrCanvas(text, px, farbe = '#000') {
  await ladeSkript('js/lib/qrcode.min.js');
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), rand = 2, zelle = Math.floor(px / (n + 2 * rand)), groesse = zelle * (n + 2 * rand);
  const cv = document.createElement('canvas'); cv.width = cv.height = groesse;
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, groesse, groesse); c.fillStyle = farbe;
  for (let r = 0; r < n; r++) for (let s = 0; s < n; s++) if (q.isDark(r, s)) c.fillRect((s + rand) * zelle, (r + rand) * zelle, zelle, zelle);
  return cv;
}

registerModule({
  id: 'qr', title: 'QR-Code', icon: '🔳',
  render(el) {
    const Q = state.qr;
    el.innerHTML = `<div class="page qrp">
      <div class="pagehead">${seitenTitel('qr', '#000', 'QR-Code')}</div>
      <div class="side-layout">
        <aside class="card side">
          <label class="f">Link oder Text<textarea id="qText" rows="3" placeholder="https://… oder ein beliebiger Text">${esc(Q.text)}</textarea></label>
          <label class="f">Überschrift (optional)<input id="qTitel" value="${esc(Q.titel)}" placeholder="z.B. Kahoot-Quiz"></label>
          ${state.links?.length ? `<h3>Aus deinen Links</h3><div class="qr-chips">${state.links.map(l => `<button data-qlink="${l.id}">${esc(l.name)}</button>`).join('')}</div>` : ''}
          ${Q.verlauf.length ? `<h3>Zuletzt</h3><div class="qr-chips">${Q.verlauf.map((v, i) => `<button data-qv="${i}" title="${esc(v.text)}">${esc(v.titel || v.text.replace(/^https?:\/\/(www\.)?/, '').slice(0, 28))}</button>`).join('')}</div>` : ''}
        </aside>
        <section class="qr-stage" id="qStage">
          <button class="auf-fs" id="qFs" title="Vollbild">⛶</button>
          <div class="qr-titel" id="qT"></div>
          <div class="qr-bild" id="qBild"><div class="placeholder">👈 Link oder Text eingeben</div></div>
          <div class="qr-text" id="qU"></div>
          <div class="row qr-tk"><button class="btn" id="qPng">⬇ Als Bild speichern</button><button class="btn" id="qKopie">Bild kopieren</button></div>
        </section>
      </div></div>`;
    const $ = id => el.querySelector('#' + id);
    let warte;
    const zeichnen = async () => {
      const text = Q.text.trim();
      $('qT').textContent = Q.titel; $('qU').textContent = text.length > 90 ? text.slice(0, 88) + '…' : text;
      el.querySelector('.qr-tk').hidden = !text;
      if (!text) { $('qBild').innerHTML = '<div class="placeholder">👈 Link oder Text eingeben</div>'; return; }
      try {
        const cv = await qrCanvas(text, 1200);
        cv.className = 'qr-cv'; $('qBild').replaceChildren(cv);
      } catch (e) { $('qBild').innerHTML = `<p class="muted">⚠️ ${esc(/too long|overflow/i.test(e.message || e) ? 'Der Text ist zu lang für einen QR-Code.' : (e.message || e))}</p>`; }
    };
    const merken = () => {
      const t = Q.text.trim(); if (!t) return;
      Q.verlauf = [{ text: t, titel: Q.titel }, ...Q.verlauf.filter(v => v.text !== t)].slice(0, 8); save();
    };
    el.addEventListener('input', e => {
      if (e.target.id === 'qText') Q.text = e.target.value;
      if (e.target.id === 'qTitel') Q.titel = e.target.value;
      save(); clearTimeout(warte); warte = setTimeout(zeichnen, 250);
    });
    el.addEventListener('change', e => { if (['qText', 'qTitel'].includes(e.target.id)) merken(); });
    el.addEventListener('click', async e => {
      const t = e.target;
      const l = t.closest('[data-qlink]'); if (l) { const x = state.links.find(y => y.id === l.dataset.qlink); Q.text = linkUrl(x.url); Q.titel = x.name; save(); merken(); $('qText').value = Q.text; $('qTitel').value = Q.titel; zeichnen(); return; }
      const v = t.closest('[data-qv]'); if (v) { const x = Q.verlauf[+v.dataset.qv]; Q.text = x.text; Q.titel = x.titel; save(); $('qText').value = Q.text; $('qTitel').value = Q.titel; zeichnen(); return; }
      if (t.closest('#qFs')) { const st = $('qStage'); document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.(); return; }
      if (t.id === 'qPng' || t.id === 'qKopie') {
        const cv = await qrCanvas(Q.text.trim(), 1000);
        cv.toBlob(async b => {
          if (t.id === 'qPng') { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `QR_${(Q.titel || 'Code').replace(/[^\wäöüÄÖÜß-]+/g, '_')}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
          else { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast('Bild kopiert – z.B. in ein Arbeitsblatt einfügen'); } catch (err) { toast('Kopieren nicht möglich – bitte „Als Bild speichern“'); } }
        }, 'image/png');
      }
    });
    zeichnen();
  },
});
