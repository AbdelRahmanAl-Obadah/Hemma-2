// ============================================================
//  HIMMAH - app.js (Full Version with Admin Full Control)
//  Firebase 9 (compat SDK via CDN)
//  Includes: Auth, Firestore, Admin edit/delete for all data
// ============================================================

// ── Firebase Config ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD3dzO89_3zr4CbJsAaZKi7To53WYcQyzA",
  authDomain: "himmah-jordan.firebaseapp.com",
  projectId: "himmah-jordan",
  storageBucket: "himmah-jordan.firebasestorage.app",
  messagingSenderId: "478620266581",
  appId: "1:478620266581:web:827205bb85b493ca7864dc"
};

// ── Init ─────────────────────────────────────────────────────
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ── State ─────────────────────────────────────────────────────
let currentUser   = null;   // Firebase Auth user
let currentProfile = null;  // Firestore profile doc

// ── Auth Observer ─────────────────────────────────────────────
auth.onAuthStateChanged(async (fbUser) => {
  if (fbUser) {
    const snap = await db.collection('users').doc(fbUser.uid).get();
    if (snap.exists) {
      currentProfile = { id: snap.id, ...snap.data() };
      currentUser = fbUser;
    }
  } else {
    currentUser = null;
    currentProfile = null;
  }
  renderHeader();
  if (typeof onPageLoad === 'function') onPageLoad();
});

// ── Header Render ─────────────────────────────────────────────
function renderHeader() {
  const authArea = document.getElementById('header-auth');
  if (!authArea) return;

  if (currentProfile) {
    const initial = currentProfile.username ? currentProfile.username[0].toUpperCase() : '؟';
    const isAdmin = currentProfile.role === 'hero_admin';
    authArea.innerHTML = `
      <div class="dropdown-wrapper">
        <button class="avatar-btn" onclick="toggleDropdown()">${initial}</button>
        <div class="dropdown-menu" id="user-dropdown">
          <div style="padding:12px 16px; border-bottom:1px solid var(--border);">
            <div style="font-weight:700;font-size:0.9rem">${currentProfile.username}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">${currentProfile.points ?? 0} نقطة</div>
          </div>
          
          <a href="dashboard.html">لوحة التحكم</a>
          <a href="${getProfileUrl(currentProfile.id, currentProfile.username)}">ملفي الشخصي</a>
          ${isAdmin ? '<a href="admin.html">لوحة الأدمن</a>' : ''}
          <div class="dropdown-divider"></div>
          <button class="danger" onclick="signOut()">تسجيل الخروج</button>
        </div>
      </div>`;
  } else {
    authArea.innerHTML = `
      <a href="signin.html" class="btn btn-secondary btn-sm">تسجيل الدخول</a>
      <a href="signup.html" class="btn btn-primary btn-sm">إنشاء حساب</a>`;
  }
}

function toggleDropdown() {
  document.getElementById('user-dropdown')?.classList.toggle('open');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown-wrapper')) {
    document.getElementById('user-dropdown')?.classList.remove('open');
  }
});

// ── Sign Out ──────────────────────────────────────────────────
async function signOut() {
  await auth.signOut();
  window.location.href = 'index.html';
}

// ── Theme Toggle ──────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('himmah-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('himmah-theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? 'فاتح' : 'داكن';
}
initTheme();

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.animation = 'fadeOut 0.4s forwards'; setTimeout(() => t.remove(), 400); }, 3500);
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function ensureAuthPromptModal() {
  let modal = document.getElementById('auth-required-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'auth-required-modal';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-title" id="auth-required-title">هذه الخدمة تحتاج حساب</div>
      <div class="modal-subtitle" id="auth-required-message">سجّل دخولك أو أنشئ حساباً جديداً حتى نكمل لك هذه الخطوة.</div>
      <div class="modal-actions" style="justify-content:flex-start">
        <a href="signin.html" class="btn btn-primary">تسجيل الدخول</a>
        <a href="signup.html" class="btn btn-secondary">إنشاء حساب</a>
        <button type="button" class="btn btn-secondary" onclick="closeModal('auth-required-modal')">لاحقاً</button>
      </div>
    </div>`;

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal('auth-required-modal');
  });

  document.body.appendChild(modal);
  return modal;
}

function promptAuthRequired({
  title = 'هذه الخدمة تحتاج حساب',
  message = 'سجّل دخولك أو أنشئ حساباً جديداً حتى نكمل لك هذه الخطوة.'
} = {}) {
  const modal = ensureAuthPromptModal();
  const titleEl = document.getElementById('auth-required-title');
  const messageEl = document.getElementById('auth-required-message');
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  openModal('auth-required-modal');
  return modal;
}

// ── Helpers ──────────────────────────────────────────────────
function calcAge(birthdate) {
  const [y, m, d] = birthdate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

function toEnglishDigits(value = '') {
  const eastern = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return String(value).replace(/[٠-٩۰-۹]/g, digit => {
    const easternIndex = eastern.indexOf(digit);
    return easternIndex >= 0 ? String(easternIndex) : String(persian.indexOf(digit));
  });
}

function cleanPhoneInput(value = '') {
  let cleaned = toEnglishDigits(value).replace(/[^\d+]/g, '');
  if (cleaned.includes('+')) {
    cleaned = `+${cleaned.replace(/\+/g, '')}`;
  }
  return cleaned;
}

const PHONE_COUNTRIES = [
  { code: '+962', name: 'الأردن', placeholder: '79XXXXXXX', localPattern: /^0?7[789]\d{7}$/ },
  { code: '+966', name: 'السعودية', placeholder: '5XXXXXXXX', localPattern: /^0?5\d{8}$/ },
  { code: '+971', name: 'الإمارات', placeholder: '5XXXXXXXX', localPattern: /^0?5\d{8}$/ },
  { code: '+965', name: 'الكويت', placeholder: 'XXXXXXXX', localPattern: /^[569]\d{7}$/ },
  { code: '+974', name: 'قطر', placeholder: 'XXXXXXXX', localPattern: /^[3567]\d{7}$/ },
  { code: '+973', name: 'البحرين', placeholder: 'XXXXXXXX', localPattern: /^[36]\d{7}$/ },
  { code: '+968', name: 'عُمان', placeholder: 'XXXXXXXX', localPattern: /^[79]\d{7}$/ },
  { code: '+20',  name: 'مصر', placeholder: '1XXXXXXXXX', localPattern: /^0?1[0125]\d{8}$/ },
];

function getPhoneCountry(code = '+962') {
  return PHONE_COUNTRIES.find(country => country.code === code) || PHONE_COUNTRIES[0];
}

function getPhoneCountryFromValue(value = '') {
  const phone = cleanPhoneInput(value);
  const normalized = phone.startsWith('00') ? `+${phone.slice(2)}` : phone;
  return PHONE_COUNTRIES.find(country => normalized.startsWith(country.code));
}

function normalizeSupportedPhone(value = '', selectedCode = '+962') {
  let phone = cleanPhoneInput(value);
  if (!phone) return '';
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;

  const country = getPhoneCountryFromValue(phone) || getPhoneCountry(selectedCode);
  let local = phone.startsWith(country.code) ? phone.slice(country.code.length) : phone;
  local = local.replace(/\D/g, '');
  if (local.startsWith('0')) local = local.slice(1);

  if (!country.localPattern.test(local) && !country.localPattern.test(`0${local}`)) return '';
  return `${country.code}${local}`;
}

function normalizeJordanPhone(value = '') {
  return normalizeSupportedPhone(value, '+962');
}

function isJordanPhone(value) {
  return Boolean(normalizeSupportedPhone(value));
}

function setupJordanPhoneInput(input, countrySelect = null) {
  if (!input) return;
  if (input.dataset.jordanPhoneReady === 'true') return;
  input.dataset.jordanPhoneReady = 'true';

  const syncHint = () => {
    if (!countrySelect) {
    input.placeholder = '+96279XXXXXXX';
      input.title = 'اكتب الرقم بصيغة دولية مدعومة';
      return;
    }
    const country = getPhoneCountry(countrySelect?.value || '+962');
    input.placeholder = country.placeholder;
    input.title = 'أدخل الرقم المحلي بدون ترميز الدولة';
  };

  input.addEventListener('input', () => {
    input.value = countrySelect
      ? toEnglishDigits(input.value).replace(/\D/g, '').slice(0, 11)
      : cleanPhoneInput(input.value).slice(0, 15);
    input.setCustomValidity(input.value && !normalizeSupportedPhone(input.value, countrySelect?.value || '+962') ? 'أدخل رقم هاتف صحيح للدولة المختارة' : '');
  });
  input.addEventListener('blur', () => {
    const normalized = normalizeSupportedPhone(input.value, countrySelect?.value || '+962');
    if (normalized && !countrySelect) input.value = normalized;
    input.setCustomValidity(input.value && !normalized ? 'أدخل رقم هاتف صحيح للدولة المختارة' : '');
  });

  countrySelect?.addEventListener('change', () => {
    syncHint();
    input.dispatchEvent(new Event('input'));
  });
  syncHint();
}

function getPasswordRuleStatus(password = '') {
  const status = {
    length: password.length >= 8,
    letter: /\p{L}/u.test(password),
    number: /\d/.test(password),
    symbol: /[^\p{L}\d\s]/u.test(password),
  };
  status.valid = Object.values(status).every(Boolean);
  return status;
}

function getPasswordRulesMessage() {
  return 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف، رقم، ورمز خاص';
}

function updatePasswordRules(password) {
  const status = getPasswordRuleStatus(password);
  document.querySelectorAll('.password-rule[data-rule]').forEach(rule => {
    rule.classList.toggle('valid', Boolean(status[rule.dataset.rule]));
  });
}

function initSignupFormEnhancements() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  setupJordanPhoneInput(form.phone, form.phoneCode);
  updatePasswordRules(form.password?.value || '');
  if (form.password && form.password.dataset.passwordRulesReady !== 'true') {
    form.password.dataset.passwordRulesReady = 'true';
    form.password.addEventListener('input', () => updatePasswordRules(form.password.value));
  }
}

async function rememberPasswordCredential(username, password) {
  if (!window.PasswordCredential || !navigator.credentials) return;
  try {
    const credential = new PasswordCredential({ id: username, name: username, password });
    await navigator.credentials.store(credential);
  } catch (_) {
    // Browsers that do not support this still rely on autocomplete hints.
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'م' : 'ص';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function initiativeIsFull(initiative, joinedCount) {
  return joinedCount >= initiative.maxParticipants;
}

function timesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

function getEndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dt = new Date(`${dateStr}T${timeStr}`);
  dt.setHours(dt.getHours() + 2);
  return dt;
}

function getStartTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  return new Date(`${dateStr}T${timeStr}`);
}

function isInitiativeCancelled(initiative, participantCount = initiative?.count || 0) {
  if (!initiative) return false;
  if (initiative.status === 'cancelled') return true;
  if (!initiative.date || !initiative.time || !initiative.minParticipants) return false;
  const startsAt = getStartTime(initiative.date, initiative.time);
  if (!startsAt) return false;
  const cancelThreshold = new Date(startsAt.getTime() - (60 * 60 * 1000));
  return new Date() >= cancelThreshold && participantCount < Number(initiative.minParticipants);
}

async function maybePersistCancelledInitiative(id, initiative, participantCount) {
  if (!id || !initiative || initiative.status === 'cancelled') return;
  if (!isInitiativeCancelled(initiative, participantCount)) return;
  try {
    await db.collection('initiatives').doc(id).update({ status: 'cancelled' });
  } catch (err) {
    console.warn('Could not persist cancelled initiative', err);
  }
}

function requireAuth(redirectUrl = 'signin.html') {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (fbUser) => {
      if (!fbUser) { window.location.href = redirectUrl; return; }
      const snap = await db.collection('users').doc(fbUser.uid).get();
      if (!snap.exists || snap.data().status === 'frozen') {
        await auth.signOut();
        window.location.href = redirectUrl;
        return;
      }
      resolve({ id: snap.id, ...snap.data() });
    });
  });
}

function requireAdmin() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (fbUser) => {
      if (!fbUser) { window.location.href = 'signin.html'; return; }
      const snap = await db.collection('users').doc(fbUser.uid).get();
      if (!snap.exists || snap.data().role !== 'hero_admin') {
        window.location.href = 'index.html'; return;
      }
      resolve({ id: snap.id, ...snap.data() });
    });
  });
}

function toggleMobileNav() {
  document.getElementById('mobile-nav')?.classList.toggle('open');
}

// ──────────────────────────────────────────────────────────────
// PAGE: index.html (Home)
// ──────────────────────────────────────────────────────────────
let homeMap = null;
let homeMapMarkers = [];
let homeInitiatives = [];
let homeFiltersBound = false;

const FALLBACK_INITIATIVE_CITIES = ['عمان', 'إربد', 'الزرقاء', 'العقبة', 'السلط', 'مادبا', 'الكرك', 'الطفيلة', 'معان', 'جرش', 'عجلون', 'المفرق'];

function buildFallbackInitiatives(count = 30) {
  const cities = FALLBACK_INITIATIVE_CITIES;
  const genders = ['الكل', 'ذكر', 'أنثى'];
  const initiatives = [];

  for (let i = 1; i <= count; i += 1) {
    const city = cities[(i - 1) % cities.length];
    const day = String(((i - 1) % 27) + 1).padStart(2, '0');
    const month = String(((i - 1) % 12) + 1).padStart(2, '0');
    initiatives.push({
      id: `fallback-init-${i}`,
      name: `مبادرة تطوعية ${i}`,
      description: `مبادرة مجتمعية رقم ${i} في ${city} تهدف إلى دعم المشاركة الشبابية وتنظيم العمل التطوعي بطريقة واضحة ومباشرة.`,
      city,
      date: `2026-${month}-${day}`,
      time: `${String(8 + (i % 8)).padStart(2, '0')}:00`,
      gender: genders[i % genders.length],
      maxParticipants: 12 + (i % 10),
      count: 4 + (i % 8),
      creatorPhone: `+96279${String(100000 + i * 17).slice(-7)}`,
      full: false
    });
  }

  return initiatives;
}

function buildFallbackRewards(count = 20) {
  const brands = [
    'Zain Jordan',
    'Umniah',
    'Orange Jordan',
    'Carrefour Jordan',
    'Talabat',
    'Hijazi',
    'Cozmo',
    'Jordanian Rail Pass',
    'Happy Café',
    'Bookstore Jordan',
  ];

  const rewards = [];
  for (let i = 1; i <= count; i += 1) {
    const brand = brands[(i - 1) % brands.length];
    rewards.push({
      id: `fallback-reward-${i}`,
      title: `${brand} - مكافأة ${i}`,
      description: `مكافأة وهمية ${i} مخصصة لتجربة العرض فقط، ويمكن استبدالها لاحقاً ببيانات الشركاء الحقيقية.`,
      pointsCost: 80 + (i * 15),
      imageUrl: '',
      image_url: '',
    });
  }
  return rewards;
}

async function initHomePage() {
  const featuredContainer = document.getElementById('featured-initiatives');
  if (!featuredContainer) return;

  try {
    const [usersResult, initResult, participationsResult, rewardsResult] = await Promise.allSettled([
      db.collection('users').get(),
      loadPublicInitiatives(),
      loadPublicParticipations(),
      db.collection('rewards').get()
    ]);

    if (initResult.status === 'rejected') throw initResult.reason;

    const usersSnap = usersResult.status === 'fulfilled' ? usersResult.value : null;
    const initiatives = initResult.value;
    const participations = participationsResult.status === 'fulfilled' ? participationsResult.value : [];
    const rewards = rewardsResult.status === 'fulfilled'
      ? rewardsResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      : [];

    const participationCounts = participations.reduce((acc, row) => {
      const initiativeId = row.initiativeId;
      acc[initiativeId] = (acc[initiativeId] || 0) + 1;
      return acc;
    }, {});

    const initiativesWithCreators = await enrichInitiativesWithCreators(initiatives, usersSnap);
    homeInitiatives = initiativesWithCreators.map(init => {
      const count = participationCounts[init.id] || 0;
      const capacity = Number(init.maxParticipants) || 0;
      return {
        ...init,
        count,
        full: capacity > 0 ? count >= capacity : false
      };
    });

    const citiesMap = homeInitiatives.reduce((acc, item) => {
      if (!item.city) return acc;
      acc.set(item.city, (acc.get(item.city) || 0) + 1);
      return acc;
    }, new Map());
    const cityEntries = [...citiesMap.entries()].sort((a, b) => b[1] - a[1]);
    const topCity = cityEntries[0]?.[0] || '--';
    const openSpots = homeInitiatives.filter(item => !item.full).length;

    setTextContent('stat-users', usersSnap?.size ?? 0);
    setTextContent('stat-initiatives', homeInitiatives.length);
    setTextContent('stat-cities', citiesMap.size);
    setTextContent('stat-participations', participations.length);
    setTextContent('hero-stat-users', usersSnap?.size ?? 0);
    setTextContent('hero-stat-initiatives', homeInitiatives.length);
    setTextContent('hero-stat-cities', citiesMap.size);
    setTextContent('hero-top-city', topCity);
    setTextContent('hero-open-spots', openSpots);
    setTextContent('hero-live-status', 'Firebase جاهز');

    renderHomeActivityFeed(homeInitiatives);
    populateHomeCityFilter(cityEntries.map(([city]) => city));
    renderHomeResults(homeInitiatives);
    renderFeaturedInitiatives(homeInitiatives);
    renderHomeRewards(rewards.length ? rewards : buildFallbackRewards());
    updateHomeSuggestion(topCity, openSpots);
    initHomeMap(homeInitiatives);

    if (!homeFiltersBound) {
      document.getElementById('home-filter-search')?.addEventListener('input', applyHomeFilters);
      document.getElementById('home-filter-city')?.addEventListener('change', applyHomeFilters);
      document.getElementById('home-filter-gender')?.addEventListener('change', applyHomeFilters);
      homeFiltersBound = true;
    }
  } catch (err) {
    console.error('initHomePage failed', err);
    setTextContent('hero-live-status', 'تعذر التحديث');
    featuredContainer.innerHTML = `<div class="featured-card-home"><div class="featured-head"><h3>تعذر تحميل الصفحة</h3><span class="featured-badge">Offline</span></div><p>لم نتمكن من قراءة بيانات المبادرات حالياً. حاول مرة أخرى بعد قليل.</p></div>`;
    homeInitiatives = buildFallbackInitiatives();
    const fallbackCitiesMap = homeInitiatives.reduce((acc, item) => {
      if (!item.city) return acc;
      acc.set(item.city, (acc.get(item.city) || 0) + 1);
      return acc;
    }, new Map());
    const fallbackCityEntries = [...fallbackCitiesMap.entries()].sort((a, b) => b[1] - a[1]);
    const fallbackTopCity = fallbackCityEntries[0]?.[0] || '--';
    renderHomeResults(homeInitiatives);
    renderFeaturedInitiatives(homeInitiatives);
    renderHomeRewards(buildFallbackRewards());
    updateHomeSuggestion(fallbackTopCity, homeInitiatives.filter(item => !item.full).length);
    initHomeMap(homeInitiatives);
  }
}

async function loadPublicInitiatives() {
  try {
    const snap = await db.collection('initiatives').where('status','==','approved').get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (rows.length) return rows;
  } catch (err) {
    console.warn('Approved initiatives query failed, falling back to collection read', err);
  }

  const snap = await db.collection('initiatives').get();
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(row => !row.status || row.status === 'approved');
}

async function loadPublicParticipations() {
  try {
    const snap = await db.collection('participations').where('status','in',['joined','attended']).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    const snap = await db.collection('participations').get();
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(row => ['joined', 'attended'].includes(row.status));
  }
}

function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getProfileUrl(userId, username) {
  if (username) return `profile.html?u=${encodeURIComponent(username)}`;
  return userId ? `profile.html?id=${encodeURIComponent(userId)}` : 'profile.html';
}

function buildUserLookup(usersSnap) {
  const users = new Map();
  usersSnap?.forEach?.((doc) => users.set(doc.id, { id: doc.id, ...doc.data() }));
  return users;
}

async function enrichInitiativesWithCreators(initiatives, usersSnap = null) {
  const users = buildUserLookup(usersSnap);
  const missingCreatorIds = [...new Set(
    initiatives
      .map((initiative) => initiative.createdBy)
      .filter((id) => id && !users.has(id))
  )];

  await Promise.all(missingCreatorIds.map(async (id) => {
    try {
      const snap = await db.collection('users').doc(id).get();
      if (snap.exists) users.set(id, { id: snap.id, ...snap.data() });
    } catch (err) {
      console.warn('Could not load initiative creator', id, err);
    }
  }));

  return initiatives.map((initiative) => {
    const creator = initiative.createdBy ? users.get(initiative.createdBy) : null;
    return {
      ...initiative,
      createdByName: initiative.createdByName || creator?.username || '',
      creatorPhone: creator?.phone || initiative.creatorPhone || ''
    };
  });
}

function getInitiativeCoords(initiative) {
  const lat = Number(initiative.latitude ?? initiative.lat);
  const lng = Number(initiative.longitude ?? initiative.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return cityCoords[initiative.city] || null;
}

function normalizeExternalUrl(value = '', domainHint = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  let candidate = trimmed;
  if (domainHint === 'github.com' && !candidate.includes('.') && !candidate.includes('/')) {
    candidate = `github.com/${candidate}`;
  }
  if (domainHint === 'linkedin.com' && !candidate.includes('.') && !candidate.includes('/')) {
    candidate = `linkedin.com/in/${candidate}`;
  }
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const url = new URL(withProtocol);
    if (domainHint && !url.hostname.toLowerCase().includes(domainHint)) return '';
    return url.href;
  } catch {
    return '';
  }
}

function formatPhoneDisplay(phone = '') {
  const normalized = String(phone || '').trim();
  if (!normalized) return '';
  return `<bdi class="phone-value" dir="ltr">${escapeHtml(normalized)}</bdi>`;
}

function profileVisibility(profile = {}) {
  return {
    phone: false,
    city: true,
    gender: true,
    age: true,
    points: true,
    bio: true,
    social: true,
    history: true,
    ...(profile.visibility || {})
  };
}

function renderHomeActivityFeed(initiatives) {
  const container = document.getElementById('hero-activity-feed');
  if (!container) return;
  const sorted = initiatives
    .slice()
    .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`))
    .slice(0, 3);

  if (!sorted.length) {
    container.innerHTML = `
      <div class="signal-item">
        <div class="signal-index">01</div>
        <p>لا توجد مبادرات معتمدة حالياً، لكن الصفحة جاهزة لأول دفعة فرص.</p>
      </div>`;
    return;
  }

  container.innerHTML = sorted.map((item, index) => `
    <div class="signal-item">
      <div class="signal-index">${String(index + 1).padStart(2, '0')}</div>
      <p>${[item.name || 'مبادرة', item.city, item.date ? formatDate(item.date) : null].filter(Boolean).join(' · ')}</p>
    </div>`).join('');
}

