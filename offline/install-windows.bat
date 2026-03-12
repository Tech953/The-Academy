@echo off
:: ═══════════════════════════════════════════════════════════════
::  THE ACADEMY — Windows Launcher
::  Double-click this file to install and launch The Academy.
::  Requires PowerShell 5.1+ (included in Windows 10/11)
:: ═══════════════════════════════════════════════════════════════

title The Academy — Windows Installer

echo.
echo  ==========================================
echo   THE ACADEMY - Windows Installer
echo  ==========================================
echo.
echo  Launching PowerShell installer...
echo.

:: Check if PowerShell is available
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: PowerShell not found.
    echo  Please install PowerShell from:
    echo  https://github.com/PowerShell/PowerShell/releases
    pause
    exit /b 1
)

:: Run the PowerShell script with execution policy bypass
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  Installation encountered an error.
    echo  Please check the output above for details.
    pause
    exit /b 1
)

pause
