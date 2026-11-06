@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::       Ruqayya Clinic & Pharmacy Management System (HMS)
::          Windows Daily Date-Wise Database Backup Script
:: ============================================================================

title HMS Database Daily Backup

:: 1. Configuration
set "CONTAINER_NAME=hms_postgres_prod"
set "DB_USER=postgres"
set "DB_NAME=hms_prod"
set "BACKUP_DIR=%~dp0backups"

:: Create backup directory if it does not exist
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

:: 2. Extract Date and Time in YYYY-MM-DD_HH-MM-SS format
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "LDT=%%I"
if not defined LDT (
    :: Fallback for systems where WMIC is disabled (Windows 11 newer builds)
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set "DATE_VAL=%%c-%%a-%%b"
    set "TIME_VAL=%time::=-%"
    set "TIME_VAL=%TIME_VAL: =0%"
    set "TIME_VAL=%TIME_VAL:~0,8%"
    set "TIMESTAMP=%DATE_VAL%_%TIME_VAL%"
) else (
    set "TIMESTAMP=%LDT:~0,4%-%LDT:~4,2%-%LDT:~6,2%_%LDT:~8,2%-%LDT:~10,2%-%LDT:~12,2%"
)

set "BACKUP_FILE=%BACKUP_DIR%\hms_prod_backup_%TIMESTAMP%.sql"

echo.
echo ============================================================================
echo   Taking HMS Production Database Backup: [%TIMESTAMP%]
echo ============================================================================
echo Target Database: %DB_NAME% (Container: %CONTAINER_NAME%)
echo Destination:     %BACKUP_FILE%
echo.

:: 3. Check if PostgreSQL container is running
docker ps --filter "name=%CONTAINER_NAME%" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PostgreSQL container '%CONTAINER_NAME%' is NOT running!
    echo Please make sure your HMS production stack is running:
    echo   docker compose -f docker-compose.prod.yml up -d
    echo.
    pause
    exit /b 1
)

:: 4. Execute pg_dump from within container
echo [1/2] Generating PostgreSQL database dump...
docker exec -i %CONTAINER_NAME% pg_dump -U %DB_USER% --clean --if-exists %DB_NAME% > "%BACKUP_FILE%"

if errorlevel 1 (
    echo.
    echo [ERROR] Database backup failed!
    if exist "%BACKUP_FILE%" del "%BACKUP_FILE%"
    pause
    exit /b 1
)

:: 5. Verify backup file creation and file size
if not exist "%BACKUP_FILE%" (
    echo [ERROR] Backup file was not generated!
    pause
    exit /b 1
)

for %%A in ("%BACKUP_FILE%") do set "FILE_SIZE=%%~zA"

if %FILE_SIZE% LEQ 100 (
    echo [ERROR] Backup file is empty or corrupted (Size: %FILE_SIZE% bytes).
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo [SUCCESS] Database Backup Completed Successfully!
echo ============================================================================
echo File: %BACKUP_FILE%
echo Size: %FILE_SIZE% bytes
echo Date: %DATE% %TIME%
echo ============================================================================
echo.

:: Optional: keep console open if ran manually, close if run from scheduler
if "%1"=="--silent" goto end
timeout /t 5 >nul
:end
exit /b 0

