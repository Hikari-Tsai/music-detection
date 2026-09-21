import * as ort from 'onnxruntime-web/webgpu';
import manifest from '../../assets/models/enhanced/manifest.json';
import { DOWNLOAD_SOURCES } from './download-sources.js';
import { createModelAssets } from './model-assets.js';
import { createTrackedSession } from './session.js';
import { separateVocals, demucsWaveform, SEGMENT } from './separation-dsp.js';
ort.env.wasm.numThreads = 1;
const progress = (text) => self.postMessage({ type: 'progress', text });
self.onmessage = async ({ data }) => {
  self.postMessage({ type: 'started' });
  let session;
  try {
    if (!navigator.gpu) throw new Error('WebGPU required');
    const assets = createModelAssets(
      new URL(DOWNLOAD_SOURCES.demucs.fallbackBaseURL, import.meta.url),
      progress,
      {
        ...DOWNLOAD_SOURCES.demucs,
        manifestOverride: manifest.demucs
      }
    );
    session = await createTrackedSession(
      ort,
      await assets.model(),
      {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all'
      },
      'HTDemucs'
    );
    const audio = await separateVocals(
      data.stereo.map((buffer) => new Float32Array(buffer)),
      async (chunk, mag) => {
        const mix = new Float32Array(2 * SEGMENT);
        mix.set(chunk[0]);
        mix.set(chunk[1], SEGMENT);
        const feeds = {
          mix: new ort.Tensor('float32', mix, [1, 2, SEGMENT]),
          mag: new ort.Tensor('float32', mag, [1, 4, 2048, 336])
        };
        let output;
        try {
          output = await session.run(feeds);
          const f = output.freq.data.subarray(3 * 4 * 2048 * 336, 4 * 4 * 2048 * 336);
          const vocals = demucsWaveform(f);
          for (let c = 0; c < 2; c++)
            for (let i = 0; i < SEGMENT; i++)
              vocals[c][i] += output.time.data[(3 * 2 + c) * SEGMENT + i];
          return vocals;
        } finally {
          Object.values(feeds).forEach((t) => t.dispose());
          if (output) Object.values(output).forEach((t) => t.dispose());
        }
      },
      progress
    );
    await session.release();
    session = null;
    self.postMessage({ type: 'result', audio: audio.buffer }, [audio.buffer]);
  } catch (error) {
    console.warn('HTDemucs failed', error);
    self.postMessage({ type: 'error', message: String(error) });
  } finally {
    if (session) await session.release().catch(() => {});
  }
};
