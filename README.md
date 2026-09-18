[繁體中文](README.md) · [English](README.en.md)

![Key & Tempo 系統架構圖：共用網頁介面、瀏覽器 ONNX 推論與選用的本機 Python 服務](docs/diagrams/key-tempo-system.webp)

# Key & Tempo

在自己的裝置上分析音樂的 BPM、拍號與調性，並下載 MIDI Tempo 檔案。預設使用瀏覽器 ONNX，也可切換至本機 Python。

[![Main 正式版](docs/buttons/main.svg)](https://hikari-tsai.github.io/music-detection/)
[![Staging 預覽版](docs/buttons/staging.svg)](https://hikari-tsai.github.io/music-detection/staging/)

Main 適合日常使用；Staging 提供尚未合併至 main 的變更。

## 功能

- 拖入檔案，自動分析整首音樂的 BPM、拍號與調性。
- 選取、試聽指定片段，再分析該範圍；不修改原始檔案。
- 固定速度輸出單一 Tempo；確認變速時顯示平均 BPM，並匯出變速 MIDI。
- Browser ONNX 與 Local Python 共用介面。
- 支援英文、日文、繁體中文，依瀏覽器語言自動切換。

支援 **WAV、MP3、FLAC、M4A、OGG、AIFF、AAC、MP4、MOV**，單檔上限 **100 MiB、20 分鐘**。MP4／MOV 僅分析音軌，瀏覽器能否解碼取決於內部編碼；遇到不支援的格式，可切換 Local Python。

## 開始使用

1. 開啟 [Main 正式版](https://hikari-tsai.github.io/music-detection/) 或 [Staging 預覽版](https://hikari-tsai.github.io/music-detection/staging/)，維持預設的 **Browser ONNX**。
2. 拖入檔案，自動分析全曲；首次使用需下載模型。
3. 若只分析片段，調整範圍並按「分析選取範圍」。
4. 查看結果，下載 MIDI Tempo 檔案。

瀏覽器模式不需安裝 Python，也不會上傳音訊。模型優先從 Hugging Face 下載，失敗才使用 GitHub Pages 備援，驗證後會嘗試快取。

選取片段至少 1 秒，調性分析至少 3 秒。MIDI 的 0 秒對應片段起點；若放回原曲，請對齊所選起點。MIDI 僅包含速度與可判定的拍號，不包含音符或和弦。

## 兩種分析方式

| 引擎 | 執行位置 | 適合情境 |
| --- | --- | --- |
| **Browser ONNX（預設）** | 瀏覽器 Web Worker，使用 WebGPU／WASM | 直接線上使用，音訊留在瀏覽器 |
| **Local Python** | 本機 FastAPI、FFmpeg 與 PyTorch | 使用 Python 推論或處理瀏覽器無法解碼的音軌 |

Local Python 透過 `POST /api/analyze` 接收原檔與選取範圍，回傳結果及 MIDI 下載網址。音訊只送往同一台電腦的服務。

### 啟動 Local Python

先依 [macOS／Windows／Linux 安裝指南](docs/setup.md) 安裝 Python 3.12、uv、FFmpeg 及專案依賴，再於專案根目錄啟動：

macOS／Linux：

```sh
.venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

Windows PowerShell：

```powershell
.\.venv\Scripts\python.exe -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

開啟 [本機介面](http://127.0.0.1:8765/)，切換為 **Local Python**。首次分析會下載權重；使用期間保持終端機開啟。從 GitHub Pages 連線時的設定與疑難排解也收錄於安裝指南。

## 開發與文件

[建置、安裝、部署與測試指南](docs/setup.md) · [Browser ONNX](docs/browser.md) · [S-KEY](docs/skey.md) · [互動架構圖](docs/diagrams/key-tempo-architecture.html)

```text
frontend/ui/         共用介面、語言切換與範圍選取
frontend/inference/  ONNX 推論、模型下載與 MIDI 產生
backend/             FastAPI、PyTorch 分析與 MIDI API
scripts/             模型匯出、前端建置與瀏覽器測試
shared/              共用調性類別
samples/             範例音訊、來源與授權
tests/              JavaScript 與 Python 測試
docs/               技術文件與架構圖
third_party/         第三方授權聲明
```

GitHub Actions 同時部署 `main` 至網站根目錄、`staging` 至 `/staging/`。自行建置與 Pages 設定請見上述指南。

另保留 [GAME Small v1.0.3 ONNX 副本](assets/models/game/1.0.3-small/)（[Hugging Face](https://huggingface.co/aaatmy/game-small-onnx)），含來源與校驗碼。模型採 **CC BY-NC-SA 4.0**，尚未接入網站分析功能。

## 已知限制

- 模型可能出現半速／倍速、漏拍或調性誤判；S-KEY 只提供所選範圍的單一調性，不定位轉調。
- ONNX 與 PyTorch 的比對是轉換一致性測試，並非大量歌曲的辨識準確率評測。
- 瀏覽器解碼與可處理長度取決於裝置；Safari、Firefox、實體手機及 Windows／Linux 本機服務仍待完整驗證。

問題或建議請至 [GitHub Issues](https://github.com/Hikari-Tsai/music-detection/issues) 回報。

## 致謝

本專案使用以下 Repo 的程式碼與模型資源，感謝作者與維護者的分享：

- [CPJKU/beat_this](https://github.com/CPJKU/beat_this)：節拍與小節首拍偵測。相關論文：[Beat this!](https://arxiv.org/abs/2407.21658)，ISMIR 2024。
- [deezer/skey](https://github.com/deezer/skey)：音樂調性辨識。相關論文：[S-KEY](https://arxiv.org/abs/2501.12907)，ICASSP 2025。

也感謝 ONNX Runtime、PyTorch／TorchAudio、nnAudio、ConvNeXt、FFmpeg、FastAPI、NumPy、SoundFile、fft.js 與 Mido 等開源工具。完整依賴見 [package.json](package.json)、[requirements.txt](requirements.txt) 與 [requirements-onnx.txt](requirements-onnx.txt)。

## 授權

本專案原創程式碼採 [MIT License](LICENSE)，Copyright © 2026 Hikari Tsai。第三方程式、模型與音訊保留各自授權，聲明收錄於 [third_party/](third_party/)。

範例 `samples/choice.ogg` 是 librosa 提供的 **Choice** 鼓與貝斯節錄，原作者為 Admiral Bob feat. Snowflake，由 Brian McFee 整理。其聲明包含 **CC BY-NC（署名、非商業）** 條件，並非 MIT；詳見 [來源紀錄](samples/source.json) 與 [原始授權](samples/choice.txt)。
