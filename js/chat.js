'use strict';

var SYS='Protocol assistant for Ascension app. 30yo male, returning to fitness. V-taper, 5K races, skincare.\n'
  +'MEALS: 16 breakfasts (weekdays), 16 dinners (Mon-Thu), leftovers=lunch, Mon=cafeteria, Fri=date night, weekends=snack. Evening snack 9:30pm.\n'
  +'SCHED: Mon Push A, Tue Pull A, Wed run, Thu rest, Fri Legs+Core, Sat Push B/Pull B, Sun prep.\n'
  +'SUPS: D3/K2, Omega-3, Ashwagandha, Creatine post-gym, Citrulline pre-gym, Mag PM.\n'
  +'SKIN: AM (cleanser,VitC,SPF) PM (cleanser,retinol,moisturizer).\n'
  +'For changes output JSON: ```json{"overrides":{"din.5":"grilled salmon"}}```\n'
  +'Override keys: bf.{globalWeek}.{Day}, din.{0-15}, monlunch, sn.{globalWeek}.{Day}, m.{protoMonth}.{run|ret|wt|rd|label|hl}, m.{protoMonth}.rn (array), wo.{Mon|Tue|Fri|SatA|SatB}.\n'
  +'Be warm, concise, encouraging.';

function addBubble(cls,text){
  var thread=document.getElementById('chatThread');if(!thread)return;
  var div=document.createElement('div');div.className='chat-bubble '+cls;div.textContent=text;
  thread.appendChild(div);thread.scrollTop=thread.scrollHeight;return div;
}

function sendMsg(){
  var inp=document.getElementById('chatInp'),tx=inp.value.trim();if(!tx)return;
  inp.value='';inp.style.height='auto';
  chatHist.push({role:'user',content:tx});addBubble('u',tx);
  var btn=document.getElementById('chatSend');btn.disabled=true;
  var thinking=addBubble('thinking','Thinking…');
  fetch('https://theascensionprotocol.netlify.app/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:SYS,messages:chatHist})})
  .then(function(r){return r.json();})
  .then(function(data){
    if(thinking&&thinking.parentNode)thinking.parentNode.removeChild(thinking);
    if(data.error){addBubble('a','Error: '+data.error.message);btn.disabled=false;return;}
    var full=(data.content||[]).map(function(b){return b.text||'';}).join('');
    var jm=full.match(/```json\s*([\s\S]*?)```/);
    if(jm){try{var parsed=JSON.parse(jm[1].trim());if(parsed.overrides){Object.keys(parsed.overrides).forEach(function(k){ovr[k]=parsed.overrides[k];});}}catch(e){}}
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
