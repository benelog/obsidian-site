#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

npm run build
node dist/cli.js build --source __tests__/fixtures/sample-vault

open_cmd="xdg-open"
if command -v open &>/dev/null; then
  open_cmd="open"
fi

"$open_cmd" __tests__/fixtures/sample-vault/public/index.html
