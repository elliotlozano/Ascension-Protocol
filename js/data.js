'use strict';
// ── Protocol Data & Schedule Logic ───────────────────────────

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DSUB = {
  Monday:'Push A · Gym', Tuesday:'Pull A · Gym', Wednesday:'Zone 2 Run',
  Thursday:'Active Rest', Friday:'Legs & Core · Gym', Saturday:'Gym · A/B', Sunday:'Rest & Prep'
};
const TAGS = {
  nutrition:'nu', gym:'gy', skincare:'sk', supplement:'su',
  cardio:'ca', sleep:'sl', admin:'ad', shower:'sh'
};

const PROTO_START = new Date(2026, 2, 9); // March 9 2026

// ── Phase definitions ─────────────────────────────────────────
const PHASES = [
  { id:1, label:'Phase I',   sub:'Re-Awakening',  monthStart:1,  monthEnd:6,   hl:'#d4a853' },
  { id:2, label:'Phase II',  sub:'Foundation',    monthStart:7,  monthEnd:18,  hl:'#6b8cae' },
  { id:3, label:'Phase III', sub:'Sculpture',     monthStart:19, monthEnd:30,  hl:'#7a9e87' },
  { id:4, label:'Phase IV',  sub:'Peak & Beyond', monthStart:31, monthEnd:999, hl:'#9e7a90' }
];

function getPhase(protoMonth) {
  return PHASES.find(p => protoMonth >= p.monthStart && protoMonth <= p.monthEnd) || PHASES[3];
}

function getMonthMeta(protoMonth) {
  const phase = getPhase(protoMonth);
  // Phase I per-month progression
  if (phase.id === 1) {
    const m = Math.min(protoMonth, 3);
    const names = ['','Foundation','Building','Momentum'];
    const retMap = {
      1: { ret:'Retinol: Wed + Fri PM only (2x/week).', rn:['Wednesday','Friday'], rd:'20 min easy Zone 2', run:'Run: 20 min easy Zone 2.', wt:'Weights: Form over load. Mind-muscle connection.' },
      2: { ret:'Retinol: Every other night. Skip if irritated.', rn:['Monday','Wednesday','Friday','Sunday'], rd:'25 min — easy + 2×3-min pickups', run:'Run: 25 min with 2×3-min pickups.', wt:'Weights: Begin adding load every 1–2 weeks.' },
      3: { ret:'Retinol: Nightly if tolerated.', rn:DAYS.slice(), rd:'30 min — warm-up + tempo + cool-down', run:'Run: 30 min with 1-mile tempo segment.', wt:'Weights: Progressive overload. Beat last week.' }
    };
    return { label:`Month ${protoMonth} — ${names[m]}`, hl:phase.hl, phase, ...retMap[m] };
  }
  if (phase.id === 2) return { label:`Month ${protoMonth} — Building`, hl:phase.hl, phase, ret:'Retinol: Nightly.', rn:DAYS.slice(), rd:'35+ min — structured intervals', run:'Run: Progressing toward sub-22 5K.', wt:'Weights: Progressive overload. Track every lift.' };
  if (phase.id === 3) return { label:`Month ${protoMonth} — Sculpture`, hl:phase.hl, phase, ret:'Retinol: Nightly.', rn:DAYS.slice(), rd:'30–40 min — maintenance', run:'Run: Maintenance + race prep.', wt:'Weights: V-taper focus — lateral delts, upper chest.' };
  return { label:`Month ${protoMonth} — Peak`, hl:phase.hl, phase, ret:'Retinol: Nightly.', rn:DAYS.slice(), rd:'30 min — maintenance', run:'Run: Performance maintenance.', wt:'Weights: High-rep polish. Protect joints.' };
}

function getMeta(protoMonth) {
  const base = getMonthMeta(protoMonth);
  const ovr = window.STATE.ovr;
  const mk = `m.${protoMonth}.`;
  ['label','ret','run','wt','rd','hl'].forEach(k => { if (ovr[mk+k]) base[k] = ovr[mk+k]; });
  if (ovr[mk+'rn']) base.rn = ovr[mk+'rn'];
  return base;
}

