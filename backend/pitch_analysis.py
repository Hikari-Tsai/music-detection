"""Official GAME Small ONNX pipeline for the optional local FastAPI engine.

The bundled weights have CC BY-NC-SA 4.0 terms; see third_party/GAME-NOTICE.md.
Uses the same graphs, chunk ownership and filtering as the browser implementation.
"""

import hashlib
import json
import logging
import math
import threading
import numpy as np
from .config import ROOT

RATE = 44100
MIN_NOTE_SECONDS = 0.08
MODEL_ROOT = ROOT / "assets/models/game/1.0.3-small"
LOCK = threading.Lock()
SESSIONS = None
logger = logging.getLogger(__name__)
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def pitch_chunks(length):
    return [
        dict(
            core_start=s,
            core_end=min(length, s + 8 * RATE),
            start=max(0, s - RATE),
            end=min(length, s + 9 * RATE),
        )
        for s in range(0, length, 8 * RATE)
    ]


def decode_pitch_chunk(durations, scores, presence, mask, chunk):
    if not all(len(a) == len(durations) for a in (scores, presence, mask)):
        raise ValueError("Invalid GAME output dimensions")
    notes = []
    cursor = chunk["start"] / RATE
    for duration, midi, voiced, valid in zip(durations, scores, presence, mask):
        duration, midi = float(duration), float(midi)
        if not math.isfinite(duration) or duration < 0:
            raise ValueError("Invalid GAME duration")
        start = max(cursor, chunk["core_start"] / RATE)
        cursor += duration
        end = min(cursor, chunk["core_end"] / RATE)
        if (
            not valid
            or not voiced
            or not math.isfinite(midi)
            or not 0 <= midi <= 127
            or end - start < MIN_NOTE_SECONDS
        ):
            continue
        integer = math.floor(midi + 0.5)
        notes.append(
            dict(
                start_seconds=round(start, 3),
                end_seconds=round(end, 3),
                midi=round(midi, 3),
                note=NOTE_NAMES[integer % 12] + str(integer // 12 - 1),
                hz=round(440 * 2 ** ((midi - 69) / 12), 3),
            )
        )
    return notes


def summarize_pitch(notes):
    if not notes:
        return dict(pitch=None, pitch_status="unavailable", pitch_reason="no_notes")
    lowest = min(notes, key=lambda n: n["midi"])
    highest = max(notes, key=lambda n: n["midi"])
    return dict(
        pitch_status="estimated",
        pitch_reason=None,
        pitch=dict(
            model="GAME Small v1.0.3",
            lowest=lowest,
            highest=highest,
            semitones=round(highest["midi"] - lowest["midi"], 3),
            note_count=len(notes),
            notes=notes,
        ),
    )


def load_sessions():
    global SESSIONS
    if SESSIONS is not None:
        return SESSIONS
    import onnxruntime as ort

    manifest = json.loads((MODEL_ROOT / "manifest.json").read_text())
    sessions = {}
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    # Use the local, tracked model bundle. Missing/corrupt files fail explicitly;
    # the API keeps tempo/key results and reports pitch_status=error.
    for entry in manifest["files"]:
        if not entry["name"].endswith(".onnx"):
            continue
        path = MODEL_ROOT / entry["name"]
        data = path.read_bytes()
        if (
            len(data) != entry["bytes"]
            or hashlib.sha256(data).hexdigest() != entry["sha256"]
        ):
            raise ValueError("GAME model checksum mismatch: " + entry["name"])
        sessions[path.stem] = ort.InferenceSession(
            str(path), sess_options=options, providers=["CPUExecutionProvider"]
        )
    SESSIONS = sessions
    return sessions


def infer_chunk(samples, sessions, chunk):
    def run(name, feeds):
        session = sessions[name]
        return dict(
            zip([o.name for o in session.get_outputs()], session.run(None, feeds))
        )

    duration = len(samples) / RATE
    encoded = run(
        "encoder",
        {
            "waveform": samples.reshape(1, -1),
            "duration": np.array([duration], np.float32),
        },
    )
    known = run(
        "dur2bd",
        {"durations": np.array([[duration]], np.float32), "maskT": encoded["maskT"]},
    )
    boundaries = known["boundaries"]
    threshold = np.array(0.2, np.float32)
    for i in range(8):
        boundaries = run(
            "segmenter",
            {
                "x_seg": encoded["x_seg"],
                "maskT": encoded["maskT"],
                "language": np.array([0], np.int64),
                "known_boundaries": known["boundaries"],
                "prev_boundaries": boundaries,
                "t": np.array([i / 8], np.float32),
                "threshold": threshold,
                "radius": np.array(2, np.int64),
            },
        )["boundaries"]
    regions = run("bd2dur", {"boundaries": boundaries, "maskT": encoded["maskT"]})
    output = run(
        "estimator",
        {
            "x_est": encoded["x_est"],
            "boundaries": boundaries,
            "maskT": encoded["maskT"],
            "maskN": regions["maskN"],
            "threshold": threshold,
        },
    )
    return decode_pitch_chunk(
        regions["durations"][0],
        output["scores"][0],
        output["presence"][0],
        regions["maskN"][0],
        chunk,
    )


def analyze_pitch(audio, sr):
    if not len(audio) or not np.any(np.abs(audio) >= 1e-7):
        return dict(pitch=None, pitch_status="unavailable", pitch_reason="silent")
    try:
        if sr != RATE:
            import torch
            import torchaudio.functional as F

            audio = F.resample(torch.from_numpy(audio), sr, RATE).numpy()
        audio = np.ascontiguousarray(audio, dtype=np.float32)
        if not np.isfinite(audio).all():
            raise ValueError("Invalid audio samples")
        with LOCK:
            sessions = load_sessions()
            notes = []
            for chunk in pitch_chunks(len(audio)):
                samples = audio[chunk["start"] : chunk["end"]]
                if np.any(np.abs(samples) >= 1e-7):
                    notes.extend(infer_chunk(samples, sessions, chunk))
        return {**summarize_pitch(notes), "pitch_engine": "onnx-cpu"}
    except Exception:
        logger.exception("GAME pitch analysis failed; retaining tempo/key results")
        return dict(pitch=None, pitch_status="error", pitch_reason="analysis_failed")
