import test from 'node:test';
import assert from 'node:assert/strict';

let runId = 0;
async function setup(t, query = '') {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const saved = { Worker: globalThis.Worker, location: globalThis.location };
  const workers = [];
  globalThis.location = { href: `https://example.com/staging/${query}` };
  globalThis.Worker = class {
    constructor() {
      workers.push(this);
    }
    postMessage(data, transfer) {
      this.input = structuredClone(data, { transfer });
    }
    terminate() {
      this.terminated = true;
    }
    emit(data) {
      this.onmessage?.({ data });
    }
  };
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  const { analyzeInBrowser } = await import(`../../frontend/inference/client.js?test=${++runId}`);
  const source = {
    audio: Float32Array.from({ length: 88200 }, (_, i) => i / 88200),
    sampleRate: 22050,
    pitchSource: {
      audio: Float32Array.from({ length: 176400 }, (_, i) => -i / 176400),
      sampleRate: 44100
    }
  };
  const progress = [];
  const analyze = () =>
    analyzeInBrowser({ name: 'clip.wav' }, (p) => progress.push(p), {
      prepared: source,
      range: { start: 1, end: 3 }
    });
  return { workers, progress, analyze, source };
}
const phase = (worker, provider = 'webgpu', state = 'start', model = 'Beat This!') =>
  worker.emit({ type: 'session-init', provider, state, model });
const result = (worker) => worker.emit({ type: 'result', data: { result: { bpm: 120 } } });

test('hung GPU init terminates its worker and retries the same selected audio once on CPU', async (t) => {
  const { workers, analyze, source, progress } = await setup(t);
  const pending = analyze();
  const first = workers[0];
  first.emit({ type: 'started' });
  const staleHandler = first.onmessage;
  const original = first.input;
  phase(first);
  t.mock.timers.tick(59999);
  assert.equal(workers.length, 1);
  t.mock.timers.tick(1);
  assert.equal(workers.length, 2);
  assert.equal(first.terminated, true);
  const second = workers[1];
  assert.equal(second.input.forceWasm, true);
  assert.deepEqual(second.input.audio, original.audio);
  assert.deepEqual(second.input.pitchAudio, original.pitchAudio);
  assert.equal(second.input.audio.byteLength, 44100 * 4);
  assert.equal(source.audio.length, 88200);
  assert.equal(source.pitchSource.audio.length, 176400);
  staleHandler({ data: { type: 'error', message: 'late GPU failure' } });
  second.emit({ type: 'started' });
  phase(second, 'wasm');
  phase(second, 'wasm', 'end');
  result(second);
  assert.equal((await pending).result.bpm, 120);
  assert.ok(progress.some((p) => JSON.stringify(p).includes('gpuInitTimeoutFallback')));
  t.mock.timers.tick(200000);
  assert.equal(second.terminated, undefined);
  const next = analyze();
  assert.equal(second.input.forceWasm, true, 'avoid the same GPU hang until page reload');
  second.emit({ type: 'started' });
  result(second);
  await next;
});

test('CPU init timeout ends the retry instead of looping; a manual retry gets a fresh worker', async (t) => {
  const { workers, analyze } = await setup(t);
  const pending = analyze();
  const rejected = assert.rejects(pending, /CPU 分析引擎初始化逾時/);
  workers[0].emit({ type: 'started' });
  phase(workers[0]);
  t.mock.timers.tick(60000);
  workers[1].emit({ type: 'started' });
  phase(workers[1], 'wasm');
  t.mock.timers.tick(119999);
  assert.equal(workers[1].terminated, undefined);
  t.mock.timers.tick(1);
  await rejected;
  assert.equal(workers.length, 2);
  assert.equal(workers[1].terminated, true);
  const retry = analyze();
  assert.equal(workers.length, 3);
  assert.equal(workers[2].input.forceWasm, true);
  workers[2].emit({ type: 'started' });
  result(workers[2]);
  await retry;
});

