# PickleBall App

A modern web application for connecting pickleball enthusiasts, managing sessions, and building a vibrant community around the sport.

## Screenshots

### Homepage
![Homepage](public/uploads/screenshots/homepage.png)

### Sessions
![Sessions](public/uploads/screenshots/sessions.png)

### Session Detail
![Session Detail](public/uploads/screenshots/session-detail.png)

### Locations
![Locations](public/uploads/screenshots/locations.png)

### About
![About](public/uploads/screenshots/about.png)

### Admin Dashboard
![Admin Dashboard](public/uploads/screenshots/admin-dashboard.png)

### Login
![Login](public/uploads/screenshots/login.png)

### Admin Users
![Admin Users](public/uploads/screenshots/admin-users.png)

### Admin Locations
![Admin Locations](public/uploads/screenshots/admin-locations.png)

### Admin Activities
![Admin Activities](public/uploads/screenshots/admin-activities.png)

### Admin Announcements
![Admin Announcements](public/uploads/screenshots/admin-announcements.png)

### Admin Bug Reports
![Admin Bug Reports](public/uploads/screenshots/admin-bug-reports.png)

### Admin Customize
![Admin Customize](public/uploads/screenshots/admin-customize.png)

## Features

- Create and join pickleball sessions
- Connect with fellow players
- Rate and review players
- Track your playing history
- Find nearby sessions
- Admin dashboard for site management
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 13, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Styling**: TailwindCSS with custom components

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 12.x or later
- npm package manager

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/jiannystein/pickleballapp.git
cd pickleballapp
```

### 2. Set up environment

Copy the example environment file and update it with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pickleballapp?schema=public
DIRECT_URL=postgresql://postgres:yourpassword@localhost:5432/pickleballapp?schema=public
NEXTAUTH_SECRET=your_secret_here
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Run the setup script

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Ubuntu/macOS:**
```bash
chmod +x make-executable.sh && ./make-executable.sh
./setup.sh
```

The setup script will:
1. Install npm dependencies
2. Generate the Prisma client
3. Create the database if it doesn't exist
4. Push the database schema
5. Seed the database with initial data (admin user, test users, locations)
6. Initialize review states for completed sessions

### 4. Start the development server

**Option A - Direct:**
```bash
npm run dev
```

**Option B - PowerShell script:**
```powershell
.\start-dev.ps1
```

**Option C - PM2 (recommended for long-running):**
```bash
pm2 start ecosystem.config.js
```

### 5. Access the application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Admin Account

After running the setup script, you can log in with:

- **Email**: admin@example.com
- **Password**: admin123

**IMPORTANT**: Change the admin password immediately after your first login.

## Process Management with PM2

PM2 keeps the app running in the background and auto-restarts on crashes.

### Setup

```bash
# Install PM2 globally
npm install -g pm2

# Start development server
pm2 start ecosystem.config.js --only pickleball-app

# View running processes
pm2 list

# View logs
pm2 logs pickleball-app

# Stop the app
pm2 stop pickleball-app

# Restart the app
pm2 restart pickleball-app

# Auto-start PM2 on system boot
pm2 startup
pm2 save
```

### Production Deployment

```bash
# Build the application first
npm run build

# Start the production instance
pm2 start ecosystem.config.js --only pickleball-app-prod

# Monitor resource usage
pm2 monit
```

## Available Scripts

### npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed the database |

### PowerShell scripts (Windows)

| Script | Description |
|--------|-------------|
| `.\install-prerequisites.ps1` | Check and install prerequisites (Node.js, PostgreSQL) |
| `.\setup.ps1` | Full setup: install deps, generate Prisma, create DB, push schema, seed |
| `.\start-dev.ps1` | Start the development server |
| `.\prisma-push.ps1` | Push Prisma schema changes to the database |
| `.\seed-db.ps1` | Seed the database with initial data |
| `.\reset-db.ps1` | Reset the database (WARNING: deletes all data) |
| `.\initialize-reviews.ps1` | Initialize review states for completed sessions |

### Shell scripts (Ubuntu/macOS)

| Script | Description |
|--------|-------------|
| `./install-prerequisites.sh` | Check and install prerequisites |
| `./setup.sh` | Full setup |
| `./start-dev.sh` | Start the development server |
| `./prisma-push.sh` | Push Prisma schema changes |
| `./seed-db.sh` | Seed the database |
| `./reset-db.sh` | Reset the database (WARNING: deletes all data) |
| `./initialize-reviews.sh` | Initialize review states for completed sessions |

### Utility scripts

| Script | Description |
|--------|-------------|
| `node create-db.js` | Create the database if it doesn't exist |
| `node createAdminUser.js` | Create admin user manually |
| `node listUsers.js` | List all users in the database |

## Troubleshooting

### Missing Configuration Files

If you encounter errors about missing `env.ts` or `init-admin.ts`:

```bash
cp src/lib/env.example.ts src/lib/env.ts
cp src/lib/init-admin.example.ts src/lib/init-admin.ts
```

### PostgreSQL Connection Issues

**Ubuntu:**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name "postgresql*"

# Start PostgreSQL service
Start-Service -Name "postgresql-x64-17"
```

### Prisma Client Not Initialized

If you see "PrismaClient did not initialize yet":

```bash
npx prisma generate
```

### Port Already in Use

If port 3000 is already in use:

**Windows:**
```powershell
# Find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /F /PID <PID_NUMBER>
```

**Ubuntu:**
```bash
lsof -i :3000
kill -9 <PID>
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | No | Direct database connection (bypasses connection pooling) |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth.js session encryption |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `NEXTAUTH_URL` | Yes | Full URL of your application (e.g., http://localhost:3000) |
| `DEFAULT_ADMIN_PASSWORD` | No | Password for auto-created admin user (default: admin123) |
| `PORT` | No | Server port (default: 3000) |

## Project Structure

```
pickleballapp/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed data
├── public/
│   └── uploads/               # Uploaded files (logos, photos)
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API route handlers
│   │   └── ...                # Public pages
│   ├── components/            # React components
│   ├── lib/                   # Utility functions and helpers
│   └── scripts/               # Server-side scripts
├── create-db.js               # Database creation script
├── ecosystem.config.js        # PM2 process manager config
├── setup.ps1 / setup.sh       # Setup scripts
└── .env                       # Environment variables (not committed)
```
