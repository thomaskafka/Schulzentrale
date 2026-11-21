'use strict';
/* ===== Zufällige Gruppen bilden ===== */

const TEAMS = [['🦊', 'Füchse'], ['🐻', 'Bären'], ['🦉', 'Eulen'], ['🐬', 'Delfine'], ['🦁', 'Löwen'], ['🐢', 'Schildkröten'],
  ['🐝', 'Bienen'], ['🦄', 'Einhörner'], ['🐧', 'Pinguine'], ['🐸', 'Frösche'], ['🦒', 'Giraffen'], ['🐙', 'Kraken'], ['🦔', 'Igel'], ['🐼', 'Pandas']];

/** Letzte Einteilung aus „Gruppen bilden“ (bleibt erhalten, solange die Schulzentrale offen ist) */
const letzteGruppen = () => { const g = Modules.gruppen?._last; return g && g.groups?.length ? g : null; };
/** Gruppen als Teams für andere Programme (Stationen, Wortspiele …) */
function gruppenAlsTeams(g = letzteGruppen(), mitKindern = false) {
  if (!g) return [];
  const k = klasse(g.kid), kn = k ? kurzNamen(schuelerVon(k)) : {};
  return g.groups.map((x, i) => ({ emoji: x.team?.[0] || '👥', name: x.team?.[1] || 'Gruppe ' + (i + 1), farbe: x.color || COLORS[i % COLORS.length], score: 0,
    ...(mitKindern ? { kids: x.kids.map(s => kn[s.id] || s.vorname) } : {}) }));
}

/** Gruppen als Punktetafel-/Quiz-Teams; die ausgeloste Startgruppe kommt zuerst (danach reihum) und wird gemerkt */
function gruppenInPunktetafel(g = letzteGruppen()) {
  const b = g.beginnt ?? 0, gr = g.groups.slice(0, MAX_TEAMS), reihe = [...gr.slice(b), ...gr.slice(0, b)];
  state.punkte.teams = reihe.map(x => ({ id: uid(), name: x.team[1], emoji: x.team[0], farbe: x.color, score: 0 }));
  state.punkte.stil = g.stil || 'tiere';
  state.punkte.beginnt = g.beginnt != null ? state.punkte.teams[0].id : null;
  save();
}
const beginntText = g => g?.beginnt != null ? ` – ${g.groups[g.beginnt].team[0]} ${g.groups[g.beginnt].team[1]} beginnt` : '';

