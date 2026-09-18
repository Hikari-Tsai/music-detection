import * as ort from 'onnxruntime-web/webgpu';
import manifest from '../../assets/models/game/1.0.3-small/manifest.json';
import { DOWNLOAD_SOURCES } from './download-sources.js';
import { createModelAssets, ModelLoadError } from './model-assets.js';
import { PITCH_RATE, pitchChunks, decodePitchChunk, summarizePitch } from './pitch.js';
import { createTrackedSession } from './session.js';

export function createPitchEngine(progress) {
  const assets = Object.fromEntries(
    manifest.files
      .filter((f) => f.name.endsWith('.onnx'))
      .map((f) => [
        f.name.replace('.onnx', ''),
        createModelAssets(
          new URL(DOWNLOAD_SOURCES.game.fallbackBaseURL, import.meta.url),
          (text) => progress(['GAME / ' + f.name + ': ', text]),
          {
            ...DOWNLOAD_SOURCES.game,
            manifestOverride: { model_file: f.name, model_bytes: f.bytes, sha256: f.sha256 }
          }
        )
      ])
  );

  async function run(audio, provider) {
    const sessions = {};
    try {
      for (const [name, asset] of Object.entries(assets)) {
        const bytes = await asset.model();
        sessions[name] = await createTrackedSession(
          ort,
          bytes,
          {
            executionProviders: [provider],
            graphOptimizationLevel: 'all'
          },
          `GAME / ${name}`
        );
      }
      const notes = [],
        chunks = pitchChunks(audio.length);
      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index],
          samples = audio.subarray(chunk.start, chunk.end);
        progress({
          key: 'pitchProgress',
          args: {
            current: index + 1,
            total: chunks.length,
            engine: provider === 'webgpu' ? 'GPU' : 'CPU'
          }
        });
        if (!samples.some((v) => Math.abs(v) >= 1e-7)) continue;
        const tensors = new Set();
        const tensor = (type, data, dims) => {
          const t = new ort.Tensor(type, data, dims);
          tensors.add(t);
          return t;
        };
        const float = (v, dims = [v.length]) => tensor('float32', Float32Array.from(v), dims);
        const infer = async (name, feeds) => {
          const output = await sessions[name].run(feeds);
          Object.values(output).forEach((t) => tensors.add(t));
          return output;
        };
        try {
          const duration = samples.length / PITCH_RATE;
          const encoded = await infer('encoder', {
            waveform: tensor('float32', samples, [1, samples.length]),
            duration: float([duration])
          });
          const known = await infer('dur2bd', {
            durations: float([duration], [1, 1]),
            maskT: encoded.maskT
          });
          let boundaries = known.boundaries;
          const language = tensor('int64', BigInt64Array.of(0n), [1]);
          const threshold = float([0.2], []),
            radius = tensor('int64', BigInt64Array.of(2n), []);
          for (let i = 0; i < 8; i++) {
            const output = await infer('segmenter', {
              x_seg: encoded.x_seg,
              maskT: encoded.maskT,
              language,
              known_boundaries: known.boundaries,
              prev_boundaries: boundaries,
              t: float([i / 8]),
              threshold,
              radius
            });
            if (boundaries !== known.boundaries) {
              tensors.delete(boundaries);
              boundaries.dispose();
            }
            boundaries = output.boundaries;
          }
          const regions = await infer('bd2dur', { boundaries, maskT: encoded.maskT });
          const output = await infer('estimator', {
            x_est: encoded.x_est,
            boundaries,
            maskT: encoded.maskT,
            maskN: regions.maskN,
            threshold
          });
          notes.push(
            ...decodePitchChunk(
              {
                durations: regions.durations.data,
                scores: output.scores.data,
                presence: output.presence.data,
                mask: regions.maskN.data
              },
              chunk
            )
          );
        } finally {
          for (const t of tensors) t.dispose();
        }
      }
      return { ...summarizePitch(notes), pitch_engine: provider };
    } finally {
      // Do not keep three models' GPU sessions resident between analyses.
      await Promise.all(Object.values(sessions).map((s) => s.release().catch(() => {})));
    }
  }
  return async function analyzePitch(audio, forceWasm = false) {
    if (!audio?.length)
      return { pitch: null, pitch_status: 'error', pitch_reason: 'analysis_failed' };
    if (!audio.some((v) => Math.abs(v) >= 1e-7))
      return { pitch: null, pitch_status: 'unavailable', pitch_reason: 'silent' };
    try {
      if (!forceWasm && globalThis.navigator?.gpu) {
        try {
          return await run(audio, 'webgpu');
        } catch (error) {
          if (error instanceof ModelLoadError) throw error;
          console.warn('GAME WebGPU unavailable; retrying with WASM.', String(error));
          progress({ key: 'pitchCpuFallback' });
        }
      }
      return await run(audio, 'wasm');
    } catch (error) {
      console.warn('GAME unavailable; retaining tempo and key results.', String(error));
      return { pitch: null, pitch_status: 'error', pitch_reason: 'analysis_failed' };
    }
  };
}
