#!/bin/bash
# PickleBall App Database Reset for Ubuntu

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${RED}WARNING: This will reset your database and delete ALL data!${NC}"
echo -e "${YELLOW}Press Ctrl+C to cancel or Enter to continue...${NC}"
read -r

echo -e "${GREEN}Resetting database...${NC}"

# Reset database
npx prisma migrate reset --force
