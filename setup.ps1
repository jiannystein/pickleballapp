# PickleBall App Setup
Set-Location $PSScriptRoot
Write-Host "Setting up PickleBall App..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found." -ForegroundColor Red
    Write-Host "Please create a .env file based on .env.example" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "[1/6] Installing dependencies..." -ForegroundColor Cyan
npm install

# Generate Prisma client
Write-Host "[2/6] Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

# Create database if it doesn't exist
Write-Host "[3/6] Creating database (if needed)..." -ForegroundColor Cyan
node create-db.js

# Push schema to database
Write-Host "[4/6] Pushing schema to database..." -ForegroundColor Cyan
npx prisma db push

# Seed the database
Write-Host "[5/6] Seeding database..." -ForegroundColor Cyan
npx prisma db seed

# Initialize reviews
Write-Host "[6/6] Initializing reviews..." -ForegroundColor Cyan
node src/scripts/initialize-reviews.js

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Default admin credentials:" -ForegroundColor Cyan
Write-Host "  Email: admin@example.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Change the admin password immediately after first login!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Cyan
Write-Host "  .\start-dev.ps1" -ForegroundColor White
Write-Host "  OR" -ForegroundColor White
Write-Host "  pm2 start ecosystem.config.js" -ForegroundColor White
