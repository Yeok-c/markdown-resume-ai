@echo off
REM Resume AI - Installation Script for Windows
REM This script sets up the entire Resume AI system

echo.
echo Starting Resume AI Installation...
echo.

REM Check if pnpm is installed
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [91mX pnpm is not installed[0m
    echo Please install pnpm first: npm install -g pnpm
    exit /b 1
)

echo [92m✓ pnpm found[0m
echo.

REM Install root dependencies
echo Installing root dependencies...
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo [91mFailed to install root dependencies[0m
    exit /b 1
)
echo [92m✓ Root dependencies installed[0m
echo.

REM Build all packages
echo Building packages...
call pnpm build:pkg
if %ERRORLEVEL% NEQ 0 (
    echo [93mWarning: Package build had issues[0m
)
echo [92m✓ Packages built[0m
echo.

REM Setup API server
echo Setting up API server...
cd api-server

if not exist .env (
    copy .env.example .env
    echo [93m! Created .env file - please add your API keys![0m
) else (
    echo [92m✓ .env file already exists[0m
)

call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo [91mFailed to install API server dependencies[0m
    cd ..
    exit /b 1
)
echo [92m✓ API server dependencies installed[0m
cd ..
echo.

REM Setup Chrome extension
echo Setting up Chrome extension...
cd chrome-extension

if not exist package.json (
    call npm init -y
)

call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [93mWarning: Chrome extension build had issues[0m
)
cd ..
echo [92m✓ Chrome extension setup complete[0m
echo.

echo.
echo ================================================
echo [92mInstallation Complete![0m
echo ================================================
echo.
echo Next Steps:
echo.
echo 1. Configure your API keys:
echo    cd api-server ^&^& edit .env
echo.
echo 2. Start the API server:
echo    cd api-server ^&^& pnpm dev
echo.
echo 3. (Optional) Start the frontend:
echo    pnpm dev
echo.
echo 4. Install Chrome extension:
echo    - Open Chrome -^> chrome://extensions/
echo    - Enable 'Developer mode'
echo    - Click 'Load unpacked'
echo    - Select: chrome-extension\dist
echo.
echo 5. Read the documentation:
echo    - QUICK_START.md
echo    - PROJECT_README.md
echo.
echo [92mHappy resume building![0m
echo.
