'use strict';

// Returns the actual calendar date for a given protocol month/week/day
function getActualDate(protoMonth, week, day) {
  var gw = (protoMonth - 1) * 4 + week;
  var dayIdx = DAYS.indexOf(day);
  var d = new Date(PROTO_START);
  d.setDate(d.getDate() + (gw - 1) * 7 + dayIdx);
  return d;
}

function renderPlanner() {
  var gW = globalWeek();
  var meta = getMeta(cProtoMonth);
  var phase = getPhaseForMonth(cProtoMonth);
  var wt = satType(gW);

  // Weekly momentum score
  var totalT=0, totalD=0;
  DAYS.forEach(function(d){
    var ts=buildSchedule(d,cProtoMonth,gW);
    totalT+=ts.length;
    ts.forEach(function(_,i){if(chk[ckKey(d,i)])totalD++;});
  });
  var weekPct = Math.round(totalD/totalT*100);

  // Store weekly score for consecutive weeks tracking
  weekScores['gw'+gW] = weekPct;

  // Check for 3+ consecutive weeks above 90%
  var isBlueFireWeek = false;
  if (weekPct >= 90) {
    var prevGw1 = 'gw'+(gW-1);
    var prevGw2 = 'gw'+(gW-2);
    if (weekScores[prevGw1] >= 90 && weekScores[prevGw2] >= 90) {
      isBlueFireWeek = true;
    }
  }

  // Momentum score display (feature 2: stacked label + %, fire emoji)
  var scoreEl = document.getElementById('momentumScore');
  if (scoreEl) {
    var fireHtml = '';
    if (weekPct >= 90) {
      if (isBlueFireWeek) {
        fireHtml = '<span style="filter:hue-rotate(200deg);display:inline-block">🔥</span> ';
      } else {
        fireHtml = '🔥 ';
      }
    }
    var pctColor = weekPct >= 90 ? 'var(--a)' : 'var(--mu)';
    scoreEl.innerHTML = '<div class="momentum-lbl">Momentum</div><div class="momentum-val" style="color:'+pctColor+'">'+fireHtml+weekPct+'%</div>';
  }

  // Phase strip
  var phaseHtml='';
  var showMonths=[];
  for(var m=Math.max(1,cProtoMonth-1);m<=cProtoMonth+2;m++)showMonths.push(m);
  showMonths.forEach(function(m){
    var ph=getPhaseForMonth(m);
    var isOn=m===cProtoMonth;
    phaseHtml+='<button class="sp'+(isOn?' on':'')+'" onclick="selProtoMonth('+m+')" style="background:'+(isOn?ph.hl:'transparent')+';color:'+(isOn?'#1c1c1e':'')+'">M'+m+'</button>';
  });
  document.getElementById('phaseStrip').innerHTML=phaseHtml;

  // Week strip
  var wkHtml='';
  for(var w=1;w<=4;w++){
    var isOn=w===cW;
    wkHtml+='<button class="sc'+(isOn?' on':'')+'" onclick="selWeek('+w+')" style="background:'+(isOn?meta.hl:'transparent')+';color:'+(isOn?'#1c1c1e':'')+'">'+w+'</button>';
  }
  document.getElementById('weekStrip').innerHTML=wkHtml;

  // Day tabs
  var dtHtml='';
  DAYS.forEach(function(d){
    var ts=buildSchedule(d,cProtoMonth,gW);
    var done=ts.filter(function(_,i){return!!chk[ckKey(d,i)];}).length;
    dtHtml+='<button class="dt'+(d===cD?' on':'')+'" onclick="selDay(\''+d+'\')">'+d.slice(0,3)+(done===ts.length?'<span class="dd"></span>':'')+'</button>';
  });
  document.getElementById('dayTabs').innerHTML=dtHtml;

  // Banner
  var satInfo = ' · Sat: '+(wt==='A'?'Push B':'Pull B');
  var bn=document.getElementById('banner');
  bn.style.borderLeftColor=meta.hl;
  bn.innerHTML='<div class="bnt" style="color:'+meta.hl+'">'+meta.label+' · '+phase.sub+'</div>'
    +'<div class="bnb"><strong>Skin:</strong> '+meta.ret+'<br><strong>Run:</strong> '+meta.run+'<br><strong>Gym:</strong> '+meta.wt+satInfo+'</div>';

  // Day header — feature 1: day name + month/day beside it
  var actualDate = getActualDate(cProtoMonth, cW, cD);
  var monthDayStr = actualDate.toLocaleDateString('en-US', {month:'short', day:'numeric'});
  document.getElementById('dayName').textContent = cD;
  document.getElementById('dayMonthDay').textContent = monthDayStr;
  document.getElementById('daySub').textContent = DSUB[cD];

  // Day stats
  var tasks=buildSchedule(cD,cProtoMonth,gW);
  var dc=tasks.filter(function(_,i){return!!chk[ckKey(cD,i)];}).length;
  var pct=Math.round(dc/tasks.length*100);
  document.getElementById('dayPct').textContent=pct+'%';
  document.getElementById('dayPct').style.color=pct===100?'var(--sg)':meta.hl;
  document.getElementById('dayCnt').textContent=dc+'/'+tasks.length+' tasks';
  var pf=document.getElementById('progFill');pf.style.width=pct+'%';pf.style.background=pct===100?'var(--sg)':meta.hl;
  document.getElementById('resetBtn').style.display=dc>0?'inline':'none';

  // Task list
  var chkSvg='<svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4L3.5 6.5L9 1"/></svg>';
  var tlHtml='';
  tasks.forEach(function(task,i){
    var done=!!chk[ckKey(cD,i)];
    var tagClass='g-'+(TAGS[task.tag]||'ad');
    tlHtml+='<div class="ti'+(done?' done':'')+'" onclick="toggleTask('+i+')">'
      +'<div class="tc'+(done?' on':'')+'">'+(done?chkSvg:'')+'</div>'
      +'<div style="flex:1;min-width:0"><div class="tm"><span class="tt">'+task.time+'</span><span class="tg '+tagClass+'">'+task.tag+'</span></div>'
      +'<div class="tx">'+(done?'<s>':'')+task.task+(done?'</s>':'')+'</div></div></div>';
  });
  document.getElementById('taskList').innerHTML=tlHtml;

  // Dinner card
  var dinHtml='<div class="ct">This Week\'s Dinners</div>';
  ['Monday','Tuesday','Wednesday','Thursday'].forEach(function(d,i){
    var idx=(gW-1)*4+i;
    dinHtml+='<div class="mr"><span class="ml">'+d.slice(0,3)+' #'+((idx%16)+1)+'</span><span class="mv">'+getDinner(gW,d)+'</span></div>';
  });
  dinHtml+='<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--b);font-size:12px;color:var(--mu);line-height:1.6">Each dinner = next day\'s lunch · Fri = date night · Snacks alternate daily</div>';
  document.getElementById('dinnerCard').innerHTML=dinHtml;
}

function selProtoMonth(m){cProtoMonth=m;renderPlanner();}
function selWeek(w){cW=w;renderPlanner();}
function selDay(d){cD=d;renderPlanner();}
function toggleTask(i){var k=ckKey(cD,i);chk[k]=!chk[k];save();renderPlanner();}
function resetDay(){var ts=buildSchedule(cD,cProtoMonth,globalWeek());ts.forEach(function(_,i){delete chk[ckKey(cD,i)];});save();renderPlanner();}

function goToToday(){syncToToday();renderPlanner();}
function syncToToday(){
  var now=new Date();
  var diff=Math.floor((now-PROTO_START)/86400000);
  if(diff<0){cProtoMonth=1;cW=1;}
  else{
    var totalWeeks=Math.floor(diff/7);
    cProtoMonth=Math.floor(totalWeeks/4)+1;
    cW=(totalWeeks%4)+1;
  }
  var js=now.getDay();
  cD=DAYS[js===0?6:js-1];
}
