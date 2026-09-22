@echo off
setlocal
rem Double-click entry. Keep the PowerShell window open on errors.
if /I "%~1"=="-CheckOnly" (
  powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-receiver-demo.ps1" -CheckOnly
  exit /b %errorlevel%
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0start-receiver-demo.ps1"
