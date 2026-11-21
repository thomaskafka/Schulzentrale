'use strict';
/* ===== Post-it-Notizen: von jeder Seite über 📌 oben erreichbar ===== */

const POSTIT_FARBEN = ['#fef08a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fed7aa', '#ddd6fe'];

const Notizen = (() => {
  const panel = document.createElement('aside');
  panel.className = 'notes';
  panel.innerHTML = `
    <div class="notes-head"><h2>Notizen</h2><button class="x" data-close title="Schließen (Esc)">×</button></div>
    <form class="notes-new">
      <textarea rows="2" placeholder="Was darf ich nicht vergessen? (Enter = speichern)"></textarea>
      <div class="row between"><div class="colors">${POSTIT_FARBEN.map((c, i) => `<button type="button" class="cdot" data-col="${i}" style="background:${c}"></button>`).join('')}</div>
      <button class="btn primary">+ Post-it</button></div>
    </form>
    <div class="notes-grid"></div>
    <details class="notes-done"><summary></summary><ul></ul></details>`;
  const back = document.createElement('div');
  back.className = 'notes-back';
  let farbe = 0;
  const ta = panel.querySelector('textarea'), grid = panel.querySelector('.notes-grid');

  const badge = () => {
    const n = state.notizen.filter(x => !x.erledigt).length;
    const b = document.getElementById('notesBadge');
    if (b) { b.textContent = n || ''; b.hidden = !n; }
  };
  const draw = () => {
    panel.querySelectorAll('.cdot').forEach(d => d.classList.toggle('on', +d.dataset.col === farbe));
    const offen = state.notizen.filter(x => !x.erledigt), erl = state.notizen.filter(x => x.erledigt);
    grid.innerHTML = offen.map((n, i) => `<div class="postit" style="background:${POSTIT_FARBEN[n.farbe] || POSTIT_FARBEN[0]};--rot:${(i % 3 - 1) * 1.2}deg" data-id="${n.id}">
        <div class="pi-text" contenteditable="true" spellcheck="false">${esc(n.text)}</div>
        <div class="pi-foot"><span>${fmtDate(n.d)}</span><span>
          <button data-farbe title="Farbe wechseln">🎨</button><button data-done title="Erledigt">✓</button></span></div>
      </div>`).join('') || '<p class="muted center">Keine offenen Notizen 🎉</p>';
    const sum = panel.querySelector('.notes-done summary');
    panel.querySelector('.notes-done').hidden = !erl.length;
    sum.textContent = `Erledigt (${erl.length})`;
    panel.querySelector('.notes-done ul').innerHTML = erl.slice().reverse().map(n => `<li data-id="${n.id}"><span>${esc(n.text)}</span>
      <button data-undo title="Wieder öffnen">↺</button><button class="x" data-del title="Endgültig löschen">×</button></li>`).join('') +
      (erl.length > 1 ? '<li><button class="btn small" data-delall>Alle erledigten löschen</button></li>' : '');
    badge();
  };
  const find = el => state.notizen.find(n => n.id === el.closest('[data-id]').dataset.id);
  const add = () => {
    const t = ta.value.trim(); if (!t) return;
    state.notizen.push({ id: uid(), text: t, farbe, d: todayISO(), erledigt: false });
    save(); ta.value = ''; draw(); ta.focus();
  };

  panel.querySelector('form').addEventListener('submit', e => { e.preventDefault(); add(); });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } });
  panel.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close]')) return close();
    if (t.dataset.col) { farbe = +t.dataset.col; draw(); return; }
    if (t.closest('[data-farbe]')) { const n = find(t); n.farbe = (n.farbe + 1) % POSTIT_FARBEN.length; save(); draw(); }
    if (t.closest('[data-done]')) { const n = find(t); n.erledigt = true; save(); draw(); sound.pop(); }
    if (t.closest('[data-undo]')) { find(t).erledigt = false; save(); draw(); }
    if (t.closest('[data-del]')) { const n = find(t); state.notizen = state.notizen.filter(x => x !== n); save(); draw(); }
    if (t.closest('[data-delall]')) { state.notizen = state.notizen.filter(x => !x.erledigt); save(); draw(); }
  });
  panel.addEventListener('input', e => {
    if (!e.target.classList.contains('pi-text')) return;
    find(e.target).text = e.target.innerText.trim(); save();
  });

  const open = () => { panel.classList.add('open'); back.classList.add('open'); draw(); setTimeout(() => ta.focus(), 200); };
  const close = () => { panel.classList.remove('open'); back.classList.remove('open'); badge(); };
  back.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open-notes]');
    if (o) { e.preventDefault(); panel.classList.contains('open') ? close() : open(); }
  });
  document.body.append(back, panel);
  return { open, close, badge };
})();
