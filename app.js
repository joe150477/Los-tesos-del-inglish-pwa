// English Learning PWA — offline-first (IndexedDB vía localStorage por simplicidad) + respaldo/importación.
const KEY='english_v1';
const $=s=>document.querySelector(s), app=$('#app');
let S=load();window.S=S;
function load(){let d=null;try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(!d||!d.lessons)d={lessons:JSON.parse(JSON.stringify(window.LESSONS_SEED)),updated:Date.now()};
  d.profiles=d.profiles||[];d.deleted=d.deleted||{};delete d.progress;return d}
const CUR='english_cur';
const P=()=>S.profiles.find(p=>p.id===sessionStorage.getItem(CUR));
const EMOJIS=['🦁','🐯','🐼','🦊','🐸','🐵','🦄','🐙','🦋','🐢','🐬','🦉','🚀','⚽','🎸','🎨','🌟','🔥','🍕','🍓','👑','🤖','👻','🌈','🐶','🐱','🦖','🎮'];
function save(){S.updated=Date.now();window.S=S;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){alert('No se pudo guardar')}window.syncSoon&&syncSoon()}
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const st=id=>(P()&&P().progress[id])||{status:'pending',best:null};
const setSt=(id,o)=>{const p=P();p.progress[id]={...st(id),...o,at:Date.now()};p.u=Date.now()};
const label={pending:'Pendiente',studying:'En estudio',done:'Completada',review:'Repasar'};
const cls={done:'done',review:'rev'};

function nav(h){location.hash=h}
window.addEventListener('hashchange',route);
$('#home').onclick=()=>nav('');
$('#menu').onclick=()=>nav('#/ajustes');
$('#who').onclick=()=>{sessionStorage.removeItem(CUR);nav('');route()};

