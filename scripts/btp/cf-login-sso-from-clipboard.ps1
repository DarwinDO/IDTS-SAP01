[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'IDTS CF SSO - Copy Only'

function Write-SafeStatus {
  param([Parameter(Mandatory = $true)][string]$Status)
  Write-Host $Status
}

function Clear-SensitiveClipboard {
  $clipboardCheck = $null
  $cleared = $false
  for ($attempt = 0; $attempt -lt 5; $attempt++) {
    Set-Clipboard -Value ' '
    Start-Sleep -Milliseconds 200
    $clipboardCheck = Get-Clipboard -Raw -ErrorAction SilentlyContinue
    $cleared = $null -eq $clipboardCheck -or $clipboardCheck.Trim().Length -eq 0
    $clipboardCheck = $null
  }
  if (-not $cleared) {
    throw 'CF clipboard cleanup failed'
  }
}

try {
  $apiOutput = (& cf api 2>&1 | Out-String)
  $apiMatch = [regex]::Match($apiOutput, '(?m)^API endpoint:\s+(https://api\.cf\.[a-z0-9-]+\.hana\.ondemand\.com)\s*$')
  if (-not $apiMatch.Success) {
    Write-SafeStatus 'CF_LOGIN=FAIL_API_TARGET_MISSING'
    exit 1
  }

  $apiEndpoint = $apiMatch.Groups[1].Value
  $passcodeUrl = $apiEndpoint.Replace('https://api.cf.', 'https://login.cf.') + '/passcode'
  $initialClipboard = Get-Clipboard -Raw -ErrorAction SilentlyContinue

  Start-Process $passcodeUrl

  $deadline = (Get-Date).AddMinutes(5)
  $passcode = $null
  while ((Get-Date) -lt $deadline) {
    $candidate = Get-Clipboard -Raw -ErrorAction SilentlyContinue
    if ($candidate -and $candidate -ne $initialClipboard) {
      $trimmed = $candidate.Trim()
      if ($trimmed -match '^[A-Za-z0-9_-]{20,200}$') {
        $passcode = $trimmed
        break
      }
    }
    Start-Sleep -Milliseconds 400
  }

  if (-not $passcode) {
    Write-SafeStatus 'CF_LOGIN=TIMEOUT_NO_COPIED_CODE'
    exit 1
  }

  $passcode | & cf login --sso *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-SafeStatus 'CF_LOGIN=FAIL'
    exit 1
  }

  & cf apps *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-SafeStatus 'CF_LOGIN=FAIL_READBACK'
    exit 1
  }

  Write-SafeStatus 'CF_LOGIN=PASS'
} finally {
  $passcode = $null
  $candidate = $null
  $trimmed = $null
  $initialClipboard = $null
  $passcodeUrl = $null
  $apiEndpoint = $null
  $apiOutput = $null
  Clear-SensitiveClipboard
}
