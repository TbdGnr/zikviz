/**
 * Zikviz - Music Visualizer
 * Le PNG réagit aux basses de la musique
 */

const DIMENSIONS = {
  '9-16': { width: 540, height: 960 },
  '16-9': { width: 960, height: 540 }
};

const FPS = 30;
const STORAGE_KEY = 'zikviz-settings';

// State
let canvas, ctx;
let bgColor = '#1a1a2e';
let bgColor2 = '#16213e';
let bgGradientType = 'radial';
let format = '9-16';
let pngImage = null;
let audioBuffer = null;
let audioContext = null;
let sourceNode = null;
let analyser = null;
let gainNode = null;
let mediaStreamDestination = null;
let isPlaying = false;
let isRecording = false;
let recorder = null;
let recordedChunks = [];
let animationId = null;
let bassSensitivity = 1.5;
let attackSpeed = 0.5;
let releaseSpeed = 0.12;
let shakeIntensity = 5;
let baseScale = 0.7;
let pulseRange = 0.25;
let waveClipMargin = 0;
let waveOrientation = 'vertical';
let waveColor = '#ffffff';
let waveAmplitude = 0.15;
let waveThickness = 2;
let waveGlow = 12;
let displayScale = 0.7;

// DOM
const bgColorInput = document.getElementById('bg-color');
const bgColor2Input = document.getElementById('bg-color-2');
const gradientTypeButtons = document.querySelectorAll('.gradient-type-buttons button');
const formatButtons = document.querySelectorAll('.format-buttons button');
const pngInput = document.getElementById('png-input');
const wavInput = document.getElementById('wav-input');
const pngName = document.getElementById('png-name');
const wavName = document.getElementById('wav-name');
const bassSensitivityInput = document.getElementById('bass-sensitivity');
const sensitivityValue = document.getElementById('sensitivity-value');
const attackSpeedInput = document.getElementById('attack-speed');
const attackValue = document.getElementById('attack-value');
const releaseSpeedInput = document.getElementById('release-speed');
const releaseValue = document.getElementById('release-value');
const shakeIntensityInput = document.getElementById('shake-intensity');
const shakeValue = document.getElementById('shake-value');
const baseScaleInput = document.getElementById('base-scale');
const baseScaleValue = document.getElementById('base-scale-value');
const pulseRangeInput = document.getElementById('pulse-range');
const pulseRangeValue = document.getElementById('pulse-range-value');
const waveClipMarginInput = document.getElementById('wave-clip-margin');
const waveClipValue = document.getElementById('wave-clip-value');
const waveOrientationButtons = document.querySelectorAll('.wave-orientation-buttons button');
const waveColorInput = document.getElementById('wave-color');
const waveAmplitudeInput = document.getElementById('wave-amplitude');
const waveAmplitudeValue = document.getElementById('wave-amplitude-value');
const waveThicknessInput = document.getElementById('wave-thickness');
const waveThicknessValue = document.getElementById('wave-thickness-value');
const waveGlowInput = document.getElementById('wave-glow');
const waveGlowValue = document.getElementById('wave-glow-value');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const exportBtn = document.getElementById('export-btn');
const statusEl = document.getElementById('status');
const webmInput = document.getElementById('webm-input');
const convertBtn = document.getElementById('convert-btn');

const exportLockElements = [
  bgColorInput, bgColor2Input, ...gradientTypeButtons, pngInput, wavInput, bassSensitivityInput,
  attackSpeedInput, releaseSpeedInput, shakeIntensityInput,
  baseScaleInput, pulseRangeInput, waveClipMarginInput,
  ...waveOrientationButtons, waveColorInput, waveAmplitudeInput, waveThicknessInput, waveGlowInput,
  playBtn, ...formatButtons
];

