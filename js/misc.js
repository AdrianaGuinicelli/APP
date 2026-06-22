// ── FEEDBACK ──────────────────────────────────────────────────────────────────
function drawFeedback(eventId) {
  selectedStars = 0; thumbValue = null; repeatValue = null;
  const e = events.find(ev => ev.id === eventId) || { title: 'Evento' };
  document.getElementById('content').innerHTML = `
    <div style="max-width:600px;margin:0 auto;">
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:60px">🎉</div>
        <div style="font-size:20px;font-weight:800;margin-top:10px">Grazie per aver partecipato!</div>
        <div style="font-size:14px;color:#888;margin-top:6px">Com'è andata a <b>${e.title}</b>?</div>
      </div>
      <div style="font-size:15px;font-weight:700;text-align:center">Valuta la tua esperienza</div>
      <div class="stars">
        ${[1,2,3,4,5].map(s => `<span class="star" onclick="setStar(${s})" id="star${s}">★</span>`).join('')}
      </div>
      <div style="font-size:14px;font-weight:700;margin-top:16px">Ti sei trovato bene con le persone?</div>
      <div style="display:flex;gap:16px;justify-content:center;margin:14px 0">
        <span style="font-size:40px;cursor:pointer" id="thumbUp"   onclick="selectThumb(true)">👍</span>
        <span style="font-size:40px;cursor:pointer" id="thumbDown" onclick="selectThumb(false)">👎</span>
      </div>
      <div style="font-size:14px;font-weight:700">Rifarebbe l'esperienza insieme?</div>
      <div style="display:flex;gap:10px;margin:10px 0">
        <div class="btn sm secondary" id="repeatYes" onclick="setRepeat(true)">👍 Sì</div>
        <div class="btn sm secondary" id="repeatNo"  onclick="setRepeat(false)">👎 No</div>
      </div>
      <label>Commento (opzionale)</label>
      <textarea id="feedbackComment" placeholder="Descrivi la tua esperienza..." rows="3"></textarea>
      <div class="btn" onclick="submitFeedback(${eventId})" style="margin-top:16px">📤 Invia feedback</div>
    </div>`;
}
function setStar(n) {
  selectedStars = n;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < n));
}
function selectThumb(v) {
  thumbValue = v;
  document.getElementById('thumbUp').style.opacity   = v ? 1 : .4;
  document.getElementById('thumbDown').style.opacity = v ? .4 : 1;
}
function setRepeat(v) {
  repeatValue = v;
  document.getElementById('repeatYes').className = 'btn sm ' + (v ? '' : 'secondary');
  document.getElementById('repeatNo').className  = 'btn sm ' + (v ? 'secondary' : '');
}
async function submitFeedback(eventId) {
  if (!selectedStars) { toast('⭐ Seleziona almeno una stella'); return; }
  const { error } = await supabase.from('feedback').insert({
    event_id: eventId, from_user_id: currentUser.id,
    rating: selectedStars,
    comment: document.getElementById('feedbackComment').value,
    would_meet_again: repeatValue
  });
  if (error) { toast('❌ ' + error.message); return; }
  toast('✅ Feedback inviato! Grazie 🙏');
  setTimeout(() => navigate('home'), 1500);
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
function drawNotifications() {
  const unread = notifications.filter(n => !n.read).length;
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <div style="font-size:14px;color:#888">${unread} non lette</div>
    <span class="section-link" onclick="markAllRead()">Segna tutte lette</span>
  </div>`;
  if (!notifications.length) html += '<div style="text-align:center;color:#aaa;padding:40px">Nessuna notifica</div>';
  notifications.forEach(n => {
    html += `<div class="notif-item" onclick="markRead(${n.id})" style="cursor:pointer">
      <div class="notif-dot ${n.read ? 'read' : ''}"></div>
      <div style="font-size:24px">${n.icon}</div>
      <div style="flex:1">
        <div style="font-size:14px;${n.read ? 'color:#888' : ''}">${n.text}</div>
        <div style="font-size:12px;color:#aaa;margin-top:3px">${n.time}</div>
      </div>
    </div>`;
  });
  document.getElementById('content').innerHTML = html;
}
function markRead(id) { const n = notifications.find(x => x.id === id); if (n) n.read = true; drawNotifications(); }
function markAllRead() { notifications.forEach(n => n.read = true); drawNotifications(); }

// ── REPORT ────────────────────────────────────────────────────────────────────
function drawReport() {
  const reasons = ['Profilo falso','Comportamento inappropriato','Molestie','Spam','Mancata presenza','Contenuto inappropriato'];
  let html = `<div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:48px">🚩</div>
      <div style="font-weight:800;font-size:18px;margin-top:8px">Segnala</div>
      <div style="font-size:13px;color:#888;margin-top:4px">Aiutaci a mantenere la community sicura</div>
    </div>
    <div style="font-weight:700;margin-bottom:10px">Motivo</div>`;
  reasons.forEach(r => {
    html += `<div class="report-option ${reportSelected === r ? 'selected' : ''}" onclick="selectReason('${r}',this)">${r}</div>`;
  });
  html += `<label>Descrizione (opzionale)</label>
    <textarea id="reportDesc" placeholder="Descrivi..." rows="3"></textarea>
    <div class="btn danger" onclick="submitReport()" style="margin-top:16px">🚩 Invia segnalazione</div>
    <div class="btn secondary" onclick="goBack()" style="margin-top:8px">Annulla</div>
  </div>`;
  document.getElementById('content').innerHTML = html;
}
function selectReason(r, el) {
  reportSelected = r;
  document.querySelectorAll('.report-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}
async function submitReport() {
  if (!reportSelected) { toast('⚠️ Seleziona un motivo'); return; }
  const { error } = await supabase.from('reports').insert({
    reporter_id: currentUser?.id || null,
    reason: reportSelected,
    description: document.getElementById('reportDesc').value,
    event_id: currentEventId || null
  });
  if (error) { toast('❌ ' + error.message); return; }
  reportSelected = '';
  toast('✅ Segnalazione inviata!');
  goBack();
}
