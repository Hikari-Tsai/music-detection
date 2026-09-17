"""Export the pinned Beat This! FP32 network and exact frontend constants."""
import hashlib
import json
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
from beat_this.inference import load_model
from beat_this.preprocessing import LogMelSpect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'onnx'
OUT.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(4)
torch.hub.set_dir(str(ROOT / '.cache' / 'torch'))
model = load_model('final0', 'cpu').eval()
for module in model.modules():
    if hasattr(module, 'cache_if_possible'):
        module.cache_if_possible = False

class ExportModel(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, spectrogram):
        result = self.model(spectrogram)
        return result['beat'], result['downbeat']

wrapper = ExportModel(model).eval()
path = OUT / 'beat-this-final0.onnx'
with torch.inference_mode():
    torch.onnx.export(wrapper, torch.zeros(1, 128, 128), str(path),
                      input_names=['spectrogram'], output_names=['beat', 'downbeat'],
                      dynamic_axes={'spectrogram': {1: 'frames'}, 'beat': {1: 'frames'}, 'downbeat': {1: 'frames'}},
                      opset_version=17, dynamo=False)
onnx.checker.check_model(str(path))
options = ort.SessionOptions()
options.intra_op_num_threads = 4
session = ort.InferenceSession(str(path), options, providers=['CPUExecutionProvider'])
errors = []
for length in [63, 128, 1264, 1500]:
    x = np.random.default_rng(42).random((1, length, 128), dtype=np.float32) * 5
    with torch.inference_mode():
        expected = wrapper(torch.from_numpy(x))
    actual = session.run(None, {'spectrogram': x})
    error = max(float(np.max(np.abs(a - b.numpy()))) for a,b in zip(actual,expected))
    assert error < 0.001, (length, error)
    errors.append({'frames':length, 'max_logit_error':error})
    print(errors[-1], flush=True)
frontend = LogMelSpect().spect_class
# Use the exact torchaudio FP32 coefficients rather than a subtly different mel implementation.
constants = {'sample_rate':22050, 'n_fft':1024, 'hop_length':441, 'n_mels':128,
             'window':frontend.spectrogram.window.tolist(),
             'mel_filters': frontend.mel_scale.fb.T.tolist()}
(OUT / 'frontend.json').write_text(json.dumps(constants,separators=(',',':')))
manifest = {'checkpoint':'final0', 'source_commit':'b95c8ab0c58c2d9fcfd40508ae8dffbc05ac4f5c',
            'precision':'float32', 'opset':17, 'model_file':path.name,
            'model_bytes':path.stat().st_size, 'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'parity':errors}
(OUT / 'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
