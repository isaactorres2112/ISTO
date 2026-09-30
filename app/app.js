const now=new Date();const h=now.getHours();
document.querySelector('#greeting').textContent=(h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches')+', Isaac';
document.querySelector('#date').textContent=new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'}).format(now).replace(/^./,c=>c.toUpperCase());
const quotes=['La disciplina de hoy construye la libertad de mañana.','Haz de cada día una obra completa.','Lo que depende de ti merece tu atención.','Avanza con calma, pero avanza.','La constancia convierte intención en carácter.','Cuida lo que haces hoy: ahí comienza lo que serás mañana.','Menos ruido. Más intención.'];
const day=Math.floor((now-new Date(now.getFullYear(),0,0))/86400000);document.querySelector('#quote').textContent='“'+quotes[day%quotes.length]+'”';
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').then(r=>r.update());
