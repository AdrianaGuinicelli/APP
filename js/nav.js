// Gestione navigazione, shell header/navbar, dropdown profilo

function loadNavPrefs() {
  try {
    const b = JSON.parse(localStorage.getItem('ec_bottom') || 'null');
    const h = JSON.parse(localStorage.getItem('ec_header') || 'null');
    return { bottom: b || [...DEFAULT_BOTTOM], header: h || [...DEFAULT_HEADER] };
  } catch (e) {
    return { bottom: [...DEFAULT_BOTTOM], header: [...DEFAULT_HEADER] };
  }
}
function saveNavPrefs(prefs) {
  localStorage.setItem('ec_bottom', JSON.stringify(prefs.bottom));
  localStorage.setItem('ec_header', JSON.stringify(prefs.header));
}

function renderNavbar() {
  const prefs = loadNavPrefs();
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let html = '';
  prefs.bottom.forEach(id => {
    const btn = ALL_BUTTONS.find(b => b.id === id);
    if (!btn) return;
    const isActive = currentPage === btn.page;
    const hasNotif = btn.badge === 'notif' && notifications.some(n => !n.read);
    if (btn.isPlus) {
      html += `<div class="nav-plus-wrap" onclick="navigate('create')">
        <div class="nav-plus">${btn.icon}</div>
      </div>`;
    } else {
      html += `<div class="nav-item${isActive ? ' active' : ''}" onclick="navigate('${btn.page}')">
        <div class="nav-icon-wrap">
          <span class="nav-icon">${btn.icon}</span>
          ${hasNotif ? '<span class="nav-dot"></span>' : ''}
        </div>
      </div>`;
    }
  });
  navbar.innerHTML = html;
}

function renderHeaderRight() {
  const prefs = loadNavPrefs();
  const hr = document.getElementById('headerRight');
  if (!hr) return;
  let html = '';
  prefs.header.forEach(id => {
    const btn = ALL_BUTTONS.find(b => b.id === id);
    if (!btn) return;
    const hasNotif = btn.badge === 'notif' && notifications.some(n => !n.read);
    html += `<button class="hdr-icon-btn" onclick="navigate('${btn.page}')" title="${btn.label}">
      ${btn.icon}${hasNotif ? '<span class="hdr-badge"></span>' : ''}
    </button>`;
  });

 const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const avatarContent = currentUser?.photo_url
  ? `<img src="${currentUser.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
  : initials(currentUser);

  html += `<div class="profile-dropdown-wrap" id="profileDropWrap">
    <button class="profile-avatar-btn" onclick="toggleProfileDropdown()" id="profileAvatarBtn">${avatarContent}</button>
    <div class="profile-dropdown" id="profileDropdown">
      <div class="pd-item" onclick="closeDropdown();navigate('myevents')"><span class="pd-icon">📅</span> I miei eventi<span class="pd-badge">4</span></div>
      <div class="pd-item" onclick="closeDropdown();navigate('matchPeople')"><span class="pd-icon">🤝</span> Match persone</div>
      <div class="pd-item" onclick="closeDropdown();navigate('profile')"><span class="pd-icon">👤</span> Profilo</div>
      <div class="pd-item" onclick="closeDropdown();navigate('settings')"><span class="pd-icon">⚙️</span> Impostazioni</div>
      <div class="pd-divider"></div>
      <div class="pd-item logout" onclick="closeDropdown();doLogout()"><span class="pd-icon">🚪</span> Esci</div>
    </div>
  </div>`;
  hr.innerHTML = html;
}

function toggleProfileDropdown() {
  const d = document.getElementById('profileDropdown');
  if (!d) return;
  profileDropdownOpen = !profileDropdownOpen;
  d.classList.toggle('open', profileDropdownOpen);
}
function closeDropdown() {
  profileDropdownOpen = false;
  const d = document.getElementById('profileDropdown');
  if (d) d.classList.remove('open');
}
document.addEventListener('click', e => { if (!e.target.closest('#profileDropWrap')) closeDropdown(); });

function navigate(page, param) {
  if (page !== currentPage) navHistory.push(currentPage);
  currentPage = page;
  if (param !== undefined) currentEventId = param;
  updateShell(page);

  const map = {
    home:        drawHome,
    search:      drawSearch,
    create:      drawCreate,
    chatList:    drawChatList,
    profile:     drawProfile,
    onboarding:  drawOnboarding,
    login:       drawLogin,
    register:    drawRegister,
    eventDetail: () => drawEventDetail(currentEventId),
    eventGroup:  () => drawEventGroup(currentEventId),
    aiAssistant: drawAI,
    matchPeople: drawMatchPeople,
    feedback:    () => drawFeedback(currentEventId),
    notifications: drawNotifications,
    admin:       drawAdmin,
    report:      () => drawReport(),
    savedEvents: drawSavedEvents,
    settings:    drawSettings,
    myevents:    drawMyEvents
  };

  if (map[page]) map[page]();
  document.getElementById('content').scrollTop = 0;
  window.scrollTo(0, 0);
}

function goBack() {
  if (navHistory.length) navigate(navHistory.pop());
}

function updateShell(page) {
  const noNavPages = ['login', 'register', 'onboarding'];
  const showNav = !noNavPages.includes(page);
  document.getElementById('navbar').style.display = showNav ? 'flex' : 'none';
  if (showNav) { renderNavbar(); renderHeaderRight(); }

  const logo  = document.getElementById('headerLogo');
  const title = document.getElementById('headerTitle');
  const back  = document.getElementById('backBtn');

  const noBack = ['home','search','create','chatList','profile','login','register',
                  'onboarding','settings','myevents','aiAssistant','notifications',
                  'savedEvents','matchPeople'];
  back.style.display = noBack.includes(page) ? 'none' : 'block';

  if (page === 'home') {
    logo.classList.remove('hidden');
    title.classList.add('hidden');
  } else if (page === 'admin') {
    logo.classList.add('hidden');
    title.classList.remove('hidden');
    title.textContent = '⚙️ Admin';
  } else {
    logo.classList.add('hidden');
    title.classList.remove('hidden');
    title.textContent = PAGE_TITLES[page] || page;
  }
}

// ── INIT (window.onload) ──────────────────────────────────
window.onload = async function () {
  requestGeo();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      if (!session.user.email_confirmed_at) {
        pendingEmailVerify = true;
        document.getElementById('splash').style.display = 'none';
        document.getElementById('appShell').style.display = 'flex';
        navigate('login');
        toast('⚠️ Verifica la tua email prima di accedere');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        currentUser = { ...profile, id: session.user.id };
        isLoggedIn = true;
        const { data: ui } = await supabase.from('user_interests').select('interests(name)').eq('user_id', session.user.id);
        userInterests = (ui || []).map(x => x.interests?.name).filter(Boolean);
        currentUser.interests = userInterests;
        await loadEvents();
        document.getElementById('splash').style.display = 'none';
        document.getElementById('appShell').style.display = 'flex';
        navigate('home');
      }
    }
  } catch (e) { console.log('No session', e); }
};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('btnRegister').addEventListener('click', function () {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    navigate('register');
  });
  document.getElementById('btnLogin').addEventListener('click', function () {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    navigate('login');
  });
  document.getElementById('btnAdmin').addEventListener('click', function () {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    adminLogin();
  });
});
