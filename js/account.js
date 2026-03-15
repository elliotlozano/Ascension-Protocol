'use strict';

var glEditMode = {};

// Feature 7: Nizoral removed — only Finasteride and Dutasteride remain
var GUIDE_DATA = {
  skincare: {
    label: 'Skincare', icon: '✨', color: '#9e7a9022', iconColor: '#9e7a90',
    items: [
      {name:'CeraVe Foaming Cleanser', sub:'AM + PM · Step 1', dose:'Pea-sized amount · morning and night', why:'Dermatologist #1 recommended drugstore cleanser. Fragrance-free, non-comedogenic. Contains ceramides and hyaluronic acid. Cleans without stripping the skin barrier.'},
      {name:'Timeless 20% Vitamin C Serum', sub:'AM · Step 2', dose:'3–4 drops · after cleansing, before SPF', why:'Best-in-class dupe for SkinCeuticals CE Ferulic at 1/8 the price. 20% L-ascorbic acid + Vitamin E + ferulic acid. Brightens skin, boosts collagen production, amplifies SPF protection. Store in fridge.'},
      {name:'EltaMD UV Clear SPF 46', sub:'AM · Step 3 (final)', dose:'Two finger-lengths · every morning before leaving', why:'Most recommended daily face SPF by dermatologists. Oil-free, contains niacinamide and hyaluronic acid. Lightweight, won\'t clog pores. Non-negotiable — UV damage is irreversible.'},
      {name:'CeraVe Retinol Serum', sub:'PM · Step 2 (per schedule)', dose:'Pea-sized amount · after cleansing, before moisturizer', why:'Best beginner retinol. Encapsulated formula releases gradually, ceramides and niacinamide minimize irritation. Month 1: Wed + Fri only. Month 2: every other night. Month 3+: nightly if tolerating. Speeds cell turnover, reduces fine lines, improves texture long-term.'},
      {name:'CeraVe PM Moisturizing Lotion', sub:'PM · Step 3 (final)', dose:'Dime-sized amount · over retinol or alone', why:'Non-comedogenic ceramide + hyaluronic acid moisturizer. Perfect final PM layer over retinol to lock in moisture and reduce irritation. Lightweight but effective.'},
      {name:'Paula\'s Choice BHA 2% Liquid', sub:'PM · 2x/week on non-retinol nights', dose:'Few drops on cotton pad · after cleansing, wait 20 sec before moisturizer', why:'Most recommended exfoliant on r/SkincareAddiction. BHA (salicylic acid) penetrates pores, reduces blackheads, smooths texture. Do not use on retinol nights — alternate.'}
    ]
  },
  supplements: {
    label: 'Supplements', icon: '💊', color: '#a8953022', iconColor: '#a89530',
    items: [
      {name:'Creatine Monohydrate', sub:'5g post-gym (or daily)', dose:'5g with juice or water · post-workout', why:'Most studied and proven performance supplement. Increases strength, muscle volume, and recovery. Non-negotiable. Sports Research (Informed Sport certified) or Thorne. Takes ~4 weeks to saturate.'},
      {name:'Whey Protein Isolate', sub:'1–2 scoops daily', dose:'25–30g per serving · post-gym or with breakfast', why:'Hits your 150g daily protein target. Transparent Labs Grass-Fed Whey Isolate is top-rated. Budget pick: Dymatize ISO 100. Prioritize whole food protein first, supplement the gap.'},
      {name:'L-Citrulline', sub:'6g pre-gym (30 min before)', dose:'6g unflavored in water · 30 min before training', why:'Pure L-citrulline — not citrulline malate (malate dilutes the dose). Drives blood flow, pump, and muscular endurance. Sports Research or BulkSupplements are best value picks.'},
      {name:'Ashwagandha KSM-66', sub:'600mg with breakfast', dose:'600mg daily with food', why:'KSM-66 extract specifically (standardized to 5% withanolides, root-only). Reduces cortisol, supports testosterone, improves sleep quality and stress resilience. Jarrow, Nutricost, or NOW Foods KSM-66.'},
      {name:'Vitamin D3 + K2 (MK-7)', sub:'2,000–5,000 IU D3 + 100mcg K2 · with breakfast', dose:'With breakfast and fat source daily', why:'D3 and K2 must be taken together — K2 (MK-7 form) directs calcium to bones, not arteries. Most people are D3 deficient. Sports Research D3+K2 with coconut MCT oil is the top pick.'},
      {name:'Omega-3 Fish Oil', sub:'2g EPA+DHA · with breakfast', dose:'2 capsules (triple-strength) with breakfast', why:'Anti-inflammatory, supports joint health, brain function, and cardiovascular health. Nordic Naturals Ultimate Omega is gold standard (IFOS 5-star certified). Budget: Sports Research Triple Strength.'},
      {name:'Magnesium Glycinate', sub:'300–400mg before bed', dose:'300–400mg · 30 min before sleep', why:'Glycinate form — most bioavailable and gentlest on GI. Promotes deep sleep, reduces muscle soreness, supports recovery. Doctor\'s Best, Thorne, or Sports Research. Avoid oxide form (poorly absorbed).'},
      {name:'Caffeine (optional)', sub:'100–200mg pre-gym only', dose:'100–200mg · 30 min before training, gym days only', why:'Optional performance enhancer. Take only if not already consuming caffeine. Do not take within 8 hours of sleep. Natrol or Prolab 200mg tablets. Skip on rest days.'}
    ]
  },
  hair: {
    label: 'Hair Protocol', icon: '💆', color: '#6b8cae22', iconColor: '#6b8cae',
    items: [
      {name:'Finasteride 1mg', sub:'Daily · same time each morning', dose:'1mg oral tablet · every morning', why:'5-alpha reductase inhibitor. Blocks conversion of testosterone to DHT — the primary driver of male pattern baldness. Gold standard for hair loss prevention. Prescription required. Takes 3–6 months to show results, 12 months for full effect. Consistency is everything — missing doses reduces efficacy.'},
      {name:'Dutasteride 0.5mg', sub:'Alternative or combination · discuss with prescriber', dose:'0.5mg oral · daily or as prescribed', why:'More potent 5-alpha reductase inhibitor than finasteride — blocks both Type I and Type II enzymes vs finasteride\'s Type II only. Used when finasteride alone plateaus or for more aggressive DHT suppression. Combination therapy (low-dose fin + dut) is increasingly prescribed. Always under physician guidance.'}
    ]
  }
};

