import test from 'node:test';
import assert from 'node:assert/strict';
import { tempoMidi } from '../../frontend/inference/tempo.js';
const tempo = { tempo_us: 500000, tempo_mode: 'constant', signature_beats: 4 };

test('combined MIDI is Type 1 with named Tempo and Lead Vocal tracks', () => {
  const bytes = Buffer.from(
    tempoMidi(tempo, 2, [{ start_seconds: 0.25, end_seconds: 1, midi: 60 }])
  );
  assert.equal(bytes.readUInt16BE(8), 1);
  assert.equal(bytes.readUInt16BE(10), 2);
  assert.equal(bytes.readUInt16BE(12), 480);
  assert.ok(bytes.includes(Buffer.from('Tempo')));
  assert.ok(bytes.includes(Buffer.from('Lead Vocal')));
});

test('unusable notes retain the original tempo-only bytes', () => {
  const baseline = tempoMidi(tempo, 2);
  for (const notes of [
    [],
    [{ start_seconds: 3, end_seconds: 4, midi: 60 }],
    [{ start_seconds: 0, end_seconds: 1, midi: NaN }]
  ])
    assert.deepEqual(tempoMidi(tempo, 2, notes), baseline);
});
