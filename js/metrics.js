'use strict';

var BIOF=[{k:'weight',l:'Weight',u:'lbs'},{k:'bodyfat',l:'Body Fat',u:'%'},{k:'waist',l:'Waist',u:'in'},{k:'chest',l:'Chest',u:'in'},{k:'shoulders',l:'Shoulders',u:'in'},{k:'bicep',l:'Bicep',u:'in'}];
var LIFTS=[{k:'squat',l:'Back Squat'},{k:'bench',l:'Bench Press'},{k:'deadlift',l:'Deadlift'},{k:'ohp',l:'Overhead Press'},{k:'row',l:'Barbell Row'},{k:'pullup',l:'Weighted Pull-up'}];
var RUNS=[{k:'mile',l:'1 Mile'},{k:'fivek',l:'5K'},{k:'run30',l:'30-min dist'}];

function calcMacros(){
  var w=bio.weight||150,bf=bio.bodyfat||20;
  var lbm=w*(1-bf/100);
  var bmr=10*(w*0.453592)+6.25*177.8-5*30+5;
  var tdee=Math.round(bmr*1.55);
  var protein=Math.round(lbm);
  var fat=Math.round(w*0.4);
  var carbs=Math.max(50,Math.round((tdee-fat*9-protein*4)/4));
  return{cal:tdee,protein:protein,carbs:carbs,fat:fat};
}
function renderMetrics(){
  var mac=calcMacros();
  // Feature 4: removed "· auto-calculated" from label
  document.getElementById('macroCard').innerHTML='<div class="mac-card-hdr ct" onclick="openMacroPage()" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between">Daily Targets<span style="font-size:18px;opacity:.5">›</span></div><div class="mrow"><div><div class="mlbl">Calories</div><div class="msub">'+(bio.weight||150)+'lb · '+(bio.bodyfat||20)+'% BF</div></div><div class="mval">'+mac.cal+'</div></div><div class="mtrk"><div class="mfil" style="width:100%;background:var(--a)"></div></div><div class="mgrd"><div class="mitm"><div class="miv" style="color:#6b8cae">'+mac.protein+'g</div><div class="mik">Protein</div></div><div class="mitm"><div class="miv" style="color:#7a9e87">'+mac.carbs+'g</div><div class="mik">Carbs</div></div><div class="mitm"><div class="miv" style="color:#a89530">'+mac.fat+'g</div><div class="mik">Fat</div></div></div>';
  var bgHtml='';BIOF.forEach(function(f){bgHtml+='<div class="bio-f"><div class="bio-l">'+f.l+'</div><div class="bio-v">'+(bio[f.k]||'—')+'</div><div class="bio-u">'+f.u+'</div></div>';});
  document.getElementById('bioGrid').innerHTML=bgHtml;
  var biHtml='';BIOF.forEach(function(f){biHtml+='<div class="bio-row"><span class="bio-rl">'+f.l+' ('+f.u+')</span><input class="inp" id="biin-'+f.k+'" type="number" placeholder="'+(bio[f.k]||'')+'" step="0.1" style="max-width:110px"></div>';});
  document.getElementById('bioInputs').innerHTML=biHtml;
  document.getElementById('bioInputs').className='bio-inputs'+(bioEditing?' open':'');
  document.getElementById('bioBtn').textContent=bioEditing?'✓':'✎';
  var lHtml='';LIFTS.forEach(function(lf){var pr=prs[lf.k];lHtml+='<div class="pr-row"><div><div class="pr-name">'+lf.l+'</div>'+(pr?'<div class="pr-date">'+pr.d+'</div>':'')+'</div><div style="text-align:right"><div class="pr-val">'+(pr?pr.v+' lbs':'—')+'</div><div class="pr-inp-row" id="prrow-'+lf.k+'"><input class="inp" id="prin-'+lf.k+'" type="number" placeholder="lbs" style="width:80px;text-align:right"><button class="ok-btn" onclick="savePR(\''+lf.k+'\',\'lift\')">✓</button></div><button class="pr-btn" onclick="togglePRInput(\''+lf.k+'\')">'+(pr?'✎':'+')+'</button></div></div>';});
  document.getElementById('liftPRs').innerHTML=lHtml;
  var rHtml='';RUNS.forEach(function(r){var pr=prs[r.k];rHtml+='<div class="pr-row"><div><div class="pr-name">'+r.l+'</div>'+(pr?'<div class="pr-date">'+pr.d+'</div>':'')+'</div><div style="text-align:right"><div class="pr-val">'+(pr?pr.v:'—')+'</div><div class="pr-inp-row" id="prrow-'+r.k+'"><input class="inp" id="prin-'+r.k+'" type="text" placeholder="MM:SS" style="width:90px;text-align:right"><button class="ok-btn" onclick="savePR(\''+r.k+'\',\'run\')">✓</button></div><button class="pr-btn" onclick="togglePRInput(\''+r.k+'\')">'+(pr?'✎':'+')+'</button></div></div>';});
  document.getElementById('runPRs').innerHTML=rHtml;
  drawWeightGraph();
}
function toggleBioEdit(){
  if(bioEditing){BIOF.forEach(function(f){var inp=document.getElementById('biin-'+f.k);if(inp&&inp.value.trim()){bio[f.k]=inp.value.trim();if(f.k==='weight'){if(!bio.wtHist)bio.wtHist=[];bio.wtHist.unshift({v:bio[f.k],d:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})});if(bio.wtHist.length>20)bio.wtHist.pop();}}});save();}
  bioEditing=!bioEditing;renderMetrics();
}
function togglePRInput(k){var row=document.getElementById('prrow-'+k);if(row)row.classList.toggle('open');var inp=document.getElementById('prin-'+k);if(inp&&row.classList.contains('open'))inp.focus();}
function savePR(k,type){var inp=document.getElementById('prin-'+k);if(!inp||!inp.value.trim())return;prs[k]={v:inp.value.trim(),d:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})};save();renderMetrics();}
function drawWeightGraph(){
  var wh=bio.wtHist||[],canvas=document.getElementById('wtCanvas'),empty=document.getElementById('wtEmpty');
  if(wh.length<2){canvas.style.display='none';empty.style.display='block';return;}
  canvas.style.display='block';empty.style.display='none';
  var W=canvas.parentElement.offsetWidth||300,H=120;
  canvas.width=W*window.devicePixelRatio;canvas.height=H*window.devicePixelRatio;canvas.style.width=W+'px';canvas.style.height=H+'px';
  var ctx=canvas.getContext('2d');ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
  var pts=wh.slice().reverse(),vals=pts.map(function(p){return parseFloat(p.v);}).filter(function(v){return!isNaN(v);});
  if(vals.length<2){canvas.style.display='none';empty.style.display='block';return;}
  var minV=Math.min.apply(null,vals)-2,maxV=Math.max.apply(null,vals)+2,range=maxV-minV||1;
  var pad={l:8,r:8,t:10,b:24},iW=W-pad.l-pad.r,iH=H-pad.t-pad.b;
  var xP=function(i){return pad.l+i*(iW/(vals.length-1));};
  var yP=function(v){return pad.t+iH*(1-(v-minV)/range);};
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';ctx.lineWidth=1;
  for(var g=0;g<4;g++){var gy=pad.t+(iH/3)*g;ctx.beginPath();ctx.moveTo(pad.l,gy);ctx.lineTo(W-pad.r,gy);ctx.stroke();}
  var grad=ctx.createLinearGradient(0,pad.t,0,H);grad.addColorStop(0,'rgba(212,168,83,.3)');grad.addColorStop(1,'rgba(212,168,83,.02)');
  ctx.beginPath();ctx.moveTo(xP(0),yP(vals[0]));for(var i=1;i<vals.length;i++)ctx.lineTo(xP(i),yP(vals[i]));
  ctx.lineTo(xP(vals.length-1),H-pad.b);ctx.lineTo(xP(0),H-pad.b);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();ctx.moveTo(xP(0),yP(vals[0]));for(var i=1;i<vals.length;i++)ctx.lineTo(xP(i),yP(vals[i]));
  ctx.strokeStyle='#d4a853';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
  vals.forEach(function(v,i){ctx.beginPath();ctx.arc(xP(i),yP(v),3,0,Math.PI*2);ctx.fillStyle='#d4a853';ctx.fill();if(i===0||i===vals.length-1||vals.length<=6){ctx.fillStyle=dark?'rgba(255,255,255,.5)':'rgba(0,0,0,.4)';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(v,xP(i),yP(v)-7);}});
  ctx.fillStyle=dark?'rgba(255,255,255,.3)':'rgba(0,0,0,.3)';ctx.font='9px sans-serif';
  if(pts.length){ctx.textAlign='left';ctx.fillText(pts[0].d,pad.l,H-6);}
  if(pts.length>1){ctx.textAlign='right';ctx.fillText(pts[pts.length-1].d,W-pad.r,H-6);}
}
