'use strict';
/* ===== Wortspiele: Galgenmännchen · Tabu · Activity ===== */

/* ---- Begriffe mit „verbotenen“ Wörtern (Tabu) – auch für Activity ---- */
const TABU_KARTEN = `Schule: Lehrer, Unterricht, Klasse, Schüler
Hausübung: Schule, Aufgabe, Heft, zu Hause
Pause: Glocke, Schule, Jause, Hof
Ferien: Sommer, Urlaub, Schule, frei
Fußball: Tor, Ball, Spiel, Mannschaft
Geburtstag: Feier, Torte, Geschenk, Jahr
Weihnachten: Christkind, Baum, Geschenke, Dezember
Ostern: Hase, Eier, Frühling, suchen
Handy: telefonieren, Smartphone, Nachricht, Bildschirm
Pizza: Italien, Käse, Teig, Ofen
Zahnbürste: Zähne, putzen, Zahnpasta, Mund
Regenschirm: Regen, nass, aufspannen, Wetter
Kühlschrank: kalt, Küche, Essen, Milch
Feuerwehr: Feuer, löschen, Auto, Sirene
Elefant: Rüssel, groß, Afrika, grau
Pinguin: Eis, Vogel, Antarktis, watscheln
Schneemann: Schnee, Winter, Karotte, bauen
Bibliothek: Bücher, lesen, ausleihen, leise
Zug: Bahn, Schienen, fahren, Bahnhof
Flugzeug: fliegen, Pilot, Flughafen, Luft
Zauberer: Zauberstab, Hut, Magie, Trick
Pirat: Schiff, Schatz, Augenklappe, Meer
Vulkan: Lava, Berg, Ausbruch, heiß
Gitarre: Instrument, Saiten, spielen, Musik
Kino: Film, Popcorn, Leinwand, schauen
Wecker: Uhr, aufwachen, klingeln, Morgen
Sonnenbrille: Sonne, Augen, Sommer, dunkel
Turnsaal: turnen, Sport, Halle, Schule
Taschenrechner: rechnen, Mathematik, Zahlen, tippen
Wörterbuch: Wörter, nachschlagen, Buch, Sprache
Schokolade: süß, braun, essen, Kakao
Zahnarzt: Zähne, Bohrer, Arzt, Karies
Bäckerei: Brot, backen, Semmel, kaufen
Spinne: acht, Beine, Netz, Tier
Rakete: Weltall, fliegen, Mond, starten
Schatten: Sonne, dunkel, Licht, folgen
Regenbogen: Farben, Regen, Sonne, bunt
Fahrrad: fahren, treten, Räder, Helm
Polizei: Verbrecher, Auto, Blaulicht, Gesetz
Zoo: Tiere, Käfig, besuchen, Gehege
Hamburger: Brot, Fleisch, Fast Food, essen
Krokodil: Zähne, grün, Fluss, Reptil
Computer: Bildschirm, Tastatur, Maus, Internet
Wolke: Himmel, weiß, Regen, grau
Wald: Bäume, grün, Tiere, spazieren
Brille: Augen, sehen, Gläser, tragen
Kerze: Licht, Wachs, anzünden, Flamme
Schach: König, Brett, Spiel, Dame
Ritter: Burg, Rüstung, Schwert, Mittelalter
Dinosaurier: ausgestorben, groß, T-Rex, Urzeit
Eistüte: kalt, Kugel, Sommer, schlecken
Tafel: Kreide, schreiben, Klasse, wischen
Schultasche: tragen, Rücken, Bücher, Schule
Zeugnis: Noten, Schulschluss, Semester, Schule
Schwimmbad: Wasser, schwimmen, Becken, Sommer
Gespenst: Geist, Halloween, erschrecken, weiß
Banane: gelb, Obst, Affe, krumm
Uhr: Zeit, Zeiger, Stunde, Armband
Ameise: klein, Insekt, Haufen, krabbeln
Mond: Nacht, Himmel, Sterne, rund
Kalender: Datum, Tag, Monat, Termin
Skifahren: Schnee, Piste, Berg, Winter
Lehrerin: Schule, unterrichten, Klasse, Beruf
Hund: bellen, Haustier, Gassi, Katze
Schlange: Gift, kriechen, lang, zischen`;
const WORTLISTEN = {
  tiere: { name: 'Tiere', w: 'Elefant Giraffe Krokodil Schmetterling Eichhörnchen Nilpferd Pinguin Känguru Schildkröte Fledermaus Regenwurm Marienkäfer Murmeltier Steinbock Papagei Delfin' },
  schule: { name: 'Schule', w: 'Klassenzimmer Hausübung Schularbeit Bleistift Radiergummi Stundenplan Turnsaal Pausenhof Taschenrechner Wörterbuch Füllfeder Zeugnis Lineal Spitzer Schultasche Direktion' },
  natur: { name: 'Natur & Wetter', w: 'Regenbogen Wasserfall Gewitter Schneeflocke Sonnenblume Vulkan Gletscher Wüste Donner Nebel Hagel Tropfstein Sternschnuppe' },
  berufe: { name: 'Berufe', w: 'Bäcker Tischlerin Zahnarzt Polizistin Lehrer Gärtnerin Friseur Mechanikerin Pilot Tierärztin Koch Elektrikerin Feuerwehrmann Astronautin' },
  essen: { name: 'Essen', w: 'Palatschinken Kaiserschmarrn Schnitzel Marillenknödel Apfelstrudel Spaghetti Kartoffel Brokkoli Erdbeere Wassermelone Semmel Germknödel Frittatensuppe' },
  fremdwoerter: { name: 'Fremdwörter', w: null },
};
const GALGEN_MOTIVE = { galgen: 'Klassisch', schneemann: 'Schneemann schmilzt', ballons: 'Ballons platzen', blume: 'Blume verliert Blätter' };
const GMAX = 8;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'.split('');

