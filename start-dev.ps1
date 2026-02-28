# PickleBall App Development Server Starter
Set-Location $PSScriptRoot

# Stop PM2 managed instances if running (PM2 auto-restarts and holds the port)
$pm2Path = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Path) {
    try {
        $pm2Raw = pm2 jlist 2>$null
        if ($pm2Raw -and $pm2Raw -match '^\[') {
            Write-Host "Stopping PM2 managed processes..." -ForegroundColor Yellow
            pm2 stop all 2>$null | Out-Null
            pm2 kill 2>$null | Out-Null
        }
    } catch { }
}

# Kill any existing processes on port 3000 (including child processes)
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    $procIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -ne 0 }
    foreach ($procId in $procIds) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Killing process tree on port 3000: $($proc.ProcessName) (PID: $procId)" -ForegroundColor Yellow
            taskkill /PID $procId /T /F 2>$null | Out-Null
        }
    }
    # Wait for port to fully release (ignore TimeWait sockets - those are harmless)
    Write-Host "Waiting for port 3000 to be released..." -ForegroundColor Yellow
    $timeout = 15
    while ($timeout -gt 0) {
        Start-Sleep -Seconds 1
        $still = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
            Where-Object { $_.OwningProcess -ne 0 -and $_.State -ne 'TimeWait' }
        if (-not $still) { break }
        $timeout--
    }
    if ($timeout -eq 0) {
        Write-Host "Error: Port 3000 is still in use. Please close it manually and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "Port 3000 is free." -ForegroundColor Green
}

Write-Host "Starting Next.js development server on port 3000..." -ForegroundColor Green
node node_modules/next/dist/bin/next dev -p 3000
