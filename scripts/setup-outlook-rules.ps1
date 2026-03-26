<#
.SYNOPSIS
    Creates Outlook inbox rules and categories aligned with Kate's triage taxonomy.

.DESCRIPTION
    Connects to Exchange Online and creates server-side inbox rules that auto-categorize
    mail and calendar items using the Priority (P0-P3), Type, and Signal labels defined
    in _kate/preferences.md.

    Categories are created with consistent colors. Rules are ordered by priority so
    higher-priority rules win on conflicts.

.NOTES
    Prerequisites:
      - ExchangeOnlineManagement module:  Install-Module ExchangeOnlineManagement -Scope CurrentUser
      - Run: Connect-ExchangeOnline -UserPrincipalName you@microsoft.com
    
    This script is idempotent — it removes existing Kate-managed rules before recreating them.
    All rule names are prefixed with "[Kate]" for easy identification and cleanup.

.EXAMPLE
    .\scripts\setup-outlook-rules.ps1
    .\scripts\setup-outlook-rules.ps1 -WhatIf
    .\scripts\setup-outlook-rules.ps1 -RemoveOnly
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [switch]$RemoveOnly,
    [string]$UPN
)

$ErrorActionPreference = 'Stop'
$RulePrefix = '[Kate]'

# ── 1. Connect ────────────────────────────────────────────────────────────────
if (-not (Get-Command Get-InboxRule -ErrorAction SilentlyContinue)) {
    Write-Host "Installing ExchangeOnlineManagement module..." -ForegroundColor Yellow
    Install-Module ExchangeOnlineManagement -Scope CurrentUser -Force -AllowClobber
}
Import-Module ExchangeOnlineManagement -ErrorAction Stop

$connected = $false
try { Get-EXOMailbox -ResultSize 1 -ErrorAction Stop | Out-Null; $connected = $true } catch {}
if (-not $connected) {
    if ($UPN) { Connect-ExchangeOnline -UserPrincipalName $UPN -LoadCmdletHelp }
    else      { Connect-ExchangeOnline -LoadCmdletHelp }
}

# ── 2. Clean up existing Kate-managed rules ───────────────────────────────────
Write-Host "`nCleaning up existing $RulePrefix rules..." -ForegroundColor Cyan
# Use StartsWith — -like treats [ ] as wildcard character classes, which would match
# any rule starting with K, a, t, or e and delete rules we don't own.
$existing = Get-InboxRule | Where-Object { $_.Name.StartsWith($RulePrefix) }
foreach ($rule in $existing) {
    if ($PSCmdlet.ShouldProcess($rule.Name, 'Remove-InboxRule')) {
        Remove-InboxRule -Identity $rule.Identity -Confirm:$false
        Write-Host "  Removed: $($rule.Name)" -ForegroundColor DarkGray
    }
}
if ($RemoveOnly) { Write-Host "`nRemoveOnly flag set — done." -ForegroundColor Green; return }

# ── 3. Helper ─────────────────────────────────────────────────────────────────
function New-KateRule {
    param(
        [string]$Name,
        [hashtable]$Params,
        [int]$Priority
    )
    $fullName = "$RulePrefix $Name"
    $Params['Name']     = $fullName
    $Params['Priority'] = $Priority

    if ($PSCmdlet.ShouldProcess($fullName, 'New-InboxRule')) {
        New-InboxRule @Params
        Write-Host "  Created: $fullName (priority $Priority)" -ForegroundColor Green
    }
}

# ── 4. Configuration — EDIT THESE ────────────────────────────────────────────
# Fill in actual addresses / domains for your environment.

# Tier 1 VIP senders (P0 — always URGENT)
$Tier1VIPs = @(
    # 'stu-leader@microsoft.com'
    # 'cos-alias@microsoft.com'
    # Add STU leadership direct reports here
)

# Customer domains (Type: customer)
$CustomerDomains = @(
    # 'customer-a.com'
    # 'customer-b.com'
    # 'customer-c.com'
)

# Partner domains (Type: partner)
$PartnerDomains = @(
    # 'partner-a.com'
    # 'partner-b.com'
)

# Customer name keywords for meeting invite matching
$CustomerKeywords = @(
    # 'CUSTA', 'Customer A', 'CUSTB', 'Customer B'
)

# Distro lists / newsletters to suppress
$SuppressSenders = @(
    # 'stu-all@microsoft.com'
    # 'hls-fyi@microsoft.com'
)

# Automated notification senders
$AutomatedSenders = @(
    'notifications@github.com',
    'azuredevops@microsoft.com',
    'noreply@microsoft.com',
    'no-reply@microsoft.com'
)

# Folders (will be created if they don't exist)
$LowPriorityFolder = '_Low Priority'
$AutomatedFolder    = '_Automated'

# ── 5. Create rules (highest priority = lowest number) ───────────────────────
Write-Host "`nCreating rules..." -ForegroundColor Cyan

$p = 0

