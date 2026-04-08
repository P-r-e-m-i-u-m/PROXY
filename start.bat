@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   OpenAI Reverse Proxy -- Quick Start
echo ========================================

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Get it from https://nodejs.org
    pause & exit /b 1
)

if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [INFO] Created .env from .env.example -- edit it to set your providers.
    )
)

if not exist node_modules (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 ( echo [ERROR] npm install failed. & pause & exit /b 1 )
)

echo [INFO] Building TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 ( echo [ERROR] Build failed. & pause & exit /b 1 )

echo.
echo [INFO] Proxy starting at http://localhost:3000/v1
echo        Press Ctrl+C to stop.
echo.

call npm start
pause
