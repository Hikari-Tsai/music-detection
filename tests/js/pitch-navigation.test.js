import test from 'node:test';
import assert from 'node:assert/strict';
import { pickPitchNote } from '../../frontend/ui/pitch-navigation.js';

test('pitch preview selects the clicked interval and the nearest interval in gaps', () => {
  const long = { start_seconds: 0, end_seconds: 4 };
  const next = { start_seconds: 4, end_seconds: 5 };
  const last = { start_seconds: 7, end_seconds: 8 };
  const notes = [long, next, last];
  assert.equal(pickPitchNote(notes, 3.5), long);
  assert.equal(pickPitchNote(notes, 4), next);
  assert.equal(pickPitchNote(notes, 5.9), next);
  assert.equal(pickPitchNote(notes, 6.1), last);
  assert.equal(pickPitchNote(notes, -1), long);
  assert.equal(pickPitchNote(notes, 9), last);
  assert.equal(pickPitchNote([], 1), null);
});
