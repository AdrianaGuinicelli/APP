async function drawEventDetail(eventId) {
  showLoading();
  const { data: e, error } = await supabase.from('events').select('*').eq('id', eventId).single();
  if (error || !e) { toast('❌ Evento non trovato'); goBack(); return; }
  const { count: pCount } = await supabase.from('event_participants')
    .select('*', { count: 'exact', head: true }).eq('event_id', eventId);
  let isMine = false;
  if (currentUser?.id && currentUser.id !== 'admin') {
    const { data: mp } = await supabase.from('event_participants')
      .select('user_id').eq('event_id', eventId).eq('user_id', currentUser.id).single();
    isMine = !!mp;
  }
  const dl = distLabel(e);
  const isSaved = savedEvents.includes(e.id);
  const gpLabel = { m:'👨 Solo uomini', f:'👩 Solo donne', mf:'👫 Aperto a tutti', '':'👫 Aperto a tutti' }[e.gender_preference || ''];

  let html = '<div style="max-width:700px;margin:0 auto;">';
  html += `<div class="detail-hero">
    ${e.cover_url ? `<img src="${e.cover_url}" />` : ''}
    <span style="font-size:60px;${e.cover_url ? 'display:none' : ''}">${e.emoji}</span>
  </div>`;
  html += `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
    <div>
      <span class="card-tag tag-${(e.category||'altro').toLowerCase()}">${e.category || 'Altro'}</span>
      <span class="card-tag" style="background:#e8f4fd;color:#1565c0">${gpLabel}</span>
      <div class="card-title" style="font-size:20px">${e.title}</div>
    </div>
    <span style="font-size:24px;cursor:pointer" onclick="shareEvent(${e.id})">⬆️</span>
  </div>`;
  html += `<div class="detail-row"><span class="icon">📍</span>
    <div>${e.location || ''}
      ${e.address ? `<br><span style="color:#888;font-size:13px">${e.address}</span>` : ''}
      ${dl ? `<br><span style="color:#6c5ce7;font-size:12px;font-weight:700">📍 ${dl} da te</span>` : ''}
    </div>
  </div>`;
  if (e.date_time)
    html += `<div class="detail-row"><span class="icon">📅</span>${new Date(e.date_time).toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</div>`;
  html += `<div class="detail-row"><span class="icon">📝</span><div style="color:#555;line-height:1.5">${e.description || 'Nessuna descrizione'}</div></div>`;
  html += `<div class="detail-row"><span class="icon">👥</span>${pCount || 0}/${e.max_participants} partecipanti</div>`;
  html += e.price === 0
    ? `<div class="detail-row"><span class="icon">✅</span><div style="color:#00b894;font-weight:600">Gratuito</div></div>`
    : `<div class="detail-row"><span class="icon">💰</span>€${e.price} a persona</div>`;
  if (e.external_link)
    html += `<div class="detail-row"><span class="icon">🔗</span><a href="${e.external_link}" target="_blank" style="color:#6c5ce7">Sito esterno</a></div>`;

  if (isMine) {
    html += `<div class="btn green" onclick="navigate('eventGroup',${e.id})">💬 Vai al Gruppo Chat</div>`;
    html += `<div class="btn secondary" onclick="leaveEvent(${e.id})">Abbandona evento</div>`;
    html += `<div class="btn outline" onclick="navigate('feedback',${e.id})" style="margin-top:8px">⭐ Lascia feedback</div>`;
  } else {
    const full = (pCount || 0) >= e.max_participants;
    html += `<div class="btn ${full ? 'secondary' : ''}" onclick="${full ? "toast('⚠️ Evento al completo!')" : 'joinEvent(' + e.id + ')'}">
      ${full ? '🔒 Evento completo' : 'Partecipa'}
    </div>`;
    html += `<div class="btn secondary" onclick="toggleSave(${e.id})" style="margin-top:8px">🔖 ${isSaved ? 'Salvato ✓' : 'Mi interessa'}</div>`;
  }
  html += `<div style="margin-top:16px;text-align:center">
    <span style="color:#ff4757;font-size:13px;cursor:pointer" onclick="navigate('report',${e.id})">🚩 Segnala evento</span>
  </div></div>`;
  document.getElementById('content').innerHTML = html;
}

