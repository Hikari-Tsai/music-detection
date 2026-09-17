import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../../frontend/ui/engine.js';

test('browser is the default and never implicitly calls Python', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => {
    throw new Error('Unexpected API call');
  });
  const module =
    'export async function analyzeInBrowser(file, progress) { progress("local"); return {filename:file.name}; }';
  const engine = createEngine(undefined, {
    browserModuleURL: `data:text/javascript,${encodeURIComponent(module)}`
  });
  assert.equal(engine.kind, 'browser');
  const progress = [];
  assert.deepEqual(await engine.analyze({ name: 'sample.wav' }, (x) => progress.push(x)), {
    filename: 'sample.wav'
  });
  assert.deepEqual(progress, ['local']);
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(createEngine('unknown').kind, 'browser');
});

test('Python uses its own origin for upload and MIDI download', async (t) => {
  let requested;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requested = { url: String(url), options };
    return Response.json({ result: { bpm: 120 }, download_url: '/api/download/example' });
  });
  const result = await createEngine('python').analyze(new File(['audio'], 'sample.wav'));
  assert.equal(requested.url, 'http://127.0.0.1:8765/api/analyze');
  assert.equal(requested.options.method, 'POST');
  assert.equal(requested.options.body.get('file').name, 'sample.wav');
  assert.equal(result.download_url, 'http://127.0.0.1:8765/api/download/example');
});

test('unavailable Python and missing downloads remain explicit', async (t) => {
  const engine = createEngine('python');
  t.mock.method(globalThis, 'fetch', async () => Response.json({ result: -1, download_url: null }));
  assert.equal((await engine.analyze(new File(['audio'], 'sample.wav'))).download_url, null);
  globalThis.fetch.mock.mockImplementation(async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(engine.analyze(new File(['audio'], 'sample.wav')), TypeError);
  assert.match(engine.errorMessage(new TypeError('Failed to fetch')), /本機分析服務/);
});
