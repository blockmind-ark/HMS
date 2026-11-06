#!/bin/bash
# =====================================================================
# Ruqayya Clinic & Pharmacy - Hardware Biometric Scanner Daemon Launcher
# Starts the local hardware scanner daemon on http://127.0.0.1:9099
# Bridges Elan MOC laptop sensor & NITGen optical scanner to the web portal
# =====================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/../.."

echo "=========================================================="
echo " Starting Ruqayya Biometric Hardware Scanner Daemon..."
echo " Bridging physical laptop sensor & optical USB to web portal"
echo "=========================================================="

# Check if already running on port 9099
if lsof -Pi :9099 -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️ Daemon already running on port 9099. Stopping old instance..."
  fuser -k 9099/tcp 2>/dev/null
  sleep 1
fi

node services/biometric-daemon/scanner-daemon.js

