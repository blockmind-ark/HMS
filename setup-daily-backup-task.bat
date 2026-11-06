@echo off
setlocal

:: ============================================================================
::       Ruqayya Clinic & Pharmacy Management System (HMS)
::     Windows Task Scheduler Setup for Day-Start & Day-End Backups
:: ============================================================================

title HMS Automatic Daily Backup Scheduler

echo.
echo ============================================================================
echo   Setting up Automated Daily Database Backups in Windows Task Scheduler
echo ============================================================================
echo.

:: Ensure administrative permissions
net session >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Administrator privileges are required to register scheduled tasks.
    echo Please right-click this script and select 'Run as administrator'.
    echo.
    pause
    exit /b 1
)

set "BACKUP_SCRIPT=%~dp0backup-db.bat"

if not exist "%BACKUP_SCRIPT%" (
    echo [ERROR] Cannot find backup script at: %BACKUP_SCRIPT%
    pause
    exit /b 1
)

echo Registering 2 Daily Automated Backups:
echo   1) Day Start Backup : Daily at 08:00 AM (Clinic Opening)
echo   2) Day End Backup   : Daily at 09:00 PM (21:00 Clinic Closing)
echo.

:: 1. Day Start Task (08:00 AM)
schtasks /create /tn "HMS_Database_Backup_DayStart" /tr "\"%BACKUP_SCRIPT%\" --silent" /sc daily /st 08:00 /ru SYSTEM /f
if errorlevel 1 (
    echo [WARNING] Could not create DayStart task with SYSTEM user, retrying with current user...
    schtasks /create /tn "HMS_Database_Backup_DayStart" /tr "\"%BACKUP_SCRIPT%\" --silent" /sc daily /st 08:00 /f
)

:: 2. Day End Task (09:00 PM / 21:00)
schtasks /create /tn "HMS_Database_Backup_DayEnd" /tr "\"%BACKUP_SCRIPT%\" --silent" /sc daily /st 21:00 /ru SYSTEM /f
if errorlevel 1 (
    echo [WARNING] Could not create DayEnd task with SYSTEM user, retrying with current user...
    schtasks /create /tn "HMS_Database_Backup_DayEnd" /tr "\"%BACKUP_SCRIPT%\" --silent" /sc daily /st 21:00 /f
)

echo.
echo ============================================================================
echo [SUCCESS] Daily Automated Backups Configured!
echo ============================================================================
echo Tasks created in Windows Task Scheduler:
echo   • HMS_Database_Backup_DayStart (08:00 AM)
echo   • HMS_Database_Backup_DayEnd   (09:00 PM)
echo.
echo Backups will be automatically saved date-wise in:
echo   %~dp0backups\
echo.
echo You can also double-click 'backup-db.bat' at any time to take an immediate dump.
echo ============================================================================
echo.
pause

