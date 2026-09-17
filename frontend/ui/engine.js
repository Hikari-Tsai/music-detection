// Adapters keep transport and deployment-specific copy out of UI event handlers.
export function createEngine(
  kind = 'browser',
  {
    pythonBaseURL = 'http://127.0.0.1:8765/',
    browserModuleURL = new URL('./browser-client.js', import.meta.url).href
  } = {}
) {
  const browser = kind !== 'python';
  return {
    kind: browser ? 'browser' : 'python',
    localNote: browser ? '瀏覽器本機運算' : '僅在本機處理',
    privacyNote: browser
      ? '音訊只在瀏覽器內分析，不會上傳。首次使用需下載約 82 MB 模型。'
      : '音訊不會傳送至雲端，分析後即清除上傳暫存。',
    previewNote: browser
      ? '瀏覽器無法播放此音訊，請改用 WAV 或 MP3。'
      : '瀏覽器不支援此格式的試聽，仍可分析。',
    downloadHint(data) {
      return browser
        ? ` · ${data.engine === 'webgpu' ? 'GPU' : 'CPU'} 本機分析`
        : ' · 下載保留 1 小時';
    },
    errorMessage(error) {
      if (!(error instanceof TypeError) && error.name !== 'TimeoutError') return error.message;
      return browser
        ? '分析資源載入失敗，請確認網路連線後重試。'
        : '無法連線到本機分析服務，請確認服務正在執行。';
    },
    async analyze(file, onProgress) {
      if (browser) {
        const { analyzeInBrowser } = await import(browserModuleURL);
        return analyzeInBrowser(file, onProgress);
      }
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(new URL('/api/analyze', pythonBaseURL), {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(300000)
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('無法連線到本機分析服務，請確認服務正在執行。');
      }
      if (!response.ok)
        throw new Error(
          typeof data.detail === 'string' ? data.detail : '分析失敗，請重新選擇檔案。'
        );
      return {
        ...data,
        download_url: data.download_url ? new URL(data.download_url, pythonBaseURL).href : null
      };
    }
  };
}
