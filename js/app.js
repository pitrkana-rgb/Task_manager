/**
 * FlowTask — Task Manager Application
 * Main application logic: state, persistence, UI rendering, and event handlers.
 * All functions are in global scope for use by inline onclick handlers in index.html.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS — Locale strings and static config
// ═══════════════════════════════════════════════════════════════════════════════
const MONTHS_FULL=['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const MONTHS_S=['Led','Úno','Bře','Dub','Kvě','Čvn','Čvc','Srp','Zář','Říj','Lis','Pro'];
const DAYS_S=['Po','Út','St','Čt','Pá'];
const DAYS_FULL=['Pondělí','Úterý','Středa','Čtvrtek','Pátek'];
const SPORTS=[
  {id:'running',name:'Běh',icon:'🏃'},
  {id:'cycling',name:'Cyklistika',icon:'🚴'},
  {id:'swimming',name:'Plavání',icon:'🏊'},
  {id:'gym',name:'Posilovna',icon:'💪'},
  {id:'yoga',name:'Jóga',icon:'🧘'},
  {id:'walking',name:'Chůze',icon:'🚶'},
  {id:'football',name:'Fotbal',icon:'⚽'},
  {id:'tennis',name:'Tenis',icon:'🎾'},
  {id:'basketball',name:'Basketbal',icon:'🏀'},
  {id:'hiking',name:'Turistika',icon:'🥾'},
];
const PROJ_COLORS=['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#3B82F6','#06B6D4'];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE — Application state (profile, current page, modals, drag state)
// ═══════════════════════════════════════════════════════════════════════════════
let state={};
let activeProfileId=null;
let nextId=1;
let currentPage='dashboard';
let currentKanbanWS='work';
let currentWPWS='work';
let currentGoalWeekOffset=0;
let currentProjectId=null;
let selWeekMon=null;
let wpoY,wpoM;
let taskModalWS='work',taskModalEditId=null,taskModalBullets=[],taskModalRecur='none';
let goalModalType='habit';
let confirmCallback=null;
let dragState=null;
let selectedSportIds=[]; /* legacy sport selector (weekly page removed) */
let activityModalEditId=null;
let activityModalRecur='none';

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE — localStorage load/save, profile and profile data access
// ═══════════════════════════════════════════════════════════════════════════════
function loadState(){try{const r=localStorage.getItem('flowtask_v6');if(r)state=JSON.parse(r)}catch(e){state={}}
  if(!state.profiles)state.profiles={};if(!state.activeProfile)state.activeProfile=null;
  nextId=state.nextId||1;activeProfileId=state.activeProfile}
function saveState(){state.nextId=nextId;state.activeProfile=activeProfileId;try{localStorage.setItem('flowtask_v6',JSON.stringify(state))}catch(e){}}
function getProfile(){return activeProfileId&&state.profiles[activeProfileId]?state.profiles[activeProfileId]:null}
function getPD(){const p=getProfile();return p?p.data:null}
function ensureProfileData(pid){
  if(!state.profiles[pid].data)state.profiles[pid].data={tasks:{work:[],personal:[]},projects:{},sportLog:{},completedDates:[],weeklyGoals:{},activities:[],activityLog:{}};
  const d=state.profiles[pid].data;
  if(!d.tasks)d.tasks={work:[],personal:[]};
  if(!d.projects)d.projects={};if(!d.sportLog)d.sportLog={};
  if(!d.completedDates)d.completedDates=[];if(!d.weeklyGoals)d.weeklyGoals={};
  if(!d.activities)d.activities=[];if(!d.activityLog)d.activityLog={};
}

// ═══════ DATE UTILS ═══════
function dsDate(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function pad(n){return String(n).padStart(2,'0')}
function fshort(d){return pad(d.getDate())+' '+MONTHS_S[d.getMonth()]}
function getMon(d){const day=d.getDay()||7,m=new Date(d);m.setDate(d.getDate()-day+1);m.setHours(0,0,0,0);return m}
function weekNum(d){const c=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));c.setUTCDate(c.getUTCDate()+4-(c.getUTCDay()||7));const y=new Date(Date.UTC(c.getUTCFullYear(),0,1));return Math.ceil((((c-y)/86400000)+1)/7)}
function weekKey(d){const mon=getMon(d);return mon.getFullYear()+'-W'+pad(weekNum(mon))}
function todayStr(){return dsDate(new Date())}
function isRecurToday(t,dateStr){
  if(!t.recur||t.recur==='none')return t.dueDate===dateStr;
  const d=new Date(dateStr+'T00:00:00'),dow=d.getDay();
  if(t.recur==='daily')return true;
  if(t.recur==='weekdays')return dow>=1&&dow<=5;
  if(t.recur==='weekly'){if(!t.dueDate)return false;return new Date(t.dueDate+'T00:00:00').getDay()===dow}
  if(t.recur==='monthly'){if(!t.dueDate)return false;return new Date(t.dueDate+'T00:00:00').getDate()===d.getDate()}
  return false;
}

function getActivitiesForDate(d,dateStr){
  if(!d||!d.activities)return [];
  const dt=new Date(dateStr+'T00:00:00');
  const dow=dt.getDay();
  return d.activities.filter(a=>{
    const start=a.date||null;
    if(start && dateStr<start)return false;
    const r=a.recur||'none';
    if(r==='none')return a.date===dateStr;
    if(r==='daily')return true;
    if(r==='weekdays')return dow>=1&&dow<=5;
    if(r==='weekly'){if(!a.date)return false;return new Date(a.date+'T00:00:00').getDay()===dow}
    if(r==='monthly'){if(!a.date)return false;return new Date(a.date+'T00:00:00').getDate()===dt.getDate()}
    return false;
  }).map(a=>{
    const s=SPORTS.find(x=>x.id===a.sportId);
    return { ...a, name:s?s.name:'Aktivita', icon:s?s.icon:'🏷️' };
  }).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
}

// ═══════ PROFILE SCREEN ═══════
const DEFAULT_PROFILE_COLOR = '#4F46E5';
function renderProfileScreen(){
  const ids=Object.keys(state.profiles);
  const list=document.getElementById('ps-profiles-list');list.innerHTML='';
  if(!ids.length){document.getElementById('ps-profiles-section').style.display='none';return}
  document.getElementById('ps-profiles-section').style.display='block';
  ids.forEach(pid=>{
    const p=state.profiles[pid];
    const item=document.createElement('div');item.className='ps-profile-item';
    item.innerHTML=`<div class="ps-av" style="background:${p.color}">${p.initials}</div><div><div class="ps-pname">${p.name}</div><div class="ps-prole">FlowTask Pro</div></div>`;
    item.onclick=()=>enterApp(pid);list.appendChild(item);
  });
}
function createProfile(){
  const name=document.getElementById('ps-name').value.trim();if(!name)return;
  const emailEl=document.getElementById('ps-email');
  const email=(emailEl&&emailEl.value?emailEl.value.trim():'')||'';
  const phoneEl=document.getElementById('ps-phone');
  const phone=(phoneEl&&phoneEl.value?phoneEl.value.trim():'')||'';
  const pid='p_'+Date.now();
  const initials=name.split(' ').map(w=>w[0].toUpperCase()).join('').slice(0,2);
  state.profiles[pid]={id:pid,name,email,phone,initials,color:DEFAULT_PROFILE_COLOR};
  ensureProfileData(pid);seedData(pid);saveState();enterApp(pid);
}
function enterApp(pid){
  activeProfileId=pid;state.activeProfile=pid;ensureProfileData(pid);saveState();
  document.getElementById('profile-screen').style.display='none';
  document.getElementById('app').classList.add('show');initApp();
}
function signOut(e){
  if(e&&e.stopPropagation)e.stopPropagation();
  activeProfileId=null;state.activeProfile=null;saveState();
  try{ if(window.top) window.top.location.href='/logout'; else window.location.href='/logout'; }catch(_){ window.location.href='/logout'; }
}

// ═══════ APP INIT ═══════
function initApp(){
  const p=getProfile();if(!p)return;
  document.getElementById('sb-avatar').style.background=p.color;
  document.getElementById('sb-avatar').textContent=p.initials;
  document.getElementById('sb-uname').textContent=p.name;
  const now=new Date();
  selWeekMon=getMon(now);updateWeekPill();
  renderAll();renderSidebar();goPage('dashboard');
  setInterval(updateGreeting,60000);updateGreeting();
}

function czVocative(raw){
  const name=(raw||'').trim();
  if(!name)return '';
  const n=name.split(/\s+/)[0];
  const low=n.toLowerCase();
  const last=n.slice(-1);
  const last2=n.slice(-2).toLowerCase();
  const last3=n.slice(-3).toLowerCase();

  // common female: -a -> -o (Veronika -> Veroniko)
  if(last==='a'){
    return n.slice(0,-1)+'o';
  }
  // Petr -> Petře, Jan -> Jane, Pavel -> Pavle
  if(low==='petr') return 'Petře';
  if(low==='jan') return 'Jane';
  if(low==='pavel') return 'Pavle';
  if(low==='tomáš') return 'Tomáši';
  if(low==='lukáš') return 'Lukáši';
  if(low==='matěj') return 'Matěji';
  if(low==='ondřej') return 'Ondřeji';

  // generic masculine-ish heuristics
  if(last2==='ek') return n.slice(0,-2)+'ku';
  if(last2==='el') return n.slice(0,-2)+'le';
  if(last==='k') return n+'u';
  if(last3==='šek') return n.slice(0,-3)+'šku';
  if(last==='r') return n+'e';

  return n;
}

function updateGreeting(){
  const h=new Date().getHours();const p=getProfile();if(!p)return;
  const dn=['Ne','Po','Út','St','Čt','Pá','So'];
  let greet='Dobré ráno';if(h>=12&&h<17)greet='Dobré odpoledne';else if(h>=17)greet='Dobrý večer';
  const voc=czVocative(p.name)||p.name;
  const dgName=document.getElementById('dg-name');
  if(dgName){
    const nm=(voc||'').trim();
    dgName.textContent = nm ? (greet+' '+nm) : (greet+'!');
  }
  const dgSub=document.getElementById('dg-sub');if(dgSub)dgSub.textContent='Zde je váš dnešní přehled.';
  const dgDate=document.getElementById('dg-date');if(dgDate)dgDate.textContent=dn[new Date().getDay()]+', '+new Date().getDate()+' '+MONTHS_S[new Date().getMonth()]+' '+new Date().getFullYear();
  const dgCredit=document.getElementById('dg-credit');if(dgCredit)dgCredit.textContent='Created by PK-digital';
}

// ═══════ NAV ═══════
function goPage(page){
  currentPage=page;
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(el=>el.classList.remove('active'));
  const pg=document.getElementById('page-'+page);if(pg)pg.classList.add('active');
  const nb=document.getElementById('nav-'+page);if(nb)nb.classList.add('active');
  if(page==='dashboard'){updateGreeting();renderDashboard()}
  if(page==='weekly'){renderWeeklyGrid();renderSportFilters();renderSportGrid()}
  if(page==='goals')renderGoalsPage();
  if(page==='stats')renderStats();
  if(page==='projects')renderProjectsPage();
  if(page==='settings')renderSettingsPage();
  renderBadges();
}

// ═══════ RENDER ALL ═══════
function renderAll(){renderKanbanBoard('work');renderKanbanBoard('personal');if(currentKanbanWS==='all')renderKanbanAll();renderDashboard();renderBadges();renderSidebar()}
function renderBadges(){
  const d=getPD();if(!d)return;
  const all=[...d.tasks.work,...d.tasks.personal];
  const active=all.filter(t=>t.status!=='completed').length;
  const todayT=all.filter(t=>isRecurToday(t,todayStr())&&t.status!=='completed').length;
  document.getElementById('badge-dashboard').textContent=active;
  document.getElementById('badge-kanban').textContent=active;
}
function renderSidebar(){
  const d=getPD();if(!d)return;
  const pids=Object.keys(d.projects);
  const grp=document.getElementById('sb-projects-group');
  const list=document.getElementById('sb-projects-list');list.innerHTML='';
  if(pids.length>0){
    grp.style.display='block';
    pids.forEach(pid=>{
      const proj=d.projects[pid];
      const item=document.createElement('div');item.className='sb-proj-item'+(currentProjectId===pid?' active':'');
      item.innerHTML=`<span class="sb-proj-dot" style="background:${proj.color}"></span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${proj.name}</span>`;
      item.onclick=()=>{currentProjectId=pid;goPage('projects')};list.appendChild(item);
    });
  } else grp.style.display='none';
}

