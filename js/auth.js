// Login, register, logout, onboarding

function drawLogin() {
  document.getElementById('content').innerHTML = `
    <div style="max-width:480px;margin:0 auto;">
      <div style="text-align:center;padding:30px 0 20px">
        <div style="font-size:64px">🎉</div>
        <h2 style="font-size:24px;font-weight:800;margin:10px 0 6px">EventConnect</h2>
        <p style="color:#888;font-size:14px">Condividi Esperienze, Crea Connessioni</p>
      </div>
      ${pendingEmailVerify
        ? `<div class="verify-banner">📧 Controlla la tua email e clicca il link di conferma.</div>`
        : ''}
      <label>Email</label>
      <input id="loginEmail" type="email" placeholder="tua@email.com">
      <label>Password</label>
      <input id="loginPwd" type="password" placeholder="••••••••">
      <div class="btn" onclick="doLogin()" style="margin-top:20px">Accedi</div>
      <div class="btn secondary" onclick="navigate('register')" style="margin-top:8px">Non hai un account? Registrati</div>
      <div style="text-align:center;margin:16px 0;color:#aaa;font-size:13px">oppure</div>
      <div class="btn outline" onclick="googleLogin()">🔑 Continua con Google</div>
      <div style="text-align:center;margin-top:16px">
        <small style="color:#6c5ce7;cursor:pointer" onclick="adminLogin()">🔐 Accesso Admin (demo)</small>
      </div>
    </div>`;
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPwd').value;
  if (!email || !pwd)          { toast('⚠️ Inserisci email e password'); return; }
  if (!isValidEmail(email))    { toast('⚠️ Email non valida'); return; }
  toast('⏳ Accesso in corso...');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
  if (error) { toast('❌ ' + error.message); return; }
  if (!data.user.email_confirmed_at) {
    pendingEmailVerify = true;
    toast('⚠️ Verifica la tua email prima di accedere.');
    drawLogin();
    return;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  currentUser = { ...(profile || {}), id: data.user.id };
  isLoggedIn  = true;
  pendingEmailVerify = false;

  const { data: ui } = await supabase.from('user_interests').select('interests(name)').eq('user_id', data.user.id);
  userInterests = (ui || []).map(x => x.interests?.name).filter(Boolean);
  currentUser.interests = userInterests;

  await loadEvents();
  toast('✅ Benvenuto!');
  navigate('home');
}

async function googleLogin() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) toast('❌ ' + error.message);
}

function adminLogin() {
  currentUser = { id: 'admin', name: 'Admin', admin: true, emoji: '🔐', interests: [], photo_url: null };
  isLoggedIn  = true;
  isAdmin     = true;
  navigate('admin');
}

async function doLogout() {
  await supabase.auth.signOut();

  isLoggedIn = false;
  isAdmin = false;
  currentUser = null;
  userInterests = [];
  events = [];
  savedEvents = [];
  currentPage = '';

  const headerRight = document.getElementById('headerRight');
  if (headerRight) headerRight.innerHTML = '';

  const navbar = document.getElementById('navbar');
  if (navbar) navbar.style.display = 'none';

  document.getElementById('splash').style.display = 'none';
  document.getElementById('appShell').style.display = 'flex';

  navigate('login');
}

// ── REGISTER ─────────────────────────────────────────────
function drawRegister() {
  document.getElementById('content').innerHTML = `
    <div style="max-width:600px;margin:0 auto;">
     <div class="form-row">
  <div>
    <label>Nome *</label>
    <input id="regFirstName" placeholder="Il tuo nome">
  </div>
  <div>
    <label>Cognome *</label>
    <input id="regLastName" placeholder="Il tuo cognome">
  </div>
</div>
      <label>Email *</label>
      <input id="regEmail" type="email" placeholder="tua@email.com" oninput="checkRegEmail()">
      <div id="emailCheck" style="font-size:12px;margin-top:4px;color:#aaa"></div>
      <label>Password *</label>
      <input id="regPwd" type="password" placeholder="Almeno 8 caratteri" oninput="updatePwdStrength()">
      <div id="pwdStrength"></div>
      <label>Conferma Password *</label>
      <input id="regPwd2" type="password" placeholder="Ripeti la password" oninput="checkPwdMatch()">
      <div id="pwdMatch" style="font-size:12px;margin-top:4px;color:#aaa"></div>
      <div class="form-row">
        <div><label>Data di nascita *</label><input id="regBirth" type="date"></div>
        <div><label>Città *</label>
          <div class="autocomplete-wrap">
            <input id="regCity" placeholder="Es. Milano" autocomplete="off">
            <div class="autocomplete-list" id="regCityList" style="display:none"></div>
          </div>
        </div>
      </div>
      <label>Genere *</label>
      <div class="gender-chips">
        <div class="gender-chip" id="gc_m" onclick="selectGender('m')">👨 Uomo</div>
        <div class="gender-chip" id="gc_f" onclick="selectGender('f')">👩 Donna</div>
        <div class="gender-chip" id="gc_o" onclick="selectGender('o')">🧑 Altro</div>
      </div>
      <label>Bio (opzionale)</label>
      <textarea id="regBio" placeholder="Raccontati..." rows="2"></textarea>
      <label>Instagram (opzionale)</label>
      <input id="regIG" placeholder="@username">
      <div class="btn" onclick="doRegister()" style="margin-top:20px">Registrati</div>
      <div class="btn outline" onclick="googleLogin()" style="margin-top:8px">🔑 Google</div>
      <div class="btn secondary" onclick="navigate('login')" style="margin-top:8px">Hai già un account? Accedi</div>
    </div>`;

  setupGeoAutocomplete('regCity', 'regCityList', item => {
    document.getElementById('regCity').value =
      item.address?.city || item.address?.town || item.display_name.split(',')[0];
  });
}

