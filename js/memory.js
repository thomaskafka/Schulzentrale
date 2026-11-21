'use strict';
/* ===== Memory am Beamer: Paare finden (Begriff ↔ Erklärung, Land ↔ Hauptstadt …). Die Kinder rufen das Feld, die Lehrkraft klickt. ===== */

state.memory ||= { sets: [
  { id: uid(), titel: 'Hauptstädte Europas', paare: 'Österreich = Wien\nDeutschland = Berlin\nFrankreich = Paris\nItalien = Rom\nSpanien = Madrid\nUngarn = Budapest\nTschechien = Prag\nSchweiz = Bern' },
  { id: uid(), titel: 'Englisch: Tiere', paare: 'Hund = dog\nKatze = cat\nPferd = horse\nVogel = bird\nMaus = mouse\nKuh = cow\nSchwein = pig\nFisch = fish' },
], akt: null };
const MEM = state.memory;
const memPaare = set => set.paare.split('\n').map(z => z.split(/\s*=\s*|\s*:\s*/)).filter(p => p[0]?.trim() && p[1]?.trim()).map(([a, b]) => [a.trim(), b.trim()]).slice(0, 15);

registerModule({
  id: 'memory', title: 'Memory', icon: '🃏',
  render(el) {
    const mod = this;
    if (!MEM.sets.some(s => s.id === MEM.akt)) MEM.akt = MEM.sets[0]?.id;
    const set = () => MEM.sets.find(s => s.id === MEM.akt);
    el.innerHTML = `<div class="page mem">
      <div class="pagehead">${seitenTitel('memory', '#000', 'Memory')}
        <div class="row"><select id="mSet" class="auf-wahl"></select><button class="btn" id="mNeu">+ Neu</button><button class="btn" id="mEdit">✎ Paare bearbeiten</button></div></div>
      <div id="mBody"></div></div>`;
    const $ = id => el.querySelector('#' + id), body = $('mBody');
    const wahl = () => { $('mSet').innerHTML = MEM.sets.map(s => `<option value="${s.id}" ${s.id === MEM.akt ? 'selected' : ''}>${esc(s.titel)} (${memPaare(s).length} Paare)</option>`).join(''); };

    /* ----- Spiel ----- */
    const neuesSpiel = () => {
      const paare = memPaare(set());
      if (paare.length < 2) { mod._g = null; return editor(); }
      const teams = P.teams.length ? P.teams.map(t => ({ id: t.id, name: t.name, emoji: t.emoji, farbe: t.farbe, score: 0 })) : [{ id: 'a', name: 'Team A', emoji: '🔴', farbe: '#ff3b30', score: 0 }, { id: 'b', name: 'Team B', emoji: '🔵', farbe: '#007aff', score: 0 }];
      const karten = shuffle(paare.flatMap(([a, b], i) => [{ p: i, text: a, seite: 0 }, { p: i, text: b, seite: 1 }]));
      const start = Math.max(0, teams.findIndex(t => t.id === P.beginnt));
      mod._g = { set: MEM.akt, karten, offen: [], gefunden: {}, teams, dran: start, sperre: false, zuege: 0 };
      spiel();
    };
    const spalten = n => Math.min(8, Math.ceil(Math.sqrt(n * 1.7)));   // Breitbild: eher mehr Spalten, weniger Reihen
    const spiel = () => {
      const g = mod._g, sp = spalten(g.karten.length), alle = Object.keys(g.gefunden).length * 2 === g.karten.length;
      body.innerHTML = `<section class="mem-stage" id="mStage"><button class="auf-fs" id="mFs" title="Vollbild">⛶</button>
        <div class="ts-teams">${g.teams.map((t, i) => `<div class="ts-team ${i === g.dran && !alle ? 'dran' : ''}" style="--c:${t.farbe}"><span>${t.emoji}</span><b>${esc(t.name)}</b><em>${t.score}</em></div>`).join('')}</div>
        <div class="mem-grid" style="--sp:${sp};--rows:${Math.ceil(g.karten.length / sp)}">${g.karten.map((k, i) => {
          const auf = g.offen.includes(i) || g.gefunden[k.p] != null, team = g.teams[g.gefunden[k.p]];
          return `<button class="mem-karte ${auf ? 'auf' : ''} ${g.gefunden[k.p] != null ? 'weg' : ''}" data-k="${i}" style="${team ? `--t:${team.farbe}` : ''}">
            <span class="mem-rueck">${String.fromCharCode(65 + Math.floor(i / sp))}${i % sp + 1}</span>
            <span class="mem-vorne ${k.seite ? 'b' : 'a'}">${esc(k.text)}</span></button>`; }).join('')}</div>
        ${alle ? `<div class="mem-ende">🎉 Alle Paare gefunden in ${g.zuege} Zügen! <button class="btn primary" id="mNochmal">Nochmal</button>${P.teams.length ? '<button class="btn" id="mPunkte">🏆 Punkte in die Punktetafel</button>' : ''}</div>`
          : `<p class="muted small center">Die Kinder rufen ein Feld (z.B. „B3“) – du klickst darauf. Gefundene Paare zählen fürs Team, das gleich nochmal darf.</p>`}
      </section>`;
    };
    const klick = i => {
      const g = mod._g; if (!g || g.sperre || g.offen.includes(i) || g.gefunden[g.karten[i].p] != null) return;
      g.offen.push(i); tone(500, 0.06, 'triangle', 0.1);
      if (g.offen.length === 2) {
        g.zuege++;
        const [a, b] = g.offen.map(x => g.karten[x]);
        if (a.p === b.p) {
          g.gefunden[a.p] = g.dran; g.teams[g.dran].score++; g.offen = []; sound.tada();
          if (Object.keys(g.gefunden).length * 2 === g.karten.length) confetti();
        } else {
          g.sperre = true; tone(180, 0.3, 'sawtooth', 0.08);
          setTimeout(() => { g.offen = []; g.sperre = false; g.dran = (g.dran + 1) % g.teams.length; spiel(); }, 1800);
        }
      }
      spiel();
    };

    /* ----- Paare bearbeiten ----- */
    const editor = () => {
      const s = set();
      body.innerHTML = `<div class="split2"><section class="card"><h2>Paare</h2>
          <label class="f">Titel <input id="mTitel" value="${esc(s?.titel || '')}"></label>
          <textarea id="mPaare" rows="14" placeholder="Österreich = Wien\nDeutschland = Berlin">${esc(s?.paare || '')}</textarea>
          <p class="muted small">Ein Paar pro Zeile: <code>Begriff = Gegenstück</code> (auch <code>:</code> geht). 2 bis 15 Paare.</p>
          <div class="row"><button class="btn primary" id="mSpielen">▶ Spielen</button><button class="btn danger" id="mDel">Löschen</button></div></section>
        <section class="card"><h2>Ideen</h2><ul class="mem-ideen"><li>Begriff = Erklärung (Fachbegriffe)</li><li>Vokabel = Übersetzung</li><li>Land = Hauptstadt</li><li>Rechnung = Ergebnis</li><li>Nomen = Mehrzahl</li><li>Bundesland = Landeshauptstadt</li></ul></section></div>`;
    };

    el.addEventListener('click', e => {
      const t = e.target;
      const k = t.closest('[data-k]'); if (k) { klick(+k.dataset.k); return; }
      if (t.closest('#mFs')) { const st = $('mStage'); document.fullscreenElement ? document.exitFullscreen() : st?.requestFullscreen?.(); return; }
      if (t.id === 'mEdit') { mod._g = null; editor(); return; }
      if (t.id === 'mSpielen' || t.id === 'mNochmal') { neuesSpiel(); return; }
      if (t.id === 'mNeu') { const n = { id: uid(), titel: 'Neues Memory', paare: '' }; MEM.sets.push(n); MEM.akt = n.id; save(); wahl(); editor(); el.querySelector('#mTitel').select(); return; }
      if (t.id === 'mDel') { if (MEM.sets.length < 2) return toast('Das letzte Memory bleibt – einfach überschreiben'); if (!confirm('Dieses Memory löschen?')) return; MEM.sets = MEM.sets.filter(x => x !== set()); MEM.akt = MEM.sets[0].id; save(); wahl(); neuesSpiel(); return; }
      if (t.id === 'mPunkte') { mod._g.teams.forEach(x => { if (x.score && P.teams.some(p => p.id === x.id)) punkteAdd(x.id, x.score); }); toast('Punkte übertragen'); location.hash = '#/punkte'; }
    });
    el.addEventListener('input', e => {
      const s = set(); if (!s) return;
      if (e.target.id === 'mTitel') { s.titel = e.target.value; save(); wahl(); }
      if (e.target.id === 'mPaare') { s.paare = e.target.value; save(); wahl(); }
    });
    el.addEventListener('change', e => { if (e.target.id === 'mSet') { MEM.akt = e.target.value; save(); neuesSpiel(); } });
    wahl(); if (mod._g && mod._g.set === MEM.akt) spiel(); else neuesSpiel();
  },
});
