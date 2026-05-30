@echo off
title Market POS
color 0F

echo Cerrando procesos anteriores...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING" 2^>nul') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do taskkill /f /pid %%a >nul 2>nul
timeout /t 2 /nobreak >nul

echo Iniciando Backend...
start "" "%~dp0backend.bat"

echo Iniciando Frontend...
start "" "%~dp0market-pos\frontend.bat"

echo Esperando que levanten...
timeout /t 10 /nobreak >nul

start http://localhost:3000
echo Listo, podes cerrar esta ventana.