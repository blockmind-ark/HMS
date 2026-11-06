@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::       Ruqayya Clinic & Pharmacy Management System (HMS)
::          Windows Database Restore Script from Backup Dump
:: ============================================================================

title HMS Database Restore Utility

set "CONTAINER_NAME=hms_postgres_prod"
set "DB_USER=postgres"
set "DB_NAME=hms_prod"
set "BACKUP_DIR=%~dp0backups"

echo.
echo ============================================================================
echo               HMS Production Database Restore Utility
echo ============================================================================
echo.

:: 1. Check if backup file is provided via drag-and-drop or argument
set "BACKUP_FILE=%~1"

if "%BACKUP_FILE%"=="" (
    echo Available backup files in %BACKUP_DIR%:
    echo ----------------------------------------------------------------------------
    dir /b /o-d "%BACKUP_DIR%\*.sql" 2>nul
    echo ----------------------------------------------------------------------------
    echo.
    echo Enter the backup file name from above (or drag and drop a .sql file here):
    set /p "BACKUP_NAME=> "
    if exist "%BACKUP_DIR%\!BACKUP_NAME!" (
        set "BACKUP_FILE=%BACKUP_DIR%\!BACKUP_NAME!"
    ) else if exist "!BACKUP_NAME!" (
        set "BACKUP_FILE=!BACKUP_NAME!"
    ) else (
        echo [ERROR] Backup file not found!
        pause
        exit /b 1
    )
)

echo.
echo Selected Backup File: %BACKUP_FILE%
echo.
echo WARNING: Restoring will overwrite active database data with the backup dump!
set /p "CONFIRM=Are you sure you want to proceed? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Restore cancelled by user.
    pause
    exit /b 0
)

:: 2. Check if container is running
docker ps --filter "name=%CONTAINER_NAME%" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PostgreSQL container '%CONTAINER_NAME%' is NOT running!
    pause
    exit /b 1
)

:: 3. Restore database dump
echo.
echo Restoring %DB_NAME% from %BACKUP_FILE%...
docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% < "%BACKUP_FILE%"

if errorlevel 1 (
    echo [ERROR] Database restore failed!
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo [SUCCESS] Database Restored Successfully from %BACKUP_FILE%!
echo ============================================================================
echo.
pause