function populateHomeCityFilter(cities) {
  const select = document.getElementById('home-filter-city');
  if (!select) return;
  select.innerHTML = `<option value="">كل المدن</option>${cities.map(city => `<option>${city}</option>`).join('')}`;
}

function applyHomeFilters() {
  const search = (document.getElementById('home-filter-search')?.value || '').toLowerCase();
  const city = document.getElementById('home-filter-city')?.value || '';
  const gender = document.getElementById('home-filter-gender')?.value || '';

  const filtered = homeInitiatives.filter(item => {
    const description = item.description || '';
    if (search && !item.name.toLowerCase().includes(search) && !description.toLowerCase().includes(search)) return false;
    if (city && item.city !== city) return false;
    if (gender && item.gender !== gender && item.gender !== 'الكل') return false;
    return true;
  });

  renderHomeResults(filtered);
  renderFeaturedInitiatives(filtered.slice(0, 3), filtered.length ? '' : 'لا توجد نتائج بهذه الفلاتر حالياً.');
  updateHomeMapMarkers(filtered);
  updateHomeSuggestion(filtered[0]?.city || '--', filtered.filter(item => !item.full).length);
}

function renderHomeResults(items) {
  const container = document.getElementById('home-results-list');
  const summary = document.getElementById('home-results-summary');
  if (summary) summary.textContent = items.length ? `${items.length} مبادرة ظاهرة الآن` : 'لا توجد نتائج حالياً';
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="result-pill">
        <span class="result-pill-copy">
          <strong>لا توجد مبادرات بهذه الفلاتر</strong>
          <span>جرّب مدينة أو كلمة بحث مختلفة</span>
        </span>
        <span class="result-pill-action">تغيير الفلتر</span>
      </div>`;
    return;
  }

  container.innerHTML = items.slice(0, 4).map(item => `
    <button class="result-pill" type="button" onclick="focusHomeInitiative('${item.id}')">
      <span class="result-pill-copy">
        <strong>${item.name}</strong>
        <span>${item.city || 'الأردن'}${item.date ? ` • ${formatDate(item.date)}` : ''}${item.creatorPhone ? ` • ${formatPhoneDisplay(item.creatorPhone)}` : ''}</span>
      </span>
      <span class="result-pill-action">اختيار</span>
    </button>`).join('');
}

function renderFeaturedInitiatives(items, emptyMessage = 'لا توجد مبادرات متاحة حالياً.') {
  const container = document.getElementById('featured-initiatives');
  if (!container) return;
  const featured = items.slice(0, 4);

  if (!featured.length) {
    container.innerHTML = `
      <div class="featured-card-home">
        <div class="featured-head">
          <h3>لا توجد مبادرات الآن</h3>
          <span class="featured-badge">Empty</span>
        </div>
        <p>${emptyMessage}</p>
      </div>`;
    return;
  }

  container.innerHTML = featured.map(item => {
    const capacity = Number(item.maxParticipants) || 0;
    const pct = capacity ? Math.min(100, (item.count / capacity) * 100) : 0;
    return `
      <article class="featured-card-home">
        <div class="featured-head">
          <h3>${item.name}</h3>
          <span class="featured-badge">${item.full ? 'مكتملة' : 'مفتوحة'}</span>
        </div>
        <div class="featured-meta">
          <span>${item.city || 'الأردن'}</span>
          <span>${item.date ? formatDate(item.date) : 'الوقت يحدد لاحقاً'}</span>
          <span>${item.time ? formatTime(item.time) : 'الوقت يحدد لاحقاً'}</span>
          ${item.creatorPhone ? `<span>تواصل: ${formatPhoneDisplay(item.creatorPhone)}</span>` : ''}
        </div>
        <p>${item.description || 'فرصة تطوعية معتمدة بانتظار مشاركتك.'}</p>
        <div class="featured-progress"><span style="width:${pct}%"></span></div>
        <div class="featured-foot">
          <a href="initiatives.html" class="btn btn-primary btn-sm">التفاصيل ←</a>
          <span class="featured-participants">${item.count} / ${capacity || '--'} مشارك</span>
        </div>
      </article>`;
  }).join('');
}

function renderHomeRewards(items) {
  const container = document.getElementById('home-rewards-grid');
  const summary = document.getElementById('home-rewards-summary');
  if (!container) return;
  if (summary) summary.textContent = items.length ? `${items.length} مكافأة متاحة` : 'لا توجد مكافآت حالياً';

  if (!items.length) {
    container.innerHTML = `
      <div class="featured-card-home">
        <div class="featured-head">
          <h3>لا توجد مكافآت متاحة حالياً</h3>
          <span class="featured-badge">Empty</span>
        </div>
        <p>نعمل مع الشركاء لإضافة مكافآت جديدة قريباً.</p>
      </div>`;
    return;
  }

  container.innerHTML = items.slice(0, 4).map((item, index) => `
    <article class="featured-card-home">
      <div class="featured-head">
        <h3>${item.title || 'مكافأة'}</h3>
        <span class="featured-badge">${item.pointsCost || 0} نقطة</span>
      </div>
      <div class="featured-meta">
        <span>مكافأة شركاء</span>
        <span>رقم ${String(index + 1).padStart(2, '0')}</span>
      </div>
      <p>${item.description || 'استبدل نقاطك بهذه المكافأة مباشرة من صفحة الاستبدال عند توفر رصيد كافٍ.'}</p>
      <div class="featured-progress"><span style="width:${Math.min(100, 20 + (index * 18))}%"></span></div>
      <div class="featured-foot">
        <span>${item.pointsCost || 0} نقطة مطلوبة</span>
        <a href="redeem.html" class="btn btn-primary btn-sm">استبدال ←</a>
      </div>
    </article>
  `).join('');
}

function updateHomeSuggestion(city, openSpots) {
  const el = document.getElementById('home-suggestion-copy');
  if (!el) return;
  if (!homeInitiatives.length) {
    el.textContent = 'بمجرد توفر مبادرات جديدة، سنعرض لك هنا ترشيحاً سريعاً يساعدك تبدأ أسرع.';
    return;
  }
  el.textContent = city && city !== '--'
    ? `إذا كنت قريباً من ${city} فهذه أفضل نقطة بداية حالياً، ويوجد ${openSpots} فرصة غير مكتملة يمكن الانضمام لها الآن.`
    : `يوجد ${openSpots} فرصة غير مكتملة حالياً. استخدم الفلاتر للوصول للمبادرة الأنسب لك.`;
}

function initHomeMap(items) {
  const mapEl = document.getElementById('home-map');
  if (!mapEl || typeof L === 'undefined') return;
  if (homeMap) homeMap.remove();

  homeMap = L.map('home-map', { zoomControl: false }).setView([31.9539, 35.9106], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(homeMap);
  L.control.zoom({ position: 'bottomleft' }).addTo(homeMap);

  updateHomeMapMarkers(items);
}

function updateHomeMapMarkers(items) {
  if (!homeMap) return;
  homeMapMarkers.forEach(marker => marker.remove());
  homeMapMarkers = [];

  if (!items.length) {
    closeHomeMapPanel();
    return;
  }

  const bounds = [];
  items.forEach(item => {
    const coords = getInitiativeCoords(item);
    if (!coords) return;
    const hasExactCoords = Number.isFinite(Number(item.latitude ?? item.lat)) && Number.isFinite(Number(item.longitude ?? item.lng));
    const lat = coords[0] + (hasExactCoords ? 0 : (Math.random() - 0.5) * 0.08);
    const lng = coords[1] + (hasExactCoords ? 0 : (Math.random() - 0.5) * 0.08);
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'initiative-map-marker-wrap',
        html: `<div class="initiative-map-marker ${item.full ? 'cancelled' : ''}"><span class="initiative-map-marker-core"></span></div>`,
        iconSize: [34, 46],
        iconAnchor: [17, 42],
        popupAnchor: [0, -34]
      })
    }).addTo(homeMap);
    marker.bindPopup(`<b>${item.name}</b><br>${item.city || ''}`);
    marker.on('click', () => openHomeMapPanel(item));
    homeMapMarkers.push(marker);
    bounds.push([lat, lng]);
  });

  if (bounds.length) {
    homeMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }
}

function focusHomeInitiative(id) {
  const item = homeInitiatives.find(init => init.id === id);
  if (!item) return;
  const coords = cityCoords[item.city];
  if (homeMap && coords) {
    homeMap.setView(coords, 9, { animate: true });
  }
  openHomeMapPanel(item);
}

function openHomeMapPanel(item) {
  const panel = document.getElementById('home-map-panel');
  if (!panel) return;
  setTextContent('home-panel-name', item.name || 'مبادرة');
  setTextContent('home-panel-city-chip', item.city || 'الأردن');
  setTextContent('home-panel-date', `${item.date ? formatDate(item.date) : 'التاريخ يحدد لاحقاً'}${item.time ? ` • ${formatTime(item.time)}` : ''}`);
  setTextContent('home-panel-desc', item.description || 'لا يوجد وصف إضافي لهذه المبادرة حالياً.');
  const countEl = document.getElementById('home-panel-count');
  if (countEl) {
    countEl.innerHTML = `المشاركون: ${item.count} / ${item.maxParticipants || '--'}${item.creatorPhone ? ` · للتواصل: ${formatPhoneDisplay(item.creatorPhone)}` : ''}`;
  }
  const joinBtn = document.getElementById('home-panel-join-btn');
  if (joinBtn) {
    joinBtn.disabled = !!item.full;
    joinBtn.textContent = item.full ? 'المبادرة مكتملة' : 'انضم الآن';
    joinBtn.onclick = () => {
      if (currentProfile) {
        window.location.href = 'initiatives.html';
        return;
      }
      promptAuthRequired({
        title: 'الانضمام يحتاج حساباً',
        message: 'حتى تنضم إلى المبادرات وتحفظ مشاركاتك ونقاطك، سجّل دخولك أو أنشئ حساباً جديداً.'
      });
    };
  }
  panel.classList.add('open');
}

function closeHomeMapPanel() {
  document.getElementById('home-map-panel')?.classList.remove('open');
}

// ──────────────────────────────────────────────────────────────
// PAGE: signup.html
// ──────────────────────────────────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const username    = form.username.value.trim();
  const password    = form.password.value;
  const confirmPass = form.confirmPassword.value;
  const birthdate   = form.birthdate.value;
  const city        = form.city.value;
  const gender      = form.gender.value;
  const phone       = normalizeSupportedPhone(form.phone.value.trim(), form.phoneCode?.value || '+962');

  clearErrors(form);
  updatePasswordRules(password);

  let valid = true;
  if (!username || username.length < 3) { showError(form,'username','يجب أن يكون اسم المستخدم 3 أحرف على الأقل'); valid=false; }
  if (!getPasswordRuleStatus(password).valid) { showError(form,'password',getPasswordRulesMessage()); valid=false; }
  if (password !== confirmPass) { showError(form,'confirmPassword','كلمات المرور غير متطابقة'); valid=false; }
  if (!birthdate || calcAge(birthdate) < 13) { showError(form,'birthdate','يجب أن يكون عمرك 13 سنة أو أكثر'); valid=false; }
  if (!city) { showError(form,'city','اختر المدينة'); valid=false; }
  if (!gender) { showError(form,'gender','اختر الجنس'); valid=false; }
  if (!phone) { showError(form,'phone','أدخل رقم هاتف صحيح للدولة المختارة'); valid=false; }
  if (!valid) return;

  const btn = form.querySelector('[type="submit"]');
  const defaultText = btn.dataset.defaultText || btn.textContent;
  btn.disabled = true; btn.textContent = 'جاري الإنشاء...';

  try {
    const uSnap = await db.collection('users').where('username','==',username).get();
    if (!uSnap.empty) { showError(form,'username','اسم المستخدم مستخدم بالفعل'); btn.disabled=false; btn.textContent=defaultText; return; }

    const email = `${username.toLowerCase()}@himmah.jo`;
    const cred  = await auth.createUserWithEmailAndPassword(email, password);

    await db.collection('users').doc(cred.user.uid).set({
      username,
      birthdate,
      city,
      gender,
      phone,
      phoneCountryCode: form.phoneCode?.value || getPhoneCountryFromValue(phone)?.code || '+962',
      bio: '',
      social: { github: '', linkedin: '' },
      visibility: {
        phone: false,
        city: true,
        gender: true,
        age: true,
        points: true,
        bio: true,
        social: true,
        history: true
      },
      points: 0,
      role: 'user',
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await rememberPasswordCredential(username, password);
    showToast('تم إنشاء الحساب بنجاح');
    setTimeout(() => window.location.href = 'index.html', 1200);
  } catch (err) {
    showToast(translateAuthError(err.code), 'error');
    btn.disabled=false; btn.textContent=defaultText;
  }
}

// ──────────────────────────────────────────────────────────────
// PAGE: signin.html
// ──────────────────────────────────────────────────────────────
async function handleSignin(e) {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;

  if (!username || !password) { showToast('يرجى ملء جميع الحقول', 'error'); return; }

  const btn = form.querySelector('[type="submit"]');
  const defaultText = btn.dataset.defaultText || btn.textContent;
  btn.disabled=true; btn.textContent='جاري الدخول...';

  try {
    const uSnap = await db.collection('users').where('username','==',username).get();
    if (uSnap.empty) { showToast('اسم المستخدم غير موجود', 'error'); btn.disabled=false; btn.textContent=defaultText; return; }

    const userDoc = uSnap.docs[0].data();
    if (userDoc.status === 'frozen') { showToast('تم تجميد حسابك. تواصل مع الإدارة.', 'error'); btn.disabled=false; btn.textContent=defaultText; return; }

    const email = `${username.toLowerCase()}@himmah.jo`;
    await auth.signInWithEmailAndPassword(email, password);
    await rememberPasswordCredential(username, password);
    showToast('أهلاً بك');
    setTimeout(() => window.location.href = 'index.html', 1000);
  } catch (err) {
    showToast(translateAuthError(err.code), 'error');
    btn.disabled=false; btn.textContent=defaultText;
  }
}

// ──────────────────────────────────────────────────────────────
// PAGE: initiatives.html
// ──────────────────────────────────────────────────────────────
let leafletMap = null;
let allInitiatives = [];
let initiativeMarkers = [];
let myParticipationRows = [];
let selectedCityFilter = null;
let selectedGenderFilter = 'all';
let selectedAgeFilter = 'all';
let selectedInitiativeId = null;
let initiativesFiltersBound = false;
let browsePage = 1;
const browsePageSize = 12;
let filteredBrowseInitiatives = [];

const cityCoords = {
  'عمّان':     [31.9539, 35.9106],
  'الزرقاء':  [32.0635, 36.0944],
  'إربد':      [32.5568, 35.8469],
  'العقبة':   [29.5267, 35.0069],
  'السلط':    [32.0376, 35.7275],
  'مادبا':    [31.7161, 35.7936],
  'الكرك':    [31.1804, 35.7047],
  'الطفيلة':  [30.8383, 35.6034],
  'معان':     [30.1955, 35.7348],
  'جرش':     [32.2699, 35.8978],
  'عجلون':   [32.3261, 35.7502],
  'المفرق':   [32.3424, 36.2060],
};

async function initInitiativesPage() {
  setupInitiativesMap();
  hydrateCreateInitiativeCities();
  bindInitiativesUi();
  await refreshInitiativesData();
}

function setupInitiativesMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;
  if (leafletMap) leafletMap.remove();
  leafletMap = L.map('map').setView([31.9539, 35.9106], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(leafletMap);
}

function bindInitiativesUi() {
  if (initiativesFiltersBound) return;
  initiativesFiltersBound = true;

  document.getElementById('filter-city')?.addEventListener('change', (e) => {
    selectedCityFilter = e.target.value || null;
    selectedInitiativeId = null;
    browsePage = 1;
    applyFilters();
  });

  document.getElementById('filter-search')?.addEventListener('input', () => {
    browsePage = 1;
    applyFilters();
  });
  document.getElementById('filter-age')?.addEventListener('change', (e) => {
    selectedAgeFilter = e.target.value || 'all';
    selectedInitiativeId = null;
    browsePage = 1;
    applyFilters();
  });

  document.getElementById('browse-filter-apply')?.addEventListener('click', () => {
    syncBrowseFiltersFromSidebar();
    browsePage = 1;
    applyFilters();
  });

  document.getElementById('browse-filter-reset')?.addEventListener('click', () => {
    const sidebarCity = document.getElementById('browse-filter-city');
    const sidebarGender = document.getElementById('browse-filter-gender');
    const sidebarAge = document.getElementById('browse-filter-age');
    const sidebarSearch = document.getElementById('browse-filter-search');
    if (sidebarCity) sidebarCity.value = '';
    if (sidebarGender) sidebarGender.value = 'all';
    if (sidebarAge) sidebarAge.value = 'all';
    if (sidebarSearch) sidebarSearch.value = '';
    syncBrowseFiltersFromSidebar();
    browsePage = 1;
    applyFilters();
  });

  ['browse-filter-city', 'browse-filter-gender', 'browse-filter-age', 'browse-filter-search'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(id === 'browse-filter-search' ? 'input' : 'change', () => {
      syncBrowseFiltersFromSidebar();
      browsePage = 1;
      applyFilters();
    });
  });

  document.querySelectorAll('#gender-segments .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGenderFilter = btn.dataset.gender || 'all';
    document.querySelectorAll('#gender-segments .segment-btn').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      selectedInitiativeId = null;
      browsePage = 1;
      applyFilters();
    });
  });

  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    selectedCityFilter = null;
    selectedGenderFilter = 'all';
    selectedAgeFilter = 'all';
    selectedInitiativeId = null;
    browsePage = 1;
    const citySelect = document.getElementById('filter-city');
    const searchInput = document.getElementById('filter-search');
    const ageSelect = document.getElementById('filter-age');
    if (citySelect) citySelect.value = '';
    if (searchInput) searchInput.value = '';
    if (ageSelect) ageSelect.value = 'all';
    document.querySelectorAll('#gender-segments .segment-btn').forEach(el => {
      el.classList.toggle('active', el.dataset.gender === 'all');
    });
    applyFilters();
  });

  document.getElementById('tab-browse')?.addEventListener('click', () => switchInitiativesTab('browse'));
  document.getElementById('tab-mine')?.addEventListener('click', () => switchInitiativesTab('mine'));
  document.getElementById('open-create-initiative-btn')?.addEventListener('click', openCreateInitiativeModal);
  document.getElementById('open-create-from-empty-btn')?.addEventListener('click', openCreateInitiativeModal);
  document.getElementById('my-open-create-btn')?.addEventListener('click', openCreateInitiativeModal);
  document.getElementById('create-initiative-form')?.addEventListener('submit', handleCreateInitiative);

  if (window.location.hash === '#mine-section') {
    switchInitiativesTab('mine');
  } else {
    switchInitiativesTab('browse');
  }
}

async function refreshInitiativesData() {
  try {
    let initiativesSnap;
    try {
      initiativesSnap = await db.collection('initiatives').where('status','in',['approved', 'cancelled']).get();
    } catch (err) {
      const approvedSnap = await db.collection('initiatives').where('status','==','approved').get();
      const cancelledSnap = await db.collection('initiatives').where('status','==','cancelled').get().catch(() => null);
      initiativesSnap = {
        forEach(callback) {
          approvedSnap.forEach(callback);
          cancelledSnap?.forEach(callback);
        }
      };
    }

    let participationsSnap = null;
    try {
      participationsSnap = await db.collection('participations').get();
    } catch (err) {
      console.warn('Could not load participations for initiative counts', err);
    }

    const participationCounts = {};
    const myStatuses = new Map();
    participationsSnap?.forEach(doc => {
        const data = doc.data();
        if (['joined', 'attended'].includes(data.status)) {
          participationCounts[data.initiativeId] = (participationCounts[data.initiativeId] || 0) + 1;
        }
        if (currentProfile && data.userId === currentProfile.id) {
          myStatuses.set(data.initiativeId, { id: doc.id, ...data });
        }
      });

    allInitiatives = [];
    const cancellationWrites = [];
    initiativesSnap.forEach(doc => {
      const data = doc.data();
      const myPart = myStatuses.get(doc.id);
      const count = participationCounts[doc.id] ?? Number(data.participantsCount ?? data.participants_count ?? 0);
      const cancelled = isInitiativeCancelled(data, count);
      if (cancelled && data.status !== 'cancelled') {
        cancellationWrites.push(maybePersistCancelledInitiative(doc.id, data, count));
      }
      allInitiatives.push({
        id: doc.id,
        ...data,
        status: cancelled ? 'cancelled' : data.status,
        isCancelled: cancelled,
        count,
        isJoined: !!myPart && ['joined', 'attended'].includes(myPart.status),
        myParticipationStatus: myPart?.status || null,
        myParticipationId: myPart?.id || null
      });
    });
    allInitiatives = await enrichInitiativesWithCreators(allInitiatives);
    if (cancellationWrites.length) Promise.allSettled(cancellationWrites);

    try {
      myParticipationRows = currentProfile ? await loadMyParticipations() : [];
    } catch (err) {
      console.warn('Could not load my participations', err);
      myParticipationRows = [];
    }
    populateInitiativesCities(allInitiatives);
    updateInitiativesOverview(allInitiatives);
    browsePage = 1;
    applyFilters();
    renderMyParticipationsSection();
    if (document.getElementById('my-created-list')) {
      refreshMyInitiativesPage().catch(() => {});
    }
    updateInitiativesTabCounts();
  } catch (err) {
    console.error('refreshInitiativesData failed', err);
    showToast('تعذر تحميل المبادرات حالياً', 'error');
  }
}

function populateInitiativesCities(initiatives) {
  const select = document.getElementById('filter-city');
  if (!select) return;
  const cities = [...new Set(initiatives.map(item => item.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'));
  select.innerHTML = `<option value="">الكل</option>${cities.map(city => `<option value="${city}">${city}</option>`).join('')}`;
  if (selectedCityFilter) select.value = selectedCityFilter;
}

function applyFilters() {
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase();
  const filtered = allInitiatives.filter(item => {
    const description = item.description || '';
    if (selectedCityFilter && item.city !== selectedCityFilter) return false;
    if (selectedGenderFilter !== 'all' && item.gender !== selectedGenderFilter && item.gender !== 'الكل') return false;
    if (selectedAgeFilter !== 'all') {
      const age = Number(item.minAge ?? item.min_age ?? 0);
      if (Number.isFinite(age) && age > Number(selectedAgeFilter)) return false;
    }
    if (search && !item.name.toLowerCase().includes(search) && !description.toLowerCase().includes(search)) return false;
    return true;
  });

  filteredBrowseInitiatives = filtered;
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) clearBtn.classList.toggle('hide', !selectedCityFilter && selectedGenderFilter === 'all' && selectedAgeFilter === 'all' && !search);
  const countEl = document.getElementById('filter-results-count');
  if (countEl) countEl.textContent = `${filtered.length} مبادرة`;
  const emptyState = document.getElementById('browse-empty-state');
  if (emptyState) emptyState.classList.toggle('hide', allInitiatives.length !== 0);

  renderBrowsePanel(filtered);
  renderInitiativeMarkers(filtered);
  renderBrowseAllSection(filtered);
}

function syncBrowseFiltersFromSidebar() {
  const city = document.getElementById('browse-filter-city');
  const gender = document.getElementById('browse-filter-gender');
  const age = document.getElementById('browse-filter-age');
  const search = document.getElementById('browse-filter-search');
  selectedCityFilter = city?.value || null;
  selectedGenderFilter = gender?.value || 'all';
  selectedAgeFilter = age?.value || 'all';
  const mainCity = document.getElementById('filter-city');
  const mainSearch = document.getElementById('filter-search');
  if (mainCity) mainCity.value = selectedCityFilter || '';
  if (mainSearch && search) mainSearch.value = search.value || '';
  document.querySelectorAll('#gender-segments .segment-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.gender === selectedGenderFilter);
  });
}

function updateInitiativesOverview(items) {
  const openCount = items.filter(item => {
    const capacity = Number(item.maxParticipants) || 0;
    return !item.isCancelled && (!capacity || item.count < capacity);
  }).length;
  const citiesCount = new Set(items.map(item => item.city).filter(Boolean)).size;
  setTextContent('overview-total-initiatives', items.length);
  setTextContent('hero-initiatives-count', items.length);
  setTextContent('hero-open-count', openCount);
  setTextContent('overview-open-initiatives', openCount);
  setTextContent('overview-cities', citiesCount);
}

function renderBrowsePanel(initiatives) {
  const panel = document.getElementById('initiative-panel');
  if (!panel) return;

  if (!initiatives.length) {
    panel.innerHTML = `
      <div class="initiative-panel-state">
        <div class="panel-state-icon"><img src="Logo.png" alt="همة"/></div>
        <div class="panel-state-title">لا توجد نتائج حالياً</div>
        <div class="panel-state-text">جرّب تغيير المحافظة أو الجنس أو كلمة البحث للوصول إلى مبادرات أخرى.</div>
      </div>`;
    return;
  }

  const cityInitiatives = selectedCityFilter
    ? initiatives.filter(item => item.city === selectedCityFilter)
    : initiatives;

  if (!cityInitiatives.length) {
    panel.innerHTML = `
      <div class="panel-city-header">
        <span class="panel-city-title">${selectedCityFilter}</span>
        <span class="panel-city-count">0 مبادرة</span>
      </div>
      <div class="initiative-panel-state">
        <div class="panel-state-title">لا توجد مبادرات مطابقة</div>
        <div class="panel-state-text">جرّب تغيير الفلاتر أو اختر محافظة أخرى لعرض نتائج مختلفة.</div>
      </div>`;
    return;
  }

  panel.innerHTML = `
    <div class="panel-toolbar">
      <div>
        <h3>${selectedCityFilter ? selectedCityFilter : 'جميع المبادرات'}</h3>
        <p>${selectedCityFilter ? 'المبادرات الظاهرة داخل المحافظة المختارة' : 'كل المبادرات المعتمدة تظهر هنا مباشرة قبل اختيار أي مدينة'}</p>
      </div>
      <span class="panel-city-count">${cityInitiatives.length} مبادرة</span>
    </div>
    <ul class="panel-list">
      ${cityInitiatives.map(item => `
        <li class="panel-list-item">
          <button class="panel-initiative-btn" type="button" onclick="selectInitiativeDetails('${item.id}')">
            <div class="panel-initiative-top">
              <span class="panel-initiative-name">${item.name}</span>
              ${item.isCancelled ? '<span style="color:var(--danger);font-size:0.72rem;font-weight:900">ملغاة</span>' : item.isJoined ? '<span style="color:var(--primary);font-size:0.72rem;font-weight:900">منضم</span>' : ''}
            </div>
            <div class="panel-initiative-meta">
              <span>${item.date ? formatDate(item.date) : 'قريباً'}</span>
              <span>${item.count}${item.maxParticipants ? ` / ${item.maxParticipants}` : ''} مشارك</span>
              <span>${item.creationPoints ?? 30} نقطة</span>
              ${item.creatorPhone ? `<span>تواصل: ${formatPhoneDisplay(item.creatorPhone)}</span>` : ''}
            </div>
          </button>
        </li>
      `).join('')}
    </ul>`;
}

function renderBrowseAllSection(initiatives) {
  const grid = document.getElementById('browse-all-grid');
  const pagination = document.getElementById('browse-pagination');
  const count = document.getElementById('browse-all-count');
  if (!grid || !pagination) return;

  if (count) count.textContent = `${initiatives.length} مبادرة`;

  const totalPages = Math.max(1, Math.ceil(initiatives.length / browsePageSize));
  browsePage = Math.min(Math.max(1, browsePage), totalPages);
  const start = (browsePage - 1) * browsePageSize;
  const pageItems = initiatives.slice(start, start + browsePageSize);

  if (!initiatives.length) {
    grid.innerHTML = `
      <div class="empty-state-v2" style="grid-column:1/-1">
        <div class="empty-icon"><img src="Logo.png" alt="همة"/></div>
        <h3>لا توجد مبادرات مطابقة</h3>
        <p>جرّب فلاتر مختلفة للوصول إلى نتائج أخرى.</p>
      </div>`;
    pagination.innerHTML = '';
    return;
  }

  grid.innerHTML = pageItems.map((item) => {
    const capacity = Number(item.maxParticipants || item.max_participants || 0);
    const countValue = Number(item.count || item.participantsCount || item.participants_count || 0);
    const open = capacity ? Math.max(0, capacity - countValue) : 'متاح';
    const progress = capacity ? Math.min(100, Math.round((countValue / capacity) * 100)) : 0;
    const ageText = item.minAge ?? item.min_age ? `${item.minAge ?? item.min_age}+` : '13+';
    return `
      <article class="browse-card">
        <div class="browse-card-top">
          <div>
            <div class="browse-card-title">${item.name}</div>
            <div class="browse-card-meta" style="margin-top:.55rem">
              <span>${item.city || 'الأردن'}</span>
              <span>${item.date ? formatDate(item.date) : 'قريباً'}</span>
              <span>${item.time ? formatTime(item.time) : 'يحدد لاحقاً'}</span>
            </div>
          </div>
          <span class="panel-city-count" style="margin-inline-start:0">${item.isCancelled ? 'ملغاة' : item.isJoined ? 'منضم' : 'مفتوحة'}</span>
        </div>
        <p style="color:var(--text-muted);font-size:.82rem;line-height:1.85">${item.description || 'مبادرة تطوعية منظمة وجاهزة للانضمام.'}</p>
        <div class="browse-card-meta">
          <span>الجنس: ${item.gender && item.gender !== 'الكل' ? item.gender : 'الجميع'}</span>
          <span>العمر: ${ageText}</span>
          <span>المشاركون: ${countValue}${capacity ? ` / ${capacity}` : ''}</span>
          <span>متاح: ${open}</span>
          ${item.creatorPhone ? `<span>تواصل: ${formatPhoneDisplay(item.creatorPhone)}</span>` : ''}
        </div>
        <div class="detail-progress-track" style="margin-top:.2rem"><div class="detail-progress-fill" style="width:${progress}%"></div></div>
        <div class="browse-card-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openInitiativeDetailsModal('${item.id}')">عرض التفاصيل</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="selectInitiativeDetails('${item.id}')">اختيار</button>
        </div>
      </article>`;
  }).join('');

  pagination.innerHTML = totalPages > 1 ? `
    <button class="browse-page-btn" type="button" ${browsePage === 1 ? 'disabled' : ''} onclick="setBrowsePage(${browsePage - 1})">السابق</button>
    ${Array.from({ length: totalPages }, (_, index) => {
      const page = index + 1;
      return `<button class="browse-page-btn ${page === browsePage ? 'active' : ''}" type="button" onclick="setBrowsePage(${page})">${page}</button>`;
    }).join('')}
    <button class="browse-page-btn" type="button" ${browsePage === totalPages ? 'disabled' : ''} onclick="setBrowsePage(${browsePage + 1})">التالي</button>
  ` : '';
}

function setBrowsePage(page) {
  browsePage = page;
  renderBrowseAllSection(filteredBrowseInitiatives.length ? filteredBrowseInitiatives : allInitiatives);
}

function renderInitiativeDetailMarkup(item) {
  const capacity = Number(item.maxParticipants) || 0;
  const progress = capacity ? Math.min(100, Math.round((item.count / capacity) * 100)) : 0;
  const full = capacity ? item.count >= capacity : false;
  const started = item.date && item.time ? new Date() > getStartTime(item.date, item.time) : false;
  const cancelled = !!item.isCancelled || item.status === 'cancelled';
  const pendingReview = item.status && !['approved', 'cancelled'].includes(item.status);

  return `
    <div class="panel-detail-header">
      <button type="button" class="panel-back-btn" onclick="clearSelectedInitiativeDetails()">رجوع</button>
      <span class="panel-detail-city">${item.city || 'الأردن'}</span>
    </div>
    <div class="initiative-detail">
      <div>
        <div class="detail-title">${item.name}</div>
        ${item.isJoined ? '<div class="joined-chip">أنت منضم</div>' : ''}
      </div>
      ${item.description ? `<div class="detail-description">${item.description}</div>` : ''}
      <div class="detail-meta-stack">
        <div class="detail-meta-row"><span>التاريخ:</span><strong style="color:var(--text)">${item.date ? formatDate(item.date) : 'قريباً'}</strong></div>
        <div class="detail-meta-row"><span>الوقت:</span><strong style="color:var(--text)">${item.time ? formatTime(item.time) : 'يحدد لاحقاً'}</strong></div>
        <div class="detail-meta-row"><span>النقاط:</span><strong style="color:var(--text)">${item.creationPoints ?? 30} نقطة للحضور</strong></div>
        ${cancelled ? `<div class="detail-meta-row"><span>الحالة:</span><strong style="color:var(--danger)">ملغاة لعدم اكتمال الحد الأدنى قبل ساعة من البداية</strong></div>` : ''}
        <div>
          <div class="detail-meta-row" style="justify-content:space-between"><span>المشاركون</span><strong style="color:var(--text)">${item.count}${capacity ? ` / ${capacity}` : ''}</strong></div>
          ${capacity ? `<div class="detail-progress-track"><div class="detail-progress-fill" style="width:${progress}%"></div></div>` : ''}
        </div>
        ${item.minParticipants ? `<div class="detail-meta-row"><span>الحد الأدنى:</span><strong style="color:var(--text)">${item.minParticipants} مشارك</strong></div>` : ''}
        ${item.createdByName ? `<div class="detail-meta-row"><span>بإشراف:</span><a href="${getProfileUrl(item.createdBy, item.createdByName)}" style="color:var(--primary);font-weight:900">@${item.createdByName}</a></div>` : ''}
        ${item.creatorPhone ? `<div class="detail-meta-row"><span>رقم التواصل:</span><a href="tel:${item.creatorPhone}" class="phone-value" style="color:var(--primary);font-weight:900">${item.creatorPhone}</a></div>` : ''}
      </div>
      <div class="detail-tags">
        ${item.gender && item.gender !== 'الكل' ? `<span class="detail-tag">${item.gender === 'ذكر' ? 'للذكور' : 'للإناث'}</span>` : ''}
        ${cancelled ? '<span class="detail-tag" style="color:var(--danger);border-color:rgba(229,57,53,0.28)">ملغاة</span>' : ''}
        ${full ? '<span class="detail-tag">مكتملة</span>' : ''}
      </div>
      <div class="detail-actions">
        ${cancelled
          ? `<button type="button" class="btn btn-secondary full-width" disabled>المبادرة ملغاة</button>`
          : item.isJoined
          ? `
            <div class="detail-action-stack">
              <button type="button" class="btn btn-secondary full-width" onclick="leaveInitiative('${item.id}')" ${window.initiativeActionLoadingId === item.id ? 'disabled' : ''}>${window.initiativeActionLoadingId === item.id ? 'جارٍ الانسحاب...' : 'الانسحاب من المبادرة'}</button>
              <div class="notice-text">قد يتم خصم جزء من النقاط عند الانسحاب بعد التسجيل.</div>
            </div>
          `
          : full
            ? `<button type="button" class="btn btn-secondary full-width" disabled>المبادرة مكتملة</button>`
            : started
              ? `<button type="button" class="btn btn-secondary full-width" disabled>بدأت المبادرة</button>`
              : `
                <div class="detail-action-stack">
                  <button type="button" class="btn btn-primary full-width" onclick="openJoinModal('${item.id}','${item.name.replace(/'/g, "\\'")}')">${currentProfile ? 'انضم إلى المبادرة' : 'سجّل للانضمام'}</button>
                  <div class="notice-text">ستكسب نقاط الحضور بعد توثيق مشاركتك.</div>
                </div>
              `
        }
      </div>
    </div>`;
}

function openInitiativeDetailsModal(id) {
  const item = allInitiatives.find((initiative) => initiative.id === id);
  const container = document.getElementById('initiative-detail-content');
  if (!item || !container) return;
  renderInitiativeDetailsModalItem(item, container);
}

function renderInitiativeDetailsModalItem(item, container) {
  const capacity = Number(item.maxParticipants) || 0;
  const progress = capacity ? Math.min(100, Math.round((item.count / capacity) * 100)) : 0;
  const full = capacity ? item.count >= capacity : false;
  const started = item.date && item.time ? new Date() > getStartTime(item.date, item.time) : false;
  const cancelled = !!item.isCancelled || item.status === 'cancelled';
  const pendingReview = item.status && !['approved', 'cancelled'].includes(item.status);

  container.innerHTML = `
    <div class="initiative-modal-hero">
      <div class="initiative-modal-top">
        <div>
          <div class="initiative-modal-kicker">${item.city || 'الأردن'}${item.isJoined ? ' • منضم' : ''}${cancelled ? ' • ملغاة' : ''}</div>
          <div class="initiative-modal-title">${item.name}</div>
        </div>
        <button type="button" class="initiative-modal-close" onclick="closeModal('initiative-detail-modal')">×</button>
      </div>
      <div class="initiative-modal-copy">${item.description || 'مبادرة تطوعية بانتظار انضمام المشاركين المناسبين لها.'}</div>
    </div>
    <div class="initiative-modal-grid">
      <section class="initiative-modal-card">
        <h4>لمحة سريعة</h4>
        <div class="initiative-modal-stats">
          <div class="initiative-stat"><strong>${item.creationPoints ?? 30}</strong><span>نقطة للحضور</span></div>
          <div class="initiative-stat"><strong>${item.count}${capacity ? ` / ${capacity}` : ''}</strong><span>عدد المشاركين</span></div>
          <div class="initiative-stat"><strong>${item.date ? formatDate(item.date) : 'قريباً'}</strong><span>تاريخ المبادرة</span></div>
          <div class="initiative-stat"><strong>${item.time ? formatTime(item.time) : 'لاحقاً'}</strong><span>وقت البداية</span></div>
        </div>
        ${capacity ? `<div class="detail-progress-track" style="margin-top:1rem"><div class="detail-progress-fill" style="width:${progress}%"></div></div>` : ''}
        <div class="initiative-modal-actions">
          ${pendingReview
            ? `<button type="button" class="btn btn-secondary full-width" disabled>${item.status === 'pending' ? 'قيد المراجعة' : 'غير منشورة'}</button>`
            : cancelled
            ? `<button type="button" class="btn btn-secondary full-width" disabled>المبادرة ملغاة</button>`
            : item.isJoined
              ? `<button type="button" class="btn btn-secondary full-width" onclick="closeModal('initiative-detail-modal'); leaveInitiative('${item.id}')">الانسحاب من المبادرة</button>`
              : full
                ? `<button type="button" class="btn btn-secondary full-width" disabled>المبادرة مكتملة</button>`
                : started
                  ? `<button type="button" class="btn btn-secondary full-width" disabled>بدأت المبادرة</button>`
                  : `<button type="button" class="btn btn-primary full-width" onclick="closeModal('initiative-detail-modal'); openJoinModal('${item.id}','${item.name.replace(/'/g, "\\'")}')">${currentProfile ? 'انضم إلى المبادرة' : 'سجّل للانضمام'}</button>`
          }
          <button type="button" class="secondary-link-btn full-width" onclick="closeModal('initiative-detail-modal')">إغلاق</button>
        </div>
      </section>
      <section class="initiative-modal-card">
        <h4>تفاصيل المبادرة</h4>
        <div class="initiative-modal-list">
          <div class="initiative-modal-row"><span>المحافظة</span><strong>${item.city || 'الأردن'}</strong></div>
          <div class="initiative-modal-row"><span>الجنس المستهدف</span><strong>${item.gender && item.gender !== 'الكل' ? (item.gender === 'ذكر' ? 'ذكور' : 'إناث') : 'الجميع'}</strong></div>
          <div class="initiative-modal-row"><span>الحد الأدنى</span><strong>${item.minParticipants ? `${item.minParticipants} مشارك` : 'غير محدد'}</strong></div>
          <div class="initiative-modal-row"><span>الحد الأقصى</span><strong>${capacity ? `${capacity} مشارك` : 'غير محدد'}</strong></div>
          <div class="initiative-modal-row"><span>بإشراف</span><strong>${item.createdByName ? `<a href="${getProfileUrl(item.createdBy, item.createdByName)}" style="color:var(--primary)">@${item.createdByName}</a>` : 'غير محدد'}</strong></div>
          <div class="initiative-modal-row"><span>رقم التواصل</span><strong>${item.creatorPhone ? `<a href="tel:${item.creatorPhone}" class="phone-value" style="color:var(--primary)">${item.creatorPhone}</a>` : 'غير محدد'}</strong></div>
          <div class="initiative-modal-row"><span>الحالة</span><strong style="${cancelled ? 'color:var(--danger)' : 'color:var(--text)'}">${pendingReview ? (item.status === 'pending' ? 'قيد المراجعة' : 'غير منشورة') : cancelled ? 'ملغاة' : full ? 'مكتملة' : item.isJoined ? 'أنت منضم' : 'مفتوحة'}</strong></div>
        </div>
      </section>
    </div>
  `;

  openModal('initiative-detail-modal');
}

async function openOwnedInitiativeDetails(id) {
  const existing = allInitiatives.find((initiative) => initiative.id === id);
  const container = document.getElementById('initiative-detail-content');
  if (!container) return;
  if (existing) {
    openInitiativeDetailsModal(id);
    return;
  }
  container.innerHTML = '<div class="spinner"></div>';
  openModal('initiative-detail-modal');
  try {
    const doc = await db.collection('initiatives').doc(id).get();
    if (!doc.exists) {
      container.innerHTML = '<div class="empty-state"><h3>المبادرة غير موجودة</h3></div>';
      return;
    }
    const data = doc.data();
    const pSnap = await db.collection('participations').where('initiativeId','==',id).where('status','in',['joined','attended']).get();
    const [enriched] = await enrichInitiativesWithCreators([{
      id,
      ...data,
      count: pSnap.size,
      isJoined: false,
      isCancelled: data.status === 'cancelled'
    }]);
    renderInitiativeDetailsModalItem(enriched, container);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="empty-state"><h3>تعذر تحميل تفاصيل المبادرة</h3></div>';
  }
}

function renderInitiativeMarkers(initiatives) {
  if (!leafletMap) return;
  initiativeMarkers.forEach(marker => marker.remove());
  initiativeMarkers = [];

  const bounds = [];
  initiatives.forEach(init => {
    const coords = getInitiativeCoords(init);
    if (!coords) return;
    const hasExactCoords = Number.isFinite(Number(init.latitude ?? init.lat)) && Number.isFinite(Number(init.longitude ?? init.lng));
    const lat = coords[0] + (hasExactCoords ? 0 : (Math.random() - 0.5) * 0.08);
    const lng = coords[1] + (hasExactCoords ? 0 : (Math.random() - 0.5) * 0.08);
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'initiative-map-marker-wrap',
        html: `
          <div class="initiative-map-marker ${init.isCancelled ? 'cancelled' : init.isJoined ? 'joined' : ''}">
            <span class="initiative-map-marker-core"></span>
          </div>
        `,
        iconSize: [34, 46],
        iconAnchor: [17, 42],
        popupAnchor: [0, -34]
      })
    }).addTo(leafletMap);
    marker.bindPopup(`<b>${init.name}</b><br>${init.city || ''}`);
    marker.on('click', () => {
      selectedCityFilter = init.city || null;
      selectedInitiativeId = init.id;
      const citySelect = document.getElementById('filter-city');
      if (citySelect && selectedCityFilter) citySelect.value = selectedCityFilter;
      applyFilters();
      openInitiativeDetailsModal(init.id);
    });
    initiativeMarkers.push(marker);
    bounds.push([lat, lng]);
  });

  if (bounds.length) {
    leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  } else {
    leafletMap.setView([31.9539, 35.9106], 8);
  }
}

function closeMapPanel() {
  selectedInitiativeId = null;
  applyFilters();
}

function selectInitiativeDetails(id) {
  selectedInitiativeId = id;
  openInitiativeDetailsModal(id);
}

function clearSelectedInitiativeDetails() {
  selectedInitiativeId = null;
  applyFilters();
}

function switchInitiativesTab(tab) {
  if (tab === 'mine' && !currentProfile) {
    promptAuthRequired({
      title: 'قسم مشاركاتي يحتاج حساباً',
      message: 'سجّل دخولك أو أنشئ حساباً حتى نعرض لك مبادراتك المنشأة والمبادرات التي انضممت لها.'
    });
    tab = 'browse';
  }
  document.getElementById('browse-section')?.classList.toggle('active', tab === 'browse');
  document.getElementById('mine-section')?.classList.toggle('active', tab === 'mine');
  document.getElementById('tab-browse')?.classList.toggle('active', tab === 'browse');
  document.getElementById('tab-mine')?.classList.toggle('active', tab === 'mine');
  if (leafletMap && tab === 'browse') {
    setTimeout(() => leafletMap.invalidateSize(), 120);
  }
  if (tab === 'mine' && document.getElementById('my-created-list')) {
    refreshMyInitiativesPage().catch(() => {});
    if (window.location.hash !== '#mine-section') {
      history.replaceState(null, '', '#mine-section');
    }
  } else if (tab === 'browse' && window.location.hash === '#mine-section') {
    history.replaceState(null, '', '#browse-section');
  }
}

async function loadMyParticipations() {
  if (!currentProfile) return [];
  const snap = await db.collection('participations').where('userId','==',currentProfile.id).get();
  const rows = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const initiative = allInitiatives.find(item => item.id === data.initiativeId);
    if (!initiative) continue;
    rows.push({
      participationId: doc.id,
      status: data.status,
      joinedAt: data.joinedAt,
      initiative
    });
  }
  rows.sort((a, b) => ((b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0)));
  return rows;
}

function renderMyParticipationsSection() {
  const list = document.getElementById('my-participations-list');
  const empty = document.getElementById('my-empty-state');
  const count = document.getElementById('my-history-count');
  if (count) count.textContent = `${myParticipationRows.length} مشاركة`;
  if (!list || !empty) return;

  if (!myParticipationRows.length) {
    list.innerHTML = '';
    empty.classList.remove('hide');
    return;
  }

  empty.classList.add('hide');
  list.innerHTML = myParticipationRows.map(row => `
    <article class="history-card">
      <div class="history-icon ${row.status === 'attended' ? 'attended' : ''}">${row.status === 'attended' ? '✓' : '•'}</div>
      <div class="history-body">
        <div class="history-top">
          <div class="history-title">${row.initiative.name}</div>
          <span class="status-chip ${row.status === 'attended' ? 'attended' : ''}">${row.status === 'attended' ? 'حضرت' : 'مسجل'}</span>
        </div>
        <div class="history-meta">
          ${row.initiative.city ? `<span>${row.initiative.city}</span>` : ''}
          <span>${row.initiative.date ? formatDate(row.initiative.date) : 'قريباً'}</span>
          <span>${row.joinedAt?.seconds ? `انضممت ${new Intl.DateTimeFormat('ar-JO-u-nu-latn', { day:'numeric', month:'long', year:'numeric' }).format(new Date(row.joinedAt.seconds * 1000))}` : 'مسجل'}</span>
          <span style="color:var(--primary)">${row.status === 'attended' ? `${row.initiative.creationPoints ?? 30} نقطة مكتسبة` : `${row.initiative.creationPoints ?? 30} نقطة للحضور`}</span>
        </div>
      </div>
      <div class="history-actions">
        <button type="button" class="secondary-link-btn" onclick="window.location.href='initiatives.html'">عرض</button>
        ${row.status === 'joined' ? `<button type="button" class="btn btn-secondary btn-sm" onclick="leaveInitiative('${row.initiative.id}')">انسحاب</button>` : ''}
      </div>
    </article>
  `).join('');
}

function updateInitiativesTabCounts() {
  const browseCount = document.getElementById('tab-browse-count');
  const mineCount = document.getElementById('tab-mine-count');
  if (!currentProfile) {
    myParticipationRows = [];
  }
  if (browseCount) browseCount.textContent = String(allInitiatives.length);
  if (mineCount) mineCount.textContent = currentProfile ? String(myParticipationRows.length) : '0';
}

function hydrateCreateInitiativeCities() {
  const select = document.getElementById('create-city-select');
  if (!select) return;
  const cities = Object.keys(cityCoords).sort((a, b) => a.localeCompare(b, 'ar'));
  select.innerHTML = `<option value="">اختر...</option>${cities.map(city => `<option value="${city}">${city}</option>`).join('')}`;
}

function openCreateInitiativeModal() {
  if (!currentProfile) {
    promptAuthRequired({
      title: 'إنشاء مبادرة يحتاج حساباً',
      message: 'أنشئ حسابك أو سجّل دخولك أولاً حتى تتمكن من إرسال مبادرة جديدة للمراجعة وإدارتها لاحقاً.'
    });
    return;
  }
  openModal('create-initiative-modal');
}

let joinTargetId = null;
function openJoinModal(id, name) {
  if (!currentProfile) {
    promptAuthRequired({
      title: 'الانضمام يحتاج حساباً',
      message: `للانضمام إلى "${name}" وحفظ مشاركتك بشكل رسمي، سجّل دخولك أو أنشئ حساباً جديداً.`
    });
    return;
  }
  joinTargetId = id;
  document.getElementById('join-modal-name').textContent = name;
  openModal('join-modal');
}

async function confirmJoin() {
  if (!joinTargetId || !currentProfile) return;
  const btn = document.getElementById('confirm-join-btn');
  btn.disabled=true; btn.textContent='جاري الانضمام...';

  try {
    const init = allInitiatives.find(i => i.id === joinTargetId);
    if (!init) throw new Error('Initiative not found');

    const pSnap = await db.collection('participations').where('initiativeId','==',init.id).where('status','in',['joined','attended']).get();
    if (pSnap.size >= init.maxParticipants) { showToast('المبادرة مكتملة!', 'error'); closeModal('join-modal'); return; }

    const alreadySnap = await db.collection('participations').where('userId','==',currentProfile.id).where('initiativeId','==',joinTargetId).get();
    if (!alreadySnap.empty) { showToast('أنت منضم بالفعل!', 'warning'); closeModal('join-modal'); return; }

    const myParts = await db.collection('participations').where('userId','==',currentProfile.id).where('status','in',['joined','attended']).get();
    const newStart = getStartTime(init.date, init.time);
    const newEnd   = getEndTime(init.date, init.time);

    for (const doc of myParts.docs) {
      const otherInit = allInitiatives.find(i => i.id === doc.data().initiativeId);
      if (!otherInit) continue;
      const oStart = getStartTime(otherInit.date, otherInit.time);
      const oEnd   = getEndTime(otherInit.date, otherInit.time);
      if (timesOverlap(newStart, newEnd, oStart, oEnd)) {
        showToast('يوجد تعارض مع مبادرة أخرى في نفس الوقت!', 'error');
        closeModal('join-modal');
        return;
      }
    }

    await db.collection('participations').add({
      userId: currentProfile.id,
      initiativeId: joinTargetId,
      status: 'joined',
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast('انضممت بنجاح');
    closeModal('join-modal');
    await refreshInitiativesData();
  } catch (err) {
    showToast('حدث خطأ، حاول مرة أخرى', 'error');
    console.error(err);
  } finally {
    btn.disabled=false; btn.textContent='تأكيد الانضمام';
  }
}

window.initiativeActionLoadingId = null;
async function leaveInitiative(initiativeId) {
  if (!currentProfile) return;
  window.initiativeActionLoadingId = initiativeId;
  try {
    const snap = await db.collection('participations')
      .where('userId','==',currentProfile.id)
      .where('initiativeId','==',initiativeId)
      .get();
    if (snap.empty) {
      showToast('لم يتم العثور على مشاركة فعالة', 'warning');
      return;
    }
    for (const doc of snap.docs) {
      await db.collection('participations').doc(doc.id).delete();
    }
    showToast('تم الانسحاب من المبادرة');
    await refreshInitiativesData();
  } catch (err) {
    showToast('تعذر تنفيذ الانسحاب حالياً', 'error');
  } finally {
    window.initiativeActionLoadingId = null;
  }
}

async function initMyInitiativesPage() {
  if (!document.getElementById('my-created-list')) return;
  hydrateCreateInitiativeCities();
  document.getElementById('my-open-create-btn')?.addEventListener('click', openCreateInitiativeModal);
  document.getElementById('create-initiative-form')?.addEventListener('submit', handleCreateInitiative);
  if (!currentProfile) {
    promptAuthRequired({
      title: 'مشاركاتي تحتاج حساباً',
      message: 'هذه الصفحة تعرض مبادراتك ومشاركاتك الشخصية. سجّل دخولك أو أنشئ حساباً حتى تظهر بياناتك هنا.'
    });
    renderMyCreatedInitiatives([]);
    renderMyJoinedInitiativesPage([]);
    setTextContent('summary-created', 0);
    setTextContent('summary-joined', 0);
    setTextContent('summary-attended', 0);
    setTextContent('summary-created-top', 0);
    setTextContent('summary-joined-top', 0);
    setTextContent('summary-attended-top', 0);
    return;
  }
  await refreshMyInitiativesPage(currentProfile);
}

async function refreshMyInitiativesPage(profile = currentProfile) {
  if (!profile) return;

  const [createdSnap, participationsSnap, initiativesSnap] = await Promise.all([
    db.collection('initiatives').where('createdBy', '==', profile.id).get(),
    db.collection('participations').where('userId', '==', profile.id).get(),
    db.collection('initiatives').where('status', '==', 'approved').get()
  ]);

  let allApproved = [];
  initiativesSnap.forEach(doc => allApproved.push({ id: doc.id, ...doc.data() }));
  allApproved = await enrichInitiativesWithCreators(allApproved);

  let created = [];
  createdSnap.forEach(doc => created.push({ id: doc.id, ...doc.data() }));
  created = await enrichInitiativesWithCreators(created);
  created.sort((a, b) => ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

  const joined = [];
  participationsSnap.forEach(doc => {
    const data = doc.data();
    const initiative = allApproved.find(item => item.id === data.initiativeId);
    if (initiative) joined.push({ id: doc.id, ...data, initiative });
  });
  joined.sort((a, b) => ((b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0)));

  renderMyCreatedInitiatives(created);
  renderMyJoinedInitiativesPage(joined);

  const attendedCount = joined.filter(item => item.status === 'attended').length;
  setTextContent('summary-created', created.length);
  setTextContent('summary-joined', joined.length);
  setTextContent('summary-attended', attendedCount);
  setTextContent('summary-created-top', created.length);
  setTextContent('summary-joined-top', joined.length);
  setTextContent('summary-attended-top', attendedCount);
  setTextContent('tab-mine-count', created.length + joined.length);
}

async function renderMyCreatedInitiatives(items) {
  const list = document.getElementById('my-created-list');
  const empty = document.getElementById('my-created-empty');
  setTextContent('my-created-count', `${items.length} مبادرة`);
  if (!list || !empty) return;

  if (!items.length) {
    list.innerHTML = '';
    empty.classList.remove('hide');
    return;
  }

  empty.classList.add('hide');
  const cards = await Promise.all(items.map(async item => {
    const pSnap = await db.collection('participations').where('initiativeId','==',item.id).where('status','in',['joined','attended']).get();
    const count = pSnap.size;
    return `
      <article class="my-card">
        <div class="my-card-top">
          <div>
            <div class="my-card-title">${item.name}</div>
            <div class="my-card-meta">
              <span>${item.city || 'الأردن'}</span>
              <span>${item.date ? formatDate(item.date) : 'قريباً'}</span>
              <span>${item.time ? formatTime(item.time) : 'يحدد لاحقاً'}</span>
            </div>
          </div>
          <span class="mini-chip ${item.status === 'approved' ? 'primary' : ''}" ${item.status === 'cancelled' ? 'style="color:var(--danger)"' : ''}>${item.status === 'approved' ? 'معتمدة' : item.status === 'pending' ? 'قيد المراجعة' : item.status === 'cancelled' ? 'ملغاة' : 'مرفوضة'}</span>
        </div>
        ${item.description ? `<div class="my-card-desc">${item.description}</div>` : ''}
        <div class="chip-row">
          <span class="mini-chip">${count}${item.maxParticipants ? ` / ${item.maxParticipants}` : ''} مشارك</span>
          ${item.gender ? `<span class="mini-chip">${item.gender}</span>` : ''}
          <span class="mini-chip primary">${item.creationPoints ?? 30} نقطة</span>
          ${item.creatorPhone ? `<span class="mini-chip">تواصل: ${formatPhoneDisplay(item.creatorPhone)}</span>` : ''}
        </div>
        <div class="my-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openOwnedInitiativeDetails('${item.id}')">عرض</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="openMyInitiativeEditModal('${item.id}')">تعديل</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="requestDeleteMyInitiative('${item.id}')">حذف</button>
          ${item.status === 'approved' ? `<button type="button" class="btn btn-secondary btn-sm" onclick="openAttendanceModal('${item.id}','${item.name.replace(/'/g, "\\'")}')">الحضور والغياب</button>` : ''}
        </div>
      </article>`;
  }));
  list.innerHTML = cards.join('');
}

function renderMyJoinedInitiativesPage(items) {
  const list = document.getElementById('my-joined-list');
  const empty = document.getElementById('my-joined-empty');
  setTextContent('my-joined-count', `${items.length} مشاركة`);
  if (!list || !empty) return;
  if (!items.length) {
    list.innerHTML = '';
    empty.classList.remove('hide');
    return;
  }
  empty.classList.add('hide');
  const statusConfig = {
    attended: { label: 'حاضر', points: '+30', chipClass: 'success', cardClass: 'status-attended' },
    absent: { label: 'غايب', points: '-10', chipClass: 'danger', cardClass: 'status-absent' },
    joined: { label: 'معلّق', points: '0', chipClass: 'neutral', cardClass: 'status-joined' }
  };
  list.innerHTML = items.map(item => `
    <article class="my-card ${(statusConfig[item.status || 'joined'] || statusConfig.joined).cardClass}">
      <div class="my-card-top">
        <div>
          <div class="my-card-title">${item.initiative.name}</div>
          <div class="my-card-meta">
            ${item.initiative.city ? `<span>${item.initiative.city}</span>` : ''}
            <span>${item.initiative.date ? formatDate(item.initiative.date) : 'قريباً'}</span>
            <span>${item.joinedAt?.seconds ? `انضممت ${new Intl.DateTimeFormat('ar-JO-u-nu-latn', { day:'numeric', month:'long', year:'numeric' }).format(new Date(item.joinedAt.seconds * 1000))}` : 'مسجل'}</span>
          </div>
        </div>
        <span class="mini-chip ${(statusConfig[item.status || 'joined'] || statusConfig.joined).chipClass}">${(statusConfig[item.status || 'joined'] || statusConfig.joined).label}</span>
      </div>
      <div class="chip-row">
        <span class="mini-chip ${(statusConfig[item.status || 'joined'] || statusConfig.joined).chipClass} status-points-chip">${(statusConfig[item.status || 'joined'] || statusConfig.joined).points} نقطة</span>
        <span class="mini-chip primary">${item.initiative.creationPoints ?? 30} نقطة للحضور</span>
        ${item.initiative.creatorPhone ? `<span class="mini-chip">تواصل: ${formatPhoneDisplay(item.initiative.creatorPhone)}</span>` : ''}
      </div>
      <div class="my-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="openOwnedInitiativeDetails('${item.initiative.id}')">عرض المبادرة</button>
        ${item.status === 'joined' ? `<button type="button" class="btn btn-danger btn-sm" onclick="requestLeaveInitiative('${item.initiative.id}')">انسحاب</button>` : ''}
      </div>
    </article>
  `).join('');
}

async function openMyInitiativeEditModal(id) {
  const doc = await db.collection('initiatives').doc(id).get();
  if (!doc.exists) return showToast('المبادرة غير موجودة', 'error');
  const data = doc.data();
  if (currentProfile && data.createdBy !== currentProfile.id && currentProfile.role !== 'hero_admin') {
    showToast('لا تملك صلاحية تعديل هذه المبادرة', 'error');
    return;
  }
  const container = document.getElementById('my-edit-fields');
  container.innerHTML = `
    <div class="dash-modal-surface">
      <label class="field-label">اسم المبادرة</label>
      <input class="form-control" id="my-edit-name" value="${escapeHtml(data.name)}">
    </div>
    <div class="create-grid-2">
      <div class="dash-modal-surface">
        <label class="field-label">التاريخ</label>
        <input type="date" class="form-control" id="my-edit-date" value="${data.date || ''}">
      </div>
      <div class="dash-modal-surface">
        <label class="field-label">الوقت</label>
        <input type="time" class="form-control" id="my-edit-time" value="${data.time || ''}">
      </div>
    </div>
    <div class="create-grid-2">
      <div class="dash-modal-surface">
        <label class="field-label">المحافظة</label>
        <input class="form-control" id="my-edit-city" value="${data.city || ''}">
      </div>
      <div class="dash-modal-surface">
        <label class="field-label">الجنس المستهدف</label>
        <select class="form-control" id="my-edit-gender"><option ${data.gender==='ذكر'?'selected':''}>ذكر</option><option ${data.gender==='أنثى'?'selected':''}>أنثى</option><option ${data.gender==='الكل'?'selected':''}>الكل</option></select>
      </div>
    </div>
    <div class="dash-modal-surface">
      <label class="field-label">وصف المبادرة</label>
      <textarea class="form-control" id="my-edit-desc" rows="4">${escapeHtml(data.description || '')}</textarea>
    </div>
    <div class="create-grid-2">
      <div class="dash-modal-surface">
        <label class="field-label">الحد الأدنى للمشاركين</label>
        <input type="number" min="2" class="form-control" id="my-edit-min" value="${data.minParticipants || ''}">
      </div>
      <div class="dash-modal-surface">
        <label class="field-label">الحد الأقصى للمشاركين</label>
        <input type="number" class="form-control" id="my-edit-max" value="${data.maxParticipants || ''}">
      </div>
    </div>
    <div class="dash-modal-surface">
      <label class="field-label">نقاط الحضور</label>
      <input type="number" class="form-control" value="30" disabled>
    </div>
  `;
  openModal('my-edit-initiative-modal');
  document.getElementById('my-edit-initiative-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('my-edit-name').value.trim();
    const maxParticipants = parseInt(document.getElementById('my-edit-max').value, 10);
    const minParticipantsValue = document.getElementById('my-edit-min').value;
    const minParticipants = minParticipantsValue ? parseInt(minParticipantsValue, 10) : null;
    if (!name) {
      showToast('اكتب اسم المبادرة', 'error');
      return;
    }
    if (!Number.isFinite(maxParticipants) || maxParticipants < 2) {
      showToast('أدخل الحد الأقصى بشكل صحيح', 'error');
      return;
    }
    if (minParticipants !== null && (!Number.isFinite(minParticipants) || minParticipants < 2 || minParticipants > maxParticipants)) {
      showToast('راجع الحد الأدنى للمشاركين', 'error');
      return;
    }
    await db.collection('initiatives').doc(id).update({
      name,
      date: document.getElementById('my-edit-date').value,
      time: document.getElementById('my-edit-time').value,
      city: document.getElementById('my-edit-city').value,
      gender: document.getElementById('my-edit-gender').value,
      description: document.getElementById('my-edit-desc').value,
      minParticipants,
      maxParticipants,
      minAge: null,
      creationPoints: 30
    });
    showToast('تم تعديل المبادرة');
    closeModal('my-edit-initiative-modal');
    await refreshMyInitiativesPage();
    await refreshInitiativesData();
  };
}

async function deleteMyInitiative(id) {
  if (!confirm('هل تريد حذف هذه المبادرة؟')) return;
  await db.collection('initiatives').doc(id).delete();
  const parts = await db.collection('participations').where('initiativeId','==',id).get();
  parts.forEach(p => p.ref.delete());
  showToast('تم حذف المبادرة');
  await refreshMyInitiativesPage();
}

function clearCreateInitiativeErrors() {
  document.querySelectorAll('[id^="create-error-"]').forEach(el => { el.textContent = ''; });
}

function setCreateInitiativeError(name, message) {
  const el = document.getElementById(`create-error-${name}`);
  if (el) el.textContent = message;
}

async function handleCreateInitiative(e) {
  e.preventDefault();
  if (!currentProfile) {
    promptAuthRequired({
      title: 'إنشاء مبادرة يحتاج حساباً',
      message: 'سجّل دخولك أو أنشئ حساباً جديداً حتى نقدر نحفظ المبادرة باسمك ونرسلها للمراجعة.'
    });
    return;
  }

  const form = e.target;
  const getField = (fieldName) => form.elements.namedItem(fieldName);
  const nameInput = getField('name');
  const descriptionInput = getField('description');
  const startsAtInput = getField('startsAt');
  const cityInput = getField('city');
  const minParticipantsInput = getField('minParticipants');
  const maxParticipantsInput = getField('maxParticipants');
  const genderInput = getField('gender');

  const name = nameInput ? nameInput.value.trim() : '';
  const description = descriptionInput ? descriptionInput.value.trim() : '';
  const startsAt = startsAtInput ? startsAtInput.value : '';
  const city = cityInput ? cityInput.value : '';
  const minParticipants = minParticipantsInput ? minParticipantsInput.value : '';
  const maxParticipants = maxParticipantsInput ? maxParticipantsInput.value : '';
  const gender = genderInput ? (genderInput.value || 'الكل') : 'الكل';
  const submitBtn = document.getElementById('create-initiative-submit-btn');

  clearCreateInitiativeErrors();
  let valid = true;
  if (!name) { setCreateInitiativeError('name', 'اكتب اسم المبادرة'); valid = false; }
  if (!startsAt) { setCreateInitiativeError('startsAt', 'اختر تاريخ البداية'); valid = false; }
  if (!city) { setCreateInitiativeError('city', 'اختر المحافظة'); valid = false; }
  if (!maxParticipants || Number(maxParticipants) < 2) { setCreateInitiativeError('maxParticipants', 'أدخل حداً أقصى صحيحاً'); valid = false; }
  if (minParticipants && Number(minParticipants) < 2) { setCreateInitiativeError('minParticipants', 'الحد الأدنى يجب أن يكون 2 أو أكثر'); valid = false; }
  if (minParticipants && maxParticipants && Number(minParticipants) > Number(maxParticipants)) {
    setCreateInitiativeError('minParticipants', 'لا يمكن أن يتجاوز الحد الأدنى الحد الأقصى');
    valid = false;
  }
  if (!valid) return;

  const startDate = new Date(startsAt);
  const date = startDate.toISOString().slice(0, 10);
  const time = startsAt.slice(11, 16);
  const coords = cityCoords[city] || [31.9539, 35.9106];

  try {
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'جارٍ الإرسال...'; }
    await db.collection('initiatives').add({
      name,
      description,
      date,
      time,
      city,
      latitude: coords[0],
      longitude: coords[1],
      minParticipants: minParticipants ? Number(minParticipants) : null,
      maxParticipants: Number(maxParticipants),
      gender,
      minAge: null,
      creationPoints: 30,
      createdBy: currentProfile.id,
      createdByName: currentProfile.username,
      creatorPhone: currentProfile.phone || '',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('تم إرسال مبادرتك للمراجعة');
    form.reset();
    closeModal('create-initiative-modal');
    if (document.getElementById('my-created-list')) {
      await refreshMyInitiativesPage();
    }
    if (document.getElementById('section-create')) {
      await loadMyInitiatives();
      loadDashSection('my-initiatives');
    }
    await refreshInitiativesData();
  } catch (err) {
    showToast('تعذر إرسال المبادرة حالياً', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'إرسال للمراجعة'; }
  }
}

// ──────────────────────────────────────────────────────────────
// PAGE: dashboard.html
// ──────────────────────────────────────────────────────────────
let dashProfile = null;
let actionConfirmHandler = null;

function closeActionConfirmModal() {
  actionConfirmHandler = null;
  const input = document.getElementById('action-confirm-input');
  const submitBtn = document.getElementById('action-confirm-submit-btn');
  const wrap = document.getElementById('action-confirm-input-wrap');
  if (input) input.value = '';
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'تأكيد';
  }
  if (wrap) wrap.style.display = 'none';
  closeModal('action-confirm-modal');
}

function openActionConfirmModal({ title = 'تأكيد الإجراء', message = 'هل تريد المتابعة؟', confirmText = 'تأكيد', requireText = '', requireLabel = 'اكتب النص المطلوب', onConfirm } = {}) {
  const titleEl = document.getElementById('action-confirm-title');
  const messageEl = document.getElementById('action-confirm-message');
  const submitBtn = document.getElementById('action-confirm-submit-btn');
  const inputWrap = document.getElementById('action-confirm-input-wrap');
  const input = document.getElementById('action-confirm-input');
  const inputLabel = document.getElementById('action-confirm-label');

  if (!titleEl || !messageEl || !submitBtn) {
    if (typeof onConfirm === 'function') onConfirm();
    return;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;
  submitBtn.textContent = confirmText;
  submitBtn.disabled = false;

  if (requireText && inputWrap && input && inputLabel) {
    inputWrap.style.display = 'grid';
    input.value = '';
    inputLabel.textContent = requireLabel;
  } else if (inputWrap && input) {
    inputWrap.style.display = 'none';
    input.value = '';
  }

  actionConfirmHandler = async () => {
    if (requireText && input && input.value.trim() !== requireText) {
      showToast('النص المدخل غير مطابق', 'error');
      return;
    }
    try {
      submitBtn.disabled = true;
      await onConfirm?.();
      closeActionConfirmModal();
    } catch (err) {
      submitBtn.disabled = false;
      console.error(err);
    }
  };

  submitBtn.onclick = () => actionConfirmHandler && actionConfirmHandler();
  openModal('action-confirm-modal');
}

function requestLeaveInitiative(initiativeId) {
  openActionConfirmModal({
    title: 'تأكيد الانسحاب',
    message: 'سيتم إلغاء مشاركتك في هذه المبادرة الآن.',
    confirmText: 'تأكيد الانسحاب',
    onConfirm: () => leaveInitiative(initiativeId)
  });
}

function requestDeleteMyInitiative(id) {
  openActionConfirmModal({
    title: 'حذف المبادرة',
    message: 'سيتم حذف المبادرة مع المشاركات المرتبطة بها. هذا الإجراء نهائي.',
    confirmText: 'حذف المبادرة',
    onConfirm: () => deleteMyInitiative(id)
  });
}

function requestMarkAttendance(partId, userId, status) {
  const copy = {
    attended: ['تأكيد تسجيل الحضور', 'سيتم اعتماد حضور المتطوع الآن.', 'تسجيل الحضور'],
    absent: ['تأكيد تسجيل الغياب', 'سيتم اعتماد غياب المتطوع الآن.', 'تسجيل الغياب'],
    joined: ['إزالة الحالة', 'سيعود المتطوع إلى قائمة بانتظار التحديد.', 'إزالة الحالة']
  }[status] || ['تأكيد الإجراء', 'هل تريد المتابعة؟', 'تأكيد'];

  openActionConfirmModal({
    title: copy[0],
    message: copy[1],
    confirmText: copy[2],
    onConfirm: () => markAttendance(partId, userId, status)
  });
}

async function initDashboard() {
  if (!currentProfile) {
    promptAuthRequired({
      title: 'لوحة التحكم تحتاج حساباً',
      message: 'يمكنك مشاهدة الصفحة، لكن تعديل البيانات وإدارة المبادرات تحتاج تسجيل دخول أو إنشاء حساب.'
    });
    document.getElementById('dash-username').textContent = 'زائر';
    document.getElementById('dash-points').textContent = 0;
    document.getElementById('dash-username2').textContent = 'زائر';
    document.getElementById('dash-points2').textContent = 0;
    return;
  }
  dashProfile = currentProfile;
  document.getElementById('dash-username').textContent = dashProfile.username;
  document.getElementById('dash-points').textContent   = dashProfile.points ?? 0;

  loadDashSection('profile');
}

function loadDashSection(section) {
  if (!dashProfile) {
    promptAuthRequired({
      title: 'هذه الخدمة تحتاج حساباً',
      message: 'سجّل دخولك أو أنشئ حساباً جديداً حتى نعرض بياناتك ونحفظ التغييرات الخاصة بك.'
    });
    return;
  }
  document.querySelectorAll('.dashboard-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

  const loaders = {
    'profile': loadProfileSection,
    'my-initiatives': () => refreshMyInitiativesPage(dashProfile),
    'joined': () => refreshMyInitiativesPage(dashProfile),
    'create': setupCreateForm
  };
  if (loaders[section]) loaders[section]();
}

async function loadProfileSection() {
  const p = dashProfile;
  document.getElementById('edit-username').value  = p.username || '';
  document.getElementById('edit-city').value      = p.city || '';
  document.getElementById('edit-gender').value    = p.gender || '';
  document.getElementById('edit-phone').value     = p.phone || '';
  document.getElementById('edit-bio').value       = p.bio || '';
  document.getElementById('edit-github').value    = p.social?.github || '';
  document.getElementById('edit-linkedin').value  = p.social?.linkedin || '';
  const visibility = profileVisibility(p);
  document.getElementById('show-phone').checked   = !!visibility.phone;
  document.getElementById('show-city').checked    = !!visibility.city;
  document.getElementById('show-gender').checked  = !!visibility.gender;
  document.getElementById('show-age').checked     = !!visibility.age;
  document.getElementById('show-points').checked  = !!visibility.points;
  document.getElementById('show-bio').checked     = !!visibility.bio;
  document.getElementById('show-social').checked  = !!visibility.social;
  document.getElementById('show-history').checked = !!visibility.history;
  const publicLink = document.getElementById('public-profile-link');
  if (publicLink) publicLink.href = getProfileUrl(p.id, p.username);
  setupJordanPhoneInput(document.getElementById('edit-phone'));

  document.querySelectorAll('.dash-avatar-initial').forEach(el => {
    el.textContent = (p.username || '؟')[0].toUpperCase();
  });
}

async function saveProfile(e) {
  e.preventDefault();
  const city   = document.getElementById('edit-city').value;
  const gender = document.getElementById('edit-gender').value;
  const phone  = document.getElementById('edit-phone').value.trim();
  const bio    = document.getElementById('edit-bio').value;
  const github = normalizeExternalUrl(document.getElementById('edit-github').value, 'github.com');
  const linkedin = normalizeExternalUrl(document.getElementById('edit-linkedin').value, 'linkedin.com');
  const normalizedPhone = phone ? normalizeJordanPhone(phone) : '';

  if (phone && !normalizedPhone) { showToast('أدخل رقم هاتف صحيح بصيغة مدعومة مثل +962791234567', 'error'); return; }
  if (document.getElementById('edit-github').value.trim() && !github) { showToast('رابط GitHub غير صحيح', 'error'); return; }
  if (document.getElementById('edit-linkedin').value.trim() && !linkedin) { showToast('رابط LinkedIn غير صحيح', 'error'); return; }

  const visibility = {
    phone: document.getElementById('show-phone').checked,
    city: document.getElementById('show-city').checked,
    gender: document.getElementById('show-gender').checked,
    age: document.getElementById('show-age').checked,
    points: document.getElementById('show-points').checked,
    bio: document.getElementById('show-bio').checked,
    social: document.getElementById('show-social').checked,
    history: document.getElementById('show-history').checked
  };
  const payload = {
    city,
    gender,
    phone: normalizedPhone,
    bio,
    social: { github, linkedin },
    visibility
  };

  await db.collection('users').doc(dashProfile.id).update(payload);
  dashProfile = { ...dashProfile, ...payload };
  currentProfile = { ...currentProfile, ...payload };
  document.getElementById('edit-phone').value = normalizedPhone;
  showToast('تم حفظ التعديلات');
}

async function requestDeleteOwnAccount() {
  if (!dashProfile || !auth.currentUser) {
    promptAuthRequired();
    return;
  }
  openActionConfirmModal({
    title: 'حذف الحساب نهائياً',
    message: 'هذا الإجراء نهائي. سيتم حذف بياناتك الشخصية المرتبطة بالحساب.',
    confirmText: 'حذف الحساب',
    requireText: 'حذف حسابي',
    requireLabel: 'للتأكيد اكتب: حذف حسابي',
    onConfirm: async () => {
      try {
        const uid = dashProfile.id;
        const [participationsSnap, initiativesSnap] = await Promise.all([
          db.collection('participations').where('userId', '==', uid).get(),
          db.collection('initiatives').where('createdBy', '==', uid).get()
        ]);
        const batch = db.batch();
        participationsSnap.forEach(doc => batch.delete(doc.ref));
        initiativesSnap.forEach(doc => batch.update(doc.ref, {
          createdByName: 'مستخدم محذوف',
          creatorDeleted: true
        }));
        batch.delete(db.collection('users').doc(uid));
        await batch.commit();
        await auth.currentUser.delete();
        showToast('تم حذف الحساب');
        setTimeout(() => window.location.href = 'index.html', 800);
      } catch (err) {
        console.error(err);
        showToast('تعذر حذف الحساب. سجّل دخولك مرة ثانية ثم حاول من جديد.', 'error');
        throw err;
      }
    }
  });
}

async function loadMyInitiatives() {
  const container = document.getElementById('my-initiatives-list');
  if (!container) return;

  const snap = await db.collection('initiatives')
    .where('createdBy', '==', dashProfile.id)
    .get();

  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>لا توجد مبادرات بعد</h3><p>أنشئ مبادرتك الأولى!</p></div>`;
    return;
  }

  container.innerHTML = items.map(i => `
    <div class="card" style="padding:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px">
      <div>
        <div style="font-weight:700;font-family:'Cairo',sans-serif">${i.name}</div>
        <div style="font-size:0.85rem;color:var(--text-muted)">التاريخ: ${formatDate(i.date)} • المدينة: ${i.city}</div>
        <span class="initiative-badge badge-${i.status}" style="margin-top:6px">${
          {pending:'قيد المراجعة', approved:'مقبولة', rejected:'مرفوضة', cancelled:'ملغاة'}[i.status]
        }</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${i.status==='approved' ? `<button class="btn btn-secondary btn-sm" onclick="openAttendanceModal('${i.id}','${i.name.replace(/'/g,"\\'")}')">الحضور</button>` : ''}
        ${i.status==='pending' ? `<button class="btn btn-danger btn-sm" onclick="deleteInitiative('${i.id}')">حذف</button>` : ''}
      </div>
    </div>`).join('');
}

async function deleteInitiative(id) {
  if (!confirm('هل تريد حذف هذه المبادرة؟')) return;
  await db.collection('initiatives').doc(id).delete();
  showToast('تم حذف المبادرة');
  loadMyInitiatives();
}

async function loadJoinedInitiatives() {
  const container = document.getElementById('joined-list');
  const pSnap = await db.collection('participations').where('userId','==',dashProfile.id).get();
  const items = [];
  pSnap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>لم تنضم لأي مبادرة</h3><p>استكشف المبادرات وانضم!</p></div>`;
    return;
  }

  const rows = await Promise.all(items.map(async (p) => {
    const snap = await db.collection('initiatives').doc(p.initiativeId).get();
    const init = snap.exists ? snap.data() : null;
    if (!init) return '';
    const statusLabels = { joined: 'منضم', attended: 'حضر', absent: 'غائب' };
    const canCancel = p.status === 'joined' && new Date() < getStartTime(init.date, init.time);
    return `
      <div class="card" style="padding:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:10px">
        <div>
          <div style="font-weight:700">${init.name}</div>
          <div style="font-size:0.85rem;color:var(--text-muted)">التاريخ: ${formatDate(init.date)} • المدينة: ${init.city}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <span class="chip">${statusLabels[p.status] || p.status}</span>
          ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="cancelParticipation('${p.id}')">إلغاء</button>` : ''}
        </div>
      </div>`;
  }));
  container.innerHTML = rows.join('') || `<div class="empty-state"><h3>لا توجد مبادرات</h3></div>`;
}

async function cancelParticipation(partId) {
  if (!confirm('هل تريد إلغاء مشاركتك؟')) return;
  await db.collection('participations').doc(partId).delete();
  showToast('تم إلغاء المشاركة');
  loadJoinedInitiatives();
}

function setupCreateForm() {
  const form = document.getElementById('create-initiative-form');
  hydrateCreateInitiativeCities();
  if (form) form.onsubmit = handleCreateInitiative;
}

// ──────────────────────────────────────────────────────────────
// PAGE: profile.html
// ──────────────────────────────────────────────────────────────
async function initProfilePage() {
  const params = new URLSearchParams(window.location.search);
  const uidParam = params.get('id');
  const usernameParam = params.get('u');

  if (!uidParam && !usernameParam) { window.location.href = 'index.html'; return; }

  let snap = null;
  let uid = uidParam;
  if (usernameParam) {
    const userSnap = await db.collection('users').where('username', '==', usernameParam).limit(1).get();
    if (!userSnap.empty) {
      snap = userSnap.docs[0];
      uid = snap.id;
    }
  } else if (uidParam) {
    snap = await db.collection('users').doc(uidParam).get();
    if (!snap.exists) {
      const userSnap = await db.collection('users').where('username', '==', uidParam).limit(1).get();
      if (!userSnap.empty) {
        snap = userSnap.docs[0];
        uid = snap.id;
      }
    }
  }
  if (!snap || !snap.exists) { document.getElementById('profile-container').innerHTML = '<div class="empty-state"><h3>المستخدم غير موجود</h3></div>'; return; }

  const p = snap.data();
  const visibility = profileVisibility(p);
  if (p.username && window.location.search !== `?u=${encodeURIComponent(p.username)}`) {
    history.replaceState(null, '', getProfileUrl(uid, p.username));
  }
  document.getElementById('profile-initial').textContent = (p.username||'؟')[0].toUpperCase();
  document.getElementById('profile-username').textContent = p.username || 'مستخدم محذوف';
  const meta = [];
  if (visibility.age && p.birthdate) meta.push(`${calcAge(p.birthdate)} سنة`);
  if (visibility.gender && p.gender) meta.push(p.gender);
  if (visibility.city && p.city) meta.push(p.city);
  if (visibility.phone && p.phone) meta.push(p.phone);
  document.getElementById('profile-meta-line').textContent = meta.join(' • ');
  document.getElementById('profile-bio').textContent = visibility.bio && p.bio ? p.bio : 'اختار صاحب الحساب عدم إظهار النبذة حالياً.';
  const pointsCard = document.getElementById('profile-points-card');
  if (visibility.points) {
    document.getElementById('profile-points').textContent = p.points ?? 0;
    if (pointsCard) pointsCard.style.display = '';
  } else if (pointsCard) {
    pointsCard.style.display = 'none';
  }

  const social = p.social || {};
  const socialLinks = [];
  if (visibility.social && social.github) socialLinks.push(`<a href="${escapeHtml(social.github)}" target="_blank" rel="noopener">GitHub</a>`);
  if (visibility.social && social.linkedin) socialLinks.push(`<a href="${escapeHtml(social.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
  document.getElementById('profile-social-links').innerHTML = socialLinks.join('');

  const [createdSnap, joinedSnap] = await Promise.all([
    db.collection('initiatives').where('createdBy','==',uid).get(),
    db.collection('participations').where('userId','==',uid).get()
  ]);
  const createdItems = [];
  createdSnap.forEach(doc => { if (doc.data().status === 'approved') createdItems.push({ id: doc.id, ...doc.data() }); });
  const joinedRows = [];
  joinedSnap.forEach(doc => joinedRows.push({ id: doc.id, ...doc.data() }));
  const attendedCount = joinedRows.filter(row => row.status === 'attended').length;

  const createdContainer = document.getElementById('profile-created-initiatives');
  const joinedContainer = document.getElementById('profile-joined-initiatives');
  if (!visibility.history) {
    document.getElementById('profile-created-count').textContent = 'مخفي';
    document.getElementById('profile-joined-count').textContent  = 'مخفي';
    document.getElementById('profile-attended-count').textContent = 'مخفي';
    const hidden = `<div class="empty-state"><h3>السجل مخفي</h3><p>اختار صاحب الحساب عدم إظهار تاريخ المبادرات حالياً.</p></div>`;
    createdContainer.innerHTML = hidden;
    joinedContainer.innerHTML = hidden;
    return;
  }

  document.getElementById('profile-created-count').textContent = createdItems.length;
  document.getElementById('profile-joined-count').textContent  = joinedRows.length;
  document.getElementById('profile-attended-count').textContent = attendedCount;

  createdItems.sort((a, b) => `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`));
  createdContainer.innerHTML = createdItems.length === 0
    ? `<div class="empty-state"><h3>لا توجد مبادرات منشورة</h3></div>`
    : `<div class="profile-history-list">${createdItems.map(i => renderProfileHistoryItem(i, 'منشئ')).join('')}</div>`;

  const joinedItems = await Promise.all(joinedRows.map(async (row) => {
    const initSnap = await db.collection('initiatives').doc(row.initiativeId).get();
    return initSnap.exists ? { participation: row, initiative: { id: initSnap.id, ...initSnap.data() } } : null;
  }));
  const visibleJoined = joinedItems.filter(Boolean);
  joinedContainer.innerHTML = visibleJoined.length === 0
    ? `<div class="empty-state"><h3>لا توجد مشاركات ظاهرة</h3></div>`
    : `<div class="profile-history-list">${visibleJoined.map(({ participation, initiative }) => renderProfileParticipationHistoryItem(initiative, participation)).join('')}</div>`;
}

