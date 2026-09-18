import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DOWNLOAD_SOURCES } from '../frontend/inference/download-sources.js';
const base = process.env.TEST_URL || 'http://127.0.0.1:8766/';
const api = 'http://127.0.0.1:8765';
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true
});
try {
  const context = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 1440, height: 1100 }
  });
  // Exercise real models through the site's HTTP fallback. Sending 82 MB through
  // Playwright route.fulfill exceeds Chrome's DevTools pipe message capacity.
  for (const source of [
    DOWNLOAD_SOURCES.beat.primaryBaseURL,
    DOWNLOAD_SOURCES.key.primaryBaseURL
  ]) {
    await context.route(source + '**', (route) =>
      route.fulfill({ status: 503, body: 'Use local test models' })
    );
  }
  const page = await context.newPage();
  const errors = [],
    posts = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url());
  });
  await page.goto(base);
  assert.match(await page.title(), /Key.*Tempo/);
  // Real drag/drop (not only the hidden file input).
  const bytes = (await readFile('samples/choice.ogg')).toString('base64');
  await page.evaluate((bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0))], 'choice.ogg', {
        type: 'audio/ogg'
      })
    );
    document.dispatchEvent(
      new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true })
    );
  }, bytes);
  await page.waitForFunction(
    () =>
      !document.querySelector('#analyze-range').disabled &&
      !document.querySelector('#analysis-status').hidden,
    null,
    { timeout: 180000 }
  );
  assert.equal(await page.locator('#error-message').innerText(), '');
  assert.equal(await page.locator('#bpm-value').innerText(), '68.007');
  assert.equal(await page.locator('#key-value').innerText(), 'G major');
  assert.match(await page.locator('#result-range').innerText(), /whole track/);
  assert.equal(posts.length, 0);
  assert.equal(await page.locator('#range-editor').evaluate((el) => el.open), false);
  await page.locator('#range-editor > summary').click();
  await page.locator('#clip-start').fill('5');
  await page.locator('#clip-end').fill('20');
  assert.match(await page.locator('#range-summary').innerText(), /15.000/);
  // Preview starts inside the range and stops at its end.
  await page.locator('#play-button').click();
  assert.ok(
    await page.locator('#audio-player').evaluate((a) => a.currentTime >= 5 && a.currentTime < 20)
  );
  await page.locator('#audio-player').evaluate((a) => {
    a.currentTime = 19.95;
  });
  await page.waitForFunction(() => document.querySelector('#audio-player').paused);
  assert.ok(
    await page.locator('#audio-player').evaluate((a) => Math.abs(a.currentTime - 20) < 0.02)
  );
  const done = async () => {
    await page.waitForFunction(
      () =>
        !document.querySelector('#analyze-range').disabled &&
        (!document.querySelector('#analysis-status').hidden ||
          !document.querySelector('#error-message').hidden),
      null,
      { timeout: 180000 }
    );
    assert.equal(await page.locator('#error-message').innerText(), '');
  };
  await page.locator('#analyze-range').click();
  await done();
  const bpm = Number(await page.locator('#bpm-value').innerText());
  assert.ok(bpm > 0);
  assert.match(await page.locator('#key-description').innerText(), /Selected range key/);
  assert.match(await page.locator('#result-range').innerText(), /5.000–20.000/);
  assert.equal(posts.length, 0);
  const downloadWait = page.waitForEvent('download');
  await page.locator('#download-midi').click();
  const download = await downloadWait;
  assert.equal(download.suggestedFilename(), 'choice_5.000-20.000s_tempo.mid');
  await download.saveAs('/tmp/key-tempo-range-browser.mid');
  await page.waitForFunction(() => !document.querySelector('#analyze-range').disabled);
  const responseWait = page.waitForResponse(
    (r) => r.url() === api + '/api/analyze' && r.request().method() === 'POST'
  );
  await page.locator('#engine-select').selectOption('python');
  const response = await responseWait;
  assert.equal(response.status(), 200);
  const native = await response.json();
  assert.equal(native.duration_seconds, 15);
  assert.equal(native.selection_start_seconds, 5);
  assert.equal(native.selection_end_seconds, 20);
  assert.ok(native.result.bpm > 0);
  assert.equal(native.key_status, 'estimated');
  await done();
  const nativeDownload = page.waitForEvent('download');
  await page.locator('#download-midi').click();
  await (await nativeDownload).saveAs('/tmp/key-tempo-range-python.mid');
  await page.waitForFunction(() => !document.querySelector('#analyze-range').disabled);
  // Editing clears the old result/MIDI; invalid ranges cannot run.
  await page.locator('#clip-start').fill('21');
  assert.equal(await page.locator('#download-midi').isDisabled(), true);
  assert.equal(await page.locator('#bpm-value').innerText(), '—');
  assert.equal(await page.locator('#analyze-range').isDisabled(), true);
  await page.locator('#clip-start').fill('5');
  await page.locator('#clip-end').fill('7');
  await page.locator('#analyze-range').click();
  await done();
  assert.match(await page.locator('#key-description').innerText(), /at least 3 seconds/);
  await page.locator('#clip-end').fill('20');
  await page.locator('#engine-select').selectOption('browser');
  await done();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const lang of ['en', 'ja', 'zh-Hant']) {
      await page.locator('#language-select').selectOption(lang);
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (lang === 'zh-Hant' && width !== 320)
        await page
          .locator('.workspace')
          .screenshot({ path: `/tmp/key-tempo-range-results-${width}.png` });
    }
  }
  await page.locator('#reset-range').click();
  assert.equal(await page.locator('#clip-start').inputValue(), '0');
  await page.locator('#language-select').selectOption('en');
  await page.locator('#analyze-range').click();
  await done();
  assert.equal(await page.locator('#bpm-value').innerText(), '68.007');
  assert.equal(await page.locator('#key-value').innerText(), 'G major');
  assert.match(await page.locator('#result-range').innerText(), /whole track/);
  await page.locator('#clear-file').click();
  assert.equal(await page.locator('#selected-file').isVisible(), false);
  // A fresh file also starts full-track analysis automatically in Local Python.
  await page.locator('#engine-select').selectOption('python');
  const previousPosts = posts.length;
  await page.locator('#audio-file').setInputFiles('samples/choice.ogg');
  await done();
  assert.equal(posts.length, previousPosts + 1);
  assert.equal(await page.locator('#bpm-value').innerText(), '68.007');
  assert.equal(await page.locator('#key-value').innerText(), 'G major');
  assert.match(await page.locator('#result-range').innerText(), /whole track/);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: true,
        browser_clip_bpm: bpm,
        python_clip_bpm: native.result.bpm,
        python_clip_key: native.key.label,
        checks:
          'drag/drop, automatic full-track analysis in both engines, selection preview, both real models/engines, clipped MIDI, stale-result clearing, invalid/short ranges, engine switching, reset to full track, three-language responsive UI'
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
