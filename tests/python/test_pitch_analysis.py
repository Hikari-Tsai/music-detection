import unittest
from unittest.mock import patch
import numpy as np
from backend.pitch_analysis import (
    pitch_chunks,
    decode_pitch_chunk,
    summarize_pitch,
    analyze_pitch,
)


class PitchTests(unittest.TestCase):
    def test_overlap_and_summary(self):
        chunks = pitch_chunks(44100 * 25)
        self.assertEqual(chunks[0]["core_start"], 0)
        self.assertEqual(chunks[-1]["core_end"], 44100 * 25)
        for a, b in zip(chunks, chunks[1:]):
            self.assertEqual(a["core_end"], b["core_start"])
        notes = decode_pitch_chunk(
            [2, 2],
            [0, 69],
            [True, True],
            [True, True],
            {"start": 7 * 44100, "core_start": 8 * 44100, "core_end": 10 * 44100},
        )
        self.assertEqual(
            [(n["start_seconds"], n["end_seconds"]) for n in notes], [(8, 9), (9, 10)]
        )
        self.assertEqual(summarize_pitch(notes)["pitch"]["lowest"]["note"], "C-1")
        self.assertEqual(notes[1]["hz"], 440)

    def test_filters(self):
        notes = decode_pitch_chunk(
            [1, 1, 0.02, 1, 1, 1],
            [0, 69, 100, float("nan"), 72, 75],
            [0, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 0],
            {"start": 0, "core_start": 0, "core_end": 44100 * 6},
        )
        self.assertEqual([n["note"] for n in notes], ["A4", "C5"])
        self.assertEqual(notes[0]["start_seconds"], 1)
        self.assertEqual(summarize_pitch(notes)["pitch"]["semitones"], 3)
        self.assertEqual(summarize_pitch([])["pitch_reason"], "no_notes")

    def test_silence_does_not_load_models_and_failure_is_partial(self):
        with patch(
            "backend.pitch_analysis.load_sessions", side_effect=RuntimeError("test")
        ) as loader:
            self.assertEqual(
                analyze_pitch(np.zeros(44100, dtype=np.float32), 44100)["pitch_reason"],
                "silent",
            )
            loader.assert_not_called()
            with self.assertLogs("backend.pitch_analysis", level="ERROR"):
                result = analyze_pitch(np.ones(44100, dtype=np.float32) * 0.1, 44100)
            self.assertEqual(result["pitch_status"], "error")

    def test_http_pitch_failure_preserves_other_results(self):
        import io
        import soundfile as sf
        from fastapi.testclient import TestClient
        from backend.app import app

        wav = io.BytesIO()
        sf.write(wav, np.ones(44100 * 4) * 0.1, 44100, format="WAV")
        beats = np.arange(8) * 0.5
        with (
            patch("backend.analysis.MODEL", return_value=(beats, beats[::4])),
            patch(
                "backend.analysis.analyze_key",
                return_value={"key_status": "estimated", "key": {"label": "C Major"}},
            ),
            patch(
                "backend.analysis.analyze_pitch",
                return_value={
                    "pitch": None,
                    "pitch_status": "error",
                    "pitch_reason": "analysis_failed",
                },
            ),
        ):
            response = TestClient(app).post(
                "/api/analyze",
                files={"file": ("test.wav", wav.getvalue(), "audio/wav")},
            )
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        self.assertEqual(result["pitch_status"], "error")
        self.assertEqual(result["key_status"], "estimated")
        self.assertEqual(result["result"]["bpm"], 120)
        self.assertIsNotNone(result["download_url"])
        self.assertFalse(result["midi_has_vocal"])
