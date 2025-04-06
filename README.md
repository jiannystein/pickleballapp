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

## Convenience Scripts

We provide scripts for easy setup and management for both Windows and Ubuntu:

### Windows (PowerShell)

| Script | Description |
|--------|-------------|
| `install-prerequisites.ps1` | Checks and installs prerequisites |
| `setup.ps1` | One-command setup: installs dependencies, sets up database |
| `start-dev.ps1` | Starts the development server |
| `prisma-push.ps1` | Pushes database schema changes |
| `seed-db.ps1` | Seeds the database with initial data |
| `reset-db.ps1` | Resets the database (caution: deletes all data) |
| `initialize-reviews.ps1` | Initializes player reviews |
| `cleanup-bat-files.ps1` | Removes redundant .bat files |

To use PowerShell scripts:

1. Ensure PowerShell execution policy allows running scripts:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

2. Run any script by right-clicking it and selecting "Run with PowerShell" or by typing:
   ```powershell
   .\script-name.ps1
   ```

### Ubuntu (Bash)

| Script | Description |
|--------|-------------|
| `install-prerequisites.sh` | Checks and installs prerequisites |
| `setup.sh` | One-command setup: installs dependencies, sets up database |
| `start-dev.sh` | Starts the development server |
| `prisma-push.sh` | Pushes database schema changes |
| `seed-db.sh` | Seeds the database with initial data |
| `reset-db.sh` | Resets the database (caution: deletes all data) |
| `initialize-reviews.sh` | Initializes player reviews |
| `cleanup-sh-files.sh` | Removes redundant shell files |
| `make-executable.sh` | Makes all shell scripts executable |

To use Bash scripts:

1. Make scripts executable:
   ```bash
   chmod +x *.sh
   ```

2. Run any script by typing:
   ```bash
   ./script-name.sh
   ```

## Quick Start Guide

### Windows Setup

1. **Clone the repository**:
   ```
   git clone https://github.com/yourusername/pickleballapp.git
   cd pickleballapp
   ```

2. **Check prerequisites**:
   ```powershell
   .\install-prerequisites.ps1
   ```
   This script will check for Node.js and PostgreSQL and create a template .env file.

3. **Run the setup script**:
   ```powershell
   .\setup.ps1
   ```

4. **Start the development server**:
   ```powershell
   .\start-dev.ps1
   ```

