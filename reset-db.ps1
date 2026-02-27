# PickleBall App Database Reset
Set-Location $PSScriptRoot

Write-Host "WARNING: This will reset your database and delete ALL data!" -ForegroundColor Red
$confirm = Read-Host "Press Enter to continue or Ctrl+C to cancel"

Write-Host "Resetting database..." -ForegroundColor Green
npx prisma migrate reset --force
