async function drawProfile() {
  if (!isLoggedIn) { navigate('login'); return; }
  showLoading();
  const { data: user } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  if (user) currentUser = { ...currentUser, ...user };
  const { data: ui } = await supabase.from('user_interests').select('interests(name)').eq('user_id', currentUser.id);
  userInterests = (ui || []).map(x => x.interests?.name).filter(Boolean);
  currentUser.interests = userInterests;
  const { count: evCount } = await supabase.from('event_participants')
    .select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);

  const comp = currentUser.completeness || 40;
  const maxDist = currentUser.max_distance || 50;
  const secondaryCities = currentUser.secondary_cities || [];

  let html = `<div style="max-width:700px;margin:0 auto;">
    <div style="position:relative;">
      <div class="profile-cover" onclick="triggerCoverUpload()">
        ${currentUser.cover_url ? `<img src="${currentUser.cover_url}" />` : ''}
        <div class="profile-cover-edit">📷 Cambia copertina</div>
      </div>
      <input type="file" id="coverFileInput" accept="image/*" style="display:none" onchange="uploadCover(this)">
      <div class="profile-avatar-wrap">
        <div class="avatar xl" id="profileAvatar">
          ${currentUser.photo_url ? `<img src="${currentUser.photo_url}" />` : (currentUser.emoji || '👤')}
        </div>
        <div class="profile-avatar-edit" onclick="triggerPhotoUpload()">📷</div>
        <input type="file" id="photoFileInput" accept="image/*" style="display:none" onchange="uploadPhoto(this)">
      </div>
    </div>
    <div style="padding:8px 16px 0 16px;margin-top:4px">
      <div style="font-size:21px;font-weight:800">${currentUser.name || 'Utente'}</div>
      ${isPremium ? '<span class="badge" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe)">⭐ Premium</span>' : ''}
      ${currentUser.verified ? '<span class="verified-badge" style="margin-left:4px">✅ Verificato</span>' : ''}
      <div style="font-size:14px;color:#888;margin-top:4px">📍 ${currentUser.city || ''}</div>
      <div style="font-size:14px;color:#555;margin-top:6px;line-height:1.5">${currentUser.bio || 'Nessuna bio ancora'}</div>
    </div>`;

  html += `<div class="profile-stats" style="background:#fff;border-radius:14px;box-shadow:0 1px 8px rgba(0,0,0,.07);margin:14px 16px;">
    <div class="profile-stat"><div class="num">${evCount || 0}</div><div class="lbl">Eventi</div></div>
    <div class="profile-stat"><div class="num">${userInterests.length}</div><div class="lbl">Interessi</div></div>
    <div class="profile-stat"><div class="num">${currentUser.verified ? '✅' : '❌'}</div><div class="lbl">Verif.</div></div>
  </div>`;

  html += `<div style="padding:0 16px">
    <div class="card">
      <div style="font-weight:700;margin-bottom:4px">Completamento profilo <span style="color:#6c5ce7">${comp}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${comp}%"></div></div>
    </div>`;

  html += `<div style="margin:8px 0">${userInterests.map(i => `<span class="card-tag tag-${i.toLowerCase()}">${i}</span>`).join('')}</div>`;

  html += `<div class="card">
    <div style="font-weight:700;margin-bottom:12px">✏️ Modifica profilo</div>
    <label>Bio</label>
    <textarea id="editBio" rows="2" placeholder="Raccontati...">${currentUser.bio || ''}</textarea>
    <label>Città principale</label>
    <div class="autocomplete-wrap">
      <input id="editCity" value="${currentUser.city || ''}" autocomplete="off">
      <div class="autocomplete-list" id="editCityList" style="display:none"></div>
    </div>
    <label>Distanza massima dagli eventi</label>
    <div style="display:flex;justify-content:space-between;margin-top:8px">
      <span style="font-size:13px;color:#888">Distanza</span>
      <span id="editDistVal" style="color:#6c5ce7;font-weight:700">${maxDist >= 200 ? 'Qualsiasi' : maxDist + ' km'}</span>
    </div>
    <input type="range" id="editDistSlider" min="5" max="200" step="5" value="${maxDist}"
      oninput="updateEditDist(this.value)" style="width:100%;accent-color:#6c5ce7;margin-top:4px">
    <label>Città secondarie (max 2)</label>
    <div id="secondaryCitiesList">
      ${secondaryCities.map((c, i) => `
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <input value="${c}" id="secCity_${i}" style="flex:1;margin-top:0" placeholder="Città secondaria">
          <div class="btn sm danger" style="flex-shrink:0" onclick="removeSecCity(${i})">✕</div>
        </div>`).join('')}
    </div>
    ${secondaryCities.length < 2 ? '<div class="btn outline sm" style="margin-top:10px" onclick="addSecCity()">+ Aggiungi città secondaria</div>' : ''}
    <label>Interessi</label>
    <div class="chips" id="profileChips">
      ${allInterests.map(i => `<div class="chip ${userInterests.includes(i.label) ? 'selected' : ''}" onclick="toggleProfileInterest('${i.label}',this)">${i.icon} ${i.label}</div>`).join('')}
    </div>
    <div class="btn" onclick="saveProfile()" style="margin-top:14px">💾 Salva modifiche</div>
  </div>
  <div class="btn secondary" onclick="navigate('matchPeople')" style="margin-top:8px">🤝 Match persone</div>
  <div class="btn secondary" onclick="navigate('aiAssistant')" style="margin-top:8px">🤖 AI Assistant</div>
  <div class="btn secondary" onclick="navigate('settings')" style="margin-top:8px">⚙️ Impostazioni</div>
  <div class="btn danger" onclick="doLogout()" style="margin-top:8px">🚪 Esci</div>
  </div></div>`;

  document.getElementById('content').innerHTML = html;
  setupGeoAutocomplete('editCity', 'editCityList', item => {
    document.getElementById('editCity').value = item.address?.city || item.address?.town || item.display_name.split(',')[0];
  });
}

