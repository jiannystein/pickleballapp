# Script Cleanup Guide

This guide will help you standardize your project scripts using PowerShell to avoid command syntax issues and improve maintainability.

## Current Scripts

Your project currently has these batch scripts:
- initialize-reviews.bat
- prisma-push.bat
- reset-db.bat
- seed-db.bat
- setup.bat

## Standardizing on PowerShell

We've already created `start-dev.ps1`. Let's create equivalent PowerShell scripts for the other functionalities:

### 1. initialize-reviews.ps1

```powershell
# PickleBall App Reviews Initializer
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"
Write-Host "Initializing reviews..." -ForegroundColor Green
node src/scripts/initialize-reviews.js
```

### 2. prisma-push.ps1

```powershell
# PickleBall App Prisma Schema Push
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"
Write-Host "Pushing Prisma schema to database..." -ForegroundColor Green
npx prisma db push
```

### 3. reset-db.ps1

```powershell
# PickleBall App Database Reset
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"
Write-Host "Resetting database..." -ForegroundColor Green
npx prisma migrate reset --force
```

### 4. seed-db.ps1

```powershell
# PickleBall App Database Seeder
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"
Write-Host "Seeding database..." -ForegroundColor Green
npx prisma db seed
```

### 5. setup.ps1

```powershell
# PickleBall App Setup
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"
Write-Host "Setting up PickleBall App..." -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# Push schema to database
Write-Host "Pushing schema to database..." -ForegroundColor Cyan
npx prisma db push

# Seed the database
Write-Host "Seeding database..." -ForegroundColor Cyan
npx prisma db seed

# Initialize reviews
Write-Host "Initializing reviews..." -ForegroundColor Cyan
node src/scripts/initialize-reviews.js

Write-Host "Setup complete! You can now run .\start-dev.ps1 to start the development server." -ForegroundColor Green
```

## Steps to Clean Up

1. Create the PowerShell scripts listed above
2. Test each script to ensure it works correctly
3. Remove the existing .bat files:

```powershell
# Remove old batch files
Remove-Item -Path "initialize-reviews.bat"
Remove-Item -Path "prisma-push.bat"
Remove-Item -Path "reset-db.bat"
Remove-Item -Path "seed-db.bat"
Remove-Item -Path "setup.bat"
```

4. Update README.md to reference the new PowerShell scripts instead of batch files

## Usage

After creating these scripts, run them using:

```
.\script-name.ps1
```

For example:
```
.\start-dev.ps1
```

## PowerShell Execution Policy

If you encounter an error related to execution policy, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
``` 