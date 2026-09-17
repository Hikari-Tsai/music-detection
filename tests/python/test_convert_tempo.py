import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import mido
import numpy as np


class TempoConversionTests(unittest.TestCase):
    def convert(self, beats, downbeats):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "input.json"
            output = Path(folder) / "tempo.mid"
            source.write_text(json.dumps({"raw_api_output": {
                "beats_seconds": list(beats), "downbeats_seconds": list(downbeats)
            }}))
            result = subprocess.run(
                [sys.executable, str(Path(__file__).resolve().parents[2] / "convert_tempo.py"),
                 str(source), "--output", str(output)],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            value = json.loads(result.stdout)
            self.assertEqual(json.loads(output.with_suffix(".json").read_text()), value)
            midi = mido.MidiFile(output) if output.exists() else None
            return value, midi

    def test_constant_beats_produce_tempo_and_signature(self):
        # 120 BPM, four quarter notes per bar.
        beats = np.round((0.007 + np.arange(17) * 0.5) / 0.02) * 0.02
        value, midi = self.convert(beats, beats[::4])
        self.assertEqual(value, {"bpm": 120.0, "signature_beats": 4, "tempo_mode": "constant"})
        tempos = [m for m in midi.tracks[0] if m.type == "set_tempo"]
        signatures = [m for m in midi.tracks[0] if m.type == "time_signature"]
        self.assertEqual([(m.tempo, m.time) for m in tempos], [(500000, 0)])
        self.assertEqual([(m.numerator, m.denominator, m.time) for m in signatures], [(4, 4, 0)])
        self.assertFalse(any(m.type == "note_on" for m in midi.tracks[0]))

    def test_frame_quantization_does_not_count_as_a_tempo_change(self):
        # 136 BPM cannot be represented as a constant interval on a 50 Hz grid.
        beats = np.round((0.007 + np.arange(65) * (60 / 136)) / 0.02) * 0.02
        value, midi = self.convert(beats, beats[::4])
        self.assertIsNotNone(midi)
        self.assertAlmostEqual(value["bpm"], 136, delta=0.1)
        self.assertEqual(value["signature_beats"], 4)

    def test_tempo_change_displays_average_and_exports_changes(self):
        beats = np.r_[np.arange(9) * 0.5, 4 + np.arange(1, 9) * 0.6]
        value, midi = self.convert(beats, beats[::4])
        # Eight 0.5 s gaps and eight 0.6 s gaps: 0.55 s per quarter note.
        self.assertEqual(value, {"bpm": 109.091, "signature_beats": 4, "tempo_mode": "variable"})
        self.assertEqual([m.tempo for m in midi.tracks[0] if m.type == "set_tempo"], [500000, 600000])
        self.assert_beat_alignment(midi, beats)
        self.assertAlmostEqual(midi.length, beats[-1], delta=0.001)

    def test_gradual_acceleration_returns_average(self):
        beats = np.r_[0, np.cumsum(np.linspace(0.5, 0.43, 32))]
        value, midi = self.convert(beats, beats[::4])
        self.assertEqual(value["bpm"], 129.032)
        self.assertEqual(value["tempo_mode"], "variable")
        self.assertGreater(len([m for m in midi.tracks[0] if m.type == "set_tempo"]), 2)
        self.assert_beat_alignment(midi, beats)

    def assert_beat_alignment(self, midi, beats):
        events = []
        tick = 0
        for message in midi.tracks[0]:
            tick += message.time
            if message.type == "set_tempo":
                events.append((tick, message.tempo))
        ppq = midi.ticks_per_beat
        first_tick = round(beats[0] * ppq * 1_000_000 / events[0][1])
        for i, expected in enumerate(beats):
            target = first_tick + i * ppq
            elapsed, previous, tempo = 0., 0, 500000
            for tick, next_tempo in events:
                if tick > target:
                    break
                elapsed += mido.tick2second(tick - previous, ppq, tempo)
                previous, tempo = tick, next_tempo
            elapsed += mido.tick2second(target - previous, ppq, tempo)
            self.assertAlmostEqual(elapsed, expected, delta=0.001)

    def test_variable_tempo_preserves_leading_offset_without_inventing_meter(self):
        beats = 1.237 + np.r_[0, np.cumsum(np.linspace(0.63, 0.35, 48))]
        value, midi = self.convert(beats, [])
        self.assertEqual(value["tempo_mode"], "variable")
        self.assertIsNone(value["signature_beats"])
        self.assertFalse(any(m.type == "time_signature" for m in midi.tracks[0]))
        self.assert_beat_alignment(midi, beats)
        self.assertAlmostEqual(midi.length, beats[-1], delta=0.001)

    def test_two_beats_remain_average_without_claiming_variable(self):
        value, midi = self.convert([0.2, 0.7], [])
        self.assertEqual(value["tempo_mode"], "average")
        self.assertEqual([m.tempo for m in midi.tracks[0] if m.type == "set_tempo"], [500000])

    def test_unrepresentable_local_tempo_is_rejected(self):
        self.assertEqual(self.convert([0, 0.5, 1, 1.5, 20], []), (-1, None))

    def test_uncertain_meter_does_not_block_bpm_or_invent_signature(self):
        beats = np.arange(16) * 0.5
        value, midi = self.convert(beats, beats[[0, 4, 8, 11, 14]])
        self.assertEqual(value, {"bpm": 120.0, "signature_beats": None, "tempo_mode": "average"})
        self.assertFalse(any(message.type == "time_signature" for message in midi.tracks[0]))

    def test_constant_three_beats_is_three_four(self):
        beats = np.arange(13) * 0.5
        value, midi = self.convert(beats, beats[::3])
        self.assertEqual(value, {"bpm": 120.0, "signature_beats": 3, "tempo_mode": "constant"})
        signature = next(m for m in midi.tracks[0] if m.type == "time_signature")
        self.assertEqual((signature.numerator, signature.denominator), (3, 4))

    def test_missing_downbeats_still_allows_average_tempo(self):
        beats = np.arange(17) * 0.5
        value, midi = self.convert(beats, beats[[0, 4]])
        self.assertEqual(value, {"bpm": 120.0, "signature_beats": None, "tempo_mode": "average"})
        self.assertEqual(midi.tracks[0][0].tempo, 500000)
        self.assertFalse(any(message.type == "time_signature" for message in midi.tracks[0]))

    def test_insufficient_beats_still_returns_minus_one(self):
        self.assertEqual(self.convert([0.5], []), (-1, None))


if __name__ == "__main__":
    unittest.main()
