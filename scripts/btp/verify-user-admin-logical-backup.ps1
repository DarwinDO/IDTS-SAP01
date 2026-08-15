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
$rowDocument = $null
$rowStream = $null

try {
  $envelopeFull = [System.IO.Path]::GetFullPath($EnvelopePath)
  $privateFull = [System.IO.Path]::GetFullPath($PrivateDirectory)
  $privateBlobPath = [System.IO.Path]::Combine($privateFull, 'user-admin-logical-backup-private.dpapi')
  if (-not (Test-Path -LiteralPath $envelopeFull -PathType Leaf)) { throw 'Envelope missing.' }
  if (-not (Test-Path -LiteralPath $privateBlobPath -PathType Leaf)) { throw 'Private key missing.' }

  $envelope = [System.Text.Json.JsonDocument]::Parse([System.IO.File]::ReadAllText($envelopeFull)).RootElement
  $keys = @($envelope.EnumerateObject() | ForEach-Object Name | Sort-Object)
  $expected = @('alg', 'ciphertext', 'encryptedKey', 'iv', 'tag', 'version')
  if (($keys -join ',') -ne ($expected -join ',')) { throw 'Envelope shape mismatch.' }
  if ($envelope.GetProperty('version').GetInt32() -ne 1) { throw 'Envelope version mismatch.' }
  if ($envelope.GetProperty('alg').GetString() -ne 'RSA-OAEP-SHA256+A256GCM') { throw 'Envelope algorithm mismatch.' }

  $entropy = [System.Security.Cryptography.SHA256]::HashData(
    [System.Text.Encoding]::UTF8.GetBytes('IDTS-UA-LOGICAL-BACKUP-V1')
  )
  $protectedBytes = [System.IO.File]::ReadAllBytes($privateBlobPath)
  $privateBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
    $protectedBytes,
    $entropy,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  [Array]::Clear($protectedBytes, 0, $protectedBytes.Length)

  $rsa = [System.Security.Cryptography.RSA]::Create()
  $bytesRead = 0
  [void]$rsa.ImportPkcs8PrivateKey($privateBytes, [ref]$bytesRead)
  $encryptedKey = [Convert]::FromBase64String($envelope.GetProperty('encryptedKey').GetString())
  $aesKey = $rsa.Decrypt($encryptedKey, [System.Security.Cryptography.RSAEncryptionPadding]::OaepSHA256)
  $ciphertext = [Convert]::FromBase64String($envelope.GetProperty('ciphertext').GetString())
  $iv = [Convert]::FromBase64String($envelope.GetProperty('iv').GetString())
  $tag = [Convert]::FromBase64String($envelope.GetProperty('tag').GetString())
  $plaintext = [byte[]]::new($ciphertext.Length)
  $aes = [System.Security.Cryptography.AesGcm]::new($aesKey, 16)
  $aes.Decrypt($iv, $ciphertext, $tag, $plaintext)

  $rowStream = [System.IO.MemoryStream]::new($plaintext, $false)
  $rowDocument = [System.Text.Json.JsonDocument]::Parse($rowStream)
  $rows = $rowDocument.RootElement
  if ($rows.ValueKind -ne [System.Text.Json.JsonValueKind]::Array -or $rows.GetArrayLength() -le 0) { throw 'Backup rows invalid.' }
  $digest = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($plaintext)).ToLowerInvariant()
  Write-Output ("IDTS_UA_VERIFY_RESULT=PASS;ROWS={0};DIGEST_PREFIX={1}" -f $rows.GetArrayLength(), $digest.Substring(0, 12))
  exit 0
} catch {
  Write-Output 'IDTS_UA_VERIFY_RESULT=FAIL'
  exit 1
} finally {
  if ($privateBytes) { [Array]::Clear($privateBytes, 0, $privateBytes.Length) }
  if ($aesKey) { [Array]::Clear($aesKey, 0, $aesKey.Length) }
  if ($plaintext) { [Array]::Clear($plaintext, 0, $plaintext.Length) }
  if ($rsa) { $rsa.Dispose() }
  if ($aes) { $aes.Dispose() }
  if ($rowDocument) { $rowDocument.Dispose() }
  if ($rowStream) { $rowStream.Dispose() }
  $privateBytes = $null
  $aesKey = $null
  $plaintext = $null
}
