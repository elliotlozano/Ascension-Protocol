'use strict';

function getSys(){
  var today=todayKey();
  var gWeek=globalWeek();
  var sched=buildSchedule(cD,cProtoMonth,gWeek);
  var schedLines=sched.map(function(t){return t.time+' — '+t.task;}).join('\n');
  var mealPrefixes=['Breakfast:','Lunch:','Dinner:','Snack:','Evening snack:'];
  var mealLines=sched.filter(function(t){
    return t.tag==='nutrition'&&mealPrefixes.some(function(p){return t.task.indexOf(p)===0;});
  }).map(function(t){return t.time+' — '+t.task;}).join('\n');
  return 'Protocol assistant for Ascension app. 30yo male, returning to fitness. V-taper, 5K races, skincare.\n'
    +'Today is '+today+'.\n'
    +'MEALS: 16 breakfasts (weekdays), 16 dinners (Mon-Thu), leftovers=lunch, Mon=cafeteria, Fri=date night, weekends=snack. Evening snack 9:30pm.\n'
    +'SCHED: Mon Push A, Tue Pull A, Wed run, Thu rest, Fri Legs+Core, Sat Push B/Pull B, Sun prep.\n'
    +'SUPS: D3/K2, Omega-3, Ashwagandha, Creatine post-gym, Citrulline pre-gym, Mag PM.\n'
    +'SKIN: AM (cleanser,VitC,SPF) PM (cleanser,retinol,moisturizer).\n'
    +'For changes output JSON: ```json{"overrides":{"din.5":"grilled salmon"}}```\n'
    +'TWO override types:\n'
    +'  1) Date-scoped (one-time, today only): bf.actual.YYYY-MM-DD, din.actual.YYYY-MM-DD, lunch.actual.YYYY-MM-DD, sn.actual.YYYY-MM-DD\n'
    +'  2) Rotation (permanent, repeating): bf.{globalWeek}.{Day}, din.{0-15}, monlunch, sn.{globalWeek}.{Day}\n'
    +'If user says "just for today" or describes a single meal change, use date-scoped key with today\'s date. If they want it going forward, use rotation key. When unclear, ask: "Just for today, or going forward?"\n'
    +'To RESTORE/REVERT a meal to its original planned value, output a JSON override with the key set to null. Example: ```json{"overrides":{"din.actual.'+today+'":null}}``` Setting a key to null deletes the override and the schedule falls back to the original rotation meal.\n'
    +'Other keys: m.{protoMonth}.{run|ret|wt|rd|label|hl}, m.{protoMonth}.rn (array), wo.{Mon|Tue|Fri|SatA|SatB}.\n'
    +'Be warm, concise, encouraging.\n\n'
    +'TODAY\'S SCHEDULE ('+cD+'):\n'+schedLines+'\n\n'
    +'TODAY\'S MEALS:\n'+mealLines;
}

function addBubble(cls,text){
  var thread=document.getElementById('chatThread');if(!thread)return;
  var div=document.createElement('div');div.className='chat-bubble '+cls;div.textContent=text;
  thread.appendChild(div);thread.scrollTop=thread.scrollHeight;return div;
}

function _correctMacroForActualOverride(mealType, newMealString){
  var dk=todayKey();
  if(!macros[dk])return;
  var day=macros[dk];
  var prefix=mealType+':';
  var removed=null, newMeals=[];
  day.meals.forEach(function(m){
    if(!removed&&m.name.indexOf(prefix)===0){removed=m;}
    else{newMeals.push(m);}
  });
  if(!removed)return;
  day.meals=newMeals;
  day.totals={cal:0,protein:0,carbs:0,fat:0};
  day.meals.forEach(function(m){['cal','protein','carbs','fat'].forEach(function(k){day.totals[k]+=m[k];});});
  var fullName=mealType+': '+newMealString;
  estimateMacros(fullName,function(est){
    if(!est)return;
    day.meals.push({name:fullName,cal:est.cal,protein:est.protein,carbs:est.carbs,fat:est.fat});
    ['cal','protein','carbs','fat'].forEach(function(k){day.totals[k]+=est[k];});
    localStorage.setItem('ac_macros',JSON.stringify(macros));
    save();
    if(document.getElementById('pageMacros').classList.contains('on'))renderMacroToday();
  });
}

function sendMsg(){
  var inp=document.getElementById('chatInp'),tx=inp.value.trim();if(!tx)return;
  inp.value='';inp.style.height='auto';
  chatHist.push({role:'user',content:tx});addBubble('u',tx);
  var btn=document.getElementById('chatSend');btn.disabled=true;
  var thinking=addBubble('thinking','Thinking…');
  fetch('https://theascensionprotocol.netlify.app/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:getSys(),messages:chatHist})})
  .then(function(r){return r.json();})
  .then(function(data){
    if(thinking&&thinking.parentNode)thinking.parentNode.removeChild(thinking);
    if(data.error){addBubble('a','Error: '+data.error.message);btn.disabled=false;return;}
    var full=(data.content||[]).map(function(b){return b.text||'';}).join('');
    var jm=full.match(/```json\s*([\s\S]*?)```/);
    if(jm){try{var parsed=JSON.parse(jm[1].trim());if(parsed.overrides){var dk=todayKey();Object.keys(parsed.overrides).forEach(function(k){var v=parsed.overrides[k];if(v===null){delete ovr[k];}else{ovr[k]=v;var am=k.match(/^(bf|din|lunch|sn)\.actual\.(.+)$/);if(am&&am[2]===dk)_correctMacroForActualOverride(am[1],v);}});}}catch(e){}}
    var clean=full.replace(/```json[\s\S]*?```/g,'').trim();
    addBubble('a',clean);
    chatHist.push({role:'assistant',content:full});
    if(chatHist.length>25)chatHist=chatHist.slice(chatHist.length-25);
    save();renderPlanner();
  }).catch(function(){
    if(thinking&&thinking.parentNode)thinking.parentNode.removeChild(thinking);
    addBubble('a',"Couldn't connect — check your internet.");
  })
  .finally(function(){btn.disabled=false;});
}
