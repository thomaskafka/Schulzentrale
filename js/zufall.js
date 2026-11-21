'use strict';
/* ===== Glücksrad, Würfel, Zufallszahl ===== */

registerModule({
  id: 'zufall', title: 'Glücksrad & Würfel', icon: '🎡',
  render(el) {
    const mod = this;
    mod._tab ||= 'rad';
    el.innerHTML = `<div class="page">
      <div class="pagehead">${seitenTitel('rad', '#000', 'Glücksrad & Würfel')}
        <nav class="tabs inline" id="zTabs"><button data-tab="rad">Glücksrad</button><button data-tab="wuerfel">Würfel</button><button data-tab="zahl">Zufallszahl</button></nav>
      </div><div id="zBody"></div></div>`;
    let body = el.querySelector('#zBody');
    const draw = () => {
      mod.destroy();
      const fresh = body.cloneNode(false); body.replaceWith(fresh); body = fresh; // alte Listener weg
      el.querySelectorAll('#zTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === mod._tab));
      ({ rad: radTab, wuerfel: wuerfelTab, zahl: zahlTab })[mod._tab](body, mod);
    };
    el.querySelector('#zTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { mod._tab = b.dataset.tab; draw(); } });
    draw();
  },
  destroy() {
    cancelAnimationFrame(this._raf);
    clearInterval(this._blink);
    if (this._wKey) { document.removeEventListener('keydown', this._wKey); this._wKey = null; }
    if (this._onResize) window.removeEventListener('resize', this._onResize);
  },
});

/* ---------- Glücksrad-Designs ---------- */
const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif";
const RAD_DESIGNS = {
  bunt: {
    name: 'Bunt', rand: 6, leer: '#f3f4f6', schrift: 'Nunito, sans-serif', gewicht: 800,
    rahmen(ctx, c, r) { ctx.beginPath(); ctx.arc(c, c, r + 4, 0, 7); ctx.fillStyle = '#1f2937'; ctx.fill(); },
    feld: (i, n) => COLORS[(i + (n % COLORS.length === 1 && i === n - 1 ? 2 : 0)) % COLORS.length],
    linie(ctx) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; },
    text: () => '#fff',
    textSchatten(ctx) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 3; },
    vorne(ctx, c, r, rot, seg, n) {
      for (let i = 0; i < Math.min(n, 40); i++) { const a = rot + i * seg; ctx.beginPath(); ctx.arc(c + Math.cos(a) * (r - 1), c + Math.sin(a) * (r - 1), 3.5, 0, 7); ctx.fillStyle = '#fde68a'; ctx.fill(); }
    },
  },
  silber: {
    name: 'Silber', rand: 16, leer: '#f5f5f7', schrift: SF, gewicht: 600,
    rahmen(ctx, c, r) {
      const g = ctx.createLinearGradient(0, 0, 0, c * 2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.45, '#d1d1d6'); g.addColorStop(1, '#8e8e93');
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.beginPath(); ctx.arc(c, c, r + 14, 0, 7); ctx.fillStyle = g; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(c, c, r + 2, 0, 7); ctx.fillStyle = '#c7c7cc'; ctx.fill();
    },
    feld: (i, n) => ['#ffffff', '#f0f0f3', '#e3e3e8', '#d6d6db'][(i + (n % 4 === 1 && i === n - 1 ? 1 : 0)) % 4],
    linie(ctx) { ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; },
    text: () => '#1d1d1f',
    textSchatten() {},
  },
  neon: {
    name: 'Neon', rand: 10, leer: '#0b0b14', schrift: SF, gewicht: 700,
    farben: ['#00e5ff', '#ff2bd6', '#7cff4f', '#ffd60a', '#a46bff', '#ff6b3d'],
    rahmen(ctx, c, r) {
      ctx.beginPath(); ctx.arc(c, c, r + 8, 0, 7); ctx.fillStyle = '#05050a'; ctx.fill();
      ctx.save(); ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 26; ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(c, c, r + 4, 0, 7); ctx.stroke(); ctx.restore();
    },
    feld: i => i % 2 ? '#0d0d19' : '#141428',
    linie(ctx, i) { const f = this.farben[i % 6]; ctx.strokeStyle = f; ctx.lineWidth = 2; ctx.shadowColor = f; ctx.shadowBlur = 10; },
    text(i) { return this.farben[i % 6]; },
    textSchatten(ctx, i) { ctx.shadowColor = this.farben[i % 6]; ctx.shadowBlur = 12; },
  },
  show: {
    name: 'Show', rand: 28, leer: '#1a1a2e', schrift: SF, gewicht: 800, animiert: true,
    farben: ['#c1121f', '#f4a300', '#1d4ed8', '#15803d', '#6d28d9', '#e85d04'],
    rahmen(ctx, c, r) {
      const g = ctx.createRadialGradient(c, c, r, c, c, r + 26);
      g.addColorStop(0, '#6b4e0e'); g.addColorStop(.35, '#f6d365'); g.addColorStop(.7, '#c99a2e'); g.addColorStop(1, '#5c430c');
      ctx.beginPath(); ctx.arc(c, c, r + 26, 0, 7); ctx.fillStyle = g; ctx.fill();
    },
    feld(i, n) { return this.farben[(i + (n % 6 === 1 && i === n - 1 ? 2 : 0)) % 6]; },
    linie(ctx) { ctx.strokeStyle = '#f6d365'; ctx.lineWidth = 3; },
    text: () => '#fff',
    textSchatten(ctx) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 4; },
    vorne(ctx, c, r, rot, seg, n, now) { // blinkende Glühbirnen
      const k = 24, an = Math.floor(now / 450) % 2;
      for (let i = 0; i < k; i++) {
        const a = i / k * Math.PI * 2, x = c + Math.cos(a) * (r + 13), y = c + Math.sin(a) * (r + 13), hell = i % 2 === an;
        ctx.save(); if (hell) { ctx.shadowColor = '#fff3b0'; ctx.shadowBlur = 16; }
        ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7); ctx.fillStyle = hell ? '#fffbe6' : '#8a6514'; ctx.fill(); ctx.restore();
      }
    },
  },
};
state.radDesign ||= 'bunt';

