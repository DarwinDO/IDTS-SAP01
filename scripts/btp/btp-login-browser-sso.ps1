[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$process = $null
$outputTask = $null
$errorTask = $null
$standardOutput = $null
$standardError = $null
$finalStatus = 'BTP_LOGIN=FAIL'
$exitCode = 1

try {
  $btpCommand = Get-Command btp.exe -ErrorAction Stop
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $btpCommand.Source
  $startInfo.Arguments = 'login --sso'
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  if (-not $process.Start()) {
    $finalStatus = 'BTP_LOGIN=FAIL_START'
    throw 'BTP login process did not start'
  }

  $outputTask = $process.StandardOutput.ReadToEndAsync()
  $errorTask = $process.StandardError.ReadToEndAsync()
  $process.StandardInput.WriteLine()
  $process.StandardInput.Close()

  if (-not $process.WaitForExit(600000)) {
    $process.Kill()
    $finalStatus = 'BTP_LOGIN=TIMEOUT'
    throw 'BTP login timed out'
  }

  $standardOutput = $outputTask.GetAwaiter().GetResult()
  $standardError = $errorTask.GetAwaiter().GetResult()
  if ($process.ExitCode -ne 0) {
    throw 'BTP login failed'
  }

  & btp --format json list accounts/subaccount *> $null
  if ($LASTEXITCODE -ne 0) {
    $finalStatus = 'BTP_LOGIN=FAIL_READBACK'
    throw 'BTP authenticated readback failed'
  }

  $finalStatus = 'BTP_LOGIN=PASS'
  $exitCode = 0
} catch {
  if ($finalStatus -eq 'BTP_LOGIN=PASS') {
    $finalStatus = 'BTP_LOGIN=FAIL'
    $exitCode = 1
  }
} finally {
  $standardOutput = $null
  $standardError = $null
  $outputTask = $null
  $errorTask = $null
  if ($process) {
    try {
      $process.Dispose()
    } catch {
      $finalStatus = 'BTP_LOGIN=FAIL_CLEANUP'
      $exitCode = 1
    }
  }
  $process = $null
  $startInfo = $null
  $btpCommand = $null
}

Write-Host $finalStatus
exit $exitCode
