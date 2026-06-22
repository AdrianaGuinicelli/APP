// Funzioni helper riutilizzabili ovunque

// ── PASSWORD ──────────────────────────────────────────────
function validatePassword(pwd) {
  return {
    length:  pwd.length >= 8,
    upper:   /[A-Z]/.test(pwd),
    number:  /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
  };
}
function isPasswordValid(pwd) {
  const v = validatePassword(pwd);
  return v.length && v.upper && v.number && v.special;
}
function renderPwdStrength(pwd) {
  const v = validatePassword(pwd);
  return `<div class="pwd-strength">
    <div class="pwd-rule ${v.length  ? 'ok':'fail'}">${v.length  ? '✅':'❌'} Almeno 8 caratteri</div>
    <div class="pwd-rule ${v.upper   ? 'ok':'fail'}">${v.upper   ? '✅':'❌'} Almeno una lettera maiuscola</div>
    <div class="pwd-rule ${v.number  ? 'ok':'fail'}">${v.number  ? '✅':'❌'} Almeno un numero</div>
    <div class="pwd-rule ${v.special ? 'ok':'fail'}">${v.special ? '✅':'❌'} Almeno un carattere speciale (!@#$...)</div>
  </div>`;
}

// ── EMAIL ─────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── TOAST / LOADING / MODAL ───────────────────────────────
function toast(m) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function showLoading() {
  document.getElementById('content').innerHTML =
    '<div class="loading"><div class="spinner"></div><div>Caricamento...</div></div>';
}

function showModal(title, body) {
  document.getElementById('globalModal')?.remove();
  const o = document.createElement('div');
  o.className = 'modal-overlay';
  o.id = 'globalModal';
  o.innerHTML = `<div class="modal">
    <div class="modal-handle"></div>
    <div style="font-weight:700;font-size:16px;margin-bottom:14px">${title}</div>
    ${body}
    <div class="btn secondary" onclick="closeModal()" style="margin-top:12px">Chiudi</div>
  </div>`;
  o.onclick = e => { if (e.target === o) closeModal(); };
  document.body.appendChild(o);
}
function closeModal() {
  document.getElementById('globalModal')?.remove();
}

// ── GEO ───────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function distLabel(ev) {
  if (!userLocation || !ev.latitude) return null;
  const k = parseFloat(haversine(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude));
  return k < 1 ? '< 1 km' : k + ' km';
}

async function requestGeo() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p => { userLocation = { lat: p.coords.latitude, lng: p.coords.longitude }; resolve(userLocation); },
      () => resolve(null),
      { timeout: 6000 }
    );
  });
}

// ── NOMINATIM AUTOCOMPLETE ────────────────────────────────
function setupGeoAutocomplete(inputId, listId, onSelect) {
  const inp = document.getElementById(inputId);
  const lst = document.getElementById(listId);
  if (!inp || !lst) return;

  inp.addEventListener('input', () => {
    clearTimeout(geoDebounceTimer);
    const q = inp.value.trim();
    if (q.length < 3) { lst.style.display = 'none'; return; }

    geoDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&q='
          + encodeURIComponent(q) + '&limit=5&accept-language=it'
        );
        const data = await res.json();
        if (!data.length) { lst.style.display = 'none'; return; }
        lst.innerHTML = '';
        lst.style.display = 'block';
        data.forEach(item => {
          const d = document.createElement('div');
          d.className = 'autocomplete-item';
          d.textContent = item.display_name;
          d.onclick = () => { inp.value = item.display_name; lst.style.display = 'none'; if (onSelect) onSelect(item); };
          lst.appendChild(d);
        });
      } catch (e) { lst.style.display = 'none'; }
    }, 400);
  });

  document.addEventListener('click', e => { if (!inp.contains(e.target)) lst.style.display = 'none'; });
}

// ── AI REPLY ──────────────────────────────────────────────
function getAIReply(text) {
  const tx = text.toLowerCase();
  for (const r of aiRules) {
    if (r.kw.some(k => tx.includes(k))) return r;
  }
  return { reply: 'Ciao! Chiedimi eventi di musica, trekking, arte, sport o cibo 😊' };
}

// ── EVENTS LOADER ─────────────────────────────────────────
async function loadEvents() {
  const { data, error } = await supabase
    .from('events').select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (!error && data) events = data;
}