async function joinEvent(id) {
  if (!isLoggedIn) { toast('⚠️ Devi essere loggato'); navigate('login'); return; }
  const { error } = await supabase.from('event_participants').insert({ event_id: id, user_id: currentUser.id });
  if (error) { toast('❌ ' + error.message); return; }
  toast('✅ Hai aderito!');
  notifications.unshift({ id: Date.now(), text: 'Hai aderito a un evento!', time: 'ora', read: false, icon: '✅' });
  drawEventDetail(id);
}
async function leaveEvent(id) {
  const { error } = await supabase.from('event_participants').delete().eq('event_id', id).eq('user_id', currentUser.id);
  if (error) { toast('❌ ' + error.message); return; }
  toast('👋 Hai abbandonato l\'evento');
  navigate('home');
}
function shareEvent(id) {
  const e = events.find(ev => ev.id === id);
  if (navigator.share) navigator.share({ title: e?.title || 'EventConnect', text: 'Vieni a questo evento!', url: window.location.href });
  else { navigator.clipboard?.writeText(window.location.href); toast('🔗 Link copiato!'); }
}
function toggleSave(id) {
  if (savedEvents.includes(id)) { savedEvents = savedEvents.filter(i => i !== id); toast('Rimosso dai preferiti'); }
  else { savedEvents.push(id); toast('🔖 Salvato!'); }
}

// ── CREATE ────────────────────────────────────────────────────────────────────
function drawCreate() {
  if (!isLoggedIn) { toast('⚠️ Devi essere loggato'); navigate('login'); return; }

  document.getElementById('content').innerHTML = `
    <div style="max-width:700px;margin:0 auto;">
      <label>Immagine evento (opzionale)</label>
      <input id="cCover" type="file" accept="image/*">

      <label>Titolo *</label>
      <input id="cTitle" placeholder="Es. Trekking al Monte Resegone" maxlength="80">

      <label>Descrizione *</label>
      <textarea id="cDesc" placeholder="Descrivi l'esperienza..." rows="3"></textarea>

      <div class="form-row">
        <div>
          <label>Categoria *</label>
          <select id="cCat">
            <option value="">Seleziona...</option>
            <option>Musica</option><option>Arte</option><option>Sport</option>
            <option>Trekking</option><option>Food</option><option>Cinema</option>
            <option>Teatro</option><option>Viaggi</option><option>Tecnologia</option>
            <option>Benessere</option><option>Altro</option>
          </select>
        </div>
        <div>
          <label>Data e ora *</label>
          <input id="cDate" type="datetime-local">
        </div>
      </div>

      <div class="form-row">
        <div>
          <label>Città *</label>
          <div class="autocomplete-wrap">
            <input id="cCity" placeholder="Es. Milano" autocomplete="off">
            <div class="autocomplete-list" id="cCityList" style="display:none"></div>
          </div>
        </div>
        <div>
          <label>Max partecipanti *</label>
          <input id="cMax" type="number" placeholder="Es. 10" min="2" max="100">
        </div>
      </div>

      <label>Indirizzo *</label>
      <div class="autocomplete-wrap">
        <input id="cAddr" placeholder="Es. Via Borsieri 37, Milano" autocomplete="off">
        <div class="autocomplete-list" id="cAddrList" style="display:none"></div>
      </div>

      <div id="coordsOk" style="font-size:12px;color:#00b894;margin-top:4px;display:none">✅ Coordinate rilevate</div>
      <div id="cLat" style="display:none"></div>
      <div id="cLng" style="display:none"></div>

      <div class="form-row">
        <div>
          <label>Prezzo (€)</label>
          <input id="cPrice" type="number" placeholder="0" min="0" step="0.5" value="0">
        </div>
        <div>
          <label>Link esterno (opzionale)</label>
          <input id="cLink" type="url" placeholder="https://...">
        </div>
      </div>

      <label>A questo evento voglio *</label>
      <div class="gender-chips" style="margin-top:8px">
        <div class="gender-chip selected" id="cgp_mf" onclick="selectCreateGender('mf')">👫 Tutti (indifferente)</div>
        <div class="gender-chip" id="cgp_m" onclick="selectCreateGender('m')">👨 Solo uomini</div>
        <div class="gender-chip" id="cgp_f" onclick="selectCreateGender('f')">👩 Solo donne</div>
      </div>

      <input type="hidden" id="cGenderPref" value="mf">

      <div class="btn" onclick="submitCreate()" style="margin-top:20px">🎉 Crea attività</div>
      <div class="btn secondary" onclick="navigate('home')" style="margin-top:8px">Annulla</div>
    </div>`;

  setupGeoAutocomplete('cCity', 'cCityList', item => {
    document.getElementById('cCity').value = item.address?.city || item.address?.town || item.display_name.split(',')[0];
  });

  setupGeoAutocomplete('cAddr', 'cAddrList', item => {
    document.getElementById('cLat').textContent = item.lat;
    document.getElementById('cLng').textContent = item.lon;
    document.getElementById('coordsOk').style.display = 'block';
  });
}
function selectCreateGender(g) {
  document.getElementById('cGenderPref').value = g;
  ['mf','m','f'].forEach(x => document.getElementById('cgp_' + x)?.classList.toggle('selected', x === g));
}
function pickEmoji() {
  let h = '<div style="display:flex;flex-wrap:wrap;gap:12px;padding:8px;justify-content:center">';
  emojiOpts.forEach(em => { h += `<div style="font-size:34px;cursor:pointer;padding:4px" onclick="chooseEmoji('${em}')">${em}</div>`; });
  h += '</div>';
  showModal('Scegli emoji', h);
}
function chooseEmoji(em) { selectedEmoji = em; document.getElementById('emojiPick').textContent = em; closeModal(); }

