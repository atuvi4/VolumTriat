/* =========================================================
   Project75 — prototip local (sense framework, sense backend)
   Persistència: localStorage.
   ========================================================= */

const KEY = 'project75_state_v3';
const USER = 'Tuvi';
const todayISO = () => new Date().toISOString().slice(0,10);
const IC = (n,cls='') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

/* ---------- dades base ---------- */
const PROGRAM = {
  startWeight:67, target1:75, target2:80,
  kcalGoal:3000, protGoal:150, mealsGoal:5,
  ritme:'Agressiu sostenible'
};

// getDay(): 0=Dg .. 6=Ds
const WEEK = {
  1:{label:'Pit + espatlla',                type:'gym',  focus:'Empeny fort i tanca la proteïna del dia.'},
  2:{label:'Cames',                         type:'gym',  focus:'Carrega hidrats: les cames volen energia.'},
  3:{label:'Esquena + abdominals',          type:'gym',  focus:'Bon dia per un snack post-entreno.'},
  4:{label:'Braç · tríceps, bíceps, espatlla', type:'gym', focus:'Sessió curta: aprofita per menjar bé.'},
  5:{label:'Running suau · 5 km',           type:'run',  focus:'Ritme còmode. Compensa amb un batut.'},
  6:{label:'Bici iniciació · 30-40 min',    type:'bike', focus:'Familiaritza\'t. Baix impacte, ideal.'},
  0:{label:'Natació tècnica · 20 min',      type:'swim', focus:'Tècnica primer. Curt i tranquil.'},
};
const CAT = {gym:'Força', run:'Running', bike:'Bici', swim:'Natació'};
function catTag(type){ return `<span class="tag tag--${type}"><span class="tdot"></span>${CAT[type]}</span>`; }

function defaultMeals(){
  return [
    {id:'esm', slot:'Esmorzar',        name:'Torrades + ous + fruita',                  kcal:600, prot:30, done:false},
    {id:'din', slot:'Dinar',           name:'Arròs + pit de pollastre + oli',           kcal:750, prot:45, done:false},
    {id:'ber', slot:'Berenar',         name:'Iogurt grec + civada + mel + cacauet',     kcal:550, prot:25, done:false},
    {id:'sop', slot:'Sopar',           name:'Pasta + tonyina + formatge',               kcal:650, prot:35, done:false},
    {id:'noc', slot:'Snack nocturn',   name:'Batut de plàtan + llet + civada',          kcal:550, prot:20, done:false},
  ];
}
const ALT_POOL = [
  {name:'Batut plàtan + civada + iogurt grec',    kcal:550, prot:22},
  {name:'Entrepà de pernil + formatge',           kcal:560, prot:26},
  {name:'Tonyina + pa integral + oli',            kcal:540, prot:30},
  {name:'Ous remenats + torrades + alvocat',      kcal:600, prot:28},
  {name:'Llenties amb arròs + ou dur',            kcal:620, prot:24},
  {name:'Batut de proteïna + civada + cacauet',   kcal:600, prot:40},
];
const SHAKES = [
  {name:'Batut complet · llet, plàtan, civada, cacauet', kcal:750, prot:28},
  {name:'Batut de proteïna + iogurt grec + fruits secs', kcal:600, prot:40},
  {name:'Batut de xocolata + civada + mantega de cacauet', kcal:700, prot:30},
];

/* ---------- estat ---------- */
let S;
function seedWeights(){
  const vals=[67.0,67.1,66.9,67.2,67.3,67.2,67.5,67.4,67.6];
  const out=[]; const n=vals.length;
  for(let i=0;i<n;i++){ const d=new Date(); d.setDate(d.getDate()-(n-1-i)*2); out.push({d:d.toISOString().slice(0,10),kg:vals[i]}); }
  return out;
}
function freshState(){
  return {version:3, date:todayISO(), streak:6, lastComplete:null, dayMode:'normal',
    meals:defaultMeals(), gymDone:false, checkin:null, dislikes:[], weights:seedWeights()};
}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw){ S=freshState(); save(); return; }
    S=JSON.parse(raw);
    if(S.date!==todayISO()){
      S.date=todayISO(); S.meals=defaultMeals(); S.gymDone=false; S.checkin=null; S.dayMode='normal'; save();
    }
  }catch(e){ S=freshState(); save(); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(S)); }

