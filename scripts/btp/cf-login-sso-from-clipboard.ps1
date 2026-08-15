[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

function Clear-SensitiveClipboard {
  $clipboardCheck = $null
  for ($attempt = 0; $attempt -lt 5; $attempt++) {
    Set-Clipboard -Value ' ' -ErrorAction Stop
    Start-Sleep -Milliseconds 200
    $clipboardCheck = Get-Clipboard -Raw -ErrorAction Stop
    if ($null -eq $clipboardCheck -or $clipboardCheck.Trim().Length -ne 0) {
      throw 'CF clipboard cleanup failed'
    }
    $clipboardCheck = $null
  }
}

$finalStatus = 'CF_LOGIN=FAIL'
$exitCode = 1

try {
  $apiOutput = (& cf api 2>&1 | Out-String)
  $apiMatch = [regex]::Match($apiOutput, '(?m)^API endpoint:\s+(https://api\.cf\.[a-z0-9-]+\.hana\.ondemand\.com)\s*$')
  if (-not $apiMatch.Success) {
    $finalStatus = 'CF_LOGIN=FAIL_API_TARGET_MISSING'
    throw 'CF API target missing'
  }

  $apiEndpoint = $apiMatch.Groups[1].Value
  $passcodeUrl = $apiEndpoint.Replace('https://api.cf.', 'https://login.cf.') + '/passcode'
  $initialClipboard = Get-Clipboard -Raw -ErrorAction Stop

  Start-Process $passcodeUrl

  $deadline = (Get-Date).AddMinutes(5)
  $passcode = $null
  while ((Get-Date) -lt $deadline) {
    $candidate = Get-Clipboard -Raw -ErrorAction Stop
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
    $finalStatus = 'CF_LOGIN=TIMEOUT_NO_COPIED_CODE'
    throw 'CF passcode wait timed out'
  }

  $passcode | & cf login --sso *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'CF login failed'
  }

  & cf apps *> $null
  if ($LASTEXITCODE -ne 0) {
    $finalStatus = 'CF_LOGIN=FAIL_READBACK'
    throw 'CF authenticated readback failed'
  }

  $finalStatus = 'CF_LOGIN=PASS'
  $exitCode = 0
} catch {
  if ($finalStatus -eq 'CF_LOGIN=PASS') {
    $finalStatus = 'CF_LOGIN=FAIL'
    $exitCode = 1
  }
} finally {
  $passcode = $null
  $candidate = $null
  $trimmed = $null
  $initialClipboard = $null
  $passcodeUrl = $null
  $apiEndpoint = $null
  $apiOutput = $null
  try {
    Clear-SensitiveClipboard
  } catch {
    $finalStatus = 'CF_LOGIN=FAIL_CLEANUP'
    $exitCode = 1
  }
}

Write-Host $finalStatus
exit $exitCode
