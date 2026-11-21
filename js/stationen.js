'use strict';
/* ===== Stationenbetrieb: Gruppen wechseln automatisch die Stationen – mit Arbeits- und Wechselzeit ===== */

state.stationen ||= { liste: 'Lesen\nSchreiben\nRätsel\nSpiel', gruppen: 4, minuten: 10, wechsel: 60, namen: 'farben' };
const ST = state.stationen;

registerModule({
  id: 'stationen', title: 'Stationenbetrieb', icon: '🔄',
  render(el) {
    const mod = this;
    const R = (mod._r ||= { phase: 'aus', runde: 0, ende: 0, rest: 0, pause: false, gruppen: null });
    const stationen = () => ST.liste.split('\n').map(x => x.trim()).filter(Boolean);
    const gruppenStd = () => { const l = TEAM_STILE[ST.namen]?.liste() || TEAM_STILE.farben.liste(); return Array.from({ length: Math.min(ST.gruppen, 10) }, (_, i) => ({ emoji: l[i][0], name: l[i][1], farbe: l[i][2] || COLORS[i] })); };
    const gruppen = () => R.gruppen || gruppenStd();
    const ausGruppen = letzteGruppen;

    el.innerHTML = `<div class="page stpage">
      <div class="pagehead">${seitenTitel('stationen', '#000', 'Stationenbetrieb')}</div>
      <div class="side-layout">
        <aside class="card side" id="sSide"></aside>
        <section class="st-stage" id="sStage"></section>
      </div></div>`;
    const $ = id => el.querySelector('#' + id);
    const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    const seite = () => {
      const g = ausGruppen(), lauf = R.phase !== 'aus' && R.phase !== 'fertig';
      $('sSide').innerHTML = `
        <label class="f">Stationen – eine pro Zeile<textarea id="sListe" rows="6" ${lauf ? 'disabled' : ''}>${esc(ST.liste)}</textarea></label>
        <div class="row"><label class="f">Arbeitszeit<span class="row"><input type="number" class="num" id="sMin" min="1" max="90" value="${ST.minuten}" ${lauf ? 'disabled' : ''}> min</span></label>
          <label class="f">Wechselzeit<span class="row"><input type="number" class="num" id="sWech" min="0" max="300" step="15" value="${ST.wechsel}" ${lauf ? 'disabled' : ''}> s</span></label></div>
        <h3>Gruppen</h3>
        ${R.gruppen ? `<p class="small">✅ ${R.gruppen.length} Gruppen aus „Gruppen bilden“ <button class="linkbtn" id="sGrWeg" ${lauf ? 'disabled' : ''}>zurücksetzen</button></p>`
          : `<div class="row"><div class="stepper small"><button data-gstep="-1" ${lauf ? 'disabled' : ''}>−</button><span>${ST.gruppen}</span><button data-gstep="1" ${lauf ? 'disabled' : ''}>+</button></div>
            <select id="sNamen" ${lauf ? 'disabled' : ''}>${Object.entries(TEAM_STILE).map(([k, s]) => `<option value="${k}" ${ST.namen === k ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div>
            ${g ? `<button class="btn small full" id="sGrHol" ${lauf ? 'disabled' : ''}>👥 ${g.groups.length} Gruppen aus „Gruppen bilden“ übernehmen</button>` : '<p class="muted small">Tipp: Zuerst unter <a href="#/gruppen">Gruppen bilden</a> einteilen – dann hier übernehmen, inklusive Namen.</p>'}`}
        <p class="muted small">${stationen().length} Stationen · ${gruppen().length} Gruppen · Dauer ca. ${Math.round(stationen().length * (ST.minuten + ST.wechsel / 60))} min
          ${gruppen().length > stationen().length ? '<br>⚠️ Mehr Gruppen als Stationen – bitte Stationen ergänzen.' : ''}</p>`;
    };
    const station = (g, r) => (g + r) % stationen().length;
    const buehne = () => {
      const S = stationen(), G = gruppen(), lauf = R.phase === 'arbeit' || R.phase === 'wechsel';
      const rest = R.pause ? R.rest : Math.max(0, R.ende - Date.now() / 1000), gesamt = R.phase === 'wechsel' ? ST.wechsel : ST.minuten * 60;
      const belegt = r => S.map((_, i) => G.findIndex((_, gi) => station(gi, r) === i));
      const karte = (sn, gi, i) => { const g = G[gi]; return `<div class="st-karte ${g ? '' : 'frei'}" style="--c:${g?.farbe || '#c7c7cc'}">
          <div class="st-nr">${i + 1}</div><div class="st-name">${esc(sn)}</div>
          ${g ? `<div class="st-gruppe"><span>${g.emoji}</span>${esc(g.name)}</div>${g.kids ? `<div class="st-kids">${g.kids.map(esc).join(' · ')}</div>` : ''}` : '<div class="st-gruppe muted">– frei –</div>'}</div>`; };
      let inhalt;
      if (R.phase === 'aus') inhalt = `<div class="st-plan"><h2>Ablauf</h2><table class="tbl"><thead><tr><th>Runde</th>${S.map((s, i) => `<th>${i + 1}. ${esc(s)}</th>`).join('')}</tr></thead>
          <tbody>${S.map((_, r) => `<tr><td><b>${r + 1}</b></td>${belegt(r).map(gi => `<td>${G[gi] ? `${G[gi].emoji} ${esc(G[gi].name)}` : '<span class="muted">–</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table>
          <button class="btn primary huge" id="sStart" ${S.length < 2 ? 'disabled' : ''}>▶ Stationenbetrieb starten</button></div>`;
      else if (R.phase === 'fertig') inhalt = `<div class="st-fertig">🎉<h2>Alle Stationen geschafft!</h2><button class="btn primary" id="sNeu">Zurück zum Plan</button></div>`;
      else if (R.phase === 'wechsel') inhalt = `<div class="st-wechsel"><div class="st-wtitel">🔄 Wechseln!</div>
          <div class="st-wlist">${G.slice(0, S.length).map((g, gi) => `<div style="--c:${g.farbe}"><span>${g.emoji} ${esc(g.name)}</span><b>${esc(S[station(gi, R.runde - 1)])}</b><i>→</i><b>${esc(S[station(gi, R.runde)])}</b></div>`).join('')}</div></div>`;
      else inhalt = `<div class="st-grid">${belegt(R.runde).map((gi, i) => karte(S[i], gi, i)).join('')}</div>`;
      $('sStage').innerHTML = `<button class="auf-fs" id="sFs" title="Vollbild">⛶</button>
        ${lauf ? `<div class="st-kopf"><div class="st-runde">${R.phase === 'wechsel' ? `Gleich Runde ${R.runde + 1}` : `Runde ${R.runde + 1}`} <span>von ${S.length}</span></div>
          <div class="st-zeit ${R.phase}" id="sZeit">${mmss(Math.ceil(rest))}</div>
          <div class="auf-bar"><i id="sBar" style="width:${rest / gesamt * 100}%"></i></div>
          <div class="st-tk"><button class="btn" id="sPause">${R.pause ? '▶ Weiter' : '⏸ Pause'}</button><button class="btn" id="sPlus">+1 min</button><button class="btn" id="sSkip">⏭ ${R.phase === 'wechsel' ? 'Los geht’s' : 'Wechseln'}</button><button class="btn danger" id="sStop">⏹</button></div></div>` : ''}
        ${inhalt}`;
    };
    const phase = (p, runde = R.runde) => {
      R.phase = p; R.runde = runde; R.pause = false;
      const dauer = p === 'wechsel' ? ST.wechsel : ST.minuten * 60;
      R.ende = Date.now() / 1000 + dauer;
      if (p === 'arbeit') sound.tada();
      buehne(); seite();
    };
    const weiter = () => {
      const S = stationen();
      if (R.phase === 'arbeit') {
        sound.gong();
        if (R.runde + 1 >= S.length) { R.phase = 'fertig'; confetti(); buehne(); seite(); return; }
        if (ST.wechsel > 0) phase('wechsel', R.runde + 1); else phase('arbeit', R.runde + 1);
      } else if (R.phase === 'wechsel') phase('arbeit');
    };
    clearInterval(mod._iv);
    mod._iv = setInterval(() => {
      if (!['arbeit', 'wechsel'].includes(R.phase) || R.pause) return;
      const rest = Math.max(0, R.ende - Date.now() / 1000), z = $('sZeit'), b = $('sBar');
      if (!z) return;
      z.textContent = mmss(Math.ceil(rest)); z.classList.toggle('knapp', rest <= 30);
      b.style.width = rest / (R.phase === 'wechsel' ? ST.wechsel : ST.minuten * 60) * 100 + '%';
      if (R.phase === 'wechsel' && rest <= 3 && rest > 0 && Math.ceil(rest) !== R._t) { R._t = Math.ceil(rest); tone(900, 0.1, 'sine', 0.15); }
      if (rest <= 0) weiter();
    }, 250);

    el.addEventListener('click', e => {
      const t = e.target;
      const gs = t.closest('[data-gstep]'); if (gs) { ST.gruppen = Math.max(1, Math.min(10, ST.gruppen + +gs.dataset.gstep)); save(); seite(); buehne(); return; }
      if (t.id === 'sGrHol') { R.gruppen = gruppenAlsTeams(ausGruppen(), true); seite(); buehne(); return; }
      if (t.id === 'sGrWeg') { R.gruppen = null; seite(); buehne(); return; }
      if (t.id === 'sStart') { if (gruppen().length > stationen().length) return toast('Mehr Gruppen als Stationen – bitte Stationen ergänzen'); phase('arbeit', 0); return; }
      if (t.id === 'sPause') { if (R.pause) { R.ende = Date.now() / 1000 + R.rest; R.pause = false; } else { R.rest = Math.max(0, R.ende - Date.now() / 1000); R.pause = true; } buehne(); return; }
      if (t.id === 'sPlus') { if (R.pause) R.rest += 60; else R.ende += 60; buehne(); return; }
      if (t.id === 'sSkip') { weiter(); return; }
      if (t.id === 'sStop') { if (confirm('Stationenbetrieb beenden?')) { R.phase = 'aus'; buehne(); seite(); } return; }
      if (t.id === 'sNeu') { R.phase = 'aus'; buehne(); seite(); return; }
      if (t.closest('#sFs')) { const st = $('sStage'); document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.(); }
    });
    el.addEventListener('input', e => { if (e.target.id === 'sListe') { ST.liste = e.target.value; save(); buehne(); } });
    el.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'sMin') ST.minuten = Math.max(1, Math.min(90, +t.value || 10));
      else if (t.id === 'sWech') ST.wechsel = Math.max(0, Math.min(300, +t.value || 0));
      else if (t.id === 'sNamen') ST.namen = t.value;
      else if (t.id === 'sListe') { seite(); return; }
      else return;
      save(); seite(); buehne();
    });
    seite(); buehne();
  },
  destroy() { clearInterval(this._iv); },
});
