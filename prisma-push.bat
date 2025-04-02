@echo off
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public
npx prisma db push --accept-data-loss
pause 