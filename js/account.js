'use strict';

var _glSwipedRow = null;
function _glSnapBack(){if(_glSwipedRow){_glSwipedRow.style.transform='';_glSwipedRow=null;}}

var _achSwipedRow = null;
function _achSnapBack(){if(_achSwipedRow){_achSwipedRow.style.transform='';_achSwipedRow=null;}}
function attachAchSwipe(k,i){
  var row=document.getElementById('achrow-'+k+'-'+i);if(!row)return;
  var tx=0,ty=0;
  row.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  row.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-tx;
    var dy=Math.abs(e.changedTouches[0].clientY-ty);
    if(dy>Math.abs(dx)||Math.abs(dx)<8)return;
    if(dx<-40){if(_achSwipedRow&&_achSwipedRow!==row){_achSwipedRow.style.transform='';}row.style.transform='translateX(-80px)';_achSwipedRow=row;}
    else if(dx>20&&_achSwipedRow===row){_achSnapBack();}
  },{passive:true});
}
function deleteAchTime(k,i){
  _achSnapBack();
  if(ach[k])ach[k].splice(i,1);
  save();renderAchievements();
}
function editAchTime(k,i,el){
  if(_achSwipedRow){_achSnapBack();return;}
  if(!ach[k]||!ach[k][i])return;
  var current=el.textContent;
  var inp=document.createElement('input');inp.className='gl-edit-inp';inp.value=current;inp.placeholder='e.g. 24:32';inp.style.width='90px';inp.style.fontSize='14px';
  var committed=false;
  function commit(){
    if(committed)return;committed=true;
    var val=inp.value.trim();
    if(val&&val!==current){ach[k][i].v=val;ach[k].sort(function(a,b){return timeToSec(a.v)-timeToSec(b.v);});save();}
    renderAchievements();
  }
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();inp.blur();}if(e.key==='Escape'){e.preventDefault();committed=true;renderAchievements();}});
  el.parentNode.replaceChild(inp,el);inp.focus();inp.select();
}


