'use strict';

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function togglePhase(id){
  var body=document.getElementById('pd'+id),chev=document.getElementById('pc'+id);
  var open=body.classList.contains('open');
  body.classList.toggle('open',!open);if(chev)chev.classList.toggle('open',!open);
}

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
  document.getElementById('missionBtn').textContent='Edit';
}
function saveMission(){
  var v=document.getElementById('missionTa').value.trim();
  mission=v||DEFAULT_MISSION;save();cancelMission();renderMission();
}

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
  var weeksOut=0;
  if(dateVal){var race=new Date(dateVal+'T12:00:00');weeksOut=Math.max(0,Math.round((race-new Date())/(7*86400000)));}
  var g={id:Date.now(),name:name,date:dateVal,dist:document.getElementById('gfDist').value.trim(),target:document.getElementById('gfTarget').value.trim(),weeks:weeksOut,notes:document.getElementById('gfNotes').value.trim(),plan:'',tips:''};
  goals.unshift(g);save();closeGoalForm();renderGoals();
}
function deleteGoal(id){goals=goals.filter(function(g){return g.id!==id;});save();renderGoals();}
function toggleGoalBody(id){
  var body=document.getElementById('gb-'+id),chev=document.getElementById('gc-'+id);
  var open=body.classList.contains('open');
  body.classList.toggle('open',!open);if(chev)chev.classList.toggle('open',!open);
}
function renderGoals(){
  var el=document.getElementById('goalsList');if(!el)return;
  if(!goals.length){el.innerHTML='<div style="font-size:13px;color:var(--mu);font-style:italic;text-align:center;padding:12px 0 16px">No goals yet. Tap + Add to create one.</div>';return;}
  var html='';
  goals.forEach(function(g){
    var dateStr=g.date?new Date(g.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
    var weeksStr=g.weeks>0?g.weeks+' weeks away':'';
    html+='<div class="goal-card">'
      +'<div class="goal-hdr" onclick="toggleGoalBody('+g.id+')">'
      +'<div class="goal-icon" style="background:var(--as)">🎯</div>'
      +'<div style="flex:1;min-width:0"><div class="goal-title">'+escHtml(g.name)+'</div>'+(dateStr?'<div class="goal-date">'+dateStr+(weeksStr?' · '+weeksStr:'')+'</div>':'')+'</div>'
      +'<span class="rpc" id="gc-'+g.id+'">›</span></div>'
      +'<div class="goal-body" id="gb-'+g.id+'">'
      +(g.dist?'<div class="goal-field"><div class="goal-label">Distance / Type</div><div class="goal-value">'+escHtml(g.dist)+'</div></div>':'')
      +(g.target?'<div class="goal-field"><div class="goal-label">Target Time</div><div class="goal-value">'+escHtml(g.target)+'</div></div>':'')
      +(g.notes?'<div class="goal-field"><div class="goal-label">Notes</div><div class="goal-value">'+escHtml(g.notes)+'</div></div>':'')
      +(g.plan?'<div class="goal-field"><div class="goal-label">Training Plan</div><div class="goal-plan" id="gplan-'+g.id+'">'+escHtml(g.plan)+'</div></div>':'<div id="gplan-'+g.id+'" style="display:none"></div>')
      +(g.tips?'<div class="goal-field"><div class="goal-label">Race Day Tips</div><div class="goal-plan" id="gtips-'+g.id+'">'+escHtml(g.tips)+'</div></div>':'<div id="gtips-'+g.id+'" style="display:none"></div>')
      +'<div style="display:flex;gap:8px;margin-top:12px">'
      +'<button class="gen-btn" id="gbtn-'+g.id+'" onclick="generateGoalPlan('+g.id+')">✦ '+(g.plan?'Regenerate Plan':'Generate Plan')+'</button>'
      +'<button onclick="deleteGoal('+g.id+')" style="font-size:12px;color:var(--mu);padding:10px 12px;background:var(--s2);border-radius:10px;border:1px solid var(--b)">Delete</button>'
      +'</div>'
      +'<div id="gerr-'+g.id+'" style="display:none;font-size:12px;color:#c0504a;margin-top:8px;font-weight:500"></div>'
      +'</div></div>';
  });
  el.innerHTML=html;
}

function generateGoalPlan(id){
  var g=goals.find(function(x){return x.id===id;});if(!g)return;
  var btn=document.getElementById('gbtn-'+id);
  var errEl=document.getElementById('gerr-'+id);
  var planEl=document.getElementById('gplan-'+id);
  var tipsEl=document.getElementById('gtips-'+id);
  if(btn){btn.textContent='Generating…';btn.disabled=true;}
  if(errEl)errEl.style.display='none';
  var prompt='Generate a focused training plan for this goal:\nEvent: '+g.name+'\nDistance/Type: '+(g.dist||'unknown')+'\nTarget time: '+(g.target||'finish')+'\nWeeks out: '+(g.weeks||'unknown')+'\nCurrent fitness: '+(g.notes||'none')+'\n\nProvide three clearly labeled sections:\n\nTRAINING PLAN:\nWeek-by-week breakdown. Be specific.\n\nMEAL ADJUSTMENTS:\nAny nutrition changes to support this goal.\n\nRACE DAY TIPS:\n4-5 specific, practical reminders.\n\nBe concise and encouraging.';
  fetch('https://theascensionprotocol.netlify.app/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1200,system:'You are a fitness and race prep coach. Be specific and practical.',messages:[{role:'user',content:prompt}]})})
  .then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  })
  .then(function(data){
    if(data.error)throw new Error(data.error.message||'API error');
    var full=(data.content||[]).map(function(b){return b.text||'';}).join('').trim();
    if(!full)throw new Error('Empty response');
    var tipsMatch=full.match(/RACE DAY TIPS[:\s]*([\s\S]*)$/i);
    var tips=tipsMatch?tipsMatch[1].trim():'';
    var planBody=full.replace(/RACE DAY TIPS[:\s]*[\s\S]*$/i,'').trim();
    g.plan=planBody;
    g.tips=tips;
    save();
    if(planEl){planEl.style.display='block';planEl.className='goal-plan';planEl.textContent=planBody;}
    if(tipsEl&&tips){tipsEl.style.display='block';tipsEl.className='goal-plan';tipsEl.textContent=tips;}
    if(planEl&&!document.getElementById('gplan-label-'+id)){
      var lbl=document.createElement('div');lbl.className='goal-label';lbl.id='gplan-label-'+id;lbl.textContent='Training Plan';planEl.parentNode.insertBefore(lbl,planEl);
    }
    if(tips&&tipsEl&&!document.getElementById('gtips-label-'+id)){
      var lbl2=document.createElement('div');lbl2.className='goal-label';lbl2.id='gtips-label-'+id;lbl2.textContent='Race Day Tips';tipsEl.parentNode.insertBefore(lbl2,tipsEl);
    }
    if(btn){btn.textContent='✦ Regenerate Plan';btn.disabled=false;}
  })
  .catch(function(e){
    if(btn){btn.textContent='✦ Generate Plan';btn.disabled=false;}
    if(errEl){errEl.textContent='Error: '+e.message+'. Check connection and try again.';errEl.style.display='block';}
  });
}
