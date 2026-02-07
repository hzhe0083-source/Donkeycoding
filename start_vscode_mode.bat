@echo off
setlocal

set SCRIPT_DIR=%~dp0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%scripts\start_workerflow.ps1"

if errorlevel 1 (
  echo.
  echo Workerflow VS Code mode start failed. Check logs above.
  pause
  exit /b 1
)

exit /b 0

