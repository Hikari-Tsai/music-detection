[繁體中文](README.md) · [English](README.en.md)

![Key & Tempo system architecture: a shared web UI, browser ONNX inference, and an optional local Python service](docs/diagrams/key-tempo-system.webp)

# Key & Tempo — Music BPM, Key Detection & MIDI Tempo Maps

Drop in audio to analyze the whole track automatically, or select a range to detect its BPM, meter and musical key. Download a MIDI tempo file for your music production software. Models run directly in your browser by default, with an optional local Python engine available on the same page.

[Main — Production](https://hikari-tsai.github.io/music-detection/) · [Staging — Preview](https://hikari-tsai.github.io/music-detection/staging/)

Use Main for everyday use, or Staging to try changes that have not yet been merged into main.

[GitHub repository](https://github.com/Hikari-Tsai/music-detection) · [Architecture image](docs/diagrams/key-tempo-system.webp) · [Interactive architecture diagram](docs/diagrams/key-tempo-architecture.html) · [MIT License](LICENSE)

## Features

- **Beats and meter:** Beat This! detects beats and downbeats, which the app uses to estimate BPM and beats per bar.
- **Constant, average and variable tempo:** Displays BPM for constant tempo. When tempo variation is detected, shows average BPM and exports a tempo map that follows individual beat intervals. When the evidence is insufficient to distinguish constant from variable tempo, reports an average estimate.
- **Range selection:** Uploading starts whole-track analysis and displays the waveform. To analyze a clip, use the two handles on one range bar or enter start/end times, preview the selection, then press **Analyze selected range**. Both engines support this workflow; your original file is unchanged.
- **Whole-track or clip key:** S-KEY estimates one of 12 major and 12 minor keys, such as G major or A minor.
- **MIDI downloads:** Exports tempo and any reliably estimated time signature, without notes, chords or key-signature events.
- **Two analysis engines:** Browser ONNX and Local Python share the same file drop, playback, results and download interface.
- **Three UI languages:** English, Japanese and Traditional Chinese share one HTML file. The browser language selects the initial language, with English as the fallback. Manual choices take priority and are saved.

Supported formats: WAV, MP3, FLAC, M4A, OGG, AIFF, AAC, MP4 and MOV. Files are limited to 100 MiB and 20 minutes. Actual browser decoding support and usable audio length depend on the device and available memory. S-KEY requires at least 3 seconds of audio.

MP4/MOV support analyzes the video's audio track, not its images. MP4 and MOV with AAC audio, and MOV with PCM audio, have been tested in local Chrome. Browser support depends on the audio codec inside the container; an accepted extension does not guarantee decoding. If decoding fails, explicitly switch to Local Python to extract audio with FFmpeg, or export WAV/MP3 first. Videos without an audio track cannot be analyzed. Local Python uses the first audio track; there is no multi-track selector. Video files also count toward the 100 MiB file limit, and audio is limited to 20 minutes.

## System architecture

| Mode | Processing flow | Audio and downloads |
| --- | --- | --- |
| **Browser ONNX (default)** | Web Audio decodes to 22,050 Hz mono → preprocessing and ONNX inference in a Web Worker → BPM, meter, key and MIDI | Audio stays in the browser; MIDI is generated on the frontend |
| **Local Python (optional)** | Shared UI → FastAPI → FFmpeg decoding → PyTorch models → results and MIDI API | Audio goes to a service on the same computer; temporary audio is deleted after processing |

In browser mode, Beat This! tries WebGPU and falls back to WASM CPU when needed; S-KEY uses WASM CPU. The model loader verifies SHA-256 hashes and uses browser caching when available. The first run downloads models and runtime assets. Static hosting does not require a continuously running Python or Node.js service.

The Python service uses `http://127.0.0.1:8765` and currently runs inference on the CPU. MIDI files are held in service memory for up to one hour, with a limit of 100 entries. Stopping or restarting the service invalidates existing downloads.

Switching engines analyzes the current selection. Engine switching is disabled during analysis and downloads. An ONNX failure never triggers an automatic audio upload to Python. Reloading the page resets the engine to Browser ONNX.

## Model downloads, fallback and caching

Browser ONNX downloads both models from Hugging Face first. It switches to the site's fallback assets only if that source fails. Audio stays on the user's device; Hugging Face supplies only models and configuration files.

| Model | Purpose | ONNX file size | Primary source | Production fallback path |
| --- | --- | --- | --- | --- |
| Beat This! `final0` | Beats and downbeats | About 82.1 MB | [aaatmy/beat-this-onnx](https://huggingface.co/aaatmy/beat-this-onnx) | `models/beat-this-final0.onnx` |
| S-KEY | Global major/minor key | About 0.325 MB | [aaatmy/skey-onnx](https://huggingface.co/aaatmy/skey-onnx) | `models/skey/skey.onnx` |

Download URLs are pinned to specific Hugging Face revisions in [model-sources.js](frontend/inference/model-sources.js). The production fallback is GitHub Pages. During local preview, the fallback uses the local server and the progress message identifies it as `Local server`. ONNX Runtime JavaScript and WASM assets are still served by the site, so total first-run traffic exceeds the model sizes above. Python retains its own PyTorch weight download workflow.

### Download progress and failure handling

- Shows the source, download percentage and model verification status in the selected UI language.
- Switches to the fallback after connection failures, HTTP errors, invalid configuration, size mismatches or SHA-256 mismatches, and keeps the reason visible in subsequent progress messages.
- Times out after **30 seconds** without a response or the next chunk of data. This is an inactivity timeout, not a limit on total download duration; a slow download continues as long as data keeps arriving.
- On fallback, fetches that source's manifest, preprocessing configuration and model together. ONNX hashes can differ between export platforms, so files from different source bundles must not be mixed.
- If both sources fail, prompts the user to check the connection and select the file again. If S-KEY fails to load, completed BPM results and the tempo MIDI remain available.

For example, a progress message may explain that Hugging Face is unavailable, identify an HTTP error as the reason, and show the fallback download progressing from GitHub Pages at 42%.

### Caching and subsequent use

After verification, the loader attempts to store model weights in browser Cache Storage, keyed by SHA-256. A valid cached copy can skip the weight download on later runs. If caching is unavailable or the cache is cleared, the weights are downloaded again. Configuration files, the page and runtime assets must still be available, so fully offline use is not guaranteed.

See the [browser ONNX documentation](docs/browser.md) for pinned versions, model updates and implementation details.

## Quick start

### Use the hosted app

1. Open [Main — Production](https://hikari-tsai.github.io/music-detection/) or [Staging — Preview](https://hikari-tsai.github.io/music-detection/staging/) and keep the default **Browser ONNX** engine.
2. Drop in audio to start whole-track analysis automatically. Models are downloaded on the first analysis.
3. To analyze a clip, adjust the two range handles or start/end times, preview the selection, then press **Analyze selected range**.
4. Review BPM, meter and key, then download the constant or variable MIDI tempo file.

Selections must be at least 1 second long. S-KEY needs at least 3 seconds; shorter selections can still attempt BPM analysis. Editing the range clears previous results and downloads to prevent using results from a different selection. Press **Whole track** to restore the complete range.

A clip's MIDI timeline starts at the selection's beginning and preserves the offset to its first detected beat. Align it with the start of the cropped audio. When using the original audio timeline, align it with the selected start time: for a 30–60 second selection, place it at 30 seconds in the original timeline. Download filenames include the selected start and end times. The tool selects an analysis range; it does not export a cropped audio file.

Browser ONNX decodes the whole file and keeps its PCM in memory, then sends only the selected samples to the models. Local Python receives the original file and range through FastAPI, decodes with FFmpeg, and crops before either model runs. Both modes retain the 100 MiB / 20-minute limit on the original file. Update the local Python project and restart FastAPI before using range analysis; the frontend rejects whole-track results from an older service that does not confirm the requested range. If the browser cannot decode the file or determine its duration, Local Python can first analyze the whole track. Once the duration is available, range selection becomes available, although browser playback may remain unsupported.

The hosted app does not require Python or Node.js. The environments below are needed only for development, building the app yourself, or using Local Python.

Run the following commands from the **project root**. On macOS, you can type `cd `, including the space, drag the project folder into Terminal, and press Enter. Initial installation and model export require an internet connection to download dependencies and weights.

### Build the browser ONNX version

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

### Local Python (macOS / Windows / Linux)

Local Python is a **FastAPI HTTP service launched by Uvicorn**, running on the same computer as the browser at `http://127.0.0.1:8765`. The frontend communicates with Python over HTTP:

| Request | Purpose |
| --- | --- |
| `POST /api/analyze` | Sends audio in the `file` field of `multipart/form-data`, with `start_seconds` and `end_seconds` for a clip; Python runs the models and returns JSON results and a `download_url` |
| `GET /api/download/{token}` | Downloads the MIDI file at the returned URL, with the `audio/midi` response type |

Audio is sent to FastAPI on this computer and processed by FFmpeg/PyTorch. It is not sent to Hugging Face. The Hugging Face-first/GitHub-fallback workflow applies to Browser ONNX; Python uses its own weight-loading workflow.

Download or clone the complete project and confirm that the root contains `web_app.py` and `requirements.txt`. Use Terminal on macOS/Linux and **PowerShell** on Windows. After installing tools, reopen your terminal, run `cd "path/to/music-detection"` with the actual path, and continue with Python installation and startup from the project root.

#### macOS

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

#### Windows 10/11 (PowerShell)

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

#### Linux (Ubuntu / Debian)

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

#### Confirm startup and analyze audio

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

The [Pages workflow](.github/workflows/pages.yml) runs on pushes to `main` or `staging`. It records both branches' current commits, then checks out each revision, installs dependencies, exports models, runs tests and builds the frontend. If either build fails, that deployment is not published.

The two builds are assembled into one Pages artifact: `main` at the site root and `staging` under `staging/`. Each version keeps its own models, runtime, preprocessing configuration and relative asset paths. Both are deployed together, so updating one branch neither removes the other version nor publishes the staging UI as production.

A shared concurrency group prevents overlapping deployments from overwriting one another. A running workflow is not canceled by a later push. Pending runs can be replaced by newer pushes; the next run resolves both branches' latest commits again. Both branches must retain this dual-version workflow so an older single-version workflow cannot overwrite the whole site.

The sharing preview uses [`frontend/ui/og-image.jpg`](frontend/ui/og-image.jpg) (1200 × 630), with Open Graph and X/Twitter large-image card tags in the HTML, requiring no JavaScript. The image and sharing copy use English. Actions sets `SITE_URL` for each build branch so main and staging have their own absolute page and image URLs. Local builds default to the production URL; override the `SITE_URL` environment variable when deploying elsewhere.

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

## PR-Agent automated review

The [PR Agent workflow](.github/workflows/pr-agent.yml) uses the [official open-source GitHub Action](https://docs.pr-agent.ai/installation/github/) to generate reviews in Traditional Chinese when a PR in this repository is opened, reopened, marked ready for review, or updated with new commits. Automatic review skips drafts, bot events and fork PRs.

To enable it, open **Settings → Secrets and variables → Actions → New repository secret** and add `OPENAI_KEY` with an API key authorized to use the selected model. GitHub supplies `GITHUB_TOKEN` automatically. The default model is `gpt-5.6`; override it with `PR_AGENT_MODEL` under **Variables** on the same settings page. If the key is missing, the workflow reports the missing configuration without running model review.

PR-Agent sends PR diffs and related content to the model API and consumes API quota. This development-time code review is separate from the website's on-device audio analysis.

Repository owners, members and collaborators can also post one of these commands as a regular PR comment. The entire comment must contain only the command:

| Command | Purpose |
| --- | --- |
| `/review` | Review the PR again |
| `/describe` | Generate or update the PR description |
| `/improve` | Suggest code improvements |

The automatic workflow runs only review; descriptions and improvement suggestions are triggered by the commands above. It does not check out or execute PR code. It reads content and posts results through the GitHub API. The Action source is pinned to the v0.45.0 commit, but its upstream Dockerfile uses the mutable `github_action` image tag rather than a digest.

After configuring the secret, open a non-draft PR or comment `/review` on an existing PR to verify an actual model response. Check the run under **Actions → PR Agent**. This workflow is not a functional test and does not replace frontend or backend tests.

## File structure

```text
music-detection/
├── frontend/
│   ├── ui/
│   │   ├── index.html            # Shared three-language page for both engines
│   │   ├── og-image.jpg          # 1200 × 630 social sharing image
│   │   ├── audio-source.js       # Browser decoding, full waveform and sample slicing
│   │   ├── range-editor.js       # Range handles, time fields and validation
│   │   ├── app.js                # Files, playback, analysis state and MIDI downloads
│   │   ├── engine.js             # Browser ONNX / Local Python adapters
│   │   ├── messages.js           # English, Japanese and Traditional Chinese copy
│   │   ├── i18n-core.js          # Language detection, messages and parameters
│   │   ├── i18n.js               # UI translation updates and language preference
│   │   ├── style.css             # UI and mobile styles
│   │   └── banner.js / banner.css # Animated banner
│   └── inference/
│       ├── client.js             # Browser audio decoding and Worker communication
│       ├── worker.js             # Beat This! inference and analysis flow
│       ├── dsp.js                # Spectrogram preprocessing and beat postprocessing
│       ├── model-assets.js       # Fallback, progress, hash verification and caching
│       ├── model-sources.js      # Pinned Hugging Face download URLs
│       ├── key-engine.js / key.js # S-KEY inference and class interpretation
│       └── tempo.js              # BPM estimation and MIDI binary encoding
├── backend/
│   ├── app.py                    # FastAPI routes, upload validation and CORS
│   ├── analysis.py               # FFmpeg decoding and Beat This! analysis
│   ├── tempo.py                  # Python BPM estimation and MIDI encoding
│   ├── key_analysis.py           # S-KEY global key analysis and error isolation
│   ├── skey_model.py             # Pinned weight download, verification and loading
│   ├── models/skey/              # S-KEY inference source with upstream license
│   ├── downloads.py              # MIDI memory store with capacity and expiry limits
│   ├── config.py                 # Paths, formats, size and duration limits
│   └── cli.py                    # Command-line analysis tool
├── scripts/
│   ├── export_onnx.py            # Beat This! export and numerical parity checks
│   ├── export_skey_onnx.py       # S-KEY export and comparison fixtures
│   ├── build_frontend.mjs        # Bundle code, models, runtimes and licenses
│   ├── serve_frontend.mjs        # Local static server
│   ├── prepare_web_fixtures.py   # Generate frontend/backend comparison fixtures
│   └── test_*browser.mjs         # Real-model and browser workflow tests
├── shared/skey-keys.json         # Shared order of 24 key classes for Python and JS
├── tests/js/, tests/python/      # Algorithm, API, MIDI, cache and translation tests
├── samples/                     # Example audio, provenance and original license
├── third_party/                 # Third-party licenses and ONNX Runtime notices
├── docs/
│   ├── diagrams/                # README diagram, interactive diagram and validation
│   ├── architecture.md          # Module boundaries and refactoring decisions
│   ├── browser.md               # ONNX deployment, limitations and validation
│   ├── skey.md                  # S-KEY sources, export and parity checks
│   └── experiment.md            # Original Beat This! experiment notes
├── .github/workflows/
│   ├── pages.yml                # GitHub Pages build and deployment
│   └── pr-agent.yml             # PR review and collaborator comment commands
├── web_app.py                   # Compatibility entry point for the Python web service
├── run_beat_this.py              # Compatibility entry point for the Beat This! CLI
├── convert_tempo.py              # Compatibility entry point for MIDI tempo conversion
├── start_ui.command             # macOS: start the Python service
├── start_frontend.command       # macOS: start the static frontend
├── requirements.txt             # Python runtime dependencies
├── requirements-onnx.txt         # Additional ONNX export and validation dependencies
├── requirements-frozen.txt       # Snapshot of the initial Python environment
├── package.json / package-lock.json # Frontend dependencies, lockfile and scripts
├── README.md                    # Traditional Chinese documentation
├── README.en.md                 # English documentation
└── LICENSE                      # Project MIT License
```

Local dependencies and generated data below are excluded by `.gitignore` and are not committed with the source:

| Directory | Purpose |
| --- | --- |
| `assets/onnx/` | Exported ONNX models, preprocessing constants and manifests; copied to `dist/models/` during build |
| `dist/` | Complete deployable static website |
| `.cache/` | Python model weights and cross-language comparison fixtures |
| `results/` | CLI analysis output, MIDI and audio with beat previews |
| `.venv/`, `node_modules/`, `vendor/` | Local dependencies and working copies of upstream source |

Place UI changes in `frontend/ui/`, browser inference in `frontend/inference/`, and Python analysis in `backend/`. Keep BPM and MIDI behavior consistent across both languages. Put new UI copy in `messages.js`; use `data-i18n` for static text and `setText` for dynamic text.

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

## Acknowledgments and citations

Thank you to the researchers and open-source maintainers whose models, tools and implementations make this project possible. This project integrates their work with browser ONNX inference, a shared dual-engine UI, tempo classification and MIDI export.

### Models and related papers

1. **Beat This!** — Francesco Foscarin, Jan Schlüter and Gerhard Widmer, *Beat this! Accurate beat tracking without DBN postprocessing*, ISMIR 2024. [Paper](https://arxiv.org/abs/2407.21658) · [Official code and models](https://github.com/CPJKU/beat_this). This project uses `final0`, with the dependency pinned to `b95c8ab0c58c2d9fcfd40508ae8dffbc05ac4f5c`.
2. **S-KEY** — Yuexuan Kong, Gabriel Meseguer-Brocal, Vincent Lostanlen, Mathieu Lagrange and Romain Hennequin, *S-KEY: Self-supervised Learning of Major and Minor Keys from Audio*, ICASSP 2025. [Paper](https://arxiv.org/abs/2501.12907) · [Official code and models](https://github.com/deezer/skey). This project uses inference code and weights from `918b83d273568d5041569bb8068843d19a335726`; see the [S-KEY documentation](docs/skey.md) for details.
3. **nnAudio** — K. W. Cheuk et al., *nnAudio: An on-the-Fly GPU Audio to Spectrogram Conversion Toolbox Using 1D Convolutional Neural Networks*, IEEE Access, 2020. [DOI](https://doi.org/10.1109/ACCESS.2020.3019084) · [Official code](https://github.com/KinWaiCheuk/nnAudio). Used for S-KEY spectrogram preprocessing.
4. **ConvNeXt** — Zhuang Liu et al., *A ConvNet for the 2020s*, CVPR 2022. [Paper](https://arxiv.org/abs/2201.03545) · [Official code](https://github.com/facebookresearch/ConvNeXt). S-KEY's ConvNeXt implementation credits Meta FAIR; this project retains the corresponding license.

### Acknowledgements

This project uses code and model resources from the following two repositories. Thank you to their authors and maintainers for sharing their work:

- [CPJKU/beat_this](https://github.com/CPJKU/beat_this): beat and downbeat detection.
- [deezer/skey](https://github.com/deezer/skey): musical key detection.

### Packages and tools

| Package / tool | Role in this project |
| --- | --- |
| [ONNX](https://github.com/onnx/onnx), [ONNX Runtime / Web](https://github.com/microsoft/onnxruntime) | Model interchange format, Python export validation and browser WebGPU/WASM inference |
| [PyTorch](https://github.com/pytorch/pytorch), [TorchAudio](https://github.com/pytorch/audio) | Native inference, audio features and model export |
| [NumPy](https://github.com/numpy/numpy), [SoundFile](https://github.com/bastibe/python-soundfile) | Numerical operations and audio I/O |
| [FFmpeg](https://ffmpeg.org/) | Audio decoding, mono conversion and resampling in the Python service |
| [fft.js](https://github.com/indutny/fft.js) | Browser FFT and spectrogram computation |
| [Mido](https://github.com/mido/mido) | Python MIDI file creation and event encoding |
| [FastAPI](https://github.com/fastapi/fastapi), [Uvicorn](https://github.com/encode/uvicorn), [python-multipart](https://github.com/Kludex/python-multipart) | Local HTTP service and audio uploads |
| [HTTPX](https://github.com/encode/httpx), [tqdm](https://github.com/tqdm/tqdm) | API tests and CLI progress |
| [esbuild](https://github.com/evanw/esbuild), [Prettier](https://github.com/prettier/prettier), [Playwright](https://github.com/microsoft/playwright) | Frontend bundling, formatting and browser validation |
| [uv](https://github.com/astral-sh/uv), [Node.js](https://nodejs.org/), [npm](https://github.com/npm/cli) | Python environments, frontend dependencies and development workflows |

See [package.json](package.json), [package-lock.json](package-lock.json), [requirements.txt](requirements.txt) and [requirements-onnx.txt](requirements-onnx.txt) for direct dependencies and versions. The table does not enumerate transitive dependencies.

The example `samples/choice.ogg` comes from the librosa example audio collection. The original track is **Choice** by Admiral Bob feat. Snowflake, with the drum-and-bass excerpt prepared by Brian McFee. Thanks to the creators and curators. Provenance, the file hash and the original license notice are retained in [source.json](samples/source.json) and [choice.txt](samples/choice.txt). This example does not include verified ground-truth beat annotations.

## License

Original code in this project is released under the **MIT License**, Copyright © 2026 Hikari Tsai. See [LICENSE](LICENSE) for the full terms. Package metadata also identifies the project as MIT, and static builds include the license file.

Third-party code, model weights and example audio retain their respective licenses; this project's MIT License does not change them. [third_party/](third_party/) contains licenses and notices for bundled components and is copied to `dist/licenses/` during build. The S-KEY source license is also retained in [backend/models/skey/LICENSE](backend/models/skey/LICENSE).

The original example-audio notice includes **Creative Commons Attribution Noncommercial** conditions and is not MIT. Follow the [original notice](samples/choice.txt) when using or distributing it.
