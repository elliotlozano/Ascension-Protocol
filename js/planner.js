'use strict';
// ── Protocol (Planner) Tab ────────────────────────────────────

const { DAYS, DSUB, TAGS, getMeta, globalWeek, satType, ckKey, buildSchedule } = window.DataModule;

function renderPlanner() {
  const s = window.STATE;
  const gW = globalWeek(s.protoMonth, s.weekInMonth);
  const meta = getMeta(s.protoMonth);
  const wt = satType(gW);
  const chkSvg = '<svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4L3.5 6.5L9 1"/></svg>';

  // Momentum score (week-wide)
  let totalT = 0, totalD = 0;
  DAYS.forEach(day => {
    const ts = buildSchedule(day, s.protoMonth, gW);
    totalT += ts.length;
    ts.forEach((_, i) => { if (s.chk[ckKey(gW, day, i)]) totalD++; });
  });
  const weekPct = Math.round(totalD / totalT * 100);
  const scoreEl = document.getElementById('momentumScore');
  if (scoreEl) {
    scoreEl.textContent = (weekPct >= 90 ? '🔥 ' : '') + weekPct + '% Momentum';
    scoreEl.style.color = weekPct >= 90 ? 'var(--a)' : 'var(--mu)';
  }

  // Phase strip — sliding window
  const phaseStrip = document.getElementById('phaseStrip');
  if (phaseStrip) {
    let html = '';
    for (let m = Math.max(1, s.protoMonth - 1); m <= s.protoMonth + 2; m++) {
      const ph = window.DataModule.getPhase(m);
      const on = m === s.protoMonth;
      html += `<button class="sp${on?' on':''}" onclick="PlannerModule.selProtoMonth(${m})"
        style="background:${on?ph.hl:'transparent'};color:${on?'#1c1c1e':''}"
        >M${m}</button>`;
    }
    phaseStrip.innerHTML = html;
  }

  // Week strip
  const weekStrip = document.getElementById('weekStrip');
  if (weekStrip) {
    let html = '';
    for (let w = 1; w <= 4; w++) {
      const on = w === s.weekInMonth;
      html += `<button class="sc${on?' on':''}" onclick="PlannerModule.selWeek(${w})"
        style="background:${on?meta.hl:'transparent'};color:${on?'#1c1c1e':''}"
        >${w}</button>`;
    }
    weekStrip.innerHTML = html;
  }

  // Day tabs
  const dayTabs = document.getElementById('dayTabs');
  if (dayTabs) {
    let html = '';
    DAYS.forEach(day => {
      const ts = buildSchedule(day, s.protoMonth, gW);
      const done = ts.filter((_, i) => !!s.chk[ckKey(gW, day, i)]).length;
      html += `<button class="dt${day===s.day?' on':''}" onclick="PlannerModule.selDay('${day}')">
        ${day.slice(0,3)}${done===ts.length?'<span class="dd"></span>':''}</button>`;
    });
    dayTabs.innerHTML = html;
  }

  // Banner (collapsible)
  const banner = document.getElementById('banner');
  if (banner) {
    const collapsed = s.collapsed.banner;
    const satInfo = ` · Sat: ${wt==='A'?'Push B':'Pull B'}`;
    banner.style.borderLeftColor = meta.hl;
    banner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="PlannerModule.toggleCollapse('banner')">
        <div class="bnt" style="color:${meta.hl}">${meta.label} · ${meta.phase.sub}</div>
        <span style="color:var(--mu);font-size:13px;transition:transform .2s;display:inline-block;transform:rotate(${collapsed?'0':'90'}deg)">›</span>
      </div>
      ${collapsed ? '' : `<div class="bnb" style="margin-top:8px">
        <strong>Skin:</strong> ${meta.ret}<br>
        <strong>Run:</strong> ${meta.run}<br>
        <strong>Gym:</strong> ${meta.wt}${satInfo}
      </div>`}`;
  }

  // Day stats
  const tasks = buildSchedule(s.day, s.protoMonth, gW);
  const dc = tasks.filter((_, i) => !!s.chk[ckKey(gW, s.day, i)]).length;
  const pct = Math.round(dc / tasks.length * 100);
  const el = id => document.getElementById(id);
  if (el('dayName'))  el('dayName').textContent  = s.day;
  if (el('daySub'))   el('daySub').textContent   = DSUB[s.day];
  if (el('dayPct'))   { el('dayPct').textContent = pct + '%'; el('dayPct').style.color = pct===100?'var(--sg)':meta.hl; }
  if (el('dayCnt'))   el('dayCnt').textContent   = `${dc}/${tasks.length} tasks`;
  const pf = el('progFill');
  if (pf) { pf.style.width = pct + '%'; pf.style.background = pct===100?'var(--sg)':meta.hl; }
  const rb = el('resetBtn');
  if (rb) rb.style.display = dc > 0 ? 'inline' : 'none';

  // Dinners card (collapsible)
  const dc2 = el('dinnerCard');
  if (dc2) {
    const collapsed = s.collapsed.dinners;
    let html = `<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:${collapsed?'0':'10px'}" onclick="PlannerModule.toggleCollapse('dinners')">
      <div class="ct" style="margin-bottom:0">This Week's Dinners</div>
      <span style="color:var(--mu);font-size:13px;transition:transform .2s;display:inline-block;transform:rotate(${collapsed?'0':'90'}deg)">›</span>
    </div>`;
    if (!collapsed) {
      ['Monday','Tuesday','Wednesday','Thursday'].forEach((day, i) => {
        const idx = (gW-1)*4+i;
        html += `<div class="mr"><span class="ml">${day.slice(0,3)} #${(idx%16)+1}</span><span class="mv">${window.DataModule.getDinner(gW, day)}</span></div>`;
      });
      html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--b);font-size:12px;color:var(--mu)">Each dinner = next day's lunch · Fri = date night</div>`;
    }
    dc2.innerHTML = html;
  }

  // Task list
  const tl = el('taskList');
  if (tl) {
    let html = '';
    tasks.forEach((task, i) => {
      const done = !!s.chk[ckKey(gW, s.day, i)];
      const tagClass = 'g-' + (TAGS[task.tag] || 'ad');
      html += `<div class="ti${done?' done':''}" onclick="PlannerModule.toggleTask(${i})">
        <div class="tc${done?' on':''}">${done?chkSvg:''}</div>
        <div style="flex:1;min-width:0">
          <div class="tm"><span class="tt">${task.time}</span><span class="tg ${tagClass}">${task.tag}</span></div>
          <div class="tx">${done?'<s>':''}${task.task}${done?'</s>':''}</div>
        </div></div>`;
    });
    tl.innerHTML = html;
  }
}

