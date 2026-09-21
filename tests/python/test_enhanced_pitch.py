"""Enhanced models must be opt-in and never coexist in the local process."""
import io
import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from backend.app import app
from backend.analysis import analyze_file


class EnhancedAPITests(unittest.TestCase):
    def test_http_forwards_opt_in_and_defaults_to_standard(self):
        for data, expected in [({}, False), ({'enhanced': 'true'}, True)]:
            with self.subTest(expected=expected), patch('backend.app.analyze_file', return_value={'midi': None}) as analyze:
                response = TestClient(app).post('/api/analyze', data=data,
                    files={'file': ('test.wav', b'wave', 'audio/wav')})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(analyze.call_args.args[4:], (expected,))

    def test_enhanced_preserves_mix_for_beats_key_and_selected_stereo_for_pitch(self):
        import backend.analysis as analysis
        self.assertTrue(hasattr(analysis, 'analyze_enhanced_pitch'))
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'test.wav'
            stereo = np.column_stack([np.linspace(.1, .8, 44100 * 5), np.linspace(.8, .1, 44100 * 5)]).astype(np.float32)
            sf.write(path, stereo, 44100, subtype='FLOAT')
            beats = np.arange(6) * .5
            failed = {'pitch': None, 'pitch_status': 'error', 'pitch_reason': 'enhancement_failed', 'pitch_mode': 'enhanced'}
            with patch('backend.analysis.MODEL', return_value=(beats, beats[::4])) as beat, \
                 patch('backend.analysis.analyze_key', return_value={'key_status': 'estimated'}) as key, \
                 patch('backend.analysis.analyze_enhanced_pitch', return_value=failed) as enhanced, \
                 patch('backend.analysis.analyze_pitch') as standard:
                result = analyze_file(path, 'test.wav', 1, 4, enhanced=True)
            self.assertEqual(beat.call_args.args[0].shape, (22050 * 3,))
            np.testing.assert_array_equal(key.call_args.args[0], beat.call_args.args[0])
            np.testing.assert_allclose(enhanced.call_args.args[0], stereo[44100:44100 * 4], atol=1e-6)
            self.assertEqual(enhanced.call_args.args[1], 44100)
            standard.assert_not_called()
            self.assertEqual(result['pitch_reason'], 'enhancement_failed')
            self.assertEqual(result['selection_start_seconds'], 1)
            self.assertEqual(result['duration_seconds'], 3)
            self.assertEqual(result['result']['bpm'], 120)
            self.assertIsNotNone(result['midi'])


class EnhancedLifecycleTests(unittest.TestCase):
    def test_separation_process_finishes_before_large_and_tempfiles_are_removed(self):
        from backend import enhanced_pitch as enhanced
        stages = []
        folder = None
        def stage(name, source, destination):
            nonlocal folder
            folder = source.parent
            stages.append(name)
            if name == 'separate':
                self.assertEqual(np.load(source).shape, (44100, 2))
                np.save(destination, np.ones(44100, np.float32) * .1)
            else:
                self.assertEqual(stages, ['separate', 'pitch'])
                destination.write_text('{"pitch_status":"unavailable","pitch":null,"pitch_reason":"no_notes"}')
        with patch.object(enhanced, 'run_stage', side_effect=stage):
            result = enhanced.analyze_enhanced_pitch(np.ones((44100, 2), np.float32) * .1, 44100)
        self.assertEqual(stages, ['separate', 'pitch'])
        self.assertFalse(folder.exists())
        self.assertEqual(result['pitch_mode'], 'enhanced')

    def test_prior_small_session_is_released_and_standard_is_locked_out(self):
        from backend import enhanced_pitch as enhanced, pitch_analysis
        def stage(name, source, destination):
            self.assertIsNone(pitch_analysis.SESSIONS)
            self.assertTrue(pitch_analysis.LOCK.locked())
            if name == 'separate':
                np.save(destination, np.ones(44100, np.float32))
            else:
                destination.write_text('{"pitch":null,"pitch_status":"unavailable","pitch_reason":"no_notes"}')
        with patch.object(pitch_analysis, 'SESSIONS', {'encoder': object()}), \
             patch.object(enhanced, 'run_stage', side_effect=stage):
            result = enhanced.analyze_enhanced_pitch(np.ones((44100, 2), np.float32), 44100)
        self.assertEqual(result['pitch_status'], 'unavailable')
        self.assertFalse(pitch_analysis.LOCK.locked())

    def test_failure_stops_before_large_and_does_not_load_small(self):
        from backend import enhanced_pitch as enhanced
        with patch.object(enhanced, 'run_stage', side_effect=RuntimeError('separator failed')) as stage, \
             patch('backend.pitch_analysis.load_sessions') as small, \
             self.assertLogs('backend.enhanced_pitch', level='ERROR'):
            result = enhanced.analyze_enhanced_pitch(np.ones((44100, 2), np.float32), 44100)
        self.assertEqual(stage.call_count, 1)
        small.assert_not_called()
        self.assertEqual(result['pitch_reason'], 'enhancement_failed')
        self.assertEqual(result['pitch_mode'], 'enhanced')

    def test_silence_does_not_start_workers(self):
        from backend import enhanced_pitch as enhanced
        with patch.object(enhanced, 'run_stage') as stage:
            result = enhanced.analyze_enhanced_pitch(np.zeros((44100, 2), np.float32), 44100)
        stage.assert_not_called()
        self.assertEqual(result['pitch_reason'], 'silent')

    def test_overlap_reconstructs_full_length_without_boundary_gain_or_peak_clipping(self):
        from types import SimpleNamespace
        from backend.enhanced_pitch import separate_vocals, SEGMENT
        class IdentityVocalModel:
            def get_outputs(self):
                return [SimpleNamespace(name='freq'), SimpleNamespace(name='time')]
            def run(self, names, feeds):
                output = np.zeros((1, 4, 2, SEGMENT), np.float32)
                output[0, 3] = feeds['mix'][0]
                return np.zeros((1, 4, 1), np.float32), output
        t = np.arange(SEGMENT + 44100) / 44100
        audio = np.column_stack([1.5 * np.sin(2 * np.pi * 440 * t), 1.5 * np.sin(2 * np.pi * 440 * t)])
        with patch('backend.enhanced_pitch.demucs_spectrogram', return_value=np.zeros(1)), \
             patch('backend.enhanced_pitch.demucs_waveform', return_value=np.zeros((2, SEGMENT), np.float32)):
            actual = separate_vocals(audio, IdentityVocalModel())
        expected = audio.mean(axis=1)
        expected /= np.max(np.abs(expected))
        self.assertEqual(len(actual), len(audio))
        self.assertLessEqual(float(np.max(np.abs(actual))), 1)
        np.testing.assert_allclose(actual, expected, atol=5e-7)

    def test_stft_channel_order_and_synthesis_preserve_interior_timing(self):
        from backend.enhanced_pitch import demucs_spectrogram, demucs_waveform, SEGMENT
        time = np.arange(SEGMENT) / 44100
        stereo = np.stack([np.sin(2 * np.pi * 440 * time), np.sin(2 * np.pi * 880 * time)]).astype(np.float32)
        spectrum = demucs_spectrogram(stereo)
        self.assertEqual(spectrum.shape, (1, 4, 2048, 336))
        restored = demucs_waveform(spectrum[0], SEGMENT)
        self.assertEqual(restored.shape, stereo.shape)
        np.testing.assert_allclose(restored[:, 4096:-4096], stereo[:, 4096:-4096], atol=2e-6)