// Feature 7: Nizoral removed — only Finasteride and Dutasteride remain
var GUIDE_DATA = {
  skincare: {
    label: 'Skincare', icon: '✨', color: '#9e7a9022', iconColor: '#9e7a90',
    items: [
      {name:'CeraVe Foaming Cleanser', sub:'AM + PM · Step 1', dose:'Pea-sized amount · morning and night',
        why:'Removes dirt, oil, and sunscreen without stripping the skin barrier — fragrance-free, non-comedogenic. Contains ceramides to restore the skin barrier and hyaluronic acid to maintain moisture. Gentler than most cleansers, which is exactly the point: a damaged barrier makes everything else work worse.',
        products:['CeraVe Foaming Facial Cleanser (16 fl oz) — ~$15–18 at any drugstore or Amazon']},
      {name:'Timeless 20% Vitamin C Serum', sub:'AM · Step 2', dose:'3–4 drops · after cleansing, before SPF',
        why:'Neutralizes free radicals, stimulates collagen synthesis, fades hyperpigmentation, and amplifies SPF protection. The active combination is 20% L-ascorbic acid + Vitamin E + ferulic acid — ferulic acid stabilizes the vitamin C and doubles its photoprotection. Store in fridge to slow oxidation.',
        products:['Best value: Timeless 20% Vitamin C + E + Ferulic Serum — ~$25 (1 oz)','Premium: SkinCeuticals CE Ferulic — ~$180 (essentially the same formula at 7× the price)']},
      {name:'EltaMD UV Clear SPF 46', sub:'AM · Step 3 (final)', dose:'Two finger-lengths · every morning before leaving',
        why:'UV exposure causes the majority of visible skin aging — wrinkles, uneven tone, loss of elasticity. Oil-free formula with niacinamide to reduce redness and hyaluronic acid for hydration. Non-comedogenic. This is the step most men skip, and it is the one with the highest ROI.',
        products:['EltaMD UV Clear Broad-Spectrum SPF 46 — ~$38–42','Available at Dermstore, Amazon, and most dermatology offices']},
      {name:'CeraVe Retinol Serum', sub:'PM · Step 2 (per schedule)', dose:'Pea-sized amount · after cleansing, before moisturizer',
        why:'Most clinically proven topical ingredient for skin renewal — accelerates cell turnover, reduces fine lines, smooths texture, improves tone. Encapsulated formula releases retinol gradually to reduce irritation. Ceramides and niacinamide minimize barrier disruption. Follow the protocol schedule: Month 1 Wed+Fri only, Month 2 every other night, Month 3+ nightly.',
        products:['CeraVe Resurfacing Retinol Serum — ~$18–22']},
      {name:'CeraVe PM Moisturizing Lotion', sub:'PM · Step 3 (final)', dose:'Dime-sized amount · over retinol or alone',
        why:'Locks in moisture after retinol and prevents transepidermal water loss overnight. Ceramides restore the skin barrier, hyaluronic acid draws in moisture, niacinamide calms redness and supports barrier function. Non-comedogenic final PM layer.',
        products:['CeraVe PM Facial Moisturizing Lotion — ~$15–18']},
      {name:'Paula\'s Choice BHA 2% Liquid', sub:'PM · 2x/week on non-retinol nights', dose:'Few drops on cotton pad · after cleansing, wait 20 sec before moisturizer',
        why:'Oil-soluble salicylic acid penetrates into pores and dissolves the blackhead buildup that water-soluble acids cannot reach. Smooths texture, reduces congestion, evens tone over time. Do not use on the same nights as retinol — alternate. Oil-solubility is the key advantage over glycolic or lactic acid for pore work.',
        products:['Paula\'s Choice Skin Perfecting 2% BHA Liquid Exfoliant — ~$32–34']}
    ]
  },
  supplements: {
    label: 'Supplements', icon: '💊', color: '#a8953022', iconColor: '#a89530',
    items: [
      {name:'Creatine Monohydrate', sub:'5g post-gym (or daily)', dose:'5g with juice or water · post-workout',
        why:'Increases phosphocreatine stores in muscle → more ATP production per set → more power output and faster recovery between sets. Most studied supplement in existence with 500+ peer-reviewed studies. Takes ~4 weeks to saturate. No loading phase necessary at 5g/day.',
        products:['Sports Research Creatine Monohydrate — Informed Sport certified','Thorne Creatine — NSF Certified for Sport']},
      {name:'Whey Protein Isolate', sub:'1–2 scoops daily', dose:'25–30g per serving · post-gym or with breakfast',
        why:'Fast-digesting complete protein containing all essential amino acids. Isolate form has >90% protein by weight, lower in fat and lactose than concentrate — easier to digest with fewer GI issues. Prioritize whole food protein first, supplement the gap.',
        products:['Premium: Transparent Labs Grass-Fed Whey Isolate — ~$59 for 30 servings','Budget: Dymatize ISO 100 — ~$40 for 25 servings']},
      {name:'L-Citrulline', sub:'6g pre-gym (30 min before)', dose:'6g unflavored in water · 30 min before training',
        why:'Converts to arginine in the kidneys → arginine is the precursor to nitric oxide → vasodilation → increased blood flow to working muscles. Increases pump, improves muscular endurance, delays fatigue onset. Use pure L-citrulline, not citrulline malate — the malate filler dilutes the active dose.',
        products:['Sports Research L-Citrulline — unflavored, excellent value','BulkSupplements L-Citrulline Powder — best price per gram']},
      {name:'Ashwagandha KSM-66', sub:'600mg with breakfast', dose:'600mg daily with food',
        why:'KSM-66 root extract standardized to 5% withanolides — reduces cortisol levels, supports natural testosterone production, improves sleep quality and recovery rate. Evidence-backed in multiple RCTs for stress reduction and athletic performance. Root-only extraction is important — avoid whole-plant extracts.',
        products:['Jarrow Formulas KSM-66 Ashwagandha — 300mg caps, widely available','Nutricost KSM-66 Ashwagandha — 600mg caps, best value','NOW Foods KSM-66 Ashwagandha — 300mg, affordable and reliable']},
      {name:'Vitamin D3 + K2 (MK-7)', sub:'2,000–5,000 IU D3 + 100mcg K2 · with breakfast', dose:'With breakfast and fat source daily',
        why:'D3 regulates testosterone production, immune function, bone density, and mood — the majority of people are deficient, especially those who work indoors. K2 (MK-7 form specifically) directs calcium to bones rather than arteries — this pairing is critical. Fat-soluble vitamins require a fat source for absorption.',
        products:['Sports Research Vitamin D3 + K2 with Organic Coconut MCT Oil — top pick, built-in fat source for absorption']},
      {name:'Omega-3 Fish Oil', sub:'2g EPA+DHA · with breakfast', dose:'2 capsules (triple-strength) with breakfast',
        why:'EPA and DHA reduce systemic inflammation, support joint health, improve cardiovascular markers, and enhance recovery between training sessions. Reduces DOMS. Look for IFOS certification — it verifies purity, potency, and absence of heavy metals and PCBs.',
        products:['Premium: Nordic Naturals Ultimate Omega — IFOS 5-star certified, ~$35','Budget: Sports Research Triple Strength Omega-3 — ~$25']},
      {name:'Magnesium Glycinate', sub:'300–400mg before bed', dose:'300–400mg · 30 min before sleep',
        why:'Cofactor in 300+ enzymatic reactions in the body. Promotes deep sleep and REM quality, supports muscle recovery and reduces cramping. Glycinate is the chelated form — bound to glycine, an amino acid with its own calming properties. Avoid magnesium oxide, which is poorly absorbed and mostly acts as a laxative.',
        products:["Doctor's Best High Absorption Magnesium Glycinate — ~$20, top pick",'Thorne Magnesium Glycinate — ~$25, pharmaceutical grade','Sports Research Magnesium Glycinate — solid budget option']},
      {name:'Caffeine (optional)', sub:'100–200mg pre-gym only', dose:'100–200mg · 30 min before training, gym days only',
        why:'Blocks adenosine receptors, reducing perceived effort and delaying fatigue. Take only on gym days. ⚠️ EVENING GYM WARNING: Your 5:30 PM sessions are too close to your 10 PM bedtime — caffeine has a 5–6 hour half-life. Skip caffeine for evening training entirely. Use coffee or green tea by 1–2 PM only.',
        products:['Natrol Caffeine 200mg tablets — ~$8 for 100ct','Prolab Caffeine 200mg tablets — ~$7 for 100ct','Alternative: standard coffee or green tea consumed before 1 PM']}
    ]
  },
  hair: {
    label: 'Hair Protocol', icon: '💆', color: '#6b8cae22', iconColor: '#6b8cae',
    items: [
      {name:'Finasteride 1mg', sub:'Daily · same time each morning', dose:'1mg oral tablet · every morning',
        why:'Inhibits type II 5-alpha reductase, the enzyme that converts testosterone to DHT in scalp follicles. Reduces scalp DHT by approximately 70%, stopping follicle miniaturization. Takes 3–6 months to show results, 12 months for full effect. Consistency is everything — missing doses reduces efficacy and the follicles you lose while off it do not always return.',
        products:['Prescription required — generic finasteride 1mg ~$10–15/month at most pharmacies','Online prescriptions: Hims, Keeps, or Ro — ~$20–30/month with delivery']},
      {name:'Dutasteride 0.5mg', sub:'Alternative or combination · discuss with prescriber', dose:'0.5mg oral · daily or as prescribed',
        why:'Inhibits both type I and type II 5-alpha reductase — reduces scalp DHT by approximately 90%, compared to finasteride\'s ~70%. More potent for aggressive DHT suppression. Used when finasteride alone plateaus or for more aggressive treatment. Combination therapy (low-dose fin + dut) is increasingly prescribed by hair restoration physicians.',
        products:['Prescription required — discuss with dermatologist or urologist','Compounding pharmacies can prepare combination finasteride + dutasteride formulations']}
    ]
  }
};

var ACH_DISTS=[{k:'mile',l:'1 Mile',icon:'🏃'},{k:'fivek',l:'5K',icon:'🏅'},{k:'tenk',l:'10K',icon:'🏆'}];

