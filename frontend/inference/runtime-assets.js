import { createModelAssets } from './model-assets.js';
import { DOWNLOAD_SOURCES } from './download-sources.js';

const runtimeKeys = {
  modelCached: 'runtimeCached',
  modelSourceConnecting: 'runtimeConnecting',
  modelSourceDownload: 'runtimeDownload',
  modelSourceVerifying: 'runtimeVerifying',
  modelProgress: 'runtimeProgress',
  modelSourceConfig: 'runtimeConfig',
  modelSourceIntegrity: 'runtimeIntegrity'
};

export function createRuntimeLoader(baseURL, progress, options = {}) {
  const assets = createModelAssets(
    baseURL,
    (parts) =>
      progress([
        'ONNX Runtime · ',
        ...parts.map((part) =>
          part?.key && runtimeKeys[part.key] ? { ...part, key: runtimeKeys[part.key] } : part
        )
      ]),
    {
      ...DOWNLOAD_SOURCES.runtime,
      ...options,
      assetKind: 'runtime',
      manifestOverride: options.manifestOverride || DOWNLOAD_SOURCES.runtime.manifest
    }
  );
  return async (ort) => {
    if (ort.env.wasm.wasmBinary) return;
    ort.env.wasm.wasmBinary = await assets.model();
    // With one thread and supplied bytes, ORT's ESM bundle uses its embedded
    // matching .mjs factory. No implicit runtime network fetch inside session init.
    ort.env.wasm.wasmPaths = undefined;
  };
}

export const prepareRuntime = createRuntimeLoader(
  new URL(DOWNLOAD_SOURCES.runtime.fallbackBaseURL, import.meta.url),
  (text) => self.postMessage({ type: 'progress', text })
);
