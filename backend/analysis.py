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
from .pitch_analysis import analyze_pitch

class AnalysisError(Exception):
    def __init__(self, status_code, detail):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail

MODEL_LOCK = threading.Lock()
MODEL = None

def decode_audio(source, sample_rate=22050):
    decoded = source.with_name(f"decoded-{sample_rate}.wav")
    try:
        process = subprocess.run(
            ["ffmpeg", "-nostdin", "-v", "error", "-y", "-protocol_whitelist", "file,pipe", "-i", str(source),
             "-map", "0:a:0", "-vn", "-t", str(MAX_SECONDS + 1), "-ac", "1", "-ar", str(sample_rate),
             "-c:a", "pcm_f32le", str(decoded)],
            capture_output=True, timeout=120,
        )
    except FileNotFoundError as error:
        raise AnalysisError(503, "找不到 FFmpeg，請先安裝後再試。") from error
    except subprocess.TimeoutExpired as error:
        raise AnalysisError(400, "音訊解碼逾時，請換一個檔案或縮短音訊。") from error
    if process.returncode:
        if b"matches no streams" in process.stderr:
            raise AnalysisError(400, "檔案沒有音軌，請選擇含有音訊的檔案。")
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


def select_audio(audio, sr, start_seconds=None, end_seconds=None):
    duration = len(audio) / sr
    if start_seconds is None and end_seconds is None:
        return audio, 0.0, duration
    if (start_seconds is None or end_seconds is None
        or not np.isfinite(start_seconds) or not np.isfinite(end_seconds)
        or start_seconds < 0 or end_seconds > duration + 0.001
        or end_seconds - start_seconds < 1 - 1e-8):
        raise AnalysisError(400, "選取範圍無效，請選擇至少 1 秒且不超出音訊的片段。")
    first = round(start_seconds * sr)
    last = min(len(audio), round(end_seconds * sr))
    return audio[first:last], first / sr, last / sr


def analyze_file(source, filename, start_seconds=None, end_seconds=None):
    global MODEL
    start = time.perf_counter()
    audio, sr, duration = decode_audio(source)
    source_duration = duration
    audio, selection_start, selection_end = select_audio(audio, sr, start_seconds, end_seconds)
    duration = len(audio) / sr
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
    try:
        # Preserve the original 22.05 kHz beat/key decoding. GAME receives a
        # separate 44.1 kHz decode of the source, never an upsampled beat input.
        pitch_audio, pitch_sr, _ = decode_audio(source, sample_rate=44100)
        pitch_audio, _, _ = select_audio(pitch_audio, pitch_sr, start_seconds, end_seconds)
        pitch_result = analyze_pitch(pitch_audio, pitch_sr)
    except Exception:
        import logging
        logging.getLogger(__name__).exception("GAME audio preparation failed")
        pitch_result = {"pitch": None, "pitch_status": "error", "pitch_reason": "analysis_failed"}
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
        **pitch_result,
        "filename": filename,
        "source_duration_seconds": round(source_duration, 3),
        "selection_start_seconds": selection_start,
        "selection_end_seconds": selection_end,
        "duration_seconds": round(duration, 3),
        "analysis_seconds": round(time.perf_counter() - start, 2),
        "beat_count": len(beats),
        "downbeat_count": len(downbeats),
        "result": result,
        "tempo_mode": tempo["tempo_mode"] if tempo != -1 else "unavailable",
        "midi": midi,
        "waveform": waveform,
    }
