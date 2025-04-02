# PickleBall App Database Reset
Set-Location "C:\Users\J\Documents\GitHub\pickleballapp"
Write-Host "Resetting database..." -ForegroundColor Green
npx prisma migrate reset --force 