import * as ort from 'onnxruntime-web/webgpu';
import { createModelAssets } from './model-assets.js';
import { KEY_MIN_SECONDS, summarizeKey } from './key.js';

// This small convolution model uses WASM CPU. Sharing the worker's runtime
// avoids a second runtime download and works without WebGPU or isolation headers.
export function createKeyEngine(progress) {
  const assets = createModelAssets(new URL('./models/skey/', import.meta.url), (text) =>
    progress(['S-KEY: ', text])
  );
  let session = null;
  return async function analyzeKey(audio) {
    if (audio.length < 22050 * KEY_MIN_SECONDS) {
      return { key: null, key_status: 'unavailable', key_reason: 'too_short' };
    }
    if (!audio.some((v) => Math.abs(v) >= 1e-7)) {
      return { key: null, key_status: 'unavailable', key_reason: 'silent' };
    }
    let input, output;
    try {
      if (!session) {
        const bytes = await assets.model();
        progress('正在初始化 S-KEY 調性分析');
        session = await ort.InferenceSession.create(bytes, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all'
        });
      }
      progress('正在分析全曲調性（S-KEY）');
      input = new ort.Tensor('float32', audio, [1, audio.length]);
      output = await session.run({ audio: input });
      return { key: summarizeKey(output.scores.data), key_status: 'estimated', key_reason: null };
    } catch (error) {
      console.warn('S-KEY unavailable; retaining tempo results.', String(error));
      if (session) {
        await session.release().catch(() => {});
        session = null;
      }
      return { key: null, key_status: 'error', key_reason: 'analysis_failed' };
    } finally {
      input?.dispose();
      if (output) Object.values(output).forEach((t) => t.dispose());
    }
  };
}
