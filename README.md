# PickleBall App

A modern web application for connecting pickleball enthusiasts, managing sessions, and building a vibrant community around the sport.

## Features

- 🏓 Create and join pickleball sessions
- 👥 Connect with fellow players
- ⭐ Rate and review players
- 📊 Track your playing history
- 🗺️ Find nearby sessions
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS with custom components

## Prerequisites

- Node.js 18.x or later (recommended: v18.17.0 LTS)
- PostgreSQL 12.x or later
- npm package manager

## Ubuntu Setup Guide

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jiannystein/pickleballapp.git
   cd pickleballapp
   ```

2. **Make scripts executable**:
   ```bash
   chmod +x make-executable.sh
   ./make-executable.sh
   ```

3. **Check prerequisites**:
   ```bash
   ./install-prerequisites.sh
   ```
   This script will check for Node.js and PostgreSQL, install them if needed, and create a template .env file.

4. **Copy environment configuration files**:
   ```bash
   # Copy the environment example file if not already done
   cp .env.example .env
   
   # Create the required TypeScript configuration files
   mkdir -p src/lib
   cp src/lib/env.ts.example src/lib/env.ts
   cp src/lib/init-admin.ts.example src/lib/init-admin.ts
   ```

5. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

6. **Start the development server**:
   ```bash
   ./start-dev.sh
   ```

7. **Access the application** at [http://localhost:3000](http://localhost:3000)

## Process Management with PM2

For production deployments, you can use PM2 to manage your application:

```bash
# Install PM2 globally
npm install -g pm2

# Start your Next.js app with PM2
pm2 start npm --name "pickleball-app" -- run dev

# Make PM2 startup on system boot
pm2 startup
pm2 save
```

## Default Admin Account

After running the setup script, you can access the admin dashboard with:

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **SECURITY WARNING**: Change the admin password immediately after your first login.

## Troubleshooting

### Missing Configuration Files

If you encounter errors about missing files like `env.ts` or `init-admin.ts`:
```bash
# Create necessary directories
mkdir -p src/lib

# Copy example files
cp src/lib/env.ts.example src/lib/env.ts
cp src/lib/init-admin.ts.example src/lib/init-admin.ts

# Restart the development server
./start-dev.sh
```

### PostgreSQL Connection Issues

If you can't connect to PostgreSQL:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql
```

### Node Version Management

If you need a specific Node.js version:
```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `JWT_SECRET`: Secret for JWT tokens
- `NEXTAUTH_URL`: Full URL of your application (e.g., http://localhost:3000) 