state.wortspiele ||= { karten: '', woerter: '', motiv: 'galgen', liste: 'tiere', teams: 2, stil: 'farben', zeit: 60, modi: ['erklaeren', 'zeichnen', 'pantomime'] };
const W = state.wortspiele;

/** Karten aus Text: „Begriff: verboten, verboten …“ */
const kartenAus = text => text.split('\n').map(z => z.trim()).filter(Boolean).map(z => { const [w, r = ''] = z.split(':'); return { wort: w.trim(), tabu: r.split(',').map(x => x.trim()).filter(Boolean) }; }).filter(k => k.wort);
const alleKarten = () => [...kartenAus(TABU_KARTEN), ...kartenAus(W.karten)];
const gross = t => [...t].map(c => c === 'ß' ? 'ß' : c.toUpperCase()).join('');

/* ---- Galgenmännchen-Motive als SVG (f = Fehler 0…8) ---- */
function galgenSvg(motiv, f) {
  const z = (n, svg) => f >= n ? svg : '';
  const L = 'stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none"';
  if (motiv === 'schneemann') {
    const m = f / GMAX, s = 1 - m * 0.75;           // schmilzt
    const r1 = 46 * s, r2 = 34 * s, r3 = 25 * s, boden = 190;
    const y1 = boden - r1, y2 = y1 - r1 - r2 + 6, y3 = y2 - r2 - r3 + 6;
    return `<svg viewBox="0 0 240 210" class="gm-svg">
      <ellipse cx="120" cy="${boden + 2}" rx="${30 + m * 90}" ry="${6 + m * 6}" fill="#a5d8ff" opacity="${0.3 + m * 0.6}"/>
      ${f < GMAX ? `<circle cx="120" cy="${y1}" r="${r1}" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>
      <circle cx="120" cy="${y2}" r="${r2}" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>
      ${f < 5 ? `<circle cx="120" cy="${y3}" r="${r3}" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>
        <circle cx="${120 - r3 * 0.35}" cy="${y3 - 4}" r="3" fill="#1f2937"/><circle cx="${120 + r3 * 0.35}" cy="${y3 - 4}" r="3" fill="#1f2937"/>
        ${f < 4 ? `<path d="M120 ${y3 + 2} l18 4 l-18 4z" fill="#f97316"/>` : ''}
        <path d="M${120 - r3 * 0.4} ${y3 + r3 * 0.45} q${r3 * 0.4} ${f < 3 ? 6 : -4} ${r3 * 0.8} 0" stroke="#1f2937" stroke-width="2.5" fill="none"/>` : ''}
      ${f < 3 ? [0, 1, 2].map(i => `<circle cx="120" cy="${y2 - r2 * 0.4 + i * r2 * 0.4}" r="3.5" fill="#1f2937"/>`).join('') : ''}
      ${f < 1 ? `<rect x="${120 - 22}" y="${y3 - r3 - 26}" width="44" height="26" rx="3" fill="#1f2937"/><rect x="${120 - 32}" y="${y3 - r3 - 4}" width="64" height="7" rx="3" fill="#1f2937"/>` : `<g transform="translate(190 ${boden - 8}) rotate(-20)"><rect x="-18" y="-22" width="36" height="22" rx="3" fill="#1f2937"/><rect x="-26" y="-3" width="52" height="6" rx="3" fill="#1f2937"/></g>`}
      ${f < 2 ? `<path d="M${120 + r2} ${y2} l40 -40" stroke="#92400e" stroke-width="5" stroke-linecap="round"/>` : `<path d="M40 ${boden - 2} l50 -8" stroke="#92400e" stroke-width="5" stroke-linecap="round"/>`}`
      : `<path d="M110 ${boden - 2} l18 3 l-18 3z" fill="#f97316"/>`}</svg>`;
  }
  if (motiv === 'ballons') {
    const farben = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    const pos = [[60, 50], [95, 32], [130, 28], [165, 40], [75, 85], [112, 70], [150, 74], [185, 82]];
    const faellt = f >= GMAX ? 60 : 0;
    return `<svg viewBox="0 0 240 210" class="gm-svg">
      ${pos.map(([x, y], i) => i < GMAX - f ? `<path d="M${x} ${y + 20} Q${(x + 120) / 2} ${(y + 150) / 2} 120 150" stroke="#9ca3af" stroke-width="1.5" fill="none"/>
        <ellipse cx="${x}" cy="${y}" rx="17" ry="21" fill="${farben[i]}"/><ellipse cx="${x - 6}" cy="${y - 8}" rx="4" ry="6" fill="#fff" opacity=".45"/>` : `<text x="${x}" y="${y + 6}" font-size="18" text-anchor="middle" opacity=".5">💥</text>`).join('')}
      <g transform="translate(0 ${faellt})"><rect x="102" y="150" width="36" height="26" rx="4" fill="#b45309"/><path d="M102 158h36M102 166h36" stroke="#92400e" stroke-width="2"/>
      <circle cx="120" cy="140" r="9" fill="#fcd34d"/><circle cx="117" cy="139" r="1.5" fill="#1f2937"/><circle cx="123" cy="139" r="1.5" fill="#1f2937"/>
      <path d="M116 ${f >= GMAX - 2 ? 145 : 143} q4 ${f >= GMAX - 2 ? -3 : 3} 8 0" stroke="#1f2937" stroke-width="1.5" fill="none"/></g></svg>`;
  }
  if (motiv === 'blume') {
    const blatt = i => { const a = i * 45; return `<ellipse cx="120" cy="58" rx="13" ry="26" fill="${['#f472b6', '#fb7185'][i % 2]}" transform="rotate(${a} 120 88)"/>`; };
    return `<svg viewBox="0 0 240 210" class="gm-svg">
      <path d="M120 100 C118 140 124 160 120 195" stroke="#16a34a" stroke-width="6" fill="none"/>
      <ellipse cx="100" cy="150" rx="18" ry="8" fill="#22c55e" transform="rotate(-30 100 150)"/><ellipse cx="140" cy="165" rx="18" ry="8" fill="#22c55e" transform="rotate(30 140 165)"/>
      ${Array.from({ length: GMAX }, (_, i) => i < GMAX - f ? blatt(i) : '').join('')}
      ${Array.from({ length: f }, (_, i) => `<ellipse cx="${60 + i * 17}" cy="200" rx="10" ry="4" fill="#f9a8d4" opacity=".8"/>`).join('')}
      <circle cx="120" cy="88" r="17" fill="#facc15"/><circle cx="114" cy="85" r="2" fill="#1f2937"/><circle cx="126" cy="85" r="2" fill="#1f2937"/>
      <path d="M113 ${f >= GMAX / 2 ? 96 : 92} q7 ${f >= GMAX / 2 ? -5 : 5} 14 0" stroke="#1f2937" stroke-width="2" fill="none"/>
      <rect x="95" y="190" width="50" height="18" rx="3" fill="#b45309"/></svg>`;
  }
  return `<svg viewBox="0 0 240 210" class="gm-svg">
    <path d="M30 200h110" ${L}/>
    ${z(1, `<path d="M60 200V20" ${L}/>`)}${z(2, `<path d="M60 20h90M60 55l35-35" ${L}/>`)}${z(3, `<path d="M150 20v28" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`)}
    ${z(4, `<circle cx="150" cy="66" r="18" stroke="currentColor" stroke-width="5" fill="none"/>`)}${z(5, `<path d="M150 84v56" ${L}/>`)}
    ${z(6, `<path d="M150 98l-24 22M150 98l24 22" ${L}/>`)}${z(7, `<path d="M150 140l-22 34" ${L}/>`)}${z(8, `<path d="M150 140l22 34" ${L}/>`)}</svg>`;
}

