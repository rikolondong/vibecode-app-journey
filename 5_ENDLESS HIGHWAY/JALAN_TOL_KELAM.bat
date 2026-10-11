@echo off
title JALAN TOL KELAM - Endless Midnight Highway
cd /d "%~dp0"

echo ========================================================
echo  🚗 MEMBUKA JALAN TOL KELAM - GAME 3D WINDOWS
echo ========================================================
echo.

:: Cek apakah Electron tersedia di node_modules
if exist "node_modules\.bin\electron.cmd" (
    echo Menjalankan aplikasi desktop Windows (Electron)...
    start "" "node_modules\.bin\electron.cmd" desktop.js
    exit /b 0
)

:: Jika Electron belum ada, jalankan server lokal dan buka sebagai Aplikasi Windows Standalone
echo Menjalankan mode Aplikasi Windows Standalone...
start /b "" node server.js

:: Tunggu 1 detik agar server siap
timeout /t 1 /nobreak >nul

:: Buka dalam mode Window Native (tanpa tab, tanpa url bar) menggunakan Microsoft Edge / Chrome
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3000" --window-size=1366,768 --start-maximized
    exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3000" --window-size=1366,768 --start-maximized
    exit /b 0
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000" --window-size=1366,768 --start-maximized
    exit /b 0
)

:: Fallback standar browser default
start "" "http://localhost:3000"
exit /b 0