function renderProfileHistoryItem(item, status = '') {
  const statusLabels = {
    joined: 'منضم',
    attended: 'حضر',
    absent: 'غائب',
    'منشئ': 'أنشأها'
  };
  return `
    <article class="profile-history-item">
      <h4>${escapeHtml(item.name || 'مبادرة')}</h4>
      <div class="profile-history-meta">
        <span>${escapeHtml(item.city || 'الأردن')}</span>
        <span>${item.date ? formatDate(item.date) : 'موعد قريب'}</span>
        ${item.time ? `<span>${formatTime(item.time)}</span>` : ''}
        ${status ? `<span>${statusLabels[status] || escapeHtml(status)}</span>` : ''}
      </div>
    </article>`;
}

function getParticipationPointDelta(status) {
  if (status === 'attended') return 30;
  if (status === 'absent') return -10;
  return 0;
}

function renderProfileParticipationHistoryItem(item, participation = {}) {
  const status = participation.status || 'joined';
  const statusLabels = { joined: 'مسجل', attended: 'حضر', absent: 'غاب' };
  const delta = getParticipationPointDelta(status);
  const joinedDate = participation.joinedAt?.seconds
    ? new Intl.DateTimeFormat('ar-JO-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(participation.joinedAt.seconds * 1000))
    : '';
  return `
    <article class="profile-history-item">
      <h4>${escapeHtml(item.name || 'مبادرة')}</h4>
      <div class="profile-history-meta">
        <span>${escapeHtml(item.city || 'الأردن')}</span>
        <span>${item.date ? formatDate(item.date) : 'موعد قريب'}</span>
        ${item.time ? `<span>${formatTime(item.time)}</span>` : ''}
        <span class="${status === 'attended' ? 'history-good' : status === 'absent' ? 'history-bad' : ''}">${statusLabels[status] || escapeHtml(status)}</span>
        <span class="${delta > 0 ? 'history-good' : delta < 0 ? 'history-bad' : ''}">${delta > 0 ? '+' : ''}${delta} نقطة</span>
        ${joinedDate ? `<span>انضم ${joinedDate}</span>` : ''}
      </div>
    </article>`;
}

// ──────────────────────────────────────────────────────────────
// PAGE: attendance (inside dashboard)
// ──────────────────────────────────────────────────────────────
let attendanceInitiativeId = null;

function openAttendanceModal(id, name) {
  attendanceInitiativeId = id;
  document.getElementById('attendance-modal-name').textContent = name;
  loadAttendanceParticipants(id);
  openModal('attendance-modal');
}

async function loadAttendanceParticipants(initId) {
  const container = document.getElementById('attendance-list');
  container.innerHTML = '<div class="spinner"></div>';

  const pSnap = await db.collection('participations').where('initiativeId','==',initId).get();
  const items = [];
  pSnap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>لا يوجد مشاركون</h3></div>';
    return;
  }

  const rows = await Promise.all(items.map(async (p) => {
    const uSnap = await db.collection('users').doc(p.userId).get();
    const username = uSnap.exists ? uSnap.data().username : 'مستخدم محذوف';
    const initial  = username[0].toUpperCase();
    const status = p.status || 'joined';
    const card = `
      <div class="attendance-item">
        <div class="attendance-user">
          <div class="attendance-avatar">${initial}</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">${username}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">${status === 'attended' ? 'ضمن قائمة الحضور' : status === 'absent' ? 'ضمن قائمة الغياب' : 'بانتظار التحديد'}</div>
          </div>
        </div>
        <div class="attendance-actions">
          <button class="btn btn-sm" style="background:rgba(46,125,50,0.1);color:var(--success)" onclick="requestMarkAttendance('${p.id}','${p.userId}','attended')">حضر</button>
          <button class="btn btn-sm" style="background:rgba(229,57,53,0.1);color:var(--danger)" onclick="requestMarkAttendance('${p.id}','${p.userId}','absent')">غائب</button>
          <button class="btn btn-sm btn-secondary" onclick="requestMarkAttendance('${p.id}','${p.userId}','joined')">إزالة الحالة</button>
        </div>
      </div>`;
    return { status, card };
  }));
  const pending = rows.filter((row) => row.status === 'joined').map((row) => row.card).join('');
  const attended = rows.filter((row) => row.status === 'attended').map((row) => row.card).join('');
  const absent = rows.filter((row) => row.status === 'absent').map((row) => row.card).join('');

  const block = (title, hint, content) => `
    <section style="display:grid;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="font-family:'Cairo',sans-serif;font-weight:900">${title}</div>
        <div style="font-size:0.76rem;color:var(--text-muted)">${hint}</div>
      </div>
      ${content ? `<div class="attendance-list">${content}</div>` : `<div class="empty-state" style="padding:1rem"><p>${hint}</p></div>`}
    </section>
  `;

  container.innerHTML = `
    <div style="display:grid;gap:16px">
      ${block('بانتظار التسجيل', 'أشخاص لم تُحدد حالتهم بعد', pending)}
      ${block('قائمة الحضور', 'المتطوعون الذين تم اعتماد حضورهم', attended)}
      ${block('قائمة الغياب', 'المتطوعون الذين سُجلوا كغياب', absent)}
    </div>`;
}

