@echo off
setlocal
rem 双击入口：保留 PowerShell 窗口，错误信息不会一闪而过。
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0start-receiver-demo.ps1"
