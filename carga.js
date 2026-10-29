/* ===== carga.js 1.1.1 · pantalla de carga compartida (Obra Bellavista, La Florida) =====
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
    else st.prog += Math.max(0, obj - st.prog) * (st.meta >= 100 ? 0.35 : 0.2);
    if(st.meta >= 100 && st.prog > 99.5) st.prog = 100;
    rell.style.transform = 'scaleX(' + (st.prog / 100) + ')';
    if(!est.classList.contains('cglisto')) est.textContent = Math.round(st.prog) + '%';
    if(st.meta < 100 && !st.err) ponerMsg(textoEstado(t));
    if(el.isConnected) st.raf = requestAnimationFrame(bucle);
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
  window.CargaPagina = {
    el: el,
    mensaje: function(t){ st.msg = String(t || ''); },
    espera: function(k){ st.reg.forEach(function(r){ if(r.k === k) r.on = true; }); },
    hecho: hito,
    cortar: function(){ if(st.err) return; cancelAnimationFrame(st.raf); if(el.parentNode) el.remove(); },
    error: function(destino, tipo){
      if(st.err) return st.err;
      avisarIntento(tipo);
      if(st.cerrando){ location.replace(destino); return Promise.resolve(); }
      st.err = (async function(){
        var TXT = {sesion: 'Ya hay una cuenta activa, volviendo a pantalla de sesión.', permiso: 'No te corresponde estar aquí, volviendo al menú.', nosesion: 'No hay una sesión iniciada, volviendo a pantalla de sesión.'};
        document.getElementById('cgErrTxt').textContent = TXT[tipo] || TXT.sesion;
        await abierta;
        st.meta = 88; est.classList.remove('cglisto');
        while(st.prog < 89.4 || st.prog > 91) await dormir(30);
        el.classList.add('cgerror'); document.getElementById('cgIn').classList.add('cgtiembla');
        if(tipo === 'permiso' || tipo === 'nosesion'){ var sc = document.getElementById('cgScan'); if(sc){ var pasos = ['Obteniendo información del intruso…', 'Obteniendo dirección IP…', 'Obteniendo latitud y longitud…', 'Obteniendo proveedor de internet…', 'Identificando el aparato…', 'Enviando aviso a Ismael…']; pasos.forEach(function(t, k){ setTimeout(function(){ sc.textContent = t; }, k * 800); }); } }
        var pista = document.getElementById('cgPista'); if(pista) pista.setAttribute('aria-label', 'Error');
        st.volver = true;
        while(st.prog > 0.6) await dormir(30);
        await dormir(250);
        location.replace(destino);
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
  function avisarIntento(tipo){ try{
    var cu = ''; try{ var h = JSON.parse(sessionStorage.getItem('hubSesion') || localStorage.getItem('hubSesion') || 'null') || {}; cu = h.nombre || h.cuenta || ''; }catch(e){}
    var n = navigator, c = n.connection || {}, inf = {lang: String(n.language || ''), langs: (n.languages || []).slice(0, 4).join(','), tz: '', pant: screen.width + 'x' + screen.height, ratio: window.devicePixelRatio || 1, plat: String((n.userAgentData && n.userAgentData.platform) || n.platform || ''), movil: !!(n.userAgentData && n.userAgentData.mobile), red: String(c.effectiveType || ''), ref: String(document.referrer || '').substring(0, 80), hora: new Date().toString().substring(0, 60)};
    try{ inf.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(e){}
    var enviar = function(geo){ inf.geo = geo || null; fetch('https://script.google.com/macros/s/AKfycbyYlsRuk-ptv1FPIQFy4bMoffTfoa39ujpH6CF9isJAdh_Y6zfwfBNyJmTMxcmcJ1LX/exec', {method:'POST', keepalive:true, headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action:'alertaAcceso', tipo: tipo, pagina: location.pathname.split('/').pop() || 'index', ua: String(navigator.userAgent || '').substring(0, 120), cuenta: cu, info: inf})}).catch(function(){}); };
    /* IP y ubicación aproximada: las da un servicio externo (ipwho.is); si no responde en 3 s, el aviso sale igual con el resto de los datos */
    var ctl = new AbortController(), to = setTimeout(function(){ ctl.abort(); }, 3000);
    fetch('https://ipwho.is/', {signal: ctl.signal}).then(function(r){ return r.json(); }).then(function(g){ clearTimeout(to); enviar(g && g.success !== false ? {ip: g.ip, ciudad: g.city, region: g.region, pais: g.country, isp: (g.connection && (g.connection.isp || g.connection.org)) || '', lat: g.latitude, lon: g.longitude, zona: (g.timezone && g.timezone.id) || ''} : null); }).catch(function(){ clearTimeout(to); enviar(null); });
  }catch(e){} }
  window.salirConError = function(destino, tipo){ if(tipo && window.CargaPagina && document.getElementById('cargaGlobal') && !st.cerrando) return window.CargaPagina.error(destino, tipo); location.replace(destino); };
  if(window.__gateErr) window.CargaPagina.error(window.__gateErr.d, window.__gateErr.t);
  setTimeout(function(){ if(window.CargaPagina) window.CargaPagina.fin(); }, 25000);
  window.addEventListener('pageshow', function(e){ if(e.persisted) location.reload(); });
})();
}
