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

4. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

5. **Start the development server**:
   ```bash
   ./start-dev.sh
   ```

6. **Access the application** at [http://localhost:3000](http://localhost:3000)

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