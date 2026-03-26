#!/bin/bash
# meeting-followup.sh
#
# Generates a meeting follow-up artifact, validates structure,
# and optionally runs deterministic repair attempts.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TARGET_DATE="${TARGET_DATE:-$(date +%Y-%m-%d)}"
MEETING_NAME="${MEETING_NAME:-}"
MEETING_FILE_SLUG="${MEETING_FILE_SLUG:-}"
CUSTOMER_OR_TOPIC="${CUSTOMER_OR_TOPIC:-TBD}"
MAX_REPAIR_ATTEMPTS="${MAX_MEETING_FOLLOWUP_REPAIR_ATTEMPTS:-1}"

if [ -z "$MEETING_NAME" ]; then
  echo "[meeting-followup] ERROR: set MEETING_NAME env var."
  echo "Example: MEETING_NAME='Contoso QBR' npm run meeting:followup"
  exit 2
fi

if [ -z "$MEETING_FILE_SLUG" ]; then
  MEETING_FILE_SLUG="$(printf '%s' "$MEETING_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
fi

if [ -z "$MEETING_FILE_SLUG" ]; then
  MEETING_FILE_SLUG="meeting"
fi

if ! [[ "$MAX_REPAIR_ATTEMPTS" =~ ^[0-9]+$ ]] || [ "$MAX_REPAIR_ATTEMPTS" -lt 0 ]; then
  echo "[meeting-followup] ERROR: MAX_MEETING_FOLLOWUP_REPAIR_ATTEMPTS must be a non-negative integer."
  exit 2
fi

cd "$REPO_DIR"

COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  echo "[meeting-followup] ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/meeting-followup.prompt.md"
REPAIR_PROMPT_FILE="$REPO_DIR/.github/prompts/meeting-followup-repair.prompt.md"
VALIDATOR_SCRIPT="$REPO_DIR/scripts/validate-meeting-followup.sh"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "[meeting-followup] ERROR: prompt file not found: $PROMPT_FILE"
  exit 1
fi

if [ ! -f "$REPAIR_PROMPT_FILE" ]; then
  echo "[meeting-followup] ERROR: repair prompt file not found: $REPAIR_PROMPT_FILE"
  exit 1
fi

if [ ! -f "$VALIDATOR_SCRIPT" ]; then
  echo "[meeting-followup] ERROR: validator script not found: $VALIDATOR_SCRIPT"
  exit 1
fi

escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[\\&/]/\\&/g'
}

meeting_name_escaped="$(escape_sed_replacement "$MEETING_NAME")"
meeting_date_escaped="$(escape_sed_replacement "$TARGET_DATE")"
customer_escaped="$(escape_sed_replacement "$CUSTOMER_OR_TOPIC")"
meeting_slug_escaped="$(escape_sed_replacement "$MEETING_FILE_SLUG")"

PROMPT_TEXT="$({
  sed -e "s/{{meeting_name}}/$meeting_name_escaped/g" \
      -e "s/{{meeting_date}}/$meeting_date_escaped/g" \
      -e "s/{{customer}}/$customer_escaped/g" \
      -e "s/{{meeting_file_slug}}/$meeting_slug_escaped/g" \
      "$PROMPT_FILE"
})"

LOG_PATH="/tmp/meeting-followup-$TARGET_DATE-$MEETING_FILE_SLUG.log"

set +e
"$COPILOT_BIN" \
  -p "$PROMPT_TEXT" \
  --allow-all-tools \
  --allow-all-paths \
  --add-dir "$VAULT_DIR" \
  --output-format text \
  2>&1 | tee "$LOG_PATH"
rc=$?
set -e

if [ "$rc" -ne 0 ]; then
  echo "[meeting-followup] ERROR: Copilot CLI run failed (exit $rc)."
  echo "[meeting-followup] Log: $LOG_PATH"
  exit "$rc"
fi

if bash "$VALIDATOR_SCRIPT" --vault "$VAULT_DIR" --date "$TARGET_DATE" --meeting-file "$MEETING_FILE_SLUG.md"; then
  echo "[meeting-followup] PASS: generated and validated meeting follow-up artifact."
  echo "[meeting-followup] Log: $LOG_PATH"
  exit 0
fi

echo "[meeting-followup] WARNING: validation failed. Starting repair attempts."

repair_success=0
repair_attempt=1
while [ "$repair_attempt" -le "$MAX_REPAIR_ATTEMPTS" ]; do
  REPAIR_PROMPT_TEXT="$({
    sed -e "s/{{meeting_name}}/$meeting_name_escaped/g" \
        -e "s/{{meeting_date}}/$meeting_date_escaped/g" \
        -e "s/{{customer}}/$customer_escaped/g" \
        -e "s/{{meeting_file_slug}}/$meeting_slug_escaped/g" \
        "$REPAIR_PROMPT_FILE"
  })"

  REPAIR_LOG="/tmp/meeting-followup-repair-$TARGET_DATE-$MEETING_FILE_SLUG-$repair_attempt.log"

  set +e
  "$COPILOT_BIN" \
    -p "$REPAIR_PROMPT_TEXT" \
    --allow-all-tools \
    --allow-all-paths \
    --add-dir "$VAULT_DIR" \
    --output-format text \
    > "$REPAIR_LOG" 2>&1
  repair_rc=$?
  set -e

  if [ "$repair_rc" -ne 0 ]; then
    echo "[meeting-followup] WARNING: repair attempt $repair_attempt failed to execute (exit $repair_rc)."
  fi

  if bash "$VALIDATOR_SCRIPT" --vault "$VAULT_DIR" --date "$TARGET_DATE" --meeting-file "$MEETING_FILE_SLUG.md"; then
    repair_success=1
    echo "[meeting-followup] PASS: repair succeeded on attempt $repair_attempt."
    echo "[meeting-followup] Repair log: $REPAIR_LOG"
    break
  fi

  repair_attempt=$((repair_attempt + 1))
done

if [ "$repair_success" -ne 1 ]; then
  echo "[meeting-followup] ERROR: validation failed after repair attempts."
  exit 1
fi