# Rule 1: P0 — Tier 1 VIP senders
if ($Tier1VIPs.Count -gt 0) {
    New-KateRule -Name 'P0 — Tier 1 VIP' -Priority ($p++) -Params @{
        From                  = $Tier1VIPs
        ApplyCategory         = @('P0')
        MarkImportance        = 'High'
        StopProcessingRules   = $false
    }
}

# Rule 2: P0 — Escalation keywords
New-KateRule -Name 'P0 — Escalation Keywords' -Priority ($p++) -Params @{
    SubjectOrBodyContainsWords = @('escalation', 'executive sponsor', 'critical blocker', 'P0')
    ApplyCategory              = @('P0', 'action-required')
    MarkImportance             = 'High'
    StopProcessingRules        = $false
}

# Rule 3: Customer — Known customer domains
foreach ($domain in $CustomerDomains) {
    $shortName = $domain.Split('.')[0]
    New-KateRule -Name "Customer — $shortName" -Priority ($p++) -Params @{
        FromAddressContainsWords = @($domain)
        ApplyCategory            = @('customer', 'customer-facing')
        StopProcessingRules      = $false
    }
}

# Rule 4: Partner — Known partner domains
foreach ($domain in $PartnerDomains) {
    $shortName = $domain.Split('.')[0]
    New-KateRule -Name "Partner — $shortName" -Priority ($p++) -Params @{
        FromAddressContainsWords = @($domain)
        ApplyCategory            = @('partner', 'customer-facing')
        StopProcessingRules      = $false
    }
}

# Rule 5: P1 — Meeting invites with customer keywords
New-KateRule -Name 'P1 — Customer Meeting Invite' -Priority ($p++) -Params @{
    MessageTypeMatches         = 'CalendaringMeetingRequest'
    SubjectContainsWords       = $CustomerKeywords
    ApplyCategory              = @('P1', 'prep-needed', 'customer-facing')
    StopProcessingRules        = $false
}

# Rule 6: P1 — Action-required signals
New-KateRule -Name 'P1 — Action Required' -Priority ($p++) -Params @{
    SubjectContainsWords  = @('action required', 'please review', 'need your', 'approval needed', 'decision needed')
    ApplyCategory         = @('P1', 'action-required')
    StopProcessingRules   = $false
}

# Rule 7: P2 — Internal meetings (Microsoft sender, no customer keywords)
New-KateRule -Name 'P2 — Internal Meeting' -Priority ($p++) -Params @{
    MessageTypeMatches         = 'CalendaringMeetingRequest'
    FromAddressContainsWords   = @('microsoft.com')
    ApplyCategory              = @('internal', 'P2')
    StopProcessingRules        = $false
}

# Rule 8: P2 — Enablement content
New-KateRule -Name 'P2 — Enablement' -Priority ($p++) -Params @{
    SubjectContainsWords = @('office hours', 'tech talk', 'training', 'enablement', 'brown bag', 'learning session', 'conference')
    ApplyCategory        = @('enablement', 'P2', 'fyi')
    StopProcessingRules  = $false
}

# Rule 9: Ops — CRM/Pipeline/Capacity
New-KateRule -Name 'P2 — Ops' -Priority ($p++) -Params @{
    SubjectContainsWords = @('pipeline', 'CRM', 'capacity', 'PAT renewal', 'forecast', 'milestone update')
    ApplyCategory        = @('ops', 'P2')
    StopProcessingRules  = $false
}

# Rule 10: P3 — Newsletters & distro noise → _Low Priority
if ($SuppressSenders.Count -gt 0) {
    New-KateRule -Name 'P3 — Newsletters & Distro' -Priority ($p++) -Params @{
        From                = $SuppressSenders
        ApplyCategory       = @('P3', 'fyi')
        MoveToFolder        = $LowPriorityFolder
        StopProcessingRules = $true
    }
}

# Rule 11: P3 — Automated alerts → _Automated
if ($AutomatedSenders.Count -gt 0) {
    New-KateRule -Name 'P3 — Automated Alerts' -Priority ($p++) -Params @{
        From                = $AutomatedSenders
        ApplyCategory       = @('P3', 'fyi')
        MoveToFolder        = $AutomatedFolder
        StopProcessingRules = $true
    }
}

# Rule 12: FYI — CC'd only
New-KateRule -Name 'FYI — CC Only' -Priority ($p++) -Params @{
    MyNameInCcBox       = $true
    MyNameNotInToBox    = $true
    ApplyCategory       = @('fyi')
    StopProcessingRules = $false
}

# ── 6. Summary ────────────────────────────────────────────────────────────────
Write-Host "`n✓ Created $p rules with prefix '$RulePrefix'" -ForegroundColor Green
Write-Host @"

Next steps:
  1. Fill in Tier 1 VIP addresses in the `$Tier1VIPs array.
  2. Fill in distro lists in the `$SuppressSenders array.
  3. Create the Outlook categories with colors via Outlook → Categories → All Categories.
  4. Create folders: '$LowPriorityFolder' and '$AutomatedFolder' in your mailbox.
  5. Re-run this script after edits:  .\scripts\setup-outlook-rules.ps1

To remove all Kate-managed rules:
  .\scripts\setup-outlook-rules.ps1 -RemoveOnly
"@
