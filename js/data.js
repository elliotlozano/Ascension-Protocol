'use strict';

var DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
var DSUB = {Monday:'Push A · Gym',Tuesday:'Pull A · Gym',Wednesday:'Zone 2 Run',Thursday:'Active Rest',Friday:'Legs & Core · Gym',Saturday:'Gym · A/B',Sunday:'Rest & Prep'};
var TAGS = {nutrition:'nu',gym:'gy',skincare:'sk',supplement:'su',hair:'ha',cardio:'ca',sleep:'sl',admin:'ad',shower:'sh'};
var PROTO_START = new Date(2026,2,9); // March 9 2026

var DEFAULT_MISSION = "I'm 30. I have an athletic background, a decade of drift, and a clear picture of where I'm going.\n\nThis isn't about getting back in shape. It's about building something I've never actually finished — a body that performs at its ceiling, sustained by habits that don't slip. Training, nutrition, recovery, skincare. Every system running in parallel, nothing half-assed.\n\nThe physique goal is specific and I'm not apologizing for it. The running goal has a race on the calendar. The 3-year roadmap has milestones at every phase.\n\nYear 1 builds the foundation everything else stands on. I'm not starting over — I'm starting with more than I had the first time.";

var PHASES = [
  {id:1, label:'Phase I',  sub:'Re-Awakening',  monthStart:1,  monthEnd:6,   hl:'#d4a853'},
  {id:2, label:'Phase II', sub:'Foundation',    monthStart:7,  monthEnd:18,  hl:'#6b8cae'},
  {id:3, label:'Phase III',sub:'Sculpture',     monthStart:19, monthEnd:30,  hl:'#7a9e87'},
  {id:4, label:'Phase IV', sub:'Peak & Beyond', monthStart:31, monthEnd:999, hl:'#9e7a90'}
];

function getPhaseForMonth(m) {
  for (var i = 0; i < PHASES.length; i++) {
    if (m >= PHASES[i].monthStart && m <= PHASES[i].monthEnd) return PHASES[i];
  }
  return PHASES[PHASES.length - 1];
}

function phaseMonthMeta(protoMonth, phaseId) {
  var base = {
    1: {ret:'Retinol: Wed + Fri PM only (2x/week).',      rn:['Wednesday','Friday'],                                                              rd:'20 min easy Zone 2',              run:'Run: 20 min easy Zone 2.',              wt:'Weights: Form over load. Mind-muscle connection.'},
    2: {ret:'Retinol: Every other night. Skip if irritated.', rn:['Monday','Wednesday','Friday','Sunday'],                                         rd:'25 min — easy + 2×3-min pickups',  run:'Run: 25 min with 2×3-min pickups.',     wt:'Weights: Begin adding load every 1–2 weeks.'},
    3: {ret:'Retinol: Nightly if tolerated.',              rn:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],            rd:'30 min — warm-up + tempo + cool-down', run:'Run: 30 min with 1-mile tempo segment.', wt:'Weights: Progressive overload. Beat last week.'}
  };
  if (phaseId === 1) {
    var idx = Math.min(protoMonth, 3);
    var b = base[idx] || base[3];
    return {label:'Month '+protoMonth+' — '+['','Foundation','Building','Momentum'][idx], ret:b.ret, run:b.run, wt:b.wt, rn:b.rn, rd:b.rd, hl:PHASES[0].hl};
  }
  if (phaseId === 2) {
    return {label:'Month '+protoMonth+' — Building', ret:base[3].ret, run:'Run: Progressing toward sub-22 5K.', wt:'Weights: Progressive overload. Track every lift.', rn:base[3].rn, rd:'35+ min — structured intervals', hl:PHASES[1].hl};
  }
  if (phaseId === 3) {
    return {label:'Month '+protoMonth+' — Sculpture', ret:base[3].ret, run:'Run: Maintenance + race prep as needed.', wt:'Weights: V-taper focus — lateral delts, upper chest.', rn:base[3].rn, rd:'30–40 min — maintenance', hl:PHASES[2].hl};
  }
  return {label:'Month '+protoMonth+' — Peak', ret:base[3].ret, run:'Run: Performance maintenance.', wt:'Weights: High-rep polish. Protect joints.', rn:base[3].rn, rd:'30 min — maintenance', hl:PHASES[3].hl};
}

var BF=['Oats + protein powder + frozen berries + peanut butter','3 scrambled eggs + sprouted grain toast + avocado + orange','Greek yogurt parfait: yogurt + oats + berries + honey','Protein pancakes: oats + eggs + banana blended','Veggie omelette: 3 eggs + spinach + mushrooms + feta + toast','Overnight oats: rolled oats + chia seeds + almond milk + berries','Smoothie: frozen banana + protein powder + almond milk + spinach','Egg muffins (prepped Sunday): eggs + turkey sausage + peppers','Savory oats: oats + fried egg + hot sauce + everything bagel','French toast: Ezekiel bread + eggs + cinnamon + maple syrup','Acai bowl: acai + banana + almond milk + granola + berries','Breakfast burrito: eggs + black beans + salsa + wheat tortilla','Cottage cheese bowl: cottage cheese + berries + granola + honey','Turkey bacon + 3 eggs + whole grain toast + sliced tomato','Banana oat shake: banana + oats + protein powder + almond milk','Smoked salmon + cream cheese + whole grain toast + capers'];
var BD=['Baked salmon + roasted sweet potato + wilted spinach','Lean beef tacos: corn tortillas + salsa + avocado + cabbage','Grilled chicken thighs + brown rice + roasted broccoli','Shrimp stir-fry + snap peas + bell pepper + brown rice + soy','Pork tenderloin + mashed sweet potato + Brussels sprouts','Bison burger (no bun) + sweet potato fries + side salad','Pan-seared cod + quinoa + roasted asparagus + lemon drizzle','Turkey meatballs + whole wheat pasta + marinara','Garlic shrimp + cauliflower rice + cherry tomatoes + basil','Grilled chicken + farro + cucumber-tomato salad + tzatziki','Lean steak (sirloin) + roasted root vegetables + wild rice','Baked chicken stuffed with spinach + feta + sun-dried tomato','Seared tuna steak + jasmine rice + bok choy + ginger-soy','Ground turkey bowl + black beans + corn + brown rice + pico','Pan-seared salmon + lentils + zucchini + lemon tahini','Chicken stir-fry + broccoli + mushrooms + brown rice'];
var SH=['Greek yogurt + almonds + honey','Cottage cheese + sliced peach or pineapple','2 hard-boiled eggs + carrots + hummus','Apple + natural almond butter','Edamame + sea salt','Rice cake + peanut butter + banana','Trail mix: almonds + walnuts + pumpkin seeds + cranberries'];
var SC=['Chomps/Epic bar + almonds','Chocolate-covered pretzels + string cheese','Protein bar (Quest or RXBar)','Pepperoni + cheddar + crackers','Dark chocolate (70%+) + mixed nuts','Beef jerky + apple slices','Light popcorn + string cheese'];
var SE=['Casein shake + almond milk','Cottage cheese + walnuts','Greek yogurt + honey + cinnamon','2 rice cakes + natural peanut butter','String cheese + almonds','Banana + 1 tbsp almond butter','2 hard-boiled eggs + cucumber'];
