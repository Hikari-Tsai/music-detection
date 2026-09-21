import { setText } from './i18n.js';
import { createPitchPlayer } from './pitch-player.js';
const $ = (id) => document.getElementById(id);
const time = (value) => `${Math.floor(value / 60)}:${(value % 60).toFixed(2).padStart(5, '0')}`;

export function createPitchView(beforeSynth = () => {}) {
  let result = null,
    offset = 0,
    duration = 0;
  const canvas = $('pitch-canvas');
  let frame = 0;
  const player = createPitchPlayer({ onChange: refreshTransport });
  function refreshTransport() {
    cancelAnimationFrame(frame);
    const state = player.state;
    const active = state.playing || state.auditioning;
    setText('pitch-play-label', { key: active ? 'pitchSynthPause' : 'pitchSynthPlay' });
    $('pitch-play').setAttribute('aria-pressed', String(active));
    $('pitch-play')
      .querySelector('use')
      .setAttribute('href', active ? '#i-pause' : '#i-play');
    $('pitch-seek').value = state.position;
    $('pitch-seek').setAttribute('aria-valuetext', time(offset + state.position));
    setText('pitch-current', time(offset + state.position));
    draw();
    if (state.playing) frame = requestAnimationFrame(refreshTransport);
  }
  async function synth(action) {
    beforeSynth();
    $('pitch-play-error').hidden = true;
    try {
      await action();
    } catch {
      player.pause();
      $('pitch-play-error').hidden = false;
    }
  }
  $('pitch-play').addEventListener('click', () => {
    if (player.state.playing || player.state.auditioning) player.pause();
    else if (result) synth(() => player.play());
  });
  $('pitch-seek').addEventListener('input', () => {
    if (result) {
      const seconds = Number($('pitch-seek').value);
      const playing = player.state.playing;
      synth(() => player.seek(seconds, playing));
    }
  });
  window.addEventListener('pagehide', () => player.pause());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) player.pause();
  });
  function draw() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    if (!result) return;
    const low = Math.floor(result.lowest.midi) - 2,
      high = Math.max(low + 12, Math.ceil(result.highest.midi) + 2);
    const left = 34,
      right = width - 12,
      top = 16,
      bottom = height - 25;
    const x = (seconds) => left + (seconds / duration) * (right - left);
    const y = (midi) => bottom - ((midi - low) / (high - low)) * (bottom - top);
    ctx.font = '10px monospace';
    for (let midi = Math.ceil(low / 12) * 12; midi <= high; midi += 12) {
      ctx.strokeStyle = '#33413b';
      ctx.beginPath();
      ctx.moveTo(left, y(midi));
      ctx.lineTo(right, y(midi));
      ctx.stroke();
      ctx.fillStyle = '#a0aca3';
      ctx.fillText('C' + (midi / 12 - 1), 0, y(midi) + 3);
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    for (const note of result.notes) {
      ctx.strokeStyle = '#c6f68a';
      ctx.beginPath();
      ctx.moveTo(x(note.start_seconds), y(note.midi));
      ctx.lineTo(Math.max(x(note.end_seconds), x(note.start_seconds) + 1), y(note.midi));
      ctx.stroke();
    }
    ctx.strokeStyle = '#f2f6ed';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x(player.state.position), top);
    ctx.lineTo(x(player.state.position), bottom);
    ctx.stroke();
    ctx.fillStyle = '#a0aca3';
    ctx.fillText(time(offset), left, height - 5);
    const endLabel = time(offset + duration);
    ctx.fillText(endLabel, right - ctx.measureText(endLabel).width, height - 5);
  }
  for (const kind of ['lowest', 'highest'])
    $('pitch-' + kind).addEventListener('click', () => {
      if (result) synth(() => player.audition(result[kind]));
    });
  canvas.addEventListener('click', (event) => {
    if (!result) return;
    const rect = canvas.getBoundingClientRect();
    const seconds = Math.max(
      0,
      Math.min(duration, ((event.clientX - rect.left - 34) / (rect.width - 46)) * duration)
    );
    synth(() => player.seek(seconds));
  });
  new ResizeObserver(draw).observe(canvas);
  function reset(loading = false) {
    result = null;
    player.reset();
    $('pitch-chart').hidden = true;
    $('pitch-transport').hidden = true;
    $('pitch-play').disabled = true;
    $('pitch-seek').disabled = true;
    $('pitch-play-error').hidden = true;
    for (const kind of ['lowest', 'highest']) {
      $('pitch-' + kind).disabled = true;
      setText('pitch-' + kind + '-value', '—');
      setText('pitch-' + kind + '-detail', '—');
    }
    setText('pitch-summary', { key: loading ? 'pitchWaiting' : 'pitchInitial' });
    setText('pitch-runtime', $('enhanced-mode')?.checked ? { key: 'enhancedLabel' } : 'GAME Small');
  }
  function render(data, selectionOffset = 0) {
    reset();
    offset = selectionOffset;
    duration = data.duration_seconds;
    if (data.pitch_status !== 'estimated' || !data.pitch?.notes?.length) {
      const key =
        data.pitch_reason === 'enhancement_failed'
          ? data.pitch_detail === 'enhancementWebGPURequired'
            ? 'enhancementWebGPURequired'
            : 'enhancementFailed'
          : data.pitch_status === 'error'
            ? 'pitchFailed'
            : data.pitch_reason === 'silent'
              ? 'pitchSilent'
              : !data.pitch_status
                ? 'pitchMissing'
                : 'pitchNoNotes';
      setText('pitch-summary', { key });
      return;
    }
    result = data.pitch;
    player.load(result.notes, duration);
    $('pitch-seek').max = duration;
    $('pitch-seek').value = 0;
    $('pitch-seek').disabled = false;
    $('pitch-play').disabled = false;
    $('pitch-transport').hidden = false;
    setText('pitch-total', time(offset + duration));
    for (const kind of ['lowest', 'highest']) {
      const n = result[kind];
      setText('pitch-' + kind + '-value', n.note);
      setText(
        'pitch-' + kind + '-detail',
        `${n.hz.toFixed(1)} Hz · ${time(offset + n.start_seconds)}`
      );
      $('pitch-' + kind).disabled = false;
    }
    setText('pitch-summary', {
      key: 'pitchSummary',
      args: { count: result.note_count, span: result.semitones.toFixed(1) }
    });
    setText(
      'pitch-runtime',
      (result.model || (data.pitch_mode === 'enhanced' ? 'GAME Large v1.0.3' : 'GAME Small')) +
        ' · ' +
        (data.pitch_engine === 'webgpu'
          ? 'WebGPU'
          : data.pitch_engine === 'onnx-cpu'
            ? 'Python ONNX'
            : 'WASM')
    );
    $('pitch-chart').hidden = false;
    draw();
  }
  reset();
  return { reset, render, pause: () => player.pause() };
}