/* ---------- objectius segons el mode del dia ---------- */
function goals(){
  if(S.dayMode==='dificil') return {kcal:1800,prot:80, meals:2,label:'Dia difícil'};
  if(S.dayMode==='pocaGana')return {kcal:2600,prot:120,meals:4,label:'Poca gana'};
  return {kcal:PROGRAM.kcalGoal,prot:PROGRAM.protGoal,meals:PROGRAM.mealsGoal,label:'Agressiu sostenible'};
}

/* ---------- helpers ---------- */
const fmt = kg => kg.toFixed(1).replace('.',',');
const sum = (arr,f)=>arr.reduce((s,x)=>s+f(x),0);
const doneKcal=()=>sum(S.meals.filter(m=>m.done),m=>m.kcal);
const doneProt=()=>sum(S.meals.filter(m=>m.done),m=>m.prot);
const doneCount=()=>S.meals.filter(m=>m.done).length;
const curWeight=()=>S.weights[S.weights.length-1].kg;
const nf = n => n.toLocaleString('ca-ES');

const DIES=['diumenge','dilluns','dimarts','dimecres','dijous','divendres','dissabte'];
const MESOS=['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
function dateSub(){ const d=new Date(); const s=`${DIES[d.getDay()]} ${d.getDate()} de ${MESOS[d.getMonth()]}`; return s.charAt(0).toUpperCase()+s.slice(1); }
function greetName(){ const h=new Date().getHours(); return (h<6?'Bona nit':h<14?'Bon dia':h<21?'Bona tarda':'Bona nit'); }

/* =========================================================
   NAVEGACIÓ
   ========================================================= */
function go(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.go===id));
  document.querySelectorAll('.tab').forEach(n=>n.classList.toggle('active',n.dataset.go===id));
  window.scrollTo(0,0);
}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

/* =========================================================
   RENDER GLOBAL
   ========================================================= */
function renderAll(){
  document.querySelectorAll('[data-streak]').forEach(e=>e.textContent=S.streak);
  renderDashboard(); renderNutrition(); renderWeek(); renderEvolution(); renderCoach();
}

/* ---------- estat visual ---------- */
function badgeHTML(){
  if(S.dayMode==='dificil') return '<span class="badge warn"><span class="dotb"></span>Dia difícil</span>';
  if(S.dayMode==='pocaGana')return '<span class="badge info"><span class="dotb"></span>Poca gana</span>';
  return '<span class="badge"><span class="dotb"></span>Agressiu sostenible</span>';
}

/* ---------- prioritat / directiva del dia ---------- */
function directive(){
  const g=goals(), left=g.kcal-doneKcal(), w=WEEK[new Date().getDay()];
  if(S.dayMode==='dificil')
    return {title:'Objectiu mínim: 1 batut + 1 ingesta', sub:'Avui no busquem perfecció. Amb això, el dia compta i la ratxa segueix.', cta:'batut'};
  if(S.dayMode==='pocaGana')
    return {title:'Comença per calories líquides', sub:'Dia de baixa gana. Un batut ara suma molt sense esforç de masticar.', cta:'batut'};
  if(doneCount()===0)
    return {title:'Completa una ingesta amb proteïna', sub:`Prioritat ara. Opció ràpida: batut + iogurt grec (≈40 g). Objectiu del dia: ${g.prot} g.`, cta:'nutri'};
  if(w.type!=='gym')
    return {title:'Compensa el cardio amb un batut', sub:'Has cremat de més amb la sessió. Suma calories líquides per no frenar el volum.', cta:'batut'};
  if(left>500)
    return {title:`Et queden ${nf(left)} kcal per l'objectiu`, sub:'Vas bé. Un batut abans de dormir ho tanca sense esforç.', cta:'batut'};
  if(left>0)
    return {title:`Gairebé fet: ${nf(left)} kcal`, sub:'Un snack dens (fruits secs + iogurt) tanca el dia.', cta:'nutri'};
  return {title:'Objectiu del dia cobert', sub:'Calories i proteïna dins. Mantén la constància: així es passa de 67 a 75.', cta:'nutri'};
}

