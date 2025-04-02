# Migration Guide: Fixing Path Casing Issues

This guide will help you migrate your project from `PickleBallApp` to `pickleballapp` to resolve casing inconsistency issues that are causing Next.js warnings.

## Step 1: Backup Your Project

```powershell
# Create a backup
Copy-Item -Path "C:\Users\J\Documents\GitHub\PickleBallApp" -Destination "C:\Users\J\Documents\GitHub\PickleBallApp_backup" -Recurse
```

## Step 2: Copy Files to Lowercase Directory

```powershell
# Remove existing lowercase directory if it exists
Remove-Item -Path "C:\Users\J\Documents\GitHub\pickleballapp" -Recurse -Force -ErrorAction SilentlyContinue

# Create new lowercase directory
New-Item -ItemType Directory -Path "C:\Users\J\Documents\GitHub\pickleballapp"

# Copy all files except node_modules and .git
Get-ChildItem -Path "C:\Users\J\Documents\GitHub\PickleBallApp" -Exclude "node_modules",".git",".next" | 
  Copy-Item -Destination "C:\Users\J\Documents\GitHub\pickleballapp" -Recurse
```

## Step 3: Setup Git in New Directory

```powershell
# Navigate to new directory
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"

# Initialize git
git init

# Add remote repository
git remote add origin https://github.com/jiannystein/pickleballapp.git

# Pull latest changes
git pull origin master

# Add all files
git add .

# Commit changes
git commit -m "Fix path casing by moving to lowercase directory"
```

## Step 4: Install Dependencies

```powershell
# Install dependencies
npm install
```

## Step 5: Use Your New Scripts

```powershell
# Run the development server using the new script
.\start-dev.ps1
```

## Additional Steps

1. Update any CI/CD configurations that might reference the old path
2. Update any absolute path references in your codebase
3. If your IDE has project-specific settings, update those as well

## Troubleshooting

If you encounter any issues:
- Ensure the new directory has all needed files and configurations
- Check for any hardcoded paths in your codebase
- Verify .env files were copied correctly (they may be hidden files) 