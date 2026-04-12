/* ═══════════════════════════════════════════
   TIMER — minuteur normal + mode Pomodoro
═══════════════════════════════════════════ */

function openTimer(taskId) {
  timerTask    = allTasks.find(function(t) { return String(t.id) === String(taskId); });
  if (!timerTask) return;
  timerPaused  = false;
  freeElapsed  = 0;
  freeStart    = null;
  timerMode    = 'normal';

  document.getElementById('t-title').textContent = timerTask.title;
  document.getElementById('mode-normal-btn').classList.add('active');
  document.getElementById('mode-pomo-btn').classList.remove('active');
  document.getElementById('pomo-cycles').style.display = 'none';

  if (!timerTask.start_time) freeStart = Date.now();
  startTimerLoop();
  openModal('timer-modal');
}

function openPomo(taskId) {
  timerTask = allTasks.find(function(t) { return String(t.id) === String(taskId); });
  if (!timerTask) return;
  document.getElementById('t-title').textContent = timerTask.title;
  setTimerMode('pomo');
  openModal('timer-modal');
}

function setTimerMode(mode) {
  timerMode = mode;
  document.getElementById('mode-normal-btn').classList.toggle('active', mode === 'normal');
  document.getElementById('mode-pomo-btn').classList.toggle('active',  mode === 'pomo');
  document.getElementById('pomo-cycles').style.display = mode === 'pomo' ? 'flex' : 'none';

  if (mode === 'pomo') {
    pomoCycle     = 0;
    pomoPhase     = 'work';
    pomoRemaining = POMO_WORK;
    pomoStart     = Date.now();
  } else {
    timerPaused = false;
    freeElapsed = 0;
    freeStart   = null;
    if (timerTask && !timerTask.start_time) freeStart = Date.now();
  }
  startTimerLoop();
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerTask     = null;
  closeModal('timer-modal');
  document.getElementById('float-bar').classList.remove('visible');
}

function pauseTimer() {
  if (timerPaused) return;
  timerPaused = true;
  if (freeStart !== null) { freeElapsed += Math.floor((Date.now() - freeStart) / 1000); freeStart = null; }
  renderTimerUI();
}

function resumeTimer() {
  if (!timerPaused) return;
  timerPaused = false;
  if (timerMode === 'normal' && timerTask && !timerTask.start_time) freeStart = Date.now();
  renderTimerUI();
}

function forceStart() {
  timerTask = Object.assign({}, timerTask, { start_time: null });
  freeStart   = Date.now();
  freeElapsed = 0;
  renderTimerUI();
}

function skipPomo() {
  if (pomoPhase === 'work') {
    pomoCycle++;
    pomoPhase = (pomoCycle % 4 === 0) ? 'long_break' : 'short_break';
  } else {
    pomoPhase = 'work';
  }
  pomoStart = Date.now();
  renderTimerUI();
}

function startTimerLoop() {
  clearInterval(timerInterval);
  renderTimerUI();
  timerInterval = setInterval(function() { if (!timerPaused) renderTimerUI(); }, 1000);
}

function getTimerPhase() {
  if (timerMode === 'pomo') return { phase: 'pomo' };
  if (!timerTask) return null;
  if (!timerTask.start_time) return { phase: 'free' };
  var now = new Date();
  var s   = timeToDate(timerTask.start_time);
  var e   = timerTask.end_time ? timeToDate(timerTask.end_time) : null;
  if (now < s)         return { phase: 'wait',   start: s, end: e };
  if (e && now > e)    return { phase: 'over' };
  return                      { phase: 'active', start: s, end: e };
}

