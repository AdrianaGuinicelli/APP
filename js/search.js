function drawSearch() {
  let html = `<div class="search-bar">
    <span>🔍</span>
    <input id="searchInput" placeholder="Cerca eventi..." oninput="filterEvents()">
  </div>`;

  html += userLocation
    ? `<div style="background:#f0eeff;border-radius:12px;padding:9px 14px;font-size:13px;color:#6c5ce7;margin-bottom:12px;display:flex;align-items:center;gap:8px">
        <span>📍</span><span>Posizione rilevata</span>
        <span style="margin-left:auto;cursor:pointer;color:#aaa" onclick="userLocation=null;drawSearch()">✕</span>
       </div>`
    : `<div style="background:#fff3e0;border-radius:12px;padding:9px 14px;font-size:13px;color:#e65100;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:8px" onclick="enableGeo()">
        <span>📍</span><span>Attiva posizione per distanze</span>
       </div>`;

  html += `<div style="font-size:12px;font-weight:700;color:#aaa;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Categoria</div>`;
  html += '<div class="filters" id="catFilters">'
    + ['Tutti','Musica','Arte','Sport','Trekking','Food','Cinema','Teatro','Viaggi'].map(c =>
        `<div class="filter-chip ${(!activeFilters.category && c === 'Tutti') || activeFilters.category === c ? 'active' : ''}"
          onclick="setCatFilter('${c === 'Tutti' ? '' : c}',this)">${c}</div>`
      ).join('') + '</div>';

  html += `<div style="font-size:12px;font-weight:700;color:#aaa;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Evento aperto a</div>`;
  html += '<div class="filters" id="genderFilters">'
    + [['','Tutti'],['m','Solo uomini'],['f','Solo donne'],['mf','Misto']].map(([v, l]) =>
        `<div class="filter-chip ${activeFilters.gender === v ? 'active' : ''}" onclick="setGenderFilter('${v}',this)">${l}</div>`
      ).join('') + '</div>';

  html += `<div style="font-size:12px;font-weight:700;color:#aaa;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Organizzatore</div>`;
  html += '<div class="filters" id="orgGenderFilters">'
    + [['','Tutti'],['m','👨 Uomo'],['f','👩 Donna']].map(([v, l]) =>
        `<div class="filter-chip ${activeFilters.organizerGender === v ? 'active' : ''}" onclick="setOrgGenderFilter('${v}',this)">${l}</div>`
      ).join('') + '</div>';

  html += `<div class="form-row" style="margin-bottom:10px">
    <div class="autocomplete-wrap">
      <input id="citySearchInput" placeholder="📍 Città..." oninput="filterEvents()" autocomplete="off" style="margin-top:0">
      <div class="autocomplete-list" id="citySearchList" style="display:none"></div>
    </div>
    <input id="dateSearchInput" type="date" onchange="filterEvents()" style="margin-top:0">
  </div>`;

  if (userLocation) {
    html += `<div style="background:#fff;border-radius:14px;padding:12px;margin-bottom:12px;box-shadow:0 1px 8px rgba(0,0,0,.06)">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;font-weight:700">📍 Distanza max</span>
        <span id="distVal" style="font-size:13px;color:#6c5ce7;font-weight:700">${activeFilters.maxDistance >= 200 ? 'Tutte' : activeFilters.maxDistance + ' km'}</span>
      </div>
      <input type="range" id="distSlider" min="0" max="200" step="5" value="${activeFilters.maxDistance}"
        oninput="onDistSlider(this.value)" style="width:100%;accent-color:#6c5ce7;margin:0">
    </div>`;
  }

  html += `<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
    <span style="font-size:13px;color:#888;white-space:nowrap">Ordina:</span>
    <select id="sortSel" onchange="filterEvents()" style="margin-top:0;flex:1">
      <option value="default">Rilevanza</option>
      ${userLocation ? '<option value="distance">📍 Distanza</option>' : ''}
      <option value="price">💰 Prezzo</option>
    </select>
  </div>`;

  html += '<div id="searchResults" class="events-grid"></div>';
  document.getElementById('content').innerHTML = html;

  setupGeoAutocomplete('citySearchInput', 'citySearchList', item => {
    document.getElementById('citySearchInput').value =
      item.address?.city || item.display_name.split(',')[0];
    filterEvents();
  });
  filterEvents();
}

