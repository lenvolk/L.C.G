#!/bin/bash
# trigger-meeting-prep.sh
#
# Parses today's Daily note and auto-triggers meeting brief generation
# for entries marked PARTIAL or MISSING in the MEETING PREP STATUS section.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TODAY="${TARGET_DATE:-$(date +%Y-%m-%d)}"
MAX_MEETINGS="${MAX_MEETING_PREP_TRIGGERS:-5}"
MAX_REPAIR_ATTEMPTS="${MAX_MEETING_PREP_REPAIR_ATTEMPTS:-1}"
DRY_RUN="${DRY_RUN:-0}"

if ! [[ "$MAX_MEETINGS" =~ ^[0-9]+$ ]] || [ "$MAX_MEETINGS" -lt 1 ]; then
  echo "[meeting-prep-trigger] ERROR: MAX_MEETING_PREP_TRIGGERS must be a positive integer."
  exit 2
fi

if ! [[ "$MAX_REPAIR_ATTEMPTS" =~ ^[0-9]+$ ]] || [ "$MAX_REPAIR_ATTEMPTS" -lt 0 ]; then
  echo "[meeting-prep-trigger] ERROR: MAX_MEETING_PREP_REPAIR_ATTEMPTS must be a non-negative integer."
  exit 2
fi

NOTE_PATH="$VAULT_DIR/Daily/$TODAY.md"
PROMPT_FILE="$REPO_DIR/.github/prompts/meeting-brief.prompt.md"
REPAIR_PROMPT_FILE="$REPO_DIR/.github/prompts/meeting-brief-repair.prompt.md"
VALIDATOR_SCRIPT="$REPO_DIR/scripts/validate-meeting-brief.sh"

if [ ! -f "$NOTE_PATH" ]; then
  echo "[meeting-prep-trigger] ERROR: Daily note not found: $NOTE_PATH"
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "[meeting-prep-trigger] ERROR: Prompt template not found: $PROMPT_FILE"
  exit 1
fi

if [ ! -f "$REPAIR_PROMPT_FILE" ]; then
  echo "[meeting-prep-trigger] ERROR: Repair prompt template not found: $REPAIR_PROMPT_FILE"
  exit 1
fi

if [ ! -f "$VALIDATOR_SCRIPT" ]; then
  echo "[meeting-prep-trigger] ERROR: Meeting brief validator not found: $VALIDATOR_SCRIPT"
  exit 1
fi

cd "$REPO_DIR"

COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
fi

if [ ! -x "$COPILOT_BIN" ] && ! command -v "$COPILOT_BIN" > /dev/null 2>&1; then
  echo "[meeting-prep-trigger] ERROR: copilot CLI not found"
  exit 1
fi

extract_candidates() {
  awk '
    /^### MEETING PREP STATUS[[:space:]]*$/ { in_section=1; next }
    in_section && /^### / { in_section=0 }
    in_section && /^- / {
      if ($0 ~ /(PARTIAL|MISSING) -/) {
        print $0
      }
    }
  ' "$NOTE_PATH"
}

normalize_meeting_name() {
  local line="$1"
  local payload
  # Strip optional Obsidian checkbox prefix (e.g. [/] or [ ]) and any text before the
  # meeting name bracket (e.g. bold time prefix like **10:00 AM** ·)
  payload="$(printf '%s' "$line" | sed -E 's/^-[[:space:]]*(\[.\][[:space:]]+)?[^[]*\[([^]]+)\].*/\2/' | sed -E 's/[[:space:]]+\|[[:space:]]+/ - /g')"
  printf '%s' "$payload" | sed -E 's/[[:space:]]{2,}/ /g' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g'
}

infer_customer_or_topic() {
  local meeting_name="$1"
  local candidate

  candidate="$(printf '%s' "$meeting_name" | sed -En 's/.*[Ww]ith[[:space:]]+([^\-\|]+).*/\1/p' | head -n 1 | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
  if [ -n "$candidate" ]; then
    printf '%s' "$candidate"
    return
  fi

  candidate="$(printf '%s' "$meeting_name" | sed -En 's/.*[Ff]or[[:space:]]+([^\-\|]+).*/\1/p' | head -n 1 | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
  if [ -n "$candidate" ]; then
    printf '%s' "$candidate"
    return
  fi

  printf 'TBD'
}

to_slug() {
  local value="$1"
  local slug
  slug="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
  if [ -z "$slug" ]; then
    slug="meeting"
  fi
  printf '%s' "$slug"
}

escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[\\&/]/\\&/g'
}

