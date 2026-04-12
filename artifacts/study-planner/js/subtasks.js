/* ═══════════════════════════════════════════
   SUBTASKS — sous-tâches par tâche (localStorage)
═══════════════════════════════════════════ */

function getSubtasks(taskId) {
  return uGetJSON('subtasks_' + taskId, []);
}

function saveSubtasks(taskId, arr) {
  uSaveJSON('subtasks_' + taskId, arr);
}

function openSubtasks(taskId) {
  currentSubTaskId = String(taskId);
  var task = allTasks.find(function(t) { return String(t.id) === String(taskId); });
  document.getElementById('sub-task-name').textContent = task ? task.title : 'Sous-tâches';
  document.getElementById('sub-new').value = '';
  renderSubtaskList();
  openModal('subtask-modal');
}

function renderSubtaskList() {
  var subs = getSubtasks(currentSubTaskId);
  var list = document.getElementById('subtask-list');
  if (!subs.length) {
    list.innerHTML = '<div class="empty" style="padding:16px"><div class="empty-icon">📋</div><p>Aucune sous-tâche</p></div>';
    return;
  }
  list.innerHTML = subs.map(function(s, i) {
    return '<div class="subtask-item">' +
      '<input class="subtask-check" type="checkbox"' + (s.done ? ' checked' : '') + ' onchange="toggleSub(' + i + ')"/>' +
      '<span class="subtask-text' + (s.done ? ' done' : '') + '">' + escHtml(s.text) + '</span>' +
      '<button class="subtask-del" onclick="deleteSub(' + i + ')">✕</button>' +
    '</div>';
  }).join('');
}

function addSubtask() {
  var txt = document.getElementById('sub-new').value.trim();
  if (!txt) return;
  var subs = getSubtasks(currentSubTaskId);
  subs.push({ id: Date.now(), text: txt, done: false });
  saveSubtasks(currentSubTaskId, subs);
  document.getElementById('sub-new').value = '';
  renderSubtaskList();
  renderTasks();
}

function toggleSub(i) {
  var subs = getSubtasks(currentSubTaskId);
  subs[i].done = !subs[i].done;
  saveSubtasks(currentSubTaskId, subs);
  renderSubtaskList();
  renderTasks();
}

function deleteSub(i) {
  var subs = getSubtasks(currentSubTaskId);
  subs.splice(i, 1);
  saveSubtasks(currentSubTaskId, subs);
  renderSubtaskList();
  renderTasks();
}