function saveSettings() {
  const settings = {
    bgColor, bgColor2, bgGradientType, format,
    bassSensitivity, attackSpeed, releaseSpeed, shakeIntensity,
    baseScale, pulseRange, waveClipMargin,
    waveOrientation, waveColor, waveAmplitude, waveThickness, waveGlow
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (_) {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);

    if (s.bgColor) { bgColor = s.bgColor; bgColorInput.value = bgColor; }
    if (s.bgColor2) { bgColor2 = s.bgColor2; bgColor2Input.value = bgColor2; }
    if (s.bgGradientType) {
      bgGradientType = s.bgGradientType;
      gradientTypeButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.gradient === bgGradientType);
      });
    }
    if (s.format) {
      format = s.format;
      formatButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.format === format);
      });
      resizeCanvas();
    }
    if (s.bassSensitivity != null) {
      bassSensitivity = s.bassSensitivity;
      bassSensitivityInput.value = bassSensitivity;
      sensitivityValue.textContent = bassSensitivity;
    }
    if (s.attackSpeed != null) {
      attackSpeed = s.attackSpeed;
      attackSpeedInput.value = attackSpeed;
      attackValue.textContent = attackSpeed;
    }
    if (s.releaseSpeed != null) {
      releaseSpeed = s.releaseSpeed;
      releaseSpeedInput.value = releaseSpeed;
      releaseValue.textContent = releaseSpeed;
    }
    if (s.shakeIntensity != null) {
      shakeIntensity = s.shakeIntensity;
      shakeIntensityInput.value = shakeIntensity;
      shakeValue.textContent = shakeIntensity;
    }
    if (s.baseScale != null) {
      baseScale = s.baseScale;
      baseScaleInput.value = baseScale;
      baseScaleValue.textContent = baseScale;
    }
    if (s.pulseRange != null) {
      pulseRange = s.pulseRange;
      pulseRangeInput.value = pulseRange;
      pulseRangeValue.textContent = pulseRange;
    }
    if (s.waveClipMargin != null) {
      waveClipMargin = s.waveClipMargin;
      waveClipMarginInput.value = waveClipMargin;
      waveClipValue.textContent = waveClipMargin;
    }
    if (s.waveOrientation) {
      waveOrientation = s.waveOrientation;
      waveOrientationButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.orientation === waveOrientation);
      });
    }
    if (s.waveColor) { waveColor = s.waveColor; waveColorInput.value = waveColor; }
    if (s.waveAmplitude != null) {
      waveAmplitude = s.waveAmplitude;
      waveAmplitudeInput.value = waveAmplitude;
      waveAmplitudeValue.textContent = waveAmplitude;
    }
    if (s.waveThickness != null) {
      waveThickness = s.waveThickness;
      waveThicknessInput.value = waveThickness;
      waveThicknessValue.textContent = waveThickness;
    }
    if (s.waveGlow != null) {
      waveGlow = s.waveGlow;
      waveGlowInput.value = waveGlow;
      waveGlowValue.textContent = waveGlow;
    }
  } catch (_) {}
}

function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  loadSettings();
  resizeCanvas();

  bgColorInput.addEventListener('input', (e) => { bgColor = e.target.value; saveSettings(); });
  bgColor2Input.addEventListener('input', (e) => { bgColor2 = e.target.value; saveSettings(); });
  gradientTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      gradientTypeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bgGradientType = btn.dataset.gradient;
      saveSettings();
    });
  });

  formatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      formatButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      format = btn.dataset.format;
      resizeCanvas();
      saveSettings();
    });
  });

  pngInput.addEventListener('change', handlePngUpload);
  wavInput.addEventListener('change', handleWavUpload);
  bassSensitivityInput.addEventListener('input', (e) => {
    bassSensitivity = parseFloat(e.target.value);
    sensitivityValue.textContent = bassSensitivity;
    saveSettings();
  });
  attackSpeedInput.addEventListener('input', (e) => {
    attackSpeed = parseFloat(e.target.value);
    attackValue.textContent = attackSpeed;
    saveSettings();
  });
  releaseSpeedInput.addEventListener('input', (e) => {
    releaseSpeed = parseFloat(e.target.value);
    releaseValue.textContent = releaseSpeed;
    saveSettings();
  });
  shakeIntensityInput.addEventListener('input', (e) => {
    shakeIntensity = parseFloat(e.target.value);
    shakeValue.textContent = shakeIntensity;
    saveSettings();
  });
  baseScaleInput.addEventListener('input', (e) => {
    baseScale = parseFloat(e.target.value);
    baseScaleValue.textContent = baseScale;
    saveSettings();
  });
  pulseRangeInput.addEventListener('input', (e) => {
    pulseRange = parseFloat(e.target.value);
    pulseRangeValue.textContent = pulseRange;
    saveSettings();
  });
  waveClipMarginInput.addEventListener('input', (e) => {
    waveClipMargin = parseInt(e.target.value, 10);
    waveClipValue.textContent = waveClipMargin;
    saveSettings();
  });
  waveOrientationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      waveOrientationButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      waveOrientation = btn.dataset.orientation;
      saveSettings();
    });
  });
  waveColorInput.addEventListener('input', (e) => { waveColor = e.target.value; saveSettings(); });
  waveAmplitudeInput.addEventListener('input', (e) => {
    waveAmplitude = parseFloat(e.target.value);
    waveAmplitudeValue.textContent = waveAmplitude;
    saveSettings();
  });
  waveThicknessInput.addEventListener('input', (e) => {
    waveThickness = parseFloat(e.target.value);
    waveThicknessValue.textContent = waveThickness;
    saveSettings();
  });
  waveGlowInput.addEventListener('input', (e) => {
    waveGlow = parseInt(e.target.value, 10);
    waveGlowValue.textContent = waveGlow;
    saveSettings();
  });
  convertBtn.addEventListener('click', convertToMp4);

  playBtn.addEventListener('click', play);
  stopBtn.addEventListener('click', stop);
  exportBtn.addEventListener('click', exportFullAudio);

  updateButtons();
}

