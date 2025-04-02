#!/bin/bash
# Script to make all shell scripts executable

# Set colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Making all shell scripts executable...${NC}"

# Make all shell scripts executable
chmod +x *.sh

echo -e "${GREEN}All shell scripts are now executable!${NC}"

# List executable scripts
echo -e "${YELLOW}Executable scripts in this directory:${NC}"
ls -l *.sh
