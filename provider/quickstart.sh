#!/bin/sh
# Docs: README.md; run from the provider directory.
set -eu
npm ci
npm test
npm run demo
