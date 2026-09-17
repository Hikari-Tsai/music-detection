// Asset loading and optional persistent cache are independent of ONNX sessions.
export function createModelAssets(
  baseURL,
  progress,
  { fetchImpl = globalThis.fetch, cacheStorage = globalThis.caches } = {}
) {
  let modelBytes = null,
    constants = null;
  async function json(name, message) {
    const response = await fetchImpl(new URL(name, baseURL));
    if (!response.ok) throw new Error(message);
    return response.json();
  }
  async function verified(bytes, manifest) {
    if (bytes.length !== manifest.model_bytes) return false;
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (v) =>
      v.toString(16).padStart(2, '0')
    ).join('');
    return hash === manifest.sha256;
  }
  return {
    async frontend() {
      if (!constants) constants = await json('frontend.json', '音訊分析設定下載失敗。');
      return constants;
    },
    async model() {
      if (modelBytes) return modelBytes;
      const manifest = await json('manifest.json', '模型設定下載失敗，請重新整理後再試。');
      const url = new URL(manifest.model_file, baseURL).href;
      let cache;
      // Cache Storage is optional: access may be denied at open, match or read.
      try {
        cache = await cacheStorage?.open(`tempo-model-${manifest.sha256}`);
        const response = await cache?.match(url);
        if (response) {
          progress('正在讀取已快取的模型');
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (await verified(bytes, manifest)) return (modelBytes = bytes);
          await cache.delete(url);
        }
      } catch {
        /* Continue with a fresh download when cache is inaccessible. */
      }
      progress({ key: 'modelDownload', args: { size: Math.ceil(manifest.model_bytes / 1e6) } });
      const response = await fetchImpl(url);
      if (!response.ok) throw new Error('模型下載失敗，請確認網路連線後再試。');
      const reader = response.body.getReader(),
        parts = [];
      let received = 0,
        lastPercent = -1;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
        received += value.length;
        const percent = Math.floor((received / manifest.model_bytes) * 100);
        if (percent !== lastPercent) {
          progress({ key: 'modelProgress', args: { percent: Math.min(100, percent) } });
          lastPercent = percent;
        }
      }
      const bytes = new Uint8Array(received);
      let offset = 0;
      for (const part of parts) {
        bytes.set(part, offset);
        offset += part.length;
      }
      if (!(await verified(bytes, manifest))) throw new Error('模型檔案驗證失敗，請重新下載。');
      try {
        await cache?.put(
          url,
          new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } })
        );
      } catch {
        /* A storage quota error must not prevent inference. */
      }
      return (modelBytes = bytes);
    }
  };
}
