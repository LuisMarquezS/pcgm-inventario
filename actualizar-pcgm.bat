@echo off
setlocal

title PC Gamer Margarita - Actualizar inventario
cd /d "%~dp0"

rem Intenta encontrar Git y Node/npm aunque el BAT se abra desde CMD normal.
if exist "C:\laragon\bin\nodejs" (
  for /d %%D in ("C:\laragon\bin\nodejs\node-*") do (
    if exist "%%~fD\npm.cmd" set "PATH=%%~fD;%PATH%"
  )
)
if exist "C:\laragon\bin\git" (
  for /d %%D in ("C:\laragon\bin\git\*") do (
    if exist "%%~fD\cmd\git.exe" set "PATH=%%~fD\cmd;%PATH%"
    if exist "%%~fD\bin\git.exe" set "PATH=%%~fD\bin;%PATH%"
  )
)
if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%ProgramFiles%\Git\cmd\git.exe" set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
if exist "%ProgramFiles(x86)%\Git\cmd\git.exe" set "PATH=%ProgramFiles(x86)%\Git\cmd;%PATH%"

echo.
echo ==========================================
echo  PC Gamer Margarita - Actualizar sistema
echo ==========================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro Git en esta terminal.
  echo Instala Git o revisa que Laragon tenga Git habilitado.
  echo.
  pause
  exit /b 1
)

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

if not exist ".git" (
  echo [ERROR] Esta carpeta no parece ser un repositorio Git.
  echo Asegurate de ejecutar este archivo dentro de la carpeta del proyecto.
  echo.
  pause
  exit /b 1
)

echo [1/5] Revisando cambios locales...
git diff --ignore-cr-at-eol --quiet
if errorlevel 1 (
  echo.
  echo [ALERTA] Hay cambios locales en archivos del sistema.
  echo Para evitar perder trabajo, no se hara pull automatico.
  echo.
  echo Revisa con:
  echo git status
  echo.
  pause
  exit /b 1
)

echo [2/5] Descargando actualizaciones desde GitHub...
git pull --ff-only
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo actualizar con git pull.
  echo Revisa tu conexion, permisos de GitHub o si hay cambios pendientes.
  echo.
  pause
  exit /b 1
)

echo [3/5] Instalando o actualizando dependencias...
call npm install
if errorlevel 1 (
  echo.
  echo [ERROR] Fallo npm install.
  echo.
  pause
  exit /b 1
)

echo [4/5] Preparando base de datos local...
call npm run db:init
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo preparar la base de datos.
  echo.
  pause
  exit /b 1
)

echo [5/5] Generando Prisma Client...
call npx prisma generate
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo generar Prisma Client.
  echo Si la app esta abierta, cierrala y vuelve a ejecutar este actualizador.
  echo.
  pause
  exit /b 1
)

echo.
echo ==========================================
echo  Actualizacion lista.
echo ==========================================
echo.
echo Ahora puedes abrir iniciar-pcgm.bat para correr la app.
echo.

pause
