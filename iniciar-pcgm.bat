@echo off
setlocal

title PC Gamer Margarita - Inventario
cd /d "%~dp0"

rem Intenta encontrar Node/npm aunque el BAT se abra desde CMD normal.
if exist "C:\laragon\bin\nodejs" (
  for /d %%D in ("C:\laragon\bin\nodejs\node-*") do (
    if exist "%%~fD\npm.cmd" set "PATH=%%~fD;%PATH%"
  )
)
if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"

echo.
echo ==========================================
echo  PC Gamer Margarita - Inventario local
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro npm en esta terminal.
  echo Instala Node.js o revisa que Laragon tenga Node habilitado.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [ERROR] Este archivo debe estar en la raiz del proyecto.
  echo No se encontro package.json.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/4] Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] Fallo npm install.
    pause
    exit /b 1
  )
) else (
  echo [1/4] Dependencias encontradas.
)

echo [2/4] Preparando base de datos local...
call npm run db:init
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo inicializar la base de datos.
  pause
  exit /b 1
)

echo [3/4] Generando Prisma Client...
call npx prisma generate
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo generar Prisma Client.
  pause
  exit /b 1
)

echo [4/4] Abriendo navegador...
start "" "http://localhost:3000/dashboard"

echo.
echo Servidor iniciando en:
echo http://localhost:3000/dashboard
echo.
echo Deja esta ventana abierta mientras uses la app.
echo Para apagar el servidor, presiona CTRL + C y luego S.
echo.

call npm run dev -- --port 3000

pause
