'use strict';
// ── Metrics Tab ───────────────────────────────────────────────

const BIOF = [
  {k:'weight',l:'Weight',u:'lbs'},{k:'bodyfat',l:'Body Fat',u:'%'},
  {k:'waist',l:'Waist',u:'in'},{k:'chest',l:'Chest',u:'in'},
  {k:'shoulders',l:'Shoulders',u:'in'},{k:'bicep',l:'Bicep',u:'in'}
];
const LIFTS = [
  {k:'squat',l:'Back Squat'},{k:'bench',l:'Bench Press'},{k:'deadlift',l:'Deadlift'},
  {k:'ohp',l:'Overhead Press'},{k:'row',l:'Barbell Row'},{k:'pullup',l:'Weighted Pull-up'}
];
const RUNS = [{k:'mile',l:'1 Mile'},{k:'fivek',l:'5K'},{k:'run30',l:'30-min dist'}];

let bioEditing = false;

function renderMetrics() {
  renderMacros();
  renderBiometrics();
  renderPRs();
  drawWeightGraph();
}

function renderMacros() {
  const { cal, protein, carbs, fat, weight, bf } = window.DataModule.calcMacros();
  const el = document.getElementById('macroCard');
  if (!el) return;
  el.innerHTML = `
    <div class="ct">Daily Targets · auto-calculated</div>
    <div class="mrow">
      <div><div class="mlbl">Calories</div><div class="msub">${weight}lb · ${bf}% BF</div></div>
      <div class="mval">${cal}</div>
    </div>
    <div class="mtrk"><div class="mfil" style="width:100%;background:var(--a)"></div></div>
    <div class="mgrd">
      <div class="mitm"><div class="miv" style="color:#6b8cae">${protein}g</div><div class="mik">Protein</div></div>
      <div class="mitm"><div class="miv" style="color:#7a9e87">${carbs}g</div><div class="mik">Carbs</div></div>
      <div class="mitm"><div class="miv" style="color:#a89530">${fat}g</div><div class="mik">Fat</div></div>
    </div>`;
}

function renderBiometrics() {
  const bio = window.STATE.bio;
  const grid = document.getElementById('bioGrid');
  const inputs = document.getElementById('bioInputs');
  const btn = document.getElementById('bioBtn');
  if (grid) {
    grid.innerHTML = BIOF.map(f => `
      <div class="bio-f">
        <div class="bio-l">${f.l}</div>
        <div class="bio-v">${bio[f.k]||'—'}</div>
        <div class="bio-u">${f.u}</div>
      </div>`).join('');
  }
  if (inputs) {
    inputs.innerHTML = BIOF.map(f => `
      <div class="bio-row">
        <span class="bio-rl">${f.l} (${f.u})</span>
        <input class="inp" id="biin-${f.k}" type="number" placeholder="${bio[f.k]||''}" step="0.1" style="max-width:110px">
      </div>`).join('');
    inputs.className = 'bio-inputs' + (bioEditing ? ' open' : '');
  }
  if (btn) btn.textContent = bioEditing ? '✓' : '✎';
}

function toggleBioEdit() {
  if (bioEditing) {
    const bio = { ...window.STATE.bio };
    BIOF.forEach(f => {
      const inp = document.getElementById('biin-' + f.k);
      if (inp && inp.value.trim()) {
        bio[f.k] = inp.value.trim();
        if (f.k === 'weight') {
          if (!bio.wtHist) bio.wtHist = [];
          bio.wtHist.unshift({ v: bio[f.k], d: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}) });
          if (bio.wtHist.length > 20) bio.wtHist.pop();
        }
      }
    });
    window.StateModule.setState({ bio });
    renderMacros(); // re-calc macros immediately with new bio data
  }
  bioEditing = !bioEditing;
  renderBiometrics();
  if (!bioEditing) drawWeightGraph();
}

