@echo off
REM ============================================================
REM Expensify - Java Client Compiler and Runner
REM This script compiles and runs the Java client
REM ============================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║            EXPENSIFY - JAVA CLIENT LAUNCHER               ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Maven is not installed or not in PATH
    echo.
    echo Please install Maven from: https://maven.apache.org/download.cgi
    echo.
    pause
    exit /b 1
)

echo ✓ Maven found
echo.

REM Check if Node.js server is running
curl -s http://localhost:3000/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Warning: Node.js server may not be running
    echo    Please start the server with: node server.js
    echo.
    echo Continuing anyway...
    echo.
) else (
    echo ✓ Node.js server is running
    echo.
)

REM Clean and install dependencies
echo 📦 Installing Maven dependencies...
call mvn clean install -q
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Compile the Java client
echo 🔨 Compiling Java client...
call mvn compile -q
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Compilation failed
    pause
    exit /b 1
)
echo ✓ Compilation successful
echo.

REM Run the Java client
echo 🚀 Running Java client...
echo ─────────────────────────────────────────────────────────
echo.
call mvn exec:java -Dexec.mainClass="ExpensifyClient" -q

echo.
echo ─────────────────────────────────────────────────────────
echo.
echo ✓ Java client execution completed
echo.

pause
