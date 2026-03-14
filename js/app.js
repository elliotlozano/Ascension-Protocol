'use strict';
// ── App Shell — Init, Routing, Theme ─────────────────────────

function selTab(t) {
  ['P','R','M','A'].forEach(x => {
    document.getElementById('p'+x).className = 'pane' + (x===t?' on':'');
    document.getElementById('db-'+x).className = 'db' + (x===t?' on':'');
  });
  if (t==='P') window.PlannerModule.renderPlanner();
  if (t==='R') { window.RoadmapModule.renderMission(); window.RoadmapModule.renderGoals(); }
  if (t==='M') window.MetricsModule.renderMetrics();
  if (t==='A') { window.AccountModule.renderSettings(); window.AccountModule.showPage('pageMain'); window.ChatModule.initChatThread(); }
}

function toggleTheme() {
  const dark = !window.STATE.dark;
  window.StateModule.setState({ dark });
  applyTheme();
}

function applyTheme() {
  const dark = window.STATE.dark;
  document.body.className = dark ? 'D' : 'L';
  const tog = document.getElementById('darkTog');
  if (tog) tog.className = 'tog' + (dark?' on':'');
}

function showLogin() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginErr').textContent = '';
  document.getElementById('loginPass').value = '';
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

async function doLogin() {
  const pass = document.getElementById('loginPass').value;
  const btn  = document.getElementById('loginBtn');
  const err  = document.getElementById('loginErr');
  if (!pass) return;
  btn.textContent = '…'; btn.disabled = true; err.textContent = '';
  const result = await window.SyncModule.signIn('elliotlozano95@gmail.com', pass);
  btn.textContent = 'Enter'; btn.disabled = false;
  if (!result.ok) { err.textContent = result.error==='Invalid login credentials'?'Wrong password':result.error; return; }
  await launchApp();
}

async function launchApp() {
  showApp();
  // Sync from cloud first (cloud always wins)
  await window.SyncModule.loadFromCloud();
  // Then sync to real date
  const d = window.DataModule.calcProtocolDate();
  // Only auto-sync date if not manually browsing
  if (!window.STATE._manualNav) {
    window.StateModule.setState({ protoMonth: d.protoMonth, weekInMonth: d.weekInMonth, day: d.day }, { silent: true });
  }
  applyTheme();
  window.PlannerModule.renderPlanner();
  window.RoadmapModule.renderMission();
  window.RoadmapModule.renderGoals();
}

// ── Boot ──────────────────────────────────────────────────────
window.StateModule.initState();
applyTheme();

document.getElementById('loginPass').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
document.getElementById('chatInp')?.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

if (window.SyncModule.isAuthed()) {
  launchApp();
} else {
  showLogin();
}

window.AppModule = { selTab, toggleTheme, showLogin, showApp, doLogin, launchApp };
