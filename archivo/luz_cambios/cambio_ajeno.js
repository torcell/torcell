// prueba: el cambio de otra cuenta se ve en pantalla sin recargar ni redibujar
const {chromium} = require('playwright'); const fs = require('fs');
const CFG = JSON.parse(fs.readFileSync(__dirname + '/real_config.json', 'utf8'));
const URL = process.env.URL || 'http://127.0.0.1:8770/panel.html';
let est = {modo:'ok', ts:1000, n:50, quien:'Supervisor - Ignacio Soto', mio:false, celda:'Piso 5 · Cerámica · Dpto 504 · Cocina'};
let fallos = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'MAL  ') + m); if(!c) fallos++; };
(async () => {
  const b = await chromium.launch();
  est = {modo:'ok', ts:1000, n:50, quien:'Supervisor - Ignacio Soto', mio:false, celda:'Piso 17 · Cerámica · Dpto 1701 · Piso'};
  const p = await (await b.newContext({viewport:{width:1300,height:800}})).newPage();
  await p.addInitScript(() => { const si = window.setInterval; window.setInterval = (f, t, ...a) => si(f, t === 30000 ? 700 : t, ...a);
      sessionStorage.setItem('progresoObraToken','11111111-1111-1111-1111-111111111111'); sessionStorage.setItem('progresoObraRol','1'); sessionStorage.setItem('progresoObraName','Ismael S.'); localStorage.setItem('progresoObraDisp','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'); });
    
  await p.addInitScript(() => { localStorage.setItem('progresoObraCategoria','Cerámica'); });
  let remotos = {}; let cargas = 0;
  await p.route(/script\.google\.com|script\.googleusercontent\.com|ipwho|accounts\.google/, async route => { let body = {}; try{ body = JSON.parse(route.request().postData()||'{}'); }catch(e){}
    let out = {ok:true};
    if(body.action === 'loadPrivado'){ cargas++; out = Object.assign({ok:true,rol:1,allowGuestPrices:false}, CFG, {items: remotos}); }
    if(body.action === 'ultimoCambio') out = {ok:true, ts:est.ts, n:est.n, quien:est.quien, mio:est.mio, celda:est.celda};
    await route.fulfill({status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(out)}); });
  await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(5500);
  remotos = await p.evaluate(() => { const o = {}; ALL_CELLS.filter(c => c.categoria === 'Cerámica' && c.pisoNum <= 17).forEach(c => { o[c.id] = {trabajador:'Rafael Gil', partida:true, terminado:false, pagado:false, retenido:false, nota:'', m2:c.m2Inicial || 1, partidaTs: Date.now() - 5 * 864e5, terminadoTs:null, pagadoTs:null}; }); return o; });
  await p.reload({waitUntil:'load'}); await p.waitForTimeout(5000);
  await p.evaluate(() => { window.__n = 0; const o = window.render; window.render = function(){ window.__n++; return o.apply(this, arguments); }; window.__marca = 1; });
  const celda = id => p.evaluate(i => { const e = document.querySelector('[data-cellid="' + i + '"]'); return e ? e.closest('td').className + '|' + e.textContent.replace(/\s+/g, ' ').slice(0, 80) : null; }, id);
  console.log('  dbg:', await p.evaluate(() => JSON.stringify({cells: ALL_CELLS.length, content: document.getElementById('content').children.length, blocks: document.querySelectorAll('.floor-block').length, cat: activeCategoria, txt: document.body.innerText.slice(0,150)})));
  const ids = await p.evaluate(() => [...document.querySelectorAll('[data-cellid]')].map(e => e.dataset.cellid).filter(x => /-piso$/.test(x)).slice(0, 4)); console.log('  ids:', ids.join(','));
  const A = ids[0], B = ids[2];
  const antesA = await celda(A); ok(!!antesA, 'celda A en pantalla: ' + antesA);
  await p.evaluate(i => { markCellDirty(i); }, B);   // celda B con cambio sin guardar
  const ahora = Date.now();
  remotos = {[A]: {trabajador:'Rafael Gil', partida:true, terminado:true, pagado:false, retenido:false, nota:'', m2:7, partidaTs: ahora - 864e5, terminadoTs: ahora - 36e5, pagadoTs:null},
             [B]: {trabajador:'Luis Pérez', partida:true, terminado:true, pagado:false, retenido:false, nota:'', m2:7, partidaTs: ahora - 864e5, terminadoTs: ahora - 36e5, pagadoTs:null}};
  const t0 = Date.now(); const c0 = cargas;
  est.ts = 2000; est.n = 51; est.mio = false;
  await p.waitForFunction(() => document.querySelector('#luzCambios').className.indexOf('ambar') === 0, null, {timeout: 40000});
  await p.waitForFunction(i => { const e = document.querySelector('[data-cellid="' + i + '"]'); return e && /Rafael/.test(e.textContent); }, A, {timeout: 20000});
  const aviso = await p.$eval('#luzCambios', e => e.className + '|' + e.querySelector('.lzm').textContent);
  console.log('  aviso:', aviso, ' tardó', Date.now() - t0, 'ms desde el cambio');
  const despA = await celda(A); ok(despA !== antesA && /Rafael/.test(despA) && /estado|terminado/i.test(despA), 'la celda A cambió en pantalla sin recargar');
  const redib = await p.evaluate(() => window.__n); ok(redib === 0, 'no se redibujó la lista (' + redib + ' redibujos)');
  ok(await p.evaluate(() => window.__marca === 1), 'la página no se recargó');
  const bEst = await p.evaluate(i => state[i] && state[i].trabajador, B); ok(bEst !== 'Luis Pérez', 'la celda B con cambio sin guardar NO se pisó (' + bEst + ')');
  ok(/ya está en pantalla/.test(aviso), 'el aviso sigue diciendo quién y avisa que ya está aplicado');
  ok(cargas - c0 === 1, 'una sola lectura al servidor (' + (cargas - c0) + ')');
  await p.waitForTimeout(7000);
  const fin = await p.$eval('#luzCambios', e => e.className); ok(fin === 'verde', 'a los 6 s vuelve a verde (' + fin + ')');
  const e = await p.evaluate(() => window.__err || 0);
  await b.close(); process.exit(fallos ? 1 : 0);
})();
