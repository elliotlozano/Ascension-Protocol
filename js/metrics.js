'use strict';

var BIOF=[{k:'weight',l:'Weight',u:'lbs'},{k:'bodyfat',l:'Body Fat',u:'%'},{k:'waist',l:'Waist',u:'in'},{k:'chest',l:'Chest',u:'in'},{k:'shoulders',l:'Shoulders',u:'in'},{k:'bicep',l:'Bicep',u:'in'}];
var LIFTS=[{k:'squat',l:'Back Squat'},{k:'bench',l:'Bench Press'},{k:'deadlift',l:'Deadlift'},{k:'ohp',l:'Overhead Press'},{k:'row',l:'Barbell Row'},{k:'pullup',l:'Weighted Pull-up'}];
var RUNS=[{k:'mile',l:'1 Mile'},{k:'twomile',l:'2 Mile'},{k:'fivek',l:'5K'},{k:'run30',l:'30-min dist'}];

var _bioTab='weight';
var _bioSwipedRow=null;

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
  document.getElementById('macroCard').innerHTML='<div class="mac-card-hdr ct" onclick="openMacroPage()" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between">Daily Targets<span style="font-size:18px;opacity:.5">›</span></div><div class="mrow"><div><div class="mlbl">Calories</div><div class="msub">'+(bio.weight||150)+'lb · '+(bio.bodyfat||20)+'% BF</div></div><div class="mval">'+mac.cal+'</div></div><div class="mtrk"><div class="mfil" style="width:100%;background:var(--a)"></div></div><div class="mgrd"><div class="mitm"><div class="miv" style="color:#6b8cae">'+mac.protein+'g</div><div class="mik">Protein</div></div><div class="mitm"><div class="miv" style="color:#7a9e87">'+mac.carbs+'g</div><div class="mik">Carbs</div></div><div class="mitm"><div class="miv" style="color:#a89530">'+mac.fat+'g</div><div class="mik">Fat</div></div></div>';

  // Biometrics card — tappable, shows current values
  var bcHtml='<div class="bio-hdr bio-hdr-tap" onclick="openBioPage()"><div class="ct" style="margin-bottom:0">Biometrics</div><span class="acct-chev">›</span></div>';
  BIOF.forEach(function(f){
    var val=bio[f.k];
    var hist=f.k==='weight'?(bio.wtHist||[]):f.k==='bodyfat'?(bio.bfHist||[]):null;
    var dateStr=hist&&hist.length?' · '+hist[0].d:'';
    var displayVal=val?(val+' '+f.u+dateStr):'—';
    bcHtml+='<div class="bio-sum-row"><div class="bio-sum-l">'+f.l+'</div><div class="bio-sum-r">'+escHtml(displayVal)+'</div></div>';
  });
  document.getElementById('bioCard').innerHTML=bcHtml;

  var lHtml='';LIFTS.forEach(function(lf){var pr=prs[lf.k];lHtml+='<div class="pr-row"><div><div class="pr-name">'+lf.l+'</div>'+(pr?'<div class="pr-date">'+pr.d+'</div>':'')+'</div><div style="text-align:right"><div class="pr-val">'+(pr?pr.v+' lbs':'—')+'</div><div class="pr-inp-row" id="prrow-'+lf.k+'"><input class="inp" id="prin-'+lf.k+'" type="number" placeholder="lbs" style="width:80px;text-align:right"><button class="ok-btn" onclick="savePR(\''+lf.k+'\',\'lift\')">✓</button></div><button class="pr-btn" onclick="togglePRInput(\''+lf.k+'\')">+</button></div></div>';});
  document.getElementById('liftPRs').innerHTML=lHtml;
  var rHtml='';RUNS.forEach(function(r){var pr=prs[r.k];rHtml+='<div class="pr-row"><div><div class="pr-name">'+r.l+'</div>'+(pr?'<div class="pr-date">'+pr.d+'</div>':'')+'</div><div style="text-align:right"><div class="pr-val">'+(pr?pr.v:'—')+'</div><div class="pr-inp-row" id="prrow-'+r.k+'"><input class="inp" id="prin-'+r.k+'" type="text" placeholder="MM:SS" style="width:90px;text-align:right"><button class="ok-btn" onclick="savePR(\''+r.k+'\',\'run\')">✓</button></div><button class="pr-btn" onclick="togglePRInput(\''+r.k+'\')">+</button></div></div>';});
  document.getElementById('runPRs').innerHTML=rHtml;
  _attachPRInputListeners();
}

