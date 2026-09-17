let worker;
function makeWorker() {
  return new Worker(new URL('./analysis-worker.js', import.meta.url), { type: 'module' });
}
export async function analyzeInBrowser(file, onProgress) {
  onProgress('正在瀏覽器內解碼音訊');
  let decoded;
  try {
    const context = new OfflineAudioContext(1, 1, 22050);
    decoded = await context.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error('瀏覽器無法解碼這個音訊，請轉成 WAV 或 MP3 後再試。');
  }
  if (decoded.duration > 1200) throw new Error('音訊超過 20 分鐘，請先截取較短片段。');
  if (decoded.duration < 1) throw new Error('音訊太短，請提供至少 1 秒的檔案。');
  const mono = new Float32Array(decoded.length);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const channel = decoded.getChannelData(ch);
    for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / decoded.numberOfChannels;
  }
  if (mono.some((v) => !Number.isFinite(v))) throw new Error('音訊含有無效取樣，請重新匯出。');
  decoded = null;
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
        filename: file.name,
        forceWasm: new URL(location.href).searchParams.get('engine') === 'wasm'
      },
      [mono.buffer]
    );
  });
}
