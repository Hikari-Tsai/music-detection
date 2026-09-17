import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeKey } from '../../frontend/inference/key.js';

test('S-KEY classes preserve official tonic and mode ordering', () => {
  for (const [index, label] of [
    [0, 'A Major'],
    [3, 'C Major'],
    [12, 'B minor'],
    [22, 'A minor']
  ]) {
    const scores = new Float32Array(24);
    scores[index] = 1;
    assert.equal(summarizeKey(scores).label, label);
  }
  assert.throws(() => summarizeKey(new Float32Array(23)), /Invalid/);
  assert.throws(() => summarizeKey(new Float32Array(24).fill(NaN)), /Invalid/);
});
test('native S-KEY score fixtures produce identical JS labels and scores', () => {
  for (const name of ['short', 'choice', 'long']) {
    const ref = JSON.parse(
      readFileSync(new URL(`../../.cache/web-fixtures/skey-${name}.json`, import.meta.url))
    );
    assert.deepEqual(summarizeKey(ref.scores), ref.key);
  }
});
