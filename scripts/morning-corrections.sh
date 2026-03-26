#!/bin/bash
# morning-corrections.sh
#
# Runs the triage correction loop prompt and appends outputs to the daily agent log.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TODAY="$(date +%Y-%m-%d)"

cd "$REPO_DIR"

COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  echo "[morning-corrections] ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/triage-correction-loop.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  echo "[morning-corrections] ERROR: prompt file not found: $PROMPT_FILE"
  exit 1
fi

PROMPT_TEXT="$(sed "s/{{TODAY}}/$TODAY/g" "$PROMPT_FILE")"

LOG_DIR="$VAULT_DIR/_agent-log"
LOG_FILE="$LOG_DIR/$TODAY.md"
mkdir -p "$LOG_DIR"

"$COPILOT_BIN" \
  -p "$PROMPT_TEXT" \
  --allow-all-tools \
  --allow-all-paths \
  --add-dir "$VAULT_DIR" \
  --output-format text | tee -a "$LOG_FILE"