// ═══════ DASHBOARD (Přehled dne) ═══════
/** Returns weekly goal progress for current week: [{ title, pct, detail }, ...] */
function getDashboardWeeklyGoalsProgress(d){
  if(!d||!d.weeklyGoals)return [];
  const wk=weekKey(new Date());
  const goals=d.weeklyGoals[wk];
  if(!goals||!goals.length)return [];
  return goals.map(g=>{
    let pct=0,detail='';
    if(g.type==='habit'){
      const days=g.days||[false,false,false,false,false,false,false];
      const checked=days.filter(Boolean).length;
      pct=Math.round((checked/7)*100);
      detail=`${checked} / 7 dní`;
    } else {
      const entries=g.entries||[0,0,0,0,0,0,0];
      const sum=entries.reduce((a,b)=>a+b,0);
      const target=g.target||1;
      pct=Math.min(100,Math.round((sum/target)*100));
      detail=`${sum} / ${target} ${g.unit||''}`.trim();
    }
    return { title: g.title, pct, detail };
  });
}

/** Builds one weekly goal row: circular progress (left) + title and "X% complete" (right). */
function mkWeeklyGoalRow(title,pct,detail){
  const row=document.createElement('div');row.className='dash-wg-row';
  const size=44;const r=18;const cx=size/2;const cy=size/2;
  const circumference=2*Math.PI*r;
  const dashLen=(Math.min(100,pct)/100)*circumference;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',`0 0 ${size} ${size}`);svg.setAttribute('class','dash-wg-circle');
  const bg=document.createElementNS('http://www.w3.org/2000/svg','circle');
  bg.setAttribute('cx',cx);bg.setAttribute('cy',cy);bg.setAttribute('r',r);
  bg.setAttribute('fill','none');bg.setAttribute('stroke','var(--border)');bg.setAttribute('stroke-width',4);
  svg.appendChild(bg);
  if(pct>0){
    const arc=document.createElementNS('http://www.w3.org/2000/svg','circle');
    arc.setAttribute('cx',cx);arc.setAttribute('cy',cy);arc.setAttribute('r',r);
    arc.setAttribute('fill','none');arc.setAttribute('stroke','var(--purple)');arc.setAttribute('stroke-width',4);
    arc.setAttribute('stroke-dasharray',`${dashLen} ${circumference}`);arc.setAttribute('stroke-linecap','round');
    arc.setAttribute('transform',`rotate(-90 ${cx} ${cy})`);
    svg.appendChild(arc);
  }
  const pctText=document.createElementNS('http://www.w3.org/2000/svg','text');
  pctText.setAttribute('x',cx);pctText.setAttribute('y',cy+5);pctText.setAttribute('text-anchor','middle');
  pctText.setAttribute('fill','var(--text2)');pctText.setAttribute('font-size','11');pctText.setAttribute('font-family','Fira Code, monospace');
  pctText.textContent=pct+'%';
  svg.appendChild(pctText);
  const textWrap=document.createElement('div');textWrap.className='dash-wg-text';
  textWrap.innerHTML=`<div class="dash-wg-name" title="${title.replace(/"/g,'&quot;')}">${title}</div><div class="dash-wg-complete">${(detail||'').replace(/\"/g,'&quot;')}</div>`;
  row.appendChild(svg);row.appendChild(textWrap);
  return row;
}

/** Renders "Plnění dnes" as same circular progress style as weekly goals: circle with % inside. */
function renderDashboardPieChart(completedCount,totalCount){
  const svg=document.getElementById('dash-pie-svg');
  if(!svg)return;
  svg.innerHTML='';
  const size=100;const r=42;const cx=50;const cy=50;
  const circumference=2*Math.PI*r;
  if(totalCount===0){
    const bg=document.createElementNS('http://www.w3.org/2000/svg','circle');
    bg.setAttribute('cx',cx);bg.setAttribute('cy',cy);bg.setAttribute('r',r);
    bg.setAttribute('fill','none');bg.setAttribute('stroke','var(--border)');bg.setAttribute('stroke-width',8);
    svg.appendChild(bg);
    const txt=document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x',cx);txt.setAttribute('y',cy+6);txt.setAttribute('text-anchor','middle');
    txt.setAttribute('fill','var(--text3)');txt.setAttribute('font-size','14');txt.setAttribute('font-family','Fira Code, monospace');
    txt.textContent='0%';svg.appendChild(txt);
    return;
  }
  const pct=Math.round((completedCount/totalCount)*100);
  const dashLen=(Math.min(100,pct)/100)*circumference;
  const bg=document.createElementNS('http://www.w3.org/2000/svg','circle');
  bg.setAttribute('cx',cx);bg.setAttribute('cy',cy);bg.setAttribute('r',r);
  bg.setAttribute('fill','none');bg.setAttribute('stroke','var(--surface3)');bg.setAttribute('stroke-width',8);
  svg.appendChild(bg);
  if(pct>0){
    const arc=document.createElementNS('http://www.w3.org/2000/svg','circle');
    arc.setAttribute('cx',cx);arc.setAttribute('cy',cy);arc.setAttribute('r',r);
    arc.setAttribute('fill','none');arc.setAttribute('stroke','var(--green)');arc.setAttribute('stroke-width',8);
    arc.setAttribute('stroke-dasharray',`${dashLen} ${circumference}`);arc.setAttribute('stroke-linecap','round');
    arc.setAttribute('transform',`rotate(-90 ${cx} ${cy})`);
    svg.appendChild(arc);
  }
  const txt=document.createElementNS('http://www.w3.org/2000/svg','text');
  txt.setAttribute('x',cx);txt.setAttribute('y',cy+6);txt.setAttribute('text-anchor','middle');
  txt.setAttribute('fill','var(--text2)');txt.setAttribute('font-size','14');txt.setAttribute('font-family','Fira Code, monospace');
  txt.textContent=pct+'%';svg.appendChild(txt);
}

/** Toggle collapsible dashboard section (today / upcoming). */
function toggleDashboardSection(sectionId){
  const body=document.getElementById('collapse-'+sectionId);
  const btn=document.getElementById('btn-toggle-'+sectionId);
  if(!body||!btn)return;
  const isCollapsed=body.classList.toggle('collapsed');
  btn.classList.toggle('collapsed',isCollapsed);
  btn.setAttribute('aria-expanded',!isCollapsed);
  btn.textContent=isCollapsed?'▶':'▼';
}

function renderDashboard(){
  const d=getPD();if(!d)return;
  const all=[...d.tasks.work,...d.tasks.personal];
  const today=todayStr();
  const todayTasks=all.filter(t=>isRecurToday(t,today));
  const totalToday=todayTasks.length;
  const inProgressToday=todayTasks.filter(t=>t.status==='inprogress').length;
  const completedToday=todayTasks.filter(t=>t.status==='completed').length;

  const dpDone=document.getElementById('dp-done');if(dpDone)dpDone.textContent=completedToday;
  const dpTotal=document.getElementById('dp-total');if(dpTotal)dpTotal.textContent=totalToday;
  const pct=totalToday?Math.round((completedToday/totalToday)*100):0;
  const dpPct=document.getElementById('dp-pct');if(dpPct)dpPct.textContent=pct+'%';
  const dpFill=document.getElementById('dp-fill');if(dpFill){dpFill.style.width=pct+'%';dpFill.style.backgroundColor=pctToHsl(pct)}

  const wgList=document.getElementById('dash-wg-list');if(wgList){
    wgList.innerHTML='';
    const goals=getDashboardWeeklyGoalsProgress(d);
    if(!goals.length){const empty=document.createElement('div');empty.className='dash-wg-empty';empty.textContent='Pro tento týden nejsou žádné cíle.';wgList.appendChild(empty)}
    else goals.forEach(({title,pct,detail})=>wgList.appendChild(mkWeeklyGoalRow(title,pct,detail)));
  }

  const ttl=document.getElementById('today-tasks-list');if(ttl){ttl.innerHTML='';
  const activeTodayTasks=todayTasks.filter(t=>t.status!=='completed');
  const todayActs=getActivitiesForDate(d,today);
  const activeActs=todayActs.filter(a=>!d.activityLog[today+'_'+a.id]);
  if(!activeTodayTasks.length && !activeActs.length){ttl.innerHTML='<div class="empty-state">Žádné dnešní úkoly — skvělá práce! 🎉</div>'}
  else {
  activeTodayTasks.slice(0,10).forEach(t=>{
    const ws=d.tasks.work.find(x=>x.id===t.id)?'Práce':'Osobní';
    const wsKey=d.tasks.work.find(x=>x.id===t.id)?'work':'personal';
    const div=document.createElement('div');div.className='today-task-item p-'+t.priority+'-t';
    div.innerHTML=`<div class="tti-check ${t.status==='completed'?'done':''}" onclick="quickComplete(${t.id})"></div><div style="flex:1;min-width:0"><div class="tti-title ${t.status==='completed'?'done':''}">${t.title}</div><div class="tti-meta"><span class="pbadge p-${t.priority}">${t.priority==='high'?'Vysoká':t.priority==='medium'?'Střední':'Nízká'}</span>${t.recur&&t.recur!=='none'?`<span class="tti-recur">🔁 ${t.recur==='daily'?'Denně':t.recur==='weekdays'?'Pracovní dny':t.recur==='weekly'?'Týdně':'Měsíčně'}</span>`:''}<span class="tti-ws">${ws}</span></div></div><div class="tti-actions"><button class="tact edit" onclick="openTaskModal('${wsKey}',${t.id});event.stopPropagation()">✎</button><button class="tact del" onclick="deleteTask('${wsKey}',${t.id});event.stopPropagation()">✕</button></div>`;
    ttl.appendChild(div);
  });
  activeActs.slice(0,10).forEach(a=>{
    const key=today+'_'+a.id;
    const div=document.createElement('div');div.className='today-task-item p-low-t';
    div.innerHTML=`<div class="tti-check ${d.activityLog[key]?'done':''}" onclick="toggleActivityDone('${key}', event)"></div><div style="flex:1;min-width:0"><div class="tti-title">${a.icon} ${a.name}${a.time?` <span style="color:var(--text3);font-weight:600;font-family:'Fira Code',monospace;font-size:10px">(${a.time})</span>`:''}</div><div class="tti-meta"><span class="tti-recur">${a.recur&&a.recur!=='none'?'🔁 '+(a.recur==='daily'?'Denně':a.recur==='weekdays'?'Pracovní dny':a.recur==='weekly'?'Týdně':'Měsíčně'):'Aktivita'}</span></div></div><div class="tti-actions"><button class="tact edit" onclick="openActivityModal(${a.id});event.stopPropagation()">✎</button><button class="tact del" onclick="deleteActivityById(${a.id});event.stopPropagation()">✕</button></div>`;
    ttl.appendChild(div);
  });
  }
  }

  const ul=document.getElementById('upcoming-list');if(ul){ul.innerHTML='';
  const upcoming=all.filter(t=>t.dueDate&&t.dueDate>today&&t.status!=='completed').sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,8);
  if(!upcoming.length){ul.innerHTML='<div class="empty-state">Žádné nadcházející termíny</div>'}
  else upcoming.forEach(t=>{
    const div=document.createElement('div');div.className='up-item';
    const daysLeft=Math.ceil((new Date(t.dueDate+'T00:00:00')-new Date(today+'T00:00:00'))/(1000*60*60*24));
    const daysStr=daysLeft===1?'zítra':daysLeft+'d';
    div.innerHTML=`<span class="up-date">${t.dueDate}</span><span class="pbadge p-${t.priority}">${t.priority==='high'?'Vysoká':t.priority==='medium'?'Střední':'Nízká'}</span><span class="up-title">${t.title}</span><span style="font-size:9px;font-family:'Fira Code',monospace;color:${daysLeft<=2?'var(--red)':'var(--text3)'}">za ${daysStr}</span>`;
    ul.appendChild(div);
  });}
}

function pctToHsl(pct){
  const p=Math.min(100,Math.max(0,pct));
  const h=Math.round((p/100)*120); // 0=red → 120=green
  return `hsl(${h} 75% 45%)`;
}
function quickComplete(id){
  const d=getPD();if(!d)return;
  const t=[...d.tasks.work,...d.tasks.personal].find(x=>x.id===id);
  if(t){t.status=t.status==='completed'?'ideas':'completed';logCompletionDate(d);saveState();renderAll()}
}
function logCompletionDate(d){const today=todayStr();if(!d.completedDates.includes(today))d.completedDates.push(today)}
function calcStreak(d){
  let streak=0;const today=new Date();
  for(let i=0;i<365;i++){const dt=new Date(today);dt.setDate(today.getDate()-i);if(d.completedDates.includes(dsDate(dt)))streak++;else if(i>0)break}
  return streak;
}

// ═══════ TASK MANAGER (kanban) ═══════
function setKanbanWS(ws,el){
  currentKanbanWS=ws;
  document.querySelectorAll('#kanban-ws-tabs .ws-tab').forEach(e=>e.classList.remove('active'));el.classList.add('active');
  document.getElementById('kanban-work-board').style.display=ws==='work'?'grid':'none';
  document.getElementById('kanban-personal-board').style.display=ws==='personal'?'grid':'none';
  const allWrap=document.getElementById('kanban-all-wrap');if(allWrap)allWrap.style.display=ws==='all'?'block':'none';
  if(ws==='all'){renderKanbanAll()}
}

