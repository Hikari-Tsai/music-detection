# GAME Small 音高分析 / Pitch analysis

使用 [官方 GAME Small v1.0.3 ONNX](https://github.com/openvpi/GAME/releases/tag/v1.0.3)，FP32、opset 17、五個模型共 51,054,395 bytes。權重及 `config.json` 保留原始位元組，授權為 **CC BY-NC-SA 4.0**；程式碼的 MIT 不替代模型授權。原作者、資料致謝與聲明見 [GAME-NOTICE](../third_party/GAME-NOTICE.md)。

## 兩種執行方式

| 引擎 | 音訊與模型來源 | 推論 |
| --- | --- | --- |
| Browser ONNX | 原檔留在瀏覽器；GAME 單獨解碼為 44,100 Hz 單聲道 | Web Worker / ONNX Runtime Web，優先 WebGPU，失敗改 WASM |
| Local Python | 原檔與選取秒數經 `POST /api/analyze` 傳送至本機；FFmpeg 獨立解碼為 44,100 Hz | Python ONNX Runtime / CPU，讀取 Git 內的同版模型，檢查 SHA-256，快取 session 並加鎖 |

Beat This!／S-KEY 保留既有 22,050 Hz 解碼流程。GAME 從原檔獨立解碼，避免先降採樣後再升採樣，也避免更改既有 BPM／調性輸入。瀏覽器快取兩種取樣率的 PCM，長音訊需要更多記憶體；20 分鐘是檔案上限，不保證所有裝置都能處理。

瀏覽器模型來源固定為：

1. [Hugging Face snapshot](https://huggingface.co/aaatmy/game-small-onnx/tree/ea339353ea4a04b4bf3847e1a192854100778be5)。
2. HTTP／網路錯誤、下載停滯 30 秒或雜湊不符時，切換至 [GitHub snapshot](https://github.com/Hikari-Tsai/music-detection/tree/87b58f6f4d7e4ee90ed6d48d4305876a3f28db2d/assets/models/game/1.0.3-small)。

每個模型的大小及 SHA-256 由建置時內嵌的 [manifest](../assets/models/game/1.0.3-small/manifest.json) 固定，兩個來源必須通過同一組校驗。進度顯示 `GAME / 檔名`、來源、百分比、驗證與備援原因。快取不可用時仍可下載；兩來源都失敗時保留 BPM、調性與 MIDI，音高區顯示失敗，重新分析可重試。

## 推論與顯示

- 每 8 秒分配一個輸出區間，前後各加最多 1 秒上下文，每次模型輸入不超過 10 秒。區間交界只保留其負責的時間，避免重複輸出。
- 使用官方 encoder → dur2bd → segmenter（8 次，`t=i/8`）→ bd2dur → estimator；語言 ID `0`（通用）、邊界與有聲 threshold `0.2`、radius `2`。UI 語言不等於歌曲語言，因此不據此修改模型語言 ID。
- 依 `maskN`、`presence` 篩除填補與無聲音符。檢查數值有效性、MIDI 0–127，排除裁切後短於 80 ms 的片段。無聲區間仍累加時間。
- `scores` 是 MIDI 半音音高，**不是信心分數**。音名以最近的半音標示（C4 = MIDI 60），Hz 以原始浮點音高換算（A4 = 440 Hz）；跨度使用浮點音高差。
- 最高／最低音及時間圖均為模型估計。點擊最高／最低音或圖中音符會跳到原音訊位置試聽；結果使用片段相對時間，UI 加回選取起點。
- API 新增 `pitch_status`（`estimated`／`unavailable`／`error`）、`pitch_reason`、`pitch_engine` 與 `pitch`。有結果時 `pitch` 包含 `lowest`、`highest`、`semitones`、`note_count`、`notes`；每段包含 `start_seconds`、`end_seconds`、`midi`、`note`、`hz`。`note_count` 是通過篩選的片段數，跨分段的長音可能被拆開。
- GAME 失敗與無法判定皆不阻止 Tempo MIDI；MIDI 仍只有速度與拍號，**沒有新增音符 MIDI 匯出**。

## 限制與驗證範圍

GAME 不是主唱分離器。複調伴奏、和聲、樂器、假音與八度誤判均可能影響結果；純樂器也可能產生「有聲」音符。因此這是所選錄音的音高估計，不代表歌手的完整生理音域，也不能保證所有偵測音都來自主唱。篩選最短時長是一項應用程式規則，未以有標註歌聲資料校準。

GAME 的迭代取樣含隨機性，重跑與切換引擎可能改變邊界及極值。既有 Beat This!／S-KEY 的 ONNX 匯出誤差不能套用至 GAME；本專案沒有 GAME PyTorch 對照誤差或人工標註音域準確率。

單元測試涵蓋音高換算、有聲／填補／短音／非有限值篩選、重疊範圍、失敗隔離、API 選取範圍、來源備援與完整性校驗。Chrome 實際模型測試檢查功能與下載路徑；`samples/choice.ogg` 是鼓與貝斯素材，僅作運作回歸測試，不作主唱辨識準確率證據。

## English summary

GAME uses identical official, unquantized FP32 ONNX graphs in the browser and Python. The browser downloads from a pinned Hugging Face revision, falls back to a pinned GitHub copy, verifies every file and optionally caches it. FastAPI uses the tracked local bundle with ONNX Runtime CPU; Beat This! and S-KEY retain PyTorch in Python.

Audio is decoded separately at 44.1 kHz for GAME while retaining the original 22.05 kHz beat/key path. Overlapping inputs are capped at 10 seconds with 8-second output ownership. Voicing/padding masks, finite MIDI values and an 80 ms minimum retained duration filter notes. The UI presents note ranges, frequencies and original-audio preview; Tempo MIDI remains unchanged.

These are recording-specific pitch estimates, not a verified lead-vocal isolation result or the singer's physiological range. Instruments and harmonies can produce false positives, and stochastic sampling can change results. No labeled vocal-range accuracy or GAME PyTorch export-parity benchmark is claimed. Model weights remain **CC BY-NC-SA 4.0**, with upstream attribution and unchanged-file provenance in the linked notice.