test('forced CPU does not attempt GPU and its initialization is bounded', async (t) => {
  const { workers, analyze } = await setup(t, '?engine=wasm');
  const pending = analyze();
  const rejected = assert.rejects(pending, /CPU 分析引擎初始化逾時/);
  assert.equal(workers[0].input.forceWasm, true);
  workers[0].emit({ type: 'started' });
  phase(workers[0], 'wasm');
  t.mock.timers.tick(120000);
  await rejected;
  assert.equal(workers.length, 1);
  assert.equal(workers[0].terminated, true);
});

test('download progress and long inference do not consume session-init timeouts', async (t) => {
  const { workers, analyze } = await setup(t);
  const pending = analyze();
  const w = workers[0];
  w.emit({ type: 'started' });
  w.emit({ type: 'progress', text: { key: 'modelProgress', args: { percent: 10 } } });
  t.mock.timers.tick(300000);
  assert.equal(w.terminated, undefined);
  phase(w);
  t.mock.timers.tick(59999);
  phase(w, 'webgpu', 'end');
  t.mock.timers.tick(300000);
  assert.equal(workers.length, 1);
  // S-KEY then several GAME sessions each get their own timer.
  for (const [provider, model] of [
    ['wasm', 'S-KEY'],
    ['webgpu', 'GAME / encoder'],
    ['webgpu', 'GAME / estimator']
  ]) {
    phase(w, provider, 'start', model);
    t.mock.timers.tick(50000);
    phase(w, provider, 'end', model);
  }
  result(w);
  await pending;
  t.mock.timers.tick(300000);
  assert.equal(w.terminated, undefined);
});

test('GAME GPU init has the same fallback and incidental progress cannot extend its deadline', async (t) => {
  const { workers, analyze } = await setup(t);
  const pending = analyze();
  const w = workers[0];
  w.emit({ type: 'started' });
  phase(w, 'webgpu', 'start', 'GAME / encoder');
  t.mock.timers.tick(50000);
  w.emit({ type: 'progress', text: 'still preparing' });
  t.mock.timers.tick(10000);
  assert.equal(workers.length, 2);
  workers[1].emit({ type: 'started' });
  result(workers[1]);
  await pending;
});

test('worker startup timeout cleans up and lets the next analysis start', async (t) => {
  const { workers, analyze } = await setup(t);
  const pending = analyze();
  const rejected = assert.rejects(pending, /分析引擎啟動逾時/);
  t.mock.timers.tick(30000);
  await rejected;
  assert.equal(workers[0].terminated, true);
  const retry = analyze();
  assert.equal(workers[1].input.forceWasm, false);
  workers[1].emit({ type: 'started' });
  result(workers[1]);
  await retry;
});

test('worker errors clear timers and discard the failed runtime without GPU retries', async (t) => {
  const { workers, analyze } = await setup(t);
  for (const failure of ['error', 'onerror', 'onmessageerror']) {
    const count = workers.length;
    const pending = analyze();
    const rejected = assert.rejects(pending);
    const w = workers.at(-1);
    w.emit({ type: 'started' });
    phase(w);
    if (failure === 'error') w.emit({ type: 'error', message: 'analysis failed' });
    else w[failure]();
    await rejected;
    t.mock.timers.tick(300000);
    assert.equal(w.terminated, true);
    assert.equal(workers.length, count + 1);
  }
});

test('session lifecycle brackets both successful and rejected ONNX initialization', async () => {
  const { createTrackedSession } = await import('../../frontend/inference/session.js');
  for (const fails of [false, true]) {
    const events = [];
    const session = {};
    const ort = {
      InferenceSession: {
        create: async () => {
          assert.equal(events[0].state, 'start');
          if (fails) throw new Error('GPU rejected');
          return session;
        }
      }
    };
    const pending = createTrackedSession(
      ort,
      new Uint8Array(),
      { executionProviders: ['webgpu'] },
      'GAME / encoder',
      (p) => events.push(p),
      async () => {}
    );
    if (fails) await assert.rejects(pending, /GPU rejected/);
    else assert.equal(await pending, session);
    assert.deepEqual(
      events.map((e) => [e.state, e.model, e.provider]),
      [
        ['start', 'GAME / encoder', 'webgpu'],
        ['end', 'GAME / encoder', 'webgpu']
      ]
    );
  }
});

