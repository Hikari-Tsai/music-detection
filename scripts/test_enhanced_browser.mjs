// Integration smoke with real models. Serve dist first; cached model files are
// streamed over HTTP to avoid base64/CDP copies of hundreds of MB.
import { chromium } from 'playwright';
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DOWNLOAD_SOURCES } from '../frontend/inference/download-sources.js';
const files = new Map();
files.set('demucs/htdemucs.onnx', '.cache/enhanced/htdemucs.onnx');
for (const name of ['encoder', 'segmenter', 'estimator', 'dur2bd', 'bd2dur'])
  files.set(`large/${name}.onnx`, `.cache/enhanced/game-large/${name}.onnx`);
files.set(
  'runtime/' + DOWNLOAD_SOURCES.runtime.manifest.model_file,
  'node_modules/onnxruntime-web/dist/' + DOWNLOAD_SOURCES.runtime.manifest.model_file
);
// Smaller standard assets are also real, hash-verified weights from local cache.
files.set('beat/beat-this-final0.onnx', 'assets/onnx/beat-this-final0.onnx');
for (const name of ['manifest.json', 'frontend.json'])
  files.set('beat/' + name, 'assets/onnx/' + name);
for (const name of ['manifest.json', 'frontend.json', 'skey.onnx'])
  files.set('key/' + name, 'assets/onnx/skey/' + name);
const server = http.createServer(async (req, res) => {
  try {
    const file = files.get(decodeURIComponent(req.url.slice(1)));
    if (!file) throw new Error('unknown asset');
    const info = await stat(file);
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': file.endsWith('.json') ? 'application/json' : 'application/octet-stream',
      'Content-Length': info.size
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' }).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const assetBase = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true,
  args: ['--enable-unsafe-webgpu']
});
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.analysisEvents = [];
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.workerURL = String(url);
        window.analysisEvents.push({ type: 'created', url: this.workerURL });
        this.addEventListener('message', ({ data }) => {
          if (['session-init', 'result', 'error'].includes(data.type))
            window.analysisEvents.push({
              type: data.type,
              url: this.workerURL,
              model: data.model,
              state: data.state,
              data: data.data,
              message: data.message
            });
        });
      }
      terminate() {
        window.analysisEvents.push({ type: 'terminated', url: this.workerURL });
        super.terminate();
      }
    };
  });
  for (const [key, prefix] of [
    ['demucs', 'demucs'],
    ['gameLarge', 'large'],
    ['runtime', 'runtime'],
    ['beat', 'beat'],
    ['key', 'key']
  ]) {
    await page.route(DOWNLOAD_SOURCES[key].primaryBaseURL + '**', (route) => {
      const name = new URL(route.request().url()).pathname.split('/').at(-1);
      return route.fulfill({
        status: 302,
        headers: { 'Access-Control-Allow-Origin': '*', Location: assetBase + prefix + '/' + name },
        body: ''
      });
    });
  }
  page.on('console', (m) => {
    if (['warning', 'error'].includes(m.type())) console.log(m.type(), m.text());
  });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8766/');
  assert.ok(
    await page.evaluate(async () => !!(await navigator.gpu?.requestAdapter())),
    'No WebGPU adapter on this test machine'
  );
  await page.locator('#enhanced-mode').check();
  const start = Date.now();
  await page.locator('#audio-file').setInputFiles(process.env.TEST_AUDIO || 'samples/choice.ogg');
  await page.waitForFunction(
    () =>
      window.analysisEvents.some((e) => e.type === 'result' && e.url.includes('analysis-worker')),
    null,
    { timeout: 300000 }
  );
  const events = await page.evaluate(() => window.analysisEvents);
  const result = events.findLast((e) => e.type === 'result' && e.data)?.data;
  console.log(
    JSON.stringify(
      {
        elapsedSeconds: (Date.now() - start) / 1000,
        pitchStatus: result.pitch_status,
        pitchReason: result.pitch_reason,
        pitchMode: result.pitch_mode,
        model: result.pitch?.model,
        notes: result.pitch?.notes?.length,
        result: result.result
      },
      null,
      2
    )
  );
  assert.equal(result.pitch_mode, 'enhanced');
  assert.notEqual(result.pitch_status, 'error');
  if (result.pitch) assert.equal(result.pitch.model, 'GAME Large v1.0.3');
  const released = events.findIndex(
    (e) => e.type === 'terminated' && e.url.includes('separation-worker')
  );
  const large = events.findIndex((e) => e.type === 'session-init' && e.model?.startsWith('GAME'));
  assert.ok(
    released >= 0 && large > released,
    'separation worker must exit before Large initializes'
  );
  if (process.env.TEST_REPORT)
    await writeFile(
      process.env.TEST_REPORT,
      JSON.stringify({ elapsedSeconds: (Date.now() - start) / 1000, result, events }, null, 2) +
        '\n'
    );
  await page.screenshot({ path: '.cache/enhanced/browser-result.png', fullPage: true });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
