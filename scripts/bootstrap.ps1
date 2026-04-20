<#
.SYNOPSIS
  Cross-platform entry point for first-time setup on Windows.

.DESCRIPTION
  This is the ONLY PowerShell script in the project. Its single job is to
  ensure Node.js (>=18) is installed, then hand off to scripts/bootstrap.js
  which does the real work. All other automation lives in Node.js modules
  under scripts/.

.EXAMPLE
  .\scripts\bootstrap.ps1
  .\scripts\bootstrap.ps1 -Check
  .\scripts\bootstrap.ps1 -SkipInstall
#>

[CmdletBinding()]
param(
  [switch]$Check,
  [switch]$SkipInstall,
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)

$ErrorActionPreference = "Stop"
$MinNodeMajor = 18

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir

function Say-Ok   ($m) { Write-Host "  ✔ $m" -ForegroundColor Green }
function Say-Warn ($m) { Write-Host "  ⚠ $m" -ForegroundColor Yellow }
function Say-Fail ($m) { Write-Host "  ✖ $m" -ForegroundColor Red }
function Say-Info ($m) { Write-Host "  → $m" -ForegroundColor Cyan }

function Test-Node {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { return $false }
  $v = (& node -v) -replace '^v',''
  $major = [int]($v.Split('.')[0])
  return ($major -ge $MinNodeMajor)
}

function Test-WingetConnectivity {
  Say-Info "Checking connectivity to winget CDN…"
  try {
    $r = Test-NetConnection -ComputerName 'cdn.winget.microsoft.com' -Port 443 -WarningAction SilentlyContinue
    if ($r.TcpTestSucceeded) {
      Say-Ok  "cdn.winget.microsoft.com:443 reachable"
      return $true
    }
  } catch { }
  Say-Warn "cdn.winget.microsoft.com:443 is not reachable."
  Say-Info "Check VPN/proxy, or install Node manually: https://nodejs.org"
  return $false
}

function Invoke-WingetNodeInstall {
  & winget install --id OpenJS.NodeJS.LTS --source winget `
    --silent --accept-package-agreements --accept-source-agreements
  return $LASTEXITCODE
}

function Install-Node {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    if (-not (Test-WingetConnectivity)) {
      throw "winget CDN unreachable — cannot auto-install Node.js"
    }

    Say-Info "Installing Node via winget…"
    $code = Invoke-WingetNodeInstall

    # 0x80072EFD and similar WinINet blips are transient on fresh VMs.
    # Refresh sources once and retry before giving up.
    if ($code -ne 0) {
      Say-Warn "winget install failed (exit $code). Refreshing sources and retrying once…"
      & winget source reset --force 2>$null | Out-Null
      & winget source update 2>$null | Out-Null
      $code = Invoke-WingetNodeInstall
    }

    if ($code -ne 0) {
      throw "winget install failed with exit code $code"
    }
    return
  }
  if (Get-Command choco -ErrorAction SilentlyContinue) {
    Say-Info "Installing Node via Chocolatey…"
    & choco install nodejs-lts -y
    return
  }
  Say-Fail "Neither winget nor Chocolatey found."
  Say-Info "Install Node >= $MinNodeMajor manually: https://nodejs.org"
  throw "Cannot auto-install Node.js"
}

# ── Ensure Node ────────────────────────────────────────────────────
Write-Host "━━━ Ensuring Node.js >= $MinNodeMajor ━━━" -ForegroundColor Cyan

if (Test-Node) {
  Say-Ok "Node.js $((& node -v)) detected"
} else {
  Say-Warn "Node.js >= $MinNodeMajor not found."
  Install-Node

  # Refresh PATH so the newly installed node is visible in this session.
  $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
              [Environment]::GetEnvironmentVariable("Path","User")

  if (-not (Test-Node)) {
    Say-Fail "Node installation did not succeed (or PATH needs a new shell)."
    Say-Info "Open a new PowerShell window and re-run this script."
    exit 1
  }
  Say-Ok "Node.js $((& node -v)) installed"
}

# ── Hand off to bootstrap.js ──────────────────────────────────────
Write-Host "━━━ Handing off to scripts/bootstrap.js ━━━" -ForegroundColor Cyan

$argsToPass = @()
if ($Check)       { $argsToPass += "--check" }
if ($SkipInstall) { $argsToPass += "--skip-install" }
if ($Rest)        { $argsToPass += $Rest }

& node (Join-Path $Root "scripts\bootstrap.js") @argsToPass
exit $LASTEXITCODE