function resizeCanvas() {
  const { width, height } = DIMENSIONS[format];
  canvas.width = width;
  canvas.height = height;
  // Préserver le ratio pour l'affichage (max 500px sur le grand côté)
  const maxPreview = 500;
  const scale = maxPreview / Math.max(width, height);
  canvas.style.width = `${Math.round(width * scale)}px`;
  canvas.style.height = `${Math.round(height * scale)}px`;
}

function handlePngUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    pngImage = img;
    pngName.textContent = file.name;
    updateButtons();
  };
  img.src = URL.createObjectURL(file);
}

function handleWavUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      audioBuffer = await audioContext.decodeAudioData(ev.target.result);
      wavName.textContent = file.name;
      updateButtons();
    } catch (err) {
      statusEl.textContent = 'Erreur: format audio non supporté';
    }
  };
  reader.readAsArrayBuffer(file);
}

function updateButtons() {
  const ready = pngImage && audioBuffer;
  if (!isRecording) {
    playBtn.disabled = !ready;
    exportBtn.disabled = !ready;
  }
}

function lockExportInterface() {
  exportLockElements.forEach(el => { el.disabled = true; });
  exportBtn.disabled = false;
  exportBtn.textContent = 'Arrêter et exporter';
}

async function convertToMp4() {
  const file = webmInput.files?.[0];
  if (!file) {
    statusEl.textContent = 'Sélectionnez un fichier .webm';
    return;
  }

  convertBtn.disabled = true;
  statusEl.textContent = 'Chargement de ffmpeg...';

  try {
    const { FFmpeg } = await import('https://esm.sh/@ffmpeg/ffmpeg@0.12.10');
    const { toBlobURL } = await import('https://esm.sh/@ffmpeg/util@0.12.1');

    const ffmpeg = new FFmpeg();
    statusEl.textContent = 'Chargement des bibliothèques (~30 Mo)...';

    await ffmpeg.load({
      coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', 'application/wasm'),
    });

    statusEl.textContent = 'Conversion en cours...';
    await ffmpeg.writeFile('input.webm', new Uint8Array(await file.arrayBuffer()));
    await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-c:a', 'aac', 'output.mp4']);
    const data = await ffmpeg.readFile('output.mp4');

    const blob = new Blob([data], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.webm$/, '.mp4');
    a.click();
    URL.revokeObjectURL(url);

    statusEl.textContent = 'MP4 téléchargé';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Erreur de conversion. Réessayez.';
  } finally {
    convertBtn.disabled = false;
  }
}

function unlockExportInterface() {
  exportLockElements.forEach(el => { el.disabled = false; });
  const ready = pngImage && audioBuffer;
  playBtn.disabled = !ready;
  exportBtn.disabled = !ready;
  exportBtn.textContent = 'Exporter vidéo';
  stopBtn.disabled = true;
}

function getBassLevel() {
  if (!analyser) return 0;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Sub-basses uniquement : 20-100 Hz (sous 300 Hz pour éviter la mélodie)
  const sampleRate = audioContext.sampleRate;
  const binCount = analyser.frequencyBinCount;
  const binPerHz = binCount / (sampleRate / 2);
  const bassStart = Math.floor(20 * binPerHz);
  const bassEnd = Math.ceil(100 * binPerHz);

  let sum = 0;
  let count = 0;
  for (let i = bassStart; i < Math.min(bassEnd, dataArray.length); i++) {
    sum += dataArray[i];
    count++;
  }
  const avg = count > 0 ? sum / count : 0;
  return (avg / 255) * bassSensitivity;
}

