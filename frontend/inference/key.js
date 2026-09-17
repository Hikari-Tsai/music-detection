import labels from '../../shared/skey-keys.json' with { type: 'json' };

export const KEY_MIN_SECONDS = 3;
export function summarizeKey(scores) {
  if (scores.length !== 24 || Array.from(scores).some((v) => !Number.isFinite(v))) {
    throw new Error('Invalid S-KEY output');
  }
  let index = 0;
  for (let i = 1; i < 24; i++) if (scores[i] > scores[index]) index = i;
  const [tonic, mode] = labels[index].split(' ');
  return {
    index,
    label: labels[index],
    tonic,
    mode: mode.toLowerCase(),
    score: Math.round(scores[index] * 1e6) / 1e6
  };
}
