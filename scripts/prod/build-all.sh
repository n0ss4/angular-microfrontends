#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/../.." || exit

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building all applications for production...${NC}"
echo ""

# Array of apps
apps=(
  "host-app"
  "mfe1-app"
  "mfe2-app"
  "mfe3-app"
  "mfe4-app"
)

# Track failures
failed_builds=()

# Build each app
for app in "${apps[@]}"; do
  echo -e "${BLUE}Building $app...${NC}"

  cd "$app" || exit

  if npm run build; then
    echo -e "${GREEN}✓ $app built successfully${NC}"
  else
    echo -e "${RED}✗ $app build failed${NC}"
    failed_builds+=("$app")
  fi

  cd ..
  echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
if [ ${#failed_builds[@]} -eq 0 ]; then
  echo -e "${GREEN}All applications built successfully!${NC}"
  exit 0
else
  echo -e "${RED}Build failed for: ${failed_builds[*]}${NC}"
  exit 1
fi
