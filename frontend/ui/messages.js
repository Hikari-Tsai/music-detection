// Shared language catalog. Keys are stable across all three locales.
export const messages = {
  compareTitle: {
    en: 'Two ways to analyze your music',
    ja: '音楽を解析する2つの方法',
    'zh-Hant': '兩種音樂分析方式'
  },
  compareIntro: {
    en: 'Both use Beat This! and S-KEY, and provide BPM, meter, key and tempo MIDI. Choose how they run on your device.',
    ja: 'どちらも Beat This! と S-KEY で BPM・拍子・調を推定し、テンポ MIDI を生成します。端末での実行方法を選べます。',
    'zh-Hant':
      '兩者皆使用 Beat This! 與 S-KEY，提供 BPM、拍號、調性與 Tempo MIDI，可依需求選擇執行方式。'
  },
  compareBrowser: {
    en: 'Browser ONNX · Recommended',
    ja: 'Browser ONNX · 推奨',
    'zh-Hant': '瀏覽器 ONNX・推薦'
  },
  comparePython: { en: 'Local Python', ja: 'Local Python', 'zh-Hant': '本機 Python' },
  compareSetup: { en: 'Getting started', ja: '利用の準備', 'zh-Hant': '使用準備' },
  compareRuntime: { en: 'How it runs', ja: '実行方法', 'zh-Hant': '執行方式' },
  comparePrivacy: { en: 'Audio processing', ja: '音声の処理', 'zh-Hant': '音訊處理' },
  compareSpeed: { en: 'Performance', ja: '処理速度', 'zh-Hant': '效能差異' },
  compareBestFor: { en: 'When to use it', ja: '用途の目安', 'zh-Hant': '適合情境' },
  compareBrowserSetup: {
    en: 'Open this page; no Python installation needed. Models download on first use and are cached when browser storage is available.',
    ja: 'ページを開くだけで利用でき、Python の導入は不要です。モデルは初回にダウンロードされ、ブラウザーのストレージが利用できる場合はキャッシュされます。',
    'zh-Hant': '開啟網頁即可使用，無須安裝 Python。首次使用會下載模型，瀏覽器儲存空間可用時會快取。'
  },
  comparePythonSetup: {
    en: 'Install Python dependencies and FFmpeg, then start the local FastAPI service. Model weights download on first use.',
    ja: 'Python の依存パッケージと FFmpeg を導入し、ローカルの FastAPI サービスを起動します。モデルの重みは初回にダウンロードされます。',
    'zh-Hant': '需安裝 Python 相依套件與 FFmpeg，並啟動本機 FastAPI 服務；首次使用會下載模型權重。'
  },
  compareBrowserRuntime: {
    en: 'ONNX Runtime Web runs exported models in a Web Worker. Beat This! tries WebGPU, with a WASM fallback; S-KEY uses WASM.',
    ja: '変換済みモデルを Web Worker 内の ONNX Runtime Web で実行します。Beat This! は WebGPU を試し、利用できなければ WASM に切り替えます。S-KEY は WASM を使用します。',
    'zh-Hant':
      '透過 Web Worker 中的 ONNX Runtime Web 執行匯出模型。Beat This! 優先使用 WebGPU，失敗時改用 WASM；S-KEY 使用 WASM。'
  },
  comparePythonRuntime: {
    en: 'PyTorch runs the original models directly. This app currently uses CPU inference, with FFmpeg decoding the audio.',
    ja: 'PyTorch で元のモデルを直接実行します。このアプリの現在の実装は CPU 推論を使用し、音声は FFmpeg でデコードします。',
    'zh-Hant': '由 PyTorch 直接執行原始模型。目前此專案使用 CPU 推論，並以 FFmpeg 解碼音訊。'
  },
  compareBrowserPrivacy: {
    en: 'Audio is decoded and analyzed in your browser. It is not uploaded to an analysis server.',
    ja: '音声のデコードと解析はブラウザー内で完結し、解析サーバーにはアップロードされません。',
    'zh-Hant': '音訊在瀏覽器內解碼與分析，不會上傳至分析伺服器。'
  },
  comparePythonPrivacy: {
    en: 'The browser sends audio over HTTP to FastAPI on this computer (127.0.0.1:8765), which returns results and a MIDI download.',
    ja: 'ブラウザーから同じ端末の FastAPI（127.0.0.1:8765）へ HTTP で音声を送り、解析結果と MIDI のダウンロード先を受け取ります。',
    'zh-Hant':
      '瀏覽器透過 HTTP 將音訊傳至同一台電腦的 FastAPI（127.0.0.1:8765），再取得分析結果與 MIDI 下載。'
  },
  compareBrowserSpeed: {
    en: 'Speed depends on browser, GPU support and available memory. ONNX is not always faster; the first run also includes model downloads.',
    ja: '速度はブラウザー、GPU 対応、使用可能なメモリーに依存します。ONNX が常に高速とは限らず、初回はモデルのダウンロード時間も必要です。',
    'zh-Hant':
      '速度取決於瀏覽器、GPU 支援與可用記憶體。ONNX 不一定較快，首次使用還需加上模型下載時間。'
  },
  comparePythonSpeed: {
    en: 'Speed depends on your CPU and available memory. It avoids browser runtime constraints but needs a running local service.',
    ja: '速度は CPU と使用可能なメモリーに依存します。ブラウザーの実行環境による制約は受けませんが、ローカルサービスの起動が必要です。',
    'zh-Hant': '速度取決於 CPU 與可用記憶體，不受瀏覽器執行環境限制，但需持續執行本機服務。'
  },
  compareBrowserBestFor: {
    en: 'Quick analysis with no installation, including the GitHub Pages version.',
    ja: 'インストールせずにすぐ解析したい場合。GitHub Pages 版でも利用できます。',
    'zh-Hant': '不想安裝環境、希望直接在網頁分析，包含 GitHub Pages 版本。'
  },
  comparePythonBestFor: {
    en: 'A local Python workflow, or an alternative when browser inference cannot run. See the setup guide in the engine selector above.',
    ja: 'ローカルの Python 環境を使いたい場合や、ブラウザー推論が動作しない場合。上のエンジン選択欄に起動手順があります。',
    'zh-Hant':
      '已有 Python 工作環境，或瀏覽器無法完成推論時使用。啟動步驟請見上方引擎選擇區的教學。'
  },
  compareAccuracy: {
    en: 'Same trained models, different runtimes: ONNX export converts the computation graph and weights without retraining. Export checks compare model outputs with PyTorch, but audio decoding and numerical differences can still affect the final results. Neither engine is guaranteed to be more accurate.',
    ja: '学習済みモデルは共通で、実行環境が異なります。ONNX への変換は計算グラフと重みを書き出すもので、再学習は行いません。変換時に PyTorch の出力と比較していますが、音声のデコードや数値計算の違いで最終結果に差が出ることがあります。どちらかが常に高精度とは限りません。',
    'zh-Hant':
      '相同的已訓練模型，不同的執行環境：ONNX 匯出會轉換計算圖與權重，不會重新訓練。匯出時已比對 PyTorch 的模型輸出，但音訊解碼與數值運算的差異仍可能影響最終結果，不能保證某個引擎一定較準。'
  },

  githubStar: {
    en: 'Star on GitHub',
    ja: 'スターで応援',
    'zh-Hant': '賞我星星'
  },
  githubStarAria: {
    en: 'Star on GitHub (opens the repository in a new tab)',
    ja: 'スターで応援（リポジトリを新しいタブで開く）',
    'zh-Hant': '賞我星星（在新分頁開啟 GitHub Repo）'
  },
  pythonGuidePlatformsUntested: {
    en: 'The service has been tested locally on macOS. These Windows and Linux setup instructions have not yet been verified end to end on those systems.',
    ja: 'ローカルサービスは macOS で検証済みです。Windows と Linux の手順は、それぞれの実機での一連の動作をまだ検証していません。',
    'zh-Hant': '本機服務已在 macOS 驗證；Windows 與 Linux 教學尚未在對應系統完成端到端實測。'
  },
  pythonGuideContinue: {
    en: 'Reopen your terminal, return to the project folder, then run:',
    ja: 'ターミナルを開き直し、プロジェクトフォルダーに戻ってから実行：',
    'zh-Hant': '重新開啟終端機並回到專案資料夾，再執行：'
  },
  pythonGuideLinuxTools: {
    en: 'These commands are for Ubuntu/Debian. On other distributions, install git, curl, and ffmpeg with your package manager, then install uv.',
    ja: '以下は Ubuntu/Debian 用です。ほかのディストリビューションではパッケージマネージャーで git、curl、ffmpeg を導入してから uv をインストールしてください。',
    'zh-Hant':
      '以下以 Ubuntu／Debian 為例。其他發行版請使用自己的套件管理器安裝 git、curl 與 ffmpeg，再安裝 uv。'
  },
  pythonGuideWindowsTools: {
    en: 'Install uv, Git, and FFmpeg with WinGet. If winget is unavailable, install or update App Installer using the Microsoft guide below.',
    ja: 'WinGet で uv、Git、FFmpeg を導入します。winget がない場合は、下の Microsoft の案内に従って App Installer を導入または更新してください。',
    'zh-Hant':
      '使用 WinGet 安裝 uv、Git 與 FFmpeg。若找不到 winget，請依下方 Microsoft 說明安裝或更新 App Installer。'
  },
  pythonGuideLinux: {
    en: 'Linux · Ubuntu / Debian',
    ja: 'Linux · Ubuntu / Debian',
    'zh-Hant': 'Linux · Ubuntu／Debian'
  },
  pythonGuideWindows: {
    en: 'Windows 10/11 · PowerShell',
    ja: 'Windows 10/11 · PowerShell',
    'zh-Hant': 'Windows 10/11 · PowerShell'
  },
  pythonGuideApiText: {
    en: 'Uvicorn runs the local FastAPI HTTP service. The browser sends audio with POST /api/analyze (multipart/form-data), receives JSON results, then downloads MIDI with GET /api/download/{token}. Audio is sent only to the service on this computer.',
    ja: 'Uvicorn がローカルの FastAPI HTTP サービスを起動します。ブラウザーは POST /api/analyze（multipart/form-data）で音声を送り、JSON の解析結果を受け取ります。MIDI は GET /api/download/{token} で取得します。音声の送信先はこのパソコンのサービスです。',
    'zh-Hant':
      'Uvicorn 啟動本機 FastAPI HTTP 服務。前端以 POST /api/analyze（multipart/form-data）傳送音訊，接收 JSON 分析結果，再透過 GET /api/download/{token} 下載 MIDI。音訊只會送往此電腦上的服務。'
  },
  pythonGuideApi: {
    en: 'How the browser communicates with Python',
    ja: 'ブラウザーと Python の通信',
    'zh-Hant': '前端如何與 Python 通訊'
  },
  pythonGuideTitle: {
    en: 'Local Python setup & troubleshooting',
    ja: 'Local Python の起動方法とトラブル対処',
    'zh-Hant': 'Local Python 啟動教學與疑難排解'
  },
  pythonGuideIntro: {
    en: 'Local Python runs on the same computer as your browser. Follow the macOS, Windows (PowerShell), or Linux instructions below. Set it up once; if already installed, jump to step 3.',
    ja: 'Local Python はブラウザーと同じパソコンで動作します。macOS、Windows（PowerShell）、Linux の手順を選んで初回設定してください。設定済みの場合は手順 3 へ。',
    'zh-Hant':
      'Local Python 在瀏覽器所在的同一台電腦執行。請依 macOS、Windows（PowerShell）或 Linux 教學完成首次安裝；已安裝完成可跳到步驟 3。'
  },
  pythonGuidePrepare: {
    en: '1. Prepare your project folder',
    ja: '1. プロジェクトを準備',
    'zh-Hant': '1. 準備專案資料夾'
  },
  pythonGuideFolder: {
    en: 'Download or clone the complete project, including web_app.py and requirements.txt. Open Terminal on macOS/Linux or PowerShell on Windows, then run cd "path/to/music-detection" with your actual folder path. Run all commands from that folder.',
    ja: 'web_app.py と requirements.txt を含むプロジェクト一式を取得します。macOS/Linux はターミナル、Windows は PowerShell を開き、cd "path/to/music-detection" のパスを実際のフォルダーに置き換えて実行してください。以下のコマンドはすべてそのフォルダー内で実行します。',
    'zh-Hant':
      '下載或 clone 完整專案，確認包含 web_app.py 與 requirements.txt。macOS／Linux 開啟終端機，Windows 開啟 PowerShell，執行 cd "path/to/music-detection"，將路徑換成實際專案資料夾。以下指令都在此資料夾內執行。'
  },
  pythonGuideTools: {
    en: 'With Homebrew installed, install the required tools:',
    ja: 'Homebrew をインストールしてから、必要なツールを導入します。',
    'zh-Hant': '先安裝 Homebrew，再安裝所需工具：'
  },
  pythonGuideBrew: {
    en: 'Homebrew installation guide ↗',
    ja: 'Homebrew のインストール案内 ↗',
    'zh-Hant': 'Homebrew 安裝說明 ↗'
  },
  pythonGuideInstall: {
    en: '2. Install Python dependencies once',
    ja: '2. Python の依存パッケージを初回インストール',
    'zh-Hant': '2. 首次安裝 Python 套件'
  },
  pythonGuideEnvironment: {
    en: "Choose your operating system below. Use Python 3.12 in the project's .venv; these commands preserve an existing environment. Wait for installation to finish. After installing tools, reopen your terminal and return to the project folder before continuing.",
    ja: '以下で OS を選び、プロジェクトの .venv で Python 3.12 を使用します。既存の環境は保持されます。ツールの導入後はターミナルを開き直し、プロジェクトフォルダーに戻ってから続けてください。',
    'zh-Hant':
      '請展開對應的作業系統，使用專案 .venv 中的 Python 3.12；指令會保留既有環境。工具安裝後，請重新開啟終端機並回到專案資料夾，再繼續安裝 Python 套件。'
  },
  pythonGuideStart: {
    en: '3. Start the local service',
    ja: '3. ローカルサービスを起動',
    'zh-Hant': '3. 啟動本機服務'
  },
  pythonGuideStartText: {
    en: 'Run the command for your operating system. On macOS you can also double-click start_ui.command in Finder. You only need to start the service each time; no dependency reinstall or virtual environment activation is required.',
    ja: 'OS に対応するコマンドを実行します。macOS では Finder で start_ui.command をダブルクリックしても起動できます。毎回のパッケージ再インストールや仮想環境の有効化は不要です。',
    'zh-Hant':
      '執行對應作業系統的指令；macOS 也可在 Finder 雙擊 start_ui.command。之後只需啟動服務，不必重新安裝套件或啟用虛擬環境。'
  },
  pythonGuideReady: {
    en: 'The service is ready when Terminal shows:',
    ja: 'ターミナルに次の表示が出れば起動完了です。',
    'zh-Hant': '終端機出現以下訊息，即代表服務已啟動：'
  },
  pythonGuideKeepOpen: {
    en: 'Keep that Terminal window open while analyzing. Press Control + C in that window when you want to stop the service.',
    ja: '解析中はそのターミナルを開いたままにしてください。停止するときは、その画面で Control + C を押します。',
    'zh-Hant': '分析期間請保持該終端機視窗開啟。使用完畢可在該視窗按 Control + C 停止服務。'
  },
  pythonGuideUse: {
    en: '4. Return here and analyze',
    ja: '4. このページに戻って解析',
    'zh-Hant': '4. 回到此頁分析音訊'
  },
  pythonGuideUseText: {
    en: 'Select Local Python, then choose or drop an audio file. Switching engines reanalyzes a file that is already selected. If a previous attempt failed, remove the file and add it again after starting the service.',
    ja: 'Local Python を選択し、音声ファイルを選ぶかドロップしてください。選択中のファイルがあれば切り替え時に再解析します。接続に失敗した場合は、サービス起動後にファイルを削除して追加し直してください。',
    'zh-Hant':
      '選擇 Local Python，再選取或拖入音訊。若已有選取檔案，切換時會重新分析；若先前連線失敗，啟動服務後請移除檔案，再重新加入。'
  },
  pythonGuideFirstRun: {
    en: 'The first analysis downloads the model weights and needs an internet connection. Audio is processed by the local service; temporary audio files are removed afterwards. MIDI downloads remain available for up to one hour.',
    ja: '初回の解析ではモデルをダウンロードするため、ネット接続が必要です。音声はローカルサービスで処理され、一時ファイルは解析後に削除されます。MIDI のダウンロード有効期間は最大 1 時間です。',
    'zh-Hant':
      '首次分析需連網下載模型權重。音訊由本機服務處理，暫存音訊會在分析後刪除；MIDI 下載最多保留一小時。'
  },
  pythonGuideOpen: {
    en: 'Open the local service page ↗',
    ja: 'ローカルサービスのページを開く ↗',
    'zh-Hant': '開啟本機服務頁面 ↗'
  },
  pythonGuideDefault: {
    en: 'That page also defaults to Browser ONNX. Select Local Python there if you want to use the Python service.',
    ja: 'そのページも初期設定は Browser ONNX です。Python を使う場合は Local Python に切り替えてください。',
    'zh-Hant': '本機服務頁面也預設 Browser ONNX；若要使用 Python，仍需在頁面選擇 Local Python。'
  },
  pythonGuideTrouble: {
    en: 'Still unable to connect?',
    ja: '接続できない場合',
    'zh-Hant': '還是無法連線？'
  },
  pythonGuideConnection: {
    en: 'Connection failed: check that the service is running on this computer at port 8765. Open the local service page above. If it does not open, check the Terminal error first. You can switch to Browser ONNX while resolving the issue.',
    ja: '接続エラー：このパソコンのポート 8765 でサービスが動作しているか確認してください。上のリンクでローカルページが開かなければ、まずターミナルのエラーを確認します。解決まで Browser ONNX を使うこともできます。',
    'zh-Hant':
      '連線失敗：確認服務在這台電腦的 8765 連接埠執行。試著開啟上方本機服務頁面；若打不開，先查看終端機錯誤。排解期間可改用 Browser ONNX。'
  },
  pythonGuideModules: {
    en: 'ModuleNotFoundError or a missing .venv: complete step 2. Use .venv/bin/python on macOS/Linux or .\\.venv\\Scripts\\python.exe on Windows. If requirements.txt is missing, return to the project folder in step 1.',
    ja: 'ModuleNotFoundError や .venv がない場合は手順 2 を完了し、macOS/Linux は .venv/bin/python、Windows は .\\.venv\\Scripts\\python.exe を使ってください。requirements.txt がなければ手順 1 のフォルダーに戻ります。',
    'zh-Hant':
      '出現 ModuleNotFoundError 或找不到 .venv：完成步驟 2，macOS／Linux 使用 .venv/bin/python，Windows 使用 .\\.venv\\Scripts\\python.exe。若找不到 requirements.txt，請回到步驟 1 的專案資料夾。'
  },
  pythonGuideFfmpeg: {
    en: 'FFmpeg not found: install it using the commands for your OS in step 2, reopen the terminal, and check ffmpeg -version. Address already in use means port 8765 is occupied; use the running service or stop its terminal session with Control + C before restarting.',
    ja: 'FFmpeg がない場合は手順 2 の OS 別コマンドで導入し、ターミナルを開き直して ffmpeg -version を確認します。Address already in use はポート 8765 が使用中という意味です。起動済みのサービスを使うか、元の画面で Control + C を押して停止してから再起動します。',
    'zh-Hant':
      '找不到 FFmpeg：使用步驟 2 對應作業系統的指令安裝，重新開啟終端機，再以 ffmpeg -version 確認。Address already in use 代表 8765 已被使用；請沿用既有服務，或在原終端機按 Control + C 停止後重啟。'
  },
  pythonGuideOnline: {
    en: 'Connecting from GitHub Pages or another website',
    ja: 'GitHub Pages などのサイトから接続する場合',
    'zh-Hant': '從 GitHub Pages 或其他網站連線'
  },
  pythonGuideOrigin: {
    en: "Allow your site's exact origin when starting the local service. Replace YOUR-NAME with your GitHub account; do not include the repository path. If the service is already running, stop it first and restart with this setting.",
    ja: 'ローカルサービスの起動時にサイトのオリジンを許可します。YOUR-NAME を GitHub アカウント名に置き換え、リポジトリのパスは含めないでください。起動中の場合は停止してから、この設定で再起動します。',
    'zh-Hant':
      '啟動服務時允許網站的確切來源。將 YOUR-NAME 換成 GitHub 帳號，不要包含 repository 路徑。若服務已啟動，請先停止，再帶入此設定重新啟動。'
  },
  pythonGuideNetwork: {
    en: 'Your browser may restrict access from a website to a local service. If blocked, use the local service page or Browser ONNX. Online GitHub Pages access has not been verified for this project.',
    ja: 'ブラウザーにより、ウェブサイトからローカルサービスへのアクセスが制限される場合があります。接続できなければローカルページか Browser ONNX を使用してください。このプロジェクトのオンライン GitHub Pages 接続は未検証です。',
    'zh-Hant':
      '瀏覽器可能限制網站存取本機服務。若遭阻擋，請使用本機服務頁面或 Browser ONNX。本專案尚未驗證線上 GitHub Pages 的本機連線情境。'
  },
  engineTitle: { 'zh-Hant': '分析引擎', en: 'Analysis engine', ja: '解析エンジン' },
  engineBrowserHelp: {
    'zh-Hant': '（推薦）在此裝置分析，不上傳音訊。切換引擎會重新分析已選取的檔案。',
    en: '(Recommended) Analyze on this device without uploading audio. Switching engines reanalyzes the selected file.',
    ja: '（推奨）音声をアップロードせず、この端末で解析します。エンジンを切り替えると選択中のファイルを再解析します。'
  },
  enginePythonHelp: {
    en: 'Audio is sent over HTTP to the FastAPI service at http://127.0.0.1:8765 on this device. See the setup guide below; switching reanalyzes the selected file.',
    ja: '音声を HTTP 経由で、この端末の FastAPI サービス http://127.0.0.1:8765 に送信します。下の起動ガイドをご覧ください。切り替えると選択中のファイルを再解析します。',
    'zh-Hant':
      '音訊透過 HTTP 傳送至本機 FastAPI 服務 http://127.0.0.1:8765。請參閱下方啟動教學；切換後會重新分析已選檔案。'
  },
  pageTitle: {
    'zh-Hant': 'Key & Tempo — BPM、調性分析與 MIDI',
    en: 'Key & Tempo — BPM, Key Detection & MIDI',
    ja: 'Key & Tempo — BPM・キー解析・MIDI'
  },
  metaDescription: {
    'zh-Hant': '拖入音樂，在本機分析 BPM、拍號與大調／小調，下載固定或變速的 MIDI Tempo 檔案。',
    en: 'Drop in music to analyze BPM, time signature and key locally, then download a constant or variable MIDI tempo map.',
    ja: '音楽をドラッグして、BPM・拍子・キーをローカルで解析。固定テンポや可変テンポの MIDI をダウンロードできます。'
  },
  home: {
    'zh-Hant': 'Key & Tempo 首頁',
    en: 'Key & Tempo home',
    ja: 'Key & Tempo ホーム'
  },
  localPython: {
    'zh-Hant': '僅在本機處理',
    en: 'Processed locally',
    ja: 'ローカル処理'
  },
  localBrowser: {
    'zh-Hant': '瀏覽器本機運算',
    en: 'Runs in your browser',
    ja: 'ブラウザー内で処理'
  },
  heroBeat: {
    'zh-Hant': '聽見節奏。',
    en: 'Hear the beat.',
    ja: 'リズムを知る。'
  },
  heroFind: {
    'zh-Hant': '看見',
    en: 'Find the',
    ja: '見つけよう、'
  },
  heroIntro: {
    'zh-Hant': '拖入音樂，找到 BPM、拍號與調性。',
    en: 'Drop in music. Discover its BPM, meter and key.',
    ja: '音楽をドラッグして、BPM・拍子・キーを解析。'
  },
  heroNext: {
    'zh-Hant': '帶走 MIDI Tempo，讓下一段創作接著發生。',
    en: 'Take the MIDI tempo map into your next creation.',
    ja: 'MIDI テンポを、次の音楽づくりへ。'
  },
  motionPauseAria: {
    'zh-Hant': '暫停 Banner 動畫',
    en: 'Pause banner animation',
    ja: 'バナーのアニメーションを停止'
  },
  motionPlayAria: {
    'zh-Hant': '播放 Banner 動畫',
    en: 'Play banner animation',
    ja: 'バナーのアニメーションを再生'
  },
  motionReducedAria: {
    'zh-Hant': '已依系統設定減少動態效果',
    en: 'Motion reduced by system preference',
    ja: 'システム設定により動きを軽減しています'
  },
  motionPause: {
    'zh-Hant': '暫停動態',
    en: 'Pause motion',
    ja: '動きを停止'
  },
  motionPlay: {
    'zh-Hant': '播放動態',
    en: 'Play motion',
    ja: '動きを再生'
  },
  motionReduced: {
    'zh-Hant': '已減少動態',
    en: 'Reduced motion',
    ja: '動きを軽減中'
  },
  inputTitle: {
    'zh-Hant': '你的音訊',
    en: 'Your audio',
    ja: '音声ファイル'
  },
  fileLimit: {
    'zh-Hant': '最長 20 分鐘 · 100 MB',
    en: 'Up to 20 min · 100 MB',
    ja: '最大 20 分 · 100 MB'
  },
  dropTitle: {
    'zh-Hant': '把音樂拖到這裡',
    en: 'Drop your music here',
    ja: 'ここに音楽をドロップ'
  },
  dropCopy: {
    'zh-Hant': '讓下一個靈感，從節奏開始。',
    en: 'Let your next idea start with a beat.',
    ja: '次のひらめきは、リズムから。'
  },
  chooseFile: {
    'zh-Hant': '選擇音訊檔案',
    en: 'Choose audio file',
    ja: '音声ファイルを選択'
  },
  dropRelease: {
    'zh-Hant': '放開以開始分析',
    en: 'Release to analyze',
    ja: 'ドロップして解析を開始'
  },
  clearFile: {
    'zh-Hant': '移除音訊，重新選擇',
    en: 'Remove audio and choose again',
    ja: '音声を削除して選び直す'
  },
  waveAria: {
    'zh-Hant': '音訊波形',
    en: 'Audio waveform',
    ja: '音声波形'
  },
  readingAudio: {
    'zh-Hant': '正在讀取音訊',
    en: 'Reading audio',
    ja: '音声を読み込み中'
  },
  playAudio: {
    'zh-Hant': '播放音訊',
    en: 'Play audio',
    ja: '音声を再生'
  },
  pauseAudio: {
    'zh-Hant': '暫停音訊',
    en: 'Pause audio',
    ja: '音声を一時停止'
  },
  seekAria: {
    'zh-Hant': '音訊播放進度',
    en: 'Audio playback position',
    ja: '音声の再生位置'
  },
  previewPython: {
    'zh-Hant': '瀏覽器不支援此格式的試聽，仍可分析。',
    en: 'Your browser cannot preview this format. Analysis is still available.',
    ja: 'ブラウザーで試聴できない形式ですが、解析は可能です。'
  },
  previewBrowser: {
    'zh-Hant': '瀏覽器無法播放此音訊，請改用 WAV 或 MP3。',
    en: 'Your browser cannot play this audio. Try WAV or MP3.',
    ja: 'ブラウザーで再生できません。WAV または MP3 をお試しください。'
  },
  privacyPython: {
    'zh-Hant': '音訊不會傳送至雲端，分析後即清除上傳暫存。',
    en: 'Audio stays off the cloud. Temporary uploads are deleted after analysis.',
    ja: '音声はクラウドに送信されず、解析後に一時ファイルを削除します。'
  },
  privacyBrowser: {
    'zh-Hant': '音訊只在瀏覽器內分析，不會上傳。首次使用需下載約 82 MB 模型。',
    en: 'Audio is analyzed in your browser and never uploaded. The first run downloads about 82 MB of models.',
    ja: '音声はアップロードせず、ブラウザー内で解析します。初回は約 82 MB のモデルをダウンロードします。'
  },
  resultTitle: {
    'zh-Hant': '分析結果',
    en: 'Analysis results',
    ja: '解析結果'
  },
  waitingAudio: {
    'zh-Hant': '等候音訊',
    en: 'Awaiting audio',
    ja: '音声を待機中'
  },
  beatsPerBar: {
    'zh-Hant': '每小節拍數',
    en: 'Beats per bar',
    ja: '1 小節の拍数'
  },
  keyAria: {
    'zh-Hant': '調性',
    en: 'Musical key',
    ja: 'キー'
  },
  keyEstimate: {
    'zh-Hant': '全曲調性估計 · S-KEY',
    en: 'Global key estimate · S-KEY',
    ja: '全曲のキー推定 · S-KEY'
  },
  initialDescription: {
    'zh-Hant': '自動分析 BPM；偵測到變速時，顯示平均值並匯出變速 MIDI。',
    en: 'Detect BPM automatically. For variable tempo, see the average and export a tempo map.',
    ja: 'BPM を自動解析。テンポが変化する場合は平均値を表示し、可変テンポの MIDI を出力します。'
  },
  downloadMidi: {
    'zh-Hant': '下載 MIDI Tempo',
    en: 'Download MIDI Tempo',
    ja: 'MIDI テンポをダウンロード'
  },
  midiOnly: {
    'zh-Hant': '僅含速度與拍號，不含音符',
    en: 'Tempo and time signature only, no notes',
    ja: 'テンポと拍子のみ・音符は含みません'
  },
  howTo: {
    'zh-Hant': '使用方式',
    en: 'How it works',
    ja: '使い方'
  },
  workflowAdd: {
    'zh-Hant': '加入音訊',
    en: 'Add your audio',
    ja: '音声を追加'
  },
  workflowSelect: {
    'zh-Hant': '選擇檔案，或直接拖放。',
    en: 'Choose a file, or drag and drop.',
    ja: 'ファイルを選択、またはドラッグ＆ドロップ。'
  },
  workflowDetect: {
    'zh-Hant': '自動尋找節奏',
    en: 'Discover the rhythm',
    ja: 'リズムを解析'
  },
  workflowAnalyze: {
    'zh-Hant': '辨識拍點、速度、拍數與調性。',
    en: 'Find beats, tempo, meter and key.',
    ja: '拍の位置・テンポ・拍子・キーを検出。'
  },
  workflowCreate: {
    'zh-Hant': '回到你的創作',
    en: 'Back to creating',
    ja: '音楽づくりへ'
  },
  workflowDaw: {
    'zh-Hant': '下載 .mid，匯入慣用的 DAW。',
    en: 'Download a .mid file for your DAW.',
    ja: '.mid をダウンロードして DAW に読み込み。'
  },
  modelsTitle: {
    'zh-Hant': '使用的模型',
    en: 'Meet the models',
    ja: '使用しているモデル'
  },
  modelsIntro: {
    'zh-Hant': '節奏與調性，交給各自擅長的模型。讓你知道結果從何而來。',
    en: 'Two specialized models for rhythm and harmony. Know what powers your results.',
    ja: 'リズムとキー、それぞれに特化したモデル。解析結果の仕組みをご紹介します。'
  },
  beatTask: {
    'zh-Hant': '節拍與小節首拍',
    en: 'Beats & downbeats',
    ja: '拍と小節の先頭'
  },
  beatDescription: {
    'zh-Hant':
      '找出音樂中的每個拍點與小節第一拍。本頁再依這些時間位置，計算固定或平均 BPM、推估拍號，並產生 MIDI 速度圖。',
    en: 'Detects beats and the first beat of each bar. This app uses their timing to calculate constant or average BPM, estimate meter, and generate a MIDI tempo map.',
    ja: '音楽の拍と小節の先頭を検出します。本アプリはその時刻から固定・平均 BPM と拍子を推定し、MIDI テンポマップを生成します。'
  },
  beatLimit: {
    'zh-Hant': '節拍可能有半速、倍速或漏拍；變速 MIDI 也會反映偵測拍點的抖動。',
    en: 'Half-time, double-time or missed beats can occur. A variable tempo map also reflects jitter in detected beats.',
    ja: '半テンポ・倍テンポや拍の検出漏れが生じることがあります。可変テンポの MIDI には検出時刻の揺らぎも反映されます。'
  },
  sourceLink: {
    'zh-Hant': '官方原始碼',
    en: 'Source code',
    ja: '公式ソースコード'
  },
  paperLink: {
    'zh-Hant': '研究論文',
    en: 'Research paper',
    ja: '研究論文'
  },
  beatSourceAria: {
    'zh-Hant': 'Beat This! 官方原始碼（另開分頁）',
    en: 'Beat This! source code (opens in a new tab)',
    ja: 'Beat This! 公式ソースコード（新しいタブ）'
  },
  beatPaperAria: {
    'zh-Hant': 'Beat This! 研究論文（另開分頁）',
    en: 'Beat This! research paper (opens in a new tab)',
    ja: 'Beat This! 研究論文（新しいタブ）'
  },
  keyTask: {
    'zh-Hant': '全曲調性',
    en: 'Global musical key',
    ja: '全曲のキー'
  },
  keyDescription: {
    'zh-Hant':
      '以自監督學習辨識音樂調性，從 12 種大調與 12 種小調中，估計整段音訊最可能的調性。本頁使用至少 3 秒的有聲音訊進行分析。',
    en: 'Uses self-supervised learning to estimate a global key from 12 major and 12 minor keys. This app analyzes audible clips of at least 3 seconds.',
    ja: '自己教師あり学習を用い、12 種類の長調と 12 種類の短調から全体のキーを推定します。本アプリでは音のある 3 秒以上の音声を解析します。'
  },
  keyLimit: {
    'zh-Hant': '提供全曲估計，不是和弦或轉調時間軸；相對大小調與轉調歌曲可能有歧義。',
    en: 'Estimates one global key, not chords or a modulation timeline. Relative keys and key changes can be ambiguous.',
    ja: '全体のキーを推定するもので、コードや転調の時系列解析ではありません。平行調や転調を含む曲では判断が曖昧になる場合があります。'
  },
  keySourceAria: {
    'zh-Hant': 'S-KEY 官方原始碼（另開分頁）',
    en: 'S-KEY source code (opens in a new tab)',
    ja: 'S-KEY 公式ソースコード（新しいタブ）'
  },
  keyPaperAria: {
    'zh-Hant': 'S-KEY 研究論文（另開分頁）',
    en: 'S-KEY research paper (opens in a new tab)',
    ja: 'S-KEY 研究論文（新しいタブ）'
  },
  modelsNote: {
    'zh-Hant':
      '結果為模型估計，可搭配聆聽確認。下載的 MIDI 僅包含速度與可辨識的拍號，調性顯示於分析結果中。',
    en: 'Results are model estimates; use your ears to check them. MIDI includes tempo and any detected time signature. The key is shown in the results.',
    ja: '結果はモデルによる推定です。聴いて確認することをおすすめします。MIDI にはテンポと推定できた拍子のみを含み、キーは画面に表示します。'
  },
  tempoQuestion: {
    'zh-Hant': '平均 BPM 與變速 MIDI 是怎麼算的？',
    en: 'How are average BPM and variable tempo MIDI calculated?',
    ja: '平均 BPM と可変テンポ MIDI はどう計算しますか？'
  },
  tempoAnswer: {
    'zh-Hant':
      '平均 BPM 以第一個到最後一個拍點的總時間與間隔數換算。至少五個拍點且偏離等速網格超過 30 ms 時，標示「偵測到變速」；下載的 MIDI 依每個拍點間隔寫入速度變化。MIDI 保留開頭的拍點偏移，請與原音訊從相同時間起點匯入，並啟用 DAW 的速度圖匯入。首拍前與末拍後沿用相鄰的速度。拍點抖動或漏拍也可能被辨識為變速；結果代表偵測到的拍點。拍號不確定時不寫入拍號，也不單憑拍號判定變速。資訊不足以判定時仍提供平均速度 MIDI；有效拍點不足、無效或超出 MIDI 速度範圍時回傳 -1。每拍按四分音符解讀，仍可能有半速或倍速歧義。',
    en: 'Average BPM uses the number of beat intervals and the time from the first to the last beat. With at least five beats and a deviation of more than 30 ms from a constant grid, the result is marked as variable tempo. MIDI tempo changes follow each beat interval and preserve the initial beat offset. Import it at the same start time as the audio, with tempo-map import enabled in your DAW. The adjacent tempo extends before the first and after the last beat. Jitter or missed beats may also appear as tempo changes. An uncertain meter is omitted and does not by itself indicate variable tempo. When evidence is insufficient, a single average tempo is exported; insufficient or invalid beats, or tempos outside the MIDI range, return -1. Each detected beat is treated as a quarter note, so half-time and double-time ambiguity remain possible.',
    ja: '平均 BPM は、最初から最後の拍までの時間と拍間隔の数から計算します。5 拍以上あり、等間隔のグリッドから 30 ms を超えてずれる場合、可変テンポと判定します。MIDI には拍ごとの間隔に応じたテンポ変化と、最初の拍までのオフセットを記録します。音声と同じ開始位置に読み込み、DAW のテンポマップ読み込みを有効にしてください。最初の拍より前と最後の拍より後は、隣接するテンポを維持します。拍の揺らぎや検出漏れもテンポ変化と判断されることがあります。拍子が不確かな場合は記録せず、拍子だけで可変テンポとは判定しません。判断材料が不足する場合は単一の平均テンポを出力します。有効な拍が不足・無効な場合や MIDI のテンポ範囲を超える場合は -1 を返します。各拍を四分音符として扱うため、半テンポ・倍テンポの曖昧さが残ります。'
  },
  keyQuestion: {
    'zh-Hant': 'S-KEY 的調性結果代表什麼？',
    en: 'What does the S-KEY result mean?',
    ja: 'S-KEY の解析結果は何を表しますか？'
  },
  keyAnswer: {
    'zh-Hant':
      'S-KEY 估計整段音訊最可能的主音與大調／小調，不是每個和弦或逐段轉調偵測。至少需要 3 秒有聲音訊；相對大小調、少旋律的打擊樂或轉調歌曲可能有歧義。結果是模型估計，並非人工標註。Tempo MIDI 仍只包含速度與可辨識拍號，調性顯示於此頁面。',
    en: 'S-KEY estimates the most likely tonic and major/minor mode for the whole clip, not individual chords or key changes over time. At least 3 seconds of audible audio are required. Relative keys, percussion with little melody, and modulating music may be ambiguous. This is a model estimate, not a human annotation. Tempo MIDI contains only tempo and any detected meter; the key is displayed on this page.',
    ja: 'S-KEY は音声全体で最も可能性の高い主音と長調・短調を推定します。個々のコードや転調の位置は検出しません。音のある 3 秒以上の音声が必要です。平行調、旋律の少ない打楽器、転調を含む曲では曖昧になることがあります。結果は人による注釈ではなく、モデルの推定です。Tempo MIDI はテンポと推定できた拍子のみを含み、キーはこのページに表示します。'
  },
  footer: {
    'zh-Hant': '給每一個節拍，一個起點。',
    en: 'Every beat, a new beginning.',
    ja: 'ひとつの拍から、新しいはじまり。'
  },
  oneFile: {
    'zh-Hant': '請一次加入一個音訊檔案。',
    en: 'Please add one audio file at a time.',
    ja: '音声ファイルは 1 つずつ追加してください。'
  },
  unsupported: {
    'zh-Hant': '不支援這個格式，請選擇 WAV、MP3、FLAC、M4A、OGG、AIFF 或 AAC。',
    en: 'Unsupported format. Choose WAV, MP3, FLAC, M4A, OGG, AIFF or AAC.',
    ja: '未対応の形式です。WAV・MP3・FLAC・M4A・OGG・AIFF・AAC を選択してください。'
  },
  empty: {
    'zh-Hant': '檔案是空的，請重新選擇。',
    en: 'This file is empty. Please choose another.',
    ja: '空のファイルです。選び直してください。'
  },
  sizeLimit: {
    'zh-Hant': '檔案超過 100 MB，請選擇較小的音訊。',
    en: 'This file exceeds 100 MB. Please choose a smaller file.',
    ja: '100 MB を超えています。小さい音声ファイルを選択してください。'
  },
  identifying: {
    'zh-Hant': '正在辨識音訊與拍點',
    en: 'Identifying audio and beats',
    ja: '音声と拍を識別中'
  },
  analyzingBeats: {
    'zh-Hant': '正在分析節拍，請稍候',
    en: 'Analyzing beats, please wait',
    ja: '拍を解析しています。しばらくお待ちください'
  },
  waitingKey: {
    'zh-Hant': '等候調性分析',
    en: 'Waiting for key analysis',
    ja: 'キー解析を待機中'
  },
  analyzing: {
    'zh-Hant': '分析中',
    en: 'Analyzing',
    ja: '解析中'
  },
  elapsed: {
    'zh-Hant': '{seconds} 秒',
    en: '{seconds} s',
    ja: '{seconds} 秒'
  },
  waitingModel: {
    'zh-Hant': '正在處理音訊或等待模型，請稍候',
    en: 'Processing audio or waiting for the model',
    ja: '音声を処理中、またはモデルを待機中です'
  },
  major: {
    'zh-Hant': '大調',
    en: 'major',
    ja: '長調'
  },
  minor: {
    'zh-Hant': '小調',
    en: 'minor',
    ja: '短調'
  },
  keyTooShort: {
    'zh-Hant': '調性分析至少需要 3 秒音訊',
    en: 'Key analysis needs at least 3 seconds of audio',
    ja: 'キー解析には 3 秒以上の音声が必要です'
  },
  keySilent: {
    'zh-Hant': '音訊無有效訊號，無法估計調性',
    en: 'No audible signal to estimate a key',
    ja: '有効な音がないため、キーを推定できません'
  },
  keyRetry: {
    'zh-Hant': '調性分析未完成，可重新分析',
    en: 'Key analysis unavailable. Try analyzing again.',
    ja: 'キー解析が完了しませんでした。再度お試しください'
  },
  analysisDone: {
    'zh-Hant': '分析完成 · {count} 個拍點',
    en: 'Analysis complete · {count} beats',
    ja: '解析完了 · {count} 拍'
  },
  notEnoughBeats: {
    'zh-Hant': '拍點不足',
    en: 'Not enough beats',
    ja: '拍が不足'
  },
  noBpm: {
    'zh-Hant': '找不到足夠的有效拍點，無法計算平均 BPM。',
    en: 'Not enough valid beats to calculate an average BPM.',
    ja: '有効な拍が不足しているため、平均 BPM を計算できません。'
  },
  longerAudio: {
    'zh-Hant': '請提供較長或節拍較清楚的音訊',
    en: 'Try longer audio or a clearer beat',
    ja: 'より長い音声か、拍が明瞭な音声をお試しください'
  },
  variable: {
    'zh-Hant': '偵測到變速',
    en: 'Variable tempo',
    ja: '可変テンポ'
  },
  variableDownload: {
    'zh-Hant': '下載變速 MIDI Tempo',
    en: 'Download variable tempo MIDI',
    ja: '可変テンポ MIDI をダウンロード'
  },
  variableDescription: {
    'zh-Hant': '顯示整段平均 BPM；MIDI 依偵測拍點寫入速度變化。匯入時請與原音訊使用相同起點。',
    en: 'Showing the overall average BPM. MIDI follows detected tempo changes; import it at the same start time as the audio.',
    ja: '全体の平均 BPM を表示しています。MIDI は検出した拍に沿ってテンポを変化させます。音声と同じ開始位置に読み込んでください。'
  },
  noMeter: {
    'zh-Hant': '拍號未確定，僅匯出速度。',
    en: ' Meter is uncertain; only tempo is exported.',
    ja: ' 拍子が不確かなため、テンポのみを出力します。'
  },
  average: {
    'zh-Hant': '平均估計',
    en: 'Average estimate',
    ja: '平均テンポの推定'
  },
  averageDownload: {
    'zh-Hant': '下載平均 MIDI Tempo',
    en: 'Download average tempo MIDI',
    ja: '平均テンポ MIDI をダウンロード'
  },
  averageDescription: {
    'zh-Hant': '資訊不足以確認固定或變速，先以整段拍點計算平均 BPM，MIDI 使用單一速度。',
    en: 'Not enough evidence to classify the tempo. BPM is averaged across detected beats; MIDI uses a single tempo.',
    ja: '固定・可変テンポを判断する情報が不足しています。検出した拍から平均 BPM を計算し、MIDI には単一テンポを設定します。'
  },
  constant: {
    'zh-Hant': '固定速度',
    en: 'Constant tempo',
    ja: '固定テンポ'
  },
  constantDescription: {
    'zh-Hant': '速度與每小節拍數一致。每拍按四分音符解讀。',
    en: 'Tempo and beats per bar are consistent. Each beat is treated as a quarter note.',
    ja: 'テンポと 1 小節の拍数は一定です。各拍を四分音符として扱います。'
  },
  midiMeter: {
    'zh-Hant': '僅含速度與拍號',
    en: 'Tempo and time signature only',
    ja: 'テンポと拍子のみ'
  },
  midiNoMeter: {
    'zh-Hant': '僅含速度，不設定拍號',
    en: 'Tempo only; meter is not set',
    ja: 'テンポのみ・拍子は設定しません'
  },
  hintGpu: {
    'zh-Hant': ' · GPU 本機分析',
    en: ' · Local GPU analysis',
    ja: ' · ローカル GPU 解析'
  },
  hintCpu: {
    'zh-Hant': ' · CPU 本機分析',
    en: ' · Local CPU analysis',
    ja: ' · ローカル CPU 解析'
  },
  hintPython: {
    'zh-Hant': ' · 下載保留 1 小時',
    en: ' · Download available for 1 hour',
    ja: ' · ダウンロード有効期間 1 時間'
  },
  keyFailed: {
    'zh-Hant': '調性分析未完成',
    en: 'Key analysis incomplete',
    ja: 'キー解析が未完了'
  },
  analysisFailed: {
    'zh-Hant': '分析未完成',
    en: 'Analysis incomplete',
    ja: '解析が未完了'
  },
  unableAnalyze: {
    'zh-Hant': '無法完成分析',
    en: 'Unable to complete analysis',
    ja: '解析を完了できません'
  },
  retryFile: {
    'zh-Hant': '請移除檔案後重試，或拖入另一個音訊。',
    en: 'Remove the file and try again, or drop in another audio file.',
    ja: 'ファイルを削除して再試行するか、別の音声を追加してください。'
  },
  downloadExpired: {
    'zh-Hant': '下載已失效，請重新分析音訊。',
    en: 'Download expired. Please analyze the audio again.',
    ja: 'ダウンロードの有効期限が切れました。再度解析してください。'
  },
  resourceFailed: {
    'zh-Hant': '分析資源載入失敗，請確認網路連線後重試。',
    en: 'Could not load analysis resources. Check your connection and try again.',
    ja: '解析データを読み込めません。ネット接続を確認して再試行してください。'
  },
  serverFailed: {
    'zh-Hant': '無法連線到本機分析服務，請確認服務正在執行。',
    en: 'Cannot connect to the local analysis service. Check that it is running.',
    ja: 'ローカル解析サービスに接続できません。起動しているか確認してください。'
  },
  apiFailed: {
    'zh-Hant': '分析失敗，請重新選擇檔案。',
    en: 'Analysis failed. Please choose the file again.',
    ja: '解析に失敗しました。ファイルを選び直してください。'
  },
  decoding: {
    'zh-Hant': '正在瀏覽器內解碼音訊',
    en: 'Decoding audio in your browser',
    ja: 'ブラウザーで音声をデコード中'
  },
  decodeFailed: {
    'zh-Hant': '瀏覽器無法解碼這個音訊，請轉成 WAV 或 MP3 後再試。',
    en: 'Your browser cannot decode this audio. Convert it to WAV or MP3 and try again.',
    ja: 'ブラウザーでデコードできません。WAV または MP3 に変換して再試行してください。'
  },
  tooLong: {
    'zh-Hant': '音訊超過 20 分鐘，請先截取較短片段。',
    en: 'Audio exceeds 20 minutes. Please use a shorter clip.',
    ja: '20 分を超えています。短い音声に切り出してください。'
  },
  tooShort: {
    'zh-Hant': '音訊太短，請提供至少 1 秒的檔案。',
    en: 'Audio is too short. Please use a clip of at least 1 second.',
    ja: '音声が短すぎます。1 秒以上のファイルを使用してください。'
  },
  invalidSamples: {
    'zh-Hant': '音訊含有無效取樣，請重新匯出。',
    en: 'Audio contains invalid samples. Please export it again.',
    ja: '無効な音声サンプルが含まれています。再度書き出してください。'
  },
  workerStopped: {
    'zh-Hant': '瀏覽器分析引擎停止，可能是記憶體不足。請嘗試較短音訊。',
    en: 'The browser analysis engine stopped, possibly due to low memory. Try a shorter clip.',
    ja: 'ブラウザーの解析処理が停止しました。メモリ不足の可能性があります。短い音声をお試しください。'
  },
  initGpu: {
    'zh-Hant': '正在初始化 GPU 分析引擎',
    en: 'Initializing GPU analysis',
    ja: 'GPU 解析を初期化中'
  },
  initCpu: {
    'zh-Hant': '正在初始化 CPU 分析引擎',
    en: 'Initializing CPU analysis',
    ja: 'CPU 解析を初期化中'
  },
  beatProgress: {
    'zh-Hant': '正在分析節拍 {current} / {total}（{engine}）',
    en: 'Analyzing beats {current} / {total} ({engine})',
    ja: '拍を解析中 {current} / {total}（{engine}）'
  },
  spectrogram: {
    'zh-Hant': '正在計算音訊頻譜',
    en: 'Computing the spectrogram',
    ja: 'スペクトログラムを計算中'
  },
  spectrumProgress: {
    'zh-Hant': '正在計算音訊頻譜 {percent}%',
    en: 'Computing the spectrogram {percent}%',
    ja: 'スペクトログラムを計算中 {percent}%'
  },
  workerFailed: {
    'zh-Hant': '瀏覽器分析未完成，請嘗試較短音訊，或更新瀏覽器後重試。',
    en: 'Browser analysis failed. Try shorter audio or update your browser.',
    ja: 'ブラウザーでの解析に失敗しました。短い音声を試すか、ブラウザーを更新してください。'
  },
  frontendConfigFailed: {
    'zh-Hant': '音訊分析設定下載失敗。',
    en: 'Could not download audio analysis settings.',
    ja: '音声解析の設定をダウンロードできません。'
  },
  modelConfigFailed: {
    'zh-Hant': '模型設定下載失敗，請重新整理後再試。',
    en: 'Could not download model settings. Refresh and try again.',
    ja: 'モデル設定をダウンロードできません。ページを再読み込みしてください。'
  },
  modelCached: {
    'zh-Hant': '正在讀取已快取的模型',
    en: 'Reading the cached model',
    ja: 'キャッシュ済みのモデルを読み込み中'
  },
  modelSourceConnecting: {
    'zh-Hant': '正在讀取模型設定',
    en: 'Loading model settings',
    ja: 'モデル設定を読み込み中'
  },
  modelSourceDownload: {
    'zh-Hant': '正在下載模型（{size} MB）',
    en: 'Downloading model ({size} MB)',
    ja: 'モデルをダウンロード中（{size} MB）'
  },
  modelSourceVerifying: {
    'zh-Hant': '下載完成，正在驗證模型',
    en: 'Download complete; verifying model',
    ja: 'ダウンロード完了、モデルを検証中'
  },
  modelSourceFallback: {
    'zh-Hant': '{from} 無法使用，改從 {to} 載入。原因：',
    en: '{from} unavailable; switching to {to}. Reason: ',
    ja: '{from} を利用できないため、{to} に切り替えます。理由：'
  },
  modelSourceTimeout: {
    'zh-Hant': '連線或資料傳輸逾時',
    en: 'Connection or data transfer timed out',
    ja: '接続またはデータ転送がタイムアウトしました'
  },
  modelSourceHttp: {
    'zh-Hant': '伺服器回應錯誤',
    en: 'Server returned an error',
    ja: 'サーバーがエラーを返しました'
  },
  modelSourceNetwork: {
    'zh-Hant': '連線失敗或下載中斷',
    en: 'Connection failed or download interrupted',
    ja: '接続に失敗したか、ダウンロードが中断されました'
  },
  modelSourceConfig: {
    'zh-Hant': '模型設定格式不正確',
    en: 'Invalid model settings',
    ja: 'モデル設定の形式が正しくありません'
  },
  modelSourceIntegrity: {
    'zh-Hant': '模型檔案大小或雜湊驗證失敗',
    en: 'Model size or checksum verification failed',
    ja: 'モデルのサイズまたはチェックサムの検証に失敗しました'
  },
  modelSourcesFailed: {
    'zh-Hant': 'Hugging Face 與備援來源皆無法載入模型，請檢查網路後重試。',
    en: 'Hugging Face and the fallback source could not load the model. Check your connection and try again.',
    ja: 'Hugging Face と予備の配信元の両方でモデルを読み込めませんでした。接続を確認して再試行してください。'
  },
  modelDownload: {
    'zh-Hant': '首次使用：正在下載模型（約 {size} MB）',
    en: 'First run: downloading model (about {size} MB)',
    ja: '初回：モデルをダウンロード中（約 {size} MB）'
  },
  modelFailed: {
    'zh-Hant': '模型下載失敗，請確認網路連線後再試。',
    en: 'Model download failed. Check your connection and try again.',
    ja: 'モデルのダウンロードに失敗しました。ネット接続を確認してください。'
  },
  modelProgress: {
    'zh-Hant': '首次下載模型 {percent}%',
    en: 'Downloading model {percent}%',
    ja: 'モデルをダウンロード中 {percent}%'
  },
  modelVerifyFailed: {
    'zh-Hant': '模型檔案驗證失敗，請重新下載。',
    en: 'Model verification failed. Please download it again.',
    ja: 'モデルの検証に失敗しました。再ダウンロードしてください。'
  },
  initKey: {
    'zh-Hant': '正在初始化 S-KEY 調性分析',
    en: 'Initializing S-KEY analysis',
    ja: 'S-KEY 解析を初期化中'
  },
  analyzeKey: {
    'zh-Hant': '正在分析全曲調性（S-KEY）',
    en: 'Analyzing the global key (S-KEY)',
    ja: '全曲のキーを解析中（S-KEY）'
  },
  uploadSize: {
    'zh-Hant': '無法讀取上傳大小。',
    en: 'Could not read the upload size.',
    ja: 'アップロードサイズを読み取れません。'
  },
  apiUnsupported: {
    'zh-Hant': '請選擇 WAV、MP3、FLAC、M4A、OGG、AIFF 或 AAC 音訊。',
    en: 'Choose WAV, MP3, FLAC, M4A, OGG, AIFF or AAC audio.',
    ja: 'WAV・MP3・FLAC・M4A・OGG・AIFF・AAC の音声を選択してください。'
  },
  apiEmpty: {
    'zh-Hant': '檔案是空的，請重新選擇音訊。',
    en: 'This file is empty. Please choose another audio file.',
    ja: '空のファイルです。別の音声を選択してください。'
  },
  apiIncomplete: {
    'zh-Hant': '分析未完成，請重試或換一個音訊檔。',
    en: 'Analysis did not complete. Try again or choose another audio file.',
    ja: '解析が完了しませんでした。再試行するか別の音声を選択してください。'
  },
  apiExpired: {
    'zh-Hant': '下載已過期，請重新分析音訊。',
    en: 'Download expired. Please analyze the audio again.',
    ja: 'ダウンロード期限が切れました。再度解析してください。'
  },
  ffmpegMissing: {
    'zh-Hant': '找不到 FFmpeg，請先安裝後再試。',
    en: 'FFmpeg was not found. Install it and try again.',
    ja: 'FFmpeg が見つかりません。インストールして再試行してください。'
  },
  decodeTimeout: {
    'zh-Hant': '音訊解碼逾時，請換一個檔案或縮短音訊。',
    en: 'Audio decoding timed out. Use another file or a shorter clip.',
    ja: 'デコードがタイムアウトしました。別のファイルか短い音声を使用してください。'
  },
  apiDecode: {
    'zh-Hant': '無法讀取這個音訊檔，請確認檔案沒有損壞。',
    en: 'Cannot read this audio file. Check that it is not corrupted.',
    ja: '音声を読み取れません。ファイルが破損していないか確認してください。'
  },
  apiTooLong: {
    'zh-Hant': '音訊超過 20 分鐘，請先截取較短的片段。',
    en: 'Audio exceeds 20 minutes. Please use a shorter clip.',
    ja: '20 分を超えています。短い音声に切り出してください。'
  },
  apiInvalid: {
    'zh-Hant': '音訊含有無效的取樣數值，請重新匯出後再試。',
    en: 'Audio contains invalid samples. Export it again and retry.',
    ja: '無効なサンプル値が含まれています。再度書き出してください。'
  },
  language: {
    'zh-Hant': '語言',
    en: 'Language',
    ja: '言語'
  }
};
