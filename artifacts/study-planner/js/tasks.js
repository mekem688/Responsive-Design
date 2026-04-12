/* ═══════════════════════════════════════════
   TASKS — CRUD, affichage, drag-drop, édition
═══════════════════════════════════════════ */

/* ── Supabase CRUD ── */

async function loadTasks() {
  var r = await fetch(SB_URL + '/rest/v1/tasks?order=start_time.asc', {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + token }
  });
  allTasks = await r.json();
  if (!Array.isArray(allTasks)) allTasks = [];
  renderTasks();
  renderDashboard();
  if (agendaViewTab === 'day') renderAgendaDay();
  checkBadges();
}

async function createTask() {
  var title = document.getElementById('new-task').value.trim();
  if (!title) return showMessage('Le titre est requis', 'error');

  var payload = {
    title:      title,
    start_time: document.getElementById('start-time').value || null,
    end_time:   document.getElementById('end-time').value   || null,
    category:   document.getElementById('category').value,
    priority:   document.getElementById('priority').value,
    user_id:    userId
  };

  var r = await fetch(SB_URL + '/rest/v1/tasks', {
    method:  'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (r.ok || r.status === 201) {
    var newTask = (await r.json())[0];
    if (newTask && document.getElementById('is-recurring').checked) {
      recurringIds.add(String(newTask.id));
      uSaveJSON('recurring', [...recurringIds]);
    }
    var notes = document.getElementById('new-notes').value.trim();
    if (newTask && notes) uSave('notes_' + newTask.id, notes);

    document.getElementById('new-task').value  = '';
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value   = '';
    document.getElementById('new-notes').value  = '';
    document.getElementById('is-recurring').checked = false;
    showMessage('Tâche ajoutée ! ✅');
    await loadTasks();
  } else {
    showMessage('Erreur lors de l\'ajout', 'error');
  }
}

async function updateTask(id, data) {
  await fetch(SB_URL + '/rest/v1/tasks?id=eq.' + id, {
    method:  'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

async function toggleTask(id, done) {
  await updateTask(id, { done: !done });
  if (!done) {
    /* tâche qu'on vient de compléter */
    updateStreak();
    var task = allTasks.find(function(t) { return String(t.id) === String(id); });
    recordSession(task, 0, 'manual');
    checkBadges();
  }
  await loadTasks();
}

async function deleteTask(id) {
  if (!confirm('Supprimer cette tâche ?')) return;
  await fetch(SB_URL + '/rest/v1/tasks?id=eq.' + id, {
    method:  'DELETE',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + token }
  });
  recurringIds.delete(String(id));
  uSaveJSON('recurring', [...recurringIds]);
  uSave('notes_' + id, null);
  uSave('subtasks_' + id, null);
  await loadTasks();
}

/* ── Édition ── */

function openEditModal(taskId) {
  var task = allTasks.find(function(t) { return String(t.id) === String(taskId); });
  if (!task) return;
  editingTaskId = String(taskId);

  document.getElementById('edit-task-id').value = taskId;
  document.getElementById('edit-title').value    = task.title || '';
  document.getElementById('edit-start').value    = task.start_time || '';
  document.getElementById('edit-end').value      = task.end_time   || '';
  document.getElementById('edit-category').value = task.category   || 'etude';
  document.getElementById('edit-priority').value = task.priority   || 'normale';
  document.getElementById('edit-notes').value    = uGet('notes_' + taskId) || '';
  document.getElementById('edit-recurring').checked = recurringIds.has(String(taskId));
  openModal('edit-modal');
}

async function saveTaskEdit() {
  var id    = document.getElementById('edit-task-id').value;
  var title = document.getElementById('edit-title').value.trim();
  if (!title) return showMessage('Titre requis', 'error');

  await updateTask(id, {
    title:      title,
    start_time: document.getElementById('edit-start').value    || null,
    end_time:   document.getElementById('edit-end').value      || null,
    category:   document.getElementById('edit-category').value,
    priority:   document.getElementById('edit-priority').value
  });

  /* Notes */
  var notes = document.getElementById('edit-notes').value.trim();
  if (notes) uSave('notes_' + id, notes); else uSave('notes_' + id, null);

  /* Récurrente */
  if (document.getElementById('edit-recurring').checked) {
    recurringIds.add(String(id));
  } else {
    recurringIds.delete(String(id));
  }
  uSaveJSON('recurring', [...recurringIds]);

  closeModal('edit-modal');
  showMessage('Tâche modifiée ! ✏️');
  await loadTasks();
}

/* ── Filtres & tri ── */

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderTasks();
}

function getSorted(tasks) {
  var sort = (document.getElementById('sort-select') || {}).value || 'time';
  var copy = tasks.slice();
  if (sort === 'time')     copy.sort(function(a,b) { return (a.start_time||'99:99').localeCompare(b.start_time||'99:99'); });
  if (sort === 'priority') copy.sort(function(a,b) { return (PRIO_SCORE[b.priority]||0) - (PRIO_SCORE[a.priority]||0); });
  if (sort === 'category') copy.sort(function(a,b) { return (a.category||'').localeCompare(b.category||''); });
  if (sort === 'custom') {
    copy.sort(function(a,b) {
      var ia = customOrder.indexOf(String(a.id));
      var ib = customOrder.indexOf(String(b.id));
      return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
    });
  }
  return copy;
}

/* ── Rendu ── */

function renderTasks() {
  var q = ((document.getElementById('search-input') || {}).value || '').toLowerCase();
  var filtered = allTasks.filter(function(t) {
    if (currentFilter === 'done'    && !t.done) return false;
    if (currentFilter === 'pending' &&  t.done) return false;
    if (q && !t.title.toLowerCase().includes(q)) return false;
    return true;
  });
  filtered = getSorted(filtered);

  var list = document.getElementById('tasks-list');
  if (!list) return;
  if (!filtered.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>Aucune tâche trouvée</p></div>';
    return;
  }

  list.innerHTML = filtered.map(function(t) {
    var subs    = getSubtasks(t.id);
    var subDone = subs.filter(function(s) { return s.done; }).length;
    var isRec   = recurringIds.has(String(t.id));
    var notes   = uGet('notes_' + t.id) || '';
    var prio    = t.priority || 'normale';
    var borderClass = t.done ? 'done' : (prio === 'haute' ? 'high' : 'pending');

    return '<div class="task-item ' + borderClass + '" draggable="true"' +
      ' data-id="' + t.id + '"' +
      ' ondragstart="dragStart(event)"' +
      ' ondragover="dragOver(event)"' +
      ' ondrop="dragDrop(event)"' +
      ' ondragend="dragEnd(event)">' +

      '<div class="task-header">' +
        '<div class="task-left">' +
          '<span class="task-drag" title="Glisser pour réordonner">⠿</span>' +
          '<span class="task-title' + (t.done ? ' done-text' : '') + '">' + escHtml(t.title) + '</span>' +
        '</div>' +
        '<div class="task-actions">' +
          (!t.done
            ? '<button class="btn-timer" onclick="openTimer(\'' + t.id + '\')">⏱</button>' +
              '<button class="btn-pomo"  onclick="openPomo(\'' + t.id + '\')">🍅</button>'
            : '') +
          '<button class="btn-sub"  onclick="openSubtasks(\'' + t.id + '\')">' +
            '📝' + (subs.length ? ' ' + subDone + '/' + subs.length : '') +
          '</button>' +
          '<button class="btn-edit" onclick="openEditModal(\'' + t.id + '\')">✏️</button>' +
          '<button class="' + (t.done ? 'btn-gray' : 'btn-success') + '" onclick="toggleTask(\'' + t.id + '\',' + t.done + ')">' +
            (t.done ? '↩' : '✅') +
          '</button>' +
          '<button class="btn-danger" onclick="deleteTask(\'' + t.id + '\')">🗑</button>' +
        '</div>' +
      '</div>' +

      '<div class="task-meta">' +
        (t.start_time ? '<span class="badge badge-time">⏰ ' + t.start_time + (t.end_time ? ' → ' + t.end_time : '') + '</span>' : '') +
        (t.category ? '<span class="badge badge-category">' + (CAT_LABELS[t.category] || t.category) + '</span>' : '') +
        (prio !== 'normale' ? '<span class="badge badge-' + prio + '">' + ({haute:'🔴',basse:'🟡'}[prio]||'') + ' ' + prio + '</span>' : '') +
        (isRec ? '<span class="badge badge-recur">🔁 Récurrente</span>' : '') +
        (notes ? '<span class="badge badge-notes">📝 Note</span>' : '') +
      '</div>' +

      (notes ? '<div class="task-notes-preview">' + escHtml(notes.slice(0, 80)) + (notes.length > 80 ? '…' : '') + '</div>' : '') +

    '</div>';
  }).join('');
}

/* ── Drag & Drop ── */

function dragStart(e) {
  dragSrcId = e.currentTarget.dataset.id;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.task-item').forEach(function(el) { el.classList.remove('drag-over'); });
  e.currentTarget.classList.add('drag-over');
}

function dragDrop(e) {
  e.preventDefault();
  var targetId = e.currentTarget.dataset.id;
  if (dragSrcId === targetId) return;
  var ids = [...document.querySelectorAll('.task-item')].map(function(el) { return el.dataset.id; });
  var si  = ids.indexOf(dragSrcId);
  var ti  = ids.indexOf(targetId);
  ids.splice(si, 1);
  ids.splice(ti, 0, dragSrcId);
  customOrder = ids;
  uSaveJSON('task_order', ids);
  var sel = document.getElementById('sort-select');
  if (sel) sel.value = 'custom';
  renderTasks();
}

function dragEnd(e) {
  document.querySelectorAll('.task-item').forEach(function(el) {
    el.classList.remove('dragging', 'drag-over');
  });
}

/* ── Export PDF ── */
function exportPDF() {
  document.body.setAttribute('data-print-date', new Date().toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long',year:'numeric'}));
  window.print();
}
