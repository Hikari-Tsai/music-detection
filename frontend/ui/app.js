import { setText } from './i18n.js';
import { createEngine } from './engine.js';
import { decodeSource } from './audio-source.js';
import { createRangeEditor } from './range-editor.js';
import { createPitchView } from './pitch-view.js';
import { createTempoClickView } from './tempo-click-view.js';
const $ = (id) => document.getElementById(id);
function makeEngine(kind) {
  return createEngine(kind, {
    browserModuleURL: new URL(
      'browser-client.js',
      new URL(document.documentElement.dataset.runtimeBase, location.href)
    ).href
  });
}
let engine = makeEngine('browser');
function updateEngineCopy() {
  document.documentElement.dataset.engine = engine.kind;
  $('engine-select').value = engine.kind;
  $('python-startup').hidden = engine.kind !== 'python';
  setText($('local-note-text'), engine.localNote);
  setText($('privacy-note-text'), engine.privacyNote);
  setText($('preview-note'), engine.previewNote);
  setText('engine-description', {
    key: engine.kind === 'browser' ? 'engineBrowserHelp' : 'enginePythonHelp'
  });
}
updateEngineCopy();
const input = $('audio-file');
const audio = $('audio-player');
const pitchView = createPitchView(() => {
  audio.pause();
  tempoClick.stop();
});
const tempoClick = createTempoClickView(() => {
  audio.pause();
  pitchView.pause();
});
const accepted = new Set(['wav', 'mp3', 'flac', 'm4a', 'ogg', 'aif', 'aiff', 'aac', 'mp4', 'mov']);
let busy = false;
let objectUrl = null;
let downloadUrl = null;
let downloadName = null;
let waveform = [];
let elapsedTimer = null;
let lastFile = null;
let sourceAudio = null;
let sourceDuration = 0;
const selection = createRangeEditor(() => {
  audio.pause();
  resetResult();
  errorMessage('');
  $('analysis-status').hidden = true;
  $('analyze-range').disabled = busy || (selection.available && !selection.valid);
  status({ key: 'rangeReady' });
  drawWaveform();
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function errorMessage(text) {
  setText($('error-message'), text);
  $('error-message').hidden = !text;
}

function status(text, state = '') {
  setText($('result-status-text'), text);
  $('result-panel').className = `result-panel ${state}`;
}

function resetResult() {
  pitchView.reset();
  tempoClick.reset();
  $('result-range').hidden = true;
  if (downloadUrl?.startsWith('blob:')) URL.revokeObjectURL(downloadUrl);
  downloadUrl = null;
  downloadName = null;
  $('download-midi').disabled = true;
  setText($('bpm-value'), '—');
  $('bpm-value').classList.remove('has-value');
  setText($('signature-value'), '—');
  setText($('key-value'), '—');
  setText($('key-description'), '全曲調性估計 · S-KEY');
  $('signature-denominator').hidden = true;
  setText($('tempo-label'), 'TEMPO');
  setText($('download-label'), '下載 MIDI Tempo');
  setText($('result-description'), '自動分析 BPM；偵測到變速時，顯示平均值並匯出變速 MIDI。');
  setText($('midi-hint'), { key: 'midiOnly' });
  status('等候音訊');
}

function setBusy(value) {
  busy = value;
  $('banner-art').dataset.analyzing = String(value);
  $('choose-file').disabled = value;
  $('clear-file').disabled = value;
  input.disabled = value;
  $('engine-select').disabled = value;
  selection.setBusy(value);
  $('analyze-range').disabled = value || !lastFile || (selection.available && !selection.valid);
  $('result-panel').setAttribute('aria-busy', String(value));
}

function drawWaveform() {
  const canvas = $('wave-canvas');
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  if (!waveform.length) return;
  const count = Math.min(waveform.length, Math.floor(rect.width / 4));
  const step = rect.width / count;
  const progress =
    Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * waveform.length) / count);
    const end = Math.max(start + 1, Math.floor(((i + 1) * waveform.length) / count));
    const amplitude = Math.max(...waveform.slice(start, end));
    const height = Math.max(2, amplitude * rect.height * 0.78);
    const bounds = selection.bounds;
    const selected =
      !bounds ||
      (i / count >= bounds.start / sourceDuration && i / count <= bounds.end / sourceDuration);
    ctx.fillStyle = !selected ? '#303a3e' : i / count < progress ? '#c6f68a' : '#657c53';
    ctx.fillRect(i * step, (rect.height - height) / 2, Math.max(1, step - 2), height);
  }
}

