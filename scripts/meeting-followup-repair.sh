#!/bin/bash
# meeting-followup-repair.sh
#
# Runs the deterministic meeting follow-up repair prompt and validates the artifact.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TARGET_DATE="${TARGET_DATE:-$(date +%Y-%m-%d)}"
MEETING_NAME="${MEETING_NAME:-}"
MEETING_FILE_SLUG="${MEETING_FILE_SLUG:-}"
CUSTOMER_OR_TOPIC="${CUSTOMER_OR_TOPIC:-TBD}"

if [ -z "$MEETING_NAME" ]; then
  echo "[meeting-followup-repair] ERROR: set MEETING_NAME env var."
  echo "Example: MEETING_NAME='Contoso QBR' MEETING_FILE_SLUG='contoso-qbr' npm run meeting:followup:repair"
  exit 2
fi

if [ -z "$MEETING_FILE_SLUG" ]; then
  MEETING_FILE_SLUG="$(printf '%s' "$MEETING_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
fi

if [ -z "$MEETING_FILE_SLUG" ]; then
  MEETING_FILE_SLUG="meeting"
fi

cd "$REPO_DIR"

COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  echo "[meeting-followup-repair] ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/meeting-followup-repair.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  echo "[meeting-followup-repair] ERROR: prompt file not found: $PROMPT_FILE"
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

LOG_PATH="/tmp/meeting-followup-repair-$TARGET_DATE-$MEETING_FILE_SLUG.log"

"$COPILOT_BIN" \
  -p "$PROMPT_TEXT" \
  --allow-all-tools \
  --allow-all-paths \
  --add-dir "$VAULT_DIR" \
  --output-format text \
  2>&1 | tee "$LOG_PATH"

bash "$REPO_DIR/scripts/validate-meeting-followup.sh" \
  --vault "$VAULT_DIR" \
  --date "$TARGET_DATE" \
  --meeting-file "$MEETING_FILE_SLUG.md"

echo "[meeting-followup-repair] PASS: repaired and validated meeting follow-up artifact."
echo "[meeting-followup-repair] Log: $LOG_PATH"
