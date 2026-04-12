/* ═══════════════════════════════════════════
   UTILS — fonctions utilitaires partagées
═══════════════════════════════════════════ */

/* ── Formatage ── */
function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

function fmtSec(s) {
  if (s < 0) s = 0;
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = Math.floor(s % 60);
  return h > 0 ? pad(h) + ':' + pad(m) + ':' + pad(sec) : pad(m) + ':' + pad(sec);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function fmtDateShort(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fmtDuration(secs) {
  var m = Math.round(secs / 60);
  return m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? pad(m % 60) : '') : m + 'm';
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function dateStr(d) { return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10); }

function timeToDate(str) {
  if (!str) return null;
  var parts = str.split(':');
  var d = new Date();
  d.setHours(+parts[0], +parts[1], +(parts[2] || 0), 0);
  return d;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── LocalStorage helpers ── */
function lsGet(k) {
  try { return localStorage.getItem(k); } catch(e) { return null; }
}
function lsSave(k, v) {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, String(v));
  } catch(e) {}
}

/* User-scoped storage (userId défini dans state.js) */
function uGet(k) { return lsGet('sp_' + (userId || 'anon') + '_' + k); }
function uSave(k, v) { lsSave('sp_' + (userId || 'anon') + '_' + k, v); }
function uGetJSON(k, def) { try { return JSON.parse(uGet(k)) || def; } catch(e) { return def; } }
function uSaveJSON(k, v) { uSave(k, JSON.stringify(v)); }

/* Global prefs (pas liées au user) */
function gGet(k) { return lsGet('sp_g_' + k); }
function gSave(k, v) { lsSave('sp_g_' + k, v); }

/* ── Audio ── */
function playBeep(freq, dur) {
  freq = freq || 880; dur = dur || 0.3;
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

/* ── Misc ── */
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function showMessage(msg, type) {
  var el = document.getElementById('message');
  if (!el) return;
  el.className = type || 'success';
  el.textContent = msg;
  clearTimeout(window._msgTimer);
  window._msgTimer = setTimeout(function() { el.className = ''; el.style.display = ''; }, 3000);
}
