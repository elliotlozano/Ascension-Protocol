'use strict';

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ── Goal swipe ─────────────────────────────────────────────────────────────
var _goalSwipedRow = null;
function _goalSnapBack(){if(_goalSwipedRow){_goalSwipedRow.style.transform='';_goalSwipedRow=null;}}
function attachGoalSwipe(id){
  var card=document.getElementById('goalCard-'+id);if(!card)return;
  var tx=0,ty=0;
  card.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  card.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-tx;
    var dy=Math.abs(e.changedTouches[0].clientY-ty);
    if(dy>Math.abs(dx)||Math.abs(dx)<8)return;
    if(dx<-40){if(_goalSwipedRow&&_goalSwipedRow!==card){_goalSwipedRow.style.transform='';}card.style.transform='translateX(-80px)';_goalSwipedRow=card;}
    else if(dx>20&&_goalSwipedRow===card){_goalSnapBack();}
  },{passive:true});
}

// ── Goal tabs ──────────────────────────────────────────────────────────────
var goalsTab = 'active';
function selGoalsTab(t){goalsTab=t;renderGoals();}

// ── Goal helpers ───────────────────────────────────────────────────────────
function _goalIsArchived(g){
  if(g.archived)return true;
  if(!g.date)return false;
  var raceDate=new Date(g.date+'T12:00:00');
  var today=new Date();today.setHours(0,0,0,0);
  return raceDate<today;
}
function _goalDateStatus(g){
  if(!g.date)return'';
  var raceDate=new Date(g.date+'T12:00:00');
  var today=new Date();today.setHours(0,0,0,0);
  var diffDays=Math.floor((raceDate-today)/86400000);
  if(diffDays===0)return'Today';
  if(diffDays>0){
    if(diffDays<7)return diffDays+' day'+(diffDays===1?'':'s')+' away';
    var w=Math.floor(diffDays/7);return w+' week'+(w===1?'':'s')+' away';
  }
  var abs=Math.abs(diffDays);
  if(abs<7)return abs+' day'+(abs===1?'':'s')+' ago';
  var wk=Math.floor(abs/7);return wk+' week'+(wk===1?'':'s')+' ago';
}

// ── Goal open state ────────────────────────────────────────────────────────
var _goalOpenIds = {};
function toggleGoalBody(id){
  var body=document.getElementById('gb-'+id),chev=document.getElementById('gc-'+id);
  var open=body.classList.contains('open');
  body.classList.toggle('open',!open);if(chev)chev.classList.toggle('open',!open);
  _goalOpenIds[id]=!open;
}
function _restoreGoalOpenState(){
  Object.keys(_goalOpenIds).forEach(function(id){
    if(_goalOpenIds[id]){
      var body=document.getElementById('gb-'+id);
      var chev=document.getElementById('gc-'+id);
      if(body)body.classList.add('open');
      if(chev)chev.classList.add('open');
    }
  });
}

// ── Goal actions ───────────────────────────────────────────────────────────
function archiveGoal(id){
  _goalSnapBack();
  var g=goals.find(function(x){return x.id===id;});
  if(g){g.archived=true;save();renderGoals();}
}
function confirmDeleteGoal(id){
  var wrap=document.getElementById('gsw-'+id);if(!wrap)return;
  _goalSnapBack();
  wrap.innerHTML='<div style="display:flex;align-items:center;padding:14px 16px;background:var(--s);border-radius:var(--rc);border:1px solid var(--b);gap:10px">'
    +'<div style="flex:1;font-size:14px;color:var(--t2)">Delete permanently?</div>'
    +'<button onclick="deleteGoal('+id+')" style="padding:7px 14px;background:#c0504a;color:#fff;border-radius:8px;font-size:13px;font-weight:600">Delete</button>'
    +'<button onclick="renderGoals()" style="padding:7px 14px;background:var(--s2);color:var(--mu);border-radius:8px;font-size:13px;font-weight:600">Cancel</button>'
    +'</div>';
}
function deleteGoal(id){_goalSnapBack();goals=goals.filter(function(g){return g.id!==id;});delete _goalOpenIds[id];save();renderGoals();}

