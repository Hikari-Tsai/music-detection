import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true
});
const base = process.env.TEST_URL || 'http://127.0.0.1:8766/';
const api = 'http://127.0.0.1:8765';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, locale: 'en-US' });
  const errors = [],
    requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  await page.goto(base);
  assert.equal(await page.locator('#engine-select').inputValue(), 'browser');
  await page.locator('#audio-file').setInputFiles('samples/choice.ogg');

  const complete = async () => {
    await page.waitForFunction(
      () =>
        !document.querySelector('#download-midi').disabled ||
        !document.querySelector('#error-message').hidden,
      null,
      { timeout: 180000 }
    );
    assert.equal(await page.locator('#error-message').textContent(), '');
    assert.equal(await page.locator('#bpm-value').textContent(), '68.007');
    assert.equal(await page.locator('#key-value').textContent(), 'G major');
  };
  await complete();
  assert.equal(requests.filter((r) => r.url.includes('/api/')).length, 0);
  await page.locator('#engine-select').selectOption('python');
  assert.equal(await page.locator('#engine-select').isDisabled(), true);
  await complete();
  assert.equal(await page.locator('html').getAttribute('data-engine'), 'python');
  assert.match(await page.locator('#midi-hint').textContent(), /1 hour/);
  assert.equal(
    requests.filter((r) => r.url === api + '/api/analyze' && r.method === 'POST').length,
    1
  );
  const download = page.waitForEvent('download');
  await page.locator('#download-midi').click();
  await (await download).saveAs('/tmp/key-tempo-python-switch.mid');
  assert.equal(
    (await readFile('/tmp/key-tempo-python-switch.mid')).subarray(0, 4).toString(),
    'MThd'
  );
  assert.ok(requests.some((r) => r.url.startsWith(api + '/api/download/')));
  await page.locator('#engine-select').selectOption('browser');
  await complete();
  assert.match(await page.locator('#midi-hint').textContent(), /Local (GPU|CPU) analysis/);
  // Failed native connection must not retain a stale download or trigger a fallback.
  await page.route(api + '/api/analyze', (route) => route.abort('connectionrefused'));
  await page.locator('#engine-select').selectOption('python');
  await page.waitForFunction(() => !document.querySelector('#error-message').hidden);
  assert.match(await page.locator('#error-message').textContent(), /local analysis service/);
  assert.equal(await page.locator('#download-midi').isDisabled(), true);
  assert.equal(await page.locator('#engine-select').isEnabled(), true);
  await page.unroute(api + '/api/analyze');
  await page.locator('#engine-select').selectOption('browser');
  await complete();
  await page.locator('#clear-file').click();
  await page.locator('#engine-select').selectOption('python');
  for (const lang of ['en', 'ja', 'zh-Hant']) {
    await page.locator('#language-select').selectOption(lang);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.locator('.engine-controls').screenshot({ path: '/tmp/key-tempo-engine-mobile.png' });
  await page.locator('#language-select').selectOption('en');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: '/tmp/key-tempo-engines.png', fullPage: true });
  await page.reload();
  assert.equal(await page.locator('#engine-select').inputValue(), 'browser');
  // The page served directly by Python also defaults to ONNX, with local bundled assets.
  const localPage = await browser.newPage({ locale: 'en-US' });
  await localPage.goto(api);
  assert.equal(await localPage.locator('#engine-select').inputValue(), 'browser');
  await localPage.locator('#audio-file').setInputFiles('samples/choice.ogg');

  await localPage.waitForFunction(() => !document.querySelector('#download-midi').disabled, null, {
    timeout: 180000
  });
  assert.equal(await localPage.locator('#bpm-value').textContent(), '68.007');
  assert.match(await localPage.locator('#midi-hint').textContent(), /Local (GPU|CPU) analysis/);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: default ONNX, native cross-origin reanalysis and MIDI, switching back, offline failure/recovery, no implicit upload, 3-language mobile layout, ONNX on Python-served UI.'
  );
} finally {
  await browser.close();
}
