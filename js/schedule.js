'use strict';

function buildSchedule(day, protoMonth, globalWeek) {
  var meta   = APP.getMeta(protoMonth);
  var isWE   = (day === 'Saturday' || day === 'Sunday');
  var isRet  = meta.rn.indexOf(day) !== -1;
  var retStr = isRet ? 'Skincare PM: Cleanser → Retinol → Moisturizer'
                     : 'Skincare PM: Cleanser → Moisturizer only';
  var t = [];

  // ── Morning ──────────────────────────────────────────────
  t.push({ time: isWE ? '7:00 AM' : '6:30 AM', task: 'Wake — drink 16oz water', tag: 'nutrition' });
  t.push({ time: isWE ? '7:10 AM' : '6:40 AM', task: 'Shower', tag: 'shower' });
  t.push({ time: isWE ? '7:15 AM' : '6:45 AM', task: 'Skincare AM: Cleanser → Vitamin C → SPF', tag: 'skincare' });

  if (!isWE) {
    t.push({ time: '7:00 AM', task: 'Breakfast: ' + APP.getBreakfast(globalWeek, day), tag: 'nutrition' });
  }
  t.push({ time: isWE ? '7:30 AM' : '7:05 AM', task: 'Supplements: D3/K2 · Omega-3 · Ashwagandha 600mg', tag: 'supplement' });

  // ── Work day ─────────────────────────────────────────────
  if (!isWE) {
    t.push({ time: '8:00 AM', task: 'Work begins', tag: 'admin' });
    var ln = day === 'Monday'
      ? (APP.ovr['monlunch'] || 'Work lunch — cafeteria')
      : (APP.getLunch(globalWeek, day) ? 'Leftovers: ' + APP.getLunch(globalWeek, day) : null);
    if (ln) t.push({ time: '12:00 PM', task: 'Lunch: ' + ln, tag: 'nutrition' });
  }

  t.push({ time: isWE ? '1:00 PM' : '3:30 PM', task: 'Snack: ' + APP.getSnack(globalWeek, day), tag: 'nutrition' });

  // ── Training ─────────────────────────────────────────────
  if (day === 'Monday' || day === 'Tuesday' || day === 'Friday') {
    var woKey = { Monday: 'Mon', Tuesday: 'Tue', Friday: 'Fri' }[day];
    t.push({ time: '5:00 PM', task: 'Leave office — change into gym clothes', tag: 'admin' });
    t.push({ time: '5:30 PM', task: 'Pre-gym: Citrulline 6g + caffeine (opt)', tag: 'supplement' });
    t.push({ time: '6:00 PM', task: 'Gym — ' + APP.getWorkout(woKey), tag: 'gym' });
    t.push({ time: '7:15 PM', task: 'Post-gym: Creatine 5g with juice', tag: 'supplement' });
  }

  if (day === 'Wednesday') {
    t.push({ time: '5:30 PM', task: 'Run — ' + meta.rd, tag: 'cardio' });
    t.push({ time: '6:15 PM', task: 'Post-run shower', tag: 'shower' });
  }

  if (day === 'Thursday') {
    t.push({ time: '5:00 PM', task: 'Rest day — 20-min walk or full rest', tag: 'cardio' });
  }

  if (day === 'Saturday') {
    var satWo = APP.satType() === 'A' ? APP.getWorkout('SatA') : APP.getWorkout('SatB');
    t.push({ time: '9:30 AM', task: 'Pre-gym: Citrulline 6g + caffeine (opt)', tag: 'supplement' });
    t.push({ time: '10:00 AM', task: 'Gym — ' + satWo, tag: 'gym' });
    t.push({ time: '11:15 AM', task: 'Post-gym: Creatine 5g', tag: 'supplement' });
  }

  if (day === 'Sunday') {
    t.push({ time: '10:00 AM', task: 'Meal prep 60 min: protein · grains · veg · lunch containers', tag: 'nutrition' });
    t.push({ time: '2:00 PM',  task: 'Mobility, stretching or light walk', tag: 'cardio' });
    t.push({ time: '8:30 PM',  task: 'Review week: grocery list + schedule', tag: 'admin' });
  }

  // ── Dinner (Mon–Thu) ─────────────────────────────────────
  if (['Monday','Tuesday','Wednesday','Thursday'].indexOf(day) !== -1) {
    var dn = APP.getDinner(globalWeek, day);
    if (dn) {
      t.push({ time: '7:15 PM', task: 'Start dinner (~30 min)', tag: 'nutrition' });
      t.push({ time: '7:45 PM', task: 'Dinner: ' + dn, tag: 'nutrition' });
    }
  }

  if (day === 'Friday') {
    t.push({ time: '7:30 PM', task: 'Date night — eat out freely', tag: 'nutrition' });
  }

  // ── Evening ──────────────────────────────────────────────
  t.push({ time: '9:00 PM', task: retStr, tag: 'skincare' });
  t.push({ time: '9:15 PM', task: 'Magnesium Glycinate 300–400mg', tag: 'supplement' });
  t.push({ time: '9:30 PM', task: 'Evening snack: ' + APP.getEveningSnack(globalWeek, day), tag: 'nutrition' });
  t.push({ time: '10:00 PM', task: 'Sleep — 7 to 8 hours', tag: 'sleep' });

  return t;
}
