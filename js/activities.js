'use strict';

var STRAVA_CLIENT_ID = '227718';
var _NETLIFY_BASE = 'https://theascensionprotocol.netlify.app';
var _STRAVA_REDIRECT_URI = 'https://elliotlozano.github.io/Ascension-Protocol/strava-callback.html';
var _stravaShowAll = false;

// ── Entry point called by selTab('A5') ────────────────────────
function renderActivities() {
  var el = document.getElementById('activitiesContent');
  if (!el) return;

  if (!isStravaConnected()) {
    _renderActivitiesDisconnected();
    return;
  }

  var now = Math.floor(Date.now() / 1000);
  if (stravaActivities.length && stravaLastFetch && (now - stravaLastFetch) < 300) {
    _renderActivitiesFeed();
    return;
  }

  _renderActivitiesLoading();
  refreshStravaIfNeeded(function(err, token) {
    if (err) { _renderActivitiesDisconnected(); return; }
    _fetchActivities(token);
  });
}

// ── Strava connect / disconnect ───────────────────────────────
function stravaConnect() {
  var url = 'https://www.strava.com/oauth/authorize'
    + '?client_id=' + STRAVA_CLIENT_ID
    + '&redirect_uri=' + encodeURIComponent(_STRAVA_REDIRECT_URI)
    + '&response_type=code'
    + '&scope=activity:read_all,profile:read_all';
  window.location.href = url;
}

function stravaDisconnect() {
  ['ac_strava_tok','ac_strava_rtok','ac_strava_exp','ac_strava_uid',
   'ac_strava_name','ac_strava_acts','ac_strava_last'].forEach(function(k) {
    localStorage.removeItem(k);
  });
  stravaToken = null;
  stravaRefreshToken = null;
  stravaExpiry = 0;
  stravaAthleteId = null;
  stravaAthleteName = null;
  stravaActivities = [];
  stravaLastFetch = 0;
  _stravaShowAll = false;
  _renderActivitiesDisconnected();
}

function stravaShowMore() {
  _stravaShowAll = true;
  _renderActivitiesFeed();
}

// ── Fetch activities from Netlify function ────────────────────
function _fetchActivities(token) {
  fetch(_NETLIFY_BASE + '/.netlify/functions/strava-activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token, per_page: 30 })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.error) { _renderActivitiesError(data.error); return; }
    if (!Array.isArray(data)) { _renderActivitiesError('Unexpected response'); return; }
    stravaActivities = data;
    stravaLastFetch = Math.floor(Date.now() / 1000);
    localStorage.setItem('ac_strava_acts', JSON.stringify(stravaActivities));
    localStorage.setItem('ac_strava_last', String(stravaLastFetch));
    _renderActivitiesFeed();
    _syncStravaRunPRs(token);
  })
  .catch(function(e) { _renderActivitiesError(e.message); });
}

// ── Render states ─────────────────────────────────────────────
function _renderActivitiesDisconnected() {
  var el = document.getElementById('activitiesContent');
  if (!el) return;
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center">'
    + '<svg viewBox="0 0 48 48" style="width:64px;height:64px;margin-bottom:20px">'
    + '<polygon points="28,3 11,27 22,27 20,45 41,21 30,21 33,3" fill="#FC4C02"/>'
    + '<polygon points="18,3 1,27 12,27 10,45 31,21 20,21 23,3" fill="#FC4C02" opacity="0.55"/>'
    + '</svg>'
    + '<div style="font-family:var(--fd);font-size:26px;font-weight:600;color:var(--t);margin-bottom:8px">Connect Strava</div>'
    + '<div style="font-size:14px;color:var(--mu);margin-bottom:28px;line-height:1.6">Sync your activities and auto-detect PRs</div>'
    + '<button class="strava-connect-btn" onclick="stravaConnect()">Connect with Strava</button>'
    + '</div>';
}

function _renderActivitiesLoading() {
  var el = document.getElementById('activitiesContent');
  if (!el) return;
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px">'
    + '<div class="strava-spinner"></div>'
    + '<div style="font-size:14px;color:var(--mu);margin-top:16px">Loading activities…</div>'
    + '</div>';
}

function _renderActivitiesError(msg) {
  var el = document.getElementById('activitiesContent');
  if (!el) return;
  el.innerHTML =
    '<div style="text-align:center;padding:40px 24px">'
    + '<div style="color:var(--mu);font-size:14px;margin-bottom:12px">Failed to load: ' + escHtml(msg) + '</div>'
    + '<button onclick="renderActivities()" style="color:var(--a);font-size:13px;font-weight:600">Retry</button>'
    + '</div>';
}