// ── Week helpers ──────────────────────────────────────────────
function globalWeek(protoMonth, weekInMonth) {
  return (protoMonth - 1) * 4 + weekInMonth;
}

function satType(gWeek) { return gWeek % 2 === 0 ? 'B' : 'A'; }

function ckKey(gWeek, day, idx) { return `gw${gWeek}${day}${idx}`; }

function calcProtocolDate() {
  const now = new Date();
  const diff = Math.floor((now - PROTO_START) / 86400000);
  if (diff < 0) return { protoMonth: 1, weekInMonth: 1, day: 'Monday' };
  const totalWeeks = Math.floor(diff / 7);
  const protoMonth = Math.floor(totalWeeks / 4) + 1;
  const weekInMonth = (totalWeeks % 4) + 1;
  const js = now.getDay();
  const day = DAYS[js === 0 ? 6 : js - 1];
  return { protoMonth, weekInMonth, day };
}

// ── Meal data ─────────────────────────────────────────────────
const BF = [
  'Oats + protein powder + frozen berries + peanut butter',
  '3 scrambled eggs + sprouted grain toast + avocado + orange',
  'Greek yogurt parfait: yogurt + oats + berries + honey',
  'Protein pancakes: oats + eggs + banana blended',
  'Veggie omelette: 3 eggs + spinach + mushrooms + feta + toast',
  'Overnight oats: rolled oats + chia seeds + almond milk + berries',
  'Smoothie: frozen banana + protein powder + almond milk + spinach',
  'Egg muffins (prepped Sunday): eggs + turkey sausage + peppers',
  'Savory oats: oats + fried egg + hot sauce + everything bagel',
  'French toast: Ezekiel bread + eggs + cinnamon + maple syrup',
  'Acai bowl: acai + banana + almond milk + granola + berries',
  'Breakfast burrito: eggs + black beans + salsa + wheat tortilla',
  'Cottage cheese bowl: cottage cheese + berries + granola + honey',
  'Turkey bacon + 3 eggs + whole grain toast + sliced tomato',
  'Banana oat shake: banana + oats + protein powder + almond milk',
  'Smoked salmon + cream cheese + whole grain toast + capers'
];
const BD = [
  'Baked salmon + roasted sweet potato + wilted spinach',
  'Lean beef tacos: corn tortillas + salsa + avocado + cabbage',
  'Grilled chicken thighs + brown rice + roasted broccoli',
  'Shrimp stir-fry + snap peas + bell pepper + brown rice + soy',
  'Pork tenderloin + mashed sweet potato + Brussels sprouts',
  'Bison burger (no bun) + sweet potato fries + side salad',
  'Pan-seared cod + quinoa + roasted asparagus + lemon drizzle',
  'Turkey meatballs + whole wheat pasta + marinara',
  'Garlic shrimp + cauliflower rice + cherry tomatoes + basil',
  'Grilled chicken + farro + cucumber-tomato salad + tzatziki',
  'Lean steak (sirloin) + roasted root vegetables + wild rice',
  'Baked chicken stuffed with spinach + feta + sun-dried tomato',
  'Seared tuna steak + jasmine rice + bok choy + ginger-soy',
  'Ground turkey bowl + black beans + corn + brown rice + pico',
  'Pan-seared salmon + lentils + zucchini + lemon tahini',
  'Chicken stir-fry + broccoli + mushrooms + brown rice'
];
const SH = ['Greek yogurt + almonds + honey','Cottage cheese + sliced peach or pineapple','2 hard-boiled eggs + carrots + hummus','Apple + natural almond butter','Edamame + sea salt','Rice cake + peanut butter + banana','Trail mix: almonds + walnuts + pumpkin seeds'];
const SC = ['Chomps/Epic bar + almonds','Chocolate-covered pretzels + string cheese','Protein bar (Quest or RXBar)','Pepperoni + cheddar + crackers','Dark chocolate (70%+) + mixed nuts','Beef jerky + apple slices','Light popcorn + string cheese'];
const SE = ['Casein shake + almond milk','Cottage cheese + walnuts','Greek yogurt + honey + cinnamon','2 rice cakes + natural peanut butter','String cheese + almonds','Banana + 1 tbsp almond butter','2 hard-boiled eggs + cucumber'];

