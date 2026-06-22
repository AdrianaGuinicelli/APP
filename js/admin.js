async function drawAdmin() {
  showLoading();
  const [{ count: uC }, { count: eC }, { data: reps }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*').eq('status', 'pending')
  ]);

  let html = `<div class="stat-grid">
    <div class="stat-card"><div class="stat-num">${uC || 0}</div><div class="stat-label">Utenti</div></div>
    <div class="stat-card"><div class="stat-num">${eC || 0}</div><div class="stat-label">Eventi</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#ff4757">${reps?.length || 0}</div><div class="stat-label">Segnalazioni</div></div>
  </div>`;

  html += `<div class="tabs">
    <div class="tab active" onclick="adminTab('reports',this)">🚩 Segnalazioni</div>
    <div class="tab" onclick="adminTab('users',this)">👥 Utenti</div>
    <div class="tab" onclick="adminTab('events',this)">📅 Eventi</div>
  </div>
  <div id="adminTabContent">`;

  if (!reps || !reps.length) {
    html += '<div style="text-align:center;color:#aaa;padding:30px">✅ Nessuna segnalazione pendente</div>';
  } else {
    reps.forEach(r => {
      html += `<div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-weight:700">${r.reason}</div>
            <div style="font-size:12px;color:#aaa">${new Date(r.created_at).toLocaleDateString('it-IT')}</div>
          </div>
          <span class="badge red">pending</span>
        </div>
        ${r.description ? `<div style="font-size:13px;color:#666;margin-bottom:8px">${r.description}</div>` : ''}
        <div style="display:flex;gap:8px">
          <div class="btn sm danger" onclick="adminResolve(${r.id},'resolved')">✅ Risolvi</div>
          <div class="btn sm secondary" onclick="adminResolve(${r.id},'dismissed')">Ignora</div>
        </div>
      </div>`;
    });
  }
  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

async function adminTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const c = document.getElementById('adminTabContent');
  c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  if (tab === 'reports') {
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(20);
    let h = '';
    (data || []).forEach(r => {
      h += `<div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-weight:700">${r.reason}</div>
            <div style="font-size:12px;color:#aaa">${new Date(r.created_at).toLocaleDateString('it-IT')}</div>
          </div>
          <span class="badge ${r.status === 'pending' ? 'red' : 'green'}">${r.status}</span>
        </div>
        ${r.status === 'pending'
          ? `<div style="display:flex;gap:8px">
               <div class="btn sm danger" onclick="adminResolve(${r.id},'resolved')">✅ Risolvi</div>
               <div class="btn sm secondary" onclick="adminResolve(${r.id},'dismissed')">Ignora</div>
             </div>`
          : ''}
      </div>`;
    });
    c.innerHTML = h || '<div style="text-align:center;color:#aaa;padding:30px">Nessuna segnalazione</div>';

  } else if (tab === 'users') {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20);
    let h = '<div class="events-grid">';
    (data || []).forEach(u => {
      const av = u.photo_url
        ? `<img src="${u.photo_url}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;">`
        : (u.emoji || '👤');
      h += `<div class="card">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="avatar">${av}</div>
          <div style="flex:1">
            <div style="font-weight:700">${u.name || 'Utente'}${u.verified ? ' ✅' : ''}</div>
            <div style="font-size:12px;color:#888">📍 ${u.city || ''}</div>
          </div>
          <div class="btn sm danger" onclick="toast('Presto disponibile')">🚫</div>
        </div>
      </div>`;
    });
    h += '</div>';
    c.innerHTML = h;

  } else if (tab === 'events') {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(20);
    let h = '<div class="events-grid">';
    (data || []).forEach(e => {
      h += `<div class="card">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:28px">${e.emoji || '🎉'}</span>
          <div style="flex:1">
            <div style="font-weight:700">${e.title}</div>
            <div style="font-size:12px;color:#888">${e.location || ''} • <span class="badge ${e.status === 'active' ? 'green' : 'red'}">${e.status}</span></div>
          </div>
          <div class="btn sm danger" onclick="adminRemoveEvent(${e.id})">🗑️</div>
        </div>
      </div>`;
    });
    h += '</div>';
    c.innerHTML = h;
  }
}

async function adminResolve(id, status) {
  await supabase.from('reports').update({ status }).eq('id', id);
  toast(status === 'resolved' ? '✅ Risolto' : '🗑️ Ignorato');
  drawAdmin();
}
async function adminRemoveEvent(id) {
  await supabase.from('events').update({ status: 'removed' }).eq('id', id);
  toast('🗑️ Evento rimosso');
  await loadEvents();
  drawAdmin();
}
