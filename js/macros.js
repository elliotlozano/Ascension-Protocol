'use strict';

var _macroSwipedRow = null;

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
  var t=Math.min(pct,1);
  var r=Math.round(212+(122-212)*t);
  var g=Math.round(168+(158-168)*t);
  var b=Math.round(83+(135-83)*t);
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
function estimateMacros(mealName,cb){
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
  for(var i=0;i<day.meals.length;i++){
    if(day.meals[i].name.toLowerCase()===mealName.toLowerCase())return;
  }
  estimateMacros(mealName,function(est){
    if(!est)return;
    var day2=getMacroDay(dk);
    day2.meals.push({name:mealName,cal:est.cal,protein:est.protein,carbs:est.carbs,fat:est.fat});
    day2.totals.cal    +=est.cal;
    day2.totals.protein+=est.protein;
    day2.totals.carbs  +=est.carbs;
    day2.totals.fat    +=est.fat;
    localStorage.setItem('ac_macros',JSON.stringify(macros));
    save();
    if(document.getElementById('pageMacros').classList.contains('on'))renderMacroToday();
  });
}

// ── Sub-page navigation ────────────────────────────────────────────────────
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
var _macManualType='Breakfast';

function renderMacroToday(){
  _macroSwipedRow=null;
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

  // Macro bars
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

  // Meals list
  var mealsHtml=day.meals.length
    ? day.meals.map(function(m,mi){
        return '<div class="mac-meal-wrap">'
          +'<button class="mac-del-reveal-btn" onclick="deleteMacroMeal('+mi+')">Delete</button>'
          +'<div class="mac-meal-row" id="macMealRow-'+mi+'">'
          +'<div class="mac-meal-name">'+escHtml(m.name)+'</div>'
          +'<div class="mac-meal-chips">'
          +'<span class="mac-chip" style="color:#6b8cae">P '+m.protein+'g</span>'
          +'<span class="mac-chip" style="color:#7a9e87">C '+m.carbs+'g</span>'
          +'<span class="mac-chip" style="color:#a89530">F '+m.fat+'g</span>'
          +'</div>'
          +'<div class="mac-meal-cal">'+m.cal+' kcal</div>'
          +'</div>'
          +'<button class="hover-del-btn" onclick="deleteMacroMeal('+mi+')" tabindex="-1">×</button>'
          +'</div>';
      }).join('')
    : '<div class="mac-empty">No meals logged yet — check off nutrition tasks in the Protocol tab.</div>';

  // Manual entry form
  var types=['Breakfast','Lunch','Dinner','Snack'];
  var typePills=types.map(function(t){
    return '<button class="mac-type-pill'+(t===_macManualType?' on':'')+'" onclick="selMacMealType(\''+t+'\')">'+t+'</button>';
  }).join('');

  var addHtml=''
    +'<div class="mac-add-row" id="macAddRow" onclick="toggleMacManual()">'
    +'<span class="mac-add-plus">+</span>'
    +'<span class="mac-add-label">Add a meal...</span>'
    +'</div>'
    +'<div class="mac-add-form" id="macAddForm" style="display:none">'
    +'<input class="mac-add-inp" id="macAddName" type="text" placeholder="Meal name (e.g. Grilled chicken and rice)">'
    +'<input class="mac-add-inp" id="macAddIngr" type="text" placeholder="Ingredients (e.g. 6oz chicken, 1 cup rice, broccoli)">'
    +'<div class="mac-type-pills">'+typePills+'</div>'
    +'<button class="mac-add-submit" id="macAddSubmit" onclick="addManualMeal()">Add</button>'
    +'<div style="text-align:center;margin-top:8px"><button class="mac-cancel-btn" onclick="closeMacManual()">Cancel</button></div>'
    +'</div>';

  document.getElementById('macSec-today').innerHTML=svgRing
    +'<div class="mac-bars">'+bars+'</div>'
    +'<div style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);margin:16px 0 8px">Today\'s Meals</div>'
    +'<div class="mac-meals-list">'+mealsHtml+'</div>'
    +addHtml;
  day.meals.forEach(function(_,mi){attachMacroSwipe(mi);});
}