function getBreakfast(gWeek, day) {
  return window.STATE.ovr[`bf.${gWeek}.${day}`] || BF[((gWeek-1)*7 + DAYS.indexOf(day)) % 16];
}
function getDinner(gWeek, day) {
  const idx = { Monday:0, Tuesday:1, Wednesday:2, Thursday:3 };
  if (!(day in idx)) return null;
  const i = (gWeek-1)*4 + idx[day];
  return window.STATE.ovr[`din.${i%16}`] || BD[i%16];
}
function getLunch(gWeek, day) {
  const prev = { Tuesday:'Monday', Wednesday:'Tuesday', Thursday:'Wednesday', Friday:'Thursday' };
  return prev[day] ? getDinner(gWeek, prev[day]) : null;
}
function getSnack(gWeek, day) {
  const k = `sn.${gWeek}.${day}`;
  if (window.STATE.ovr[k]) return window.STATE.ovr[k];
  const i = DAYS.indexOf(day);
  return (i % 2 === 0 ? SH : SC)[(i + (gWeek-1)) % 7];
}
function getEvSnack(gWeek, day) { return SE[(DAYS.indexOf(day) + gWeek) % 7]; }

// ── Workouts ──────────────────────────────────────────────────
function getWorkouts() {
  const ovr = window.STATE.ovr;
  return {
    Monday:  ovr['wo.Mon']  || 'Push A: Incline DB Press · OHP · Lateral Raises · Tricep Pushdowns',
    Tuesday: ovr['wo.Tue']  || 'Pull A: Weighted Pull-ups · BB Row · Face Pulls · Bicep Curls',
    Friday:  ovr['wo.Fri']  || 'Legs & Core: Back Squat · RDL · Hanging Leg Raises · Dead Bugs',
    SatA:    ovr['wo.SatA'] || 'Push B: Flat Bench · Arnold Press · Cable Laterals · Dips',
    SatB:    ovr['wo.SatB'] || 'Pull B: Lat Pulldown · Seated Row · Hammer Curls · Goblet Squat'
  };
}

