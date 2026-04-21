[CmdletBinding()]
param(
  [string]$Dir = (Join-Path (Get-Location).Path 'L.C.G'),
  [string]$Ref,
  [switch]$Force,
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$BootstrapArgs
)

$ErrorActionPreference = 'Stop'

$repoOwner = 'JinLee794'
$repoName = 'L.C.G'
$defaultRef = 'main'

function Write-Info($message) {
  Write-Host $message -ForegroundColor Cyan
}

function Resolve-InstallRef {
  param(
    [string]$ProvidedRef,
    [bool]$WasExplicit
  )

  if ($WasExplicit -and -not [string]::IsNullOrWhiteSpace($ProvidedRef)) {
    return [pscustomobject]@{
      Ref = $ProvidedRef
      Source = 'explicit'
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($env:LCG_INSTALL_REF)) {
    return [pscustomobject]@{
      Ref = $env:LCG_INSTALL_REF
      Source = 'env:LCG_INSTALL_REF'
    }
  }

  try {
    $history = Get-History -Count 25 -ErrorAction Stop | Sort-Object Id -Descending
    foreach ($entry in $history) {
      $line = [string]$entry.CommandLine
      if ([string]::IsNullOrWhiteSpace($line)) {
        continue
      }

      if ($line -match "raw\.githubusercontent\.com/$repoOwner/$repoName/([^/\s]+)/scripts/install\.ps1") {
        return [pscustomobject]@{
          Ref = $matches[1]
          Source = 'history:raw-url'
        }
      }

      if ($line -match "github\.com/$repoOwner/$repoName/blob/([^/\s]+)/scripts/install\.ps1") {
        return [pscustomobject]@{
          Ref = $matches[1]
          Source = 'history:blob-url'
        }
      }
    }
  }
  catch {
    # Ignore history read failures (non-interactive shells may not expose history).
  }

  return [pscustomobject]@{
    Ref = $defaultRef
    Source = 'default'
  }
}

$wasRefExplicit = $PSBoundParameters.ContainsKey('Ref')
$resolvedRef = Resolve-InstallRef -ProvidedRef $Ref -WasExplicit $wasRefExplicit
$Ref = $resolvedRef.Ref
$refSource = $resolvedRef.Source

Write-Info "PowerShell version: $($PSVersionTable.PSVersion.ToString())"
Write-Info "Install ref source: $refSource"
Write-Info "Using ref '$Ref'."

$archiveUrl = "https://codeload.github.com/$repoOwner/$repoName/zip/refs/heads/$Ref"

$dirWasExplicit = $PSBoundParameters.ContainsKey('Dir')
$defaultInstallRoot = 'C:\temp'
$defaultInstallDir = Join-Path $defaultInstallRoot 'L.C.G'

if (-not $dirWasExplicit) {
  Write-Info 'Where would you like to install L.C.G?'

  if (-not (Test-Path $defaultInstallRoot)) {
    New-Item -ItemType Directory -Path $defaultInstallRoot -Force | Out-Null
  }

  $requestedDir = $null
  try {
    $requestedDir = Read-Host "Install directory (press Enter for $defaultInstallDir)"
  }
  catch {
    # In non-interactive runs, default to C:\temp\L.C.G.
  }

  if ([string]::IsNullOrWhiteSpace($requestedDir)) {
    $Dir = $defaultInstallDir
    Write-Info "Using default install directory '$Dir'."
  } else {
    $Dir = $requestedDir.Trim()
  }
}

$Dir = [System.IO.Path]::GetFullPath($Dir)

# Block installation into cloud-synced directories (credentials would sync to the cloud).
$dirLower = $Dir.ToLower()
if ($dirLower -match 'onedrive|dropbox|google drive|icloud') {
  Write-Host ''
  Write-Host 'ERROR: Install path appears to be inside a cloud-synced folder:' -ForegroundColor Red
  Write-Host "  $Dir" -ForegroundColor Red
  Write-Host ''
  Write-Host 'L.C.G. stores cached credentials locally (.env, .npmrc tokens). Installing' -ForegroundColor Yellow
  Write-Host 'here would sync those secrets to the cloud - which will get you an email' -ForegroundColor Yellow
  Write-Host 'from CISO you don''t want.' -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Choose a non-synced directory instead:' -ForegroundColor Cyan
  Write-Host '  ... | iex; Install-LCG -Dir "$HOME\L.C.G"' -ForegroundColor Cyan
  return 1
}

if ((Test-Path $Dir) -and -not $Force) {
  Write-Error "Destination already exists: $Dir`nRe-run with -Force to replace it, or pass -Dir to choose another path."
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString())
$archivePath = Join-Path $tempRoot "$repoName.zip"
$extractPath = Join-Path $tempRoot 'extract'

New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
  Write-Info "Downloading $repoOwner/$repoName@$Ref..."
  Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath

  Write-Info 'Extracting archive...'
  Expand-Archive -Path $archivePath -DestinationPath $extractPath -Force

  $expandedDir = Join-Path $extractPath "$repoName-$Ref"
  if (-not (Test-Path $expandedDir)) {
    throw "Expected extracted directory not found: $expandedDir"
  }

  $parent = Split-Path -Parent $Dir
  if ($parent) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }

  if (Test-Path $Dir) {
    Remove-Item -Path $Dir -Recurse -Force
  }

  Move-Item -Path $expandedDir -Destination $Dir

  Write-Info "Running bootstrap from $Dir..."
  Set-Location $Dir

  # Ensure execution policy allows running the bootstrap script in this process
  # (avoids hardcoding 'powershell' vs 'pwsh' and spawning a mismatched engine).
  Set-ExecutionPolicy -Scope Process Bypass -Force -ErrorAction SilentlyContinue
  $bootstrapResult = $null
  if ($BootstrapArgs) {
    $bootstrapResult = & .\scripts\bootstrap.ps1 @BootstrapArgs
  } else {
    $bootstrapResult = & .\scripts\bootstrap.ps1
  }

  # bootstrap.ps1 can emit regular output + a trailing numeric return value.
  # Extract a numeric code without crashing on mixed output arrays.
  $bootstrapCode = $null
  if ($bootstrapResult -is [array]) {
    $candidateCode = $bootstrapResult | Select-Object -Last 1
  } else {
    $candidateCode = $bootstrapResult
  }

  if ($candidateCode -is [int]) {
    $bootstrapCode = $candidateCode
  } elseif ($null -ne $candidateCode -and ([string]$candidateCode) -match '^-?\d+$') {
    $bootstrapCode = [int]$candidateCode
  } elseif ($LASTEXITCODE -is [int]) {
    $bootstrapCode = $LASTEXITCODE
  } else {
    $bootstrapCode = 0
  }

  if ($bootstrapCode -ne 0) {
    throw "Bootstrap failed with exit code $bootstrapCode. Re-run .\\scripts\\bootstrap.ps1 in '$Dir' to see details."
  }

  $hasVSCode = [bool](Get-Command code -ErrorAction SilentlyContinue)
  if (-not $hasVSCode) {
    Write-Host "[WARN] VS Code not found. Install VS Code + GitHub Copilot Chat before Step 4." -ForegroundColor Yellow
    Write-Host "       https://code.visualstudio.com/" -ForegroundColor Cyan
  }

  $hasObsidian = [bool](Get-Command obsidian -ErrorAction SilentlyContinue)
  if (-not $hasObsidian) {
    Write-Host "[WARN] Obsidian not found. Vault workflows are easier with Obsidian installed." -ForegroundColor Yellow
    Write-Host "       https://obsidian.md/download" -ForegroundColor Cyan
  }

  Write-Info 'Bootstrap completed successfully.'
  return
}
finally {
  if (Test-Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force
  }
}