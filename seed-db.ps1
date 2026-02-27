# PickleBall App Database Seeder
Set-Location $PSScriptRoot
Write-Host "Seeding database..." -ForegroundColor Green
npx prisma db seed
