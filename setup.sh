#!/bin/bash
# PickleBall App Setup for Ubuntu/macOS

# Change to script directory
cd "$(dirname "$0")"

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up PickleBall App...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found.${NC}"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Install dependencies
echo -e "${CYAN}[1/6] Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install dependencies.${NC}"
    exit 1
fi

# Generate Prisma client
echo -e "${CYAN}[2/6] Generating Prisma client...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to generate Prisma client.${NC}"
    exit 1
fi

# Create database if it doesn't exist
echo -e "${CYAN}[3/6] Creating database (if needed)...${NC}"
node create-db.js
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to create database.${NC}"
    echo "Make sure PostgreSQL is running and your DATABASE_URL in .env is correct."
    exit 1
fi

# Push schema to database
echo -e "${CYAN}[4/6] Pushing schema to database...${NC}"
npx prisma db push
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to push database schema.${NC}"
    exit 1
fi

# Seed the database
echo -e "${CYAN}[5/6] Seeding database...${NC}"
npx prisma db seed
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to seed the database.${NC}"
    exit 1
fi

# Initialize reviews
echo -e "${CYAN}[6/6] Initializing reviews...${NC}"
node src/scripts/initialize-reviews.js

echo
echo -e "${GREEN}Setup complete!${NC}"
echo
echo "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo
echo -e "${YELLOW}IMPORTANT: Change the admin password immediately after first login!${NC}"
echo
echo "To start the development server, run:"
echo "  ./start-dev.sh"
echo "  OR"
echo "  pm2 start ecosystem.config.js"
