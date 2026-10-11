@echo off
title Buat Shortcut Desktop - JALAN TOL KELAM
cd /d "%~dp0"

echo Membuat Shortcut di Desktop Windows...
powershell -ExecutionPolicy Bypass -File .\create_shortcut.ps1

echo.
echo Selesai! Anda dapat langsung menjalankan game dari Desktop.
pause