// ── Edit Event name (inside expanded card body only) ───────────────────────
function editGoalName(id,el){
  var g=goals.find(function(x){return x.id===id;});if(!g)return;
  var current=el.textContent;
  var inp=document.createElement('input');inp.className='gl-edit-inp';inp.value=current;inp.style.flex='1';inp.style.fontSize='14px';
  var committed=false;
  function commit(){if(committed)return;committed=true;var val=inp.value.trim();if(val&&val!==current){g.name=val;save();}renderGoals();}
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();inp.blur();}if(e.key==='Escape'){e.preventDefault();committed=true;renderGoals();}});
  el.parentNode.replaceChild(inp,el);inp.focus();inp.select();
}

// ── Adjust Plan ────────────────────────────────────────────────────────────
function toggleAdjustPlan(id){
  var panel=document.getElementById('gadjust-'+id);if(!panel)return;
  var open=panel.style.display!=='none';
  panel.style.display=open?'none':'block';
  if(!open){var ta=document.getElementById('gadjust-ta-'+id);if(ta)ta.focus();}
}
function submitAdjustPlan(id){
  var g=goals.find(function(x){return x.id===id;});if(!g)return;
  var ta=document.getElementById('gadjust-ta-'+id);
  var btn=document.getElementById('gadjust-btn-'+id);
  if(!ta||!ta.value.trim())return;
  var request=ta.value.trim();
  if(btn){btn.textContent='Adjusting…';btn.disabled=true;}
  var prompt='Here is an existing training plan:\n\n'+g.plan+'\n\nThe user wants to adjust it:\n'+request+'\n\nReturn only the revised plan text. No preamble, no explanation, no markdown formatting.';
  fetch('https://theascensionprotocol.netlify.app/.netlify/functions/chat',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1400,system:'You are a fitness and race prep coach. Return only the revised plan text with no preamble, no markdown, and no explanation.',messages:[{role:'user',content:prompt}]})
  }).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
  .then(function(data){
    if(data.error)throw new Error(data.error.message||'API error');
    var full=(data.content||[]).map(function(b){return b.text||'';}).join('').trim();
    if(!full)throw new Error('Empty response');
    g.plan=full;save();
    _goalOpenIds[id]=true;
    renderGoals();
  }).catch(function(e){
    if(btn){btn.textContent='Regenerate Plan';btn.disabled=false;}
    var errEl=document.getElementById('gerr-'+id);
    if(errEl){errEl.textContent='Error: '+e.message+'. Check connection and try again.';errEl.style.display='block';}
  });
}

// ── Phase expansion ────────────────────────────────────────────────────────
function togglePhase(id){
  var body=document.getElementById('pd'+id),chev=document.getElementById('pc'+id);
  var open=body.classList.contains('open');
  body.classList.toggle('open',!open);if(chev)chev.classList.toggle('open',!open);
}

// ── Mission ────────────────────────────────────────────────────────────────
function renderMission(){
  var prev=document.getElementById('missionPreview');
  var full=document.getElementById('missionFull');
  var firstLine=mission.split('\n')[0];
  if(prev)prev.textContent=firstLine;
  if(full)full.innerHTML=mission.replace(/\n/g,'<br>');
}
function toggleMissionExpand(){
  var body=document.getElementById('missionBody'),chev=document.getElementById('missionChev');
  var open=body.classList.contains('open');
  body.classList.toggle('open',!open);if(chev)chev.classList.toggle('open',!open);
}
function toggleMissionEdit(e){
  e.stopPropagation();
  var ta=document.getElementById('missionTa'),full=document.getElementById('missionFull');
  var acts=document.getElementById('missionActions'),btn=document.getElementById('missionBtn');
  var editing=ta.classList.contains('open');
  if(!editing){ta.value=mission;ta.classList.add('open');full.style.display='none';acts.style.display='flex';btn.textContent='Cancel';}
  else cancelMission();
}
function cancelMission(){
  document.getElementById('missionTa').classList.remove('open');
  document.getElementById('missionFull').style.display='block';
  document.getElementById('missionActions').style.display='none';
  document.getElementById('missionBtn').textContent='✎';
}
function saveMission(){
  var v=document.getElementById('missionTa').value.trim();
  mission=v||DEFAULT_MISSION;save();cancelMission();renderMission();
}

