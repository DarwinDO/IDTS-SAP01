[CmdletBinding()]
param(
  [switch]$PreflightOnly,
  [string]$ProjectPath,
  [string]$AppName = 'idts-sap01-srv',
  [string]$ServiceName = 'idts-sap01-ai-gateway'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Cf {
  param([Parameter(Mandatory)][string[]]$Arguments)

  $lines = @(& cf @Arguments 2>&1 | ForEach-Object { $_.ToString() })
  if ($LASTEXITCODE -ne 0) {
    throw "CF_COMMAND_FAILED: cf $($Arguments[0])"
  }
  return $lines
}

function Read-GatewayKey {
  $null = Invoke-Cf -Arguments @('target')

  $guid = (Invoke-Cf -Arguments @('app', $AppName, '--guid') |
      Where-Object { $_ -match '^[0-9a-fA-F-]{36}$' } |
      Select-Object -First 1)
  if (-not $guid) { throw "APP_GUID_NOT_FOUND: $AppName" }

  $environmentLines = Invoke-Cf -Arguments @('curl', "/v3/apps/$guid/env")
  try {
    $payload = ($environmentLines -join "`n") | ConvertFrom-Json
  } catch {
    throw 'APP_ENVIRONMENT_INVALID'
  }

  $services = $payload.system_env_json.VCAP_SERVICES
  if ($services -is [string]) {
    try { $services = $services | ConvertFrom-Json } catch { throw 'VCAP_SERVICES_INVALID' }
  }
  if (-not $services) { throw 'VCAP_SERVICES_MISSING' }

  $binding = $null
  foreach ($group in $services.PSObject.Properties) {
    foreach ($candidate in @($group.Value)) {
      if ($candidate.name -eq $ServiceName) {
        $binding = $candidate
        break
      }
    }
    if ($binding) { break }
  }
  if (-not $binding) { throw "AI_GATEWAY_BINDING_NOT_FOUND: $ServiceName" }

  $credentials = $binding.credentials
  foreach ($keyName in @('gatewayApiKey', 'aiGatewayApiKey', 'AI_GATEWAY_API_KEY')) {
    $property = $credentials.PSObject.Properties[$keyName]
    if ($property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
      return [string]$property.Value
    }
  }

  throw 'AI_GATEWAY_KEY_MISSING'
}

if (-not (Get-Command cf -ErrorAction SilentlyContinue)) {
  throw 'CF_CLI_NOT_FOUND'
}

if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
  $ProjectPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
}
if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
  throw "PROJECT_PATH_NOT_FOUND: $ProjectPath"
}
if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath 'package.json') -PathType Leaf)) {
  throw "PROJECT_PACKAGE_NOT_FOUND: $ProjectPath"
}

$gatewayKey = $null
$runtimeConfig = [ordered]@{}
$previous = @{}
$locationPushed = $false

try {
  $gatewayKey = Read-GatewayKey

  if ($PreflightOnly) {
    Write-Output '=================================================='
    Write-Output ' IDTS CDS WATCH + REAL AI PREFLIGHT'
    Write-Output '=================================================='
    Write-Output "Cloud Foundry app : $AppName"
    Write-Output "AI binding        : $ServiceName"
    Write-Output 'Provider          : vercel'
    Write-Output 'Embedding model   : alibaba/qwen3-embedding-0.6b'
    Write-Output 'Classification    : openai/gpt-5.4-nano'
    Write-Output 'Handoff summary   : minimax/minimax-m2.5'
    Write-Output 'Assignment explain: zai/glm-4.7-flash'
    Write-Output 'Handoff fallback  : xai/grok-4.1-fast-non-reasoning'
    Write-Output 'Credential        : available in memory (value hidden)'
    Write-Output 'IDTS_REAL_AI_WATCH=PREFLIGHT_READY'
    Write-Output 'AI_REQUEST_SENT=false'
    Write-Output '=================================================='
    return
  }

  $runtimeConfig = [ordered]@{
    AI_GATEWAY_API_KEY = $gatewayKey
    IDTS_AI_ENABLED = 'true'
    IDTS_AI_PROVIDER = 'vercel'
    IDTS_AI_MODEL = 'zai/glm-4.7-flash'
    IDTS_AI_EMBEDDING_MODEL = 'alibaba/qwen3-embedding-0.6b'
    IDTS_AI_CLASSIFICATION_MODEL = 'openai/gpt-5.4-nano'
    IDTS_AI_HANDOFF_MODEL = 'minimax/minimax-m2.5'
    IDTS_AI_ASSIGNMENT_MODEL = 'zai/glm-4.7-flash'
    IDTS_AI_FALLBACK_ENABLED = 'true'
    IDTS_AI_FALLBACK_MODEL = 'openai/gpt-5.4-nano'
    IDTS_AI_EMBEDDING_FALLBACK_MODEL = 'openai/text-embedding-3-small'
    IDTS_AI_HANDOFF_FALLBACK_MODEL = 'xai/grok-4.1-fast-non-reasoning'
    IDTS_AI_REQUEST_LIMIT = '4'
    IDTS_AI_REQUEST_WINDOW_SECONDS = '60'
    IDTS_AI_TIMEOUT_MS = '45000'
  }

  foreach ($entry in $runtimeConfig.GetEnumerator()) {
    $previous[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
    [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
  }

  Write-Output '=================================================='
  Write-Output ' IDTS CDS WATCH + REAL AI'
  Write-Output '=================================================='
  Write-Output "Project           : $ProjectPath"
  Write-Output 'Provider          : vercel'
  Write-Output 'Embedding model   : alibaba/qwen3-embedding-0.6b'
  Write-Output 'Classification    : openai/gpt-5.4-nano'
  Write-Output 'Handoff summary   : minimax/minimax-m2.5'
  Write-Output 'Assignment explain: zai/glm-4.7-flash'
  Write-Output 'Handoff fallback  : xai/grok-4.1-fast-non-reasoning'
  Write-Output 'Credential        : loaded in memory (value hidden)'
  Write-Output 'AI request        : none yet; sent only after a UI AI action'
  Write-Output 'Stop server       : Ctrl+C'
  Write-Output '=================================================='

  Push-Location -LiteralPath $ProjectPath
  $locationPushed = $true
  & npm run watch-bug-management-ui
  if ($LASTEXITCODE -ne 0) { throw "CDS_WATCH_FAILED: exit=$LASTEXITCODE" }
} finally {
  if ($locationPushed) { Pop-Location }
  foreach ($entry in $runtimeConfig.GetEnumerator()) {
    [Environment]::SetEnvironmentVariable($entry.Key, $previous[$entry.Key], 'Process')
  }
  $gatewayKey = $null
  $runtimeConfig.Clear()
}
