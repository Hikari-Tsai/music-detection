// Beat times are relative to the analyzed selection in both engines.
export function clickNotes(beats, downbeats, duration) {
  if (!Array.isArray(beats) || !Number.isFinite(duration) || duration <= 0) return [];
  const valid = (value) => Number.isFinite(value) && value >= 0 && value < duration;
  const times = [...new Set(beats.filter(valid))].sort((a, b) => a - b);
  const accents = (Array.isArray(downbeats) ? downbeats : []).filter(valid).sort((a, b) => a - b);
  let index = 0;
  return times.map((start) => {
    while (index < accents.length && accents[index] < start - 0.04) index++;
    const accent = index < accents.length && Math.abs(accents[index] - start) <= 0.04;
    return {
      start_seconds: start,
      end_seconds: Math.min(duration, start + 0.045),
      midi: accent ? 93 : 81 // 1760 Hz downbeat / 880 Hz beat.
    };
  });
}
