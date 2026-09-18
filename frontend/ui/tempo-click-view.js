import { setText } from './i18n.js';
import { createPitchPlayer } from './pitch-player.js';
import { clickNotes } from './tempo-click.js';

export function createTempoClickView(beforePlay = () => {}) {
  const button = document.getElementById('tempo-click');
  const error = document.getElementById('tempo-click-error');
  let available = false,
    pending = false,
    request = 0;
  const player = createPitchPlayer({ waveform: 'sine', onChange: sync });
  function sync() {
    const active = pending || player.state.playing;
    button.disabled = !available;
    button.setAttribute('aria-pressed', String(active));
    button.querySelector('use').setAttribute('href', active ? '#i-pause' : '#i-play');
    setText('tempo-click-label', { key: active ? 'clickStop' : 'clickPlay' });
  }
  function stop() {
    request++;
    pending = false;
    player.pause();
  }
  button.addEventListener('click', async () => {
    if (pending || player.state.playing) return stop();
    if (!available) return;
    beforePlay();
    const ticket = ++request;
    error.hidden = true;
    pending = true;
    sync();
    try {
      await player.seek(0);
    } catch {
      if (ticket === request) {
        player.pause();
        error.hidden = false;
      }
    } finally {
      if (ticket === request) {
        pending = false;
        sync();
      }
    }
  });
  function reset() {
    available = false;
    stop();
    player.reset();
    error.hidden = true;
    setText('tempo-click-hint', { key: 'clickHint' });
  }
  function render(data) {
    reset();
    const notes = clickNotes(data.beats, data.downbeats, data.duration_seconds);
    available = data.result !== -1 && notes.length > 0;
    player.load(notes, data.duration_seconds);
    if (data.result !== -1 && !available) setText('tempo-click-hint', { key: 'clickMissing' });
    sync();
  }
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  reset();
  return { reset, render, stop };
}
