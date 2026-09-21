"""Opt-in local HTDemucs → GAME Large pipeline with process-isolated models.

Each stage executes in a fresh interpreter. Waiting for that child to exit releases
its ONNX allocator and model before the next stage starts, including on failure.
"""
import gc
import hashlib
import json
import logging
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
from urllib.request import Request, urlopen

import numpy as np

from .config import ROOT
from . import pitch_analysis
from .pitch_analysis import RATE, infer_chunk, pitch_chunks, summarize_pitch

CACHE = ROOT / '.cache/enhanced'
MANIFEST = ROOT / 'assets/models/enhanced/manifest.json'
DOWNLOAD_SOURCES = ROOT / 'frontend/inference/download-sources.json'
SEGMENT = 343980
STRIDE = 257985
STAGE_TIMEOUT = 3600
ENHANCED_LOCK = threading.Lock()
logger = logging.getLogger(__name__)


def run_stage(stage, source, destination):
    """run() kills and reaps a timed-out child before propagating the error."""
    result = subprocess.run(
        [sys.executable, '-m', 'backend.enhanced_pitch', stage, str(source), str(destination)],
        cwd=ROOT, capture_output=True, timeout=STAGE_TIMEOUT,
        env={**os.environ, 'OMP_NUM_THREADS': '4', 'OPENBLAS_NUM_THREADS': '4'},
    )
    if result.returncode:
        raise RuntimeError(f'{stage} worker failed: {result.stderr.decode(errors="replace")[-2000:]}')


def analyze_enhanced_pitch(audio, sr):
    try:
        audio = np.ascontiguousarray(audio, dtype=np.float32)
        if sr != RATE or audio.ndim != 2 or audio.shape[1] != 2 or not np.isfinite(audio).all():
            raise ValueError('Enhanced pitch requires finite stereo audio at 44.1 kHz')
        if not audio.size or not np.any(np.abs(audio) >= 1e-7):
            return dict(pitch=None, pitch_status='unavailable', pitch_reason='silent', pitch_mode='enhanced')
        # Serializing the whole pair also prevents another request's separator
        # from running concurrently with this request's GAME Large model.
        with ENHANCED_LOCK, pitch_analysis.LOCK, tempfile.TemporaryDirectory(prefix='tempo-enhanced-') as folder:
            # A previous standard request may retain GAME Small sessions. Drop
            # those before separation and prevent new Small inference meanwhile.
            pitch_analysis.SESSIONS = None
            gc.collect()
            folder = Path(folder)
            source, vocals, output = folder / 'mix.npy', folder / 'vocals.npy', folder / 'pitch.json'
            np.save(source, audio, allow_pickle=False)
            run_stage('separate', source, vocals)
            source.unlink()
            run_stage('pitch', vocals, output)
            result = json.loads(output.read_text())
        return {**result, 'pitch_engine': 'onnx-cpu', 'pitch_mode': 'enhanced'}
    except Exception:
        logger.exception('Enhanced pitch analysis failed; retaining tempo/key results')
        return dict(pitch=None, pitch_status='error', pitch_reason='enhancement_failed', pitch_mode='enhanced')


def verified(path, entry):
    if not path.is_file() or path.stat().st_size != entry['bytes']:
        return False
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest() == entry['sha256']


def cached_file(path, entry, urls):
    """Only a fully verified, atomically installed file may reach ONNX Runtime."""
    if verified(path, entry):
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    error = None
    for url in dict.fromkeys(urls):
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=path.parent, suffix='.part', delete=False) as target:
                temporary = Path(target.name)
                with urlopen(Request(url, headers={'User-Agent': 'Tempo/1.0'}), timeout=60) as response:
                    count = 0
                    for block in iter(lambda: response.read(1024 * 1024), b''):
                        count += len(block)
                        if count > entry['bytes']:
                            raise ValueError('Model download exceeded declared size')
                        target.write(block)
            if not verified(temporary, entry):
                raise ValueError('Enhanced model checksum mismatch: ' + path.name)
            temporary.replace(path)
            return path
        except Exception as exc:
            error = exc
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
    raise RuntimeError('Unable to obtain verified enhanced model: ' + path.name) from error


def source_urls(config, name):
    fallback = config.get('nativeFallbackBaseURL') or config.get('fallbackBaseURL')
    return [base.rstrip('/') + '/' + name for base in (config.get('primaryBaseURL'), fallback) if base]


def load_demucs_session():
    manifest = json.loads(MANIFEST.read_text())['demucs']
    sources = json.loads(DOWNLOAD_SOURCES.read_text())['demucs']
    entry = {'bytes': manifest['model_bytes'], 'sha256': manifest['sha256']}
    path = cached_file(CACHE / manifest['model_file'], entry, source_urls(sources, manifest['model_file']))
    return new_session(path)


def new_session(path):
    import onnxruntime as ort
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    return ort.InferenceSession(str(path), sess_options=options, providers=['CPUExecutionProvider'])


