import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:8766/';
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true
});
try {
  // Inspect all 24 scores with the same runtime and raw-audio graph as production.
  const page = await browser.newPage();
  await page.goto(base);
  const ortScript = new URL('./ort-test.mjs', base).href;
  // Serve the package module through a test-only route; it is not a production artifact.
  await page.route(ortScript, (route) =>
    route.fulfill({
      path: 'node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs',
      contentType: 'text/javascript'
    })
  );
  const results = [];
  for (const name of ['short', 'choice', 'long']) {
    const bytes = (await readFile(`.cache/web-fixtures/skey-${name}.f32`)).toString('base64');
    const ref = JSON.parse(await readFile(`.cache/web-fixtures/skey-${name}.json`, 'utf8'));
    const scores = await page.evaluate(
      async ({ bytes, base, ortScript }) => {
        const ort = await import(ortScript);
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.wasmPaths = new URL('./ort/', base).href;
        const session = await ort.InferenceSession.create(
          new URL('./models/skey/skey.onnx', base).href,
          { executionProviders: ['wasm'] }
        );
        const buffer = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0)).buffer;
        const audio = new Float32Array(buffer);
        const input = new ort.Tensor('float32', audio, [1, audio.length]);
        let output;
        try {
          output = await session.run({ audio: input });
          return Array.from(output.scores.data);
        } finally {
          input.dispose();
          if (output) output.scores.dispose();
          await session.release();
        }
      },
      { bytes, base, ortScript }
    );
    const error = Math.max(...scores.map((v, i) => Math.abs(v - ref.scores[i])));
    assert.ok(error < 0.0001, `${name}: ${error}`);
    assert.equal(scores.indexOf(Math.max(...scores)), ref.key.index);
    results.push({ name, max_score_error: error, key: ref.key.label });
  }
  // A failed key model must leave real BPM inference and MIDI available.
  const context = await browser.newContext({ locale: 'en-US' });
  const failedPage = await context.newPage();
  await context.route('**/models/skey/**', (route) =>
    route.fulfill({ status: 503, body: 'test unavailable' })
  );
  await failedPage.goto(base);
  await failedPage.locator('#audio-file').setInputFiles('samples/choice.ogg');
  await failedPage.waitForFunction(() => !document.querySelector('#download-midi').disabled, null, {
    timeout: 120000
  });
  assert.equal(await failedPage.locator('#bpm-value').textContent(), '68.007');
  assert.equal(await failedPage.locator('#key-value').textContent(), '—');
  assert.match(await failedPage.locator('#key-description').textContent(), /unavailable/);
  const downloadWait = failedPage.waitForEvent('download');
  await failedPage.locator('#download-midi').click();
  await (await downloadWait).saveAs('/tmp/skey-failed-but-tempo.mid');
  await failedPage.waitForFunction(() => !document.querySelector('#download-midi').disabled);
  await context.unroute('**/models/skey/**');
  await failedPage.locator('#clear-file').click();
  await failedPage.locator('#audio-file').setInputFiles('samples/choice.ogg');
  await failedPage.waitForFunction(
    () => document.querySelector('#key-value').textContent === 'G major',
    null,
    { timeout: 120000 }
  );
  results.push({ key_download_failure_and_retry: 'passed', tempo_preserved: true });
  // WAV payloads exercise real browser decoding, short/silent handling, and minor-key UI.
  const shortAudio = await readFile('.cache/web-fixtures/skey-short.f32');
  for (const [name, pcm, expected, description] of [
    ['too-short', shortAudio.subarray(0, 22050 * 2 * 4), '—', /at least 3 seconds/],
    ['silence', Buffer.alloc(22050 * 4 * 4), '—', /No audible signal/],
    ['minor', shortAudio, 'A minor', /Global key estimate/]
  ]) {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(3, 20); // IEEE float32 mono WAV
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(22050, 24);
    header.writeUInt32LE(22050 * 4, 28);
    header.writeUInt16LE(4, 32);
    header.writeUInt16LE(32, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);
    await failedPage.locator('#clear-file').click();
    await failedPage.locator('#audio-file').setInputFiles({
      name: `${name}.wav`,
      mimeType: 'audio/wav',
      buffer: Buffer.concat([header, pcm])
    });
    await failedPage.waitForFunction(
      () => {
        const text = document.querySelector('#key-description').textContent;
        return (
          !['Waiting for key analysis', 'Global key estimate · S-KEY'].includes(text) ||
          document.querySelector('#key-value').textContent === 'A minor'
        );
      },
      null,
      { timeout: 120000 }
    );
    assert.equal(await failedPage.locator('#key-value').textContent(), expected);
    assert.match(await failedPage.locator('#key-description').textContent(), description);
    results.push({ audio: name, key: expected, passed: true });
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
