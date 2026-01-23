@echo off
chcp 65001 >nul
setlocal
cd /d %~dp0

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :run_script
) else (
    echo [!] Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:run_script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup.ps1"
if %errorLevel% neq 0 (
    echo.
    echo [!] PowerShell script failed with error code %errorLevel%.
    pause
)
exit /b
