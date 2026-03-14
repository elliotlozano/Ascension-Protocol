'use strict';
// ── Account Tab ───────────────────────────────────────────────

function showPage(id) {
  document.querySelectorAll('.acct-page').forEach(p => p.className = 'acct-page');
  document.getElementById(id).className = 'acct-page on';
}
function openPage(id) {
  showPage(id);
  if (id==='pageSettings')     renderSettings();
  if (id==='pageGrocery')      renderGrocery();
  if (id==='pageAchievements') renderAchievements();
  if (id==='pageGuide')        renderGuide();
}
function closePage() { showPage('pageMain'); }

// ── Settings ──────────────────────────────────────────────────
function renderSettings() {
  const tog = document.getElementById('darkTog');
  if (tog) tog.className = 'tog' + (window.STATE.dark ? ' on' : '');
  const now = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const d = now.getDate(), suf = (d===1||d===21||d===31)?'st':(d===2||d===22)?'nd':(d===3||d===23)?'rd':'th';
  const dateEl = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = `${months[now.getMonth()]} ${d}${suf}, ${now.getFullYear()}`;
  const pwEl = document.getElementById('protoWeek');
  if (pwEl) pwEl.textContent = `Month ${window.STATE.protoMonth}, Week ${window.STATE.weekInMonth}`;
}
function signOut() { window.SyncModule.signOut(); window.AppModule.showLogin(); }
function clearChatMemory() {
  window.StateModule.setState({ chatHist: [] });
  const btn = event.target; btn.textContent = 'Cleared ✓';
  setTimeout(() => { btn.textContent = 'Clear'; }, 2000);
}

