'use strict';

// ── Tab management with sessionStorage persistence (feature 6) ─
function selTab(t){
  ['P','R','M','A'].forEach(function(x){
    document.getElementById('p'+x).className='pane'+(x===t?' on':'');
    document.getElementById('db-'+x).className='db'+(x===t?' on':'');
  });
  sessionStorage.setItem('ac_tab', t);
  if(t==='M')renderMetrics();
  if(t==='A'){renderSettings();showPage('pageMain');}
  if(t==='R'){renderMission();renderGoals();}
}

function toggleTheme(){
  dark=!dark;
  document.body.className=dark?'D':'L';
  var tog=document.getElementById('darkTog');
  if(tog)tog.className='tog'+(dark?' on':'');
  save();
}

// ── Swipe-right to go back from Account sub-pages (feature 5) ─
function initSwipeBack(){
  var pA=document.getElementById('pA');
  var touchStartX=0, touchStartY=0;
  pA.addEventListener('touchstart',function(e){
    touchStartX=e.touches[0].clientX;
    touchStartY=e.touches[0].clientY;
  },{passive:true});
  pA.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-touchStartX;
    var dy=Math.abs(e.changedTouches[0].clientY-touchStartY);
    // Swipe right: horizontal dist > 60px, mostly horizontal
    if(dx>60 && dy<40){
      var activePage=document.querySelector('.acct-page.on');
      if(activePage && activePage.id!=='pageMain'){
        closePage();
      }
    }
  },{passive:true});
}

// ── Login ─────────────────────────────────────────────────────
function showLoginScreen(){
  document.getElementById('app').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginErr').textContent='';
  document.getElementById('loginPass').value='';
}
function showApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='flex';
}
function doLogin(){
  var pass=document.getElementById('loginPass').value,btn=document.getElementById('loginBtn'),err=document.getElementById('loginErr');
  if(!pass)return;btn.textContent='…';btn.disabled=true;err.textContent='';
  sbSignIn('elliotlozano95@gmail.com',pass,function(e){
    btn.textContent='Enter';btn.disabled=false;
    if(e){err.textContent=e==='Invalid login credentials'?'Wrong password':e;return;}
    launchApp();
  });
}
function launchApp(){
  showApp();syncToToday();
  sbLoad(function(){
    renderPlanner();renderMetrics();renderMission();renderGoals();
    startRealtimeSync();
    // Restore active tab from sessionStorage
    var savedTab=sessionStorage.getItem('ac_tab');
    if(savedTab && ['P','R','M','A'].indexOf(savedTab)!==-1){
      selTab(savedTab);
    }
  });
}

// ── Init ──────────────────────────────────────────────────────
document.body.className=dark?'D':'L';

document.getElementById('chatInp').addEventListener('input',function(){
  this.style.height='auto';
  this.style.height=Math.min(this.scrollHeight,100)+'px';
});
document.getElementById('loginPass').addEventListener('keydown',function(ev){
  if(ev.key==='Enter')doLogin();
});

initSwipeBack();

if(authToken){launchApp();}else{showLoginScreen();}
