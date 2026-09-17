![Key & Tempo 系統架構圖：共用網頁介面、瀏覽器 ONNX 推論與選用的本機 Python 服務](docs/diagrams/key-tempo-system.webp)

# Key & Tempo — 音樂 BPM、調性與 MIDI 速度圖

拖入音訊，即可分析 BPM、拍號與全曲調性，並下載可匯入音樂製作軟體的 MIDI Tempo 檔案。預設直接在瀏覽器執行 ONNX 模型，也能在同一頁切換至本機 Python 服務。

[架構圖原圖](docs/diagrams/key-tempo-system.webp) · [互動架構圖原始檔](docs/diagrams/key-tempo-architecture.html) · [MIT 授權](LICENSE)

## 功能

- **節拍與拍號**：以 Beat This! 偵測拍點、小節首拍，再推算 BPM 與每小節拍數。
- **固定／平均／變速**：固定速度顯示 BPM；確認變速時顯示平均 BPM，並提供逐拍變速 MIDI。資訊不足以確認固定或變速時，顯示平均值。
- **全曲調性**：以 S-KEY 估計 12 個大調與 12 個小調之一，例如 G 大調、A 小調。
- **MIDI 下載**：輸出速度與可判定的拍號，不包含音符、和弦或調性事件。
- **兩種分析引擎**：Browser ONNX 與 Local Python 共用檔案拖放、播放、結果與下載介面。
- **三語介面**：英文、日文、繁體中文共用同一份 HTML，由前端切換；依瀏覽器語言自動選擇，其餘語言使用英文，手動選擇優先並儲存。

支援 WAV、MP3、FLAC、M4A、OGG、AIFF、AAC，單檔上限 100 MiB、20 分鐘。瀏覽器實際可解碼的格式與可處理的長度，仍取決於裝置和記憶體；S-KEY 至少需要 3 秒音訊。

## 系統架構

| 模式 | 處理流程 | 音訊與下載 |
| --- | --- | --- |
| **Browser ONNX（預設）** | Web Audio 解碼為 22,050 Hz 單聲道 → Web Worker 前處理與 ONNX 推論 → BPM、拍號、調性與 MIDI | 音訊留在瀏覽器，MIDI 在前端產生 |
| **Local Python（選用）** | 共用 UI → FastAPI → FFmpeg 解碼 → PyTorch 模型 → 結果與 MIDI API | 音訊送至同一台電腦的服務，暫存音訊在處理後刪除 |

瀏覽器模式的 Beat This! 優先使用 WebGPU，必要時退回 WASM CPU；S-KEY 使用 WASM CPU。模型載入會驗證 SHA-256，並在可用時使用瀏覽器快取。首次載入需要下載模型及執行引擎；純靜態部署不需要持續運行 Python 或 Node.js。

Python 服務固定使用 `http://127.0.0.1:8765`，目前以 CPU 執行模型。MIDI 暫存在服務記憶體中，最多保留一小時、100 筆；服務停止或重新啟動後，原下載即失效。

切換引擎會重新分析已選取的檔案，分析與下載期間會鎖住切換控制。ONNX 失敗不會自動上傳音訊給 Python；每次重新整理仍預設 Browser ONNX。

## 快速開始

以下終端機指令皆在**專案根目錄**執行。macOS 可在終端機輸入 `cd `（含空格），拖入專案資料夾，再按 Enter。首次安裝與匯出需要網路連線下載依賴及模型權重。

### 瀏覽器 ONNX 版

從原始碼首次建置，需要 Node.js 22、Python 3.12、uv 與 Git。Python 用於匯出模型；建置完成後，使用網頁的人不必安裝 Python。

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

