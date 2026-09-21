import FFT from 'fft.js';
export const SEGMENT = 343980;
export const STRIDE = 257985;
const N = 4096,
  HOP = 1024,
  BINS = 2048,
  FRAMES = 336;
const window = Float32Array.from(
  { length: N },
  (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N)
);
function reflect(i, length) {
  while (i < 0 || i >= length) i = i < 0 ? -i : 2 * length - 2 - i;
  return i;
}
// Meta HTDemucs _spec: periodic Hann, normalized FFT, outer reflect padding,
// omitted Nyquist bin and two discarded frames at either side.
export function demucsSpectrogram(stereo) {
  const fft = new FFT(N),
    input = new Float64Array(N),
    output = fft.createComplexArray();
  const result = new Float32Array(4 * BINS * FRAMES);
  for (let c = 0; c < 2; c++)
    for (let t = 0; t < FRAMES; t++) {
      for (let j = 0; j < N; j++)
        input[j] = stereo[c][reflect(t * HOP + j - 1536, SEGMENT)] * window[j];
      fft.realTransform(output, input);
      for (let k = 0; k < BINS; k++) {
        result[(2 * c * BINS + k) * FRAMES + t] = output[2 * k] / 64;
        result[((2 * c + 1) * BINS + k) * FRAMES + t] = output[2 * k + 1] / 64;
      }
    }
  return result;
}
export function demucsWaveform(frequency) {
  const fft = new FFT(N),
    spectrum = fft.createComplexArray(),
    output = fft.createComplexArray();
  const length = (FRAMES + 3) * HOP + N;
  const denominator = new Float64Array(length);
  // torch.istft's envelope includes the restored zero frames as well.
  for (let t = 0; t < FRAMES + 4; t++)
    for (let j = 0; j < N; j++) denominator[t * HOP + j] += window[j] ** 2;
  const stereo = [];
  for (let c = 0; c < 2; c++) {
    const sum = new Float64Array(length);
    for (let t = 0; t < FRAMES; t++) {
      spectrum.fill(0);
      for (let k = 0; k < BINS; k++) {
        spectrum[2 * k] = frequency[(2 * c * BINS + k) * FRAMES + t];
        spectrum[2 * k + 1] = frequency[((2 * c + 1) * BINS + k) * FRAMES + t];
      }
      fft.completeSpectrum(spectrum);
      fft.inverseTransform(output, spectrum);
      const start = (t + 2) * HOP;
      for (let j = 0; j < N; j++) sum[start + j] += output[2 * j] * 64 * window[j];
    }
    // Remove torch center padding (2048), then HTDemucs outer padding (1536).
    stereo.push(
      Float32Array.from({ length: SEGMENT }, (_, i) => sum[i + 3584] / denominator[i + 3584])
    );
  }
  return stereo;
}

export async function separateVocals(stereo, infer, progress = () => {}) {
  const length = stereo[0].length;
  let mean = 0;
  for (let i = 0; i < length; i++) mean += (stereo[0][i] + stereo[1][i]) / 2;
  mean /= length;
  let variance = 0;
  for (let i = 0; i < length; i++) variance += ((stereo[0][i] + stereo[1][i]) / 2 - mean) ** 2;
  let std = Math.sqrt(variance / Math.max(1, length - 1));
  if (std < 1e-8) {
    variance = 0;
    for (const channel of stereo) for (const value of channel) variance += (value - mean) ** 2;
    std = Math.max(1e-8, Math.sqrt(variance / Math.max(1, 2 * length - 1)));
  }
  const vocal = new Float32Array(length),
    total = new Float32Array(length);
  for (let start = 0, index = 0; start < length; start += STRIDE, index++) {
    progress({
      key: 'separationProgress',
      args: { current: index + 1, total: Math.ceil(length / STRIDE) }
    });
    const count = Math.min(SEGMENT, length - start);
    const chunk = [new Float32Array(SEGMENT), new Float32Array(SEGMENT)];
    for (let c = 0; c < 2; c++)
      for (let i = 0; i < count; i++) chunk[c][i] = (stereo[c][start + i] - mean) / std;
    const separated = await infer(chunk, demucsSpectrogram(chunk));
    for (let i = 0; i < count; i++) {
      const weight = Math.min(i + 1, SEGMENT - i) / (SEGMENT / 2);
      vocal[start + i] += (separated[0][i] + separated[1][i]) * 0.5 * weight;
      total[start + i] += weight;
    }
  }
  let peak = 1;
  for (let i = 0; i < length; i++) {
    vocal[i] = (vocal[i] / total[i]) * std + mean;
    if (!Number.isFinite(vocal[i])) throw new Error('Non-finite separated audio');
    peak = Math.max(peak, Math.abs(vocal[i]));
  }
  if (peak > 1) for (let i = 0; i < length; i++) vocal[i] /= peak;
  return vocal;
}
