import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createModelAssets, ModelLoadError } from '../../frontend/inference/model-assets.js';
const bytes = new Uint8Array([1, 2, 3, 4]);
const manifest = {
  model_file: 'model.onnx',
  model_bytes: 4,
  sha256: createHash('sha256').update(bytes).digest('hex')
};

test('a pinned runtime binary uses its CDN label, verifies bytes and falls back on corruption', async () => {
  const requests = [],
    notices = [];
  const assets = createModelAssets('https://example.test/staging/ort/', (m) => notices.push(m), {
    primaryBaseURL: 'https://unpkg.com/onnxruntime-web@1.24.3/dist/',
    primaryName: 'unpkg',
    assetKind: 'runtime',
    manifestOverride: { ...manifest, model_file: 'ort-wasm-simd-threaded.asyncify.wasm' },
    cacheStorage: undefined,
    fetchImpl: async (url) => {
      requests.push(String(url));
      return new Response(
        String(url).startsWith('https://unpkg.com/') ? new Uint8Array([9]) : bytes
      );
    }
  });
  assert.deepEqual(await assets.model(), bytes);
  assert.equal(requests.length, 2);
  assert.ok(requests[1].startsWith('https://example.test/staging/ort/'));
  assert.ok(notices.some((m) => m.some((p) => p?.args?.from === 'unpkg')));
});
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

const primary = 'https://huggingface.co/account/model/resolve/fixed/';
const fallback = 'https://example.test/repo/models/';
const frontend = {
  sample_rate: 22050,
  n_fft: 1024,
  hop_length: 441,
  n_mels: 128,
  window: Array(1024).fill(1),
  mel_filters: Array.from({ length: 128 }, () => Array(513).fill(0))
};
function multi(fetcher, options = {}) {
  const calls = [],
    messages = [];
  const assets = createModelAssets(new URL(fallback), (m) => messages.push(m), {
    primaryBaseURL: primary,
    cacheStorage: undefined,
    ...options,
    fetchImpl: (url, init) => {
      calls.push(String(url));
      return fetcher(String(url), init);
    }
  });
  return { assets, calls, messages };
}
const serve = (url, modelBytes = bytes, config = frontend) =>
  url.endsWith('manifest.json')
    ? Response.json({
        ...manifest,
        model_bytes: modelBytes.length,
        sha256: createHash('sha256').update(modelBytes).digest('hex')
      })
    : url.endsWith('frontend.json')
      ? Response.json(config)
      : new Response(modelBytes);

test('Hugging Face success never requests fallback and concurrent consumers share a bundle', async () => {
  const { assets, calls } = multi(async (url) => serve(url), { includeFrontend: true });
  const [config, modelBytes] = await Promise.all([assets.frontend(), assets.model()]);
  assert.deepEqual(config, frontend);
  assert.deepEqual(modelBytes, bytes);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((url) => url.startsWith(primary)));
});

test('HTTP and invalid metadata errors switch to a complete fallback bundle', async () => {
  for (const broken of [
    () => new Response('down', { status: 503 }),
    () => new Response('not json'),
    () => Response.json({})
  ]) {
    const { assets, calls, messages } = multi(
      async (url) => (url.startsWith(primary) ? broken() : serve(url)),
      { includeFrontend: true }
    );
    assert.deepEqual(await assets.frontend(), frontend);
    assert.deepEqual(await assets.model(), bytes);
    assert.deepEqual(
      calls.slice(1),
      ['manifest.json', 'frontend.json', 'model.onnx'].map((x) => fallback + x)
    );
    assert.ok(messages.some((m) => m.some((part) => part?.key === 'modelSourceFallback')));
  }
});

test('failed primary weights switch manifest AND frontend; fallback may have a different hash', async () => {
  const other = new Uint8Array([5, 6, 7]);
  const otherFrontend = { ...frontend, window: Array(1024).fill(0.5) };
  const { assets, calls, messages } = multi(
    async (url) => {
      if (url === primary + 'model.onnx') return new Response(bytes, { status: 503 });
      return url.startsWith(primary) ? serve(url) : serve(url, other, otherFrontend);
    },
    { includeFrontend: true }
  );
  assert.deepEqual(await assets.frontend(), otherFrontend);
  assert.deepEqual(await assets.model(), other);
  assert.equal(calls.length, 6);
  const download = messages.filter((m) => m.some((p) => p?.key === 'modelProgress'));
  assert.ok(
    download.length && download.every((m) => m.some((p) => p?.key === 'modelSourceFallback'))
  );
});

test('malformed preprocessing falls back as a configuration error before downloading weights', async () => {
  for (const invalid of [null, { ...frontend, window: { length: 1024 } }]) {
    const { assets, calls, messages } = multi(
      async (url) => serve(url, bytes, url.startsWith(primary) ? invalid : frontend),
      { includeFrontend: true }
    );
    assert.deepEqual(await assets.frontend(), frontend);
    assert.ok(!calls.includes(primary + 'model.onnx'));
    assert.ok(messages.some((m) => m.some((p) => p?.key === 'modelSourceConfig')));
  }
});

