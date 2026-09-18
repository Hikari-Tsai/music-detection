import test from 'node:test';
import assert from 'node:assert/strict';
import { createPitchPlayer } from '../../frontend/ui/pitch-player.js';

function harness(resume = async () => {}) {
  const voices = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
    setTargetAtTime() {}
  });
  const context = {
    currentTime: 0,
    destination: {},
    resume,
    createOscillator() {
      const voice = {
        frequency: param(),
        connect() {},
        disconnect() {},
        start(time) {
          this.started = time;
        },
        stop(time) {
          this.stopped = time;
        }
      };
      voices.push(voice);
      return voice;
    },
    createGain() {
      return { gain: param(), connect() {}, disconnect() {} };
    }
  };
  let tick;
  const player = createPitchPlayer({
    createContext: () => context,
    setTimer: (f) => {
      tick = f;
      return 1;
    },
    clearTimer: () => {
      tick = null;
    }
  });
  return {
    player,
    context,
    voices,
    advance(time) {
      context.currentTime = time;
      tick?.();
    }
  };
}
const notes = [
  { start_seconds: 0, end_seconds: 4, midi: 69 },
  { start_seconds: 6, end_seconds: 7, midi: 72 }
];

test('synth keeps rests, schedules bounded lookahead and resumes the sustained note after seek', async () => {
  const h = harness();
  h.player.load(notes, 8);
  await h.player.play();
  assert.equal(h.voices.length, 1);
  assert.equal(h.voices[0].frequency.value, 440);
  h.advance(2);
  h.player.pause();
  assert.equal(h.player.state.position, 2);
  assert.equal(h.player.state.playing, false);
  assert.ok(h.voices[0].stopped <= 2.02);
  await h.player.play();
  assert.equal(h.voices.length, 2);
  assert.ok(h.voices[1].stopped > 4 && h.voices[1].stopped < 4.1);
  await h.player.seek(5);
  assert.equal(h.voices.length, 2); // the gap is silent
  h.advance(3);
  assert.equal(h.voices.length, 3);
  h.advance(5);
  assert.equal(h.player.state.position, 8);
  assert.equal(h.player.state.playing, false);
});

test('extreme preview plays the exact floating pitch briefly and does not continue the song', async () => {
  const h = harness();
  h.player.load(notes, 8);
  await h.player.audition({ start_seconds: 6, midi: 69.5 });
  assert.equal(h.player.state.auditioning, true);
  assert.equal(h.player.state.position, 6);
  assert.ok(Math.abs(h.voices[0].frequency.value - 440 * 2 ** (0.5 / 12)) < 1e-8);
  assert.ok(h.voices[0].stopped < 1);
  h.advance(1);
  assert.equal(h.player.state.auditioning, false);
  assert.equal(h.voices.length, 1);
});

test('reset or pause cancels a pending AudioContext resume without stale sound', async () => {
  let resolve;
  const h = harness(
    () =>
      new Promise((r) => {
        resolve = r;
      })
  );
  h.player.load(notes, 8);
  const pending = h.player.play();
  h.player.reset();
  resolve();
  await pending;
  assert.equal(h.voices.length, 0);
  assert.equal(h.player.state.playing, false);
  assert.equal(h.player.state.duration, 0);
});

test('a new audition cancels old tones and normal playback can replay after the end', async () => {
  const h = harness();
  h.player.load(notes, 8);
  await h.player.audition(notes[0]);
  await h.player.audition(notes[1]);
  assert.ok(h.voices[0].stopped <= 0.02);
  h.player.pause();
  await h.player.seek(8, false);
  await h.player.play();
  assert.equal(h.player.state.position, 0);
  assert.equal(h.player.state.playing, true);
  h.player.reset();
});