var ACH_DISTS=[{k:'mile',l:'1 Mile',icon:'🏃'},{k:'fivek',l:'5K',icon:'🏅'},{k:'tenk',l:'10K',icon:'🏆'}];

// ── Badge definitions ─────────────────────────────────────────
// Mile time tiers (self-replacing): only highest unlocked shown as earned
var MILE_TIERS = [
  {id:'mile_sub10', name:'Sub-10 Mile', icon:'🏃', sec: 10*60},
  {id:'mile_sub9',  name:'Sub-9 Mile',  icon:'🏃', sec:  9*60},
  {id:'mile_sub8',  name:'Sub-8 Mile',  icon:'🏃', sec:  8*60},
  {id:'mile_sub7',  name:'Sub-7 Mile',  icon:'🏃', sec:  7*60},
  {id:'mile_sub6',  name:'Sub-6 Mile',  icon:'🏃', sec:  6*60}
];
// Weekly mileage tiers (self-replacing)
var MILES_TIERS = [
  {id:'miles_10',  name:'10-Mile Week',  icon:'🛤️', miles:10},
  {id:'miles_15',  name:'15-Mile Week',  icon:'🛤️', miles:15},
  {id:'miles_20',  name:'20-Mile Week',  icon:'🛤️', miles:20},
  {id:'miles_25',  name:'25-Mile Week',  icon:'🛤️', miles:25},
  {id:'miles_30',  name:'30-Mile Week',  icon:'🛤️', miles:30},
  {id:'miles_35',  name:'35-Mile Week',  icon:'🛤️', miles:35},
  {id:'miles_40',  name:'40-Mile Week',  icon:'🛤️', miles:40},
  {id:'miles_45',  name:'45-Mile Week',  icon:'🛤️', miles:45},
  {id:'miles_50',  name:'50-Mile Week',  icon:'🛤️', miles:50}
];
// Phase completion badges
var PHASE_BADGES = [
  {id:'phase1_done', name:'Phase I Complete',   icon:'✦', phaseEnd:6},
  {id:'phase2_done', name:'Phase II Complete',  icon:'⬡', phaseEnd:18},
  {id:'phase3_done', name:'Phase III Complete', icon:'◈', phaseEnd:30}
];
// Discipline badges (months since PROTO_START)
var DISC_BADGES = [
  {id:'disc_6mo',  name:'6-Month Disciple', icon:'🎖️',  months:6},
  {id:'disc_1yr',  name:'1-Year Disciple',  icon:'🏅',  months:12},
  {id:'disc_2yr',  name:'2-Year Disciple',  icon:'🥇',  months:24},
  {id:'disc_3yr',  name:'3-Year Disciple',  icon:'🌟',  months:36},
  {id:'disc_5yr',  name:'5-Year Disciple',  icon:'👑',  months:60}
];

