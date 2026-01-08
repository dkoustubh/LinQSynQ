@echo off
setlocal

echo.
echo =======================================
echo 🚀 Starting FuseFlow System Setup (Windows)
echo =======================================
echo.

:: 1. Check Prerequisites
echo 🔍 Checking Prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed. Please install it first.
    pause
    exit /b 1
) else (
    echo ✅ Found Node.js
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: npm is not installed. Please install it first.
    pause
    exit /b 1
) else (
    echo ✅ Found npm
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not installed or not in PATH. Please install Docker Desktop.
    pause
    exit /b 1
) else (
    echo ✅ Found Docker
)

:: 2. MongoDB Setup (Docker)
echo.
echo 📦 Setting up MongoDB (Docker)...

:: Check if container is running
docker ps -q -f name=fuseflow-mongo >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB container 'fuseflow-mongo' is already running.
) else (
    :: Check if container exists but stopped
    docker ps -aq -f name=fuseflow-mongo >nul 2>nul
    if %errorlevel% equ 0 (
        echo 🔄 Starting existing 'fuseflow-mongo' container...
        docker start fuseflow-mongo
    ) else (
        echo ⬇️  Pulling and starting new MongoDB container...
        docker run -d --name fuseflow-mongo -p 27017:27017 --restart unless-stopped mongo:latest
    )
)

if %errorlevel% neq 0 (
    echo ❌ Failed to setup MongoDB. Is Docker Desktop running?
    pause
    exit /b 1
)

:: 3. Backend Dependencies
echo.
echo 📦 Installing Backend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies.
    pause
    exit /b 1
) else (
    echo ✅ Backend dependencies installed.
)

:: 4. Frontend Dependencies
echo.
echo 📦 Installing Frontend Dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies.
    pause
    exit /b 1
) else (
    echo ✅ Frontend dependencies installed.
)
cd ..

echo.
echo =======================================
echo 🎉 Setup Complete! You are ready to go.
echo =======================================
echo To start the full stack, run:
echo 👉 npm run dev:opcua
echo.
pause