// ── Goal form ──────────────────────────────────────────────────────────────

var GF_EMOJI_LIST=['🎯','🏃','💪','🏋️','⚡','🔥','🏆','🥇','🎖️','🌟','💎','🚀','🦾','🏅','⭐','🌙','🎪','🎨','🏔️','🌊','🦅','🐉','👑','💯'];
var GF_DIST_OPTIONS=['1 Mile','2 Mile','5K','10K','Half Marathon','Marathon'];
var GF_PROTO_OPTIONS=['Training','Nutrition','Recovery','Skin','Mental'];
var GF_WEIGHT_OPTIONS=(function(){var a=[];for(var w=50;w<=500;w+=5)a.push(w);return a;})();
var GF_BIO_UNITS={weight:'lbs',bodyfat:'%',waist:'in',chest:'in',shoulders:'in',bicep:'in'};

var _gfState={type:'Running',name:'',date:'',emoji:'',emojiPickerOpen:false,
  distance:'',targetTime:'',liftType:'',targetWeight:'',
  bioType:'',targetValue:'',subProtocol:'',adjustment:''};

function _gfSaveState(){
  var n=document.getElementById('gfName');if(n)_gfState.name=n.value;
  var d=document.getElementById('gfDate');if(d)_gfState.date=d.value;
  var tt=document.getElementById('gfTargetTime');if(tt)_gfState.targetTime=tt.value;
  var tv=document.getElementById('gfTargetVal');if(tv)_gfState.targetValue=tv.value;
  var adj=document.getElementById('gfAdjustment');if(adj)_gfState.adjustment=adj.value;
}

function _calcPace(distance,time){
  var milesMap={'1 Mile':1,'2 Mile':2,'5K':3.1,'10K':6.2,'Half Marathon':13.1,'Marathon':26.2};
  var miles=milesMap[distance]||0;
  if(!miles||!time)return'';
  var parts=time.split(':').map(Number);
  var totalMin;
  if(parts.length===3)totalMin=parts[0]*60+parts[1]+parts[2]/60;
  else if(parts.length===2)totalMin=parts[0]+parts[1]/60;
  else return'';
  if(isNaN(totalMin)||totalMin<=0)return'';
  var pace=totalMin/miles;
  var m=Math.floor(pace),s=Math.round((pace-m)*60);
  if(s===60){m++;s=0;}
  return m+':'+(s<10?'0':'')+s+' /mi';
}

function _updatePaceDisplay(){
  var el=document.getElementById('gfPaceDisplay');if(!el)return;
  var pace=_calcPace(_gfState.distance,_gfState.targetTime);
  el.textContent=pace?pace+' pace':'';
  el.style.display=pace?'block':'none';
}

