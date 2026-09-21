# Enhanced pitch analysis

User-approved implementation: optional single standard htdemucs separation, release the separator before loading GAME Large 1.0.3. Default analysis remains unchanged. Beat/key always receive the original mix.

1. Add explicit opt-in and multilingual progress, result labels and model acknowledgments.
2. Verify pinned model files, hashes and licenses. Keep download locations in a shared JSON configuration (JavaScript adapter for existing imports).
3. Match Demucs normalized periodic-Hann STFT and inverse in JavaScript and Python; use fixed 7.8 s chunks, 25% overlap, deterministic triangular overlap-add and zero-padded final chunks.
4. Isolate browser separation in a disposable Worker, then load GAME Large. Native pipeline uses sequential subprocesses. Fail explicitly without silently substituting Small or uploading audio.
5. Verify DSP parity, lifecycle, API, standard-mode regressions, real model inference and production build. Document measured limits separately from estimates.

Validation: Node tests, Python unit tests, Torch/JavaScript preprocessing comparison, real separated audio/GAME inference, frontend engine switching and failure handling, formatting and static build.

Completed validation: 73 JavaScript tests, 53 Python tests, format/build checks, native DSP parity, real WebGPU and local Python inference on an 8-second excerpt (14 notes each). Enhanced weights mirrored with attribution on Hugging Face and GitHub Release; public file sizes verified. Two-site Pages build deduplicates optional weights (approximately 899 MB combined).
