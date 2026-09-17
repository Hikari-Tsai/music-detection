import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  logMel,
  chunkStarts,
  makeChunk,
  aggregateChunk,
  postprocess
} from '../../frontend/inference/dsp.js';
import { estimateTempo, tempoMidi } from '../../frontend/inference/tempo.js';
const fixture = new URL('../../.cache/web-fixtures/', import.meta.url);
const json = (name) => JSON.parse(readFileSync(new URL(name, fixture)));
const floats = (name) => {
  const b = readFileSync(new URL(name, fixture));
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};

test('JS frontend matches torchaudio spectrogram on real audio', () => {
  const constants = JSON.parse(
    readFileSync(new URL('../../assets/onnx/frontend.json', import.meta.url))
  );
  const actual = logMel(floats('choice.f32'), constants).data,
    expected = floats('choice.spect.f32');
  assert.equal(actual.length, expected.length);
  let max = 0;
  for (let i = 0; i < actual.length; i++) max = Math.max(max, Math.abs(actual[i] - expected[i]));
  assert.ok(max < 0.0001, `max spectrum error ${max}`);
  console.log({ max_spectrum_error: max });
});
test('Python logits yield exactly the same beat/downbeat times in JS', () => {
  for (const name of ['choice', 'long']) {
    const ref = json(`${name}.json`);
    assert.deepEqual(postprocess(ref.beat_logits, ref.downbeat_logits), {
      beats: ref.beats,
      downbeats: ref.downbeats
    });
  }
});
test('known constant, uncertain and variable timing semantics match', () => {
  const ref = json('choice.json');
  assert.equal(estimateTempo(ref.beats, ref.downbeats).bpm, 68.007);
  const fixed = Array.from({ length: 17 }, (_, i) => i * 0.5);
  assert.equal(estimateTempo(fixed, []).tempo_mode, 'average');
  assert.equal(
    estimateTempo(
      fixed,
      fixed.filter((_, i) => i % 4 === 0)
    ).tempo_mode,
    'constant'
  );
  assert.equal(estimateTempo([0.5], []), -1);
  assert.equal(estimateTempo([0, 0.5, 1, 1.5, 20], []), -1);
  const changing = json('tempo.json');
  const actual = estimateTempo(changing.beats, []);
  assert.equal(actual.tempo_mode, 'variable');
  assert.equal(actual.bpm, changing.result.bpm);
  assert.equal(actual.signature_beats, null);
  // Full MIDI binary equality validates tempo deltas, initial offset and duration.
  assert.deepEqual(
    Buffer.from(tempoMidi(actual, changing.duration)),
    readFileSync(new URL('tempo.mid', fixture))
  );
});
test('long audio chunk overlap has no gaps and keeps earlier predictions', () => {
  for (const frames of [51, 1488, 1489, 1500, 1501, 3000, 60001]) {
    const starts = chunkStarts(frames);
    const spectrum = new Float32Array(frames * 128);
    const beats = new Float32Array(frames).fill(-1000),
      downbeats = new Float32Array(frames).fill(-1000);
    for (let i = starts.length - 1; i >= 0; i--) {
      const chunk = makeChunk(spectrum, frames, starts[i]);
      assert.ok(chunk.length <= 1500);
      aggregateChunk(
        beats,
        downbeats,
        {
          beat: new Float32Array(chunk.length).fill(i),
          downbeat: new Float32Array(chunk.length).fill(i)
        },
        starts[i]
      );
    }
    assert.ok(beats.every((v) => v >= 0));
    assert.equal(beats[0], 0);
    if (frames > 1488) assert.equal(beats[1487], 0);
  }
});
test('peaks: threshold, ties, nearby downbeat snapping and deduplication', () => {
  const b = new Float32Array(40).fill(-3),
    d = b.slice();
  b[4] = 2;
  b[5] = 2;
  b[20] = 3;
  b[21] = 2;
  b[30] = 0;
  d[3] = 2;
  d[10] = 2;
  d[23] = 2;
  assert.deepEqual(postprocess(b, d), { beats: [0.09, 0.4], downbeats: [0.09, 0.4] });
});
