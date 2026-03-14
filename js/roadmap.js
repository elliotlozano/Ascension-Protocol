'use strict';
// ── Roadmap Tab ───────────────────────────────────────────────

const DEFAULT_MISSION = "I'm 30. I have an athletic background, a decade of drift, and a clear picture of where I'm going.\n\nThis isn't about getting back in shape. It's about building something I've never actually finished — a body that performs at its ceiling, sustained by habits that don't slip. Training, nutrition, recovery, skincare. Every system running in parallel, nothing half-assed.\n\nThe physique goal is specific and I'm not apologizing for it. The running goal has a race on the calendar. The 3-year roadmap has milestones at every phase.\n\nYear 1 builds the foundation everything else stands on. I'm not starting over — I'm starting with more than I had the first time.";

function getMission() { return window.STATE.mission || DEFAULT_MISSION; }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Mission ───────────────────────────────────────────────────
function renderMission() {
  const m = getMission();
  const preview = document.getElementById('missionPreview');
  const full = document.getElementById('missionFull');
  if (preview) preview.textContent = m.split('\n')[0];
  if (full) full.innerHTML = m.replace(/\n/g, '<br>');
  const chev = document.getElementById('missionChev');
  const body = document.getElementById('missionBody');
  const collapsed = window.STATE.collapsed.mission;
  if (chev) chev.classList.toggle('open', !collapsed);
  if (body) body.classList.toggle('open', !collapsed);
}
function toggleMissionExpand() {
  const collapsed = { ...window.STATE.collapsed, mission: !window.STATE.collapsed.mission };
  window.StateModule.setState({ collapsed });
  renderMission();
}
function toggleMissionEdit(e) {
  e.stopPropagation();
  const ta = document.getElementById('missionTa');
  const full = document.getElementById('missionFull');
  const acts = document.getElementById('missionActions');
  const btn = document.getElementById('missionBtn');
  const editing = ta.classList.contains('open');
  if (!editing) {
    ta.value = getMission(); ta.classList.add('open');
    full.style.display = 'none'; acts.style.display = 'flex';
    btn.textContent = '✎';
  } else { cancelMission(); }
}
function cancelMission() {
  document.getElementById('missionTa').classList.remove('open');
  document.getElementById('missionFull').style.display = 'block';
  document.getElementById('missionActions').style.display = 'none';
  document.getElementById('missionBtn').textContent = '✎';
}
function saveMission() {
  const v = document.getElementById('missionTa').value.trim();
  window.StateModule.setState({ mission: v || null });
  cancelMission(); renderMission();
}

// ── Goals ─────────────────────────────────────────────────────
function calcWeeksOut() {
  const dateVal = document.getElementById('gfDate').value;
  const disp = document.getElementById('gfWeeksDisplay');
  if (!dateVal) { disp.textContent = '—'; return; }
  const race = new Date(dateVal + 'T12:00:00');
  const diff = Math.round((race - new Date()) / (7 * 86400000));
  if (diff <= 0) { disp.textContent = 'Past date'; disp.style.color = '#c0504a'; }
  else { disp.textContent = diff + ' week' + (diff===1?'':'s') + ' away'; disp.style.color = 'var(--a)'; }
}
function openGoalForm() { document.getElementById('goalForm').classList.add('open'); document.getElementById('gfName').focus(); }
function closeGoalForm() {
  document.getElementById('goalForm').classList.remove('open');
  ['gfName','gfDate','gfDist','gfTarget','gfNotes'].forEach(id => { document.getElementById(id).value = ''; });
  const disp = document.getElementById('gfWeeksDisplay');
  if (disp) { disp.textContent = '—'; disp.style.color = 'var(--a)'; }
}
function saveGoal() {
  const name = document.getElementById('gfName').value.trim(); if (!name) return;
  const dateVal = document.getElementById('gfDate').value;
  let weeks = 0;
  if (dateVal) { const race = new Date(dateVal + 'T12:00:00'); weeks = Math.max(0, Math.round((race - new Date()) / (7*86400000))); }
  const g = { id: Date.now(), name, date: dateVal, dist: document.getElementById('gfDist').value.trim(),
    target: document.getElementById('gfTarget').value.trim(), weeks,
    notes: document.getElementById('gfNotes').value.trim(), plan: '', tips: '', chatHist: [] };
  const goals = [g, ...window.STATE.goals];
  window.StateModule.setState({ goals });
  closeGoalForm(); renderGoals();
}
function deleteGoal(id) {
  const goals = window.STATE.goals.filter(g => g.id !== id);
  window.StateModule.setState({ goals }); renderGoals();
}
function toggleGoalBody(id) {
  const body = document.getElementById('gb-' + id);
  const chev = document.getElementById('gc-' + id);
  const open = body.classList.contains('open');
  body.classList.toggle('open', !open);
  if (chev) chev.classList.toggle('open', !open);
}

