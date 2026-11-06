#!/usr/bin/env bash
# =============================================================================
# Hospital & Pharmacy Management System (HMS)
# Automated On-Premise Local Deployment Script for Linux / Ubuntu
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}   Ruqayya Hospital & Pharmacy Management System (HMS)          ${NC}"
echo -e "${CYAN}   On-Premise Containerized Local Deployment (Ubuntu/Linux)     ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# 1. Verify Docker is installed
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker is not installed or not in PATH.${NC}"
  echo "Please install Docker engine (https://docs.docker.com/engine/install/ubuntu/) and retry."
  exit 1
fi

# 2. Verify Docker Compose is available
if ! docker compose version >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] 'docker compose' plugin is not installed or available.${NC}"
  echo "Please install Docker Compose v2 (e.g. 'sudo apt-get install docker-compose-plugin')."
  exit 1
fi

# 3. Ensure .env exists; if not, create from .env.example
if [ ! -f .env ]; then
  echo -e "${YELLOW}[INFO] No .env file found. Copying default configuration from .env.example...${NC}"
  cp .env.example .env
  echo -e "${GREEN}[OK] Created .env configuration file.${NC}"
else
  echo -e "${GREEN}[OK] Existing .env file detected.${NC}"
fi

# 4. Build and start containers
echo ""
echo -e "${CYAN}[1/4] Building and starting Docker containers in detached mode...${NC}"
docker compose up --build -d

# 5. Wait for PostgreSQL container health check
echo ""
echo -e "${CYAN}[2/4] Waiting for PostgreSQL container to become healthy...${NC}"
MAX_WAIT_SECONDS=60
ELAPSED=0

while [ "$ELAPSED" -lt "$MAX_WAIT_SECONDS" ]; do
  STATUS=$(docker compose ps --format '{{.Health}}' postgres 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo ""
    echo -e "${GREEN}[OK] PostgreSQL database is healthy and ready!${NC}"
    break
  fi
  printf "."
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

if [ "$ELAPSED" -ge "$MAX_WAIT_SECONDS" ]; then
  echo ""
  echo -e "${RED}[ERROR] PostgreSQL database failed to report healthy within ${MAX_WAIT_SECONDS} seconds.${NC}"
  echo -e "${YELLOW}Reviewing database logs:${NC}"
  docker compose logs postgres --tail=30
  exit 1
fi

# 6. Push schema using Prisma inside app container
echo ""
echo -e "${CYAN}[3/4] Syncing database schema (npx prisma db push)...${NC}"
docker compose exec -T app npx prisma db push --skip-generate

# 7. Seed initial system users and medicine catalogue
echo ""
echo -e "${CYAN}[4/4] Seeding initial staff accounts and pharmaceutical inventory...${NC}"
docker compose exec -T app npx prisma db seed

# 8. Detect Local Network IP for LAN terminal access
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_SERVER_IP")

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}   HMS Deployment Successful & Running!                         ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "   Local Server:            ${CYAN}http://localhost:3000${NC}"
echo -e "   Hospital LAN Base URL:   ${CYAN}http://${SERVER_IP}:3000${NC}"
echo ""
echo -e "${YELLOW}   Department Workstation Terminal Portals:${NC}"
echo -e "   • Reception Desk:        ${CYAN}http://${SERVER_IP}:3000/receptionist${NC}"
echo -e "   • Doctor Consultation:   ${CYAN}http://${SERVER_IP}:3000/doctor${NC}"
echo -e "   • Pharmacy POS:          ${CYAN}http://${SERVER_IP}:3000/pharmacist${NC}"
echo -e "   • Admin Control Center:  ${CYAN}http://${SERVER_IP}:3000/admin${NC}"
echo ""
echo -e "${YELLOW}   Default Staff Credentials:${NC}"
echo -e "   • Admin:                 admin@hms.local        (Pass: admin123)"
echo -e "   • Receptionist:          receptionist@hms.local (Pass: reception123)"
echo -e "   • Doctor:                doctor@hms.local       (Pass: doctor123)"
echo -e "   • Pharmacist:            pharmacist@hms.local   (Pass: pharma123)"
echo ""
echo -e "${CYAN}   Workstation Security & IP Whitelist:${NC}"
echo -e "   • Configured in .env via ALLOWED_IPS_RECEPTIONIST, ALLOWED_IPS_DOCTOR, etc."
echo -e "   • View & audit live connections under Admin Portal -> Workstations & Network IPs"
echo ""
echo -e "${CYAN}   Operational Commands:${NC}"
echo -e "   • View logs:             docker compose logs -f"
echo -e "   • Stop system:           docker compose down"
echo -e "   • Restart system:        docker compose restart"
echo -e "${GREEN}================================================================${NC}"

