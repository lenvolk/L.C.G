#!/bin/bash
# validate-meeting-brief.sh
#
# Validates a generated meeting brief artifact in the vault.

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
      echo "[meeting-validate] ERROR: unknown argument '$1'"
      echo "Usage: $0 --meeting-file <slug.md> [--vault <path>] [--date YYYY-MM-DD]"
      exit 2
      ;;
  esac
done

if [ -z "$VAULT_DIR" ]; then
  echo "[meeting-validate] ERROR: OBSIDIAN_VAULT_PATH is not set and --vault was not provided."
  exit 2
fi

if [ -z "$MEETING_FILE" ]; then
  echo "[meeting-validate] ERROR: --meeting-file is required."
  exit 2
fi

if ! [[ "$MEETING_FILE" =~ \.md$ ]]; then
  echo "[meeting-validate] ERROR: --meeting-file must end with .md"
  exit 2
fi

NOTE_PATH="$VAULT_DIR/Meetings/$TARGET_DATE-$MEETING_FILE"

if [ ! -f "$NOTE_PATH" ]; then
  echo "[meeting-validate] FAIL: Meeting brief not found: $NOTE_PATH"
  exit 1
fi

required_sections=(
  "## Meeting"
  "## Why This Matters"
  "## What Changed Since Last Touchpoint"
  "## Key Attendee Context"
  "## Open Items and Milestone Status"
  "## Risks and Decision Points"
  "## Prep Checklist"
  "## Recommended Talk Track"
)

missing=()

if ! rg -q '^# Meeting Brief:' "$NOTE_PATH"; then
  missing+=("# Meeting Brief: <title>")
fi

for section in "${required_sections[@]}"; do
  if ! rg -Fq "$section" "$NOTE_PATH"; then
    missing+=("$section")
  fi
done

if ! rg -q '^- Title: .+' "$NOTE_PATH"; then
  missing+=("- Title: <value>")
fi

if ! rg -q '^- Date/Time: .+' "$NOTE_PATH"; then
  missing+=("- Date/Time: <value>")
fi

if ! rg -q '^- Customer/Topic: .+' "$NOTE_PATH"; then
  missing+=("- Customer/Topic: <value>")
fi

if [ "${#missing[@]}" -gt 0 ]; then
  echo "[meeting-validate] FAIL: Missing required sections/lines in $NOTE_PATH"
  for item in "${missing[@]}"; do
    echo "  - $item"
  done
  exit 1
fi

if ! rg -q '\*\*[^*]+\*\*' "$NOTE_PATH"; then
  echo "[meeting-validate] FAIL: Why This Matters must include one bolded top insight line."
  exit 1
fi

checklist_count="$(rg -c '^- \[ \]' "$NOTE_PATH" | tr -d '[:space:]')"
if [ -z "$checklist_count" ] || [ "$checklist_count" -lt 2 ]; then
  echo "[meeting-validate] FAIL: Prep Checklist must include at least two unchecked checklist items."
  exit 1
fi

echo "[meeting-validate] PASS: Meeting brief artifact valid"
echo "[meeting-validate] File: $NOTE_PATH"