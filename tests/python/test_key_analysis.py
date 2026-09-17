import json
import unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
from backend.key_analysis import analyze_key
from backend.skey_model import summarize_key

ROOT = Path(__file__).resolve().parents[2]

class KeyAnalysisTests(unittest.TestCase):
    def test_real_native_model_matches_export_reference(self):
        audio=np.fromfile(ROOT/'.cache/web-fixtures/skey-choice.f32',dtype=np.float32)
        result=analyze_key(audio)
        self.assertEqual(result['key_status'],'estimated')
        self.assertEqual(result['key']['label'],'G Major')
        self.assertAlmostEqual(result['key']['score'],0.78125,places=5)

    def test_silence_and_short_audio_skip_model(self):
        with patch('backend.key_analysis.MODEL') as model:
            self.assertEqual(analyze_key(np.zeros(22050*4,dtype=np.float32))['key_reason'],'silent')
            self.assertEqual(analyze_key(np.ones(22050*2,dtype=np.float32))['key_reason'],'too_short')
            model.assert_not_called()

    def test_model_failure_returns_independent_error(self):
        with patch('backend.key_analysis.MODEL',side_effect=RuntimeError('test unavailable')):
            with self.assertLogs('backend.key_analysis',level='ERROR'):
                result=analyze_key(np.ones(22050*3,dtype=np.float32))
        self.assertEqual(result,{'key':None,'key_status':'error','key_reason':'analysis_failed'})

    def test_key_classes_follow_official_non_c_based_order(self):
        for index,label in [(0,'A Major'),(3,'C Major'),(12,'B minor'),(22,'A minor')]:
            scores=np.zeros(24);scores[index]=1
            self.assertEqual(summarize_key(scores)['label'],label)
        with self.assertRaises(ValueError): summarize_key([float('nan')]*24)
