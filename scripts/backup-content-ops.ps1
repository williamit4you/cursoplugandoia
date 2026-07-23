param(
  [string]$OutputRoot = ".\\backups",
  [string]$StoragePath = "",
  [string]$PgDumpPath = "pg_dump"
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$CommandName) {
  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Comando obrigatorio nao encontrado: $CommandName"
  }
  return $command.Source
}

function Write-JsonFile([string]$Path, [object]$Value) {
  $json = $Value | ConvertTo-Json -Depth 10
  [System.IO.File]::WriteAllText($Path, $json, [System.Text.Encoding]::UTF8)
}

function New-Sha256([string]$Path) {
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Resolve-Path $OutputRoot).Path $timestamp
[System.IO.Directory]::CreateDirectory($backupDir) | Out-Null

$pgDumpExe = Require-Command $PgDumpPath
if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL nao configurada."
}

$dbFile = Join-Path $backupDir "database.sql"
$dbArgs = @("--dbname=$env:DATABASE_URL", "--format=plain", "--no-owner", "--no-privileges", "--file=$dbFile")
& $pgDumpExe @dbArgs
if (-not (Test-Path -LiteralPath $dbFile)) {
  throw "Falha ao gerar dump do banco."
}

$manifest = [ordered]@{
  createdAt = (Get-Date).ToString("o")
  database = [ordered]@{
    file = [System.IO.Path]::GetFileName($dbFile)
    sha256 = (New-Sha256 $dbFile)
    bytes = (Get-Item -LiteralPath $dbFile).Length
  }
  storage = $null
}

if ($StoragePath) {
  if (-not (Test-Path -LiteralPath $StoragePath)) {
    throw "StoragePath nao encontrado: $StoragePath"
  }

  $storageManifestFile = Join-Path $backupDir "storage-manifest.csv"
  $storageRows = Get-ChildItem -LiteralPath $StoragePath -Recurse -File | ForEach-Object {
    [PSCustomObject]@{
      relativePath = $_.FullName.Substring((Resolve-Path $StoragePath).Path.Length).TrimStart('\')
      bytes = $_.Length
      sha256 = (New-Sha256 $_.FullName)
      lastWriteTime = $_.LastWriteTimeUtc.ToString("o")
    }
  }
  $storageRows | Export-Csv -LiteralPath $storageManifestFile -NoTypeInformation -Encoding UTF8

  $manifest.storage = [ordered]@{
    root = (Resolve-Path $StoragePath).Path
    manifestFile = [System.IO.Path]::GetFileName($storageManifestFile)
    itemCount = @($storageRows).Count
    sha256 = (New-Sha256 $storageManifestFile)
  }
}

$manifestFile = Join-Path $backupDir "manifest.json"
Write-JsonFile -Path $manifestFile -Value $manifest

Write-Host "Backup verificavel criado em: $backupDir"
Write-Host "Manifesto: $manifestFile"