5. **Access the application** at [http://localhost:3000](http://localhost:3000)

### Ubuntu Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/pickleballapp.git
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

### Default Admin Account

After running the setup script, you can access the admin dashboard with:

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **SECURITY WARNING**: Change the admin password immediately after your first login.

To change the admin password:
1. Login with the default credentials
2. Navigate to your profile settings
3. Update your password with a strong, unique alternative

## Security Considerations

### Sensitive Files

This repository contains several sensitive files that should not be committed to version control:

1. **Environment Files**:
   - `.env` - Contains database credentials and secret keys
   - `.env.local`, `.env.development`, `.env.production` - Environment-specific configs

2. **Sensitive Source Files**:
   - `src/lib/env.ts` - Contains fallback credentials and secrets
   - `src/lib/init-admin.ts` - Contains admin initialization logic

For each of these files, we provide an example template (`.example` extension) that you should copy and modify with your actual values.

### Before Pushing to Git

Before pushing your code to a git repository:

1. **Verify Sensitive Files Are Ignored**:
   ```bash
   git status
   ```
   Ensure sensitive files are not listed as tracked or staged.

2. **If Sensitive Files Are Already Tracked**:
   ```bash
   git rm --cached .env
   git rm --cached src/lib/env.ts
   git rm --cached src/lib/init-admin.ts
   ```

3. **Verify Your .gitignore**:
   The repository includes a comprehensive `.gitignore` file that should prevent sensitive files from being committed.

## Troubleshooting

### Windows-Specific Issues

#### PowerShell Execution Issues

If you encounter an error about script execution:
```
...cannot be loaded because running scripts is disabled on this system...
```

Run this command in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

#### Port Already in Use

If port 3000 is already in use, the application will try to use port 3001. You can manually specify a port:
```powershell
$env:PORT=3002; .\start-dev.ps1
```

#### Path Casing Issues

If you encounter warnings about casing in file paths, ensure your project folder uses consistent casing. See `migration-guide.md` for detailed instructions.

### Ubuntu-Specific Issues

#### Permission Denied

If you see "Permission denied" when trying to run scripts:
```bash
chmod +x *.sh  # Make all scripts executable
```

#### Missing Configuration Files

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

#### PostgreSQL Connection Issues

If you can't connect to PostgreSQL:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql
```

#### Node Version Management

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

Optional environment variables:
- `NEXT_PUBLIC_APP_URL`: Public URL of your application
- `PORT`: Port number (default: 3000)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub.

## Initial Setup

### Quick Start

1. **Clone the repository**:
   ```
   git clone https://github.com/yourusername/PickleBallApp.git
   cd PickleBallApp
   ```

2. **Copy environment example file**:
   ```
   # On Windows
   copy .env.example .env
   
   # On Ubuntu
   cp .env.example .env
   ```

3. **Update your .env file** with your database credentials and secret keys.

4. **Run the setup script**:
   ```
   # On Windows
   .\setup.bat
   
   # On Ubuntu
   chmod +x setup.sh
   ./setup.sh
   ```

5. **Start the development server**:
   ```
   # On Windows
   .\start-dev.bat
   
   # On Ubuntu
   ./start-dev.sh
   ```

### Default Admin Account

After running the setup script, you can access the admin dashboard with:

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **SECURITY WARNING**: Change the admin password immediately after your first login.

To change the admin password:
1. Login with the default credentials
2. Navigate to your profile settings
3. Update your password with a strong, unique alternative

## Security Considerations

### Sensitive Files

This repository contains several sensitive files that should not be committed to version control:

1. **Environment Files**:
   - `.env` - Contains database credentials and secret keys
   - `.env.local`, `.env.development`, `.env.production` - Environment-specific configs

2. **Sensitive Source Files**:
   - `src/lib/env.ts` - Contains fallback credentials and secrets
   - `src/lib/init-admin.ts` - Contains admin initialization logic

For each of these files, we provide an example template (`.example` extension) that you should copy and modify with your actual values.

### Before Pushing to Git

Before pushing your code to a git repository:

1. **Verify Sensitive Files Are Ignored**:
   ```bash
   git status
   ```
   Ensure sensitive files are not listed as tracked or staged.

2. **If Sensitive Files Are Already Tracked**:
   ```bash
   git rm --cached .env
   git rm --cached src/lib/env.ts
   git rm --cached src/lib/init-admin.ts
   ```

3. **Verify Your .gitignore**:
   The repository includes a comprehensive `.gitignore` file that should prevent sensitive files from being committed.

## Database Setup

### PostgreSQL Setup

The application uses PostgreSQL as its database. You'll need to:

1. **Install PostgreSQL** if not already installed:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Ubuntu: `sudo apt install postgresql postgresql-contrib`

2. **Create databases**:
   ```sql
   CREATE DATABASE pickleball;
   CREATE DATABASE pickleball_shadow;  -- Optional: For Prisma migrations
   ```

3. **Create a user and grant permissions**:
   ```sql
   CREATE USER youruser WITH PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE pickleball TO youruser;
   GRANT ALL PRIVILEGES ON DATABASE pickleball_shadow TO youruser;
   ```

4. **Grant schema permissions**:
   ```sql
   \c pickleball
   GRANT ALL ON SCHEMA public TO youruser;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO youruser;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO youruser;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO youruser;
   
   \c pickleball_shadow
   GRANT ALL ON SCHEMA public TO youruser;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO youruser;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO youruser;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO youruser;
   ```

5. **Update your .env file**:
   ```
   DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/pickleball?schema=public
   ```

### Prisma Migrations

When running migrations with `npx prisma migrate dev`, Prisma needs permission to create a shadow database. You have two options:

1. **Grant CREATEDB permission to your user** (recommended):
   ```sql
   ALTER USER youruser WITH CREATEDB;
   ```

2. **Use a pre-created shadow database**:
   - Add this to your `prisma/schema.prisma` file:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
       shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
     }
     ```
   - Add this to your `.env` file:
     ```
     SHADOW_DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/pickleball_shadow?schema=public
     ```

If you encounter permission errors, ensure your database user has sufficient privileges.

# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/databasename?schema=public
DIRECT_URL=postgresql://username:password@localhost:5432/databasename?schema=public
# Optional: For Prisma migrations, used as a shadow database
# SHADOW_DATABASE_URL=postgresql://username:password@localhost:5432/databasename_shadow?schema=public

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_URL=http://localhost:3000

# Admin Account
DEFAULT_ADMIN_PASSWORD=admin123

# Optional Settings
# PORT=3000
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Social Login (if implemented)
# GITHUB_ID=""
# GITHUB_SECRET=""
# GOOGLE_ID=""
# GOOGLE_SECRET=""

// Ensure environment variables are available
// This is a workaround for the issue where Next.js doesn't consistently load .env files

// Database connection
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const DIRECT_URL = process.env.DIRECT_URL || '';

// Auth secrets
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';
export const JWT_SECRET = process.env.JWT_SECRET || '';

// Make sure all environment variables are available if not set
if (!process.env.DATABASE_URL && DATABASE_URL) {
  process.env.DATABASE_URL = DATABASE_URL;
}

if (!process.env.DIRECT_URL && DIRECT_URL) {
  process.env.DIRECT_URL = DIRECT_URL;
}

if (!process.env.NEXTAUTH_SECRET && NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = NEXTAUTH_SECRET;
}

if (!process.env.JWT_SECRET && JWT_SECRET) {
  process.env.JWT_SECRET = JWT_SECRET;
}

// Export a function to load environment variables
export function loadEnv() {
  return {
    DATABASE_URL,
    DIRECT_URL,
    NEXTAUTH_SECRET,
    JWT_SECRET
  };
}

// Auto-load environment variables
loadEnv(); 