function renderGoals() {
  const el = document.getElementById('goalsList'); if (!el) return;
  const goals = window.STATE.goals;
  if (!goals.length) { el.innerHTML = '<div style="font-size:13px;color:var(--mu);font-style:italic;text-align:center;padding:12px 0 16px">No goals yet. Tap + to create one.</div>'; return; }
  let html = '';
  goals.forEach(g => {
    const dateStr = g.date ? new Date(g.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
    const weeksStr = g.weeks > 0 ? `${g.weeks} weeks away` : '';
    html += `<div class="goal-card">
      <div class="goal-hdr" onclick="RoadmapModule.toggleGoalBody(${g.id})">
        <div class="goal-icon" style="background:var(--as)">🎯</div>
        <div style="flex:1;min-width:0">
          <div class="goal-title">${escHtml(g.name)}</div>
          ${dateStr?`<div class="goal-date">${dateStr}${weeksStr?' · '+weeksStr:''}</div>`:''}
        </div>
        <span class="rpc" id="gc-${g.id}">›</span>
      </div>
      <div class="goal-body" id="gb-${g.id}">
        ${g.dist?`<div class="goal-field"><div class="goal-label">Distance / Type</div><div class="goal-value">${escHtml(g.dist)}</div></div>`:''}
        ${g.target?`<div class="goal-field"><div class="goal-label">Target Time</div><div class="goal-value">${escHtml(g.target)}</div></div>`:''}
        ${g.notes?`<div class="goal-field"><div class="goal-label">Notes</div><div class="goal-value">${escHtml(g.notes)}</div></div>`:''}
        ${g.plan?`<div class="goal-field"><div class="goal-label">Training Plan</div><div class="goal-plan" id="gplan-${g.id}">${escHtml(g.plan)}</div></div>`:`<div id="gplan-${g.id}" style="display:none"></div>`}
        ${g.tips?`<div class="goal-field"><div class="goal-label">Race Day Tips</div><div class="goal-plan" id="gtips-${g.id}">${escHtml(g.tips)}</div></div>`:`<div id="gtips-${g.id}" style="display:none"></div>`}
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="gen-btn" id="gbtn-${g.id}" onclick="RoadmapModule.generateGoalPlan(${g.id})">✦ ${g.plan?'Regenerate':'Generate Plan'}</button>
          <button onclick="RoadmapModule.deleteGoal(${g.id})" style="font-size:12px;color:var(--mu);padding:10px 12px;background:var(--s2);border-radius:10px;border:1px solid var(--b)">Delete</button>
        </div>
        <div id="gerr-${g.id}" style="display:none;font-size:12px;color:#c0504a;margin-top:8px;font-weight:500"></div>
        ${renderGoalChat(g)}
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

function renderGoalChat(g) {
  const hist = g.chatHist || [];
  let chatHtml = `<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--b)">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--mu);margin-bottom:8px">Refine Plan</div>`;
  if (hist.length) {
    chatHtml += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;max-height:200px;overflow-y:auto">`;
    hist.forEach(m => {
      const isUser = m.role === 'user';
      chatHtml += `<div style="padding:8px 12px;border-radius:${isUser?'12px 12px 4px 12px':'12px 12px 12px 4px'};font-size:13px;line-height:1.5;max-width:90%;align-self:${isUser?'flex-end':'flex-start'};background:${isUser?'var(--a)':'var(--s2)'};color:${isUser?'#1c1c1e':'var(--t2)'};${isUser?'':'border:1px solid var(--b)'}">${escHtml(m.content)}</div>`;
    });
    chatHtml += `</div>`;
  }
  chatHtml += `<div style="display:flex;gap:8px;align-items:flex-end">
    <textarea id="gchat-${g.id}" placeholder="Ask for adjustments to the plan..." rows="1"
      style="flex:1;background:var(--s2);border:1.5px solid var(--b2);border-radius:10px;padding:9px 12px;color:var(--t);font-size:14px;resize:none;outline:none;font-family:var(--fb);min-height:40px;max-height:90px;line-height:1.4"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();RoadmapModule.sendGoalChat(${g.id})}"
      oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,90)+'px'"></textarea>
    <button onclick="RoadmapModule.sendGoalChat(${g.id})" id="gchat-btn-${g.id}"
      style="width:38px;height:38px;border-radius:50%;background:var(--a);display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#1c1c1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8H4M8 4l4 4-4 4"/></svg>
    </button>
  </div></div>`;
  return chatHtml;
}

async function generateGoalPlan(id) {
  const goals = window.STATE.goals;
  const g = goals.find(x => x.id === id); if (!g) return;
  const btn = document.getElementById('gbtn-' + id);
  const errEl = document.getElementById('gerr-' + id);
  if (btn) { btn.textContent = 'Generating…'; btn.disabled = true; }
  if (errEl) errEl.style.display = 'none';
  const prompt = `Generate a focused training plan for this goal:\nEvent: ${g.name}\nDistance/Type: ${g.dist||'unknown'}\nTarget time: ${g.target||'finish'}\nWeeks out: ${g.weeks||'unknown'}\nCurrent fitness: ${g.notes||'none'}\n\nProvide three clearly labeled sections:\n\nTRAINING PLAN:\nWeek-by-week breakdown.\n\nMEAL ADJUSTMENTS:\nNutrition changes to support this goal.\n\nRACE DAY TIPS:\n4-5 specific reminders.\n\nBe concise and encouraging.`;
  try {
    const r = await fetch('/.netlify/functions/chat', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1200,
        system:'You are a fitness and race prep coach. Be specific and practical.',
        messages:[{role:'user',content:prompt}]
      })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data.error) throw new Error(data.error.message || 'API error');
    const full = (data.content||[]).map(b => b.text||'').join('').trim();
    if (!full) throw new Error('Empty response');
    const tipsMatch = full.match(/RACE DAY TIPS[:\s]*([\s\S]*)$/i);
    const tips = tipsMatch ? tipsMatch[1].trim() : '';
    const plan = full.replace(/RACE DAY TIPS[:\s]*[\s\S]*$/i,'').trim();
    // Update goal in state
    const updatedGoals = goals.map(x => x.id===id ? {...x, plan, tips, chatHist:[]} : x);
    window.StateModule.setState({ goals: updatedGoals });
    renderGoals();
    // Re-open
    const body = document.getElementById('gb-'+id);
    const chev = document.getElementById('gc-'+id);
    if (body) { body.classList.add('open'); if (chev) chev.classList.add('open'); }
  } catch(e) {
    if (btn) { btn.textContent = '✦ Generate Plan'; btn.disabled = false; }
    if (errEl) { errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block'; }
  }
}