/* ---------- DASHBOARD ---------- */
function renderDashboard(){
  const g=goals(), d=directive();
  document.getElementById('dateSub').textContent = `${greetName()}, ${USER} · ${dateSub()}`;
  document.getElementById('stateBadge').innerHTML = badgeHTML();

  document.getElementById('hero').innerHTML = `
    <span class="eyebrow">Prioritat ara</span>
    <div class="hero-title">${d.title}</div>
    <p class="hero-sub">${d.sub}</p>
    <div class="hero-actions">
      ${d.cta==='batut'
        ? `<button class="btn" onclick="addShake()">${IC('cup')}Afegir batut</button><button class="btn line" data-go="nutri">Veure nutrició</button>`
        : `<button class="btn" data-go="nutri">${IC('nutri')}Obrir nutrició</button><button class="btn line" onclick="openCheckin()">Fer check-in</button>`}
    </div>`;
  bindGo();

  const dk=doneKcal(), dp=doneProt(), dc=doneCount();
  document.getElementById('stats').innerHTML = `
    <div class="ring" style="--p:${Math.min(100,dk/g.kcal*100)}">
      <div class="ring-in"><b>${nf(dk)}</b><span>/ ${nf(g.kcal)} kcal</span></div>
    </div>
    <div class="stat-bars">
      <div class="metric"><div class="row"><span>Proteïna</span><span class="v">${dp} / ${g.prot} g</span></div><div class="bar prot"><i style="width:${Math.min(100,dp/g.prot*100)}%"></i></div></div>
      <div class="metric"><div class="row"><span>Àpats completats</span><span class="v">${dc} / ${g.meals}</span></div><div class="bar"><i style="width:${Math.min(100,dc/g.meals*100)}%"></i></div></div>
    </div>`;

  const w=WEEK[new Date().getDay()];
  document.getElementById('miniTrain').innerHTML = `
    <div class="ico">${IC('train')}</div>
    <div class="t" style="flex:1"><b>${w.label}</b><span>${w.focus}</span></div>
    ${catTag(w.type)}`;

  const cm=document.getElementById('coachMini');
  cm.className = 'insight'+(S.dayMode==='dificil'?' warn':'');
  cm.innerHTML = `<div class="ihead">${IC('coach','sm')} Recomanació del coach</div><p>${coachText()}</p>`;

  const hb=document.getElementById('hardBtn');
  hb.innerHTML = S.dayMode==='dificil' ? `${IC('check-circle')}Sortir` : `${IC('moon')}Dia difícil`;
  hb.classList.toggle('on', S.dayMode==='dificil');
}
function bindGo(){ document.querySelectorAll('[data-go]').forEach(b=>{ b.onclick=()=>go(b.dataset.go); }); }

function coachText(){
  const g=goals(), left=g.kcal-doneKcal();
  if(S.dayMode==='dificil') return 'Mode dia difícil. Objectiu mínim: <b>1 batut ara + una ingesta fàcil</b>. Amb això el dia compta. Un pas, prou.';
  if(S.dayMode==='pocaGana')return 'Dia de baixa gana detectat. Canviem a <b>calories líquides</b> i objectiu mínim. Comença per un batut.';
  if(doneCount()===0)      return 'Prioritat ara: <b>completa una ingesta amb proteïna</b>. Opció ràpida: batut + iogurt grec (≈40 g).';
  if(left>500)             return `Bon ritme. Et queden <b>~${nf(left)} kcal</b>: un batut abans de dormir ho tanca fàcil.`;
  if(left>0)               return `Gairebé hi ets: <b>~${nf(left)} kcal</b> per tancar. Un snack dens ho resol.`;
  return 'Objectiu cobert avui. Calories i proteïna dins. Descansa i demà seguim. 💪';
}

