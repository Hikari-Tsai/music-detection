"""Run the official Beat This! API and save its output plus derived tempo.

Usage: .venv/bin/python run_beat_this.py samples/choice.ogg
"""

import argparse
import importlib.metadata
import json
import platform
import subprocess
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

from .config import ROOT
from beat_this.inference import File2Beats
from beat_this.utils import save_beat_tsv


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path)
    parser.add_argument("--model", default="final0")
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--output-dir", type=Path, default=Path("results"))
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    # Keep downloaded weights local to this experiment.
    torch.hub.set_dir(str(ROOT / ".cache" / "torch"))
    torch.set_num_threads(4)

    start = time.perf_counter()
    predictor = File2Beats(checkpoint_path=args.model, device=args.device, dbn=False)
    load_seconds = time.perf_counter() - start
    if args.device == "mps":
        torch.mps.synchronize()
    start = time.perf_counter()
    beats, downbeats = predictor(str(args.audio))
    if args.device == "mps":
        torch.mps.synchronize()
    inference_seconds = time.perf_counter() - start

    audio, sample_rate = sf.read(args.audio, always_2d=True)
    duration = len(audio) / sample_rate
    intervals = np.diff(beats)
    median_bpm = float(60 / np.median(intervals)) if len(intervals) else None
    span_bpm = float(60 * (len(beats) - 1) / (beats[-1] - beats[0])) if len(beats) > 1 else None
    stem = args.audio.stem
    save_beat_tsv(beats, downbeats, args.output_dir / f"{stem}.beats")
    source_dir = ROOT / "vendor" / "beat_this"
    revision = subprocess.check_output(
        ["git", "-C", str(source_dir), "rev-parse", "HEAD"], text=True
    ).strip() if source_dir.exists() else None
    result = {
        "input": str(args.audio.resolve()),
        "duration_seconds": duration,
        "sample_rate": sample_rate,
        "model": args.model,
        "device": args.device,
        "dbn": False,
        "source_commit": revision,
        "versions": {"python": platform.python_version(), **{
            name: importlib.metadata.version(name)
            for name in ("beat-this", "torch", "torchaudio", "numpy")
        }},
        "model_load_and_download_seconds": load_seconds,
        "inference_including_audio_load_seconds": inference_seconds,
        "raw_api_output": {
            "beat_count": len(beats),
            "downbeat_count": len(downbeats),
            "beats_seconds": beats.tolist(),
            "downbeats_seconds": downbeats.tolist(),
        },
        "derived_not_model_output": {
            "median_interval_bpm": median_bpm,
            "whole_detected_span_bpm": span_bpm,
            "local_bpm": (60 / intervals).tolist(),
            "note": "Tempo estimates are derived from detected beats, not ground truth. Half/double-time ambiguity and tempo changes are not resolved.",
        },
    }
    (args.output_dir / f"{stem}.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Make detected timing audible: high click for a downbeat, low for other beats.
    mix = audio.astype(np.float64) * 0.65
    click_t = np.arange(round(0.035 * sample_rate)) / sample_rate
    for beat in beats:
        hz = 1500 if np.any(np.isclose(downbeats, beat, atol=1e-6)) else 900
        click = 0.22 * np.sin(2 * np.pi * hz * click_t) * np.exp(-click_t * 110)
        offset = round(float(beat) * sample_rate)
        length = min(len(click), len(mix) - offset)
        if offset >= 0 and length > 0:
            mix[offset:offset + length] += click[:length, None]
    peak = np.max(np.abs(mix))
    if peak > 0.98:
        mix *= 0.98 / peak
    sf.write(args.output_dir / f"{stem}_with_clicks.wav", mix, sample_rate)
    print(json.dumps({
        "duration_seconds": duration,
        "beat_count": len(beats),
        "downbeat_count": len(downbeats),
        "first_12_beats_seconds": beats[:12].tolist(),
        "first_6_downbeats_seconds": downbeats[:6].tolist(),
        "median_interval_bpm": median_bpm,
        "whole_detected_span_bpm": span_bpm,
        "inference_seconds": inference_seconds,
        "output_dir": str(args.output_dir.resolve()),
    }, indent=2))


if __name__ == "__main__":
    main()
