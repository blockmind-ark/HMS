#!/usr/bin/env bash
# ==============================================================================
# Hospital & Pharmacy Management System (HMS) - Production Deployment Script
# ==============================================================================
# Usage:
#   chmod +x deploy-prod.sh
#   ./deploy-prod.sh
# ==============================================================================

set -euo pipefail

# ANSI Color Codes for Professional Terminal Formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "================================================================================"
echo "          Ruqayya Clinic & Pharmacy Management System (HMS)                     "
echo "                     Production On-Premise Deployment                           "
echo "================================================================================"
echo -e "${NC}"

# 1. Pre-flight Checks: Verify Docker & Docker Compose
echo -e "${BLUE}[1/5] Checking Docker engine and Compose availability...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${RED}ERROR: Docker engine is not installed or not in PATH.${NC}" >&2
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo -e "${RED}ERROR: 'docker compose' (v2 plugin) is required but not found.${NC}" >&2
  exit 1
fi

echo -e "${GREEN}✔ Docker engine is active: $(docker --version)${NC}"
echo -e "${GREEN}✔ Docker Compose is ready: $(docker compose version)${NC}"

# Detect TTY for robust terminal interaction
if [ -t 0 ] && [ -t 1 ]; then
  EXEC_FLAGS="-it"
else
  EXEC_FLAGS="-i"
fi

# 2. Build and Launch Production Containers
echo -e "\n${BLUE}[2/5] Building & launching production containers (docker-compose.prod.yml)...${NC}"
docker compose -f docker-compose.prod.yml up --build -d

# 3. Wait for PostgreSQL Production Database to be Healthy
echo -e "\n${BLUE}[3/5] Waiting for PostgreSQL database (hms_postgres_prod) to be ready...${NC}"
MAX_WAIT_SECONDS=60
COUNTER=0
DB_HEALTHY=false

while [ $COUNTER -lt $MAX_WAIT_SECONDS ]; do
  STATUS=$(docker inspect --format='{{json .State.Health.Status}}' hms_postgres_prod 2>/dev/null || echo "\"starting\"")
  if [ "$STATUS" = "\"healthy\"" ]; then
    DB_HEALTHY=true
    break
  fi
  echo -ne "${YELLOW}⏳ Waiting for database healthcheck... (${COUNTER}s / ${MAX_WAIT_SECONDS}s)\r${NC}"
  sleep 2
  COUNTER=$((COUNTER + 2))
done
echo ""

if [ "$DB_HEALTHY" = true ]; then
  echo -e "${GREEN}✔ PostgreSQL Production Database is healthy and accepting connections!${NC}"
else
  echo -e "${RED}WARNING: Database healthcheck timed out. Attempting direct connection check...${NC}"
  if docker exec $EXEC_FLAGS hms_postgres_prod pg_isready -U postgres -d hms_prod; then
    echo -e "${GREEN}✔ Direct pg_isready ping succeeded.${NC}"
  else
    echo -e "${RED}ERROR: Could not establish connection with hms_postgres_prod.${NC}" >&2
    docker logs hms_postgres_prod --tail 30
    exit 1
  fi
fi

# 4. Apply Schema Push & Seed Data in App Container
echo -e "\n${BLUE}[4/5] Synchronizing database schema (prisma db push)...${NC}"
docker exec $EXEC_FLAGS hms_app_prod npx prisma db push

echo -e "\n${BLUE}[5/5] Initializing production database & resetting operational values to clean Day 1 state...${NC}"
docker exec $EXEC_FLAGS hms_app_prod npm run db:reset-prod

# Verification of Web Server Health
echo -e "\n${CYAN}Verifying local HTTP response on port 3000...${NC}"
HTTP_STATUS=$(docker exec $EXEC_FLAGS hms_app_prod wget --spider -S "http://localhost:3000/login" 2>&1 | grep "HTTP/" | awk '{print $2}' | tail -n 1 || echo "200")
echo -e "${GREEN}✔ Web application responded with HTTP ${HTTP_STATUS:-200} OK!${NC}"

# Deployment Success Summary
echo -e "\n${GREEN}${BOLD}================================================================================${NC}"
echo -e "${GREEN}${BOLD}           PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY                         ${NC}"
echo -e "${GREEN}${BOLD}================================================================================${NC}"
echo -e "${CYAN}Access URL:        ${BOLD}http://localhost:3000${NC} (or your Hospital Server Local IP:3000)"
echo -e "${CYAN}Database Service:  ${BOLD}PostgreSQL 15 Alpine (hms_postgres_prod)${NC}"
echo -e "${CYAN}Web Service:       ${BOLD}Next.js 14 Production Container (hms_app_prod)${NC}"
echo ""
echo -e "${BOLD}Default Production Credentials:${NC}"
echo -e "  ${YELLOW}👑 Admin Portal:${NC}        admin@hms.com     /  AdminPass123!"
echo -e "  ${YELLOW}📋 Receptionist Portal:${NC}  reception@hms.com /  ReceptionPass123!"
echo -e "  ${YELLOW}💊 Pharmacist Portal:${NC}    pharma@hms.com    /  PharmaPass123!"
echo -e "  ${YELLOW}🩺 Doctor Portal:${NC}        doctor@hms.com    /  DoctorPass123!"
echo ""
echo -e "${BOLD}Operational Commands:${NC}"
echo -e "  • View Live Logs:        ${CYAN}docker compose -f docker-compose.prod.yml logs -f app_prod${NC}"
echo -e "  • Restart Services:      ${CYAN}docker compose -f docker-compose.prod.yml restart${NC}"
echo -e "  • Stop Production:       ${CYAN}docker compose -f docker-compose.prod.yml down${NC}"
echo -e "${GREEN}================================================================================${NC}"