class EnhancedCacheTests(unittest.TestCase):
    def test_native_download_uses_release_fallback_instead_of_pages(self):
        from backend.enhanced_pitch import source_urls
        sources = {'primaryBaseURL': 'https://primary/models/',
                   'fallbackBaseURL': 'https://pages/models/',
                   'nativeFallbackBaseURL': 'https://releases/v1/'}
        self.assertEqual(source_urls(sources, 'model.onnx'),
            ['https://primary/models/model.onnx', 'https://releases/v1/model.onnx'])
        del sources['nativeFallbackBaseURL']
        self.assertEqual(source_urls(sources, 'model.onnx'),
            ['https://primary/models/model.onnx', 'https://pages/models/model.onnx'])

    def test_corrupt_primary_uses_verified_fallback_and_reuses_cache(self):
        from backend.enhanced_pitch import cached_file
        content = b'verified-model'
        entry = {'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()}
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / 'model.onnx'
            target.write_bytes(b'corrupt-cache')
            with patch('backend.enhanced_pitch.urlopen', side_effect=[io.BytesIO(b'bad-download'), io.BytesIO(content)]) as request:
                self.assertEqual(cached_file(target, entry, ['https://primary/model', 'https://fallback/model']), target)
                self.assertEqual(target.read_bytes(), content)
                self.assertEqual(request.call_count, 2)
            with patch('backend.enhanced_pitch.urlopen') as request:
                cached_file(target, entry, ['https://primary/model'])
                request.assert_not_called()
            self.assertEqual(list(Path(folder).iterdir()), [target])

    def test_unverified_download_cannot_replace_cached_file(self):
        from backend.enhanced_pitch import cached_file
        entry = {'bytes': 3, 'sha256': hashlib.sha256(b'yes').hexdigest()}
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / 'model.onnx'
            target.write_bytes(b'old')
            with patch('backend.enhanced_pitch.urlopen', return_value=io.BytesIO(b'oversized-data')):
                with self.assertRaises(RuntimeError):
                    cached_file(target, entry, ['https://primary/model'])
            self.assertEqual(target.read_bytes(), b'old')
            self.assertEqual(list(Path(folder).iterdir()), [target])

    def test_stage_timeout_propagates_without_starting_large(self):
        from backend import enhanced_pitch as enhanced
        with patch('backend.enhanced_pitch.subprocess.run', side_effect=subprocess.TimeoutExpired('worker', 3600)) as run, \
             self.assertLogs('backend.enhanced_pitch', level='ERROR'):
            result = enhanced.analyze_enhanced_pitch(np.ones((44100, 2), np.float32), 44100)
        self.assertEqual(result['pitch_reason'], 'enhancement_failed')
        self.assertEqual(run.call_count, 1)
        self.assertEqual(run.call_args.kwargs['timeout'], enhanced.STAGE_TIMEOUT)


if __name__ == '__main__':
    unittest.main()