def load_large_sessions():
    manifest = json.loads(MANIFEST.read_text())['game']
    sources = json.loads(DOWNLOAD_SOURCES.read_text())['gameLarge']
    sessions = {}
    for entry in manifest['files']:
        if not entry['name'].endswith('.onnx'):
            continue
        path = cached_file(CACHE / 'game-large' / entry['name'], entry, source_urls(sources, entry['name']))
        sessions[path.stem] = new_session(path)
    return sessions


def demucs_spectrogram(stereo):
    """HTDemucs _spec/_magnitude, including the normalized periodic Hann FFT."""
    import torch
    import torch.nn.functional as F
    x = torch.from_numpy(np.ascontiguousarray(stereo, dtype=np.float32))
    frames = (x.shape[-1] + 1023) // 1024
    x = F.pad(x, (1536, 1536 + frames * 1024 - x.shape[-1]), mode='reflect')
    z = torch.stft(x, 4096, 1024, window=torch.hann_window(4096),
                   normalized=True, center=True, return_complex=True, pad_mode='reflect')
    z = z[:, :-1, 2:2 + frames]
    return torch.view_as_real(z).permute(0, 3, 1, 2).reshape(1, 4, 2048, frames).numpy().copy()


def demucs_waveform(frequency, length):
    """HTDemucs _mask/_ispec for one source's complex-as-channels output."""
    import torch
    import torch.nn.functional as F
    m = torch.from_numpy(np.ascontiguousarray(frequency, dtype=np.float32))
    z = torch.view_as_complex(m.reshape(2, 2, 2048, -1).permute(0, 2, 3, 1).contiguous())
    z = F.pad(z, (2, 2, 0, 1))
    padded_length = ((length + 1023) // 1024) * 1024 + 3072
    waveform = torch.istft(z, 4096, 1024, window=torch.hann_window(4096),
                          normalized=True, center=True, length=padded_length)
    return waveform[:, 1536:1536 + length].numpy()


def separate_vocals(audio, session):
    """One standard HTDemucs model, deterministic overlap-add, vocals only.

    Browser parity uses no random shifts and right zero-padding for the final
    fixed-size segment, instead of the CLI's contextual center-padding/shifts.
    """
    audio = np.ascontiguousarray(audio.T, dtype=np.float32)
    reference = audio.mean(axis=0)
    mean, std = float(reference.mean()), float(reference.std(ddof=1))
    # Anti-phase stereo can have a silent mono reference; preserve its signal.
    if std < 1e-8:
        std = max(float(audio.std(ddof=1)), 1e-8)
    normalized = (audio - mean) / std
    length = audio.shape[1]
    vocals = np.zeros((2, length), np.float32)
    total = np.zeros(length, np.float32)
    weight = np.minimum(np.arange(1, SEGMENT + 1), np.arange(SEGMENT, 0, -1)).astype(np.float32)
    weight /= weight.max()
    for start in range(0, length, STRIDE):
        end = min(start + SEGMENT, length)
        count = end - start
        segment = np.zeros((2, SEGMENT), np.float32)
        segment[:, :count] = normalized[:, start:end]
        output = dict(zip([item.name for item in session.get_outputs()],
            session.run(None, {'mix': segment[None], 'mag': demucs_spectrogram(segment)})))
        # Both branches have already been internally de-normalized by the graph.
        vocal = demucs_waveform(output['freq'][0, 3], SEGMENT) + output['time'][0, 3]
        vocals[:, start:end] += vocal[:, :count] * weight[:count]
        total[start:end] += weight[:count]
        del output, vocal
    vocals = (vocals / total) * std + mean
    mono = vocals.mean(axis=0)
    if not np.isfinite(mono).all():
        raise ValueError('Invalid separated vocals')
    mono /= max(1.0, float(np.abs(mono).max()))
    return np.ascontiguousarray(mono, dtype=np.float32)


def worker(stage, source, destination):
    import torch
    torch.set_num_threads(4)
    audio = np.load(source, allow_pickle=False)
    if stage == 'separate':
        vocals = separate_vocals(audio, load_demucs_session())
        np.save(destination, vocals, allow_pickle=False)
    elif stage == 'pitch':
        notes = []
        if np.any(np.abs(audio) >= 1e-7):
            sessions = load_large_sessions()
            for chunk in pitch_chunks(len(audio)):
                samples = audio[chunk['start']:chunk['end']]
                if np.any(np.abs(samples) >= 1e-7):
                    notes.extend(infer_chunk(samples, sessions, chunk))
        result = summarize_pitch(notes)
        if result.get('pitch'):
            result['pitch']['model'] = 'GAME Large v1.0.3'
        destination.write_text(json.dumps(result, allow_nan=False))
    else:
        raise ValueError('Unknown enhanced stage')


if __name__ == '__main__':
    worker(sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]))