// ── Badge definitions ─────────────────────────────────────────
// FITNESS: Mile time tiers
var MILE_TIERS = [
  {id:'mile_sub10', name:'Sub-10 Mile', icon:'🏃', sec: 10*60},
  {id:'mile_sub9',  name:'Sub-9 Mile',  icon:'🏃', sec:  9*60},
  {id:'mile_sub8',  name:'Sub-8 Mile',  icon:'🏃', sec:  8*60},
  {id:'mile_sub7',  name:'Sub-7 Mile',  icon:'🏃', sec:  7*60},
  {id:'mile_sub6',  name:'Sub-6 Mile',  icon:'🏃', sec:  6*60}
];
// FITNESS: Weekly mileage tiers
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
// FITNESS: Bench press badges
var BENCH_BADGES = [
  {id:'bench_135', name:'Bench: 135 lbs', icon:'🏋️', desc:'Log a bench press PR of 135 lbs or more', minLbs:135},
  {id:'bench_185', name:'Bench: 185 lbs', icon:'🏋️', desc:'Log a bench press PR of 185 lbs or more', minLbs:185},
  {id:'bench_225', name:'Bench: 225 lbs', icon:'🏋️', desc:'Log a bench press PR of 225 lbs or more', minLbs:225}
];
// FITNESS: Squat and other lift badges
var SQUAT_LIFT_BADGES = [
  {id:'squat_bw',      name:'Bodyweight Squat',  icon:'🦵', desc:'Squat at or above your current body weight'},
  {id:'squat_225',     name:'Squat: 225 lbs',    icon:'🦵', desc:'Log a squat PR of 225 lbs or more', minLbs:225},
  {id:'squat_315',     name:'Squat: 315 lbs',    icon:'🦵', desc:'Log a squat PR of 315 lbs or more', minLbs:315},
  {id:'deadlift_first',name:'First Deadlift PR', icon:'🏋️', desc:'Log your first deadlift PR'},
  {id:'pullup_first',  name:'First Pull-up PR',  icon:'🤸', desc:'Log your first weighted pull-up PR'}
];
// PROTOCOL: Phase completion badges
var PHASE_BADGES = [
  {id:'phase1_done', name:'Phase I Complete',   icon:'✦', phaseEnd:6},
  {id:'phase2_done', name:'Phase II Complete',  icon:'⬡', phaseEnd:18},
  {id:'phase3_done', name:'Phase III Complete', icon:'◈', phaseEnd:30}
];
// PROTOCOL: Discipline badges (months since PROTO_START)
var DISC_BADGES = [
  {id:'disc_6mo',  name:'6-Month Disciple', icon:'🎖️',  months:6},
  {id:'disc_1yr',  name:'1-Year Disciple',  icon:'🏅',  months:12},
  {id:'disc_2yr',  name:'2-Year Disciple',  icon:'🥇',  months:24},
  {id:'disc_3yr',  name:'3-Year Disciple',  icon:'🌟',  months:36},
  {id:'disc_5yr',  name:'5-Year Disciple',  icon:'👑',  months:60}
];
// PROTOCOL: Streak badges
var STREAK_BADGES = [
  {id:'streak_7',    name:'7-Day Streak',        icon:'🔥', desc:'7 consecutive days at 100% completion',   days:7},
  {id:'streak_30',   name:'30-Day Streak',        icon:'🔥', desc:'30 consecutive days at 100% completion',  days:30},
  {id:'streak_90',   name:'90-Day Streak',        icon:'🔥', desc:'90 consecutive days at 100% completion',  days:90},
  {id:'weeks_90pct', name:'3 Weeks Above 90%',    icon:'📈', desc:'3 consecutive weeks with 90%+ score',     weeks:3, threshold:90}
];
// HEALTH: Skin badges
var SKIN_BADGES = [
  {id:'spf_30',       name:'SPF Streak: 30 Days', icon:'☀️', desc:'Complete 30 skincare AM tasks', keyword:'SPF', target:30},
  {id:'retinol_first',name:'First Retinol Night', icon:'🌙', desc:'Complete your first PM retinol routine', keyword:'Retinol', target:1}
];
// HEALTH: Hair badges
var HAIR_BADGES = [
  {id:'fin_30',   name:'Finasteride: 30 Days',  icon:'💊', desc:'Complete 30 finasteride tasks',  keyword:'Finasteride', target:30},
  {id:'fin_180',  name:'Finasteride: 6 Months', icon:'💊', desc:'Complete 180 finasteride tasks', keyword:'Finasteride', target:180},
  {id:'minox_30', name:'Minoxidil: 30 Days',    icon:'💆', desc:'Complete 30 minoxidil tasks',    keyword:'Minoxidil',   target:30}
];
// HEALTH: Biometrics badges
var BIO_BADGES = [
  {id:'first_weigh', name:'First Weigh-In', icon:'⚖️', desc:'Log your first weight entry'},
  {id:'weight_155',  name:'155 lbs',        icon:'💪', desc:'Log a weight entry of 155 lbs or higher', minWeight:155},
  {id:'weight_160',  name:'160 lbs',        icon:'💪', desc:'Log a weight entry of 160 lbs or higher', minWeight:160},
  {id:'weight_165',  name:'165 lbs',        icon:'💪', desc:'Log a weight entry of 165 lbs or higher', minWeight:165}
];
// Achievement tab state (default: protocol)
var _achTab = localStorage.getItem('ac_ach_tab') || 'protocol';
// Streak cache (cleared on each renderAchievements call)
var _streakData = null;

function timeToSec(t){var p=t.split(':');if(p.length===2)return parseInt(p[0])*60+parseFloat(p[1]);return parseFloat(t)||9999;}
function secToTime(s){var m=Math.floor(s/60);var sec=s%60;return m+':'+(sec<10?'0':'')+sec;}

// ── Achievement helpers ───────────────────────────────────────