function draw(bassLevel) {
  const { width, height } = DIMENSIONS[format];

  let gradient;
  if (bgGradientType === 'radial') {
    gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
  } else if (bgGradientType === 'horizontal') {
    gradient = ctx.createLinearGradient(0, 0, width, 0);
  } else if (bgGradientType === 'vertical') {
    gradient = ctx.createLinearGradient(0, 0, 0, height);
  } else {
    gradient = ctx.createLinearGradient(0, 0, width, height);
  }
  gradient.addColorStop(0, bgColor);
  gradient.addColorStop(1, bgColor2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Calcul des bounds du sticker (pour masquer la wave derrière)
  let stickerX = 0, stickerY = 0, stickerW = 0, stickerH = 0;
  if (pngImage) {
    const targetScale = baseScale + bassLevel * pulseRange;
    const speed = targetScale > displayScale ? attackSpeed : releaseSpeed;
    displayScale += (targetScale - displayScale) * speed;
    const scale = displayScale;

    const imgRatio = pngImage.width / pngImage.height;
    const canvasRatio = width / height;
    if (imgRatio > canvasRatio) {
      stickerW = width * scale;
      stickerH = stickerW / imgRatio;
    } else {
      stickerH = height * scale;
      stickerW = stickerH * imgRatio;
    }
    stickerX = (width - stickerW) / 2;
    stickerY = (height - stickerH) / 2;
    stickerX += (Math.random() - 0.5) * 2 * bassLevel * shakeIntensity;
    stickerY += (Math.random() - 0.5) * 2 * bassLevel * shakeIntensity;
  }

  // Wave (verticale ou horizontale, masquée derrière le sticker si présent)
  if (analyser) {
    const waveformData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(waveformData);
    const centerX = width / 2;
    const centerY = height / 2;
    const waveAmp = waveOrientation === 'vertical' ? width * waveAmplitude : height * waveAmplitude;

    ctx.save();
    if (pngImage) {
      const clipX = stickerX + waveClipMargin;
      const clipY = stickerY + waveClipMargin;
      const clipW = Math.max(1, stickerW - 2 * waveClipMargin);
      const clipH = Math.max(1, stickerH - 2 * waveClipMargin);
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.rect(clipX, clipY, clipW, clipH);
      ctx.clip('evenodd');
    }

    ctx.beginPath();
    for (let i = 0; i < waveformData.length; i++) {
      const amp = (waveformData[i] - 128) / 128;
      const x = waveOrientation === 'vertical'
        ? centerX + amp * waveAmp
        : (i / waveformData.length) * width;
      const y = waveOrientation === 'vertical'
        ? (i / waveformData.length) * height
        : centerY + amp * waveAmp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = waveThickness;
    ctx.shadowColor = waveColor;
    ctx.shadowBlur = waveGlow;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  if (pngImage) {
    ctx.save();
    ctx.globalAlpha = 0.7 + bassLevel * 0.3;
    ctx.drawImage(pngImage, stickerX, stickerY, stickerW, stickerH);
    ctx.restore();
  }
}

function animate() {
  const bass = getBassLevel();
  draw(bass);
  animationId = requestAnimationFrame(animate);
}

function setupAudioGraph(loop = true) {
  if (!audioContext || !audioBuffer) return null;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = loop;

  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  analyserNode.smoothingTimeConstant = 0.3; // Réaction plus rapide

  const gain = audioContext.createGain();
  gain.gain.value = 1;

  const destination = audioContext.createMediaStreamDestination();

  source.connect(analyserNode);
  analyserNode.connect(gain);
  gain.connect(audioContext.destination);
  gain.connect(destination);

  sourceNode = source;
  analyser = analyserNode;
  gainNode = gain;
  mediaStreamDestination = destination;

  return source;
}

async function play() {
  if (!audioContext || !audioBuffer) return;

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const source = setupAudioGraph();
  if (!source) return;

  source.start(0);
  isPlaying = true;
  playBtn.disabled = true;
  stopBtn.disabled = false;
  statusEl.textContent = 'Lecture en cours...';
  animate();
}

function stop() {
  displayScale = baseScale;
  if (sourceNode) {
    try {
      sourceNode.stop();
    } catch (_) {}
    sourceNode = null;
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  isPlaying = false;
  playBtn.disabled = !(pngImage && audioBuffer);
  stopBtn.disabled = true;
  statusEl.textContent = 'Arrêté';
}

function stopExportAndSave() {
  if (!recorder || !isRecording) return;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (sourceNode) {
    try { sourceNode.stop(); } catch (_) {}
    sourceNode = null;
  }
  recorder.stop();
  isPlaying = false;
  isRecording = false;
  displayScale = baseScale;
}

async function exportFullAudio() {
  if (!pngImage || !audioBuffer) return;

  if (isRecording) {
    stopExportAndSave();
    return;
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const source = setupAudioGraph(false);
  if (!source) return;

  const canvasStream = canvas.captureStream(FPS);
  const videoTrack = canvasStream.getVideoTracks()[0];
  const audioTrack = mediaStreamDestination.stream.getAudioTracks()[0];
  if (!audioTrack) {
    statusEl.textContent = 'Erreur: impossible de capturer l\'audio';
    return;
  }

  const combinedStream = new MediaStream([videoTrack, audioTrack]);
  recordedChunks = [];
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';
  recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 5000000,
    audioBitsPerSecond: 128000
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const filename = `zikviz-${Date.now()}.webm`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    statusEl.textContent = 'Vidéo téléchargée';
    unlockExportInterface();
  };

  source.onended = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    recorder.stop();
    sourceNode = null;
    isPlaying = false;
    displayScale = baseScale;
  };

  sourceNode = source;
  source.start(0);
  recorder.start(1000);
  isPlaying = true;
  isRecording = true;

  lockExportInterface();
  stopBtn.disabled = true;
  statusEl.textContent = 'Export en cours...';
  animate();
}

init();
