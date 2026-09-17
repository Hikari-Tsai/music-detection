# S-KEY 全曲調性分析

本專案使用 [Deezer S-KEY 官方實作](https://github.com/deezer/skey) 與其預訓練權重。相關論文為 [S-KEY: Self-Supervised Learning of Major and Minor Keys from Audio](https://arxiv.org/abs/2501.12907)。Python 與瀏覽器版本都在拖入音訊後自動分析，UI 顯示例如「G 大調」或「A 小調」。這是單一全曲估計，不提供和弦、轉調位置或經校準的準確率。

## 來源與重現

- 官方原始碼版本：`918b83d273568d5041569bb8068843d19a335726`，MIT 授權。
- 官方權重：該版本的 `skey/models/skey.pt`。
- 權重 SHA-256：`78dfd0ad4fa9434bf7cec70a25934b7c575bda9c80e994700140770ad3a5ead4`。
- 匯出模型：`assets/onnx/skey/skey.onnx`，FP32、opset 17、324,536 bytes。
- 此次匯出 SHA-256：`50bac66d5b02868afad07a0b159f08495cc3f5d8492654587e828ed4686412b1`；每次匯出的實際雜湊與比對結果寫入相鄰 `manifest.json`。

官方套件的相依版本與既有 Beat This! 環境不同。因此保留官方 `chromanet.py`、`convnext.py`、`hcqt.py` 三份推論原始碼於 `backend/models/skey/`，僅把 ChromaNet 對 ConvNeXt 的匯入改成相對路徑。保留上游授權，新增 `nnAudio==0.3.3`，不降版既有 PyTorch。此程式不依賴本機 `vendor/skey` checkout。

首次 Python 推論或匯出會下載固定版本權重至 `.cache/skey/` 並驗證 SHA-256。載入使用 `weights_only=True`，只額外允許上游 checkpoint 所需的 NumPy 數值型別。

```sh
uv pip install --python .venv/bin/python -r requirements-onnx.txt
.venv/bin/python scripts/export_skey_onnx.py
npm run build
```

完整首次建置仍需先匯出 Beat This!，見 [README](../README.md)。GitHub Pages 工作流程會匯出兩個模型。

## 推論與 ONNX

輸入為 `[1, samples]` 的 22,050 Hz 單聲道 float32 PCM，輸出為 `[1, 24]`。峰值正規化、原始 VQT／分貝前處理、84-bin 裁切與 ChromaNet 均包含在 ONNX 中，保留原模型 softmax，不再額外套用一次。

類別順序使用 `shared/skey-keys.json`，由 Python 與 JavaScript 共用。官方排列並非從 C 大調開始：前 12 類從 A Major 開始，後 12 類從 B minor 開始；例如 G Major 是索引 10、A minor 是索引 22。

匯出副本將 affine-free LayerNorm 改寫為相同維度的均值／變異數運算，將寬度為 1 的 adaptive average pooling 改為時間軸平均，以支援動態音訊長度。Python 原生推論保留原始算子。匯出腳本比較原模型、改寫副本與 ONNX Runtime，避免只驗證可匯出而沒有驗證等價性。

瀏覽器在既有 Worker 中使用 WASM CPU 執行 S-KEY，共用 Beat This! 的 ONNX Runtime；Beat This! 仍優先使用 WebGPU。兩個模型各自驗證下載、使用可選 Cache Storage、快取 session。S-KEY 全曲一次推論，不將片段分數平均，因此長音訊的記憶體需求會增加；20 分鐘檔案上限不代表所有裝置都能順利完成。

## 結果與失敗處理

| 欄位 | 意義 |
| --- | --- |
| `key` | `{index, label, tonic, mode, score}` 或 `null`；`mode` 為 `major`／`minor`，`score` 是原模型分數 |
| `key_status` | `estimated`、`unavailable` 或 `error` |
| `key_reason` | 成功時 `null`；否則為 `too_short`、`silent` 或 `analysis_failed` |

本 UI 設定調性分析至少 3 秒。過短或無有效聲音時顯示「—」及原因；S-KEY 下載或推論錯誤不阻止 BPM 與 Tempo MIDI，移除後重新選檔即可重試。MIDI 仍只有速度與拍號，不寫入調性事件或音符。

## 實際驗證

以 `samples/choice.ogg` 及其衍生片段執行，瀏覽器使用本機 Chrome。下表比較全部 24 類分數，不只比較最終調名。

| 音訊 | Python／ONNX 結果 | 原生 PyTorch 與 ONNX Runtime CPU 最大差異 | 原生 PyTorch 與瀏覽器 WASM 最大差異 |
| --- | --- | --- | --- |
| 前 3 秒 | A minor | 0.00000054 | 0.00000038 |
| 完整約 25 秒 | G Major | 0.00000095 | 0.00001657 |
| 重複三次約 75 秒 | G Major | 0.00000376 | 0.00006241 |

這些結果驗證移植一致性，不代表音樂調性辨識準確率；片段與全曲得到不同調性也可能發生。

```sh
# export_skey_onnx.py 同時建立測試用 PCM 與原生分數
npm test
npm run test:python
# 先於另一個終端機啟動 npm run serve
npm run test:browser
npm run test:skey-browser
```

測試包含原生調性推論、類別映射、短音訊／靜音、錯誤隔離、前後端 UI、瀏覽器分數比對、S-KEY 下載失敗後保留 Tempo 下載與重試，以及原有固定／變速 MIDI、GPU／CPU、靜態子路徑回歸。桌面與手機尺寸排版均檢查過；Safari、Firefox、實體手機及線上 GitHub Pages 尚未驗證。
