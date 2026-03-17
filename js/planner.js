'use strict';

// Returns the actual calendar date for a given protocol month/week/day
function getActualDate(protoMonth, week, day) {
  var gw = (protoMonth - 1) * 4 + week;
  var dayIdx = DAYS.indexOf(day);
  var d = new Date(PROTO_START);
  d.setDate(d.getDate() + (gw - 1) * 7 + dayIdx);
  return d;
}

function getDateStringForDay(protoMonth, week, day) {
  var d = getActualDate(protoMonth, week, day);
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
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
    scoreEl.innerHTML = '<div class="momentum-lbl">Momentum</div><div class="momentum-val" style="color:'+pctColor+'">'+fireHtml+weekPct+'% <span class="mom-chev">›</span></div>';
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

  // Banner (collapsible)
  var satInfo = ' · Sat: '+(wt==='A'?'Push B':'Pull B');
  var bn=document.getElementById('banner');
  bn.style.borderLeftColor=meta.hl;
  var bannerOpen=localStorage.getItem('ac_banner_open')==='true';
  bn.innerHTML='<div class="bn-hdr" onclick="toggleBanner()">'
    +'<div class="bnt" style="color:'+meta.hl+'">'+meta.label+' · '+phase.sub+'</div>'
    +'<span class="bn-chev'+(bannerOpen?' open':'')+'">›</span></div>'
    +'<div class="bnb'+(bannerOpen?' open':'')+'">'
    +'<strong>Skin:</strong> '+meta.ret+'<br><strong>Run:</strong> '+meta.run+'<br><strong>Gym:</strong> '+meta.wt+satInfo+'</div>';

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

  // Dinner card (collapsible)
  var dinnerOpen=localStorage.getItem('ac_dinner_open')==='true';
  var dinHtml='<div class="din-hdr" onclick="toggleDinner()">'
    +'<div class="ct" style="margin-bottom:0">This Week\'s Dinners</div>'
    +'<span class="bn-chev'+(dinnerOpen?' open':'')+'">›</span></div>';
  dinHtml+='<div class="din-body'+(dinnerOpen?' open':'')+'">';
  ['Monday','Tuesday','Wednesday','Thursday'].forEach(function(d,i){
    var idx=(gW-1)*4+i;
    dinHtml+='<div class="mr"><span class="ml">'+d.slice(0,3)+' #'+((idx%16)+1)+'</span><span class="mv">'+getDinner(gW,d)+'</span></div>';
  });
  dinHtml+='<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--b);font-size:12px;color:var(--mu);line-height:1.6">Each dinner = next day\'s lunch · Fri = date night · Snacks alternate daily</div>';
  dinHtml+='</div>';
  document.getElementById('dinnerCard').innerHTML=dinHtml;
}

function selProtoMonth(m){cProtoMonth=m;renderPlanner();}
function selWeek(w){cW=w;renderPlanner();}
function selDay(d){cD=d;renderPlanner();}
function toggleTask(i){
  var k=ckKey(cD,i);chk[k]=!chk[k];
  var ts=buildSchedule(cD,cProtoMonth,globalWeek());
  var t=ts[i];
  if(t&&t.tag==='nutrition'){
    var dk=todayKey();
    if(chk[k]){
      // Checking on: log macro entry
      if(t.task.toLowerCase().indexOf('water')!==-1){
        // Water task: log with zero macros, no AI call
        var wday=getMacroDay(dk);
        var wAlready=false;
        for(var wi=0;wi<wday.meals.length;wi++){if(wday.meals[wi].name.toLowerCase()===t.task.toLowerCase()){wAlready=true;break;}}
        if(!wAlready){
          wday.meals.push({name:t.task,cal:0,protein:0,carbs:0,fat:0});
          localStorage.setItem('ac_macros',JSON.stringify(macros));
        }
        if(document.getElementById('pageMacros').classList.contains('on'))renderMacroToday();
      } else {
        logMealMacro(t.task);
      }
    } else {
      // Unchecking: remove entry and recalculate totals
      if(macros[dk]){
        var mday=macros[dk];
        var rmIdx=-1;
        for(var mi=0;mi<mday.meals.length;mi++){if(mday.meals[mi].name.toLowerCase()===t.task.toLowerCase()){rmIdx=mi;break;}}
        if(rmIdx!==-1){
          mday.meals.splice(rmIdx,1);
          mday.totals={cal:0,protein:0,carbs:0,fat:0};
          mday.meals.forEach(function(m){['cal','protein','carbs','fat'].forEach(function(fk){mday.totals[fk]+=(m[fk]||0);});});
          localStorage.setItem('ac_macros',JSON.stringify(macros));
        }
        if(document.getElementById('pageMacros').classList.contains('on'))renderMacroToday();
      }
    }
  }
  save();renderPlanner();
}
function resetDay(){var ts=buildSchedule(cD,cProtoMonth,globalWeek());ts.forEach(function(_,i){delete chk[ckKey(cD,i)];});save();renderPlanner();}

