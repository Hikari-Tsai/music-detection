"""Export raw-audio S-KEY to ONNX and validate against native PyTorch."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import copy
import hashlib
import json
import numpy as np
import onnx
import onnxruntime as ort
import soundfile as sf
import torch
from backend.skey_model import SKeyModel, prepare_for_export, SOURCE_COMMIT, CHECKPOINT_SHA256, MIN_SECONDS, LABELS, summarize_key
from backend.config import ROOT

out = ROOT / 'assets' / 'onnx' / 'skey'
out.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(4)
reference = SKeyModel()
exported = prepare_for_export(copy.deepcopy(reference))
path = out / 'skey.onnx'
with torch.inference_mode():
    torch.onnx.export(exported, torch.randn(1, 22050*5), str(path),
        input_names=['audio'], output_names=['scores'],
        dynamic_axes={'audio': {1:'samples'}}, opset_version=17, dynamo=False)
onnx.checker.check_model(str(path))
options = ort.SessionOptions()
options.intra_op_num_threads = 4
session = ort.InferenceSession(str(path), options, providers=['CPUExecutionProvider'])
audio, sr = sf.read(ROOT/'samples'/'choice.ogg', dtype='float32')
assert sr == 22050
cases = {'short':audio[:22050*3], 'choice':audio, 'long':np.tile(audio,3)}
validation = []
fixtures = ROOT / '.cache' / 'web-fixtures'
fixtures.mkdir(parents=True, exist_ok=True)
for name, pcm in cases.items():
    x = np.asarray(pcm[None,:], dtype=np.float32)
    with torch.inference_mode():
        expected = reference(torch.from_numpy(x)).numpy()
        equivalent = exported(torch.from_numpy(x)).numpy()
    actual = session.run(None, {'audio':x})[0]
    error = float(np.max(np.abs(expected-actual)))
    assert error < 1e-4, (name,error)
    assert expected.argmax() == actual.argmax()
    assert np.max(np.abs(expected-equivalent)) < 1e-4
    result={'case':name,'max_score_error':error, 'key':summarize_key(expected)}
    validation.append(result)
    pcm.tofile(fixtures/f'skey-{name}.f32')
    (fixtures/f'skey-{name}.json').write_text(json.dumps({'scores':expected.reshape(-1).tolist(),'key':result['key']}))
    print(result,flush=True)
manifest={'model_file':path.name,'model_bytes':path.stat().st_size,
    'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
    'source_commit':SOURCE_COMMIT,'checkpoint_sha256':CHECKPOINT_SHA256,
    'sample_rate':22050,'min_seconds':MIN_SECONDS,'precision':'float32','opset':17,
    'labels':LABELS,'parity':validation}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