function renderGoalForm(){
  var el=document.getElementById('goalForm');if(!el)return;

  var typeHtml='<div class="gf-row"><div class="gf-label">Type</div><div class="gf-pill-row">'
    +['Running','Lifting','Biometrics','Protocol'].map(function(t){
      return'<button class="gf-pill'+(_gfState.type===t?' on':'')+'" onclick="_gfSaveState();_gfState.type=\''+t+'\';renderGoalForm()">'+t+'</button>';
    }).join('')+'</div></div>';

  var nameHtml='<div class="gf-row"><div class="gf-label">Goal Name</div>'
    +'<input class="gf-inp" id="gfName" placeholder="e.g. Downtown 5K" autocomplete="off" value="'+escHtml(_gfState.name)+'"></div>';

  var dateWeeksHtml='';
  if(_gfState.date){
    var diff2=Math.round((new Date(_gfState.date+'T12:00:00')-new Date())/(7*86400000));
    if(diff2<=0)dateWeeksHtml='<div style="font-size:12px;color:#c0504a;margin-top:4px">Past date</div>';
    else dateWeeksHtml='<div style="font-size:12px;color:var(--a);font-weight:600;margin-top:4px">'+diff2+' week'+(diff2===1?'':'s')+' away</div>';
  }
  var dateHtml='<div class="gf-row"><div class="gf-label">Target Date</div>'
    +'<input class="gf-inp" id="gfDate" type="date" value="'+escHtml(_gfState.date)+'" oninput="_gfState.date=this.value;_gfSaveState();renderGoalForm()">'
    +dateWeeksHtml+'</div>';

  var emojiHtml='<div class="gf-row"><div class="gf-label">Icon</div>'
    +'<button class="gf-emoji-btn" onclick="_gfSaveState();_gfState.emojiPickerOpen=!_gfState.emojiPickerOpen;renderGoalForm()">'
    +(_gfState.emoji||'🎯')
    +'<span style="font-size:10px;color:var(--mu);font-weight:600">▾</span>'
    +'</button>'
    +(_gfState.emojiPickerOpen
      ?'<div class="gf-emoji-grid">'+GF_EMOJI_LIST.map(function(e){
          return'<div class="gf-emoji-opt'+(_gfState.emoji===e?' on':'')+'" onclick="_gfState.emoji=\''+e+'\';_gfState.emojiPickerOpen=false;_gfSaveState();renderGoalForm()">'+e+'</div>';
        }).join('')+'</div>'
      :'')
    +'</div>';

  var specificHtml='';
  if(_gfState.type==='Running'){
    var paceStr=_calcPace(_gfState.distance,_gfState.targetTime);
    specificHtml='<div class="gf-row"><div class="gf-label">Distance</div><div class="gf-pill-row">'
      +GF_DIST_OPTIONS.map(function(d){
        return'<button class="gf-pill'+(_gfState.distance===d?' on':'')+'" onclick="_gfSaveState();_gfState.distance=\''+d+'\';renderGoalForm()">'+d+'</button>';
      }).join('')+'</div></div>'
      +'<div class="gf-row"><div class="gf-label">Target Time</div>'
      +'<input class="gf-inp" id="gfTargetTime" placeholder="MM:SS or H:MM:SS" autocomplete="off" value="'+escHtml(_gfState.targetTime)+'" oninput="_gfState.targetTime=this.value;_updatePaceDisplay()">'
      +'<div class="gf-pace-display" id="gfPaceDisplay" style="'+(paceStr?'':'display:none')+'">'+(paceStr?paceStr+' pace':'')+'</div>'
      +'</div>';
  } else if(_gfState.type==='Lifting'){
    specificHtml='<div class="gf-row"><div class="gf-label">Lift</div><div class="gf-pill-row">'
      +LIFTS.map(function(l){
        return'<button class="gf-pill'+(_gfState.liftType===l.k?' on':'')+'" onclick="_gfSaveState();_gfState.liftType=\''+l.k+'\';renderGoalForm()">'+l.l+'</button>';
      }).join('')+'</div></div>'
      +'<div class="gf-row"><div class="gf-label">Target Weight</div><div class="gf-pill-scroll">'
      +GF_WEIGHT_OPTIONS.map(function(w){
        return'<button class="gf-pill'+(String(_gfState.targetWeight)===String(w)?' on':'')+'" onclick="_gfSaveState();_gfState.targetWeight='+w+';renderGoalForm()">'+w+'</button>';
      }).join('')+'</div></div>';
  } else if(_gfState.type==='Biometrics'){
    var bioUnit=GF_BIO_UNITS[_gfState.bioType]||'';
    specificHtml='<div class="gf-row"><div class="gf-label">Metric</div><div class="gf-pill-row">'
      +BIOF.map(function(b){
        return'<button class="gf-pill'+(_gfState.bioType===b.k?' on':'')+'" onclick="_gfSaveState();_gfState.bioType=\''+b.k+'\';renderGoalForm()">'+b.l+'</button>';
      }).join('')+'</div></div>'
      +'<div class="gf-row"><div class="gf-label">Target'+(bioUnit?' ('+bioUnit+')':'')+'</div>'
      +'<input class="gf-inp" id="gfTargetVal" type="number" inputmode="decimal" placeholder="e.g. 160" value="'+escHtml(_gfState.targetValue)+'">'
      +'</div>';
  } else if(_gfState.type==='Protocol'){
    specificHtml='<div class="gf-row"><div class="gf-label">Category</div><div class="gf-pill-row">'
      +GF_PROTO_OPTIONS.map(function(p){
        return'<button class="gf-pill'+(_gfState.subProtocol===p?' on':'')+'" onclick="_gfSaveState();_gfState.subProtocol=\''+p+'\';renderGoalForm()">'+p+'</button>';
      }).join('')+'</div></div>'
      +'<div class="gf-row"><div class="gf-label">Details (optional)</div>'
      +'<textarea class="gf-inp" id="gfAdjustment" placeholder="Describe your goal..." rows="3" style="resize:none;min-height:80px">'+escHtml(_gfState.adjustment)+'</textarea>'
      +'</div>';
  }

  var actionsHtml='<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px">'
    +'<button onclick="closeGoalForm()" style="font-size:13px;color:var(--mu);font-weight:600;padding:10px 14px">Cancel</button>'
    +'<button onclick="saveGoal()" style="font-size:14px;font-weight:700;padding:10px 20px;background:var(--a);color:#1c1c1e;border-radius:10px">Save Goal</button>'
    +'</div>';

  el.innerHTML=typeHtml+nameHtml+dateHtml+emojiHtml+specificHtml+actionsHtml;
}