// Count how many chk entries (value=true) correspond to a task containing keyword
function countTaskCompletions(keyword) {
  var count = 0;
  var kw = keyword.toLowerCase();
  Object.keys(chk).forEach(function(key) {
    if (!chk[key]) return;
    var m = key.match(/^gw(\d+)([A-Za-z]+)(\d+)$/);
    if (!m) return;
    var gw = parseInt(m[1]);
    var day = m[2];
    var idx = parseInt(m[3]);
    if (DAYS.indexOf(day) === -1) return;
    var pm = Math.ceil(gw / 4);
    var tasks = buildSchedule(day, pm, gw);
    if (tasks[idx] && tasks[idx].task.toLowerCase().indexOf(kw) !== -1) count++;
  });
  return count;
}

// Build a map of dateString→pct, then find longest / current consecutive-100% day streaks
function computeStreakData() {
  var datePcts = {};
  var gwDaySet = {};
  Object.keys(chk).forEach(function(key) {
    var m = key.match(/^gw(\d+)([A-Za-z]+)(\d+)$/);
    if (!m) return;
    var gw = parseInt(m[1]), day = m[2];
    if (DAYS.indexOf(day) === -1) return;
    gwDaySet['gw'+gw+day] = {gw:gw, day:day};
  });
  Object.keys(gwDaySet).forEach(function(k) {
    var e = gwDaySet[k], gw = e.gw, day = e.day;
    var pm = Math.ceil(gw / 4);
    var tasks = buildSchedule(day, pm, gw);
    var total = tasks.length, done = 0;
    tasks.forEach(function(_, i) { if (chk['gw'+gw+day+i]) done++; });
    var pct = total > 0 ? Math.round(done / total * 100) : 0;
    var dayIdx = DAYS.indexOf(day);
    var date = new Date(PROTO_START);
    date.setDate(date.getDate() + (gw - 1) * 7 + dayIdx);
    var ds = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
    datePcts[ds] = pct;
  });
  var dates = Object.keys(datePcts).sort();
  var longest = 0, curStreak = 0;
  dates.forEach(function(ds, i) {
    if (datePcts[ds] === 100) {
      if (i === 0) { curStreak = 1; }
      else {
        var diff = (new Date(ds) - new Date(dates[i-1])) / 86400000;
        curStreak = (diff === 1) ? curStreak + 1 : 1;
      }
      if (curStreak > longest) longest = curStreak;
    } else { curStreak = 0; }
  });
  return {longest: longest, current: curStreak};
}

function getStreakData() {
  if (!_streakData) _streakData = computeStreakData();
  return _streakData;
}

// Find longest run of consecutive global weeks all >= threshold%
function getMaxConsecWeeks(threshold) {
  var gwNums = Object.keys(weekScores).map(function(k){ return parseInt(k.replace('gw','')); })
    .filter(function(n){ return !isNaN(n); }).sort(function(a,b){return a-b;});
  var streak = 0, maxStreak = 0;
  gwNums.forEach(function(n, i) {
    if ((weekScores['gw'+n]||0) >= threshold) {
      streak = (i > 0 && gwNums[i-1] === n-1) ? streak + 1 : 1;
      if (streak > maxStreak) maxStreak = streak;
    } else { streak = 0; }
  });
  return maxStreak;
}

// ── computeEarnedBadges ───────────────────────────────────────
function computeEarnedBadges() {
  var earned = {};
  _streakData = null; // reset cache

  // PROTOCOL: Perfect Week
  Object.keys(weekScores).forEach(function(k){ if (weekScores[k] === 100) earned['perfect_week'] = true; });

  // PROTOCOL: Phase Completion
  PHASE_BADGES.forEach(function(b) { if (cProtoMonth > b.phaseEnd) earned[b.id] = true; });

  // PROTOCOL: Discipline
  var now = new Date();
  var msPerMonth = 30.44 * 24 * 3600 * 1000;
  var monthsElapsed = Math.floor((now - PROTO_START) / msPerMonth);
  DISC_BADGES.forEach(function(b) { if (monthsElapsed >= b.months) earned[b.id] = true; });

  // PROTOCOL: Streaks
  var sd = getStreakData();
  STREAK_BADGES.forEach(function(b) {
    if (b.days && sd.longest >= b.days) earned[b.id] = true;
    if (b.weeks && getMaxConsecWeeks(b.threshold) >= b.weeks) earned[b.id] = true;
  });

  // FITNESS: Running
  if (ach.fivek && ach.fivek.length > 0) earned['finisher_5k'] = true;
  if (prs.mile) {
    var sec = timeToSec(prs.mile.v);
    MILE_TIERS.forEach(function(t) { if (sec < t.sec) earned[t.id] = true; });
  }
  var maxMiles = 0;
  Object.keys(weekMiles).forEach(function(k){ if(weekMiles[k] > maxMiles) maxMiles = weekMiles[k]; });
  MILES_TIERS.forEach(function(t) { if (maxMiles >= t.miles) earned[t.id] = true; });

  // FITNESS: Lifting
  var benchVal = prs.bench ? parseFloat(prs.bench.v) : 0;
  BENCH_BADGES.forEach(function(b) { if (benchVal >= b.minLbs) earned[b.id] = true; });
  var squatVal = prs.squat ? parseFloat(prs.squat.v) : 0;
  var bodyWt = parseFloat(bio.weight) || 0;
  if (squatVal > 0 && bodyWt > 0 && squatVal >= bodyWt) earned['squat_bw'] = true;
  if (squatVal >= 225) earned['squat_225'] = true;
  if (squatVal >= 315) earned['squat_315'] = true;
  if (prs.deadlift) earned['deadlift_first'] = true;
  if (prs.pullup) earned['pullup_first'] = true;

  // HEALTH: Skin
  var spfCount = countTaskCompletions('SPF');
  if (spfCount >= 30) earned['spf_30'] = true;
  var retinolCount = countTaskCompletions('Retinol');
  if (retinolCount >= 1) earned['retinol_first'] = true;

  // HEALTH: Hair
  var finCount = countTaskCompletions('Finasteride');
  if (finCount >= 30) earned['fin_30'] = true;
  if (finCount >= 180) earned['fin_180'] = true;
  var minoxCount = countTaskCompletions('Minoxidil');
  if (minoxCount >= 30) earned['minox_30'] = true;

  // HEALTH: Biometrics
  var wtHist = bio.wtHist || [];
  if (wtHist.length > 0) earned['first_weigh'] = true;
  wtHist.forEach(function(e) {
    var w = parseFloat(e.v);
    if (isNaN(w)) return;
    if (w >= 155) earned['weight_155'] = true;
    if (w >= 160) earned['weight_160'] = true;
    if (w >= 165) earned['weight_165'] = true;
  });

  return earned;
}

