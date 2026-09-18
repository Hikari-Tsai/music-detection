// Web Audio transport for timed note events and short metronome clicks.
export function createPitchPlayer({
  createContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)(),
  setTimer = (fn) => setInterval(fn, 25),
  clearTimer = (id) => clearInterval(id),
  waveform = 'triangle',
  onChange = () => {}
} = {}) {
  let context,
    timer,
    notes = [],
    duration = 0,
    position = 0,
    origin = 0,
    playing = false,
    auditioning = false,
    auditionEnd = 0,
    next = 0,
    generation = 0;
  const voices = new Set();
  const clamp = (seconds) => Math.max(0, Math.min(duration, Number(seconds) || 0));
  const current = () => (playing ? clamp(context.currentTime - origin) : position);
  const state = () => ({ playing, auditioning, position: current(), duration });
  const emit = () => onChange(state());

  function tone(midi, start, length) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    const end = start + length;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(0.16, start + Math.min(0.012, length / 3));
    envelope.gain.setValueAtTime(0.16, Math.max(start + length / 3, end - 0.025));
    envelope.gain.linearRampToValueAtTime(0, end);
    const voice = { oscillator, envelope };
    voices.add(voice);
    oscillator.onended = () => {
      voices.delete(voice);
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(end + 0.005);
  }

  function pause() {
    position = current();
    playing = auditioning = false;
    generation++;
    if (timer !== undefined) clearTimer(timer);
    timer = undefined;
    for (const { oscillator, envelope } of voices) {
      const now = context.currentTime;
      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setTargetAtTime(0, now, 0.003);
      oscillator.stop(now + 0.015);
    }
    voices.clear();
    emit();
  }

  function tick() {
    if (auditioning) {
      if (context.currentTime >= auditionEnd) pause();
      return;
    }
    if (!playing) return;
    const seconds = current();
    if (seconds >= duration) {
      pause();
      return;
    }
    // Only schedule 150 ms ahead, even for a twenty-minute result.
    while (next < notes.length && notes[next].start_seconds < seconds + 0.15) {
      const note = notes[next++];
      const end = Math.min(duration, note.end_seconds);
      const start = Math.max(context.currentTime + 0.005, origin + note.start_seconds);
      if (origin + end > start) tone(note.midi, start, origin + end - start);
    }
  }

  async function ready() {
    const ticket = generation;
    context ||= createContext();
    await context.resume();
    return ticket === generation;
  }

  async function play() {
    pause();
    if (!notes.length || !duration) return;
    if (position >= duration) position = 0;
    if (!(await ready())) return;
    origin = context.currentTime - position;
    next = notes.findIndex((note) => note.end_seconds > position);
    if (next < 0) next = notes.length;
    playing = true;
    tick();
    timer = setTimer(tick);
    emit();
  }

  async function seek(seconds, autoplay = true) {
    pause();
    position = clamp(seconds);
    emit();
    if (autoplay && position < duration) await play();
  }

  async function audition(note) {
    pause();
    if (!notes.length || !Number.isFinite(note.midi)) return;
    position = clamp(note.start_seconds);
    if (!(await ready())) return;
    tone(note.midi, context.currentTime + 0.005, 0.75);
    auditioning = true;
    auditionEnd = context.currentTime + 0.77;
    timer = setTimer(tick);
    emit();
  }

  function load(values, seconds) {
    pause();
    notes = values
      .filter(
        (n) =>
          Number.isFinite(n.midi) &&
          n.midi >= 0 &&
          n.midi <= 127 &&
          Number.isFinite(n.start_seconds) &&
          Number.isFinite(n.end_seconds) &&
          n.start_seconds >= 0 &&
          n.end_seconds > n.start_seconds
      )
      .slice()
      .sort((a, b) => a.start_seconds - b.start_seconds);
    duration = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    position = 0;
    emit();
  }
  return {
    get state() {
      return state();
    },
    play,
    pause,
    seek,
    audition,
    load,
    reset: () => load([], 0)
  };
}
