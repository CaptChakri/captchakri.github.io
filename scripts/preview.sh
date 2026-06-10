#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PORT=${1:-8000}

cd "$ROOT"
python3 scripts/validate_blog.py

printf '\nPreview server: http://localhost:%s/\n' "$PORT"
printf 'Blog index:    http://localhost:%s/blog/\n' "$PORT"
printf 'Press Ctrl+C to stop.\n\n'
python3 -m http.server "$PORT"