function toggleMacManual(){
  var f=document.getElementById('macAddForm');
  if(!f)return;
  var open=f.style.display!=='none';
  f.style.display=open?'none':'block';
  if(!open){var inp=document.getElementById('macAddName');if(inp)inp.focus();}
}
function closeMacManual(){
  var f=document.getElementById('macAddForm');
  if(f)f.style.display='none';
}
function selMacMealType(t){
  _macManualType=t;
  document.querySelectorAll('.mac-type-pill').forEach(function(b){
    b.classList.toggle('on',b.textContent===t);
  });
}
function addManualMeal(){
  var nameInp=document.getElementById('macAddName');
  var ingrInp=document.getElementById('macAddIngr');
  var btn=document.getElementById('macAddSubmit');
  if(!nameInp)return;
  var name=nameInp.value.trim();
  if(!name)return;
  var ingr=ingrInp?ingrInp.value.trim():'';
  var fullDesc=_macManualType+': '+name+(ingr?'. Ingredients: '+ingr:'');
  var displayName=_macManualType+': '+name;
  if(btn){btn.textContent='Estimating…';btn.disabled=true;}
  estimateMacros(fullDesc,function(est){
    if(btn){btn.textContent='Add';btn.disabled=false;}
    if(!est){if(btn)btn.textContent='Failed — try again';return;}
    var dk=todayKey();
    var day=getMacroDay(dk);
    day.meals.push({name:displayName,cal:est.cal,protein:est.protein,carbs:est.carbs,fat:est.fat});
    day.totals.cal    +=est.cal;
    day.totals.protein+=est.protein;
    day.totals.carbs  +=est.carbs;
    day.totals.fat    +=est.fat;
    localStorage.setItem('ac_macros',JSON.stringify(macros));
    save();
    renderMacroToday();
    var addRow=document.getElementById('macAddRow');
    if(addRow)showSavedFlash(addRow,'✓ Added');
  });
}

// ── Week tab ───────────────────────────────────────────────────────────────
function renderMacroWeek(){
  var days=last7Days();
  var tgt=calcMacros();
  var chartId='macWeekCanvas';

  // Day rows
  var rowsHtml='<canvas id="'+chartId+'" style="width:100%;height:170px;display:block;margin-bottom:16px"></canvas>';
  rowsHtml+=days.map(function(day){
    var d=macros[day.dk]||{totals:{cal:0,protein:0}};
    var tot=d.totals||{cal:0,protein:0};
    var pct=tgt.cal?Math.round(tot.cal/tgt.cal*100):0;
    var isToday=(day.dk===todayKey());
    var barCol=tot.cal>=tgt.cal?'#7a9e87':'#d4a853';
    return '<div class="mac-week-row'+(isToday?' today':'')+'">'
      +'<div class="mac-week-date">'+day.label+'<span>'+(isToday?'Today':day.dk.slice(5).replace('-','/'))+'</span></div>'
      +'<div class="mac-week-bars"><div style="height:4px;border-radius:2px;background:var(--b);overflow:hidden"><div style="height:100%;width:'+Math.min(pct,100)+'%;background:'+barCol+';border-radius:2px"></div></div></div>'
      +'<div class="mac-week-right"><div class="mac-week-kcal">'+tot.cal+'</div><div class="mac-week-prot">P '+tot.protein+'g</div></div>'
      +'</div>';
  }).join('');

  var loggedDays=days.filter(function(d){return macros[d.dk]&&macros[d.dk].totals&&macros[d.dk].totals.cal>0;});
  if(!loggedDays.length){rowsHtml+='<div style="font-size:13px;color:var(--mu);font-style:italic;text-align:center;padding:8px 0 4px">No meals logged this week yet.</div>';}
  document.getElementById('macSec-week').innerHTML=rowsHtml;

  requestAnimationFrame(function(){
    var canvas=document.getElementById(chartId);
    if(!canvas)return;
    var W=canvas.parentElement.offsetWidth||300,H=170;
    canvas.width=W*window.devicePixelRatio;canvas.height=H*window.devicePixelRatio;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    var ctx=canvas.getContext('2d');ctx.scale(window.devicePixelRatio,window.devicePixelRatio);

    var padL=34,padR=46,padT=6,padB=18;
    var iW=W-padL-padR,iH=H-padT-padB;
    var yMax=3000,yMin=0;
    var yP=function(cal){return padT+iH*(1-(cal-yMin)/(yMax-yMin));};

    ctx.clearRect(0,0,W,H);

    var gridCol=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
    var gridMinorCol=dark?'rgba(255,255,255,.03)':'rgba(0,0,0,.03)';
    var txtCol=dark?'rgba(255,255,255,.28)':'rgba(0,0,0,.28)';

    // Minor grid lines at 250 intervals
    ctx.strokeStyle=gridMinorCol;ctx.lineWidth=1;ctx.setLineDash([]);
    for(var c=250;c<3000;c+=500){
      var y=yP(c);
      ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();
    }
    // Major grid lines + Y labels at 500 intervals
    ctx.strokeStyle=gridCol;
    ctx.font='9px sans-serif';ctx.fillStyle=txtCol;
    for(var c=0;c<=3000;c+=500){
      var y=yP(c);
      ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();
      ctx.textAlign='right';
      var lbl=c===0?'0':c>=1000?(c/1000)+'k':String(c);
      ctx.fillText(lbl,padL-4,y+3);
    }

    // Bars
    var barCount=7;
    var barStep=iW/barCount;
    var barW=Math.floor(barStep*0.55);

    days.forEach(function(day,i){
      var d=macros[day.dk]||{totals:{cal:0}};
      var cal=(d.totals||{}).cal||0;
      var clampedCal=Math.min(cal,yMax);
      var bh=Math.max(clampedCal>0?2:0,Math.round((clampedCal-yMin)/(yMax-yMin)*iH));
      if(!bh)return;
      var x=padL+i*barStep+(barStep-barW)/2;
      var y=yP(clampedCal);
      var col=cal>=tgt.cal?'#7a9e87':'#d4a853';
      ctx.fillStyle=col;
      if(ctx.roundRect)ctx.roundRect(x,y,barW,bh,2);
      else ctx.rect(x,y,barW,bh);
      ctx.fill();
    });

    // Day labels
    ctx.fillStyle=dark?'rgba(255,255,255,.35)':'rgba(0,0,0,.35)';
    ctx.font='9px sans-serif';
    days.forEach(function(day,i){
      var x=padL+i*barStep+barStep/2;
      ctx.textAlign='center';
      ctx.fillText(day.label,x,H-4);
    });

    // Target dotted line
    var ty=yP(tgt.cal);
    ctx.setLineDash([4,3]);
    ctx.strokeStyle='rgba(212,168,83,.6)';
    ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(padL,ty);ctx.lineTo(W-padR,ty);ctx.stroke();
    ctx.setLineDash([]);
    // Target label
    ctx.fillStyle='#d4a853';
    ctx.font='bold 9px sans-serif';ctx.textAlign='left';
    ctx.fillText('target',W-padR+4,ty+3);
  });
}

