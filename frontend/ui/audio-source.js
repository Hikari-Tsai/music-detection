// A decoded source stays intact while each analysis gets its own selected samples.
export function selectSamples(audio, sampleRate, range = null) {
  const duration = audio.length / sampleRate;
  const start = range?.start ?? 0;
  const end = range?.end ?? duration;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end > duration + 0.001 ||
    end <= start ||
    end - start < 1 - 1e-8
  )
    throw new Error('選取範圍無效，請選擇至少 1 秒且不超出音訊的片段。');
  return audio.slice(
    Math.round(start * sampleRate),
    Math.min(audio.length, Math.round(end * sampleRate))
  );
}

export function makeWaveform(audio) {
  const waveform = [];
  let peak = 0;
  for (let i = 0; i < 240; i++) {
    let value = 0;
    for (
      let j = Math.floor((i * audio.length) / 240);
      j < Math.floor(((i + 1) * audio.length) / 240);
      j++
    )
      value = Math.max(value, Math.abs(audio[j]));
    waveform.push(value);
    peak = Math.max(peak, value);
  }
  return peak > 0 ? waveform.map((value) => value / peak) : waveform;
}

export async function decodeSource(file, sampleRate = 22050, preserveStereo = false) {
  let decoded;
  try {
    decoded = await new OfflineAudioContext(1, 1, sampleRate).decodeAudioData(
      await file.arrayBuffer()
    );
  } catch {
    if (/\.(mp4|mov)$/i.test(file.name))
      throw new Error(
        '影片沒有可解碼的音軌，或瀏覽器不支援其音訊編碼。請確認影片含有音訊，改用本機 Python，或先匯出 WAV／MP3。'
      );
    throw new Error('瀏覽器無法解碼這個音訊，請轉成 WAV 或 MP3 後再試。');
  }
  if (decoded.duration > 1200) throw new Error('音訊超過 20 分鐘，請先截取較短片段。');
  if (decoded.duration < 1) throw new Error('音訊太短，請提供至少 1 秒的檔案。');
  const audio = new Float32Array(decoded.length);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const channel = decoded.getChannelData(ch);
    for (let i = 0; i < audio.length; i++) audio[i] += channel[i] / decoded.numberOfChannels;
  }
  if (audio.some((v) => !Number.isFinite(v))) throw new Error('音訊含有無效取樣，請重新匯出。');
  let stereoBuffer = decoded;
  if (preserveStereo && decoded.numberOfChannels > 2) {
    // Web Audio's speaker downmix retains center-channel vocals in surround
    // movie soundtracks; taking only channels 0 and 1 would discard them.
    const context = new OfflineAudioContext(2, decoded.length, decoded.sampleRate);
    const input = context.createBufferSource();
    input.buffer = decoded;
    input.connect(context.destination);
    input.start();
    stereoBuffer = await context.startRendering();
  }
  return {
    audio,
    ...(preserveStereo
      ? {
          stereo: [0, 1].map((ch) =>
            stereoBuffer.getChannelData(Math.min(ch, stereoBuffer.numberOfChannels - 1)).slice()
          )
        }
      : {}),
    sampleRate: decoded.sampleRate,
    duration: decoded.duration,
    waveform: makeWaveform(audio)
  };
}