function renderKanbanAll(){
  const d=getPD();if(!d)return;
  const target=document.getElementById('kanban-all-board');if(!target)return;
  target.innerHTML='';
  const allTasks=[
    ...d.tasks.work.map(t=>({ws:'work',t})),
    ...d.tasks.personal.map(t=>({ws:'personal',t}))
  ];
  ['ideas','inprogress','completed'].forEach(col=>{
    const colEl=document.createElement('div');colEl.className='kol'+(col==='completed'?' completed-kol':'');
    colEl.ondragover=(e)=>onDragOver(e,dragState?dragState.ws:'work',col);
    colEl.ondrop=(e)=>onDrop(e,dragState?dragState.ws:'work',col);
    colEl.ondragleave=(e)=>onDragLeave(e);
    const name=col==='ideas'?'Nové úkoly':col==='inprogress'?'Rozpracováno':'Splněno';
    const dot=col==='ideas'?'var(--accent)':col==='inprogress'?'var(--amber)':'var(--green)';
    const cnt=allTasks.filter(x=>x.t.status===col).length;
    colEl.innerHTML=`<div class="kol-head"><div class="kol-name"><span class="kol-dot" style="background:${dot}"></span>${name}</div><span class="kol-cnt">${cnt}</span></div><div class="kol-body"></div>`;
    const body=colEl.querySelector('.kol-body');
    allTasks.filter(x=>x.t.status===col).forEach(({ws,t})=>body.appendChild(mkTaskCard(ws,t)));
    // drop handler must move across work/personal based on dragged task
    colEl.ondrop=(e)=>{e.preventDefault();onDrop(e,dragState?dragState.ws:'work',col)};
    target.appendChild(colEl);
  });
}
function renderKanbanBoard(ws){
  const d=getPD();if(!d)return;
  ['ideas','inprogress','completed'].forEach(col=>{
    const body=document.getElementById('k-'+ws+'-body-'+col);if(!body)return;
    body.innerHTML='';
    d.tasks[ws].filter(t=>t.status===col).forEach(t=>body.appendChild(mkTaskCard(ws,t)));
    const cnt=document.getElementById('k-cnt-'+ws+'-'+col);if(cnt)cnt.textContent=d.tasks[ws].filter(t=>t.status===col).length;
  });
}
function mkTaskCard(ws,t){
  const card=document.createElement('div');
  const pcls=t.priority==='high'?'ph':t.priority==='medium'?'pm':'pl';
  card.className='task-card '+pcls;card.draggable=true;card.dataset.id=t.id;
  card.addEventListener('dragstart',e=>{dragState={id:t.id,ws};card.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id)});
  card.addEventListener('dragend',()=>{card.classList.remove('dragging');dragState=null;document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'))});
  const now=new Date();now.setHours(0,0,0,0);
  const overdue=t.dueDate&&new Date(t.dueDate+'T00:00:00')<now&&t.status!=='completed';
  const total=t.bullets?t.bullets.length:0,done=t.bullets?t.bullets.filter(b=>b.done).length:0;
  const pct=total?Math.round((done/total)*100):0;
  const priLbl=t.priority==='high'?'Vysoká':t.priority==='medium'?'Střední':'Nízká';
  const clHTML=t.bullets?t.bullets.map((b,bi)=>`<div class="cli-item"><input type="checkbox" ${b.done?'checked':''} onchange="toggleBullet('${ws}',${t.id},${bi},event)"><span class="${b.done?'ck':''}">${b.text}</span></div>`).join(''):'';
  card.innerHTML=`<div class="tc-top"><div class="tc-title ${t.status==='completed'?'done':''}">${t.title}</div><div class="tc-actions"><button class="tact edit" onclick="openTaskModal('${ws}',${t.id})">✎</button>${t.status!=='completed'?`<button class="tact done-btn" onclick="completeTask('${ws}',${t.id})">✓</button>`:''}<button class="tact del" onclick="deleteTask('${ws}',${t.id})">✕</button></div></div><div class="tc-meta"><span class="pbadge p-${t.priority}">${priLbl}</span>${t.dueDate?`<span class="tc-date ${overdue?'overdue':''}">${t.dueDate}${overdue?' ⚠':''}</span>`:''} ${t.recur&&t.recur!=='none'?'<span class="tc-recur">🔁</span>':''}<span class="tc-ws-badge ${ws==='work'?'work':'personal'}">${ws==='work'?'Práce':'Osobní'}</span></div>${total?`<div class="cl-wrap">${clHTML}<div class="cl-track"><div class="cl-fill" style="width:${pct}%"></div></div></div>`:''}`;
  return card;
}
function completeTask(ws,id){const d=getPD();if(!d)return;const t=d.tasks[ws].find(t=>t.id===id);if(t){t.status='completed';logCompletionDate(d);saveState();renderAll()}}
function deleteTask(ws,id){showConfirm('Smazat úkol','Trvale smazat tento úkol?',()=>{const d=getPD();if(!d)return;d.tasks[ws]=d.tasks[ws].filter(t=>t.id!==id);saveState();renderAll()})}
function toggleBullet(ws,taskId,bi,e){const d=getPD();if(!d)return;const t=d.tasks[ws].find(t=>t.id===taskId);if(!t||!t.bullets)return;t.bullets[bi].done=e.target.checked;if(t.bullets.every(b=>b.done)&&t.bullets.length>0){t.status='completed';logCompletionDate(d)}saveState();renderAll()}
function onDragOver(e,ws,col){e.preventDefault();const b=document.getElementById('k-'+ws+'-body-'+col);if(b)b.classList.add('drag-over')}
function onDragLeave(e){const b=e.currentTarget.querySelector('.kol-body');if(b)b.classList.remove('drag-over')}
function onDrop(e,ws,col){
  e.preventDefault();document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));
  if(!dragState)return;const d=getPD();if(!d)return;
  const t=d.tasks[dragState.ws].find(t=>t.id===dragState.id);if(!t)return;
  if(dragState.ws!==ws){d.tasks[dragState.ws]=d.tasks[dragState.ws].filter(x=>x.id!==t.id);d.tasks[ws].push(t);renderKanbanBoard(dragState.ws)}
  t.status=col;if(col==='completed')logCompletionDate(d);saveState();renderAll();
}

// ═══════ TASK MODAL ═══════
function openTaskModal(ws,editId){
  taskModalWS=ws;taskModalEditId=editId;taskModalBullets=[];taskModalRecur='none';
  const d=getPD();
  if(editId!==null&&editId!==undefined&&d){
    const t=[...d.tasks.work,...d.tasks.personal].find(x=>x.id===editId);
    if(t){
      document.getElementById('task-modal-title').textContent='Upravit úkol';
      document.getElementById('tm-save-btn').textContent='Uložit změny';
      document.getElementById('tm-title').value=t.title;
      document.getElementById('tm-priority').value=t.priority;
      document.getElementById('tm-ws').value=d.tasks.work.find(x=>x.id===editId)?'work':'personal';
      document.getElementById('tm-date').value=t.dueDate||'';
      document.getElementById('tm-status').value=t.status;
      taskModalBullets=(t.bullets||[]).map(b=>({...b}));
      taskModalRecur=t.recur||'none';
    }
  } else {
    document.getElementById('task-modal-title').textContent='Nový úkol';
    document.getElementById('tm-save-btn').textContent='Přidat úkol';
    document.getElementById('tm-title').value='';document.getElementById('tm-priority').value='medium';
    document.getElementById('tm-ws').value=ws;document.getElementById('tm-date').value='';
    document.getElementById('tm-status').value='ideas';
    taskModalRecur='none';
  }
  renderRecurOpts();renderTaskBullets();
  document.getElementById('task-modal-ov').classList.add('open');
  setTimeout(()=>document.getElementById('tm-title').focus(),80);
}

// ═══════ ACTIVITY MODAL ═══════
function openActivityModal(editId){
  activityModalEditId=editId;activityModalRecur='none';
  const d=getPD();if(!d)return;
  if(!d.activities)d.activities=[];
  if(!d.activityLog)d.activityLog={};
  const sel=document.getElementById('am-activity');if(!sel)return;
  sel.innerHTML='';
  SPORTS.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.icon+' '+s.name;sel.appendChild(o)});
  document.getElementById('activity-modal-title').textContent=editId?'Upravit aktivitu':'Nová aktivita';
  document.getElementById('am-save-btn').textContent=editId?'Uložit změny':'Přidat aktivitu';
  const delBtn=document.getElementById('am-del-btn');
  if(delBtn) delBtn.style.display=editId!=null?'inline-flex':'none';
  document.getElementById('am-date').value=todayStr();
  document.getElementById('am-time').value='';
  if(editId!=null){
    const a=d.activities.find(x=>x.id===editId);
    if(a){
      sel.value=a.sportId;
      document.getElementById('am-date').value=a.date||todayStr();
      document.getElementById('am-time').value=a.time||'';
      activityModalRecur=a.recur||'none';
    }
  }
  renderActRecurOpts();
  document.getElementById('activity-modal-ov').classList.add('open');
}
function closeActivityModal(){document.getElementById('activity-modal-ov').classList.remove('open')}
function closeActivityModalOut(e){if(e.target===document.getElementById('activity-modal-ov'))closeActivityModal()}
function selActRecur(el){document.querySelectorAll('#am-recur-opts .recur-chip').forEach(e=>e.classList.remove('sel'));el.classList.add('sel');activityModalRecur=el.dataset.v}
function renderActRecurOpts(){document.querySelectorAll('#am-recur-opts .recur-chip').forEach(el=>el.classList.toggle('sel',el.dataset.v===activityModalRecur))}
function saveActivity(){
  const d=getPD();if(!d)return;
  if(!d.activities)d.activities=[];
  if(!d.activityLog)d.activityLog={};
  const sportId=document.getElementById('am-activity').value;
  const date=document.getElementById('am-date').value||todayStr();
  const time=document.getElementById('am-time').value||'';
  const recur=activityModalRecur;
  if(activityModalEditId!=null){
    const a=d.activities.find(x=>x.id===activityModalEditId);
    if(a)Object.assign(a,{sportId,date,time,recur});
  } else {
    d.activities.push({id:nextId++,sportId,date,time,recur});
  }
  saveState();closeActivityModal();
  if(currentPage==='weekly')renderWeeklyGrid();
  if(currentPage==='dashboard')renderDashboard();
}

function deleteActivity(){
  const d=getPD();if(!d)return;
  if(activityModalEditId==null) return;
  const id=activityModalEditId;
  showConfirm('Smazat aktivitu','Opravdu chcete smazat tuto aktivitu? Tuto akci nelze vrátit zpět.',()=>{
    d.activities = (d.activities||[]).filter(a=>a.id!==id);
    // remove completion flags for this activity
    Object.keys(d.activityLog||{}).forEach(k=>{ if(k.endsWith('_'+id)) delete d.activityLog[k]; });
    saveState();closeActivityModal();
    if(currentPage==='weekly')renderWeeklyGrid();
    if(currentPage==='dashboard')renderDashboard();
  });
}
function closeTaskModal(){document.getElementById('task-modal-ov').classList.remove('open')}
function closeTaskModalOut(e){if(e.target===document.getElementById('task-modal-ov'))closeTaskModal()}
function selRecur(el){
  const wrap=document.getElementById('tm-recur-opts')||document;
  wrap.querySelectorAll('.recur-chip').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel');taskModalRecur=el.dataset.v;
}
function renderRecurOpts(){
  const wrap=document.getElementById('tm-recur-opts')||document;
  wrap.querySelectorAll('.recur-chip').forEach(el=>el.classList.toggle('sel',el.dataset.v===taskModalRecur));
}
function renderTaskBullets(){
  const list=document.getElementById('tm-bullets');list.innerHTML='';
  taskModalBullets.forEach((b,i)=>{const row=document.createElement('div');row.className='b-item';row.innerHTML=`<span class="b-dot"></span><span class="b-text">${b.text}</span><button class="b-del" onclick="rmBullet(${i})">✕</button>`;list.appendChild(row)});
}
function addBullet(){const inp=document.getElementById('tm-bi');const v=inp.value.trim();if(!v)return;taskModalBullets.push({text:v,done:false});inp.value='';renderTaskBullets();inp.focus()}
function rmBullet(i){taskModalBullets.splice(i,1);renderTaskBullets()}
function saveTask(){
  const title=document.getElementById('tm-title').value.trim();if(!title){document.getElementById('tm-title').focus();return}
  const d=getPD();if(!d)return;
  const ws=document.getElementById('tm-ws').value;
  const priority=document.getElementById('tm-priority').value;
  const dueDate=document.getElementById('tm-date').value||null;
  const status=document.getElementById('tm-status').value;
  const recur=taskModalRecur;
  if(taskModalEditId!==null&&taskModalEditId!==undefined){
    let t=d.tasks.work.find(x=>x.id===taskModalEditId)||d.tasks.personal.find(x=>x.id===taskModalEditId);
    if(t){
      const origWS=d.tasks.work.find(x=>x.id===taskModalEditId)?'work':'personal';
      if(origWS!==ws){d.tasks[origWS]=d.tasks[origWS].filter(x=>x.id!==t.id);d.tasks[ws].push(t)}
      Object.assign(t,{title,priority,dueDate,status,recur,bullets:taskModalBullets.map(b=>({...b}))});
    }
  } else {
    d.tasks[ws].push({id:nextId++,title,priority,dueDate,status,recur,bullets:taskModalBullets.map(b=>({...b})),ws});
  }
  if(status==='completed')logCompletionDate(d);
  saveState();closeTaskModal();renderAll();
  if(currentPage==='weekly')renderWeeklyGrid();
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeTaskModal();closeGoalModal();closeWPO()}
  if(e.key==='Enter'&&document.getElementById('task-modal-ov').classList.contains('open')){
    if(document.activeElement&&document.activeElement.id==='tm-bi'){addBullet();return}
    if(document.activeElement&&document.activeElement.tagName!=='SELECT'&&document.activeElement.tagName!=='TEXTAREA')saveTask();
  }
});

