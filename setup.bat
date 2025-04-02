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
echo [1/5] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies.
    exit /b 1
)

:: Generate Prisma client
echo [2/5] Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to generate Prisma client.
    exit /b 1
)

:: Push schema to database
echo [3/5] Setting up database schema...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to push database schema.
    echo Make sure your DATABASE_URL in .env is correct and the database is accessible.
    exit /b 1
)

:: Seed the database
echo [4/5] Seeding database with initial data...
call npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to seed the database.
    exit /b 1
)

:: Create start scripts
echo [5/5] Creating development starter script...
echo @echo off > start-dev.bat
echo echo Starting PickleBall App development server... >> start-dev.bat
echo cd /d %%~dp0 >> start-dev.bat
echo npm run dev >> start-dev.bat
echo pause >> start-dev.bat

:: Make the start script executable
attrib +x start-dev.bat

echo ===================================================
echo Setup complete! Your environment is ready.
echo ===================================================
echo.
echo Default admin credentials:
echo Email: admin@example.com
echo Password: admin123
echo.
echo IMPORTANT: Please change the admin password immediately after first login!
echo.
echo To start the development server, run:
echo   .\start-dev.bat
echo.
echo To manually start the server:
echo   npm run dev
echo ===================================================

pause 