開啟 [瀏覽器版介面](http://127.0.0.1:8766/)，直接拖入音訊即可分析。之後只需執行 `npm run serve`，macOS 也可雙擊 `start_frontend.command`。

若已具備 `assets/onnx/` 中的兩個模型、manifest 與前處理資料，可跳過 Python 安裝及匯出步驟。修改前端後執行 `npm run build` 更新 `dist/`；不要直接修改建置產物。

### Local Python 版（macOS）

先取得完整專案原始碼，確認根目錄包含 `web_app.py` 與 `requirements.txt`。若尚未安裝工具，先依 [Homebrew 官方說明](https://brew.sh/) 安裝 Homebrew，再執行：

```sh
brew install uv ffmpeg git
uv python install 3.12
test -d .venv || uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

上述指令保留既有 `.venv`；現有環境應使用 Python 3.12。安裝完成後，每次使用只需雙擊 `start_ui.command`，或執行：

```sh
.venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

看到 `Uvicorn running on http://127.0.0.1:8765` 代表服務已啟動。開啟 [本機服務介面](http://127.0.0.1:8765/)，將 **Analysis engine** 切換為 **Local Python**，再選取音訊。分析期間保持終端機開啟；使用完畢可按 `Control + C` 停止服務。首次分析會下載模型權重，可能需要較長時間。

本機服務頁面同樣預設 ONNX；若只安裝 Python 依賴、尚未匯出模型及建立 `dist/`，請先選擇 Local Python。若要在此頁使用 ONNX，須完成前一節建置，服務會從 `/runtime/` 提供 `dist/` 資源。

選擇 Local Python 後，頁面會提供三語啟動教學；連線失敗時自動展開。常見問題如下：

| 狀況 | 處理方式 |
| --- | --- |
| 無法連線 | 確認服務在瀏覽器所在的同一台電腦執行，並開啟本機服務網址檢查；服務啟動後移除音訊再加入重試 |
| `ModuleNotFoundError` 或找不到 `.venv` | 完成依賴安裝，使用 `.venv/bin/python` 啟動；確認目前位於專案根目錄 |
| 找不到 FFmpeg | 執行 `brew install ffmpeg`，再以 `ffmpeg -version` 確認 |
| `Address already in use` | 8765 已被使用；若是既有服務可直接使用，或在原終端機停止後重啟 |

## GitHub Pages 靜態部署

儲存庫已包含手動觸發的 [GitHub Actions 工作流程](.github/workflows/pages.yml)，會安裝依賴、匯出兩個 ONNX 模型、執行工作流程內的檢查，再建置與部署 `dist/`。

1. 在儲存庫 **Settings → Pages** 將來源設為 **GitHub Actions**。
2. 到 **Actions** 選擇 `Build and deploy browser ONNX app`，執行 **Run workflow**。
3. 部署完成後使用工作流程顯示的 Pages 網址。

若從 Pages 網站使用 Local Python，仍須在使用者電腦上啟動服務，並明確允許網站來源。先停止既有服務，再執行：

```sh
TEMPO_ALLOWED_ORIGINS=https://YOUR-NAME.github.io .venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

請將 `YOUR-NAME` 換成網站帳號；來源只含協定與網域，不加儲存庫路徑，多個來源以逗號分隔。本機 `localhost`、`127.0.0.1`、`::1` 來源已允許。網站存取本機服務仍受瀏覽器網路政策限制；若受阻，可改用本機服務頁面或 Browser ONNX。線上 Pages 與其本機服務連線情境尚未驗證。

## PR-Agent 自動審查

[PR Agent 工作流程](.github/workflows/pr-agent.yml) 使用 [官方開源 GitHub Action](https://docs.pr-agent.ai/installation/github/)，在同一儲存庫的 PR 建立、重新開啟、轉為可審查或推送新提交時，自動以繁體中文產生 review。草稿、機器人事件與 fork PR 的自動審查會略過。

首次啟用請至儲存庫 **Settings → Secrets and variables → Actions → New repository secret**，新增 `OPENAI_KEY`，填入可使用所選模型的 OpenAI API 金鑰。`GITHUB_TOKEN` 由 GitHub 自動提供，不必自行建立。預設模型為 `gpt-5.6`；如需變更，可在同頁的 **Variables** 新增 `PR_AGENT_MODEL`。未設定金鑰時，工作流程會明確提示缺少設定，不會執行模型審查。

PR-Agent 會將 PR 的程式碼差異與相關內容送至模型 API，使用 API 配額；這是開發階段的程式碼審查，與網站在裝置上分析音訊的流程分開。

儲存庫擁有者、成員與協作者也可在 PR 一般留言區單獨輸入下列指令（整則留言僅包含該指令）：

| 指令 | 功能 |
| --- | --- |
| `/review` | 重新審查 PR |
| `/describe` | 產生或更新 PR 說明 |
| `/improve` | 提供程式碼改善建議 |

自動流程只執行 review；PR 說明與改善建議由上述留言指令觸發。工作流程不 checkout 或執行 PR 程式碼，僅透過 GitHub API 讀取內容並發表結果。Action 原始碼固定於 v0.45.0 對應提交；其上游 Dockerfile 使用可更新的 `github_action` 映像標籤，容器內容並未鎖定 digest。

設定 Secret 後，建立一個非草稿 PR，或在既有 PR 留言 `/review`，即可驗證實際模型回覆；可於 **Actions → PR Agent** 查看執行結果。此工作流程不是功能測試，不應取代前後端測試。

## 檔案結構

```text
music-detection/
├── frontend/
│   ├── ui/
│   │   ├── index.html            # 兩種引擎共用的三語頁面
│   │   ├── app.js                # 檔案、播放、分析狀態與 MIDI 下載
│   │   ├── engine.js             # Browser ONNX／Local Python 介接
│   │   ├── messages.js           # 英文、日文、繁體中文翻譯
│   │   ├── i18n-core.js          # 語言偵測、訊息與參數處理
│   │   ├── i18n.js               # 畫面翻譯更新與語言偏好
│   │   ├── style.css             # 介面與手機版樣式
│   │   └── banner.js / banner.css # Banner 動態效果
│   └── inference/
│       ├── client.js             # 瀏覽器音訊解碼與 Worker 通訊
│       ├── worker.js             # Beat This! 推論與分析流程
│       ├── dsp.js                # 頻譜前處理與拍點後處理
│       ├── model-assets.js       # 模型下載、雜湊驗證與快取
│       ├── key-engine.js / key.js # S-KEY 推論與類別解讀
│       └── tempo.js              # BPM 判定與 MIDI 二進位編碼
├── backend/
│   ├── app.py                    # FastAPI 路由、上傳驗證與跨來源設定
│   ├── analysis.py               # FFmpeg 解碼與 Beat This! 分析
│   ├── tempo.py                  # Python BPM 判定與 MIDI 編碼
│   ├── key_analysis.py           # S-KEY 全曲調性分析與錯誤隔離
│   ├── skey_model.py             # 固定版本權重下載、驗證與載入
│   ├── models/skey/              # 保留上游授權的 S-KEY 推論原始碼
│   ├── downloads.py              # 有容量與期限的 MIDI 記憶體快取
│   ├── config.py                 # 路徑、格式、檔案大小與時長限制
│   └── cli.py                    # 命令列分析工具
├── scripts/
│   ├── export_onnx.py            # 匯出 Beat This! 並驗證數值一致性
│   ├── export_skey_onnx.py       # 匯出 S-KEY 並建立比較資料
│   ├── build_frontend.mjs        # 打包程式、模型、執行引擎與授權
│   ├── serve_frontend.mjs        # 本機靜態網站伺服器
│   ├── prepare_web_fixtures.py   # 產生前後端比較用測試資料
│   └── test_*browser.mjs         # 真實模型與瀏覽器流程測試
├── shared/skey-keys.json         # Python／JavaScript 共用的 24 調類別順序
├── tests/js/、tests/python/      # 演算法、API、MIDI、快取與翻譯測試
├── samples/                     # 範例音訊、來源資訊與原始授權聲明
├── third_party/                 # 第三方授權與 ONNX Runtime notices
├── docs/
│   ├── diagrams/                # README 架構圖、互動圖與驗證紀錄
│   ├── architecture.md          # 模組邊界與重構決策
│   ├── browser.md               # ONNX 部署、限制與驗證
│   ├── skey.md                  # S-KEY 來源、匯出與一致性驗證
│   └── experiment.md            # Beat This! 原始實驗紀錄
├── .github/workflows/
│   ├── pages.yml                # GitHub Pages 建置與部署
│   └── pr-agent.yml             # PR 自動審查與成員留言指令
├── web_app.py                   # Python 網頁服務的相容入口
├── run_beat_this.py              # Beat This! 命令列相容入口
├── convert_tempo.py              # MIDI Tempo 轉換相容入口
├── start_ui.command             # macOS：啟動 Python 服務
├── start_frontend.command       # macOS：啟動靜態前端
├── requirements.txt             # Python 執行依賴
├── requirements-onnx.txt        # 額外的 ONNX 匯出與驗證依賴
├── requirements-frozen.txt      # 初次 Python 環境版本快照
├── package.json / package-lock.json # 前端依賴、版本鎖定與工作指令
└── LICENSE                     # 本專案 MIT 授權
```

以下為本機依賴或可再生資料，已由 `.gitignore` 排除，不隨原始碼提交：

| 目錄 | 用途 |
| --- | --- |
| `assets/onnx/` | 匯出的 ONNX 模型、前處理常數與 manifest；建置時複製至 `dist/models/` |
| `dist/` | 完整可部署的靜態網站 |
| `.cache/` | Python 模型權重及跨語言比較資料 |
| `results/` | 命令列分析輸出、MIDI 與節拍試聽音訊 |
| `.venv/`、`node_modules/`、`vendor/` | 本機執行依賴與上游原始碼工作副本 |

修改功能時，UI 放在 `frontend/ui/`，瀏覽器推論放在 `frontend/inference/`，Python 分析放在 `backend/`。BPM 與 MIDI 邏輯需維持兩種語言的一致性。新增介面文字請集中於 `messages.js`，靜態文字使用 `data-i18n`，動態文字使用 `setText`。

## 測試與限制

完成前述環境安裝與模型匯出後，執行：

```sh
# 首次測試或模型更新時建立比較資料
.venv/bin/python scripts/prepare_web_fixtures.py
npm test
npm run test:python
npm run format:check

# 先在另一個終端機執行 npm run serve；瀏覽器測試需要 Chrome
npm run test:browser
npm run test:skey-browser

# 另需啟動本機 Python 服務，驗證引擎切換與跨來源 MIDI 下載
npm run test:engines-browser
```

測試包含固定／平均／變速判定、Python 與 JavaScript 頻譜及拍點比較、S-KEY 分數一致性、MIDI 編碼、模型快取、下載到期、三語介面與錯誤復原。`TEST_URL` 可指定瀏覽器測試網址；網址附加 `?engine=wasm` 可強制瀏覽器使用 CPU。

目前已在本機 Chrome 驗證。手機尺寸測試僅代表排版，Safari、Firefox、實體手機與線上 GitHub Pages 仍待驗證。模型可能判成半速／倍速，漏拍與抖動也會反映在速度圖中；固定或變速是依模型拍點及容差推算，並非原始樂曲的人工標註。每個拍點按四分音符解讀，拍號無法可靠判定時不強行填入。

S-KEY 提供單一全曲大調／小調估計，不定位轉調或辨識和弦；其分數不是經校準的準確率。移植一致性測試驗證的是實作結果相近，不代表模型對所有音樂都能正確辨識。

## 致謝與引用

感謝以下研究作者與開源維護者提供模型、工具及實作。本專案整合其成果，加入瀏覽器 ONNX 推論、雙引擎介面、BPM 判定與 MIDI 匯出流程。

### 模型與相關論文

1. **Beat This!** — Francesco Foscarin、Jan Schlüter、Gerhard Widmer，*Beat this! Accurate beat tracking without DBN postprocessing*，ISMIR 2024。[論文](https://arxiv.org/abs/2407.21658) · [官方程式與模型](https://github.com/CPJKU/beat_this)。本專案使用 `final0`，依賴固定於 `b95c8ab0c58c2d9fcfd40508ae8dffbc05ac4f5c`。
2. **S-KEY** — Yuexuan Kong、Gabriel Meseguer-Brocal、Vincent Lostanlen、Mathieu Lagrange、Romain Hennequin，*S-KEY: Self-supervised Learning of Major and Minor Keys from Audio*，ICASSP 2025。[論文](https://arxiv.org/abs/2501.12907) · [官方程式與模型](https://github.com/deezer/skey)。本專案使用 `918b83d273568d5041569bb8068843d19a335726` 版本的推論程式與權重，詳細處理見 [S-KEY 文件](docs/skey.md)。
3. **nnAudio** — K. W. Cheuk 等人，*nnAudio: An on-the-Fly GPU Audio to Spectrogram Conversion Toolbox Using 1D Convolutional Neural Networks*，IEEE Access，2020。[論文 DOI](https://doi.org/10.1109/ACCESS.2020.3019084) · [官方程式](https://github.com/KinWaiCheuk/nnAudio)。用於 S-KEY 的頻譜前處理。
4. **ConvNeXt** — Zhuang Liu 等人，*A ConvNet for the 2020s*，CVPR 2022。[論文](https://arxiv.org/abs/2201.03545) · [官方程式](https://github.com/facebookresearch/ConvNeXt)。S-KEY 所含的 ConvNeXt 實作註明源自 Meta FAIR，本專案保留相應授權。

### 使用的套件與工具

| 套件／工具 | 在本專案中的用途 |
| --- | --- |
| [ONNX](https://github.com/onnx/onnx)、[ONNX Runtime／Web](https://github.com/microsoft/onnxruntime) | 模型交換格式、Python 匯出驗證、瀏覽器 WebGPU／WASM 推論 |
| [PyTorch](https://github.com/pytorch/pytorch)、[TorchAudio](https://github.com/pytorch/audio) | 原生模型執行、音訊特徵與模型匯出 |
| [NumPy](https://github.com/numpy/numpy)、[SoundFile](https://github.com/bastibe/python-soundfile) | 數值運算與音訊讀寫 |
| [FFmpeg](https://ffmpeg.org/) | Python 服務的音訊解碼、轉單聲道及重取樣 |
| [fft.js](https://github.com/indutny/fft.js) | 瀏覽器 FFT 與頻譜計算 |
| [Mido](https://github.com/mido/mido) | Python MIDI 檔案建立與事件編碼 |
| [FastAPI](https://github.com/fastapi/fastapi)、[Uvicorn](https://github.com/encode/uvicorn)、[python-multipart](https://github.com/Kludex/python-multipart) | 本機 HTTP 服務及音訊上傳 |
| [HTTPX](https://github.com/encode/httpx)、[tqdm](https://github.com/tqdm/tqdm) | API 測試與命令列進度顯示 |
| [esbuild](https://github.com/evanw/esbuild)、[Prettier](https://github.com/prettier/prettier)、[Playwright](https://github.com/microsoft/playwright) | 前端打包、程式格式與瀏覽器驗證 |
| [uv](https://github.com/astral-sh/uv)、[Node.js](https://nodejs.org/)、[npm](https://github.com/npm/cli) | Python 環境、前端依賴與開發工作流程 |

直接依賴與版本以 [package.json](package.json)、[package-lock.json](package-lock.json)、[requirements.txt](requirements.txt) 及 [requirements-onnx.txt](requirements-onnx.txt) 為準；上表不逐項展開間接依賴。

範例 `samples/choice.ogg` 來自 librosa 範例音訊，原作為 Admiral Bob feat. Snowflake 的 **Choice**，鼓與貝斯節錄由 Brian McFee 處理。感謝原作者與整理者；來源、檔案雜湊及原始授權聲明保留於 [source.json](samples/source.json) 與 [choice.txt](samples/choice.txt)。此範例未附經驗證的拍點標準答案。

## 授權

本專案原創程式碼採用 **MIT License**，Copyright © 2026 Hikari Tsai。完整條款見 [LICENSE](LICENSE)；套件中繼資料同樣標示為 MIT，靜態建置會附上此授權檔。

第三方程式、模型權重與範例音訊保留各自的授權，並不因本專案採 MIT 而改變。[third_party/](third_party/) 保存隨附元件的授權與 notices，建置時複製至 `dist/licenses/`。S-KEY 原始碼的授權亦保留於 [backend/models/skey/LICENSE](backend/models/skey/LICENSE)。

範例音訊的原始聲明包含 **Creative Commons Attribution Noncommercial** 條件，並非 MIT；使用或散布時請依 [原始聲明](samples/choice.txt) 處理。