async function submitCreate() {
  const title  = document.getElementById('cTitle').value.trim();
  const desc   = document.getElementById('cDesc').value.trim();
  const cat    = document.getElementById('cCat').value;
  const dateRaw = document.getElementById('cDate').value;
  const city   = document.getElementById('cCity').value.trim();
  const addr   = document.getElementById('cAddr').value.trim();
  const maxP   = parseInt(document.getElementById('cMax').value) || 10;
  const price  = parseFloat(document.getElementById('cPrice').value) || 0;
  const link   = document.getElementById('cLink').value.trim();
  const lat    = parseFloat(document.getElementById('cLat').textContent) || null;
  const lng    = parseFloat(document.getElementById('cLng').textContent) || null;
  const genderPref = document.getElementById('cGenderPref').value || 'mf';

  if (!title)    { toast('⚠️ Inserisci il titolo'); return; }
  if (!cat)      { toast('⚠️ Seleziona la categoria'); return; }
  if (!dateRaw)  { toast('⚠️ Inserisci data e ora'); return; }
  if (!city)     { toast('⚠️ Inserisci la città'); return; }
  if (!addr)     { toast('⚠️ Inserisci l\'indirizzo'); return; }
  if (maxP < 2)  { toast('⚠️ Min 2 partecipanti'); return; }
const coverFile = document.getElementById('cCover')?.files?.[0] || null;
  toast('⏳ Creazione...');
  let coverUrl = null;

if (coverFile) {
  const ext = coverFile.name.split('.').pop();
  const path = `${currentUser.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('event-covers')
    .upload(path, coverFile, { upsert: true });

  if (uploadError) {
    toast('❌ Errore immagine: ' + uploadError.message);
    return;
  }

  const { data: urlData } = supabase.storage
    .from('event-covers')
    .getPublicUrl(path);

  coverUrl = urlData.publicUrl;
}
  const { data, error } = await supabase.from('events').insert({
    creator_id: currentUser.id, title, description: desc, category: cat,
    date_time: new Date(dateRaw).toISOString(), location: city, address: addr,
    max_participants: maxP, price, emoji: selectedEmoji, latitude: lat, longitude: lng,
external_link: link || null,
cover_url: coverUrl,
status: 'active',
    gender_preference: genderPref,
    organizer_gender: currentUser.gender || 'o'
  }).select().single();
  if (error) { toast('❌ ' + error.message); return; }
  await supabase.from('event_participants').insert({ event_id: data.id, user_id: currentUser.id });
  await loadEvents();
  notifications.unshift({ id: Date.now(), text: 'Hai creato "' + title + '"', time: 'ora', read: false, icon: '🎉' });
  toast('✅ Evento creato!');
  navigate('eventDetail', data.id);
}

// ── SAVED EVENTS ──────────────────────────────────────────────────────────────
function drawSavedEvents() {
  const saved = events.filter(e => savedEvents.includes(e.id));
  let html = '<div class="section-title" style="margin-bottom:14px">I tuoi preferiti 🔖</div><div class="events-grid">';
  if (!saved.length) html += '<div style="text-align:center;color:#aaa;padding:40px;grid-column:1/-1">Nessun evento salvato.</div>';
  saved.forEach(e => {
    html += `<div class="card" onclick="navigate('eventDetail',${e.id})" style="cursor:pointer">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="font-size:36px">${e.emoji || '🎉'}</div>
        <div><div class="card-title">${e.title}</div><div class="card-meta">📍 ${e.location || ''}</div></div>
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('content').innerHTML = html;
}
