import * as ort from 'onnxruntime-web/webgpu';
import { logMel, chunkStarts, makeChunk, aggregateChunk, postprocess, waveform } from './dsp.js';
import { estimateTempo, tempoMidi } from './tempo.js';
import { createKeyEngine } from './key-engine.js';
import { createPitchEngine } from './pitch-engine.js';
import { createTrackedSession } from './session.js';

ort.env.wasm.numThreads = 1; // Works on GitHub Pages without COOP/COEP headers.
import { createModelAssets, ModelLoadError } from './model-assets.js';
import { DOWNLOAD_SOURCES } from './download-sources.js';

let session = null,
  engine = null,
  constants = null;
const progress = (text) => self.postMessage({ type: 'progress', text });
const assets = createModelAssets(
  new URL(DOWNLOAD_SOURCES.beat.fallbackBaseURL, import.meta.url),
  progress,
  { ...DOWNLOAD_SOURCES.beat, includeFrontend: true }
);
const analyzeKey = createKeyEngine(progress);
const analyzePitch = createPitchEngine(progress);
async function init(forceWasm = false) {
  constants = await assets.frontend();
  if (session && (!forceWasm || engine === 'wasm')) return;
  if (session) {
    await session.release();
    session = null;
  }
  const bytes = await assets.model();
  if (!forceWasm && self.navigator.gpu) {
    try {
      session = await createTrackedSession(
        ort,
        bytes,
        {
          executionProviders: ['webgpu'],
          graphOptimizationLevel: 'all'
        },
        'Beat This!'
      );
      engine = 'webgpu';
      return;
    } catch (error) {
      if (error instanceof ModelLoadError) throw error;
      console.warn('WebGPU initialization unavailable; using WASM.', String(error));
    }
  }
  session = await createTrackedSession(
    ort,
    bytes,
    {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    },
    'Beat This!'
  );
  engine = 'wasm';
}
async function predict(spect) {
  const starts = chunkStarts(spect.frames);
  const beat = new Float32Array(spect.frames).fill(-1000),
    downbeat = new Float32Array(spect.frames).fill(-1000);
  for (let i = starts.length - 1; i >= 0; i--) {
    progress({
      key: 'beatProgress',
      args: {
        current: starts.length - i,
        total: starts.length,
        engine: engine === 'webgpu' ? 'GPU' : 'CPU'
      }
    });
    const chunk = makeChunk(spect.data, spect.frames, starts[i]);
    const input = new ort.Tensor('float32', chunk.data, [1, chunk.length, 128]);
    let output;
    try {
      output = await session.run({ spectrogram: input });
      aggregateChunk(
        beat,
        downbeat,
        { beat: output.beat.data, downbeat: output.downbeat.data },
        starts[i]
      );
    } finally {
      input.dispose();
      if (output) Object.values(output).forEach((t) => t.dispose());
    }
  }
  return postprocess(beat, downbeat);
}
self.onmessage = async ({ data }) => {
  self.postMessage({ type: 'started' });
  const started = performance.now();
  try {
    const audio = new Float32Array(data.audio);
    const wave = waveform(audio);
    let detected = { beats: [], downbeats: [] };
    const audible = audio.some((v) => Math.abs(v) >= 1e-7);
    if (audible) {
      await init(data.forceWasm);
      progress('正在計算音訊頻譜');
      const spect = logMel(audio, constants, (p) =>
        progress({ key: 'spectrumProgress', args: { percent: Math.round(p * 100) } })
      );
      try {
        detected = await predict(spect);
      } catch (error) {
        if (engine !== 'webgpu') throw error;
        console.warn('WebGPU inference failed; retrying full analysis on WASM.', String(error));
        await init(true);
        detected = await predict(spect);
      }
    }
    const keyResult = await analyzeKey(audio);
    if (session) {
      await session.release();
      session = null;
    }
    const pitchResult = await analyzePitch(
      data.pitchAudio ? new Float32Array(data.pitchAudio) : null,
      data.forceWasm
    );
    const result = estimateTempo(detected.beats, detected.downbeats);
    const duration = audio.length / 22050;
    const midi = result === -1 ? null : tempoMidi(result, duration, pitchResult.pitch?.notes || []);
    const response = {
      ...keyResult,
      ...pitchResult,
      filename: data.filename,
      duration_seconds: duration,
      analysis_seconds: (performance.now() - started) / 1000,
      midi_has_vocal: !!midi && !!pitchResult.pitch?.notes?.length,
      beat_count: detected.beats.length,
      downbeat_count: detected.downbeats.length,
      result: result === -1 ? -1 : { bpm: result.bpm, signature_beats: result.signature_beats },
      tempo_mode: result === -1 ? 'unavailable' : result.tempo_mode,
      waveform: wave,
      engine: audible ? engine : 'none',
      beats: detected.beats,
      downbeats: detected.downbeats
    };
    self.postMessage(
      { type: 'result', data: response, midi: midi?.buffer },
      midi ? [midi.buffer] : []
    );
  } catch (error) {
    console.error('Browser analysis failed', error);
    self.postMessage({
      type: 'error',
      message:
        error instanceof ModelLoadError
          ? error.message
          : '瀏覽器分析未完成，請嘗試較短音訊，或更新瀏覽器後重試。'
    });
  }
};
