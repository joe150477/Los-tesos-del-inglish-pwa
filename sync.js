// Sincronización con Supabase (proyecto nas-aliados-prueba, tabla english_state, RLS por usuario). Sin librerías.
const SB='https://sjmiybsprsqtunlzpkyb.supabase.co',KEYP='sb_publishable_vzcsGkW3EYKhHwpwyhkeOg_yBXSmo82',SK='english_session';
const Sync={
 sess(){try{return JSON.parse(localStorage.getItem(SK))}catch(e){return null}},
 async auth(path,body){const r=await fetch(SB+'/auth/v1/'+path,{method:'POST',headers:{apikey:KEYP,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();if(!r.ok)throw new Error(d.msg||d.error_description||d.message||'Error');return d},
 async signup(email,password){const d=await this.auth('signup',{email,password});if(d.access_token){this.store(d)}return d},
 async login(email,password){const d=await this.auth('token?grant_type=password',{email,password});this.store(d);return d},
 store(d){localStorage.setItem(SK,JSON.stringify({token:d.access_token,refresh:d.refresh_token,uid:d.user.id,email:d.user.email,exp:Date.now()+(d.expires_in-60)*1000}))},
 logout(){localStorage.removeItem(SK)},
 async token(){let s=this.sess();if(!s)return null;
  if(Date.now()>s.exp){try{const d=await this.auth('token?grant_type=refresh_token',{refresh_token:s.refresh});this.store(d);s=this.sess()}catch(e){this.logout();return null}}return s},
 merge(a,b){ // fusión sin pérdidas entre dos estados
  const del={...(a.deleted||{})};for(const k in (b.deleted||{}))del[k]=Math.max(del[k]||0,b.deleted[k]);
  const pick=(x,y,f)=>!x?y:!y?x:((y[f]||0)>(x[f]||0)?y:x);
  const lm={};[...(a.lessons||[]),...(b.lessons||[])].forEach(l=>{lm[l.id]=pick(lm[l.id],l,'u')});
  const lessons=Object.values(lm).filter(l=>!(del[l.id]>(l.u||0)));
  const pm={};[...(a.profiles||[]),...(b.profiles||[])].forEach(p=>{
   const o=pm[p.id];if(!o){pm[p.id]=JSON.parse(JSON.stringify(p));return}
   const base=pick(o,p,'u'),prog={};
   for(const k of new Set([...Object.keys(o.progress||{}),...Object.keys(p.progress||{})]))prog[k]=pick((o.progress||{})[k],(p.progress||{})[k],'at');
   const seen=new Set(),log=[...(o.log||[]),...(p.log||[])].filter(e=>{const k=e.t+e.l+e.q;if(seen.has(k))return false;seen.add(k);return true}).sort((x,y)=>x.t-y.t).slice(-800);
   pm[p.id]={...base,progress:prog,log,u:Math.max(o.u||0,p.u||0)}});
  const profiles=Object.values(pm).filter(p=>!(del[p.id]>(p.u||0)));
  return {lessons,profiles,deleted:del,updated:Math.max(a.updated||0,b.updated||0)}},
 async run(){
  const s=await this.token();if(!s)return 'no-sesion';
  const h={apikey:KEYP,Authorization:'Bearer '+s.token,'Content-Type':'application/json'};
  const r=await fetch(`${SB}/rest/v1/english_state?user_id=eq.${s.uid}&select=data,updated_ms`,{headers:h});
  if(!r.ok)throw new Error('Lectura falló '+r.status);
  const remote=(await r.json())[0],local=window.S;
  const m=remote?this.merge(local,remote.data):local;
  const chLocal=JSON.stringify(m)!==JSON.stringify(local),chRemote=!remote||JSON.stringify(m)!==JSON.stringify(remote.data);
  if(chLocal){window.S=m;localStorage.setItem('english_v1',JSON.stringify(m))}
  if(chRemote){const w=await fetch(SB+'/rest/v1/english_state?on_conflict=user_id',{method:'POST',headers:{...h,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({user_id:s.uid,data:m,updated_ms:Date.now()})});
   if(!w.ok)throw new Error('Escritura falló '+w.status)}
  return chLocal?'bajado':chRemote?'subido':'al-día'}
};
window.Sync=Sync;
let _t;window.syncSoon=()=>{clearTimeout(_t);_t=setTimeout(()=>{Sync.run().then(r=>{if(r==='bajado'&&window.onSyncDown)onSyncDown()}).catch(()=>{})},1500)};
