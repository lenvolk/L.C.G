#!/bin/bash
# bootstrap-kate-vault.sh
#
# Copies vault starter files into the configured OBSIDIAN_VAULT_PATH
# without overwriting existing user-owned files.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STARTER_DIR="$REPO_DIR/vault-starter"

if [ ! -d "$STARTER_DIR" ]; then
  echo "[vault:init] ERROR: Starter directory not found: $STARTER_DIR"
  exit 1
fi

# Load .env if present so OBSIDIAN_VAULT_PATH can be resolved.
if [ -f "$REPO_DIR/.env" ]; then
  # shellcheck disable=SC1091
  set -a
  source "$REPO_DIR/.env"
  set +a
fi

VAULT_DIR="${OBSIDIAN_VAULT_PATH:-}"
if [ -z "$VAULT_DIR" ]; then
  echo "[vault:init] ERROR: OBSIDIAN_VAULT_PATH is not set. Configure it in .env first."
  exit 1
fi

if [ ! -d "$VAULT_DIR" ]; then
  echo "[vault:init] ERROR: Vault path does not exist: $VAULT_DIR"
  exit 1
fi

mkdir -p "$VAULT_DIR/_kate/templates" "$VAULT_DIR/Daily" "$VAULT_DIR/Meetings" "$VAULT_DIR/Weekly"

copy_if_missing() {
  local src="$1"
  local dst="$2"
  if [ -f "$dst" ]; then
    echo "[vault:init] skip (exists): $dst"
  else
    cp "$src" "$dst"
    echo "[vault:init] created: $dst"
  fi
}

copy_if_missing "$STARTER_DIR/_kate/preferences.md" "$VAULT_DIR/_kate/preferences.md"
copy_if_missing "$STARTER_DIR/_kate/vip-list.md" "$VAULT_DIR/_kate/vip-list.md"
copy_if_missing "$STARTER_DIR/_kate/operating-rhythm.md" "$VAULT_DIR/_kate/operating-rhythm.md"
copy_if_missing "$STARTER_DIR/_kate/communication-style.md" "$VAULT_DIR/_kate/communication-style.md"
copy_if_missing "$STARTER_DIR/_kate/learning-log.md" "$VAULT_DIR/_kate/learning-log.md"
copy_if_missing "$STARTER_DIR/_kate/templates/meeting-brief.md" "$VAULT_DIR/_kate/templates/meeting-brief.md"
copy_if_missing "$STARTER_DIR/_kate/templates/weekly-summary.md" "$VAULT_DIR/_kate/templates/weekly-summary.md"
copy_if_missing "$STARTER_DIR/_kate/templates/update-request.md" "$VAULT_DIR/_kate/templates/update-request.md"
copy_if_missing "$STARTER_DIR/_kate/templates/town-hall-deck.md" "$VAULT_DIR/_kate/templates/town-hall-deck.md"
copy_if_missing "$STARTER_DIR/_kate/templates/customer-engagement.md" "$VAULT_DIR/_kate/templates/customer-engagement.md"

echo "[vault:init] Done."
