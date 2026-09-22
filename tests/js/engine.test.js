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

test('both engine adapters forward the chosen range and Python sends time fields with the original file', async (t) => {
  const range = { start: 12.5, end: 30 };
  const module =
    'export async function analyzeInBrowser(file, progress, options) { return options.range; }';
  const browser = createEngine('browser', {
    browserModuleURL: `data:text/javascript,${encodeURIComponent(module)}`
  });
  assert.deepEqual(
    await browser.analyze(new File(['audio'], 'sample.wav'), () => {}, { range }),
    range
  );
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.body.get('start_seconds'), '12.5');
    assert.equal(options.body.get('end_seconds'), '30');
    assert.equal(await options.body.get('file').text(), 'original');
    return Response.json({
      download_url: null,
      selection_start_seconds: 12.5,
      selection_end_seconds: 30
    });
  });
  await createEngine('python').analyze(new File(['original'], 'sample.wav'), () => {}, { range });
});

test('an older Python service must not silently return whole-track results for a clip', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ result: { bpm: 120 }, download_url: '/api/download/old' })
  );
  await assert.rejects(
    createEngine('python').analyze(new File(['audio'], 'sample.wav'), () => {}, {
      range: { start: 5, end: 10 }
    }),
    /更新專案/
  );
});

test('enhanced options stay in the browser and preserve the selected range and prepared audio', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => {
    throw new Error('Unexpected upload');
  });
  const module =
    'export async function analyzeInBrowser(file, progress, options) { return options; }';
  const options = {
    enhanced: true,
    range: { start: 5, end: 15 },
    prepared: { audio: new Float32Array([0.5]), sampleRate: 22050 }
  };
  const engine = createEngine('browser', {
    browserModuleURL: `data:text/javascript,${encodeURIComponent(module)}`
  });
  assert.equal(await engine.analyze(new File(['audio'], 'clip.wav'), () => {}, options), options);
  assert.equal(fetch.mock.callCount(), 0);
});

test('Python explicitly sends the selected pitch mode with the original file and range', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, { body }) => {
    requests.push(body);
    return Response.json({
      pitch_mode: body.get('enhanced') === 'true' ? 'enhanced' : 'standard',
      selection_start_seconds: 5,
      selection_end_seconds: 15,
      download_url: null
    });
  });
  const engine = createEngine('python');
  const file = new File(['original'], 'clip.wav');
  await engine.analyze(file, () => {}, { enhanced: true, range: { start: 5, end: 15 } });
  await engine.analyze(file, () => {}, { enhanced: false });
  await engine.analyze(file);
  assert.deepEqual(
    requests.map((body) => body.get('enhanced')),
    ['true', 'false', 'false']
  );
  assert.equal(requests[0].get('start_seconds'), '5');
  assert.equal(requests[0].get('end_seconds'), '15');
  assert.equal(await requests[0].get('file').text(), 'original');
});

test('enhanced requests reject unconfirmed or standard-mode results from older Python services', async (t) => {
  let response;
  t.mock.method(globalThis, 'fetch', async () => Response.json(response));
  const engine = createEngine('python');
  for (const pitch_mode of [undefined, 'standard']) {
    response = { pitch_mode, pitch_status: 'estimated', pitch: { model: 'GAME Small' } };
    await assert.rejects(
      engine.analyze(new File(['audio'], 'clip.wav'), () => {}, { enhanced: true }),
      /未確認強化模式/
    );
  }
});

test('confirmed enhancement failure preserves usable tempo/key results and the MIDI URL', async (t) => {
  const response = {
    pitch_mode: 'enhanced',
    pitch_status: 'error',
    pitch_reason: 'enhancement_failed',
    result: { bpm: 120 },
    key_status: 'estimated',
    key: { tonic: 'C', mode: 'major' },
    download_url: '/api/download/tempo-only'
  };
  t.mock.method(globalThis, 'fetch', async () => Response.json(response));
  const result = await createEngine('python').analyze(new File(['audio'], 'clip.wav'), () => {}, {
    enhanced: true
  });
  assert.deepEqual(result, {
    ...response,
    download_url: 'http://127.0.0.1:8765/api/download/tempo-only'
  });
});
