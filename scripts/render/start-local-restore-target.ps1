<#
.SYNOPSIS
Starts a local temporary PostgreSQL target for IDTS-45 restore proof.

.DESCRIPTION
This helper creates a disposable PostgreSQL container using Docker. It is meant
only for restoring and inspecting a private Render QA PostgreSQL backup.

The generated password is printed only to the local terminal so DonHV can set
IDTS_RESTORE_DATABASE_URL for the restore helper. Do not paste the printed URL
into Git, Jira, docs, screenshots, or shared evidence.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts/render/start-local-restore-target.ps1

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts/render/start-local-restore-target.ps1 `
  -UrlOutputPath "docs/pm/evidence/idts-45/private/restore-url.txt" `
  -SuppressUrlOutput
#>

[CmdletBinding()]
param(
  [string]$ContainerName = "idts-45-restore-target",
  [string]$PostgresDockerImage = "postgres:15",
  [string]$DatabaseName = "idts_restore",
  [string]$DatabaseUser = "idts_restore",
  [int]$HostPort = 55432,
  [string]$UrlOutputPath,
  [switch]$SuppressUrlOutput
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SafeInfo {
  param([string]$Message)
  Write-Host "[idts-45-restore-target] $Message"
}

function Get-RequiredDocker {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) {
    throw "Docker CLI was not found. Install Docker Desktop or use another temporary PostgreSQL target."
  }

  & $docker.Source info --format "{{.ServerVersion}}" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not running. Start Docker Desktop, then retry."
  }

  return $docker.Source
}

$docker = Get-RequiredDocker

$existing = & $docker ps -a --filter "name=^/$ContainerName$" --format "{{.Names}}"
if ($existing -eq $ContainerName) {
  throw "Container '$ContainerName' already exists. Run npm run render:db:restore-target:stop first, or choose another -ContainerName."
}

$passwordBytes = New-Object byte[] 24
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $rng.GetBytes($passwordBytes)
} finally {
  $rng.Dispose()
}
$password = [Convert]::ToBase64String($passwordBytes).TrimEnd("=")

Write-SafeInfo "Starting temporary PostgreSQL container '$ContainerName'."
& $docker run `
  --detach `
  --name $ContainerName `
  --publish "$($HostPort):5432" `
  --env "POSTGRES_DB=$DatabaseName" `
  --env "POSTGRES_USER=$DatabaseUser" `
  --env "POSTGRES_PASSWORD=$password" `
  $PostgresDockerImage | Out-Null

if ($LASTEXITCODE -ne 0) {
  throw "Failed to start PostgreSQL restore target container."
}

Write-SafeInfo "Waiting for PostgreSQL readiness."
$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
  & $docker exec $ContainerName pg_isready -U $DatabaseUser -d $DatabaseName | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  throw "PostgreSQL restore target did not become ready in time. Inspect Docker logs for '$ContainerName'."
}

$restoreUrl = "postgres://$($DatabaseUser):$($password)@localhost:$($HostPort)/$($DatabaseName)"

Write-SafeInfo "Temporary restore target is ready."

if (-not [string]::IsNullOrWhiteSpace($UrlOutputPath)) {
  $urlOutputDirectory = Split-Path -Parent $UrlOutputPath
  if (-not [string]::IsNullOrWhiteSpace($urlOutputDirectory)) {
    New-Item -ItemType Directory -Force -Path $urlOutputDirectory | Out-Null
  }
  Set-Content -Encoding utf8 -LiteralPath $UrlOutputPath -Value $restoreUrl
  Write-SafeInfo "Restore URL was written to a private local file. Delete it after proof."
}

if (-not $SuppressUrlOutput) {
  Write-SafeInfo "Set the restore URL only in your local shell. Do not paste it into Jira or Git."
  Write-Host ""
  Write-Host "`$env:IDTS_RESTORE_DATABASE_URL = '$restoreUrl'"
  Write-Host ""
}

Write-SafeInfo "Stop and remove this target after proof:"
Write-Host "npm run render:db:restore-target:stop"
