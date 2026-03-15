'use strict';

// ── helpers ────────────────────────────────────────────────────────────────
function todayKey(){
  var d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function getMacroDay(dk){
  if(!macros[dk])macros[dk]={meals:[],totals:{cal:0,protein:0,carbs:0,fat:0}};
  return macros[dk];
}
function macroRingColor(pct){
  // amber → green linear interpolation
  var t=Math.min(pct,1);
  var r=Math.round(212+(122-212)*t);
  var g=Math.round(168+(158-168)*t);
  var b=Math.round(83 +(135-83)*t);
  return 'rgb('+r+','+g+','+b+')';
}
function macroBarColor(key){
  if(key==='protein')return'#6b8cae';
  if(key==='carbs')  return'#7a9e87';
  if(key==='fat')    return'#a89530';
  return'var(--a)';
}
function last7Days(){
  var days=[];
  for(var i=6;i>=0;i--){
    var d=new Date();d.setDate(d.getDate()-i);
    var dk=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    var label=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    days.push({dk:dk,label:label});
  }
  return days;
}

// ── AI macro estimation ────────────────────────────────────────────────────
function estimateMacros(mealName, cb){
  // strip "Leftovers: " prefix for cache key consistency
  var cacheKey=mealName.replace(/^leftovers:\s*/i,'').toLowerCase().trim();
  if(macroCache[cacheKey]){cb(macroCache[cacheKey]);return;}
  var prompt='Estimate macronutrients for this meal: "'+mealName+'". Reply with ONLY a JSON object, no markdown, no explanation. Format: {"cal":NUMBER,"protein":NUMBER,"carbs":NUMBER,"fat":NUMBER}. All values should be integers representing a reasonable single serving.';
  fetch('https://theascensionprotocol.netlify.app/.netlify/functions/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:80,system:'You are a nutrition expert. Respond only with valid JSON.',messages:[{role:'user',content:prompt}]})
  }).then(function(r){return r.json();}).then(function(data){
    try{
      var txt=data.content[0].text.trim();
      // strip potential markdown code fences
      txt=txt.replace(/^```[a-z]*\n?/,'').replace(/```$/,'').trim();
      var est=JSON.parse(txt);
      if(typeof est.cal==='number'){
        macroCache[cacheKey]=est;
        localStorage.setItem('ac_mcache',JSON.stringify(macroCache));
        cb(est);
      } else cb(null);
    }catch(e){cb(null);}
  }).catch(function(){cb(null);});
}

// Called from planner toggleTask when a meal task is checked
function logMealMacro(mealName){
  var dk=todayKey();
  var day=getMacroDay(dk);
  // idempotency: skip if meal already logged today
  for(var i=0;i<day.meals.length;i++){
    if(day.meals[i].name.toLowerCase()===mealName.toLowerCase())return;
  }
  estimateMacros(mealName,function(est){
    if(!est)return;
    var day2=getMacroDay(dk); // re-fetch in case async
    day2.meals.push({name:mealName,cal:est.cal,protein:est.protein,carbs:est.carbs,fat:est.fat});
    day2.totals.cal    +=est.cal;
    day2.totals.protein+=est.protein;
    day2.totals.carbs  +=est.carbs;
    day2.totals.fat    +=est.fat;
    localStorage.setItem('ac_macros',JSON.stringify(macros));
    save();
    // refresh macro page if open
    if(document.getElementById('pageMacros').classList.contains('on'))renderMacroToday();
  });
}

// ── sub-page navigation ────────────────────────────────────────────────────
var _macTab='today';
function openMacroPage(){
  document.getElementById('pageMetricsMain').classList.remove('on');
  document.getElementById('pageMacros').classList.add('on');
  selMacroTab(_macTab);
}
function closeMacroPage(){
  document.getElementById('pageMacros').classList.remove('on');
  document.getElementById('pageMetricsMain').classList.add('on');
}
function selMacroTab(t){
  _macTab=t;
  ['today','week','insights'].forEach(function(id){
    document.getElementById('macTab-'+id).classList.toggle('on',id===t);
    document.getElementById('macSec-'+id).style.display=(id===t?'block':'none');
  });
  if(t==='today')    renderMacroToday();
  else if(t==='week')renderMacroWeek();
  else               renderMacroInsights();
}

