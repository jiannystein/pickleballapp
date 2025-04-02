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

## PowerShell Scripts for Easy Setup

We provide PowerShell scripts for easy setup and management:

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

To use these scripts:

1. Ensure PowerShell execution policy allows running scripts:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

2. Run any script by right-clicking it and selecting "Run with PowerShell" or by typing:
   ```powershell
   .\script-name.ps1
   ```

## Quick Start (Windows)

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

### PowerShell Execution Issues

If you encounter an error about script execution:
```
...cannot be loaded because running scripts is disabled on this system...
```

Run this command in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Port Already in Use

If port 3000 is already in use, the application will try to use port 3001. You can manually specify a port:
```powershell
$env:PORT=3002; .\start-dev.ps1
```

### Database Connection Issues

If you encounter database connection issues:
1. Check that PostgreSQL is running
2. Verify your `.env` file contains the correct connection string
3. Try running `.\prisma-push.ps1` to ensure the schema is properly pushed

### Path Casing Issues

If you encounter warnings about casing in file paths, ensure your project folder uses consistent casing. See `migration-guide.md` for detailed instructions.

## Ubuntu Setup

1. **Update system packages**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js and npm**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install PostgreSQL**:
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

4. **Configure PostgreSQL**:
   ```bash
   sudo -u postgres psql
   ```
   
   Inside the PostgreSQL shell:
   ```sql
   CREATE USER youruser WITH PASSWORD 'yourpassword';
   CREATE DATABASE pickleball;
   GRANT ALL PRIVILEGES ON DATABASE pickleball TO youruser;
   \q
   ```

5. **Clone and setup the application**:
   ```bash
   git clone https://github.com/yourusername/PickleBallApp.git
   cd PickleBallApp
   npm install
   ```

6. **Set up environment variables**:
   ```bash
   cat > .env << EOL
   DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/pickleball?schema=public"
   NEXTAUTH_SECRET="your-nextauth-secret"
   JWT_SECRET="your-jwt-secret"
   NEXTAUTH_URL="http://localhost:3000"
   EOL
   ```

7. **Initialize the database**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

8. **Create a start script** (optional):
   Create a file named `start-dev.sh` in the project root:
   ```bash
   #!/bin/bash
   echo "Starting PickleBall App development server..."
   npm run dev
   ```
   
   Make it executable:
   ```bash
   chmod +x start-dev.sh
   ```

9. **Start the development server**:
   ```bash
   ./start-dev.sh
   ```
   
   Or run directly:
   ```bash
   npm run dev
   ```

10. **Access the application** at [http://localhost:3000](http://localhost:3000)

## Exposing Local Development with Cloudflare Tunnel

You can expose your local development environment to the internet using Cloudflare Tunnel:

1. **Sign up for a Cloudflare account** at [cloudflare.com](https://cloudflare.com)

2. **Install cloudflared**:
   - Windows: Download from [Cloudflare's website](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
   - Ubuntu:
     ```bash
     curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
     sudo dpkg -i cloudflared.deb
     ```

3. **Log in to Cloudflare**:
   ```bash
   cloudflared tunnel login
   ```

4. **Create a tunnel**:
   ```bash
   cloudflared tunnel create pickleball-app
   ```

5. **Configure the tunnel** by creating a `config.yml` file:
   ```yaml
   tunnel: <YOUR-TUNNEL-ID>
   credentials-file: <PATH-TO-CREDENTIALS-JSON>
   
   ingress:
     - hostname: pickleball-app.yourdomain.com
       service: http://localhost:3000
     - service: http_status:404
   ```

6. **Route traffic to your tunnel**:
   ```bash
   cloudflared tunnel route dns pickleball-app pickleball-app.yourdomain.com
   ```

7. **Start the tunnel**:
   ```bash
   cloudflared tunnel run pickleball-app
   ```

Your local development server will now be accessible at `https://pickleball-app.yourdomain.com`.

## Production Deployment

### Self-Hosting on Ubuntu Server

1. **Update system packages**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js and npm**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install PostgreSQL**:
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

4. **Configure PostgreSQL**:
   ```bash
   sudo -u postgres createuser -P youruser
   sudo -u postgres createdb -O youruser pickleball
   ```

5. **Clone and setup the application**:
   ```bash
   git clone https://github.com/yourusername/PickleBallApp.git
   cd PickleBallApp
   npm install
   ```

6. **Set up environment variables**:
   ```bash
   nano .env
   # Add your environment variables similar to the local setup
   ```

7. **Initialize the database**:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

8. **Build and start the application**:
   ```bash
   npm run build
   npm start
   ```

9. **Set up Nginx as reverse proxy**:
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/pickleballapp
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

10. **Enable the site and restart Nginx**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/pickleballapp /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Set up SSL with Let's Encrypt**:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your_domain.com
    ```

12. **Set up process manager (PM2)**:
    ```bash
    sudo npm install -g pm2
    pm2 start npm --name "pickleballapp" -- start
    pm2 startup
    pm2 save
    ```

### Self-Hosting on Windows Server

1. **Install Node.js**:
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Recommended: Use Node.js 18.x LTS version

2. **Install PostgreSQL**:
   - Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

3. **Install IIS**:
   - Enable IIS from Windows Features
   - Install URL Rewrite Module

4. **Clone and setup the application**:
   ```
   git clone https://github.com/yourusername/PickleBallApp.git
   cd PickleBallApp
   npm install
   ```

5. **Set up environment variables**:
   - Create a `.env` file as in the local setup

6. **Initialize the database**:
   ```
   npx prisma migrate deploy
   npx prisma db seed
   ```

7. **Build the application**:
   ```
   npm run build
   ```

8. **Create a startup script** (required for Windows):
   Create `start-prod.bat`:
   ```bat
   @echo off
   echo Starting PickleBall App production server...
   cd /d %~dp0
   npm start
   pause
   ```

9. **Install and configure iisnode**:
   - Follow the instructions at [iisnode.net](https://github.com/Azure/iisnode)
   - Create a web.config file for IIS integration

10. **Set up process manager (PM2)**:
    ```
    npm install -g pm2-windows-startup
    npm install -g pm2
    pm2-startup install
    pm2 start npm --name "pickleballapp" -- start
    pm2 save
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