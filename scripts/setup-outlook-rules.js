#!/usr/bin/env node

/**
 * setup-outlook-rules.js — install/remove Outlook inbox rules aligned to the
 * project's triage taxonomy (Priority P0–P3, Type, Signal).
 *
 * Cross-platform wrapper around PowerShell. The underlying Exchange Online
 * management module is only available to PowerShell — this script requires
 * `pwsh` (PowerShell 7+) on macOS/Linux or `pwsh`/`powershell` on Windows.
 *
 * Usage:
 *   node scripts/setup-outlook-rules.js                  # create rules
 *   node scripts/setup-outlook-rules.js --remove-only    # remove managed rules
 *   node scripts/setup-outlook-rules.js --whatif         # preview only
 *   node scripts/setup-outlook-rules.js --upn you@foo    # explicit sign-in
 *   node scripts/setup-outlook-rules.js --prefix "[L.C.G]"  # custom rule prefix
 *
 * Customize the VIP list, customer/partner domains, and suppression senders
 * via a JSON file (--config <path>) or by editing the defaults at the top of
 * this file.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { platform } from "node:os";

const isWin = platform() === "win32";

// ── CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(n) { return args.includes(`--${n}`); }
function param(n, def) {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
}

const REMOVE_ONLY = flag("remove-only");
const WHATIF = flag("whatif") || flag("what-if");
const UPN = param("upn", "");
const PREFIX = param("prefix", "[L.C.G]");
const CONFIG_PATH = param("config", "");

// ── Default config (override with --config <file.json>) ────────────
const DEFAULT_CONFIG = {
  tier1VIPs: [],              // ["exec@yourcorp.com"]
  customerDomains: [],        // ["customer-a.com"]
  partnerDomains: [],         // ["partner-a.com"]
  customerKeywords: [],       // ["CUSTA", "Customer A"]
  suppressSenders: [],        // ["all-hands@yourcorp.com"]
  automatedSenders: [
    "notifications@github.com",
    "azuredevops@microsoft.com",
    "noreply@microsoft.com",
    "no-reply@microsoft.com",
  ],
  lowPriorityFolder: "_Low Priority",
  automatedFolder: "_Automated",
};

let config = DEFAULT_CONFIG;
if (CONFIG_PATH) {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`[outlook-rules] Config file not found: ${CONFIG_PATH}`);
    process.exit(2);
  }
  try {
    config = { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) };
  } catch (err) {
    console.error(`[outlook-rules] Invalid JSON in ${CONFIG_PATH}: ${err.message}`);
    process.exit(2);
  }
}

// ── Locate PowerShell ──────────────────────────────────────────────
function pwshBin() {
  if (onPath("pwsh")) return "pwsh";
  if (isWin && onPath("powershell")) return "powershell";
  return null;
}
function onPath(cmd) {
  return spawnSync(isWin ? "where" : "which", [cmd], { stdio: "ignore" }).status === 0;
}

const PWSH = pwshBin();
if (!PWSH) {
  console.error(
    "[outlook-rules] PowerShell not found.\n" +
    "  Install PowerShell 7+:\n" +
    "  macOS:   brew install --cask powershell\n" +
    "  Linux:   https://learn.microsoft.com/powershell/scripting/install/\n" +
    "  Windows: included by default (or `winget install Microsoft.PowerShell`)"
  );
  process.exit(1);
}

// ── Generate the embedded PowerShell script ────────────────────────
function psArray(items) {
  if (!items || items.length === 0) return "@()";
  const quoted = items.map((s) => `'${String(s).replace(/'/g, "''")}'`);
  return `@(${quoted.join(", ")})`;
}

const SCRIPT = `
$ErrorActionPreference = 'Stop'
$RulePrefix = '${PREFIX.replace(/'/g, "''")}'
$RemoveOnly  = $${REMOVE_ONLY ? "true" : "false"}
$WhatIfPref  = $${WHATIF ? "true" : "false"}

if (-not (Get-Command Get-InboxRule -ErrorAction SilentlyContinue)) {
  Write-Host "Installing ExchangeOnlineManagement module..." -ForegroundColor Yellow
  Install-Module ExchangeOnlineManagement -Scope CurrentUser -Force -AllowClobber
}
Import-Module ExchangeOnlineManagement -ErrorAction Stop

$connected = $false
try { Get-EXOMailbox -ResultSize 1 -ErrorAction Stop | Out-Null; $connected = $true } catch {}
if (-not $connected) {
  ${UPN ? `Connect-ExchangeOnline -UserPrincipalName '${UPN.replace(/'/g, "''")}' -LoadCmdletHelp` : `Connect-ExchangeOnline -LoadCmdletHelp`}
}

Write-Host "\`nCleaning up existing $RulePrefix rules..." -ForegroundColor Cyan
$existing = Get-InboxRule | Where-Object { $_.Name.StartsWith($RulePrefix) }
foreach ($rule in $existing) {
  if ($WhatIfPref) { Write-Host "  [WhatIf] Remove: $($rule.Name)" -ForegroundColor DarkGray; continue }
  Remove-InboxRule -Identity $rule.Identity -Confirm:$false
  Write-Host "  Removed: $($rule.Name)" -ForegroundColor DarkGray
}
if ($RemoveOnly) { Write-Host "\`nremove-only — done." -ForegroundColor Green; return }

function New-ManagedRule([string]$Name, [hashtable]$Params, [int]$Priority) {
  $fullName = "$RulePrefix $Name"
  $Params['Name']     = $fullName
  $Params['Priority'] = $Priority
  if ($WhatIfPref) { Write-Host "  [WhatIf] Create: $fullName (priority $Priority)" -ForegroundColor DarkGray; return }
  New-InboxRule @Params | Out-Null
  Write-Host "  Created: $fullName (priority $Priority)" -ForegroundColor Green
}

$Tier1VIPs        = ${psArray(config.tier1VIPs)}
$CustomerDomains  = ${psArray(config.customerDomains)}
$PartnerDomains   = ${psArray(config.partnerDomains)}
$CustomerKeywords = ${psArray(config.customerKeywords)}
$SuppressSenders  = ${psArray(config.suppressSenders)}
$AutomatedSenders = ${psArray(config.automatedSenders)}
$LowPriorityFolder = '${config.lowPriorityFolder.replace(/'/g, "''")}'
$AutomatedFolder   = '${config.automatedFolder.replace(/'/g, "''")}'

Write-Host "\`nCreating rules..." -ForegroundColor Cyan
$p = 0

if ($Tier1VIPs.Count -gt 0) {
  New-ManagedRule 'P0 — Tier 1 VIP' @{
    From                = $Tier1VIPs
    ApplyCategory       = @('P0')
    MarkImportance      = 'High'
    StopProcessingRules = $false
  } ($p++)
}

New-ManagedRule 'P0 — Escalation Keywords' @{
  SubjectOrBodyContainsWords = @('escalation', 'executive sponsor', 'critical blocker', 'P0')
  ApplyCategory              = @('P0', 'action-required')
  MarkImportance             = 'High'
  StopProcessingRules        = $false
} ($p++)

foreach ($domain in $CustomerDomains) {
  $short = $domain.Split('.')[0]
  New-ManagedRule "Customer — $short" @{
    FromAddressContainsWords = @($domain)
    ApplyCategory            = @('customer', 'customer-facing')
    StopProcessingRules      = $false
  } ($p++)
}

foreach ($domain in $PartnerDomains) {
  $short = $domain.Split('.')[0]
  New-ManagedRule "Partner — $short" @{
    FromAddressContainsWords = @($domain)
    ApplyCategory            = @('partner', 'customer-facing')
    StopProcessingRules      = $false
  } ($p++)
}

if ($CustomerKeywords.Count -gt 0) {
  New-ManagedRule 'P1 — Customer Meeting Invite' @{
    MessageTypeMatches   = 'CalendaringMeetingRequest'
    SubjectContainsWords = $CustomerKeywords
    ApplyCategory        = @('P1', 'prep-needed', 'customer-facing')
    StopProcessingRules  = $false
  } ($p++)
}

New-ManagedRule 'P1 — Action Required' @{
  SubjectContainsWords = @('action required', 'please review', 'need your', 'approval needed', 'decision needed')
  ApplyCategory        = @('P1', 'action-required')
  StopProcessingRules  = $false
} ($p++)

New-ManagedRule 'P2 — Enablement' @{
  SubjectContainsWords = @('office hours', 'tech talk', 'training', 'enablement', 'brown bag', 'learning session', 'conference')
  ApplyCategory        = @('enablement', 'P2', 'fyi')
  StopProcessingRules  = $false
} ($p++)

New-ManagedRule 'P2 — Ops' @{
  SubjectContainsWords = @('pipeline', 'CRM', 'capacity', 'PAT renewal', 'forecast', 'milestone update')
  ApplyCategory        = @('ops', 'P2')
  StopProcessingRules  = $false
} ($p++)

if ($SuppressSenders.Count -gt 0) {
  New-ManagedRule 'P3 — Newsletters & Distro' @{
    From                = $SuppressSenders
    ApplyCategory       = @('P3', 'fyi')
    MoveToFolder        = $LowPriorityFolder
    StopProcessingRules = $true
  } ($p++)
}

if ($AutomatedSenders.Count -gt 0) {
  New-ManagedRule 'P3 — Automated Alerts' @{
    From                = $AutomatedSenders
    ApplyCategory       = @('P3', 'fyi')
    MoveToFolder        = $AutomatedFolder
    StopProcessingRules = $true
  } ($p++)
}

New-ManagedRule 'FYI — CC Only' @{
  MyNameInCcBox       = $true
  MyNameNotInToBox    = $true
  ApplyCategory       = @('fyi')
  StopProcessingRules = $false
} ($p++)

Write-Host "\`n✓ Created $p rules with prefix '$RulePrefix'" -ForegroundColor Green
`;

// ── Invoke PowerShell ───────────────────────────────────────────────
const r = spawnSync(PWSH, ["-NoProfile", "-Command", SCRIPT], { stdio: "inherit" });
process.exit(r.status ?? 1);
