// The worker owns the entire ORT allocator. Terminate it BEFORE resolving vocals.
export function separateInBrowser(
  stereo,
  onProgress,
  {
    makeWorker = () =>
      new Worker(new URL('./separation-worker.js', import.meta.url), { type: 'module' })
  } = {}
) {
  return new Promise((resolve, reject) => {
    const worker = makeWorker();
    let timer,
      settled = false;
    const arm = (ms) => {
      clearTimeout(timer);
      timer = setTimeout(() => finish(new Error('HTDemucs timed out')), ms);
    };
    const finish = (error, audio) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(error);
      else {
        onProgress({ key: 'separationReleased' });
        resolve(new Float32Array(audio));
      }
    };
    worker.onmessage = ({ data }) => {
      if (data.type === 'started') arm(120000);
      else if (data.type === 'session-init') arm(data.state === 'start' ? 120000 : 300000);
      else if (data.type === 'progress') {
        arm(300000);
        onProgress(data.text);
      } else if (data.type === 'result') finish(null, data.audio);
      else if (data.type === 'error') finish(new Error(data.message));
    };
    worker.onerror = worker.onmessageerror = () => finish(new Error('HTDemucs worker stopped'));
    onProgress({ key: 'separationStarting' });
    arm(30000);
    try {
      worker.postMessage(
        { stereo: stereo.map((c) => c.buffer) },
        stereo.map((c) => c.buffer)
      );
    } catch (error) {
      finish(error);
    }
  });
}
