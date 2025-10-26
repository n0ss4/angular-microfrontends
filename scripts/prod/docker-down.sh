#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/../.." || exit

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Stopping Docker containers...${NC}"
echo ""

if docker-compose down; then
  echo ""
  echo -e "${GREEN}All containers stopped successfully!${NC}"
else
  echo -e "${RED}Failed to stop containers${NC}"
  exit 1
fi
