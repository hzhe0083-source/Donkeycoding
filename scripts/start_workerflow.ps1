param(
    [switch]$SkipNpmInstall,
    [switch]$NoCode
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$extPath = Join-Path $repoRoot "packages/vscode-ext"
$orchestratorExe = Join-Path $repoRoot "target/debug/orchestrator.exe"

Push-Location $repoRoot
try {
    Write-Host "[1/4] Building orchestrator..." -ForegroundColor Cyan
    cargo build -p orchestrator

    Push-Location $extPath
    try {
        if (-not $SkipNpmInstall -or -not (Test-Path "node_modules")) {
            Write-Host "[2/4] Installing extension dependencies..." -ForegroundColor Cyan
            npm install
        }

        Write-Host "[3/4] Building VS Code extension..." -ForegroundColor Cyan
        npm run build
    }
    finally {
        Pop-Location
    }

    if (-not (Test-Path $orchestratorExe)) {
        throw "Orchestrator binary not found: $orchestratorExe"
    }

    Write-Host "Build ready: $orchestratorExe" -ForegroundColor Green

    if ($NoCode) {
        Write-Host "Skip launching VS Code (--NoCode)." -ForegroundColor Yellow
        Write-Host "Open VS Code and press F5, or run Workerflow: Open Chat." -ForegroundColor Yellow
        exit 0
    }

    $code = Get-Command code -ErrorAction SilentlyContinue
    if (-not $code) {
        Write-Host "VS Code CLI 'code' not found." -ForegroundColor Yellow
        Write-Host "Install it from VS Code: Command Palette -> 'Shell Command: Install \"code\" command in PATH'." -ForegroundColor Yellow
        Write-Host "Then run: code --new-window `"$repoRoot`" --extensionDevelopmentPath `"$extPath`"" -ForegroundColor Yellow
        exit 0
    }

    Write-Host "[4/4] Launching Extension Development Host..." -ForegroundColor Cyan
    & code --new-window "$repoRoot" --extensionDevelopmentPath "$extPath"

    Write-Host "Done. In the new window run: Workerflow: Open Chat" -ForegroundColor Green
}
finally {
    Pop-Location
}

