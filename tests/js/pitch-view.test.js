import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { translate } from '../../frontend/ui/i18n-core.js';

const bundled = await build({
  entryPoints: [new URL('../../frontend/ui/pitch-view.js', import.meta.url).pathname],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'pitchModule',
  plugins: [
    {
      name: 'pitch-view-media-mocks',
      setup(build) {
        build.onLoad({ filter: /frontend\/ui\/(i18n|pitch-player)\.js$/ }, ({ path }) => ({
          contents: path.endsWith('i18n.js')
            ? 'export const setText = globalThis.setText;'
            : 'export const createPitchPlayer = () => globalThis.player;',
          loader: 'js'
        }));
      }
    }
  ]
});
function setup(language = 'en') {
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id))
      elements.set(id, {
        checked: true,
        addEventListener() {},
        setAttribute() {},
        getBoundingClientRect: () => ({ width: 0, height: 0 })
      });
    return elements.get(id);
  };
  const context = {
    document: { getElementById: get, addEventListener() {} },
    window: { addEventListener() {} },
    ResizeObserver: class {
      observe() {}
    },
    player: { reset() {}, load() {}, pause() {} },
    setText: (id, source) => {
      get(id).textContent = translate(source, language);
    }
  };
  runInNewContext(bundled.outputFiles[0].text, context);
  return { view: context.pitchModule.createPitchView(), get };
}

test('unsupported WebGPU remains visible in the final pitch summary in every language', () => {
  for (const language of ['en', 'ja', 'zh-Hant']) {
    const { view, get } = setup(language);
    view.render({
      duration_seconds: 10,
      pitch_status: 'error',
      pitch_reason: 'enhancement_failed',
      pitch_detail: 'enhancementWebGPURequired'
    });
    assert.equal(
      get('pitch-summary').textContent,
      translate({ key: 'enhancementWebGPURequired' }, language)
    );
    assert.equal(get('pitch-play').disabled, true);
    assert.equal(get('pitch-chart').hidden, true);
    assert.doesNotMatch(get('pitch-runtime').textContent, /Small/);
  }
});

test('unknown enhancement details cannot select arbitrary translation keys', () => {
  const { view, get } = setup();
  for (const detail of [undefined, 'unknown-key', 'pitchSummary', '<script>alert(1)</script>']) {
    view.render({
      duration_seconds: 10,
      pitch_status: 'error',
      pitch_reason: 'enhancement_failed',
      pitch_detail: detail
    });
    assert.equal(get('pitch-summary').textContent, translate({ key: 'enhancementFailed' }));
  }
});

test('the pitch badge names the returned model and runtime', () => {
  const { view, get } = setup();
  const note = { note: 'C4', midi: 60, hz: 261.6, start_seconds: 0, end_seconds: 1 };
  for (const [model, engine, label] of [
    ['GAME Large v1.0.3', 'webgpu', 'WebGPU'],
    ['GAME Small', 'onnx-cpu', 'Python ONNX']
  ]) {
    view.render({
      duration_seconds: 10,
      pitch_status: 'estimated',
      pitch_mode: model.includes('Large') ? 'enhanced' : 'standard',
      pitch_engine: engine,
      pitch: { model, notes: [note], lowest: note, highest: note, note_count: 1, semitones: 0 }
    });
    assert.equal(get('pitch-runtime').textContent, `${model} · ${label}`);
  }
});