/* ---------- Glücksrad ---------- */
const radSession = { quelle: 'klasse', entfernen: false, removed: new Set(), hist: [] };

function radTab(body, mod) {
  const R = radSession;
  body.innerHTML = `<div class="side-layout rev">
    <section class="rad-stage" id="rStage">
      <div class="rad-box"><div class="rad-pointer"></div><canvas id="rc"></canvas><button id="rSpin" class="spin-btn">DREH!</button></div>
    </section>
    <aside class="card side">
      <div class="seg" id="rSrc"><button data-src="klasse">Namen der Klasse</button><button data-src="liste">Eigene Liste</button></div>
      <div id="rSrcBox"></div>
      <label class="chk"><input type="checkbox" id="rRem" ${R.entfernen ? 'checked' : ''}> Gezogene aus dem Rad nehmen</label>
      <h3>Darstellung</h3>
      <div class="seg" id="rDesign">${Object.entries(RAD_DESIGNS).map(([k, d]) => `<button data-design="${k}">${d.name}</button>`).join('')}</div>
      <button class="btn full" id="rReset">↺ Alle wieder ins Rad</button>
      <div class="hist" id="rHist"></div>
    </aside></div>`;
  const $ = id => body.querySelector('#' + id);
  const cv = $('rc'), ctx = cv.getContext('2d');
  let rot = 0, spinning = false, items = [], size = 400;

  const loadItems = () => {
    if (R.quelle === 'klasse') {
      const k = aktKlasse(); const an = k ? anwesende(k) : [];
      const kn = kurzNamen(schuelerVon(k));
      items = an.map(s => ({ key: s.id, label: kn[s.id] }));
    } else {
      items = state.radListe.split('\n').map(x => x.trim()).filter(Boolean).map((l, i) => ({ key: 'l' + i + l, label: l }));
    }
    items = items.filter(x => !R.removed.has(x.key));
  };
  const srcBox = () => {
    el$('#rSrc button', b => b.classList.toggle('on', b.dataset.src === R.quelle));
    const box = $('rSrcBox'); box.innerHTML = '';
    if (R.quelle === 'klasse') {
      box.appendChild(klassenSelect(() => { R.removed.clear(); srcBox(); loadItems(); drawWheel(); }));
      const k = aktKlasse(); if (k) box.appendChild(anwesenheitWidget(k, () => { loadItems(); drawWheel(); }));
    } else {
      box.innerHTML = `<label class="muted small">Ein Eintrag pro Zeile</label><textarea id="rList" rows="8">${esc(state.radListe)}</textarea>`;
      $('rList').addEventListener('input', e => { state.radListe = e.target.value; save(); R.removed.clear(); loadItems(); drawWheel(); });
    }
  };
  const el$ = (sel, fn) => body.querySelectorAll(sel).forEach(fn);

  const idxAt = r => {
    const n = items.length, seg = 2 * Math.PI / n;
    const a = (((-Math.PI / 2 - r) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor(a / seg) % n;
  };
  const resize = () => {
    const st = $('rStage'); if (!st) return;
    size = Math.max(260, Math.min(st.clientWidth - 20, window.innerHeight - 240, 680));
    const dpr = window.devicePixelRatio || 1;
    cv.width = cv.height = size * dpr; cv.style.width = cv.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel();
  };
  const drawWheel = () => {
    const D = RAD_DESIGNS[state.radDesign] || RAD_DESIGNS.bunt, now = performance.now();
    const c = size / 2, n = items.length, r = c - D.rand;
    $('rStage').dataset.design = RAD_DESIGNS[state.radDesign] ? state.radDesign : 'bunt';
    ctx.clearRect(0, 0, size, size);
    D.rahmen(ctx, c, r, now);
    if (!n) {
      ctx.beginPath(); ctx.arc(c, c, r, 0, 2 * Math.PI); ctx.fillStyle = D.leer; ctx.fill();
      ctx.fillStyle = '#8e8e93'; ctx.font = '600 20px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Keine Einträge', c, c + r / 2);
      return;
    }
    const seg = 2 * Math.PI / n;
    const fs = Math.max(11, Math.min(30, (r * seg) * 0.42, 34 - n * 0.5));
    for (let i = 0; i < n; i++) {
      const a0 = rot + i * seg;
      ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a0 + seg); ctx.closePath();
      ctx.fillStyle = D.feld(i, n, ctx, c, r); ctx.fill();
      ctx.save(); D.linie(ctx, i); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + seg / 2);
      ctx.fillStyle = D.text(i, n); ctx.font = `${D.gewicht} ${fs}px ${D.schrift}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      D.textSchatten(ctx, i);
      let t = items[i].label; const maxW = r * 0.68;
      while (ctx.measureText(t).width > maxW && t.length > 2) t = t.slice(0, -2) + '…';
      ctx.fillText(t, r - 16, 1); ctx.restore();
    }
    D.vorne && D.vorne(ctx, c, r, rot, seg, n, now);
  };
  clearInterval(mod._blink); // Lichter (Show-Design) blinken auch im Stillstand
  mod._blink = setInterval(() => { if (!spinning && RAD_DESIGNS[state.radDesign]?.animiert) drawWheel(); }, 450);
  const spin = () => {
    if (spinning || !items.length) return;
    audio(); spinning = true;
    const start = rot, delta = 2 * Math.PI * (5 + Math.random() * 3) + Math.random() * 2 * Math.PI;
    const dur = 4200 + Math.random() * 1600, t0 = performance.now();
    let last = idxAt(rot);
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      rot = start + delta * e; drawWheel();
      const id = idxAt(rot); if (id !== last) { sound.tick(); last = id; }
      if (p < 1) mod._raf = requestAnimationFrame(step); else done();
    };
    mod._raf = requestAnimationFrame(step);
  };
  const done = () => {
    spinning = false;
    const win = items[idxAt(rot)];
    R.hist.unshift(win.label); R.hist = R.hist.slice(0, 12);
    sound.tada(); if (['bunt', 'show'].includes(RAD_DESIGNS[state.radDesign] ? state.radDesign : 'bunt')) confetti(90);
    const pop = document.createElement('div');
    const dsg = RAD_DESIGNS[state.radDesign] ? state.radDesign : 'bunt';
    pop.className = 'result-pop rp-' + dsg;
    pop.innerHTML = `<div class="rp-card"><div class="muted">${{ bunt: '🎉 Das Rad hat entschieden:', silber: 'Ausgewählt', neon: 'Das Rad hat entschieden', show: '★ Und der Gewinner ist ★' }[dsg]}</div><div class="rp-name">${esc(win.label)}</div><div class="muted small">Klicken zum Schließen</div></div>`;
    pop.onclick = () => { pop.remove(); if (R.entfernen) { R.removed.add(win.key); loadItems(); drawWheel(); } };
    document.body.appendChild(pop);
    drawHist();
  };
  const designKnoepfe = () => body.querySelectorAll('[data-design]').forEach(b => b.classList.toggle('on', b.dataset.design === state.radDesign));
  const drawHist = () => { $('rHist').innerHTML = R.hist.length ? `<h4>Zuletzt gezogen</h4><ol>${R.hist.map(h => `<li>${esc(h)}</li>`).join('')}</ol>` : ''; };

  body.addEventListener('click', e => {
    const s = e.target.closest('[data-src]'); if (s) { R.quelle = s.dataset.src; R.removed.clear(); srcBox(); loadItems(); drawWheel(); }
    if (e.target.id === 'rSpin') spin();
    if (e.target.id === 'rReset') { R.removed.clear(); loadItems(); drawWheel(); }
    const ds = e.target.closest('[data-design]'); if (ds) { state.radDesign = ds.dataset.design; save(); designKnoepfe(); drawWheel(); }
  });
  $('rRem').addEventListener('change', e => R.entfernen = e.target.checked);
  mod._onResize = resize; window.addEventListener('resize', resize);
  srcBox(); loadItems(); drawHist(); designKnoepfe(); resize();
  document.fonts && document.fonts.ready.then(() => drawWheel());
}

/* ---------- Würfel (3D) ---------- */
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const WFARBEN = { weiss: 'Elfenbein', schwarz: 'Schwarz', rot: 'Rot', blau: 'Blau' };
const ZIEL = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] }; // Drehung, damit die Zahl vorne liegt
const wuerfel3d = (i) => `<div class="w3d-wrap" data-i="${i}"><div class="w3d">${[1, 2, 3, 4, 5, 6].map(v => `<div class="w3f f${v}">${Array.from({ length: 9 }, (_, k) => `<i class="${PIPS[v].includes(k) ? 'on' : ''}"></i>`).join('')}</div>`).join('')}</div><div class="w3d-schatten"></div></div>`;
state.wuerfelFarbe ||= 'weiss';

function wuerfelTab(body) {
  let anz = 2, rolling = false;
  const dreh = [];
  body.innerHTML = `<div class="center-stage">
    <div class="row center wopts">
      <div class="seg" id="wAnz">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}">${n}</button>`).join('')}</div>
      <div class="seg" id="wFarbe">${Object.entries(WFARBEN).map(([k, n]) => `<button data-f="${k}">${n}</button>`).join('')}</div>
    </div>
    <div class="dice3d" id="wDice"></div>
    <div class="dsum" id="wSum">&nbsp;</div>
    <button class="btn primary huge" id="wGo">🎲 Würfeln</button>
    <p class="muted small">Tipp: Leertaste würfelt auch.</p></div>`;
  const $ = id => body.querySelector('#' + id);
  const aufbauen = () => {
    $('wDice').className = 'dice3d w-' + state.wuerfelFarbe;
    $('wDice').innerHTML = Array.from({ length: anz }, (_, i) => wuerfel3d(i)).join('');
    body.querySelectorAll('#wAnz button').forEach(b => b.classList.toggle('on', +b.dataset.n === anz));
    body.querySelectorAll('#wFarbe button').forEach(b => b.classList.toggle('on', b.dataset.f === state.wuerfelFarbe));
    // Startstellung leicht schräg
    body.querySelectorAll('.w3d').forEach((w, i) => { dreh[i] = { x: -18, y: 28 }; w.style.transform = `rotateX(-18deg) rotateY(28deg)`; });
    $('wSum').innerHTML = '&nbsp;';
  };
  const roll = () => {
    if (rolling) return; rolling = true; audio();
    const werte = Array.from({ length: anz }, () => 1 + Math.floor(Math.random() * 6));
    body.querySelectorAll('.w3d').forEach((w, i) => {
      const [zx, zy] = ZIEL[werte[i]], d = dreh[i];
      // immer vorwärts weiterdrehen: 2–3 volle Umdrehungen pro Achse
      const nx = Math.ceil((d.x + 720) / 360) * 360 + 360 * Math.floor(Math.random() * 2) + zx;
      const ny = Math.ceil((d.y + 720) / 360) * 360 + 360 * Math.floor(Math.random() * 2) + zy;
      dreh[i] = { x: nx, y: ny };
      w.style.transitionDuration = (1.1 + i * 0.12 + Math.random() * 0.2) + 's';
      w.style.transform = `rotateX(${nx}deg) rotateY(${ny}deg)`;
      const wrap = w.parentElement; wrap.classList.remove('wurf'); void wrap.offsetWidth; wrap.classList.add('wurf');
    });
    let n = 0; const iv = setInterval(() => { sound.tick(); if (++n > 9) clearInterval(iv); }, 100);
    setTimeout(() => {
      sound.pop(); rolling = false;
      $('wSum').innerHTML = anz > 1 ? `Summe: <b>${werte.reduce((a, b) => a + b, 0)}</b> <span class="muted">(${werte.join(' + ')})</span>` : `<b>${werte[0]}</b>`;
    }, 1500 + anz * 120);
  };
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-n]'); if (b) { anz = +b.dataset.n; aufbauen(); }
    const f = e.target.closest('[data-f]'); if (f) { state.wuerfelFarbe = f.dataset.f; save(); aufbauen(); }
    if (e.target.closest('#wGo')) roll();
  });
  const key = e => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && body.isConnected) { e.preventDefault(); roll(); } };
  document.addEventListener('keydown', key);
  Modules.zufall._wKey = key;
  aufbauen();
}

/* ---------- Zufallszahl ---------- */
function zahlTab(body) {
  body.innerHTML = `<div class="center-stage">
    <div class="row center"><label>von <input type="number" id="zVon" value="1" class="num"></label><label>bis <input type="number" id="zBis" value="25" class="num"></label></div>
    <div class="bignum" id="zOut">?</div>
    <button class="btn primary huge" id="zGo">🔢 Zahl ziehen</button></div>`;
  const $ = id => body.querySelector('#' + id);
  let busy = false;
  $('zGo').onclick = () => {
    if (busy) return;
    let a = parseInt($('zVon').value, 10), b = parseInt($('zBis').value, 10);
    if (isNaN(a) || isNaN(b)) return; if (a > b) [a, b] = [b, a];
    busy = true; audio(); let n = 0;
    const r = () => a + Math.floor(Math.random() * (b - a + 1));
    $('zOut').classList.remove('pop');
    const iv = setInterval(() => {
      $('zOut').textContent = r(); sound.tick();
      if (++n > 14) { clearInterval(iv); $('zOut').textContent = r(); $('zOut').classList.add('pop'); sound.pop(); busy = false; }
    }, 60);
  };
}