/* ---------- NUTRICIÓ ---------- */
function renderNutrition(){
  const g=goals(), dk=doneKcal(), dp=doneProt(), dc=doneCount();
  const shakesDone=S.meals.filter(m=>m.done && /batut/i.test(m.name)).length;

  const objs=[
    {v:dc, gg:g.meals, l:'Àpats', ok:dc>=g.meals},
    {v:dp+'g', gg:g.prot+'g', l:'Proteïna', ok:dp>=g.prot},
    {v:shakesDone, gg:1, l:'Batut', ok:shakesDone>=1},
    {v:(dk/1000).toFixed(1).replace('.',',')+'k', gg:(g.kcal/1000).toFixed(1).replace('.',',')+'k', l:'Calories', ok:dk>=g.kcal},
  ];
  document.getElementById('objgrid').innerHTML = objs.map(o=>
    `<div class="obj ${o.ok?'ok':''}"><div class="ov">${o.v}</div><div class="ol">${o.l}</div><div class="og">objectiu ${o.gg}</div></div>`).join('');

  document.getElementById('kcalLbl').textContent = `${nf(dk)} / ${nf(g.kcal)} kcal`;
  document.getElementById('kcalBar').style.width = Math.min(100,dk/g.kcal*100)+'%';

  const left=g.kcal-dk, rec=document.getElementById('recWrap');
  rec.innerHTML = left>=300
    ? `<div class="insight"><div class="ihead">${IC('coach','sm')} Insight</div>
        <p>Et falten <b>~${nf(left)} kcal</b> per l'objectiu. Solució de menys fricció: un batut dens abans de dormir.</p>
        <div class="btns"><button class="btn primary small" onclick="addShake()">${IC('cup')}Afegir batut (+${SHAKES[0].kcal})</button>
        <button class="btn ghost small" onclick="openRescue()">Altres opcions</button></div></div>`
    : '';

  document.getElementById('mealsWrap').innerHTML = S.meals.map(m=>`
    <div class="meal ${m.done?'done':''}">
      <div class="slot">${m.slot}</div>
      <div class="name">${m.name}</div>
      <div class="macros"><span class="m"><span class="dot"></span>${m.kcal} kcal</span><span class="m"><span class="dot"></span>${m.prot} g proteïna</span></div>
      <div class="actions">
        ${m.done
          ? `<span class="doneflag">${IC('check','sm')} Completat</span>`
          : `<button class="btn primary small" onclick="markDone('${m.id}')">${IC('check','sm')}Completar</button>`}
        <button class="btn ghost small" onclick="swap('${m.id}')">${IC('swap','sm')}Canviar</button>
        <button class="btn ghost small" onclick="notInMood('${m.id}')">${IC('x','sm')}No em ve de gust</button>
      </div>
    </div>`).join('');

  const lb=document.getElementById('lowApBtn');
  lb.classList.toggle('on', S.dayMode==='pocaGana');
  lb.innerHTML = (S.dayMode==='pocaGana'?IC('check'):IC('moon')) + (S.dayMode==='pocaGana'?'Poca gana · actiu':'Poca gana');
}
function markDone(id){ S.meals.find(x=>x.id===id).done=true; checkDayComplete(); save(); renderAll(); toast('Ingesta completada'); }
function notInMood(id){
  const m=S.meals.find(x=>x.id===id), food=m.name.split(' + ')[0];
  if(!S.dislikes.includes(food)) S.dislikes.push(food);
  save(); const dl=document.getElementById('cfgDislikes'); if(dl) dl.innerHTML=`${S.dislikes.length} ${IC('chev','sm')}`;
  toast('Anotat — et proposaré «'+food.toLowerCase()+'» menys sovint');
}
function swap(id){
  const m=S.meals.find(x=>x.id===id);
  const opts=ALT_POOL.filter(o=>o.name!==m.name && !S.dislikes.some(d=>o.name.toLowerCase().includes(d.toLowerCase()))).slice(0,3);
  openSheet(`<h3>Canviar «${m.slot}»</h3><p class="sh-sub">Mateixes calories, evitant el que et cansa</p>`+
    opts.map(o=>`<div class="opt" onclick="applySwap('${id}','${encodeURIComponent(o.name)}',${o.kcal},${o.prot})"><span>${o.name}</span><span class="ov">${o.kcal} kcal · ${o.prot}g</span></div>`).join(''));
}
function applySwap(id,name,kcal,prot){ const m=S.meals.find(x=>x.id===id); m.name=decodeURIComponent(name); m.kcal=kcal; m.prot=prot; save(); closeSheet(); renderAll(); toast('Àpat canviat'); }
function addShake(){
  const s=SHAKES[Math.floor(Math.random()*SHAKES.length)];
  S.meals.push({id:'sh'+Date.now(),slot:'Batut extra',name:s.name,kcal:s.kcal,prot:s.prot,done:true});
  checkDayComplete(); save(); renderAll(); go('nutri'); toast(`Batut de +${s.kcal} kcal comptabilitzat`);
}
function toggleLowAppetite(){ S.dayMode=(S.dayMode==='pocaGana')?'normal':'pocaGana'; save(); renderAll(); toast(S.dayMode==='pocaGana'?'Mode poca gana: prioritzo líquids':'Tornem al pla normal'); }