// ── Macro meal delete & swipe ──────────────────────────────────────────────
function deleteMacroMeal(idx){
  _macroSwipedRow=null;
  var dk=todayKey();
  if(!macros[dk])return;
  var day=macros[dk];
  day.meals.splice(idx,1);
  day.totals={cal:0,protein:0,carbs:0,fat:0};
  day.meals.forEach(function(m){['cal','protein','carbs','fat'].forEach(function(k){day.totals[k]+=(m[k]||0);});});
  localStorage.setItem('ac_macros',JSON.stringify(macros));
  save();
  renderMacroToday();
}
function attachMacroSwipe(idx){
  var row=document.getElementById('macMealRow-'+idx);
  if(!row)return;
  var startX,startY,tracking=false,wasOpen=false;
  row.addEventListener('touchstart',function(e){
    if(_macroSwipedRow&&_macroSwipedRow!==row){
      _macroSwipedRow.style.transition='transform .2s ease';
      _macroSwipedRow.style.transform='';
      var sr=_macroSwipedRow;
      setTimeout(function(){sr.style.transition='';},220);
      _macroSwipedRow=null;
    }
    wasOpen=(_macroSwipedRow===row);
    startX=e.touches[0].clientX;startY=e.touches[0].clientY;tracking=false;
  },{passive:true});
  row.addEventListener('touchmove',function(e){
    var dx=e.touches[0].clientX-startX;
    var dy=Math.abs(e.touches[0].clientY-startY);
    if(!tracking&&(Math.abs(dx)>6||dy>6)){tracking=Math.abs(dx)>dy;}
    if(!tracking)return;
    var base=wasOpen?-80:0;
    row.style.transform='translateX('+Math.max(-80,Math.min(0,base+dx))+'px)';
  },{passive:true});
  row.addEventListener('touchend',function(e){
    if(!tracking)return;
    var dx=e.changedTouches[0].clientX-startX;
    var finalX=(wasOpen?-80:0)+dx;
    row.style.transition='transform .2s ease';
    if(finalX<-40){row.style.transform='translateX(-80px)';_macroSwipedRow=row;}
    else{row.style.transform='';if(_macroSwipedRow===row)_macroSwipedRow=null;}
    setTimeout(function(){row.style.transition='';},220);
  },{passive:true});
}

// ── Insights tab ───────────────────────────────────────────────────────────
function renderMacroInsights(){
  var days=last7Days();
  var tgt=calcMacros();
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
  var calNudge=avgCal===0?'No meals logged yet — check off nutrition tasks in the Protocol tab.'
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
    card('Avg Daily Calories',avgCal?avgCal+' kcal':'—',avgCal?'· target '+tgt.cal:'no data',calNudge)
    +card('Avg Daily Protein',avgProt?avgProt+'g':'—',avgProt?'· target '+tgt.protein+'g':'no data',protNudge)
    +card('7-Day Consistency',consistencyPct+'%',onTarget+'/'+days.length+' on target',conNudge);
}
