[繁體中文](README.md) · [English](README.en.md)

![Key & Tempo system architecture: a shared web UI, browser ONNX inference, and an optional local Python service](docs/diagrams/key-tempo-system.webp)

# Key & Tempo

Analyze music BPM, meter, key and estimated vocal range on your own device, then download a MIDI tempo file. Runs in your browser with ONNX by default, with an optional local Python engine.

[![Main — Production](docs/buttons/main.svg)](https://hikari-tsai.github.io/music-detection/)
[![Staging — Preview](docs/buttons/staging.svg)](https://hikari-tsai.github.io/music-detection/staging/)

Use Main for everyday use, or Staging to try changes not yet merged into main.

## Features

- Drop in a file to analyze the whole track's BPM, meter, key and pitch automatically.
- Preview detected beats with a click track; higher clicks mark detected downbeats.
- View GAME's note timeline, lowest/highest notes and range; play/pause synthesized notes, seek on the chart and audition either extreme as a single tone.
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

Browser mode needs no Python installation and does not upload audio. First-use models total about 134 MB, excluding the runtime. Hugging Face is primary; Beat This!/S-KEY fall back to GitHub Pages, while GAME falls back to a pinned GitHub repository copy. Files are SHA-256 verified and cached when possible.

Selections must be at least 1 second; key analysis needs at least 3 seconds. MIDI time zero corresponds to the clip's start, so align it with that position when using the original track. MIDI contains tempo and any reliably estimated meter, without notes or chords.

## Analysis engines

| Engine | Runs in | Best for |
| --- | --- | --- |
| **Browser ONNX (default)** | Browser Web Worker using WebGPU/WASM | Immediate online use, with audio kept in the browser |
| **Local Python** | Local FastAPI, FFmpeg, PyTorch/ONNX Runtime | Python inference or audio codecs the browser cannot decode |

GAME uses the official FP32 ONNX in both engines. Local Python retains PyTorch for Beat This!/S-KEY. Pitch failures preserve tempo/key results and MIDI downloads.

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

Open the [local interface](http://127.0.0.1:8765/) and select **Local Python**. Beat/key weights download on first use; GAME loads the tracked model bundle. Existing installations must reinstall `requirements.txt` (adds `onnxruntime`) and restart FastAPI. Keep the terminal open while using the service. The setup guide also covers connections from GitHub Pages and troubleshooting.

## Development and documentation

[Build, setup, deployment and test guide](docs/setup.en.md) · [Browser ONNX](docs/browser.md) · [S-KEY](docs/skey.md) · [GAME pitch analysis](docs/game.md) · [Interactive architecture diagram](docs/diagrams/key-tempo-architecture.html)

```text
frontend/ui/         Shared UI, languages and range selection
frontend/inference/  ONNX inference, model downloads and MIDI generation
backend/             FastAPI, PyTorch/ONNX Runtime analysis and MIDI API
assets/models/game/  Official GAME Small ONNX, provenance and checksums
scripts/             Model export, frontend builds and browser tests
shared/              Shared key labels
samples/             Example audio, provenance and license
tests/              JavaScript and Python tests
docs/               Technical documentation and diagrams
third_party/         Third-party license notices
```

GitHub Actions deploys `main` at the site root and `staging` under `/staging/` together. See the guide above for building the app and configuring Pages.

The repository also preserves a [GAME Small v1.0.3 ONNX mirror](assets/models/game/1.0.3-small/) ([Hugging Face](https://huggingface.co/aaatmy/game-small-onnx)), with provenance and checksums. The models use **CC BY-NC-SA 4.0** and power pitch analysis in both engines.

## Known limitations

- GAME estimates pitches in this recording/selection, not the singer's entire vocal capability, and does not separate lead vocals. Harmony, instruments, octave errors and random sampling can affect the range. Segments shorter than 80 ms are excluded; this does not guarantee removal of false detections.

- Models may detect half/double tempo, miss beats or misidentify keys. S-KEY estimates one key per selected range and does not locate modulations.
- ONNX/PyTorch comparisons verify conversion consistency, not recognition accuracy across a large music dataset.
- Browser decoding and usable duration depend on the device. Safari, Firefox, physical mobile devices and local services on Windows/Linux still need full verification.

Report problems or suggestions through [GitHub Issues](https://github.com/Hikari-Tsai/music-detection/issues).

## Acknowledgements

This project uses code and model resources from the following repositories. Thank you to their authors and maintainers:

- [CPJKU/beat_this](https://github.com/CPJKU/beat_this): beat and downbeat detection. Related paper: [Beat this!](https://arxiv.org/abs/2407.21658), ISMIR 2024.
- [deezer/skey](https://github.com/deezer/skey): musical key detection. Related paper: [S-KEY](https://arxiv.org/abs/2501.12907), ICASSP 2025.
- [openvpi/GAME](https://github.com/openvpi/GAME): singing-note boundary and pitch estimation. Credit to the GAME contributors and original model publisher yqzhishen; [technical description](https://github.com/openvpi/GAME/blob/v1.0.3/ALGORITHMS.md), [original weights and dataset acknowledgements](https://github.com/openvpi/GAME/releases/tag/v1.0.0). The official v1.0.3 Small ONNX weights/configuration are unchanged; this application adds chunked inference, result filtering and UI.

Thanks also to ONNX Runtime, PyTorch/TorchAudio, nnAudio, ConvNeXt, FFmpeg, FastAPI, NumPy, SoundFile, fft.js and Mido. Full dependencies are listed in [package.json](package.json), [requirements.txt](requirements.txt) and [requirements-onnx.txt](requirements-onnx.txt).

## License

Original project code is released under the [MIT License](LICENSE), Copyright © 2026 Hikari Tsai. Third-party code, models and audio retain their own licenses; notices are included in [third_party/](third_party/).

**GAME weights use [CC BY-NC-SA 4.0](assets/models/game/1.0.3-small/LICENSE)**: attribution and noncommercial use are required, with ShareAlike for shared adaptations. The application's MIT license does not grant commercial rights to those weights. See the [GAME notice](third_party/GAME-NOTICE.md) for provenance and modification details.

The example `samples/choice.ogg` is librosa's drum-and-bass excerpt of **Choice** by Admiral Bob feat. Snowflake, prepared by Brian McFee. Its notice includes **CC BY-NC (Attribution, Noncommercial)** terms and is not MIT. See the [provenance record](samples/source.json) and [original license notice](samples/choice.txt).