test('cache denial does not switch a healthy primary to fallback', async () => {
  const { assets, calls } = multi(async (url) => serve(url), {
    cacheStorage: {
      open: async () => {
        throw new Error('denied');
      }
    }
  });
  assert.deepEqual(await assets.model(), bytes);
  assert.ok(calls.every((url) => url.startsWith(primary)));
});

test('corrupt or truncated primary weights fall back without caching unverified bytes', async () => {
  for (const bad of [
    new Uint8Array([9, 9, 9, 9]),
    new Uint8Array([1]),
    new Uint8Array([1, 2, 3, 4, 5])
  ]) {
    const stored = [];
    const { assets, messages } = multi(
      async (url) => (url === primary + 'model.onnx' ? new Response(bad) : serve(url)),
      {
        cacheStorage: {
          open: async () => ({
            match: async () => undefined,
            put: async (url, r) => stored.push(new Uint8Array(await r.arrayBuffer()))
          })
        }
      }
    );
    assert.deepEqual(await assets.model(), bytes);
    assert.deepEqual(stored, [bytes]);
    assert.ok(messages.some((m) => m.some((p) => p?.key === 'modelSourceIntegrity')));
  }
});

test('connection and stalled stream timeouts abort primary then try fallback', async () => {
  for (const stall of ['headers', 'body']) {
    let aborted = false;
    const { assets, messages } = multi(
      async (url, { signal }) => {
        if (url.startsWith(primary) && (stall === 'headers' || url.endsWith('.onnx'))) {
          signal.addEventListener('abort', () => {
            aborted = true;
          });
          return stall === 'headers'
            ? new Promise(() => {})
            : new Response(
                new ReadableStream({
                  start(c) {
                    c.enqueue(bytes.subarray(0, 1));
                  }
                })
              );
        }
        return serve(url);
      },
      { timeoutMs: 15 }
    );
    assert.deepEqual(await assets.model(), bytes);
    assert.ok(aborted);
    assert.ok(messages.some((m) => m.some((p) => p?.key === 'modelSourceTimeout')));
  }
});

test('a progressing slow stream does not trigger a total-duration timeout', async () => {
  const { assets, calls } = multi(
    async (url) => {
      if (!url.endsWith('.onnx')) return serve(url);
      let n = 0;
      return new Response(
        new ReadableStream({
          async pull(c) {
            await new Promise((r) => setTimeout(r, 10));
            if (n < bytes.length) c.enqueue(bytes.subarray(n, ++n));
            else c.close();
          }
        })
      );
    },
    { timeoutMs: 35 }
  );
  assert.deepEqual(await assets.model(), bytes);
  assert.ok(calls.every((url) => url.startsWith(primary)));
});

test('both sources fail explicitly; a later attempt starts fresh at Hugging Face', async () => {
  let offline = true;
  const { assets, calls } = multi(async (url) => {
    if (offline) throw new TypeError('offline');
    return serve(url);
  });
  await assert.rejects(assets.model(), (error) => {
    assert.ok(error instanceof ModelLoadError);
    assert.match(error.message, /Hugging Face.*備援/);
    return true;
  });
  assert.deepEqual(calls, [primary + 'manifest.json', fallback + 'manifest.json']);
  offline = false;
  assert.deepEqual(await assets.model(), bytes);
  assert.equal(calls[2], primary + 'manifest.json');
});

test('a valid existing same-origin hash cache avoids both model downloads', async () => {
  const seen = [];
  const { assets, calls } = multi(async (url) => serve(url), {
    cacheStorage: {
      open: async (name) => ({
        match: async (url) => {
          seen.push({ name, url });
          return new Response(bytes);
        }
      })
    }
  });
  assert.deepEqual(await assets.model(), bytes);
  assert.deepEqual(calls, [primary + 'manifest.json']);
  assert.deepEqual(seen, [
    { name: `tempo-model-${manifest.sha256}`, url: fallback + 'model.onnx' }
  ]);
});

test('pinned GAME member needs no remote manifest and verifies GitHub fallback against the same hash', async () => {
  const calls = [],
    notices = [];
  const assets = createModelAssets(
    'https://raw.githubusercontent.com/owner/repo/commit/game/',
    (m) => notices.push(m),
    {
      primaryBaseURL: primary,
      manifestOverride: manifest,
      fallbackName: 'GitHub',
      cacheStorage: undefined,
      fetchImpl: async (url) => {
        calls.push(String(url));
        return String(url).startsWith(primary)
          ? new Response('offline', { status: 503 })
          : new Response(bytes);
      }
    }
  );
  assert.deepEqual(await assets.model(), bytes);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((u) => u.endsWith('model.onnx')));
  assert.ok(notices.some((m) => m.some((p) => p?.args?.to === 'GitHub')));
});
