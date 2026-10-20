@echo off
title Digital Sathi Server
cd /d "%~dp0"
echo ====================================================
echo   Digital Sathi - Server Starting...
echo ====================================================
echo.
echo URL: http://localhost:3000
echo Admin: http://localhost:3000#admin
echo.
node server.js
pause
