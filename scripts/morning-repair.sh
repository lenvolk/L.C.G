#!/bin/bash
# morning-repair.sh
#
# Runs the deterministic morning triage repair prompt and validates the artifact.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TARGET_DATE="${TARGET_DATE:-$(date +%Y-%m-%d)}"

cd "$REPO_DIR"

COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  echo "[morning-repair] ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/morning-triage-repair.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  echo "[morning-repair] ERROR: prompt file not found: $PROMPT_FILE"
  exit 1
fi

PROMPT_TEXT="$(sed "s/{{TODAY}}/$TARGET_DATE/g" "$PROMPT_FILE")"
LOG_PATH="/tmp/morning-triage-repair-$TARGET_DATE.log"

"$COPILOT_BIN" \
  -p "$PROMPT_TEXT" \
  --allow-all-tools \
  --allow-all-paths \
  --add-dir "$VAULT_DIR" \
  --output-format text \
  2>&1 | tee "$LOG_PATH"

bash "$REPO_DIR/scripts/validate-morning-brief.sh" --vault "$VAULT_DIR" --date "$TARGET_DATE"

echo "[morning-repair] PASS: repaired and validated $TARGET_DATE"
echo "[morning-repair] Log: $LOG_PATH"