function togglePRInput(k){
  var row=document.getElementById('prrow-'+k);if(!row)return;
  var isOpen=row.classList.contains('open');
  if(isOpen){row.classList.remove('open');}
  else{row.classList.add('open');var inp=document.getElementById('prin-'+k);if(inp)inp.focus();}
}
function savePR(k,type){var inp=document.getElementById('prin-'+k);if(!inp||!inp.value.trim())return;prs[k]={v:inp.value.trim(),d:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})};save();renderMetrics();var row=document.getElementById('prrow-'+k);if(row)showSavedFlash(row,'✓ PR saved');}
var _prTouchListenerAttached = false;
function _attachPRInputListeners(){
  LIFTS.concat(RUNS).forEach(function(item){
    var inp=document.getElementById('prin-'+item.k);
    var row=document.getElementById('prrow-'+item.k);
    if(inp&&row){
      inp.addEventListener('keydown',function(e){if(e.key==='Enter')savePR(item.k,LIFTS.indexOf(item)!==-1?'lift':'run');});
      inp.addEventListener('blur',function(){setTimeout(function(){if(row.classList)row.classList.remove('open');},150);});
    }
  });
  if(!_prTouchListenerAttached){
    _prTouchListenerAttached=true;
    document.addEventListener('touchstart',function(e){
      var openRows=document.querySelectorAll('.pr-inp-row.open');
      if(!openRows.length)return;
      openRows.forEach(function(row){
        if(!row.contains(e.target)){row.classList.remove('open');}
      });
    },{passive:true});
  }
}

// ── Biometrics sub-page ────────────────────────────────────────────────────

function openBioPage(){
  document.getElementById('pageMetricsMain').classList.remove('on');
  document.getElementById('pageBiometrics').classList.add('on');
  selBioTab(_bioTab);
}
function closeBioPage(){
  _bioSwipedRow=null;
  document.getElementById('pageBiometrics').classList.remove('on');
  document.getElementById('pageMetricsMain').classList.add('on');
}
function selBioTab(t){
  _bioTab=t;
  ['weight','bodyfat'].forEach(function(id){
    document.getElementById('bioTab-'+id).classList.toggle('on',id===t);
    document.getElementById('bioSec-'+id).style.display=(id===t?'block':'none');
  });
  renderBioTab(t);
}

function renderBioTab(t){
  _bioSwipedRow=null;
  var isWeight=(t==='weight');
  var hist=isWeight?(bio.wtHist||[]):(bio.bfHist||[]);
  var unit=isWeight?'lbs':'%';
  var sec=document.getElementById('bioSec-'+t);

  // Hero value
  var curVal=hist.length?hist[0].v:'—';

  // Delta since last entry
  var deltaHtml='';
  if(hist.length>=2){
    var diff=parseFloat(hist[0].v)-parseFloat(hist[1].v);
    if(!isNaN(diff)&&diff!==0){
      var sign=diff>0?'+':'−';
      var col=diff>0?'#7a9e87':'var(--a)';
      deltaHtml='<div class="bio-delta" style="color:'+col+'">'+sign+Math.abs(diff).toFixed(1)+' '+unit+' since last entry</div>';
    } else {
      deltaHtml='<div class="bio-delta" style="color:var(--a)">No change since last entry</div>';
    }
  } else if(hist.length===1){
    deltaHtml='<div class="bio-delta" style="color:var(--mu)">First entry</div>';
  }

  var canvasId='bioCanvas-'+t;

  // History list
  var histHtml='<div class="bio-hist-list">';
  if(hist.length){
    hist.slice(0,20).forEach(function(entry,idx){
      histHtml+='<div class="bio-hist-item">'
        +'<button class="bio-del-btn" onclick="deleteBioEntry(\''+t+'\','+idx+')">Delete</button>'
        +'<div class="bio-hist-row" id="bioHistRow-'+t+'-'+idx+'">'
        +'<span class="bio-hist-val">'+escHtml(entry.v)+' '+unit+'</span>'
        +'<span class="bio-hist-date">'+escHtml(entry.d)+'</span>'
        +'</div>'
        +'<button class="hover-del-btn" onclick="deleteBioEntry(\''+t+'\','+idx+')" tabindex="-1">×</button>'
        +'</div>';
    });
  } else {
    histHtml+='<div class="bio-hist-empty">No entries yet. Tap your current value above to log your first.</div>';
  }
  histHtml+='</div>';

  sec.innerHTML=''
    +'<div class="bio-hero" id="bioHero-'+t+'" onclick="editBioHero(\''+t+'\')">'
    +'<div class="bio-hero-val">'+escHtml(String(curVal))+'</div>'
    +'<div class="bio-hero-unit">'+unit+'</div>'
    +'</div>'
    +deltaHtml
    +'<div class="bio-graph-wrap"><canvas id="'+canvasId+'" style="display:block"></canvas>'
    +'<div id="'+canvasId+'Empty" class="bio-graph-empty">Log two or more entries to see your trend.</div>'
    +'</div>'
    +histHtml;

  requestAnimationFrame(function(){
    drawBioGraph(canvasId,hist,t);
  });

  hist.slice(0,20).forEach(function(_,idx){
    attachBioSwipe(t,idx);
  });
}

