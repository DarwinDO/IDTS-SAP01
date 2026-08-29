[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$EnvelopePath,
  [Parameter(Mandatory = $true)][string]$PrivateDirectory
)

$ErrorActionPreference = 'Stop'
$privateBytes = $null
$aesKey = $null
$plaintext = $null
$rsa = $null
$aes = $null
$document = $null
$stream = $null
$safeStage = 'INPUT'

try {
  $envelopeFull = [System.IO.Path]::GetFullPath($EnvelopePath)
  $privateFull = [System.IO.Path]::GetFullPath($PrivateDirectory)
  $privateBlobPath = [System.IO.Path]::Combine($privateFull, 'user-admin-logical-backup-private.dpapi')
  if (-not (Test-Path -LiteralPath $envelopeFull -PathType Leaf)) { throw 'Envelope missing.' }
  if (-not (Test-Path -LiteralPath $privateBlobPath -PathType Leaf)) { throw 'Private key missing.' }

  $safeStage = 'ENVELOPE'
  $envelope = [System.Text.Json.JsonDocument]::Parse([System.IO.File]::ReadAllText($envelopeFull)).RootElement
  $keys = @($envelope.EnumerateObject() | ForEach-Object Name | Sort-Object)
  if (($keys -join ',') -ne 'alg,ciphertext,encryptedKey,iv,tag,version') { throw 'Envelope shape mismatch.' }
  if ($envelope.GetProperty('version').GetInt32() -ne 1) { throw 'Envelope version mismatch.' }
  if ($envelope.GetProperty('alg').GetString() -ne 'RSA-OAEP-SHA256+A256GCM') { throw 'Envelope algorithm mismatch.' }

  $safeStage = 'KEY'
  $entropy = [System.Security.Cryptography.SHA256]::HashData([System.Text.Encoding]::UTF8.GetBytes('IDTS-UA-LOGICAL-BACKUP-V1'))
  $protectedBytes = [System.IO.File]::ReadAllBytes($privateBlobPath)
  $privateBytes = [System.Security.Cryptography.ProtectedData]::Unprotect($protectedBytes, $entropy, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
  [Array]::Clear($protectedBytes, 0, $protectedBytes.Length)

  $safeStage = 'DECRYPT'
  $rsa = [System.Security.Cryptography.RSA]::Create()
  $bytesRead = 0
  [void]$rsa.ImportPkcs8PrivateKey($privateBytes, [ref]$bytesRead)
  $aesKey = $rsa.Decrypt([Convert]::FromBase64String($envelope.GetProperty('encryptedKey').GetString()), [System.Security.Cryptography.RSAEncryptionPadding]::OaepSHA256)
  $ciphertext = [Convert]::FromBase64String($envelope.GetProperty('ciphertext').GetString())
  $plaintext = [byte[]]::new($ciphertext.Length)
  $aes = [System.Security.Cryptography.AesGcm]::new($aesKey, 16)
  $aes.Decrypt(
    [Convert]::FromBase64String($envelope.GetProperty('iv').GetString()),
    $ciphertext,
    [Convert]::FromBase64String($envelope.GetProperty('tag').GetString()),
    $plaintext
  )

  $safeStage = 'DOCUMENT'
  $stream = [System.IO.MemoryStream]::new($plaintext, $false)
  $document = [System.Text.Json.JsonDocument]::Parse($stream)
  $root = $document.RootElement
  if ($root.ValueKind -ne [System.Text.Json.JsonValueKind]::Object -or $root.GetProperty('version').GetInt32() -ne 1) { throw 'Backup document invalid.' }
  $datasets = $root.GetProperty('datasets')
  $expected = @('notifications', 'eventTypes')
  if ($datasets.ValueKind -ne [System.Text.Json.JsonValueKind]::Array -or $datasets.GetArrayLength() -ne $expected.Length) { throw 'Backup datasets invalid.' }

  $counts = [ordered]@{}
  $total = 0
  $index = 0
  foreach ($dataset in $datasets.EnumerateArray()) {
    $key = $dataset.GetProperty('key').GetString()
    if ($key -ne $expected[$index]) { throw 'Backup dataset order invalid.' }
    $rows = $dataset.GetProperty('rows')
    if ($rows.ValueKind -ne [System.Text.Json.JsonValueKind]::Array -or $rows.GetArrayLength() -le 0) { throw 'Backup rows invalid.' }
    $counts[$key] = $rows.GetArrayLength()
    $total += $rows.GetArrayLength()
    $index++
  }

  $safeStage = 'SUMMARY'
  $digest = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($plaintext)).ToLowerInvariant()
  $countsJson = $counts | ConvertTo-Json -Compress
  $countsBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($countsJson))
  Write-Output ("IDTS_N4_VERIFY_RESULT=PASS;TOTAL={0};COUNTS_B64={1};DIGEST_PREFIX={2}" -f $total, $countsBase64, $digest.Substring(0, 12))
  exit 0
} catch {
  Write-Output ("IDTS_N4_VERIFY_RESULT=FAIL;CODE={0}" -f $safeStage)
  exit 1
} finally {
  if ($privateBytes) { [Array]::Clear($privateBytes, 0, $privateBytes.Length) }
  if ($aesKey) { [Array]::Clear($aesKey, 0, $aesKey.Length) }
  if ($plaintext) { [Array]::Clear($plaintext, 0, $plaintext.Length) }
  if ($rsa) { $rsa.Dispose() }
  if ($aes) { $aes.Dispose() }
  if ($document) { $document.Dispose() }
  if ($stream) { $stream.Dispose() }
}
