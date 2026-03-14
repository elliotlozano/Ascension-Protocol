'use strict';
// ── Protocol Assistant Chat ───────────────────────────────────

const CHAT_SYSTEM = `Protocol assistant for Ascension app. 30yo male, returning to fitness. V-taper, 5K races, skincare.
MEALS: 16 breakfasts (weekdays), 16 dinners (Mon-Thu), leftovers=lunch, Mon=cafeteria, Fri=date night, weekends=snack. Evening snack 9:30pm.
SCHED: Mon Push A, Tue Pull A, Wed run, Thu rest, Fri Legs+Core, Sat Push B/Pull B, Sun prep.
SUPS: D3/K2, Omega-3, Ashwagandha, Creatine post-gym, Citrulline pre-gym, Mag PM.
SKIN: AM (cleanser,VitC,SPF) PM (cleanser,retinol,moisturizer).
For changes output JSON block: \`\`\`json{"overrides":{"din.5":"grilled salmon"}}\`\`\`
Override keys: bf.{globalWeek}.{Day}, din.{0-15}, monlunch, sn.{globalWeek}.{Day}, m.{protoMonth}.{run|ret|wt|rd|label|hl}, m.{protoMonth}.rn (array), wo.{Mon|Tue|Fri|SatA|SatB}.
Be warm, concise, encouraging.`;

function addBubble(cls, text, id) {
  const thread = document.getElementById('chatThread'); if (!thread) return null;
  const div = document.createElement('div');
  div.className = 'chat-bubble ' + cls;
  if (id) div.id = id;
  div.textContent = text;
  thread.appendChild(div);
  thread.scrollTop = thread.scrollHeight;
  return div;
}

function initChatThread() {
  const thread = document.getElementById('chatThread'); if (!thread) return;
  thread.innerHTML = '';
  const hist = window.STATE.chatHist || [];
  // Show last 6 messages as context (don't flood the UI)
  hist.slice(-6).forEach(m => addBubble(m.role==='user'?'u':'a', m.content));
}

async function sendMsg() {
  const inp = document.getElementById('chatInp');
  const tx = inp ? inp.value.trim() : ''; if (!tx) return;
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }
  const btn = document.getElementById('chatSend'); if (btn) btn.disabled = true;
  let hist = [...(window.STATE.chatHist||[]), {role:'user', content:tx}];
  addBubble('u', tx);
  const thinking = addBubble('thinking', 'Thinking…');
  try {
    const r = await fetch('https://theascensionprotocol.netlify.app/.netlify/functions/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1000, system:CHAT_SYSTEM, messages:hist })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data.error) throw new Error(data.error.message);
    const full = (data.content||[]).map(b => b.text||'').join('');
    // Apply overrides
    const jm = full.match(/```json\s*([\s\S]*?)```/);
    if (jm) {
      try {
        const parsed = JSON.parse(jm[1].trim());
        if (parsed.overrides) {
          const ovr = { ...window.STATE.ovr, ...parsed.overrides };
          window.StateModule.setState({ ovr }, { silent: true });
          window.SyncModule.scheduleSave();
        }
      } catch(e) {}
    }
    const clean = full.replace(/```json[\s\S]*?```/g,'').trim();
    if (thinking && thinking.parentNode) thinking.parentNode.removeChild(thinking);
    addBubble('a', clean);
    hist = [...hist, {role:'assistant', content:full}];
    if (hist.length > 25) hist = hist.slice(hist.length - 25);
    window.StateModule.setState({ chatHist: hist });
    window.PlannerModule.renderPlanner();
  } catch(e) {
    if (thinking && thinking.parentNode) thinking.parentNode.removeChild(thinking);
    addBubble('a', "Couldn't connect — check your internet.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

window.ChatModule = { initChatThread, sendMsg };