function timeToSec(t){var p=t.split(':');if(p.length===2)return parseInt(p[0])*60+parseFloat(p[1]);return parseFloat(t)||9999;}

// Compute which badges have been earned
function computeEarnedBadges() {
  var earned = {};

  // Perfect Week: any week that hit 100% in weekScores
  Object.keys(weekScores).forEach(function(k){
    if (weekScores[k] === 100) earned['perfect_week'] = true;
  });

  // 5K Finisher
  if (ach.fivek && ach.fivek.length > 0) earned['finisher_5k'] = true;

  // Mile Time tiers (self-replacing — mark all tiers beaten)
  if (prs.mile) {
    var sec = timeToSec(prs.mile.v);
    MILE_TIERS.forEach(function(t) {
      if (sec < t.sec) earned[t.id] = true;
    });
  }

  // Weekly Mileage tiers (self-replacing)
  var maxMiles = 0;
  Object.keys(weekMiles).forEach(function(k){ if(weekMiles[k] > maxMiles) maxMiles = weekMiles[k]; });
  MILES_TIERS.forEach(function(t) {
    if (maxMiles >= t.miles) earned[t.id] = true;
  });

  // Phase Completion
  PHASE_BADGES.forEach(function(b) {
    if (cProtoMonth > b.phaseEnd) earned[b.id] = true;
  });

  // Discipline — months elapsed since PROTO_START
  var now = new Date();
  var msPerMonth = 30.44 * 24 * 3600 * 1000;
  var monthsElapsed = Math.floor((now - PROTO_START) / msPerMonth);
  DISC_BADGES.forEach(function(b) {
    if (monthsElapsed >= b.months) earned[b.id] = true;
  });

  return earned;
}

