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

test('enhanced decoding downmixes surround through speakers instead of dropping center vocals', async (t) => {
  const saved = globalThis.OfflineAudioContext;
  t.after(() => {
    if (saved === undefined) delete globalThis.OfflineAudioContext;
    else globalThis.OfflineAudioContext = saved;
  });
  const center = Float32Array.of(0.7, 0.7),
    silent = new Float32Array(2);
  const original = {
    length: 2,
    duration: 1,
    sampleRate: 2,
    numberOfChannels: 6,
    getChannelData: (ch) => (ch === 2 ? center : silent)
  };
  let input,
    rendered = false;
  globalThis.OfflineAudioContext = class {
    constructor(channels) {
      this.channels = channels;
      this.destination = {};
    }
    async decodeAudioData() {
      return original;
    }
    createBufferSource() {
      input = { connect() {}, start() {} };
      return input;
    }
    async startRendering() {
      assert.equal(this.channels, 2);
      assert.equal(input.buffer, original);
      rendered = true;
      return { numberOfChannels: 2, getChannelData: () => center };
    }
  };
  const { decodeSource } = await import('../../frontend/ui/audio-source.js');
  const result = await decodeSource(
    { name: 'surround.wav', arrayBuffer: async () => new ArrayBuffer(0) },
    2,
    true
  );
  assert.equal(rendered, true);
  assert.deepEqual(result.stereo, [center, center]);
  result.stereo[0][0] = 0;
  assert.notEqual(result.stereo[1][0], 0, 'independent channel buffers');
});
