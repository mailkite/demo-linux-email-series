#!/bin/sh
# Docs: README.md. Execute from this directory after installing requirements.
set -eu
python demo.py
python -m unittest discover -s tests -v
