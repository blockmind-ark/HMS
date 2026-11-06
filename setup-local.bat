@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo    Ruqayya Hospital ^& Pharmacy Management System (HMS)
echo    On-Premise Containerized Local Deployment (Windows)
echo ================================================================
echo.

:: 1. Verify Docker is available
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not found in system PATH.
    echo Please install Docker Desktop for Windows and ensure it is running:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

:: 2. Verify Docker daemon is running
docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Desktop engine is not currently running.
    echo Please start Docker Desktop and wait for the engine to initialize.
    echo.
    pause
    exit /b 1
)

:: 3. Ensure .env exists; if not, copy from .env.example
if not exist .env (
    echo [INFO] No .env file found. Copying default configuration from .env.example...
    copy .env.example .env >nul
    echo [OK] Created .env configuration file.
) else (
    echo [OK] Existing .env file detected.
)

:: 4. Build and start containers
echo.
echo [1/4] Building and starting Docker containers in detached mode...
docker compose up --build -d
if %ERRORLEVEL% neq 0 (
    echo [ERROR] docker compose up failed with exit code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

:: 5. Wait for PostgreSQL container health check
echo.
echo [2/4] Waiting for PostgreSQL database to become healthy...
set /a retries=0
set /a max_retries=30

:WAIT_LOOP
timeout /t 2 /nobreak >nul
set /a retries+=1

for /f "tokens=*" %%i in ('docker compose ps --format "{{.Health}}" postgres 2^>nul') do set STATUS=%%i

if "%STATUS%"=="healthy" (
    echo.
    echo [OK] PostgreSQL database is healthy and ready!
    goto DB_READY
)

if %retries% geq %max_retries% (
    echo.
    echo [ERROR] PostgreSQL failed to report healthy within %max_retries% attempts.
    echo Reviewing database logs:
    docker compose logs postgres --tail=30
    pause
    exit /b 1
)

<nul set /p=.
goto WAIT_LOOP

:DB_READY
:: 6. Push Prisma schema inside app container
echo.
echo [3/4] Syncing database schema (npx prisma db push)...
docker compose exec -T app npx prisma db push --skip-generate
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Retrying prisma db push in 3 seconds...
    timeout /t 3 /nobreak >nul
    docker compose exec -T app npx prisma db push --skip-generate
)

:: 7. Seed initial staff accounts and medicines
echo.
echo [4/4] Seeding initial staff accounts and pharmaceutical inventory...
docker compose exec -T app npx prisma db seed

echo.
echo ================================================================
echo    HMS Deployment Successful ^& Running!
echo ================================================================
echo    Local Server:            http://localhost:3000
echo    Hospital LAN Base URL:   http://^<SERVER_IP^>:3000
echo.
echo    Department Workstation Terminal Portals:
echo    - Reception Desk:        http://^<SERVER_IP^>:3000/receptionist
echo    - Doctor Consultation:   http://^<SERVER_IP^>:3000/doctor
echo    - Pharmacy POS:          http://^<SERVER_IP^>:3000/pharmacist
echo    - Admin Control Center:  http://^<SERVER_IP^>:3000/admin
echo.
echo    Default Staff Credentials:
echo    - Admin:                 admin@hms.local        (Pass: admin123)
echo    - Receptionist:          receptionist@hms.local (Pass: reception123)
echo    - Doctor:                doctor@hms.local       (Pass: doctor123)
echo    - Pharmacist:            pharmacist@hms.local   (Pass: pharma123)
echo.
echo    Workstation Security ^& IP Whitelist:
echo    - Configured in .env via ALLOWED_IPS_RECEPTIONIST, ALLOWED_IPS_DOCTOR, etc.
echo    - View ^& audit live connections under Admin Portal -^> Workstations ^& Network IPs
echo.
echo    Operational Commands:
echo    - View live logs:        docker compose logs -f
echo    - Stop system:           docker compose down
echo    - Restart system:        docker compose restart
echo ================================================================
echo.
pause