/* ---------- ENTRENAMENT ---------- */
function renderWeek(){
  const abbr={1:'Dl',2:'Dt',3:'Dc',4:'Dj',5:'Dv',6:'Ds',0:'Dg'};
  const order=[1,2,3,4,5,6,0], today=new Date().getDay();
  const base=new Date();
  document.getElementById('weekWrap').innerHTML = order.map(d=>{
    const w=WEEK[d], isToday=d===today;
    const dd=new Date(base); dd.setDate(base.getDate()+((d-today+7)%7));
    let status='';
    if(isToday && S.gymDone) status='<span class="chip-done">Fet</span>';
    else if(isToday) status='<span class="chip-now">Avui</span>';
    return `<div class="wday ${isToday?'now':''}">
      <div class="wd"><b>${abbr[d]}</b><span>${dd.getDate()}/${dd.getMonth()+1}</span></div>
      <span class="wl">${w.label}</span>${catTag(w.type)}${status}</div>`;
  }).join('');

  const w=WEEK[today];
  document.getElementById('focusCard').innerHTML = `
    <div class="fc-top">${catTag(w.type)}${S.gymDone?'<span class="chip-done">Completat</span>':'<span class="chip-now">Avui</span>'}</div>
    <div class="fc-title">${w.label}</div>
    <p class="muted small" style="margin:0 0 4px">${w.focus}</p>
    <div class="btns"><button class="btn primary block" ${S.gymDone?'disabled':''} onclick="doneSession()">${IC('check')}${S.gymDone?'Sessió completada':'Marcar sessió feta'}</button></div>
    <p class="muted small" style="margin:12px 0 0">${w.type==='gym'?'Pots registrar sèries (opcional): s\'autocompleta amb l\'últim pes.':'Marca-la quan la facis. Curta i de qualitat.'}</p>`;

  const cn=document.getElementById('conflictNote'), tomorrow=(today+1)%7;
  cn.innerHTML = (w.label==='Cames' && (WEEK[tomorrow].type==='run'||WEEK[tomorrow].type==='bike'))
    ? `<div class="insight warn"><div class="ihead">${IC('alert','sm')} Possible conflicte</div><p>Demà toca <b>${CAT[WEEK[tomorrow].type].toLowerCase()}</b>. Si les cames van carregades, mou-lo un dia — el gym mana fins que el pes pugi de forma estable.</p></div>`
    : '';
}
function doneSession(){ S.gymDone=true; save(); renderWeek(); toast('Sessió registrada'); }

