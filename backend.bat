@echo off
:: Forzar a que el prompt muestre (venv)
set "PROMPT=(venv) $P$G"
title Backend - Market POS [Puerto 8000]
color 0A

cd /d "%~dp0"
call venv\Scripts\activate.bat

echo.
echo  [OK] Entorno virtual activado.
echo  [OK] Iniciando Uvicorn...
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause