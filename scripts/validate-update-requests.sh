#!/bin/bash
# validate-update-requests.sh
#
# Validates a generated update-request artifact in the vault.

set -euo pipefail

VAULT_DIR="${OBSIDIAN_VAULT_PATH:-}"
TARGET_DATE="$(date +%Y-%m-%d)"
CUSTOMER_SLUG=""

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
    --customer-slug)
      CUSTOMER_SLUG="$2"
      shift 2
      ;;
    *)
      echo "[update-request-validate] ERROR: unknown argument '$1'"
      echo "Usage: $0 --customer-slug <slug> [--vault <path>] [--date YYYY-MM-DD]"
      exit 2
      ;;
  esac
done

if [ -z "$VAULT_DIR" ]; then
  echo "[update-request-validate] ERROR: OBSIDIAN_VAULT_PATH is not set and --vault was not provided."
  exit 2
fi

if [ -z "$CUSTOMER_SLUG" ]; then
  echo "[update-request-validate] ERROR: --customer-slug is required."
  exit 2
fi

if ! [[ "$CUSTOMER_SLUG" =~ ^[a-z0-9-]+$ ]]; then
  echo "[update-request-validate] ERROR: --customer-slug must match ^[a-z0-9-]+$"
  exit 2
fi

NOTE_PATH="$VAULT_DIR/Daily/$TARGET_DATE-update-requests-$CUSTOMER_SLUG.md"

if [ ! -f "$NOTE_PATH" ]; then
  echo "[update-request-validate] FAIL: Update-request artifact not found: $NOTE_PATH"
  exit 1
fi

required_sections=(
  "## Run Metadata"
  "## Draft Queue"
  "## Draft 1"
  "## Review Notes"
)

missing=()

if ! rg -q '^# Update Request Drafts:' "$NOTE_PATH"; then
  missing+=("# Update Request Drafts: <customer>")
fi

for section in "${required_sections[@]}"; do
  if ! rg -Fq "$section" "$NOTE_PATH"; then
    missing+=("$section")
  fi
done

if ! rg -q '^- Date: .+' "$NOTE_PATH"; then
  missing+=("- Date: <value>")
fi

if ! rg -q '^- Customer Slug: .+' "$NOTE_PATH"; then
  missing+=("- Customer Slug: <value>")
fi

if ! rg -q '^- Draft Count: [0-9]+' "$NOTE_PATH"; then
  missing+=("- Draft Count: <number>")
fi

if ! rg -q '^- Quality Bar: Kate edits <=2 sentences per draft$' "$NOTE_PATH"; then
  missing+=("- Quality Bar: Kate edits <=2 sentences per draft")
fi

if ! rg -q '^- To:.*' "$NOTE_PATH"; then
  missing+=("- To:")
fi

if ! rg -q '^- Subject: .*Update Request - .+' "$NOTE_PATH"; then
  missing+=("- Subject: [Milestone] Update Request - [Due Date]")
fi

if ! rg -q '^- Body:' "$NOTE_PATH"; then
  missing+=("- Body:")
fi

if [ "${#missing[@]}" -gt 0 ]; then
  echo "[update-request-validate] FAIL: Missing required sections/lines in $NOTE_PATH"
  for item in "${missing[@]}"; do
    echo "  - $item"
  done
  exit 1
fi

draft_count="$(rg -c '^## Draft [0-9]+' "$NOTE_PATH" | tr -d '[:space:]')"
if [ -z "$draft_count" ] || [ "$draft_count" -lt 1 ]; then
  echo "[update-request-validate] FAIL: Must contain at least one draft section (## Draft 1)."
  exit 1
fi

if rg -q 'status=EXECUTED|send now|sent' "$NOTE_PATH"; then
  echo "[update-request-validate] FAIL: Draft artifact appears to include send/execute language."
  exit 1
fi

echo "[update-request-validate] PASS: Update-request artifact valid"
echo "[update-request-validate] File: $NOTE_PATH"