function openGoalForm(){
  _gfState={type:'Running',name:'',date:'',emoji:'',emojiPickerOpen:false,
    distance:'',targetTime:'',liftType:'',targetWeight:'',
    bioType:'',targetValue:'',subProtocol:'',adjustment:''};
  document.getElementById('goalForm').classList.add('open');
  renderGoalForm();
  setTimeout(function(){var n=document.getElementById('gfName');if(n)n.focus();},50);
}
function closeGoalForm(){
  document.getElementById('goalForm').classList.remove('open');
  document.getElementById('goalForm').innerHTML='';
}
function saveGoal(){
  _gfSaveState();
  var name=_gfState.name.trim();if(!name)return;
  var g={id:Date.now(),name:name,date:_gfState.date,
    emoji:_gfState.emoji,type:_gfState.type,
    distance:_gfState.distance,targetTime:_gfState.targetTime,
    liftType:_gfState.liftType,targetWeight:_gfState.targetWeight,
    bioType:_gfState.bioType,targetValue:_gfState.targetValue,
    subProtocol:_gfState.subProtocol,adjustment:_gfState.adjustment,
    dist:_gfState.distance||_gfState.liftType||_gfState.bioType,
    target:_gfState.targetTime||_gfState.targetWeight,
    plan:'',tips:'',archived:false};
  goals.unshift(g);save();closeGoalForm();goalsTab='active';renderGoals();
}