registerModule({
  id: 'wortspiele', title: 'Wortspiele', icon: '🔤',
  render(el) {
    const mod = this;
    mod._tab ||= 'galgen';
    el.innerHTML = `<div class="page ws">
      <div class="pagehead">${seitenTitel('buchstaben', '#000', 'Wortspiele')}
        <nav class="tabs" id="wsTabs"><button data-wtab="galgen">Galgenmännchen</button><button data-wtab="tabu">Tabu</button><button data-wtab="activity">Activity</button><button data-wtab="wer">Wer bin ich?</button><button data-wtab="slf">Stadt-Land-Fluss</button><button data-wtab="karten">Eigene Wörter</button></nav></div>
      <div id="wsBody"></div></div>`;
    const body = el.querySelector('#wsBody');
    const draw = () => {
      el.querySelectorAll('#wsTabs button').forEach(b => b.classList.toggle('on', b.dataset.wtab === mod._tab));
      clearInterval(mod._iv);
      ({ galgen: galgen, tabu: () => teamSpiel('tabu'), activity: () => teamSpiel('activity'), wer: werBinIch, slf, karten })[mod._tab]();
      if (mod._tab === 'slf') mod._iv = setInterval(slfTick, 250);
    };

    /* ================= Galgenmännchen ================= */
    const neuesWort = (wort, hinweis = '') => { mod._g = { wort: gross(wort.trim()), hinweis, geraten: [], fehler: 0, ende: null }; draw(); };
    const zufallsWort = () => {
      const l = W.liste === 'eigene' ? W.woerter.split(/[\n,]/).map(x => x.trim()).filter(Boolean)
        : W.liste === 'fremdwoerter' ? FREMDWOERTER.map(x => x.w) : WORTLISTEN[W.liste].w.split(' ');
      if (!l.length) return toast('Die Liste ist leer – unter „Eigene Wörter“ eintragen');
      const fw = W.liste === 'fremdwoerter' ? FREMDWOERTER[Math.floor(Math.random() * FREMDWOERTER.length)] : null;
      neuesWort(fw ? fw.w : l[Math.floor(Math.random() * l.length)], fw ? `${fw.art} · ${fw.h}` : WORTLISTEN[W.liste]?.name || '');
    };
    const galgen = () => {
      const g = mod._g;
      const setup = `<aside class="card side">
          <h3>Neues Wort</h3>
          <form id="gmEigen" class="col"><input type="password" name="w" placeholder="Geheimes Wort eintippen" autocomplete="off" required>
            <input name="h" placeholder="Hinweis (optional)"><button class="btn primary">Los</button></form>
          <p class="muted small">Wird verdeckt eingetippt – die Klasse sieht es am Beamer nicht.</p>
          <h3>… oder zufällig</h3>
          <select id="gmListe">${Object.entries(WORTLISTEN).map(([k, l]) => `<option value="${k}" ${W.liste === k ? 'selected' : ''}>${l.name}</option>`).join('')}<option value="eigene" ${W.liste === 'eigene' ? 'selected' : ''}>Eigene Liste</option></select>
          <button class="btn full" id="gmZufall">🎲 Zufallswort</button>
          <h3>Darstellung</h3>
          <div class="seg col" id="gmMotiv">${Object.entries(GALGEN_MOTIVE).map(([k, n]) => `<button data-motiv="${k}" class="${W.motiv === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        </aside>`;
      if (!g) { body.innerHTML = `<div class="side-layout">${setup}<section class="gm-stage"><div class="placeholder">👈 Wort eintippen oder ein Zufallswort ziehen</div></section></div>`; return; }
      const zeige = [...g.wort].map(c => /[A-ZÄÖÜß]/.test(c) ? (g.geraten.includes(c) || g.ende ? `<span class="${g.geraten.includes(c) ? '' : 'fehlt'}">${c}</span>` : '<span class="leer"></span>') : c === ' ' ? '<i class="luecke"></i>' : `<span class="zeichen">${esc(c)}</span>`).join('');
      body.innerHTML = `<div class="side-layout">${setup}
        <section class="gm-stage ${g.ende || ''}" id="gmStage">
          <button class="auf-fs" id="gmFs" title="Vollbild">⛶</button>
          <div class="gm-bild">${galgenSvg(W.motiv, g.fehler)}</div>
          <div class="gm-rechts">
            ${g.hinweis ? `<div class="gm-hinweis">💡 ${esc(g.hinweis)}</div>` : ''}
            <div class="gm-wort">${zeige}</div>
            <div class="gm-info">${g.ende === 'gewonnen' ? '🎉 Geschafft!' : g.ende === 'verloren' ? '😮 Leider nicht – das Wort war oben.' : `Fehler: <b>${g.fehler}</b> von ${GMAX}`}</div>
            <div class="gm-tasten">${ALPHABET.map(c => `<button data-b="${c}" ${g.geraten.includes(c) || g.ende ? 'disabled' : ''} class="${g.geraten.includes(c) ? (g.wort.includes(c) ? 'treffer' : 'niete') : ''}">${c}</button>`).join('')}</div>
            ${g.ende ? '<button class="btn primary big" id="gmNochmal">Neues Wort</button>' : '<button class="btn small" id="gmAufloesen">Auflösen</button>'}
          </div></section></div>`;
    };
    const raten = c => {
      const g = mod._g; if (!g || g.ende || g.geraten.includes(c)) return;
      g.geraten.push(c);
      if (g.wort.includes(c)) { tone(880, 0.12, 'triangle', 0.15); if ([...g.wort].every(x => !/[A-ZÄÖÜß]/.test(x) || g.geraten.includes(x))) { g.ende = 'gewonnen'; sound.tada(); confetti(); } }
      else { g.fehler++; W.motiv === 'ballons' ? sweep(900, 120, 0.25, 'square', 0.12) : tone(180, 0.3, 'sawtooth', 0.12); if (g.fehler >= GMAX) { g.ende = 'verloren'; sweep(400, 90, 0.9, 'triangle', 0.2); } }
      galgen();
    };

    /* ================= Tabu & Activity (Teams) ================= */
    const MODI = { erklaeren: ['🗣️', 'Erklären'], zeichnen: ['✏️', 'Zeichnen'], pantomime: ['🤸', 'Pantomime'] };
    const teamsNeu = () => { const l = TEAM_STILE[W.stil]?.liste() || TEAM_STILE.farben.liste(); return Array.from({ length: W.teams }, (_, i) => ({ emoji: l[i][0], name: l[i][1], farbe: l[i][2] || COLORS[i], score: 0 })); };
    const S = () => ((mod._ss ||= {})[mod._tab] ||= { teams: teamsNeu(), dran: 0, laeuft: false, ende: 0, stapel: [], karte: null, modus: null, runde: { ok: 0, tabu: 0, skip: 0 }, verdeckt: false });
    const ziehen = () => {
      const s = S(); if (!s.stapel.length) s.stapel = shuffle(alleKarten());
      s.karte = s.stapel.pop();
      const erlaubt = W.modi.length ? W.modi : ['erklaeren'];
      s.modus = erlaubt[Math.floor(Math.random() * erlaubt.length)];
    };
    const teamSpiel = art => {
      const s = S(), t = s.teams[s.dran], rest = Math.max(0, Math.ceil(s.ende - Date.now() / 1000));
      const kopf = `<div class="ts-teams">${s.teams.map((x, i) => `<div class="ts-team ${i === s.dran ? 'dran' : ''}" style="--c:${x.farbe}"><span>${x.emoji}</span><b>${esc(x.name)}</b><em>${x.score}</em>
          <span class="ts-pm"><button data-pkt="${i}|1">+</button><button data-pkt="${i}|-1">−</button></span></div>`).join('')}</div>`;
      const einst = `<details class="ts-einst"><summary class="btn small">⚙ Einstellungen</summary><div class="card row">
          <label class="chk small">Teams <select data-w="teams">${[2, 3, 4, 5, 6].map(n => `<option ${W.teams === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="chk small">Namen <select data-w="stil">${Object.entries(TEAM_STILE).map(([k, x]) => `<option value="${k}" ${W.stil === k ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
          <label class="chk small">Zeit <select data-w="zeit">${[30, 45, 60, 90, 120].map(n => `<option value="${n}" ${W.zeit === n ? 'selected' : ''}>${n} s</option>`).join('')}</select></label>
          ${art === 'activity' ? Object.entries(MODI).map(([k, [ic, n]]) => `<label class="chk small"><input type="checkbox" data-modus="${k}" ${W.modi.includes(k) ? 'checked' : ''}> ${ic} ${n}</label>`).join('') : ''}
          ${letzteGruppen() ? `<button class="btn small" id="tsGruppen">👥 ${letzteGruppen().groups.length} Gruppen aus „Gruppen bilden“</button>` : ''}
          <button class="btn small danger" id="tsReset">Punkte auf 0</button></div></details>`;
      const anleitung = art === 'tabu'
        ? '<b>So geht’s (Heißer Stuhl):</b> Ein Kind sitzt mit dem Rücken zur Tafel und rät. Das eigene Team erklärt den Begriff – ohne die roten Wörter! Pro erratenem Begriff 1 Punkt, Tabu-Wort = 1 Punkt Abzug.'
        : '<b>So geht’s:</b> Ein Kind kommt nach vorne, zieht eine Karte und hält sie gedrückt, um den Begriff heimlich anzusehen. Dann je nach Symbol erklären, zeichnen oder pantomimisch darstellen. Das eigene Team rät.';
      let mitte;
      if (!s.laeuft && !s.karte) mitte = `<div class="ts-start"><div class="ts-dran" style="--c:${t.farbe}">${t.emoji} ${esc(t.name)} ist dran</div>
          <button class="btn primary huge" id="tsLos">${art === 'tabu' ? `▶ Runde starten (${W.zeit} s)` : '🃏 Karte ziehen'}</button><p class="muted small ts-anl">${anleitung}</p></div>`;
      else if (art === 'tabu') mitte = `<div class="ts-karte tabu ${s.verdeckt ? 'verdeckt' : ''}" id="tsKarte">
            <div class="tk-wort">${esc(s.karte.wort)}</div><div class="tk-tabu">${s.karte.tabu.map(x => `<span>${esc(x)}</span>`).join('') || '<span class="muted">keine Tabu-Wörter</span>'}</div>
            <div class="tk-deckel">🙈 Karte verdeckt<small>zum Ansehen gedrückt halten</small></div></div>
          <div class="ts-knoepfe"><button class="btn ok" data-tk="ok">✓ Richtig</button><button class="btn nein" data-tk="tabu">✗ Tabu!</button><button class="btn" data-tk="skip">⟳ Weiter</button></div>`;
      else mitte = `<div class="ts-modus">${MODI[s.modus][0]} <b>${MODI[s.modus][1]}</b></div>
          <div class="ts-karte act verdeckt" id="tsKarte"><div class="tk-wort">${esc(s.karte.wort)}</div><div class="tk-deckel">🃏 Gedrückt halten<small>nur die vortragende Person schaut!</small></div></div>
          <div class="ts-knoepfe">${s.laeuft ? '' : '<button class="btn primary" id="tsUhr">⏱ Zeit starten</button>'}<button class="btn ok" data-ak="ok">✓ Erraten!</button><button class="btn nein" data-ak="nein">✗ Nicht erraten</button><button class="btn" data-ak="neu">⟳ Andere Karte</button></div>`;
      body.innerHTML = `<section class="ts-stage" id="tsStage">
          <button class="auf-fs" id="tsFs" title="Vollbild">⛶</button>
          ${kopf}
          <div class="ts-uhr ${s.laeuft ? '' : 'aus'}"><div class="ts-zeit" id="tsZeit">${s.laeuft ? rest : W.zeit}</div><div class="auf-bar"><i id="tsBar" style="width:${s.laeuft ? rest / W.zeit * 100 : 100}%"></i></div></div>
          <div class="ts-mitte">${mitte}</div>
          ${art === 'tabu' && s.karte ? `<label class="chk small ts-verdeck"><input type="checkbox" id="tsVerdeckt" ${s.verdeckt ? 'checked' : ''}> Karte am Beamer verdecken (Erklärer:in schaut am Laptop oder auf dein Handy)</label>` : ''}
          ${art === 'tabu' && s.laeuft ? `<div class="ts-runde">Diese Runde: <b class="pos">${s.runde.ok} ✓</b> · <b class="neg">${s.runde.tabu} ✗</b> · ${s.runde.skip} ⟳</div>` : ''}
        </section>${einst}`;
      mod._iv = setInterval(() => {
        if (!s.laeuft) return;
        const r = Math.max(0, s.ende - Date.now() / 1000), z = body.querySelector('#tsZeit'), b = body.querySelector('#tsBar');
        if (z) { z.textContent = Math.ceil(r); z.classList.toggle('knapp', r <= 10); } if (b) b.style.width = r / W.zeit * 100 + '%';
        if (r <= 10 && r > 0 && Math.ceil(r) !== s._letzt) { s._letzt = Math.ceil(r); sound.tick(); }
        if (r <= 0) { s.laeuft = false; sound.gong(); rundeEnde(art); }
      }, 200);
    };
    const rundeEnde = art => {
      const s = S(), t = s.teams[s.dran];
      if (art === 'tabu') toast(`${t.emoji} ${t.name}: ${s.runde.ok - s.runde.tabu >= 0 ? '+' : ''}${s.runde.ok - s.runde.tabu} Punkte in dieser Runde`);
      else toast('⏰ Zeit ist um!');
      if (art === 'tabu') { s.karte = null; s.dran = (s.dran + 1) % s.teams.length; }
      teamSpiel(art);
    };

    /* ================= Stadt-Land-Fluss ================= */
    const SLF_VORLAGEN = {
      klassisch: ['Klassisch', 'Stadt\nLand\nFluss\nName\nTier\nBeruf'],
      gw: ['Geographie', 'Land\nHauptstadt\nGebirge / Berg\nGewässer\nWirtschaftszweig\nProdukt'],
      deutsch: ['Deutsch', 'Nomen\nVerb\nAdjektiv\nVorname\nFremdwort\nGegenstand im Klassenzimmer'],
      englisch: ['Englisch', 'Animal\nFood\nJob\nVerb\nCountry\nThing at home'],
    };
    const SLF_BUCHSTABEN = 'ABCDEFGHIJKLMNOPRSTUVWZ'.split('');
    const S2 = (W.slf ||= { kats: SLF_VORLAGEN.klassisch[1], zeit: 120, benutzt: [] });
    const slfKats = () => S2.kats.split('\n').map(x => x.trim()).filter(Boolean);
    const slf = () => {
      const r = (mod._slf ||= { b: null, ende: 0, laeuft: false, rollt: false });
      body.innerHTML = `<div class="side-layout">
        <aside class="card side">
          <h3>Kategorien</h3>
          <div class="qr-chips">${Object.entries(SLF_VORLAGEN).map(([k, [n]]) => `<button data-slfv="${k}">${n}</button>`).join('')}</div>
          <textarea data-slf="kats" rows="7">${esc(S2.kats)}</textarea>
          <label class="f">Zeit <select data-slf="zeit">${[60, 90, 120, 180, 240, 0].map(s => `<option value="${s}" ${S2.zeit === s ? 'selected' : ''}>${s ? (s >= 60 ? s / 60 + ' min' : s + ' s') : 'ohne Zeit'}</option>`).join('')}</select></label>
          <button class="btn full" id="slfDruck">🖨 Spielblatt drucken</button>
          <p class="muted small">Punkte: 20 = als Einzige:r in der Spalte · 10 = eigenes Wort · 5 = gleiches Wort wie andere.</p>
          ${S2.benutzt.length ? `<p class="small">Schon gezogen: <b>${S2.benutzt.join(' ')}</b> <button class="linkbtn" id="slfReset">zurücksetzen</button></p>` : ''}
        </aside>
        <section class="slf-stage" id="slfStage"><button class="auf-fs" id="slfFs" title="Vollbild">⛶</button>
          <div class="slf-buchstabe ${r.rollt ? 'rollt' : ''}" id="slfB">${r.b || '?'}</div>
          <div class="slf-kats">${slfKats().map(k => `<span>${esc(k)}</span>`).join('')}</div>
          ${S2.zeit ? `<div class="ts-uhr ${r.laeuft ? '' : 'aus'}"><div class="ts-zeit" id="slfZeit">${S2.zeit}</div><div class="auf-bar"><i id="slfBar"></i></div></div>` : ''}
          <div class="ts-knoepfe"><button class="btn primary huge" id="slfZiehen">🎲 Buchstabe ziehen</button>${r.b ? '<button class="btn nein big" id="slfStopp">✋ Stopp!</button>' : ''}</div>
        </section></div>`;
    };
    const slfZiehen = () => {
      const r = mod._slf, frei = SLF_BUCHSTABEN.filter(b => !S2.benutzt.includes(b)), ziel = (frei.length ? frei : SLF_BUCHSTABEN)[Math.floor(Math.random() * (frei.length || SLF_BUCHSTABEN.length))];
      r.rollt = true; r.laeuft = false; let n = 0;
      const dreh = () => {
        const el = body.querySelector('#slfB'); if (!el) return;
        if (n++ < 18) { el.textContent = SLF_BUCHSTABEN[Math.floor(Math.random() * SLF_BUCHSTABEN.length)]; tone(500 + n * 25, 0.04, 'square', 0.05); setTimeout(dreh, 40 + n * 9); return; }
        r.b = ziel; r.rollt = false; S2.benutzt = [...S2.benutzt.filter(b => b !== ziel), ziel]; save(); sound.tada();
        if (S2.zeit) { r.laeuft = true; r.ende = Date.now() / 1000 + S2.zeit; }
        slf();
      };
      dreh();
    };
    const slfDruck = () => {
      const k = slfKats(), zeilen = 10;
      druckFenster('Stadt-Land-Fluss', druckKopf('Stadt · Land · Fluss', 'Name: ______________________', 'Spielblatt')
        + `<table class="slf-blatt"><thead><tr><th style="width:9%">Buchstabe</th>${k.map(x => `<th>${esc(x)}</th>`).join('')}<th style="width:8%" class="r">Punkte</th></tr></thead>
          <tbody>${Array.from({ length: zeilen }, () => `<tr>${'<td></td>'.repeat(k.length + 2)}</tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="${k.length + 1}" class="r"><b>Summe</b></td><td></td></tr></tfoot></table>
          <div class="hinweis">20 Punkte = als Einzige:r in der Spalte · 10 Punkte = eigenes Wort · 5 Punkte = gleiches Wort wie andere · 0 = kein Wort</div>
          <style>.slf-blatt td { height: 13mm; border: .6pt solid #c7c7cc; } .slf-blatt th { border: .6pt solid #c7c7cc; text-transform: none; font-size: 9pt; color: #1d1d1f; } .slf-blatt tbody tr:nth-child(even) td { background: none; }</style>`, { quer: true });
    };

    /* ================= Wer bin ich? ================= */
    const PERSONEN = 'Mozart, Albert Einstein, Maria Theresia, Kaiserin Sisi, Christoph Kolumbus, Leonardo da Vinci, Marie Curie, Harry Potter, Pippi Langstrumpf, SpongeBob, Lionel Messi, Arnold Schwarzenegger, Marcel Hirscher, Napoleon, Kleopatra, Rotkäppchen, Pinocchio, Asterix, Mickey Mouse, Elsa (Die Eiskönigin), Batman, Sherlock Holmes, Columbo, Beethoven, Galileo Galilei';
    const werQuellen = () => ({ personen: ['Berühmte Personen & Figuren', PERSONEN.split(',').map(x => x.trim())], tiere: ['Tiere', WORTLISTEN.tiere.w.split(' ')], berufe: ['Berufe', WORTLISTEN.berufe.w.split(' ')],
      karten: ['Tabu-Karten (Begriffe)', alleKarten().map(k => k.wort)], eigene: ['Eigene Liste', (W.werEigene || '').split(/[\n,]/).map(x => x.trim()).filter(Boolean)] });
    const werBinIch = () => {
      const r = (mod._wer ||= { wort: null, fragen: 0, offen: false, stapel: [], runden: [] }), Q = werQuellen(), quelle = W.werQuelle || 'personen';
      body.innerHTML = `<div class="side-layout">
        <aside class="card side">
          <h3>Begriffe aus</h3>
          <select id="werQ">${Object.entries(Q).map(([k, [n, l]]) => `<option value="${k}" ${quelle === k ? 'selected' : ''}>${n} (${l.length})</option>`).join('')}</select>
          ${quelle === 'eigene' ? `<textarea id="werEigene" rows="6" placeholder="Ein Begriff pro Zeile">${esc(W.werEigene || '')}</textarea>` : ''}
          <p class="muted small"><b>So geht’s:</b> Ein Kind sitzt mit dem Rücken zur Tafel. Es stellt Fragen, die man nur mit <b>Ja</b> oder <b>Nein</b> beantworten kann – die Klasse antwortet. Du zählst die Fragen mit. Höchstens 20 Fragen!</p>
          ${r.runden.length ? `<h3>Runden</h3><ul class="bel-log">${r.runden.slice(-8).reverse().map(x => `<li>${x.erraten ? '🎉' : '–'} ${esc(x.wort)} <span class="muted">${x.fragen} Fragen</span></li>`).join('')}</ul>` : ''}
        </aside>
        <section class="slf-stage wer" id="werStage"><button class="auf-fs" id="werFs" title="Vollbild">⛶</button>
          ${!r.wort ? `<div class="qb-start"><div class="qk-erd">🤔</div><button class="btn primary huge" id="werNeu">Karte ziehen</button></div>`
          : !r.offen ? `<div class="qb-start"><div class="wer-deckel">🙈</div><p class="qk-regel">Das Ratekind setzt sich mit dem Rücken zur Tafel …</p><button class="btn primary huge" id="werAuf">Aufdecken</button></div>`
          : `<div class="wer-karte">${esc(r.wort)}</div>
            <div class="wer-zaehler"><span>Fragen</span><b class="${r.fragen >= 17 ? 'knapp' : ''}">${r.fragen}</b><span>von 20</span></div>
            <div class="ts-knoepfe"><button class="btn big" id="werMinus">−</button><button class="btn primary huge" id="werPlus">+1 Frage</button>
              <button class="btn ok big" id="werJa">🎉 Erraten!</button><button class="btn big" id="werNein">Auflösen / Nächste</button></div>`}
        </section></div>`;
    };
    const werNeu = () => {
      const r = mod._wer, liste = werQuellen()[W.werQuelle || 'personen'][1];
      if (!liste.length) return toast('Die Liste ist leer');
      if (!r.stapel.length) r.stapel = shuffle(liste);
      r.wort = r.stapel.pop(); r.fragen = 0; r.offen = false; werBinIch();
    };

    /* ================= Eigene Wörter ================= */
    const karten = () => {
      body.innerHTML = `<div class="split2">
        <section class="card"><h2>Eigene Tabu- & Activity-Karten</h2>
          <p class="muted small">Eine Karte pro Zeile: <code>Begriff: verboten, verboten, verboten</code> – die verbotenen Wörter sind nur für Tabu nötig. Passt gut zum aktuellen Stoff (z.B. Fachbegriffe)!</p>
          <textarea rows="14" data-ww="karten" placeholder="Photosynthese: Pflanze, Licht, grün, Sauerstoff\nSubjekt: Satz, Prädikat, wer, Satzglied">${esc(W.karten)}</textarea>
          <p class="muted small">${kartenAus(W.karten).length} eigene + ${kartenAus(TABU_KARTEN).length} eingebaute Karten</p></section>
        <section class="card"><h2>Eigene Wörter für Galgenmännchen</h2>
          <p class="muted small">Mit Komma oder pro Zeile – dann im Galgenmännchen „Eigene Liste“ wählen.</p>
          <textarea rows="14" data-ww="woerter" placeholder="Mitochondrium, Konjunktiv, Äquator …">${esc(W.woerter)}</textarea></section></div>`;
    };

    /* ================= Ereignisse ================= */
    el.addEventListener('click', e => {
      const t = e.target, s = mod._ss?.[mod._tab];
      const tb = t.closest('[data-wtab]'); if (tb) { mod._tab = tb.dataset.wtab; Object.values(mod._ss || {}).forEach(x => { x.laeuft = false; x.karte = null; }); draw(); return; }
      if (t.closest('#gmFs, #tsFs')) { const st = el.querySelector('#gmStage, #tsStage'); document.fullscreenElement ? document.exitFullscreen() : st?.requestFullscreen?.(); return; }
      if (t.closest('#slfFs, #werFs')) { const st = el.querySelector('#slfStage, #werStage'); document.fullscreenElement ? document.exitFullscreen() : st?.requestFullscreen?.(); return; }
      // Stadt-Land-Fluss
      const sv = t.closest('[data-slfv]'); if (sv) { S2.kats = SLF_VORLAGEN[sv.dataset.slfv][1]; save(); slf(); return; }
      if (t.id === 'slfZiehen') { slfZiehen(); return; }
      if (t.id === 'slfStopp') { mod._slf.laeuft = false; sound.gong(); slf(); toast('✋ Stopp! Stifte weg.'); return; }
      if (t.id === 'slfDruck') { slfDruck(); return; }
      if (t.id === 'slfReset') { S2.benutzt = []; save(); slf(); return; }
      // Wer bin ich?
      if (t.id === 'werNeu') { werNeu(); return; }
      if (t.id === 'werAuf') { mod._wer.offen = true; werBinIch(); return; }
      if (t.id === 'werPlus' || t.id === 'werMinus') { const r = mod._wer; r.fragen = Math.max(0, r.fragen + (t.id === 'werPlus' ? 1 : -1)); if (r.fragen === 20) { sound.gong(); toast('20 Fragen – letzte Chance!'); } else tone(600, 0.06, 'triangle', 0.1); werBinIch(); return; }
      if (t.id === 'werJa' || t.id === 'werNein') { const r = mod._wer; r.runden.push({ wort: r.wort, fragen: r.fragen, erraten: t.id === 'werJa' }); if (t.id === 'werJa') { sound.tada(); confetti(80); } else toast('Es war: ' + r.wort); werNeu(); return; }
      // Galgenmännchen
      const mo = t.closest('[data-motiv]'); if (mo) { W.motiv = mo.dataset.motiv; save(); galgen(); return; }
      const bu = t.closest('[data-b]'); if (bu) { raten(bu.dataset.b); return; }
      if (t.id === 'gmZufall' || t.id === 'gmNochmal') { if (t.id === 'gmNochmal' && W.liste === 'eigene' && !W.woerter.trim()) { mod._g = null; galgen(); return; } zufallsWort(); return; }
      if (t.id === 'gmAufloesen') { mod._g.ende = 'verloren'; galgen(); return; }
      // Teams
      const pk = t.closest('[data-pkt]'); if (pk) { const [i, n] = pk.dataset.pkt.split('|').map(Number); S().teams[i].score += n; teamSpiel(mod._tab); return; }
      if (t.id === 'tsGruppen') { const x = S(); x.teams = gruppenAlsTeams(); x.dran = letzteGruppen()?.beginnt ?? 0; x.laeuft = false; x.karte = null; teamSpiel(mod._tab); toast('Teams übernommen'); return; }
      if (t.id === 'tsReset') { delete mod._ss[mod._tab]; teamSpiel(mod._tab); return; }
      if (t.id === 'tsLos') {
        const x = S(); ziehen();
        if (mod._tab === 'tabu') { x.laeuft = true; x.ende = Date.now() / 1000 + W.zeit; x.runde = { ok: 0, tabu: 0, skip: 0 }; sound.tada(); }
        teamSpiel(mod._tab); return;
      }
      if (t.id === 'tsUhr') { s.laeuft = true; s.ende = Date.now() / 1000 + W.zeit; sound.tada(); teamSpiel(mod._tab); return; }
      const tk = t.closest('[data-tk]');
      if (tk && s?.laeuft) {
        const team = s.teams[s.dran], a = tk.dataset.tk;
        if (a === 'ok') { team.score++; s.runde.ok++; tone(880, 0.15, 'triangle', 0.2); }
        if (a === 'tabu') { team.score--; s.runde.tabu++; tone(150, 0.4, 'sawtooth', 0.15); }
        if (a === 'skip') { s.runde.skip++; sweep(500, 300, 0.15, 'sine', 0.1); }
        ziehen(); teamSpiel('tabu'); return;
      }
      const ak = t.closest('[data-ak]');
      if (ak && s) {
        const a = ak.dataset.ak;
        if (a === 'neu') { ziehen(); teamSpiel('activity'); return; }
        if (a === 'ok') { s.teams[s.dran].score++; sound.tada(); confetti(60); }
        else tone(160, 0.4, 'sawtooth', 0.12);
        s.laeuft = false; s.karte = null; s.dran = (s.dran + 1) % s.teams.length; teamSpiel('activity');
      }
    });
    // Karte nur ansehen, solange gedrückt
    el.addEventListener('pointerdown', e => { const k = e.target.closest('#tsKarte.verdeckt'); if (k) { k.classList.add('offen'); e.preventDefault(); } });
    this._hoch = () => el.querySelectorAll('#tsKarte.offen').forEach(k => k.classList.remove('offen'));
    document.addEventListener('pointerup', this._hoch); document.addEventListener('pointercancel', this._hoch);
    el.addEventListener('submit', e => {
      if (e.target.id !== 'gmEigen') return; e.preventDefault();
      const w = e.target.w.value.trim(); if (!/[A-Za-zÄÖÜäöüß]/.test(w)) return toast('Bitte ein Wort eingeben');
      neuesWort(w, e.target.h.value.trim());
    });
    el.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'gmListe') { W.liste = t.value; save(); return; }
      if (t.dataset.slf === 'zeit') { S2.zeit = +t.value; save(); slf(); return; }
      if (t.id === 'werQ') { W.werQuelle = t.value; mod._wer.stapel = []; save(); werBinIch(); return; }
      if (t.id === 'tsVerdeckt') { S().verdeckt = t.checked; teamSpiel('tabu'); return; }
      if (t.dataset.w) { W[t.dataset.w] = t.dataset.w === 'stil' ? t.value : +t.value; save(); if (t.dataset.w !== 'zeit') { const alt = S().teams; S().teams = teamsNeu().map((x, i) => ({ ...x, score: alt[i]?.score || 0 })); } teamSpiel(mod._tab); el.querySelector('.ts-einst').open = true; return; }
      if (t.dataset.modus) { W.modi = [...el.querySelectorAll('[data-modus]:checked')].map(c => c.dataset.modus); save(); return; }
    });
    el.addEventListener('input', e => {
      const k = e.target.dataset.ww; if (k) { W[k] = e.target.value; save(); }
      if (e.target.dataset.slf === 'kats') { S2.kats = e.target.value; save(); const box = el.querySelector('.slf-kats'); if (box) box.innerHTML = slfKats().map(x => `<span>${esc(x)}</span>`).join(''); }
      if (e.target.id === 'werEigene') { W.werEigene = e.target.value; mod._wer.stapel = []; save(); }
    });
    // Zeit bei Stadt-Land-Fluss
    const slfTick = () => {
      const r = mod._slf; if (!r?.laeuft) return;
      const rest = Math.max(0, r.ende - Date.now() / 1000), z = el.querySelector('#slfZeit'), b = el.querySelector('#slfBar');
      if (z) { z.textContent = Math.ceil(rest); z.classList.toggle('knapp', rest <= 10); } if (b) b.style.width = rest / S2.zeit * 100 + '%';
      if (rest <= 0) { r.laeuft = false; sound.gong(); toast('⏰ Zeit ist um – Stifte weg!'); slf(); }
    };
    // Tastatur fürs Galgenmännchen
    this._key = e => {
      if (mod._tab !== 'galgen' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.metaKey || e.ctrlKey) return;
      const c = e.key.length === 1 ? gross(e.key) : ''; if (ALPHABET.includes(c)) { e.preventDefault(); raten(c); }
    };
    document.addEventListener('keydown', this._key);
    draw();
  },
  destroy() {
    clearInterval(this._iv); document.removeEventListener('keydown', this._key);
    document.removeEventListener('pointerup', this._hoch); document.removeEventListener('pointercancel', this._hoch);
    Object.values(this._ss || {}).forEach(x => { x.laeuft = false; });
  },
});
