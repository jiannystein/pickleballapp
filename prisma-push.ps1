# PickleBall App Prisma Schema Push
Set-Location $PSScriptRoot
Write-Host "Pushing Prisma schema to database..." -ForegroundColor Green
npx prisma db push