// ── Badge row renderers ───────────────────────────────────────
function badgeRow(icon, name, desc, isEarned, progress) {
  var rowCls = 'badge-row' + (isEarned ? '' : ' locked-row');
  var cirCls = 'badge-circle ' + (isEarned ? 'earned' : 'locked');
  var h = '<div class="'+rowCls+'">';
  h += '<div class="'+cirCls+'">'+icon+'</div>';
  h += '<div class="badge-row-body">';
  h += '<div class="badge-row-name">'+name+'</div>';
  h += '<div class="badge-row-desc">'+desc+'</div>';
  if (progress) {
    var pct = progress.target > 0 ? Math.min(100, Math.round(progress.cur / progress.target * 100)) : 0;
    h += '<div class="badge-row-prog">';
    h += '<div class="badge-prog-bar"><div class="badge-prog-fill" style="width:'+pct+'%"></div></div>';
    h += '<div class="badge-prog-lbl">'+progress.label+'</div>';
    h += '</div>';
  }
  h += '</div></div>';
  return h;
}

function badgeSectionLabel(text) {
  return '<div class="badge-section-lbl">'+text+'</div>';
}

function badgeLockDivider() {
  return '<div class="badge-locked-divider"><span>Locked</span></div>';
}

function renderBadgeGroup(badges, earned, getDesc, getProgress) {
  var earnedArr = badges.filter(function(b){ return !!earned[b.id]; });
  var lockedArr = badges.filter(function(b){ return !earned[b.id]; });
  var h = '';
  earnedArr.forEach(function(b){ h += badgeRow(b.icon, b.name, getDesc(b), true, getProgress ? getProgress(b, true) : null); });
  if (earnedArr.length && lockedArr.length) h += badgeLockDivider();
  else if (!earnedArr.length && lockedArr.length) {} // no divider needed
  lockedArr.forEach(function(b){ h += badgeRow(b.icon, b.name, getDesc(b), false, getProgress ? getProgress(b, false) : null); });
  return h;
}

// ── selAchTab / renderAchievements ────────────────────────────
function selAchTab(tab) {
  _achTab = tab;
  localStorage.setItem('ac_ach_tab', tab);
  renderAchievements();
}

