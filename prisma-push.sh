#!/bin/bash
# PickleBall App Prisma Schema Push for Ubuntu

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pushing Prisma schema to database...${NC}"

# Push schema to database
npx prisma db push

