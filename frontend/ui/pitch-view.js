import { setText } from './i18n.js';
import { pickPitchNote } from './pitch-navigation.js';
const $ = (id) => document.getElementById(id);
const time = (value) => `${Math.floor(value / 60)}:${(value % 60).toFixed(2).padStart(5, '0')}`;

export function createPitchView(seek) {
  let result = null,
    offset = 0,
    duration = 0;
  const canvas = $('pitch-canvas');
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
    ctx.fillStyle = '#a0aca3';
    ctx.fillText(time(offset), left, height - 5);
    const endLabel = time(offset + duration);
    ctx.fillText(endLabel, right - ctx.measureText(endLabel).width, height - 5);
  }
  for (const kind of ['lowest', 'highest'])
    $('pitch-' + kind).addEventListener('click', () => {
      if (result) seek(offset + result[kind].start_seconds);
    });
  canvas.addEventListener('click', (event) => {
    if (!result) return;
    const rect = canvas.getBoundingClientRect();
    const seconds = Math.max(
      0,
      Math.min(duration, ((event.clientX - rect.left - 34) / (rect.width - 46)) * duration)
    );
    const note = pickPitchNote(result.notes, seconds);
    if (note) seek(offset + note.start_seconds);
  });
  new ResizeObserver(draw).observe(canvas);
  function reset(loading = false) {
    result = null;
    $('pitch-chart').hidden = true;
    for (const kind of ['lowest', 'highest']) {
      $('pitch-' + kind).disabled = true;
      setText('pitch-' + kind + '-value', '—');
      setText('pitch-' + kind + '-detail', '—');
    }
    setText('pitch-summary', { key: loading ? 'pitchWaiting' : 'pitchInitial' });
    setText('pitch-runtime', 'GAME Small');
  }
  function render(data, selectionOffset = 0) {
    reset();
    offset = selectionOffset;
    duration = data.duration_seconds;
    if (data.pitch_status !== 'estimated' || !data.pitch?.notes?.length) {
      const key =
        data.pitch_status === 'error'
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
      'GAME · ' +
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
  return { reset, render };
}