function selectGender(g) {
  selectedGender = g;
  ['m', 'f', 'o'].forEach(x => document.getElementById('gc_' + x)?.classList.toggle('selected', x === g));
}
function checkRegEmail() {
  const email = document.getElementById('regEmail').value.trim();
  const el    = document.getElementById('emailCheck');
  if (!email) { el.textContent = ''; return; }
  if (isValidEmail(email)) { el.textContent = '✅ Email valida'; el.style.color = '#00b894'; }
  else                     { el.textContent = '❌ Formato non valido'; el.style.color = '#ff4757'; }
}
function updatePwdStrength() {
  const pwd = document.getElementById('regPwd').value;
  document.getElementById('pwdStrength').innerHTML = pwd ? renderPwdStrength(pwd) : '';
  checkPwdMatch();
}
function checkPwdMatch() {
  const p1 = document.getElementById('regPwd').value;
  const p2 = document.getElementById('regPwd2').value;
  const el = document.getElementById('pwdMatch');
  if (!p2) { el.textContent = ''; return; }
  if (p1 === p2) { el.textContent = '✅ Le password corrispondono'; el.style.color = '#00b894'; }
  else           { el.textContent = '❌ Le password non corrispondono'; el.style.color = '#ff4757'; }
}

async function doRegister() {
  const firstName = document.getElementById('regFirstName').value.trim();
const lastName  = document.getElementById('regLastName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pwd   = document.getElementById('regPwd').value;
  const pwd2  = document.getElementById('regPwd2').value;
  const city  = document.getElementById('regCity').value.trim();
  const birth = document.getElementById('regBirth').value;

if (!firstName || !lastName || !email || !pwd || !city || !birth) {
  toast(
    'Manca: ' +
    [
      !firstName ? 'nome' : '',
      !lastName ? 'cognome' : '',
      !email ? 'email' : '',
      !pwd ? 'password' : '',
      !city ? 'città' : '',
      !birth ? 'data nascita' : ''
    ].filter(Boolean).join(', ')
  );
  return;
}
  if (!isValidEmail(email))    { toast('⚠️ Inserisci un\'email valida'); return; }
  if (!isPasswordValid(pwd))   { toast('⚠️ La password non soddisfa i requisiti'); return; }
  if (pwd !== pwd2)            { toast('⚠️ Le password non corrispondono'); return; }
  if (!selectedGender)         { toast('⚠️ Seleziona il tuo genere'); return; }

toast('⏳ Registrazione...');

const { data, error } = await supabase.auth.signUp({
  email,
  password: pwd,
  options: { emailRedirectTo: window.location.href }
});

if (error) {
  toast('❌ ' + error.message);
  return;
}

const profileData = {
  id: data.user.id,
  first_name: firstName,
  last_name: lastName,
  name: `${firstName} ${lastName}`.trim(),
  city,
  birth_date: birth,
  bio: document.getElementById('regBio').value,
  instagram: document.getElementById('regIG').value,
  emoji: '🙂',
  completeness: 40,
  gender: selectedGender,
  max_distance: 50,
  secondary_cities: []
};

const { data: insertedProfile, error: profileError } = await supabase
  .from('profiles')
  .insert(profileData)
  .select()
  .single();

if (profileError) {
  console.log(profileError);
  alert(JSON.stringify(profileError, null, 2));
  return;
}

currentUser = {
  ...insertedProfile,
  id: data.user.id,
  interests: []
};

userInterests = [];
pendingEmailVerify = false;
isLoggedIn = true;

await loadEvents();
toast('✅ Registrazione completata!');
navigate('home');
}

// ── ONBOARDING ────────────────────────────────────────────
function drawOnboarding() {
  let html = `<div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:20px 0 16px">
      <h2 style="font-size:22px;font-weight:800">Quali sono i tuoi interessi?</h2>
      <p style="color:#888;font-size:14px;margin-top:6px">Seleziona almeno 3</p>
    </div>
    <div class="chips" id="interestChips">`;
  allInterests.forEach(i => {
    html += `<div class="chip ${userInterests.includes(i.label) ? 'selected' : ''}"
      onclick="toggleInterest('${i.label}',this)">${i.icon} ${i.label}</div>`;
  });
  html += `</div>
    <div style="margin-top:24px">
      <div class="btn" onclick="finishOnboarding()">Continua</div>
      <div class="btn secondary" style="margin-top:8px" onclick="navigate('home')">Salta per ora</div>
    </div>
  </div>`;
  document.getElementById('content').innerHTML = html;
}

function toggleInterest(label, el) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) { if (!userInterests.includes(label)) userInterests.push(label); }
  else { userInterests = userInterests.filter(i => i !== label); }
}

async function finishOnboarding() {
  if (userInterests.length < 3) { toast('⚠️ Seleziona almeno 3 interessi'); return; }
  if (currentUser?.id && currentUser.id !== 'admin') {
    await supabase.from('user_interests').delete().eq('user_id', currentUser.id);
    const { data: iRows } = await supabase.from('interests').select('id,name').in('name', userInterests);
    if (iRows?.length)
      await supabase.from('user_interests').insert(iRows.map(i => ({ user_id: currentUser.id, interest_id: i.id })));
    await supabase.from('profiles').update({ completeness: 60 }).eq('id', currentUser.id);
    currentUser.interests = userInterests;
  }
  toast('✅ Interessi salvati!');
  navigate('home');
}
