<#
.SYNOPSIS
Creates a secret-safe logical backup of the Render QA PostgreSQL database.

.DESCRIPTION
This script reads the database connection string from a private environment
variable, runs pg_dump in custom format, and writes a SHA-256 checksum next to
the dump. It never prints the database URL, username, password, host, or query
string.

The default output directory is outside the repository:
  $HOME\IDTS-private-backups\idts-45

Required private environment variable:
  RENDER_QA_DATABASE_URL

Example:
  $env:RENDER_QA_DATABASE_URL = "<paste Render external database URL privately>"
  powershell -ExecutionPolicy Bypass -File scripts/render/backup-render-postgres.ps1

Restore proof should be done against a temporary PostgreSQL target. Do not run
restore against the live shared-QA database.
#>

[CmdletBinding()]
param(
  [string]$DatabaseUrlEnv = "RENDER_QA_DATABASE_URL",
  [string]$OutputDirectory = "$HOME\IDTS-private-backups\idts-45",
  [string]$PostgresDockerImage = "postgres:15",
  [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SafeInfo {
  param([string]$Message)
  Write-Host "[idts-45] $Message"
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

function Invoke-PgDumpBackup {
  param(
    [hashtable]$Runner,
    [string]$BackupPath,
    [string]$OutputDirectory,
    [string]$PostgresDockerImage
  )

  if ($Runner.Mode -eq "host") {
    & $Runner.Command --format=custom --no-owner --no-acl --file "$BackupPath"
    return $LASTEXITCODE
  }

  $resolvedOutputDirectory = (Resolve-Path -LiteralPath $OutputDirectory).Path
  $backupFileName = Split-Path -Leaf $BackupPath
  $dockerArgs = @(
    "run",
    "--rm",
    "--env", "PGHOST",
    "--env", "PGPORT",
    "--env", "PGDATABASE",
    "--env", "PGUSER",
    "--env", "PGPASSWORD",
    "--env", "PGSSLMODE",
    "--volume", "$($resolvedOutputDirectory):/backup",
    $PostgresDockerImage,
    "pg_dump",
    "--format=custom",
    "--no-owner",
    "--no-acl",
    "--file", "/backup/$backupFileName"
  )
  & $Runner.Command @dockerArgs
  return $LASTEXITCODE
}

function Set-PostgresEnvFromUrl {
  param([string]$DatabaseUrl)

  if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw "Environment variable '$DatabaseUrlEnv' is empty. Set it privately before running this script."
  }

  $uri = [Uri]$DatabaseUrl
  if ($uri.Scheme -notin @("postgres", "postgresql")) {
    throw "Environment variable '$DatabaseUrlEnv' is not a PostgreSQL URL."
  }

  $userInfoParts = $uri.UserInfo.Split(":", 2)
  if ($userInfoParts.Count -lt 2) {
    throw "Database URL must include username and password."
  }

  $env:PGHOST = $uri.Host
  $env:PGPORT = if ($uri.Port -gt 0) { [string]$uri.Port } else { "5432" }
  $env:PGDATABASE = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/"))
  $env:PGUSER = [Uri]::UnescapeDataString($userInfoParts[0])
  $env:PGPASSWORD = [Uri]::UnescapeDataString($userInfoParts[1])
  $env:PGSSLMODE = "require"

  if ([string]::IsNullOrWhiteSpace($env:PGDATABASE)) {
    throw "Database URL does not contain a database name."
  }
}

try {
  $pgDump = Get-PostgresClientRunner "pg_dump"
  $databaseUrl = [Environment]::GetEnvironmentVariable($DatabaseUrlEnv, "Process")
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = [Environment]::GetEnvironmentVariable($DatabaseUrlEnv, "User")
  }
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = [Environment]::GetEnvironmentVariable($DatabaseUrlEnv, "Machine")
  }

  Set-PostgresEnvFromUrl -DatabaseUrl $databaseUrl

  Write-SafeInfo "pg_dump available via $($pgDump.Mode)."
  Write-SafeInfo "Database connection variables are loaded without printing secret values."

  if ($CheckOnly) {
    Write-SafeInfo "CheckOnly completed. No backup file was created."
    exit 0
  }

  New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupPath = Join-Path $OutputDirectory "idts-render-qa-postgres-$timestamp.pgdump"
  $checksumPath = "$backupPath.sha256"

  $exitCode = Invoke-PgDumpBackup -Runner $pgDump -BackupPath $backupPath -OutputDirectory $OutputDirectory -PostgresDockerImage $PostgresDockerImage
  if ($exitCode -ne 0) {
    throw "pg_dump failed with exit code $exitCode."
  }

  $hash = Get-FileHash -Algorithm SHA256 -Path $backupPath
  "$($hash.Hash)  $(Split-Path -Leaf $backupPath)" | Set-Content -Encoding utf8 -Path $checksumPath

  Write-SafeInfo "Backup created: $backupPath"
  Write-SafeInfo "Checksum created: $checksumPath"
  Write-SafeInfo "Store these files in approved private storage. Do not commit them to Git or paste them into Jira."
} finally {
  Remove-Item Env:\PGHOST -ErrorAction SilentlyContinue
  Remove-Item Env:\PGPORT -ErrorAction SilentlyContinue
  Remove-Item Env:\PGDATABASE -ErrorAction SilentlyContinue
  Remove-Item Env:\PGUSER -ErrorAction SilentlyContinue
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:\PGSSLMODE -ErrorAction SilentlyContinue
}
