#!/bin/bash
# PickleBall App Prerequisites Installer for Ubuntu

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}PickleBall App Prerequisites Installer${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Note: Some operations may require root privileges.${NC}"
  echo -e "${YELLOW}Consider running with sudo if you encounter permission issues.${NC}"
  echo
fi

# Check for Node.js
echo -e "${CYAN}Checking for Node.js...${NC}"
if command -v node &> /dev/null; then
  node_version=$(node --version)
  echo -e "${GREEN}Node.js $node_version is installed.${NC}"
else
  echo -e "${YELLOW}Node.js is not installed.${NC}"
  echo -e "${YELLOW}Would you like to install Node.js 18.x? (y/n)${NC}"
  read -r install_node
  if [ "$install_node" = "y" ]; then
    echo -e "${CYAN}Installing Node.js 18.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}Node.js $(node --version) installed.${NC}"
  else
    echo -e "${RED}Please install Node.js 18.x manually from https://nodejs.org/${NC}"
  fi
fi

# Check for npm
if command -v npm &> /dev/null; then
  npm_version=$(npm --version)
  echo -e "${GREEN}npm $npm_version is installed.${NC}"
else
  echo -e "${RED}npm is not installed properly.${NC}"
fi

# Check for PostgreSQL
echo -e "${CYAN}Checking for PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
  pg_version=$(psql --version)
  echo -e "${GREEN}PostgreSQL is installed: $pg_version${NC}"
else
  echo -e "${YELLOW}PostgreSQL is not installed.${NC}"
  echo -e "${YELLOW}Would you like to install PostgreSQL? (y/n)${NC}"
  read -r install_pg
  if [ "$install_pg" = "y" ]; then
    echo -e "${CYAN}Installing PostgreSQL...${NC}"
    sudo apt install -y postgresql postgresql-contrib
    echo -e "${GREEN}PostgreSQL installed.${NC}"
    
    echo -e "${CYAN}Starting PostgreSQL service...${NC}"
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    echo -e "${GREEN}PostgreSQL service started and enabled.${NC}"
  else
    echo -e "${RED}Please install PostgreSQL manually from https://www.postgresql.org/download/linux/ubuntu/${NC}"
  fi
fi

# Create .env file if it doesn't exist
echo -e "${CYAN}Checking for .env file...${NC}"
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}.env file not found. Creating template...${NC}"
  cat > .env << EOL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret"
JWT_SECRET="your-jwt-secret"
NEXTAUTH_URL="http://localhost:3000"
DEFAULT_ADMIN_PASSWORD="admin123"
EOL
  echo -e "${GREEN}.env template created. Please update with your database credentials.${NC}"
else
  echo -e "${GREEN}.env file already exists.${NC}"
fi

# Make scripts executable
echo -e "${CYAN}Making shell scripts executable...${NC}"
chmod +x *.sh
echo -e "${GREEN}Scripts are now executable.${NC}"

echo
echo -e "${GREEN}Prerequisites check complete!${NC}"
echo -e "${CYAN}Next steps:${NC}"
echo -e "1. Update the .env file with your database credentials"
echo -e "2. Run ${YELLOW}./setup.sh${NC} to set up the application"
echo -e "3. Run ${YELLOW}./start-dev.sh${NC} to start the development server"

