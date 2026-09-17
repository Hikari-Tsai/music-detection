import test from 'node:test';
import assert from 'node:assert/strict';
import { selectSamples, makeWaveform } from '../../frontend/ui/audio-source.js';

test('selection includes only the requested samples and leaves the source reusable', () => {
  const audio = Float32Array.from({ length: 50 }, (_, i) => i);
  const clip = selectSamples(audio, 10, { start: 1.2, end: 3.5 });
  assert.deepEqual([...clip], [...audio.slice(12, 35)]);
  clip[0] = -100;
  assert.equal(audio[12], 12);
  assert.equal(selectSamples(audio, 10).length, 50);
  assert.equal(selectSamples(audio, 10, { start: 4, end: 5 }).length, 10);
});

test('invalid and sub-second selections cannot be analyzed', () => {
  const audio = new Float32Array(50);
  for (const range of [
    { start: -1, end: 3 },
    { start: 1, end: 6 },
    { start: 2, end: 1 },
    { start: 0, end: 0.9 },
    { start: NaN, end: 3 },
    { start: 0, end: Infinity }
  ])
    assert.throws(() => selectSamples(audio, 10, range), /選取範圍/);
});

test('source waveform remains finite for silence and preserves a localized peak', () => {
  assert.deepEqual(makeWaveform(new Float32Array(480)), Array(240).fill(0));
  const audio = new Float32Array(480);
  audio[200] = -0.5;
  const waveform = makeWaveform(audio);
  assert.equal(waveform[100], 1);
  assert.equal(
    waveform.reduce((a, b) => a + b, 0),
    1
  );
});
