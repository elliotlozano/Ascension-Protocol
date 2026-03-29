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
function calcWeeksOut(){
  var dateVal=document.getElementById('gfDate').value;
  var disp=document.getElementById('gfWeeksDisplay');
  if(!dateVal){disp.textContent='—';return;}
  var race=new Date(dateVal+'T12:00:00');
  var now=new Date();
  var diff=Math.round((race-now)/(7*86400000));
  if(diff<=0){disp.textContent='Past date';disp.style.color='#c0504a';}
  else{disp.textContent=diff+' week'+(diff===1?'':'s')+' away';disp.style.color='var(--a)';}
}
function openGoalForm(){document.getElementById('goalForm').classList.add('open');document.getElementById('gfName').focus();}
function closeGoalForm(){
  document.getElementById('goalForm').classList.remove('open');
  ['gfName','gfDate','gfDist','gfTarget','gfNotes'].forEach(function(id){document.getElementById(id).value='';});
  var disp=document.getElementById('gfWeeksDisplay');if(disp){disp.textContent='—';disp.style.color='var(--a)';}
}
function saveGoal(){
  var name=document.getElementById('gfName').value.trim();if(!name)return;
  var dateVal=document.getElementById('gfDate').value;
  var g={id:Date.now(),name:name,date:dateVal,dist:document.getElementById('gfDist').value.trim(),target:document.getElementById('gfTarget').value.trim(),notes:document.getElementById('gfNotes').value.trim(),plan:'',tips:'',archived:false};
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

      cardsHtml+='<div class="goal-swipe-wrap" id="gsw-'+g.id+'">'
        +swipeBtn
        +'<div class="goal-card'+(isArchivedTab?' goal-archived':'')+'" id="goalCard-'+g.id+'">'
        +'<div class="goal-hdr" onclick="if(!_goalSwipedRow)toggleGoalBody('+g.id+');else _goalSnapBack()">'
        +'<div class="goal-icon" style="background:var(--as)">🎯</div>'
        +'<div style="flex:1;min-width:0"><div class="goal-title">'+escHtml(g.name)+'</div>'
        +(dateStr?'<div class="goal-date">'+dateStr+(relStr?' · '+relStr:'')+'</div>':'')
        +'</div>'
        +'<span class="rpc" id="gc-'+g.id+'">›</span></div>'
        +'<div class="goal-body" id="gb-'+g.id+'">'
        +'<div class="goal-field"><div class="goal-label">Event</div>'
        +'<div class="goal-value" onclick="editGoalName('+g.id+',this)" style="cursor:text">'+escHtml(g.name)+'</div></div>'
        +(g.dist?'<div class="goal-field"><div class="goal-label">Distance / Type</div><div class="goal-value">'+escHtml(g.dist)+'</div></div>':'')
        +(g.target?'<div class="goal-field"><div class="goal-label">Target Time</div><div class="goal-value">'+escHtml(g.target)+'</div></div>':'')
        +(g.notes?'<div class="goal-field"><div class="goal-label">Notes</div><div class="goal-value">'+escHtml(g.notes)+'</div></div>':'')
        +(g.plan?'<div class="goal-field"><div class="goal-label">Training Plan</div><div class="goal-plan">'+escHtml(g.plan)+'</div></div>':'')
        +(g.tips?'<div class="goal-field"><div class="goal-label">Race Day Tips</div><div class="goal-plan">'+escHtml(g.tips)+'</div></div>':'')
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