function renderAchievements(){
  var earned = computeEarnedBadges();
  var ranks=['gold','silver','bronze'],rlbls=['#1','#2','#3'];
  var html = '';

  // ── Badges section ──────────────────────────────────────────
  html += '<div class="card">';
  html += '<div class="ct">Badges</div>';

  // Milestones group
  html += '<div style="font-size:11px;color:var(--mu);font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Milestones</div>';
  html += '<div class="badge-grid">';
  html += badgeItem('perfect_week', '💯', 'Perfect Week', earned['perfect_week']);
  html += badgeItem('finisher_5k', '🏁', '5K Finisher', earned['finisher_5k']);
  html += '</div>';

  // Mile Time — self-replacing: find highest earned tier
  html += '<div style="font-size:11px;color:var(--mu);font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 8px">Mile Time</div>';
  html += '<div class="badge-grid">';
  var topMileTier = null;
  MILE_TIERS.forEach(function(t){ if(earned[t.id]) topMileTier = t; });
  var nextMileTier = null;
  for (var i = 0; i < MILE_TIERS.length; i++) {
    if (!earned[MILE_TIERS[i].id]) { nextMileTier = MILE_TIERS[i]; break; }
  }
  if (topMileTier) {
    html += badgeItem(topMileTier.id, topMileTier.icon, topMileTier.name, true);
  }
  if (nextMileTier) {
    html += badgeItem(nextMileTier.id, nextMileTier.icon, nextMileTier.name, false);
  }
  html += '</div>';

  // Weekly Mileage — self-replacing
  html += '<div style="font-size:11px;color:var(--mu);font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 8px">Weekly Mileage</div>';
  html += '<div class="miles-log-row">';
  html += '<input class="ach-inp" id="milesInp" type="number" step="0.1" placeholder="Log miles this week">';
  html += '<button class="ach-log-btn" onclick="logWeekMiles()">Log</button>';
  html += '</div>';
  html += '<div class="badge-grid">';
  var topMilesTier = null;
  MILES_TIERS.forEach(function(t){ if(earned[t.id]) topMilesTier = t; });
  var nextMilesTier = null;
  for (var j = 0; j < MILES_TIERS.length; j++) {
    if (!earned[MILES_TIERS[j].id]) { nextMilesTier = MILES_TIERS[j]; break; }
  }
  if (topMilesTier) {
    html += badgeItem(topMilesTier.id, topMilesTier.icon, topMilesTier.name, true);
  }
  if (nextMilesTier) {
    html += badgeItem(nextMilesTier.id, nextMilesTier.icon, nextMilesTier.name, false);
  }
  html += '</div>';

  // Phase Completion
  html += '<div style="font-size:11px;color:var(--mu);font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 8px">Phase Completion</div>';
  html += '<div class="badge-grid">';
  PHASE_BADGES.forEach(function(b) {
    html += badgeItem(b.id, b.icon, b.name, !!earned[b.id]);
  });
  html += '</div>';

  // Discipline
  html += '<div style="font-size:11px;color:var(--mu);font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 8px">Discipline</div>';
  html += '<div class="badge-grid">';
  DISC_BADGES.forEach(function(b) {
    html += badgeItem(b.id, b.icon, b.name, !!earned[b.id]);
  });
  html += '</div>';

  html += '</div>'; // end badges card

  // ── Race times section ──────────────────────────────────────
  ACH_DISTS.forEach(function(dist){
    var times=(ach[dist.k]||[]).slice(0,3);
    html+='<div class="card"><div class="ach-sec"><div class="ach-hdr"><span class="ach-icon">'+dist.icon+'</span><span class="ach-title">'+dist.l+'</span></div>';
    if(!times.length)html+='<div style="font-size:13px;color:var(--mu);font-style:italic;padding:4px 0 8px">No times logged yet.</div>';
    times.forEach(function(entry,i){html+='<div class="ach-row"><span class="ach-rank '+ranks[i]+'">'+rlbls[i]+'</span><span class="ach-time">'+entry.v+'</span><span class="ach-date">'+entry.d+'</span></div>';});
    html+='<div class="ach-add"><input class="ach-inp" id="achInp-'+dist.k+'" placeholder="Log time (e.g. 24:32)" type="text"><button class="ach-log-btn" onclick="logAchievement(\''+dist.k+'\')">Log</button></div></div></div>';
  });

  document.getElementById('achBody').innerHTML=html;
  ACH_DISTS.forEach(function(dist){var inp=document.getElementById('achInp-'+dist.k);if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')logAchievement(dist.k);});});
  var milesInp=document.getElementById('milesInp');if(milesInp)milesInp.addEventListener('keydown',function(e){if(e.key==='Enter')logWeekMiles();});
}

function badgeItem(id, icon, name, isEarned) {
  var cls = 'badge-item' + (isEarned ? ' earned' : ' locked');
  return '<div class="'+cls+'"><div class="badge-emoji">'+icon+'</div><div class="badge-name">'+name+'</div></div>';
}

function logAchievement(k){
  var inp=document.getElementById('achInp-'+k);if(!inp)return;
  var v=inp.value.trim();if(!v)return;
  if(!ach[k])ach[k]=[];
  ach[k].unshift({v:v,d:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})});
  ach[k].sort(function(a,b){return timeToSec(a.v)-timeToSec(b.v);});
  ach[k]=ach[k].slice(0,3);
  inp.value='';save();renderAchievements();
}

function logWeekMiles() {
  var inp = document.getElementById('milesInp');
  if (!inp) return;
  var v = parseFloat(inp.value);
  if (isNaN(v) || v <= 0) return;
  var key = 'gw' + globalWeek();
  weekMiles[key] = Math.max(weekMiles[key] || 0, v);
  inp.value = '';
  save();
  renderAchievements();
}

// ── Account navigation ────────────────────────────────────────
function showPage(id){document.querySelectorAll('.acct-page').forEach(function(p){p.className='acct-page';});document.getElementById(id).className='acct-page on';}
function openPage(id){showPage(id);if(id==='pageSettings')renderSettings();if(id==='pageGrocery')renderGrocery();if(id==='pageAchievements')renderAchievements();if(id==='pageGuide')renderGuide();}
function closePage(){showPage('pageMain');}

