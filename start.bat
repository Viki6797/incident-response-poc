@echo off
echo ========================================
echo     INCIDENT RESPONSE PLATFORM
echo ========================================
echo.
echo Starting both backend and frontend...
echo.

echo 1. Starting Backend API (FastAPI)...
start cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn main:app --reload"

timeout /t 3 /nobreak >nul

echo 2. Starting Frontend (React + Vite)...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Services starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Press any key to stop this script (servers will keep running)...
pause >nul