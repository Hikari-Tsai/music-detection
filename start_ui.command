#!/bin/zsh
set -e
cd -- "${0:A:h}"
exec .venv/bin/python -m uvicorn web_app:app --host 127.0.0.1 --port 8765
