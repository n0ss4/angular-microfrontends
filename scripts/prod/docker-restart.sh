#!/bin/bash

# Get script directory
SCRIPT_DIR="$(dirname "$0")"

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Restarting Docker containers...${NC}"
echo ""

# Stop containers
"$SCRIPT_DIR/docker-down.sh"

echo ""
echo -e "${BLUE}Waiting 2 seconds...${NC}"
sleep 2
echo ""

# Start containers
"$SCRIPT_DIR/docker-up.sh"
