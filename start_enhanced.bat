@echo off
echo Starting Enhanced Character Art Converter...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Install requirements if needed
echo Checking dependencies...
pip install -r requirements.txt >nul 2>&1

REM Start the backend server
echo Starting backend server on port 8002...
start cmd /k "python main.py"

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Navigate to frontend directory
cd /d "%~dp0frontend"

REM Start the enhanced frontend
echo Opening enhanced frontend in browser...
start "" "enhanced.html"

echo.
echo Enhanced Character Art Converter is now running!
echo.
echo Backend API: http://localhost:8002
echo Frontend: enhanced.html
echo.
echo Press any key to stop the server...
pause >nul

REM Kill the Python process
taskkill /f /im python.exe >nul 2>&1

echo Server stopped.
pause