function setCatFilter(cat, el) {
  activeFilters.category = cat;
  document.querySelectorAll('#catFilters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterEvents();
}
function setGenderFilter(g, el) {
  activeFilters.gender = g;
  document.querySelectorAll('#genderFilters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterEvents();
}
function setOrgGenderFilter(g, el) {
  activeFilters.organizerGender = g;
  document.querySelectorAll('#orgGenderFilters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterEvents();
}
function onDistSlider(val) {
  activeFilters.maxDistance = parseInt(val);
  const el = document.getElementById('distVal');
  if (el) el.textContent = val >= 200 ? 'Tutte' : val + ' km';
  filterEvents();
}
function enableGeo() {
  navigator.geolocation.getCurrentPosition(
    p => { userLocation = { lat: p.coords.latitude, lng: p.coords.longitude }; drawSearch(); },
    () => toast('❌ Posizione non disponibile')
  );
}

function filterEvents() {
  const q    = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const city = (document.getElementById('citySearchInput')?.value || '').toLowerCase();
  const sort = document.getElementById('sortSel')?.value || 'default';

  let filtered = events.filter(e => {
    const mQ   = !q    || e.title.toLowerCase().includes(q) || (e.category||'').toLowerCase().includes(q) || (e.description||'').toLowerCase().includes(q);
    const mC   = !city || (e.location||'').toLowerCase().includes(city);
    const mCat = !activeFilters.category || e.category === activeFilters.category;
    let mD = true;
    if (userLocation && e.latitude && activeFilters.maxDistance < 200)
      mD = parseFloat(haversine(userLocation.lat, userLocation.lng, e.latitude, e.longitude)) <= activeFilters.maxDistance;
    let mG = true;
    if (activeFilters.gender && e.gender_preference)
      mG = e.gender_preference === '' || e.gender_preference === activeFilters.gender || e.gender_preference === 'mf';
    let mOG = true;
    if (activeFilters.organizerGender && e.organizer_gender)
      mOG = e.organizer_gender === activeFilters.organizerGender;
    return mQ && mC && mCat && mD && mG && mOG;
  });

  if (sort === 'distance' && userLocation)
    filtered.sort((a, b) =>
      parseFloat(haversine(userLocation.lat, userLocation.lng, a.latitude, a.longitude)) -
      parseFloat(haversine(userLocation.lat, userLocation.lng, b.latitude, b.longitude)));
  else if (sort === 'price')
    filtered.sort((a, b) => a.price - b.price);

  let html = '';
  if (!filtered.length) html = '<div style="text-align:center;color:#aaa;padding:40px;grid-column:1/-1">Nessun evento trovato</div>';
  filtered.forEach(e => {
    const dl = distLabel(e);
    const gpLabel = { m:'👨 Solo uomini', f:'👩 Solo donne', mf:'👫 Misto', '':'' }[e.gender_preference || ''] || '';
    html += `<div class="card" style="cursor:pointer" onclick="navigate('eventDetail',${e.id})">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="font-size:40px">${e.emoji || '🎉'}</div>
        <div style="flex:1">
          <span class="card-tag tag-${(e.category||'altro').toLowerCase()}">${e.category || 'Altro'}</span>
          ${gpLabel ? `<span class="card-tag" style="background:#e8f4fd;color:#1565c0">${gpLabel}</span>` : ''}
          <div class="card-title">${e.title}</div>
          <div class="card-meta">📍 ${e.location || ''}
            ${dl ? `<span style="background:#f0eeff;color:#6c5ce7;border-radius:8px;padding:1px 6px;font-size:11px;font-weight:700">📍 ${dl}</span>` : ''}
          </div>
          ${e.price === 0
            ? '<div class="card-meta" style="color:#00b894">✅ Gratuito</div>'
            : `<div class="card-meta" style="color:#e67e22">💰 €${e.price}</div>`}
        </div>
      </div>
    </div>`;
  });
  document.getElementById('searchResults').innerHTML = html;
}
