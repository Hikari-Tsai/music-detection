import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createModelAssets } from '../../frontend/inference/model-assets.js';
const bytes = new Uint8Array([1, 2, 3, 4]);
const manifest = {
  model_file: 'model.onnx',
  model_bytes: 4,
  sha256: createHash('sha256').update(bytes).digest('hex')
};
function setup(cacheStorage, downloaded = bytes) {
  const calls = [];
  const assets = createModelAssets(new URL('https://example.test/repo/models/'), () => {}, {
    cacheStorage,
    fetchImpl: async (url) => {
      calls.push(String(url));
      return String(url).endsWith('.json') ? Response.json(manifest) : new Response(downloaded);
    }
  });
  return { assets, calls };
}
test('denied cache reads still download and reuse verified model in memory', async () => {
  const { assets, calls } = setup({
    open: async () => ({
      match: async () => {
        throw new Error('denied');
      }
    })
  });
  assert.deepEqual(await assets.model(), bytes);
  assert.deepEqual(await assets.model(), bytes);
  assert.equal(calls.filter((x) => x.endsWith('.onnx')).length, 1);
});
test('corrupt cached model is replaced before use', async () => {
  let removed = false,
    stored = false;
  const { assets, calls } = setup({
    open: async () => ({
      match: async () => new Response(new Uint8Array([9, 9, 9, 9])),
      delete: async () => {
        removed = true;
      },
      put: async () => {
        stored = true;
      }
    })
  });
  assert.deepEqual(await assets.model(), bytes);
  assert.ok(removed && stored);
  assert.equal(calls.length, 2);
});
test('a valid cache avoids downloading weights, and corrupt downloads reject', async () => {
  const cached = setup({ open: async () => ({ match: async () => new Response(bytes) }) });
  assert.deepEqual(await cached.assets.model(), bytes);
  assert.equal(cached.calls.length, 1);
  await assert.rejects(setup(undefined, new Uint8Array([9, 9, 9, 9])).assets.model(), /驗證失敗/);
});
