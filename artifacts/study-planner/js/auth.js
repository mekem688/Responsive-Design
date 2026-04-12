/* ═══════════════════════════════════════════
   AUTH — connexion, inscription, déconnexion
═══════════════════════════════════════════ */

async function signup() {
  var email = document.getElementById('email').value.trim();
  var pass  = document.getElementById('password').value;
  if (!email || !pass) return showMessage('Email et mot de passe requis', 'error');

  var r = await fetch(SB_URL + '/auth/v1/signup', {
    method: 'POST',
    headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: pass })
  });
  var d = await r.json();
  if (d.access_token) {
    token  = d.access_token;
    userId = d.user.id;
    showMessage('Inscription réussie ! Bienvenue 🎉');
    afterLogin();
  } else {
    showMessage(d.msg || d.error_description || 'Erreur lors de l\'inscription', 'error');
  }
}

async function login() {
  var email = document.getElementById('email').value.trim();
  var pass  = document.getElementById('password').value;
  if (!email || !pass) return showMessage('Email et mot de passe requis', 'error');

  var r = await fetch(SB_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: pass })
  });
  var d = await r.json();
  if (d.access_token) {
    token  = d.access_token;
    userId = d.user.id;
    showMessage('Connecté ! Bonne session 📚');
    afterLogin();
  } else {
    showMessage(d.msg || d.error_description || 'Identifiants incorrects', 'error');
  }
}

function logout() {
  stopTimer();
  token  = null;
  userId = null;
  allTasks = [];
  sessions = [];
  document.getElementById('auth-section').style.display = 'flex';
  document.getElementById('app-section').style.display  = 'none';
}

function afterLogin() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('app-section').style.display  = 'block';

  loadUserState();
  requestNotifPerm();
  resetRecurringIfNewDay();
  loadTasks();
  startNotifLoop();

  var q = randomFrom(QUOTES);
  var qEl = document.getElementById('daily-quote');
  var aEl = document.getElementById('daily-quote-author');
  if (qEl) qEl.textContent = '"' + q.text + '"';
  if (aEl) aEl.textContent = '— ' + q.author;

  var poEl = document.getElementById('pomo-today-count');
  if (poEl) poEl.textContent = pomoToday + ' 🍅 aujourd\'hui';

  initAmbiance();
}

/* Remet à zéro les tâches récurrentes si on est un nouveau jour */
async function resetRecurringIfNewDay() {
  var lastReset = uGet('last_reset');
  var today = todayStr();
  if (lastReset === today) return;
  uSave('last_reset', today);
  if (!token || recurringIds.size === 0) return;

  for (var id of recurringIds) {
    await fetch(SB_URL + '/rest/v1/tasks?id=eq.' + id, {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ done: false })
    });
  }
}
