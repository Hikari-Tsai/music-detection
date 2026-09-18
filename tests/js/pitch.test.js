import test from 'node:test';
import assert from 'node:assert/strict';
import { pitchChunks, decodePitchChunk, summarizePitch } from '../../frontend/inference/pitch.js';

test('GAME chunks cover every sample once with context overlap and bounded input', () => {
  const chunks = pitchChunks(44100 * 25);
  assert.equal(chunks[0].coreStart, 0);
  assert.equal(chunks.at(-1).coreEnd, 44100 * 25);
  for (let i = 0; i < chunks.length; i++) {
    assert.ok(chunks[i].end - chunks[i].start <= 44100 * 10);
    if (i) assert.equal(chunks[i - 1].coreEnd, chunks[i].coreStart);
  }
});
test('pitch decoding advances across unvoiced notes, excludes padding, short and invalid notes', () => {
  const notes = decodePitchChunk(
    {
      durations: [1, 1, 0.02, 1, 1, 1],
      scores: [0, 69, 100, NaN, 72, 75],
      presence: [0, 1, 1, 1, 1, 1],
      mask: [1, 1, 1, 1, 1, 0]
    },
    { start: 0, coreStart: 0, coreEnd: 6 * 44100 }
  );
  assert.equal(notes.length, 2);
  assert.equal(notes[0].start_seconds, 1);
  assert.equal(notes[0].note, 'A4');
  assert.equal(notes[0].hz, 440);
  assert.equal(notes[1].note, 'C5');
  const result = summarizePitch(notes);
  assert.equal(result.pitch.lowest.note, 'A4');
  assert.equal(result.pitch.highest.note, 'C5');
  assert.equal(result.pitch.semitones, 3);
  assert.equal(summarizePitch([]).pitch_reason, 'no_notes');
});
test('overlap is clipped to owned time span; MIDI zero remains a valid pitch', () => {
  const notes = decodePitchChunk(
    { durations: [2, 2], scores: [0, 69], presence: [1, 1], mask: [1, 1] },
    { start: 7 * 44100, coreStart: 8 * 44100, coreEnd: 10 * 44100 }
  );
  assert.deepEqual(
    notes.map((n) => [n.start_seconds, n.end_seconds]),
    [
      [8, 9],
      [9, 10]
    ]
  );
  assert.equal(notes[0].note, 'C-1');
});
