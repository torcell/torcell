/* ===== Diagrama de flujo de la obra (archivo compartido) · Oficina Técnica, Jefe de Terreno y administrador de obra ===== */
// @@flujo-comun
// Los datos están en FLUJO: para cambiar una labor se cambia aquí y se ve igual en todas las páginas.
const FLUJO = [
  {rol: 'Oficina Técnica · Edwin', color: '#2e7d4f', pasos: [
    {t: 'Planificar', l: ['Programa y avance físico', 'Avance financiero', 'Hormigonado semanal', 'Reunión de obra']},
    {t: 'Controlar documentos', l: ['Planos y especificaciones', 'Registros del contrato', 'Cambios de proyecto', 'Versiones vigentes']},
    {t: 'Cubicar y pagar', l: ['Cubicaciones por partida', 'Control de cantidades', 'Estados de pago', 'Cuadros de subcontratos']},
    {t: 'Reportar', l: ['Visita diaria a terreno', 'Incumplimientos a jefatura', 'Informes de costo y plazo', 'Coordinar con Calidad']}]},
  {rol: 'Jefe de Terreno', color: '#2f6f8f', pasos: [
    {t: 'Recibir programa', l: ['Programa semanal de obra', 'Planos vigentes', 'Cubicaciones por partida', 'Metas de la semana']},
    {t: 'Organizar la obra', l: ['Cuadrillas y frentes', 'Subcontratos', 'Pedidos a bodega', 'Maquinaria y turnos']},
    {t: 'Supervisar en terreno', l: ['Avance diario por partida', 'Seguridad y orden', 'Calidad de lo ejecutado', 'Plazo y costo']},
    {t: 'Informar y corregir', l: ['Avance en el panel', 'Partidas observadas', 'Problemas a jefatura', 'Cierre de partida']}]}
];
// lo que pasa de una fila a la otra: col = columna donde sale la flecha, baja = va de arriba hacia abajo
const FLUJO_ENLACES = [{col: 0, baja: true, txt: 'programa semanal'}, {col: 3, baja: false, txt: 'avance real'}];

const FLUJO_CSS = `
.fl{--fl-gris:#8a9399;--fl-sep:34px;}
.fl-fila{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--fl-sep);}
.fl-rol{font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:var(--sub);margin:0 0 6px;}
.fl-caja{position:relative;border:1px solid var(--line,var(--border,#c9cdcb));background:var(--panel,#fff);min-width:0;}
.fl-ce{padding:9px 12px;color:#fff;font-weight:700;font-size:13.5px;}
.fl-cu{list-style:none;margin:0;padding:8px 12px 10px;}
.fl-cu li{font-size:12.5px;line-height:1.5;color:var(--text,#222);padding:2px 0;border-bottom:1px solid var(--line,var(--border,#d7dad3));}
.fl-cu li:last-child{border-bottom:0;}
.fl-caja:not(:last-child)::after{content:"";position:absolute;top:21px;right:calc(-1 * var(--fl-sep) + 4px);width:calc(var(--fl-sep) - 8px);height:2px;background:var(--fl-gris);}
.fl-caja:not(:last-child)::before{content:"";position:absolute;top:15px;right:calc(-1 * var(--fl-sep) + 4px);border:7px solid transparent;border-left:9px solid var(--fl-gris);border-right:0;z-index:1;}
.fl-medio{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--fl-sep);height:78px;}
.fl-enl{display:flex;align-items:center;gap:8px;color:var(--sub);font-size:12px;}
.fl-enl svg{flex:none;width:14px;height:62px;}
.fl-sep{height:0;}
@media (max-width:720px){
  .fl-fila{grid-template-columns:minmax(0,1fr);gap:30px;}
  .fl-caja:not(:last-child)::after{top:auto;bottom:-24px;right:auto;left:50%;width:2px;height:18px;margin-left:-1px;}
  .fl-caja:not(:last-child)::before{top:auto;bottom:-15px;right:auto;left:50%;margin:0 0 -9px -7px;border:7px solid transparent;border-top:9px solid var(--fl-gris);border-bottom:0;}
  .fl-medio{display:none;}
}`;
function flechaVert(baja){
  const y1 = baja ? 2 : 60, y2 = baja ? 60 : 2, p = baja ? '3,52 7,60 11,52' : '3,10 7,2 11,10';
  return '<svg viewBox="0 0 14 62" aria-hidden="true"><line x1="7" y1="' + y1 + '" x2="7" y2="' + y2 + '" stroke="#8a9399" stroke-width="2"/><polyline points="' + p + '" fill="none" stroke="#8a9399" stroke-width="2"/></svg>';
}
function dibujarFlujo(raiz){
  if(!document.getElementById('flujoCss')){ const s = document.createElement('style'); s.id = 'flujoCss'; s.textContent = FLUJO_CSS; document.head.appendChild(s); }
  const fila = f => '<p class="fl-rol">' + esc(f.rol) + '</p><div class="fl-fila">' + f.pasos.map(p =>
    '<div class="fl-caja"><div class="fl-ce" style="background:' + f.color + '">' + esc(p.t) + '</div><ul class="fl-cu">' + p.l.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') + '</div>';
  const medio = '<div class="fl-medio">' + [0, 1, 2, 3].map(c => { const e = FLUJO_ENLACES.find(x => x.col === c); return e ? '<div class="fl-enl">' + flechaVert(e.baja) + '<span>' + esc(e.txt) + '</span></div>' : '<div></div>'; }).join('') + '</div>';
  raiz.innerHTML = '<div class="fl">' + fila(FLUJO[0]) + medio + fila(FLUJO[1]) + '</div>';
}