// ═══════ WEEK PICKER ═══════
function updateWeekPill(){
  if(!selWeekMon)return;
  const fri=new Date(selWeekMon);fri.setDate(selWeekMon.getDate()+4);
  const wn=weekNum(selWeekMon);
  document.getElementById('wc-num').textContent='Týden '+wn;
  document.getElementById('wc-range').textContent=fshort(selWeekMon)+' – '+fshort(fri);
}
function openWPO(){const r=selWeekMon||new Date();wpoY=r.getFullYear();wpoM=r.getMonth();renderWPOGrid();document.getElementById('wpo-overlay').classList.add('open')}
function closeWPO(){document.getElementById('wpo-overlay').classList.remove('open')}
function closeWPOOut(e){if(e.target===document.getElementById('wpo-overlay'))closeWPO()}
function wpoNav(d){wpoM+=d;if(wpoM>11){wpoM=0;wpoY++}if(wpoM<0){wpoM=11;wpoY--}renderWPOGrid()}
function renderWPOGrid(){
  document.getElementById('wpo-mlabel').textContent=MONTHS_FULL[wpoM]+' '+wpoY;
  const g=document.getElementById('wpo-grid');g.innerHTML='';
  ['Po','Út','St','Čt','Pá','So','Ne'].forEach(dl=>{const e=document.createElement('div');e.className='wpo-dow';e.textContent=dl;g.appendChild(e)});
  const fd=new Date(wpoY,wpoM,1),sd=(fd.getDay()+6)%7,dim=new Date(wpoY,wpoM+1,0).getDate(),pd=new Date(wpoY,wpoM,0).getDate();
  const tod=new Date();tod.setHours(0,0,0,0);
  for(let i=sd-1;i>=0;i--)g.appendChild(wpoDayEl(new Date(wpoY,wpoM-1,pd-i),true));
  for(let i=1;i<=dim;i++)g.appendChild(wpoDayEl(new Date(wpoY,wpoM,i),false));
  const rem=(7-(sd+dim)%7)%7;
  for(let i=1;i<=rem;i++)g.appendChild(wpoDayEl(new Date(wpoY,wpoM+1,i),true));
}
function wpoDayEl(d,other){
  const e=document.createElement('div');e.className='wpo-d'+(other?' other-m':'');e.textContent=d.getDate();
  const tod=new Date();tod.setHours(0,0,0,0);
  if(d.getTime()===tod.getTime())e.classList.add('is-tod');
  if(selWeekMon){const sun=new Date(selWeekMon);sun.setDate(selWeekMon.getDate()+6);if(d>=selWeekMon&&d<=sun){e.classList.add('in-wk');if(d.getTime()===selWeekMon.getTime())e.classList.add('wk-start');if(d.getTime()===sun.getTime())e.classList.add('wk-end')}}
  e.addEventListener('click',()=>{const dow=(d.getDay()+6)%7,m=new Date(d);m.setDate(d.getDate()-dow);m.setHours(0,0,0,0);selWeekMon=m;updateWeekPill();renderWPOGrid();closeWPO();if(currentPage==='weekly'){renderWeeklyGrid();renderSportGrid()}});
  return e;
}

// ═══════ WEEKLY PLANNER ═══════
function setWPWS(ws,el){currentWPWS=ws;document.querySelectorAll('.wp-wst').forEach(e=>e.classList.remove('active'));el.classList.add('active');renderWeeklyGrid()}
function renderWeeklyGrid(){
  const c=document.getElementById('weekly-grid');if(!c)return;
  const d=getPD();if(!d)return;
  if(!selWeekMon){c.innerHTML='<div style="color:var(--text3);font-size:12px;font-family:Fira Code,monospace;grid-column:1/-1">← Vyberte týden pomocí výběru výše</div>';return}
  const now=new Date();now.setHours(0,0,0,0);c.innerHTML='';
  const fri=new Date(selWeekMon);fri.setDate(selWeekMon.getDate()+4);
  const wsList=currentWPWS==='both'?['work','personal']:[currentWPWS];
  for(let i=0;i<5;i++){
    const dt=new Date(selWeekMon);dt.setDate(selWeekMon.getDate()+i);
    const isTod=dt.getTime()===now.getTime(),dstr=dsDate(dt);
    const col=document.createElement('div');col.className='wk-col'+(isTod?' today-col':'');
    let tHTML='';
    // day stats (tasks + activities)
    const tasksForDay=[];
    wsList.forEach(ws=>{
      d.tasks[ws].forEach(t=>{
        const isDue=t.dueDate===dstr;
        const isRecur=t.recur&&t.recur!=='none'&&isRecurToday(t,dstr)&&t.dueDate!==dstr;
        if(isDue||isRecur)tasksForDay.push(t);
      });
    });
    const uniqueTasks=Object.values(tasksForDay.reduce((acc,t)=>{acc[t.id]=t;return acc},{}));
    const tasksTotal=uniqueTasks.length;
    const tasksDone=uniqueTasks.filter(t=>t.status==='completed').length;
    const acts=getActivitiesForDate(d,dstr);
    const actsTotal=acts.length;
    const actsDone=acts.filter(a=>d.activityLog[dstr+'_'+a.id]).length;
    const totalAll=tasksTotal+actsTotal;
    const doneAll=tasksDone+actsDone;
    const pctAll=totalAll?Math.round((doneAll/totalAll)*100):0;
    const statsHTML=`<div class="wk-day-stat"><div class="wk-ds-left"><div class="wk-ds-line">Úkoly: <b>${tasksDone}/${tasksTotal}</b></div><div class="wk-ds-line">Aktivity: <b>${actsDone}/${actsTotal}</b></div></div><div class="wk-ds-pie"><svg class="wk-ds-svg" viewBox="0 0 100 100"></svg><div class="wk-ds-pct">${pctAll}%</div></div></div>`;
    wsList.forEach(ws=>{
      d.tasks[ws].filter(t=>t.dueDate===dstr&&t.status!=='completed').forEach(t=>{
        tHTML+=`<div class="wk-task p-${t.priority}" onclick="openTaskModal('${ws}',${t.id})"><div class="wk-task-title">${t.title}</div><div style="display:flex;align-items:center;gap:5px;padding-left:5px"><span class="pbadge p-${t.priority}">${t.priority==='high'?'Vysoká':t.priority==='medium'?'Střední':'Nízká'}</span>${currentWPWS==='both'?`<span style="font-size:9px;font-family:Fira Code,monospace;color:var(--text3)">${ws==='work'?'Práce':'Osobní'}</span>`:''}</div></div>`;
      });
      d.tasks[ws].filter(t=>t.recur&&t.recur!=='none'&&isRecurToday(t,dstr)&&t.status!=='completed'&&t.dueDate!==dstr).forEach(t=>{
        tHTML+=`<div class="wk-task p-${t.priority}" onclick="openTaskModal('${ws}',${t.id})"><div class="wk-task-title">${t.title}</div><div style="padding-left:5px"><span class="tti-recur">🔁</span></div></div>`;
      });
    });
    // activities list
    acts.forEach(a=>{
      const key=dstr+'_'+a.id;
      const isDone=d.activityLog[key]||false;
      const time=a.time?`<span class="wk-act-time">${a.time}</span>`:'';
      const recur=a.recur&&a.recur!=='none'?'<span class="wk-act-recur">🔁</span>':'';
      tHTML+=`<div class="wk-activity" data-key="${key}" onclick="openActivityModal(${a.id})"><span class="wk-act-icon">${a.icon}</span><span class="wk-act-name">${a.name}</span>${time}${recur}<div class="wk-act-toggle ${isDone?'done':''}" onclick="toggleActivityDone('${key}', event)"></div></div>`;
    });
    if(!tHTML)tHTML='<div class="wk-empty">—</div>';
    col.innerHTML=`${statsHTML}<div class="wk-col-head"><div class="wk-dayname">${DAYS_S[i]}</div><div class="wk-datenum">${pad(dt.getDate())}</div><div class="wk-mon">${MONTHS_S[dt.getMonth()]}</div></div><div class="wk-col-body">${tHTML}</div>`;
    const pie=col.querySelector('.wk-ds-svg');if(pie)renderPieIn(pie,pctAll,'var(--accent)');
    c.appendChild(col);
  }
}
function toggleActivityDone(key,e){
  if(e&&e.stopPropagation)e.stopPropagation();
  const d=getPD();if(!d)return;
  d.activityLog[key]=!d.activityLog[key];saveState();
  if(currentPage==='weekly')renderWeeklyGrid();
}

function deleteActivityById(id){
  const d=getPD();if(!d)return;
  showConfirm('Smazat aktivitu','Trvale smazat tuto aktivitu?',()=>{
    d.activities = (d.activities||[]).filter(a=>a.id!==id);
    Object.keys(d.activityLog||{}).forEach(k=>{ if(k.endsWith('_'+id)) delete d.activityLog[k]; });
    saveState();
    renderAll();
  });
}

// ═══════ SPORT TRACKER ═══════
function renderSportFilters(){
  const container=document.getElementById('sport-filters');if(!container)return;
  container.innerHTML='';
  const btn=document.createElement('button');btn.type='button';btn.className='sport-add-btn';btn.innerHTML='<span class="sport-plus">+</span> Vyber aktivitu';
  const drop=document.createElement('div');drop.className='sport-add-dropdown';drop.id='sport-add-dropdown';drop.style.display='none';
  const available=SPORTS.filter(s=>!selectedSportIds.includes(s.id));
  available.forEach(s=>{
    const b=document.createElement('button');b.type='button';b.textContent=s.icon+' '+s.name;
    b.onclick=()=>{selectedSportIds.push(s.id);drop.style.display='none';renderSportFilters();renderSportGrid()};
    drop.appendChild(b);
  });
  if(!available.length)drop.innerHTML='<div style="padding:10px 12px;font-size:11px;color:var(--text3)">Všechny aktivity přidány</div>';
  btn.onclick=(e)=>{e.stopPropagation();const open=drop.style.display==='block';drop.style.display=open?'none':'block';if(!open)setTimeout(()=>{document.addEventListener('click',function closeSportDrop(ev){if(!container.contains(ev.target)){drop.style.display='none';document.removeEventListener('click',closeSportDrop)}})},0)};
  container.appendChild(btn);container.appendChild(drop);
}
function removeSelectedSport(id){
  selectedSportIds=selectedSportIds.filter(x=>x!==id);renderSportFilters();renderSportGrid();
}
function renderSportGrid(){
  const d=getPD();if(!d)return;
  const g=document.getElementById('sport-grid');g.innerHTML='';
  if(!selWeekMon)return;
  const visibleSports=SPORTS.filter(s=>selectedSportIds.includes(s.id));
  g.style.gridTemplateColumns='140px repeat(5,1fr)';
  const empty=document.createElement('div');g.appendChild(empty);
  for(let i=0;i<5;i++){
    const dt=new Date(selWeekMon);dt.setDate(selWeekMon.getDate()+i);
    const lbl=document.createElement('div');lbl.className='sport-col-head';lbl.textContent=DAYS_S[i];g.appendChild(lbl);
  }
  visibleSports.forEach(sport=>{
    const nameWrap=document.createElement('div');nameWrap.className='sport-act-name';
    nameWrap.innerHTML=`<span class="sport-act-icon">${sport.icon}</span><span>${sport.name}</span>`;
    const rm=document.createElement('button');rm.type='button';rm.className='sport-remove-act';rm.title='Odebrat aktivitu';rm.textContent='×';rm.onclick=()=>removeSelectedSport(sport.id);
    nameWrap.appendChild(rm);g.appendChild(nameWrap);
    for(let i=0;i<5;i++){
      const dt=new Date(selWeekMon);dt.setDate(selWeekMon.getDate()+i);
      const key=dsDate(dt)+'_'+sport.id;
      const isDone=d.sportLog[key]||false;
      const btn=document.createElement('div');btn.className='sport-toggle'+(isDone?' done':'');
      btn.onclick=()=>{d.sportLog[key]=!d.sportLog[key];saveState();renderSportGrid()};g.appendChild(btn);
    }
  });
}

