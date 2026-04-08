@echo off
title Habit Tracker

:: === EDIT THIS LINE if your project is somewhere else ===
set PROJECT_DIR=%USERPROFILE%\habit-tracker
:: =========================================================

if not exist "%PROJECT_DIR%" (
    echo Could not find project folder: %PROJECT_DIR%
    echo Edit this file and update PROJECT_DIR to point to your habit-tracker folder.
    echo.
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"

:: Switch to the correct branch
git checkout claude/habit-tracker-app-BnWwz 2>nul

:: Install dependencies if missing
if not exist "node_modules" (
    echo Installing dependencies for the first time, please wait...
    call npm install
)

:: Open browser after short delay
start "" cmd /c "timeout /t 3 >nul && start http://localhost:5173"

echo.
echo Starting Habit Tracker at http://localhost:5173
echo Close this window to stop the server.
echo.

call npm run dev
