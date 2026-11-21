'use strict';
/* ===== Quiz: Klassisch, Millionenshow-Stil, Jeopardy-Stil ===== */

const QFARBEN = [['#e21b3c', '▲'], ['#1368ce', '◆'], ['#d89e00', '●'], ['#26890c', '■']];
const LEITER = [50, 100, 200, 300, 500, 1000, 2000, 4000, 8000, 15000, 30000, 75000, 150000, 300000, 1000000];
const SICHER = [500, 15000];
const euro = n => '€ ' + n.toLocaleString('de-AT');

state.quizze ||= [];
if (!state._quizDemo) {
  const q = (kat, punkte, frage, antworten, richtig) => ({ id: uid(), typ: 'mc', kat, punkte, frage, antworten, richtig });
  state.quizze.push({ id: uid(), titel: 'Beispiel-Quiz: Allgemeinwissen', fragen: [
    q('Österreich', 100, 'Wie heißt die Hauptstadt von Österreich?', ['Graz', 'Wien', 'Linz', 'Salzburg'], 1),
    q('Tiere', 100, 'Wie viele Beine hat eine Spinne?', ['6', '8', '10', '4'], 1),
    q('Mathe', 100, 'Was ist 7 · 8?', ['54', '56', '58', '64'], 1),
    q('Englisch', 100, 'Was heißt „Hund“ auf Englisch?', ['cat', 'dog', 'bird', 'horse'], 1),
    q('Natur', 100, 'Bei wie viel Grad Celsius gefriert Wasser?', ['10 °C', '4 °C', '0 °C', '−10 °C'], 2),
    q('Österreich', 200, 'Wie viele Bundesländer hat Österreich?', ['7', '8', '9', '10'], 2),
    q('Tiere', 200, 'Welches dieser Tiere ist ein Säugetier?', ['Hai', 'Delfin', 'Pinguin', 'Krokodil'], 1),
    q('Mathe', 200, 'Wie viele Ecken hat ein Würfel?', ['6', '8', '12', '4'], 1),
    q('Englisch', 200, 'Was ist die Mehrzahl von „child“?', ['childs', 'children', 'childes', 'childen'], 1),
    q('Natur', 200, 'Welcher Planet ist der Sonne am nächsten?', ['Venus', 'Mars', 'Merkur', 'Erde'], 2),
    q('Österreich', 300, 'Welcher Fluss fließt durch Wien?', ['Inn', 'Mur', 'Donau', 'Enns'], 2),
    q('Tiere', 300, 'Wie nennt man ein junges Pferd?', ['Kalb', 'Fohlen', 'Lamm', 'Ferkel'], 1),
    q('Mathe', 300, 'Was ist die Hälfte von ¾?', ['⅜', '¼', '³⁄₂', '½'], 0),
    q('Englisch', 300, 'Was bedeutet „library“?', ['Libelle', 'Bücherei', 'Labor', 'Lieferung'], 1),
    q('Natur', 300, 'Wie heißt der höchste Berg Österreichs?', ['Dachstein', 'Wildspitze', 'Zugspitze', 'Großglockner'], 3),
  ] });
  state._quizDemo = true; save();
}