// ── Today tab ─────────────────────────────────────────────────────────────
function renderMacroToday(){
  var dk=todayKey();
  var day=getMacroDay(dk);
  var tgt=calcMacros();
  var tot=day.totals;
  var calPct=tgt.cal?Math.min(tot.cal/tgt.cal,1):0;
  var ringColor=macroRingColor(calPct);

  // SVG ring
  var R=54,stroke=10,circ=2*Math.PI*R;
  var dash=Math.round(calPct*circ);
  var svgRing='<svg width="128" height="128" viewBox="0 0 128 128" style="display:block;margin:0 auto 8px">'
    +'<circle cx="64" cy="64" r="'+R+'" fill="none" stroke="'+(dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.08)')+'" stroke-width="'+stroke+'"/>'
    +'<circle cx="64" cy="64" r="'+R+'" fill="none" stroke="'+ringColor+'" stroke-width="'+stroke+'" stroke-linecap="round"'
    +' stroke-dasharray="'+dash+' '+circ+'" stroke-dashoffset="0" transform="rotate(-90 64 64)"'
    +' style="transition:stroke-dasharray .6s ease"/>'
    +'<text x="64" y="58" text-anchor="middle" font-size="22" font-weight="700" fill="'+(dark?'#fff':'#111')+'">'+tot.cal+'</text>'
    +'<text x="64" y="74" text-anchor="middle" font-size="11" fill="'+(dark?'rgba(255,255,255,.5)':'rgba(0,0,0,.4)')+'">of '+tgt.cal+' kcal</text>'
    +'</svg>';

  // macro bars
  var bars=['protein','carbs','fat'].map(function(k){
    var val=tot[k]||0,target=tgt[k]||1;
    var pct=Math.min(val/target,1)*100;
    var col=macroBarColor(k);
    return '<div class="mac-bar-row">'
      +'<div class="mac-bar-label">'+k.charAt(0).toUpperCase()+k.slice(1)+'</div>'
      +'<div class="mac-bar-track"><div class="mac-bar-fill" style="width:'+pct+'%;background:'+col+'"></div></div>'
      +'<div class="mac-bar-val" style="color:'+col+'">'+val+'<span>/'+tgt[k]+'g</span></div>'
      +'</div>';
  }).join('');

  // meals list
  var mealsHtml=day.meals.length
    ? day.meals.map(function(m){
        return '<div class="mac-meal-row">'
          +'<div class="mac-meal-name">'+escHtml(m.name)+'</div>'
          +'<div class="mac-meal-chips">'
          +'<span class="mac-chip" style="color:#6b8cae">P '+m.protein+'g</span>'
          +'<span class="mac-chip" style="color:#7a9e87">C '+m.carbs+'g</span>'
          +'<span class="mac-chip" style="color:#a89530">F '+m.fat+'g</span>'
          +'</div>'
          +'<div class="mac-meal-cal">'+m.cal+' kcal</div>'
          +'</div>';
      }).join('')
    : '<div style="text-align:center;color:var(--mu);padding:24px 0;font-size:14px">Check off meals in the Protocol tab to log macros.</div>';

  document.getElementById('macSec-today').innerHTML=svgRing+'<div class="mac-bars">'+bars+'</div><div class="mac-meals-list">'+mealsHtml+'</div>';
}

