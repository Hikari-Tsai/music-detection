# 瀏覽器 ONNX 建置與驗證

以下指令都在 repository 根目錄執行。

GAME 音高分析的雙引擎流程、來源與限制另見 [GAME 文件](game.md)。以下既有數值比對紀錄主要針對 Beat This!／S-KEY，不代表 GAME 準確率。

## 純前端 ONNX 版本（可放 GitHub Pages）

預設 Browser ONNX 模式將音訊解碼、頻譜計算、Beat This! 推論、拍點處理與 MIDI 產生全部移到瀏覽器，不呼叫 `/api/analyze` 或上傳音訊，模型輸出沿用原本的四分音符假設及固定／平均／變速判定。一般模式 WebGPU 優先；初始化或推論失敗時重新使用 WASM CPU 分析。強化模式另需 WebGPU，詳見下段。CPU 使用單執行緒，不需要 GitHub Pages 無法直接設定的跨來源隔離標頭。

同頁的 Analysis engine 可明確切換 Local Python，此時才將音訊送往本機 `http://127.0.0.1:8765`，並使用該服務產生的 MIDI 下載 URL。切換會分析目前選取範圍，失敗時不保留舊下載或自動改用另一個引擎。重新整理回到 Browser ONNX；語言選擇仍獨立保留。啟動方式與 CORS 設定見 [README](../README.md)。

本機預覽已建好的版本：雙擊 `start_frontend.command`，或執行 `npm run serve`，開啟 <http://127.0.0.1:8766/>。這裡的 Node 只提供靜態檔案，不執行模型；正式部署不需要 Node 或 Python。

重新匯出與建置（Python 只在開發／建置時需要）：

```sh
uv pip install --python .venv/bin/python -r requirements-onnx.txt
npm ci
.venv/bin/python scripts/export_onnx.py
.venv/bin/python scripts/export_skey_onnx.py
npm run build
npm run serve
```

將 `dist/` 的內容放上靜態網站即可。網頁、runtime 與備援模型使用相對路徑，支援 GitHub Pages 的 `/repository-name/` 子路徑；主要模型使用固定版本的 Hugging Face 網址。原始 ONNX 與 runtime 二進位檔不必提交 Git：`assets/onnx/`、`dist/` 均由建置產生並已忽略。

GitHub Pages 使用 `.github/workflows/pages.yml`，推送至 `main` 或 `staging` 都會觸發。每次執行固定兩個分支當下的 commit，分別匯出／驗證模型與建置，再將 `main` 放在網站根目錄、`staging` 放在 `staging/`，合併成一次 Pages 部署。兩份建置都成功才發布；整個工作流程共用 concurrency group，避免部署互相覆蓋。每個版本保留自己的 `models/` 與 `ort/`，前端相對路徑可直接支援子目錄。

