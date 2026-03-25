'use strict';

function getMeta(protoMonth) {
  var phase = getPhaseForMonth(protoMonth);
  var b = phaseMonthMeta(protoMonth, phase.id);
  var mk = 'm.'+protoMonth+'.';
  ['label','ret','run','wt','rd','hl'].forEach(function(k){if(ovr[mk+k])b[k]=ovr[mk+k];});
  if(ovr[mk+'rn'])b.rn=ovr[mk+'rn'];
  b.hl = b.hl || phase.hl;
  return b;
}
function getBreakfast(gWeek, d) {
  var pm=Math.floor((gWeek-1)/4)+1, wk=((gWeek-1)%4)+1;
  var ds=getDateStringForDay(pm,wk,d);
  return ovr['bf.actual.'+ds] || ovr['bf.'+gWeek+'.'+d] || BF[((gWeek-1)*7+DAYS.indexOf(d))%16];
}
function getDinner(gWeek, d) {
  var idx={Monday:0,Tuesday:1,Wednesday:2,Thursday:3};
  if(!(d in idx))return null;
  var i=(gWeek-1)*4+idx[d];
  var pm=Math.floor((gWeek-1)/4)+1, wk=((gWeek-1)%4)+1;
  var ds=getDateStringForDay(pm,wk,d);
  return ovr['din.actual.'+ds] || ovr['din.'+(i%16)] || BD[i%16];
}
function getLunch(gWeek, d) {
  var prev={Tuesday:'Monday',Wednesday:'Tuesday',Thursday:'Wednesday',Friday:'Thursday'};
  if(!prev[d])return null;
  var pm=Math.floor((gWeek-1)/4)+1, wk=((gWeek-1)%4)+1;
  var ds=getDateStringForDay(pm,wk,d);
  if(ovr['lunch.actual.'+ds])return ovr['lunch.actual.'+ds];
  return getDinner(gWeek,prev[d]);
}
function getSnack(gWeek, d) {
  var pm=Math.floor((gWeek-1)/4)+1, wk=((gWeek-1)%4)+1;
  var ds=getDateStringForDay(pm,wk,d);
  if(ovr['sn.actual.'+ds])return ovr['sn.actual.'+ds];
  if(ovr['sn.'+gWeek+'.'+d])return ovr['sn.'+gWeek+'.'+d];
  var i=DAYS.indexOf(d);
  return(i%2===0?SH:SC)[(i+(gWeek-1))%7];
}
function getEvSnack(gWeek, d){
  var pm=Math.floor((gWeek-1)/4)+1, wk=((gWeek-1)%4)+1;
  var ds=getDateStringForDay(pm,wk,d);
  if(ovr['evsn.actual.'+ds])return ovr['evsn.actual.'+ds];
  if(ovr['evsn.'+gWeek+'.'+d])return ovr['evsn.'+gWeek+'.'+d];
  return SE[(DAYS.indexOf(d)+gWeek)%7];
}
function satType(gWeek){return gWeek%2===0?'B':'A';}
function globalWeek(){return(cProtoMonth-1)*4+cW;}
function ckKey(d,i){return 'gw'+globalWeek()+d+i;}

