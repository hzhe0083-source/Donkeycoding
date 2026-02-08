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

function Stop-ProcessByName([string]$name) {
    Get-Process -Name $name -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue
}

function Stop-ProcessByFilter([scriptblock]$filter) {
    $processes = Get-CimInstance Win32_Process | Where-Object $filter
    foreach ($process in $processes) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Ensure-DevPortReady([int]$port, [string]$workspacePath) {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $listener) {
        return
    }

    $ownerId = $listener.OwningProcess
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerId" -ErrorAction SilentlyContinue
    if (-not $owner) {
        return
    }

    $commandLine = $owner.CommandLine
    $isWorkspaceVite =
        $owner.Name -ieq "node.exe" -and
        $commandLine -and
        $commandLine -like "*$workspacePath*" -and
        $commandLine -like "*vite*"

    if ($isWorkspaceVite) {
        Stop-Process -Id $ownerId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 250
        return
    }

    throw "Dev port $port is already used by PID $ownerId ($($owner.Name)). Close it and retry."
}

Write-Host "[0/3] Cleaning stale dev processes..." -ForegroundColor Cyan
Stop-ProcessByName -name $studioExeName
Stop-ProcessByFilter {
    $_.Name -ieq "orchestrator.exe" -and
    $_.ExecutablePath -and
    $_.ExecutablePath -eq $orchestratorExe
}
Stop-ProcessByFilter {
    $_.Name -ieq "cargo.exe" -and
    $_.CommandLine -and
    $_.CommandLine -like "*$studioPath*" -and
    $_.CommandLine -like "*tauri*" -and
    $_.CommandLine -like "*dev*"
}
Stop-ProcessByFilter {
    $_.Name -ieq "node.exe" -and
    $_.CommandLine -and
    $_.CommandLine -like "*$studioPath*" -and
    $_.CommandLine -like "*vite*"
}
Ensure-DevPortReady -port 5173 -workspacePath $studioPath
Start-Sleep -Milliseconds 300

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
