'use strict';

var SB_URL = 'https://xxfvshxhkwsftcsgatwc.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZnZzaHhoa3dzZnRjc2dhdHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjY5NzUsImV4cCI6MjA4ODgwMjk3NX0.zt4W9dV85d8ASAMZPMk-QQNhMZqnxMu3xznYpyXenGs';
var syncTimer = null;
var authToken        = localStorage.getItem('ac_tok')  || null;
var authRefreshToken = localStorage.getItem('ac_rtok') || null;
var authUserId       = localStorage.getItem('ac_uid')  || null;
var rtClient  = null;
var rtChannel = null;

var chk      = JSON.parse(localStorage.getItem('ac_chk')        || '{}');
var ovr      = JSON.parse(localStorage.getItem('ac_ovr')        || '{}');
var bio      = JSON.parse(localStorage.getItem('ac_bio')        || '{}');
var prs      = JSON.parse(localStorage.getItem('ac_prs')        || '{}');
var ach      = JSON.parse(localStorage.getItem('ac_ach')        || '{}');
var glc      = JSON.parse(localStorage.getItem('ac_glc')        || '{}');
var goals    = JSON.parse(localStorage.getItem('ac_goals')      || '[]');
var dark     = localStorage.getItem('ac_th') !== 'L';
var mission  = localStorage.getItem('ac_mission') || DEFAULT_MISSION;
var chatHist = JSON.parse(localStorage.getItem('ac_chat')       || '[]');
// weekScores: {globalWeekKey: pct} for consecutive weeks tracking
var weekScores = JSON.parse(localStorage.getItem('ac_wscores')  || '{}');
// weekMiles: {globalWeekKey: miles} for mileage badge tracking
var weekMiles  = JSON.parse(localStorage.getItem('ac_wmiles')   || '{}');
// earned badges set
var earnedBadges = JSON.parse(localStorage.getItem('ac_badges') || '[]');
// macro logs keyed by YYYY-MM-DD; macro AI estimate cache keyed by meal name
var macros     = JSON.parse(localStorage.getItem('ac_macros')  || '{}');
var macroCache = JSON.parse(localStorage.getItem('ac_mcache')  || '{}');

var cProtoMonth = 1;
var cW = 1;
var cD = 'Monday';
var bioEditing = false;

function save() {
  localStorage.setItem('ac_chk',     JSON.stringify(chk));
  localStorage.setItem('ac_ovr',     JSON.stringify(ovr));
  localStorage.setItem('ac_bio',     JSON.stringify(bio));
  localStorage.setItem('ac_prs',     JSON.stringify(prs));
  localStorage.setItem('ac_ach',     JSON.stringify(ach));
  localStorage.setItem('ac_glc',     JSON.stringify(glc));
  localStorage.setItem('ac_goals',   JSON.stringify(goals));
  localStorage.setItem('ac_th',      dark ? 'D' : 'L');
  localStorage.setItem('ac_mission', mission);
  localStorage.setItem('ac_chat',    JSON.stringify(chatHist));
  localStorage.setItem('ac_wscores', JSON.stringify(weekScores));
  localStorage.setItem('ac_wmiles',  JSON.stringify(weekMiles));
  localStorage.setItem('ac_badges',  JSON.stringify(earnedBadges));
  localStorage.setItem('ac_macros',  JSON.stringify(macros));
  localStorage.setItem('ac_mcache',  JSON.stringify(macroCache));
  sbWrite();
}

