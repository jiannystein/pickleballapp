# PickleBall App Prerequisites Installer for Windows
Write-Host "PickleBall App Prerequisites Installer" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Warning: Some operations may require administrator privileges." -ForegroundColor Yellow
    Write-Host "Consider running this script as Administrator if you encounter permission issues." -ForegroundColor Yellow
    Write-Host
}

# Set PowerShell execution policy
Write-Host "Setting PowerShell execution policy..." -ForegroundColor Cyan
try {
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
    Write-Host "Execution policy set to RemoteSigned for current user." -ForegroundColor Green
} catch {
    Write-Host "Failed to set execution policy. You may need to run as Administrator." -ForegroundColor Red
}

# Check for Node.js
Write-Host "Checking for Node.js..." -ForegroundColor Cyan
$nodeVersion = $null
try {
    $nodeVersion = node --version
    Write-Host "Node.js $nodeVersion is installed." -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "Please download and install Node.js (LTS version) from https://nodejs.org/" -ForegroundColor Yellow
    Start-Process "https://nodejs.org/en/download/"
}

# Check for npm
if ($null -ne $nodeVersion) {
    Write-Host "Checking for npm..." -ForegroundColor Cyan
    try {
        $npmVersion = npm --version
        Write-Host "npm $npmVersion is installed." -ForegroundColor Green
    } catch {
        Write-Host "npm is not installed properly." -ForegroundColor Red
    }
}

# Check for PostgreSQL
Write-Host "Checking for PostgreSQL..." -ForegroundColor Cyan
try {
    $psqlExists = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlExists) {
        Write-Host "PostgreSQL is installed." -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL is not installed or not in PATH." -ForegroundColor Yellow
        Write-Host "Please download and install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        Start-Process "https://www.postgresql.org/download/windows/"
    }
} catch {
    Write-Host "PostgreSQL is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "Please download and install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Start-Process "https://www.postgresql.org/download/windows/"
}

# Create .env file if it doesn't exist
Write-Host "Checking for .env file..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Creating template..." -ForegroundColor Yellow
    @"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret"
JWT_SECRET="your-jwt-secret"
NEXTAUTH_URL="http://localhost:3000"
DEFAULT_ADMIN_PASSWORD="admin123"
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host ".env template created. Please update with your database credentials." -ForegroundColor Green
} else {
    Write-Host ".env file already exists." -ForegroundColor Green
}

Write-Host
Write-Host "Prerequisites check complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update the .env file with your database credentials" -ForegroundColor White
Write-Host "2. Run .\setup.ps1 to set up the application" -ForegroundColor White
Write-Host "3. Run .\start-dev.ps1 to start the development server" -ForegroundColor White 