// ── Grocery ───────────────────────────────────────────────────
let glEditMode = {};
function getNextWeekLabel() {
  const now = new Date(), dow = now.getDay(), daysToSat = (6-dow+7)%7||7;
  const sat = new Date(now); sat.setDate(now.getDate()+daysToSat);
  const mon = new Date(sat); mon.setDate(sat.getDate()+1);
  const fmt = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  return `Week of ${fmt(mon)} – ${fmt(new Date(mon.getTime()+6*86400000))}`;
}
function renderGrocery() {
  const s = window.STATE;
  const gW = window.DataModule.globalWeek(s.protoMonth, s.weekInMonth);
  const items = window.DataModule.buildGroceryItems(gW);
  const labels = window.DataModule.GROCERY_LABELS;
  const chkSvg = '<svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4L3.5 6.5L9 1"/></svg>';
  document.getElementById('glWeekLabel').textContent = getNextWeekLabel();
  let html = '';
  Object.keys(labels).forEach(cat => {
    const editing = !!glEditMode[cat];
    html += `<div class="gl-sec">
      <div class="gl-sec-hdr"><div class="gl-sh">${labels[cat]}</div>
      <button class="gl-edit-mode-btn" onclick="AccountModule.toggleGroceryEdit('${cat}')">${editing?'Done':'✎'}</button></div>`;
    const customs = s.glc[`custom.${cat}`] || [];
    const allItems = [
      ...items[cat].map((item,i) => ({item, key:`gl.${cat}.${i}`, type:'gen', idx:i})),
      ...customs.map((item,i) => ({item, key:`gl.${cat}.c${i}`, type:'custom', idx:i}))
    ];
    const unchecked = allItems.filter(o => !s.glc[o.key]);
    const checked   = allItems.filter(o =>  s.glc[o.key]);
    unchecked.forEach(o => {
      html += `<div class="gl-item">`;
      if (editing) {
        html += `<div class="gl-del-btn" onclick="AccountModule.deleteGroceryItem('${cat}','${o.type}',${o.idx})">−</div>`;
        html += `<input class="gl-edit-inp" value="${o.item.replace(/"/g,'&quot;')}" onchange="AccountModule.editGroceryItem('${cat}','${o.type}',${o.idx},this.value)">`;
      } else {
        html += `<div class="gl-chk" onclick="AccountModule.toggleGrocery('${o.key}')"></div><span class="gl-name">${o.item}</span>`;
      }
      html += `</div>`;
    });
    html += `<div class="gl-add-row"><input class="gl-add-inp" id="glInp-${cat}" placeholder="Add item..." type="text"><button class="gl-add-btn" onclick="AccountModule.addGroceryItem('${cat}')">+</button></div>`;
    if (checked.length) {
      html += `<div class="gl-done-sep">`;
      checked.forEach(o => {
        html += `<div class="gl-item">`;
        if (editing) {
          html += `<div class="gl-del-btn" onclick="AccountModule.deleteGroceryItem('${cat}','${o.type}',${o.idx})">−</div><span class="gl-name done">${o.item}</span>`;
        } else {
          html += `<div class="gl-chk on" onclick="AccountModule.toggleGrocery('${o.key}')">${chkSvg}</div><span class="gl-name done">${o.item}</span>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });
  document.getElementById('glBody').innerHTML = html;
  Object.keys(labels).forEach(cat => {
    const inp = document.getElementById(`glInp-${cat}`);
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') AccountModule.addGroceryItem(cat); });
  });
}
function toggleGroceryEdit(cat) { glEditMode[cat] = !glEditMode[cat]; renderGrocery(); }
function toggleGrocery(key) {
  const glc = { ...window.STATE.glc, [key]: !window.STATE.glc[key] };
  window.StateModule.setState({ glc }); renderGrocery();
}
function addGroceryItem(cat) {
  const inp = document.getElementById(`glInp-${cat}`); if (!inp) return;
  const v = inp.value.trim(); if (!v) return;
  const glc = { ...window.STATE.glc };
  const customs = [...(glc[`custom.${cat}`]||[]), v];
  glc[`custom.${cat}`] = customs;
  window.StateModule.setState({ glc }); renderGrocery();
}
function deleteGroceryItem(cat, type, idx) {
  const glc = { ...window.STATE.glc };
  if (type === 'custom') {
    const customs = [...(glc[`custom.${cat}`]||[])]; customs.splice(idx,1); glc[`custom.${cat}`] = customs;
  } else { glc[`del.${cat}.${idx}`] = true; }
  window.StateModule.setState({ glc }); renderGrocery();
}
function editGroceryItem(cat, type, idx, val) {
  const glc = { ...window.STATE.glc };
  if (type === 'custom') { const c=[...(glc[`custom.${cat}`]||[])]; c[idx]=val; glc[`custom.${cat}`]=c; }
  else { glc[`edit.${cat}.${idx}`] = val; }
  window.StateModule.setState({ glc });
}

// ── Achievements ──────────────────────────────────────────────
const ACH_DISTS = [{k:'mile',l:'1 Mile',icon:'🏃'},{k:'fivek',l:'5K',icon:'🏅'},{k:'tenk',l:'10K',icon:'🏆'}];
function timeToSec(t) { const p=t.split(':'); return p.length===2?parseInt(p[0])*60+parseFloat(p[1]):parseFloat(t)||9999; }
function renderAchievements() {
  const ach = window.STATE.ach;
  const ranks = ['gold','silver','bronze'], rlbls = ['#1','#2','#3'];
  let html = '';
  ACH_DISTS.forEach(dist => {
    const times = (ach[dist.k]||[]).slice(0,3);
    html += `<div class="card"><div class="ach-sec">
      <div class="ach-hdr"><span class="ach-icon">${dist.icon}</span><span class="ach-title">${dist.l}</span></div>
      ${!times.length?'<div style="font-size:13px;color:var(--mu);font-style:italic;padding:4px 0 8px">No times logged yet.</div>':''}
      ${times.map((e,i)=>`<div class="ach-row"><span class="ach-rank ${ranks[i]}">${rlbls[i]}</span><span class="ach-time">${e.v}</span><span class="ach-date">${e.d}</span></div>`).join('')}
      <div class="ach-add">
        <input class="ach-inp" id="achInp-${dist.k}" placeholder="Log time (e.g. 24:32)" type="text">
        <button class="ach-log-btn" onclick="AccountModule.logAchievement('${dist.k}')">Log</button>
      </div>
    </div></div>`;
  });
  document.getElementById('achBody').innerHTML = html;
  ACH_DISTS.forEach(d => {
    const inp = document.getElementById(`achInp-${d.k}`);
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') AccountModule.logAchievement(d.k); });
  });
}
function logAchievement(k) {
  const inp = document.getElementById(`achInp-${k}`); if(!inp) return;
  const v = inp.value.trim(); if(!v) return;
  const ach = { ...window.STATE.ach };
  ach[k] = [...(ach[k]||[]), {v, d:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}]
    .sort((a,b) => timeToSec(a.v)-timeToSec(b.v)).slice(0,3);
  inp.value = '';
  window.StateModule.setState({ ach }); renderAchievements();
}

// ── Protocol Guide ────────────────────────────────────────────
function renderGuide() {
  const { GUIDE_DATA } = window.DataModule;
  let html = '';
  Object.keys(GUIDE_DATA).forEach(cat => {
    const sec = GUIDE_DATA[cat];
    html += `<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--mu);margin-bottom:8px;margin-top:4px">${sec.label}</div>`;
    sec.items.forEach((item, i) => {
      const gid = cat + i;
      html += `<div class="guide-card">
        <div class="guide-hdr" onclick="AccountModule.toggleGuide('${gid}')">
          <div class="guide-icon" style="background:${sec.color}">${sec.icon}</div>
          <div style="flex:1;min-width:0"><div class="guide-name">${item.name}</div><div class="guide-sub">${item.sub}</div></div>
          <span class="rpc" id="gg-${gid}">›</span>
        </div>
        <div class="guide-body" id="gb-g-${gid}">
          <div class="guide-row"><span class="guide-lbl">Dose</span><span class="guide-val">${item.dose}</span></div>
          <div class="guide-row"><span class="guide-lbl">Why</span><span class="guide-val">${item.why}</span></div>
        </div>
      </div>`;
    });
  });
  document.getElementById('guideBody').innerHTML = html;
}
function toggleGuide(id) {
  const body = document.getElementById(`gb-g-${id}`), chev = document.getElementById(`gg-${id}`);
  const open = body.classList.contains('open');
  body.classList.toggle('open', !open); if(chev) chev.classList.toggle('open', !open);
}

window.AccountModule = {
  showPage, openPage, closePage, renderSettings, signOut, clearChatMemory,
  renderGrocery, toggleGroceryEdit, toggleGrocery, addGroceryItem, deleteGroceryItem, editGroceryItem,
  renderAchievements, logAchievement, renderGuide, toggleGuide
};
