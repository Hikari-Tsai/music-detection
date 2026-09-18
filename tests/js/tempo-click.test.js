import test from 'node:test';
import assert from 'node:assert/strict';
import { clickNotes } from '../../frontend/ui/tempo-click.js';

test('clicks preserve variable beat spacing and accent detected downbeats only', () => {
  const result = clickNotes([0.25, 0.75, 1.1, 1.4], [0.25, 1.4], 2);
  assert.deepEqual(
    result.map((n) => n.start_seconds),
    [0.25, 0.75, 1.1, 1.4]
  );
  assert.deepEqual(
    result.map((n) => n.midi),
    [93, 81, 81, 93]
  );
  assert.ok(result.every((n) => Math.abs(n.end_seconds - n.start_seconds - 0.045) < 1e-8));
});

test('clicks filter invalid/outside/duplicate beats and clip the final sound', () => {
  const result = clickNotes([2, 0.98, NaN, -1, 0.25, 0.25, Infinity], [], 1);
  assert.deepEqual(
    result.map((n) => n.start_seconds),
    [0.25, 0.98]
  );
  assert.equal(result.at(-1).end_seconds, 1);
  assert.ok(result.every((n) => n.midi === 81));
  assert.deepEqual(clickNotes(undefined, undefined, 1), []);
  assert.deepEqual(clickNotes([0], [], 0), []);
});