registerModule({
  id: 'gruppen', title: 'Gruppen bilden', icon: '👥',
  render(el) {
    const mod = this;
    mod._cfg ||= { modus: 'groesse', zahl: 4, sprecher: true, namen: 'tiere' };
    const cfg = mod._cfg;

    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('personen', '#000', 'Gruppen bilden')}<div id="gKs"></div></div>
      <div class="side-layout">
        <aside class="card side">
          <div class="seg" id="gMode">
            <button data-m="groesse">Kinder pro Gruppe</button>
            <button data-m="anzahl">Anzahl Gruppen</button>
          </div>
          <div class="stepper"><button data-step="-1">−</button><span id="gZahl"></span><button data-step="1">+</button></div>
          <p class="muted small center" id="gInfo"></p>
          <label class="chk small">Gruppennamen <select id="gNamen">${Object.entries(TEAM_STILE).map(([k, s]) => `<option value="${k}" ${cfg.namen === k ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
          <label class="chk"><input type="checkbox" id="gSpr" ${cfg.sprecher ? 'checked' : ''}> ⭐ Gruppensprecher:in auslosen</label>
          <button class="btn primary big full" id="gGo">🎲 Gruppen bilden</button>
          <div id="gAnw"></div>
        </aside>
        <section id="gOut" class="gout"><div class="placeholder">👈 Einstellungen wählen und<br><b>„Gruppen bilden“</b> drücken</div></section>
      </div></div>`;

    const $ = id => el.querySelector('#' + id);
    const info = () => {
      const k = aktKlasse(); if (!k) return;
      const n = anwesende(k).length;
      $('gZahl').textContent = cfg.zahl;
      el.querySelectorAll('#gMode button').forEach(b => b.classList.toggle('on', b.dataset.m === cfg.modus));
      const g = gruppenAnzahl(n);
      $('gInfo').textContent = n ? `${n} Kinder → ${g} Gruppe${g > 1 ? 'n' : ''} à ${Math.floor(n / g)}${n % g ? '–' + Math.ceil(n / g) : ''}` : 'Niemand anwesend';
    };
    const gruppenAnzahl = n => Math.max(1, Math.min(n, cfg.modus === 'anzahl' ? cfg.zahl : Math.ceil(n / cfg.zahl)));
    const setupKlasse = () => {
      const k = aktKlasse(); if (!k) return;
      $('gAnw').innerHTML = '';
      $('gAnw').appendChild(anwesenheitWidget(k, info));
      info();
    };
    $('gKs').appendChild(klassenSelect(() => { mod._last = null; setupKlasse(); show(); }));

    const bilden = () => {
      const k = aktKlasse(); if (!k) return;
      const kids = shuffle(anwesende(k)); if (!kids.length) return;
      const g = gruppenAnzahl(kids.length);
      const groups = Array.from({ length: g }, () => ({ kids: [] }));
      kids.forEach((s, i) => groups[i % g].kids.push(s));
      if (cfg.sprecher) groups.forEach(gr => gr.sprecher = gr.kids[Math.floor(Math.random() * gr.kids.length)]?.id);
      mod._last = { kid: k.id, groups };
      benennen(); show(true); sound.tada();
    };
    /** Namen & Symbole aus der gewählten Kategorie vergeben (gleiche Kategorien wie in der Punktetafel) */
    const benennen = () => {
      if (!mod._last) return;
      const liste = TEAM_STILE[cfg.namen] ? TEAM_STILE[cfg.namen].liste() : TEAMS, teams = cfg.namen === 'nummern' ? liste : shuffle(liste);
      mod._last.groups.forEach((gr, i) => { const t = teams[i % teams.length]; gr.team = [t[0], t[1]]; gr.color = t[2] || COLORS[i % COLORS.length]; });
      mod._last.stil = cfg.namen;
    };
    /** Gebildete Gruppen als Teams in die Punktetafel übernehmen */
    const zurPunktetafel = (ziel = '#/punkte') => {
      const g = mod._last; if (!g) return;
      if (state.punkte.teams.some(t => t.score > 0) && !confirm('In der Punktetafel stehen noch Punkte. Durch die neuen Teams ersetzen (Punkte auf 0)?')) return;
      gruppenInPunktetafel(g);
      if (beginntText(g)) toast('⭐' + beginntText(g).slice(2));
      if (g.groups.length > MAX_TEAMS) toast(`Die Punktetafel hat höchstens ${MAX_TEAMS} Teams – die ersten ${MAX_TEAMS} wurden übernommen`);
      location.hash = ziel;
    };
    const zuStationen = () => {
      const R = (Modules.stationen._r ||= { phase: 'aus', runde: 0, ende: 0, rest: 0, pause: false, gruppen: null });
      if (['arbeit', 'wechsel'].includes(R.phase) && !confirm('Der Stationenbetrieb läuft gerade. Beenden und die neuen Gruppen übernehmen?')) return;
      R.phase = 'aus'; R.gruppen = gruppenAlsTeams(mod._last, true);
      const anzahl = state.stationen.liste.split('\n').filter(x => x.trim()).length;
      if (R.gruppen.length > anzahl) toast(`${R.gruppen.length} Gruppen, aber nur ${anzahl} Stationen – bitte Stationen ergänzen`);
      location.hash = '#/stationen';
    };
    const zuWortspielen = () => {
      const M = Modules.wortspiele, neu = () => ({ teams: gruppenAlsTeams(mod._last), dran: 0, laeuft: false, ende: 0, stapel: [], karte: null, modus: null, runde: { ok: 0, tabu: 0, skip: 0 }, verdeckt: false });
      M._ss = { tabu: neu(), activity: neu() }; M._ss.tabu.dran = M._ss.activity.dran = mod._last.beginnt ?? 0;
      if (beginntText(mod._last)) toast('⭐' + beginntText(mod._last).slice(2)); if (!['tabu', 'activity'].includes(M._tab)) M._tab = 'tabu';
      location.hash = '#/wortspiele';
    };
    /** Wer beginnt? – leuchtet reihum auf und bleibt bei einer Gruppe stehen */
    const werBeginnt = () => {
      const karten = [...el.querySelectorAll('.group-card')]; if (karten.length < 2 || mod._los) return;
      mod._los = true; mod._last.beginnt = null; karten.forEach(c => c.classList.remove('gewaehlt'));
      const ziel = Math.floor(Math.random() * karten.length), runden = karten.length * 3 + ziel; let i = 0;
      const schritt = () => {
        karten.forEach((c, j) => c.classList.toggle('blink', j === i % karten.length)); tone(500 + (i % karten.length) * 60, 0.05, 'square', 0.06);
        if (i >= runden) { karten[ziel].classList.remove('blink'); karten[ziel].classList.add('gewaehlt'); mod._last.beginnt = ziel; sound.tada(); mod._los = false; toast(`${mod._last.groups[ziel].team[0]} ${mod._last.groups[ziel].team[1]} beginnt!`); return; }
        i++; setTimeout(schritt, 60 + Math.pow(i / runden, 3) * 420);
      };
      schritt();
    };
    const show = (anim) => {
      const k = aktKlasse();
      if (!mod._last || !k || mod._last.kid !== k.id) return;
      const kn = kurzNamen(schuelerVon(k));
      $('gOut').innerHTML = `<div class="g-weiter"><span class="g-weiter-t">Weiter mit diesen Gruppen:</span>
          <button class="btn" data-gweiter="punkte">🏆 Punktetafel</button><button class="btn" data-gweiter="quiz">❓ Quiz</button>
          <button class="btn" data-gweiter="stationen">🔄 Stationenbetrieb</button><button class="btn" data-gweiter="wortspiele">🔤 Tabu & Activity</button>
          <button class="btn primary" data-gweiter="los">🎲 Wer beginnt?</button></div>
        <p class="muted small g-tipp">Namen ändern: links „Gruppennamen“ umstellen – die Einteilung bleibt gleich.</p>
        <div class="groups ${anim ? 'anim' : ''}">${mod._last.groups.map((g, i) => `
        <div class="group-card ${mod._last.beginnt === i ? 'gewaehlt' : ''}" style="--c:${g.color};--i:${i}">
          <div class="gc-head"><span class="gc-ic">${g.team[0]}</span>${g.team[1]}<span class="gc-n">${g.kids.length}</span></div>
          <ul>${g.kids.map((s, j) => `<li style="--j:${i * 0.15 + j * 0.08}s">${s.id === g.sprecher ? '⭐ ' : ''}${esc(kn[s.id])}</li>`).join('')}</ul>
        </div>`).join('')}</div>`;
    };

    el.addEventListener('click', e => {
      const m = e.target.closest('[data-m]'); if (m) { cfg.modus = m.dataset.m; info(); }
      const st = e.target.closest('[data-step]'); if (st) { cfg.zahl = Math.max(1, Math.min(15, cfg.zahl + +st.dataset.step)); info(); }
      if (e.target.id === 'gGo') bilden();
      const w = e.target.closest('[data-gweiter]');
      if (w) ({ punkte: () => zurPunktetafel(), quiz: () => zurPunktetafel('#/quiz'), stationen: zuStationen, wortspiele: zuWortspielen, los: werBeginnt })[w.dataset.gweiter]();
    });
    $('gSpr').addEventListener('change', e => cfg.sprecher = e.target.checked);
    $('gNamen').addEventListener('change', e => { cfg.namen = e.target.value; if (mod._last) { benennen(); show(); } });

    setupKlasse(); show();
  },
});