/* ---------- EVOLUCIÓ ---------- */
function trendPerWeek(){
  const ws=S.weights, first=ws[0], last=ws[ws.length-1];
  const days=(new Date(last.d)-new Date(first.d))/86400000||1;
  return (last.kg-first.kg)/(days/7);
}
function renderEvolution(){
  const w=curWeight(), {startWeight:a,target1:t1}=PROGRAM, perWeek=trendPerWeek();
  const miles=[68,70,72,75], nextMile=miles.find(m=>w<m)||t1;

  document.getElementById('evoMini').innerHTML = `
    <div class="mcard"><div class="mi">${IC('scale','sm')}</div><div class="mv">${fmt(w)}<span style="font-size:13px;font-weight:600;color:var(--muted)"> kg</span></div><div class="ml">Pes actual</div></div>
    <div class="mcard"><div class="mi">${IC('activity','sm')}</div><div class="mv ${perWeek>=0.2?'up':''}">${perWeek>=0?'+':''}${fmt(perWeek)}</div><div class="ml">kg / setmana</div></div>
    <div class="mcard"><div class="mi">${IC('target','sm')}</div><div class="mv">${nextMile}<span style="font-size:13px;font-weight:600;color:var(--muted)"> kg</span></div><div class="ml">Fita propera</div></div>
    <div class="mcard amber"><div class="mi">${IC('calendar','sm')}</div><div class="mv">83<span style="font-size:13px;font-weight:600;color:var(--muted)">%</span></div><div class="ml">Constància 30d</div></div>`;

  const pct=Math.max(0,Math.min(100,(w-a)/(t1-a)*100));
  document.getElementById('goalCard').innerHTML = `
    <div class="ends"><span>${a} kg</span><b>${fmt(w)} kg</b><span>${t1} kg</span></div>
    <div class="bar big"><i style="width:${pct}%"></i></div>`;
  document.getElementById('miles').innerHTML = miles.map(m=>{
    const left=(m-a)/(t1-a)*100, hit=w>=m;
    return `<div class="mile ${hit?'hit':''}" style="left:${left}%"><span class="m-dot"></span>${m}</div>`;
  }).join('');

  const note=document.getElementById('goalNote');
  if(perWeek>=0.2) note.innerHTML=`Tendència <b>+${fmt(perWeek)} kg/setmana</b>: vas bé cap als ${t1} kg. Ignora els alts i baixos del dia — el que compta és la línia. Propera fita: <b>${nextMile} kg</b> (falta ${fmt(nextMile-w)}).`;
  else if(perWeek>=0) note.innerHTML=`Tendència gairebé plana (<b>${fmt(perWeek)} kg/setm</b>). Per accelerar sense patir: afegeix un batut diari. Propera fita: <b>${nextMile} kg</b>.`;
  else note.innerHTML=`El pes ha baixat lleugerament. No et rallis per un dia — puja les calories fàcils i revisem en uns dies.`;

  const show=S.weights.slice(-8), mn=Math.min(...show.map(x=>x.kg))-0.3, mx=Math.max(...show.map(x=>x.kg))+0.3;
  document.getElementById('chart').innerHTML = show.map(x=>{
    const h=((x.kg-mn)/(mx-mn))*100, lbl=x.d.slice(8,10)+'/'+x.d.slice(5,7);
    return `<div class="col" style="height:${h}%"><i>${fmt(x.kg)}</i><em>${lbl}</em></div>`;
  }).join('');
}
function addWeight(){
  const last=curWeight(), next=Math.round((last+0.3)*10)/10;
  S.weights.push({d:todayISO(),kg:next}); save(); renderEvolution();
  toast('Pes registrat: '+fmt(next)+' kg'+(next>=68&&last<68?' · fita 68 kg superada':''));
}

/* ---------- COACH ---------- */
function renderCoach(){
  document.getElementById('coachFull').innerHTML = coachText();
  const g=goals(), left=Math.max(0,g.kcal-doneKcal());
  document.getElementById('coachCtx').innerHTML = `
    <div class="ctx"><div class="cl">Estat</div><div class="cv">${g.label}</div></div>
    <div class="ctx"><div class="cl">Calories restants</div><div class="cv">${nf(left)} kcal</div></div>
    <div class="ctx"><div class="cl">Proteïna</div><div class="cv">${doneProt()} / ${g.prot} g</div></div>`;
}

