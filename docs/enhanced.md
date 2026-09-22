# Enhanced vocal analysis / 強化歌聲分析

This optional mode runs **one htdemucs model → releases separation memory → official GAME Large v1.0.3**. It is off by default. Standard analysis keeps GAME Small; Beat This! and S-KEY analyze the original mix in both modes. New files automatically analyze the whole track. Toggling enhancement reanalyzes the current selection, and the control is disabled while busy.

## Runtime and downloads

- **Browser ONNX:** htdemucs and GAME Large run in sequence with WebGPU. Enhanced mode needs more time and memory. It does not silently fall back to GAME Small, WASM enhancement, Local Python or cloud uploads.
- **Local Python:** explicitly selecting this engine sends the original audio, selected range and `enhanced=true` to the local service. htdemucs and GAME Large run in separate ONNX Runtime CPU processes. The separation process exits before GAME Large starts; PyTorch is used only for htdemucs STFT transforms, not its model inference.
- Extra models download only when enhanced analysis is requested. Model source URLs are configured centrally in `frontend/inference/download-sources.json`; The [Hugging Face mirror](https://huggingface.co/aaatmy/music-detection-enhanced) is primary. Browsers fall back to the shared GitHub Pages `enhanced-models/v1/` directory; Local Python uses the [GitHub Release](https://github.com/Hikari-Tsai/music-detection/releases/tag/enhanced-models-v1) fallback. Download size and SHA-256 are checked before use. Extra downloads total **568.1 MB / 541.8 MiB**: htdemucs ONNX **174.3 MB / 166.2 MiB** plus GAME Large **393.8 MB / 375.6 MiB**. This excludes the runtime and standard analysis resources.
- Result metadata uses `pitch_mode: "enhanced"` and `pitch.model: "GAME Large v1.0.3"`. An enhancement failure uses `pitch_status: "error"` and `pitch_reason: "enhancement_failed"`; valid tempo/key results and tempo-only MIDI remain available. Unsupported browser WebGPU is reported explicitly.

Local Python uses a fresh child process for each model stage and waits for the separation process to exit before starting GAME Large. Previously cached GAME Small sessions are released before enhancement, and standard pitch inference waits until enhancement finishes. Each child has a one-hour timeout; a timeout kills and reaps that child and reports an enhancement failure. Closing or canceling an HTTP request currently stops the client from waiting but does **not** immediately stop native computation. Browser worker cancellation and native HTTP cancellation therefore have different behavior.

Both engines use deterministic 7.8-second segments with 25% overlap, triangular overlap weights, and zeros appended to the final short segment. They use a single standard `htdemucs` checkpoint without random time shifts. This differs from the official Demucs CLI's contextual center-padding and optional shift averaging; it is not `htdemucs_ft`. HTDemucs STFT/iSTFT padding, normalized periodic Hann windows, channel order and branch reconstruction follow the upstream model. The mono vocal output is scaled down only when its peak exceeds 1, preserving its sample count and timing. Numerical DSP checks are recorded in [enhanced-validation.json](enhanced-validation.json); they do not measure pitch accuracy or claim equivalence to the CLI's full inference policy.

A [native integration smoke test](enhanced-native-validation.json) on an eight-second selection returned 14 GAME Large notes, preserved the selected range, and produced tempo/key results plus a 14-note vocal MIDI track. The full local analysis took approximately 14.7 seconds on the validation host. This confirms the pipeline runs; it is not an accuracy benchmark.

## Sources and licenses

| Component | Source | License |
| --- | --- | --- |
| Demucs / single htdemucs | [Meta Demucs](https://github.com/facebookresearch/demucs) | MIT |
| Browser htdemucs export | [Ghilda/htdemucs-onnx](https://huggingface.co/Ghilda/htdemucs-onnx), community ONNX export of the official weights | MIT |
| GAME Large v1.0.3 | [Official openvpi release](https://github.com/openvpi/GAME/releases/tag/v1.0.3) | Weights: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); code: MIT |

GAME credit: openvpi/GAME contributors; original model release by yqzhishen. The community htdemucs export is distinct from an official Meta ONNX release. Our download mirror is [aaatmy/music-detection-enhanced](https://huggingface.co/aaatmy/music-detection-enhanced); see the [Demucs license](../third_party/Demucs-LICENSE) and [ONNX export notice](../third_party/HTDemucs-ONNX-NOTICE).

## Interpretation / 結果限制

A vocal stem can contain backing vocals, other singers and instrumental leakage. Separation artifacts, octave errors and note segmentation can change the estimated range. The app reports pitches present in the selected recording, not a singer’s full vocal capability. Enhanced mode has no project-specific labeled accuracy benchmark and does not guarantee an improvement. The MIDI track name `Lead Vocal` does not establish that the notes belong only to the lead singer.

強化模式先分離歌聲，再以較大的 GAME 模型分析；分離歌聲仍可能包含和聲、其他歌手與伴奏殘留，也可能引入失真。結果是目前錄音／片段的音高估計，不代表歌手完整能力。尚未完成標註準確率評測，不保證比一般模式更準。MIDI 的 `Lead Vocal` 軌名也不代表已單獨隔離主唱。

Browser functional validation: [recorded WebGPU smoke test](enhanced-browser-validation.json) and `TEST_AUDIO=/path/to/clip.wav node scripts/test_enhanced_browser.mjs` (requires `npm run serve` and the locally verified enhanced model cache). The test checks that the separation Worker terminates before GAME initializes. Network download time is excluded from this local model-cache timing.