// ── Render goals ───────────────────────────────────────────────────────────
function renderGoals(){
  var el=document.getElementById('goalsList');if(!el)return;
  _goalSwipedRow=null;

  var today=new Date();today.setHours(0,0,0,0);
  var activeGoals=goals.filter(function(g){return !_goalIsArchived(g);});
  var archivedGoals=goals.filter(function(g){return _goalIsArchived(g);});

  var tabHtml='<div class="mac-tabs" style="margin-bottom:8px">'
    +'<button class="mac-tab'+(goalsTab==='active'?' on':'')+'" onclick="selGoalsTab(\'active\')">Active'+(activeGoals.length?' ('+activeGoals.length+')':'')+'</button>'
    +'<button class="mac-tab'+(goalsTab==='archived'?' on':'')+'" onclick="selGoalsTab(\'archived\')">Archived'+(archivedGoals.length?' ('+archivedGoals.length+')':'')+'</button>'
    +'</div>';

  var list=goalsTab==='active'?activeGoals:archivedGoals;
  var isArchivedTab=goalsTab==='archived';

  var cardsHtml='';
  if(!list.length){
    cardsHtml='<div style="font-size:13px;color:var(--mu);font-style:italic;text-align:center;padding:12px 0 16px">'
      +(isArchivedTab?'No archived goals.':'No active goals. Tap + to create one.')+'</div>';
  } else {
    list.forEach(function(g){
      var dateStr=g.date?new Date(g.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
      var relStr=_goalDateStatus(g);

      var swipeBtn=isArchivedTab
        ?'<button class="goal-del-reveal-btn" onclick="confirmDeleteGoal('+g.id+')">Delete</button>'
        :'<button class="goal-arch-reveal-btn" onclick="archiveGoal('+g.id+')">Archive</button>';

      var adjustPanel=g.plan
        ?'<div id="gadjust-'+g.id+'" style="display:none;margin-top:8px">'
          +'<textarea id="gadjust-ta-'+g.id+'" class="gf-inp" style="min-height:70px;font-size:14px;resize:none" placeholder="Describe what you\'d like to change about this plan..."></textarea>'
          +'<div style="display:flex;justify-content:flex-end;margin-top:6px">'
          +'<button class="ok-btn" id="gadjust-btn-'+g.id+'" onclick="submitAdjustPlan('+g.id+')">Regenerate Plan</button>'
          +'</div></div>'
        :'';

      var emoji=g.emoji||'🎯';
      var bodyFields='<div class="goal-field"><div class="goal-label">Event</div>'
        +'<div class="goal-value" onclick="editGoalName('+g.id+',this)" style="cursor:text">'+escHtml(g.name)+'</div></div>';

      if(g.type==='Running'){
        var pace=_calcPace(g.distance,g.targetTime);
        if(g.distance)bodyFields+='<div class="goal-field"><div class="goal-label">Distance</div><div class="goal-value">'+escHtml(g.distance)+'</div></div>';
        if(g.targetTime)bodyFields+='<div class="goal-field"><div class="goal-label">Target Time</div>'
          +'<div class="goal-value" onclick="openTargetTimeSheet('+g.id+')" style="cursor:pointer;color:var(--a)">'+escHtml(g.targetTime)+'</div></div>';
        if(pace)bodyFields+='<div class="goal-field"><div class="goal-label">Pace</div><div class="goal-value">'+pace+'</div></div>';
      } else if(g.type==='Lifting'){
        if(g.liftType){var liftLabel=(LIFTS.find(function(x){return x.k===g.liftType;})||{l:g.liftType}).l;bodyFields+='<div class="goal-field"><div class="goal-label">Lift</div><div class="goal-value">'+escHtml(liftLabel)+'</div></div>';}
        if(g.targetWeight)bodyFields+='<div class="goal-field"><div class="goal-label">Target Weight</div><div class="goal-value">'+escHtml(g.targetWeight)+' lbs</div></div>';
      } else if(g.type==='Biometrics'){
        if(g.bioType){var bioLabel=(BIOF.find(function(x){return x.k===g.bioType;})||{l:g.bioType}).l;bodyFields+='<div class="goal-field"><div class="goal-label">Metric</div><div class="goal-value">'+escHtml(bioLabel)+'</div></div>';}
        if(g.targetValue)bodyFields+='<div class="goal-field"><div class="goal-label">Target</div><div class="goal-value">'+escHtml(g.targetValue)+'</div></div>';
      } else if(g.type==='Protocol'){
        if(g.subProtocol)bodyFields+='<div class="goal-field"><div class="goal-label">Category</div><div class="goal-value">'+escHtml(g.subProtocol)+'</div></div>';
        if(g.adjustment)bodyFields+='<div class="goal-field"><div class="goal-label">Details</div><div class="goal-value">'+escHtml(g.adjustment)+'</div></div>';
      } else {
        if(g.dist)bodyFields+='<div class="goal-field"><div class="goal-label">Distance / Type</div><div class="goal-value">'+escHtml(g.dist)+'</div></div>';
        if(g.target)bodyFields+='<div class="goal-field"><div class="goal-label">Target Time</div><div class="goal-value">'+escHtml(g.target)+'</div></div>';
        if(g.notes)bodyFields+='<div class="goal-field"><div class="goal-label">Notes</div><div class="goal-value">'+escHtml(g.notes)+'</div></div>';
      }

      if(g.plan)bodyFields+='<div class="goal-field"><div class="goal-label">Training Plan</div><div class="goal-plan">'+escHtml(g.plan)+'</div></div>';
      if(g.tips)bodyFields+='<div class="goal-field"><div class="goal-label">Race Day Tips</div><div class="goal-plan">'+escHtml(g.tips)+'</div></div>';

      cardsHtml+='<div class="goal-swipe-wrap" id="gsw-'+g.id+'">'
        +swipeBtn
        +'<div class="goal-card'+(isArchivedTab?' goal-archived':'')+'" id="goalCard-'+g.id+'">'
        +'<div class="goal-hdr" onclick="if(!_goalSwipedRow)toggleGoalBody('+g.id+');else _goalSnapBack()">'
        +'<div class="goal-icon" style="background:var(--as)">'+emoji+'</div>'
        +'<div style="flex:1;min-width:0"><div class="goal-title">'+escHtml(g.name)+'</div>'
        +(dateStr?'<div class="goal-date">'+dateStr+(relStr?' · '+relStr:'')+'</div>':'')
        +'</div>'
        +'<span class="rpc" id="gc-'+g.id+'">›</span></div>'
        +'<div class="goal-body" id="gb-'+g.id+'">'
        +bodyFields
        +'<div style="display:flex;gap:8px;margin-top:12px">'
        +'<button class="gen-btn" id="gbtn-'+g.id+'" onclick="'+(g.plan?'toggleAdjustPlan('+g.id+')':'generateGoalPlan('+g.id+')')+'">✦ '+(g.plan?'Adjust Plan':'Generate Plan')+'</button>'
        +'</div>'
        +adjustPanel
        +'<div id="gerr-'+g.id+'" style="display:none;font-size:12px;color:#c0504a;margin-top:8px;font-weight:500"></div>'
        +'</div></div></div>';
    });
  }

  el.innerHTML=tabHtml+cardsHtml;
  list.forEach(function(g){attachGoalSwipe(g.id);});
  _restoreGoalOpenState();
}

// ── Target time bottom sheet ───────────────────────────────────────────────
function openTargetTimeSheet(id){
  var g=goals.find(function(x){return x.id===id;});if(!g)return;
  var overlay=document.createElement('div');
  overlay.id='ttSheet';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end';
  var sheet=document.createElement('div');
  sheet.style.cssText='width:100%;background:var(--s);border-radius:20px 20px 0 0;padding:24px 20px 40px;box-sizing:border-box';
  sheet.innerHTML='<div style="text-align:center;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--mu);margin-bottom:12px">Target Time</div>'
    +'<div style="font-family:var(--fd);font-size:40px;font-weight:600;color:var(--a);text-align:center;margin-bottom:16px">'+escHtml(g.targetTime||'—')+'</div>'
    +'<p style="font-size:14px;color:var(--t2);text-align:center;line-height:1.6;margin-bottom:20px">Adjust your training plan for this target?</p>'
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +'<button onclick="_openGoalAdjustFromSheet('+id+')" style="padding:14px;background:var(--a);color:#1c1c1e;border-radius:12px;font-size:15px;font-weight:700">'+(g.plan?'Adjust Plan':'Generate Plan')+'</button>'
    +'<button onclick="closeTargetTimeSheet()" style="padding:14px;background:var(--s2);color:var(--mu);border-radius:12px;font-size:15px;font-weight:600">Dismiss</button>'
    +'</div>';
  overlay.appendChild(sheet);
  overlay.addEventListener('click',function(e){if(e.target===overlay)closeTargetTimeSheet();});
  document.body.appendChild(overlay);
}
function closeTargetTimeSheet(){
  var el=document.getElementById('ttSheet');if(el)el.parentNode.removeChild(el);
}
function _openGoalAdjustFromSheet(id){
  closeTargetTimeSheet();
  _goalOpenIds[id]=true;
  renderGoals();
  var g=goals.find(function(x){return x.id===id;});if(!g)return;
  setTimeout(function(){
    if(g.plan)toggleAdjustPlan(id);
    else generateGoalPlan(id);
  },50);
}

// ── Generate initial plan ──────────────────────────────────────────────────
function generateGoalPlan(id){
  var g=goals.find(function(x){return x.id===id;});if(!g)return;
  var btn=document.getElementById('gbtn-'+id);
  var errEl=document.getElementById('gerr-'+id);
  if(btn){btn.textContent='Generating…';btn.disabled=true;}
  if(errEl)errEl.style.display='none';
  // Compute current weeks out dynamically
  var weeksOut='unknown';
  if(g.date){var diff=Math.floor((new Date(g.date+'T12:00:00')-new Date())/(7*86400000));weeksOut=diff>0?diff:0;}
  var prompt='Generate a focused training plan for this goal:\nEvent: '+g.name+'\nDistance/Type: '+(g.dist||'unknown')+'\nTarget time: '+(g.target||'finish')+'\nWeeks out: '+weeksOut+'\nCurrent fitness: '+(g.notes||'none')+'\n\nProvide three clearly labeled sections:\n\nTRAINING PLAN:\nWeek-by-week breakdown. Be specific.\n\nMEAL ADJUSTMENTS:\nAny nutrition changes to support this goal.\n\nRACE DAY TIPS:\n4-5 specific, practical reminders.\n\nBe concise and encouraging.';
  fetch('https://theascensionprotocol.netlify.app/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1400,system:'You are a fitness and race prep coach. Be specific and practical.',messages:[{role:'user',content:prompt}]})})
  .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
  .then(function(data){
    if(data.error)throw new Error(data.error.message||'API error');
    var full=(data.content||[]).map(function(b){return b.text||'';}).join('').trim();
    if(!full)throw new Error('Empty response');
    var tipsMatch=full.match(/RACE DAY TIPS[:\s]*([\s\S]*)$/i);
    g.tips=tipsMatch?tipsMatch[1].trim():'';
    g.plan=full.replace(/RACE DAY TIPS[:\s]*[\s\S]*$/i,'').trim();
    save();
    _goalOpenIds[id]=true;
    renderGoals();
  })
  .catch(function(e){
    if(btn){btn.textContent='✦ Generate Plan';btn.disabled=false;}
    if(errEl){errEl.textContent='Error: '+e.message+'. Check connection and try again.';errEl.style.display='block';}
  });
}
