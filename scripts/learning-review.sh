#!/bin/bash
# learning-review.sh
#
# Runs the weekly learning review prompt to scan the learning log for
# recurring correction patterns and propose promotions into vault rules.
#
# Usage:
#   npm run learning:review
#   TARGET_DATE=2026-03-14 npm run learning:review

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TARGET_DATE="${TARGET_DATE:-$(date +%Y-%m-%d)}"
MAX_LEARNING_REVIEW_REPAIR_ATTEMPTS="${MAX_LEARNING_REVIEW_REPAIR_ATTEMPTS:-1}"

cd "$REPO_DIR"

log() {
  local ts
  ts=$(date +"%H:%M:%S")
  echo "[$ts] $*"
}

log "Starting learning review for $TARGET_DATE"
log "Vault: $VAULT_DIR"

# Check learning-log exists
LEARNING_LOG="$VAULT_DIR/_kate/learning-log.md"
if [ ! -f "$LEARNING_LOG" ]; then
  log "WARNING: learning-log.md not found at $LEARNING_LOG — review may produce empty results."
fi

# Resolve copilot CLI
COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  log "ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/learning-review.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  log "ERROR: prompt file not found: $PROMPT_FILE"
  exit 1
fi

PROMPT_TEXT="$(sed "s/{{TODAY}}/$TARGET_DATE/g" "$PROMPT_FILE")"

export OBSIDIAN_VAULT_PATH="$VAULT_DIR"

LOG_DIR="$VAULT_DIR/_agent-log"
LOG_FILE="$LOG_DIR/$TARGET_DATE.md"
mkdir -p "$LOG_DIR"

PRIMARY_LOG="/tmp/learning-review-$TARGET_DATE.log"

log "Running copilot CLI for learning review…"

if "$COPILOT_BIN" \
  -p "$PROMPT_TEXT" \
  --allow-all-tools \
  --allow-all-paths \
  --add-dir "$VAULT_DIR" \
  --output-format text \
  2>&1 | tee "$PRIMARY_LOG"; then
  EXIT_CODE=0
else
  EXIT_CODE=$?
fi

if [ "$EXIT_CODE" -ne 0 ]; then
  log "ERROR: copilot CLI exited with code $EXIT_CODE"
  echo "## Learning Review — FAILED" >> "$LOG_FILE"
  echo "- Exit code: $EXIT_CODE" >> "$LOG_FILE"
  echo "- Log: $PRIMARY_LOG" >> "$LOG_FILE"
  exit "$EXIT_CODE"
fi

log "Learning review generation completed."

# Validate artifact
VALIDATOR="$REPO_DIR/scripts/validate-learning-review.sh"
if [ -f "$VALIDATOR" ]; then
  if bash "$VALIDATOR" --vault "$VAULT_DIR" --date "$TARGET_DATE" >> "$LOG_FILE" 2>&1; then
    log "Learning review artifact validation passed."
  else
    log "WARNING: Learning review artifact validation failed."

    REPAIR_ATTEMPTS=0
    while [ "$REPAIR_ATTEMPTS" -lt "$MAX_LEARNING_REVIEW_REPAIR_ATTEMPTS" ]; do
      REPAIR_ATTEMPTS=$((REPAIR_ATTEMPTS + 1))
      log "Attempting repair ($REPAIR_ATTEMPTS/$MAX_LEARNING_REVIEW_REPAIR_ATTEMPTS)…"

      REPAIR_SCRIPT="$REPO_DIR/scripts/learning-review-repair.sh"
      if [ -f "$REPAIR_SCRIPT" ]; then
        if bash "$REPAIR_SCRIPT" >> "$LOG_FILE" 2>&1; then
          log "Repair attempt $REPAIR_ATTEMPTS succeeded."
          break
        else
          log "Repair attempt $REPAIR_ATTEMPTS failed."
        fi
      else
        log "WARNING: repair script not found: $REPAIR_SCRIPT"
        break
      fi
    done
  fi
else
  log "WARNING: validator not found, skipping validation."
fi

echo "## Learning Review — $TARGET_DATE" >> "$LOG_FILE"
echo "- Status: completed" >> "$LOG_FILE"
echo "- Log: $PRIMARY_LOG" >> "$LOG_FILE"

log "Learning review complete for $TARGET_DATE"
