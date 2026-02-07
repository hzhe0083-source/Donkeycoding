@echo off
setlocal

set SCRIPT_DIR=%~dp0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%scripts\start_desktop_mode.ps1"

if errorlevel 1 (
  echo.
  echo Workerflow desktop start failed. Check logs above.
  pause
  exit /b 1
)

exit /b 0
