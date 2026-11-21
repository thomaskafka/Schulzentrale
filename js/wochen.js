'use strict';
/* ===== Wochennotizen: pro Kurs und Woche ein Notizfeld – die Kurse kommen aus dem WebUntis-Stundenplan ===== */

state.wochennotizen ||= {};   // 'YYYY-MM-DD (Montag)|Kursschlüssel' → Text
const WN = state.wochennotizen;
const WN_FAECHER = { D: 'deutsch', E: 'englisch', M: 'mathematik', GW: 'geografie', GSP: 'geschichte', BU: 'biologie', PH: 'physik', CH: 'chemie',
  BE: 'bildnerische', ME: 'musik', RK: 'religion', BSP: 'bewegung', TEC: 'technik', DIGRU: 'digitale grundbildung', SSK: 'soziales' };

const wnMontag = d => { d = new Date(d); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
const wnIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* „1AB Deutsch“ → ['1A','1B'], „2A“ → ['2A'] */
const wnKlassenAusName = name => { const m = String(name).match(/^(\d)([A-Za-z]+)/); return m ? [...m[2].toUpperCase()].map(b => m[1] + b) : []; };
/* Passt ein Schulzentrale-Fach zum WebUntis-Kürzel? */
function wnFachPasst(fname, kuerzel) {
  const f = fname.toLowerCase(), k = kuerzel.toLowerCase(), lang = WN_FAECHER[kuerzel.toUpperCase()];
  return f === k || (lang && (f.startsWith(lang) || lang.startsWith(f)));
}
/* WebUntis-Stunde einem Kurs der Schulzentrale zuordnen (sonst eigener Schlüssel aus Fach + Klassen) */
function wnKurs(e) {
  const kuerzel = (e.titel || '').trim(), kl = [...new Set((e.info || '').split(/[;,\s]+/).filter(t => /^\d[A-Z]$/i.test(t)).map(t => t.toUpperCase()))].sort();
  for (const k of state.klassen) for (const f of k.faecher || []) {
    const kk = wnKlassenAusName(k.name).sort();
    if (wnFachPasst(f.name, kuerzel) && kk.length && kk.join() === kl.join()) {
      return { key: `${k.id}|${f.id}`, label: k.name.toLowerCase().includes(f.name.toLowerCase()) ? k.name : `${k.name} · ${f.name}`, sort: 0 };
    }
  }
  return { key: `u:${kuerzel}|${kl.join(' ')}`, label: `${kuerzel}${kl.length ? ' · ' + kl.join(' ') : ''}`, sort: 1 };
}

registerModule({
  id: 'wochen', title: 'Wochennotizen', icon: '📝',
  render(el) {
    const mod = this;
    // am Wochenende geht es gleich um die kommende Woche
    mod._montag ||= wnMontag(new Date(Date.now() + ([0, 6].includes(new Date().getDay()) ? 2 * 864e5 : 0)));
    el.innerHTML = `<div class="page wn">
      <div class="pagehead">${seitenTitel('woche', '#ff9500', 'Wochennotizen')}
        <div class="row"><button class="btn" data-w="-7">←</button><b class="wn-woche" id="wnWoche"></b><button class="btn" data-w="7">→</button>
          <button class="btn" data-w="0">Diese Woche</button><button class="btn" id="wnDruck">🖨</button></div></div>
      <div id="wnBody"><p class="muted">Stundenplan wird geladen …</p></div></div>`;
    const $ = id => el.querySelector('#' + id);
    let evs = null, geladen = false;

    const kurseDerWoche = () => {
      const von = mod._montag, bis = new Date(von); bis.setDate(bis.getDate() + 7);
      const m = new Map();
      (evs || []).filter(e => e.start >= von && e.start < bis && (e.titel || '').trim()).forEach(e => {
        const k = wnKurs(e);
        m.has(k.key) || m.set(k.key, { ...k, stunden: [] });
        m.get(k.key).stunden.push(e);
      });
      // ohne WebUntis (oder Ferienwoche ohne Stunden): alle Kurse der Schulzentrale anbieten
      if (!evs) state.klassen.forEach(k => (k.faecher || []).forEach(f => m.set(`${k.id}|${f.id}`, { key: `${k.id}|${f.id}`, label: k.name.toLowerCase().includes(f.name.toLowerCase()) ? k.name : `${k.name} · ${f.name}`, sort: 0, stunden: [] })));
      // Kurse mit Notizen in dieser Woche immer zeigen, auch wenn keine Stunde mehr im Plan steht
      Object.keys(WN).filter(x => x.startsWith(wnIso(von) + '|') && WN[x].trim()).forEach(x => {
        const key = x.slice(11); if (m.has(key)) return;
        const [kid, fid] = key.split('|'), k = klasse(kid), f = k?.faecher.find(y => y.id === fid);
        m.set(key, { key, label: k ? `${k.name}${f && !k.name.toLowerCase().includes(f.name.toLowerCase()) ? ' · ' + f.name : ''}` : key.replace(/^u:/, '').replace('|', ' · '), sort: 2, stunden: [] });
      });
      const reihe = state.klassen.map(k => k.id);
      // Montag bis Freitag: nach der ersten Stunde in der Woche (Tag, dann Uhrzeit)
      const erste = k => k.stunden.length ? Math.min(...k.stunden.map(e => e.start.getTime())) : Infinity;
      m.forEach(k => k.stunden.sort((a, b) => a.start - b.start));
      return [...m.values()].sort((a, b) => erste(a) - erste(b) || a.sort - b.sort || reihe.indexOf(a.key.split('|')[0]) - reihe.indexOf(b.key.split('|')[0]) || a.label.localeCompare(b.label, 'de'));
    };
    /* letzte frühere Woche mit Notiz zu diesem Kurs (auch wenn der Kurs nur jede zweite Woche ist) */
    const letzte = key => Object.keys(WN).filter(x => x.endsWith('|' + key) && x.slice(0, 10) < wnIso(mod._montag) && WN[x].trim()).sort().pop();
    const hoehe = t => { t.style.height = 'auto'; t.style.height = Math.max(96, t.scrollHeight + 2) + 'px'; };

    const draw = () => {
      const von = mod._montag, bis = new Date(von.getTime() + 4 * 864e5), heute = wnMontag(new Date()).getTime() === von.getTime();
      const kw = Math.ceil(((von - new Date(von.getFullYear(), 0, 1)) / 864e5 + new Date(von.getFullYear(), 0, 1).getDay() + 1) / 7);
      $('wnWoche').textContent = `${heute ? 'Diese Woche' : 'KW ' + kw} · ${von.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' })}–${bis.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' })}`;
      const kurse = kurseDerWoche(), w = wnIso(von), jetzt = new Date();
      if (!geladen) return;
      // immer die ganze Woche Montag–Freitag; ein Kurs mit mehreren Stunden steht an jedem dieser Tage (gleiche Notiz)
      const tage = !evs ? [['Alle Kurse', kurse]] : !kurse.length ? [] : [0, 1, 2, 3, 4].map(i => {
        const d = new Date(von.getTime() + i * 864e5), tagStd = k => k.stunden.find(e => e.start.toDateString() === d.toDateString());
        return [d.toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'numeric' }), kurse.filter(tagStd).sort((x, y) => tagStd(x).start - tagStd(y).start)];
      });
      const ohne = evs ? kurse.filter(k => !k.stunden.length) : [];
      if (ohne.length) tage.push(['Ohne Stunde in dieser Woche', ohne]);
      $('wnBody').innerHTML = `${!evs ? `<p class="muted small">${state.einstellungen.icalUrl ? '⚠️ Stundenplan nicht erreichbar – es werden alle Kurse gezeigt.' : 'Tipp: Mit WebUntis verbunden (Einstellungen) erscheinen hier genau die Kurse und Stunden der Woche.'}</p>` : ''}
        ${!kurse.length ? '<div class="card mat-leer"><b>Keine Stunden in dieser Woche</b><p class="muted">Ferien oder schulfrei? Mit → geht es zur nächsten Woche.</p></div>' : ''}
        ${tage.map(([tag, ks]) => `<section class="wn-tag"><h3>${tag}</h3>${ks.length ? '' : '<p class="muted small wn-frei">keine Stunden</p>'}<div class="wn-grid">${ks.map(k => {
          const lk = letzte(k.key), alt = lk ? WN[lk].trim() : '', altD = lk && new Date(lk.slice(0, 10) + 'T00:00').toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' });
          return `<div class="card wn-kurs" data-key="${esc(k.key)}">
            <div class="wn-kopf"><b>${esc(k.label)}</b><span class="wn-std">${k.stunden.map(e => `<span class="wn-chip ${e.art} ${e.end < jetzt ? 'vorbei' : ''}" title="${esc((ART_TXT[e.art] || '') + ' ' + (e.ort || '') + ' ' + (e.info || ''))}">${e.start.toLocaleDateString('de-AT', { weekday: 'short' })} ${Untis.zeit(e.start)}${e.art === 'entfall' ? ' ✕' : ''}</span>`).join('')}</span></div>
            <textarea data-n="${esc(k.key)}" placeholder="Ideen, Stoff, Material, HÜ, nicht vergessen …">${esc(WN[`${w}|${k.key}`] || '')}</textarea>
            ${alt ? `<details class="wn-alt"><summary>Letzte Notiz (Woche vom ${altD})</summary><p>${esc(alt).replace(/\n/g, '<br>')}</p><button class="btn klein" data-uebern="${esc(k.key)}">↪ in diese Woche übernehmen</button></details>` : ''}</div>`; }).join('')}</div></section>`).join('')}`;
      el.querySelectorAll('.wn-kurs textarea').forEach(hoehe);
    };
    const laden = async () => {
      try { evs = SERVER && state.einstellungen.icalUrl ? await Untis.laden() : null; } catch (e) { evs = null; }
      geladen = true; draw();
    };

    el.onclick = e => {
      const w = e.target.closest('[data-w]');
      if (w) { const d = +w.dataset.w; mod._montag = d ? new Date(mod._montag.getTime() + d * 864e5) : wnMontag(new Date()); mod._montag = wnMontag(mod._montag); return draw(); }
      const u = e.target.closest('[data-uebern]');
      if (u) {
        const key = u.dataset.uebern, ziel = `${wnIso(mod._montag)}|${key}`, alt = WN[letzte(key)] || '';
        WN[ziel] = [WN[ziel], alt].filter(x => x && x.trim()).join('\n'); save(); return draw();
      }
      if (e.target.id === 'wnDruck') {
        const w = wnIso(mod._montag), kurse = kurseDerWoche().filter(k => (WN[`${w}|${k.key}`] || '').trim());
        if (!kurse.length) return toast('In dieser Woche gibt es noch keine Notizen');
        druckFenster('Wochennotizen', druckKopf('Wochennotizen', $('wnWoche').textContent, '') + kurse.map(k => `<div class="block"><h3>${esc(k.label)}</h3><div style="font-size:10.5pt;line-height:1.5">${esc(WN[`${w}|${k.key}`]).replace(/\n/g, '<br>')}</div></div>`).join(''));
      }
    };
    el.oninput = e => {
      const t = e.target; if (!t.dataset.n) return;
      hoehe(t);
      // dieselbe Notiz steht bei mehreren Tagen – die anderen Felder gleich mitziehen
      el.querySelectorAll('textarea[data-n]').forEach(x => { if (x !== t && x.dataset.n === t.dataset.n) { x.value = t.value; hoehe(x); } });
      const k = `${wnIso(mod._montag)}|${t.dataset.n}`;
      if (t.value.trim()) WN[k] = t.value; else delete WN[k];
      clearTimeout(mod._t); mod._t = setTimeout(save, 400);
    };
    laden();
  },
  destroy() { if (this._t) { clearTimeout(this._t); save(); } },
});
