#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Stopping all micro-frontends...${NC}"

# Array of apps
apps=(
  "host-app"
  "mfe1-app"
  "mfe2-app"
  "mfe3-app"
  "mfe4-app"
)

# Stop each app
for app in "${apps[@]}"; do
  pid_file=".pids/$app.pid"

  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")

    if ps -p "$pid" > /dev/null 2>&1; then
      echo -e "${GREEN}Stopping $app (PID: $pid)...${NC}"
      kill "$pid" 2>/dev/null

      # Wait a moment for graceful shutdown
      sleep 1

      # Force kill if still running
      if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${RED}Force stopping $app...${NC}"
        kill -9 "$pid" 2>/dev/null
      fi

      echo -e "${GREEN}✓ $app stopped${NC}"
    else
      echo -e "${RED}$app (PID: $pid) not running${NC}"
    fi

    rm "$pid_file"
  else
    echo -e "${RED}No PID file found for $app${NC}"
  fi
done

# Also kill any remaining npm/node processes on these ports
echo ""
echo -e "${BLUE}Cleaning up any remaining processes on ports 4200-4204...${NC}"

for port in {4200..4204}; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo -e "${GREEN}Killing process on port $port (PID: $pid)${NC}"
    kill -9 "$pid" 2>/dev/null
  fi
done

echo ""
echo -e "${GREEN}All applications stopped!${NC}"
