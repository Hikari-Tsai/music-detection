---
license: cc-by-nc-sa-4.0
language:
  - en
  - ja
  - zh
  - yue
tags:
  - onnx
  - music
  - singing-voice
  - pitch-estimation
  - automatic-music-transcription
  - game
---

# GAME Small — official v1.0.3 ONNX mirror

Community mirror maintained by Hikari Tsai (`aaatmy`), not an official openvpi repository.
The five FP32 ONNX graphs and `config.json` are copied **without modification** from
[openvpi/GAME v1.0.3](https://github.com/openvpi/GAME/releases/tag/v1.0.3).
These are the official ONNX exports of the GAME 1.0 Small pretrained weights,
not a newly trained model or a quantized conversion.

- Hugging Face: <https://huggingface.co/aaatmy/game-small-onnx>
- Git mirror: <https://github.com/Hikari-Tsai/music-detection/tree/staging/assets/models/game/1.0.3-small>
- ONNX files: 51,054,395 bytes total (51.1 MB), opset 17.
- Source ZIP: `GAME-1.0.3-small-onnx.zip`, 45,676,364 bytes.
- Source ZIP SHA-256: `00ba0c64115b6b874d9ea4afd3e6cf822abda2a04e52569233b0a044fd40e4e8`.

## Files and usage

| File | Purpose |
| --- | --- |
| `encoder.onnx` | Encode the audio waveform into model features |
| `segmenter.onnx` | Iteratively predict note boundaries |
| `estimator.onnx` | Estimate note pitches and presence scores |
| `dur2bd.onnx` | Convert known durations to boundaries |
| `bd2dur.onnx` | Convert boundaries to durations |
| `config.json` | Model configuration, sample rate and language IDs |
| `manifest.json`, `SHA256SUMS` | Upstream provenance, file sizes and SHA-256 digests |

Use the graphs together as described in the
[versioned upstream ONNX documentation](https://github.com/openvpi/GAME/blob/v1.0.3/ONNX.md).
This is not a Hugging Face Transformers or Diffusers pipeline. It expects a host
implementation of preprocessing, iterative segmentation and result decoding.
The configuration uses 44,100 Hz audio and a 0.01-second time step.

To download the complete bundle:

```sh
hf download aaatmy/game-small-onnx --local-dir ./game-small-onnx
```

For reproducible applications, add `--revision <commit-sha>` to pin the model snapshot.
To check the original assets after download, run `shasum -a 256 -c SHA256SUMS`
inside the downloaded directory (or `sha256sum -c SHA256SUMS` on Linux).

This mirror alone does not enable vocal-range analysis in Key & Tempo.
It makes no accuracy guarantee for lead vocals, harmonies or highest/lowest notes.

## Attribution and license

Model credit belongs to **openvpi/GAME and its contributors**; the official model
release was published by **yqzhishen**. The upstream release credits data labels to
挚彬Club, YQ之神, 小狼 and 幽寂. See the
[original model release](https://github.com/openvpi/GAME/releases/tag/v1.0.0)
for the training sources and acknowledgements.

The **model files are licensed under CC BY-NC-SA 4.0**, as specified in that release.
The full legal text is included in [LICENSE](LICENSE): attribution, noncommercial
use and ShareAlike conditions apply. This mirror adds only documentation and checksums;
the model files and configuration are unchanged. Any future conversion or quantization
must retain the applicable model terms and identify its changes.

The upstream code repository uses MIT, but **its MIT license does not replace the
model weights' CC BY-NC-SA 4.0 license**. Likewise, the MIT license of Key & Tempo's
original application code does not apply to these third-party model files.
The models are provided without warranties under their license; no upstream
endorsement of this mirror is implied.

## 繁體中文

此處託管官方 GAME Small v1.0.3 的原始 FP32 ONNX，共五個模型及設定檔，
總模型大小約 51.1 MB，未進行量化或修改。由 Hikari Tsai 建立社群副本，
並非 openvpi 官方 Hugging Face 帳戶。

模型採 **CC BY-NC-SA 4.0（署名、非商業性、相同方式分享）**，不適用本專案的 MIT。
來源、檔案大小與校驗碼列於 `manifest.json`；本次僅託管模型，尚未接入網站分析流程。
