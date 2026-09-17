import FFT from 'fft.js';

// Matches torchaudio: periodic Hann, reflect padding, magnitude / sqrt(n_fft),
// Slaney filters (exported from the pinned frontend), then log1p(1000 * mel).
export function logMel(audio, constants, onProgress = () => {}) {
  const { n_fft: n, hop_length: hop, window, mel_filters: filters } = constants;
  const frames = Math.floor(audio.length / hop) + 1;
  const fft = new FFT(n);
  const input = new Float64Array(n),
    output = fft.createComplexArray();
  const magnitude = new Float64Array(n / 2 + 1);
  const sparse = filters.map((row) => row.flatMap((v, k) => (v ? [[k, v]] : [])));
  const result = new Float32Array(frames * 128);
  for (let t = 0; t < frames; t++) {
    for (let j = 0; j < n; j++) {
      let i = t * hop + j - n / 2;
      if (i < 0) i = -i;
      if (i >= audio.length) i = 2 * audio.length - 2 - i;
      input[j] = audio[i] * window[j];
    }
    fft.realTransform(output, input);
    for (let k = 0; k <= n / 2; k++)
      magnitude[k] = Math.hypot(output[2 * k], output[2 * k + 1]) / Math.sqrt(n);
    for (let m = 0; m < 128; m++) {
      let sum = 0;
      for (const [k, w] of sparse[m]) sum += magnitude[k] * w;
      result[t * 128 + m] = Math.log1p(1000 * sum);
    }
    if (t % 500 === 0) onProgress(t / frames);
  }
  return { data: result, frames };
}

export function chunkStarts(frames) {
  const starts = [];
  for (let s = -6; s < frames - 6; s += 1488) starts.push(s);
  if (frames > 1488) starts[starts.length - 1] = frames - 1494;
  return starts;
}
export function makeChunk(spect, frames, start) {
  const left = Math.max(0, -start);
  const right = Math.max(0, Math.min(6, start + 1500 - frames));
  const from = Math.max(0, start),
    to = Math.min(start + 1500, frames);
  const length = to - from + left + right;
  const data = new Float32Array(length * 128);
  data.set(spect.subarray(from * 128, to * 128), left * 128);
  return { data, length };
}
export function aggregateChunk(beat, downbeat, predicted, start) {
  // Call in reverse start order, matching the reference's keep_first behavior.
  for (let i = 6; i < predicted.beat.length - 6; i++) {
    beat[start + i] = predicted.beat[i];
    downbeat[start + i] = predicted.downbeat[i];
  }
}
function peaks(values) {
  const candidates = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] <= 0) continue;
    let max = -Infinity;
    for (let j = Math.max(0, i - 3); j <= Math.min(values.length - 1, i + 3); j++)
      max = Math.max(max, values[j]);
    if (values[i] === max) candidates.push(i);
  }
  // Match upstream's running-mean deduplication, including its width rule.
  const result = [];
  let mean = candidates[0],
    count = 1;
  for (const p of candidates.slice(1)) {
    if (p - mean <= 1) {
      count++;
      mean += (p - mean) / count;
    } else {
      result.push(mean / 50);
      mean = p;
      count = 1;
    }
  }
  if (candidates.length) result.push(mean / 50);
  return result;
}
export function postprocess(beatLogits, downbeatLogits) {
  const beats = peaks(beatLogits),
    raw = peaks(downbeatLogits);
  const downbeats = [
    ...new Set(
      raw.map((t) =>
        beats.length ? beats.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a)) : t
      )
    )
  ];
  return { beats, downbeats };
}
export function waveform(audio) {
  const values = [];
  // Same uneven array_split buckets as numpy.
  const base = Math.floor(audio.length / 240),
    extra = audio.length % 240;
  let cursor = 0;
  for (let i = 0; i < 240; i++) {
    let peak = 0;
    const end = cursor + base + (i < extra ? 1 : 0);
    while (cursor < end) peak = Math.max(peak, Math.abs(audio[cursor++]));
    values.push(peak);
  }
  const max = Math.max(...values);
  return values.map((v) => (max ? v / max : 0));
}
