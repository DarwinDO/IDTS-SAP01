<#
.SYNOPSIS
Runs the private IDTS-45 Render PostgreSQL continuity proof.

.DESCRIPTION
This orchestrates the IDTS-45 operator flow:
  1. verify RENDER_QA_DATABASE_URL is set without printing it;
  2. run a private Render PostgreSQL backup;
  3. start a disposable local Docker PostgreSQL restore target;
  4. restore the backup into that temporary target;
  5. generate a sanitized evidence summary for DonHV to manually upload;
  6. remove the temporary restore target and local restore URL file.

It never prints the Render database URL, local restore URL, passwords, or backup
contents. It writes only sanitized evidence under a gitignored private folder.

.EXAMPLE
$env:RENDER_QA_DATABASE_URL = "<paste Render external database URL privately>"
powershell -ExecutionPolicy Bypass -File scripts/render/run-render-postgres-continuity-proof.ps1
#>

[CmdletBinding()]
param(
  [string]$DatabaseUrlEnv = "RENDER_QA_DATABASE_URL",
  [string]$OutputDirectory = "$HOME\IDTS-private-backups\idts-45",
  [string]$PrivateEvidenceDirectory = "docs/pm/evidence/idts-45/private",
  [string]$ContainerName = "idts-45-restore-target",
  [string]$PostgresDockerImage = "postgres:15",
  [switch]$KeepRestoreTarget
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SafeInfo {
  param([string]$Message)
  Write-Host "[idts-45-proof] $Message"
}

function Get-PrivateEnvValue {
  param([string]$Name)

  foreach ($scope in @("Process", "User", "Machine")) {
    $value = [Environment]::GetEnvironmentVariable($Name, $scope)
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $value
    }
  }

  return $null
}

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Script
  )

  Write-SafeInfo $Name
  & $Script
  if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE."
  }
}

$databaseUrl = Get-PrivateEnvValue -Name $DatabaseUrlEnv
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  throw "Environment variable '$DatabaseUrlEnv' is not set. Set it privately before running continuity proof."
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $PrivateEvidenceDirectory | Out-Null

$runTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$restoreUrlPath = Join-Path $PrivateEvidenceDirectory "idts-45-local-restore-url-$runTimestamp.txt"
$backupPath = $null
$restoreStatus = "NOT_RUN"
$verificationNotes = "Continuity proof did not complete."

try {
  $backupStartTime = Get-Date

  Invoke-Step -Name "Running private Render PostgreSQL backup." -Script {
    powershell -ExecutionPolicy Bypass -File scripts/render/backup-render-postgres.ps1 `
      -DatabaseUrlEnv $DatabaseUrlEnv `
      -OutputDirectory $OutputDirectory `
      -PostgresDockerImage $PostgresDockerImage
  }

  $backupItem = Get-ChildItem -LiteralPath $OutputDirectory -Filter "*.pgdump" |
    Where-Object { $_.LastWriteTime -ge $backupStartTime.AddSeconds(-5) } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $backupItem) {
    throw "Backup completed but no .pgdump file was found in the output directory."
  }

  $backupPath = $backupItem.FullName
  Write-SafeInfo "Backup file was created in the private output directory."

  Invoke-Step -Name "Starting disposable local PostgreSQL restore target." -Script {
    powershell -ExecutionPolicy Bypass -File scripts/render/start-local-restore-target.ps1 `
      -ContainerName $ContainerName `
      -PostgresDockerImage $PostgresDockerImage `
      -UrlOutputPath $restoreUrlPath `
      -SuppressUrlOutput
  }

  $restoreUrl = Get-Content -Raw -LiteralPath $restoreUrlPath
  $restoreUrl = $restoreUrl.Trim()
  if ([string]::IsNullOrWhiteSpace($restoreUrl)) {
    throw "Restore URL file was created but is empty."
  }

  $env:IDTS_RESTORE_DATABASE_URL = $restoreUrl

  Invoke-Step -Name "Restoring backup into disposable local PostgreSQL target." -Script {
    powershell -ExecutionPolicy Bypass -File scripts/render/restore-render-postgres.ps1 `
      -BackupPath $backupPath `
      -RestoreDatabaseUrlEnv "IDTS_RESTORE_DATABASE_URL" `
      -PostgresDockerImage $PostgresDockerImage `
      -IUnderstandTargetWillBeOverwritten
  }

  $restoreStatus = "PASS"
  $verificationNotes = "Backup restored into disposable local Docker PostgreSQL target. Operator should spot-check representative CAP tables before closing IDTS-45."
} catch {
  $restoreStatus = "FAIL"
  $verificationNotes = "Continuity proof failed before completion. See local terminal output for the failing step. Do not upload private URLs or dump contents."
  throw
} finally {
  Remove-Item Env:\IDTS_RESTORE_DATABASE_URL -ErrorAction SilentlyContinue
  if (Test-Path -LiteralPath $restoreUrlPath) {
    Remove-Item -LiteralPath $restoreUrlPath -ErrorAction SilentlyContinue
  }

  if ($backupPath -and (Test-Path -LiteralPath $backupPath)) {
    powershell -ExecutionPolicy Bypass -File scripts/render/write-backup-evidence-summary.ps1 `
      -BackupPath $backupPath `
      -RestoreTargetType "Local Docker PostgreSQL target" `
      -RestoreStatus $restoreStatus `
      -VerificationNotes $verificationNotes `
      -OutputDirectory $PrivateEvidenceDirectory
  }

  if (-not $KeepRestoreTarget) {
    powershell -ExecutionPolicy Bypass -File scripts/render/stop-local-restore-target.ps1 `
      -ContainerName $ContainerName
  } else {
    Write-SafeInfo "Keeping restore target because -KeepRestoreTarget was passed."
  }
}

Write-SafeInfo "Continuity proof finished. Review sanitized evidence under '$PrivateEvidenceDirectory' before manually uploading it to Jira."
