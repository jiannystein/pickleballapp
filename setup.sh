#!/bin/bash
# PickleBall App Setup for Ubuntu

# Set colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up PickleBall App...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found."
    echo "Please create a .env file based on .env.example"
    exit 1
fi

echo "Setting up your PickleBall development environment..."

# Install dependencies
echo -e "${CYAN}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies."
    exit 1
fi

# Generate Prisma client
echo -e "${CYAN}Generating Prisma client...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to generate Prisma client."
    exit 1
fi

# Push schema to database
echo -e "${CYAN}Pushing schema to database...${NC}"
npx prisma db push
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to push database schema."
    echo "Make sure your DATABASE_URL in .env is correct and the database is accessible."
    exit 1
fi

# Seed the database
echo -e "${CYAN}Seeding database...${NC}"
npx prisma db seed
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to seed the database."
    exit 1
fi

# Initialize reviews
echo -e "${CYAN}Initializing reviews...${NC}"
node src/scripts/initialize-reviews.js

# Create start script
echo -e "${CYAN}Creating development starter script...${NC}"
cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "Starting PickleBall App development server..."
npm run dev
EOL

# Make the start script executable
chmod +x start-dev.sh

echo -e "${GREEN}Setup complete! You can now run ./start-dev.sh to start the development server.${NC}"
echo
echo "Default admin credentials:"
echo "Email: admin@example.com"
echo "Password: admin123"
echo
echo "IMPORTANT: Please change the admin password immediately after first login!"
echo
echo "To manually start the server:"
echo "  npm run dev"
echo "===================================================" 