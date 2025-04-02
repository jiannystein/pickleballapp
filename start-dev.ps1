# PickleBall App Development Server Starter
# This script properly handles PowerShell syntax for starting the Next.js server

# Change to the project directory
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"

# Set environment variables and start the development server
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
Write-Host "Starting Next.js development server..." -ForegroundColor Green
npx next dev 