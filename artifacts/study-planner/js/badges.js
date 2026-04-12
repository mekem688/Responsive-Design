/* ═══════════════════════════════════════════
   BADGES — gamification & récompenses
═══════════════════════════════════════════ */

function checkBadges() {
  var newOnes = [];

  BADGES_DEF.forEach(function(def) {
    if (unlockedBadges.indexOf(def.id) !== -1) return; /* déjà débloqué */

    var unlock = false;
    if (def.id === 'first_task')  unlock = sessions.some(function(s) { return s.type === 'manual'; });
    if (def.id === 'streak_3')    unlock = streak.count >= 3;
    if (def.id === 'streak_7')    unlock = streak.count >= 7;
    if (def.id === 'streak_30')   unlock = streak.count >= 30;
    if (def.id === 'tasks_10')    unlock = sessions.filter(function(s) { return s.type === 'manual'; }).length >= 10;
    if (def.id === 'tasks_50')    unlock = sessions.filter(function(s) { return s.type === 'manual'; }).length >= 50;
    if (def.id === 'pomo_10')     unlock = sessions.filter(function(s) { return s.type === 'pomodoro'; }).length >= 10;
    if (def.id === 'pomo_25')     unlock = sessions.filter(function(s) { return s.type === 'pomodoro'; }).length >= 25;
    if (def.id === 'study_5h')    unlock = sessions.reduce(function(a, s) { return a + s.duration; }, 0) >= 18000;
    if (def.id === 'study_20h')   unlock = sessions.reduce(function(a, s) { return a + s.duration; }, 0) >= 72000;

    if (unlock) {
      unlockedBadges.push(def.id);
      newOnes.push(def);
    }
  });

  if (newOnes.length) {
    uSaveJSON('badges', unlockedBadges);
    newOnes.forEach(function(b) {
      showMessage('🏅 Badge débloqué : ' + b.icon + ' ' + b.name);
    });
  }

  renderBadgesStrip();
}

function renderBadgesStrip() {
  var el = document.getElementById('badges-strip');
  if (!el) return;

  el.innerHTML = BADGES_DEF.map(function(b) {
    var unlocked = unlockedBadges.indexOf(b.id) !== -1;
    return '<div class="badge-chip' + (unlocked ? ' unlocked' : '') + '" title="' + escHtml(b.desc) + '">' +
      '<div class="badge-chip-icon">' + b.icon + '</div>' +
      '<div class="badge-chip-name">' + escHtml(b.name) + '</div>' +
    '</div>';
  }).join('');
}

function openBadgesModal() {
  var grid = document.getElementById('badges-grid');
  if (!grid) return;

  grid.innerHTML = BADGES_DEF.map(function(b) {
    var unlocked = unlockedBadges.indexOf(b.id) !== -1;
    return '<div class="badge-full' + (unlocked ? ' unlocked' : '') + '">' +
      '<div class="badge-full-icon">' + b.icon + '</div>' +
      '<div class="badge-full-name">' + escHtml(b.name) + '</div>' +
      '<div class="badge-full-desc">' + escHtml(b.desc) + '</div>' +
      (unlocked ? '<div style="font-size:.68rem;color:var(--green);margin-top:4px;font-weight:700">✅ Débloqué</div>' : '') +
    '</div>';
  }).join('');

  openModal('badges-modal');
}
