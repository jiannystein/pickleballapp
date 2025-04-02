#!/bin/bash

echo "==================================================="
echo "PickleBall App Setup Script"
echo "==================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found."
    echo "Please create a .env file based on .env.example"
    exit 1
fi

echo "Setting up your PickleBall development environment..."

# Install dependencies
echo "[1/5] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies."
    exit 1
fi

# Generate Prisma client
echo "[2/5] Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to generate Prisma client."
    exit 1
fi

# Push schema to database
echo "[3/5] Setting up database schema..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to push database schema."
    echo "Make sure your DATABASE_URL in .env is correct and the database is accessible."
    exit 1
fi

# Seed the database
echo "[4/5] Seeding database with initial data..."
npx prisma db seed
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to seed the database."
    exit 1
fi

# Create start script
echo "[5/5] Creating development starter script..."
cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "Starting PickleBall App development server..."
npm run dev
EOL

# Make the start script executable
chmod +x start-dev.sh

echo "==================================================="
echo "Setup complete! Your environment is ready."
echo "==================================================="
echo
echo "Default admin credentials:"
echo "Email: admin@example.com"
echo "Password: admin123"
echo
echo "IMPORTANT: Please change the admin password immediately after first login!"
echo
echo "To start the development server, run:"
echo "  ./start-dev.sh"
echo
echo "To manually start the server:"
echo "  npm run dev"
echo "===================================================" 