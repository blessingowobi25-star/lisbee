<#
  Copies one secret from .env.local to your clipboard, so you can paste it
  straight into the Vercel dashboard without reading or retyping it.

    .\scripts\copy-secret.ps1 SUPABASE_SERVICE_ROLE_KEY

  Add -Show if you also want it printed on screen.
  The value is never written to disk or sent anywhere.
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Name,
  [switch]$Show
)

$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"

if (-not (Test-Path $envFile)) {
  Write-Host "No .env.local found at $envFile" -ForegroundColor Red
  exit 1
}

$line = Get-Content $envFile | Where-Object { $_ -match "^\s*$([regex]::Escape($Name))\s*=" } | Select-Object -First 1

if (-not $line) {
  Write-Host "Could not find '$Name' in .env.local" -ForegroundColor Red
  Write-Host "Available keys:" -ForegroundColor Yellow
  Get-Content $envFile | Where-Object { $_ -match '^\s*[A-Z][A-Z0-9_]*\s*=' } | ForEach-Object {
    ($_ -split '=', 2)[0].Trim()
  }
  exit 1
}

$value = ($line -split '=', 2)[1].Trim()

if ([string]::IsNullOrWhiteSpace($value)) {
  Write-Host "'$Name' is empty in .env.local" -ForegroundColor Red
  exit 1
}

Set-Clipboard -Value $value
Write-Host "Copied $Name to your clipboard ($($value.Length) characters)." -ForegroundColor Green
Write-Host "Paste it into Vercel with Ctrl+V." -ForegroundColor DarkGray

if ($Show) {
  Write-Host ""
  Write-Host $value -ForegroundColor Yellow
}