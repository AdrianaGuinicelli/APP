async function drawChatList() {
  if (!isLoggedIn) { navigate('login'); return; }
  showLoading();
  const { data: myParts } = await supabase.from('event_participants').select('event_id').eq('user_id', currentUser.id);
  const ids = (myParts || []).map(p => p.event_id);
  let myEvents = [];
  if (ids.length) {
    const { data } = await supabase.from('events').select('*').in('id', ids);
    myEvents = data || [];
  }
  let html = '<div class="section-title" style="margin-bottom:14px">Le tue chat</div><div class="events-grid">';
  if (!myEvents.length) html += '<div style="text-align:center;color:#aaa;padding:40px;grid-column:1/-1">Nessun gruppo ancora.</div>';
  myEvents.forEach(e => {
    html += `<div class="card" onclick="navigate('eventGroup',${e.id})" style="cursor:pointer">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="font-size:36px">${e.emoji || '🎉'}</div>
        <div style="flex:1">
          <div style="font-weight:700">${e.title}</div>
          <div style="font-size:13px;color:#888">Tocca per aprire la chat</div>
        </div>
        <div style="font-size:20px;color:#ddd">›</div>
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

async function drawEventGroup(eventId) {
  const { data: e } = await supabase.from('events').select('*').eq('id', eventId).single();
  if (!e) return;
  document.getElementById('headerTitle').textContent = e.title;

  let html = '<div style="max-width:700px;margin:0 auto;">';
  html += `<div style="background:#fff;border-radius:14px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
    <div style="font-size:28px">${e.emoji || '🎉'}</div>
    <div><div style="font-weight:700">${e.title}</div><div style="font-size:12px;color:#888">${e.location || ''}</div></div>
  </div>`;
  html += `<div class="tabs">
    <div class="tab ${activeTab === 'chat' ? 'active' : ''}" onclick="switchTab('chat',${e.id})">💬 Chat</div>
    <div class="tab ${activeTab === 'participants' ? 'active' : ''}" onclick="switchTab('participants',${e.id})">👥 Partecipanti</div>
    <div class="tab ${activeTab === 'details' ? 'active' : ''}" onclick="switchTab('details',${e.id})">ℹ️ Dettagli</div>
  </div>`;
  html += '<div id="groupTabContent">';
  if (activeTab === 'chat') html += await renderChat(e);
  else if (activeTab === 'participants') html += await renderParticipants(e);
  else html += renderEventDetails(e);
  html += '</div></div>';
  document.getElementById('content').innerHTML = html;
  if (activeTab === 'chat') {
    setTimeout(() => { const c = document.getElementById('chatMsgs'); if (c) c.scrollTop = c.scrollHeight; }, 50);
  }
}

function switchTab(tab, eventId) { activeTab = tab; drawEventGroup(eventId); }

async function renderChat(e) {
  const { data: msgs } = await supabase.from('messages')
    .select('*,profiles(name,emoji)').eq('event_id', e.id).order('created_at', { ascending: true });
  let html = '<div class="chat-messages" id="chatMsgs">';
  if (!msgs || !msgs.length) html += '<div style="text-align:center;color:#aaa;padding:20px">Nessun messaggio. Inizia! 👋</div>';
  (msgs || []).forEach(m => {
    const isMine = m.sender_id === currentUser?.id;
    const time   = new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    html += `<div class="msg-wrap ${isMine ? 'me' : 'them'}">
      ${!isMine ? `<div class="msg-sender">${m.profiles?.name || 'Utente'}</div>` : ''}
      <div class="msg-bubble ${isMine ? 'sent' : 'received'}">${m.message}</div>
      <div class="msg-time">${time}</div>
    </div>`;
  });
  html += `</div>
  <div class="chat-input-row">
    <input id="msgInput" placeholder="Scrivi un messaggio..." onkeypress="if(event.key==='Enter')sendMessage(${e.id})">
    <button class="send-btn" onclick="sendMessage(${e.id})">➤</button>
  </div>`;
  return html;
}

async function sendMessage(eventId) {
  const inp = document.getElementById('msgInput');
  if (!inp || !inp.value.trim()) return;
  if (!isLoggedIn) { toast('⚠️ Devi essere loggato'); return; }
  const { error } = await supabase.from('messages').insert({ event_id: eventId, sender_id: currentUser.id, message: inp.value.trim() });
  if (error) { toast('❌ ' + error.message); return; }
  inp.value = '';
  await drawEventGroup(eventId);
}

async function renderParticipants(e) {
  const { data: parts } = await supabase.from('event_participants')
    .select('*,profiles(id,name,city,verified,emoji,photo_url)').eq('event_id', e.id);
  let html = `<div style="font-size:13px;color:#888;margin-bottom:12px">${parts?.length || 0}/${e.max_participants} partecipanti</div>`;
  (parts || []).forEach(p => {
    const u = p.profiles; if (!u) return;
    const avatarHtml = u.photo_url
      ? `<img src="${u.photo_url}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;" />`
      : (u.emoji || '👤');
    html += `<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0">
      <div class="avatar">${avatarHtml}</div>
      <div style="flex:1">
        <div style="font-weight:600">${u.name}${u.verified ? ' <span class="verified-badge">✅</span>' : ''}</div>
        <div style="font-size:12px;color:#888">📍 ${u.city || ''}</div>
      </div>
      ${u.id !== currentUser?.id
        ? `<div style="display:flex;gap:8px">
            <span style="cursor:pointer;font-size:18px" onclick="navigate('report',${e.id})" title="Segnala">🚩</span>
            <span style="cursor:pointer;font-size:18px" onclick="blockUser('${u.id}')" title="Blocca">🚫</span>
           </div>`
        : '<span style="font-size:12px;background:#f0eeff;color:#6c5ce7;border-radius:10px;padding:3px 8px">Tu</span>'}
    </div>`;
  });
  return html;
}

function blockUser(uid) {
  if (!blockedUsers.includes(uid)) { blockedUsers.push(uid); toast('🚫 Utente bloccato'); }
  else { blockedUsers = blockedUsers.filter(i => i !== uid); toast('🔓 Sbloccato'); }
}

function renderEventDetails(e) {
  const dl = distLabel(e);
  let html = '';
  if (e.date_time)
    html += `<div class="detail-row"><span class="icon">📅</span>${new Date(e.date_time).toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</div>`;
  html += `<div class="detail-row"><span class="icon">📍</span>${e.address || e.location || ''}
    ${dl ? `<br><span style="color:#6c5ce7;font-size:12px">📍 ${dl} da te</span>` : ''}
  </div>`;
  html += `<div class="detail-row"><span class="icon">📝</span><span style="color:#555">${e.description || ''}</span></div>`;
  if (e.external_link)
    html += `<div class="detail-row"><span class="icon">🔗</span><a href="${e.external_link}" target="_blank" style="color:#6c5ce7">${e.external_link}</a></div>`;
  html += `<div class="btn" onclick="navigate('feedback',${e.id})" style="margin-top:16px">⭐ Lascia feedback</div>`;
  return html;
}
