/* ═══════════════════════════════════════════
   AGENDA — vue timeline jour + vue semaine
═══════════════════════════════════════════ */

function renderAgenda() {
  updateAgendaHeader();
  if (agendaViewTab === 'day') renderAgendaDay();
  else renderAgendaWeek();
}

function updateAgendaHeader() {
  var el = document.getElementById('agenda-date-display');
  if (!el) return;
  var isToday = dateStr(agendaDate) === todayStr();
  el.textContent = agendaDate.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  }) + (isToday ? ' (Aujourd\'hui)' : '');
}

function prevDay() { agendaDate.setDate(agendaDate.getDate() - 1); renderAgenda(); }
function nextDay() { agendaDate.setDate(agendaDate.getDate() + 1); renderAgenda(); }
function goToday() { agendaDate = new Date(); renderAgenda(); }

function switchAgendaTab(tab, btn) {
  agendaViewTab = tab;
  document.querySelectorAll('.agenda-tab').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.getElementById('timeline-day').style.display  = tab === 'day'  ? '' : 'none';
  document.getElementById('timeline-week').style.display = tab === 'week' ? '' : 'none';
  if (tab === 'day')  renderAgendaDay();
  if (tab === 'week') renderAgendaWeek();
}

/* ── Vue jour ── */
function renderAgendaDay() {
  var tl   = document.getElementById('timeline-day');
  if (!tl) return;
  tl.innerHTML = '';

  var isToday  = dateStr(agendaDate) === todayStr();
  var now      = new Date();
  var nowMin   = now.getHours() * 60 + now.getMinutes();

  var tasksWithTime = allTasks.filter(function(t) { return t.start_time; });
  var tasksNoTime   = allTasks.filter(function(t) { return !t.start_time; });

  for (var h = 6; h <= 23; h++) {
    var row = document.createElement('div');
    row.className = 'timeline-hour';

    var lbl = document.createElement('div');
    lbl.className   = 'timeline-hour-label';
    lbl.textContent = pad(h) + ':00';
    row.appendChild(lbl);

    var slot = document.createElement('div');
    slot.style.flex = '1';

    tasksWithTime.filter(function(t) {
      var parts = t.start_time.split(':');
      return parseInt(parts[0]) === h;
    }).forEach(function(t) {
      var div = document.createElement('div');
      var cls = 'tl-task';
      if (t.done)              cls += ' done';
      if (t.priority === 'haute') cls += ' high';
      div.className   = cls;
      div.textContent = t.start_time + ' ' + t.title;
      div.title       = t.title + (t.end_time ? ' → ' + t.end_time : '');
      div.onclick     = function() { openTimer(t.id); };
      slot.appendChild(div);
    });

    row.appendChild(slot);

    if (isToday && now.getHours() === h) {
      var line = document.createElement('div');
      line.className     = 'timeline-now-line';
      line.style.top     = Math.round((nowMin % 60) / 60 * 56) + 'px';
      line.style.position = 'absolute';
      row.style.position  = 'relative';
      row.appendChild(line);
    }

    tl.appendChild(row);
  }

  /* Tâches sans heure (en bas) */
  if (tasksNoTime.length && isToday) {
    var noTimeRow = document.createElement('div');
    noTimeRow.style.cssText = 'padding:10px 0;border-top:2px dashed var(--border);margin-top:8px';
    noTimeRow.innerHTML = '<div style="font-size:.72rem;font-weight:700;color:var(--text-muted);margin-bottom:8px">Sans heure définie</div>' +
      tasksNoTime.filter(function(t) { return !t.done; }).map(function(t) {
        return '<div class="tl-task" onclick="openTimer(\'' + t.id + '\')">' + escHtml(t.title) + '</div>';
      }).join('');
    tl.appendChild(noTimeRow);
  }

  /* Scroll vers maintenant */
  if (isToday) {
    var rows = tl.querySelectorAll('.timeline-hour');
    var idx  = now.getHours() - 6;
    if (rows[idx]) rows[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* ── Vue semaine ── */
function renderAgendaWeek() {
  var tl = document.getElementById('timeline-week');
  if (!tl) return;

  var jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  var now   = new Date();
  var day   = now.getDay() || 7;
  var monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  var weekTasks = allTasks.filter(function(t) { return t.start_time; });

  tl.innerHTML = '<div class="week-grid">' +
    [0,1,2,3,4,5,6].map(function(i) {
      var d     = new Date(monday);
      d.setDate(monday.getDate() + i);
      var isT   = dateStr(d) === todayStr();
      var label = jours[i] + ' ' + d.getDate();

      /* Pour cette démo, on montre les tâches sur chaque jour de la semaine
         (les tâches n'ont pas de date, donc on les répartit par heure/jour logique) */
      var dayTasks = i === (day - 1)
        ? weekTasks.filter(function(t) { return !t.done; })
        : (i < day - 1 ? weekTasks.filter(function(t) { return t.done; }).slice(0, 3) : []);

      return '<div class="week-col">' +
        '<div class="week-col-header' + (isT ? ' today' : '') + '">' + label + '</div>' +
        '<div class="week-col-tasks">' +
          (dayTasks.length
            ? dayTasks.slice(0, 5).map(function(t) {
                return '<div class="week-task' + (t.done ? ' done' : '') + '">' + escHtml(t.title) + '</div>';
              }).join('')
            : '<div style="font-size:.65rem;color:var(--border);padding:4px">—</div>'
          ) +
        '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}
