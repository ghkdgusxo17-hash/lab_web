$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logPath = Join-Path $root '.v4test-dev.log'
$errPath = Join-Path $root '.v4test-dev.err.log'
$npmPath = 'C:\Program Files\nodejs\npm.cmd'

"[$(Get-Date -Format s)] Starting V4_test dev server on 127.0.0.1:9891" | Out-File -FilePath $logPath -Encoding utf8
'' | Out-File -FilePath $errPath -Encoding utf8

& $npmPath run dev:test -- --hostname 127.0.0.1 1>> $logPath 2>> $errPath