test('runtime download finishes before the GPU watchdog starts, even after 60 seconds', async (t) => {
  const { createTrackedSession } = await import('../../frontend/inference/session.js');
  const { workers, analyze } = await setup(t);
  const analysis = analyze();
  const worker = workers[0];
  worker.emit({ type: 'started' });
  let finishDownload;
  const downloaded = new Promise((resolve) => {
    finishDownload = resolve;
  });
  const session = createTrackedSession(
    { InferenceSession: { create: async () => ({}) } },
    new Uint8Array(),
    { executionProviders: ['webgpu'] },
    'Beat This!',
    (message) => worker.emit(message),
    () => downloaded
  );
  t.mock.timers.tick(90000);
  assert.equal(workers.length, 1, 'a slow runtime download must not trigger CPU fallback');
  assert.equal(worker.terminated, undefined);
  finishDownload();
  await session;
  result(worker);
  await analysis;
});

test('unsupported enhancement preserves original beat/key input and never supplies Small audio', async (t) => {
  const { workers, source } = await setup(t, '?engine=wasm');
  const { analyzeInBrowser } = await import(`../../frontend/inference/client.js?test=${++runId}`);
  const pending = analyzeInBrowser({ name: 'clip.wav' }, () => {}, {
    prepared: source,
    enhanced: true,
    range: { start: 1, end: 3 }
  });
  assert.equal(workers[0].input.enhanced, true);
  assert.equal(workers[0].input.enhancementError, 'enhancementWebGPURequired');
  assert.equal(workers[0].input.pitchAudio, undefined);
  assert.equal(workers[0].input.audio.byteLength, 44100 * 4);
  result(workers[0]);
  assert.equal((await pending).result.bpm, 120);
  assert.equal(workers[0].terminated, true, 'release analysis allocator after enhanced response');
});

test('enhanced Large GPU timeout preserves beat/key retry without substituting Small', async (t) => {
  const { workers, source } = await setup(t);
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const previousContext = globalThis.OfflineAudioContext;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { gpu: {} } });
  globalThis.OfflineAudioContext = class {
    async decodeAudioData() {
      return {
        length: 176400,
        duration: 4,
        sampleRate: 44100,
        numberOfChannels: 2,
        getChannelData: () => new Float32Array(176400).fill(0.1)
      };
    }
  };
  t.after(() => {
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
    else delete globalThis.navigator;
    if (previousContext === undefined) delete globalThis.OfflineAudioContext;
    else globalThis.OfflineAudioContext = previousContext;
  });
  const { analyzeInBrowser } = await import(`../../frontend/inference/client.js?test=${++runId}`);
  const pending = analyzeInBrowser(
    { name: 'clip.wav', arrayBuffer: async () => new ArrayBuffer(8) },
    () => {},
    { prepared: source, enhanced: true, range: { start: 1, end: 3 } }
  );
  for (let i = 0; i < 8; i++) await Promise.resolve();
  const separator = workers[0];
  assert.equal(separator.input.stereo[0].byteLength, 88200 * 4);
  separator.emit({ type: 'result', audio: new Float32Array(88200).fill(0.2).buffer });
  for (let i = 0; i < 4; i++) await Promise.resolve();
  assert.equal(separator.terminated, true);
  const analysis = workers[1];
  assert.equal(analysis.input.enhanced, true);
  assert.equal(analysis.input.enhancementError, null);
  assert.equal(new Float32Array(analysis.input.pitchAudio)[0], Math.fround(0.2));
  analysis.emit({ type: 'started' });
  phase(analysis, 'webgpu', 'start', 'GAME / encoder');
  t.mock.timers.tick(60000);
  assert.equal(analysis.terminated, true);
  const retry = workers[2];
  assert.equal(retry.input.forceWasm, true);
  assert.equal(retry.input.enhanced, true);
  assert.equal(retry.input.enhancementError, 'enhancementFailed');
  assert.equal(retry.input.pitchAudio, undefined);
  assert.equal(retry.input.audio.byteLength, 44100 * 4);
  result(retry);
  await pending;
  assert.equal(retry.terminated, true);
});