function updateEditDist(val) {
  const el = document.getElementById('editDistVal');
  if (el) el.textContent = val >= 200 ? 'Qualsiasi' : val + ' km';
}

function addSecCity() {
  const list = document.getElementById('secondaryCitiesList');
  if (!list) return;
  const count = list.querySelectorAll('input').length;
  if (count >= 2) { toast('⚠️ Massimo 2 città secondarie'); return; }
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px';
  div.innerHTML = `<input value="" id="secCity_${count}" style="flex:1;margin-top:0" placeholder="Città secondaria">
    <div class="btn sm danger" style="flex-shrink:0" onclick="this.parentElement.remove()">✕</div>`;
  list.appendChild(div);
  if (list.querySelectorAll('input').length >= 2) {
    const addBtn = document.querySelector('[onclick="addSecCity()"]');
    if (addBtn) addBtn.style.display = 'none';
  }
}
function removeSecCity(i) {
  const inp = document.getElementById('secCity_' + i);
  if (inp) inp.closest('div').remove();
  const addBtn = document.querySelector('[onclick="addSecCity()"]');
  if (addBtn) addBtn.style.display = '';
}

function triggerPhotoUpload()  { document.getElementById('photoFileInput').click(); }
function triggerCoverUpload()  { document.getElementById('coverFileInput').click(); }

async function uploadPhoto(input) {
  const file = input.files[0]; if (!file) return;
  toast('⏳ Caricamento foto...');
  const ext  = file.name.split('.').pop();
  const path = `avatars/${currentUser.id}.${ext}`;
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (upErr) { toast('❌ ' + upErr.message); return; }
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = urlData.publicUrl + '?t=' + Date.now();
  await supabase.from('profiles').update({ photo_url: url }).eq('id', currentUser.id);
  currentUser.photo_url = url;
  toast('✅ Foto profilo aggiornata!');
  renderHeaderRight();
  drawProfile();
}
async function uploadCover(input) {
  const file = input.files[0]; if (!file) return;
  toast('⏳ Caricamento copertina...');
  const ext  = file.name.split('.').pop();
  const path = `covers/${currentUser.id}.${ext}`;
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (upErr) { toast('❌ ' + upErr.message); return; }
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = urlData.publicUrl + '?t=' + Date.now();
  await supabase.from('profiles').update({ cover_url: url }).eq('id', currentUser.id);
  currentUser.cover_url = url;
  toast('✅ Foto di copertina aggiornata!');
  drawProfile();
}

function toggleProfileInterest(label, el) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) { if (!userInterests.includes(label)) userInterests.push(label); }
  else { userInterests = userInterests.filter(i => i !== label); }
}

async function saveProfile() {
  const bio     = document.getElementById('editBio')?.value || '';
  const city    = document.getElementById('editCity')?.value || '';
  const maxDist = parseInt(document.getElementById('editDistSlider')?.value) || 50;
  const secInputs = document.querySelectorAll('#secondaryCitiesList input');
  const secondaryCities = Array.from(secInputs).map(i => i.value.trim()).filter(Boolean).slice(0, 2);

  const { error } = await supabase.from('profiles').update({
    bio, city,
    completeness: Math.min(100, (currentUser.completeness || 40) + 15),
    max_distance: maxDist,
    secondary_cities: secondaryCities
  }).eq('id', currentUser.id);
  if (error) { toast('❌ ' + error.message); return; }

  await supabase.from('user_interests').delete().eq('user_id', currentUser.id);
  const { data: iRows } = await supabase.from('interests').select('id,name').in('name', userInterests);
  if (iRows?.length)
    await supabase.from('user_interests').insert(iRows.map(i => ({ user_id: currentUser.id, interest_id: i.id })));

  currentUser.bio = bio; currentUser.city = city; currentUser.interests = userInterests;
  currentUser.max_distance = maxDist; currentUser.secondary_cities = secondaryCities;
  toast('✅ Profilo aggiornato!');
  drawProfile();
}
