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