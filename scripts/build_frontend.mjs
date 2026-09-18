import { build } from 'esbuild';
import { mkdir, cp, readFile, writeFile, access, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DOWNLOAD_SOURCES } from '../frontend/inference/download-sources.js';
const RUNTIME = DOWNLOAD_SOURCES.runtime.manifest;
const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const installedRuntime = JSON.parse(
  await readFile('node_modules/onnxruntime-web/package.json', 'utf8')
);
const runtimeBytes = await readFile(`node_modules/onnxruntime-web/dist/${RUNTIME.model_file}`);
if (
  installedRuntime.version !== RUNTIME.version ||
  runtimeBytes.length !== RUNTIME.model_bytes ||
  createHash('sha256').update(runtimeBytes).digest('hex') !== RUNTIME.sha256
)
  throw new Error(
    'ONNX Runtime version/hash mismatch. Update download-sources.js for the installed WebGPU build.'
  );
const defaultSiteUrl = 'https://hikari-tsai.github.io/music-detection/';
const siteUrl = new URL(process.env.SITE_URL || defaultSiteUrl);
if (!['https:', 'http:'].includes(siteUrl.protocol) || siteUrl.search || siteUrl.hash)
  throw new Error('SITE_URL must be an HTTP(S) site URL without query or fragment.');
if (!siteUrl.pathname.endsWith('/')) siteUrl.pathname += '/';
await access('assets/onnx/manifest.json').catch(() => {
  throw new Error('Run .venv/bin/python scripts/export_onnx.py first.');
});
await access('assets/onnx/skey/manifest.json').catch(() => {
  throw new Error('Run .venv/bin/python scripts/export_skey_onnx.py first.');
});
await rm('dist', { recursive: true, force: true });
await mkdir('dist/ort', { recursive: true });
await cp('frontend/ui', 'dist', { recursive: true });
let html = await readFile('dist/index.html', 'utf8');
// Only deployment metadata and asset URLs differ; copy is selected by the UI adapter.
if (!html.includes('data-runtime-base="/runtime/"'))
  throw new Error('UI template is missing its runtime base.');
html = html
  .replace('data-runtime-base="/runtime/"', 'data-runtime-base="./"')
  .replaceAll('/static/', './')
  .replace('href="/"', 'href="./"')
  .replaceAll(defaultSiteUrl, siteUrl.href);
await writeFile('dist/index.html', html);
await writeFile('dist/.nojekyll', '');
await cp('assets/onnx', 'dist/models', { recursive: true });
for (const file of await readdir('node_modules/onnxruntime-web/dist')) {
  if (/^ort-wasm.*\.(mjs|wasm)$/.test(file))
    await cp(`node_modules/onnxruntime-web/dist/${file}`, `dist/ort/${file}`);
}
await build({
  entryPoints: {
    'browser-client': 'frontend/inference/client.js',
    'analysis-worker': 'frontend/inference/worker.js'
  },
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  legalComments: 'eof'
});
await cp('third_party/ONNX-Runtime-LICENSE', 'dist/ort/LICENSE');
await cp('third_party/Beat-This-LICENSE', 'dist/models/LICENSE');
await cp('third_party', 'dist/licenses', { recursive: true });
await cp('LICENSE', 'dist/LICENSE');
console.log('Static browser app built in dist/');