async function markAttendance(partId, userId, status) {
  const prevSnap = await db.collection('participations').doc(partId).get();
  const prevStatus = prevSnap.data().status || 'joined';

  await db.collection('participations').doc(partId).update({ status });
  showToast(status === 'attended' ? 'تم تسجيل الحضور' : status === 'absent' ? 'تم تسجيل الغياب' : 'تمت إزالة حالة الحضور');

  let canAdjustPoints = currentProfile && currentProfile.role === 'hero_admin';
  if (!canAdjustPoints && currentProfile && attendanceInitiativeId) {
    const initiativeSnap = await db.collection('initiatives').doc(attendanceInitiativeId).get();
    canAdjustPoints = initiativeSnap.exists && initiativeSnap.data().createdBy === currentProfile.id;
  }

  if (canAdjustPoints) {
    const userSnap = await db.collection('users').doc(userId).get();
    let points = userSnap.data().points ?? 0;
    points -= getParticipationPointDelta(prevStatus);
    points += getParticipationPointDelta(status);
    points = Math.max(0, points);
    await db.collection('users').doc(userId).update({ points });
  } else {
    showToast('تم تحديث الحالة بدون تعديل النقاط لأنك لست مخولاً بإدارتها', 'warning');
  }

  if (attendanceInitiativeId) {
    loadAttendanceParticipants(attendanceInitiativeId);
  }
  if (document.getElementById('admin-user-history-modal')?.classList.contains('open')) {
    loadAdminUserHistory(userId);
    refreshAdminOverview();
    if (document.getElementById('admin-users')?.classList.contains('active') || !document.getElementById('admin-users')?.classList.contains('hidden')) {
      loadAllUsers();
    }
  }
}

