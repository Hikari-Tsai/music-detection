# Beat This! 原始測試紀錄

保留初次研究的樣本、來源與測量數據；指令在 repository 根目錄執行。

## 本次結果（2026-09-17）

- 音訊長度：25.025986 秒，22050 Hz、單聲道。
- 偵測到 29 個拍點、8 個小節第一拍。
- 中位數間隔換算：68.181818 BPM。
- 整段偵測拍點跨度換算：68.016194 BPM；倍速解讀約 136.03 BPM，並非額外模型預測。
- 本機 CPU、4 執行緒的單次推論耗時：0.494460 秒，另計模型快取載入約 0.445566 秒。首次下載／安裝與 Python 匯入耗時不包含在內。
- 官方 CLI 與 Python API 的拍點檔分別存為 `choice_cli.beats` 與 `choice.beats`，供比對。

原始格式前五列：

```text
0.02    1
0.9     2
1.8     3
2.66    4
3.54    1
```

## 重跑

在專案目錄執行：

```sh
.venv/bin/python run_beat_this.py samples/choice.ogg
```

也可以將參數換成自己的 WAV、MP3、FLAC 等檔案路徑。輸出預設寫到 `results/`，可用 `--output-dir` 指定另一個資料夾。

## 原始輸出與衍生數據

### 固定速度與 MIDI tempo 轉換

```sh
.venv/bin/python convert_tempo.py results/choice.json
```

本次輸出 `{"bpm": 68.007, "signature_beats": 4, "tempo_mode": "constant"}`，並寫入 `results/choice_tempo.json` 與 `results/choice_tempo.mid`。MIDI 只包含 tempo 與 time signature 等 meta event，不含音符；第一拍的音訊偏移不會寫成對齊資訊。

固定的判定條件：所有拍點相對於單一等速網格的最大偏差不超過 **30 ms**，且至少有 **2 個完整小節**、每小節拍數完全一致。網格用全部拍點的線性回歸估計，與前面的中位數／首尾跨度算法不同。此容差是針對模型 20 ms 時間格點選用的啟發式設定，不是對原曲絕對恆速的證明。

固定判定未通過時，畫面改用 `平均 BPM = 60 × (拍點數 − 1) / (最後拍點 − 第一拍點)`；這不是逐拍 BPM 的算術平均。

至少五個拍點且相對等速網格偏差超過 30 ms 時，標示 `tempo_mode: "variable"`。MIDI 以相鄰拍點間隔換算微秒／四分音符，在對應的 tick 寫入 `set_tempo`，相同的連續速度事件會合併。每兩個拍點相隔 480 ticks，並保留第一拍在原音訊中的時間偏移（量化到最近 tick）；首拍前與末拍後沿用相鄰間隔的速度。匯入 DAW 時需匯入速度圖，並讓 MIDI 與原音訊使用相同的時間起點。這份速度圖對齊的是模型拍點，偵測抖動或漏拍也會影響結果，不能當成人工標註的真實速度。

若只有拍號不確定，或拍點太少以判定變速，保留 `tempo_mode: "average"`，匯出單一平均速度，不誤標成變速。

若小節首拍不足或各小節拍數不一致，`signature_beats` 為 `null`，MIDI 不寫入 time signature；DAW 可能保留自身的預設拍號，不能把該預設當成辨識結果。只有少於兩個有效拍點、拍點無效或速度超過 MIDI 可表示範圍時，才輸出 `-1` 並移除同名舊 MIDI。

`signature_beats` 是小節拍數。每個偵測拍點按四分音符解讀，因此本次為 `4/4`；分母是明示假設，不是 Beat This! 的辨識結果。維持模型原本的節拍層級，不自動改成倍速。

本次 MIDI 的 `set_tempo` 是 **882266 微秒／四分音符**，`time_signature` 是 `4/4`，兩者都在 tick 0。格式依據：[Mido meta messages](https://mido.readthedocs.io/en/stable/meta_message_types.html)。

驗證：`.venv/bin/python -m unittest discover -s tests/python -p test_convert_tempo.py -v`，涵蓋固定速度、量化誤差、突然變速、漸變速度、變拍號與資訊不足。

### 拍點資料

官方 Python API 回傳 `(beats, downbeats)`，兩者都是以秒為單位的 NumPy 陣列。`beats` 包含所有拍點，`downbeats` 是小節第一拍，屬於 `beats` 的子集合。

官方 `save_beat_tsv` 產生 `.beats` 檔，每列是 `時間（秒）\t拍號`。拍號 `1` 表示小節第一拍；其餘拍號由拍點與小節首拍推算。開頭不足一小節時的拍號也可能是推估結果。

本測試另行計算兩種摘要；它們都不是模型直接輸出的 BPM：

- `median_interval_bpm = 60 / median(diff(beats))`
- `whole_detected_span_bpm = 60 * (拍點數 - 1) / (最後拍點 - 第一拍點)`

第一種對少數異常間隔較穩健，但會受拍點時間量化影響；第二種能平均掉部分量化誤差，但遺漏或多出的拍點、變速都會影響結果。兩者都沒有自動解決半速／倍速歧義。

## 檔案

- `results/choice.beats`：官方格式的拍點輸出。
- `results/choice_cli.beats`：直接執行官方 CLI 的輸出。
- `results/choice.json`：完整 API 陣列、衍生 BPM、模型版本、Git commit、執行時間。
- `results/choice_with_clicks.wav`：在音樂上疊加拍點聲。較高音代表小節第一拍。
- `samples/source.json`：音訊來源與 SHA-256。
- `samples/choice.txt`：來源提供的署名與授權文字，原樣保留。
- `requirements-frozen.txt`：本次環境的套件版本。

推論時間包含讀取音訊、前處理、模型運算與後處理，不包含匯入 Python 套件、模型載入／下載和後續輸出檔案。數字僅代表本機這一次執行。

這是實際推論與格式驗證，音訊沒有人工拍點標註，因此不構成準確率 benchmark；也未查證它是否與模型訓練資料重複。此模型不提供調性辨識。

## 來源

- https://github.com/CPJKU/beat_this
- 測試 commit：`b95c8ab0c58c2d9fcfd40508ae8dffbc05ac4f5c`
- https://librosa.org/data/audio/admiralbob77_-_Choice_-_Drum-bass.ogg
- https://librosa.org/data/audio/admiralbob77_-_Choice_-_Drum-bass.txt

使用 Python 3.12 的獨立 `.venv`；官方原始碼位於 `vendor/beat_this`，模型快取位於 `.cache/torch`。上述三個目錄已在 `.gitignore` 排除。