function route(){
  const [,p,id]=location.hash.split('/');
  const w=$('#who'),me=P();w.style.display=me?'':'none';if(me)w.textContent=me.emoji;
  if(!me&&p!=='ajustes'&&p!=='perfil'){return pick()}
  $('#home').style.display=p?'':'none';
  ({undefined:home,'':home,leccion:lesson,quiz,tarjetas:cards,nueva:()=>edit(),editar:()=>edit(id),ajustes:settings,ia:ai,progreso:progress,repaso:()=>quiz(null,true),perfil:()=>profileForm(id)})[p||'']?.(id);
}
function home(){
  const L=[...S.lessons].sort((a,b)=>a.n-b.n);
  const done=L.filter(l=>st(l.id).status==='done').length;
  app.innerHTML=`<div class="card"><b>${done} de ${L.length}</b> lecciones completadas
   <div class="row" style="margin-top:10px"><button class="b" onclick="nav('#/nueva')">+ Nueva lección</button><button class="b alt" onclick="nav('#/ia')">✨ Desde mis apuntes</button></div>
   <div class="row" style="margin-top:8px"><button class="b" style="background:var(--ok)" onclick="nav('#/progreso')">📈 Mi progreso y recomendaciones</button></div></div>`+
  L.map(l=>{const s=st(l.id);return `<div class="card row" onclick="nav('#/leccion/${l.id}')" style="cursor:pointer">
   <div class="num">${l.n}</div><div class="grow"><b>${esc(l.title)}</b><div class="mut">${esc(l.sub)}</div></div>
   <span class="tag ${cls[s.status]||''}">${label[s.status]}${s.best!=null?' · '+s.best+'%':''}</span></div>`}).join('');
}
function lesson(id){
  const l=S.lessons.find(x=>x.id===id);if(!l)return nav('');
  if(st(id).status==='pending'){setSt(id,{status:'studying'});save()}
  const v=l.vocab||[];
  app.innerHTML=`<h2 style="margin-top:0">${l.n}. ${esc(l.title)}</h2><div class="mut">${esc(l.sub)}</div>
  <div class="card"><b>Objetivo:</b> ${esc(l.obj)}</div>
  <div class="card">${esc(l.explain).replace(/\n/g,'<br>')}</div>
  ${v.length?`<div class="card"><table><tr><th>Inglés</th><th>Pronunciación</th><th>Significado</th></tr>${v.map(r=>`<tr><td><b>${esc(r[0])}</b> <button class="b alt" style="padding:0 6px" onclick="say('${esc(r[0]).replace(/'/g,"\\'")}')">🔊</button></td><td class="p">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table></div>`:''}
  ${(l.examples||[]).length?`<h3>Ejemplos</h3><div class="card">${l.examples.map(e=>`<div>• ${esc(e)}</div>`).join('')}</div>`:''}
  ${(l.tips||[]).length?`<h3>Para recordar</h3><div class="card">${l.tips.map(e=>`<div>💡 ${esc(e)}</div>`).join('')}</div>`:''}
  <div class="row" style="flex-wrap:wrap"><button class="b" onclick="nav('#/quiz/${id}')">Practicar</button><button class="b alt" onclick="nav('#/tarjetas/${id}')">Tarjetas</button>
  <button class="b alt" onclick="nav('#/editar/${id}')">Editar</button></div>`;
}
window.say=t=>{try{const u=new SpeechSynthesisUtterance(t.split('→')[0].split('=')[0]);u.lang='en-US';u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}};

function cards(id){
  const l=S.lessons.find(x=>x.id===id);const v=(l.vocab||[]).filter(r=>r[0]);let i=0,show=false;
  if(!v.length){app.innerHTML='<div class="card">Esta lección no tiene vocabulario.</div>';return}
  const draw=()=>{const r=v[i];app.innerHTML=`<div class="mut">${i+1} / ${v.length}</div>
   <div class="card flip" id="f"><b>${esc(r[0])}</b>${show?`<div class="p" style="color:var(--pri);font-size:18px;margin-top:8px">${esc(r[1])}</div><div>${esc(r[2])}</div>`:'<div class="mut" style="font-size:14px;margin-top:8px">Toca para ver</div>'}</div>
   <div class="row"><button class="b alt" id="pv">‹</button><button class="b alt" id="sy">🔊</button><button class="b" id="nx">›</button></div>`;
   $('#f').onclick=()=>{show=!show;draw()};$('#pv').onclick=()=>{i=(i+v.length-1)%v.length;show=false;draw()};
   $('#nx').onclick=()=>{i=(i+1)%v.length;show=false;draw()};$('#sy').onclick=()=>say(r[0])};
  draw();
}
function buildQ(l){let Q=(l.quiz||[]).map(q=>({l:l.id,q:q[0],o:q[1],a:q[2]}));
  const v=(l.vocab||[]).filter(r=>r[0]&&r[2]&&!/→|=/.test(r[0]));
  if(v.length>=3)v.slice(0,6).forEach(r=>{const w=v.filter(x=>x!==r).sort(()=>Math.random()-.5).slice(0,2).map(x=>x[2]);const o=[...w,r[2]].sort(()=>Math.random()-.5);Q.push({l:l.id,q:`¿Qué significa «${r[0]}»?`,o,a:o.indexOf(r[2])})});
  return Q}
function quiz(id,repaso){
  let Q;
  if(repaso){const miss=missed();Q=S.lessons.flatMap(buildQ).filter(q=>miss.has(q.l+'|'+q.q));
    if(!Q.length){app.innerHTML='<div class="card">🎉 No tienes preguntas falladas pendientes. ¡Sigue practicando lecciones!</div>';return}}
  else{const l=S.lessons.find(x=>x.id===id);Q=buildQ(l)}
  if(!Q.length){app.innerHTML='<div class="card">Aún no hay ejercicios. Agrégalos en Editar.</div>';return}
  Q.sort(()=>Math.random()-.5);let i=0,ok=0;
  const draw=()=>{if(i>=Q.length){const pct=Math.round(ok/Q.length*100);
    if(!repaso){setSt(id,{status:pct>=80?'done':'review',best:Math.max(st(id).best||0,pct),last:pct})}
    save();
    app.innerHTML=`<div class="card"><h2 style="margin-top:0">${pct}%</h2>${ok} de ${Q.length} correctas. ${pct>=80?'¡Muy bien!':'Sigue repasando.'}
    <div class="row" style="margin-top:12px"><button class="b" onclick="${repaso?"nav('#/repaso')":`nav('#/quiz/${id}')`}">Repetir</button><button class="b alt" onclick="nav('#/progreso')">Mi progreso</button></div></div>`;return}
   const q=Q[i];app.innerHTML=`<div class="mut">${repaso?'Repaso inteligente · ':''}Pregunta ${i+1} de ${Q.length}</div><div class="card"><b>${esc(q.q)}</b>${q.o.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
   document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const k=+b.dataset.k,good=k===q.a;if(good)ok++;
     const p=P();p.log.push({t:Date.now(),l:q.l,q:q.q,ok:good});if(p.log.length>800)p.log=p.log.slice(-800);p.u=Date.now();
     document.querySelectorAll('.opt').forEach((x,j)=>{x.disabled=true;if(j===q.a)x.classList.add('ok');else if(j===k)x.classList.add('no')});
     setTimeout(()=>{i++;draw()},900)})};
  draw();
}
// preguntas cuyo último intento fue fallo
function missed(){const last={};P().log.forEach(e=>{last[e.l+'|'+e.q]=e.ok});return new Set(Object.keys(last).filter(k=>!last[k]))}
const DAY=864e5;
function analyze(){
  const p=P(),L=[...S.lessons].sort((a,b)=>a.n-b.n),out=[],now=Date.now();
  L.forEach(l=>{const lg=p.log.filter(e=>e.l===l.id),s=st(l.id),nq=buildQ(l).length;
    const rec=lg.slice(-10),acc=rec.length?Math.round(rec.filter(e=>e.ok).length/rec.length*100):null;
    const days=lg.length?Math.floor((now-lg[lg.length-1].t)/DAY):null;
    const bad={};lg.forEach(e=>{if(!e.ok)bad[e.q]=(bad[e.q]||0)+1});const worst=Object.entries(bad).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    let act=null,why='',pr=9;
    if(!lg.length&&s.status==='pending'){act='Empezar';why='Aún no la has estudiado.';pr=5}
    else if(!lg.length){act='Practicar';why='La leíste pero no has hecho ejercicios.';pr=4}
    else if(acc<70){act='Repasar';why=`Acierto reciente ${acc}%. `+(worst.length?'Fallas más: '+worst.join(' · '):'');pr=1}
    else if(days>=7){act='Repaso espaciado';why=`Hace ${days} días que no la practicas (acierto ${acc}%).`;pr=2}
    else if(nq<6){act='Más actividades';why=`Solo tiene ${nq} ejercicios; conviene agregar más.`;pr=3}
    else if(acc>=90&&rec.length>=6){act='Lista para evaluar';why=`Acierto ${acc}% sostenido.`;pr=8}
    out.push({l,acc,days,act,why,pr,att:lg.length})});
  return out}
