/* ═══════════════════════════════════════════
   SOUNDS — sons d'ambiance via Web Audio API
═══════════════════════════════════════════ */

var ambiCtx     = null;
var ambiNodes   = [];
var ambiCurrent = 'none';
var ambiGain    = null;
var ambiVol     = 0.4;

function initAudio() {
  if (!ambiCtx) {
    ambiCtx  = new (window.AudioContext || window.webkitAudioContext)();
    ambiGain = ambiCtx.createGain();
    ambiGain.gain.value = ambiVol;
    ambiGain.connect(ambiCtx.destination);
  }
}

function makeNoise(type) {
  var bufSize = ambiCtx.sampleRate * 3;
  var buf  = ambiCtx.createBuffer(1, bufSize, ambiCtx.sampleRate);
  var data = buf.getChannelData(0);
  var last = 0;
  for (var i = 0; i < bufSize; i++) {
    if (type === 'pink') {
      var w = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * w) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    } else {
      data[i] = Math.random() * 2 - 1;
    }
  }
  var src  = ambiCtx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;
  return src;
}

function makeFilter(type, freq, q) {
  var f = ambiCtx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q || 1;
  return f;
}

function setAmbiance(name, btn) {
  /* Arrêt des nodes existants */
  ambiNodes.forEach(function(n) { try { n.stop(); } catch(e) {} });
  ambiNodes = [];

  document.querySelectorAll('.amb-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');

  ambiCurrent = name;
  uSave('ambiance', name);

  if (name === 'none') return;

  initAudio();
  if (ambiCtx.state === 'suspended') ambiCtx.resume();

  if (name === 'rain') {
    /* Bruit rose filtré → pluie */
    var noise = makeNoise('pink');
    var lp    = makeFilter('lowpass', 900);
    var g     = ambiCtx.createGain(); g.gain.value = 1;
    noise.connect(lp); lp.connect(g); g.connect(ambiGain);
    noise.start();
    ambiNodes.push(noise);

  } else if (name === 'cafe') {
    /* Murmure de fond */
    var noise2 = makeNoise('pink');
    var lp2    = makeFilter('lowpass', 380);
    var g2     = ambiCtx.createGain(); g2.gain.value = 0.6;
    noise2.connect(lp2); lp2.connect(g2); g2.connect(ambiGain);
    noise2.start();
    ambiNodes.push(noise2);
    scheduleClinks();

  } else if (name === 'nature') {
    /* Vent / nature */
    var noise3 = makeNoise('pink');
    var bp     = makeFilter('bandpass', 700, 0.6);
    var g3     = ambiCtx.createGain(); g3.gain.value = 0.8;
    noise3.connect(bp); bp.connect(g3); g3.connect(ambiGain);
    noise3.start();
    ambiNodes.push(noise3);
    scheduleBirds();
  }
}

function scheduleClinks() {
  if (ambiCurrent !== 'cafe') return;
  var osc = ambiCtx.createOscillator();
  var g   = ambiCtx.createGain();
  osc.frequency.value = 1800 + Math.random() * 800;
  osc.connect(g); g.connect(ambiGain);
  g.gain.setValueAtTime(0, ambiCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.04, ambiCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ambiCtx.currentTime + 0.18);
  osc.start(); osc.stop(ambiCtx.currentTime + 0.18);
  setTimeout(scheduleClinks, 3000 + Math.random() * 8000);
}

function scheduleBirds() {
  if (ambiCurrent !== 'nature') return;
  var osc = ambiCtx.createOscillator();
  var g   = ambiCtx.createGain();
  var f   = 2200 + Math.random() * 1500;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f, ambiCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(f * 1.35, ambiCtx.currentTime + 0.2);
  osc.connect(g); g.connect(ambiGain);
  g.gain.setValueAtTime(0, ambiCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.06, ambiCtx.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, ambiCtx.currentTime + 0.4);
  osc.start(); osc.stop(ambiCtx.currentTime + 0.4);
  setTimeout(scheduleBirds, 6000 + Math.random() * 14000);
}

function setAmbianceVol(v) {
  ambiVol = parseFloat(v);
  if (ambiGain) ambiGain.gain.value = ambiVol;
}

function initAmbiance() {
  var saved = uGet('ambiance');
  if (saved && saved !== 'none') {
    var btn = document.querySelector('.amb-btn[data-name="' + saved + '"]');
    setAmbiance(saved, btn);
  }
  var vol = uGet('ambiance_vol');
  if (vol) {
    ambiVol = parseFloat(vol);
    var slider = document.getElementById('amb-vol');
    if (slider) slider.value = ambiVol;
  }
}
