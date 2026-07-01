async function drawHome() {
  showLoading();
  await loadEvents();
  const user = currentUser || { name: 'Utente', completeness: 40, interests: [] };
  const fn = firstName(user);
  const suggested = events.filter(e => (user.interests || []).some(t => e.category === t)).slice(0, 8);
  const rest      = events.filter(e => !suggested.includes(e)).slice(0, 6);

  let html = `<div style="margin-bottom:20px">
    <div style="font-size:24px;font-weight:800">Ciao ${fn}! 👋</div>
    <div style="font-size:14px;color:#888;margin-top:4px">Ecco cosa abbiamo per te</div>
  </div>`;

  if ((user.completeness || 40) < 80) {
    html += `<div class="card" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;cursor:pointer;margin-bottom:20px" onclick="navigate('profile')">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px">🤳</div>
        <div style="flex:1">
          <div style="font-weight:700">Completa il tuo profilo</div>
          <div style="font-size:13px;opacity:.85">Completato al ${user.completeness || 40}%</div>
          <div class="progress-bar" style="margin-top:6px;background:rgba(255,255,255,.3)">
            <div class="progress-fill" style="width:${user.completeness || 40}%;background:#fff"></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  html += `<div class="section-header">
    <span class="section-title">Consigliati per te</span>
    <span class="section-link" onclick="navigate('search')">Vedi tutti</span>
  </div>`;

  const toShow = suggested.length ? suggested : events.slice(0, 8);
  if (!toShow.length) {
    html += `<div style="text-align:center;color:#aaa;padding:30px">Nessun evento.<br>
      <div class="btn" onclick="navigate('create')" style="margin-top:10px;max-width:200px;margin-left:auto;margin-right:auto">
        + Crea il primo evento
      </div>
    </div>`;
  } else {
    html += '<div class="scroll-row">';
    toShow.forEach(e => {
      const dl = distLabel(e);
      html += `<div class="scroll-card" onclick="navigate('eventDetail',${e.id})">
        <div style="font-size:42px;text-align:center;padding:8px 0">${e.emoji || '🎉'}</div>
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${e.title}</div>
        <div style="font-size:12px;color:#888">${e.location || ''}</div>
        ${dl ? `<div style="font-size:11px;color:#6c5ce7;margin-top:3px">📍 ${dl}</div>` : ''}
        ${e.price === 0
          ? '<div style="font-size:11px;color:#00b894;margin-top:3px">✅ Gratuito</div>'
          : `<div style="font-size:11px;color:#e67e22;margin-top:3px">💰 €${e.price}</div>`}
      </div>`;
    });
    html += '</div>';
  }

  html += '<div class="section-header" style="margin-top:24px"><span class="section-title">Tutti gli eventi</span></div>';
  html += '<div class="events-grid">';
  const toShow2 = rest.length ? rest : events.slice(0, 6);
  toShow2.forEach(e => {
    const dl = distLabel(e);
    html += `<div class="card" onclick="navigate('eventDetail',${e.id})" style="cursor:pointer">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="font-size:38px">${e.emoji || '🎉'}</div>
        <div style="flex:1">
          <div class="card-title">${e.title}</div>
          <div class="card-meta">📍 ${e.location || ''}
            ${dl ? `<span style="background:#f0eeff;color:#6c5ce7;border-radius:8px;padding:1px 6px;font-size:11px">📍 ${dl}</span>` : ''}
          </div>
          <div class="card-meta">${e.price === 0 ? '✅ Gratuito' : '💰 €' + e.price}</div>
        </div>
        <div style="font-size:22px;color:#ddd">›</div>
      </div>
    </div>`;
  });
  html += '</div>';

  html += `<div class="card" onclick="navigate('aiAssistant')"
    style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;cursor:pointer;margin-top:8px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="font-size:32px">🤖</div>
      <div><div style="font-weight:700">AI Assistant</div><div style="font-size:13px;opacity:.85">Suggerimenti personalizzati</div></div>
      <div style="margin-left:auto;font-size:22px">›</div>
    </div>
  </div>`;

  html += '<div class="btn" onclick="navigate(\'create\')" style="margin-top:12px">+ Crea una nuova attività</div>';
  document.getElementById('content').innerHTML = html;
}

function drawMyEvents() {
  let html = '<div style="max-width:700px;margin:0 auto;">';
  html += '<div style="font-size:14px;color:#888;margin-bottom:16px">Gli eventi che hai creato o a cui partecipi</div>';
  if (!events.length) {
    html += '<div style="text-align:center;color:#aaa;padding:40px">Nessun evento ancora.</div>';
  } else {
    html += '<div class="events-grid">';
    events.slice(0, 6).forEach(e => {
      html += `<div class="card" onclick="navigate('eventDetail',${e.id})" style="cursor:pointer">
        <div style="display:flex;gap:12px;align-items:center">
          <div style="font-size:36px">${e.emoji || '🎉'}</div>
          <div style="flex:1">
            <div class="card-title">${e.title}</div>
            <div class="card-meta">📍 ${e.location || ''}</div>
          </div>
        </div>
      </div>`;
    });
    html += '</div>';
  }
  html += '</div>';
  document.getElementById('content').innerHTML = html;
}
