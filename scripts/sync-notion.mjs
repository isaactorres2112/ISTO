// GitHub Actions only: reads Notion server-side and publishes aggregate percentages.
import {readFile,writeFile} from 'node:fs/promises';
const token=process.env.NOTION_TOKEN,source=process.env.NOTION_DATA_SOURCE_ID;
if(!token||!source)throw new Error('Configure NOTION_TOKEN and NOTION_DATA_SOURCE_ID as GitHub Actions secrets.');
const tz='America/Cancun';
const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const get=k=>dateParts.find(x=>x.type===k).value;
const today=`${get('year')}-${get('month')}-${get('day')}`;
const habits=['Dormir','Salud','Ejercicio','Orar','Ahorrar','Leer','Agua','Uñas','Tocarse','Bienestar'];
const entries=[];let cursor;
do{
 const res=await fetch(`https://api.notion.com/v1/data_sources/${source}/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:JSON.stringify({page_size:100,...(cursor?{start_cursor:cursor}:{})})});
 if(!res.ok)throw new Error(`Notion HTTP ${res.status}: ${(await res.text()).slice(0,250)}`);
 const body=await res.json();entries.push(...body.results);cursor=body.has_more?body.next_cursor:null;
}while(cursor);
const dateOnly=s=>new Date(s+'T12:00:00Z');
const monday=d=>{const n=dateOnly(d),offset=(n.getUTCDay()+6)%7;n.setUTCDate(n.getUTCDate()-offset);return n.toISOString().slice(0,10)};
const buckets=new Map();
for(const page of entries){
 const date=page.properties?.Fecha?.date?.start?.slice(0,10);
 if(!date||date>=today)continue;
 const week=monday(date);
 if(!buckets.has(week))buckets.set(week,new Map());
 buckets.get(week).set(date,page.properties);
}
const sorted=[...buckets.keys()].sort();
if(!sorted.length)throw new Error('No se encontraron registros anteriores a hoy');
const start=dateOnly(sorted[0]),last=dateOnly(monday(today)),weeks=[];
for(let d=new Date(start),index=1;d<=last;d.setUTCDate(d.getUTCDate()+7),index++){
 const key=d.toISOString().slice(0,10),days=buckets.get(key)||new Map();
 const elapsed=Math.min(7,Math.max(0,Math.round((dateOnly(today)-d)/86400000)));
 const values={};
 for(const h of habits){const successes=[...days.values()].filter(p=>p[h]?.checkbox===true).length;values[h]=elapsed?Math.round(100*successes/elapsed):null}
 values['Promedio general']=elapsed?Math.round(habits.reduce((s,h)=>s+values[h],0)/habits.length):null;
 weeks.push({label:'S'+index,start:key,daysElapsed:elapsed,values});
}
await writeFile('data.json',JSON.stringify({updatedAt:new Date().toISOString(),weeks},null,2)+'\n');
console.log('Semanas sincronizadas:',weeks.length,'fecha límite:',today);
