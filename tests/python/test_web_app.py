import io
import unittest
from pathlib import Path
from unittest.mock import patch

import mido
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient


class WebAppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from web_app import app
        cls.client = TestClient(app)

    def test_page_serves_upload_interface(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn('id="audio-file"', response.text)
        self.assertIn('data-engine="browser"', response.text)
        self.assertIn('id="engine-select"', response.text)

    def test_local_frontend_can_read_api_errors_and_download_headers(self):
        origin = "http://127.0.0.1:8766"
        response = self.client.get("/api/download/not-a-file", headers={"Origin": origin})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.headers["access-control-allow-origin"], origin)
        self.assertIn("Content-Disposition", response.headers["access-control-expose-headers"])
        preflight = self.client.options("/api/analyze", headers={
            "Origin": origin, "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        })
        self.assertEqual(preflight.status_code, 200)

    def test_unconfigured_remote_origin_is_not_allowed(self):
        response = self.client.options("/api/analyze", headers={
            "Origin": "https://unconfigured.example", "Access-Control-Request-Method": "POST",
        })
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("access-control-allow-origin", response.headers)

    def test_python_page_can_load_browser_runtime(self):
        response = self.client.get("/runtime/browser-client.js")
        self.assertEqual(response.status_code, 200)
        self.assertIn("javascript", response.headers["content-type"])

    def test_real_audio_produces_downloadable_tempo(self):
        audio = Path(__file__).resolve().parents[2] / "samples" / "choice.ogg"
        with audio.open("rb") as stream:
            response = self.client.post("/api/analyze", files={"file": ("choice.ogg", stream, "audio/ogg")})
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["result"], {"bpm": 68.007, "signature_beats": 4})
        self.assertEqual(data["beat_count"], 29)
        self.assertEqual(len(data["beats"]), data["beat_count"])
        self.assertEqual(len(data["downbeats"]), data["downbeat_count"])
        self.assertEqual(data["beats"], sorted(data["beats"]))
        self.assertTrue(all(0 <= beat < data["duration_seconds"] for beat in data["beats"]))
        self.assertEqual(data["key_status"], "estimated")
        self.assertEqual(data["key"]["label"], "G Major")
        self.assertIn(data["pitch_status"], ("estimated", "unavailable"))
        if data["pitch"]:
            self.assertTrue(all(0 <= n["start_seconds"] < n["end_seconds"] <= data["duration_seconds"] + .001 for n in data["pitch"]["notes"]))
        self.assertGreater(len(data["waveform"]), 0)
        download = self.client.get(data["download_url"])
        self.assertEqual(download.status_code, 200)
        self.assertIn("attachment", download.headers["content-disposition"])
        midi = mido.MidiFile(file=io.BytesIO(download.content))
        self.assertEqual(midi.tracks[0][0].tempo, 882266)
        self.assertEqual((midi.tracks[0][1].numerator, midi.tracks[0][1].denominator), (4, 4))

    def test_silence_returns_minus_one_without_download(self):
        buffer = io.BytesIO()
        sf.write(buffer, np.zeros(22050 * 4), 22050, format="WAV")
        response = self.client.post("/api/analyze", files={"file": ("silence.wav", buffer.getvalue(), "audio/wav")})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["result"], -1)
        self.assertIsNone(response.json()["download_url"])
        self.assertIsNone(response.json()["key"])

    def test_variable_beats_produce_downloadable_tempo_map(self):
        # Isolate the model boundary to exercise known variable beat timing.
        # Upload/decode, averaging and MIDI encoding are real.
        beats = np.r_[np.arange(9) * 0.5, 4 + np.arange(1, 9) * 0.6]
        audio = Path(__file__).resolve().parents[2] / "samples" / "choice.ogg"
        with patch("backend.analysis.MODEL", return_value=(beats, beats[::4])), audio.open("rb") as stream:
            response = self.client.post("/api/analyze", files={"file": ("varying.ogg", stream, "audio/ogg")})
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["result"], {"bpm": 109.091, "signature_beats": 4})
        self.assertEqual(data["tempo_mode"], "variable")
        download = self.client.get(data["download_url"])
        self.assertEqual(download.status_code, 200)
        midi = mido.MidiFile(file=io.BytesIO(download.content))
        self.assertEqual([m.tempo for m in midi.tracks[0] if m.type == "set_tempo"], [500000, 600000])
        self.assertAlmostEqual(midi.length, 25.025986, delta=0.001)

    def test_key_failure_does_not_prevent_tempo_download(self):
        audio = Path(__file__).resolve().parents[2] / "samples" / "choice.ogg"
        failed = {"key": None, "key_status": "error", "key_reason": "analysis_failed"}
        with patch("backend.analysis.analyze_key", return_value=failed), audio.open("rb") as stream:
            response = self.client.post("/api/analyze", files={"file": ("choice.ogg", stream, "audio/ogg")})
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["key_status"], "error")
        self.assertEqual(data["result"]["bpm"], 68.007)
        self.assertEqual(self.client.get(data["download_url"]).status_code, 200)

    def test_corrupt_audio_gives_readable_error(self):
        response = self.client.post("/api/analyze", files={"file": ("broken.wav", b"not an audio file", "audio/wav")})
        self.assertEqual(response.status_code, 400)
        self.assertIsInstance(response.json()["detail"], str)

    def test_non_audio_is_rejected(self):
        response = self.client.post("/api/analyze", files={"file": ("notes.txt", b"hello", "text/plain")})
        self.assertEqual(response.status_code, 415)

    def test_unknown_download_is_not_found(self):
        self.assertEqual(self.client.get("/api/download/not-a-file").status_code, 404)


if __name__ == "__main__":
    unittest.main()
