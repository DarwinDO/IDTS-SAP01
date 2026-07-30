param(
  [string]$PrivateConfigPath,
  [string]$ServiceName = "idts-sap01-external-services"
)

$ErrorActionPreference = "Stop"

if (-not $PrivateConfigPath) {
  $PrivateConfigPath = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..\.cdsrc-private.json")
  )
}

if (-not (Test-Path -LiteralPath $PrivateConfigPath)) {
  throw "Private CAP configuration was not found."
}

$private = Get-Content -LiteralPath $PrivateConfigPath -Raw | ConvertFrom-Json
$store = $private.requires.objectStore.credentials
$email = $private.idts.email

$requiredStore = @("bucket", "region", "access_key_id", "secret_access_key")
foreach ($name in $requiredStore) {
  if (-not $store.$name) { throw "Private object-store field is missing: $name" }
}

$credentials = [ordered]@{
  bucket = $store.bucket
  region = $store.region
  access_key_id = $store.access_key_id
  secret_access_key = $store.secret_access_key
  email = $email
}

$tempDirectory = Join-Path $PSScriptRoot "..\..\.tmp\idts-113-btp"
$tempDirectory = [System.IO.Path]::GetFullPath($tempDirectory)
New-Item -ItemType Directory -Path $tempDirectory -Force | Out-Null
$credentialFile = Join-Path $tempDirectory "external-services.private.json"
$credentialJson = $credentials | ConvertTo-Json -Depth 10
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($credentialFile, $credentialJson, $utf8WithoutBom)

try {
  $serviceList = cf services 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "Could not inspect Cloud Foundry services." }
  $escapedServiceName = [regex]::Escape($ServiceName)
  $serviceExists = $serviceList -match "(?m)^\s*$escapedServiceName\s"
  if ($serviceExists) {
    cf update-user-provided-service $ServiceName -p $credentialFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not update the private BTP binding." }
    $mode = "updated"
  } else {
    cf create-user-provided-service $ServiceName -p $credentialFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not create the private BTP binding." }
    $mode = "created"
  }
  Write-Output (@{ service = $ServiceName; mode = $mode; secretsPrinted = $false } | ConvertTo-Json)
} finally {
  Remove-Item -LiteralPath $credentialFile -Force -ErrorAction SilentlyContinue
}