function renderPRs() {
  const prs = window.STATE.prs;
  const lEl = document.getElementById('liftPRs');
  const rEl = document.getElementById('runPRs');
  if (lEl) {
    lEl.innerHTML = LIFTS.map(lf => {
      const pr = prs[lf.k];
      return `<div class="pr-row">
        <div><div class="pr-name">${lf.l}</div>${pr?`<div class="pr-date">${pr.d}</div>`:''}</div>
        <div style="text-align:right">
          <div class="pr-val">${pr?pr.v+' lbs':'—'}</div>
          <div class="pr-inp-row" id="prrow-${lf.k}">
            <input class="inp" id="prin-${lf.k}" type="number" placeholder="lbs" style="width:80px;text-align:right">
            <button class="ok-btn" onclick="MetricsModule.savePR('${lf.k}','lift')">✓</button>
          </div>
          <button class="pr-btn" onclick="MetricsModule.togglePRInput('${lf.k}')">${pr?'Update':'Log PR'}</button>
        </div>
      </div>`;
    }).join('');
  }
  if (rEl) {
    rEl.innerHTML = RUNS.map(r => {
      const pr = prs[r.k];
      return `<div class="pr-row">
        <div><div class="pr-name">${r.l}</div>${pr?`<div class="pr-date">${pr.d}</div>`:''}</div>
        <div style="text-align:right">
          <div class="pr-val">${pr?pr.v:'—'}</div>
          <div class="pr-inp-row" id="prrow-${r.k}">
            <input class="inp" id="prin-${r.k}" type="text" placeholder="MM:SS" style="width:90px;text-align:right">
            <button class="ok-btn" onclick="MetricsModule.savePR('${r.k}','run')">✓</button>
          </div>
          <button class="pr-btn" onclick="MetricsModule.togglePRInput('${r.k}')">${pr?'Update':'Log PR'}</button>
        </div>
      </div>`;
    }).join('');
  }
}

function togglePRInput(k) {
  const row = document.getElementById('prrow-' + k); if (!row) return;
  row.classList.toggle('open');
  const inp = document.getElementById('prin-' + k);
  if (inp && row.classList.contains('open')) inp.focus();
}
function savePR(k) {
  const inp = document.getElementById('prin-' + k); if (!inp||!inp.value.trim()) return;
  const prs = { ...window.STATE.prs, [k]: { v:inp.value.trim(), d:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}) } };
  window.StateModule.setState({ prs }); renderPRs();
}

function drawWeightGraph() {
  const wh = window.STATE.bio.wtHist || [];
  const canvas = document.getElementById('wtCanvas');
  const empty = document.getElementById('wtEmpty');
  if (!canvas) return;
  if (wh.length < 2) { canvas.style.display='none'; if(empty) empty.style.display='block'; return; }
  canvas.style.display = 'block'; if(empty) empty.style.display = 'none';
  const W = canvas.parentElement.offsetWidth || 300, H = 120;
  canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  const ctx = canvas.getContext('2d'); ctx.scale(devicePixelRatio, devicePixelRatio);
  const pts = [...wh].reverse();
  const vals = pts.map(p => parseFloat(p.v)).filter(v => !isNaN(v));
  if (vals.length < 2) { canvas.style.display='none'; if(empty) empty.style.display='block'; return; }
  const minV = Math.min(...vals)-2, maxV = Math.max(...vals)+2, range = maxV-minV||1;
  const pad = {l:8,r:8,t:10,b:24}, iW = W-pad.l-pad.r, iH = H-pad.t-pad.b;
  const xP = i => pad.l + i*(iW/(vals.length-1));
  const yP = v => pad.t + iH*(1-(v-minV)/range);
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle = window.STATE.dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)'; ctx.lineWidth=1;
  for (let g=0;g<4;g++){const gy=pad.t+(iH/3)*g;ctx.beginPath();ctx.moveTo(pad.l,gy);ctx.lineTo(W-pad.r,gy);ctx.stroke();}
  const grad = ctx.createLinearGradient(0,pad.t,0,H);
  grad.addColorStop(0,'rgba(212,168,83,.3)'); grad.addColorStop(1,'rgba(212,168,83,.02)');
  ctx.beginPath(); ctx.moveTo(xP(0),yP(vals[0]));
  vals.forEach((v,i)=>{ if(i>0) ctx.lineTo(xP(i),yP(v)); });
  ctx.lineTo(xP(vals.length-1),H-pad.b); ctx.lineTo(xP(0),H-pad.b);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); ctx.moveTo(xP(0),yP(vals[0]));
  vals.forEach((v,i)=>{ if(i>0) ctx.lineTo(xP(i),yP(v)); });
  ctx.strokeStyle='#d4a853'; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke();
  vals.forEach((v,i)=>{
    ctx.beginPath(); ctx.arc(xP(i),yP(v),3,0,Math.PI*2); ctx.fillStyle='#d4a853'; ctx.fill();
    if(i===0||i===vals.length-1||vals.length<=6){
      ctx.fillStyle=window.STATE.dark?'rgba(255,255,255,.5)':'rgba(0,0,0,.4)';
      ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.fillText(v,xP(i),yP(v)-7);
    }
  });
  ctx.fillStyle=window.STATE.dark?'rgba(255,255,255,.3)':'rgba(0,0,0,.3)'; ctx.font='9px sans-serif';
  if(pts.length){ctx.textAlign='left';ctx.fillText(pts[0].d,pad.l,H-6);}
  if(pts.length>1){ctx.textAlign='right';ctx.fillText(pts[pts.length-1].d,W-pad.r,H-6);}
}

window.MetricsModule = { renderMetrics, toggleBioEdit, togglePRInput, savePR };
