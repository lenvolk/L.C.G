#!/bin/bash
# vault-hygiene.sh
#
# Runs the weekly vault hygiene prompt to identify stale content,
# migrate lingering action items, and report vault health.
#
# Usage:
#   npm run vault:hygiene
#   TARGET_DATE=2026-03-14 npm run vault:hygiene

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TARGET_DATE="${TARGET_DATE:-$(date +%Y-%m-%d)}"

cd "$REPO_DIR"

log() {
  local ts
  ts=$(date +"%H:%M:%S")
  echo "[$ts] $*"
}

log "Starting vault hygiene for $TARGET_DATE"
log "Vault: $VAULT_DIR"

# Resolve copilot CLI
COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  log "ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/vault-hygiene.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  log "ERROR: prompt file not found: $PROMPT_FILE"
  exit 1
fi

PROMPT_TEXT="$(sed "s/{{TODAY}}/$TARGET_DATE/g" "$PROMPT_FILE")"

export OBSIDIAN_VAULT_PATH="$VAULT_DIR"

LOG_DIR="$VAULT_DIR/_agent-log"
LOG_FILE="$LOG_DIR/$TARGET_DATE.md"
mkdir -p "$LOG_DIR"

PRIMARY_LOG="/tmp/vault-hygiene-$TARGET_DATE.log"

log "Running copilot CLI for vault hygiene…"

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
  echo "## Vault Hygiene — FAILED" >> "$LOG_FILE"
  echo "- Exit code: $EXIT_CODE" >> "$LOG_FILE"
  echo "- Log: $PRIMARY_LOG" >> "$LOG_FILE"
  exit "$EXIT_CODE"
fi

# Validate hygiene report exists and has required structure
REPORT_PATH="$VAULT_DIR/Daily/$TARGET_DATE-vault-hygiene.md"
if [ -f "$REPORT_PATH" ]; then
  required_sections=(
    "## Vault Hygiene Report"
    "### LINGERING ACTION ITEMS"
    "### ARCHIVE CANDIDATES"
    "### STRUCTURE ISSUES"
    "### VAULT HEALTH"
  )

  missing=()
  for section in "${required_sections[@]}"; do
    if ! grep -Fq "$section" "$REPORT_PATH"; then
      missing+=("$section")
    fi
  done

  if [ "${#missing[@]}" -gt 0 ]; then
    log "WARNING: Hygiene report missing sections:"
    for item in "${missing[@]}"; do
      log "  - $item"
    done
  else
    log "Vault hygiene report validated."
  fi
else
  log "WARNING: Hygiene report not found at $REPORT_PATH"
fi

echo "## Vault Hygiene — $TARGET_DATE" >> "$LOG_FILE"
echo "- Status: completed" >> "$LOG_FILE"
echo "- Log: $PRIMARY_LOG" >> "$LOG_FILE"

log "Vault hygiene complete for $TARGET_DATE"