render_prompt_from_template() {
  local template_file="$1"
  local meeting_name_value="$2"
  local meeting_date_value="$3"
  local customer_value="$4"
  local meeting_slug_value="$5"

  local meeting_name_esc meeting_date_esc customer_esc meeting_slug_esc
  meeting_name_esc="$(escape_sed_replacement "$meeting_name_value")"
  meeting_date_esc="$(escape_sed_replacement "$meeting_date_value")"
  customer_esc="$(escape_sed_replacement "$customer_value")"
  meeting_slug_esc="$(escape_sed_replacement "$meeting_slug_value")"

  sed -e "s/{{meeting_name}}/$meeting_name_esc/g" \
      -e "s/{{meeting_date}}/$meeting_date_esc/g" \
      -e "s/{{customer}}/$customer_esc/g" \
      -e "s/{{meeting_file_slug}}/$meeting_slug_esc/g" \
      "$template_file"
}

run_count=0
error_count=0

while IFS= read -r candidate_line; do
  if [ "$run_count" -ge "$MAX_MEETINGS" ]; then
    echo "[meeting-prep-trigger] Reached MAX_MEETING_PREP_TRIGGERS=$MAX_MEETINGS."
    break
  fi

  [ -z "$candidate_line" ] && continue

  meeting_name_raw="$(normalize_meeting_name "$candidate_line")"
  customer_or_topic="$(infer_customer_or_topic "$meeting_name_raw")"
  meeting_slug="$(to_slug "$meeting_name_raw")"

  prompt_text="$(render_prompt_from_template "$PROMPT_FILE" "$meeting_name_raw" "$TODAY" "$customer_or_topic" "$meeting_slug")"

  echo "[meeting-prep-trigger] Triggering: $meeting_name_raw (customer/topic: $customer_or_topic, file: $TODAY-$meeting_slug.md)"

  if [ "$DRY_RUN" = "1" ]; then
    run_count=$((run_count + 1))
    continue
  fi

  set +e
  "$COPILOT_BIN" \
    -p "$prompt_text" \
    --allow-all-tools \
    --allow-all-paths \
    --add-dir "$VAULT_DIR" \
    --output-format text > "/tmp/meeting-prep-$TODAY-$run_count.log" 2>&1
  rc=$?
  set -e

  run_count=$((run_count + 1))
  if [ "$rc" -ne 0 ]; then
    error_count=$((error_count + 1))
    echo "[meeting-prep-trigger] ERROR: trigger failed for '$meeting_name_raw' (exit $rc)."
    echo "[meeting-prep-trigger] See /tmp/meeting-prep-$TODAY-$((run_count - 1)).log"
    continue
  fi

  if bash "$VALIDATOR_SCRIPT" --vault "$VAULT_DIR" --date "$TODAY" --meeting-file "$meeting_slug.md" > "/tmp/meeting-prep-validate-$TODAY-$((run_count - 1)).log" 2>&1; then
    echo "[meeting-prep-trigger] Validation passed: $TODAY-$meeting_slug.md"
    continue
  fi

  echo "[meeting-prep-trigger] WARNING: Validation failed for $TODAY-$meeting_slug.md. Starting repair."

  repair_success=0
  repair_attempt=1
  while [ "$repair_attempt" -le "$MAX_REPAIR_ATTEMPTS" ]; do
    repair_prompt_text="$(render_prompt_from_template "$REPAIR_PROMPT_FILE" "$meeting_name_raw" "$TODAY" "$customer_or_topic" "$meeting_slug")"
    repair_log="/tmp/meeting-prep-repair-$TODAY-$((run_count - 1))-$repair_attempt.log"

    set +e
    "$COPILOT_BIN" \
      -p "$repair_prompt_text" \
      --allow-all-tools \
      --allow-all-paths \
      --add-dir "$VAULT_DIR" \
      --output-format text > "$repair_log" 2>&1
    repair_rc=$?
    set -e

    if [ "$repair_rc" -ne 0 ]; then
      echo "[meeting-prep-trigger] WARNING: Repair attempt $repair_attempt failed to execute for '$meeting_name_raw' (exit $repair_rc)."
    fi

    if bash "$VALIDATOR_SCRIPT" --vault "$VAULT_DIR" --date "$TODAY" --meeting-file "$meeting_slug.md" > "/tmp/meeting-prep-validate-$TODAY-$((run_count - 1))-repair-$repair_attempt.log" 2>&1; then
      echo "[meeting-prep-trigger] Repair succeeded on attempt $repair_attempt for $TODAY-$meeting_slug.md"
      repair_success=1
      break
    fi

    repair_attempt=$((repair_attempt + 1))
  done

  if [ "$repair_success" -ne 1 ]; then
    error_count=$((error_count + 1))
    echo "[meeting-prep-trigger] ERROR: Validation failed after repair attempts for '$meeting_name_raw'."
  fi
done < <(extract_candidates)

if [ "$run_count" -eq 0 ]; then
  echo "[meeting-prep-trigger] No PARTIAL/MISSING meetings found for $TODAY."
  exit 0
fi

if [ "$error_count" -gt 0 ]; then
  echo "[meeting-prep-trigger] Completed with $error_count failure(s) out of $run_count trigger(s)."
  exit 1
fi

echo "[meeting-prep-trigger] Completed successfully: $run_count meeting brief trigger(s)."