function renderAchievements() {
  _streakData = null;
  var earned = computeEarnedBadges();

  // Progress values
  var spfCount    = countTaskCompletions('SPF');
  var retinolCount= countTaskCompletions('Retinol');
  var finCount    = countTaskCompletions('Finasteride');
  var minoxCount  = countTaskCompletions('Minoxidil');
  var sd          = getStreakData();
  var consecWeeks = getMaxConsecWeeks(90);
  var maxMiles    = 0;
  Object.keys(weekMiles).forEach(function(k){ if(weekMiles[k]>maxMiles) maxMiles=weekMiles[k]; });
  var mileSec     = prs.mile ? timeToSec(prs.mile.v) : null;
  var benchVal    = prs.bench ? parseFloat(prs.bench.v) : 0;
  var squatVal    = prs.squat ? parseFloat(prs.squat.v) : 0;
  var monthsElapsed = Math.floor((new Date() - PROTO_START) / (30.44 * 24 * 3600 * 1000));

  // Tab badge counts
  var healthIds = SKIN_BADGES.concat(HAIR_BADGES).concat(BIO_BADGES).map(function(b){return b.id;});
  var fitnessIds = ['finisher_5k']
    .concat(MILE_TIERS.map(function(b){return b.id;}))
    .concat(MILES_TIERS.map(function(b){return b.id;}))
    .concat(BENCH_BADGES.map(function(b){return b.id;}))
    .concat(SQUAT_LIFT_BADGES.map(function(b){return b.id;}));
  var protocolIds = ['perfect_week']
    .concat(PHASE_BADGES.map(function(b){return b.id;}))
    .concat(DISC_BADGES.map(function(b){return b.id;}))
    .concat(STREAK_BADGES.map(function(b){return b.id;}));

  function cntE(ids){ return ids.filter(function(id){return !!earned[id];}).length; }
  var totalEarned = cntE(healthIds.concat(fitnessIds).concat(protocolIds));

  var html = '';

  // Hero count
  html += '<div class="ach-hero">';
  html += '<div class="ach-hero-lbl">Badges Earned</div>';
  html += '<div class="ach-hero-num">'+totalEarned+'</div>';
  html += '</div>';

  // Tab bar
  html += '<div class="ach-tabs">';
  [['health', cntE(healthIds)], ['fitness', cntE(fitnessIds)], ['protocol', cntE(protocolIds)]].forEach(function(pair) {
    var tab = pair[0], cnt = pair[1];
    var label = tab.charAt(0).toUpperCase() + tab.slice(1);
    html += '<button class="ach-tab'+(tab===_achTab?' on':'')+'" onclick="selAchTab(\''+tab+'\')">'
      + label+' ('+cnt+')</button>';
  });
  html += '</div>';

  // ── Health tab ───────────────────────────────────────────────
  if (_achTab === 'health') {
    html += '<div class="card">';

    html += badgeSectionLabel('Skin');
    html += renderBadgeGroup(SKIN_BADGES, earned,
      function(b){ return b.desc; },
      function(b) {
        var c = b.keyword === 'SPF' ? spfCount : retinolCount;
        return {cur:c, target:b.target, label:c+' / '+b.target+(b.target===1?' night':' days')};
      }
    );

    html += badgeSectionLabel('Hair');
    html += renderBadgeGroup(HAIR_BADGES, earned,
      function(b){ return b.desc; },
      function(b) {
        var c = b.keyword === 'Finasteride' ? finCount : minoxCount;
        return {cur:c, target:b.target, label:c+' / '+b.target+' days'};
      }
    );

    html += badgeSectionLabel('Biometrics');
    html += renderBadgeGroup(BIO_BADGES, earned,
      function(b){ return b.desc; },
      null
    );

    html += '</div>';

  // ── Fitness tab ──────────────────────────────────────────────
  } else if (_achTab === 'fitness') {
    html += '<div class="card">';

    // Running: 5K Finisher
    html += badgeSectionLabel('Running');
    var fivekE = !!earned['finisher_5k'];
    if (fivekE) html += badgeRow('🏁', '5K Finisher', 'Complete your first 5K race', true, null);

    // Mile time tiers — all shown
    var mileEarned = MILE_TIERS.filter(function(t){return !!earned[t.id];});
    var mileLocked = MILE_TIERS.filter(function(t){return !earned[t.id];});
    mileEarned.forEach(function(t){
      html += badgeRow(t.icon, t.name, 'Run a mile in under '+secToTime(t.sec), true, null);
    });
    if ((mileEarned.length || fivekE) && (mileLocked.length || !fivekE)) html += badgeLockDivider();
    mileLocked.forEach(function(t) {
      var tIdx = MILE_TIERS.indexOf(t);
      var prevSec = tIdx > 0 ? MILE_TIERS[tIdx-1].sec : 12*60;
      var prog;
      if (mileSec !== null) {
        var range = Math.max(1, prevSec - t.sec);
        var val = Math.max(0, Math.min(prevSec - mileSec, range));
        prog = {cur:val, target:range, label:secToTime(mileSec)+' → Sub-'+Math.floor(t.sec/60)+':'+String(t.sec%60).padStart(2,'0')};
      } else {
        prog = {cur:0, target:1, label:'No PR logged → Sub-'+Math.floor(t.sec/60)+':'+String(t.sec%60).padStart(2,'0')};
      }
      html += badgeRow(t.icon, t.name, 'Run a mile in under '+secToTime(t.sec), false, prog);
    });
    if (!fivekE) html += badgeRow('🏁', '5K Finisher', 'Complete your first 5K race', false, null);

    // Weekly Mileage
    html += badgeSectionLabel('Weekly Mileage');
    html += '<div class="miles-log-row"><input class="ach-inp" id="milesInp" type="number" step="0.1" placeholder="Log miles this week"><button class="ach-log-btn" onclick="logWeekMiles()">Log</button></div>';
    var milesEarned = MILES_TIERS.filter(function(t){return !!earned[t.id];});
    var milesLocked = MILES_TIERS.filter(function(t){return !earned[t.id];});
    milesEarned.forEach(function(t){
      html += badgeRow(t.icon, t.name, 'Log a week with '+t.miles+'+ miles', true, null);
    });
    if (milesEarned.length && milesLocked.length) html += badgeLockDivider();
    milesLocked.forEach(function(t){
      html += badgeRow(t.icon, t.name, 'Log a week with '+t.miles+'+ miles', false,
        {cur:Math.min(maxMiles, t.miles), target:t.miles, label:maxMiles.toFixed(1)+' / '+t.miles+' miles'});
    });

    // Lifting: bench
    html += badgeSectionLabel('Lifting');
    html += renderBadgeGroup(BENCH_BADGES, earned,
      function(b){ return b.desc; },
      function(b) {
        return benchVal > 0
          ? {cur:Math.min(benchVal, b.minLbs), target:b.minLbs, label:benchVal+' / '+b.minLbs+' lbs'}
          : {cur:0, target:b.minLbs, label:'0 / '+b.minLbs+' lbs'};
      }
    );
    // Squat + other lifts
    html += renderBadgeGroup(SQUAT_LIFT_BADGES, earned,
      function(b){ return b.desc; },
      function(b) {
        if (b.id === 'squat_bw' || b.id === 'deadlift_first' || b.id === 'pullup_first') return null;
        return squatVal > 0
          ? {cur:Math.min(squatVal, b.minLbs), target:b.minLbs, label:squatVal+' / '+b.minLbs+' lbs'}
          : {cur:0, target:b.minLbs, label:'0 / '+b.minLbs+' lbs'};
      }
    );

    html += '</div>';

  // ── Protocol tab ─────────────────────────────────────────────
  } else {
    html += '<div class="card">';

    html += badgeSectionLabel('Milestones');
    var pwE = !!earned['perfect_week'];
    html += badgeRow('💯', 'Perfect Week', 'Complete 100% of all tasks in any single week', pwE, null);

    html += badgeSectionLabel('Phase Completion');
    html += renderBadgeGroup(PHASE_BADGES, earned,
      function(b){ return 'Complete '+b.phaseEnd+' months of the protocol'; },
      null
    );

    html += badgeSectionLabel('Discipline');
    html += renderBadgeGroup(DISC_BADGES, earned,
      function(b){ return b.months+' months on the protocol'; },
      function(b) {
        return {cur:Math.min(monthsElapsed, b.months), target:b.months, label:monthsElapsed+' / '+b.months+' months'};
      }
    );

    html += badgeSectionLabel('Streaks');
    html += renderBadgeGroup(STREAK_BADGES, earned,
      function(b){ return b.desc; },
      function(b) {
        if (b.weeks) return {cur:Math.min(consecWeeks,b.weeks), target:b.weeks, label:consecWeeks+' / '+b.weeks+' weeks'};
        return {cur:Math.min(sd.longest,b.days), target:b.days, label:sd.longest+' / '+b.days+' days'};
      }
    );

    html += '</div>';
  }

  // ── Race times (always below tabs) ───────────────────────────
  var ranks=['gold','silver','bronze'], rlbls=['#1','#2','#3'];
  ACH_DISTS.forEach(function(dist){
    var times=(ach[dist.k]||[]).slice(0,3);
    html+='<div class="card"><div class="ach-sec"><div class="ach-hdr"><span class="ach-icon">'+dist.icon+'</span><span class="ach-title">'+dist.l+'</span></div>';
    if(!times.length)html+='<div style="font-size:13px;color:var(--mu);font-style:italic;padding:4px 0 8px">No times logged yet.</div>';
    times.forEach(function(entry,i){
      html+='<div class="ach-swipe-wrap">'
        +'<button class="ach-del-reveal-btn" onclick="deleteAchTime(\''+dist.k+'\','+i+')">Delete</button>'
        +'<div class="ach-row" id="achrow-'+dist.k+'-'+i+'">'
        +'<span class="ach-rank '+ranks[i]+'">'+rlbls[i]+'</span>'
        +'<span class="ach-time" onclick="editAchTime(\''+dist.k+'\','+i+',this)" style="cursor:text">'+entry.v+'</span>'
        +'<span class="ach-date">'+entry.d+'</span>'
        +'</div></div>';
    });
    html+='<div class="ach-add"><input class="ach-inp" id="achInp-'+dist.k+'" placeholder="Log time (e.g. 24:32)" type="text"><button class="ach-log-btn" onclick="logAchievement(\''+dist.k+'\')">Log</button></div></div></div>';
  });

  document.getElementById('achBody').innerHTML = html;
  ACH_DISTS.forEach(function(dist){
    var inp=document.getElementById('achInp-'+dist.k);if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')logAchievement(dist.k);});
    (ach[dist.k]||[]).slice(0,3).forEach(function(_,i){attachAchSwipe(dist.k,i);});
  });
  var milesInp=document.getElementById('milesInp');if(milesInp)milesInp.addEventListener('keydown',function(e){if(e.key==='Enter')logWeekMiles();});
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
function getGroceryTargetWeek(){
  var now=new Date();
  var estHour=parseInt(now.toLocaleString('en-US',{timeZone:'America/New_York',hour:'numeric',hour12:false}),10);
  var dow=now.getDay();
  if((dow===5&&estHour>=12)||dow===6||dow===0)return globalWeek()+1;
  return globalWeek();
}
function getNextWeekLabel(){
  var tw=getGroceryTargetWeek();
  var mon=new Date(PROTO_START);
  mon.setDate(mon.getDate()+(tw-1)*7);
  var fmt=function(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});};
  return'Week of '+fmt(mon)+' – '+fmt(new Date(mon.getTime()+6*86400000));
}
function _renderGroceryBody(){
  var labels={protein:'Protein',produce:'Produce',grains:'Grains & Carbs',dairy:'Dairy & Eggs',snacks:'Snacks & Other'};
  var chkSvg='<svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4L3.5 6.5L9 1"/></svg>';
  var html='<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="cb" onclick="resetGroceryChecks()" style="font-size:12px;color:var(--mu);padding:4px 10px;background:var(--s);border-radius:8px;border:1px solid var(--b)">Reset checks</button></div>';
  Object.keys(labels).forEach(function(cat){
    var customs=glc['custom.'+cat]||[];
    var allItems=[];
    customs.forEach(function(item,i){allItems.push({item:item,key:'gl.'+cat+'.c'+i,type:'custom',idx:i});});
    var unchecked=[],checked=[];
    allItems.forEach(function(obj){if(glc[obj.key])checked.push(obj);else unchecked.push(obj);});
    html+='<div class="gl-sec"><div class="gl-sh">'+labels[cat]+'</div>';
    if(!allItems.length){
      html+='<div style="color:var(--mu);font-size:13px;padding:6px 2px 8px">Tap + to add items.</div>';
    }
    unchecked.forEach(function(obj){
      var sk=obj.key.replace(/\./g,'-');
      html+='<div class="gl-item-wrap">'
        +'<button class="gl-del-reveal-btn" onclick="deleteGroceryItem(\''+cat+'\','+obj.idx+')">Delete</button>'
        +'<div class="gl-item" id="gli-'+sk+'">'
        +'<div class="gl-chk" onclick="toggleGrocery(\''+obj.key+'\')"></div>'
        +'<span class="gl-name" onclick="openGroceryInlineEdit(this,\''+cat+'\','+obj.idx+')">'+escHtml(obj.item)+'</span>'
        +'</div>'
        +'<button class="hover-del-btn" onclick="deleteGroceryItem(\''+cat+'\','+obj.idx+')" tabindex="-1">×</button>'
        +'</div>';
    });
    if(checked.length){
      html+='<div class="gl-done-sep">';
      checked.forEach(function(obj){
        var sk=obj.key.replace(/\./g,'-');
        html+='<div class="gl-item-wrap">'
          +'<button class="gl-del-reveal-btn" onclick="deleteGroceryItem(\''+cat+'\','+obj.idx+')">Delete</button>'
          +'<div class="gl-item" id="gli-'+sk+'">'
          +'<div class="gl-chk on" onclick="toggleGrocery(\''+obj.key+'\')">'+chkSvg+'</div>'
          +'<span class="gl-name done">'+escHtml(obj.item)+'</span>'
          +'</div>'
          +'<button class="hover-del-btn" onclick="deleteGroceryItem(\''+cat+'\','+obj.idx+')" tabindex="-1">×</button>'
          +'</div>';
      });
      html+='</div>';
    }
    html+='<div class="gl-add-row"><input class="gl-add-inp" id="glInp-'+cat+'" placeholder="Add item..." type="text"><button class="gl-add-btn" onclick="addGroceryItem(\''+cat+'\')">+</button></div>';
    html+='</div>';
  });
  document.getElementById('glBody').innerHTML=html;
  Object.keys(labels).forEach(function(cat){var inp=document.getElementById('glInp-'+cat);if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')addGroceryItem(cat);});});
  attachGrocerySwipe();
}
function resetGroceryChecks(){
  Object.keys(glc).forEach(function(k){if(k.indexOf('gl.')===0)delete glc[k];});
  save();renderGrocery();
}
function renderGrocery(){
  _glSwipedRow=null;
  document.getElementById('glWeekLabel').textContent=getNextWeekLabel();
  var tw=getGroceryTargetWeek();
  // Reference card (always rendered synchronously)
  var refCard=document.getElementById('glRefCard');
  if(refCard){
    var open=localStorage.getItem('ac_grocery_card_open')==='true';
    var refTitle=(tw>globalWeek()?'Next':'This')+' Week\'s Meals';
    var rc='<div class="card" style="margin-bottom:14px">'
      +'<div class="gl-ref-hdr" onclick="toggleGroceryRefCard()">'
      +'<div class="ct" style="margin-bottom:0">'+refTitle+'</div>'
      +'<span class="bn-chev'+(open?' open':'')+'">›</span>'
      +'</div>'
      +'<div class="gl-ref-body'+(open?' open':'')+'">'
      +'<div class="gl-ref-cols">'
      +'<div class="gl-ref-col">'
      +'<div class="gl-ref-sub" style="color:var(--a)">Dinners</div>';
    ['Monday','Tuesday','Wednesday','Thursday'].forEach(function(d){
      var dn=getDinner(tw,d)||'—';
      rc+='<div class="mr"><span class="ml">'+d.slice(0,3)+'</span><span class="mv">'+escHtml(dn)+'</span></div>';
    });
    rc+='</div>'
      +'<div class="gl-ref-col">'
      +'<div class="gl-ref-sub" style="color:var(--a)">Breakfasts</div>';
    DAYS.forEach(function(d){
      var bf=getBreakfast(tw,d)||'—';
      rc+='<div class="mr"><span class="ml">'+d.slice(0,3)+'</span><span class="mv">'+escHtml(bf)+'</span></div>';
    });
    rc+='</div>'
      +'<div class="gl-ref-col">'
      +'<div class="gl-ref-sub" style="color:var(--a)">Snacks</div>';
    DAYS.forEach(function(d){
      var sn=getSnack(tw,d)||'—';
      rc+='<div class="mr"><span class="ml">'+d.slice(0,3)+'</span><span class="mv">'+escHtml(sn)+'</span></div>';
    });
    rc+='</div></div></div></div>';
    refCard.innerHTML=rc;
  }
  _renderGroceryBody();
}
function toggleGroceryRefCard(){
  var open=localStorage.getItem('ac_grocery_card_open')==='true';
  open=!open;
  localStorage.setItem('ac_grocery_card_open',String(open));
  var body=document.querySelector('#glRefCard .gl-ref-body');
  var chev=document.querySelector('#glRefCard .bn-chev');
  if(body)body.classList.toggle('open',open);
  if(chev)chev.classList.toggle('open',open);
}
function openGroceryInlineEdit(spanEl,cat,idx){
  if(_glSwipedRow){_glSnapBack();return;}
  var current=spanEl.textContent;
  var inp=document.createElement('input');
  inp.className='gl-edit-inp';
  inp.value=current;
  inp.style.flex='1';
  var committed=false;
  function commit(){
    if(committed)return;committed=true;
    var val=inp.value.trim();
    if(val&&val!==current){var customs=glc['custom.'+cat]||[];customs[idx]=val;glc['custom.'+cat]=customs;save();}
    renderGrocery();
  }
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){e.preventDefault();inp.blur();}
    if(e.key==='Escape'){e.preventDefault();committed=true;renderGrocery();}
  });
  spanEl.parentNode.replaceChild(inp,spanEl);
  inp.focus();inp.select();
}
function attachGrocerySwipe(){
  document.querySelectorAll('#glBody .gl-item[id^="gli-"]').forEach(function(item){
    var tx=0,ty=0;
    item.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
    item.addEventListener('touchend',function(e){
      var dx=e.changedTouches[0].clientX-tx;
      var dy=Math.abs(e.changedTouches[0].clientY-ty);
      if(dy>Math.abs(dx)||Math.abs(dx)<8)return;
      if(dx<-40){
        if(_glSwipedRow&&_glSwipedRow!==item){_glSwipedRow.style.transform='';}
        item.style.transform='translateX(-80px)';
        _glSwipedRow=item;
      }else if(dx>20&&_glSwipedRow===item){
        _glSnapBack();
      }
    },{passive:true});
  });
}
function toggleGrocery(key){glc[key]=!glc[key];save();renderGrocery();}
function addGroceryItem(cat){var inp=document.getElementById('glInp-'+cat);if(!inp)return;var v=inp.value.trim();if(!v)return;if(!glc['custom.'+cat])glc['custom.'+cat]=[];glc['custom.'+cat].push(v);save();renderGrocery();}
function deleteGroceryItem(cat,idx){
  _glSwipedRow=null;
  var customs=glc['custom.'+cat]||[];customs.splice(idx,1);glc['custom.'+cat]=customs;
  save();renderGrocery();
}

