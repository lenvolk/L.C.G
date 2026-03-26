#!/bin/bash
# validate-meeting-followup.sh
#
# Validates a generated meeting follow-up artifact in the vault.

set -euo pipefail

VAULT_DIR="${OBSIDIAN_VAULT_PATH:-}"
TARGET_DATE="$(date +%Y-%m-%d)"
MEETING_FILE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --vault)
      VAULT_DIR="$2"
      shift 2
      ;;
    --date)
      TARGET_DATE="$2"
      shift 2
      ;;
    --meeting-file)
      MEETING_FILE="$2"
      shift 2
      ;;
    *)
      echo "[meeting-followup-validate] ERROR: unknown argument '$1'"
      echo "Usage: $0 --meeting-file <slug.md> [--vault <path>] [--date YYYY-MM-DD]"
      exit 2
      ;;
  esac
done

if [ -z "$VAULT_DIR" ]; then
  echo "[meeting-followup-validate] ERROR: OBSIDIAN_VAULT_PATH is not set and --vault was not provided."
  exit 2
fi

if [ -z "$MEETING_FILE" ]; then
  echo "[meeting-followup-validate] ERROR: --meeting-file is required."
  exit 2
fi

if ! [[ "$MEETING_FILE" =~ \.md$ ]]; then
  echo "[meeting-followup-validate] ERROR: --meeting-file must end with .md"
  exit 2
fi

MEETING_SLUG="${MEETING_FILE%.md}"
NOTE_PATH="$VAULT_DIR/Meetings/$TARGET_DATE-$MEETING_SLUG-followup.md"

if [ ! -f "$NOTE_PATH" ]; then
  echo "[meeting-followup-validate] FAIL: Meeting follow-up artifact not found: $NOTE_PATH"
  exit 1
fi

required_sections=(
  "## Run Metadata"
  "## Meeting"
  "## Action Items"
  "## Staged CRM Task Queue"
  "## Draft Follow-Up Queue"
  "## Risks and Blockers"
  "## Open Questions"
  "## Evidence Trace"
)

missing=()

if ! rg -q '^# Meeting Follow-Up:' "$NOTE_PATH"; then
  missing+=("# Meeting Follow-Up: <title>")
fi

for section in "${required_sections[@]}"; do
  if ! rg -Fq "$section" "$NOTE_PATH"; then
    missing+=("$section")
  fi
done

if ! rg -q '^- Date: .+' "$NOTE_PATH"; then
  missing+=("- Date: <value>")
fi

if ! rg -q '^- Meeting Slug: .+' "$NOTE_PATH"; then
  missing+=("- Meeting Slug: <value>")
fi

if ! rg -q '^- Quality Bar: Action owner and due signal captured for every item$' "$NOTE_PATH"; then
  missing+=("- Quality Bar: Action owner and due signal captured for every item")
fi

if ! rg -q '^- Confidence: (High|Medium|Low)$' "$NOTE_PATH"; then
  missing+=("- Confidence: High|Medium|Low")
fi

if ! rg -q '^- \[Action\] owner=\[name\] due=\[date\|not specified\] source=\[mail\|meeting\|crm\] tags=\[CRM_TASK_CANDIDATE\|EMAIL_FOLLOWUP_NEEDED\|NONE\]|owner=.*due=.*source=.*tags=.*' "$NOTE_PATH"; then
  missing+=("Action item entries with owner/due/source/tags")
fi

if ! rg -q 'status=STAGED' "$NOTE_PATH"; then
  missing+=("status=STAGED in staged CRM task queue")
fi

if [ "${#missing[@]}" -gt 0 ]; then
  echo "[meeting-followup-validate] FAIL: Missing required sections/lines in $NOTE_PATH"
  for item in "${missing[@]}"; do
    echo "  - $item"
  done
  exit 1
fi

if rg -q 'status=EXECUTED|execute now|sent' "$NOTE_PATH"; then
  echo "[meeting-followup-validate] FAIL: Follow-up artifact appears to include execute/send language."
  exit 1
fi

echo "[meeting-followup-validate] PASS: Meeting follow-up artifact valid"
echo "[meeting-followup-validate] File: $NOTE_PATH"
