@echo off
title U-Boot Kriegssimulator U-96
echo ========================================================
echo    KRIEGSMARINE U-BOOT SIMULATOR (U-96)
echo    Simulation Server wird gestartet auf http://localhost:3000
echo ========================================================
start http://localhost:3000
node server.js
pause
