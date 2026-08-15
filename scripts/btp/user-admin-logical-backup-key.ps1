[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$PublicOutputPath,
  [Parameter(Mandatory = $true)][string]$PrivateDirectory
)

$ErrorActionPreference = 'Stop'
$privateBytes = $null
$protectedBytes = $null
$rsa = $null
$privateBlobPath = $null

function Set-PrivateAcl([string]$Path) {
  $current = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
  $system = [System.Security.Principal.SecurityIdentifier]::new('S-1-5-18')
  $acl = [System.Security.AccessControl.DirectorySecurity]::new()
  $acl.SetAccessRuleProtection($true, $false)
  foreach ($identity in @($current, $system)) {
    $rule = [System.Security.AccessControl.FileSystemAccessRule]::new(
      $identity,
      [System.Security.AccessControl.FileSystemRights]::FullControl,
      [System.Security.AccessControl.InheritanceFlags]'ContainerInherit, ObjectInherit',
      [System.Security.AccessControl.PropagationFlags]::None,
      [System.Security.AccessControl.AccessControlType]::Allow
    )
    [void]$acl.AddAccessRule($rule)
  }
  Set-Acl -LiteralPath $Path -AclObject $acl
}

try {
  $publicFull = [System.IO.Path]::GetFullPath($PublicOutputPath)
  $privateFull = [System.IO.Path]::GetFullPath($PrivateDirectory)
  if (Test-Path -LiteralPath $publicFull) { throw 'Output already exists.' }
  if (Test-Path -LiteralPath $privateFull) { throw 'Private directory already exists.' }

  [void][System.IO.Directory]::CreateDirectory($privateFull)
  Set-PrivateAcl $privateFull
  $privateBlobPath = [System.IO.Path]::Combine($privateFull, 'user-admin-logical-backup-private.dpapi')

  $rsa = [System.Security.Cryptography.RSA]::Create(3072)
  if ($rsa.KeySize -ne 3072) { throw 'RSA key size mismatch.' }
  $publicPem = $rsa.ExportSubjectPublicKeyInfoPem()
  $privateBytes = $rsa.ExportPkcs8PrivateKey()
  $entropy = [System.Security.Cryptography.SHA256]::HashData(
    [System.Text.Encoding]::UTF8.GetBytes('IDTS-UA-LOGICAL-BACKUP-V1')
  )
  $protectedBytes = [System.Security.Cryptography.ProtectedData]::Protect(
    $privateBytes,
    $entropy,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )

  [System.IO.File]::WriteAllText($publicFull, $publicPem, [System.Text.UTF8Encoding]::new($false))
  $stream = [System.IO.File]::Open($privateBlobPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
  try { $stream.Write($protectedBytes, 0, $protectedBytes.Length) } finally { $stream.Dispose() }

  Write-Output 'IDTS_UA_KEY_RESULT=PASS'
  exit 0
} catch {
  if ($privateBlobPath -and (Test-Path -LiteralPath $privateBlobPath)) {
    Remove-Item -LiteralPath $privateBlobPath -Force -ErrorAction SilentlyContinue
  }
  Write-Output 'IDTS_UA_KEY_RESULT=FAIL'
  exit 1
} finally {
  if ($privateBytes) { [Array]::Clear($privateBytes, 0, $privateBytes.Length) }
  if ($protectedBytes) { [Array]::Clear($protectedBytes, 0, $protectedBytes.Length) }
  if ($rsa) { $rsa.Dispose() }
  $privateBytes = $null
  $protectedBytes = $null
}