function renderSettings(){
  var tog=document.getElementById('darkTog');if(tog)tog.className='tog'+(dark?' on':'');
  var now=new Date();var months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var day=now.getDate(),suf=(day===1||day===21||day===31)?'st':(day===2||day===22)?'nd':(day===3||day===23)?'rd':'th';
  var el=document.getElementById('currentDate');if(el)el.textContent=months[now.getMonth()]+' '+day+suf+', '+now.getFullYear();
  var pw=document.getElementById('protoWeek');if(pw)pw.textContent='Month '+cProtoMonth+', Week '+cW;
}
function signOut(){sbSignOut();}
function clearChatMemory(){chatHist=[];localStorage.removeItem('ac_chat');save();var btn=event.target;btn.textContent='Cleared ✓';setTimeout(function(){btn.textContent='Clear';},2000);}

// ── Grocery ───────────────────────────────────────────────────
function getNextWeekLabel(){var now=new Date(),dow=now.getDay(),daysToSat=(6-dow+7)%7||7,sat=new Date(now);sat.setDate(now.getDate()+daysToSat);var mon=new Date(sat);mon.setDate(sat.getDate()+1);var fmt=function(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});};return'Week of '+fmt(mon)+' – '+fmt(new Date(mon.getTime()+6*86400000));}
function buildGroceryItems(){
  var nextW=(globalWeek()%52)+1;
  var protein=[],seen={};
  var pm={salmon:['Salmon (2 lbs)'],beef:['Lean ground beef (1 lb)'],chicken:['Chicken thighs or breast (2 lbs)'],shrimp:['Shrimp (1 lb)'],pork:['Pork tenderloin (1 lb)'],bison:['Ground bison (1 lb)'],cod:['Cod fillets (1 lb)'],turkey:['Ground turkey (1 lb)'],tuna:['Tuna steak (1 lb)'],steak:['Sirloin steak (1 lb)']};
  ['Monday','Tuesday','Wednesday','Thursday'].forEach(function(d){var din=getDinner(nextW,d)||'';Object.keys(pm).forEach(function(p){if(din.toLowerCase().indexOf(p)!==-1){pm[p].forEach(function(item){if(!seen[item]){seen[item]=true;protein.push(item);}});}});});
  protein.push('Eggs (dozen)','Chicken breast (meal prep)');
  var raw={protein:protein,produce:['Spinach / mixed greens (bag)','Broccoli','Sweet potato (3–4)','Brussels sprouts','Zucchini','Cherry tomatoes','Banana (bunch)','Berries (frozen, 1 bag)','Avocado (3–4)','Cucumber','Baby carrots'],grains:['Brown rice (bag)','Rolled oats (large container)','Sprouted grain / Ezekiel bread','Quinoa','Whole wheat pasta','Rice cakes'],dairy:['Greek yogurt (32oz tub)','Cottage cheese (32oz)','Almond milk (half gallon)','String cheese','Feta (small block)'],pantry:['Natural almond butter','Protein powder','Olive oil','Low-sodium soy sauce','Hot sauce','Honey','Almonds / mixed nuts','Casein protein']};
  Object.keys(raw).forEach(function(cat){
    raw[cat]=raw[cat].filter(function(item,i){return !glc['del.'+cat+'.'+i];}).map(function(item,i){return glc['edit.'+cat+'.'+i]||item;});
  });
  return raw;
}
function renderGrocery(){
  document.getElementById('glWeekLabel').textContent=getNextWeekLabel();
  var items=buildGroceryItems();
  var labels={protein:'Protein',produce:'Produce',grains:'Grains & Carbs',dairy:'Dairy & Eggs',pantry:'Pantry & Supplements'};
  var chkSvg='<svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4L3.5 6.5L9 1"/></svg>';
  var html='';
  Object.keys(labels).forEach(function(cat){
    var editing=!!glEditMode[cat];
    html+='<div class="gl-sec">'
      +'<div class="gl-sec-hdr"><div class="gl-sh">'+labels[cat]+'</div>'
      +'<button class="gl-edit-mode-btn" onclick="toggleGroceryEdit(\''+cat+'\')">'+(editing?'Done':'✎')+'</button></div>';
    var customs=glc['custom.'+cat]||[];
    var allItems=[];
    items[cat].forEach(function(item,i){allItems.push({item:item,key:'gl.'+cat+'.'+i,type:'gen',idx:i});});
    customs.forEach(function(item,i){allItems.push({item:item,key:'gl.'+cat+'.c'+i,type:'custom',idx:i});});
    var unchecked=[],checked=[];
    allItems.forEach(function(obj){if(glc[obj.key])checked.push(obj);else unchecked.push(obj);});
    unchecked.forEach(function(obj){
      html+='<div class="gl-item" id="gli-'+obj.key.replace(/\./g,'-')+'">';
      if(editing){
        html+='<div class="gl-del-btn" onclick="deleteGroceryItem(\''+cat+'\',\''+obj.type+'\','+obj.idx+')">−</div>';
        html+='<input class="gl-edit-inp" value="'+escHtml(obj.item)+'" onchange="editGroceryItem(\''+cat+'\',\''+obj.type+'\','+obj.idx+',this.value)">';
      } else {
        html+='<div class="gl-chk" onclick="toggleGrocery(\''+obj.key+'\')"></div>';
        html+='<span class="gl-name">'+escHtml(obj.item)+'</span>';
      }
      html+='</div>';
    });
    html+='<div class="gl-add-row"><input class="gl-add-inp" id="glInp-'+cat+'" placeholder="Add item..." type="text"><button class="gl-add-btn" onclick="addGroceryItem(\''+cat+'\')">+</button></div>';
    if(checked.length){
      html+='<div class="gl-done-sep">';
      checked.forEach(function(obj){
        html+='<div class="gl-item">';
        if(editing){
          html+='<div class="gl-del-btn" onclick="deleteGroceryItem(\''+cat+'\',\''+obj.type+'\','+obj.idx+')">−</div>';
          html+='<span class="gl-name done">'+escHtml(obj.item)+'</span>';
        } else {
          html+='<div class="gl-chk on" onclick="toggleGrocery(\''+obj.key+'\')">'+chkSvg+'</div>';
          html+='<span class="gl-name done">'+escHtml(obj.item)+'</span>';
        }
        html+='</div>';
      });
      html+='</div>';
    }
    html+='</div>';
  });
  document.getElementById('glBody').innerHTML=html;
  Object.keys(labels).forEach(function(cat){var inp=document.getElementById('glInp-'+cat);if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')addGroceryItem(cat);});});
}
function toggleGroceryEdit(cat){glEditMode[cat]=!glEditMode[cat];renderGrocery();}
function toggleGrocery(key){glc[key]=!glc[key];save();renderGrocery();}
function addGroceryItem(cat){var inp=document.getElementById('glInp-'+cat);if(!inp)return;var v=inp.value.trim();if(!v)return;if(!glc['custom.'+cat])glc['custom.'+cat]=[];glc['custom.'+cat].push(v);save();renderGrocery();}
function deleteGroceryItem(cat,type,idx){
  if(type==='custom'){var customs=glc['custom.'+cat]||[];customs.splice(idx,1);glc['custom.'+cat]=customs;}
  else{glc['del.'+cat+'.'+idx]=true;}
  save();renderGrocery();
}
function editGroceryItem(cat,type,idx,val){
  if(type==='custom'){var customs=glc['custom.'+cat]||[];customs[idx]=val;glc['custom.'+cat]=customs;}
  else{glc['edit.'+cat+'.'+idx]=val;}
  save();
}

// ── Protocol Guide ─────────────────────────────────────────────
function renderGuide(){
  var html='';
  Object.keys(GUIDE_DATA).forEach(function(cat){
    var sec=GUIDE_DATA[cat];
    html+='<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--mu);margin-bottom:8px;margin-top:4px">'+sec.label+'</div>';
    sec.items.forEach(function(item,i){
      var gid=cat+i;
      html+='<div class="guide-card"><div class="guide-hdr" onclick="toggleGuide(\''+gid+'\')">'
        +'<div class="guide-icon" style="background:'+sec.color+'">'+sec.icon+'</div>'
        +'<div style="flex:1;min-width:0"><div class="guide-name">'+item.name+'</div><div class="guide-sub">'+item.sub+'</div></div>'
        +'<span class="rpc" id="gg-'+gid+'">›</span></div>'
        +'<div class="guide-body" id="gb-g-'+gid+'">'
        +'<div class="guide-row"><span class="guide-lbl">Dose</span><span class="guide-val">'+item.dose+'</span></div>'
        +'<div class="guide-row"><span class="guide-lbl">Why</span><span class="guide-val">'+item.why+'</span></div>'
        +'</div></div>';
    });
  });
  document.getElementById('guideBody').innerHTML=html;
}
function toggleGuide(id){
  var body=document.getElementById('gb-g-'+id),chev=document.getElementById('gg-'+id);
  var open=body.classList.contains('open');
  body.classList.toggle('open',!open);if(chev)chev.classList.toggle('open',!open);
}
