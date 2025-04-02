# Cleanup script to remove redundant batch files
Write-Host "Removing redundant .bat files..." -ForegroundColor Yellow

# List of batch files to remove
$batchFiles = @(
    "initialize-reviews.bat",
    "prisma-push.bat",
    "reset-db.bat",
    "seed-db.bat",
    "setup.bat"
)

# Remove each file
foreach ($file in $batchFiles) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "Not found: $file" -ForegroundColor Cyan
    }
}

Write-Host "`nCleanup complete! The redundant batch files have been removed." -ForegroundColor Green
Write-Host "Please use the new PowerShell scripts instead:" -ForegroundColor Yellow
Write-Host "  - setup.ps1" -ForegroundColor White
Write-Host "  - start-dev.ps1" -ForegroundColor White
Write-Host "  - prisma-push.ps1" -ForegroundColor White
Write-Host "  - seed-db.ps1" -ForegroundColor White
Write-Host "  - reset-db.ps1" -ForegroundColor White
Write-Host "  - initialize-reviews.ps1" -ForegroundColor White 