// ── Protocol Guide ─────────────────────────────────────────────
function renderGuide(){
  var html='';
  Object.keys(GUIDE_DATA).forEach(function(cat){
    var sec=GUIDE_DATA[cat];
    html+='<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--mu);margin-bottom:8px;margin-top:4px">'+sec.label+'</div>';
    sec.items.forEach(function(item,i){
      var gid=cat+i;
      var prodsHtml='';
      if(item.products){
        item.products.forEach(function(p){
          prodsHtml+='<div class="guide-prod-item">'+p+'</div>';
        });
      }
      html+='<div class="guide-card"><div class="guide-hdr" onclick="toggleGuide(\''+gid+'\')">'
        +'<div class="guide-icon" style="background:'+sec.color+'">'+sec.icon+'</div>'
        +'<div style="flex:1;min-width:0"><div class="guide-name">'+item.name+'</div><div class="guide-sub">'+item.sub+'</div></div>'
        +'<span class="rpc" id="gg-'+gid+'">›</span></div>'
        +'<div class="guide-body" id="gb-g-'+gid+'">'
        +'<div class="guide-row"><span class="guide-lbl">Dose</span><span class="guide-val">'+item.dose+'</span></div>'
        +'<div class="guide-row"><span class="guide-lbl">Why</span><span class="guide-val">'+item.why+'</span></div>'
        +(item.products
          ? '<div class="guide-prod-hdr" onclick="toggleGuideProducts(\''+gid+'\')">'
            +'<span class="guide-lbl">Products</span>'
            +'<span class="rpc" id="gp-'+gid+'">›</span></div>'
            +'<div class="guide-prod-body" id="gpb-'+gid+'">'+prodsHtml+'</div>'
          : '')
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
function toggleGuideProducts(id){
  var body=document.getElementById('gpb-'+id),chev=document.getElementById('gp-'+id);
  if(!body)return;
  var open=body.classList.contains('open');
  body.classList.toggle('open',!open);if(chev)chev.classList.toggle('open',!open);
}