// ── Schedule builder ──────────────────────────────────────────
function buildSchedule(day, protoMonth, gWeek) {
  const meta = getMeta(protoMonth);
  const wt = satType(gWeek);
  const isWE = day === 'Saturday' || day === 'Sunday';
  const isRet = meta.rn.includes(day);
  const retStr = isRet ? 'Skincare PM: Cleanser → Retinol → Moisturizer' : 'Skincare PM: Cleanser → Moisturizer only';
  const WO = getWorkouts();
  const t = [];

  t.push({ time: isWE?'7:00 AM':'6:30 AM', task:'Wake — drink 16oz water', tag:'nutrition' });
  t.push({ time: isWE?'7:10 AM':'6:40 AM', task:'Shower', tag:'shower' });
  t.push({ time: isWE?'7:15 AM':'6:45 AM', task:'Skincare AM: Cleanser → Vitamin C → SPF', tag:'skincare' });
  if (!isWE) t.push({ time:'7:00 AM', task:'Breakfast: ' + getBreakfast(gWeek, day), tag:'nutrition' });
  t.push({ time: isWE?'7:30 AM':'7:05 AM', task:'Supplements: D3/K2 · Omega-3 · Ashwagandha 600mg', tag:'supplement' });
  if (!isWE) {
    t.push({ time:'8:00 AM', task:'Work begins', tag:'admin' });
    const ln = day==='Monday' ? (window.STATE.ovr['monlunch']||'Work lunch — cafeteria') : (getLunch(gWeek,day) ? 'Leftovers: '+getLunch(gWeek,day) : null);
    if (ln) t.push({ time:'12:00 PM', task:'Lunch: ' + ln, tag:'nutrition' });
  }
  t.push({ time: isWE?'1:00 PM':'3:30 PM', task:'Snack: ' + getSnack(gWeek, day), tag:'nutrition' });

  if (['Monday','Tuesday','Friday'].includes(day)) {
    t.push({ time:'5:00 PM', task:'Leave office — gym clothes', tag:'admin' });
    t.push({ time:'5:30 PM', task:'Pre-gym: Citrulline 6g + caffeine (opt)', tag:'supplement' });
    t.push({ time:'6:00 PM', task:'Gym — ' + WO[day], tag:'gym' });
    t.push({ time:'7:15 PM', task:'Post-gym: Creatine 5g with juice', tag:'supplement' });
  }
  if (day === 'Wednesday') {
    t.push({ time:'5:30 PM', task:'Run — ' + meta.rd, tag:'cardio' });
    t.push({ time:'6:15 PM', task:'Post-run shower', tag:'shower' });
  }
  if (day === 'Thursday') t.push({ time:'5:00 PM', task:'Rest day — 20-min walk or rest', tag:'cardio' });
  if (day === 'Saturday') {
    const wo = wt === 'A' ? WO.SatA : WO.SatB;
    t.push({ time:'9:30 AM', task:'Pre-gym: Citrulline 6g + caffeine (opt)', tag:'supplement' });
    t.push({ time:'10:00 AM', task:'Gym — ' + wo, tag:'gym' });
    t.push({ time:'11:15 AM', task:'Post-gym: Creatine 5g', tag:'supplement' });
  }
  if (day === 'Sunday') {
    t.push({ time:'10:00 AM', task:'Meal prep 60 min: protein · grains · veg · lunch containers', tag:'nutrition' });
    t.push({ time:'2:00 PM', task:'Mobility, stretching or light walk', tag:'cardio' });
    t.push({ time:'8:30 PM', task:'Review week: grocery list + schedule', tag:'admin' });
  }
  if (['Monday','Tuesday','Wednesday','Thursday'].includes(day)) {
    const dn = getDinner(gWeek, day);
    if (dn) {
      t.push({ time:'7:15 PM', task:'Start dinner (~30 min)', tag:'nutrition' });
      t.push({ time:'7:45 PM', task:'Dinner: ' + dn, tag:'nutrition' });
    }
  }
  if (day === 'Friday') t.push({ time:'7:30 PM', task:'Date night — eat out freely', tag:'nutrition' });
  t.push({ time:'9:00 PM', task:retStr, tag:'skincare' });
  t.push({ time:'9:15 PM', task:'Magnesium Glycinate 300–400mg', tag:'supplement' });
  t.push({ time:'9:30 PM', task:'Evening snack: ' + getEvSnack(gWeek, day), tag:'nutrition' });
  t.push({ time:'10:00 PM', task:'Sleep — 7 to 8 hours', tag:'sleep' });
  return t;
}

// ── Macros ────────────────────────────────────────────────────
function calcMacros() {
  const bio = window.STATE.bio;
  const weight = parseFloat(bio.weight) || 150;
  const bf = parseFloat(bio.bodyfat) || 20;
  const lbm = weight * (1 - bf / 100);
  const bmr = 10 * (weight * 0.453592) + 6.25 * 177.8 - 5 * 30 + 5;
  const tdee = Math.round(bmr * 1.55);
  const protein = Math.round(lbm);
  const fat = Math.round(weight * 0.4);
  const carbs = Math.max(50, Math.round((tdee - fat*9 - protein*4) / 4));
  return { cal: tdee, protein, carbs, fat, weight, bf };
}

