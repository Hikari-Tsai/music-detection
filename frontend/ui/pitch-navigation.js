export function pickPitchNote(notes, seconds) {
  const distance = (note) => Math.max(note.start_seconds - seconds, seconds - note.end_seconds, 0);
  return (
    notes.find((note) => note.start_seconds <= seconds && seconds < note.end_seconds) ||
    notes.reduce((best, note) => (!best || distance(note) < distance(best) ? note : best), null)
  );
}