function authHeaders() {
  return {'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+(authToken||SB_KEY)};
}
function sbSignIn(email, password, cb) {
  fetch(SB_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({email:email,password:password})})
  .then(function(r){return r.json();}).then(function(d){
    if(d.access_token){
      authToken=d.access_token;
      authRefreshToken=d.refresh_token||null;
      authUserId=d.user.id;
      localStorage.setItem('ac_tok',authToken);
      localStorage.setItem('ac_uid',authUserId);
      if(authRefreshToken)localStorage.setItem('ac_rtok',authRefreshToken);
      cb(null);
    } else cb(d.error_description||d.msg||'Invalid credentials');
  }).catch(function(){cb('Connection error');});
}
function sbSignOut(){stopRealtimeSync();authToken=null;authRefreshToken=null;authUserId=null;localStorage.removeItem('ac_tok');localStorage.removeItem('ac_rtok');localStorage.removeItem('ac_uid');showLoginScreen();}

// Decode JWT exp claim without a library — returns true if expired or unreadable
function tokenExpired(tok){
  try{var p=JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return p.exp<Math.floor(Date.now()/1000);}
  catch(e){return true;}
}

// Exchange refresh token for a new access token, update stored credentials
function sbRefresh(cb){
  if(!authRefreshToken){cb(new Error('no_refresh'));return;}
  fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({refresh_token:authRefreshToken})})
  .then(function(r){return r.json();}).then(function(d){
    if(d.access_token){
      authToken=d.access_token;
      authRefreshToken=d.refresh_token||authRefreshToken;
      localStorage.setItem('ac_tok',authToken);
      localStorage.setItem('ac_rtok',authRefreshToken);
      cb(null);
    } else cb(new Error(d.error_description||'refresh_failed'));
  }).catch(function(e){cb(e);});
}

function setSyncUI(s){var map={ok:'✦ Synced',saving:'↑ Saving…',err:'⚠ Offline',loading:'↓ Loading…'};var col={ok:'var(--sg)',saving:'var(--a)',err:'#c0504a',loading:'var(--a)'};var el=document.getElementById('syncStatus');if(el){el.textContent=map[s]||'';el.style.color=col[s]||'var(--mu)';}}
var _syncing = false;
function sbWrite(){
  if(!authToken)return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(function(){
    setSyncUI('saving');
    function doWrite(retry){
      _syncing=true;
      fetch(SB_URL+'/rest/v1/user_data?on_conflict=user_id',{method:'POST',headers:Object.assign(authHeaders(),{'Prefer':'resolution=merge-duplicates'}),body:JSON.stringify({user_id:authUserId,chk:chk,ovr:ovr,bio:bio,prs:prs,ach:ach,glc:glc,goals:goals,mission:mission,chat:chatHist,wscores:weekScores,wmiles:weekMiles,badges:earnedBadges,macros:macros,macro_cache:macroCache,updated_at:new Date().toISOString()})})
      .then(function(r){
        if(r.status===401&&retry){sbRefresh(function(err){if(!err)doWrite(false);else{_syncing=false;setSyncUI('err');}});return;}
        _syncing=false;
        setSyncUI(r.ok?'ok':'err');
      }).catch(function(){_syncing=false;setSyncUI('err');});
    }
    doWrite(true);
  },800);
}
function applyRemoteData(d){
  if(d.chk)chk=d.chk;if(d.ovr)ovr=d.ovr;if(d.bio)bio=d.bio;if(d.prs)prs=d.prs;
  if(d.ach)ach=d.ach;if(d.glc)glc=d.glc;if(d.goals)goals=d.goals;if(d.mission)mission=d.mission;
  if(d.chat){chatHist=d.chat;localStorage.setItem('ac_chat',JSON.stringify(chatHist));}
  if(d.wscores)weekScores=d.wscores;if(d.wmiles)weekMiles=d.wmiles;if(d.badges)earnedBadges=d.badges;
  if(d.macros)macros=d.macros;if(d.macro_cache)macroCache=d.macro_cache;
}
function sbLoad(cb){
  if(!authToken){cb();return;}
  setSyncUI('loading');
  // Proactively refresh before the fetch if the token is already expired
  function doLoad(retry){
    fetch(SB_URL+'/rest/v1/user_data?user_id=eq.'+authUserId+'&select=*',{headers:authHeaders()})
    .then(function(r){
      if(r.status===401&&retry){
        sbRefresh(function(err){
          if(err){setSyncUI('err');showLoginScreen();return;}
          doLoad(false);
        });
        return null;
      }
      if(!r.ok){setSyncUI('err');cb();return null;}
      return r.json();
    }).then(function(rows){
      if(!rows)return;
      if(rows&&rows.length)applyRemoteData(rows[0]);
      setSyncUI('ok');cb();
    }).catch(function(){setSyncUI('err');cb();});
  }
  if(tokenExpired(authToken)){
    sbRefresh(function(err){
      if(err){setSyncUI('err');showLoginScreen();return;}
      doLoad(false);
    });
  } else {
    doLoad(true);
  }
}

