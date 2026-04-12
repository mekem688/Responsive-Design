/* ═══════════════════════════════════════════
   STATS — statistiques & historique des sessions
═══════════════════════════════════════════ */

function renderStats() {
  renderWeekChart();
  renderCatStats();
  renderSessionsList();
}

/* Graphique 7 jours */
function renderWeekChart() {
  var el = document.getElementById('week-chart');
  if (!el) return;

  var jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  var now   = new Date();
  var weekData = [];

  for (var i = 6; i >= 0; i--) {
    var d   = new Date(now);
    d.setDate(now.getDate() - i);
    var ds  = dateStr(d);
    var mins = Math.round(
      sessions
        .filter(function(s) { return s.date && s.date.startsWith(ds) && s.duration > 0; })
        .reduce(function(a, s) { return a + s.duration; }, 0) / 60
    );
    var jourIdx = (d.getDay() + 6) % 7; /* 0=lun */
    weekData.push({ label: jours[jourIdx], mins: mins, ds: ds });
  }

  var maxMin = Math.max(1, Math.max.apply(null, weekData.map(function(d) { return d.mins; })));

  el.innerHTML = weekData.map(function(d) {
    var isToday = d.ds === todayStr();
    var color   = isToday ? 'var(--orange)' : 'var(--blue)';
    var h       = Math.max(3, Math.round(d.mins / maxMin * 100));
    return '<div class="week-bar-wrap">' +
      '<div style="font-size:.62rem;color:var(--text-muted)">' + (d.mins ? d.mins + 'm' : '') + '</div>' +
      '<div class="week-bar-fill" style="height:' + h + 'px;background:' + color + '"></div>' +
      '<div class="week-bar-lbl">' + d.label + '</div>' +
    '</div>';
  }).join('');
}

/* Stats par catégorie */
function renderCatStats() {
  var el = document.getElementById('stats-cat');
  if (!el) return;

  var catSecs = {};
  sessions.forEach(function(s) {
    catSecs[s.category] = (catSecs[s.category] || 0) + s.duration;
  });
  var totalSec = Math.max(1, Object.values(catSecs).reduce(function(a, b) { return a + b; }, 0));
  var cats     = Object.keys(catSecs).sort(function(a, b) { return catSecs[b] - catSecs[a]; });

  if (!cats.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div><p>Aucune donnée</p></div>'; return; }

  el.innerHTML = cats.map(function(cat) {
    var pct = Math.round(catSecs[cat] / totalSec * 100);
    return '<div class="cat-bar-wrap">' +
      '<div class="cat-bar-head"><span>' + (CAT_LABELS[cat] || cat) + '</span><span>' + fmtDuration(catSecs[cat]) + ' (' + pct + '%)</span></div>' +
      '<div class="cat-bar-bg"><div class="cat-bar-fill" style="width:' + pct + '%;background:' + (CAT_COLORS[cat] || 'var(--blue)') + '"></div></div>' +
    '</div>';
  }).join('');
}

/* Liste des sessions */
function renderSessionsList() {
  var el = document.getElementById('sessions-list');
  if (!el) return;

  if (!sessions.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>Aucune session enregistrée</p></div>';
    return;
  }

  var icons = { pomodoro: '🍅', timed: '⏱', free: '🕐', manual: '✅' };
  el.innerHTML = sessions.slice(0, 50).map(function(s) {
    return '<div class="session-item">' +
      '<div class="session-icon" style="background:' + (CAT_COLORS[s.category] || '#4f8ef7') + '22;color:' + (CAT_COLORS[s.category] || '#4f8ef7') + '">' + (icons[s.type] || '📖') + '</div>' +
      '<div class="session-info">' +
        '<div class="session-title">' + escHtml(s.taskTitle || '—') + '</div>' +
        '<div class="session-meta">' + fmtDate(s.date) + ' · ' + (CAT_LABELS[s.category] || '—') + ' · ' + (s.type === 'pomodoro' ? 'Pomodoro' : s.type === 'timed' ? 'Minuté' : s.type === 'free' ? 'Chrono' : 'Manuel') + '</div>' +
      '</div>' +
      '<div class="session-dur">' + fmtDuration(s.duration) + '</div>' +
    '</div>';
  }).join('');
}
