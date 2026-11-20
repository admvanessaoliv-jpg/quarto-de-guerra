// Quarto de Guerra: guarda o app no celular para abrir rápido, sempre buscando a versão mais nova primeiro.
const CACHE='qg-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(k=>k.put(e.request,c));return r})
    .catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))));
});
