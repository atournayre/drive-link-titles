#!/usr/bin/env bash
# Construit dist/drive-link-titles-<version>.zip (manifest.json à la racine du zip).
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(node -p "require('./manifest.json').version")
out="dist/drive-link-titles-${version}.zip"
mkdir -p dist
rm -f "$out"
zip -X -r "$out" manifest.json background.js content.js lib.js options.html options.js icons
unzip -l "$out"
