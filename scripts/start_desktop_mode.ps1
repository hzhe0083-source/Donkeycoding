param(
    [switch]$SkipNpmInstall,
    [switch]$Web,
    [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$studioPath = Join-Path $repoRoot "packages/studio-web"
$orchestratorExe = Join-Path $repoRoot "target/debug/orchestrator.exe"
$studioExeName = "donkey_studio"

Push-Location $repoRoot
try {
    Write-Host "[1/3] Building orchestrator..." -ForegroundColor Cyan
    cargo build -p orchestrator

    if (-not (Test-Path $orchestratorExe)) {
        throw "Orchestrator binary not found: $orchestratorExe"
    }

    Push-Location $studioPath
    try {
        if (-not $SkipNpmInstall -or -not (Test-Path "node_modules")) {
            Write-Host "[2/3] Installing studio dependencies..." -ForegroundColor Cyan
            npm install
        }

        Write-Host "[2.5/3] Cleaning stale desktop process..." -ForegroundColor Cyan
        $running = Get-Process -Name $studioExeName -ErrorAction SilentlyContinue
        if ($running) {
            $running | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 300
        }

        Write-Host "Build ready: $orchestratorExe" -ForegroundColor Green

        if ($NoLaunch) {
            Write-Host "Skip launching UI (--NoLaunch)." -ForegroundColor Yellow
            exit 0
        }

        if ($Web) {
            Write-Host "[3/3] Launching Studio Web (vite dev)..." -ForegroundColor Cyan
            npm run dev
        }
        else {
            Write-Host "[3/3] Launching Donkey Studio desktop (tauri:dev)..." -ForegroundColor Cyan
            npm run tauri:dev
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location
}
