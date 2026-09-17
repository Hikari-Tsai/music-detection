[繁體中文](setup.md) · [English](setup.en.md) · [README](../README.en.md)

# Build, Local Python and deployment guide

Run all commands from the project root. Initial installation and model export require internet access. Browser build commands use a macOS/Linux shell; Windows users can use the hosted ONNX app or follow the PowerShell instructions below for Local Python.

## Build the browser ONNX version

Building from source requires Node.js 22, Python 3.12, uv and Git. Python exports the models; users of the built website do not need Python installed.

```sh
npm ci
uv python install 3.12
test -d .venv || uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements-onnx.txt
.venv/bin/python scripts/export_onnx.py
.venv/bin/python scripts/export_skey_onnx.py
npm run build
npm run serve
```

Open the [browser interface](http://127.0.0.1:8766/) and drop in audio for automatic whole-track analysis. You can also adjust the range and analyze a clip. On subsequent runs, use `npm run serve`; on macOS, you can also double-click `start_frontend.command`.

If `assets/onnx/` already contains both models, manifests and preprocessing data, you can skip Python installation and export. After frontend changes, run `npm run build` to update `dist/`; do not edit generated files directly.

## Local Python (macOS / Windows / Linux)

Local Python is a **FastAPI HTTP service launched by Uvicorn**, running on the same computer as the browser at `http://127.0.0.1:8765`. The frontend communicates with Python over HTTP:

| Request | Purpose |
| --- | --- |
| `POST /api/analyze` | Sends audio in the `file` field of `multipart/form-data`, with `start_seconds` and `end_seconds` for a clip; Python runs the models and returns JSON results and a `download_url` |
| `GET /api/download/{token}` | Downloads the MIDI file at the returned URL, with the `audio/midi` response type |

Audio is sent to FastAPI on this computer and processed by FFmpeg/PyTorch. It is not sent to Hugging Face. The Hugging Face-first/GitHub-fallback workflow applies to Browser ONNX; Python uses its own weight-loading workflow.

Download or clone the complete project and confirm that the root contains `web_app.py` and `requirements.txt`. Use Terminal on macOS/Linux and **PowerShell** on Windows. After installing tools, reopen your terminal, run `cd "path/to/music-detection"` with the actual path, and continue with Python installation and startup from the project root.

### macOS

Install Homebrew using its [official instructions](https://brew.sh/), then install the tools:

```sh
brew install uv ffmpeg git
```

Install Python dependencies once:

```sh
uv python install 3.12
test -d .venv || uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

For subsequent use, double-click `start_ui.command` or run:

```sh
.venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

### Windows 10/11 (PowerShell)

Install the tools with WinGet. If `winget` is unavailable, install or update App Installer using the [Microsoft instructions](https://learn.microsoft.com/windows/package-manager/winget/).

```powershell
winget install --id astral-sh.uv -e
winget install --id Git.Git -e
winget install --id Gyan.FFmpeg -e
```

**Reopen PowerShell** after installation, return to the project root, and run:

```powershell
uv python install 3.12
if (-not (Test-Path .venv)) { uv venv --python 3.12 .venv }
uv pip install --python .\.venv\Scripts\python.exe -r requirements.txt
```

Start the service each time with:

```powershell
.\.venv\Scripts\python.exe -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

These commands use the virtual environment's Python directly. You do not need to run `Activate.ps1` or change PowerShell execution policy. `start_ui.command` is a macOS launcher; use the commands above on Windows.

### Linux (Ubuntu / Debian)

The following commands target Ubuntu/Debian. Install system tools, then use the [official uv installer](https://docs.astral.sh/uv/getting-started/installation/):

```sh
sudo apt update
sudo apt install -y git curl ffmpeg
curl -LsSf https://astral.sh/uv/install.sh | sh
```

On other distributions, install `git`, `curl` and `ffmpeg` using the appropriate package manager. Reopen your terminal, return to the project root, and run:

```sh
uv python install 3.12
test -d .venv || uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

Start the service each time with:

```sh
.venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

All three platforms use Python 3.12. The environment-creation commands preserve an existing `.venv`; check its Python version if one already exists. A `.venv` copied from another operating system cannot be reused directly and must be created on the target system.

### Confirm startup and analyze audio

`Uvicorn running on http://127.0.0.1:8765` means FastAPI is ready. Open the [local service page](http://127.0.0.1:8765/), select **Local Python** under **Analysis engine**, then choose an audio file. Keep the terminal open during analysis. Press `Control + C` when finished to stop the service. The first analysis downloads model weights and requires an internet connection.

The local service page also defaults to ONNX. If you have installed only Python dependencies and have not exported the models or built `dist/`, select Local Python first. To use ONNX on that page, complete the browser build above; the service exposes `dist/` assets under `/runtime/`.

The three-language setup guide in the UI includes expandable macOS, Windows and Linux instructions and opens automatically after a connection failure. The service has been tested on macOS. Windows and Linux setup has not yet been verified end to end on those operating systems.

| Problem | What to do |
| --- | --- |
| Cannot connect | Confirm that FastAPI runs on port 8765 on the same computer and open the local service URL; after startup, remove and add the audio again to retry |
| `ModuleNotFoundError` or missing `.venv` | Complete dependency installation; use `.venv/bin/python` on macOS/Linux or `.\.venv\Scripts\python.exe` on Windows, and confirm that you are in the project root |
| Missing `uv`, `git` or `ffmpeg` | Install the tools using the instructions for your OS, reopen the terminal to reload PATH, and check with `uv --version`, `git --version` and `ffmpeg -version` |
| `Address already in use` | Port 8765 is occupied; use the existing service if appropriate, or stop it with `Control + C` in its terminal before restarting |

## Branches and GitHub Pages deployment

One Pages site serves the frontend from both branches:

| Branch | URL | Purpose |
| --- | --- | --- |
| [`main`](https://github.com/Hikari-Tsai/music-detection/tree/main) | [Production](https://hikari-tsai.github.io/music-detection/) | The production website |
| [`staging`](https://github.com/Hikari-Tsai/music-detection/tree/staging) | [Staging preview](https://hikari-tsai.github.io/music-detection/staging/) | Validate changes before merging into main |

### Automatic deployment

The [Pages workflow](../.github/workflows/pages.yml) runs on pushes to `main` or `staging`. It records both branches' current commits, then checks out each revision, installs dependencies, exports models, runs tests and builds the frontend. If either build fails, that deployment is not published.

The two builds are assembled into one Pages artifact: `main` at the site root and `staging` under `staging/`. Each version keeps its own models, runtime, preprocessing configuration and relative asset paths. Both are deployed together, so updating one branch neither removes the other version nor publishes the staging UI as production.

A shared concurrency group prevents overlapping deployments from overwriting one another. A running workflow is not canceled by a later push. Pending runs can be replaced by newer pushes; the next run resolves both branches' latest commits again. Both branches must retain this dual-version workflow so an older single-version workflow cannot overwrite the whole site.

The sharing preview uses [`frontend/ui/og-image.jpg`](../frontend/ui/og-image.jpg) (1200 × 630), with Open Graph and X/Twitter large-image card tags in the HTML, requiring no JavaScript. The image and sharing copy use English. Actions sets `SITE_URL` for each build branch so main and staging have their own absolute page and image URLs. Local builds default to the production URL; override the `SITE_URL` environment variable when deploying elsewhere.

### Configuration and manual deployment

1. Set **Settings → Pages → Source** to **GitHub Actions**.
2. Allow both `main` and `staging` in the deployment branch rules under **Settings → Environments → github-pages**.
3. Push either branch, or open **Actions → Build and deploy browser ONNX app → Run workflow** and select `main` or `staging`. Manual runs also build and publish both branches without changing their URLs. Other branches do not run this deployment workflow.

The deployment summary lists both URLs. Each version's `deployment.json` records the branch and commit actually published: [production record](https://hikari-tsai.github.io/music-detection/deployment.json) · [staging record](https://hikari-tsai.github.io/music-detection/staging/deployment.json). Staging changes become production content only after they are merged into main.

To use Local Python from the Pages site, start the service on the user's computer and explicitly allow the website's origin. Stop any existing service, then run:

macOS / Linux:

```sh
TEMPO_ALLOWED_ORIGINS=https://YOUR-NAME.github.io .venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

Windows PowerShell:

```powershell
$env:TEMPO_ALLOWED_ORIGINS="https://YOUR-NAME.github.io"
.\.venv\Scripts\python.exe -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

Replace `YOUR-NAME` with the website owner's account. Origins include only the scheme and host, without the repository path; separate multiple origins with commas. Local `localhost`, `127.0.0.1` and `::1` origins are already allowed. Website access to a local service remains subject to browser network policy. If blocked, use the local service page or Browser ONNX. The connection from the hosted Pages site to a local service has not yet been verified.

## Tests and limitations

After installing dependencies and exporting the models as described above, run:

```sh
# Generate comparison fixtures before the first test run or after a model update
.venv/bin/python scripts/prepare_web_fixtures.py
npm test
npm run test:python
npm run format:check

# Run npm run serve in another terminal first; browser tests require Chrome
npm run test:browser
npm run test:skey-browser

# Also start the local Python service for engine switching and cross-origin MIDI tests
npm run test:engines-browser

# Range selection, playback, ONNX/Python clip analysis and MIDI
npm run test:range-browser

# MP4/MOV audio tracks, range analysis and missing-audio errors (also requires FFmpeg)
npm run test:video-browser
```

Tests cover constant/average/variable tempo classification, Python/JavaScript spectrogram and beat comparisons, S-KEY score parity, MIDI encoding, model caching, source fallback, timeouts, corrupt files, download expiry, translations and error recovery. Set `TEST_URL` to override the browser test URL. Append `?engine=wasm` to force the browser CPU path.

Validation coverage as of 2026-09-17:

| Scenario | Result |
| --- | --- |
| Local Chrome, range analysis | Drag/drop and playback passed. Both ONNX and Python returned 68.015 BPM / G major for seconds 5–20, with a roughly 15-second MIDI file. Restoring the whole track returned 68.007 BPM. Three languages and 320/390/1440 px layouts passed |
| Local Chrome, WebGPU / WASM | Constant and variable tempo analysis, MIDI downloads, language switching and error recovery passed |
| Simulated Hugging Face failure locally | Both models downloaded fully from the local fallback and completed analysis; dual-source failure messages and retry by selecting the file again passed |
| Production GitHub Pages, Hugging Face available | Both models downloaded and completed BPM/key analysis and MIDI generation; cache reuse after reload passed |
| Production GitHub Pages, S-KEY primary source unavailable | GitHub Pages fallback download, verification and key analysis passed |
| Production GitHub Pages, Beat This! primary source unavailable | Source switching and progress in all three languages were correct; the full download exceeded that test's 120-second wait limit, so this live end-to-end scenario remains unverified |

The 120 seconds above is a browser test wait limit, separate from the application's 30-second inactivity timeout. Mobile viewport tests verify layout only; Safari, Firefox and physical mobile devices remain unverified.

Models may detect half-time or double-time. Missed beats and timing jitter can appear in the tempo map. Constant/variable classification is derived from model beat times and tolerances, not human annotations of the original music. Each detected beat is treated as a quarter note; an uncertain time signature is omitted.

S-KEY estimates one global major/minor key for the whole track or selected clip. It does not locate key changes or recognize chords, and its score is not a calibrated accuracy probability. Parity tests check that implementations produce similar results; they do not establish that the models correctly identify every piece of music.

