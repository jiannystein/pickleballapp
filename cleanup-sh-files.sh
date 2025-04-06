#!/bin/bash
# Cleanup script to remove redundant shell script files

# Set colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Removing redundant shell script files...${NC}"

# List of old script files to remove
declare -a old_scripts=(
  "old-setup.sh"
  "dev.sh"
  "start.sh"
  "migrate.sh"
  "reset.sh"
)

# Remove each file
for file in "${old_scripts[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo -e "${GREEN}Removed: $file${NC}"
  else
    echo -e "${CYAN}Not found: $file${NC}"
  fi
done

echo -e "\n${GREEN}Cleanup complete! The redundant script files have been removed.${NC}"
echo -e "${YELLOW}Please use the new shell scripts instead:${NC}"
echo -e "  - setup.sh"
echo -e "  - start-dev.sh"
echo -e "  - prisma-push.sh"
echo -e "  - seed-db.sh"
echo -e "  - reset-db.sh"
echo -e "  - initialize-reviews.sh"

