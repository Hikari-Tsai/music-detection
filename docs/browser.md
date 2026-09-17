# 瀏覽器 ONNX 建置與驗證

以下指令都在 repository 根目錄執行。

## 純前端 ONNX 版本（可放 GitHub Pages）

預設 Browser ONNX 模式將音訊解碼、頻譜計算、Beat This! 推論、拍點處理與 MIDI 產生全部移到瀏覽器，不呼叫 `/api/analyze` 或上傳音訊，模型輸出沿用原本的四分音符假設及固定／平均／變速判定。WebGPU 優先；初始化或推論失敗時重新使用 WASM CPU 分析。CPU 使用單執行緒，不需要 GitHub Pages 無法直接設定的跨來源隔離標頭。

同頁的 Analysis engine 可明確切換 Local Python，此時才將音訊送往本機 `http://127.0.0.1:8765`，並使用該服務產生的 MIDI 下載 URL。切換會重新分析已選音訊，失敗時不保留舊下載或自動改用另一個引擎。重新整理回到 Browser ONNX；語言選擇仍獨立保留。啟動方式與 CORS 設定見 [README](../README.md)。

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

將 `dist/` 的內容放上靜態網站即可。所有資源使用相對路徑，支援 GitHub Pages 的 `/repository-name/` 子路徑。原始 ONNX 與 runtime 二進位檔不必提交 Git：`assets/onnx/`、`dist/` 均由建置產生並已忽略。

GitHub Pages 已附手動部署工作流程 `.github/workflows/pages.yml`。將專案推到自己的 repository 後，在 Settings → Pages 將 Source 設成 GitHub Actions，再手動執行 **Build and deploy browser ONNX app**。流程下載固定版本的 Python 套件、匯出／驗證模型、建置靜態檔案後發布。尚未替你推送或發布至 GitHub，也尚未在 GitHub runner 實跑此工作流程。

瀏覽器會在首次有聲音訊分析時下載約 **82 MB 的 FP32 ONNX 模型**，另需下載 WASM 分析引擎。模型以 SHA-256 驗證，成功後嘗試存入 Cache Storage；快取被瀏覽器清除或不允許儲存時仍可使用，但下次可能重新下載。這不是完整離線 PWA，網頁及 runtime 仍需可載入。

調性使用獨立的 **S-KEY FP32 ONNX（324,536 bytes，約 0.325 MB）**，前處理包含在模型內，共用 ONNX Runtime 的 WASM CPU 引擎。至少 3 秒有聲音訊才執行，全曲一次推論，顯示 24 種大調／小調之一。這是全曲估計，不是和弦或轉調時間軸；原模型分數不是經校準的準確率，因此 UI 不顯示信心百分比。調性模型載入或推論失敗仍保留 BPM 與 MIDI，重新選檔可重試。Tempo MIDI 內容維持速度與拍號。模型來源、匯出及比對見 [S-KEY 驗證](skey.md)。

支援的音訊格式由瀏覽器解碼能力決定；WAV、MP3 最方便，遇到不支援的格式會要求轉檔。仍限制每檔 100 MB、20 分鐘；這是上限，不保證低記憶體手機能處理該長度。分析在 Worker 執行，輸出 MIDI 保留在頁面的 Blob，重新整理或清除音訊後需重新分析。

實作：

- `scripts/export_onnx.py`：opset 17、FP32、動態時間長度；停用 rotary embedding 快取後匯出原模型，驗證 63／128／1264／1500 frames 與 PyTorch 的分數差異。
- `frontend/inference/dsp.js`：22,050 Hz PCM → 1024 點週期 Hann、441 hop、reflect padding、幅度頻譜正規化、128 維 Slaney Log-Mel。窗函數與濾波器直接從 torchaudio 匯出。
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

目前未在實體手機、Safari、Firefox 或 GitHub 線上 Pages 驗證；手機尺寸測試代表排版，不代表實體手機效能。測試音訊也不構成節拍辨識準確率 benchmark。