function progress(){
  const p=P(),A=analyze(),done=A.filter(a=>st(a.l.id).status==='done').length,tot=p.log.length,okc=p.log.filter(e=>e.ok).length;
  const todo=A.filter(a=>a.act&&a.pr<9).sort((a,b)=>a.pr-b.pr);
  app.innerHTML=`<h2 style="margin-top:0">${p.emoji} ${esc(p.name)}</h2>
  <div class="card row"><div class="grow"><b>${done}/${A.length}</b><div class="mut">completadas</div></div><div class="grow"><b>${tot?Math.round(okc/tot*100)+'%':'—'}</b><div class="mut">acierto total</div></div><div class="grow"><b>${tot}</b><div class="mut">respuestas</div></div></div>
  <h3>Qué te recomiendo</h3>
  ${todo.length?todo.slice(0,6).map(a=>`<div class="card"><div class="row"><div class="grow"><b>${a.l.n}. ${esc(a.l.title)}</b> <span class="tag ${a.pr<=2?'rev':''}">${a.act}</span><div class="mut">${esc(a.why)}</div></div>
   <button class="b alt" onclick="nav('#/${a.act==='Más actividades'?'editar':a.act==='Empezar'?'leccion':'quiz'}/${a.l.id}')">Ir</button></div></div>`).join(''):'<div class="card">Todo al día. 👏</div>'}
  ${missed().size?`<button class="b" onclick="nav('#/repaso')">🔁 Repaso inteligente (${missed().size} falladas)</button>`:''}
  ${A.filter(a=>a.act==='Lista para evaluar').length?`<div class="card" style="margin-top:12px">✅ Listas para evaluación: ${A.filter(a=>a.act==='Lista para evaluar').map(a=>a.l.n).join(', ')}</div>`:''}
  <h3>Por lección</h3><div class="card">${A.map(a=>`<div class="row"><div style="width:26px">${a.l.n}</div><div class="grow">${esc(a.l.title)}</div><span class="mut">${a.acc==null?'—':a.acc+'%'}</span></div>`).join('')}</div>
  <div class="card"><b>Análisis con IA (opcional)</b><p class="mut">Copia tu historial y pégalo en Claude o ChatGPT para un análisis más profundo y nuevas actividades.</p><button class="b alt" id="ca">Copiar para la IA</button></div>`;
  $('#ca').onclick=async()=>{const txt=`Soy estudiante de inglés (hispanohablante, nivel básico). Analiza mi progreso: dime qué temas repasar, qué errores se repiten, si debo agregar actividades nuevas o hacer una evaluación, y propón 5 ejercicios nuevos para lo más débil.
Datos: ${JSON.stringify(A.map(a=>({leccion:a.l.title,acierto_reciente:a.acc,dias_sin_practicar:a.days,intentos:a.att,sugerencia:a.act,fallas:p.log.filter(e=>e.l===a.l.id&&!e.ok).slice(-5).map(e=>e.q)})))}`;
   try{await navigator.clipboard.writeText(txt);alert('Copiado. Pégalo en Claude o ChatGPT.')}catch(e){prompt('Copia:',txt)}};
}
function connectCard(){
  return Sync.sess()?`<div class="mut" style="margin-bottom:10px">☁️ Conectado como ${esc(Sync.sess().email)} · <a href="#/ajustes">ajustes</a></div>`:
  `<details class="card"><summary><b>☁️ Usar mi perfil en otro dispositivo</b></summary><div class="mut">Opcional: conecta una cuenta para que tu avance viaje contigo entre tus dispositivos.</div>
  <label>Correo</label><input id="cem" type="email"><label>Contraseña</label><input id="cpw" type="password">
  <div class="row" style="margin-top:10px"><button class="b" id="cli">Entrar</button><button class="b alt" id="csu">Crear cuenta</button></div><div class="mut" id="cmsg"></div></details>`}
