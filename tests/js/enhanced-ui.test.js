import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

// Execute the real app and range editor, replacing only browser media/runtime
// dependencies. This exercises the installed event handlers without a browser.
const html = await readFile(new URL('../../frontend/ui/index.html', import.meta.url), 'utf8');
const bundled = await build({
  entryPoints: [new URL('../../frontend/ui/app.js', import.meta.url).pathname],
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'import.meta.url': JSON.stringify('http://test/static/app.js') },
  plugins: [
    {
      name: 'ui-runtime-mocks',
      setup(build) {
        const exports = {
          'i18n.js': ['setText'],
          'engine.js': ['createEngine'],
          'audio-source.js': ['decodeSource'],
          'pitch-view.js': ['createPitchView'],
          'tempo-click-view.js': ['createTempoClickView']
        };
        build.onLoad({ filter: /frontend\/ui\/[^/]+\.js$/ }, ({ path }) => {
          const names = exports[path.split('/').at(-1)];
          if (!names) return;
          return {
            contents: names
              .map((name) => `export const ${name} = globalThis.harness.${name};`)
              .join('\n'),
            loader: 'js'
          };
        });
      }
    }
  ]
});

function setup() {
  const elements = new Map();
  const makeElement = (id) => ({
    id,
    value: '',
    checked: false,
    disabled: false,
    hidden: false,
    dataset: {},
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {} },
    listeners: new Map(),
    addEventListener(name, fn) {
      this.listeners.set(name, fn);
    },
    emit(name) {
      return this.listeners.get(name)?.({ target: this });
    },
    setAttribute() {},
    removeAttribute() {},
    querySelector() {
      return { setAttribute() {} };
    },
    getBoundingClientRect() {
      return { width: 0, height: 0 };
    },
    pause() {},
    load() {},
    focus() {}
  });
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id, makeElement(id));
  const get = (id) => {
    assert.ok(elements.has(id), `Missing HTML element: ${id}`);
    return elements.get(id);
  };
  const source = { duration: 30, waveform: [], audio: new Float32Array(30), sampleRate: 1 };
  const requests = [];
  const pitchResults = [];
  const harness = {
    setText(element, value) {
      (typeof element === 'string' ? get(element) : element).textContent = value;
    },
    createEngine(kind) {
      return {
        kind,
        errorMessage: (error) => error.message,
        downloadHint: () => '',
        analyze(file, onProgress, options) {
          return new Promise((resolve, reject) => {
            requests.push({ file, options, resolve, reject });
          });
        }
      };
    },
    decodeSource: async () => source,
    createPitchView: () => ({ reset() {}, pause() {}, render: (data) => pitchResults.push(data) }),
    createTempoClickView: () => ({ reset() {}, stop() {}, render() {} })
  };
  const document = {
    getElementById: get,
    documentElement: { dataset: { runtimeBase: '/runtime/' } },
    addEventListener() {}
  };
  runInNewContext(bundled.outputFiles[0].text, {
    harness,
    document,
    location: { href: 'http://test/' },
    window: { devicePixelRatio: 1 },
    URL: class extends URL {
      static createObjectURL() {
        return 'blob:audio';
      }
      static revokeObjectURL() {}
    },
    ResizeObserver: class {
      observe() {}
    },
    performance: { now: () => 0 },
    setInterval: () => 1,
    clearInterval() {}
  });
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  const upload = async (name = 'track.wav') => {
    get('audio-file').files = [{ name, size: 30 }];
    get('audio-file').emit('change');
    await flush();
  };
  const complete = async (index, overrides = {}) => {
    requests[index].resolve({
      result: { bpm: 120, signature_beats: 4 },
      duration_seconds: 30,
      beat_count: 60,
      analysis_seconds: 0.1,
      key_status: 'estimated',
      key: { tonic: 'C', mode: 'major' },
      download_url: '/tempo.mid',
      ...overrides
    });
    await flush();
  };
  const select = (start, end) => {
    for (const [edge, value] of [
      ['start', start],
      ['end', end]
    ]) {
      get('clip-' + edge).value = String(value);
      get('clip-' + edge).emit('input');
    }
  };
  const toggle = (checked) => {
    get('enhanced-mode').checked = checked;
    get('enhanced-mode').emit('change');
  };
  return { get, requests, pitchResults, source, upload, complete, select, toggle, flush };
}

test('checkbox is unchecked in HTML, and uploads still automatically analyze the full track', async () => {
  const checkbox = html.match(/<input\b[^>]*id="enhanced-mode"[^>]*>/)?.[0];
  assert.ok(checkbox);
  assert.doesNotMatch(checkbox, /\bchecked\b/);
  const h = setup();
  await h.upload();
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].options.range, null);
  assert.equal(h.requests[0].options.enhanced, false);
  assert.equal(h.requests[0].options.prepared, h.source);
  assert.equal(h.get('enhanced-mode').disabled, true);
  await h.complete(0);
  assert.equal(h.get('enhanced-mode').disabled, false);
});

test('toggling enhancement reanalyzes the selected range and blocks concurrent changes', async () => {
  const h = setup();
  await h.upload();
  await h.complete(0);
  h.select(5, 15);
  assert.equal(h.requests.length, 1, 'editing the range alone remains manual');
  h.toggle(true);
  assert.equal(h.requests.length, 2);
  assert.deepEqual({ ...h.requests[1].options.range }, { start: 5, end: 15 });
  assert.equal(h.requests[1].options.enhanced, true);
  assert.equal(h.get('enhanced-mode').disabled, true);
  h.get('enhanced-mode').emit('change');
  assert.equal(h.requests.length, 2, 'ignore a change event while analysis is busy');
  await h.complete(1);
  h.toggle(false);
  assert.equal(h.requests.length, 3);
  assert.equal(h.requests[2].options.enhanced, false);
  assert.deepEqual({ ...h.requests[2].options.range }, { start: 5, end: 15 });
  await h.complete(2);
  h.toggle(true);
  await h.complete(3);
  await h.upload('new-track.wav');
  assert.equal(h.requests[4].options.range, null, 'new files reset to the full track');
  assert.equal(h.requests[4].options.enhanced, true, 'new files preserve the chosen mode');
  await h.complete(4);
});

test('changing the checkbox without a valid selection does not dispatch inference', async () => {
  const h = setup();
  h.toggle(true);
  assert.equal(h.requests.length, 0, 'no file selected');
  await h.upload();
  await h.complete(0);
  h.select(5, 5.5);
  h.toggle(false);
  assert.equal(h.requests.length, 1, 'invalid short selection');
});

test('enhancement failure restores controls and preserves valid tempo results', async () => {
  const h = setup();
  h.toggle(true);
  await h.upload();
  await h.complete(0, {
    pitch_mode: 'enhanced',
    pitch_status: 'error',
    pitch_reason: 'enhancement_failed'
  });
  assert.equal(h.pitchResults[0].pitch_reason, 'enhancement_failed');
  assert.equal(h.get('bpm-value').textContent, '120.000');
  assert.equal(h.get('download-midi').disabled, false);
  assert.equal(h.get('enhanced-mode').disabled, false);
  assert.equal(h.get('enhanced-mode').checked, true);
  h.get('analyze-range').emit('click');
  h.requests[1].reject(new Error('runtime unavailable'));
  await h.flush();
  assert.equal(h.get('download-midi').disabled, true, 'unexpected errors clear stale downloads');
  assert.equal(h.get('enhanced-mode').disabled, false);
});
