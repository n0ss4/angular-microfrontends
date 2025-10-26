#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting all micro-frontends...${NC}"

# Array of apps with their ports
apps=(
  "host-app:4200"
  "mfe1-app:4201"
  "mfe2-app:4202"
  "mfe3-app:4203"
  "mfe4-app:4204"
)

# Start each app in background
for app_info in "${apps[@]}"; do
  IFS=':' read -r app port <<< "$app_info"

  echo -e "${GREEN}Starting $app on port $port...${NC}"

  cd "$app" || exit
  npm start > "../logs/$app.log" 2>&1 &
  echo $! > "../.pids/$app.pid"
  cd ..

  echo -e "${GREEN}✓ $app started (PID: $(cat ".pids/$app.pid"))${NC}"
done

echo ""
echo -e "${BLUE}All applications started!${NC}"
echo -e "${BLUE}Logs available in ./logs/${NC}"
echo ""
echo "Access URLs:"
echo "  - Host:  http://localhost:4200"
echo "  - MFE1:  http://localhost:4201"
echo "  - MFE2:  http://localhost:4202"
echo "  - MFE3:  http://localhost:4203"
echo "  - MFE4:  http://localhost:4204"
echo ""
echo "Use ./stop.sh to stop all applications"