// ═══════ WEEKLY GOALS ═══════
function getGoalWeekMon(){const base=getMon(new Date());const m=new Date(base);m.setDate(base.getDate()+currentGoalWeekOffset*7);return m}
function shiftGoalWeek(dir){currentGoalWeekOffset+=dir;renderGoalsPage()}
function renderGoalsPage(){
  const d=getPD();if(!d)return;
  const mon=getGoalWeekMon();const fri=new Date(mon);fri.setDate(mon.getDate()+4);
  const wk=weekKey(mon);const wn=weekNum(mon);
  document.getElementById('wg-week-label').textContent='Týden '+wn;
  document.getElementById('goals-week-sub').textContent='Týden '+wn+' · '+fshort(mon)+' – '+fshort(fri);
  if(!d.weeklyGoals[wk])d.weeklyGoals[wk]=[];
  const goals=d.weeklyGoals[wk];
  const grid=document.getElementById('goals-grid');grid.innerHTML='';
  goals.forEach((g,gi)=>{
    const card=document.createElement('div');card.className='goal-card';
    // calc progress
    let pct=0,progressDetail='';
    if(g.type==='habit'){
      const days=g.days||[false,false,false,false,false,false,false];
      const checked=days.filter(Boolean).length;
      pct=Math.round((checked/7)*100);
      progressDetail=`${checked}/7 dní`;
    } else {
      const entries=g.entries||[0,0,0,0,0,0,0];
      const sum=entries.reduce((a,b)=>a+b,0);
      const target=g.target||1;
      pct=Math.min(100,Math.round((sum/target)*100));
      progressDetail=`${sum} / ${target} ${g.unit||''}`;
    }
    const fillColor=pct<33?'var(--red)':pct<66?'var(--amber)':'var(--green)';
    const typeLabel=g.type==='habit'?'Návyk':'Výzva';
    const typeCls=g.type==='habit'?'gc-type-habit':'gc-type-numeric';
    // day labels
    const dayLbls=['Po','Út','St','Čt','Pá','So','Ne'];
    let daysHTML='';
    if(g.type==='habit'){
      const days=g.days||[false,false,false,false,false,false,false];
      daysHTML=`<div class="gc-days">`;
      days.forEach((checked,di)=>{
        daysHTML+=`<div class="gc-day-col"><div class="gc-day-lbl">${dayLbls[di]}</div><div class="gc-day-cb ${checked?'checked':''}" onclick="toggleGoalDay('${wk}',${gi},${di})"></div></div>`;
      });
      daysHTML+=`</div>`;
    } else {
      const entries=g.entries||[0,0,0,0,0,0,0];
      daysHTML=`<div class="gc-numeric-grid">`;
      entries.forEach((val,di)=>{
        daysHTML+=`<div class="gc-num-col"><div class="gc-num-lbl">${dayLbls[di]}</div><input type="number" class="gc-num-inp" value="${val||''}" placeholder="0" min="0" oninput="updateGoalEntry('${wk}',${gi},${di},this.value)"></div>`;
      });
      daysHTML+=`</div>`;
    }
    card.innerHTML=`
      <div class="gc-head">
        <div class="gc-title">${g.title}</div>
        <span class="gc-type-badge ${typeCls}">${typeLabel}</span>
        <button class="gc-del" onclick="deleteGoal('${wk}',${gi})">✕</button>
      </div>
      <div class="gc-progress-wrap">
        <div class="gc-progress-row">
          <div class="gc-track"><div class="gc-fill" style="width:${pct}%;background:${fillColor}"></div></div>
          <div class="gc-pct-label" style="color:${fillColor}">${pct}%</div>
        </div>
        <div class="gc-stats-row">
          <div class="gc-stat"><div class="gc-stat-val" style="font-size:13px">${progressDetail}</div><div class="gc-stat-lbl">Pokrok</div></div>
        </div>
      </div>
      ${daysHTML}
    `;
    grid.appendChild(card);
  });
  // add goal card
  const add=document.createElement('div');add.className='add-goal-card';add.onclick=openGoalModal;
  add.innerHTML=`<div class="add-goal-icon">🎯</div><div class="add-goal-label">Přidat týdenní cíl</div>`;
  grid.appendChild(add);
}
function toggleGoalDay(wk,gi,di){
  const d=getPD();if(!d)return;
  if(!d.weeklyGoals[wk]||!d.weeklyGoals[wk][gi])return;
  const g=d.weeklyGoals[wk][gi];
  if(!g.days)g.days=[false,false,false,false,false,false,false];
  g.days[di]=!g.days[di];saveState();renderGoalsPage();
}
function updateGoalEntry(wk,gi,di,val){
  const d=getPD();if(!d)return;
  if(!d.weeklyGoals[wk]||!d.weeklyGoals[wk][gi])return;
  const g=d.weeklyGoals[wk][gi];
  if(!g.entries)g.entries=[0,0,0,0,0,0,0];
  g.entries[di]=parseFloat(val)||0;saveState();
  // update progress live without full re-render
  const entries=g.entries;const sum=entries.reduce((a,b)=>a+b,0);
  const target=g.target||1;const pct=Math.min(100,Math.round((sum/target)*100));
  const fillColor=pct<33?'var(--red)':pct<66?'var(--amber)':'var(--green)';
  const cards=document.querySelectorAll('#goals-grid .goal-card');
  if(cards[gi]){
    const fill=cards[gi].querySelector('.gc-fill');if(fill){fill.style.width=pct+'%';fill.style.background=fillColor}
    const pctLbl=cards[gi].querySelector('.gc-pct-label');if(pctLbl){pctLbl.textContent=pct+'%';pctLbl.style.color=fillColor}
    const statVals=cards[gi].querySelectorAll('.gc-stat-val');
    if(statVals[0])statVals[0].textContent=pct+'%';
    if(statVals[1])statVals[1].textContent=`${sum} / ${target} ${g.unit||''}`;
  }
}
function deleteGoal(wk,gi){
  const d=getPD();if(!d)return;
  if(!d.weeklyGoals[wk])return;
  d.weeklyGoals[wk].splice(gi,1);saveState();renderGoalsPage();
}

// GOAL MODAL
function openGoalModal(){goalModalType='habit';selGoalType('habit');document.getElementById('gm-title').value='';document.getElementById('gm-target').value='';document.getElementById('gm-unit').value='';document.getElementById('goal-modal-ov').classList.add('open');setTimeout(()=>document.getElementById('gm-title').focus(),80)}
function closeGoalModal(){document.getElementById('goal-modal-ov').classList.remove('open')}
function closeGoalModalOut(e){if(e.target===document.getElementById('goal-modal-ov'))closeGoalModal()}
function selGoalType(type){
  goalModalType=type;
  document.getElementById('gto-habit').classList.toggle('sel',type==='habit');
  document.getElementById('gto-numeric').classList.toggle('sel',type==='numeric');
  document.getElementById('gm-target-field').style.display=type==='numeric'?'block':'none';
  document.getElementById('gm-unit-field').style.display=type==='numeric'?'block':'none';
}
function saveGoal(){
  const title=document.getElementById('gm-title').value.trim();if(!title)return;
  const d=getPD();if(!d)return;
  const wk=weekKey(getGoalWeekMon());
  if(!d.weeklyGoals[wk])d.weeklyGoals[wk]=[];
  const goal={title,type:goalModalType};
  if(goalModalType==='habit'){goal.days=[false,false,false,false,false,false,false]}
  else{goal.target=parseFloat(document.getElementById('gm-target').value)||100;goal.unit=document.getElementById('gm-unit').value.trim();goal.entries=[0,0,0,0,0,0,0]}
  d.weeklyGoals[wk].push(goal);saveState();closeGoalModal();renderGoalsPage();
}

// ═══════ STATISTICS (Týdenní plnění) ═══════
function renderPieIn(el,pct,color){
  if(!el)return;
  el.innerHTML='';
  const r=42;const cx=50;const cy=50;const circumference=2*Math.PI*r;
  const dashLen=(Math.min(100,Math.max(0,pct))/100)*circumference;
  const bg=document.createElementNS('http://www.w3.org/2000/svg','circle');
  bg.setAttribute('cx',cx);bg.setAttribute('cy',cy);bg.setAttribute('r',r);
  bg.setAttribute('fill','none');bg.setAttribute('stroke','var(--surface3)');bg.setAttribute('stroke-width',8);
  el.appendChild(bg);
  if(pct>0){
    const arc=document.createElementNS('http://www.w3.org/2000/svg','circle');
    arc.setAttribute('cx',cx);arc.setAttribute('cy',cy);arc.setAttribute('r',r);
    arc.setAttribute('fill','none');arc.setAttribute('stroke',color||'var(--green)');arc.setAttribute('stroke-width',8);
    arc.setAttribute('stroke-dasharray',dashLen+' '+circumference);arc.setAttribute('stroke-linecap','round');
    arc.setAttribute('transform','rotate(-90 '+cx+' '+cy+')');
    el.appendChild(arc);
  }
}
function getWeekMonFromKey(wk){
  const parts=wk.split('-W');if(parts.length!==2)return null;
  const jan4=new Date(parseInt(parts[0],10),0,4);
  const firstMon=new Date(jan4);firstMon.setDate(jan4.getDate()-(jan4.getDay()||7)+1);
  const wn=parseInt(parts[1],10);const mon=new Date(firstMon);mon.setDate(firstMon.getDate()+(wn-1)*7);
  return mon;
}
function goalWeekPct(d,wk){
  const goals=d.weeklyGoals[wk];if(!goals||!goals.length)return { pct:0, completed:0, total:0 };
  let sumPct=0,completed=0;
  goals.forEach(g=>{
    let pct=0;
    if(g.type==='habit'){const days=g.days||[];pct=Math.round((days.filter(Boolean).length/7)*100)}
    else{const entries=g.entries||[];const s=entries.reduce((a,b)=>a+b,0);pct=Math.min(100,Math.round((s/(g.target||1))*100))}
    sumPct+=pct;if(pct>=100)completed++;
  });
  return { pct:Math.round(sumPct/goals.length), completed, total:goals.length };
}

let evalMetric='tasks';
function setEvalMetric(m){
  evalMetric=m;
  ['tasks','activities','challenges'].forEach(x=>{
    const b=document.getElementById('ev-tbtn-'+x);if(b)b.classList.toggle('active',x===m);
  });
  renderStats();
}

function renderStats(){
  const d=getPD();if(!d)return;
  const all=[...d.tasks.work,...d.tasks.personal];
  if(!d.activities)d.activities=[];
  if(!d.activityLog)d.activityLog={};

  const setTxt=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};

  // ÚKOLY
  const tCreated=all.length;
  const tCompleted=all.filter(t=>t.status==='completed').length;
  const tPct=tCreated?Math.round((tCompleted/tCreated)*100):0;
  const tPerfect=countPerfectDaysTasks(all,366);
  setTxt('sum-t-created',tCreated);
  setTxt('sum-t-completed',tCompleted);
  setTxt('sum-t-perfect',tPerfect);
  setTxt('sum-t-pct',tPct+'%');
  setTxt('sum-t-sub',tCreated?`${tCompleted} / ${tCreated}`:'—');
  const tPie=document.getElementById('sum-t-pie');if(tPie)renderPieIn(tPie,tPct,'var(--accent)');

  // AKTIVITY
  const aCreated=d.activities.length;
  const aCompleted=Object.entries(d.activityLog).filter(([,v])=>v===true).length;
  const aPct=aCreated?Math.round((aCompleted/aCreated)*100):0;
  const aPerfect=countPerfectDaysActivities(d,366);
  setTxt('sum-a-created',aCreated);
  setTxt('sum-a-completed',aCompleted);
  setTxt('sum-a-perfect',aPerfect);
  setTxt('sum-a-pct',aPct+'%');
  setTxt('sum-a-sub',aCreated?`${aCompleted} / ${aCreated}`:'—');
  const aPie=document.getElementById('sum-a-pie');if(aPie)renderPieIn(aPie,aPct,'var(--accent)');

  // VÝZVY (týdny)
  let gCreated=0,gCompleted=0,gPerfect=0;
  Object.entries(d.weeklyGoals||{}).forEach(([wk,goals])=>{
    if(!goals||!goals.length)return;
    gCreated+=goals.length;
    let wkDone=0;
    goals.forEach(g=>{
      let pct=0;
      if(g.type==='habit'){const days=g.days||[];pct=Math.round((days.filter(Boolean).length/7)*100)}
      else{const entries=g.entries||[];const s=entries.reduce((a,b)=>a+b,0);pct=Math.min(100,Math.round((s/(g.target||1))*100))}
      if(pct>=100) wkDone++;
    });
    gCompleted+=wkDone;
    if(wkDone===goals.length) gPerfect++;
  });
  const gPct=gCreated?Math.round((gCompleted/gCreated)*100):0;
  setTxt('sum-g-created',gCreated);
  setTxt('sum-g-completed',gCompleted);
  setTxt('sum-g-perfect',gPerfect);
  setTxt('sum-g-pct',gPct+'%');
  setTxt('sum-g-sub',gCreated?`${gCompleted} / ${gCreated}`:'—');
  const gPie=document.getElementById('sum-g-pie');if(gPie)renderPieIn(gPie,gPct,'var(--accent)');

  const c1=document.getElementById('sum-daily-chart');if(c1)drawDailyTasksChart(c1,all);
  const c2=document.getElementById('sum-acts-chart');if(c2)drawDailyActivitiesChart(c2,d);
  const c3=document.getElementById('sum-goals-chart');if(c3)drawWeeklyChallengesChart(c3,d);
}