function buildSchedule(day, protoMonth, gWeek) {
  var meta = getMeta(protoMonth);
  var wt = satType(gWeek);
  var isWE = (day==='Saturday'||day==='Sunday');
  var isRet = meta.rn.indexOf(day) !== -1;
  var retStr = isRet ? 'Skincare PM: Cleanser → Retinol → Moisturizer' : 'Skincare PM: Cleanser → Moisturizer only';
  var t = [];

  t.push({time:isWE?'7:00 AM':'6:30 AM', task:'Wake — drink 16oz water', tag:'nutrition'});
  t.push({time:isWE?'7:10 AM':'6:40 AM', task:'Shower', tag:'shower'});
  t.push({time:isWE?'7:15 AM':'6:45 AM', task:'Skincare AM: Cleanser → Vitamin C → SPF', tag:'skincare'});
  if(!isWE)t.push({time:'7:00 AM', task:'Breakfast: '+getBreakfast(gWeek,day), tag:'nutrition'});
  t.push({time:isWE?'7:30 AM':'7:05 AM', task:'Supplements: D3/K2 · Omega-3 · Ashwagandha 600mg', tag:'supplement'});

  if(!isWE){
    t.push({time:'8:00 AM', task:'Work begins', tag:'admin'});
    var ln = day==='Monday'?(ovr['monlunch']||'Work lunch — cafeteria'):(getLunch(gWeek,day)?'Leftovers: '+getLunch(gWeek,day):null);
    if(ln)t.push({time:'12:00 PM', task:'Lunch: '+ln, tag:'nutrition'});
  }
  t.push({time:isWE?'1:00 PM':'3:30 PM', task:'Snack: '+getSnack(gWeek,day), tag:'nutrition'});

  var WO={
    Monday: ovr['wo.Mon'] ||'Push A: Incline DB Press · OHP · Lateral Raises · Tricep Pushdowns',
    Tuesday:ovr['wo.Tue'] ||'Pull A: Weighted Pull-ups · BB Row · Face Pulls · Bicep Curls',
    Friday: ovr['wo.Fri'] ||'Legs & Core: Back Squat · RDL · Hanging Leg Raises · Dead Bugs',
    SatA:   ovr['wo.SatA']||'Push B: Flat Bench · Arnold Press · Cable Laterals · Dips',
    SatB:   ovr['wo.SatB']||'Pull B: Lat Pulldown · Seated Row · Hammer Curls · Goblet Squat'
  };

  if(day==='Monday'||day==='Tuesday'||day==='Friday'){
    t.push({time:'5:00 PM', task:'Leave office — gym clothes', tag:'admin'});
    t.push({time:'5:30 PM', task:'Pre-gym: Citrulline 6g + caffeine (opt)', tag:'supplement'});
    t.push({time:'6:00 PM', task:'Gym — '+WO[day], tag:'gym'});
    t.push({time:'7:15 PM', task:'Post-gym: Creatine 5g with juice', tag:'supplement'});
  }
  if(day==='Wednesday'){
    t.push({time:'5:30 PM', task:'Run — '+meta.rd, tag:'cardio'});
    t.push({time:'6:15 PM', task:'Post-run shower', tag:'shower'});
  }
  if(day==='Thursday')t.push({time:'5:00 PM', task:'Rest day — 20-min walk or rest', tag:'cardio'});
  if(day==='Saturday'){
    var wo=wt==='A'?WO.SatA:WO.SatB;
    t.push({time:'9:30 AM', task:'Pre-gym: Citrulline 6g + caffeine (opt)', tag:'supplement'});
    t.push({time:'10:00 AM', task:'Gym — '+wo, tag:'gym'});
    t.push({time:'11:15 AM', task:'Post-gym: Creatine 5g', tag:'supplement'});
  }
  if(day==='Sunday'){
    t.push({time:'10:00 AM', task:'Meal prep 60 min: protein · grains · veg · lunch containers', tag:'nutrition'});
    t.push({time:'2:00 PM', task:'Mobility, stretching or light walk', tag:'cardio'});
    t.push({time:'8:30 PM', task:'Review week: grocery list + schedule', tag:'admin'});
  }
  if(['Monday','Tuesday','Wednesday','Thursday'].indexOf(day)!==-1){
    var dn=getDinner(gWeek,day);
    if(dn){t.push({time:'7:45 PM',task:'Dinner: '+dn,tag:'nutrition'});}
  }
  if(day==='Friday')t.push({time:'7:30 PM', task:'Date night — eat out freely', tag:'nutrition'});
  t.push({time:'9:00 PM', task:retStr, tag:'skincare'});
  t.push({time:'9:15 PM', task:'Magnesium Glycinate 300–400mg', tag:'supplement'});
  t.push({time:'9:30 PM', task:'Evening snack: '+getEvSnack(gWeek,day), tag:'nutrition'});
  t.push({time:'10:00 PM', task:'Sleep — 7 to 8 hours', tag:'sleep'});
  t.push({time:'7:10 AM', task:'Hair: Finasteride 1mg', tag:'hair'});
  t.push({time:'9:45 PM', task:'Hair: Minoxidil', tag:'hair'});
  return t;
}