async function sendGoalChat(id) {
  const goals = window.STATE.goals;
  const g = goals.find(x => x.id === id); if (!g) return;
  const inp = document.getElementById('gchat-' + id);
  const btn = document.getElementById('gchat-btn-' + id);
  const msg = inp ? inp.value.trim() : ''; if (!msg) return;
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }
  if (btn) btn.disabled = true;
  const hist = [...(g.chatHist||[]), {role:'user', content:msg}];
  // Optimistically update UI
  const goalsOpt = goals.map(x => x.id===id ? {...x, chatHist:hist} : x);
  window.StateModule.setState({ goals: goalsOpt });
  renderGoals();
  const body = document.getElementById('gb-'+id);
  const chev = document.getElementById('gc-'+id);
  if (body) { body.classList.add('open'); if(chev) chev.classList.add('open'); }

  const systemPrompt = `You are a fitness and race prep coach refining a training plan.\nCurrent plan:\n${g.plan}\nRace day tips:\n${g.tips}\n\nWhen the user requests adjustments, update the FULL plan and tips and output the complete revised version. Label sections: TRAINING PLAN: and RACE DAY TIPS:`;
  try {
    const r = await fetch('/.netlify/functions/chat', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1400, system:systemPrompt, messages:hist })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data.error) throw new Error(data.error.message);
    const full = (data.content||[]).map(b => b.text||'').join('').trim();
    const tipsMatch = full.match(/RACE DAY TIPS[:\s]*([\s\S]*)$/i);
    const tips = tipsMatch ? tipsMatch[1].trim() : g.tips;
    const plan = full.replace(/RACE DAY TIPS[:\s]*[\s\S]*$/i,'').trim() || g.plan;
    const newHist = [...hist, {role:'assistant', content:full}];
    const updatedGoals = goals.map(x => x.id===id ? {...x, plan, tips, chatHist:newHist} : x);
    window.StateModule.setState({ goals: updatedGoals });
    renderGoals();
    if (body) { body.classList.add('open'); if(chev) chev.classList.add('open'); }
  } catch(e) {
    const errEl = document.getElementById('gerr-'+id);
    if (errEl) { errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block'; }
    if (btn) btn.disabled = false;
  }
}

function togglePhase(id) {
  const body = document.getElementById('pd'+id), chev = document.getElementById('pc'+id);
  const open = body.classList.contains('open');
  body.classList.toggle('open', !open); if (chev) chev.classList.toggle('open', !open);
}

window.RoadmapModule = {
  renderMission, toggleMissionExpand, toggleMissionEdit, cancelMission, saveMission,
  calcWeeksOut, openGoalForm, closeGoalForm, saveGoal, deleteGoal, renderGoals,
  toggleGoalBody, generateGoalPlan, sendGoalChat, togglePhase
};
