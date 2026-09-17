"""Decode audio and run the cached predictor, independently of HTTP routes."""
import subprocess
import threading
import time
import numpy as np
import soundfile as sf
import torch
from beat_this.inference import Audio2Beats
from .config import ROOT, MAX_SECONDS
from .tempo import estimate_tempo, tempo_midi_bytes
from .key_analysis import analyze_key

class AnalysisError(Exception):
    def __init__(self, status_code, detail):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail

MODEL_LOCK = threading.Lock()
MODEL = None

def decode_audio(source):
    decoded = source.with_name("decoded.wav")
    try:
        process = subprocess.run(
            ["ffmpeg", "-nostdin", "-v", "error", "-y", "-protocol_whitelist", "file,pipe", "-i", str(source),
             "-vn", "-t", str(MAX_SECONDS + 1), "-ac", "1", "-ar", "22050",
             "-c:a", "pcm_f32le", str(decoded)],
            capture_output=True, timeout=120,
        )
    except FileNotFoundError as error:
        raise AnalysisError(503, "找不到 FFmpeg，請先安裝後再試。") from error
    except subprocess.TimeoutExpired as error:
        raise AnalysisError(400, "音訊解碼逾時，請換一個檔案或縮短音訊。") from error
    if process.returncode:
        raise AnalysisError(400, "無法讀取這個音訊檔，請確認檔案沒有損壞。")
    audio, sr = sf.read(decoded, dtype="float32")
    duration = len(audio) / sr
    if duration > MAX_SECONDS:
        raise AnalysisError(413, "音訊超過 20 分鐘，請先截取較短的片段。")
    if duration < 1:
        raise AnalysisError(400, "音訊太短，請提供至少 1 秒的檔案。")
    if not np.isfinite(audio).all():
        raise AnalysisError(400, "音訊含有無效的取樣數值，請重新匯出後再試。")
    return audio, sr, duration


def analyze_file(source, filename):
    global MODEL
    start = time.perf_counter()
    audio, sr, duration = decode_audio(source)
    if float(np.max(np.abs(audio))) < 1e-7:
        beats, downbeats = np.array([]), np.array([])
    else:
        with MODEL_LOCK:
            if MODEL is None:
                torch.hub.set_dir(str(ROOT / ".cache" / "torch"))
                torch.set_num_threads(4)
                MODEL = Audio2Beats(checkpoint_path="final0", device="cpu", dbn=False)
            beats, downbeats = MODEL(audio, sr)
    key_result = analyze_key(audio)
    tempo = estimate_tempo(beats, downbeats)
    waveform = [float(np.max(np.abs(chunk))) for chunk in np.array_split(audio, 240)]
    peak = max(waveform)
    if peak > 0:
        waveform = [round(value / peak, 4) for value in waveform]
    midi = None
    result = -1
    if tempo != -1:
        result = {"bpm": tempo["bpm"], "signature_beats": tempo["signature_beats"]}
        midi = tempo_midi_bytes(tempo, duration)
    return {
        **key_result,
        "filename": filename,
        "duration_seconds": round(duration, 3),
        "analysis_seconds": round(time.perf_counter() - start, 2),
        "beat_count": len(beats),
        "downbeat_count": len(downbeats),
        "result": result,
        "tempo_mode": tempo["tempo_mode"] if tempo != -1 else "unavailable",
        "midi": midi,
        "waveform": waveform,
    }
