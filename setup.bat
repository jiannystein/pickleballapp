@echo off
echo ===================================================
echo PickleBall App Setup Script
echo ===================================================

:: Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found.
    echo Please create a .env file based on .env.example
    exit /b 1
)

echo Setting up your PickleBall development environment...

:: Install dependencies
echo [1/6] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies.
    exit /b 1
)

:: Generate Prisma client
echo [2/6] Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to generate Prisma client.
    exit /b 1
)

:: Create database if it doesn't exist
echo [3/6] Creating database (if needed)...
call node create-db.js
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to create database.
    echo Make sure PostgreSQL is running and your DATABASE_URL in .env is correct.
    exit /b 1
)

:: Push schema to database
echo [4/6] Setting up database schema...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to push database schema.
    exit /b 1
)

:: Seed the database
echo [5/6] Seeding database with initial data...
call npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to seed the database.
    exit /b 1
)

:: Initialize reviews
echo [6/6] Initializing reviews...
call node src/scripts/initialize-reviews.js

echo ===================================================
echo Setup complete! Your environment is ready.
echo ===================================================
echo.
echo Default admin credentials:
echo   Email: admin@example.com
echo   Password: admin123
echo.
echo IMPORTANT: Please change the admin password immediately after first login!
echo.
echo To start the development server, run:
echo   npm run dev
echo   OR
echo   pm2 start ecosystem.config.js
echo ===================================================

pause
