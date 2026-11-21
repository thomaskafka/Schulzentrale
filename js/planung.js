'use strict';
/* ===== Unterrichtsplanung in Notizform ===== */

state.planung ||= [];

registerModule({
  id: 'planung', title: 'Unterrichtsplanung', icon: '🗓️',
  render(el) {
    if (kursWahl(this, el, seitenTitel('stift', '#ff9500', 'Unterrichtsplanung'))) return;
    const mod = this;
    let selId = null, alle = false, suche = '';
    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('stift', '#ff9500', 'Unterrichtsplanung')}<div id="plKs"></div></div>
      <div class="split plsplit">
        <aside class="card side">
          <button class="btn primary full" id="plNew">+ Neue Stunde planen</button>
          <input id="plSuche" placeholder="🔎 Suchen …">
          <label class="chk small"><input type="checkbox" id="plAlle"> Alle Klassen anzeigen</label>
          <div id="plList" class="pllist"></div>
        </aside>
        <section id="plEdit"></section>
      </div></div>`;
    const $ = id => el.querySelector('#' + id);
    $('plKs').appendChild(kursPfad(this, el));
    const kursName = p => { const k = klasse(p.k); return k ? `${k.name} · ${k.faecher.find(f => f.id === p.f)?.name || ''}` : '?'; };

    const sichtbar = () => {
      const k = aktKlasse(), f = aktFach(k);
      return state.planung.filter(p => (alle || (p.k === k?.id && p.f === f?.id)) &&
        (!suche || (p.thema + ' ' + p.text).toLowerCase().includes(suche))).sort((a, b) => b.d.localeCompare(a.d));
    };
    const drawList = () => {
      const l = sichtbar(), heute = todayISO();
      $('plList').innerHTML = l.map(p => {
        const offen = p.check.filter(c => !c.done).length;
        return `<button class="plitem ${p.id === selId ? 'on' : ''} ${p.d === heute ? 'heute' : ''} ${p.d < heute ? 'alt' : ''}" data-pl="${p.id}">
          <span class="pl-d">${p.d === heute ? 'Heute' : new Date(p.d + 'T00:00').toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'numeric' })}${alle ? ' · ' + esc(kursName(p)) : ''}</span>
          <b>${esc(p.thema || '(ohne Thema)')}</b>${offen ? `<span class="pl-open">${offen} offen</span>` : ''}</button>`;
      }).join('') || '<p class="muted small">Noch keine Planung.</p>';
    };
    const drawEdit = () => {
      const p = state.planung.find(x => x.id === selId);
      if (!p) {
        const k = aktKlasse(), f = aktFach(k);
        const letzte = state.planung.filter(x => x.k === k?.id && x.f === f?.id && x.d <= todayISO()).sort((a, b) => b.d.localeCompare(a.d))[0];
        $('plEdit').innerHTML = `<div class="card plempty"><div class="pb-big">📝</div><p>Links eine Stunde auswählen oder <b>„+ Neue Stunde planen“</b>.</p>
          ${letzte ? `<div class="pl-last"><div class="muted small">Zuletzt in ${esc(kursName(letzte))} (${fmtDate(letzte.d)}):</div><b>${esc(letzte.thema)}</b><p>${esc(letzte.text).replace(/\n/g, '<br>')}</p></div>` : ''}</div>`;
        return;
      }
      const vorher = state.planung.filter(x => x.k === p.k && x.f === p.f && x.d < p.d).sort((a, b) => b.d.localeCompare(a.d))[0];
      $('plEdit').innerHTML = `<div class="postit-big">
        <div class="row between"><div class="row"><input type="date" id="plD" value="${p.d}"><span class="pl-kurs">${esc(kursName(p))}</span></div>
          <div class="row"><select id="plCopy"><option value="">⧉ Kopieren für …</option>${state.klassen.flatMap(k => k.faecher.map(f => `<option value="${k.id}|${f.id}">${esc(k.name)} · ${esc(f.name)}</option>`)).join('')}</select>
          <button class="btn small" id="plPrint">🖨</button><button class="btn small danger" id="plDel">Löschen</button></div></div>
        <input class="pl-thema" id="plThema" value="${esc(p.thema)}" placeholder="Thema der Stunde">
        <textarea id="plText" rows="10" placeholder="Ablauf, Ziele, Material, Hausübung …&#10;&#10;z.B.&#10;• Einstieg: Bild zeigen (5 min)&#10;• Gruppenarbeit S. 34 (20 min)&#10;• HÜ: AB Nr. 3">${esc(p.text)}</textarea>
        <h3>Nicht vergessen</h3>
        <ul class="plcheck">${p.check.map((c, i) => `<li class="${c.done ? 'done' : ''}"><label><input type="checkbox" data-ci="${i}" ${c.done ? 'checked' : ''}> ${esc(c.t)}</label><button class="x" data-cx="${i}">×</button></li>`).join('')}</ul>
        <form id="plCheckForm" class="row"><input id="plCheckIn" placeholder="z.B. Kopien, Beamer, Material …"><button class="btn small">+</button></form>
        ${vorher ? `<details class="pl-prev"><summary>Vorige Stunde (${fmtDate(vorher.d)}): ${esc(vorher.thema)}</summary><p>${esc(vorher.text).replace(/\n/g, '<br>')}</p></details>` : ''}
      </div>`;
    };
    const draw = () => { drawList(); drawEdit(); };
    const akt = () => state.planung.find(x => x.id === selId);

    el.addEventListener('click', e => {
      const t = e.target;
      const it = t.closest('[data-pl]'); if (it) { selId = it.dataset.pl; draw(); return; }
      if (t.id === 'plNew') {
        const k = aktKlasse(); if (!k) return toast('Zuerst eine Klasse anlegen');
        const p = { id: uid(), k: k.id, f: aktFach(k).id, d: todayISO(), thema: '', text: '', check: [] };
        state.planung.push(p); selId = p.id; save(); draw(); $('plThema').focus();
      }
      const p = akt(); if (!p) return;
      if (t.dataset.cx !== undefined) { p.check.splice(+t.dataset.cx, 1); save(); draw(); }
      if (t.id === 'plDel' && confirm('Diese Planung löschen?')) { state.planung = state.planung.filter(x => x !== p); selId = null; save(); draw(); }
      if (t.id === 'plPrint') druckFenster(p.thema, druckKopf(esc(p.thema), esc(kursName(p)), 'Unterrichtsplanung<br>' + fmtDate(p.d)) + `<div class="block" style="font-size:10.5pt;line-height:1.55">${esc(p.text).replace(/\n/g, '<br>') || '<span class="muted">–</span>'}</div>${p.check.length ? `<div class="block"><h3>Nicht vergessen</h3><ul class="check">${p.check.map(c => `<li>${c.done ? '☑' : '☐'}&nbsp; ${esc(c.t)}</li>`).join('')}</ul></div>` : ''}`);
    });
    el.addEventListener('change', e => {
      const t = e.target, p = akt();
      if (t.id === 'plAlle') { alle = t.checked; drawList(); }
      if (!p) return;
      if (t.id === 'plD') { p.d = t.value || todayISO(); save(); drawList(); }
      if (t.dataset.ci !== undefined) { p.check[+t.dataset.ci].done = t.checked; save(); draw(); }
      if (t.id === 'plCopy' && t.value) {
        const [k, f] = t.value.split('|');
        const c = { ...JSON.parse(JSON.stringify(p)), id: uid(), k, f, check: p.check.map(x => ({ t: x.t, done: false })) };
        state.planung.push(c); save(); toast('Kopiert nach ' + kursName(c)); t.value = ''; drawList();
      }
    });
    el.addEventListener('input', e => {
      const t = e.target, p = akt();
      if (t.id === 'plSuche') { suche = t.value.trim().toLowerCase(); drawList(); return; }
      if (!p) return;
      if (t.id === 'plThema') { p.thema = t.value; save(); drawList(); }
      if (t.id === 'plText') { p.text = t.value; save(); }
    });
    el.addEventListener('submit', e => {
      if (e.target.id !== 'plCheckForm') return;
      e.preventDefault();
      const v = $('plCheckIn').value.trim(), p = akt(); if (!v || !p) return;
      p.check.push({ t: v, done: false }); save(); draw(); $('plCheckIn').focus();
    });
    draw();
  },
});
