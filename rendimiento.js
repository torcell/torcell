/* ===== Rendimiento (archivo compartido) · panel, admin y oficina técnica usan esta misma copia ===== */
// @@rendimiento-comun
// Entrada: datos.cer = [{area, piso, m2, hecho, dia, w}] (una fila por partida de cerámica). Cada página arma el arreglo a su modo, el dibujo es uno solo.
// ===== estilos: se cargan solos junto con este archivo; rendimientoListo avisa cuando ya están puestos =====
window.rendimientoListo = new Promise(ok => {
  if(document.getElementById('rendimientoCss')) return ok();
  const l = document.createElement('link'); l.id = 'rendimientoCss'; l.rel = 'stylesheet'; l.href = 'rendimiento.css?v=2';
  l.onload = l.onerror = () => ok();
  const s0 = document.head.querySelector('style'); document.head.insertBefore(l, s0);   // antes de los estilos de la página, así ella puede ajustar lo suyo (cápsulas, temas)
});
const RD_AREA = {'Piso':'Piso', 'Muro':'Muro', 'Muro Baños':'Muro Baño', 'Muro Cocina':'Muro Cocina', 'Pasillos':'Pasillo'};
const leyLinea = (c, d, t) => '<span><svg width="22" height="8" aria-hidden="true"><line x1="0" x2="22" y1="4" y2="4" stroke="' + c + '" stroke-width="2.4"' + (d ? ' stroke-dasharray="' + d + '"' : '') + '/></svg>' + t + '</span>';
// ===== motivos de salida (el de la obra no resta al trabajador; 'otro' sí) =====
const AS_MOTIVOS = [['sin cancha', 'No hay cancha'], ['no hay agua', 'No hay agua'], ['no hay luz', 'No hay luz'], ['sin materiales', 'Sin materiales'], ['complicaciones', 'Otras complicaciones'], ['otro', 'Otro (del trabajador)']];
const asMotBase = m => String(m || '').split('|')[0];
const asMotDet = m => String(m || '').split('|').slice(1).join('|');
const asMotObra = m => { const b = asMotBase(m); return !!b && b !== 'otro'; };
const asMotTxt = m => { const b = asMotBase(m), t = (AS_MOTIVOS.find(x => x[0] === b) || [])[1] || '', d = asMotDet(m); return t.toLowerCase() + (d ? ': ' + d : ''); };
/* ===== Rendimiento por trabajador (compartido: panel y admin) ===== */
/* ===== Rendimiento por trabajador v64 (compartido: panel y admin) · semana / mes / total, con asistencia ===== */
const RD_MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const RD_MC = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function rdIso(d){ return d.toISOString().substring(0, 10); }
function rdFecha(s){ return new Date(s + 'T00:00:00Z'); }
function rdSuma(s, n){ const d = rdFecha(s); d.setUTCDate(d.getUTCDate() + n); return rdIso(d); }
function rdLunes(s){ const d = rdFecha(s); return rdSuma(s, -((d.getUTCDay() + 6) % 7)); }
// @@ritmo-lunes-viernes: el ritmo solo cuenta lunes a viernes; el sábado es avance extra y no entra al cálculo
function rdHabil(s){ const w = rdFecha(s).getUTCDay(); return w > 0 && w < 6; }
function rdHoy(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
/* ===== Rendimiento 2 · proyección de cerámica por semana y rendimiento semanal (sin asistencia) ===== */
// @@rend2-semanal
// @@proy-ultima-semana: en Rendimiento 2 el ritmo 1 = la última semana completa
const R2_INICIO = '2026-05-29', R2_FIN = '2027-01-01';   // semana 1 y término oficial
const R2_SOLO = ['Piso', 'Muro Baños'];
const r2E = {off: {'Muro': true}, ritmo: 0, solo: false, extra: 0};   // ritmo 0 = toda la obra; extra = trabajadores que se suman o restan al equipo   // solo: piso y muro baño, pisos 2 al 22
function renderRendimiento2(raiz, datos, esc){
  const fmt = n => (Math.round(n * 10) / 10).toLocaleString('es-CL');
  const fF = d => d.substring(8, 10) + '/' + d.substring(5, 7) + '/' + d.substring(0, 4);
  const corto = n => { const p = String(n).trim().split(/\s+/); return p[0] + (p[1] ? ' ' + p[1].charAt(0).toUpperCase() + '.' : ''); };
  const hoy = rdHoy(), lunHoy = rdLunes(hoy);
  const dias = (a, b) => Math.round((rdFecha(b) - rdFecha(a)) / 864e5);
  const nuevo = Date.now() < new Date('2026-11-30T23:59:59').getTime() ? ' <i class="tnuevo">Nuevo</i>' : '';
  const box = raiz.closest('.ovDin > div') || raiz.parentElement;
  const f1 = x => x.toFixed(1);
  function pintar(){
    const E = r2E, sem = {}, lv = {}, pt = {}, areas = [];
    let K = 0, hecho = 0, sinF = 0;
    // ===== el avance sale de cada partida: m² y día en que se marcó terminada =====
    (datos.cer || []).forEach(c => {
      const m = Number(c.m2); if(!(m > 0)) return;
      if(areas.indexOf(c.area) < 0) areas.push(c.area);
      if(E.solo ? !(R2_SOLO.indexOf(c.area) >= 0 && c.piso >= 2 && c.piso <= 22) : E.off[c.area]) return;
      K += m; if(!c.hecho) return; hecho += m;
      const d = c.dia || '';
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > hoy){ sinF += m; return; }
      const l = rdLunes(d); sem[l] = (sem[l] || 0) + m; if(rdHabil(d)) lv[l] = (lv[l] || 0) + m;
      if(c.w){ const o = pt[l] || (pt[l] = {}); o[c.w] = (o[c.w] || 0) + m; }
    });
    const orden = ['Piso', 'Muro Baños', 'Muro Cocina', 'Muro', 'Pasillos'];
    const ar = orden.filter(a => areas.indexOf(a) >= 0).concat(areas.filter(a => orden.indexOf(a) < 0));
    const lab = a => a === 'Muro' ? 'Piso -1' : (RD_AREA[a] || a);
    const fuera = E.solo ? [] : ar.filter(a => E.off[a]).map(lab);
    const cab = '<div class="rd-tit">Proyección · Cerámica por semana' + (E.solo ? ' · solo piso y muro baño, pisos 2 al 22' : '') + (fuera.length ? ' · sin ' + esc(fuera.join(', ')) : '') + nuevo + '</div>';
    const ctl = '<div class="py-caja"><div class="py-fc"><span class="py-cap">Filtro</span><div class="py-tabs" role="group" aria-label="Filtro de partidas"><button type="button" class="py-tab r2-tab' + (E.solo ? ' on' : '') + '" data-r2s="1" aria-pressed="' + E.solo + '">Solo piso y muro baño · pisos 2 al 22</button></div></div><div class="py-fc"><span class="py-cap">Partidas</span><div class="py-cks">' + ar.map(a => '<label class="py-ck"><input type="checkbox" data-r2a="' + esc(a) + '"' + (E.solo ? ' disabled' : '') + (E.off[a] ? '' : ' checked') + '><span>' + esc(lab(a)) + '</span></label>').join('') + '</div></div>'
      + '<div class="py-fc"><span class="py-cap">Ritmo</span><div class="py-tabs" role="group" aria-label="Semanas para calcular el ritmo">' + [[1, 'Última semana <small>(si sigue sin freno)</small>'], [4, '4 semanas'], [8, '8 semanas'], [0, 'Toda la obra']].map(t => '<button type="button" class="py-tab r2-tab' + (E.ritmo === t[0] ? ' on' : '') + '" data-r2r="' + t[0] + '" aria-pressed="' + (E.ritmo === t[0]) + '">' + t[1] + '</button>').join('') + '</div></div><div class="py-fc"><span class="py-cap">Trabajadores</span><div class="py-tabs" role="group" aria-label="Sumar o restar trabajadores al equipo"><button type="button" class="py-tab r2-tab" data-r2x="-1" aria-label="Restar un trabajador">−</button><span class="py-tab r2-eq" title="Trabajadores del equipo: el promedio de las semanas elegidas, más o menos los que sumes">%EQ%</span><button type="button" class="py-tab r2-tab" data-r2x="1" aria-label="Sumar un trabajador">+</button></div></div></div>';
    const pon = h => { const t0 = box ? box.scrollTop : 0; raiz.innerHTML = h; if(box) box.scrollTop = t0; };
    const claves = Object.keys(sem).sort();
    if(!ar.length){ pon(cab + '<div class="rd-vacio">No hay partidas de cerámica con m² cargados.</div>'); return; }
    if(!(K > 0)){ pon(cab + ctl.replace('%EQ%', '—') + '<div class="rd-vacio">Marca al menos una partida para ver la proyección.</div>'); return; }
    if(hecho >= K - 0.001){ pon(cab + ctl.replace('%EQ%', '—') + '<div class="rd-vacio">Lo marcado ya está terminado: ' + fmt(K) + ' m².</div>'); return; }
    if(!claves.length){ pon(cab + ctl.replace('%EQ%', '—') + '<div class="rd-vacio">Todavía no hay m² terminados con fecha en lo marcado.</div>'); return; }
    // ===== semanas, de lunes a domingo =====
    const l0 = claves[0] < rdLunes(R2_INICIO) ? claves[0] : rdLunes(R2_INICIO), S = [];
    for(let l = l0; l <= lunHoy; l = rdSuma(l, 7)) S.push({l, n: S.length + 1, fin: rdSuma(l, 6), m: sem[l] || 0, lv: lv[l] || 0, cur: l === lunHoy && hoy < rdSuma(l, 4)});
    const fi = S.findIndex(w => w.l === claves[0]);
    const base = sinF; let ac = base; S.forEach(w => { ac += w.m; w.cum = ac; });
    const lleva = ac, falta = K - lleva;
    const hechas = S.filter(w => !w.cur && w.l >= claves[0]);
    const usa = E.ritmo ? hechas.slice(-E.ritmo) : hechas;
    const ritBase = usa.length ? usa.reduce((s, w) => s + w.lv, 0) / usa.length : null;
    // ===== @@rend2-equipo: cuántos trabajadores rindieron en esas semanas; cada uno que se suma o resta aporta el promedio de uno =====
    const nT = usa.length ? Math.max(1, usa.reduce((s, w) => s + Object.keys(pt[w.l] || {}).length, 0) / usa.length) : 1;
    E.extra = Math.max(E.extra, 1 - Math.round(nT));
    const rit = ritBase != null ? ritBase * (nT + E.extra) / nT : null;
    const med = (() => { const v = hechas.filter(w => w.m > 0).map(w => w.m).sort((a, b) => a - b), q = v.length; return q ? (q % 2 ? v[(q - 1) / 2] : (v[q / 2 - 1] + v[q / 2]) / 2) : 0; })();
    S.forEach((w, k) => { w.est = w.cur ? 'curso' : w.l < claves[0] ? 'normal' : !(w.m > 0) ? 'parada' : (med && w.m < med * 0.6) ? 'freno' : 'normal'; w.ant = k ? S[k - 1] : null; });
    // ===== término estimado y lo necesario por semana para la fecha oficial =====
    const dEst = rit > 0 ? Math.min(720, Math.ceil(falta / rit * 7)) : null, fEst = dEst != null ? rdSuma(hoy, dEst) : null;
    const dOf = dias(hoy, R2_FIN), nec = dOf > 0 ? falta / (dOf / 7) : null, dif = fEst != null ? dias(R2_FIN, fEst) : null;
    const ritTxt = !E.ritmo ? 'toda la obra' : E.ritmo === 1 ? (usa.length ? 'la última semana' : 'sin semanas') : usa.length < E.ritmo ? 'últimas ' + usa.length + (usa.length === 1 ? ' semana' : ' semanas') : 'últimas ' + E.ritmo + ' semanas';
    const kpi = (b, s, t) => '<div title="' + esc(t) + '"><b>' + b + '</b><span>' + s + '</span></div>';
    let h = cab + '<div class="rd-res">'
      + kpi(fmt(lleva / K * 100) + ' %', 'avance · ' + fmt(lleva) + ' de ' + fmt(K) + ' m²', 'Terminado: ' + fmt(lleva) + ' m². Falta: ' + fmt(falta) + ' m².' + (base > 0 ? ' Sin fecha de término: ' + fmt(base) + ' m².' : ''))
      + kpi(rit != null ? '~' + fmt(rit) + ' m²' : '—', 'por semana · ' + (rit != null ? ritTxt + (E.extra ? ' · ' + (E.extra > 0 ? '+' : '−') + Math.abs(E.extra) + (Math.abs(E.extra) === 1 ? ' trabajador' : ' trabajadores') : '') : 'falta una semana completa'), 'Promedio de las semanas completas con registro, solo de lunes a viernes: el sábado es avance extra y no cuenta para el ritmo.')
      + kpi(fEst ? fF(fEst) : '—', 'término estimado' + (dif == null ? '' : dif === 0 ? ' · justo en la fecha oficial' : ' · ' + Math.abs(dif) + (Math.abs(dif) === 1 ? ' día ' : ' días ') + (dif > 0 ? 'después' : 'antes') + ' del oficial'), 'Con el ritmo semanal de arriba, lo que falta se termina en esta fecha.')
      + (nec != null ? kpi('~' + fmt(nec) + ' m²', 'por semana para el ' + fF(R2_FIN), 'Lo que hay que hacer cada semana para terminar en la fecha oficial.') : '')
      + '</div>' + ctl.replace('%EQ%', fmt(nT + E.extra));
    // ===== gráfico: acumulado al cierre de cada semana =====
    const Wd = 900, H = 260, L = 50, R = 16, T = 16, B = 26;
    const xo = d => (dias(l0, d) + 1) / 7, xHoy = xo(hoy), xPl = xo(R2_INICIO) - 1 / 7, xFin = xo(R2_FIN), xEst = fEst ? xo(fEst) : 0;
    const x1 = Math.max(xFin, xEst, xHoy + 2) + 0.6, y1 = K * 1.06;
    const X = x => L + x / x1 * (Wd - L - R), Y = y => T + (1 - y / y1) * (H - T - B);
    let s = '<div class="py-gw"><svg viewBox="0 0 ' + Wd + ' ' + H + '" class="r2-svg" role="img" aria-label="Avance acumulado de cerámica por semana y proyección de término">';
    [0, 0.25, 0.5, 0.75, 1].forEach(p => { const y = Y(K * p); s += '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + f1(y) + '" y2="' + f1(y) + '" stroke="var(--border)"' + (p === 1 ? ' stroke-dasharray="5 4"' : '') + '/><text x="' + (L - 6) + '" y="' + f1(y + 3) + '" font-size="10" text-anchor="end" fill="var(--sub)">' + fmt(Math.round(K * p)) + '</text>'; });
    const paso = Math.max(1, Math.ceil(x1 / 14));
    for(let n = paso; n < x1; n += paso) s += '<line x1="' + f1(X(n)) + '" x2="' + f1(X(n)) + '" y1="' + (H - B) + '" y2="' + (H - B + 4) + '" stroke="var(--sub)"/><text x="' + f1(X(n)) + '" y="' + (H - 8) + '" font-size="10" text-anchor="middle" fill="var(--sub)">S' + n + '</text>';
    s += '<line x1="' + f1(X(xPl)) + '" y1="' + f1(Y(0)) + '" x2="' + f1(X(xFin)) + '" y2="' + f1(Y(K)) + '" stroke="var(--ok,#43a047)" stroke-width="1.5" stroke-dasharray="9 4"/><circle cx="' + f1(X(xFin)) + '" cy="' + f1(Y(K)) + '" r="4" fill="var(--ok,#43a047)" stroke="var(--panel)" stroke-width="2"/><text x="' + f1(X(xFin) - 7) + '" y="' + f1(Y(K) - 6) + '" font-size="10" text-anchor="end" fill="var(--ok,#43a047)">oficial ' + fmt(0) .replace('0', '') + fF(R2_FIN).substring(0, 5) + '</text>';
    const xF = fi;
    if(base > 0 && xF > xPl) s += '<line x1="' + f1(X(xPl)) + '" y1="' + f1(Y(0)) + '" x2="' + f1(X(xF)) + '" y2="' + f1(Y(base)) + '" stroke="var(--accent)" stroke-width="2" stroke-dasharray="2 5"/>';
    const pts = [[xF, base]]; S.forEach((w, k) => { if(k >= fi) pts.push([k === S.length - 1 ? xHoy : k + 1, w.cum, w]); });
    s += '<polyline fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" points="' + pts.map(p => f1(X(p[0])) + ',' + f1(Y(p[1]))).join(' ') + '"/>';
    pts.forEach(p => { if(p[2]) s += '<circle cx="' + f1(X(p[0])) + '" cy="' + f1(Y(p[1])) + '" r="3" fill="var(--accent)" stroke="var(--panel)" stroke-width="1.5"><title>Semana ' + p[2].n + ' · ' + fF(p[2].l) + ' al ' + fF(p[2].fin) + ': ' + fmt(p[2].m) + ' m² en la semana, ' + fmt(p[2].cum) + ' m² en total</title></circle>'; });
    if(rit > 0){ const xe = Math.min(xHoy + falta / rit, xHoy + 720 / 7), ye = Math.min(K, lleva + rit * (xe - xHoy));
      s += '<line x1="' + f1(X(xHoy)) + '" y1="' + f1(Y(lleva)) + '" x2="' + f1(X(xe)) + '" y2="' + f1(Y(ye)) + '" stroke="var(--warn,#d99a00)" stroke-width="2" stroke-dasharray="7 4"/><circle cx="' + f1(X(xe)) + '" cy="' + f1(Y(ye)) + '" r="4" fill="var(--warn,#d99a00)" stroke="var(--panel)" stroke-width="2"/><text x="' + f1(X(xe) - 7) + '" y="' + f1(Y(ye) + 26) + '" font-size="10" text-anchor="end" fill="var(--warn,#d99a00)">' + fF(fEst).substring(0, 5) + '</text>'; }
    s += '<line x1="' + f1(X(xHoy)) + '" x2="' + f1(X(xHoy)) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--sub)" stroke-dasharray="3 3"/><text x="' + f1(X(xHoy) - 4) + '" y="' + (H - B - 5) + '" font-size="10" text-anchor="end" fill="var(--sub)">hoy</text></svg></div>';
    h += s + '<div class="py-ley">' + leyLinea('var(--accent)', '', 'Real, al cierre de cada semana') + (base > 0 && xF > xPl ? leyLinea('var(--accent)', '2 4', 'Sin fecha por semana') : '') + (rit > 0 ? leyLinea('var(--warn,#d99a00)', '6 3', 'Proyección') : '') + leyLinea('var(--ok,#43a047)', '8 3', 'Plan oficial') + '</div>';
    // ===== rendimiento semanal =====
    const EST = {curso: 'En curso', parada: 'Parada', freno: 'Freno', normal: 'Normal'};
    const dfs = (a, b) => { if(!(b > 0)) return {c: 'eq', t: '—'}; const p = Math.round((a - b) / b * 100); return p === 0 ? {c: 'eq', t: 'igual'} : p > 0 ? {c: 'up', t: '+' + p + ' %'} : {c: 'down', t: '−' + Math.abs(p) + ' %'}; };
    const fila = w => {
      const d = w.cur || !w.ant || w.ant.l < claves[0] ? {c: 'eq', t: '—'} : dfs(w.m, w.ant.m);
      const gente = Object.keys(pt[w.l] || {}).sort((a, b) => pt[w.l][b] - pt[w.l][a]).map(n => corto(n) + ': ' + fmt(pt[w.l][n]) + ' m²');
      const t = 'Semana ' + w.n + ' · ' + fF(w.l) + ' al ' + fF(w.fin) + '\n' + fmt(w.m) + ' m² del equipo' + (w.cur ? ' (semana en curso)' : '') + (gente.length ? '\n' + gente.join('\n') : '');
      return '<div class="py-sr r2-sr ' + w.est + '" title="' + esc(t).replace(/\n/g, '&#10;') + '"><span class="py-s1">S' + w.n + ' · ' + esc(fF(w.l).substring(0, 5) + ' – ' + fF(w.fin).substring(0, 5)) + '</span><b class="py-s2">' + fmt(w.m) + ' m²</b><span class="py-s3 ' + d.c + '">' + d.t + '</span><span class="py-s4"><i class="py-e ' + w.est + '">' + EST[w.est] + '</i></span></div>';
    };
    const filas = S.filter((w, k) => k >= fi).slice().reverse().map(fila), frenos = S.filter(w => w.est === 'freno' || w.est === 'parada');
    h += '<div class="rd-tit">Rendimiento semanal · Cerámica</div><div class="py-sub" title="Parada: semana sin m². Freno: menos del 60 % de una semana normal.">' + (med ? 'Semana normal: ' + fmt(med) + ' m² · ' : '') + (frenos.length ? 'con freno o parada: <b>' + frenos.map(w => 'S' + w.n).join(', ') + '</b>' : 'sin frenos ni paradas') + '</div>'
      + '<div class="py-sems"><div class="py-sr r2-sr py-sh"><span class="py-s1">Semana</span><span class="py-s2">m²</span><span class="py-s3">Contra la anterior</span><span class="py-s4">Estado</span></div>' + filas.slice(0, 8).join('') + '</div>'
      + (filas.length > 8 ? '<details class="py-mas"><summary>Ver semanas anteriores (' + (filas.length - 8) + ')</summary><div class="py-sems">' + filas.slice(8).join('') + '</div></details>' : '')
      + '<details class="rd-nota"><summary>Cómo se calcula</summary>Cada partida cuenta entera en la semana (lunes a domingo) en que se marcó terminada. El ritmo es el promedio de m² por semana de las semanas completas elegidas, contando solo de lunes a viernes (el sábado es avance extra y no entra); la semana en curso no entra. El término estimado sale de dividir lo que falta por ese ritmo. La obra empieza a contar el 29/05/2026 y la fecha oficial es el 01/01/2027. No se usa la asistencia.</details>';
    pon(h);
    // en celular el gráfico es más ancho que la pantalla: se deja mirando el día de hoy y no el principio
    const gw = raiz.querySelector('.py-gw'); if(gw) gw.scrollLeft = Math.max(0, X(xHoy) / Wd * gw.scrollWidth - gw.clientWidth * 0.7);
  }
  raiz.onchange = e => { const a = e.target.closest('input[data-r2a]'); if(a){ r2E.off[a.getAttribute('data-r2a')] = !a.checked; pintar(); } };
  raiz.onclick = e => { const t = e.target.closest('.r2-tab'); if(!t) return; if(t.hasAttribute('data-r2s')) r2E.solo = !r2E.solo; else if(t.hasAttribute('data-r2x')) r2E.extra += Number(t.getAttribute('data-r2x')); else r2E.ritmo = Number(t.getAttribute('data-r2r')); pintar(); };
  pintar();
}
// ===== datos de ejemplo para las pruebas sin servidor =====
function rendDemoCer(){
  const hoy = rdHoy(), lun = rdLunes(hoy), cer = [], nombres = ['Rafael', 'Raymond', 'Luis', 'Pedro'];
  let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for(let p = 2; p <= 22; p++) ['Piso', 'Muro Baños'].forEach(area => {
    const hecho = p <= 14, atras = Math.floor((p - 2) / 12 * 40) + Math.floor(rnd() * 4);
    cer.push({area, piso: p, m2: Math.round((area === 'Piso' ? 38 : 22) * (0.8 + rnd() * 0.4) * 10) / 10, hecho, dia: hecho ? rdSuma(hoy, -(40 - atras)) : '', w: nombres[p % 4]});
  });
  return {ok: true, cer};
}
function rendDemo(){
  const nombres = ['Rafael', 'Raymond', 'Luis', 'Pedro', 'Marcos', 'Iván'];
  const factor = [1.25, 1.1, 1, 0.85, 0.6, 0.35];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const lun = rdLunes(rdHoy());
  const trabajadores = nombres.map((nombre, i) => {
    const dias = [], asistencia = [];
    for(let k = 11; k >= 0; k--){
      if(i === 5 && k > 5) continue;
      const l = rdSuma(lun, -7 * k);
      for(let j = 0; j < 6; j++){
        const f = rdSuma(l, j); if(f > rdHoy()) continue;
        if(j === 5){ if(rnd() < 0.25){ asistencia.push({d: f, e: 'P', fr: 1, m: '', s: ''}); dias.push({d: f, cat: 'Cerámica', m2: Math.round(factor[i] * 6 * 10) / 10, n: 1, t: 1, tn: 1}); } continue; }
        const r = rnd();
        if(r < 0.07 + (1 - factor[i]) * 0.1){ asistencia.push({d: f, e: 'F', fr: 0, m: '', s: ''}); continue; }
        if(r < 0.14 + (1 - factor[i]) * 0.1){ asistencia.push({d: f, e: 'S', fr: 0.5, m: 'sin cancha', s: 'medio día'}); dias.push({d: f, cat: 'Cerámica', m2: Math.round(factor[i] * 4 * 10) / 10, n: 1, t: 1, tn: 1}); continue; }
        asistencia.push({d: f, e: 'P', fr: 1, m: '', s: ''});
        dias.push({d: f, cat: 'Cerámica', m2: Math.round(factor[i] * (7 + rnd() * 5) * 10) / 10, n: 1 + Math.round(rnd()), t: Math.round((1.5 / factor[i]) * 10) / 10, tn: 1});
      }
    }
    return {nombre, dias, asistencia};
  });
  return {ok: true, cer: rendDemoCer().cer, trabajadores, cobertura: {terminadas: 412, conFecha: 388, conM2: 405}, jornada: {entrada: 8, horas: 9}};
}
function renderRendimiento(raiz, datos, esc, opc){
  const fmt = n => (Math.round(n * 10) / 10).toLocaleString('es-CL');
  const hoy = rdHoy(), hoyLun = rdLunes(hoy);
  const INICIO_OBRA = '2026-05-29';   // semana 1 = la semana de esta fecha
  const FIN_OFICIAL = '2027-01-01';   // término oficial de la obra
  let primera = hoy < INICIO_OBRA ? hoy : INICIO_OBRA;
  datos.trabajadores.forEach(t => { t.dias.forEach(x => { if(x.d < primera) primera = x.d; }); (t.asistencia || []).forEach(x => { if(x.d < primera) primera = x.d; }); });
  // ===== días con muchos terminados juntos sin revisar: no son datos garantizados, se usa el promedio del equipo =====
  // Frague no se revisa: el fraguador termina muchos dptos por día
  // los que ya venían con partida de un día antes (nc) cuentan como corroborados: dos partidas abiertas a la vez es normal
  const DUDOSO_MIN = 6;
  datos.trabajadores.forEach(t => { const ok = t.revisadas || []; t.dias.forEach(x => { x.dud = x.cat !== 'Frague' && (x.n || 0) - (x.nc || 0) >= DUDOSO_MIN && ok.indexOf(x.d) === -1; }); });
  const promEscCache = {};
  function promEsc(cat, lunes){
    const k = cat + '|' + lunes; if(promEscCache[k] !== undefined) return promEscCache[k];
    let s = 0, n = 0;
    datos.trabajadores.forEach(t => { if(t.activo === false) return; t.dias.forEach(x => { if(!x.dud && x.cat === cat && x.m2 > 0 && rdLunes(x.d) === lunes){ s += x.m2; n++; } }); });
    return promEscCache[k] = n ? s / n : 0;
  }
  const lun0 = rdLunes(primera);
  const nSem = l => Math.round((rdFecha(l) - rdFecha(lun0)) / 604800000) + 1;
  const todasSem = []; for(let l = lun0; l <= hoyLun; l = rdSuma(l, 7)) todasSem.push(l);
  const sabActivo = {};
  datos.trabajadores.forEach(t => { t.dias.forEach(x => { if(rdFecha(x.d).getUTCDay() === 6) sabActivo[rdLunes(x.d)] = 1; }); (t.asistencia || []).forEach(x => { if(rdFecha(x.d).getUTCDay() === 6) sabActivo[rdLunes(x.d)] = 1; }); });
  /* info de una semana: rango lun–vie (o sáb si alguien fue), y en qué meses caen sus días */
  function infoSem(l){
    const fin = rdSuma(l, sabActivo[l] ? 5 : 4), a = rdFecha(l), b = rdFecha(fin);
    const cuenta = {}; for(let k = 0; k <= (sabActivo[l] ? 5 : 4); k++){ const m = rdFecha(rdSuma(l, k)).getUTCMonth(); cuenta[m] = (cuenta[m] || 0) + 1; }
    const meses = []; for(let k = 0; k <= (sabActivo[l] ? 5 : 4); k++){ const m = rdFecha(rdSuma(l, k)).getUTCMonth(); if(meses.indexOf(m) < 0) meses.push(m); }
    const rango = a.getUTCMonth() === b.getUTCMonth() ? a.getUTCDate() + ' – ' + b.getUTCDate() + ' ' + RD_MC[b.getUTCMonth()] : a.getUTCDate() + ' ' + RD_MC[a.getUTCMonth()] + ' – ' + b.getUTCDate() + ' ' + RD_MC[b.getUTCMonth()];
    const mixta = meses.length > 1;
    const nota = mixta ? meses.map(m => cuenta[m] + (cuenta[m] === 1 ? ' día' : ' días') + ' en ' + RD_MES[m]).join(', ') : '';
    return {l, fin, rango, mixta, nota, n: nSem(l), tag: mixta ? ' (' + meses.map(m => RD_MC[m]).join('-') + ')' : '', corto: 'Semana ' + nSem(l) + ' ' + meses.map(m => RD_MC[m].charAt(0).toUpperCase() + RD_MC[m].slice(1)).join('-')};
  }
  const nombreSem = l => { const w = infoSem(l); return 'Semana ' + w.n + ' · ' + w.rango + w.tag; };
  /* estadística de un trabajador en un rango de fechas */
  function stat(t, desde, hasta, cat){
    if(t.inicio && t.inicio > desde) desde = t.inicio; if(t.fin && t.fin < hasta) hasta = t.fin; // ===== solo cuenta entre su inicio y su finiquito =====
    const r = {dud: 0, sinInfo: false, m2: 0, m2a: 0, n: 0, act: {}, P: 0, S: 0, F: 0, trab: 0, disp: 0, sc: [], otros: [], reg: 0, sab: 0};
    // @@rend-desde-asistencia: el promedio por jornada usa solo los m² desde el primer día con asistencia del trabajador; antes de eso no hay con qué dividir
    const as0 = (t.asistencia || []).reduce((a, x) => !a || x.d < a ? x.d : a, '');
    t.dias.forEach(x => { if(x.d >= desde && x.d <= hasta && (!cat || x.cat === cat)){
      if(x.dud){ r.dud++; if(desde === hasta){ r.sinInfo = true; return; } const pe = promEsc(x.cat, rdLunes(x.d)); r.m2 += pe; if(as0 && x.d >= as0) r.m2a += pe; r.act[x.d] = 1; return; }
      r.m2 += x.m2; if(as0 && x.d >= as0) r.m2a += x.m2; r.n += x.n; r.act[x.d] = 1; } });
    (t.asistencia || []).forEach(x => {
      if(x.d < desde || x.d > hasta) return;
      r.reg++; if(rdFecha(x.d).getUTCDay() === 6) r.sab++;
      if(x.e === 'F'){ r.F++; r.disp += 1; }
      else if(x.e === 'P'){ r.P++; r.trab += 1; r.disp += 1; }
      else if(x.e === 'S'){ r.S++; r.trab += x.fr; r.disp += asMotObra(x.m) ? x.fr : 1; (asMotObra(x.m) ? r.sc : r.otros).push(x); }
    });
    r.conAsist = r.reg > 0;
    r.dias = r.trab;   // solo jornadas con asistencia registrada
    r.porDia = r.dias ? r.m2a / r.dias : 0;
    r.asistPct = r.disp ? r.trab / r.disp * 100 : null;
    return r;
  }
  const fd = x => { const d = rdFecha(x); return d.getUTCDate() + ' ' + RD_MC[d.getUTCMonth()]; };
  function fraseAsist(r){
    const p = [];
    if(!r.conAsist) return 'asistencia sin registrar';
    p.push(r.F ? 'Tuvo ' + r.F + (r.F === 1 ? ' falta' : ' faltas') : 'Sin faltas');
    if(r.sc.length) p.push(r.sc.length > 2 ? 'retirado por la obra ' + r.sc.length + ' días' : 'retirado por la obra ' + r.sc.map(x => fd(x.d) + ' (' + (x.s || 'medio día') + (asMotTxt(x.m) ? ', ' + asMotTxt(x.m) : '') + ')').join(', '));
    if(r.otros.length) p.push(r.otros.length > 2 ? 'salió antes ' + r.otros.length + ' días' : 'salió antes ' + r.otros.map(x => fd(x.d) + ' (' + (x.s || 'medio día') + ')').join(', '));
    return p.join(' · ');
  }
  raiz.innerHTML = '<div class="rd-ctl"><label>Ver por <select id="rdVista"><option value="dia">Día</option><option value="semana" selected>Semana</option><option value="mes">Mes</option><option value="total">Total</option></select></label>'
    + '<label id="rdSelD">Día <input type="date" id="rdDia" max="' + hoy + '"></label><label id="rdSelW">Semana <select id="rdSem"></select></label><label id="rdSelM">Mes <select id="rdMes"></select></label>'
    + '<button class="btn" type="button" id="rdIrPy">Ver proyección ↓</button></div><div id="rdOutC"></div><div id="rdOutF"></div>';
  const $ = id => raiz.querySelector('#' + id);
  /* Cerámica y Frague se miden por separado: cada grupo tiene su propio promedio y ranking.
     La asistencia (no tiene categoría) se cuenta en el grupo donde la persona más trabajó. */
  const sepul = (opc && opc.esPropio) || (() => false);
  const grupoPrincipal = t => { if(t.especialidad === 'fraguador') return 'Frague'; if(t.especialidad === 'ceramista') return 'Cerámica'; let c = 0, f = 0; t.dias.forEach(x => { if(x.cat === 'Frague') f += x.m2 || 0; else c += x.m2 || 0; }); return f > c ? 'Frague' : 'Cerámica'; };
  function listaGrupo(cat){
    return datos.trabajadores.filter(t => !sepul(t.nombre) && (grupoPrincipal(t) === cat || t.dias.some(x => x.cat === cat)))
      .map(t => grupoPrincipal(t) === cat ? t : Object.assign({}, t, {asistencia: []}));
  }
  /* selectores */
  const hayDatoSem = l => datos.trabajadores.some(t => t.dias.some(x => rdLunes(x.d) === l) || (t.asistencia || []).some(x => rdLunes(x.d) === l));
  $('rdSem').innerHTML = todasSem.slice().reverse().map(l => '<option value="' + l + '">' + esc(nombreSem(l)) + '</option>').join('');
  $('rdSem').value = hayDatoSem(hoyLun) ? hoyLun : (todasSem.slice().reverse().find(hayDatoSem) || hoyLun);
  const meses = []; { let a = new Date(primera.substring(0, 7) + '-01T00:00:00Z'); const z = new Date(hoy.substring(0, 7) + '-01T00:00:00Z'); while(a <= z){ meses.push(rdIso(a).substring(0, 7)); a.setUTCMonth(a.getUTCMonth() + 1); } }
  $('rdMes').innerHTML = meses.slice().reverse().map(m => '<option value="' + m + '">' + RD_MES[Number(m.substring(5)) - 1] + ' ' + m.substring(0, 4) + '</option>').join('');
  $('rdMes').value = hoy.substring(0, 7);
  /* día por defecto: el último con trabajo o asistencia */
  { let ult = ''; datos.trabajadores.forEach(t => { t.dias.forEach(x => { if(x.d <= hoy && x.d > ult) ult = x.d; }); (t.asistencia || []).forEach(x => { if(x.d <= hoy && x.d > ult) ult = x.d; }); }); $('rdDia').value = ult || hoy; }
  /* promedio, máximo y mínimo de m² por día y por semana (solo días con m² > 0) */
  function minmax(t, desde, hasta, cat){
    if(t.inicio && t.inicio > desde) desde = t.inicio; if(t.fin && t.fin < hasta) hasta = t.fin;
    const pd = {}, ps = {};
    t.dias.forEach(x => { if(x.d >= desde && x.d <= hasta && (!cat || x.cat === cat) && x.m2 > 0 && !x.dud){ pd[x.d] = (pd[x.d] || 0) + x.m2; const l = rdLunes(x.d); ps[l] = (ps[l] || 0) + x.m2; } });
    const res = obj => { const k = Object.keys(obj); if(!k.length) return null; let mx = k[0], mn = k[0], sum = 0; k.forEach(c => { sum += obj[c]; if(obj[c] > obj[mx]) mx = c; if(obj[c] < obj[mn]) mn = c; }); return {n: k.length, prom: sum / k.length, max: obj[mx], maxK: mx, min: obj[mn], minK: mn}; };
    return {dia: res(pd), sem: res(ps)};
  }
  const color = pct => pct >= 100 ? 'var(--ok,#43a047)' : pct >= 70 ? 'var(--warn,#d99a00)' : 'var(--bad,#c0392b)';
  const spark = serie => { const m = Math.max(1, ...serie), p = serie.map((v, i) => (serie.length > 1 ? i / (serie.length - 1) * 78 : 39).toFixed(1) + ',' + (22 - v / m * 20).toFixed(1)).join(' '); return '<svg viewBox="0 0 80 24" width="80" height="24" aria-hidden="true"><polyline points="' + p + '" fill="none" stroke="var(--accent)" stroke-width="1.6"/></svg>'; };
  // ===== Proyección de cerámica: recta según el ritmo real, con detalle al pasar el cursor =====
  const pyEstado = {extra: 0, off: {'Muro': true}, vista: 'simple', proy: true, plan: true, freno: true, barras: false, ritmo: 0};
  const PY_MS = 864e5, PY_DC = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  let pyM = null;
  // @@proy-ultima-semana: los ritmos salen de esta sola lista (días hacia atrás; 0 = toda la obra); el último va entre paréntesis
  const PY_RITMOS = [[7, 'Última semana <small>(si sigue sin freno)</small>', 'últimos 7 días'], [28, '4 semanas', 'últimas 4 semanas'], [56, '8 semanas', 'últimas 8 semanas'], [0, 'Toda la obra', 'toda la obra']];
  const pyFd = d => d.substring(8, 10) + '/' + d.substring(5, 7) + '/' + d.substring(0, 4);
  function pyDif(act, ant){
    if(!(ant > 0)) return {c: 'eq', t: '—'};
    const p = Math.round((act - ant) / ant * 100);
    return p === 0 ? {c: 'eq', t: '= igual'} : p > 0 ? {c: 'up', t: '▲ +' + p + '%'} : {c: 'down', t: '▼ ' + p + '%'};
  }
  // el avance sale de cada partida (m² y fecha de término), así se puede separar por piso, muros y pasillos
  function pyDatos(){
    const E = pyEstado, diario = {}, dud = {}, porTrab = {}, areas = [];
    datos.trabajadores.forEach(t => t.dias.forEach(x => { if(x.cat === 'Cerámica' && x.dud) dud[x.d] = 1; }));
    let K = 0, hecho = 0, conF = 0;
    (datos.cer || []).forEach(c => {
      const m = Number(c.m2); if(!(m > 0)) return;
      if(areas.indexOf(c.area) < 0) areas.push(c.area);
      if(E.off[c.area]) return;
      K += m; if(!c.hecho) return; hecho += m;
      const d = c.dia || ''; if(!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > hoy) return;
      diario[d] = (diario[d] || 0) + m; conF += m;
      if(c.w){ const o = porTrab[c.w] || (porTrab[c.w] = {}); o[d] = (o[d] || 0) + m; }
    });
    if(!areas.length) return null;
    const ks = Object.keys(diario).sort();
    if(!(K > 0)) return {areas, msg: 'Marca al menos una partida para ver la proyección.'};
    if(hecho >= K - 0.001) return {areas, msg: 'Lo marcado ya está terminado: ' + fmt(K) + ' m².'};
    if(!ks.length) return {areas, msg: 'Todavía no hay m² terminados con fecha en lo marcado.'};
    const ini = ks[0] < INICIO_OBRA ? ks[0] : INICIO_OBRA, idx = d => Math.round((rdFecha(d) - rdFecha(ini)) / PY_MS);
    const n = idx(hoy) + 1, i0 = idx(ks[0]), cum = [];
    let a = 0; for(let i = 0; i < n; i++){ a += diario[rdSuma(ini, i)] || 0; cum.push(a); }
    const base = Math.max(0, hecho - conF);   // lo terminado sin fecha se reparte parejo antes del primer día con registro
    for(let i = 0; i < n; i++) cum[i] = i < i0 ? base * i / i0 : cum[i] + base;
    return {areas, diario, dud, porTrab, K, ini, n, cum, base, i0, d0: ks[0], idx};
  }
  // ===== semanas: m², freno y quiénes quedaron sin avance =====
  function pySemanas(P){
    const gente = datos.trabajadores.filter(t => !sepul(t.nombre) && grupoPrincipal(t) === 'Cerámica').map(t => {
      const fs = t.dias.map(x => x.d).concat((t.asistencia || []).map(x => x.d)).sort(), ult = fs.length ? fs[fs.length - 1] : '';
      return {t, a: t.inicio || fs[0] || '9999', b: t.fin || (ult && rdSuma(ult, 21) >= hoy ? hoy : ult)};
    });
    const S = [];
    for(let l = rdLunes(P.d0); l <= hoyLun; l = rdSuma(l, 7)){
      const fin = rdSuma(l, 6); let m = 0, n = 0, lv = 0;
      for(let k = 0; k < 7; k++){ const x = P.diario[rdSuma(l, k)] || 0; if(x > 0){ m += x; n++; if(k < 5) lv += x; } }
      const det = gente.filter(g => g.a <= fin && g.b >= l).map(g => {
        let m2 = 0, as = 0, F = 0; const dd = {}, pt = P.porTrab[g.t.nombre] || {};
        Object.keys(pt).forEach(d => { if(d >= l && d <= fin){ m2 += pt[d]; dd[d] = 1; } });
        (g.t.asistencia || []).forEach(x => { if(x.d >= l && x.d <= fin){ if(x.e === 'F') F++; else if(x.e === 'P' || x.e === 'S') as++; } });
        return {n: g.t.nombre, m2, dias: Object.keys(dd).length, as, F};
      }).filter(x => x.m2 > 0).sort((x, y) => y.m2 - x.m2);   // @@rend-solo-con-m2: quien no tiene m² no se muestra ni cuenta; entra solo cuando los tenga
      S.push({l, fin, m, lv, n, det, cur: l === hoyLun && hoy < rdSuma(l, 4), parcial: !S.length && P.d0 > l, inf: infoSem(l)});
    }
    const hechas = S.filter(w => !w.cur && !w.parcial && w.m > 0).map(w => w.m).sort((a, b) => a - b), q = hechas.length;
    const med = q ? (q % 2 ? hechas[(q - 1) / 2] : (hechas[q / 2 - 1] + hechas[q / 2]) / 2) : 0;
    S.forEach((w, k) => { w.ant = k ? S[k - 1] : null; w.est = w.cur ? 'curso' : w.parcial ? 'normal' : !(w.m > 0) ? 'parada' : (med && w.m < med * 0.6) ? 'freno' : 'normal'; });
    return {S, med};
  }
  function pyHtml(){
    const P = pyDatos(); if(!P){ pyM = null; return ''; }
    const E = pyEstado, nuevo = Date.now() < new Date('2026-11-23T23:59:59').getTime() ? ' <i class="tnuevo">Nuevo</i>' : '';
    const areas = ['Piso', 'Muro Baños', 'Muro Cocina', 'Muro', 'Pasillos'].filter(a => P.areas.indexOf(a) >= 0).concat(P.areas.filter(a => ['Piso', 'Muro Baños', 'Muro Cocina', 'Muro', 'Pasillos'].indexOf(a) < 0));
    const pyLab = a => a === 'Muro' ? 'Piso -1' : (RD_AREA[a] || a), fuera = areas.filter(a => E.off[a]).map(pyLab);
    const cab = '<div class="rd-tit py-ancla">Proyección · Cerámica' + (fuera.length ? ' · sin ' + esc(fuera.join(', ')) : '') + nuevo + '</div>';
    const filaCtl = (cap, cont) => '<div class="py-fc"><span class="py-cap">' + cap + '</span><div class="py-cks">' + cont + '</div></div>';
    const ckA = filaCtl('Partidas', areas.map(a => '<label class="py-ck"><input type="checkbox" data-pya="' + esc(a) + '"' + (E.off[a] ? '' : ' checked') + '><span>' + esc(pyLab(a)) + '</span></label>').join(''));
    if(P.msg){ pyM = null; return cab + '<div class="py-caja">' + ckA + '</div><div class="rd-vacio">' + P.msg + '</div>'; }
    const hasta = P.n - 1, lleva = P.cum[hasta], falta = P.K - lleva;
    const a0 = E.ritmo ? Math.max(0, hasta - E.ritmo) : 0;
    let finde = 0; for(let i = a0 + 1; i <= hasta; i++){ const d = rdSuma(P.ini, i); if(!rdHabil(d)) finde += P.diario[d] || 0; }   // @@ritmo-lunes-viernes
    const v0 = (lleva - P.cum[a0] - finde) / Math.max(1, hasta - a0);
    const Q = pySemanas(P);
    // ===== rendimiento promedio de un ceramista: m² de los que tienen nombre ÷ semanas-trabajador del mismo período =====
    let pm = 0, pn = 0; { const l0 = rdLunes(rdSuma(P.ini, a0));
      Q.S.forEach(w => { if(w.cur || w.l < l0) return; Object.keys(P.porTrab).forEach(nm => { if(sepul(nm)) return; let m = 0; for(let k = 0; k < 5; k++) m += P.porTrab[nm][rdSuma(w.l, k)] || 0; if(m > 0){ pm += m; pn++; } }); }); }
    const pw = pn ? pm / pn : 0, add = E.extra * pw / 7, v = v0 + add;
    const finI = P.idx(FIN_OFICIAL), fI = r => r > 0 ? Math.min(hasta + 720, hasta + Math.ceil(falta / r)) : null, estI = fI(v), estD = estI != null ? rdSuma(P.ini, estI) : null, est0 = fI(v0);
    const tips = [], tip = h => ' data-pt="' + (tips.push(h) - 1) + '"';
    const ritTxt = (PY_RITMOS.find(t => t[0] === E.ritmo) || PY_RITMOS[3])[2];
    const nec = finI > hasta ? falta / (finI - hasta) * 7 : null, dif = estI != null ? estI - finI : null;
    const kpi = (b, s, t) => '<div class="py-k"' + tip(t) + '><b>' + b + '</b><span>' + s + '</span></div>';
    let h = cab + '<div class="rd-res">'
      + kpi(fmt(lleva / P.K * 100) + ' %', 'avance · ' + fmt(lleva) + ' de ' + fmt(P.K) + ' m²', '<b>Avance de cerámica</b>Terminado: ' + fmt(lleva) + ' m²<br>Falta: ' + fmt(falta) + ' m²<br>Total de la obra: ' + fmt(P.K) + ' m²' + (P.base > 0 ? '<br>Sin fecha por día (antes del ' + pyFd(P.d0) + '): ' + fmt(P.base) + ' m²' : ''))
      + kpi('~' + fmt(v * 7) + ' m²', 'por semana · ' + ritTxt + (E.extra ? ' · con +' + E.extra : ''), '<b>Ritmo' + (E.extra ? ' con ' + E.extra + (E.extra === 1 ? ' ceramista más' : ' ceramistas más') : ' real') + '</b>' + fmt(v * 7) + ' m² por semana (' + fmt(v) + ' por día corrido), ' + ritTxt + '.' + (E.extra ? '<br>Sin cambios: ' + fmt(v0 * 7) + ' m² por semana.' : '') + (nec != null ? '<br>Para terminar el ' + pyFd(FIN_OFICIAL) + ' se necesitan ~' + fmt(nec) + ' m² por semana.' : ''))
      + kpi(estD ? pyFd(estD) : '—', 'término estimado' + (dif == null ? '' : dif === 0 ? ' · justo en la fecha oficial' : ' · ' + Math.abs(dif) + (Math.abs(dif) === 1 ? ' día ' : ' días ') + (dif > 0 ? 'después' : 'antes') + ' del oficial') + (E.extra && est0 != null && estI != null ? ' · se adelanta ' + (est0 - estI) + (est0 - estI === 1 ? ' día' : ' días') : ''), '<b>Término estimado</b>' + (E.extra && est0 != null ? 'Sin cambios: ' + pyFd(rdSuma(P.ini, est0)) + '.<br>' : '') + 'Si se mantiene el ritmo de ' + ritTxt + (E.extra ? ' y suman ' + E.extra + (E.extra === 1 ? ' ceramista' : ' ceramistas') + ' desde hoy' : '') + ', los ' + fmt(falta) + ' m² que faltan se terminan el ' + (estD ? pyFd(estD) : '—') + '.<br>Término oficial: ' + pyFd(FIN_OFICIAL) + '.')
      + '</div>';
    const ck = (k, t) => '<label class="py-ck"><input type="checkbox" data-pyk="' + k + '"' + (E[k] ? ' checked' : '') + '><span>' + t + '</span></label>';
    h += '<div class="py-caja">' + ckA
      + filaCtl('Ritmo', '<div class="py-tabs" role="group" aria-label="Ritmo para proyectar">' + PY_RITMOS.map(t => '<button type="button" class="py-tab' + (E.ritmo === t[0] ? ' on' : '') + '" data-pyr="' + t[0] + '" aria-pressed="' + (E.ritmo === t[0]) + '">' + t[1] + '</button>').join('') + '</div>')
      + filaCtl('Agregar trabajador', '<div class="py-mm" role="group" aria-label="Ceramistas que se suman desde hoy"><button type="button" class="py-b" data-pyx="-1" aria-label="Quitar un ceramista"' + (E.extra <= 0 ? ' disabled' : '') + '>−</button><output class="py-n"' + tip('<b>Ceramistas que se suman desde hoy</b>Cada uno rinde en promedio ~' + fmt(pw) + ' m² por semana (' + fmt(pw / 5) + ' por día hábil), según lo que hicieron los ceramistas con nombre en ' + ritTxt + '. No cuenta el trabajo de No Asignado.') + '>' + E.extra + '</output><button type="button" class="py-b" data-pyx="1" aria-label="Sumar un ceramista"' + (!pw || E.extra >= 12 ? ' disabled' : '') + '>+</button></div><span class="py-aviso">' + (pw ? 'cada uno rinde ~' + fmt(pw) + ' m² por semana' + (E.extra ? ' · +' + fmt(add * 7) + ' m² por semana en total' : '') : 'sin datos para calcular el promedio') + '</span>')
      + filaCtl('Mostrar', E.vista === 'simple' ? ck('proy', 'Proyección') + ck('plan', 'Plan oficial') + ck('freno', 'Semanas con freno') + ck('barras', 'm² por semana') : '<span class="py-aviso">Estos checks se usan en la vista Simple.</span>') + '</div>';
    h += '<div class="py-tabs py-vis" role="tablist">' + [['simple', 'Simple'], ['burnup', 'Burn-up'], ['s', 'Curva S'], ['abanico', 'Abanico'], ['vel', 'Velocidad']].map(t => '<button type="button" role="tab" class="py-tab' + (E.vista === t[0] ? ' on' : '') + '" data-pyv="' + t[0] + '" aria-selected="' + (E.vista === t[0]) + '">' + t[1] + '</button>').join('') + '</div>';
    let g = null, proyF = null, planF = null, fan = null;
    if(E.vista !== 'simple'){ const A = pyAlt(P, Q, {hasta, lleva, finI, v, nec, tip, add}); h += A.h; g = A.g; proyF = A.proy || null; planF = A.plan || null; fan = A.fan || null; }
    else {
    // ===== gráfico =====
    const Wd = 900, H = 290, L = 50, R = 16, T = 16, B = 26, x0 = 0, x1 = Math.max(finI, E.proy && estI != null ? estI : 0, hasta + 14) + 10, y1 = P.K * 1.06;
    const X = i => L + (i - x0) / (x1 - x0) * (Wd - L - R), Y = y => T + (1 - y / y1) * (H - T - B), f1 = x => x.toFixed(1);
    let s = '<div class="py-gw"><svg viewBox="0 0 ' + Wd + ' ' + H + '" class="py-svg" role="img" aria-label="Avance acumulado de cerámica y proyección de término">';
    [0, 0.25, 0.5, 0.75, 1].forEach(p => { const y = Y(P.K * p); s += '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + f1(y) + '" y2="' + f1(y) + '" stroke="var(--border)"' + (p === 1 ? ' stroke-dasharray="5 4"' : '') + '/><text x="' + (L - 6) + '" y="' + f1(y + 3) + '" font-size="10" text-anchor="end" fill="var(--sub)">' + fmt(Math.round(P.K * p)) + '</text>'; });
    { const ms = []; let a = new Date(P.ini.substring(0, 7) + '-01T00:00:00Z'); a.setUTCMonth(a.getUTCMonth() + 1);
      while(P.idx(rdIso(a)) <= x1){ ms.push(rdIso(a)); a.setUTCMonth(a.getUTCMonth() + 1); }
      const paso = Math.max(1, Math.ceil(ms.length / 12));
      ms.forEach((d, k) => { if(k % paso) return; const x = X(P.idx(d)); s += '<line x1="' + f1(x) + '" x2="' + f1(x) + '" y1="' + (H - B) + '" y2="' + (H - B + 4) + '" stroke="var(--sub)"/><text x="' + f1(x) + '" y="' + (H - 8) + '" font-size="10" text-anchor="middle" fill="var(--sub)">' + RD_MC[Number(d.substring(5, 7)) - 1] + (d.substring(5, 7) === '01' ? ' ' + d.substring(2, 4) : '') + '</text>'; }); }
    if(E.freno) Q.S.forEach(w => { if(w.est !== 'freno' && w.est !== 'parada') return; const a = X(P.idx(w.l)), b = X(Math.min(hasta, P.idx(w.l) + 7)); s += '<rect x="' + f1(a) + '" y="' + T + '" width="' + f1(Math.max(2, b - a)) + '" height="' + (H - T - B) + '" fill="var(--' + (w.est === 'parada' ? 'bad,#c0392b' : 'warn,#d99a00') + ')" opacity="0.16"/><text x="' + f1((a + b) / 2) + '" y="' + (T + 10) + '" font-size="9" text-anchor="middle" fill="var(--sub)">S' + w.inf.n + '</text>'; });
    if(E.barras){ const mx = Math.max(1, ...Q.S.map(w => w.m)); Q.S.forEach(w => { if(!(w.m > 0)) return; const a = X(P.idx(w.l)), b = X(P.idx(w.l) + 7), hh = w.m / mx * 64; s += '<rect x="' + f1(a + 1) + '" y="' + f1(H - B - hh) + '" width="' + f1(Math.max(2, b - a - 2)) + '" height="' + f1(hh) + '" fill="var(--accent)" opacity="0.32"/>'; }); }
    if(E.plan) s += '<line x1="' + f1(X(0)) + '" y1="' + f1(Y(0)) + '" x2="' + f1(X(finI)) + '" y2="' + f1(Y(P.K)) + '" stroke="var(--ok,#43a047)" stroke-width="1.5" stroke-dasharray="9 4"/><circle cx="' + f1(X(finI)) + '" cy="' + f1(Y(P.K)) + '" r="4" fill="var(--ok,#43a047)" stroke="var(--panel)" stroke-width="2"/><text x="' + f1(X(finI) - 7) + '" y="' + f1(Y(P.K) - 6) + '" font-size="10" text-anchor="end" fill="var(--sub)">oficial ' + pyFd(FIN_OFICIAL) + '</text>';
    if(P.i0 > 0) s += '<line x1="' + f1(X(0)) + '" y1="' + f1(Y(0)) + '" x2="' + f1(X(P.i0)) + '" y2="' + f1(Y(P.cum[P.i0])) + '" stroke="var(--accent)" stroke-width="2" stroke-dasharray="2 5"/>';
    { const pts = []; for(let i = P.i0; i <= hasta; i++) pts.push(f1(X(i)) + ',' + f1(Y(P.cum[i]))); s += '<polyline fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" points="' + pts.join(' ') + '"/>'; }
    if(E.proy && estI != null){ const ye = Math.min(P.K, lleva + v * (estI - hasta)); s += '<line x1="' + f1(X(hasta)) + '" y1="' + f1(Y(lleva)) + '" x2="' + f1(X(estI)) + '" y2="' + f1(Y(ye)) + '" stroke="var(--warn,#d99a00)" stroke-width="2" stroke-dasharray="7 4"/><circle cx="' + f1(X(estI)) + '" cy="' + f1(Y(ye)) + '" r="4" fill="var(--warn,#d99a00)" stroke="var(--panel)" stroke-width="2"/><text x="' + f1(X(estI) - 7) + '" y="' + f1(Y(ye) + 28) + '" font-size="10" text-anchor="end" fill="var(--text)">estimado ' + pyFd(estD) + '</text>'; }
    s += '<line x1="' + f1(X(hasta)) + '" x2="' + f1(X(hasta)) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--sub)" stroke-dasharray="3 3"/><text x="' + f1(X(hasta) - 4) + '" y="' + (H - B - 5) + '" font-size="10" text-anchor="end" fill="var(--sub)">hoy</text><circle cx="' + f1(X(hasta)) + '" cy="' + f1(Y(lleva)) + '" r="4" fill="var(--accent)" stroke="var(--panel)" stroke-width="2"/>'
      + '<line class="py-cl" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--text)" stroke-width="1" visibility="hidden"/><circle class="py-cc" r="4.5" fill="var(--panel)" stroke="var(--text)" stroke-width="2" visibility="hidden"/></svg></div>';
    h += s + '<div class="py-ley">' + leyLinea('var(--accent)', '', 'Real') + (P.i0 > 0 ? leyLinea('var(--accent)', '2 4', 'Sin fecha por día') : '') + (E.proy && estI != null ? leyLinea('var(--warn,#d99a00)', '6 3', 'Proyección') : '') + (E.plan ? leyLinea('var(--ok,#43a047)', '8 3', 'Plan oficial') : '') + '</div>';
    g = {Wd, L, R, x0, x1, X, Y}; proyF = E.proy && estI != null ? i => Math.min(P.K, lleva + v * (i - hasta)) : null; planF = E.plan ? i => Math.min(P.K, P.K * i / Math.max(1, finI)) : null;
    }
    // ===== semanas =====
    const EST = {curso: 'En curso', parada: 'Parada', freno: 'Freno', normal: 'Normal'};
    const fila = w => {
      const d = !w.ant || w.ant.parcial ? {c: 'eq', t: '—'} : w.cur ? pyDif(w.n ? w.m / w.n : 0, w.ant.n ? w.ant.m / w.ant.n : 0) : pyDif(w.m, w.ant.m);
      const t = '<b>Semana ' + w.inf.n + ' · ' + pyFd(w.l) + ' al ' + pyFd(w.fin) + '</b>Equipo: ' + fmt(w.m) + ' m² en ' + w.n + (w.n === 1 ? ' día' : ' días') + (w.parcial ? ' (el registro por día empieza esta semana)' : '') + (w.cur ? ' (en curso; se compara por día)' : '')
        + (w.det.length ? '<br>' + w.det.map(x => esc(x.n) + ': ' + fmt(x.m2) + ' m² · ' + x.dias + (x.dias === 1 ? ' día' : ' días')).join('<br>') : '');
      return '<div class="py-sr r2-sr ' + w.est + '"' + tip(t) + '><span class="py-s1">S' + w.inf.n + ' · ' + esc(w.inf.rango) + '</span><b class="py-s2">' + fmt(w.m) + ' m²</b><span class="py-s3 ' + d.c + '">' + d.t + '</span><span class="py-s4"><i class="py-e ' + w.est + '">' + EST[w.est] + '</i></span></div>';
    };
    const filas = Q.S.slice().reverse().map(fila), frenos = Q.S.filter(w => w.est === 'freno' || w.est === 'parada');
    h += '<div class="py-sub"' + tip('<b>Cómo se marca</b>Parada: semana sin m².<br>Freno: menos del 60 % de una semana normal (mediana: ' + fmt(Q.med) + ' m²).') + '>Semanas · ' + (frenos.length ? 'con freno o parada: <b>' + frenos.map(w => 'S' + w.inf.n).join(', ') + '</b>' : 'sin frenos ni paradas') + '</div>'
      + '<div class="py-sems"><div class="py-sr r2-sr py-sh"><span class="py-s1">Semana</span><span class="py-s2">m²</span><span class="py-s3">Contra la anterior</span><span class="py-s4">Estado</span></div>' + filas.slice(0, 8).join('') + '</div>'
      + (filas.length > 8 ? '<details class="py-mas"><summary>Ver semanas anteriores (' + (filas.length - 8) + ')</summary><div class="py-sems">' + filas.slice(8).join('') + '</div></details>' : '');
    pyM = {P, Q, hasta, tips, g, proy: proyF, plan: planF, fan};
    return h;
  }
  // ===== otras vistas del gráfico: burn-up, curva S, abanico y velocidad =====
  function pyAlt(P, Q, o){
    const m = pyEstado.vista, K = P.K, hasta = o.hasta, lleva = o.lleva, finI = o.finI, f1 = x => x.toFixed(1);
    const Wd = 900, H = 290, L = 50, R = 16, T = 16, B = 26;
    const cu = (c, t) => '<span><i class="py-cu" style="background:' + c + '"></i>' + t + '</span>';
    const rejilla = (tope, Y) => [0, 0.25, 0.5, 0.75, 1].map(p => { const y = Y(tope * p); return '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + f1(y) + '" y2="' + f1(y) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + f1(y + 3) + '" font-size="10" text-anchor="end" fill="var(--sub)">' + fmt(Math.round(tope * p)) + '</text>'; }).join('');
    if(m === 'vel'){
      const S = Q.S, tope = Math.max(1, Q.med, o.nec || 0, ...S.map(w => w.m)) * 1.12, bw = (Wd - L - R) / S.length, Y = y => T + (1 - y / tope) * (H - T - B), paso = Math.max(1, Math.ceil(S.length / 16));
      let s = '<div class="py-sub">m² de cerámica por semana</div><div class="py-gw"><svg viewBox="0 0 ' + Wd + ' ' + H + '" class="py-svg py-vel" role="img" aria-label="m² de cerámica por semana">' + rejilla(tope, Y);
      S.forEach((w, k) => {
        const x = L + bw * k, c = w.est === 'freno' ? 'var(--warn,#d99a00)' : 'var(--accent)';
        if(w.m > 0) s += '<rect x="' + f1(x + bw * 0.14) + '" y="' + f1(Y(w.m)) + '" width="' + f1(bw * 0.72) + '" height="' + f1(Y(0) - Y(w.m)) + '" fill="' + c + '"' + (w.cur ? ' opacity="0.45"' : '') + '/>';
        if(S.length <= 16 || w.est === 'parada') s += '<text x="' + f1(x + bw / 2) + '" y="' + f1(Y(w.m) - 5) + '" font-size="10" text-anchor="middle" fill="var(--' + (w.est === 'parada' ? 'bad,#c0392b' : 'text') + ')">' + fmt(Math.round(w.m)) + '</text>';
        if((S.length - 1 - k) % paso === 0) s += '<text x="' + f1(x + bw / 2) + '" y="' + (H - 8) + '" font-size="10" text-anchor="middle" fill="var(--sub)">S' + w.inf.n + '</text>';
        s += '<rect x="' + f1(x) + '" y="' + T + '" width="' + f1(bw) + '" height="' + (H - T - B) + '" fill="transparent"' + o.tip('<b>Semana ' + w.inf.n + ' · ' + pyFd(w.l) + ' al ' + pyFd(w.fin) + '</b>' + fmt(w.m) + ' m² en ' + w.n + (w.n === 1 ? ' día' : ' días') + (w.cur ? ' · en curso' : w.est === 'freno' ? ' · freno' : w.est === 'parada' ? ' · parada' : '') + (Q.med ? '<br>' + Math.round(w.m / Q.med * 100) + ' % de una semana normal' : '')) + '/>';
      });
      if(Q.med) s += '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + f1(Y(Q.med)) + '" y2="' + f1(Y(Q.med)) + '" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="5 4"/>';
      if(o.nec) s += '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + f1(Y(o.nec)) + '" y2="' + f1(Y(o.nec)) + '" stroke="var(--ok,#43a047)" stroke-width="1.5" stroke-dasharray="9 4"/>';
      return {h: s + '</svg></div><div class="py-ley">' + cu('var(--accent)', 'Semana') + cu('var(--warn,#d99a00)', 'Freno') + (Q.med ? leyLinea('var(--text)', '5 4', 'Semana normal · ' + fmt(Q.med) + ' m²') : '') + (o.nec ? leyLinea('var(--ok,#43a047)', '8 3', 'Necesario para el ' + pyFd(FIN_OFICIAL) + ' · ' + fmt(o.nec) + ' m²') : '') + '</div>', g: null};
    }
    // ===== ritmos: uno solo, o tres para el abanico (peores, normales y mejores semanas) =====
    let fan = null;
    if(m === 'abanico'){
      const ws = Q.S.filter(w => !w.cur && !w.parcial).slice(-12).map(w => w.lv).sort((a, b) => a - b), n = ws.length;
      if(n >= 3){ const k = Math.max(1, Math.round(n / 4)), pr = a => a.reduce((x, y) => x + y, 0) / a.length, med = n % 2 ? ws[(n - 1) / 2] : (ws[n / 2 - 1] + ws[n / 2]) / 2;
        fan = {pes: pr(ws.slice(0, k)) / 7 + o.add, prob: med / 7 + o.add, opt: pr(ws.slice(-k)) / 7 + o.add, n, k, f: (v, i) => Math.min(K, lleva + v * (i - hasta))}; }
    }
    const fin = v => v > 0 ? Math.min(hasta + 720, hasta + Math.ceil((K - lleva) / v)) : null;
    const fdI = i => i != null && i < hasta + 720 ? pyFd(rdSuma(P.ini, i)) : 'sin fecha a la vista';
    const vP = fan ? fan.prob : o.v, iP = fin(vP), iO = fan ? fin(fan.opt) : null, iS = fan ? fin(fan.pes) : null;
    const x1 = Math.max(finI, iP || 0, fan ? Math.min(iS == null ? 1e9 : iS, (iP || hasta) + 120) : 0, hasta + 14) + 10, y1 = K * 1.06;
    const X = i => L + i / x1 * (Wd - L - R), Y = y => T + (1 - y / y1) * (H - T - B);
    const L0 = i => 1 / (1 + Math.exp(-Math.log(49) * (i - finI / 2) / (finI / 2)));
    const planS = i => K * (L0(Math.max(0, Math.min(finI, i))) - L0(0)) / (L0(finI) - L0(0));
    const sub = m === 'burnup' ? 'Avance acumulado contra el total de la obra' : m === 's' ? 'Plan oficial en curva S contra el avance real' : fan ? 'Rango de término según las últimas ' + fan.n + ' semanas completas: las mejores, una normal y las peores' : 'Faltan semanas completas para armar el rango (mínimo 3); se muestra una sola proyección';
    let s = '<div class="py-sub">' + sub + '</div><div class="py-gw"><svg viewBox="0 0 ' + Wd + ' ' + H + '" class="py-svg" role="img" aria-label="' + sub + '">' + rejilla(K, Y);
    { const ms = []; let a = new Date(P.ini.substring(0, 7) + '-01T00:00:00Z'); a.setUTCMonth(a.getUTCMonth() + 1);
      while(P.idx(rdIso(a)) <= x1){ ms.push(rdIso(a)); a.setUTCMonth(a.getUTCMonth() + 1); }
      const paso = Math.max(1, Math.ceil(ms.length / 12));
      ms.forEach((d, k) => { if(k % paso) return; const x = X(P.idx(d)); s += '<line x1="' + f1(x) + '" x2="' + f1(x) + '" y1="' + (H - B) + '" y2="' + (H - B + 4) + '" stroke="var(--sub)"/><text x="' + f1(x) + '" y="' + (H - 8) + '" font-size="10" text-anchor="middle" fill="var(--sub)">' + RD_MC[Number(d.substring(5, 7)) - 1] + (d.substring(5, 7) === '01' ? ' ' + d.substring(2, 4) : '') + '</text>'; }); }
    s += '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + f1(Y(K)) + '" y2="' + f1(Y(K)) + '" stroke="var(--text)" stroke-width="1.6"/><text x="' + (L + 6) + '" y="' + f1(Y(K) - 5) + '" font-size="10" fill="var(--text)">total ' + fmt(K) + ' m²</text>';
    if(m === 's'){ const pts = []; for(let i = 0; i <= finI; i += 3) pts.push(f1(X(i)) + ',' + f1(Y(planS(i)))); pts.push(f1(X(finI)) + ',' + f1(Y(K)));
      s += '<polyline fill="none" stroke="var(--ok,#43a047)" stroke-width="1.8" stroke-dasharray="9 4" points="' + pts.join(' ') + '"/><circle cx="' + f1(X(finI)) + '" cy="' + f1(Y(K)) + '" r="4" fill="var(--ok,#43a047)" stroke="var(--panel)" stroke-width="2"/>'; }
    else s += '<line x1="' + f1(X(finI)) + '" x2="' + f1(X(finI)) + '" y1="' + f1(Y(K)) + '" y2="' + (H - B) + '" stroke="var(--ok,#43a047)" stroke-dasharray="4 4"/><text x="' + f1(X(finI) - 4) + '" y="' + (H - B - 18) + '" font-size="10" text-anchor="end" fill="var(--sub)">oficial</text>';
    const punta = v => { const ie = Math.min(x1, hasta + (K - lleva) / v); return [ie, Math.min(K, lleva + v * (ie - hasta))]; };
    const recta = (v, c, d, w) => { if(!(v > 0)) return ''; const e = punta(v); return '<line x1="' + f1(X(hasta)) + '" y1="' + f1(Y(lleva)) + '" x2="' + f1(X(e[0])) + '" y2="' + f1(Y(e[1])) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-dasharray="' + d + '"/>' + (e[1] >= K - 0.01 ? '<circle cx="' + f1(X(e[0])) + '" cy="' + f1(Y(K)) + '" r="4" fill="' + c + '" stroke="var(--panel)" stroke-width="2"/>' : ''); };
    if(fan && fan.opt > 0){ const a = punta(fan.opt), b = fan.pes > 0 ? punta(fan.pes) : [x1, lleva];
      s += '<polygon fill="var(--warn,#d99a00)" opacity="0.13" points="' + [[hasta, lleva], a, b[1] < K ? [x1, K] : null, b].filter(Boolean).map(q => f1(X(q[0])) + ',' + f1(Y(q[1]))).join(' ') + '"/>'; }
    if(P.i0 > 0) s += '<line x1="' + f1(X(0)) + '" y1="' + f1(Y(0)) + '" x2="' + f1(X(P.i0)) + '" y2="' + f1(Y(P.cum[P.i0])) + '" stroke="var(--accent)" stroke-width="2" stroke-dasharray="2 5"/>';
    { const pts = []; for(let i = P.i0; i <= hasta; i++) pts.push(f1(X(i)) + ',' + f1(Y(P.cum[i]))); s += '<polyline fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" points="' + pts.join(' ') + '"/>'; }
    if(fan) s += recta(fan.opt, 'var(--ok,#43a047)', '3 4', 1.6) + recta(fan.pes, 'var(--bad,#c0392b)', '3 4', 1.6);
    s += recta(vP, 'var(--warn,#d99a00)', '7 4', 2)
      + '<line x1="' + f1(X(hasta)) + '" x2="' + f1(X(hasta)) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--sub)" stroke-dasharray="3 3"/><text x="' + f1(X(hasta) - 4) + '" y="' + (H - B - 5) + '" font-size="10" text-anchor="end" fill="var(--sub)">hoy</text><circle cx="' + f1(X(hasta)) + '" cy="' + f1(Y(lleva)) + '" r="4" fill="var(--accent)" stroke="var(--panel)" stroke-width="2"/>'
      + '<line class="py-cl" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--text)" stroke-width="1" visibility="hidden"/><circle class="py-cc" r="4.5" fill="var(--panel)" stroke="var(--text)" stroke-width="2" visibility="hidden"/></svg></div>';
    const l = leyLinea('var(--accent)', '', 'Real') + (fan ? leyLinea('var(--ok,#43a047)', '3 3', 'Optimista · ' + fdI(iO)) + leyLinea('var(--warn,#d99a00)', '6 3', 'Probable · ' + fdI(iP)) + leyLinea('var(--bad,#c0392b)', '3 3', 'Pesimista · ' + fdI(iS)) : leyLinea('var(--warn,#d99a00)', '6 3', 'Proyección · ' + fdI(iP)))
      + (m === 's' ? leyLinea('var(--ok,#43a047)', '8 3', 'Plan oficial · ' + pyFd(FIN_OFICIAL)) : leyLinea('var(--ok,#43a047)', '4 3', 'Oficial · ' + pyFd(FIN_OFICIAL)));
    return {h: s + '<div class="py-ley">' + l + '</div>', g: {Wd, L, R, x0: 0, x1, X, Y}, proy: vP > 0 ? i => Math.min(K, lleva + vP * (i - hasta)) : null, plan: m === 's' ? planS : null, fan};
  }
  // ===== etiqueta flotante de detalle =====
  function pyTip(html, x, y){
    let t = document.getElementById('pyTip');
    if(!t){ t = document.createElement('div'); t.id = 'pyTip'; t.className = 'py-tip'; document.body.appendChild(t); }
    if(html == null){ t.style.display = 'none'; return; }
    t.innerHTML = html; t.style.display = 'block';
    const w = t.offsetWidth, a = t.offsetHeight;
    t.style.left = Math.max(8, Math.min(x + 14, innerWidth - w - 8)) + 'px';
    t.style.top = (y + 18 + a > innerHeight ? Math.max(8, y - a - 12) : y + 18) + 'px';
  }
  function pyCursor(e, svg){
    const M = pyM; if(!M || !M.g) return; const g = M.g, P = M.P, r = svg.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * g.Wd, i = Math.max(g.x0, Math.min(Math.round(g.x1), Math.round(g.x0 + (px - g.L) / (g.Wd - g.L - g.R) * (g.x1 - g.x0))));
    const d = rdSuma(P.ini, i), fut = i > M.hasta, y = !fut ? P.cum[i] : (M.proy ? M.proy(i) : null);
    const cl = svg.querySelector('.py-cl'), cc = svg.querySelector('.py-cc');
    cl.setAttribute('x1', g.X(i)); cl.setAttribute('x2', g.X(i)); cl.setAttribute('visibility', 'visible');
    if(y != null){ cc.setAttribute('cx', g.X(i)); cc.setAttribute('cy', g.Y(y)); cc.setAttribute('visibility', 'visible'); } else cc.setAttribute('visibility', 'hidden');
    let h = '<b>' + PY_DC[rdFecha(d).getUTCDay()] + ' ' + pyFd(d) + ' · Semana ' + nSem(rdLunes(d)) + '</b>';
    if(!fut){
      const w = M.Q.S.find(q => q.l === rdLunes(d));
      if(i < P.i0) h += 'Acumulado: ~' + fmt(y) + ' m²<br>Sin registro por día antes del ' + pyFd(P.d0);
      else h += 'Ese día: ' + fmt(P.diario[d] || 0) + ' m²' + (P.dud[d] ? ' (varios marcados juntos)' : '') + '<br>Acumulado: ' + fmt(y) + ' m² (' + Math.round(y / P.K * 100) + ' %)' + (w ? '<br>Su semana: ' + fmt(w.m) + ' m²' : '');
    } else if(M.fan) h += 'Optimista: ~' + fmt(M.fan.f(M.fan.opt, i)) + ' m²<br>Probable: ~' + fmt(M.fan.f(M.fan.prob, i)) + ' m²<br>Pesimista: ~' + fmt(M.fan.f(M.fan.pes, i)) + ' m²';
    else h += y != null ? 'Proyectado: ~' + fmt(y) + ' m² (' + Math.round(y / P.K * 100) + ' %)' : 'Sin proyección a la vista';
    if(M.plan && y != null){ const pl = M.plan(i), df = y - pl; h += '<br>Plan oficial: ' + fmt(pl) + ' m² · ' + (df >= 0 ? 'adelantado ' : 'atrasado ') + fmt(Math.abs(df)) + ' m²'; }
    pyTip(h, e.clientX, e.clientY);
  }
  // ===== al tocar checks o pestañas: la ventana no se mueve ni cambia de alto, y el scroll queda donde estaba =====
  function pyQuieto(fn){
    let box = raiz.parentElement; while(box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
    const ancla = () => raiz.querySelector('.py-caja'), a0 = ancla(), top0 = a0 ? a0.getBoundingClientRect().top : 0, st = box ? box.scrollTop : 0;
    raiz.style.minHeight = raiz.offsetHeight + 'px';
    fn();
    const a1 = ancla(); if(box){ box.scrollTop = st; if(a1 && a0) box.scrollTop = st + (a1.getBoundingClientRect().top - top0); }
  }
  function pyOcultar(){ pyTip(null); raiz.querySelectorAll('.py-cl,.py-cc').forEach(x => x.setAttribute('visibility', 'hidden')); }
  function pintar(){ pintarGrupo('Cerámica', 'Cerámica', $('rdOutC')); pintarGrupo('Frague', 'Frague', $('rdOutF'));
    const g = raiz.querySelector('.py-gw'); if(g && pyM && pyM.g) g.scrollLeft = Math.max(0, pyM.g.X(pyM.hasta) / pyM.g.Wd * g.scrollWidth - g.clientWidth * 0.6); }
  function pintarGrupo(cat, etq, out){
    const vista = $('rdVista').value, lista = listaGrupo(cat);
    if(!lista.length){ out.innerHTML = ''; return; }
    $('rdSelD').style.display = vista === 'dia' ? '' : 'none'; $('rdSelW').style.display = vista === 'semana' ? '' : 'none'; $('rdSelM').style.display = vista === 'mes' ? '' : 'none';
    let desde, hasta, titulo, sub = '';
    if(vista === 'dia'){ const f = $('rdDia').value || hoy, d = rdFecha(f); desde = hasta = f; titulo = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + RD_MES[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); sub = d.getUTCDay() === 0 ? 'Los domingos no se registra asistencia.' : ''; }
    else if(vista === 'semana'){ const l = $('rdSem').value, w = infoSem(l); desde = l; hasta = rdSuma(l, 6); titulo = 'Semana ' + w.n + ' · ' + w.rango + w.tag; sub = w.nota; }
    else if(vista === 'mes'){ const m = $('rdMes').value; desde = m + '-01'; hasta = m + '-31'; titulo = RD_MES[Number(m.substring(5)) - 1] + ' ' + m.substring(0, 4); sub = 'Suma por la fecha real de cada día: las semanas que mezclan dos meses se reparten día a día.'; }
    else { desde = '0000-01-01'; hasta = '9999-12-31'; titulo = 'Total acumulado'; sub = 'Desde la semana ' + 1 + ' (' + fd(primera) + ') hasta hoy · ' + todasSem.length + ' semanas.'; }
    titulo = etq + ' · ' + titulo;
    const filas = lista.filter(t => !(t.inicio && t.inicio > hasta) && !(t.fin && t.fin < desde)).map(t => ({t, nombre: t.nombre, r: stat(t, desde, hasta, cat), mm: minmax(t, desde, hasta, cat)}))
      .filter(f => f.r.m2 > 0);   // @@rend-solo-con-m2: sin m² en el período no se muestra ni entra al promedio (tampoco finiquitados sin trabajo ahí); aparece cuando los tenga
    if(!filas.some(f => f.r.m2 > 0 || f.r.reg > 0 || f.r.dias > 0)){ if(cat === 'Frague'){ out.innerHTML = ''; return; } out.innerHTML = '<div class="rd-tit">' + esc(titulo) + '</div><div class="rd-vacio">No hay trabajo terminado ni asistencia registrada en este período.</div>'; return; }
    const act = filas.filter(f => f.r.dias > 0 && !f.r.sinInfo);
    const totM2 = filas.reduce((a, f) => a + f.r.m2, 0), totDias = act.reduce((a, f) => a + f.r.dias, 0);
    const prom = totDias ? act.reduce((a, f) => a + f.r.m2, 0) / totDias : 0;
    filas.forEach(f => { f.pct = prom && f.r.dias && !f.r.sinInfo ? f.r.porDia / prom * 100 : null; });
    const conPct = filas.filter(f => f.pct != null).sort((a, b) => b.pct - a.pct);
    const conAs = filas.filter(f => f.r.asistPct != null).sort((a, b) => b.r.asistPct - a.r.asistPct || a.r.F - b.r.F);
    const maxM2 = Math.max(1, ...filas.map(f => f.r.m2));
    const conMm = filas.filter(f => f.mm.dia);
    const topD = conMm.length ? conMm.reduce((a, f) => f.mm.dia.max > a.mm.dia.max ? f : a) : null, botD = conMm.length ? conMm.reduce((a, f) => f.mm.dia.min < a.mm.dia.min ? f : a) : null;
    const lineaMm = f => {
      const d = f.mm.dia, w = f.mm.sem; if(!d) return '';
      let h = '';   // @@rend-sin-por-dia: ya no se muestran cifras por día; los m² se miden por semana
      if(vista !== 'dia' && vista !== 'semana' && w) h += '<small class="rd-mm">Por semana: prom <b>' + fmt(w.prom) + '</b> · máx <b>' + fmt(w.max) + '</b> (S' + infoSem(w.maxK).n + ') · mín <b>' + fmt(w.min) + '</b> (S' + infoSem(w.minK).n + ')</small>';
      return h;
    };
    const lineaPot = f => {
      const r = f.r; if(!r.conAsist || !r.dias || !r.m2) return '';
      const pot = r.porDia * r.disp, perd = pot - r.m2;
      return '<small class="rd-mm">Con asistencia completa (' + fmt(r.disp) + (r.disp === 1 ? ' día' : ' días') + '): ~<b>' + fmt(pot) + ' m²</b>' + (perd > 0.05 ? ' · se perdieron ~' + fmt(perd) + ' m² por faltas' : ' · sin pérdida por faltas') + '</small>';
    };
    const sinAs = filas.filter(f => !f.r.conAsist && (f.r.m2 > 0)).length;
    const asEq = conAs.length ? conAs.reduce((a, f) => a + f.r.trab, 0) / Math.max(1e-9, conAs.reduce((a, f) => a + f.r.disp, 0)) * 100 : null;
    /* gráfico de m² por semana (últimas 12, o todas en Total hasta 30) */
    const lim = vista === 'total' ? 30 : 12; const semG = todasSem.slice(-lim);
    const sm = semG.map(l => lista.reduce((a, t) => a + stat(t, l, rdSuma(l, 6), cat).m2, 0)), maxS = Math.max(1, ...sm), W = 900, Hh = 130, bw = W / sm.length;
    const selL = vista === 'semana' ? $('rdSem').value : '';
    const barras = sm.map((v, i) => { const h = v / maxS * (Hh - 34); const w = infoSem(semG[i]);
      return '<rect x="' + (i * bw + 4) + '" y="' + (Hh - 16 - h) + '" width="' + Math.max(4, bw - 8) + '" height="' + h + '" fill="var(--accent)" opacity="' + (selL && selL !== semG[i] ? '.45' : '1') + '"><title>Semana ' + w.n + ' · ' + w.rango + ': ' + fmt(v) + ' m²</title></rect>'
      + '<text x="' + (i * bw + bw / 2) + '" y="' + (Hh - 18 - h) + '" font-size="9" text-anchor="middle" fill="var(--text)">' + (v ? fmt(v) : '') + '</text>'
      + (sm.length <= 16 ? '<text x="' + (i * bw + bw / 2) + '" y="' + (Hh - 3) + '" font-size="9" text-anchor="middle" fill="var(--sub)">S' + w.n + '</text>' : ''); }).join('');
    const hist = f => {
      const sems = todasSem.slice().reverse().map(l => ({l, r: stat(f.t, l, rdSuma(l, 6), cat)})).filter(x => x.r.m2 > 0 || x.r.reg > 0 || x.r.dias > 0);
      if(!sems.length) return '<div class="rd-hv">Sin historial todavía.</div>';
      const tot = stat(f.t, '0000-01-01', '9999-12-31', cat);
      return '<div class="rd-hv"><b>Acumulado:</b> ' + fmt(tot.m2) + ' m² en ' + sems.length + ' semanas · ' + (tot.conAsist ? tot.F + (tot.F === 1 ? ' falta' : ' faltas') + ' en total' : 'asistencia sin registrar') + '</div>'
        + sems.map(x => { const w = infoSem(x.l); return '<div class="rd-hl"><b class="hm">' + fmt(x.r.m2) + ' m²</b><span class="hs">' + w.corto + '</span><span class="hr">' + w.rango + '</span><span class="ha' + (x.r.conAsist ? '' : ' sin') + '">' + fraseAsist(x.r) + '</span>' + (w.mixta ? '<small>' + w.nota + '</small>' : '') + '</div>'; }).join('');
    };
    const ord = filas.slice().sort((a, b) => (b.pct == null ? -1 : b.pct) - (a.pct == null ? -1 : a.pct) || b.r.m2 - a.r.m2);
    out.innerHTML = '<div class="rd-tit">' + esc(titulo) + '</div>' + (sub ? '<div class="rd-sub">' + esc(sub) + '</div>' : '')
      + '<div class="rd-res"><div><b>' + fmt(totM2) + ' m²</b><span>del equipo en el período</span></div><div><b>' + fmt(prom) + ' m²</b><span>promedio por día trabajado</span></div><div><b>' + (asEq == null ? '—' : Math.round(asEq) + '%') + '</b><span>asistencia del equipo' + (asEq == null ? ' (sin registrar)' : '') + '</span></div></div>'
      + (topD ? '<div class="rd-res"><div><b>' + fmt(topD.mm.dia.max) + ' m²</b><span>máximo en un día · ' + esc(topD.nombre) + ' (' + fd(topD.mm.dia.maxK) + ')</span></div><div><b>' + fmt(botD.mm.dia.min) + ' m²</b><span>mínimo en un día · ' + esc(botD.nombre) + ' (' + fd(botD.mm.dia.minK) + ')</span></div></div>' : '')
      + '<div class="rd-dest">'
      + (conPct.length ? '<div class="rd-d ok"><small>Más rinde</small><b>' + esc(conPct[0].nombre) + '</b><span>' + fmt(conPct[0].r.porDia) + ' m² por día</span></div><div class="rd-d bad"><small>Menos rinde</small><b>' + esc(conPct[conPct.length - 1].nombre) + '</b><span>' + fmt(conPct[conPct.length - 1].r.porDia) + ' m² por día</span></div>' : '')
      + (conAs.length ? '<div class="rd-d ok"><small>Mejor asistencia</small><b>' + esc(conAs[0].nombre) + '</b><span>' + Math.round(conAs[0].r.asistPct) + '% · ' + conAs[0].r.F + (conAs[0].r.F === 1 ? ' falta' : ' faltas') + '</span></div><div class="rd-d bad"><small>Peor asistencia</small><b>' + esc(conAs[conAs.length - 1].nombre) + '</b><span>' + Math.round(conAs[conAs.length - 1].r.asistPct) + '% · ' + conAs[conAs.length - 1].r.F + (conAs[conAs.length - 1].r.F === 1 ? ' falta' : ' faltas') + '</span></div>' : '<div class="rd-d"><small>Asistencia</small><b>Sin registrar</b><span>Usa el botón Asistencia del panel</span></div>')
      + '</div><div class="rd-tit">Ranking</div><div class="rd-tabla">' + ord.map((f, i) => {
        const r = f.r, p = f.pct;
        const frase = '<b>' + esc(f.nombre) + ': ' + (r.sinInfo ? 'sin dato' : fmt(r.m2) + ' m²') + '</b> · ' + (vista === 'semana' ? infoSem($('rdSem').value).corto : esc(titulo));
        return '<div class="rd-row"><div class="rd-f"><div class="rd-n"><span class="rd-fr">' + (i + 1) + '. ' + frase + '</span><small>' + r.n + ' partidas · ' + (r.conAsist ? fmt(r.dias) + ' días trabajados' : 'sin asistencia registrada') + (r.dias && !r.sinInfo ? ' · ' + fmt(r.porDia) + ' m² por día' : '') + '</small>' + (r.sinInfo ? '<small class="rd-dud">Sin información garantizada: se marcaron muchos terminados juntos este día y las fechas no están revisadas.</small>' : r.dud ? '<small class="rd-dud">' + r.dud + (r.dud === 1 ? ' día' : ' días') + ' con terminados juntos sin revisar: ahí se usó el promedio del equipo.</small>' : '') + lineaMm(f) + lineaPot(f) + '</div>'
          + '<div class="rd-b"' + (p == null ? '' : ' title="' + Math.round(p) + '% del promedio por día"') + '><div class="rd-barra"><i style="width:' + (r.m2 / maxM2 * 100) + '%;background:' + (p == null ? 'var(--sub)' : color(p)) + '"></i></div><span class="rd-sm"><b>' + (r.sinInfo ? 'sin dato' : fmt(r.m2) + ' m²') + '</b> ' + (vista === 'semana' ? 'en la semana' : vista === 'dia' ? 'en el día' : vista === 'mes' ? 'en el mes' : 'en total') + '</span><span class="rd-sd">' + (r.sinInfo ? 'sin información garantizada' : r.dias ? 'estimado por día: <b>~' + fmt(r.porDia) + ' m²</b>' + (p == null ? '' : (() => { const dif = Math.round(p - 100), t = Math.abs(dif) < 3 ? 'eq' : dif > 0 ? 'up' : 'down'; return ' <span class="rd-dif ' + t + '" title="' + (t === 'eq' ? 'Rinde casi igual al promedio del equipo: no mueve el término de la proyección.' : dif > 0 ? 'Rinde ' + dif + '% sobre el promedio del equipo (m² por día trabajado): con este ritmo termina antes en la proyección.' : 'Rinde ' + Math.abs(dif) + '% bajo el promedio del equipo (m² por día trabajado): con este ritmo termina después en la proyección.') + '">' + (t === 'eq' ? '≈ promedio' : (dif > 0 ? '+' : '−') + Math.abs(dif) + ' %') + '</span>'; })()) : 'sin días para estimar') + '</span></div>'
          + '<div class="rd-d2">' + (r.asistPct == null ? '—' : Math.round(r.asistPct) + '%') + '<small>asistencia</small></div>'
          + '<div class="rd-hb"><button type="button" class="rd-hbtn" aria-expanded="false">Historial</button></div></div><div class="rd-hp" hidden>' + hist(f) + '</div></div>';
      }).join('') + '</div>'
      + '<div class="rd-tit">m² por semana del equipo</div><svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;max-width:900px;height:auto;">' + barras + '</svg>'
      + (cat === 'Cerámica' ? pyHtml() : '')
      + '<details class="rd-nota"><summary>Cómo se calcula el % (oculto en las barras; sale al pasar el cursor)</summary><b>Cómo leer el porcentaje.</b> <b>100%</b> = rindió igual que el promedio del equipo en m² por día trabajado. <b>130%</b> = 30% más que el promedio; <b>70%</b> = 30% menos. Se calcula por día trabajado, así quien faltó no sale perjudicado. Un día que se fueron por falta de cancha no cuenta como falta ni baja el porcentaje (solo se cuenta la parte del día que trabajaron). La <b>asistencia</b> es días trabajados ÷ días que correspondía trabajar. La semana va de lunes a viernes y el sábado solo si alguien fue. Si no hay asistencia registrada, se usan los días con actividad en el panel' + (sinAs ? ' (' + sinAs + ' trabajadores sin asistencia en este período)' : '') + '.</details>';
  }
  raiz.addEventListener('click', e => { const t = e.target.closest('.py-tab'); const x = e.target.closest('.py-b'); if(x){ pyEstado.extra = Math.max(0, Math.min(12, pyEstado.extra + Number(x.getAttribute('data-pyx')))); pyOcultar(); pyQuieto(pintar); return; } if(t){ if(t.hasAttribute('data-pyv')) pyEstado.vista = t.getAttribute('data-pyv'); else pyEstado.ritmo = Number(t.getAttribute('data-pyr')); pyOcultar(); pyQuieto(pintar); } });
  raiz.addEventListener('change', e => { const c = e.target.closest('input[data-pyk]'); if(c){ pyEstado[c.getAttribute('data-pyk')] = c.checked; pyQuieto(pintar); return; } const a = e.target.closest('input[data-pya]'); if(a){ pyEstado.off[a.getAttribute('data-pya')] = !a.checked; pyOcultar(); pyQuieto(pintar); } });
  raiz.addEventListener('pointermove', e => { const g = e.target.closest('.py-svg'); if(g && !g.classList.contains('py-vel')) pyCursor(e, g); });
  raiz.addEventListener('pointerover', e => { const t = e.target.closest('[data-pt]'); if(t && pyM) pyTip(pyM.tips[Number(t.getAttribute('data-pt'))], e.clientX, e.clientY); });
  raiz.addEventListener('pointerout', e => { const a = e.target.closest('[data-pt],.py-svg'), b = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-pt],.py-svg') : null; if(a && a !== b) pyOcultar(); });
  raiz.addEventListener('scroll', pyOcultar, true);
  raiz.addEventListener('click', e => { const b = e.target.closest('.rd-hbtn'); if(!b) return; const p = b.closest('.rd-row').querySelector('.rd-hp'); p.hidden = !p.hidden; b.setAttribute('aria-expanded', p.hidden ? 'false' : 'true'); b.classList.toggle('on', !p.hidden); });
  ['rdVista', 'rdDia', 'rdSem', 'rdMes'].forEach(id => $(id).addEventListener('change', pintar));
  $('rdIrPy').addEventListener('click', () => { const a = raiz.querySelector('.py-ancla'); if(a) a.scrollIntoView({behavior: 'smooth', block: 'start'}); });
  pintar();
}