function toggleBanner(){
  var open=localStorage.getItem('ac_banner_open')==='true';
  open=!open;
  localStorage.setItem('ac_banner_open',String(open));
  var body=document.querySelector('#banner .bnb');
  var chev=document.querySelector('#banner .bn-chev');
  if(body)body.classList.toggle('open',open);
  if(chev)chev.classList.toggle('open',open);
}
function toggleDinner(){
  var open=localStorage.getItem('ac_dinner_open')==='true';
  open=!open;
  localStorage.setItem('ac_dinner_open',String(open));
  var body=document.querySelector('#dinnerCard .din-body');
  var chev=document.querySelector('#dinnerCard .bn-chev');
  if(body)body.classList.toggle('open',open);
  if(chev)chev.classList.toggle('open',open);
}
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

// ── Momentum sub-page ──────────────────────────────────────────────────────

var _momTab='week';

var _MOM_TAG_COLORS={nutrition:'#7a9e87',gym:'#6b8cae',skincare:'#9e7a90',supplement:'#a89530',hair:'#a07a58',cardio:'#6a9aaa',sleep:'#7a6aaa',admin:'#888888',shower:'#5a9a9a'};
var _MOM_TAG_LABELS={nutrition:'Nutrition',gym:'Gym',skincare:'Skincare',supplement:'Supplement',hair:'Hair',cardio:'Cardio',sleep:'Sleep',admin:'Admin',shower:'Shower'};

function openMomentumPage(){
  document.getElementById('pageProtocolMain').classList.remove('on');
  document.getElementById('pageMomentum').classList.add('on');
  selMomentumTab(_momTab);
}
function closeMomentumPage(){
  document.getElementById('pageMomentum').classList.remove('on');
  document.getElementById('pageProtocolMain').classList.add('on');
}
function selMomentumTab(t){
  _momTab=t;
  ['week','history','insights'].forEach(function(id){
    document.getElementById('momTab-'+id).classList.toggle('on',id===t);
    document.getElementById('momSec-'+id).style.display=(id===t?'block':'none');
  });
  if(t==='week')       renderMomentumThisWeek();
  else if(t==='history')renderMomentumHistory();
  else                  renderMomentumInsights();
}

// ── category stats helper ─────────────────────────────────────────────────
function _momCatStats(){
  var gW=globalWeek();
  var total={},done={};
  DAYS.forEach(function(d){
    var ts=buildSchedule(d,cProtoMonth,gW);
    ts.forEach(function(task,i){
      var tag=task.tag;
      if(!total[tag]){total[tag]=0;done[tag]=0;}
      total[tag]++;
      if(chk[ckKey(d,i)])done[tag]++;
    });
  });
  return Object.keys(total).filter(function(t){return total[t]>0;}).map(function(tag){
    return{tag:tag,pct:Math.round(done[tag]/total[tag]*100),done:done[tag],total:total[tag]};
  });
}