function wireConnect(){
  if(!$('#cli'))return;
  const go=async f=>{try{$('#cmsg').textContent='…';const d=await Sync[f]($('#cem').value.trim(),$('#cpw').value);
   if(f==='signup'&&!d.access_token){$('#cmsg').textContent='Revisa tu correo, confirma la cuenta y luego pulsa Entrar.';return}
   await Sync.run();S=window.S;pick()}catch(e){$('#cmsg').textContent=e.message}};
  $('#cli').onclick=()=>go('login');$('#csu').onclick=()=>go('signup')}
function pick(){
  $('#home').style.display='none';
  app.innerHTML=`<h2 style="margin-top:0">¿Quién eres?</h2><div class="mut" id="syn" style="margin-bottom:10px">☁️ Cargando perfiles…</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px">
  ${S.profiles.map(p=>`<div class="card" data-p="${p.id}" style="text-align:center;cursor:pointer;margin:0"><div style="font-size:46px">${p.emoji}</div><b>${esc(p.name)}</b></div>`).join('')}
  <div class="card" id="np" style="text-align:center;cursor:pointer;margin:0"><div style="font-size:46px">➕</div><b>Nuevo</b></div></div>`;
  document.querySelectorAll('[data-p]').forEach(e=>e.onclick=()=>{sessionStorage.setItem(CUR,e.dataset.p);nav('');route()});
  $('#np').onclick=()=>nav('#/perfil');
  Sync.run().then(r=>{if($('#syn'))$('#syn').textContent='';if(r==='bajado'){S=window.S;if(!P())pick()}}).catch(()=>{if($('#syn'))$('#syn').textContent='Sin conexión: mostrando los perfiles de este dispositivo.'});
}
function profileForm(id){
  const p=id?S.profiles.find(x=>x.id===id):{id:'p'+Date.now(),name:'',emoji:EMOJIS[Math.floor(Math.random()*EMOJIS.length)],progress:{},log:[]};
  let em=p.emoji;
  app.innerHTML=`<h2 style="margin-top:0">${id?'Editar perfil':'Nuevo perfil'}</h2><div class="card">
  <div style="font-size:60px;text-align:center" id="big">${em}</div>
  <label>Nombre</label><input id="pn" value="${esc(p.name)}">
  <label>Elige tu emoji (o escribe el tuyo)</label><div id="eg" style="display:flex;flex-wrap:wrap;gap:6px">${EMOJIS.map(e=>`<button class="opt" style="width:48px;margin:0;text-align:center;font-size:24px;padding:4px">${e}</button>`).join('')}</div>
  <input id="ec" placeholder="Otro emoji" style="margin-top:8px;width:120px">
  <div class="row" style="margin-top:14px"><button class="b" id="ok">Guardar</button>${id?'<button class="b alt" id="rm" style="color:var(--bad);border-color:var(--bad)">Eliminar</button>':''}<button class="b alt" id="cn">Cancelar</button></div></div>`;
  const set=e=>{em=e;$('#big').textContent=e};
  document.querySelectorAll('#eg .opt').forEach(b=>b.onclick=()=>set(b.textContent));
  $('#ec').oninput=e=>{const v=[...e.target.value][0];if(v)set(v)};
  $('#cn').onclick=()=>history.back();
  $('#ok').onclick=()=>{const n=$('#pn').value.trim();if(!n)return alert('Escribe tu nombre');p.name=n;p.emoji=em;p.u=Date.now();
   if(!S.profiles.find(x=>x.id===p.id))S.profiles.push(p);sessionStorage.setItem(CUR,p.id);save();nav('')};
  if(id)$('#rm').onclick=()=>{if(confirm('¿Eliminar este perfil y todo su avance?')){S.profiles=S.profiles.filter(x=>x.id!==id);S.deleted[id]=Date.now();sessionStorage.removeItem(CUR);save();nav('')}};
}
function edit(id){
  const l=id?S.lessons.find(x=>x.id===id):{id:'l'+Date.now(),n:Math.max(0,...S.lessons.map(x=>x.n))+1,title:'',sub:'',obj:'',explain:'',vocab:[],examples:[],tips:[],quiz:[]};
  const vt=(l.vocab||[]).map(r=>r.join(' | ')).join('\n');
  const qt=(l.quiz||[]).map(q=>`${q[0]} | ${q[1].join(' / ')} | ${q[2]+1}`).join('\n');
  app.innerHTML=`<h2 style="margin-top:0">${id?'Editar':'Nueva'} lección</h2><div class="card">
  <label>Número</label><input id="n" type="number" value="${l.n}"><label>Título (inglés)</label><input id="t" value="${esc(l.title)}">
  <label>Subtítulo</label><input id="s" value="${esc(l.sub)}"><label>Objetivo</label><input id="o" value="${esc(l.obj)}">
  <label>Explicación</label><textarea id="e">${esc(l.explain)}</textarea>
  <label>Vocabulario (una por línea: inglés | pronunciación | español)</label><textarea id="v">${esc(vt)}</textarea>
  <label>Ejemplos (uno por línea)</label><textarea id="x">${esc((l.examples||[]).join('\n'))}</textarea>
  <label>Trucos (uno por línea)</label><textarea id="p">${esc((l.tips||[]).join('\n'))}</textarea>
  <label>Ejercicios (pregunta | opción1 / opción2 / opción3 | número de la correcta)</label><textarea id="q">${esc(qt)}</textarea>
  <div class="row" style="margin-top:12px"><button class="b" id="sv">Guardar</button>${id?'<button class="b alt" id="dl" style="color:var(--bad);border-color:var(--bad)">Eliminar</button>':''}</div></div>`;
  $('#sv').onclick=()=>{const lines=t=>$(t).value.split('\n').map(s=>s.trim()).filter(Boolean);
   const nl={u:Date.now(),id:l.id,n:+$('#n').value||1,title:$('#t').value,sub:$('#s').value,obj:$('#o').value,explain:$('#e').value,
    vocab:lines('#v').map(s=>{const a=s.split('|').map(z=>z.trim());return [a[0]||'',a[1]||'',a[2]||'']}),
    examples:lines('#x'),tips:lines('#p'),
    quiz:lines('#q').map(s=>{const a=s.split('|').map(z=>z.trim());return [a[0],(a[1]||'').split('/').map(z=>z.trim()),Math.max(0,(+a[2]||1)-1)]})};
   if(!nl.title)return alert('Falta el título');
   const k=S.lessons.findIndex(x=>x.id===l.id);k>=0?S.lessons[k]=nl:S.lessons.push(nl);save();nav('#/leccion/'+l.id)};
  if(id)$('#dl').onclick=()=>{if(confirm('¿Eliminar esta lección?')){S.lessons=S.lessons.filter(x=>x.id!==id);S.deleted[id]=Date.now();save();nav('')}};
}
function ai(){
  app.innerHTML=`<h2 style="margin-top:0">Lección desde mis apuntes</h2><div class="card">
  <b>1.</b> Escribe o pega los apuntes de tu clase y copia el mensaje.<br><b>2.</b> Pégalo en Claude o ChatGPT (gratis).<br><b>3.</b> Pega aquí la respuesta (JSON) y revisa antes de guardar.
  <label>Apuntes de clase</label><textarea id="nt" placeholder="Hoy vimos el verbo To Be..."></textarea>
  <button class="b" id="cp" style="margin-top:8px">Copiar mensaje para la IA</button>
  <label>Respuesta de la IA (JSON)</label><textarea id="js"></textarea>
  <button class="b alt" id="im" style="margin-top:8px">Importar como borrador y revisar</button></div>`;
  $('#cp').onclick=async()=>{const p=`Convierte estos apuntes de clase de inglés en UNA lección para hispanohablantes. Responde SOLO con JSON válido con esta forma exacta:
{"title":"","sub":"","obj":"","explain":"","vocab":[["inglés","pronunciación aproximada en español","significado"]],"examples":[""],"tips":[""],"quiz":[["pregunta",["op1","op2","op3"],índiceCorrectoDesde0]]}
Reglas: no inventes datos que no estén en los apuntes; si añades algo, márcalo con "(complementario)"; si algo es dudoso, dilo en "explain" como "POR CONFIRMAR". Mínimo 4 ejercicios.
APUNTES:
${$('#nt').value}`;try{await navigator.clipboard.writeText(p);alert('Copiado. Pégalo en Claude o ChatGPT.')}catch(e){prompt('Copia este texto:',p)}};
  $('#im').onclick=()=>{try{let t=$('#js').value.trim().replace(/^```json|^```|```$/g,'');const d=JSON.parse(t);
   const l={id:'l'+Date.now(),n:Math.max(0,...S.lessons.map(x=>x.n))+1,title:d.title||'',sub:d.sub||'',obj:d.obj||'',explain:d.explain||'',vocab:d.vocab||[],examples:d.examples||[],tips:d.tips||[],quiz:d.quiz||[]};
   S.lessons.push(l);save();nav('#/editar/'+l.id)}catch(e){alert('El JSON no es válido: '+e.message)}};
}
function settings(){
  app.innerHTML=`<h2 style="margin-top:0">Respaldo y sincronización</h2><div class="card">
  <p>Tus lecciones y progreso se guardan en este dispositivo y funcionan sin internet. Para pasarlos a otro dispositivo usa el archivo de respaldo (por AirDrop, correo o Drive).</p>
  <div class="row" style="flex-wrap:wrap"><button class="b" id="ex">Exportar respaldo</button><button class="b alt" id="im">Importar respaldo</button></div>
  <input type="file" id="fi" accept=".json" style="display:none"></div>
  <div class="card"><b>Mi perfil</b> ${P()?P().emoji+' '+esc(P().name):''}<div class="row" style="margin-top:10px">${P()?`<button class="b alt" onclick="nav('#/perfil/${P().id}')">Editar</button>`:''}<button class="b alt" onclick="sessionStorage.removeItem(CUR);nav('');route()">Cambiar de perfil</button></div></div>
  <div class="card" id="acc"></div>
  <div class="card"><b>Reiniciar</b><p class="mut">Vuelve a las 12 lecciones iniciales y borra el progreso.</p><button class="b alt" id="rs" style="color:var(--bad);border-color:var(--bad)">Reiniciar todo</button></div>`;
  $('#acc').innerHTML=`<b>Sincronización automática</b><p class="mut">Los perfiles y el avance se comparten solos entre todos los dispositivos.</p><button class="b" id="sn">Sincronizar ahora</button><div class="mut" id="sm"></div>`;
  $('#sn').onclick=async()=>{$('#sm').textContent='Sincronizando…';try{const r=await Sync.run();S=window.S;$('#sm').textContent='Listo: '+r}catch(e){$('#sm').textContent=e.message}};
  $('#ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='english-respaldo-'+new Date().toISOString().slice(0,10)+'.json';a.click()};
  $('#im').onclick=()=>$('#fi').click();
  $('#fi').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!d.lessons)throw 0;if(confirm('Esto se fusiona con lo que hay en este dispositivo. ¿Continuar?')){d.profiles=d.profiles||[];d.deleted=d.deleted||{};S=Sync.merge(S,d);save();nav('')}}catch(x){alert('Archivo no válido')}})};
  $('#rs').onclick=()=>{if(confirm('¿Borrar todo y reiniciar?')){localStorage.removeItem(KEY);S=load();window.S=S;nav('')}};
}
window.onSyncDown=()=>{S=window.S;const h=location.hash;if(h===''||h==='#'||h.startsWith('#/progreso'))route()};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
route();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)Sync.run().then(r=>{if(r==='bajado')window.onSyncDown()}).catch(()=>{})});
