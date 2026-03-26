#!/bin/bash
# milestone-review.sh — Copilot CLI-driven team milestone health review
#
# Scheduled weekly (Monday) or bi-weekly via cron/launchd, or run manually.
# Uses copilot CLI with MSX-CRM and OIL MCP servers to produce
# a consolidated milestone status report for the manager and direct reports.
#
# Environment variables:
#   MCAPS_REPO              — Path to KATE repo (default: ~/Repos/_InternalTools/KATE)
#   OBSIDIAN_VAULT_PATH     — Path to Obsidian vault
#   MANAGER_NAME            — Manager name override (default: authenticated CRM user)
#   COPILOT_CLI_PATH        — Path to copilot CLI binary
#   FORCE_RUN_WEEKEND       — Set to "1" to run on weekends
#   MAX_MILESTONE_REVIEW_REPAIR_ATTEMPTS — Repair loop limit (default: 1)

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TODAY=$(date +%Y-%m-%d)
DAY_OF_WEEK=$(date +%u) # 1=Mon … 7=Sun
FORCE_RUN_WEEKEND="${FORCE_RUN_WEEKEND:-0}"
MANAGER_NAME="${MANAGER_NAME:-}"
MAX_REPAIR_ATTEMPTS="${MAX_MILESTONE_REVIEW_REPAIR_ATTEMPTS:-1}"

# Only run Mon–Fri unless forced
if [ "$DAY_OF_WEEK" -gt 5 ] && [ "$FORCE_RUN_WEEKEND" != "1" ]; then
  echo "[milestone-review] Weekend — skipping."
  exit 0
fi

LOG_DIR="$VAULT_DIR/_agent-log"
LOG_FILE="$LOG_DIR/$TODAY.md"

mkdir -p "$LOG_DIR"
if [ ! -f "$LOG_FILE" ]; then
  {
    echo "# Agent Log - $TODAY"
    echo ""
  } > "$LOG_FILE"
fi

log() {
  local ts
  ts=$(date +"%H:%M:%S")
  echo "[$ts] $*"
  echo "- [$ts] milestone-review: $*" >> "$LOG_FILE"
}

log "Starting milestone review for $TODAY"
log "Repo: $REPO_DIR"
log "Vault: $VAULT_DIR"
[ -n "$MANAGER_NAME" ] && log "Manager override: $MANAGER_NAME"

cd "$REPO_DIR" || { log "ERROR: Cannot cd to $REPO_DIR"; exit 1; }

# Ensure Azure CLI token is fresh (required for MSX-CRM)
if ! az account get-access-token --resource https://graph.microsoft.com > /dev/null 2>&1; then
  log "WARNING: Azure CLI token expired — MSX-CRM calls may fail."
  log "Run 'az login' to refresh."
fi

# Resolve copilot CLI path
COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" &> /dev/null; then
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
  if [ ! -f "$COPILOT_BIN" ]; then
    log "ERROR: copilot CLI not found. Install: brew install copilot-cli"
    exit 1
  fi
fi

# Load prompt template
PROMPT_FILE="$REPO_DIR/.github/prompts/crm-milestone-review.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  log "ERROR: Prompt template not found at $PROMPT_FILE"
  exit 1
fi

# Replace template variables
MANAGER_ESCAPED=$(printf '%s' "${MANAGER_NAME:-me}" | sed 's/[&/\]/\\&/g')
PROMPT_TEXT=$(sed -e "s/{{TODAY}}/$TODAY/g" \
                  -e "s/{{manager_name}}/$MANAGER_ESCAPED/g" \
                  "$PROMPT_FILE")

export OBSIDIAN_VAULT_PATH="$VAULT_DIR"

log "Running copilot CLI (non-interactive)…"

ATTEMPT=0
MAX_ATTEMPTS=$((1 + MAX_REPAIR_ATTEMPTS))

while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
  ATTEMPT=$((ATTEMPT + 1))

  if [ "$ATTEMPT" -eq 1 ]; then
    log "Attempt $ATTEMPT/$MAX_ATTEMPTS: primary run"
    echo "$PROMPT_TEXT" | "$COPILOT_BIN" --non-interactive 2>&1 | tee -a "$LOG_FILE"
    EXIT_CODE=${PIPESTATUS[1]:-$?}
  else
    log "Attempt $ATTEMPT/$MAX_ATTEMPTS: repair run"
    REPAIR_PROMPT="Today is $TODAY. The milestone review output at Weekly/$TODAY-milestone-review.md may be incomplete or malformed. Re-run the crm-milestone-review workflow and overwrite the file."
    echo "$REPAIR_PROMPT" | "$COPILOT_BIN" --non-interactive 2>&1 | tee -a "$LOG_FILE"
    EXIT_CODE=${PIPESTATUS[1]:-$?}
  fi

  if [ "$EXIT_CODE" -eq 0 ]; then
    # Validate output exists
    OUTPUT_FILE="$VAULT_DIR/Weekly/$TODAY-milestone-review.md"
    if [ -f "$OUTPUT_FILE" ]; then
      log "✅ Milestone review written to Weekly/$TODAY-milestone-review.md"
      break
    else
      log "⚠️ copilot exited 0 but output file not found — will retry if attempts remain"
    fi
  else
    log "⚠️ copilot exited with code $EXIT_CODE"
  fi
done

if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
  log "❌ Milestone review failed after $MAX_ATTEMPTS attempts"
  exit 1
fi

log "Milestone review complete."
