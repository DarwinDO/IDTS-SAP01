[CmdletBinding()]
param(
  [switch]$CheckOnly,
  [int]$WaitMinutes = 15,
  [string]$HanaService = 'idts-113-hana-cloud-poc',
  [string]$ServiceApp = 'idts-sap01-srv',
  [string]$AppRouter = 'idts-sap01-approuter'
)

$ErrorActionPreference = 'Stop'

function Invoke-Cf {
  param([string[]]$Arguments)
  $output = & cf @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Cloud Foundry command failed: cf $($Arguments -join ' ')`n$($output -join [Environment]::NewLine)"
  }
  return @($output)
}

function Get-AppRoute {
  param([string]$Name)
  $output = Invoke-Cf -Arguments @('app', $Name)
  $routeLine = $output | Where-Object { $_ -match '^routes:\s+' } | Select-Object -First 1
  if (-not $routeLine) { throw "No route found for $Name." }
  return (($routeLine -replace '^routes:\s+', '').Split(',')[0]).Trim()
}

function Test-AppRunning {
  param([string]$Name)
  $output = Invoke-Cf -Arguments @('app', $Name)
  $text = $output -join "`n"
  return ($text -match 'requested state:\s+started' -and $text -match 'instances:\s+1/1')
}

function Start-CfApp {
  param([string]$Name)
  if (Test-AppRunning -Name $Name) { return }
  Write-Host "Starting Cloud Foundry app $Name (cf start)..."
  Invoke-Cf -Arguments @('start', $Name) | Out-Null
}

function Get-HttpStatus {
  param([string]$Url)
  $status = & curl.exe -sS -o NUL -w '%{http_code}' --max-time 15 $Url 2>$null
  if ($LASTEXITCODE -ne 0 -or $status -notmatch '^\d{3}$') { return 0 }
  return [int]$status
}

function Get-ReadinessSnapshot {
  $serviceRoute = Get-AppRoute -Name $ServiceApp
  $routerRoute = Get-AppRoute -Name $AppRouter
  return [ordered]@{
    ServiceRunning = Test-AppRunning -Name $ServiceApp
    AppRouterRunning = Test-AppRunning -Name $AppRouter
    HealthStatus = Get-HttpStatus -Url "https://$serviceRoute/health"
    ReadyStatus = Get-HttpStatus -Url "https://$serviceRoute/ready"
    ProtectedStatus = Get-HttpStatus -Url "https://$serviceRoute/odata/v4/auth/me"
    AppRouterStatus = Get-HttpStatus -Url "https://$routerRoute/idtsbugmanagementui/index.html"
  }
}

function Write-Snapshot {
  param([System.Collections.IDictionary]$Snapshot)
  Write-Host "CAP app:       $(if ($Snapshot.ServiceRunning) { 'PASS (1/1)' } else { 'FAIL' })"
  Write-Host "AppRouter:     $(if ($Snapshot.AppRouterRunning) { 'PASS (1/1)' } else { 'FAIL' })"
  Write-Host "Liveness:      HTTP $($Snapshot.HealthStatus)"
  Write-Host "DB readiness:  HTTP $($Snapshot.ReadyStatus)"
  Write-Host "Protected API: HTTP $($Snapshot.ProtectedStatus) (expected 401 without a session)"
  Write-Host "Web entry:     HTTP $($Snapshot.AppRouterStatus)"
}

function Test-DemoReady {
  param([System.Collections.IDictionary]$Snapshot)
  return ($Snapshot.ServiceRunning -and
          $Snapshot.AppRouterRunning -and
          $Snapshot.HealthStatus -eq 200 -and
          $Snapshot.ReadyStatus -eq 200 -and
          $Snapshot.ProtectedStatus -eq 401 -and
          $Snapshot.AppRouterStatus -in @(200, 302))
}

Invoke-Cf -Arguments @('target') | Out-Null
$initial = Get-ReadinessSnapshot
Write-Snapshot -Snapshot $initial

if ($CheckOnly) {
  if (Test-DemoReady -Snapshot $initial) {
    Write-Host 'DEMO READY'
    exit 0
  }
  Write-Error 'DEMO NOT READY. Run npm run btp:demo:prepare.'
  exit 1
}

Start-CfApp -Name $ServiceApp
Start-CfApp -Name $AppRouter

$snapshot = Get-ReadinessSnapshot
if ($snapshot.ReadyStatus -ne 200) {
  Write-Host "Database readiness failed. Requesting a supported start for $HanaService..."
  $parameterFile = Join-Path ([IO.Path]::GetTempPath()) "idts-hana-start-$([guid]::NewGuid().ToString('N')).json"
  try {
    @{ data = @{ serviceStopped = $false } } |
      ConvertTo-Json -Depth 3 |
      Set-Content -LiteralPath $parameterFile -Encoding utf8
    Invoke-Cf -Arguments @('update-service', $HanaService, '-c', $parameterFile) | Out-Null
  } finally {
    Remove-Item -LiteralPath $parameterFile -Force -ErrorAction SilentlyContinue
  }

  $deadline = (Get-Date).AddMinutes($WaitMinutes)
  do {
    Start-Sleep -Seconds 20
    $snapshot = Get-ReadinessSnapshot
    Write-Host "Waiting for database readiness: HTTP $($snapshot.ReadyStatus)"
  } while ($snapshot.ReadyStatus -ne 200 -and (Get-Date) -lt $deadline)

  if ($snapshot.ReadyStatus -ne 200) {
    throw "HANA did not become ready within $WaitMinutes minute(s). Check HANA Cloud Central before retrying."
  }

  Write-Host "Database is reachable. Restarting $ServiceApp once to clear stale pooled connections..."
  Invoke-Cf -Arguments @('restart', $ServiceApp) | Out-Null
}

Start-CfApp -Name $AppRouter
Start-Sleep -Seconds 5
$final = Get-ReadinessSnapshot
Write-Snapshot -Snapshot $final

if (-not (Test-DemoReady -Snapshot $final)) {
  throw 'DEMO NOT READY. Review the failed line above; no schema deployment or data reset was attempted.'
}

Write-Host 'DEMO READY'
