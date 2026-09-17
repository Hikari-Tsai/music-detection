"""Load pinned S-KEY weights, retaining upstream HCQT and key class ordering."""
import hashlib
import json
import urllib.request
from pathlib import Path

import numpy as np
import torch
from torch import nn
from .config import ROOT
from .models.skey.hcqt import VQT
from .models.skey.chromanet import ChromaNet

SOURCE_COMMIT = '918b83d273568d5041569bb8068843d19a335726'
CHECKPOINT_SHA256 = '78dfd0ad4fa9434bf7cec70a25934b7c575bda9c80e994700140770ad3a5ead4'
CHECKPOINT_URL = f'https://raw.githubusercontent.com/deezer/skey/{SOURCE_COMMIT}/skey/models/skey.pt'
LABELS = json.loads((ROOT / 'shared' / 'skey-keys.json').read_text())
SAMPLE_RATE = 22050
MIN_SECONDS = 3


def checkpoint_path():
    path = ROOT / '.cache' / 'skey' / 'skey.pt'
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        with urllib.request.urlopen(CHECKPOINT_URL, timeout=60) as response:
            content = response.read()
        if hashlib.sha256(content).hexdigest() != CHECKPOINT_SHA256:
            raise ValueError('S-KEY checkpoint checksum mismatch')
        temporary = path.with_suffix('.download')
        temporary.write_bytes(content)
        temporary.replace(path)
    if hashlib.sha256(path.read_bytes()).hexdigest() != CHECKPOINT_SHA256:
        raise ValueError('S-KEY checkpoint checksum mismatch')
    return path


def load_checkpoint():
    # Upstream stores a NumPy scalar alongside tensors. Allow only these numeric
    # types rather than enabling arbitrary pickle deserialization.
    allowed = [(np._core.multiarray.scalar, 'numpy.core.multiarray.scalar'), np.dtype,
               np.dtypes.Float64DType, np.dtypes.Int64DType]
    with torch.serialization.safe_globals(allowed):
        return torch.load(checkpoint_path(), map_location='cpu', weights_only=True)


class SKeyModel(nn.Module):
    """Mono PCM [1, samples] -> upstream ChromaNet scores [1, 24]."""
    def __init__(self):
        super().__init__()
        checkpoint = load_checkpoint()
        if checkpoint['audio']['sr'] != SAMPLE_RATE:
            raise ValueError('Unexpected S-KEY sample rate')
        self.hcqt = VQT(harmonics=[1], fmin=27.5, n_bins=99, verbose=False)
        self.chromanet = ChromaNet(n_bins=84, n_harmonics=1,
            out_channels=[2,3,40,40,30,10,3], kernels=[7,7,7,7,7,5,5], temperature=1)
        state = checkpoint['stone']
        self.hcqt.load_state_dict({k.removeprefix('hcqt.'): v for k,v in state.items() if k.startswith('hcqt.')})
        self.chromanet.load_state_dict({k.removeprefix('chromanet.'): v for k,v in state.items() if k.startswith('chromanet.')})
        self.eval()

    def forward(self, audio):
        # The official runner peak-normalizes its mono audio before inference.
        audio = audio / audio.abs().amax(dim=-1, keepdim=True).clamp_min(1e-12)
        features = self.hcqt(audio.unsqueeze(1))
        return self.chromanet(features[:, :, :84, :])


def dynamic_layer_norm(x, normalized_shape, weight=None, bias=None, eps=1e-5):
    """Equivalent affine-free layer norm with a dynamic time dimension."""
    mean = x.mean(dim=(1,2,3), keepdim=True)
    variance = ((x - mean) ** 2).mean(dim=(1,2,3), keepdim=True)
    return (x - mean) / torch.sqrt(variance + eps)


class TimeMean(nn.Module):
    def forward(self, x):
        return x.mean(dim=-1, keepdim=True)


def prepare_for_export(model):
    # Same math: dynamic normalized_shape and adaptive width pooling otherwise
    # prevent legacy ONNX export. Native backend retains the original operators.
    for block in list(model.chromanet.convnext_blocks) + list(model.chromanet.time_downsampling_blocks):
        block.norm = dynamic_layer_norm
    model.chromanet.global_average_pool = TimeMean()
    return model


def summarize_key(scores):
    scores = np.asarray(scores).reshape(-1)
    if scores.shape != (24,) or not np.isfinite(scores).all():
        raise ValueError('Invalid S-KEY output')
    index = int(scores.argmax())
    tonic, mode = LABELS[index].split()
    return {'index': index, 'label': LABELS[index], 'tonic': tonic, 'mode': mode.lower(),
            'score': round(float(scores[index]), 6)}