// ── This Week tab ─────────────────────────────────────────────────────────
function renderMomentumThisWeek(){
  var gW=globalWeek();
  var meta=getMeta(cProtoMonth);
  var phaseColor=meta.hl;

  // Overall week score
  var totalT=0,totalD=0;
  DAYS.forEach(function(d){
    var ts=buildSchedule(d,cProtoMonth,gW);
    totalT+=ts.length;
    ts.forEach(function(_,i){if(chk[ckKey(d,i)])totalD++;});
  });
  var weekPct=totalT>0?Math.round(totalD/totalT*100):0;

  var isBlue=weekScores['gw'+(gW-1)]>=90&&weekScores['gw'+(gW-2)]>=90;
  var fireHtml='';
  if(weekPct>=90)fireHtml=(isBlue?'<span style="filter:hue-rotate(200deg);display:inline-block">🔥</span>':'🔥')+' ';

  // Hero
  var html='<div class="mom-hero">'
    +'<div class="mom-hero-pct" style="color:'+phaseColor+'">'+fireHtml+weekPct+'%</div>'
    +'<div class="mom-hero-lbl">This Week</div>'
    +'</div>';

  // Day breakdown
  var now=new Date();
  var todayName=DAYS[now.getDay()===0?6:now.getDay()-1];
  html+='<div class="mom-section-hdr">Days</div><div class="mom-day-rows">';
  DAYS.forEach(function(d){
    var ts=buildSchedule(d,cProtoMonth,gW);
    var dn=ts.filter(function(_,i){return!!chk[ckKey(d,i)];}).length;
    var pct=ts.length>0?Math.round(dn/ts.length*100):0;
    var barCol=pct===100?'#7a9e87':pct>0?phaseColor:(dark?'#3a3a3c':'#d1d1d6');
    html+='<div class="mom-day-row'+(d===todayName?' today':'')+'">'
      +'<div class="mom-day-name">'+d.slice(0,3)+'</div>'
      +'<div class="mom-bar-track"><div class="mom-bar-fill" style="width:'+pct+'%;background:'+barCol+'"></div></div>'
      +'<div class="mom-day-pct">'+pct+'%</div>'
      +'</div>';
  });
  html+='</div>';

  // Category breakdown (worst → best)
  var catEntries=_momCatStats().sort(function(a,b){return a.pct-b.pct;});
  if(catEntries.length){
    html+='<div class="mom-section-hdr">By Category</div><div class="mom-cat-rows">';
    catEntries.forEach(function(e){
      var col=_MOM_TAG_COLORS[e.tag]||'#888888';
      var tagCode=TAGS[e.tag]||'ad';
      var barCol=e.pct===100?'#7a9e87':e.pct>0?col:(dark?'#3a3a3c':'#d1d1d6');
      html+='<div class="mom-cat-row">'
        +'<div class="mom-cat-dot" style="background:'+col+'"></div>'
        +'<div class="mom-cat-name">'+(_MOM_TAG_LABELS[e.tag]||e.tag)+'</div>'
        +'<div class="mom-bar-track"><div class="mom-bar-fill" style="width:'+e.pct+'%;background:'+barCol+'"></div></div>'
        +'<div class="mom-cat-pct">'+e.pct+'%</div>'
        +'</div>';
    });
    html+='</div>';
  }

  document.getElementById('momSec-week').innerHTML=html;
}

// ── History tab ───────────────────────────────────────────────────────────
function renderMomentumHistory(){
  var entries=Object.keys(weekScores).map(function(k){
    var n=parseInt(k.replace('gw',''),10);
    return{gw:n,pct:weekScores[k]};
  }).filter(function(e){return!isNaN(e.gw)&&typeof e.pct==='number';})
    .sort(function(a,b){return a.gw-b.gw;});

  var avgPct=entries.length?Math.round(entries.reduce(function(s,e){return s+e.pct;},0)/entries.length):0;
  var bestEntry=entries.reduce(function(b,e){return(!b||e.pct>b.pct)?e:b;},null);

  var html='<div class="mom-stat-row">'
    +'<div class="mom-stat-card"><div class="mom-stat-lbl">All-Time Avg</div><div class="mom-stat-val">'+(avgPct?avgPct+'%':'—')+'</div></div>'
    +'<div class="mom-stat-card"><div class="mom-stat-lbl">Best Week</div><div class="mom-stat-val">'+(bestEntry?'W'+bestEntry.gw+' · '+bestEntry.pct+'%':'—')+'</div></div>'
    +'</div>';

  var graphEntries=entries.slice(-12);
  var chartId='momHistCanvas';
  if(graphEntries.length>=2){
    html+='<canvas id="'+chartId+'" style="width:100%;height:130px;display:block;margin:12px 0"></canvas>';
  } else {
    html+='<div class="mom-hist-empty">Complete more weeks to see your trend.</div>';
  }

  document.getElementById('momSec-history').innerHTML=html;

  if(graphEntries.length<2)return;
  requestAnimationFrame(function(){
    var canvas=document.getElementById(chartId);
    if(!canvas)return;
    var W=canvas.parentElement.offsetWidth||300,H=130;
    canvas.width=W*window.devicePixelRatio;canvas.height=H*window.devicePixelRatio;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    var ctx=canvas.getContext('2d');ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
    var pad={l:8,r:32,t:10,b:24},iW=W-pad.l-pad.r,iH=H-pad.t-pad.b;
    var vals=graphEntries.map(function(e){return e.pct;});
    var xP=function(i){return pad.l+i*(iW/(vals.length-1));};
    var yP=function(v){return pad.t+iH*(1-v/100);};
    ctx.clearRect(0,0,W,H);
    // Grid at 25/50/75/100
    ctx.strokeStyle=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';ctx.lineWidth=1;
    [25,50,75,100].forEach(function(v){
      var y=yP(v);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    });
    // 90% fire threshold dotted line
    ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(212,168,83,.5)';ctx.lineWidth=1.5;
    var y90=yP(90);ctx.beginPath();ctx.moveTo(pad.l,y90);ctx.lineTo(W-pad.r,y90);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#d4a853';ctx.font='bold 8px sans-serif';ctx.textAlign='left';
    ctx.fillText('90%',W-pad.r+4,y90+3);
    // Fill
    var grad=ctx.createLinearGradient(0,pad.t,0,H);
    grad.addColorStop(0,'rgba(212,168,83,.3)');grad.addColorStop(1,'rgba(212,168,83,.02)');
    ctx.beginPath();ctx.moveTo(xP(0),yP(vals[0]));
    for(var i=1;i<vals.length;i++)ctx.lineTo(xP(i),yP(vals[i]));
    ctx.lineTo(xP(vals.length-1),H-pad.b);ctx.lineTo(xP(0),H-pad.b);
    ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    // Line
    ctx.beginPath();ctx.moveTo(xP(0),yP(vals[0]));
    for(var i=1;i<vals.length;i++)ctx.lineTo(xP(i),yP(vals[i]));
    ctx.strokeStyle='#d4a853';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
    // Dots + value labels
    vals.forEach(function(v,i){
      ctx.beginPath();ctx.arc(xP(i),yP(v),3,0,Math.PI*2);ctx.fillStyle='#d4a853';ctx.fill();
      if(i===0||i===vals.length-1||vals.length<=6){
        ctx.fillStyle=dark?'rgba(255,255,255,.5)':'rgba(0,0,0,.4)';
        ctx.font='9px sans-serif';ctx.textAlign='center';
        ctx.fillText(v+'%',xP(i),yP(v)-7);
      }
    });
    // Week labels
    ctx.fillStyle=dark?'rgba(255,255,255,.3)':'rgba(0,0,0,.3)';ctx.font='9px sans-serif';
    ctx.textAlign='left';ctx.fillText('W'+graphEntries[0].gw,pad.l,H-6);
    ctx.textAlign='right';ctx.fillText('W'+graphEntries[graphEntries.length-1].gw,W-pad.r,H-6);
  });
}

