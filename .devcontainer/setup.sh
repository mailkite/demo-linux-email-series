#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for demo in programmatic provider automation nodejs; do
  npm --prefix "$demo" ci --ignore-scripts
done
python3.12 -m venv python/.venv
python/.venv/bin/python -m pip install -r python/requirements.txt