// ── Grocery ───────────────────────────────────────────────────
const GROCERY_BASE = {
  protein: ['Eggs (dozen)', 'Chicken breast (meal prep)'],
  produce: ['Spinach / mixed greens (bag)','Broccoli','Sweet potato (3–4)','Brussels sprouts','Zucchini','Cherry tomatoes','Banana (bunch)','Berries (frozen, 1 bag)','Avocado (3–4)','Cucumber','Baby carrots'],
  grains:  ['Brown rice (bag)','Rolled oats (large container)','Sprouted grain / Ezekiel bread','Quinoa','Whole wheat pasta','Rice cakes'],
  dairy:   ['Greek yogurt (32oz tub)','Cottage cheese (32oz)','Almond milk (half gallon)','String cheese','Feta (small block)'],
  pantry:  ['Natural almond butter','Protein powder','Olive oil','Low-sodium soy sauce','Hot sauce','Honey','Almonds / mixed nuts','Casein protein']
};
const PROTEIN_MAP = {
  salmon:['Salmon (2 lbs)'], beef:['Lean ground beef (1 lb)'], chicken:['Chicken thighs or breast (2 lbs)'],
  shrimp:['Shrimp (1 lb)'], pork:['Pork tenderloin (1 lb)'], bison:['Ground bison (1 lb)'],
  cod:['Cod fillets (1 lb)'], turkey:['Ground turkey (1 lb)'], tuna:['Tuna steak (1 lb)'], steak:['Sirloin steak (1 lb)']
};
const GROCERY_LABELS = { protein:'Protein', produce:'Produce', grains:'Grains & Carbs', dairy:'Dairy & Eggs', pantry:'Pantry & Supplements' };

function buildGroceryItems(gWeek) {
  const glc = window.STATE.glc;
  const protein = [...GROCERY_BASE.protein];
  const seen = new Set(protein);
  ['Monday','Tuesday','Wednesday','Thursday'].forEach(day => {
    const din = getDinner(gWeek, day) || '';
    Object.entries(PROTEIN_MAP).forEach(([p, items]) => {
      if (din.toLowerCase().includes(p)) {
        items.forEach(item => { if (!seen.has(item)) { seen.add(item); protein.push(item); } });
      }
    });
  });
  const raw = { protein, ...Object.fromEntries(Object.entries(GROCERY_BASE).filter(([k]) => k !== 'protein')) };
  // Apply edits and filter deleted items
  const result = {};
  Object.keys(raw).forEach(cat => {
    result[cat] = raw[cat]
      .filter((_, i) => !glc[`del.${cat}.${i}`])
      .map((item, i) => glc[`edit.${cat}.${i}`] || item);
  });
  return result;
}

