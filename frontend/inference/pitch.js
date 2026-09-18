export const PITCH_RATE = 44100;
export const PITCH_MIN_NOTE_SECONDS = 0.08;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const rounded = (v) => Math.round(v * 1000) / 1000;

// Eight-second ownership windows plus up to one second of context on each side.
export function pitchChunks(length) {
  const chunks = [];
  for (let coreStart = 0; coreStart < length; coreStart += 8 * PITCH_RATE) {
    const coreEnd = Math.min(length, coreStart + 8 * PITCH_RATE);
    chunks.push({
      coreStart,
      coreEnd,
      start: Math.max(0, coreStart - PITCH_RATE),
      end: Math.min(length, coreEnd + PITCH_RATE)
    });
  }
  return chunks;
}

export function decodePitchChunk({ durations, scores, presence, mask }, chunk) {
  if (![scores, presence, mask].every((a) => a.length === durations.length))
    throw new Error('Invalid GAME output dimensions');
  const notes = [];
  let cursor = chunk.start / PITCH_RATE;
  for (let i = 0; i < durations.length; i++) {
    const duration = durations[i];
    if (!Number.isFinite(duration) || duration < 0) throw new Error('Invalid GAME duration');
    const start = Math.max(cursor, chunk.coreStart / PITCH_RATE);
    cursor += duration; // Unvoiced intervals also advance time.
    const end = Math.min(cursor, chunk.coreEnd / PITCH_RATE);
    const midi = scores[i];
    if (
      !mask[i] ||
      !presence[i] ||
      !Number.isFinite(midi) ||
      midi < 0 ||
      midi > 127 ||
      end - start < PITCH_MIN_NOTE_SECONDS
    )
      continue;
    const integer = Math.round(midi);
    notes.push({
      start_seconds: rounded(start),
      end_seconds: rounded(end),
      midi: rounded(midi),
      note: NOTE_NAMES[integer % 12] + (Math.floor(integer / 12) - 1),
      hz: rounded(440 * 2 ** ((midi - 69) / 12))
    });
  }
  return notes;
}

export function summarizePitch(notes) {
  if (!notes.length) return { pitch: null, pitch_status: 'unavailable', pitch_reason: 'no_notes' };
  let lowest = notes[0],
    highest = notes[0];
  for (const n of notes) {
    if (n.midi < lowest.midi) lowest = n;
    if (n.midi > highest.midi) highest = n;
  }
  return {
    pitch_status: 'estimated',
    pitch_reason: null,
    pitch: {
      model: 'GAME Small v1.0.3',
      lowest,
      highest,
      semitones: rounded(highest.midi - lowest.midi),
      note_count: notes.length,
      notes
    }
  };
}
