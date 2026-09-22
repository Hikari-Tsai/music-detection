import test from 'node:test';
import assert from 'node:assert/strict';
import { separateInBrowser } from '../../frontend/inference/separation-client.js';
function setup() {
  const worker = {
    postMessage() {},
    terminate() {
      this.terminated = true;
    }
  };
  const progress = [];
  const pending = separateInBrowser(
    [new Float32Array(4), new Float32Array(4)],
    (p) => progress.push(p),
    { makeWorker: () => worker }
  );
  return { worker, pending, progress };
}
test('separation allocator is terminated before caller can load Large', async () => {
  const { worker, pending, progress } = setup();
  worker.onmessage({ data: { type: 'result', audio: new Float32Array([1, 2]).buffer } });
  assert.equal(worker.terminated, true);
  assert.deepEqual([...(await pending)], [1, 2]);
  assert.equal(progress.at(-1).key, 'separationReleased');
  assert.equal(worker.onmessage, null);
});
test('failed or hung separation releases its worker and never returns unseparated input', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { worker, pending } = setup();
  const rejected = assert.rejects(pending, /timed out/);
  t.mock.timers.tick(30000);
  await rejected;
  assert.equal(worker.terminated, true);
});
