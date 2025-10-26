#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/../.." || exit

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building Docker images for all applications...${NC}"
echo ""

# Check if builds exist
echo -e "${BLUE}Checking if production builds exist...${NC}"
missing_builds=()

apps=(
  "host-app"
  "mfe1-app"
  "mfe2-app"
  "mfe3-app"
  "mfe4-app"
)

for app in "${apps[@]}"; do
  if [ ! -d "$app/dist/$app" ]; then
    missing_builds+=("$app")
  fi
done

if [ ${#missing_builds[@]} -gt 0 ]; then
  echo -e "${RED}Missing builds for: ${missing_builds[*]}${NC}"
  echo -e "${BLUE}Running build script first...${NC}"
  echo ""

  ./scripts/prod/build-all.sh || exit 1
  echo ""
fi

echo -e "${GREEN}All builds found!${NC}"
echo ""

# Build Docker images
echo -e "${BLUE}Building Docker images...${NC}"
echo ""

failed_builds=()

for app in "${apps[@]}"; do
  echo -e "${BLUE}Building Docker image for $app...${NC}"

  cd "$app" || exit

  if docker build -t "angular-mf/$app:latest" --build-arg APP_NAME="$app" .; then
    echo -e "${GREEN}✓ Docker image for $app built successfully${NC}"
  else
    echo -e "${RED}✗ Docker image build failed for $app${NC}"
    failed_builds+=("$app")
  fi

  cd ..
  echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
if [ ${#failed_builds[@]} -eq 0 ]; then
  echo -e "${GREEN}All Docker images built successfully!${NC}"
  echo ""
  echo "Built images:"
  for app in "${apps[@]}"; do
    echo "  - angular-mf/$app:latest"
  done
  exit 0
else
  echo -e "${RED}Docker build failed for: ${failed_builds[*]}${NC}"
  exit 1
fi