正式網址：[Key & Tempo](https://hikari-tsai.github.io/music-detection/)；預覽網址：[Staging](https://hikari-tsai.github.io/music-detection/staging/)。各自的 `deployment.json` 記錄發布分支與 commit。手動執行可選擇 `main` 或 `staging`，兩者都會發布兩個版本；其他分支會略過。Pages 的來源設為 GitHub Actions，`github-pages` environment 須允許這兩個部署分支。完整操作見 [README](../README.md)。

瀏覽器會在一般模式首次有聲音訊分析時下載約 **134 MB 的 FP32 ONNX 模型**（Beat This!、S-KEY 與 GAME），另需下載 WASM 分析引擎。模型與 WASM 以 SHA-256 驗證，成功後嘗試存入 Cache Storage；快取被瀏覽器清除或不允許儲存時仍可使用，但下次可能重新下載。這不是完整離線 PWA，網頁程式及模型設定仍需可載入。

### 選用強化歌聲分析

勾選「強化歌聲分析」才下載與載入額外模型（合計約 568.1 MB／541.8 MiB，不含一般模型與 Runtime）：單一 htdemucs（約 174.3 MB / 166.2 MiB 的社群 ONNX 匯出）→ 釋放分離記憶體 → 官方 GAME Large v1.0.3（約 393.8 MB／375.6 MiB）。一般模式維持 GAME Small。Beat This!／S-KEY 使用原始混音；切換勾選狀態會重跑目前範圍，新檔案仍自動分析全曲。

瀏覽器強化需要 WebGPU；無法使用或強化失敗時會明確提示，不會以 Small 冒充強化結果，也不會自動上傳至 Python。音高失敗保留可用節拍／調性與 Tempo MIDI。分離可能保留和聲或引入失真，不保證提高音域準確率。來源、授權、結果欄位及限制見[強化模式](enhanced.md)。

強化模型優先由 [aaatmy/music-detection-enhanced](https://huggingface.co/aaatmy/music-detection-enhanced) 固定版本提供；瀏覽器備援至 GitHub Pages 共用的 `enhanced-models/v1/`，本機 Python 備援至 [enhanced-models-v1 GitHub Release](https://github.com/Hikari-Tsai/music-detection/releases/tag/enhanced-models-v1)。來源與 SHA-256 設定由共用 JSON 管理。

### 執行引擎下載來源

ONNX Runtime Web 固定為 **1.24.3**。`ort-wasm-simd-threaded.asyncify.wasm` 優先從 [unpkg](https://unpkg.com/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.asyncify.wasm) 下載，失敗時改用同網站的 `./ort/`（正式部署為 GitHub Pages，本機為 Local server）。解壓後約 27.2 MB；實際傳輸量依伺服器壓縮而異。JavaScript 與匹配的 runtime factory 隨應用程式打包，建置時檢查套件版本與 WASM 雜湊，避免版本混用。

執行引擎沿用檔案大小／SHA-256 驗證、30 秒無資料傳輸逾時與 Cache Storage；下載進度獨立顯示來源、百分比、快取及備援原因。即使下載超過 60 秒，只要持續收到資料便會繼續；完整下載並驗證後，才設定 `ort.env.wasm.wasmBinary` 並開始 session 初始化計時。GPU 逾時後建立的新 CPU Worker 可重用已驗證的快取，不需重新下載整份引擎。若瀏覽器禁止快取，重試仍可能再次下載。

### 模型下載來源與備援

`frontend/inference/download-sources.json` 是集中設定來源；`download-sources.js` 僅保留 JavaScript 匯出介面。JSON 管理 Beat This!、S-KEY、GAME、htdemucs 與 ONNX Runtime 的主要／備援下載網址、來源名稱與固定版本。`primaryBaseURL` 為主要來源，`fallbackBaseURL` 為備援；兩者都需保留結尾 `/`。相對備援路徑依建置後的 Worker 位置解析，因此支援 main、staging 與本機服務。修改後需重新建置／部署。Runtime 的版本、檔名、大小與 SHA-256 也在同檔的 `runtime.manifest` 管理，升級時需與 `package.json` 套件版本一致。

模型來源如下：

| 模型 | Hugging Face repository | Revision | 同網站備援目錄 |
| --- | --- | --- | --- |
| Beat This! | [aaatmy/beat-this-onnx](https://huggingface.co/aaatmy/beat-this-onnx) | `e2c0d4376fac8141905a8312c1b327849751d59c` | `./models/` |
| S-KEY | [aaatmy/skey-onnx](https://huggingface.co/aaatmy/skey-onnx) | `c04b6a2bc1d82e50b46d8669560d056f3a2344ab` | `./models/skey/` |
| GAME Small | [aaatmy/game-small-onnx](https://huggingface.co/aaatmy/game-small-onnx) | `ea339353ea4a04b4bf3847e1a192854100778be5` | 固定 Git commit 的 raw.githubusercontent.com 副本 |

Beat This!／S-KEY 先從 Hugging Face 取得 manifest 與必要設定，再使用通過雜湊驗證的快取或下載模型。只有來源失敗才嘗試同網站備援；正式部署即為 GitHub Pages，本機開發顯示 `Local server`。GAME 使用隨程式打包的 manifest，從 Hugging Face 下載各 ONNX 檔，失敗時改用設定檔內固定 Git commit 的 GitHub 副本。

HTTP 錯誤、網路中斷、設定格式錯誤、SHA-256／檔案大小不符，或連續 30 秒沒有收到資料，皆會觸發切換。30 秒是等待回應或下一段資料的上限，不是整個模型的下載期限；持續有進度的慢速下載不會因此中斷。下載提示以英文、日文、繁體中文顯示來源、百分比及驗證狀態，備援期間保留失敗原因。

切換時整組重取 manifest、前處理資料與模型。不同平台重新匯出的 ONNX 位元組與 SHA-256 可能不同，不可用 Hugging Face 的 manifest 驗證 GitHub Pages 的模型。快取沿用同網站 URL 與 `tempo-model-{sha256}` 名稱，既有且符合目前來源版本的快取仍可使用；快取存取失敗不會觸發來源切換。兩來源都失敗時停止該模型載入，重新選檔可從 Hugging Face 重試。

更新模型時須先上傳完整配套檔案，再更新固定 revision；部署仍保留 `dist/models/` 作為備援。

### 調性分析與限制

調性使用獨立的 **S-KEY FP32 ONNX（324,536 bytes，約 0.325 MB）**，前處理包含在模型內，共用 ONNX Runtime 的 WASM CPU 引擎。至少 3 秒有聲音訊才執行，全曲一次推論，顯示 24 種大調／小調之一。這是全曲估計，不是和弦或轉調時間軸；原模型分數不是經校準的準確率，因此 UI 不顯示信心百分比。調性模型載入或推論失敗仍保留 BPM 與 MIDI，重新選檔可重試。MIDI 的 Tempo 軌保存速度與拍號；有可用 GAME 音符時，另加入 Lead Vocal 軌並合併為單一 Type 1 MIDI，無音符時維持 Tempo-only。模型來源、匯出及比對見 [S-KEY 驗證](skey.md)。

支援的音訊格式由瀏覽器解碼能力決定；WAV、MP3 最方便，遇到不支援的格式會要求轉檔。仍限制每檔 100 MB、20 分鐘；這是上限，不保證低記憶體手機能處理該長度。分析在 Worker 執行，輸出 MIDI 保留在頁面的 Blob，重新整理或清除音訊後需重新分析。

實作：

- `scripts/export_onnx.py`：opset 17、FP32、動態時間長度；停用 rotary embedding 快取後匯出原模型，驗證 63／128／1264／1500 frames 與 PyTorch 的分數差異。
- `frontend/inference/dsp.js`：22,050 Hz PCM → 1024 點週期 Hann、441 hop、reflect padding、幅度頻譜正規化、128 維 Slaney Log-Mel。窗函數與濾波器直接從 torchaudio 匯出。
- `frontend/inference/model-assets.js`：依序載入 Hugging Face／同網站配套資源、逾時與驗證、來源進度與可選快取；來源設定在 `download-sources.json` 管理。
- `frontend/inference/worker.js`：1500-frame 分段、6-frame 邊界、keep-first 合併，與官方流程一致；模型分數轉拍點，再生成結果。
- `frontend/inference/key-engine.js`：快取獨立 S-KEY session，22,050 Hz 單聲道 PCM 直接推論，調性失敗隔離；`key.js` 使用共用官方類別表。
- `frontend/inference/tempo.js`：固定／平均／變速判定、純 JavaScript MIDI meta event 編碼。變速圖對齊的是模型拍點，抖動或漏拍也會反映在檔案中。
- `frontend/inference/client.js`：Web Audio 解碼並轉單聲道，傳入 Worker。瀏覽器重採樣與 Python soxr／FFmpeg 並非同一實作，非 22,050 Hz 音訊可能有微小差異。
- `frontend/ui/app.js`：同頁切換兩個引擎，預設瀏覽器模式；分析與下載期間禁止切換，三語提示隨引擎更新。
- `third_party/`：Beat This!、S-KEY、nnAudio、ConvNeXt、ONNX Runtime 與 FFT.js 授權文字，建置時一併附入網站。

驗證：

```sh
.venv/bin/python scripts/prepare_web_fixtures.py
npm test
# 另一個終端機執行 npm run serve；瀏覽器測試使用已安裝的 Chrome
node scripts/test_browser.mjs
npm run test:skey-browser
```

`npm test` 比較真實音訊的 Python／JS 頻譜、拍點後處理、分段邊界及變速 MIDI 二進位。Playwright 測試實際上傳操作（檔案只在瀏覽器內讀取）、GPU／CPU、跨區段長音訊、下載、靜音、損壞檔案、手機排版與無後端請求。可用 `?engine=wasm` 強制 CPU，供重現及相容性排查。

本機驗證結果：JavaScript 核心測試與 Python 回歸測試通過。Chrome 桌面 1440×1050／手機尺寸 390×844、GitHub Pages 子路徑模擬、GPU 初始化失敗自動轉 CPU 均已驗證。25 秒與約 75 秒測試音訊的 GPU／CPU 拍點及小節首拍與 Python 完全一致；JS 頻譜最大誤差約 0.000024。75 秒音訊下載的 MIDI 含 42 個速度事件。瀏覽器執行記錄確認沒有音訊 POST 或 `/api/` 請求。ONNX Runtime 的形狀運算分配至 CPU 提示屬正常訊息；未發現應用程式例外。

下載來源驗證：Chrome 已實際從 Hugging Face 下載兩個模型，完成 BPM／調性分析與 MIDI 產生；來源正常時沒有請求本站備援模型，重新整理後使用雜湊快取。來源切換的單元測試涵蓋 HTTP／設定錯誤、逾時、損壞或不完整模型、不同來源雜湊、快取與失敗重試。

目前未在實體手機、Safari、Firefox 驗證；手機尺寸測試代表排版，不代表實體手機效能。測試音訊也不構成節拍辨識準確率 benchmark。


## 一般模式初始化逾時與 CPU 備援

模型初始化由頁面主執行緒計時，即使推論 Worker 卡住也能終止等待。GPU 每次初始化最多 60 秒，逾時後終止舊 Worker，建立新的 Worker，以瀏覽器 CPU 重新分析同一個檔案與選取範圍。備援原因會保留在下載與分析進度中；這次以及同頁後續分析都使用 CPU，重新整理頁面才會再次嘗試 GPU。不會自動上傳至 Python 或雲端。

CPU 每次初始化最多 120 秒，逾時便終止 Worker、顯示三語錯誤訊息並恢復頁面操作，不再自動重試。Worker 啟動後 30 秒內若未回應，也會結束等待。正常回報的 GPU 初始化／推論錯誤仍沿用既有 WASM 備援。

初始化計時涵蓋 WASM 編譯／引擎初始化與 session 建立，套用於 Beat This!、S-KEY 及 GAME 各個模型；在模型與 WASM 下載完成後才開始。模型與執行引擎下載各自採用 30 秒無資料傳輸逾時，下載失敗會顯示來源錯誤，不誤報 GPU 初始化逾時。音訊解碼、頻譜計算、推論與 session 釋放不受初始化時限限制。`?engine=wasm` 直接使用 CPU，也受 CPU 初始化時限保護。背景分頁或裝置休眠可能延後瀏覽器計時器執行。

## 範圍分析

拖入音訊後解碼、顯示完整波形並自動分析全曲；若使用者調整雙把手或起訖秒數，則需按「分析選取範圍」才分析該片段。`frontend/ui/audio-source.js` 保留完整 PCM 與波形，`range-editor.js` 管理秒數和驗證。範圍最少 1 秒，S-KEY 至少需要 3 秒；修改範圍時清除舊結果與下載。

瀏覽器 client 以選取秒數換算取樣位置，只複製片段送進 Worker，讓模型與 MIDI 使用片段相對時間。Local Python 的 multipart 請求另帶 `start_seconds`、`end_seconds`，後端驗證並裁切解碼後的音訊，再交給各模型；JSON 回傳來源長度與實際選取起訖秒數。前端會拒絕未確認範圍的舊版後端結果。

MIDI 的 0 秒對應選取起點，下載檔名會包含起訖秒數。原檔及完整波形不會被修改，也不會產生裁切音訊下載。範圍功能的實際瀏覽器測試可執行 `npm run test:range-browser`，需要本機靜態伺服器與更新後的 Python 服務。
