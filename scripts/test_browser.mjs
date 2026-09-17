import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { HUGGING_FACE_MODELS } from '../frontend/inference/model-sources.js';
const base = process.env.TEST_URL || 'http://127.0.0.1:8766/';
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true
});
const logs = [],
  consoleErrors = [],
  requests = [],
  results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, locale: 'en-US' });
  page.on('pageerror', (error) => logs.push(error.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' &&
      !/VerifyEachNodeIsAssignedToAnEp|Rerunning with verbose output/.test(m.text())
    )
      consoleErrors.push(m.text());
  });
  page.context().on('request', (r) => {
    let original = r;
    while (original.redirectedFrom()) original = original.redirectedFrom();
    requests.push({ url: r.url(), method: r.method(), source: original.url() });
  });
  await page.goto(base);
  assert.match(await page.title(), /Tempo/);
  assert.equal(await page.locator('html').getAttribute('data-engine'), 'browser');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.ok(await page.locator('#choose-file').isVisible());
  // Real file selection, browser decoding, model, result UI, and MIDI download.
  await page.locator('#audio-file').setInputFiles('samples/choice.ogg');
  await page.waitForFunction(
    () =>
      !document.querySelector('#download-midi').disabled ||
      !document.querySelector('#error-message').hidden,
    null,
    { timeout: 180000 }
  );
  assert.equal(await page.locator('#error-message').textContent(), '');
  assert.equal(await page.locator('#bpm-value').textContent(), '68.007');
  assert.equal(await page.locator('#signature-value').textContent(), '4');
  assert.equal(await page.locator('#key-value').textContent(), 'G major');
  assert.equal(await page.locator('#result-status-text').textContent(), 'Constant tempo');
  // Language changes update existing results without discarding the audio or MIDI.
  for (const [lang, key, status] of [
    ['ja', 'G 長調', '固定テンポ'],
    ['zh-Hant', 'G 大調', '固定速度'],
    ['en', 'G major', 'Constant tempo']
  ]) {
    await page.locator('#language-select').selectOption(lang);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    assert.equal(await page.locator('#key-value').textContent(), key);
    assert.equal(await page.locator('#result-status-text').textContent(), status);
    assert.equal(await page.locator('#bpm-value').textContent(), '68.007');
    assert.equal(await page.locator('#download-midi').isEnabled(), true);
  }
  const wait = page.waitForEvent('download');
  await page.locator('#download-midi').click();
  const download = await wait;
  await download.saveAs('/tmp/tempo-onnx-download.mid');
  await page.waitForFunction(() => !document.querySelector('#download-midi').disabled);
  await page.screenshot({ path: '/tmp/tempo-onnx-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: '/tmp/tempo-onnx-mobile.png', fullPage: true });
  results.push({
    flow: 'UI upload and MIDI download',
    bpm: 68.007,
    engine: await page.locator('#midi-hint').textContent()
  });
  // Read real worker outputs for both providers, including audio spanning >2 windows.
  for (const forceWasm of [false, true]) {
    for (const name of ['choice', 'long']) {
      const pcm = await readFile(`.cache/web-fixtures/${name}.f32`);
      const ref = JSON.parse(await readFile(`.cache/web-fixtures/${name}.json`, 'utf8'));
      const keyRef = JSON.parse(await readFile(`.cache/web-fixtures/skey-${name}.json`, 'utf8'));
      const result = await page.evaluate(
        async ({ bytes, forceWasm }) => {
          const worker = new Worker(new URL('./analysis-worker.js', location.href), {
            type: 'module'
          });
          try {
            return await new Promise((resolve, reject) => {
              worker.onerror = (e) => reject(new Error(e.message));
              worker.onmessage = ({ data }) => {
                if (data.type === 'result')
                  resolve({ ...data.data, midi: Array.from(new Uint8Array(data.midi)) });
                if (data.type === 'error') reject(new Error(data.message));
              };
              const buffer = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0)).buffer;
              worker.postMessage({ audio: buffer, filename: 'fixture.wav', forceWasm }, [buffer]);
            });
          } finally {
            worker.terminate();
          }
        },
        { bytes: pcm.toString('base64'), forceWasm }
      );
      assert.deepEqual(result.beats, ref.beats, `${name} ${forceWasm ? 'WASM' : 'GPU'} beats`);
      assert.deepEqual(result.downbeats, ref.downbeats, `${name} downbeats`);
      assert.equal(result.result.bpm, ref.tempo.bpm);
      assert.equal(result.tempo_mode, ref.tempo.tempo_mode);
      assert.equal(result.key_status, 'estimated');
      assert.equal(result.key.label, keyRef.key.label);
      assert.ok(Math.abs(result.key.score - keyRef.key.score) < 0.0001);
      if (forceWasm) assert.equal(result.engine, 'wasm');
      await writeFile(`/tmp/tempo-onnx-${name}-${result.engine}.mid`, new Uint8Array(result.midi));
      results.push({
        fixture: name,
        engine: result.engine,
        beats: result.beat_count,
        mode: result.tempo_mode,
        key: result.key.label,
        seconds: result.analysis_seconds
      });
    }
  }
  // Variable audio must show an average while downloading the real tempo map.
  await page.locator('#clear-file').click();
  await page.locator('#audio-file').setInputFiles('.cache/web-fixtures/long.wav');
  await page.waitForFunction(
    () => document.querySelector('#result-status-text').textContent === 'Variable tempo',
    null,
    { timeout: 180000 }
  );
  assert.equal(await page.locator('#bpm-value').textContent(), '66.631');
  assert.equal(await page.locator('#download-label').textContent(), 'Download variable tempo MIDI');
  const variableWait = page.waitForEvent('download');
  await page.locator('#download-midi').click();
  await (await variableWait).saveAs('/tmp/tempo-onnx-variable-ui.mid');
  await page.waitForFunction(() => !document.querySelector('#download-midi').disabled);
  await page.screenshot({ path: '/tmp/tempo-onnx-variable-mobile.png', fullPage: true });
  results.push({ flow: 'variable audio UI and MIDI download', average_bpm: 66.631, passed: true });
  // Silence and decode failures must recover without producing a stale download.
  await page.locator('#clear-file').click();
  await page.locator('#audio-file').setInputFiles('.cache/web-fixtures/silence.wav');
  await page.waitForFunction(
    () => document.querySelector('#result-status-text').textContent === 'Not enough beats'
  );
  assert.equal(await page.locator('#bpm-value').textContent(), '-1');
  assert.equal(await page.locator('#key-value').textContent(), '—');
  assert.ok(await page.locator('#download-midi').isDisabled());
  await page.locator('#clear-file').click();
  await page
    .locator('#audio-file')
    .setInputFiles({ name: 'broken.wav', mimeType: 'audio/wav', buffer: Buffer.from('invalid') });
  await page.waitForFunction(() => !document.querySelector('#error-message').hidden);
  assert.match(await page.locator('#error-message').textContent(), /cannot decode/);
  assert.ok(await page.locator('#download-midi').isDisabled());
  assert.deepEqual(logs, []);
  assert.deepEqual(consoleErrors, []);
  assert.equal(
    requests.filter(
      (r) =>
        r.method === 'POST' ||
        (new URL(r.url).origin === new URL(base).origin &&
          new URL(r.url).pathname.startsWith('/api/'))
    ).length,
    0
  );
  assert.ok(
    requests.every(
      (r) =>
        new URL(r.url).origin === new URL(base).origin ||
        r.url.startsWith('blob:') ||
        Object.values(HUGGING_FACE_MODELS).some((source) => r.source.startsWith(source))
    )
  );
  results.push({
    flow: 'silence, corrupt file, reset, mobile layout, no backend requests',
    passed: true
  });
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