function clearFile() {
  if (busy) return;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  lastFile = null;
  sourceAudio = null;
  sourceDuration = 0;
  selection.setDuration(0);
  input.value = '';
  waveform = [];
  $('dropzone').hidden = false;
  $('selected-file').hidden = true;
  $('analysis-status').hidden = true;
  errorMessage('');
  resetResult();
  $('choose-file').focus();
}

function selectFiles(files) {
  if (busy || !files.length) return;
  if (files.length !== 1) {
    errorMessage('請一次加入一個音訊檔案。');
    return;
  }
  prepareFile(files[0]);
}

async function prepareFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (!accepted.has(extension)) {
    errorMessage('不支援這個格式，請選擇 WAV、MP3、FLAC、M4A、OGG、AIFF、AAC、MP4 或 MOV。');
    input.value = '';
    return;
  }
  if (file.size === 0 || file.size > 100 * 1024 * 1024) {
    errorMessage(
      file.size === 0 ? '檔案是空的，請重新選擇。' : '檔案超過 100 MB，請選擇較小的音訊。'
    );
    input.value = '';
    return;
  }
  resetResult();
  errorMessage('');
  audio.pause();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  audio.src = objectUrl;
  lastFile = file;
  $('range-editor').open = false;
  sourceAudio = null;
  sourceDuration = 0;
  selection.setDuration(0);
  waveform = [];
  $('filename').textContent = file.name;
  $('file-meta').textContent =
    `${extension.toUpperCase()} / ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  $('selected-file').hidden = false;
  $('dropzone').hidden = true;
  $('play-button').disabled = true;
  $('seek').disabled = true;
  $('seek').value = 0;
  setText($('current-time'), '0:00');
  setText($('total-time'), '0:00');
  $('preview-note').hidden = true;
  $('wave-placeholder').hidden = false;
  setText('wave-placeholder', { key: 'rangeReading' });
  $('analysis-status').hidden = true;
  setBusy(true);
  status({ key: 'rangeReading' });
  try {
    sourceAudio = await decodeSource(file);
    sourceDuration = sourceAudio.duration;
    waveform = sourceAudio.waveform;
    selection.setDuration(sourceDuration);
    $('wave-placeholder').hidden = true;
    setText('total-time', formatTime(sourceDuration));
    $('file-meta').textContent += ` / ${formatTime(sourceDuration)}`;
    status({ key: 'rangeReady' });
  } catch (error) {
    // Native Python can still decode formats unsupported by Web Audio.
    const duration = audio.duration;
    if (Number.isFinite(duration) && duration >= 1 && duration <= 1200) {
      sourceDuration = duration;
      selection.setDuration(duration);
    }
    setText('wave-placeholder', { key: 'rangeNoWaveform' });
    status({ key: 'rangeReady' });
    errorMessage(engine.errorMessage(error));
  } finally {
    setBusy(false);
    drawWaveform();
  }
  // New uploads always begin with the full track. Later range edits remain manual.
  if (sourceAudio || engine.kind === 'python') await analyze();
}

async function analyze() {
  if (busy || !lastFile || (selection.available && !selection.valid)) return;
  const file = lastFile;
  const range = selection.range;
  resetResult();
  errorMessage('');
  audio.pause();
  $('analysis-status').hidden = false;
  $('spinner').hidden = false;
  setText($('status-message'), '正在分析節拍，請稍候');
  setText($('elapsed'), { key: 'elapsed', args: { seconds: 0 } });
  setText($('key-description'), '等候調性分析');
  pitchView.reset(true);
  status('分析中', 'loading');
  setBusy(true);
  drawWaveform();
  const started = performance.now();
  elapsedTimer = setInterval(() => {
    const seconds = Math.floor((performance.now() - started) / 1000);
    setText($('elapsed'), { key: 'elapsed', args: { seconds } });
    if (seconds >= 15 && engine.kind === 'python')
      setText($('status-message'), '正在處理音訊或等待模型，請稍候');
  }, 1000);
  try {
    const data = await engine.analyze(
      file,
      (text) => {
        setText($('status-message'), text);
      },
      { range, prepared: sourceAudio }
    );
    pitchView.render(data, range?.start || 0);
    tempoClick.render(data);
    if (data.key_status === 'estimated' && data.key) {
      setText($('key-value'), [data.key.tonic, ' ', { key: data.key.mode }]);
      setText($('key-description'), range ? { key: 'rangeKey' } : '全曲調性估計 · S-KEY');
    } else {
      setText($('key-value'), '—');
      setText(
        'key-description',
        data.key_reason === 'too_short'
          ? '調性分析至少需要 3 秒音訊'
          : data.key_reason === 'silent'
            ? '音訊無有效訊號，無法估計調性'
            : '調性分析未完成，可重新分析'
      );
    }
    if (!waveform.length && !range) {
      waveform = data.waveform;
      sourceDuration = data.source_duration_seconds || data.duration_seconds;
      selection.setDuration(sourceDuration);
    }
    $('wave-placeholder').hidden = true;
    setText($('total-time'), formatTime(sourceDuration || data.duration_seconds));
    setText(
      'result-range',
      range
        ? { key: 'rangeResult', args: { start: range.start.toFixed(3), end: range.end.toFixed(3) } }
        : { key: 'rangeFullResult' }
    );
    $('result-range').hidden = false;
    drawWaveform();
    $('spinner').hidden = true;
    setText($('status-message'), { key: 'analysisDone', args: { count: data.beat_count } });
    setText($('elapsed'), { key: 'elapsed', args: { seconds: data.analysis_seconds.toFixed(2) } });
    $('bpm-value').classList.add('has-value');
    if (data.result === -1) {
      setText($('bpm-value'), '-1');
      setText($('signature-value'), '—');
      status('拍點不足', 'nonconstant');
      setText($('result-description'), '找不到足夠的有效拍點，無法計算平均 BPM。');
      setText($('midi-hint'), '請提供較長或節拍較清楚的音訊');
    } else {
      setText($('bpm-value'), Number(data.result.bpm).toFixed(3));
      const hasSignature = data.result.signature_beats != null;
      setText($('signature-value'), hasSignature ? data.result.signature_beats : '—');
      $('signature-denominator').hidden = !hasSignature;
      if (data.tempo_mode === 'variable') {
        status('偵測到變速', 'nonconstant');
        setText($('tempo-label'), 'AVERAGE TEMPO');
        setText($('download-label'), '下載變速 MIDI Tempo');
        setText($('result-description'), [
          range
            ? { key: 'rangeVariable' }
            : '顯示整段平均 BPM；MIDI 依偵測拍點寫入速度變化。匯入時請與原音訊使用相同起點。',
          hasSignature ? '' : { key: 'noMeter' }
        ]);
      } else if (data.tempo_mode === 'average') {
        status('平均估計', 'nonconstant');
        setText($('tempo-label'), 'AVERAGE TEMPO');
        setText($('download-label'), '下載平均 MIDI Tempo');
        setText($('result-description'), [
          '資訊不足以確認固定或變速，先以整段拍點計算平均 BPM，MIDI 使用單一速度。',
          hasSignature ? '' : { key: 'noMeter' }
        ]);
      } else {
        status('固定速度', 'complete');
        setText($('result-description'), '速度與每小節拍數一致。每拍按四分音符解讀。');
      }
      downloadUrl = data.download_url;
      downloadName =
        file.name.replace(/\.[^.]+$/, '') +
        (range ? `_${range.start.toFixed(3)}-${range.end.toFixed(3)}s` : '') +
        (data.midi_has_vocal ? '_tempo_vocal.mid' : '_tempo.mid');
      if (data.midi_has_vocal) setText('download-label', { key: 'downloadVocalMidi' });
      $('download-midi').disabled = false;
      setText($('midi-hint'), [
        data.midi_has_vocal
          ? { key: 'midiVocalContents' }
          : hasSignature
            ? '僅含速度與拍號'
            : '僅含速度，不設定拍號',
        engine.downloadHint(data)
      ]);
    }
  } catch (error) {
    tempoClick.reset();
    pitchView.reset();
    setText('pitch-summary', { key: 'pitchInterrupted' });
    setText($('key-description'), '調性分析未完成');
    status('分析未完成');
    $('analysis-status').hidden = true;
    setText($('wave-placeholder'), '無法完成分析');
    setText($('result-description'), '請移除檔案後重試，或拖入另一個音訊。');
    errorMessage(engine.errorMessage(error));
    if (
      engine.kind === 'python' &&
      (error instanceof TypeError ||
        error.name === 'TimeoutError' ||
        error.message === '無法連線到本機分析服務，請確認服務正在執行。')
    )
      $('python-startup').open = true;
  } finally {
    clearInterval(elapsedTimer);
    setBusy(false);
  }
}

$('analyze-range').addEventListener('click', () => analyze());
$('choose-file').addEventListener('click', () => input.click());
$('engine-select').addEventListener('change', () => {
  if (busy) {
    $('engine-select').value = engine.kind;
    return;
  }
  engine = makeEngine($('engine-select').value);
  updateEngineCopy();
  if (lastFile) analyze();
  else {
    errorMessage('');
    resetResult();
  }
});
input.addEventListener('change', () => selectFiles(input.files));
$('clear-file').addEventListener('click', clearFile);
let dragDepth = 0;
document.addEventListener('dragover', (event) => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
});
$('dropzone').addEventListener('dragenter', (event) => {
  event.preventDefault();
  dragDepth++;
  if (!busy) $('dropzone').classList.add('dragging');
});
$('dropzone').addEventListener('dragleave', () => {
  if (--dragDepth <= 0) {
    dragDepth = 0;
    $('dropzone').classList.remove('dragging');
  }
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDepth = 0;
  $('dropzone').classList.remove('dragging');
  if (event.dataTransfer) selectFiles(event.dataTransfer.files);
});

audio.addEventListener('loadedmetadata', () => {
  if (!Number.isFinite(audio.duration)) return;
  setText($('total-time'), formatTime(audio.duration));
  $('seek').disabled = false;
  $('play-button').disabled = false;
});
audio.addEventListener('error', () => {
  if (lastFile) $('preview-note').hidden = false;
  $('play-button').disabled = true;
  $('seek').disabled = true;
});
function syncPlayButton() {
  setText('play-button', audio.paused ? '播放音訊' : '暫停音訊', 'aria-label');
  $('play-button')
    .querySelector('use')
    .setAttribute('href', audio.paused ? '#i-play' : '#i-pause');
}
audio.addEventListener('play', () => {
  pitchView.pause();
  tempoClick.stop();
  syncPlayButton();
});
audio.addEventListener('pause', syncPlayButton);
audio.addEventListener('timeupdate', () => {
  const bounds = selection.bounds;
  if (bounds && !audio.paused && audio.currentTime >= bounds.end) {
    audio.pause();
    audio.currentTime = bounds.end;
  }
  setText($('current-time'), formatTime(audio.currentTime));
  $('seek').value = Number.isFinite(audio.duration)
    ? Math.round((audio.currentTime / audio.duration) * 1000)
    : 0;
  drawWaveform();
});
$('play-button').addEventListener('click', async () => {
  if (!audio.paused) return audio.pause();
  try {
    const bounds = selection.bounds;
    if (bounds && (audio.currentTime < bounds.start || audio.currentTime >= bounds.end))
      audio.currentTime = bounds.start;
    await audio.play();
    $('preview-note').hidden = true;
  } catch (error) {
    if (error.name !== 'AbortError') $('preview-note').hidden = false;
  }
});
$('seek').addEventListener('input', () => {
  if (Number.isFinite(audio.duration)) {
    const bounds = selection.bounds;
    const next = (Number($('seek').value) / 1000) * audio.duration;
    audio.currentTime = bounds ? Math.min(bounds.end, Math.max(bounds.start, next)) : next;
  }
});
new ResizeObserver(drawWaveform).observe($('waveform'));

$('download-midi').addEventListener('click', async () => {
  if (!downloadUrl) return;
  setBusy(true);
  $('download-midi').disabled = true;
  errorMessage('');
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error('下載已失效，請重新分析音訊。');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    errorMessage(engine.errorMessage(error));
  } finally {
    $('download-midi').disabled = !downloadUrl;
    setBusy(false);
  }
});
