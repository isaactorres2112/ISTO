const CACHE='isto-stable-v1';const CORE=['./index.html','./styles.css','./app.js','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 if(req.mode==='navigate'){
  event.respondWith(caches.match('./index.html').then(cached=>{
   const fresh=fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy))}return res}).catch(()=>cached);
   return cached||fresh;
  }));return;
 }
 event.respondWith(caches.match(req).then(cached=>{
  const fresh=fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>cached);
  return cached||fresh;
 }));
});