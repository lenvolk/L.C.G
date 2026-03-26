<#
  milestone-review.ps1 — Copilot CLI-driven team milestone health review (Windows)

  Scheduled weekly (Monday) or bi-weekly via Task Scheduler, or run manually.
  Uses copilot CLI with MSX-CRM and OIL MCP servers to produce
  a consolidated milestone status report for the manager and direct reports.

  Environment variables:
    MCAPS_REPO              — Path to KATE repo
    OBSIDIAN_VAULT_PATH     — Path to Obsidian vault
    MANAGER_NAME            — Manager name override (default: authenticated CRM user)
    COPILOT_CLI_PATH        — Path to copilot CLI binary
    MAX_MILESTONE_REVIEW_REPAIR_ATTEMPTS — Repair loop limit (default: 1)
#>
param(
  [string]$ManagerName = $env:MANAGER_NAME,
  [switch]$ForceWeekend
)

$ErrorActionPreference = "Stop"

$RepoDir = if ($env:MCAPS_REPO) { $env:MCAPS_REPO } else { "$HOME\Repos\_InternalTools\KATE" }
$VaultDir = if ($env:OBSIDIAN_VAULT_PATH) { $env:OBSIDIAN_VAULT_PATH } else { "$HOME\Documents\Obsidian\Jin @ Microsoft" }
$Today = Get-Date -Format "yyyy-MM-dd"
$DayOfWeek = (Get-Date).DayOfWeek

# Skip weekends unless forced
if ($DayOfWeek -in @('Saturday', 'Sunday') -and -not $ForceWeekend) {
  Write-Host "[milestone-review] Weekend — skipping."
  exit 0
}

$LogDir = Join-Path $VaultDir "_agent-log"
$LogFile = Join-Path $LogDir "$Today.md"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
if (-not (Test-Path $LogFile)) {
  "# Agent Log - $Today`n" | Set-Content -Path $LogFile -Encoding utf8
}

function Log($Message) {
  $ts = Get-Date -Format "HH:mm:ss"
  Write-Host "[$ts] $Message"
  "- [$ts] milestone-review: $Message" | Add-Content -Path $LogFile -Encoding utf8
}

Log "Starting milestone review for $Today"
Log "Repo: $RepoDir"
Log "Vault: $VaultDir"
if ($ManagerName) { Log "Manager override: $ManagerName" }

Set-Location $RepoDir

# Check Azure CLI token
try {
  az account get-access-token --resource https://graph.microsoft.com 2>&1 | Out-Null
} catch {
  Log "WARNING: Azure CLI token expired — run 'az login' to refresh."
}

# Resolve copilot CLI
$CopilotBin = if ($env:COPILOT_CLI_PATH) { $env:COPILOT_CLI_PATH } else { "copilot" }
if (-not (Get-Command $CopilotBin -ErrorAction SilentlyContinue)) {
  $CopilotBin = Join-Path $env:APPDATA "Code\User\globalStorage\github.copilot-chat\copilotCli\copilot.exe"
  if (-not (Test-Path $CopilotBin)) {
    Log "ERROR: copilot CLI not found."
    exit 1
  }
}

# Load and fill prompt template
$PromptFile = Join-Path $RepoDir ".github\prompts\crm-milestone-review.prompt.md"
if (-not (Test-Path $PromptFile)) {
  Log "ERROR: Prompt template not found at $PromptFile"
  exit 1
}

$ManagerValue = if ($ManagerName) { $ManagerName } else { "me" }
$PromptText = (Get-Content $PromptFile -Raw) `
  -replace '\{\{TODAY\}\}', $Today `
  -replace '\{\{manager_name\}\}', $ManagerValue

$env:OBSIDIAN_VAULT_PATH = $VaultDir

$MaxRepair = if ($env:MAX_MILESTONE_REVIEW_REPAIR_ATTEMPTS) { [int]$env:MAX_MILESTONE_REVIEW_REPAIR_ATTEMPTS } else { 1 }
$MaxAttempts = 1 + $MaxRepair
$Attempt = 0

Log "Running copilot CLI (non-interactive)…"

while ($Attempt -lt $MaxAttempts) {
  $Attempt++

  if ($Attempt -eq 1) {
    Log "Attempt $Attempt/$MaxAttempts`: primary run"
    $PromptText | & $CopilotBin --non-interactive 2>&1 | Tee-Object -Append -FilePath $LogFile
  } else {
    Log "Attempt $Attempt/$MaxAttempts`: repair run"
    $RepairPrompt = "Today is $Today. The milestone review output at Weekly/$Today-milestone-review.md may be incomplete or malformed. Re-run the crm-milestone-review workflow and overwrite the file."
    $RepairPrompt | & $CopilotBin --non-interactive 2>&1 | Tee-Object -Append -FilePath $LogFile
  }

  $OutputFile = Join-Path $VaultDir "Weekly\$Today-milestone-review.md"
  if (Test-Path $OutputFile) {
    Log "✅ Milestone review written to Weekly/$Today-milestone-review.md"
    break
  } else {
    Log "⚠️ Output file not found — will retry if attempts remain"
  }
}

if ($Attempt -ge $MaxAttempts -and -not (Test-Path (Join-Path $VaultDir "Weekly\$Today-milestone-review.md"))) {
  Log "❌ Milestone review failed after $MaxAttempts attempts"
  exit 1
}

Log "Milestone review complete."
