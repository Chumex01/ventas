@echo off
title Frontend - Market POS [Puerto 3000 - DEV]
color 0E

cd /d "%~dp0"

echo.
echo  [OK] Iniciando Next.js en modo Desarrollo...
echo  [INFO] Ignora los warnings de TypeScript en la consola.
echo.

cmd /k "npm run dev"