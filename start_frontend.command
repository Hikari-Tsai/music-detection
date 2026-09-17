#!/bin/zsh
set -e
cd -- "${0:A:h}"
exec node scripts/serve_frontend.mjs
