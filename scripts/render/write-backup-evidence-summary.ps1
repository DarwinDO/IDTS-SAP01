<#
.SYNOPSIS
Writes a sanitized IDTS-45 backup/restore evidence summary.

.DESCRIPTION
This helper creates a Markdown evidence summary that DonHV can manually upload
to Jira after running a private Render PostgreSQL backup and restore proof.

It intentionally records only safe metadata:
  - backup file name, size, SHA-256;
  - checksum-file match status;
  - restore target type;
  - restore status summary;
  - verification notes supplied by the operator.

It does not read or print database URLs, passwords, tokens, Render env values,
or backup contents. By default, the output is written under a gitignored
private evidence folder.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts/render/write-backup-evidence-summary.ps1 `
  -BackupPath "$HOME\IDTS-private-backups\idts-45\idts-render-qa-postgres-20260707-210000.pgdump" `
  -RestoreTargetType "Local Docker PostgreSQL target" `
  -RestoreStatus "PASS" `
  -VerificationNotes "Core CAP tables and representative rows were checked."
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$ChecksumPath,
  [string]$RestoreTargetType = "Not recorded",
  [ValidateSet("PASS", "FAIL", "NOT_RUN")]
  [string]$RestoreStatus = "NOT_RUN",
  [string]$VerificationNotes = "Not recorded",
  [string]$OutputDirectory = "docs/pm/evidence/idts-45/private"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-SafeInfo {
  param([string]$Message)
  Write-Host "[idts-45-evidence] $Message"
}

function Convert-BytesToHumanSize {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) {
    return "{0:N2} GB" -f ($Bytes / 1GB)
  }
  if ($Bytes -ge 1MB) {
    return "{0:N2} MB" -f ($Bytes / 1MB)
  }
  if ($Bytes -ge 1KB) {
    return "{0:N2} KB" -f ($Bytes / 1KB)
  }
  return "$Bytes bytes"
}

function Get-ChecksumFileStatus {
  param(
    [string]$ChecksumPath,
    [string]$ExpectedHash,
    [string]$BackupFileName
  )

  if ([string]::IsNullOrWhiteSpace($ChecksumPath)) {
    return "Not provided"
  }
  if (-not (Test-Path -LiteralPath $ChecksumPath)) {
    return "Checksum file not found"
  }

  $content = Get-Content -Raw -LiteralPath $ChecksumPath
  if ($content -match [regex]::Escape($ExpectedHash) -and $content -match [regex]::Escape($BackupFileName)) {
    return "MATCH"
  }

  return "MISMATCH"
}

if (-not (Test-Path -LiteralPath $BackupPath)) {
  throw "Backup file was not found: $BackupPath"
}

$backupItem = Get-Item -LiteralPath $BackupPath
$backupHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackupPath).Hash
$backupFileName = $backupItem.Name
$backupSizeBytes = $backupItem.Length
$backupSizeHuman = Convert-BytesToHumanSize -Bytes $backupSizeBytes

if ([string]::IsNullOrWhiteSpace($ChecksumPath)) {
  $candidateChecksumPath = "$BackupPath.sha256"
  if (Test-Path -LiteralPath $candidateChecksumPath) {
    $ChecksumPath = $candidateChecksumPath
  }
}

$checksumStatus = Get-ChecksumFileStatus -ChecksumPath $ChecksumPath -ExpectedHash $backupHash -BackupFileName $backupFileName
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$outputPath = Join-Path $OutputDirectory "idts-45-backup-restore-evidence-$timestamp.md"

$relativeBackupDirectory = Split-Path -Parent $BackupPath
$checksumFileName = if ([string]::IsNullOrWhiteSpace($ChecksumPath)) { "Not provided" } else { Split-Path -Leaf $ChecksumPath }

$markdown = @"
# IDTS-45 Backup and Restore Evidence Summary

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")

This file intentionally contains only sanitized evidence. Do not add database
URLs, passwords, tokens, Render environment values, AWS keys, SMTP keys, or
full private backup contents.

## Backup metadata

| Field | Value |
| --- | --- |
| Backup file name | $backupFileName |
| Backup directory | private/local path, not uploaded |
| Backup size | $backupSizeHuman |
| Backup size bytes | $backupSizeBytes |
| SHA-256 | $backupHash |
| Checksum file | $checksumFileName |
| Checksum file status | $checksumStatus |

## Restore proof

| Field | Value |
| --- | --- |
| Restore target type | $RestoreTargetType |
| Restore status | $RestoreStatus |
| Verification notes | $VerificationNotes |

## Manual upload instruction

Upload this sanitized Markdown summary to Jira `IDTS-45` only after reviewing it.
Do not upload the `.pgdump` file unless approved private storage is used.
"@

Set-Content -Encoding utf8 -LiteralPath $outputPath -Value $markdown

Write-SafeInfo "Evidence summary created: $outputPath"
Write-SafeInfo "Review this file before manually uploading it to Jira. Do not upload the raw .pgdump to Jira."
