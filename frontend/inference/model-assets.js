// A source supplies a complete bundle: manifest, optional frontend, and verified weights.
export class ModelLoadError extends Error {}

class SourceError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

export function createModelAssets(
  baseURL,
  progress,
  {
    primaryBaseURL,
    manifestOverride = null,
    fallbackName,
    includeFrontend = false,
    timeoutMs = 30000,
    fetchImpl = globalThis.fetch,
    cacheStorage = globalThis.caches
  } = {}
) {
  const fallback = {
    base: new URL(baseURL),
    name:
      fallbackName ||
      (['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname)
        ? 'Local server'
        : 'GitHub Pages')
  };
  const sources = primaryBaseURL
    ? [{ base: new URL(primaryBaseURL), name: 'Hugging Face' }, fallback]
    : [fallback];
  let bundle = null,
    pending = null;

  async function read(source, name, limit, onChunk) {
    const controller = new AbortController();
    let reader;
    // Timeout measures inactivity, not total download time. Slow but progressing downloads continue.
    async function wait(promise) {
      let timer;
      try {
        return await Promise.race([
          promise,
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              reject(new SourceError('modelSourceTimeout'));
              controller.abort();
            }, timeoutMs);
          })
        ]);
      } finally {
        clearTimeout(timer);
      }
    }
    try {
      const response = await wait(
        fetchImpl(new URL(name, source.base), { signal: controller.signal })
      );
      if (!response.ok) throw new SourceError('modelSourceHttp');
      if (!response.body) throw new SourceError('modelSourceNetwork');
      reader = response.body.getReader();
      const parts = [];
      let received = 0;
      while (true) {
        const { done, value } = await wait(reader.read());
        if (done) break;
        received += value.length;
        if (received > limit) throw new SourceError('modelSourceIntegrity');
        parts.push(value);
        onChunk?.(received);
      }
      const bytes = new Uint8Array(received);
      let offset = 0;
      for (const part of parts) {
        bytes.set(part, offset);
        offset += part.length;
      }
      return bytes;
    } catch (error) {
      throw error instanceof SourceError ? error : new SourceError('modelSourceNetwork');
    } finally {
      controller.abort();
      reader?.cancel().catch(() => {});
    }
  }

  async function json(source, name) {
    const bytes = await read(source, name, 2 * 1024 * 1024);
    try {
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new SourceError('modelSourceConfig');
    }
  }

  async function verified(bytes, manifest) {
    if (bytes.length !== manifest.model_bytes) return false;
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (v) =>
      v.toString(16).padStart(2, '0')
    ).join('');
    return hash === manifest.sha256;
  }

  async function fromSource(source, notice) {
    const report = (key, args = {}) => progress([...notice, `${source.name}: `, { key, args }]);
    report('modelSourceConnecting');
    const manifest = manifestOverride || (await json(source, 'manifest.json'));
    if (
      !manifest ||
      !/^[a-f0-9]{64}$/.test(manifest.sha256) ||
      !Number.isSafeInteger(manifest.model_bytes) ||
      manifest.model_bytes < 1 ||
      !/^[\w.-]+\.onnx$/.test(manifest.model_file)
    )
      throw new SourceError('modelSourceConfig');
    const frontend = includeFrontend ? await json(source, 'frontend.json') : null;
    if (
      includeFrontend &&
      (!frontend ||
        frontend.sample_rate !== 22050 ||
        frontend.n_fft !== 1024 ||
        frontend.hop_length !== 441 ||
        frontend.n_mels !== 128 ||
        !Array.isArray(frontend.window) ||
        frontend.window.length !== 1024 ||
        !Array.isArray(frontend.mel_filters) ||
        frontend.mel_filters.length !== 128 ||
        !frontend.window.every(Number.isFinite) ||
        !frontend.mel_filters.every(
          (row) => Array.isArray(row) && row.length === 513 && row.every(Number.isFinite)
        ))
    )
      throw new SourceError('modelSourceConfig');

    // Keep the existing same-origin cache key, scoped by hash, regardless of download source.
    const cacheURL = new URL(manifest.model_file, fallback.base).href;
    let cache;
    try {
      cache = await cacheStorage?.open(`tempo-model-${manifest.sha256}`);
      const response = await cache?.match(cacheURL);
      if (response) {
        report('modelCached');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (await verified(bytes, manifest)) return { bytes, frontend };
        await cache.delete(cacheURL);
      }
    } catch {
      // Cache access is optional and is not a reason to switch download sources.
    }

    report('modelSourceDownload', { size: Number((manifest.model_bytes / 1e6).toFixed(2)) });
    let lastPercent = -1;
    const bytes = await read(source, manifest.model_file, manifest.model_bytes, (received) => {
      const percent = Math.floor((received / manifest.model_bytes) * 100);
      if (percent !== lastPercent) {
        report('modelProgress', { percent });
        lastPercent = percent;
      }
    });
    report('modelSourceVerifying');
    if (!(await verified(bytes, manifest))) throw new SourceError('modelSourceIntegrity');
    try {
      await cache?.put(
        cacheURL,
        new Response(bytes, {
          headers: { 'Content-Type': 'application/octet-stream' }
        })
      );
    } catch {
      // Storage quota failures do not invalidate a verified model.
    }
    return { bytes, frontend };
  }

  async function load() {
    let notice = [];
    for (let index = 0; index < sources.length; index++) {
      try {
        return await fromSource(sources[index], notice);
      } catch (error) {
        const reason = { key: error.reason || 'modelSourceNetwork' };
        if (index + 1 === sources.length) {
          progress([...notice, `${sources[index].name}: `, reason]);
          throw new ModelLoadError(
            primaryBaseURL
              ? 'Hugging Face 與備援來源皆無法載入模型，請檢查網路後重試。'
              : error.reason === 'modelSourceIntegrity'
                ? '模型檔案驗證失敗，請重新下載。'
                : '模型下載失敗，請確認網路連線後再試。'
          );
        }
        notice = [
          {
            key: 'modelSourceFallback',
            args: { from: sources[index].name, to: sources[index + 1].name }
          },
          reason,
          ' · '
        ];
        progress(notice);
      }
    }
  }

  async function ready() {
    if (bundle) return bundle;
    if (!pending)
      pending = load()
        .then((value) => (bundle = value))
        .finally(() => {
          pending = null;
        });
    return pending;
  }
  return {
    async frontend() {
      return (await ready()).frontend;
    },
    async model() {
      return (await ready()).bytes;
    }
  };
}
