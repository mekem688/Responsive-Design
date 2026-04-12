/* ═══════════════════════════════════════════
   APP — init, routing, dark mode, notifs, PWA
═══════════════════════════════════════════ */

/* ── Navigation ── */
function showView(name, btn) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  var view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');
  if (btn)  btn.classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'tasks')     renderTasks();
  if (name === 'agenda')    renderAgenda();
  if (name === 'stats')     renderStats();
}

/* ── Dark mode ── */
function toggleDark() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var next   = !isDark;
  document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  document.getElementById('dark-btn').textContent = next ? '☀️' : '🌙';
  gSave('dark', next ? '1' : '0');
}

function initDark() {
  var d = gGet('dark');
  if (d === null) return;
  document.documentElement.setAttribute('data-theme', d === '1' ? 'dark' : 'light');
  var btn = document.getElementById('dark-btn');
  if (btn) btn.textContent = d === '1' ? '☀️' : '🌙';
}

/* ── Modals ── */
function openModal(id)  { var el = document.getElementById(id); if (el) el.classList.add('open'); }
function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); }
function handleOverlayClick(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

/* ── Browser Notifications ── */
function requestNotifPerm() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  var btn = document.getElementById('notif-btn');
  if (!btn) return;
  btn.title = Notification.permission === 'granted' ? 'Notifications actives' : 'Activer les notifications';
}

function startNotifLoop() {
  setInterval(checkNotifs, 30000);
}

function checkNotifs() {
  if (!token || !('Notification' in window) || Notification.permission !== 'granted') return;
  var now    = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();

  allTasks.filter(function(t) { return !t.done && t.start_time; }).forEach(function(t) {
    var parts   = t.start_time.split(':').map(Number);
    var taskMin = parts[0] * 60 + parts[1];
    var diff    = taskMin - nowMin;
    var key5    = String(t.id) + '_5';
    var key0    = String(t.id) + '_0';

    if (diff === 5 && !notifiedTasks.has(key5)) {
      notifiedTasks.add(key5);
      new Notification('📚 Dans 5 minutes', { body: t.title });
    }
    if (diff <= 0 && diff > -2 && !notifiedTasks.has(key0)) {
      notifiedTasks.add(key0);
      new Notification('🔔 C\'est l\'heure !', { body: t.title });
      playBeep(880, .3);
      setTimeout(function() { playBeep(1100, .3); }, 350);
    }
  });
}

/* ── PWA Service Worker ── */
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showMessage('Mise à jour disponible ! Rechargez la page.', 'success');
          }
        });
      });
    }).catch(function(err) {
      console.warn('SW non enregistré:', err);
    });
  }
}

/* ── Keyboard shortcuts ── */
function initKeyboard() {
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      ['timer-modal', 'subtask-modal', 'edit-modal', 'goals-modal', 'badges-modal'].forEach(closeModal);
    }
  });
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', function() {
  initDark();
  initState();
  initKeyboard();
  registerSW();

  /* Entrée par touche sur l'auth */
  var emailInput = document.getElementById('email');
  var passInput  = document.getElementById('password');
  if (emailInput) emailInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') login(); });
  if (passInput)  passInput.addEventListener('keydown',  function(e) { if (e.key === 'Enter') login(); });

  /* Sous-tâche : ajout par Enter */
  var subNew = document.getElementById('sub-new');
  if (subNew) subNew.addEventListener('keydown', function(e) { if (e.key === 'Enter') addSubtask(); });

  /* Nouvelle tâche : ajout par Ctrl+Enter */
  var newTask = document.getElementById('new-task');
  if (newTask) newTask.addEventListener('keydown', function(e) { if (e.key === 'Enter' && e.ctrlKey) createTask(); });
});