// ── Insights tab ──────────────────────────────────────────────────────────
function renderMomentumInsights(){
  var catEntries=_momCatStats();
  if(!catEntries.length){
    document.getElementById('momSec-insights').innerHTML='<div class="mom-hist-empty">No data yet — complete some tasks this week.</div>';
    return;
  }
  var sorted=catEntries.slice().sort(function(a,b){return a.pct-b.pct;});
  var worst=sorted[0];
  var best=sorted[sorted.length-1];

  var NEEDS_WORK={
    skincare:'Try laying out your products the night before to remove friction.',
    gym:'Review your schedule — identify which sessions are most at risk.',
    nutrition:'Prep more on Sunday to make weekday meals automatic.',
    supplement:'Keep supplements visible on the counter — out of sight means forgotten.',
    sleep:'Set a phone-down alarm 30 minutes before your target sleep time.',
    cardio:'Block your run on the calendar like a meeting.',
    admin:'Batch your admin tasks — do them all at once at a set time.',
    hair:'Add hair steps to your shower routine checklist.',
    shower:'Tie shower to an existing anchor — right after waking, no exceptions.'
  };
  var STRONGEST={
    nutrition:'Your meal prep is paying off — keep the Sunday routine locked in.',
    gym:'Showing up consistently is the hardest part. You\'re doing it.',
    skincare:'Daily SPF and retinol consistency compounds over months. Stay the course.',
    supplement:'Supplement consistency supports everything else — good habit anchor.',
    sleep:'Quality sleep is your best recovery tool. Protect it.',
    cardio:'Running consistency builds the base everything else stands on.'
  };

  function insightCard(title,body){
    return '<div class="bn" style="margin-bottom:12px">'
      +'<div class="bnt">'+escHtml(title)+'</div>'
      +'<div class="bnb open" style="margin-top:6px;color:var(--t2)">'+escHtml(body)+'</div>'
      +'</div>';
  }

  var worstLabel=(_MOM_TAG_LABELS[worst.tag]||worst.tag)+' · '+worst.pct+'%';
  var worstBody=NEEDS_WORK[worst.tag]||'Focus on consistency over perfection this week.';
  var bestLabel=(_MOM_TAG_LABELS[best.tag]||best.tag)+' · '+best.pct+'%';
  var bestBody=STRONGEST[best.tag]||'Your consistency here is building a real habit. Keep going.';

  document.getElementById('momSec-insights').innerHTML=
    '<div class="mom-section-hdr" style="margin-bottom:8px">Needs Work</div>'
    +insightCard(worstLabel,worstBody)
    +'<div class="mom-section-hdr" style="margin-bottom:8px">Strongest</div>'
    +insightCard(bestLabel,bestBody);
}
