@echo off
setlocal enabledelayedexpansion
title Market POS - Configuracion e Inicio
color 0F
mode con: cols=80 lines=35

:: ==========================================
:: RUTAS
:: ==========================================
set "DIR_BACK=C:\Users\MyPC\OneDrive\Desktop\ventas"
set "DIR_FRONT=%DIR_BACK%\market-pos"

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       MARKET POS - PANEL DE CONTROL      ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  [1] Instalar/Actualizar dependencias (Recomendado 1ra vez)
echo  [2] Iniciar Sistema (Rapido)
echo  [3] Salir
echo.
set /p "opcion=  Seleccione una opcion: "

if "%opcion%"=="1" goto :INSTALAR
if "%opcion%"=="2" goto :INICIAR
if "%opcion%"=="3" exit /b
goto :MENU

:: ==========================================
:: INSTALADOR REAL
:: ==========================================
:INSTALAR
cls
echo.
echo  -------------------------------------------
echo     INSTALADOR DE DEPENDENCIAS
echo  -------------------------------------------
echo.

:: 1. Verificar Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR CRITICO] Python no esta instalado.
    echo  Descargalo de python.org y marcar "Add to PATH".
    pause
    goto :MENU
)
echo  [1/5] Python encontrado.

:: 2. Verificar Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR CRITICO] Node.js no esta instalado.
    echo  Descargalo de nodejs.org.
    pause
    goto :MENU
)
echo  [2/5] Node.js encontrado.

:: 3. Crear Venv
echo  [3/5] Preparando entorno virtual de Python...
cd /d "%DIR_BACK%"
if not exist "venv\Scripts\activate.bat" (
    echo        - Creando venv por primera vez...
    python -m venv venv
    if !errorlevel! neq 0 (
        echo  [ERROR] No se pudo crear el entorno virtual.
        pause
        goto :MENU
    )
)
echo  [OK] Entorno Python creado/listo.
echo.

:: 4. Instalar Python DEPS (La magia aqui: llamar a pip.exe directo y sin barra de progreso)
echo  [4/5] Instalando requisitos de Python (requirements.txt)...
echo        - Esto puede tardar un poco, no cierres la ventana...

:: Llamamos al pip del venv directamente, sin activar, y apagamos la barra visual
"%DIR_BACK%\venv\Scripts\pip.exe" install --progress-bar off -r "%DIR_BACK%\requirements.txt"

if !errorlevel! neq 0 (
    echo.
    echo  [ERROR] Hubo un problema instalando las dependencias de Python.
    echo  Asegurate de tener conexion a internet y que requirements.txt este bien.
    pause
    goto :MENU
)
echo  [OK] Requisitos de Python instalados.
echo.

:: 5. Instalar Node Modules
echo  [5/5] Preparando entorno de Node.js...
cd /d "%DIR_FRONT%"
if not exist "node_modules" (
    echo        - Ejecutando npm install...
    call npm install
    if !errorlevel! neq 0 (
        echo  [ERROR] Fallo npm install.
        pause
        goto :MENU
    )
) else (
    echo        - node_modules ya existe, omitiendo.
)
echo  [OK] Entorno Node listo.

:: 6. Limpiar cache
echo.
echo  [EXTRA] Limpiando cache de Next.js...
if exist "%DIR_FRONT%\.next" rmdir /s /q "%DIR_FRONT%\.next" >nul 2>nul
echo  [OK] Cache limpia.

echo.
echo  -------------------------------------------
echo     INSTALACION COMPLETADA CON EXITO
echo  -------------------------------------------
pause
goto :MENU

:: ==========================================
:: INICIO RAPIDO
:: ==========================================
:INICIAR
cls
echo.
echo  -------------------------------------------
echo     INICIANDO SERVICIOS
echo  -------------------------------------------
echo.

:: Limpiar Puertos
echo  [1/3] Matando procesos en puertos 8000 y 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING" 2^>nul') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do taskkill /f /pid %%a >nul 2>nul
timeout /t 2 /nobreak >nul
echo  [OK] Puertos liberados.
echo.

:: Lanzar Backends (Ventanas separadas)
echo  [2/3] Lanzando Backend...
start "Backend" /d "%DIR_BACK%" "%DIR_BACK%\backend.bat"

echo  [3/3] Lanzando Frontend...
start "Frontend" /d "%DIR_FRONT%" "%DIR_FRONT%\frontend.bat"

:: Loop de espera visual (Mas pro que un timeout plano)
echo.
echo  Esperando que los servicios levanten.
<nul set /p "=  "
for /l %%i in (1,1,15) do (
    timeout /t 1 /nobreak >nul
    <nul set /p "=█"
)
echo.
echo.

:: Abrir Navegador
start http://localhost:3000

echo  ╔══════════════════════════════════════════╗
echo  ║          SISTEMA ACTIVO                  ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Backend:  http://localhost:8000/docs    ║
echo  ║  Frontend: http://localhost:3000         ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Cerrar ESTA ventana no detiene el       ║
echo  ║  sistema. Para detenerlo, cierra las     ║
echo  ║  ventanas de Backend y Frontend.         ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
goto :MENU