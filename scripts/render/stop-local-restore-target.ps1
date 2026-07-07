<#
.SYNOPSIS
Stops and removes the local temporary PostgreSQL restore target for IDTS-45.

.DESCRIPTION
This removes only the named Docker container created by
start-local-restore-target.ps1. It does not touch Render resources or any
database outside the local Docker container.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts/render/stop-local-restore-target.ps1
#>

[CmdletBinding()]
param(
  [string]$ContainerName = "idts-45-restore-target"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SafeInfo {
  param([string]$Message)
  Write-Host "[idts-45-restore-target] $Message"
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  throw "Docker CLI was not found. Nothing was removed."
}

$existing = & $docker.Source ps -a --filter "name=^/$ContainerName$" --format "{{.Names}}"
if ($existing -ne $ContainerName) {
  Write-SafeInfo "Container '$ContainerName' does not exist. Nothing to remove."
  exit 0
}

& $docker.Source rm --force $ContainerName | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Failed to remove container '$ContainerName'."
}

Write-SafeInfo "Removed temporary restore target '$ContainerName'."
