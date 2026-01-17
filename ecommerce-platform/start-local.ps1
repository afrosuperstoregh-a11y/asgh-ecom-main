# Start ASCA E-Commerce Platform Locally
Write-Host "Starting ASCA E-Commerce Platform..." -ForegroundColor Green

# Start API Server
Write-Host "Starting API Server on port 3001..." -ForegroundColor Yellow
Set-Location api
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait for API to start
Start-Sleep 5

# Start Frontend
Write-Host "Starting Frontend on port 3000..." -ForegroundColor Yellow
Set-Location ../frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "`n🚀 ASCA E-Commerce Platform is starting!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor White
