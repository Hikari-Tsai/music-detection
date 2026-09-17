import subprocess
import tempfile
import unittest
from pathlib import Path

import numpy as np
from fastapi.testclient import TestClient
from backend.app import app
from backend.analysis import decode_audio, AnalysisError


class VideoFormatTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='tempo-video-test-')
        cls.folder = Path(cls.temp.name)
        cls.client = TestClient(app)
        # Small actual video containers. Silence lets API tests skip model downloads.
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y',
            '-f', 'lavfi', '-i', 'color=c=black:s=32x32:r=1',
            '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono',
            '-t', '4', '-c:v', 'mpeg4', '-c:a', 'aac',
            str(cls.folder / 'silent.mp4')], check=True, capture_output=True)
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y',
            '-i', str(cls.folder / 'silent.mp4'), '-c:v', 'copy', '-c:a', 'pcm_s16le',
            str(cls.folder / 'silent.mov')], check=True, capture_output=True)
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y',
            '-i', str(cls.folder / 'silent.mp4'), '-an', '-c:v', 'copy',
            str(cls.folder / 'no-audio.mp4')], check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_mp4_and_mov_extract_audio_and_accept_range_analysis(self):
        for name in ['silent.mp4', 'silent.mov']:
            with self.subTest(name=name):
                source = self.folder / name
                audio, sr, duration = decode_audio(source)
                self.assertEqual(sr, 22050)
                self.assertTrue(np.isfinite(audio).all())
                self.assertLess(np.max(np.abs(audio)), 1e-7)
                self.assertAlmostEqual(duration, 4, delta=.1)
                response = self.client.post('/api/analyze',
                    files={'file': (name.upper(), source.read_bytes(), 'video/mp4')},
                    data={'start_seconds':'1','end_seconds':'3'})
                self.assertEqual(response.status_code, 200, response.text)
                data = response.json()
                self.assertEqual(data['duration_seconds'],2)
                self.assertEqual(data['selection_start_seconds'],1)
                self.assertEqual(data['result'],-1)
                self.assertIsNone(data['download_url'])

    def test_video_without_audio_has_a_specific_error(self):
        source = self.folder / 'no-audio.mp4'
        with self.assertRaises(AnalysisError) as error:
            decode_audio(source)
        self.assertEqual(error.exception.status_code,400)
        self.assertIn('沒有音軌',str(error.exception))
        response=self.client.post('/api/analyze', files={'file':('no-audio.mp4',source.read_bytes(),'video/mp4')})
        self.assertEqual(response.status_code,400,response.text)
        self.assertIn('沒有音軌',response.json()['detail'])
