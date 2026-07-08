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
  [string]$PostgresDockerImage = "postgres:15",
  [switch]$InspectOnly,
  [switch]$IUnderstandTargetWillBeOverwritten
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SafeInfo {
  param([string]$Message)
  Write-Host "[idts-45-restore] $Message"
}

function Get-PostgresClientRunner {
  param([string]$Name)
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) {
    return @{
      Mode = "host"
      Command = $command.Source
    }
  }

  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if ($docker) {
    & $docker.Source run --rm $PostgresDockerImage $Name --version | Out-Null
    if ($LASTEXITCODE -eq 0) {
      return @{
        Mode = "docker"
        Command = $docker.Source
      }
    }
  }

  throw "Required command '$Name' was not found on the host and Docker fallback '$PostgresDockerImage' could not run it. Install PostgreSQL client tools or start Docker Desktop, then retry."
}

function Get-DockerBackupMount {
  param([string]$BackupPath)
  $backupItem = Get-Item -LiteralPath $BackupPath
  $backupDirectory = $backupItem.Directory.FullName
  return @{
    FileName = $backupItem.Name
    Volume = "$($backupDirectory):/backup:ro"
    ContainerPath = "/backup/$($backupItem.Name)"
  }
}

function Invoke-PgRestoreList {
  param(
    [hashtable]$Runner,
    [string]$BackupPath,
    [string]$PostgresDockerImage
  )

  if ($Runner.Mode -eq "host") {
    & $Runner.Command --list "$BackupPath" | Select-Object -First 20
    return $LASTEXITCODE
  }

  $mount = Get-DockerBackupMount -BackupPath $BackupPath
  $dockerArgs = @(
    "run",
    "--rm",
    "--volume", $mount.Volume,
    $PostgresDockerImage,
    "pg_restore",
    "--list",
    $mount.ContainerPath
  )
  & $Runner.Command @dockerArgs | Select-Object -First 20
  return $LASTEXITCODE
}

function Invoke-PgRestoreToTarget {
  param(
    [hashtable]$Runner,
    [string]$BackupPath,
    [string]$PostgresDockerImage
  )

  if ($Runner.Mode -eq "host") {
    & $Runner.Command --clean --if-exists --no-owner --no-acl --dbname "$env:PGDATABASE" "$BackupPath"
    return $LASTEXITCODE
  }

  $mount = Get-DockerBackupMount -BackupPath $BackupPath
  $dockerArgs = @(
    "run",
    "--rm"
  )

  if ($env:PGHOST -in @("localhost", "127.0.0.1", "::1")) {
    $dockerArgs += @(
      "--add-host", "host.docker.internal:host-gateway",
      "--env", "PGHOST=host.docker.internal"
    )
  } else {
    $dockerArgs += @("--env", "PGHOST")
  }

  $dockerArgs += @(
    "--env", "PGPORT",
    "--env", "PGDATABASE",
    "--env", "PGUSER",
    "--env", "PGPASSWORD",
    "--env", "PGSSLMODE",
    "--volume", $mount.Volume,
    $PostgresDockerImage,
    "pg_restore",
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    "--dbname", "$env:PGDATABASE",
    $mount.ContainerPath
  )
  & $Runner.Command @dockerArgs
  return $LASTEXITCODE
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
  $env:PGSSLMODE = if ($uri.Host -in @("localhost", "127.0.0.1", "::1")) { "disable" } else { "require" }

  if ([string]::IsNullOrWhiteSpace($env:PGDATABASE)) {
    throw "Restore database URL does not contain a database name."
  }
}

try {
  $pgRestore = Get-PostgresClientRunner "pg_restore"

  if (-not (Test-Path -LiteralPath $BackupPath)) {
    throw "Backup file was not found: $BackupPath"
  }

  Write-SafeInfo "Backup file exists."
  Write-SafeInfo "pg_restore available via $($pgRestore.Mode)."

  if ($InspectOnly) {
    $exitCode = Invoke-PgRestoreList -Runner $pgRestore -BackupPath $BackupPath -PostgresDockerImage $PostgresDockerImage
    if ($exitCode -ne 0) {
      throw "pg_restore --list failed with exit code $exitCode."
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
  $exitCode = Invoke-PgRestoreToTarget -Runner $pgRestore -BackupPath $BackupPath -PostgresDockerImage $PostgresDockerImage
  if ($exitCode -ne 0) {
    throw "pg_restore failed with exit code $exitCode."
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
