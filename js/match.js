async function drawMatchPeople() {
  showLoading();
  const { data: profiles } = await supabase.from('profiles').select('*').neq('id', currentUser?.id || '');
  const results = [];
  for (const u of (profiles || []).slice(0, 10)) {
    if (blockedUsers.includes(u.id)) continue;
    const { data: ui } = await supabase.from('user_interests').select('interests(name)').eq('user_id', u.id);
    const uI = (ui || []).map(x => x.interests?.name).filter(Boolean);
    const common = userInterests.filter(i => uI.includes(i));
    const total  = new Set([...userInterests, ...uI]).size;
    const pct    = Math.min(95, Math.round((common.length / Math.max(total, 1)) * 100 + 35));
    results.push({ ...u, commonInterests: common, pct });
  }
  results.sort((a, b) => b.pct - a.pct);

  let html = '<div style="font-size:14px;color:#888;margin-bottom:16px">Basato sui tuoi interessi in comune</div>';
  if (!results.length) html += '<div style="text-align:center;color:#aaa;padding:40px">Nessun utente trovato ancora</div>';
  results.forEach(u => {
    const avatarContent = u.photo_url
      ? `<img src="${u.photo_url}" />`
      : (u.emoji || '👤');
    html += `<div class="match-row">
      <div class="avatar">${avatarContent}</div>
      <div style="flex:1">
        <div style="font-weight:700">${u.name}${u.verified ? ' ✅' : ''}</div>
        <div style="font-size:12px;color:#888">📍 ${u.city || ''}</div>
        <div style="font-size:12px;color:#6c5ce7;margin:2px 0">${u.commonInterests.length} interessi in comune: ${u.commonInterests.join(', ') || 'nessuno'}</div>
        <div class="compat-bar"><div class="compat-fill" style="width:${u.pct}%"></div></div>
      </div>
      <div class="match-pct">${u.pct}%</div>
    </div>`;
  });
  document.getElementById('content').innerHTML = html;
}
