/* ===== carga.js 1.2.0 · pantalla de carga compartida (Obra Bellavista, La Florida) =====
   Un solo archivo para todas las páginas: estilos + motor de la carga.
   Si se cambia algo de la pantalla de carga, se cambia SOLO acá. */

// (los estilos están en carga.css, que cada página carga en el <head>)

// ===== motor (solo en las páginas que tienen la pantalla de carga puesta en el HTML) =====
if(document.getElementById('cargaGlobal') && document.getElementById('cgV3') && document.getElementById('cgTit')){
(function(){
  var el = document.getElementById('cargaGlobal'), v = document.getElementById('cgV3'), rell = document.getElementById('cgRell'), est = document.getElementById('cgEst'), tit = document.getElementById('cgTit'), msgEl = document.getElementById('cgMsg');
  var textoBase = tit.textContent;
  var plantilla = el.outerHTML.replace('cg3 cgquieta', 'cg3 cgabre');   // la copia para salir siempre se abre con animación
  // ===== viene del menú: la carga ya está abierta ahí, así que acá sigue de largo sin abrirse otra vez =====
  var entrando = false;
  try{ entrando = sessionStorage.getItem('cargaEntrando') === '1'; sessionStorage.removeItem('cargaEntrando'); }catch(e){}
  if(entrando){ v.classList.remove('cgabre'); v.classList.add('cgquieta'); }
  // ===== el menú dejó la barra en este %: se sigue desde ahí, sin volver a 0 =====
  var desde = 0;
  if(entrando){ try{ desde = Math.max(0, Math.min(40, parseFloat(sessionStorage.getItem('cargaDesde')) || 0)); sessionStorage.removeItem('cargaDesde'); }catch(e){} }
  var dormir = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var st = {meta: 88, reg: [{k: 'pagina', w: 20, ok: false, on: true}, {k: 'version', w: 15, ok: false, on: false}, {k: 'datos', w: 45, ok: false, on: false}, {k: 'dibujo', w: 20, ok: false, on: true}], ultHito: performance.now() + 350, prog: 0, t0: performance.now() + 350, raf: 0, fin: null, err: null, volver: false, cerrando: false, msg: ''};
  // Espera a que terminen las animaciones CSS de un elemento (por evento, no por tiempo). Si ya terminaron, sigue de inmediato.
  function terminadas(nodo){
    return Promise.all((nodo.getAnimations ? nodo.getAnimations({subtree: true}) : []).map(function(a){ return a.finished.catch(function(){}); }));
  }
  // Cambia el mensaje de abajo con un fundido corto (el título de la sección no se toca)
  function ponerMsg(txt){
    if(msgEl._t === undefined) msgEl._t = msgEl.textContent;
    if(msgEl._t === txt) return;
    msgEl._t = txt; msgEl.style.transition = 'opacity .18s ease'; msgEl.style.opacity = '0';
    setTimeout(function(){ if(msgEl._t === txt){ msgEl.textContent = txt; msgEl.style.opacity = '1'; } }, 190);
  }
  // Progreso real: cada paso que termina suma su parte; mientras uno está en curso la barra avanza solo hasta la mitad de ese paso
  function hito(k){
    for(var i = 0; i < st.reg.length; i++){ if(st.reg[i].k === k && st.reg[i].on && !st.reg[i].ok){ st.reg[i].ok = true; st.ultHito = performance.now(); } }
  }
  function objetivoReal(){
    var tot = 0, hecho = 0, sig = 0;
    st.reg.forEach(function(r){ if(!r.on) return; tot += r.w; if(r.ok) hecho += r.w; else if(!sig) sig = r.w; });
    var cre = sig ? (sig / tot * 100) * 0.5 * (1 - Math.exp(-Math.max(0, performance.now() - st.ultHito) / 1500)) : 0;
    return Math.min(97, hecho / tot * 100 + cre);
  }
  function textoEstado(t){
    if(st.msg) return st.msg;
    var v = st.reg[1], d = st.reg[2];
    if(v.on && !v.ok) return 'Comprobando versión…';
    if(d.on && !d.ok) return t > 9000 ? 'Despertando la base de datos, puede tardar un poco…' : 'Cargando datos de la base de datos…';
    return '';
  }
  function bucle(){
    var t = Math.max(0, performance.now() - st.t0);
    var obj = st.volver ? 0 : st.meta >= 100 ? 100 : st.err ? 90 * (1 - Math.exp(-t / 450)) : objetivoReal();
    if(st.volver){ if(!st.v0){ st.v0 = st.prog; st.vt = performance.now(); } st.prog = st.v0 * (1 - Math.min(1, (performance.now() - st.vt) / 5000)); }
    else if(st.hold > 0) { /* quieta */ }
    else st.prog += Math.max(0, obj - st.prog) * (st.meta >= 100 ? 0.35 : 0.2);
    if(st.meta >= 100 && st.prog > 99.5) st.prog = 100;
    rell.style.transform = 'scaleX(' + (st.prog / 100) + ')';
    if(!est.classList.contains('cglisto')) est.textContent = Math.round(st.prog) + '%';
    if(st.meta < 100 && !st.err) ponerMsg(textoEstado(t));
    if(el.isConnected) st.raf = requestAnimationFrame(bucle);
  }
  // la barra se queda en ese % hasta que el navegador pinta por primera vez (así lo primero que se ve es el mismo número); tope de 600 ms por si no avisa
  if(desde){
    st.prog = desde; st.hold = 1;
    var soltar = function(){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ st.hold = 0; }); }); };
    try{ new PerformanceObserver(function(l){ if(l.getEntries().some(function(e){ return e.name === 'first-contentful-paint'; })) soltar(); }).observe({type: 'paint', buffered: true}); }catch(e){ soltar(); }
    setTimeout(function(){ st.hold = 0; }, 600);
  }
  bucle();
  var abierta = terminadas(v);
  if(entrando){ st.t0 = st.ultHito = performance.now(); }
  async function paginaLista(){
    var tope = dormir(6000);
    var listo = (async function(){
      if(document.readyState !== 'complete') await new Promise(function(r){ window.addEventListener('load', r, {once: true}); });
      try{ if(document.fonts && document.fonts.ready) await document.fonts.ready; }catch(e){}
      try{ await Promise.all(Array.prototype.slice.call(document.images).map(function(i){ return i.decode ? i.decode().catch(function(){}) : 0; })); }catch(e){}
      await new Promise(function(r){ requestAnimationFrame(function(){ requestAnimationFrame(r); }); });
    })();
    await Promise.race([listo, tope]);
  }
  paginaLista().then(function(){ hito('pagina'); });
  /* ===== Texto de sesión caducada: los días salen del rol guardado al abrir la página ===== */
  var DIAS_ROL = {1: 30, 2: 14, 3: 7, 4: 14, 5: 30, 6: 7, 7: 7};
  var DIAS0 = 0;
  try{ var h0 = JSON.parse(sessionStorage.getItem('hubSesion') || localStorage.getItem('hubSesion') || 'null') || {}; DIAS0 = DIAS_ROL[h0.rol] || 0; }catch(e){}
  // @@carga-error: motivos precisos. Primero el mensaje exacto que dejó la página (p. ej. "Esta cuenta ya está abierta en otro aparato…"); si no hay, uno según lo que pasó, con cargo y sección
  var SECC = {panel: 'Panel de Cerámica y Frague', calidad: 'Calidad', bodega: 'Bodega', jefe_terreno: 'Jefe de Terreno', oficina_tecnica: 'Oficina Técnica', avance_obra: 'Avance de obra', admin: 'Administración', molde: 'Molde', proyeccion_logica: 'Proyección Lógica', revision_pre_entrega: 'Revisión pre-entrega', generador_documentos: 'Generador de documentos', index: 'Inicio'};
  var CARGOS = {1: 'Administrador', 2: 'Supervisor', 3: 'Trabajador', 4: 'Jefe de Terreno', 5: 'Calidad', 6: 'Oficina Técnica', 7: 'Jefe de Bodega'};
  function seccionActual(){ var p = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, ''); return SECC[p] || ''; }
  function cargoActual(){
    try{ var h = JSON.parse(sessionStorage.getItem('hubSesion') || localStorage.getItem('hubSesion') || 'null') || {};
      if(h.rol === 1 && /^ismael\b/i.test(String(h.nombre || ''))) return 'Dev';
      return CARGOS[h.rol] || ''; }catch(e){ return ''; }
  }
  // mensajes genéricos que las páginas dejan para la pantalla de inicio de sesión: no sirven como motivo, se reemplazan por uno preciso
  var GENERICOS = /^(No tienes acceso a esa sección\. Elige una de las disponibles\.|Tu sesión venció\. (Ingresa tu PIN|Entra) de nuevo\.)$/;
  function motivoDe(tipo){
    var g = ''; try{ g = String(sessionStorage.getItem('progresoObraAvisoGate') || '').trim(); }catch(e){}
    if(g && !GENERICOS.test(g)) return g;
    var sec = seccionActual(), cargo = cargoActual();
    if(tipo === 'nosesion') return 'No hay ninguna cuenta iniciada en este aparato: entraste a ' + (sec ? '«' + sec + '»' : 'esta sección') + ' sin iniciar sesión.';
    if(tipo === 'permiso') return 'Tu cuenta' + (cargo ? ' (' + cargo + ')' : '') + ' no tiene acceso a ' + (sec ? '«' + sec + '»' : 'esta sección') + '.';
    if(tipo === 'caduco') return 'Tu sesión caducó o el servidor ya no la reconoce' + (DIAS0 ? ' (tu sesión dura ' + DIAS0 + ' días)' : '') + '. Hay que iniciar sesión de nuevo.';
    return 'Esta cuenta ya tiene una sesión activa en este aparato.';
  }
  window.CargaPagina = {
    el: el,
    mensaje: function(t){ st.msg = String(t || ''); },
    motivo: motivoDe,   // @@carga-error (también lo usan las pruebas)
    espera: function(k){ st.reg.forEach(function(r){ if(r.k === k) r.on = true; }); },
    hecho: hito,
    cortar: function(){ if(st.err) return; cancelAnimationFrame(st.raf); if(el.parentNode) el.remove(); },
    // @@carga-error: pantalla de error nueva. Dice el motivo entre las dos líneas, se queda quieta (sin cuenta regresiva) y da dos botones: Entendido y Dar aviso
    error: function(destino, tipo){
      if(st.err) return st.err;
      if(st.cerrando){ location.replace(destino); return Promise.resolve(); }
      var avisado = false;
      if(tipo !== 'caduco') avisarIntento(tipo).then(function(ok){ avisado = !!ok; var b = document.getElementById('cgBtnAviso'); if(b && ok) marcarAviso(b); });
      st.err = (async function(){
        var motivo = motivoDe(tipo);
        await abierta;
        cancelAnimationFrame(st.raf); st.meta = 88;
        var ci = document.getElementById('cgIn');
        // ===== se reemplaza todo lo de entre las líneas por el motivo y los botones =====
        var f = document.createElement('div'); f.className = 'cgfalla'; f.setAttribute('role', 'alert');
        f.innerHTML = '<div class="cgfmsg"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 3 22 20.5H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/><path d="M12 9.5v5.2" stroke="currentColor" stroke-width="2.2"/><rect x="11" y="16.4" width="2" height="2" fill="currentColor"/></svg><span></span></div>'
          + '<div class="cgbtns"><button type="button" class="cgbtn cgbtn1" id="cgBtnOk">Entendido</button><button type="button" class="cgbtn" id="cgBtnAviso">Dar aviso</button></div>';
        f.querySelector('span').textContent = motivo;
        ci.appendChild(f);
        el.classList.add('cgerror'); ci.classList.add('cgtiembla');
        var bOk = document.getElementById('cgBtnOk'), bAv = document.getElementById('cgBtnAviso');
        bOk.addEventListener('click', function(){ bOk.disabled = true; location.replace(destino); });
        if(avisado) marcarAviso(bAv);
        bAv.addEventListener('click', function(){
          if(bAv.disabled) return;
          bAv.disabled = true; bAv.textContent = 'Enviando…';
          avisarIntento(tipo === 'caduco' ? 'sesion' : tipo, true).then(function(ok){
            if(ok){ avisado = true; marcarAviso(bAv); }
            else { bAv.disabled = false; bAv.textContent = 'Reintentar aviso'; }
          });
        });
        setTimeout(function(){ try{ bOk.focus({preventScroll: true}); }catch(e){} }, 60);
      })();
      return st.err;
    },
    salir: function(destino, titulo, trabajo){
      if(st.salida) return st.salida;
      st.salida = (async function(){
        cancelAnimationFrame(st.raf); st.cerrando = true;
        tit.style.transition = 'opacity .2s ease'; tit.style.opacity = '0';
        var h = document.createElement('div'); h.innerHTML = plantilla;
        var n = h.firstChild; n.style.opacity = '0'; n.style.transition = 'opacity .2s ease'; document.body.appendChild(n);
        var rl = n.querySelector('#cgRell'), es = n.querySelector('#cgEst'), ti = n.querySelector('#cgTit'), pi = n.querySelector('#cgPista');
        ti.textContent = titulo || 'Volviendo a inicio de sesión…'; ti.style.opacity = '1'; if(pi) pi.setAttribute('aria-label', 'Cerrando sesión');
        void n.offsetWidth; n.style.opacity = '1'; setTimeout(function(){ if(el.parentNode) el.remove(); }, 300);
        var hecho = false;
        Promise.resolve(trabajo).catch(function(){}).then(function(){ hecho = true; });
        setTimeout(function(){ hecho = true; }, 8000); // si el cierre tarda más de 8 s, sigo igual
        var p = 0, ini = performance.now() + 250;
        await new Promise(function(r){
          (function f(){
            var t = Math.max(0, performance.now() - ini);
            var fin = hecho && performance.now() > ini + 650;
            var obj = fin ? 100 : 88 * (1 - Math.exp(-t / 300));
            p += (obj - p) * (fin ? 0.35 : 0.2);
            if(fin && p > 99.5) p = 100;
            rl.style.transform = 'scaleX(' + (p / 100) + ')'; es.textContent = Math.round(p) + '%';
            if(p >= 100) r(); else requestAnimationFrame(f);
          })();
        });
        es.textContent = '¡Listo!'; es.classList.add('cglisto');
        await dormir(250);

        // ===== marca para que el menú cierre la carga =====
        try{ sessionStorage.setItem('cargaVuelta', '1'); }catch(e){}
        location.replace(destino);
      })();
      return st.salida;
    },
    fin: function(){
      if(st.err) return st.err;
      if(st.fin) return st.fin;
      st.fin = (async function(){
        await abierta; await paginaLista();
        if(st.err) return;
        st.reg.forEach(function(r){ r.ok = true; }); st.msg = '';
        st.meta = 100;
        while(st.prog < 100){ if(st.err) return; await dormir(30); }
        est.textContent = '¡Listo!'; est.classList.add('cglisto'); await dormir(450);
        if(st.err) return;
        st.cerrando = true;
        v.classList.remove('cgabre'); v.classList.remove('cgquieta'); v.classList.add('cgcierra');
        await new Promise(function(r){ requestAnimationFrame(function(){ requestAnimationFrame(r); }); });
        // el fondo se desvanece al mismo tiempo que las franjas se juntan (sin tiempo muerto con la pantalla vacía)
        el.classList.add('cgsale');
        await Promise.all([terminadas(v), new Promise(function(r){ var t = setTimeout(r, 1100); el.addEventListener('transitionend', function f(e){ if(e.target !== el) return; clearTimeout(t); el.removeEventListener('transitionend', f); r(); }); })]);
        CargaPagina.cortar();
      })();
      return st.fin;
    }
  };
  /* Avisa al administrador (por el servidor) que alguien llegó a esta pantalla de error */
  function avisarIntento(tipo, manual){ return new Promise(function(listo){ try{
    var cu = ''; try{ var h = JSON.parse(sessionStorage.getItem('hubSesion') || localStorage.getItem('hubSesion') || 'null') || {}; cu = h.nombre || h.cuenta || ''; }catch(e){}
    var n = navigator, c = n.connection || {}, inf = {lang: String(n.language || ''), langs: (n.languages || []).slice(0, 4).join(','), tz: '', pant: screen.width + 'x' + screen.height, ratio: window.devicePixelRatio || 1, plat: String((n.userAgentData && n.userAgentData.platform) || n.platform || ''), movil: !!(n.userAgentData && n.userAgentData.mobile), red: String(c.effectiveType || ''), ref: String(document.referrer || '').substring(0, 80), hora: new Date().toString().substring(0, 60)};
    try{ inf.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(e){}
    var enviar = function(geo){ inf.geo = geo || null; fetch('https://script.google.com/macros/s/AKfycbyYlsRuk-ptv1FPIQFy4bMoffTfoa39ujpH6CF9isJAdh_Y6zfwfBNyJmTMxcmcJ1LX/exec', {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action:'alertaAcceso', tipo: tipo, manual: !!manual, pagina: location.pathname.split('/').pop() || 'index', ua: String(navigator.userAgent || '').substring(0, 120), cuenta: cu, info: inf})}).then(function(r){ return r.json(); }).then(function(j){ listo(!!(j && j.ok)); }).catch(function(){ listo(false); }); };
    /* IP y ubicación aproximada: las da un servicio externo (ipwho.is); si no responde en 3 s, el aviso sale igual con el resto de los datos */
    var ctl = new AbortController(), to = setTimeout(function(){ ctl.abort(); }, 3000);
    fetch('https://ipwho.is/', {signal: ctl.signal}).then(function(r){ return r.json(); }).then(function(g){ clearTimeout(to); enviar(g && g.success !== false ? {ip: g.ip, ciudad: g.city, region: g.region, pais: g.country, isp: (g.connection && (g.connection.isp || g.connection.org)) || '', lat: g.latitude, lon: g.longitude, zona: (g.timezone && g.timezone.id) || ''} : null); }).catch(function(){ clearTimeout(to); enviar(null); });
  }catch(e){ listo(false); } }); }
  function marcarAviso(b){ b.disabled = true; b.textContent = 'Aviso enviado'; b.classList.add('cgok'); }
  window.salirConError = function(destino, tipo){ if(tipo && window.CargaPagina && document.getElementById('cargaGlobal') && !st.cerrando) return window.CargaPagina.error(destino, tipo); location.replace(destino); };
  if(window.__gateErr) window.CargaPagina.error(window.__gateErr.d, window.__gateErr.t);
  setTimeout(function(){ if(window.CargaPagina) window.CargaPagina.fin(); }, 25000);
  window.addEventListener('pageshow', function(e){ if(e.persisted) location.reload(); });
})();
}