function drawEvalChart(canvas,d,all){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const w=canvas.width=canvas.clientWidth||600;
  const h=canvas.height=160;
  ctx.clearRect(0,0,w,h);
  const endMon=getMon(new Date());
  const weeks=[];
  for(let i=11;i>=0;i--){const mon=new Date(endMon);mon.setDate(endMon.getDate()-i*7);weeks.push(mon);}
  const series=weeks.map(mon=>{
    const wk=weekKey(mon);
    let planned=0,done=0;
    if(evalMetric==='tasks'){
      const inW=all.filter(t=>t.dueDate&&weekKey(new Date(t.dueDate+'T00:00:00'))===wk);
      planned=inW.length;
      done=inW.filter(t=>t.status==='completed').length;
    } else if(evalMetric==='activities'){
      for(let i=0;i<7;i++){const dt=new Date(mon);dt.setDate(mon.getDate()+i);const ds=dsDate(dt);planned+=getActivitiesForDate(d,ds).length;done+=Object.entries(d.activityLog||{}).filter(([k,v])=>v===true && k.startsWith(ds+'_')).length;}
    } else {
      const r=goalWeekPct(d,wk);planned=r.total;done=r.completed;
    }
    return { planned, done, label:'W'+weekNum(mon) };
  });
  const max=Math.max(1,...series.map(s=>Math.max(s.planned,s.done)));
  // grid lines
  ctx.strokeStyle='rgba(154,160,188,.35)';ctx.lineWidth=1;
  for(let i=0;i<=3;i++){const y=20+i*((h-40)/3);ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(w-10,y);ctx.stroke();}
  // area for done
  const x0=40,x1=w-10;
  const step=(x1-x0)/(series.length-1);
  ctx.beginPath();
  series.forEach((s,idx)=>{
    const x=x0+idx*step;
    const y=20+(h-40)*(1-(s.done/max));
    if(idx===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle='rgba(79,70,229,.95)';ctx.lineWidth=2;ctx.stroke();
  // planned overlay (optional)
  ctx.beginPath();
  series.forEach((s,idx)=>{
    const x=x0+idx*step;
    const y=20+(h-40)*(1-(s.planned/max));
    if(idx===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle='rgba(154,160,188,.9)';ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
  // x labels
  ctx.fillStyle='rgba(154,160,188,.95)';ctx.font="10px 'Fira Code', monospace";
  series.forEach((s,idx)=>{if(idx%2===0){const x=x0+idx*step;ctx.fillText(s.label,x-10,h-10);}});
  const legend=document.getElementById('ev-chart-legend');
  if(legend) legend.textContent=`Done (solid) vs Planned (dashed) — last 12 weeks`;
}

function renderEvalWeekGrid(grid,d,all){
  grid.innerHTML='';
  const weekKeys=new Set();
  all.forEach(t=>{if(t.dueDate)weekKeys.add(weekKey(new Date(t.dueDate+'T00:00:00')));});
  Object.keys(d.weeklyGoals||{}).forEach(wk=>{if(d.weeklyGoals[wk]&&d.weeklyGoals[wk].length)weekKeys.add(wk);});
  d.activities.forEach(a=>{if(a.date)weekKeys.add(weekKey(new Date(a.date+'T00:00:00')));});
  const sorted=Array.from(weekKeys).sort();
  sorted.forEach(wk=>{
    const mon=getWeekMonFromKey(wk);if(!mon)return;
    const fri=new Date(mon);fri.setDate(mon.getDate()+4);
    const tPl=all.filter(t=>t.dueDate&&weekKey(new Date(t.dueDate+'T00:00:00'))===wk).length;
    const tDn=all.filter(t=>t.dueDate&&weekKey(new Date(t.dueDate+'T00:00:00'))===wk && t.status==='completed').length;
    let aPl=0,aDn=0;
    for(let i=0;i<7;i++){const dt=new Date(mon);dt.setDate(mon.getDate()+i);const ds=dsDate(dt);aPl+=getActivitiesForDate(d,ds).length;aDn+=Object.entries(d.activityLog||{}).filter(([k,v])=>v===true && k.startsWith(ds+'_')).length;}
    const g=goalWeekPct(d,wk);
    const tot=tPl+aPl+g.total,don=tDn+aDn+g.completed;
    const pct=tot?Math.round((don/tot)*100):0;
    const cls=pct>=75?'strong':pct>=45?'avg':'weak';
    const card=document.createElement('div');card.className='ev-week-card '+cls;
    card.innerHTML=`<div class="ev-week-top"><div><div class="ev-week-range">${fshort(mon)} – ${fshort(fri)}</div></div><div class="ev-week-pct">${pct}%</div></div><div class="ev-week-mid"><div class="ev-week-lines"><div class="ev-week-line">Tasks: ${tDn}/${tPl}</div><div class="ev-week-line">Activities: ${aDn}/${aPl}</div><div class="ev-week-line">Challenges: ${g.completed}/${g.total}</div></div><div class="ev-week-pie"><svg viewBox="0 0 100 100"></svg><span>${pct}%</span></div></div>`;
    const pie=card.querySelector('svg');if(pie)renderPieIn(pie,pct,'var(--accent)');
    grid.appendChild(card);
  });
}

function drawDailyTasksChart(canvas,all){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const DPR=window.devicePixelRatio||1;
  const w=canvas.width=Math.floor(canvas.clientWidth*DPR);
  const h=canvas.height=Math.floor((parseInt(canvas.getAttribute('height')||'180',10))*DPR);
  ctx.clearRect(0,0,w,h);

  const days=14;
  const labels=[],created=[],completed=[],rates=[];
  for(let i=days-1;i>=0;i--){
    const dt=new Date();dt.setDate(dt.getDate()-i);
    const ds=dsDate(dt);
    labels.push(pad(dt.getDate())+'.'+pad(dt.getMonth()+1)+'.');
    const planned=all.filter(t=>isRecurToday(t,ds));
    const c=planned.length;
    const dn=planned.filter(t=>t.status==='completed').length;
    created.push(c);
    completed.push(dn);
    rates.push(c?Math.round((dn/c)*100):0);
  }

  const padX=26*DPR,padY=22*DPR;
  const chartW=w-padX*2,chartH=h-padY*2;
  const maxBar=Math.max(1,...created,...completed);

  const xStep=chartW/days;
  const barW=Math.max(6*DPR,Math.min(16*DPR,xStep*0.28));
  const gap=barW*0.35;

  const yBar=(v)=>padY+(1-(v/maxBar))*chartH;
  const yLine=(p)=>padY+(1-(p/100))*chartH;

  ctx.strokeStyle='rgba(15,16,34,.08)';
  ctx.lineWidth=1*DPR;
  for(let i=0;i<=4;i++){
    const yy=padY+(chartH*(i/4));
    ctx.beginPath();ctx.moveTo(padX,yy);ctx.lineTo(w-padX,yy);ctx.stroke();
  }

  for(let i=0;i<days;i++){
    const cx=padX+xStep*i+xStep/2;
    const y0=padY+chartH;
    const yC=yBar(created[i]);
    const yD=yBar(completed[i]);
    ctx.fillStyle='rgba(79,70,229,.28)';
    ctx.fillRect(cx-(barW+gap/2),yC,barW,y0-yC);
    ctx.fillStyle='rgba(16,185,129,.55)';
    ctx.fillRect(cx+(gap/2),yD,barW,y0-yD);
  }

  ctx.strokeStyle='rgba(245,158,11,.95)';
  ctx.lineWidth=2*DPR;
  let started=false;
  ctx.beginPath();
  for(let i=0;i<days;i++){
    if(created[i]===0){started=false;continue;}
    const cx=padX+xStep*i+xStep/2;
    const yy=yLine(rates[i]);
    if(!started){ctx.moveTo(cx,yy);started=true;} else ctx.lineTo(cx,yy);
  }
  ctx.stroke();

  for(let i=0;i<days;i++){
    if(created[i]===0) continue;
    const cx=padX+xStep*i+xStep/2;
    const yy=yLine(rates[i]);
    ctx.beginPath();ctx.arc(cx,yy,3.2*DPR,0,Math.PI*2);
    ctx.fillStyle='#fff';ctx.fill();
    ctx.strokeStyle='rgba(245,158,11,.95)';
    ctx.lineWidth=2*DPR;
    ctx.stroke();
  }

  ctx.fillStyle='rgba(15,16,34,.55)';
  ctx.font=`${10*DPR}px "Fira Code", monospace`;
  for(let i=0;i<days;i++){
    if(i%2!==0)continue;
    const cx=padX+xStep*i+xStep/2;
    ctx.fillText(labels[i],cx-12*DPR,h-6*DPR);
  }

  const legend=document.getElementById('sum-daily-legend');
  if(legend){
    legend.innerHTML=`<span style="color:rgba(79,70,229,.9);font-weight:800">■</span> Vytvořeno úkolů &nbsp; <span style="color:rgba(16,185,129,.9);font-weight:800">■</span> Splněno úkolů &nbsp; <span style="color:rgba(245,158,11,.95);font-weight:800">●</span> Plnění (%)`;
  }
}

function countPerfectDaysTasks(all,backDays){
  let cnt=0;
  const now=new Date();
  for(let i=0;i<backDays;i++){
    const dt=new Date(now);dt.setDate(now.getDate()-i);
    const ds=dsDate(dt);
    const planned=all.filter(t=>isRecurToday(t,ds));
    if(!planned.length) continue;
    const dn=planned.filter(t=>t.status==='completed').length;
    if(dn===planned.length) cnt++;
  }
  return cnt;
}

function countPerfectDaysActivities(d,backDays){
  let cnt=0;
  const now=new Date();
  for(let i=0;i<backDays;i++){
    const dt=new Date(now);dt.setDate(now.getDate()-i);
    const ds=dsDate(dt);
    const planned=getActivitiesForDate(d,ds);
    if(!planned.length) continue;
    let dn=0;
    planned.forEach(a=>{const key=ds+'_'+a.sportId;if(d.activityLog[key]===true)dn++;});
    if(dn===planned.length) cnt++;
  }
  return cnt;
}

function drawDailyActivitiesChart(canvas,d){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const DPR=window.devicePixelRatio||1;
  const w=canvas.width=Math.floor(canvas.clientWidth*DPR);
  const h=canvas.height=Math.floor((parseInt(canvas.getAttribute('height')||'180',10))*DPR);
  ctx.clearRect(0,0,w,h);

  const days=14;
  const labels=[],created=[],completed=[],rates=[];
  for(let i=days-1;i>=0;i--){
    const dt=new Date();dt.setDate(dt.getDate()-i);
    const ds=dsDate(dt);
    labels.push(pad(dt.getDate())+'.'+pad(dt.getMonth()+1)+'.');
    const planned=getActivitiesForDate(d,ds);
    const c=planned.length;
    let dn=0;planned.forEach(a=>{const key=ds+'_'+a.sportId;if(d.activityLog[key]===true)dn++;});
    created.push(c);completed.push(dn);rates.push(c?Math.round((dn/c)*100):0);
  }

  const padX=26*DPR,padY=22*DPR;
  const chartW=w-padX*2,chartH=h-padY*2;
  const maxBar=Math.max(1,...created,...completed);
  const xStep=chartW/days;
  const barW=Math.max(6*DPR,Math.min(16*DPR,xStep*0.28));
  const gap=barW*0.35;
  const yBar=(v)=>padY+(1-(v/maxBar))*chartH;
  const yLine=(p)=>padY+(1-(p/100))*chartH;

  ctx.strokeStyle='rgba(15,16,34,.08)';ctx.lineWidth=1*DPR;
  for(let i=0;i<=4;i++){const yy=padY+(chartH*(i/4));ctx.beginPath();ctx.moveTo(padX,yy);ctx.lineTo(w-padX,yy);ctx.stroke();}

  for(let i=0;i<days;i++){
    const cx=padX+xStep*i+xStep/2;
    const y0=padY+chartH;
    const yC=yBar(created[i]);
    const yD=yBar(completed[i]);
    ctx.fillStyle='rgba(79,70,229,.28)';
    ctx.fillRect(cx-(barW+gap/2),yC,barW,y0-yC);
    ctx.fillStyle='rgba(16,185,129,.55)';
    ctx.fillRect(cx+(gap/2),yD,barW,y0-yD);
  }

  ctx.strokeStyle='rgba(245,158,11,.95)';ctx.lineWidth=2*DPR;
  let started=false;ctx.beginPath();
  for(let i=0;i<days;i++){
    if(created[i]===0){started=false;continue;}
    const cx=padX+xStep*i+xStep/2;
    const yy=yLine(rates[i]);
    if(!started){ctx.moveTo(cx,yy);started=true;} else ctx.lineTo(cx,yy);
  }
  ctx.stroke();

  for(let i=0;i<days;i++){
    if(created[i]===0) continue;
    const cx=padX+xStep*i+xStep/2;
    const yy=yLine(rates[i]);
    ctx.beginPath();ctx.arc(cx,yy,3.2*DPR,0,Math.PI*2);
    ctx.fillStyle='#fff';ctx.fill();
    ctx.strokeStyle='rgba(245,158,11,.95)';ctx.lineWidth=2*DPR;ctx.stroke();
  }

  ctx.fillStyle='rgba(15,16,34,.55)';
  ctx.font=`${10*DPR}px "Fira Code", monospace`;
  for(let i=0;i<days;i++){if(i%2!==0)continue;const cx=padX+xStep*i+xStep/2;ctx.fillText(labels[i],cx-12*DPR,h-6*DPR);}

  const legend=document.getElementById('sum-acts-legend');
  if(legend){
    legend.innerHTML=`<span style="color:rgba(79,70,229,.9);font-weight:800">■</span> Vytvořeno aktivit &nbsp; <span style="color:rgba(16,185,129,.9);font-weight:800">■</span> Splněno aktivit &nbsp; <span style="color:rgba(245,158,11,.95);font-weight:800">●</span> Plnění (%)`;
  }
}

function drawWeeklyChallengesChart(canvas,d){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const DPR=window.devicePixelRatio||1;
  const w=canvas.width=Math.floor(canvas.clientWidth*DPR);
  const h=canvas.height=Math.floor((parseInt(canvas.getAttribute('height')||'180',10))*DPR);
  ctx.clearRect(0,0,w,h);

  const keys=Object.keys(d.weeklyGoals||{}).sort();
  const last=keys.slice(-12);
  const labels=[],created=[],completed=[],rates=[];
  last.forEach(wk=>{
    const mon=getWeekMonFromKey(wk);
    labels.push(mon?('T'+weekNum(mon)):'Týd.');
    const goals=(d.weeklyGoals[wk]||[]);
    const c=goals.length;
    let dn=0;
    goals.forEach(g=>{
      let pct=0;
      if(g.type==='habit'){const days=g.days||[];pct=Math.round((days.filter(Boolean).length/7)*100)}
      else{const entries=g.entries||[];const s=entries.reduce((a,b)=>a+b,0);pct=Math.min(100,Math.round((s/(g.target||1))*100))}
      if(pct>=100) dn++;
    });
    created.push(c);completed.push(dn);rates.push(c?Math.round((dn/c)*100):0);
  });

  const padX=26*DPR,padY=22*DPR;
  const chartW=w-padX*2,chartH=h-padY*2;
  const maxBar=Math.max(1,...created,...completed);
  const n=Math.max(1,labels.length);
  const xStep=chartW/n;
  const barW=Math.max(6*DPR,Math.min(16*DPR,xStep*0.28));
  const gap=barW*0.35;
  const yBar=(v)=>padY+(1-(v/maxBar))*chartH;
  const yLine=(p)=>padY+(1-(p/100))*chartH;

  ctx.strokeStyle='rgba(15,16,34,.08)';ctx.lineWidth=1*DPR;
  for(let i=0;i<=4;i++){const yy=padY+(chartH*(i/4));ctx.beginPath();ctx.moveTo(padX,yy);ctx.lineTo(w-padX,yy);ctx.stroke();}

  for(let i=0;i<n;i++){
    const cx=padX+xStep*i+xStep/2;
    const y0=padY+chartH;
    const yC=yBar(created[i]||0);
    const yD=yBar(completed[i]||0);
    ctx.fillStyle='rgba(79,70,229,.28)';
    ctx.fillRect(cx-(barW+gap/2),yC,barW,y0-yC);
    ctx.fillStyle='rgba(16,185,129,.55)';
    ctx.fillRect(cx+(gap/2),yD,barW,y0-yD);
  }

  ctx.strokeStyle='rgba(245,158,11,.95)';ctx.lineWidth=2*DPR;
  let started=false;ctx.beginPath();
  for(let i=0;i<n;i++){
    if((created[i]||0)===0){started=false;continue;}
    const cx=padX+xStep*i+xStep/2;
    const yy=yLine(rates[i]||0);
    if(!started){ctx.moveTo(cx,yy);started=true;} else ctx.lineTo(cx,yy);
  }
  ctx.stroke();

  for(let i=0;i<n;i++){
    if((created[i]||0)===0) continue;
    const cx=padX+xStep*i+xStep/2;
    const yy=yLine(rates[i]||0);
    ctx.beginPath();ctx.arc(cx,yy,3.2*DPR,0,Math.PI*2);
    ctx.fillStyle='#fff';ctx.fill();
    ctx.strokeStyle='rgba(245,158,11,.95)';ctx.lineWidth=2*DPR;ctx.stroke();
  }

  ctx.fillStyle='rgba(15,16,34,.55)';
  ctx.font=`${10*DPR}px "Fira Code", monospace`;
  for(let i=0;i<n;i++){if(i%2!==0)continue;const cx=padX+xStep*i+xStep/2;ctx.fillText(labels[i],cx-12*DPR,h-6*DPR);}

  const legend=document.getElementById('sum-goals-legend');
  if(legend){
    legend.innerHTML=`<span style="color:rgba(79,70,229,.9);font-weight:800">■</span> Vytvořeno výzev &nbsp; <span style="color:rgba(16,185,129,.9);font-weight:800">■</span> Splněno výzev &nbsp; <span style="color:rgba(245,158,11,.95);font-weight:800">●</span> Plnění (%)`;
  }
}
function renderHeatmap(d){
  const wrap=document.getElementById('heatmap-wrap');if(!wrap)return;wrap.innerHTML='';
  const now=new Date();const startDate=new Date(now);startDate.setDate(now.getDate()-181);
  startDate.setDate(startDate.getDate()-(startDate.getDay()||7)+1);
  const goalPct={};
  Object.entries(d.weeklyGoals||{}).forEach(([wk,goals])=>{
    if(!goals||!goals.length)return;
    let totalPct=0;
    goals.forEach(g=>{
      if(g.type==='habit'){const days=g.days||[];totalPct+=Math.round((days.filter(Boolean).length/7)*100)}
      else{const entries=g.entries||[];const sum=entries.reduce((a,b)=>a+b,0);totalPct+=Math.min(100,Math.round((sum/(g.target||1))*100))}
    });
    const avg=totalPct/goals.length;
    const parts=wk.split('-W');if(parts.length!==2)return;
    const yr=parseInt(parts[0]),wn=parseInt(parts[1]);
    const jan4=new Date(yr,0,4);const weekStart=new Date(jan4);
    weekStart.setDate(jan4.getDate()-(jan4.getDay()||7)+1+(wn-1)*7);
    for(let i=0;i<7;i++){const dt=new Date(weekStart);dt.setDate(weekStart.getDate()+i);goalPct[dsDate(dt)]=avg}
  });
  d.completedDates.forEach(ds=>{if(!goalPct[ds])goalPct[ds]=40});
  const dayLbls=['','Po','','St','','Pá',''];
  const hm=document.createElement('div');hm.className='heatmap';
  for(let dow=0;dow<7;dow++){
    const row=document.createElement('div');row.className='hm-row';
    const lbl=document.createElement('div');lbl.className='hm-label';lbl.textContent=dayLbls[dow];row.appendChild(lbl);
    for(let wk=0;wk<26;wk++){
      const dt=new Date(startDate);dt.setDate(startDate.getDate()+wk*7+dow);
      const pct=goalPct[dsDate(dt)]||0;
      const cell=document.createElement('div');
      cell.className='hm-cell'+(pct>=75?' l4':pct>=50?' l3':pct>=25?' l2':pct>0?' l1':'');
      cell.title=dsDate(dt)+(pct>0?' — '+Math.round(pct)+'%':'');row.appendChild(cell);
    }
    hm.appendChild(row);
  }
  wrap.appendChild(hm);
}

// ═══════ PROJECTS ═══════
function renderProjectsPage(){
  const d=getPD();if(!d)return;
  const list=document.getElementById('proj-list');list.innerHTML='';
  const pids=Object.keys(d.projects);
  if(!pids.length)list.innerHTML='<div style="padding:16px;text-align:center;font-size:11px;color:var(--text3);font-family:Fira Code,monospace">Žádné projekty.<br>Klikněte + pro vytvoření.</div>';
  pids.forEach(pid=>{
    const proj=d.projects[pid];
    const item=document.createElement('div');item.className='proj-list-item'+(currentProjectId===pid?' active':'');
    item.innerHTML=`<span class="proj-list-dot" style="background:${proj.color}"></span><span class="proj-list-name">${proj.name}</span><button class="proj-list-del" onclick="deleteProject(event,'${pid}')">✕</button>`;
    item.onclick=(e)=>{if(e.target.classList.contains('proj-list-del'))return;currentProjectId=pid;renderProjectsPage()};list.appendChild(item);
  });
  renderSidebar();
  const main=document.getElementById('proj-main');
  if(!currentProjectId||!d.projects[currentProjectId]){main.innerHTML='<div class="proj-no-selection">← Vyberte nebo vytvořte projekt</div>';return}
  const proj=d.projects[currentProjectId];
  main.innerHTML='';
  const head=document.createElement('div');head.className='proj-main-head';
  head.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><span style="width:12px;height:12px;border-radius:50%;background:${proj.color};display:inline-block;flex-shrink:0"></span><div class="proj-main-title" contenteditable="true" onblur="renameProject('${currentProjectId}',this.textContent)">${proj.name}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-secondary" onclick="addProjSection('${currentProjectId}','tasks')">+ Úkoly</button><button class="btn-secondary" onclick="addProjSection('${currentProjectId}','notes')">+ Poznámky</button><button class="btn-secondary" onclick="addProjSection('${currentProjectId}','links')">+ Odkazy</button><button class="btn-secondary" onclick="addProjSection('${currentProjectId}','files')">+ Soubory</button></div>`;
  main.appendChild(head);
  const body=document.createElement('div');body.className='proj-main-body';
  (proj.sections||[]).forEach((sect,si)=>{
    const sectEl=document.createElement('div');sectEl.className='proj-section';
    const sHead=document.createElement('div');sHead.className='proj-sect-head';
    sHead.innerHTML=`<input class="proj-sect-title" value="${sect.title}" onchange="renameProjSection('${currentProjectId}',${si},this.value)"><button class="proj-sect-del" onclick="deleteProjSection('${currentProjectId}',${si})">✕</button>`;
    sectEl.appendChild(sHead);
    const sBody=document.createElement('div');sBody.className='proj-sect-body';
    if(sect.type==='notes'){
      const ta=document.createElement('textarea');ta.className='proj-notes';ta.placeholder='Napište své poznámky...';ta.value=sect.content||'';ta.oninput=()=>{sect.content=ta.value;saveState()};sBody.appendChild(ta);
    } else if(sect.type==='tasks'){
      const tl=document.createElement('div');tl.className='proj-task-list';
      (sect.items||[]).forEach((item,ii)=>{
        const row=document.createElement('div');row.className='proj-task-item';
        row.innerHTML=`<input type="checkbox" ${item.done?'checked':''} style="width:14px;height:14px;accent-color:var(--accent);cursor:pointer" onchange="toggleProjTask('${currentProjectId}',${si},${ii},event)"><span style="flex:1;font-size:12px;color:${item.done?'var(--text3)':'var(--text)'};${item.done?'text-decoration:line-through':''}">${item.text}</span><button class="proj-task-del" onclick="delProjItem('${currentProjectId}',${si},${ii})">✕</button>`;
        tl.appendChild(row);
      });
      const ar=document.createElement('div');ar.style.cssText='display:flex;gap:7px;margin-top:4px';
      ar.innerHTML=`<input placeholder="Přidat úkol..." class="b-inp" id="pti-${si}" style="font-size:12px"><button class="b-add-btn" onclick="addProjItem('${currentProjectId}',${si},'tasks')">+ Přidat</button>`;
      sBody.appendChild(tl);sBody.appendChild(ar);
    } else if(sect.type==='links'){
      const ll=document.createElement('div');ll.className='proj-link-list';
      (sect.items||[]).forEach((item,ii)=>{
        const row=document.createElement('div');row.className='proj-link-item';
        row.innerHTML=`<span>🔗</span><a href="${item.url}" target="_blank" style="flex:1;color:var(--accent);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.label||item.url}</a><button class="proj-link-del" onclick="delProjItem('${currentProjectId}',${si},${ii})">✕</button>`;
        ll.appendChild(row);
      });
      const ar=document.createElement('div');ar.style.cssText='display:flex;gap:7px;margin-top:4px;flex-wrap:wrap';
      ar.innerHTML=`<input placeholder="Popisek" class="b-inp" id="pll-${si}" style="font-size:12px;flex:1;min-width:80px"><input placeholder="https://..." class="b-inp" id="plu-${si}" style="font-size:12px;flex:2;min-width:120px"><button class="b-add-btn" onclick="addProjItem('${currentProjectId}',${si},'links')">+ Přidat</button>`;
      sBody.appendChild(ll);sBody.appendChild(ar);
    } else if(sect.type==='files'){
      const fl=document.createElement('div');fl.className='proj-file-list';
      (sect.items||[]).forEach((item,ii)=>{
        const row=document.createElement('div');row.className='proj-file-item';
        row.innerHTML=`<span>📎</span><span style="flex:1;font-size:12px">${item.name}</span><span style="font-size:10px;font-family:Fira Code,monospace;color:var(--text3)">${item.size||''}</span><button class="proj-file-del" onclick="delProjItem('${currentProjectId}',${si},${ii})">✕</button>`;
        fl.appendChild(row);
      });
      const ar=document.createElement('div');ar.style.cssText='display:flex;gap:7px;margin-top:4px';
      ar.innerHTML=`<input placeholder="Název souboru (např. zpráva_Q2.pdf)" class="b-inp" id="pfi-${si}" style="font-size:12px"><input placeholder="Velikost (2.4 MB)" class="b-inp" id="pfs-${si}" style="font-size:12px;max-width:100px"><button class="b-add-btn" onclick="addProjItem('${currentProjectId}',${si},'files')">+ Přidat</button>`;
      sBody.appendChild(fl);sBody.appendChild(ar);
    }
    sectEl.appendChild(sBody);body.appendChild(sectEl);
  });
  if(!(proj.sections||[]).length){const e=document.createElement('div');e.className='proj-no-selection';e.style.padding='30px 0';e.innerHTML='<div style="font-size:24px;margin-bottom:8px">📄</div>Přidejte sekce pomocí tlačítek výše';body.appendChild(e)}
  main.appendChild(body);
}
function createProject(){const name=prompt('Název projektu:');if(!name)return;const d=getPD();if(!d)return;const pid='proj_'+Date.now();const color=PROJ_COLORS[Object.keys(d.projects).length%PROJ_COLORS.length];d.projects[pid]={id:pid,name,color,sections:[]};currentProjectId=pid;saveState();renderProjectsPage();renderSidebar()}
function renameProject(pid,name){const d=getPD();if(!d)return;if(d.projects[pid]&&name.trim())d.projects[pid].name=name.trim();saveState();renderSidebar()}
function deleteProject(e,pid){e.stopPropagation();showConfirm('Smazat projekt','Trvale smazat projekt a veškerý jeho obsah?',()=>{const d=getPD();if(!d)return;delete d.projects[pid];if(currentProjectId===pid)currentProjectId=null;saveState();renderProjectsPage();renderSidebar()})}
function addProjSection(pid,type){const d=getPD();if(!d)return;if(!d.projects[pid].sections)d.projects[pid].sections=[];const titles={tasks:'Úkoly',notes:'Poznámky',links:'Odkazy',files:'Soubory'};d.projects[pid].sections.push({type,title:titles[type],items:[],content:''});saveState();renderProjectsPage()}
function renameProjSection(pid,si,val){const d=getPD();if(!d)return;if(d.projects[pid].sections[si])d.projects[pid].sections[si].title=val;saveState()}
function deleteProjSection(pid,si){const d=getPD();if(!d)return;d.projects[pid].sections.splice(si,1);saveState();renderProjectsPage()}
function addProjItem(pid,si,type){
  const d=getPD();if(!d)return;const sect=d.projects[pid].sections[si];if(!sect)return;if(!sect.items)sect.items=[];
  if(type==='tasks'){const inp=document.getElementById('pti-'+si);if(!inp||!inp.value.trim())return;sect.items.push({text:inp.value.trim(),done:false});inp.value=''}
  else if(type==='links'){const li=document.getElementById('pll-'+si),lu=document.getElementById('plu-'+si);if(!lu||!lu.value.trim())return;sect.items.push({label:li?li.value.trim():'',url:lu.value.trim()});if(li)li.value='';lu.value=''}
  else if(type==='files'){const fi=document.getElementById('pfi-'+si),fs=document.getElementById('pfs-'+si);if(!fi||!fi.value.trim())return;sect.items.push({name:fi.value.trim(),size:fs?fs.value.trim():''});fi.value='';if(fs)fs.value=''}
  saveState();renderProjectsPage();
}
function delProjItem(pid,si,ii){const d=getPD();if(!d)return;d.projects[pid].sections[si].items.splice(ii,1);saveState();renderProjectsPage()}
function toggleProjTask(pid,si,ii,e){const d=getPD();if(!d)return;d.projects[pid].sections[si].items[ii].done=e.target.checked;saveState();renderProjectsPage()}

// ═══════ SETTINGS ═══════
function renderSettingsPage(){
  const p = getProfile();
  const av = document.getElementById('pc-av');
  const nm = document.getElementById('pc-name');
  const em = document.getElementById('pc-email');
  const ph = document.getElementById('pc-phone');
  if (!p) {
    if (av) av.textContent = '?';
    if (nm) nm.textContent = '—';
    if (em) em.textContent = '—';
    if (ph) ph.textContent = '—';
    return;
  }
  if (av) av.textContent = (p.initials || (p.name || '?').slice(0, 1)).toUpperCase();
  if (nm) nm.textContent = p.name || '—';
  if (em) em.textContent = p.email || '—';
  if (ph) ph.textContent = p.phone || '—';
}
function deleteProfile(pid){if(Object.keys(state.profiles).length<=1&&pid===activeProfileId){alert('Nelze smazat jediný profil.');return}showConfirm('Smazat profil','Trvale smazat tento profil a všechna jeho data?',()=>{delete state.profiles[pid];if(activeProfileId===pid){activeProfileId=null;state.activeProfile=null;saveState();signOut({stopPropagation:()=>{}})}else{saveState();renderSettingsPage()}})}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='flowtask_export_'+new Date().toISOString().slice(0,10)+'.json';a.click()}
function importData(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const imp=JSON.parse(ev.target.result);state=imp;saveState();if(state.activeProfile&&state.profiles[state.activeProfile])enterApp(state.activeProfile);else{document.getElementById('app').classList.remove('show');document.getElementById('profile-screen').style.display='flex';renderProfileScreen()}}catch(err){alert('Neplatný soubor JSON.')}};reader.readAsText(file);e.target.value=''}
function confirmReset(){showConfirm('Smazat všechna data','Trvale smazat VŠECHNA data pro všechny profily. Tuto akci nelze vrátit zpět.',()=>{localStorage.removeItem('flowtask_v6');location.reload()})}

// ═══════ CONFIRM ═══════
function showConfirm(title,msg,cb){document.getElementById('confirm-title').textContent=title;document.getElementById('confirm-msg').textContent=msg;confirmCallback=cb;document.getElementById('confirm-ov').classList.add('open')}
function closeConfirm(){document.getElementById('confirm-ov').classList.remove('open');confirmCallback=null}
document.getElementById('confirm-ok-btn').onclick=()=>{if(confirmCallback)confirmCallback();closeConfirm()}

// ═══════ SEED DATA ═══════
function seedData(pid){
  const d=state.profiles[pid].data;const now=new Date();
  function D(off){const dt=new Date(now);dt.setDate(now.getDate()+off);return dsDate(dt)}
  d.tasks.work=[
    {id:nextId++,title:'Čtvrtletní zpráva Q2',priority:'high',dueDate:D(0),status:'inprogress',recur:'none',bullets:[{text:'Shrnutí pro vedení',done:true},{text:'Finanční sekce',done:false},{text:'Review s týmem',done:false}],notes:'Termín konec týdne'},
    {id:nextId++,title:'Redesign webu',priority:'medium',dueDate:D(2),status:'ideas',recur:'none',bullets:[{text:'Wireframy',done:true},{text:'Kontrola textu',done:false}],notes:''},
    {id:nextId++,title:'E-maily klientům',priority:'low',dueDate:D(4),status:'ideas',recur:'none',bullets:[],notes:''},
    {id:nextId++,title:'Plánování sprintu',priority:'high',dueDate:D(1),status:'completed',recur:'weekly',bullets:[{text:'User stories',done:true},{text:'Odhady',done:true}],notes:''},
    {id:nextId++,title:'Denní standup',priority:'low',dueDate:D(0),status:'ideas',recur:'weekdays',bullets:[],notes:''},
  ];
  d.tasks.personal=[
    {id:nextId++,title:'Objednat k zubaři',priority:'medium',dueDate:D(3),status:'ideas',recur:'none',bullets:[],notes:''},
    {id:nextId++,title:'Plán na víkend — turistika',priority:'low',dueDate:null,status:'ideas',recur:'none',bullets:[{text:'Vybrat trasu',done:false},{text:'Zabalit vybavení',done:false}],notes:''},
    {id:nextId++,title:'Ranní běh',priority:'low',dueDate:D(0),status:'ideas',recur:'weekdays',bullets:[],notes:'Cíl: 30 minut'},
    {id:nextId++,title:'Opravit polici v kuchyni',priority:'high',dueDate:D(4),status:'inprogress',recur:'none',bullets:[{text:'Koupit šrouby',done:true},{text:'Vyvrtat otvory',done:false}],notes:''},
  ];
  const wk=weekKey(now);
  d.weeklyGoals[wk]=[
    {title:'Vstávat v 5:00 každý den',type:'habit',days:[true,true,false,true,false,false,false]},
    {title:'1 000 kliků celkem',type:'numeric',target:1000,unit:'kliků',entries:[80,120,0,95,0,0,0]},
    {title:'Přečíst 50 stránek',type:'numeric',target:50,unit:'stran',entries:[10,15,0,12,0,0,0]},
  ];
  const mon=getMon(now);
  [{sport:'running',day:0},{sport:'gym',day:1},{sport:'yoga',day:2},{sport:'running',day:3}].forEach(({sport,day})=>{const dt=new Date(mon);dt.setDate(mon.getDate()+day);d.sportLog[dsDate(dt)+'_'+sport]=true});
  for(let i=0;i<14;i++){if(Math.random()>0.35){const dt=new Date(now);dt.setDate(now.getDate()-i);d.completedDates.push(dsDate(dt))}}
  const projId='proj_seed';d.projects[projId]={id:projId,name:'Redesign webu',color:'#4F46E5',sections:[
    {type:'tasks',title:'Úkoly',items:[{text:'Vytvořit wireframy',done:true},{text:'Navrhnout mockupy',done:false},{text:'Frontend vývoj',done:false}]},
    {type:'notes',title:'Poznámky',content:'Hlavní cíl: zvýšit konverzní poměr o 15 %.\nFokus na mobile-first design.\nCílové spuštění: konec Q2.'},
    {type:'links',title:'Zdroje',items:[{label:'Figma Design File',url:'https://figma.com'},{label:'Brand Guidelines',url:'https://example.com'}]},
  ]};
  currentProjectId=projId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOT — Load state and show profile screen or main app (runs when DOM is ready)
// ═══════════════════════════════════════════════════════════════════════════════
function boot() {
  loadState();
  const su = (typeof window !== 'undefined' && window.__SUPA_USER) ? window.__SUPA_USER : null;
  if (su && su.id) {
    if (!state.profiles) state.profiles = {};
    const pid = 'u_' + su.id;
    if (!state.profiles[pid]) {
      const nm = (su.name || 'Uživatel').trim();
      const initials = nm.split(' ').map(w => (w[0] || '').toUpperCase()).join('').slice(0, 2) || 'U';
      state.profiles[pid] = { id: pid, name: nm, email: su.email || '', phone: '', initials, color: '#4F46E5' };
      ensureProfileData(pid);
    }
    activeProfileId = pid;
    state.activeProfile = pid;
    saveState();
    const ps = document.getElementById('profile-screen'); if (ps) ps.style.display = 'none';
    document.getElementById('app').classList.add('show');
    initApp();
  } else {
    // Not authenticated via Supabase → this legacy shell should never show profile selection
    try{ if(window.top) window.top.location.href='/login'; else window.location.href='/login'; }catch(_){ window.location.href='/login'; }
    return;
  }
  // Confirm dialog OK button — must be bound after DOM is ready
  const confirmBtn = document.getElementById('confirm-ok-btn');
  if (confirmBtn) {
    confirmBtn.onclick = function () {
      if (confirmCallback) confirmCallback();
      closeConfirm();
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
