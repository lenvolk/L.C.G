#!/bin/bash
# validate-morning-brief.sh
#
# Validates that today's daily note contains the required Morning Triage sections.

set -euo pipefail

VAULT_DIR="${OBSIDIAN_VAULT_PATH:-}"
TARGET_DATE="$(date +%Y-%m-%d)"

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
    *)
      echo "[validate] ERROR: unknown argument '$1'"
      echo "Usage: $0 [--vault <path>] [--date YYYY-MM-DD]"
      exit 2
      ;;
  esac
done

if [ -z "$VAULT_DIR" ]; then
  echo "[validate] ERROR: OBSIDIAN_VAULT_PATH is not set and --vault was not provided."
  exit 2
fi

NOTE_PATH="$VAULT_DIR/Daily/$TARGET_DATE.md"

if [ ! -f "$NOTE_PATH" ]; then
  echo "[validate] FAIL: Daily note not found: $NOTE_PATH"
  exit 1
fi

required_sections=(
  "## Morning Triage"
  "### URGENT"
  "### HIGH"
  "### MEETING PREP STATUS"
  "### MILESTONE ALERTS"
  "### ACTION QUEUE"
  "### FYI"
  "### RUN METADATA"
)

missing=()
for section in "${required_sections[@]}"; do
  if ! rg -Fq "$section" "$NOTE_PATH"; then
    missing+=("$section")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "[validate] FAIL: Missing required sections in $NOTE_PATH"
  for item in "${missing[@]}"; do
    echo "  - $item"
  done
  exit 1
fi

if ! rg -q --pcre2 '^- Section counts: URGENT=\d+; HIGH=\d+; MEETING PREP STATUS=\d+; MILESTONE ALERTS=\d+; ACTION QUEUE=\d+; FYI=\d+$' "$NOTE_PATH"; then
  echo "[validate] FAIL: RUN METADATA is missing the required section-count line format."
  exit 1
fi

assumption_count="$({
  awk '
    BEGIN { in_metadata = 0; in_assumptions = 0; count = 0 }
    /^### RUN METADATA[[:space:]]*$/ { in_metadata = 1; next }
    in_metadata && /^### / { in_metadata = 0; in_assumptions = 0 }
    in_metadata && /^- Assumptions to validate:[[:space:]]*$/ { in_assumptions = 1; next }
    in_metadata && in_assumptions && /^  - / { count++; next }
    END { print count }
  ' "$NOTE_PATH"
} | tr -d '[:space:]')"

if [ "$assumption_count" != "3" ]; then
  echo "[validate] FAIL: RUN METADATA must include exactly 3 assumptions (found $assumption_count)."
  exit 1
fi

echo "[validate] PASS: Morning Triage artifact valid for $TARGET_DATE"
echo "[validate] File: $NOTE_PATH"
