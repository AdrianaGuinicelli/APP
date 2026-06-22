function drawAI() {
  const user = currentUser || { name: 'Utente' };
  let html = `<div style="max-width:700px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:50px">🤖</div>
      <div style="font-weight:700;font-size:18px">AI Assistant</div>
      <div style="font-size:13px;color:#888">Il tuo assistente personale</div>
    </div>
    <div class="ai-bubble">Ciao ${user.name?.split(' ')[0] || ''}! 👋<br>Dimmi cosa vorresti fare e ti aiuto.<br><br>
      <b>Prova:</b> "Cercami eventi di trekking" • "Voglio conoscere nuove persone"
    </div>
    <div style="font-weight:700;font-size:14px;margin-bottom:10px">💡 Suggeriti per te</div>`;

  const sug = events.filter(e => userInterests.some(t => e.category === t)).slice(0, 3);
  sug.forEach(e => {
    html += `<div class="ai-suggestion" onclick="navigate('eventDetail',${e.id})">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:28px">${e.emoji || '🎉'}</span>
        <div>
          <div style="font-weight:700;font-size:14px">${e.title}</div>
          <div style="font-size:12px;color:#888">${e.location || ''}</div>
        </div>
        <div style="margin-left:auto;font-size:18px;color:#ddd">›</div>
      </div>
    </div>`;
  });
  if (!sug.length) html += '<div style="text-align:center;color:#aaa;padding:16px">Nessun evento trovato.</div>';

  html += `<div class="ai-suggestion" onclick="navigate('matchPeople')" style="margin-top:4px">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:28px">🤝</span>
      <div>
        <div style="font-weight:700;font-size:14px">Persone compatibili</div>
        <div style="font-size:12px;color:#888">Trova persone con i tuoi interessi</div>
      </div>
      <div style="margin-left:auto">›</div>
    </div>
  </div>
  <div class="chat-messages" id="aiChatMsgs" style="margin-top:16px;min-height:40px;max-height:300px"></div>
  <div class="chat-input-row">
    <input id="aiInput" placeholder="Scrivi cosa vorresti fare..." onkeypress="if(event.key==='Enter')sendAI()">
    <button class="send-btn" onclick="sendAI()">➤</button>
  </div>
  </div>`;
  document.getElementById('content').innerHTML = html;
}

function sendAI() {
  const inp = document.getElementById('aiInput');
  if (!inp || !inp.value.trim()) return;
  const text = inp.value.trim(); inp.value = '';
  const chat = document.getElementById('aiChatMsgs');

  const uW = document.createElement('div');
  uW.className = 'msg-wrap me';
  uW.innerHTML = `<div class="msg-bubble sent">${text}</div>`;
  chat.appendChild(uW);

  const ty = document.createElement('div');
  ty.className = 'msg-wrap them'; ty.id = 'aiTyping';
  ty.innerHTML = '<div class="msg-bubble received" style="padding:14px"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>';
  chat.appendChild(ty);
  chat.scrollTop = chat.scrollHeight;

  setTimeout(() => {
    document.getElementById('aiTyping')?.remove();
    const r = getAIReply(text);
    const aW = document.createElement('div');
    aW.className = 'msg-wrap them';
    aW.innerHTML = `<div class="msg-bubble received" style="background:#f0eeff">${r.reply}</div>`;
    chat.appendChild(aW);
    if (r.suggest) {
      const ev = events.find(e => e.category === r.suggest);
      if (ev) {
        const c = document.createElement('div');
        c.className = 'ai-suggestion'; c.style.marginTop = '8px';
        c.onclick = () => navigate('eventDetail', ev.id);
        c.innerHTML = `<div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">${ev.emoji || '🎉'}</span>
          <div>
            <div style="font-weight:700;font-size:13px">${ev.title}</div>
            <div style="font-size:12px;color:#888">${ev.location || ''}</div>
          </div>
          <div style="margin-left:auto">›</div>
        </div>`;
        chat.appendChild(c);
      }
    }
    chat.scrollTop = chat.scrollHeight;
  }, 1000);
}
