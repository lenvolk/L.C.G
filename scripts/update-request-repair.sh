#!/bin/bash
# update-request-repair.sh
#
# Runs the deterministic update-request repair prompt and validates the artifact.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TARGET_DATE="${TARGET_DATE:-$(date +%Y-%m-%d)}"
CUSTOMER="${CUSTOMER:-}"
CUSTOMER_SLUG="${CUSTOMER_SLUG:-}"

if [ -z "$CUSTOMER" ]; then
  echo "[update-request-repair] ERROR: set CUSTOMER env var."
  echo "Example: CUSTOMER='Contoso' npm run update-request:repair"
  exit 2
fi

if [ -z "$CUSTOMER_SLUG" ]; then
  CUSTOMER_SLUG="$(printf '%s' "$CUSTOMER" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
fi

if [ -z "$CUSTOMER_SLUG" ]; then
  CUSTOMER_SLUG="customer"
fi

cd "$REPO_DIR"

COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  echo "[update-request-repair] ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/update-request-repair.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  echo "[update-request-repair] ERROR: prompt file not found: $PROMPT_FILE"
  exit 1
fi

escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[\\&/]/\\&/g'
}

customer_escaped="$(escape_sed_replacement "$CUSTOMER")"
run_date_escaped="$(escape_sed_replacement "$TARGET_DATE")"
customer_slug_escaped="$(escape_sed_replacement "$CUSTOMER_SLUG")"

PROMPT_TEXT="$({
  sed -e "s/{{customer}}/$customer_escaped/g" \
      -e "s/{{run_date}}/$run_date_escaped/g" \
      -e "s/{{customer_file_slug}}/$customer_slug_escaped/g" \
      "$PROMPT_FILE"
})"

LOG_PATH="/tmp/update-request-repair-$TARGET_DATE-$CUSTOMER_SLUG.log"

"$COPILOT_BIN" \
  -p "$PROMPT_TEXT" \
  --allow-all-tools \
  --allow-all-paths \
  --add-dir "$VAULT_DIR" \
  --output-format text \
  2>&1 | tee "$LOG_PATH"

bash "$REPO_DIR/scripts/validate-update-requests.sh" \
  --vault "$VAULT_DIR" \
  --date "$TARGET_DATE" \
  --customer-slug "$CUSTOMER_SLUG"

echo "[update-request-repair] PASS: repaired and validated update-request artifact."
echo "[update-request-repair] Log: $LOG_PATH"
