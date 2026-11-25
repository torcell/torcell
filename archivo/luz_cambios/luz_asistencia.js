const {chromium}=require('playwright');const fs=require('fs');const CFG=JSON.parse(fs.readFileSync(__dirname+'/real_config.json','utf8'));
(async()=>{const b=await chromium.launch();const p=await(await b.newContext({viewport:{width:1300,height:800}})).newPage();
await p.addInitScript(()=>{sessionStorage.setItem('progresoObraToken','11111111-1111-1111-1111-111111111111');sessionStorage.setItem('progresoObraRol','1');sessionStorage.setItem('progresoObraName','Ismael S.');localStorage.setItem('progresoObraDisp','aaaaaaaa-aaaa-aaaa-aaaaaaaaaaaa'.replace('aaaaaaaa-aaaa-aaaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'));});
await p.route(/script\.google\.com|script\.googleusercontent\.com|ipwho|accounts\.google/,async r=>{let o={ok:true};try{const a=JSON.parse(r.request().postData()||'{}').action;if(a==='loadPrivado')o=Object.assign({ok:true,rol:1,items:{},allowGuestPrices:false},CFG,{items:{}});if(a==='ultimoCambio')o={ok:true,ts:5,n:5,quien:'Supervisor - Ignacio Soto',mio:false,celda:'Piso 5 · Cerámica'};}catch(e){}await r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});});
await p.goto('http://127.0.0.1:8770/panel.html');await p.waitForTimeout(5000);
const v=()=>p.$eval('#luzCambios',e=>getComputedStyle(e).display);
const a=await v();await p.evaluate(()=>abrirAsistencia());await p.waitForTimeout(1500);const d=await v();
await p.evaluate(()=>{document.querySelectorAll('.ovAsist').forEach(e=>e.remove())});await p.waitForTimeout(300);const c=await v();
console.log(a,d,c);const ok=a==='flex'&&d==='none'&&c==='flex';console.log(ok?'ok   luz oculta solo en asistencia':'MAL');process.exit(ok?0:1)})();
