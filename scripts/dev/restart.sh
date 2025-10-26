#!/bin/bash

# Get script directory
SCRIPT_DIR="$(dirname "$0")"

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Restarting all micro-frontends in development mode...${NC}"
echo ""

# Stop all apps
"$SCRIPT_DIR/stop.sh"

echo ""
echo -e "${BLUE}Waiting 3 seconds before starting...${NC}"
sleep 3
echo ""

# Start all apps
"$SCRIPT_DIR/start.sh"
