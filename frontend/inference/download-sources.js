// All browser model/runtime download locations live here. Keep trailing slashes.
// Relative fallback URLs resolve against analysis-worker.js, preserving main,
// staging/ and the local FastAPI /runtime/ deployment paths.
// Pin model revisions so weights and preprocessing stay together.
const runtimeVersion = '1.24.3';

export const DOWNLOAD_SOURCES = {
  beat: {
    primaryBaseURL:
      'https://huggingface.co/aaatmy/beat-this-onnx/resolve/e2c0d4376fac8141905a8312c1b327849751d59c/',
    primaryName: 'Hugging Face',
    fallbackBaseURL: './models/'
  },
  key: {
    primaryBaseURL:
      'https://huggingface.co/aaatmy/skey-onnx/resolve/c04b6a2bc1d82e50b46d8669560d056f3a2344ab/',
    primaryName: 'Hugging Face',
    fallbackBaseURL: './models/skey/'
  },
  game: {
    primaryBaseURL:
      'https://huggingface.co/aaatmy/game-small-onnx/resolve/ea339353ea4a04b4bf3847e1a192854100778be5/',
    primaryName: 'Hugging Face',
    fallbackBaseURL:
      'https://raw.githubusercontent.com/Hikari-Tsai/music-detection/87b58f6f4d7e4ee90ed6d48d4305876a3f28db2d/assets/models/game/1.0.3-small/',
    fallbackName: 'GitHub'
  },
  runtime: {
    primaryBaseURL: `https://unpkg.com/onnxruntime-web@${runtimeVersion}/dist/`,
    primaryName: 'unpkg',
    fallbackBaseURL: './ort/',
    // Must match the bundled onnxruntime-web/webgpu ESM build. The build script
    // verifies the installed version and binary hash before deployment.
    manifest: {
      version: runtimeVersion,
      model_file: 'ort-wasm-simd-threaded.asyncify.wasm',
      model_bytes: 27190919,
      sha256: 'f33595b9f7ea51aa6f646dd5a2bde6fbb1c7bcde0b9d2b5f240011a09c1830d0'
    }
  }
};
