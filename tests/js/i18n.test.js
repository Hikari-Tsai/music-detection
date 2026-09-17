import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { messages } from '../../frontend/ui/messages.js';
import {
  translate,
  normalizeLanguage,
  languages,
  detectBrowserLanguage
} from '../../frontend/ui/i18n-core.js';

test('browser language detects Japanese and Traditional Chinese, otherwise English', () => {
  for (const value of ['ja', 'ja-JP']) assert.equal(detectBrowserLanguage(value), 'ja');
  for (const value of ['zh-Hant', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant-CN'])
    assert.equal(detectBrowserLanguage(value), 'zh-Hant');
  for (const value of ['en-US', 'fr-FR', 'ko-KR', 'zh-CN', 'zh-Hans-TW', 'zh', '', null, undefined])
    assert.equal(detectBrowserLanguage(value), 'en');
});

test('all translations have the same parameters and all HTML keys exist', () => {
  for (const [key, locales] of Object.entries(messages)) {
    const parameters = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const language of languages) {
      assert.ok(locales[language]?.length, `${key}/${language}`);
      assert.deepEqual(parameters(locales[language]), parameters(locales.en), `${key}/${language}`);
    }
  }
  const html = readFileSync(new URL('../../frontend/ui/index.html', import.meta.url), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-aria-label|-content)?="([^"]+)"/g))
    assert.ok(messages[key], key);
  assert.match(html, /<html lang="en"/);
});
test('English default, supported locales and worker messages preserve values', () => {
  for (const value of [null, undefined, 'fr', 'ja-JP', ''])
    assert.equal(normalizeLanguage(value), 'en');
  const message = ['S-KEY: ', { key: 'modelProgress', args: { percent: 42 } }];
  assert.equal(translate(message), 'S-KEY: Downloading model 42%');
  assert.equal(translate(message, 'ja'), 'S-KEY: モデルをダウンロード中 42%');
  assert.equal(translate(message, 'zh-Hant'), 'S-KEY: 首次下載模型 42%');
  assert.equal(translate(['F#', ' ', { key: 'minor' }], 'ja'), 'F# 短調');
  assert.equal(
    translate('檔案超過 100 MB，請選擇較小的音訊。'),
    'This file exceeds 100 MB. Please choose a smaller file.'
  );
  assert.equal(translate('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>');
});
