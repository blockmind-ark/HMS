@echo off
REM ==============================================================================
REM Hospital & Pharmacy Management System (HMS) - Windows Production Deployment
REM ==============================================================================
TITLE HMS Production Deployment - Ruqayya Clinic & Pharmacy

echo ===============================================================================
echo           Ruqayya Clinic & Pharmacy Management System (HMS)
echo                      Windows Production Deployment
echo ===============================================================================
echo.

REM 1. Check Docker Availability
echo [1/5] Checking Docker Desktop / Engine...
docker --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed, not running, or not found in system PATH.
    echo Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)

REM 2. Build and Start Production Containers
echo [2/5] Building and launching production containers (docker-compose.prod.yml)...
docker compose -f docker-compose.prod.yml up --build -d
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start production containers via docker compose.
    pause
    exit /b %ERRORLEVEL%
)

REM 3. Wait for PostgreSQL Database Container to be Healthy
echo.
echo [3/5] Waiting for PostgreSQL database container (hms_postgres_prod) to be ready...
echo This will take approximately 10-15 seconds for first initialization...
timeout /t 12 /nobreak >nul

REM 4. Synchronize Schema with Prisma
echo.
echo [4/5] Synchronizing database schema (prisma db push)...
docker exec hms_app_prod npx prisma db push
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to push Prisma schema into production database.
    pause
    exit /b %ERRORLEVEL%
)

REM 5. Reset Operational Values & Seed Production Roles + 289 Medicines
echo.
echo [5/5] Initializing production database and resetting operational values (db:reset-prod)...
docker exec hms_app_prod npm run db:reset-prod
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to initialize production database.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===============================================================================
echo            PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ===============================================================================
echo Access URL:       http://localhost:3000 (or your Hospital Server Local IP:3000)
echo Database Service: PostgreSQL 15 Alpine (hms_postgres_prod)
echo App Service:      Next.js 14 Production Server (hms_app_prod)
echo.
echo Default Production Credentials:
echo   - Admin Portal:        admin@hms.com     /  AdminPass123!
echo   - Receptionist Portal:  reception@hms.com /  ReceptionPass123!
echo   - Pharmacist Portal:    pharma@hms.com    /  PharmaPass123!
echo   - Doctor Portal:        doctor@hms.com    /  DoctorPass123!
echo.
echo Useful Commands:
echo   - View App Logs:        docker compose -f docker-compose.prod.yml logs -f app_prod
echo   - Restart Services:     docker compose -f docker-compose.prod.yml restart
echo   - Stop Production:      docker compose -f docker-compose.prod.yml down
echo ===============================================================================
echo.
pause

