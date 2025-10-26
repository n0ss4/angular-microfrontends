#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Restarting all micro-frontends...${NC}"
echo ""

# Stop all apps
./stop.sh

echo ""
echo -e "${BLUE}Waiting 3 seconds before starting...${NC}"
sleep 3
echo ""

# Start all apps
./start.sh
