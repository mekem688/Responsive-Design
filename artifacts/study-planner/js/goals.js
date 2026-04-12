/* ═══════════════════════════════════════════
   GOALS — objectifs quotidiens & hebdomadaires
═══════════════════════════════════════════ */

/* Sessions du jour (minutes) */
function getTodayMinutes() {
  var today = todayStr();
  return Math.round(
    sessions
      .filter(function(s) { return s.date && s.date.startsWith(today) && s.duration > 0; })
      .reduce(function(a, s) { return a + s.duration; }, 0) / 60
  );
}

/* Pomodoros de la semaine */
function getWeeklyPomoCount() {
  var now  = new Date();
  var day  = now.getDay() || 7; /* lundi = 1, dimanche = 7 */
  var monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return sessions.filter(function(s) {
    return s.type === 'pomodoro' && new Date(s.date) >= monday;
  }).length;
}

/* Rendu de la carte objectif journalier */
function renderDailyGoalCard() {
  var todayMin    = getTodayMinutes();
  var goalMin     = Math.round(dailyGoalHours * 60);
  var pct         = Math.min(100, Math.round(todayMin / Math.max(1, goalMin) * 100));

  var labelEl = document.getElementById('daily-goal-label');
  var barEl   = document.getElementById('daily-goal-bar');
  var textEl  = document.getElementById('daily-goal-text');

  if (labelEl) labelEl.textContent = 'Objectif : ' + dailyGoalHours + 'h par jour';
  if (barEl)   barEl.style.width   = pct + '%';
  if (textEl)  textEl.textContent  = todayMin + ' min étudiées / ' + goalMin + ' min objectif (' + pct + '%)';

  /* Rendu objectif hebdo */
  var weekPomos = getWeeklyPomoCount();
  var weekPct   = Math.min(100, Math.round(weekPomos / Math.max(1, weeklyGoalPomos) * 100));

  var wLabelEl = document.getElementById('weekly-goal-label');
  var wBarEl   = document.getElementById('weekly-goal-bar');
  var wTextEl  = document.getElementById('weekly-goal-text');

  if (wLabelEl) wLabelEl.textContent = 'Objectif : ' + weeklyGoalPomos + ' 🍅 / semaine';
  if (wBarEl)   wBarEl.style.width   = weekPct + '%';
  if (wTextEl)  wTextEl.textContent  = weekPomos + ' pomodoros / ' + weeklyGoalPomos + ' objectif (' + weekPct + '%)';
}

/* Ouvrir le modal objectifs */
function openGoalsModal() {
  document.getElementById('goal-daily-hours').value  = dailyGoalHours;
  document.getElementById('goal-weekly-pomos').value = weeklyGoalPomos;
  openModal('goals-modal');
}

/* Sauvegarder les objectifs */
function saveGoals() {
  var d = parseFloat(document.getElementById('goal-daily-hours').value) || 2;
  var w = parseInt(document.getElementById('goal-weekly-pomos').value)  || 20;
  dailyGoalHours  = Math.max(0.5, Math.min(16, d));
  weeklyGoalPomos = Math.max(1,   Math.min(200, w));
  uSave('goal_daily',       String(dailyGoalHours));
  uSave('goal_weekly_pomos', String(weeklyGoalPomos));
  closeModal('goals-modal');
  showMessage('Objectifs sauvegardés ! 🎯');
  renderDailyGoalCard();
}

/* Streak + sessions */
function updateStreak() {
  var today = todayStr();
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var yStr = dateStr(yesterday);

  if (streak.lastDate === today) return;
  streak.count    = (streak.lastDate === yStr) ? streak.count + 1 : 1;
  streak.lastDate = today;
  uSave('streak',      String(streak.count));
  uSave('streak_date', today);

  var el = document.getElementById('streak-num');
  if (el) el.textContent = streak.count;
}

function recordSession(task, duration, type) {
  if (!task || duration < 10) return;
  sessions.unshift({
    id:        Date.now(),
    taskId:    task.id,
    taskTitle: task.title,
    category:  task.category,
    duration:  duration,
    type:      type,
    date:      new Date().toISOString()
  });
  if (sessions.length > 300) sessions = sessions.slice(0, 300);
  uSaveJSON('sessions', sessions);
  renderDailyGoalCard();
}

function clearSessions() {
  if (!confirm('Effacer tout l\'historique de sessions ?')) return;
  sessions = [];
  uSaveJSON('sessions', []);
  renderStats();
  renderDashboard();
}