/* ---------- MODE DIA DIFÍCIL ---------- */
function toggleHardDay(){ S.dayMode=(S.dayMode==='dificil')?'normal':'dificil'; save(); renderAll(); go('avui'); toast(S.dayMode==='dificil'?'Mode dia difícil: exigència al mínim':'Tornem al pla normal'); }

/* ---------- CHECK-IN ---------- */
let ci={mood:null,app:null,en:null};
function openCheckin(){
  ci={mood:null,app:null,en:null};
  openSheet(`<h3>Check-in ràpid</h3><p class="sh-sub">Tres tocs i llest</p>
    <div class="qlabel">Com estàs d'ànim?</div>
    <div class="checkopt" id="q-mood">${chip('mood','be','Bé')}${chip('mood','reg','Regular')}${chip('mood','low','Baix')}</div>
    <div class="qlabel">Com tens la gana?</div>
    <div class="checkopt" id="q-app">${chip('app','alta','Amb gana')}${chip('app','norm','Normal')}${chip('app','poca','Poca')}</div>
    <div class="qlabel">Energia?</div>
    <div class="checkopt" id="q-en">${chip('en','ple','Plena')}${chip('en','mid','Mitja')}${chip('en','low','Baixa')}</div>
    <button class="btn primary" style="width:100%;margin-top:18px" onclick="submitCheckin()">Desar check-in</button>`);
}
function chip(g,v,txt){ return `<button class="chip" data-g="${g}" data-v="${v}" onclick="pick('${g}','${v}')">${txt}</button>`; }
function pick(g,v){ ci[g]=v; document.querySelectorAll(`#q-${g} .chip`).forEach(c=>c.classList.toggle('sel',c.dataset.v===v)); }
function submitCheckin(){
  S.checkin={...ci,at:new Date().toISOString()}; save(); closeSheet();
  if(ci.mood==='low'){ S.dayMode='dificil'; save(); renderAll(); toast('Dia fluix detectat — activo mode dia difícil'); }
  else if(ci.app==='poca'){ S.dayMode='pocaGana'; save(); renderAll(); toast('Poca gana — prioritzo calories líquides'); }
  else if(ci.en==='low'){ renderAll(); toast('Poca energia: valora moure el cardio dur'); }
  else { renderAll(); toast('Check-in desat · dia per empènyer'); }
}

/* ---------- RESCAT ---------- */
function openRescue(){
  openSheet(`<h3>Mode rescat</h3><p class="sh-sub">Dies dolents o amb presses. Tria i suma calories fàcils:</p>`+
    SHAKES.map(s=>`<div class="opt" onclick="rescuePick('${encodeURIComponent(s.name)}',${s.kcal},${s.prot})"><span>${s.name}</span><span class="ov">${s.kcal} kcal</span></div>`).join(''));
}
function rescuePick(name,kcal,prot){ S.meals.push({id:'rs'+Date.now(),slot:'Rescat',name:decodeURIComponent(name),kcal,prot,done:true}); checkDayComplete(); save(); closeSheet(); renderAll(); toast('Comptabilitzat — no perds el fil'); }

/* ---------- RATXA ---------- */
function checkDayComplete(){
  const need=S.dayMode==='dificil'?1:3;
  if(doneCount()>=need && S.lastComplete!==todayISO()){ S.streak+=1; S.lastComplete=todayISO(); toast('Dia comptabilitzat · ratxa '+S.streak); }
}

/* ---------- SHEET + TOAST ---------- */
function openSheet(html){ document.getElementById('sheet').innerHTML=html; document.getElementById('overlay').classList.add('open'); }
function closeSheet(){ document.getElementById('overlay').classList.remove('open'); }
let toastT;
function toast(msg){ const t=document.getElementById('toast'); t.innerHTML=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2400); }

/* ---------- RESET ---------- */
function resetAll(){ if(confirm('Esborrar totes les dades del prototip i tornar a començar?')){ localStorage.removeItem(KEY); S=freshState(); save(); renderAll(); go('avui'); toast('Dades reiniciades'); } }

/* ---------- ARRENCADA ---------- */
load(); renderAll();
