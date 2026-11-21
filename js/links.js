'use strict';
/* ===== Links: eigene Verknüpfungen zu Websites ===== */

state.links ||= [{ id: uid(), name: 'Kahoot!', url: 'https://www.kahoot.com' }];

const linkUrl = u => { u = (u || '').trim(); return /^https?:\/\//i.test(u) ? u : 'https://' + u; };
const linkHost = u => { try { return new URL(linkUrl(u)).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
/** Logo der Website (holt der Hilfsdienst einmalig und speichert es in daten/icons) – sonst Anfangsbuchstabe */
const linkLogo = l => `<span class="link-ic">${esc((l.name || '?').trim().charAt(0).toUpperCase())}${SERVER
  ? `<img src="/api/icon?host=${encodeURIComponent(linkHost(l.url))}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`;

registerModule({
  id: 'links', title: 'Links', icon: '🔗',
  render(el) {
    let bearbeiten = false;
    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('link', '#0a84ff', 'Links')}
        <div class="row"><button class="btn" id="lkAdd">+ Hinzufügen</button><button class="btn" id="lkEdit">Bearbeiten</button></div></div>
      <form class="card link-neu" id="lkNeu" hidden>
        <h3>Link hinzufügen</h3>
        <div class="row"><input name="name" placeholder="Name, z.B. LearningApps" required>
          <input name="url" placeholder="Adresse, z.B. learningapps.org" required>
          <button class="btn primary">Speichern</button></div>
      </form>
      <section class="link-grid" id="lkGrid"></section></div>`;
    const form = el.querySelector('#lkNeu'), addBtn = el.querySelector('#lkAdd');
    const formular = auf => { form.hidden = !auf; addBtn.textContent = auf ? 'Abbrechen' : '+ Hinzufügen'; if (auf) form.name.focus(); };
    const grid = el.querySelector('#lkGrid');
    const draw = () => {
      el.querySelector('#lkEdit').textContent = bearbeiten ? 'Fertig' : 'Bearbeiten';
      grid.classList.toggle('bearbeiten', bearbeiten);
      grid.innerHTML = state.links.map((l, i) => `<div class="link-karte" data-id="${l.id}">
        <a href="${esc(linkUrl(l.url))}" target="_blank" rel="noopener">
          ${linkLogo(l)}
          <span class="link-t">${esc(l.name)}</span><span class="link-s">${esc(linkHost(l.url))}</span></a>
        ${bearbeiten ? `<div class="link-tools">
          <button class="btn small" data-hoch="${i}" title="Nach vorne" ${i ? '' : 'disabled'}>←</button>
          <button class="btn small" data-umb title="Umbenennen">Ändern</button>
          <button class="btn small danger" data-del title="Löschen">Löschen</button></div>` : ''}
      </div>`).join('') || '<p class="muted">Noch keine Links – unten einen hinzufügen.</p>';
    };
    el.querySelector('#lkNeu').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      state.links.push({ id: uid(), name: f.name.value.trim(), url: linkUrl(f.url.value) });
      save(); f.reset(); formular(false); draw(); toast('Link hinzugefügt');
    });
    el.addEventListener('click', e => {
      const t = e.target;
      if (t.id === 'lkEdit') { bearbeiten = !bearbeiten; draw(); return; }
      if (t.id === 'lkAdd') { formular(form.hidden); return; }
      const karte = t.closest('[data-id]'), l = karte && state.links.find(x => x.id === karte.dataset.id);
      if (!l) return;
      if (t.closest('[data-del]') && confirm(`Link „${l.name}“ löschen?`)) { state.links = state.links.filter(x => x !== l); save(); draw(); }
      if (t.closest('[data-umb]')) {
        const n = prompt('Name:', l.name); if (n === null) return;
        const u = prompt('Adresse:', l.url); if (u === null) return;
        l.name = n.trim() || l.name; l.url = linkUrl(u); save(); draw();
      }
      const h = t.closest('[data-hoch]');
      if (h) { const i = +h.dataset.hoch; [state.links[i - 1], state.links[i]] = [state.links[i], state.links[i - 1]]; save(); draw(); }
    });
    draw();
  },
});
