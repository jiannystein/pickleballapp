#!/bin/bash
# PickleBall App Reviews Initializer for Ubuntu

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}Initializing reviews...${NC}"

# Initialize reviews
node src/scripts/initialize-reviews.js
