'use strict';

var SB_URL = 'https://xxfvshxhkwsftcsgatwc.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZnZzaHhoa3dzZnRjc2dhdHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjY5NzUsImV4cCI6MjA4ODgwMjk3NX0.zt4W9dV85d8ASAMZPMk-QQNhMZqnxMu3xznYpyXenGs';
var syncTimer = null;
var authToken = localStorage.getItem('ac_tok') || null;
var authUserId = localStorage.getItem('ac_uid') || null;

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
  sbWrite();
}

function authHeaders() {
  return {'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+(authToken||SB_KEY)};
}
function sbSignIn(email, password, cb) {
  fetch(SB_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({email:email,password:password})})
  .then(function(r){return r.json();}).then(function(d){
    if(d.access_token){authToken=d.access_token;authUserId=d.user.id;localStorage.setItem('ac_tok',authToken);localStorage.setItem('ac_uid',authUserId);cb(null);}
    else cb(d.error_description||d.msg||'Invalid credentials');
  }).catch(function(){cb('Connection error');});
}
function sbSignOut(){authToken=null;authUserId=null;localStorage.removeItem('ac_tok');localStorage.removeItem('ac_uid');showLoginScreen();}

function setSyncUI(s){var map={ok:'✦ Synced',saving:'↑ Saving…',err:'⚠ Offline',loading:'↓ Loading…'};var col={ok:'var(--sg)',saving:'var(--a)',err:'#c0504a',loading:'var(--a)'};var el=document.getElementById('syncStatus');if(el){el.textContent=map[s]||'';el.style.color=col[s]||'var(--mu)';}}
function sbWrite(){
  if(!authToken)return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(function(){
    setSyncUI('saving');
    fetch(SB_URL+'/rest/v1/user_data?on_conflict=user_id',{method:'POST',headers:Object.assign(authHeaders(),{'Prefer':'resolution=merge-duplicates'}),body:JSON.stringify({user_id:authUserId,chk:chk,ovr:ovr,bio:bio,prs:prs,chat:chatHist,updated_at:new Date().toISOString()})})
    .then(function(r){setSyncUI(r.ok?'ok':'err');}).catch(function(){setSyncUI('err');});
  },800);
}
function sbLoad(cb){
  if(!authToken){cb();return;}
  setSyncUI('loading');
  fetch(SB_URL+'/rest/v1/user_data?user_id=eq.'+authUserId+'&select=*',{headers:authHeaders()})
  .then(function(r){return r.json();}).then(function(rows){
    if(rows&&rows.length){var d=rows[0];if(d.chk)chk=d.chk;if(d.ovr)ovr=d.ovr;if(d.bio)bio=d.bio;if(d.prs)prs=d.prs;if(d.chat){chatHist=d.chat;localStorage.setItem('ac_chat',JSON.stringify(chatHist));}}
    setSyncUI('ok');cb();
  }).catch(function(){setSyncUI('err');cb();});
}
