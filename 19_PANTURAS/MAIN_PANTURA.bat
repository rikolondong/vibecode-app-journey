@echo off
title PANTURA: MUDIK ODYSSEY - Indie 3D Road Trip Simulator
cd /d "%~dp0"
echo =======================================================
echo  Menjalankan PANTURA: MUDIK ODYSSEY di http://localhost:3019
echo =======================================================
start "" "http://localhost:3019"
node server.js
pause
