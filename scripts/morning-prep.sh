#!/bin/bash
# morning-prep.sh — Copilot CLI-driven daily note population
#
# Called by Obsidian Cron (Mon–Fri, 7:00 AM) or manually.
# Uses copilot CLI with WorkIQ, OIL, and MSX-CRM MCP servers
# to build today's daily note and individual meeting prep notes.

set -euo pipefail

REPO_DIR="${MCAPS_REPO:-$HOME/Repos/_InternalTools/KATE}"
VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian/Jin @ Microsoft}"
TODAY=$(date +%Y-%m-%d)
DAY_OF_WEEK=$(date +%u) # 1=Mon … 7=Sun
FORCE_RUN_WEEKEND="${FORCE_RUN_WEEKEND:-0}"
ENABLE_MEETING_PREP_AUTOTRIGGER="${ENABLE_MEETING_PREP_AUTOTRIGGER:-0}"
MAX_MORNING_TRIAGE_REPAIR_ATTEMPTS="${MAX_MORNING_TRIAGE_REPAIR_ATTEMPTS:-1}"

# Only run Mon–Fri
if [ "$DAY_OF_WEEK" -gt 5 ] && [ "$FORCE_RUN_WEEKEND" != "1" ]; then
  echo "[morning-prep] Weekend — skipping."
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
}

log "Starting morning prep for $TODAY"
log "Repo: $REPO_DIR"
log "Vault: $VAULT_DIR"

cd "$REPO_DIR" || { log "ERROR: Cannot cd to $REPO_DIR"; exit 1; }

# Ensure Azure CLI token is fresh (required for MSX-CRM + WorkIQ)
if ! az account get-access-token --resource https://graph.microsoft.com > /dev/null 2>&1; then
  log "WARNING: Azure CLI token expired — MSX and WorkIQ calls may fail."
  log "Run 'az login' to refresh."
fi

# Resolve copilot CLI path
COPILOT_BIN="${COPILOT_CLI_PATH:-copilot}"
if ! command -v "$COPILOT_BIN" &> /dev/null; then
  # Try VS Code Insiders bundled copilot
  COPILOT_BIN="$HOME/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/copilotCli/copilot"
  if [ ! -f "$COPILOT_BIN" ]; then
    log "ERROR: copilot CLI not found. Install: brew install copilot-cli"
    exit 1
  fi
fi

# Build the prompt from the template.
# Prefer the canonical morning-triage prompt, then fall back to the legacy alias.
PROMPT_FILE="$REPO_DIR/.github/prompts/morning-triage.prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  PROMPT_FILE="$REPO_DIR/.github/prompts/morning-prep.prompt.md"
fi
if [ ! -f "$PROMPT_FILE" ]; then
  log "ERROR: Prompt template not found at .github/prompts/morning-triage.prompt.md or .github/prompts/morning-prep.prompt.md"
  exit 1
fi

# Replace {{TODAY}} placeholder in prompt
PROMPT_TEXT=$(sed "s/{{TODAY}}/$TODAY/g" "$PROMPT_FILE")

export OBSIDIAN_VAULT_PATH="$VAULT_DIR"

log "Running copilot CLI (non-interactive)…"

run_copilot_prompt() {
  local prompt_text="$1"
  local log_path="$2"

  "$COPILOT_BIN" \
    -p "$prompt_text" \
    --allow-all-tools \
    --allow-all-paths \
    --add-dir "$VAULT_DIR" \
    --output-format text \
    2>&1 | tee -a "$log_path"
}

PRIMARY_LOG="/tmp/morning-prep-$TODAY.log"
if run_copilot_prompt "$PROMPT_TEXT" "$PRIMARY_LOG"; then
  EXIT_CODE=0
else
  EXIT_CODE=$?
fi

if [ "$EXIT_CODE" -eq 0 ]; then
  log "Morning prep completed successfully."

  # Validate artifact shape to keep triage output deterministic.
  VALIDATOR="$REPO_DIR/scripts/validate-morning-brief.sh"
  if [ -f "$VALIDATOR" ]; then
    if bash "$VALIDATOR" --vault "$VAULT_DIR" --date "$TODAY" >> "$LOG_FILE" 2>&1; then
      log "Morning brief artifact validation passed."

      if [ "$ENABLE_MEETING_PREP_AUTOTRIGGER" = "1" ]; then
        TRIGGER_SCRIPT="$REPO_DIR/scripts/trigger-meeting-prep.sh"
        if [ -f "$TRIGGER_SCRIPT" ]; then
          log "Meeting prep auto-trigger enabled. Running trigger script..."
          if bash "$TRIGGER_SCRIPT" >> "$LOG_FILE" 2>&1; then
            log "Meeting prep auto-trigger completed."
          else
            log "WARNING: Meeting prep auto-trigger reported errors."
          fi
        else
          log "WARNING: Meeting prep trigger script not found at $TRIGGER_SCRIPT"
        fi
      fi
    else
      log "WARNING: Morning brief artifact validation failed. Starting repair pass."

      REPAIR_PROMPT_FILE="$REPO_DIR/.github/prompts/morning-triage-repair.prompt.md"
      REPAIR_ATTEMPT=1
      REPAIR_SUCCESS=0

      while [ "$REPAIR_ATTEMPT" -le "$MAX_MORNING_TRIAGE_REPAIR_ATTEMPTS" ]; do
        if [ ! -f "$REPAIR_PROMPT_FILE" ]; then
          log "ERROR: Repair prompt not found at $REPAIR_PROMPT_FILE"
          break
        fi

        log "Running morning triage repair attempt $REPAIR_ATTEMPT/$MAX_MORNING_TRIAGE_REPAIR_ATTEMPTS"
        REPAIR_PROMPT_TEXT=$(sed "s/{{TODAY}}/$TODAY/g" "$REPAIR_PROMPT_FILE")
        REPAIR_LOG="/tmp/morning-prep-repair-$TODAY-$REPAIR_ATTEMPT.log"

        if ! run_copilot_prompt "$REPAIR_PROMPT_TEXT" "$REPAIR_LOG"; then
          log "WARNING: Repair attempt $REPAIR_ATTEMPT failed while running Copilot CLI."
        fi

        if bash "$VALIDATOR" --vault "$VAULT_DIR" --date "$TODAY" >> "$LOG_FILE" 2>&1; then
          REPAIR_SUCCESS=1
          log "Morning brief artifact validation passed after repair attempt $REPAIR_ATTEMPT."
          break
        fi

        REPAIR_ATTEMPT=$((REPAIR_ATTEMPT + 1))
      done

      if [ "$REPAIR_SUCCESS" -ne 1 ]; then
        log "ERROR: Morning brief artifact validation failed after repair attempts."
        EXIT_CODE=2
      fi
    fi
  fi
else
  log "Morning prep exited with code $EXIT_CODE — check $PRIMARY_LOG"
fi

# Append to agent log
echo "" >> "$LOG_FILE"
echo "## Morning Prep (automated)" >> "$LOG_FILE"
echo "- **Time:** $(date +"%H:%M")" >> "$LOG_FILE"
echo "- **Status:** $([ "$EXIT_CODE" -eq 0 ] && echo '✅ Success' || echo '❌ Failed')" >> "$LOG_FILE"
echo "- **Log:** \`$PRIMARY_LOG\`" >> "$LOG_FILE"

exit "$EXIT_CODE"
