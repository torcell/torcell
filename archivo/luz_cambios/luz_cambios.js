// prueba de la luz de cambios: gris -> verde -> ámbar (otro) / sigue verde (propio) / error del servidor
const {chromium} = require('playwright'); const fs = require('fs');
const CFG = JSON.parse(fs.readFileSync(__dirname + '/real_config.json', 'utf8'));
const URL = process.env.URL || 'http://127.0.0.1:8770/panel.html';
let est = {modo:'ok', ts:1000, n:50, quien:'Supervisor - Ignacio Soto', mio:false, celda:'Piso 5 · Cerámica · Dpto 504 · Cocina'};
let fallos = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'MAL  ') + m); if(!c) fallos++; };
(async () => {
  const b = await chromium.launch();
  for(const [nombre, vp] of [['pc',{width:1300,height:800}],['tablet',{width:820,height:1100}],['cel',{width:390,height:800}]]){
    est = {modo:'ok', ts:1000, n:50, quien:'Supervisor - Ignacio Soto', mio:false, celda:'Piso 5 · Cerámica · Dpto 504 · Cocina'};
    const p = await (await b.newContext({viewport:vp, deviceScaleFactor:2})).newPage();
    await p.addInitScript(() => { const si = window.setInterval; window.setInterval = (f, t, ...a) => si(f, t === 30000 ? 700 : t, ...a);
      sessionStorage.setItem('progresoObraToken','11111111-1111-1111-1111-111111111111'); sessionStorage.setItem('progresoObraRol','1'); sessionStorage.setItem('progresoObraName','Ismael S.'); localStorage.setItem('progresoObraDisp','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'); });
    let nCalls = 0;
    await p.route(/script\.google\.com|script\.googleusercontent\.com|ipwho|accounts\.google/, async route => { let body = {}; try{ body = JSON.parse(route.request().postData()||'{}'); }catch(e){}
      let out = {ok:true};
      if(body.action === 'loadPrivado') out = Object.assign({ok:true,rol:1,items:{},allowGuestPrices:false}, CFG, {items:{}});
      if(body.action === 'ultimoCambio'){ nCalls++; out = est.modo === 'ok' ? {ok:true, ts:est.ts, n:est.n, quien:est.quien, mio:est.mio, celda:est.celda} : {ok:false, error:'accion_desconocida'}; }
      await route.fulfill({status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(out)}); });
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(5500);
    const cls = () => p.$eval('#luzCambios', e => e.className + '|' + e.querySelector('.lzm').textContent + '|' + e.hidden);
    let c = await cls(); ok(c.startsWith('verde|') && c.endsWith('|false'), nombre + ': al abrir queda verde sin mensaje (' + c + ')');
    est.ts = 2000; est.n = 51; est.mio = true; await p.waitForTimeout(1600);
    c = await cls(); ok(c.startsWith('verde|'), nombre + ': un cambio MÍO no prende el aviso (' + c + ')');
    est.ts = 3000; est.n = 52; est.mio = false; await p.waitForTimeout(1600);
    c = await cls(); ok(c.startsWith('ambar|Ignacio S. hizo un cambio'), nombre + ': cambio de otro → ámbar con nombre corto (' + c + ')');
    est.ts = 4000; est.n = 53; est.mio = true; await p.waitForTimeout(1600);
    c = await cls(); ok(c.startsWith('ambar|'), nombre + ': el ámbar se queda aunque yo guarde después (' + c + ')');
    const r = await p.$eval('#luzCambios', e => { const a = e.getBoundingClientRect(); return {l:a.left, t:a.top, w:a.width, vw:innerWidth, sw:document.documentElement.scrollWidth}; });
    ok(r.l >= 0 && r.l + r.w <= r.vw && r.sw <= r.vw, nombre + ': cabe en pantalla, sin scroll horizontal (' + JSON.stringify(r) + ')');
    await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(200);
    const t2 = await p.$eval('#luzCambios', e => e.getBoundingClientRect().top); ok(t2 < 20, nombre + ': sigue la pantalla al hacer scroll (top ' + Math.round(t2) + ')');
    await p.screenshot({path:'/tmp/luz_' + nombre + '_ambar.png', clip:{x:0,y:0,width:Math.min(vp.width, 700),height:90}});
    await p.close();
  }
  // servidor que aún no tiene la acción: queda gris y no molesta
  est.modo = 'mal'; const p2 = await (await b.newContext({viewport:{width:1300,height:800}})).newPage();
  await p2.addInitScript(() => { sessionStorage.setItem('progresoObraToken','11111111-1111-1111-1111-111111111111'); sessionStorage.setItem('progresoObraRol','1'); sessionStorage.setItem('progresoObraName','Ismael S.'); localStorage.setItem('progresoObraDisp','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'); });
  await p2.route(/script\.google\.com|script\.googleusercontent\.com|ipwho|accounts\.google/, async route => { let body = {}; try{ body = JSON.parse(route.request().postData()||'{}'); }catch(e){} let out = {ok:true}; if(body.action === 'loadPrivado') out = Object.assign({ok:true,rol:1,items:{},allowGuestPrices:false}, CFG, {items:{}}); if(body.action === 'ultimoCambio') out = {ok:false, error:'accion_desconocida'}; await route.fulfill({status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(out)}); });
  await p2.goto(URL, {waitUntil:'load'}); await p2.waitForTimeout(5500);
  const c2 = await p2.$eval('#luzCambios', e => e.className + '|' + e.querySelector('.lzm').textContent); ok(c2 === 'gris|', 'sin la acción en el servidor: gris y sin mensaje (' + c2 + ')');
  await b.close(); process.exit(fallos ? 1 : 0);
})();
