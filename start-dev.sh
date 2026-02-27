#!/bin/bash
# PickleBall App Development Server Starter for Ubuntu

# Change to script directory
cd "$(dirname "$0")"

# Set colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting PickleBall App development server...${NC}"

# Start the development server (.env is loaded by Next.js automatically)
npx next dev