function editBioHero(t){
  var heroEl=document.getElementById('bioHero-'+t);
  if(!heroEl)return;
  var isWeight=(t==='weight');
  var unit=isWeight?'lbs':'%';
  var step=isWeight?'0.5':'0.1';
  heroEl.onclick=null;
  heroEl.innerHTML='<div class="bio-hero-edit-row">'
    +'<input class="bio-hero-inp" id="bioHeroInp-'+t+'" type="number" step="'+step+'" inputmode="decimal" placeholder="0" autofocus>'
    +'<span class="bio-hero-edit-unit">'+unit+'</span>'
    +'<button class="bio-hero-save ok-btn" onclick="saveBioEntry(\''+t+'\')">✓</button>'
    +'</div>';
  var inp=document.getElementById('bioHeroInp-'+t);
  if(inp){
    inp.focus();
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')saveBioEntry(t);});
  }
}

function saveBioEntry(t){
  var inp=document.getElementById('bioHeroInp-'+t);
  if(!inp||!inp.value.trim())return;
  var val=parseFloat(inp.value.trim());
  if(isNaN(val)||val<=0)return;
  var isWeight=(t==='weight');
  var d=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'});
  var entry={v:String(val),d:d};
  if(isWeight){
    if(!bio.wtHist)bio.wtHist=[];
    bio.wtHist.unshift(entry);
    if(bio.wtHist.length>20)bio.wtHist.pop();
    bio.weight=String(val);
  } else {
    if(!bio.bfHist)bio.bfHist=[];
    bio.bfHist.unshift(entry);
    if(bio.bfHist.length>20)bio.bfHist.pop();
    bio.bodyfat=String(val);
  }
  save();
  renderBioTab(t);
  renderMetrics();
  var heroEl=document.getElementById('bioHero-'+t);
  if(heroEl)showSavedFlash(heroEl);
}

function deleteBioEntry(t,idx){
  var isWeight=(t==='weight');
  if(isWeight){
    if(!bio.wtHist)return;
    bio.wtHist.splice(idx,1);
    bio.weight=bio.wtHist.length?bio.wtHist[0].v:null;
  } else {
    if(!bio.bfHist)return;
    bio.bfHist.splice(idx,1);
    bio.bodyfat=bio.bfHist.length?bio.bfHist[0].v:null;
  }
  save();
  renderBioTab(t);
  renderMetrics();
}

// ── Swipe-to-delete ────────────────────────────────────────────────────────

function attachBioSwipe(t,idx){
  var row=document.getElementById('bioHistRow-'+t+'-'+idx);
  if(!row)return;
  var startX,startY,tracking=false,wasOpen=false;

  row.addEventListener('touchstart',function(e){
    // snap back any other open row
    if(_bioSwipedRow&&_bioSwipedRow!==row){
      _bioSwipedRow.style.transition='transform .2s ease';
      _bioSwipedRow.style.transform='';
      var sr=_bioSwipedRow;
      setTimeout(function(){sr.style.transition='';},220);
      _bioSwipedRow=null;
    }
    wasOpen=(_bioSwipedRow===row);
    startX=e.touches[0].clientX;
    startY=e.touches[0].clientY;
    tracking=false;
  },{passive:true});

  row.addEventListener('touchmove',function(e){
    var dx=e.touches[0].clientX-startX;
    var dy=Math.abs(e.touches[0].clientY-startY);
    if(!tracking&&(Math.abs(dx)>6||dy>6)){
      tracking=Math.abs(dx)>dy;
    }
    if(!tracking)return;
    var base=wasOpen?-80:0;
    var x=Math.max(-80,Math.min(0,base+dx));
    row.style.transform='translateX('+x+'px)';
  },{passive:true});

  row.addEventListener('touchend',function(e){
    if(!tracking)return;
    var dx=e.changedTouches[0].clientX-startX;
    var base=wasOpen?-80:0;
    var finalX=base+dx;
    row.style.transition='transform .2s ease';
    if(finalX<-40){
      row.style.transform='translateX(-80px)';
      _bioSwipedRow=row;
    } else {
      row.style.transform='';
      if(_bioSwipedRow===row)_bioSwipedRow=null;
    }
    setTimeout(function(){row.style.transition='';},220);
  },{passive:true});
}

