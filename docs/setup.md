[繁體中文](setup.md) · [English](setup.en.md) · [README](../README.md)

GAME 音高功能需要 `onnxruntime`（已列入 `requirements.txt`），並保留 `assets/models/game/1.0.3-small/` 的模型檔案。舊環境更新後請重新執行依賴安裝並重啟 FastAPI。瀏覽器的 GAME 會從 Hugging Face／GitHub Repo 下載；不需要本機 Python。

# 建置、Local Python 與部署指南

所有指令皆在專案根目錄執行。首次安裝及模型匯出需要網路連線。瀏覽器建置以 macOS／Linux 終端機指令示範；Windows 可先使用線上 ONNX 版，或依下方 PowerShell 教學啟動 Local Python。

## 自行建置瀏覽器 ONNX 版

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

開啟 [瀏覽器版介面](http://127.0.0.1:8766/)，拖入音訊即自動分析全曲，也可調整範圍後按下分析。之後只需執行 `npm run serve`，macOS 也可雙擊 `start_frontend.command`。

若已具備 `assets/onnx/` 中的兩個模型、manifest 與前處理資料，可跳過 Python 安裝及匯出步驟。修改前端後執行 `npm run build` 更新 `dist/`；不要直接修改建置產物。

## Local Python 版（macOS／Windows／Linux）

Local Python 是由 **Uvicorn 啟動的 FastAPI HTTP 服務**，在瀏覽器所在的同一台電腦執行，位址為 `http://127.0.0.1:8765`。前端透過 HTTP API 與 Python 通訊：

| 請求 | 用途 |
| --- | --- |
| `POST /api/analyze` | 以 `multipart/form-data` 的 `file` 欄位傳送音訊，指定片段時另帶 `start_seconds` 與 `end_seconds`；Python 執行模型後回傳 JSON 分析結果與 `download_url` |
| `GET /api/download/{token}` | 依分析結果中的下載網址取得 MIDI，回應類型為 `audio/midi` |

音訊會送往這台電腦上的 FastAPI 服務，由 FFmpeg／PyTorch 處理，不會送至 Hugging Face。Hugging Face 優先下載與 GitHub 備援的流程適用於 Browser ONNX；Python 使用自身的模型權重載入流程。

先下載或 clone 完整專案，確認根目錄包含 `web_app.py` 與 `requirements.txt`。macOS／Linux 使用終端機；Windows 使用 **PowerShell**。工具安裝後請重新開啟終端機，執行 `cd "path/to/music-detection"`（替換成實際路徑）回到專案根目錄，再執行 Python 安裝與啟動指令。

### macOS

先依 [Homebrew 官方說明](https://brew.sh/) 安裝 Homebrew，再安裝工具：

```sh
brew install uv ffmpeg git
```

首次安裝 Python 依賴：

```sh
uv python install 3.12
test -d .venv || uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

之後每次使用只需雙擊 `start_ui.command`，或執行：

```sh
.venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

### Windows 10／11（PowerShell）

使用 WinGet 安裝工具。若找不到 `winget`，請先依 [Microsoft 安裝說明](https://learn.microsoft.com/windows/package-manager/winget/) 安裝或更新 App Installer。

```powershell
winget install --id astral-sh.uv -e
winget install --id Git.Git -e
winget install --id Gyan.FFmpeg -e
```

安裝完成後**重新開啟 PowerShell**，回到專案根目錄，再執行：

```powershell
uv python install 3.12
if (-not (Test-Path .venv)) { uv venv --python 3.12 .venv }
uv pip install --python .\.venv\Scripts\python.exe -r requirements.txt
```

每次啟動服務：

```powershell
.\.venv\Scripts\python.exe -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

這裡直接使用虛擬環境的 Python，不必執行 `Activate.ps1` 或修改 PowerShell 的執行政策。`start_ui.command` 是 macOS 用的啟動檔，Windows 請使用上述指令。

### Linux（Ubuntu／Debian）

以下以 Ubuntu／Debian 為例，先安裝系統工具，再使用 [uv 官方安裝方式](https://docs.astral.sh/uv/getting-started/installation/)：

```sh
sudo apt update
sudo apt install -y git curl ffmpeg
curl -LsSf https://astral.sh/uv/install.sh | sh
```

其他 Linux 發行版請使用對應的套件管理器安裝 `git`、`curl`、`ffmpeg`。完成後重新開啟終端機，回到專案根目錄，再執行：

```sh
uv python install 3.12
test -d .venv || uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

每次啟動服務：

```sh
.venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

三個平台都使用 Python 3.12，建立環境的指令會保留既有 `.venv`。若已有環境，請確認其 Python 版本；從其他作業系統複製來的 `.venv` 無法直接共用，須在目標系統另行建立。

### 確認啟動與使用

看到 `Uvicorn running on http://127.0.0.1:8765` 代表 FastAPI 服務已啟動。開啟 [本機服務介面](http://127.0.0.1:8765/)，將 **Analysis engine** 切換為 **Local Python**，再選取音訊。分析期間保持終端機開啟；使用完畢按 `Control + C` 停止服務。首次分析會下載模型權重，需要網路連線。

本機服務頁面同樣預設 ONNX；若只安裝 Python 依賴、尚未匯出模型及建立 `dist/`，請先選擇 Local Python。若要在此頁使用 ONNX，須完成前一節建置，服務會從 `/runtime/` 提供 `dist/` 資源。

網頁中的三語教學提供可展開的 macOS、Windows 與 Linux 安裝指令，連線失敗時會自動展開教學。本機服務已在 macOS 驗證；Windows 與 Linux 尚未完成對應系統的端到端實測。

| 狀況 | 處理方式 |
| --- | --- |
| 無法連線 | 確認 FastAPI 在同一台電腦的 8765 埠執行，並開啟本機服務網址；服務啟動後移除音訊再加入重試 |
| `ModuleNotFoundError` 或找不到 `.venv` | 完成依賴安裝；macOS／Linux 使用 `.venv/bin/python`，Windows 使用 `.\.venv\Scripts\python.exe`；確認目前位於專案根目錄 |
| 找不到 `uv`、`git` 或 `ffmpeg` | 依作業系統的安裝指令補齊工具，重新開啟終端機以載入 PATH；分別以 `uv --version`、`git --version`、`ffmpeg -version` 確認 |
| `Address already in use` | 8765 已被使用；若是既有服務可直接使用，或在原終端機按 `Control + C` 停止後重啟 |

## 分支與 GitHub Pages 部署

同一個 Pages 網站同時提供兩個分支的前端：

| 分支 | 網址 | 用途 |
| --- | --- | --- |
| [`main`](https://github.com/Hikari-Tsai/music-detection/tree/main) | [正式版](https://hikari-tsai.github.io/music-detection/) | 正式網站版本 |
| [`staging`](https://github.com/Hikari-Tsai/music-detection/tree/staging) | [Staging 預覽版](https://hikari-tsai.github.io/music-detection/staging/) | 驗證尚未合併至 main 的變更 |

### 自動部署流程

[Pages 工作流程](../.github/workflows/pages.yml) 在推送到 `main` 或 `staging` 時自動觸發。開始執行時先記錄兩個分支當下的 commit，再各自 checkout、安裝依賴、匯出模型、測試及建置；任一建置失敗，該次部署就不會發布。

兩份建置結果會合併為同一個 Pages artifact：`main` 放在網站根目錄，`staging` 放在 `staging/`。每個版本保留自己的模型、runtime、前處理設定與相對路徑，避免跨分支混用檔案。部署會同時發布兩份內容，因此更新其中一個分支不會移除另一個版本，也不會把 staging 的 UI 當成正式版發布。

工作流程以同一個 concurrency group 排程，避免兩次部署互相覆蓋。執行中的工作不會因後續推送而取消；等候中的工作可能被更新的推送取代，下一次執行會重新取得兩個分支的最新 commit。兩個分支都須保留此雙版本部署工作流程，避免舊的單版本工作流程重新覆蓋整站。

分享預覽使用 [`frontend/ui/og-image.jpg`](../frontend/ui/og-image.jpg)（1200 × 630），並在 HTML 中提供 Open Graph 與 X／Twitter 大圖卡片標籤，不需要執行 JavaScript。圖片與分享文案統一使用英文。Actions 依建置分支設定 `SITE_URL`，讓 main 與 staging 各自使用正確的頁面與圖片絕對網址；本機建置預設正式站網址，部署至其他網址時可透過 `SITE_URL` 環境變數覆寫。

### 設定與手動部署

1. 在 **Settings → Pages** 將來源設為 **GitHub Actions**。
2. 在 **Settings → Environments → github-pages** 的部署分支規則中允許 `main` 與 `staging`。
3. 推送任一分支，或到 **Actions → Build and deploy browser ONNX app → Run workflow**，選擇 `main` 或 `staging` 手動觸發。手動執行也會建置並發布兩個分支，不會改變兩個版本的網址。其他分支不執行此部署流程。

Actions 的部署摘要會列出兩個網址。各版本的 `deployment.json` 記錄實際發布的分支與 commit，可用來確認目前站上版本：[正式版紀錄](https://hikari-tsai.github.io/music-detection/deployment.json) · [Staging 紀錄](https://hikari-tsai.github.io/music-detection/staging/deployment.json)。將 staging 變更合併至 main 後，才會成為正式版內容。

若從 Pages 網站使用 Local Python，仍須在使用者電腦上啟動服務，並明確允許網站來源。先停止既有服務，再執行：

macOS／Linux：

```sh
TEMPO_ALLOWED_ORIGINS=https://YOUR-NAME.github.io .venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

Windows PowerShell：

```powershell
$env:TEMPO_ALLOWED_ORIGINS="https://YOUR-NAME.github.io"
.\.venv\Scripts\python.exe -m uvicorn web_app:app --host 127.0.0.1 --port 8765
```

請將 `YOUR-NAME` 換成網站帳號；來源只含協定與網域，不加儲存庫路徑，多個來源以逗號分隔。本機 `localhost`、`127.0.0.1`、`::1` 來源已允許。網站存取本機服務仍受瀏覽器網路政策限制；若受阻，可改用本機服務頁面或 Browser ONNX。線上 Pages 與其本機服務連線情境尚未驗證。

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

# 選取範圍、試聽、ONNX／Python 片段分析與 MIDI
npm run test:range-browser

# MP4／MOV 音軌、範圍分析與無音軌錯誤（另需 FFmpeg）
npm run test:video-browser
```

測試包含固定／平均／變速判定、Python 與 JavaScript 頻譜及拍點比較、S-KEY 分數一致性、MIDI 編碼、模型快取、來源切換、逾時與檔案損壞、下載到期、三語介面與錯誤復原。`TEST_URL` 可指定瀏覽器測試網址；網址附加 `?engine=wasm` 可強制瀏覽器使用 CPU。

目前驗證範圍（2026-09-17）：

| 情境 | 結果 |
| --- | --- |
| 本機 Chrome，範圍分析 | 拖放、試聽、ONNX／Python 第 5–20 秒分析均為 68.015 BPM／G 大調，MIDI 長度約 15 秒；恢復整首為 68.007 BPM。三語及 320／390／1440 px 排版通過 |
| 本機 Chrome，WebGPU／WASM | 固定與變速分析、MIDI 下載、三語切換及錯誤復原通過 |
| 本機模擬 Hugging Face 故障 | 兩個模型從本機備援完整下載並分析成功；雙來源失敗訊息及重新選檔重試通過 |
| 正式 GitHub Pages，Hugging Face 正常 | 兩個模型實際下載、BPM／調性分析、MIDI 產生及重新整理後的快取使用通過 |
| 正式 GitHub Pages，S-KEY 主要來源故障 | GitHub Pages 備援模型下載、驗證及調性分析通過 |
| 正式 GitHub Pages，Beat This! 主要來源故障 | 來源切換與三語進度顯示正確；完整下載超過該次 120 秒測試等待上限，尚未完成此情境的線上端到端驗證 |

上述 120 秒是瀏覽器測試的等待上限，與程式的 30 秒「無資料傳輸」逾時不同。手機尺寸測試僅代表排版，Safari、Firefox 與實體手機仍待驗證。

模型可能判成半速／倍速，漏拍與抖動也會反映在速度圖中；固定或變速是依模型拍點及容差推算，並非原始樂曲的人工標註。每個拍點按四分音符解讀，拍號無法可靠判定時不強行填入。

S-KEY 對整首或所選片段提供單一大調／小調估計，不定位轉調或辨識和弦；其分數不是經校準的準確率。移植一致性測試驗證的是實作結果相近，不代表模型對所有音樂都能正確辨識。

