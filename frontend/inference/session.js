// Structured lifecycle messages let the main thread time initialization without
// counting downloads or inference. Do not race uncancellable sessions in one worker.
export async function createTrackedSession(
  ort,
  bytes,
  options,
  model,
  notify = (message) => self.postMessage(message)
) {
  const phase = { type: 'session-init', model, provider: options.executionProviders[0] };
  notify({ ...phase, state: 'start' });
  try {
    return await ort.InferenceSession.create(bytes, options);
  } finally {
    notify({ ...phase, state: 'end' });
  }
}
