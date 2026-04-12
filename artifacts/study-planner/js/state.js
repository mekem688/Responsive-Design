/* ═══════════════════════════════════════════
   STATE — variables globales de l'application
═══════════════════════════════════════════ */

/* ── Auth ── */
var token  = null;
var userId = null;

/* ── Tasks ── */
var allTasks      = [];
var currentFilter = 'toutes';
var customOrder   = [];

/* ── Timer ── */
var timerTask     = null;
var timerInterval = null;
var timerPaused   = false;
var freeElapsed   = 0;
var freeStart     = null;
var timerMode     = 'normal'; /* 'normal' | 'pomo' */

/* ── Pomodoro ── */
var pomoCycle     = 0;
var pomoPhase     = 'work'; /* 'work' | 'short_break' | 'long_break' */
var pomoRemaining = POMO_WORK;
var pomoStart     = null;
var pomoToday     = 0;

/* ── Recurring tasks ── */
var recurringIds = new Set();

/* ── Streak ── */
var streak = { count: 0, lastDate: '' };

/* ── Sessions (historique) ── */
var sessions = [];

/* ── Badges débloqués ── */
var unlockedBadges = [];

/* ── Notifications ── */
var notifiedTasks = new Set();

/* ── Agenda navigation ── */
var agendaDate    = new Date(); /* jour affiché dans l'agenda */
var agendaViewTab = 'day';     /* 'day' | 'week' */

/* ── Goals ── */
var dailyGoalHours    = 2;
var weeklyGoalPomos   = 20;

/* ── Modals — contextes ── */
var currentSubTaskId = null;
var editingTaskId    = null;

/* ── Drag & drop ── */
var dragSrcId = null;

/* ── Init state depuis localStorage ── */
function initState() {
  /* Lit les données globales (avant auth) */
  var dark = gGet('dark');
  if (dark !== null) {
    document.documentElement.setAttribute('data-theme', dark === '1' ? 'dark' : 'light');
    var btn = document.getElementById('dark-btn');
    if (btn) btn.textContent = dark === '1' ? '☀️' : '🌙';
  }
}

/* Chargement des données utilisateur (après auth) */
function loadUserState() {
  /* Pomodoro du jour */
  var pd = uGet('pomo_date');
  if (pd === todayStr()) {
    pomoToday = parseInt(uGet('pomo_count') || '0');
  } else {
    pomoToday = 0;
    uSave('pomo_date', todayStr());
    uSave('pomo_count', '0');
  }

  /* Recurring */
  recurringIds = new Set(uGetJSON('recurring', []));

  /* Streak */
  var sc = parseInt(uGet('streak') || '0');
  var sd = uGet('streak_date') || '';
  streak = { count: sc, lastDate: sd };

  /* Sessions */
  sessions = uGetJSON('sessions', []);

  /* Badges */
  unlockedBadges = uGetJSON('badges', []);

  /* Custom order */
  customOrder = uGetJSON('task_order', []);

  /* Goals */
  dailyGoalHours  = parseFloat(uGet('goal_daily') || '2');
  weeklyGoalPomos = parseInt(uGet('goal_weekly_pomos') || '20');
}
