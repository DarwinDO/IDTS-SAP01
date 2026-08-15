[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'IDTS BTP CLI Browser SSO'

function Write-SafeStatus {
  param([Parameter(Mandatory = $true)][string]$Status)
  Write-Host $Status
}

$process = $null
$outputTask = $null
$errorTask = $null
$standardOutput = $null
$standardError = $null

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
    Write-SafeStatus 'BTP_LOGIN=FAIL_START'
    exit 1
  }

  $outputTask = $process.StandardOutput.ReadToEndAsync()
  $errorTask = $process.StandardError.ReadToEndAsync()
  $process.StandardInput.WriteLine()
  $process.StandardInput.Close()

  if (-not $process.WaitForExit(600000)) {
    $process.Kill()
    Write-SafeStatus 'BTP_LOGIN=TIMEOUT'
    exit 1
  }

  $standardOutput = $outputTask.GetAwaiter().GetResult()
  $standardError = $errorTask.GetAwaiter().GetResult()
  if ($process.ExitCode -ne 0) {
    Write-SafeStatus 'BTP_LOGIN=FAIL'
    exit 1
  }

  & btp --format json list accounts/subaccount *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-SafeStatus 'BTP_LOGIN=FAIL_READBACK'
    exit 1
  }

  Write-SafeStatus 'BTP_LOGIN=PASS'
} catch {
  Write-SafeStatus 'BTP_LOGIN=FAIL'
  exit 1
} finally {
  $standardOutput = $null
  $standardError = $null
  $outputTask = $null
  $errorTask = $null
  if ($process) {
    $process.Dispose()
  }
  $process = $null
  $startInfo = $null
  $btpCommand = $null
}
