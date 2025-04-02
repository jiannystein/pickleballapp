@echo off
echo Setting environment variables...
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public
set DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public

echo Running review initialization script...
node src/scripts/initialize-reviews.js

echo Done!
pause 