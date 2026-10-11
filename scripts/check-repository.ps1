$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
& (Join-Path $Root 'build-standalone.ps1')
$config = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'app.config.json') | ConvertFrom-Json
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $Root $config.build.output)
$required = @('Tap Counter','counterGrid','focusView','pushUndo','navigator.vibrate','requestWakeLock','APP:BEGIN','APP:END','APP:HELP:BEGIN','APP:HELP:END')
foreach ($item in $required) { if (-not $html.Contains($item)) { throw "Required content missing: $item" } }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 24 is required for regression tests.' }
$testFiles = @(Get-ChildItem -LiteralPath (Join-Path $Root 'tests') -Filter '*.test.cjs' | ForEach-Object { $_.FullName })
$previousHtml = $env:TAP_COUNTER_HTML
try {
    $env:TAP_COUNTER_HTML = Join-Path $Root $config.build.output
    & node --test @testFiles
    if ($LASTEXITCODE -ne 0) { throw 'Tap Counter regression tests failed.' }
} finally {
    $env:TAP_COUNTER_HTML = $previousHtml
}
Write-Host 'Repository checks passed' -ForegroundColor Green
