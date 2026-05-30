@echo off
title Backend
color 0A
cd /d "%~dp0"
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
