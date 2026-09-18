import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRuntimeLoader } from '../../frontend/inference/runtime-assets.js';
import { createTrackedSession } from '../../frontend/inference/session.js';
import { translate } from '../../frontend/ui/i18n-core.js';

const bytes = new Uint8Array([0, 97, 115, 109]);
const manifestOverride = {
  model_file: 'ort-test.wasm',
  model_bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex')
};

test('runtime CDN fallback verifies and caches bytes for a fresh CPU worker; progress translates', async () => {
  const requests = [],
    progress = [];
  let cached;
  const options = {
    manifestOverride,
    cacheStorage: {
      open: async () => ({
        match: async () => cached?.clone(),
        put: async (url, response) => {
          cached = response;
        }
      })
    },
    fetchImpl: async (url) => {
      requests.push(String(url));
      return new Response(bytes, {
        status: String(url).startsWith('https://unpkg.com/') ? 503 : 200
      });
    }
  };
  const fresh = () =>
    createRuntimeLoader('https://example.test/staging/ort/', (p) => progress.push(p), options);
  const gpu = { env: { wasm: { wasmPaths: 'old/' } } };
  await fresh()(gpu);
  assert.deepEqual(gpu.env.wasm.wasmBinary, bytes);
  assert.equal(gpu.env.wasm.wasmPaths, undefined);
  const cpu = { env: { wasm: {} } };
  await fresh()(cpu);
  assert.deepEqual(cpu.env.wasm.wasmBinary, bytes);
  assert.equal(requests.length, 2, 'the fresh worker must reuse verified bytes, not re-download');
  for (const language of ['en', 'ja', 'zh-Hant']) {
    const rendered = progress.map((p) => translate(p, language)).join('\n');
    assert.ok(rendered.includes('unpkg'));
    assert.ok(rendered.includes('GitHub Pages'));
    assert.ok(!rendered.includes('Hugging Face'));
    assert.ok(!rendered.includes('{percent}'));
  }
});

test('runtime download failure is translated and never reports GPU initialization', async () => {
  const events = [];
  const prepare = createRuntimeLoader('https://example.test/ort/', () => {}, {
    manifestOverride,
    cacheStorage: undefined,
    fetchImpl: async () => {
      throw new Error('offline');
    }
  });
  await assert.rejects(
    createTrackedSession(
      { env: { wasm: {} }, InferenceSession: { create: () => assert.fail('runtime missing') } },
      bytes,
      { executionProviders: ['webgpu'] },
      'Beat This!',
      (e) => events.push(e),
      prepare
    ),
    (error) => {
      assert.match(error.message, /ONNX Runtime/);
      assert.match(translate(error.message, 'en'), /download failed/i);
      assert.match(translate(error.message, 'ja'), /ダウンロード/);
      return true;
    }
  );
  assert.deepEqual(events, []);
});