function renderTimerUI() {
  if (!timerTask) return;
  var p = getTimerPhase();

  var display    = document.getElementById('t-display');
  var sub        = document.getElementById('t-sublabel');
  var ringFill   = document.getElementById('t-ring-fill');
  var ringWrap   = document.getElementById('t-ring-wrap');
  var phaseBadge = document.getElementById('t-phase-badge');
  var controls   = document.getElementById('t-controls');

  var timeStr = '--:--', subTxt = '', ringColor = '#4f8ef7', progress = 0;

  /* ──── POMODORO ──── */
  if (p.phase === 'pomo') {
    var elapsed = pomoStart ? Math.floor((Date.now() - pomoStart) / 1000) : 0;
    var total   = (pomoPhase === 'work') ? POMO_WORK : (pomoCycle % 4 === 3 ? POMO_LONG : POMO_SHORT);
    pomoRemaining = Math.max(0, total - elapsed);
    progress  = pomoRemaining / total;
    timeStr   = fmtSec(pomoRemaining);

    if (pomoPhase === 'work') {
      ringColor = '#ef4444'; subTxt = 'Concentration';
      phaseBadge.textContent = '🍅 Pomodoro'; phaseBadge.className = 'phase-badge phase-pomo';
    } else {
      ringColor = '#34c77b'; subTxt = 'Pause';
      phaseBadge.textContent = '☕ Pause'; phaseBadge.className = 'phase-badge phase-break';
    }

    renderPomoDots();
    ringWrap.classList.add('ring-active');
    controls.innerHTML =
      '<button class="btn-danger" onclick="stopTimer()">⏹ Arrêter</button>' +
      '<button class="btn-outline btn-sm" onclick="skipPomo()">Passer →</button>';

    if (pomoRemaining === 0) {
      if (pomoPhase === 'work') {
        pomoCycle++;
        pomoToday++;
        uSave('pomo_count', String(pomoToday));
        uSave('pomo_date', todayStr());
        var poEl = document.getElementById('pomo-today-count');
        if (poEl) poEl.textContent = pomoToday + ' 🍅 aujourd\'hui';
        recordSession(timerTask, POMO_WORK, 'pomodoro');
        playBeep(880, .3); setTimeout(function() { playBeep(1100, .3); }, 400);
        pomoPhase = (pomoCycle % 4 === 0) ? 'long_break' : 'short_break';
        showMessage(pomoCycle % 4 === 0 ? '🎉 Longue pause méritée !' : '☕ Pause bien méritée !');
        checkBadges();
      } else {
        pomoPhase = 'work';
        playBeep(660, .3);
        showMessage('💪 C\'est reparti !');
      }
      pomoStart = Date.now();
    }

  /* ──── FREE (chrono) ──── */
  } else if (p.phase === 'free') {
    if (!timerPaused && freeStart !== null) freeElapsed = Math.floor((Date.now() - freeStart) / 1000);
    timeStr  = fmtSec(freeElapsed);
    subTxt   = timerPaused ? 'En pause' : 'Temps écoulé';
    progress = Math.min(freeElapsed / 3600, 1);
    phaseBadge.textContent = '⏱ Chronomètre'; phaseBadge.className = 'phase-badge phase-free';
    ringWrap.classList.remove('ring-active');
    controls.innerHTML = timerPaused
      ? '<button class="btn-success" onclick="resumeTimer()">▶ Reprendre</button><button class="btn-danger" onclick="finishFree()">⏹ Terminer</button>'
      : '<button class="btn-pomo" onclick="pauseTimer()">⏸ Pause</button><button class="btn-danger" onclick="finishFree()">⏹ Terminer</button>';

  /* ──── EN ATTENTE ──── */
  } else if (p.phase === 'wait') {
    var diff  = Math.max(0, Math.floor((p.start - Date.now()) / 1000));
    timeStr   = fmtSec(diff); subTxt = 'avant le début'; ringColor = '#f59e0b';
    var tot   = Math.max(1, Math.floor((p.start - new Date(new Date().setHours(0,0,0,0))) / 1000));
    progress  = diff / tot;
    phaseBadge.textContent = '⏳ En attente'; phaseBadge.className = 'phase-badge phase-wait';
    ringWrap.classList.remove('ring-active');
    controls.innerHTML =
      '<button class="btn-timer" onclick="forceStart()">▶ Démarrer maintenant</button>' +
      '<button class="btn-danger" onclick="stopTimer()">✕</button>';
    if (diff === 0) { playBeep(880, .4); setTimeout(function() { playBeep(1100, .4); }, 350); }

  /* ──── EN COURS ──── */
  } else if (p.phase === 'active') {
    ringColor = '#34c77b';
    if (p.end) {
      var rem = Math.max(0, Math.floor((p.end - Date.now()) / 1000));
      var tot2 = Math.max(1, Math.floor((p.end - p.start) / 1000));
      timeStr  = fmtSec(rem); subTxt = timerPaused ? 'En pause' : 'Temps restant'; progress = rem / tot2;
      if (rem === 0) { playBeep(660, .5); setTimeout(function() { playBeep(440, .5); }, 400); recordSession(timerTask, tot2, 'timed'); }
    } else {
      var el2  = Math.max(0, Math.floor((Date.now() - p.start) / 1000));
      timeStr  = fmtSec(el2); subTxt = 'Temps écoulé'; progress = Math.min(el2 / 3600, 1);
    }
    phaseBadge.innerHTML = '<span class="notif-dot"></span> En cours';
    phaseBadge.className = 'phase-badge phase-active';
    ringWrap.classList.toggle('ring-active', !timerPaused);
    controls.innerHTML = timerPaused
      ? '<button class="btn-success" onclick="resumeTimer()">▶ Reprendre</button><button class="btn-danger" onclick="stopTimer()">⏹ Arrêter</button>'
      : '<button class="btn-pomo" onclick="pauseTimer()">⏸ Pause</button><button class="btn-danger" onclick="stopTimer()">⏹ Arrêter</button>';

  /* ──── TERMINÉ ──── */
  } else if (p.phase === 'over') {
    timeStr = '00:00'; subTxt = 'Terminé !'; ringColor = '#94a3b8'; progress = 0;
    phaseBadge.textContent = '✅ Terminé'; phaseBadge.className = 'phase-badge phase-done';
    ringWrap.classList.remove('ring-active');
    controls.innerHTML = '<button class="btn-gray" onclick="stopTimer()">Fermer</button>';
  }

  display.textContent = timeStr;
  sub.textContent     = subTxt;
  ringFill.style.stroke = ringColor;
  ringFill.style.strokeDashoffset = CIRC - (progress * CIRC);

  updateFloatBar(timeStr, p.phase);
}

function renderPomoDots() {
  for (var i = 0; i < 4; i++) {
    var dot = document.getElementById('pd' + i);
    if (!dot) continue;
    dot.className = 'pomo-dot';
    var cycleInRound = pomoCycle % 4;
    if (i < cycleInRound || (cycleInRound === 0 && pomoCycle > 0 && i < 4)) dot.classList.add('done');
    if (i === cycleInRound && pomoPhase === 'work') dot.classList.add('active');
  }
}

function updateFloatBar(timeStr, phase) {
  var bar = document.getElementById('float-bar');
  if (!timerTask) { bar.classList.remove('visible'); return; }
  bar.classList.add('visible');
  document.getElementById('float-phase').textContent = { wait:'⏳', pomo:'🍅', active:'▶', free:'⏱' }[phase] || '▶';
  document.getElementById('float-time').textContent  = timeStr || '--:--';
}

function finishFree() {
  if (freeElapsed > 30) recordSession(timerTask, freeElapsed, 'free');
  stopTimer();
  renderStats && renderStats();
}
