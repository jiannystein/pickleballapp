#!/bin/bash
# PickleBall App Development Server Starter for Ubuntu

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting PickleBall App development server...${NC}"

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

# Start the development server
npx next dev 