#!/bin/bash
# run-update-requests.sh
#
# Generates update-request drafts for a customer, validates artifact shape,
# and optionally runs deterministic repair attempts.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TARGET_DATE="${TARGET_DATE:-$(date +%Y-%m-%d)}"
CUSTOMER="${CUSTOMER:-}"
CUSTOMER_SLUG="${CUSTOMER_SLUG:-}"
MAX_REPAIR_ATTEMPTS="${MAX_UPDATE_REQUEST_REPAIR_ATTEMPTS:-1}"

if [ -z "$CUSTOMER" ]; then
  echo "[update-request-run] ERROR: set CUSTOMER env var."
  echo "Example: CUSTOMER='Contoso' npm run update-request:run"
  exit 2
fi

if ! [[ "$MAX_REPAIR_ATTEMPTS" =~ ^[0-9]+$ ]] || [ "$MAX_REPAIR_ATTEMPTS" -lt 0 ]; then
  echo "[update-request-run] ERROR: MAX_UPDATE_REQUEST_REPAIR_ATTEMPTS must be a non-negative integer."
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
  echo "[update-request-run] ERROR: copilot CLI not found"
  exit 1
fi

PROMPT_FILE="$REPO_DIR/.github/prompts/update-request.prompt.md"
REPAIR_PROMPT_FILE="$REPO_DIR/.github/prompts/update-request-repair.prompt.md"
VALIDATOR_SCRIPT="$REPO_DIR/scripts/validate-update-requests.sh"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "[update-request-run] ERROR: prompt file not found: $PROMPT_FILE"
  exit 1
fi

if [ ! -f "$REPAIR_PROMPT_FILE" ]; then
  echo "[update-request-run] ERROR: repair prompt file not found: $REPAIR_PROMPT_FILE"
  exit 1
fi

if [ ! -f "$VALIDATOR_SCRIPT" ]; then
  echo "[update-request-run] ERROR: validator script not found: $VALIDATOR_SCRIPT"
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

LOG_PATH="/tmp/update-request-run-$TARGET_DATE-$CUSTOMER_SLUG.log"

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
  echo "[update-request-run] ERROR: Copilot CLI run failed (exit $rc)."
  echo "[update-request-run] Log: $LOG_PATH"
  exit "$rc"
fi

if bash "$VALIDATOR_SCRIPT" --vault "$VAULT_DIR" --date "$TARGET_DATE" --customer-slug "$CUSTOMER_SLUG"; then
  echo "[update-request-run] PASS: generated and validated update-request artifact."
  echo "[update-request-run] Log: $LOG_PATH"
  exit 0
fi

echo "[update-request-run] WARNING: validation failed. Starting repair attempts."

repair_success=0
repair_attempt=1
while [ "$repair_attempt" -le "$MAX_REPAIR_ATTEMPTS" ]; do
  REPAIR_PROMPT_TEXT="$({
    sed -e "s/{{customer}}/$customer_escaped/g" \
        -e "s/{{run_date}}/$run_date_escaped/g" \
        -e "s/{{customer_file_slug}}/$customer_slug_escaped/g" \
        "$REPAIR_PROMPT_FILE"
  })"

  REPAIR_LOG="/tmp/update-request-repair-$TARGET_DATE-$CUSTOMER_SLUG-$repair_attempt.log"

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
    echo "[update-request-run] WARNING: repair attempt $repair_attempt failed to execute (exit $repair_rc)."
  fi

  if bash "$VALIDATOR_SCRIPT" --vault "$VAULT_DIR" --date "$TARGET_DATE" --customer-slug "$CUSTOMER_SLUG"; then
    repair_success=1
    echo "[update-request-run] PASS: repair succeeded on attempt $repair_attempt."
    echo "[update-request-run] Repair log: $REPAIR_LOG"
    break
  fi

  repair_attempt=$((repair_attempt + 1))
done

if [ "$repair_success" -ne 1 ]; then
  echo "[update-request-run] ERROR: validation failed after repair attempts."
  exit 1
fi