// ── Protocol Guide data ───────────────────────────────────────
const GUIDE_DATA = {
  skincare: {
    label:'Skincare', icon:'✨', color:'#9e7a9022',
    items: [
      { name:'CeraVe Foaming Cleanser', sub:'AM + PM · Step 1', dose:'Pea-sized amount · morning and night', why:'Most consistently recommended drugstore cleanser. Fragrance-free, non-comedogenic, contains ceramides and hyaluronic acid. Cleans without stripping the skin barrier.' },
      { name:'Timeless 20% Vitamin C Serum', sub:'AM · Step 2', dose:'3–4 drops · after cleansing, before SPF', why:'Best dupe for SkinCeuticals CE Ferulic at 1/8 the price. 20% L-ascorbic acid + Vitamin E + ferulic acid. Brightens skin, boosts collagen, amplifies SPF. Store in fridge.' },
      { name:'EltaMD UV Clear SPF 46', sub:'AM · Step 3 (final)', dose:'Two finger-lengths · every morning', why:'Most recommended daily face SPF by dermatologists. Oil-free, niacinamide and hyaluronic acid. Lightweight, won\'t clog pores. Non-negotiable.' },
      { name:'CeraVe Retinol Serum', sub:'PM · Step 2 (per schedule)', dose:'Pea-sized amount · after cleansing, before moisturizer', why:'Best beginner retinol. Encapsulated formula releases gradually. Month 1: Wed + Fri only. Month 2: every other night. Month 3+: nightly if tolerating.' },
      { name:'CeraVe PM Moisturizing Lotion', sub:'PM · Step 3 (final)', dose:'Dime-sized amount · over retinol', why:'Non-comedogenic ceramide + hyaluronic acid moisturizer. Perfect final PM layer over retinol. Locks in moisture and reduces irritation.' },
      { name:"Paula's Choice BHA 2% Liquid", sub:'PM · 2x/week on non-retinol nights', dose:'Few drops on cotton pad · after cleansing, wait 20 sec', why:'Top recommended exfoliant. BHA (salicylic acid) penetrates pores, reduces blackheads, smooths texture. Do not use on retinol nights.' }
    ]
  },
  supplements: {
    label:'Supplements', icon:'💊', color:'#a8953022',
    items: [
      { name:'Creatine Monohydrate', sub:'5g post-gym (or daily)', dose:'5g with juice or water · post-workout', why:'Most studied performance supplement. Increases strength, muscle volume, and recovery. Non-negotiable. Takes ~4 weeks to saturate. Sports Research or Thorne.' },
      { name:'Whey Protein Isolate', sub:'1–2 scoops daily', dose:'25–30g per serving · post-gym or with breakfast', why:'Hits your 150g daily protein target. Transparent Labs Grass-Fed Whey Isolate is top-rated. Budget pick: Dymatize ISO 100. Supplement the gap from whole foods.' },
      { name:'L-Citrulline', sub:'6g pre-gym (30 min before)', dose:'6g unflavored in water · 30 min before training', why:'Pure L-citrulline — not citrulline malate. Drives blood flow, pump, and muscular endurance. Sports Research or BulkSupplements.' },
      { name:'Ashwagandha KSM-66', sub:'600mg with breakfast', dose:'600mg daily with food', why:'KSM-66 extract specifically (standardized to 5% withanolides). Reduces cortisol, supports testosterone, improves sleep quality. Jarrow, Nutricost, or NOW Foods.' },
      { name:'Vitamin D3 + K2 (MK-7)', sub:'With breakfast daily', dose:'2,000–5,000 IU D3 + 100mcg K2 · with fat source', why:'D3 and K2 must be taken together — K2 (MK-7) directs calcium to bones. Sports Research D3+K2 with coconut MCT oil is the top pick.' },
      { name:'Omega-3 Fish Oil', sub:'2g EPA+DHA · with breakfast', dose:'2 capsules triple-strength · with breakfast', why:'Anti-inflammatory, supports joints, brain, cardiovascular. Nordic Naturals Ultimate Omega (IFOS 5-star). Budget: Sports Research Triple Strength.' },
      { name:'Magnesium Glycinate', sub:'300–400mg before bed', dose:'300–400mg · 30 min before sleep', why:'Glycinate form — most bioavailable, gentlest on GI. Promotes deep sleep, reduces soreness. Doctor\'s Best, Thorne, or Sports Research. Avoid oxide form.' },
      { name:'Caffeine (optional)', sub:'100–200mg pre-gym only', dose:'100–200mg · 30 min before training, gym days only', why:'Optional. Take only if not already consuming caffeine. Do not take within 8 hours of sleep. Natrol or Prolab 200mg tablets. Skip on rest days.' }
    ]
  },
  hair: {
    label:'Hair Protocol', icon:'💆', color:'#6b8cae22',
    items: [
      { name:'Finasteride 1mg', sub:'Daily · same time each morning', dose:'1mg oral tablet · every morning', why:'Blocks DHT — the primary driver of male pattern baldness. Gold standard for prevention. Prescription required. Takes 3–6 months to show results, 12 months for full effect. Consistency is everything.' },
      { name:'Dutasteride 0.5mg', sub:'Alternative or combination · discuss with prescriber', dose:'0.5mg oral · daily or as prescribed', why:'More potent than finasteride — blocks both Type I and Type II enzymes vs finasteride\'s Type II only. Used when finasteride plateaus or for more aggressive suppression. Combination therapy increasingly prescribed. Physician guidance required.' },
      { name:'Nizoral 1% Ketoconazole Shampoo', sub:'2–3x per week', dose:'Leave on scalp 3–5 minutes before rinsing', why:'Peer-reviewed evidence for reducing DHT at the scalp level. Complements systemic treatment. Available OTC. Use 2–3x per week in place of regular shampoo.' }
    ]
  }
};

window.DataModule = {
  DAYS, DSUB, TAGS, PHASES, PROTO_START, GROCERY_LABELS, GUIDE_DATA,
  getPhase, getMeta, globalWeek, satType, ckKey, calcProtocolDate,
  getBreakfast, getDinner, getLunch, getSnack, getEvSnack,
  buildSchedule, calcMacros, buildGroceryItems
};
