<#
.SYNOPSIS
Inspects or restores an IDTS Render PostgreSQL logical backup to a temporary target.

.DESCRIPTION
This script is intentionally conservative. By default, use -InspectOnly to prove
that a .pgdump archive is readable without connecting to any database.

Actual restore requires:
  - BackupPath
  - IDTS_RESTORE_DATABASE_URL, set privately
  - -IUnderstandTargetWillBeOverwritten

Never restore into the live shared-QA Render database. Use a temporary local or
cloud PostgreSQL target and delete it after the proof.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts/render/restore-render-postgres.ps1 `
  -BackupPath "$HOME\IDTS-private-backups\idts-45\idts-render-qa-postgres-20260707-210000.pgdump" `
  -InspectOnly

.EXAMPLE
$env:IDTS_RESTORE_DATABASE_URL = "<temporary PostgreSQL target URL>"
powershell -ExecutionPolicy Bypass -File scripts/render/restore-render-postgres.ps1 `
  -BackupPath "$HOME\IDTS-private-backups\idts-45\idts-render-qa-postgres-20260707-210000.pgdump" `
  -IUnderstandTargetWillBeOverwritten
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$RestoreDatabaseUrlEnv = "IDTS_RESTORE_DATABASE_URL",
  [switch]$InspectOnly,
  [switch]$IUnderstandTargetWillBeOverwritten
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SafeInfo {
  param([string]$Message)
  Write-Host "[idts-45-restore] $Message"
}

function Get-RequiredCommand {
  param([string]$Name)
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Required command '$Name' was not found. Install PostgreSQL client tools first, then retry. On Windows, install PostgreSQL and add its 'bin' folder to PATH."
  }
  return $command.Source
}

function Set-PostgresEnvFromUrl {
  param([string]$DatabaseUrl)

  if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw "Environment variable '$RestoreDatabaseUrlEnv' is empty. Set it privately before restoring."
  }

  $uri = [Uri]$DatabaseUrl
  if ($uri.Scheme -notin @("postgres", "postgresql")) {
    throw "Environment variable '$RestoreDatabaseUrlEnv' is not a PostgreSQL URL."
  }

  $userInfoParts = $uri.UserInfo.Split(":", 2)
  if ($userInfoParts.Count -lt 2) {
    throw "Restore database URL must include username and password."
  }

  $env:PGHOST = $uri.Host
  $env:PGPORT = if ($uri.Port -gt 0) { [string]$uri.Port } else { "5432" }
  $env:PGDATABASE = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/"))
  $env:PGUSER = [Uri]::UnescapeDataString($userInfoParts[0])
  $env:PGPASSWORD = [Uri]::UnescapeDataString($userInfoParts[1])
  $env:PGSSLMODE = "require"

  if ([string]::IsNullOrWhiteSpace($env:PGDATABASE)) {
    throw "Restore database URL does not contain a database name."
  }
}

try {
  $pgRestore = Get-RequiredCommand "pg_restore"

  if (-not (Test-Path -LiteralPath $BackupPath)) {
    throw "Backup file was not found: $BackupPath"
  }

  Write-SafeInfo "Backup file exists."

  if ($InspectOnly) {
    & $pgRestore --list "$BackupPath" | Select-Object -First 20
    if ($LASTEXITCODE -ne 0) {
      throw "pg_restore --list failed with exit code $LASTEXITCODE."
    }
    Write-SafeInfo "InspectOnly completed. No database connection was opened."
    exit 0
  }

  if (-not $IUnderstandTargetWillBeOverwritten) {
    throw "Restore refused. Pass -IUnderstandTargetWillBeOverwritten only when the target is a temporary PostgreSQL database, not the live Render QA database."
  }

  $databaseUrl = [Environment]::GetEnvironmentVariable($RestoreDatabaseUrlEnv, "Process")
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = [Environment]::GetEnvironmentVariable($RestoreDatabaseUrlEnv, "User")
  }
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = [Environment]::GetEnvironmentVariable($RestoreDatabaseUrlEnv, "Machine")
  }

  Set-PostgresEnvFromUrl -DatabaseUrl $databaseUrl

  Write-SafeInfo "Restore target variables are loaded without printing secret values."
  & $pgRestore --clean --if-exists --no-owner --no-acl --dbname "$env:PGDATABASE" "$BackupPath"
  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed with exit code $LASTEXITCODE."
  }

  Write-SafeInfo "Restore completed into the configured temporary PostgreSQL target."
} finally {
  Remove-Item Env:\PGHOST -ErrorAction SilentlyContinue
  Remove-Item Env:\PGPORT -ErrorAction SilentlyContinue
  Remove-Item Env:\PGDATABASE -ErrorAction SilentlyContinue
  Remove-Item Env:\PGUSER -ErrorAction SilentlyContinue
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:\PGSSLMODE -ErrorAction SilentlyContinue
}
