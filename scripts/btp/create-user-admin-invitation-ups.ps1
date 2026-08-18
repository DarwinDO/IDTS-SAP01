[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ServiceName = 'idts-user-admin-invitation-config'
$AppRouterName = 'idts-sap01-approuter'
$bytes = $null
$signingKey = $null
$baseUrl = $null

function Fail([string]$Code) {
  Write-Output "M3E_INVITATION_UPS=FAIL;CODE=$Code"
  exit 1
}

try {
  $target = & cf target 2>&1 | Out-String
  $org = [regex]::Match($target, '(?mi)^org:\s*(.+)$').Groups[1].Value.Trim()
  $space = [regex]::Match($target, '(?mi)^space:\s*(.+)$').Groups[1].Value.Trim()
  if ($org -ne 'f5648117trial' -or $space -ne 'dev') { Fail 'TARGET' }

  $instances = (& cf curl '/v3/service_instances?per_page=5000' 2>$null | ConvertFrom-Json).resources
  if (@($instances | Where-Object { $_.name -ieq $ServiceName }).Count -ne 0) { Fail 'COLLISION' }

  $app = & cf app $AppRouterName 2>&1 | Out-String
  $routeMatch = [regex]::Match($app, '(?mi)^routes:\s*(\S+)\s*$')
  if (-not $routeMatch.Success) { Fail 'ROUTE_MISSING' }
  $route = $routeMatch.Groups[1].Value.Trim()
  if ($route -notmatch '^[a-z0-9.-]+\.cfapps\.ap21\.hana\.ondemand\.com$') { Fail 'ROUTE_UNEXPECTED' }
  $baseUrl = "https://$route/onboarding/continue"

  $bytes = New-Object byte[] 48
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $signingKey = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

  $startInfo = [Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = (Get-Command cf).Source
  $startInfo.Arguments = 'create-user-provided-service idts-user-admin-invitation-config -p "invitationSigningKey,invitationBaseUrl"'
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true

  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  $null = $process.Start()
  $process.StandardInput.WriteLine($signingKey)
  $process.StandardInput.WriteLine($baseUrl)
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $exitCode = $process.ExitCode
  $stdout = $null
  $stderr = $null
  $process.Dispose()

  $instances = (& cf curl '/v3/service_instances?per_page=5000' 2>$null | ConvertFrom-Json).resources
  $matches = @($instances | Where-Object { $_.name -ceq $ServiceName })
  if ($matches.Count -ne 1) { Fail 'CREATE_READBACK' }
  $service = $matches[0]
  $bindings = (& cf curl "/v3/service_credential_bindings?service_instance_guids=$($service.guid)" 2>$null | ConvertFrom-Json).pagination.total_results
  if ($service.type -ne 'user-provided' -or $bindings -ne 0) { Fail 'TOPOLOGY' }
  if ($exitCode -ne 0) { Fail 'AMBIGUOUS_EXIT' }

  Write-Output 'M3E_INVITATION_UPS=PASS;COUNT=1;BINDINGS=0'
} catch {
  Fail 'UNEXPECTED'
} finally {
  $signingKey = $null
  $baseUrl = $null
  if ($bytes) { [Array]::Clear($bytes, 0, $bytes.Length) }
  $bytes = $null
}
