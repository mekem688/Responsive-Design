/* ═══════════════════════════════════════════
   DASHBOARD — vue principale
═══════════════════════════════════════════ */

function renderDashboard() {
  /* Compteurs */
  var total   = allTasks.length;
  var done    = allTasks.filter(function(t) { return t.done; }).length;
  var pending = total - done;
  var totalSec = sessions.reduce(function(a, s) { return a + s.duration; }, 0);

  var el = function(id) { return document.getElementById(id); };
  if (el('dash-total'))   el('dash-total').textContent   = total;
  if (el('dash-done'))    el('dash-done').textContent    = done;
  if (el('dash-pending')) el('dash-pending').textContent = pending;
  if (el('dash-time'))    el('dash-time').textContent    = fmtDuration(totalSec);
  if (el('streak-num'))   el('streak-num').textContent   = streak.count;

  renderCatProgress();
  renderTodayTasksCard();
  renderRecentSessionsCard();
  renderDailyGoalCard();
  renderBadgesStrip();
}

/* Barres de progression par catégorie */
function renderCatProgress() {
  var el = document.getElementById('cat-progress');
  if (!el) return;
  var cats = Object.keys(CAT_LABELS);

  el.innerHTML = cats.map(function(c) {
    var total2 = allTasks.filter(function(t) { return t.category === c; }).length;
    var done2  = allTasks.filter(function(t) { return t.category === c && t.done; }).length;
    var pct    = total2 ? Math.round(done2 / total2 * 100) : 0;
    return '<div class="cat-bar-wrap">' +
      '<div class="cat-bar-head"><span>' + CAT_LABELS[c] + '</span><span>' + done2 + '/' + total2 + ' (' + pct + '%)</span></div>' +
      '<div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + pct + '%;background:' + CAT_COLORS[c] + '"></div></div>' +
    '</div>';
  }).join('');
}

/* Tâches d'aujourd'hui (en attente) */
function renderTodayTasksCard() {
  var el = document.getElementById('today-tasks');
  if (!el) return;

  var pending = allTasks.filter(function(t) { return !t.done; }).slice(0, 6);
  if (!pending.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">✅</div><p>Tout est terminé !</p></div>';
    return;
  }
  el.innerHTML = pending.map(function(t) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:.78rem;flex:1;font-weight:600">' + escHtml(t.title) + '</span>' +
      (t.start_time ? '<span style="font-size:.7rem;color:var(--text-muted);flex-shrink:0">⏰ ' + t.start_time + '</span>' : '') +
      (t.priority === 'haute' ? '<span style="font-size:.7rem">🔴</span>' : '') +
    '</div>';
  }).join('');
}

/* Sessions récentes */
function renderRecentSessionsCard() {
  var el = document.getElementById('recent-sessions');
  if (!el) return;

  if (!sessions.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div><p>Aucune session enregistrée</p></div>';
    return;
  }
  var icons = { pomodoro: '🍅', timed: '⏱', free: '🕐', manual: '✅' };
  el.innerHTML = sessions.slice(0, 5).map(function(s) {
    return '<div class="session-item">' +
      '<div class="session-icon" style="background:' + (CAT_COLORS[s.category] || '#4f8ef7') + '22;color:' + (CAT_COLORS[s.category] || '#4f8ef7') + '">' + (icons[s.type] || '📖') + '</div>' +
      '<div class="session-info">' +
        '<div class="session-title">' + escHtml(s.taskTitle || '—') + '</div>' +
        '<div class="session-meta">' + fmtDate(s.date) + ' · ' + (CAT_LABELS[s.category] || '—') + '</div>' +
      '</div>' +
      '<div class="session-dur">' + fmtDuration(s.duration) + '</div>' +
    '</div>';
  }).join('');
}
