const CIRCLES=['Yo','Pareja','Familia','Amigos','Trabajo'];
const select=document.querySelector('#circle'),svg=document.querySelector('#chart'),best=document.querySelector('#best'),status=document.querySelector('#status'),refresh=document.querySelector('#refresh');
let snapshot={weeks:[],updatedAt:null};
CIRCLES.forEach(name=>select.add(new Option(name,name)));
select.addEventListener('change',render);
refresh.addEventListener('click',load);
function el(tag,attrs={},value){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(value!==undefined)n.textContent=value;svg.append(n);return n}
function render(){
 svg.replaceChildren();const weeks=snapshot.weeks||[],name=select.value;
 if(!weeks.length){el('text',{x:330,y:110,'text-anchor':'middle',fill:'#789487','font-size':15},'Sin semanas sincronizadas');best.textContent='Sin datos';return}
 const width=Math.max(660,weeks.length*85+70),base=175,scale=1.45;
 svg.setAttribute('viewBox',`0 0 ${width} 220`);
 [25,50,75,100].forEach(v=>{const y=base-v*scale;el('line',{x1:22,x2:width-24,y1:y,y2:y,stroke:'#e6f3eb','stroke-dasharray':'3 7'});el('text',{x:width-8,y:y+4,'text-anchor':'end',fill:'#8fa79b','font-size':11},v+'%')});
 let topWeek=null;
 weeks.forEach((w,i)=>{const v=w.values?.[name],x=52+i*85;
  if(Number.isFinite(v)){
   const y=base-v*scale;
   el('rect',{x:x-8,y,width:16,height:base-y,rx:8,fill:'#8de3bd',opacity:.5});
   el('rect',{x:x-3,y,width:6,height:base-y,rx:3,fill:'#42c99a',opacity:.85});
   el('circle',{cx:x,cy:y,r:4.5,fill:'#09664b'});
   el('text',{x,y:Math.max(15,y-12),'text-anchor':'middle','font-size':12,'font-weight':600,fill:'#185d47'},v+'%');
   if(!topWeek||v>topWeek.v)topWeek={label:w.label,v};
  }else{el('text',{x,y:163,'text-anchor':'middle','font-size':11,fill:'#9bad9f'},'—')}
  el('text',{x,y:203,'text-anchor':'middle','font-size':12,fill:'#527b67'},w.label);
 });
 best.textContent=topWeek?`${topWeek.label} · ${topWeek.v}%`:'Sin datos';
}
async function load(){
 refresh.disabled=true;status.textContent='Consultando datos publicados…';
 try{
  const response=await fetch('./wellbeing-data.json?t='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo leer wellbeing-data.json');
  const next=await response.json();
  if(!Array.isArray(next.weeks))throw new Error('Formato inválido');
  snapshot=next;render();
  status.textContent=next.updatedAt?'Última sincronización: '+new Date(next.updatedAt).toLocaleString('es-MX'):'Aún no hay una sincronización con Notion';
 }catch(e){status.textContent='No se pudo cargar: '+e.message;render()}
 finally{refresh.disabled=false}
}
load();