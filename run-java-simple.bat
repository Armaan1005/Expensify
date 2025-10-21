@echo off
REM ============================================================
REM Simple Java Client Runner (No Maven Required)
REM Downloads JSON library and compiles manually
REM ============================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         EXPENSIFY - SIMPLE JAVA CLIENT RUNNER             ║
echo ║         (No Maven Required - Manual Compilation)          ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Create lib directory if it doesn't exist
if not exist "lib" mkdir lib

REM Check if JSON library exists
if not exist "lib\json-20231013.jar" (
    echo 📥 Downloading JSON library...
    powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/json/json/20231013/json-20231013.jar' -OutFile 'lib\json-20231013.jar'"
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to download JSON library
        echo Please download manually from:
        echo https://repo1.maven.org/maven2/org/json/json/20231013/json-20231013.jar
        echo And place it in the 'lib' folder
        pause
        exit /b 1
    )
    echo ✓ JSON library downloaded
) else (
    echo ✓ JSON library found
)
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

REM Compile Java client
echo 🔨 Compiling ExpensifyClient.java...
javac -cp "lib\json-20231013.jar" ExpensifyClient.java
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
java -cp ".;lib\json-20231013.jar" ExpensifyClient

echo.
echo ─────────────────────────────────────────────────────────
echo.
echo ✓ Java client execution completed
echo.

pause
