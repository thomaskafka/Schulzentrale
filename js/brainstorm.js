'use strict';
/* ===== Brainstorming: Wortwolke, Mindmap, Pinnwand ===== */

const BS_HINTERGRUND = [
  { id: 'weiss', name: 'Weiß' }, { id: 'tafel', name: 'Tafel' }, { id: 'kork', name: 'Kork' },
  { id: 'papier', name: 'Papier' }, { id: 'nacht', name: 'Nacht' },
];
const BS_SCHRIFT = [{ id: 'nunito', name: 'Rund' }, { id: 'hand', name: 'Handschrift' }, { id: 'kreide', name: 'Kreide' }];
const BS_ANSICHT = [{ id: 'wolke', icon: '☁️', name: 'Wortwolke' }, { id: 'mindmap', icon: '🕸️', name: 'Mindmap' }, { id: 'pinnwand', icon: '📌', name: 'Pinnwand' }];

state.brainstorms ||= [];
const BS_KLAR = ['#0a84ff', '#5e5ce6', '#ff375f', '#ff9f0a', '#30b0c7', '#34c759', '#bf5af2', '#ff6b3d'];
const BS_PASTELL = ['#fde68a', '#a7f3d0', '#bae6fd', '#fbcfe8', '#ddd6fe', '#fed7aa', '#ffffff'];
state.aktBrainstorm ||= null;

function neuesBrainstorm(thema = 'Unser Thema') {
  const b = { id: uid(), thema, ansicht: 'wolke', hg: 'weiss', schrift: 'nunito', groesse: 1,
    kategorien: [{ id: uid(), name: 'Ideen', farbe: COLORS[5] }], karten: [] };
  state.brainstorms.push(b); state.aktBrainstorm = b.id; save(); return b;
}

