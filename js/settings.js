function drawSettings() {
  const prefs = loadNavPrefs();
  document.getElementById('content').innerHTML = `<div style="max-width:700px;margin:0 auto;" id="settingsRoot"></div>`;
  renderSettingsContent(prefs);
}

function renderSettingsContent(prefs) {
  const root = document.getElementById('settingsRoot');
  if (!root) return;

  const premHtml = `<div class="premium-card">
    <div class="premium-badge">${isPremium ? '⭐ PREMIUM ATTIVO' : '🔓 PIANO BASE'}</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:6px">${isPremium ? 'Sei Premium!' : 'Passa a Premium'}</div>
    <ul class="premium-features">
      <li>✅ Nessuna pubblicità</li>
      <li>✅ Accesso prioritario agli eventi</li>
      <li>✅ AI Assistant avanzato</li>
      <li>✅ Badge Premium sul profilo</li>
    </ul>
    ${isPremium
      ? `<button class="btn-premium active-plan">✅ Piano attivo</button>`
      : `<div style="font-size:20px;font-weight:900;text-align:center;margin:8px 0">€4,99 <span style="font-size:14px;font-weight:500;opacity:.8">/mese</span></div>
         <button class="btn-premium" onclick="activatePremium()">🚀 Attiva Premium</button>`}
  </div>`;

  // Barra in basso
  let bottomConfig = `<div class="settings-section"><h3>📱 Barra in basso</h3><div class="slots-row" id="bottomSlots">`;
  for (let i = 0; i < 5; i++) {
    const id  = prefs.bottom[i];
    const btn = id ? ALL_BUTTONS.find(b => b.id === id) : null;
    bottomConfig += btn
      ? `<div class="slot-box filled">${btn.icon}<span class="slot-remove" onclick="removeFromBottom('${btn.id}')">✕</span></div>`
      : `<div class="slot-box">＋</div>`;
  }
  bottomConfig += `</div><div style="font-size:12px;font-weight:700;color:#aaa;margin:10px 0 6px">DISPONIBILI</div><div class="btn-pool" id="bottomPool">`;
  ALL_BUTTONS.forEach(btn => {
    const inUse = prefs.bottom.includes(btn.id) || prefs.header.includes(btn.id);
    bottomConfig += `<div class="btn-pool-item${inUse ? ' in-use' : ''}" onclick="addToBottom('${btn.id}')">${btn.icon} ${btn.label}</div>`;
  });
  bottomConfig += `</div></div>`;

  // Barra in alto
  let headerConfig = `<div class="settings-section"><h3>🔝 Barra in alto a destra</h3><div class="slots-row" id="headerSlots">`;
  for (let i = 0; i < 3; i++) {
    const id  = prefs.header[i];
    const btn = id ? ALL_BUTTONS.find(b => b.id === id) : null;
    headerConfig += btn
      ? `<div class="slot-box filled">${btn.icon}<span class="slot-remove" onclick="removeFromHeader('${btn.id}')">✕</span></div>`
      : `<div class="slot-box">＋</div>`;
  }
  headerConfig += `</div><div style="font-size:12px;font-weight:700;color:#aaa;margin:10px 0 6px">DISPONIBILI</div><div class="btn-pool" id="headerPool">`;
  ALL_BUTTONS.forEach(btn => {
    const inUse = prefs.bottom.includes(btn.id) || prefs.header.includes(btn.id);
    headerConfig += `<div class="btn-pool-item${inUse ? ' in-use' : ''}" onclick="addToHeader('${btn.id}')">${btn.icon} ${btn.label}</div>`;
  });
  headerConfig += `</div></div>`;

  const notifSection = `<div class="settings-section"><h3>🔔 Notifiche</h3>
    <div class="toggle-row"><div><div class="toggle-label">Nuovi eventi consigliati</div></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
    <div class="toggle-row"><div><div class="toggle-label">Messaggi chat</div></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
  </div>`;

  const privacySection = `<div class="settings-section"><h3>🔒 Privacy</h3>
    <div class="toggle-row"><div><div class="toggle-label">Profilo pubblico</div></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
    <div class="toggle-row"><div><div class="toggle-label">Mostra distanza</div></div><label class="switch"><input type="checkbox"><span class="slider"></span></label></div>
  </div>`;

  const accountSection = `<div class="settings-section"><h3>👤 Account</h3>
    <div class="btn outline" onclick="navigate('profile')" style="margin-top:0">✏️ Modifica profilo</div>
    <div class="btn secondary" style="margin-top:8px" onclick="toast('🔑 Funzione in arrivo!')">🔑 Cambia password</div>
    <div class="btn danger" onclick="doLogout()" style="margin-top:8px">🚪 Esci</div>
  </div>`;

  root.innerHTML = premHtml + bottomConfig + headerConfig + notifSection + privacySection + accountSection;
}

function addToBottom(id) {
  const prefs = loadNavPrefs();
  if (prefs.bottom.includes(id) || prefs.header.includes(id)) { toast('⚠️ Già presente'); return; }
  if (prefs.bottom.length >= 5) { toast('⚠️ Massimo 5 pulsanti'); return; }
  prefs.bottom.push(id);
  saveNavPrefs(prefs);
  renderNavbar();
  renderSettingsContent(prefs);
}
function removeFromBottom(id) {
  const prefs = loadNavPrefs();
  prefs.bottom = prefs.bottom.filter(b => b !== id);
  saveNavPrefs(prefs);
  renderNavbar();
  renderSettingsContent(prefs);
}
function addToHeader(id) {
  const prefs = loadNavPrefs();
  if (prefs.bottom.includes(id) || prefs.header.includes(id)) { toast('⚠️ Già presente'); return; }
  if (prefs.header.length >= 3) { toast('⚠️ Massimo 3 pulsanti'); return; }
  prefs.header.push(id);
  saveNavPrefs(prefs);
  renderHeaderRight();
  renderSettingsContent(prefs);
}
function removeFromHeader(id) {
  const prefs = loadNavPrefs();
  prefs.header = prefs.header.filter(h => h !== id);
  saveNavPrefs(prefs);
  renderHeaderRight();
  renderSettingsContent(prefs);
}
function activatePremium() {
  showModal('⭐ Attiva Premium', `
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:48px;margin-bottom:10px">⭐</div>
      <div style="font-size:18px;font-weight:800;color:#6c5ce7;margin-bottom:6px">EventConnect Premium</div>
      <div style="font-size:24px;font-weight:900;margin-bottom:16px">€4,99<span style="font-size:14px;font-weight:400;color:#888">/mese</span></div>
      <div class="btn" onclick="confirmPremium()" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe)">🚀 Attiva ora</div>
    </div>`);
}
function confirmPremium() { isPremium = true; closeModal(); toast('⭐ Premium attivato!'); drawSettings(); }