function startRealtimeSync(){
  if(!authToken||!authUserId)return;
  stopRealtimeSync();
  // Create a fresh client with the user JWT baked into global headers.
  // This avoids setAuth() timing issues — the WebSocket handshake carries
  // the correct token from the very first frame.
  rtClient=supabase.createClient(SB_URL,SB_KEY,{
    global:{headers:{Authorization:'Bearer '+authToken}},
    auth:{persistSession:false,autoRefreshToken:false}
  });
  // Subscribe without a server-side filter so we don't depend on
  // REPLICA IDENTITY FULL being set on the table. Filter client-side instead.
  rtChannel=rtClient.channel('ud:'+authUserId)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'user_data'},function(payload){
      var d=payload.new;
      if(!d||d.user_id!==authUserId)return;  // ignore other users' rows
      if(d.chk&&!_syncing){chk=d.chk;    localStorage.setItem('ac_chk',     JSON.stringify(chk));}
      if(d.ovr)   {ovr=d.ovr;            localStorage.setItem('ac_ovr',     JSON.stringify(ovr));}
      if(d.bio)   {bio=d.bio;            localStorage.setItem('ac_bio',     JSON.stringify(bio));}
      if(d.prs)   {prs=d.prs;            localStorage.setItem('ac_prs',     JSON.stringify(prs));}
      if(d.ach)   {ach=d.ach;            localStorage.setItem('ac_ach',     JSON.stringify(ach));}
      if(d.glc)   {glc=d.glc;            localStorage.setItem('ac_glc',     JSON.stringify(glc));}
      if(d.goals) {goals=d.goals;        localStorage.setItem('ac_goals',   JSON.stringify(goals));}
      if(d.mission){mission=d.mission;   localStorage.setItem('ac_mission', mission);}
      if(d.chat)  {chatHist=d.chat;      localStorage.setItem('ac_chat',    JSON.stringify(chatHist));}
      if(d.wscores){weekScores=d.wscores;localStorage.setItem('ac_wscores', JSON.stringify(weekScores));}
      if(d.wmiles){weekMiles=d.wmiles;   localStorage.setItem('ac_wmiles',  JSON.stringify(weekMiles));}
      if(d.badges){earnedBadges=d.badges;localStorage.setItem('ac_badges',  JSON.stringify(earnedBadges));}
      if(d.macros){macros=d.macros;        localStorage.setItem('ac_macros',  JSON.stringify(macros));}
      if(d.macro_cache){macroCache=d.macro_cache;localStorage.setItem('ac_mcache',JSON.stringify(macroCache));}
      setSyncUI('ok');
      if(typeof renderPlanner==='function')renderPlanner();
      if(typeof renderMetrics==='function')renderMetrics();
      if(typeof renderMission==='function')renderMission();
      if(typeof renderGoals==='function')renderGoals();
    })
    .subscribe(function(status,err){
      if(status==='SUBSCRIBED')setSyncUI('ok');
      if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')setSyncUI('err');
    });
}
function stopRealtimeSync(){
  if(rtChannel&&rtClient){rtClient.removeChannel(rtChannel);}
  rtChannel=null;rtClient=null;
}
