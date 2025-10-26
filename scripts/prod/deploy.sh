#!/bin/bash

# Get script directory
SCRIPT_DIR="$(dirname "$0")"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Complete Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Build all apps
echo -e "${BLUE}Step 1/3: Building all applications...${NC}"
"$SCRIPT_DIR/build-all.sh" || exit 1

echo ""

# Step 2: Build Docker images
echo -e "${BLUE}Step 2/3: Building Docker images...${NC}"
"$SCRIPT_DIR/docker-build.sh" || exit 1

echo ""

# Step 3: Start containers
echo -e "${BLUE}Step 3/3: Starting containers...${NC}"
"$SCRIPT_DIR/docker-up.sh" || exit 1

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
