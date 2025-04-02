#!/bin/bash
# PickleBall App Database Seeder for Ubuntu

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}Seeding database...${NC}"

# Seed database
npx prisma db seed
