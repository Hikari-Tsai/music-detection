// The same quarter-note interpretation and 30 ms grid tolerance as Python.
export function roundEven(x) {
  const low = Math.floor(x),
    fraction = x - low;
  return fraction === 0.5 ? (low % 2 === 0 ? low : low + 1) : Math.round(x);
}
function grid(beats) {
  const mid = (beats.length - 1) / 2,
    mean = beats.reduce((a, b) => a + b, 0) / beats.length;
  let numerator = 0,
    denominator = 0;
  beats.forEach((t, i) => {
    numerator += (i - mid) * (t - mean);
    denominator += (i - mid) ** 2;
  });
  const period = numerator / denominator,
    offset = mean - period * mid;
  let residual = 0;
  beats.forEach((t, i) => {
    residual = Math.max(residual, Math.abs(t - offset - period * i));
  });
  return { period, residual };
}
function meter(beats, downbeats) {
  if (
    downbeats.length < 3 ||
    downbeats.some((v, i) => !Number.isFinite(v) || (i > 0 && v <= downbeats[i - 1]))
  )
    return null;
  const indices = downbeats.map((d) => beats.findIndex((b) => Math.abs(b - d) <= 1e-6));
  if (indices.some((i) => i < 0)) return null;
  const n = indices[1] - indices[0];
  if (n < 1 || n > 255 || indices.some((v, i) => i > 0 && v - indices[i - 1] !== n)) return null;
  return n;
}
export function estimateTempo(beats, downbeats) {
  if (
    beats.length < 2 ||
    beats[0] < 0 ||
    beats.some((v, i) => !Number.isFinite(v) || (i > 0 && v <= beats[i - 1]))
  )
    return -1;
  const signature = meter(beats, downbeats),
    fit = grid(beats);
  const constant = beats.length >= 5 && signature !== null && fit.residual <= 0.03;
  const variable = beats.length >= 5 && fit.residual > 0.03;
  const period = constant ? fit.period : (beats.at(-1) - beats[0]) / (beats.length - 1);
  const tempo = roundEven(period * 1e6);
  if (tempo < 1 || tempo > 0xffffff) return -1;
  if (
    variable &&
    beats.slice(1).some((b, i) => {
      const t = roundEven((b - beats[i]) * 1e6);
      return t < 1 || t > 0xffffff;
    })
  )
    return -1;
  return {
    bpm: Math.round((60e6 / tempo) * 1000) / 1000,
    signature_beats: signature,
    tempo_us: tempo,
    tempo_mode: constant ? 'constant' : variable ? 'variable' : 'average',
    beat_times: beats
  };
}
function vlq(value) {
  const bytes = [value % 128];
  while ((value = Math.floor(value / 128)) > 0) bytes.unshift(value % 128 | 128);
  return bytes;
}
function u32(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}
export function tempoMidi(result, duration, notes = []) {
  let events = [[0, result.tempo_us]];
  if (result.tempo_mode === 'variable') {
    const beats = result.beat_times;
    const tempos = beats.slice(1).map((b, i) => roundEven((b - beats[i]) * 1e6));
    const first = roundEven((beats[0] * 480 * 1e6) / tempos[0]);
    events = [[0, tempos[0]]];
    tempos.slice(1).forEach((t, i) => {
      if (t !== events.at(-1)[1]) events.push([first + (i + 1) * 480, t]);
    });
  }
  // Convert note seconds against the exact tempo events written to this file,
  // including tick rounding at the first beat and changes across sustained notes.
  let segmentSeconds = 0;
  const segments = events.map(([tick, tempo], i) => {
    if (i) segmentSeconds += ((tick - events[i - 1][0]) * events[i - 1][1]) / 480e6;
    return { tick, tempo, seconds: segmentSeconds };
  });
  const toTick = (seconds) => {
    let low = 0,
      high = segments.length;
    while (low + 1 < high) {
      const mid = Math.floor((low + high) / 2);
      if (segments[mid].seconds <= seconds) low = mid;
      else high = mid;
    }
    const segment = segments[low];
    return roundEven(segment.tick + ((seconds - segment.seconds) * 480e6) / segment.tempo);
  };
  const vocalEvents = [];
  for (const note of notes) {
    if (
      ![note.start_seconds, note.end_seconds, note.midi].every(Number.isFinite) ||
      note.midi < 0 ||
      note.midi > 127
    )
      continue;
    const start = Math.max(0, note.start_seconds),
      end = Math.min(duration, note.end_seconds);
    if (end <= start) continue;
    const on = toTick(start),
      off = Math.max(on + 1, toTick(end));
    const pitch = Math.floor(note.midi + 0.5);
    vocalEvents.push([on, 0x90, pitch, 90], [off, 0x80, pitch, 0]);
  }
  // End a repeated pitch before starting the next note at the same tick.
  vocalEvents.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const nameEvent = (name) => [
    0,
    0xff,
    3,
    name.length,
    ...Array.from(name, (c) => c.charCodeAt(0))
  ];
  const track = [];
  let prev = 0,
    elapsed = 0,
    current = events[0][1];
  events.forEach(([tick, tempo], i) => {
    const delta = tick - prev;
    elapsed += (delta * current) / 480 / 1e6;
    track.push(
      ...vlq(delta),
      0xff,
      0x51,
      3,
      (tempo >>> 16) & 255,
      (tempo >>> 8) & 255,
      tempo & 255
    );
    if (i === 0 && result.signature_beats !== null)
      track.push(0, 0xff, 0x58, 4, result.signature_beats, 2, 24, 8);
    if (i === 0 && vocalEvents.length) track.push(...nameEvent('Tempo'));
    prev = tick;
    current = tempo;
  });
  track.push(
    ...vlq(Math.max(0, roundEven(((duration - elapsed) * 480 * 1e6) / current))),
    0xff,
    0x2f,
    0
  );
  const tracks = [track];
  if (vocalEvents.length) {
    const vocal = [...nameEvent('Lead Vocal'), 0, 0xc0, 0]; // General MIDI piano for audition.
    let previous = 0;
    for (const [tick, status, pitch, velocity] of vocalEvents) {
      vocal.push(...vlq(tick - previous), status, pitch, velocity);
      previous = tick;
    }
    vocal.push(...vlq(Math.max(0, toTick(duration) - previous)), 0xff, 0x2f, 0);
    tracks.push(vocal);
  }
  return new Uint8Array([
    77,
    84,
    104,
    100,
    0,
    0,
    0,
    6,
    0,
    tracks.length === 2 ? 1 : 0,
    0,
    tracks.length,
    1,
    224,
    ...tracks.flatMap((body) => [77, 84, 114, 107, ...u32(body.length), ...body])
  ]);
}
