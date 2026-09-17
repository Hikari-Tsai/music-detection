"""Filesystem locations and local service limits."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UI_ROOT = ROOT / "frontend" / "ui"
MAX_BYTES = 100 * 1024 * 1024
MAX_SECONDS = 20 * 60
EXTENSIONS = {".wav", ".mp3", ".flac", ".m4a", ".ogg", ".aif", ".aiff", ".aac", ".mp4", ".mov"}
