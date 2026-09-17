import io
import unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
import mido
import soundfile as sf
from fastapi.testclient import TestClient
from backend.analysis import analyze_file, select_audio, AnalysisError
from backend.app import app

class SelectionTests(unittest.TestCase):
    def test_model_inputs_and_midi_are_limited_to_selection(self):
        source = np.linspace(0.1, 0.9, 22050 * 10, dtype=np.float32)
        beats = np.array([0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75])
        with patch('backend.analysis.decode_audio', return_value=(source, 22050, 10)), \
             patch('backend.analysis.MODEL', return_value=(beats, beats[::4])) as model, \
             patch('backend.analysis.analyze_key', return_value={'key_status':'estimated'}) as key:
            result = analyze_file(Path('unused.wav'), 'test.wav', 2, 6)
        np.testing.assert_array_equal(model.call_args.args[0], source[44100:132300])
        np.testing.assert_array_equal(key.call_args.args[0], source[44100:132300])
        self.assertEqual(result['duration_seconds'], 4)
        self.assertEqual(result['selection_start_seconds'], 2)
        self.assertEqual(result['result']['bpm'], 120)
        midi = mido.MidiFile(file=io.BytesIO(result['midi']))
        self.assertAlmostEqual(midi.length, 4, delta=.001)

    def test_invalid_ranges(self):
        for start, end in [(-1,3),(0,11),(2,1),(0,.9),(float('nan'),3),(0,float('inf')),(1,None)]:
            with self.subTest(start=start,end=end), self.assertRaises(AnalysisError):
                select_audio(np.ones(100), 10, start, end)

    def test_http_selection_is_applied_before_inference(self):
        # Sound outside the selection must not trigger either model.
        source = np.zeros(22050*6); source[:22050]=.5; source[22050*5:]=.5
        wav=io.BytesIO(); sf.write(wav,source,22050,format='WAV')
        client=TestClient(app)
        response=client.post('/api/analyze', data={'start_seconds':'1','end_seconds':'5'},
            files={'file':('test.wav',wav.getvalue(),'audio/wav')})
        self.assertEqual(response.status_code,200,response.text)
        data=response.json()
        self.assertEqual(data['duration_seconds'],4)
        self.assertEqual(data['result'],-1)
        self.assertEqual(data['key_reason'],'silent')
        for fields in [{'start_seconds':'1'}, {'start_seconds':'0','end_seconds':'10'}]:
            response=client.post('/api/analyze',data=fields,files={'file':('test.wav',wav.getvalue(),'audio/wav')})
            self.assertEqual(response.status_code,400,response.text)
