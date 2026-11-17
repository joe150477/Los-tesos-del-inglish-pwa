// Clase en audio: un "profesor" lee la lección (voz del dispositivo, gratis y sin internet).
const Clase=(()=>{
 const L={A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'eff',G:'gee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'ar',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zee'};
 let segs=[],i=0,on=false,paused=false,rate=.9,timer=null,voices=[],cur=null;
 const pickV=()=>{voices=speechSynthesis.getVoices()};
 try{pickV();speechSynthesis.onvoiceschanged=pickV}catch(e){}
 const voice=lang=>{const pre=lang==='en'?['en-US','en-GB','en']:['es-CO','es-MX','es-US','es-ES','es'];
  for(const p of pre){const v=voices.find(v=>v.lang&&v.lang.replace('_','-').startsWith(p)&&!/compact/i.test(v.name));if(v)return v}
  return voices.find(v=>v.lang&&v.lang.toLowerCase().startsWith(lang))||null};
 const sent=t=>(t.replace(/[«»]/g,'').replace(/EE\. ?UU\./g,'EEUU').replace(/\b(Mr|Mrs|Ms|Dr)\./g,'$1').match(/[^.!?\n]+[.!?]?/g)||[t]).map(x=>x.trim()).filter(Boolean);
 const ES=new Set('si te me le lo pero solo cada todo debe puede usa usar usan dice dicen cuidado verbo pasa sujeto preguntan responden respondes cuando también de la el los las que se en para con un una por es al del y o tu su no sin antes después donde cuando como más muy ya esto esta estos son ser estar hay'.split(' '));
 const EN=new Set("the you are is am he she it we they my your his her its our their good from what where a an i i'm not yes no morning afternoon evening night see later tomorrow hello how name nationality friends students teachers".split(' '));
 const engLike=t=>{if(/[¿¡áéíóúñ]/i.test(t))return false;const w=t.toLowerCase().replace(/[^a-z' ]/g,' ').split(/\s+/).filter(Boolean);let e=0,x=0;w.forEach(k=>{if(EN.has(k))e++;if(ES.has(k))x++});return e>0&&x===0};
 function mixed(t,es,en,pEn=1800){
  sent(t).forEach(x=>{x=x.replace(/^[→\-•\s]+/,'').replace(/EEUU/g,'EE.UU.');
   const m=x.match(/^([A-Za-z'’ .,?!-]{2,40}?):\s+(.+)$/);
   if(m&&engLike(m[1])&&!engLike(m[2])){en(clean(m[1]),700);es(m[2],500);return}
   engLike(x)?en(clean(x),pEn):es(x,500)})}
 const isEs=t=>/[¿¡áéíóúñ]/i.test(t);
 const clean=t=>t.replace(/\([^)]*\)/g,'').replace(/[«»"]/g,'').trim();
 function build(l){
  const S=[],es=(t,p=500)=>t&&S.push({lang:'es',t,p}),en=(t,p=1800)=>t&&S.push({lang:'en',t,p});
  es(`Clase ${l.n}. ${l.title}. ${l.sub}.`,700);es(`Objetivo: ${l.obj}`,700);
  mixed(l.explain||'',es,en);
  const v=(l.vocab||[]).filter(r=>r[0]);
  if(v.length){es('Ahora vamos con el vocabulario. Escucha, y repite en voz baja después de cada palabra.',900);
   v.forEach(r=>{
    const a=r[0].trim();
    if(/^[A-Za-z]$/.test(a)){en(L[a.toUpperCase()],1700);return}
    a.split(/→|=/).forEach((p,k,arr)=>{p=clean(p);if(p)en(p,k<arr.length-1?900:1800)});
    if(r[2]&&!r[2].startsWith('/'))es(r[2],800)})}
  if((l.examples||[]).length){es('Ejemplos. Repite cada frase.',700);
   l.examples.forEach(e=>{const m=e.split(' — ');if(m.length>1){en(clean(m[0]),2200);es(m[1],700)}else mixed(e,es,en,2200)})}
  (l.tips||[]).forEach((t,k)=>{if(!k)es('Para recordar.',500);mixed(t,es,en,1200)});
  es('Fin de la clase. Ahora puedes practicar con las tarjetas y los ejercicios.',0);
  S.forEach(o=>{if(o.lang==='es')o.t=o.t.replace(/\.\.+/g,'.').replace(/\bMrs\b\.?/g,'Misis').replace(/\bMr\b\.?/g,'Míster').replace(/\bMs\b\.?/g,'Miss')});
  return S}
 function bar(){
  let b=document.getElementById('claseBar');
  if(!b){b=document.createElement('div');b.id='claseBar';
   b.style.cssText='position:fixed;left:0;right:0;bottom:0;background:var(--pri);color:#fff;padding:12px 16px;z-index:9;display:flex;gap:10px;align-items:center;box-shadow:0 -2px 12px #0004';
   b.innerHTML='<div id="claseTxt" style="flex:1;font-size:18px;line-height:1.3"></div><button id="clP" style="font-size:22px;background:transparent;color:#fff;border:1px solid #fff6;border-radius:8px;padding:4px 10px"></button><button id="clV" style="background:transparent;color:#fff;border:1px solid #fff6;border-radius:8px;padding:6px 10px">×1</button><button id="clS" style="font-size:20px;background:transparent;color:#fff;border:1px solid #fff6;border-radius:8px;padding:4px 10px">⏹</button>';
   document.body.appendChild(b);
   b.querySelector('#clP').onclick=()=>paused?resume():pause();
   b.querySelector('#clS').onclick=stop;
   b.querySelector('#clV').onclick=e=>{rate=rate>=1?.75:rate>=.9?1:.9;e.target.textContent=rate>=1?'×1.1':rate>=.9?'×1':'×0.8'}}
  return b}
 function show(){const b=bar();b.querySelector('#claseTxt').innerHTML=(segs[i]?`<span style="opacity:.7;font-size:12px">${segs[i].lang==='en'?'🇺🇸 Repite':'🇨🇴 Profesor'} · ${i+1}/${segs.length}</span><br>`+segs[i].t.replace(/</g,'&lt;'):'');b.querySelector('#clP').textContent=paused?'▶':'⏸'}
 function next(){
  if(!on||paused)return;
  if(i>=segs.length){stop();return}
  const s=segs[i];show();
  const u=new SpeechSynthesisUtterance(s.t);u.lang=s.lang==='en'?'en-US':'es-CO';const v=voice(s.lang);if(v)u.voice=v;
  u.rate=s.lang==='en'?rate*.9:rate;
  let done=false;const fin=()=>{if(done)return;done=true;timer=setTimeout(()=>{i++;next()},s.p)};
  u.onend=fin;u.onerror=fin;cur=u;speechSynthesis.cancel();speechSynthesis.speak(u)}
 function play(l){stop();segs=build(l);i=0;on=true;paused=false;next()}
 function pause(){paused=true;clearTimeout(timer);try{speechSynthesis.cancel()}catch(e){}show()}
 function resume(){paused=false;show();next()}
 function stop(){on=false;paused=false;clearTimeout(timer);try{speechSynthesis.cancel()}catch(e){}const b=document.getElementById('claseBar');if(b)b.remove()}
 return {play,stop,isOn:()=>on}})();
window.Clase=Clase;