// ──────────────────────────────────────────────────────────────
// PAGE: admin.html (FULL CONTROL)
// ──────────────────────────────────────────────────────────────
let adminProfile = null;

async function initAdminPage() {
  adminProfile = await requireAdmin();
  bindAdminFilters();
  await refreshAdminOverview();
  setupAdminCreateUserForm();
  loadAdminTab('stats');
}

function bindAdminFilters() {
  document.getElementById('admin-filter-status')?.addEventListener('change', refreshAdminOverview);
  document.getElementById('admin-filter-city')?.addEventListener('change', refreshAdminOverview);
  document.getElementById('admin-analytics-gender')?.addEventListener('change', refreshAdminOverview);
  document.getElementById('admin-analytics-city')?.addEventListener('change', refreshAdminOverview);
}

function resetAdminFilters() {
  const status = document.getElementById('admin-filter-status');
  const city = document.getElementById('admin-filter-city');
  const analyticsGender = document.getElementById('admin-analytics-gender');
  const analyticsCity = document.getElementById('admin-analytics-city');
  if (status) status.value = 'all';
  if (city) city.value = 'all';
  if (analyticsGender) analyticsGender.value = 'all';
  if (analyticsCity) analyticsCity.value = 'all';
  refreshAdminOverview();
}

async function refreshAdminOverview() {
  const statusFilter = document.getElementById('admin-filter-status')?.value || 'all';
  const cityFilter = document.getElementById('admin-filter-city')?.value || 'all';
  const analyticsGender = document.getElementById('admin-analytics-gender')?.value || 'all';
  const analyticsCity = document.getElementById('admin-analytics-city')?.value || 'all';

  const [initiativesSnap, usersSnap, rewardsSnap, frozenSnap, participationsSnap] = await Promise.all([
    db.collection('initiatives').get(),
    db.collection('users').get(),
    db.collection('rewards').get(),
    db.collection('users').where('status','==','frozen').get(),
    db.collection('participations').get()
  ]);

  let initiatives = initiativesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  if (!initiatives.length) {
    initiatives = [
      { id: 'demo-1', name: 'حملة تشجير مجتمعية', city: 'عمان', status: 'approved', maxParticipants: 25, date: new Date().toISOString() },
      { id: 'demo-2', name: 'دعم كبار السن', city: 'إربد', status: 'pending', maxParticipants: 18, date: new Date().toISOString() },
      { id: 'demo-3', name: 'تنظيف مساحة عامة', city: 'الزرقاء', status: 'rejected', maxParticipants: 30, date: new Date().toISOString() }
    ];
  }
  const cities = [...new Set(initiatives.map((item) => item.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'));
  const citySelect = document.getElementById('admin-filter-city');
  if (citySelect && citySelect.dataset.hydrated !== 'true') {
    citySelect.innerHTML = `<option value="all">كل المحافظات</option>${cities.map((city) => `<option value="${city}">${city}</option>`).join('')}`;
    citySelect.dataset.hydrated = 'true';
  } else if (citySelect) {
    const current = citySelect.value || 'all';
    citySelect.innerHTML = `<option value="all">كل المحافظات</option>${cities.map((city) => `<option value="${city}">${city}</option>`).join('')}`;
    citySelect.value = cities.includes(current) ? current : 'all';
  }

  const analyticsCitySelect = document.getElementById('admin-analytics-city');
  if (analyticsCitySelect && analyticsCitySelect.dataset.hydrated !== 'true') {
    analyticsCitySelect.innerHTML = `<option value="all">كل المحافظات</option>${cities.map((city) => `<option value="${city}">${city}</option>`).join('')}`;
    analyticsCitySelect.dataset.hydrated = 'true';
  } else if (analyticsCitySelect) {
    const currentAnalyticsCity = analyticsCitySelect.value || 'all';
    analyticsCitySelect.innerHTML = `<option value="all">كل المحافظات</option>${cities.map((city) => `<option value="${city}">${city}</option>`).join('')}`;
    analyticsCitySelect.value = cities.includes(currentAnalyticsCity) ? currentAnalyticsCity : 'all';
  }

  const filtered = initiatives.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (cityFilter !== 'all' && item.city !== cityFilter) return false;
    return true;
  });

  const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const analyticsUsers = users.filter((user) => {
    if (analyticsGender !== 'all' && user.gender !== analyticsGender) return false;
    if (analyticsCity !== 'all' && user.city !== analyticsCity) return false;
    return true;
  });

  const pendingCount = filtered.filter((item) => item.status === 'pending').length;
  const approvedCount = filtered.filter((item) => item.status === 'approved').length;
  const rejectedCount = filtered.filter((item) => item.status === 'rejected').length;
  const cancelledCount = filtered.filter((item) => item.status === 'cancelled').length;
  const totalCapacity = filtered.reduce((sum, item) => sum + Number(item.maxParticipants || 0), 0);
  const averageCapacity = filtered.length ? Math.round(totalCapacity / filtered.length) : 0;
  const totalPoints = users.reduce((sum, user) => sum + Number(user.points || 0), 0);
  const averagePoints = users.length ? Math.round(totalPoints / users.length) : 0;
  const topUser = users.slice().sort((a, b) => Number(b.points || 0) - Number(a.points || 0))[0];

  setTextContent('admin-stat-pending', pendingCount);
  setTextContent('admin-stat-approved', approvedCount);
  setTextContent('admin-stat-users', usersSnap.size);
  setTextContent('admin-stat-rewards', rewardsSnap.size);
  setTextContent('admin-stat-rejected', rejectedCount);
  setTextContent('admin-stat-cities', cities.length);

  const sideCard = document.getElementById('admin-extra-stats');
  if (sideCard) {
    sideCard.innerHTML = `
      <div class="admin-side-row"><span>المبادرات المرفوضة</span><strong>${rejectedCount}</strong></div>
      <div class="admin-side-row"><span>الحسابات المجمدة</span><strong>${frozenSnap.size}</strong></div>
      <div class="admin-side-row"><span>إجمالي المشاركات</span><strong>${participationsSnap.size}</strong></div>
      <div class="admin-side-row"><span>متوسط السعة</span><strong>${averageCapacity}</strong></div>
      <div class="admin-side-row"><span>المبادرات الملغاة</span><strong>${cancelledCount}</strong></div>
    `;
  }

  const cityChart = document.getElementById('admin-city-chart');
  if (cityChart) {
    const cityCounts = filtered.reduce((acc, item) => {
      const key = item.city || 'غير محددة';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const rows = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const allCityRows = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
    const maxValue = rows.length ? rows[0][1] : 1;
    setTextContent('admin-best-city', allCityRows[0] ? `${allCityRows[0][0]} (${allCityRows[0][1]})` : '--');
    setTextContent('admin-worst-city', allCityRows.length ? `${allCityRows[allCityRows.length - 1][0]} (${allCityRows[allCityRows.length - 1][1]})` : '--');
    cityChart.innerHTML = rows.length
      ? rows.map(([city, count]) => `
          <div class="admin-chart-row">
            <div class="admin-chart-meta"><span>${city}</span><strong>${count}</strong></div>
            <div class="admin-chart-track"><div class="admin-chart-fill" style="width:${Math.max(8, Math.round((count / maxValue) * 100))}%"></div></div>
          </div>
        `).join('')
      : `<div class="empty-state" style="padding:1rem"><p>لا توجد بيانات مطابقة للفلاتر الحالية.</p></div>`;
  }

  const ageBuckets = {
    '13-17': 0,
    '18-24': 0,
    '25-34': 0,
    '35+': 0
  };
  analyticsUsers.forEach((user) => {
    const age = user.birthdate ? calcAge(user.birthdate) : null;
    if (age === null || Number.isNaN(age)) return;
    if (age < 18) ageBuckets['13-17'] += 1;
    else if (age < 25) ageBuckets['18-24'] += 1;
    else if (age < 35) ageBuckets['25-34'] += 1;
    else ageBuckets['35+'] += 1;
  });

  const statusBuckets = {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    cancelled: cancelledCount
  };

  const participationBuckets = participationsSnap.docs.reduce((acc, doc) => {
    const status = doc.data().status || 'joined';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { joined: 0, attended: 0, absent: 0 });
  const participationRows = participationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const initiativeParticipationCounts = participationRows.reduce((acc, row) => {
    if (row.status !== 'attended') return acc;
    acc[row.initiativeId] = (acc[row.initiativeId] || 0) + 1;
    return acc;
  }, {});
  const scoredInitiatives = initiatives.map(item => ({
    ...item,
    attendedCount: initiativeParticipationCounts[item.id] || 0
  })).filter(item => item.status === 'approved');
  scoredInitiatives.sort((a, b) => b.attendedCount - a.attendedCount);
  const bestInitiative = scoredInitiatives[0];
  const worstInitiative = scoredInitiatives.length ? scoredInitiatives[scoredInitiatives.length - 1] : null;
  const attendedTotal = participationRows.filter(row => row.status === 'attended').length;
  const decidedTotal = participationRows.filter(row => row.status === 'attended' || row.status === 'absent').length;
  const attendanceRate = decidedTotal ? Math.round((attendedTotal / decidedTotal) * 100) : 0;

  setTextContent('admin-top-user', topUser ? `${topUser.username || 'مستخدم'} (${topUser.points || 0})` : '--');
  setTextContent('admin-average-points', averagePoints);
  setTextContent('admin-total-points', totalPoints);
  setTextContent('admin-best-initiative', bestInitiative ? `${bestInitiative.name || 'مبادرة'} (${bestInitiative.attendedCount})` : '--');
  setTextContent('admin-worst-initiative', worstInitiative ? `${worstInitiative.name || 'مبادرة'} (${worstInitiative.attendedCount})` : '--');
  setTextContent('admin-attendance-rate', `${attendanceRate}%`);

  const roleBuckets = users.reduce((acc, user) => {
    const role = user.role || (user.isAdmin ? 'admin' : 'user');
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, { user: 0, admin: 0 });
  const dateBuckets = initiatives.reduce((acc, item) => {
    const raw = item.date || item.starts_at || item.createdAt || item.created_at;
    const date = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null;
    const key = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('ar-JO', { month: 'short', day: 'numeric' })
      : 'غير محدد';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  setTextContent('admin-stat-roles', Object.keys(roleBuckets).filter(key => Number(roleBuckets[key] || 0) > 0).length);
  setTextContent('admin-stat-dates', Object.keys(dateBuckets).length);

  renderAdminBarChart('admin-age-chart', ageBuckets, {
    '13-17': '13 - 17',
    '18-24': '18 - 24',
    '25-34': '25 - 34',
    '35+': '35+'
  });
  renderAdminBarChart('admin-status-chart', statusBuckets, {
    pending: 'معلقة',
    approved: 'مقبولة',
    rejected: 'مرفوضة',
    cancelled: 'ملغاة'
  });
  renderAdminBarChart('admin-participation-chart', participationBuckets, {
    joined: 'مسجل',
    attended: 'حضر',
    absent: 'غاب'
  });
  renderAdminBarChart('admin-role-chart', roleBuckets, {
    user: 'مستخدم',
    admin: 'أدمن',
    hero: 'Hero'
  });
  renderAdminBarChart('admin-date-chart', dateBuckets);
}

function renderAdminBarChart(targetId, buckets, labels = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const entries = Object.entries(buckets);
  const maxValue = Math.max(1, ...entries.map(([, value]) => Number(value || 0)));
  target.innerHTML = entries.map(([key, value]) => `
    <div class="admin-chart-row">
      <div class="admin-chart-meta">
        <span>${labels[key] || key}</span>
        <strong>${value}</strong>
      </div>
      <div class="admin-chart-track">
        <div class="admin-chart-fill" style="width:${Math.max(value ? 10 : 0, Math.round((Number(value || 0) / maxValue) * 100))}%"></div>
      </div>
    </div>
  `).join('');
}

const DEMO_CITIES = ['عمّان', 'إربد', 'الزرقاء', 'العقبة', 'السلط', 'مادبا', 'الكرك', 'الطفيلة', 'معان', 'جرش', 'عجلون', 'المفرق'];
const DEMO_GENDERS = ['ذكر', 'أنثى'];
const DEMO_FIRST_NAMES = ['أحمد', 'محمد', 'عبدالله', 'يوسف', 'عمر', 'رامي', 'ياسر', 'محمود', 'ليان', 'نور', 'رنا', 'سارة', 'جنى', 'هند', 'مها', 'دانا'];
const DEMO_LAST_NAMES = ['الزعبي', 'المجالي', 'العزام', 'الحباشنة', 'الطراونة', 'الضمور', 'الحماد', 'الخرابشة', 'الروسان', 'النسور', 'الطراونة', 'الملقي', 'القضاة', 'الشناق', 'العبادي', 'الحديثي'];
const DEMO_INITIATIVE_TITLES = [
  'حملة تشجير الأحياء',
  'تنظيف الشواطئ',
  'دعم كبار السن',
  'مبادرة القراءة المجتمعية',
  'الفرصة الخضراء',
  'ورشة مهارات شبابية',
  'إعادة تدوير الأحياء',
  'مائدة رمضان',
  'دعم الطلبة',
  'تجهيز مكتبة مدرسية'
];
const DEMO_REWARD_TITLES = [
  'Zain Jordan - باقة بيانات',
  'Umniah - رصيد إضافي',
  'Orange Jordan - إنترنت مجاني',
  'Carrefour Jordan - قسيمة تسوق',
  'Talabat - رصيد طلبات',
  'Coffee Lab - قهوة مجانية',
  'Bookstore Jordan - خصم كتب',
  'Gym Jordan - اشتراك أسبوعي',
  'Cinema Jordan - تذكرتان',
  'Fresh Market - سلة خضار'
];

function buildDemoPhone(index) {
  const num = String(700000000 + (index * 731)).slice(-9);
  return `+962${num}`;
}

function buildDemoUsername(first, last, index) {
  return `${first.toLowerCase()}_${last.toLowerCase()}_${String(index).padStart(3, '0')}`.replace(/[\s،ء]/g, '');
}

async function seedAdminDemoData() {
  if (!currentProfile || (currentProfile.role !== 'hero_admin' && currentProfile.role !== 'admin')) {
    promptAuthRequired({
      title: 'تحتاج صلاحية أدمن',
      message: 'هذه العملية تحتاج حساب أدمن حتى نقدر نضيف البيانات التجريبية.'
    });
    return;
  }

  if (!confirm('سيتم إضافة 100 مستخدم و40 مبادرة و30 مكافأة تجريبية إلى Firebase. هل تريد المتابعة؟')) return;

  const users = [];
  for (let i = 1; i <= 100; i += 1) {
    const first = DEMO_FIRST_NAMES[(i - 1) % DEMO_FIRST_NAMES.length];
    const last = DEMO_LAST_NAMES[(i - 1) % DEMO_LAST_NAMES.length];
    const city = DEMO_CITIES[(i - 1) % DEMO_CITIES.length];
    const gender = DEMO_GENDERS[i % DEMO_GENDERS.length];
    const birthYear = 1992 + (i % 12);
    const birthMonth = String(((i - 1) % 12) + 1).padStart(2, '0');
    const birthDay = String(((i - 1) % 27) + 1).padStart(2, '0');
    users.push({
      id: `demo-user-${String(i).padStart(3, '0')}`,
      username: buildDemoUsername(first, last, i),
      displayName: `${first} ${last}`,
      birthdate: `${birthYear}-${birthMonth}-${birthDay}`,
      city,
      gender,
      phoneCountryCode: '+962',
      phone: buildDemoPhone(i),
      bio: `متطوع من ${city} مهتم بالمبادرات المجتمعية والعمل الميداني.`,
      social: {
        github: `github.com/${buildDemoUsername(first, last, i)}`,
        linkedin: `linkedin.com/in/${buildDemoUsername(first, last, i)}`
      },
      visibility: {
        phone: false,
        city: true,
        gender: true,
        age: true,
        points: true,
        bio: true,
        social: true,
        history: true
      },
      points: 120 + (i * 7),
      role: i % 25 === 0 ? 'hero_admin' : i % 12 === 0 ? 'admin' : 'user',
      status: 'active',
      createdByAdmin: currentProfile.id,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  const rewards = [];
  for (let i = 1; i <= 30; i += 1) {
    const brand = DEMO_REWARD_TITLES[(i - 1) % DEMO_REWARD_TITLES.length];
    rewards.push({
      id: `demo-reward-${String(i).padStart(3, '0')}`,
      title: brand,
      description: `مكافأة تجريبية رقم ${i} مرتبطة بعرض الموقع والأنشطة التطوعية.`,
      pointsCost: 90 + (i * 12),
      image_url: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  const initiatives = [];
  for (let i = 1; i <= 40; i += 1) {
    const creator = users[(i - 1) % users.length];
    const city = creator.city;
    const day = String(((i - 1) % 27) + 1).padStart(2, '0');
    const month = String(((i - 1) % 12) + 1).padStart(2, '0');
    const gender = i % 3 === 0 ? 'أنثى' : i % 3 === 1 ? 'ذكر' : 'الكل';
    const status = i % 9 === 0 ? 'pending' : i % 13 === 0 ? 'rejected' : 'approved';
    initiatives.push({
      id: `demo-initiative-${String(i).padStart(3, '0')}`,
      name: `${DEMO_INITIATIVE_TITLES[(i - 1) % DEMO_INITIATIVE_TITLES.length]} ${i}`,
      description: `مبادرة ميدانية رقم ${i} في ${city} تهدف إلى خلق أثر اجتماعي منظم ومناسب للشباب والمتطوعين.`,
      city,
      latitude: null,
      longitude: null,
      date: `2026-${month}-${day}`,
      time: `${String(8 + (i % 8)).padStart(2, '0')}:30`,
      gender,
      minAge: i % 4 === 0 ? 18 : 13,
      minParticipants: 3 + (i % 5),
      maxParticipants: 12 + (i % 10),
      creationPoints: 30,
      status,
      createdBy: creator.id,
      createdByName: creator.displayName,
      creatorPhone: creator.phone,
      participantsCount: 4 + (i % 8),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  const writeBatchChunks = async (collectionName, rows) => {
    const chunkSize = 380;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const batch = db.batch();
      rows.slice(i, i + chunkSize).forEach((row) => {
        const { id, ...data } = row;
        batch.set(db.collection(collectionName).doc(id), data, { merge: true });
      });
      await batch.commit();
    }
  };

  try {
    const wasDisabled = document.querySelector('[onclick="seedAdminDemoData()"]');
    if (wasDisabled) wasDisabled.disabled = true;
    showToast('جاري تعبئة البيانات التجريبية...', 'warning');
    await writeBatchChunks('users', users);
    await writeBatchChunks('rewards', rewards);
    await writeBatchChunks('initiatives', initiatives);
    showToast('تمت إضافة 100 مستخدم و40 مبادرة و30 مكافأة تجريبية');
    await refreshAdminOverview();
    loadAllUsers();
    loadPendingInitiatives();
    loadApprovedInitiatives();
    loadRewards();
  } catch (error) {
    console.error(error);
    showToast('تعذر إنشاء البيانات التجريبية', 'error');
  } finally {
    const btn = document.querySelector('[onclick="seedAdminDemoData()"]');
    if (btn) btn.disabled = false;
  }
}

function setupAdminCreateUserForm() {
  const form = document.getElementById('admin-create-user-form');
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';
  form.addEventListener('submit', createAdminManagedUser);
}

async function createAdminManagedUser(event) {
  event.preventDefault();
  const form = event.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const birthdate = form.birthdate.value;
  const city = form.city.value.trim();
  const gender = form.gender.value;
  const phoneRaw = form.phone.value.trim();
  const role = form.role.value;
  const points = Math.max(0, parseInt(form.points.value || '0', 10));
  const bio = form.bio.value.trim();
  const phone = phoneRaw ? normalizeJordanPhone(phoneRaw) : '';

  if (!username || username.length < 3) return showToast('اسم المستخدم يجب أن يكون 3 أحرف على الأقل', 'error');
  if (!password || password.length < 6) return showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
  if (!birthdate || calcAge(birthdate) < 13) return showToast('العمر يجب أن يكون 13 سنة أو أكثر', 'error');
  if (phoneRaw && !phone) return showToast('رقم الهاتف غير صحيح', 'error');

  const existing = await db.collection('users').where('username', '==', username).limit(1).get();
  if (!existing.empty) return showToast('اسم المستخدم مستخدم بالفعل', 'error');

  const button = form.querySelector('[type="submit"]');
  const previousText = button?.textContent;
  try {
    if (button) { button.disabled = true; button.textContent = 'جارٍ الإنشاء...'; }
    const appName = `admin-create-${Date.now()}`;
    const secondaryApp = firebase.initializeApp(firebaseConfig, appName);
    const secondaryAuth = secondaryApp.auth();
    const email = `${username.toLowerCase()}@himmah.jo`;
    const credential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(credential.user.uid).set({
      username,
      birthdate,
      city,
      gender,
      phone,
      phoneCountryCode: '+962',
      bio,
      social: { github: '', linkedin: '' },
      visibility: {
        phone: false,
        city: true,
        gender: true,
        age: true,
        points: true,
        bio: true,
        social: true,
        history: true
      },
      points,
      role,
      status: 'active',
      createdByAdmin: currentProfile?.id || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await secondaryAuth.signOut();
    await secondaryApp.delete();
    form.reset();
    form.points.value = 0;
    showToast(role === 'hero_admin' ? 'تم إنشاء حساب هيرو أدمن' : 'تم إنشاء المستخدم');
    refreshAdminOverview();
    loadAllUsers();
  } catch (error) {
    console.error(error);
    showToast('تعذر إنشاء الحساب. تأكد من صلاحيات Firebase Auth.', 'error');
  } finally {
    if (button) { button.disabled = false; button.textContent = previousText || 'إنشاء الحساب'; }
  }
}

function loadAdminTab(tab) {
  document.querySelectorAll('.admin-section-card').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-section-content').forEach(el => el.classList.add('hidden'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  const section = document.getElementById(`admin-${tab}`);
  if (section) section.classList.remove('hidden');

  const loaders = {
    stats: refreshAdminOverview,
    pending:  loadPendingInitiatives,
    approved: loadApprovedInitiatives,
    users:    loadAllUsers,
    'create-user': setupAdminCreateUserForm,
    rewards:  loadRewards,
    settings: () => {},
  };
  if (loaders[tab]) loaders[tab]();
}

// --- Pending Initiatives (with edit/delete)
async function loadPendingInitiatives() {
  const container = document.getElementById('pending-list');
  const snap = await db.collection('initiatives').where('status','==','pending').get();
  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>لا توجد مبادرات معلقة</h3></div>`;
    return;
  }

  container.innerHTML = `<table class="admin-table">
    <thead>
      <tr><th>الاسم</th><th>التاريخ</th><th>المدينة</th><th>المنشئ</th><th>تغيير الحالة</th><th>الإجراءات</th></tr>
    </thead>
    <tbody>${items.map(i => `
      <tr>
        <td><strong>${i.name}</strong><br><small style="color:var(--text-muted)">${(i.description || '').slice(0,60)}...</small></td>
        <td>${formatDate(i.date)}</td>
        <td>${i.city}</td>
        <td><a href="${getProfileUrl(i.createdBy, i.createdByName)}" style="color:var(--primary)">عرض</a></td>
        <td>
          <select class="admin-status-dropdown" data-id="${i.id}" data-current="pending" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-primary); color:var(--text-primary);">
            <option value="pending" ${i.status === 'pending' ? 'selected' : ''}>معلقة</option>
            <option value="approved" ${i.status === 'approved' ? 'selected' : ''}>مقبولة</option>
            <option value="rejected" ${i.status === 'rejected' ? 'selected' : ''}>مرفوضة</option>
            <option value="cancelled" ${i.status === 'cancelled' ? 'selected' : ''}>ملغاة</option>
          </select>
         </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editInitiative('${i.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInitiativeById('${i.id}')">حذف</button>
         </td>
      </tr>`).join('')}
    </tbody>
   </table>`;

  // إضافة مستمعي الأحداث للقوائم المنسدلة
  document.querySelectorAll('.admin-status-dropdown').forEach(select => {
    select.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      const initId = e.target.dataset.id;
      if (confirm(`هل تريد تغيير حالة المبادرة إلى "${newStatus === 'approved' ? 'مقبولة' : newStatus === 'rejected' ? 'مرفوضة' : newStatus === 'cancelled' ? 'ملغاة' : 'معلقة'}"؟`)) {
        await updateInitiativeStatus(initId, newStatus);
        await loadPendingInitiatives(); // إعادة تحميل القائمة بعد التحديث
        refreshAdminOverview();
      } else {
        // إعادة تعيين القيمة إلى الحالة الأصلية
        e.target.value = e.target.dataset.current;
      }
    });
    // حفظ الحالة الحالية لاستخدامها في الإلغاء
    select.dataset.current = select.value;
  });
}

async function updateInitiativeStatus(initiativeId, newStatus) {
  try {
    await db.collection('initiatives').doc(initiativeId).update({ status: newStatus });
    showToast(`تم تغيير حالة المبادرة إلى ${newStatus === 'approved' ? 'مقبولة' : newStatus === 'rejected' ? 'مرفوضة' : newStatus === 'cancelled' ? 'ملغاة' : 'معلقة'}`);
  } catch (error) {
    console.error(error);
    showToast('حدث خطأ أثناء تحديث الحالة', 'error');
  }
}

async function approveInitiative(id) {
  await db.collection('initiatives').doc(id).update({ status: 'approved' });
  showToast('تم قبول المبادرة');
  refreshAdminOverview();
  loadPendingInitiatives();
}
async function rejectInitiative(id) {
  await db.collection('initiatives').doc(id).update({ status: 'rejected' });
  showToast('تم رفض المبادرة');
  refreshAdminOverview();
  loadPendingInitiatives();
}

// --- Approved Initiatives (with edit/delete)
async function loadApprovedInitiatives() {
  const container = document.getElementById('approved-list');
  const snap = await db.collection('initiatives').where('status','in',['approved','cancelled']).get();
  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>لا توجد مبادرات حالية</h3></div>`;
    return;
  }

  container.innerHTML = `<table class="admin-table">
    <thead>
      <tr><th>الاسم</th><th>التاريخ</th><th>المدينة</th><th>الجنس</th><th>الحد</th><th>الحالة</th><th>تغيير الحالة</th><th>الإجراءات</th></tr>
    </thead>
    <tbody>${items.map(i => `
      <tr>
        <td><strong>${i.name}</strong></td>
        <td>${formatDate(i.date)}</td>
        <td>${i.city}</td>
        <td>${i.gender}</td>
        <td>${i.maxParticipants}</td>
        <td><span class="chip">${i.status === 'cancelled' ? 'ملغاة' : 'مقبولة'}</span></td>
        <td>
          <select class="admin-status-dropdown" data-id="${i.id}" data-current="${i.status}" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-primary); color:var(--text-primary);">
            <option value="pending" ${i.status === 'pending' ? 'selected' : ''}>معلقة</option>
            <option value="approved" ${i.status === 'approved' ? 'selected' : ''}>مقبولة</option>
            <option value="rejected" ${i.status === 'rejected' ? 'selected' : ''}>مرفوضة</option>
            <option value="cancelled" ${i.status === 'cancelled' ? 'selected' : ''}>ملغاة</option>
          </select>
         </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editInitiative('${i.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInitiativeById('${i.id}')">حذف</button>
         </td>
      </tr>`).join('')}
    </tbody>
   </table>`;

  // إضافة مستمعي الأحداث للقوائم المنسدلة
  document.querySelectorAll('.admin-status-dropdown').forEach(select => {
    select.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      const initId = e.target.dataset.id;
      if (confirm(`هل تريد تغيير حالة المبادرة إلى "${newStatus === 'approved' ? 'مقبولة' : newStatus === 'rejected' ? 'مرفوضة' : newStatus === 'cancelled' ? 'ملغاة' : 'معلقة'}"؟`)) {
        await updateInitiativeStatus(initId, newStatus);
        await loadApprovedInitiatives(); // إعادة تحميل القائمة بعد التحديث
        refreshAdminOverview();
      } else {
        e.target.value = e.target.dataset.current;
      }
    });
    select.dataset.current = select.value;
  });
}

// --- Users (complete edit/delete/freeze)
async function loadAllUsers() {
  const container = document.getElementById('users-list');
  const snap = await db.collection('users').get();
  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

  container.innerHTML = `<table class="admin-table">
    <thead><tr><th>المستخدم</th><th>المدينة</th><th>النقاط</th><th>الحالة</th><th>التاريخ</th><th>الإجراء</th></tr></thead>
    <tbody>${items.map(u => `
      <tr>
        <td><strong>${u.username}</strong></td>
        <td>${u.city||'-'} </td>
        <td style="color:var(--primary);font-weight:700">${u.points??0}</td>
        <td><span class="chip" style="background:${u.status==='frozen'?'rgba(229,57,53,0.12)':'rgba(46,125,50,0.12)'};color:${u.status==='frozen'?'var(--danger)':'var(--success)'}">
          ${u.status==='frozen'?'مجمّد':'نشط'}
        </span></td>
        <td><button class="btn btn-primary btn-sm" onclick="openAdminUserHistory('${u.id}')">تاريخ الحضور</button></td>
        <td>
          ${u.role !== 'hero_admin' ? `
            <button class="btn btn-secondary btn-sm" onclick="editUser('${u.id}')">تعديل</button>
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">حذف</button>
            <button class="btn btn-warning btn-sm" onclick="toggleFreeze('${u.id}','${u.status}')">
              ${u.status==='frozen'?'رفع التجميد':'تجميد'}
            </button>
          ` : '<span style="color:var(--text-muted);font-size:0.8rem">أدمن</span>'}
         </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

async function toggleFreeze(uid, currentStatus) {
  const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
  await db.collection('users').doc(uid).update({ status: newStatus });
  showToast(newStatus === 'frozen' ? 'تم تجميد المستخدم' : 'تم رفع التجميد');
  refreshAdminOverview();
  loadAllUsers();
}

let adminHistoryUserId = null;

async function openAdminUserHistory(uid) {
  adminHistoryUserId = uid;
  await loadAdminUserHistory(uid);
  openModal('admin-user-history-modal');
}

async function loadAdminUserHistory(uid = adminHistoryUserId) {
  if (!uid) return;
  const title = document.getElementById('admin-user-history-title');
  const summary = document.getElementById('admin-user-history-summary');
  const container = document.getElementById('admin-user-history-list');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';

  const [userSnap, participationSnap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('participations').where('userId', '==', uid).get()
  ]);
  const user = userSnap.exists ? { id: userSnap.id, ...userSnap.data() } : { username: 'مستخدم محذوف', points: 0 };
  if (title) title.textContent = `تاريخ ${user.username || 'مستخدم'}`;

  const rows = [];
  participationSnap.forEach(doc => rows.push({ id: doc.id, ...doc.data() }));
  const enriched = await Promise.all(rows.map(async (row) => {
    const initSnap = await db.collection('initiatives').doc(row.initiativeId).get();
    return {
      participation: row,
      initiative: initSnap.exists ? { id: initSnap.id, ...initSnap.data() } : null
    };
  }));

  const visible = enriched.filter(item => item.initiative);
  const attended = visible.filter(item => item.participation.status === 'attended').length;
  const absent = visible.filter(item => item.participation.status === 'absent').length;
  const pending = visible.filter(item => !item.participation.status || item.participation.status === 'joined').length;
  if (summary) {
    summary.innerHTML = `
      <span>${visible.length} مشاركة</span>
      <span>${attended} حضور</span>
      <span>${absent} غياب</span>
      <span>${pending} غير محدد</span>
      <span>${user.points ?? 0} نقطة حالية</span>
    `;
  }

  if (!visible.length) {
    container.innerHTML = `<div class="empty-state"><h3>لا يوجد تاريخ مشاركات لهذا المستخدم</h3></div>`;
    return;
  }

  visible.sort((a, b) => `${b.initiative.date || ''} ${b.initiative.time || ''}`.localeCompare(`${a.initiative.date || ''} ${a.initiative.time || ''}`));
  container.innerHTML = visible.map(({ participation, initiative }) => {
    const status = participation.status || 'joined';
    const delta = getParticipationPointDelta(status);
    const statusLabel = status === 'attended' ? 'حضر' : status === 'absent' ? 'غاب' : 'غير محدد';
    return `
      <article class="admin-history-item">
        <div>
          <h4>${escapeHtml(initiative.name || 'مبادرة')}</h4>
          <div class="admin-history-meta">
            <span>${escapeHtml(initiative.city || 'الأردن')}</span>
            <span>${initiative.date ? formatDate(initiative.date) : 'موعد قريب'}</span>
            ${initiative.time ? `<span>${formatTime(initiative.time)}</span>` : ''}
            <span class="${status === 'attended' ? 'history-good' : status === 'absent' ? 'history-bad' : ''}">${statusLabel}</span>
            <span class="${delta > 0 ? 'history-good' : delta < 0 ? 'history-bad' : ''}">${delta > 0 ? '+' : ''}${delta} نقطة</span>
          </div>
        </div>
        <div class="admin-history-actions">
          <button class="btn btn-sm" style="background:rgba(46,125,50,0.1);color:var(--success)" onclick="markAttendance('${participation.id}','${uid}','attended')">حضر</button>
          <button class="btn btn-sm" style="background:rgba(229,57,53,0.1);color:var(--danger)" onclick="markAttendance('${participation.id}','${uid}','absent')">غائب</button>
          <button class="btn btn-secondary btn-sm" onclick="markAttendance('${participation.id}','${uid}','joined')">إزالة الحضور</button>
        </div>
      </article>`;
  }).join('');
}

// --- Rewards (with edit/delete)
async function loadRewards() {
  const container = document.getElementById('rewards-admin-list');
  const snap = await db.collection('rewards').get();
  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

  const listHTML = items.length === 0
    ? '<p style="color:var(--text-muted);margin-bottom:20px">لا توجد مكافآت بعد</p>'
    : `<table class="admin-table" style="margin-bottom:20px">
        <thead><tr><th>المكافأة</th><th>التكلفة</th><th>الإجراء</th></tr></thead>
        <tbody>${items.map(r => `
          <tr>
            <td>${r.title}</td>
            <td>${r.pointsCost} نقطة</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="editReward('${r.id}')">تعديل</button>
              <button class="btn btn-danger btn-sm" onclick="deleteReward('${r.id}')">حذف</button>
            </td>
          </tr>`).join('')}
        </tbody>
       </table>`;

  container.innerHTML = listHTML + `
    <div class="card" style="padding:20px;max-width:400px">
      <h3 style="font-family:'Cairo',sans-serif;margin-bottom:16px">إضافة مكافأة جديدة</h3>
      <div class="form-group">
        <label class="form-label">اسم المكافأة</label>
        <input type="text" class="form-control" id="new-reward-title" placeholder="مثال: كوب قهوة مجاني">
      </div>
      <div class="form-group">
        <label class="form-label">النقاط المطلوبة</label>
        <input type="number" class="form-control" id="new-reward-points" min="1" placeholder="100">
      </div>
      <button class="btn btn-primary" onclick="addReward()">إضافة المكافأة</button>
    </div>`;
}

async function addReward() {
  const title      = document.getElementById('new-reward-title').value.trim();
  const pointsCost = parseInt(document.getElementById('new-reward-points').value);
  if (!title || !pointsCost || pointsCost < 1) { showToast('يرجى ملء الحقول', 'error'); return; }
  await db.collection('rewards').add({ title, pointsCost, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('تمت إضافة المكافأة');
  refreshAdminOverview();
  loadRewards();
}

async function deleteReward(id) {
  if (!confirm('حذف المكافأة نهائياً؟')) return;
  await db.collection('rewards').doc(id).delete();
  showToast('تم حذف المكافأة');
  refreshAdminOverview();
  loadRewards();
}

// =================== ADVANCED ADMIN EDIT/DELETE FUNCTIONS ===================

// Edit any initiative (full control)
async function editInitiative(id) {
  const doc = await db.collection('initiatives').doc(id).get();
  if (!doc.exists) return showToast('المبادرة غير موجودة', 'error');
  const data = doc.data();
  document.getElementById('modal-title').innerText = 'تعديل مبادرة';
  const container = document.getElementById('edit-fields');
  container.innerHTML = `
    <div class="form-group"><label>الاسم</label><input class="form-control" id="edit-name" value="${escapeHtml(data.name)}"></div>
    <div class="form-group"><label>التاريخ</label><input type="date" class="form-control" id="edit-date" value="${data.date}"></div>
    <div class="form-group"><label>الوقت</label><input type="time" class="form-control" id="edit-time" value="${data.time}"></div>
    <div class="form-group"><label>المدينة</label><input class="form-control" id="edit-city" value="${data.city}"></div>
    <div class="form-group"><label>الجنس</label><select class="form-control" id="edit-gender"><option ${data.gender==='ذكر'?'selected':''}>ذكر</option><option ${data.gender==='أنثى'?'selected':''}>أنثى</option><option ${data.gender==='الكل'?'selected':''}>الكل</option></select></div>
    <div class="form-group"><label>الوصف</label><textarea class="form-control" id="edit-desc">${escapeHtml(data.description || '')}</textarea></div>
    <div class="form-group"><label>الحد الأقصى</label><input type="number" class="form-control" id="edit-max" value="${data.maxParticipants}"></div>
    <div class="form-group"><label>الحالة</label><select class="form-control" id="edit-status"><option ${data.status==='pending'?'selected':''}>pending</option><option ${data.status==='approved'?'selected':''}>approved</option><option ${data.status==='rejected'?'selected':''}>rejected</option></select></div>
  `;
  openModal('admin-edit-modal');
  document.getElementById('edit-form').onsubmit = async (e) => {
    e.preventDefault();
    await db.collection('initiatives').doc(id).update({
      name: document.getElementById('edit-name').value,
      date: document.getElementById('edit-date').value,
      time: document.getElementById('edit-time').value,
      city: document.getElementById('edit-city').value,
      gender: document.getElementById('edit-gender').value,
      description: document.getElementById('edit-desc').value,
      maxParticipants: parseInt(document.getElementById('edit-max').value),
      status: document.getElementById('edit-status').value
    });
    showToast('تم تعديل المبادرة');
    closeModal('admin-edit-modal');
    refreshAdminOverview();
    refreshCurrentAdminTab();
  };
}

// Delete any initiative and its participations
async function deleteInitiativeById(id) {
  if (!confirm('هل أنت متأكد من حذف هذه المبادرة؟ لا يمكن التراجع.')) return;
  await db.collection('initiatives').doc(id).delete();
  const parts = await db.collection('participations').where('initiativeId','==',id).get();
  parts.forEach(p => p.ref.delete());
  showToast('تم حذف المبادرة وجميع مشاركاتها');
  refreshAdminOverview();
  refreshCurrentAdminTab();
}

// Edit any user (all fields)
async function editUser(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return;
  const data = doc.data();
  document.getElementById('modal-title').innerText = 'تعديل مستخدم';
  const container = document.getElementById('edit-fields');
  container.innerHTML = `
    <div class="form-group"><label>اسم المستخدم</label><input class="form-control" id="edit-username" value="${escapeHtml(data.username)}"></div>
    <div class="form-group"><label>تاريخ الميلاد</label><input type="date" class="form-control" id="edit-birthdate" value="${data.birthdate || ''}"></div>
    <div class="form-group"><label>المدينة</label><input class="form-control" id="edit-city" value="${data.city || ''}"></div>
    <div class="form-group"><label>الجنس</label><select class="form-control" id="edit-gender"><option ${data.gender==='ذكر'?'selected':''}>ذكر</option><option ${data.gender==='أنثى'?'selected':''}>أنثى</option></select></div>
    <div class="form-group"><label>رقم الهاتف</label><input type="tel" inputmode="tel" autocomplete="tel" class="form-control" id="edit-phone" value="${data.phone || ''}" placeholder="+96279XXXXXXX"></div>
    <div class="form-group"><label>نبذة</label><textarea class="form-control" id="edit-bio">${escapeHtml(data.bio || '')}</textarea></div>
    <div class="form-group"><label>النقاط</label><input type="number" class="form-control" id="edit-points" value="${data.points || 0}"></div>
    <div class="form-group"><label>الدور</label><select class="form-control" id="edit-role"><option ${data.role==='user'?'selected':''}>user</option><option ${data.role==='hero_admin'?'selected':''}>hero_admin</option></select></div>
    <div class="form-group"><label>الحالة</label><select class="form-control" id="edit-status"><option ${data.status==='active'?'selected':''}>active</option><option ${data.status==='frozen'?'selected':''}>frozen</option></select></div>
  `;
  openModal('admin-edit-modal');
  setupJordanPhoneInput(document.getElementById('edit-phone'));
  document.getElementById('edit-form').onsubmit = async (e) => {
    e.preventDefault();
    const phone = normalizeJordanPhone(document.getElementById('edit-phone').value);
    if (!phone) { showToast('أدخل رقم هاتف صحيح بصيغة مدعومة', 'error'); return; }
    await db.collection('users').doc(uid).update({
      username: document.getElementById('edit-username').value,
      birthdate: document.getElementById('edit-birthdate').value,
      city: document.getElementById('edit-city').value,
      gender: document.getElementById('edit-gender').value,
      phone,
      bio: document.getElementById('edit-bio').value,
      points: parseInt(document.getElementById('edit-points').value),
      role: document.getElementById('edit-role').value,
      status: document.getElementById('edit-status').value
    });
    showToast('تم تحديث بيانات المستخدم');
    closeModal('admin-edit-modal');
    refreshAdminOverview();
    refreshCurrentAdminTab();
  };
}

// Delete user completely (with all initiatives and participations)
async function deleteUser(uid) {
  if (!confirm(`حذف المستخدم سيؤدي لحذف كل مبادراته ومشاركاته نهائياً. متأكد؟`)) return;
  const initiatives = await db.collection('initiatives').where('createdBy','==',uid).get();
  for (const doc of initiatives.docs) {
    await doc.ref.delete();
    const parts = await db.collection('participations').where('initiativeId','==',doc.id).get();
    parts.forEach(p => p.ref.delete());
  }
  const participations = await db.collection('participations').where('userId','==',uid).get();
  participations.forEach(p => p.ref.delete());
  await db.collection('users').doc(uid).delete();
  showToast('تم حذف المستخدم بالكامل');
  refreshAdminOverview();
  refreshCurrentAdminTab();
}

// Edit reward
async function editReward(rewardId) {
  const doc = await db.collection('rewards').doc(rewardId).get();
  if (!doc.exists) return;
  const data = doc.data();
  document.getElementById('modal-title').innerText = 'تعديل مكافأة';
  const container = document.getElementById('edit-fields');
  container.innerHTML = `
    <div class="form-group"><label>اسم المكافأة</label><input class="form-control" id="edit-title" value="${escapeHtml(data.title)}"></div>
    <div class="form-group"><label>النقاط المطلوبة</label><input type="number" class="form-control" id="edit-points" value="${data.pointsCost}"></div>
  `;
  openModal('admin-edit-modal');
  document.getElementById('edit-form').onsubmit = async (e) => {
    e.preventDefault();
    await db.collection('rewards').doc(rewardId).update({
      title: document.getElementById('edit-title').value,
      pointsCost: parseInt(document.getElementById('edit-points').value)
    });
    showToast('تم تعديل المكافأة');
    closeModal('admin-edit-modal');
    refreshAdminOverview();
    refreshCurrentAdminTab();
  };
}

// Helper to refresh current admin tab
function refreshCurrentAdminTab() {
  const activeTab = document.querySelector('.admin-section-card.active')?.getAttribute('data-tab');
  refreshAdminOverview();
  if (activeTab) loadAdminTab(activeTab);
}

// Simple escape to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#039;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

// ──────────────────────────────────────────────────────────────
// PAGE: redeem.html
// ──────────────────────────────────────────────────────────────
async function initRedeemPage() {
  const user = currentProfile;
  document.getElementById('redeem-points').textContent = user ? (user.points ?? 0) : 0;

  let snap = null;
  try {
    snap = await db.collection('rewards').get();
  } catch (err) {
    console.warn('Could not load rewards from Firestore, using fallback rewards.', err);
  }
  const container = document.getElementById('rewards-list');
  const rewards = [];
  if (snap) {
    snap.forEach(doc => rewards.push({ id: doc.id, ...doc.data() }));
  }

  const rewardRows = rewards.length ? rewards : buildFallbackRewards();

  container.innerHTML = rewardRows.map((r, i) => `
    <div class="card reward-card">
      <div class="reward-icon">${String(i + 1).padStart(2, '0')}</div>
      <div class="reward-title">${r.title}</div>
      <div class="reward-points">${r.pointsCost} نقطة</div>
      <button class="btn btn-primary btn-sm btn-block" ${user && (user.points??0) < r.pointsCost ? 'disabled' : ''} onclick="redeemReward('${r.id}','${r.title}',${r.pointsCost})">
        ${!user ? 'سجّل للاستبدال' : (user.points??0) < r.pointsCost ? 'نقاط غير كافية' : 'استبدل الآن'}
      </button>
    </div>`).join('');
}

async function redeemReward(id, title, cost) {
  if (!currentProfile) {
    promptAuthRequired({
      title: 'استبدال المكافآت يحتاج حساباً',
      message: 'سجّل دخولك أو أنشئ حساباً حتى نعرف رصيد نقاطك ونكمل عملية الاستبدال.'
    });
    return;
  }
  if (!confirm(`هل تريد استبدال "${title}" بـ ${cost} نقطة؟`)) return;
  const userSnap = await db.collection('users').doc(currentProfile.id).get();
  const pts = userSnap.data().points ?? 0;
  if (pts < cost) { showToast('نقاطك غير كافية!', 'error'); return; }
  await db.collection('users').doc(currentProfile.id).update({ points: pts - cost });
  showToast(`تم استبدال "${title}" بنجاح`);
  document.getElementById('redeem-points').textContent = pts - cost;
}

// ── Error Helpers ─────────────────────────────────────────────
function showError(form, field, msg) {
  const input = form[field];
  if (!input) return;
  input.style.borderColor = 'var(--danger)';
  let err = input.nextElementSibling;
  if (!err || !err.classList.contains('form-error')) {
    err = document.createElement('div');
    err.className = 'form-error';
    input.after(err);
  }
  err.textContent = msg;
  err.classList.add('show');
}
function clearErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
  form.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '');
}

function translateAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'اسم المستخدم مستخدم بالفعل',
    'auth/weak-password':        'كلمة المرور ضعيفة جداً',
    'auth/wrong-password':       'كلمة المرور غير صحيحة',
    'auth/user-not-found':       'المستخدم غير موجود',
    'auth/too-many-requests':    'تم تجاوز المحاولات، حاول لاحقاً',
    'auth/network-request-failed': 'تحقق من اتصالك بالإنترنت',
  };
  return map[code] || 'حدث خطأ غير متوقع، حاول مرة أخرى';
}

// ── Default onPageLoad (overridden by each page) ──────────────
function onPageLoad() {}
