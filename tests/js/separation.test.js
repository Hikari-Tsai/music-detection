import test from 'node:test';
import assert from 'node:assert/strict';
import {
  demucsSpectrogram,
  demucsWaveform,
  SEGMENT
} from '../../frontend/inference/separation-dsp.js';

test('Demucs complex channel layout and normalized inverse preserve stereo and timing', () => {
  const audio = [new Float32Array(SEGMENT), new Float32Array(SEGMENT)];
  for (let i = 0; i < SEGMENT; i++) {
    audio[0][i] = 0.2 * Math.sin(i * 0.13);
    audio[1][i] = 0.3 * Math.cos(i * 0.037);
  }
  const spec = demucsSpectrogram(audio);
  assert.equal(spec.length, 4 * 2048 * 336);
  const reconstructed = demucsWaveform(spec);
  // Dropped Nyquist and zero edge frames make the outer boundary lossy.
  let error = 0;
  for (let c = 0; c < 2; c++)
    for (let i = 4096; i < SEGMENT - 4096; i++)
      error = Math.max(error, Math.abs(audio[c][i] - reconstructed[c][i]));
  assert.ok(error < 1e-5, String(error));
});
