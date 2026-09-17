import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { HUGGING_FACE_MODELS } from '../frontend/inference/model-sources.js';
const base = process.env.TEST_URL || 'http://127.0.0.1:8766/';
const folder = '.cache/video-fixtures/';
await mkdir(folder, { recursive: true });
const ffmpeg = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);
ffmpeg([
  '-f',
  'lavfi',
  '-i',
  'color=c=black:s=64x64:r=1',
  '-i',
  'samples/choice.ogg',
  '-t',
  '25',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  '-movflags',
  '+faststart',
  folder + 'choice.mp4'
]);
ffmpeg(['-i', folder + 'choice.mp4', '-c', 'copy', folder + 'choice.mov']);
ffmpeg([
  '-i',
  folder + 'choice.mp4',
  '-i',
  'samples/choice.ogg',
  '-map',
  '0:v:0',
  '-map',
  '1:a:0',
  '-t',
  '25',
  '-c:v',
  'copy',
  '-c:a',
  'pcm_s16le',
  folder + 'choice-pcm.mov'
]);
ffmpeg(['-i', folder + 'choice.mp4', '-an', '-c:v', 'copy', folder + 'no-audio.mp4']);
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true
});
try {
  const context = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 1440, height: 1100 }
  });
  // Keep network delivery deterministic while running the real exported models.
  for (const source of Object.values(HUGGING_FACE_MODELS))
    await context.route(source + '**', (route) =>
      route.fulfill({ status: 503, body: 'Use local test models' })
    );
  const page = await context.newPage();
  const errors = [],
    posts = [],
    results = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url());
  });
  await page.goto(base);
  assert.match(await page.title(), /Key.*Tempo/);
  assert.match(await page.locator('#audio-file').getAttribute('accept'), /\.mp4,\.mov/);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const lang of ['en', 'ja', 'zh-Hant']) {
      await page.locator('#language-select').selectOption(lang);
      assert.match(await page.locator('.formats').innerText(), /MP4.*MOV/);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (lang === 'zh-Hant' && width === 390)
        await page.locator('.input-panel').screenshot({ path: '/tmp/key-tempo-video-formats.png' });
    }
  }
  await page.locator('#language-select').selectOption('en');
  await page.setViewportSize({ width: 1440, height: 1100 });
  const done = async () => {
    await page.waitForFunction(
      () =>
        !document.querySelector('#analyze-range').disabled &&
        (!document.querySelector('#download-midi').disabled ||
          !document.querySelector('#error-message').hidden),
      null,
      { timeout: 180000 }
    );
  };
  for (const file of ['choice.mp4', 'choice.mov', 'choice-pcm.mov']) {
    await page.locator('#engine-select').selectOption('browser');
    const before = posts.length;
    await page.locator('#audio-file').setInputFiles(folder + file);
    await done();
    assert.equal(posts.length, before, 'Browser must not upload video');
    const error = await page.locator('#error-message').innerText();
    if (file !== 'choice-pcm.mov') assert.equal(error, '');
    if (!error) {
      assert.ok(Math.abs(Number(await page.locator('#bpm-value').innerText()) - 68) < 0.2);
      assert.equal(await page.locator('#key-value').innerText(), 'G major');
      await page.locator('#play-button').click();
      assert.equal(await page.locator('#audio-player').evaluate((a) => a.paused), false);
      await page.locator('#play-button').click();
      await page.locator('#clip-start').fill('5');
      await page.locator('#clip-end').fill('20');
      await page.locator('#analyze-range').click();
      await done();
      assert.equal(await page.locator('#error-message').innerText(), '');
      assert.match(await page.locator('#result-range').innerText(), /5.000–20.000/);
      const downloadWait = page.waitForEvent('download');
      await page.locator('#download-midi').click();
      const download = await downloadWait;
      await download.saveAs('/tmp/key-tempo-' + file + '-clip.mid');
      assert.equal(
        (await readFile('/tmp/key-tempo-' + file + '-clip.mid')).subarray(0, 4).toString(),
        'MThd'
      );
      await page.waitForFunction(() => !document.querySelector('#analyze-range').disabled);
    } else assert.match(error, /no decodable audio track|audio codec/);
    const responseWait = page.waitForResponse(
      (r) => r.url() === 'http://127.0.0.1:8765/api/analyze' && r.request().method() === 'POST'
    );
    await page.locator('#engine-select').selectOption('python');
    const response = await responseWait;
    assert.equal(response.status(), 200);
    const data = await response.json();
    await done();
    assert.equal(await page.locator('#error-message').innerText(), '');
    assert.ok(Math.abs(data.result.bpm - 68) < 0.2);
    assert.equal(data.key.label, 'G Major');
    if (!error) assert.equal(data.duration_seconds, 15);
    results.push({
      file,
      browser: error ? 'codec unsupported' : 'full track, range, playback and MIDI passed',
      python_bpm: data.result.bpm,
      key: data.key.label
    });
    await page.locator('#clear-file').click();
  }
  await page.locator('#engine-select').selectOption('browser');
  const before = posts.length;
  await page.locator('#audio-file').setInputFiles(folder + 'no-audio.mp4');
  await done();
  assert.match(await page.locator('#error-message').innerText(), /no decodable audio track/);
  assert.equal(posts.length, before);
  assert.equal(await page.locator('#download-midi').isDisabled(), true);
  await page.locator('#engine-select').selectOption('python');
  await done();
  assert.match(await page.locator('#error-message').innerText(), /no audio track/);
  for (const [lang, text] of [
    ['ja', '音声トラックがありません'],
    ['zh-Hant', '沒有音軌']
  ]) {
    await page.locator('#language-select').selectOption(lang);
    assert.ok((await page.locator('#error-message').innerText()).includes(text));
  }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: true,
        results,
        no_audio: 'explicit errors in both engines; no implicit upload; translations passed'
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
