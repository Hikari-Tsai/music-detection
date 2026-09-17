"""FastAPI routes for the optional local Python backend."""
import logging
import os
import tempfile
from pathlib import Path
from urllib.parse import quote
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from .analysis import analyze_file, AnalysisError
from .config import ROOT, UI_ROOT, MAX_BYTES, EXTENSIONS
from .downloads import DownloadStore

logger = logging.getLogger(__name__)
DOWNLOADS = DownloadStore()
app = FastAPI(title="Tempo", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=UI_ROOT), name="static")
# The Python-served page uses the same built ONNX runtime as the static frontend.
app.mount("/runtime", StaticFiles(directory=ROOT / "dist", check_dir=False), name="runtime")

@app.middleware("http")
async def upload_limit(request: Request, call_next):
    length = request.headers.get("content-length")
    if request.url.path == "/api/analyze" and length:
        try:
            if int(length) > MAX_BYTES + 1024 * 1024:
                return JSONResponse({"detail": "檔案超過 100 MB，請選擇較小的音訊。"}, status_code=413)
        except ValueError:
            return JSONResponse({"detail": "無法讀取上傳大小。"}, status_code=400)
    return await call_next(request)


@app.get("/")
def index():
    return FileResponse(UI_ROOT / "index.html")


@app.post("/api/analyze")
async def analyze(file: UploadFile):
    filename = (file.filename or "audio").replace("\\", "/").split("/")[-1]
    extension = Path(filename).suffix.lower()
    try:
        if extension not in EXTENSIONS:
            raise HTTPException(415, "請選擇 WAV、MP3、FLAC、M4A、OGG、AIFF 或 AAC 音訊。")
        with tempfile.TemporaryDirectory(prefix="tempo-") as folder:
            source = Path(folder) / ("input" + extension)
            size = 0
            with source.open("wb") as stream:
                while chunk := await file.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise HTTPException(413, "檔案超過 100 MB，請選擇較小的音訊。")
                    stream.write(chunk)
            if not size:
                raise HTTPException(400, "檔案是空的，請重新選擇音訊。")
            result = await run_in_threadpool(analyze_file, source, filename)
            midi = result.pop("midi")
            result["download_url"] = None if midi is None else DOWNLOADS.add(midi, Path(filename).stem + "_tempo.mid")
            return result
    except AnalysisError as error:
        raise HTTPException(error.status_code, error.detail) from error
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Audio analysis failed")
        raise HTTPException(500, "分析未完成，請重試或換一個音訊檔。") from error
    finally:
        await file.close()


@app.get("/api/download/{token}")
def download(token: str):
    entry = DOWNLOADS.get(token)
    if entry is None:
        raise HTTPException(404, "下載已過期，請重新分析音訊。")
    content, name = entry
    return Response(content, media_type="audio/midi", headers={
        "Content-Disposition": f"attachment; filename*=UTF-8''{quote(name, safe='')}",
        "Cache-Control": "no-store",
    })

# Keep CORS outermost so validation/error responses are readable by the frontend.
# Published frontends must explicitly list their origin; no wildcard credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("TEMPO_ALLOWED_ORIGINS", "").split(",") if origin.strip()],
    allow_origin_regex=r"https?://(?:localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    expose_headers=["Content-Disposition"],
)
