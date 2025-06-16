@echo off
echo Starting Troubles Simulator Server...
echo.

REM Try Node.js first
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Node.js server...
    start /B node server.js
    timeout /t 2 >nul
    start http://localhost:8080
    echo.
    echo Server started! Browser should open automatically.
    echo Press any key to stop the server...
    pause >nul
    taskkill /f /im node.exe 2>nul
    goto :end
)

REM Try Python if Node.js not available
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python server...
    start /B python start_server.py
    timeout /t 2 >nul
    start http://localhost:8080
    echo.
    echo Server started! Browser should open automatically.
    echo Press any key to stop the server...
    pause >nul
    taskkill /f /im python.exe 2>nul
    goto :end
)

REM Try Python3 if python not available
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python3 server...
    start /B python3 start_server.py
    timeout /t 2 >nul
    start http://localhost:8080
    echo.
    echo Server started! Browser should open automatically.
    echo Press any key to stop the server...
    pause >nul
    taskkill /f /im python3.exe 2>nul
    goto :end
)

echo ERROR: Neither Node.js nor Python found!
echo Please install Node.js from https://nodejs.org/ or Python from https://python.org/
echo.
pause

:end
echo Server stopped.
pause