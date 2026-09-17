"""Independent S-KEY service: tonal failure never prevents tempo export."""
import logging
import threading
import numpy as np
import torch
from .skey_model import SKeyModel, SAMPLE_RATE, MIN_SECONDS, summarize_key

logger = logging.getLogger(__name__)
MODEL = None
LOCK = threading.Lock()


def analyze_key(audio):
    if len(audio) < MIN_SECONDS * SAMPLE_RATE:
        return {'key': None, 'key_status': 'unavailable', 'key_reason': 'too_short'}
    if not np.isfinite(audio).all() or float(np.max(np.abs(audio))) < 1e-7:
        return {'key': None, 'key_status': 'unavailable', 'key_reason': 'silent'}
    try:
        global MODEL
        with LOCK:
            if MODEL is None:
                MODEL = SKeyModel()
            with torch.inference_mode():
                scores = MODEL(torch.from_numpy(audio).unsqueeze(0)).numpy()
        return {'key': summarize_key(scores), 'key_status': 'estimated', 'key_reason': None}
    except Exception:
        logger.exception('S-KEY inference failed')
        return {'key': None, 'key_status': 'error', 'key_reason': 'analysis_failed'}