registerModule({
  id: 'brainstorm', title: 'Brainstorming', icon: '💭',
  render(el) {
    const mod = this;
    let b = state.brainstorms.find(x => x.id === state.aktBrainstorm) || state.brainstorms[0] || neuesBrainstorm('Was fällt euch zum Herbst ein?');
    state.aktBrainstorm = b.id;
    let katAkt = b.kategorien[0].id;

    el.innerHTML = `<div class="page">
      <div class="pagehead bs-head">
        <div class="row">${seitenTitel('birne', '#000', 'Brainstorming')}<select id="bsSel"></select><button class="btn" id="bsNew">+ Neu</button><button class="btn danger small" id="bsDel">Löschen</button></div>
        <div class="row"><button class="btn" id="bsFull">⛶ Präsentieren</button><button class="btn" id="bsCopy">Liste kopieren</button><button class="btn" id="bsPrint">Drucken</button></div>
      </div>
      <div class="bs-tools card">
        <div class="seg" id="bsAnsicht">${BS_ANSICHT.map(a => `<button data-ans="${a.id}">${a.icon} ${a.name}</button>`).join('')}</div>
        <label class="chk small">Hintergrund <select id="bsHg">${BS_HINTERGRUND.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}</select></label>
        <label class="chk small">Schrift <select id="bsSchrift">${BS_SCHRIFT.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}</select></label>
        <label class="chk small">Größe <input type="range" id="bsGr" min="0.6" max="1.8" step="0.1"></label>
      </div>
      <div class="bs-board" id="bsBoard"></div>
      <form class="bs-input card" id="bsForm">
        <div class="bs-kats" id="bsKats"></div>
        <div class="row"><input id="bsIn" placeholder="Begriff eintippen und Enter drücken …" autocomplete="off"><button class="btn primary">+</button></div>
      </form></div>`;
    const $ = id => el.querySelector('#' + id);
    const board = $('bsBoard');

    const tools = () => {
      $('bsSel').innerHTML = state.brainstorms.map(x => `<option value="${x.id}" ${x.id === b.id ? 'selected' : ''}>${esc(x.thema)}</option>`).join('');
      el.querySelectorAll('[data-ans]').forEach(x => x.classList.toggle('on', x.dataset.ans === b.ansicht));
      $('bsHg').value = b.hg; $('bsSchrift').value = b.schrift; $('bsGr').value = b.groesse;
      $('bsKats').innerHTML = b.kategorien.map(k => `<button type="button" class="bs-kat ${k.id === katAkt ? 'on' : ''}" data-kat="${k.id}" style="--c:${k.farbe}" title="Doppelklick = umbenennen">${esc(k.name)}</button>`).join('')
        + `<button type="button" class="bs-kat add" id="bsKatAdd" title="Kategorie hinzufügen">+ Kategorie</button>`;
    };
    const kat = id => b.kategorien.find(k => k.id === id) || b.kategorien[0];
    const fontSize = base => base * b.groesse;

    const leer = () => b.karten.length ? '' : '<div class="bs-leer">Begriffe unten eintippen – sie erscheinen hier.</div>';
    const drawBoard = () => {
      board.className = `bs-board hg-${b.hg} f-${b.schrift} a-${b.ansicht}`;
      const W = board.clientWidth, H = board.clientHeight;
      const thema = `<div class="bs-thema" contenteditable="true" spellcheck="false" id="bsThema">${esc(b.thema)}</div>`;
      if (b.ansicht === 'wolke') {
        // gleiche Begriffe zusammenfassen → größer
        const map = new Map();
        b.karten.forEach(c => { const key = c.text.toLowerCase(); const m = map.get(key); m ? (m.n++, m.ids.push(c.id)) : map.set(key, { c, n: 1, ids: [c.id] }); });
        const words = [...map.values()].sort((a, z) => z.n - a.n);
        const cv = document.createElement('canvas').getContext('2d');
        const ff = b.schrift === 'hand' ? 'Caveat' : b.schrift === 'kreide' ? 'Patrick Hand' : 'Nunito';
        const pal = ['tafel', 'nacht'].includes(b.hg) ? BS_PASTELL : BS_KLAR;
        // Wolke legen; passen nicht alle Begriffe hinein, wird automatisch kleiner gerechnet
        let out = '', faktor = 1;
        for (let versuch = 0; versuch < 8; versuch++, faktor *= 0.85) {
          const placed = []; let fehlt = 0;
          out = words.map((w, i) => {
          const fs = fontSize(Math.min(96, 32 + (w.n - 1) * 18 + (i < 3 ? 8 : 0))) * faktor;
          cv.font = `800 ${fs}px ${ff}`;
          const ww = cv.measureText(w.c.text).width + 16, hh = fs * 1.15;
          let x = 0, y = 0, ok = false;
          for (let t = 0; t < 600 && !ok; t += 0.35) {
            x = W / 2 + 7 * t * Math.cos(t) - ww / 2; y = H / 2 + 20 + 4.5 * t * Math.sin(t) - hh / 2;
            ok = x > 6 && y > 70 && x + ww < W - 6 && y + hh < H - 6 && !placed.some(p => x < p.x + p.w && x + ww > p.x && y < p.y + p.h && y + hh > p.y);
          }
          if (!ok) { fehlt++; return ''; }
          placed.push({ x, y, w: ww, h: hh });
          return `<span class="bs-w" data-ids="${w.ids.join(',')}" style="left:${x}px;top:${y}px;font-size:${fs}px;color:${b.kategorien.length > 1 ? kat(w.c.kat).farbe : pal[i % pal.length]};--rot:${i ? ((i * 37) % 3 - 1) * 4 : 0}deg">${esc(w.c.text)}${w.n > 1 ? `<sup>${w.n}</sup>` : ''}</span>`;
          }).join('');
          if (!fehlt) break;
        }
        board.innerHTML = thema + out + leer();
      } else if (b.ansicht === 'mindmap') {
        const cards = b.karten.slice().sort((x, y) => b.kategorien.indexOf(kat(x.kat)) - b.kategorien.indexOf(kat(y.kat)));
        const n = cards.length, cx = W / 2, cy = H / 2;
        let lines = '', html = '';
        cards.forEach((c, i) => {
          const a = i / Math.max(n, 1) * Math.PI * 2 - Math.PI / 2, ring = n > 14 && i % 2 ? 0.27 : 0.4;
          const x = cx + Math.cos(a) * W * ring, y = cy + Math.sin(a) * H * (ring + 0.02), col = kat(c.kat).farbe;
          const mx = (cx + x) / 2 + (y - cy) * 0.18, my = (cy + y) / 2 - (x - cx) * 0.18; // leicht geschwungene Äste
          lines += `<path d="M${cx},${cy} Q${mx},${my} ${x},${y}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" opacity=".55"/><circle cx="${x}" cy="${y}" r="6" fill="${col}"/>`;
          html += `<div class="bs-node" data-ids="${c.id}" style="left:${x}px;top:${y}px;--c:${col};font-size:${fontSize(20)}px">${esc(c.text)}</div>`;
        });
        board.innerHTML = `<svg class="bs-lines" width="${W}" height="${H}">${lines}</svg>${thema}${html}${leer()}`;
        board.querySelector('.bs-thema').classList.add('center');
      } else {
        board.innerHTML = thema + b.karten.map((c, i) => `<div class="bs-note" data-ids="${c.id}" data-drag="${c.id}" style="left:${c.x * 100}%;top:${c.y * 100}%;--c:${b.kategorien.length > 1 ? kat(c.kat).farbe : '#ffcc00'};--rot:${(i % 5 - 2) * 1.5}deg;font-size:${fontSize(19)}px">${esc(c.text)}</div>`).join('') + leer();
      }
    };
    const draw = () => { tools(); drawBoard(); };

    const add = text => {
      text = text.trim(); if (!text) return;
      // Pinnwand: nächsten freien Platz im Raster suchen, sonst zufällig
      const slots = [];
      for (let y = 0.16; y < 0.8; y += 0.21) for (let x = 0.02; x < 0.85; x += 0.15) slots.push({ x: x + Math.random() * 0.02, y: y + Math.random() * 0.03 });
      const frei = slots.find(s => b.karten.every(c => Math.abs(c.x - s.x) > 0.1 || Math.abs(c.y - s.y) > 0.14));
      const pos = frei || { x: 0.05 + Math.random() * 0.75, y: 0.18 + Math.random() * 0.62 };
      b.karten.push({ id: uid(), text, kat: katAkt, x: pos.x, y: pos.y });
      save(); drawBoard(); sound.pop();
    };

    $('bsForm').addEventListener('submit', e => { e.preventDefault(); add($('bsIn').value); $('bsIn').value = ''; $('bsIn').focus(); });
    el.addEventListener('click', e => {
      const t = e.target;
      const an = t.closest('[data-ans]'); if (an) { b.ansicht = an.dataset.ans; save(); draw(); }
      const k = t.closest('[data-kat]'); if (k) { katAkt = k.dataset.kat; tools(); }
      if (t.id === 'bsKatAdd') {
        const n = prompt('Name der Kategorie:', ''); if (!n) return;
        const c = { id: uid(), name: n.trim(), farbe: COLORS[(b.kategorien.length * 3 + 5) % COLORS.length] };
        b.kategorien.push(c); katAkt = c.id; save(); draw();
      }
      if (t.id === 'bsNew') { const th = prompt('Thema des Brainstormings:', ''); if (!th) return; b = neuesBrainstorm(th); katAkt = b.kategorien[0].id; draw(); }
      if (t.id === 'bsDel' && confirm(`„${b.thema}“ löschen?`)) {
        state.brainstorms = state.brainstorms.filter(x => x !== b);
        b = state.brainstorms[0] || neuesBrainstorm(); state.aktBrainstorm = b.id; katAkt = b.kategorien[0].id; save(); draw();
      }
      if (t.id === 'bsCopy') {
        const txt = b.thema + '\n' + b.kategorien.map(k => { const ks = b.karten.filter(c => kat(c.kat) === k); return ks.length ? (b.kategorien.length > 1 ? `\n${k.name}:\n` : '') + ks.map(c => '• ' + c.text).join('\n') : ''; }).join('\n');
        navigator.clipboard?.writeText(txt).then(() => toast('In die Zwischenablage kopiert'), () => toast('Kopieren nicht möglich'));
      }
      if (t.id === 'bsPrint') window.print();
      if (t.id === 'bsFull') board.requestFullscreen ? board.requestFullscreen().then(() => setTimeout(drawBoard, 250)) : toast('Vollbild nicht möglich');
    });
    el.addEventListener('dblclick', e => {
      const k = e.target.closest('[data-kat]');
      if (k) { const c = kat(k.dataset.kat), n = prompt('Kategorie umbenennen (leer = löschen):', c.name); if (n === null) return;
        if (!n.trim() && b.kategorien.length > 1) { b.kategorien = b.kategorien.filter(x => x !== c); b.karten.forEach(x => { if (x.kat === c.id) x.kat = b.kategorien[0].id; }); katAkt = b.kategorien[0].id; }
        else if (n.trim()) c.name = n.trim();
        save(); draw(); return; }
      const w = e.target.closest('[data-ids]');
      if (w) {
        const ids = w.dataset.ids.split(','), c = b.karten.find(x => x.id === ids[0]);
        const n = prompt('Begriff ändern (leer = löschen):', c.text); if (n === null) return;
        if (!n.trim()) b.karten = b.karten.filter(x => !ids.includes(x.id));
        else b.karten.filter(x => ids.includes(x.id)).forEach(x => x.text = n.trim());
        save(); drawBoard();
      }
    });
    el.addEventListener('change', e => {
      if (e.target.id === 'bsSel') { b = state.brainstorms.find(x => x.id === e.target.value); state.aktBrainstorm = b.id; katAkt = b.kategorien[0].id; save(); draw(); }
      if (e.target.id === 'bsHg') { b.hg = e.target.value; save(); drawBoard(); }
      if (e.target.id === 'bsSchrift') { b.schrift = e.target.value; save(); drawBoard(); }
    });
    el.addEventListener('input', e => {
      if (e.target.id === 'bsGr') { b.groesse = +e.target.value; save(); drawBoard(); }
      if (e.target.id === 'bsThema') { b.thema = e.target.innerText.trim() || 'Thema'; save(); $('bsSel').selectedOptions[0].textContent = b.thema; }
    });
    // Pinnwand: Zettel verschieben
    let drag = null;
    board.addEventListener('pointerdown', e => {
      const n = e.target.closest('[data-drag]'); if (!n) return;
      const r = board.getBoundingClientRect(), nr = n.getBoundingClientRect();
      drag = { n, c: b.karten.find(x => x.id === n.dataset.drag), dx: e.clientX - nr.left, dy: e.clientY - nr.top, r };
      n.setPointerCapture(e.pointerId); n.classList.add('dragging');
    });
    board.addEventListener('pointermove', e => {
      if (!drag) return;
      const x = (e.clientX - drag.r.left - drag.dx) / drag.r.width, y = (e.clientY - drag.r.top - drag.dy) / drag.r.height;
      drag.c.x = Math.max(0, Math.min(0.92, x)); drag.c.y = Math.max(0, Math.min(0.92, y));
      drag.n.style.left = drag.c.x * 100 + '%'; drag.n.style.top = drag.c.y * 100 + '%';
    });
    board.addEventListener('pointerup', () => { if (drag) { drag.n.classList.remove('dragging'); drag = null; save(); } });
    mod._onResize = () => drawBoard(); window.addEventListener('resize', mod._onResize);

    draw();
    document.fonts && document.fonts.ready.then(() => drawBoard());
  },
  destroy() { window.removeEventListener('resize', this._onResize); },
});
