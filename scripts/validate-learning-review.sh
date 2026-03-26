#!/bin/bash
# validate-learning-review.sh
#
# Validates that the learning review artifact has the required structure.

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
      echo "[validate-learning-review] ERROR: unknown argument '$1'"
      echo "Usage: $0 [--vault <path>] [--date YYYY-MM-DD]"
      exit 2
      ;;
  esac
done

if [ -z "$VAULT_DIR" ]; then
  echo "[validate-learning-review] ERROR: OBSIDIAN_VAULT_PATH is not set and --vault was not provided."
  exit 2
fi

NOTE_PATH="$VAULT_DIR/Daily/$TARGET_DATE-learning-review.md"

if [ ! -f "$NOTE_PATH" ]; then
  echo "[validate-learning-review] FAIL: Learning review artifact not found: $NOTE_PATH"
  exit 1
fi

required_sections=(
  "## Learning Review"
  "### PROMOTION CANDIDATES"
  "### WATCHING"
  "### STALE ENTRIES"
  "### REVIEW METADATA"
)

missing=()
for section in "${required_sections[@]}"; do
  if ! grep -Fq "$section" "$NOTE_PATH"; then
    missing+=("$section")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "[validate-learning-review] FAIL: Missing required sections in $NOTE_PATH"
  for item in "${missing[@]}"; do
    echo "  - $item"
  done
  exit 1
fi

# Check REVIEW METADATA has required fields
metadata_fields=(
  "Total learning-log entries:"
  "Promotion candidates:"
  "Watching patterns:"
  "Stale entries:"
  "Review date:"
)

missing_meta=()
for field in "${metadata_fields[@]}"; do
  if ! grep -Fq "$field" "$NOTE_PATH"; then
    missing_meta+=("$field")
  fi
done

if [ "${#missing_meta[@]}" -gt 0 ]; then
  echo "[validate-learning-review] FAIL: Missing metadata fields in REVIEW METADATA"
  for item in "${missing_meta[@]}"; do
    echo "  - $item"
  done
  exit 1
fi

echo "[validate-learning-review] PASS: Learning review artifact valid for $TARGET_DATE"
echo "[validate-learning-review] File: $NOTE_PATH"
