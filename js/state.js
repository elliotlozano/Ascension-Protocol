'use strict';
// ── Central State Store ───────────────────────────────────────
// All app state lives here. Never mutate STATE directly.
// Use setState(patch) for everything.

const SCHEMA_VERSION = 3;

const STATE_DEFAULTS = {
  _v: SCHEMA_VERSION,
  // Protocol navigation
  protoMonth: 1,
  weekInMonth: 1,
  day: 'Monday',
  // User data
  chk: {},    // task completions keyed by globalWeek+day+index
  ovr: {},    // protocol assistant overrides
  bio: {},    // biometrics: weight, bodyfat, waist, chest, shoulders, bicep, wtHist
  prs: {},    // personal records
  ach: {},    // achievements (race times)
  glc: {},    // grocery list checks + customs
  goals: [],  // short-term goals
  mission: null, // null = use default
  chatHist: [],  // protocol assistant history (rolling 25)
  // UI
  dark: true,
  glEditMode: {},
  // Collapsed state for collapsible cards
  collapsed: { banner: false, dinners: false, mission: true }
};

window.STATE = {};
window._listeners = [];

function getDefaultState() {
  return JSON.parse(JSON.stringify(STATE_DEFAULTS));
}

function migrateState(raw) {
  if (!raw || typeof raw !== 'object') return getDefaultState();
  const v = raw._v || 1;
  // v1→v2: added goals, glEditMode
  if (v < 2) { raw.goals = raw.goals || []; raw.glEditMode = {}; }
  // v2→v3: added collapsed, mission as null-default, separated chatHist
  if (v < 3) {
    raw.collapsed = { banner: false, dinners: false, mission: true };
    if (raw.mission === undefined) raw.mission = null;
    raw.chatHist = raw.chatHist || [];
  }
  raw._v = SCHEMA_VERSION;
  return raw;
}

function loadFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem('ac_state') || 'null');
    // Also check legacy keys and merge if present
    const legacy = loadLegacy();
    const migrated = migrateState(raw || {});
    // Merge legacy data in if state was fresh
    if (!raw && legacy) {
      Object.assign(migrated, legacy);
    }
    return migrated;
  } catch(e) {
    return getDefaultState();
  }
}

function loadLegacy() {
  // Pull from old scattered localStorage keys if they exist
  try {
    const chk  = JSON.parse(localStorage.getItem('ac_chk')  || 'null');
    const ovr  = JSON.parse(localStorage.getItem('ac_ovr')  || 'null');
    const bio  = JSON.parse(localStorage.getItem('ac_bio')  || 'null');
    const prs  = JSON.parse(localStorage.getItem('ac_prs')  || 'null');
    const ach  = JSON.parse(localStorage.getItem('ac_ach')  || 'null');
    const glc  = JSON.parse(localStorage.getItem('ac_glc')  || 'null');
    const goals= JSON.parse(localStorage.getItem('ac_goals')|| 'null');
    const mission = localStorage.getItem('ac_mission');
    const dark = localStorage.getItem('ac_th') !== 'L';
    const chatHist = JSON.parse(localStorage.getItem('ac_chat') || 'null');
    if (!chk && !bio && !prs) return null;
    return { chk: chk||{}, ovr: ovr||{}, bio: bio||{}, prs: prs||{}, ach: ach||{},
             glc: glc||{}, goals: goals||[], mission: mission||null, dark, chatHist: chatHist||[] };
  } catch(e) { return null; }
}

function initState() {
  const loaded = loadFromStorage();
  Object.assign(window.STATE, getDefaultState(), loaded);
  // Sync from Supabase will overwrite after auth
}

let _saveTimer = null;
function saveToStorage() {
  localStorage.setItem('ac_state', JSON.stringify(window.STATE));
}

function setState(patch, opts) {
  opts = opts || {};
  // Deep merge patch into STATE
  deepMerge(window.STATE, patch);
  saveToStorage();
  if (!opts.silent) {
    // Notify listeners
    window._listeners.forEach(fn => fn(patch));
    // Trigger Supabase sync (debounced)
    if (window.SyncModule) window.SyncModule.scheduleSave();
  }
}

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

function onStateChange(fn) {
  window._listeners.push(fn);
}

function replaceState(newState, opts) {
  // Full replacement (used after Supabase load)
  opts = opts || {};
  const migrated = migrateState(newState);
  Object.assign(window.STATE, getDefaultState(), migrated);
  saveToStorage();
  if (!opts.silent && window._listeners.length) {
    window._listeners.forEach(fn => fn(window.STATE));
  }
}

window.StateModule = { initState, setState, replaceState, onStateChange, getDefaultState };