registerModule({
  id: 'quiz', title: 'Quiz', icon: '❓',
  render(el) {
    const mod = this;
    let body;
    const neu = () => { el.innerHTML = '<div class="page" id="qPage"></div>'; body = el.querySelector('#qPage'); mod.destroy(); };
    const quiz = id => state.quizze.find(q => q.id === id);

    /* ---------- Übersicht ---------- */
    const liste = () => {
      neu(); mod._geheim = null;
      body.innerHTML = `<div class="pagehead">${seitenTitel('frage', '#000', 'Quiz')}
        <div class="row"><a class="btn" href="#/quizgen">✨ Fragen erstellen lassen</a><button class="btn primary" id="qNew">+ Neues Quiz</button>
        <label class="btn">CSV importieren<input type="file" id="qCsv" accept=".csv,.txt" hidden></label></div></div>
        <div class="qliste">${state.quizze.map(q => { const kats = [...new Set(q.fragen.map(f => f.kat).filter(Boolean))].length; return `<div class="qzeile" data-q="${q.id}">
          <span class="kachel-ic">${ico('frage', null, 26)}</span>
          <div class="qz-txt"><b>${esc(q.titel)}</b><small>${q.fragen.length} Frage${q.fragen.length === 1 ? '' : 'n'}${kats ? ` · ${kats} Kategorie${kats === 1 ? '' : 'n'}` : ''}</small></div>
          <div class="qz-start"><span class="qz-label">Spielen als</span>
            <button class="qz-modus" data-play="klassisch" title="Fragen nacheinander, Teams sammeln Punkte">${ico('ziel', null, 18)}Klassisch</button>
            <button class="qz-modus" data-play="million" title="Wer wird Millionär – mit Jokern">${ico('muenze', null, 18)}Millionenshow</button>
            <button class="qz-modus" data-play="jeopardy" title="Kategorien-Tafel mit Punktwerten">${ico('gitter', null, 18)}Jeopardy</button>
            <button class="qz-modus" data-play="eins23" title="Kinder laufen zum Antwortfeld – dann geht das Licht an">${ico('personen', null, 18)}1, 2 oder 3</button>
            <button class="qz-modus" data-play="blitz" title="Ein Team, eine Minute, so viele Fragen wie möglich">${ico('sanduhr', null, 18)}Blitzrunde</button>
            <button class="qz-modus" data-play="kartoffel" title="Gegenstand weitergeben, bis es knallt">${ico('flamme', null, 18)}Heiße Kartoffel</button>
            <button class="qz-modus" data-play="vierGewinnt" title="Zwei Teams – richtige Antwort = Stein einwerfen">${ico('vier', null, 18)}Vier gewinnt</button>
            <button class="qz-modus" data-play="rennen" title="Alle Teams antworten – wer recht hat, fährt vor">${ico('flagge', null, 18)}Quiz-Rennen</button></div>
          <div class="qz-aktion"><button class="qz-ic" data-edit title="Bearbeiten">✎</button><button class="qz-ic" data-dup title="Kopieren">⧉</button><button class="qz-ic qz-del" data-del title="Löschen">🗑</button></div>
        </div>`; }).join('') || '<div class="placeholder" style="height:30vh">Noch kein Quiz – oben „+ Neues Quiz“ oder eine CSV-Datei importieren.</div>'}</div>
        <details class="qz-hilfe"><summary>So sieht eine CSV-Datei zum Importieren aus</summary>
          <p><code>Frage;A;B;C;D;Richtig (A–D);Kategorie;Punkte</code> – eine Frage pro Zeile.
          Für Jeopardy Kategorie und Punkte (100–500) angeben. Für die Millionenshow werden die Fragen nach Punkten (= Schwierigkeit) sortiert.</p></details>`;
      body.onclick = e => {
        const c = e.target.closest('[data-q]'), q = c && quiz(c.dataset.q);
        if (e.target.id === 'qNew') { const n = { id: uid(), titel: 'Neues Quiz', fragen: [] }; state.quizze.push(n); save(); editor(n); }
        if (!q) return;
        const pl = e.target.closest('[data-play]');
        if (pl) {
          const mc = q.fragen.filter(f => f.frage);
          if (!mc.length) return toast('Dieses Quiz hat noch keine Fragen');
          ({ klassisch, million, jeopardy, eins23, blitz, kartoffel, vierGewinnt, rennen })[pl.dataset.play](q);
        }
        if (e.target.closest('[data-edit]')) editor(q);
        if (e.target.closest('[data-dup]')) { state.quizze.push({ ...JSON.parse(JSON.stringify(q)), id: uid(), titel: q.titel + ' (Kopie)' }); save(); liste(); }
        if (e.target.closest('[data-del]') && confirm(`Quiz „${q.titel}“ löschen?`)) { state.quizze = state.quizze.filter(x => x !== q); save(); liste(); }
      };
      body.onchange = async e => {
        if (e.target.id !== 'qCsv' || !e.target.files[0]) return;
        const f = e.target.files[0], text = await leseListenDatei(f);
        const fragen = text.split(/\r?\n/).map(l => l.split(l.includes(';') ? ';' : '\t').map(x => x.trim().replace(/^"|"$/g, ''))).filter(c => c[0] && !/^frage$/i.test(c[0])).map(c => {
          const ant = c.slice(1, 5).filter(Boolean), r = 'ABCD'.indexOf((c[5] || 'A').toUpperCase());
          return { id: uid(), typ: ant.length >= 2 ? 'mc' : 'offen', frage: c[0], antworten: ant.length ? ant : [''], richtig: Math.max(0, r), kat: c[6] || '', punkte: +c[7] || 100 };
        });
        if (!fragen.length) return toast('Keine Fragen gefunden');
        state.quizze.push({ id: uid(), titel: f.name.replace(/\.[^.]+$/, ''), fragen }); save(); liste(); toast(`${fragen.length} Fragen importiert`);
      };
    };

    /* ---------- Editor ---------- */
    const editor = q => {
      neu();
      const draw = () => {
        const kats = [...new Set(q.fragen.map(f => f.kat).filter(Boolean))];
        body.innerHTML = `<div class="pagehead"><div class="row"><button class="btn" id="qBack">← Zurück</button><input class="kname" id="qTitel" value="${esc(q.titel)}"></div>
          <button class="btn primary" id="qAddF">+ Frage</button></div>
          <datalist id="qKats">${kats.map(k => `<option value="${esc(k)}">`).join('')}</datalist>
          <div class="qedit">${q.fragen.map((f, i) => `<div class="card qf" data-i="${i}">
            <div class="row between"><b>Frage ${i + 1}</b><div class="row">
              <select data-k="typ"><option value="mc" ${f.typ === 'mc' ? 'selected' : ''}>Multiple Choice</option><option value="tf" ${f.typ === 'tf' ? 'selected' : ''}>Wahr / Falsch</option><option value="offen" ${f.typ === 'offen' ? 'selected' : ''}>Offene Frage</option></select>
              <input data-k="kat" list="qKats" placeholder="Kategorie" value="${esc(f.kat || '')}" class="qkat">
              <select data-k="punkte">${[100, 200, 300, 400, 500].map(p => `<option ${+f.punkte === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
              <button class="btn small" data-up title="Nach oben">↑</button><button class="x" data-delf title="Löschen">×</button></div></div>
            <textarea data-k="frage" rows="2" placeholder="Frage …">${esc(f.frage)}</textarea>
            <div class="qans">${f.typ === 'tf' ? ['Wahr', 'Falsch'].map((a, j) => `<label class="qa"><input type="radio" name="r${f.id}" data-r="${j}" ${f.richtig === j ? 'checked' : ''}> ${a}</label>`).join('')
              : f.typ === 'offen' ? `<label class="qa wide">Lösung: <input data-a="0" value="${esc(f.antworten[0] || '')}"></label>`
              : [0, 1, 2, 3].map(j => `<label class="qa" style="--c:${QFARBEN[j][0]}"><input type="radio" name="r${f.id}" data-r="${j}" ${f.richtig === j ? 'checked' : ''} title="Richtige Antwort"><b>${'ABCD'[j]}</b><input data-a="${j}" value="${esc(f.antworten[j] || '')}" placeholder="Antwort ${'ABCD'[j]}"></label>`).join('')}</div>
          </div>`).join('') || '<p class="muted">Noch keine Fragen – oben „+ Frage“.</p>'}</div>
          <p class="muted small">🔘 = richtige Antwort. Kategorie + Punkte werden für Jeopardy verwendet, die Punkte auch als Schwierigkeit für die Millionenshow.</p>`;
      };
      draw();
      body.onclick = e => {
        if (e.target.id === 'qBack') return liste();
        if (e.target.id === 'qAddF') { const last = q.fragen[q.fragen.length - 1]; q.fragen.push({ id: uid(), typ: 'mc', frage: '', antworten: ['', '', '', ''], richtig: 0, kat: last?.kat || '', punkte: 100 }); save(); draw(); body.querySelector('.qf:last-child textarea')?.focus(); }
        const card = e.target.closest('.qf'); if (!card) return;
        const i = +card.dataset.i;
        if (e.target.closest('[data-delf]') && confirm('Frage löschen?')) { q.fragen.splice(i, 1); save(); draw(); }
        if (e.target.closest('[data-up]') && i > 0) { [q.fragen[i - 1], q.fragen[i]] = [q.fragen[i], q.fragen[i - 1]]; save(); draw(); }
      };
      body.oninput = e => {
        if (e.target.id === 'qTitel') { q.titel = e.target.value; save(); return; }
        const card = e.target.closest('.qf'); if (!card) return;
        const f = q.fragen[+card.dataset.i], d = e.target.dataset;
        if (d.k === 'frage' || d.k === 'kat') f[d.k] = e.target.value;
        if (d.a !== undefined) f.antworten[+d.a] = e.target.value;
        save();
      };
      body.onchange = e => {
        const card = e.target.closest('.qf'); if (!card) return;
        const f = q.fragen[+card.dataset.i], d = e.target.dataset;
        if (d.r !== undefined) f.richtig = +d.r;
        if (d.k === 'punkte') f.punkte = +e.target.value;
        if (d.k === 'typ') { f.typ = e.target.value; if (f.typ === 'mc') while (f.antworten.length < 4) f.antworten.push(''); f.richtig = 0; draw(); }
        save();
      };
    };

    /* Antworten einer Frage für die Anzeige */
    const antworten = f => f.typ === 'tf' ? ['Wahr', 'Falsch'] : f.typ === 'offen' ? [] : f.antworten.map((a, j) => ({ a, j })).filter(x => x.a).map(x => x.a);
    const richtigIdx = f => { if (f.typ !== 'mc') return f.richtig; const vis = f.antworten.map((a, j) => a ? j : -1).filter(j => j >= 0); return vis.indexOf(f.richtig); };
    /** Lösung der aktuellen Frage – nur fürs Handy der Lehrkraft */
    const geheim = f => { mod._geheim = f ? { frage: f.frage, loesung: f.typ === 'offen' ? (f.antworten[0] || '') : antworten(f)[richtigIdx(f)] } : null; };
    const teamBtns = (wert = 1) => P.teams.map(t => `<button class="qteam" data-team="${t.id}" data-wert="${wert}" style="--c:${t.farbe}">${t.id === P.beginnt ? '⭐ ' : ''}${t.emoji} ${esc(t.name)} <b>+${wert}</b> <small class="muted">(${t.score}/${P.ziel})</small></button>`).join('');

    /* ---------- Klassisch ---------- */
    const klassisch = q => {
      neu();
      let fragen = q.fragen.filter(f => f.frage), i = 0, zeit = mod._zeit ?? 20, t0 = 0, aufgeloest = false;
      body.innerHTML = `<div class="qplay qk card">
        <div class="row between qtop"><button class="btn" id="qEnd">✕ Beenden</button><span id="qNum" class="qnum"></span>
          <label class="chk small">⏱ <select id="qZeit">${[0, 10, 20, 30, 60].map(s => `<option value="${s}" ${s === zeit ? 'selected' : ''}>${s ? s + ' s' : 'ohne Zeit'}</option>`).join('')}</select></label>
          <label class="chk small"><input type="checkbox" id="qMix"> mischen</label></div>
        <div class="qbar"><i id="qBar"></i></div>
        <div class="qfrage" id="qFrage"></div>
        <div class="qtiles" id="qTiles"></div>
        <div class="qfoot" id="qFoot"></div></div>`;
      const $ = id => body.querySelector('#' + id);
      const show = () => {
        const f = fragen[i]; aufgeloest = false; t0 = performance.now(); geheim(f);
        $('qNum').textContent = `Frage ${i + 1} / ${fragen.length}${f.kat ? ' · ' + f.kat : ''}`;
        $('qFrage').textContent = f.frage;
        const ant = antworten(f);
        $('qTiles').className = 'qtiles n' + (ant.length || 1);
        $('qTiles').innerHTML = f.typ === 'offen' ? `<div class="qopen" id="qOpen">?</div>`
          : ant.map((a, j) => `<div class="qtile" style="--c:${QFARBEN[j][0]}"><span>${f.typ === 'tf' ? (j ? '✗' : '✓') : QFARBEN[j][1]}</span>${esc(a)}</div>`).join('');
        $('qFoot').innerHTML = `<button class="btn primary big" id="qReveal">Auflösen</button>`;
      };
      const reveal = () => {
        if (aufgeloest) return; aufgeloest = true;
        const f = fragen[i], r = richtigIdx(f);
        if (f.typ === 'offen') $('qOpen').textContent = f.antworten[0] || '–';
        body.querySelectorAll('.qtile').forEach((t, j) => t.classList.add(j === r ? 'right' : 'wrong'));
        sound.tada();
        $('qFoot').innerHTML = `<div class="qteams"><span class="muted">Punkte an:</span>${teamBtns(1)}</div>
          <button class="btn primary big" id="qNext">${i + 1 < fragen.length ? 'Weiter →' : '🏁 Fertig'}</button>`;
      };
      const tick = now => {
        if (zeit && !aufgeloest) {
          const p = Math.min(1, (now - t0) / (zeit * 1000));
          $('qBar').style.width = (100 - p * 100) + '%';
          if (p >= 1) { sound.gong(); reveal(); }
        } else if (!zeit) $('qBar').style.width = '0';
        mod._raf = requestAnimationFrame(tick);
      };
      body.onclick = e => {
        if (e.target.id === 'qEnd') return liste();
        if (e.target.id === 'qReveal') reveal();
        const tb = e.target.closest('[data-team]'); if (tb) { audio(); punkteAdd(tb.dataset.team, +tb.dataset.wert); tb.classList.add('given');
          const tt = P.teams.find(x => x.id === tb.dataset.team); tb.querySelector('small').textContent = `(${tt.score}/${P.ziel})`; }
        if (e.target.id === 'qNext') {
          if (++i < fragen.length) show();
          else { confetti(); body.querySelector('.qplay').innerHTML = `<div class="qdone"><div class="pb-big">🏁</div><h2>Geschafft!</h2>
            <div class="row center"><a class="btn primary big" href="#/punkte">🏆 Zur Punktetafel</a><button class="btn big" id="qEnd">Zurück zur Übersicht</button></div></div>`; }
        }
      };
      body.onchange = e => {
        if (e.target.id === 'qZeit') { zeit = mod._zeit = +e.target.value; t0 = performance.now(); }
        if (e.target.id === 'qMix') { fragen = e.target.checked ? shuffle(fragen) : q.fragen.filter(f => f.frage); i = 0; show(); }
      };
      audio(); show(); mod._raf = requestAnimationFrame(tick);
    };

    /* gemeinsame Teams für Vier gewinnt & Rennen: Teams der Punktetafel, sonst zwei Standard-Teams */
    const spielTeams = (max = 10) => (P.teams.length >= 2 ? P.teams.slice(0, max) : [{ id: 'rot', name: 'Team Rot', emoji: '🔴', farbe: '#ef4444' }, { id: 'gelb', name: 'Team Gelb', emoji: '🟡', farbe: '#eab308' }])
      .map(t => ({ id: t.id, name: t.name, emoji: t.emoji, farbe: t.farbe || '#3b82f6', punkte: 0 }));
    const fragenStapel = q => { let st = []; return () => { if (!st.length) st = shuffle(q.fragen.filter(f => f.frage)); const f = st.pop(); geheim(f); return f; }; };
    const frageHtml = (f, loes) => { const ant = antworten(f), r = richtigIdx(f);
      return `<div class="vg-frage">${esc(f.frage)}</div>${ant.length ? `<div class="vg-ant">${ant.map((a, j) => `<span class="${loes ? (j === r ? 'richtig' : 'falsch') : ''}" style="--c:${QFARBEN[j]?.[0] || '#888'}"><i>${f.typ === 'tf' ? (j ? '✗' : '✓') : QFARBEN[j]?.[1] || ''}</i>${esc(a)}</span>`).join('')}</div>`
        : `<div class="vg-ant offen">${loes ? `<span class="richtig">${esc(f.antworten[0] || '–')}</span>` : '<span>❓ offene Frage</span>'}</div>`}`; };
    const inPunktetafel = teams => { teams.forEach(t => { if (t.punkte && P.teams.some(p => p.id === t.id)) { const p = P.teams.find(x => x.id === t.id); p.score += t.punkte; } }); save(); toast('In die Punktetafel übertragen'); };

    /* ---------- Vier gewinnt: richtige Antwort → Stein einwerfen ---------- */
    const vierGewinnt = q => {
      neu();
      if (!q.fragen.some(f => f.frage)) { toast('Dieses Quiz hat noch keine Fragen'); return liste(); }
      const SP = 7, RE = 6, naechste = fragenStapel(q);
      const teams = (P.teams.length >= 2 ? spielTeams(2) : spielTeams(2));
      // zwei gut unterscheidbare Farben erzwingen
      const farbton = hex => { const [r, g2, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), d = mx - mn;
        if (!d) return -999; const h = mx === r ? ((g2 - b) / d) % 6 : mx === g2 ? (b - r) / d + 2 : (r - g2) / d + 4; return (h * 60 + 360) % 360; };
      const abstand = Math.abs(farbton(teams[0].farbe) - farbton(teams[1].farbe)), naheFarben = Math.min(abstand, 360 - abstand) < 60;
      // ähnliche Farben (oder blau wie das Brett) → klassisch Rot & Gelb
      if (naheFarben || [0, 1].some(i => { const h = farbton(teams[i].farbe); return h > 200 && h < 250; })) { teams[0].farbe = '#ef4444'; teams[1].farbe = '#facc15'; }
      const g = { brett: Array.from({ length: RE }, () => Array(SP).fill(-1)), dran: Math.max(0, teams.findIndex(t => t.id === P.beginnt)), phase: 'frage', f: naechste(), gewinn: null, zuletzt: null };
      body.innerHTML = `<div class="qplay vg card"><div class="row between qtop"><button class="btn" id="qEnd">✕ Beenden</button><span class="qnum">Vier gewinnt</span><button class="auf-fs" id="vgFs" style="position:static" title="Vollbild">⛶</button></div>
        <div class="vg-layout"><div class="vg-brett-wrap"><div class="vg-pfeile" id="vgPfeile"></div><div class="vg-brett" id="vgBrett"></div></div><aside class="vg-seite" id="vgSeite"></aside></div></div>`;
      const $ = id => body.querySelector('#' + id);
      const frei = c => { for (let r = RE - 1; r >= 0; r--) if (g.brett[r][c] < 0) return r; return -1; };
      const pruefen = (r, c) => {
        const t = g.brett[r][c];
        for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          const linie = [[r, c]];
          for (const s of [1, -1]) for (let i = 1; i < 4; i++) { const rr = r + dr * i * s, cc = c + dc * i * s; if (rr < 0 || rr >= RE || cc < 0 || cc >= SP || g.brett[rr][cc] !== t) break; linie.push([rr, cc]); }
          if (linie.length >= 4) return linie;
        }
        return null;
      };
      const zeichneBrett = () => {
        const waehlen = g.phase === 'spalte';
        $('vgPfeile').innerHTML = Array.from({ length: SP }, (_, c) => `<button data-vgsp="${c}" ${waehlen && frei(c) >= 0 ? '' : 'disabled'} style="--t:${teams[g.dran].farbe}">▼</button>`).join('');
        $('vgBrett').innerHTML = g.brett.map((zeile, r) => zeile.map((t, c) => {
          const neu2 = g.zuletzt && g.zuletzt[0] === r && g.zuletzt[1] === c, sieg = g.gewinn?.some(([a, b]) => a === r && b === c);
          return `<div class="vg-loch" data-vgsp="${c}">${t >= 0 ? `<i class="vg-stein ${neu2 ? 'faellt' : ''} ${sieg ? 'sieg' : ''}" style="--t:${teams[t].farbe};--r:${r + 1}"></i>` : ''}</div>`; }).join('')).join('');
        $('vgBrett').classList.toggle('waehlen', waehlen);
      };
      const seite = () => {
        const t = teams[g.dran];
        const kopf = `<div class="vg-teams">${teams.map((x, i) => `<div class="vg-team ${i === g.dran && !g.gewinn ? 'dran' : ''}" style="--t:${x.farbe}"><i></i><b>${x.emoji} ${esc(x.name)}</b></div>`).join('')}</div>`;
        let inhalt;
        if (g.gewinn != null && g.sieger != null) inhalt = `<div class="vg-ende" style="--t:${teams[g.sieger].farbe}"><div class="pb-big">🏆</div><h2>${teams[g.sieger].emoji} ${esc(teams[g.sieger].name)} gewinnt!</h2><button class="btn primary big" id="vgNochmal">Neues Spiel</button></div>`;
        else if (g.phase === 'voll') inhalt = `<div class="vg-ende"><div class="pb-big">🤝</div><h2>Unentschieden!</h2><button class="btn primary big" id="vgNochmal">Neues Spiel</button></div>`;
        else if (g.phase === 'spalte') inhalt = `<div class="vg-hinweis" style="--t:${t.farbe}">✅ Richtig!<br><b>${t.emoji} ${esc(t.name)}</b> wählt eine Spalte</div><p class="muted small center">Auf eine Spalte oder einen ▼-Pfeil klicken.</p>`;
        else inhalt = `<div class="vg-dran" style="--t:${t.farbe}">${t.emoji} ${esc(t.name)} ist dran</div>${frageHtml(g.f, g.phase === 'aufgeloest')}
          <div class="vg-knoepfe">${g.phase === 'frage' ? '<button class="btn" id="vgLoes">Lösung zeigen</button>' : ''}<button class="btn ok big" id="vgRichtig">✓ Richtig</button><button class="btn nein big" id="vgFalsch">✗ Falsch</button></div>`;
        $('vgSeite').innerHTML = kopf + inhalt;
      };
      const alles = () => { zeichneBrett(); seite(); };
      const einwerfen = c => {
        const r = frei(c); if (g.phase !== 'spalte' || r < 0) return;
        g.brett[r][c] = g.dran; g.zuletzt = [r, c];
        tone(600 - r * 40, 0.08, 'triangle', 0.15); setTimeout(() => tone(180, 0.12, 'square', 0.08), 330 + r * 40);
        const linie = pruefen(r, c);
        if (linie) { g.gewinn = linie; g.sieger = g.dran; g.phase = 'ende'; teams[g.dran].punkte++; setTimeout(() => { winSound(); confetti(160); }, 500); }
        else if (g.brett[0].every(x => x >= 0)) g.phase = 'voll';
        else { g.dran = (g.dran + 1) % teams.length; g.f = naechste(); g.phase = 'frage'; }
        alles();
      };
      body.onclick = e => {
        const t = e.target;
        if (t.id === 'qEnd') return liste();
        if (t.closest('#vgFs')) { const st = body.querySelector('.vg'); document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.(); return; }
        if (t.id === 'vgLoes') { g.phase = 'aufgeloest'; seite(); return; }
        if (t.id === 'vgRichtig') { sound.tada(); g.phase = 'spalte'; alles(); return; }
        if (t.id === 'vgFalsch') { tone(150, 0.35, 'sawtooth', 0.12); g.dran = (g.dran + 1) % teams.length; g.f = naechste(); g.phase = 'frage'; alles(); return; }
        const sp = t.closest('[data-vgsp]'); if (sp && g.phase === 'spalte') { einwerfen(+sp.dataset.vgsp); return; }
        if (t.id === 'vgNochmal') { g.brett = Array.from({ length: RE }, () => Array(SP).fill(-1)); g.gewinn = null; g.sieger = null; g.zuletzt = null; g.dran = (g.dran + 1) % teams.length; g.f = naechste(); g.phase = 'frage'; alles(); }
      };
      audio(); alles();
    };

    /* ---------- Quiz-Rennen: jede richtige Antwort bringt das Team auf der Strecke nach vorne ---------- */
    const rennen = q => {
      neu();
      const fragen = q.fragen.filter(f => f.frage);
      if (!fragen.length) { toast('Dieses Quiz hat noch keine Fragen'); return liste(); }
      const teams = spielTeams(), ziel = mod._rZiel ?? Math.min(10, fragen.length), naechste = fragenStapel(q);
      const g = { f: naechste(), nr: 1, aufgeloest: false, richtig: new Set(), ziel, sieger: null };
      body.innerHTML = `<div class="qplay rn card"><div class="row between qtop"><button class="btn" id="qEnd">✕ Beenden</button><span class="qnum" id="rnNum"></span>
          <label class="chk small">Ziel <select id="rnZiel">${[5, 8, 10, 12, 15, 20].map(n => `<option value="${n}" ${n === ziel ? 'selected' : ''}>${n} richtige</option>`).join('')}</select></label></div>
        <div class="rn-oben" id="rnFrage"></div>
        <div class="rn-strecke" id="rnStrecke"></div>
        <div class="rn-unten" id="rnUnten"></div></div>`;
      const $ = id => body.querySelector('#' + id);
      const strecke = () => {
        $('rnStrecke').innerHTML = `<div class="rn-ziel"></div>${teams.map((t, i) => `<div class="rn-spur" style="--t:${t.farbe}">
          <span class="rn-name">${t.emoji} ${esc(t.name)}</span><span class="rn-stand">${t.punkte}</span>
          <div class="rn-bahn"><div class="rn-auto ${g.richtig.has(t.id) && g.aufgeloest ? 'fahrt' : ''}" style="left:calc(${Math.min(1, t.punkte / g.ziel)} * (100% - 70px))"><span>🏎️</span><i style="background:${t.farbe}"></i></div></div></div>`).join('')}`;
      };
      const zeichne = () => {
        $('rnNum').textContent = `Frage ${g.nr}`;
        $('rnFrage').innerHTML = frageHtml(g.f, g.aufgeloest);
        $('rnUnten').innerHTML = g.sieger ? `<div class="vg-ende" style="--t:${g.sieger.farbe}"><h2>🏁 ${g.sieger.emoji} ${esc(g.sieger.name)} gewinnt das Rennen!</h2>
            <div class="row center"><button class="btn primary" id="rnNochmal">Neues Rennen</button>${P.teams.length ? '<button class="btn" id="rnPunkte">🏆 In die Punktetafel</button>' : ''}</div></div>`
          : !g.aufgeloest ? `<span class="muted">Alle Teams überlegen – dann auflösen:</span><button class="btn primary big" id="rnLoes">Auflösen</button>`
          : `<span class="muted">Welche Teams hatten recht?</span><div class="rn-wahl">${teams.map(t => `<button data-rnteam="${t.id}" class="${g.richtig.has(t.id) ? 'on' : ''}" style="--t:${t.farbe}">${t.emoji} ${esc(t.name)}</button>`).join('')}</div><button class="btn primary big" id="rnWeiter">Losfahren →</button>`;
        strecke();
      };
      body.onclick = e => {
        const t = e.target;
        if (t.id === 'qEnd') return liste();
        if (t.id === 'rnLoes') { g.aufgeloest = true; g.richtig.clear(); sound.tada(); zeichne(); return; }
        const tb = t.closest('[data-rnteam]'); if (tb) { const id = tb.dataset.rnteam; g.richtig.has(id) ? g.richtig.delete(id) : g.richtig.add(id); tb.classList.toggle('on'); tone(700, 0.05, 'triangle', 0.1); return; }
        if (t.id === 'rnWeiter') {
          teams.forEach(x => { if (g.richtig.has(x.id)) x.punkte++; });
          if (g.richtig.size) sweep(220, 520, 0.6, 'sawtooth', 0.08);
          strecke(); body.querySelectorAll('.rn-spur').forEach((s, i) => { if (g.richtig.has(teams[i].id)) s.querySelector('.rn-auto').classList.add('fahrt'); });
          const vorne = teams.filter(x => x.punkte >= g.ziel).sort((a, b) => b.punkte - a.punkte);
          if (vorne.length) { g.sieger = vorne[0]; setTimeout(() => { winSound(); confetti(180); zeichne(); }, 900); return; }
          setTimeout(() => { g.f = naechste(); g.nr++; g.aufgeloest = false; g.richtig.clear(); zeichne(); }, 900);
          return;
        }
        if (t.id === 'rnNochmal') { teams.forEach(x => x.punkte = 0); g.sieger = null; g.nr = 1; g.f = naechste(); g.aufgeloest = false; g.richtig.clear(); zeichne(); return; }
        if (t.id === 'rnPunkte') { inPunktetafel(teams); t.disabled = true; }
      };
      body.onchange = e => { if (e.target.id === 'rnZiel') { g.ziel = mod._rZiel = +e.target.value; strecke(); } };
      audio(); zeichne();
    };

    /* ---------- 1, 2 oder 3 ---------- */
    const eins23 = q => {
      neu();
      // pro Frage höchstens 3 Antworten – die richtige ist immer dabei
      const fragen = q.fragen.filter(f => f.frage && f.typ !== 'offen').map(f => {
        const ant = antworten(f), r = richtigIdx(f);
        if (ant.length <= 3) return { f, ant, r };
        const andere = ant.map((a, j) => j).filter(j => j !== r).slice(0, 2), wahl = [...andere, r].sort((a, b) => a - b);
        return { f, ant: wahl.map(j => ant[j]), r: wahl.indexOf(r) };
      });
      if (!fragen.length) { toast('Für „1, 2 oder 3“ braucht es Fragen mit Antwortmöglichkeiten'); return liste(); }
      let i = 0, zeit = mod._z123 ?? 10, t0 = 0, phase = 'frage';
      const FARBEN = ['#ff3b30', '#ffcc00', '#007aff'];
      body.innerHTML = `<div class="qplay q123 card">
        <div class="row between qtop"><button class="btn" id="qEnd">✕ Beenden</button><span id="qNum" class="qnum"></span>
          <label class="chk small">Wechselzeit <select id="q123Zeit">${[5, 10, 15, 20].map(s => `<option value="${s}" ${s === zeit ? 'selected' : ''}>${s} s</option>`).join('')}</select></label></div>
        <div class="qfrage" id="qFrage"></div>
        <div class="q123-felder" id="qFelder"></div>
        <div class="q123-satz" id="qSatz"></div>
        <div class="qbar"><i id="qBar"></i></div>
        <div class="qfoot" id="qFoot"></div></div>`;
      const $ = id => body.querySelector('#' + id);
      const show = () => {
        const { f, ant } = fragen[i]; phase = 'frage'; t0 = performance.now(); mod._geheim = { frage: f.frage, loesung: `${fragen[i].r + 1} – ${ant[fragen[i].r]}` };
        $('qNum').textContent = `Frage ${i + 1} / ${fragen.length}${f.kat ? ' · ' + f.kat : ''}`;
        $('qFrage').textContent = f.frage;
        $('qFelder').className = 'q123-felder n' + ant.length;
        $('qFelder').innerHTML = ant.map((a, j) => `<div class="q123-feld" style="--c:${FARBEN[j]}"><b>${j + 1}</b><span>${esc(a)}</span></div>`).join('');
        $('qSatz').textContent = 'Lauft zu eurer Antwort!';
        $('qFoot').innerHTML = `<button class="btn primary big" id="q123Licht">💡 Licht an!</button>`;
      };
      const licht = () => {
        if (phase !== 'frage' && phase !== 'warten') return; phase = 'aus';
        $('qBar').style.width = '0';
        $('qSatz').textContent = 'Ob ihr wirklich richtig steht, seht ihr, wenn das Licht angeht …';
        $('qFelder').classList.add('dunkel'); tone(200, 0.4, 'sine', 0.15);
        setTimeout(() => {
          phase = 'an'; const r = fragen[i].r;
          body.querySelectorAll('.q123-feld').forEach((el, j) => el.classList.add(j === r ? 'licht' : 'aus'));
          $('qFelder').classList.remove('dunkel'); sound.tada();
          $('qSatz').textContent = `Richtig ist ${r + 1}!`;
          $('qFoot').innerHTML = `${P.teams.length ? `<div class="qteams"><span class="muted">Punkte an:</span>${teamBtns(1)}</div>` : ''}
            <button class="btn primary big" id="qNext">${i + 1 < fragen.length ? 'Nächste Frage →' : '🏁 Fertig'}</button>`;
        }, 1800);
      };
      const tick = now => {
        if (phase === 'frage') {
          const rest = zeit - (now - t0) / 1000;
          $('qBar').style.width = Math.max(0, rest / zeit * 100) + '%';
          $('qSatz').textContent = rest > 0 ? `Lauft zu eurer Antwort! Noch ${Math.ceil(rest)} Sekunden …` : '';
          if (Math.ceil(rest) !== mod._123s && rest > 0 && rest <= 3) { mod._123s = Math.ceil(rest); tone(700, 0.08, 'square', 0.08); }
          if (rest <= 0) { phase = 'warten'; tone(330, 0.5, 'triangle', 0.18); $('qSatz').textContent = 'Stopp! Bleibt stehen.'; }
        }
        mod._raf = requestAnimationFrame(tick);
      };
      body.onclick = e => {
        if (e.target.id === 'qEnd') return liste();
        if (e.target.id === 'q123Licht') licht();
        const tb = e.target.closest('[data-team]'); if (tb) { audio(); punkteAdd(tb.dataset.team, +tb.dataset.wert); tb.classList.add('given'); tb.querySelector('small').textContent = `(${P.teams.find(x => x.id === tb.dataset.team).score}/${P.ziel})`; }
        if (e.target.id === 'qNext') { if (++i < fragen.length) show(); else { confetti(); liste(); toast('🏁 Alle Fragen gespielt'); } }
      };
      body.onchange = e => { if (e.target.id === 'q123Zeit') { zeit = mod._z123 = +e.target.value; t0 = performance.now(); } };
      audio(); show(); mod._raf = requestAnimationFrame(tick);
    };

    /* ---------- Blitzrunde: ein Team, eine Minute, so viele Fragen wie möglich ---------- */
    const blitz = q => {
      neu();
      const pool = q.fragen.filter(f => f.frage);
      if (!P.teams.length) { toast('Zuerst Teams in der Punktetafel anlegen'); return liste(); }
      let stapel = shuffle(pool), dran = Math.max(0, P.teams.findIndex(t => t.id === P.beginnt)), dauer = mod._blitzZeit ?? 60, ende = 0, laeuft = false, richtig = 0, f = null, sperre = false;
      const ergebnis = {};
      body.innerHTML = `<div class="qplay qblitz card"><div class="row between qtop"><button class="btn" id="qEnd">✕ Beenden</button><span class="qnum">⚡ Blitzrunde</span>
          <label class="chk small">Zeit <select id="qbZeit">${[30, 45, 60, 90, 120].map(s => `<option value="${s}" ${s === dauer ? 'selected' : ''}>${s} s</option>`).join('')}</select></label></div>
        <div id="qbBody"></div></div>`;
      const box = body.querySelector('#qbBody');
      const naechste = () => { if (!stapel.length) stapel = shuffle(pool); f = stapel.pop(); geheim(f); };
      const start = () => {
        const t = P.teams[dran];
        box.innerHTML = `<div class="qb-start"><div class="qb-team" style="--c:${t.farbe}">${t.emoji} ${esc(t.name)}</div>
          <p class="muted">${dauer} Sekunden – so viele Fragen wie möglich. Du drückst ✓ oder ✗, die Klasse antwortet laut.</p>
          <button class="btn primary huge" id="qbLos">⚡ Los!</button>
          ${Object.keys(ergebnis).length ? `<div class="qb-stand">${P.teams.map(x => ergebnis[x.id] != null ? `<span style="--c:${x.farbe}">${x.emoji} ${esc(x.name)} <b>${ergebnis[x.id]}</b></span>` : '').join('')}</div>` : ''}</div>`;
      };
      const frage = () => {
        const t = P.teams[dran], ant = antworten(f);
        box.innerHTML = `<div class="qb-kopf"><span class="qb-team klein" style="--c:${t.farbe}">${t.emoji} ${esc(t.name)}</span><b class="qb-zeit" id="qbZeitAnz"></b><span class="qb-richtig">✓ <b id="qbR">${richtig}</b></span></div>
          <div class="qbar"><i id="qBar"></i></div>
          <div class="qfrage">${esc(f.frage)}</div>
          ${ant.length ? `<div class="qb-ant">${ant.map((a, j) => `<span data-j="${j}">${esc(a)}</span>`).join('')}</div>` : ''}
          <div class="qb-knoepfe"><button class="btn ok huge" data-qb="ok">✓ Richtig</button><button class="btn nein huge" data-qb="nein">✗ Falsch</button><button class="btn big" data-qb="skip">→ Weiter</button></div>`;
      };
      const werten = art => {
        if (!laeuft || sperre) return; sperre = true;
        if (art === 'ok') { richtig++; tone(880, 0.12, 'triangle', 0.18); } else if (art === 'nein') tone(160, 0.25, 'sawtooth', 0.12);
        const r = richtigIdx(f), el = box.querySelector(`.qb-ant [data-j="${r}"]`); if (el && art !== 'ok') el.classList.add('richtig');
        setTimeout(() => { sperre = false; if (laeuft) { naechste(); frage(); } }, art === 'ok' ? 150 : 700);
      };
      const stopp = () => {
        laeuft = false; const t = P.teams[dran]; ergebnis[t.id] = richtig; sound.gong();
        if (richtig) punkteAdd(t.id, richtig);
        box.innerHTML = `<div class="qb-start"><div class="pb-big">⏰</div><div class="qb-team" style="--c:${t.farbe}">${t.emoji} ${esc(t.name)}: ${richtig} richtig</div>
          <p class="muted">${richtig ? `+${richtig} Punkte in der Punktetafel` : 'Diesmal keine Punkte'}</p>
          <div class="row center"><button class="btn primary big" id="qbWeiter">Nächstes Team →</button><a class="btn big" href="#/punkte">🏆 Punktetafel</a></div></div>`;
        if (richtig >= 5) confetti(80);
      };
      const tick = () => {
        if (laeuft) {
          const rest = ende - performance.now() / 1000, z = box.querySelector('#qbZeitAnz'), b = box.querySelector('#qBar');
          if (z) { z.textContent = Math.max(0, Math.ceil(rest)); z.classList.toggle('knapp', rest <= 10); } if (b) b.style.width = Math.max(0, rest / dauer * 100) + '%';
          if (rest <= 0) stopp();
        }
        mod._raf = requestAnimationFrame(tick);
      };
      body.onclick = e => {
        if (e.target.id === 'qEnd') return liste();
        if (e.target.id === 'qbLos') { richtig = 0; laeuft = true; ende = performance.now() / 1000 + dauer; naechste(); frage(); sound.tada(); }
        const b = e.target.closest('[data-qb]'); if (b) werten(b.dataset.qb);
        if (e.target.id === 'qbWeiter') { dran = (dran + 1) % P.teams.length; start(); }
      };
      body.onchange = e => { if (e.target.id === 'qbZeit') dauer = mod._blitzZeit = +e.target.value; };
      audio(); start(); mod._raf = requestAnimationFrame(tick);
    };

    /* ---------- Heiße Kartoffel: Gegenstand weitergeben, bis es knallt ---------- */
    const kartoffel = q => {
      neu();
      const pool = q.fragen.filter(f => f.frage);
      let stapel = shuffle(pool), f = null, laeuft = false, start = 0, dauer = 0, naechsterTick = 0;
      body.innerHTML = `<div class="qplay qkart card"><div class="row between qtop"><button class="btn" id="qEnd">✕ Beenden</button><span class="qnum">🥔 Heiße Kartoffel</span><span></span></div>
        <div id="qkBody"></div></div>`;
      const box = body.querySelector('#qkBody');
      const bereit = (knall = false) => {
        box.innerHTML = `<div class="qb-start">${knall ? '<div class="qk-knall">💥</div><h2>BUMM!</h2><p class="muted">Wer die Kartoffel gerade hält, scheidet aus – oder gibt einen Punkt ab.</p>'
          : `<div class="qk-erd">🥔</div><p class="qk-regel">Gebt einen Gegenstand reihum weiter – das ist die <b>heiße Kartoffel</b>.<br>Wer sie hat, beantwortet die Frage. Richtig → weitergeben, du klickst „Nächste Frage“.<br>Irgendwann knallt es – niemand weiß wann!</p>`}
          <button class="btn primary huge" id="qkLos">${knall ? '🔁 Neue Runde' : '🔥 Starten'}</button></div>`;
      };
      const frage = () => {
        if (!stapel.length) stapel = shuffle(pool); f = stapel.pop(); geheim(f);
        const ant = antworten(f);
        box.innerHTML = `<div class="qk-spiel"><div class="qk-erd heiss" id="qkErd">🥔</div>
          <div class="qfrage">${esc(f.frage)}</div>
          ${ant.length ? `<div class="qb-ant">${ant.map((a, j) => `<span data-j="${j}">${esc(a)}</span>`).join('')}</div>` : ''}
          <div class="qb-knoepfe"><button class="btn big" id="qkLoes">Lösung zeigen</button><button class="btn primary huge" id="qkNext">Richtig – weitergeben →</button></div></div>`;
      };
      const tick = now => {
        if (laeuft) {
          const t = (now - start) / 1000, anteil = t / dauer, erd = box.querySelector('#qkErd');
          if (erd) erd.style.setProperty('--w', (0.6 + anteil * 3).toFixed(2));
          if (now >= naechsterTick) { tone(1200 - anteil * 400, 0.04, 'square', 0.05 + anteil * 0.06); naechsterTick = now + Math.max(120, 700 - anteil * 600); }
          if (t >= dauer) { laeuft = false; sweep(500, 40, 0.9, 'sawtooth', 0.3); tone(60, 1, 'square', 0.25); bereit(true); }
        }
        mod._raf = requestAnimationFrame(tick);
      };
      body.onclick = e => {
        if (e.target.id === 'qEnd') return liste();
        if (e.target.id === 'qkLos') { laeuft = true; start = performance.now(); dauer = 25 + Math.random() * 50; naechsterTick = 0; frage(); }
        if (e.target.id === 'qkNext') frage();
        if (e.target.id === 'qkLoes') { const el = box.querySelector(`.qb-ant [data-j="${richtigIdx(f)}"]`); if (el) el.classList.add('richtig'); else if (f.typ === 'offen') toast('Lösung: ' + (f.antworten[0] || '–')); }
      };
      audio(); bereit(); mod._raf = requestAnimationFrame(tick);
    };

    /* ---------- Millionenshow-Stil ---------- */
    const million = q => {
      neu();
      const fragen = q.fragen.filter(f => f.frage && f.typ !== 'offen').sort((a, b) => (a.punkte || 0) - (b.punkte || 0)).slice(0, 15);
      if (!fragen.length) { toast('Für die Millionenshow braucht es Fragen mit Antwortmöglichkeiten'); return liste(); }
      // Weniger als 15 Fragen: Gewinnstufen gleichmäßig verteilen, die letzte ist immer die Million
      const stufen = fragen.length === 1 ? [1000000] : fragen.map((_, k) => LEITER[Math.round(k * (LEITER.length - 1) / (fragen.length - 1))]);
      // Sicherheitsstufen: € 500 / € 15.000 – bei kurzen Leitern nach ca. einem und zwei Dritteln
      const sicher = k => stufen.length >= 15 ? SICHER.includes(stufen[k]) : (k === Math.round(stufen.length / 3) - 1 || k === Math.round(stufen.length * 2 / 3) - 1);
      let i = 0, gewaehlt = null, phase = 'frage', weg = [], joker = { fifty: true, tel: true, pub: true }, gesichert = 0;
      body.innerHTML = `<div class="qplay qm-stage">
        <div class="qm-main">
          <div class="row between"><button class="btn" id="qEnd">✕ Beenden</button>
            <div class="jokers"><button data-j="fifty" title="50:50">50:50</button><button data-j="tel" title="Telefonjoker">📞</button><button data-j="pub" title="Publikumsjoker">👥</button></div>
            <button class="btn" id="qStop" title="Mit dem aktuellen Betrag aufhören">💼 Aufhören</button></div>
          <div class="qm-logo">💰</div>
          <div class="qm-q" id="qQ"></div>
          <div class="qm-ans" id="qA"></div>
          <div class="qm-foot" id="qF"></div>
        </div>
        <ol class="qm-ladder" id="qL" reversed></ol></div>`;
      const $ = id => body.querySelector('#' + id);
      const ladder = () => {
        $('qL').innerHTML = stufen.map((s, k) => ({ s, k })).reverse().map(({ s, k }) => `<li class="${k === i ? 'cur' : ''} ${k < i ? 'done' : ''} ${sicher(k) ? 'safe' : ''}"><span>${k + 1}</span>${euro(s)}</li>`).join('');
        body.querySelectorAll('[data-j]').forEach(b => b.disabled = !joker[b.dataset.j] || phase !== 'frage');
      };
      const show = () => {
        const f = fragen[i], ant = antworten(f); geheim(f);
        $('qQ').textContent = f.frage;
        $('qA').innerHTML = ant.map((a, j) => `<button class="qm-a ${weg.includes(j) ? 'gone' : ''} ${gewaehlt === j ? 'sel' : ''}" data-a="${j}"><b>${f.typ === 'tf' ? '' : 'ABCD'[j] + ':'}</b> ${esc(a)}</button>`).join('');
        $('qF').innerHTML = phase === 'frage' ? (gewaehlt !== null ? `<button class="btn primary big" id="qLock">🔒 Ist das Ihre endgültige Antwort?</button>` : `<span class="muted">Antwort wählen …</span>`) : '';
        ladder();
      };
      const lock = () => {
        phase = 'spannung'; show(); sweep(200, 120, 2.2, 'sawtooth', 0.06); tone(98, 2.2, 'sine', 0.2);
        setTimeout(() => {
          const f = fragen[i], r = richtigIdx(f), ok = gewaehlt === r;
          body.querySelectorAll('.qm-a').forEach((b, j) => { if (j === r) b.classList.add('right'); else if (j === gewaehlt) b.classList.add('wrong'); });
          if (ok) {
            [523, 659, 784, 1047].forEach((fr, k) => tone(fr, 0.4, 'triangle', 0.2, k * 0.12));
            if (sicher(i)) gesichert = stufen[i];
            if (i === fragen.length - 1) return ende(stufen[i], true);
            phase = 'richtig';
            $('qF').innerHTML = `<div class="qm-win">✓ Richtig! ${euro(stufen[i])}</div><button class="btn primary big" id="qWeiter">Nächste Frage →</button>`;
          } else {
            tone(110, 1.2, 'sawtooth', 0.15); tone(104, 1.2, 'sawtooth', 0.12);
            setTimeout(() => ende(gesichert, false), 1800);
          }
        }, 2300);
      };
      const ende = (betrag, alles) => {
        phase = 'ende';
        if (betrag) { confetti(alles ? 300 : 120); sound.tada(); }
        body.querySelector('.qm-main').innerHTML = `<div class="qdone"><div class="pb-big">${alles ? '🏆' : betrag ? '💶' : '😅'}</div>
          <h2>${alles ? 'MILLIONÄR:IN!' : betrag ? 'Gewonnen:' : 'Leider falsch!'}</h2><div class="qm-sum">${euro(betrag)}</div>
          <div class="row center"><button class="btn primary big" id="qAgain">↺ Nochmal</button><button class="btn big" id="qEnd">Zur Übersicht</button></div></div>`;
      };
      const overlay = html => { const o = document.createElement('div'); o.className = 'result-pop'; o.innerHTML = `<div class="rp-card qm-pop">${html}</div>`; document.body.appendChild(o); return o; };
      body.onclick = e => {
        const t = e.target;
        if (t.id === 'qEnd') return liste();
        if (t.id === 'qAgain') return million(q);
        const a = t.closest('[data-a]');
        if (a && phase === 'frage' && !a.classList.contains('gone')) { gewaehlt = +a.dataset.a; tone(440, 0.1, 'sine', 0.1); show(); }
        if (t.id === 'qLock') lock();
        if (t.id === 'qWeiter') { i++; gewaehlt = null; weg = []; phase = 'frage'; show(); }
        if (t.id === 'qStop' && phase === 'frage' && confirm(`Mit ${euro(i ? stufen[i - 1] : 0)} aufhören?`)) ende(i ? stufen[i - 1] : 0, false);
        const j = t.closest('[data-j]');
        if (j && joker[j.dataset.j] && phase === 'frage') {
          const f = fragen[i], r = richtigIdx(f), n = antworten(f).length;
          joker[j.dataset.j] = false; sound.pop();
          if (j.dataset.j === 'fifty') { weg = shuffle([...Array(n).keys()].filter(x => x !== r)).slice(0, Math.max(0, n - 2)); if (weg.includes(gewaehlt)) gewaehlt = null; show(); }
          if (j.dataset.j === 'tel') {
            let s = 30; const o = overlay(`<div class="pb-big">📞</div><h2>Telefonjoker</h2><p>Frag deine Sitznachbarin oder deinen Sitznachbarn!</p><div class="qm-sum" id="telS">30</div><button class="btn">Fertig</button>`);
            const iv = setInterval(() => { s--; const el2 = o.querySelector('#telS'); if (el2) el2.textContent = s; if (s <= 5 && s > 0) sound.tick(); if (s <= 0) { clearInterval(iv); sound.gong(); } }, 1000);
            o.onclick = ev => { if (ev.target.closest('.btn') || !ev.target.closest('.rp-card')) { clearInterval(iv); o.remove(); } };
          }
          if (j.dataset.j === 'pub') {
            const st = Array(n).fill(0), ant = antworten(f);
            const o = overlay(`<div class="pb-big">👥</div><h2>Publikumsjoker</h2><p class="muted">Hände zählen und eintippen:</p><div class="pubs" id="pubs"></div><button class="btn" data-fertig>Fertig</button>`);
            const dr = () => { const sum = st.reduce((a, b) => a + b, 0) || 1; o.querySelector('#pubs').innerHTML = ant.map((a, k) => `<div class="pub ${weg.includes(k) ? 'gone' : ''}"><div class="pub-bar"><i style="height:${st[k] / sum * 100}%"></i></div><b>${'ABCD'[k]}</b><span>${Math.round(st[k] / sum * 100)}%</span><div><button data-pm="${k}" data-n="-1">−</button><button data-pm="${k}" data-n="1">+</button></div></div>`).join(''); };
            dr();
            o.onclick = ev => { const b = ev.target.closest('[data-pm]'); if (b) { st[+b.dataset.pm] = Math.max(0, st[+b.dataset.pm] + +b.dataset.n); dr(); return; } if (ev.target.closest('[data-fertig]') || !ev.target.closest('.rp-card')) o.remove(); };
          }
          ladder();
        }
      };
      audio(); show();
    };

    /* ---------- Jeopardy-Stil ---------- */
    const jeopardy = q => {
      neu();
      const fragen = q.fragen.filter(f => f.frage);
      /* Raster passend zu den vorhandenen Fragen: Spalten = Kategorien (max. 6), je Spalte bis zu 5 Fragen,
         nach Schwierigkeit sortiert → 100, 200, 300 … Bei nur 1–2 Kategorien werden die Fragen auf mehrere Spalten verteilt. */
      let spalten = [];
      fragen.forEach(f => {
        const k = f.kat || 'Allgemein';
        let s = spalten.find(x => x.name === k); if (!s) spalten.push(s = { name: k, fragen: [] });
        s.fragen.push(f);
      });
      if (spalten.length < 3 && fragen.length > 5) {
        const anzahl = Math.min(6, Math.ceil(fragen.length / 5)), proSpalte = Math.ceil(fragen.length / anzahl);
        const alle = spalten.flatMap(s => s.fragen); spalten = [];
        for (let k = 0; k < anzahl; k++) {
          const teil = alle.slice(k * proSpalte, (k + 1) * proSpalte); if (!teil.length) continue;
          const name = teil[0].kat || 'Runde';
          spalten.push({ name: spalten.some(s => s.name.startsWith(name)) || alle.every(f => (f.kat || 'Runde') === name) ? `${name} ${k + 1}` : name, fragen: teil });
        }
      }
      spalten = spalten.slice(0, 6).map(s => ({ ...s, fragen: s.fragen.slice().sort((a, b) => (+a.punkte || 0) - (+b.punkte || 0)).slice(0, 5) }));
      const kats = spalten.map(s => s.name), zeilen = Math.max(...spalten.map(s => s.fragen.length));
      const werte = Array.from({ length: zeilen }, (_, r) => (r + 1) * 100), wertVon = {};
      spalten.forEach(s => s.fragen.forEach((f, r) => { wertVon[f.id] = (r + 1) * 100; }));
      const zelle = (k, w) => spalten.find(s => s.name === k)?.fragen[w / 100 - 1];
      const used = new Set(), sc = Object.fromEntries(P.teams.map(t => [t.id, 0]));
      const draw = () => {
        body.innerHTML = `<div class="qplay jp">
          <div class="row between"><button class="btn" id="qEnd">✕ Beenden</button><b class="jp-title">${esc(q.titel)}</b><button class="btn" id="jpToP" title="Ergebnis zur Punktetafel addieren">🏆 → Punktetafel</button></div>
          <div class="jp-board" style="grid-template-columns:repeat(${kats.length},1fr)">
            ${kats.map(k => `<div class="jp-kat">${esc(k)}</div>`).join('')}
            ${werte.map(w => kats.map(k => { const f = zelle(k, w); return `<button class="jp-cell ${!f || used.has(f.id) ? 'used' : ''}" ${f && !used.has(f.id) ? `data-f="${f.id}"` : 'disabled'}>${f && !used.has(f.id) ? w : ''}</button>`; }).join('')).join('')}
          </div>
          <div class="jp-scores">${P.teams.map(t => `<div class="jp-sc" style="--c:${t.farbe}">${t.id === P.beginnt ? '⭐ ' : ''}${t.emoji} ${esc(t.name)}<b>${sc[t.id]}</b></div>`).join('')}</div></div>`;
      };
      const frage = f => {
        const ant = antworten(f), w = wertVon[f.id] || 100; geheim(f);
        sweep(400, 800, 0.3, 'triangle', 0.15);
        const o = document.createElement('div'); o.className = 'jp-q';
        o.innerHTML = `<div class="jp-qh">${esc(f.kat || 'Allgemein')} · ${w}</div><div class="jp-qt">${esc(f.frage)}</div>
          ${ant.length ? `<div class="jp-ans">${ant.map((a, j) => `<div class="jp-a"><b>${f.typ === 'tf' ? '' : 'ABCD'[j]}</b> ${esc(a)}</div>`).join('')}</div>` : ''}
          <button class="btn big" data-show>👀 Lösung zeigen</button>
          <div class="jp-award">${P.teams.map(t => `<div class="jp-tw" style="--c:${t.farbe}"><span>${t.emoji} ${esc(t.name)}</span><button data-t="${t.id}" data-n="${w}">✓ +${w}</button><button data-t="${t.id}" data-n="${-w}">✗ −${w}</button></div>`).join('')}</div>
          <button class="btn" data-close>Schließen</button>`;
        o.onclick = e => {
          if (e.target.closest('[data-show]')) {
            const r = richtigIdx(f);
            if (ant.length) o.querySelectorAll('.jp-a').forEach((a, j) => a.classList.add(j === r ? 'right' : 'wrong'));
            else e.target.closest('[data-show]').outerHTML = `<div class="jp-sol">${esc(f.antworten[0] || '–')}</div>`;
            if (ant.length) e.target.closest('[data-show]').remove();
          }
          const b = e.target.closest('[data-t]');
          if (b) { sc[b.dataset.t] += +b.dataset.n; +b.dataset.n > 0 ? sound.tada() : tone(150, 0.4, 'square', 0.12); b.parentElement.querySelectorAll('button').forEach(x => x.disabled = true); }
          if (e.target.closest('[data-close]')) { used.add(f.id); o.remove(); draw(); if (used.size === kats.reduce((a, k) => a + werte.filter(w => zelle(k, w)).length, 0)) confetti(); }
        };
        document.body.appendChild(o);
      };
      body.onclick = e => {
        if (e.target.id === 'qEnd') return liste();
        const c = e.target.closest('[data-f]'); if (c) frage(fragen.find(f => f.id === c.dataset.f));
        if (e.target.id === 'jpToP' && confirm('Jeopardy-Punkte durch 100 geteilt zur Punktetafel addieren?')) {
          P.teams.forEach(t => t.score = Math.max(0, t.score + Math.round(sc[t.id] / 100))); save(); toast('Zur Punktetafel addiert');
        }
      };
      audio(); draw();
    };

    liste();
  },
  destroy() { cancelAnimationFrame(this._raf); document.querySelectorAll('.jp-q, .result-pop').forEach(x => x.remove()); },
});