function _renderActivitiesFeed() {
  var el = document.getElementById('activitiesContent');
  if (!el) return;

  var html = '<div class="activities-header">'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<svg viewBox="0 0 24 24" style="width:16px;height:16px;flex-shrink:0">'
    + '<polygon points="14,2 5,14 11,14 10,22 21,10 15,10 16,2" fill="#FC4C02"/>'
    + '</svg>'
    + '<span style="font-size:15px;font-weight:700;color:var(--t)">' + escHtml(stravaAthleteName || 'Athlete') + '</span>'
    + '</div>'
    + '<button class="strava-disconnect" onclick="stravaDisconnect()">Disconnect</button>'
    + '</div>';

  var toShow = _stravaShowAll ? stravaActivities : stravaActivities.slice(0, 5);
  toShow.forEach(function(act) {
    html += _buildActivityCard(act);
  });

  if (!_stravaShowAll && stravaActivities.length > 5) {
    html += '<button onclick="stravaShowMore()" style="width:100%;padding:12px;background:var(--s);border-radius:var(--rc);border:1px dashed var(--b2);color:var(--mu);font-size:14px;font-weight:600;margin-bottom:12px">Show More (' + (stravaActivities.length - 5) + ' more)</button>';
  }

  el.innerHTML = html;
}

// ── Activity card builder ─────────────────────────────────────
function _buildActivityCard(act) {
  var typeEmoji = { Run: '🏃', Ride: '🚴', Swim: '🏊', Walk: '🚶' }[act.type] || '⚡';
  var distMiles = ((act.distance || 0) * 0.000621371).toFixed(2);
  var moveSec = act.moving_time || 0;
  var timeStr = _fmtTime(moveSec);

  var paceStr = '—';
  var distMilesNum = (act.distance || 0) * 0.000621371;
  if (distMilesNum > 0 && moveSec > 0) {
    var paceSecPerMile = moveSec / distMilesNum;
    var pm = Math.floor(paceSecPerMile / 60);
    var ps = Math.round(paceSecPerMile % 60);
    if (ps === 60) { pm++; ps = 0; }
    paceStr = pm + ':' + (ps < 10 ? '0' : '') + ps + ' /mi';
  }

  var d = new Date(act.start_date_local || act.start_date || '');
  var dateStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return '<div class="card strava-card">'
    + '<div class="strava-watermark">S</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--t);margin-bottom:5px">' + escHtml(act.name || 'Activity') + '</div>'
    + '<div style="font-size:13px;color:var(--mu);margin-bottom:12px">' + typeEmoji + ' ' + escHtml(act.type || '') + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + _statCell('Distance', distMiles + ' mi')
    + _statCell('Time', timeStr)
    + _statCell('Pace', paceStr)
    + _statCell('Date', dateStr)
    + '</div>'
    + '</div>';
}

function _statCell(label, val) {
  return '<div>'
    + '<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--mu);margin-bottom:2px">' + label + '</div>'
    + '<div style="font-size:14px;font-weight:700;color:var(--t)">' + escHtml(String(val)) + '</div>'
    + '</div>';
}

function _fmtTime(sec) {
  var h = Math.floor(sec / 3600);
  var m = Math.floor((sec % 3600) / 60);
  var s = sec % 60;
  if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ── PR auto-sync ──────────────────────────────────────────────
function _syncStravaRunPRs(token) {
  var runs = stravaActivities.filter(function(a) { return a.type === 'Run'; }).slice(0, 10);
  if (!runs.length) return;

  var pending = runs.length;
  var changed = false;

  runs.forEach(function(act) {
    fetch(_NETLIFY_BASE + '/.netlify/functions/strava-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token, activity_id: act.id })
    })
    .then(function(r) { return r.json(); })
    .then(function(detail) {
      if (detail.best_efforts && Array.isArray(detail.best_efforts)) {
        if (_processStravaEfforts(detail.best_efforts, act.start_date_local || act.start_date)) {
          changed = true;
        }
      }
      pending--;
      if (pending === 0 && changed) {
        save();
        var pM = document.getElementById('pM');
        if (pM && pM.classList.contains('on')) renderMetrics();
      }
    })
    .catch(function() { pending--; });
  });
}

function _processStravaEfforts(efforts, actDate) {
  _migratePrs();
  var changed = false;
  var d = new Date(actDate || '');
  var dateStr = isNaN(d.getTime()) ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  var NAME_MAP = {
    '1 mile':   'mile',
    '1 Mile':   'mile',
    '2 mile':   'twomile',
    '2 Mile':   'twomile',
    '2 miles':  'twomile',
    '2 Miles':  'twomile',
    '1.5 mile': 'twomile',
    '1.5 Mile': 'twomile',
    '5k':       'fivek',
    '5K':       'fivek'
  };

  efforts.forEach(function(effort) {
    var prKey = NAME_MAP[effort.name];
    if (!prKey) return;
    var effortSec = effort.elapsed_time || 0;
    if (!effortSec) return;

    var m = Math.floor(effortSec / 60);
    var s = effortSec % 60;
    var timeStr = m + ':' + (s < 10 ? '0' : '') + s;

    var existing = prs[prKey] || [];
    var bestExisting = existing.length ? _parsePRMinutes(existing[0].v) : Infinity;
    var newVal = _parsePRMinutes(timeStr);

    if (newVal < bestExisting) {
      if (!prs[prKey]) prs[prKey] = [];
      prs[prKey].unshift({ v: timeStr, d: dateStr, strava: true });
      prs[prKey].sort(function(a, b) { return _parsePRMinutes(a.v) - _parsePRMinutes(b.v); });
      prs[prKey] = prs[prKey].slice(0, 3);
      changed = true;
    }
  });

  return changed;
}