// ── Graph ──────────────────────────────────────────────────────────────────

// type: 'weight' uses fixed 140–170 Y axis with ticks; 'bodyfat' auto-scales
function drawBioGraph(canvasId,hist,type){
  var canvas=document.getElementById(canvasId);
  var empty=document.getElementById(canvasId+'Empty');
  if(!canvas)return;
  if(hist.length<2){
    canvas.style.display='none';
    if(empty)empty.style.display='block';
    return;
  }
  canvas.style.display='block';
  if(empty)empty.style.display='none';

  var isWeight=(type==='weight');
  var H=isWeight?140:120;
  var W=canvas.parentElement.offsetWidth||300;
  canvas.width=W*window.devicePixelRatio;canvas.height=H*window.devicePixelRatio;
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  var ctx=canvas.getContext('2d');ctx.scale(window.devicePixelRatio,window.devicePixelRatio);

  var pts=hist.slice().reverse();
  var vals=pts.map(function(p){return parseFloat(p.v);}).filter(function(v){return!isNaN(v);});
  if(vals.length<2){canvas.style.display='none';if(empty)empty.style.display='block';return;}

  var minV,maxV,range;
  if(isWeight){minV=140;maxV=170;range=30;}
  else{minV=Math.min.apply(null,vals)-2;maxV=Math.max.apply(null,vals)+2;range=maxV-minV||1;}

  var padL=isWeight?28:8,padR=8,padT=10,padB=24;
  var iW=W-padL-padR,iH=H-padT-padB;
  var xP=function(i){return padL+i*(iW/(vals.length-1));};
  var yP=function(v){return padT+iH*(1-(v-minV)/range);};

  ctx.clearRect(0,0,W,H);

  var gridCol=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
  var txtCol=dark?'rgba(255,255,255,.3)':'rgba(0,0,0,.3)';

  if(isWeight){
    // Minor tick marks every 1 lb (short, no label)
    ctx.strokeStyle=dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)';ctx.lineWidth=1;
    for(var lb=140;lb<=170;lb++){
      if(lb%5===0)continue; // skip major tick positions
      var ly=yP(lb);
      ctx.beginPath();ctx.moveTo(padL,ly);ctx.lineTo(W-padR,ly);ctx.stroke();
    }
    // Major ticks every 5 lbs — labeled, with grid line
    ctx.strokeStyle=gridCol;ctx.lineWidth=1;
    ctx.font='9px sans-serif';ctx.fillStyle=txtCol;
    for(var lb=140;lb<=170;lb+=5){
      var ly=yP(lb);
      ctx.beginPath();ctx.moveTo(padL,ly);ctx.lineTo(W-padR,ly);ctx.stroke();
      ctx.textAlign='right';ctx.fillText(String(lb),padL-4,ly+3);
    }
  } else {
    // Auto-scale: 4 evenly-spaced grid lines
    ctx.strokeStyle=gridCol;ctx.lineWidth=1;
    for(var g=0;g<4;g++){var gy=padT+(iH/3)*g;ctx.beginPath();ctx.moveTo(padL,gy);ctx.lineTo(W-padR,gy);ctx.stroke();}
  }

  // Fill gradient
  var grad=ctx.createLinearGradient(0,padT,0,H);
  grad.addColorStop(0,'rgba(212,168,83,.3)');grad.addColorStop(1,'rgba(212,168,83,.02)');
  ctx.beginPath();ctx.moveTo(xP(0),yP(vals[0]));
  for(var i=1;i<vals.length;i++)ctx.lineTo(xP(i),yP(vals[i]));
  ctx.lineTo(xP(vals.length-1),H-padB);ctx.lineTo(xP(0),H-padB);
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
      ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(v,xP(i),yP(v)-7);
    }
  });

  // Date labels
  ctx.fillStyle=txtCol;ctx.font='9px sans-serif';
  if(pts.length){ctx.textAlign='left';ctx.fillText(pts[0].d,padL,H-6);}
  if(pts.length>1){ctx.textAlign='right';ctx.fillText(pts[pts.length-1].d,W-padR,H-6);}
}

function drawWeightGraph(){
  var c=document.getElementById('wtCanvas');
  if(c)drawBioGraph('wtCanvas',bio.wtHist||[],'weight');
}
