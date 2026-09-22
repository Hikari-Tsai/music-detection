"""Prepare verified optional model fallbacks for GitHub Pages (stdlib only)."""
import hashlib
import json
from pathlib import Path
import sys
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

def prepare(destination):
    manifest = json.loads((ROOT / 'assets/models/enhanced/manifest.json').read_text())
    sources = json.loads((ROOT / 'frontend/inference/download-sources.json').read_text())
    groups = [('demucs', 'demucs', [dict(name=manifest['demucs']['model_file'], bytes=manifest['demucs']['model_bytes'], sha256=manifest['demucs']['sha256'])]),
              ('gameLarge', 'game-large', manifest['game']['files'])]
    for key, folder, entries in groups:
        config = sources[key]
        for entry in entries:
            target = destination / folder / entry['name']
            target.parent.mkdir(parents=True, exist_ok=True)
            def valid(path):
                return path.exists() and path.stat().st_size == entry['bytes'] and hashlib.file_digest(path.open('rb'), 'sha256').hexdigest() == entry['sha256']
            if valid(target): continue
            error = None
            for base in (config['nativeFallbackBaseURL'], config['primaryBaseURL']):
                temp = target.with_suffix(target.suffix + '.part')
                try:
                    print('Download', entry['name'], flush=True)
                    with urlopen(Request(base + entry['name'], headers={'User-Agent':'music-detection'}), timeout=60) as response, temp.open('wb') as out:
                        count = 0
                        while block := response.read(1024 * 1024):
                            count += len(block)
                            if count > entry['bytes']: raise ValueError('Oversized model')
                            out.write(block)
                    if not valid(temp): raise ValueError('Model checksum mismatch')
                    temp.replace(target)
                    break
                except Exception as exc:
                    error = exc
                finally:
                    temp.unlink(missing_ok=True)
            else:
                raise RuntimeError('Cannot download ' + entry['name']) from error

if __name__ == '__main__':
    prepare(Path(sys.argv[1]) if len(sys.argv)>1 else ROOT / '.cache/enhanced-pages/v1')
