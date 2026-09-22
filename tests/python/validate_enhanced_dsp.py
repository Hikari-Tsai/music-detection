"""Reproduce native/JavaScript DSP parity with Float32 files, without a browser.

Run: .venv/bin/python tests/python/validate_enhanced_dsp.py
Requires the verified htdemucs model in .cache/enhanced and npm dependencies.
This checks preprocessing/reconstruction, not WebGPU model-output equivalence.
"""
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import sys
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from backend.enhanced_pitch import (  # noqa: E402
    SEGMENT, demucs_spectrogram, demucs_waveform, load_demucs_session, separate_vocals,
)

FOLDER = ROOT / '.cache/enhanced-validation'


def save(name, values):
    np.asarray(values, dtype=np.float32).tofile(FOLDER / name)


class IdentityVocalModel:
    def get_outputs(self):
        return [SimpleNamespace(name='freq'), SimpleNamespace(name='time')]

    def run(self, names, feeds):
        output = np.zeros((1, 4, 2, SEGMENT), np.float32)
        output[0, 3] = feeds['mix'][0]
        return np.zeros((1, 4, 1), np.float32), output


def validate():
    FOLDER.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(4)
    length = SEGMENT + 44100
    t = np.arange(length) / 44100
    rng = np.random.default_rng(20260922)
    audio = np.stack([
        .8 * np.sin(2 * np.pi * (220 * t + 45 * t * t)) + .03 * rng.standard_normal(length) + .02,
        .7 * np.sin(2 * np.pi * 880 * t) + .03 * rng.standard_normal(length) - .03,
    ]).astype(np.float32)
    audio[:, 0] = [1.2, -.9]
    audio[:, -1] = [-1.3, .7]
    save('input.f32', audio)
    segment = audio[:, :SEGMENT].copy()
    spectrum = demucs_spectrogram(segment)
    save('native-spectrum.f32', spectrum)
    save('native-roundtrip.f32', demucs_waveform(spectrum[0], SEGMENT))
    session = load_demucs_session()
    outputs = dict(zip([o.name for o in session.get_outputs()], session.run(None, {
        'mix': segment[None], 'mag': spectrum,
    })))
    frequency, time = outputs['freq'][0, 3].copy(), outputs['time'][0, 3].copy()
    save('model-frequency.f32', frequency)
    save('model-time.f32', time)
    save('native-model-vocals.f32', demucs_waveform(frequency, SEGMENT) + time)
    del outputs, session
    with patch('backend.enhanced_pitch.demucs_spectrogram', return_value=np.zeros(1)), \
         patch('backend.enhanced_pitch.demucs_waveform', return_value=np.zeros((2, SEGMENT), np.float32)):
        save('native-overlap.f32', separate_vocals(audio.T, IdentityVocalModel()))
        anti = np.stack([audio[0], -audio[0]])
        save('antiphase-input.f32', anti)
        save('native-antiphase.f32', separate_vocals(anti.T, IdentityVocalModel()))

    javascript = '''
import fs from 'node:fs';
import {SEGMENT,demucsSpectrogram,demucsWaveform,separateVocals} from MODULE;
const folder=FOLDER;
const read=name=>{const data=fs.readFileSync(folder+name);return new Float32Array(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));};
const write=(name,array)=>fs.writeFileSync(folder+name,Buffer.from(array.buffer,array.byteOffset,array.byteLength));
const joined=channels=>{const out=new Float32Array(channels[0].length*2);out.set(channels[0]);out.set(channels[1],channels[0].length);return out;};
const input=read('input.f32'),length=input.length/2;
const stereo=[input.subarray(0,length),input.subarray(length)];
const spectrum=demucsSpectrogram(stereo.map(c=>c.slice(0,SEGMENT)));
write('browser-spectrum.f32',spectrum);
write('browser-roundtrip.f32',joined(demucsWaveform(spectrum)));
const vocal=demucsWaveform(read('model-frequency.f32')),time=read('model-time.f32');
for(let c=0;c<2;c++)for(let i=0;i<SEGMENT;i++)vocal[c][i]+=time[c*SEGMENT+i];
write('browser-model-vocals.f32',joined(vocal));
write('browser-overlap.f32',await separateVocals(stereo,async chunk=>chunk));
const anti=read('antiphase-input.f32');
write('browser-antiphase.f32',await separateVocals([anti.subarray(0,length),anti.subarray(length)],async chunk=>chunk));
'''.replace('MODULE', json.dumps((ROOT / 'frontend/inference/separation-dsp.js').as_uri())).replace('FOLDER', json.dumps(str(FOLDER) + '/'))
    script = FOLDER / 'browser.mjs'
    script.write_text(javascript)
    subprocess.run(['node', str(script)], cwd=ROOT, check=True, timeout=120)
    checks = []
    thresholds = {'spectrum': 4e-6, 'roundtrip': 1e-6, 'model-vocals': 1e-6, 'overlap': 5e-7, 'antiphase': 1e-7}
    for name, tolerance in thresholds.items():
        native = np.fromfile(FOLDER / f'native-{name}.f32', np.float32).astype(np.float64)
        browser = np.fromfile(FOLDER / f'browser-{name}.f32', np.float32).astype(np.float64)
        assert native.shape == browser.shape
        error = native - browser
        peak, rms = float(np.max(np.abs(error))), float(np.sqrt(np.mean(error ** 2)))
        assert np.isfinite(error).all() and peak < tolerance, (name, peak, tolerance)
        checks.append(dict(name=name, values=len(native), peak_absolute_error=peak,
                           rms_error=rms, peak_tolerance=tolerance, passed=True))
    source_paths = ['frontend/inference/separation-dsp.js', 'backend/enhanced_pitch.py']
    result = dict(
        command='.venv/bin/python tests/python/validate_enhanced_dsp.py',
        environment=dict(python=platform.python_version(), torch=torch.__version__, numpy=np.__version__,
                         node=subprocess.check_output(['node', '--version'], text=True).strip(), machine=platform.machine()),
        fixture=dict(seed=20260922, sample_rate=44100, samples_per_channel=length, channels=2,
                     description='Stereo chirp, 880 Hz tone, seeded Gaussian noise, channel offsets and first/last sample impulses; second fixture is anti-phase stereo.',
                     input_sha256=hashlib.sha256((FOLDER / 'input.f32').read_bytes()).hexdigest()),
        source_sha256={path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in source_paths},
        model_sha256=json.loads((ROOT / 'assets/models/enhanced/manifest.json').read_text())['demucs']['sha256'],
        method='Exchange raw channel-major Float32 arrays between native PyTorch and the actual frontend DSP module running in Node. Reconstruct identical real ONNX vocal frequency/time branches in each engine; use an identity vocal model for independent overlap/normalization checks.',
        limitations=['Does not measure vocal separation quality or GAME pitch accuracy.',
                     'Does not establish equivalence of browser WebGPU versus native CPU ONNX graph execution.',
                     'Does not compare against the official CLI random-shift or contextual center-padding policy.'],
        checks=checks,
    )
    output = ROOT / 'docs/enhanced-validation.json'
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    validate()
