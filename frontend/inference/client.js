import { decodeSource, selectSamples } from '../ui/audio-source.js';
let worker;
function makeWorker() {
  return new Worker(new URL('./analysis-worker.js', import.meta.url), { type: 'module' });
}
export async function analyzeInBrowser(file, onProgress, { range = null, prepared = null } = {}) {
  onProgress('正在瀏覽器內解碼音訊');
  const source = prepared || (await decodeSource(file));
  const mono = selectSamples(source.audio, source.sampleRate, range);
  // Decode from the original file at GAME's native rate rather than upsampling
  // the beat/key waveform. Keep the existing beat/key decoder numerically intact.
  let pitchAudio = null;
  try {
    const pitchSource =
      source.pitchSource || (source.pitchSource = await decodeSource(file, 44100));
    pitchAudio = selectSamples(pitchSource.audio, pitchSource.sampleRate, range);
  } catch (error) {
    console.warn('GAME audio preparation failed; retaining beat/key inputs.', String(error));
  }
  if (!worker) worker = makeWorker();
  return new Promise((resolve, reject) => {
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') onProgress(data.text);
      else if (data.type === 'error') reject(new Error(data.message));
      else if (data.type === 'result') {
        resolve({
          ...data.data,
          download_url: data.midi
            ? URL.createObjectURL(new Blob([data.midi], { type: 'audio/midi' }))
            : null
        });
      }
    };
    worker.onerror = () => {
      worker.terminate();
      worker = null;
      reject(new Error('瀏覽器分析引擎停止，可能是記憶體不足。請嘗試較短音訊。'));
    };
    // Explicit URL switch is for reproducible CPU verification, never an API fallback.
    worker.postMessage(
      {
        audio: mono.buffer,
        pitchAudio: pitchAudio?.buffer,
        filename: file.name,
        forceWasm: new URL(location.href).searchParams.get('engine') === 'wasm'
      },
      pitchAudio ? [mono.buffer, pitchAudio.buffer] : [mono.buffer]
    );
  });
}
