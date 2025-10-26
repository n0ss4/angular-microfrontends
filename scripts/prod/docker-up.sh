#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/../.." || exit

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Docker containers with docker-compose...${NC}"
echo ""

# Start containers
if docker-compose up -d; then
  echo ""
  echo -e "${GREEN}All containers started successfully!${NC}"
  echo ""
  echo "Access URLs:"
  echo "  - Host:  http://localhost:4200"
  echo "  - MFE1:  http://localhost:4201"
  echo "  - MFE2:  http://localhost:4202"
  echo "  - MFE3:  http://localhost:4203"
  echo "  - MFE4:  http://localhost:4204"
  echo ""
  echo "View logs: docker-compose logs -f"
  echo "Stop containers: scripts/prod/docker-down.sh"
else
  echo -e "${RED}Failed to start containers${NC}"
  exit 1
fi
