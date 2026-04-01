$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist\TycoonStreamBridge'

if (Test-Path $dist) {
  Remove-Item $dist -Recurse -Force
}

New-Item -ItemType Directory -Path $dist | Out-Null

Copy-Item (Join-Path $root 'server.js') $dist
Copy-Item (Join-Path $root 'README.md') $dist
Copy-Item (Join-Path $root 'package.json') $dist
Copy-Item (Join-Path $root 'src') (Join-Path $dist 'src') -Recurse
Copy-Item (Join-Path $root 'public') (Join-Path $dist 'public') -Recurse

$launcher = @'
@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing Tycoon Stream Bridge dependencies...
  call npm install --omit=dev
)
start "" http://127.0.0.1:21420
call node server.js
'@

Set-Content -Path (Join-Path $dist 'Launch Tycoon Stream Bridge.cmd') -Value $launcher -Encoding ASCII

Write-Host "Created portable bridge folder at $dist"
