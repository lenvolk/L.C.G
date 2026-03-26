#!/usr/bin/env bash
set -euo pipefail

BASE_BIN="${COPILOT_BASE_CLI_PATH:-copilot}"

if ! command -v "$BASE_BIN" > /dev/null 2>&1; then
  BASE_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$BASE_BIN" ] && ! command -v "$BASE_BIN" > /dev/null 2>&1; then
  echo "[copilot-model-wrapper] ERROR: Copilot CLI not found. Set COPILOT_BASE_CLI_PATH or install Copilot CLI." >&2
  exit 1
fi

MODEL="${LCG_EVAL_MODEL:-}"
if [ -n "$MODEL" ]; then
  exec "$BASE_BIN" --model "$MODEL" "$@"
fi

exec "$BASE_BIN" "$@"
