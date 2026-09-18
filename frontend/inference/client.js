import { decodeSource, selectSamples } from '../ui/audio-source.js';
let worker;
let gpuTimedOut = false;
const GPU_INIT_TIMEOUT_MS = 60000;
const CPU_INIT_TIMEOUT_MS = 120000;
const WORKER_START_TIMEOUT_MS = 30000;
function makeWorker() {
  return new Worker(new URL('./analysis-worker.js', import.meta.url), { type: 'module' });
}
export async function analyzeInBrowser(file, onProgress, { range = null, prepared = null } = {}) {
  onProgress('正在瀏覽器內解碼音訊');
  const source = prepared || (await decodeSource(file));
  // Keep source PCM on the main thread: transferred slices detach, so a fresh
  // worker must receive new slices of the same range when GPU startup times out.
  let pitchSource = null;
  try {
    pitchSource = source.pitchSource || (source.pitchSource = await decodeSource(file, 44100));
  } catch (error) {
    console.warn('GAME audio preparation failed; retaining beat/key inputs.', String(error));
  }
  const forceWasm = new URL(location.href).searchParams.get('engine') === 'wasm' || gpuTimedOut;
  return new Promise((resolve, reject) => {
    let timer = null;
    let current = null;
    let settled = false;
    let notice = gpuTimedOut ? { key: 'gpuDisabledAfterTimeout' } : null;
    const publish = (text) => onProgress(notice ? [notice, ' · ', text] : text);
    const clearTimer = () => {
      clearTimeout(timer);
      timer = null;
    };
    const detach = () => {
      if (current) current.onmessage = current.onerror = current.onmessageerror = null;
    };
    const terminate = () => {
      detach();
      current?.terminate();
      if (worker === current) worker = null;
      current = null;
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      clearTimer();
      terminate();
      reject(error);
    };
    const start = (cpuOnly) => {
      clearTimer();
      try {
        if (!worker) worker = makeWorker();
        current = worker;
        const attempt = current;
        current.onmessage = ({ data }) => {
          // A terminated GPU attempt must never overwrite its CPU replacement.
          if (settled || current !== attempt) return;
          if (data.type === 'started') clearTimer();
          else if (data.type === 'session-init') {
            clearTimer();
            if (data.state !== 'start') return;
            const gpu = !cpuOnly && data.provider === 'webgpu';
            const timeout = gpu ? GPU_INIT_TIMEOUT_MS : CPU_INIT_TIMEOUT_MS;
            publish({
              key: 'engineInitWaiting',
              args: { model: data.model, engine: gpu ? 'GPU' : 'CPU', seconds: timeout / 1000 }
            });
            // Watch from the main thread, even if native work blocks the worker.
            timer = setTimeout(() => {
              if (settled || current !== attempt) return;
              if (!gpu) {
                fail(
                  new Error('CPU 分析引擎初始化逾時，請重新整理頁面後重試，或改用本機 Python。')
                );
                return;
              }
              gpuTimedOut = true;
              notice = {
                key: 'gpuInitTimeoutFallback',
                args: { model: data.model, seconds: timeout / 1000 }
              };
              terminate();
              start(true);
            }, timeout);
          } else if (data.type === 'progress') publish(data.text);
          else if (data.type === 'error') fail(new Error(data.message));
          else if (data.type === 'result') {
            try {
              const response = {
                ...data.data,
                download_url: data.midi
                  ? URL.createObjectURL(new Blob([data.midi], { type: 'audio/midi' }))
                  : null
              };
              settled = true;
              clearTimer();
              detach();
              resolve(response);
            } catch (error) {
              fail(error);
            }
          }
        };
        current.onerror = current.onmessageerror = () => {
          if (!settled && current === attempt)
            fail(new Error('瀏覽器分析引擎停止，可能是記憶體不足。請嘗試較短音訊。'));
        };
        publish({ key: 'browserWorkerStarting' });
        timer = setTimeout(() => {
          if (!settled && current === attempt)
            fail(new Error('瀏覽器分析引擎啟動逾時，請確認網路連線並重新整理頁面後重試。'));
        }, WORKER_START_TIMEOUT_MS);
        const mono = selectSamples(source.audio, source.sampleRate, range);
        const pitchAudio = pitchSource
          ? selectSamples(pitchSource.audio, pitchSource.sampleRate, range)
          : null;
        current.postMessage(
          {
            audio: mono.buffer,
            pitchAudio: pitchAudio?.buffer,
            filename: file.name,
            forceWasm: cpuOnly
          },
          pitchAudio ? [mono.buffer, pitchAudio.buffer] : [mono.buffer]
        );
      } catch (error) {
        fail(error);
      }
    };
    start(forceWasm);
  });
}
