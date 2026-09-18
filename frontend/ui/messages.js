// Shared language catalog. Keys are stable across all three locales.
export const messages = {
  pitchSynthError: {
    en: 'Could not start the synthesizer. Try pressing Play again.',
    ja: 'シンセサイザーを起動できませんでした。再生ボタンをもう一度押してください。',
    'zh-Hant': '無法啟動合成器，請再次按下播放鍵。'
  },
  pitchSeekAria: {
    en: 'Synthesizer playback position',
    ja: 'シンセサイザーの再生位置',
    'zh-Hant': '合成器播放位置'
  },
  pitchSynthPause: { en: 'Pause', ja: '一時停止', 'zh-Hant': '暫停' },
  pitchSynthPlay: { en: 'Play notes', ja: '音符を再生', 'zh-Hant': '播放音符' },
  pitchSynthTitle: { en: 'Synthesizer preview', ja: 'シンセサイザー試聴', 'zh-Hant': '合成器試聽' },
  noAudioTrack: {
    en: 'This file has no audio track. Choose a file that contains audio.',
    ja: 'このファイルには音声トラックがありません。音声を含むファイルを選択してください。',
    'zh-Hant': '檔案沒有音軌，請選擇含有音訊的檔案。'
  },
  videoDecodeFailed: {
    en: 'This video has no decodable audio track, or its audio codec is unsupported by your browser. Check that it contains audio, use Local Python, or export WAV/MP3 first.',
    ja: 'この動画にはデコード可能な音声トラックがないか、ブラウザーが音声コーデックに対応していません。音声が含まれることを確認し、Local Python を使うか、WAV／MP3 に書き出してください。',
    'zh-Hant':
      '影片沒有可解碼的音軌，或瀏覽器不支援其音訊編碼。請確認影片含有音訊，改用本機 Python，或先匯出 WAV／MP3。'
  },
  exportErrorTitle: {
    en: 'ONNX export error · maximum absolute difference',
    ja: 'ONNX 変換誤差 · 最大絶対差',
    'zh-Hant': 'ONNX 匯出誤差・最大絕對差'
  },
  exportBeatError: {
    en: 'Beat/downbeat logits, tested at 63, 128, 1,264 and 1,500 spectrogram frames.',
    ja: '拍・小節頭の logits を、スペクトログラムの長さ 63・128・1,264・1,500 フレームで比較。',
    'zh-Hant': '節拍／小節首拍原始輸出（logits）；測試 63、128、1,264 與 1,500 幀頻譜。'
  },
  exportKeyError: {
    en: '24 key scores, tested on clips of 3, about 25 and about 75 seconds.',
    ja: '24種類の調のスコアを、3秒・約25秒・約75秒の音声で比較。',
    'zh-Hant': '24 個調性分數；測試 3 秒、約 25 秒與約 75 秒音訊。'
  },
  exportErrorScope: {
    en: 'These are the recorded maxima for the pinned Hugging Face exports, comparing PyTorch with ONNX Runtime on CPU using identical inputs. They are not BPM errors, accuracy percentages or guaranteed bounds for other audio, exports or browser/GPU runtimes.',
    ja: '固定バージョンの Hugging Face モデルの変換時に、同じ入力で PyTorch と CPU 上の ONNX Runtime を比較した最大値です。BPM の誤差や正解率ではなく、別の音声・変換環境・ブラウザー／GPU での誤差の上限を保証するものでもありません。',
    'zh-Hant':
      '以上為目前固定版本 Hugging Face 模型的匯出驗證最大值，以相同輸入比較 PyTorch 與 CPU 上的 ONNX Runtime。不是 BPM 誤差或準確率百分比，也不代表其他音訊、匯出環境或瀏覽器／GPU 的誤差上限。'
  },
  exportErrorRecord: { en: 'Validation record', ja: '検証記録', 'zh-Hant': '驗證紀錄' },
  exportBeatRecordAria: {
    en: 'Beat This! export validation record (opens in a new tab)',
    ja: 'Beat This! の変換検証記録（新しいタブで開く）',
    'zh-Hant': 'Beat This! 匯出驗證紀錄（在新分頁開啟）'
  },
  exportKeyRecordAria: {
    en: 'S-KEY export validation record (opens in a new tab)',
    ja: 'S-KEY の変換検証記録（新しいタブで開く）',
    'zh-Hant': 'S-KEY 匯出驗證紀錄（在新分頁開啟）'
  },
  comparePrecision: {
    en: 'Model weights: FP32',
    ja: 'モデルの重み：FP32',
    'zh-Hant': '模型權重：FP32'
  },
  compareAccuracyTitle: { en: 'Recognition accuracy', ja: '認識精度', 'zh-Hant': '辨識精確度' },
  reportTitle: {
    en: 'Found a problem?',
    ja: '問題が見つかりましたか？',
    'zh-Hant': '遇到問題了嗎？'
  },
  reportDescription: {
    en: 'Report bugs or share suggestions on GitHub Issues. Include your browser, operating system and analysis engine to help us investigate.',
    ja: '不具合の報告や改善の提案は GitHub Issues へ。調査のため、ブラウザー・OS・解析エンジンを添えてください。',
    'zh-Hant':
      '歡迎透過 GitHub Issues 回報問題或提供建議，並附上瀏覽器、作業系統與使用的分析引擎，方便我們查找原因。'
  },
  reportLink: { en: 'Report an issue', ja: '問題を報告', 'zh-Hant': '回報問題' },
  reportLinkAria: {
    en: 'Report an issue on GitHub (opens in a new tab)',
    ja: 'GitHub で問題を報告（新しいタブで開く）',
    'zh-Hant': '前往 GitHub 回報問題（在新分頁開啟）'
  },

  rangePythonUpdate: {
    en: 'Local Python did not confirm the selected range. Update the project and restart the service, then try again.',
    ja: 'Local Python が選択範囲を確認できませんでした。プロジェクトを更新してサービスを再起動し、再試行してください。',
    'zh-Hant': '本機 Python 未確認選取範圍，請更新專案並重新啟動服務後再試。'
  },
  rangeError: {
    en: 'Invalid selection. Choose at least 1 second within the audio.',
    ja: '選択範囲が無効です。音声内で1秒以上の範囲を選んでください。',
    'zh-Hant': '選取範圍無效，請選擇至少 1 秒且不超出音訊的片段。'
  },
  rangeTitle: { en: 'Select an analysis range', ja: '解析範囲を選択', 'zh-Hant': '選取分析範圍' },
  rangeReset: { en: 'Whole track', ja: '曲全体', 'zh-Hant': '整首音訊' },
  rangeStart: { en: 'Start (seconds)', ja: '開始（秒）', 'zh-Hant': '起點（秒）' },
  rangeEnd: { en: 'End (seconds)', ja: '終了（秒）', 'zh-Hant': '終點（秒）' },
  rangeAnalyze: { en: 'Analyze selected range', ja: '選択範囲を解析', 'zh-Hant': '分析選取範圍' },
  rangeSummary: {
    en: '{start}–{end} s · {duration} s selected',
    ja: '{start}〜{end} 秒 · 選択範囲 {duration} 秒',
    'zh-Hant': '{start}–{end} 秒・已選取 {duration} 秒'
  },
  rangeWhole: { en: 'Whole track selected', ja: '曲全体を選択', 'zh-Hant': '已選取整首音訊' },
  rangeUnavailable: {
    en: 'Range selection becomes available once the duration is known. If your browser cannot decode this format, Local Python can analyze the whole file first.',
    ja: '長さを取得すると範囲を選択できます。ブラウザーがデコードできない形式は、まず Local Python でファイル全体を解析できます。',
    'zh-Hant': '取得音訊長度後即可選取範圍。若瀏覽器無法解碼此格式，可先使用本機 Python 分析整首。'
  },
  rangeInvalid: {
    en: 'Choose a valid range of at least 1 second within the audio.',
    ja: '音声内で1秒以上の有効な範囲を選んでください。',
    'zh-Hant': '請選擇至少 1 秒且不超出音訊的有效範圍。'
  },
  rangeHelp: {
    en: 'Uploads are analyzed in full automatically. To analyze a clip, drag either handle or enter seconds, then press Analyze. Playback previews this range. Minimum 1 second; key detection needs 3 seconds. Your original file is unchanged.',
    ja: '音声の追加後は曲全体を自動解析します。一部だけ解析する場合はバーの両端または秒数で範囲を指定し、解析を押してください。再生も選択範囲のみです。最低1秒、調の推定には3秒必要です。元のファイルは変更されません。',
    'zh-Hant':
      '加入音訊後會自動分析全曲。若要分析片段，請拖動雙把手或輸入秒數後按下分析；播放按鈕僅試聽這段。範圍至少 1 秒，調性分析需 3 秒。原始檔案不會被修改。'
  },
  rangeReady: { en: 'Ready to analyze', ja: '解析の準備完了', 'zh-Hant': '可開始分析' },
  rangeReading: {
    en: 'Preparing audio & waveform',
    ja: '音声と波形を準備中',
    'zh-Hant': '正在準備音訊與波形'
  },
  rangeNoWaveform: {
    en: 'Waveform preview unavailable',
    ja: '波形を表示できません',
    'zh-Hant': '無法預覽波形'
  },
  rangeKey: {
    en: 'Selected range key · S-KEY',
    ja: '選択範囲の調 · S-KEY',
    'zh-Hant': '選取範圍調性・S-KEY'
  },
  rangeResult: {
    en: 'Results: {start}–{end} s of the original audio. MIDI starts at 0 s of this clip; align it with the clip, or place it at {start} s in the original timeline.',
    ja: '解析結果：元の音声の {start}〜{end} 秒。MIDI の0秒はこの範囲の開始位置です。切り出した音声の先頭、または元のタイムラインの {start} 秒に合わせてください。',
    'zh-Hant':
      '分析結果：原音訊的 {start}–{end} 秒。MIDI 的 0 秒對應片段起點；請與裁切片段對齊，或放在原時間軸的 {start} 秒處。'
  },
  rangeFullResult: {
    en: 'Results cover the whole track. Align the tempo MIDI with the start of the original audio.',
    ja: '曲全体の解析結果です。テンポ MIDI は元の音声の先頭に合わせてください。',
    'zh-Hant': '此結果涵蓋整首音訊，Tempo MIDI 請與原音訊起點對齊。'
  },
  rangeVariable: {
    en: 'Average BPM for the selected range; MIDI tempo changes follow its detected beats. The MIDI timeline starts at the beginning of the selected clip.',
    ja: '選択範囲の平均 BPM です。MIDI のテンポ変化は検出した拍に従い、時間軸は選択範囲の先頭から始まります。',
    'zh-Hant': '顯示選取範圍的平均 BPM；MIDI 依片段內拍點寫入變速，時間軸從片段起點開始。'
  },

  compareTitle: {
    en: 'ONNX vs. PyTorch: model differences',
    ja: 'ONNX と PyTorch のモデルの違い',
    'zh-Hant': 'ONNX 與 PyTorch 兩種模型的差異'
  },
  compareIntro: {
    en: 'Both engines analyze tempo, key and pitch. Browser mode uses ONNX; Local Python uses PyTorch for Beat This! and S-KEY, and ONNX Runtime for GAME.',
    ja: 'どちらもテンポ・キー・音高を解析します。ブラウザーは ONNX、Local Python は Beat This! と S-KEY に PyTorch、GAME に ONNX Runtime を使用します。',
    'zh-Hant':
      '兩種引擎皆分析拍速、調性與音高。瀏覽器使用 ONNX；Local Python 的 Beat This!／S-KEY 使用 PyTorch，GAME 則使用 ONNX Runtime。'
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
    en: 'ONNX Runtime Web runs in a Web Worker. Beat This! and GAME try WebGPU with WASM fallback; S-KEY uses WASM. GAME processes short overlapping chunks.',
    ja: 'Web Worker 内の ONNX Runtime Web で実行。Beat This! と GAME は WebGPU を優先し、WASM に切り替え可能です。S-KEY は WASM。GAME は重複する短区間ごとに処理します。',
    'zh-Hant':
      'ONNX Runtime Web 在 Web Worker 執行。Beat This! 與 GAME 優先 WebGPU，失敗改用 WASM；S-KEY 使用 WASM。GAME 以有重疊的短片段分批處理。'
  },
  comparePythonRuntime: {
    en: 'FFmpeg decodes audio. Beat This! and S-KEY run in PyTorch; GAME runs the same official ONNX graphs with ONNX Runtime. All use CPU.',
    ja: 'FFmpeg でデコードし、Beat This! と S-KEY は PyTorch、GAME は同一の公式 ONNX を ONNX Runtime で実行します。すべて CPU を使用します。',
    'zh-Hant':
      'FFmpeg 解碼音訊；Beat This! 與 S-KEY 由 PyTorch 執行，GAME 使用同一份官方 ONNX 搭配 ONNX Runtime，皆在 CPU 運算。'
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
    en: 'Beat This! and S-KEY exports have PyTorch conversion checks. GAME uses unchanged official FP32 ONNX; its vocal-range accuracy and PyTorch conversion error have not been benchmarked here. FP32 is numerical precision, not recognition accuracy. GAME sampling and engine differences may change note boundaries and range estimates.',
    ja: 'Beat This! と S-KEY は PyTorch との変換検証済みです。GAME は未変更の公式 FP32 ONNX を使用し、本サイトでは音域の正解率や PyTorch 変換誤差を評価していません。FP32 は数値精度です。GAME のサンプリングや実行環境により境界・音域の推定が変わる場合があります。',
    'zh-Hant':
      'Beat This! 與 S-KEY 已有 PyTorch 匯出比對。GAME 使用未修改的官方 FP32 ONNX，尚未在此評測歌聲音域準確率或 PyTorch 匯出誤差。FP32 代表數值精度；GAME 的取樣與引擎差異可能造成音符邊界及音域估計變動。'
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
    en: 'Select Local Python and add an audio file to start whole-track analysis automatically. To analyze a clip, adjust the range and press Analyze selected range. Switching engines analyzes the current range. After starting the service, press Analyze again to retry a failed attempt.',
    ja: 'Local Python を選び、音声を追加すると曲全体の解析が自動で始まります。一部だけ解析する場合は範囲を指定し、「選択範囲を解析」を押します。エンジンの切り替えでも現在の範囲を解析します。失敗した場合は、サービス起動後に解析ボタンで再試行できます。',
    'zh-Hant':
      '選擇 Local Python，加入音訊後會自動分析全曲。若只分析片段，請調整範圍後按「分析選取範圍」。切換引擎也會分析目前範圍；若先前失敗，可在服務啟動後再按分析重試。'
  },
  pythonGuideFirstRun: {
    en: 'Beat/key weights download on first use. GAME uses the bundled assets/models/game/1.0.3-small files and Python ONNX Runtime. After updating, reinstall requirements.txt and restart FastAPI. Temporary audio is deleted after analysis; MIDI downloads last up to one hour.',
    ja: '拍・キーの重みは初回に取得します。GAME は同梱の assets/models/game/1.0.3-small と Python ONNX Runtime を使用します。更新後は requirements.txt を再インストールし、FastAPI を再起動してください。一時音声は解析後に削除し、MIDI は最長1時間保持します。',
    'zh-Hant':
      '拍點／調性權重於首次使用下載。GAME 使用專案內 assets/models/game/1.0.3-small 與 Python ONNX Runtime。更新後請重新安裝 requirements.txt 並重啟 FastAPI；分析後刪除音訊暫存，MIDI 保留最長一小時。'
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
    'zh-Hant': '（推薦）在此裝置分析，不上傳音訊。切換引擎會分析目前選取的範圍。',
    en: '(Recommended) Analyze on this device without uploading audio. Switching engines analyzes the selected range.',
    ja: '（推奨）音声をアップロードせず、この端末で解析します。エンジンを切り替えると選択範囲を解析します。'
  },
  enginePythonHelp: {
    en: 'Audio is sent over HTTP to the FastAPI service at http://127.0.0.1:8765 on this device. See the setup guide below; switching analyzes the selected range.',
    ja: '音声を HTTP 経由で、この端末の FastAPI サービス http://127.0.0.1:8765 に送信します。下の起動ガイドをご覧ください。切り替えると選択範囲を解析します。',
    'zh-Hant':
      '音訊透過 HTTP 傳送至本機 FastAPI 服務 http://127.0.0.1:8765。請參閱下方啟動教學；切換後會分析目前選取的範圍。'
  },
  pageTitle: {
    en: 'Key & Tempo — BPM, Key & Vocal Range',
    ja: 'Key & Tempo — BPM・キー・歌声音域',
    'zh-Hant': 'Key & Tempo — BPM、調性與歌聲音域'
  },
  metaDescription: {
    en: 'Analyze BPM, meter, key and estimated vocal range on your device. Preview detected pitches and download a MIDI tempo map.',
    ja: 'BPM・拍子・キー・歌声の推定音域を端末で解析。音高の位置を試聴し、MIDI テンポマップをダウンロード。',
    'zh-Hant': '在裝置上分析 BPM、拍號、調性與估計歌聲音域，試聽音高位置並下載 MIDI 速度圖。'
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
    en: 'Drop in music. Discover its tempo, key and vocal range.',
    ja: '音楽をドロップして、テンポ・キー・歌声の音域を調べよう。',
    'zh-Hant': '拖入音樂，找到拍速、調性與歌聲音域。'
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
    en: 'Audio files or MP4/MOV video soundtracks.',
    ja: '音声ファイル・MP4／MOV の音声を解析。',
    'zh-Hant': '支援音訊檔，MP4／MOV 影片只分析音軌。'
  },
  chooseFile: {
    en: 'Choose audio or video',
    ja: '音声・動画ファイルを選択',
    'zh-Hant': '選擇音訊或影片'
  },
  dropRelease: {
    'zh-Hant': '放開以分析全曲',
    en: 'Release to analyze the whole track',
    ja: 'ドロップして曲全体を解析'
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
    en: 'Audio stays in your browser. First use downloads about 134 MB of models, plus the runtime; verified models are cached when available.',
    ja: '音声はブラウザー内で処理します。初回は約 134 MB のモデルと実行環境をダウンロードし、可能な場合は検証済みモデルをキャッシュします。',
    'zh-Hant': '音訊留在瀏覽器內。首次需下載約 134 MB 模型及執行環境，驗證後會嘗試快取。'
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
    en: 'Find beats, tempo, meter, key and singing pitches.',
    ja: '拍・テンポ・拍子・キー・歌声の音高を検出。',
    'zh-Hant': '分析拍點、拍速、拍號、調性與歌聲音高。'
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
    en: 'Three specialized models for rhythm, key and singing pitch. Know what powers your results.',
    ja: 'リズム・キー・歌声の音高を担当する3つのモデル。解析結果を支える仕組みを紹介します。',
    'zh-Hant': '三個模型分別分析節拍、調性與歌聲音高，了解分析結果的來源。'
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
    en: 'All results are estimates. Pitch and key are displayed here; MIDI still contains only tempo and any detected time signature, without notes.',
    ja: 'すべて推定結果です。音高とキーは画面に表示し、MIDI にはテンポと検出できた拍子のみを含めます。音符は含みません。',
    'zh-Hant': '結果皆為模型估計。音高與調性顯示於頁面；MIDI 仍只含速度與可判定的拍號，不包含音符。'
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
    en: 'Unsupported format. Choose WAV, MP3, FLAC, M4A, OGG, AIFF, AAC, MP4 or MOV.',
    ja: '未対応の形式です。WAV・MP3・FLAC・M4A・OGG・AIFF・AAC・MP4・MOV を選択してください。',
    'zh-Hant': '不支援這個格式，請選擇 WAV、MP3、FLAC、M4A、OGG、AIFF、AAC、MP4 或 MOV。'
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
    en: 'Choose a WAV, MP3, FLAC, M4A, OGG, AIFF, AAC, MP4 or MOV file.',
    ja: 'WAV・MP3・FLAC・M4A・OGG・AIFF・AAC・MP4・MOV のファイルを選択してください。',
    'zh-Hant': '請選擇 WAV、MP3、FLAC、M4A、OGG、AIFF、AAC、MP4 或 MOV 檔案。'
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
  },
  pitchTitle: {
    en: 'Detected vocal range',
    ja: '検出された歌声の音域',
    'zh-Hant': '偵測到的歌聲音域'
  },
  pitchLowest: {
    en: 'Lowest note',
    ja: '最低音',
    'zh-Hant': '最低音'
  },
  pitchHighest: {
    en: 'Highest note',
    ja: '最高音',
    'zh-Hant': '最高音'
  },
  pitchLowestAria: {
    en: 'Play lowest detected note on synthesizer',
    ja: '検出された最低音をシンセサイザーで試聴',
    'zh-Hant': '以合成器播放最低音'
  },
  pitchHighestAria: {
    en: 'Play highest detected note on synthesizer',
    ja: '検出された最高音をシンセサイザーで試聴',
    'zh-Hant': '以合成器播放最高音'
  },
  pitchChartAria: {
    en: 'Estimated note pitches over the selected audio timeline',
    ja: '選択した音声の音高と時間の推定グラフ',
    'zh-Hant': '所選音訊的音高與時間估計圖'
  },
  pitchInitial: {
    en: 'Note estimates for this track or selection.',
    ja: '全曲または選択範囲の音高を推定します。',
    'zh-Hant': '估計整首或所選片段的音高。'
  },
  pitchWaiting: {
    en: 'Waiting for GAME pitch analysis…',
    ja: 'GAME の音高解析を待機中…',
    'zh-Hant': '等候 GAME 音高分析…'
  },
  pitchSummary: {
    en: '{count} accepted segments · {span} semitones',
    ja: '採用区間 {count} 件 · {span} 半音',
    'zh-Hant': '{count} 個有效片段 · 音域跨度 {span} 半音'
  },
  pitchCaution: {
    en: 'Estimated from this recording, not the singer’s full vocal range. Harmony and instruments may be included; confirm by listening.',
    ja: 'この録音からの推定であり、歌手が出せる音域全体ではありません。ハーモニーや楽器を含む場合があるため、試聴して確認してください。',
    'zh-Hant': '這是此錄音的估計音域，不代表歌手完整音域。可能包含和聲或樂器，請搭配試聽確認。'
  },
  pitchPreviewHint: {
    en: 'Click the chart to play from that position. Lowest/highest buttons play a single synthesized tone; the audio player previews the original recording.',
    ja: 'グラフをクリックすると、その位置から合成音で再生します。最低音・最高音のボタンは単音を試聴できます。元の録音は音声プレーヤーで再生してください。',
    'zh-Hant':
      '點選音符圖可從該處開始合成器播放；最低／最高音按鈕會單獨試聽該音高。原曲請使用音訊播放器試聽。'
  },
  pitchFailed: {
    en: 'Pitch analysis failed. Tempo/key results remain available; check the model source or update Local Python and retry.',
    ja: '音高解析に失敗しました。テンポ・キーの結果は引き続き利用できます。モデルの取得元または Local Python の更新を確認して再試行してください。',
    'zh-Hant': '音高分析未完成，BPM／調性結果仍可使用。請檢查模型來源，或更新本機 Python 後重試。'
  },
  pitchInterrupted: {
    en: 'Analysis did not complete. Retry to obtain pitch results.',
    ja: '解析が完了しませんでした。音高の結果を取得するには再試行してください。',
    'zh-Hant': '分析未完成，請重新分析以取得音高結果。'
  },
  pitchMissing: {
    en: 'This Local Python service does not return pitch results. Update the project, install requirements.txt and restart FastAPI.',
    ja: 'この Local Python サービスは音高結果を返しません。プロジェクトを更新し、requirements.txt をインストールして FastAPI を再起動してください。',
    'zh-Hant':
      '此本機 Python 尚未回傳音高結果。請更新專案、安裝 requirements.txt 並重新啟動 FastAPI。'
  },
  pitchSilent: {
    en: 'No audible signal; pitch cannot be estimated.',
    ja: '有効な音声信号がないため、音高を推定できません。',
    'zh-Hant': '音訊無有效訊號，無法估計音高。'
  },
  pitchNoNotes: {
    en: 'No voiced note segments passed the filter. Try a clearer vocal passage.',
    ja: '条件を満たす有声音の区間がありません。歌声が明瞭な部分を選んでください。',
    'zh-Hant': '沒有通過篩選的有聲音符，請選擇歌聲較清楚的片段。'
  },
  pitchInit: {
    en: 'Initializing GAME pitch engine · {engine}',
    ja: 'GAME 音高エンジンを初期化中 · {engine}',
    'zh-Hant': '正在初始化 GAME 音高引擎 · {engine}'
  },
  pitchProgress: {
    en: 'Analyzing pitch {current}/{total} · GAME {engine}',
    ja: '音高を解析中 {current}/{total} · GAME {engine}',
    'zh-Hant': '正在分析音高 {current}/{total} · GAME {engine}'
  },
  pitchCpuFallback: {
    en: 'GAME GPU unavailable; retrying pitch analysis on CPU.',
    ja: 'GAME の GPU 処理が利用できないため、CPU で音高解析を再試行します。',
    'zh-Hant': 'GAME GPU 無法使用，改由 CPU 重新分析音高。'
  },
  pitchTask: {
    en: 'Singing pitch & note range',
    ja: '歌声の音高と音域',
    'zh-Hant': '歌聲音高與音域'
  },
  pitchDescription: {
    en: 'Estimates singing-note boundaries and pitches. The app displays a note timeline and the lowest and highest accepted pitches for the track or selected range.',
    ja: '歌声の音符の境界と音高を推定し、全曲または選択範囲の音高グラフと、採用された最低音・最高音を表示します。',
    'zh-Hant':
      '估計歌聲音符邊界與音高，呈現整首或所選片段的音符時間圖，以及篩選後的最低音與最高音。'
  },
  pitchLimit: {
    en: 'Not a lead-vocal separator: harmony, accompaniment and octave errors can affect the range. Notes shorter than 80 ms are excluded. No labeled vocal-range accuracy benchmark has been completed.',
    ja: '主旋律の歌声を分離するモデルではありません。ハーモニー・伴奏・オクターブ誤りが音域に影響します。80 ms 未満の音符は除外します。正解ラベルによる音域精度評価は未実施です。',
    'zh-Hant':
      '此模型不負責分離主唱；和聲、伴奏與八度誤判可能影響音域。排除短於 80 ms 的音符，尚未完成人工標註音域的準確率評測。'
  },
  pitchLicense: {
    en: 'Weights: CC BY-NC-SA 4.0 (attribution, noncommercial, ShareAlike). Code: MIT. Credit: openvpi/GAME contributors; original model release by yqzhishen.',
    ja: '重み：CC BY-NC-SA 4.0（表示・非営利・継承）。コード：MIT。開発：openvpi/GAME の貢献者、元モデルの公開者：yqzhishen。',
    'zh-Hant':
      '權重：CC BY-NC-SA 4.0（署名、非商業、相同方式分享）。程式碼：MIT。感謝 openvpi/GAME 貢獻者；原模型由 yqzhishen 發布。'
  },
  pitchWeights: {
    en: 'Model weights',
    ja: 'モデルの重み',
    'zh-Hant': '模型權重'
  },
  pitchLicenseLink: {
    en: 'Model license',
    ja: 'モデルのライセンス',
    'zh-Hant': '模型授權'
  },
  pitchCredits: {
    en: 'Original model & credits',
    ja: '元モデルと謝辞',
    'zh-Hant': '原模型與致謝'
  }
};