function selProtoMonth(m) { window.StateModule.setState({ protoMonth: m }); renderPlanner(); }
function selWeek(w)        { window.StateModule.setState({ weekInMonth: w }); renderPlanner(); }
function selDay(d)         { window.StateModule.setState({ day: d }); renderPlanner(); }
function toggleTask(i) {
  const s = window.STATE;
  const gW = globalWeek(s.protoMonth, s.weekInMonth);
  const k = ckKey(gW, s.day, i);
  const chk = { ...s.chk, [k]: !s.chk[k] };
  window.StateModule.setState({ chk });
  renderPlanner();
}
function resetDay() {
  const s = window.STATE;
  const gW = globalWeek(s.protoMonth, s.weekInMonth);
  const tasks = buildSchedule(s.day, s.protoMonth, gW);
  const chk = { ...s.chk };
  tasks.forEach((_, i) => delete chk[ckKey(gW, s.day, i)]);
  window.StateModule.setState({ chk });
  renderPlanner();
}
function toggleCollapse(key) {
  const collapsed = { ...window.STATE.collapsed, [key]: !window.STATE.collapsed[key] };
  window.StateModule.setState({ collapsed });
  renderPlanner();
}
function goToToday() {
  const d = window.DataModule.calcProtocolDate();
  window.StateModule.setState({ protoMonth: d.protoMonth, weekInMonth: d.weekInMonth, day: d.day });
  renderPlanner();
}

window.PlannerModule = { renderPlanner, selProtoMonth, selWeek, selDay, toggleTask, resetDay, toggleCollapse, goToToday };