// ── Week tab ───────────────────────────────────────────────────────────────
function renderMacroWeek(){
  var days=last7Days();
  var tgt=calcMacros();
  var maxCal=tgt.cal*1.2||2000;

  // canvas bar chart
  var chartId='macWeekCanvas';
  var rowsHtml='<canvas id="'+chartId+'" style="width:100%;height:110px;display:block;margin-bottom:16px"></canvas>';

  // day rows
  rowsHtml+=days.map(function(day){
    var d=macros[day.dk]||{totals:{cal:0,protein:0}};
    var tot=d.totals||{cal:0,protein:0};
    var pct=maxCal?Math.round(tot.cal/tgt.cal*100):0;
    var dk=day.dk;
    var isToday=(dk===todayKey());
    return '<div class="mac-week-row'+(isToday?' today':'')+'">'
      +'<div class="mac-week-date">'+day.label+'<span>'+(isToday?'Today':dk.slice(5).replace('-','/'+''))+'</span></div>'
      +'<div class="mac-week-bars"><div style="height:4px;border-radius:2px;background:var(--brd);overflow:hidden"><div style="height:100%;width:'+Math.min(pct,100)+'%;background:'+macroRingColor(tot.cal/tgt.cal||0)+';border-radius:2px"></div></div></div>'
      +'<div class="mac-week-right"><div class="mac-week-kcal">'+tot.cal+'</div><div class="mac-week-prot">P '+tot.protein+'g</div></div>'
      +'</div>';
  }).join('');

  document.getElementById('macSec-week').innerHTML=rowsHtml;

  // draw canvas chart
  requestAnimationFrame(function(){
    var canvas=document.getElementById(chartId);
    if(!canvas)return;
    var W=canvas.parentElement.offsetWidth||300,H=110;
    canvas.width=W*window.devicePixelRatio;canvas.height=H*window.devicePixelRatio;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    var ctx=canvas.getContext('2d');ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
    var padB=20,padT=8,barW=Math.floor((W-16)/7)-4,gap=4;
    var startX=8;
    ctx.clearRect(0,0,W,H);
    // target line
    var ty=padT+(H-padT-padB)*(1-1); // at 100%
    // draw bars
    days.forEach(function(day,i){
      var d=macros[day.dk]||{totals:{cal:0}};
      var tot=(d.totals||{cal:0});
      var pct=Math.min(tot.cal/tgt.cal,1.2)||0;
      var bh=Math.max(2,Math.round(pct*(H-padT-padB)));
      var x=startX+i*(barW+gap);
      var y=H-padB-bh;
      var col=macroRingColor(tot.cal/tgt.cal||0);
      ctx.fillStyle=col;
      if(ctx.roundRect)ctx.roundRect(x,y,barW,bh,2);
      else ctx.rect(x,y,barW,bh);
      ctx.fill();
      // label
      ctx.fillStyle=dark?'rgba(255,255,255,.35)':'rgba(0,0,0,.35)';
      ctx.font='9px sans-serif';ctx.textAlign='center';
      ctx.fillText(day.label,x+barW/2,H-5);
    });
    // target dashed line at tgt.cal height
    var lineY=H-padB;
    ctx.setLineDash([3,3]);
    ctx.strokeStyle=dark?'rgba(255,255,255,.15)':'rgba(0,0,0,.12)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(8,lineY);ctx.lineTo(W-8,lineY);ctx.stroke();
    ctx.setLineDash([]);
  });
}

// ── Insights tab ───────────────────────────────────────────────────────────
function renderMacroInsights(){
  var days=last7Days();
  var tgt=calcMacros();

  // calc stats
  var logged=days.filter(function(d){return macros[d.dk]&&macros[d.dk].totals&&macros[d.dk].totals.cal>0;});
  var avgCal=logged.length?Math.round(logged.reduce(function(s,d){return s+(macros[d.dk].totals.cal||0);},0)/logged.length):0;
  var avgProt=logged.length?Math.round(logged.reduce(function(s,d){return s+(macros[d.dk].totals.protein||0);},0)/logged.length):0;
  var onTarget=logged.filter(function(d){var c=macros[d.dk].totals.cal;return c>=tgt.cal*0.85&&c<=tgt.cal*1.15;}).length;
  var consistencyPct=days.length?Math.round(logged.length/days.length*100):0;

  function card(title,stat,sub,nudge){
    return '<div class="insight-card">'
      +'<div class="insight-title">'+title+'</div>'
      +'<div class="insight-stat">'+stat+'<span class="insight-pct">'+sub+'</span></div>'
      +'<div class="insight-nudge">'+nudge+'</div>'
      +'</div>';
  }

  var calDiff=avgCal-tgt.cal;
  var calNudge=avgCal===0?'Check off meals in the Protocol tab to start tracking.'
    :calDiff>200?'Running a surplus — consider reducing evening snacks.'
    :calDiff<-200?'Running a deficit — fuel your training with quality carbs.'
    :'On target. Keep it up.';

  var protNudge=avgProt===0?'Protein tracking begins when you log meals.'
    :avgProt<tgt.protein*0.8?'Protein is low. Add a shake or Greek yogurt post-workout.'
    :avgProt>tgt.protein*1.2?'Protein is high — ensure adequate hydration.'
    :'Protein intake is solid.';

  var conNudge=consistencyPct===0?'Log your first meal today.'
    :consistencyPct<50?'Sporadic logging. Aim to check meals daily in Protocol.'
    :consistencyPct<80?'Good effort. Push for 7-day streaks.'
    :'Excellent consistency.';

  document.getElementById('macSec-insights').innerHTML=
    card('Avg Daily Calories',avgCal?avgCal+' kcal':' — ',avgCal?'target '+tgt.cal:'no data',calNudge)
    +card('Avg Daily Protein',avgProt?avgProt+'g':' — ',avgProt?'target '+tgt.protein+'g':'no data',protNudge)
    +card('7-Day Consistency',consistencyPct+'%',onTarget+'/'+days.length+' on target',conNudge);
}
