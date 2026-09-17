[繁體中文](README.md) · [English](README.en.md)

![Key & Tempo system architecture: a shared web UI, browser ONNX inference, and an optional local Python service](docs/diagrams/key-tempo-system.webp)

# Key & Tempo

Analyze music BPM, meter and key on your own device, then download a MIDI tempo file. Runs in your browser with ONNX by default, with an optional local Python engine.

[![Main — Production](docs/buttons/main.svg)](https://hikari-tsai.github.io/music-detection/)
[![Staging — Preview](docs/buttons/staging.svg)](https://hikari-tsai.github.io/music-detection/staging/)

Use Main for everyday use, or Staging to try changes not yet merged into main.

## Features

- Drop in a file to analyze the whole track's BPM, meter and key automatically.
- Select and preview a clip, then analyze that range without modifying the original file.
- Export a single tempo for constant timing, or show average BPM and export a variable tempo map when changes are detected.
- Switch between Browser ONNX and Local Python in the same interface.
- English, Japanese and Traditional Chinese, selected automatically from the browser language.

Supports **WAV, MP3, FLAC, M4A, OGG, AIFF, AAC, MP4 and MOV**, up to **100 MiB and 20 minutes** per file. MP4/MOV analysis uses the audio track only. Browser decoding depends on the codec; switch to Local Python for unsupported formats.

## Get started

1. Open [Main — Production](https://hikari-tsai.github.io/music-detection/) or [Staging — Preview](https://hikari-tsai.github.io/music-detection/staging/) and keep **Browser ONNX** selected.
2. Drop in a file for automatic whole-track analysis. The first run downloads the models.
3. To analyze a clip, adjust the range and press **Analyze selected range**.
4. Review the results and download the MIDI tempo file.

Browser mode needs no Python installation and does not upload audio. Models download from Hugging Face first, with GitHub Pages as the fallback, and are cached after verification when possible.

Selections must be at least 1 second; key analysis needs at least 3 seconds. MIDI time zero corresponds to the clip's start, so align it with that position when using the original track. MIDI contains tempo and any reliably estimated meter, without notes or chords.

## Analysis engines

| Engine | Runs in | Best for |
| --- | --- | --- |
| **Browser ONNX (default)** | Browser Web Worker using WebGPU/WASM | Immediate online use, with audio kept in the browser |
| **Local Python** | Local FastAPI, FFmpeg and PyTorch | Python inference or audio codecs the browser cannot decode |

Local Python receives the original file and selected range through `POST /api/analyze`, returning results and a MIDI download URL. Audio is sent only to the service on the same computer.

### Start Local Python

Follow the [macOS / Windows / Linux setup guide](docs/setup.en.md) to install Python 3.12, uv, FFmpeg and project dependencies, then run from the project root:

macOS / Linux:

```sh
.venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

Windows PowerShell:

```powershell
.\.venv\Scripts\python.exe -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

Open the [local interface](http://127.0.0.1:8765/) and select **Local Python**. The first analysis downloads weights; keep the terminal open while using the service. The setup guide also covers connections from GitHub Pages and troubleshooting.

## Development and documentation

[Build, setup, deployment and test guide](docs/setup.en.md) · [Browser ONNX](docs/browser.md) · [S-KEY](docs/skey.md) · [Interactive architecture diagram](docs/diagrams/key-tempo-architecture.html)

```text
frontend/ui/         Shared UI, languages and range selection
frontend/inference/  ONNX inference, model downloads and MIDI generation
backend/             FastAPI, PyTorch analysis and MIDI API
scripts/             Model export, frontend builds and browser tests
shared/              Shared key labels
samples/             Example audio, provenance and license
tests/              JavaScript and Python tests
docs/               Technical documentation and diagrams
third_party/         Third-party license notices
```

GitHub Actions deploys `main` at the site root and `staging` under `/staging/` together. See the guide above for building the app and configuring Pages.

## Known limitations

- Models may detect half/double tempo, miss beats or misidentify keys. S-KEY estimates one key per selected range and does not locate modulations.
- ONNX/PyTorch comparisons verify conversion consistency, not recognition accuracy across a large music dataset.
- Browser decoding and usable duration depend on the device. Safari, Firefox, physical mobile devices and local services on Windows/Linux still need full verification.

Report problems or suggestions through [GitHub Issues](https://github.com/Hikari-Tsai/music-detection/issues).

## Acknowledgements

This project uses code and model resources from the following repositories. Thank you to their authors and maintainers:

- [CPJKU/beat_this](https://github.com/CPJKU/beat_this): beat and downbeat detection. Related paper: [Beat this!](https://arxiv.org/abs/2407.21658), ISMIR 2024.
- [deezer/skey](https://github.com/deezer/skey): musical key detection. Related paper: [S-KEY](https://arxiv.org/abs/2501.12907), ICASSP 2025.

Thanks also to ONNX Runtime, PyTorch/TorchAudio, nnAudio, ConvNeXt, FFmpeg, FastAPI, NumPy, SoundFile, fft.js and Mido. Full dependencies are listed in [package.json](package.json), [requirements.txt](requirements.txt) and [requirements-onnx.txt](requirements-onnx.txt).

## License

Original project code is released under the [MIT License](LICENSE), Copyright © 2026 Hikari Tsai. Third-party code, models and audio retain their own licenses; notices are included in [third_party/](third_party/).

The example `samples/choice.ogg` is librosa's drum-and-bass excerpt of **Choice** by Admiral Bob feat. Snowflake, prepared by Brian McFee. Its notice includes **CC BY-NC (Attribution, Noncommercial)** terms and is not MIT. See the [provenance record](samples/source.json) and [original license notice](samples/choice.txt).
